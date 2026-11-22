import time
import tempfile
import os
from collections import deque
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone
import numpy as np
import cv2
from PIL import Image
import structlog

from ..ml.crowd_counting.csrnet.inference import CSRNetInference
from ..ml.crowd_counting.hybrid_detector import HybridCrowdDetector
from ..models.crowd import VideoFrameAnalyzeResponse, VideoFileAnalyzeResponse

logger = structlog.get_logger(__name__)

class LocationStreamState:
    """
    Holds real-time state, 12-frame historical window, and previous frame for a location stream.
    """
    def __init__(self, history_size: int = 12):
        self.history: deque = deque(maxlen=history_size)
        self.raw_history: deque = deque(maxlen=history_size)
        self.prev_gray: Optional[np.ndarray] = None
        self.last_raw_count: float = 0.0
        self.last_yolo_count: float = 0.0
        self.last_csrnet_count: float = 0.0
        self.last_detector_mode: str = "YOLOv8"
        self.smoothed_count: float = 0.0
        self.last_heatmap_b64: Optional[str] = None
        self.frame_counter: int = 0
        self.last_timestamp: datetime = datetime.now(timezone.utc)

class VideoCrowdProcessor:
    """
    Real-time Video Crowd Processing Service for Indian Railway Station AI.
    Integrates Hybrid (CSRNet + YOLO/HOG) detector, OpenCV motion detection,
    12-frame Hampel Outlier Rejection, and Exponential Moving Average (EMA).
    """
    def __init__(self, model: CSRNetInference, history_size: int = 12, ema_alpha: float = 0.25):
        self.model = model
        self.hybrid_detector = HybridCrowdDetector()
        self.history_size = history_size
        self.ema_alpha = ema_alpha
        self.stream_states: Dict[str, LocationStreamState] = {}

    def _get_or_create_state(self, location_id: str) -> LocationStreamState:
        if location_id not in self.stream_states:
            self.stream_states[location_id] = LocationStreamState(history_size=self.history_size)
        return self.stream_states[location_id]

    def detect_motion(
        self, 
        state: LocationStreamState, 
        gray_frame: np.ndarray, 
        threshold: float = 0.005
    ) -> bool:
        """
        Calculates motion ratio using OpenCV frame absolute difference.
        Returns True if motion ratio exceeds the threshold.
        """
        if state.prev_gray is None or state.prev_gray.shape != gray_frame.shape:
            state.prev_gray = gray_frame
            return True

        # Compute absolute difference between consecutive frames
        frame_diff = cv2.absdiff(state.prev_gray, gray_frame)
        _, thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)
        motion_ratio = np.sum(thresh > 0) / float(thresh.size)

        state.prev_gray = gray_frame
        return bool(motion_ratio >= threshold)


    def _get_advice_and_summary(self, density_level: str, location_id: Optional[str]) -> Tuple[str, str]:
        loc_str = location_id.replace('-', ' ').title() if location_id else "the area"
        
        if density_level == "High":
            summary = f"Heavy crowd detected at {loc_str}"
            advice = "Please allow extra time for boarding, expect delays, and keep distance."
        elif density_level == "Medium":
            summary = f"Moderate crowd present at {loc_str}"
            advice = "Proceed normally to designated queues, but expect minor wait times."
        else:
            summary = f"Low crowd activity at {loc_str}"
            advice = "Quick and easy passenger movement. Safe travel!"
            
        return summary, advice

    def _calculate_confidence(self, count: float, motion_detected: bool) -> float:
        if not motion_detected:
            return 0.90
        if count < 1.0:
            return 0.96
        elif count > 150:
            return 0.88
        return 0.93

    def process_frame(
        self, 
        frame_bgr: np.ndarray, 
        location_id: Optional[str] = "default",
        frame_skip: int = 3,
        motion_detection: bool = True,
        include_heatmap: bool = False,
        motion_threshold: float = 0.005
    ) -> VideoFrameAnalyzeResponse:
        """
        Process a single BGR OpenCV frame from webcam or stream.
        Applies motion detection & frame skipping to achieve optimal FPS.
        """
        start_time = time.perf_counter()
        loc_id = location_id or "default"
        state = self._get_or_create_state(loc_id)
        state.frame_counter += 1

        # Downscale copy for fast motion detection
        small_frame = cv2.resize(frame_bgr, (320, 240))
        gray_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
        gray_frame = cv2.GaussianBlur(gray_frame, (5, 5), 0)

        motion_detected = True
        if motion_detection:
            motion_detected = self.detect_motion(state, gray_frame, threshold=motion_threshold)

        should_run_inference = (state.frame_counter % frame_skip == 0 or state.frame_counter == 1) and motion_detected

        if should_run_inference or state.last_raw_count == 0.0:
            # 1. CSRNet Density Map Model Prediction
            rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            
            prediction = self.model.predict(pil_img, location_id=loc_id)
            csrnet_count = prediction.estimated_count
            state.last_csrnet_count = csrnet_count
            if include_heatmap:
                state.last_heatmap_b64 = prediction.heatmap_base64
                
            # 2. Hybrid Person Detection (YOLOv8 / HOG)
            yolo_count, detector_mode = self.hybrid_detector.detect_person_count(frame_bgr)
            state.last_yolo_count = yolo_count
            state.last_detector_mode = detector_mode
            
            # 3. Dynamic Ensemble Fusion
            current_raw_count, _, _ = self.hybrid_detector.combine_predictions(csrnet_count, yolo_count)
            state.last_raw_count = current_raw_count
        else:
            # Reuse cached prediction with minor decay if static
            current_raw_count = state.last_raw_count
            if not motion_detected and current_raw_count > 0:
                current_raw_count = max(0.0, current_raw_count * 0.99)
                state.last_raw_count = current_raw_count

        # 4. Hampel Outlier Rejection Filter (Suppress sudden unrealistic single-frame spikes)
        filtered_count = current_raw_count
        if len(state.raw_history) >= 5:
            median_val = float(np.median(state.raw_history))
            mad = float(np.median([abs(x - median_val) for x in state.raw_history]))
            if mad > 0:
                diff = abs(current_raw_count - median_val)
                if diff > 2.0 * mad:
                    # Clamp spike to 2.0 * MAD range
                    filtered_count = median_val + np.sign(current_raw_count - median_val) * (2.0 * mad)

        state.raw_history.append(filtered_count)

        # 5. 12-Frame Exponential Moving Average (EMA) Temporal Smoothing
        if len(state.history) == 0:
            smoothed = filtered_count
        else:
            smoothed = (self.ema_alpha * filtered_count) + ((1.0 - self.ema_alpha) * state.smoothed_count)
        
        state.smoothed_count = round(smoothed, 2) if 0 < smoothed < 1.0 else round(smoothed, 1)
        state.history.append(state.smoothed_count)
        mean_val = float(np.mean(state.history))
        average_count = round(mean_val, 2) if 0 < mean_val < 1.0 else round(mean_val, 1)

        # Categorize density level based on smoothed count
        density_level = self.model.get_density_level(state.smoothed_count)
        summary, advice = self._get_advice_and_summary(density_level, loc_id)
        confidence = self._calculate_confidence(state.smoothed_count, motion_detected)
        
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.last_timestamp = datetime.now(timezone.utc)

        return VideoFrameAnalyzeResponse(
            current_count=state.smoothed_count,
            average_count=average_count,
            density_level=density_level,
            confidence=confidence,
            timestamp=state.last_timestamp,
            motion_detected=motion_detected,
            processing_time_ms=processing_time_ms,
            location_id=loc_id,
            summary=summary,
            advice=advice,
            heatmap_base64=state.last_heatmap_b64 if include_heatmap else None,
            yolo_count=state.last_yolo_count,
            csrnet_count=state.last_csrnet_count,
            detector_mode=state.last_detector_mode,
            is_hybrid_mode=True
        )

    def process_video_file(
        self, 
        video_bytes: bytes, 
        filename: str = "video.mp4",
        location_id: Optional[str] = "video-upload",
        frame_skip: int = 5,
        max_samples: int = 12,
        include_heatmap: bool = True
    ) -> VideoFileAnalyzeResponse:
        """
        Process an uploaded video file frame-by-frame using OpenCV VideoCapture.
        Returns aggregate analytics, peak crowd, running averages, and sample frames.
        """
        start_time = time.perf_counter()
        loc_id = location_id or "video-upload"
        
        # Save video bytes to temporary file for OpenCV
        suffix = os.path.splitext(filename)[1] or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_video:
            temp_video.write(video_bytes)
            temp_path = temp_video.name

        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise ValueError("Failed to open video file for processing.")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
        fps = float(cap.get(cv2.CAP_PROP_FPS)) or 15.0
        duration_seconds = round(total_frames / fps, 2)

        sample_frames: List[VideoFrameAnalyzeResponse] = []
        frame_counts: List[float] = []
        confidences: List[float] = []
        
        # Ensure we do not over-evaluate frames on CPU, cap total evaluated frames around max_samples (10-15 max)
        effective_skip = max(frame_skip, total_frames // max(1, max_samples))
        sample_interval = max(1, total_frames // max(1, max_samples))
        processed_frames_count = 0
        frame_idx = 0

        # Reset stream state for video upload
        self.stream_states[loc_id] = LocationStreamState(history_size=self.history_size)

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                frame_idx += 1
                if frame_idx % effective_skip == 0 or frame_idx == 1:
                    processed_frames_count += 1
                    is_sample_frame = (frame_idx % sample_interval == 0) or (frame_idx == 1) or (frame_idx == total_frames)
                    
                    frame_res = self.process_frame(
                        frame_bgr=frame,
                        location_id=loc_id,
                        frame_skip=1, # evaluate directly when selected
                        motion_detection=True,
                        include_heatmap=(include_heatmap and is_sample_frame)
                    )
                    
                    frame_counts.append(frame_res.current_count)
                    confidences.append(frame_res.confidence)

                    if is_sample_frame:
                        sample_frames.append(frame_res)

        finally:
            cap.release()
            if os.path.exists(temp_path):
                os.remove(temp_path)

        if not frame_counts:
            frame_counts = [0.0]
            confidences = [0.90]

        average_count = round(float(np.mean(frame_counts)), 1)
        peak_count = round(float(np.max(frame_counts)), 1)
        final_current_count = round(frame_counts[-1], 1)
        avg_confidence = round(float(np.mean(confidences)), 2)
        overall_density = self.model.get_density_level(average_count)

        logger.info(
            "Video file processing complete",
            filename=filename,
            total_frames=total_frames,
            processed_frames=processed_frames_count,
            avg_count=average_count,
            peak_count=peak_count,
            elapsed_ms=round((time.perf_counter() - start_time) * 1000, 2)
        )

        return VideoFileAnalyzeResponse(
            filename=filename,
            total_frames=total_frames,
            processed_frames=processed_frames_count,
            fps=round(fps, 1),
            duration_seconds=duration_seconds,
            current_count=final_current_count,
            average_count=average_count,
            peak_count=peak_count,
            density_level=overall_density,
            confidence=avg_confidence,
            timestamp=datetime.now(timezone.utc),
            sample_frames=sample_frames
        )
