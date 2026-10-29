# PHANTOM prototype mechanics

## Ship rules
- No wingmen, no bomb.
- Bomb key / skill button uses a phase charge.
- 3 charges at run/stage start; max 6.

## Cloak
- 3 seconds.
- Invulnerable.
- Body is semi-transparent.
- Enemies prefer clones; with no clone, targeted attacks receive an off-screen aim point.
- Damage buff during cloak: Quantum/Butterfly +50%, Raven +150%.
- Cloak duration: 3s, except Raven 4s.
- Clones deal 70% of the body's base weapon damage and never inherit the cloak damage buff.

## Clones
- Spawn at the activation position (offset to the side so they are visible).
- Base HP: 3 for all variants, including Raven.
- After taking a hit, a surviving clone is invulnerable for 1 second.
- Copy weapon, level and extra bullets at activation.
- Damage multiplier: exactly 0.7 of the body's base damage; cloak buff is excluded.
- Autonomous targeting: selects the nearest enemy/Boss and slides horizontally to align with it.
- Clones stay near the player vertically and only move sideways to aim; they never charge into enemies.
- Clones fire forward only, exactly like the player. Projectile patterns are not rotated.
- Clone laser uses the same palette, width, gradient and endpoint glow as the player laser.
- Lifetime 25 seconds.
- Cannot collect items.
- Fixed base cap: Quantum 2, Butterfly 4, Raven 1.
- Cap does not upgrade.
- D/W pickup raises clone HP from 3 up to 6; existing clones are updated too.
- Death resets clone HP to 3.
- Casting adds clones until cap; at cap no additional clone is created (hard cap).
- Cap is fixed; W/D no longer raises cap.

## Pickups
- E: restore one phase charge, max 6, overflow to OD.
- D/W: clone HP +1, max 6; at max, score + OD.
- E: phase charge.

## Known prototype limits
- Clone target selection is aimed at the first clone; enemy aim sites are patched for enemy fire, boss aimed/ring/broadside and boss ultimate origins. Some non-aimed attack patterns still use the player origin but cannot damage a cloaked player.
- Laser clones use the same width/damage formula as the player laser but draw their own beam column.


## Overdrive: OD squadron

- While OD is active, Phantom summons 4 extra OD clones.
- They do not use the normal clone cap and do not replace existing clones.
- They are stationary and invincible decoys; they do not fire.
- While OD is active, the **player body** uses VECTOR's OD attack patterns.
- They disappear when OD ends.
- They are separate from the normal clone HP/cap system.
