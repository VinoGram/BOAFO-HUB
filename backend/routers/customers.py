from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/customers", tags=["customers"])


class CreateCustomerProfile(BaseModel):
    address: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None


@router.get("/me")
def get_my_profile(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    return crud.get_customer_profile(db, user["sub"])


@router.post("")
def create_profile(body: CreateCustomerProfile, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    if crud.get_customer_profile(db, user["sub"]):
        raise HTTPException(400, "Profile already exists")
    return crud.create_customer_profile(db, {
        "userId": user["sub"],
        "address": body.address,
        "latitude": float(body.latitude) if body.latitude else None,
        "longitude": float(body.longitude) if body.longitude else None,
    })
