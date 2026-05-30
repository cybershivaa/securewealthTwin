"""Generate new PQ key material and rotate server keys.

Usage:
    python scripts/key_rotate.py

This script is intended for operational use (run in a secure environment).
It will generate a new KEM keypair (Kyber) and a new signing keypair (Dilithium),
create a new random master key, and store them via the KeyManager (local file and KMS stub).
"""
import base64
import os
import secrets
from app.crypto.pq_compat import generate_kem_keypair, generate_sign_keypair
from app.crypto.key_manager import KEY_MANAGER, CryptoKeyBundle


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode('ascii')


def main():
    print('Generating new PQ key material...')
    kyber_pub, kyber_priv = generate_kem_keypair()
    dilithium_pub, dilithium_priv = generate_sign_keypair()
    master = secrets.token_bytes(32)

    bundle = CryptoKeyBundle(
        kyber_public_b64=b64(kyber_pub),
        kyber_private_b64=b64(kyber_priv),
        dilithium_public_b64=b64(dilithium_pub),
        dilithium_private_b64=b64(dilithium_priv),
        master_key_b64=b64(master),
    )

    KEY_MANAGER.rotate(bundle, persist=True)
    print('Rotation complete. Local file and KMS (stub) updated if available.')


if __name__ == '__main__':
    main()
