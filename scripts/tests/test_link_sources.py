"""Tests for presentations/_build/link_sources.py and scripts/youtube_description.py."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "presentations" / "_build"), str(ROOT / "scripts")]

import link_sources as L  # noqa: E402
import youtube_description as Y  # noqa: E402


class Resolve(unittest.TestCase):
    pages = L.Pages()
    labels = L.load_labels()

    def links(self, text, book=None):
        return [(text[a:b], u.split("/")[-1]) for a, b, u in L.resolve(text, book, self.pages, self.labels)]

    def test_each_chapter_links_on_its_own(self):
        got = self.links("Book 00, Chapters 03 and 07; Book 01, Ch 02 and 12.")
        self.assertEqual([t for t, _ in got], ["Book 00, Chapters 03", "07", "Book 01, Ch 02", "12"])
        self.assertEqual(got[1][1], "07-who-runs-the-program.html")

    def test_bare_chapter_takes_the_book_before_it(self):
        got = self.links("Book 01, Chapter 06; Chapter 12 (x).")
        self.assertEqual(got[1], ("Chapter 12", "12-migration-roadmap.html"))

    def test_deck_book_for_a_short_table_cell(self):
        got = self.links("Ch. 01, 07; App. A", "00")
        self.assertEqual([t for t, _ in got], ["Ch. 01", "07", "App. A"])

    def test_a_tour_deck_means_its_own_workbook(self):
        self.assertEqual(L.deck_book(Path("presentations/dw-pa-08-evidence-drift/x.pptx")), "pa")
        self.assertEqual(L.deck_book(Path("presentations/dw-adm-09-drift-pipelines-evidence/x.pptx")), "19")
        got = self.links("Sources: Chapter 08.", "pa")
        self.assertEqual(got, [("Chapter 08", "08-evidence-and-drift.html")])

    def test_section_name_links_to_its_heading(self):
        got = self.links("Book 00, Chapter 03 (Success criteria).")
        self.assertEqual(got[1], ("Success criteria", "03-the-charter.html#success-criteria"))

    def test_a_source_links_to_its_register_row(self):
        got = self.links("OMB M-22-09, M-26-14")
        self.assertEqual(got, [("OMB M-22-09", "source-register.html#m-22-09"),
                               ("M-26-14", "source-register.html#m-26-14")])


class Description(unittest.TestCase):
    def test_refuses_chapters_youtube_would_ignore(self):
        with self.assertRaises(SystemExit):
            Y.check_chapters("x", [[0, "a"], [5, "b"], [30, "c"]])
        with self.assertRaises(SystemExit):
            Y.check_chapters("x", [[3, "a"], [20, "b"], [30, "c"]])

    def test_a_bare_number_takes_the_row_name(self):
        url = f"{Y.SITE}{Y.REGISTER}#bod-26-02"
        _, others = Y.link_lists([{"links": [{"text": "26-02", "url": url}]}])
        self.assertEqual(others, [f"CISA BOD 26-02: {url}"])

    def test_stays_under_the_limit(self):
        chapters = [[i * 20, f"Slide {i}"] for i in range(20)]
        links = [{"text": f"Source {i}", "url": f"{Y.SITE}{Y.REGISTER}#{'x' * 80}{i}"} for i in range(200)]
        text, left = Y.build("x", "Title", chapters, [{"slide": 1, "title": "t", "links": links}])
        self.assertLessEqual(len(text), Y.LIMIT)
        self.assertGreater(left, 0)
        self.assertIn("0:00 Slide 0", text)


if __name__ == "__main__":
    unittest.main()
