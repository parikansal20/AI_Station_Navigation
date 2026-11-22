import os
import sys
import torch
import chromadb
from sentence_transformers import SentenceTransformer
from sarvamai import SarvamAI
from dotenv import load_dotenv

load_dotenv()

# =============================================
# CONFIGURATION
# =============================================
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
if not SARVAM_API_KEY:
    raise ValueError("SARVAM_API_KEY not found in .env file!")

CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "sarthi_knowledge"
EMBEDDING_MODEL = "BAAI/bge-m3"

# =============================================
# LOCAL EMBEDDER
# =============================================
class LocalEmbedder:
    def __init__(self, model_name=EMBEDDING_MODEL):
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"[INIT] Using device: {device}")
        print(f"[INIT] Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name, device=device)
        print("[INIT] Model loaded. Dimension: 1024")

    def embed(self, texts):
        if isinstance(texts, str):
            texts = [texts]
        return self.model.encode(texts, convert_to_numpy=True).tolist()

# =============================================
# INITIALIZE
# =============================================
print("[INIT] Initializing local embedding model...")
embedder = LocalEmbedder()

print("[INIT] Connecting to Sarvam...")
sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

print("[INIT] Connecting to ChromaDB...")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

try:
    collection = chroma_client.get_collection(COLLECTION_NAME)
    print(f"[INIT] Database loaded! Total chunks: {collection.count()}")
except Exception as e:
    print(f"[ERROR] Database error: {e}")
    print("   Please run 'python ingest.py' first.")
    sys.exit(1)

def ask_question(question):
    print(f"\n[QUERY] {question}")

    try:
        q_embedding = embedder.embed(question)[0]
        print("[EMBED] Question embedded.")
    except Exception as e:
        print(f"[ERROR] Embedding error: {e}")
        return

    try:
        results = collection.query(query_embeddings=[q_embedding], n_results=5)
    except Exception as e:
        print(f"[ERROR] Query error: {e}")
        return

    is_relevant = False
    if results['documents'] and results['documents'][0]:
        top_dist = results['distances'][0][0] if results['distances'] else 1.0
        print(f"[RAG] Top relevance score: {top_dist:.4f}")
        if top_dist < 0.8:
            is_relevant = True

    if not is_relevant:
        print("\n[ANSWER]")
        print("I couldn't find any relevant information in the station documents. Please try rephrasing your question.")
        return

    context = "\n\n".join(results['documents'][0])
    sources = list(set([meta['source'] for meta in results['metadatas'][0]]))

    messages = [
        {"role": "system", "content": "You are S.A.R.T.H.I., a railway station assistant. Answer using ONLY the provided station documents. Keep it concise."},
        {"role": "user", "content": f"INFORMATION:\n{context}\n\nQUESTION: {question}"}
    ]

    try:
        response = sarvam_client.chat.completions(
            model="sarvam-105b",
            messages=messages,
            temperature=0.3,
        )
        answer = response.choices[0].message.content
        print(f"\n[ANSWER]\n{answer}")
        print(f"\n[SOURCES]\n{', '.join(sources)}")
    except Exception as e:
        print(f"[ERROR] Sarvam error: {e}")

print("\n" + "="*60)
print("S.A.R.T.H.I. RAG Assistant (PDF-Only Mode)")
print("="*60)
print("Type your questions (or 'exit' to quit):")

while True:
    try:
        question = input("\n> ").strip()
        if question.lower() in ['exit', 'quit', 'bye']:
            print("Goodbye!")
            break
        if not question:
            continue
        ask_question(question)
    except KeyboardInterrupt:
        print("\nGoodbye!")
        break
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")