# Architecture

## Status: Phase 1 — file-level modularization

The game started as a single `game3.js` inside one HTML closure. Phase 1 keeps the same runtime closure and fixed-timestep loop, but moves self-contained responsibility areas into `src/` modules assembled by `tools/build_game3.py` through `src/modules.json`.

This is deliberately incremental: it keeps the game playable after every change and avoids a risky big-bang rewrite.

```
src/
  content/     pure game data (enemy archetypes; stage data next)
  core/        pure logic (no DOM, no canvas) — growing target
  render/      canvas 2D drawing modules
  platform/    adapters for web / Steam / WeChat
  app/         composition roots for each platform
  modules.json ordered Phase-1 bundle manifest
```

Build order:

```
prefix + GIMG + BulletML specs
  + sfx_extra.js
  + src/modules.json modules
  + game3.js (legacy core/update/render/audio)
```

## Module rules

- `content/` may contain data only. No DOM, no `ctx`, no side effects.
- `core/` must be platform-neutral: no `window`, `document`, `Image`, `Audio`, `localStorage`.
- `render/` may use the canvas context but must not own simulation state.
- `platform/` owns browser/Steam/WeChat APIs.
- `game3.js` is legacy during migration; new systems should not be added there.

## Platform target

```
                 ┌──────────────┐
                 │  core sim    │
                 │  content     │
                 └──────┬───────┘
        ┌───────────────┼────────────────┐
        │               │                │
   web adapter     Steam adapter    WeChat adapter
   DOM/video       Electron/Tauri   wx canvas/audio
```

See `src/platform/contracts.md` for the interfaces that must be extracted before the WeChat port.

## Near-term extraction order

1. `content/`: enemy archetypes (done), stage/wave data, boss definitions
2. `core/`: fixed-step clock, math/rng, collision helpers, progression state
3. `render/`: player, enemies, bullets, boss phase renderers
4. `platform/`: input, audio, video surface, storage
5. `app/`: web, Steam and WeChat composition roots

## Non-goals for Phase 1

- No ES-module runtime switch yet
- No rewrite of boss logic
- No platform shell yet
- No asset-pipeline change yet
