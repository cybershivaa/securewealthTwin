#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR=${1:-./artifacts}
TAG=${GITHUB_REF##refs/tags/}

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN not set; skipping release creation" >&2
  exit 0
fi

if [ -z "$TAG" ]; then
  echo "No tag detected; skipping release creation" >&2
  exit 0
fi

echo "Creating GitHub release for tag $TAG"
if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found; please install and authenticate" >&2
  exit 1
fi

gh release create "$TAG" "$ARTIFACT_DIR"/* --title "liboqs-artifacts-$TAG" --notes "Native liboqs artifacts for $TAG"
