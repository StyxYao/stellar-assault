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

## 0.2.5-phase4a — all stage wave data

- Extracted stage 1-4 wave tables to `src/content/stage-waves.js`.
- STAGES now consumes content modules; stage-5 remains separate.
- Content validator checks all five stage wave tables.

## 0.2.6-phase4b — boss content

- Extracted `BOSSES` and `BOSS_PALETTES` to `src/content/bosses.js`.
- Content validator checks five boss definitions and six palettes.

## 0.2.7-phase5a — web video adapter

- Moved video element creation, hidden DOM host and first-gesture priming to `src/platform/web/video.js`.
- WeChat will replace this adapter with a video-surface implementation.

## 0.2.8-phase5b — enemy renderer

- Moved stage-5 echo rendering and regular enemy rendering to `src/render/enemies.js`.

## 0.2.9-phase5c — bullet renderer

- Moved `ebSprite`, bullet constants, `drawCrystalEB` and `drawEB` to `src/render/bullets.js`.

## 0.2.10-phase5d — background renderer

- Moved scrolling, kaleidoscope, recursive and stage background rendering to `src/render/background.js`.

## 0.2.11-phase5e — boss renderer

- Moved all boss visuals (Hedron, phase videos, phase rings, overlays, sprite layers) to `src/render/bosses.js`.

## 0.2.12-phase6a — web audio adapter

- Moved BGM playback, SFX samples, synthesis, buses and laser loop to `src/platform/web/audio.js`.
- Game code calls the same `playBgm` / `sfx` interface.

## 0.2.13-phase5f — effects renderer

- Moved explosion, phase FX, item, OD aura/laser FX, bomb FX and pickup messages to `src/render/effects.js`.

## 0.2.14-phase5g — UI and cutscenes

- Moved HUD, menu, banners, boss omen, fusion/finale/cast screens and end screen to `src/render/ui.js`.

## 0.2.15-phase5h — player weapons

- Moved wing beams, shots, missiles, beams, options and player laser to `src/render/weapons.js`.

## 0.2.16-phase6b — legacy isolation

- Moved the remaining coordinator from root `game3.js` to `src/legacy/game.js`.
- Moved `sfx_extra.js` to `src/legacy/sfx-extra.js`.
- Root source tree now contains only modules plus built HTML artifacts.

## 0.2.17-phase6c — boss patterns

- Moved Boss aimed/ring/spiral/wall/broadside/seraph/vortex/crossfire/hive/halo/gatling/bomb/rotating-laser/cross-laser/chronos attacks to `src/game/boss-patterns.js`.

## 0.2.18-phase6d — player weapons simulation

- Moved weapon names/cycling, damage factor, shot creation, NORMAL/SPREAD fire, missiles and wing laser to `src/game/player-weapons.js`.

## 0.2.19-phase6e — enemy systems

- Moved wave spawning, enemy scaling, six stage-5 attacks and generic enemy fire to `src/game/enemies.js`.

## 0.2.20-phase6f — boss ultimates

- Moved ultimate dispatch, four boss ultimates, fused-boss signatures and signature tagging to `src/game/boss-ultimates.js`.

## 0.2.21-phase6g — player state

- Moved bombs, hit handling, enemy removal/drops, weapon ammo, OD gain and item collection to `src/game/player-state.js`.

## 0.2.22-phase6h — combat updates

- Moved beam/laser updates, wingmen, options, missiles, OD laser, blast zones and transports to `src/game/combat.js`.

## 0.2.23-phase6i — stage flow

- Moved run start, stage transitions, boss warn/fusion/phase flow and death transition to `src/game/stage-flow.js`.
