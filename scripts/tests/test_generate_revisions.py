"""Tests for scripts/generate_revisions.py: versions, the sections, and where they go.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import datetime as dt
import subprocess
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


class Baseline(unittest.TestCase):
    """The edition marked `baseline: true` sets every item to 2.0; later edits step from there."""
    BASE = dict(EDITIONS[0])
    EDS = [
        edition("edition-2026.10", "2026-10-31", {"b02-identity": {"changes": ["First edition"]},
                                                  "b04-access": {"changes": ["First edition"]}}),
        edition("edition-2026.11", "2026-11-30", {"b04-access": {"changes": ["Rewritten (#1)"]}}),
    ]
    BASELINE = {**edition("edition-2026.12", "2026-12-31", {"b04-access": {"changes": ["Last fix (#2)"]}}),
                "baseline": True, "release": "2.0"}
    AFTER = edition("edition-2027.01", "2027-01-31", {"b02-identity": {"changes": ["Later (#3)"]}})

    def versions(self, uid, eds=None):
        return [(v, ed["id"]) for v, ed, _ in gr.versions(eds or self.EDS + [self.BASELINE, self.AFTER], uid)]

    def test_an_item_the_baseline_edition_did_not_touch_still_gets_2_0(self):
        self.assertEqual(self.versions("b05-devices")[0], ("2.0", "edition-2026.12"))
        self.assertEqual(self.versions("guides/some-guide"), [("2.0", "edition-2026.12")])

    def test_an_item_touched_afterwards_gets_2_1(self):
        self.assertEqual(self.versions("b02-identity"),
                         [("1.0", "edition-2026.10"), ("2.0", "edition-2026.12"), ("2.1", "edition-2027.01")])

    def test_1_x_rows_are_unchanged(self):
        with_base = gr.versions(self.EDS + [self.BASELINE], "b04-access")
        plain = gr.versions(self.EDS, "b04-access")
        self.assertEqual([(v, ed["id"], e) for v, ed, e in with_base[:2]], [(v, ed["id"], e) for v, ed, e in plain])
        self.assertEqual([v for v, _, _ in with_base], ["1.0", "1.1", "2.0"])

    def test_2_0_row_says_release_2_0_the_baseline_and_keeps_merged_changes(self):
        unit = gr.Unit("b04-access", "book", gr.ROOT / "docs/books/b04-access/index.md", ["docs/books/b04-access"])
        text = gr.revisions_section(unit, self.EDS + [self.BASELINE])
        row = [line for line in text.splitlines() if line.startswith("| 2.0 |")][0]
        self.assertIn("Release 2.0, the baseline: checked against every other book; Draft becomes Baseline", row)
        self.assertIn("Last fix", row)
        self.assertIn("**Version 2.0**", text)
        self.assertEqual(len([line for line in text.splitlines() if line.startswith("| 1.")]), 2)

    def test_without_a_release_name_the_row_still_says_baseline(self):
        plain = {k: v for k, v in self.BASELINE.items() if k != "release"}
        v = gr.versions(self.EDS + [plain], "b05-devices")
        self.assertEqual(v[0][2]["changes"], [gr.BASELINE_CHANGE])

    def test_nothing_changes_while_no_edition_is_marked_baseline(self):
        for uid in ("b02-identity", "b04-access", "b05-devices"):
            plain = [(v, ed["id"]) for v, ed, _ in gr.versions(self.EDS + [self.AFTER], uid)]
            flagged = [(v, ed["id"]) for v, ed, _ in gr.versions(
                [dict(e, baseline=False) for e in self.EDS + [self.AFTER]], uid)]
            self.assertEqual(plain, flagged)
            self.assertNotIn("2.0", [v for v, _ in plain])
        self.assertEqual(gr.versions(self.EDS, "b05-devices"), [])

    def test_archive_names_the_release(self):
        text = gr.archive_section(self.EDS + [self.BASELINE], [], {})
        self.assertIn("(Release 2.0, the baseline)", text)
        self.assertIn("### Edition 2026.12 (Release 2.0, the baseline)", text)
        self.assertNotIn("the baseline", gr.archive_section(self.EDS, [], {}))


class BaselineMembers(unittest.TestCase):
    """Only what existed at the baseline's tagged commit gets the 2.0 row."""
    EDS = Baseline.EDS
    BASELINE = Baseline.BASELINE
    AFTER = Baseline.AFTER
    # b02 and b04 were in the baseline; guides/new-guide was created after it.
    MEMBERS = {"edition-2026.12": {"b02-identity", "b04-access"}}

    def versions(self, uid, eds=None):
        return [(v, ed["id"]) for v, ed, _ in gr.versions(eds or self.EDS + [self.BASELINE, self.AFTER], uid,
                                                           self.MEMBERS)]

    def test_unit_that_existed_at_the_baseline_keeps_its_2_0_row(self):
        self.assertEqual(self.versions("b02-identity"),
                         [("1.0", "edition-2026.10"), ("2.0", "edition-2026.12"), ("2.1", "edition-2027.01")])
        self.assertEqual(self.versions("b04-access")[-1], ("2.0", "edition-2026.12"))

    def test_unit_created_after_the_baseline_has_no_row_yet(self):
        self.assertEqual(self.versions("guides/new-guide"), [])
        unit = gr.Unit("guides/new-guide", "guide", gr.ROOT / "docs/books/guides/new-guide.md",
                       ["docs/books/guides/new-guide.md"])
        text = gr.revisions_section(unit, self.EDS + [self.BASELINE, self.AFTER], self.MEMBERS)
        self.assertIn("has not been published in an edition yet", text)
        self.assertNotIn("Version 2.0", text)
        self.assertNotIn("Draft becomes Baseline", text)

    def test_unit_created_after_the_baseline_starts_at_1_0_in_its_first_edition(self):
        later = edition("edition-2027.02", "2027-02-28", {"guides/new-guide": {"changes": ["New guide (#4)"]}})
        self.assertEqual(self.versions("guides/new-guide", self.EDS + [self.BASELINE, self.AFTER, later]),
                         [("1.0", "edition-2027.02")])

    def test_unit_the_baseline_edition_names_counts_even_if_not_found(self):
        self.assertEqual(self.versions("b04-access", self.EDS + [self.BASELINE]), self.versions("b04-access"))
        named = {**self.BASELINE, "units": {"guides/new-guide": {"changes": ["Added (#5)"]}}}
        self.assertEqual(self.versions("guides/new-guide", [named]), [("2.0", "edition-2026.12")])


class MembersAtCommit(unittest.TestCase):
    """members_at reads the tree of a real commit: a page added later to an existing unit
    doesn't matter (the unit's index or folder was there); a unit whose page wasn't there is out."""

    def setUp(self):
        try:
            self.head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=gr.ROOT, capture_output=True,
                                       text=True, check=True).stdout.strip()
        except (OSError, subprocess.CalledProcessError):
            self.skipTest("no git checkout")

    def test_existing_unit_is_in_and_a_unit_not_in_the_tree_is_out(self):
        found = {
            "b15-day2-operations": gr.Unit("b15-day2-operations", "book",
                                           gr.ROOT / "docs/books/b15-day2-operations/index.md",
                                           ["docs/books/b15-day2-operations"]),
            "guides/not-in-the-tree": gr.Unit("guides/not-in-the-tree", "guide",
                                              gr.ROOT / "docs/books/guides/not-in-the-tree.md",
                                              ["docs/books/guides/not-in-the-tree.md"]),
        }
        self.assertEqual(gr.members_at(self.head, found), {"b15-day2-operations"})

    def test_page_added_to_an_existing_unit_after_the_baseline_keeps_the_2_0_row(self):
        """Book 15 Chapter 14 was added after Release 2.0; Book 15 was in it, so it keeps 2.0."""
        base = "5396f2ca6dee6a634855ae3430b568473bbd203a"   # edition-2026.11.5, Release 2.0
        ch14 = "docs/books/b15-day2-operations/14-provider-notices.md"
        if subprocess.run(["git", "cat-file", "-e", base], cwd=gr.ROOT, capture_output=True).returncode:
            self.skipTest("Release 2.0's commit isn't in this clone")
        if subprocess.run(["git", "cat-file", "-e", f"{base}:{ch14}"], cwd=gr.ROOT, capture_output=True).returncode == 0:
            self.skipTest("expected the chapter to postdate the baseline")
        found = gr.units()
        members = gr.members_at(base, found)
        self.assertIn("b15-day2-operations", members)
        self.assertNotIn("guides/service-account-migration", members)
        editions, _ = gr.load(found)
        b15 = gr.versions(editions, "b15-day2-operations", gr.baseline_members(editions, found))
        self.assertIn("2.0", [v for v, _, _ in b15])
        self.assertNotIn("2.0", [v for v, _, _ in gr.versions(
            editions, "guides/service-account-migration", gr.baseline_members(editions, found))])

    def test_unreadable_commit_is_a_record_error(self):
        with self.assertRaises(gr.RecordError):
            gr.members_at("0" * 40, {})


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
