#!/usr/bin/env python3
"""Flag compliance overclaims: "supports, not satisfies".

A technology, kit, configuration or page never by itself satisfies, meets,
closes, fulfills, achieves compliance with or ensures compliance with a
control or requirement. It supports it, contributes to it or provides
evidence for it, and the organization still owns the organization-defined
parameters, the policy and procedures, and assessment and authorization. Only
an assessor or authorizing official decides that a control is satisfied. The
rule and its exceptions are in CONTRIBUTING.md ("Claim language") and
docs/about/sources-and-verification.md.

This check flags a line of a published page where a satisfy-family verb sits
within a few words of a control or requirement: an SP 800-53 control (AC-2,
SC-7(3)), an RMF task (S-4), an OMB memo (M-22-09), a CISA directive
(BOD 22-01, ED 21-02), a FedRAMP KSI, TIC, FedRAMP, CMMC, FISMA, NIST, or the
words control, requirement, mandate, directive or memo.

    python scripts/check_claims.py                   # every published page; exit 1 on a new hit
    python scripts/check_claims.py docs/x.md         # just these files
    python scripts/check_claims.py --report          # hits per file, with the baseline counted
    python scripts/check_claims.py --list docs/x.md  # every hit with its text

Not flagged: fenced and inline code, HTML comments, link targets, blockquotes
and quoted text (a source quoted verbatim); a negated verb ("does not
satisfy", "never meets"); and a requirement described as a requirement ("the
memo requires agencies to meet", "agencies must meet"). Any other legitimate
use, such as a sentence about what an assessor decides, carries an allow
marker on the same line or alone on the line above:

    <!-- claims-ok: the assessor's determination, not a claim -->

The marker needs a reason after the colon.

Scope: .md and .qmd pages the site publishes (the render list in
_quarto.yml, minus files and folders starting with "_") and the example
kits' README.md files. Lines that predate the check are excused by
data/claims-baseline.txt, one "<file> <line hash>" per line, so only that
exact line text passes. The baseline only shrinks: a full run fails on an
entry that no longer matches a hit.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BASELINE = REPO / "data" / "claims-baseline.txt"

PUBLISHED_ROOTS = ("docs/books/", "docs/presentations/", "docs/inspiration/", "docs/about/", "docs/reference/",
                   "docs/training/", "docs/evaluations/", "docs/project-plans/")
PUBLISHED_FILES = ("index.qmd", "workbook-map.qmd", "404.qmd", "docs/start-here.md", "docs/downloads.md",
                   "docs/research/index.md")
PAGE_SUFFIXES = (".md", ".qmd")

# The satisfy family. "met" alone is too common to judge, so it counts only as
# "met by" / "is met".
VERB = re.compile(
    r"\b(?:satisf(?:y|ies|ied|ying)"
    r"|meet(?:s|ing)?"
    r"|(?:is|are|be|been|being|fully|already)\s+met"
    r"|met\s+by"
    r"|clos(?:e|es|ed|ing)"
    r"|fulfil(?:l|ls|led|ling|s)?"
    r"|achiev(?:e|es|ed|ing)\s+(?:full\s+)?compliance"
    r"|ensur(?:e|es|ed|ing)\s+(?:full\s+)?compliance"
    r"|compliance\s+(?:is\s+)?achieved)\b",
    re.I)

CONTROL_FAMILIES = "AC|AT|AU|CA|CM|CP|IA|IR|MA|MP|PE|PL|PM|PS|PT|RA|SA|SC|SI|SR"
TARGET = re.compile(
    r"\b(?:" + CONTROL_FAMILIES + r")-\d{1,2}(?:\s?\(\d{1,2}\))?(?![-\d])"   # SP 800-53 control or enhancement
    r"|\b[PCSIARM]-\d{1,2}\b(?![-\d])"                                       # RMF task (SP 800-37)
    r"|\bM-\d{2}-\d{2}\b"                                                    # OMB memo
    r"|\b(?:BOD|ED)[ -]?\d{2}-\d{2}\b"                                       # CISA directive
    r"|\bKSI(?:-[A-Z]+(?:-\d+)?)?s?\b"                                       # FedRAMP KSI
    r"|\bTIC\b|\bFedRAMP\b|\bCMMC\b|\bFISMA\b|\bNIST\b|\bSP\s?800-\d+"
    r"|\b(?:controls?|requirements?|mandates?|directives?|memos?|memorand(?:um|a))\b",
    re.I)
# The identifiers are matched case-sensitively; only the plain words ignore case.
ID_CASE = re.compile(
    r"\b(?:" + CONTROL_FAMILIES + r")-\d|\b[PCSIARM]-\d|\bM-\d\d-|\b(?:BOD|ED)[ -]?\d|\bKSI|\bTIC\b|\bFedRAMP\b|"
    r"\bCMMC\b|\bFISMA\b|\bNIST\b|\bSP\s?800")
WINDOW = 60                     # characters between the verb and the target, within one sentence

NEGATION = re.compile(r"\b(?:not|never|no|cannot|neither|nor|without|isn't|doesn't|don't|won't|can't|"
                      r"didn't|aren't|wasn't|by itself|on its own|alone)\b[^.;:]{0,60}$", re.I)
NEGATED_OBJECT = re.compile(r"^\s+(?:none|no|nothing|neither|nobody's)\b", re.I)
# "close" is also an adjective, a noun and a date verb ("CISA closed the directive on
# January 8"), so it counts only with the control or requirement after it.
CLOSE_NOT_A_CLAIM = re.compile(r"^\s+(?:to|of|with|on|in|by|out|the\s+loop|the\s+gap|(?:January|February|"
                               r"March|April|May|June|July|August|September|October|November|December)\b)", re.I)
WAY_TO = re.compile(r"\b(?:ways?|how|path|route|order|plans?|time|deadline|guide)\s+to\s+$", re.I)
# Closing a finding, a gap or a POA&M item is remediation, not a compliance claim.
# A directive closed on a date is retired, not complied with.
CLOSE_REMEDIATES = re.compile(r"\b(?:findings?|gaps?|deviations?|items?|tickets?|exposures?|loop|January|February|March|"
                              r"April|May|June|July|August|September|October|November|December)\b", re.I)
# Conditional Access calls its own policy settings grant and session controls.
PRODUCT_CONTROL = re.compile(r"\b(?:grant|session)\s+$", re.I)
# The verb and the target must share a clause: no punctuation or clause word between them.
CLAUSE_BREAK = re.compile(r"[,;:()\[\]]|\b(?:to|but|while|when|because|so|which|who)\b", re.I)
FOOTNOTE_DEF = re.compile(r"^\s*\[\^[^\]]+\]:")
REQUIREMENT = re.compile(r"(?:\b(?:must|shall|should)(?:\s+\S+){0,2}"
                         r"|\b(?:requires?|required|needs?|needed|ha(?:s|ve)|contributes?|supports?|"
                         r"supporting)\b(?:\s+\S+){0,4}?\s+to"
                         r"|\b(?:helps?|helping|whether)\b(?:\s+\S+){0,4}?)\s+$", re.I)
ALLOW = re.compile(r"<!--\s*claims-ok:\s*\S.*?-->", re.I)
ALLOW_ALONE = re.compile(r"^\s*<!--\s*claims-ok:\s*\S.*?-->\s*$", re.I)

FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
COMMENT = re.compile(r"<!--.*?-->", re.S)
INLINE_CODE = re.compile(r"(`+)(?:(?!\1).)+?\1")
LINK_TARGET = re.compile(r"\]\([^)]*\)|<https?://[^>]*>|https?://\S+")
FOOTNOTE_REF = re.compile(r"\[\^[^\]]+\]")
QUOTED = re.compile(r"\"[^\"\n]*\"|“[^”\n]*”")
SENTENCE_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z*_\[(])|\s\|\s|;\s")


def in_scope(path: str) -> bool:
    p = Path(path)
    if p.suffix.lower() not in PAGE_SUFFIXES:
        return False
    if any(part.startswith("_") for part in p.parts):
        return False
    if path in PUBLISHED_FILES or path.startswith(PUBLISHED_ROOTS):
        return True
    parts = path.split("/")
    return len(parts) == 3 and parts[0] == "examples" and parts[2] == "README.md"


def line_hash(raw: str) -> str:
    return hashlib.sha256(raw.strip().encode("utf-8")).hexdigest()


def read_baseline(path: Path = BASELINE) -> set[tuple[str, str]]:
    out = set()
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                f, h = line.rsplit(None, 1)
                out.add((f, h.lower()))
    return out


def _blank(m: re.Match) -> str:
    return re.sub(r"[^\n]", " ", m.group(0))


def scannable(text: str) -> list[str]:
    """The page's lines with code, comments, link targets, blockquotes and quoted text blanked."""
    text = COMMENT.sub(_blank, text)
    out, fence = [], None
    for line in text.split("\n"):
        m = FENCE.match(line)
        if fence:
            if m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence):
                fence = None
            out.append("")
            continue
        if m:
            fence = m.group(1)
            out.append("")
            continue
        if line.lstrip().startswith(">"):
            out.append("")
            continue
        line = INLINE_CODE.sub(_blank, line)
        line = LINK_TARGET.sub(_blank, line)
        line = FOOTNOTE_REF.sub(_blank, line)
        line = QUOTED.sub(_blank, line)
        out.append(line)
    return out


def _is_target(m: re.Match) -> bool:
    s = m.group(0)
    if s[:1].isalpha() and s.lower() in ("control", "controls", "requirement", "requirements", "mandate",
                                         "mandates", "directive", "directives", "memo", "memos",
                                         "memorandum", "memoranda"):
        return True
    return bool(ID_CASE.match(s))


def sentence_hits(sentence: str) -> bool:
    targets = [m for m in TARGET.finditer(sentence)
               if _is_target(m) and not PRODUCT_CONTROL.search(sentence[max(0, m.start() - 10):m.start()])]
    if not targets:
        return False
    for v in VERB.finditer(sentence):
        before, after = sentence[:v.start()], sentence[v.end():]
        if NEGATION.search(before[-80:]) or REQUIREMENT.search(before[-50:]) or WAY_TO.search(before[-30:]):
            continue
        if NEGATED_OBJECT.match(after):
            continue
        close = v.group(0).lower().startswith("clos")
        if close and (CLOSE_NOT_A_CLAIM.match(after) or CLOSE_REMEDIATES.search(after[:50])):
            continue
        for t in targets:
            if t.start() >= v.end():
                between = sentence[v.end():t.start()]
            elif close:
                continue
            else:
                between = sentence[t.end():v.start()]
            if len(between) <= WINDOW and not CLAUSE_BREAK.search(between):
                return True
    return False


def hits(text: str) -> list[tuple[int, str]]:
    """(line number, raw line) for every line with an unmarked overclaim."""
    raw_lines = text.split("\n")
    out = []
    for n, line in enumerate(scannable(text), 1):
        if not line.strip():
            continue
        raw = raw_lines[n - 1]
        if FOOTNOTE_DEF.match(raw):         # a note's source title is the source's own words
            continue
        if ALLOW.search(raw) or (n > 1 and ALLOW_ALONE.match(raw_lines[n - 2])):
            continue
        if any(sentence_hits(s) for s in SENTENCE_END.split(line)):
            out.append((n, raw))
    return out


def tracked() -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=REPO, capture_output=True, check=True).stdout
    return [p for p in out.decode("utf-8").split("\0") if p]


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")   # type: ignore[attr-defined]
        except AttributeError:
            pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("files", nargs="*", help="repo-relative files (default: every published page in scope)")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="exit 1 on a hit the baseline doesn't excuse (default)")
    mode.add_argument("--report", action="store_true", help="print hits per file, new and baselined; always exit 0")
    mode.add_argument("--list", action="store_true", help="print every hit with its line text; always exit 0")
    args = ap.parse_args(argv)

    baseline = read_baseline()
    files = [f.replace("\\", "/") for f in args.files] if args.files else tracked()
    files = sorted(f for f in files if in_scope(f) and (REPO / f).is_file())
    new, excused, used = Counter(), Counter(), set()
    for f in files:
        text = (REPO / f).read_text(encoding="utf-8", errors="replace")
        for n, raw in hits(text):
            h = line_hash(raw)
            if (f, h) in baseline:
                used.add((f, h))
                excused[f] += 1
                if args.list:
                    print(f"{f}:{n}: [baseline] {raw.strip()}")
                continue
            new[f] += 1
            if args.list:
                print(f"{f}:{n}: {raw.strip()}")
            elif not args.report:
                print(f"{f}:{n}: says a control or requirement is satisfied; say what it supports "
                      f"(or mark a legitimate use with <!-- claims-ok: reason -->)")
    if args.report:
        width = max((len(f) for f in new | excused), default=4)
        print(f"{'file':<{width}}  new  baselined")
        for f in sorted(set(new) | set(excused)):
            print(f"{f:<{width}}  {new[f]:>3}  {excused[f]:>9}")
        by_folder = Counter()
        for f, c in (new + excused).items():
            by_folder["/".join(f.split("/")[:3]) if f.startswith("docs/") else f.split("/")[0]] += c
        print("\nby folder:")
        for k, c in sorted(by_folder.items()):
            print(f"  {k}: {c}")
    stale = 0
    if not args.files:
        for f, h in sorted(baseline - used):
            print(f"{BASELINE.relative_to(REPO).as_posix()}: entry for {f} no longer matches a hit; remove it")
            stale += 1
    total_new, total_old = sum(new.values()), sum(excused.values())
    print(f"{len(files)} file(s) checked; {total_new} hit(s)"
          + (f"; {total_old} excused by the baseline" if total_old else "")
          + (f"; {stale} stale baseline entr{'ies' if stale > 1 else 'y'}" if stale else ""))
    if args.report or args.list:
        return 0
    return 1 if total_new or stale else 0


if __name__ == "__main__":
    sys.exit(main())
