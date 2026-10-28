# Windows Video Pipeline

All animations stay enabled on Windows. The desktop build must not trade the
Stage-5 background, Boss phase videos, or fusion video away for performance.

## What changed

1. **Frame cache via requestVideoFrameCallback**
   - Each video is copied to an offscreen canvas only when Chromium reports a
     new decoded frame.
   - The game render loop draws the cached canvas, not the `<video>` element on
     every 60Hz frame.
   - This reduces repeated video texture uploads/color conversion.

2. **Loop guard**
   - If a new frame lands at the beginning of a loop and the previous media time
     was near the end, the black decoder frame is skipped.
   - The first decoded frame remains available as a seam underlay.

3. **GPU flags**
   ```text
   enable-gpu-rasterization
   enable-zero-copy
   ignore-gpu-blocklist
   ```
   These keep Chromium's GPU video/canvas path active on Windows.

## References

- [requestVideoFrameCallback (web.dev)](https://web.dev/articles/requestvideoframecallback-rvfc)
- [WICG Video RVFC specification](https://wicg.github.io/video-rvfc/)
- [Chrome requestVideoFrameCallback demo](https://googlechrome.github.io/samples/requestvideoframecallback/)

## If stutter remains

Collect:

- GPU model/driver
- Windows version
- whether the packaged app or browser shows it
- a screen recording with the FPS counter

Check `chrome://gpu` from a debug build to confirm hardware decoding and
hardware canvas are enabled. Do not disable video FX as a workaround.
