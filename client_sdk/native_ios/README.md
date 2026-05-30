iOS native build and integration
--------------------------------

Prerequisites:

- Xcode and command-line tools installed on macOS.
- CMake 3.18+ and Ninja recommended.

Build (macOS):

```bash
./scripts/build_liboqs_ios.sh /path/to/output_dir
```

The script produces an `XCFramework` containing device and simulator slices. Add the resulting XCFramework to your Xcode project and link the `securequantum` wrapper sources.
iOS Native Module Scaffold

This folder should contain the iOS native implementation of Kyber and Dilithium.

Recommended approach:
- Use a vetted PQ C library and compile as a static library for iOS architectures.
- Create Objective-C / Swift wrappers that expose functions to React Native via RCTBridgeModule.
- Use Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly) for private key storage and Secure Enclave when possible.

API (to expose to JS):
- `generateKemKeypair()` -> `{ publicKey: base64, privateKey: base64 }`
- `kemEncrypt(publicKey)` -> `{ ciphertext_b64, shared_secret_b64 }`
- `kemDecrypt(privateKey, ciphertext_b64)` -> `shared_secret_b64`
- `generateSignKeypair()` -> `{ publicKey, privateKey }`
- `sign(privateKey, message)` -> `signature_b64`
- `verify(publicKey, message, signature_b64)` -> `boolean`

Building liboqs for iOS (example)
---------------------------------

This project can integrate liboqs. Example build steps:

```bash
git clone https://github.com/open-quantum-safe/liboqs.git
mkdir liboqs/build && cd liboqs/build
cmake -DBUILD_SHARED_LIBS=OFF -DCMAKE_POSITION_INDEPENDENT_CODE=ON ..
cmake --build . -- -j$(sysctl -n hw.ncpu)
```

Link the produced `.a` archives into your Xcode project and expose the functions via `bridge_header.h`.

Note: cross-compiling for simulator and device may require separate builds and creating a universal fat library or XCFramework.
