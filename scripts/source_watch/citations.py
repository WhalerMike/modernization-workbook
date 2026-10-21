#!/usr/bin/env python3
"""List every source URL the workbook books cite, and where each is cited.

A citation is a URL in a footnote definition (a line starting `[^key]:`) in
a book chapter, `docs/books/bNN-*/*.md`. Files and folders whose names start
with `_` (briefs, verification notes) are skipped. URLs inside inline code
(`https://graph.microsoft.com`) are literals the chapter quotes, not sources,
so they are skipped too.

    python scripts/source_watch/citations.py            # counts
    python scripts/source_watch/citations.py --json     # url -> citations

Each citation is {book, chapter, footnote, title}: the book code (`B02`),
the chapter file relative to the repository (`docs/books/b02-identity/01-....md`),
the footnote key (`c01-m2209`) and the source's title as the footnote gives
it (its first *italic* or "quoted" span; empty if it has neither).

Standard library only, so the workflow needs no extra Python packages.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
BOOKS = ROOT / "docs" / "books"

FOOTNOTE = re.compile(r"^\[\^([^\]]+)\]:(.*)$")
INLINE_CODE = re.compile(r"`[^`]*`")
AUTOLINK = re.compile(r"<(https?://[^>\s]+)>")
LINK_TARGET = re.compile(r"\]\((https?://[^\s)]+(?:\([^\s)]*\)[^\s)]*)*)\)")
BARE = re.compile(r"https?://[^\s<>\"'`]+")
TRAILING = ".,;:*_!?"
TITLE = re.compile(r"^title:\s*[\"']?(.*?)[\"']?\s*$", re.M)
HEADING = re.compile(r"^#\s+(.+?)\s*(\{[^}]*\})?\s*$", re.M)


CITED_TITLE = re.compile(r"\*([^*]{4,})\*|[\"“]([^\"”]{4,})[\"”]")


def cited_title(text: str) -> str:
    """The source's title as the footnote gives it: the first *italic* or "quoted" span."""
    m = CITED_TITLE.search(INLINE_CODE.sub(" ", text))
    return (m.group(1) or m.group(2)).strip().rstrip(",.") if m else ""


def clean(url: str) -> str:
    url = url.rstrip(TRAILING)
    # A bare URL that swallowed the closing parenthesis of the prose around it.
    while url.endswith(")") and url.count(")") > url.count("("):
        url = url[:-1].rstrip(TRAILING)
    return url


def urls_in(text: str) -> list[str]:
    text = INLINE_CODE.sub(" ", text)
    found: list[str] = []
    for pattern in (AUTOLINK, LINK_TARGET):
        for m in pattern.finditer(text):
            found.append(clean(m.group(1)))
        text = pattern.sub(" ", text)
    found += [clean(m.group(0)) for m in BARE.finditer(text)]
    out = []
    for url in found:
        # `{id}` and similar: a URL template the text explains, not a source.
        if urlsplit(url).netloc and "{" not in url and url not in out:
            out.append(url)
    return out


def book_folders() -> list[Path]:
    return sorted(p for p in BOOKS.glob("b[0-9][0-9]-*") if p.is_dir())


def chapter_files(folder: Path) -> list[Path]:
    return sorted(p for p in folder.glob("*.md") if not p.name.startswith("_"))


def book_code(folder: Path) -> str:
    return "B" + folder.name[1:3]


def chapter_title(path: Path) -> str:
    """Front matter `title:`, then the first `# ` heading, then the file name."""
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        m = TITLE.search(text[4:end] if end > 0 else "")
        if m and m.group(1):
            return m.group(1)
    m = HEADING.search(text)
    return m.group(1) if m else path.stem


def collect() -> dict[str, list[dict[str, str]]]:
    """url -> [{book, chapter, footnote}], in book and chapter order."""
    cited: dict[str, list[dict[str, str]]] = {}
    for folder in book_folders():
        for path in chapter_files(folder):
            rel = path.relative_to(ROOT).as_posix()
            for line in path.read_text(encoding="utf-8").splitlines():
                m = FOOTNOTE.match(line)
                if not m:
                    continue
                title = cited_title(m.group(2))
                for url in urls_in(m.group(2)):
                    cited.setdefault(url, []).append(
                        {"book": book_code(folder), "chapter": rel, "footnote": m.group(1), "title": title}
                    )
    return cited


def books() -> dict[str, dict[str, str]]:
    """Book code -> {title, folder, status} from the table in docs/books/index.md
    (planned books have no folder), plus any bNN-* folder the table misses."""
    out: dict[str, dict[str, str]] = {}
    index = BOOKS / "index.md"
    text = index.read_text(encoding="utf-8") if index.exists() else ""
    for line in text.splitlines():
        m = re.match(r"\|\s*(?:\*\*)?(B\d\d)(?:\*\*)?\s*\|([^|]*)\|(?:[^|]*\|){1}([^|]*)\|", line)
        if not m:
            continue
        topic = m.group(2).strip().strip("*")
        link = re.search(r"\[([^\]]+)\]\((b\d\d-[^/)]+)/index\.md\)", topic)
        out[m.group(1)] = {
            "title": link.group(1) if link else topic,
            "folder": link.group(2) if link else "",
            "status": m.group(3).strip().strip("*"),
        }
    for folder in book_folders():
        out.setdefault(book_code(folder), {"title": folder.name, "folder": folder.name, "status": ""})
    return dict(sorted(out.items()))


def chapter_titles(cited: dict[str, list[dict[str, str]]]) -> dict[str, str]:
    files = {c["chapter"] for cs in cited.values() for c in cs}
    return {f: chapter_title(ROOT / f) for f in sorted(files)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--json", action="store_true", help="print url -> citations as JSON")
    args = parser.parse_args()
    cited = collect()
    if args.json:
        print(json.dumps(cited, indent=1))
        return 0
    hosts = Counter(urlsplit(u).netloc.lower() for u in cited)
    books = Counter(c["book"] for cs in cited.values() for c in cs)
    total = sum(len(cs) for cs in cited.values())
    print(f"citations: {len(cited):,} unique URLs, {total:,} citations")
    print("top hosts: " + ", ".join(f"{h} {n:,}" for h, n in hosts.most_common(10)))
    print("by book:   " + ", ".join(f"{b} {n:,}" for b, n in sorted(books.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
