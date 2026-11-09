"""Pre-flight check before a staged enable: the settings, the licenses, the roles behind PIM, the
writer register, the provisioning apps' state and the workflows' schedules, in one read-only run.

"Ready but not running" is what it proves: every piece the runbook needs is there, and nothing has
started. A production run also needs the test stage's smoke evidence, clean, from the same mode.

    python deploy/preflight.py --settings deploy/settings.test.json --mode tenant --out evidence/test/preflight
    python deploy/preflight.py --settings deploy/tests/fixtures/settings.test.json --mode fixture --fixture deploy/tests/fixtures/preflight --out out/ch08/preflight

In tenant mode it reads Microsoft Graph with the token in HRLC_GRAPH_TOKEN (the reader identity's,
GET only, the calls of tasks deploy-preflight and deploy-job in config/calls.json) and keeps what it
read under exports/ in the output folder. In fixture mode it reads the same files from --fixture.

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.
Exit codes: 0 ready, 2 findings, 1 error or refusal.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
KIT = HERE.parent
sys.path.insert(0, str(KIT / "python"))
sys.path.insert(0, str(HERE))
import deploy_settings as ds  # noqa: E402
import evidence as ev  # noqa: E402
import graph_export  # noqa: E402
import writer_register  # noqa: E402
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, exit_code, finding, read_json, sha256_file, sort_findings,
    summary_line, values, write_output,
)

READY_JOB_STATES = ("Paused", "NotRun")


def export_tenant(settings: dict[str, Any], out: Path, token: str) -> Path:
    """Read the tenant into out/exports in the fixture layout. GET only."""
    exports = out / "exports"
    graph_export.export("deploy-preflight", settings["cloud"], {}, exports, token)
    for app in ds.APPS:
        job = settings["provisioning"][app]
        graph_export.export("deploy-job", settings["cloud"],
                            {"servicePrincipalId": job["servicePrincipalId"], "jobId": job["jobId"]},
                            exports / "jobs" / app, token)
    return exports


def _read(folder: Path, name: str) -> list[dict[str, Any]]:
    path = folder / name
    if not path.exists():
        raise HrlcError(f"{path} is missing; export it (tenant mode) or add it to the fixture")
    return values(read_json(path))


def check_licenses(settings: dict[str, Any], skus: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    by_part = {s.get("skuPartNumber"): s for s in skus}
    for need in settings.get("licenses", []):
        part, minimum = need["skuPartNumber"], int(need["minimum"])
        sku = by_part.get(part)
        if not sku:
            rows.append(finding("PF-01", "Finding", part, part, "license not in the tenant's subscriptions"))
            continue
        enabled = int(sku.get("prepaidUnits", {}).get("enabled", 0))
        if sku.get("capabilityStatus") != "Enabled":
            rows.append(finding("PF-01", "Finding", part, part, f"subscription is {sku.get('capabilityStatus')}, not Enabled"))
        elif enabled < minimum:
            rows.append(finding("PF-01", "Finding", part, part, f"{enabled} enabled units, below the {minimum} the scope needs"))
        else:
            rows.append(finding("PF-01", "Info", part, part, f"{enabled} enabled, {sku.get('consumedUnits', 0)} consumed"))
    return rows


def check_roles(settings: dict[str, Any], schedules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for name in settings.get("roles", []):
        template = ds.ROLE_TEMPLATES[name]
        eligible = [s for s in schedules if s.get("roleDefinitionId") == template
                    and s.get("status") == "Provisioned" and s.get("directoryScopeId", "/") == "/"]
        if not eligible:
            rows.append(finding("PF-02", "Finding", template, name, "no one is eligible for this role through PIM"))
        else:
            rows.append(finding("PF-02", "Info", template, name, f"{len(eligible)} eligible through PIM"))
    return rows


def check_register(register: Path) -> list[dict[str, Any]]:
    wr = writer_register.check_register(writer_register.load_register(register))
    bad = [r for r in wr if r["Severity"] == "Finding"]
    if bad:
        return [finding("PF-03", "Finding", str(register.name), register.name,
                        f"the writer register fails its check: {', '.join(sorted({r['Rule'] for r in bad}))}")]
    return [finding("PF-03", "Info", str(register.name), register.name, "the writer register passes WR-01 to WR-09")]


def check_jobs(exports: Path) -> list[dict[str, Any]]:
    rows = []
    for app in ds.APPS:
        jobs = _read(exports / "jobs" / app, "sync-job.json")
        if not jobs:
            rows.append(finding("PF-04", "Finding", app, app, "the provisioning job wasn't found"))
            continue
        job = jobs[0]
        code = job.get("status", {}).get("code")
        if code not in READY_JOB_STATES:
            rows.append(finding("PF-04", "Finding", app, app,
                                f"job is {code}; before a staged enable it must be Paused or NotRun"))
        else:
            rows.append(finding("PF-04", "Info", app, app, f"job is {code}"))
        names = {s.get("name") for s in job.get("synchronizationJobSettings", [])}
        if "QuarantineTooManyDeletesThreshold" not in names:
            rows.append(finding("PF-04", "Warn", f"{app}:delete-threshold", app,
                                "no deletion threshold in the job's settings; confirm Prevent accidental deletions in the admin center"))
    return rows


def check_workflows(settings: dict[str, Any], workflows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    by_id = {w.get("id"): w for w in workflows}
    for key, wid in settings.get("workflows", {}).items():
        label = ds.workflow_label(key)
        w = by_id.get(wid)
        if not w:
            rows.append(finding("PF-05", "Finding", key, label, f"workflow {wid} isn't in the tenant"))
            continue
        if w.get("isSchedulingEnabled"):
            rows.append(finding("PF-05", "Finding", key, label, "scheduling is on; it stays off until the smoke test passes"))
        elif not w.get("isEnabled"):
            rows.append(finding("PF-05", "Warn", key, label, "disabled; enable it (scheduling off) before running it on demand"))
        else:
            rows.append(finding("PF-05", "Info", key, label, f"enabled, scheduling off, version {w.get('version')}"))
    return rows


def check_test_evidence(settings: dict[str, Any], mode: str, evidence: Path | None) -> list[dict[str, Any]]:
    if settings.get("environment") != "production":
        return []
    label = Path(evidence).as_posix() if evidence else "test evidence"
    if not evidence:
        return [finding("PF-06", "Finding", "test-evidence", "test evidence",
                        "production needs the test stage's smoke evidence (--test-evidence)")]
    man_path = Path(evidence) / "manifest.json"
    if not man_path.exists():
        return [finding("PF-06", "Finding", "test-evidence", label, "no manifest.json in the test evidence")]
    man = read_json(man_path)
    problems = []
    if man.get("task") != "deploy-smoke":
        problems.append(f"task is {man.get('task')}, not deploy-smoke")
    if man.get("environment") != "test":
        problems.append(f"environment is {man.get('environment')}, not test")
    if man.get("mode") != mode:
        problems.append(f"mode is {man.get('mode')}, not {mode}")
    if man.get("phase") != "leaver":
        problems.append(f"the last phase is {man.get('phase')}; the smoke test ends with the leaver")
    for name, digest in man.get("files", {}).items():
        if sha256_file(Path(evidence) / name) != digest:
            problems.append(f"{name} doesn't match its manifest")
    counts = man.get("counts", {})
    if counts.get("Finding", 1) or counts.get("Warn", 1):
        problems.append(f"the smoke test has {counts.get('Finding')} Finding and {counts.get('Warn')} Warn")
    if problems:
        return [finding("PF-06", "Finding", "test-evidence", label, "; ".join(problems))]
    return [finding("PF-06", "Info", "test-evidence", label, "the test stage's smoke evidence is clean")]


def run(settings_path: Path, mode: str, out: Path, fixture: Path | None, register: Path,
        evidence: Path | None, token: str = "") -> tuple[list[dict[str, Any]], dict[str, Any]]:
    settings = ds.load(settings_path)
    rows = ds.check(settings)
    if rows:  # a settings problem stops the run before anything is read
        return rows, settings
    if (out / "manifest.json").exists():
        raise HrlcError(f"{out} already holds a manifest.json; write each run to a new folder")
    if mode == "tenant":
        exports = export_tenant(settings, out, token)
    elif mode == "fixture":
        if not fixture:
            raise HrlcError("--fixture is required with --mode fixture")
        exports = Path(fixture)
    else:
        raise HrlcError("--mode must be fixture or tenant")
    rows += check_licenses(settings, _read(exports, "subscribed-skus.json"))
    rows += check_roles(settings, _read(exports, "role-eligibility.json"))
    rows += check_register(register)
    rows += check_jobs(exports)
    rows += check_workflows(settings, _read(exports, "deploy-workflows.json"))
    rows += check_test_evidence(settings, mode, evidence)
    return sort_findings(rows), settings


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--settings", type=Path, required=True)
    ap.add_argument("--mode", required=True, choices=("fixture", "tenant"))
    ap.add_argument("--fixture", type=Path, help="folder of exports in the tenant layout (fixture mode)")
    ap.add_argument("--register", type=Path, default=KIT / "config" / "writer-register.json")
    ap.add_argument("--test-evidence", type=Path, help="the test stage's last smoke output (production only)")
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--evidence-dir", type=Path, default=ev.DEFAULT_DIR, help="where the step's evidence record goes")
    argv = list(sys.argv[1:] if argv is None else argv)
    args = ap.parse_args(argv)
    try:
        rows, settings = run(args.settings, args.mode, args.out, args.fixture, args.register,
                             args.test_evidence, os.environ.get(graph_export.TOKEN_ENV, ""))
        for r in rows:
            print(f"{r['Rule']} {r['Severity']:7} {r['Object']}: {r['Issue']}")
        label = f"Pre-flight {settings.get('environment')} ({settings.get('cloud')}, {args.mode})"
        print(summary_line(label, rows))
        files: dict[str, Any] = {"findings.json": rows}
        exports = args.out / "exports"
        if exports.exists():
            for p in sorted(exports.rglob("*.json")):
                files[p.relative_to(args.out).as_posix()] = p.read_text(encoding="utf-8")
        counts = {s: sum(1 for r in rows if r["Severity"] == s) for s in ("Finding", "Warn", "Info")}
        write_output(args.out, "deploy-preflight", files, {
            "environment": settings.get("environment"), "cloud": settings.get("cloud"),
            "tenantId": settings.get("tenantId"), "changeRecord": settings.get("changeRecord"),
            "mode": args.mode, "settingsSha256": sha256_file(args.settings), "counts": counts})
        print(f"Pre-flight written to {args.out.as_posix()}")
        rec = ev.record(args.evidence_dir, "preflight", settings, args.mode, ev.command_line("preflight.py", argv), rows, args.out)
        print(f"Evidence record: {rec.as_posix()}")
        return exit_code(rows)
    except (HrlcError, ValueError, KeyError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
