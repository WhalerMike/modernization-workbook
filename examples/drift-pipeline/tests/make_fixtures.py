"""Writes the two fictional validation kit runs in tests/fixtures/runs, in the kit's output shape
(Results, Summary, Details, ValidationManifest.json with a SHA-256 per file).

The rows follow the kit's own "fail" fixture tenant (contoso.example). Rerun after editing:

    python tests/make_fixtures.py

The previous run is October 28, 2026; the current run is October 29. Between them: one finding
resolved, three new, one changed, one detail-only change, VK-NPI-03 ends in Error and VK-PIV-01
isn't run."""
from __future__ import annotations

import csv
import hashlib
import io
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent / "fixtures" / "runs"

U = "00000000-0000-4000-8000-000000000"
ARC = "/subscriptions/22222222-2222-4222-8222-222222222222/resourcegroups/rg-servers/providers/microsoft.hybridcompute/machines/"
TITLES = {
    "VK-HR-01": ("HR", "Enabled member users with no employeeId (uncorrelated), excluding listed exception owners", "User.Read.All"),
    "VK-HR-02": ("HR", "Coded attribute slots empty on enabled members", "User.Read.All"),
    "VK-DG-01": ("DG", "User rules without the accountEnabled and userType guards", "Group.Read.All"),
    "VK-INT-05": ("INT", "Devices reached by more than one policy of the same type", "DeviceManagementConfiguration.Read.All"),
    "VK-ARC-02": ("ARC", "Arc servers disconnected, expired or on an unsupported agent", ""),
    "VK-NPI-01": ("NPI", "App registrations and service principals with fewer than two owners", "Application.Read.All"),
    "VK-NPI-03": ("NPI", "Client secrets past the maximum lifetime", "Application.Read.All"),
    "VK-CA-01": ("CA", "Conditional Access personas: emergency-access group excluded, only governed groups targeted", "Policy.Read.All"),
    "VK-PIV-01": ("PIV", "PIV binding coverage", "User.Read.All"),
}


def row(sev, obj, oid, issue, detail=""):
    return {"Severity": sev, "Object": obj, "ObjectId": oid, "Issue": issue, "Detail": detail}


NO_EMP = "No employeeId: not correlated to an HR record"
SLOT = "Coded attribute slot empty"
GUARD = "User rule lacks the guards every access rule needs"
CONFLICT = "Reached by more than one policy of the same type (conflict candidate)"
OWNERS_APP = "App registration with 1 owner(s), fewer than 2"
OWNERS_SP = "Service principal with 1 owner(s), fewer than 2"

PREVIOUS = {
    "VK-HR-01": ("Fail", "", [row("Finding", "dave@contoso.example", U + "007", NO_EMP), row("Finding", "frank@contoso.example", U + "009", NO_EMP)]),
    "VK-HR-02": ("Fail", "Slots checked: extensionAttribute10, extensionAttribute11, extensionAttribute12",
                 [row("Finding", "dave@contoso.example", U + "007", SLOT, "Missing=extensionAttribute12"),
                  row("Finding", "erin@contoso.example", U + "008", SLOT, "Missing=extensionAttribute10")]),
    "VK-DG-01": ("Fail", "", [row("Finding", "Finance (legacy)", U + "106", GUARD, "Missing=accountEnabled,userType")]),
    "VK-INT-05": ("Warn", "", [row("Warn", "PC-001", U + "200", CONFLICT, "Policies=Win11 general (pilot),Win11 general (Tier2)")]),
    "VK-ARC-02": ("Fail", "Minimum supported agent 1.58",
                  [row("Finding", "srv-old01", ARC + "srv-old01", "Agent 1.40.02664.1 older than 1.58", "Status=Connected; Agent=1.40.02664.1")]),
    "VK-NPI-01": ("Fail", "Minimum human owners: 2",
                  [row("Finding", "Report Bot", "aaaaaaaa-0000-4000-8000-000000000303", OWNERS_APP, "ObjectType=Application; Owners=1"),
                   row("Finding", "Report Bot", "aaaaaaaa-0000-4000-8000-000000000303", OWNERS_SP, "ObjectType=ServicePrincipal; Owners=1")]),
    "VK-NPI-03": ("Fail", "Maximum secret lifetime: 180 days",
                  [row("Finding", "Payroll Export", "aaaaaaaa-0000-4000-8000-000000000305", "Client secret valid for 730 days, more than 180", "KeyId=k1")]),
    "VK-CA-01": ("Pass", "4 user-targeting policy(ies) read", []),
    "VK-PIV-01": ("Pass", "", []),
}

CURRENT = {
    "VK-HR-01": ("Fail", "", [row("Finding", "dave@contoso.example", U + "007", NO_EMP), row("Finding", "gina@contoso.example", U + "011", NO_EMP)]),
    "VK-HR-02": ("Fail", "Slots checked: extensionAttribute10, extensionAttribute11, extensionAttribute12",
                 [row("Finding", "dave@contoso.example", U + "007", SLOT, "Missing=extensionAttribute12"),
                  row("Finding", "erin@contoso.example", U + "008", SLOT, "Missing=extensionAttribute10,extensionAttribute11")]),
    "VK-DG-01": ("Fail", "", [row("Finding", "Finance (legacy)", U + "106", GUARD, "Missing=accountEnabled,userType"),
                              row("Finding", "All staff (nested)", U + "108", GUARD, "Missing=accountEnabled,userType")]),
    "VK-INT-05": ("Warn", "", [row("Warn", "PC-001", U + "200", CONFLICT, "Policies=Win11 general (pilot),Win11 general (Tier2)")]),
    "VK-ARC-02": ("Fail", "Minimum supported agent 1.58",
                  [row("Finding", "srv-old01", ARC + "srv-old01", "Status Disconnected; Agent 1.40.02664.1 older than 1.58", "Status=Disconnected; Agent=1.40.02664.1")]),
    "VK-NPI-01": ("Fail", "Minimum human owners: 2",
                  [row("Finding", "Report Bot", "aaaaaaaa-0000-4000-8000-000000000303", OWNERS_APP, "ObjectType=Application; Owners=1"),
                   row("Finding", "Report Bot", "aaaaaaaa-0000-4000-8000-000000000303", OWNERS_SP, "ObjectType=ServicePrincipal; Owners=1")]),
    "VK-NPI-03": ("Error", "Response status code does not indicate success: 403 (Forbidden).", []),
    "VK-CA-01": ("Fail", "4 user-targeting policy(ies) read",
                 [row("Finding", "Require MFA", "ca-users", "Emergency-access group not excluded", "State=enabled; MissingExclusions=" + U + "900")]),
}

# The kit's fixture tenant placeholder (examples/validation-kit/tests/fixtures/*/tenant.json).
TENANT = "11111111-1111-4111-8111-111111111111"
OPTIONS = {"MaxSecretDays": 180, "MinOwners": 2, "MinSupportedAgentVersion": "1.58", "StaleDays": 90}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest().upper()


def csv_text(rows):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=["Severity", "Object", "ObjectId", "Issue", "Detail"], quoting=csv.QUOTE_ALL, lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
    return buf.getvalue()


def write_run(parent: Path, run_id: str, as_of: str, checks: dict) -> None:
    run = parent / run_id
    if run.exists():
        shutil.rmtree(run)
    files: dict[str, bytes] = {}
    results = []
    for cid, (status, message, rows) in checks.items():
        track, title, perm = TITLES[cid]
        count = sum(r["Severity"] in ("Finding", "Warn") for r in rows)
        results.append({"CheckId": cid, "Track": track, "Title": title, "Status": status, "Count": count, "Message": message,
                        "Details": rows, "Evidence": {"Mode": "Fixture", "Source": "Graph" if perm else "ResourceGraph",
                                                      "Queries": [], "Permissions": [perm] if perm else [], "AzureRole": "" if perm else "Reader",
                                                      "Stage": "v1.0" if perm else "GA", "AsOfUtc": as_of, "CollectedAtUtc": as_of}})
        if rows:
            files[f"Details/{cid}.csv"] = csv_text(rows).encode("utf-8")
    files["Results/ValidationResults.json"] = (json.dumps(results, indent=2) + "\n").encode("utf-8")
    by = {s: sum(r["Status"] == s for r in results) for s in ("Pass", "Fail", "Warn", "NotApplicable", "Error")}
    summary = {"RunId": run_id, "Mode": "Fixture", "AsOfUtc": as_of, "Counts": dict(Checks=len(results), **by),
               "Checks": [{"CheckId": r["CheckId"], "Status": r["Status"], "Count": r["Count"]} for r in results]}
    files["Summary/ValidationSummary.json"] = (json.dumps(summary, indent=2) + "\n").encode("utf-8")
    for rel, data in files.items():
        (run / rel).parent.mkdir(parents=True, exist_ok=True)
        (run / rel).write_bytes(data)
    manifest = {
        "Schema": "fmw-validation-kit/manifest/1", "RunId": run_id, "KitVersion": "0.1.0", "ReadOnly": True,
        "Mode": "Fixture", "Cloud": "gcc", "TenantId": TENANT, "TenantIdSource": "Fixture", "AsOfUtc": as_of, "ExecutedBy": "runner", "ComputerName": "fixture-runner",
        "StartTimeUtc": as_of, "EndTimeUtc": as_of, "PowerShell": {"Version": "7.6.9", "Edition": "Core"},
        "Options": OPTIONS, "RequestedScopes": [],
        "Checks": [{"CheckId": r["CheckId"], "Status": r["Status"], "Count": r["Count"], "Queries": []} for r in results],
        "FileCount": len(files),
        "Files": [{"RelativePath": rel, "SizeBytes": len(data), "SHA256": sha(data)} for rel, data in sorted(files.items())],
    }
    (run / "ValidationManifest.json").write_bytes((json.dumps(manifest, indent=2) + "\n").encode("utf-8"))


if __name__ == "__main__":
    write_run(HERE / "previous", "2026-10-28-0617-fixture-runner-fixture", "2026-10-28T06:17:00Z", PREVIOUS)
    write_run(HERE / "current", "2026-10-29-0617-fixture-runner-fixture", "2026-10-29T06:17:00Z", CURRENT)
    print("wrote", HERE)
