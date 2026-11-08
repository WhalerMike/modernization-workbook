"""Tests for scripts/generate_workbook_map.py: what the Workbook Map says about each object.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_workbook_map as wm  # noqa: E402


def git(root: Path, *args: str, date: str = "2026-01-01T12:00:00") -> None:
    env = {"GIT_COMMITTER_DATE": date, "GIT_AUTHOR_DATE": date, "PATH": __import__("os").environ["PATH"],
           "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example.com",
           "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@example.com"}
    subprocess.run(["git", *args], cwd=root, check=True, capture_output=True, env=env)


class LastChanges(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        git(self.root, "init", "-q")
        (self.root / "presentations/deck").mkdir(parents=True)

    def tearDown(self):
        self.tmp.cleanup()

    def commit(self, name: str, subject: str, date: str) -> None:
        path = self.root / name
        path.write_text(subject + date, encoding="utf-8")
        git(self.root, "add", "-A")
        git(self.root, "commit", "-q", "-m", subject, date=date + "T12:00:00")

    def test_bookkeeping_commits_dont_count_as_a_change(self):
        self.commit("page.md", "Write the page (#1)", "2026-01-02")
        self.commit("page.md", "Edition 2026.11.4: record the edition and point deck links at it (#2)", "2026-01-03")
        self.commit("page.md", "Review gate: approve it (#3)", "2026-01-04")
        self.assertEqual(wm.last_changes(self.root)["page.md"], "2026-01-02")

    def test_a_page_only_an_edition_touched_keeps_that_date(self):
        self.commit("page.md", "Edition 2026.11.2: publish a new page (#1)", "2026-01-03")
        self.assertEqual(wm.last_changes(self.root)["page.md"], "2026-01-03")

    def test_a_deck_folder_dates_from_its_newest_file(self):
        self.commit("presentations/deck/build.js", "Build (#1)", "2026-01-02")
        self.commit("presentations/deck/narration.json", "Narration (#2)", "2026-01-05")
        self.assertEqual(wm.last_changes(self.root)["presentations/deck"], "2026-01-05")


class Verified(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.book = self.root / "docs/books/b01"
        (self.book / "_verification").mkdir(parents=True)
        for name in ("01-a.md", "02-b.md", "03-c.md", "04-d.md"):
            (self.book / name).write_text("# Page\n", encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def log(self, name: str, text: str) -> str:
        (self.book / "_verification" / name).write_text(text, encoding="utf-8")
        return f"docs/books/b01/_verification/{name}"

    def test_a_log_dates_its_chapter_from_its_verified_line_or_its_last_commit(self):
        self.log("01-a.md", "# Log\n\nVerified: 2026-10-20\n")
        committed = self.log("02-b.md", "# Log\n")
        dates = wm.verified_dates({committed: "2026-10-25"}, self.root)
        self.assertEqual(dates["docs/books/b01/01-a.md"], "2026-10-20")
        self.assertEqual(dates["docs/books/b01/02-b.md"], "2026-10-25")

    def test_a_combined_log_covers_both_chapters(self):
        self.log("03-04-c.md", "# Log\n\nVerified: 2026-10-20\n")
        dates = wm.verified_dates({}, self.root)
        self.assertEqual(dates["docs/books/b01/03-c.md"], "2026-10-20")
        self.assertEqual(dates["docs/books/b01/04-d.md"], "2026-10-20")

    def test_a_chapter_with_no_log_has_no_date(self):
        self.assertEqual(wm.verified_dates({}, self.root), {})


class Text(unittest.TestCase):
    def test_a_description_becomes_one_safe_table_cell(self):
        cell = wm.purpose_of('---\ndescription: "Reads [the log](a.md) | writes `out`. Then more."\n---\n')
        self.assertEqual(cell, "Reads the log / writes out.")

    def test_without_a_description_the_first_sentence_is_used(self):
        self.assertEqual(wm.purpose_of("---\ntitle: T\n---\n\n# T\n\nFirst one. Second one.\n"), "First one.")

    def test_a_long_sentence_is_cut_at_a_word(self):
        cell = wm.shorten("word " * 60)
        self.assertLessEqual(len(cell), 151)
        self.assertTrue(cell.endswith("word…"))

    def test_the_baseline_comes_from_the_marked_edition(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "data").mkdir()
            record = root / "data/editions.yml"
            record.write_text("editions:\n  - id: edition-2026.10\n    date: 2026-10-31\n", encoding="utf-8")
            self.assertEqual(wm.baseline(root), "")
            record.write_text("editions:\n  - id: edition-2026.12\n    date: 2026-12-01\n    baseline: true\n", encoding="utf-8")
            self.assertEqual(wm.baseline(root), "2026-12-01")

    def test_the_baseline_release_name_comes_from_the_marked_edition(self):
        head = "editions:" + chr(10) + "  - id: edition-2026.12" + chr(10) + "    date: 2026-12-01" + chr(10)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "data").mkdir()
            record = root / "data/editions.yml"
            record.write_text(head + "    baseline: true" + chr(10), encoding="utf-8")
            self.assertEqual(wm.baseline_release(root), "")
            record.write_text(head + "    baseline: true" + chr(10) + '    release: "2.0"' + chr(10), encoding="utf-8")
            self.assertEqual(wm.baseline_release(root), "Release 2.0")


if __name__ == "__main__":
    unittest.main()
