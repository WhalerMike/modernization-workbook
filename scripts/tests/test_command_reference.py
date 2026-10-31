"""Tests for scripts/command_reference.py: finding commands, reading their help, the page.

Temporary fixture kits only: no PowerShell, no Quarto.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import command_reference as cr  # noqa: E402

MODULE = textwrap.dedent('''\
    # Not dot-sourced, only mentioned: Invoke-Kit.ps1 stays a script.
    . (Join-Path $PSScriptRoot 'Part.ps1')

    function Get-Documented {
        <#
        .SYNOPSIS
            Reads the thing.
        .EXAMPLE
            Get-Documented -Path tests/fixtures/x.json
        #>
        [CmdletBinding()]
        param([string]$Path)
    }

    <#
    .SYNOPSIS
        Help placed before the function.
    .EXAMPLE
        Set-Before -Name a
    #>
    function Set-Before {
        param($Name)
    }

    function Test-NoExample {
        <#
        .SYNOPSIS
            Has a synopsis but no example.
        #>
        param()
    }

    function Get-Bare { param() }

    function Get-Hidden {
        <#
        .SYNOPSIS
            Not exported.
        #>
        param()
    }

    Export-ModuleMember -Function Get-Documented, Set-Before,
        Test-NoExample, Get-Bare
    ''')

SCRIPT = textwrap.dedent('''\
    #Requires -Version 7.1
    <#
    .SYNOPSIS
        Runs the kit.
    .EXAMPLE
        ./Invoke-Kit.ps1 -OutputPath out
    #>
    [CmdletBinding()]
    param([string]$OutputPath)
    ''')

PYTOOL = textwrap.dedent('''\
    #!/usr/bin/env python3
    """Collects evidence from a fixture.

    Examples:
      python tool.py --fixture tests/fixtures/f.json
    """
    import argparse

    if __name__ == "__main__":
        argparse.ArgumentParser().parse_args()
    ''')

PYLIB = '"""A helper module, not a tool."""\nX = 1\n'


class Fixture(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        kit = self.root / "examples" / "demo"
        (kit / "powershell" / "Demo").mkdir(parents=True)
        (kit / "powershell" / "Demo" / "Demo.psm1").write_text(MODULE, encoding="utf-8")
        (kit / "powershell" / "Demo" / "Part.ps1").write_text(
            "function Get-FromPart {\n    <#\n    .SYNOPSIS\n        From a dot-sourced part.\n"
            "    .EXAMPLE\n        Get-FromPart\n    #>\n    param()\n}\n", encoding="utf-8")
        (kit / "Invoke-Kit.ps1").write_text(SCRIPT, encoding="utf-8")
        (kit / "tool.py").write_text(PYTOOL, encoding="utf-8")
        (kit / "lib.py").write_text(PYLIB, encoding="utf-8")
        (kit / "tests").mkdir()
        (kit / "tests" / "Demo.Tests.ps1").write_text("Describe 'x' {}\n", encoding="utf-8")
        (kit / "tests" / "make.py").write_text(PYTOOL, encoding="utf-8")
        (self.root / "examples" / "third_party" / "sample").mkdir(parents=True)
        (self.root / "examples" / "third_party" / "sample" / "x.ps1").write_text(SCRIPT, encoding="utf-8")
        self.cmds = {c.name: c for c in cr.scan(self.root / "examples", self.root)}

    def tearDown(self) -> None:
        self.tmp.cleanup()


class ScanTests(Fixture):
    def test_finds_exported_functions_scripts_and_tools_only(self):
        self.assertEqual(sorted(self.cmds), sorted([
            "Get-Documented", "Set-Before", "Test-NoExample", "Get-Bare", "Invoke-Kit.ps1", "tool.py"]))

    def test_parts_a_module_dot_sources_are_not_scripts(self):
        self.assertNotIn("Part.ps1", self.cmds)

    def test_help_inside_and_before_the_function(self):
        self.assertEqual(self.cmds["Get-Documented"].synopsis, "Reads the thing.")
        self.assertTrue(self.cmds["Get-Documented"].has_example)
        self.assertEqual(self.cmds["Set-Before"].synopsis, "Help placed before the function.")
        self.assertTrue(self.cmds["Set-Before"].has_example)

    def test_missing_parts_are_reported(self):
        gaps = {c.name: g for c, g in cr.missing(list(self.cmds.values()))}
        self.assertEqual(gaps, {"Test-NoExample": ["example"], "Get-Bare": ["synopsis", "example"]})

    def test_script_and_python_help(self):
        self.assertEqual(self.cmds["Invoke-Kit.ps1"].synopsis, "Runs the kit.")
        self.assertTrue(self.cmds["Invoke-Kit.ps1"].has_example)
        self.assertEqual(self.cmds["tool.py"].synopsis, "Collects evidence from a fixture.")
        self.assertTrue(self.cmds["tool.py"].has_example)

    def test_a_block_powershell_would_drop_counts_as_no_help(self):
        block = ".SYNOPSIS\n    Reads it.\n.DESCRIPTION\n    Recorded in\n    .Calls on the object.\n.EXAMPLE\n    Get-X\n"
        self.assertEqual(cr.parse_help(block), ("", False))
        kept = ".SYNOPSIS\n    The key under\n    .attributes, else empty.\n.EXAMPLE\n    Get-X\n"
        self.assertEqual(cr.parse_help(kept), ("The key under .attributes, else empty.", True))
        self.assertEqual(cr.parse_help(".synopsis\n    Lower case works.\n.example\n    Get-X\n"),
                         ("Lower case works.", True))

    def test_python_without_a_run_line_has_no_example(self):
        self.assertEqual(cr.python_help('"""Does a thing.\n\nNo usage here.\n"""\n'), ("Does a thing.", False))


class ExportTests(unittest.TestCase):
    def test_manifest_exports_functions_defined_in_parts(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            mod = root / "examples" / "k" / "powershell" / "M"
            mod.mkdir(parents=True)
            (mod / "M.psm1").write_text(". $PSScriptRoot/Checks.ps1\n", encoding="utf-8")
            (mod / "M.psd1").write_text("@{ FunctionsToExport = @('Invoke-Check01') }\n", encoding="utf-8")
            (mod / "Checks.ps1").write_text(
                "function Invoke-Check01 {\n    <#\n    .SYNOPSIS\n        Check one.\n    .EXAMPLE\n"
                "        Invoke-Check01\n    #>\n    param()\n}\nfunction Get-Private { }\n", encoding="utf-8")
            cmds = cr.scan(root / "examples", root)
            self.assertEqual([c.name for c in cmds], ["Invoke-Check01"])
            self.assertEqual(cmds[0].synopsis, "Check one.")
            self.assertTrue(cmds[0].path.endswith("Checks.ps1"))

    def test_a_module_without_an_export_list_exports_everything(self):
        text = "function Get-A { }\nfunction Get-B { }\n"
        self.assertEqual(cr.exported_functions(Path("x.psm1"), text), ["Get-A", "Get-B"])


class PageTests(Fixture):
    def test_page_lists_every_command_and_escapes_pipes(self):
        cmds = list(self.cmds.values())
        cmds[0].synopsis = "a | b"
        text = cr.render(cmds)
        for name in self.cmds:
            self.assertIn(f"`{name}`", text)
        self.assertIn("a \\| b", text)
        self.assertIn("## demo {#kit-demo}", text)
        self.assertIn("*No synopsis yet.*", text)

    def test_taught_in_prefers_developer_workbooks(self):
        docs = self.root / "docs"
        for rel, title in (("books/b01/02-x.md", "Book chapter"),
                           ("project-plans/developer-workbooks/w/03-y.md", "Workbook chapter"),
                           ("books/b01/_verification/02-x.md", "Log")):
            p = docs / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(f"# {title}\n\nRun `Get-Documented` then `tool.py`.\n", encoding="utf-8")
        cmds = list(self.cmds.values())
        cr.link_chapters(cmds, docs, self.root)
        got = {c.name: [t for _, t in c.taught_in] for c in cmds}
        self.assertEqual(got["Get-Documented"], ["Workbook chapter", "Book chapter"])
        self.assertEqual(got["tool.py"], ["Workbook chapter", "Book chapter"])
        self.assertEqual(got["Get-Bare"], [])


if __name__ == "__main__":
    unittest.main()
