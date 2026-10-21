# Stage 5 — TIME'S END / 时空尽头

Status: implemented as the final stage.

## Design pillars

- **Kaleidoscope, not tunnel** — the background is a fixed, slowly breathing fractal mandala rather than another scrolling wormhole.
- **Geometry becomes enemy** — final-stage enemies are recursive shards, prisms and echo wraiths arranged in mandalas, spirals and fractal rings.
- **Boss as a composite** — CHRONOS ECHO is what remains when the first four bosses are absorbed by a singularity.
- **Climax over endurance** — dense but readable patterns, phase escalation, a dedicated final track and a distinct ending.

## Background

- `assets/bg/stage5-main.webp` — AI-generated kaleidoscopic fractal space.
- `assets/bg/stage5-edge.webp` — transparent recursive shard overlay.
- The scene runs three concentric, same-center kaleidoscope rings with feathered overlap: inner CCW, middle CW, outer CCW, each at a different speed.
- Ring boundaries use 74px feathered alpha blending; no ring strokes or gear-like outlines.
- Sixteen extra background shards are sampled from the crystal image and placed on a golden-angle phyllotaxis spiral.
- The four old bosses enter two at a time at near-original scale.
- Each boss texture is cut into a 6×6 tile grid; near the core those tiles migrate onto a golden-angle (137.5°) phyllotaxis spiral with self-similar scale reduction.
- Boss 5 HP is increased by ×1.5 on top of the global boss multiplier (10080 total).
- The old boss textures dissolve into the AI-generated distortion entity frames before the final composite forms.
- Concentric eye-rings and 10 radial filaments are drawn procedurally over it.
- No wormhole/tunnel scroll is used.

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
