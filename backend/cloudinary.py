import os
import httpx
from fastapi import UploadFile, HTTPException

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")


async def _upload(file_bytes: bytes, filename: str, content_type: str, public_id: str) -> str:
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        raise HTTPException(500, "Cloudinary credentials are not configured")
    upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET")
    if not upload_preset:
        raise HTTPException(500, "CLOUDINARY_UPLOAD_PRESET is not configured")
    url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url,
            files={"file": (filename, file_bytes, content_type)},
            data={"upload_preset": upload_preset, "public_id": public_id},
        )
    resp.raise_for_status()
    body = resp.json()
    return body.get("secure_url") or body.get("url") or ""


async def upload_to_cloudinary(file: UploadFile, user_id: int) -> str:
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file upload")
    return await _upload(file_bytes, file.filename or "profile", file.content_type or "image/jpeg", f"user_{user_id}_profile")


async def upload_image(file: UploadFile, folder: str, public_id: str) -> str:
    """Generic image upload. Returns the secure URL."""
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file upload")
    return await _upload(file_bytes, file.filename or "image", file.content_type or "image/jpeg", f"{folder}/{public_id}")