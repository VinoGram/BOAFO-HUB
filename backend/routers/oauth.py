import os
import httpx
import base64
from fastapi import APIRouter, Request, Response, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from fastapi import Depends
import backend.crud as crud
from jose import jwt
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/oauth", tags=["oauth"])

COOKIE_NAME = "app_session_id"
ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

OAUTH_SERVER_URL = os.getenv("OAUTH_SERVER_URL", "")
APP_ID = os.getenv("VITE_APP_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")


def _decode_state(state: str) -> str:
    return base64.b64decode(state).decode()


async def _exchange_code(code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{OAUTH_SERVER_URL}/webdev.v1.WebDevAuthPublicService/ExchangeToken",
            json={"clientId": APP_ID, "grantType": "authorization_code", "code": code, "redirectUri": redirect_uri},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def _get_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{OAUTH_SERVER_URL}/webdev.v1.WebDevAuthPublicService/GetUserInfo",
            json={"accessToken": access_token},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


def _create_session_token(open_id: str, name: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(seconds=ONE_YEAR_SECONDS)
    return jwt.encode(
        {"sub": open_id, "name": name, "exp": exp},
        JWT_SECRET,
        algorithm="HS256",
    )


@router.get("/callback")
async def oauth_callback(code: str = None, state: str = None, response: Response = None, db: Session = Depends(get_db)):
    if not code or not state:
        raise HTTPException(400, "code and state are required")
    try:
        redirect_uri = _decode_state(state)
        token_data = await _exchange_code(code, redirect_uri)
        user_info = await _get_user_info(token_data["accessToken"])

        open_id = user_info.get("openId")
        if not open_id:
            raise HTTPException(400, "openId missing from user info")

        if db:
            crud.upsert_user(db, open_id, name=user_info.get("name"), email=user_info.get("email"))

        session_token = _create_session_token(open_id, user_info.get("name", ""))
        response.set_cookie(
            COOKIE_NAME, session_token,
            max_age=ONE_YEAR_SECONDS, httponly=True, samesite="lax",
        )
        response.status_code = 302
        response.headers["location"] = "/"
        return response
    except Exception as e:
        raise HTTPException(500, f"OAuth callback failed: {e}")
