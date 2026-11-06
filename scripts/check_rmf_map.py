#!/usr/bin/env python3
"""Check docs/reference/rmf-map.md (stdlib only).

    python3 scripts/check_rmf_map.py --check

Checks:
  1. All 47 SP 800-37 Rev. 2 task IDs appear exactly once as a table row, each
     with a final-cell mark of Covered, Partial, Partial by design or Not covered.
     A Partial by design row must link the Book 14 appendix that holds its template.
  2. Every task marked Not covered is named in "Not covered, in one list", and
     that list cites only real task IDs.
  3. Every relative link resolves to a file and, where it carries an anchor, to
     a heading (or an explicit {#id}) in the target.
  4. last-reviewed is not older than date-modified.
  5. The tally sentence in "The steps at a glance" equals the marks in the step tables.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = Path("docs/reference/rmf-map.md")
EXPECTED = (
    [f"P-{i}" for i in range(1, 19)] + [f"C-{i}" for i in range(1, 4)]
    + [f"S-{i}" for i in range(1, 7)] + [f"I-{i}" for i in range(1, 3)]
    + [f"A-{i}" for i in range(1, 7)] + [f"R-{i}" for i in range(1, 6)]
    + [f"M-{i}" for i in range(1, 8)]
)
MARKS = {"covered": "Covered", "partial": "Partial", "partial by design": "Partial by design",
         "not covered": "Not covered"}
ROW = re.compile(r"^\|\s*([PCSIARM]-\d+)\b")
LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)\)")
LIST_HEAD = "Not covered, in one list"
TEMPLATE = "b14-compliance/appendix-"
TALLY = re.compile(r"(\d+) Covered, (\d+) Partial, (\d+) Partial by design, (\d+) Not covered")


def slugs(heading: str) -> set[str]:
    """Anchor forms for a heading: pandoc/Quarto style and GitHub style."""
    explicit = re.search(r"\{[^}]*#([\w-]+)[^}]*\}\s*$", heading)
    text = re.sub(r"\{[^}]*\}\s*$", "", heading).strip()
    text = re.sub(r"[*_`]", "", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text).lower()
    gh = re.sub(r"[^\w\- ]", "", text).replace(" ", "-")
    pandoc = re.sub(r"[^\w\-. ]", "", text).replace(" ", "-")
    pandoc = re.sub(r"^[^a-z]+", "", pandoc)
    out = {gh, pandoc, re.sub(r"-+", "-", gh)}
    if explicit:
        out.add(explicit.group(1))
    return out


def anchors(path: Path, cache: dict) -> set[str]:
    if path not in cache:
        found: set[str] = set()
        fence = False
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.lstrip().startswith(("```", "~~~")):
                fence = not fence
            elif not fence and (m := re.match(r"#{1,6}\s+(.*)", line)):
                found |= slugs(m.group(1))
            if (m := re.search(r"\{[^}]*#([\w-]+)", line)):
                found.add(m.group(1))
        cache[path] = found
    return cache[path]


def front_matter(text: str) -> dict:
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    out = {}
    for line in (m.group(1).splitlines() if m else []):
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip().strip('"')
    return out


def check(root: Path, page: Path | None = None) -> list[str]:
    page = page or root / PAGE
    text = page.read_text(encoding="utf-8")
    errors: list[str] = []

    marks: dict[str, list[str]] = {}
    lines_of: dict[str, str] = {}
    for line in text.splitlines():
        m = ROW.match(line)
        if m:
            cell = line.rstrip().rstrip("|").rsplit("|", 1)[-1].strip().replace("*", "")
            marks.setdefault(m.group(1), []).append(cell)
            lines_of[m.group(1)] = line
    # The "at a glance" table has no task rows; step tables do.
    for tid in EXPECTED:
        rows = marks.get(tid, [])
        if len(rows) != 1:
            errors.append(f"{tid}: expected exactly one row, found {len(rows)}")
        elif rows[0].lower() not in MARKS:
            errors.append(f"{tid}: mark {rows[0]!r} is not one of {sorted(MARKS.values())}")
        elif rows[0].lower() == "partial by design" and TEMPLATE not in lines_of[tid]:
            errors.append(f"{tid}: Partial by design but the row links no Book 14 appendix template")
    for tid in marks:
        if tid not in EXPECTED:
            errors.append(f"{tid}: not an SP 800-37 Rev. 2 task ID")

    counts = [sum(r[0].lower() == k for r in marks.values() if r)
              for k in ("covered", "partial", "partial by design", "not covered")]
    stated = TALLY.search(text)
    if not stated:
        errors.append("tally sentence not found in The steps at a glance")
    elif [int(g) for g in stated.groups()] != counts:
        errors.append(f"tally says {stated.group(0)!r}, the step tables give {counts}")

    section = re.search(rf"^## {LIST_HEAD}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    if not section:
        errors.append(f'section "{LIST_HEAD}" not found')
    else:
        cited = set(re.findall(r"\b([PCSIARM]-\d+)\b", section.group(1)))
        for tid in sorted(cited - set(EXPECTED)):
            errors.append(f"{LIST_HEAD}: cites unknown task {tid}")
        for tid, rows in marks.items():
            if rows and rows[0].lower() == "not covered" and tid not in cited:
                errors.append(f"{tid} is marked Not covered but missing from the list")

    cache: dict = {}
    for n, line in enumerate(text.splitlines(), 1):
        for target in LINK.findall(line):
            if re.match(r"[a-z]+:", target) or target.startswith("#"):
                if target.startswith("#") and target[1:] not in anchors(page, cache):
                    errors.append(f"line {n}: no heading for {target}")
                continue
            path, _, frag = target.partition("#")
            dest = (page.parent / path).resolve()
            if not dest.is_file():
                errors.append(f"line {n}: missing file {path}")
            elif frag and dest.suffix == ".md" and frag not in anchors(dest, cache):
                errors.append(f"line {n}: no heading #{frag} in {path}")

    fm = front_matter(text)
    mod, rev = fm.get("date-modified", ""), fm.get("last-reviewed", "")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", mod) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", rev):
        errors.append("date-modified and last-reviewed must be YYYY-MM-DD")
    elif rev < mod:
        errors.append(f"last-reviewed {rev} is older than date-modified {mod}")
    return errors


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 on any problem")
    ap.add_argument("--root", type=Path, default=ROOT)
    args = ap.parse_args(argv)
    errors = check(args.root)
    for e in errors:
        print(f"rmf-map: {e}")
    print(f"rmf-map: {len(errors)} problem(s)" if errors else "rmf-map: OK (47 tasks, links, dates)")
    return 1 if errors and args.check else 0


if __name__ == "__main__":
    sys.exit(main())
