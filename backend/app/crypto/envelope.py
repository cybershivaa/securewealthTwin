from __future__ import annotations

import base64
import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from hashlib import sha256
from uuid import uuid4


def _b64encode(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.b64decode(value.encode("ascii"))


def canonical_json(data: dict) -> bytes:
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def hash_bytes(data: bytes) -> str:
    return sha256(data).hexdigest()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def utc_isoformat() -> str:
    return now_utc().isoformat()


@dataclass(frozen=True)
class SecureEnvelope:
    version: str
    session_id: str
    request_id: str
    timestamp: str
    nonce_b64: str
    aad_b64: str
    ciphertext_b64: str
    signature_b64: str

    @classmethod
    def build(cls, session_id: str, aad: bytes, ciphertext: bytes, signature: bytes, nonce: bytes | None = None) -> "SecureEnvelope":
        return cls(
            version="1",
            session_id=session_id,
            request_id=str(uuid4()),
            timestamp=utc_isoformat(),
            nonce_b64=_b64encode(nonce or uuid4().bytes[:12]),
            aad_b64=_b64encode(aad),
            ciphertext_b64=_b64encode(ciphertext),
            signature_b64=_b64encode(signature),
        )

    def aad_bytes(self) -> bytes:
        return _b64decode(self.aad_b64)

    def ciphertext_bytes(self) -> bytes:
        return _b64decode(self.ciphertext_b64)

    def nonce_bytes(self) -> bytes:
        return _b64decode(self.nonce_b64)

    def signature_bytes(self) -> bytes:
        return _b64decode(self.signature_b64)

    def canonical_bytes(self) -> bytes:
        return canonical_json(asdict(self))


def request_aad(session_id: str, request_id: str, timestamp: str, method: str, path: str) -> bytes:
    return canonical_json({
        "session_id": session_id,
        "request_id": request_id,
        "timestamp": timestamp,
        "method": method.upper(),
        "path": path,
    })
