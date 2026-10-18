#!/usr/bin/env python3
"""Build the SQL Server Identity Transformation narrative as one Word document.

The bundle is built directly from the source Markdown in
docs/case-studies/sql-server-narrative/, in the order given by MANIFEST,
with every referenced image embedded at its position with its caption.

Usage (from anywhere in the repo; needs Quarto, which bundles pandoc):

    python3 scripts/build_sql_bundle.py [OUTPUT_DOCX]

Default output: _site/downloads/sql-server-narrative-bundle.docx

The "Deploy Quarto Site" workflow runs the same command on every deploy.

What the script does:
  1. Checks that every file in MANIFEST exists, and warns about Book_* pages
     in the folder that MANIFEST does not list.
  2. Finds every image the listed pages reference (using pandoc's own parser,
     so multi-line image syntax is handled) and resolves each path relative to
     the page that references it. Any missing image fails the build.
  3. Prepares images for Word: SVGs are converted to PNG with rsvg-convert,
     and files whose extension does not match their content (for example a
     JPEG saved as .png) are copied with the correct extension.
  4. Runs pandoc once over all pages, with a title page and a Word TOC, and
     scripts/bundle-strip-nav.lua to drop web-only navigation.
  5. Verifies the result: every referenced image must be embedded in the
     .docx, otherwise the build fails. Prints an image report, including any
     image in the series' image folder that no page uses.

To add, remove, or reorder pages, edit MANIFEST below.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
NARRATIVE = REPO / "docs/case-studies/sql-server-narrative"
IMAGE_DIR = REPO / "docs/images/sql-server"   # the series' own image folder
FILTER = REPO / "scripts/bundle-strip-nav.lua"
REFERENCE_DOC = REPO / "assets/reference-mslearn.docx"
DEFAULT_OUTPUT = REPO / "_site/downloads/sql-server-narrative-bundle.docx"

TITLE = "SQL Server Identity Transformation"
SUBTITLE = "Narrative Series — combined edition"

# Reading order. Paths are relative to NARRATIVE.
MANIFEST = [
    # Series front matter
    "index.md",
    # Book 01 — The Authentication Inheritance Problem
    "Book_01.md", "Book_01_CPT_01.md", "Book_01_CPT_02.md",
    # Book 02 — The Estate Itself
    "Book_02.md", "Book_02_CPT_01.md", "Book_02_CPT_02.md",
    "Book_02_CPT_03.md", "Book_02_CPT_04.md",
    # Book 03 — Discovery: The Authentication Audit
    "Book_03.md", "Book_03_CPT_01.md", "Book_03_CPT_02.md",
    # Book 04 — Arc as the Identity Bridge
    "Book_04.md", "Book_04_CPT_01.md", "Book_04_CPT_02.md",
    # Book 05 — The Login Migration
    "Book_05.md", "Book_05_CPT_01.md", "Book_05_CPT_02.md",
    # Book 06 — Eliminating NTLM at the SQL Layer
    "Book_06.md", "Book_06_CPT_01.md", "Book_06_CPT_02.md",
    # Book 07 — Access Control
    "Book_07.md", "Book_07_CPT_01.md", "Book_07_CPT_02.md",
    # Book 08 — The Application Chain
    "Book_08.md", "Book_08_CPT_01.md", "Book_08_CPT_02.md",
    # Book 09 — The Transformed Posture
    "Book_09.md", "Book_09_CPT_01.md", "Book_09_CPT_02.md",
    # Book 10 — Certificate Authority
    "Book_10.md", "Book_10_CPT_01.md",
    # Book 11 — The Platform Question (a single page)
    "book-11-platform-question.md",
]

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".bmp", ".tif", ".tiff", ".emf", ".wmf"}


def log(msg: str) -> None:
    print(msg, flush=True)


def warn(msg: str) -> None:
    if os.environ.get("GITHUB_ACTIONS"):
        print(f"::warning::{msg}", flush=True)
    else:
        print(f"WARNING: {msg}", file=sys.stderr, flush=True)


def fail(msg: str) -> None:
    if os.environ.get("GITHUB_ACTIONS"):
        print(f"::error::{msg}", flush=True)
    print(f"ERROR: {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def find_pandoc() -> list[str]:
    if shutil.which("quarto"):
        return ["quarto", "pandoc"]
    if shutil.which("pandoc"):
        return ["pandoc"]
    fail("neither quarto nor pandoc is on PATH")
    return []


def walk_images(node, out: list) -> None:
    """Collect (src, caption) for every Image node in a pandoc JSON AST."""
    if isinstance(node, dict):
        if node.get("t") == "Image":
            _attr, inlines, (src, _title) = node["c"]
            out.append((src, inlines_text(inlines)))
        for v in node.values():
            walk_images(v, out)
    elif isinstance(node, list):
        for v in node:
            walk_images(v, out)


def inlines_text(inlines) -> str:
    parts = []
    for i in inlines:
        t = i.get("t")
        if t == "Str":
            parts.append(i["c"])
        elif t in ("Space", "SoftBreak", "LineBreak"):
            parts.append(" ")
        elif isinstance(i.get("c"), list):
            parts.append(inlines_text([x for x in i["c"] if isinstance(x, dict)]))
    return "".join(parts).strip()


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


def main() -> None:
    output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUTPUT
    pandoc = find_pandoc()

    # 1. Manifest
    pages = [NARRATIVE / f for f in MANIFEST]
    missing_pages = [p for p in pages if not p.is_file()]
    if missing_pages:
        fail("manifest entries not found: " + ", ".join(str(p.relative_to(REPO)) for p in missing_pages))
    listed = set(MANIFEST)
    for p in sorted(NARRATIVE.glob("Book_*.md")):
        if p.name not in listed:
            warn(f"{p.relative_to(REPO)} is not in MANIFEST in scripts/build_sql_bundle.py")

    # 2. Images referenced by the pages, resolved relative to each page
    references = []          # (page, src, resolved Path, caption)
    for page in pages:
        ast = json.loads(subprocess.run(
            pandoc + ["--from", "markdown", "--to", "json", str(page)],
            check=True, capture_output=True, text=True).stdout)
        found: list = []
        walk_images(ast["blocks"], found)
        for src, caption in found:
            if re.match(r"^[a-z][a-z0-9+.-]*:", src, re.I):
                fail(f"{page.name}: remote image not allowed in the bundle: {src}")
            resolved = (page.parent / src.split("#")[0]).resolve()
            references.append((page, src, resolved, caption))

    missing = [(p, s) for p, s, r, _ in references if not r.is_file()]
    if missing:
        for p, s in missing:
            print(f"ERROR: missing image {s} (referenced in {p.relative_to(REPO)})", file=sys.stderr)
        fail(f"{len(missing)} referenced image(s) missing; bundle not built")
    for p, s, _, cap in references:
        if not cap:
            warn(f"{p.name}: image {s} has no alt text, so it will have no caption")

    unique = sorted({r for _, _, r, _ in references})

    # 3. Prepare images for Word
    workdir = Path(tempfile.mkdtemp(prefix="sql-bundle-"))
    image_map = {}           # resolved source path -> path pandoc should embed
    for src in unique:
        kind = sniff(src)
        if kind == ".svg":
            if not shutil.which("rsvg-convert"):
                fail(f"{src.relative_to(REPO)} is SVG and rsvg-convert is not installed (apt-get install librsvg2-bin)")
            dest = workdir / (src.stem + ".png")
            subprocess.run(["rsvg-convert", "--dpi-x", "150", "--dpi-y", "150",
                            "-f", "png", "-o", str(dest), str(src)], check=True)
            image_map[str(src)] = str(dest)
        elif kind != src.suffix.lower():
            dest = workdir / (src.stem + kind)
            shutil.copyfile(src, dest)
            image_map[str(src)] = str(dest)
            log(f"  note: {src.relative_to(REPO)} is really {kind[1:].upper()}; embedding as {kind}")
    map_file = workdir / "image-map.json"
    map_file.write_text(json.dumps(image_map))

    # 4. Build
    output.parent.mkdir(parents=True, exist_ok=True)
    log(f"Building {output.relative_to(REPO) if output.is_relative_to(REPO) else output} "
        f"from {len(pages)} pages, {len(references)} image references ({len(unique)} unique images)")
    env = dict(os.environ, BUNDLE_IMAGE_MAP=str(map_file))
    cmd = pandoc + [
        # rebase_relative_paths: image paths are resolved relative to the
        # page that contains them, not the working directory.
        "--from", "markdown+rebase_relative_paths",
        *[str(p.relative_to(REPO)) for p in pages],
        "--output", str(output),
        "--metadata", f"title={TITLE}",
        "--metadata", f"subtitle={SUBTITLE}",
        "--toc", "--toc-depth=2",
        "--lua-filter", str(FILTER),
        "--reference-doc", str(REFERENCE_DOC),
        "--fail-if-warnings",
    ]
    result = subprocess.run(cmd, cwd=REPO, env=env, capture_output=True, text=True)
    sys.stderr.write(result.stderr)
    if result.returncode != 0:
        fail(f"pandoc failed (exit {result.returncode})")

    # 5. Verify embedding
    with zipfile.ZipFile(output) as z:
        media = [n for n in z.namelist() if n.startswith("word/media/")]
        doc = z.read("word/document.xml").decode("utf-8")
    placements = len(re.findall(r"<a:blip r:embed=", doc))
    captions = len(re.findall(r'w:pStyle w:val="ImageCaption"', doc))
    if len(media) < len(unique) or placements < len(references):
        fail(f"only {len(media)} of {len(unique)} images embedded "
             f"({placements} of {len(references)} placements)")

    used = {r for r in unique}
    folder_images = sorted(p.resolve() for p in IMAGE_DIR.rglob("*")
                           if p.is_file() and p.suffix.lower() in IMAGE_EXTS)
    unused = [p for p in folder_images if p not in used]

    log("Image report")
    log(f"  references in pages : {len(references)}")
    log(f"  unique images       : {len(unique)}")
    log(f"  embedded media files: {len(media)}")
    log(f"  placements in docx  : {placements} (captions: {captions})")
    log("  missing             : 0")
    for r in unique:
        n = sum(1 for _, _, x, _ in references if x == r)
        log(f"    used {n}x  {r.relative_to(REPO)}")
    if unused:
        log(f"  in {IMAGE_DIR.relative_to(REPO)}/ but not used by any bundled page: {len(unused)}")
        for p in unused:
            log(f"    {p.relative_to(REPO)}")
    shutil.rmtree(workdir, ignore_errors=True)
    log(f"Created {output}")


if __name__ == "__main__":
    main()
