import os
import json
import httpx
from datetime import datetime, timezone
from fastapi import HTTPException

UPSTASH_URL   = os.getenv("UPSTASH_REDIS_REST_URL", "").rstrip("/")
UPSTASH_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

OTP_TTL_SECONDS = int(os.getenv("OTP_TTL_SECONDS", "600"))


class RedisOTPStore:
    def __init__(self) -> None:
        self._ready = bool(UPSTASH_URL and UPSTASH_TOKEN)

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {UPSTASH_TOKEN}"}

    def _cmd(self, *args) -> dict:
        """Execute a Redis command via Upstash REST API."""
        url = f"{UPSTASH_URL}/{'/'.join(str(a) for a in args)}"
        resp = httpx.post(url, headers=self._headers(), timeout=5)
        resp.raise_for_status()
        return resp.json()

    def make_key(self, purpose: str, email: str | None = None, phone: str | None = None) -> str:
        safe_email = (email or "").strip().lower()
        safe_phone = (phone or "").strip()
        return f"boafo:otp:{purpose}:email:{safe_email}:phone:{safe_phone}"

    def set_otp(self, key: str, otp: str, meta: dict | None = None) -> None:
        payload = json.dumps({
            "otp": otp,
            "meta": meta or {},
            "setAt": datetime.now(timezone.utc).isoformat(),
        })
        # SET key value EX ttl
        self._cmd("SET", key, payload, "EX", OTP_TTL_SECONDS)

    def get_otp_payload(self, key: str) -> dict | None:
        result = self._cmd("GET", key)
        raw = result.get("result")
        if not raw:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None

    def delete_key(self, key: str) -> None:
        self._cmd("DEL", key)


store = RedisOTPStore()


def otp_store_required() -> RedisOTPStore:
    if not store._ready:
        raise HTTPException(503, "OTP service unavailable: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured")
    return store
