"""Tests for scripts/check_rmf_map.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_rmf_map as m  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]


class Case(unittest.TestCase):
    def test_real_page_passes(self):
        self.assertEqual(m.check(ROOT), [])

    def _page(self, mutate):
        text = (ROOT / m.PAGE).read_text(encoding="utf-8")
        tmp = ROOT / m.PAGE.parent / "_rmf-map-test.md"  # beside the page so links resolve
        tmp.write_text(mutate(text), encoding="utf-8")
        try:
            return m.check(ROOT, tmp)
        finally:
            tmp.unlink()

    def test_missing_task(self):
        errs = self._page(lambda t: t.replace("| M-7 System Disposal", "| X-7 System Disposal"))
        self.assertTrue(any("M-7" in e for e in errs))

    def test_bad_mark(self):
        errs = self._page(lambda t: t.replace("| Covered |\n| P-2", "| Maybe |\n| P-2"))
        self.assertTrue(any("P-1" in e and "Maybe" in e for e in errs))

    def test_stale_review(self):
        errs = self._page(lambda t: t.replace("last-reviewed: 2026-11-06", "last-reviewed: 2026-10-01"))
        self.assertTrue(any("older" in e for e in errs))

    def test_broken_anchor(self):
        errs = self._page(lambda t: t.replace("#what-moderate-means", "#no-such-heading", 1))
        self.assertTrue(any("no-such-heading" in e for e in errs))

    def test_not_covered_missing_from_list(self):
        errs = self._page(lambda t: t.replace("- **P-6, impact-level prioritization**", "- **Impact-level prioritization**"))
        self.assertTrue(any("P-6" in e for e in errs))


if __name__ == "__main__":
    unittest.main()
