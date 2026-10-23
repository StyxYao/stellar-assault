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
