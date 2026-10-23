# Architecture handoff

## Current state

The web game builds from `src/` modules plus the legacy coordinator. The coordinator is now a 440-line composition root, not the gameplay implementation.

```text
src/
  core/        fixed step, math, collision
  content/     enemy archetypes, stage waves, boss definitions
  render/      player, enemies, bullets, bosses, background, effects, UI, weapons
  game/        boss patterns, ultimates, enemies, player weapons/state, combat, stage flow, step
  platform/    web input, video, audio; adapter contracts
  legacy/      game.js composition root + sfx extras
```

Build order is defined in `src/modules.json`; every module is concatenated into the web closure for Phase 2.

## Commands

```bash
# structure and content checks
python3 tools/check_structure.py
node tools/validate_content.mjs
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs

# web bundle
python3 tools/build_game3.py
python3 tools/optimize_delivery.py rrootage3.html dist/full.html
python3 tools/externalize_assets.py dist/full.html dist/index.html
# copy assets/video, audio, fonts, bg into dist before publishing
```

## Remaining technical debt

1. `src/platform/web/video.ts` equivalent is still a web-only adapter; WeChat needs a frame/atlas or texture implementation.
2. Web audio, input and video are separate adapters but share the legacy closure; Phase 3 should pass explicit ports.
3. `src/game/*` still reads globals (`boss`, `player`, `enemies`, `ebullets`). Phase 3 should inject a `World`/`Projectiles` interface.
4. `src/legacy/game.js` still owns the frame/render composition and some low-level drawing helpers.
5. No deterministic replay yet; fixed-step and seeded RNG are prerequisites.

## Rollback

Every step has a tag in `docs/MIGRATION_LOG.md`. The final foundation checkpoint is `checkpoint/modular-foundation`. Local source/history snapshots are in `.backups/`.
