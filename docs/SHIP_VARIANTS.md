# Ship variant stats (R2.5)

日期：2026-10-25

## VECTOR

All VECTOR wingmen are now pure firepower:

- They do not absorb hits.
- They do not take damage.
- On death, wingman count decreases by 1 (not cleared).

| Variant | HP | Extra bullets | Damage | Laser rate by LV1-4 |
|---|---:|---:|---:|---|
| Void Lance | 3 | 0 | 100% | 1.00 / 1.00 / 1.00 / 1.00 |
| Starfall Wing | 2 | +1 | 120% | 1.50 / 1.333 / 1.25 / 1.20 |
| Abyss Blade | 1 | +2 | 140% | 2.00 / 1.667 / 1.50 / 1.40 |

## AEGIS

Force radius has four W levels. W no longer adds charge.

| Variant | Shield max | Radius | Charge time | Charge damage | Post-OD |
|---|---:|---:|---:|---:|---|
| Orbital Guardian | 60 | 100% | 100% | 100% | — |
| Void Echo | 36 | 60% | +20% slower | +60% | — |
| Temporal Wanderer | 69 | 115% | -30% faster | -20% | normal bullets +30% for 2s after OD |

OD:

- Does not fire normal bullets.
- Auto-fires charged attacks at the current weapon level every 0.5s.
- Initial weapon level is 1.
- Temporal's 2s buff starts after OD ends, not after each auto shot.

W overflow:

- Level up: +100 score.
- At max radius: +150 score and +20 OD.

## Charge attack presentation (latest)

- N: three parallel lance shots; total damage split; total width now wider than normal fire.
- S: no distance cap.
- L: instant full-height piercing beam; damage applied to every enemy/boss in the line.
- M: 12 missiles fired at once in a wide row.
- Charge ring follows the ship's visual center while moving.
- AEGIS W adds 20 shield charge in addition to radius/overflow.
- Shield break now has a burst flash, screen shake and existing explosion/hit SFX.
- Broken state hides the Force field entirely.
- Force level colors: L1 cyan, L2 gold, L3 purple, L4 red-orange.

## Charge projectile polish

- N charge: double the normal projectile count, 1.5x length and 1.2x width; total damage split.
- S charge: double normal pellet count, 1.5x length and 1.2x width; per-pellet damage halved to keep total damage.
- L charge: thick full-height piercing beam (collision half-width 28).
- M charge: 10 missiles in a wide row; 1.5x length and 1.3x width.
- Force radius tiers now jump visibly: 38 / 52 / 66 / 80 before skin multipliers.
- Enemy `aggr` no longer reduces projectile speed below 70%; this fixes near-stationary fodder bullets.
