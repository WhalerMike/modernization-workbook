"""Tests for scripts/generate_revisions.py: versions, the sections, and where they go.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import datetime as dt
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_revisions as gr  # noqa: E402


def edition(eid, date, units=None):
    return {"id": eid, "date": dt.date.fromisoformat(date), "summary": "S.", "units": units or {}}


EDITIONS = [
    edition("edition-2026.10", "2026-10-31", {"b02-identity": {"changes": ["First edition"]}}),
    edition("edition-2026.11", "2026-11-30", {"b07-pki": {"changes": ["First edition"]}}),
    edition("edition-2026.12", "2026-12-31", {"b02-identity": {"changes": ["Chapter 07 rewritten (#300)"]}}),
    edition("edition-2027.01", "2027-01-31", {"b02-identity": {"changes": ["Restructured"], "version": "2.0"}}),
]
UNIT = gr.Unit("b02-identity", "book", gr.ROOT / "docs/books/b02-identity/index.md", ["docs/books/b02-identity"])


class Versions(unittest.TestCase):
    def test_first_edition_is_1_0_then_minor_steps_and_a_major_reset(self):
        got = [(v, ed["id"]) for v, ed, _ in gr.versions(EDITIONS, "b02-identity")]
        self.assertEqual(got, [("1.0", "edition-2026.10"), ("1.1", "edition-2026.12"), ("2.0", "edition-2027.01")])

    def test_unit_in_no_edition_has_no_versions(self):
        self.assertEqual(gr.versions(EDITIONS, "b05-devices"), [])

    def test_edition_ids(self):
        for ok in ("edition-2026.10", "edition-2026.01.2"):
            self.assertTrue(gr.EDITION_ID.fullmatch(ok), ok)
        for bad in ("edition-2026.13", "edition-2026.1", "edition-2026.10.0", "v2026.10"):
            self.assertFalse(gr.EDITION_ID.fullmatch(bad), bad)
        self.assertEqual(gr.anchor("edition-2026.10.1"), "edition-2026-10-1")


class Sections(unittest.TestCase):
    def test_history_table_newest_first_with_pr_links(self):
        text = gr.revisions_section(UNIT, EDITIONS)
        self.assertIn("**Version 2.0**, in [edition 2027.01](../../about/archive.md#edition-2027-01)", text)
        rows = [line for line in text.splitlines() if line.startswith("| ") and line[2].isdigit()]
        self.assertEqual([r.split(" | ")[0] for r in rows], ["| 2.0", "| 1.1", "| 1.0"])
        self.assertIn("([#300](https://github.com/WhalerMike/modernization-workbook/pull/300))", text)

    def test_long_change_lists_are_cut_with_a_compare_link(self):
        many = [f"Change {i}" for i in range(12)]
        eds = EDITIONS[:1] + [edition("edition-2026.11", "2026-11-30", {"b02-identity": {"changes": many}})]
        text = gr.revisions_section(UNIT, eds)
        self.assertIn("and 4 more ([all changes](https://github.com/WhalerMike/modernization-workbook/compare/"
                      "edition-2026.10...edition-2026.11))", text)

    def test_no_edition_yet(self):
        self.assertIn("has not been published in an edition yet", gr.revisions_section(UNIT, []))


class Place(unittest.TestCase):
    SECTION = "<!-- revisions:start x -->\nNEW\n<!-- revisions:end -->\n"

    def test_goes_before_trailing_footnotes(self):
        text = "# T\n\nBody.[^a]\n\n[^a]: A note.\n    continued.\n[^b]: B.\n"
        self.assertEqual(gr.place(text, self.SECTION),
                         "# T\n\nBody.[^a]\n\n" + self.SECTION + "\n[^a]: A note.\n    continued.\n[^b]: B.\n")

    def test_appended_without_footnotes_and_replaced_after(self):
        once = gr.place("# T\n\nBody.\n", self.SECTION)
        self.assertEqual(once, "# T\n\nBody.\n\n" + self.SECTION)
        again = gr.place(once, self.SECTION.replace("NEW", "NEWER"))
        self.assertEqual(again, "# T\n\nBody.\n\n" + self.SECTION.replace("NEW", "NEWER"))


if __name__ == "__main__":
    unittest.main()
