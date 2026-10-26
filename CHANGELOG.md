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

## 0.4.4 — AEGIS audio and tutorial

- AEGIS charge release uses Laser Cannon (A).
- AEGIS Force launch uses Jet Flyby (I).
- F/G/H sonic boom samples reserved as explosion backup candidates.
- Added first-run AEGIS control tutorial.

## 0.5.0 — Steam R2 skins and integration

- Added VECTOR/AEGIS full-image skins with menu SHIP/SKIN selection.
- Added per-ship skin persistence and per-ship best score.
- Added AEGIS shield overlay and first-run tutorial.
- Added PHANTOM locked preview slot.
- Added R2 acceptance notes.

## 0.5.1 — R2 alignment and AEGIS core color

- Aligned skin sprite centers with the player hit core.
- Changed AEGIS Force/core energy to orange-yellow.

## 0.5.2 — EdgeOne build timeout fix

- Stopped re-encoding every embedded image to WebP during CI externalization.
- EdgeOne-compatible build now completes in about 25 seconds locally.

## 0.5.3 — Ship select list

- Removed the PHANTOM locked-preview badge from the main menu.
- Added a SELECT SHIP overlay listing VECTOR, AEGIS, and PHANTOM.
- PHANTOM is disabled and marked COMING SOON.
- SHIP button now opens the ship list; V remains the keyboard shortcut.

## 0.5.4 — Phantom preview placeholder

- PHANTOM row uses a dimmed default ship image instead of a question mark.
- Removed the "STEALTH · IN DESIGN" subtitle; COMING SOON remains.

## 0.5.5 — Phantom Raven preview

- PHANTOM row now uses the Phantom Raven concept silhouette instead of the default VECTOR art.

## 0.5.6 — Phantom Quantum Hunter preview

- PHANTOM row now uses the Quantum Hunter concept silhouette.
- Phantom preview brightness increased.

## 0.5.7 — Skin previews

- SKIN button now shows a thumbnail of the equipped skin.
- Added SELECT SKIN overlay with image thumbnails, names, and equip state.
- B / gamepad RB opens skin selection; click a row to equip.

## 0.6.0 — AEGIS Force redesign

- Force attached now only shields; no auto-fire.
- Force launch is a forward lane clear and deals 2x bomb damage.
- AEGIS bomb removed; Force launch consumes bomb charges.
- Charge damage and visuals increased; normal fire pauses while charging.
- Shield max reduced 40%, break time 10s, rebuild at 20.
- Added AI-generated amber force-field overlay.

## 0.6.1 — Charge damage formula and per-weapon ranges

- Charged damage = normal weapon DPS × charge time × 1.35.
- N/S/L/M charge attacks now have distinct visuals and ranges.
- Laser normal beam is hidden while charging.
- Manual mouse fire is blocked while charging.

## 0.6.2 — Force center alignment

- Force X now follows the current AEGIS skin's visual offset.
- Shield field, lane attack and return target share the same centerline.

## 0.7.0 — Ship variants, wingman economy and AEGIS OD

- VECTOR wingmen no longer block damage; death removes one wingman.
- Added VECTOR HP/bullet/damage/laser-rate variants.
- AEGIS W levels now raise Force radius and no longer add charge.
- AEGIS OD auto-fires charged attacks at the current weapon level every 0.5s.
- Added AEGIS shield/radius/charge-time/charge-damage skin modifiers.
- Temporal Wanderer gains its normal-bullet buff after OD ends.
- Tests now launch Electron with --mute-audio.

## 0.7.1 — Charge presentation and Force feedback

- N charge is a wide three-lane lance; S has no range cap.
- L charge is an instant full-height piercing beam.
- M charge fires 12 missiles in a wide row.
- Charge visuals follow the moving ship.
- AEGIS W restores 20 shield charge.
- Shield break has sound, burst flash and shake; broken state hides the field.
- Force radius levels now have distinct colors and an R-level label.

## 0.7.2 — Force collision and charge polish

- Force now deals contact damage while flying instead of instantly damaging the lane.
- Force clears bullets and hits each enemy/Boss once per launch.
- Broken recovery reduced from 10s to 7.5s.
- W restores 20 shield charge.
- L charge is a full-height piercing beam; M charge fires 12 missiles in a row.
- Shield break flash/shake/SFX and Force level colors.

## 0.7.3 — Charge sizes and stationary bullet fix

- N/S charge projectile counts doubled with larger projectile visuals and same total damage.
- L charge beam thickened; M charge changed to 10 wider missiles.
- Force radius tiers have stronger size/color differences.
- Fixed near-stationary enemy bullets by clamping the aggression speed multiplier.

## 0.7.4 — Bomb and Force damage baseline

- VECTOR bomb base damage is now 200; it no longer applies a 999 instant-kill to enemies or mini-bosses.
- AEGIS Force collision damage raised to 400 (2x bomb).
- Bomb still clears enemy bullets and uses normal HP/death handling.

## 0.7.5 — AEGIS charge baseline and Force repair

- AEGIS base charge time and damage reduced 25%.
- Break SFX changed to explosion/energy.
- Force flight visual scales with its radius tier.
- Broken Force can be restored to 100% with the bomb key/Force button.
- Charged attacks stay anchored to the player after Force launch.
- Force radius L1 -40%, L4 unchanged, smooth intermediates; stronger tier colors/opacity.

## 0.8.0 — Two-step ship/variant selection

- Selecting a main ship now opens its variant/loadout screen directly.
- SKIN terminology changed to VARIANT in the menu and overlays.
- Ship cards show a gameplay trait summary.
- Variant cards show HP/shield/charge/damage/post-OD traits.

## 0.7.6 — AEGIS Force fixes and bomb cap

- AEGIS no longer gets wingmen when starting later stages.
- AEGIS starts with 3 Force charges; max increased to 9.
- Force field asset recentered; duplicate ring removed.
- Force fields now use four level-tinted assets.
- Added Force core candidate art for selection.

## 0.8.1 — New key art and menu background

- Archived the new poster and extracted branding assets under `assets/branding/`.
- Replaced the main-menu background with the new key art.
- Moved menu controls above the poster logo so the title and emblem stay fully visible.
- Added branding asset keys for future menus/capsules.

## 0.8.2 — Menu top info and tab title

- Moved `5 STAGES · 5 BOSSES` and control hint to the very top of the menu at 9px/7px.
- Added a subtle top shade for readability.
- Browser tab title updated to `STELLAR ASSAULT · 5 Stages`.

## 0.8.3 — Bottom info comparison variant

- Added `?menuinfo=bottom` to place `5 STAGES · 5 BOSSES` and the control hint at the very bottom.
- Default remains the top placement.

## 0.8.4 — Match menu shade to relocated info

- Shortened the central menu shade to cover only SHIP/stage/START/BEST controls.
- Removed the leftover dark band under the old lower text position.
- Top and bottom info bands remain tied to their respective placements.

## 0.8.5 — Force underlay and bottom menu default

- Menu info now defaults to bottom; `?menuinfo=top` keeps the top variant.
- Force field no longer rotates, eliminating the wandering ring.
- Force field is centered on the ship, dimmed and moved below the ship layer.
- Force field opacity/brightness reduced to stop it covering the ship.
- Charge release no longer emits the 18-particle light burst.
- M-charge visual row now matches its 10 missiles.

## 0.8.6 — Align Force circles to core

- Recentered all Force field textures so the bright ring is exactly at (64,64).
- Outer ring, field texture and energy core now share one anchor.
- Removed field rotation and centered the field on the ship.
- Moved the Force field beneath the ship layer with reduced brightness/opacity.
- Removed the charge-release particle burst.
- Menu info now defaults to the bottom placement.

## 0.8.7 — Charge polish and no pickup magnet

- Removed pickup attraction; ammo/weapon items now fall and must be collected manually.
- M-charge full-screen preview lights removed; missiles only lengthen, never widen.
- S-charge fan angle gap reduced by 50%.
- N-charge projectiles use cyan.
- N-charge muzzle flash shortened so it no longer covers the screen.
- Menu info defaults to the bottom.
- Force field circles recentered to the energy core.

## 0.8.8 — AEGIS charge and laser polish

- Removed all item magnetism; pickups now fall freely.
- AEGIS baseline charge time/damage reduced another 25%.
- Laser charge visual width now uses the same half-width as its hit test.
- N charge no longer shows a laser; fires 3 sequential volleys with blue projectiles.
- M charge preview lights removed; missiles only lengthen, never widen.
- S charge angle gap reduced 50%.
- Force rings remain centered on the energy core and below the ship.

## 0.8.9 — Force ring coordinate fix and charge details

- Fixed Force color ring drawing at (2x,2y); it now draws at local (0,0).
  This was the stray ring that drifted along the player's doubled drag path.
- Restored pickup magnetism only within 40px (ship sprite radius).
- Laser charge visual width now matches its hit half-width.
- N charge: no laser animation; 3 sequential blue volleys.
- M charge: no preview lights; missiles lengthen only.
- S charge angle gap reduced 50%.

## 0.8.10 — N burst timing and SFX

- N three-volley interval reduced from 0.11s to 0.03s.
- Each N volley now plays the AEGIS charge-fire SFX, for 3 total.

## 0.9.0 — Vector default and start loadout confirmation

- New sessions default to VECTOR in the menu.
- Pressing START now opens a loadout confirmation panel.
- Confirm & Start launches; Change Ship opens ship selection; Cancel returns.
- Keyboard Enter confirms, Escape cancels, V changes ship from the panel.

## 0.9.1 — Restore explosion shock rings

- Restored the normal enemy / elite / enemy-bomb explosion shockwave rings.
- The earlier drifting ring was the Force double-coordinate bug, not these rings.

## 0.9.2 — Force clear, shield core and N lockout

- Launched Force now clears enemy bullets and enemy beams (including boss blue lasers).
- Launch clear radius increased relative to the shield core.
- Pickup magnet radius increased 50% (40 → 60).
- Attached shield only checks a 12px core radius; Force radius applies to launch only.
- N triple burst now locks normal fire for 0.2s after the final volley; OD charge shots are unaffected.

## 0.9.3 — OD laser alignment, Force return speed, boss clear

- AEGIS OD auto-charged attacks always reach release threshold, so OD laser uses the same color/width as normal charge.
- Force return speed is now 420 px/s, matching launch speed.
- Launched Force clears enemy bullets, beams and orbiting orbs; clear radius increased.
- Covers large boss projectiles and rotating boss attacks across all stages.

## 0.9.4 — Force blocks lasers

- Force no longer deletes enemy beams; it truncates them at the Force surface.
- Blocked beams cannot damage the player until Force moves away.
- Added a bright impact cap at the blocked beam endpoint.

## 0.9.5 — Phantom Butterfly source texture

- Added `sk_phantom_butterfly` from the supplied character sheet.
- Cropped and resized only; no redraw, recolor or mirroring.
- Kept the same 80×80 sprite canvas as Quantum/Raven.

## 0.9.6 — Unify Phantom sprite cells

- Rebuilt Quantum, Raven and Butterfly from their full 512px design cells.
- Preserved original padding and all floating shards; no tight-bbox scaling.
- Removed title text and Raven detail cards only.
- Kept all three on the same 80×80 canvas.

## 0.9.7 — Phantom wing restoration

- Raven right wing tip restored by moving the detail-card mask outward.
- Butterfly upper-left wing restored by replacing the rectangular title mask with a title-only mask.
- Phantom trio remains on the full 512px cell with original padding.

## 0.9.8 — Standalone Butterfly source

- Replaced Butterfly with the standalone 1024×1071 source art.
- Removed only the black background and outer frame.
- Preserved the full wingspan and all floating shards.
- Output remains 80×80 with no redraw or mirroring.

## 0.9.9 — Standalone Raven source

- Replaced Raven with the standalone 368×443 source art.
- Removed only the black background, outer frame and bottom caption remnants.
- Preserved the full wings, talons and floating fragments.
- Output remains 80×80 with no redraw or mirroring.

## 0.9.10 — Phantom playable prototype

- Unlocked Phantom and its three variants.
- Added cloak + decoy clone skill with charge pickups.
- Clones copy the current full weapon/level, deal 50% damage, auto-fire, take hits and expire.
- Added clone caps, W upgrades, death reset and oldest-clone replacement.
- Added Phantom HUD, skill button and selection traits.
- Enemy/boss aiming now prefers clones and ignores a cloaked player without clones.

## 0.9.11 — Qwen Phantom sprite set

- Adopted Qwen Image 2.1 transparent versions for Quantum, Raven and Butterfly.
- Cropped each to its visible alpha bounds and normalized to a 70px max dimension on the common 80×80 canvas.
- No further redraw, recolor or mirroring.

## 0.9.12 — Clone hitbox and E/D pickups

- Clone bullet hitbox now matches the player body radius instead of a large 20px circle.
- Renamed pickup letters: B → E (Energy/ability charge), W → D (Drone/clone upgrade).
- Updated drop tables, item icons, collection logic and messages.
- Old W/B debug items are still accepted as aliases.

## 0.9.13 — Autonomous clone seeking

- Clones no longer stand still.
- Each clone selects the nearest enemy/Boss, moves to a point below it, holds formation spacing and auto-fires.
- Reacquires a target when the current enemy dies.
- Formation spacing adapts to the current clone cap (2 or 4).

## 0.9.14 — Clone aim instead of chase

- Clones stay near the player in formation; they no longer fly up to enemies.
- Each clone selects the nearest enemy/Boss and rotates its copied weapon pattern toward that target.
- Normal/spread/missile projectiles are rotated after spawning; laser clones use an aimed beam.
- Clone hitbox remains player-sized.

## 0.9.15 — Forward-firing clone aim

- Clones fire forward only, like the player.
- Aiming is done by horizontal movement under the target; clones no longer rotate projectile patterns.
- Clones keep a safe vertical formation near the player.
- Clone laser visual now matches the player laser palette, width, gradient and endpoint glow.

## 0.9.16 — Clone destruction FX and whoosh candidates

- Destroyed clones now trigger a real explosion, particles and boom SFX.
- Expired clones fade with particles only.
- Added four whoosh candidate sounds for the Phantom skill; not yet wired.

## 0.9.17 — Phantom skill dash, B whoosh and menu stats

- Phantom skill now plays the B low whoosh synthesis.
- After spawning clones, the player snaps to the safest nearby candidate spot, away from bullets/beams, with a trail and afterimage.
- Ship-select rows now include readable stat lines.

## 0.9.18 — H/C menu sounds

- Added H (holo) and C (metal) UI samples.
- H plays on navigation/selection; C plus a soft H layer plays on confirm.
- Wired into ship select, variant select, start confirmation, stage select and menu buttons.
- Added electronic UI click candidates E–I to the asset lab.

## 0.9.19 — Clone base damage and Raven cloak tuning

- Clone base damage fixed at 50% and excluded from the cloak damage buff.
- Raven cloak duration increased to 4 seconds (others remain 3).
- Raven cloak attack bonus increased to +70%.
- Updated Raven variant text and mechanics notes.

## 0.9.20 — R2 audit and menu sound routing

- Menu navigation now uses F (data chirp); confirm uses H+C layered.
- Preserved PHANTOM best score through save normalization.
- Added `docs/R2_PROGRESS_AUDIT.md` with R2 gaps, early PHANTOM scope and R3–R9 next steps.

## 0.9.21 — Clone invulnerability, Raven +100%, default charges

- Clone takes one hit, then gains 1 second of invulnerability and a shield ring.
- Raven cloak attack bonus increased to +100% (still 4 seconds).
- All ships now start and respawn with 3 ability charges.

## 0.9.21 — Clone hit invulnerability and Raven tuning

- Clone takes one hit, gains 1s invulnerability and shows a shield ring.
- Raven cloak attack bonus raised to +100%, duration remains 4s.
- Initial and post-death ability charges are 3 for every ship.

## 0.9.22 — R2 tutorials, smoke data and R3 planning

- Ship choice is session-only again; every launch starts at VECTOR.
- Ship-select panel gains a TUTORIAL action for VECTOR, AEGIS and PHANTOM.
- Menu feedback is F+C for movement and H+C for confirm.
- Added `docs/BALANCE_BASELINE.md` with default-variant DPS smoke results.
- Added `docs/MULTIPLAYER_R3.md`; R3 is now two-player co-op and the old R3–R9 plan shifts to R4–R10.

## 0.9.23 — R2 tutorials, smoke data and R3 roadmap

- Added tutorial action to ship select; VECTOR, AEGIS and PHANTOM each have two tutorial pages.
- Ship choice is session-only; every launch starts at VECTOR.
- Menu movement uses F+C; confirm uses H+C.
- Added default-variant DPS baseline and smoke notes.
- R3 is now two-player co-op; old R3–R9 shifted to R4–R10.

## 0.9.24 — R2 acceptance close-out

- Added per-ship tutorial entry and two-page tutorials.
- Confirmed session-only ship selection, 3 default charges, stage-flow clear for all three ships.
- Added touch emulation and 1280×800 Deck viewport smoke.
- Rewrote `STEAM_R2_ACCEPTANCE.md`; remaining items are hardware/manual QA.

## 0.9.25 — Switch port feasibility and R11

- Added `docs/SWITCH_PORT.md` with engine, layout, certification and cost boundaries.
- Added R11 Switch port as a gated platform track after R10.
- Downgraded Steam Deck from a standalone milestone to R10 best-effort verification.

## 0.9.26 — R3 kickoff and Windows test checklist

- Added `docs/WINDOWS_VM_TEST.md`.
- Added `docs/R3_KICKOFF.md`; R3.0 starts with local two-player vertical slice.
- Windows VM test is blocked by missing VM/Windows image on the current macOS host.

## 0.9.27 — R3.0 local co-op first slice

- Added CO-OP toggle to the start confirmation.
- Added P2 VECTOR slot: IJKL / second gamepad, auto-fire, independent HP/lives and U bomb.
- Added P2 HUD, collisions, respawn and nearest-player enemy aiming.
- Single-player paths remain active when CO-OP is off.

## 0.9.28 — Two co-op input modes

- CO-OP cycles OFF → 2P KEYBOARD → P1 KEYBOARD + P2 MOUSE.
- P2 mouse controls position and left-click bomb; P1 is keyboard-only in that mode.
- P2 second gamepad remains available.

## 0.9.29 — P2 full ship slice

- P2 mirrors P1's selected ship/skin (VECTOR/AEGIS/PHANTOM).
- P2 has independent AEGIS charge/Force and PHANTOM cloak/clone state.
- P2 can collect pickups; primary U / secondary O, mouse left/right, gamepad B/X.
- P2 draw uses the full player renderer for Force/cloak/clone effects.

## 0.9.30 — Independent P1/P2 loadouts

- Added P2 SHIP / P2 VAR controls in the start confirmation.
- P1 and P2 can use different ships and variants.
- The same exact variant is blocked for both players; P2 auto-skips conflicts.
- P2 AEGIS/PHANTOM state remains independent.

## 0.9.31 — P2 wingmen and laser

- P2 VECTOR wingmen now update, render and fire after D pickups.
- P2 laser has independent cooldown, damage, beam and hit endpoint.

## 0.9.32 — Local co-op close-out

- P2 skill HUD (AEGIS Force/Shield, PHANTOM cloak/clones, VECTOR wing).
- P2 wingmen and laser verified, P2 E/D pickups verified.
- Co-op boss-flow smoke passes for independent P1/P2 loadouts.

## 0.9.33 — Local co-op acceptance

- P2 death/revive and single-player regression smoke pass.
- Local co-op feature set is closed; remaining is full-stage balance and World/PlayerSlot refactor before LAN.

## 0.9.34 — LAN co-op prototype

- Added `tools/lan_server.py`: static dist + WebSocket room relay.
- Added Host/Join room UI, host canvas JPEG stream and remote P2 input.
- LAN client supports IJKL movement and U/O skills; no audio yet.

## 0.9.35 — LAN invite links and host-only room

- Added invite links (`lanjoin=code`) with auto-join.
- Added 2P host-only room where P1 and P2 join separately.
- Added remote P1 input; host can be authority/spectator.
- Kept host-as-P1 mode.

## 0.9.36 — LAN client loadouts, audio, 30fps

- P1/P2 LAN clients choose independent ships/variants; host enforces distinct variants.
- Host streams PCM audio to both clients.
- Frame stream moved to ~30fps, input to ~40Hz.
- Host-only room supports two client slots; host-as-P1 retained.

## 0.9.37 — LAN touch clients

- Added virtual joystick and SKILL/FORCE buttons to LAN clients.
- Both P1/P2 clients can use touch-only devices.
- Client host mode display corrected.

## 0.9.38 — LAN touch drag correction

- Removed the virtual joystick from LAN clients.
- Touch clients now use full-screen drag with absolute game-coordinate targets.
- Bottom-right skill zones map to the game's primary/secondary buttons.

## 0.9.39 — LAN ready lobby

- Host-only room now auto-starts when P1 and P2 are both ready.
- P1 selects stage and loadout; P2 selects loadout only.
- 30s no-ready timeout randomizes base ships and starts stage 1.
