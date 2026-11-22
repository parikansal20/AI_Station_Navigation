import asyncio
import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path

from ..services.crowd_service import crowd_service

logger = structlog.get_logger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()

async def analyze_important_locations():
    """
    Mock scheduled task that simulates fetching an image from a CCTV camera
    and passing it to the crowd counting model for real-time tracking.
    """
    logger.info("Running scheduled crowd analysis task for important locations")
    
    # Simulating a camera feed from "platform-1" using our test data
    test_image_path = Path(__file__).parent.parent.parent / "tests" / "test_data" / "10Gemini.png"
    
    if not test_image_path.exists():
        logger.warning(f"Mock image not found at {test_image_path}. Skipping task.")
        return

    try:
        with open(test_image_path, "rb") as f:
            image_bytes = f.read()
            
        # Analyze and automatically cache the result for the location
        await crowd_service.analyze_image(image_bytes, location_id="platform-1")
        logger.info("Successfully completed scheduled analysis for platform-1")
    except Exception as e:
        logger.error("Failed to run scheduled crowd analysis", error=str(e))

def start_scheduler():
    # Schedule the job to run every 60 seconds
    scheduler.add_job(
        analyze_important_locations, 
        'interval', 
        seconds=3600, 
        id='crowd_analyzer_job', 
        replace_existing=True
    )
    scheduler.start()
    logger.info("Started background crowd analyzer scheduler")

def stop_scheduler():
    scheduler.shutdown(wait=False)
    logger.info("Stopped background crowd analyzer scheduler")
