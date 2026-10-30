"""Tests for scripts/check_neutrality.py: matching, scope and the baseline.

The terms here are invented and hashed with a test salt, so this file names
nothing the real list guards against.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_neutrality as cn  # noqa: E402

SALT = "test-salt"
TERMS = {cn.digest(SALT, "zorbo"), cn.digest(SALT, "office of zorbo affairs"), cn.digest(SALT, "zfa")}
FIRSTS = TERMS | {cn.digest(SALT, "office")}


def found(text: str) -> list[str]:
    return [phrase for _, phrase, _ in cn.hits(text, SALT, 4, TERMS, FIRSTS)]


class Matching(unittest.TestCase):
    def test_case_and_punctuation_dont_matter(self):
        self.assertEqual(found("See ZORBO's portal at zorbo.gov."), ["zorbo", "zorbo"])

    def test_multi_word_term(self):
        self.assertEqual(found("The Office of Zorbo Affairs said"), ["office of zorbo affairs", "zorbo"])

    def test_dotted_acronym_is_one_word(self):
        self.assertEqual(found("The Z.F.A. said, and so did Z.F.A"), ["zfa", "zfa"])
        self.assertEqual(found("e.g. and i.e. are fine"), [])

    def test_not_inside_a_longer_word(self):
        self.assertEqual(found("zorbonaut and unzorbo"), [])

    def test_first_word_alone_is_not_a_hit(self):
        self.assertEqual(found("The office of something else"), [])

    def test_profile_attributes_are_ignored(self):
        self.assertEqual(found(':::: {.content-hidden unless-profile="zorbo"}'), [])
        self.assertEqual(found('{.content-visible when-profile="zorbo"} Zorbo'), ["zorbo"])

    def test_line_numbers_and_hash(self):
        out = cn.hits("ok\n  zorbo here  \n", SALT, 4, TERMS, FIRSTS)
        self.assertEqual(out, [(2, "zorbo", cn.digest(SALT, "zorbo here"))])


class Scope(unittest.TestCase):
    def test_in_scope(self):
        for p in ("docs/books/b02-identity/index.md", "docs/images/x/svg/a.svg", "examples/kit/run.ps1",
                  "data/schemas/evidence-map.schema.json", "README.md", "_quarto.yml"):
            self.assertTrue(cn.in_scope(p), p)

    def test_out_of_scope(self):
        for p in ("archive/b02/x.md", "InBox/notes.md", "presentations/hr-driven-identity-interview/notes.md",
                  "docs/books/b02-identity/_BRIEF.md", "presentations/a/A.pptx", "data/neutrality-terms.txt",
                  "docs/images/a.png", "LICENSE"):
            self.assertFalse(cn.in_scope(p), p)


class TermsFile(unittest.TestCase):
    def test_read_terms(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "terms.txt"
            p.write_text("# comment\nsalt: s1\nmax-words: 3\nABC  # 1 word\nfirst: DEF\n", encoding="utf-8")
            salt, mw, hashes, firsts = cn.read_terms(p)
        self.assertEqual((salt, mw, hashes, firsts), ("s1", 3, {"abc"}, {"abc", "def"}))

    def test_read_baseline(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "baseline.txt"
            p.write_text("# why\ndocs/a.md ABC\n\n", encoding="utf-8")
            self.assertEqual(cn.read_baseline(p), {("docs/a.md", "abc")})

    def test_the_real_list_loads(self):
        salt, mw, hashes, firsts = cn.read_terms()
        self.assertTrue(salt and hashes and hashes <= firsts and mw >= 1)


if __name__ == "__main__":
    unittest.main()
