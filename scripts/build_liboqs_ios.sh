#!/usr/bin/env bash
set -euo pipefail

OUT_DIR=${1:-$(pwd)/liboqs-ios-artifacts}
mkdir -p "$OUT_DIR"

BUILD_DIR=$(mktemp -d)
SRC_DIR=$(pwd)/client_sdk/native_android

cmake -S $SRC_DIR -B "$BUILD_DIR/ios-device" \
  -DCMAKE_OSX_ARCHITECTURES="arm64" \
  -DCMAKE_SYSTEM_NAME=iOS \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX="$OUT_DIR/ios-device"

cmake --build "$BUILD_DIR/ios-device" --target install -- -j$(sysctl -n hw.ncpu)

cmake -S $SRC_DIR -B "$BUILD_DIR/ios-sim" \
  -DCMAKE_OSX_ARCHITECTURES="x86_64;arm64" \
  -DCMAKE_SYSTEM_NAME=iOS -DCMAKE_OSX_SYSROOT=iphonesimulator \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$OUT_DIR/ios-sim"

cmake --build "$BUILD_DIR/ios-sim" --target install -- -j$(sysctl -n hw.ncpu)

# Create XCFramework
XCFRAMEWORK_PATH="$OUT_DIR/liboqs.xcframework"
rm -rf "$XCFRAMEWORK_PATH"
xcodebuild -create-xcframework \
  -library "$OUT_DIR/ios-device/lib/liboqs.a" -headers "$OUT_DIR/ios-device/include" \
  -library "$OUT_DIR/ios-sim/lib/liboqs.a" -headers "$OUT_DIR/ios-sim/include" \
  -output "$XCFRAMEWORK_PATH"

echo "Built XCFramework: $XCFRAMEWORK_PATH"
