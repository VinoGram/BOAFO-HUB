from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import require_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/reports", tags=["reports"])


class CreateReport(BaseModel):
    reportedUserId: int
    reason: str          # "fake_profile" | "fraud" | "no_show" | "inappropriate" | "other"
    description: Optional[str] = None
    relatedJobId: Optional[int] = None
    relatedBookingId: Optional[int] = None


@router.post("")
def create_report(body: CreateReport, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    db.execute(text(
        "INSERT INTO user_reports (reporterUserId, reportedUserId, reason, description, relatedJobId, relatedBookingId, status) "
        "VALUES (:rep, :repd, :reason, :desc, :jid, :bid, 'open')"
    ), {
        "rep": user["sub"], "repd": body.reportedUserId,
        "reason": body.reason, "desc": body.description,
        "jid": body.relatedJobId, "bid": body.relatedBookingId,
    })
    db.commit()
    return {"success": True}


@router.get("")
def list_reports(request: Request, db: Session = Depends(get_db)):
    # Admin only
    require_user(request)
    if not db:
        return []
    rows = db.execute(text(
        "SELECT r.*, u1.name as reporterName, u2.name as reportedName "
        "FROM user_reports r "
        "JOIN users u1 ON r.reporterUserId=u1.id "
        "JOIN users u2 ON r.reportedUserId=u2.id "
        "ORDER BY r.createdAt DESC"
    )).mappings().all()
    return [dict(r) for r in rows]


@router.post("/{report_id}/resolve")
def resolve_report(report_id: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    db.execute(text("UPDATE user_reports SET status='resolved' WHERE id=:id"), {"id": report_id})
    db.commit()
    return {"success": True}
