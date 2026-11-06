#!/usr/bin/env python3
"""Generate the Workbook Map included by workbook-map.qmd.

The map lists every object in the workbook: each page, each narrated deck with its video, and
each kit. For each one it says what the object does, where it lands, when it last changed, when
it was last verified and its status. It replaced the Site Map, which listed pages only.

Runs as a Quarto pre-render script (see `project: pre-render` in _quarto.yml), so the map is
rebuilt from the exact list of pages Quarto is about to render and cannot drift from the site.

- Full render (QUARTO_PROJECT_RENDER_ALL=1): rebuilt from QUARTO_PROJECT_INPUT_FILES.
- Single-file render or preview: the input list is partial, so the map is left alone.
- Run by hand, or by the deploy workflow before rendering:
  `python scripts/generate_workbook_map.py` (uses `quarto inspect`).

The map is git-ignored. Quarto needs it to exist before it can do anything (it resolves
includes up front), so on a fresh checkout run the script once before the first render.

The dates:

- Baseline: one date for everything, from the edition marked `baseline: true` in
  data/editions.yml. Until one is marked, the map says so.
- Last updated: the latest commit that touched the object, leaving out commits that only do
  the edition's and the review gate's bookkeeping (MECHANICAL). In a shallow clone, a dash.
- Last verified: the later of the page's review date, while its approval still holds, and the
  date of its chapter's verification log (see verified_dates). Otherwise a dash.

Titles come from each page's front matter `title:`, then its first `# ` heading, then the
file name. What an object does comes from its `description:`, then its first sentence.

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
OUTPUT = ROOT / "_workbook-map-tree.md"  # leading underscore: Quarto never renders it as a page
SELF = {"workbook-map.qmd"}
GITHUB = "https://github.com/WhalerMike/modernization-workbook"
DASH = "\u2014"
# Commits that restamp or relink pages without changing what they say.
MECHANICAL = re.compile(r"^(Edition \d|Review gate|Approve )")
VIDEO_GROUPS = {"start": "Start series", "book": "Book decks", "developer": "Developer workbook tours",
                "training": "Training modules", "research": "Research", "interview": "Interviews"}

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
    "evaluations": "Evaluations",
    "training": "Training",
    "reference": "Reference",
    "research": "Research (moved)",
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
FIELD = re.compile(r"^([A-Za-z][\w-]*):[ \t]*(.+?)\s*$", re.M)
VERIFIED = re.compile(r"^Verified:\s*(\d{4}-\d{2}-\d{2})", re.M)
LOG_FILE = re.compile(r"^Files?:(.*)$", re.M)
MD_LINK = re.compile(r"!?\[([^\]]*)\]\([^)]*\)")


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


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1].replace('\\"', '"')
    return value


def front(text: str) -> tuple[dict[str, str], str]:
    m = FRONTMATTER.match(text)
    if not m:
        return {}, text
    return {k: unquote(v) for k, v in FIELD.findall(m.group(1))}, text[m.end():]


def shorten(text: str, limit: int = 150) -> str:
    """The first sentence, cut at a word if it runs long, safe inside a table cell."""
    text = MD_LINK.sub(r"\1", text)
    text = re.sub(r"[*_`]{1,3}|<[^>]+>|\{[^}]*\}", "", text)
    text = " ".join(text.split())
    m = re.match(r"(.+?[.?!])(\s|$)", text)
    if m:
        text = m.group(1)
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return text.replace("|", "/")


def purpose_of(text: str) -> str:
    meta, body = front(text)
    if meta.get("description"):
        return shorten(meta["description"])
    for para in re.split(r"\n\s*\n", body):
        para = para.strip()
        if para and (para[0].isalpha() or para[:2] in ("**", "*[")):
            return shorten(para)
    return DASH


def last_changes(root: Path = ROOT) -> dict[str, str]:
    """The newest date each file changed, keeping bookkeeping commits only as a last resort.
    Folders under presentations/ and examples/ get an entry too. Empty in a shallow clone."""
    shallow = subprocess.run(["git", "rev-parse", "--is-shallow-repository"], cwd=root,
                             capture_output=True, text=True)
    if shallow.stdout.strip() == "true":
        return {}
    out = subprocess.run(["git", "-c", "core.quotepath=off", "log", "--format=%x00%cs%x00%s", "--name-only"],
                         cwd=root, capture_output=True, text=True, encoding="utf-8", errors="replace")
    real: dict[str, str] = {}
    any_commit: dict[str, str] = {}
    date, skip = "", False
    for line in out.stdout.splitlines():
        if line.startswith("\0"):
            _, date, subject = line.split("\0", 2)
            skip = bool(MECHANICAL.match(subject))
            continue
        if not line:
            continue
        keys = [line]
        parts = line.split("/")
        if parts[0] in ("presentations", "examples") and len(parts) > 2:
            keys.append("/".join(parts[:2]))
        for key in keys:
            any_commit.setdefault(key, date)
            if not skip:
                real.setdefault(key, date)
    return {**any_commit, **real}


def verified_dates(changed: dict, root: Path = ROOT) -> dict[str, str]:
    """Page -> the date of its verification log: the log's `Verified:` line, or else the last
    commit to the log, which is when its claims were last worked through. A log sits beside the
    chapter it covers, under the same name, or names its chapters (`01-02-why.md`, `File: ...`)."""
    dates: dict[str, str] = {}
    for log in (root / "docs").rglob("_verification/*.md"):
        text = log.read_text(encoding="utf-8", errors="replace")[:1500]
        when = VERIFIED.search(text)
        date = when.group(1) if when else changed.get(log.relative_to(root).as_posix(), "")
        if not date:
            continue
        book = log.parent.parent
        pages = {book / log.name} | {book / f"{log.stem}.md"}
        pair = re.match(r"(\d\d)-(\d\d)-", log.name)
        if pair:
            pages |= {q for n in pair.groups() for q in book.glob(f"{n}-*.md")}
        named = LOG_FILE.search(text)
        if named:
            pages |= {root / q for q in re.findall(r"docs/[\w./-]+\.md", named.group(1))}
            pages |= {book / q for q in re.findall(r"`([\w.-]+\.md)`", named.group(1))}
        for page in pages:
            if page.exists():
                rel = page.relative_to(root).as_posix()
                dates[rel] = max(date, dates.get(rel, ""))
    return dates


def baseline(root: Path = ROOT) -> str:
    """The date of the edition marked `baseline: true`, or an empty string."""
    record = root / "data/editions.yml"
    if not record.exists():
        return ""
    for entry in re.split(r"^  - id: ", record.read_text(encoding="utf-8"), flags=re.M)[1:]:
        if re.search(r"^    baseline: true\s*$", entry, re.M):
            when = re.search(r"^    date: (\S+)", entry, re.M)
            return when.group(1) if when else ""
    return ""


def page_row(rel: str, changed: dict, verified: dict, gate: dict, root: Path = ROOT) -> tuple[str, str, str, str, str]:
    text = (root / rel).read_text(encoding="utf-8", errors="replace")
    meta, _ = front(text)
    when = verified.get(rel, "")
    if rel in gate["gated"]:
        waiting = rel in gate["waiting"]
        status = "Waiting for review" if waiting else "Reviewed"
        if not waiting:
            when = max(when, meta.get("last-reviewed", ""))
    else:
        status = (meta.get("status") or DASH).capitalize()
    return (link(rel), purpose_of(text), changed.get(rel, DASH), when or DASH, status)


def table(rows: list[tuple], head: tuple[str, ...]) -> list[str]:
    out = ["| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    out += ["| " + " | ".join(r) + " |" for r in rows]
    return out


PAGE_HEAD = ("Page", "What it does", "Last updated", "Last verified", "Status")
DECK_HEAD = ("Deck and video", "What it does", "Length", "Last updated", "Files")
KIT_HEAD = ("Kit", "What it does", "Last updated", "Status")


def deck_rows(changed: dict, titles: dict[str, str], root: Path = ROOT) -> dict[str, list[tuple]]:
    """Each narrated deck with its video, by group. The videos' own record lists them all."""
    record = root / "docs/presentations/videos.json"
    if not record.exists():
        return {}
    groups: dict[str, list[tuple]] = {}
    for v in json.loads(record.read_text(encoding="utf-8")):
        folder = "/".join(str(v.get("vtt", "")).split("/")[:2])
        minutes = f"{v['minutes']} min" if v.get("minutes") else DASH
        files = [f"[Video]({v['mp4']})"] if v.get("mp4") else []
        if v.get("deck"):
            files.append(f"[Deck]({v['deck']})")
        what = f"Narrated tour of {titles[v['source']]}." if v.get("source") in titles else "Narrated deck."
        watch = f"[{v['title'].replace('|', '/')}](docs/presentations/watch.html?v={quote(v['id'])})"
        groups.setdefault(v.get("group", ""), []).append(
            (watch, what.replace("|", "/"), minutes, changed.get(folder, DASH), " · ".join(files) or DASH))
    return groups


def kit_rows(changed: dict, root: Path = ROOT) -> list[tuple]:
    rows = []
    for readme in sorted((root / "examples").glob("*/README.md"), key=lambda p: natural(p.parent.name)):
        text = readme.read_text(encoding="utf-8", errors="replace")
        name = readme.parent.name
        h = H1.search(text)
        title = (h.group(1) if h else name).replace("|", "/")
        status = re.search(r"\*\*Status:\s*(\w+)", text)
        paragraphs = [q.strip() for q in re.split(r"\n\s*\n", text)]
        body = next((q for q in paragraphs if q and q[0] not in "#>|-`!<" and "Download" not in q[:12]), "")
        rows.append((f"[{title}]({GITHUB}/tree/main/examples/{name})", shorten(body) if body else DASH,
                     changed.get(f"examples/{name}", DASH), status.group(1).capitalize() if status else DASH))
    return rows


def groups_of(pages: set[str]) -> list[tuple[str, str, list[str]]]:
    """(section heading, group folder, pages): a section per folder under docs/, then a group per
    subfolder, with the section's own pages first."""
    sections = sorted({p.split("/")[1] for p in pages},
                      key=lambda s: (SECTION_ORDER.index(s) if s in SECTION_ORDER else len(SECTION_ORDER), s))
    out = []
    for sec in sections:
        heading = SECTIONS.get(sec) or sec.replace("-", " ").title()
        members = sorted((p for p in pages if p.split("/")[1] == sec), key=natural)
        subs: dict[str, list[str]] = {}
        for p in members:
            parts = p.split("/")
            subs.setdefault(parts[2] if len(parts) > 3 else "", []).append(p)
        for sub in sorted(subs, key=natural):
            out.append((heading, sub, subs[sub]))
    return out


def group_title(section_folder: str, sub: str, files: list[str]) -> str:
    landing = landing_of(f"{section_folder}/{sub}", set(files))
    return title_of(landing) if landing else sub.replace("-", " ").title()


def build(pages: list[str], root: Path = ROOT) -> str:
    sys.path.insert(0, str(Path(__file__).resolve().parent / "source_watch"))
    import review_gate as rg

    pages = [p for p in pages if p not in SELF]
    all_pages = set(pages)
    docs = {p for p in all_pages if p.startswith("docs/") and p.count("/") >= 2}
    project = [p for p in PROJECT_PAGES if p in all_pages]
    project += sorted((p for p in all_pages - docs - set(project)), key=natural)

    changed = last_changes(root)
    verified = verified_dates(changed, root)
    gate = {"gated": {p.relative_to(root).as_posix() for p in rg.gated_pages(root)},
            "waiting": {r["page"] for r in rg.waiting(root)}}
    titles = {p: title_of(p) for p in all_pages}
    decks = deck_rows(changed, titles, root)
    kits = kit_rows(changed, root)
    n_decks = sum(len(r) for r in decks.values())
    rows = {p: page_row(p, changed, verified, gate, root) for p in pages}
    stale = sum(1 for r in rows.values() if r[2] != DASH and r[3] != DASH and r[2] > r[3])
    unverified = sum(1 for r in rows.values() if r[3] == DASH)
    base = baseline(root)

    lines = [
        "<!-- GENERATED by scripts/generate_workbook_map.py at build time; do not edit. -->",
        "",
        f"**{len(pages)} pages, {n_decks} narrated decks with their videos and {len(kits)} kits.**",
        "",
        f"**Baseline:** {base if base else 'not set yet. The baseline edition sets one date for everything.'}",
        "",
        f"**Last verified:** {len(pages) - unverified} pages carry a verification date, and {unverified} don't. "
        f"{stale} pages changed after their last verification date.",
        "",
        "## Project",
        "",
    ]
    lines += table([(link(p, "Home"), *rows[p][1:]) if p == "index.qmd" else rows[p] for p in project], PAGE_HEAD)
    current = None
    for heading, sub, files in groups_of(docs):
        if heading != current:
            lines += ["", f"## {heading}", ""]
            current = heading
        if sub:
            folder = "/".join(files[0].split("/")[:2])
            lines += [f"### {group_title(folder, sub, files)}", ""]
        lines += table([rows[p] for p in files], PAGE_HEAD) + [""]
    lines += ["## Decks and videos", ""]
    for key in list(VIDEO_GROUPS) + sorted(set(decks) - set(VIDEO_GROUPS)):
        if key in decks:
            lines += [f"### {VIDEO_GROUPS.get(key, key.title())}", ""] + table(decks[key], DECK_HEAD) + [""]
    lines += ["## Kits", ""] + table(kits, KIT_HEAD)
    return "\n".join(lines) + "\n"


def main() -> int:
    # Quarto resolves includes while it builds the project's file list,
    # before any pre-render script runs, so a missing tree breaks every
    # Quarto command, `quarto inspect` included. Write a placeholder first.
    if not OUTPUT.exists():
        OUTPUT.write_text("*The Workbook Map is generated when the site is built.*\n",
                          encoding="utf-8", newline="\n")
        os.environ.pop("QUARTO_PROJECT_INPUT_FILES", None)
    pages = input_files()
    if pages is None:
        return 0  # partial render: keep the existing tree
    OUTPUT.write_text(build(pages), encoding="utf-8", newline="\n")
    if os.environ.get("QUARTO_PROJECT_SCRIPT_QUIET") != "1":
        listed = len([p for p in pages if p not in SELF])
        print(f"workbook map: {listed} pages -> {OUTPUT.name}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
