from fastapi import APIRouter
from .crowd import router as crowd_router

api_router = APIRouter()
api_router.include_router(crowd_router, prefix="/crowd", tags=["Crowd Analysis"])

# Chatbot RAG router — loaded separately to avoid crashing server if deps missing
try:
    from .chatbot import router as chatbot_router
    api_router.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot RAG"])
except Exception as _e:
    import structlog as _sl
    _sl.get_logger(__name__).error("Chatbot router failed to load", error=str(_e))
