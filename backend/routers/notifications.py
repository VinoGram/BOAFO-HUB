from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(request: Request, limit: int = Query(50), offset: int = Query(0), db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        return []
    return crud.get_notifications_by_user(db, user["sub"], limit, offset)


@router.get("/unread")
def get_unread(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        return []
    return crud.get_unread_notifications(db, user["sub"])


@router.post("/{notification_id}/read")
def mark_as_read(notification_id: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    crud.mark_notification_as_read(db, notification_id)
    return {"success": True}
