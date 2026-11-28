"""Build the managed service account production proposal (Word) and its deck (PowerPoint) from proposal_content.py.

    python build_proposal.py                    # writes msa-production-proposal.docx and .pptx (needs python-docx, python-pptx)
    python build_proposal.py --check            # exits 1 if either is out of date (standard library only)
    python build_proposal.py --preview <dir>    # also draws a PNG per slide with the layout's text boxes (needs Pillow)

Both files' core properties are fixed, so the same content always gives the same text; --check compares the text of
each paragraph, table row and speaker note, in order, not the bytes. The deck's tables pick the largest font, from 14 to
10 points, at which Calibri's measured line widths fit the slide; the build fails if one doesn't fit at 10.
"""

from __future__ import annotations

import argparse
import datetime as dt
import posixpath
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import proposal_content as C  # noqa: E402

DOCX = HERE / "msa-production-proposal.docx"
PPTX = HERE / "msa-production-proposal.pptx"
FIXED = dt.datetime(2026, 1, 1, 0, 0, 0)
AUTHOR = "Federal Modernization Workbook"
FOOTER = "Neutral template from the Federal Modernization Workbook. Fill it in inside your agency; nothing you write comes back to the public workbook."
NAVY, TEAL, SLATE, INK, LINE, TINT = "1F2A44", "0F766E", "64748B", "334155", "CBD5E1", "E4EAF4"
W_IN, H_IN = 13.333, 7.5
BODY_TOP, BODY_BOTTOM, LEFT, BODY_W = 1.45, 6.85, 0.6, 12.13


def normalize_zip(path: Path) -> None:
    """Rewrite an Office file with every entry's time fixed, so the same content gives the same bytes."""
    with zipfile.ZipFile(path) as z:
        items = [(i.filename, z.read(i.filename)) for i in z.infolist()]
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in items:
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)


# ----------------------------------------------------------------------------- the document, as blocks

def doc_blocks() -> list[tuple]:
    """The proposal as blocks: (kind, ...). Both the builder and --check walk this."""
    b: list[tuple] = [("title", C.TITLE), ("p", C.SUBTITLE), ("p", C.AUDIENCE), ("note", C.STATUS)]
    b += [("h1", "1. Summary")] + [("p", p) for p in C.SUMMARY]
    b += [("h2", "Decisions requested"), ("table", ["Of", "Decision"], [list(r) for r in C.DECISIONS_REQUESTED])]
    b += [("h1", "2. The problem"), ("table", ["Problem", "What it means"], [list(r) for r in C.PROBLEM])]
    b += [("h1", "3. The decided design"),
          ("p", "Every row is a settled decision in the program's decision register [18]; the choice is shortened, not changed. WD-175's tags stand, except where they live in Entra, which WD-176 set."),
          ("table", ["Decision", "Topic", "The choice, in short"], [list(r) for r in C.DECISIONS])]
    b += [("h1", "4. How a request flows"),
          ("p", "From the agency's system access management tool to SailPoint's certification, with no person writing to Active Directory for a gMSA [16]:")]
    b += [("bullets", [f"{s}: {t}" for s, t in C.FLOW])]
    b += [("h1", "5. The lifecycle"), ("table", ["Event", "What happens", "Who runs it", "Form or record"], [list(r) for r in C.LIFECYCLE]),
          ("p", C.LIFECYCLE_NOTE)]
    b += [("h1", "6. Naming standard and its enforcement"), ("bullets", C.NAMING),
          ("p", "WD-174 enforces the standard in five places, so it isn't left to an approver's memory. ServiceNow's required fields record completeness; they aren't an approval (WD-162):"),
          ("table", ["Layer", "What it enforces"], [list(r) for r in C.ENFORCEMENT])]
    b += [("h1", "7. Rollout phases"),
          ("p", "The guide's change-safety rings, with a 30-day parallel run for every account that replaces an old one (WD-124) [16]:"),
          ("table", ["Phase", "Scope", "Exit criteria", "Ring"], [list(r) for r in C.PHASES])]
    b += [("h1", "8. Controls and KSIs the evidence supports"), ("table", ["Step", "Requirement it supports", "KSIs"], [list(r) for r in C.CONTROLS]),
          ("p", C.CONTROLS_NOTE)]
    b += [("h1", "9. Risks and guards"), ("p", "From the service accounts guide's Dangers table [16]:"),
          ("table", ["Risk", "What happens", "The guard"], [list(r) for r in C.RISKS]), ("p", C.BACKOUT)]
    b += [("h1", "10. Prerequisites"), ("note", C.ASSUMPTION),
          ("table", ["Prerequisite", "What it needs", "Source", "At <agency>"], [list(r) for r in C.PREREQS])]
    b += [("h1", "11. Open items"), ("bullets", C.OPEN_ITEMS)]
    b += [("h1", "12. Decisions requested of the reader"), ("table", ["Of", "Decision"], [list(r) for r in C.DECISIONS_REQUESTED])]
    b += [("h1", "13. Placeholders"), ("p", "Fill each one at work from the Day 2 evidence (day2-test-script.md), with proposal-prompts.md. Never paste a password, a key value or a secret anywhere."),
          ("table", ["Placeholder", "What it is", "Filled from"], [list(r) for r in C.PLACEHOLDERS])]
    b += [("h1", "Appendix A. Technical appendix for engineers"), ("table", ["Setting", "The standard"], [list(r) for r in C.TECH_SETTINGS]),
          ("h2", "The create call the pipeline sends"), ("code", C.TECH_COMMAND),
          ("p", "In production the pipeline sends it from the approved plan (WD-168); by hand, only in a test domain."),
          ("h2", "Where the detail is"), ("bullets", C.TECH_LINKS)]
    b += [("h1", "Appendix B. Sources"), ("bullets", [f"[{n}] {t}" for n, t in C.SOURCES])]
    b += [("small", FOOTER)]
    return b


def doc_text() -> list[str]:
    """The text of the built document, in order: what --check compares."""
    out: list[str] = []
    for blk in doc_blocks():
        kind = blk[0]
        if kind == "table":
            out.append(" | ".join(blk[1]))
            out += [" | ".join(r) for r in blk[2]]
        elif kind == "bullets":
            out += blk[1]
        else:
            out.append(blk[1])
    return out


def build_docx(path: Path) -> None:
    from docx import Document
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Pt, RGBColor

    doc = Document()
    cp = doc.core_properties
    cp.created = cp.modified = FIXED
    cp.author = cp.last_modified_by = AUTHOR
    cp.title = C.TITLE
    st = doc.styles["Normal"]
    st.font.name, st.font.size = "Calibri", Pt(10.5)
    for name in ("Title", "Heading 1", "Heading 2"):
        doc.styles[name].font.name = "Cambria"
        doc.styles[name].font.color.rgb = RGBColor.from_string(NAVY)

    def shade(cell, hex_):
        tcpr = cell._tc.get_or_add_tcPr()
        sh = OxmlElement("w:shd")
        sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), hex_)
        tcpr.append(sh)

    for blk in doc_blocks():
        kind = blk[0]
        if kind == "title":
            doc.add_heading(blk[1], level=0)
        elif kind == "h1":
            doc.add_heading(blk[1], level=1)
        elif kind == "h2":
            doc.add_heading(blk[1], level=2)
        elif kind == "p":
            doc.add_paragraph(blk[1])
        elif kind == "note":
            p = doc.add_paragraph()
            r = p.add_run(blk[1]); r.italic = True; r.font.color.rgb = RGBColor.from_string(TEAL)
        elif kind == "small":
            p = doc.add_paragraph()
            r = p.add_run(blk[1]); r.font.size = Pt(8)
        elif kind == "code":
            p = doc.add_paragraph()
            r = p.add_run(blk[1]); r.font.name = "Consolas"; r.font.size = Pt(9)
        elif kind == "bullets":
            for t in blk[1]:
                doc.add_paragraph(t, style="List Bullet")
        elif kind == "table":
            head, rows = blk[1], blk[2]
            t = doc.add_table(rows=1, cols=len(head))
            t.style = "Table Grid"
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            for cell, text in zip(t.rows[0].cells, head):
                cell.text = text
                shade(cell, TINT)
                for run in cell.paragraphs[0].runs:
                    run.bold = True
            for r in rows:
                cells = t.add_row().cells
                for cell, text in zip(cells, r):
                    cell.text = text
            for row in t.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        for run in p.runs:
                            run.font.size = Pt(9.5)
            doc.add_paragraph()  # space after a table; empty, so --check skips it
    path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(path)
    normalize_zip(path)


W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def read_docx_text(path: Path) -> list[str]:
    """The text of a built document, read with the standard library."""
    with zipfile.ZipFile(path) as z:
        body = ET.fromstring(z.read("word/document.xml")).find(f"{W}body")
    out = []
    for child in body:
        if child.tag == f"{W}p":
            text = "".join(t.text or "" for t in child.iter(f"{W}t"))
            if text:
                out.append(text)
        elif child.tag == f"{W}tbl":
            for tr in child.iter(f"{W}tr"):
                out.append(" | ".join("".join(t.text or "" for t in tc.iter(f"{W}t")) for tc in tr.findall(f"{W}tc")))
    return out


# ----------------------------------------------------------------------------- the deck

_FONT_CACHE: dict = {}


def _font(size: float, bold: bool = False, face: str = "calibri"):
    """Calibri (or Cambria) at a size, for measuring; a fixed average width when Pillow or the font isn't there."""
    key = (size, bold, face)
    if key not in _FONT_CACHE:
        f = None
        try:
            from PIL import ImageFont
            name = f"{face}b.ttf" if bold else f"{face}.ttf"
            for d in (Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/msttcorefonts")):
                if (d / name).exists():
                    f = ImageFont.truetype(str(d / name), int(round(size * 4)))  # 4 px per point: 288 px per inch
                    break
        except Exception:  # noqa: BLE001 - measuring is best effort
            f = None
        _FONT_CACHE[key] = f
    return _FONT_CACHE[key]


def text_width_in(text: str, size: float, bold: bool = False, face: str = "calibri") -> float:
    f = _font(size, bold, face)
    if f is None:
        return len(text) * size * 0.52 / 72
    return f.getlength(text) / 288


def wrap(text: str, width_in: float, size: float, bold: bool = False) -> list[str]:
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if cur and text_width_in(trial, size, bold) > width_in:
            lines.append(cur); cur = word
        else:
            cur = trial
    lines.append(cur)
    return lines


def table_layout(head: list[str], rows: list[tuple], height_in: float) -> tuple[float, list[float], list[float]]:
    """The largest font (14 to 10 pt) at which the table fits, its column widths and its row heights."""
    n = len(head)
    # Column widths in proportion to each column's longest text, at least 1.6 inches.
    longest = [max(text_width_in(str(r[i]), 12) for r in [head] + [list(x) for x in rows]) for i in range(n)]
    raw = [max(1.6, min(l, 7.5)) for l in longest]
    widths = [BODY_W * w / sum(raw) for w in raw]
    for size in (14, 13, 12, 11, 10):
        heights = []
        for k, r in enumerate([head] + [list(x) for x in rows]):
            lines = max(len(wrap(str(r[i]), widths[i] - 0.2, size, bold=(k == 0))) for i in range(n))
            heights.append(lines * size * 1.2 / 72 + 0.12)
        if sum(heights) <= height_in:
            return size, widths, heights
    raise SystemExit(f"Table '{head}' doesn't fit the slide at 10 pt: {sum(heights):.2f} in for {height_in:.2f} in")


def bullets_layout(bullets: list[str], height_in: float) -> float:
    for size in (20, 19, 18, 17, 16, 15, 14):
        h = sum(len(wrap(b, BODY_W - 0.45, size)) * size * 1.2 / 72 + size * 0.5 / 72 for b in bullets)
        if h <= height_in:
            return size
    raise SystemExit(f"Bullets don't fit the slide at 14 pt: {bullets[0][:40]}...")


def slide_text(s: dict, n: int, total: int) -> tuple[list[str], list[str]]:
    """The text of one slide, in shape order, and its notes: what --check compares."""
    out = [s["title"]]
    if "subtitle" in s:
        out += [s["subtitle"], C.STATUS]
    if "bullets" in s:
        out += s["bullets"]
    if "table" in s:
        head, rows = s["table"]
        out += list(head)
        for r in rows:
            out += list(r)
    out.append(f"Managed service account production proposal  ·  neutral template  ·  {n} of {total}")
    return out, [s["notes"]]


def deck_text() -> list[str]:
    out = []
    total = len(C.SLIDES)
    for n, s in enumerate(C.SLIDES, 1):
        body, notes = slide_text(s, n, total)
        out += [f"--- slide {n}"] + body + ["--- notes"] + notes
    return out


def build_pptx(path: Path, preview: Path | None = None) -> None:
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.enum.shapes import MSO_SHAPE
    from pptx.enum.text import MSO_ANCHOR
    from pptx.util import Inches, Pt

    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(W_IN), Inches(H_IN)
    cp = prs.core_properties
    cp.created = cp.modified = FIXED
    cp.author = cp.last_modified_by = AUTHOR
    cp.title = C.TITLE
    blank = prs.slide_layouts[6]
    total = len(C.SLIDES)
    boxes: list[list[tuple]] = []  # for the preview: (x, y, w, h, label)

    def textbox(slide, x, y, w, h, paras, size, color=INK, bold=False, font="Calibri", bullet=False, anchor=MSO_ANCHOR.TOP):
        tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = anchor
        for k, t in enumerate(paras):
            p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
            r = p.add_run()
            r.text = t
            r.font.size, r.font.bold, r.font.name = Pt(size), bold, font
            r.font.color.rgb = RGBColor.from_string(color)
            if bullet:
                p.space_after = Pt(size * 0.5)
                pPr = p._p.get_or_add_pPr()
                pPr.set("marL", str(int(Inches(0.3)))); pPr.set("indent", str(int(-Inches(0.3))))
                from pptx.oxml.ns import qn
                bu = pPr.makeelement(qn("a:buChar"), {"char": "\u2022"})
                pPr.append(bu)
        return tb

    for n, s in enumerate(C.SLIDES, 1):
        slide = prs.slides.add_slide(blank)
        b: list[tuple] = []
        if "subtitle" in s:
            bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
            bg.fill.solid(); bg.fill.fore_color.rgb = RGBColor.from_string(NAVY); bg.line.fill.background()
            bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(3.55), Inches(1.6), Inches(0.08))
            bar.fill.solid(); bar.fill.fore_color.rgb = RGBColor.from_string(TEAL); bar.line.fill.background()
            textbox(slide, 0.8, 1.4, 11.5, 2.0, [s["title"]], 40, "FFFFFF", True, "Cambria", anchor=MSO_ANCHOR.BOTTOM)
            textbox(slide, 0.8, 3.85, 11.5, 0.9, [s["subtitle"]], 18, "DCEFEC")
            textbox(slide, 0.8, 5.0, 11.5, 1.6, [C.STATUS], 12, "CBD5E1")
            b += [(0.8, 1.4, 11.5, 2.0, s["title"], 40), (0.8, 3.85, 11.5, 0.9, s["subtitle"], 18), (0.8, 5.0, 11.5, 1.6, C.STATUS, 12)]
        else:
            textbox(slide, LEFT, 0.45, BODY_W, 0.8, [s["title"]], 28, NAVY, True, "Cambria", anchor=MSO_ANCHOR.BOTTOM)
            rule = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(LEFT), Inches(1.28), Inches(1.2), Inches(0.06))
            rule.fill.solid(); rule.fill.fore_color.rgb = RGBColor.from_string(TEAL); rule.line.fill.background()
            b.append((LEFT, 0.45, BODY_W, 0.8, s["title"], 28))
            if text_width_in(s["title"], 28, True, "cambria") > BODY_W - 0.2:
                raise SystemExit(f"Slide {n}'s title is too long for one line: {s['title']}")
            avail = BODY_BOTTOM - BODY_TOP
            if "bullets" in s:
                size = bullets_layout(s["bullets"], avail)
                textbox(slide, LEFT, BODY_TOP, BODY_W, avail, s["bullets"], size, INK, bullet=True)
                b.append((LEFT, BODY_TOP, BODY_W, avail, "\n".join(s["bullets"]), size))
            if "table" in s:
                head, rows = s["table"]
                size, widths, heights = table_layout(list(head), rows, avail)
                gf = slide.shapes.add_table(len(rows) + 1, len(head), Inches(LEFT), Inches(BODY_TOP), Inches(BODY_W), Inches(sum(heights)))
                tbl = gf.table
                for i, w in enumerate(widths):
                    tbl.columns[i].width = Inches(w)
                for k, r in enumerate([list(head)] + [list(x) for x in rows]):
                    tbl.rows[k].height = Inches(heights[k])
                    for i, text in enumerate(r):
                        cell = tbl.cell(k, i)
                        cell.text = str(text)
                        cell.margin_left = cell.margin_right = Inches(0.08)
                        cell.margin_top = cell.margin_bottom = Inches(0.04)
                        cell.fill.solid()
                        cell.fill.fore_color.rgb = RGBColor.from_string(NAVY if k == 0 else ("FFFFFF" if k % 2 else "F1F5F9"))
                        for p in cell.text_frame.paragraphs:
                            for run in p.runs:
                                run.font.size, run.font.name, run.font.bold = Pt(size), "Calibri", k == 0
                                run.font.color.rgb = RGBColor.from_string("FFFFFF" if k == 0 else INK)
                y = BODY_TOP
                for k, h in enumerate(heights):
                    x = LEFT
                    r = [list(head)] + [list(x) for x in rows]
                    for i, w in enumerate(widths):
                        b.append((x, y, w, h, str(r[k][i]), size)); x += w
                    y += h
        foot = f"Managed service account production proposal  ·  neutral template  ·  {n} of {total}"
        textbox(slide, LEFT, 6.95, BODY_W, 0.35, [foot], 10, "CBD5E1" if "subtitle" in s else SLATE)
        slide.notes_slide.notes_text_frame.text = s["notes"]
        boxes.append(b)
    path.parent.mkdir(parents=True, exist_ok=True)
    prs.save(path)
    normalize_zip(path)
    if preview:
        draw_preview(boxes, preview)


def draw_preview(boxes: list[list[tuple]], out: Path) -> None:
    """One PNG per slide with each text box's outline and its wrapped text, at 96 px per inch."""
    from PIL import Image, ImageDraw, ImageFont

    out.mkdir(parents=True, exist_ok=True)
    dpi = 96
    for n, b in enumerate(boxes, 1):
        im = Image.new("RGB", (int(W_IN * dpi), int(H_IN * dpi)), "white")
        d = ImageDraw.Draw(im)
        for x, y, w, h, text, size in b:
            d.rectangle([x * dpi, y * dpi, (x + w) * dpi, (y + h) * dpi], outline="#CBD5E1")
            try:
                f = ImageFont.truetype("C:/Windows/Fonts/calibri.ttf", int(size * dpi / 72))
            except OSError:
                f = ImageFont.load_default()
            yy = y * dpi + 3
            for para in text.split("\n"):
                for line in wrap(para, w - 0.2, size):
                    d.text((x * dpi + 6, yy), line, fill="#1F2A44", font=f)
                    yy += size * 1.2 * dpi / 72
            if yy > (y + h) * dpi + 2:
                d.rectangle([x * dpi, y * dpi, (x + w) * dpi, (y + h) * dpi], outline="red", width=3)
        im.save(out / f"slide-{n:02d}.png")


P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def read_pptx_text(path: Path) -> list[str]:
    """The text of a built deck, slide by slide, with each slide's notes, read with the standard library."""
    out = []
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        slides = sorted((n for n in names if n.startswith("ppt/slides/slide") and n.endswith(".xml")),
                        key=lambda n: int(n[len("ppt/slides/slide"):-4]))
        for k, name in enumerate(slides, 1):
            root = ET.fromstring(z.read(name))
            out.append(f"--- slide {k}")
            for p in root.iter(f"{A}p"):
                t = "".join(x.text or "" for x in p.iter(f"{A}t"))
                if t:
                    out.append(t)
            out.append("--- notes")
            rels = ET.fromstring(z.read(name.replace("slides/", "slides/_rels/") + ".rels"))
            for rel in rels:
                if rel.get("Type", "").endswith("/notesSlide"):
                    notes = ET.fromstring(z.read(posixpath.normpath("ppt/slides/" + rel.get("Target"))))
                    for sp in notes.iter(f"{P}sp"):
                        ph = sp.find(f".//{P}ph")
                        if ph is not None and ph.get("type") == "body":
                            text = "\n".join("".join(x.text or "" for x in p.iter(f"{A}t")) for p in sp.iter(f"{A}p"))
                            out.append(text.strip())
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--preview", type=Path)
    args = ap.parse_args()
    if args.check:
        stale = []
        if not DOCX.is_file() or read_docx_text(DOCX) != doc_text():
            stale.append(DOCX.name)
        if not PPTX.is_file() or read_pptx_text(PPTX) != deck_text():
            stale.append(PPTX.name)
        if stale:
            print("out of date: " + ", ".join(stale) + " (run python build_proposal.py)")
            return 1
        print("proposal current")
        return 0
    build_docx(DOCX)
    build_pptx(PPTX, args.preview)
    print(f"wrote {DOCX.name} and {PPTX.name} ({len(C.SLIDES)} slides)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
