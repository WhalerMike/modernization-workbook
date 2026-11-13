"""Tests for scripts/build_ai_exports.py: the llms.txt index, page Markdown and knowledge pack.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build_ai_exports as ex  # noqa: E402

BASE = "https://example.test/fmw/"


class Links(unittest.TestCase):
    def test_relative_page_link_becomes_site_address(self):
        out = ex.absolute_links("See [Chapter 02](02-x.md#gate).", "docs/books/b07-pki/03-y.md", BASE)
        self.assertEqual(out, f"See [Chapter 02]({BASE}docs/books/b07-pki/02-x.html#gate).")

    def test_parent_folders_and_images(self):
        out = ex.absolute_links("![d](../../images/a.svg)", "docs/books/b07-pki/03-y.md", BASE)
        self.assertEqual(out, f"![d]({BASE}docs/images/a.svg)")

    def test_absolute_and_anchor_links_unchanged(self):
        text = "[a](https://learn.microsoft.com/x) [b](#notes) [c](mailto:x@example.test)"
        self.assertEqual(ex.absolute_links(text, "docs/x.md", BASE), text)

    def test_qmd_link(self):
        self.assertEqual(ex.absolute_links("[m](../workbook-map.qmd)", "docs/start-here.md", BASE),
                         f"[m]({BASE}workbook-map.html)")


class Cleaning(unittest.TestCase):
    def test_comments_and_shortcodes_removed(self):
        body = "Text <!-- claims-ok: quoted -->here.\n\n{{< fmw-video b07 >}}\n\nEnd."
        out = ex.clean_body(body, "docs/x.md", BASE)
        self.assertNotIn("claims-ok", out)
        self.assertNotIn("{{<", out)
        self.assertIn("Text here.", out)

    def test_page_heading_comes_first_then_address(self):
        p = ex.Page("docs/x.md", "docs/x.html", "X", "About X.", body="# X\n\nBody.\n")
        out = ex.page_markdown(p, BASE)
        self.assertTrue(out.startswith("# X\n\nSource: " + BASE + "docs/x.html"))
        self.assertEqual(out.count("# X"), 1)
        self.assertIn("> About X.", out)

    def test_title_added_when_page_has_none(self):
        p = ex.Page("docs/x.md", "docs/x.html", "X", "", body="Body.\n")
        self.assertTrue(ex.page_markdown(p, BASE).startswith("# X\n\nSource: "))

    def test_short_cuts_at_a_word(self):
        self.assertEqual(ex.short("one two three", 9), "one two…")
        self.assertEqual(ex.short("short"), "short")


class Areas(unittest.TestCase):
    def test_area_keys(self):
        self.assertEqual(ex.area_of("docs/books/b07-pki/03-y.md")[0], "b07-pki")
        self.assertEqual(ex.area_of("docs/books/guides/x.md")[0], "guides")
        self.assertEqual(ex.area_of("docs/project-plans/developer-workbooks/privileged-access/01.md")[0],
                         "workbook-privileged-access")
        self.assertEqual(ex.area_of("docs/project-plans/developer-workbooks/index.md")[0], "project-plans")
        self.assertEqual(ex.area_of("index.qmd")[0], "start")
        self.assertEqual(ex.area_of("docs/about/license.md")[0], "about")

    def test_area_title_is_top_index(self):
        top = ex.Page("docs/project-plans/index.md", "docs/project-plans/index.html", "Project plans", "")
        sub = ex.Page("docs/project-plans/developer-workbooks/index.md",
                      "docs/project-plans/developer-workbooks/index.html", "Developer Workbooks", "")
        [area] = ex.build_areas([sub, top])
        self.assertEqual(area.title, "Project plans")
        self.assertIs(area.pages[0], top)


class Build(unittest.TestCase):
    """End to end on a stand-in site holding three real pages."""

    PAGES = ["index.qmd", "docs/downloads.md", "docs/books/b07-pki/index.md"]

    def test_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            site = Path(tmp)
            for src in self.PAGES + ["404.qmd"]:
                html = site / (src.rsplit(".", 1)[0] + ".html")
                html.parent.mkdir(parents=True, exist_ok=True)
                html.write_text("<html></html>", encoding="utf-8")
            (site / "site_libs").mkdir()
            (site / "site_libs/x.html").write_text("", encoding="utf-8")
            stats = ex.build(site, site)
            self.assertEqual(stats["pages"], 3)                       # 404 and site_libs skipped
            index = (site / "llms.txt").read_text(encoding="utf-8")
            self.assertTrue(index.startswith("# Federal Modernization Workbook\n\n> "))
            self.assertIn("## Full text", index)
            self.assertIn("docs/books/b07-pki/index.md)", index)
            page = (site / "docs/books/b07-pki/index.md").read_text(encoding="utf-8")
            self.assertIn("Source: ", page)
            self.assertTrue((site / "llms-full/b07-pki.md").is_file())
            with zipfile.ZipFile(site / "downloads" / ex.PACK_NAME) as z:
                names = set(z.namelist())
            self.assertIn("fmw-knowledge-pack/README.txt", names)
            self.assertIn("fmw-knowledge-pack/llms.txt", names)
            self.assertIn("fmw-knowledge-pack/full/b07-pki.txt", names)


if __name__ == "__main__":
    unittest.main()
