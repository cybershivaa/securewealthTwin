# Encryption & Security Integration Guide

This guide covers **ONLY** the post-quantum encryption and secure communication layer.

Your teammates handle: UI, fraud detection, dashboards, navigation, authentication UI.  
You handle: Encryption, native crypto, secure storage, API security.

## Backend Encryption Setup

### 1. Verify Dependencies

```bash
cd backend
pip list | grep -E "cryptography|boto3|google-cloud|azure"
```

### 2. Initialize Keys

```bash
cd backend/scripts
python key_rotate.py
```

Generates Kyber + Dilithium keypair. Persists to:
- Local: `backend/secrets/keys.json`
- OR cloud: AWS Secrets Manager / GCP Secret Manager / Azure Key Vault

### 3. Configure Backend

Edit `backend/app/core/config.py`:

```python
# Local file (default)
KEY_FILE = "backend/secrets/keys.json"

# OR AWS
AWS_REGION = "us-east-1"
AWS_SECRET_NAME = "pq-keys"

# OR GCP
GCP_SECRET_PROJECT = "myproject"
GCP_SECRET_NAME = "pq-keys"

# OR Azure
AZURE_VAULT_URL = "https://myvault.vault.azure.net/"
AZURE_SECRET_NAME = "pq-keys"
```

### 4. Run Tests

```bash
cd backend
pytest -q
```

Expected: `1 passed, 1 skipped` ✅

### 5. Start Backend

```bash
cd backend
uvicorn app.main:app --reload
```

## API Encryption Contract

### Handshake Endpoint: `/api/pq-handshake`

**Request**:
```json
{
  "client_kem_public_key_b64": "base64-encoded Kyber public key"
}
```

**Response** (encrypted):
```json
{
  "kem_ciphertext_b64": "base64 encapsulated key",
  "server_signature_b64": "Dilithium signature"
}
```

Client decapsulates ciphertext using its private key → derives session key via HKDF.

### Secure Endpoint: `/fraud/sms` (example)

**Request** (encrypted):
```json
{
  "encrypted_payload": {
    "ciphertext": "AES-256-GCM ciphertext (base64)",
    "iv": "12-byte IV (base64)",
    "tag": "16-byte auth tag (base64)"
  }
}
```

**Response** (encrypted):
```json
{
  "encrypted_response": {
    "ciphertext": "...",
    "iv": "...",
    "tag": "..."
  }
}
```

## React Native Integration

### Native Crypto Module Methods

Your RN app will call these via `NativeModules.SecureQuantumCrypto`:

```typescript
// Key generation
generateKemKeypair(): Promise<{ public: string; private: string }>
generateSignKeypair(): Promise<{ public: string; private: string }>

// Encryption/Decryption
kemEncrypt(publicKeyB64: string): Promise<{ ciphertext_b64: string; shared_secret_b64: string }>
kemDecrypt(privateKeyB64: string, ciphertextB64: string): Promise<string>

// Signing/Verification
sign(privateKeyB64: string, messageB64: string): Promise<string>
verify(publicKeyB64: string, messageB64: string, signatureB64: string): Promise<boolean>

// Secure Storage
storeWrappedPrivateKey(alias: string, privateKeyB64: string): Promise<boolean>
loadWrappedPrivateKey(alias: string): Promise<string>

// Direct AES-GCM wrapping (optional native path)
nativeAesGcmWrap(keyB64: string, plainB64: string): Promise<string>
nativeAesGcmUnwrap(keyB64: string, wrappedB64: string): Promise<string>
```

### JS Fallback (if native unavailable)

```javascript
import { cryptoFallback } from 'client_sdk/crypto_fallback.js';

// Same interface as native
const keypair = await cryptoFallback.generateKemKeypair();
const sessionKey = await cryptoFallback.deriveBoundSessionKey(publicKey, ciphertext);
```

## Key Storage

### Android Keystore (Hardware-Backed if Available)

Private keys are wrapped with an AES-256-GCM key stored in Android Keystore:

```kotlin
// Automatic when you call storeWrappedPrivateKey
native.storeWrappedPrivateKey("my-key-alias", privateKeyB64)

// Retrieve and unwrap
val unwrappedKey = native.loadWrappedPrivateKey("my-key-alias")
```

### iOS Keychain

Equivalent on iOS:

```swift
native.storeWrappedPrivateKey("my-key-alias", privateKeyB64: keyB64)
let unwrappedKey = native.loadWrappedPrivateKey("my-key-alias")
```

## Encryption Architecture

```
React Native App
    ↓
[Encryption Layer]
    ├─ JS crypto_fallback.js (WebCrypto)
    └─ Native crypto (JNI/Swift → liboqs)
    ↓
[Axios Interceptor]
    ├─ Auto-encrypt requests
    └─ Auto-decrypt responses
    ↓
[API Call with encrypted payload]
    ↓
FastAPI Backend
    ├─ Decrypt request
    ├─ Process
    └─ Encrypt response
    ↓
[App receives encrypted response]
    ↓
[Decryption Layer]
    ↓
UI (already decrypted)
```

## Security Checklist

- ✅ Backend generates PQ keypairs
- ✅ Backend persists keys (local or KMS)
- ✅ Client can call native crypto methods
- ✅ Session keys derived via HKDF
- ✅ All payloads AES-256-GCM encrypted
- ✅ Private keys wrapped in Keystore/Keychain
- ⏳ Axios interceptor for auto-encryption/decryption (implement)
- ⏳ Certificate pinning (implement)
- ⏳ Nonce + timestamp replay prevention (implement)

## Build & Deploy

### Build liboqs for Android

```bash
./scripts/build_liboqs_android.sh $ANDROID_NDK_HOME ./artifacts
```

Produces `.so` files for: arm64-v8a, armeabi-v7a, x86_64

### Build liboqs for iOS

```bash
./scripts/build_liboqs_ios.sh ./artifacts
```

Produces `liboqs.xcframework` for device + simulator.

### Link to Your App

- **Android**: Copy `.so` to `android/app/src/main/jniLibs/<abi>/`
- **iOS**: Add `.xcframework` to Xcode project

## Troubleshooting

**Native module not loading**:
- Check logcat: `adb logcat | grep securequantum`
- Verify `.so` files exist in jniLibs

**Keystore/Keychain errors**:
- Android: Ensure app has keystore permissions
- iOS: Verify Keychain entitlements in provisioning profile

**JS fallback activating unexpectedly**:
- Check native module initialization
- Verify JNI bridge is wired correctly

## Files You Need

**Encryption Core**:
- `backend/app/crypto/` – AES, HKDF, KEM, signatures
- `backend/scripts/key_rotate.py` – Key generation
- `backend/tests/test_secure_encryption.py` – Validation

**Native Integration**:
- `client_sdk/native_android/jni/` – JNI wrappers
- `client_sdk/native_android/src/main/java/com/securewealth/` – Kotlin modules
- `client_sdk/native_ios/` – Swift bridge
- `client_sdk/crypto_fallback.js` – JS fallback

**Build**:
- `client_sdk/native_android/CMakeLists.txt` – CMake config
- `client_sdk/native_android/oqs_external.cmake` – liboqs external project
- `scripts/build_liboqs_android.sh` – Android build
- `scripts/build_liboqs_ios.sh` – iOS build

## CI/CD

- `.github/workflows/ci.yml` – Run backend tests
- `.github/workflows/native_build.yml` – Build liboqs + upload artifacts

Add `ANDROID_NDK_HOME` secret to enable CI builds.

