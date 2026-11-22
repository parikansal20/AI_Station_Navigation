import sys
import os
from pathlib import Path

# Add the project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pytest
from src.ml.crowd_counting.csrnet.inference import CSRNetInference

@pytest.fixture
def csrnet_model():
    return CSRNetInference()

def test_model_loading(csrnet_model):
    csrnet_model.load_model()
    assert csrnet_model.model is not None, "Model failed to load"

def test_prediction_output(csrnet_model):
    # Use a dummy or real test image
    result = csrnet_model.predict("tests/test_data/10People.png")
    
    assert isinstance(result.estimated_count, float)
    assert result.density_level in ["Low", "Medium", "High"]
    assert result.processing_time_ms > 0