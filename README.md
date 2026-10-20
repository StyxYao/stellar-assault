# STELLAR ASSAULT

A three-stage vertical shmup built as a single-file, mobile-first HTML5 game. The project is a personal study tribute to rRootage / BulletML and classic arcade shmups.

## Status

- 3 stages, 3 bosses, multi-phase patterns, boss ultimates
- 4 ammo types: Normal, Spread, Laser, Missile (Lv1–Lv4)
- Wingmen, bombs, health/lives, drops, supply transport
- Touch controls with a finger-offset drag mode
- Canvas 2D + WebAudio, no runtime dependencies

## Build

Requirements: Python 3 and Pillow.

```bash
python3 -m pip install -r requirements.txt
python3 tools/build_game3.py
```

This produces `rrootage3.html` in the repository root. Open it directly or serve it over HTTP.

Optimized delivery build (removes unused legacy images and recompresses embedded JPEGs):

```bash
python3 tools/optimize_delivery.py rrootage3.html dist/stellar-assault.html
```

Generated files are ignored by Git. Do not commit `rrootage3.html`, `dist/`, or delivery builds.

## Repository layout

```text
game3.js                  main game source
sfx_extra.js              embedded Kenney/Freesound SFX
bossrush.html             legacy build template/prefix with embedded art/BGM
gpt-assets/               boss, enemy, bullet, background source art
player-v2/                player ship frames
sfx-sel/                  source SFX samples
assets/bullets/           normalized bullet sprites
bg-*.jpg                  stage/menu backgrounds
tools/build_game3.py      single-file build
tools/optimize_delivery.py delivery-size optimizer
```

## Controls

- Drag anywhere: the ship follows above the finger (touch)
- Auto-fire
- Tap the BOMB button: bomb
- Pickups: P upgrades ammo level, A cycles ammo type, W adds/upgrades wingman, B bomb, 1UP life

## Deployment

### Cloudflare Pages (recommended)

Create a **Pages** project, not a Worker. Settings:

- Production branch: `main`
- Root directory: leave empty (repository root)
- Build command: `bash tools/build_pages.sh`
- Build output directory: `dist`
- Environment: `PYTHON_VERSION=3.11`

Do not set the root directory to `dist`; that directory does not exist until the build has run.

### Cloudflare Workers Builds

If the dashboard shows a **Deploy command** field, you created a Worker. Settings:

- Root directory: leave empty
- Build command: `bash tools/build_pages.sh`
- Deploy command: `npx wrangler deploy`
- Environment: `PYTHON_VERSION=3.11`

`wrangler.jsonc` points Workers static assets at `./dist` and uses `src/worker.js` as the asset-serving entry point.

The script creates a local virtualenv, installs Pillow, rebuilds the game, then writes `dist/index.html`.

Next: EdgeOne Makers for China web delivery, then COS for WeChat Mini Game assets. See `docs/EDGEONE.md`, `docs/TENCENT.md`, and `docs/ROADMAP.md`.

## Licensing

Code and original art: all rights reserved unless a separate license is added.

Third-party assets and engines are documented in `THIRD_PARTY_NOTICES.md`.
