#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PYTHON="${PYTHON:-python3}"
"$PYTHON" -m venv .venv
if [ -x .venv/bin/python ]; then VENV=.venv/bin/python; else VENV=.venv/Scripts/python.exe; fi
"$VENV" -m pip install --upgrade pip
"$VENV" -m pip install -r requirements.txt
"$VENV" tools/build_game3.py
rm -rf "$ROOT/dist"
mkdir -p dist dist/assets/bg
cp assets/bg/*.webp dist/assets/bg/
"$VENV" tools/optimize_delivery.py rrootage3.html dist/full.html
"$VENV" tools/externalize_assets.py dist/full.html dist/index.html
mkdir -p dist/assets/audio dist/assets/fonts dist/assets/video dist/assets/branding
cp assets/branding/logo-emblem.png assets/branding/logo-title.png assets/branding/logo-title-stacked.png dist/assets/branding/
cp assets/audio/*.mp3 dist/assets/audio/
cp assets/fonts/*.ttf dist/assets/fonts/
cp assets/video/*.mp4 dist/assets/video/
SOURCE_COMMIT="${SOURCE_COMMIT:-}"
if [ -z "$SOURCE_COMMIT" ]; then
  SOURCE_COMMIT="$(git rev-parse HEAD 2>/dev/null || true)"
fi
if ! printf '%s' "$SOURCE_COMMIT" | grep -Eq '^[0-9a-fA-F]{7,40}$'; then
  echo "EDGEONE BUILD MISSING: SOURCE_COMMIT (git checkout or explicit env)" >&2
  exit 1
fi
printf '%s\n' "$SOURCE_COMMIT" > dist/build.txt
test -s dist/build.txt || { echo "EDGEONE BUILD MISSING: dist/build.txt" >&2; exit 1; }
for f in dist/index.html dist/assets/video/fusion.mp4 dist/assets/video/phase2-loop.mp4 dist/assets/video/phase3-loop.mp4 dist/assets/video/kaleido-bg.mp4; do
  test -s "$f" || { echo "EDGEONE BUILD MISSING: $f" >&2; exit 1; }
done
rm -f dist/full.html
