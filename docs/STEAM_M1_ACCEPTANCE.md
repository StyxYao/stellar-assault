# Steam M1 — Desktop Shell & Input Acceptance

Status: **development build accepted on macOS arm64; Windows/Steam Deck hardware pending**

## Scope

M1 delivers a desktop wrapper and input layer only:

- Electron 38.2.0 shell
- 9:16 window fitted to the current display
- keyboard + gamepad input
- pause / focus-loss pause
- fullscreen toggle
- existing `dist/index.html` loaded unchanged

Not in M1: save files, Steam Cloud, achievements, installer, store assets, localization.

## Build

```bash
# from repository root
python3 tools/build_game3.py
python3 tools/optimize_delivery.py rrootage3.html dist/full.html
python3 tools/externalize_assets.py dist/full.html dist/index.html
# copy assets/bg, audio, fonts, video into dist/assets

cd desktop
npm install
npm start
```

`npm run dev` enables DevTools with F12.

## Verified

| Check | Result |
|---|---|
| Electron starts | PASS |
| Loads `dist/index.html` | PASS |
| Menu visible | PASS |
| Keyboard stage select (`←/→`) | PASS |
| Enter starts selected stage | PASS |
| Keyboard movement | PASS |
| Mouse hover follows ship | PASS |
| Mouse left click manual fire | PASS |
| Mouse right click bomb | PASS |
| Z bomb | PASS |
| Esc pause | PASS |
| Pause freezes game state | PASS |
| Esc resume | PASS |
| BGM pauses/resumes with pause | PASS |
| Stage-5 background video plays | PASS |
| AudioContext running after keyboard start | PASS |
| Exit fullscreen / enter fullscreen | PASS on macOS (native window state tracked) |
| Window fits display without overscan | PASS |
| All videos primed from keyboard start | PASS |

## Test environment

- macOS arm64
- Electron 38.2.0
- Chromium 140
- test launch flags: `--no-sandbox --disable-gpu`
- viewport in test: 481×854 content
- default configured window: 720×1280, auto-fitted down to display height

The flags are only for the sandboxed CI/headless test environment; the Windows build uses the normal Electron sandbox.

## Pending platform verification

- Windows 10/11 native window and fullscreen
- real Xbox / PS5 controller (gamepad start was verified with a virtual pad)
- Steam Deck 1280×800
- H.264 video playback on a clean Windows install
- Alt-Tab / minimize / restore on Windows
- window position persistence on Windows

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | Arrows / WASD | Left stick / D-pad |
| Confirm | Enter | A |
| Bomb | Z / Space | B / X |
| Pause | Esc | Start / Select |
| Fullscreen | F11 / Alt+Enter | — |
| Quit from pause | Q | — |

## Known issues

- CSP warning is expected until the desktop build gets a production CSP in M3/M8.
- No installer is produced in M1; `npm start` runs the unpacked development app.
