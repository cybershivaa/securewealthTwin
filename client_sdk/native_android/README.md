Android native build and integration
-----------------------------------

Prerequisites:

- Android NDK installed and `ANDROID_NDK_HOME` set.
- CMake available (bundled with NDK or separately).

Build (Linux/macOS/WSL/CI):

```bash
./scripts/build_liboqs_android.sh /path/to/ndk /path/to/output_dir
```

This script will build liboqs for common ABIs and copy static libs into the `jniLibs` layout expected by Gradle.

Gradle integration notes:

- Add `jniLibs` to `src/main` if not present. The script will populate `android/app/src/main/jniLibs/<abi>/liboqs.a` or `.so` depending on configuration.
- Ensure `externalNativeBuild` CMake config includes the `client_sdk/native_android/CMakeLists.txt` which links `securequantum` against `oqs_static`.
Android Native Module Scaffold

This folder should contain the Android native implementation of Kyber (KEM) and Dilithium (signatures).

Recommended approach:
- Use a stable PQ library (liboqs or a vetted Kyber/Dilithium C impl) cross-compiled for Android (armeabi-v7a, arm64-v8a, x86_64).
- Implement a JNI layer exposing:
  - generateKemKeypair() -> returns (public, private) as base64
  - kemEncrypt(publicKey) -> returns { ciphertext_b64, shared_secret_b64 }
  - kemDecrypt(privateKey, ciphertext_b64) -> returns shared_secret_b64
  - generateSignKeypair() -> (public, private)
  - sign(privateKey, message) -> signature_b64
  - verify(publicKey, message, signature_b64) -> boolean
- Store private keys using Android Keystore (KeyStore) and use SecureRandom for local entropy.

Build: include the native .so files and create a Gradle module that exposes the JNI functions to React Native.
