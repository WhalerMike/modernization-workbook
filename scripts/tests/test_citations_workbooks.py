"""The source watch keeps watching moved pages: the developer workbooks after their move to Projects,
and the status-labeled pages after the research area was split by type.

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


class StatusLabeledCitations(unittest.TestCase):
    """Guides, explainers, evaluations, training and reference pages with a status
    label are RES sources wherever they live, each exactly once."""

    def test_every_status_labeled_page_is_a_res_source_once(self):
        docs = ROOT / "docs"
        expected = sorted(
            p for p in docs.rglob("*.md")
            if p.name != "index.md"
            and not any(part.startswith("_") for part in p.relative_to(docs).parts)
            and citations.has_research_status(p)
            and not (p.parent.parent == citations.BOOKS and p.parent.name[:1] == "b" and p.parent.name[1:3].isdigit()))
        self.assertTrue(expected)
        got = [p for code, p in citations.sources() if code == citations.RESEARCH_CODE]
        self.assertEqual(sorted(got), expected)
        all_files = [p for _, p in citations.sources()]
        self.assertEqual(len(all_files), len(set(all_files)))

    def test_moved_sections_are_covered_and_research_is_empty(self):
        got = {p.relative_to(ROOT).parent.as_posix() for code, p in citations.sources()
               if code == citations.RESEARCH_CODE}
        for folder in ("docs/books/guides", "docs/books/explainers", "docs/training",
                       "docs/evaluations", "docs/reference"):
            self.assertIn(folder, got)
        self.assertNotIn("docs/research", got)
        self.assertIn(citations.RESEARCH_CODE, citations.books())


if __name__ == "__main__":
    unittest.main()
