"""Tests for the Learn coverage map: scripts/learn_coverage.py and scripts/source_watch/learn_pages.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS / "source_watch"))
sys.path.insert(0, str(SCRIPTS))

import check_changed as cc  # noqa: E402
import learn_coverage as lc  # noqa: E402
import learn_pages as lp  # noqa: E402
import report  # noqa: E402

WS, ENTRA = lp.SITE["windows-server-identity"], lp.SITE["entra"]
L = "https://learn.microsoft.com/"


class Pages(unittest.TestCase):
    def test_what_is_a_page(self):
        self.assertTrue(lp.is_page(WS, "WindowsServerDocs/identity/ad-ds/plan/x.md"))
        self.assertTrue(lp.is_page(WS, "WindowsServerDocs/identity/Identity-and-Access.yml"))
        self.assertFalse(lp.is_page(WS, "WindowsServerDocs/identity/TOC.yml"))
        self.assertFalse(lp.is_page(WS, "WindowsServerDocs/identity/ad-ds/includes/x.md"))
        self.assertFalse(lp.is_page(WS, "WindowsServerDocs/identity/media/x.png"))
        self.assertFalse(lp.is_page(WS, "WindowsServerDocs/networking/x.md"))
        self.assertFalse(lp.is_page(ENTRA, "docs/identity/saas-apps/box-tutorial.md"))
        self.assertFalse(lp.is_page(ENTRA, "docs/identity/users/context/ugr-context.yml"))
        self.assertFalse(lp.is_page(ENTRA, "docs/zone-pivot-groups.yml"))
        self.assertTrue(lp.is_page(ENTRA, "docs/identity/hybrid/connect/how-to-connect-install-roadmap.md"))

    def test_url_from_the_docfx_mapping(self):
        self.assertEqual(lp.page_url(WS, "WindowsServerDocs/identity/Identity-and-Access.yml"),
                         L + "windows-server/identity/identity-and-access")
        self.assertEqual(lp.page_url(WS, "WindowsServerDocs/identity/ad-cs/index.yml"), L + "windows-server/identity/ad-cs")
        self.assertEqual(lp.page_url(ENTRA, "docs/index.yml"), L + "entra")
        self.assertEqual(lp.page_url(ENTRA, "docs//identity-platform/x.md"), L + "entra/identity-platform/x")

    def test_area(self):
        self.assertEqual(WS.area("WindowsServerDocs/identity/laps/laps-overview.md"), "laps")
        self.assertEqual(WS.area("WindowsServerDocs/identity/Identity-and-Access.yml"), "general")
        self.assertEqual(ENTRA.area("docs/identity/hybrid/connect/x.md"), "hybrid")
        self.assertEqual(ENTRA.area("docs/identity/index.yml"), "identity")
        self.assertEqual(ENTRA.area("docs/id-governance/x.md"), "id-governance")

    def test_norm(self):
        want = L + "entra/identity/hybrid/whatis-hybrid-identity"
        for url in ("https://learn.microsoft.com/en-us/entra/identity/hybrid/whatis-hybrid-identity",
                    "https://learn.microsoft.com/entra/identity/hybrid/whatis-hybrid-identity/",
                    "https://docs.microsoft.com/en-gb/Entra/identity/hybrid/whatis-hybrid-identity?tabs=x#y",
                    "https://learn.microsoft.com/zh-hans/entra/identity/hybrid/whatis-hybrid-identity"):
            self.assertEqual(lp.norm(url), want, url)
        self.assertIsNone(lp.norm("https://example.com/entra/x"))


class LearnSide(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def put(self, rel: str, text: str) -> Path:
        f = self.repo / rel
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(text, encoding="utf-8")
        return f

    def test_front_matter(self):
        f = self.put("WindowsServerDocs/identity/laps/laps-overview.md",
                     "---\ntitle: Windows LAPS overview\ndescription: >\n  Learn about\n  LAPS.\nms.date: 04/02/2025\n"
                     "ms.topic: overview\n---\n\n# Ignored\n")
        self.assertEqual(lc.read_meta(f), {"title": "Windows LAPS overview", "description": "Learn about LAPS.",
                                           "ms_date": "2025-04-02", "ms_topic": "overview"})
        f = self.put("WindowsServerDocs/identity/x.md", "---\ndescription: d\n---\n\n# Heading title\n")
        self.assertEqual(lc.read_meta(f)["title"], "Heading title")
        f = self.put("WindowsServerDocs/identity/hub.yml",
                     "### YamlMime:Hub\ntitle: Identity and access\nmetadata:\n  ms.date: 2026-01-05\n  description: Hub.\n")
        self.assertEqual(lc.read_meta(f), {"title": "Identity and access", "description": "Hub.",
                                           "ms_date": "2026-01-05", "ms_topic": ""})

    def test_pages_and_redirects(self):
        self.put("WindowsServerDocs/identity/laps/new.md", "---\ntitle: New\n---\n")
        self.put("WindowsServerDocs/identity/laps/includes/x.md", "---\ntitle: Include\n---\n")
        self.put("WindowsServerDocs/identity/TOC.yml", "items: []\n")
        pages = lc.learn_pages(WS, self.repo)
        self.assertEqual(list(pages), [L + "windows-server/identity/laps/new"])
        self.put(".openpublishing.redirection.identity.json", json.dumps({"redirections": [
            {"source_path": "WindowsServerDocs/identity/laps/old.md", "redirect_url": "/windows-server/identity/laps/older"},
            {"source_path_from_root": "/WindowsServerDocs/identity/laps/older.md",
             "redirect_url": "https://learn.microsoft.com/en-us/windows-server/identity/laps/new"},
            {"source_path": "WindowsServerDocs/identity/laps/away.md", "redirect_url": "/windows-server/networking/x"},
        ]}))
        self.assertEqual(lc.learn_redirects(WS, self.repo, pages), {
            L + "windows-server/identity/laps/old": L + "windows-server/identity/laps/new",
            L + "windows-server/identity/laps/older": L + "windows-server/identity/laps/new"})


def page(name: str, **kw) -> dict:
    return {"path": f"WindowsServerDocs/identity/laps/{name}.md", "url": L + f"windows-server/identity/laps/{name}",
            "title": name.title(), "area": "laps", "ms_date": "2026-01-01", "ms_topic": "how-to", "description": "", **kw}


class Merge(unittest.TestCase):
    def test_hand_fields_kept_and_citations_drive_cited(self):
        old = {"pages": [
            {**page("a"), "coverage": "not-covered", "note": "needs a lab", "cited_by": []},
            {**page("b"), "coverage": "cited", "note": "", "cited_by": ["docs/x.md"]},
            {**page("c"), "coverage": "out-of-scope", "note": "consumer", "workbook": ["docs/y.md"], "cited_by": []},
        ]}
        fresh = {p["url"]: p for p in (page("a"), page("b"), page("c"), page("d"))}
        cited = {L + "windows-server/identity/laps/a": {"docs/z.md"}, L + "windows-server/identity/laps/c": {"docs/z.md"}}
        data = lc.merge(WS, fresh, old, cited, "2026-11-09", {})
        got = {p["path"].rsplit("/", 1)[1][:-3]: p for p in data["pages"]}
        self.assertEqual((got["a"]["coverage"], got["a"]["note"], got["a"]["cited_by"]), ("cited", "needs a lab", ["docs/z.md"]))
        self.assertEqual(got["b"]["coverage"], "unreviewed")       # lost its last citation
        self.assertEqual((got["c"]["coverage"], got["c"]["workbook"]), ("out-of-scope", ["docs/y.md"]))
        self.assertEqual((got["d"]["coverage"], got["d"]["note"]), ("unreviewed", ""))
        self.assertNotIn("workbook", got["d"])

    def test_gone_pages_are_kept_and_renames_carry_over(self):
        old = {"pages": [{**page("gone"), "coverage": "not-covered", "note": "n", "cited_by": []},
                         {**page("old"), "coverage": "covered-uncited", "note": "kept", "workbook": ["docs/y.md"], "cited_by": []}]}
        fresh = {p["url"]: p for p in (page("new"),)}
        redirects = {L + "windows-server/identity/laps/old": L + "windows-server/identity/laps/new"}
        cited = {L + "windows-server/identity/laps/old": {"docs/cites-old.md"}}
        data = lc.merge(WS, fresh, old, cited, "2026-11-09", redirects)
        got = {p["url"].rsplit("/", 1)[1]: p for p in data["pages"]}
        self.assertEqual(got["gone"]["gone"], "2026-11-09")
        self.assertEqual(got["new"]["note"], "kept")
        self.assertEqual(got["new"]["cited_by"], ["docs/cites-old.md"])  # a citation of the old address counts
        self.assertEqual(got["new"]["coverage"], "cited")
        # It comes back: no longer gone.
        again = lc.merge(WS, {p["url"]: p for p in (page("gone"), page("new"))}, data, {}, "2026-11-16", redirects)
        self.assertNotIn("gone", {p["url"].rsplit("/", 1)[1]: p for p in again["pages"]}["gone"])

    def test_offline_keeps_the_stored_list(self):
        old = {"site": "windows-server-identity", "commit": "abc", "fetched": "2026-11-09",
               "pages": [{**page("a"), "coverage": "unreviewed", "note": "", "cited_by": []},
                         {**page("g"), "coverage": "unreviewed", "note": "", "cited_by": [], "gone": "2026-11-02"}],
               "redirects": {}}
        data = lc.merge(WS, None, old, {L + "windows-server/identity/laps/a": {"docs/a.md"}}, "")
        self.assertEqual((data["commit"], data["fetched"]), ("abc", "2026-11-09"))
        self.assertEqual([p["coverage"] for p in data["pages"]], ["cited", "unreviewed"])
        self.assertEqual(data["pages"][1]["gone"], "2026-11-02")
        self.assertEqual(lc.merge(WS, None, lc.yaml.safe_load(lc.dump(data)), {L + "windows-server/identity/laps/a": {"docs/a.md"}}, ""), data)

    def test_validate(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "docs").mkdir()
            (Path(tmp) / "docs" / "y.md").write_text("x", encoding="utf-8")
            data = {"pages": [{**page("a"), "coverage": "partly"}, {**page("b"), "coverage": "covered-uncited",
                                                                    "workbook": ["docs/y.md#s", "docs/missing.md"]}]}
            errors = lc.validate(WS, data, Path(tmp))
        self.assertEqual(len(errors), 2)
        self.assertIn("'partly'", errors[0])
        self.assertIn("docs/missing.md", errors[1])


class WorkbookSide(unittest.TestCase):
    def test_citations(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docs").mkdir()
            (root / "docs" / "a.md").write_text(
                "See [LAPS](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview#scenarios).\n"
                "[^n]: <https://learn.microsoft.com/entra/identity/hybrid/whatis-hybrid-identity/>.\n", encoding="utf-8")
            cited = lc.citations(root, ["docs/a.md"])
        self.assertEqual(cited, {L + "windows-server/identity/laps/laps-overview": {"docs/a.md"},
                                 L + "entra/identity/hybrid/whatis-hybrid-identity": {"docs/a.md"}})

    def test_scanned_files(self):
        self.assertTrue(lc.PRESENTATION_FILE.match("presentations/b02-identity/build.js"))
        self.assertTrue(lc.PRESENTATION_FILE.match("presentations/b02-identity/B02_Identity_Narration_Script.md"))
        self.assertFalse(lc.PRESENTATION_FILE.match("presentations/b02-identity/B02_Identity.pptx"))
        files = lc.workbook_files()
        self.assertNotIn(lc.PAGE_REL, files)
        self.assertFalse(any(f.startswith("data/learn-coverage/") for f in files))

    def test_homes_and_page(self):
        p = {**page("a"), "title": "Meet NIST SP 800-63 requirements", "coverage": "not-covered", "note": "add | lab",
             "cited_by": ["examples/kit/x.ps1", "docs/books/b02-identity/01-x.md"]}
        block = lc.render_block([(WS, {"pages": [p], "redirects": {}}), (ENTRA, {"pages": [], "redirects": {}})])
        self.assertTrue(block.startswith(lc.BEGIN) and block.endswith(lc.END))
        self.assertIn("(../books/b02-identity/01-x.md)", block)          # a published page: relative link first
        self.assertIn(lc.GITHUB + "examples/kit/x.ps1", block)          # anything else: on GitHub
        self.assertIn(lc.CLAIMS_OK, block)                              # Microsoft's title, not a workbook claim
        self.assertIn("add \\| lab", block)
        self.assertIn("### laps {#windows-server-identity-laps}", block)
        self.assertEqual(lc.write_page("intro\n\n" + lc.BEGIN + "\nold\n" + lc.END + "\n", block), "intro\n\n" + block + "\n")


class SourceWatch(unittest.TestCase):
    TREES = {
        "windowsserverdocs": ["laps/a.md", "laps/b.md", "TOC.yml"],
        "entra-docs": ["identity/hybrid/x.md", "identity/saas-apps/box-tutorial.md", "media/p.png"],
    }

    def getter(self, trees):
        def get(url):
            for repo, paths in trees.items():
                if f"/{repo}/" in url:
                    if paths is None:
                        return 500, None
                    return 200, {"truncated": False, "tree": [{"type": "blob", "path": p} for p in paths]}
            return 404, None
        return get

    def test_first_run_is_silent_then_changes_are_listed(self):
        state: dict = {}
        first = lp.check(state, self.getter(self.TREES))
        self.assertEqual((first["added"], first["removed"], first["errors"]), ([], [], []))
        self.assertEqual(sorted(state["learn_pages"]["entra"]), [L + "entra/identity/hybrid/x"])
        trees = {"windowsserverdocs": ["laps/a.md", "laps/c.md"],
                 "entra-docs": ["identity/hybrid/x.md", "identity/saas-apps/new-app-tutorial.md"]}
        second = lp.check(state, self.getter(trees))
        self.assertEqual([r["url"] for r in second["added"]], [L + "windows-server/identity/laps/c"])
        self.assertEqual([r["url"] for r in second["removed"]], [L + "windows-server/identity/laps/b"])
        self.assertEqual(second["added"][0]["path"], "WindowsServerDocs/identity/laps/c.md")

    def test_a_failed_listing_keeps_the_previous_list(self):
        state: dict = {}
        lp.check(state, self.getter(self.TREES))
        before = dict(state["learn_pages"]["windows-server-identity"])
        out = lp.check(state, self.getter({**self.TREES, "windowsserverdocs": None}))
        self.assertEqual(len(out["errors"]), 1)
        self.assertEqual(state["learn_pages"]["windows-server-identity"], before)

    def test_report_section(self):
        results = {"week_of": "2026-11-16", "learn_pages": {"added": [{"site": "entra", "name": "Microsoft Entra", "repo": "MicrosoftDocs/entra-docs",
                                              "url": L + "entra/new", "path": "docs/new.md"}],
                                   "removed": [], "errors": []}}
        self.assertTrue(report.has_findings(results))
        text = report.render(results)
        self.assertIn("## New and retired Learn identity pages", text)
        self.assertIn(f"| <{L}entra/new> | Microsoft Entra | New |", text)
        self.assertIn("**1 new or retired Learn identity pages**", text)
        self.assertFalse(report.has_findings({"learn_pages": {"added": [], "removed": [], "errors": []}}))


class Wiring(unittest.TestCase):
    def test_check_changed_runs_the_check(self):
        def mods(path):
            return [cc.Change("M", path)]
        for path in ("docs/books/b02-identity/01-x.md", "examples/start-kit/x.ps1", "data/learn-coverage/entra.yml",
                     "presentations/b02-identity/build.js", "scripts/learn_coverage.py"):
            self.assertIn("learn-coverage", cc.non_site_tasks(mods(path)), path)
        self.assertNotIn("learn-coverage", cc.non_site_tasks(mods("presentations/b02-identity/B02.pptx")))


if __name__ == "__main__":
    unittest.main()
