"""Tests for scripts/check_changed.py: the tier decision and the Markdown scanners.

Fixture file lists only: no git, no Quarto, no PyYAML.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_changed as cc  # noqa: E402
from check_changed import Change  # noqa: E402

PUBLISHED_ROOTS = ("docs/books/", "docs/research/", "docs/presentations/")


def published(path: str) -> bool:
    """A stand-in for _quarto.yml's project.render rules."""
    if path in ("index.qmd", "sitemap.qmd", "404.qmd", "docs/start-here.md"):
        return True
    if any(part.startswith(("_", ".")) for part in path.split("/")):
        return False
    return path.startswith(PUBLISHED_ROOTS) and path.endswith((".md", ".qmd"))


def decide(changes, **kw):
    return cc.decide(changes, published=published, **kw)


def mods(*paths):
    return [Change("M", p) for p in paths]


class FullTier(unittest.TestCase):
    def assert_full(self, changes, fragment="", **kw):
        plan = decide(changes, **kw)
        self.assertEqual(plan.tier, "FULL", plan.reasons)
        self.assertTrue(any(fragment in r for r in plan.reasons), plan.reasons)
        return plan

    def test_site_configuration(self):
        self.assert_full(mods("_quarto.yml"), "site configuration")

    def test_assets_filters_extensions(self):
        for p in ("assets/fmw-hero.lua", "assets/partials/title-block.html", "assets/reference-mslearn.docx",
                  "docs/filters/x.lua", "_extensions/foo/_extension.yml"):
            with self.subTest(p):
                self.assert_full(mods(p))

    def test_docs_underscore_include(self):
        self.assert_full(mods("docs/_shared-callout.md"), "docs/_* include")
        self.assert_full(mods("docs/_partials/footer.md"), "docs/_* include")

    def test_folder_metadata(self):
        self.assert_full(mods("docs/books/b07-pki/_metadata.yml"), "folder metadata")

    def test_build_scripts_and_manifests(self):
        for p in ("scripts/generate_sitemap.py", "scripts/generate_book_metrics.py",
                  "scripts/generate_video_manifest.py", "scripts/write_redirects.py", "scripts/redirects.yml",
                  "scripts/build_bundles.py", "scripts/bundles.yml", "scripts/bundle-filter.lua",
                  ".github/workflows/quarto-pages.yml"):
            with self.subTest(p):
                self.assert_full(mods(p))

    def test_include_target_found_by_grep(self):
        self.assert_full(mods("docs/presentations/_video-library.md"), "included by a published page",
                         include_targets={"docs/presentations/_video-library.md"})
        # The same file is not special unless something includes it.
        self.assertEqual(decide(mods("docs/compliance/servicenow-day2/START-HERE.md")).tier, "NONE")

    def test_listing_page(self):
        self.assert_full(mods("docs/books/b07-pki/index.md"), "has a listing",
                         listing_pages={"docs/books/b07-pki/index.md"})

    def test_video_manifest(self):
        self.assert_full(mods("docs/presentations/videos.json"), "video manifest")

    def test_deleted_published_page(self):
        plan = self.assert_full([Change("D", "docs/books/b07-pki/03-old.md")], "published page deleted")
        self.assertIn("docs/books/b07-pki/03-old.md", plan.deleted)

    def test_renamed_published_page(self):
        plan = self.assert_full([Change("R", "docs/books/b07-pki/03-new.md", "docs/books/b07-pki/03-old.md")],
                                "published page renamed")
        self.assertIn("docs/books/b07-pki/03-old.md", plan.deleted)

    def test_page_count_over_threshold(self):
        pages = [f"docs/books/b07-pki/{i:02d}-chapter.md" for i in range(26)]
        self.assert_full(mods(*pages), "26 published pages affected (more than 25)")

    def test_threshold_is_configurable(self):
        pages = [f"docs/books/b07-pki/{i:02d}-chapter.md" for i in range(4)]
        self.assert_full(mods(*pages), "more than 3", max_pages=3)

    def test_force_full(self):
        plan = self.assert_full(mods("docs/books/b07-pki/01-a.md"), "--force-full", force_full=True)
        self.assertEqual(plan.pages, ["docs/books/b07-pki/01-a.md"])

    def test_full_reason_listed_once(self):
        plan = decide(mods("_quarto.yml", "_quarto.yml"))
        self.assertEqual(len(plan.reasons), 1)


class ChangedTier(unittest.TestCase):
    def test_one_page(self):
        plan = decide(mods("docs/books/b07-pki/03-x.md"))
        self.assertEqual(plan.tier, "CHANGED")
        self.assertEqual(plan.pages, ["docs/books/b07-pki/03-x.md"])

    def test_added_page_is_changed_not_full(self):
        plan = decide([Change("A", "docs/research/new-topic.md")])
        self.assertEqual(plan.tier, "CHANGED")

    def test_exactly_at_threshold(self):
        pages = [f"docs/books/b07-pki/{i:02d}-chapter.md" for i in range(25)]
        plan = decide(mods(*pages))
        self.assertEqual(plan.tier, "CHANGED")
        self.assertEqual(len(plan.pages), 25)

    def test_changed_image_brings_in_the_pages_that_embed_it(self):
        img = "docs/images/diagrams/b07-pki/svg/fig-01.svg"
        plan = decide(mods(img), image_users={img: ["docs/books/b07-pki/01-a.md", "docs/books/b07-pki/02-b.md"]})
        self.assertEqual(plan.tier, "CHANGED")
        self.assertEqual(plan.pages, ["docs/books/b07-pki/01-a.md", "docs/books/b07-pki/02-b.md"])
        self.assertEqual(plan.direct_pages, [])
        self.assertEqual(plan.image_pages["docs/books/b07-pki/01-a.md"], [img])

    def test_image_pages_count_toward_threshold(self):
        img = "docs/images/shared.svg"
        users = [f"docs/books/b0{i % 9}/{i:02d}.md" for i in range(30)]
        self.assertEqual(decide(mods(img), image_users={img: users}).tier, "FULL")

    def test_unpublished_pages_alongside_are_ignored(self):
        plan = decide(mods("docs/books/b07-pki/03-x.md", "docs/books/b07-pki/_verification/03-x.md",
                           "docs/compliance/notes.md"))
        self.assertEqual(plan.pages, ["docs/books/b07-pki/03-x.md"])

    def test_root_qmd_page(self):
        self.assertEqual(decide(mods("404.qmd")).pages, ["404.qmd"])

    def test_non_listing_index_is_changed(self):
        plan = decide(mods("docs/research/index.md"), listing_pages={"docs/books/b07-pki/index.md"})
        self.assertEqual(plan.tier, "CHANGED")


class NoneTier(unittest.TestCase):
    def test_nothing(self):
        plan = decide([])
        self.assertEqual(plan.tier, "NONE")

    def test_deck_binaries(self):
        plan = decide(mods("presentations/b07-pki/B07_PKI.pptx", "presentations/b07-pki/B07_PKI_Narrated.vtt"))
        self.assertEqual(plan.tier, "NONE")
        self.assertEqual(plan.tasks["a11y"], ["presentations/b07-pki/B07_PKI.pptx"])
        self.assertIn("video-manifest", plan.tasks)

    def test_example_code(self):
        plan = decide(mods("examples/ansible/inventory/cmdb_inventory.py", "examples/hcm-entra/x.py"))
        self.assertEqual(plan.tier, "NONE")
        self.assertEqual(plan.tasks["kits"], ["ansible"])

    def test_unpublished_notes(self):
        plan = decide(mods("docs/books/b07-pki/_verification/03-x.md", "InBox/draft.md", "STATUS.md"))
        self.assertEqual(plan.tier, "NONE")
        # The repository is public, so unpublished notes still get the neutrality check; the inbox doesn't.
        self.assertEqual(plan.tasks, {"neutrality": ["docs/books/b07-pki/_verification/03-x.md", "STATUS.md"]})

    def test_deleted_unpublished_file_is_not_full(self):
        plan = decide([Change("D", "presentations/old/Old.pptx")])
        self.assertEqual(plan.tier, "NONE")
        self.assertEqual(plan.deleted, ["presentations/old/Old.pptx"])
        self.assertNotIn("a11y", plan.tasks)


class NonSiteTasks(unittest.TestCase):
    def test_checker_change_runs_every_deck(self):
        t = cc.non_site_tasks(mods("presentations/_build/a11y_check.py", "presentations/a/A.pptx"))
        self.assertEqual(t["a11y"], ["*"])

    def test_lock_files_skipped(self):
        self.assertNotIn("a11y", cc.non_site_tasks(mods("presentations/a/~$A.pptx")))

    def test_kit_builder_change_builds_every_kit(self):
        t = cc.non_site_tasks(mods("scripts/build_start_kit_zip.py"))
        self.assertEqual(t["kits"], ["start-kit", "copilot-agent-pack", "app-modernization", "ansible"])

    def test_bundle_kit_rebuilds_when_one_of_its_folders_changes(self):
        bundles = {"attribute-driven-migration-code": ("hcm-entra", "third_party/csv2scim")}
        kits = ("validation-kit", "attribute-driven-migration-code")
        t = cc.non_site_tasks(mods("examples/third_party/csv2scim/README.md"), kits, bundles)
        self.assertEqual(t["kits"], ["attribute-driven-migration-code"])
        t = cc.non_site_tasks(mods("examples/hcm-entra/README.md", "examples/validation-kit/README.md"), kits, bundles)
        self.assertEqual(t["kits"], ["attribute-driven-migration-code", "validation-kit"])
        self.assertNotIn("kits", cc.non_site_tasks(mods("examples/privileged-access/README.md"), kits, bundles))

    def test_example_tests_run_for_each_changed_kit(self):
        t = cc.non_site_tasks(mods("examples/privileged-access/PaCore/PaCore.psm1", "examples/hcm-entra/README.md",
                                   "examples/privileged-access/tests/AzurePim.Tests.ps1"))
        self.assertEqual(t["example-tests"], ["privileged-access", "hcm-entra"])

    def test_example_tests_skip_folders_without_tests(self):
        t = cc.non_site_tasks(mods("examples/third_party/csv2scim/README.md", "examples/README.md"))
        self.assertNotIn("example-tests", t)

    def test_every_kit_is_tested_when_the_runner_or_workflow_changes(self):
        for path in ("scripts/run_example_tests.py", ".github/workflows/pr-checks.yml"):
            self.assertEqual(cc.non_site_tasks(mods(path))["example-tests"], ["*"], path)

    def test_the_runner_adds_the_kits_that_test_a_kits_output(self):
        import run_example_tests as ret
        self.assertEqual(ret.expand(["non-person-identity", "privileged-access"]),
                         ["non-person-identity", "drift-pipeline", "privileged-access"])

    def test_every_windows_only_test_file_exists(self):
        import run_example_tests as ret
        for kit, (files, _why) in ret.WINDOWS_ONLY.items():
            for f in files:
                self.assertTrue((ret.EXAMPLES / kit / f).is_file(), f"{kit}/{f}")

    def test_project_plans(self):
        self.assertIn("project-plans", cc.non_site_tasks(mods("data/project-plans/network-access.yaml")))

    def test_revisions(self):
        for path in ("data/editions.yml", "data/edition-assets/edition-2026.10.json", "scripts/cut_edition.py",
                     "docs/about/archive.md", "docs/books/b02-identity/index.md",
                     "docs/books/guides/effective-meetings.md",
                     "docs/project-plans/developer-workbooks/privileged-access/index.md"):
            self.assertIn("revisions", cc.non_site_tasks(mods(path)), path)
        for path in ("docs/books/b02-identity/01-why-identity.md", "docs/books/guides/_verification/x.md",
                     "docs/project-plans/developer-workbooks/index.md"):
            self.assertNotIn("revisions", cc.non_site_tasks(mods(path)), path)

    def test_deck_links(self):
        for path in ("docs/presentations/index.md", "data/deck-assets.json", "scripts/deck_assets.py",
                     "data/edition-assets/edition-2026.10.json", "presentations/b02-identity/README.md"):
            self.assertIn("deck-links", cc.non_site_tasks(mods(path)), path)
        self.assertNotIn("deck-links", cc.non_site_tasks(mods("presentations/b02-identity/build.js")))

    def test_authorities_spine(self):
        for path in ("data/federal-compliance-compliance-spine.yml", "scripts/render_authorities_table.py",
                     "docs/compliance/Vol_I_Book_07_Network_Enforcement_Substrate.md"):
            self.assertIn("authorities", cc.non_site_tasks(mods(path)), path)
        self.assertNotIn("authorities", cc.non_site_tasks(mods("docs/books/b02-identity/index.md")))

    def test_unit_tests_run_when_the_checker_changes(self):
        self.assertIn("unit-tests", cc.non_site_tasks(mods("scripts/check_changed.py")))
        self.assertIn("unit-tests", cc.non_site_tasks(mods("scripts/tests/test_check_changed.py")))
        self.assertIn("unit-tests", cc.non_site_tasks(mods("scripts/check_neutrality.py")))

    def test_evidence_maps(self):
        for path in ("examples/evidence-maps/sample-portfolio.yml", "data/schemas/evidence-map.schema.json",
                     "scripts/check_evidence_maps.py"):
            self.assertIn("evidence-maps", cc.non_site_tasks(mods(path)), path)
        self.assertNotIn("evidence-maps", cc.non_site_tasks(mods("docs/books/b02-identity/index.md")))

    def test_neutrality_checks_changed_text_files(self):
        t = cc.non_site_tasks(mods("docs/books/b02-identity/index.md", "docs/images/x/svg/a.svg",
                                   "presentations/a/A.pptx", "archive/old.md"))
        self.assertEqual(t["neutrality"], ["docs/books/b02-identity/index.md", "docs/images/x/svg/a.svg"])

    def test_neutrality_terms_change_checks_every_file(self):
        for path in ("data/neutrality-terms.txt", "data/neutrality-baseline.txt", "scripts/check_neutrality.py"):
            self.assertEqual(cc.non_site_tasks(mods(path))["neutrality"], ["*"], path)

    def test_neutrality_skips_deleted_files(self):
        self.assertNotIn("neutrality", cc.non_site_tasks([Change("D", "docs/books/b02-identity/old.md")]))


class RenderTargets(unittest.TestCase):
    def test_single_pages_stay_single(self):
        pub = [f"docs/books/b07-pki/{i:02d}.md" for i in range(15)]
        self.assertEqual(cc.render_targets(["docs/books/b07-pki/01.md"], pub), ["docs/books/b07-pki/01.md"])

    def test_many_pages_in_one_folder_render_the_folder(self):
        pub = [f"docs/books/b07-pki/{i:02d}.md" for i in range(15)]
        self.assertEqual(cc.render_targets(pub[:6], pub), ["docs/books/b07-pki"])

    def test_root_pages_never_render_the_project(self):
        self.assertEqual(cc.render_targets(["404.qmd", "index.qmd"], ["404.qmd", "index.qmd"]),
                         ["404.qmd", "index.qmd"])


class Anchors(unittest.TestCase):
    def test_pandoc_identifiers(self):
        cases = {
            "A — B: c.d (x)": "a-b-c.d-x",
            "2026 Plan": "plan",
            "Path C: `az rest`": "path-c-az-rest",
            "What `have_ato` means": "what-have_ato-means",
            "**Bold** and *em* and [a link](x.md)": "bold-and-em-and-a-link",
            "Notes[^n1]": "notes",
            "Don’t stop": "dont-stop",
            "?!": "section",
        }
        for heading, expected in cases.items():
            with self.subTest(heading):
                self.assertEqual(cc.slug(heading), expected)

    def test_page_anchors(self):
        text = ("---\ntitle: T\n---\n\n## Intro\n\n## Intro\n\n## Custom {#mine .unnumbered}\n\n"
                "```\n## not a heading\n```\n\n::: {#box .callout-note}\nx\n:::\n\n"
                "![Fig](a.svg){#fig-one}\n\n<a id=\"raw\"></a>\n")
        ids = cc.anchors(text)
        self.assertTrue({"intro", "intro-1", "mine", "box", "fig-one", "raw"} <= ids, ids)
        self.assertNotIn("not-a-heading", ids)
        self.assertNotIn("custom", ids)


class Links(unittest.TestCase):
    def test_kinds_and_resolution(self):
        text = ("See [two](02-b.md#part), [up](../b02-identity/index.md), [web](https://x.gov/a), "
                "[self](#top), ![img](../../images/a%20b.svg \"t\") and `[code](nope.md)`.\n\n"
                "[ref]: ../../../downloads/b07-pki-bundle.docx\n")
        got = {(l.path, l.fragment, l.image) for l in cc.links("docs/books/b07-pki/01-a.md", text)}
        self.assertEqual(got, {
            ("docs/books/b07-pki/02-b.md", "part", False),
            ("docs/books/b02-identity/index.md", "", False),
            ("", "top", False),
            ("docs/images/a b.svg", "", True),
            ("downloads/b07-pki-bundle.docx", "", False),
        })


class Footnotes(unittest.TestCase):
    def test_definitions_and_references(self):
        text = "Text[^a] and[^b].\n\n```\n[^c]\n```\n\n[^a]: One.\n[^d]: Unused.\n"
        defs, refs = cc.footnotes(text)
        self.assertEqual([d for d, _ in defs], ["a", "d"])
        self.assertEqual([r for r, _ in refs], ["a", "b"])


if __name__ == "__main__":
    unittest.main()
