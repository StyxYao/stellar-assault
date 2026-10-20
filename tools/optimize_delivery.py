import re, base64, io, os, sys
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else 'rrootage3.html'
dst = sys.argv[2] if len(sys.argv) > 2 else 'dist/stellar-assault.html'
os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
h = open(src, encoding='utf-8').read()

# Drop unused legacy image assignments: boss phase 2/3, enemy _b frames, old explosion frames.
unused = re.compile(r"GIMG\.((?:n[1-6]b|e[1-8]))=new Image\(\);GIMG\.\1\.src='data:image/[a-z]+;base64,[A-Za-z0-9+/=]+';")
h, n = unused.subn('', h)

def repl(m):
    raw = base64.b64decode(m.group(2))
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    out = io.BytesIO()
    im.save(out, 'JPEG', quality=70, optimize=True, progressive=True)
    new = out.getvalue()
    if len(new) >= len(raw):
        return m.group(0)
    return m.group(1) + base64.b64encode(new).decode()

h = re.sub(r"(data:image/jpeg;base64,)([A-Za-z0-9+/=]+)", repl, h)
open(dst, 'w', encoding='utf-8').write(h)
print('removed', n, 'unused images; bytes', len(h.encode()))
