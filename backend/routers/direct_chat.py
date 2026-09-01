from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import require_user, JWT_SECRET
from typing import Dict, List
from jose import jwt, JWTError
import json

router = APIRouter(prefix="/api/direct", tags=["direct-chat"])

# ── In-memory WS manager ──────────────────────────────────────────────────────
class _Manager:
    def __init__(self):
        self.rooms: Dict[int, List[WebSocket]] = {}

    async def join(self, chat_id: int, ws: WebSocket):
        await ws.accept()
        self.rooms.setdefault(chat_id, []).append(ws)

    def leave(self, chat_id: int, ws: WebSocket):
        if chat_id in self.rooms:
            self.rooms[chat_id] = [w for w in self.rooms[chat_id] if w is not ws]

    async def broadcast(self, chat_id: int, payload: dict):
        for ws in list(self.rooms.get(chat_id, [])):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                pass

manager = _Manager()


def _get_or_create_chat(db: Session, customer_id: int, provider_id: int):
    row = db.execute(text(
        'SELECT * FROM direct_chats WHERE "customerId"=:c AND "providerId"=:p LIMIT 1'
    ), {"c": customer_id, "p": provider_id}).mappings().first()
    if row:
        return dict(row)
    row = db.execute(text(
        'INSERT INTO direct_chats ("customerId","providerId") VALUES (:c,:p) RETURNING *'
    ), {"c": customer_id, "p": provider_id}).mappings().first()
    db.commit()
    return dict(row)


# ── REST: customer initiates / gets chat ─────────────────────────────────────

@router.post("/chats/{provider_id}")
def start_chat(provider_id: int, request: Request, db: Session = Depends(get_db)):
    """Only customers can call this to open/get a chat room with a provider."""
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    if user.get("role") != "customer":
        raise HTTPException(403, "Only customers can initiate chats")
    cp = db.execute(text('SELECT id FROM customer_profiles WHERE "userId"=:u LIMIT 1'), {"u": user["sub"]}).mappings().first()
    if not cp:
        raise HTTPException(404, "Customer profile not found")
    pp = db.execute(text('SELECT id FROM provider_profiles WHERE id=:p LIMIT 1'), {"p": provider_id}).mappings().first()
    if not pp:
        raise HTTPException(404, "Provider not found")
    chat = _get_or_create_chat(db, cp["id"], provider_id)
    return {"chatId": chat["id"]}


@router.get("/chats")
def list_my_chats(request: Request, db: Session = Depends(get_db)):
    """Both roles can list their chats."""
    user = require_user(request)
    if not db:
        return []
    if user.get("role") == "customer":
        cp = db.execute(text('SELECT id FROM customer_profiles WHERE "userId"=:u LIMIT 1'), {"u": user["sub"]}).mappings().first()
        if not cp:
            return []
        rows = db.execute(text(
            'SELECT dc.*, u.name as "providerName", u."profilePictureUrl" as "providerAvatar" '
            'FROM direct_chats dc '
            'JOIN provider_profiles pp ON dc."providerId"=pp.id '
            'JOIN users u ON pp."userId"=u.id '
            'WHERE dc."customerId"=:c ORDER BY dc."createdAt" DESC'
        ), {"c": cp["id"]}).mappings().all()
    else:
        pp = db.execute(text('SELECT id FROM provider_profiles WHERE "userId"=:u LIMIT 1'), {"u": user["sub"]}).mappings().first()
        if not pp:
            return []
        rows = db.execute(text(
            'SELECT dc.*, u.name as "customerName", u."profilePictureUrl" as "customerAvatar" '
            'FROM direct_chats dc '
            'JOIN customer_profiles cp ON dc."customerId"=cp.id '
            'JOIN users u ON cp."userId"=u.id '
            'WHERE dc."providerId"=:p ORDER BY dc."createdAt" DESC'
        ), {"p": pp["id"]}).mappings().all()
    return [dict(r) for r in rows]


@router.get("/chats/{chat_id}/messages")
def get_messages(chat_id: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        return []
    rows = db.execute(text(
        'SELECT dm.*, u.name as "senderName", u."profilePictureUrl" as "senderAvatar" '
        'FROM direct_messages dm JOIN users u ON dm."senderId"=u.id '
        'WHERE dm."chatId"=:c ORDER BY dm."createdAt" ASC'
    ), {"c": chat_id}).mappings().all()
    return [dict(r) for r in rows]


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/{chat_id}")
async def ws_chat(chat_id: int, websocket: WebSocket, token: str = "", db: Session = Depends(get_db)):
    # Authenticate via query param token
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        await websocket.close(code=4001)
        return

    if not db:
        await websocket.close(code=4003)
        return

    # Verify user belongs to this chat
    chat = db.execute(text('SELECT * FROM direct_chats WHERE id=:id LIMIT 1'), {"id": chat_id}).mappings().first()
    if not chat:
        await websocket.close(code=4004)
        return

    cp = db.execute(text('SELECT id FROM customer_profiles WHERE "userId"=:u LIMIT 1'), {"u": user_id}).mappings().first()
    pp = db.execute(text('SELECT id FROM provider_profiles WHERE "userId"=:u LIMIT 1'), {"u": user_id}).mappings().first()
    is_member = (cp and cp["id"] == chat["customerId"]) or (pp and pp["id"] == chat["providerId"])
    if not is_member:
        await websocket.close(code=4003)
        return

    await manager.join(chat_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            content = (data.get("content") or "").strip()
            if not content:
                continue
            # Persist
            row = db.execute(text(
                'INSERT INTO direct_messages ("chatId","senderId",content) VALUES (:c,:s,:m) RETURNING *'
            ), {"c": chat_id, "s": user_id, "m": content}).mappings().first()
            db.commit()
            # Get sender info
            sender = db.execute(text('SELECT name,"profilePictureUrl" FROM users WHERE id=:id LIMIT 1'), {"id": user_id}).mappings().first()
            await manager.broadcast(chat_id, {
                "id": row["id"],
                "chatId": chat_id,
                "senderId": user_id,
                "senderName": sender["name"] if sender else "",
                "senderAvatar": sender["profilePictureUrl"] if sender else None,
                "content": content,
                "createdAt": row["createdAt"].isoformat(),
            })
    except WebSocketDisconnect:
        manager.leave(chat_id, websocket)
