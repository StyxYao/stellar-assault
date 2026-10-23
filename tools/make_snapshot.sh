#!/usr/bin/env bash
# Create a local recovery snapshot (source/docs/dist; large media stays in git).
set -euo pipefail
cd "$(dirname "$0")/.."
label="${1:-manual}"
stamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p .backups
out=".backups/${stamp}-${label}.tar.gz"
bundle=".backups/${stamp}-${label}.bundle"
COPYFILE_DISABLE=1 tar --no-xattrs --exclude='.git' --exclude='.venv' --exclude='node_modules' --exclude='.backups' \
    --exclude='assets/video' --exclude='dist/assets/video' \
    -czf "$out" .
git bundle create "$bundle" --all >/dev/null 2>&1 || true
echo "$out"
echo "$bundle"
