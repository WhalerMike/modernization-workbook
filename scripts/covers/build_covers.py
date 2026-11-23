"""Draw one cover illustration per book: docs/images/covers/<book>.svg.

    python scripts/covers/build_covers.py          # write the covers
    python scripts/covers/build_covers.py --check  # fail if a cover is out of date
    python3 scripts/covers/build_covers.py --png   # also the decks' PNGs (needs rsvg-convert: WSL)

Each cover is line art on a transparent background in the site's dark-header colors
(teal, amber, white), with a motif for the book's topic. The book landing pages show
it in their dark header (assets/fmw-hero.lua, assets/partials/title-block.html). A light
copy (docs/images/covers/light/) goes on white pages: the Word editions' title pages
(scripts/build_bundles.py) and the decks' title slides (presentations/_build/lib.js).
Everything is drawn here from basic shapes: no third-party art, no logos, no text.
"""
from __future__ import annotations

import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "images" / "covers"
DECK_PNG = ROOT / "presentations" / "_build" / "covers"
W, H = 960, 360

STYLE = """<style>
.s{fill:none;stroke:#5fc4bf;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.t{fill:none;stroke:#5fc4bf;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;opacity:.55}
.d{fill:none;stroke:#2f7d79;stroke-width:1.2;stroke-dasharray:4 5;stroke-linecap:round}
.a{fill:none;stroke:#f2b950;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.af{fill:#f2b950}
.sf{fill:#5fc4bf}
.k{fill:#000;stroke:#5fc4bf;stroke-width:2;stroke-linejoin:round}
.ka{fill:#000;stroke:#f2b950;stroke-width:2.4;stroke-linejoin:round}
.w{fill:none;stroke:#ffffff;stroke-width:1;opacity:.35}
.g{fill:#5fc4bf;opacity:.16}
</style>"""

# The same art for white pages: the Word editions' title pages and the decks' title slides.
STYLE_LIGHT = """<style>
.s{fill:none;stroke:#1E8C8C;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.t{fill:none;stroke:#1E8C8C;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;opacity:.55}
.d{fill:none;stroke:#8fbfbc;stroke-width:1.2;stroke-dasharray:4 5;stroke-linecap:round}
.a{fill:none;stroke:#C98A12;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.af{fill:#C98A12}
.sf{fill:#1E8C8C}
.k{fill:#ffffff;stroke:#1E8C8C;stroke-width:2;stroke-linejoin:round}
.ka{fill:#ffffff;stroke:#C98A12;stroke-width:2.4;stroke-linejoin:round}
.w{fill:none;stroke:#0D1B2E;stroke-width:1;opacity:.35}
.g{fill:#1E8C8C;opacity:.14}
</style>"""


# ---- primitives ---------------------------------------------------------------
def ln(x1, y1, x2, y2, c="s"):
    return f'<line class="{c}" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}"/>'


def ci(x, y, r, c="s"):
    return f'<circle class="{c}" cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>'


def re(x, y, w, h, c="s", r=4):
    return f'<rect class="{c}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r}"/>'


def pa(d, c="s"):
    return f'<path class="{c}" d="{d}"/>'


def poly(pts, c="s", closed=True):
    tag = "polygon" if closed else "polyline"
    return f'<{tag} class="{c}" points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}"/>'


def dots(color="#ffffff"):
    """A faint dot grid behind the art."""
    out = []
    for y in range(20, H, 30):
        for x in range(20, W, 30):
            out.append(f'<circle cx="{x}" cy="{y}" r="1" fill="{color}" opacity=".10"/>')
    return out


def person(x, y, s=1.0, c="s"):
    return [ci(x, y - 22 * s, 9 * s, c), pa(f"M{x - 16 * s:.1f},{y + 14 * s:.1f} q0,-24 {16 * s:.1f},-24 q{16 * s:.1f},0 {16 * s:.1f},24", c)]


def server(x, y, w=70, units=3, c="s"):
    out = [re(x, y, w, units * 22, c)]
    for i in range(units):
        yy = y + 11 + i * 22
        out.append(ci(x + w - 12, yy, 3, "sf" if c == "s" else "af"))
        out.append(ln(x + 10, yy, x + w - 26, yy, "t"))
        if i:
            out.append(ln(x, y + i * 22, x + w, y + i * 22, "t"))
    return out


def cloud(x, y, s=1.0, c="s"):
    return pa(f"M{x - 60 * s:.1f},{y + 20 * s:.1f} a24,24 0 0 1 8,-46 a34,34 0 0 1 62,-14 a28,28 0 0 1 44,26 "
              f"a22,22 0 0 1 6,34 z".replace("a24,24", f"a{24 * s:.1f},{24 * s:.1f}")
              .replace("a34,34", f"a{34 * s:.1f},{34 * s:.1f}").replace("a28,28", f"a{28 * s:.1f},{28 * s:.1f}")
              .replace("a22,22", f"a{22 * s:.1f},{22 * s:.1f}")
              .replace(" 8,-46", f" {8 * s:.1f},{-46 * s:.1f}").replace(" 62,-14", f" {62 * s:.1f},{-14 * s:.1f}")
              .replace(" 44,26", f" {44 * s:.1f},{26 * s:.1f}").replace(" 6,34", f" {6 * s:.1f},{34 * s:.1f}"), c)


def doc(x, y, w=70, h=90, c="s", lines=4):
    f = 16
    out = [pa(f"M{x},{y} h{w - f} l{f},{f} v{h - f} h{-w} z M{x + w - f},{y} v{f} h{f}", c)]
    for i in range(lines):
        out.append(ln(x + 12, y + 30 + i * 13, x + w - 14 - (i % 2) * 14, y + 30 + i * 13, "t"))
    return out


def shield(x, y, s=1.0, c="s"):
    return pa(f"M{x},{y - 44 * s:.1f} l{38 * s:.1f},{14 * s:.1f} v{26 * s:.1f} q0,{34 * s:.1f} {-38 * s:.1f},{52 * s:.1f} "
              f"q{-38 * s:.1f},{-18 * s:.1f} {-38 * s:.1f},{-52 * s:.1f} v{-26 * s:.1f} z", c)


def lock(x, y, c="a"):
    return [re(x - 14, y - 4, 28, 22, c, 3), pa(f"M{x - 9},{y - 4} v-8 a9,9 0 0 1 18,0 v8", c)]


def check(x, y, s=1.0, c="a"):
    return pa(f"M{x - 9 * s:.1f},{y:.1f} l{7 * s:.1f},{7 * s:.1f} l{13 * s:.1f},{-14 * s:.1f}", c)


def gear(x, y, r, teeth=8, c="s"):
    pts = []
    for i in range(teeth * 4):
        a = 2 * math.pi * i / (teeth * 4)
        rr = r + 7 if i % 4 in (1, 2) else r
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    return [poly(pts, c), ci(x, y, r * 0.38, c)]


def arrow_head(x, y, ang, c="s", s=9):
    a1, a2 = ang + math.radians(150), ang - math.radians(150)
    return pa(f"M{x + s * math.cos(a1):.1f},{y + s * math.sin(a1):.1f} L{x:.1f},{y:.1f} L{x + s * math.cos(a2):.1f},{y + s * math.sin(a2):.1f}", c)


# ---- one motif per book ----------------------------------------------------------
def b00():  # Orientation & Program: a road through phases and gates to a destination
    o = [pa("M160,300 C330,300 360,190 520,190 S720,90 860,90", "s"), pa("M160,320 C330,320 380,210 520,210 S730,110 860,110", "t")]
    for x, y in [(300, 284), (520, 200), (700, 128)]:
        o += [ln(x, y - 40, x, y + 30, "t"), re(x - 14, y - 62, 28, 22, "k", 3)]
    o += [ln(860, 100, 860, 30, "a"), poly([(860, 30), (900, 42), (860, 54)], "af")]
    o += [ci(160, 310, 8, "af")]
    return o


def b01():  # Transformation Arc: from racks of servers, along an arc, to the cloud
    o = server(180, 200, 70, 4) + server(270, 222, 70, 3)
    o += [pa("M310,180 C380,40 620,20 700,120", "a"), arrow_head(700, 120, math.radians(55), "a", 12)]
    o += [cloud(790, 190, 1.35)]
    for i, (x, y) in enumerate([(380, 112), (460, 72), (550, 64), (630, 84)]):
        o.append(ci(x, y, 4, "af" if i == 3 else "sf"))
    o += [pa("M740,230 q50,30 100,0", "t"), ln(790, 245, 790, 300, "d")]
    return o


def b02():  # Identity & Directory: a directory tree turning into a graph around one identity
    o = [re(150, 60, 70, 34, "s"), ln(185, 94, 185, 130), ln(110, 130, 260, 130)]
    for x in (110, 185, 260):
        o += [ln(x, 130, x, 160), re(x - 28, 160, 56, 28, "t")]
    for x in (110, 260):
        o += [ln(x, 188, x, 220, "t"), re(x - 20, 220, 40, 22, "t")]
    cx, cy = 680, 180
    o += [ln(330, 180, 560, 180, "d")]
    ring = [(cx + 120 * math.cos(a), cy + 110 * math.sin(a)) for a in [i * math.pi / 3 + 0.3 for i in range(6)]]
    for x, y in ring:
        o += [ln(cx, cy, x, y, "t"), ci(x, y, 12, "k")]
    for i in range(6):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 2) % 6]
        o.append(ln(x1, y1, x2, y2, "d"))
    o += [ci(cx, cy, 30, "ka")] + person(cx, cy + 8, 0.75, "a")
    return o


def b03():  # HR-Driven Identity: the joiner, mover, leaver cycle fed from one record
    o = doc(150, 120, 80, 104, "s", 5) + [ln(240, 172, 330, 172, "a"), arrow_head(330, 172, 0, "a")]
    cx, cy, r = 600, 180, 110
    o += [ci(cx, cy, r, "t")]
    for k, a in enumerate([-90, 30, 150]):
        t = math.radians(a)
        x, y = cx + r * math.cos(t), cy + r * math.sin(t)
        o += [ci(x, y, 32, "ka" if k == 0 else "k")] + person(x, y + 7, 0.62, "a" if k == 0 else "s")
        t2 = math.radians(a + 52)
        o.append(arrow_head(cx + r * math.cos(t2), cy + r * math.sin(t2), t2 + math.pi / 2, "s"))
    o += [ci(cx, cy, 6, "sf")]
    return o


def b04():  # Access & Privilege: tiers as rings, one key, a policy gate
    cx, cy = 620, 180
    for i, r in enumerate([150, 110, 70]):
        o_c = "s" if i == 2 else "t"
        if i == 0:
            o = [ci(cx, cy, r, "d")]
        else:
            o.append(ci(cx, cy, r, o_c))
    o += [ci(cx, cy, 30, "ka"), ci(cx, cy - 4, 8, "a"), ln(cx, cy + 4, cx, cy + 16, "a")]
    o += [ci(230, 180, 22, "a"), ln(252, 180, 380, 180, "a"), ln(330, 180, 330, 198, "a"), ln(355, 180, 355, 194, "a")]
    o += [re(420, 150, 40, 60, "k", 6), ln(440, 160, 440, 200, "t"), ln(380, 180, 420, 180, "d")]
    return o


def b05():  # Devices & Endpoints: laptop, phone and server under one management cloud
    o = [cloud(560, 110, 1.2)]
    o += [re(250, 210, 140, 86, "s", 6), ln(230, 306, 410, 306), re(268, 226, 104, 56, "t", 2)]
    o += [re(500, 220, 52, 92, "s", 8), ln(518, 300, 534, 300, "t")]
    o += server(640, 214, 90, 4)
    for x in (320, 526, 685):
        o.append(ln(560, 140, x, 205, "d"))
    o += [check(320, 254, 1.4)]
    o += [ci(560, 140, 5, "af")]
    return o


def b06():  # Data Platform: database cylinders with the identity bridge across them
    o = []
    for i, (x, y) in enumerate([(240, 140), (420, 110), (600, 140)]):
        c = "a" if i == 1 else "s"
        o += [f'<ellipse class="{c}" cx="{x}" cy="{y}" rx="60" ry="16"/>',
              pa(f"M{x - 60},{y} v120 a60,16 0 0 0 120,0 v-120", c),
              pa(f"M{x - 60},{y + 40} a60,16 0 0 0 120,0 M{x - 60},{y + 80} a60,16 0 0 0 120,0", "t")]
    o += [pa("M180,330 Q420,250 760,320", "d"), ci(800, 150, 34, "k")] + person(800, 158, 0.7)
    o += [ln(660, 180, 766, 160, "t")]
    return o


def b07():  # PKI & Certificates: a chain of trust from a root seal to leaf certificates
    o = []
    rx, ry = 220, 180
    for k in range(14):
        a = 2 * math.pi * k / 14
        o.append(ln(rx + 40 * math.cos(a), ry + 40 * math.sin(a), rx + 50 * math.cos(a), ry + 50 * math.sin(a), "a"))
    o += [ci(rx, ry, 36, "ka"), ci(rx, ry, 24, "a"), pa(f"M{rx - 14},{ry + 44} l-8,46 l22,-12 l22,12 l-8,-46", "a")]
    mids = [(470, 110), (470, 250)]
    for mx, my in mids:
        o += [ln(rx + 52, ry, mx - 46, my, "s"), re(mx - 46, my - 30, 92, 60, "k", 6), ci(mx + 28, my + 10, 9, "s"), ln(mx - 34, my - 12, mx + 10, my - 12, "t"), ln(mx - 34, my + 2, mx + 2, my + 2, "t")]
        for dy in (-34, 34):
            lx, ly = 720, my + dy
            o += [ln(mx + 46, my, lx - 36, ly, "t"), re(lx - 36, ly - 20, 72, 40, "k", 5), ln(lx - 24, ly - 4, lx + 10, ly - 4, "t"), ln(lx - 24, ly + 6, lx + 2, ly + 6, "t")]
    o += [ln(800, 76, 860, 76, "d"), ln(800, 284, 860, 284, "d")]
    return o


def b08():  # DNS, DHCP & IPAM: a globe of names with lookups resolving to addresses
    cx, cy, r = 600, 180, 130
    o = [ci(cx, cy, r, "s"), f'<ellipse class="t" cx="{cx}" cy="{cy}" rx="{r * 0.45:.1f}" ry="{r}"/>', f'<ellipse class="t" cx="{cx}" cy="{cy}" rx="{r * 0.85:.1f}" ry="{r}"/>']
    for dy in (-70, 0, 70):
        w = math.sqrt(r * r - dy * dy)
        o.append(ln(cx - w, cy + dy, cx + w, cy + dy, "t"))
    pts = [(560, 112), (650, 150), (590, 240), (690, 222)]
    for i, (x, y) in enumerate(pts):
        o.append(ci(x, y, 6, "af" if i == 1 else "sf"))
    o += [pa("M230,120 C330,120 420,110 560,112", "d"), pa("M230,240 C360,240 460,250 590,240", "d")]
    o += [re(150, 100, 80, 40, "k", 6), re(150, 220, 80, 40, "k", 6), ln(165, 120, 215, 120, "t"), ln(165, 240, 205, 240, "t")]
    o += [ln(650, 150, 820, 70, "a"), re(820, 52, 90, 36, "ka", 6), ln(835, 70, 895, 70, "a")]
    return o


def b09():  # Network & Transport: sites joined by an overlay mesh across the underlay
    nodes = [(170, 120), (170, 250), (400, 80), (420, 290), (620, 170), (820, 90), (830, 260)]
    o = [pa("M120,330 C300,300 600,350 900,320", "d"), pa("M120,40 C330,20 620,60 900,30", "d")]
    edges = [(0, 2), (1, 3), (0, 4), (1, 4), (2, 4), (3, 4), (4, 5), (4, 6), (2, 5), (3, 6)]
    for a, b in edges:
        o.append(ln(*nodes[a], *nodes[b], "t"))
    o.append(pa("M170,120 Q400,140 620,170 T830,260", "a"))
    for i, (x, y) in enumerate(nodes):
        o += [ci(x, y, 18 if i == 4 else 13, "ka" if i == 4 else "k")]
    o += [ci(620, 170, 6, "af")]
    return o


def b10():  # Cloud Boundary & Landing Zone: a dashed boundary around a landing-zone grid
    o = [re(330, 50, 520, 260, "a", 16), re(160, 120, 90, 120, "d", 8)]
    o += [ln(250, 180, 330, 180, "s"), re(320, 166, 22, 28, "ka", 4)]
    for i in range(3):
        for j in range(2):
            x, y = 380 + i * 150, 90 + j * 110
            o += [re(x, y, 120, 80, "k", 8), ln(x + 14, y + 22, x + 70, y + 22, "t"), ln(x + 14, y + 40, x + 90, y + 40, "t")]
            if (i, j) == (1, 0):
                o.append(ci(x + 96, y + 60, 7, "af"))
    o += [cloud(860, 54, 0.45, "t")]
    return o


def b11():  # Zero Trust: every request checked at every ring, nothing trusted by place
    cx, cy = 640, 180
    o = [ci(cx, cy, r, "d") for r in (150, 105, 62)]
    o += [ci(cx, cy, 24, "ka"), ci(cx, cy, 6, "af")]
    o += [ln(180, cy, cx - 24, cy, "s"), ci(180, cy, 7, "sf")]
    for r in (150, 105, 62):
        o += [ci(cx - r, cy, 13, "k"), check(cx - r + 1, cy - 1, 0.7, "a")]
    return o


def b12():  # Security Operations: a radar sweep over telemetry, one signal flagged
    cx, cy = 640, 190
    o = [ci(cx, cy, r, "t") for r in (40, 85, 130)]
    o += [ln(cx - 150, cy, cx + 150, cy, "d"), ln(cx, cy - 150, cx, cy + 150, "d")]
    o += [pa(f"M{cx},{cy} L{cx + 130 * math.cos(-0.9):.1f},{cy + 130 * math.sin(-0.9):.1f} A130,130 0 0 1 {cx + 130:.1f},{cy}  z", "g"), ln(cx, cy, cx + 130 * math.cos(-0.9), cy + 130 * math.sin(-0.9))]
    for x, y in [(590, 140), (700, 250), (560, 230), (690, 120)]:
        o.append(ci(x, y, 4, "sf"))
    o += [ci(720, 150, 7, "af"), ci(720, 150, 16, "a")]
    o.append(pa("M150,190 h60 l14,-40 l18,80 l16,-56 l12,16 h70", "s"))
    return o


def b13():  # Governance & Drift: a baseline, a drifting state, evidence pulling it back
    o = [ln(150, 180, 880, 180, "s"), pa("M150,180 C300,180 380,170 470,140 S620,90 700,120", "a")]
    o += [pa("M700,120 C740,140 760,170 800,180", "d"), arrow_head(800, 180, math.radians(15), "s")]
    for x in (260, 420, 580, 740):
        o += [ln(x, 196, x, 230, "t"), re(x - 18, 230, 36, 46, "k", 4), check(x, 252, 0.8, "s")]
    o += [ci(700, 120, 7, "af")]
    return o


def b14():  # Federal Compliance: controls as a checklist, proof attached, a seal
    o = doc(420, 60, 200, 250, "s", 0)
    for i in range(5):
        y = 110 + i * 38
        o += [re(440, y - 10, 20, 20, "t", 3), ln(474, y, 590 - (i % 3) * 18, y, "t")]
        if i < 4:
            o.append(check(450, y - 1, 0.7))
    o += [ci(640, 270, 34, "ka"), ci(640, 270, 22, "a")]
    for x, y in [(240, 120), (260, 230)]:
        o += doc(x, y - 40, 60, 76, "t", 3) + [ln(x + 66, y, 420, y + 30, "d")]
    return o


def b15():  # Day-2 Operations: gears turning on a recurring cycle
    o = gear(560, 170, 56, 10) + gear(670, 238, 34, 7, "a") + gear(680, 104, 26, 6)
    o += [pa("M310,180 A80,80 0 1 1 230,100", "s"), arrow_head(230, 100, math.radians(180), "s")]
    for i in range(7):
        o.append(re(170 + i * 26, 290, 18, 18, "a" if i == 3 else "t", 3))
    return o


def b16():  # People: a team in a learning circle, one lit by the next step
    cx, cy, r = 600, 190, 120
    o = [ci(cx, cy, r, "d")]
    for k in range(7):
        t = math.radians(-90 + k * 360 / 7)
        x, y = cx + r * math.cos(t), cy + r * math.sin(t)
        o += person(x, y + 6, 0.8, "a" if k == 0 else "s")
    o += doc(565, 150, 70, 80, "s", 3)
    o += [pa("M200,260 l60,-30 l60,30 l-60,30 z", "s"), ln(320, 260, 320, 300, "t"), ln(230, 275, 230, 300, "t"), ln(290, 275, 290, 300, "t")]
    return o


def b17():  # AI Identity: a neural mesh holding an identity badge
    layers = [[(380, 90), (380, 180), (380, 270)], [(520, 60), (520, 140), (520, 220), (520, 300)], [(660, 120), (660, 240)]]
    o = []
    for a, b in zip(layers, layers[1:]):
        for p in a:
            for q in b:
                o.append(ln(*p, *q, "t"))
    for layer in layers:
        for x, y in layer:
            o.append(ci(x, y, 11, "k"))
    o += [ln(660, 180, 740, 180, "a"), re(740, 120, 120, 120, "ka", 10)] + person(800, 188, 0.9, "a")
    o += [ln(250, 180, 369, 180, "d"), re(170, 150, 80, 60, "k", 8), ln(186, 172, 234, 172, "t"), ln(186, 188, 222, 188, "t")]
    return o


def b18():  # Application Modernization: a monolith broken into services
    o = [re(170, 70, 120, 220, "s", 6)]
    for y in range(100, 290, 34):
        o.append(ln(186, y, 274, y, "t"))
    o += [ln(310, 180, 420, 180, "a"), arrow_head(420, 180, 0, "a")]
    grid = [(470, 70), (580, 70), (690, 70), (470, 180), (580, 180), (690, 180), (580, 290)]
    for i, (x, y) in enumerate(grid):
        o.append(re(x, y - 34, 84, 60, "ka" if i == 4 else "k", 8))
    for a, b in [(0, 1), (1, 2), (3, 4), (4, 5), (1, 4), (4, 6)]:
        (x1, y1), (x2, y2) = grid[a], grid[b]
        if y1 == y2:
            o.append(ln(x1 + 84, y1 - 4, x2, y2 - 4, "d"))
        else:
            o.append(ln(x1 + 42, y1 + 26, x2 + 42, y2 - 34, "d"))
    return o


def b19():  # Developer workbook: code passing through checks in a pipeline
    o = [pa("M210,120 l-50,60 l50,60", "a"), pa("M300,120 l50,60 l-50,60", "a"), ln(275, 110, 235, 250, "s")]
    xs = [440, 560, 680, 800]
    o.append(ln(380, 180, 840, 180, "t"))
    for i, x in enumerate(xs):
        o += [ci(x, 180, 26, "k"), check(x, 180, 1.0, "a" if i < 3 else "t")]
    o += [ln(360, 180, 414, 180, "s"), re(410, 250, 300, 12, "d", 6), re(410, 250, 210, 12, "g", 6)]
    return o


def b20():  # Information Protection: a labeled document under a shield and lock
    o = doc(220, 90, 150, 190, "s", 0) + doc(250, 70, 150, 190, "t", 0)[:1]
    for i in range(5):
        o.append(ln(240, 140 + i * 22, 340 - (i % 2) * 30, 140 + i * 22, "t"))
    o += [re(232, 100, 64, 22, "ka", 11)]
    o += [shield(640, 196, 2.2, "s"), *lock(640, 192)]
    o += [ln(380, 186, 540, 186, "d"), ci(470, 186, 5, "af")]
    return o


BOOKS = {
    "b00-orientation": (b00, "A road through phase gates to a flagged destination"),
    "b01-transformation-arc": (b01, "Server racks on the left, an arc rising to a cloud on the right"),
    "b02-identity": (b02, "A directory tree turning into a connected graph around one person"),
    "b03-hr-identity": (b03, "An HR record feeding a joiner, mover and leaver cycle"),
    "b04-access": (b04, "A key, a policy gate and tiered rings around a protected core"),
    "b05-devices": (b05, "A laptop, phone and server managed from one cloud"),
    "b06-data-platform": (b06, "Three database cylinders with an identity beside them"),
    "b07-pki": (b07, "A root seal signing issuing certificates that sign leaf certificates"),
    "b08-ddi": (b08, "Name lookups resolving to addresses on a globe"),
    "b09-network": (b09, "Sites joined by an overlay mesh, one path highlighted"),
    "b10-cloud-boundary": (b10, "A dashed boundary around a landing-zone grid, one door in"),
    "b11-zero-trust": (b11, "A request checked at each of three rings before the core"),
    "b12-security-operations": (b12, "A radar sweep over telemetry, one signal flagged"),
    "b13-governance": (b13, "A drifting line pulled back to the baseline by evidence"),
    "b14-compliance": (b14, "A control checklist with evidence attached and a seal"),
    "b15-day2-operations": (b15, "Gears turning beside a recurring cycle and a calendar row"),
    "b16-people": (b16, "A team in a circle around a guide, one person highlighted"),
    "b17-ai-identity": (b17, "A neural network connected to an identity badge"),
    "b18-application-modernization": (b18, "A monolith broken into connected services"),
    "b19-developer-workbook": (b19, "Code passing through a pipeline of checks"),
    "b20-information-protection": (b20, "A labeled document beside a shield and lock"),
}


VARIANTS = {"dark": (OUT, STYLE, "#ffffff"), "light": (OUT / "light", STYLE_LIGHT, "#0D1B2E")}


def svg(book: str, variant: str = "dark") -> str:
    fn, desc = BOOKS[book]
    _out, style, dot = VARIANTS[variant]
    body = "\n".join(dots(dot) + fn())
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img">\n'
            f"<title>{desc}</title>\n{style}\n{body}\n</svg>\n")


def main(argv: list[str]) -> int:
    check_only = "--check" in argv
    stale = []
    for variant, (out, _style, _dot) in VARIANTS.items():
        out.mkdir(parents=True, exist_ok=True)
        for book in BOOKS:
            path = out / f"{book}.svg"
            want = svg(book, variant)
            if check_only:
                if not path.exists() or path.read_text(encoding="utf-8") != want:
                    stale.append(f"{variant}/{path.name}")
            else:
                path.write_text(want, encoding="utf-8", newline="\n")
    if "--png" in argv and not check_only:
        # The decks' title slides take PNGs (presentations/_build/lib.js). Needs rsvg-convert (WSL).
        DECK_PNG.mkdir(parents=True, exist_ok=True)
        for book in BOOKS:
            subprocess.run(["rsvg-convert", "-w", "1560", "-f", "png", "-o", str(DECK_PNG / f"{book}.png"),
                            str(VARIANTS["light"][0] / f"{book}.svg")], check=True)
        print(f"{len(BOOKS)} deck PNG(s) written to {DECK_PNG.relative_to(ROOT).as_posix()}")
    if stale:
        print("covers out of date (run scripts/covers/build_covers.py):", ", ".join(stale))
        return 1
    print(f"{len(BOOKS)} cover(s) {'checked' if check_only else 'written'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
