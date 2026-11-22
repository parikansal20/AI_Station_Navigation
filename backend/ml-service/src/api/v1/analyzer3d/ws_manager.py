import asyncio
import json
from fastapi import WebSocket
import structlog

logger = structlog.get_logger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.info("WebSocket connected in 3D Analyzer", total_clients=len(self.active_connections))

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info("WebSocket disconnected in 3D Analyzer", total_clients=len(self.active_connections))

    async def broadcast_json(self, data: dict):
        payload = json.dumps(data, default=str)
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead.append(connection)
        for d in dead:
            await self.disconnect(d)

    async def broadcast_bytes(self, data: bytes):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_bytes(data)
            except Exception:
                dead.append(connection)
        for d in dead:
            await self.disconnect(d)

manager = ConnectionManager()
