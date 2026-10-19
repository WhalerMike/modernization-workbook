#!/usr/bin/env python3
"""Build the site's downloadable Word bundles from the source Markdown.

Every bundle is defined in scripts/bundles.yml by an ordered page manifest.
The script builds each one directly from the source .md files (not from
Quarto's rendered .docx output), with a title page, a Word table of contents,
and every referenced image embedded at its position with its caption.

Usage (from anywhere in the repo; needs Quarto, which bundles pandoc, and
rsvg-convert if any bundled page uses an SVG image):

    python3 scripts/build_bundles.py                    # build every bundle
    python3 scripts/build_bundles.py --only Book_07-bundle.docx
    python3 scripts/build_bundles.py --list             # show manifests, build nothing
    python3 scripts/build_bundles.py --out DIR --jobs N

Default output directory: _site/downloads (the site's /downloads/ URL).
The "Deploy Quarto Site" workflow runs `python3 scripts/build_bundles.py`.

For each bundle the script:
  1. Expands the manifest (see "Manifest rules" in bundles.yml). Only pages
     the site actually publishes (per `project.render` in _quarto.yml) are
     included. A missing literal page fails the build; glob entries simply
     follow the folder, so deleting a page never breaks the build.
  2. Prepares each page: drops the YAML front matter, resolves Quarto
     `{{< meta >}}` and `{{< include >}}` shortcodes, and adds the page title
     as a heading if the body has no level-1 heading.
  3. Resolves every image relative to the page that references it. A missing
     image fails the build. SVGs are converted to PNG, and files whose
     extension does not match their content are copied with the right one.
  4. Runs pandoc once over the pages with scripts/bundle-filter.lua, which
     removes web-only navigation, download callouts and listings, and turns
     links to other pages into plain text.
  5. Verifies that every referenced image is embedded in the .docx.

After building everything, the script checks that every download link to
downloads/*.docx on a published page points at a file that was built, and
fails if one does not.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
CONFIG = REPO / "scripts/bundles.yml"
FILTER = REPO / "scripts/bundle-filter.lua"
DEFAULT_OUT = REPO / "_site/downloads"
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".bmp", ".tif", ".tiff", ".emf", ".wmf"}
GLOB_CHARS = set("*?[")


# ---------------------------------------------------------------- utilities

def log(msg: str) -> None:
    print(msg, flush=True)


def warn(msg: str) -> None:
    if os.environ.get("GITHUB_ACTIONS"):
        print(f"::warning::{msg}", flush=True)
    else:
        print(f"WARNING: {msg}", file=sys.stderr, flush=True)


class BuildError(Exception):
    pass


def fail(msg: str) -> None:
    if os.environ.get("GITHUB_ACTIONS"):
        print(f"::error::{msg}", flush=True)
    print(f"ERROR: {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def rel(p: Path) -> str:
    try:
        return p.relative_to(REPO).as_posix()      # posix, so the render globs also match on Windows
    except ValueError:
        return str(p)


def natural_key(s: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def glob_regex(pattern: str) -> re.Pattern:
    """Translate a path glob (with ** for any number of folders) to a regex."""
    out, i = "", 0
    while i < len(pattern):
        c = pattern[i]
        if pattern.startswith("**/", i):
            out += r"(?:.*/)?"
            i += 3
            continue
        if pattern.startswith("**", i):
            out += r".*"
            i += 2
            continue
        if c == "*":
            out += r"[^/]*"
        elif c == "?":
            out += r"[^/]"
        elif c == "[":
            j = pattern.index("]", i)
            out += pattern[i:j + 1]
            i = j
        else:
            out += re.escape(c)
        i += 1
    return re.compile(out + r"\Z")


# ------------------------------------------------------ table of contents

TOC_FIELD = re.compile(
    r'<w:p><w:r><w:fldChar w:fldCharType="begin"[^>]*/>(<w:instrText[^>]*>TOC [^<]*</w:instrText>)'
    r'<w:fldChar w:fldCharType="separate"\s*/><w:fldChar w:fldCharType="end"\s*/></w:r></w:p>')
PARAGRAPH = re.compile(r"<w:p>(?:(?!</w:p>).)*?</w:p>", re.S)
HEADING = re.compile(r'<w:p><w:pPr><w:pStyle w:val="Heading(\d)"\s*/>.*?</w:pPr>', re.S)
TOC_STYLES = "".join(
    f'<w:style w:type="paragraph" w:styleId="TOC{n}"><w:name w:val="toc {n}"/><w:basedOn w:val="Normal"/>'
    f'<w:next w:val="Normal"/><w:uiPriority w:val="39"/><w:unhideWhenUsed/>'
    f'<w:pPr><w:spacing w:before="{120 if n == 1 else 0}" w:after="0"/><w:ind w:left="{(n - 1) * 240}"/></w:pPr>'
    f'{"<w:rPr><w:b/></w:rPr>" if n == 1 else ""}</w:style>'
    for n in range(1, 4))


def fill_toc(docx: Path, depth: int) -> int:
    """Give pandoc's empty TOC field a cached result, so the contents show on open.

    pandoc writes the TOC as a field with no result: Word shows an empty table
    until someone updates fields, and Protected View (every downloaded file)
    never does. This bookmarks each heading down to `depth`, writes one
    hyperlinked entry per heading as the field's result, and adds the TOC
    paragraph styles. The field stays dirty, so Word still offers to update it
    and add page numbers. Returns the number of entries written.
    """
    with zipfile.ZipFile(docx) as z:
        infos = z.infolist()
        parts = {i.filename: z.read(i) for i in infos}
    doc = parts["word/document.xml"].decode("utf-8")
    field = TOC_FIELD.search(doc)
    if not field:
        return 0
    ids = [int(x) for x in re.findall(r'<w:bookmarkStart w:id="(\d+)"', doc)]
    next_id = max(ids, default=0) + 1
    entries = []

    def mark(m: re.Match) -> str:
        nonlocal next_id
        para = m.group(0)
        h = HEADING.match(para)
        if not h or int(h.group(1)) > depth:
            return para
        text = "".join(re.findall(r"<w:t(?:\s[^>]*)?>([^<]*)</w:t>", para))
        if not text.strip():
            return para
        name = f"_Toc{next_id:08d}"
        entries.append((int(h.group(1)), name, text))
        marked = (para[:h.end()] + f'<w:bookmarkStart w:id="{next_id}" w:name="{name}"/>'
                  + para[h.end():-len("</w:p>")] + f'<w:bookmarkEnd w:id="{next_id}"/></w:p>')
        next_id += 1
        return marked

    body = PARAGRAPH.sub(mark, doc[field.end():])
    if not entries:
        return 0
    begin = ('<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
             f'<w:r>{field.group(1)}</w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>')
    end = '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
    toc = "".join(
        f'<w:p><w:pPr><w:pStyle w:val="TOC{level}"/></w:pPr>{begin if i == 0 else ""}'
        f'<w:hyperlink w:anchor="{name}" w:history="1"><w:r><w:t xml:space="preserve">{text}</w:t></w:r></w:hyperlink>'
        f'{end if i == len(entries) - 1 else ""}</w:p>'
        for i, (level, name, text) in enumerate(entries))
    parts["word/document.xml"] = (doc[:field.start()] + toc + body).encode("utf-8")
    styles = parts["word/styles.xml"].decode("utf-8")
    if 'w:styleId="TOC1"' not in styles:
        parts["word/styles.xml"] = styles.replace("</w:styles>", TOC_STYLES + "</w:styles>").encode("utf-8")
    tmp = docx.with_name(docx.name + ".tmp")
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for info in infos:
            z.writestr(info, parts[info.filename], compress_type=zipfile.ZIP_DEFLATED)
    tmp.replace(docx)
    return len(entries)


def find_pandoc() -> list[str]:
    if shutil.which("quarto"):
        return ["quarto", "pandoc"]
    if shutil.which("pandoc"):
        return ["pandoc"]
    fail("neither quarto nor pandoc is on PATH")
    return []


# ------------------------------------------------- what the site publishes

class RenderRules:
    """The subset of _quarto.yml `project.render` rules that matters here."""

    def __init__(self) -> None:
        cfg = yaml.safe_load((REPO / "_quarto.yml").read_text())
        rules = (cfg.get("project") or {}).get("render") or []
        self.include = [glob_regex(r) for r in rules if not r.startswith("!")]
        self.explicit = {r for r in rules if not r.startswith("!") and not GLOB_CHARS & set(r)}
        self.exclude = []
        for r in rules:
            if r.startswith("!"):
                r = r[1:]
                self.exclude.append(glob_regex(r + "**" if r.endswith("/") else r))

    def published(self, path: Path) -> bool:
        r = rel(path)
        if r in self.explicit:
            return True
        if any(part.startswith(("_", ".")) for part in Path(r).parts):
            return False
        if path.name == "README.md":        # Quarto skips README.md matched by a glob
            return False
        if any(x.match(r) for x in self.exclude):
            return False
        return any(x.match(r) for x in self.include)


# ------------------------------------------------------------ page sources

FRONT_MATTER = re.compile(r"\A---[ \t]*\n(.*?\n)(?:---|\.\.\.)[ \t]*\n", re.S)
META_SC = re.compile(r"\{\{<\s*meta\s+([A-Za-z0-9_.-]+)\s*>\}\}")
INCLUDE_SC = re.compile(r"^\{\{<\s*include\s+(\S+)\s*>\}\}[ \t]*$", re.M)
_dir_meta_cache: dict[Path, dict] = {}


def split_front_matter(text: str) -> tuple[dict, str]:
    m = FRONT_MATTER.match(text)
    if not m:
        return {}, text
    try:
        meta = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        meta = {}
    return (meta if isinstance(meta, dict) else {}), text[m.end():]


def dir_metadata(d: Path) -> list[dict]:
    """_metadata.yml files from the page's folder up to the repo root, nearest first."""
    out = []
    while True:
        if d not in _dir_meta_cache:
            f = d / "_metadata.yml"
            _dir_meta_cache[d] = (yaml.safe_load(f.read_text()) or {}) if f.is_file() else {}
        out.append(_dir_meta_cache[d])
        if d == REPO or d == d.parent:
            return out
        d = d.parent


def lookup(key: str, sources: list[dict]):
    for src in sources:
        node = src
        for part in key.split("."):
            if isinstance(node, dict) and part in node:
                node = node[part]
            else:
                node = None
                break
        if node is not None and not isinstance(node, (dict, list)):
            return str(node)
    return None


def has_h1(body: str) -> bool:
    fence = None
    for line in body.splitlines():
        m = re.match(r"^\s*(`{3,}|~{3,})", line)
        if m:
            fence = None if fence and m.group(1)[0] == fence[0] else (fence or m.group(1))
            continue
        if not fence and re.match(r"^# \S", line):
            return True
    return False


def prepare_page(page: Path) -> tuple[str, dict]:
    """Return the page body ready for pandoc, plus its front matter."""
    meta, body = split_front_matter(page.read_text(encoding="utf-8"))

    def include(m: re.Match) -> str:
        target = m.group(1).strip("\"'")
        inc = (REPO / target.lstrip("/")) if target.startswith("/") else (page.parent / target)
        if not inc.is_file():
            raise BuildError(f"{rel(page)}: included file not found: {target}")
        return split_front_matter(inc.read_text(encoding="utf-8"))[1]

    for _ in range(5):                  # nested includes
        body, n = INCLUDE_SC.subn(include, body)
        if not n:
            break
    sources = [meta] + dir_metadata(page.parent)

    def meta_value(m: re.Match) -> str:
        value = lookup(m.group(1), sources)
        if value is None:
            raise BuildError(f"{rel(page)}: unresolved shortcode {m.group(0)}")
        return value

    body = META_SC.sub(meta_value, body)
    if "{{<" in body:
        sc = re.search(r"\{\{<.*?>\}\}", body)
        raise BuildError(f"{rel(page)}: unsupported Quarto shortcode {sc.group(0) if sc else '{{<'}")
    title = meta.get("title")
    if title and not has_h1(body):
        body = f"# {title}\n\n{body}"
    return body, meta


# ---------------------------------------------------------------- manifests

@dataclass
class Bundle:
    output: str
    title: str
    subtitle: str
    root: Path
    pages: list[Path] = field(default_factory=list)
    aliases: list[str] = field(default_factory=list)
    image_dir: Path | None = None
    toc_depth: int = 2


def ordered_tree(root: Path, rules: RenderRules, cache: dict) -> list[Path]:
    """Every published .md under root: index.md and README.md first in each
    folder, then pages by front-matter `order`/`series-order` and name, then
    sub-folders in natural order."""
    files, dirs = [], []
    for p in root.iterdir():
        if p.is_dir() and not p.name.startswith((".", "_")):
            dirs.append(p)
        elif p.suffix == ".md" and rules.published(p):
            files.append(p)

    def key(p: Path):
        lead = {"index.md": 0, "README.md": 1}.get(p.name, 2)
        if p not in cache:
            cache[p] = split_front_matter(p.read_text(encoding="utf-8"))[0]
        m = cache[p]
        order = m.get("series-order", m.get("order"))
        order = order if isinstance(order, (int, float)) else float("inf")
        return (lead, order, natural_key(p.name))

    out = sorted(files, key=key)
    for d in sorted(dirs, key=lambda d: natural_key(d.name)):
        out += ordered_tree(d, rules, cache)
    return out


def load_bundles(rules: RenderRules) -> list[Bundle]:
    cfg = yaml.safe_load(CONFIG.read_text())
    defaults = cfg.get("defaults") or {}
    bundles, seen = [], set()
    fm_cache: dict = {}
    for spec in cfg["bundles"]:
        name = spec["output"]
        if name in seen:
            fail(f"bundles.yml: duplicate output {name}")
        seen.add(name)
        root = REPO / spec["root"]
        if not root.is_dir():
            warn(f"{name}: folder {spec['root']} no longer exists; bundle skipped")
            continue
        tree = None
        pages: list[Path] = []
        for entry in spec["pages"]:
            if not GLOB_CHARS & set(entry):
                p = root / entry
                if not p.is_file():
                    fail(f"bundles.yml: {name}: page not found: {rel(p)}")
                if not rules.published(p):
                    warn(f"{name}: {rel(p)} is listed but not published by the site")
                if p not in pages:
                    pages.append(p)
                continue
            if tree is None:
                tree = ordered_tree(root, rules, fm_cache)
            rx = glob_regex(entry)
            pages += [p for p in tree if rx.match(str(p.relative_to(root))) and p not in pages]
        for pattern in spec.get("exclude", []):
            rx = glob_regex(pattern)
            pages = [p for p in pages if not rx.match(str(p.relative_to(root)))]
        for pattern in spec.get("warn_unlisted", []):
            for p in sorted(root.glob(pattern)):
                if p not in pages and rules.published(p):
                    warn(f"{name}: {rel(p)} matches {pattern} but is not in its manifest")
        if not pages:
            warn(f"{name}: manifest matched no published pages; bundle skipped")
            continue
        title = spec.get("title")
        if not title:
            first = pages[0]
            fm_cache.setdefault(first, split_front_matter(first.read_text(encoding="utf-8"))[0])
            title = str(fm_cache[first].get("title") or Path(name).stem)
        bundles.append(Bundle(
            output=name, title=title,
            subtitle=spec.get("subtitle", defaults.get("subtitle", "")),
            root=root, pages=pages, aliases=spec.get("aliases", []),
            image_dir=(REPO / spec["image_dir"]) if spec.get("image_dir") else None,
            toc_depth=spec.get("toc_depth", defaults.get("toc_depth", 2)),
        ))
    return bundles


# ------------------------------------------------------------------- images

def walk_images(node, out: list) -> None:
    if isinstance(node, dict):
        if node.get("t") == "Image":
            _attr, inlines, (src, _title) = node["c"]
            out.append((src, bool(inlines)))
        for v in node.values():
            walk_images(v, out)
    elif isinstance(node, list):
        for v in node:
            walk_images(v, out)


def sniff(path: Path) -> str:
    head = path.read_bytes()[:512]
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if head.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    if b"<svg" in head or head.lstrip().startswith(b"<?xml"):
        return ".svg"
    return path.suffix.lower()


def word_png(src: Path) -> Path | None:
    """A committed Word rendering of a generated diagram, if there is one.

    Diagrams under docs/images/**/diagrams/ ship as svg/NAME.svg (for the
    site) and png/NAME.png (2x, tagged 192 dpi, for Word). Embedding the
    committed PNG keeps the Word figures sharp and identical to the QA'd ones.
    """
    if src.suffix.lower() != ".svg" or src.parent.name != "svg":
        return None
    png = src.parent.parent / "png" / (src.stem + ".png")
    return png.resolve() if png.is_file() else None


@dataclass
class Prepared:
    staged: Path                         # prepared copy in the work folder
    images: list                         # (src, resolved Path | None, has_caption)
    listing_ids: list


class Builder:
    def __init__(self, out_dir: Path, jobs: int) -> None:
        self.out_dir = out_dir
        self.jobs = jobs
        self.pandoc = find_pandoc()
        self.work = Path(tempfile.mkdtemp(prefix="word-bundles-")).resolve()
        self.stage = self.work / "src"
        self.media = self.work / "media"
        self.media.mkdir(parents=True)
        self.prepared: dict[Path, Prepared] = {}
        self.word_ready: dict[Path, Path] = {}
        reference = (yaml.safe_load(CONFIG.read_text()).get("defaults") or {}).get(
            "reference_doc", "assets/reference-mslearn.docx")
        self.reference_doc = REPO / reference

    # Pages are prepared once and shared by every bundle that uses them.
    def prepare(self, page: Path) -> Prepared:
        body, meta = prepare_page(page)
        staged = self.stage / page.relative_to(REPO)
        staged.parent.mkdir(parents=True, exist_ok=True)
        staged.write_text(body, encoding="utf-8")
        ast = json.loads(subprocess.run(
            self.pandoc + ["--from", "markdown", "--to", "json", str(staged)],
            check=True, capture_output=True, text=True).stdout)
        found: list = []
        walk_images(ast["blocks"], found)
        images = []
        for src, captioned in found:
            if src.startswith("data:"):
                continue
            if re.match(r"^[a-z][a-z0-9+.-]*:", src, re.I):
                raise BuildError(f"{rel(page)}: remote image not allowed in a bundle: {src}")
            path = urllib.parse.unquote(src.split("#")[0].split("?")[0])
            resolved = (REPO / path.lstrip("/")) if path.startswith("/") else (page.parent / path)
            images.append((src, resolved.resolve(), captioned))
        listing = meta.get("listing") or []
        listing = listing if isinstance(listing, list) else [listing]
        ids = [x.get("id") for x in listing if isinstance(x, dict) and x.get("id")]
        return Prepared(staged, images, ids or [])

    def prepare_all(self, pages: set[Path]) -> None:
        with cf.ThreadPoolExecutor(self.jobs) as ex:
            futures = {ex.submit(self.prepare, p): p for p in pages}
            errors = []
            for fut in cf.as_completed(futures):
                try:
                    self.prepared[futures[fut]] = fut.result()
                except BuildError as e:
                    errors.append(str(e))
        if errors:
            for e in sorted(errors):
                print(f"ERROR: {e}", file=sys.stderr)
            fail(f"{len(errors)} page(s) could not be prepared")
        missing = sorted({(rel(p), s) for p, pr in self.prepared.items()
                          for s, r, _ in pr.images if not r.is_file()})
        if missing:
            for page, src in missing:
                print(f"ERROR: missing image {src} (referenced in {page})", file=sys.stderr)
            fail(f"{len(missing)} referenced image(s) missing; no bundle built")
        # Word-ready copies of the images
        for i, src in enumerate(sorted({r for pr in self.prepared.values() for _, r, _ in pr.images})):
            kind = sniff(src)
            committed = word_png(src)
            if committed:
                dest = committed
            elif kind == ".svg":
                if not shutil.which("rsvg-convert"):
                    fail(f"{rel(src)} is SVG and rsvg-convert is not installed (apt-get install librsvg2-bin)")
                dest = self.media / f"{i:04d}-{src.stem}.png"
                subprocess.run(["rsvg-convert", "--dpi-x", "150", "--dpi-y", "150",
                                "-f", "png", "-o", str(dest), str(src)], check=True)
            elif kind != src.suffix.lower():
                dest = self.media / f"{i:04d}-{src.stem}{kind}"
                shutil.copyfile(src, dest)
            else:
                dest = src
            self.word_ready[src] = dest

    def build(self, b: Bundle) -> dict:
        t0 = time.monotonic()
        refs, image_map, listing_ids = [], {}, set()
        for p in b.pages:
            pr = self.prepared[p]
            listing_ids.update(pr.listing_ids)
            for src, resolved, captioned in pr.images:
                refs.append((p, src, resolved, captioned))
                # pandoc rebases the path relative to the staged copy
                key = os.path.normpath(os.path.join(pr.staged.parent, urllib.parse.unquote(src)))
                image_map[key] = str(self.word_ready[resolved])
        unique = {r for _, _, r, _ in refs}
        map_file = self.work / f"{b.output}.images.json"
        map_file.write_text(json.dumps(image_map))
        output = self.out_dir / b.output
        env = dict(os.environ, BUNDLE_IMAGE_MAP=str(map_file),
                   BUNDLE_LISTING_IDS=",".join(sorted(listing_ids | {"chapters", "book-chapters"})))
        cmd = self.pandoc + [
            "--from", "markdown+rebase_relative_paths",
            *[str(self.prepared[p].staged) for p in b.pages],
            "--output", str(output),
            "--metadata", f"title={b.title}",
            *(["--metadata", f"subtitle={b.subtitle}"] if b.subtitle else []),
            "--toc", f"--toc-depth={b.toc_depth}",
            "--lua-filter", str(FILTER),
            "--reference-doc", str(self.reference_doc),
            "--resource-path", str(REPO),
            "--fail-if-warnings",
        ]
        res = subprocess.run(cmd, cwd=self.work, env=env, capture_output=True, text=True)
        if res.returncode != 0:
            raise BuildError(f"{b.output}: pandoc failed (exit {res.returncode})\n{res.stderr}")
        if not fill_toc(output, b.toc_depth):
            raise BuildError(f"{b.output}: table of contents has no entries")
        with zipfile.ZipFile(output) as z:
            media = [n for n in z.namelist() if n.startswith("word/media/")]
            doc = z.read("word/document.xml").decode("utf-8")
        placements = len(re.findall(r"<a:blip r:embed=", doc))
        captions = len(re.findall(r'w:pStyle w:val="ImageCaption"', doc))
        if len(media) < len(unique) or placements < len(refs):
            raise BuildError(f"{b.output}: only {len(media)} of {len(unique)} images embedded "
                             f"({placements} of {len(refs)} placements)")
        for alias in b.aliases:
            shutil.copyfile(output, self.out_dir / alias)
        unused = []
        if b.image_dir and b.image_dir.is_dir():
            used = unique | {word_png(r) for r in unique}
            unused = sorted(rel(p) for p in b.image_dir.rglob("*")
                            if p.is_file() and p.suffix.lower() in IMAGE_EXTS and p.resolve() not in used)
        return dict(output=b.output, aliases=b.aliases, pages=len(b.pages), refs=len(refs),
                    unique=len(unique), media=len(media), placements=placements,
                    captions=captions, uncaptioned=sum(1 for r in refs if not r[3]),
                    size=output.stat().st_size, seconds=time.monotonic() - t0,
                    unused=unused, image_dir=rel(b.image_dir) if b.image_dir else None)


# ------------------------------------------------------ download link check

DOWNLOAD_LINK = re.compile(r"\]\(<?((?:\.\./)*downloads/([^)>]+?\.docx))>?\)")
BARE_BUNDLE = re.compile(r"\[`?([^\]`\n]+?[Bb]undle\.docx)`?\](?![(\[:])")


def check_download_links(rules: RenderRules, out_dir: Path) -> list[str]:
    problems = []
    pages = [p for p in (REPO / "docs").rglob("*.md") if rules.published(p)]
    pages += [p for p in REPO.glob("*.qmd")]
    for page in pages:
        text = page.read_text(encoding="utf-8")
        for m in DOWNLOAD_LINK.finditer(text):
            target, name = m.group(1), urllib.parse.unquote(m.group(2))
            depth = len(page.relative_to(REPO).parts) - 1
            if not target.startswith("../" * depth + "downloads/") or target.startswith("../" * (depth + 1)):
                problems.append(f"{rel(page)}: link {target} does not point at the site's downloads/ folder")
            elif not (out_dir / name).is_file():
                problems.append(f"{rel(page)}: links to downloads/{name}, which no bundle builds")
        for m in BARE_BUNDLE.finditer(text):
            problems.append(f"{rel(page)}: [{m.group(1)}] is plain text, not a download link")
    return problems


# --------------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="output folder (default _site/downloads)")
    ap.add_argument("--only", nargs="+", metavar="NAME", help="build only these bundles (output file names)")
    ap.add_argument("--jobs", type=int, default=os.cpu_count() or 2)
    ap.add_argument("--list", action="store_true", help="print each manifest and exit")
    ap.add_argument("--no-link-check", action="store_true", help="skip the download-link check")
    args = ap.parse_args()
    started = time.monotonic()
    rules = RenderRules()
    bundles = load_bundles(rules)
    if args.only:
        unknown = set(args.only) - {b.output for b in bundles}
        if unknown:
            fail("unknown bundle(s): " + ", ".join(sorted(unknown)))
        bundles = [b for b in bundles if b.output in args.only]
    if args.list:
        for b in bundles:
            log(f"{b.output}  ({len(b.pages)} pages) — {b.title}")
            for p in b.pages:
                log(f"    {rel(p)}")
        return

    out_dir = args.out.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    builder = Builder(out_dir, args.jobs)
    builder.prepare_all({p for b in bundles for p in b.pages})
    log(f"Prepared {len(builder.prepared)} pages and {len(builder.word_ready)} images "
        f"in {time.monotonic() - started:.1f}s")

    results, errors = [], []
    with cf.ThreadPoolExecutor(args.jobs) as ex:
        futures = [ex.submit(builder.build, b) for b in bundles]
        for fut in futures:
            try:
                results.append(fut.result())
            except BuildError as e:
                errors.append(str(e))
    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        fail(f"{len(errors)} bundle(s) failed")

    log("")
    log(f"{'Bundle':58} {'pages':>5} {'img refs':>8} {'unique':>6} {'embedded':>8} {'missing':>7} {'MB':>6} {'sec':>5}")
    for r in results:
        log(f"{r['output']:58} {r['pages']:5} {r['refs']:8} {r['unique']:6} {r['media']:8} {0:7} "
            f"{r['size'] / 1e6:6.1f} {r['seconds']:5.1f}")
        for a in r["aliases"]:
            log(f"  also published as {a}")
        if r["uncaptioned"]:
            log(f"  note: {r['uncaptioned']} image(s) have no alt text, so no caption")
        if r["unused"]:
            log(f"  {len(r['unused'])} image(s) in {r['image_dir']}/ are not used by this bundle:")
            for u in r["unused"]:
                log(f"    {u}")
    log(f"Built {len(results)} bundles ({sum(len(r['aliases']) for r in results)} aliases) "
        f"in {time.monotonic() - started:.1f}s")

    if not args.no_link_check and not args.only:
        problems = check_download_links(rules, out_dir)
        if problems:
            for p in problems:
                print(f"ERROR: {p}", file=sys.stderr)
            fail(f"{len(problems)} download link(s) do not resolve to a built bundle")
        log("Download links: every downloads/*.docx link on a published page resolves to a built file")
    shutil.rmtree(builder.work, ignore_errors=True)


if __name__ == "__main__":
    main()
