import os
import json
from datetime import datetime, timezone

import redis


REDIS_URL = os.getenv("REDIS_URL", "")
OTP_TTL_SECONDS = int(os.getenv("OTP_TTL_SECONDS", "600"))  # default 10 minutes


class RedisOTPStore:
    def __init__(self) -> None:
        if not REDIS_URL:
            # App can still run without OTP/forgot; endpoints will error clearly.
            self._client = None
            return
        self._client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

    def _require(self):
        if not self._client:
            raise RuntimeError("REDIS_URL is not configured")
        return self._client

    def make_key(self, purpose: str, email: str | None, phone: str | None) -> str:
        # Keep keys stable and namespaced
        safe_email = (email or "").strip().lower()
        safe_phone = (phone or "").strip()
        return f"boafo:otp:{purpose}:email:{safe_email}:phone:{safe_phone}"

    def set_otp(self, key: str, otp: str, meta: dict | None = None) -> None:
        c = self._require()
        payload = {
            "otp": otp,
            "meta": meta or {},
            "setAt": datetime.now(timezone.utc).isoformat(),
        }
        c.setex(key, OTP_TTL_SECONDS, json.dumps(payload))

    def get_otp_payload(self, key: str) -> dict | None:
        c = self._require()
        raw = c.get(key)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None

    def delete_key(self, key: str) -> None:
        c = self._require()
        c.delete(key)


store = RedisOTPStore()


def otp_store_required() -> RedisOTPStore:
    # Helper for endpoints: fail with a clear message if Redis isn't configured.
    if getattr(store, "_client", None) is None:
        raise RuntimeError("Redis OTP store is not configured. Set REDIS_URL in backend env.")
    return store


