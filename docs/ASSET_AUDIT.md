# Asset Audit — 1.0.0-rc.1

## Production build policy

`tools/build_pages.sh` starts with:

```bash
rm -rf "$ROOT/dist"
```

The build then copies only `assets/bg`, `assets/audio`, `assets/fonts`,
`assets/video`, `assets/branding`, and the runtime image set. It does not copy
`attic/`, audition pages, or source-only art.

## Moved to attic

| Path | Reason |
|---|---|
| `attic/audio-auditions/` | unused alarm/blast audition candidates; selected sound is `assets/audio/aegis-break-final.mp3` |
| `attic/audition-pages/` | old HTML audition pages |
| `attic/legacy-menu/` | old `menu-sanctum.webp` / `menu-orbital.webp`; active art is `assets/bg/menu.webp` |
| `attic/sfx-sel/` | raw SFX selection pool; not loaded at runtime |
| `attic/aegis_orbital-portrait.jpg` | unused portrait crop |
| `attic/source-archive/` | unreferenced fusion source frames/zip |

## Remaining sources

`gpt-assets/` is source art, not runtime output. It is intentionally kept out
of `dist/` and desktop packaging; further pruning there should be done only
after confirming source references.

## Verification

- No stale `full-test.html` or duplicate standalone HTML in `dist/`.
- Audition pages are not copied into production.
- Runtime sound file is present at `dist/assets/audio/aegis-break-final.mp3`.
- `attic/` is excluded from `build_pages.sh`.
