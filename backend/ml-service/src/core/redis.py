import json
import structlog
import redis.asyncio as redis
from typing import Any, Optional
from datetime import datetime, timedelta

from .config import settings

logger = structlog.get_logger(__name__)

class RedisManager:
    """
    Manages Redis connections with a seamless fallback to an in-memory dictionary.
    This ensures the application runs even if a Redis server is unavailable.
    """
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self._fallback_cache: dict[str, dict[str, Any]] = {}
        self.using_fallback = False

    async def connect(self):
        try:
            self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.client.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.warning("Failed to connect to Redis, using in-memory fallback", error=str(e))
            self.client = None
            self.using_fallback = True

    async def disconnect(self):
        if self.client:
            await self.client.aclose()
            logger.info("Disconnected from Redis")

    async def get(self, key: str) -> Optional[str]:
        if self.using_fallback:
            item = self._fallback_cache.get(key)
            if item:
                if item["expires_at"] and datetime.now() > item["expires_at"]:
                    del self._fallback_cache[key]
                    return None
                return item["value"]
            return None
        elif self.client:
            try:
                return await self.client.get(key)
            except Exception as e:
                logger.error("Redis get error", error=str(e))
        return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if self.using_fallback:
            expires_at = datetime.now() + timedelta(seconds=ex) if ex else None
            self._fallback_cache[key] = {"value": value, "expires_at": expires_at}
            return True
        elif self.client:
            try:
                await self.client.set(key, value, ex=ex)
                return True
            except Exception as e:
                logger.error("Redis set error", error=str(e))
        return False

# Global instance to be initialized on app startup
redis_manager = RedisManager()
