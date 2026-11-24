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


class UniqueIds(unittest.TestCase):
    def test_a_later_page_repeating_an_explicit_id_gets_a_renamed_copy(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            a, b, c = (Path(d) / n for n in ("a.md", "b.md", "c.md"))
            a.write_text("## Lab {#lab-1}\n\nSee [the lab](#lab-1).\n", encoding="utf-8")
            b.write_text("## Lab {#lab-1 .unnumbered}\n\nSee [the lab](#lab-1) and [x](#lab-10).\n", encoding="utf-8")
            c.write_text("## Other {#other}\n", encoding="utf-8")
            out = bb.unique_ids([a, b, c], "t")
            self.assertEqual(out[0], a)
            self.assertEqual(out[2], c)
            self.assertNotEqual(out[1], b)
            self.assertEqual(out[1].parent, b.parent)   # relative image paths still resolve
            self.assertEqual(out[1].read_text(encoding="utf-8"),
                             "## Lab {#lab-1-2 .unnumbered}\n\nSee [the lab](#lab-1-2) and [x](#lab-10).\n")
            self.assertIn("{#lab-1 .unnumbered}", b.read_text(encoding="utf-8"))


class WordCoverage(unittest.TestCase):
    """Every published page has a built Word file, and its Download (Word) link is current."""

    @classmethod
    def setUpClass(cls):
        cls.rules = bb.RenderRules()
        cls.bundles = bb.load_bundles(cls.rules)

    def test_every_published_page_is_bundled_or_site_only(self):
        self.assertEqual(bb.uncovered_pages(self.rules, self.bundles), [],
                         "add the page to a bundle in scripts/bundles.yml, or to site_only")

    def test_site_only_entries_match_published_pages(self):
        pages = [bb.rel(p) for p in bb.published_pages(self.rules)]
        stale = [rx.pattern for rx in bb.site_only_patterns() if not any(rx.match(p) for p in pages)]
        self.assertEqual(stale, [], "site_only in scripts/bundles.yml names a page the site no longer publishes")

    def test_word_index_is_current(self):
        current = bb.WORD_INDEX.read_text(encoding="utf-8") if bb.WORD_INDEX.exists() else ""
        self.assertEqual(current, bb.word_index(self.bundles), "run: python scripts/build_bundles.py --word-index")

    def test_word_index_links_the_chapter_file_and_its_edition(self):
        import json
        index = json.loads(bb.word_index(self.bundles))
        self.assertEqual(index["docs/training/non-person-identity/index.md"],
                         {"page": "index.docx", "bundle": "training-non-person-identity-bundle.docx",
                          "title": "Learning path: Non-Person Identity in Microsoft Entra ID"})
        # A one-page edition is the chapter file, so only the page link shows.
        self.assertEqual(index["docs/books/guides/service-account-migration.md"],
                         {"page": "service-account-migration.docx"})
        self.assertNotIn("docs/downloads.md", index)


if __name__ == "__main__":
    unittest.main()
