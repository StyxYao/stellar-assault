# Audit P0 fixes — first batch

Branch: `audit/p0`  
Base: `f43f25d`

## P0-01 — Stage 5 phase 3 fallback `scale`

- `src/render/bosses.js` used undefined `scale`.
- Replaced with local `artScale = phaseBossSize() / 430`.
- Verified with all videos paused: Boss, player, HUD and bullets render; no page error.

## P0-02 — AEGIS ignores BulletML

BulletML lives in the `bullets` array, separate from `ebullets`.

Added:

- `aegisClearBulletMLRadial()`
- `aegisClearBulletMLLane()`

Integrated into:

- attached shield clear
- Force launch lane
- Force detached body collision
- AEGIS direct-hit shield cleanup

This fixes the shared root cause behind blue/red/yellow large bullets surviving
the shield or Force while other bullets clear.

Evidence (synthetic BulletML in a browser):

```text
before: bullets 1, shield 60
after:  bullets 0, shield 52, HP 3
```

Force outbound:

```text
before: bullets 1
after:  bullets 0
```

Returning Force must still not clear; that behavior is unchanged.

## P0-07 — malformed LAN URL / Range

`tools/lan_server.mjs`:

- `decodeURIComponent` wrapped; malformed URL returns 400.
- Suffix and invalid Range validation added; invalid ranges return 416.
- Server stays alive.

Evidence:

```text
/%            -> 400
bytes=0-9     -> 206
bytes=-10     -> 206
bytes=999999999- -> 416
```

## P0-03 / P0-04 — P2 collision and shared failure

Owner decision: **shared run failure** when P2 has no lives left.

- P2 now checks `ebullets`, BulletML, beams and blast zones.
- P2 OD is damage-immune like P1.
- P2 hit consumes the contacting ebullet/BulletML.
- `coopHitP2()` returns a result; direct hit loops consume only on a real hit.
- P2 lives, HP, bombs, power and variant progression are preserved across stages.
- New Run still creates a fresh P2.
- Last P2 life sets `state='over'`, calls `recordRunEnd(false)` and does **not**
  silently restore `lives=3`.
- P2 position/invulnerability reset at stage start; run progression does not.

Evidence:

```text
P2 ebullet at P2 -> HP 2 -> 1, ebullets 1 -> 0
P2 OD + forced hit -> HP unchanged
P2 lives 2 -> next stage -> lives 2
P2 last life -> state 'over'
```

## P0-06 — final victory / run recording

- Added `finishRun(won)` with a single `runFinalized` guard.
- `resetRun()` resets the guard; stage transitions do not.
- Finale, stage-4 clear, warp-out, P1 death and P2 shared failure use it.
- Cast final page now shows RANK / medal / SCORE and LOCAL TOP 5.
- Verified three consecutive `__endRun(true)` calls record only one run/win.

Evidence:

```text
runs 1, wins 1, clears 1, topRuns 1
```

## P0-05 — LAN snapshot completeness

- `World.snapshotFull()` now includes `bullets` (BulletML positions/radius).
- Enemies, beams and orb bullets are serialized with snapshot-local IDs
  (`leaderSid`, `ownerSid`, `ownerIsBoss`) instead of live object references.
- `World.restore()` resolves those IDs back to the newly restored enemies/boss.
- Client-side BulletML is a passive position object; the Host remains authoritative
  and supplies new positions at 20 Hz. No runner closures are serialized.

Evidence:

```text
snapshot bullets 1 -> restore bullets 1
snapshot/restore returns true
no page errors
```

## Still open

- P1 input/video/damage/statistics/CI
