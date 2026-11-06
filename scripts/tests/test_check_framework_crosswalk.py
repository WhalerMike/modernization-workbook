"""Tests for scripts/check_framework_crosswalk.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_framework_crosswalk as cf  # noqa: E402

PAGE = """---
research-book: "Books 00–01"
date-modified: 2026-11-06
last-reviewed: 2026-11-06
---
A federal modernization program answers to more. This page maps the workbook's 2 books against it.

| Framework | Status |
|---|---|
| FITARA | In force |

| Framework | 00 Orientation | 01 Arc |
|---|---|---|
| FedRAMP | 3 | 2 |
| FITARA (M-26-10) | 0 | 1 |

## Statutes (2)

| Instrument | What |
|---|---|
| A | x |
| B | y |
"""


class Check(unittest.TestCase):
    def run_check(self, text: str, dirs=("b00-x", "b01-y")) -> list[str]:
        with tempfile.TemporaryDirectory() as d:
            books = Path(d) / "books"
            for n in dirs:
                (books / n).mkdir(parents=True)
            page = Path(d) / "page.md"
            page.write_text(text, encoding="utf-8")
            return cf.check(page, books)

    def test_rmf_scores_follow_the_map(self):
        text = chr(10).join([
            "| A-6 POA&M | x | [b](../books/b14-c/a.md) | e | Covered |",
            "| I-1 Build | x | [b](../books/b04-a/a.md) | e | Covered |",
            "| P-2 Strategy | x | [b](../books/b00-o/a.md) | e | Partial by design |",
        ])
        self.assertEqual(cf.rmf_scores(text, [0, 1, 4, 14]), [1, 0, 2, 3])

    def test_clean_page_passes(self):
        self.assertEqual(self.run_check(PAGE), [])

    def test_new_book_without_column_fails(self):
        out = self.run_check(PAGE, dirs=("b00-x", "b01-y", "b02-z"))
        self.assertTrue(any("research-book" in f for f in out))
        self.assertTrue(any("matrix columns" in f for f in out))
        self.assertTrue(any("2 books" in f for f in out))

    def test_heading_count_must_match_rows(self):
        self.assertTrue(any("Statutes" in f for f in self.run_check(PAGE.replace("(2)", "(3)"))))

    def test_missing_cell_fails(self):
        out = self.run_check(PAGE.replace("| FedRAMP | 3 | 2 |", "| FedRAMP | 3 |"))
        self.assertTrue(any("FedRAMP" in f for f in out))

    def test_status_row_needs_matrix_row(self):
        out = self.run_check(PAGE.replace("| FITARA (M-26-10) | 0 | 1 |\n", ""))
        self.assertTrue(any("FITARA" in f for f in out))

    def test_review_date_not_older_than_modified(self):
        out = self.run_check(PAGE.replace("last-reviewed: 2026-11-06", "last-reviewed: 2026-10-23"))
        self.assertTrue(any("older" in f for f in out))


if __name__ == "__main__":
    unittest.main()
