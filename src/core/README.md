# core

Target home for platform-neutral simulation code.

Rules:

- no `window`, `document`, `Image`, `Audio`, `localStorage`
- deterministic where possible (seeded RNG)
- fixed-step friendly
- testable with plain Node

Phase 1 does not move gameplay here yet; it establishes the boundary.
