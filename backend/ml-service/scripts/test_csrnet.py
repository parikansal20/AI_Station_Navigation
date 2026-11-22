import sys
import os
import argparse
import base64
from pathlib import Path
import cv2
import numpy as np

# Add the src directory to the path so we can import modules
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(backend_dir)

from src.ml.crowd_counting.csrnet import CSRNetInference

def main():
    parser = argparse.ArgumentParser(description="Test CSRNet Inference Pipeline")
    parser.add_argument("--image", type=str, required=True, help="Path to the input image")
    parser.add_argument("--save-heatmap", type=str, default="heatmap_overlay.jpg", help="Path to save the decoded heatmap overlay")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"Error: Image {args.image} not found.")
        return

    print("Initializing CSRNet...")
    model = CSRNetInference()
    
    print(f"Running inference on {args.image}...")
    try:
        prediction = model.predict(args.image)
        
        print("\n--- Prediction Results ---")
        print(f"Estimated Count: {prediction.estimated_count:.2f}")
        print(f"Density Level: {prediction.density_level}")
        print(f"Processing Time: {prediction.processing_time_ms:.2f} ms")
        print(f"Timestamp: {prediction.timestamp}")
        
        if prediction.heatmap_base64:
            print("\nDecoding heatmap base64...")
            heatmap_bytes = base64.b64decode(prediction.heatmap_base64)
            heatmap_np = np.frombuffer(heatmap_bytes, dtype=np.uint8)
            heatmap_img = cv2.imdecode(heatmap_np, cv2.IMREAD_COLOR)
            
            # Blend with original image
            orig_img = cv2.imread(args.image)
            if orig_img is not None:
                # Resize heatmap to match original image dimensions for overlay
                heatmap_img = cv2.resize(heatmap_img, (orig_img.shape[1], orig_img.shape[0]), interpolation=cv2.INTER_LANCZOS4)
                
                # Enhanced alpha blending - Heatmap provides the color overlay while original image provides the structure
                blended = cv2.addWeighted(orig_img, 0.7, heatmap_img, 0.5, 0)
                cv2.imwrite(args.save_heatmap, blended)
                print(f"Saved enhanced blended heatmap to {args.save_heatmap}")
            else:
                cv2.imwrite(args.save_heatmap, heatmap_img)
                print(f"Saved heatmap to {args.save_heatmap}")
                
    except Exception as e:
        print(f"Inference failed: {e}")

if __name__ == "__main__":
    main()
