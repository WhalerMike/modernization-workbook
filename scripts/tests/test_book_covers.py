"""Every book has a cover illustration, and the covers match scripts/covers/build_covers.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("build_covers", ROOT / "scripts" / "covers" / "build_covers.py")
covers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(covers)


class BookCovers(unittest.TestCase):
    def test_every_book_has_a_cover(self):
        books = {p.parent.name for p in (ROOT / "docs" / "books").glob("b[0-9][0-9]-*/index.md")}
        self.assertEqual(books, set(covers.BOOKS), "add the new book to BOOKS in scripts/covers/build_covers.py")

    def test_covers_are_current(self):
        for variant, (out, _style, _dot) in covers.VARIANTS.items():
            for book in covers.BOOKS:
                with self.subTest(variant=variant, book=book):
                    path = out / f"{book}.svg"
                    self.assertTrue(path.exists(), f"run scripts/covers/build_covers.py ({variant}/{path.name} missing)")
                    self.assertEqual(path.read_text(encoding="utf-8"), covers.svg(book, variant), f"{variant}/{path.name} is out of date")

    def test_every_book_has_a_deck_png(self):
        # PNGs for the decks' title slides (build_covers.py --png, in WSL).
        self.assertEqual({p.stem for p in covers.DECK_PNG.glob("*.png")}, set(covers.BOOKS),
                         "run python3 scripts/covers/build_covers.py --png")

    def test_no_stray_covers(self):
        for variant, (out, _style, _dot) in covers.VARIANTS.items():
            with self.subTest(variant=variant):
                self.assertEqual({p.stem for p in out.glob("*.svg")}, set(covers.BOOKS))


if __name__ == "__main__":
    unittest.main()
