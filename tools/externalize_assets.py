#!/usr/bin/env python3
"""Move embedded images/audio out of the built game into dist/assets.

Usage: python3 tools/externalize_assets.py <input.html> <output.html>
"""
from __future__ import annotations

import base64
import hashlib
import json
import io
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
ASSETS = DIST / "assets"

IMAGE_MIME = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
}


def safe_key(key: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "-", key).strip("-").lower()


def detect_ext(data: bytes) -> str:
    if data.startswith(b"OggS"):
        return "ogg"
    if data.startswith(b"ID3") or data[:2] in (b"\xff\xfb", b"\xff\xf3"):
        return "mp3"
    if data.startswith(b"RIFF"):
        return "wav"
    return "mp3"


def find_object(text: str, marker: str) -> tuple[int, int]:
    start = text.index(marker) + len(marker) - 1
    depth = 0
    quote: str | None = None
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = None
        else:
            if ch in ("'", '"'):
                quote = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return start, i + 1
    raise ValueError(f"unclosed object {marker}")


def replace_audio_object(text: str, marker: str, prefix: str) -> tuple[str, dict[str, str]]:
    start, end = find_object(text, marker)
    obj = text[start:end]
    pattern = re.compile(
        r"""(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_]+))\s*:\s*(?:"([A-Za-z0-9+/=]+)"|'([A-Za-z0-9+/=]+)')""",
        re.S,
    )
    pairs = pattern.findall(obj)
    if not pairs:
        raise ValueError(f"no audio pairs in {marker}")
    audio_dir = ASSETS / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    mapping: dict[str, str] = {}
    for quoted1, quoted2, bare, val1, val2 in pairs:
        key = quoted1 or quoted2 or bare
        b64 = val1 or val2
        raw = base64.b64decode(b64)
        ext = detect_ext(raw)
        name = f"{prefix}-{safe_key(key)}.{ext}"
        (audio_dir / name).write_bytes(raw)
        mapping[key] = f"assets/audio/{name}"
    replacement = "{" + ",".join(json.dumps(k) + ":" + json.dumps(v) for k, v in mapping.items()) + "}"
    return text[:start] + replacement + text[end:], mapping


def extract_data_uris(html: str) -> tuple[str, int]:
    pattern = re.compile(r"data:([a-zA-Z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)")
    img_dir = ASSETS / "img"
    img_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    seen: dict[str, str] = {}
    def repl(m: re.Match[str]) -> str:
        nonlocal count
        mime, b64 = m.group(1), m.group(2)
        ext = IMAGE_MIME.get(mime)
        if not ext:
            return m.group(0)
        raw = base64.b64decode(b64)
        digest = hashlib.sha1(raw).hexdigest()[:16]
        # WebP keeps alpha and is much smaller than the source PNGs.
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGBA")
            buf = io.BytesIO()
            img.save(buf, "WEBP", quality=86, method=6)
            raw = buf.getvalue()
            ext = "webp"
        except Exception:
            pass
        name = f"{digest}.{ext}"
        path = img_dir / name
        if name not in seen:
            path.write_bytes(raw)
            seen[name] = f"assets/img/{name}"
            count += 1
        return seen[name]
    return pattern.sub(repl, html), count


def patch_loader(html: str) -> str:
    # Add a shared fetch/decode helper before initAudio.
    helper = """function fetchAudioBuffer(url,cb){
  if(!AC) return;
  fetch(url).then(function(r){ if(!r.ok) throw new Error('audio '+r.status); return r.arrayBuffer(); })
    .then(function(b){ AC.decodeAudioData(b,cb,function(){}); }).catch(function(){});
}
"""
    marker = "function initAudio(){"
    if helper not in html:
        html = html.replace(marker, helper + marker, 1)

    # Bossrush SFX base64 loader -> external fetch.
    html = html.replace(
        """  Object.keys(SFX_SRC).forEach(function(k){
    try{
      var bin=atob(SFX_SRC[k]), n=bin.length, u=new Uint8Array(n);
      for(var i=0;i<n;i++) u[i]=bin.charCodeAt(i);
      AC.decodeAudioData(u.buffer,function(d){SFXBUF[k]=d;},function(){});
    }catch(e){}
  });""",
        """  Object.keys(SFX_SRC).forEach(function(k){
    fetchAudioBuffer(SFX_SRC[k],function(d){SFXBUF[k]=d;});
  });""",
        1,
    )

    # BGM base64 loader -> external fetch.
    html = html.replace(
        """  Object.keys(BGMSRC).forEach(function(k){
    try{
      var bin=atob(BGMSRC[k]), n=bin.length, u=new Uint8Array(n);
      for(var i=0;i<n;i++) u[i]=bin.charCodeAt(i);
      AC.decodeAudioData(u.buffer,function(d){ BGMBUF[k]=d; if(pendingBgm===k){pendingBgm='';playBgm(k);} },function(){});
    }catch(e){}
  });""",
        """  Object.keys(BGMSRC).forEach(function(k){
    fetchAudioBuffer(BGMSRC[k],function(d){ BGMBUF[k]=d; if(pendingBgm===k){pendingBgm='';playBgm(k);} });
  });""",
        1,
    )

    # BGMURL was built from base64 blobs; use the external paths directly.
    html = re.sub(
        r"Object\.keys\(BGMSRC\)\.forEach\(function\(k\)\{.*?\n\}\);\n",
        "Object.keys(BGMSRC).forEach(function(k){ BGMURL[k]=BGMSRC[k]; });\n",
        html,
        count=1,
        flags=re.S,
    )

    # Remove the old blob -> data-URI fallback.
    html = re.sub(
        r"try\{ if\(bgmAudio\.__k===k\s*&&\s*bgmAudio\.src\.indexOf\('blob:'\)===0\)\{.*?\}catch\(e\)\{\}",
        "try{ if(bgmAudio.__k===k){ bgmAudio.src=BGMSRC[k]; var p2=bgmAudio.play(); if(p2&&p2.catch) p2.catch(function(){}); } }catch(e){}",
        html,
        count=1,
        flags=re.S,
    )

    # Extra SFX base64 loader (in game3.js) -> external fetch.
    html = html.replace(
        """  Object.keys(SFX_EXTRA).forEach(function(k){
    try{
      var bin=atob(SFX_EXTRA[k]),n=bin.length,u=new Uint8Array(n);
      for(var i=0;i<n;i++) u[i]=bin.charCodeAt(i);
      AC.decodeAudioData(u.buffer,function(d){SFXBUF[k]=d;},function(){});
    }catch(e){}
  });""",
        """  Object.keys(SFX_EXTRA).forEach(function(k){
    fetchAudioBuffer(SFX_EXTRA[k],function(d){SFXBUF[k]=d;});
  });""",
        1,
    )
    return html


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    html = src.read_text(encoding="utf-8")
    ASSETS.mkdir(parents=True, exist_ok=True)
    # Rebuild cleanly so stale hashes from previous runs do not accumulate.
    for sub in ("img", "audio"):
        d = ASSETS / sub
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)

    html, image_count = extract_data_uris(html)

    for var, prefix in (("BGMSRC", "bgm"), ("SFX_SRC", "sfx"), ("SFX_EXTRA", "extra")):
        marker = f"var {var}={{"
        if marker in html:
            html, mapping = replace_audio_object(html, marker, prefix)
            print(f"{var}: {len(mapping)} file(s)")

    html = patch_loader(html)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(html, encoding="utf-8")
    print(f"images externalized: {image_count}")
    print(f"html: {src.stat().st_size} -> {dst.stat().st_size} bytes")


if __name__ == "__main__":
    main()
