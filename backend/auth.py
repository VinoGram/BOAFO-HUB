import os
from jose import jwt, JWTError
from fastapi import Request, HTTPException

COOKIE_NAME = "app_session_id"
JWT_SECRET = os.getenv("JWT_SECRET", "")


def _extract_token(request: Request) -> str | None:
    """Bearer header first (tab-isolated sessionStorage), cookie as fallback."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.cookies.get(COOKIE_NAME)


def get_current_user(request: Request) -> dict | None:
    token = _extract_token(request)
    if not token or not JWT_SECRET:
        return None
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        return None


def require_user(request: Request) -> dict:
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Please login (10001)")
    return user
