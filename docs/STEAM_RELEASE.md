# Steam / Desktop Release Gate

状态：**打包链路已建立；Steamworks 与签名未完成**

## Electron builder

`desktop/package.json`:

```json
"version": "1.0.0-rc.1"
"appId": "com.styx.stellarassault"
```

Targets:

```bash
cd desktop
npm run pack        # unpacked app
npm run dist:mac    # dmg + zip
npm run dist:win    # nsis + zip
npm run dist:linux  # AppImage
```

The build includes:

```text
dist/                 game + assets
tools/lan_server.mjs  LAN server
```

so the packaged desktop can host LAN without Python.

## Verified

- `npm run pack` succeeded on macOS arm64
- packaged app includes `dist/` and `tools/lan_server.mjs`
- LAN server starts before the window and loads the LAN IP
- unsigned macOS app generated at `desktop/release/mac-arm64/STELLAR ASSAULT.app`

## Not done

- Apple Developer ID signing / notarization
- Windows code signing
- Steamworks App ID / Steam Overlay
- achievements / stats
- Steam Cloud / Auto-Cloud
- Steam Deck verification
- store assets / EULA / privacy
- actual Steam depot upload

## Required before 1.0

1. Decide Steam App ID and add `steam_appid.txt` in development only.
2. Integrate Steamworks SDK in the Electron main process.
3. Map achievements/cloud/leaderboards through ports.
4. Sign macOS/Windows binaries.
5. Test a Steam-installed build on Windows and Deck.
6. Upload to a private depot and run Steam QA.
