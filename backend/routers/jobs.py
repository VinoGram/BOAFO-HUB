from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class CreateJob(BaseModel):
    tradeCategoryId: int
    title: str
    description: str
    budget: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    preferredStartDate: Optional[datetime] = None


class PlaceBid(BaseModel):
    jobId: int
    amount: str
    message: str = ""
    estimatedDays: Optional[int] = None


@router.get("")
def list_jobs(limit: int = Query(20), offset: int = Query(0), db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_open_jobs(db, limit, offset)


@router.get("/search")
def search_jobs(
    q: Optional[str] = None,
    tradeCategoryId: Optional[int] = None,
    location: Optional[str] = None,
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    if not db:
        return []
    filters = ["status='open'"]
    params: dict = {"lim": limit, "off": offset}
    if tradeCategoryId:
        filters.append('"tradeCategoryId"=:cid')
        params["cid"] = tradeCategoryId
    if q:
        filters.append("(title ILIKE :q OR description ILIKE :q)")
        params["q"] = f"%{q}%"
    if location:
        filters.append("location ILIKE :loc")
        params["loc"] = f"%{location}%"
    where = " AND ".join(filters)
    rows = db.execute(text(f'SELECT * FROM jobs WHERE {where} ORDER BY "createdAt" DESC LIMIT :lim OFFSET :off'), params).mappings().all()
    return [dict(r) for r in rows]


@router.get("/mine")
def get_my_jobs(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_customer_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Customer profile not found")
    return crud.get_jobs_by_customer(db, profile["id"])


@router.get("/by-category")
def get_by_category(tradeCategoryId: int, limit: int = Query(20), offset: int = Query(0), db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_jobs_by_category(db, tradeCategoryId, limit, offset)


@router.get("/{job_id}/bids")
def get_job_bids(job_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    rows = db.execute(text(
        'SELECT b.*, u.name as "providerName", pp."averageRating", pp."verificationStatus", pp."yearsOfExperience" '
        'FROM bids b '
        'JOIN provider_profiles pp ON b."providerId"=pp.id '
        'JOIN users u ON pp."userId"=u.id '
        'WHERE b."jobId"=:jid ORDER BY b."createdAt" ASC'
    ), {"jid": job_id}).mappings().all()
    return [dict(r) for r in rows]


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(503, "Database unavailable")
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(404, "Not found")
    return job


@router.post("")
def create_job(body: CreateJob, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_customer_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Customer profile not found. Please complete your profile first.")
    job_id = crud.create_job(db, {
        "customerId": profile["id"],
        "tradeCategoryId": body.tradeCategoryId,
        "title": body.title,
        "description": body.description,
        "budget": float(body.budget) if body.budget else None,
        "location": body.location,
        "latitude": float(body.latitude) if body.latitude else None,
        "longitude": float(body.longitude) if body.longitude else None,
        "status": "open",
        "preferredStartDate": body.preferredStartDate,
    })
    return {"success": True, "jobId": job_id}


@router.post("/{job_id}/bids")
def place_bid(job_id: int, body: PlaceBid, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Provider profile not found")
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job["status"] != "open":
        raise HTTPException(400, "Job is no longer open for bids")

    # Check for duplicate bid
    existing = db.execute(text('SELECT id FROM bids WHERE "jobId"=:jid AND "providerId"=:pid LIMIT 1'),
                           {"jid": job_id, "pid": profile["id"]}).mappings().first()
    if existing:
        raise HTTPException(400, "You have already placed a bid on this job")

    row = db.execute(text(
        'INSERT INTO bids ("jobId", "providerId", amount, message, "estimatedDays", status) '
        "VALUES (:jobId, :providerId, :amount, :message, :estimatedDays, 'pending') RETURNING id"
    ), {"jobId": job_id, "providerId": profile["id"], "amount": float(body.amount),
        "message": body.message, "estimatedDays": body.estimatedDays}).mappings().first()
    db.commit()
    return {"success": True, "bidId": row["id"] if row else 0}


@router.post("/{job_id}/bids/{bid_id}/accept")
def accept_bid(job_id: int, bid_id: int, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    customer = crud.get_customer_profile(db, user["sub"])
    if not customer:
        raise HTTPException(403, "Forbidden")
    job = crud.get_job_by_id(db, job_id)
    if not job or job["customerId"] != customer["id"]:
        raise HTTPException(403, "Forbidden")
    bid = db.execute(text('SELECT * FROM bids WHERE id=:bid AND "jobId"=:jid LIMIT 1'),
                     {"bid": bid_id, "jid": job_id}).mappings().first()
    if not bid:
        raise HTTPException(404, "Bid not found")

    db.execute(text("UPDATE bids SET status='accepted' WHERE id=:bid"), {"bid": bid_id})
    db.execute(text('UPDATE bids SET status=\'rejected\' WHERE "jobId"=:jid AND id!=:bid'), {"jid": job_id, "bid": bid_id})
    db.execute(text("UPDATE jobs SET status='in_progress' WHERE id=:jid"), {"jid": job_id})

    row = db.execute(text(
        'INSERT INTO bookings ("jobId", "providerId", "customerId", "quotedPrice", status) '
        "VALUES (:jid, :pid, :cid, :price, 'accepted') RETURNING id"
    ), {"jid": job_id, "pid": bid["providerId"], "cid": customer["id"], "price": bid["amount"]}).mappings().first()
    db.commit()
    return {"success": True, "bookingId": row["id"] if row else 0}
