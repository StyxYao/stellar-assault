#!/usr/bin/env python3
"""Phase-1 architecture guardrails."""
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
manifest_path = root / "src" / "modules.json"
errors = []

if not manifest_path.exists():
    errors.append("missing src/modules.json")
else:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for rel in manifest.get("modules", []):
        p = root / rel
        if not p.exists():
            errors.append(f"missing module: {rel}")
        else:
            text = p.read_text(encoding="utf-8")
            if rel.startswith("src/content/") and ("document." in text or "window." in text or "ctx." in text):
                errors.append(f"content module uses platform/render API: {rel}")
            if rel.startswith("src/core/"):
                for token in ("document.", "window.", "new Image", "new Audio", "localStorage"):
                    if token in text:
                        errors.append(f"core module leaks platform API {token}: {rel}")
    order = manifest.get("modules", [])
    if order and not order[0].startswith("src/content/"):
        errors.append("content modules should load before render/legacy modules")

for required in ("src/core", "src/content", "src/render", "src/platform", "src/app", "docs/adr"):
    if not (root / required).is_dir():
        errors.append(f"missing directory: {required}")

legacy = root / "game3.js"
if legacy.exists():
    lines = len(legacy.read_text(encoding="utf-8").splitlines())
    print(f"legacy game3.js: {lines} lines (target: shrink each phase)")
else:
    errors.append("missing game3.js")

if errors:
    for e in errors:
        print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
print("structure ok")

# optional content validation is run separately by CI via tools/validate_content.mjs
