#!/usr/bin/env python3
"""Place the existing emblem + English title on a larger transparent canvas.

No new artwork, text, rings, particles or effects are added. The source PNGs are
only scaled and composed.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "assets" / "branding"
OUT = BRAND / "logo-stellar-assault-original-4096.png"
W = H = 4096

emblem = Image.open(BRAND / "logo-emblem.png").convert("RGBA")
title = Image.open(BRAND / "logo-title.png").convert("RGBA")

# Crop transparent padding once, keeping the original artwork untouched.
emblem = emblem.crop(emblem.getchannel("A").getbbox())
title = title.crop(title.getchannel("A").getbbox())

# Large enough for detailed cropping, still only the original assets.
ew = 1900
ew = min(ew, W - 400)
eh = round(emblem.height * ew / emblem.width)
emblem = emblem.resize((ew, eh), Image.LANCZOS)

tw = 3000
th = round(title.height * tw / title.width)
title = title.resize((tw, th), Image.LANCZOS)

gap = 120
total = eh + gap + th
top = (H - total) // 2
left_e = (W - ew) // 2
left_t = (W - tw) // 2

canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
canvas.alpha_composite(emblem, (left_e, top))
canvas.alpha_composite(title, (left_t, top + eh + gap))
canvas.save(OUT)
print(OUT, canvas.size, OUT.stat().st_size)
