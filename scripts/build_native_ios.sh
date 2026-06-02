#!/usr/bin/env bash
set -euo pipefail

# Build iOS static library / framework for PQ native code
# Requires Xcode command line tools

ROOT=$(dirname "$(dirname "$0")")
SRC_DIR="$ROOT/client_sdk/native_ios"
BUILD_DIR="$SRC_DIR/build"

mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Build for device (arm64) and simulator (x86_64/arm64) and create a fat/libuniversal.a using lipo
xcodebuild -project "$SRC_DIR/YourLib.xcodeproj" -scheme YourLib -configuration Release -sdk iphoneos BUILD_DIR="$BUILD_DIR/iphoneos" clean build || true
xcodebuild -project "$SRC_DIR/YourLib.xcodeproj" -scheme YourLib -configuration Release -sdk iphonesimulator BUILD_DIR="$BUILD_DIR/iphonesim" clean build || true

# Note: replace YourLib with actual Xcode project and scheme names

echo "iOS build complete. Integrate the resulting .a/.framework into your RN iOS project and link properly."
