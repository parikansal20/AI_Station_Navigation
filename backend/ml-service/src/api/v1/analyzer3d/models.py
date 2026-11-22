from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Float
from .db import Base

class Threshold(Base):
    __tablename__ = "threshold_3d"  # Unique table names to avoid collision

    id = Column(Integer, primary_key=True, index=True)
    crowd_limit = Column(Integer, nullable=False, default=50)
    updated_at = Column(DateTime, default=datetime.utcnow)

class AlertHistory(Base):
    __tablename__ = "alert_history_3d"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    crowd_count = Column(Integer, nullable=False)
    threshold = Column(Integer, nullable=False)

class CrowdLog(Base):
    __tablename__ = "crowd_log_3d"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    crowd_count = Column(Integer, nullable=False)
    avg_confidence = Column(Float, nullable=True)
