import os
import time
import torch
import chromadb
from sentence_transformers import SentenceTransformer
from sarvamai import SarvamAI
from dotenv import load_dotenv
from contextlib import nullcontext

try:
    from langfuse import observe, get_client
except ImportError:
    def observe(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

    class DummyObservation:
        def update(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass

    class DummyLangfuse:
        def start_as_current_observation(self, *args, **kwargs):
            return DummyObservation()

    def get_client(*args, **kwargs):
        return DummyLangfuse()

load_dotenv()

class RAGEngine:
    def __init__(self, chroma_path=None, collection_name="sarthi_knowledge", relevance_threshold=0.8, sarvam_api_key=None):
        from pathlib import Path
        self.SARVAM_API_KEY = sarvam_api_key or os.getenv("SARVAM_API_KEY", "")
        self.COLLECTION_NAME = collection_name
        
        default_chroma = str(Path(__file__).resolve().parent / "chroma_db")
        self.CHROMA_PATH = chroma_path or os.getenv("CHROMA_DB_PATH", default_chroma)
        self.RELEVANCE_THRESHOLD = relevance_threshold

        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"[INIT] Using device: {device}")
        print(f"[INIT] Loading embedding model: BAAI/bge-m3...")
        self.embedder = SentenceTransformer("BAAI/bge-m3", device=device)
        self.embedding_dim = 1024

        print(f"[INIT] Connecting to ChromaDB at {self.CHROMA_PATH}...")
        self.chroma_client = chromadb.PersistentClient(path=self.CHROMA_PATH)
        try:
            self.collection = self.chroma_client.get_collection(self.COLLECTION_NAME)
            print(f"[INIT] RAG Engine loaded with {self.collection.count()} chunks")
        except Exception as e:
            raise Exception(f"ChromaDB collection '{self.COLLECTION_NAME}' not found at {self.CHROMA_PATH}: {e}")

        if self.SARVAM_API_KEY:
            try:
                self.sarvam = SarvamAI(api_subscription_key=self.SARVAM_API_KEY)
                print("[INIT] Sarvam AI connected.")
            except Exception as e:
                print(f"[INIT] Sarvam AI init error: {e}")
                self.sarvam = None
        else:
            self.sarvam = None

        try:
            self.langfuse = get_client()
        except Exception:
            self.langfuse = DummyLangfuse()

    def embed(self, text):
        if isinstance(text, str):
            text = [text]
        return self.embedder.encode(text, convert_to_numpy=True).tolist()

    def _extract_usage(self, response, question, context, answer):
        """
        Attempts to extract token usage from Sarvam's response.
        If unavailable, falls back to character-based estimation.
        """
        input_tokens = 0
        output_tokens = 0
        total_tokens = 0

        # 1. Try to get tokens from API response (if Sarvam returns it)
        usage = getattr(response, 'usage', None)
        if usage:
            if isinstance(usage, dict):
                input_tokens = usage.get('prompt_tokens', 0)
                output_tokens = usage.get('completion_tokens', 0)
                total_tokens = usage.get('total_tokens', 0)
            else:
                input_tokens = getattr(usage, 'prompt_tokens', 0)
                output_tokens = getattr(usage, 'completion_tokens', 0)
                total_tokens = getattr(usage, 'total_tokens', 0)

        # 2. If still 0, estimate based on character length (1 token ≈ 4 chars)
        if total_tokens == 0:
            # Calculate chars in input (question + context) and output (answer)
            input_chars = len(question) + len(context)
            output_chars = len(answer)
            
            # Estimate tokens (4 chars per token is a standard rule of thumb)
            input_tokens = max(1, input_chars // 4)
            output_tokens = max(1, output_chars // 4)
            total_tokens = input_tokens + output_tokens

        return input_tokens, output_tokens, total_tokens

    @observe()
    def ask(self, question, images_available=False):
        start_time = time.time()
        metrics = {}

        # ---- Step 0: Greeting & Smalltalk check ----
        clean_q = question.strip().lower().rstrip(".!?,")
        greetings = {"hi", "hello", "hey", "hlo", "namaste", "namaskar", "good morning", "good afternoon", "good evening", "kaise ho", "who are you", "what is your name", "help"}
        if clean_q in greetings:
            metrics["retrieval_time"] = 0
            metrics["llm_time"] = 0
            metrics["input_tokens"] = 0
            metrics["output_tokens"] = 0
            metrics["total_tokens"] = 0
            metrics["cost_usd"] = 0
            metrics["cost_inr"] = 0
            metrics["tokens_per_second"] = 0
            return "Hello! 🙏 Welcome to SAARTHI AI. How can I assist you at the station today?", [], "none", metrics

        # ---- Step 1: Retrieval ----
        with self.langfuse.start_as_current_observation(
            name="retrieval",
            input=question,
            metadata={"type": "vector_search", "threshold": self.RELEVANCE_THRESHOLD}
        ) as retrieval_span:
            retrieval_start = time.time()
            
            q_embedding = self.embed(question)[0]
            results = self.collection.query(
                query_embeddings=[q_embedding],
                n_results=5
            )

            is_relevant = False
            local_context = ""
            local_sources = []
            top_dist = 1.0

            if results['documents'] and results['documents'][0]:
                top_dist = results['distances'][0][0] if (results.get('distances') and results['distances'][0]) else 1.0
                # Use retrieved documents if distance satisfies threshold
                if top_dist < self.RELEVANCE_THRESHOLD:
                    is_relevant = True
                    local_context = "\n\n".join(results['documents'][0])
                    srcs = results['metadatas'][0]
                    counts = {}
                    for meta in srcs:
                        fname = meta.get('source', 'Unknown')
                        counts[fname] = counts.get(fname, 0) + 1
                    local_sources = list(counts.keys())
            
            retrieval_latency = time.time() - retrieval_start
            retrieval_span.update(
                output={
                    "is_relevant": is_relevant,
                    "sources": local_sources,
                    "top_distance": top_dist if results['documents'] else None
                },
                metadata={"latency_seconds": retrieval_latency}
            )
            metrics["retrieval_time"] = retrieval_latency

        # ---- Step 2: Generation (LLM is used HERE) ----
        if is_relevant and local_context:
            with self.langfuse.start_as_current_observation(
                name="generation",
                input={"question": question, "context": local_context[:200] + "..."},
                metadata={"model": "sarvam-105b", "provider": "sarvam"}
            ) as generation_span:
                gen_start = time.time()
                
                if images_available:
                    system_prompt = (
                        "You are S.A.R.T.H.I., a railway station assistant. Answer using ONLY the provided station documents. "
                        "Keep it concise. Do NOT say you cannot show images or that images are not available. "
                        "I will show related images below my response."
                    )
                else:
                    system_prompt = (
                        "You are S.A.R.T.H.I., a railway station assistant. Answer using ONLY the provided station documents. "
                        "Keep it concise."
                    )
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"INFORMATION:\n{local_context}\n\nQUESTION: {question}"}
                ]
                
                try:
                    if hasattr(self, 'sarvam') and self.sarvam:
                        from concurrent.futures import ThreadPoolExecutor
                        
                        def _fetch_sarvam():
                            return self.sarvam.chat.completions(
                                model="sarvam-105b",
                                messages=messages,
                                temperature=0.3
                            )
                        
                        with ThreadPoolExecutor(max_workers=1) as executor:
                            future = executor.submit(_fetch_sarvam)
                            response = future.result(timeout=30.0)
                        
                        answer = response.choices[0].message.content
                        
                        generation_latency = time.time() - gen_start
                        input_tokens, output_tokens, total_tokens = self._extract_usage(
                            response, question, local_context, answer
                        )
                        input_cost = (input_tokens / 1_000_000) * 0.5
                        output_cost = (output_tokens / 1_000_000) * 1.0
                        total_cost = input_cost + output_cost
                        
                        generation_span.update(
                            output={
                                "answer": answer,
                                "input_tokens": input_tokens,
                                "output_tokens": output_tokens,
                                "total_tokens": total_tokens
                            },
                            metadata={
                                "latency_seconds": generation_latency,
                                "model": "sarvam-105b",
                                "provider": "sarvam",
                                "cost_usd": total_cost
                            }
                        )
                        
                        metrics["llm_time"] = generation_latency
                        metrics["input_tokens"] = input_tokens
                        metrics["output_tokens"] = output_tokens
                        metrics["total_tokens"] = total_tokens
                        metrics["cost_usd"] = total_cost
                        
                        return answer, local_sources, "local", metrics
                    else:
                        return local_context, local_sources, "local_doc", metrics
                    
                except Exception as e:
                    print(f"[RAG] Sarvam API exception or timeout (30s): {e}. Returning document text directly.")
                    return local_context, local_sources, "local_fallback", metrics
        else:
            # No relevant docs found -> No LLM call (0 cost)
            metrics["llm_time"] = 0
            metrics["input_tokens"] = 0
            metrics["output_tokens"] = 0
            metrics["total_tokens"] = 0
            metrics["cost_usd"] = 0
            print(f"[METRICS] No documents found, retrieval: {retrieval_latency:.3f}s")
            return "I couldn't find any relevant information in the station documents. Please try rephrasing your question.", [], "none", metrics