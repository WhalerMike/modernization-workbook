"""Light slide backgrounds: soft gradient, plus a faint node network motif."""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(sys.argv[1])
W, H = 2667, 1500  # 13.33 x 7.5 in at 200 dpi
NAVY, TEAL, AMBER = (31, 42, 68), (15, 118, 110), (180, 83, 9)


def gradient(top, bottom):
    img = Image.new("RGB", (W, H), top)
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        c = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c
    return img


def network(img, cx, cy, r_outer, alpha_line, alpha_node, seed, hub=True):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rnd = random.Random(seed)
    rings = [(r_outer * 0.45, 6, TEAL), (r_outer * 0.78, 10, NAVY), (r_outer, 14, TEAL)]
    nodes = []
    for radius, count, color in rings:
        off = rnd.random() * math.pi
        for k in range(count):
            a = off + 2 * math.pi * k / count + rnd.uniform(-0.12, 0.12)
            nodes.append((cx + radius * math.cos(a), cy + radius * math.sin(a), color, radius))
    # spokes from hub to inner ring, and inner to outer neighbours
    for x, y, color, radius in nodes:
        if radius < r_outer * 0.5:
            d.line([(cx, cy), (x, y)], fill=NAVY + (alpha_line,), width=4)
    for i, (x, y, c, r) in enumerate(nodes):
        for x2, y2, c2, r2 in nodes:
            if r2 > r and math.hypot(x2 - x, y2 - y) < r_outer * 0.42:
                d.line([(x, y), (x2, y2)], fill=TEAL + (alpha_line,), width=3)
    for x, y, color, radius in nodes:
        s = 15 if radius < r_outer * 0.5 else 11
        d.ellipse([x - s, y - s, x + s, y + s], fill=color + (alpha_node,))
    if hub:
        d.ellipse([cx - 46, cy - 46, cx + 46, cy + 46], fill=AMBER + (min(255, alpha_node + 40),))
    img.paste(layer.filter(ImageFilter.GaussianBlur(0.6)), (0, 0), layer.filter(ImageFilter.GaussianBlur(0.6)))
    return img


content = gradient((250, 251, 253), (238, 243, 248))
content = network(content, W + 120, H + 160, 620, 26, 40, seed=7, hub=False)
content.save(OUT / "bg_content.png", optimize=True)

title = gradient((247, 250, 253), (232, 239, 246))
title = network(title, int(W * 0.80), int(H * 0.44), 560, 70, 150, seed=3, hub=True)
title.save(OUT / "bg_title.png", optimize=True)
print("ok")
