import base64
import numpy as np
import cv2
from PIL import Image

def resize_image_for_inference(img: Image.Image, target_size: int, apply_clahe: bool = True, denoise: bool = False) -> Image.Image:
    """
    Resize image while maintaining aspect ratio, ensuring the longest side
    matches the target_size. Also applies advanced preprocessing (CLAHE, Denoising)
    tailored for station CCTV-like scenes.
    """
    width, height = img.size
    long_side = max(width, height)
    
    # Always resize to target_size to ensure consistent speed
    scale = target_size / long_side
    new_width = int(width * scale)
    new_height = int(height * scale)
    
    # Resize using LANCZOS for high quality
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Advanced Preprocessing
    if apply_clahe or denoise:
        # Convert PIL to OpenCV format
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        if denoise:
            # Gaussian blur for noise reduction (CCTV artifact removal)
            img_cv = cv2.GaussianBlur(img_cv, (3, 3), 0)
            
        if apply_clahe:
            # Adaptive Contrast Enhancement (CLAHE) tailored for Indian Station lighting
            from .config import config
            lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            grid_dim = config.CLAHE_GRID_SIZE
            clahe = cv2.createCLAHE(
                clipLimit=config.CLAHE_CLIP_LIMIT, 
                tileGridSize=(grid_dim, grid_dim)
            )
            cl = clahe.apply(l)
            
            limg = cv2.merge((cl, a, b))
            img_cv = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
            
        # Convert back to PIL
        img = Image.fromarray(cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB))
        
    return img

def get_heuristic_person_count(img_cv: np.ndarray) -> float:
    """
    Fast, traditional computer vision sanity check using Edge Density.
    Serves as a lightweight sanity check for very sparse scenes without
    requiring heavy ML object detectors.
    """
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 200, 300)
    
    # Calculate edge density ratio
    edge_ratio = np.sum(edges > 0) / edges.size
    
    # Railway stations have huge amounts of structural edges (tracks, ceilings, trains).
    # We subtract a massive baseline of 0.15 (15% edges).
    active_edges = max(0.0, edge_ratio - 0.15)
    
    # Every 1% of active edges above the baseline corresponds to ~1 person
    pseudo_count = active_edges * 100.0
    return min(5.0, pseudo_count)

def generate_heatmap_base64(density_map: np.ndarray) -> str:
    """
    Convert a 2D density map numpy array into a base64 encoded heatmap image string.
    Generates a cleaner, more visible overlay heatmap with single-person peak emphasis.
    """
    # Apply a Gaussian blur to smooth out the density map and merge nearby blobs
    density_map = cv2.GaussianBlur(density_map, (15, 15), 0)
    
    # Clip negative values that might occur from CNN outputs before applying power scaling
    density_map_clipped = np.clip(density_map, 0, None)
    
    if density_map_clipped.max() > 0:
        # Normalize with stronger non-linear scaling (power of 0.4 instead of sqrt) 
        # to make even very low densities (single person) highly visible
        density_map_normalized = np.power(density_map_clipped, 0.4)
        density_map_normalized = 255 * (density_map_normalized - density_map_normalized.min()) / (density_map_normalized.max() - density_map_normalized.min())
    else:
        density_map_normalized = density_map_clipped
        
    density_map_normalized = density_map_normalized.astype(np.uint8)
    
    # Dilate to make single-person detections more prominent and slightly larger
    kernel = np.ones((5, 5), np.uint8)
    density_map_normalized = cv2.dilate(density_map_normalized, kernel, iterations=1)
    
    # Apply colormap (COLORMAP_TURBO provides excellent contrast across the full spectrum)
    heatmap = cv2.applyColorMap(density_map_normalized, cv2.COLORMAP_TURBO)
    
    # Encode to JPEG
    _, buffer = cv2.imencode('.jpg', heatmap)
    return base64.b64encode(buffer).decode('utf-8')
