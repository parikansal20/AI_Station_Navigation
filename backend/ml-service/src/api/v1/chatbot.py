"""
Chatbot API router for SAARTHI ML Service.
Integrates the RAG-based chatbot into FastAPI using absolute paths — no os.chdir().
"""
import os
import sys
import json
import base64
import tempfile
from datetime import datetime
from pathlib import Path

import requests
import structlog
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from ...core.config import settings  # unified config — 3 dots: v1/ → api/ → src/

logger = structlog.get_logger(__name__)

# ── Absolute path to the chatbot directory ─────────────────────────────────────
CHATBOT_DIR = Path(__file__).resolve().parents[3] / "chatbot"

# SARVAM_API_KEY comes from the unified ml-service .env via AppConfig
SARVAM_API_KEY = settings.SARVAM_API_KEY
if SARVAM_API_KEY:
    logger.info("SARVAM_API_KEY loaded", key_prefix=SARVAM_API_KEY[:8] + "...")
else:
    logger.warning("SARVAM_API_KEY not set in .env — chatbot TTS/STT will not work")

# ── Add chatbot dir to sys.path so rag_engine can be imported ─────────────────
if str(CHATBOT_DIR) not in sys.path:
    sys.path.insert(0, str(CHATBOT_DIR))

# ── Patch paths before importing RAGEngine ────────────────────────────────────
# RAGEngine uses relative paths like "./chroma_db" — we monkey-patch them via env
os.environ.setdefault("CHROMA_DB_PATH", str(CHATBOT_DIR / "chroma_db"))

# ── Lazy singleton RAGEngine ──────────────────────────────────────────────────
_rag = None

def get_rag():
    global _rag
    if _rag is None or (hasattr(_rag, 'collection') and _rag.collection.count() == 0):
        try:
            import rag_engine as _rag_module
            chroma_path = str(CHATBOT_DIR / "chroma_db")
            api_key = settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY", "")
            
            _rag = _rag_module.RAGEngine(
                chroma_path=chroma_path,
                collection_name="sarthi_knowledge",
                relevance_threshold=0.80,
                sarvam_api_key=api_key
            )
            logger.info("RAG Engine ready", chunks=_rag.collection.count(), path=chroma_path)
        except Exception as exc:
            logger.error("Failed to load RAG Engine", error=str(exc))
            raise HTTPException(status_code=503, detail=f"RAG Engine unavailable: {exc}")
    return _rag


# ── Image mapping (optional) ──────────────────────────────────────────────────
IMAGE_MAPPING: dict = {}
_image_mapping_file = CHATBOT_DIR / "image_mapping.json"
if _image_mapping_file.exists():
    with open(_image_mapping_file, "r") as _f:
        IMAGE_MAPPING = json.load(_f)

STATIC_IMAGE_FALLBACKS = {
    "rail madad": ("/static/images/extracted/Rail Madad_ All In One Railway Helpline Number_RailMitra_page1_img1.png", "Rail Madad_ All In One Railway Helpline Number_RailMitra", 1),
    "helpline": ("/static/images/extracted/Rail Madad_ All In One Railway Helpline Number_RailMitra_page1_img1.png", "Rail Madad_ All In One Railway Helpline Number_RailMitra", 1),
    "139": ("/static/images/extracted/Rail Madad_ All In One Railway Helpline Number_RailMitra_page1_img1.png", "Rail Madad_ All In One Railway Helpline Number_RailMitra", 1),
}

IMAGE_REQUEST_KEYWORDS = [
    "show me", "show image", "show picture", "show photo",
    "display image", "display picture", "display photo",
    "image of", "picture of", "photo of",
    "visual", "diagram", "map", "layout", "schematic",
    "see image", "see picture", "see photo",
    "show", "display", "view image", "view picture",
]


def should_show_images(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in IMAGE_REQUEST_KEYWORDS)


def get_images_for_query(query: str, sources: list) -> list:
    if not should_show_images(query):
        return []
    q = query.lower()
    images = []
    for kw, (url, doc, page) in STATIC_IMAGE_FALLBACKS.items():
        if kw in q:
            images.append({"url": url, "doc": doc, "page": page})
    for source in sources:
        doc_name = source.replace(".txt", "").replace(".md", "")
        if doc_name in IMAGE_MAPPING:
            for img_data in IMAGE_MAPPING[doc_name][:3]:
                img_url = f"/static/images/extracted/{img_data['filename']}"
                if not any(img["url"] == img_url for img in images):
                    images.append({"url": img_url, "doc": doc_name, "page": img_data["page"]})
    return images


def call_sarvam_tts(text: str, speaker: str = "shubh", language: str = "hi-IN") -> bytes:
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"}
    payload = {
        "model": "bulbul:v3",
        "text": text,
        "speaker": speaker,
        "target_language_code": language,
        "output_format": "wav",
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    if resp.status_code == 200:
        result = resp.json()
        if "audios" in result and result["audios"]:
            return base64.b64decode(result["audios"][0])
        elif "audio" in result:
            return base64.b64decode(result["audio"])
        return resp.content
    raise HTTPException(status_code=502, detail=f"TTS error: {resp.status_code} {resp.text}")


def call_sarvam_stt(audio_path: str) -> tuple:
    url = "https://api.sarvam.ai/speech-to-text"
    headers = {"api-subscription-key": SARVAM_API_KEY}
    data = {"model": "saaras:v3", "mode": "transcribe", "language_code": "unknown"}
    with open(audio_path, "rb") as f:
        files = {"file": (os.path.basename(audio_path), f, "audio/wav")}
        resp = requests.post(url, headers=headers, data=data, files=files, timeout=30)
    if resp.status_code == 200:
        result = resp.json()
        transcript = result.get("transcript", "")
        language = result.get("language_code", "hi-IN")
        return transcript or "[Silence or unrecognized speech]", language
    raise HTTPException(status_code=502, detail=f"STT error: {resp.status_code} {resp.text}")


# ── Router ────────────────────────────────────────────────────────────────────
router = APIRouter()


class AskRequest(BaseModel):
    query: str


class TTSRequest(BaseModel):
    text: str
    language: str = "hi-IN"
    voice: str = "shubh"


@router.post("/ask")
async def chatbot_ask(body: AskRequest):
    query = body.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty query")

    rag = get_rag()
    show_images = should_show_images(query)

    try:
        answer, sources, source_type, metrics = rag.ask(query, images_available=show_images)
    except Exception as exc:
        logger.error("RAG ask failed", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc))

    images = get_images_for_query(query, sources) if show_images else []

    if source_type == "none" and images:
        matched = next((kw for kw in STATIC_IMAGE_FALLBACKS if kw in query.lower()), None)
        answer = f"Here is an image related to {matched.title()}." if matched else "Here is an image related to your query."
        source_type = "image"

    return {
        "answer": answer,
        "sources": sources,
        "source_type": source_type,
        "images": images,
        "timestamp": datetime.now().isoformat(),
        "llm_time": metrics.get("llm_time", 0),
        "retrieval_time": metrics.get("retrieval_time", 0),
        "input_tokens": metrics.get("input_tokens", 0),
        "output_tokens": metrics.get("output_tokens", 0),
        "total_tokens": metrics.get("total_tokens", 0),
        "cost_usd": metrics.get("cost_usd", 0),
    }


@router.post("/tts")
@router.post("/voice-output")
async def chatbot_tts(body: TTSRequest):
    if not body.text:
        raise HTTPException(status_code=400, detail="No text provided")
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=503, detail="SARVAM_API_KEY not configured")
    # Truncate to 500 chars to avoid exceeding Sarvam TTS character limits
    safe_text = body.text[:500] if body.text else ""
    audio_bytes = call_sarvam_tts(safe_text, speaker=body.voice, language=body.language)
    return {"audio": base64.b64encode(audio_bytes).decode()}


@router.post("/voice-input")
async def chatbot_voice_input(audio: UploadFile = File(...)):
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=503, detail="SARVAM_API_KEY not configured")
    suffix = Path(audio.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name
    try:
        transcript, language = call_sarvam_stt(tmp_path)
        return {"transcript": transcript, "language": language}
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@router.get("/health")
async def chatbot_health():
    try:
        rag = get_rag()
        return {
            "status": "ok",
            "chunks": rag.collection.count(),
            "chroma_path": str(CHATBOT_DIR / "chroma_db"),
            "threshold": rag.RELEVANCE_THRESHOLD,
        }
    except Exception as exc:
        return {"status": "unavailable", "error": str(exc)}
