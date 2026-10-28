# Boss Big Bullets and AEGIS

Boss ordnance uses three paths:

## 1. Bomb projectiles

Fields:

```text
bomb: true
bossBomb: true
tx / ty        landing target
blastR          explosion radius
```

Behavior:

- travels toward `tx/ty`
- explodes at arrival or fuse end
- explosion creates a `blastZones` entry
- the blast can hit the player even if the projectile itself was avoided

AEGIS handling:

- `aegisTryBlockBigBullet()` catches `type:2` / `bomb` / large-radius projectiles at the ship core, even with a detached Force
- attached shield clears bomb projectiles inside `aegisShieldRadius()`
- `aegisBlockBossBlast()` cancels a boss blast zone if it lands near the player
  or near a detached Force
- each blocked hit consumes `AEGIS_SHIELD_COST`
- a detached Force still protects the player position for boss blasts

## 2. Boss beams

Large yellow/orange beams use `aegisBlockedBeamLen()`:

- attached shield blocks at the shield radius
- detached Force blocks at the Force radius
- the beam is shortened rather than draining shield every frame

## 3. Orb / ring bullets

`orbBullets` are cleared inside the same shield radius.

## Per-stage examples

```text
Stage 1  blue aimed/broad big shots
Stage 2  red burst + boss bomb barrage
Stage 3  hive burst / rotating yellow beams
Stage 4  seraph halo / cross laser / broadside
Stage 5  collapse / echo-cross / chronos big patterns
```

If a boss bullet still reaches the player while AEGIS is attached and has
shield, check whether it is a **blast zone** (not the projectile itself); the
blast interception above is the relevant path.
