# STELLAR ASSAULT Desktop (Steam M1)

Dev shell for the Steam build. It loads the normal `dist/index.html`; game code remains platform-neutral.

```bash
cd desktop
npm install
npm start

# packaged app / installers
npm run pack
npm run dist:mac
```

`npm run dev` enables DevTools (F12).

Desktop also starts the dependency-free LAN server on ports 8785/8786 and loads the game from the LAN IP.

M1 scope: window/fullscreen, keyboard/gamepad, pause. Not yet: save, achievements, Steam Cloud, installer.

## M1 controls

- Move: arrows / WASD / left stick / D-pad
- Bomb: Z / Space / B / X
- Confirm: Enter / A
- Pause: Esc / Start / Select
- Fullscreen: F11 / Alt+Enter

See `docs/STEAM_M1_ACCEPTANCE.md` for the verified checklist.
