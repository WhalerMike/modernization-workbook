"""Tests for scripts/check_claims.py: what counts as an overclaim, the exceptions,
the allow marker, scope and the baseline.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_claims as cc  # noqa: E402


def flagged(text: str) -> list[int]:
    return [n for n, _ in cc.hits(text)]


class Overclaims(unittest.TestCase):
    def test_satisfy_family_near_a_control(self):
        for line in ("The kit satisfies AC-2.",
                     "This gate meets NIST SP 800-53 AC-2 and IA-4.",
                     "Conditional Access closes IA-2(1) for administrators.",
                     "The pipeline fulfills SR-4.",
                     "AC-6 is met by just-in-time activation.",
                     "The configuration achieves compliance with M-22-09.",
                     "Deploying the baseline ensures compliance with BOD 25-01.",
                     "The policy meets the requirement for phishing-resistant MFA.",
                     "The dashboard closes KSI-IAM-MFA.",
                     "The design meets TIC 3.0.",
                     "The monitoring satisfies RMF task S-4.",
                     "CA001 meets MS.AAD.1.1v1 after legacy clients move.",
                     "The policy satisfies MS.EXO.5.1v1.",
                     "Enabling it fulfills MS.AAD.3.6v1 for privileged roles."):
            self.assertEqual(flagged(line), [1], line)

    def test_supports_and_evidence_are_fine(self):
        for line in ("The kit supports AC-2 and provides evidence for IA-4.",
                     "The gate contributes to M-22-09's phishing-resistant MFA goal.",
                     "CA001 addresses MS.AAD.1.1v1 after legacy clients move.",
                     "The policy does not satisfy MS.EXO.5.1v1.",
                     "The pipeline meets the January 12 date.",
                     "The team will meet on Tuesday to review the controls.",
                     "SI-2 closes flaws.",
                     "CISA closed the directive on January 8, 2026."):
            self.assertEqual(flagged(line), [], line)

    def test_one_hit_per_line_and_line_numbers(self):
        self.assertEqual(flagged("ok\nIt satisfies AC-2 and meets AC-3.\nok"), [2])

    def test_verb_and_target_must_share_a_clause(self):
        self.assertEqual(flagged("The design meets the latency budget, and AC-2 is covered elsewhere."), [])
        self.assertEqual(flagged("The loop (request, approve, close) and the control each step evidences."), [])


class Exceptions(unittest.TestCase):
    def test_negation(self):
        for line in ("Following the book doesn't satisfy any control.",
                     "No single console closes SI-2 on a multi-platform estate.",
                     "DIA satisfies none of the protection controls.",
                     "It doesn't claim that following the workbook satisfies any requirement or control."):
            self.assertEqual(flagged(line), [], line)

    def test_requirement_described_as_a_requirement(self):
        for line in ("The memo requires agencies to meet M-22-09's targets.",
                     "Agencies must meet BOD 25-01 by the deadline.",
                     "The plan shows how to meet the requirement.",
                     "It is one way to meet the requirement, not the only one."):
            self.assertEqual(flagged(line), [], line)

    def test_closing_findings_is_remediation(self):
        self.assertEqual(flagged("Close the BOD 25-01 findings before assessing."), [])

    def test_conditional_access_product_terms(self):
        self.assertEqual(flagged("Session controls apply once all grant controls are met."), [])

    def test_code_quotes_blockquotes_and_notes(self):
        text = "\n".join([
            "```",
            "The kit satisfies AC-2.",
            "```",
            "> The system meets AC-2, the vendor writes.",
            'The vendor writes that the product "meets all FedRAMP High controls" in its description.',
            "Run `Test-Gate -Satisfies AC-2` to check.",
            "[^n1]: Microsoft Learn, Meet memo 22-09 multifactor authentication requirements.",
            "See [the kit page](https://example.com/satisfies-AC-2).",
            "<!-- the kit satisfies AC-2 -->",
        ])
        self.assertEqual(flagged(text), [])

    def test_footnote_reference_ends_a_sentence(self):
        self.assertEqual(flagged("Levels a pipeline can meet.[^c07-slsa] SR-4 asks for provenance."), [])


class AllowMarker(unittest.TestCase):
    def test_same_line(self):
        self.assertEqual(flagged("The assessor found AC-2 satisfied. <!-- claims-ok: the assessor's determination -->"), [])

    def test_line_above(self):
        self.assertEqual(flagged("<!-- claims-ok: the assessor's determination -->\nThe assessor found AC-2 satisfied."), [])

    def test_needs_a_reason(self):
        self.assertEqual(flagged("The kit satisfies AC-2. <!-- claims-ok: -->"), [1])
        self.assertEqual(flagged("The kit satisfies AC-2. <!-- claims-ok -->"), [1])

    def test_marker_two_lines_up_does_not_count(self):
        self.assertEqual(flagged("<!-- claims-ok: reason -->\n\nThe kit satisfies AC-2."), [3])


class Scope(unittest.TestCase):
    def test_in_scope(self):
        for p in ("docs/books/b02-identity/index.md", "docs/training/index.md", "docs/reference/rmf-map.md",
                  "docs/evaluations/x.md", "docs/project-plans/developer-workbooks/a/01.md", "index.qmd",
                  "docs/start-here.md", "examples/validation-kit/README.md"):
            self.assertTrue(cc.in_scope(p), p)

    def test_out_of_scope(self):
        for p in ("docs/books/b02-identity/_verification/01-x.md", "docs/books/b02-identity/_BRIEF.md",
                  "docs/compliance/Vol_I.md", "examples/validation-kit/docs/notes.md", "STATUS.md",
                  "presentations/b07-pki/README.md", "docs/books/b02-identity/files/x.csv", "CONTRIBUTING.md"):
            self.assertFalse(cc.in_scope(p), p)


class Baseline(unittest.TestCase):
    def test_read_baseline(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "baseline.txt"
            p.write_text("# why\ndocs/a.md ABC\n\n", encoding="utf-8")
            self.assertEqual(cc.read_baseline(p), {("docs/a.md", "abc")})

    def test_line_hash_ignores_surrounding_space_and_crlf(self):
        self.assertEqual(cc.line_hash("  The kit satisfies AC-2.\r"), cc.line_hash("The kit satisfies AC-2."))

    def test_baseline_file_parses(self):
        for f, h in cc.read_baseline():
            self.assertTrue(cc.in_scope(f), f)
            self.assertRegex(h, r"^[0-9a-f]{64}$")


if __name__ == "__main__":
    unittest.main()
