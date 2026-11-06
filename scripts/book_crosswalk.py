#!/usr/bin/env python3
"""Check how the workbook's pages refer to its books, and map how the books connect.

    python scripts/book_crosswalk.py              # refresh the map on docs/books/index.md
    python scripts/book_crosswalk.py --check      # write the reference findings as JSON
    python scripts/book_crosswalk.py --check --out findings.json

The map counts, for every pair of books, how often the chapters of one name or
link the other. It fills the block between the two markers on the Books page.

The check reads every published page and deck for references such as "Book 05,
Chapter 3" or "Book 13 Appendix B" and reports each one that can't be right:

  no-book             a book number that doesn't exist
  no-chapter          a chapter or appendix the named book doesn't have
  link-disagrees      a link's words name one place and its target is another
  wrong-title         words quoted from a chapter that it doesn't contain, or a bracketed
                      book name that shares no word with that book's title
  bare-chapter        "Chapter N" with no book named, in a book with no Chapter N

"Book 02" in docs/compliance, or "Vol VII Book 02", is the Federal Compliance series'
own numbering, not a workbook book, so those aren't read as references. It reports
and never edits a page, and it exits 0 however many findings there are:
some findings need a person to choose which side is right.
"""
from __future__ import annotations

import argparse
import difflib
import json
import posixpath
import re
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = "docs/books"
INDEX = f"{BOOKS}/index.md"
START = "<!-- book-crosswalk:start -->"
END = "<!-- book-crosswalk:end -->"
SKIP_NAMES = ("_BRIEF", "_book-writer-brief")
TOP = 3  # books named in each cell of the map

BOOK_DIR = re.compile(r"^b(\d\d)-")
CHAPTER_FILE = re.compile(r"^(\d\d)-")
APPENDIX_FILE = re.compile(r"^appendix-([a-z])-", re.I)
H1 = re.compile(r"^#\s+(.+?)\s*(?:\{[^}]*\})?\s*$", re.M)
TITLE_FIELD = re.compile(r'^title:\s*["\']?(.+?)["\']?\s*$', re.M)
FENCE = re.compile(r"^(```|~~~).*?^\1\s*$", re.M | re.S)
LINK = re.compile(r"(?<!!)\[([^\]\n]+)\]\(([^)\s]+)[^)]*\)")

NUMS = r"\d{1,2}(?:(?:,\s*|\s+and\s+|,\s*and\s+|\s+to\s+|\s*[-–]\s*)\d{1,2}(?![\d-]))*"
BOOK_REF = re.compile(rf"\bBook\s+(\d{{1,2}})(?:(?:,|'s|’s)?\s+\(?(?:Chapters?|Ch\.)\s+({NUMS})|(?:,|'s|’s)?\s+\(?(?:Appendix|App\.)\s+([A-Z])\b)?")
CHAPTER_OF = re.compile(r"\bChapters?\s+(\d{1,2})\s+of\s+Book\s+(\d{1,2})\b")
QUOTED = re.compile(r"""^[,:]?\s*\(?(?:\*(?!\*)|_|"|“|‘)([^*_"”’\n]{4,90})[*_"”’]""")
BOOK_NAME = re.compile(r"^\s*\(([A-Z][^)\n]{3,70})\)")
BARE = re.compile(r"(?<![\w\[])Chapters?\s+(\d{1,2})\b")
OTHER_SERIES = re.compile(r"\bVol(?:ume)?\.?\s+[0IVX]+\s*,?\s*$")
OF_SERIES = re.compile(r"\s+of\s+(?:the\s+)?(?:Federal\s+)?Compliance\b")
LEAD_BOOK = re.compile(r"\bBook\s+(\d{1,2})(?:,|'s|’s)?\s*$")
HEADING = re.compile(r"^#{1,6}\s+(.+?)\s*(?:\{[^}]*\})?\s*$", re.M)


@dataclass(frozen=True)
class Finding:
    kind: str
    file: str
    line: int
    text: str
    detail: str


class Library:
    """What exists: each book's title, chapters and appendices, read from the files."""

    def __init__(self, root: Path = ROOT):
        self.root = root
        self.books: dict[int, Path] = {}
        self.titles: dict[int, str] = {}
        self.chapters: dict[int, dict[int, str]] = defaultdict(dict)
        self.appendices: dict[int, dict[str, str]] = defaultdict(dict)
        self.chapter_pages: dict[int, dict[int, Path]] = {}
        for folder in sorted((root / BOOKS).glob("b[0-9][0-9]-*")):
            number = int(BOOK_DIR.match(folder.name).group(1))
            self.books[number] = folder
            self.chapter_pages[number] = {}
            self.titles[number] = page_title(folder / "index.md")
            for page in folder.glob("*.md"):
                chapter, appendix = CHAPTER_FILE.match(page.name), APPENDIX_FILE.match(page.name)
                if chapter:
                    self.chapters[number][int(chapter.group(1))] = page_title(page)
                    self.chapter_pages[number][int(chapter.group(1))] = page
                elif appendix:
                    self.appendices[number][appendix.group(1).upper()] = page_title(page)

    def book_of(self, rel: str) -> int | None:
        parts = rel.split("/")
        if len(parts) > 3 and parts[:2] == ["docs", "books"]:
            m = BOOK_DIR.match(parts[2])
            return int(m.group(1)) if m else None
        return None

    def place_of(self, rel: str) -> tuple[int | None, str]:
        """(book, "ch3" / "appB" / "") for a repository path."""
        book = self.book_of(rel)
        name = rel.rsplit("/", 1)[-1]
        chapter, appendix = CHAPTER_FILE.match(name), APPENDIX_FILE.match(name)
        if chapter:
            return book, f"ch{int(chapter.group(1))}"
        if appendix:
            return book, f"app{appendix.group(1).upper()}"
        return book, ""


def page_title(path: Path) -> str:
    if not path.exists():
        return ""
    text = path.read_text(encoding="utf-8", errors="replace")
    head = H1.search(text)
    if head:
        return head.group(1).strip()
    field = TITLE_FIELD.search(text[:1500])
    return field.group(1).strip() if field else ""


def numbers(text: str) -> list[int]:
    """"3", "3, 4 and 7", "3 to 5", "3-5" -> the chapter numbers named."""
    found: list[int] = []
    for part in re.split(r",\s*and\s+|,\s*|\s+and\s+", text):
        span = re.fullmatch(r"(\d{1,2})(?:\s+to\s+|\s*[-–]\s*)(\d{1,2})", part.strip())
        if span:
            a, b = int(span.group(1)), int(span.group(2))
            found += list(range(a, b + 1)) if a <= b else [a, b]
        elif part.strip().isdigit():
            found.append(int(part))
    return found


def same_title(said: str, title: str) -> bool:
    a = re.sub(r"[^a-z0-9 ]", "", said.lower()).strip()
    b = re.sub(r"[^a-z0-9 ]", "", title.lower()).strip()
    if not a or not b or a in b or b in a:
        return True
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.6


def in_chapter(path: Path, said: str) -> bool:
    """Is `said` that chapter's title or a heading, or does it appear in the chapter?"""
    squash = lambda s: re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()
    text = path.read_text(encoding="utf-8", errors="replace")
    body = squash(text)
    return squash(said) in body or any(same_title(said, h) for h in HEADING.findall(text))


def shares_a_word(said: str, title: str) -> bool:
    words = lambda s: {w for w in re.findall(r"[a-z0-9]{2,}", s.lower().replace("-", " ")) if w not in {"the", "and", "of", "to", "an"}}
    return bool(words(said) & words(title))


def sentence_before(text: str, at: int) -> str:
    start = max(text.rfind(". ", 0, at), text.rfind("\n", 0, at), text.rfind("|", 0, at)) + 1
    return text[start:at]


def blank_code(text: str) -> str:
    """Blank fenced code, keeping line numbers: a sample in a code block isn't a reference."""
    return FENCE.sub(lambda m: "\n" * m.group(0).count("\n"), text)


def other_series(text: str, m: re.Match) -> bool:
    return bool(OTHER_SERIES.search(text[max(0, m.start() - 16):m.start()]) or OF_SERIES.match(text, m.end()))


def check_text(lib: Library, rel: str, raw: str, prose: bool = True) -> list[Finding]:
    """Every wrong reference in one page. `prose` is off for deck source, where bare
    chapter numbers can't be told from a deck's own numbering."""
    text = blank_code(raw)
    out: list[Finding] = []
    here = lib.book_of(rel)

    def add(kind: str, at: int, said: str, detail: str) -> None:
        out.append(Finding(kind, rel, text.count("\n", 0, at) + 1, said.strip(), detail))

    named: set[int] = set()
    for m in BOOK_REF.finditer(text):
        book = int(m.group(1))
        said = m.group(0)
        if other_series(text, m):
            continue
        if book not in lib.books:
            add("no-book", m.start(), said, f"the books run {min(lib.books):02d} to {max(lib.books):02d}")
            continue
        after = text[m.end():m.end() + 100]
        if m.group(2):
            named.update(range(m.start(), m.end()))
            chapters = numbers(m.group(2))
            for chapter in chapters:
                if chapter not in lib.chapters[book]:
                    add("no-chapter", m.start(), said, f"Book {book:02d} has chapters 1 to {max(lib.chapters[book])}; no Chapter {chapter}")
            quoted = QUOTED.match(after)
            if quoted and len(chapters) == 1 and chapters[0] in lib.chapters[book]:
                if not in_chapter(lib.chapter_pages[book][chapters[0]], quoted.group(1)):
                    title = lib.chapters[book][chapters[0]]
                    add("wrong-title", m.start(), said + after[:quoted.end()], f'not in "{title}"')
        elif m.group(3):
            letter = m.group(3)
            if letter not in lib.appendices[book]:
                letters = ", ".join(sorted(lib.appendices[book])) or "none"
                add("no-chapter", m.start(), said, f"Book {book:02d} appendices: {letters}")
        else:
            name = BOOK_NAME.match(after)
            if name and not shares_a_word(name.group(1), lib.titles[book]):
                add("wrong-title", m.start(), said + after[:name.end()], f'that book is "{lib.titles[book]}"')

    for m in CHAPTER_OF.finditer(text):
        chapter, book = int(m.group(1)), int(m.group(2))
        if book not in lib.books:
            add("no-book", m.start(), m.group(0), f"the books run {min(lib.books):02d} to {max(lib.books):02d}")
        elif chapter not in lib.chapters[book]:
            add("no-chapter", m.start(), m.group(0), f"Book {book:02d} has chapters 1 to {max(lib.chapters[book])}; no Chapter {chapter}")

    for m in LINK.finditer(text):
        words, target = m.group(1), m.group(2).split("#")[0]
        if not target.endswith(".md") or target.startswith(("http:", "https:")):
            continue
        joined = posixpath.normpath(posixpath.join(posixpath.dirname(rel), target))
        book, place = lib.place_of(joined)
        if book is None:
            continue
        said_book = re.search(r"\bBook\s+(\d{1,2})\b", words)
        if said_book and (OTHER_SERIES.search(words[:said_book.start()]) or OF_SERIES.match(words, said_book.end())):
            continue
        said_ch = re.search(r"\b(?:Chapter|Ch\.)\s+(\d{1,2})\b", words)
        said_app = re.search(r"\bAppendix\s+([A-Z])\b", words)
        if said_book is None and (said_ch or said_app):
            said_book = LEAD_BOOK.search(text[max(0, m.start() - 20):m.start()])
        if said_book and int(said_book.group(1)) != book:
            add("link-disagrees", m.start(), m.group(0), f"the words say Book {int(said_book.group(1)):02d}; the link goes to Book {book:02d}")
        elif said_ch and place != f"ch{int(said_ch.group(1))}" and place != "":
            add("link-disagrees", m.start(), m.group(0), f"the words say Chapter {int(said_ch.group(1))}; the link goes to {place}")
        elif said_app and place != f"app{said_app.group(1)}" and place != "":
            add("link-disagrees", m.start(), m.group(0), f"the words say Appendix {said_app.group(1)}; the link goes to {place}")

    if prose and here is not None:
        for m in BARE.finditer(text):
            if m.start() in named or any(i in named for i in range(m.start(), m.end())):
                continue
            chapter = int(m.group(1))
            line_start = text.rfind(chr(10), 0, m.start()) + 1
            if chapter in lib.chapters[here] or text.startswith("[^", line_start):
                continue
            lead = sentence_before(text, m.start())
            if re.search(r"\bBook\s+\d", lead) or text[m.end():m.end() + 8].startswith((" of ", " in ")):
                continue
            add("bare-chapter", m.start(), m.group(0), f"Book {here:02d} has chapters 1 to {max(lib.chapters[here])}, and no book is named")
    return out


def published_pages(root: Path = ROOT) -> list[Path]:
    pages = [p for p in (root / "docs").rglob("*.md")
             if "_verification" not in p.parts and p.relative_to(root).parts[1] != "compliance"
             and not p.name.startswith(SKIP_NAMES)]
    return sorted(pages + [p for p in root.glob("*.qmd")])


def deck_sources(root: Path = ROOT) -> list[Path]:
    decks = list((root / "presentations").glob("*/build.js")) + list((root / "presentations").glob("*/narration.json"))
    return sorted(p for p in decks if not p.parent.name.startswith("_"))


def check_all(root: Path = ROOT) -> list[Finding]:
    lib = Library(root)
    found: list[Finding] = []
    for page in published_pages(root):
        found += check_text(lib, page.relative_to(root).as_posix(), page.read_text(encoding="utf-8", errors="replace"))
    for deck in deck_sources(root):
        found += check_text(lib, deck.relative_to(root).as_posix(), deck.read_text(encoding="utf-8", errors="replace"), prose=False)
    return found


def connections(lib: Library, root: Path = ROOT) -> dict[int, Counter]:
    """Book -> how many times its chapters name or link each other book. A link
    whose words also say "Book 05" counts once."""
    counts: dict[int, Counter] = defaultdict(Counter)
    for number, folder in lib.books.items():
        for page in folder.glob("*.md"):
            if page.name.startswith(SKIP_NAMES) or page.name == "index.md":
                continue
            text = blank_code(page.read_text(encoding="utf-8", errors="replace"))
            rel = page.relative_to(root).as_posix()
            for m in BOOK_REF.finditer(text):
                other = int(m.group(1))
                if other in lib.books and other != number:
                    counts[number][other] += 1
            for m in LINK.finditer(text):
                if re.search(r"\bBook\s+\d", m.group(1)):
                    continue
                target = m.group(2).split("#")[0]
                if not target.endswith(".md") or target.startswith(("http:", "https:")):
                    continue
                other = lib.book_of(posixpath.normpath(posixpath.join(posixpath.dirname(rel), target)))
                if other is not None and other != number:
                    counts[number][other] += 1
    return counts


def short(title: str) -> str:
    return re.sub(r"^Book\s+\d+\s*\W\s*", "", title.split(":")[0]).strip()


def render_map(lib: Library, counts: dict[int, Counter]) -> str:
    incoming: dict[int, Counter] = defaultdict(Counter)
    for book, others in counts.items():
        for other, n in others.items():
            incoming[other][book] += n

    def cell(pairs: Counter) -> str:
        top = sorted(pairs.items(), key=lambda kv: (-kv[1], kv[0]))[:TOP]
        return ", ".join(f"[B{b:02d} {short(lib.titles[b])}]({lib.books[b].name}/index.md)" for b, _ in top) or "—"

    rows = ["| Book | Refers most to | Most referred to by |", "|---|---|---|"]
    for number in sorted(lib.books):
        rows.append(f"| **B{number:02d}** [{short(lib.titles[number])}]({lib.books[number].name}/index.md) "
                    f"| {cell(counts[number])} | {cell(incoming[number])} |")
    return "\n".join(rows)


def write_map(root: Path = ROOT) -> bool:
    lib = Library(root)
    path = root / INDEX
    raw = path.read_bytes().decode("utf-8")
    newline = "\r\n" if "\r\n" in raw else "\n"
    if START not in raw or END not in raw:
        print(f"book crosswalk: no markers in {INDEX}", file=sys.stderr)
        return False
    head, rest = raw.split(START, 1)
    _, tail = rest.split(END, 1)
    table = render_map(lib, connections(lib, root)).replace("\n", newline)
    new = f"{head}{START}{newline}{newline}{table}{newline}{newline}{END}{tail}"
    if new != raw:
        path.write_bytes(new.encode("utf-8"))
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="report references that can't be right")
    ap.add_argument("--out", type=Path, help="with --check, write the findings to this JSON file")
    args = ap.parse_args()
    if not args.check:
        return 0 if write_map() else 1
    found = check_all()
    for kind, n in Counter(f.kind for f in found).most_common():
        print(f"{n:6} {kind}")
    print(f"{len(found):6} in all")
    if args.out:
        args.out.write_text(json.dumps([asdict(f) for f in found], indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
