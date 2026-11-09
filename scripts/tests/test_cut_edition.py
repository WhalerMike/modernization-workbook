"""Tests for scripts/cut_edition.py: the baseline edition's Release title and record entry (dry runs only).

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import contextlib
import datetime as dt
import io
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import cut_edition as ce  # noqa: E402

EID = "edition-2099.01"


def fake_git(*args):
    if args[:2] == ("rev-parse", "origin/main"):
        return "a" * 40
    return ""


class Titles(unittest.TestCase):
    def test_baseline_title_names_the_release_and_the_edition(self):
        self.assertEqual(ce.release_title(EID, "Release 2.0"),
                         "Federal Modernization Workbook, Release 2.0 (baseline edition 2099.01)")

    def test_ordinary_title_is_unchanged(self):
        self.assertEqual(ce.release_title(EID), "Federal Modernization Workbook, edition 2099.01")

    def test_the_tag_is_never_a_version_tag(self):
        self.assertFalse(ce.gr.EDITION_ID.fullmatch("v2.0"))

    def test_entry_has_baseline_and_release_only_for_the_baseline(self):
        plain = ce.entry_text(EID, dt.date(2099, 1, 31), "c", "S", {})
        base = ce.entry_text(EID, dt.date(2099, 1, 31), "c", "S", {}, "Release 2.0")
        self.assertNotIn("baseline", plain)
        self.assertIn('    baseline: true\n    release: "2.0"\n', base)

    def test_notes_say_what_baseline_means(self):
        text = ce.notes(EID, "S", {}, "Release 2.0")
        self.assertIn("Release 2.0 is the baseline edition", text)
        self.assertIn("not an independent peer review", text)
        self.assertNotIn("baseline", ce.notes(EID, "S", {}))


_real_load = ce.gr.load


def load_without_baseline(units):
    # The repository's own data/editions.yml has had a baseline edition since Release 2.0; these dry runs
    # test a cut as if none were marked yet.
    editions, rest = _real_load(units)
    return [{k: v for k, v in ed.items() if k not in ("baseline", "release")} for ed in editions], rest


class DryRun(unittest.TestCase):
    def run_cut(self, *args, load=load_without_baseline):
        out = io.StringIO()
        with mock.patch.object(ce, "git", fake_git), mock.patch.object(ce, "draft_units", lambda *a: {}), \
                mock.patch.object(ce.gr, "load", load), contextlib.redirect_stdout(out):
            code = ce.main([EID, "--summary", "S", "--dry-run", *args])
        return code, out.getvalue()

    def test_a_second_baseline_is_refused(self):
        with self.assertRaises(SystemExit) as cm:
            self.run_cut("--baseline", load=_real_load)
        self.assertIn("already marked baseline", str(cm.exception))

    def test_baseline_dry_run_prints_title_and_the_two_fields(self):
        code, text = self.run_cut("--baseline")
        self.assertEqual(code, 0)
        self.assertIn("Release title: Federal Modernization Workbook, Release 2.0 (baseline edition 2099.01)", text)
        self.assertIn("    baseline: true", text)
        self.assertIn('    release: "2.0"', text)

    def test_ordinary_dry_run_has_neither(self):
        code, text = self.run_cut()
        self.assertEqual(code, 0)
        self.assertNotIn("baseline", text)
        self.assertIn("Release title: Federal Modernization Workbook, edition 2099.01", text)

    def test_release_name_needs_baseline_and_a_release_shape(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                self.run_cut("--release-name", "Release 2.0")
            with self.assertRaises(SystemExit):
                self.run_cut("--baseline", "--release-name", "v2.0")

    def test_a_dry_run_changes_nothing(self):
        record = ce.gr.RECORD.read_bytes()
        self.run_cut("--baseline")
        self.assertEqual(ce.gr.RECORD.read_bytes(), record)


if __name__ == "__main__":
    unittest.main()
