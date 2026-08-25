import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.auth import require_user
from backend.database import get_db
from backend.crud import get_user_by_id
from backend.cloudinary import upload_to_cloudinary

router = APIRouter(prefix="/api/profile", tags=["profile"])


def build_profile_payload(row: dict) -> dict:
    if not row:
        return {}
    return {
        "id": row.get("id"),
        "name": row.get("name"),
        "email": row.get("email"),
        "phone": row.get("phone"),
        "role": row.get("role"),
        "profilePictureUrl": row.get("profilePictureUrl"),
        "bio": row.get("bio"),
        "location": row.get("location"),
        "company": row.get("company"),
        "website": row.get("website"),
        "createdAt": row.get("createdAt"),
        "updatedAt": row.get("updatedAt"),
        "lastSignedIn": row.get("lastSignedIn"),
    }


@router.get("/me")
def get_my_profile(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    row = db.execute(
        text(
            'SELECT u.*, pp.bio, pp."serviceAreaLatitude" as location, pp."hourlyRate" as company, pp."verificationStatus" as website '
            'FROM users u LEFT JOIN provider_profiles pp ON pp."userId" = u.id WHERE u.id = :uid LIMIT 1'
        ),
        {"uid": user["sub"]},
    ).mappings().first()
    return build_profile_payload(dict(row) if row else {})


@router.patch("/me")
async def update_my_profile(
    request: Request,
    db: Session = Depends(get_db),
    name: Optional[str] = Form(default=None),
    email: Optional[str] = Form(default=None),
    phone: Optional[str] = Form(default=None),
    bio: Optional[str] = Form(default=None),
    location: Optional[str] = Form(default=None),
    company: Optional[str] = Form(default=None),
    website: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")

    user_row = get_user_by_id(db, user["sub"])
    if not user_row:
        raise HTTPException(404, "User not found")

    profile_url = user_row.get("profilePictureUrl")
    if file is not None:
        profile_url = await upload_to_cloudinary(file, user["sub"])

    updates = []
    params: dict = {"uid": user["sub"]}
    if name is not None:
        updates.append('name = :name')
        params["name"] = name
    if email is not None:
        updates.append('email = :email')
        params["email"] = email
    if phone is not None:
        updates.append('phone = :phone')
        params["phone"] = phone
    if profile_url:
        updates.append('"profilePictureUrl" = :profilePictureUrl')
        params["profilePictureUrl"] = profile_url

    if updates:
        db.execute(text(f'UPDATE users SET {", ".join(updates)} WHERE id = :uid'), params)

    profile_updates = []
    profile_params: dict = {"uid": user["sub"]}
    if bio is not None:
        profile_updates.append('bio = :bio')
        profile_params["bio"] = bio
    if location is not None:
        profile_updates.append('"serviceAreaLatitude" = :location')
        profile_params["location"] = location
    if company is not None:
        profile_updates.append('"hourlyRate" = :company')
        profile_params["company"] = company
    if website is not None:
        profile_updates.append('"verificationStatus" = :website')
        profile_params["website"] = website

    if profile_updates:
        db.execute(text(f'UPDATE provider_profiles SET {", ".join(profile_updates)} WHERE "userId" = :uid'), profile_params)

    db.commit()
    refreshed = db.execute(
        text(
            'SELECT u.*, pp.bio, pp."serviceAreaLatitude" as location, pp."hourlyRate" as company, pp."verificationStatus" as website '
            'FROM users u LEFT JOIN provider_profiles pp ON pp."userId" = u.id WHERE u.id = :uid LIMIT 1'
        ),
        {"uid": user["sub"]},
    ).mappings().first()
    return build_profile_payload(dict(refreshed) if refreshed else {})
