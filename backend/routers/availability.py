from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/availability", tags=["availability"])


class SetAvailability(BaseModel):
    dayOfWeek: Optional[int] = None   # 0=Sun … 6=Sat
    specificDate: Optional[str] = None
    startTime: str                    # HH:MM
    endTime: str
    isAvailable: bool = True


@router.get("/mine")
def get_my_availability(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        return []
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        return []
    rows = db.execute(text(
        "SELECT * FROM provider_availability WHERE providerId=:pid ORDER BY dayOfWeek, specificDate"
    ), {"pid": profile["id"]}).mappings().all()
    return [dict(r) for r in rows]


@router.get("/provider/{provider_id}")
def get_provider_availability(provider_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    rows = db.execute(text(
        "SELECT * FROM provider_availability WHERE providerId=:pid ORDER BY dayOfWeek, specificDate"
    ), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


@router.post("")
def set_availability(body: SetAvailability, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Provider profile not found")

    if body.dayOfWeek is not None:
        # Upsert weekly slot
        existing = db.execute(text(
            "SELECT id FROM provider_availability WHERE providerId=:pid AND dayOfWeek=:dow LIMIT 1"
        ), {"pid": profile["id"], "dow": body.dayOfWeek}).mappings().first()
        if existing:
            db.execute(text(
                "UPDATE provider_availability SET startTime=:st, endTime=:et, isAvailable=:ia WHERE id=:id"
            ), {"st": body.startTime, "et": body.endTime, "ia": body.isAvailable, "id": existing["id"]})
        else:
            db.execute(text(
                "INSERT INTO provider_availability (providerId, dayOfWeek, startTime, endTime, isAvailable) "
                "VALUES (:pid, :dow, :st, :et, :ia)"
            ), {"pid": profile["id"], "dow": body.dayOfWeek, "st": body.startTime, "et": body.endTime, "ia": body.isAvailable})
    elif body.specificDate:
        db.execute(text(
            "INSERT INTO provider_availability (providerId, specificDate, startTime, endTime, isAvailable) "
            "VALUES (:pid, :date, :st, :et, :ia)"
        ), {"pid": profile["id"], "date": body.specificDate, "st": body.startTime, "et": body.endTime, "ia": body.isAvailable})
    else:
        raise HTTPException(400, "Provide dayOfWeek or specificDate")

    db.commit()
    return {"success": True}


@router.delete("/{slot_id}")
def delete_availability(slot_id: int, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404)
    db.execute(text("DELETE FROM provider_availability WHERE id=:id AND providerId=:pid"), {"id": slot_id, "pid": profile["id"]})
    db.commit()
    return {"success": True}
