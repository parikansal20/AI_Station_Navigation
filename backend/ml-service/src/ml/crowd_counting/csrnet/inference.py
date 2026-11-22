import os
import time
import tempfile
import structlog
from typing import Optional, Union
import numpy as np
import cv2
from PIL import Image
from datetime import datetime, timezone
import torch

from .model import CSRNetModel
from .utils import generate_heatmap_base64, resize_image_for_inference
from .config import config
from ..base import CrowdPrediction
from lwcc import LWCC

logger = structlog.get_logger(__name__)

class CSRNetInference(CSRNetModel):
    """
    Inference class for CSRNet that orchestrates preprocessing, model execution,
    and postprocessing to generate predictions using LWCC.
    """
    def __init__(self):
        super().__init__()
        logger.info("Initializing CSRNet inference pipeline (Powered by LWCC)")

    def apply_station_adapter(self, count: float, density_map: np.ndarray, img: Image.Image) -> float:
        """
        Advanced Bias Correction logic customized for sparse railway station scenes.
        Penalizes CNN over-prediction based on the "empty space ratio" and uses HOG ensemble.
        """
        # 1. Base bias reduction factor
        adjusted_count = count * config.BIAS_REDUCTION_FACTOR
        
        # 1.5 Progressive penalty for medium-small crowds (< 50)
        # The CNN over-predicts more heavily in sparser scenes. We apply a dynamic scale
        # that gently reduces counts (e.g. 20 -> ~11, 40 -> ~34).
        if adjusted_count < 50.0:
            progressive_penalty = 0.3 + 0.7 * (adjusted_count / 50.0)
            adjusted_count *= progressive_penalty
        
        # 2. Stronger penalty for very sparse scenes (< 12.0)
        if config.EMPTY_SPACE_PENALTY and adjusted_count < 12.0:
            # Threshold the density map to find definitively "active" regions
            # CLAHE can cause noise, so we use a stricter threshold 1e-3 for "confident" crowd regions.
            active_pixels = np.sum(density_map > 1e-3)
            total_pixels = density_map.size
            active_ratio = active_pixels / total_pixels if total_pixels > 0 else 0
            
            # For 512x512, even a ratio of 0.2 is very small
            if active_ratio < 0.20:
                # Base penalty
                penalty = 0.25
                if active_ratio < 0.10:
                    penalty = 0.15
                    
                adjusted_count *= penalty
                
            # 3. Model Ensemble (Light sanity check)
            # For extremely low density, CSRNet might still predict 2-3 due to background textures.
            # We use a fast heuristic edge detector to average/sanity check.
            from .utils import get_heuristic_person_count
            
            # Convert PIL to cv2 format
            img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            heuristic_count = get_heuristic_person_count(img_cv)
            
            # Average the predictions to suppress CNN hallucinations in empty areas
            adjusted_count = (adjusted_count * 0.7) + (heuristic_count * 0.3)
                
            # Floor correction to handle near-zero floats organically
            if adjusted_count < 1.0:
                adjusted_count = max(0.0, adjusted_count)
                
        return adjusted_count

    def predict(self, image: Union[str, np.ndarray, Image.Image], location_id: Optional[str] = None) -> CrowdPrediction:
        """
        Execute full inference pipeline on the input image using LWCC.
        Supports PIL Image, numpy array, or file path.
        """
        if self.model is None:
            self.load_model()
            
        start_time = time.perf_counter()
        temp_file_path = None
        
        try:
            # 1. Image preparation & Optimization
            if isinstance(image, str) and os.path.isfile(image):
                pil_img = Image.open(image).convert("RGB")
            elif isinstance(image, np.ndarray):
                if len(image.shape) == 3 and image.shape[2] == 3:
                    pil_img = Image.fromarray(image)
                else:
                    pil_img = Image.fromarray(image).convert("RGB")
            elif isinstance(image, Image.Image):
                pil_img = image.convert('RGB')
            else:
                raise ValueError("Unsupported image type. Expected str, np.ndarray, or PIL.Image.")

            # Resize image to improve speed and apply CLAHE/Denoising
            pil_img = resize_image_for_inference(
                pil_img, 
                target_size=config.INPUT_SIZE,
                apply_clahe=config.APPLY_CLAHE,
                denoise=config.DENOISE_IMAGE
            )

            # LWCC get_count requires a file path. We write the optimized image to a temp file.
            fd, temp_file_path = tempfile.mkstemp(suffix=".jpg")
            os.close(fd)
            pil_img.save(temp_file_path, quality=95)

            # 2. Model Inference
            device_type = 'cuda' if torch.cuda.is_available() else 'cpu'
            use_autocast = config.USE_FP16 and torch.cuda.is_available()
            
            with torch.autocast(device_type=device_type, enabled=use_autocast):
                count, density_map = LWCC.get_count(temp_file_path, model=self.model, return_density=True)
            
            # 3. Postprocess & Station Scene Adapter
            estimated_count = self.apply_station_adapter(float(count), density_map, pil_img)
            
            density_level = self.get_density_level(estimated_count)
            heatmap_b64 = generate_heatmap_base64(density_map)
            
            end_time = time.perf_counter()
            processing_time_ms = (end_time - start_time) * 1000
            
            logger.info("Inference successful", count=estimated_count, time_ms=processing_time_ms, level=density_level)
            
            return CrowdPrediction(
                estimated_count=estimated_count,
                density_level=density_level,
                heatmap_base64=heatmap_b64,
                processing_time_ms=processing_time_ms,
                timestamp=datetime.now(timezone.utc),
                location_id=location_id
            )
            
        except Exception as e:
            logger.error("Inference failed", error=str(e))
            raise RuntimeError(f"Error during LWCC CSRNet inference: {e}")
        finally:
            # Clean up temporary image file if created
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def get_density_level(self, count: float) -> str:
        """
        Categorize the count into Low/Medium/High based on config thresholds.
        Dynamic logic based on the customized railway thresholds.
        """
        if count < config.THRESHOLD_LOW:
            return "Low"
        elif count < config.THRESHOLD_MEDIUM:
            return "Medium"
        else:
            return "High"
