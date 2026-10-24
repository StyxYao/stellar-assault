# Steam M2 — Save, Settings and Cloud Interface

Status: **development build passed on macOS/Electron; Windows/Steam Cloud hardware pending**

## Delivered

- Versioned save schema (`version: 1`)
- Default/normalization migration
- LocalStorage persistence
- Electron atomic `save.json` mirror
- Desktop preload `save.load` / `save.write`
- Master/BGM/SFX volume settings
- Settings panel from the pause menu (`S`)
- Fullscreen toggle in settings
- Best-score slot on the menu
- Run-end and stage-clear save hooks
- Score snapshot on pause/quit
- `CloudSavePort` interface
- Reserved language/difficulty fields

## Verified

| Check | Result |
|---|---|
| Save schema loads with defaults | PASS |
| Master volume adjusted in settings | PASS |
| Setting persisted to localStorage | PASS |
| Setting mirrored to `save.json` | PASS |
| Atomic file exists after setting change | PASS |
| Restart/reload restores master volume | PASS |
| Audio master gain follows setting | PASS |
| Pause → S opens settings | PASS |
| Arrow keys adjust settings | PASS |
| Esc closes settings | PASS |
| BGM pauses on pause | PASS |
| Fullscreen toggle IPC | PASS on macOS |
| Menu best-score hook present | PASS |
| Game-over save hook code present | not yet exercised end-to-end |

## Test path

```text
%APPDATA%/stellar-assault-desktop/save.json
```

On the test machine the equivalent was:

```text
/tmp/electron-m2-profile/save.json
```

## Not implemented

- Steam Auto-Cloud configuration in Steamworks
- Two-machine cloud conflict resolution
- Language switch UI
- Difficulty switch UI
- Stage-lock enforcement
- Online leaderboard submission

## Next

M3: Steamworks App ID, Steam Overlay, achievements, stats, Steam Cloud/Auto-Cloud configuration.
