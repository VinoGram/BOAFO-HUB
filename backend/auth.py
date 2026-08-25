import os
from jose import jwt, JWTError
from fastapi import Request, HTTPException

COOKIE_NAME = "app_session_id"
JWT_SECRET = os.getenv("JWT_SECRET", "")


def get_current_user(request: Request) -> dict | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token or not JWT_SECRET:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


def require_user(request: Request) -> dict:
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Please login (10001)")
    return user
