"""Chapter 11's deploy scripts: run their Pester suite (deploy/tests/NpiDeploy.Tests.ps1) from the kit's
pytest suite, so scripts/run_example_tests.py runs it in CI.

The Pester file sits beside the deploy scripts rather than in tests/, because every chapter's Lab 1
runs `Invoke-Pester -Path tests` and prints the count, which scripts/kit_captures.py checks.
A missing pwsh or Pester 5 fails this test rather than skipping it.
"""

import json
import shutil
import subprocess
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
SUITE = KIT / "deploy" / "tests" / "NpiDeploy.Tests.ps1"

RUN = (
    "$ErrorActionPreference = 'Stop'; Import-Module Pester -MinimumVersion 5.0; "
    "$c = New-PesterConfiguration; $c.Run.Path = '{path}'; $c.Run.PassThru = $true; $c.Output.Verbosity = 'None'; "
    "$r = Invoke-Pester -Configuration $c; "
    "@{{ passed = $r.PassedCount; failed = $r.FailedCount; notRun = $r.NotRunCount; "
    "failures = @($r.Failed | ForEach-Object {{ $_.ExpandedName + ': ' + $_.ErrorRecord.Exception.Message }}) }} | ConvertTo-Json -Compress"
)


def test_deploy_pester_suite_passes():
    pwsh = shutil.which("pwsh")
    assert pwsh, "pwsh (PowerShell 7) is required for Chapter 11's deploy tests"
    assert SUITE.is_file(), SUITE
    proc = subprocess.run([pwsh, "-NoProfile", "-NonInteractive", "-Command", RUN.format(path=SUITE.as_posix())],
                          cwd=KIT, capture_output=True, text=True, timeout=1800)
    assert proc.returncode == 0, proc.stderr[-2000:]
    result = json.loads(proc.stdout.strip().splitlines()[-1])
    assert result["failed"] == 0, "\n".join(result["failures"])
    assert result["passed"] >= 55, result
