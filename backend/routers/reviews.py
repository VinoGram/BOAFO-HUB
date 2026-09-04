from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text


router = APIRouter(prefix="/api/reviews", tags=["reviews"])


class CreateReview(BaseModel):
    bookingId: int
    providerId: int
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None


@router.get("/provider/{provider_id}")
def get_by_provider(provider_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_reviews_by_provider(db, provider_id)


@router.post("")
def create_review(body: CreateReview, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    if not (1 <= body.rating <= 5):
        raise HTTPException(400, "Rating must be 1-5")
    profile = crud.get_customer_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Customer profile not found")
    booking = crud.get_booking_by_id(db, body.bookingId)
    if not booking or booking["customerId"] != profile["id"]:
        raise HTTPException(403, "Forbidden")

    # Enforce: booking must be completed or in_progress (provider didn't finish)
    if booking.get("status") not in ("completed", "in_progress", "accepted"):
        raise HTTPException(400, "You can only review active or completed jobs")

    # Enforce: exactly one review per booking
    existing = db.execute(
        text('SELECT id FROM reviews WHERE "bookingId"=:bid LIMIT 1'),
        {"bid": body.bookingId}
    ).mappings().first()
    if existing:
        raise HTTPException(400, "You have already reviewed this booking")

    # Ensure provider matches booking/provider linkage
    if booking.get("providerId") != body.providerId:
        raise HTTPException(403, "Forbidden")

    review_id = crud.create_review(db, {
        "bookingId": body.bookingId, "providerId": body.providerId,
        "customerId": profile["id"], "rating": body.rating,
        "title": body.title, "comment": body.comment,
    })

    provider = crud.get_provider_profile_by_id(db, body.providerId)
    if provider:
        provider_user = crud.get_user_by_id(db, provider["userId"])
        if provider_user:
            crud.create_notification(db, {
                "userId": provider_user["id"], "type": "new_review",
                "title": "New Review",
                "message": f"Customer left a {body.rating}★ review",
                "relatedEntityId": review_id, "isRead": False,
            })
    return {"success": True, "reviewId": review_id}
