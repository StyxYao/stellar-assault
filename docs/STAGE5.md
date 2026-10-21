# Stage 5 — TIME'S END / 时空尽头

Status: implemented as the final stage.

## Design pillars

- **Kaleidoscope, not tunnel** — the background is a fixed, slowly breathing fractal mandala rather than another scrolling wormhole.
- **Geometry becomes enemy** — final-stage enemies are recursive shards, prisms and echo wraiths arranged in mandalas, spirals and fractal rings.
- **Boss as a composite** — CHRONOS ECHO is what remains when the first four bosses are absorbed by a singularity.
- **Climax over endurance** — dense but readable patterns, phase escalation, a dedicated final track and a distinct ending.

## Background

- `assets/bg/stage5-main.webp` — AI-generated kaleidoscopic crystal space.
- **Two** counter-rotating regions share one center:
  - Inner region: counter-clockwise.
  - Outer region: clockwise.
- They overlap through a 58px feathered alpha transition; no drawn rings, no gear outlines.
- The exact center is a small, static black hole with a thin photon ring and a soft violet halo.
- No accretion disk, no rotating eye, no tunnel scroll.
- The black hole is the typhoon eye: the two crystal regions move around it while the center stays still.

## Boss 5 entrance

- The four old bosses enter **one at a time**, not as a group.
- Phase 1 uses only the new AI Hedron-like entity (`boss_5_phase1.png`); no old-boss armor.
- Each boss moves from off-screen toward the black hole / distortion core.
- While moving it leaves a chain of whole-texture afterimages.
- At the core its whole sprite is stamped into a two-layer 8-way rosette:
  - Outer ring: 8 copies.
  - Inner ring: 4 copies, 0.62 scale, offset angle.
  - Source-over overlap, no depth sorting: copies visibly overlap and occlude each other.
- Finished rings remain in place around the eye for the next boss.
- After all four rings are formed, the AI distortion frames absorb them and the phase-1 entity materializes.
- When HP crosses 60%, the entity is encased by the four boss copy-rosettes in a 2.6s phase-2 transition; phase-2 art is the composite form.
- AI frames: `b5_entity`, `b5_fusion_mid1`, `b5_fusion_mid2`.
- Boss 5 HP is ×1.5 on top of the global multiplier: **10080**.
- Cinematic labels: `FOUR ECHOES` → `CONVERGENCE` → `SINGULARITY` → `CHRONOS ECHO`.

## New enemies

| Type | Name | Role |
|---|---|---|
| 9 | Fractal Shard | fast, aimed shard; appears in recursive rings |
| 10 | Kaleido Prism | geometric radial burst with a player-facing gap |
| 11 | Echo Warden | elite echo wraith; fan + echo beam |

## Formations

- `fractal` — 9–18 shards on recursive polygon points.
- `mandala` — evenly spaced enemies converging into a rotating ring.
- `spiral` — offset ring entry that rotates into a spiral.
- `ring` / `pincer` / `turret` — reused for rhythm and escalation.
- Echo Wardens act as anchor enemies inside the later formations.

## Wave structure

- No shared warm-up/bridge prefix; the final stage opens immediately in its own visual language.
- Escalation from shard rings → prisms → echo wardens → mixed fractal mandalas.
- Final waves intentionally overlap several formations to create a “collapse” rhythm before the boss.
- Wave timestamps use no +26 second offset; the first fractal formation appears immediately after the intro.

## Boss — CHRONOS ECHO

Composite of the four previous bosses.

### Entrance — Convergence

- AI-generated distortion entity frames: `b5_entity`, `b5_fusion_mid1`, `b5_fusion_mid2`.
- The four previous bosses appear as orbiting echo cores.
- They spiral inward toward a central singularity.
- The AI entity core grows, dissolves into the intermediate fusion forms, and finally materializes CHRONOS ECHO.
- Cinematic labels: `FOUR ECHOES` → `CONVERGENCE` → `SINGULARITY` → `CHRONOS ECHO`.
- The Boss battle theme begins during the convergence.


- Red Void Sovereign
- Purple Abyss Devourer
- Orange Star Behemoth
- White-gold Seraphic Wings

Four colored echo cores orbit the boss and are visible throughout the fight. The phase art progressively reveals more of the absorbed bosses. The body also breathes, rotates slightly, shimmers with prismatic offsets and is surrounded by an animated fractal shard halo.

### Phase 1 — Dormant Singularity
- Chronos Bloom: three staggered fractal rings with a player-facing gap
- Aimed echo volley
- Echo Cross: four colored beams from the orbiting remnants

### Phase 2 — Unmaking
- Faster bloom rings
- Wider aimed fan
- Echo Cross
- Collapse ring: 22 radial bullets with a deliberate safe wedge

### Phase 3 — End of Time
- All phase 1 + 2 attacks combined
- Faster bloom / cross / collapse cadence
- Echo remnants remain visible around the core
- Final death triggers a multi-wave explosion, whiteout, `TIME COLLAPSED` banner and `TIME RECLAIMED` ending

## Audio

- Menu: 奇点 / Singularity
- Stage field: 暗物质 / Dark Matter, starting at 00:58
- Boss 5 battle: 维度破碎 / Dimension Break, starting at 00:25
- Ending cast: KALEIDOSCOPE
- All tracks normalized around -16 LUFS, 192 kbps

## Implementation notes

- `STAGES[4]` uses `BG5` and stage name `TIME'S END`.
- `BOSSES[4]` uses `style:'chronos'` and a fifth boss palette.
- `paintFractalBg()` handles the fixed kaleidoscope background.
- `bossChronosBloom`, `bossEchoCross`, `bossCollapse` implement the boss identity.
- Existing OD, A-cycle, bomb and combo systems remain active in the final stage.
