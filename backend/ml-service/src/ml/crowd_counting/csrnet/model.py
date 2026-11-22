import os
import structlog
from lwcc import LWCC
from ..base import CrowdModel

logger = structlog.get_logger(__name__)

class CSRNetModel(CrowdModel):
    """
    CSRNet model implementation using the LWCC library.
    This replaces the raw PyTorch implementation and automatically handles
    weights downloading and loading.
    """
    def __init__(self):
        self.model = None

    def load_model(self) -> None:
        """Load the pre-trained CSRNet model using LWCC."""
        if self.model is None:
            try:
                logger.info("Loading CSRNet model via LWCC...")
                
                # Workaround for a bug in LWCC where the weights directory might not exist
                # and gdown fails on Windows. We ensure the .lwcc/weights directory exists.
                try:
                    lwcc_path = os.path.join(os.path.expanduser('~'), '.lwcc', 'weights')
                    os.makedirs(lwcc_path, exist_ok=True)
                    os.makedirs("C:/.lwcc/weights", exist_ok=True) # Fallback for Windows root
                except Exception:
                    pass

                # Using the SHB weights by default, which works better for sparser crowds (like stations)
                self.model = LWCC.load_model(model_name="CSRNet", model_weights="SHB")
                
                from .config import config
                import torch
                if config.USE_FP16 and torch.cuda.is_available():
                    self.model = self.model.half()
                    logger.info("Enabled FP16 half-precision on GPU")
                    
                logger.info("LWCC CSRNet model loaded successfully")
            except Exception as e:
                logger.error("Failed to load LWCC CSRNet model", error=str(e))
                raise RuntimeError(f"Failed to load LWCC model: {e}")

    # The interface methods required by CrowdModel are implemented in inference.py
    def predict(self, image, location_id=None):
        raise NotImplementedError
        
    def get_density_level(self, count):
        raise NotImplementedError
