import os
import glob
import torch
import chromadb
from sentence_transformers import SentenceTransformer
import hashlib
from dotenv import load_dotenv

# Disable warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["CUDA_VISIBLE_DEVICES"] = "0"  # Force NVIDIA GPU

load_dotenv()

# =============================================
# CONFIGURATION
# =============================================
TEXT_FOLDER = "output"
CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "sarthi_knowledge"
CHUNK_SIZE = 500
OVERLAP = 50
EMBEDDING_MODEL = "BAAI/bge-m3"

# =============================================
# INITIALIZE
# =============================================
# GPU Setup
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"[INIT] Using device: {device}")

print("[INIT] Loading embedding model (BGE-M3)...")
# --- FIX: Force local files only ---
embedder = SentenceTransformer(EMBEDDING_MODEL, device=device)
print("[INIT] Model loaded. Dimension: 1024")
print(f"[INIT] Model is on device: {next(embedder.parameters()).device}")

print("[INIT] Connecting to ChromaDB...")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Delete old collection (start fresh)
try:
    chroma_client.delete_collection(COLLECTION_NAME)
    print("[DELETE] Removed old collection.")
except:
    print("[INFO] No existing collection found.")

collection = chroma_client.create_collection(name=COLLECTION_NAME)
print("[CREATE] New collection created.")

# =============================================
# READ FILES - FIXED ENCODING
# =============================================
print(f"\n[SCAN] Looking for files in '{TEXT_FOLDER}'...")
all_files = glob.glob(os.path.join(TEXT_FOLDER, "*.txt")) + glob.glob(os.path.join(TEXT_FOLDER, "*.md"))

if not all_files:
    print(f"[ERROR] No .txt or .md files found in '{TEXT_FOLDER}'!")
    exit()

print(f"[FILES] Found {len(all_files)} file(s):")
for f in all_files:
    print(f"   - {os.path.basename(f)}")

# =============================================
# CHUNKING
# =============================================
def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    if not text:
        return []
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end]
        chunks.append(chunk)
        if end == text_len:
            break
        start += (chunk_size - overlap)
    return chunks

all_chunks = []
all_metadata = []
all_ids = []

print("\n[CHUNK] Splitting files into chunks...")

for file_path in all_files:
    file_name = os.path.basename(file_path)
    print(f"   Processing: {file_name}")

    # ---- FIXED ENCODING: Try UTF-8, fallback to utf-8-sig (handles BOM) ----
    content = None
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                content = f.read()
            print(f"      Successfully read with encoding: {enc}")
            break
        except UnicodeDecodeError:
            continue
    
    if content is None:
        print(f"      Error: Could not read file with any encoding. Skipping.")
        continue

    if not content.strip():
        print(f"      Warning: File is empty. Skipping.")
        continue

    chunks = chunk_text(content)
    print(f"      Created {len(chunks)} chunks.")

    for idx, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{file_name}_{idx}".encode()).hexdigest()
        all_chunks.append(chunk)
        all_metadata.append({"source": file_name, "chunk_index": idx})
        all_ids.append(chunk_id)

total_chunks = len(all_chunks)
print(f"\n[SUMMARY] Total chunks across all files: {total_chunks}")

if total_chunks == 0:
    print("[ERROR] No chunks generated. Check your files.")
    exit()

# =============================================
# EMBEDDING (BGE-M3 on GPU) - Optimized for 4GB VRAM
# =============================================
print("[EMBED] Generating embeddings with BGE-M3 (this may take a few minutes)...")
batch_size = 32
embeddings = []
for i in range(0, total_chunks, batch_size):
    batch = all_chunks[i:i+batch_size]
    print(f"   Encoding batch {i//batch_size + 1}/{(total_chunks + batch_size - 1)//batch_size}...")
    emb = embedder.encode(batch, convert_to_numpy=True, show_progress_bar=False)
    embeddings.extend(emb.tolist())

print(f"[EMBED] Generated {len(embeddings)} embeddings (1024-dim).")

# =============================================
# STORE IN CHROMADB
# =============================================
print("[STORE] Storing in ChromaDB...")
BATCH_SIZE = 50
for i in range(0, total_chunks, BATCH_SIZE):
    end_idx = min(i + BATCH_SIZE, total_chunks)
    print(f"   Batch {i//BATCH_SIZE + 1}/{(total_chunks + BATCH_SIZE - 1)//BATCH_SIZE}")
    try:
        collection.add(
            embeddings=embeddings[i:end_idx],
            documents=all_chunks[i:end_idx],
            metadatas=all_metadata[i:end_idx],
            ids=all_ids[i:end_idx]
        )
        print(f"      Complete.")
    except Exception as e:
        print(f"      Error: {e}")

print("\n" + "="*60)
print("✅ INGESTION COMPLETE")
print(f"   Total chunks stored: {total_chunks}")
print(f"   Files processed: {len(all_files)}")
print("="*60)