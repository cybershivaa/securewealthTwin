from __future__ import annotations

import base64
import json
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
try:
    from pqcrypto.kem import kyber768
except Exception:
    from pqcrypto.kem import ml_kem_768 as kyber768

try:
    from pqcrypto.sign import dilithium2
except Exception:
    from pqcrypto.sign import ml_dsa_44 as dilithium2
from sqlalchemy.ext.asyncio import AsyncSession

from ..crypto.pq_compat import kem_encrypt, kem_decrypt, generate_kem_keypair, sign as pq_sign, generate_sign_keypair

from ..auth.jwt import create_access_token
from ..core.config import get_settings
from ..crypto.aead import encrypt
from ..crypto.envelope import request_aad
from ..crypto.pq import hkdf_derive
from ..db.database import get_db
from ..db.models import SecurePayloadRecord
from ..crypto.session_store import SESSION_STORE, SessionContext
from ..schemas.encryption import HandshakeRequest, HandshakeResponse


settings = get_settings()
router = APIRouter(prefix="/secure", tags=["secure"])


@router.get("/public-keys", response_model=HandshakeResponse)
async def get_public_keys() -> HandshakeResponse:
    server_nonce = uuid4().bytes + uuid4().bytes[:4]
    payload = base64.b64encode(server_nonce).decode("ascii")
    signature = b""
    if settings.server_dilithium_private_b64:
        signature = dilithium2.sign(payload.encode("utf-8"), base64.b64decode(settings.server_dilithium_private_b64))
    return HandshakeResponse(
        session_id="bootstrap",
        server_nonce_b64=payload,
        server_kyber_public_b64=settings.server_kyber_public_b64,
        server_dilithium_public_b64=settings.server_dilithium_public_b64,
        server_signature_b64=base64.b64encode(signature).decode("ascii") if signature else "",
    )


@router.post("/handshake", response_model=HandshakeResponse)
async def handshake(request: HandshakeRequest) -> HandshakeResponse:
    if not settings.server_kyber_private_b64:
        raise HTTPException(status_code=500, detail="Kyber private key is not configured")

    server_nonce = uuid4().bytes
    shared_secret = kem_decrypt(base64.b64decode(settings.server_kyber_private_b64), base64.b64decode(request.kem_ciphertext_b64))
    derived_key = hkdf_derive(shared_secret, salt=base64.b64decode(request.client_nonce_b64), info=b"SecureWealth Twin session key")
    session_id = str(uuid4())
    session_context = SessionContext(
        session_key=derived_key,
        server_nonce=server_nonce,
        client_nonce=base64.b64decode(request.client_nonce_b64),
        device_id=request.device_id,
        client_dilithium_public_b64=request.client_dilithium_public_b64,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    SESSION_STORE.set(session_id, session_context)

    payload_bytes = json.dumps({
        "session_id": session_id,
        "client_nonce_b64": request.client_nonce_b64,
        "server_nonce_b64": base64.b64encode(server_nonce).decode("ascii"),
        "device_id": request.device_id,
    }, sort_keys=True, separators=(",", ":")).encode("utf-8")
    private_bytes = base64.b64decode(settings.server_dilithium_private_b64)
    signature = pq_sign(private_bytes, payload_bytes)
    return HandshakeResponse(
        session_id=session_id,
        server_nonce_b64=base64.b64encode(server_nonce).decode("ascii"),
        server_kyber_public_b64=settings.server_kyber_public_b64,
        server_dilithium_public_b64=settings.server_dilithium_public_b64,
        server_signature_b64=base64.b64encode(signature).decode("ascii"),
    )


@router.post("/session/token")
async def issue_session_token(request: Request) -> dict[str, str]:
    secure_body = getattr(request.state, "secure_body", None)
    if not secure_body:
        raise HTTPException(status_code=401, detail="Encrypted payload required")
    subject = secure_body.get("user_id")
    device_id = secure_body.get("device_id")
    session_id = secure_body.get("session_id")
    if not subject or not device_id or not session_id:
        raise HTTPException(status_code=400, detail="Missing claims")
    token = create_access_token(subject=subject, session_id=session_id, device_id=device_id, scopes=["secure:write"])
    return {"access_token": token, "token_type": "bearer"}


@router.post("/fraud-payload")
async def ingest_secure_payload(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    secure_body = getattr(request.state, "secure_body", None)
    envelope = getattr(request.state, "secure_envelope", None)
    if not secure_body or not envelope:
        raise HTTPException(status_code=401, detail="Encrypted payload required")

    aad = request_aad(envelope.session_id, envelope.request_id, envelope.timestamp, request.method, request.url.path)
    payload_json = json.dumps(secure_body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    session = SESSION_STORE.get(envelope.session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    encrypted = encrypt(payload_json, session.session_key, aad)
    record = SecurePayloadRecord(
        session_id=envelope.session_id,
        request_id=envelope.request_id,
        key_id="session-key",
        aad_hash=base64.b64encode(aad).decode("ascii"),
        iv=base64.b64decode(encrypted.iv_b64),
        ciphertext=base64.b64decode(encrypted.ciphertext_b64),
        metadata_json=json.dumps({"device_id": secure_body.get("device_id"), "subject": secure_body.get("user_id")}),
    )
    db.add(record)
    await db.commit()
    return {"status": "stored", "request_id": envelope.request_id}
