# Modular migration log

Every extraction step gets its own commit and annotated tag. To roll back one step:

```bash
git checkout <tag>
# or inspect only:
git show <tag>
```

To restore the whole working tree to a checkpoint, use `tools/make_snapshot.sh` before the next step; snapshots live in `.backups/` and are intentionally ignored by git.

| Step | Scope | Commit | Tag |
|---|---|---|---|
| 1 | Phase-1 structure, enemy data, hitbox renderer, CI | `037d743` | `checkpoint/phase1` |
| 2 | Stage-5 wave data extraction | `62a2b4d` | `step/phase2a-stage5-waves` |
| 3 | Fixed-step clock to core + test | `25f0792` | `step/phase2b-fixed-step` |
| 4 | Math core + player renderer | `f3ada70` | `step/phase3a-math-player` |
| 5 | Collision core + player collision call sites | `883b589` | `step/phase3b-collision` |
| 6 | Web pointer input adapter | `445bd06` | `step/phase3c-web-input` |
| 7 | Stage 1-4 wave tables to content | `f39d01b` | `step/phase4a-stage-waves` |
| 8 | Boss definitions/palettes to content | `a1917f2` | `step/phase4b-bosses` |
| 9 | Web video adapter | `c24a7c7` | `step/phase5a-web-video` |
| 10 | Enemy renderer | `60b7023` | `step/phase5b-enemy-render` |
| 11 | Bullet renderer | `c745c78` | `step/phase5c-bullet-render` |
| 12 | Background renderer | `e25c062` | `step/phase5d-background` |
| 13 | Boss renderer | `a9a4e59` | `step/phase5e-boss-render` |
| 14 | Web audio engine | `4bdef07` | `step/phase6a-web-audio` |
| 15 | Effects renderer | `baf05bb` | `step/phase5f-effects` |
| 16 | UI, menu and cutscene renderer | `af727c5` | `step/phase5g-ui` |
| 17 | Player weapon renderer | `bf28c38` | `step/phase5h-weapons` |
| 18 | Legacy coordinator isolated under src/legacy | `4a5e3ff` | `step/phase6b-legacy-isolation` |
| 19 | Boss attack patterns | `d36acf8` | `step/phase6c-boss-patterns` |
| 20 | Player weapons simulation | pending | `step/phase6d-player-weapons` |

## Rollback examples

```bash
# inspect the step before a regression
git show step/phase2a-stage5-waves

# return to the checkpoint before phase 2
git checkout checkpoint/pre-phase2

# create a safe branch from a checkpoint
git switch -c recover/pre-phase2 checkpoint/pre-phase2
```

The step tag is annotated; its tag message records the scope.
