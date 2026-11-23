"""Draw one opener illustration per chapter: docs/images/openers/<book>/<chapter>.svg.

    python scripts/covers/build_openers.py          # write the openers
    python scripts/covers/build_openers.py --check  # fail if an opener is out of date

An opener is a banner of line art across the top of a chapter's header, in the same style
and colors as the book covers (scripts/covers/build_covers.py, whose shapes it reuses),
showing the chapter's idea. It decorates; it carries no facts, so the chapter's diagrams
stay the place for anything a reader must learn. The header partial shows it
(assets/fmw-hero.lua, assets/partials/title-block.html) when the file exists.

The chapter header is light, so the light colors are used on the page; a dark copy is
kept beside it (docs/images/openers/<book>/dark/) for the dark headers and the decks later.
Drawn from basic shapes: no third-party art, no logos, no text.

Pilot: Book 01. More books are added to CHAPTERS as they're drawn.
"""
from __future__ import annotations

import importlib.util
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("build_covers", HERE / "build_covers.py")
cv = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cv)
ln, ci, re, pa, poly = cv.ln, cv.ci, cv.re, cv.pa, cv.poly
person, server, cloud, doc, shield, lock, check, gear, arrow_head = (
    cv.person, cv.server, cv.cloud, cv.doc, cv.shield, cv.lock, cv.check, cv.gear, cv.arrow_head)

ROOT = cv.ROOT
OUT = ROOT / "docs" / "images" / "openers"
W, H = 960, 240


def dots(color):
    return [f'<circle cx="{x}" cy="{y}" r="1" fill="{color}" opacity=".10"/>'
            for y in range(15, H, 30) for x in range(20, W, 30)]


def arrow(x1, y1, x2, y2, c="s"):
    return [ln(x1, y1, x2, y2, c), arrow_head(x2, y2, math.atan2(y2 - y1, x2 - x1), c)]


def laptop(x, y, c="s", w=96):
    h = w * 0.62
    return [re(x, y, w, h, c, 5), re(x + w * 0.1, y + h * 0.15, w * 0.8, h * 0.66, "t", 2), ln(x - w * 0.14, y + h + 8, x + w * 1.14, y + h + 8, c)]


def magnifier(x, y, r=30, c="a"):
    return [ci(x, y, r, c), ln(x + r * 0.7, y + r * 0.7, x + r * 1.6, y + r * 1.6, c)]


def tree(x, y, c="s", w=200, depth=3):
    """An OU-style tree, root at (x, y), growing down."""
    o, level = [re(x - 14, y - 10, 28, 20, c, 3)], [(x, y)]
    for d in range(1, depth):
        nxt, span = [], w / (2 ** d)
        for px, py in level:
            for dx in (-span / 2, span / 2):
                cx, cy = px + dx, py + 52
                o += [pa(f"M{px:.1f},{py + 10:.1f} V{py + 26:.1f} H{cx:.1f} V{cy - 10:.1f}", "t"), re(cx - 12, cy - 9, 24, 18, c, 3)]
                nxt.append((cx, cy))
        level = nxt
    return o


# ---- Book 01: The Transformation Arc ----------------------------------------------------
def b01_01():  # Why modernization is hard: four eras, then the way forward
    o = [re(110, 80, 90, 100, "s", 6), ln(124, 104, 186, 104, "t"), ln(124, 122, 186, 122, "t"), ci(155, 152, 8, "sf")]
    for x, y in [(290, 70), (350, 120), (290, 150)]:
        o += server(x, y, 54, 2, "s")
    o += [ln(344, 92, 350, 130, "d"), ln(318, 114, 318, 150, "d")]
    for i in range(4):
        o.append(re(470, 60 + i * 30, 70, 22, "ka" if i == 3 else "k", 3))
    o += [cloud(690, 150, 1.0, "s"), pa("M680,124 q0,-12 10,-12 q10,0 10,10 q0,8 -10,12 v6", "a"), ci(690, 150, 2.5, "af")]
    o += [ci(850, 120, 34, "s"), check(850, 120, 1.6, "a")]
    for x1, x2 in [(214, 274), (420, 458), (552, 614), (770, 806)]:
        o += arrow(x1, 120, x2, 120, "t")
    return o


def b01_02():  # Governance hidden in the directory: the OU tree, with policy beneath its branches
    o = tree(300, 50, "s", 360)
    o += [ln(110, 170, 500, 170, "d")]
    for i, x in enumerate((150, 230, 310, 390, 470)):
        o += [re(x - 22, 186, 44, 30, "ka" if i == 2 else "k", 4)]
    o += [*lock(310, 197, "a")]
    o += [*magnifier(680, 120, 52, "a"), *tree(680, 96, "t", 70, 2)]
    return o


def b01_03():  # The platform foundation: one governed host, five roles, one writer
    o = server(430, 70, 100, 4, "s")
    o += [ci(480, 120, 92, "d")]
    for i, (x, y) in enumerate([(230, 60), (210, 170), (740, 60), (760, 170), (480, 225)]):
        if i < 4:
            o += [ln(480 + (-60 if x < 480 else 60), 120, x + (34 if x < 480 else -34), y, "t"), ci(x, y, 24, "k")]
    o += [*gear(230, 60, 12, 6, "s"), check(210, 170, 1.2, "a"), ci(740, 60, 8, "sf"), *lock(760, 172, "a")]
    o += arrow(560, 210, 640, 210, "a")
    o += doc(650, 168, 44, 56, "s", 2)
    return o


def b01_04():  # Identity transformation: the tree flattens into one directory of attributed people
    o = tree(190, 44, "t", 220)
    o += arrow(330, 120, 410, 120, "a")
    xs = [470, 530, 590, 650, 710]
    for i, x in enumerate(xs):
        o += person(x, 150, 0.9, "s")
        o.append(re(x - 14, 172, 28, 8, "ka" if i % 2 else "g", 3))
    o += [pa("M450,96 q140,-60 280,0", "d"), pa("M500,206 q120,30 240,0", "d")]
    o += [shield(840, 132, 1.3, "s"), check(840, 126, 1.2, "a")]
    return o


def b01_05():  # Policy transformation: a stack of old policy regenerated into owned layers
    o = []
    for i in range(4):
        o += doc(150 + i * 14, 50 + i * 12, 90, 110, "t" if i < 3 else "s", 3)
    o += [pa("M330,120 C380,60 430,60 470,100", "a"), arrow_head(470, 100, math.radians(40), "a", 11)]
    o += gear(400, 168, 16, 8, "s")
    for i, (x, kind) in enumerate([(520, "laptop"), (660, "shield"), (800, "cloud")]):
        o.append(re(x - 52, 52, 104, 140, "k", 8))
        if kind == "laptop":
            o += laptop(x - 32, 98, "s", 64)
        elif kind == "shield":
            o += [shield(x, 124, 1.0, "s"), check(x, 120, 1.0, "a")]
        else:
            o.append(cloud(x + 6, 140, 0.62, "s"))
        o.append(ci(x, 176, 4, "af"))
    return o


def b01_06():  # Network services: DNS, DHCP and IPAM move together, one owns the addresses
    o = []
    pts = [(300, 70), (210, 180), (390, 180)]
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        o.append(ln(x1, y1, x2, y2, "t"))
    o += [ci(300, 70, 30, "k"), ci(210, 180, 30, "k"), ci(390, 180, 30, "ka")]
    o += [ci(300, 70, 14, "s"), pa("M286,70 h28 M300,56 q10,14 0,28 q-10,-14 0,-28", "s")]
    o += [re(196, 168, 28, 24, "s", 3), ln(202, 180, 218, 180, "t")]
    o += [ln(380, 172, 400, 172, "a"), ln(380, 180, 400, 180, "a"), ln(380, 188, 400, 188, "a")]
    o += arrow(450, 130, 540, 130, "a")
    for r in range(4):
        for c in range(8):
            o.append(re(570 + c * 40, 58 + r * 36, 30, 24, "ka" if (r, c) in {(1, 2), (2, 5)} else ("g" if (r + c) % 3 else "k"), 3))
    return o


def b01_07():  # Compute transformation: devices and servers leave the domain for cloud management
    o = [re(100, 50, 300, 160, "d", 12)]
    o += laptop(130, 90, "t") + server(270, 80, 80, 4, "t")
    o += [pa("M330,70 C430,10 560,10 640,80", "a"), arrow_head(640, 80, math.radians(45), "a", 11)]
    o += [cloud(760, 110, 1.15, "s")]
    o += laptop(630, 150, "s") + server(790, 140, 80, 3, "s")
    o += [ln(720, 120, 680, 150, "d"), ln(780, 120, 830, 140, "d")]
    return o


def b01_08():  # The access plane: identity, a decision at the gate, resources behind it
    o = [pa("M110,40 v170 M128,40 v170", "d")]
    o += person(220, 140, 1.4, "s") + [re(244, 140, 30, 22, "ka", 4)]
    o += arrow(300, 124, 400, 124, "s")
    o += [re(420, 60, 120, 128, "k", 10), shield(480, 124, 1.1, "s"), check(480, 120, 1.1, "a")]
    o += arrow(560, 124, 650, 124, "a")
    for i, y in enumerate((60, 110, 160)):
        o += [re(680, y, 150, 38, "k" if i != 1 else "ka", 6), ci(700, y + 19, 6, "sf")]
        o.append(ln(716, y + 19, 800, y + 19, "t"))
    o += [ci(480, 124, 74, "d")]
    return o


def b01_09():  # Who leads: a team around the work, each role holding a part
    o = [re(330, 100, 300, 70, "k", 30), ci(480, 135, 22, "a"), check(480, 135, 1.0, "a")]
    for i, (x, y) in enumerate([(260, 140), (340, 70), (440, 56), (520, 56), (620, 70), (700, 140), (400, 220), (560, 220)]):
        o += person(x, y if y < 200 else y - 10, 0.95, "a" if i == 2 else "s")
    o += [ln(808, 120, 860, 120, "t")]
    o += [*gear(830, 70, 14, 6, "t"), *doc(820, 140, 40, 52, "t", 2)]
    return o


def b01_10():  # Analyzing the estate: a read-only look across servers and their dependencies
    o = []
    grid = [(120 + c * 120, 50 + r * 90) for r in range(2) for c in range(5)]
    for i, (x, y) in enumerate(grid):
        o += server(x, y, 64, 2, "t" if i not in (3, 6) else "s")
    for a, b in [(0, 1), (1, 6), (2, 3), (3, 8), (5, 6), (6, 7), (4, 9), (2, 7)]:
        (x1, y1), (x2, y2) = grid[a], grid[b]
        o.append(ln(x1 + 32, y1 + 44, x2 + 32, y2, "d"))
    o += magnifier(520, 108, 58, "a")
    o += doc(780, 150, 60, 72, "s", 3)[:1] + [check(810, 196, 0.9, "a")]
    return o


def b01_11():  # Analyze, plan, deliver: three stages, two gates, evidence from every run
    o = []
    for i, x in enumerate((120, 400, 680)):
        o.append(re(x, 70, 160, 90, "k", 10))
    o += magnifier(190, 108, 22, "s") + doc(455, 84, 50, 62, "s", 3) + gear(760, 115, 18, 8, "s")
    for gx in (340, 620):
        o += [ln(gx, 50, gx, 180, "a"), re(gx - 10, 100, 20, 30, "ka", 3)]
    o += arrow(280, 115, 330, 115, "t") + arrow(560, 115, 610, 115, "t")
    for x in (200, 480, 760):
        o += [ln(x, 160, x, 196, "d"), re(x - 16, 198, 32, 26, "k", 3), check(x, 211, 0.7, "a")]
    return o


def b01_12():  # The migration roadmap: seven gated phases, parallel lanes underneath
    o = [pa("M80,120 C260,40 440,200 620,110 S860,60 900,80", "s")]
    pts = [(80, 120), (205, 85), (330, 118), (450, 140), (560, 122), (680, 96), (800, 78)]
    for i, (x, y) in enumerate(pts):
        o += [ci(x, y, 10, "ka" if i == len(pts) - 1 else "k")]
        if i:
            o.append(ln(x - 22, y - 28, x - 22, y + 28, "t"))
    o += [ln(900, 80, 900, 30, "a"), poly([(900, 30), (934, 40), (900, 50)], "af")]
    for j in range(5):
        y = 176 + j * 12
        o += [ln(90, y, 880, y, "d" if j % 2 else "t")]
    return o


CHAPTERS = {
    "b01-transformation-arc": {
        "01-why-modernization-is-hard": (b01_01, "A mainframe, scattered servers, stacked security devices and a cloud with a question mark, then a checked circle"),
        "02-the-problem": (b01_02, "A directory tree with locked policy boxes hidden beneath its branches, and a magnifier over it"),
        "03-platform-foundation": (b01_03, "One server ringed by its roles, writing a single record"),
        "04-identity-transformation": (b01_04, "A tree flattening into a row of people grouped by attributes, then a shield"),
        "05-policy-transformation": (b01_05, "A stack of old policy documents regenerated into three owned policy layers"),
        "06-network-services": (b01_06, "Names, leases and addresses linked as one, owning a grid of address blocks"),
        "07-compute-transformation": (b01_07, "A laptop and server leaving a dashed domain for cloud management"),
        "08-access-plane": (b01_08, "A person with a badge passing a checked gate to resources, the old wall faded behind"),
        "09-who-leads-the-transformation": (b01_09, "A team gathered around the work, one person highlighted"),
        "10-analyzing-the-estate": (b01_10, "A magnifier over a grid of servers and their dependencies, producing one record"),
        "11-analysis-plan-delivery": (b01_11, "Three stages separated by two gates, each leaving a checked evidence packet"),
        "12-migration-roadmap": (b01_12, "A road through seven gated phases to a flag, with parallel lanes beneath"),
    },
}

VARIANTS = {"light": ("", cv.STYLE_LIGHT, "#0D1B2E"), "dark": ("dark", cv.STYLE, "#ffffff")}


def svg(book: str, chapter: str, variant: str = "light") -> str:
    fn, desc = CHAPTERS[book][chapter]
    _sub, style, dot = VARIANTS[variant]
    body = "\n".join(dots(dot) + fn())
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img">\n'
            f"<title>{desc}</title>\n{style}\n{body}\n</svg>\n")


def path(book: str, chapter: str, variant: str = "light") -> Path:
    sub = VARIANTS[variant][0]
    return (OUT / book / sub if sub else OUT / book) / f"{chapter}.svg"


def main(argv: list[str]) -> int:
    check_only = "--check" in argv
    stale, n = [], 0
    for book, chapters in CHAPTERS.items():
        for chapter in chapters:
            for variant in VARIANTS:
                p, want = path(book, chapter, variant), svg(book, chapter, variant)
                n += 1
                if check_only:
                    if not p.exists() or p.read_text(encoding="utf-8") != want:
                        stale.append(p.relative_to(OUT).as_posix())
                else:
                    p.parent.mkdir(parents=True, exist_ok=True)
                    p.write_text(want, encoding="utf-8", newline="\n")
    if stale:
        print("openers out of date (run scripts/covers/build_openers.py):", ", ".join(stale))
        return 1
    print(f"{n} opener(s) {'checked' if check_only else 'written'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
