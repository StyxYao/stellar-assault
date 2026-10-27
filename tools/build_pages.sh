#!/usr/bin/env bash
set -euo pipefail
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python tools/build_game3.py
mkdir -p dist dist/assets/bg
cp assets/bg/*.webp dist/assets/bg/
python tools/optimize_delivery.py rrootage3.html dist/full.html
python tools/externalize_assets.py dist/full.html dist/index.html
mkdir -p dist/assets/audio dist/assets/fonts dist/assets/video dist/assets/branding
cp assets/branding/*.png dist/assets/branding/
cp assets/audio/*.mp3 dist/assets/audio/
cp assets/fonts/*.ttf dist/assets/fonts/
cp assets/video/*.mp4 dist/assets/video/
git rev-parse --short HEAD > dist/build.txt 2>/dev/null || true
for f in dist/index.html dist/assets/video/fusion.mp4 dist/assets/video/phase2-loop.mp4 dist/assets/video/phase3-loop.mp4 dist/assets/video/kaleido-bg.mp4; do
  test -s "$f" || { echo "EDGEONE BUILD MISSING: $f" >&2; exit 1; }
done
rm -f dist/full.html
