import sys
sys.path.insert(0, r'C:\Users\adity\OneDrive\Desktop\E2E\backend')
import base64
import json
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import get_settings
from app.crypto.pq_compat import generate_kem_keypair, kem_encrypt, generate_sign_keypair, sign as pq_sign
from app.crypto.pq import hkdf_derive
from app.crypto.aead import encrypt
from app.crypto.envelope import request_aad
from app.crypto.envelope import canonical_json as _canonical
from app.crypto.session_store import SESSION_STORE
from app.routes import secure as secure_routes

# ensure we don't try to connect to real Redis during debug
class _FakeRedis:
    def __init__(self):
        self.values = {}

    def set(self, key, value, ex=None, nx=False):
        if nx and key in self.values:
            return False
        self.values[key] = value
        return True

    def get(self, key):
        return self.values.get(key)

fake_redis = _FakeRedis()
SESSION_STORE.redis_client = fake_redis
secure_routes.SESSION_STORE.redis_client = fake_redis

settings = get_settings()
kyber_public, kyber_private = generate_kem_keypair()
dilithium_public, dilithium_private = generate_sign_keypair()
client_public, client_private = generate_sign_keypair()

settings.server_kyber_public_b64 = base64.b64encode(kyber_public).decode('ascii')
settings.server_kyber_private_b64 = base64.b64encode(kyber_private).decode('ascii')
settings.server_dilithium_public_b64 = base64.b64encode(dilithium_public).decode('ascii')
settings.server_dilithium_private_b64 = base64.b64encode(dilithium_private).decode('ascii')

client_nonce = b'client_nonce_123456789012'
encapsulation_ciphertext, shared_secret = kem_encrypt(base64.b64decode(settings.server_kyber_public_b64))

# Use REAL database for storing encrypted payloads
from app.db.database import get_db

client = TestClient(app)

handshake = client.post('/secure/handshake', json={
    'client_nonce_b64': base64.b64encode(client_nonce).decode('ascii'),
    'kem_ciphertext_b64': base64.b64encode(encapsulation_ciphertext).decode('ascii'),
    'client_dilithium_public_b64': base64.b64encode(client_public).decode('ascii'),
    'device_id': 'device-001'
})
print('handshake', handshake.status_code, handshake.text)
body = handshake.json()
session_id = body['session_id']
session_key = hkdf_derive(shared_secret, salt=client_nonce, info=b"SecureWealth Twin session key")

payload = {
    'user_id': 'demo-user',
    'device_id': 'device-001',
    'session_id': session_id,
    'risk_score': 92,
    'sms_text': 'Verify immediately'
}
request_id = 'req-001'
timestamp = datetime.now(timezone.utc).isoformat()
aad = request_aad(session_id, request_id, timestamp, 'POST', '/fraud/sms')
encrypted = encrypt(_canonical(payload), session_key, aad)
signature = pq_sign(client_private, _canonical({
    'version': '1',
    'session_id': session_id,
    'request_id': request_id,
    'timestamp': timestamp,
    'nonce_b64': encrypted.iv_b64,
    'aad_b64': base64.b64encode(aad).decode('ascii'),
    'ciphertext_b64': encrypted.ciphertext_b64
}))

resp = client.post('/fraud/sms', json={
    'version': '1',
    'session_id': session_id,
    'request_id': request_id,
    'timestamp': timestamp,
    'nonce_b64': encrypted.iv_b64,
    'aad_b64': base64.b64encode(aad).decode('ascii'),
    'ciphertext_b64': encrypted.ciphertext_b64,
    'signature_b64': base64.b64encode(signature).decode('ascii')
})
print('fraud response', resp.status_code, resp.text)

