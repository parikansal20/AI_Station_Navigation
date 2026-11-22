import structlog
import numpy as np
import cv2
from typing import Tuple, Optional
from PIL import Image

logger = structlog.get_logger(__name__)

class HybridCrowdDetector:
    """
    Hybrid Crowd Detection Engine for Indian Railway Station Scenes.
    Combines CSRNet CNN Density Estimation with Lightweight Person Detection
    (via Ultralytics YOLOv8 or OpenCV DNN/HOG Fallback).
    
    Strategy:
    - Low-to-Medium Density (< 35 people): Object detection (YOLO/HOG) provides high boundary precision.
    - Heavy Crowds (>= 35 people): Bounding boxes overlap heavily; CSRNet density estimation dominates.
    - Dynamic Weight Fusion: Smooth transition curve between detection count and density estimation.
    """
    def __init__(self):
        self.yolo_model = None
        self.hog = None
        self.cascade = None
        self.is_yolo_available = False
        self._init_detectors()

    def _init_detectors(self):
        # 1. Try importing ultralytics YOLO
        try:
            from ultralytics import YOLO
            # Use nano model for low latency
            self.yolo_model = YOLO("yolov8n.pt")
            self.is_yolo_available = True
            logger.info("YOLOv8 nano person detector initialized successfully for hybrid crowd analysis.")
        except Exception as e:
            logger.info(f"Ultralytics YOLOv8 not loaded ({e}). Falling back to OpenCV Person Detector.")
            self.is_yolo_available = False
            
            # 2. Try OpenCV HOG Descriptor if available
            HOGDescriptor = getattr(cv2, "HOGDescriptor", None)
            if HOGDescriptor is not None:
                try:
                    self.hog = HOGDescriptor()
                    fn = getattr(HOGDescriptor, "getDefaultPeopleDetector", getattr(cv2, "HOGDescriptor_getDefaultPeopleDetector", None))
                    if fn:
                        self.hog.setSVMDetector(fn())
                except Exception as err:
                    logger.warning(f"Failed to initialize HOGDescriptor: {err}")
                    self.hog = None
            
            # 3. Try CascadeClassifier as secondary fallback
            if self.hog is None:
                try:
                    cascade_file = getattr(cv2, "data", None)
                    if cascade_file and hasattr(cascade_file, "haarcascades"):
                        path = cv2.data.haarcascades + 'haarcascade_fullbody.xml'
                        self.cascade = cv2.CascadeClassifier(path)
                except Exception:
                    self.cascade = None

    def detect_person_count(self, img_bgr: np.ndarray) -> Tuple[float, str]:
        """
        Runs person detection on the input BGR image frame.
        Returns estimated person count and detector mode string.
        """
        try:
            if self.is_yolo_available and self.yolo_model is not None:
                # Run YOLOv8 person class (class 0) inference
                results = self.yolo_model(img_bgr, classes=[0], verbose=False, conf=0.25)
                if len(results) > 0 and results[0].boxes is not None:
                    boxes = results[0].boxes
                    count = float(len(boxes))
                    return count, "YOLOv8"
            
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            gray_clahe = clahe.apply(gray)
            
            # Fallback 1: OpenCV HOG Person Detector
            if self.hog is not None:
                boxes, weights = self.hog.detectMultiScale(
                    gray_clahe, 
                    winStride=(8, 8), 
                    padding=(4, 4), 
                    scale=1.05
                )
                count = float(len(boxes))
                return count, "OpenCV-HOG"
            
            # Fallback 2: Cascade Classifier
            if self.cascade is not None and not self.cascade.empty():
                bodies = self.cascade.detectMultiScale(gray_clahe, 1.1, 3)
                return float(len(bodies)), "OpenCV-Cascade"

            # Fallback 3: Edge Density Heuristic
            from .csrnet.utils import get_heuristic_person_count
            heuristic_val = get_heuristic_person_count(img_bgr)
            return heuristic_val, "Heuristic-CV"
        except Exception as e:
            logger.error(f"Person detection error in hybrid detector: {e}")
            return 0.0, "Fallback"

    def combine_predictions(
        self, 
        csrnet_count: float, 
        detector_count: float
    ) -> Tuple[float, float, float]:
        """
        Calculates dynamically weighted ensemble count.
        
        Returns:
            (final_hybrid_count, yolo_weight, csrnet_weight)
        """
        if csrnet_count >= 35.0:
            # High density: CSRNet density map is primary
            w_yolo = 0.10
        elif csrnet_count < 5.0:
            # Extremely sparse scene: Person detection provides high verification
            w_yolo = 0.70
        else:
            # Linear transition between 5 and 35
            w_yolo = 0.70 - (0.60 * ((csrnet_count - 5.0) / 30.0))
            
        w_yolo = max(0.05, min(0.85, w_yolo))
        w_csrnet = 1.0 - w_yolo
        
        hybrid_count = (w_yolo * detector_count) + (w_csrnet * csrnet_count)
        return hybrid_count, w_yolo, w_csrnet
