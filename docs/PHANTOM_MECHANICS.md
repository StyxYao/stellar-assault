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
- Damage buff: Quantum +30%, Raven +70%, Butterfly +0%.
- Cloak duration: 3s, except Raven 4s.
- Clones always deal 50% of the body's base weapon damage and never inherit the cloak damage buff.

## Clones
- Spawn at the activation position (offset to the side so they are visible).
- HP: 3, except Raven 1.
- Copy weapon, level and extra bullets at activation.
- Damage multiplier: exactly 0.5 of the body's base damage; cloak buff is excluded.
- Autonomous targeting: selects the nearest enemy/Boss and slides horizontally to align with it.
- Clones stay near the player vertically and only move sideways to aim; they never charge into enemies.
- Clones fire forward only, exactly like the player. Projectile patterns are not rotated.
- Clone laser uses the same palette, width, gradient and endpoint glow as the player laser.
- Lifetime 25 seconds.
- Cannot collect items.
- Base cap: Quantum/Raven 1, Butterfly 2.
- After 3 D pickups: cap doubles to 2/4.
- Death resets cap and W count.
- At cap, the oldest clone is removed.

## Pickups
- E: restore one phase charge, max 6, overflow to OD.
- D: clone-limit progress; after 3, +1 cap; at max, score + OD.

## Known prototype limits
- Clone target selection is aimed at the first clone; enemy aim sites are patched for enemy fire, boss aimed/ring/broadside and boss ultimate origins. Some non-aimed attack patterns still use the player origin but cannot damage a cloaked player.
- Laser clones use the same width/damage formula as the player laser but draw their own beam column.
