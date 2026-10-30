#!/usr/bin/env python3
"""Generate the high-resolution STELLAR ASSAULT / 星海强袭 brand lockup.

Run from the repository root:
    python3 tools/make_logo.py

Outputs are written to assets/branding/.
No external image-generation service is used.
"""
from __future__ import annotations

import base64
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
EMBLEM = OUT / "logo-emblem.png"

CN_FONT = "/System/Library/AssetsV2/com_apple_MobileAsset_Font7/3419f2a427639ad8c8e139149a287865a90fa17e.asset/AssetData/PingFang.ttc"
EN_FONT = ROOT / "assets" / "fonts" / "orbitron-600.ttf"
TAG_FONT = ROOT / "assets" / "fonts" / "rajdhani-600.ttf"

CN = "星海强袭"
EN = "STELLAR ASSAULT"
TAG = "5 STAGES  ·  5 BOSSES"
W, H = 4096, 2048

CYAN = (143, 232, 255)
ICE = (238, 249, 255)
STEEL = (111, 150, 196)
NAVY = (9, 21, 42)
GOLD = (255, 202, 92)


def font(path: str | Path, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size, index=index)


def gradient(size: tuple[int, int], stops: list[tuple[float, tuple[int, int, int]]]) -> Image.Image:
    w, h = size
    g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    for y in range(h):
        t = y / max(1, h - 1)
        # interpolate stops
        a, b = stops[0], stops[-1]
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                a, b = stops[i], stops[i + 1]
                break
        span = max(1e-6, b[0] - a[0])
        k = max(0.0, min(1.0, (t - a[0]) / span))
        c = tuple(round(a[1][j] + (b[1][j] - a[1][j]) * k) for j in range(3)) + (255,)
        d.line((0, y, w, y), fill=c)
    return g


def spaced_text_mask(text: str, fnt: ImageFont.FreeTypeFont, tracking: int, stroke: int = 0) -> Image.Image:
    widths = [fnt.getlength(ch) for ch in text]
    tw = round(sum(widths) + tracking * max(0, len(text) - 1)) + stroke * 2
    bbox = fnt.getbbox(text)
    th = bbox[3] - bbox[1] + stroke * 2
    im = Image.new("L", (max(1, tw + 16), max(1, th + 16)), 0)
    d = ImageDraw.Draw(im)
    x = 8 + stroke
    y = 8 - bbox[1] + stroke
    for ch, cw in zip(text, widths):
        d.text((x, y), ch, font=fnt, fill=255, stroke_width=stroke, stroke_fill=255)
        x += cw + tracking
    return im


def colorize(mask: Image.Image, color: tuple[int, int, int], alpha: int = 255) -> Image.Image:
    out = Image.new("RGBA", mask.size, color + (0,))
    out.putalpha(mask.point(lambda v: v * alpha // 255))
    return out


def add_glow(base: Image.Image, mask: Image.Image, color: tuple[int, int, int], blur: int, alpha: int, offset: tuple[int, int]) -> None:
    g = mask.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: v * alpha // 255)
    layer = colorize(g, color)
    base.alpha_composite(layer, offset)


def text_lockup(canvas: Image.Image, text: str, fnt: ImageFont.FreeTypeFont, tracking: int,
                top: int, stroke: int, glow_color: tuple[int, int, int],
                fill_stops: list[tuple[float, tuple[int, int, int]]]) -> tuple[int, int, int, int]:
    mask = spaced_text_mask(text, fnt, tracking, stroke)
    x = (W - mask.width) // 2
    y = top
    # outer glow
    add_glow(canvas, mask, glow_color, 26, 150, (x, y))
    add_glow(canvas, mask, glow_color, 7, 90, (x, y))
    # dark bevelled edge
    edge = mask.filter(ImageFilter.MaxFilter(9))
    canvas.alpha_composite(colorize(edge, (4, 10, 24), 220), (x, y))
    # silver fill
    fill = gradient(mask.size, fill_stops)
    fill.putalpha(mask)
    canvas.alpha_composite(fill, (x, y))
    return x, y, mask.width, mask.height


def starfield(size: tuple[int, int], count: int = 260) -> Image.Image:
    w, h = size
    rnd = random.Random(20261029)
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for _ in range(count):
        x = rnd.uniform(0, w)
        y = rnd.uniform(0, h)
        r = rnd.choice([1, 1, 1, 1.4, 2.0, 2.8])
        c = rnd.choice([(180, 225, 255), (255, 225, 165), (125, 175, 235)])
        a = rnd.randint(25, 125)
        d.ellipse((x, y, x + r, y + r), fill=c + (a,))
    return im


def emblem_layer(width: int) -> Image.Image:
    im = Image.open(EMBLEM).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    im = im.crop(bbox)
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 110, 2))
    return im


def make_transparent() -> Image.Image:
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # subtle orbital halo behind the emblem
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for r, a, c in [(690, 30, CYAN), (520, 18, GOLD), (830, 12, STEEL)]:
        hd.ellipse((W // 2 - r, 380 - r // 2, W // 2 + r, 380 + r // 2), outline=c + (a,), width=3)
    canvas.alpha_composite(halo)
    canvas.alpha_composite(starfield((W, H), 170))

    em = emblem_layer(1280)
    ex = (W - em.width) // 2
    ey = 76
    # emblem glow + drop shadow
    alpha = em.getchannel("A").filter(ImageFilter.GaussianBlur(26)).point(lambda v: v * 110 // 255)
    canvas.alpha_composite(colorize(alpha, CYAN), (ex - 30, ey + 16))
    shadow = em.getchannel("A").filter(ImageFilter.GaussianBlur(16)).point(lambda v: v * 160 // 255)
    canvas.alpha_composite(colorize(shadow, (0, 0, 0)), (ex + 12, ey + 24))
    canvas.alpha_composite(em, (ex, ey))

    # Chinese title
    cn_font = font(CN_FONT, 610, index=11)
    cx, cy, cw, ch = text_lockup(
        canvas, CN, cn_font, 36, 900, 12, CYAN,
        [(0.0, (245, 252, 255)), (0.38, (182, 223, 255)), (0.70, (87, 131, 184)), (1.0, (35, 64, 108))]
    )
    # gold underline + diamond
    line_y = cy + ch + 42
    d = ImageDraw.Draw(canvas)
    half = 940
    d.line((W // 2 - half, line_y, W // 2 - 40, line_y), fill=GOLD + (170,), width=4)
    d.line((W // 2 + 40, line_y, W // 2 + half, line_y), fill=GOLD + (170,), width=4)
    d.polygon([(W // 2, line_y - 14), (W // 2 + 18, line_y), (W // 2, line_y + 14), (W // 2 - 18, line_y)], fill=GOLD + (230,))

    # English title with real tracking
    en_font = font(EN_FONT, 148)
    en_mask = spaced_text_mask(EN, en_font, 34, 2)
    exx = (W - en_mask.width) // 2
    eyy = line_y + 58
    add_glow(canvas, en_mask, CYAN, 16, 100, (exx, eyy))
    canvas.alpha_composite(colorize(en_mask, (4, 12, 28), 235), (exx, eyy))
    en_fill = gradient(en_mask.size, [(0.0, (242, 252, 255)), (0.55, (154, 211, 248)), (1.0, (55, 99, 153))])
    en_fill.putalpha(en_mask)
    canvas.alpha_composite(en_fill, (exx, eyy))

    # small tagline
    tag_font = font(TAG_FONT, 72)
    tag_mask = spaced_text_mask(TAG, tag_font, 8, 0)
    tx = (W - tag_mask.width) // 2
    ty = eyy + en_mask.height + 40
    add_glow(canvas, tag_mask, GOLD, 10, 45, (tx, ty))
    canvas.alpha_composite(colorize(tag_mask, (216, 190, 128), 210), (tx, ty))
    return canvas


def make_dark() -> Image.Image:
    # Deep space background with a restrained central glow.
    bg = gradient((W, H), [(0.0, (2, 6, 16)), (0.45, (5, 15, 30)), (1.0, (1, 3, 10))]).convert("RGBA")
    bg.alpha_composite(starfield((W, H), 340))
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for r, a in [(1050, 18), (820, 22), (620, 30)]:
        hd.ellipse((W // 2 - r, 260 - r // 2, W // 2 + r, 260 + r // 2), outline=(100, 170, 220, a), width=3)
    bg.alpha_composite(halo)
    fg = make_transparent()
    bg.alpha_composite(fg)
    return bg


def make_icon() -> Image.Image:
    S = 1024
    bg = gradient((S, S), [(0.0, (4, 11, 25)), (0.55, (10, 26, 49)), (1.0, (2, 5, 13))]).convert("RGBA")
    bg.alpha_composite(starfield((S, S), 120))
    d = ImageDraw.Draw(bg)
    for r, a in [(430, 35), (330, 25)]:
        d.ellipse((S // 2 - r, 270 - r, S // 2 + r, 270 + r), outline=CYAN + (a,), width=2)
    em = emblem_layer(760)
    ex, ey = (S - em.width) // 2, 92
    sh = em.getchannel("A").filter(ImageFilter.GaussianBlur(18)).point(lambda v: v * 140 // 255)
    bg.alpha_composite(colorize(sh, CYAN), (ex - 12, ey + 16))
    bg.alpha_composite(em, (ex, ey))
    cn_font = font(CN_FONT, 174, index=11)
    mask = spaced_text_mask(CN, cn_font, 8, 5)
    x, y = (S - mask.width) // 2, 650
    add_glow(bg, mask, CYAN, 16, 95, (x, y))
    bg.alpha_composite(colorize(mask, (4, 12, 28), 230), (x, y))
    fill = gradient(mask.size, [(0.0, (250, 253, 255)), (0.55, (152, 211, 249)), (1.0, (54, 95, 146))])
    fill.putalpha(mask)
    bg.alpha_composite(fill, (x, y))
    en = spaced_text_mask("STELLAR ASSAULT", font(EN_FONT, 40), 8, 1)
    ex2 = (S - en.width) // 2
    bg.alpha_composite(colorize(en, (199, 230, 246), 220), (ex2, 862))
    return bg


def make_svg() -> None:
    # Editable vector lockup. The emblem is embedded because it is a raster source,
    # while the text remains live and editable in any SVG editor.
    em = base64.b64encode(EMBLEM.read_bytes()).decode("ascii")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="2048" viewBox="0 0 4096 2048">
  <defs>
    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f5fcff"/><stop offset=".38" stop-color="#b6dfff"/>
      <stop offset=".7" stop-color="#5783b8"/><stop offset="1" stop-color="#23406c"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8f6d2e"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#8f6d2e"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="30"/></filter>
  </defs>
  <ellipse cx="2048" cy="380" rx="690" ry="345" fill="none" stroke="#8fe8ff" stroke-opacity=".12" stroke-width="3"/>
  <image href="data:image/png;base64,{em}" x="1408" y="76" width="1280" height="733" style="mix-blend-mode:screen" filter="url(#glow)"/>
  <text x="2048" y="1460" text-anchor="middle" font-family="&apos;PingFang SC&apos;, &apos;Hiragino Sans GB&apos;, sans-serif" font-weight="600" font-size="610" letter-spacing="36" fill="url(#silver)" stroke="#04101c" stroke-width="12" paint-order="stroke" filter="url(#glow)">星海强袭</text>
  <line x1="1108" y1="1535" x2="2008" y2="1535" stroke="url(#gold)" stroke-width="4"/>
  <line x1="2088" y1="1535" x2="2988" y2="1535" stroke="url(#gold)" stroke-width="4"/>
  <path d="M2048 1521 2066 1535 2048 1549 2030 1535Z" fill="#ffca5c"/>
  <text x="2048" y="1730" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="600" font-size="148" letter-spacing="34" fill="url(#silver)" stroke="#04101c" stroke-width="3" paint-order="stroke">STELLAR ASSAULT</text>
  <text x="2048" y="1850" text-anchor="middle" font-family="Rajdhani, sans-serif" font-weight="600" font-size="72" letter-spacing="8" fill="#d8be80">5 STAGES · 5 BOSSES</text>
</svg>'''
    (OUT / "logo-xinghai-qiangxi.svg").write_text(svg, encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    transparent = make_transparent()
    transparent.save(OUT / "logo-xinghai-qiangxi-transparent-4096.png")
    make_dark().convert("RGB").save(OUT / "logo-xinghai-qiangxi-dark-4096x2048.jpg", quality=94, subsampling=0)
    make_icon().save(OUT / "icon-xinghai-qiangxi-1024.png")
    make_svg()
    print("generated:")
    for p in [
        OUT / "logo-xinghai-qiangxi-transparent-4096.png",
        OUT / "logo-xinghai-qiangxi-dark-4096x2048.jpg",
        OUT / "icon-xinghai-qiangxi-1024.png",
        OUT / "logo-xinghai-qiangxi.svg",
    ]:
        print(p, p.stat().st_size)


if __name__ == "__main__":
    main()
