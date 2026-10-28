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

## Still open

- P0-03 P2 collision coverage
- P0-04 P2 lives / continue product rule (owner decision required)
- P0-05 LAN snapshot BulletML + owner IDs
- P0-06 final Boss victory record / Top 5
- P1 input/video/damage/statistics/CI
