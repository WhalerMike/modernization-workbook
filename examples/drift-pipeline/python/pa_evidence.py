"""Privileged access evidence: compare two evidence runs, draft findings without names, package each
run for the ISSO with a SHA-256 per file and a hash chain, and assemble a period's packages.

Chapter 08 of the developer workbook *Building Privileged Access*. An evidence run is the folder
examples/privileged-access/Invoke-PaEvidenceRun.ps1 writes: run.json, and one folder per task
(inventory, emergency, pim-audit), each with the manifest.json the PowerShell code wrote. This file
adds to drift_pipeline.py and changes none of it: it reuses its hashing, JSON, fingerprint and
refusal helpers, and the same rules (a failed read proves nothing; runs of different tenants are
refused; a package is written once and chained to the one before).

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python pa_evidence.py compare [--previous <run>] --current <run> --out <dir> [--allow-tenant-mismatch]
    python pa_evidence.py issues  --diff <dir>/pa-drift-report.json --out <file> [--include-names]
    python pa_evidence.py package --run <run> --diff <dir>/pa-drift-report.json [--previous-manifest <file>] --out <dir>
    python pa_evidence.py verify  <package>
    python pa_evidence.py period  --evidence <dir> --since <date> --until <date> --out <dir>

Exit codes: 0 no drift (or verified, or a period with every check met), 2 drift (new, changed,
unverified, incidents or a coverage gap; or a period with gaps), 1 error or refusal.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from drift_pipeline import (  # noqa: E402
    EXIT_DRIFT, EXIT_ERROR, EXIT_OK, SUMS, DriftError, dump_json, fingerprint, metadata_from_env,
    read_json, sha256_file, write_text,
)

RUN_SCHEMA = "fmp-pa-run/1"
DIFF_SCHEMA = "fmp-pa-drift/1"
EVIDENCE_SCHEMA = "fmp-pa-evidence/1"
PERIOD_SCHEMA = "fmp-pa-period/1"
EVIDENCE_MANIFEST = "EVIDENCE-MANIFEST.json"
PERIOD_MANIFEST = "PERIOD-MANIFEST.json"
TASKS = {"inventory": "inventory", "emergency-access": "emergency", "pim-audit": "pim-audit"}
STATE_TASKS = ("inventory", "emergency-access")   # findings that describe the tenant's state
COUNTED = ("Finding", "Warn")
TIER_RANK = {"T0": 0, "T1": 1, "T2": 2, "RO": 3, "Unclassified": 4}

# Rule titles for the tracker: fixed text, so an issue never carries a finding's free text (which can
# hold a name). From Chapters 01, 02 and 08.
RULES = {
    "PA-INV-01": "Standing active T0 or T1 privilege outside the documented exceptions",
    "PA-INV-02": "Entra role assigned directly to a user",
    "PA-INV-03": "Role-holding group not named PRV-<tier>-...",
    "PA-INV-04": "Five or more Global Administrators",
    "PA-INV-05": "Role not in the tier map",
    "PA-INV-06": "Eligibility with no end date",
    "PA-INV-07": "User Access Administrator at root scope",
    "PA-INV-08": "More than three subscription Owners",
    "PA-INV-09": "Group member returned with ID and type only",
    "PA-EA-01": "Fewer than two emergency access accounts",
    "PA-EA-02": "Emergency account not on *.onmicrosoft.com",
    "PA-EA-03": "Emergency account synchronized from on-premises",
    "PA-EA-04": "Emergency account disabled",
    "PA-EA-05": "Emergency account not permanent active Global Administrator",
    "PA-EA-06": "Emergency account methods",
    "PA-EA-07": "Emergency account not in the exclusion group",
    "PA-EA-08": "Conditional Access policy doesn't exclude the emergency accounts",
    "PA-EA-09": "Emergency account validation missing or older than 90 days",
    "PA-EA-10": "Exclusion group member that isn't an emergency account",
    "PA-AUD-01": "Role assigned outside PIM",
    "PA-AUD-02": "T0 or T1 activation with no approval record",
    "PA-AUD-03": "Activation approved by its own requester",
    "PA-AUD-04": "Role setting changed in PIM",
}
# Design guidance: the emergency accounts, the Global Administrator count and root-scope elevation are
# Tier 0 objects whatever the row says.
T0_RULES = {"PA-INV-04", "PA-INV-07"} | {f"PA-EA-{i:02d}" for i in range(1, 11)}


def _utc(s: str) -> dt.datetime:
    return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00")).astimezone(dt.timezone.utc)


def _iso(t: dt.datetime) -> str:
    return t.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _rows(value: Any) -> list[dict[str, Any]]:
    """PowerShell's ConvertTo-Json writes a one-item array as an object."""
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def read_rows(path: Path) -> list[dict[str, Any]]:
    """A JSON array written by PowerShell. Piping an empty array to ConvertTo-Json writes nothing, so
    Chapter 01's and Chapter 02's Export-PaRun leaves a file holding only a newline: read it as []."""
    text = Path(path).read_text(encoding="utf-8-sig")
    return _rows(json.loads(text)) if text.strip() else []


# ---------------------------------------------------------------- an evidence run

def load_pa_run(run_dir: Path) -> dict[str, Any]:
    """Read one evidence run and check it: run.json, each task's manifest by its SHA-256, every file
    against its manifest, nothing extra, every request a GET, and one tenant, cloud and mode
    throughout. A task that ended in Error must have no folder."""
    run_dir = Path(run_dir)
    index_path = run_dir / "run.json"
    if not index_path.is_file():
        raise DriftError(f"{run_dir}: no run.json; not a privileged access evidence run")
    index = read_json(index_path)
    if index.get("schema") != RUN_SCHEMA:
        raise DriftError(f"{run_dir}: run.json isn't {RUN_SCHEMA}")
    if index.get("readOnly") is not True:
        raise DriftError(f"{run_dir}: run.json doesn't say the run was read-only")
    tenant = str(index.get("tenantId") or "").strip().lower()
    if not tenant:
        raise DriftError(f"{run_dir}: run.json records no tenant ID")
    allowed = {"run.json"}
    status: dict[str, str] = {}
    messages: dict[str, str] = {}
    data: dict[str, dict[str, Any]] = {}
    for task, folder in TASKS.items():
        entry = (index.get("tasks") or {}).get(task)
        if entry is None:
            status[task] = "not run"
            continue
        if entry.get("folder") != folder:
            raise DriftError(f"{run_dir}: task {task} names folder {entry.get('folder')!r}, expected {folder!r}")
        status[task] = entry.get("status", "")
        tdir = run_dir / folder
        if status[task] != "OK":
            messages[task] = str(entry.get("message", ""))
            if tdir.exists():
                raise DriftError(f"{run_dir}: task {task} ended {status[task]} but left a folder")
            continue
        allowed.add(folder)
        mpath = tdir / "manifest.json"
        if not mpath.is_file():
            raise DriftError(f"{run_dir}: {folder}/manifest.json is missing")
        if sha256_file(mpath) != str(entry.get("manifestSha256", "")).lower():
            raise DriftError(f"{run_dir}: {folder}/manifest.json doesn't match the SHA-256 in run.json")
        m = read_json(mpath)
        if m.get("task") != task:
            raise DriftError(f"{run_dir}: {folder}/manifest.json is for task {m.get('task')!r}")
        for key, want in (("cloud", index.get("cloud")), ("mode", index.get("mode"))):
            if str(m.get(key, "")).lower() != str(want or "").lower():
                raise DriftError(f"{run_dir}: {folder} was read in {key} {m.get(key)!r}, run.json says {want!r}")
        if str(m.get("tenantId") or "").strip().lower() != tenant:
            raise DriftError(f"{run_dir}: {folder} records tenant {m.get('tenantId')!r}, run.json records {index.get('tenantId')!r}")
        listed = dict(m.get("files") or {})
        present = {p.relative_to(tdir).as_posix() for p in tdir.rglob("*") if p.is_file()} - {"manifest.json"}
        if present != set(listed):
            raise DriftError(f"{run_dir}: {folder} files differ from its manifest (extra {sorted(present - set(listed))}, missing {sorted(set(listed) - present)})")
        for rel, digest in listed.items():
            if sha256_file(tdir / rel) != str(digest).lower():
                raise DriftError(f"{run_dir}: {folder}/{rel} doesn't match the SHA-256 in its manifest")
        bad = [r for r in _rows(m.get("requests")) if str(r.get("method", "")).upper() != "GET"]
        if bad:
            raise DriftError(f"{run_dir}: {folder} records a {bad[0].get('method')} request; the evidence run only reads")
        data[task] = {"manifest": m, "findings": read_rows(tdir / "findings.json")}
        if task == "inventory":
            data[task]["rows"] = read_rows(tdir / "inventory.json")
        if task == "pim-audit":
            data[task]["summary"] = read_json(tdir / "summary.json")
            data[task]["requests"] = read_rows(tdir / "requests.json")
    extra = {p.name for p in run_dir.iterdir()} - allowed
    if extra:
        raise DriftError(f"{run_dir}: unexpected entries {sorted(extra)}")
    window = index.get("auditWindow") or {}
    return {
        "path": run_dir, "run_id": index["runId"], "as_of": index["asOf"], "cloud": index["cloud"],
        "mode": index["mode"], "tenant_id": tenant, "window": {"since": window.get("since"), "until": window.get("until")},
        "status": status, "messages": messages, "tasks": data, "run_json_sha256": sha256_file(index_path),
    }


# ---------------------------------------------------------------- tiers, keys and fingerprints

def _max_tier(tiers: list[str]) -> str:
    known = [t for t in tiers if t in TIER_RANK]
    return min(known, key=TIER_RANK.get) if known else "Unclassified"


def finding_tier(task: str, row: dict[str, Any], inventory: list[dict[str, Any]]) -> str:
    """The tier a finding is about. Emergency access rules, the Global Administrator count and
    root-scope elevation are T0 (design guidance). Audit findings carry their tier. Otherwise the
    highest tier of the principal's inventory rows whose role the issue names, then of all its rows."""
    rule = str(row.get("Rule", ""))
    if rule in T0_RULES:
        return "T0"
    if row.get("Tier"):
        return str(row["Tier"])
    oid, issue = str(row.get("ObjectId", "")), str(row.get("Issue", ""))
    mine = [r for r in inventory if str(r.get("PrincipalId", "")) == oid]
    named = [r for r in mine if r.get("RoleName") and str(r["RoleName"]) in issue]
    if named:
        return _max_tier([str(r.get("Tier")) for r in named])
    if mine:
        return _max_tier([str(r.get("Tier")) for r in mine])
    return "Unclassified"


def _entry(task: str, row: dict[str, Any], inventory: list[dict[str, Any]]) -> dict[str, Any]:
    rule = str(row.get("Rule", ""))
    return {
        "task": task, "rule": rule, "title": RULES.get(rule, rule), "severity": str(row.get("Severity", "")),
        "tier": finding_tier(task, row, inventory), "object": str(row.get("Object", "")),
        "object_id": str(row.get("ObjectId", "")), "issue": str(row.get("Issue", "")),
        "fingerprint": fingerprint(rule, str(row.get("ObjectId") or row.get("Object") or ""), str(row.get("Issue", ""))),
    }


def _assignment_key(r: dict[str, Any]) -> tuple[str, ...]:
    return tuple(str(r.get(k) or "") for k in ("Plane", "RoleId", "Scope", "PrincipalId", "Via", "ViaGroupId"))


def _assignment(r: dict[str, Any]) -> dict[str, Any]:
    key = _assignment_key(r)
    return {
        "plane": key[0], "role_id": key[1], "role": str(r.get("RoleName") or ""), "tier": str(r.get("Tier") or "Unclassified"),
        "scope": key[2], "principal_id": key[3], "principal_type": str(r.get("PrincipalType") or ""), "via": key[4],
        "via_group_id": key[5], "state": str(r.get("State") or ""), "end": str(r.get("EndDateTime") or ""),
        "principal": str(r.get("UserPrincipalName") or r.get("PrincipalName") or ""),
        "fingerprint": fingerprint("assignment", "|".join(key), ""),
    }


def _assignments(run: dict[str, Any]) -> dict[tuple[str, ...], dict[str, Any]]:
    """Inventory rows by assignment, without activations: an activation comes and goes within hours,
    and the audit evidence records each one. Drift is a change in what someone holds."""
    rows = run["tasks"]["inventory"]["rows"]
    return {_assignment_key(r): _assignment(r) for r in rows if r.get("State") != "Activated"}


# ---------------------------------------------------------------- compare

def assert_comparable(prev: dict[str, Any], curr: dict[str, Any], allow_tenant_mismatch: bool = False) -> list[str]:
    if str(prev["mode"]).lower() != str(curr["mode"]).lower():
        raise DriftError(f"mode differs: {prev['mode']} then {curr['mode']}; a fixture run is not evidence about a tenant")
    if str(prev["cloud"]).lower() != str(curr["cloud"]).lower():
        raise DriftError(f"cloud differs: {prev['cloud']} then {curr['cloud']}")
    notes = []
    if prev["tenant_id"] != curr["tenant_id"]:
        problem = f"tenant differs: {prev['tenant_id']} then {curr['tenant_id']}"
        if not allow_tenant_mismatch:
            raise DriftError(f"{problem}; compare runs of one tenant, or pass --allow-tenant-mismatch for a reviewed exception")
        notes.append(f"Compared despite a tenant check failure (--allow-tenant-mismatch): {problem}")
    if not _utc(curr["as_of"]) > _utc(prev["as_of"]):
        raise DriftError(f"the current run ({curr['as_of']}) isn't later than the previous one ({prev['as_of']})")
    return notes


def compare_pa(prev: dict[str, Any] | None, curr: dict[str, Any], allow_tenant_mismatch: bool = False) -> dict[str, Any]:
    """Diff two evidence runs by fingerprint.

    State findings (inventory and emergency access) are new, changed, resolved, unchanged or, when
    the task didn't read the tenant this run, unverified. Inventory assignments are added, removed
    or changed. Audit findings are events in this run's window, listed as they are. Any T0 drift, and
    any T0 audit Finding, is an incident (Book 04, Chapter 10: a drift on a Tier 0 object is a
    security incident). A gap between the previous audit window and this one is a coverage gap."""
    report: dict[str, Any] = {
        "schema": DIFF_SCHEMA, "baseline": prev is None,
        "previous": None if prev is None else {"run_id": prev["run_id"], "as_of": prev["as_of"], "run_json_sha256": prev["run_json_sha256"],
                                               "tenant_id": prev["tenant_id"], "window": prev["window"]},
        "current": {"run_id": curr["run_id"], "as_of": curr["as_of"], "run_json_sha256": curr["run_json_sha256"], "mode": curr["mode"],
                    "cloud": curr["cloud"], "tenant_id": curr["tenant_id"], "window": curr["window"], "status": curr["status"]},
        "notes": [], "new": [], "changed": [], "resolved": [], "unchanged": [], "unverified": [],
        "assignments": {"added": [], "removed": [], "changed": []}, "audit": [], "coverage_gaps": [], "incidents": [],
    }
    inv_now = curr["tasks"].get("inventory", {}).get("rows", [])
    inv_before = prev["tasks"].get("inventory", {}).get("rows", []) if prev else []

    if "pim-audit" in curr["tasks"]:
        report["audit"] = [_entry("pim-audit", r, inv_now) for r in curr["tasks"]["pim-audit"]["findings"] if r.get("Severity") in COUNTED]
        report["audit_summary"] = curr["tasks"]["pim-audit"]["summary"]
    else:
        report["unverified"].append({"task": "pim-audit", "reason": curr["status"]["pim-audit"], "message": curr["messages"].get("pim-audit", ""), "findings": []})
        report["coverage_gaps"].append({"since": curr["window"]["since"], "until": curr["window"]["until"], "reason": "the audit read didn't complete"})

    if prev is None:
        for task in STATE_TASKS:
            if task in curr["tasks"]:
                report["new"] += [_entry(task, r, inv_now) for r in curr["tasks"][task]["findings"] if r.get("Severity") in COUNTED]
            else:
                report["unverified"].append({"task": task, "reason": curr["status"][task], "message": curr["messages"].get(task, ""), "findings": []})
        report["notes"].append("No previous run: this run is the baseline. Its findings are recorded, not opened one by one.")
    else:
        report["notes"] += assert_comparable(prev, curr, allow_tenant_mismatch)
        if prev["window"]["until"] and curr["window"]["since"] and _utc(curr["window"]["since"]) > _utc(prev["window"]["until"]):
            report["coverage_gaps"].append({"since": prev["window"]["until"], "until": curr["window"]["since"],
                                            "reason": "no audit window covers this time: activations in it aren't evidenced"})
        for task in STATE_TASKS:
            before = prev["tasks"].get(task)
            p_rows = {}
            if before:
                for r in before["findings"]:
                    if r.get("Severity") in COUNTED:
                        e = _entry(task, r, inv_before)
                        p_rows[(e["rule"], e["object_id"], e["issue"])] = e
            if task not in curr["tasks"]:
                report["unverified"].append({"task": task, "reason": curr["status"][task], "message": curr["messages"].get(task, ""),
                                             "findings": sorted(p_rows.values(), key=lambda e: e["fingerprint"])})
                continue
            c_rows = {}
            for r in curr["tasks"][task]["findings"]:
                if r.get("Severity") in COUNTED:
                    e = _entry(task, r, inv_now)
                    c_rows[(e["rule"], e["object_id"], e["issue"])] = e
            if before is None:
                report["notes"].append(f"{task} didn't read the tenant in the previous run: its findings are compared with nothing and listed as new")
            for k in sorted(set(p_rows) & set(c_rows)):
                if p_rows[k]["severity"] != c_rows[k]["severity"]:
                    report["changed"].append({"before": p_rows[k], "after": c_rows[k]})
                else:
                    report["unchanged"].append(c_rows[k])
            gone = {k: p_rows[k] for k in set(p_rows) - set(c_rows)}
            came = {k: c_rows[k] for k in set(c_rows) - set(p_rows)}
            for rule, oid in sorted({k[:2] for k in gone} & {k[:2] for k in came}):
                g = [k for k in gone if k[:2] == (rule, oid)]
                n = [k for k in came if k[:2] == (rule, oid)]
                if len(g) == 1 and len(n) == 1:
                    report["changed"].append({"before": gone.pop(g[0]), "after": came.pop(n[0])})
            report["resolved"] += [gone[k] for k in sorted(gone)]
            report["new"] += [came[k] for k in sorted(came)]
        if "inventory" in prev["tasks"] and "inventory" in curr["tasks"]:
            a, b = _assignments(prev), _assignments(curr)
            report["assignments"]["added"] = [b[k] for k in sorted(set(b) - set(a))]
            report["assignments"]["removed"] = [a[k] for k in sorted(set(a) - set(b))]
            report["assignments"]["changed"] = [{"before": a[k], "after": b[k]} for k in sorted(set(a) & set(b))
                                                if (a[k]["state"], a[k]["end"]) != (b[k]["state"], b[k]["end"])]
        elif "inventory" in prev["tasks"]:
            report["notes"].append("Assignments weren't compared: the inventory didn't read the tenant this run")

    # Incidents: every Tier 0 drift, and every Tier 0 audit Finding in the window.
    inc = report["incidents"]
    for kind in ("added", "removed"):
        inc += [{"kind": f"assignment {kind}", **x} for x in report["assignments"][kind] if x["tier"] == "T0"]
    inc += [{"kind": "assignment changed", **c["after"], "before_state": c["before"]["state"], "before_end": c["before"]["end"]}
            for c in report["assignments"]["changed"] if "T0" in (c["before"]["tier"], c["after"]["tier"])]
    inc += [{"kind": "finding new", **e} for e in report["new"] if not report["baseline"] and e["tier"] == "T0" and e["severity"] == "Finding"]
    inc += [{"kind": "finding changed", **c["after"]} for c in report["changed"] if c["after"]["tier"] == "T0" and c["after"]["severity"] == "Finding"]
    inc += [{"kind": "audit", **e} for e in report["audit"] if e["tier"] == "T0" and e["severity"] == "Finding"]
    return _finish(report)


def _finish(report: dict[str, Any]) -> dict[str, Any]:
    report["counts"] = {k: len(report[k]) for k in ("new", "changed", "resolved", "unchanged", "unverified", "audit", "coverage_gaps", "incidents")}
    report["counts"].update({f"assignments_{k}": len(v) for k, v in report["assignments"].items()})
    report["drift"] = bool(report["new"] or report["changed"] or report["unverified"] or report["incidents"] or report["coverage_gaps"]
                           or any(report["assignments"].values()) or any(e["severity"] == "Finding" for e in report["audit"]))
    return report


def summary_markdown(report: dict[str, Any]) -> str:
    c, cur = report["counts"], report["current"]
    prev = report["previous"]["run_id"] if report["previous"] else "none (baseline)"
    lines = [
        "# Privileged access drift report", "",
        f"Current run **{cur['run_id']}** ({cur['cloud']}, {cur['mode']}, tenant {cur['tenant_id']}); previous run **{prev}**.",
        f"Audit window {cur['window']['since']} to {cur['window']['until']}.", "",
        f"Incidents (Tier 0) {c['incidents']}. Findings: new {c['new']}, changed {c['changed']}, resolved {c['resolved']}, "
        f"unchanged {c['unchanged']}, unverified tasks {c['unverified']}. Assignments: added {c['assignments_added']}, "
        f"removed {c['assignments_removed']}, changed {c['assignments_changed']}. Audit findings {c['audit']}. Coverage gaps {c['coverage_gaps']}.",
    ]
    if report["notes"]:
        lines += [""] + [f"- {n}" for n in report["notes"]]
    lines += ["", "| Task | Status |", "|---|---|"] + [f"| {t} | {s} |" for t, s in cur["status"].items()]
    if report["incidents"]:
        lines += ["", "| Incident | Rule or role | Tier | Object ID | Fingerprint |", "|---|---|---|---|---|"]
        lines += [f"| {i['kind']} | {i.get('rule') or i.get('role')} | {i['tier']} | {i.get('object_id') or i.get('principal_id')} | {i['fingerprint']} |"
                  for i in report["incidents"]]
    lines += ["", "Names are in pa-drift-report.json, which goes to the evidence store, not to the issue tracker."]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- findings to open, without names

def _ref(report: dict[str, Any]) -> str:
    return f"Evidence: run {report['current']['run_id']}, run.json SHA-256 {report['current']['run_json_sha256']}."


def _finding_body(e: dict[str, Any], include_names: bool, ref: str) -> str:
    lines = [f"Rule: {e['rule']} ({e['title']})", f"Severity: {e['severity']}", f"Tier: {e['tier']}", f"Object ID: {e['object_id']}"]
    if include_names:
        lines += [f"Object: {e['object']}", f"Issue: {e['issue']}"]
    return "\n".join(lines + [f"Fingerprint: {e['fingerprint']}", ref])


def _assignment_body(a: dict[str, Any], include_names: bool, ref: str) -> str:
    lines = [f"Role: {a['role']} ({a['role_id']}), tier {a['tier']}, {a['plane']}", f"Scope: {a['scope']}",
             f"Principal ID: {a['principal_id']} ({a['principal_type']}, via {a['via']}{' ' + a['via_group_id'] if a['via_group_id'] else ''})",
             f"State: {a.get('before_state', '') + ' to ' if a.get('before_state') else ''}{a['state']}"]
    if include_names and a["principal"]:
        lines.append(f"Principal: {a['principal']}")
    return "\n".join(lines + [f"Fingerprint: {a['fingerprint']}", ref])


def issue_drafts_pa(report: dict[str, Any], include_names: bool = False) -> list[dict[str, Any]]:
    """What to open, comment on or close, one entry per fingerprint. Titles use fixed rule titles and
    role names; bodies carry object IDs. A finding's own text and anyone's name stay in the evidence
    store unless include_names is set (design guidance). A baseline opens one summary issue, plus one
    per incident."""
    ref, out = _ref(report), []
    for i in report["incidents"]:
        body = _assignment_body(i, include_names, ref) if i["kind"].startswith("assignment") else _finding_body(i, include_names, ref)
        what = f"{i['rule']} {i['title']}" if i.get("rule") else f"{i['role']} ({i['plane']}, scope {i['scope']})"
        out.append({"action": "open", "fingerprint": i["fingerprint"], "labels": ["drift", "incident", "tier0"],
                    "title": f"[incident] Tier 0 {i['kind']}: {what}", "body": "Treat as a security incident (Book 04, Chapter 10).\n" + body})
    seen = {i["fingerprint"] for i in report["incidents"]}
    if report["baseline"]:
        out.append({"action": "open", "fingerprint": fingerprint("baseline", report["current"]["run_id"], ""), "labels": ["drift", "baseline"],
                    "title": f"[drift] Privileged access baseline recorded: {report['current']['run_id']}",
                    "body": f"First evidence run: {report['counts']['new']} finding(s) recorded as the baseline. {ref}"})
    else:
        for e in report["new"]:
            if e["fingerprint"] not in seen:
                out.append({"action": "open", "fingerprint": e["fingerprint"], "labels": ["drift", "new"],
                            "title": f"[drift] {e['rule']} new: {e['title']}", "body": _finding_body(e, include_names, ref)})
        for ch in report["changed"]:
            a, b = ch["before"], ch["after"]
            if b["fingerprint"] in seen:
                continue
            body = _finding_body(b, include_names, ref) + f"\nWas: {a['severity']} (fingerprint {a['fingerprint']})"
            if a["fingerprint"] == b["fingerprint"]:
                out.append({"action": "comment", "fingerprint": b["fingerprint"], "labels": ["drift", "changed"],
                            "title": f"[drift] {b['rule']} changed: {b['title']}", "body": body})
            else:
                out.append({"action": "open", "fingerprint": b["fingerprint"], "labels": ["drift", "changed"],
                            "title": f"[drift] {b['rule']} changed: {b['title']}", "body": body})
                out.append({"action": "close", "fingerprint": a["fingerprint"], "labels": ["drift"],
                            "title": f"[drift] {a['rule']} superseded", "body": f"Superseded by {b['fingerprint']}. {ref}"})
        # An added assignment keeps the assignment's fingerprint; a removal gets its own, so it
        # opens a record of its own rather than matching the issue the addition opened.
        for kind in ("added", "removed"):
            for x in report["assignments"][kind]:
                if x["fingerprint"] in seen:
                    continue
                if kind == "removed":
                    x = dict(x, fingerprint=fingerprint("removed", x["fingerprint"], ""))
                out.append({"action": "open", "fingerprint": x["fingerprint"], "labels": ["drift", "assignment"],
                            "title": f"[drift] Assignment {kind}: {x['role']} ({x['tier']})", "body": _assignment_body(x, include_names, ref)})
        for c in report["assignments"]["changed"]:
            if c["after"]["fingerprint"] not in seen:
                x = dict(c["after"], before_state=c["before"]["state"])
                out.append({"action": "comment", "fingerprint": x["fingerprint"], "labels": ["drift", "assignment"],
                            "title": f"[drift] Assignment changed: {x['role']} ({x['tier']})", "body": _assignment_body(x, include_names, ref)})
        for e in report["resolved"]:
            out.append({"action": "close", "fingerprint": e["fingerprint"], "labels": ["drift"],
                        "title": f"[drift] {e['rule']} resolved", "body": f"No longer reported by {e['task']} in run {report['current']['run_id']}, which read the tenant. {ref}"})
        # A task that reads again closes its "not verified" issue, if one is open.
        for task in STATE_TASKS + ("pim-audit",):
            if report["current"]["status"].get(task) == "OK":
                out.append({"action": "close", "fingerprint": fingerprint(task, "unverified", ""), "labels": ["drift"],
                            "title": f"[drift] {task} reads again", "body": f"{task} read the tenant in run {report['current']['run_id']}. {ref}"})
    for e in report["audit"]:
        if e["fingerprint"] not in seen:
            out.append({"action": "open", "fingerprint": e["fingerprint"], "labels": ["drift", "audit"],
                        "title": f"[audit] {e['rule']}: {e['title']} ({e['tier']})", "body": _finding_body(e, include_names, ref)})
    for u in report["unverified"]:
        out.append({"action": "open", "fingerprint": fingerprint(u["task"], "unverified", ""), "labels": ["drift", "unverified"],
                    "title": f"[drift] {u['task']} not verified ({u['reason']})",
                    "body": f"{u['task']} ended {u['reason']}. {len(u['findings'])} earlier finding(s) stay open until it reads the tenant again. {ref}"})
    for g in report["coverage_gaps"]:
        out.append({"action": "open", "fingerprint": fingerprint("coverage", g["since"] or "", g["until"] or ""), "labels": ["drift", "coverage"],
                    "title": f"[drift] PIM audit coverage gap {g['since']} to {g['until']}",
                    "body": f"{g['reason']}. Read the gap from the Log Analytics workspace and attach it to the period's evidence. {ref}"})
    return out


# ---------------------------------------------------------------- the evidence package

def package_pa(run_dir: Path, report: dict[str, Any], out_root: Path, previous_manifest: Path | None = None,
               metadata: dict[str, Any] | None = None) -> Path:
    """Write <out_root>/<run-id>/: the run as written (run/), the drift report and summary (drift/),
    EVIDENCE-MANIFEST.json (tenant, window, task status, counts, the previous package's manifest
    hash, a SHA-256 per file) and SHA256SUMS. The same inputs give the same bytes."""
    run = load_pa_run(run_dir)
    if report.get("schema") != DIFF_SCHEMA:
        raise DriftError("not a privileged access drift report")
    if report["current"]["run_id"] != run["run_id"] or report["current"]["run_json_sha256"] != run["run_json_sha256"]:
        raise DriftError("the drift report was made from a different run")
    dest = Path(out_root) / run["run_id"]
    if dest.exists():
        raise DriftError(f"{dest} already exists; an evidence package is written once")
    previous = None
    if previous_manifest is not None:
        prev = read_json(Path(previous_manifest))
        if prev.get("schema") != EVIDENCE_SCHEMA:
            raise DriftError(f"{previous_manifest}: not a privileged access evidence manifest")
        expected = report["previous"]["run_id"] if report["previous"] else None
        if prev["run_id"] != expected:
            raise DriftError(f"the previous package is run {prev['run_id']}, but the drift report compared against {expected}")
        if str(prev.get("tenant_id")) != run["tenant_id"]:
            raise DriftError(f"the previous package is for tenant {prev.get('tenant_id')}, this run for {run['tenant_id']}")
        previous = {"run_id": prev["run_id"], "evidence_manifest_sha256": sha256_file(Path(previous_manifest))}
    elif report["previous"] is not None:
        raise DriftError("the drift report has a previous run; pass its EVIDENCE-MANIFEST.json to chain the packages")

    for p in sorted(Path(run_dir).rglob("*")):
        if p.is_file():
            target = dest / "run" / p.relative_to(run_dir)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(p, target)
    write_text(dest / "drift" / "pa-drift-report.json", dump_json(report))
    write_text(dest / "drift" / "pa-drift-summary.md", summary_markdown(report))
    listed = sorted(p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file())
    manifest = {
        "schema": EVIDENCE_SCHEMA, "run_id": run["run_id"], "as_of": run["as_of"], "cloud": run["cloud"], "tenant_id": run["tenant_id"],
        "mode": run["mode"], "read_only": True, "audit_window": run["window"], "tasks": run["status"], "run_json_sha256": run["run_json_sha256"],
        "metadata": dict(sorted((metadata or {}).items())),
        "drift": {"baseline": report["baseline"], "counts": report["counts"], "drift": report["drift"]},
        "previous": previous,
        "files": [{"path": rel, "bytes": (dest / rel).stat().st_size, "sha256": sha256_file(dest / rel)} for rel in listed],
    }
    write_text(dest / EVIDENCE_MANIFEST, dump_json(manifest))
    write_text(dest / SUMS, "\n".join(f"{sha256_file(dest / rel)}  {rel}" for rel in listed + [EVIDENCE_MANIFEST]) + "\n")
    return dest


def verify_pa(package_dir: Path) -> dict[str, Any]:
    """Check a package as the ISSO would: every file against the manifest and SHA256SUMS, nothing
    extra, and the run inside it against its own run.json and task manifests."""
    package_dir = Path(package_dir)
    mpath = package_dir / EVIDENCE_MANIFEST
    if not mpath.is_file():
        raise DriftError(f"{package_dir}: no {EVIDENCE_MANIFEST}")
    manifest = read_json(mpath)
    if manifest.get("schema") != EVIDENCE_SCHEMA:
        raise DriftError(f"{package_dir}: not a privileged access evidence package")
    listed = {f["path"]: f for f in manifest["files"]}
    present = {p.relative_to(package_dir).as_posix() for p in package_dir.rglob("*") if p.is_file()} - {EVIDENCE_MANIFEST, SUMS}
    if present != set(listed):
        raise DriftError(f"{package_dir}: files differ from the manifest (extra {sorted(present - set(listed))}, missing {sorted(set(listed) - present)})")
    for rel, meta in listed.items():
        if sha256_file(package_dir / rel) != meta["sha256"]:
            raise DriftError(f"{package_dir}: {rel} doesn't match its SHA-256")
    sums = dict(reversed(line.split("  ", 1)) for line in (package_dir / SUMS).read_text(encoding="utf-8").splitlines())
    if set(sums) != set(listed) | {EVIDENCE_MANIFEST}:
        raise DriftError(f"{package_dir}: {SUMS} doesn't list the same files")
    for rel, digest in sums.items():
        if sha256_file(package_dir / rel) != digest:
            raise DriftError(f"{package_dir}: {rel} doesn't match {SUMS}")
    run = load_pa_run(package_dir / "run")
    if run["run_json_sha256"] != manifest["run_json_sha256"] or run["tenant_id"] != manifest["tenant_id"]:
        raise DriftError(f"{package_dir}: the run inside isn't the one the package recorded")
    return {"run_id": manifest["run_id"], "files": len(listed) + 1, "evidence_manifest_sha256": sha256_file(mpath)}


# ---------------------------------------------------------------- a period, for the ISSO

def period(evidence_root: Path, since: str, until: str, out_root: Path) -> tuple[Path, dict[str, Any]]:
    """Assemble a period's evidence (the plan's A4.3 and Gate 4): verify every package whose audit
    window falls in [since, until], check the hash chain between them and that their windows cover
    the period with no gap, and write PERIOD-MANIFEST.json, period-summary.md and SHA256SUMS. The
    packages stay where they are, cited by their manifest hashes. Activations are counted once per
    request across packages."""
    t0, t1 = _utc(since), _utc(until)
    if t1 <= t0:
        raise DriftError("the period ends before it starts")
    pkgs = []
    for m in sorted(Path(evidence_root).glob(f"*/{EVIDENCE_MANIFEST}")):
        man = read_json(m)
        if man.get("schema") != EVIDENCE_SCHEMA:
            continue
        w = man.get("audit_window") or {}
        if not w.get("since") or _utc(w["until"]) <= t0 or _utc(w["since"]) >= t1:
            continue
        verify_pa(m.parent)
        pkgs.append({"dir": m.parent, "manifest": man, "sha256": sha256_file(m)})
    if not pkgs:
        raise DriftError(f"no evidence package in {evidence_root} covers {since} to {until}")
    pkgs.sort(key=lambda p: _utc(p["manifest"]["as_of"]))
    for key in ("tenant_id", "cloud", "mode"):
        values = {str(p["manifest"][key]).lower() for p in pkgs}
        if len(values) != 1:
            raise DriftError(f"the packages differ in {key}: {sorted(values)}")

    breaks, gaps = [], []
    for a, b in zip(pkgs, pkgs[1:]):
        prev = b["manifest"].get("previous") or {}
        if prev.get("run_id") != a["manifest"]["run_id"] or prev.get("evidence_manifest_sha256") != a["sha256"]:
            breaks.append({"run_id": b["manifest"]["run_id"], "expected_previous": a["manifest"]["run_id"], "recorded_previous": prev.get("run_id")})
    cursor = t0
    for p in pkgs:
        w = p["manifest"]["audit_window"]
        if _utc(w["since"]) > cursor:
            gaps.append({"since": _iso(cursor), "until": w["since"]})
        cursor = max(cursor, _utc(w["until"]))
    if cursor < t1:
        gaps.append({"since": _iso(cursor), "until": _iso(t1)})

    requests: dict[str, dict[str, Any]] = {}
    incidents: dict[str, dict[str, Any]] = {}
    unverified, audit_findings = [], {}
    outside = settings = 0
    for p in pkgs:
        report = read_json(p["dir"] / "drift" / "pa-drift-report.json")
        for i in report["incidents"]:
            incidents.setdefault(i["fingerprint"], {"run_id": p["manifest"]["run_id"], "kind": i["kind"], "tier": i["tier"],
                                                    "rule": i.get("rule") or "", "role": i.get("role") or "",
                                                    "object_id": i.get("object_id") or i.get("principal_id"), "fingerprint": i["fingerprint"]})
        for t, s in p["manifest"]["tasks"].items():
            if s != "OK":
                unverified.append({"run_id": p["manifest"]["run_id"], "task": t, "status": s})
        if p["manifest"]["tasks"].get("pim-audit") == "OK":
            adir = p["dir"] / "run" / "pim-audit"
            for r in read_rows(adir / "requests.json"):
                requests[r["RequestId"]] = r
            s = read_json(adir / "summary.json")
            outside += int(s.get("outsidePim", 0))
            settings += int(s.get("settingChanges", 0))
            for f in read_rows(adir / "findings.json"):
                fp = fingerprint(f["Rule"], f["ObjectId"], f["Issue"])
                audit_findings.setdefault(fp, {"rule": f["Rule"], "severity": f["Severity"], "tier": f.get("Tier", ""), "object_id": f["ObjectId"], "fingerprint": fp})

    activated = [r for r in requests.values() if "Activated" in _rows(r.get("States"))]
    by_tier = {t: sum(1 for r in activated if r.get("Tier") == t) for t in TIER_RANK}
    unapproved = [r for r in activated if r.get("Tier") in ("T0", "T1") and "Approved" not in _rows(r.get("States"))]

    last = pkgs[-1]
    last_run = load_pa_run(last["dir"] / "run")
    residual = []
    if "inventory" in last_run["tasks"]:
        for f in last_run["tasks"]["inventory"]["findings"]:
            if f.get("Rule") == "PA-INV-01":
                residual.append({"severity": f["Severity"], "object_id": f["ObjectId"], "issue": f["Issue"],
                                 "on_exceptions_list": f["Severity"] == "Info"})
    emergency = None
    if "emergency-access" in last_run["tasks"]:
        sev = [f.get("Severity") for f in last_run["tasks"]["emergency-access"]["findings"]]
        emergency = {s: sev.count(s) for s in ("Finding", "Warn", "Info")}

    elevation_ok = not gaps and not breaks and not any(u["task"] == "pim-audit" for u in unverified) and not unapproved
    criteria = [
        {"criterion": "Residual standing privilege named with a rationale and accepted by the authorizing official",
         "from_this_code": f"{sum(r['on_exceptions_list'] for r in residual)} on the exceptions list with a reason, "
                           f"{sum(not r['on_exceptions_list'] for r in residual)} outside it (PA-INV-01 at period end)",
         "status": "listed; acceptance is the authorizing official's" if not any(not r["on_exceptions_list"] for r in residual) else "not met: standing privilege outside the exceptions list"},
        {"criterion": "Evidence for every elevation in the period",
         "from_this_code": f"{len(activated)} activation(s); audit coverage gaps {len(gaps)}; chain breaks {len(breaks)}; T0 or T1 activations without approval {len(unapproved)}",
         "status": "evidenced" if elevation_ok else "not met"},
        {"criterion": "Exception register current", "from_this_code": "the exceptions list the inventory read; its currency is the governance office's",
         "status": "not decided by this code"},
        {"criterion": "Access-related GPO settings retired", "from_this_code": "nothing", "status": "not decided by this code"},
    ]
    ok = elevation_ok and not incidents and not unverified and criteria[0]["status"].startswith("listed")
    pid = f"period-{t0.strftime('%Y-%m-%d')}_{t1.strftime('%Y-%m-%d')}"
    dest = Path(out_root) / pid
    if dest.exists():
        raise DriftError(f"{dest} already exists; a period is assembled once")
    manifest = {
        "schema": PERIOD_SCHEMA, "period": {"since": _iso(t0), "until": _iso(t1)},
        "tenant_id": last["manifest"]["tenant_id"], "cloud": last["manifest"]["cloud"], "mode": last["manifest"]["mode"],
        "packages": [{"run_id": p["manifest"]["run_id"], "audit_window": p["manifest"]["audit_window"], "evidence_manifest_sha256": p["sha256"]} for p in pkgs],
        "chain_breaks": breaks, "coverage_gaps": gaps, "unverified": unverified,
        "metrics": {"activations": len(activated), "activations_by_tier": by_tier, "requests": len(requests),
                    "approved": sum("Approved" in _rows(r.get("States")) for r in requests.values()),
                    "denied": sum("Denied" in _rows(r.get("States")) for r in requests.values()),
                    "t0_t1_activations_without_approval": len(unapproved), "outside_pim_events": outside, "setting_changes": settings,
                    "incidents": len(incidents), "audit_findings": len(audit_findings)},
        "incidents": sorted(incidents.values(), key=lambda i: (i["run_id"], i["fingerprint"])),
        "audit_findings": sorted(audit_findings.values(), key=lambda f: (f["rule"], f["fingerprint"])),
        "residual_standing_privilege": residual, "emergency_access_at_period_end": emergency,
        "gate4": criteria, "complete": ok,
    }
    dest.mkdir(parents=True)
    write_text(dest / PERIOD_MANIFEST, dump_json(manifest))
    write_text(dest / "period-summary.md", period_markdown(manifest))
    names = ["period-summary.md", PERIOD_MANIFEST]
    write_text(dest / SUMS, "\n".join(f"{sha256_file(dest / n)}  {n}" for n in names) + "\n")
    return dest, manifest


def period_markdown(m: dict[str, Any]) -> str:
    x = m["metrics"]
    lines = [
        "# Privileged access evidence for the period", "",
        f"Period {m['period']['since']} to {m['period']['until']}; tenant {m['tenant_id']} ({m['cloud']}, {m['mode']}); "
        f"{len(m['packages'])} package(s), chain breaks {len(m['chain_breaks'])}, audit coverage gaps {len(m['coverage_gaps'])}, "
        f"unverified task runs {len(m['unverified'])}.", "",
        f"Activations {x['activations']} (T0 {x['activations_by_tier']['T0']}, T1 {x['activations_by_tier']['T1']}, T2 {x['activations_by_tier']['T2']}); "
        f"requests {x['requests']}, approved {x['approved']}, denied {x['denied']}; T0 or T1 activations without approval "
        f"{x['t0_t1_activations_without_approval']}; role assignments outside PIM {x['outside_pim_events']} event(s); role setting changes "
        f"{x['setting_changes']}; Tier 0 incidents {x['incidents']}.", "",
        "| Gate 4 criterion | From this code | Status |", "|---|---|---|",
    ]
    lines += [f"| {c['criterion']} | {c['from_this_code']} | {c['status']} |" for c in m["gate4"]]
    lines += ["", "| Package | Audit window | EVIDENCE-MANIFEST.json SHA-256 |", "|---|---|---|"]
    lines += [f"| {p['run_id']} | {p['audit_window']['since']} to {p['audit_window']['until']} | `{p['evidence_manifest_sha256']}` |" for p in m["packages"]]
    if m["coverage_gaps"]:
        lines += ["", "Audit coverage gaps: " + "; ".join(f"{g['since']} to {g['until']}" for g in m["coverage_gaps"])]
    lines += ["", "Object IDs only. The packages hold the names, under the evidence store's access control."]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- command line

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("compare", help="diff two evidence runs")
    c.add_argument("--previous", type=Path)
    c.add_argument("--current", type=Path, required=True)
    c.add_argument("--out", type=Path, required=True)
    c.add_argument("--allow-tenant-mismatch", action="store_true")
    i = sub.add_parser("issues", help="draft what to open and close, without names")
    i.add_argument("--diff", type=Path, required=True)
    i.add_argument("--out", type=Path, required=True)
    i.add_argument("--include-names", action="store_true")
    p = sub.add_parser("package", help="write the evidence package")
    p.add_argument("--run", type=Path, required=True)
    p.add_argument("--diff", type=Path, required=True)
    p.add_argument("--previous-manifest", type=Path)
    p.add_argument("--meta-from-env", action="store_true")
    p.add_argument("--out", type=Path, required=True)
    v = sub.add_parser("verify", help="verify an evidence package")
    v.add_argument("package", type=Path)
    q = sub.add_parser("period", help="assemble a period's packages for the ISSO")
    q.add_argument("--evidence", type=Path, required=True)
    q.add_argument("--since", required=True)
    q.add_argument("--until", required=True)
    q.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "compare":
            prev = load_pa_run(args.previous) if args.previous else None
            report = compare_pa(prev, load_pa_run(args.current), args.allow_tenant_mismatch)
            write_text(args.out / "pa-drift-report.json", dump_json(report))
            write_text(args.out / "pa-drift-summary.md", summary_markdown(report))
            print(json.dumps({"baseline": report["baseline"], "counts": report["counts"], "drift": report["drift"]}, sort_keys=True))
            return EXIT_DRIFT if report["drift"] else EXIT_OK
        if args.cmd == "issues":
            drafts = issue_drafts_pa(read_json(args.diff), include_names=args.include_names)
            write_text(args.out, dump_json(drafts))
            print(json.dumps({a: sum(d["action"] == a for d in drafts) for a in ("open", "comment", "close")}, sort_keys=True))
            return EXIT_OK
        if args.cmd == "package":
            meta = metadata_from_env(dict(os.environ)) if args.meta_from_env else {}
            dest = package_pa(args.run, read_json(args.diff), args.out, args.previous_manifest, meta)
            print(json.dumps({"package": dest.name, "evidence_manifest_sha256": sha256_file(dest / EVIDENCE_MANIFEST)}, sort_keys=True))
            return EXIT_OK
        if args.cmd == "verify":
            print(json.dumps(verify_pa(args.package), sort_keys=True))
            return EXIT_OK
        if args.cmd == "period":
            dest, m = period(args.evidence, args.since, args.until, args.out)
            print(json.dumps({"period": dest.name, "complete": m["complete"], "packages": len(m["packages"]),
                              "coverage_gaps": len(m["coverage_gaps"]), "chain_breaks": len(m["chain_breaks"]),
                              "incidents": m["metrics"]["incidents"]}, sort_keys=True))
            return EXIT_OK if m["complete"] else EXIT_DRIFT
    except (DriftError, OSError, ValueError, KeyError) as err:
        print(f"error: {err}", file=sys.stderr)
        return EXIT_ERROR
    return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
