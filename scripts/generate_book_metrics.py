#!/usr/bin/env python3
"""Fill the Chapters, Pages and Last updated columns of the books table.

docs/books/index.md lists every planned and published book. For each row
that links a published book (`bNN-folder/index.md`), this script counts:

- Chapters: numbered (and runbook) chapters, plus appendices (`12 + 2 app.`).
- Pages: the estimated page count of the book's Word edition: one page per
  400 words, per 7 table rows and per 0.57 diagram (1.75 pages each),
  rounded to the nearest 5. Fitted to the real Word page counts of Books
  02, 06, 10 and 11 (October 2026), each within 6%.
- Last updated: the date of the latest commit that touched the book's
  chapters or its diagrams (`git log`).

Runs as a Quarto pre-render script (see `project: pre-render` in
_quarto.yml) and can be run by hand: `python scripts/generate_book_metrics.py`.
In a shallow clone git history can't date the books, so the dates already
in the table are kept. Planned books get a dash in each column.

Standard library only, so the build needs no extra Python packages.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOKS = ROOT / "docs" / "books"
INDEX = BOOKS / "index.md"
HEADER = "| Book | Topic | Opening question | Status | Chapters | Pages | Last updated |"
RULE = "|---|---|---|---|---:|---:|---|"
WORDS_PER_PAGE = 400
ROWS_PER_PAGE = 7
PAGES_PER_DIAGRAM = 1.75
DASH = "—"

FRONT_MATTER = re.compile(r"\A---\n.*?\n---\n", re.S)
COMMENT = re.compile(r"<!--.*?-->", re.S)
LINK_TARGET = re.compile(r"\]\([^)]*\)")
WORD = re.compile(r"[A-Za-z0-9][A-Za-z0-9'’.-]*")


def git(*args: str) -> str:
    try:
        out = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        return ""
    return out.stdout.strip()


def chapter_files(folder: Path) -> list[Path]:
    """Numbered chapters, plus runbook chapters (`r01-…`, Book 06)."""
    return sorted(folder.glob("[0-9][0-9]-*.md")) + sorted(folder.glob("r[0-9][0-9]-*.md"))


def book_pages(folder: Path) -> list[Path]:
    pages = [folder / "index.md"] if (folder / "index.md").exists() else []
    pages += chapter_files(folder) + sorted(folder.glob("appendix-*.md"))
    return pages


def metrics(folder: Path, dated: bool, old_date: str) -> tuple[str, str, str]:
    chapters = len(chapter_files(folder))
    appendices = len(list(folder.glob("appendix-*.md")))
    words = diagrams = rows = 0
    for page in book_pages(folder):
        text = page.read_text(encoding="utf-8").replace("\r\n", "\n")
        text = COMMENT.sub("", FRONT_MATTER.sub("", text))
        diagrams += text.count("![")
        rows += sum(1 for row in text.split("\n") if row.startswith("|"))
        words += len(WORD.findall(LINK_TARGET.sub("]", text)))
    estimate = words / WORDS_PER_PAGE + rows / ROWS_PER_PAGE + diagrams * PAGES_PER_DIAGRAM
    pages = max(5, int(round(estimate / 5.0)) * 5)
    count = f"{chapters} + {appendices} app." if appendices else str(chapters)
    date = old_date
    if dated:
        rel = folder.relative_to(ROOT).as_posix()
        diagrams_dir = f"docs/images/diagrams/{folder.name}"
        date = git("log", "-1", "--format=%cs", "--", rel, diagrams_dir) or old_date or DASH
    return count, f"{pages:,}", date


def main() -> int:
    lines = INDEX.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n")
    dated = git("rev-parse", "--is-shallow-repository") == "false"
    out, changed = [], False
    for i, line in enumerate(lines):
        if line.startswith("| Book | Topic |"):
            out.append(HEADER)
            continue
        if line.startswith("|---") and i and lines[i - 1].startswith("| Book | Topic |"):
            out.append(RULE)
            continue
        if not re.match(r"\|\s*(\*\*)?B\d\d", line):
            out.append(line)
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        base, old_date = cells[:4], cells[6] if len(cells) > 6 else ""
        link = re.search(r"\]\((b\d\d-[^/)]+)/index\.md\)", base[1])
        if link and (BOOKS / link.group(1)).is_dir():
            extra = metrics(BOOKS / link.group(1), dated, old_date if old_date != DASH else "")
        else:
            extra = (DASH, DASH, DASH)
        out.append("| " + " | ".join(base + list(extra)) + " |")
    text = "\n".join(out)
    if text != "\n".join(lines):
        changed = True
        INDEX.write_text(text, encoding="utf-8", newline="\n")
    print(f"book metrics: {'updated' if changed else 'unchanged'} {INDEX.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
