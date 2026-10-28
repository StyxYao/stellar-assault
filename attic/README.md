# Attic — removed from production

This folder is intentionally outside `assets/`, `gpt-assets/` and `dist/`.
Nothing here is copied into a Web/Desktop/Steam build.

## Contents

### audio-auditions
Unused break-alarm/energy-blast audition candidates. The selected runtime sound is
`assets/audio/aegis-break-final.mp3`.

### audition-pages
Old HTML audition pages for those candidates.

### legacy-menu
Older menu background alternatives:
- menu-sanctum.webp
- menu-orbital.webp

The active menu background is `assets/bg/menu.webp`.

### sfx-sel
Raw SFX selection pool. It is retained for licensing/audit reference only and is
not loaded at runtime.

### branding/logo-lockup.png
Unused lockup; runtime uses emblem + title + stacked title.

### aegis_orbital-portrait.jpg
Unused portrait crop; the runtime uses `assets/ships/aegis_orbital.png`.

## Restore

Move a file back to its original path, rebuild with:

```bash
bash tools/build_pages.sh
```
