"""Tests for scripts/source_watch/review_gate.py: which gated pages wait for review.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import datetime as dt
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "source_watch"))

import report  # noqa: E402
import review_gate as rg  # noqa: E402

PAGE = """---
title: "Chapter 01 — Test"
review-status: pending
---

# Chapter 01

Body text.
"""


class Gate(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.book = self.root / rg.GATED[0]
        self.book.mkdir(parents=True)
        self.page = self.book / "01-test.md"
        self.page.write_text(PAGE, encoding="utf-8")
        (self.book / "_BRIEF.md").write_text(PAGE, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_a_pending_page_waits_and_underscore_files_are_skipped(self):
        rows = rg.waiting(self.root)
        self.assertEqual([r["page"] for r in rows], [f"{rg.GATED[0]}/01-test.md"])
        self.assertEqual(rows[0]["reason"], "not yet reviewed")

    def test_an_approved_page_stops_waiting(self):
        self.page.write_text(rg.approve(self.page, dt.date(2026, 11, 2)), encoding="utf-8")
        self.assertEqual(rg.waiting(self.root), [])
        meta = rg.fields(self.page.read_text(encoding="utf-8"))
        self.assertEqual(meta["review-status"], "approved")
        self.assertEqual(meta["last-reviewed"], "2026-11-02")

    def test_a_change_after_approval_reopens_the_review(self):
        self.page.write_text(rg.approve(self.page, dt.date(2026, 11, 2)), encoding="utf-8")
        self.page.write_text(self.page.read_text(encoding="utf-8") + "\nA new paragraph.\n", encoding="utf-8")
        rows = rg.waiting(self.root)
        self.assertEqual(len(rows), 1)
        self.assertIn("changed since it was approved on 2026-11-02", rows[0]["reason"])

    def test_front_matter_edits_and_trailing_spaces_dont_reopen_it(self):
        self.page.write_text(rg.approve(self.page, dt.date(2026, 11, 2)), encoding="utf-8")
        text = self.page.read_text(encoding="utf-8").replace('title: "Chapter 01 — Test"', 'title: "Chapter 01 — Renamed"')
        crlf = text.replace("Body text.", "Body text.   ").replace("\n", "\r\n")
        self.page.write_bytes(crlf.encode("utf-8"))
        self.assertEqual(rg.waiting(self.root), [])

    def test_approving_twice_keeps_one_set_of_fields(self):
        once = rg.approve(self.page, dt.date(2026, 11, 2))
        self.page.write_text(once, encoding="utf-8")
        twice = rg.approve(self.page, dt.date(2026, 11, 3))
        self.assertEqual(twice.count("review-status:"), 1)
        self.assertEqual(twice.count("reviewed-sha256:"), 1)
        self.assertIn("last-reviewed: 2026-11-03", twice)


class Report(unittest.TestCase):
    def test_waiting_pages_make_a_section_and_count_as_findings(self):
        results = {"week_of": "2026-11-02", "review_gate": [{"page": "docs/books/b19-developer-workbook/01-x.md", "title": "Chapter 01 — X",
                                    "reason": "not yet reviewed", "last_reviewed": ""}]}
        self.assertTrue(report.has_findings(results))
        text = report.render(results)
        self.assertIn("## Developer Workbook awaiting review", text)
        self.assertIn("not yet reviewed", text)

    def test_no_waiting_pages_no_section(self):
        self.assertFalse(report.has_findings({"review_gate": []}))
        self.assertNotIn("## Developer Workbook awaiting review", report.render({"week_of": "2026-11-02", "review_gate": []}))


if __name__ == "__main__":
    unittest.main()
