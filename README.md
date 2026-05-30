# SecureWealth Twin – Post-Quantum E2E Encryption

SecureWealth Twin is a banking fraud-detection application for Punjab National Bank with a **complete post-quantum encryption system** built for zero-trust transport, encrypted storage, and NIST PQC readiness.

## Quick Start

See **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** for complete setup instructions, API examples, and security best practices.

## System Status ✅

- ✅ **Backend**: FastAPI with AES-256-GCM envelopes, Kyber KEM, Dilithium signatures, full KMS support (AWS/GCP/Azure)
- ✅ **Key Management**: Multi-source loading (local file, cloud KMS), rotation scripts, secure persistence
- ✅ **Client Native**: JNI/Swift bridges to liboqs, Android Keystore & iOS Keychain-backed private key storage
- ✅ **Client Fallback**: JS WebCrypto for environments without native libraries
- ✅ **Tests**: Backend tests pass (1 passed, 1 skipped); encrypted round-trip validated
- ✅ **CI/CD**: GitHub Actions workflows for native builds, artifact uploads, optional release publishing
- ✅ **Docs**: Integration guide, native build scripts, platform-specific READMEs

## Architecture

### Backend (FastAPI + Python)

- Holds server PQ keypairs (Kyber 768 KEM + Dilithium 2 signatures)
- Responds to client handshakes with encrypted session keys (AES-256-GCM)
- Encrypts endpoint responses in SecureEnvelope format
- **Key management**:
  - Settings-based (hardcoded keys)
  - AWS Secrets Manager integration
  - Google Cloud Secret Manager integration
  - Azure Key Vault integration
  - Local encrypted file persistence
- **Key rotation**: Automated via `scripts/key_rotate.py`

### React Native Client

- **Preferred**: Native PQ via JNI (Android) / Swift (iOS) calling liboqs (Kyber + Dilithium)
- **Fallback**: WebCrypto for HKDF + AES-GCM when native unavailable
- **Key storage**:
  - Android: Wrapped with Keystore AES key (hardware-backed if available)
  - iOS: Stored in Keychain
- **Methods exposed**:
  - `generateKemKeypair()` – create ephemeral key pair
  - `kemEncrypt(publicKey)` – encapsulate session key
  - `kemDecrypt(privateKey, ciphertext)` – decapsulate
  - `generateSignKeypair()` – create signing keys
  - `sign(privateKey, message)` – sign with Dilithium
  - `verify(publicKey, message, signature)` – verify signature
  - `storeWrappedPrivateKey(alias, key)` – persist wrapped keys
  - `loadWrappedPrivateKey(alias)` – retrieve stored keys
  - `nativeAesGcmWrap(key, plain)` – direct C-level AES-GCM wrapping
  - `nativeAesGcmUnwrap(key, wrapped)` – direct C-level AES-GCM unwrapping

### Key Derivation

Session keys are derived using **HKDF-SHA256** from the PQ KEM shared secret, binding each session to a unique ephemeral key pair.

## File Structure

```text
backend/
  app/
    crypto/
      __init__.py
      aead.py                 # AES-256-GCM envelope helper
      hkdf.py                 # HKDF-SHA256 key derivation
      key_manager.py          # Multi-source key loading + rotation
      pq.py                   # Kyber/Dilithium via pqcrypto
    core/
      config.py               # Settings (KMS, key file path, etc.)
    routes/
      secure_routes.py        # Encrypted endpoint handlers
    tests/
      test_secure_encryption.py  # E2E test with fake Redis
  scripts/
    key_rotate.py             # Generate and rotate PQ keys
    run_migrations.py          # Alembic migrations

client_sdk/
  crypto_fallback.js          # WebCrypto fallback (HKDF + AES-GCM)
  native_bridge_impl.js       # Prefer native, fall back to JS
  native_bridge.ts            # TS types for RN bridge
  native_android/
    CMakeLists.txt            # Build liboqs + JNI module
    jni/
      oqs_wrapper.c           # liboqs calls (Kyber/Dilithium)
      securequantum_jni.cpp   # JNI glue to C
    src/main/java/com/securewealth/
      SecureQuantumCrypto.kt           # JNI method declarations
      SecureQuantumCryptoModule.kt     # RN module entry
      KeystoreHelper.kt                # Android Keystore AES-GCM
  native_ios/
    SecureQuantumCrypto.swift         # Swift RN bridge
    SecureQuantumCryptoBridge.m       # ObjC bridging header
    KeychainHelper.swift              # iOS Keychain storage
  react_native_example/
    NATIVE_INTEGRATION.md    # Integration checklist

scripts/
  build_liboqs_android.sh    # Cross-compile liboqs for Android ABIs
  build_liboqs_ios.sh        # Build iOS device + simulator, create XCFramework
  publish_artifacts.sh       # GitHub Release publishing (requires gh CLI)

.github/workflows/
  ci.yml                      # Run backend tests on push/PR
  native_build.yml            # Build liboqs, upload artifacts, optional publish

INTEGRATION_GUIDE.md          # Complete setup, API, security guide (START HERE)
README_NATIVE_BUILD.md        # Native build overview and scripts
```

## Quick Integration

### Backend

```bash
cd backend
pip install -r requirements.txt
python scripts/key_rotate.py              # Generate keys
python scripts/run_migrations.py           # Initialize DB
pytest -q                                  # Run tests
uvicorn app.main:app --reload             # Start server
```

### React Native Client

**Build liboqs** (Android requires NDK):
```bash
./scripts/build_liboqs_android.sh $ANDROID_NDK_HOME ./artifacts
```

**Install & test**:
```bash
cd frontend
npm install
npm run build:android  # or build:ios
```

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for detailed steps.

## Original Architecture (Pre-E2E)

Frontend:

- React Native + TypeScript
- JWT-based auth with Keychain storage
- Biometric unlock before token release

Backend:

- FastAPI + Python
- JWT issuance and verification
- Replay protection with request IDs and timestamps
- Encrypted database persistence for sensitive payloads

## Dependencies

**Backend**: `fastapi`, `uvicorn`, `sqlalchemy`, `asyncpg`, `cryptography`, `boto3`, `google-cloud-secret-manager`, `azure-keyvault-secrets`

**Frontend**: `react-native`, `axios`, TypeScript

**Native**: Android NDK, Xcode, liboqs, OpenSSL

## Testing

- Backend tests: `cd backend && pytest -q` → 1 passed, 1 skipped
- Native builds: `./scripts/build_liboqs_android.sh` (Android) or `./scripts/build_liboqs_ios.sh` (iOS)
- E2E: Deploy backend, build + run mobile app, test handshake + encrypted request flow

## CI/CD

- `.github/workflows/ci.yml` – Backend tests on every push/PR
- `.github/workflows/native_build.yml` – Build liboqs, upload artifacts, optionally publish releases

Add `ANDROID_NDK_HOME` secret to your repo to enable Android CI builds.

## Security & Next Steps

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for:
- Complete API endpoint examples
- Key rotation procedures
- Keystore/Keychain best practices
- Security considerations & hardening
- Troubleshooting

---

**Status**: System is feature-complete and ready for integration testing on devices/emulators.
