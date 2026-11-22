import sys
from pathlib import Path
import numpy as np
import cv2
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.ml.crowd_counting.csrnet.inference import CSRNetInference
from src.services.video_crowd_service import VideoCrowdProcessor, LocationStreamState

@pytest.fixture
def video_processor():
    model = CSRNetInference()
    return VideoCrowdProcessor(model=model, history_size=10, ema_alpha=0.3)

def test_motion_detection(video_processor):
    state = LocationStreamState()
    
    # Create two identical frames (no motion)
    frame1 = np.zeros((240, 320), dtype=np.uint8)
    frame2 = np.zeros((240, 320), dtype=np.uint8)
    
    # First frame always returns True (initial state)
    assert video_processor.detect_motion(state, frame1) is True
    
    # Second identical frame returns False (no motion)
    assert video_processor.detect_motion(state, frame2, threshold=0.005) is False
    
    # Modify frame2 with significant changes (motion)
    frame3 = np.zeros((240, 320), dtype=np.uint8)
    frame3[50:150, 50:150] = 255
    assert video_processor.detect_motion(state, frame3, threshold=0.005) is True

def test_process_video_frame(video_processor):
    # Create a synthetic BGR frame
    frame = np.ones((480, 640, 3), dtype=np.uint8) * 128
    
    res = video_processor.process_frame(
        frame_bgr=frame,
        location_id="test-platform",
        frame_skip=1,
        motion_detection=False,
        include_heatmap=False
    )
    
    assert hasattr(res, "current_count")
    assert hasattr(res, "average_count")
    assert hasattr(res, "density_level")
    assert hasattr(res, "confidence")
    assert hasattr(res, "timestamp")
    assert res.density_level in ["Low", "Medium", "High"]
    assert 0.0 <= res.confidence <= 1.0
