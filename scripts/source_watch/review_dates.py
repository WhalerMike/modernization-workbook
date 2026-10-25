#!/usr/bin/env python3
"""List the research pages that are due for review.

A research page (`docs/research/*.md`, not the index) records when someone
last checked it against its sources in its front matter:

    last-reviewed: 2026-10-25

A page is due when that date is more than MAX_AGE_DAYS (90) days old, or when
it has no `last-reviewed` at all. The weekly source watch lists due pages in
its issue, every week, until each is reviewed and its date updated. The
research banner (assets/research-banner.lua) says the same thing on the page
itself when the site renders.

    python scripts/source_watch/review_dates.py            # due pages
    python scripts/source_watch/review_dates.py --json     # as JSON

Standard library only, so the workflow needs no extra Python packages.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESEARCH = ROOT / "docs" / "research"
MAX_AGE_DAYS = 90

FRONT_MATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)
FIELD = re.compile(r"^([A-Za-z][\w-]*):\s*(.*?)\s*$", re.M)


def front_matter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    m = FRONT_MATTER.match(text)
    if not m:
        return {}
    return {k: v.strip("\"'") for k, v in FIELD.findall(m.group(1))}


def due(today: dt.date | None = None, max_age: int = MAX_AGE_DAYS) -> list[dict]:
    """Research pages never reviewed, or last reviewed more than max_age days ago, oldest first."""
    today = today or dt.date.today()
    out = []
    for path in sorted(RESEARCH.glob("*.md")):
        if path.name == "index.md" or path.name.startswith("_"):
            continue
        meta = front_matter(path)
        if "research-status" not in meta:
            continue
        raw = meta.get("last-reviewed", "")
        try:
            reviewed = dt.date.fromisoformat(raw[:10]) if raw else None
        except ValueError:
            reviewed = None
        age = (today - reviewed).days if reviewed else None
        if age is not None and age <= max_age:
            continue
        out.append(
            {
                "page": path.relative_to(ROOT).as_posix(),
                "title": meta.get("title", path.stem),
                "status": meta.get("research-status", ""),
                "last_reviewed": reviewed.isoformat() if reviewed else "",
                "age_days": age,
            }
        )
    out.sort(key=lambda r: (r["age_days"] is not None, -(r["age_days"] or 0)))
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="List research pages due for review.")
    parser.add_argument("--json", action="store_true", help="print the due pages as JSON")
    parser.add_argument("--max-age", type=int, default=MAX_AGE_DAYS, help="days before a review is due (default 90)")
    args = parser.parse_args()
    rows = due(max_age=args.max_age)
    if args.json:
        print(json.dumps(rows, indent=2))
        return 0
    if not rows:
        print(f"review dates: no research page is more than {args.max_age} days past its last review")
    for r in rows:
        when = f"last reviewed {r['last_reviewed']} ({r['age_days']} days)" if r["last_reviewed"] else "never reviewed"
        print(f"{r['page']}: {when}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
