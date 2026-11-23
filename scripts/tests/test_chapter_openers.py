"""Chapter openers match scripts/covers/build_openers.py, and each one belongs to a real chapter.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("build_openers", ROOT / "scripts" / "covers" / "build_openers.py")
op = importlib.util.module_from_spec(spec)
spec.loader.exec_module(op)


class ChapterOpeners(unittest.TestCase):
    def test_each_opener_names_a_chapter(self):
        for book, chapters in op.CHAPTERS.items():
            for chapter in chapters:
                with self.subTest(book=book, chapter=chapter):
                    self.assertTrue((ROOT / "docs" / "books" / book / f"{chapter}.md").exists(), f"{book}/{chapter}.md isn't a page")

    def test_openers_are_current(self):
        for book, chapters in op.CHAPTERS.items():
            for chapter in chapters:
                for variant in op.VARIANTS:
                    with self.subTest(book=book, chapter=chapter, variant=variant):
                        p = op.path(book, chapter, variant)
                        self.assertTrue(p.exists(), f"run scripts/covers/build_openers.py ({p.name} missing)")
                        self.assertEqual(p.read_text(encoding="utf-8"), op.svg(book, chapter, variant), f"{p.name} is out of date")

    def test_no_stray_openers(self):
        want = {op.path(b, c, v).relative_to(op.OUT).as_posix() for b, cs in op.CHAPTERS.items() for c in cs for v in op.VARIANTS}
        have = {p.relative_to(op.OUT).as_posix() for p in op.OUT.rglob("*.svg")}
        self.assertEqual(have, want)


if __name__ == "__main__":
    unittest.main()
