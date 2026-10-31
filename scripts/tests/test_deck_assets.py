"""Tests for scripts/deck_assets.py: which links are deck links, and the Release URL patterns.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import deck_assets as da  # noqa: E402

PAGE = da.ROOT / "docs" / "presentations" / "index.md"


class TargetPath(unittest.TestCase):
    def test_relative_links_resolve_into_presentations(self):
        self.assertEqual(da.target_path(PAGE, "../../presentations/b02-identity/B02_Identity.pptx"),
                         "presentations/b02-identity/B02_Identity.pptx")
        readme = da.ROOT / "presentations" / "b02-identity" / "README.md"
        self.assertEqual(da.target_path(readme, "B02_Identity_Narrated.pptx"),
                         "presentations/b02-identity/B02_Identity_Narrated.pptx")

    def test_github_file_links_count_and_other_urls_dont(self):
        self.assertEqual(da.target_path(PAGE, f"https://github.com/{da.REPO}/blob/main/presentations/x/X.pptx"),
                         "presentations/x/X.pptx")
        self.assertIsNone(da.target_path(PAGE, f"{da.DOWNLOAD}/edition-2026.10/X.pptx"))
        self.assertIsNone(da.target_path(PAGE, "https://example.com/presentations/X.pptx"))
        self.assertIsNone(da.target_path(PAGE, "../inspiration/slides.pptx"))

    def test_release_and_link_patterns(self):
        m = da.RELEASE.fullmatch(f"{da.DOWNLOAD}/edition-2026.10.1/B02_Identity.pptx")
        self.assertEqual(m.groups(), ("edition-2026.10.1", "B02_Identity.pptx"))
        self.assertIsNone(da.RELEASE.fullmatch(f"{da.DOWNLOAD}/videos-2026-10-23/X.mp4"))
        text = "[Deck](../../presentations/a/A.pptx) · [Watch](watch.html?v=A) · [Other](x.pptx)"
        self.assertEqual(da.DECK_LINK.findall(text), ["../../presentations/a/A.pptx", "x.pptx"])

    def test_zip_names(self):
        self.assertEqual(da.zip_name(Path("presentations/b02-identity/narration_B02_Identity")),
                         "B02_Identity_narration_audio.zip")


if __name__ == "__main__":
    unittest.main()
