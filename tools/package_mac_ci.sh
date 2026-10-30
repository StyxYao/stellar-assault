#!/usr/bin/env bash
set -euo pipefail
ARCH="${1:?arch required: arm64 or x64}"
cd "$(dirname "$0")/../desktop"

APP="$(find release -maxdepth 2 -type d -name 'STELLAR ASSAULT.app' -print -quit)"
if [ -z "$APP" ]; then echo "macOS app bundle not found"; exit 1; fi
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"

VERSION="$(node -p "require('./package.json').version")"
DMG="release/STELLAR ASSAULT-$VERSION-$ARCH.dmg"
ZIP="release/STELLAR ASSAULT-$VERSION-$ARCH-mac.zip"
rm -f "$DMG" "$ZIP"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$ZIP"
hdiutil create -srcfolder "$APP" -volname "STELLAR ASSAULT $VERSION $ARCH" \
  -anyowners -nospotlight -format UDZO -fs HFS+ "$DMG"
hdiutil verify "$DMG" >/dev/null
ls -lh "$DMG" "$ZIP"
