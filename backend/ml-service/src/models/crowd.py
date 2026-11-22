from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CrowdAnalyzeResponse(BaseModel):
    """
    Response model for the crowd analysis endpoint.
    Designed for easy frontend consumption.
    """
    location_id: Optional[str] = Field(None, description="The ID of the location analyzed")
    estimated_count: float = Field(..., description="The estimated number of people")
    density_level: str = Field(..., description="The density classification ('Low', 'Medium', 'High')")
    confidence: float = Field(..., description="Confidence score of the prediction (0.0 to 1.0)", ge=0.0, le=1.0)
    summary: str = Field(..., description="Short summary string, e.g., 'Low crowd on Platform 3'")
    advice: str = Field(..., description="Practical, passenger-friendly suggestion")
    processing_time_ms: float = Field(..., description="Time taken to process the image in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the analysis")
    heatmap_base64: Optional[str] = Field(None, description="Optional Base64 encoded string of the heatmap overlay image")

class CrowdStatusResponse(BaseModel):
    """
    Response model for polling the latest status of a location.
    """
    location_id: str
    status: str = Field(..., description="Status of the data ('available' or 'not_found')")
    data: Optional[CrowdAnalyzeResponse] = None

class VideoFrameAnalyzeResponse(BaseModel):
    """
    Response model for single video frame analysis in real-time video streaming.
    """
    current_count: float = Field(..., description="Current instantaneous estimated crowd count")
    average_count: float = Field(..., description="Smoothed running average crowd count")
    density_level: str = Field(..., description="Density level ('Low', 'Medium', 'High')")
    confidence: float = Field(..., description="Model confidence score (0.0 to 1.0)", ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC Timestamp of the analysis")
    motion_detected: bool = Field(True, description="Whether significant motion was detected in frame")
    processing_time_ms: float = Field(0.0, description="Inference and processing latency in ms")
    location_id: Optional[str] = Field(None, description="Location identifier, e.g., 'platform-3'")
    summary: str = Field("", description="Human-readable crowd summary")
    advice: str = Field("", description="Actionable passenger advice")
    heatmap_base64: Optional[str] = Field(None, description="Optional Base64 encoded density heatmap overlay")
    yolo_count: Optional[float] = Field(None, description="Detector count from YOLO/HOG model")
    csrnet_count: Optional[float] = Field(None, description="Raw density count from CSRNet model")
    detector_mode: Optional[str] = Field("YOLOv8", description="Detector engine used ('YOLOv8', 'OpenCV-HOG')")
    is_hybrid_mode: bool = Field(True, description="Whether hybrid ensemble mode is active")

class VideoFileAnalyzeResponse(BaseModel):
    """
    Response model for uploaded video file analysis.
    """
    filename: str = Field(..., description="Name of the processed video file")
    total_frames: int = Field(..., description="Total number of frames in the video")
    processed_frames: int = Field(..., description="Number of frames evaluated by inference model")
    fps: float = Field(..., description="Video stream target or original FPS")
    duration_seconds: float = Field(..., description="Video duration in seconds")
    current_count: float = Field(..., description="Final frame estimated crowd count")
    average_count: float = Field(..., description="Average crowd count across the video")
    peak_count: float = Field(..., description="Peak crowd count observed in the video")
    density_level: str = Field(..., description="Overall density level")
    confidence: float = Field(..., description="Average confidence score")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC Timestamp of analysis")
    sample_frames: list[VideoFrameAnalyzeResponse] = Field(default_factory=list, description="Frame samples taken during video analysis")
    is_hybrid_mode: bool = Field(True, description="Whether hybrid ensemble mode was used")

