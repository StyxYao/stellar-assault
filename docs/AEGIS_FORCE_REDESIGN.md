# AEGIS Force redesign

日期：2026-10-25

## Force attached

- No auto-fire.
- Only a shield.
- Blocks non-bomb enemy bullets inside radius 38.
- Shield max 60 (40% less than the old 100).
- Each block costs 8.
- After 1.2s without a block, regenerates 14/s.
- At 0: BROKEN for 10 seconds, then reattaches at 20 shield.

## Force launch

- Costs one bomb charge (`player.bombs`).
- AEGIS no longer has a separate bomb.
- Force flies forward, but damage is applied instantly to the whole forward lane.
- Lane half-width 38.
- Damage: 240, exactly 2× the old bomb's 120 boss damage.
- Clears enemy bullets in the lane.
- Kills normal enemies in the lane; awards score/drops.
- Recall and return deal no damage and do not block bullets.
- Offscreen auto-return still applies.

## Charge

- Normal fire is suppressed while charging.
- Charged shot base damage raised from ~1.8+1.15×power to 42+18×power per hit.
- Larger charge ring, convergence particles, release flash, lane flash and shake.

## Controls

- FORCE button is the old bomb position and size.
- `F` / FORCE launches; `Z` / right-click also dispatches through `bomb()`.
- Force button shows remaining charges and shield percentage.

## Charge damage and ranges

- Charged damage is based on the normal weapon DPS for the current weapon and power level, multiplied by the actual charge time and then by 1.35.
- Normal fire is stopped while charging (including mouse manual fire and the laser beam render).
- Ranges:
  - N / lance: 560
  - S / fan: 320
  - L / beam: 760
  - M / swarm: 620
- Each profile has its own release visual:
  - N: narrow cyan lance
  - S: orange cone
  - L: magenta beam
  - M: golden homing swarm
- Laser's normal beam is hidden while charging.
