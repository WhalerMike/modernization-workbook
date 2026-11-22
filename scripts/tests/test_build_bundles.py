"""Tests for scripts/build_bundles.py: the chapter files (--chapters).

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build_bundles as bb  # noqa: E402


class ChapterBundles(unittest.TestCase):
    def setUp(self):
        self.rules = bb.RenderRules()
        self.bundles = bb.load_bundles(self.rules)
        self.site = Path("/site")
        self.chapters = bb.chapter_bundles(self.bundles, self.site, "Default subtitle")

    def by_page(self, page: str) -> bb.Bundle:
        return next(c for c in self.chapters if c.pages == [bb.REPO / page])

    def test_one_file_per_bundled_page(self):
        pages = {p for b in self.bundles for p in b.pages}
        self.assertEqual(len(self.chapters), len(pages))
        self.assertEqual(len({c.output for c in self.chapters}), len(self.chapters))
        self.assertTrue(all(len(c.pages) == 1 for c in self.chapters))

    def test_written_where_the_page_word_link_points(self):
        c = self.by_page("docs/books/b02-identity/04-the-hidden-migration-surface.md")
        self.assertEqual(c.output, "docs/books/b02-identity/04-the-hidden-migration-surface.docx")
        self.assertEqual(c.path, self.site / "docs/books/b02-identity/04-the-hidden-migration-surface.docx")

    def test_title_page_names_the_chapter_and_its_book(self):
        c = self.by_page("docs/books/b02-identity/04-the-hidden-migration-surface.md")
        self.assertEqual(c.title, "Chapter 04 — The Hidden Migration Surface")
        self.assertEqual(c.subtitle, "From Book 02 — Identity & Directory, Federal Modernization Workbook")
        self.assertFalse(c.aliases)

    def test_page_titled_like_its_bundle_keeps_default_subtitle(self):
        page = bb.REPO / "docs/books/b02-identity/04-the-hidden-migration-surface.md"
        one = bb.Bundle(output="guide.docx", title="Chapter 04 — The Hidden Migration Surface", subtitle="",
                        root=page.parent, pages=[page])
        (c,) = bb.chapter_bundles([one], self.site, "Default subtitle")
        self.assertEqual(c.subtitle, "Default subtitle")

    def test_page_in_two_bundles_is_built_once_from_the_first(self):
        page = bb.REPO / "docs/books/b02-identity/04-the-hidden-migration-surface.md"
        first = bb.Bundle(output="a.docx", title="First", subtitle="", root=page.parent, pages=[page])
        second = bb.Bundle(output="b.docx", title="Second", subtitle="", root=page.parent, pages=[page])
        (c,) = bb.chapter_bundles([first, second], self.site)
        self.assertEqual(c.subtitle, "From First, Federal Modernization Workbook")


if __name__ == "__main__":
    unittest.main()
