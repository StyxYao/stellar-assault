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
- Phase-3 rings use each boss's own **phase-3** sprite (red/purple/orange/white-gold), pre-cleaned so the copies have no black cores; only the procedural center keeps a black hole.
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

## Stage Select

- The menu now has five stage buttons.
- Tapping 1–5 starts that stage directly.
- Stage 5 starts with Lv4 power, three options, wing 3 and three bombs so it is immediately playable.
- Tapping elsewhere still starts from Stage 1.

## Final polish pass

- Kaleidoscope: 16-fold mirrored cache, three counter-rotating copies, glass-bead highlights, deep zoom layer.
- Phase 1 death: explosion and white flash play first; the screen darkens only after the blast; then the omen starts.
- Fusion end: a 2.6s awakening transition (white impact, rings, inward shards) before phase 2 attacks begin.
- Phase 3 starts at 50% of the phase-2 bar.
- Final Boss rotates through every previous boss signature: tentacle spiral/vortex, wall/crossfire/broadside, hive/swarm/rotating laser, seraph fan/halo/cross laser/gatling. Bullets and beams use the source boss palette.
- Hedron phase-1 bullets are white-hot with a rainbow rim; its beams are warm white.
- Phase 2/3 hit flashes are additive ring bands only; the core and black hole stay stable.
- Stage select now selects first and starts only via START; non-stage-5 backgrounds are pinned to the selected stage image.

## Cast and content pass

- Stage 5 waves are stretched to 1.5x and enemy counts are reduced by roughly 28%.
- Stage-5 grunts are fractal echoes: the central current enemy plus mirrored copies of earlier-stage enemies arranged in tetra/octa/dodeca patterns.
- Stage-5 bullets are larger faceted crystal prisms; facets use the source boss palette. Large shots become 12-sided dodeca prisms, medium shots 8-sided octa prisms, small shots 4-sided tetra prisms.
- Phase-3 outer aura is now 820px plus a 960px soft halo, spilling visibly past the rings.
- Phase 2/3 hit flashes are feathered radial annuli; the inner edge extends inward but fades to zero before the core/hole.
- Cast: larger type, slower one-pass scroll, no black hole, no loop after the credits; final THANK YOU FOR PLAYING holds indefinitely.
- Credits: 思齐Styx and DeepSeek.

## Uploaded stage-5 art pass

- Enemy art: 六套新敌机（坐标、拓扑炮塔、莫比乌斯猎手、轴核、递归、镜像偏折）轮换用于三类第五关杂兵。
- Bullet art: 六套新子弹（分形簇、弧形时刃、折射三角、棱针、轨道矛、递归环）按 Boss 调色板分配；大型/中型/小型分别换用不同几何素材。
- All black JPEG backgrounds were converted to alpha PNG before use.
- Stage-5 enemy fractal echoes now surround the new central enemy art instead of the old placeholder silhouettes.
- Bullet visual size was reduced from the previous oversized procedural prisms and re-calibrated against the new art.

## Recursive prototype

- Qwen-Image samples were generated through Bailian (`qwen-image-2.1-pro` / `qwen-image-3.0-pro`).
- Phase 1 now layers three generated Hedron recursion images: an outer shell, two smaller same-design shells with visible counter-rotation, and a continuously zooming inner self-similar shell. The entrance cinematic also uses the new shell instead of the old Hedron texture.
- The background adds two generated recursive kaleidoscope textures as low-alpha screen layers over the cached 16-fold field.
- Both are prototypes: the keyframes are static images animated by scale, rotation, alpha and masking, not true rendered 3D recursion yet.

## Uploaded Hedron loop video

- `assets/video/hedron-loop.mp4`: 720x720 crop, 24fps, no audio, 6s seamless loop.
- Phase 1 battle uses the video with screen blending so its black plate disappears. When the video is playing, the procedural white core, orbital arcs and inner recursive layers are skipped; the clip supplies all visual elements. The same clip is also used as the Hedron body in phases 2 and 3 (under the rings and, in phase 3, under the black hole), so there is no second rotating Hedron layer.
- Falls back to the generated static recursion layers until the video can play.
- The video starts on the first tap, stays muted and loops.

## Stabilized background video

- Source: uploaded 720x1280, 8.1s video.
- Center estimated per frame with 180-degree symmetry phase correlation; full-resolution centers were median-filtered and smoothed.
- Each frame was cropped to 460x820 around the estimated center and rescaled to 720x1280, locking the kaleidoscope center.
- The clip is ping-ponged to a 16.2s seamless loop (forward + reverse).
- In game it is drawn centered in the playfield with a darkening/contrast pass; the background black hole has been removed entirely. The procedural kaleidoscope is the fallback if the video cannot play.

## Uploaded fusion cutscene

- `assets/video/fusion.mp4`: 720x1280, 24fps, 15.04s, no audio. The AI watermark is covered by a black box; the frame keeps its native aspect (no vertical stretch). In game it is cover-cropped and centered.
- Replaces the procedural four-boss fusion when ready; full-screen source-over cutscene.
- After the clip, the 2.6s awakening flash and phase-2 combat start.
- Tapping during the fusion skips to the end; procedural fusion remains the fallback if video cannot play.
