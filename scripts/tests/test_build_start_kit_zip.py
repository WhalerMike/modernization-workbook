"""The all-kits zip lays out every kit zip exactly.

The Downloads page's unzip command reads fmw-kit-layout.json from fmw-all-kits.zip and copies its
folders into C:\\FMWLabs\\<zip name>, so a lab finds the same files whether the reader downloaded the
one zip with every kit or the kit's own zip. These tests hold the layout to the kit zips themselves.
"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build_start_kit_zip as bz  # noqa: E402


def read(path: Path) -> dict[str, bytes]:
    with zipfile.ZipFile(path) as zf:
        return {n: zf.read(n) for n in zf.namelist() if not n.endswith("/")}


class KitLayoutTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        out = Path(cls.tmp.name)
        cls.all_kits = read(bz.build(out, "all-kits"))
        cls.kits = {bz.ZIP_NAMES.get(k, k): read(bz.build(out, k)) for k in bz.KITS if k != "all-kits"}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_layout_names_every_kit_zip(self):
        layout = json.loads(self.all_kits[bz.LAYOUT_FILE])
        self.assertEqual(sorted(layout), sorted(self.kits))

    def test_layout_gives_each_kit_zip_byte_for_byte(self):
        layout = json.loads(self.all_kits[bz.LAYOUT_FILE])
        for zip_name, spec in layout.items():
            if "contents" in spec:
                prefix = spec["contents"] + "/"
                got = {n[len(prefix):]: b for n, b in self.all_kits.items() if n.startswith(prefix)}
            else:
                got = {n: b for n, b in self.all_kits.items()
                       if any(n.startswith(f + "/") for f in spec["folders"])}
            with self.subTest(zip=zip_name):
                self.assertEqual(sorted(got), sorted(self.kits[zip_name]))
                self.assertEqual(got, self.kits[zip_name])

    def test_no_kit_zip_has_a_folder_of_its_own_name_around_it(self):
        for zip_name, files in self.kits.items():
            tops = {n.split("/")[0] for n in files}
            with self.subTest(zip=zip_name):
                self.assertNotEqual(tops, {zip_name})


if __name__ == "__main__":
    unittest.main()
