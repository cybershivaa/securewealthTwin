from __future__ import annotations

import base64
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..crypto.aead import encrypt
from ..crypto.envelope import request_aad
from ..services.fraud_adapter import FRAUD_ADAPTER
from ..crypto.session_store import SESSION_STORE
from ..db.database import get_db
from ..db.models import SecurePayloadRecord


router = APIRouter(prefix="/fraud", tags=["fraud"])


def _extract_secure_context(request: Request) -> tuple[dict, object]:
    secure_body = getattr(request.state, "secure_body", None)
    envelope = getattr(request.state, "secure_envelope", None)
    if not secure_body or not envelope:
        raise HTTPException(status_code=401, detail="Encrypted payload required")

    session = SESSION_STORE.get(envelope.session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    return secure_body, envelope


async def _store_event(request: Request, db: AsyncSession, channel: str) -> dict[str, str | int]:
    secure_body, envelope = _extract_secure_context(request)
    session = SESSION_STORE.get(envelope.session_id)
    assert session is not None
    normalized = FRAUD_ADAPTER.normalize(secure_body, channel)

    aad = request_aad(envelope.session_id, envelope.request_id, envelope.timestamp, request.method, request.url.path)
    payload_json = json.dumps(secure_body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    encrypted = encrypt(payload_json, session.session_key, aad)

    risk_score = normalized.risk_score
    label = secure_body.get("label") or secure_body.get("fraud_type") or FRAUD_ADAPTER.route_name(channel)
    record = SecurePayloadRecord(
        session_id=envelope.session_id,
        request_id=envelope.request_id,
        key_id="session-key",
        aad_hash=base64.b64encode(aad).decode("ascii"),
        iv=base64.b64decode(encrypted.iv_b64),
        ciphertext=base64.b64decode(encrypted.ciphertext_b64),
        metadata_json=json.dumps(
            {
                "channel": channel,
                "label": label,
                "risk_score": risk_score,
                "device_id": normalized.device_id,
                "subject": normalized.user_id,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            },
            separators=(",", ":"),
        ),
    )
    db.add(record)
    await db.commit()
    return {
        "status": "stored",
        "request_id": envelope.request_id,
        "channel": channel,
        "risk_score": risk_score,
    }


@router.post("/sms")
async def ingest_sms(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, str | int]:
    return await _store_event(request, db, "sms")


@router.post("/email")
async def ingest_email(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, str | int]:
    return await _store_event(request, db, "email")


@router.post("/voice")
async def ingest_voice(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, str | int]:
    return await _store_event(request, db, "voice")


@router.post("/semantic")
async def ingest_semantic(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, str | int]:
    return await _store_event(request, db, "semantic")


@router.post("/feedback")
async def ingest_feedback(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, str | int]:
    return await _store_event(request, db, "feedback")
