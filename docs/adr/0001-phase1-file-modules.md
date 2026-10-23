# ADR 0001: Phase-1 file modules inside the legacy closure

## Status
Accepted

## Context
The game is a single 4k-line `game3.js` closure. A full ES-module or TypeScript rewrite would put the working game at risk and block ongoing fixes.

## Decision
Move self-contained responsibility areas into `src/` modules and concatenate them through `src/modules.json` in the existing build. Keep the same runtime closure and fixed-step loop.

## Consequences
- The game stays playable after every extraction.
- Clear file ownership now; ES-module/platform split can follow without a big-bang rewrite.
- `game3.js` is explicitly legacy and should only shrink.
- Modules must not rely on import/export until Phase 2.
