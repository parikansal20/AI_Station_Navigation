import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directory for the analyzer module
BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    APP_NAME: str = "AI Crowd Analyzer 3D"
    DEBUG: bool = True

    # Subdirectories within the analyzer3d folder
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MODEL_DIR: Path = Path(__file__).resolve().parents[4] / "models" # Point to the main models folder of ml-service
    LOG_DIR: Path = BASE_DIR / "logs"
    DB_PATH: Path = BASE_DIR / "database" / "crowd_analyzer.db"

    # YOLO settings
    YOLO_MODEL_NAME: str = "yolov8n.pt"
    YOLO_CONFIDENCE: float = 0.4
    YOLO_DEVICE: str = "cpu"
    PERSON_CLASS_ID: int = 0  # COCO class for "person"

    # Analytics settings
    DEFAULT_THRESHOLD: int = 50
    FRAME_SKIP: int = 2  # Skip frames to save CPU cycles
    STREAM_JPEG_QUALITY: int = 70
    DEFAULT_WEBCAM_INDEX: int = 0

settings = Settings()

# Ensure directories exist
for d in (settings.UPLOAD_DIR, settings.MODEL_DIR, settings.LOG_DIR, settings.DB_PATH.parent):
    os.makedirs(d, exist_ok=True)
