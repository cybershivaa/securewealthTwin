from __future__ import annotations

import base64
import os
from dataclasses import dataclass

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _b64encode(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.b64decode(value.encode("ascii"))


def generate_key() -> bytes:
    return AESGCM.generate_key(bit_length=256)


def generate_nonce() -> bytes:
    return os.urandom(12)


@dataclass(frozen=True)
class AeadPayload:
    iv_b64: str
    ciphertext_b64: str


def encrypt(plaintext: bytes, key: bytes, aad: bytes | None = None) -> AeadPayload:
    nonce = generate_nonce()
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, aad)
    return AeadPayload(iv_b64=_b64encode(nonce), ciphertext_b64=_b64encode(ciphertext))


def decrypt(payload: AeadPayload, key: bytes, aad: bytes | None = None) -> bytes:
    nonce = _b64decode(payload.iv_b64)
    ciphertext = _b64decode(payload.ciphertext_b64)
    return AESGCM(key).decrypt(nonce, ciphertext, aad)
