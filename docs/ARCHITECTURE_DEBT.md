# Architecture debt — post-1.0 audit

The audit's P2-01 asked for small, high-yield boundaries rather than a rewrite.
This branch takes the first steps:

- `damageBoss()` is the single Boss damage/invulnerability entry for special weapons.
- `finishRun()` is the idempotent Run boundary.
- `stageStats` is the Run-local source for No Miss and clear time.
- `World.snapshotFull()` uses snapshot-local IDs instead of live object references.
- AEGIS has one `aegisClearBulletMLRadial()` / `Lane()` boundary for BulletML.
- `reportError()` provides rate-limited subsystem diagnostics.

Still intentional future work:

- `ProjectileRegistry`: one traversal for all projectile arrays.
- `PlayerDamageService`: one P1/P2 damage/consume contract for every projectile and sustained effect.
- Full `RunState` object instead of scattered globals.
- Splitting the largest UI/LAN/ship files without changing behavior.

These are not required to fix the current P0/P1 defects, and doing them in one
commit would make gameplay regression review harder. Do them only with the
render/input/LAN smoke suites green.
