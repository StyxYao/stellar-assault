# Save, Settings and Cloud Interface

## Schema

`src/app/save.js` owns one versioned object:

```json
{
  "version": 1,
  "campaign": { "unlockedStage": 4, "bestScore": 0, "clears": 0, "lastStage": 0 },
  "ships": { "vector": { "bestScore": 0 }, "aegis": { "bestScore": 0 }, "selected": "vector" },
  "settings": {
    "master": 1.0,
    "bgm": 1.0,
    "sfx": 1.0,
    "fullscreen": false,
    "language": "zh",
    "difficulty": "normal"
  },
  "stats": { "runs": 0, "gameOvers": 0, "wins": 0 },
  "updatedAt": 0
}
```

- `version` is the migration key.
- Unknown/missing fields are filled from `DEFAULT_SAVE`.
- Numeric settings are clamped to 0–1.
- `unlockedStage` is stored but **not enforced yet**; release gating is an M4 decision.

## Storage paths

Browser:

```text
localStorage: stellar-assault-save-v1
```

Electron:

```text
app.getPath('userData')/save.json
```

The Electron file is written atomically:

```text
save.json.tmp → fsync/write → rename(save.json)
```

The renderer writes localStorage immediately and mirrors the same object to the file through `preload.cjs`.

## Cloud port

`src/app/cloud-save.js` defines `CloudSavePort`:

```text
pull() -> Promise<save|null>
push(save) -> Promise<{ok, reason}>
```

M2 has no active cloud adapter. The local Electron file is ready to be configured as a Steam Auto-Cloud file in Steamworks. A later M3/M9 adapter can replace or supplement it with Steamworks Remote Storage/leaderboard logic.

Do not claim cloud sync until the Steamworks Auto-Cloud path is configured and tested with two machines.

## Settings

Pause → `S` opens the settings panel.

Implemented:

- Master volume
- BGM volume
- SFX volume
- Fullscreen toggle
- Back

Stored but not yet surfaced:

- Language
- Difficulty

These are reserved for M5 localization and M4 difficulty integration.

## Migration policy

1. Load local storage.
2. Normalize through `normalizeSave`.
3. Load desktop `save.json` asynchronously.
4. If the file has a newer `updatedAt`, replace the in-memory object and re-apply settings.
5. On every persistence, write local storage and mirror to the file.
6. Never delete an unreadable save automatically; fall back to defaults and keep the raw file for inspection.

## Known M2 limits

- No conflict-resolution UI between two machines.
- No Steam Cloud adapter active.
- No language switch UI.
- No difficulty switch UI.
- No stage-lock enforcement yet.
