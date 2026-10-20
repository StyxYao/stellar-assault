# Roadmap

1. GitHub repository and source control
2. Cloudflare Pages web deployment with external assets
3. Tencent CloudBase/COS for China delivery and WeChat Mini Game assets
4. Native WeChat Mini Game adaptation

## Web asset split

The long-term build will move embedded base64 art/audio into `assets/` and produce:

```text
dist/
  index.html
  assets/
  manifest.webmanifest
  sw.js
```

The current single-file build remains the offline fallback.

## WeChat Mini Game

- Main package <= 4 MB; total main + subpackages <= 30 MB
- Keep engine and first stage in the main package
- Put large art/audio in subpackages or a whitelisted HTTPS CDN
- Replace DOM/HTMLAudio with WeChat canvas/audio adapters
- Requires WeChat AppID and review/qualification for release
