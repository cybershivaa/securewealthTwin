#!/usr/bin/env bash
set -euo pipefail

NDK_DIR=${1:-${ANDROID_NDK_HOME:-}}
OUT_DIR=${2:-$(pwd)/liboqs-android-artifacts}

if [ -z "$NDK_DIR" ]; then
  echo "Usage: $0 /path/to/android-ndk [out_dir]" >&2
  exit 2
fi

echo "NDK: $NDK_DIR"
echo "Out: $OUT_DIR"
mkdir -p "$OUT_DIR"

ABIS=(armeabi-v7a arm64-v8a x86_64)
for ABI in "${ABIS[@]}"; do
  BUILD_DIR=$(mktemp -d)
  INSTALL_DIR="$OUT_DIR/$ABI"
  mkdir -p "$INSTALL_DIR"

  cmake -S client_sdk/native_android -B "$BUILD_DIR" \
    -DCMAKE_TOOLCHAIN_FILE="$NDK_DIR/build/cmake/android.toolchain.cmake" \
    -DANDROID_ABI="$ABI" \
    -DANDROID_PLATFORM=android-21 \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="$INSTALL_DIR"

  cmake --build "$BUILD_DIR" --target install -- -j$(nproc || echo 2)

  # Copy libs into jniLibs layout for Gradle
  JNILIBS_DIR="android/app/src/main/jniLibs/$ABI"
  mkdir -p "$JNILIBS_DIR"
  if [ -f "$INSTALL_DIR/lib/liboqs.a" ]; then
    cp "$INSTALL_DIR/lib/liboqs.a" "$JNILIBS_DIR/"
  fi
done

echo "Built liboqs artifacts to $OUT_DIR and copied to android/app/src/main/jniLibs/."
