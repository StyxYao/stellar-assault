# Product roadmap

## Phase 1 — modular foundation (current)

- File-level modules and build manifest
- Content data separated from draw/update code
- Player hitbox visual indicator
- Structure checker and CI smoke check

## Phase 2 — platform-neutral core

- Extract fixed-step clock, math/rng, collision and progression
- Move stage/enemy/boss data fully into `content/`
- Add deterministic simulation tests and replay seed
- Remove DOM assumptions from update code

## Phase 3 — web release candidate

- Renderer and audio adapters behind interfaces
- Asset manifest, content hashing, preload budget
- Save data, settings, controller support
- Steam build via Electron or Tauri, Steamworks achievements/cloud
- Steam Deck resolution and offline asset verification

## Phase 4 — WeChat mini-game

- Replace DOM video with a `VideoSurface` adapter (pre-rendered atlas or texture path)
- Replace Web Audio / Image / localStorage with wx adapters
- Package budget: main package, subpackages, remote asset policy
- Touch-only layout and lifecycle handling
- WeChat review/compliance checklist

## Release discipline

- `CHANGELOG.md` per release
- ADRs in `docs/adr/` for irreversible choices
- Versioned content schema
- Automated structure + build checks
- Asset license inventory and store/privacy documents

## Existing deployment notes

- GitHub repository and source control.
- Cloudflare Pages / Workers deployment with external assets.
- Tencent CloudBase/COS for China delivery and WeChat asset hosting.
- Native WeChat Mini Game adaptation.

## Web asset split

The long-term build moves embedded base64 art/audio into `assets/` and produces:

```text
dist/
  index.html
  assets/
  build.txt
```

The current single-file build remains the offline fallback.

## WeChat Mini Game constraints

- Main package <= 4 MB; total main + subpackages <= 30 MB.
- Keep engine and first stage in the main package.
- Put large art/audio in subpackages or a whitelisted HTTPS CDN.
- Replace DOM/HTMLAudio with WeChat canvas/audio adapters.
- Requires WeChat AppID and review/qualification for release.
