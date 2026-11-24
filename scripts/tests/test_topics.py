"""The topic hubs (data/topics.yml -> docs/topics/, assets/topic-members.json) are current, and every
page, anchor, video and download they name exists.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import build_topics as bt  # noqa: E402
import generate_labs  # noqa: E402

HEADING = re.compile(r"^#{1,6} (.+?)\s*$", re.M)
EXPLICIT = re.compile(r"\{#([\w-]+)[^}]*\}")


def anchors(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8")
    ids = set(EXPLICIT.findall(text))
    for h in HEADING.findall(text):
        ids.add(generate_labs.slug(EXPLICIT.sub("", h)))
    return ids


class Topics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = bt.load()
        cls.topics = cls.data["topics"]

    def test_generated_files_are_current(self):
        stale = [p.relative_to(ROOT).as_posix() for p, text in bt.outputs().items()
                 if not p.exists() or p.read_text(encoding="utf-8") != text]
        self.assertEqual(stale, [], "run: python scripts/build_topics.py")

    def test_pages_and_anchors_exist(self):
        problems = []
        for t in self.topics:
            for items in bt.entries(t).values():
                for spec in items:
                    path, _, anchor = spec["page"].partition("#")
                    if not (ROOT / path).exists():
                        problems.append(f"{t['id']}: no page {path}")
                    elif anchor and anchor not in anchors(ROOT / path):
                        problems.append(f"{t['id']}: no #{anchor} in {path}")
        self.assertEqual(problems, [], "\n".join(problems))

    def test_downloads_are_built(self):
        bundles = yaml.safe_load((ROOT / "scripts" / "bundles.yml").read_text(encoding="utf-8"))["bundles"]
        docx = {b["output"] for b in bundles} | {a for b in bundles for a in b.get("aliases") or []}
        deploy = (ROOT / ".github" / "workflows" / "quarto-pages.yml").read_text(encoding="utf-8")
        deploy += (ROOT / "scripts" / "build_start_kit_zip.py").read_text(encoding="utf-8")
        problems = []
        for t in self.topics:
            for name in bt.downloads(t):
                # The deploy names each zip it builds, with or without ".zip" (a loop over kit names).
                stem = re.escape(name.removesuffix(".zip"))
                built = name in docx if name.endswith(".docx") else bool(re.search(rf"(?<![\w-]){stem}(?![\w-])", deploy))
                if not built:
                    problems.append(f"{t['id']}: nothing builds downloads/{name}")
        self.assertEqual(problems, [], "\n".join(problems))

    def test_kit_folders_exist(self):
        for t in self.topics:
            for kit in bt.kits(t):
                self.assertTrue((ROOT / "examples" / kit).is_dir(), f"{t['id']}: no examples/{kit}")

    def test_every_topic_has_members_and_videos_resolve(self):
        for t in self.topics:
            pages = bt.members(t)
            self.assertTrue(pages, t["id"])
            bt.videos(t, pages)  # raises on an unknown video id

    def test_every_gap_has_a_note_and_no_note_is_stale(self):
        """The Topics page gives a reason for every empty cell, and only for empty cells."""
        problems = []
        for t in self.topics:
            have, notes = bt.coverage(t), t.get("gaps") or {}
            for col in notes:
                if col not in bt.COLUMNS:
                    problems.append(f"{t['id']}: unknown gap column {col!r}")
                elif have[col]:
                    problems.append(f"{t['id']}: has {bt.COLUMNS[col]} ({have[col]}); drop its gap note")
                elif not notes[col].startswith(bt.GAP_PREFIXES):
                    problems.append(f"{t['id']}: {col} note must start with one of {bt.GAP_PREFIXES}")
            for col, value in have.items():
                if not value and col not in notes:
                    problems.append(f"{t['id']}: no {bt.COLUMNS[col]}; add gaps: {col}: 'Needed: ...' or 'Not needed, because ...'")
        self.assertEqual(problems, [], "\n".join(problems))

    def test_everything_belongs_to_a_topic(self):
        """Every guide, learning path, developer workbook and kit code zip is in at least one hub,
        unless data/topics.yml lists it under outside_topics with a reason."""
        import build_start_kit_zip as kits
        outside = {o["path"]: o.get("reason") for o in self.data.get("outside_topics") or []}
        self.assertTrue(all(outside.values()), "every outside_topics entry needs a reason")
        pages = {p for t in self.topics for p in bt.members(t)}
        files = {d for t in self.topics for d in bt.downloads(t)}
        used_workbooks = {t["workbook"] for t in self.topics if t.get("workbook")}
        missing = []
        for g in sorted((ROOT / "docs" / "books" / "guides").glob("*.md")):
            rel = g.relative_to(ROOT).as_posix()
            if g.name.startswith(("_", "brief-")) or g.stem.endswith("-sheet"):
                continue
            if rel not in pages and rel not in outside:
                missing.append(f"guide {rel}")
        paths = [p.relative_to(ROOT).as_posix() for p in (ROOT / "docs" / "training").glob("*/index.md")
                 if not p.parent.name.startswith("_")]
        for rel in paths + generate_labs.MS_AUTOMATION:
            if rel not in pages and rel not in outside:
                missing.append(f"learning path {rel}")
        for wb in generate_labs.WORKBOOKS:
            if wb.key not in used_workbooks and wb.docs not in outside:
                missing.append(f"developer workbook {wb.key} ({wb.docs})")
        for kit in kits.KITS:
            name = kits.ZIP_NAMES.get(kit, kit) + ".zip"
            if name not in files and f"examples/{kit}" not in outside:
                missing.append(f"code zip {name}")
        stale = [p for p in outside if p in pages]
        self.assertEqual(missing, [], "belongs to no topic: " + ", ".join(missing))
        self.assertEqual(stale, [], f"outside_topics lists pages a topic now holds: {stale}")

    def test_folded_subjects_point_at_a_hub(self):
        ids = {t["id"] for t in self.topics}
        for f in self.data.get("folded") or []:
            self.assertIn(f["into"], ids, f["title"])
            self.assertTrue(f.get("reason"), f["title"])

    def test_navbar_lists_every_hub(self):
        quarto = yaml.safe_load((ROOT / "_quarto.yml").read_text(encoding="utf-8"))
        menu = next(m for m in quarto["website"]["navbar"]["left"] if m.get("text") == "Topics")["menu"]
        hrefs = {m["href"] for m in menu if "href" in m}
        missing = [t["id"] for t in self.topics if f"docs/topics/{t['id']}.md" not in hrefs]
        self.assertEqual(missing, [], "add these hubs to the Topics menu in _quarto.yml")


if __name__ == "__main__":
    unittest.main()
