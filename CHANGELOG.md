# Changelog

## 0.2.0-phase1 — modular foundation

- Added `src/` structure and `src/modules.json` build manifest.
- Extracted stage-5 enemy archetype data to `src/content/enemy-archetypes.js`.
- Extracted player hitbox rendering to `src/render/player-hitbox.js`.
- Added player hitbox ring/dot indicator at the exact collision radius.
- Added architecture, roadmap and platform contract docs.
- Added structure checker and CI smoke workflow.

## 0.2.1-phase2a — content and clock extraction

- Extracted stage-5 wave table to `src/content/stage5-waves.js`.
- Extracted fixed-step accumulator to `src/core/fixed-step.js`; main loop now uses it.
- Added content validator and fixed-step unit test.
- Added checkpoint/step tags and migration log.

## 0.2.2-phase3a — math and player renderer

- Extracted `rand`, clamp/lerp/dist helpers to `src/core/math.js`.
- Extracted player ship rendering to `src/render/player.js`.
- Added math unit test and player module smoke coverage.

## 0.2.3-phase3b — collision core

- Extracted `circleOverlap` / `circleContains` to `src/core/collision.js`.
- Replaced player-vs-enemy, orb, bullet and enemy-bullet circle checks.
- Added collision unit test.

## 0.2.4-phase3c — web input adapter

- Moved pointer state, coordinate mapping and pointer handlers to `src/platform/web/input.js`.
- Game/menu functions remain closure hooks during migration.
