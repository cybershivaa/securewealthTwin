#!/usr/bin/env bash
set -euo pipefail

# Cross-compile native PQ library for Android ABIs using Android NDK and CMake
# Requires: ANDROID_NDK_HOME environment variable pointing to NDK root

if [ -z "${ANDROID_NDK_HOME:-}" ]; then
  echo "ANDROID_NDK_HOME must be set"
  exit 1
fi

ROOT=$(dirname "$(dirname "$0")")
SRC_DIR="$ROOT/client_sdk/native_android"
BUILD_DIR="$SRC_DIR/build"

mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

ABIS=(arm64-v8a armeabi-v7a x86_64)
for ABI in "${ABIS[@]}"; do
  mkdir -p "$ABI"
  pushd "$ABI" > /dev/null
  cmake -DCMAKE_TOOLCHAIN_FILE="$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake" \
        -DANDROID_ABI="$ABI" -DANDROID_PLATFORM=android-21 "$SRC_DIR"
  cmake --build . -- -j$(nproc || echo 2)
  popd > /dev/null
done

echo "Build complete. Copy *.so files from build/<abi>/ to android/app/src/main/jniLibs/<abi>/"
