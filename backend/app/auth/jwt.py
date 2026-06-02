from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import uuid4

from jose import jwt

from ..core.config import get_settings


settings = get_settings()


def _signing_key() -> str:
    if not settings.api_signing_key_b64:
        raise RuntimeError("API_SIGNING_KEY_B64 is not configured")
    return settings.api_signing_key_b64


def create_access_token(subject: str, session_id: str, device_id: str, scopes: list[str] | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": subject,
        "sid": session_id,
        "did": device_id,
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_access_ttl_seconds)).timestamp()),
        "jti": str(uuid4()),
        "scp": scopes or [],
    }
    return jwt.encode(payload, _signing_key(), algorithm="HS256")


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        _signing_key(),
        algorithms=["HS256"],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
        options={"require_aud": True, "require_iat": True, "require_exp": True},
    )


def token_fingerprint(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()
