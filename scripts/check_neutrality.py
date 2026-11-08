#!/usr/bin/env python3
"""Fail when a published or shipped file names a specific agency.

The workbook is agency-neutral: agency facts appear only as generic examples.
This check reads the terms it must not find from data/neutrality-terms.txt,
where each is stored as a salted SHA-256 hash so the list itself doesn't name
the agency. Each file's text is lower-cased and split into words (runs of
letters and digits), every run of one to max-words words is hashed the same
way, and a hash on the list is a hit ("first:" lines hold the hash of each
multi-word term's first word, so most runs are never hashed). So a term matches whatever the
punctuation or case around it (a dotted acronym counts as one word), and never
inside a longer word.

A hash only hides a term from reading and searching; a short term can be
recovered by guessing. That is enough here: the file doesn't name anything,
and the check still catches it.

    python scripts/check_neutrality.py                  # every tracked file in scope
    python scripts/check_neutrality.py docs/x.md a.svg  # just these files
    python scripts/check_neutrality.py --add            # read a term on stdin, add its hash

Scope: tracked files under docs/, examples/, data/, presentations/ and
scripts/, and the top-level pages, except the paths in EXCLUDE (the archive,
the inbox, the deliberately agency-specific interview decks, and the writer
briefs that have to say what not to write). Quarto profile attributes
(unless-profile="..." and when-profile="...") are build switches, not text,
and are ignored.

What is read: the text of text files; the text of Word, PowerPoint and Excel
files (.docx, .pptx, .xlsx and their macro and template variants), taken from
their XML parts (body, headers, footers, footnotes, comments, slides, speaker
notes, shared strings, sheets, document properties) with the standard library
only; and .zip archives one level deep (their text files and Office files; an
archive inside an archive is not opened). The path components of every file in
scope, and of every archive member, are matched too, so a term in a file name
is a hit. A file or member over 50 MB, or one that can't be opened, is a
warning, not a failure. Pictures, PDFs and other binaries are checked by name only.

A hit is reported as <file>[!<part>]:<number>: the line of a text file, the
paragraph of a Word part, the slide of a PowerPoint part, the shared string or
sheet row of an Excel part. A file name hit is <file>!name (an archive member's
is <file>!<member>!name).

Lines that predate the check are excused by data/neutrality-baseline.txt,
one "<file> <line hash>" per line, so only that exact line text passes. The
baseline only shrinks: a full run fails on an entry that no longer matches,
and a new hit can't be added without a reviewed edit to that file.

Exits 1 on any hit, listing the file and line but not the words matched:
Actions logs and issues on a public repository are public too.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import io
import subprocess
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
TERMS = REPO / "data" / "neutrality-terms.txt"
BASELINE = REPO / "data" / "neutrality-baseline.txt"
ROOTS = ("docs/", "examples/", "data/", "presentations/", "scripts/")
TOP_LEVEL = ("README.md", "index.qmd", "404.qmd", "workbook-map.qmd", "PROJECT-CHARTER.md", "PROJECT-PLAN.md",
             "STATUS.md", "CONTRIBUTING.md", "_quarto.yml")
EXCLUDE = (
    "archive/",
    "InBox/",
    "presentations/hr-driven-identity-interview/",   # the agency edition of the interview decks, kept on purpose
    "data/neutrality-terms.txt",
    "data/neutrality-baseline.txt",
)
EXCLUDE_NAMES = ("_BRIEF.md", "_book-writer-brief.md")   # writer briefs name what not to write
TEXT_SUFFIXES = {".md", ".qmd", ".yml", ".yaml", ".json", ".svg", ".txt", ".csv", ".tsv", ".html", ".lua",
                 ".py", ".ps1", ".psm1", ".psd1", ".sh", ".xml", ".vtt", ".toml", ".ini", ".cfg"}
OFFICE_SUFFIXES = {".docx", ".docm", ".dotx", ".pptx", ".pptm", ".potx", ".xlsx", ".xlsm", ".xltx"}
ZIP_SUFFIXES = {".zip"}
MAX_BYTES = 50 * 1024 * 1024                  # a file or archive member larger than this is skipped with a warning
MAX_MEMBERS = 5000                            # an archive with more members than this is skipped with a warning
# The XML parts of an Office file that hold text a reader can see or read out: (part-name pattern, kind).
OFFICE_PARTS = (
    (re.compile(r"^word/(?:document|header\d*|footer\d*|footnotes|endnotes|comments\w*)\.xml$"), "para"),
    (re.compile(r"^ppt/(?:slides/slide|notesSlides/notesSlide|slideLayouts/slideLayout|slideMasters/slideMaster"
                r"|handoutMasters/handoutMaster|comments/comment)\d*\.xml$"), "slide"),
    (re.compile(r"^ppt/(?:comments|commentAuthors)\.xml$"), "all"),
    (re.compile(r"^xl/sharedStrings\.xml$"), "string"),
    (re.compile(r"^xl/worksheets/sheet\d+\.xml$"), "row"),
    (re.compile(r"^xl/(?:comments\d*|workbook)\.xml$"), "all"),
    (re.compile(r"^docProps/(?:core|app|custom)\.xml$"), "all"),
)
WORD = re.compile(r"[a-z0-9]+")
DOTTED = re.compile(r"\b(?:[a-z]\.){2,}(?:[a-z]\b)?")          # a.b.c. or a.b.c: one word
PROFILE_ATTR = re.compile(r"\b(?:unless|when)-profile\s*=\s*\"[^\"]*\"")


def in_scope(path: str) -> bool:
    """Whether the file is checked at all: by name always, by content if its type can be read."""
    if path.startswith(EXCLUDE) or Path(path).name in EXCLUDE_NAMES:
        return False
    return path.startswith(ROOTS) or path in TOP_LEVEL


def read_terms(path: Path = TERMS) -> tuple[str, int, set[str], set[str]]:
    """(salt, max words, term hashes, first-word hashes)."""
    salt, max_words, hashes, firsts = "", 1, set(), set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        if line.startswith("salt:"):
            salt = line.split(":", 1)[1].strip()
        elif line.startswith("max-words:"):
            max_words = int(line.split(":", 1)[1])
        elif line.startswith("first:"):
            firsts.add(line.split(":", 1)[1].strip().lower())
        else:
            hashes.add(line.lower())
    if not salt:
        raise SystemExit(f"{path}: no 'salt:' line")
    return salt, max_words, hashes, firsts | hashes


def read_baseline(path: Path = BASELINE) -> set[tuple[str, str]]:
    """(file, line hash) pairs excused because they predate this check."""
    out = set()
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                f, h = line.rsplit(None, 1)
                out.add((f, h.lower()))
    return out


def digest(salt: str, phrase: str) -> str:
    return hashlib.sha256(f"{salt}\n{phrase}".encode("utf-8")).hexdigest()


def normalize(term: str) -> str:
    return " ".join(WORD.findall(term.lower()))


def hits(text: str, salt: str, max_words: int, hashes: set[str], firsts: set[str],
         cache: dict[str, bool] | None = None) -> list[tuple[int, str, str]]:
    """(line number, matched words, line hash) for every hit. Matches don't span lines.

    Only a run whose first word starts some term is hashed in full, and that
    test is cached per word, so a corpus costs about one lookup a word.
    """
    cache = {} if cache is None else cache
    out = []
    for n, raw in enumerate(text.splitlines(), 1):
        words = WORD.findall(DOTTED.sub(lambda m: m.group(0).replace(".", "") + " ", PROFILE_ATTR.sub(" ", raw).lower()))
        for i, w in enumerate(words):
            starts = cache.get(w)
            if starts is None:
                starts = cache[w] = digest(salt, w) in firsts
            if not starts:
                continue
            for k in range(1, min(max_words, len(words) - i) + 1):
                phrase = " ".join(words[i:i + k])
                if digest(salt, phrase) in hashes:
                    out.append((n, phrase, digest(salt, raw.strip())))
    return out


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


PROP_TAGS = {"lpwstr", "lpstr", "Company", "Manager", "title", "subject", "creator", "keywords", "description",
             "lastModifiedBy", "category"}
NAME_ATTR_TAGS = {"sheet", "author", "definedName"}


def _text(el) -> str:
    """The visible text under an element: w:t, w:delText, a:t and t runs, sheet and author names, document properties."""
    out = []
    for e in el.iter():
        name = _local(e.tag)
        if name in ("t", "delText") and e.text:
            out.append(e.text)
        elif name in ("br", "tab", "cr"):
            out.append(" ")
        elif name in PROP_TAGS and e.text:
            out.append(" " + e.text + " ")
        if name in NAME_ATTR_TAGS and e.get("name"):
            out.append(" " + e.get("name") + " ")
        if name == "comment" and e.get("authorId") is None and e.get("author"):
            out.append(" " + e.get("author") + " ")
    return "".join(out)


def office_units(part: str, data: bytes, kind: str) -> list[tuple[int, str]]:
    """(unit number, text) for one XML part: paragraph, slide, shared string or row number."""
    import xml.etree.ElementTree as ET
    head = data[:65536].upper()
    if b"<!DOCTYPE" in head or b"<!ENTITY" in head:
        raise ValueError("XML with a DOCTYPE or entities")
    root = ET.fromstring(data)
    if kind == "para":
        return [(i, _text(p)) for i, p in enumerate((e for e in root.iter() if _local(e.tag) == "p"), 1)]
    if kind == "slide":
        m = re.search(r"(\d+)\.xml$", part)
        paras = [_text(p) for p in root.iter() if _local(p.tag) == "p"]
        return [(int(m.group(1)) if m else 1, "\n".join(paras) if paras else _text(root))]
    if kind == "string":
        return [(i, _text(si)) for i, si in enumerate((e for e in root.iter() if _local(e.tag) == "si"), 1)]
    if kind == "row":
        rows = (e for e in root.iter() if _local(e.tag) == "row")
        return [(int(r.get("r") or i), _text(r)) for i, r in enumerate(rows, 1)
                if any(_local(c.tag) == "is" for c in r.iter())]
    return [(1, _text(root))]


def office_parts(zf: zipfile.ZipFile, warn) -> list[tuple[str, int, str]]:
    """(part, unit number, text) for every readable text part in an Office file."""
    out = []
    for info in zf.infolist():
        for pattern, kind in OFFICE_PARTS:
            if not pattern.match(info.filename):
                continue
            try:
                data = zf.open(info).read(MAX_BYTES + 1) if info.file_size <= MAX_BYTES else b""
                if len(data) > MAX_BYTES or info.file_size > MAX_BYTES:
                    warn(f"!{info.filename}", "part over the size cap, not read")
                else:
                    out.extend((info.filename, n, t) for n, t in office_units(info.filename, data, kind))
            except Exception as e:                       # a malformed part is a warning, not a crash
                warn(f"!{info.filename}", f"part not readable ({type(e).__name__})")
            break
    return out


def scan_file(data: bytes, suffix: str, scan, salt: str, warn) -> list[tuple[str, int, str]]:
    """(label, number, line hash) for each hit in one file's content. `scan(text)` is hits() with the terms bound.

    A label is "" for a text file, "!part" for a part of an Office file, "!member" or "!member!part" for a member
    of a .zip, and "...!name" for a member's file name.
    """
    out: list[tuple[str, int, str]] = []

    def text_of(label: str, text: str):
        out.extend((label, n, h) for n, _, h in scan(text))

    def office(label: str, blob: bytes):
        try:
            with zipfile.ZipFile(io.BytesIO(blob)) as zf:
                for part, n, text in office_parts(zf, lambda lab, msg: warn(label + lab, msg)):
                    out.extend((f"{label}!{part}", n, h) for _, _, h in scan(text.replace("\n", " ")))
        except zipfile.BadZipFile:
            warn(label, "not a readable Office file (encrypted or damaged), content not checked")

    if suffix in TEXT_SUFFIXES:
        text_of("", data.decode("utf-8", errors="replace"))
    elif suffix in OFFICE_SUFFIXES:
        office("", data)
    elif suffix in ZIP_SUFFIXES:
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                infos = [i for i in zf.infolist() if not i.is_dir()]
                if len(infos) > MAX_MEMBERS:
                    warn("", f"archive has more than {MAX_MEMBERS} members, content not checked")
                    infos = []
                for info in infos:
                    label = f"!{info.filename}"
                    for comp in info.filename.split("/"):
                        if comp and scan(comp):
                            out.append((f"{label}!name", 0, digest(salt, comp)))
                    ms = Path(info.filename).suffix.lower()
                    if ms not in TEXT_SUFFIXES and ms not in OFFICE_SUFFIXES:
                        continue
                    blob = zf.open(info).read(MAX_BYTES + 1) if info.file_size <= MAX_BYTES else b""
                    if info.file_size > MAX_BYTES or len(blob) > MAX_BYTES:
                        warn(label, "member over the size cap, not read")
                    elif ms in TEXT_SUFFIXES:
                        text_of(label, blob.decode("utf-8", errors="replace"))
                    else:
                        office(label, blob)
        except zipfile.BadZipFile:
            warn("", "not a readable zip archive, content not checked")
    return out


def tracked() -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=REPO, capture_output=True, check=True).stdout
    return [p for p in out.decode("utf-8").split("\0") if p]


def add_term(term: str) -> int:
    phrase = normalize(term)
    if not phrase:
        print("empty term", file=sys.stderr)
        return 2
    salt, max_words, hashes, firsts = read_terms()
    h = digest(salt, phrase)
    if h in hashes:
        print("already on the list")
        return 0
    words = len(phrase.split())
    first = digest(salt, phrase.split()[0])
    with TERMS.open("a", encoding="utf-8", newline="\n") as fh:
        fh.write(f"{h}  # {words} word{'s' if words > 1 else ''}\n")
        if words > 1 and first not in firsts:
            fh.write(f"first: {first}\n")
    if words > max_words:
        text = TERMS.read_text(encoding="utf-8")
        TERMS.write_text(re.sub(r"(?m)^max-words:.*$", f"max-words: {words}", text), encoding="utf-8", newline="\n")
    print(f"added a {words}-word term")
    return 0


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")   # type: ignore[attr-defined]
        except AttributeError:
            pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("files", nargs="*", help="repo-relative files to check (default: every tracked file in scope)")
    ap.add_argument("--add", action="store_true", help="read one term from stdin and add its hash to the list")
    args = ap.parse_args(argv)
    if args.add:
        return add_term(sys.stdin.readline())

    salt, max_words, hashes, firsts = read_terms(TERMS)
    baseline = read_baseline(BASELINE)
    cache: dict[str, bool] = {}
    files = [f.replace("\\", "/") for f in args.files] if args.files else tracked()
    files = [f for f in files if in_scope(f) and (REPO / f).is_file()]
    found, excused, used, warned = 0, 0, set(), 0
    scan = lambda text: hits(text, salt, max_words, hashes, firsts, cache)       # noqa: E731
    for f in files:
        def warn(label: str, msg: str, f=f) -> None:
            nonlocal warned
            warned += 1
            print(f"{f}{label}: warning: {msg}")
        results: list[tuple[str, int, str]] = []
        for comp in f.split("/"):                                   # a term in a folder or file name
            if scan(comp):
                results.append(("!name", 0, digest(salt, comp)))
        path = REPO / f
        suffix = path.suffix.lower()
        if suffix in TEXT_SUFFIXES | OFFICE_SUFFIXES | ZIP_SUFFIXES:
            if path.stat().st_size > MAX_BYTES:
                warn("", f"file over the {MAX_BYTES // (1024 * 1024)} MB cap, content not checked")
            else:
                results += scan_file(path.read_bytes(), suffix, scan, salt, warn)
        for label, n, line_hash in results:
            if (f, line_hash) in baseline:
                used.add((f, line_hash))
                excused += 1
                continue
            where = f"{f}{label}" + (f":{n}" if n else "")
            what = "file name" if label.endswith("!name") else "text"
            print(f"{where}: names an agency (a term on the list, in a {what})")
            found += 1
    stale = 0
    if not args.files:                      # only a full run can tell an entry is no longer needed
        for f, h in sorted(baseline - used):
            print(f"{BASELINE.relative_to(REPO).as_posix()}: entry for {f} no longer matches a line; remove it")
            stale += 1
    print(f"{len(files)} file(s) checked; {found} hit(s)"
          + (f"; {excused} excused by the baseline" if excused else "")
          + (f"; {warned} warning(s)" if warned else "")
          + (f"; {stale} stale baseline entr{'ies' if stale > 1 else 'y'}" if stale else ""))
    return 1 if found or stale else 0


if __name__ == "__main__":
    sys.exit(main())
