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
mkdir -p dist/assets/audio
cp assets/audio/*.mp3 dist/assets/audio/
rm -f dist/full.html
