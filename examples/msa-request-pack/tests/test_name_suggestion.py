"""The name suggester runs in Windows PowerShell 5.1 as well as PowerShell 7 (the Pester suite runs in pwsh with the
pack's other tests). On Windows, where powershell.exe exists, this runs tests/MsaNameSuggestion.Tests.ps1 in 5.1 too,
with whichever Pester 5 the machine has; elsewhere, or with no Pester 5 for 5.1, it's skipped, because 5.1 is Windows-only.
"""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

PACK = Path(__file__).resolve().parents[1]
SUITE = PACK / "tests" / "MsaNameSuggestion.Tests.ps1"

FIND = ("$m = @(Get-Module -ListAvailable Pester | Where-Object { $_.Version.Major -ge 5 } | Sort-Object Version -Descending); "
        "if ($m.Count) { $m[0].Path }")
RUN = (
    "$ErrorActionPreference = 'Stop'; Import-Module '{pester}'; "
    "$c = New-PesterConfiguration; $c.Run.Path = '{path}'; $c.Run.PassThru = $true; $c.Output.Verbosity = 'None'; "
    "$r = Invoke-Pester -Configuration $c; "
    "@{{ edition = $PSVersionTable.PSEdition; passed = $r.PassedCount; failed = $r.FailedCount; "
    "failures = @($r.Failed | ForEach-Object {{ $_.ExpandedName + ': ' + $_.ErrorRecord.Exception.Message }}) }} | ConvertTo-Json -Compress"
)


def test_name_suggestion_in_windows_powershell_5_1():
    ps51 = shutil.which("powershell.exe") or shutil.which("powershell")
    pwsh = shutil.which("pwsh")
    if not ps51 or not pwsh:
        pytest.skip("Windows PowerShell 5.1 runs only on Windows")
    found = subprocess.run([pwsh, "-NoProfile", "-NonInteractive", "-Command", FIND], capture_output=True, text=True, timeout=120)
    pester = found.stdout.strip().splitlines()[-1] if found.stdout.strip() else ""
    if not pester:
        pytest.skip("no Pester 5 on this machine")
    proc = subprocess.run([ps51, "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command",
                           RUN.format(pester=pester.replace("'", "''"), path=SUITE.as_posix())],
                          cwd=PACK, capture_output=True, text=True, timeout=900)
    assert proc.returncode == 0, proc.stderr[-2000:]
    result = json.loads(proc.stdout.strip().splitlines()[-1])
    assert result["edition"] == "Desktop", result
    assert result["failed"] == 0, "\n".join(result["failures"])
    assert result["passed"] >= 10, result
