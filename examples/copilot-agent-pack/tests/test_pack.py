"""Checks for the Copilot agent pack.

Agent Builder limits (Microsoft Learn, "Build agents in Agent Builder" and the
declarative agent manifest, accessed Oct 28, 2026): name 30 characters,
description 1,000, instructions 8,000, at most 12 conversation starters.
Knowledge files must be a type Agent Builder reads.
"""

import re
from pathlib import Path

PACK = Path(__file__).resolve().parents[1]
AGENT = PACK / "agent"
KNOWLEDGE = PACK / "knowledge"

SUPPORTED_KNOWLEDGE = {".doc", ".docx", ".pdf", ".ppt", ".pptx", ".txt", ".xls", ".xlsx"}


def read(path):
    return path.read_text(encoding="utf-8")


def starters():
    text = read(AGENT / "starter-prompts.md")
    return re.findall(r"^### \d+\. (.+?)\n\n```text\n(.+?)\n```", text, re.M | re.S)


def test_field_limits():
    assert 0 < len(read(AGENT / "name.txt").strip()) <= 30
    assert 0 < len(read(AGENT / "description.txt").strip()) <= 1000
    assert 0 < len(read(AGENT / "instructions.txt").strip()) <= 8000


def test_files_are_plain_ascii():
    # Pasting into a web form: avoid smart quotes and other characters that
    # change length or render oddly.
    for path in [*AGENT.glob("*.txt"), *KNOWLEDGE.glob("*")]:
        read(path).encode("ascii")


def test_starter_prompts():
    found = starters()
    assert 1 <= len(found) <= 12
    for title, prompt in found:
        assert title.strip() and prompt.strip()


def test_knowledge_file_types():
    files = list(KNOWLEDGE.iterdir())
    assert files
    for path in files:
        assert path.suffix in SUPPORTED_KNOWLEDGE, path.name


def test_instructions_carry_the_rules():
    text = read(AGENT / "instructions.txt")
    for phrase in [
        "A named reviewer who is not the author must read every line",
        "verify against the vendor documentation",
        "No production data, credentials or secrets in prompts",
        "No secrets in code",
        "Awaiting verification",
        "ATF never runs in production",
        "never a standard change",
        "Chief AI Officer",
        "AI tool used",
    ]:
        assert phrase in text, phrase


def test_acceptance_test_covers_every_starter_and_test_id():
    text = read(PACK / "acceptance-test.md")
    for n in range(1, 18):
        assert re.search(rf"^### T{n}\. ", text, re.M), f"T{n}"
    for n, (title, _) in enumerate(starters(), start=1):
        assert f"starter prompt {n}, \"{title}.\"" in text or f"starter prompt {n}, then" in text, title


def test_email_addresses_are_synthetic():
    # The pack is agency-neutral: any address it shows uses a reserved example
    # domain, except the deliberate real-looking one acceptance test T1 must catch.
    allowed = re.compile(r"@(example\.(org|com)|contoso\.example|agency\.gov)$", re.I)
    for path in [*AGENT.glob("*"), *KNOWLEDGE.glob("*"), PACK / "README.md", PACK / "acceptance-test.md"]:
        for address in re.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", read(path)):
            assert allowed.search(address), f"{path.name}: {address}"
