#!/usr/bin/env python3
"""Write the workbook's plain-text exports for AI tools into the rendered site.

    python3 scripts/build_ai_exports.py --site _site

Run it after `quarto render`. For every page the site published (an .html file
in the site folder whose .md or .qmd source is in the repository) it writes:

  <page>.md                       the page as Markdown, beside its .html, with its
                                  title, its address and absolute links
  llms.txt                        an index of every page, in the llms.txt format
                                  (https://llmstxt.org/), grouped by book and type
  llms-full/<area>.md             each book, the guides, the training paths and so
                                  on as one file, every page headed by its address
  downloads/fmw-knowledge-pack.zip  llms.txt, the full-text files as .txt and a
                                  README, to load into a reader's own approved AI tool

Nothing is sent anywhere: the files are static and the reader's tool reads them.
`--check` builds everything in a temporary folder from a site folder and reports
the counts, writing nothing into it.
"""
from __future__ import annotations

import argparse
import datetime as dt
import io
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PACK_NAME = "fmw-knowledge-pack.zip"
SITE_TITLE = "Federal Modernization Workbook"
SUMMARY = ("Topic books, implementation guides, developer workbooks, training paths and reference "
           "pages for federal IT modernization: identity, devices, network, cloud boundary, Zero Trust, "
           "security operations, governance and compliance, written for Microsoft 365 GCC Moderate "
           "or an equivalent tenant.")
CREDIT = (f"*{SITE_TITLE}*, by Michael F. Stratton, https://whalermike.github.io/modernization-workbook/, "
          "licensed under CC BY-NC-ND 4.0.")
# Generated listings, too long and too repetitive to help in a full-text file. Each
# still gets its own .md page and its line in llms.txt, under Optional.
OPTIONAL = {"docs/reference/learn-coverage.md", "docs/about/archive.md"}

FRONT = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)
INCLUDE = re.compile(r"\{\{<\s*include\s+(\S+?)\s*>\}\}")
SHORTCODE = re.compile(r"\{\{<.*?>\}\}", re.S)
COMMENT = re.compile(r"<!--.*?-->", re.S)
# A Markdown link or image target: ](target) or ](target "title").
LINK = re.compile(r"(\]\()([^)\s]+)((?:\s+\"[^\"]*\")?\))")
ABSOLUTE = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//|#)", re.I)


@dataclass
class Page:
    source: str                 # repository path, POSIX: docs/books/b07-pki/01-x.md
    html: str                   # site path: docs/books/b07-pki/01-x.html
    title: str
    description: str
    body: str = ""
    area: str = ""
    order: tuple = field(default_factory=tuple)

    @property
    def md(self) -> str:
        return self.html[:-5] + ".md"


@dataclass
class Area:
    key: str
    title: str
    rank: tuple
    pages: list[Page] = field(default_factory=list)


def site_url() -> str:
    text = (REPO / "_quarto.yml").read_text(encoding="utf-8")
    m = re.search(r"^\s*site-url:\s*(\S+)", text, re.M)
    url = m.group(1).strip("\"'") if m else "https://whalermike.github.io/modernization-workbook/"
    return url.rstrip("/") + "/"


def front_value(front: str, key: str) -> str:
    m = re.search(rf"^{re.escape(key)}:\s*(.+?)\s*$", front, re.M)
    if not m:
        return ""
    value = m.group(1).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value.replace('\\"', '"')


def split_front(text: str) -> tuple[str, str]:
    m = FRONT.match(text)
    return (m.group(1), text[m.end():]) if m else ("", text)


def resolve_includes(text: str, base: Path, depth: int = 0) -> str:
    """Inline {{< include file >}} as Quarto does: relative to the including file,
    or to the project root when the path starts with /."""
    def one(m: re.Match) -> str:
        target = m.group(1).strip("\"'")
        path = (REPO / target.lstrip("/")) if target.startswith("/") else (base / target)
        if depth > 4 or not path.is_file():
            return ""
        _, inner = split_front(path.read_text(encoding="utf-8"))
        return resolve_includes(inner, path.parent, depth + 1)
    return INCLUDE.sub(one, text)


def absolute_links(text: str, source: str, base_url: str) -> str:
    """Point every relative link at the published site: pages at their .html address."""
    folder = Path(source).parent

    def one(m: re.Match) -> str:
        target = m.group(2)
        if ABSOLUTE.match(target):
            return m.group(0)
        path, _, frag = target.partition("#")
        resolved = (folder / path).as_posix() if path else source
        parts: list[str] = []
        for part in resolved.split("/"):
            if part == "..":
                if parts:
                    parts.pop()
            elif part not in ("", "."):
                parts.append(part)
        resolved = "/".join(parts)
        if resolved.endswith((".md", ".qmd")):
            resolved = resolved.rsplit(".", 1)[0] + ".html"
        url = base_url + resolved + (f"#{frag}" if frag else "")
        return f"{m.group(1)}{url}{m.group(3)}"
    return LINK.sub(one, text)


def clean_body(text: str, source: str, base_url: str) -> str:
    text = resolve_includes(text, (REPO / source).parent)
    text = SHORTCODE.sub("", text)
    text = COMMENT.sub("", text)
    text = absolute_links(text, source, base_url)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def published_pages(site: Path) -> list[Page]:
    pages = []
    for html in sorted(site.rglob("*.html")):
        rel = html.relative_to(site).as_posix()
        if rel.startswith(("site_libs/", "pagefind/")) or "/_" in "/" + rel or rel == "404.html":
            continue
        stem = rel[:-5]
        for suffix in (".md", ".qmd"):
            src = REPO / (stem + suffix)
            if src.is_file():
                front, _ = split_front(src.read_text(encoding="utf-8"))
                title = front_value(front, "title") or Path(stem).name.replace("-", " ")
                pages.append(Page(stem + suffix, rel, title, front_value(front, "description")))
                break
    return pages


BOOK = re.compile(r"docs/books/(b(\d\d)-[^/]+)/")
WORKBOOK = re.compile(r"docs/project-plans/developer-workbooks/([^/]+)/")


def area_of(source: str) -> tuple[str, str, tuple]:
    """Key, fallback title and sort rank of the full-text file a page belongs to."""
    if source in ("index.qmd", "workbook-map.qmd", "docs/start-here.md", "docs/downloads.md"):
        return "start", "Start here", (0,)
    m = BOOK.match(source)
    if m:
        return m.group(1), m.group(1), (1, int(m.group(2)))
    for prefix, key, title, rank in (
        ("docs/books/guides/", "guides", "Implementation guides", 2),
        ("docs/books/explainers/", "explainers", "Explainers", 3),
        ("docs/training/", "training", "Training paths", 4),
        ("docs/evaluations/", "evaluations", "Evaluations", 6),
        ("docs/reference/", "reference", "Reference pages", 7),
    ):
        if source.startswith(prefix):
            return key, title, (rank,)
    m = WORKBOOK.match(source)
    if m:
        return f"workbook-{m.group(1)}", m.group(1), (5, m.group(1))
    if source.startswith("docs/project-plans/"):
        return "project-plans", "Project plans", (5, "")
    return "about", "About the workbook and its presentations", (8,)


def build_areas(pages: list[Page]) -> list[Area]:
    areas: dict[str, Area] = {}
    for p in pages:
        key, title, rank = area_of(p.source)
        p.area = key
        areas.setdefault(key, Area(key, title, rank)).pages.append(p)
    for a in areas.values():
        # The area's own landing page: its top-most index (project-plans/index.md, not
        # project-plans/developer-workbooks/index.md).
        indexes = [p for p in a.pages if p.source.endswith(("/index.md", "/index.qmd"))]
        index = min(indexes, key=lambda p: p.source.count("/"), default=None)
        if index and a.key not in ("start", "about", "reference", "training", "evaluations", "guides", "explainers"):
            a.title = index.title
        # The area's landing page first, then the rest in file order (chapters are numbered).
        a.pages.sort(key=lambda p: (p is not index, p.source))
    return sorted(areas.values(), key=lambda a: a.rank)


def page_markdown(p: Page, base_url: str) -> str:
    """The page with its address under its title, so a reader's tool can cite it."""
    head = f"Source: {base_url}{p.html}\n"
    if p.description:
        head += f"\n> {p.description}\n"
    body = p.body.lstrip()
    if body.startswith("# "):           # most pages open with their own title heading
        first, _, rest = body.partition("\n")
        return f"{first}\n\n{head}\n{rest.lstrip()}"
    return f"# {p.title}\n\n{head}\n{body}"


def short(text: str, limit: int = 160) -> str:
    """A description cut at a word boundary, for the llms.txt index."""
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "…"


def tokens(text: str) -> int:
    return len(text) // 4


def llms_txt(areas: list[Area], base_url: str, built: str, full_sizes: dict[str, int]) -> str:
    out = [f"# {SITE_TITLE}", "", f"> {SUMMARY}", "",
           "An independent technical workbook by one author. It is not an official U.S. government website "
           "and is not reviewed or endorsed by any federal agency. Recommendations say what a step supports; "
           "only an assessor or authorizing official decides that a control is satisfied.", "",
           f"Content license: CC BY-NC-ND 4.0; credit it as {CREDIT} Code in examples/ is MIT.", "",
           "Each link below is a Markdown copy of one page; the page itself is the same address ending in .html. "
           "The Full text section has each book and section as one file, every page in it headed by its address, "
           f"and {PACK_NAME} has all of them to load into your own approved AI tool. Built {built}.", "",
           "## Full text", ""]
    for a in areas:
        out.append(f"- [{a.title}]({base_url}llms-full/{a.key}.md): "
                   f"{len([p for p in a.pages if p.source not in OPTIONAL])} pages, "
                   f"about {full_sizes[a.key] // 1000:,}k tokens")
    out.append(f"- [Knowledge pack]({base_url}downloads/{PACK_NAME}): every full-text file as .txt, with a README")
    optional = []
    for a in areas:
        out += ["", f"## {a.title}", ""]
        for p in a.pages:
            line = f"- [{p.title}]({base_url}{p.md})" + (f": {short(p.description)}" if p.description else "")
            (optional if p.source in OPTIONAL else out).append(line)
    if optional:
        out += ["", "## Optional", ""] + optional
    return "\n".join(out) + "\n"


def pack_readme(areas: list[Area], base_url: str, built: str, commit: str, sizes: dict[str, int]) -> str:
    rows = "\n".join(f"  full/{a.key}.txt  {a.title} (about {sizes[a.key] // 1000:,}k tokens)" for a in areas)
    low, high = min(sizes.values()) // 1000, max(sizes.values()) // 1000
    return f"""{SITE_TITLE}: knowledge pack
Built {built} from commit {commit} of {base_url}

What this is
  The workbook's published pages as plain text (Markdown inside .txt files), one
  file per book or section, for a reader to load into an AI tool their
  organization already approves. Nothing in it is new: every page is on the
  site, and each page in these files starts with its title and its address, so
  an answer can point back to the page.

  It is a snapshot. The site changes; download the pack again for the current
  text, or check the page address an answer cites.

Files
  llms.txt  the index of every page, with its address
{rows}

How to use it
  - Load only the files you need. Files run from about {low:,}k to {high:,}k
    tokens; a tool with a small context window needs the smaller ones.
  - Ask the tool to answer only from the files, and to give the Source address of
    each page it uses. A starting instruction:

      Answer from the attached Federal Modernization Workbook files only. After
      each answer, list the Source address of every page you used. If the files
      don't cover the question, say so.

  - Microsoft 365 Copilot: an agent can use these files as knowledge. In GCC,
    put them in OneDrive or SharePoint and select them from there; uploading
    files from your device isn't supported there. The Copilot agent pack README
    walks through the steps:
    https://github.com/WhalerMike/modernization-workbook/tree/main/examples/copilot-agent-pack
  - Use any AI tool only under your organization's AI policy. Don't add your
    organization's own data to a tool or agent built from this pack unless that
    policy allows it.

Status
  Independent technical analysis by one author. Not an official U.S.
  government website; not reviewed or endorsed by any federal agency. A page
  supports a control or requirement; only an assessor or authorizing official
  decides that one is satisfied.

License
  Content: CC BY-NC-ND 4.0. You may share it unchanged, with credit, at no
  charge. Credit: {CREDIT}
  Code blocks inside pages: MIT. Full terms:
  https://github.com/WhalerMike/modernization-workbook/blob/main/LICENSE.md
"""


def git_commit() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=REPO, capture_output=True,
                              text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def build(site: Path, out: Path) -> dict[str, int]:
    base_url = site_url()
    built = dt.date.today().isoformat()
    pages = published_pages(site)
    if not pages:
        raise SystemExit(f"build_ai_exports: no published pages found in {site}; render the site first")
    for p in pages:
        _, body = split_front((REPO / p.source).read_text(encoding="utf-8"))
        p.body = clean_body(body, p.source, base_url)
    areas = build_areas(pages)

    for p in pages:
        dest = out / p.md
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(page_markdown(p, base_url), encoding="utf-8", newline="\n")

    full_dir = out / "llms-full"
    full_dir.mkdir(parents=True, exist_ok=True)
    full_text: dict[str, str] = {}
    for a in areas:
        parts = [f"# {a.title}\n\nFrom the {SITE_TITLE}, {base_url} (built {built}). {CREDIT}\n"]
        parts += [page_markdown(p, base_url) for p in a.pages if p.source not in OPTIONAL]
        full_text[a.key] = "\n\n---\n\n".join(parts)
        (full_dir / f"{a.key}.md").write_text(full_text[a.key], encoding="utf-8", newline="\n")
    sizes = {k: tokens(v) for k, v in full_text.items()}

    index = llms_txt(areas, base_url, built, sizes)
    (out / "llms.txt").write_text(index, encoding="utf-8", newline="\n")

    downloads = out / "downloads"
    downloads.mkdir(parents=True, exist_ok=True)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        stamp = (1980, 1, 1, 0, 0, 0)          # fixed, so the same sources give the same zip
        def add(name: str, text: str) -> None:
            info = zipfile.ZipInfo(f"fmw-knowledge-pack/{name}", stamp)
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, text.encode("utf-8"))
        add("README.txt", pack_readme(areas, base_url, built, git_commit(), sizes))
        add("llms.txt", index)
        for a in areas:
            add(f"full/{a.key}.txt", full_text[a.key])
    (downloads / PACK_NAME).write_bytes(buf.getvalue())
    return {"pages": len(pages), "areas": len(areas), "tokens": sum(sizes.values()),
            "llms_bytes": len(index.encode("utf-8")), "pack_bytes": len(buf.getvalue())}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--site", default="_site", help="the rendered site folder (default _site)")
    ap.add_argument("--check", action="store_true", help="build into a temporary folder and report; write nothing")
    args = ap.parse_args(argv)
    site = (REPO / args.site) if not Path(args.site).is_absolute() else Path(args.site)
    if not site.is_dir():
        print(f"build_ai_exports: {site} doesn't exist; render the site first", file=sys.stderr)
        return 1
    tmp = Path(tempfile.mkdtemp(prefix="ai-exports-")) if args.check else None
    try:
        stats = build(site, tmp or site)
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
    print(f"build_ai_exports: {stats['pages']} pages in {stats['areas']} full-text files "
          f"(about {stats['tokens'] // 1000:,}k tokens); llms.txt {stats['llms_bytes'] // 1024} KB; "
          f"{PACK_NAME} {stats['pack_bytes'] // 1024} KB" + (" (check only, nothing written)" if tmp else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
