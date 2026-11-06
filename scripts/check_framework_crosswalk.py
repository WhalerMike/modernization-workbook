#!/usr/bin/env python3
"""Check docs/reference/federal-framework-crosswalk.md for the mistakes a hand-kept page makes.

    python scripts/check_framework_crosswalk.py --check     # print findings; exit 1 if any
    python scripts/check_framework_crosswalk.py --check --page path/to/page.md --books path/to/docs/books

It checks that:
  - each source section's heading count, "## Statutes (28)", equals the rows in its table;
  - `research-book` and every "N books" in the page equal the book directories (bNN-*);
  - the matrix has one column per book, in order, and one score (0-3) in every cell;
  - the matrix has a row for every framework in the status table (STATUS_TO_MATRIX below),
    and the only other rows are the ones in EXTRA_ROWS;
  - `last-reviewed` is not older than `date-modified`;
  - the NIST RMF row equals what the RMF Map's marks give (rmf_scores), when rmf-map.md sits beside the page.

It never edits the page. It reads no scores from the books: it checks the page's own
consistency, not the scoring.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs" / "reference" / "federal-framework-crosswalk.md"
BOOKS = ROOT / "docs" / "books"

# Each status-table row (by its first words) -> the matrix row(s) that carry its scores.
STATUS_TO_MATRIX = {
    "OMB M-22-18": ["M-26-05"],
    "Federal Data Strategy": ["Evidence Act"],
    "Federal Enterprise Architecture Framework": ["Enterprise architecture"],
    "Executive Order 14028": ["EO 14028"],
    "FITARA": ["FITARA"],
    "OMB Circular A-130": ["OMB Circular A-130"],
    "Clinger-Cohen": ["Clinger-Cohen"],
    "Technology Modernization Fund": ["Technology Modernization Fund"],
    "21st Century IDEA": ["21st Century IDEA"],
    "NIST CSF 2.0 and the RMF": ["NIST CSF 2.0", "NIST RMF"],
    "Section 508": ["Section 508"],
    "Privacy Act": ["Privacy Act"],
    "Federal records": ["Federal records"],
    "Cloud Smart": ["Cloud Smart"],
    "TOGAF": ["TOGAF"],
    "Zachman": ["Zachman"],
}
# Matrix rows that are not in the status table: the frameworks the workbook relies on most.
EXTRA_ROWS = ["NIST SP 800-53", "FedRAMP", "CISA ZTMM", "HSPD-12", "OMB M-26-14", "FISMA"]
# Books that tie an RMF task to a control and an artifact: a requirements-mapping appendix, or (Books 10,
# 19) an evidence table in the chapter the map links. A judgment from reading them, so it's kept here.
RMF_TIED = {6, 8, 9, 10, 11, 12, 13, 14, 17, 19}


def rmf_scores(map_text: str, books: list[int]) -> list[int]:
    """Each book's RMF score from the map's marks, by the rule in the page's how-to-read section."""
    best = dict.fromkeys(books, 0)
    for line in map_text.splitlines():
        m = re.match(r"\|\s*([PCSIARM]-\d+)\b", line)
        if not m:
            continue
        mark = line.rstrip().rstrip("|").rsplit("|", 1)[-1].strip().replace("*", "").lower()
        for n in {int(b) for b in re.findall(r"\.\./books/b(\d\d)-", line)}:
            score = 1
            if mark == "covered":
                score = 3 if n in RMF_TIED and m.group(1) != "I-1" else 2
            if n in best:
                best[n] = max(best[n], score)
    return [best[n] for n in books]


def book_numbers(books: Path) -> list[int]:
    return sorted(int(m.group(1)) for d in books.iterdir()
                  if d.is_dir() and (m := re.match(r"b(\d\d)-", d.name)))


def front_matter(text: str) -> dict[str, str]:
    m = re.match(r"---\n(.*?)\n---", text, re.S)
    out: dict[str, str] = {}
    for line in (m.group(1).splitlines() if m else []):
        k, _, v = line.partition(":")
        if v:
            out[k.strip()] = v.strip().strip('"')
    return out


def table_rows(lines: list[str], start: int) -> list[list[str]]:
    """The body rows of the pipe table whose header is at lines[start]."""
    rows = []
    for line in lines[start + 2:]:
        if not line.startswith("|"):
            break
        rows.append([c.strip() for c in line.strip().strip("|").split("|")])
    return rows


def check(page: Path, books: Path) -> list[str]:
    text = page.read_text(encoding="utf-8")
    lines = text.splitlines()
    found: list[str] = []
    fm = front_matter(text)
    nums = book_numbers(books)
    want = list(range(nums[0], nums[-1] + 1)) if nums else []
    if nums != want:
        found.append(f"book directories are not a continuous range: {nums}")

    # research-book and the stated book count
    first, last = (f"{nums[0]:02d}", f"{nums[-1]:02d}") if nums else ("", "")
    rb = fm.get("research-book", "")
    if rb != f"Books {first}–{last}":
        found.append(f"research-book is '{rb}', the book directories are Books {first}–{last}")
    for m in re.finditer(r"\b(\d+) books\b", "\n".join(lines[:20]) + "\n" + "\n".join(
            l for l in lines if l.startswith("A federal modernization program"))):
        if int(m.group(1)) != len(nums):
            found.append(f"the page says '{m.group(0)}', there are {len(nums)} book directories")

    # heading counts
    for i, line in enumerate(lines):
        m = re.match(r"## (.+) \((\d+)\)\s*$", line)
        if not m:
            continue
        j = next((k for k in range(i + 1, min(i + 6, len(lines))) if lines[k].startswith("| Instrument")), None)
        if j is None:
            continue
        n = len(table_rows(lines, j))
        if n != int(m.group(2)):
            found.append(f"'{m.group(1)}' says {m.group(2)}, its table has {n} rows")

    # matrix
    hi = next((i for i, l in enumerate(lines) if l.startswith("| Framework | 0")), None)
    if hi is None:
        found.append("coverage matrix not found")
    else:
        cols = [c.strip() for c in lines[hi].strip().strip("|").split("|")][1:]
        got = [int(re.match(r"(\d+)", c).group(1)) if re.match(r"\d+", c) else -1 for c in cols]
        if got != want:
            found.append(f"matrix columns are Books {got}, the book directories are {want}")
        names = []
        for r in table_rows(lines, hi):
            names.append(r[0])
            cells = r[1:]
            if r[0].startswith("NIST RMF") and (page.parent / "rmf-map.md").is_file() and got == nums:
                derived = rmf_scores((page.parent / "rmf-map.md").read_text(encoding="utf-8"), nums)
                if [str(x) for x in derived] != cells:
                    found.append(f"NIST RMF row is {cells}, the RMF Map gives {derived}")
            if len(cells) != len(cols) or any(c not in {"0", "1", "2", "3"} for c in cells):
                found.append(f"matrix row '{r[0]}' has {len(cells)} cells (need {len(cols)} scores of 0-3)")
        # status table
        si = next((i for i, l in enumerate(lines) if l.startswith("| Framework | Status")), None)
        if si is None:
            found.append("status table not found")
        else:
            status = [r[0].replace("**", "") for r in table_rows(lines, si)]
            used = set()
            for s in status:
                key = next((k for k in STATUS_TO_MATRIX if s.startswith(k)), None)
                if key is None:
                    found.append(f"status row '{s}' has no matrix mapping in STATUS_TO_MATRIX")
                    continue
                for m in STATUS_TO_MATRIX[key]:
                    used.add(m)
                    if not any(n.startswith(m) for n in names):
                        found.append(f"status row '{s}' has no matrix row starting '{m}'")
            allowed = used | set(EXTRA_ROWS)
            for n in names:
                if not any(n.startswith(a) for a in allowed):
                    found.append(f"matrix row '{n}' is not in the status table or EXTRA_ROWS")

    # review dates
    try:
        rev = dt.date.fromisoformat(fm.get("last-reviewed", ""))
        mod = dt.date.fromisoformat(fm.get("date-modified", ""))
        if rev < mod:
            found.append(f"last-reviewed {rev} is older than date-modified {mod}")
    except ValueError:
        found.append("last-reviewed or date-modified is missing or not YYYY-MM-DD")
    return found


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="run the checks (the only mode)")
    ap.add_argument("--page", type=Path, default=PAGE)
    ap.add_argument("--books", type=Path, default=BOOKS)
    args = ap.parse_args(argv)
    found = check(args.page, args.books)
    for f in found:
        print(f"federal-framework-crosswalk: {f}")
    if not found:
        print("federal-framework-crosswalk: ok")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
