from fastapi import APIRouter, Depends, HTTPException, Request, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import require_user, get_current_user
from typing import List, Optional
import uuid
from backend.cloudinary import upload_image

router = APIRouter(prefix="/api/feed", tags=["feed"])


# ── Feed Posts ────────────────────────────────────────────────────────────────

@router.get("")
def list_posts(limit: int = Query(20), offset: int = Query(0), db: Session = Depends(get_db)):
    if not db:
        return []
    rows = db.execute(text(
        'SELECT fp.*, u.name as "authorName", u."profilePictureUrl" as "authorAvatar", u.role as "authorRole" '
        'FROM feed_posts fp JOIN users u ON fp."authorId"=u.id '
        'ORDER BY fp."createdAt" DESC LIMIT :lim OFFSET :off'
    ), {"lim": limit, "off": offset}).mappings().all()
    return [dict(r) for r in rows]


@router.post("")
async def create_post(
    request: Request,
    db: Session = Depends(get_db),
    content: str = Form(...),
    images: List[UploadFile] = File(default=[]),
):
    user = require_user(request)
    if user.get("role") != "customer":
        raise HTTPException(403, "Only clients can create feed posts")
    if not db:
        raise HTTPException(503, "Database unavailable")

    image_urls: list[str] = []
    for img in images:
        if img and img.filename:
            url = await upload_image(img, "feed", f"post_{user['sub']}_{uuid.uuid4().hex[:8]}")
            image_urls.append(url)

    row = db.execute(text(
        'INSERT INTO feed_posts ("authorId", content, "imageUrls") '
        'VALUES (:authorId, :content, :imageUrls) RETURNING id, "createdAt"'
    ), {"authorId": int(user["sub"]), "content": content, "imageUrls": image_urls}).mappings().first()
    db.commit()
    return {"success": True, "postId": row["id"] if row else 0}


@router.delete("/{post_id}")
def delete_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    row = db.execute(text('SELECT "authorId" FROM feed_posts WHERE id=:id LIMIT 1'), {"id": post_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Post not found")
    if str(row["authorId"]) != str(user["sub"]) and user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    db.execute(text("DELETE FROM feed_posts WHERE id=:id"), {"id": post_id})
    db.commit()
    return {"success": True}


# ── Comments ──────────────────────────────────────────────────────────────────

@router.get("/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    if not db:
        return []
    rows = db.execute(text(
        'SELECT fc.*, u.name as "authorName", u."profilePictureUrl" as "authorAvatar", u.role as "authorRole" '
        'FROM feed_comments fc JOIN users u ON fc."authorId"=u.id '
        'WHERE fc."postId"=:pid ORDER BY fc."createdAt" ASC'
    ), {"pid": post_id}).mappings().all()
    return [dict(r) for r in rows]


@router.post("/{post_id}/comments")
def add_comment(post_id: int, request: Request, db: Session = Depends(get_db), content: str = Form(...)):
    user = require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    db.execute(text(
        'INSERT INTO feed_comments ("postId", "authorId", content) VALUES (:pid, :aid, :content)'
    ), {"pid": post_id, "aid": int(user["sub"]), "content": content})
    db.commit()
    return {"success": True}
