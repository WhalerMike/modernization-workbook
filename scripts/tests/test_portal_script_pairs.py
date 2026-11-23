"""Every Learn image in the guides is in data/portal-script-pairs.yml, each pair's capture, script and
requirements check out, and the Portal | PowerShell tabs in the guides match the data.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import portal_script_pairs as psp  # noqa: E402


class PortalScriptPairs(unittest.TestCase):
    def test_pairs_are_valid(self):
        problems = psp.validate(psp.load())
        self.assertEqual(problems, [], "\n".join(problems))

    def test_pages_match_the_data(self):
        problems = psp.write_pages(psp.load(), check=True)
        self.assertEqual(problems, [], "\n".join(problems))

    def test_shown_commands_drop_prompts(self):
        self.assertEqual(psp.shown_commands("PS> Get-X\n>>   -Y\nout\n"), ("Get-X\n  -Y", "powershell"))
        self.assertEqual(psp.shown_commands("$ ls\nfile\n")[1], "bash")


if __name__ == "__main__":
    unittest.main()
