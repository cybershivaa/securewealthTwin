import json
import base64
import pytest

# These optional dependencies are only required for this test. Skip if missing.
pytest.importorskip('boto3')
pytest.importorskip('moto')

import boto3
try:
    # Preferred import (works for many moto versions)
    from moto import mock_secretsmanager
except Exception:
    try:
        # Fallback for moto layout where mocks are individual modules
        from moto.secretsmanager import mock_secretsmanager
    except Exception:
        # If neither import works, skip this test module entirely
        import pytest as _pytest
        _pytest.skip("moto secretsmanager mock not available", allow_module_level=True)
from app.crypto.key_manager import KEY_MANAGER, CryptoKeyBundle
from app.core.config import get_settings


def b64(b: bytes) -> str:
    return base64.b64encode(b).decode('ascii')


@mock_secretsmanager
def test_key_manager_loads_from_aws(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, 'aws_region', 'us-east-1', raising=False)
    monkeypatch.setattr(settings, 'aws_secret_name', 'test/secure-keys', raising=False)

    client = boto3.client('secretsmanager', region_name='us-east-1')
    payload = {
        'server_kyber_public_b64': b64(b'kyber_pub'),
        'server_kyber_private_b64': b64(b'kyber_priv'),
        'server_dilithium_public_b64': b64(b'dilithium_pub'),
        'server_dilithium_private_b64': b64(b'dilithium_priv'),
        'master_key_b64': b64(b'master_key_32bytes_long__!!!!')
    }
    client.create_secret(Name='test/secure-keys', SecretString=json.dumps(payload))

    bundle = KEY_MANAGER._load_from_kms()
    assert bundle is not None
    assert bundle.kyber_public_b64 == payload['server_kyber_public_b64']
    assert bundle.master_key_b64 == payload['master_key_b64']
