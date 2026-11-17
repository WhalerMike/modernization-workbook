#!/usr/bin/env python3
"""Post-render step for the New Look build (scripts/newlook/render.py).

- Writes the New Look's index.html, which forwards to its home page,
  docs/new-look/index.html (the current site's home page isn't rendered).
- Points links to files only the current site publishes at the current site.
  The deploy workflow builds the Word editions, kit zips and other downloads
  into the current site's downloads/ folder, after the render, so a page's
  relative link to them (../../downloads/x.zip) would miss under /new-look/.
  Any relative link or source to a file that isn't a page and isn't in the
  New Look's output becomes an absolute link to the current site.

Runs as a Quarto post-render script; by hand: python scripts/newlook/postrender.py [--out _site-newlook]
"""

from __future__ import annotations

import argparse
import os
import posixpath
import re
import sys
from pathlib import Path

CLASSIC_URL = "https://whalermike.github.io/modernization-workbook/"
HOME = "docs/new-look/index.html"
ATTR = re.compile(r'(\s(?:href|src)=")([^"#?:]+)((?:[?#][^"]*)?")')

INDEX = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Federal Modernization Workbook (New Look preview)</title>
<meta http-equiv="refresh" content="0; url={home}">
<link rel="canonical" href="{home}">
</head><body><p>The New Look preview's home page is <a href="{home}">here</a>.</p></body></html>
"""


def fix_links(html: str, page: str, out: Path) -> tuple[str, int]:
    """Rewrite relative links to missing non-page files; page is the file's path under out."""
    base = posixpath.dirname(page)
    n = 0

    def sub(m: re.Match) -> str:
        nonlocal n
        url = m.group(2)
        if url.startswith(("/", "data:", "mailto:")) or url.endswith((".html", "/")) or not url.strip():
            return m.group(0)
        target = posixpath.normpath(posixpath.join(base, url))
        if target.startswith("..") or (out / target).exists():
            return m.group(0)
        n += 1
        return m.group(1) + CLASSIC_URL + target + m.group(3)

    return ATTR.sub(sub, html), n


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    ap.add_argument("--out", help="the New Look's output folder (default: Quarto's, else _site-newlook)")
    args = ap.parse_args(argv)
    out = Path(args.out or os.environ.get("QUARTO_PROJECT_OUTPUT_DIR") or "_site-newlook")
    if not out.is_dir():
        print(f"newlook postrender: {out} not found", file=sys.stderr)
        return 1
    (out / "index.html").write_text(INDEX.format(home=HOME), encoding="utf-8")
    listed = os.environ.get("QUARTO_PROJECT_OUTPUT_FILES")
    files = [Path(f) for f in listed.splitlines() if f.endswith(".html")] if listed else list(out.rglob("*.html"))
    changed = links = 0
    for f in files:
        f = f if f.is_absolute() or f.exists() else out / f
        if not f.exists():
            continue
        page = f.resolve().relative_to(out.resolve()).as_posix()
        text = f.read_text(encoding="utf-8")
        new, n = fix_links(text, page, out)
        if n:
            f.write_text(new, encoding="utf-8")
            changed += 1
            links += n
    print(f"newlook postrender: index.html written; {links} link(s) in {changed} page(s) now point to the current site")
    return 0


if __name__ == "__main__":
    sys.exit(main())
