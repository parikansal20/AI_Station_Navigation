import torch
from sentence_transformers import SentenceTransformer

class SarvamEmbedder:
    def __init__(self, api_key=None, model_name="BAAI/bge-m3"):
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"   Using device: {device}")
        print(f"   Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension = 1024
        print(f"   Model loaded. Dimension: {self.dimension}")

    def embed(self, texts):
        if isinstance(texts, str):
            texts = [texts]
        print(f"   Embedding {len(texts)} texts locally (BGE-M3)...")
        embeddings_np = self.model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
        embeddings = embeddings_np.tolist()
        print(f"   Done.")
        return embeddings