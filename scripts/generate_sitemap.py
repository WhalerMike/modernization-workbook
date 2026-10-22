#!/usr/bin/env python3
"""Generate the whole-site page tree included by sitemap.qmd.

Runs as a Quarto pre-render script (see `project: pre-render` in
_quarto.yml), so the Site Map is rebuilt from the exact list of pages
Quarto is about to render and cannot drift from the site.

- Full render (QUARTO_PROJECT_RENDER_ALL=1): the tree is rebuilt from
  QUARTO_PROJECT_INPUT_FILES.
- Single-file render or preview: the input list is partial, so the tree
  is left alone.
- Run by hand, or by the deploy workflow before rendering:
  `python scripts/generate_sitemap.py` (uses `quarto inspect`).

The tree is git-ignored. Quarto needs it to exist before it can do
anything (it resolves includes up front), so on a fresh checkout run the
script once before the first render.

Pages are grouped into one section per top-level folder under docs/, with
subfolders nested beneath. Titles come from each page's front matter
`title:`, then its first `# ` heading, then the file name.

Standard library only, so the build needs no extra Python packages.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import quote

ROOT = Path(os.environ.get("QUARTO_PROJECT_DIR") or Path(__file__).resolve().parent.parent)
OUTPUT = ROOT / "_sitemap-tree.md"  # leading underscore: Quarto never renders it as a page
SELF = {"sitemap.qmd"}

# Project-level pages, listed first and in this order.
PROJECT_PAGES = [
    "index.qmd",
    "docs/HOW-TO-USE.md",
    "docs/PRINCIPLES.md",
    "PROJECT-CHARTER.md",
    "PROJECT-PLAN.md",
    "CONTRIBUTING.md",
]

# docs/ sections in reading order, with their headings. A folder not listed
# here follows alphabetically, headed by its title-cased name.
SECTIONS = {
    "books": "The Workbook Books",
    "research": "Research (under review)",
    "narratives": "Narratives",
    "client-server-to-hybrid-cloud": "Client-Server to Hybrid-Cloud Series",
    "projects": "Detailed Projects",
    "project-management": "Project Management",
    "program": "Education, Training and Test Plans",
    "architecture": "Architecture",
    "reference-architecture": "Reference Architecture",
    "operational-guides": "Operational Guides",
    "guides": "Guides",
    "learning": "Learning",
    "case-studies": "Case Studies",
    "sql-server-implementation": "SQL Server Implementation Companion",
    "whitepapers": "Whitepapers",
    "ssot-network-physics": "The Physics of a Single Source of Truth",
    "executive-briefs": "Executive Briefs",
    "executive-governance": "Executive Governance Series (full chapters)",
    "modernization-specs": "Modernization Specifications",
    "modernization": "Modernization",
    "libraries": "Libraries",
    "compliance": "Compliance",
    "canonical-specs": "Canonical Specifications",
    "substrate": "Substrate",
}
SECTION_ORDER = list(SECTIONS)

LANDING = ("index.md", "index.qmd", "README.md")
FRONTMATTER = re.compile(r"\A---\s*\r?\n(.*?)\r?\n---\s*(\r?\n|\Z)", re.S)
TITLE = re.compile(r"^title:\s*(.+?)\s*$", re.M)
H1 = re.compile(r"^#\s+(.+?)\s*(\{[^}]*\})?\s*$", re.M)


def input_files() -> list[str] | None:
    """Pages Quarto will render, as POSIX paths relative to the project root."""
    if os.environ.get("QUARTO_PROJECT_INPUT_FILES") is not None:
        if os.environ.get("QUARTO_PROJECT_RENDER_ALL") != "1":
            return None  # partial render: the list is not the whole site
        raw = os.environ["QUARTO_PROJECT_INPUT_FILES"].splitlines()
        return [PurePosixPath(p.replace("\\", "/")).as_posix() for p in raw if p.strip()]
    out = subprocess.run(["quarto", "inspect"], cwd=ROOT, capture_output=True,
                         text=True, check=True, encoding="utf-8").stdout
    files = json.loads(out)["files"]["input"]
    return [Path(os.path.relpath(f, ROOT)).as_posix() for f in files]


def title_of(rel: str) -> str:
    try:
        text = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
    except OSError:
        text = ""
    m = FRONTMATTER.match(text)
    if m:
        t = TITLE.search(m.group(1))
        if t:
            value = t.group(1).strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1].replace('\\"', '"')
            if value:
                return value
    h = H1.search(text[m.end():] if m else text)
    if h:
        return h.group(1).strip()
    stem = PurePosixPath(rel).stem
    return stem.replace("-", " ").replace("_", " ").strip().title() or stem


def link(rel: str, label: str | None = None) -> str:
    text = (label or title_of(rel)).replace("[", r"\[").replace("]", r"\]")
    url = re.sub(r"\.(md|qmd)$", ".html", rel)
    return f"[{text}]({quote(url)})"


def natural(s: str):
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r"(\d+)", s)]


def landing_of(folder: str, files: set[str]) -> str | None:
    for name in LANDING:
        if f"{folder}/{name}" in files:
            return f"{folder}/{name}"
    return None


def render_folder(folder: str, files: set[str], depth: int, lines: list[str]) -> None:
    """Pages directly in `folder`, then each subfolder nested under its landing page."""
    landing = landing_of(folder, files)
    direct = sorted((f for f in files
                     if PurePosixPath(f).parent.as_posix() == folder and f != landing),
                    key=natural)
    for f in direct:
        lines.append(f"{'  ' * depth}- {link(f)}")
    subs = sorted({PurePosixPath(f).relative_to(folder).parts[0]
                   for f in files
                   if f.startswith(folder + "/") and len(PurePosixPath(f).relative_to(folder).parts) > 1},
                  key=natural)
    for sub in subs:
        path = f"{folder}/{sub}"
        sub_landing = landing_of(path, files)
        head = link(sub_landing) if sub_landing else f"**{sub.replace('-', ' ').title()}**"
        lines.append(f"{'  ' * depth}- {head}")
        render_folder(path, files, depth + 1, lines)


def build(pages: list[str]) -> str:
    pages = [p for p in pages if p not in SELF]
    all_pages = set(pages)
    docs = {p for p in all_pages if p.startswith("docs/") and p.count("/") >= 2}
    project = [p for p in PROJECT_PAGES if p in all_pages]
    project += sorted((p for p in all_pages - docs - set(project)), key=natural)

    sections = sorted({p.split("/")[1] for p in docs},
                      key=lambda s: (SECTION_ORDER.index(s) if s in SECTION_ORDER else len(SECTION_ORDER), s))
    lines = [
        "<!-- GENERATED by scripts/generate_sitemap.py at build time; do not edit. -->",
        "",
        f"**{len(pages)} pages** in {len(sections) + 1} sections.",
        "",
        "## Project",
        "",
    ]
    for p in project:
        lines.append(f"- {link(p, 'Home' if p == 'index.qmd' else None)}")
    for sec in sections:
        folder = f"docs/{sec}"
        members = {p for p in docs if p.startswith(folder + "/")}
        landing = landing_of(folder, members)
        heading = SECTIONS.get(sec) or sec.replace("-", " ").title()
        lines += ["", f"## {heading}", ""]
        if landing:
            lines.append(f"- {link(landing, 'Section overview')}")
        render_folder(folder, members, 0, lines)
    return "\n".join(lines) + "\n"


def main() -> int:
    # Quarto resolves includes while it builds the project's file list,
    # before any pre-render script runs, so a missing tree breaks every
    # Quarto command, `quarto inspect` included. Write a placeholder first.
    if not OUTPUT.exists():
        OUTPUT.write_text("*The site map is generated when the site is built.*\n",
                          encoding="utf-8", newline="\n")
        os.environ.pop("QUARTO_PROJECT_INPUT_FILES", None)
    pages = input_files()
    if pages is None:
        return 0  # partial render: keep the existing tree
    OUTPUT.write_text(build(pages), encoding="utf-8", newline="\n")
    if os.environ.get("QUARTO_PROJECT_SCRIPT_QUIET") != "1":
        listed = len([p for p in pages if p not in SELF])
        print(f"sitemap: {listed} pages -> {OUTPUT.name}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
