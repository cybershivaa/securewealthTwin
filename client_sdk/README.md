# Client SDK - Post-Quantum Encryption

Encryption libraries and native integration code for React Native.

## What's Here

**Crypto Fallback** (when native unavailable):
- `crypto_fallback.js` – WebCrypto AES-256-GCM + HKDF (JavaScript)
- `native_bridge_impl.js` – Bridge preferring native, falling back to JS
- `native_bridge.ts` – TypeScript types

**Native Modules** (Android + iOS):
- `native_android/` – JNI/C wrappers, Kotlin RN module, Keystore integration
- `native_ios/` – Swift RN bridge, Keychain integration

**Build Automation**:
- Build scripts in `../scripts/` create liboqs static/shared libs
- CMake config in `native_android/CMakeLists.txt` orchestrates native build

## Usage

### 1. Use JS Fallback (No Native Build)

```javascript
import { cryptoFallback } from 'client_sdk/crypto_fallback.js';

const keypair = await cryptoFallback.generateKemKeypair();
const sessionKey = await cryptoFallback.deriveSessionKey(publicKey, ciphertext);
```

### 2. Use Native Crypto (After Building liboqs)

```typescript
import { NativeModules } from 'react-native';

const crypto = NativeModules.SecureQuantumCrypto;

const keypair = await crypto.generateKemKeypair();
const sessionKey = await crypto.kemDecrypt(privateKey, ciphertext);
```

## Build Native Libraries

```bash
# Android (requires NDK)
./scripts/build_liboqs_android.sh $ANDROID_NDK_HOME ./artifacts

# iOS (requires Xcode)
./scripts/build_liboqs_ios.sh ./artifacts
```

See `../README_NATIVE_BUILD.md` for details.

## Files for Your Team

- **Encryption logic**: `crypto_fallback.js`, native bridge code
- **Types**: `native_bridge.ts` for TypeScript integration
- **Integration**: Wire `SecureQuantumCrypto` module via RN linking
- **Security**: All private keys wrapped with Keystore/Keychain
