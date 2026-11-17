"""Tests for scripts/build_catalog.py, the New Look catalog.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build_catalog as bc  # noqa: E402

REPO = Path(__file__).resolve().parents[2]

PATH_INDEX = """---
title: "Learning path: Widgets"
subtitle: "Two modules on widgets"
review-status: approved
---
# Learning path: Widgets

## Who this path is for

| Role | What you get |
|---|---|
| Identity engineer | Things |
| ISSO reviewer | Evidence |

**Level:** intermediate. **Products:** Microsoft Entra ID.

**Total time:** about 2 hours 10 minutes, with each module's Lab 1.
"""

GUIDE = """---
title: "Widgets: An Implementation Guide"
description: "A guide to widgets in Intune. More words."
audience: [Technical, Customer]
review-status: pending
research-type: implementation guide
---
## Step 1: First {#s1}
## Step 2: Second {#s2}
## Assessment mapping: Step 2
"""

WORKBOOK = """---
title: "Building Widgets"
audience: [Technical]
review-status: approved
---
# Building Widgets
"""

BOOK = """---
title: "Book 01 — Widgets"
audience: [Executive, Technical, Customer]
---
# Book 01
"""

LABS = """---
title: Labs
---
# Labs

## Building Widgets {#w}

[The workbook](../project-plans/developer-workbooks/widgets/index.md) · [its learning path](widgets/index.md)

| Chapter | Lab 1 | You need | Lab 2 | Module |
|---|---|---|---|---|
| [01 One](../x.md) | [Lab 1](../x.md#lab-1-fixtures) · [commands](../x.md#lab-1-commands) | Python | [test tenant](../x.md#lab-2-test-tenant) | [M1](widgets/01-one.md) |
| [02 Two](../y.md) | [Lab 1](../y.md#lab-1-fixtures) | Python | — | [M2](widgets/02-two.md) |
"""


class CatalogFromFixtures(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        r = self.root

        def write(rel: str, text: str) -> None:
            p = r / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text, encoding="utf-8")

        write("docs/training/widgets/index.md", PATH_INDEX)
        write("docs/training/widgets/01-one.md", "---\ntitle: One\n---\nword " * 10)
        write("docs/training/widgets/02-two.md", "---\ntitle: Two\n---\nword")
        write("docs/training/_verification/index.md", "---\ntitle: skip\n---\n")
        write("docs/training/labs.md", LABS)
        write("docs/books/guides/widgets-implementation.md", GUIDE)
        write("docs/project-plans/developer-workbooks/widgets/index.md", WORKBOOK)
        write("docs/project-plans/developer-workbooks/widgets/01-a.md", "---\ntitle: A\n---\ntext")
        write("docs/books/b01-widgets/index.md", BOOK)
        write("docs/books/b01-widgets/01-a.md", "---\nstatus: baseline\n---\ntext")
        write("docs/books/b01-widgets/appendix-a-x.md", "---\nstatus: baseline\n---\ntext")
        write("docs/presentations/videos.json", json.dumps([
            {"id": "V1", "group": "training", "minutes": 9, "source": "docs/training/widgets/01-one.md"},
            {"id": "V2", "group": "book", "minutes": 5, "source": "docs/books/guides/widgets-implementation.md"},
        ]))
        write("data/video-durations.json", json.dumps({"V1": 600}))
        shutil.copy(REPO / bc.OVERRIDES, r / bc.OVERRIDES)
        self.cat = bc.Builder(r).build()
        self.by_id = {i["id"]: i for i in self.cat["items"]}

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_learning_path_reads_the_page(self) -> None:
        p = self.by_id["docs/training/widgets/index.md"]
        self.assertEqual(p["type"], "Learning path")
        self.assertEqual(p["count"], 2)
        self.assertEqual(p["level"], "Intermediate")
        self.assertEqual(p["level_source"], "page")
        self.assertEqual(p["reading_minutes"], 130)
        self.assertEqual(p["reading_source"], "page")
        self.assertEqual(p["video_minutes"], 10)  # 600 s from video-durations.json, not the manifest's 9
        self.assertEqual(p["roles"], ["Identity engineer", "ISSO and assessor"])
        self.assertIn("Entra ID", p["topics"])
        self.assertEqual(p["status"], "Approved")
        self.assertEqual(p["url"], "docs/training/widgets/index.html")
        self.assertTrue(p["featured"])
        self.assertNotIn("docs/training/_verification/index.md", self.by_id)

    def test_guide_counts_steps_and_derives_level(self) -> None:
        g = self.by_id["docs/books/guides/widgets-implementation.md"]
        self.assertEqual(g["type"], "Implementation guide")
        self.assertEqual((g["count"], g["unit"]), (2, "steps"))
        self.assertEqual((g["level"], g["level_source"]), ("Intermediate", "audience"))
        self.assertEqual(g["status"], "Draft")
        self.assertEqual(g["video_minutes"], 5)
        # In the widgets family, so it takes the path's roles.
        self.assertIn("Identity engineer", g["roles"])
        self.assertEqual(g["description"], "A guide to widgets in Intune.")

    def test_workbook_book_labs_and_videos(self) -> None:
        w = self.by_id["docs/project-plans/developer-workbooks/widgets/index.md"]
        self.assertEqual((w["type"], w["count"], w["level"]), ("Developer workbook", 1, "Advanced"))
        self.assertIn("Developer", w["roles"])
        b = self.by_id["docs/books/b01-widgets/index.md"]
        self.assertEqual((b["type"], b["count"], b["status"], b["level"]), ("Book", 2, "Approved", "Unrated"))
        self.assertIn("Executive", b["roles"])
        lab = self.by_id["docs/training/labs.md#w"]
        self.assertEqual((lab["type"], lab["count"], lab["unit"]), ("Lab", 3, "labs"))
        self.assertEqual(lab["url"], "docs/training/labs.html#w")
        self.assertEqual(lab["status"], "Approved")
        series = {i["id"]: i for i in self.cat["items"] if i["type"] == "Video series"}
        self.assertEqual(series["videos:training"]["count"], 1)

    def test_every_value_is_a_facet_value(self) -> None:
        facets = self.cat["facets"]
        for i in self.cat["items"]:
            self.assertIn(i["type"], facets["type"])
            self.assertIn(i["level"], facets["level"])
            self.assertIn(i["status"], facets["status"])
            for r in i["roles"]:
                self.assertIn(r, facets["role"])
            for t in i["topics"]:
                self.assertIn(t, facets["topic"])

    def test_new_folder_appears_without_a_list(self) -> None:
        (self.root / "docs/training/gadgets").mkdir()
        (self.root / "docs/training/gadgets/index.md").write_text("---\ntitle: Learning path: Gadgets\n---\n", encoding="utf-8")
        ids = {i["id"] for i in bc.Builder(self.root).build()["items"]}
        self.assertIn("docs/training/gadgets/index.md", ids)


class CommittedCatalog(unittest.TestCase):
    def test_overrides_name_only_known_roles_and_topics(self) -> None:
        b = bc.Builder(REPO)
        topics = {name for name, _ in b.topic_rules}
        for name, _ in b.role_rules:
            self.assertIn(name, b.role_names)
        for topic, roles in b.topic_roles.items():
            self.assertIn(topic, topics)
            for r in roles:
                self.assertIn(r, b.role_names)
        for path, fix in b.item_fix.items():
            self.assertTrue((REPO / path).exists(), f"data/catalog-overrides.yml names a missing page: {path}")
            for r in fix.get("roles", []) + fix.get("add-roles", []):
                self.assertIn(r, b.role_names)
            for t in fix.get("topics", []) + fix.get("add-topics", []):
                self.assertIn(t, topics)

    def test_catalog_is_current(self) -> None:
        current = (REPO / bc.OUTPUT).read_text(encoding="utf-8")
        self.assertEqual(current, bc.render(REPO),
                         "docs/new-look/catalog.json is out of date: run python scripts/build_catalog.py")


if __name__ == "__main__":
    unittest.main()
