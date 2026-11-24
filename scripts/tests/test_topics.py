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
        cls.topics = yaml.safe_load(bt.DATA.read_text(encoding="utf-8"))["topics"]

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
            if t.get("kit"):
                self.assertTrue((ROOT / "examples" / t["kit"]).is_dir(), f"{t['id']}: no examples/{t['kit']}")

    def test_every_topic_has_members_and_videos_resolve(self):
        for t in self.topics:
            pages = bt.members(t)
            self.assertTrue(pages, t["id"])
            bt.videos(t, pages)  # raises on an unknown video id


if __name__ == "__main__":
    unittest.main()
