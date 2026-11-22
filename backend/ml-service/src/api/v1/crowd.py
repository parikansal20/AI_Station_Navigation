from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Query
from typing import Optional
import structlog
import time

from ...models.crowd import (
    CrowdAnalyzeResponse, 
    CrowdStatusResponse, 
    VideoFrameAnalyzeResponse, 
    VideoFileAnalyzeResponse
)
from ...services.crowd_service import crowd_service
from ...core.config import settings
from ...core.redis import redis_manager

router = APIRouter()
logger = structlog.get_logger(__name__)

async def rate_limit(request: Request):
    """
    Simple IP-based rate limiting using Redis fallback caching.
    """
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}"
    
    # Very rudimentary sliding window using the cache
    val = await redis_manager.get(key)
    if val:
        requests = int(val)
        if requests >= settings.RATE_LIMIT_PER_MINUTE * 3: # Higher threshold for video frames
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        await redis_manager.set(key, str(requests + 1), ex=60)
    else:
        await redis_manager.set(key, "1", ex=60)

@router.post(
    "/analyze", 
    response_model=CrowdAnalyzeResponse, 
    summary="Analyze Crowd Density",
    description="Upload an image to estimate the crowd size and get actionable passenger advice."
)
async def analyze_crowd(
    request: Request,
    file: UploadFile = File(..., description="The image file to analyze (JPEG/PNG/AVIF)"),
    location_id: Optional[str] = Form(None, description="Optional identifier for caching (e.g., 'platform-3')"),
    include_heatmap: bool = Query(False, description="Whether to generate and return a base64 heatmap overlay image")
):
    await rate_limit(request)
    
    if not file.content_type.startswith("image/") and not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.avif')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please provide an image.")
        
    try:
        contents = await file.read()
        response = await crowd_service.analyze_image(
            image_bytes=contents, 
            location_id=location_id, 
            include_heatmap=include_heatmap
        )
        return response
    except Exception as e:
        logger.error("Error analyzing image", error=str(e))
        raise HTTPException(status_code=500, detail="An internal error occurred during crowd analysis.")

@router.post(
    "/analyze-video",
    response_model=VideoFileAnalyzeResponse,
    summary="Analyze Uploaded Video File",
    description="Upload a video file (MP4, AVI, MOV) for full-length crowd counting, motion tracking, and temporal metrics."
)
async def analyze_video(
    request: Request,
    file: UploadFile = File(..., description="The video file to analyze (MP4, AVI, MOV)"),
    location_id: Optional[str] = Form("video-upload", description="Station location identifier (e.g., 'entrance')"),
    frame_skip: int = Query(5, ge=1, le=15, description="Process 1 frame every N frames"),
    include_heatmap: bool = Query(True, description="Include heatmap overlays for sample frames")
):
    await rate_limit(request)

    valid_exts = ('.mp4', '.avi', '.mov', '.mkv', '.webm')
    if not file.filename.lower().endswith(valid_exts) and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid video file format. Supported: MP4, AVI, MOV, MKV, WebM.")

    try:
        contents = await file.read()
        response = await crowd_service.analyze_video_file(
            video_bytes=contents,
            filename=file.filename or "video.mp4",
            location_id=location_id,
            frame_skip=frame_skip,
            include_heatmap=include_heatmap
        )
        return response
    except Exception as e:
        logger.error("Error processing video file", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to process video file: {str(e)}")

@router.post(
    "/analyze-frame",
    response_model=VideoFrameAnalyzeResponse,
    summary="Analyze Real-time Video Stream Frame",
    description="Process a single frame from a live webcam or IP Camera stream with motion detection and EMA temporal smoothing."
)
async def analyze_video_frame(
    request: Request,
    file: UploadFile = File(..., description="The frame image file (JPEG/PNG)"),
    location_id: Optional[str] = Form("webcam", description="Location identifier (e.g., 'platform-3', 'webcam')"),
    frame_skip: int = Query(3, ge=1, le=10, description="Inference frame step interval"),
    motion_detection: bool = Query(True, description="Enable motion detection frame skipping"),
    include_heatmap: bool = Query(False, description="Generate Base64 heatmap overlay")
):
    try:
        contents = await file.read()
        response = await crowd_service.analyze_video_frame(
            frame_bytes=contents,
            location_id=location_id,
            frame_skip=frame_skip,
            include_heatmap=include_heatmap,
            motion_detection=motion_detection
        )
        return response
    except Exception as e:
        logger.error("Error analyzing frame", error=str(e))
        raise HTTPException(status_code=500, detail="Error processing video stream frame.")

@router.post(
    "/rtsp-stream",
    response_model=VideoFrameAnalyzeResponse,
    summary="Analyze RTSP / IP Camera Stream Frame",
    description="Trigger real-time inference on an active CCTV RTSP / IP Camera stream URL."
)
async def analyze_rtsp_stream(
    rtsp_url: str = Query(..., description="RTSP / IP Camera Stream URL (e.g., 'rtsp://admin:pass@192.168.1.50:554/stream1')"),
    location_id: Optional[str] = Query("rtsp-cctv", description="Camera location ID"),
    include_heatmap: bool = Query(True, description="Include density heatmap overlay")
):
    try:
        import cv2
        cap = cv2.VideoCapture(rtsp_url)
        if not cap.isOpened():
            # For demonstration / testing fallback if RTSP is offline, generate a mock state
            raise HTTPException(status_code=400, detail="Unable to open RTSP stream URL. Ensure stream is online.")
        
        ret, frame = cap.read()
        cap.release()
        
        if not ret or frame is None:
            raise HTTPException(status_code=500, detail="Failed to capture frame from RTSP stream.")
            
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        return await crowd_service.analyze_video_frame(
            frame_bytes=frame_bytes,
            location_id=location_id,
            frame_skip=1,
            include_heatmap=include_heatmap,
            motion_detection=True
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("RTSP processing failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"RTSP stream connection error: {str(e)}")

@router.get(
    "/status/{location_id}", 
    response_model=CrowdStatusResponse,
    summary="Get Latest Crowd Status",
    description="Retrieve the latest cached crowd status for a specific location ID (useful for fast polling)."
)
async def get_crowd_status(location_id: str):
    return await crowd_service.get_latest_status(location_id)

