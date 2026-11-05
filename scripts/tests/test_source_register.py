"""Tests for scripts/source_watch/register.py, the rules that keep slide links from drifting."""

import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "source_watch"))

import register as R  # noqa: E402
import report  # noqa: E402
import review_gate  # noqa: E402


def row(**kw):
    base = {"id": "m-22-09", "title": "Memo", "publisher": "OMB", "url": "https://example.gov/m.pdf", "status": "active",
            "added": "2026-11-05", "labels": ["M-22-09"], "history": [{"date": "2026-11-05", "change": "Added"}]}
    return {**base, **kw}


def reg(*rows):
    return {"sources": list(rows), "phrases": {}, "site": {}}


class Compare(unittest.TestCase):
    def test_a_row_cannot_be_removed(self):
        self.assertIn("never removed", R.compare(reg(row()), reg())[0])

    def test_a_changed_url_needs_a_history_line(self):
        self.assertIn("no line in its history", R.compare(reg(row()), reg(row(url="https://example.gov/new.pdf")))[0])

    def test_a_changed_url_with_a_history_line_passes(self):
        moved = row(url="https://example.gov/new.pdf",
                    history=row()["history"] + [{"date": "2026-11-09", "change": "Moved"}])
        self.assertEqual(R.compare(reg(row()), reg(moved)), [])

    def test_history_cannot_be_rewritten(self):
        changed = row(history=[{"date": "2026-11-05", "change": "Something else"}])
        self.assertIn("added to", R.compare(reg(row()), reg(changed))[0])

    def test_a_retired_row_stays_retired(self):
        retired = row(status="retired", history=row()["history"] + [{"date": "2026-11-09", "change": "Retired"}])
        back = copy.deepcopy(retired)
        back["status"] = "active"
        back["history"].append({"date": "2026-11-10", "change": "Back"})
        self.assertIn("stays retired", R.compare(reg(retired), reg(back))[0])


class Rows(unittest.TestCase):
    def test_a_url_the_scan_does_not_watch_fails(self):
        self.assertIn("isn't cited", R.check_rows(reg(row()), {})[0])

    def test_a_watched_url_passes(self):
        self.assertEqual(R.check_rows(reg(row()), {row()["url"]: []}), [])

    def test_an_id_with_a_dot_fails(self):
        self.assertTrue(R.check_rows(reg(row(id="a.b")), {row()["url"]: []}))

    def test_the_real_register_keeps_its_rules(self):
        self.assertEqual(R.check_rows(R.load(), R.citations.collect()), [])
        self.assertEqual(R.check_deck_links(R.load()), [])


class Scan(unittest.TestCase):
    def test_digest_reads_the_saved_state(self):
        state = {"sources": {row()["url"]: {"status": "ok", "moved": True, "last_checked": "2026-11-09", "final_url": "x"}}}
        self.assertEqual(R.digest(state, reg(row()), "t")["sources"]["m-22-09"]["status"], "moved")

    def test_a_moved_row_is_proposed_not_changed(self):
        events = [{"url": row()["url"], "type": "moved", "final_url": "https://example.gov/new.pdf"}]
        got = R.proposals(events, reg(row()))
        self.assertIn("https://example.gov/new.pdf", got[0]["fix"])
        text = report.render({"register": got, "counts": {}, "events": [], "week_of": "2026-11-09"})
        self.assertIn("Source Register: rows to decide", text)

    def test_the_page_is_gated_and_the_scan_stays_off_it(self):
        self.assertIn("docs/reference/source-register.md", review_gate.GATED)
        self.assertNotIn("Not read yet\n", R.SCRIPT)
        self.assertIn(R.SCAN_URL, R.render(R.load()))


if __name__ == "__main__":
    unittest.main()
