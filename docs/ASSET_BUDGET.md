# Asset Budget — 1.0 P0

## Current

Measured 2026-10-27 on `dist`:

```text
assets/img     70 MB
assets/audio   60 MB
assets/video   22 MB
assets/bg      7.3 MB
dist total     171 MB
```

Initial menu load after lazy images + lazy stage-5 video:

```text
~6.7 MB transferred
```

## What changed

`GIMG` is now lazy:

- build emits `GIMG_SRC` + property getters
- images load on first `GIMG[key]` access
- menu/setup only load visible ship/logo art
- stage/Boss/enemy art loads when first drawn

This removed the previous all-105-images-at-start behavior.

## Remaining

- [x] stage-5 videos no longer preload on menu (`preload='none'`)
- [x] initial load target <20 MB
- [ ] background images still preload all 5 stages (5.5 MB)
- [ ] compress/re-encode large AI source art
- [ ] lazy per-stage background/video budget

## Rule

No new 1.0 work may increase first-screen transfer without an explicit budget exception.
