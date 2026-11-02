"""Rollback for a staged enable: write the reviewed PowerShell that puts the tenant back, then verify
from a fresh read that it did.

The kit itself never writes to a tenant. `plan` writes rollback.ps1, which uses Microsoft's Graph
PowerShell cmdlets, in the order the guide's rollback table gives: pause the provisioning jobs (a
paused job keeps its state; never Restart, which purges staged payloads), turn off workflow
scheduling (the workflows and their versions stay, and the emergency leaver can still run on
demand), remove any automatic assignment policy the stage added, and, in the test stage only,
remove the synthetic smoke accounts. Without -Apply the script prints each command and changes
nothing: that is its dry run.

    python deploy/rollback.py plan --settings deploy/settings.test.json --smoke evidence/test/smoke-leaver --out evidence/test/rollback-plan
    pwsh -File evidence/test/rollback-plan/rollback.ps1            # dry run: prints the commands
    pwsh -File evidence/test/rollback-plan/rollback.ps1 -Apply     # runs them
    python deploy/rollback.py verify --settings deploy/settings.test.json --mode tenant --out evidence/test/rollback-verify

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.
Exit codes: 0 written or verified, 2 findings, 1 error or refusal.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
KIT = HERE.parent
sys.path.insert(0, str(KIT / "python"))
sys.path.insert(0, str(HERE))
import deploy_settings as ds  # noqa: E402
import graph_export  # noqa: E402
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, exit_code, finding, read_json, sha256_file, sort_findings, summary_line,
    values, write_output,
)

GUID = re.compile(r"^[0-9a-fA-F-]{36}$")


def _q(value: str) -> str:
    """A single-quoted PowerShell string."""
    return "'" + str(value).replace("'", "''") + "'"


def smoke_accounts(settings: dict[str, Any], smoke: Path) -> list[dict[str, str]]:
    """The synthetic accounts the smoke test created, from its own export, and only those whose
    employeeId matches the scope's person number pattern."""
    if settings["environment"] != "test":
        raise HrlcError("smoke accounts are removed in the test stage only; production keeps every account")
    man = read_json(smoke / "manifest.json")
    if man.get("task") != "deploy-smoke" or man.get("tenantId") != settings["tenantId"]:
        raise HrlcError(f"{smoke} isn't a smoke output for tenant {settings['tenantId']}")
    pattern = settings["scope"].get("personNumberPattern") or ""
    if not pattern:
        raise HrlcError("the settings have no personNumberPattern, so no account can be shown to be synthetic")
    users_file = smoke / "exports" / "users.json"
    if not users_file.exists():
        raise HrlcError(f"{users_file} is missing: plan from a tenant-mode smoke output")
    out = []
    for u in values(read_json(users_file)):
        emp = str(u.get("employeeId", ""))
        if not re.fullmatch(pattern, emp):
            raise HrlcError(f"account {u.get('id')} has employeeId {emp!r}, outside {pattern}; refusing to plan its removal")
        if not GUID.match(str(u.get("id", ""))):
            raise HrlcError(f"account id {u.get('id')!r} isn't an object ID")
        out.append({"id": u["id"], "employeeId": emp, "userPrincipalName": u.get("userPrincipalName", "")})
    return out


def plan(settings: dict[str, Any], smoke: Path | None) -> tuple[list[dict[str, Any]], list[str]]:
    steps: list[dict[str, Any]] = []
    for app in ds.APPS:
        job = settings["provisioning"][app]
        steps.append({"gate": "G2", "say": f"Pause the {app} provisioning job (keeps its state)",
                      "run": f"Suspend-MgServicePrincipalSynchronizationJob -ServicePrincipalId {_q(job['servicePrincipalId'])} -SynchronizationJobId {_q(job['jobId'])}"})
    for key, wid in settings["workflows"].items():
        steps.append({"gate": "G3" if key in ("pre-hire", "day-one") else ("G4" if key == "mover" else "G6"),
                      "say": f"Turn off scheduling for the {key} workflow (stays enabled for on-demand runs)",
                      "run": f"Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId {_q(wid)} -BodyParameter @{{ isSchedulingEnabled = $false }}"})
    for pid in settings.get("automaticAssignmentPolicies", []):
        steps.append({"gate": "G4", "say": f"Remove automatic assignment policy {pid} (keep the dynamic group)",
                      "run": f"Remove-MgEntitlementManagementAssignmentPolicy -AccessPackageAssignmentPolicyId {_q(pid)}"})
    accounts = smoke_accounts(settings, smoke) if smoke else []
    for a in accounts:
        steps.append({"gate": "G2", "say": f"Remove synthetic account {a['employeeId']} (restorable for 30 days)",
                      "run": f"Remove-MgUser -UserId {_q(a['id'])}"})
    scopes = ["Synchronization.ReadWrite.All", "LifecycleWorkflows-Workflow.ReadWrite.All"]
    if settings.get("automaticAssignmentPolicies"):
        scopes.append("EntitlementManagement.ReadWrite.All")
    if accounts:
        scopes.append("User.ReadWrite.All")
    return steps, scopes


def script(settings: dict[str, Any], steps: list[dict[str, Any]], scopes: list[str]) -> str:
    env = ds.MG_ENVIRONMENT[settings["cloud"]]
    lines = [
        f"# Rollback for the {settings['environment']} stage, tenant {settings['tenantId']}, change {settings.get('changeRecord', '')}.",
        "# Written by examples/hr-lifecycle/deploy/rollback.py. Review it, then run it without -Apply (dry run) and with -Apply.",
        "param([switch]$Apply)",
        "$ErrorActionPreference = 'Stop'",
        "$steps = @(",
    ]
    for s in steps:
        lines.append(f"    @{{ Gate = {_q(s['gate'])}; Say = {_q(s['say'])}; Run = {_q(s['run'])} }}")
    lines += [
        ")",
        "if (-not $Apply) {",
        "    foreach ($s in $steps) { \"[dry run] $($s.Gate) $($s.Say)\"; \"    $($s.Run)\" }",
        f"    \"Dry run: {len(steps)} steps, nothing changed. Run again with -Apply to roll back.\"",
        "    return",
        "}",
        f"Connect-MgGraph -Environment {env} -TenantId {_q(settings['tenantId'])} -Scopes {', '.join(_q(x) for x in scopes)} -NoWelcome",
        "foreach ($s in $steps) { \"$($s.Gate) $($s.Say)\"; Invoke-Expression $s.Run }",
        f"\"Rolled back: {len(steps)} steps. Now run rollback.py verify.\"",
    ]
    return "\n".join(lines) + "\n"


def verify(settings: dict[str, Any], exports: Path) -> list[dict[str, Any]]:
    """RB-01: every provisioning job paused. RB-02: no workflow scheduled."""
    rows = []
    for app in ds.APPS:
        job = (values(read_json(exports / "jobs" / app / "sync-job.json")) or [{}])[0]
        code = job.get("status", {}).get("code")
        if code != "Paused":
            rows.append(finding("RB-01", "Finding", app, app, f"job is {code}, not Paused"))
        else:
            rows.append(finding("RB-01", "Info", app, app, "job is Paused"))
    by_id = {w.get("id"): w for w in values(read_json(exports / "deploy-workflows.json"))}
    for key, wid in settings["workflows"].items():
        w = by_id.get(wid, {})
        if w.get("isSchedulingEnabled"):
            rows.append(finding("RB-02", "Finding", key, key, "scheduling is still on"))
        else:
            rows.append(finding("RB-02", "Info", key, key, "scheduling is off"))
    return sort_findings(rows)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("plan", help="write rollback.ps1 and rollback-plan.json")
    p.add_argument("--settings", type=Path, required=True)
    p.add_argument("--smoke", type=Path, help="the last tenant-mode smoke output (test stage: its synthetic accounts are removed)")
    p.add_argument("--out", type=Path, required=True)
    v = sub.add_parser("verify", help="read the tenant and check the rollback took (RB-01, RB-02)")
    v.add_argument("--settings", type=Path, required=True)
    v.add_argument("--mode", required=True, choices=("fixture", "tenant"))
    v.add_argument("--fixture", type=Path)
    v.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        settings = ds.load(args.settings)
        bad = ds.check(settings)
        if bad:
            raise HrlcError(f"the settings file has {len(bad)} findings; run deploy_settings.py check")
        meta = {"environment": settings["environment"], "cloud": settings["cloud"], "tenantId": settings["tenantId"],
                "changeRecord": settings.get("changeRecord"), "settingsSha256": sha256_file(args.settings)}
        if args.cmd == "plan":
            steps, scopes = plan(settings, args.smoke)
            write_output(args.out, "deploy-rollback-plan",
                         {"rollback.ps1": script(settings, steps, scopes),
                          "rollback-plan.json": {"steps": steps, "scopes": scopes}}, meta)
            for s in steps:
                print(f"  {s['gate']}  {s['say']}")
            print(f"Rollback plan, {settings['environment']}: {len(steps)} steps, Graph scopes {', '.join(scopes)}")
            print(f"Written to {(args.out / 'rollback.ps1').as_posix()}; nothing was sent")
            return 0
        if (args.out / "manifest.json").exists():
            raise HrlcError(f"{args.out} already holds a manifest.json; write each run to a new folder")
        if args.mode == "tenant":
            exports = args.out / "exports"
            token = os.environ.get(graph_export.TOKEN_ENV, "")
            graph_export.export("deploy-preflight", settings["cloud"], {}, exports, token)
            for app in ds.APPS:
                job = settings["provisioning"][app]
                graph_export.export("deploy-job", settings["cloud"],
                                    {"servicePrincipalId": job["servicePrincipalId"], "jobId": job["jobId"]},
                                    exports / "jobs" / app, token)
        else:
            if not args.fixture:
                raise HrlcError("--fixture is required with --mode fixture")
            exports = args.fixture
        rows = verify(settings, exports)
        for r in rows:
            print(f"{r['Rule']} {r['Severity']:7} {r['Object']}: {r['Issue']}")
        print(summary_line(f"Rollback verify, {settings['environment']} ({settings['cloud']}, {args.mode})", rows))
        files: dict[str, Any] = {"findings.json": rows}
        if (args.out / "exports").exists():
            for f in sorted((args.out / "exports").rglob("*.json")):
                files[f.relative_to(args.out).as_posix()] = f.read_text(encoding="utf-8")
        write_output(args.out, "deploy-rollback-verify", files, dict(meta, mode=args.mode))
        print(f"Verification written to {args.out.as_posix()}")
        return exit_code(rows)
    except (HrlcError, ValueError, KeyError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
