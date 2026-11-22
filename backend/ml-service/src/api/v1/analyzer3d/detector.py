import threading
import cv2
import numpy as np
from ultralytics import YOLO
import structlog
from .config import settings

logger = structlog.get_logger(__name__)

class PersonDetector:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        weight_path = settings.MODEL_DIR / settings.YOLO_MODEL_NAME
        logger.info("Loading YOLO model for 3D Video Analyzer", model=settings.YOLO_MODEL_NAME, path=str(weight_path))
        self.model = YOLO(str(weight_path) if weight_path.exists() else settings.YOLO_MODEL_NAME)
        self.model.to(settings.YOLO_DEVICE)
        logger.info("YOLO model loaded successfully in 3D Video Analyzer.")

    def detect(self, frame: np.ndarray):
        results = self.model.predict(
            frame,
            classes=[settings.PERSON_CLASS_ID],
            conf=settings.YOLO_CONFIDENCE,
            verbose=False,
        )

        result = results[0]
        boxes = result.boxes
        count = len(boxes)
        confidences = [float(b.conf[0]) for b in boxes] if count else []

        annotated_frame = frame.copy()
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 200, 0), 2)
            label = f"person {conf:.2f}"
            cv2.putText(
                annotated_frame, label, (x1, max(y1 - 8, 0)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 0), 1, cv2.LINE_AA,
            )

        # Overlay running count
        cv2.putText(
            annotated_frame, f"Count: {count}", (15, 35),
            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA,
        )

        return annotated_frame, count, confidences

def get_detector() -> PersonDetector:
    return PersonDetector()
