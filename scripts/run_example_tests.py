#!/usr/bin/env python3
"""Run the test suites that ship with the example kits in `examples/`.

Each kit keeps its tests under `examples/<kit>/tests/`: Pester files
(`*.Tests.ps1`) and Python files (`test_*.py`, run with pytest, which also
runs unittest cases). A suite runs from its kit's folder, as the kit's README
says to run it. The pull request checks (scripts/check_changed.py) run the
suites of every kit a change touches, and all of them when this script or the
workflow changes.

    python scripts/run_example_tests.py --list                  # the kits and their suites
    python scripts/run_example_tests.py non-person-identity     # one kit
    python scripts/run_example_tests.py --all

Some kits' suites also run when another kit changes, because they test that
kit's output: the drift pipeline's tests read evidence runs that
non-person-identity and privileged-access write (see ALSO).

A few test files exercise Windows-only cmdlets (Get-Acl, Get-WinEvent) and
are left out on other platforms, by name and with the reason printed (see
WINDOWS_ONLY). Everything else runs everywhere. Python never writes
bytecode here, so no `__pycache__` lands in a pinned third-party copy.

Needs pwsh with Pester 5 for the Pester suites, and pytest (plus the packages
the kits import: cryptography, PyYAML, requests) for the Python ones. A
missing pwsh or pytest fails the run rather than skipping it, so a check
never passes for a suite it didn't run.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"

# Kit -> kits whose suites also run when it changes.
ALSO = {
    "non-person-identity": ["drift-pipeline"],
    "privileged-access": ["drift-pipeline"],
}

# Kit -> (test files that need Windows, relative to the kit; why).
WINDOWS_ONLY = {
    "start-kit": (
        ["tests/powershell/ADAssessment.Tests.ps1", "tests/powershell/NpsInventory.Tests.ps1",
         "tests/powershell/SqlEstate.Tests.ps1", "tests/powershell/StartKit.Tests.ps1"],
        "mock Get-Acl and Get-WinEvent, which exist only in Windows PowerShell's modules",
    ),
}

PESTER = (
    "$ErrorActionPreference = 'Stop'; Import-Module Pester -MinimumVersion 5.0; "
    "$c = New-PesterConfiguration; $c.Run.Path = @({paths}); $c.Run.Exit = $true; "
    "$c.Output.Verbosity = 'Normal'; Invoke-Pester -Configuration $c"
)


def suites(kit: str) -> list[tuple[str, str]]:
    """(kind, tests folder relative to the kit) for each suite the kit has: 'pester' or 'pytest'."""
    tests = EXAMPLES / kit / "tests"
    if not tests.is_dir():
        return []
    out = []
    pester = sorted({p.parent for p in tests.rglob("*.Tests.ps1")})
    python = sorted({p.parent for p in tests.rglob("test_*.py")})
    for d in pester:
        out.append(("pester", d.relative_to(EXAMPLES / kit).as_posix()))
    for d in python:
        out.append(("pytest", d.relative_to(EXAMPLES / kit).as_posix()))
    return out


def kits() -> list[str]:
    return sorted(p.name for p in EXAMPLES.iterdir() if p.is_dir() and suites(p.name))


def expand(selected: list[str]) -> list[str]:
    """The selected kits plus the kits that test their output, in a stable order."""
    known = set(kits())
    out = []
    for k in selected:
        for x in [k] + ALSO.get(k, []):
            if x in known and x not in out:
                out.append(x)
    return out


def excluded(kit: str) -> list[str]:
    """The kit's test files to leave out on this platform."""
    return [] if sys.platform == "win32" else WINDOWS_ONLY.get(kit, ([], ""))[0]


def command(kit: str, kind: str, path: str) -> list[str] | None:
    if kind == "pester":
        pwsh = shutil.which("pwsh")
        if not pwsh:
            return None
        if not excluded(kit):
            paths = f"'{path}'"
        else:  # name the files to run, leaving out the Windows-only ones
            skip = set(excluded(kit))
            files = sorted(f.relative_to(EXAMPLES / kit).as_posix() for f in (EXAMPLES / kit / path).glob("*.Tests.ps1"))
            paths = ", ".join(f"'{f}'" for f in files if f not in skip)
        return [pwsh, "-NoProfile", "-NonInteractive", "-Command", PESTER.format(paths=paths)]
    return [sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", path]


def run(selected: list[str]) -> int:
    actions = "GITHUB_ACTIONS" in os.environ  # fold each suite's output in the log
    failed = []
    for kit in expand(selected):
        skip = excluded(kit)
        if skip:
            print(f"{kit}: left out on {sys.platform}, because they {WINDOWS_ONLY[kit][1]}: {', '.join(skip)}", flush=True)
        for kind, path in suites(kit):
            name = f"{kit}: {path} ({kind})"
            cmd = command(kit, kind, path)
            print(f"::group::{name}" if actions else f"== {name}", flush=True)
            start = time.monotonic()
            if cmd is None:
                code = 127
                print("pwsh not found", flush=True)
            else:
                code = subprocess.run(cmd, cwd=EXAMPLES / kit, env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}).returncode
            took = round(time.monotonic() - start)
            if actions:
                print("::endgroup::", flush=True)
            print(f"{'pass' if code == 0 else 'FAIL'}  {name}  {took} s", flush=True)
            if code != 0:
                failed.append(f"{name}: exit {code}")
    if failed:
        print("\nFailed suites:\n  " + "\n  ".join(failed))
        return 1
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Run the example kits' test suites.")
    ap.add_argument("kits", nargs="*", help="kit folder names under examples/")
    ap.add_argument("--all", action="store_true", help="every kit that has tests")
    ap.add_argument("--list", action="store_true", help="list the kits and their suites")
    args = ap.parse_args()
    if args.list:
        for k in kits():
            print(f"{k}: " + ", ".join(f"{p} ({kind})" for kind, p in suites(k)))
        return 0
    unknown = [k for k in args.kits if k not in kits()]
    if unknown:
        ap.error(f"no tests for: {', '.join(unknown)}")
    selected = kits() if args.all else args.kits
    if not selected:
        ap.error("name a kit, or pass --all or --list")
    return run(selected)


if __name__ == "__main__":
    raise SystemExit(main())
