# Windows Video Performance Mode

Windows desktop builds detect the Electron bridge and disable the large looping
video elements for Stage 5.

Instead they use:

- stage key art with a slow procedural background drift
- static Boss phase images with the existing canvas auras
- the procedural fusion scene

Reason: the 60fps phase videos and 720p background loop caused decode/draw
hitches and black frames at loop boundaries on Windows. The Web build and
non-Windows builds still use the original video path.

This is a performance trade-off, not a content removal: the static/ procedural
fallbacks are the same assets used when a video is not ready.

To force video FX for debugging:

```text
index.html?videofx=1
```

The query path is reserved for diagnostics.
