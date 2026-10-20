# EdgeOne Makers deployment

## GitHub import

1. Open the Tencent Cloud EdgeOne Makers console.
2. Import `StyxYao/stellar-assault`.
3. Select branch `main`.
4. Keep the repository root empty (do not set it to `dist`).
5. The project reads `edgeone.json`:
   - build command: `bash tools/build_pages.sh`
   - output directory: `./dist`
6. Deploy and open the generated `*.edgeone.app` / EdgeOne Makers domain.

## Build requirements

`tools/build_pages.sh` creates a Python virtualenv, installs Pillow, rebuilds the single-file game, and writes `dist/index.html`.

If the EdgeOne build image does not provide Python, commit a prebuilt `dist/index.html` or switch the project to EdgeOne CLI direct upload.

## Direct upload fallback

```bash
npx --yes edgeone login -s china
npx --yes edgeone makers deploy dist --name stellar-assault
```

The direct-upload project must be a direct-upload type; GitHub-imported projects are rebuilt from Git.

## Notes

- EdgeOne Makers is not the same as CloudBase/COS. CloudBase/COS default domains force HTML downloads.
- Do not set the root directory to `dist`; `dist` is the build output.
