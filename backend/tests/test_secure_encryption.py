from __future__ import annotations

import base64
import json
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from app.crypto.pq_compat import generate_kem_keypair, kem_encrypt, kem_decrypt, generate_sign_keypair, sign as pq_sign

from app.core.config import get_settings
from app.crypto.aead import decrypt, encrypt
from app.crypto.envelope import request_aad
from app.crypto.pq import hkdf_derive
from app.crypto.session_store import SESSION_STORE
from app.main import app
from app.routes import secure as secure_routes


class _FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}

    def set(self, key: str, value: str, ex: int | None = None, nx: bool = False):
        if nx and key in self.values:
            return False
        self.values[key] = value
        return True

    def get(self, key: str):
        return self.values.get(key)


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _canonical(data: dict) -> bytes:
    return json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")


def test_end_to_end_encrypted_fraud_round_trip(monkeypatch):
    settings = get_settings()
    fake_redis = _FakeRedis()
    SESSION_STORE.redis_client = fake_redis
    # Also ensure the routes module SESSION_STORE uses the fake client
    secure_routes.SESSION_STORE.redis_client = fake_redis

    kyber_public, kyber_private = generate_kem_keypair()
    dilithium_public, dilithium_private = generate_sign_keypair()
    client_public, client_private = generate_sign_keypair()
    master_key = b"0" * 32

    monkeypatch.setattr(settings, "server_kyber_public_b64", _b64(kyber_public), raising=False)
    monkeypatch.setattr(settings, "server_kyber_private_b64", _b64(kyber_private), raising=False)
    monkeypatch.setattr(settings, "server_dilithium_public_b64", _b64(dilithium_public), raising=False)
    monkeypatch.setattr(settings, "server_dilithium_private_b64", _b64(dilithium_private), raising=False)
    monkeypatch.setattr(settings, "master_key_b64", _b64(master_key), raising=False)
    monkeypatch.setattr(settings, "api_signing_key_b64", _b64(master_key), raising=False)

    secure_routes.settings = settings
    client_nonce = b"client_nonce_123456789012"
    encapsulation_ciphertext, shared_secret = kem_encrypt(base64.b64decode(settings.server_kyber_public_b64))

    # Stub DB dependency to avoid external Postgres in tests
    async def _fake_get_db():
        class FakeSession:
            def add(self, obj):
                return None

            async def commit(self):
                return None

        yield FakeSession()

    from app.db import database as _db_mod
    _db_mod_get_db = _db_mod.get_db
    app.dependency_overrides[_db_mod_get_db] = _fake_get_db
    client = TestClient(app)
    handshake = client.post(
        "/secure/handshake",
        json={
            "client_nonce_b64": _b64(client_nonce),
            "kem_ciphertext_b64": _b64(encapsulation_ciphertext),
            "client_dilithium_public_b64": _b64(client_public),
            "device_id": "device-001",
        },
    )
    assert handshake.status_code == 200
    handshake_body = handshake.json()
    session_id = handshake_body["session_id"]
    session_key = hkdf_derive(shared_secret, salt=client_nonce, info=b"SecureWealth Twin session key")

    payload = {
        "user_id": "demo-user",
        "device_id": "device-001",
        "session_id": session_id,
        "risk_score": 92,
        "sms_text": "Verify immediately",
    }
    request_id = "req-001"
    timestamp = datetime.now(timezone.utc).isoformat()
    aad = request_aad(session_id, request_id, timestamp, "POST", "/fraud/sms")
    encrypted = encrypt(_canonical(payload), session_key, aad)
    signature = pq_sign(client_private, _canonical({
        "version": "1",
        "session_id": session_id,
        "request_id": request_id,
        "timestamp": timestamp,
        "nonce_b64": encrypted.iv_b64,
        "aad_b64": _b64(aad),
        "ciphertext_b64": encrypted.ciphertext_b64,
    }))

    response = client.post(
        "/fraud/sms",
        json={
            "version": "1",
            "session_id": session_id,
            "request_id": request_id,
            "timestamp": timestamp,
            "nonce_b64": encrypted.iv_b64,
            "aad_b64": _b64(aad),
            "ciphertext_b64": encrypted.ciphertext_b64,
            "signature_b64": _b64(signature),
        },
    )
    assert response.status_code == 200
    # response is an encrypted SecureEnvelope; decrypt then assert
    resp_env = response.json()
    from app.crypto.aead import AeadPayload, decrypt as aead_decrypt
    aad_bytes = base64.b64decode(resp_env["aad_b64"])
    payload = AeadPayload(iv_b64=resp_env["nonce_b64"], ciphertext_b64=resp_env["ciphertext_b64"])
    plaintext = aead_decrypt(payload, session_key, aad_bytes)
    body = json.loads(plaintext.decode("utf-8"))
    assert body["status"] == "stored"
    assert body["channel"] == "sms"

    stored_session = SESSION_STORE.get(session_id)
    assert stored_session is not None
    round_trip = decrypt(encrypted, session_key, aad)
    assert json.loads(round_trip.decode("utf-8"))["sms_text"] == "Verify immediately"
