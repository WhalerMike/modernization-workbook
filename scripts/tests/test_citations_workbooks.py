"""The source watch keeps watching the developer workbooks' citations after their move to Projects.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "source_watch"))

import citations  # noqa: E402


class WorkbookCitations(unittest.TestCase):
    def test_every_published_workbook_page_is_a_dw_source(self):
        folder = ROOT / "docs" / "project-plans" / "developer-workbooks"
        expected = sorted(p for p in folder.rglob("*.md")
                          if not any(part.startswith("_") for part in p.relative_to(folder).parts))
        self.assertTrue(expected)
        got = sorted(p for code, p in citations.sources() if code == citations.WORKBOOKS_CODE)
        self.assertEqual(got, expected)

    def test_dw_has_a_report_heading_and_no_book_code(self):
        books = citations.books()
        self.assertIn(citations.WORKBOOKS_CODE, books)
        self.assertNotIn("B19", books)


if __name__ == "__main__":
    unittest.main()
