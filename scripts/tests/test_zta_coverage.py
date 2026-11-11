"""Tests for scripts/zta_coverage.py: the Zero Trust closure coverage tracker and its page.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_changed as cc  # noqa: E402
import zta_coverage as zc  # noqa: E402


def item(**kw):
    base = {"id": "B04-01", "title": "x", "wave": 1, "book": "B04", "status": "planned", "where": [], "pr": None,
            "note": ""}
    base.update(kw)
    return base


class TheData(unittest.TestCase):
    def setUp(self):
        self.items = zc.load()

    def test_the_tracker_is_valid_and_the_page_current(self):
        self.assertEqual(zc.problems(self.items), [])
        self.assertEqual(zc.main(["--check"]), 0)

    def test_every_instruction_id_is_tracked_once(self):
        ids = [it["id"] for it in self.items]
        self.assertEqual(len(ids), len(set(ids)))
        prefixes = Counter(i.split("-")[0] for i in ids)
        self.assertEqual(prefixes["G"], 8)
        self.assertEqual(prefixes["B20"], 12)
        self.assertEqual((prefixes["GSA"], prefixes["XDR"], prefixes["AZS"]), (12, 10, 10))
        self.assertEqual(prefixes["CM"], 15)
        self.assertIn("ZTA-GUIDE", ids)
        for gone in ("B19", "B21", "B22"):
            self.assertNotIn(gone, prefixes)

    def test_decisions_already_made(self):
        by_id = {it["id"]: it for it in self.items}
        self.assertEqual(by_id["B05-03"]["status"], "not-applicable")
        for i in ("B11-01", "B11-02", "B11-03"):
            self.assertEqual(by_id[i]["status"], "implemented", i)
        for it in self.items:
            if it["id"].startswith(("GSA", "XDR", "AZS")):
                self.assertEqual(it["book"], "guide", it["id"])
                self.assertIn("guide, not a book", it["note"], it["id"])


class TheRules(unittest.TestCase):
    def test_bad_entries_are_reported(self):
        self.assertTrue(zc.problems([item(status="done")]))
        self.assertTrue(zc.problems([item(wave=5)]))
        self.assertTrue(zc.problems([item(id="B04-1")]))
        self.assertTrue(zc.problems([item(), item()]))
        self.assertTrue(zc.problems([item(status="implemented")]))                  # needs where
        self.assertTrue(zc.problems([item(status="not-applicable")]))               # needs a reason
        self.assertTrue(zc.problems([item(status="partial", where=["docs/nope.md"])]))
        bad = item()
        del bad["pr"]
        self.assertTrue(zc.problems([bad]))
        self.assertEqual(zc.problems([item(status="not-applicable", note="out of scope")]), [])

    def test_links_from_the_reference_folder(self):
        self.assertEqual(zc.link("docs/books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain"),
                         "[10-evidence-not-verdicts.md#the-closure-chain]"
                         "(../books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)")
        self.assertTrue(zc.link("scripts/check_identifiers.py").endswith(
            "(https://github.com/WhalerMike/modernization-workbook/blob/main/scripts/check_identifiers.py)"))

    def test_render_keeps_the_markers_and_counts(self):
        body = zc.render([item(), item(id="G-01", status="partial", where=["CONTRIBUTING.md"])])
        self.assertTrue(body.startswith(zc.START) and body.endswith(zc.END))
        self.assertIn("2 instruction IDs: Implemented 0; Partial 1; Planned 1", body)

    def test_pull_request_checks_run_it(self):
        t = cc.non_site_tasks([cc.Change("M", "data/zta-closure/coverage.yml")])
        self.assertIn("zta-coverage", t)
        self.assertIn("unit-tests", cc.non_site_tasks([cc.Change("M", "scripts/zta_coverage.py")]))


if __name__ == "__main__":
    unittest.main()
