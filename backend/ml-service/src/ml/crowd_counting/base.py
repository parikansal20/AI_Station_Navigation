from abc import ABC, abstractmethod
from typing import Optional, Union
from datetime import datetime, timezone
from pydantic import BaseModel
import numpy as np

class CrowdPrediction(BaseModel):
    """
    Standard response schema for crowd density estimation.
    """
    estimated_count: float
    density_level: str
    heatmap_base64: Optional[str] = None
    processing_time_ms: float
    timestamp: datetime
    location_id: Optional[str] = None

class CrowdModel(ABC):
    """
    Abstract base class for all crowd density estimation models.
    Ensures a consistent API across different underlying implementations.
    """
    
    @abstractmethod
    def load_model(self) -> None:
        """
        Load the model weights and initialize the architecture.
        Must be implemented by subclasses.
        """
        pass

    @abstractmethod
    def predict(self, image: Union[str, np.ndarray], location_id: Optional[str] = None) -> CrowdPrediction:
        """
        Perform inference on a single image.
        
        Args:
            image: Path to the image file or a numpy array representing the image.
            location_id: Optional identifier for where the image was captured.
            
        Returns:
            CrowdPrediction: The model's prediction including count, density, and heatmap.
        """
        pass

    @abstractmethod
    def get_density_level(self, count: float) -> str:
        """
        Determine the density level string based on the estimated count.
        
        Args:
            count: The estimated number of people.
            
        Returns:
            str: Density level (e.g., 'Low', 'Medium', 'High').
        """
        pass
