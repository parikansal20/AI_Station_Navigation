from datetime import datetime
from pydantic import BaseModel

class ThresholdUpdate(BaseModel):
    crowd_limit: int

class ThresholdOut(BaseModel):
    crowd_limit: int
    updated_at: datetime
    class Config:
        from_attributes = True

class AlertOut(BaseModel):
    id: int
    timestamp: datetime
    crowd_count: int
    threshold: int
    class Config:
        from_attributes = True

class CrowdCountOut(BaseModel):
    current_count: int
    threshold: int
    is_overcrowded: bool
    timestamp: datetime

class SystemStatusOut(BaseModel):
    status: str  # "normal" | "warning" | "idle"
    source_active: bool
    source_type: str | None
    current_count: int
    threshold: int
    last_alert_at: datetime | None
