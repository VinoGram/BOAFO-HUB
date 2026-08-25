from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


class CreateBooking(BaseModel):
    jobId: int
    providerId: int
    quotedPrice: Optional[str] = None
    scheduledStartTime: Optional[datetime] = None
    scheduledEndTime: Optional[datetime] = None
    notes: Optional[str] = None


class DeclineBooking(BaseModel):
    reason: Optional[str] = None


@router.get("/mine/provider")
def get_my_provider_bookings(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Not found")
    return crud.get_bookings_by_provider(db, profile["id"])


@router.get("/mine/customer")
def get_my_customer_bookings(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_customer_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Not found")
    return crud.get_bookings_by_customer(db, profile["id"])


@router.get("/{booking_id}")
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(503, "Database unavailable")
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(404, "Not found")
    return booking


@router.post("")
def create_booking(body: CreateBooking, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_customer_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Customer profile not found")
    if not crud.get_job_by_id(db, body.jobId):
        raise HTTPException(404, "Job not found")
    provider = crud.get_provider_profile_by_id(db, body.providerId)
    if not provider:
        raise HTTPException(404, "Provider not found")

    booking_id = crud.create_booking(db, {
        "jobId": body.jobId,
        "providerId": body.providerId,
        "customerId": profile["id"],
        "quotedPrice": float(body.quotedPrice) if body.quotedPrice else None,
        "scheduledStartTime": body.scheduledStartTime,
        "scheduledEndTime": body.scheduledEndTime,
        "notes": body.notes,
        "status": "pending",
    })

    job = crud.get_job_by_id(db, body.jobId)
    provider_user = crud.get_user_by_id(db, provider["userId"])
    if provider_user and job:
        crud.create_notification(db, {
            "userId": provider_user["id"], "type": "booking_request",
            "title": "New Booking Request",
            "message": f"Customer requested booking for: {job['title']}",
            "relatedEntityId": booking_id, "isRead": False,
        })
    return {"success": True, "bookingId": booking_id}


@router.post("/{booking_id}/accept")
def accept_booking(booking_id: int, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(404, "Not found")
    provider = crud.get_provider_profile_by_id(db, booking["providerId"])
    if not provider or provider["userId"] != user["sub"]:
        raise HTTPException(403, "Forbidden")
    crud.update_booking_status(db, booking_id, "accepted")
    job = crud.get_job_by_id(db, booking["jobId"])
    customer_profile = crud.get_customer_profile(db, booking["customerId"])
    if customer_profile:
        customer_user = crud.get_user_by_id(db, customer_profile["userId"])
        if customer_user and job:
            crud.create_notification(db, {
                "userId": customer_user["id"], "type": "booking_confirmed",
                "title": "Booking Accepted",
                "message": f"Provider accepted your booking for: {job['title']}",
                "relatedEntityId": booking_id, "isRead": False,
            })
    return {"success": True}


@router.post("/{booking_id}/decline")
def decline_booking(booking_id: int, body: DeclineBooking, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(404, "Not found")
    provider = crud.get_provider_profile_by_id(db, booking["providerId"])
    if not provider or provider["userId"] != user["sub"]:
        raise HTTPException(403, "Forbidden")
    crud.update_booking_status(db, booking_id, "declined")
    job = crud.get_job_by_id(db, booking["jobId"])
    customer_profile = crud.get_customer_profile(db, booking["customerId"])
    if customer_profile:
        customer_user = crud.get_user_by_id(db, customer_profile["userId"])
        if customer_user and job:
            crud.create_notification(db, {
                "userId": customer_user["id"], "type": "booking_declined",
                "title": "Booking Declined",
                "message": f"Provider declined your booking for: {job['title']}",
                "relatedEntityId": booking_id, "isRead": False,
            })
    return {"success": True}


@router.post("/{booking_id}/complete")
def complete_booking(booking_id: int, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(404, "Not found")
    customer = crud.get_customer_profile(db, user["sub"])
    if not customer or customer["id"] != booking["customerId"]:
        raise HTTPException(403, "Forbidden")
    crud.update_booking_status(db, booking_id, "completed")
    payment = crud.get_payment_by_booking(db, booking_id)
    if payment and payment["status"] == "held":
        crud.update_payment_status(db, payment["id"], "released")
    provider = crud.get_provider_profile_by_id(db, booking["providerId"])
    if provider:
        provider_user = crud.get_user_by_id(db, provider["userId"])
        if provider_user:
            crud.create_notification(db, {
                "userId": provider_user["id"], "type": "job_completed",
                "title": "Job Completed",
                "message": "Customer confirmed job completion. Payment released.",
                "relatedEntityId": booking_id, "isRead": False,
            })
    return {"success": True}
