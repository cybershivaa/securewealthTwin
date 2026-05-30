from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from pathlib import Path

from pqcrypto.kem import kyber768
from pqcrypto.sign import dilithium2


def _b64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def main() -> None:
    output_dir = Path(__file__).resolve().parent.parent / "generated"
    output_dir.mkdir(parents=True, exist_ok=True)

    kyber_public_key, kyber_private_key = kyber768.generate_keypair()
    dilithium_public_key, dilithium_private_key = dilithium2.generate_keypair()

    payload = {
        "rotated_at": datetime.now(timezone.utc).isoformat(),
        "SERVER_KYBER_PUBLIC_B64": _b64(kyber_public_key),
        "SERVER_KYBER_PRIVATE_B64": _b64(kyber_private_key),
        "SERVER_DILITHIUM_PUBLIC_B64": _b64(dilithium_public_key),
        "SERVER_DILITHIUM_PRIVATE_B64": _b64(dilithium_private_key),
    }

    (output_dir / "crypto-material-rotated.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print((output_dir / "crypto-material-rotated.json").as_posix())


if __name__ == "__main__":
    main()
