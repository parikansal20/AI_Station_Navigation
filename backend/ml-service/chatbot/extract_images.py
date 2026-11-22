import os
import glob
import fitz  # PyMuPDF
import json
import hashlib

PDF_FOLDER = "data"
OUTPUT_IMAGES_FOLDER = "static/images/extracted"
MAPPING_FILE = "image_mapping.json"

os.makedirs(OUTPUT_IMAGES_FOLDER, exist_ok=True)
os.makedirs("static/images", exist_ok=True)

image_mapping = {}

def extract_images_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    doc_name = os.path.splitext(os.path.basename(pdf_path))[0]
    doc_images = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images(full=True)
        
        for img_index, img in enumerate(images):
            try:
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                
                img_filename = f"{doc_name}_page{page_num+1}_img{img_index+1}.png"
                img_path = os.path.join(OUTPUT_IMAGES_FOLDER, img_filename)
                
                with open(img_path, "wb") as f:
                    f.write(image_bytes)
                
                # Store metadata
                doc_images.append({
                    "filename": img_filename,
                    "page": page_num + 1,
                    "doc_name": doc_name
                })
                print(f"   Extracted: {img_filename} (Page {page_num+1})")
                
            except Exception as e:
                print(f"   Error extracting image: {e}")
                continue
    
    if doc_images:
        image_mapping[doc_name] = doc_images
    
    doc.close()
    return doc_images

print("="*60)
print("EXTRACTING IMAGES FROM PDFS")
print("="*60)

pdf_files = glob.glob(os.path.join(PDF_FOLDER, "*.pdf"))
if not pdf_files:
    print("No PDFs found in 'data/' folder.")
    exit()

print(f"Found {len(pdf_files)} PDF(s).")
print("="*60)

for pdf_path in pdf_files:
    print(f"\nProcessing: {os.path.basename(pdf_path)}")
    extract_images_from_pdf(pdf_path)

# Save the mapping (includes metadata)
with open(MAPPING_FILE, "w") as f:
    json.dump(image_mapping, f, indent=2)

print("\n" + "="*60)
print(f"✅ IMAGE EXTRACTION COMPLETE")
print(f"   Images saved to: {OUTPUT_IMAGES_FOLDER}")
print(f"   Mapping saved to: {MAPPING_FILE}")
print("="*60)