#!/usr/bin/env python3
"""List the gated pages that are waiting for the owner's review.

Some pages are published as drafts but held behind a review gate: Book 19
(`docs/books/b19-developer-workbook/`), the Attribute-Driven Migration
implementation guide that goes with it, and the developer workbooks under
Projects (`docs/project-plans/developer-workbooks/`). Each gated page records
the review in its front matter:

    review-status: approved          # or pending
    reviewed-sha256: 3f9c...         # sha256 of the page body when it was approved
    last-reviewed: 2026-11-02

A page is waiting when it isn't approved, or when its body (everything after
the front matter) no longer matches `reviewed-sha256`: any change to an
approved page sends it back for review. The weekly source watch lists waiting
pages in its issue, every week, until each is approved. Work that builds on a
page, such as its narrated chapter tour, waits for the page's approval.

    python scripts/source_watch/review_gate.py                 # waiting pages
    python scripts/source_watch/review_gate.py --json          # as JSON
    python scripts/source_watch/review_gate.py --approve docs/books/b19-developer-workbook/01-the-hr-to-entra-middleware.md

--approve records the owner's approval of the page as it is now. Run it only
after reading the page, and commit the change in a reviewed pull request.

Standard library only, so the workflow needs no extra Python packages.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# Folders (every page in them and their subfolders) and single pages.
GATED = ["docs/project-plans/developer-workbooks", "docs/books/b19-developer-workbook",
         "docs/books/guides/attribute-driven-migration-implementation.md"]

FRONT_MATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)
# The narrated-tour callout or table the tour build writes (presentations/_build/link_tours.py):
# it starts a line, after a blank line, and is followed by one blank line. A block can't
# contain another begin marker, so a deleted end marker can't hide the text up to a later block.
TOUR_BLOCK = re.compile(r"^<!-- tour:begin[^\n]*-->\n(?:(?!<!-- tour:begin).)*?^<!-- tour:end -->\n\n", re.S | re.M)
# A kit capture scripts/kit_captures.py writes in a lab: the terminal image of what a command
# printed, indented like the list item it sits in, after a blank line and followed by one. It is
# the kit's own output, refreshed when the kit changes, not reviewed prose.
CAPTURE_BLOCK = re.compile(r"^( *)<!-- capture:begin[^\n]*-->\n(?:(?!<!-- capture:begin).)*?^\1<!-- capture:end -->\n\n", re.S | re.M)
# The lab links scripts/generate_labs.py writes in an implementation guide (a "Labs for this guide"
# box, and a "Try it" box after a gate's Validate callout), in the same form: navigation generated
# from the workbook and learning path, not reviewed prose.
LABS_BLOCK = re.compile(r"^( *)<!-- labs:begin[^\n]*-->\n(?:(?!<!-- labs:begin).)*?^\1<!-- labs:end -->\n\n", re.S | re.M)
# The version and revision history section scripts/generate_revisions.py writes from
# data/editions.yml, with the blank lines around it: the page as it was without it is the
# text before plus one blank line plus the text after (see generate_revisions.place).
# As with the tour block, a block can't contain another start marker.
REVISIONS_BLOCK = re.compile(r"\n*^<!-- revisions:start[^\n]*-->\n(?:(?!<!-- revisions:start).)*?"
                             r"^<!-- revisions:end -->\n*", re.S | re.M)
FIELD = re.compile(r"^([A-Za-z][\w-]*):\s*(.*?)\s*$", re.M)
REVIEW_FIELDS = ("review-status", "reviewed-sha256", "last-reviewed")


def split(text: str) -> tuple[str, str]:
    """(front matter, body), line endings normalized to LF."""
    text = text.replace("\r\n", "\n")
    m = FRONT_MATTER.match(text)
    if not m:
        return "", text
    return m.group(1), text[m.end():]


def body_sha256(text: str) -> str:
    """sha256 of the body with trailing whitespace on each line and at the end removed,
    so an editor that trims spaces doesn't reopen a review. A generated tour block, between
    its begin and end markers, is left out: the tour build adds and updates it on approved
    pages, and every other line still counts. So are a generated kit capture, generated lab links, and the generated
    version and revision history section, which each edition rewrites."""
    _, body = split(text)
    body = TOUR_BLOCK.sub("", body)
    body = CAPTURE_BLOCK.sub("", body)
    body = LABS_BLOCK.sub("", body)
    body = REVISIONS_BLOCK.sub("\n\n", body)
    lines = [line.rstrip() for line in body.split("\n")]
    return hashlib.sha256("\n".join(lines).strip().encode("utf-8")).hexdigest()


def fields(text: str) -> dict[str, str]:
    meta, _ = split(text)
    return {k: v.strip("\"'") for k, v in FIELD.findall(meta)}


def gated_pages(root: Path = ROOT) -> list[Path]:
    pages: list[Path] = []
    for folder in GATED:
        base = root / folder
        if base.is_file():
            pages.append(base)
        elif base.is_dir():
            # Every page in the folder and its subfolders; `_` files and folders (briefs,
            # verification logs) aren't published and aren't gated.
            pages += sorted(p for p in base.rglob("*.md")
                            if not any(part.startswith("_") for part in p.relative_to(base).parts))
    return pages


def waiting(root: Path = ROOT) -> list[dict]:
    """Gated pages not approved, or changed since they were approved."""
    out = []
    for path in gated_pages(root):
        text = path.read_text(encoding="utf-8")
        meta = fields(text)
        status = meta.get("review-status", "pending") or "pending"
        stamped = meta.get("reviewed-sha256", "")
        if status == "approved" and stamped == body_sha256(text):
            continue
        if status == "approved":
            reason = f"changed since it was approved on {meta.get('last-reviewed') or 'an unrecorded date'}"
        else:
            reason = "not yet reviewed"
        out.append(
            {
                "page": path.relative_to(root).as_posix(),
                "title": meta.get("title", path.stem),
                "reason": reason,
                "last_reviewed": meta.get("last-reviewed", ""),
            }
        )
    return out


def approve(path: Path, today: dt.date | None = None) -> str:
    """Set review-status: approved, reviewed-sha256 and last-reviewed on one gated page.
    Returns the new text; the caller writes it."""
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    m = FRONT_MATTER.match(text)
    if not m:
        raise ValueError(f"{path}: no front matter")
    values = {
        "review-status": "approved",
        "reviewed-sha256": body_sha256(text),
        "last-reviewed": (today or dt.date.today()).isoformat(),
    }
    lines = [line for line in m.group(1).split("\n") if not re.match(r"^(review-status|reviewed-sha256|last-reviewed):", line)]
    lines += [f"{k}: {v}" for k, v in values.items()]
    return "---\n" + "\n".join(lines) + "\n---\n" + text[m.end():]


def main() -> int:
    parser = argparse.ArgumentParser(description="List gated pages waiting for review, or approve one.")
    parser.add_argument("--json", action="store_true", help="print the waiting pages as JSON")
    parser.add_argument("--approve", nargs="+", type=Path, metavar="PAGE", help="record approval of these pages as they are now")
    args = parser.parse_args()
    if args.approve:
        gated = {p.resolve() for p in gated_pages()}
        for page in args.approve:
            if page.resolve() not in gated:
                parser.error(f"{page} is not a gated page")
            page.write_text(approve(page), encoding="utf-8", newline="\n")
            print(f"approved {page.as_posix()}")
        return 0
    rows = waiting()
    if args.json:
        print(json.dumps(rows, indent=2))
        return 0
    if not rows:
        print("review gate: every gated page is approved and unchanged")
    for r in rows:
        print(f"{r['page']}: {r['reason']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
