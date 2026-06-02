from __future__ import annotations

import base64
import json
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any, Awaitable

from fastapi import HTTPException, Request, Response
try:
    from pqcrypto.sign import dilithium2  # preferred when available
except Exception:
    # Fallback for environments where Dilithium isn't provided by pqcrypto
    from pqcrypto.sign import ml_dsa_44 as dilithium2
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.config import get_settings
from ..crypto.aead import AeadPayload, decrypt, encrypt
from ..crypto.envelope import SecureEnvelope, canonical_json, request_aad
from ..crypto.nonce_store import NONCE_STORE
from ..crypto.pq import load_dilithium_private_key, load_dilithium_public_key
from ..crypto.pq_compat import verify as pq_verify, sign as pq_sign
from ..crypto.session_store import SESSION_STORE


settings = get_settings()


class InMemoryReplayGuard:
    def __init__(self) -> None:
        self._seen: dict[str, float] = {}

    def mark(self, request_id: str, ttl_seconds: int) -> bool:
        now = datetime.now(timezone.utc).timestamp()
        self._seen = {key: expiry for key, expiry in self._seen.items() if expiry > now}
        if request_id in self._seen:
            return False
        self._seen[request_id] = now + ttl_seconds
        return True


class EncryptionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        if request.url.path in {"/health", "/docs", "/openapi.json", "/secure/handshake", "/secure/public-keys"}:
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

        envelope = await self._decode_request(request)
        session = SESSION_STORE.get(envelope.session_id)
        if not session:
            raise HTTPException(status_code=401, detail="Invalid secure session")

        # Validate request_id is unique (prevent request ID reuse)
        if not SESSION_STORE.mark_request(envelope.request_id, settings.request_ttl_seconds):
            raise HTTPException(status_code=409, detail="Replay detected: request_id already seen")

        # Validate nonce is unique and timestamp is fresh (prevent full replay)
        timestamp = datetime.fromisoformat(envelope.timestamp)
        try:
            if not NONCE_STORE.validate_and_store(envelope.nonce_b64, timestamp):
                raise HTTPException(status_code=409, detail="Replay detected: nonce already seen or timestamp stale")
        except ValueError as e:
            raise HTTPException(status_code=401, detail=f"Invalid timestamp: {e}") from e

        delta = abs((datetime.now(timezone.utc) - timestamp).total_seconds())
        if delta > settings.clock_skew_seconds:
            raise HTTPException(status_code=401, detail="Timestamp outside allowable window")

        expected_aad = request_aad(envelope.session_id, envelope.request_id, envelope.timestamp, request.method, request.url.path)
        if expected_aad != base64.b64decode(envelope.aad_b64):
            raise HTTPException(status_code=401, detail="AAD validation failed")

        if not self._verify_signature(request, envelope, session):
            raise HTTPException(status_code=401, detail="Invalid secure signature")

        request.state.secure_envelope = envelope
        request.state.session_context = session
        request.state.secure_body = self._decrypt_envelope(envelope, session.session_key)
        response = await call_next(request)
        return await self._encrypt_response(request, response)

    async def _decode_request(self, request: Request) -> SecureEnvelope:
        body = await request.body()
        if not body:
            raise HTTPException(status_code=400, detail="Encrypted request body is required")
        try:
            raw = json.loads(body.decode("utf-8"))
            return SecureEnvelope(**raw)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail="Malformed secure envelope") from exc

    def _decrypt_envelope(self, envelope: SecureEnvelope, session_key: bytes) -> dict[str, Any]:
        plaintext = decrypt(AeadPayload(iv_b64=envelope.nonce_b64, ciphertext_b64=envelope.ciphertext_b64), session_key, envelope.aad_bytes())
        return json.loads(plaintext.decode("utf-8"))

    def _verify_signature(self, request: Request, envelope: SecureEnvelope, session) -> bool:
        payload = canonical_json({
            "version": envelope.version,
            "session_id": envelope.session_id,
            "request_id": envelope.request_id,
            "timestamp": envelope.timestamp,
            "nonce_b64": envelope.nonce_b64,
            "aad_b64": envelope.aad_b64,
            "ciphertext_b64": envelope.ciphertext_b64,
        })
        verification_key = load_dilithium_public_key(session.client_dilithium_public_b64)
        try:
            # Support different pqcrypto signing APIs: try common orders
            try:
                if not pq_verify(verification_key, payload, envelope.signature_bytes()):
                    return False
            except Exception:
                return False
            return True
        except Exception:  # noqa: BLE001
            return False

    async def _encrypt_response(self, request: Request, response: Response) -> Response:
        if response.status_code >= 400:
            return response

        session = request.state.session_context
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        if not body:
            return response

        response_aad = canonical_json({
            "session_id": request.state.secure_envelope.session_id,
            "request_id": request.state.secure_envelope.request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "method": request.method,
            "path": request.url.path,
        })
        encrypted = encrypt(body, session.session_key, response_aad)
        # Sign using whatever pqcrypto API shape is available
        message = canonical_json({
            "version": request.state.secure_envelope.version,
            "session_id": request.state.secure_envelope.session_id,
            "request_id": request.state.secure_envelope.request_id,
            "timestamp": request.state.secure_envelope.timestamp,
            "nonce_b64": encrypted.iv_b64,
            "aad_b64": base64.b64encode(response_aad).decode("ascii"),
            "ciphertext_b64": encrypted.ciphertext_b64,
        })
        private_bytes = load_dilithium_private_key(settings.server_dilithium_private_b64)
        signed = pq_sign(private_bytes, message)

        encrypted_response = {
            "version": request.state.secure_envelope.version,
            "session_id": request.state.secure_envelope.session_id,
            "request_id": request.state.secure_envelope.request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "nonce_b64": encrypted.iv_b64,
            "aad_b64": base64.b64encode(response_aad).decode("ascii"),
            "ciphertext_b64": encrypted.ciphertext_b64,
            "signature_b64": base64.b64encode(signed).decode("ascii"),
        }
        return Response(content=json.dumps(encrypted_response), media_type="application/json", status_code=response.status_code)
