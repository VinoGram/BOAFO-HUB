from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/chat", tags=["chat"])


class SendMessage(BaseModel):
    bookingId: int
    recipientId: int
    message: str
    mediaUrl: Optional[str] = None


@router.get("/{booking_id}/messages")
def get_messages(booking_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_chat_messages_by_booking(db, booking_id)


@router.post("/messages")
def send_message(body: SendMessage, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    booking = crud.get_booking_by_id(db, body.bookingId)
    if not booking:
        raise HTTPException(404, "Not found")
    customer_profile = crud.get_customer_profile(db, user["sub"])
    provider_profile = crud.get_provider_profile(db, user["sub"])
    is_customer = customer_profile and customer_profile["id"] == booking["customerId"]
    is_provider = provider_profile and provider_profile["id"] == booking["providerId"]
    if not is_customer and not is_provider:
        raise HTTPException(403, "Forbidden")
    msg_id = crud.create_chat_message(db, {
        "bookingId": body.bookingId, "senderId": user["sub"],
        "recipientId": body.recipientId, "message": body.message,
        "mediaUrl": body.mediaUrl, "isRead": False,
    })
    crud.create_notification(db, {
        "userId": body.recipientId, "type": "new_message",
        "title": "New Message",
        "message": "You have a new message",
        "relatedEntityId": body.bookingId, "isRead": False,
    })
    return {"success": True, "messageId": msg_id}


@router.post("/messages/{message_id}/read")
def mark_as_read(message_id: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    crud.mark_chat_message_as_read(db, message_id)
    return {"success": True}
