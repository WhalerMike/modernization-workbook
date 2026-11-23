"""The vendored Microsoft icons (scripts/diagrams/icons/) match their manifest, and every
icon a diagram names exists.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
ICONS = ROOT / "scripts" / "diagrams" / "icons"
DIAGRAMS = ROOT / "docs" / "images" / "diagrams"


class DiagramIcons(unittest.TestCase):
    def test_files_match_the_manifest(self):
        manifest = json.loads((ICONS / "manifest.json").read_text(encoding="utf-8"))
        present = {p.relative_to(ICONS).as_posix() for p in ICONS.glob("*/*.svg")}
        self.assertEqual(present, set(manifest["files"]), "icons added or removed without running vendor.py")
        for rel, meta in manifest["files"].items():
            body = (ICONS / rel).read_bytes()
            self.assertEqual(hashlib.sha256(body).hexdigest(), meta["sha256"], f"{rel} differs from Microsoft's file")
        self.assertIn("architectural diagrams", manifest["terms"])

    def test_manifest_matches_icons_yml(self):
        want = yaml.safe_load((ICONS / "icons.yml").read_text(encoding="utf-8"))
        manifest = json.loads((ICONS / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual({f"{s}/{n}.svg" for s, icons in want.items() for n in icons}, set(manifest["files"]))

    def test_every_icon_a_diagram_names_exists(self):
        have = {p.stem for p in ICONS.glob("*/*.svg")}
        for src in DIAGRAMS.glob("*/src/*.flow.yaml"):
            for name in re.findall(r"\bicon:\s*([a-z0-9-]+)", src.read_text(encoding="utf-8")):
                with self.subTest(diagram=src.name, icon=name):
                    self.assertIn(name, have)


if __name__ == "__main__":
    unittest.main()
