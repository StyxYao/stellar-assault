# Desktop CI Build

## Latest feature build

```text
run 40519422447
commit 89405ee
tag steam/r3-stage5-cage-aegis
```

Windows and Linux jobs completed successfully; both packaged runtime smoke tests passed.

Latest artifacts:

```text
stellar-assault-windows  545,627,405 bytes
stellar-assault-linux    282,242,243 bytes
```

Download:

```text
https://github.com/StyxYao/stellar-assault/actions/runs/40519422447
```

> The local `backups/desktop-artifacts` zips are the earlier `c95eb38` Aegis build. Download this run for the Stage-5 director/cage/audio changes.

Workflow: `.github/workflows/desktop-build.yml`

## Latest run

```text
run: 40512055989
sha: c95eb38
tag: steam/r3-aegis-p2
```

Results:

| Job | Runner | Result | Artifact |
|---|---|---|---|
| windows | windows-latest | success | stellar-assault-windows (545,543,135 bytes) |
| linux | ubuntu-latest | success | stellar-assault-linux (282,200,379 bytes) |

Artifacts:

```text
https://github.com/StyxYao/stellar-assault/actions/runs/40512055989
```

GitHub artifact download requires an authenticated session. The workflow itself does not require extra secrets for an unsigned build.

## Windows

Built natively on `windows-latest`:

- NSIS installer `.exe`
- portable `.zip`

No local Windows machine or Wine is required.

Unsigned build:

- SmartScreen may warn
- no code signing yet
- no Steamworks overlay/achievements/cloud

## Linux / Steam Deck

Built AppImage on `ubuntu-latest`.

Steam Deck test path:

1. Download the Linux artifact and unzip.
2. Copy the `.AppImage` to the Deck.
3. `chmod +x`.
4. Run in Desktop Mode, or add as a non-Steam game.
5. Test controller/audio/performance.

This is the Steam Deck-compatible artifact, but **no physical Deck is available here**, so Deck verification is still pending.

## GitHub access needed

For the current unsigned build: none beyond repository push; Actions is enabled.

To let the agent download artifacts or publish a GitHub Release:

- fine-grained PAT
- `Actions: Read` for artifact download
- `Contents: Write` for GitHub Release upload

Do not paste the token into chat; place it in a local secure environment.


## Packaged runtime smoke

The workflow now launches the packaged app after building. Windows uses `pathToFileURL()` for the dynamic LAN module import so a drive-letter path is not treated as a URL scheme.

Latest run result (includes Aegis shield fixes and ebullet guard):



- Windows packaged app started; `http://127.0.0.1:8785/index.html` returned 200
- Linux AppImage started under Xvfb; the same endpoint returned 200

This is startup + built-in LAN server smoke, not gameplay/signing.



- Windows: starts `STELLAR ASSAULT.exe`, waits for `http://127.0.0.1:8785/index.html`
- Linux: runs the AppImage under Xvfb, waits for the same endpoint

This validates that the packaged app can start and host the built-in LAN server. It does not replace a human playthrough or Steam Deck hardware validation.


## Windows signing / antivirus

See `docs/WINDOWS_ANTIVIRUS.md`. The workflow reads `WINDOWS_CSC_LINK` and
`WINDOWS_CSC_KEY_PASSWORD`; without them the build remains unsigned and may
be flagged by security software.
