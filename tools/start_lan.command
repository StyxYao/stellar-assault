#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
exec node tools/lan_server.mjs "${1:-8785}" "${2:-8786}"
