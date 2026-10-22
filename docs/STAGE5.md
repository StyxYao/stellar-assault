# Stage 5 — TIME'S END / 时空尽头

Status: implemented as the final stage.

## Design pillars

- **Kaleidoscope, not tunnel** — the background is a fixed, slowly breathing fractal mandala rather than another scrolling wormhole.
- **Geometry becomes enemy** — final-stage enemies are recursive shards, prisms and echo wraiths arranged in mandalas, spirals and fractal rings.
- **Boss as a composite** — CHRONOS ECHO is what remains when the first four bosses are absorbed by a singularity.
- **Climax over endurance** — dense but readable patterns, phase escalation, a dedicated final track and a distinct ending.

## Background

- `assets/bg/stage5-main.webp` — AI-generated crystal space.
- `assets/bg/stage5-edge.webp` — transparent shard layer.
- The field is a true **16-fold mirrored kaleidoscope**:
  - 16 clipped wedges per layer.
  - Three crystal layers with different scales and opacities.
  - Outer and inner layers counter-rotate at different speeds.
  - Alternating wedges are mirrored.
  - No concentric ring strokes or gear boundaries.
- A small radial dark vortex fades the crystal into one static black hole at 44% height.
- The black hole is the only static element; the layers rotate and breathe around it.
- During the Boss fight the background black hole is hidden so each phase's own core is authoritative.

## Boss 5 entrance

- The entity arrives from far away: `RESONANCE` zoom-in over 3.6s, using the AI frames `np1`/`np3` and a procedural resonance halo.
- The four old bosses are **not** part of the entrance; they appear only after phase 1 is defeated.
- Phase 1 uses the AI Hedron-like entity (`np1`–`np3`) with a high-contrast white-gold crystalline body, sharp cyan/magenta/violet rim arcs and a rotating dot halo; no soft full-body rainbow wash and no old-boss armor.
- After appearing at the center, the phase-1 entity rises to the upper screen (about 26% height) over roughly one second.
- Phase 1 has 36% of the total Boss 5 HP (3629) and its own depleted bar. At 0 it enters the dark omen card, then the 9.4s fusion cinematic; phase 2 refills a new 6451 HP bar.
- Each boss enters from a different **screen corner**; all four follow the same counter-clockwise spiral and are 90° apart.
- The Hedron core stays visible at the center; its back and front layers overlap the boss copies.
- A white-hot core layer is drawn on top of everything with a feathered outer 30%, so bodies entering the center are washed out by its light.
- Each boss contributes exactly **24 whole-sprite copies** in the ring only after it reaches the core, plus **10 copies** sampled from the spiral path it has already travelled (never ahead of the boss). Ring copies are 80/68/56/44px and the four radii are 152/132/112/92; the white core is 64px so Boss 4's ring stays visible.
- The innermost path copy dissolves into the Hedron core as the boss arrives.
- The copies are fully opaque and snapped to a perfect circular 24-way ring; no translucent afterimage trail.
- Source-over overlap, no depth sorting: copies visibly overlap and occlude each other.
- Ring is a true circle, not an ellipse.
- The phase-2 Boss itself is the 96-copy ring composition; its white-hot core is a 64px topmost layer with a feathered outer 30%.
- Phase 3 overlays the same four 24-way rings (radii 175/152/129/106) on the existing phase-3 art.
- Ring copies use pre-cleaned boss sprites whose central black holes are filled with their boss color, so only the phase-3 sprite keeps a black hole.
- Phase sizes: phase 1 = 1.00 (original), phase 2 = 0.99 (10% smaller than the previous 1.10), phase 3 = 1.10.
- Finished rings remain in place around the eye for the next boss.
- After all four rings are formed, the AI distortion frames absorb them and the composite phase-2 body materializes.
- Phase 2 keeps the **live fusion composition** as its combat form: Hedron core + four 24-way boss rings + top white-hot core. It does not switch to the old composite sprite.
- Phase 2 starts with the remaining 64% HP (6451) and rises to the upper screen after fusion.
- Phase 3 keeps the existing phase-3 collapse art.
- Phase 2/3 use a random rotating pool of old-boss ultimates: TENTACLE CAGE, LASER CURTAIN, SWARM SINGULARITY and SERAPHIC CHOIR; phase 3 fires two of them per cycle.
- Phase 3 begins at 30% of the phase-2 bar and is rebuilt as a fully procedural collapse form: one centered black hole plus four 24-way rings. The old phase-3 composite art is no longer drawn, so no extra black holes can appear.
- AI frames: `b5_entity`, `b5_fusion_mid1`, `b5_fusion_mid2`.
- Boss 5 HP is ×1.5 on top of the global multiplier: **10080**.
- Cinematic labels: `FOUR ECHOES` → `CONVERGENCE` → `SINGULARITY` → `CHRONOS ECHO`.
- Omen font: Rajdhani 600, same size and position for both sentences; the first fades out entirely before the second fades in, with tracking and soft glow.

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
- Omen font: Rajdhani 600, same size and position for both sentences; the first fades out entirely before the second fades in, with tracking and soft glow.
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
- Final death triggers a dedicated finale: whiteout, expanding shockwaves, radial beams, large Sierpinski wireframes, 150 fractal shards, then `TIME IS SAVED... / FOR NOW...`, followed by Cast.

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
