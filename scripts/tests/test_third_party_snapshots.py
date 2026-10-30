"""Pinned third-party snapshots (examples/third_party/*/snapshot.json) match their files.

A snapshot is an unmodified copy of upstream code at one commit. This test fails when a
file in a snapshot folder is changed, added or removed without regenerating the manifest.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
THIRD_PARTY = ROOT / "examples" / "third_party"
OWN_FILES = {"snapshot.json", "SNAPSHOT.md"}


class Snapshots(unittest.TestCase):
    def manifests(self) -> list[Path]:
        found = sorted(THIRD_PARTY.glob("*/snapshot.json"))
        self.assertTrue(found, "no snapshot.json under examples/third_party")
        return found

    def test_every_file_matches_its_hash_and_none_are_unlisted(self):
        for manifest in self.manifests():
            folder = manifest.parent
            data = json.loads(manifest.read_text(encoding="utf-8"))
            listed = data["files"]
            present = {p.relative_to(folder).as_posix() for p in folder.rglob("*") if p.is_file() and p.name not in OWN_FILES}
            with self.subTest(snapshot=folder.name):
                self.assertEqual(present, set(listed), "files added or removed without updating snapshot.json")
                for rel, meta in listed.items():
                    body = (folder / rel).read_bytes()
                    self.assertEqual(len(body), meta["bytes"], rel)
                    self.assertEqual(hashlib.sha256(body).hexdigest(), meta["sha256"], f"{rel} differs from the pinned upstream copy")

    def test_each_snapshot_names_a_full_commit_a_license_and_its_learn_page(self):
        for manifest in self.manifests():
            data = json.loads(manifest.read_text(encoding="utf-8"))
            with self.subTest(snapshot=manifest.parent.name):
                self.assertRegex(data["commit"], r"^[0-9a-f]{40}$")
                self.assertTrue(data["license"])
                self.assertIn("LICENSE", data["files"])
                self.assertTrue(re.match(r"^https://learn\.microsoft\.com/", data.get("documented_at", "")))


if __name__ == "__main__":
    unittest.main()
