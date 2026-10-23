# src

Phase-1 modules are concatenated in `src/modules.json` order into the existing game closure.

- `content/`: data only
- `core/`: engine logic, no platform APIs (target)
- `render/`: canvas drawing helpers
- `platform/`: adapter contracts and implementations
- `app/`: per-platform entry points (target)

Do not add new gameplay logic to `game3.js`; create a module and register it in `modules.json`.
