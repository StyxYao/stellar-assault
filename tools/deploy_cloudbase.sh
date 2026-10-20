#!/usr/bin/env bash
set -euo pipefail

if [ -z "${TCB_ENV_ID:-}" ]; then
  echo "TCB_ENV_ID is required (CloudBase environment ID)." >&2
  exit 1
fi

if [ ! -f dist/index.html ]; then
  bash tools/build_pages.sh
fi

npx --yes @cloudbase/cli hosting deploy dist -e "$TCB_ENV_ID"
