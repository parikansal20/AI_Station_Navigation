import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class CSRNetConfig(BaseSettings):
    """Configuration for the CSRNet model."""
    
    # Model parameters
    MODEL_WEIGHTS_PATH: str = os.getenv("CSRNET_WEIGHTS_PATH", "weights/csrnet_weights.pth")
    DOWNLOAD_URL: str = "" 
    
    # Image Preprocessing & Optimization
    INPUT_SIZE: int = int(os.getenv("CSRNET_INPUT_SIZE", "512"))
    USE_FP16: bool = os.getenv("CSRNET_USE_FP16", "True").lower() in ('true', '1', 't')
    
    # Advanced Preprocessing for Stations
    APPLY_CLAHE: bool = os.getenv("CSRNET_APPLY_CLAHE", "True").lower() in ('true', '1', 't')
    DENOISE_IMAGE: bool = os.getenv("CSRNET_DENOISE_IMAGE", "False").lower() in ('true', '1', 't')
    
    # Post-processing bias reduction
    BIAS_REDUCTION_FACTOR: float = float(os.getenv("CSRNET_BIAS_FACTOR", "0.6"))
    EMPTY_SPACE_PENALTY: bool = os.getenv("CSRNET_EMPTY_SPACE_PENALTY", "True").lower() in ('true', '1', 't')
    
    # Density thresholds (tailored for railway stations)
    THRESHOLD_LOW: int = int(os.getenv("CSRNET_THRESHOLD_LOW", "15"))
    THRESHOLD_MEDIUM: int = int(os.getenv("CSRNET_THRESHOLD_MEDIUM", "50"))

    # Temporal & Outlier Smoothing
    TEMPORAL_WINDOW_SIZE: int = int(os.getenv("CSRNET_TEMPORAL_WINDOW", "12"))
    OUTLIER_THRESHOLD_ZSCORE: float = float(os.getenv("CSRNET_OUTLIER_ZSCORE", "2.0"))
    
    # Preprocessing
    CLAHE_CLIP_LIMIT: float = float(os.getenv("CSRNET_CLAHE_CLIP", "2.5"))
    CLAHE_GRID_SIZE: int = int(os.getenv("CSRNET_CLAHE_GRID", "8"))
    
    # Hybrid Model Fusion
    HYBRID_FUSION_ENABLED: bool = os.getenv("CSRNET_HYBRID_ENABLED", "True").lower() in ('true', '1', 't')
    HYBRID_FUSION_THRESHOLD: float = float(os.getenv("CSRNET_HYBRID_THRESHOLD", "35.0"))

    model_config = SettingsConfigDict(env_prefix="CSRNET_", case_sensitive=True)

config = CSRNetConfig()
