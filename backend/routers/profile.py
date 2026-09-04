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


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    """Public list of all users with basic info."""
    if not db:
        return []
    rows = db.execute(text(
        'SELECT u.id, u.name, u.role, u."profilePictureUrl", u."createdAt", '
        'pp.bio, pp."averageRating", pp."yearsOfExperience", pp."verificationStatus", pp."hourlyRate", pp.plan '
        'FROM users u LEFT JOIN provider_profiles pp ON pp."userId"=u.id '
        'ORDER BY u."createdAt" DESC'
    )).mappings().all()
    return [dict(r) for r in rows]


@router.get("/user/{user_id}")
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    """Public profile for any user."""
    if not db:
        raise HTTPException(503, "Database unavailable")
    row = db.execute(text(
        'SELECT u.*, pp.bio, pp."averageRating", pp."yearsOfExperience", pp."verificationStatus", '
        'pp."hourlyRate", pp.plan, pp."serviceRegions", pp."totalReviews" '
        'FROM users u LEFT JOIN provider_profiles pp ON pp."userId"=u.id '
        'WHERE u.id=:uid LIMIT 1'
    ), {"uid": user_id}).mappings().first()
    if not row:
        raise HTTPException(404, "User not found")
    data = dict(row)
    # fetch jobs if customer
    jobs = []
    if data.get("role") == "customer":
        cp = db.execute(text('SELECT id FROM customer_profiles WHERE "userId"=:u LIMIT 1'), {"u": user_id}).mappings().first()
        if cp:
            jrows = db.execute(text('SELECT id,title,status,"createdAt",location,budget FROM jobs WHERE "customerId"=:c ORDER BY "createdAt" DESC'), {"c": cp["id"]}).mappings().all()
            jobs = [dict(j) for j in jrows]
    # fetch reviews if provider
    reviews = []
    if data.get("role") == "provider":
        pp = db.execute(text('SELECT id FROM provider_profiles WHERE "userId"=:u LIMIT 1'), {"u": user_id}).mappings().first()
        if pp:
            rrows = db.execute(text(
                'SELECT r.*, u.name as "customerName" FROM reviews r '
                'JOIN customer_profiles cp ON r."customerId"=cp.id '
                'JOIN users u ON cp."userId"=u.id '
                'WHERE r."providerId"=:p ORDER BY r."createdAt" DESC'
            ), {"p": pp["id"]}).mappings().all()
            reviews = [dict(r) for r in rrows]
    return {**data, "jobs": jobs, "reviews": reviews}


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
        # Only update provider_profiles if the user is actually a provider
        user_row2 = db.execute(text('SELECT role FROM users WHERE id=:uid LIMIT 1'), {"uid": user["sub"]}).mappings().first()
        if user_row2 and user_row2["role"] == "provider":
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
