# Desktop Artifacts — 1.0.0-rc.1

Built by GitHub Actions run `40512055989` at commit `c95eb38`.

## Windows artifact

```text
/Users/a123123/.dsh/im/backups/desktop-artifacts/stellar-assault-windows.zip
SHA256 5b5dbe6f0b94e83252a5b50c2b3801325607dfaa5796917e8b34e9c9957b285d
```

Contains:

```text
STELLAR ASSAULT Setup 1.0.0-rc.1.exe   (NSIS, unsigned)
STELLAR ASSAULT-1.0.0-rc.1-win.zip     (portable)
resources/dist/build.txt = c95eb38
```

## Linux artifact

```text
/Users/a123123/.dsh/im/backups/desktop-artifacts/stellar-assault-linux.zip
SHA256 149019718cd0803db69dbdfb226fc8cab54beaf137051637e95d5efd8cb9bf43
```

Contains:

```text
STELLAR ASSAULT-1.0.0-rc.1.AppImage
```

## Runtime smoke

Both packaged apps started and served the built-in LAN server on `127.0.0.1:8785`.

This is startup + LAN smoke, not a full playthrough.

## Security

The PAC/PAT used to download these artifacts was exposed in chat and is not stored in the repo.
Revoke it after use.
