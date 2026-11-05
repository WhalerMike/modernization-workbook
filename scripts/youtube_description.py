#!/usr/bin/env python3
"""Write a video's YouTube description, with its chapters and its sources.

The timestamps come from data/video-chapters.json, and YouTube turns them into the chapter
marks on the time bar: it wants the first at 0:00, at least three, in order, each at least
ten seconds long. This script refuses a video that breaks those rules.

The links come from <Base>_Narrated_sources.json, which presentations/_build/link_sources.py
writes. YouTube makes links clickable in a description but not in captions or the transcript,
and a description holds 5,000 characters, so it goes in this order until it's full: the
chapters, the book chapters, then the sources, by their Source Register rows. The Watch page always has every
source, slide by slide, and the description links to it first.

    python scripts/youtube_description.py Start_Here_Narrated B00_Orientation_Narrated

Each one is written to <deck folder>/<Base>_YouTube.txt. Standard library only.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://whalermike.github.io/modernization-workbook/"
REGISTER = "docs/reference/source-register.html"
LIMIT = 5000
INTRO = ("A narrated briefing from the Federal Modernization Workbook, a free public reference for federal "
         "IT modernization. It isn't an official government publication.")


def stamp(seconds: int) -> str:
    h, m, s = seconds // 3600, seconds // 60 % 60, seconds % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def check_chapters(vid: str, chapters: list) -> None:
    if len(chapters) < 3 or chapters[0][0] != 0:
        raise SystemExit(f"youtube description: {vid}: chapters need at least three, starting at 0:00")
    for (a, _), (b, title) in zip(chapters, chapters[1:]):
        if b - a < 10:
            raise SystemExit(f"youtube description: {vid}: the chapter before {title!r} is under ten seconds")


def book_title(url: str) -> str:
    """'Book 00, Chapter 01: Why Modernize, and Why Now' for a book page's URL."""
    page = ROOT / url[len(SITE):].replace(".html", ".md")
    m = re.search(r'^title:\s*"?(.*?)"?\s*$', page.read_text(encoding="utf-8"), re.M)
    title = m.group(1) if m else page.stem
    book = re.search(r"/b(\d\d)-", url)
    return f"Book {book.group(1)}: {title}" if book and not title.startswith("Book") else title


def row_names() -> dict[str, str]:
    """Each Source Register row's fullest short name, by id: 'CISA BOD 26-02' for bod-26-02."""
    rows = json.loads((ROOT / "data" / "source-register.json").read_text(encoding="utf-8"))["sources"]
    return {r["id"]: max(r.get("labels") or [r["title"]], key=len) for r in rows}


def link_lists(sources: list[dict]) -> tuple[list[str], list[str]]:
    """(book chapter lines, original source lines), each page once, in slide order."""
    names = row_names()
    books: dict[str, str] = {}
    others: dict[str, str] = {}
    for slide in sources:
        for link in slide["links"]:
            url = link["url"]
            if "/docs/books/" in url:
                base = url.split("#")[0]
                books.setdefault(base, book_title(base) if base.endswith(".html") else link["text"])
            elif REGISTER in url:
                # A link on a bare number ("26-02") means nothing out of its sentence: name the row.
                row = url.rsplit("#", 1)[-1]
                text = link["text"] if re.match(r"\D{3}", link["text"]) else names.get(row, row)
                others.setdefault(url, text)
    return ([f"{t}: {u}" for u, t in books.items()], [f"{t}: {u}" for u, t in others.items()])


def build(vid: str, title: str, chapters: list, sources: list[dict]) -> tuple[str, int]:
    """The description, and how many source lines didn't fit."""
    check_chapters(vid, chapters)
    head = [title, "", INTRO, "",
            "Every source, slide by slide, with links:",
            f"{SITE}docs/presentations/watch.html?v={vid}#sources", "",
            "Chapters"] + [f"{stamp(t)} {name}" for t, name in chapters]
    text = "\n".join(head)
    books, others = link_lists(sources)
    left = 0
    for heading, lines in (("From the workbook", books), ("Sources, each with its link to the original", others)):
        if not lines:
            continue
        block = f"\n\n{heading}"
        for line in lines:
            if len(text) + len(block) + len(line) + 1 > LIMIT:
                left += 1
                continue
            block += "\n" + line
        if block != f"\n\n{heading}":
            text += block
    if len(text) > LIMIT or "<" in text or ">" in text:
        raise SystemExit(f"youtube description: {vid}: over the limit or holds < or >")
    return text + "\n", left


def main() -> int:
    parser = argparse.ArgumentParser(description="Write a video's YouTube description.")
    parser.add_argument("videos", nargs="+", help="video ids, such as Start_Here_Narrated")
    args = parser.parse_args()
    chapters = json.loads((ROOT / "data" / "video-chapters.json").read_text(encoding="utf-8"))
    manifest = {v["id"]: v for v in json.loads((ROOT / "docs" / "presentations" / "videos.json").read_text(encoding="utf-8"))}
    for vid in args.videos:
        if vid not in chapters:
            raise SystemExit(f"youtube description: no chapters for {vid}")
        side = next((ROOT / "presentations").glob(f"*/{vid}_sources.json"), None)
        if not side:
            raise SystemExit(f"youtube description: no {vid}_sources.json; run link_sources.py on the narrated deck")
        sources = json.loads(side.read_text(encoding="utf-8"))
        text, left = build(vid, manifest[vid]["title"], chapters[vid], sources)
        out = side.with_name(vid[: -len("_Narrated")] + "_YouTube.txt")
        out.write_text(text, encoding="utf-8", newline="\n")
        note = f"; {left} source lines left to the Watch page" if left else ""
        print(f"{out.relative_to(ROOT).as_posix()}: {len(text)} characters, {len(chapters[vid])} chapters{note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
