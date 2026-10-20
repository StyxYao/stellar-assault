#!/usr/bin/env bash
set -euo pipefail
python3 -m pip install --user -r requirements.txt
python3 tools/build_game3.py
mkdir -p dist
python3 tools/optimize_delivery.py rrootage3.html dist/index.html
