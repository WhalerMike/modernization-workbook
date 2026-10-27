"""Accessibility check for the workbook decks (Section 508 / WCAG 2.1 AA, as PowerPoint's Accessibility Checker applies them).

Usage:  python presentations/_build/a11y_check.py [deck.pptx ...]     (default: every deck under presentations/)

Checks each deck for:
  - document properties: title and author set, author is the presenter
  - every slide has a non-empty title placeholder, and slide titles are unique
  - the title is first in reading order (first shape in the slide's shape tree)
  - every picture, chart and media object has alt text or is marked decorative
  - every table has a header row (firstRow) set
  - text contrast against white (the decks' only background) is at least 4.5:1, or 3:1 for large text
  - no body text under 10 pt
  - text runs carry a language tag
  - narrated decks: every slide's audio has a caption track (WebVTT) attached
Prints one line per problem and a summary; exits 1 if any deck has a problem.
"""
from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path

PRESENTER = "Michael F. Stratton"
NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "dc": "http://purl.org/dc/elements/1.1/",
    "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
}
DECORATIVE = "{C183D7F6-B498-43B3-948B-1728B52AA6E4}"
THEME_HEX = {}  # filled per deck from ppt/theme/theme1.xml


def lum(hexc: str) -> float:
    def ch(v):
        v = int(v, 16) / 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = hexc[0:2], hexc[2:4], hexc[4:6]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(fg: str, bg: str) -> float:
    a, b = sorted((lum(fg), lum(bg)), reverse=True)
    return (a + 0.05) / (b + 0.05)


def check(deck: Path) -> list[str]:
    from xml.etree import ElementTree as ET

    probs: list[str] = []
    z = zipfile.ZipFile(deck)
    names = z.namelist()
    core = ET.fromstring(z.read("docProps/core.xml"))
    title = (core.findtext("dc:title", "", NS) or "").strip()
    author = (core.findtext("dc:creator", "", NS) or "").strip()
    if not title:
        probs.append("document title is empty")
    if author != PRESENTER:
        probs.append(f"author is {author!r}, expected {PRESENTER!r}")
    theme = ET.fromstring(z.read("ppt/theme/theme1.xml"))
    for el in theme.iter():
        tag = el.tag.split("}")[1]
        if tag in ("dk1", "lt1", "dk2", "lt2") or tag.startswith("accent"):
            c = el.find("a:srgbClr", NS)
            if c is not None:
                THEME_HEX[{"dk1": "tx1", "lt1": "bg1", "dk2": "tx2", "lt2": "bg2"}.get(tag, tag)] = c.get("val")

    pres = ET.fromstring(z.read("ppt/presentation.xml"))
    rels = ET.fromstring(z.read("ppt/_rels/presentation.xml.rels"))
    rid2t = {r.get("Id"): r.get("Target") for r in rels}
    slides = [rid2t[s.get(f"{{{NS['r']}}}id")] for s in pres.find("p:sldIdLst", NS)]
    titles: dict[str, int] = {}
    narrated = any(n.startswith("ppt/media/") and n.lower().endswith((".mp3", ".m4a", ".wav")) for n in names)
    for i, target in enumerate(slides, 1):
        part = "ppt/" + target
        x = ET.fromstring(z.read(part))
        relp = part.replace("slides/", "slides/_rels/") + ".rels"
        srels = {r.get("Id"): (r.get("Type"), r.get("Target")) for r in ET.fromstring(z.read(relp))} if relp in names else {}
        tree = x.find("p:cSld/p:spTree", NS)
        shapes = [e for e in tree if e.tag.split("}")[1] in ("sp", "pic", "graphicFrame", "grpSp", "cxnSp")]
        # title
        ttl, first_title = None, None
        for k, sh in enumerate(shapes):
            ph = sh.find(".//p:nvPr/p:ph", NS)
            if ph is not None and ph.get("type") in ("title", "ctrTitle"):
                ttl = "".join(t.text or "" for t in sh.iter(f"{{{NS['a']}}}t")).strip()
                first_title = k
                break
        if not ttl:
            probs.append(f"slide {i}: no title")
        else:
            if ttl in titles:
                probs.append(f"slide {i}: title duplicates slide {titles[ttl]} ({ttl[:50]!r})")
            titles.setdefault(ttl, i)
            if first_title != 0:
                probs.append(f"slide {i}: title is not first in reading order")
        # alt text
        for sh in shapes:
            kind = sh.tag.split("}")[1]
            nv = sh.find(".//p:cNvPr", NS)
            if nv is None:
                continue
            is_media = sh.find(".//a:audioFile", NS) is not None or sh.find(".//a:videoFile", NS) is not None
            is_pic = kind == "pic" or (kind == "graphicFrame" and sh.find(".//a:graphicData[@uri='http://schemas.openxmlformats.org/drawingml/2006/chart']", NS) is not None)
            if not (is_pic or is_media):
                continue
            deco = any(e.get("uri") == DECORATIVE for e in nv.iter(f"{{{NS['a']}}}ext"))
            descr = (nv.get("descr") or "").strip()
            # a path has no spaces; alt text with a slash in it ("S/MIME", "DNS/DDI") is still alt text
            if not deco and (not descr or re.fullmatch(r"\S*[\\/]\S*", descr) or re.search(r"\.(png|jpe?g|gif|svg|emf|wmf|bmp)$", descr, re.I)):
                probs.append(f"slide {i}: {'media' if is_media else 'picture'} {nv.get('name')!r} has no real alt text (empty or a file name) and isn't marked decorative")
        # tables
        for tp in tree.iter(f"{{{NS['a']}}}tblPr"):
            if tp.get("firstRow") != "1":
                probs.append(f"slide {i}: table without a header row")
        # text contrast, size, language
        for r in tree.iter(f"{{{NS['a']}}}r"):
            rpr = r.find("a:rPr", NS)
            text = (r.findtext("a:t", "", NS) or "").strip()
            if not text:
                continue
            if rpr is None or not rpr.get("lang"):
                probs.append(f"slide {i}: text without a language tag ({text[:30]!r})")
                continue
            sz = int(rpr.get("sz", "1800")) / 100
            if sz < 10:
                probs.append(f"slide {i}: {sz:g} pt text ({text[:30]!r})")
            fill = rpr.find("a:solidFill", NS)
            fg = None
            if fill is not None:
                c = fill.find("a:srgbClr", NS)
                s = fill.find("a:schemeClr", NS)
                fg = c.get("val") if c is not None else THEME_HEX.get(s.get("val")) if s is not None else None
            if fg and fg.upper() != "FFFFFF":
                need = 3.0 if (sz >= 18 or (sz >= 14 and rpr.get("b") == "1")) else 4.5
                cr = contrast(fg, "FFFFFF")
                if cr < need:
                    probs.append(f"slide {i}: contrast {cr:.2f}:1 below {need}:1 for #{fg} ({text[:30]!r})")
        # captions on narrated audio
        if narrated:
            has_audio = any(t.endswith("/audio") or t.endswith("/media") for t, _ in srels.values())
            has_caps = any(tgt.lower().endswith(".vtt") for _, tgt in srels.values())
            if has_audio and not has_caps:
                probs.append(f"slide {i}: narration audio has no caption track")
    return probs


def main(argv):
    root = Path(__file__).resolve().parent.parent
    decks = [Path(a).resolve() for a in argv] or sorted(p for p in root.glob("*/*.pptx") if not p.name.startswith("~$"))
    bad = 0
    for d in decks:
        probs = check(d)
        if probs:
            bad += 1
        # collapse repeats of the same kind per deck
        kinds: dict[str, list[str]] = {}
        for p in probs:
            kinds.setdefault(re.sub(r"slide \d+: ", "", re.sub(r"\(.*\)|'.*?'|#\w+|[\d.]+:1|[\d.]+ pt", "…", p)), []).append(p)
        print(f"{'FAIL' if probs else 'ok  '} {d.relative_to(root) if d.is_relative_to(root) else d}: {len(probs)} problem(s)")
        for k, v in kinds.items():
            print(f"      {len(v):3d} × {v[0]}")
    print(f"\n{bad} of {len(decks)} decks have problems")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
