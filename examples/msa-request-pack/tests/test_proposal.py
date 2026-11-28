"""The production proposal: built from proposal_content.py, its citations real, its placeholders listed (standard library only)."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

PACK = Path(__file__).resolve().parents[1]
PROPOSAL = PACK / "proposal"
sys.path.insert(0, str(PROPOSAL))

import build_proposal  # noqa: E402
import proposal_content as C  # noqa: E402

TEXT_FILES = ["proposal_content.py", "day2-test-script.md", "proposal-prompts.md", "Invoke-MsaDay2ReadOnly.ps1"]
# Placeholders that are part of a pattern, not a value to fill.
PATTERN_PARTS = {"<app>", "<role>", "<service-class>", "<host>", "<port>", "<tags>", "<placeholder>", "<run>",
                 "<test-domain-dn>", "<test-domain-fqdn>", "<test-ou>", "<test-groups-ou>", "<test-host>", "<TESTDOMAIN>"}


def all_text() -> str:
    return "\n".join((PROPOSAL / f).read_text(encoding="utf-8") for f in TEXT_FILES)


def decisions_file() -> Path | None:
    for parent in PACK.parents:
        p = parent / "data" / "decisions.yml"
        if p.is_file():
            return p
    return None


def test_proposal_and_deck_are_current():
    proc = subprocess.run([sys.executable, "build_proposal.py", "--check"], cwd=PROPOSAL, capture_output=True, text=True)
    assert proc.returncode == 0, proc.stdout + proc.stderr


def test_build_text_is_deterministic():
    assert build_proposal.doc_text() == build_proposal.doc_text()
    assert build_proposal.deck_text() == build_proposal.deck_text()


def test_every_cited_decision_exists():
    path = decisions_file()
    if path is None:  # the downloaded pack has no decision register beside it
        return
    known = set(re.findall(r"^- id: (WD-\d+)", path.read_text(encoding="utf-8"), re.M))
    cited = set(re.findall(r"WD-\d+", all_text()))
    assert cited, "the proposal cites no decision"
    assert not cited - known, f"cited but not in data/decisions.yml: {sorted(cited - known)}"


def test_decision_table_covers_the_design():
    ids = {d[0] for d in C.DECISIONS}
    want = {"WD-123", "WD-124", "WD-125", "WD-150", "WD-154"} | {f"WD-{n}" for n in (159, 160, 161, 162, 163, 164, 165, 166, 168, 173, 174, 175, 176)}
    assert want <= ids, sorted(want - ids)


def test_every_source_number_cited_exists():
    numbers = {n for n, _ in C.SOURCES}
    cited = {int(n) for n in re.findall(r"(?<![\w\]\)])\[(\d+)\]", (PROPOSAL / "proposal_content.py").read_text(encoding="utf-8"))}
    assert cited <= numbers, sorted(cited - numbers)


def test_every_placeholder_is_listed():
    listed = {p[0] for p in C.PLACEHOLDERS}
    used = set(re.findall(r"<[a-z0-9-]+>", all_text())) - PATTERN_PARTS
    assert not used - listed, f"placeholders not in the PLACEHOLDERS table: {sorted(used - listed)}"


def test_deck_has_notes_on_every_slide():
    assert 10 <= len(C.SLIDES) <= 12
    for s in C.SLIDES:
        assert len(s["notes"]) > 200, s["title"]


def test_supports_never_satisfies():
    for blk in build_proposal.doc_text():
        low = blk.lower()
        if "satisf" in low:
            assert "doesn't satisfy" in low or '"satisfies"' in low, blk


def test_public_safe_terms():
    text = all_text()
    for pat in (r"GCC High", r"\bDoD\b", r"Azure Government", r"\bCAC\b", r"UIAO", r"\bSAM\b"):
        assert not re.search(pat, text), pat
