from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from datetime import datetime

from redis import Redis

from ..core.config import get_settings


settings = get_settings()


@dataclass
class SessionContext:
    session_key: bytes
    server_nonce: bytes
    client_nonce: bytes
    device_id: str
    client_dilithium_public_b64: str
    expires_at: datetime

    def to_dict(self) -> dict:
        return {
            "session_key_b64": base64.b64encode(self.session_key).decode("ascii"),
            "server_nonce_b64": base64.b64encode(self.server_nonce).decode("ascii"),
            "client_nonce_b64": base64.b64encode(self.client_nonce).decode("ascii"),
            "device_id": self.device_id,
            "client_dilithium_public_b64": self.client_dilithium_public_b64,
            "expires_at": self.expires_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, payload: dict) -> "SessionContext":
        return cls(
            session_key=base64.b64decode(payload["session_key_b64"]),
            server_nonce=base64.b64decode(payload["server_nonce_b64"]),
            client_nonce=base64.b64decode(payload["client_nonce_b64"]),
            device_id=payload["device_id"],
            client_dilithium_public_b64=payload["client_dilithium_public_b64"],
            expires_at=datetime.fromisoformat(payload["expires_at"]),
        )


class SecureSessionStore:
    def __init__(self) -> None:
        self.sessions: dict[str, SessionContext] = {}
        self.redis_client = Redis.from_url(settings.redis_url, decode_responses=True)

    def set(self, session_id: str, session: SessionContext) -> None:
        ttl_seconds = max(1, int((session.expires_at - datetime.now(session.expires_at.tzinfo)).total_seconds()))
        payload = json.dumps(session.to_dict(), separators=(",", ":"))
        self.redis_client.set(f"securewealth:session:{session_id}", payload, ex=ttl_seconds)
        self.sessions[session_id] = session

    def get(self, session_id: str) -> SessionContext | None:
        cached = self.redis_client.get(f"securewealth:session:{session_id}")
        if cached:
            return SessionContext.from_dict(json.loads(cached))
        return self.sessions.get(session_id)

    def mark_request(self, request_id: str, ttl_seconds: int) -> bool:
        key = f"securewealth:replay:{request_id}"
        return bool(self.redis_client.set(key, "1", nx=True, ex=ttl_seconds))


SESSION_STORE = SecureSessionStore()
