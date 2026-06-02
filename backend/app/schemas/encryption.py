from __future__ import annotations

from pydantic import BaseModel, Field


class HandshakeRequest(BaseModel):
    client_nonce_b64: str = Field(min_length=8)
    kem_ciphertext_b64: str = Field(min_length=8)
    client_dilithium_public_b64: str = Field(min_length=8)
    device_id: str = Field(min_length=8, max_length=128)


class HandshakeResponse(BaseModel):
    session_id: str
    server_nonce_b64: str
    server_kyber_public_b64: str
    server_dilithium_public_b64: str
    server_signature_b64: str


class SecureRequest(BaseModel):
    version: str
    session_id: str
    request_id: str
    timestamp: str
    nonce_b64: str
    aad_b64: str
    ciphertext_b64: str
    signature_b64: str


class SecureResponse(BaseModel):
    version: str
    session_id: str
    request_id: str
    timestamp: str
    nonce_b64: str
    aad_b64: str
    ciphertext_b64: str
    signature_b64: str
