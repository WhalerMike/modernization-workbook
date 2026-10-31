#!/usr/bin/env python3
"""List the research pages that are due for review, and the pages past their lifecycle review date.

A research page (`docs/research/*.md`, not the index) records when someone
last checked it against its sources in its front matter:

    last-reviewed: 2026-10-25

A page is due when that date is more than MAX_AGE_DAYS (90) days old, or when
it has no `last-reviewed` at all. The weekly source watch lists due pages in
its issue, every week, until each is reviewed and its date updated. The
research banner (assets/research-banner.lua) says the same thing on the page
itself when the site renders.

Other published pages (`docs/**/*.md`, not under a folder or file starting
with `_`, and not the research pages) may carry a lifecycle review date:

    lifecycle_review: 2027-04-01

Such a page is listed once that date has passed, every week, until someone
checks it and moves the date. A page without the field isn't listed.

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
DOCS = ROOT / "docs"
RESEARCH = DOCS / "research"
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


def lifecycle_due(today: dt.date | None = None, docs: Path = DOCS) -> list[dict]:
    """Published pages whose `lifecycle_review` date has passed, most overdue first."""
    today = today or dt.date.today()
    out = []
    for path in sorted(docs.rglob("*.md")):
        rel = path.relative_to(docs)
        if rel.parts[0] == "research" or any(part.startswith("_") for part in rel.parts):
            continue
        meta = front_matter(path)
        raw = meta.get("lifecycle_review", "")
        try:
            review = dt.date.fromisoformat(raw[:10]) if raw else None
        except ValueError:
            review = None
        if review is None or review >= today:
            continue
        out.append(
            {
                "page": path.relative_to(docs.parent).as_posix(),
                "title": meta.get("title", path.stem),
                "lifecycle": meta.get("lifecycle", ""),
                "lifecycle_review": review.isoformat(),
                "overdue_days": (today - review).days,
            }
        )
    out.sort(key=lambda r: (-r["overdue_days"], r["page"]))
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="List research pages due for review, and pages past their lifecycle review date.")
    parser.add_argument("--json", action="store_true", help="print the due pages as JSON")
    parser.add_argument("--max-age", type=int, default=MAX_AGE_DAYS, help="days before a review is due (default 90)")
    args = parser.parse_args()
    rows = due(max_age=args.max_age)
    lifecycle = lifecycle_due()
    if args.json:
        print(json.dumps({"research": rows, "lifecycle": lifecycle}, indent=2))
        return 0
    if not rows:
        print(f"review dates: no research page is more than {args.max_age} days past its last review")
    for r in rows:
        when = f"last reviewed {r['last_reviewed']} ({r['age_days']} days)" if r["last_reviewed"] else "never reviewed"
        print(f"{r['page']}: {when}")
    if not lifecycle:
        print("review dates: no page is past its lifecycle review date")
    for r in lifecycle:
        print(f"{r['page']}: lifecycle review was due {r['lifecycle_review']} ({r['overdue_days']} days ago)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
