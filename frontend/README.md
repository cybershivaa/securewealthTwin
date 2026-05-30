# SecureWealth Twin Frontend

This React Native TypeScript client implements:

- Kyber-based secure session bootstrap
- Dilithium request signing and response verification
- AES-256-GCM application-layer encryption
- Keychain-backed storage for session and token material
- Biometric unlock before token release
- Axios interceptors for encrypted request/response transport

## Native requirements

The app expects a `SecureQuantumCrypto` native module that provides:

- Dilithium keypair generation
- Kyber encapsulation
- Dilithium signing and verification

## Secure flow

1. Fetch backend public keys.
2. Generate a device Dilithium keypair.
3. Perform Kyber encapsulation to derive a shared secret.
4. Complete the handshake and verify the server signature.
5. Store the session key in Keychain and use it for AES-GCM payloads.
