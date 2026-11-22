import json
import structlog
from typing import Optional, Tuple
from io import BytesIO
from PIL import Image
import numpy as np
import cv2

from ..ml.crowd_counting.csrnet.inference import CSRNetInference
from ..core.redis import redis_manager
from ..core.config import settings
from ..models.crowd import CrowdAnalyzeResponse, CrowdStatusResponse, VideoFrameAnalyzeResponse, VideoFileAnalyzeResponse
from .video_crowd_service import VideoCrowdProcessor


logger = structlog.get_logger(__name__)

class CrowdService:
    """
    Business logic layer for crowd analysis.
    Wraps the CSRNet inference model, adds caching, and maps to Pydantic schemas.
    """
    def __init__(self):
        # Initialize models once
        self.model = CSRNetInference()
        from ..ml.crowd_counting.hybrid_detector import HybridCrowdDetector
        self.hybrid_detector = HybridCrowdDetector()
        self.video_processor = VideoCrowdProcessor(model=self.model)

    def _get_advice_and_summary(self, density_level: str, location_id: Optional[str]) -> Tuple[str, str]:
        loc_str = location_id.title() if location_id else "the area"
        
        if density_level == "High":
            summary = f"Heavy crowd at {loc_str}"
            advice = "Please allow extra time for boarding and mind your belongings."
        elif density_level == "Medium":
            summary = f"Moderate crowd at {loc_str}"
            advice = "Proceed normally, but expect some wait times."
        else:
            summary = f"Low crowd at {loc_str}"
            advice = "Quick and easy access. Have a safe journey!"
            
        return summary, advice

    def _calculate_confidence(self, count: float) -> float:
        if count < 1.0:
            return 0.95
        elif count > 150:
            return 0.85
        return 0.92

    async def analyze_image(self, image_bytes: bytes, location_id: Optional[str] = None, include_heatmap: bool = False) -> CrowdAnalyzeResponse:
        """
        Process the image, get predictions, generate recommendations, and cache the result.
        """
        try:
            # Convert bytes to PIL Image & BGR array
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
            img_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            
            # 1. CSRNet density map prediction
            prediction = self.model.predict(img, location_id=location_id)
            
            # 2. YOLOv8 / HOG person object detection
            det_count, det_mode = self.hybrid_detector.detect_person_count(img_bgr)
            
            # 3. Hybrid fusion ensemble (matches video pipeline & precision counting)
            if det_count > 0:
                final_count, _, _ = self.hybrid_detector.combine_predictions(prediction.estimated_count, det_count)
                final_count = round(final_count)
            else:
                final_count = round(prediction.estimated_count)
                
            density_level = self.model.get_density_level(final_count)
            summary, advice = self._get_advice_and_summary(density_level, location_id)
            confidence = self._calculate_confidence(final_count)
            heatmap = prediction.heatmap_base64 if include_heatmap else None
            
            response = CrowdAnalyzeResponse(
                location_id=location_id,
                estimated_count=final_count,
                density_level=density_level,
                confidence=confidence,
                summary=summary,
                advice=advice,
                heatmap_base64=heatmap,
                processing_time_ms=prediction.processing_time_ms,
                timestamp=prediction.timestamp
            )
            
            # Cache the result if location_id is provided
            if location_id:
                cache_key = f"crowd_status:{location_id}"
                # Model dump to JSON string with isoformat datetimes
                json_data = response.model_dump_json()
                await redis_manager.set(
                    cache_key, 
                    json_data, 
                    ex=settings.CROWD_CACHE_TTL_SECONDS
                )
                logger.info("Cached crowd analysis result", location_id=location_id)
                
            return response
            
        except Exception as e:
            logger.error("Error in crowd_service.analyze_image", error=str(e))
            raise e

    async def analyze_video_frame(
        self, 
        frame_bytes: bytes, 
        location_id: Optional[str] = "webcam",
        frame_skip: int = 3,
        include_heatmap: bool = False,
        motion_detection: bool = True
    ) -> VideoFrameAnalyzeResponse:
        """
        Analyze a single video frame from live stream or webcam using OpenCV & CSRNet.
        """
        try:
            nparr = np.frombuffer(frame_bytes, np.uint8)
            import cv2
            frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame_bgr is None:
                raise ValueError("Could not decode image frame")

            response = self.video_processor.process_frame(
                frame_bgr=frame_bgr,
                location_id=location_id,
                frame_skip=frame_skip,
                motion_detection=motion_detection,
                include_heatmap=include_heatmap
            )

            # Cache the real-time frame status for location polling
            if location_id:
                cache_key = f"crowd_status:{location_id}"
                cached_model = CrowdAnalyzeResponse(
                    location_id=location_id,
                    estimated_count=response.current_count,
                    density_level=response.density_level,
                    confidence=response.confidence,
                    summary=response.summary,
                    advice=response.advice,
                    heatmap_base64=response.heatmap_base64,
                    processing_time_ms=response.processing_time_ms,
                    timestamp=response.timestamp
                )
                await redis_manager.set(cache_key, cached_model.model_dump_json(), ex=15)

            return response
        except Exception as e:
            logger.error("Error in analyze_video_frame", error=str(e))
            raise e

    async def analyze_video_file(
        self, 
        video_bytes: bytes, 
        filename: str = "video.mp4",
        location_id: Optional[str] = "video-upload",
        frame_skip: int = 5,
        include_heatmap: bool = True
    ) -> VideoFileAnalyzeResponse:
        """
        Process full video file upload frame by frame.
        """
        try:
            return self.video_processor.process_video_file(
                video_bytes=video_bytes,
                filename=filename,
                location_id=location_id,
                frame_skip=frame_skip,
                include_heatmap=include_heatmap
            )
        except Exception as e:
            logger.error("Error in analyze_video_file", error=str(e))
            raise e

    async def get_latest_status(self, location_id: str) -> CrowdStatusResponse:
        """
        Retrieve the most recent analysis result from Redis cache.
        """
        cache_key = f"crowd_status:{location_id}"
        cached_data = await redis_manager.get(cache_key)
        
        if cached_data:
            try:
                # Parse JSON string back into Pydantic model
                data_dict = json.loads(cached_data)
                response_data = CrowdAnalyzeResponse(**data_dict)
                return CrowdStatusResponse(location_id=location_id, status="available", data=response_data)
            except Exception as e:
                logger.error("Failed to parse cached crowd data", error=str(e))
        
        return CrowdStatusResponse(location_id=location_id, status="not_found", data=None)

# Global instance
crowd_service = CrowdService()

