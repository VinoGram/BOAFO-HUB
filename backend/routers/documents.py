from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import require_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional
import os, uuid, base64

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UploadDocumentBody(BaseModel):
    documentType: str   # "national_id" | "trade_cert" | "portfolio_photo" | "other"
    fileBase64: str     # base64-encoded file
    fileName: str
    mimeType: str = "image/jpeg"


@router.post("")
def upload_document(body: UploadDocumentBody, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")

    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        raise HTTPException(404, "Provider profile not found")

    # Decode and save file
    try:
        file_data = base64.b64decode(body.fileBase64)
    except Exception:
        raise HTTPException(400, "Invalid base64 file data")

    ext = body.fileName.rsplit(".", 1)[-1] if "." in body.fileName else "jpg"
    file_key = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, file_key)
    with open(file_path, "wb") as f:
        f.write(file_data)

    file_url = f"/uploads/{file_key}"

    # Store in provider_documents table
    row = db.execute(text(
        'INSERT INTO provider_documents ("providerId", "documentType", "fileUrl", "fileName", status) '
        "VALUES (:pid, :dtype, :url, :name, 'pending_review') RETURNING id"
    ), {"pid": profile["id"], "dtype": body.documentType, "url": file_url, "name": body.fileName}).mappings().first()
    db.commit()
    return {"success": True, "documentId": row["id"] if row else 0, "fileUrl": file_url}


@router.get("/mine")
def get_my_documents(request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        return []
    profile = crud.get_provider_profile(db, user["sub"])
    if not profile:
        return []
    rows = db.execute(text(
        'SELECT * FROM provider_documents WHERE "providerId"=:pid ORDER BY "createdAt" DESC'
    ), {"pid": profile["id"]}).mappings().all()
    return [dict(r) for r in rows]


@router.get("/provider/{provider_id}")
def get_provider_documents(provider_id: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        return []
    rows = db.execute(text(
        'SELECT * FROM provider_documents WHERE "providerId"=:pid ORDER BY "createdAt" DESC'
    ), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


@router.post("/{doc_id}/approve")
def approve_document(doc_id: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    db.execute(text("UPDATE provider_documents SET status='approved' WHERE id=:id"), {"id": doc_id})
    db.commit()

    # Check if provider should be upgraded
    doc = db.execute(text("SELECT * FROM provider_documents WHERE id=:id LIMIT 1"), {"id": doc_id}).mappings().first()
    if doc:
        _recalculate_verification(db, doc["providerId"])

    return {"success": True}


@router.post("/{doc_id}/reject")
def reject_document(doc_id: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    db.execute(text("UPDATE provider_documents SET status='rejected' WHERE id=:id"), {"id": doc_id})
    db.commit()
    return {"success": True}


def _recalculate_verification(db: Session, provider_id: int):
    """
    Tiered badge:
    - any approved doc        → pending (was unverified)
    - approved national_id    → id_verified
    - approved id + cert      → certified
    - certified + 3+ reviews  → community_vouched
    """
    docs = db.execute(text(
        'SELECT "documentType" FROM provider_documents WHERE "providerId"=:pid AND status=\'approved\''
    ), {"pid": provider_id}).mappings().all()
    types = {r["documentType"] for r in docs}

    review_count = db.execute(text(
        'SELECT COUNT(*) as cnt FROM reviews WHERE "providerId"=:pid'
    ), {"pid": provider_id}).mappings().first()
    reviews = review_count["cnt"] if review_count else 0

    if "national_id" in types and ("trade_cert" in types or "apprenticeship_cert" in types) and reviews >= 3:
        status = "community_vouched"
    elif "national_id" in types and ("trade_cert" in types or "apprenticeship_cert" in types):
        status = "certified"
    elif "national_id" in types:
        status = "id_verified"
    elif types:
        status = "pending"
    else:
        return

    db.execute(text('UPDATE provider_profiles SET "verificationStatus"=:s WHERE id=:pid'), {"s": status, "pid": provider_id})
    db.commit()
