# SecureQuantumCrypto Native Bridge

The React Native client expects a native module named `SecureQuantumCrypto` with the following methods:

- `generateDilithiumKeyPair()`
- `kyberEncapsulate(publicKeyB64)`
- `signDilithium(messageB64, privateKeyB64)`
- `verifyDilithium(messageB64, signatureB64, publicKeyB64)`

## Platform requirements

Android:

- Back the private key with Android Keystore when possible.
- Keep ephemeral session material in memory only.
- Expose only base64 inputs/outputs to the JS layer.

iOS:

- Store private keys in Keychain or Secure Enclave-backed storage where supported.
- Mark items `ThisDeviceOnly` and require biometric unlock for release.

## Bridge contract

The JS layer uses the module only for key generation, encapsulation, signing, and verification. AES-256-GCM payload encryption stays in JavaScript so the same envelope format is shared across both platforms.
