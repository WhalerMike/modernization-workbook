"""Tests for scripts/source_watch/review_dates.py: pages past their lifecycle review date.

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
import review_dates as rd  # noqa: E402


def page(review: str | None, title: str = "A page") -> str:
    lines = ["---", f'title: "{title}"', "lifecycle: active"]
    if review is not None:
        lines.append(f"lifecycle_review: {review}")
    return "\n".join(lines + ["---", "", "Body.", ""])


class Lifecycle(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.docs = Path(self.tmp.name) / "docs"
        (self.docs / "books" / "_verification").mkdir(parents=True)
        (self.docs / "research").mkdir()
        self.today = dt.date(2026, 11, 23)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, rel: str, text: str) -> None:
        (self.docs / rel).write_text(text, encoding="utf-8")

    def test_only_passed_dates_are_listed_most_overdue_first(self):
        self.write("books/a.md", page("2026-11-22"))
        self.write("books/b.md", page("2026-10-01"))
        self.write("books/c.md", page("2026-11-23"))  # due today: not yet overdue
        self.write("books/d.md", page("2027-04-01"))
        self.write("books/e.md", page(None))
        rows = rd.lifecycle_due(self.today, self.docs)
        self.assertEqual([r["page"] for r in rows], ["docs/books/b.md", "docs/books/a.md"])
        self.assertEqual(rows[1]["overdue_days"], 1)

    def test_underscore_paths_research_pages_and_bad_dates_are_skipped(self):
        self.write("books/_verification/a.md", page("2026-01-01"))
        self.write("books/_brief.md", page("2026-01-01"))
        self.write("research/a.md", page("2026-01-01"))
        self.write("books/bad.md", page("soon"))
        self.assertEqual(rd.lifecycle_due(self.today, self.docs), [])

    def test_crlf_and_quoted_dates_are_read(self):
        (self.docs / "books" / "a.md").write_bytes(page('"2026-11-01"').replace("\n", "\r\n").encode("utf-8"))
        self.assertEqual(len(rd.lifecycle_due(self.today, self.docs)), 1)

    def test_the_report_lists_them_and_counts_them_as_findings(self):
        self.write("books/a.md", page("2026-11-01", "Chapter 01"))
        results = {"week_of": "2026-11-23", "lifecycle_due": rd.lifecycle_due(self.today, self.docs)}
        self.assertTrue(report.has_findings(results))
        text = report.render(results)
        self.assertIn("## Pages past their lifecycle review date", text)
        self.assertIn("| active | 2026-11-01 (22 days ago) |", text)
        self.assertIn("**1 pages past their lifecycle review date**", text)


if __name__ == "__main__":
    unittest.main()
