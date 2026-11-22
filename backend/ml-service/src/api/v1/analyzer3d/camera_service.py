import asyncio
import threading
import time
from datetime import datetime, timezone
import cv2
import structlog
from .config import settings
from .db import SessionLocal
from .detector import get_detector
from . import crowd_service
from .ws_manager import manager

logger = structlog.get_logger(__name__)

class VideoStreamManager:
    def __init__(self):
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._loop: asyncio.AbstractEventLoop | None = None

        self.is_running = False
        self.source_type: str | None = None
        self.source: str | int | None = None

        self.current_count = 0
        self.last_alert_at: datetime | None = None
        self.latest_jpeg: bytes | None = None

        self._frame_lock = threading.Lock()

    def bind_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    def start(self, source: str | int, source_type: str):
        if self.is_running:
            self.stop()

        self.source = source
        self.source_type = source_type
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()
        self.is_running = True
        logger.info("Stream started in 3D Analyzer", type=source_type, source=source)

    def stop(self):
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=5)
        self.is_running = False
        self.source = None
        self.source_type = None
        logger.info("Stream stopped in 3D Analyzer.")

    def get_latest_frame(self) -> bytes | None:
        with self._frame_lock:
            return self.latest_jpeg

    def _open_capture(self):
        if self.source_type == "webcam":
            return cv2.VideoCapture(int(self.source))
        return cv2.VideoCapture(str(self.source))

    def _capture_loop(self):
        detector = get_detector()
        cap = self._open_capture()

        if not cap.isOpened():
            logger.error("Failed to open video source in 3D Analyzer", source=self.source)
            self.is_running = False
            return

        frame_idx = 0
        db = SessionLocal()
        try:
            while not self._stop_event.is_set():
                ok, frame = cap.read()
                if not ok:
                    if self.source_type == "file":
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    logger.warning("Frame read failed; ending stream in 3D Analyzer.")
                    break

                frame_idx += 1
                if frame_idx % max(settings.FRAME_SKIP, 1) != 0:
                    continue

                annotated, count, confidences = detector.detect(frame)
                self.current_count = count

                is_overcrowded, threshold, alert_row = crowd_service.evaluate_and_alert(db, count)
                if alert_row:
                    self.last_alert_at = alert_row.timestamp

                ok, buf = cv2.imencode(
                    ".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, settings.STREAM_JPEG_QUALITY]
                )
                if ok:
                    with self._frame_lock:
                        self.latest_jpeg = buf.tobytes()

                self._broadcast_update(count, threshold, is_overcrowded, alert_row)
                time.sleep(0.02)
        finally:
            cap.release()
            db.close()
            self.is_running = False

    def _broadcast_update(self, count, threshold, is_overcrowded, alert_row):
        if self._loop is None:
            return

        message = {
            "type": "crowd_update",
            "current_count": count,
            "threshold": threshold,
            "is_overcrowded": is_overcrowded,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        asyncio.run_coroutine_threadsafe(manager.broadcast_json(message), self._loop)

        if alert_row:
            alert_message = {
                "type": "alert",
                "id": alert_row.id,
                "crowd_count": alert_row.crowd_count,
                "threshold": alert_row.threshold,
                "timestamp": alert_row.timestamp.isoformat(),
            }
            asyncio.run_coroutine_threadsafe(manager.broadcast_json(alert_message), self._loop)

        frame_bytes = self.get_latest_frame()
        if frame_bytes:
            asyncio.run_coroutine_threadsafe(manager.broadcast_bytes(frame_bytes), self._loop)

stream_manager = VideoStreamManager()
