# Development

## Requirements

- Python 3
- Pillow
- Node.js 22 for tests and syntax checks

## Build

```bash
python3 -m pip install -r requirements.txt
bash tools/build_pages.sh
```

`build_pages.sh` now removes `dist/` before every build, then writes only:

```text
dist/index.html
dist/build.txt
dist/assets/
```

## Tests

```bash
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs
node tools/validate_content.mjs
python3 tools/check_structure.py
node tools/verify_release.mjs
```

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md). The build concatenates modules listed
in `src/modules.json`; `src/legacy/game.js` remains the composition root.

## Assets

- `assets/` is runtime content.
- `gpt-assets/` is source art; not copied unless selected by the build.
- `attic/` is archive-only and never copied into a build.
- Do not add generated build output to Git.

Run the release guard before tagging:

```bash
node tools/verify_release.mjs
```
