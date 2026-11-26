"""Tests for the New Look build: scripts/newlook/render.py, postrender.py,
build_context.py and verify_learn.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "newlook"))

import build_context as bctx  # noqa: E402
import postrender  # noqa: E402
import render  # noqa: E402
import verify_learn  # noqa: E402

REPO = Path(__file__).resolve().parents[2]


class Compose(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.base = yaml.safe_load((REPO / "_quarto.yml").read_text(encoding="utf-8"))
        cls.cfg = render.compose(REPO)

    def test_current_site_config_is_untouched(self) -> None:
        again = yaml.safe_load((REPO / "_quarto.yml").read_text(encoding="utf-8"))
        self.assertEqual(again, self.base)
        self.assertNotIn("newlook", (REPO / "_quarto.yml").read_text(encoding="utf-8").lower())

    def test_navbar_is_replaced_not_appended(self) -> None:
        left = self.cfg["website"]["navbar"]["left"]
        texts = [i.get("text") for i in left]
        self.assertEqual(texts[:4], ["Home", "Topics", "Browse", "Plans"])
        self.assertEqual(len(texts), len(set(texts)))
        self.assertNotIn("Projects", texts)

    def test_topics_menu_is_the_current_sites(self) -> None:
        current = next(i["menu"] for i in self.base["website"]["navbar"]["left"] if i.get("text") == "Topics")
        menus = {i["text"]: i.get("menu", []) for i in self.cfg["website"]["navbar"]["left"]}
        self.assertEqual(menus["Topics"], current)

    def test_new_paths_and_workbooks_appear_by_folder(self) -> None:
        menus = {i["text"]: i.get("menu", []) for i in self.cfg["website"]["navbar"]["left"]}
        paths = {m.get("href") for m in menus["Learning paths"]}
        for index in REPO.glob("docs/training/*/index.md"):
            if not index.parent.name.startswith("_"):
                self.assertIn(index.relative_to(REPO).as_posix(), paths)
        workbooks = {m.get("href") for m in menus["Workbooks"]}
        for index in REPO.glob("docs/project-plans/developer-workbooks/*/index.md"):
            self.assertIn(index.relative_to(REPO).as_posix(), workbooks)

    def test_lists_are_extended(self) -> None:
        proj = self.cfg["project"]
        self.assertEqual(proj["output-dir"], "_site-newlook")
        self.assertNotIn("index.qmd", proj["render"])
        self.assertIn("docs/new-look/**/*.md", proj["render"])
        for script in self.base["project"]["pre-render"]:
            self.assertIn(script, proj["pre-render"])
        self.assertIn("scripts/newlook/build_context.py", proj["pre-render"])
        html = self.cfg["format"]["html"]
        self.assertEqual(html["filters"][-1], "newlook/newlook.lua")
        self.assertEqual(list(self.cfg["format"]), ["html"])
        self.assertEqual(len(self.cfg["website"]["sidebar"]), len(self.base["website"]["sidebar"]))

    def test_books_get_their_word_edition(self) -> None:
        text = yaml.safe_dump(self.cfg["website"]["sidebar"])
        self.assertIn("downloads/b02-identity-bundle.docx", text)


class PostRender(unittest.TestCase):
    def test_missing_files_point_to_the_current_site(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            (out / "docs/books").mkdir(parents=True)
            (out / "docs/books/x.png").write_text("png")
            page = ('<a href="../../downloads/kit.zip">zip</a> <img src="x.png"> '
                    '<a href="other.html">page</a> <a href="https://example.org/a">ext</a> <a href="#top">top</a>')
            new, n = postrender.fix_links(page, "docs/books/a.html", out)
        self.assertEqual(n, 1)
        self.assertIn('href="https://whalermike.github.io/modernization-workbook/downloads/kit.zip"', new)
        self.assertIn('src="x.png"', new)
        self.assertIn('href="other.html"', new)


class Context(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.site = bctx.Site(REPO)

    def test_helpers(self) -> None:
        self.assertEqual(bctx.auto_id("GCC availability, by feature"), "gcc-availability-by-feature")
        self.assertEqual(bctx.href("docs/books/b02-identity/01-a.md", "docs/training/labs.md#hr"), "../../training/labs.html#hr")
        self.assertEqual(bctx.href("docs/x/a.md", "docs/x/b.md", ext=".md"), "b.md")
        self.assertEqual(bctx.duration(125), "2 hr 5 min")

    def test_generated_pages_are_current(self) -> None:
        for path, text in bctx.generated(self.site).items():
            self.assertEqual((REPO / path).read_text(encoding="utf-8"), text,
                             f"{path} is out of date: run python scripts/newlook/build_context.py")

    def test_every_plan_item_is_in_the_catalog(self) -> None:
        for plan in self.site.data["reading-plans"]["plans"]:
            for ms in plan["milestones"]:
                for ident in ms["items"]:
                    self.assertIn(ident, self.site.items, f"reading plan {plan['slug']}: {ident} isn't in the catalog")

    def test_labels_are_from_the_short_list(self) -> None:
        cfg = self.site.data["doc-types"]
        allowed = {label for _, label in cfg["rules"]} | set(cfg["doc-types"].values()) | {cfg["fallback"]}
        scoped = {label for labels in cfg["scopes"].values() for label in labels}
        self.assertLessEqual(allowed, scoped, "every label needs a search scope")
        for p in self.site.pages:
            self.assertIn(self.site.label(p), allowed)

    def test_applies_to_never_names_other_clouds(self) -> None:
        text = (REPO / "data/newlook/applies-to.yml").read_text(encoding="utf-8")
        values = yaml.safe_load(text)
        for v in [values["default"], *values["prefixes"].values()]:
            for banned in ("GCC " + "High", "D" + "oD", "Azure " + "Government"):
                self.assertNotIn(banned, v)

    def test_page_context(self) -> None:
        s = self.site
        guide = s.context("docs/books/guides/defender-xdr-implementation.md")
        self.assertEqual(guide["label"], "Implementation guide")
        self.assertEqual(guide["gcc_anchor"], "government-cloud-availability")
        self.assertEqual(len(guide["tabs"]), 1)
        self.assertIn("nl-hub", guide["top"])
        module = s.context("docs/training/hr-driven-identity/03-joiners-and-the-temporary-access-pass.md")
        self.assertIn("Module 3 of 7", module["top"])
        self.assertIn("Related", module["bottom"])
        self.assertIn("watch.html?v=", module["bottom"])
        path = s.context("docs/training/hr-driven-identity/index.md")
        self.assertIn("At a glance", path["top"])
        self.assertIn('data-pagefind-filter="scope">Training', path["top"])
        dp = s.context("docs/books/guides/dp-consolidation.md")
        self.assertIsNone(dp["gcc_anchor"])  # it already has #gcc-availability

    def test_tabs_match_one_code_block(self) -> None:
        for spec in self.site.data["tabs"]["tabs"]:
            body = (REPO / spec["page"]).read_text(encoding="utf-8")
            blocks = [b for b in body.split("```")[1::2] if spec["match"] in b]
            self.assertEqual(len(blocks), 1, f"{spec['page']}: {spec['match']!r} must be in exactly one code block")


class LearnCards(unittest.TestCase):
    def test_entries_match_a_catalog(self) -> None:
        cfg = yaml.safe_load((REPO / verify_learn.DATA.relative_to(REPO)).read_text(encoding="utf-8"))
        entries = verify_learn.entries(cfg)
        self.assertTrue(entries)
        for e in entries:
            self.assertTrue(e["url"].startswith("https://learn.microsoft.com/"), e)
            self.assertNotIn("/en-us/", e["url"])
        fake = {"modules": [{"uid": e["uid"], "url": e["url"].replace(".com/", ".com/en-us/") + "?x=1",
                             "title": e["title"]} for e in entries]}
        self.assertEqual(verify_learn.check(cfg, fake), [])
        first = entries[0]["uid"]
        fake["modules"] = [x for x in fake["modules"] if x["uid"] != first]
        self.assertEqual(len(verify_learn.check(cfg, fake)), sum(1 for e in entries if e["uid"] == entries[0]["uid"]))


if __name__ == "__main__":
    unittest.main()
