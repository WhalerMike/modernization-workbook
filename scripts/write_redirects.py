#!/usr/bin/env python3
"""Quarto post-render step: write redirect pages for removed or merged URLs.

Reads scripts/redirects.yml ({old.html: new.html}, both relative to the site
root) and writes a small HTML page at each old path in the output folder that
forwards to the new page (meta refresh + canonical link + JavaScript, keeping
any #fragment). A redirect whose old path is now a real page is skipped, and
a redirect whose target page was not rendered is skipped with a warning.
Non-HTML renders (for example `quarto render --to docx`) are skipped.

Also run by hand: python3 scripts/write_redirects.py [--out _site] [--check]
"""
from __future__ import annotations

import argparse
import html
import os
import posixpath
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
CONFIG = REPO / "scripts" / "redirects.yml"

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{href}">
<meta http-equiv="refresh" content="0; url={href}">
<script>window.location.replace({js} + window.location.hash);</script>
</head>
<body>
<p>This page has moved to <a href="{href}">{href}</a>.</p>
</body>
</html>
"""


def load() -> dict[str, str]:
    cfg = yaml.safe_load(CONFIG.read_text()) or {}
    return {str(k).lstrip("/"): str(v).lstrip("/") for k, v in (cfg.get("redirects") or {}).items()}


def html_render() -> bool:
    """True when the current Quarto render produced HTML output.

    QUARTO_PROJECT_OUTPUT_FILES lists the files this render wrote (one per
    line). Run by hand (no Quarto environment), assume an HTML site.
    """
    files = os.environ.get("QUARTO_PROJECT_OUTPUT_FILES")
    if files is None:
        return True
    return any(f.strip().lower().endswith(".html") for f in files.splitlines())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", help="site output folder (default: Quarto's, else _site)")
    ap.add_argument("--check", action="store_true", help="only validate the map")
    args = ap.parse_args()

    out = Path(args.out or os.environ.get("QUARTO_PROJECT_OUTPUT_DIR") or "_site")
    if not out.is_absolute():
        out = REPO / out
    redirects = load()

    # Only an HTML render produces pages to redirect to. Quarto runs this
    # hook after every render, including `quarto render --to docx`, so skip
    # unless this render actually wrote HTML output.
    if not args.check and not html_render():
        print("redirects: not an HTML render; skipped")
        return 0

    errors = 0
    for old, new in sorted(redirects.items()):
        if old == new:
            print(f"redirects: {old} redirects to itself", file=sys.stderr)
            errors += 1
            continue
        if new in redirects:
            print(f"redirects: {old} -> {new} is a chain; point it at the final page", file=sys.stderr)
            errors += 1
        if args.check:
            continue
        if not (out / new).is_file():
            # Warn, don't fail: a partial render may not include the target.
            print(f"redirects: WARNING target not rendered: {new} (from {old}); skipped", file=sys.stderr)
            continue
        dest = out / old
        if dest.is_file() and "http-equiv=\"refresh\"" not in dest.read_text(errors="replace"):
            print(f"redirects: {old} is a real page again; redirect skipped")
            continue
        rel = posixpath.relpath(new, posixpath.dirname(old) or ".")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(PAGE.format(href=html.escape(rel, quote=True), js=repr(rel)), encoding="utf-8")
    if errors:
        return 1
    print(f"redirects: {len(redirects)} redirect pages {'checked' if args.check else 'written'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
