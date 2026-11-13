#!/usr/bin/env python3
"""Turn the source references on a built deck's slides into links.

Works on the built .pptx, plain or narrated, and edits only the slide XML and its
relationships, so narration, timings and caption tracks stay byte for byte. It reads what
the slides already say:

    Book 00, Ch 01 (Success criteria)     the chapter page, and the heading when one matches
    Chapters 03 and 07, App. A            each one on its own (no book named: the last one
                                          named in the paragraph, then the deck's own book)
    OMB M-22-09, Group Policy processing  data/source-register.json: the source's permanent row
                                          in the Source Register, which links to the original

It covers the shape named "Sources", the "Source list" shapes of the backup slides, and
table cells (not header rows) that name a book or chapter. Run it again and the result is
the same. The slide text never changes, so the voice and the captions don't either.

    python presentations/_build/link_sources.py presentations/start-here/Start_Here.pptx
    python presentations/_build/link_sources.py <deck> --report    # also list what stayed plain

A narrated deck also gets <Base>_Narrated_sources.json, one entry per slide with a link,
which scripts/youtube_description.py and the Watch page read.

Needs lxml.
"""

from __future__ import annotations

import argparse
import copy
import json
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

from lxml import etree

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "source_watch"))
import register  # noqa: E402

SITE = register.SITE
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PR = "{http://schemas.openxmlformats.org/package/2006/relationships}"
HYPERLINK = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"

BOOK = re.compile(r"\bBooks? (\d\d)\b")
# "Ch 01", "Ch. 01, 03", "Chapters 03 and 07", "Chapters 01, 03, 05, 07 and 10", "Ch. 05, 07–10"
CHAPTERS = re.compile(r"\b(?:Chapters?|Ch\.?) ?(\d\d(?:(?:, and |, | and |–)\d\d)*)")
APPENDIX = re.compile(r"\b(?:Appendix|App\.) ([A-C])\b")
# The developer workbooks under Projects, which a deck's chapter numbers can mean. Book 19 is a book.
WORKBOOKS = {"hr": "hr-driven-identity", "npi": "non-person-identity", "pa": "privileged-access", "pn": "provider-notices", "ttm": "ticket-to-machine"}
TABLE_CELL = re.compile(r"\bBook \d\d\b|\bCh\.? ?\d\d|\bChapters? \d\d|\bApp\. [A-C]\b")


class Pages:
    """The book pages, and each page's headings."""

    def __init__(self) -> None:
        self.books = {p.name[1:3]: p for p in (ROOT / "docs" / "books").glob("b[0-9][0-9]-*") if p.is_dir()}
        self.books.update({key: ROOT / "docs" / "project-plans" / "developer-workbooks" / name for key, name in WORKBOOKS.items()})
        self.headings: dict[Path, list[tuple[str, str]]] = {}

    def page(self, book: str, name: str) -> Path | None:
        folder = self.books.get(book)
        hits = sorted(folder.glob(f"{name}-*.md")) if folder else []
        return hits[0] if hits else None

    def url(self, page: Path, anchor: str = "") -> str:
        rel = page.relative_to(ROOT).with_suffix(".html").as_posix()
        return f"{SITE}{rel}{'#' + anchor if anchor else ''}"

    def index(self, book: str) -> str | None:
        folder = self.books.get(book)
        return self.url(folder / "index.md") if folder else None

    def heads(self, page: Path) -> list[tuple[str, str]]:
        if page not in self.headings:
            self.headings[page] = register.page_headings(page)
        return self.headings[page]

    def section(self, page: Path, item: str) -> str | None:
        """The heading a section name in brackets means, only when exactly one fits."""
        want = item.strip().lower()
        if len(want) < 5:
            return None
        heads = self.heads(page)
        exact = [i for t, i in heads if t.lower() == want]
        if exact:
            return exact[0]
        near = [i for t, i in heads if want in t.lower()]
        return near[0] if len(near) == 1 else None


def load_labels() -> list[tuple[str, dict]]:
    """Every label, longest first: {label: {url} or {parts: {text: url}}}. A source's label goes
    to its register row, never to the original, so a released deck can't go stale."""
    data = register.load()
    labels: dict[str, dict] = {}
    for s in data["sources"]:
        if s["status"] == "active":
            for label in s["labels"]:
                labels[label] = {"url": register.row_url(s["id"])}
    for phrase, parts in data["phrases"].items():
        labels[phrase] = {"parts": {part: register.row_url(i) for part, i in parts.items()}}
    for label, url in data["site"].items():
        labels[label] = {"url": url}
    return sorted(labels.items(), key=lambda kv: -len(kv[0]))


def free(spans: list[tuple[int, int, str]], a: int, b: int) -> bool:
    return not any(a < y and x < b for x, y, _ in spans)


def link_ref(spans, text, m, book, pages, start) -> None:
    """Link a chapter list or an appendix: the first number with its words, the rest alone."""
    if not book:
        return
    if m.re is APPENDIX:
        page = pages.page(book, f"appendix-{m.group(1).lower()}")
        if page and free(spans, start, m.end()):
            spans.append((start, m.end(), pages.url(page)))
        return
    for i, n in enumerate(re.finditer(r"\d\d", m.group(1))):
        page = pages.page(book, n.group())
        a, b = m.start(1) + n.start(), m.start(1) + n.end()
        if page and free(spans, start if i == 0 else a, b):
            spans.append((start if i == 0 else a, b, pages.url(page)))


def link_sections(spans, text, pages) -> None:
    """Inside the brackets after a chapter, link the names that are that chapter's headings."""
    for m in re.finditer(r"\(([^()]*)\)", text):
        before = [s for s in sorted(spans) if s[1] <= m.start() and "/books/" in s[2]]
        if not before:
            continue
        page = ROOT / before[-1][2].split("#")[0][len(SITE):].replace(".html", ".md")
        if not page.exists() or page.name == "index.md":
            continue
        for item in re.finditer(r"[^;,]+", m.group(1)):
            name = item.group().strip()
            a = m.start(1) + item.start() + len(item.group()) - len(item.group().lstrip())
            anchor = pages.section(page, name)
            if anchor and free(spans, a, a + len(name)):
                spans.append((a, a + len(name), pages.url(page, anchor)))


def resolve(text: str, default_book: str | None, pages: Pages, labels: list[tuple[str, dict]]) -> list[tuple[int, int, str]]:
    """(start, end, url) for every reference in one paragraph."""
    spans: list[tuple[int, int, str]] = []
    # Books, chapters and appendices in reading order, so a bare "Chapter 12" takes the book before it.
    marks = sorted(list(BOOK.finditer(text)) + list(CHAPTERS.finditer(text)) + list(APPENDIX.finditer(text)),
                   key=lambda m: m.start())
    book, held = default_book, None
    for m in marks:
        if m.re is BOOK:
            if held:   # "Book 00" with no chapter after it: the book itself
                if free(spans, held.start(), held.end()) and pages.index(held.group(1)):
                    spans.append((held.start(), held.end(), pages.index(held.group(1))))
            book, held = m.group(1), m
            continue
        joined = held and re.fullmatch(r",? ", text[held.end():m.start()])
        link_ref(spans, text, m, book, pages, held.start() if joined else m.start())
        if held and not joined and free(spans, held.start(), held.end()) and pages.index(held.group(1)):
            spans.append((held.start(), held.end(), pages.index(held.group(1))))
        held = None
    if held and free(spans, held.start(), held.end()) and pages.index(held.group(1)):
        spans.append((held.start(), held.end(), pages.index(held.group(1))))
    # A heading of the cited chapter wins over a label: the book is the nearer source.
    link_sections(spans, text, pages)
    for label, target in labels:
        for m in re.finditer(r"(?<![\w-])" + re.escape(label) + r"(?![\w-])", text):
            if "url" in target:
                if free(spans, m.start(), m.end()):
                    spans.append((m.start(), m.end(), target["url"]))
                continue
            at = m.start()
            for part, url in target["parts"].items():
                k = text.find(str(part), at, m.end())
                if k >= 0 and free(spans, k, k + len(str(part))):
                    spans.append((k, k + len(str(part)), url))
                    at = k + len(str(part))
    return sorted(spans)


def deck_book(deck: Path) -> str | None:
    """The book a bare "Chapter 03" means: the deck's own book, or the developer workbook of its tour or module."""
    m = re.match(r"b(\d\d)-", deck.parent.name)
    if m:
        return m.group(1)
    m = re.match(r"(?:dw|training)-(adm|hr|npi|pa|pn|ttm)-", deck.parent.name)
    if m:
        return "19" if m.group(1) == "adm" else m.group(1)
    return "ttm" if deck.parent.name.startswith("ttm-story") else None


def slide_order(z: zipfile.ZipFile) -> list[str]:
    rels = etree.fromstring(z.read("ppt/_rels/presentation.xml.rels"))
    targets = {r.get("Id"): r.get("Target") for r in rels}
    pres = etree.fromstring(z.read("ppt/presentation.xml"))
    return ["ppt/" + targets[s.get(R + "id")] for s in pres.iter(P + "sldId")]


def paragraphs(slide) -> list:
    """The paragraphs to link on one slide."""
    out = []
    for sp in slide.iter(P + "sp"):
        name = sp.find(f"{P}nvSpPr/{P}cNvPr").get("name", "")
        if name == "Sources" or name.startswith("Source list"):
            out += list(sp.iter(A + "p"))
    for table in slide.iter(A + "tbl"):
        for row in table.findall(A + "tr")[1:]:
            for cell in row.findall(A + "tc"):
                if TABLE_CELL.search("".join(t.text or "" for t in cell.iter(A + "t"))):
                    out += list(cell.iter(A + "p"))
    return out


def clear_links(slide, rels) -> None:
    for link in list(slide.iter(A + "hlinkClick")):
        link.getparent().remove(link)
    for rel in list(rels):
        if rel.get("Type") == HYPERLINK:
            rels.remove(rel)


def relate(rels, url: str) -> str:
    for rel in rels:
        if rel.get("Type") == HYPERLINK and rel.get("Target") == url:
            return rel.get("Id")
    used = [int(re.sub(r"\D", "", r.get("Id")) or 0) for r in rels]
    rid = f"rId{max(used, default=0) + 1}"
    etree.SubElement(rels, PR + "Relationship", Id=rid, Type=HYPERLINK, Target=url, TargetMode="External")
    return rid


def merge_runs(p) -> None:
    """Join neighbouring runs with the same properties, so a second pass starts from whole text."""
    runs = p.findall(A + "r")
    for left, right in zip(runs, runs[1:]):
        a, b = left.find(A + "rPr"), right.find(A + "rPr")
        if a is not None and b is not None and left.getnext() is right and etree.tostring(a) == etree.tostring(b):
            right.find(A + "t").text = (left.find(A + "t").text or "") + (right.find(A + "t").text or "")
            p.remove(left)


def apply(p, spans, rels) -> None:
    """Split the paragraph's runs at the spans and put the link on each piece inside one."""
    at = 0
    for run in list(p.findall(A + "r")):
        text = run.find(A + "t").text or ""
        cuts = {0, len(text)}
        for a, b, _ in spans:
            cuts |= {min(max(a - at, 0), len(text)), min(max(b - at, 0), len(text))}
        cuts = sorted(cuts)
        place = run
        pieces = []
        for i, (x, y) in enumerate(zip(cuts, cuts[1:])):
            piece = copy.deepcopy(run)
            piece.find(A + "t").text = text[x:y]
            pieces.append((piece, x, y))
        for piece, x, y in pieces:
            place.addnext(piece)
            place = piece
            url = next((u for a, b, u in spans if a <= at + x and at + y <= b), None)
            if url:
                props = piece.find(A + "rPr")
                if props is None:
                    props = etree.Element(A + "rPr")
                    piece.insert(0, props)
                link = etree.Element(A + "hlinkClick")
                link.set(R + "id", relate(rels, url))
                tail = props.find(A + "extLst")
                if tail is not None:
                    tail.addprevious(link)
                else:
                    props.append(link)
        p.remove(run)
        at += len(text)


def plain_parts(text: str, spans) -> list[str]:
    """The wording between the links, for the report."""
    chunks, at = [], 0
    for a, b, _ in sorted(spans) + [(len(text), len(text), "")]:
        chunks.append(text[at:a])
        at = b
    parts = []
    for chunk in chunks:
        parts += [x.strip(" .,:;()—·") for x in re.split(r"[;·]|, |\. |\(|\)|—", chunk)]
    return [x for x in parts if re.search(r"[A-Za-z]{3}", x)]


def title_of(slide) -> str:
    for sp in slide.iter(P + "sp"):
        ph = sp.find(f"{P}nvSpPr/{P}nvPr/{P}ph")
        if ph is not None and ph.get("type") in ("title", "ctrTitle"):
            return "".join(t.text or "" for t in sp.iter(A + "t"))
    return ""


def link_deck(deck: Path) -> tuple[int, list]:
    pages, labels = Pages(), load_labels()
    book = deck_book(deck)
    count, plain, entries = 0, [], []
    new: dict[str, bytes] = {}
    with zipfile.ZipFile(deck) as z:
        for n, name in enumerate(slide_order(z), 1):
            slide = etree.fromstring(z.read(name))
            rels_name = name.replace("slides/", "slides/_rels/") + ".rels"
            rels = etree.fromstring(z.read(rels_name))
            clear_links(slide, rels)
            links = []
            for p in paragraphs(slide):
                merge_runs(p)
                text = "".join(t.text or "" for t in p.iter(A + "t"))
                spans = resolve(text, book, pages, labels)
                apply(p, spans, rels)
                count += len(spans)
                links += [{"text": text[a:b], "url": u} for a, b, u in spans]
                plain += [(n, x) for x in plain_parts(text, spans)]
            if links:
                entries.append({"slide": n, "title": title_of(slide), "links": links})
            new[name] = etree.tostring(slide, xml_declaration=True, encoding="UTF-8", standalone=True)
            new[rels_name] = etree.tostring(rels, xml_declaration=True, encoding="UTF-8", standalone=True)
        with tempfile.NamedTemporaryFile(dir=deck.parent, suffix=".pptx", delete=False) as tmp:
            out = Path(tmp.name)
        with zipfile.ZipFile(out, "w") as w:
            for info in z.infolist():
                w.writestr(info, new.get(info.filename, z.read(info.filename)), compress_type=info.compress_type)
    shutil.move(out, deck)
    if deck.stem.endswith("_Narrated"):
        side = deck.with_name(f"{deck.stem}_sources.json")
        side.write_text(json.dumps(entries, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    return count, plain


def main() -> int:
    parser = argparse.ArgumentParser(description="Turn the source references on a built deck's slides into links.")
    parser.add_argument("decks", nargs="+", type=Path)
    parser.add_argument("--report", action="store_true", help="list the wording that stayed plain")
    args = parser.parse_args()
    for deck in args.decks:
        count, plain = link_deck(deck.resolve())
        print(f"{deck.name}: {count} links")
        if args.report:
            for slide, text in plain:
                print(f"  plain, slide {slide}: {text}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
