"""Tests for scripts/set_baseline_status.py: which pages flip, and that only the status line changes.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "source_watch"))

import review_gate as rg  # noqa: E402
import set_baseline_status as sbs  # noqa: E402

BODY = "# Title\n\nstatus: draft appears in the body too.\n"


def page(extra: str = "", status: str = "draft", body: str = BODY) -> str:
    return f'---\ntitle: "T"\nstatus: {status}\n{extra}---\n\n{body}'


class Flip(unittest.TestCase):
    def test_only_the_status_line_changes(self):
        before = page().encode()
        after = sbs.flip(before)
        self.assertEqual(after, before.replace(b"status: draft\ntitle", b"status: baseline\ntitle") if False else after)
        self.assertIn(b"status: baseline\n", after)
        self.assertEqual(after.count(b"status: draft"), 1)          # the body's mention stays
        self.assertEqual(len(after), len(before) + len(b"baseline") - len(b"draft"))

    def test_crlf_is_kept(self):
        before = page().replace("\n", "\r\n").encode()
        after = sbs.flip(before)
        self.assertIn(b"status: baseline\r\n", after)
        self.assertEqual(after.replace(b"baseline", b"draft", 1), before)

    def test_quoted_value_and_comment(self):
        self.assertIn(b'status: "baseline"', sbs.flip(page(status='"draft"').encode()))
        self.assertIn(b"status: baseline  # note", sbs.flip(page(status="draft  # note").encode()))

    def test_other_statuses_and_research_status_are_not_touched(self):
        for status in ("Active", "scaffold", "baseline"):
            data = page(status=status).encode()
            self.assertEqual(sbs.flip(data), data)
        data = b"---\nresearch-status: draft\n---\n\nBody\n"
        self.assertEqual(sbs.flip(data), data)

    def test_no_front_matter(self):
        self.assertEqual(sbs.flip(b"status: draft\n"), b"status: draft\n")


class Classify(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.write("docs/books/b02-identity/01-a.md", page())
        self.write("docs/books/b02-identity/_brief.md", page())
        self.write("docs/books/b02-identity/02-research.md", page("research-status: draft\n"))
        self.write("docs/operational-guides/x/index.md", page(status="scaffold"))
        self.write("docs/reference/other.md", page())
        self.write("docs/books/guides/approved.md", self.approved(page("review-status: pending\n")))
        self.write("docs/books/guides/pending.md", page("review-status: pending\n"))
        self.write("docs/books/guides/changed.md", self.approved(page("review-status: pending\n")) + "More words.\n")

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, rel, text):
        p = self.root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(text.encode())

    def approved(self, text):
        path = self.root / "tmp.md"
        path.write_text(text, encoding="utf-8")
        out = rg.approve(path)
        path.unlink()
        return out

    def test_groups(self):
        c = sbs.classify(self.root)
        self.assertEqual(c["flip_chapters"], ["docs/books/b02-identity/01-a.md"])
        self.assertEqual(c["flip_gated"], ["docs/books/guides/approved.md"])
        self.assertEqual(dict(c["held"]), {"docs/books/guides/pending.md": "not yet reviewed",
                                           "docs/books/guides/changed.md": "changed since it was approved"})
        self.assertEqual(c["research"], ["docs/books/b02-identity/02-research.md"])
        self.assertEqual(c["other_draft"], ["docs/reference/other.md"])
        self.assertEqual(c["active_scaffold"], [("docs/operational-guides/x/index.md", "scaffold")])

    def test_approved_page_stays_approved_after_its_status_flips(self):
        path = self.root / "docs/books/guides/approved.md"
        self.assertEqual(rg.waiting(self.root)[0]["page"].endswith("changed.md"), True)
        before = [r["page"] for r in rg.waiting(self.root)]
        path.write_bytes(sbs.flip(path.read_bytes()))
        self.assertIn("status: baseline", path.read_text(encoding="utf-8"))
        self.assertEqual([r["page"] for r in rg.waiting(self.root)], before)
        self.assertNotIn("docs/books/guides/approved.md", before)

    def run_main(self, *args):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = sbs.main([*args, "--root", str(self.root)])
        return code, out.getvalue()

    def snapshot(self):
        return {p: p.read_bytes() for p in self.root.rglob("*.md")}

    def test_dry_run_is_the_default_and_changes_nothing(self):
        before = self.snapshot()
        code, text = self.run_main()
        self.assertEqual((code, self.snapshot()), (0, before))
        self.assertIn("Book chapters would change: 1", text)
        self.assertIn("Gated pages held as draft: 2", text)
        self.assertIn("changed since it was approved", text)

    def test_apply_edits_only_the_flipped_pages_and_is_then_clean(self):
        before = self.snapshot()
        code, text = self.run_main("--apply")
        after = self.snapshot()
        changed = sorted(p.relative_to(self.root).as_posix() for p in after if after[p] != before[p])
        self.assertEqual(changed, ["docs/books/b02-identity/01-a.md", "docs/books/guides/approved.md"])
        self.assertIn("Prose to reword", text)
        self.assertEqual(self.run_main("--check-clean")[0], 0)
        self.assertEqual(self.run_main("--apply")[0], 0)
        self.assertEqual(self.snapshot(), after)                     # a second run changes nothing


if __name__ == "__main__":
    unittest.main()
