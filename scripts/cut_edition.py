#!/usr/bin/env python3
"""Cut an edition of the workbook: tag it, publish its Release, record it.

An edition is a git tag `edition-YYYY.MM` (a second cut in the same month is
`edition-YYYY.MM.N`) on a commit of main, and a GitHub Release on that tag
holding the edition's built files. This script:

  1. drafts the edition's entry for data/editions.yml: for each book, guide
     and developer workbook, the subjects of the pull requests merged to main
     since the previous edition that touched it (its folder, its diagrams, its
     decks); the first edition gets one line per unit instead;
  2. creates the Release (and with it the tag) on origin/main, not marked as
     the repository's latest release, so the kit releases keep that label;
  3. uploads the files named with --asset (globs are fine) and, with --decks,
     every deck and narration-audio zip (scripts/deck_assets.py pack), then
     checks the Release holds them byte for byte and points every deck link
     at the new edition (deck_assets.py verify and links);
  4. writes the entry into data/editions.yml, the Release's file list into
     data/edition-assets/<id>.json, and regenerates the revision histories
     and the Archive page (scripts/generate_revisions.py).

Publishing the Release starts the "Edition files" workflow
(.github/workflows/edition.yml), which builds the Word editions and kit zips
from the tagged commit and attaches them. When it finishes, run
--refresh-assets to record them, then commit data/ and the regenerated pages
on a branch and open a pull request.

    python scripts/cut_edition.py edition-2026.10 --summary "..." --dry-run
    python scripts/cut_edition.py edition-2026.10 --summary "..." --decks
    python scripts/cut_edition.py --refresh-assets edition-2026.10

Needs git, the GitHub CLI (`gh`, signed in with rights to publish releases),
Python 3.10+ and PyYAML. Never deletes or replaces a release asset: an upload
whose name is already on the Release fails.
"""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import deck_assets as da  # noqa: E402
import generate_revisions as gr  # noqa: E402

ROOT = gr.ROOT
REPO = gr.REPO
UPLOAD_BATCH = 40       # files per `gh release upload` call
MARKER = "# (scripts/cut_edition.py adds each new edition at the end of the list above.)"


def run(*cmd: str, capture: bool = True) -> str:
    out = subprocess.run(list(cmd), cwd=ROOT, check=True, text=True, encoding="utf-8",
                         capture_output=capture)
    return (out.stdout or "").strip() if capture else ""


def git(*args: str) -> str:
    return run("git", *args)


def quote(text: str) -> str:
    """A YAML double-quoted scalar (JSON strings are valid YAML)."""
    return json.dumps(text, ensure_ascii=False)


def draft_units(previous: str | None, commit: str, units: dict[str, gr.Unit]) -> dict[str, list[str]]:
    span = f"{previous}..{commit}" if previous else commit
    drafted = {}
    for uid, unit in units.items():
        subjects = git("log", "--first-parent", "--format=%s", span, "--", *unit.paths).splitlines()
        subjects = list(dict.fromkeys(s.strip() for s in subjects if s.strip()))
        if not subjects:
            continue
        if previous is None:
            drafted[uid] = [f"First edition ({len(subjects)} merged changes since the {unit.kind} began)"]
        else:
            drafted[uid] = list(reversed(subjects))        # oldest first
    return drafted


def entry_text(eid: str, date: dt.date, commit: str, summary: str, drafted: dict[str, list[str]]) -> str:
    lines = [f"  - id: {eid}", f"    date: {date.isoformat()}", f"    commit: {commit}",
             f"    summary: {quote(summary)}"]
    if drafted:
        lines.append("    units:")
        for uid, changes in drafted.items():
            lines += [f"      {uid}:", "        changes:"] + [f"          - {quote(c)}" for c in changes]
    return "\n".join(lines) + "\n"


def record(entry: str) -> None:
    text = gr.RECORD.read_bytes().decode("utf-8")
    if "editions: []\n" in text:
        text = text.replace("editions: []\n", "editions:\n" + entry, 1)
    elif MARKER in text:
        text = text.replace(MARKER, entry + MARKER, 1)
    else:
        raise SystemExit(f"cut_edition: can't find where to add the edition in {gr.RECORD.name}: "
                         f"keep the line {MARKER!r} after the last edition")
    gr.RECORD.write_bytes(text.encode("utf-8"))


def refresh_assets(eid: str) -> list[dict]:
    view = json.loads(run("gh", "release", "view", eid, "--repo", REPO, "--json", "assets"))
    assets = sorted(({"name": a["name"], "size": a["size"]} for a in view["assets"]), key=lambda a: a["name"].lower())
    gr.ASSETS.mkdir(parents=True, exist_ok=True)
    (gr.ASSETS / f"{eid}.json").write_bytes((json.dumps(assets, indent=1) + "\n").encode("utf-8"))
    print(f"cut_edition: {len(assets)} files recorded in data/edition-assets/{eid}.json")
    return assets


def expand(patterns: list[str]) -> list[Path]:
    files: list[Path] = []
    for pattern in patterns:
        matches = sorted(Path(p) for p in glob.glob(pattern, recursive=True))
        if not matches:
            raise SystemExit(f"cut_edition: --asset {pattern!r} matches no file")
        files += [m for m in matches if m.is_file()]
    names = [f.name for f in files]
    dupes = sorted({n for n in names if names.count(n) > 1})
    if dupes:
        raise SystemExit("cut_edition: two assets would share a name on the Release: " + ", ".join(dupes))
    too_big = [f.name for f in files if f.stat().st_size >= 2 * 1024 ** 3]
    if too_big:
        raise SystemExit("cut_edition: a release asset must be under 2 GiB: " + ", ".join(too_big))
    if len(files) > 900:
        raise SystemExit(f"cut_edition: {len(files)} assets; a Release holds at most 1,000, and the "
                         "edition workflow adds the Word editions: zip some of them")
    return files


def notes(eid: str, summary: str, drafted: dict[str, list[str]]) -> str:
    label = gr.edition_label(eid)
    site = "https://whalermike.github.io/modernization-workbook"
    lines = [summary, "",
             f"This Release keeps the files of edition {label} of the Federal Modernization Workbook: the Word "
             "editions of the books, the presentation decks, the narration audio and the videos, as built "
             f"from the tagged source. The site shows the current workbook; the [Archive]({site}/docs/about/archive.html) "
             "lists every edition and its files.", ""]
    if drafted:
        lines += [f"Changed in this edition: {len(drafted)} books, guides and developer workbooks "
                  "(see each one's version and revision history)."]
    lines += ["", "Not an official publication of any agency."]
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("edition", nargs="?", help="edition-YYYY.MM or edition-YYYY.MM.N")
    ap.add_argument("--summary", help="one or two sentences on what this edition is")
    ap.add_argument("--asset", action="append", default=[], help="a file or glob to attach (repeatable)")
    ap.add_argument("--decks", action="store_true",
                    help="attach every deck and narration-audio zip (fetch them first: deck_assets.py fetch --all)")
    ap.add_argument("--date", help="the edition's date (default: today)")
    ap.add_argument("--dry-run", action="store_true", help="print the entry and the plan; change nothing")
    ap.add_argument("--refresh-assets", metavar="EDITION", help="record an existing Release's file list and regenerate")
    args = ap.parse_args(argv)

    if args.refresh_assets:
        refresh_assets(args.refresh_assets)
        return gr.main([])

    eid = args.edition or ap.error("name the edition, for example edition-2026.10")
    if not gr.EDITION_ID.fullmatch(eid):
        ap.error(f"{eid}: an edition is edition-YYYY.MM or edition-YYYY.MM.N")
    if not args.summary:
        ap.error("--summary is required")
    units = gr.units()
    editions, _ = gr.load(units)
    if any(ed["id"] == eid for ed in editions):
        raise SystemExit(f"cut_edition: {eid} is already in data/editions.yml")
    git("fetch", "--quiet", "--tags", "origin", "main")
    if git("tag", "-l", eid) or git("ls-remote", "--tags", "origin", f"refs/tags/{eid}"):
        raise SystemExit(f"cut_edition: the tag {eid} already exists")
    commit = git("rev-parse", "origin/main")
    previous = editions[-1]["id"] if editions else None
    date = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    if editions and date < editions[-1]["date"]:
        raise SystemExit(f"cut_edition: {date} is before {previous}")
    drafted = draft_units(previous, commit, units)
    files = expand(args.asset)
    staging = ROOT / "_edition-decks"
    if args.decks and args.dry_run:
        print(f"cut_edition: --decks would attach {len(da.local_decks())} decks and {len(da.local_audio())} audio zips")
    elif args.decks:
        if staging.exists():
            shutil.rmtree(staging)
        files += da.pack(staging)
        expand([str(f) for f in files])          # the same name and count guards over the lot
    entry = entry_text(eid, date, commit, args.summary, drafted)

    print(f"cut_edition: {eid} on origin/main {commit[:12]}, since {previous or 'the start'}: "
          f"{len(drafted)} of {len(units)} books, guides and workbooks changed; {len(files)} files to attach "
          f"({gr.size(sum(f.stat().st_size for f in files))})")
    if args.dry_run:
        print("\n" + entry)
        return 0

    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as fh:
        fh.write(notes(eid, args.summary, drafted))
    run("gh", "release", "create", eid, "--repo", REPO, "--target", commit, "--latest=false",
        "--title", f"Federal Modernization Workbook, edition {gr.edition_label(eid)}", "--notes-file", fh.name,
        capture=False)
    Path(fh.name).unlink()
    for i in range(0, len(files), UPLOAD_BATCH):
        batch = files[i : i + UPLOAD_BATCH]
        run("gh", "release", "upload", eid, "--repo", REPO, *[str(f) for f in batch], capture=False)
        print(f"cut_edition: uploaded {i + len(batch)} of {len(files)}")
    record(entry)
    refresh_assets(eid)
    if args.decks:
        da.verify(eid)
        da.links(check=False)
        shutil.rmtree(staging)
    code = gr.main([])
    print(f"cut_edition: done. Edit the change lines for {eid} in data/editions.yml if you like, wait for the "
          f"'Edition files' workflow to attach the Word editions, run `python scripts/cut_edition.py "
          f"--refresh-assets {eid}`, and open a pull request with data/ and the regenerated pages.")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
