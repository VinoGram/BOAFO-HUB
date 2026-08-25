from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel

router = APIRouter(prefix="/api/payments", tags=["payments"])


class CreatePaymentIntent(BaseModel):
    bookingId: int
    amount: str


class ConfirmPayment(BaseModel):
    bookingId: int
    paymentIntentId: str


@router.get("/booking/{booking_id}")
def get_by_booking(booking_id: int, db: Session = Depends(get_db)):
    if not db:
        return None
    return crud.get_payment_by_booking(db, booking_id)


@router.get("/mine")
def get_my_payments(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        return []
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Not found")
    return crud.get_payments_by_provider(db, profile["id"])


@router.post("/intent")
def create_payment_intent(body: CreatePaymentIntent, request: Request):
    require_user(request)
    return {"success": True, "clientSecret": "pi_test_secret"}


@router.post("/confirm")
def confirm_payment(body: ConfirmPayment, request: Request):
    require_user(request)
    return {"success": True}
