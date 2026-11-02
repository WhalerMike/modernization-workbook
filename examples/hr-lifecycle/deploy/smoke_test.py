"""Smoke test for a staged enable: write the synthetic workers' extract for each phase, then check
that the directory, the workflows and the provisioning logs show what the HR records say they should.

The extract goes through examples/hcm-entra like any other run. The check derives what to expect
from an extract (the synthetic one in the test stage, the production feed's in production), so the
same code serves both stages:

    python deploy/smoke_test.py extract --workers deploy/smoke-workers.json --start 2026-11-09 --phase joiner --as-of 2026-11-09 --out evidence/test/smoke-extract-joiner
    python deploy/smoke_test.py check --settings deploy/settings.test.json --extract evidence/test/smoke-extract-joiner/smoke-extract.csv \\
        --phase joiner --as-of 2026-11-09 --since 2026-11-09T00:00:00Z --mode tenant --out evidence/test/smoke-joiner

In tenant mode the check reads Microsoft Graph with the token in HRLC_GRAPH_TOKEN (the calls of task
deploy-smoke in config/calls.json, GET only) and keeps what it read under exports/. In fixture mode
it reads the same layout from --fixture: users.json, results/<workflow key>.json and
provisioning/<app>.json.

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.
Exit codes: 0 every expectation met, 2 findings, 1 error or refusal.
"""
from __future__ import annotations

import argparse
import datetime as dt
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
import evidence as ev  # noqa: E402
import graph_export  # noqa: E402
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, cloud, csv_text, dump_json, exit_code, finding, parse_time, read_csv,
    read_json, sha256_file, sort_findings, summary_line, task_calls, values, write_output, write_text,
)

PHASES = ("joiner", "mover", "leaver", "scope")
EXTRACT_COLUMNS = ["PersonNumber", "AssignmentStatusType", "WorkerType", "FirstName", "LastName", "DisplayName",
                   "JobName", "JobCode", "DepartmentName", "DepartmentCode", "BusinessUnit", "CostCenter",
                   "LegalEmployer", "ManagerPersonNumber", "PositionCategory", "WorkCountry", "HireDate",
                   "TerminationDate", "UtcOffset", "UserName"]
ACTIVE = ("ACTIVE", "SUSPENDED")


# ---------------------------------------------------------------- the synthetic extract

def build_extract(workers: dict[str, Any], start: dt.date, phase: str, as_of: dt.date) -> list[dict[str, str]]:
    """The complete record of every synthetic worker as it stands in this phase. Phases are
    cumulative: the mover stays moved in the leaver phase."""
    if phase not in ("joiner", "mover", "leaver"):
        raise HrlcError("the synthetic extract has three phases: joiner, mover, leaver")
    order = {"joiner": 0, "mover": 1, "leaver": 2}[phase]
    if as_of < start + dt.timedelta(days=order):
        raise HrlcError(f"the {phase} phase runs on {start + dt.timedelta(days=order)} or later (start {start})")
    rows = []
    for w in workers["workers"]:
        row = {c: str(w.get(c, "")) for c in EXTRACT_COLUMNS}
        row["LegalEmployer"] = workers["legalEmployer"]
        row["WorkerType"] = w.get("WorkerType", "E")
        row["WorkCountry"] = w.get("WorkCountry", "US")
        row["DisplayName"] = f"{w['FirstName']} {w['LastName']}"
        row["HireDate"] = (start + dt.timedelta(days=int(w["hireOffsetDays"]))).isoformat()
        row["AssignmentStatusType"] = "ACTIVE"
        if w["role"] == "mover" and order >= 1:
            row.update({k: str(v) for k, v in w["moveTo"].items()})
        if w["role"] == "leaver" and order >= 2:
            row["AssignmentStatusType"] = "INACTIVE"
            row["TerminationDate"] = as_of.isoformat()
        rows.append(row)
    return rows


# ---------------------------------------------------------------- expectations

def in_scope(row: dict[str, str], scope: dict[str, Any]) -> bool:
    pattern = scope.get("personNumberPattern") or ""
    codes = set(scope.get("departmentCodes") or [])
    return bool((pattern and re.fullmatch(pattern, row["PersonNumber"])) or row.get("DepartmentCode") in codes)


def expectations(rows: list[dict[str, str]], previous: list[dict[str, str]] | None, scope: dict[str, Any],
                 as_of: dt.date) -> list[dict[str, Any]]:
    """What the directory and the workflows should show for each in-scope worker on as_of."""
    before = {r["PersonNumber"]: r for r in previous or []}
    out = []
    for r in rows:
        if not in_scope(r, scope):
            continue
        hire = dt.date.fromisoformat(r["HireDate"]) if r.get("HireDate") else None
        term = dt.date.fromisoformat(r["TerminationDate"]) if r.get("TerminationDate") else None
        separated = r["AssignmentStatusType"] not in ACTIVE or (term is not None and term <= as_of)
        enabled = not separated and (hire is None or hire <= as_of)
        workflows = []
        if separated:
            workflows.append("leaver")
        elif hire and hire > as_of:
            workflows.append("pre-hire")
        elif hire and hire == as_of:
            workflows.append("day-one")
        old = before.get(r["PersonNumber"])
        if old and not separated and old.get("DepartmentCode") != r.get("DepartmentCode"):
            workflows.append("mover")
        out.append({"employeeId": r["PersonNumber"], "accountEnabled": enabled, "hireDate": r.get("HireDate", ""),
                    "leaveDate": r.get("TerminationDate", ""), "departmentCode": r.get("DepartmentCode", ""),
                    "app": "contractor" if r.get("WorkerType") in ("C", "CWK") else "employee",
                    "workflows": workflows})
    return out


# ---------------------------------------------------------------- reading the tenant

def _call(call_id: str) -> dict[str, Any]:
    return next(c for c in task_calls("deploy-smoke") if c["id"] == call_id)


def export_tenant(settings: dict[str, Any], expected: list[dict[str, Any]], since: str, out: Path, token: str) -> Path:
    """Read what the check needs into out/exports, one GET per worker, workflow and job."""
    c = cloud(settings["cloud"])
    headers = {"Authorization": f"Bearer {token}"}
    exports = out / "exports"
    users = []
    for e in expected:
        url = graph_export.build_url(_call("smoke-user"), c["graph"], {"employeeId": e["employeeId"]})
        users += graph_export.fetch_all(url, c["graph"], headers, graph_export.urllib.request.urlopen)
    write_text(exports / "users.json", dump_json({"value": users}))
    for key, wid in settings["workflows"].items():
        url = graph_export.build_url(_call("smoke-results"), c["graph"], {"workflowId": wid})
        rows = graph_export.fetch_all(url, c["graph"], headers, graph_export.urllib.request.urlopen)
        write_text(exports / "results" / f"{key}.json", dump_json({"value": rows}))
    for app in ds.APPS:
        url = graph_export.build_url(_call("smoke-provisioning"), c["graph"],
                                     {"jobId": settings["provisioning"][app]["jobId"], "since": since})
        rows = graph_export.fetch_all(url, c["graph"], headers, graph_export.urllib.request.urlopen)
        write_text(exports / "provisioning" / f"{app}.json", dump_json({"value": rows}))
    return exports


def _maybe(path: Path) -> list[dict[str, Any]] | None:
    return values(read_json(path)) if path.exists() else None


# ---------------------------------------------------------------- the check

def same_day(graph_date: str, hr_date: str) -> bool:
    """The HR date against the directory's UTC date. The middleware adds a local time and an offset
    (examples/hcm-entra: hire early in the day, leave late), so the UTC date can be the next day."""
    if not hr_date or not graph_date:
        return not hr_date and not graph_date
    delta = (dt.date.fromisoformat(graph_date) - dt.date.fromisoformat(hr_date)).days
    return delta in (0, 1)


def check(expected: list[dict[str, Any]], exports: Path, settings: dict[str, Any], since: str) -> list[dict[str, Any]]:
    """SM-01 to SM-07."""
    rows: list[dict[str, Any]] = []
    users = values(read_json(exports / "users.json"))
    by_key = {}
    for u in users:
        by_key.setdefault(str(u.get("employeeId", "")), []).append(u)
    in_scope_ids = set()
    since_t = parse_time(since)
    for e in expected:
        key = e["employeeId"]
        found = by_key.get(key, [])
        if len(found) != 1:
            rows.append(finding("SM-01", "Finding", key, key,
                                "no account for this worker" if not found else f"{len(found)} accounts share this employeeId"))
            continue
        u = found[0]
        in_scope_ids.add(u.get("id"))
        if bool(u.get("accountEnabled")) != e["accountEnabled"]:
            rows.append(finding("SM-02", "Finding", key, u.get("userPrincipalName", key),
                                f"accountEnabled is {u.get('accountEnabled')}, expected {e['accountEnabled']}"))
        hire = (u.get("employeeHireDate") or "")[:10]
        if e["hireDate"] and not same_day(hire, e["hireDate"]):
            rows.append(finding("SM-03", "Finding", f"{key}:hire", u.get("userPrincipalName", key),
                                f"employeeHireDate is {hire or 'empty'}, expected {e['hireDate']}"))
        leave = (u.get("employeeLeaveDateTime") or "")[:10]
        if not same_day(leave, e["leaveDate"]):
            rows.append(finding("SM-03", "Finding", f"{key}:leave", u.get("userPrincipalName", key),
                                f"employeeLeaveDateTime is {leave or 'empty'}, expected {e['leaveDate'] or 'empty'}"))
        code = (u.get("onPremisesExtensionAttributes") or {}).get("extensionAttribute10") or ""
        if code != e["departmentCode"]:
            rows.append(finding("SM-03", "Finding", f"{key}:org", u.get("userPrincipalName", key),
                                f"extensionAttribute10 is {code or 'empty'}, expected {e['departmentCode']}"))
        e["_id"] = u.get("id")
    # Workflows: the expected run completed, and nothing ran for anyone outside the scope.
    for key in settings["workflows"]:
        results = _maybe(exports / "results" / f"{key}.json")
        if results is None:
            continue
        recent = [r for r in results if not since_t or (parse_time(r.get("scheduledDateTime")) or since_t) >= since_t]
        done = {(r.get("subject") or {}).get("id") for r in recent if r.get("processingStatus") == "completed"}
        for e in expected:
            if key in e["workflows"] and e.get("_id") and e["_id"] not in done:
                rows.append(finding("SM-04", "Finding", f"{e['employeeId']}:{key}", e["employeeId"],
                                    f"no completed {key} run since {since}"))
        for r in recent:
            sid = (r.get("subject") or {}).get("id")
            if sid and sid not in in_scope_ids:
                rows.append(finding("SM-05", "Finding", f"{key}:{sid}", sid,
                                    f"the {key} workflow processed a user outside the scope"))
    # Provisioning logs: no failure for an in-scope worker, and an entry for each.
    seen: set[str] = set()
    for app in ds.APPS:
        logs = _maybe(exports / "provisioning" / f"{app}.json")
        if logs is None:
            continue
        keys = {e["employeeId"] for e in expected if e["app"] == app}
        for entry in logs:
            src = str((entry.get("sourceIdentity") or {}).get("id", ""))
            status = (entry.get("provisioningStatusInfo") or {}).get("status")
            if src in keys:
                seen.add(src)
                if status == "failure":
                    rows.append(finding("SM-06", "Finding", f"{src}:{entry.get('id')}", src,
                                        f"provisioning {entry.get('provisioningAction')} failed"))
            elif status == "failure":
                rows.append(finding("SM-06", "Warn", f"{app}:{entry.get('id')}", src or app,
                                    "a provisioning failure for a source record outside the scope"))
        for k in sorted(keys - seen):
            rows.append(finding("SM-07", "Warn", f"{k}:log", k, f"no {app} provisioning log entry since {since}"))
    for e in expected:
        e.pop("_id", None)
    return sort_findings(rows)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    x = sub.add_parser("extract", help="write the synthetic workers' extract for one phase")
    x.add_argument("--workers", type=Path, required=True)
    x.add_argument("--start", required=True, help="the joiner phase's date, yyyy-mm-dd")
    x.add_argument("--phase", required=True, choices=PHASES[:3])
    x.add_argument("--as-of", required=True)
    x.add_argument("--out", type=Path, required=True)
    c = sub.add_parser("check", help="check the tenant against an extract (SM-01 to SM-07)")
    c.add_argument("--settings", type=Path, required=True)
    c.add_argument("--extract", type=Path, required=True)
    c.add_argument("--previous-extract", type=Path, help="the extract before this one, to find movers")
    c.add_argument("--phase", required=True, choices=PHASES)
    c.add_argument("--as-of", required=True)
    c.add_argument("--since", required=True, help="the earliest workflow run and log entry to read, ISO 8601")
    c.add_argument("--mode", required=True, choices=("fixture", "tenant"))
    c.add_argument("--fixture", type=Path)
    c.add_argument("--out", type=Path, required=True)
    c.add_argument("--evidence-dir", type=Path, default=ev.DEFAULT_DIR, help="where the step's evidence record goes")
    argv = list(sys.argv[1:] if argv is None else argv)
    args = ap.parse_args(argv)
    try:
        as_of = dt.date.fromisoformat(args.as_of)
        if args.cmd == "extract":
            workers = read_json(args.workers)
            rows = build_extract(workers, dt.date.fromisoformat(args.start), args.phase, as_of)
            write_output(args.out, "deploy-smoke-extract", {"smoke-extract.csv": csv_text(rows, EXTRACT_COLUMNS)},
                         {"phase": args.phase, "start": args.start, "asOf": args.as_of,
                          "workersSha256": sha256_file(args.workers)})
            print(f"Smoke extract, {args.phase} phase, as of {args.as_of}: {len(rows)} synthetic workers")
            for r in rows:
                print(f"  {r['PersonNumber']} {r['AssignmentStatusType']:8} {r['DepartmentCode']}  hire {r['HireDate']}"
                      + (f"  leave {r['TerminationDate']}" if r["TerminationDate"] else ""))
            print(f"Written to {(args.out / 'smoke-extract.csv').as_posix()}; send it with examples/hcm-entra")
            return 0
        settings = ds.load(args.settings)
        bad = ds.check(settings)
        if bad:
            raise HrlcError(f"the settings file has {len(bad)} findings; run deploy_settings.py check")
        if (args.out / "manifest.json").exists():
            raise HrlcError(f"{args.out} already holds a manifest.json; write each run to a new folder")
        rows_in = read_csv(args.extract)
        previous = read_csv(args.previous_extract) if args.previous_extract else None
        expected = expectations(rows_in, previous, settings["scope"], as_of)
        if not expected:
            raise HrlcError("no worker in the extract is in the settings' scope")
        if args.mode == "tenant":
            exports = export_tenant(settings, expected, args.since, args.out, os.environ.get(graph_export.TOKEN_ENV, ""))
        else:
            if not args.fixture:
                raise HrlcError("--fixture is required with --mode fixture")
            exports = args.fixture
        rows = check(expected, exports, settings, args.since)
        for e in expected:
            wf = ", ".join(e["workflows"]) or "none"
            print(f"  expect {e['employeeId']} enabled={str(e['accountEnabled']).lower():5} org={e['departmentCode']}  workflows: {wf}")
        for r in rows:
            print(f"{r['Rule']} {r['Severity']:7} {r['Object']}: {r['Issue']}")
        print(summary_line(f"Smoke {args.phase}, {settings['environment']} ({settings['cloud']}, {args.mode})", rows))
        files: dict[str, Any] = {"expectations.json": expected, "findings.json": rows}
        if (args.out / "exports").exists():
            for p in sorted((args.out / "exports").rglob("*.json")):
                files[p.relative_to(args.out).as_posix()] = p.read_text(encoding="utf-8")
        counts = {s: sum(1 for r in rows if r["Severity"] == s) for s in ("Finding", "Warn", "Info")}
        write_output(args.out, "deploy-smoke", files, {
            "environment": settings["environment"], "cloud": settings["cloud"], "tenantId": settings["tenantId"],
            "changeRecord": settings.get("changeRecord"), "mode": args.mode, "phase": args.phase,
            "asOf": args.as_of, "since": args.since, "extractSha256": sha256_file(args.extract), "counts": counts})
        print(f"Smoke evidence written to {args.out.as_posix()}")
        rec = ev.record(args.evidence_dir, f"smoke-{args.phase}", settings, args.mode, ev.command_line("smoke_test.py", argv), rows, args.out)
        print(f"Evidence record: {rec.as_posix()}")
        return exit_code(rows)
    except (HrlcError, ValueError, KeyError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
