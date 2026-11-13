"""Read-only Azure Arc and Azure Policy checks through Azure Resource Graph, for the workbook's Module 4.

Each task is two parts, as in entra_tasks.py and intune_tasks.py: a fetch (Resource Graph
queries, through armkit.ArmClient, needing only the Reader role) and a pure `evaluate_*`
function that turns the rows into findings. The tests run the evaluate functions against
fixtures; the PowerShell module FmwArm.psm1 implements the same rules and is tested
against the same fixtures and expected results.

    python arc_tasks.py --cloud gcc --tenant <id> --client <id> --cert app.pem arc-extensions
    python arc_tasks.py ... arc-private-link
    python arc_tasks.py ... lifecycle --window-days 180
    python arc_tasks.py ... sql-inventory
    python arc_tasks.py ... policy-summary
    python arc_tasks.py --from-json ../tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z lifecycle

Add --subscription ID (repeatable) to limit the scope; without it, the tasks query every
subscription the identity can see. Add --from-json FILE to evaluate saved query rows
instead of calling Azure. Every task only reads. Nothing here writes to Azure, and no
query reads an extension's settings, which can hold commands and configuration.

These checks complement the validation kit's VK-ARC-01 to VK-ARC-07 (tags, agent status
and version, baseline compliance per server, CMDB coverage, Update Manager scoping, role
assignments, two tools on one setting). They read other things: extension health, the
network path, product lifecycle, SQL Server inventory, and policy assignments' state.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from armkit import ArmClient, load_arm_calls  # noqa: E402
from entra_tasks import iso, parse_time  # noqa: E402
from graphkit import CLOUDS, azure_identity_provider  # noqa: E402

LIFECYCLE_FILE = Path(__file__).resolve().parents[1] / "arc-lifecycle.json"

# The federal requirement each task evidences (the program's mapping; see the Module 4 page).
# Every control is in the NIST SP 800-53 Rev. 5 Moderate baseline.
EVIDENCES = {
    "arc-extensions": ["NIST SP 800-53 SI-4", "NIST SP 800-53 SI-3", "NIST SP 800-53 AU-12", "NIST SP 800-53 CM-8"],
    "arc-private-link": ["NIST SP 800-53 SC-7"],
    "lifecycle": ["NIST SP 800-53 SA-22", "NIST SP 800-53 SI-2"],
    "sql-inventory": ["NIST SP 800-53 CM-8", "NIST SP 800-53 CM-8(1)"],
    "policy-summary": ["NIST SP 800-53 CA-7", "NIST SP 800-53 CM-6", "NIST SP 800-53 CM-2"],
}

# The Resource Graph queries. Each projects a string `id` so paging works (a page of only
# dynamic or null columns can't be paged), none uses take or limit, and each ends sorted by a
# unique column, as Learn's pagination guidance advises, so pages don't repeat or skip rows.
Q_MACHINES = """resources
| where type =~ 'microsoft.hybridcompute/machines'
| project id = tolower(id), name, subscriptionId, resourceGroup,
    status = tostring(properties.status), osType = tostring(properties.osType),
    osName = tostring(properties.osName), osSku = tostring(properties.osSku), osVersion = tostring(properties.osVersion),
    privateLinkScopeResourceId = tostring(properties.privateLinkScopeResourceId),
    esuEligibility = tostring(properties.licenseProfile.esuProfile.esuEligibility),
    esuAssignment = tostring(properties.licenseProfile.esuProfile.licenseAssignmentState)
| order by id asc"""
Q_EXTENSIONS = """resources
| where type =~ 'microsoft.hybridcompute/machines/extensions'
| project id = tolower(id), machineId = tolower(substring(id, 0, indexof(id, '/extensions'))), name,
    publisher = tostring(properties.publisher), extensionType = tostring(properties.type),
    provisioningState = tostring(properties.provisioningState), version = tostring(properties.typeHandlerVersion)
| order by id asc"""
Q_SQL = """resources
| where type =~ 'microsoft.azurearcdata/sqlserverinstances'
| project id = tolower(id), name, version = tostring(properties.version), edition = tostring(properties.edition),
    status = tostring(properties.status), hostId = tolower(tostring(properties.containerResourceId)),
    licenseType = tostring(properties.licenseType), currentVersion = tostring(properties.currentVersion)
| order by id asc"""
Q_ASSIGNMENTS = """policyresources
| where type =~ 'microsoft.authorization/policyassignments'
| project id = tolower(id), name, displayName = tostring(properties.displayName),
    enforcementMode = tostring(properties.enforcementMode), scope = tostring(properties.scope)
| order by id asc"""
Q_POLICY_STATES = """policyresources
| where type =~ 'microsoft.policyinsights/policystates'
| extend assignmentId = tolower(tostring(properties.policyAssignmentId)), state = tostring(properties.complianceState)
| summarize nonCompliant = countif(state =~ 'NonCompliant'), compliant = countif(state =~ 'Compliant'),
    exempt = countif(state =~ 'Exempt'), total = count() by assignmentId
| order by assignmentId asc"""

QUERIES = {
    "arc-extensions": {"machines": Q_MACHINES, "extensions": Q_EXTENSIONS},
    "arc-private-link": {"machines": Q_MACHINES},
    "lifecycle": {"machines": Q_MACHINES, "sqlInstances": Q_SQL},
    "sql-inventory": {"machines": Q_MACHINES, "sqlInstances": Q_SQL},
    "policy-summary": {"assignments": Q_ASSIGNMENTS, "policyStates": Q_POLICY_STATES},
}

# Extensions the program requires on every Arc server, as publisher/type, per osType. Each
# inner list is "any one of". Azure Monitor Agent (AU-12) and Defender for Endpoint (SI-3, SI-4).
DEFAULT_REQUIRED = {
    "windows": [["Microsoft.Azure.Monitor/AzureMonitorWindowsAgent"], ["Microsoft.Azure.AzureDefenderForServers/MDE.Windows"]],
    "linux": [["Microsoft.Azure.Monitor/AzureMonitorLinuxAgent"], ["Microsoft.Azure.AzureDefenderForServers/MDE.Linux"]],
}


def _scope_note(machines: list[dict]) -> dict:
    """Resource Graph returns nothing for resources the caller can't read, so an empty result
    can't be told from no access. Say so instead of reporting a clean result."""
    return {"machinesInScope": len(machines), "emptyScope": not machines}


# ------------------------------------------------------------ arc-extensions


def evaluate_extensions(machines: list[dict], extensions: list[dict], required: dict | None = None) -> dict:
    """Machines missing a required extension, and extensions not in the Succeeded state."""
    required = required or DEFAULT_REQUIRED
    by_machine: dict[str, list[dict]] = {}
    for e in extensions:
        by_machine.setdefault(e["machineId"], []).append(e)
    findings, unhealthy = [], []
    for m in sorted(machines, key=lambda m: m["name"].lower()):
        exts = by_machine.get(m["id"], [])
        have = {f"{e.get('publisher', '')}/{e.get('extensionType', '')}".lower() for e in exts}
        missing = [" or ".join(group) for group in required.get(m.get("osType", "").lower(), []) if not any(g.lower() in have for g in group)]
        bad = [
            {"extension": f"{e.get('publisher', '')}/{e.get('extensionType', '')}", "provisioningState": e.get("provisioningState", ""), "version": e.get("version", "")}
            for e in sorted(exts, key=lambda e: e["name"].lower())
            if e.get("provisioningState") != "Succeeded"
        ]
        if missing or bad:
            findings.append({"id": m["id"], "name": m["name"], "osType": m.get("osType", ""), "status": m.get("status", ""), "missing": missing, "notSucceeded": bad})
        unhealthy += bad
    return {
        **_scope_note(machines),
        "machinesWithFindings": len(findings),
        "missingRequired": sum(1 for f in findings if f["missing"]),
        "extensionsNotSucceeded": len(unhealthy),
        "findings": findings,
    }


# ------------------------------------------------------------ arc-private-link


def evaluate_private_link(machines: list[dict]) -> dict:
    """Machines not assigned to an Azure Arc private link scope, so they reach Azure over the public endpoints."""
    public = [
        {"id": m["id"], "name": m["name"], "subscriptionId": m.get("subscriptionId", ""), "resourceGroup": m.get("resourceGroup", "")}
        for m in sorted(machines, key=lambda m: m["name"].lower())
        if not m.get("privateLinkScopeResourceId")
    ]
    scopes = Counter(m["privateLinkScopeResourceId"].lower() for m in machines if m.get("privateLinkScopeResourceId"))
    return {**_scope_note(machines), "publicEndpoint": len(public), "privateLinkScopes": dict(sorted(scopes.items())), "findings": public}


# ------------------------------------------------------------ lifecycle


def load_lifecycle(path: Path = LIFECYCLE_FILE) -> list[dict]:
    """The product lifecycle table (Microsoft's lifecycle pages), longest product name first."""
    rows = json.loads(path.read_text(encoding="utf-8"))["products"]
    return sorted(rows, key=lambda r: -len(r["product"]))


def _product(text: str, table: list[dict], kind: str) -> dict | None:
    t = (text or "").lower()
    return next((r for r in table if r["kind"] == kind and r["product"].lower() in t), None)


def _lifecycle_state(row: dict, as_of: dt.datetime, window: int, esu_assigned: bool | None) -> tuple[str, str | None]:
    """(state, the date that decides it). States: supported, endingSoon, esuCovered, esuNotConfirmed, unsupported."""
    ext, esu = parse_time(row["extendedEnd"]), parse_time(row.get("esuEnd"))
    if as_of < ext:
        return ("endingSoon" if (ext - as_of).days <= window else "supported"), row["extendedEnd"]
    # ESUs open: before esuEnd, or offered with no published end date (esuAvailable, no esuEnd).
    if (esu and as_of < esu) or (esu is None and row.get("esuAvailable")):
        return ("esuCovered" if esu_assigned is True else "esuNotConfirmed"), row.get("esuEnd")
    return "unsupported", row.get("esuEnd") or row["extendedEnd"]


def evaluate_lifecycle(machines: list[dict], sql_instances: list[dict], table: list[dict], as_of: dt.datetime, window_days: int = 180) -> dict:
    """Arc servers and SQL Server instances on products past, or near, the end of support.
    The OS is matched on osSku, then osName (Microsoft's own sample uses that order)."""
    rows, unknown = [], []
    for m in sorted(machines, key=lambda m: m["name"].lower()):
        label = m.get("osSku") or m.get("osName") or ""
        product = _product(label, table, "os")
        if product is None:
            unknown.append({"id": m["id"], "name": m["name"], "kind": "os", "label": label})
            continue
        assigned = {"Assigned": True, "NotAssigned": False}.get(m.get("esuAssignment", ""))
        state, date = _lifecycle_state(product, as_of, window_days, assigned)
        rows.append({"id": m["id"], "name": m["name"], "kind": "os", "product": product["product"], "state": state, "date": date})
    for s in sorted(sql_instances, key=lambda s: s["name"].lower()):
        product = _product(s.get("version", ""), table, "sql")
        if product is None:
            unknown.append({"id": s["id"], "name": s["name"], "kind": "sql", "label": s.get("version", "")})
            continue
        # A SQL Server ESU subscription isn't one of the instance properties the query reads: confirm it separately.
        state, date = _lifecycle_state(product, as_of, window_days, None)
        rows.append({"id": s["id"], "name": s["name"], "kind": "sql", "product": product["product"], "state": state, "date": date})
    order = {"unsupported": 0, "esuNotConfirmed": 1, "esuCovered": 2, "endingSoon": 3, "supported": 4}
    findings = sorted((r for r in rows if r["state"] != "supported"), key=lambda r: (order[r["state"]], r["kind"], r["name"].lower()))
    counts = {s: sum(1 for r in rows if r["state"] == s) for s in order}
    return {"asOf": iso(as_of), "windowDays": window_days, **_scope_note(machines), "counts": counts, "findings": findings, "notInTable": unknown}


# ------------------------------------------------------------ sql-inventory


def evaluate_sql(machines: list[dict], sql_instances: list[dict]) -> dict:
    """SQL Server instances enabled by Arc: counts by version and edition, and instances whose
    host isn't a connected Arc machine the caller can read."""
    hosts = {m["id"]: m for m in machines}
    findings = []
    for s in sorted(sql_instances, key=lambda s: s["name"].lower()):
        host = hosts.get(s.get("hostId", ""))
        reasons = []
        if s.get("status") != "Connected":
            reasons.append(f"instance status {s.get('status') or 'missing'}")
        if host is None:
            reasons.append("host not found among the Arc machines in scope")
        elif host.get("status") != "Connected":
            reasons.append(f"host status {host.get('status') or 'missing'}")
        if reasons:
            findings.append({"id": s["id"], "name": s["name"], "version": s.get("version", ""), "host": host["name"] if host else None, "reasons": reasons})
    return {
        "instances": len(sql_instances),
        "byVersion": dict(sorted(Counter(s.get("version") or "Unknown" for s in sql_instances).items())),
        "byEdition": dict(sorted(Counter(s.get("edition") or "Unknown" for s in sql_instances).items())),
        "findings": findings,
    }


# ------------------------------------------------------------ policy-summary


def evaluate_policy(assignments: list[dict], states: list[dict]) -> dict:
    """Per assignment: enforcement mode and compliance counts. Findings: assignments not enforced
    (DoNotEnforce) and assignments with noncompliant resources, most noncompliant first."""
    counts = {s["assignmentId"]: s for s in states}
    rows = []
    for a in assignments:
        c = counts.get(a["id"], {})
        rows.append(
            {"id": a["id"], "displayName": a.get("displayName") or a["name"], "enforcementMode": a.get("enforcementMode") or "Default",
             "nonCompliant": int(c.get("nonCompliant", 0)), "compliant": int(c.get("compliant", 0)), "exempt": int(c.get("exempt", 0)), "total": int(c.get("total", 0))}
        )
    rows.sort(key=lambda r: (-r["nonCompliant"], r["displayName"].lower()))
    known = {a["id"] for a in assignments}
    return {
        "assignments": len(rows),
        "notEnforced": [r["displayName"] for r in rows if r["enforcementMode"] == "DoNotEnforce"],
        "withNonCompliant": [r for r in rows if r["nonCompliant"] > 0],
        "noStates": [r["displayName"] for r in rows if r["total"] == 0],
        "statesForUnknownAssignments": sorted(s["assignmentId"] for s in states if s["assignmentId"] not in known),
    }


# ------------------------------------------------------------ command line


def evaluate(task: str, data: dict, as_of: dt.datetime, window_days: int = 180) -> dict:
    if task == "arc-extensions":
        return evaluate_extensions(data["machines"], data["extensions"])
    if task == "arc-private-link":
        return evaluate_private_link(data["machines"])
    if task == "lifecycle":
        return evaluate_lifecycle(data["machines"], data["sqlInstances"], load_lifecycle(), as_of, window_days)
    if task == "sql-inventory":
        return evaluate_sql(data["machines"], data["sqlInstances"])
    return evaluate_policy(data["assignments"], data["policyStates"])


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Read-only Azure Arc and Azure Policy checks through Azure Resource Graph.")
    p.add_argument("--cloud", choices=sorted(CLOUDS), default="gcc", help="gcc and global use commercial Azure")
    p.add_argument("--tenant", help="tenant ID")
    p.add_argument("--client", help="app (client) ID; with no --cert, a user-assigned managed identity's client ID")
    p.add_argument("--cert", help="PEM file with the app's certificate and private key")
    p.add_argument("--subscription", action="append", default=[], help="subscription ID to query; repeatable (default: every subscription the identity can see)")
    p.add_argument("--from-json", type=Path, help="evaluate saved query rows (see tests/fixtures/arc.json) instead of calling Azure")
    p.add_argument("--as-of", help="evaluation time, ISO 8601 (default now, UTC)")
    sub = p.add_subparsers(dest="task", required=True)
    sub.add_parser("arc-extensions")
    sub.add_parser("arc-private-link")
    lc = sub.add_parser("lifecycle")
    lc.add_argument("--window-days", type=int, default=180, help="report products whose support ends within this many days (default 180)")
    sub.add_parser("sql-inventory")
    sub.add_parser("policy-summary")
    a = p.parse_args(argv)
    as_of = parse_time(a.as_of) if a.as_of else dt.datetime.now(dt.timezone.utc)

    if a.from_json:
        data = json.loads(a.from_json.read_text(encoding="utf-8"))
    else:
        if not a.tenant:
            p.error("--tenant is required unless --from-json is given")
        arm = ArmClient(a.cloud, azure_identity_provider(a.cloud, a.tenant, a.client, a.cert), calls=load_arm_calls(a.task))
        subs = a.subscription or arm.subscriptions()
        if not subs:
            print("the identity can see no subscriptions: assign it Reader on the subscriptions or management group in scope", file=sys.stderr)
            return 2
        data = {name: arm.resource_graph(q, subscriptions=subs) for name, q in QUERIES[a.task].items()}

    window = getattr(a, "window_days", 180)
    print(json.dumps({"task": a.task, "evidences": EVIDENCES[a.task], "result": evaluate(a.task, data, as_of, window)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
