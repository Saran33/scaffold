#!/bin/bash

# Check Node version consistency between package.json and Dockerfile

set -e

# Extract Node version from package.json engines field
PACKAGE_VERSION=$(node -e "console.log(require('./package.json').engines.node.replace(/[~^]/, ''))")
MAJOR_VERSION=$(echo "$PACKAGE_VERSION" | cut -d. -f1)

# Check frontend.dockerfile for Node version in FROM statements
DOCKERFILE_VERSIONS=$(grep -E "^FROM.*node:[0-9]+" frontend.dockerfile | sed -E 's/.*node:([0-9]+).*/\1/' | sort -u)

# Check if dockerfile versions match the major version from package.json
MISMATCH=0
for VERSION in $DOCKERFILE_VERSIONS; do
  if [ "$VERSION" != "$MAJOR_VERSION" ]; then
    echo "❌ Node version mismatch detected!"
    echo "   package.json specifies Node $PACKAGE_VERSION (major: $MAJOR_VERSION)"
    echo "   frontend.dockerfile uses Node $VERSION"
    MISMATCH=1
  fi
done

if [ $MISMATCH -eq 0 ]; then
  echo "✅ Node versions are in sync (major version: $MAJOR_VERSION)"
  exit 0
else
  echo ""
  echo "Please update frontend.dockerfile to use node:$MAJOR_VERSION-alpine"
  exit 1
fi
