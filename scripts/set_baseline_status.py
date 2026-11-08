#!/usr/bin/env python3
"""Change `status: draft` to `status: baseline` at the baseline edition's cut.

Baseline means the page is complete, checked against every other book, and
approved by the workbook's editor. Changes are tracked against the baseline
edition's date. It does not claim independent peer review.

What changes:

  - Book chapters (`docs/books/b00-*` to `b19-*`) with `status: draft`.
  - Gated pages (scripts/source_watch/review_gate.py, `GATED`: guides, developer
    workbooks, training and so on) with `status: draft`, only when
    `review-status: approved` and the page's fingerprint is current. A pending
    or changed page stays draft and is listed with the reason.

What doesn't:

  - Pages with `research-status` (draft, in review, proved, published) keep
    their own four steps.
  - `status: Active` and `status: scaffold` pages are listed and left alone.
  - Pages and folders whose names start with `_` (briefs, logs) aren't published.
  - Any other `status: draft` page is listed as outside the baseline.

Only the `status:` line is edited, in place: the line ending, the rest of the
file and the page's fingerprint stay as they are (the fingerprint covers the
body, not the front matter).

    python scripts/set_baseline_status.py                 # dry run: counts, the list, what is held back
    python scripts/set_baseline_status.py --apply         # edit the front matter, then print the prose checklist
    python scripts/set_baseline_status.py --check-clean   # exit 1 if any page would still flip

Standard library only.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "source_watch"))

import review_gate as rg  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DOCS = "docs"
BOOK_DIR = re.compile(r"^docs/books/b(?:0\d|1\d)-[^/]+/")
FRONT = re.compile(rb"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", re.S)
# Only the status line: `status: draft`, with optional quotes, spaces and a trailing comment.
STATUS_LINE = re.compile(rb"^(status:[ \t]*)([\"']?)draft\2([ \t]*(?:#[^\r\n]*)?)(?=\r?$)", re.M | re.I)
STATUS_ANY = re.compile(rb"^status:[ \t]*[\"']?([^\"'#\r\n]*?)[\"']?[ \t]*(?:#[^\r\n]*)?\r?$", re.M)
RESEARCH = re.compile(rb"^research-status:", re.M)

# Prose that calls the workbook a draft. Not changed now: the site is not Baseline until the cut.
# (file, text now, wording at the cut)
PROSE = [
    ("index.qmd", "Published as drafts, from orientation to application modernization",
     "Published as the baseline edition, from orientation to application modernization"),
    ("index.qmd", "Every book is now published as a draft and revised as its sources change;",
     "Every book is now published as the baseline edition, with changes tracked against its date;"),
    ("docs/books/index.md", "*Draft.* (each guide row in the guides table)",
     "*Baseline.* (only for guides that flipped; a held guide keeps *Draft.*)"),
    ("docs/books/index.md", "Guides marked *Draft* or *In review* work like how-to guides",
     "Guides marked *Baseline*, *Draft* or *In review* work like how-to guides"),
    ("docs/books/index.md", "the Status column of the books table",
     "generated: scripts/generate_book_metrics.py writes Baseline from the book's chapters"),
]


def head(data: bytes) -> bytes | None:
    m = FRONT.match(data)
    return m.group(1) if m else None


def status_of(data: bytes) -> str:
    h = head(data)
    if h is None:
        return ""
    m = STATUS_ANY.search(h)
    return m.group(1).decode("utf-8", "replace").strip() if m else ""


def flip(data: bytes) -> bytes:
    """The page with its front-matter `status: draft` line set to `status: baseline`.
    Nothing else changes, line endings included."""
    m = FRONT.match(data)
    if not m:
        return data
    start, end = m.span(1)
    new, n = STATUS_LINE.subn(rb"\1\2baseline\2\3", data[start:end], count=1)
    return data if not n else data[:start] + new + data[end:]


def pages(root: Path) -> list[Path]:
    return sorted(p for p in (root / DOCS).rglob("*.md")
                  if not any(part.startswith("_") for part in p.relative_to(root / DOCS).parts))


def classify(root: Path = ROOT) -> dict[str, list]:
    """What the cut would do, by group."""
    gated = {p.resolve() for p in rg.gated_pages(root)}
    out = {"flip_chapters": [], "flip_gated": [], "held": [], "research": [], "other_draft": [], "active_scaffold": []}
    for path in pages(root):
        data = path.read_bytes()
        h = head(data)
        if h is None:
            continue
        status = status_of(data).lower()
        rel = path.relative_to(root).as_posix()
        if status in ("active", "scaffold"):
            out["active_scaffold"].append((rel, status))
            continue
        if status != "draft":
            continue
        if RESEARCH.search(h):
            out["research"].append(rel)
        elif path.resolve() in gated:
            text = data.decode("utf-8")
            meta = rg.fields(text)
            if meta.get("review-status") == "approved" and meta.get("reviewed-sha256") == rg.body_sha256(text):
                out["flip_gated"].append(rel)
            elif meta.get("review-status") == "approved":
                out["held"].append((rel, "changed since it was approved"))
            else:
                out["held"].append((rel, "not yet reviewed"))
        elif BOOK_DIR.match(rel):
            out["flip_chapters"].append(rel)
        else:
            out["other_draft"].append(rel)
    return out


def report(c: dict[str, list], apply: bool) -> str:
    verb = "changed" if apply else "would change"
    lines = [f"Baseline status ({'apply' if apply else 'dry run'})", "",
             f"Book chapters {verb}: {len(c['flip_chapters'])}",
             f"Gated pages {verb} (approved, fingerprint current): {len(c['flip_gated'])}",
             f"Gated pages held as draft: {len(c['held'])}",
             f"Research pages left alone (research-status): {len(c['research'])}",
             f"Other draft pages outside the baseline: {len(c['other_draft'])}",
             f"Active or scaffold pages left alone: {len(c['active_scaffold'])}", ""]
    for title, rows in (("Book chapters", c["flip_chapters"]), ("Gated pages", c["flip_gated"])):
        lines.append(f"{title} {verb}:")
        lines += [f"  {r}" for r in rows] or ["  (none)"]
    lines.append("Held back (page: reason):")
    lines += [f"  {r}: {why}" for r, why in c["held"]] or ["  (none)"]
    lines.append("Research pages left alone:")
    lines += [f"  {r}" for r in c["research"]] or ["  (none)"]
    lines.append("Other draft pages outside the baseline:")
    lines += [f"  {r}" for r in c["other_draft"]] or ["  (none)"]
    lines.append("Active or scaffold, left alone:")
    lines += [f"  {r} ({s})" for r, s in c["active_scaffold"]] or ["  (none)"]
    return "\n".join(lines)


def checklist() -> str:
    lines = ["", "Prose to reword now that the site is Baseline (edit by hand, then review):"]
    for f, old, new in PROSE:
        lines += [f"  {f}", f"    now: {old}", f"    cut: {new}"]
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--dry-run", action="store_true", help="print what would change (the default)")
    ap.add_argument("--apply", action="store_true", help="edit the status line in place")
    ap.add_argument("--check-clean", action="store_true", help="exit 1 if any page would still flip")
    ap.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = ap.parse_args(argv)
    if args.apply and args.dry_run:
        ap.error("--apply and --dry-run exclude each other")
    c = classify(args.root)
    todo = c["flip_chapters"] + c["flip_gated"]
    if args.check_clean:
        if todo:
            print(f"set_baseline_status: {len(todo)} pages would still flip; run --apply", file=sys.stderr)
        return 1 if todo else 0
    if args.apply:
        for rel in todo:
            p = args.root / rel
            p.write_bytes(flip(p.read_bytes()))
    print(report(c, args.apply))
    if args.apply:
        print(checklist())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
