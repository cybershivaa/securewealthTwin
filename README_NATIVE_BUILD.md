Native liboqs Build Scripts
============================

Build post-quantum crypto libraries for Android and iOS.

## Android

**Requires**: Android NDK with `ANDROID_NDK_HOME` set.

```bash
./scripts/build_liboqs_android.sh $ANDROID_NDK_HOME ./artifacts
```

Produces `.so` files for:
- `arm64-v8a`
- `armeabi-v7a`
- `x86_64`

Copy to your RN project:
```
android/app/src/main/jniLibs/arm64-v8a/liboqs.so
android/app/src/main/jniLibs/armeabi-v7a/liboqs.so
android/app/src/main/jniLibs/x86_64/liboqs.so
```

## iOS

**Requires**: macOS + Xcode

```bash
./scripts/build_liboqs_ios.sh ./artifacts
```

Produces `artifacts/ios/liboqs.xcframework` with device + simulator slices.

Add to your Xcode project and link with `SecureQuantumCrypto` target.

## CI/CD

GitHub Actions builds automatically on push/tag:

```bash
git push
# Builds trigger in .github/workflows/native_build.yml
# Artifacts uploaded to Actions → Artifacts tab
```

For releases, add `ANDROID_NDK_HOME` secret to repo.
