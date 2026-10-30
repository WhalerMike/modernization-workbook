"""Read-only Microsoft Intune checks through Microsoft Graph, for the workbook's Module 3.

Each task is two parts, as in entra_tasks.py: a fetch (Graph calls, least-privileged
application permission noted) and a pure `evaluate_*` function that turns the Graph
objects into findings. The tests run the evaluate functions against fixtures; the
PowerShell module implements the same rules and is tested against the same fixtures
and expected results.

    python intune_tasks.py --cloud gcc --tenant <id> --client <id> --cert app.pem noncompliant-devices
    python intune_tasks.py ... compliance-coverage
    python intune_tasks.py ... stale-checkin --validity-days 14 --cleanup-days 90
    python intune_tasks.py ... device-posture --os-floor Windows=10.0.26100
    python intune_tasks.py ... autopilot-profiles        (Graph beta)

Add --from-json FILE to evaluate a saved Graph response instead of calling Graph.
Every task only reads. Nothing here writes to the tenant, and no task selects a
user's name, email address or user principal name.

These checks complement the validation kit's VK-INT-01 to VK-INT-06 (Entra device
attributes, Entra-side staleness, Autopilot group tags, assignment design, conflict
candidates, platform inventory). They read Intune's own records instead.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from entra_tasks import iso, parse_time  # noqa: E402
from graphkit import CLOUDS, GraphClient, azure_identity_provider  # noqa: E402

# Permissions per task (Microsoft Graph, application). The least-privileged ones each API page lists.
PERMISSIONS = {
    "noncompliant-devices": ["DeviceManagementManagedDevices.Read.All", "DeviceManagementConfiguration.Read.All"],
    "compliance-coverage": ["DeviceManagementManagedDevices.Read.All", "DeviceManagementConfiguration.Read.All"],
    "stale-checkin": ["DeviceManagementManagedDevices.Read.All"],
    "device-posture": ["DeviceManagementManagedDevices.Read.All"],
    "autopilot-profiles": ["DeviceManagementServiceConfig.Read.All"],  # beta endpoint
}

# The federal requirement each task evidences (the program's mapping; see the Module 3 page).
EVIDENCES = {
    "noncompliant-devices": ["NIST SP 800-53 CM-6", "OMB M-22-09 device-level signal", "supports ScubaGear MS.AAD.3.7v1"],
    "compliance-coverage": ["NIST SP 800-53 CM-2", "NIST SP 800-53 CM-6", "supports ScubaGear MS.AAD.3.7v1"],
    "stale-checkin": ["NIST SP 800-53 CM-8", "OMB M-22-09 device inventory"],
    "device-posture": ["NIST SP 800-53 SC-28(1)", "NIST SP 800-53 AC-19(5)", "NIST SP 800-53 SI-2", "NIST SP 800-53 CM-6"],
    "autopilot-profiles": ["NIST SP 800-53 CM-8(1)", "NIST SP 800-53 CM-2"],
}

# managedDevice properties the tasks read. No userPrincipalName, emailAddress or userDisplayName.
DEVICE_SELECT = (
    "id,deviceName,operatingSystem,osVersion,complianceState,lastSyncDateTime,"
    "complianceGracePeriodExpirationDateTime,isEncrypted,managedDeviceOwnerType,azureADDeviceId"
)
# deviceComplianceDeviceStatus properties. No userName or userPrincipalName.
STATUS_SELECT = "id,deviceDisplayName,status,lastReportedDateTime"
AUTOPILOT_SELECT = (
    "id,serialNumber,groupTag,enrollmentState,lastContactedDateTime,managedDeviceId,"
    "deploymentProfileAssignmentStatus,deploymentProfileAssignmentDetailedStatus,deploymentProfileAssignedDateTime"
)

EXCLUSION_TARGET = "#microsoft.graph.exclusionGroupAssignmentTarget"
# managedDevice.complianceState values that need attention, in report order.
ATTENTION_STATES = ["noncompliant", "inGracePeriod", "error", "conflict"]
# deviceComplianceDeviceStatus.status values that mean the policy is failing on the device.
FAILING_STATUSES = {"nonCompliant", "error", "conflict"}
# Statuses that don't show the policy applies to the device.
NOT_APPLIED_STATUSES = {"notApplicable", "notAssigned"}

DEFAULT_OS_FLOORS = {"Windows": "10.0.26100"}  # Windows 11, version 24H2: Book 05's CP-001 floor
DEFAULT_ENCRYPTION_OS = ("Windows", "macOS")


def _sync_time(value: str | None) -> dt.datetime | None:
    """lastSyncDateTime, or None if missing or a placeholder date before 1971."""
    t = parse_time(value)
    return t if t and t.year > 1970 else None


def _name_counts(devices: list[dict]) -> Counter:
    return Counter(d.get("deviceName", "") for d in devices)


# ------------------------------------------------------------ noncompliant devices


def evaluate_noncompliant(devices: list[dict], policies: list[dict]) -> dict:
    """Devices whose compliance state needs attention, each with the compliance policies
    that report it failing. Joined on device name: deviceComplianceDeviceStatus carries
    deviceDisplayName, not the managed device ID, so a name used twice is flagged."""
    counts = _name_counts(devices)
    failing: dict[str, set[str]] = {}
    for p in policies:
        for s in p.get("deviceStatuses") or []:
            if s.get("status") in FAILING_STATUSES:
                failing.setdefault(s.get("deviceDisplayName", ""), set()).add(f"{p.get('displayName', '')} ({s['status']})")
    rows = []
    for d in devices:
        state = d.get("complianceState", "unknown")
        if state not in ATTENTION_STATES:
            continue
        name = d.get("deviceName", "")
        rows.append(
            {
                "id": d["id"],
                "deviceName": name,
                "operatingSystem": d.get("operatingSystem", ""),
                "complianceState": state,
                "graceExpires": iso(parse_time(d.get("complianceGracePeriodExpirationDateTime"))),
                "failingPolicies": sorted(failing.get(name, set())),
                "nameNotUnique": counts[name] > 1,
            }
        )
    rows.sort(key=lambda r: (ATTENTION_STATES.index(r["complianceState"]), r["deviceName"], r["id"]))
    return {"devices": rows, "counts": {s: sum(1 for r in rows if r["complianceState"] == s) for s in ATTENTION_STATES}}


# ------------------------------------------------------------ compliance policy coverage


def evaluate_coverage(devices: list[dict], policies: list[dict]) -> dict:
    """Policies with no assignment, or only exclusions; and managed devices that no
    compliance policy reports on. By default Intune marks a device with no compliance
    policy as compliant, so the second list is what Conditional Access lets through."""
    rows = []
    for p in sorted(policies, key=lambda p: (p.get("displayName", ""), p["id"])):
        types = [(a.get("target") or {}).get("@odata.type", "") for a in p.get("assignments") or []]
        include = [t for t in types if t != EXCLUSION_TARGET]
        finding = "unassigned" if not types else ("exclusionOnly" if not include else None)
        rows.append(
            {
                "id": p["id"],
                "displayName": p.get("displayName", ""),
                "type": p.get("@odata.type", "").replace("#microsoft.graph.", ""),
                "includeTargets": len(include),
                "excludeTargets": len(types) - len(include),
                "finding": finding,
            }
        )
    covered = {
        s.get("deviceDisplayName", "")
        for p in policies
        for s in p.get("deviceStatuses") or []
        if s.get("status") not in NOT_APPLIED_STATUSES
    }
    uncovered = sorted(
        ({"id": d["id"], "deviceName": d.get("deviceName", ""), "operatingSystem": d.get("operatingSystem", "")}
         for d in devices if d.get("deviceName", "") not in covered),
        key=lambda r: (r["deviceName"], r["id"]),
    )
    counts = _name_counts(devices)
    return {
        "policies": rows,
        "policyFindings": sum(1 for r in rows if r["finding"]),
        "devicesWithNoPolicyReported": uncovered,
        "ambiguousNames": sorted(n for n, c in counts.items() if c > 1),
    }


# ------------------------------------------------------------ stale check-in


def evaluate_stale_checkin(devices: list[dict], as_of: dt.datetime, validity_days: int = 14, cleanup_days: int = 90) -> list[dict]:
    """Managed devices whose last Intune sync is older than the compliance validity period
    (the program sets 14 days) or the cleanup-rule age (the program sets 90 for Windows)."""
    out = []
    for d in devices:
        last = _sync_time(d.get("lastSyncDateTime"))
        days = (as_of - last).days if last else None
        if days is not None and days < validity_days:
            continue
        band = "noSync" if days is None else ("beyondCleanup" if days >= cleanup_days else "beyondValidity")
        out.append(
            {"id": d["id"], "deviceName": d.get("deviceName", ""), "operatingSystem": d.get("operatingSystem", ""),
             "lastSync": iso(last), "daysSinceSync": days, "band": band}
        )
    return sorted(out, key=lambda r: (r["daysSinceSync"] is not None, -(r["daysSinceSync"] or 0), r["deviceName"], r["id"]))


# ------------------------------------------------------------ encryption and OS posture


def version_tuple(value: str | None) -> tuple[int, ...]:
    """'10.0.22631.4317' -> (10, 0, 22631, 4317); a part that isn't a number counts as 0."""
    return tuple(int(p) if p.isdigit() else 0 for p in (value or "").split("."))


def _below(version: str | None, floor: str) -> bool:
    a, b = version_tuple(version), version_tuple(floor)
    n = max(len(a), len(b))
    return a + (0,) * (n - len(a)) < b + (0,) * (n - len(b))


def evaluate_posture(
    devices: list[dict], os_floors: dict[str, str] | None = None, encryption_os: tuple[str, ...] = DEFAULT_ENCRYPTION_OS
) -> dict:
    """Devices not reporting encryption (on the platforms where the program requires it)
    or reporting an OS version below the floor for their platform."""
    floors = DEFAULT_OS_FLOORS if os_floors is None else os_floors
    rows = []
    for d in devices:
        os_name, findings = d.get("operatingSystem", ""), []
        if os_name in encryption_os and d.get("isEncrypted") is not True:
            findings.append("notEncrypted")
        if os_name in floors and _below(d.get("osVersion"), floors[os_name]):
            findings.append("belowOsFloor")
        if findings:
            rows.append(
                {"id": d["id"], "deviceName": d.get("deviceName", ""), "operatingSystem": os_name,
                 "osVersion": d.get("osVersion", ""), "isEncrypted": d.get("isEncrypted"), "findings": findings}
            )
    rows.sort(key=lambda r: (r["deviceName"], r["id"]))
    return {
        "devices": len(devices),
        "notEncrypted": sum(1 for r in rows if "notEncrypted" in r["findings"]),
        "belowOsFloor": sum(1 for r in rows if "belowOsFloor" in r["findings"]),
        "findings": rows,
    }


# ------------------------------------------------------------ Autopilot profile assignment (beta)


def evaluate_autopilot(identities: list[dict]) -> dict:
    """Autopilot registrations by deployment profile assignment status; every one not
    'assignedInSync' is listed. The status is a beta-only property."""
    counts: Counter = Counter()
    rows = []
    for a in identities:
        status = a.get("deploymentProfileAssignmentStatus") or "unknown"
        counts[status] += 1
        if status != "assignedInSync":
            rows.append(
                {"id": a["id"], "serialNumber": a.get("serialNumber", ""), "groupTag": a.get("groupTag") or "",
                 "status": status, "detail": a.get("deploymentProfileAssignmentDetailedStatus") or "",
                 "enrollmentState": a.get("enrollmentState", "")}
            )
    rows.sort(key=lambda r: (r["status"], r["serialNumber"], r["id"]))
    return {"total": len(identities), "counts": dict(sorted(counts.items())), "notInSync": rows}


# ------------------------------------------------------------ fetch (read-only)


def fetch_devices(g: GraphClient) -> list[dict]:
    return list(g.get_all(f"/deviceManagement/managedDevices?$select={DEVICE_SELECT}"))


def fetch_compliance_policies(g: GraphClient) -> list[dict]:
    """Each compliance policy with its assignments and per-device statuses embedded."""
    policies = list(g.get_all("/deviceManagement/deviceCompliancePolicies?$select=id,displayName"))
    for p in policies:
        base = f"/deviceManagement/deviceCompliancePolicies/{p['id']}"
        p["assignments"] = list(g.get_all(f"{base}/assignments"))
        p["deviceStatuses"] = list(g.get_all(f"{base}/deviceStatuses?$select={STATUS_SELECT}"))
    return policies


def fetch_autopilot(g: GraphClient) -> list[dict]:
    # Beta: deploymentProfileAssignmentStatus isn't in the v1.0 resource. Same host, so the token check holds.
    return list(g.get_all(f"{g.root}/beta/deviceManagement/windowsAutopilotDeviceIdentities?$select={AUTOPILOT_SELECT}"))


# ------------------------------------------------------------ command line


def _floors(values: list[str]) -> dict[str, str]:
    out = {}
    for v in values:
        os_name, _, floor = v.partition("=")
        if not floor:
            raise argparse.ArgumentTypeError(f"--os-floor wants OS=VERSION, got {v!r}")
        out[os_name] = floor
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Read-only Microsoft Intune checks through Microsoft Graph.")
    p.add_argument("--cloud", choices=sorted(CLOUDS), default="gcc")
    p.add_argument("--tenant", help="tenant ID")
    p.add_argument("--client", help="app (client) ID; with no --cert, a user-assigned managed identity's client ID")
    p.add_argument("--cert", help="PEM file with the app's certificate and private key")
    p.add_argument("--from-json", type=Path, help="evaluate a saved Graph response (see tests/fixtures/intune.json) instead of calling Graph")
    p.add_argument("--as-of", help="evaluation time, ISO 8601 (default now, UTC)")
    sub = p.add_subparsers(dest="task", required=True)
    sub.add_parser("noncompliant-devices")
    sub.add_parser("compliance-coverage")
    s = sub.add_parser("stale-checkin")
    s.add_argument("--validity-days", type=int, default=14)
    s.add_argument("--cleanup-days", type=int, default=90)
    d = sub.add_parser("device-posture")
    d.add_argument("--os-floor", action="append", default=[], help="OS=VERSION, e.g. Windows=10.0.26100; repeatable (default Windows=10.0.26100)")
    sub.add_parser("autopilot-profiles")
    a = p.parse_args(argv)
    as_of = parse_time(a.as_of) if a.as_of else dt.datetime.now(dt.timezone.utc)

    if a.from_json:
        data = json.loads(a.from_json.read_text(encoding="utf-8"))
    else:
        if not a.tenant:
            p.error("--tenant is required unless --from-json is given")
        g = GraphClient(a.cloud, azure_identity_provider(a.cloud, a.tenant, a.client, a.cert))
        data = {}
        if a.task == "autopilot-profiles":
            data["autopilotDevices"] = fetch_autopilot(g)
        else:
            data["managedDevices"] = fetch_devices(g)
            if a.task in ("noncompliant-devices", "compliance-coverage"):
                data["compliancePolicies"] = fetch_compliance_policies(g)

    if a.task == "noncompliant-devices":
        result: object = evaluate_noncompliant(data["managedDevices"], data["compliancePolicies"])
    elif a.task == "compliance-coverage":
        result = evaluate_coverage(data["managedDevices"], data["compliancePolicies"])
    elif a.task == "stale-checkin":
        result = evaluate_stale_checkin(data["managedDevices"], as_of, a.validity_days, a.cleanup_days)
    elif a.task == "device-posture":
        result = evaluate_posture(data["managedDevices"], _floors(a.os_floor) if a.os_floor else None)
    else:
        result = evaluate_autopilot(data["autopilotDevices"])
    print(json.dumps({"task": a.task, "evidences": EVIDENCES[a.task], "result": result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
