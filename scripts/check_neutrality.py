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

Scope: tracked text files under docs/, examples/, data/, presentations/ and
scripts/, and the top-level pages, except the paths in EXCLUDE (the archive,
the inbox, the deliberately agency-specific interview decks, and the writer
briefs that have to say what not to write). Quarto profile attributes
(unless-profile="..." and when-profile="...") are build switches, not text,
and are ignored.

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
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
TERMS = REPO / "data" / "neutrality-terms.txt"
BASELINE = REPO / "data" / "neutrality-baseline.txt"
ROOTS = ("docs/", "examples/", "data/", "presentations/", "scripts/")
TOP_LEVEL = ("README.md", "index.qmd", "404.qmd", "sitemap.qmd", "PROJECT-CHARTER.md", "PROJECT-PLAN.md",
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
WORD = re.compile(r"[a-z0-9]+")
DOTTED = re.compile(r"\b(?:[a-z]\.){2,}(?:[a-z]\b)?")          # a.b.c. or a.b.c: one word
PROFILE_ATTR = re.compile(r"\b(?:unless|when)-profile\s*=\s*\"[^\"]*\"")


def in_scope(path: str) -> bool:
    if path.startswith(EXCLUDE) or Path(path).name in EXCLUDE_NAMES:
        return False
    if Path(path).suffix.lower() not in TEXT_SUFFIXES:
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

    salt, max_words, hashes, firsts = read_terms()
    baseline = read_baseline()
    cache: dict[str, bool] = {}
    files = [f.replace("\\", "/") for f in args.files] if args.files else tracked()
    files = [f for f in files if in_scope(f) and (REPO / f).is_file()]
    found, excused, used = 0, 0, set()
    for f in files:
        text = (REPO / f).read_text(encoding="utf-8", errors="replace")
        for line, phrase, line_hash in hits(text, salt, max_words, hashes, firsts, cache):
            if (f, line_hash) in baseline:
                used.add((f, line_hash))
                excused += 1
                continue
            words = len(phrase.split())
            print(f"{f}:{line}: names an agency (a {words}-word term on the list)")
            found += 1
    stale = 0
    if not args.files:                      # only a full run can tell an entry is no longer needed
        for f, h in sorted(baseline - used):
            print(f"{BASELINE.relative_to(REPO).as_posix()}: entry for {f} no longer matches a line; remove it")
            stale += 1
    print(f"{len(files)} file(s) checked; {found} hit(s)"
          + (f"; {excused} excused by the baseline" if excused else "")
          + (f"; {stale} stale baseline entr{'ies' if stale > 1 else 'y'}" if stale else ""))
    return 1 if found or stale else 0


if __name__ == "__main__":
    sys.exit(main())
