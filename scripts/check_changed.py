#!/usr/bin/env python3
"""Tiered pre-merge check: render and check only what a pull request changed.

A full site render takes most of an hour, so a pull request that edits two
chapters shouldn't need one. This script looks at the files a branch changed
against its base and picks a tier:

  FULL     a change that can affect every page (site configuration, filters,
           theme, build scripts, an included file, a listing page, the video
           manifest, a renamed or deleted page, or more than --max-pages
           pages): the deploy workflow's build, minus the deploy.
  CHANGED  published pages changed: render just those pages, check their
           links, anchors and footnotes, and build the Word bundles that
           contain them.
  NONE     nothing the site publishes changed (deck binaries, example code,
           unpublished notes): only the checks that apply to those files.

Every tier also runs the non-site checks the changed files call for: the deck
accessibility check, the kit zips, the video manifest and project plan
staleness checks, and this script's unit tests.

    python scripts/check_changed.py                      # against origin/main
    python scripts/check_changed.py --dry-run            # print the plan only
    python scripts/check_changed.py --base origin/main --force-full
    python scripts/check_changed.py --files docs/books/b07-pki/03-x.md --dry-run
    git show --name-only --format= <commit> > files.txt
    python scripts/check_changed.py --files @files.txt --dry-run

Changed files are `git diff <merge-base of base and HEAD>`, which is
`git diff <base>...HEAD` plus any uncommitted edits to tracked files (none in
CI). --committed-only leaves the uncommitted edits out; --include-untracked
adds new files git doesn't track yet. With --files, a listed file that doesn't
exist counts as deleted.

Exits 1 if any check fails. In GitHub Actions the summary also goes to
$GITHUB_STEP_SUMMARY. Works on Windows and Linux; needs Python 3.10+,
PyYAML, and Quarto on PATH for the render and bundle steps.
"""
from __future__ import annotations

import argparse
import html
import os
import posixpath
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable

REPO = Path(__file__).resolve().parent.parent
SCRIPTS = REPO / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

DEFAULT_MAX_PAGES = 25
PAGE_SUFFIXES = (".md", ".qmd")
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp", ".tif", ".tiff", ".emf", ".wmf"}

# ------------------------------------------------------------------ tier rules
#
# Pure functions of repo-relative POSIX paths, so the tests need no git and no
# checkout. The repository-dependent facts (which paths the site publishes,
# which pages carry a listing, which files are include targets, which pages
# embed an image) are passed in.

# Files that feed every page or the whole build.
FULL_FILES = {
    "_quarto.yml": "site configuration",
    "docs/presentations/videos.json": "video manifest (every video player reads it)",
    "scripts/write_redirects.py": "post-render redirect writer",
    "scripts/command_reference.py": "Command Reference generator (a pre-render script)",
    "scripts/redirects.yml": "redirect map",
    "scripts/build_bundles.py": "Word bundle builder",
    "scripts/bundles.yml": "Word bundle manifests",
    "bundles.yml": "Word bundle manifests",
    "scripts/bundle-filter.lua": "Word bundle filter",
    ".github/workflows/quarto-pages.yml": "deploy workflow",
}
# Folders whose files feed every page.
FULL_PREFIXES = {
    "assets/": "site theme, filters, partials or reference document",
    "docs/filters/": "Lua filters",
    "_extensions/": "Quarto extensions",
}
GENERATOR = re.compile(r"scripts/generate_[^/]*\.py")
DOCS_UNDERSCORE = re.compile(r"docs/_[^/]*(/.*)?")   # docs/_* includes and partials
# The edition record, and the pages that carry a generated version history or
# the Archive (scripts/generate_revisions.py).
REVISIONS = re.compile(r"data/editions\.yml|data/edition-assets/[^/]+\.json|scripts/(generate_revisions|cut_edition)\.py"
                       r"|docs/about/archive\.md|docs/books/(b\d\d-[^/]+/index|guides/[^/_][^/]*)\.md"
                       r"|docs/project-plans/developer-workbooks/[^/]+/index\.md")
# Workbooks whose Lab 1 output is captured (scripts/kit_captures.py): the chapters and the kit.
KIT_CAPTURES = {"ttm": ("docs/project-plans/developer-workbooks/ticket-to-machine", "examples/servicenow-sailpoint"),
                "hr": ("docs/project-plans/developer-workbooks/hr-driven-identity", "examples/hr-lifecycle")}


@dataclass(frozen=True)
class Change:
    """One changed file. status is git's letter: A, M, D, R (renamed), C, T."""
    status: str
    path: str
    old: str | None = None


@dataclass
class Plan:
    tier: str                                   # FULL, CHANGED or NONE
    reasons: list[str] = field(default_factory=list)
    pages: list[str] = field(default_factory=list)       # published pages to render and check
    direct_pages: list[str] = field(default_factory=list)
    image_pages: dict[str, list[str]] = field(default_factory=dict)  # page -> changed images it embeds
    deleted: list[str] = field(default_factory=list)     # paths that no longer exist
    tasks: dict[str, list[str]] = field(default_factory=dict)        # non-site checks


def is_page(path: str) -> bool:
    return path.endswith(PAGE_SUFFIXES)


def full_trigger(path: str) -> str | None:
    """Why a change to this path alone needs a full render, or None."""
    if path in FULL_FILES:
        return FULL_FILES[path]
    for prefix, why in FULL_PREFIXES.items():
        if path.startswith(prefix):
            return why
    if GENERATOR.fullmatch(path):
        return "a generator script"
    if DOCS_UNDERSCORE.fullmatch(path):
        return "a docs/_* include"
    if path == "_metadata.yml" or (path.startswith("docs/") and path.endswith("/_metadata.yml")):
        return "folder metadata (applies to every page below it)"
    return None


def decide(
    changes: Iterable[Change],
    *,
    published: Callable[[str], bool],
    listing_pages: Iterable[str] = (),
    include_targets: Iterable[str] = (),
    image_users: dict[str, Iterable[str]] | None = None,
    max_pages: int = DEFAULT_MAX_PAGES,
    force_full: bool = False,
) -> Plan:
    """Pick the tier for a set of changes.

    published(path)  True if the site publishes that page (project.render).
    listing_pages    published pages whose front matter has `listing:`.
    include_targets  files some published page pulls in with {{< include >}}.
    image_users      changed image path -> published pages that embed it.
    """
    changes = list(changes)
    listing = set(listing_pages)
    includes = set(include_targets)
    image_users = image_users or {}
    reasons: list[str] = []
    direct: set[str] = set()
    via_image: dict[str, set[str]] = {}
    deleted: list[str] = []

    def full(why: str) -> None:
        if why not in reasons:
            reasons.append(why)

    for c in changes:
        gone = [c.old] if c.old else []
        if c.status == "D":
            gone.append(c.path)
        deleted += gone
        for p in [c.path] + gone:
            why = full_trigger(p)
            if why:
                full(f"{p}: {why}")
            if p in includes:
                full(f"{p}: included by a published page")
            if p in listing:
                full(f"{p}: has a listing (built from other pages)")
        for p in gone:
            if is_page(p) and published(p):
                kind = "renamed" if c.status.startswith("R") else "deleted"
                full(f"{p}: published page {kind}")
        if c.status != "D" and is_page(c.path) and published(c.path):
            direct.add(c.path)
        if c.status != "D" and c.path in image_users:
            for page in image_users[c.path]:
                via_image.setdefault(page, set()).add(c.path)

    pages = sorted(direct | set(via_image))
    if len(pages) > max_pages:
        full(f"{len(pages)} published pages affected (more than {max_pages})")
    if force_full:
        reasons.insert(0, "--force-full")

    if reasons:
        tier = "FULL"
    elif pages:
        tier = "CHANGED"
        reasons = [f"{len(pages)} published page(s) affected"]
    else:
        tier = "NONE"
        reasons = ["no published page or site input changed"]
    return Plan(tier=tier, reasons=reasons, pages=pages, direct_pages=sorted(direct),
                image_pages={p: sorted(v) for p, v in sorted(via_image.items())},
                deleted=sorted(set(deleted)), tasks=non_site_tasks(changes))


# `quarto render` takes one input. Each call pays a fixed start-up cost (the
# pre-render scripts and the project scan, about 40 s on a laptop) and then a
# few seconds a page, so several changed pages in one folder render faster as
# the folder (every published page below it) than one by one.
RENDER_OVERHEAD_S = 40
RENDER_PER_PAGE_S = 9


def render_targets(pages: list[str], published_pages: Iterable[str]) -> list[str]:
    """What to pass to `quarto render`, one call each: pages, or a folder where cheaper."""
    published_pages = list(published_pages)
    by_dir: dict[str, list[str]] = {}
    for p in pages:
        by_dir.setdefault(posixpath.dirname(p), []).append(p)
    out = []
    for d, group in sorted(by_dir.items()):
        size = sum(1 for p in published_pages if d and p.startswith(d + "/"))
        one_by_one = len(group) * (RENDER_OVERHEAD_S + RENDER_PER_PAGE_S)
        as_folder = RENDER_OVERHEAD_S + size * RENDER_PER_PAGE_S
        out += [d] if d and len(group) > 1 and as_folder < one_by_one else sorted(group)
    return out


def non_site_tasks(changes: Iterable[Change], kits: Iterable[str] = ("start-kit", "copilot-agent-pack",
                                                                     "app-modernization", "ansible"),
                   bundles: dict | None = None) -> dict:
    """Checks that don't need the site, keyed by task name.

    bundles maps a kit built from several examples folders to those folders
    (build_start_kit_zip.BUNDLES), so a change in any of them rebuilds it."""
    kits = tuple(kits)
    bundles = bundles or {}
    live = [c.path for c in changes if c.status != "D"]
    every = [p for c in changes for p in ([c.path] + ([c.old] if c.old else []))]
    tasks: dict[str, list[str]] = {}

    def add(task: str, item: str) -> None:
        tasks.setdefault(task, [])
        if item not in tasks[task]:
            tasks[task].append(item)

    for p in live:
        if p.startswith("presentations/") and p.endswith(".pptx") and not Path(p).name.startswith("~$"):
            add("a11y", p)
    if "presentations/_build/a11y_check.py" in every:
        tasks["a11y"] = ["*"]                       # the checker changed: every deck
    for p in every:
        parts = p.split("/")
        if len(parts) > 2 and parts[0] == "examples" and parts[1] in kits:
            add("kits", parts[1])
        if len(parts) > 2 and parts[0] == "examples":
            for bundle, folders in bundles.items():
                if bundle in kits and any(p.startswith(f"examples/{f}/") for f in folders):
                    add("kits", bundle)
        if p == "scripts/build_start_kit_zip.py":
            for k in kits:
                add("kits", k)
        if (p.startswith("presentations/") and p.endswith(".vtt")) or p in (
                "data/video-durations.json", "docs/presentations/videos.json",
                "docs/presentations/_video-library.md", "scripts/generate_video_manifest.py"):
            add("video-manifest", p)
        if p.startswith(("data/project-plans/", "scripts/project_plans/", "docs/project-plans/")):
            add("project-plans", p)
        if p.startswith(("docs/project-plans/developer-workbooks/", "docs/books/b19-developer-workbook/",
                         "docs/training/", "docs/books/guides/")) or p == "scripts/generate_labs.py":
            add("labs", p)
        for wb, (docs, kit) in KIT_CAPTURES.items():
            if p.startswith((f"{docs}/", f"{kit}/", f"data/kit-captures/{wb}/")) or p == "scripts/kit_captures.py":
                add("kit-captures", wb)
        if REVISIONS.fullmatch(p):
            add("revisions", p)
        if (p.endswith(PAGE_SUFFIXES) and p.startswith(("docs/", "presentations/", "index.qmd"))
                and not any(part.startswith("_") for part in p.split("/")[:-1])) or p.startswith(
                "data/edition-assets/") or p in ("data/deck-assets.json", "scripts/deck_assets.py"):
            add("deck-links", p)
        if p in ("data/federal-compliance-compliance-spine.yml", "scripts/render_authorities_table.py") or (
                p.startswith("docs/compliance/") and p.endswith(".md")):
            add("authorities", p)
        code = len(parts) > 2 and parts[0] == "examples" and p.endswith((".ps1", ".psm1", ".psd1", ".py"))
        if code or p == "scripts/command_reference.py":
            add("command-help", p)
        if p.startswith("examples/evidence-maps/") or p in ("data/schemas/evidence-map.schema.json",
                                                             "scripts/check_evidence_maps.py"):
            add("evidence-maps", p)
        if p in ("scripts/check_changed.py", "scripts/check_evidence_maps.py", "scripts/check_neutrality.py",
                 "scripts/generate_revisions.py", "scripts/deck_assets.py", "scripts/command_reference.py",
                 "scripts/run_example_tests.py", ".github/workflows/pr-checks.yml") or p.startswith("scripts/tests/"):
            add("unit-tests", p)
    import check_neutrality
    import run_example_tests

    tested = set(run_example_tests.kits())
    for p in every:
        parts = p.split("/")
        if len(parts) > 2 and parts[0] == "examples" and parts[1] in tested:
            add("example-tests", parts[1])
    if any(p in ("scripts/run_example_tests.py", ".github/workflows/pr-checks.yml") for p in every):
        tasks["example-tests"] = ["*"]              # the runner or the workflow changed: every kit's tests
    for p in live:
        if check_neutrality.in_scope(p):
            add("neutrality", p)
    if any(p in ("scripts/check_neutrality.py", "data/neutrality-terms.txt", "data/neutrality-baseline.txt")
           for p in every):
        tasks["neutrality"] = ["*"]                 # the terms or the checker changed: every file
    return tasks


# --------------------------------------------------------- markdown scanning

FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
COMMENT = re.compile(r"<!--.*?-->", re.S)
INLINE_CODE = re.compile(r"(`+)(?:(?!\1).)+?\1", re.S)
FRONT_MATTER = re.compile(r"\A---[ \t]*\r?\n(.*?\r?\n)(?:---|\.\.\.)[ \t]*\r?\n", re.S)
INCLUDE = re.compile(r"^\{\{<\s*include\s+(\S+)\s*>\}\}[ \t]*$", re.M)


def blank_code(text: str, inline: bool = True) -> str:
    """Blank out fenced code, inline code (unless inline=False) and HTML comments,
    keeping offsets and line numbers."""
    def blank(m: re.Match) -> str:
        return re.sub(r"[^\n]", " ", m.group(0))

    text = COMMENT.sub(blank, text)
    out, fence = [], None
    for line in text.split("\n"):
        m = FENCE.match(line)
        if m:
            mark = m.group(1)
            if fence is None:
                fence = mark
            elif mark[0] == fence[0] and len(mark) >= len(fence) and not line.strip()[len(mark):].strip():
                fence = None
            out.append(" " * len(line))
            continue
        out.append(" " * len(line) if fence else line)
    text = "\n".join(out)
    return INLINE_CODE.sub(blank, text) if inline else text


def front_matter(text: str) -> str:
    m = FRONT_MATTER.match(text)
    return m.group(1) if m else ""


def body_offset(text: str) -> int:
    m = FRONT_MATTER.match(text)
    return m.end() if m else 0


def line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


# Heading identifiers, as pandoc's auto_identifiers extension makes them
# (Quarto's default): drop formatting, links and notes; keep letters,
# digits, spaces and _ - .; lower-case; join words with "-"; drop everything
# before the first letter; "section" if nothing is left; repeats get -1, -2.

ATX = re.compile(r"^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$")
TRAILING_ATTR = re.compile(r"[ \t]*\{([^{}]*)\}[ \t]*$")
ID_IN_ATTR = re.compile(r"(?:^|\s)#([^\s}]+)")
ATTR_BLOCK = re.compile(r"\{([^{}\n]*#[^{}\n]*)\}")
HTML_ID = re.compile(r"""<[a-zA-Z][^>]*?\s(?:id|name)\s*=\s*["']([^"']+)["']""")


def stringify(text: str) -> str:
    parts = re.split(r"(`+[^`]*`+)", text)
    out = []
    for i, part in enumerate(parts):
        if i % 2:                                   # inline code: keep its text
            out.append(part.strip("`").strip())
            continue
        part = re.sub(r"\[\^[^\]]*\]", "", part)                     # note references
        part = re.sub(r"\^\[[^\]]*\]", "", part)                     # inline notes
        part = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", part)       # links, images
        part = re.sub(r"\[([^\]]*)\]\{[^}]*\}", r"\1", part)         # spans
        part = re.sub(r"\[([^\]]*)\]\[[^\]]*\]", r"\1", part)        # reference links
        part = re.sub(r"<[^>]+>", "", part)                          # raw HTML
        part = re.sub(r"\{\{<.*?>\}\}", "", part)                    # shortcodes
        part = re.sub(r"\\(.)", r"\1", part)                         # escapes
        part = part.replace("*", "")
        part = re.sub(r"(?<![^\W_])_+|_+(?![^\W_])", "", part)       # _emphasis_, not snake_case
        out.append(html.unescape(part))
    return "".join(out)


def slug(heading: str) -> str:
    s = stringify(heading).lower()
    s = "".join(c for c in s if c.isspace() or c.isalnum() or c in "_-.")
    s = "-".join(s.split())
    i = 0
    while i < len(s) and not s[i].isalpha():
        i += 1
    return s[i:] or "section"


def anchors(text: str) -> set[str]:
    """Every fragment a page answers to: heading ids (explicit or generated),
    ids on divs, spans, figures and tables, and HTML id/name attributes."""
    clean = blank_code(text, inline=False)[body_offset(text):]
    out: set[str] = set()
    generated: list[str] = []                       # heading texts without an explicit id
    for line in clean.split("\n"):
        m = ATX.match(line)
        if not m:
            continue
        title = m.group(2)
        attr = TRAILING_ATTR.search(title)
        if attr and (attr.group(1).strip().startswith(("#", ".", "-")) or "=" in attr.group(1)):
            title = title[:attr.start()]
            idm = ID_IN_ATTR.search(" " + attr.group(1))
            if idm:
                out.add(idm.group(1))
                continue
        generated.append(title)
    used = set(out)
    for title in generated:
        base = cand = slug(title)
        n = 0
        while cand in used:
            n += 1
            cand = f"{base}-{n}"
        used.add(cand)
        out.add(cand)
    clean = blank_code(text)[body_offset(text):]     # ids in code don't count
    for m in ATTR_BLOCK.finditer(clean):
        for idm in ID_IN_ATTR.finditer(" " + m.group(1)):
            out.add(idm.group(1))
    for m in HTML_ID.finditer(clean):
        out.add(m.group(1))
    return out


# Fragments every rendered page has (Quarto's page chrome, the Notes heading
# assets added by _quarto.yml, and pandoc's note anchors).
PAGE_CHROME = re.compile(r"(?:notes|footnotes|refs|toc|TOC|title-block-header|quarto-.*|fn\d+|fnref\d+)")

INLINE_LINK = re.compile(r"\]\(\s*(<[^>\n]*>|[^)\s]+)(?:\s+(?:\"[^\"\n]*\"|'[^'\n]*'))?\s*\)")
REF_DEF = re.compile(r"^ {0,3}\[(?!\^)[^\]\n]+\]:[ \t]*(<[^>\n]*>|\S+)", re.M)
HTML_LINK = re.compile(r"""<(?:a|img|source|track|link)\b[^>]*?\s(href|src)\s*=\s*["']([^"']+)["']""", re.I)
SCHEME = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.-]*:|^//")


@dataclass(frozen=True)
class Link:
    page: str           # repo-relative page that holds the link
    line: int
    raw: str            # the target as written
    path: str           # repo-relative target path, "" for a same-page #fragment
    fragment: str
    image: bool


def is_image_link(text: str, close: int) -> bool:
    """True if the ']' at `close` ends an image's alt text (`![...]`)."""
    depth = 0
    i = close - 1
    while i >= 0:
        c = text[i]
        if c == "]":
            depth += 1
        elif c == "[":
            if depth == 0:
                return i > 0 and text[i - 1] == "!"
            depth -= 1
        elif c == "\n" and i > 0 and text[i - 1] == "\n":
            return False
        i -= 1
    return False


def resolve(page: str, target: str) -> tuple[str, str] | None:
    """(repo-relative path, fragment) for a local link, or None for external ones."""
    target = target.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1].strip()
    if not target or SCHEME.match(target) or "{{" in target or "{" in target:
        return None
    path, _, fragment = target.partition("#")
    path = path.split("?")[0]
    path = urllib.parse.unquote(path)
    fragment = urllib.parse.unquote(fragment)
    if not path:
        return "", fragment
    if path.startswith("/"):
        joined = path.lstrip("/")
    else:
        joined = posixpath.join(posixpath.dirname(page), path)
    norm = posixpath.normpath(joined)
    if path.endswith("/") and not norm.endswith("/"):
        norm += "/"
    return norm, fragment


def links(page: str, text: str) -> list[Link]:
    clean = blank_code(text)
    start = body_offset(text)
    out = []

    def add(offset: int, raw: str, image: bool) -> None:
        r = resolve(page, raw)
        if r is not None:
            out.append(Link(page, line_of(text, offset), raw, r[0], r[1], image))

    for m in INLINE_LINK.finditer(clean, start):
        add(m.start(), m.group(1), is_image_link(clean, m.start()))
    for m in REF_DEF.finditer(clean, start):
        add(m.start(), m.group(1), False)
    for m in HTML_LINK.finditer(clean, start):
        add(m.start(), m.group(2), m.group(2) and m.group(1).lower() == "src"
            and Path(urllib.parse.unquote(m.group(2).split("?")[0])).suffix.lower() in IMAGE_SUFFIXES)
    return out


NOTE_DEF = re.compile(r"^ {0,3}\[\^([^\]\s]+)\]:", re.M)
NOTE_REF = re.compile(r"\[\^([^\]\s]+)\](?!:)")


def footnotes(text: str) -> tuple[list[tuple[str, int]], list[tuple[str, int]]]:
    """(definitions, references), each as (name, line)."""
    clean = blank_code(text)
    defs = [(m.group(1), line_of(text, m.start())) for m in NOTE_DEF.finditer(clean)]
    refs = []
    for m in NOTE_REF.finditer(clean):
        line_start = clean.rfind("\n", 0, m.start()) + 1
        if NOTE_DEF.match(clean, line_start) and NOTE_DEF.match(clean, line_start).end() == m.end() + 1:
            continue                                  # the definition's own label
        refs.append((m.group(1), line_of(text, m.start())))
    return defs, refs


# ------------------------------------------------------------- repository

def rel(p: Path) -> str:
    return p.resolve().relative_to(REPO).as_posix()


class Repo:
    """What the checkout publishes, read once."""

    def __init__(self) -> None:
        import build_bundles                         # needs PyYAML
        import build_start_kit_zip
        import yaml

        self.yaml = yaml
        self._rules = build_bundles.RenderRules()
        self._bb = build_bundles
        self.kits = tuple(build_start_kit_zip.KITS)
        self.kit_bundles = dict(build_start_kit_zip.BUNDLES)
        self.zip_names = {build_start_kit_zip.ZIP_NAMES.get(k, k) + ".zip" for k in self.kits}
        cfg = yaml.safe_load((REPO / "scripts/bundles.yml").read_text(encoding="utf-8"))
        self.bundle_names = set()
        for spec in cfg.get("bundles") or []:
            self.bundle_names.add(spec["output"])
            self.bundle_names.update(spec.get("aliases") or [])
        red = yaml.safe_load((REPO / "scripts/redirects.yml").read_text(encoding="utf-8")) or {}
        self.redirects = {str(k).lstrip("/"): str(v).lstrip("/") for k, v in (red.get("redirects") or {}).items()}
        self.pages = sorted({rel(p) for p in (REPO / "docs").rglob("*.md")} | {rel(p) for p in REPO.glob("*.qmd")})
        self._text: dict[str, str] = {}
        self._anchors: dict[str, set[str]] = {}
        self._links: list[Link] | None = None

    def published(self, path: str) -> bool:
        return is_page(path) and self._rules.published(REPO / path)

    def text(self, path: str) -> str:
        if path not in self._text:
            self._text[path] = (REPO / path).read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n")
        return self._text[path]

    def published_pages(self) -> list[str]:
        return [p for p in self.pages if self.published(p)]

    def listing_pages(self) -> set[str]:
        return {p for p in self.published_pages() if re.search(r"^listing:", front_matter(self.text(p)), re.M)}

    def include_targets(self) -> dict[str, str]:
        """Included file -> a published page that includes it (nested includes followed)."""
        out: dict[str, str] = {}
        todo = [(p, p) for p in self.published_pages()]
        while todo:
            page, owner = todo.pop()
            if not (REPO / page).is_file():
                continue
            for m in INCLUDE.finditer(blank_code(self.text(page))):
                target = m.group(1).strip("\"'")
                path = posixpath.normpath(target.lstrip("/") if target.startswith("/")
                                          else posixpath.join(posixpath.dirname(page), target))
                if path not in out:
                    out[path] = owner
                    todo.append((path, owner))
        return out

    def full_text(self, page: str) -> str:
        """The page with its {{< include >}} files spliced in."""
        text = self.text(page)
        for _ in range(5):
            def inc(m: re.Match) -> str:
                target = m.group(1).strip("\"'")
                path = REPO / (target.lstrip("/") if target.startswith("/") else posixpath.join(posixpath.dirname(page), target))
                return path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""
            text, n = INCLUDE.subn(inc, text)
            if not n:
                break
        return text

    def anchors(self, page: str) -> set[str]:
        if page not in self._anchors:
            self._anchors[page] = anchors(self.full_text(page))
        return self._anchors[page]

    def all_links(self) -> list[Link]:
        """Every local link on every page under docs/ and every root .qmd."""
        if self._links is None:
            self._links = [l for p in self.pages for l in links(p, self.text(p))]
        return self._links

    def image_users(self, paths: Iterable[str]) -> dict[str, list[str]]:
        wanted = {p for p in paths if Path(p).suffix.lower() in IMAGE_SUFFIXES}
        out: dict[str, set[str]] = {}
        if not wanted:
            return {}
        for l in self.all_links():
            if l.image and l.path in wanted and self.published(l.page):
                out.setdefault(l.path, set()).add(l.page)
        return {k: sorted(v) for k, v in out.items()}

    def bundles(self):
        return self._bb.load_bundles(self._rules)

    # ---- one link
    def link_problem(self, l: Link) -> str | None:
        """Why this link won't work on the published site, or None."""
        target = l.path
        if target == "":
            return self.fragment_problem(l, l.page)
        if target.startswith("../") or target == "..":
            return f"{l.raw}: points outside the repository"
        if target.startswith("downloads/"):
            name = target[len("downloads/"):]
            if name in self.bundle_names or name in self.zip_names:
                return None
            return f"{l.raw}: no bundle or kit builds downloads/{name}"
        if target.endswith("/"):
            for idx in ("index.md", "index.qmd"):
                if self.published(target + idx) and (REPO / (target + idx)).is_file():
                    return self.fragment_problem(l, target + idx)
            return f"{l.raw}: folder has no published index page"
        suffix = posixpath.splitext(target)[1].lower()
        if suffix in PAGE_SUFFIXES:
            if not (REPO / target).is_file():
                return f"{l.raw}: page does not exist"
            if not self.published(target):
                return f"{l.raw}: page is not published by the site (link the GitHub source instead)"
            return self.fragment_problem(l, target)
        if suffix == ".html":
            stem = target[:-5]
            for src in (stem + ".md", stem + ".qmd"):
                if self.published(src) and (REPO / src).is_file():
                    return self.fragment_problem(l, src)
            if target in self.redirects or (REPO / target).is_file():
                return None
            return f"{l.raw}: no published page renders to {target}"
        if (REPO / target).exists():
            return None
        return f"{l.raw}: file does not exist"

    def fragment_problem(self, l: Link, page: str) -> str | None:
        if not l.fragment or PAGE_CHROME.fullmatch(l.fragment):
            return None
        if l.fragment in self.anchors(page):
            return None
        where = "this page" if page == l.page else page
        return f"{l.raw}: no heading or anchor #{l.fragment} on {where}"


# ---------------------------------------------------------------- git input

def git(*args: str) -> str:
    res = subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True,
                         encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} failed:\n{res.stderr.strip()}")
    return res.stdout


def git_changes(base: str, head: str, committed_only: bool, untracked: bool) -> list[Change]:
    try:
        mb = git("merge-base", base, head).strip()
    except SystemExit as e:
        raise SystemExit(f"{e}\nIs {base} fetched? Try: git fetch origin main") from None
    args = ["diff", "--name-status", "-z", "-M", mb]
    if committed_only or head != "HEAD":
        args.append(head)
    fields = git(*args).split("\0")
    out, i = [], 0
    while i < len(fields) and fields[i]:
        status = fields[i]
        if status[0] in "RC":
            out.append(Change(status[0], fields[i + 2], fields[i + 1] if status[0] == "R" else None))
            i += 3
        else:
            out.append(Change(status[0], fields[i + 1]))
            i += 2
    if untracked and not committed_only:
        for p in git("ls-files", "--others", "--exclude-standard", "-z").split("\0"):
            if p:
                out.append(Change("A", p))
    return out


def file_changes(files: list[str]) -> list[Change]:
    out = []
    for f in files:
        f = f.strip().replace("\\", "/")
        if not f:
            continue
        p = Path(f)
        if p.is_absolute():
            f = p.resolve().relative_to(REPO).as_posix()
        out.append(Change("M" if (REPO / f).exists() else "D", f))
    return out


# ------------------------------------------------------------------ running

@dataclass
class Result:
    name: str
    status: str          # pass, fail, warn, skip
    seconds: float = 0.0
    detail: list[str] = field(default_factory=list)


GHA = bool(os.environ.get("GITHUB_ACTIONS"))


def say(msg: str = "") -> None:
    print(msg, flush=True)


def annotate(level: str, msg: str) -> None:
    if GHA:
        say(f"::{level}::{msg}")


def child_env() -> dict:
    env = dict(os.environ)
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    return env


def run(cmd: list[str], quiet_pattern: re.Pattern | None = None) -> tuple[int, list[str]]:
    """Run a command, echo its output (minus lines matching quiet_pattern), return (code, lines)."""
    say("$ " + " ".join(cmd))
    proc = subprocess.Popen(cmd, cwd=REPO, env=child_env(), stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    lines = []
    assert proc.stdout
    for line in proc.stdout:
        line = line.rstrip("\n")
        lines.append(line)
        if not (quiet_pattern and quiet_pattern.search(line)):
            say("  " + line)
    return proc.wait(), lines


def tool(name: str) -> str:
    found = shutil.which(name)
    if not found:
        raise FileNotFoundError(name)
    return found


PY = sys.executable or "python3"


def bundle_failure(code: int) -> Result:
    return Result("", "fail", detail=[f"build_bundles.py exited {code}"])


REDIRECT_NOISE = re.compile(r"^redirects: WARNING target not rendered")


class Checker:
    def __init__(self, repo: Repo, plan: Plan, args) -> None:
        self.repo, self.plan, self.args = repo, plan, args
        self.results: list[Result] = []

    def step(self, name: str, fn: Callable[[], Result | None]) -> None:
        say("")
        say(f"== {name}")
        if GHA:
            say(f"::group::{name}")
        t0 = time.monotonic()
        try:
            r = fn() or Result(name, "pass")
        except FileNotFoundError as e:
            r = Result(name, "fail", detail=[f"{e.args[0] if e.args else e} not found on PATH"])
        except SystemExit as e:                        # a helper called sys.exit()
            r = Result(name, "fail", detail=[f"stopped: {e}"])
        except Exception as e:                         # report, keep going
            r = Result(name, "fail", detail=[f"{type(e).__name__}: {e}"])
        r.name = name
        r.seconds = time.monotonic() - t0
        if GHA:
            say("::endgroup::")
        for d in r.detail[:200]:
            say(f"  {d}")
            if r.status == "fail":
                annotate("error", f"{name}: {d}")
            elif r.status == "warn":
                annotate("warning", f"{name}: {d}")
        if len(r.detail) > 200:
            say(f"  ... and {len(r.detail) - 200} more")
        say(f"-- {name}: {r.status.upper()} ({r.seconds:.1f}s)")
        self.results.append(r)

    # ------------------------------------------------------------- steps
    def sitemap(self) -> Result:
        # Both generated files are includes Quarto resolves before its pre-render scripts run.
        # The command reference goes first: the site map runs `quarto inspect`, which needs
        # every include to exist.
        for script in ("scripts/command_reference.py", "scripts/generate_sitemap.py"):
            code, _ = run([PY, script])
            if code != 0:
                return Result("", "fail", detail=[f"{script}: exit {code}"])
        return Result("", "pass")

    def render_pages(self) -> Result:
        quarto = tool("quarto")
        index = REPO / "docs/books/index.md"
        # generate_book_metrics (a pre-render script) rewrites the books table on
        # every render; put it back afterwards so a local run leaves no edits.
        before = index.read_bytes() if index.is_file() else None
        failed, warns = [], []
        targets = render_targets(self.plan.pages, self.repo.published_pages())
        try:
            for i, target in enumerate(targets, 1):
                say(f"[{i}/{len(targets)}] {target}")
                t0 = time.monotonic()
                code, lines = run([quarto, "render", target, "--to", "html"], REDIRECT_NOISE)
                warns += [f"{target}: {l.strip()}" for l in lines if re.match(r"\s*(WARN|WARNING)\b", l)]
                say(f"  rendered in {time.monotonic() - t0:.1f}s" + ("" if code == 0 else f" (exit {code})"))
                if code != 0:
                    failed.append(f"{target}: quarto render exited {code}")
        finally:
            if before is not None and index.read_bytes() != before:
                index.write_bytes(before)
        if failed:
            return Result("", "fail", detail=failed + warns)
        return Result("", "warn" if warns else "pass", detail=warns)

    def render_full(self) -> Result:
        quarto = tool("quarto")
        detail = []
        if not self.args.skip_docx:
            code, _ = run([quarto, "render", "--to", "docx", "--output-dir", "_docx"], REDIRECT_NOISE)
            if code != 0:
                detail.append(f"quarto render --to docx exited {code}")
        code, lines = run([quarto, "render", "--to", "html"], REDIRECT_NOISE)
        if code != 0:
            detail.append(f"quarto render --to html exited {code}")
        warns = [l.strip() for l in lines if re.match(r"\s*(WARN|WARNING)\b", l)]
        if detail:
            return Result("", "fail", detail=detail + warns)
        return Result("", "warn" if warns else "pass", detail=warns)

    def link_check(self) -> Result:
        """Outbound links of the pages in scope, inbound anchor links to the changed
        pages, and links to removed files. In the FULL tier every published page is
        in scope, but a problem only fails the run if this change touched the page
        or the link's target; the rest are reported as warnings (already on main)."""
        repo, plan = self.repo, self.plan
        full = plan.tier == "FULL"
        scope = set(repo.published_pages() if full else plan.pages)
        touched = set(plan.pages) | set(plan.deleted)
        touched_html = {posixpath.splitext(p)[0] + ".html" for p in touched if is_page(p)}
        errors, warns = [], []

        def report(l: Link, why: str) -> None:
            mine = (not full or l.page in touched or l.path in touched or l.path in touched_html)
            if not repo.published(l.page):
                warns.append(f"{l.page}:{l.line} (unpublished page): {why}")
            elif mine:
                errors.append(f"{l.page}:{l.line}: {why}")
            else:
                warns.append(f"{l.page}:{l.line} (not changed here): {why}")

        all_links = repo.all_links()
        outbound = inbound = 0
        for l in all_links:
            if l.page in scope:
                outbound += 1
                why = repo.link_problem(l)
                if why:
                    report(l, why)
        # Inbound: links from anywhere under docs/ to a changed page's anchors,
        # so a renamed heading that another book links to is caught.
        targets = set(plan.direct_pages)
        html_of = {posixpath.splitext(p)[0] + ".html": p for p in targets}
        gone = set(plan.deleted)
        gone_html = {posixpath.splitext(p)[0] + ".html" for p in gone if is_page(p)}
        for l in all_links:
            if l.page in scope:
                continue
            page = l.path if l.path in targets else html_of.get(l.path)
            if page and l.fragment:
                inbound += 1
                why = repo.fragment_problem(l, page)
                if why:
                    report(l, why)
            # Links to files this change deleted or renamed away.
            if (l.path in gone or (l.path in gone_html and l.path not in repo.redirects))                     and not (REPO / l.path).exists():
                report(l, f"{l.raw}: links to {l.path}, which this change removes")
        summary = f"{outbound} links on {len(scope)} page(s), {inbound} inbound anchor link(s)"
        say(f"  {summary}")
        status = "fail" if errors else ("warn" if warns else "pass")
        return Result("", status, detail=errors + warns + ([] if errors or warns else [summary]))

    def footnote_check(self) -> Result:
        """Notes on each page in scope (undefined, duplicated, unused), and note
        names unique across each Word bundle that holds a page in scope."""
        repo, plan = self.repo, self.plan
        full = plan.tier == "FULL"
        scope = set(repo.published_pages() if full else plan.pages)
        changed = set(plan.pages)
        errors, warns = [], []

        def report(page: str, msg: str) -> None:
            if not full or page in changed:
                errors.append(msg)
            else:
                warns.append(msg + " (not changed here)")

        for page in sorted(scope):
            if not (REPO / page).is_file():
                continue
            defs, refs = footnotes(repo.full_text(page))
            names = [d for d, _ in defs]
            ref_names = {r for r, _ in refs}
            for name, line in defs:
                if names.count(name) > 1:
                    report(page, f"{page}:{line}: note [^{name}] is defined more than once on the page")
                if name not in ref_names:
                    warns.append(f"{page}:{line}: note [^{name}] is defined but never referenced")
            for name, line in refs:
                if name not in names:
                    report(page, f"{page}:{line}: note [^{name}] is referenced but not defined")
        # Unique across each Word bundle: it joins its pages into one document.
        bundles = [b for b in repo.bundles() if full or {rel(p) for p in b.pages} & scope]
        for b in bundles:
            pages = [rel(p) for p in b.pages]
            mine = not full or bool(changed & set(pages))
            seen: dict[str, str] = {}
            for page in pages:
                for name, line in footnotes(repo.full_text(page))[0]:
                    if name in seen and seen[name] != page:
                        msg = (f"{page}:{line}: note [^{name}] is also defined in {seen[name]}; "
                               f"{b.output} joins both, so note names must be unique in the book")
                        (errors if mine else warns).append(msg if mine else msg + " (not changed here)")
                    seen.setdefault(name, page)
        errors, warns = sorted(set(errors)), sorted(set(warns))
        status = "fail" if errors else ("warn" if warns else "pass")
        note = f"{len(scope)} page(s), {len(bundles)} bundle(s)"
        say(f"  {note}")
        return Result("", status, detail=errors + warns + ([] if errors or warns else [note]))

    def bundles_changed(self) -> Result:
        scope = set(self.plan.pages)
        names = [b.output for b in self.repo.bundles() if {rel(p) for p in b.pages} & scope]
        if not names:
            return Result("", "skip", detail=["no Word bundle contains a changed page"])
        out = Path(tempfile.mkdtemp(prefix="pr-bundles-"))
        try:
            code, _ = run([PY, "scripts/build_bundles.py", "--only", *names, "--out", str(out)])
        finally:
            shutil.rmtree(out, ignore_errors=True)
        if code == 0:
            return Result("", "pass", detail=[f"built {', '.join(names)}"])
        return bundle_failure(code)

    def bundles_full(self) -> Result:
        code, _ = run([PY, "scripts/build_bundles.py", "--out", "_site/downloads"])
        return Result("", "pass") if code == 0 else bundle_failure(code)

    def kits(self, kits: list[str], out: str | None) -> Result:
        tmp = None if out else Path(tempfile.mkdtemp(prefix="pr-kits-"))
        dest = out or str(tmp)
        failed = []
        try:
            for kit in kits:
                code, _ = run([PY, "scripts/build_start_kit_zip.py", "--kit", kit, "--out", dest])
                if code != 0:
                    failed.append(f"{kit}: build_start_kit_zip.py exited {code}")
        finally:
            if tmp:
                shutil.rmtree(tmp, ignore_errors=True)
        return Result("", "fail" if failed else "pass", detail=failed or [f"built {', '.join(kits)}"])

    def redirects(self) -> Result:
        code, _ = run([PY, "scripts/write_redirects.py", "--check"])
        detail = [] if code == 0 else [f"write_redirects.py --check exited {code}"]
        # Every redirect must land on a page the site publishes.
        for old, new in sorted(self.repo.redirects.items()):
            stem = new[:-5] if new.endswith(".html") else new
            if not any(self.repo.published(stem + s) and (REPO / (stem + s)).is_file() for s in PAGE_SUFFIXES):
                detail.append(f"{old} -> {new}: no published page renders to the target")
        site = REPO / "_site"
        if self.plan.tier == "FULL" and site.is_dir():
            for old, new in sorted(self.repo.redirects.items()):
                if not (site / new).is_file():
                    detail.append(f"{old} -> {new}: target missing from the rendered _site")
            note = "targets checked against the rendered _site"
        else:
            note = "no full render in this run, so targets were checked against the published sources, not _site"
        if detail:
            return Result("", "fail", detail=detail)
        return Result("", "pass", detail=[f"{len(self.repo.redirects)} redirects valid; {note}"])

    def a11y(self) -> Result:
        decks = self.plan.tasks.get("a11y", [])
        cmd = [PY, "presentations/_build/a11y_check.py"]
        if decks != ["*"]:
            cmd += decks
        code, _ = run(cmd)
        return Result("", "pass" if code == 0 else "fail", detail=[] if code == 0 else ["deck accessibility problems (see log)"])

    def simple(self, cmd: list[str]) -> Callable[[], Result]:
        def go() -> Result:
            code, _ = run(cmd)
            return Result("", "pass" if code == 0 else "fail", detail=[] if code == 0 else [f"exit {code}"])
        return go

    # ------------------------------------------------------------- tiers
    def steps(self) -> list[tuple[str, Callable[[], Result | None]]]:
        p, a = self.plan, self.args
        steps: list[tuple[str, Callable]] = []
        if p.tier == "FULL":
            steps += [
                ("Generate site map and command reference", self.sitemap),
                ("Render site" + ("" if a.skip_docx else " (DOCX, then HTML)"), self.render_full),
                ("Links and anchors (every published page)", self.link_check),
                ("Footnotes (every page and bundle)", self.footnote_check),
                ("Word bundles (all)", self.bundles_full),
                ("Kit zips (all)", lambda: self.kits(list(self.repo.kits), "_site/downloads")),
                ("Redirects", self.redirects),
                ("Video manifest is current", self.simple([PY, "scripts/generate_video_manifest.py", "--check"])),
                ("Revision histories and the Archive are current",
                 self.simple([PY, "scripts/generate_revisions.py", "--check"])),
                ("Deck links reach the edition's Release", self.simple([PY, "scripts/deck_assets.py", "links", "--check"])),
            ]
        elif p.tier == "CHANGED":
            steps += [
                ("Generate site map and command reference", self.sitemap),
                (f"Render {len(p.pages)} page(s) to HTML", self.render_pages),
                ("Links and anchors (changed pages, inbound)", self.link_check),
                ("Footnotes (changed pages, their bundles)", self.footnote_check),
                ("Word bundles (containing a changed page)", self.bundles_changed),
                ("Redirects", self.redirects),
            ]
        elif p.deleted:
            steps.append(("Links to removed files", self.link_check))
        t = p.tasks
        if "kits" in t and p.tier != "FULL":
            steps.append((f"Kit zips ({', '.join(t['kits'])})", lambda: self.kits(t["kits"], None)))
        if "a11y" in t:
            steps.append(("Deck accessibility" + (" (every deck)" if t["a11y"] == ["*"] else f" ({len(t['a11y'])} deck(s))"),
                          self.a11y))
        if "video-manifest" in t and p.tier != "FULL":
            steps.append(("Video manifest is current", self.simple([PY, "scripts/generate_video_manifest.py", "--check"])))
        if "deck-links" in t and p.tier != "FULL":
            steps.append(("Deck links reach the edition's Release",
                          self.simple([PY, "scripts/deck_assets.py", "links", "--check"])))
        if "revisions" in t and p.tier != "FULL":
            steps.append(("Revision histories and the Archive are current",
                          self.simple([PY, "scripts/generate_revisions.py", "--check"])))
        if "kit-captures" in t:
            for wb in t["kit-captures"]:
                steps.append((f"Lab captures match what the kit prints ({wb})",
                              self.simple([PY, "scripts/kit_captures.py", wb, "--check"])))
        if "labs" in t:
            steps.append(("Labs page and guide lab links are current", self.simple([PY, "scripts/generate_labs.py", "--check"])))
        if "project-plans" in t:
            steps.append(("Project plans are current", self.simple([PY, "scripts/project_plans/build.py", "--check"])))
        if "authorities" in t:
            steps.append(("Authorities tables match the spine",
                          self.simple([PY, "scripts/render_authorities_table.py", "--check"])))
        if "command-help" in t:
            steps.append(("Every example command has a synopsis and an example",
                          self.simple([PY, "scripts/command_reference.py", "--check"])))
        if "evidence-maps" in t:
            steps.append(("Evidence maps follow the rules; summaries current",
                          self.simple([PY, "scripts/check_evidence_maps.py", "--check"])))
        if "neutrality" in t:
            every_file = t["neutrality"] == ["*"]
            steps.append(("Agency neutrality" + (" (every file)" if every_file else f" ({len(t['neutrality'])} file(s))"),
                          self.simple([PY, "scripts/check_neutrality.py"] + ([] if every_file else t["neutrality"]))))
        if "example-tests" in t:
            every_kit = t["example-tests"] == ["*"]
            steps.append(("Example kit tests" + (" (every kit)" if every_kit else f" ({', '.join(t['example-tests'])})"),
                          self.simple([PY, "scripts/run_example_tests.py"] + (["--all"] if every_kit else t["example-tests"]))))
        if "unit-tests" in t:
            steps.append(("Unit tests (scripts/tests)", self.simple([PY, "-m", "unittest", "discover", "-s", "scripts/tests", "-v"])))
        return steps


# ------------------------------------------------------------------ report

def print_plan(plan: Plan, changes: list[Change], steps: list[str]) -> None:
    say(f"Tier: {plan.tier}")
    for r in plan.reasons[:20]:
        say(f"  because {r}")
    if len(plan.reasons) > 20:
        say(f"  ... and {len(plan.reasons) - 20} more reasons")
    say(f"Changed files: {len(changes)}")
    if plan.pages:
        say(f"Published pages affected: {len(plan.pages)}")
        for p in plan.pages[:40]:
            extra = f"  (embeds {', '.join(plan.image_pages[p])})" if p in plan.image_pages else ""
            say(f"  {p}{extra}")
        if len(plan.pages) > 40:
            say(f"  ... and {len(plan.pages) - 40} more")
    if plan.deleted:
        say(f"Removed: {len(plan.deleted)} file(s)")
        for p in plan.deleted[:20]:
            say(f"  {p}")
        if len(plan.deleted) > 20:
            say(f"  ... and {len(plan.deleted) - 20} more")
    say("Steps:")
    for s in steps:
        say(f"  - {s}")
    if not steps:
        say("  (nothing to run)")


def summary_markdown(plan: Plan, results: list[Result], total: float) -> str:
    icon = {"pass": "pass", "fail": "**FAIL**", "warn": "warn", "skip": "skip"}
    lines = [f"## Pre-merge check: {plan.tier} tier", ""]
    lines += [f"- {r}" for r in plan.reasons[:15]]
    if len(plan.reasons) > 15:
        lines.append(f"- ... and {len(plan.reasons) - 15} more")
    if plan.pages and plan.tier == "CHANGED":
        lines += ["", f"Pages rendered: {len(plan.pages)}", ""]
        lines += [f"- `{p}`" for p in plan.pages]
    lines += ["", "| Check | Result | Seconds |", "|---|---|---:|"]
    lines += [f"| {r.name} | {icon[r.status]} | {r.seconds:.0f} |" for r in results]
    lines += ["", f"Total: {total / 60:.1f} min"]
    for r in results:
        if r.status in ("fail", "warn") and r.detail:
            lines += ["", f"<details><summary>{r.name}: {len(r.detail)} item(s)</summary>", ""]
            lines += [f"- {html.escape(d)}" for d in r.detail[:100]]
            if len(r.detail) > 100:
                lines.append(f"- ... and {len(r.detail) - 100} more")
            lines += ["", "</details>"]
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")   # type: ignore[attr-defined]
        except AttributeError:
            pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0], fromfile_prefix_chars="@",
                                 formatter_class=argparse.RawDescriptionHelpFormatter,
                                 epilog="Tiers and checks: see CONTRIBUTING.md, 'Checking a pull request'.")
    ap.add_argument("--base", default="origin/main", help="base ref to diff against (default origin/main)")
    ap.add_argument("--head", default="HEAD", help="head ref (default HEAD; another ref plans only, checks run on the working tree)")
    ap.add_argument("--files", nargs="+", metavar="PATH", help="use these changed files instead of git (@FILE reads a list)")
    ap.add_argument("--committed-only", action="store_true", help="ignore uncommitted edits")
    ap.add_argument("--include-untracked", action="store_true", help="count untracked files as added")
    ap.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES,
                    help=f"more affected pages than this means FULL (default {DEFAULT_MAX_PAGES})")
    ap.add_argument("--force-full", action="store_true", help="run the FULL tier whatever changed")
    ap.add_argument("--skip-docx", action="store_true", help="FULL tier: skip the per-page DOCX render")
    ap.add_argument("--dry-run", action="store_true", help="print the tier and the plan, run nothing")
    args = ap.parse_args(argv)

    t0 = time.monotonic()
    changes = file_changes(args.files) if args.files else git_changes(
        args.base, args.head, args.committed_only, args.include_untracked)
    repo = Repo()
    includes = repo.include_targets()
    plan = decide(
        changes,
        published=repo.published,
        listing_pages=repo.listing_pages(),
        include_targets=includes,
        image_users=repo.image_users(c.path for c in changes if c.status != "D"),
        max_pages=args.max_pages,
        force_full=args.force_full,
    )
    plan.tasks = non_site_tasks(changes, repo.kits, repo.kit_bundles)
    checker = Checker(repo, plan, args)
    steps = checker.steps()
    source = "--files" if args.files else f"{args.base}...{args.head}" + (
        "" if args.committed_only or args.head != "HEAD" else " (+ uncommitted edits)")
    say(f"Changes: {source}")
    print_plan(plan, changes, [s for s, _ in steps])
    say(f"Planned in {time.monotonic() - t0:.1f}s")
    if args.dry_run:
        return 0

    for name, fn in steps:
        checker.step(name, fn)
    total = time.monotonic() - t0
    results = checker.results
    say("")
    say("=" * 72)
    say(f"Tier {plan.tier}: {'; '.join(plan.reasons[:3])}{' ...' if len(plan.reasons) > 3 else ''}")
    for r in results:
        say(f"  {r.status.upper():5} {r.seconds:7.1f}s  {r.name}")
    failed = [r for r in results if r.status == "fail"]
    say(f"{len(results) - len(failed)} of {len(results)} checks passed in {total / 60:.1f} min"
        + (f"; FAILED: {', '.join(r.name for r in failed)}" if failed else ""))
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_file:
        with open(summary_file, "a", encoding="utf-8") as fh:
            fh.write(summary_markdown(plan, results, total))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
