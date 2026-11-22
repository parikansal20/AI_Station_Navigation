from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import structlog
from .models import Threshold, AlertHistory, CrowdLog
from .config import settings

logger = structlog.get_logger(__name__)

ALERT_DEBOUNCE_SECONDS = 30

def get_active_threshold(db: Session) -> int:
    row = db.query(Threshold).order_by(Threshold.id.desc()).first()
    if row is None:
        row = Threshold(crowd_limit=settings.DEFAULT_THRESHOLD)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row.crowd_limit

def update_threshold(db: Session, crowd_limit: int) -> Threshold:
    row = Threshold(crowd_limit=crowd_limit)
    db.add(row)
    db.commit()
    db.refresh(row)
    logger.info("Threshold updated for 3D Video Analyzer", new_threshold=crowd_limit)
    return row

def _last_alert_time(db: Session) -> datetime | None:
    row = db.query(AlertHistory).order_by(AlertHistory.id.desc()).first()
    return row.timestamp if row else None

def record_frame(db: Session, count: int, avg_confidence: float | None = None):
    log = CrowdLog(crowd_count=count, avg_confidence=avg_confidence)
    db.add(log)
    db.commit()

def evaluate_and_alert(db: Session, count: int) -> tuple[bool, int, AlertHistory | None]:
    threshold = get_active_threshold(db)
    is_overcrowded = count > threshold

    alert_row = None
    if is_overcrowded:
        last_time = _last_alert_time(db)
        if not last_time or (datetime.utcnow() - last_time) > timedelta(seconds=ALERT_DEBOUNCE_SECONDS):
            alert_row = AlertHistory(crowd_count=count, threshold=threshold)
            db.add(alert_row)
            db.commit()
            db.refresh(alert_row)
            logger.warning("OVERCROWDING ALERT triggered in 3D Video Analyzer", count=count, threshold=threshold)

    return is_overcrowded, threshold, alert_row

def get_alert_history(db: Session, limit: int = 100):
    return (
        db.query(AlertHistory)
        .order_by(AlertHistory.timestamp.desc())
        .limit(limit)
        .all()
    )

def reset_alert_history(db: Session):
    db.query(AlertHistory).delete()
    db.commit()
    logger.info("Alert history reset in 3D Video Analyzer.")
