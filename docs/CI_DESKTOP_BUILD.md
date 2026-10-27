# Desktop CI Build

Workflow: `.github/workflows/desktop-build.yml`

## Latest run

```text
run: 40507200205
sha: 951b69f
tag: steam/r3-desktop-ci
```

Results:

| Job | Runner | Result | Artifact |
|---|---|---|---|
| windows | windows-latest | success | stellar-assault-windows (545,540,729 bytes) |
| linux | ubuntu-latest | success | stellar-assault-linux (282,199,121 bytes) |

Artifacts:

```text
https://github.com/StyxYao/stellar-assault/actions/runs/40507200205
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
