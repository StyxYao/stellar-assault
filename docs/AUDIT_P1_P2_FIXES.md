# Audit P1/P2 execution log

Branch: `audit/p1-p2`  
Base: `audit/p0` / `35e3d73`

## P1-01 Input

- Fixed `desktopConfirm()` using undefined `k`/`e` in the control-select path.
- Added keyboard control-select navigation and selection.
- Reused the already-read gamepad A/B edge instead of polling it twice.
- A single gamepad can now drive P2 when P1 is not using gamepad.
- `P` and `Esc` pause in play/boss.

## P1-02 Video lifecycle

- Removed the menu pointer path that started all four Stage 5 videos.
- `loadStageVideos()` no longer reloads a video that already has data.
- Added `prepareStage5Videos()`, `setStage5Phase()`, `stopStage5Videos()`.
- Stage 5 background starts on stage entry; hedron/phase2/phase3 switch by Boss phase.
- Fusion pauses the phase videos; fusion cleanup pauses the fusion video.
- `drawHedronRecursiveForm()` now uses `videoFrameSource()`.
- Animations remain enabled; no static fallback.

## P1-03 Boss damage / Phantom

- Added `damageBoss(amount, source)` with Boss invulnerability and phase-threshold processing.
- Routed AEGIS beam, AEGIS Force, Phantom laser, P2 laser and bomb damage through it.
- `phantomCloneFire()` restores the main player state in `finally`.
- Phantom cap documentation now matches the hard-cap implementation.

## P1-04 Run statistics

- Mini-Boss wave delay is run-local (`waveDelay`); stage definitions are never mutated.
- No Miss uses actual damage taken (`stageStats.tookDamage`), not remaining lives.
- Clear time uses elapsed run time from stage start and includes Boss time.
- Stage transitions reset the stats object.

## P1-05 AEGIS geometry

- `drawForceField()` now takes a **collision radius**, draws a slightly larger aura, and
  draws a solid boundary at the real hit radius.
- Attached and detached Force both use the shield collision radius.
- Beam blocking uses `aegisCoreX()` and shield radius.
- Charge origin uses `aegisCoreX()`.

## P1-06 CI

- Desktop workflow now runs unit/content/structure/release checks.
- CI builds the web bundle and runs `tools/render_smoke.mjs`.
- Smoke checks: menu starts no videos, Stage 5 phase 0/1/2 render with videos paused,
  no page errors, and `P` pauses.

## P2-02 Diagnostics

- Added `src/core/errors.js` with `reportError()` and a bounded recent log.
- Render/frame/video errors go through it; repeated keys are logged once.

## P2-03 Save / CSP / debug

- Save volume normalization uses `Number.isFinite()` via `finiteUnit()`.
- Desktop file-save load reapplies selected skins.
- Mutating debug helpers require `?debug=1`; diagnostics remain available.
- Build injects a CSP allowing self/data/blob assets, LAN WebSocket, inline game
  scripts and the BulletML expression evaluator (`unsafe-eval` is required by
  the upstream BulletML runtime).

## P2-04 Desktop

- Minimum window reduced to 360×640 so 800px-high work areas fit.
- Window state writes debounced to 250ms.
- Desktop README pause/save statements updated.

## P2-01 / P2-05

- P2-01: first boundaries documented in `docs/ARCHITECTURE_DEBT.md`; a full
  ProjectileRegistry/PlayerDamageService refactor is intentionally not forced
  into this bug-fix branch.
- P2-05: owner confirmed BGM and supplied/generated artwork redistribution rights
  on 2026-10-28. BSD/CC attribution and package/store legal text remain packaging
  gates; see `docs/RELEASE_LEGAL_BLOCKERS.md`.

## Verification

```text
fixed-step ok
math ok
collision ok
content ok
structure ok
release guard ok
render smoke PASS
```

Raw non-interactive debug helpers require `?debug=1`.

## Stage 5 phase 3 opacity hotfix

- Phase 3 video no longer uses `screen` blending (which washed out the boss and made it look transparent).
- A one-time luminance alpha mask is generated from the first decoded frame; black background and the central hole become transparent, the body stays opaque.
- The mask is applied in the RVFC cache once per decoded frame, then drawn with `source-over`.
- Only a small `blur(1.2px)` edge feather is applied.
- Removed the stale `phaseGlitchFrames()` call that threw while the phase 3 video was starting.
- Render smoke now plays the real phase 3 video and verifies the mask is generated.
