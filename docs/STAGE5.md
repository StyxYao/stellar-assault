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

- The entity arrives from far away: `RESONANCE` zoom-in over 3.6s, using the AI frames `np1`/`np3` and a procedural resonance halo.
- The four old bosses are **not** part of the entrance; they appear only after phase 1 is defeated.
- Phase 1 uses the AI Hedron-like entity (`np1`–`np3`) with a high-contrast white-gold crystalline body, sharp cyan/magenta/violet rim arcs and a rotating dot halo; no soft full-body rainbow wash and no old-boss armor.
- After appearing at the center, the phase-1 entity rises to the upper screen (about 26% height) over roughly one second.
- Phase 1 has 36% of the total Boss 5 HP (3629). When it reaches 0, the game enters a 9.4s fusion cinematic.
- Each boss enters from an off-screen **side edge** (left/right alternating), then follows a vortex spiral inward.
- The Hedron core stays visible at the center; its back and front layers overlap the boss copies.
- Each boss contributes exactly **24 whole-sprite copies**.
- The copies are fully opaque and snapped to a perfect circular 24-way ring; no translucent afterimage trail.
- Source-over overlap, no depth sorting: copies visibly overlap and occlude each other.
- Ring is a true circle, not an ellipse.
- The phase-2 Boss keeps a matching 24-copy opaque halo around its body.
- Phase-2 body is scaled to 70% of the previous composite size.
- Finished rings remain in place around the eye for the next boss.
- After all four rings are formed, the AI distortion frames absorb them and the composite phase-2 body materializes.
- Phase 2 uses the original Boss 5 phase-1 composite art as its body, scaled to 70%, starts with the remaining 64% HP (6451), and rises to the upper screen after fusion.
- Phase 3 keeps the existing phase-3 collapse art.
- The phase-2 composite then fights with the old bosses' attack patterns. Phase 3 begins at 30% of the phase-2 bar and returns to the black-hole collapse form.
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
