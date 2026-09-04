from fastapi import APIRouter, Depends, HTTPException, Request, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional, List
import os
import httpx

router = APIRouter(prefix="/api/providers", tags=["providers"])

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")


async def _upload_to_cloudinary(file: UploadFile, user_id: int) -> str:
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        raise HTTPException(400, "Cloudinary credentials are not configured")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file upload")

    url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/auto/upload"
    data = {
        "api_key": CLOUDINARY_API_KEY,
        "timestamp": str(int(__import__("time").time())),
        "upload_preset": os.getenv("CLOUDINARY_UPLOAD_PRESET", ""),
        "resource_type": "auto",
    }
    if not data["upload_preset"]:
        raise HTTPException(400, "CLOUDINARY_UPLOAD_PRESET is required")

    payload = {**data, "file": (file.filename, file_bytes, file.content_type or "application/octet-stream")}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, data={k: v for k, v in data.items() if k != "file"}, files={"file": payload["file"]})
    if response.status_code >= 400:
        raise HTTPException(500, f"Cloudinary upload failed: {response.text}")
    body = response.json()
    return body.get("secure_url") or body.get("url") or ""


class CreateProviderProfile(BaseModel):
    bio: Optional[str] = None
    yearsOfExperience: Optional[int] = None
    hourlyRate: Optional[str] = None
    serviceAreaRadius: Optional[int] = None
    serviceAreaLatitude: Optional[str] = None
    serviceAreaLongitude: Optional[str] = None
    serviceRegions: Optional[List[str]] = None
    phone: Optional[str] = None
    plan: Optional[str] = "Premium"


class UpdateProviderProfile(BaseModel):
    bio: Optional[str] = None
    yearsOfExperience: Optional[int] = None
    hourlyRate: Optional[str] = None
    serviceAreaRadius: Optional[int] = None
    serviceRegions: Optional[List[str]] = None


class CreatePortfolioItem(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    mediaType: Optional[str] = "image"


@router.get("/search")
def search_providers(
    tradeCategoryId: Optional[int] = None,
    location: Optional[str] = None,
    q: Optional[str] = None,
    minRating: Optional[float] = None,
    verified: Optional[bool] = None,
    sortBy: Optional[str] = Query(None, regex="^(rating|experience|recent)$"),
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    if not db:
        return []
    filters = ["pp.isActive=1"]
    params: dict = {"lim": limit, "off": offset}

    base = (
        "SELECT pp.*, u.name as userName, u.phone as userPhone "
        "FROM provider_profiles pp "
        "JOIN users u ON pp.userId=u.id "
    )

    if tradeCategoryId:
        base += "INNER JOIN provider_specializations ps ON pp.id=ps.providerId AND ps.tradeCategoryId=:cid "
        params["cid"] = tradeCategoryId

    if verified:
        filters.append("pp.verificationStatus IN ('id_verified','certified','community_vouched')")
    if minRating is not None:
        filters.append("pp.averageRating >= :minRating")
        params["minRating"] = minRating
    if q:
        filters.append("(pp.bio LIKE :q OR u.name LIKE :q)")
        params["q"] = f"%{q}%"
    if location:
        filters.append("u.name LIKE :loc")  # simple fallback
        params["loc"] = f"%{location}%"

    where = " AND ".join(filters)
    order = {"rating": "pp.averageRating DESC", "experience": "pp.yearsOfExperience DESC", "recent": "pp.createdAt DESC"}.get(sortBy or "", "pp.averageRating DESC")
    rows = db.execute(text(f"{base}WHERE {where} ORDER BY {order} LIMIT :lim OFFSET :off"), params).mappings().all()
    return [dict(r) for r in rows]


@router.get("/verified")
def list_verified(limit: int = Query(20), offset: int = Query(0), db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_verified_providers(db, limit, offset)


@router.get("/me")
def get_my_profile(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    return crud.get_provider_profile(db, user["sub"])


@router.get("/me/earnings")
def get_earnings(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Not found")
    return crud.get_provider_earnings(db, profile["id"])


@router.get("/me/earnings/total")
def get_total_earnings(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Not found")
    return crud.get_total_provider_earnings(db, profile["id"])


@router.get("/{provider_id}/specializations")
def get_specializations(provider_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_provider_specializations(db, provider_id)


@router.get("/{provider_id}/portfolio")
def get_portfolio(provider_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_provider_portfolio(db, provider_id)


@router.get("/me/portfolio")
def get_my_portfolio(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Provider profile not found")
    return crud.get_provider_portfolio(db, profile["id"])


@router.post("/me/portfolio")
async def add_portfolio_item(
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    mediaType: Optional[str] = Form(default="image"),
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Provider profile not found")

    if mediaType not in ("image", "video"):
        raise HTTPException(400, "Invalid media type")

    portfolio = crud.get_provider_portfolio(db, profile["id"])
    images = [item for item in portfolio if item.get("mediaType") == "image"]
    videos = [item for item in portfolio if item.get("mediaType") == "video"]
    if mediaType == "image" and len(images) >= 4:
        raise HTTPException(400, "You can upload up to 4 portfolio images")
    if mediaType == "video" and len(videos) >= 1:
        raise HTTPException(400, "You can upload only one portfolio video")

    media_url = await _upload_to_cloudinary(file, user["sub"])
    item = crud.create_provider_portfolio_item(db, {
        "providerId": profile["id"],
        "mediaUrl": media_url,
        "mediaType": mediaType,
        "title": title,
        "description": description,
    })
    return item


@router.delete("/me/portfolio/{item_id}")
def delete_portfolio_item(item_id: int, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Provider profile not found")
    item = crud.get_provider_portfolio_item(db, item_id)
    if not item or item["providerId"] != profile["id"]:
        raise HTTPException(404, "Portfolio item not found")
    crud.delete_provider_portfolio_item(db, item_id)
    return {"success": True}


@router.get("/{provider_id}/reviews")
def get_reviews(provider_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    rows = db.execute(text(
        "SELECT r.*, u.name as customerName FROM reviews r "
        "JOIN customer_profiles cp ON r.customerId=cp.id "
        "JOIN users u ON cp.userId=u.id "
        "WHERE r.providerId=:pid ORDER BY r.createdAt DESC"
    ), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


@router.get("/{provider_id}")
def get_by_id(provider_id: int, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(503, "Database unavailable")
    row = db.execute(text(
        "SELECT pp.*, u.name as userName, u.phone as userPhone, u.email as userEmail "
        "FROM provider_profiles pp JOIN users u ON pp.userId=u.id WHERE pp.id=:id LIMIT 1"
    ), {"id": provider_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Not found")
    return dict(row)


@router.post("")
def create_profile(body: CreateProviderProfile, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    if crud.get_provider_profile(db, user["sub"]):
        raise HTTPException(400, "Profile already exists")
    return crud.create_provider_profile(db, {
        "userId": user["sub"],
        "bio": body.bio,
        "yearsOfExperience": body.yearsOfExperience,
        "hourlyRate": float(body.hourlyRate) if body.hourlyRate else None,
        "serviceAreaRadius": body.serviceAreaRadius,
        "serviceAreaLatitude": float(body.serviceAreaLatitude) if body.serviceAreaLatitude else None,
        "serviceAreaLongitude": float(body.serviceAreaLongitude) if body.serviceAreaLongitude else None,
        "plan": body.plan or "Premium",
        "serviceRegions": body.serviceRegions or [],
    })


@router.patch("/me")
def update_profile(body: UpdateProviderProfile, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Provider profile not found")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "hourlyRate" in updates:
        updates["hourlyRate"] = float(updates["hourlyRate"])
    if "serviceRegions" in updates:
        plan = profile.get("plan", "Premium")
        regions = updates["serviceRegions"] or []
        limits = {"Premium": 2, "Gold": 8, "Diamond": 16}
        limit = limits.get(plan, 2)
        if plan != "Diamond" and len(regions) > limit:
            raise HTTPException(400, f"{plan} plan allows a maximum of {limit} regions")
        updates["serviceRegions"] = regions
    return crud.update_provider_profile(db, profile["id"], updates)
