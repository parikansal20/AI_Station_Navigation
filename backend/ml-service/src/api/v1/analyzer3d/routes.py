import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .db import get_db
from . import crowd_service
from .camera_service import stream_manager
from .ws_manager import manager
from .schemas import ThresholdUpdate, ThresholdOut, AlertOut, CrowdCountOut, SystemStatusOut

router = APIRouter()

@router.post("/start-camera")
async def start_camera(payload: dict = Body(default={})):
    rtsp_url = payload.get("rtsp_url")
    if rtsp_url:
        stream_manager.start(source=rtsp_url, source_type="rtsp")
        return {"message": "RTSP stream started", "source": rtsp_url}

    webcam_index = payload.get("webcam_index", 0)
    stream_manager.start(source=webcam_index, source_type="webcam")
    return {"message": "Webcam started", "webcam_index": webcam_index}

@router.post("/stop-camera")
async def stop_camera():
    stream_manager.stop()
    return {"message": "Stream stopped"}

def _mjpeg_generator():
    boundary = b"--frame"
    while True:
        frame = stream_manager.get_latest_frame()
        if frame is not None:
            yield (
                boundary + b"\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )
        time.sleep(0.06)  # Matches approx 15 FPS

@router.get("/video-feed")
async def video_feed():
    if not stream_manager.is_running:
        # Fallback: start camera index 0 if not running when video feed is requested
        stream_manager.start(source=0, source_type="webcam")
    return StreamingResponse(
        _mjpeg_generator(), media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/system-status", response_model=SystemStatusOut)
async def system_status(db: Session = Depends(get_db)):
    threshold = crowd_service.get_active_threshold(db)
    count = stream_manager.current_count

    if not stream_manager.is_running:
        status = "idle"
    elif count > threshold:
        status = "warning"
    else:
        status = "normal"

    return SystemStatusOut(
        status=status,
        source_active=stream_manager.is_running,
        source_type=stream_manager.source_type,
        current_count=count,
        threshold=threshold,
        last_alert_at=stream_manager.last_alert_at,
    )

@router.get("/crowd-count", response_model=CrowdCountOut)
async def get_crowd_count(db: Session = Depends(get_db)):
    threshold = crowd_service.get_active_threshold(db)
    count = stream_manager.current_count
    return CrowdCountOut(
        current_count=count,
        threshold=threshold,
        is_overcrowded=count > threshold,
        timestamp=datetime.now(timezone.utc)
    )

@router.post("/update-threshold", response_model=ThresholdOut)
async def update_threshold(body: ThresholdUpdate, db: Session = Depends(get_db)):
    return crowd_service.update_threshold(db, body.crowd_limit)

@router.get("/alert-history", response_model=list[AlertOut])
async def get_alert_history(limit: int = 100, db: Session = Depends(get_db)):
    return crowd_service.get_alert_history(db, limit)

@router.post("/reset-alert-history")
async def reset_alert_history(db: Session = Depends(get_db)):
    crowd_service.reset_alert_history(db)
    return {"message": "Alert history reset"}

@router.websocket("/ws/crowd-updates")
async def crowd_updates_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
