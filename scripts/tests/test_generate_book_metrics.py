"""Tests for scripts/generate_book_metrics.py: only the books table is rewritten.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_book_metrics as gbm  # noqa: E402

INDEX = """# Books

| Book | Topic | Opening question | Status | Chapters | Pages | Last updated |
|---|---|---|---|---:|---:|---|
| **B00** | **[Orientation](b00-orientation/index.md)** | **Why?** | **Draft** | 1 | 5 | 2026-11-01 |
| **B01** | **[Arc](b01-arc/index.md)** | **Why hard?** | **Draft** | 1 | 5 | 2026-11-01 |

## How the books connect

| Book | Refers most to | Most referred to by |
|---|---|---|
| **B00** [Orientation](b00-orientation/index.md) | [B01 Arc](b01-arc/index.md) | [B01 Arc](b01-arc/index.md) |
| **B01** [Arc](b01-arc/index.md) | [B00 Orientation](b00-orientation/index.md) | [B00 Orientation](b00-orientation/index.md) |
"""


def chapter(status: str) -> str:
    return f"---\ntitle: One\nstatus: {status}\n---\n# One\n\nSome words here.\n"


class BooksTableOnly(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        books = root / "docs" / "books"
        for folder, status in (("b00-orientation", "baseline"), ("b01-arc", "draft")):
            (books / folder).mkdir(parents=True)
            (books / folder / "01-one.md").write_text(chapter(status), encoding="utf-8")
        (books / "index.md").write_text(INDEX, encoding="utf-8")
        self.saved = gbm.ROOT, gbm.BOOKS, gbm.INDEX
        gbm.ROOT, gbm.BOOKS, gbm.INDEX = root, books, books / "index.md"

    def tearDown(self) -> None:
        gbm.ROOT, gbm.BOOKS, gbm.INDEX = self.saved
        self.tmp.cleanup()

    def run_main(self) -> str:
        with contextlib.redirect_stdout(io.StringIO()):
            gbm.main()
        return gbm.INDEX.read_text(encoding="utf-8")

    def test_crosswalk_rows_are_left_alone(self) -> None:
        text = self.run_main()
        crosswalk = INDEX.split("## How the books connect")[1]
        self.assertTrue(text.endswith(crosswalk))

    def test_status_reads_baseline_only_when_every_chapter_says_so(self) -> None:
        rows = [r for r in self.run_main().split("\n") if r.startswith("| **B0")][:2]
        self.assertIn("**Baseline**", rows[0])
        self.assertIn("**Draft**", rows[1])

    def test_second_run_changes_nothing(self) -> None:
        first = self.run_main()
        self.assertEqual(first, self.run_main())


if __name__ == "__main__":
    unittest.main()
