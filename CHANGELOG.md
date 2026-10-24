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

## 0.2.24-phase6j — main update

- Moved the fixed-step gameplay update to `src/game/step.js`.
- Legacy coordinator is now down to the render/frame composition root and small helpers.

## 0.3.0 — modular foundation complete

- 26 extraction steps, each committed and tagged.
- Legacy coordinator reduced from 4218 to 440 lines.
- Content, core, render, game and web platform modules are separated.
- Added structure checks, content validation, unit tests and CI.
- Final web build and stage-1/stage-5 smoke tests pass.
- Rollback checkpoints and local snapshots are documented in `docs/MIGRATION_LOG.md`.

## 0.3.1 — presentation, fusion, audio and cast pass

- Player hitbox is now a flashing white/cyan/magenta energy core at the exact 6px radius, with rotating ticks.
- Phase-2/3 videos draw their cached first frame as a same-size static underlay, covering loop decoder gaps.
- Boss-5 bullet visuals reduced to match smaller collision bodies.
- Fusion is primed on the first gesture, played automatically and cannot be started/skipped by a normal tap.
- Menu BGM restored to the original `m` track.
- NORMAL fire uses the real `sfx-sel/gun.mp3` blaster sample; fabricated layers remain as fallback.
- Boss blink no longer grants long invulnerability (cap 0.12s).
- Added the supplied stage-1 nebula image beneath the earliest/current layers.
- Finale waits for `TIME IS SAVED` to fade before cast.
- Cast includes all enemy names, wraps long entries, and waits for the last line to leave the screen before `THANK YOU`.

## 0.3.2 — phase alignment and finale polish

- Phase-2/3 boss art center aligned with a +10px phase-2 offset.
- Phase-1 explosion particles/explosion cards enlarged.
- Phase-2/3 static underlay now cycles three glitch-shifted cached frames.
- Fixed player invulnerability persisting from phase-1 death into phase 2 (99 -> 2.8).
- Fusion primed and left playing on first gesture; no click-to-play path.
- Player hitbox uses a bright flashing energy core.
- Cast header fades, long rows wrap, spacing increased to 70px.
- Cast waits for the last row to leave the screen before thanks.
- Stage-1 supplied nebula image is in the bottom layer.
- NORMAL uses the real gun sample.

## 0.3.3 — final boss balance and transition

- Stage-5 enemy HP coefficient back to 1.0.
- Phase-2/3 boss video centers aligned; phase-2 art offset +10px.
- Phase-2 to phase-3 transition checks at exactly 50% HP, independent of ultimate charge.
- Phase-3 entry plays boss-death-class explosions and a 0.72s multi-frame glitch transition.
- Phase-2/3 bullets enforce a player-facing safety lane; bullet-wall gap follows the player.
- Boss blink invulnerability capped at 0.12s.
- Fixed player invulnerability leaking from phase 1 into phase 2.
- Fusion is primed and left playing; no click-to-play.
- Player hitbox is a flashing energy core.
- Cast header fades, rows wrap, spacing 70px.
- Stage-1 supplied nebula image added as bottom layer.

## 0.3.4 — layered nebula, warm hitbox rim, credits

- Stage-1 supplied nebula is now an upper `screen` layer with two independent scroll speeds.
- Player energy core adds a restrained orange rim against the blue/white hull.
- Cast credits now state music composed by 思齐Styx and AI image sources QWEN IMAGE / GPT IMAGE; algorithmic visuals attributed separately.

## 0.3.5 — visible stage1 nebula

- Nebula is now a near-opaque source-over layer above the base backgrounds and below the black-hole layer.
- It scrolls independently at 0.36×; rocks and nebula clouds are visible in game.

## 0.3.6 — warning, missile tail, boss gaps and typography

- Phase-2→3 explosion only applies to stage 5.
- Missile launch tail doubled to 0.64s with a long decay.
- BGM volume +10% (0.605 -> 0.6655).
- Player energy core dimmed to avoid white clipping.
- Stage-1 nebula opacity set to 60%.
- Cast body type increased to 16px; CAST/THANK YOU use white Orbitron.
- Boss-5 safety bullets no longer delete themselves near the player; radial gaps move independently of the player.
- Boss-wall gap widened to two bullets and moves slowly.
- Player respawn state is cleared when WARNING starts.

## 0.3.7 — stage pacing, fodder and laser aim

- Stage 1-4 wave timelines extended 25%; mini-boss echo at the halfway point of each.
- Added dense low-HP fodder formations to all stages for clear-screen pacing.
- Boss-5 lasers now originate toward the player instead of firing at the screen edge.
- BGM +15% to 0.765325.
- Cast body text 20px, line height 84px; white Orbitron headings.
- Phase-2→3 explosion limited to Boss 5.
- Missile tail 0.64s with fade.
- Nebula 60% opacity.

## 0.3.8 — mowing, mini bosses and pacing

- Stage 1-4 timelines extended another 20% (total 1.5x from original).
- Added a 25%-of-stage dense low-HP mowing segment to every stage; fodder fire rate lowered.
- Added 50%-size/50%-HP mini bosses at the halfway point of stages 1-4 with health bars, recolored art, basic attacks plus boss-flavoured ring/beam patterns.
- Waves are delayed while a mini boss is alive.
- Stage 5 adds three pairs of mini bosses at ~55/70/85%.
- BGM +15% to 0.765325.
- Boss-5 lasers re-aim toward the player.

## 0.3.9 — mowing timing, mini boss fix

- Fixed mini bosses firing only once (`aggr` missing → NaN fire timer).
- Mini boss HP raised to 60% of the corresponding boss.
- Stage 1-4 flow extended to 1.8x original.
- Small mowing segment at 7–17%, large mowing segment at 52–77%.
- Fodder count diluted 20%; non-mow filler added across the stage.
- Fodder aggression halved and initial fire delay raised.

## 0.3.10 — missile C sample

- Missile launch now uses the CC BY 3.0 Bottle Rocket sample (trimmed to 0.70s, faded).
- Public-domain Missle Launch is retained in `sfx-sel/` for future heavy missiles.
- Added attribution to Cast and THIRD_PARTY_NOTICES.

## 0.3.11 — missile C original and boss HP

- Missile launch uses the full original Bottle Rocket sample, no trim/EQ/fade.
- A new missile launch stops the previous missile source before starting.
- Big bosses HP ×1.5; phase-2 max now derives from the boosted total.
- Mini bosses HP set to 75% of the boosted big-boss total.

## 0.3.12 — targeted bombs and warning rings

- Enemy/boss bombs now fly to a fixed target point instead of detonating in front of the shooter.
- Target points can be any direction/distance around the player, clamped to the screen.
- A dashed warning ring with exactly the real blast radius is drawn at each bomb target.
- Bomb blast radius is carried on the projectile and reused by the explosion.

## 0.3.13 — longer stages, thinner big mow

- Stage 1-4 timeline extended another 20% (now 2.16x original).
- Large mowing segment interval 1.9s -> 2.375s, reducing density 20%.

## 0.3.14 — bomb radius, mini patterns and boss supplies

- Bomb blast radii reduced: normal 72→48, boss 118→78.
- Missile launch gain reduced 30% (0.90→0.63).
- Mowing internal wave intervals widened: small 2.8s, large 3.2s.
- Six mini bosses now use distinct attack geometries (lattice, fan+beam, fast arcs, gap ring, spiral, mirrored fans+beam).
- Boss fights drop two upgrade pickups every 7.5 seconds.

## 0.3.15 — bomb speed, OD, boss drops and mini labels

- Enemy bomb speed halved (normal 180→90, boss 250→125).
- OD grants full invincibility.
- Boss supply drops every 25s (two pickups).
- Mini boss health labels use per-type names and show their current skill name.
- Sparse low-count filler waves added outside mowing windows.

## 0.3.16 — impact and explosion samples

- S/N impact uses Classic Ricochet (C), pitch-adjusted per weapon.
- Normal explosions use Grenade Explosion (C).
- Boss/large explosions use Explosion Ultra Bass (B).
- Removed stacked synthesized hit/boom layers.
- Added attribution to Cast and THIRD_PARTY_NOTICES.

## 0.3.17 — hit sparks, boss laser, HP and audio

- S/N hits spawn a small expanding impact ring at the hit point.
- Fourth boss cross laser uses fixed cardinal angles; only the charging orb aims.
- Stage-5 mini boss HP corrected from 75% of the boosted boss total to 22%; stages 1-4 remain 75%.
- Stage-5 mini bosses spawn in pairs and drop supplies every 25s.
- M missile count is specialPower+1.
- Missile sample shortened to 0.58s with downward pitch and gain; previous instance cancelled.
- N shot volume -10% and every shot plays (no random skipped sample).
- Player bomb layers large explosion B with public-domain heavy missile A.

## 0.3.18 — centered sparks, atomic mini pairs, movement

- S/N hit spark is drawn at the enemy/boss center; mini boss hurtbox tightened to remove the empty edge area.
- Stage-5 mini bosses spawn atomically as pairs, bypassing the normal enemy cap.
- Mini boss movement varies by type; Mobius and Axis no longer share the same position/motion.
- Stage-5 mini boss HP ratio corrected to 22% of the boosted boss total.
- Mini boss fights drop two supplies every 25s.
- M missile count is specialPower+1.
- Missile sample shortened and pitch-dropped; N shot volume -10% with no skipped shots.
- Player bomb layers B explosion with A heavy missile.

## 0.4.0 — Steam M1 desktop shell

- Added Electron desktop shell with fitted 9:16 window, fullscreen and window-state persistence.
- Added keyboard input: menu navigation, movement, bomb, pause, fullscreen.
- Added gamepad input: menu, movement, bomb, pause.
- Added pause overlay, BGM pause/resume and blur auto-pause.
- Primed all hidden videos for keyboard-driven desktop start.
- Added M1 acceptance document.

## 0.4.1 — mouse controls and mode contracts

- Added mouse hover movement, left-click manual fire and right-click bomb.
- Added Boss Rush / Tower mode descriptors and RankingPort contracts.
- Added docs/MODES_ARCHITECTURE.md; modes are not exposed in the menu yet.

## 0.4.2 — Steam M2 save/settings

- Added versioned save schema, normalization and migration policy.
- Added localStorage save plus Electron atomic save.json mirror.
- Added master/BGM/SFX volume settings and pause-menu settings panel.
- Added fullscreen setting, menu best score, run/stage save hooks.
- Added CloudSavePort and save/cloud documentation.

## 0.4.3 — AEGIS R1 sandbox prototype

- Added AEGIS ship selection, Force, limited shield, charge matrix and touch buttons.
- Added per-ship score persistence and menu ship selector.
- Added W-to-charge conversion for AEGIS.
- Added AEGIS prototype acceptance notes.
