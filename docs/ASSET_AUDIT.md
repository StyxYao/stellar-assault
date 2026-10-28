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

## Low-shield alarm candidates

`attic/warning-candidates/` contains five electronic warning candidates and a
local audition page. They are intentionally not copied into production.

## Cinematic low-shield alarms

`attic/warning-filmic/` contains five candidates built from the CC0 air-raid
siren in `attic/sfx-sel/siren.mp3` (Kinoton, freesound 420661).

## Cinematic alarm set 2

`attic/warning-filmic-2/` extends the CC0 air-raid base with vintage, naval,
reactor, braam, distress and meltdown variations.

## Selected low-shield warning

User selected `16 · MELTDOWN`, shortened 40% to 1.20s and pitch-raised naturally (~20%).
Runtime file: `assets/audio/aegis-low-warning.mp3`. Wired to `playAegisWarning()`.
