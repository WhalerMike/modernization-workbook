#!/usr/bin/env python3
"""Render the New Look: the same source pages as the current site, with a new
navigation, into _site-newlook/ (published under /new-look/).

The current site's configuration, _quarto.yml, is not changed. Quarto profiles
can't express the New Look on their own: Quarto merges a profile into
_quarto.yml and concatenates every list, so a profile can't replace the navbar
or the sidebars. This script builds the New Look's configuration instead:

1. Read _quarto.yml and newlook/_quarto-newlook.yml.
2. Replace the navbar with one generated from the folders (Browse, Learning
   paths, Books, Guides, Workbooks, Watch, Reference), so new books, guides,
   learning paths and workbooks appear in it by themselves.
3. Keep the current sidebars, and add each book's Word edition to its section.
4. Append the overlay's render list, pre- and post-render scripts, resources,
   CSS and includes; drop the Word (docx) format.
5. Write that configuration over _quarto.yml, run `quarto render`, and put
   _quarto.yml back, even when the render fails or is interrupted.

    python scripts/newlook/render.py                     # every page
    python scripts/newlook/render.py docs/new-look docs/training/labs.md
    python scripts/newlook/render.py --print-config      # the configuration only

If the script is killed before it restores _quarto.yml, `git checkout
_quarto.yml` (or the copy in _quarto.yml.classic) puts it back.
"""

from __future__ import annotations

import argparse
import copy
import os
import re
import shutil
import signal
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
BASE = "_quarto.yml"
OVERLAY = "newlook/_quarto-newlook.yml"
BACKUP = "_quarto.yml.classic"
CLASSIC_URL = "https://whalermike.github.io/modernization-workbook/"
FRONT = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n", re.S)


def front(path: Path) -> dict:
    try:
        m = FRONT.match(path.read_text(encoding="utf-8"))
        meta = yaml.safe_load(m.group(1)) if m else {}
    except (OSError, yaml.YAMLError):
        meta = {}
    return meta if isinstance(meta, dict) else {}


def title(root: Path, rel: str, short: bool = True) -> str:
    t = str(front(root / rel).get("title") or Path(rel).stem)
    t = re.sub(r"\s+", " ", t).strip()
    if short:
        t = re.sub(r"^Learning path:\s*", "", t)
        t = re.sub(r":\s*An? (Example )?Implementation Guide.*$", "", t)
    return t


def rels(root: Path, pattern: str) -> list[str]:
    return sorted(p.relative_to(root).as_posix() for p in root.glob(pattern)
                  if not any(part.startswith("_") for part in p.relative_to(root).parts[:-1]))


def navbar(root: Path, base_nav: dict) -> dict:
    """The New Look navbar: by type of content, generated from the folders."""
    paths = rels(root, "docs/training/*/index.md")
    paths_menu = [{"href": "docs/training/index.md", "text": "All training"},
                  {"href": "docs/training/labs.md", "text": "Labs"}]
    paths_menu += [{"href": p, "text": title(root, p)} for p in sorted(paths, key=lambda p: title(root, p).lower())]
    paths_menu.append({"href": "docs/training/ms-automation-foundations.md", "text": "Microsoft Automation"})

    books = [{"href": "docs/books/index.md", "text": "All books"}]
    books += [{"href": p, "text": title(root, p, short=False)} for p in rels(root, "docs/books/b[0-9][0-9]-*/index.md")]

    impl, other = [], []
    for p in rels(root, "docs/books/guides/*.md"):
        meta = front(root / p)
        is_impl = str(meta.get("research-type") or "").lower() == "implementation guide" or Path(p).stem.endswith(("-implementation", "-kit"))
        (impl if is_impl else other).append({"href": p, "text": title(root, p)})
    guides = sorted(impl, key=lambda x: x["text"].lower())
    guides.append({"text": "---"})
    guides += sorted(other, key=lambda x: x["text"].lower())
    guides += [{"text": "---"}, {"href": "docs/books/explainers/index.md", "text": "Explainers"}]

    workbooks = [{"href": "docs/project-plans/developer-workbooks/index.md", "text": "All developer workbooks"}]
    workbooks += [{"href": p, "text": title(root, p)} for p in rels(root, "docs/project-plans/developer-workbooks/*/index.md")]
    workbooks.append({"href": "docs/books/b19-developer-workbook/index.md", "text": "Book 19 — Building the Attribute-Driven Migration"})
    workbooks += [{"text": "---"}, {"href": "docs/project-plans/index.md", "text": "Project plans"}]

    reference = []
    for item in base_nav.get("left", []):
        if item.get("text") in ("Reference", "About") and item.get("menu"):
            if reference:
                reference.append({"text": "---"})
            reference += copy.deepcopy(item["menu"])
    reference += [{"text": "---"},
                  {"href": "docs/new-look/gcc-availability.md", "text": "GCC availability"},
                  {"href": "docs/evaluations/index.md", "text": "Evaluations"},
                  {"href": "docs/downloads.md", "text": "Downloads"},
                  {"href": "workbook-map.qmd", "text": "Workbook Map"}]

    right = [{"href": CLASSIC_URL, "text": "Current site"}]
    right += [copy.deepcopy(i) for i in base_nav.get("right", [])]
    return {
        # Short: the New Look's navbar has more items than the current site's.
        "title": "Workbook",
        "background": base_nav.get("background", "dark"),
        "collapse-below": base_nav.get("collapse-below", "lg"),
        "left": [
            {"href": "docs/new-look/index.md", "text": "Home"},
            {"href": "docs/new-look/browse.md", "text": "Browse"},
            {"href": "docs/new-look/plans/index.md", "text": "Plans"},
            {"text": "Learning paths", "menu": paths_menu},
            {"text": "Books", "menu": books},
            {"text": "Guides", "menu": guides},
            {"text": "Workbooks", "menu": workbooks},
            {"text": "Watch", "menu": [{"href": "docs/presentations/watch.md", "text": "Videos"},
                                       {"href": "docs/presentations/index.md", "text": "Presentations"},
                                       {"href": "docs/start-here.md", "text": "Start here"}]},
            {"text": "Reference", "menu": reference},
            {"href": "docs/new-look/search.md", "text": "Search"},
        ],
        "right": right,
    }


def word_editions(root: Path) -> dict[str, str]:
    """Book folder -> its Word edition's file name (scripts/bundles.yml)."""
    cfg = yaml.safe_load((root / "scripts/bundles.yml").read_text(encoding="utf-8")) or {}
    out = {}
    for b in cfg.get("bundles") or []:
        r = str(b.get("root") or "")
        if re.fullmatch(r"docs/books/b\d\d-[^/]+", r):
            out.setdefault(r, b["output"])
    return out


def sidebars(root: Path, base: list) -> list:
    """The current sidebars, with each book's Word edition at the end of its section."""
    bars = copy.deepcopy(base)
    editions = word_editions(root)

    def walk(items: list) -> None:
        for it in items:
            if not isinstance(it, dict):
                continue
            href = str(it.get("href") or "")
            folder = href.rsplit("/", 1)[0]
            if it.get("section") and folder in editions and isinstance(it.get("contents"), list):
                it["contents"].append({"href": CLASSIC_URL + "downloads/" + editions[folder],
                                       "text": "Word edition (.docx)"})
            if isinstance(it.get("contents"), list):
                walk(it["contents"])

    for bar in bars:
        walk(bar.get("contents") or [])
    return bars


def compose(root: Path = ROOT) -> dict:
    base = yaml.safe_load((root / BASE).read_text(encoding="utf-8"))
    over = yaml.safe_load((root / OVERLAY).read_text(encoding="utf-8")) or {}
    cfg = copy.deepcopy(base)

    proj, oproj = cfg["project"], over.get("project", {})
    exclude = set(oproj.get("render-exclude") or [])
    proj["output-dir"] = oproj.get("output-dir", "_site-newlook")
    proj["render"] = [r for r in proj.get("render", []) if r not in exclude] + list(oproj.get("render") or [])
    for key in ("pre-render", "post-render", "resources"):
        have = proj.get(key) or []
        have = [have] if isinstance(have, str) else list(have)
        proj[key] = have + [x for x in (oproj.get(key) or []) if x not in have]

    web, oweb = cfg["website"], over.get("website", {})
    for k, v in oweb.items():
        if k not in ("navbar", "sidebar"):
            web[k] = v
    web["navbar"] = navbar(root, base["website"].get("navbar", {}))
    web["sidebar"] = sidebars(root, base["website"].get("sidebar", [])) + list(oweb.get("sidebar") or [])

    html = cfg["format"]["html"]
    ohtml = over.get("format", {}).get("html", {})
    for k, v in ohtml.items():
        if isinstance(v, list):
            have = html.get(k) or []
            html[k] = ([have] if isinstance(have, str) else list(have)) + v
        else:
            html[k] = v
    cfg["format"] = {"html": html}
    return cfg


def render(targets: list[str], root: Path = ROOT) -> int:
    base, backup = root / BASE, root / BACKUP
    if backup.exists():
        print(f"{BACKUP} exists: a New Look render was interrupted. Restore _quarto.yml from it "
              f"(or git checkout _quarto.yml), delete it, and run again.", file=sys.stderr)
        return 2
    cfg = compose(root)
    shutil.copy2(base, backup)

    def restore(*_: object) -> None:
        if backup.exists():
            shutil.copy2(backup, base)
            backup.unlink()

    old = {s: signal.getsignal(s) for s in (signal.SIGINT, signal.SIGTERM)}
    for s in old:
        signal.signal(s, lambda *a: (restore(), sys.exit(130)))
    try:
        header = "# GENERATED by scripts/newlook/render.py for the New Look render; the original is in _quarto.yml.classic.\n"
        base.write_text(header + yaml.safe_dump(cfg, sort_keys=False, allow_unicode=True, width=200), encoding="utf-8")
        # `quarto render` takes one input, so each page or folder is its own call.
        status = 0
        for target in targets or [None]:
            cmd = ["quarto", "render", *([target] if target else []), "--to", "html"]
            print("+ " + " ".join(cmd), flush=True)
            status = subprocess.call(cmd, cwd=root, shell=(os.name == "nt")) or status
        return status
    finally:
        restore()
        for s, h in old.items():
            signal.signal(s, h)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    ap.add_argument("targets", nargs="*", help="pages or folders to render (default: every page)")
    ap.add_argument("--print-config", action="store_true", help="print the New Look configuration and exit")
    args = ap.parse_args(argv)
    if args.print_config:
        sys.stdout.write(yaml.safe_dump(compose(), sort_keys=False, allow_unicode=True, width=200))
        return 0
    return render(args.targets)


if __name__ == "__main__":
    sys.exit(main())
