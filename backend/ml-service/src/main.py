import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .api.v1 import api_router
from .core.config import settings
from .core.redis import redis_manager
from .tasks.crowd_analyzer import start_scheduler, stop_scheduler

logger = structlog.get_logger(__name__)

async def prewarm_rag():
    try:
        from .api.v1.chatbot import get_rag
        from .ml.crowd_counting.hybrid_detector import HybridCrowdDetector
        import asyncio
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, get_rag)
        await loop.run_in_executor(None, HybridCrowdDetector)
        logger.info("Chatbot RAG Engine & Hybrid Crowd Detector pre-warmed in memory!")
    except Exception as _e:
        logger.warning("Failed to pre-warm ML services", error=str(_e))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info(f"Starting {settings.PROJECT_NAME}...")
    
    # 1. Initialize Redis connection pool
    await redis_manager.connect()
    
    # 2. Start background tasks (APScheduler)
    start_scheduler()
    
    # 3. Non-blocking pre-warm so Gunicorn binds $PORT instantly
    import asyncio
    asyncio.create_task(prewarm_rag())

    # 4. Initialize 3D Video Analyzer database & loop
    try:
        from .api.v1.analyzer3d import init_db as init_db_3d, stream_manager as stream_manager_3d
        init_db_3d()
        loop = asyncio.get_running_loop()
        stream_manager_3d.bind_loop(loop)
        logger.info("3D Video Analyzer initialized successfully on startup.")
    except Exception as _e:
        logger.error("Failed to initialize 3D Video Analyzer", error=str(_e))
    
    yield
    
    # Shutdown actions
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    
    # 1. Stop background tasks
    stop_scheduler()

    # 2. Stop 3D Video Analyzer background capture loop if running
    try:
        from .api.v1.analyzer3d import stream_manager as stream_manager_3d
        stream_manager_3d.stop()
        logger.info("3D Video Analyzer stopped on shutdown.")
    except Exception as _e:
        logger.error("Failed to stop 3D Video Analyzer on shutdown", error=str(_e))
    
    # 3. Close Redis connection pool
    await redis_manager.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .api.v1.crowd import router as crowd_router

# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(crowd_router, prefix="/crowd", tags=["Crowd Analysis (Root Alias)"])

# Mount 3D Video Analyzer Router
try:
    from .api.v1.analyzer3d import analyzer3d_router
    app.include_router(analyzer3d_router, prefix="/api/v1/crowd/3d", tags=["3D Video Analyzer"])
    app.include_router(analyzer3d_router, prefix="/crowd/3d", tags=["3D Video Analyzer (Root Alias)"])
except Exception as _exc:
    logger.error("Failed to mount 3D Video Analyzer router", error=str(_exc))

try:
    from .api.v1.chatbot import router as chatbot_router
    app.include_router(chatbot_router, tags=["Chatbot Direct Root Alias"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot Prefix Alias"])
except Exception as _exc:
    logger.error("Failed to mount chatbot root aliases", error=str(_exc))

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

