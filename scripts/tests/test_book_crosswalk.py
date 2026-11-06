"""Tests for scripts/book_crosswalk.py: which references it flags, and the book map.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import book_crosswalk as bc  # noqa: E402


class Case(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        for name, title, pages in (
            ("b01-first", "Book 01 — The First Book: Subtitle", {"01-one.md": "Chapter 01 — One", "02-two.md": "Chapter 02 — Two"}),
            ("b02-second", "Book 02 — Network and Transport", {"01-start.md": "Chapter 01 — Start", "appendix-a-table.md": "Appendix A — Table"}),
        ):
            folder = self.root / "docs/books" / name
            folder.mkdir(parents=True)
            (folder / "index.md").write_text(f"# {title}\n", encoding="utf-8")
            for page, heading in pages.items():
                (folder / page).write_text(f"# {heading}\n\n## Where to start\n\nA plain sentence here.\n", encoding="utf-8")
        self.lib = bc.Library(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def kinds(self, text: str, page: str = "docs/books/b01-first/01-one.md", prose: bool = True) -> list[str]:
        return [f.kind for f in bc.check_text(self.lib, page, text, prose)]


class References(Case):
    def test_a_good_reference_passes(self):
        self.assertEqual(self.kinds("See Book 02, Chapter 1 and Book 02 Appendix A."), [])

    def test_a_book_that_does_not_exist(self):
        self.assertEqual(self.kinds("See Book 21."), ["no-book"])

    def test_a_chapter_or_appendix_that_does_not_exist(self):
        self.assertEqual(self.kinds("Book 02, Chapter 9."), ["no-chapter"])
        self.assertEqual(self.kinds("Book 02 Appendix C."), ["no-chapter"])
        self.assertEqual(self.kinds("Chapter 9 of Book 02."), ["no-chapter"])
        self.assertEqual(self.kinds("Book 02 (Chapter 9, Something)."), ["no-chapter"])

    def test_every_chapter_in_a_list_is_checked(self):
        self.assertEqual(self.kinds("Book 01, Chapters 1 and 7."), ["no-chapter"])
        self.assertEqual(self.kinds("Book 01, Chapters 1 to 2."), [])

    def test_a_sample_in_a_code_block_is_not_a_reference(self):
        self.assertEqual(self.kinds("```text\nBook 21\n```\n"), [])

    def test_the_compliance_series_numbers_its_own_books(self):
        self.assertEqual(self.kinds("Vol VII Book 21 and Book 21 of the Federal Compliance series."), [])
        self.assertEqual(self.kinds("[Vol VI Book 07](../b02-second/01-start.md)"), [])


class Links(Case):
    def test_a_link_that_goes_where_its_words_say(self):
        self.assertEqual(self.kinds("[Book 02, Chapter 1](../b02-second/01-start.md)"), [])
        self.assertEqual(self.kinds("Book 02, [Chapter 1](../b02-second/01-start.md)"), [])

    def test_words_and_target_disagree(self):
        self.assertEqual(self.kinds("[Book 01](../b02-second/01-start.md)"), ["link-disagrees"])
        self.assertEqual(self.kinds("[Chapter 02](01-one.md)"), ["link-disagrees"])
        self.assertEqual(self.kinds("Book 01, [Chapter 1](../b02-second/01-start.md)"), ["link-disagrees"])

    def test_another_book_named_earlier_in_the_sentence_is_not_the_links_book(self):
        self.assertEqual(self.kinds("Book 02 owns it, and [Chapter 02](02-two.md) uses it."), [])


class Titles(Case):
    def test_a_quote_matches_the_chapter_a_heading_or_its_text(self):
        self.assertEqual(self.kinds('Book 01, Chapter 2, "Where to start".'), [])
        self.assertEqual(self.kinds('Book 01, Chapter 2: "A plain sentence here."'), [])

    def test_a_quote_the_chapter_does_not_contain(self):
        self.assertEqual(self.kinds('Book 01, Chapter 2, "Something quite unrelated".'), ["wrong-title"])

    def test_bold_after_a_reference_is_not_a_quote(self):
        self.assertEqual(self.kinds("**Book 01, Chapter 2** sets the rule."), [])

    def test_a_bracketed_book_name(self):
        self.assertEqual(self.kinds("Book 02 (Transport)."), [])
        self.assertEqual(self.kinds("Book 02 (Vulnerability Scanning)."), ["wrong-title"])


class Bare(Case):
    def test_a_chapter_this_book_does_not_have(self):
        self.assertEqual(self.kinds("As Chapter 7 shows."), ["bare-chapter"])
        self.assertEqual(self.kinds("As Chapter 2 shows."), [])

    def test_a_footnote_may_cite_another_work_by_chapter(self):
        self.assertEqual(self.kinds("[^a]: A guide, Chapter 32, Corrections."), [])

    def test_deck_source_skips_bare_chapters(self):
        self.assertEqual(self.kinds("Chapter 7", page="presentations/deck/build.js", prose=False), [])


class Map(Case):
    def write(self, name: str, text: str) -> None:
        (self.root / "docs/books" / name).write_text(text, encoding="utf-8")

    def test_links_and_mentions_count_once_each(self):
        self.write("b01-first/02-two.md", "Book 02, Chapter 1. [Book 02](../b02-second/index.md). [Start](../b02-second/01-start.md).\n")
        counts = bc.connections(bc.Library(self.root), self.root)
        self.assertEqual(counts[1][2], 3)  # a mention, a worded link, a plain link
        self.assertEqual(counts[2][1], 0)

    def test_the_table_shows_both_directions(self):
        self.write("b01-first/02-two.md", "Book 02.\n")
        lib = bc.Library(self.root)
        table = bc.render_map(lib, bc.connections(lib, self.root))
        rows = table.split("\n")
        self.assertEqual(rows[2].split("|")[2].strip(), "[B02 Network and Transport](b02-second/index.md)")
        self.assertEqual(rows[3].split("|")[3].strip(), "[B01 The First Book](b01-first/index.md)")

    def test_writing_the_map_keeps_the_rest_of_the_page(self):
        (self.root / "docs/books/index.md").write_bytes(b"Before\r\n<!-- book-crosswalk:start -->\r\nold\r\n<!-- book-crosswalk:end -->\r\nAfter\r\n")
        self.assertTrue(bc.write_map(self.root))
        text = (self.root / "docs/books/index.md").read_bytes()
        self.assertTrue(text.startswith(b"Before\r\n"))
        self.assertTrue(text.endswith(b"After\r\n"))
        self.assertNotIn(b"old", text)
        self.assertIn(b"| Book | Refers most to", text)
        self.assertEqual(text.count(b"\n"), text.count(b"\r\n"))

    def test_a_page_without_markers_is_left_alone(self):
        (self.root / "docs/books/index.md").write_text("Plain\n", encoding="utf-8")
        self.assertFalse(bc.write_map(self.root))


if __name__ == "__main__":
    unittest.main()
