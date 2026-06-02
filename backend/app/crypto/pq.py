from __future__ import annotations

import base64
from dataclasses import dataclass

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF


def _b64encode(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.b64decode(value.encode("ascii"))


def hkdf_derive(shared_secret: bytes, salt: bytes, info: bytes, length: int = 32) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=length, salt=salt, info=info).derive(shared_secret)


@dataclass(frozen=True)
class KyberKeyMaterial:
    public_key_b64: str
    private_key_b64: str


@dataclass(frozen=True)
class DilithiumKeyMaterial:
    public_key_b64: str
    private_key_b64: str


def load_kyber_public_key(public_b64: str) -> bytes:
    return _b64decode(public_b64)


def load_dilithium_public_key(public_b64: str) -> bytes:
    return _b64decode(public_b64)


def load_dilithium_private_key(private_b64: str) -> bytes:
    return _b64decode(private_b64)
