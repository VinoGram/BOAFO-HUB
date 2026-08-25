import os
import httpx
from fastapi import UploadFile, HTTPException

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

async def upload_to_cloudinary(file: UploadFile, user_id: int) -> str:
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        # In a real app, you might want to log this error instead of exposing it.
        raise HTTPException(500, "Cloudinary credentials are not configured")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file upload")

    url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload"
    upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET")
    if not upload_preset:
        raise HTTPException(500, "CLOUDINARY_UPLOAD_PRESET is not configured")

    files = {"file": (file.filename, file_bytes, file.content_type)}
    data = {"upload_preset": upload_preset, "public_id": f"user_{user_id}_profile"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, files=files, data=data)
    
    response.raise_for_status()
    body = response.json()
    return body.get("secure_url") or body.get("url") or ""