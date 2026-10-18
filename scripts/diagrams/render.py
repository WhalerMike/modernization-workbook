#!/usr/bin/env python3
"""Render the site's generated diagrams from their sources (shared house style).

    python3 scripts/diagrams/render.py                       # every series under docs/images/diagrams/
    python3 scripts/diagrams/render.py ssot-network-physics  # one or more series by folder name
    python3 scripts/diagrams/render.py --only NAME ...       # just these diagrams (any series)
    python3 scripts/diagrams/render.py --dir PATH            # any diagram folder with a src/ inside
    python3 scripts/diagrams/render.py --sheet out.png       # also write a contact sheet

Each series folder (docs/images/diagrams/<series>/) holds src/, svg/ and png/.
This is the same renderer and style as docs/images/sql-server/diagrams/render.py,
generalized to many folders. Sources live in src/ and come in three kinds:

  *.flow.yaml   boxes-and-arrows diagrams; turned into Graphviz DOT here
  *.seq.yaml    sequence diagrams; drawn directly as SVG here
  *.dot         hand-written Graphviz, for anything the two above don't cover

Every diagram is written twice:

  svg/NAME.svg  for the web pages (text converted to outlines, so it looks the
                same in every browser and needs no web font)
  png/NAME.png  at 2x, embedded by scripts/build_bundles.py in the Word bundles

Requirements: Graphviz (dot), rsvg-convert (librsvg2-bin), Python 3 with
PyYAML and Pillow, and the Inter font installed (fc-list | grep Inter).
The shared palette and type sizes are defined in STYLE below; change them
there, never in individual sources.
"""
from __future__ import annotations

import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SERIES_ROOT = ROOT / "docs" / "images" / "diagrams"
# Set per folder by use_dir().
HERE = SRC = SVG = PNG = None


def use_dir(d: Path) -> None:
    global HERE, SRC, SVG, PNG
    HERE = d.resolve()
    SRC, SVG, PNG = HERE / "src", HERE / "svg", HERE / "png"

FONT = "Inter"
# One palette for the whole series. "tone" names in the sources map to these.
TONES = {
    #          stroke     fill       title text
    "blue":   ("#2563EB", "#EFF6FF", "#1D4ED8"),   # Microsoft Entra / the new path
    "green":  ("#059669", "#ECFDF5", "#047857"),   # target state / compliant
    "amber":  ("#D97706", "#FFFBEB", "#B45309"),   # transitional / caution
    "red":    ("#DC2626", "#FEF2F2", "#B91C1C"),   # risk / blocked / fails
    "slate":  ("#64748B", "#F8FAFC", "#334155"),   # legacy / Active Directory / neutral
    "violet": ("#7C3AED", "#F5F3FF", "#6D28D9"),   # governance / monitoring
    "plain":  ("#CBD5E1", "#FFFFFF", "#0F172A"),   # neutral container
}
INK, TEXT, MUTED, LINE = "#0F172A", "#1E293B", "#475569", "#64748B"
SIZE_TITLE, SIZE_BODY, SIZE_SMALL, SIZE_EDGE = 15, 13, 12, 12
# Widest a diagram may be (points) so 12 pt text stays >= ~7 pt on a 6.5 in Word page.
MAX_WIDTH = 800

_fontfile = None


def font(size: float, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    global _fontfile
    if _fontfile is None:
        out = subprocess.run(["fc-match", "-f", "%{file}", f"{FONT}:weight=80"],
                             capture_output=True, text=True).stdout
        if "Inter" not in out:
            sys.exit("Inter font not found (fc-match Inter)")
        _fontfile = out
    f = ImageFont.truetype(_fontfile, size=int(round(size * 4)))
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def text_width(s: str, size: float, weight: str = "Regular") -> float:
    return font(size, weight).getlength(s) / 4.0


def wrap(s: str, width: float, size: float, weight: str = "Regular") -> list[str]:
    """Greedy word wrap to a width in points, using Inter's real metrics."""
    words, lines, cur = s.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if cur and text_width(trial, size, weight) > width:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines or [""]


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def rich(s: str) -> str:
    """Escape for a Graphviz HTML label; `code` becomes a monospace span."""
    parts = re.split(r"(`[^`]+`)", s)
    out = []
    for p in parts:
        if p.startswith("`") and p.endswith("`"):
            out.append(f'<FONT FACE="IBM Plex Mono" POINT-SIZE="{SIZE_SMALL-0.5}">{esc(p[1:-1])}</FONT>')
        else:
            out.append(esc(p))
    return "".join(out)


def plain(s: str) -> str:
    return s.replace("`", "")

# --------------------------------------------------------------------------
# flow: cards and arrows -> DOT


def card_label(n: dict) -> str:
    tone = TONES[n.get("tone", "plain")]
    width = n.get("width", 200)
    inner = width - 20
    rows = []
    if n.get("tag"):
        rows.append(f'<TR><TD ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="{SIZE_SMALL-1}" COLOR="{tone[0]}"><B>{esc(n["tag"].upper())}</B></FONT></TD></TR>')
    if n.get("title"):
        tl = []
        for line in n["title"].split("\n"):
            tl += wrap(plain(line), inner, SIZE_TITLE, "SemiBold") if "`" not in line else [line]
        title = "<BR/>".join(rich(t) for t in tl)
        align = n.get("align", "LEFT")
        rows.append(f'<TR><TD ALIGN="{align}" BALIGN="{align}"><FONT POINT-SIZE="{SIZE_TITLE}" COLOR="{tone[2]}"><B>{title}</B></FONT></TD></TR>')
    for item in n.get("body", []):
        bullet = n.get("bullets", True) and len(n.get("body", [])) > 0 and not item.startswith("=")
        txt = item[1:] if item.startswith("=") else item
        size = n.get("size", SIZE_BODY)
        prefix = "•  " if bullet and n.get("bullets", True) else ""
        lines = wrap(plain(txt), inner - (12 if prefix else 0), size)
        # re-insert code formatting when the item has no wrapping needed
        if "`" in txt and len(lines) == 1:
            body = rich(txt)
        elif "`" in txt:
            body = "<BR/>".join(rich(l) for l in _wrap_code(txt, inner - (12 if prefix else 0), size))
        else:
            body = ("<BR/>" + ("   " if prefix else "")).join(esc(l) for l in lines)
        rows.append(f'<TR><TD ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="{size}" COLOR="{TEXT}">{esc(prefix)}{body}</FONT></TD></TR>')
    if n.get("foot"):
        fl = wrap(plain(n["foot"]), inner, SIZE_SMALL)
        rows.append(f'<TR><TD ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="{SIZE_SMALL}" COLOR="{MUTED}"><I>{"<BR/>".join(esc(l) for l in fl)}</I></FONT></TD></TR>')
    penw = n.get("penwidth", 1.6)
    style = ' STYLE="ROUNDED"' if n.get("rounded", True) else ""
    dash = ""
    return (f'<<TABLE BORDER="{penw}" CELLBORDER="0" CELLSPACING="2" CELLPADDING="3"{style} '
            f'COLOR="{tone[0]}" BGCOLOR="{tone[1]}" WIDTH="{width}">' + "".join(rows) + "</TABLE>>")


def _wrap_code(txt: str, width: float, size: float) -> list[str]:
    """Wrap a string containing `code` spans, keeping spans intact."""
    tokens = re.findall(r"(?:`[^`]+`|[^\s`])+", txt)
    lines, cur = [], ""
    for t in tokens:
        trial = (cur + " " + t).strip()
        if cur and text_width(plain(trial), size) * 1.08 > width:
            lines.append(cur)
            cur = t
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def pill_label(n: dict) -> str:
    tone = TONES[n.get("tone", "plain")]
    size = n.get("size", SIZE_BODY)
    lines = []
    for l in n["text"].split("\n"):
        lines += wrap(plain(l), n.get("width", 300), size, "SemiBold") if "`" not in l else [l]
    body = "<BR/>".join(rich(l) for l in lines)
    return (f'<<TABLE BORDER="1.4" CELLBORDER="0" CELLPADDING="5" STYLE="ROUNDED" COLOR="{tone[0]}" BGCOLOR="{tone[1]}">'
            f'<TR><TD><FONT POINT-SIZE="{size}" COLOR="{tone[2]}"><B>{body}</B></FONT></TD></TR></TABLE>>')


def text_label(n: dict) -> str:
    size = n.get("size", SIZE_SMALL)
    color = TONES[n["tone"]][2] if n.get("tone") else MUTED
    lines = []
    for l in n["text"].split("\n"):
        lines += wrap(plain(l), n.get("width", 220), size) if "`" not in l else [l]
    body = "<BR/>".join(rich(l) for l in lines)
    b0, b1 = ("<B>", "</B>") if n.get("bold") else ("", "")
    return f'<<FONT POINT-SIZE="{size}" COLOR="{color}">{b0}{body}{b1}</FONT>>'


def table_label(n: dict) -> str:
    """A grid: header row + rows. Cells may be plain strings or {text, tone}."""
    cols = n["columns"]
    widths = n.get("widths", [160] * len(cols))
    head_tone = TONES[n.get("tone", "slate")]
    out = [f'<<TABLE BORDER="1.2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="7" COLOR="#CBD5E1" BGCOLOR="#FFFFFF">']
    out.append("<TR>")
    for c, w in zip(cols, widths):
        if isinstance(c, dict):
            t = TONES[c.get("tone", "slate")]
            txt = c["text"]
        else:
            t, txt = head_tone, c
        lines = wrap(txt, w - 14, SIZE_BODY, "SemiBold")
        head = "<BR/>".join(esc(l) for l in lines) if txt.strip() else "&#160;"
        out.append(f'<TD BGCOLOR="{t[1]}" WIDTH="{w}" ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="{SIZE_BODY}" COLOR="{t[2]}"><B>{head}</B></FONT></TD>')
    out.append("</TR>")
    for row in n["rows"]:
        out.append("<TR>")
        j = 0
        for cell in row:
            span = cell.get("span", 1) if isinstance(cell, dict) else 1
            w = sum(widths[j:j + span])
            if isinstance(cell, dict):
                txt, tone = cell["text"], cell.get("tone")
            else:
                txt, tone = cell, None
            bg = TONES[tone][1] if tone else "#FFFFFF"
            col = TONES[tone][2] if tone else TEXT
            bold = (j == 0 and n.get("first_bold", True))
            lines = []
            for para in str(txt).split("\n"):
                lines += _wrap_code(para, w - 14, SIZE_BODY) if "`" in para else wrap(para, w - 14, SIZE_BODY, "SemiBold" if bold else "Regular")
            body = "<BR/>".join(rich(l) for l in lines) if str(txt).strip() else "&#160;"
            if bold:
                body = f"<B>{body}</B>"
            out.append(f'<TD BGCOLOR="{bg}" COLSPAN="{span}" ALIGN="LEFT" BALIGN="LEFT" VALIGN="TOP"><FONT POINT-SIZE="{SIZE_BODY}" COLOR="{col}">{body}</FONT></TD>')
            j += span
        out.append("</TR>")
    out.append("</TABLE>>")
    return "".join(out)


def flow_to_dot(spec: dict) -> str:
    g = spec.get("graph", {})
    lines = [
        "digraph G {",
        f'  graph [rankdir={spec.get("rankdir", "LR")} bgcolor="white" pad="0.25" '
        f'nodesep={g.get("nodesep", 0.35)} ranksep={g.get("ranksep", 0.45)} '
        f'fontname="{FONT}" newrank=true splines={g.get("splines", "spline")} '
        f'{"compound=true" if spec.get("clusters") else ""} {g.get("extra", "")}];',
        f'  node [shape=plain fontname="{FONT}" fontcolor="{TEXT}"];',
        f'  edge [fontname="{FONT}" fontsize={SIZE_EDGE} fontcolor="{MUTED}" color="{LINE}" '
        f'penwidth=1.5 arrowsize=0.75];',
    ]
    nodes = spec.get("nodes", {})

    def node_line(nid, n):
        kind = n.get("kind", "card")
        if kind == "card":
            lab = card_label(n)
        elif kind == "pill":
            lab = pill_label(n)
        elif kind == "text":
            lab = text_label(n)
        elif kind == "table":
            lab = table_label(n)
        elif kind == "point":
            return f'  "{nid}" [shape=point width=0.01 height=0.01 label=""];'
        else:
            raise ValueError(kind)
        extra = n.get("attrs", "")
        return f'  "{nid}" [label={lab} {extra}];'

    in_cluster = set()
    pairs = {(e[0], e[1]) for e in spec.get("edges", [])}

    def emit_cluster(c, depth=1):
        t = TONES[c.get("tone", "plain")]
        ind = "  " * depth
        out = [f'{ind}subgraph "cluster_{c["id"]}" {{',
               f'{ind}  graph [label=<<FONT POINT-SIZE="{SIZE_BODY}" COLOR="{t[2]}"><B>{esc(c.get("label", ""))}</B></FONT>> '
               f'labeljust={c.get("labeljust", "l")} style="rounded{",dashed" if c.get("dashed") else ""}" color="{t[0]}" '
               f'bgcolor="{c.get("bg", t[1] if c.get("filled", True) else "white")}" penwidth=1.3 margin={c.get("margin", 14)}];']
        for nid in c.get("nodes", []):
            in_cluster.add(nid)
            out.append(ind + node_line(nid, nodes[nid]).strip())
        for sub in c.get("clusters", []):
            out += emit_cluster(sub, depth + 1)
        if c.get("order"):
            o = c["order"]
            out.append(f'{ind}  {{rank=same; ' + "; ".join(f'"{x}"' for x in o) + "}")
            for a, b in zip(o, o[1:]):
                if (a, b) not in pairs:
                    out.append(f'{ind}  "{a}" -> "{b}" [style=invis];')
        if c.get("rank_same"):
            out.append(f'{ind}  {{rank=same; ' + "; ".join(f'"{x}"' for x in c["rank_same"]) + "}")
        out.append(f"{ind}}}")
        return out

    for c in spec.get("clusters", []):
        lines += emit_cluster(c)
    for nid, n in nodes.items():
        if nid not in in_cluster:
            lines.append(node_line(nid, n))
    for e in spec.get("edges", []):
        a, b = e[0], e[1]
        opt = e[2] if len(e) > 2 else {}
        attrs = []
        tone = opt.get("tone")
        color = TONES[tone][0] if tone else LINE
        attrs.append(f'color="{color}"')
        if opt.get("label"):
            lab = opt["label"]
            ll = []
            for l in lab.split("\n"):
                ll += wrap(plain(l), opt.get("lw", 150), SIZE_EDGE) if "`" not in l else [l]
            fc = TONES[tone][2] if tone else MUTED
            key = "xlabel" if opt.get("xlabel") else "label"
            pad = "&#160;&#160;"
            attrs.append(f'{key}=<<FONT COLOR="{fc}">{"<BR/>".join(pad + rich(x) + pad for x in ll)}</FONT>>')
        if opt.get("style"):
            attrs.append(f'style={opt["style"]}')
        if opt.get("both"):
            attrs.append("dir=both")
        if opt.get("none"):
            attrs.append("dir=none")
        if opt.get("attrs"):
            attrs.append(opt["attrs"])
        if "penwidth" in opt:
            attrs.append(f'penwidth={opt["penwidth"]}')
        lines.append(f'  "{a}" -> "{b}" [{" ".join(attrs)}];')
    for r in spec.get("ranks", []):
        lines.append("  {rank=same; " + "; ".join(f'"{x}"' for x in r) + "}")
    # order: lists of nodes kept on one rank in exactly this order
    for o in spec.get("order", []):
        lines.append("  {rank=same; " + "; ".join(f'"{x}"' for x in o) + "}")
        for a, b in zip(o, o[1:]):
            if (a, b) not in pairs:
                lines.append(f'  "{a}" -> "{b}" [style=invis];')
    for raw in spec.get("raw", []):
        lines.append("  " + raw)
    lines.append("}")
    return "\n".join(lines)

# --------------------------------------------------------------------------
# seq: sequence diagrams drawn directly as SVG


def seq_to_svg(spec: dict) -> str:
    parts = spec["participants"]
    colw = spec.get("column", 190)
    gap = spec.get("gap", 30)
    left = spec.get("left", 30)
    top = 20
    xs = {}
    boxes = []
    head_h = 0
    for i, p in enumerate(parts):
        w = p.get("width", colw)
        x = left + i * (colw + gap) + (colw - w) / 2
        cx = x + w / 2
        xs[p["id"]] = cx
        title = wrap(p["label"], w - 16, SIZE_TITLE, "SemiBold")
        sub = wrap(p.get("sub", ""), w - 16, SIZE_SMALL) if p.get("sub") else []
        h = 14 + len(title) * 19 + len(sub) * 16 + 8
        head_h = max(head_h, h)
        boxes.append((p, x, w, title, sub))
    width = left * 2 + len(parts) * colw + (len(parts) - 1) * gap
    out = []
    y = top + head_h + 26
    body = []
    msg_gap = spec.get("step", 46)

    def arrow(x1, x2, yy, tone, dashed, label, num):
        c = TONES[tone][0] if tone else "#475569"
        tc = TONES[tone][2] if tone else TEXT
        d = ' stroke-dasharray="6 4"' if dashed else ""
        lines_ = []
        maxw = abs(x2 - x1) - 24 if x1 != x2 else colw
        for l in label.split("\n"):
            lines_ += wrap(l, max(maxw, 120), SIZE_BODY)
        lh = 17
        ty = yy - 8 - (len(lines_) - 1) * lh
        mid = (x1 + x2) / 2
        if num is not None:
            mid += 12 if x2 > x1 else -12
        s = []
        if x1 == x2:
            # self message: loop on the side with more room, label beside it
            right = x1 < width / 2 + 1 and x1 != max(xs.values()) or x1 == min(xs.values())
            sg = 1 if right else -1
            s.append(f'<path d="M{x1} {yy} h{34*sg} v22 h{-30*sg}" fill="none" stroke="{c}" stroke-width="1.6"{d}/>')
            s.append(f'<path d="M{x1+4*sg} {yy+22} l{9*sg} -5 v10 z" fill="{c}"/>')
            lines_ = []
            for l in label.split("\n"):
                lines_ += wrap(l, colw + gap - 20, SIZE_BODY)
            anchor = "start" if right else "end"
            tx = x1 + 44 * sg
            for k, l in enumerate(lines_):
                s.append(f'<text x="{tx}" y="{yy+5+k*lh}" text-anchor="{anchor}" font-family="{FONT}" font-size="{SIZE_BODY}" fill="{tc}">{esc(l)}</text>')
            return s, max(26, len(lines_) * lh)
        s.append(f'<line x1="{x1}" y1="{yy}" x2="{x2 - (9 if x2 > x1 else -9)}" y2="{yy}" stroke="{c}" stroke-width="1.6"{d}/>')
        if x2 > x1:
            s.append(f'<path d="M{x2} {yy} l-10 -5 v10 z" fill="{c}"/>')
        else:
            s.append(f'<path d="M{x2} {yy} l10 -5 v10 z" fill="{c}"/>')
        for k, l in enumerate(lines_):
            s.append(f'<text x="{mid}" y="{ty + k*lh}" text-anchor="middle" font-family="{FONT}" font-size="{SIZE_BODY}" fill="{tc}">{esc(l)}</text>')
        if num is not None:
            nx = x1 + 14 if x2 > x1 else x1 - 14
            s.append(f'<circle cx="{nx}" cy="{yy}" r="9" fill="white" stroke="{c}" stroke-width="1.3"/>')
            s.append(f'<text x="{nx}" y="{yy+4}" text-anchor="middle" font-family="{FONT}" font-size="11" font-weight="600" fill="{c}">{num}</text>')
        return s, (len(lines_) - 1) * lh

    def render_steps(steps, y, depth=0):
        s = []
        for st in steps:
            if "frame" in st:
                tone = st.get("tone", "amber")
                t = TONES[tone]
                y0 = y - 8
                inner, y = render_steps(st["steps"], y + 40, depth + 1)
                fx1 = left - 14 + depth * 8
                fx2 = width - left + 14 - depth * 8
                fh = y - y0 - 18
                s.append(f'<rect x="{fx1}" y="{y0}" width="{fx2-fx1}" height="{fh}" rx="8" fill="{t[1]}" fill-opacity="0.6" stroke="{t[0]}" stroke-width="1.3" stroke-dasharray="5 3"/>')
                lw = text_width(st["frame"], SIZE_SMALL + 0.5, "SemiBold") + 18
                s.append(f'<path d="M{fx1} {y0+8} a8 8 0 0 1 8 -8 h{lw-8} v16 l-8 6 h-{lw} z" fill="{t[0]}"/>')
                s.append(f'<text x="{fx1+9}" y="{y0+13}" font-family="{FONT}" font-size="{SIZE_SMALL+0.5}" font-weight="600" fill="white">{esc(st["frame"])}</text>')
                s += inner
                y += 4
            elif "note" in st:
                tone = st.get("tone", "slate")
                t = TONES[tone]
                ids = st.get("over", [parts[0]["id"], parts[-1]["id"]])
                x1 = min(xs[i] for i in ids) - (colw / 2 - 12 if len(ids) > 1 else 80)
                x2 = max(xs[i] for i in ids) + (colw / 2 - 12 if len(ids) > 1 else 80)
                lines_ = []
                for l in st["note"].split("\n"):
                    lines_ += wrap(l, x2 - x1 - 24, SIZE_BODY)
                h = 12 + len(lines_) * 17
                s.append(f'<rect x="{x1}" y="{y-14}" width="{x2-x1}" height="{h}" rx="6" fill="{t[1]}" stroke="{t[0]}" stroke-width="1.2"/>')
                for k, l in enumerate(lines_):
                    s.append(f'<text x="{(x1+x2)/2}" y="{y+3+k*17}" text-anchor="middle" font-family="{FONT}" font-size="{SIZE_BODY}" fill="{t[2]}">{esc(l)}</text>')
                y += h + 18
            else:
                a, b = st["from"], st["to"]
                extra_h = 0
                lab = st.get("label", "")
                nlines = 0
                maxw = abs(xs[b] - xs[a]) - 24 if a != b else colw
                for l in lab.split("\n"):
                    nlines += len(wrap(l, max(maxw, 120), SIZE_BODY))
                if a != b:
                    y += (nlines - 1) * 17
                seg, extra = arrow(xs[a], xs[b], y, st.get("tone"), st.get("dashed", False), lab, st.get("n"))
                s += seg
                y += msg_gap + (extra if a == b else 0)
        return s, y

    body, y = render_steps(spec["steps"], y + 14)
    height = y + 10
    # participant heads and lifelines
    for p, x, w, title, sub in boxes:
        t = TONES[p.get("tone", "slate")]
        cx = x + w / 2
        out.append(f'<line x1="{cx}" y1="{top + head_h}" x2="{cx}" y2="{height - 12}" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4"/>')
        out.append(f'<rect x="{x}" y="{top}" width="{w}" height="{head_h}" rx="10" fill="{t[1]}" stroke="{t[0]}" stroke-width="1.6"/>')
        ty = top + 22
        for l in title:
            out.append(f'<text x="{cx}" y="{ty}" text-anchor="middle" font-family="{FONT}" font-size="{SIZE_TITLE}" font-weight="600" fill="{t[2]}">{esc(l)}</text>')
            ty += 19
        for l in sub:
            out.append(f'<text x="{cx}" y="{ty}" text-anchor="middle" font-family="{FONT}" font-size="{SIZE_SMALL}" fill="{MUTED}">{esc(l)}</text>')
            ty += 16
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
           f'<rect width="{width}" height="{height}" fill="white"/>'] + out + body + ["</svg>"]
    return "\n".join(svg)

# --------------------------------------------------------------------------


def render(src: Path, tmp: Path) -> Path:
    name = src.name.split(".")[0]
    raw = tmp / f"{name}.raw.svg"
    if src.name.endswith(".flow.yaml"):
        spec = yaml.safe_load(src.read_text())
        dot = flow_to_dot(spec)
        (tmp / f"{name}.dot").write_text(dot)
        r = subprocess.run(["dot", "-Tsvg:cairo", "-o", str(raw)], input=dot, text=True, capture_output=True)
        if r.returncode:
            sys.exit(f"{src.name}: dot failed\n{r.stderr}\n{dot}")
        if r.stderr.strip():
            print(f"  {src.name}: {r.stderr.strip()}")
    elif src.name.endswith(".seq.yaml"):
        spec = yaml.safe_load(src.read_text())
        raw.write_text(seq_to_svg(spec))
    elif src.suffix == ".dot":
        subprocess.run(["dot", "-Tsvg:cairo", "-o", str(raw), str(src)], check=True)
    else:
        raise ValueError(src)
    out_svg = SVG / f"{name}.svg"
    out_png = PNG / f"{name}.png"
    if src.name.endswith(".seq.yaml"):
        # Sequence diagrams are drawn with <text>. Round-trip through PDF so
        # cairo turns the text into outlines with each glyph defined once,
        # then restore the pixel size (PDF works in points).
        size = re.search(r'<svg [^>]*?width="([\d.]+)" height="([\d.]+)"', raw.read_text())
        pdf = tmp / f"{name}.pdf"
        subprocess.run(["rsvg-convert", "-f", "pdf", "-o", str(pdf), str(raw)], check=True)
        subprocess.run(["pdftocairo", "-svg", str(pdf), str(raw)], check=True)
        raw.write_text(re.sub(r'(<svg [^>]*?)width="[\d.]+" height="[\d.]+"',
                              lambda m: f'{m.group(1)}width="{size.group(1)}" height="{size.group(2)}"',
                              raw.read_text(), count=1))
    # Graphviz's cairo SVG already has text as outlines (glyphs defined once,
    # placed with <use>), so the file needs no web font. Shrink it.
    out_svg.write_text(minify_svg(raw.read_text()))
    subprocess.run(["rsvg-convert", "-f", "png", "-z", "2", "-b", "white", "-o", str(out_png), str(out_svg)], check=True)
    # Tag the 2x PNG at 192 dpi so Word lays it out at the SVG's 1x size
    # (pandoc caps anything wider at the text width).
    with Image.open(out_png) as im:
        im.load()
        w = im.width / 2
    im.save(out_png, dpi=(192, 192), optimize=True)
    if w > MAX_WIDTH:
        print(f"  WARNING: {name} is {w:.0f} wide (max {MAX_WIDTH}); text will be small at Word page width")
    return out_png


_NUM = re.compile(r"-?\d+\.\d+")


def _round(m: re.Match) -> str:
    s = f"{round(float(m.group()), 2):.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def _hex(m: re.Match) -> str:
    return "#" + "".join(f"{round(float(x) * 2.55):02x}" for x in m.groups())


def minify_svg(svg: str) -> str:
    """Round coordinates to 0.01 px and drop default attributes."""
    head, sep, body = svg.partition("<svg ")
    body = re.sub(r"rgb\(([\d.]+)%, ?([\d.]+)%, ?([\d.]+)%\)", _hex, body)
    body = re.sub(r' (?:fill|stroke)-opacity="1"| fill-rule="nonzero"', "", body)
    body = _NUM.sub(_round, body)
    body = re.sub(r"(?<=[\d.]) (?=[A-Z])|(?<=[A-Z]) ", "", body)
    return head + sep + body


def contact_sheet(pngs: list[Path], out: Path, title: str) -> None:
    cols, tw, th, pad, lab = 5, 420, 300, 18, 46
    rows = (len(pngs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad + 50), "white")
    d = ImageDraw.Draw(sheet)
    d.text((pad, 14), f"{title} ({len(pngs)} diagrams)", fill=INK, font=font(6.5, "SemiBold"))
    for k, p in enumerate(pngs):
        im = Image.open(p).convert("RGB")
        im.thumbnail((tw, th))
        x = pad + (k % cols) * (tw + pad)
        y = 50 + pad + (k // cols) * (th + lab + pad)
        d.rectangle([x - 1, y - 1, x + tw, y + th], outline="#CBD5E1")
        sheet.paste(im, (x + (tw - im.width) // 2, y + (th - im.height) // 2))
        d.text((x, y + th + 6), p.stem, fill=TEXT, font=font(3.4, "SemiBold"))
    sheet.save(out)


def render_dir(d: Path, only: list[str]) -> list[Path]:
    use_dir(d)
    SVG.mkdir(exist_ok=True)
    PNG.mkdir(exist_ok=True)
    srcs = sorted(p for p in SRC.iterdir() if p.name.endswith((".flow.yaml", ".seq.yaml", ".dot")))
    if only:
        srcs = [p for p in srcs if p.name.split(".")[0] in only]
    with tempfile.TemporaryDirectory() as t:
        for s in srcs:
            render(s, Path(t))
            print(f"rendered {HERE.name}/{s.name.split('.')[0]}")
    # remove outputs whose source is gone
    names = {p.name.split(".")[0] for p in SRC.iterdir()}
    for sub in (SVG, PNG):
        for f in sub.iterdir():
            if f.stem not in names:
                f.unlink()
                print(f"removed stale {f.relative_to(ROOT)}")
    return sorted(PNG.glob("*.png"))


def main(argv: list[str]) -> None:
    sheet, only, dirs = None, [], []
    args = list(argv)
    while args:
        a = args.pop(0)
        if a == "--sheet":
            sheet = Path(args.pop(0))
        elif a == "--dir":
            dirs.append(Path(args.pop(0)))
        elif a == "--only":
            while args and not args[0].startswith("--"):
                only.append(args.pop(0))
        else:
            dirs.append(SERIES_ROOT / a)
    if not dirs:
        dirs = sorted(p for p in SERIES_ROOT.iterdir() if (p / "src").is_dir())
    pngs = []
    for d in dirs:
        if not (d / "src").is_dir():
            sys.exit(f"{d}: no src/ folder")
        pngs += render_dir(d, only)
    if sheet:
        contact_sheet(pngs, sheet, "Modernization Workbook — diagrams")
        print(f"contact sheet: {sheet}")


if __name__ == "__main__":
    main(sys.argv[1:])
