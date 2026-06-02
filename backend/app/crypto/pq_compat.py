from __future__ import annotations

import base64
import importlib
from typing import Tuple

# This module normalizes pqcrypto API differences across distributions


def _import_kem():
    # Prefer Kyber-like names, fall back to ml_kem_768/512/1024
    kem_candidates = [
        ("pqcrypto.kem.kyber768", "kyber768"),
        ("pqcrypto.kem.ml_kem_768", "ml_kem_768"),
        ("pqcrypto.kem.ml_kem_512", "ml_kem_512"),
        ("pqcrypto.kem.ml_kem_1024", "ml_kem_1024"),
    ]
    for module_path, _ in kem_candidates:
        try:
            m = importlib.import_module(module_path)
            return m
        except Exception:
            continue
    raise ImportError("No supported KEM module found in pqcrypto")


def _import_sign():
    sign_candidates = [
        ("pqcrypto.sign.dilithium2", "dilithium2"),
        ("pqcrypto.sign.ml_dsa_44", "ml_dsa_44"),
        ("pqcrypto.sign.falcon_512", "falcon_512"),
    ]
    for module_path, _ in sign_candidates:
        try:
            m = importlib.import_module(module_path)
            return m
        except Exception:
            continue
    raise ImportError("No supported sign module found in pqcrypto")


_KEM = _import_kem()
_SIGN = _import_sign()


def generate_kem_keypair() -> Tuple[bytes, bytes]:
    return _KEM.generate_keypair()


def kem_encrypt(public_key: bytes) -> Tuple[bytes, bytes]:
    # returns (ciphertext, shared_secret) or variant depending on implementation
    out = _KEM.encrypt(public_key)
    if isinstance(out, tuple) and len(out) == 2:
        return out[0], out[1]
    # some implementations return a tuple-like object, coerce
    return out


def kem_decrypt(secret_key: bytes, ciphertext: bytes) -> bytes:
    # Some implementations return the shared secret directly
    return _KEM.decrypt(secret_key, ciphertext)


def generate_sign_keypair() -> Tuple[bytes, bytes]:
    return _SIGN.generate_keypair()


def sign(secret_key: bytes, message: bytes) -> bytes:
    # Try common signatures: sign(secret, message) or sign(message, secret)
    try:
        return _SIGN.sign(secret_key, message)
    except Exception:
        return _SIGN.sign(message, secret_key)


def verify(public_key: bytes, message: bytes, signature: bytes) -> bool:
    # Try common verify(public, message, signature) or verify(signature, message, public)
    try:
        return bool(_SIGN.verify(public_key, message, signature))
    except Exception:
        try:
            return bool(_SIGN.verify(signature, message, public_key))
        except Exception:
            return False
