# SecureWealth Twin Backend

This backend implements the secure banking envelope for SecureWealth Twin:

- Post-quantum key exchange via Kyber
- Post-quantum signatures via Dilithium
- AES-256-GCM payload protection
- Replay protection with request IDs and timestamps
- JWT issuance with strict audience and issuer checks
- Encrypted persistence for sensitive records

## Required environment variables

- `DATABASE_URL`
- `REDIS_URL`
- `MASTER_KEY_B64`
- `SERVER_KYBER_PUBLIC_B64`
- `SERVER_KYBER_PRIVATE_B64`
- `SERVER_DILITHIUM_PRIVATE_B64`
- `SERVER_DILITHIUM_PUBLIC_B64`
- `API_SIGNING_KEY_B64`

## Endpoints

- `GET /health`
- `GET /secure/public-keys`
- `POST /secure/handshake`
- `POST /secure/session/token`
- `POST /secure/fraud-payload`

## Operational scripts

Run Alembic migrations:

```bash
python scripts/run_migrations.py
```

Generate and rotate PQ key material (development use only - run in a secure environment):

```bash
python scripts/key_rotate.py
```

Keys are persisted to `secrets/keys.json` by default when rotated locally. For production, replace the KMS stubs in `app/crypto/key_manager.py` with your provider (AWS/GCP/Azure) and ensure proper access controls.

AWS Secrets Manager usage
------------------------

You can store the server key bundle in AWS Secrets Manager and set two environment variables:

- `AWS_REGION`: AWS region, e.g. `us-east-1`
- `AWS_SECRET_NAME`: the name or ARN of the secret containing the JSON key bundle

The application will attempt to load keys in this order: environment variables -> AWS Secrets Manager -> local `secrets/keys.json` file.

The secret should be a JSON string with the following fields:

```json
{
	"server_kyber_public_b64": "...",
	"server_kyber_private_b64": "...",
	"server_dilithium_public_b64": "...",
	"server_dilithium_private_b64": "...",
	"master_key_b64": "..."
}
```

Rotation via `scripts/key_rotate.py` will attempt to update the secret in Secrets Manager if `AWS_REGION` and `AWS_SECRET_NAME` are set, otherwise it will write locally to `secrets/keys.json`.

GCP Secret Manager
------------------

To use GCP Secret Manager, set the following environment variables and ensure the service account has `secretmanager.versions.access` permission:

- `GCP_PROJECT`: your GCP project id
- `GCP_SECRET_NAME`: the secret id in Secret Manager

The secret value should be the same JSON structure as described above.

Azure Key Vault
---------------

To use Azure Key Vault, set the following environment variables and ensure the app has appropriate access:

- `AZURE_VAULT_URL`: e.g. `https://myvault.vault.azure.net/`
- `AZURE_SECRET_NAME`: the secret name to store the JSON payload

The application will attempt to load keys in this order: environment variables -> AWS Secrets Manager -> GCP Secret Manager -> Azure Key Vault -> local `secrets/keys.json` file.

Native Module Build & Integration
---------------------------------

To complete the client-side PQ stack you must supply compiled Kyber/Dilithium native libraries for Android and iOS. Steps summary:

- Android: cross-compile PQ C library with Android NDK, place resulting `.so` files under `android/app/src/main/jniLibs/<abi>/`, and implement JNI wrappers and the Kotlin React Native bridge in `client_sdk/native_android`.
- iOS: compile PQ C library into a static `.a` or framework, add to Xcode project, implement ObjC/Swift wrappers in `client_sdk/native_ios`, and expose via `RCTBridgeModule`.
- Use the JS bridge (`client_sdk/native_bridge_impl.js`) which prefers native modules and falls back only when native PQ is unavailable.

I added build scripts templates: `scripts/build_native_android.sh` and `scripts/build_native_ios.sh`. These are templates and will need editing for your project specifics (project name, path to Xcode project, and toolchain options).

Security reminder: never store private keys in plaintext. Use platform keystores (Android Keystore, iOS Keychain/Secure Enclave) and prefer in-hardware signing where available.
