import os
import glob
import json
import tempfile
import shutil
from pypdf import PdfReader, PdfWriter
from sarvamai import SarvamAI
from dotenv import load_dotenv

load_dotenv()

# =============================================
# CONFIGURATION
# =============================================
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
if not SARVAM_API_KEY:
    raise ValueError("SARVAM_API_KEY not found in .env file!")

PDF_FOLDER = "data"
OUTPUT_FOLDER = "output"
TRACKING_FILE = "processed_files.json"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
di = client.document_intelligence

# =============================================
# TRACKING FUNCTIONS
# =============================================
def load_processed_files():
    if os.path.exists(TRACKING_FILE):
        with open(TRACKING_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_processed_files(processed):
    with open(TRACKING_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed, f, indent=2)

def get_file_info(file_path):
    stat = os.stat(file_path)
    return {"size": stat.st_size, "mtime": stat.st_mtime}

def is_pdf_processed(file_path, processed_db):
    filename = os.path.basename(file_path)
    if filename not in processed_db:
        return False
    current_info = get_file_info(file_path)
    stored_info = processed_db[filename]
    return (current_info["size"] == stored_info.get("size") and
            current_info["mtime"] == stored_info.get("mtime"))

def mark_as_processed(file_path, processed_db):
    filename = os.path.basename(file_path)
    processed_db[filename] = get_file_info(file_path)

# =============================================
# PROCESS FUNCTIONS
# =============================================
def process_small_pdf(pdf_path, output_path):
    try:
        job = di.create_job(language="en-IN", output_format="md")
        job.upload_file(pdf_path)
        job.start()
        job.wait_until_complete()
        job.download_output(output_path)
        return True
    except Exception as e:
        print(f"      Error: {e}")
        return False

def read_file_with_fallback(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        print(f"      Warning: UTF-8 decode failed. Using latin-1 fallback.")
        with open(file_path, 'r', encoding='latin-1') as f:
            return f.read()
    except Exception as e:
        print(f"      Error reading file: {e}")
        return ""

def process_large_pdf(pdf_path, output_path, pages_per_chunk=10):
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    temp_dir = tempfile.mkdtemp()
    chunk_files = []
    
    try:
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        print(f"   Splitting {total_pages} pages into {pages_per_chunk}-page chunks...")
        
        for start_page in range(0, total_pages, pages_per_chunk):
            end_page = min(start_page + pages_per_chunk, total_pages)
            chunk_name = f"{base_name}_p{start_page+1}-{end_page}.pdf"
            chunk_path = os.path.join(temp_dir, chunk_name)
            
            writer = PdfWriter()
            for i in range(start_page, end_page):
                writer.add_page(reader.pages[i])
            with open(chunk_path, "wb") as f:
                writer.write(f)
            
            chunk_files.append(chunk_path)
            print(f"   Created chunk: {chunk_name} (pages {start_page+1}-{end_page})")
        
        combined_content = []
        for idx, chunk_path in enumerate(chunk_files):
            print(f"   Processing chunk {idx+1}/{len(chunk_files)}: {os.path.basename(chunk_path)}")
            chunk_md = os.path.join(temp_dir, f"{base_name}_chunk_{idx+1}.md")
            
            if process_small_pdf(chunk_path, chunk_md):
                content = read_file_with_fallback(chunk_md)
                if content:
                    combined_content.append(f"\n\n<!-- Pages {idx*pages_per_chunk+1} to {min((idx+1)*pages_per_chunk, total_pages)} -->\n\n")
                    combined_content.append(content)
                else:
                    print(f"      Chunk {idx+1} produced empty content.")
            else:
                print(f"      Chunk {idx+1} failed. Skipping.")
        
        if combined_content:
            with open(output_path, "w", encoding="utf-8") as out_f:
                out_f.writelines(combined_content)
            print(f"   Combined output saved to {output_path}")
            return True
        else:
            print(f"   No content was extracted from any chunk.")
            return False
        
    except Exception as e:
        print(f"   Error processing large PDF: {e}")
        return False
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# =============================================
# MAIN PROCESSING LOGIC
# =============================================
def process_pdf(pdf_path, processed_db):
    filename = os.path.basename(pdf_path)
    base_name = os.path.splitext(filename)[0]
    output_path = os.path.join(OUTPUT_FOLDER, f"{base_name}.md")
    
    print(f"\nProcessing: {filename}")
    
    if is_pdf_processed(pdf_path, processed_db):
        print(f"   SKIPPED: File already processed and unchanged.")
        return True
    
    try:
        reader = PdfReader(pdf_path)
        page_count = len(reader.pages)
        print(f"   Pages: {page_count}")
    except:
        page_count = 0
        print("   Could not read page count. Assuming small file.")
    
    if page_count > 10:
        print(f"   PDF exceeds 10‑page limit. Processing in chunks...")
        success = process_large_pdf(pdf_path, output_path, pages_per_chunk=10)
    else:
        print(f"   Processing directly...")
        success = process_small_pdf(pdf_path, output_path)
    
    if success:
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            mark_as_processed(pdf_path, processed_db)
            print(f"   ✅ Marked as processed.")
        else:
            print(f"   ⚠️ Output file missing or empty. Not marking as processed.")
    else:
        print(f"   ❌ Processing failed. File will be retried next time.")
    
    return success

# =============================================
# MAIN
# =============================================
if __name__ == "__main__":
    print("=" * 60)
    print("SARVAM AKSHAR EXTRACTION (Document Intelligence) with Tracking")
    print("=" * 60)
    
    processed_db = load_processed_files()
    print(f"\n[TRACKING] Previously processed files: {len(processed_db)}")
    
    pdf_files = glob.glob(os.path.join(PDF_FOLDER, "*.pdf"))
    if not pdf_files:
        print("No PDFs found in 'data/' folder.")
        exit()
    
    print(f"\n[SCAN] Found {len(pdf_files)} PDF(s) in '{PDF_FOLDER}'.")
    print("=" * 60)
    
    success_count = 0
    for pdf_path in pdf_files:
        if process_pdf(pdf_path, processed_db):
            success_count += 1
    
    save_processed_files(processed_db)
    
    print("\n" + "=" * 60)
    print(f"PROCESSING COMPLETE: {success_count}/{len(pdf_files)} files processed (including skipped)")
    print(f"[TRACKING] Total processed files now: {len(processed_db)}")
    print("=" * 60)