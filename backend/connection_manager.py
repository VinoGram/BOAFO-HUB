from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, booking_id: int):
        await websocket.accept()
        if booking_id not in self.active_connections:
            self.active_connections[booking_id] = []
        self.active_connections[booking_id].append(websocket)

    def disconnect(self, websocket: WebSocket, booking_id: int):
        if booking_id in self.active_connections:
            self.active_connections[booking_id].remove(websocket)

    async def broadcast(self, booking_id: int, message: dict):
        if booking_id in self.active_connections:
            for connection in self.active_connections[booking_id]:
                try:
                    await connection.send_text(json.dumps(message, default=str))
                except Exception:
                    # Handle broken connections if necessary
                    self.disconnect(connection, booking_id)

manager = ConnectionManager()