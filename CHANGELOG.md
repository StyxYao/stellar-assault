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
