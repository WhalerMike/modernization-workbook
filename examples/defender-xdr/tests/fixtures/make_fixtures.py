#!/usr/bin/env python3
"""Write the Defender XDR kit's fixtures: a fictional contoso.example estate on November 16, 2026.

Fourteen devices in four rings and a server group, with the faults the labs find: a device whose sensor is
inactive, one with impaired communications, one never onboarded, one excepted, one whose exception expired, one
Defender reports that the inventory doesn't list; prevention drift on three devices; an ASR plan with rules ready
to move, rules held by open audit hits, a rule planned in warn that doesn't support it, a ring with a device
Configuration Manager manages, and a server whose compliance would say applied while the device enforces nothing;
incidents past their triage window and one closed without a classification; three detection rules (one with
automated actions); identity and cloud-app alerts on an emergency access account; and a device group off the
response ladder. Every name, ID and address is invented (IP addresses from the documentation range).

    python tests/fixtures/make_fixtures.py

Standard library only. Writes LF line endings.
"""
from __future__ import annotations

import csv
import io
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
TENANT = "00000000-0000-0000-0000-00000000c0de"
DOMAIN = "contosoexample.onmicrosoft.com"

RULES = json.loads((HERE.parent.parent / "config" / "asr-rules.json").read_text(encoding="utf-8"))["rules"]
RID = {r["actionTypePrefix"]: r["id"] for r in RULES}
MODES = {"off": 0, "block": 1, "audit": 2, "warn": 6}


def write(path: str, data) -> None:
    p = HERE / path
    p.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        text = data
    else:
        text = json.dumps(data, indent=2) + "\n"
    p.write_text(text, encoding="utf-8", newline="\n")


def write_csv(path: str, header: list[str], rows: list[list]) -> None:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    w.writerow(header)
    w.writerows(rows)
    write(path, buf.getvalue())


def hunting(schema: list[tuple[str, str]], rows: list[dict]) -> dict:
    return {"@odata.context": "https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.security.huntingQueryResults",
            "schema": [{"name": n, "type": t} for n, t in schema], "results": rows}


# ------------------------------------------------------------------ the estate
# name, ring, kind, role, owner, inscope, group, managedBy
INVENTORY = [
    ("WKS-R0-01", "ring0", "workstation", "", "Endpoint engineering (example)", "yes", "Ring0-Workstations", "Intune"),
    ("WKS-R0-02", "ring0", "workstation", "", "Endpoint engineering (example)", "yes", "Ring0-Workstations", "Intune"),
    ("WKS-R1-01", "ring1", "workstation", "", "Pilot group (example)", "yes", "Ring1-Pilot", "Intune"),
    ("WKS-R1-02", "ring1", "workstation", "", "Pilot group (example)", "yes", "Ring1-Pilot", "Intune"),
    ("WKS-R1-03", "ring1", "workstation", "", "Pilot group (example)", "yes", "Ring1-Pilot", "Intune"),
    ("WKS-R2-01", "ring2", "workstation", "", "Early adopters (example)", "yes", "Ring2-Workstations", "Intune"),
    ("WKS-R2-02", "ring2", "workstation", "", "Early adopters (example)", "yes", "Ring2-Workstations", "ConfigMgr"),
    ("WKS-R2-03", "ring2", "workstation", "", "Early adopters (example)", "yes", "Ring2-Workstations", "Intune"),
    ("WKS-R3-01", "ring3", "workstation", "", "Field office (example)", "yes", "Ring3-Workstations", "Intune"),
    ("WKS-R3-02", "ring3", "workstation", "", "Field office (example)", "yes", "Ring3-Workstations", "Intune"),
    ("LAB-KIOSK01", "ring3", "workstation", "", "Field office (example)", "yes", "Ring3-Workstations", "Intune"),
    ("SRV-APP01", "servers", "server", "app", "Server operations (example)", "yes", "Servers", "Intune"),
    ("SRV-FILE01", "servers", "server", "file", "Server operations (example)", "yes", "Servers", "Intune"),
    ("SRV-LEGACY01", "servers", "server", "app", "Server operations (example)", "yes", "Servers", "Intune"),
    ("WKS-TEST-99", "ring0", "workstation", "", "Endpoint engineering (example)", "no", "Ring0-Workstations", "Intune"),
]

# What DeviceInfo reports (name -> onboarding, sensor, os). Not listed: never seen by Defender.
DEFENDER = {
    "WKS-R0-01": ("Onboarded", "Active", "Windows11"), "WKS-R0-02": ("Onboarded", "Active", "Windows11"),
    "WKS-R1-01": ("Onboarded", "Active", "Windows11"), "WKS-R1-02": ("Onboarded", "Active", "Windows11"),
    "WKS-R1-03": ("Onboarded", "ImpairedCommunication", "Windows11"),
    "WKS-R2-01": ("Onboarded", "Active", "Windows11"), "WKS-R2-02": ("Onboarded", "Active", "Windows10"),
    "WKS-R2-03": ("Onboarded", "Inactive", "Windows11"),
    "WKS-R3-01": ("Onboarded", "Active", "Windows11"), "WKS-R3-02": ("Can be onboarded", "", "Windows11"),
    "SRV-APP01": ("Onboarded", "Active", "WindowsServer2022"), "SRV-FILE01": ("Onboarded", "Active", "WindowsServer2019"),
    "WKS-OLD-07": ("Onboarded", "Active", "Windows10"),
    "WKS-TEST-99": ("Onboarded", "Active", "Windows11"),
}
GROUP = {n: g for n, _, _, _, _, _, g, _ in INVENTORY}
GROUP["WKS-OLD-07"] = "Unassigned"


def inputs() -> None:
    write_csv("inputs/inventory.csv", ["DeviceName", "Ring", "Kind", "Role", "Owner", "InScope", "DeviceGroup", "ManagedBy"], [list(r) for r in INVENTORY])
    write_csv("inputs/exceptions.csv", ["Id", "Scope", "Subject", "Reason", "CompensatingControl", "Approver", "Expires"], [
        ["EX-DEV-01", "Device", "LAB-KIOSK01", "Isolated lab network, no path to the service", "Windows Event Forwarding of the Defender operational log", "ISSO (example)", "2027-02-28"],
        ["EX-DEV-02", "Device", "SRV-LEGACY01", "Windows Server 2016 leaves the estate", "Network isolation; quarterly scan", "ISSO (example)", "2026-10-31"],
    ])
    write_csv("inputs/role-export.csv", ["Role", "Permissions", "Groups", "DataSources"], [
        ["XDR Read", "Security data basics (Read)", "SG-XDR-Readers; SG-XDR-Assessor-ReadOnly", "All"],
        ["XDR Responder", "Security data basics (Read); Alerts (Manage); Response (Manage); Basic live response (Manage)", "SG-XDR-Responders; SG-SOC-Standing", "All"],
        ["XDR Detection Engineer", "Security data basics (Read); Detection tuning (Manage); Advanced live response (Manage)", "SG-XDR-DetectionEngineers", "All"],
        ["XDR Tier 0 Analyst", "Security data basics (Read); Alerts (Manage); Response (Manage); Basic live response (Manage); Advanced live response (Manage)", "SG-XDR-Tier0", "All"],
        ["Legacy SOC role", "Security data basics (Read)", "SG-XDR-Readers", "Microsoft Defender for Endpoint"],
    ])
    write("inputs/prevention-plan.json", {
        "_comment": "Fictional. The stage each ring is at for network protection and controlled folder access (audit or block).",
        "rings": {
            "ring0": {"networkProtection": "block", "controlledFolderAccess": "block"},
            "ring1": {"networkProtection": "block", "controlledFolderAccess": "block"},
            "ring2": {"networkProtection": "audit", "controlledFolderAccess": "audit"},
            "ring3": {"networkProtection": "audit", "controlledFolderAccess": "audit"},
            "servers": {"networkProtection": "audit", "controlledFolderAccess": "audit"},
        }})
    write("inputs/asr-plan.json", {"_comment": "Fictional. Each ring's ASR rules: the stage and the date the rule entered it.", "rings": ASR_PLAN})
    write_csv("inputs/asr-exclusions.csv", ["Id", "RuleId", "Path", "Decision", "Owner", "Approver", "Expires"], [
        ["EX-ASR-01", RID["AsrOfficeChildProcess"], r"C:\Program Files\Contoso\LobApp\lobhelper.exe", "exclude", "Line-of-business app owner (example)", "ISSO (example)", "2027-05-01"],
        ["EX-ASR-02", RID["AsrObfuscatedScript"], "C:\\Program Files\\Contoso\\Scripts\\", "fix", "Endpoint engineering (example)", "ISSO (example)", "2027-01-31"],
        ["EX-ASR-03", RID["AsrUntrustedUsbProcess"], "D:\\Installers\\", "exclude", "Field office (example)", "ISSO (example)", "2026-10-31"],
    ])
    write("inputs/owners.json", {"_comment": "Fictional. The remediation owner of each Defender device group.", "machineGroups": {
        "Ring0-Workstations": "Endpoint engineering (example)", "Ring1-Pilot": "Endpoint engineering (example)",
        "Ring2-Workstations": "Desktop support (example)", "Ring3-Workstations": "Desktop support (example)", "Servers": "Server operations (example)"}})
    write_csv("inputs/device-groups.csv", ["Name", "Rank", "Kind", "RemediationLevel", "ExceptionId"], [
        ["Servers", "1", "server", "Semi - require approval for core folders", ""],
        ["Ring0-Workstations", "2", "workstation", "Full - remediate threats automatically", ""],
        ["Ring1-Pilot", "3", "pilot", "Semi - require approval for all folders", ""],
        ["Ring2-Workstations", "4", "workstation", "Full - remediate threats automatically", ""],
        ["Ring3-Workstations", "5", "workstation", "Semi - require approval for core folders", ""],
    ])
    write_csv("inputs/automation-exclusions.csv", ["Type", "Value", "Reason", "Approver", "ReviewBy"], [
        ["Identity", f"breakglass01@{DOMAIN}", "Emergency access account", "Authorizing official (example)", "2027-02-15"],
        ["Identity", f"svc-soc-connector@{DOMAIN}", "Service account the SOC's connector runs as", "Authorizing official (example)", "2027-02-15"],
        ["IpRange", "192.0.2.0/24", "Scanner subnet", "Authorizing official (example)", "2026-10-01"],
    ])
    write_csv("inputs/exercise.csv", ["Test", "Expected", "Observed"], [
        ["Detection test (Gate 2)", "An alert on the device in about 10 minutes", "yes"],
        ["Network protection test site (Gate 3)", "Blocked, event 1126", "yes"],
        ["Controlled folder access write (Gate 3)", "Blocked, event 1123", "yes"],
        ["ASR demonstration, Office child process (Gate 4)", "Blocked on ring 0, event 1121", "yes"],
        ["Custom detection known-bad replay (Gate 7)", "An alert with detection source Custom detection", "no"],
    ])


# ------------------------------------------------------------------ ASR plan and device state
def plan_ring(default: str, since: str, overrides: dict[str, tuple[str, str]] | None = None, skip: set[str] = frozenset()) -> dict:
    out = {}
    for r in RULES:
        if r["actionTypePrefix"] in skip:
            continue
        mode = default
        if default == "warn" and not r["supportsWarn"]:
            mode = "audit"
        m, s = (overrides or {}).get(r["actionTypePrefix"], (mode, since))
        out[r["id"]] = {"mode": m, "since": s}
    return out


ASR_PLAN = {
    "ring0": plan_ring("block", "2026-09-01"),
    "ring1": plan_ring("warn", "2026-11-01", {
        "AsrLsassCredentialTheft": ("block", "2026-10-01"),
        "AsrOfficeProcessInjection": ("audit", "2026-10-01"),
        "AsrOfficeChildProcess": ("warn", "2026-11-10")}),
    "ring2": plan_ring("audit", "2026-10-10"),
    "ring3": plan_ring("audit", "2026-11-02", {"AsrLsassCredentialTheft": ("warn", "2026-11-02")}),
    "servers": plan_ring("audit", "2026-10-01", skip={"AsrOfficeMacroWin32ApiCalls"}),
}


def device_asr(name: str) -> tuple[list[str], list[int]]:
    inv = {r[0]: r for r in INVENTORY}[name]
    ring, kind = inv[1], inv[2]
    if name == "SRV-APP01":
        return [], []  # the compliance report says applied; the device enforces nothing
    ids, acts = [], []
    for r in RULES:
        p = ASR_PLAN[ring].get(r["id"])
        if not p or (kind == "server" and not r["windowsServer"]):
            continue
        ids.append(r["id"])
        acts.append(MODES[p["mode"]])
    return ids, acts


PREV = {"ring0": (1, 1), "ring1": (1, 1), "ring2": (2, 2), "ring3": (2, 2), "servers": (2, 2)}


def device_states() -> None:
    for name, ring, kind, role, *_ in INVENTORY:
        if name not in DEFENDER or DEFENDER[name][0] != "Onboarded" or name == "WKS-TEST-99":
            continue
        np_, cfa = PREV[ring]
        ids, acts = device_asr(name)
        state = {
            "deviceName": f"{name}.contoso.example", "os": "Windows Server 2022 Datacenter" if name == "SRV-APP01" else ("Windows Server 2019 Standard" if kind == "server" else "Windows 11 Enterprise"),
            "isServer": kind == "server", "sense": {"status": "Running"}, "onboardingState": 1,
            "senseVersion": "10.8460.22621.1001" if name == "WKS-R3-01" else ("10.8470.17763.5000" if name == "SRV-FILE01" else "10.8760.26100.2314"),
            "computerStatus": {"IsTamperProtected": name != "WKS-R1-02", "RealTimeProtectionEnabled": True, "AMRunningMode": "Normal", "AMProductVersion": "4.18.26060.3008"},
            "preference": {
                "EnableNetworkProtection": 0 if name == "WKS-R2-01" else np_,
                "AllowNetworkProtectionOnWinServer": 1 if kind == "server" else 0,
                "AllowDatagramProcessingOnWinServer": 1 if name == "SRV-FILE01" else 0,
                "EnableControlledFolderAccess": cfa,
                "AttackSurfaceReductionRules_Ids": ids, "AttackSurfaceReductionRules_Actions": acts},
            "firewall": [{"Name": p, "Enabled": "True", "DefaultInboundAction": "Block", "DefaultOutboundAction": "Allow"} for p in ("Domain", "Private", "Public")],
            "collectedAt": "2026-11-16T11:40:00Z",
        }
        write(f"devices/{name}.json", state)


# ------------------------------------------------------------------ Graph responses
ASR_EVENTS = [  # action type prefix, suffix, device, path, events
    ("AsrOfficeChildProcess", "Audited", "WKS-R2-01", r"C:\Program Files\Contoso\LobApp\lobhelper.exe", 14),
    ("AsrOfficeChildProcess", "Audited", "WKS-R2-03", r"C:\Users\Public\Tools\macro-runner.exe", 3),
    ("AsrObfuscatedScript", "Audited", "WKS-R2-02", r"C:\Program Files\Contoso\Scripts\login.ps1", 5),
    ("AsrPsexecWmiChildProcess", "Audited", "SRV-FILE01", r"C:\Windows\System32\wbem\WmiPrvSE.exe", 6),
    ("AsrUntrustedUsbProcess", "Audited", "WKS-R3-01", r"E:\setup.exe", 1),
    ("AsrLsassCredentialTheft", "Blocked", "WKS-R1-01", r"C:\Program Files\Fabrikam\Update\fabupdate.exe", 40),
    ("AsrOfficeChildProcess", "Blocked", "WKS-R0-01", r"C:\Users\Public\Downloads\invoice.docm", 2),
    ("AsrExecutableEmailContent", "Blocked", "WKS-R0-02", r"C:\Users\Public\Downloads\statement.js", 1),
]


def graph() -> None:
    ts = "2026-11-16T11:00:00Z"
    devs = [{"DeviceId": f"{i:040x}", "DeviceName": f"{n.lower()}.contoso.example", "OSPlatform": os_, "OnboardingStatus": ob, "SensorHealthState": sh,
             "MachineGroup": GROUP.get(n, ""), "Timestamp": ts}
            for i, (n, (ob, sh, os_)) in enumerate(sorted(DEFENDER.items()), start=1)]
    write("graph/hunting/coverage-devices.json", hunting([("DeviceId", "String"), ("DeviceName", "String"), ("OSPlatform", "String"), ("OnboardingStatus", "String"), ("SensorHealthState", "String"), ("MachineGroup", "String"), ("Timestamp", "DateTime")], devs))
    summ: dict[tuple[str, str], int] = {}
    for d in devs:
        k = (d["OnboardingStatus"], d["SensorHealthState"])
        summ[k] = summ.get(k, 0) + 1
    write("graph/hunting/coverage-summary.json", hunting([("OnboardingStatus", "String"), ("SensorHealthState", "String"), ("Devices", "Int64")],
                                                         [{"OnboardingStatus": a, "SensorHealthState": b, "Devices": c} for (a, b), c in sorted(summ.items())]))
    write("graph/hunting/prevention-events.json", hunting([("ActionType", "String"), ("Events", "Int64"), ("Devices", "Int64")], [
        {"ActionType": "ExploitGuardNetworkProtectionAudited", "Events": 12, "Devices": 4},
        {"ActionType": "ExploitGuardNetworkProtectionBlocked", "Events": 3, "Devices": 2},
        {"ActionType": "ControlledFolderAccessViolationAudited", "Events": 7, "Devices": 3},
        {"ActionType": "ControlledFolderAccessViolationBlocked", "Events": 1, "Devices": 1},
        {"ActionType": "TamperingAttempt", "Events": 1, "Devices": 1}]))
    # camelCase keys on purpose: Learn's second runHuntingQuery example returns them that way.
    write("graph/hunting/asr-events-by-device.json", hunting([("ActionType", "String"), ("DeviceName", "String"), ("FolderPath", "String"), ("Events", "Int64"), ("LastSeen", "DateTime")],
                                                             [{"actionType": p + s, "deviceName": f"{d.lower()}.contoso.example", "folderPath": f, "events": e, "lastSeen": "2026-11-15T16:20:00Z"} for p, s, d, f, e in ASR_EVENTS]))
    tot: dict[str, int] = {}
    for p, s, d, f, e in ASR_EVENTS:
        tot[p + s] = tot.get(p + s, 0) + e
    write("graph/hunting/asr-events.json", hunting([("ActionType", "String"), ("EventCount", "Int64")], [{"ActionType": k, "EventCount": v} for k, v in sorted(tot.items())]))
    write("graph/hunting/tvm-high-critical.json", hunting([("SoftwareVendor", "String"), ("SoftwareName", "String"), ("RecommendedSecurityUpdate", "String"), ("CVEs", "Int64"), ("Devices", "Int64")], [
        {"SoftwareVendor": "fabrikam", "SoftwareName": "fabrikam_pdf_viewer", "RecommendedSecurityUpdate": "Fabrikam PDF Viewer 24.3 (example)", "CVEs": 4, "Devices": 9},
        {"SoftwareVendor": "contoso", "SoftwareName": "contoso_lob_client", "RecommendedSecurityUpdate": "Contoso LOB Client 8.2 (example)", "CVEs": 2, "Devices": 5},
        {"SoftwareVendor": "microsoft", "SoftwareName": "windows_server_2019", "RecommendedSecurityUpdate": "November 2026 security update (example)", "CVEs": 3, "Devices": 1}]))
    write("graph/hunting/exposed-devices.json", hunting([("DeviceName", "String"), ("ExposureLevel", "String"), ("IsInternetFacing", "Boolean"), ("AssetValue", "String"), ("MachineGroup", "String")], [
        {"DeviceName": "srv-app01.contoso.example", "ExposureLevel": "High", "IsInternetFacing": True, "AssetValue": "High", "MachineGroup": "Servers"},
        {"DeviceName": "wks-r2-01.contoso.example", "ExposureLevel": "High", "IsInternetFacing": False, "AssetValue": "Normal", "MachineGroup": "Ring2-Workstations"},
        {"DeviceName": "wks-old-07.contoso.example", "ExposureLevel": "High", "IsInternetFacing": False, "AssetValue": "Normal", "MachineGroup": "Unassigned"}]))
    mde, mdi, mdca, mdo = ("Microsoft Defender for Endpoint", "Microsoft Defender for Identity", "Microsoft Defender for Cloud Apps", "Microsoft Defender for Office 365")
    write("graph/hunting/cross-source-users.json", hunting([("AccountObjectId", "String"), ("AccountUpn", "String"), ("Sources", "Int64"), ("SourceList", "Dynamic"), ("Alerts", "Int64")], [
        {"AccountObjectId": "11111111-0000-0000-0000-000000000001", "AccountUpn": f"j.rivera@{DOMAIN}", "Sources": 3, "SourceList": [mde, mdi, mdo], "Alerts": 5},
        {"AccountObjectId": "11111111-0000-0000-0000-000000000002", "AccountUpn": f"a.chen@{DOMAIN}", "Sources": 2, "SourceList": [mde, mdca], "Alerts": 2},
        {"AccountObjectId": "11111111-0000-0000-0000-000000000003", "AccountUpn": f"breakglass01@{DOMAIN}", "Sources": 2, "SourceList": [mdi, mdca], "Alerts": 2}]))

    def inc(i, name, sev, status, created, assigned=None, cls=None, det=None, alerts=1):
        return {"id": str(i), "displayName": name, "severity": sev, "status": status, "createdDateTime": created, "lastUpdateDateTime": created,
                "assignedTo": assigned, "classification": cls or "unknown", "determination": det or "unknown",
                "incidentWebUrl": f"https://security.microsoft.com/incidents/{i}?tid={TENANT}",
                "alerts": [{"id": f"da{i}{k:02d}", "title": f"{name} (alert {k + 1})", "severity": sev, "serviceSource": "microsoftDefenderForEndpoint"} for k in range(alerts)]}
    write("graph/incidents.json", {"@odata.context": "https://graph.microsoft.com/v1.0/$metadata#security/incidents(alerts())", "value": [
        inc(1001, "Encoded PowerShell launched by an Office application on one endpoint", "high", "active", "2026-11-16T09:00:00Z", f"analyst1@{DOMAIN}", alerts=2),
        inc(1002, "Suspicious LSASS access on one endpoint", "high", "active", "2026-11-16T08:30:00Z", alerts=3),
        inc(1003, "Unusual sign-in followed by mailbox rule creation", "medium", "active", "2026-11-16T02:00:00Z"),
        inc(1004, "Malware blocked on one endpoint", "low", "resolved", "2026-11-12T14:00:00Z", f"analyst2@{DOMAIN}", "truePositive", "malware"),
        inc(1005, "Suspicious file download from a cloud app", "medium", "resolved", "2026-11-10T10:00:00Z", f"analyst2@{DOMAIN}"),
        inc(1006, "Detection test on a ring 0 device", "informational", "resolved", "2026-11-03T15:00:00Z", f"analyst1@{DOMAIN}", "informationalExpectedActivity", "securityTesting"),
        inc(1007, "Attack Surface Reduction rule blocked content from email", "medium", "inProgress", "2026-11-15T20:00:00Z", f"analyst3@{DOMAIN}"),
    ]})
    office_q = "DeviceProcessEvents | where InitiatingProcessFileName in~ ('winword.exe','excel.exe','outlook.exe') | where FileName == 'powershell.exe' | where ProcessCommandLine has '-enc'"
    deployed = [rule_office(office_q, "disabled"), {
        "@odata.type": "#microsoft.graph.security.detectionRule", "id": "contoso-legacy-rdp-rule", "displayName": "Legacy RDP rule made in the portal", "status": "enabled",
        "queryCondition": {"queryText": "DeviceLogonEvents | where LogonType == 'RemoteInteractive'"}, "schedule": {"frequency": "PT24H"},
        "detectionAction": {"alertTemplate": {"title": "RDP logon", "severity": "low", "description": "", "recommendedActions": "", "entityMappings": {}, "tactics": []}}}]
    write("graph/detection-rules.json", {"@odata.context": "https://graph.microsoft.com/v1.0/$metadata#security/rules/detectionRules", "value": deployed})
    proc = [("Timestamp", "DateTime"), ("DeviceId", "String"), ("DeviceName", "String"), ("FileName", "String"), ("ProcessCommandLine", "String")]
    row = lambda d, f, c: {"Timestamp": "2026-11-03T10:15:00Z", "DeviceId": "0" * 39 + "1", "DeviceName": d, "FileName": f, "ProcessCommandLine": c}
    write("graph/hunting/rule-contoso-office-encoded-powershell-knownBad.json", hunting(proc, [row("wks-r0-01.contoso.example", "powershell.exe", "powershell.exe -enc SQBFAFgA (replayed test)")]))
    write("graph/hunting/rule-contoso-office-encoded-powershell-knownGood.json", hunting(proc, []))
    write("graph/hunting/rule-contoso-lsass-dump-tool-knownBad.json", hunting(proc, [row("wks-r0-02.contoso.example", "procdump.exe", "procdump.exe -ma lsass.exe (replayed test)"), row("wks-r0-02.contoso.example", "procdump64.exe", "procdump64.exe -ma lsass.exe (replayed test)")]))
    write("graph/hunting/rule-contoso-lsass-dump-tool-knownGood.json", hunting(proc, []))
    write("graph/hunting/rule-contoso-admin-share-copy-knownBad.json", hunting(proc, [row("srv-file01.contoso.example", "cmd.exe", r"cmd.exe /c copy tool.exe \\srv-app01\admin$ (replayed test)")]))
    write("graph/hunting/rule-contoso-admin-share-copy-knownGood.json", hunting(proc, [row("srv-file01.contoso.example", "cmd.exe", r"cmd.exe /c copy backup.cab \\srv-app01\admin$") for _ in range(3)]))


def rule_office(q: str, status: str) -> dict:
    # Learn's example body (Create detectionRule), with the program's id and status, and no automated actions.
    return {
        "@odata.type": "#microsoft.graph.security.detectionRule", "id": "contoso-office-encoded-powershell",
        "displayName": "Suspicious encoded PowerShell from Office", "description": "Encoded PowerShell launched by an Office application.", "status": status,
        "queryCondition": {"queryText": q}, "schedule": {"frequency": "PT1H"},
        "detectionAction": {"alertTemplate": {
            "title": "Suspicious encoded PowerShell from Office", "description": "An Office app launched an encoded PowerShell command.", "severity": "high",
            "recommendedActions": "Investigate the parent document and the user's recent email.",
            "entityMappings": {"hosts": [{"deviceIdColumn": "DeviceId", "nameColumn": "DeviceName"}]},
            "tactics": [{"tactic": "Execution", "techniques": [{"technique": "T1059.001"}]}]}}}


def rules() -> None:
    q = "DeviceProcessEvents | where InitiatingProcessFileName in~ ('winword.exe','excel.exe','outlook.exe') | where FileName == 'powershell.exe' | where ProcessCommandLine has '-enc'"
    write("rules/contoso-office-encoded-powershell.json", rule_office(q, "enabled"))
    write("rules/contoso-lsass-dump-tool.json", {
        "@odata.type": "#microsoft.graph.security.detectionRule", "id": "contoso-lsass-dump-tool", "displayName": "LSASS memory dump with a dump tool",
        "description": "A process dump tool was pointed at LSASS.", "status": "disabled",
        "queryCondition": {"queryText": "DeviceProcessEvents | where FileName in~ ('procdump.exe','procdump64.exe') | where ProcessCommandLine has 'lsass'"},
        "schedule": {"frequency": "PT1H"},
        "detectionAction": {"alertTemplate": {"title": "LSASS memory dump with a dump tool", "description": "A process dump tool targeted LSASS.", "severity": "high",
                                              "recommendedActions": "Check who ran the tool and whether credentials were exposed.", "entityMappings": {"hosts": [{"deviceIdColumn": "DeviceId", "nameColumn": "DeviceName"}]},
                                              "tactics": [{"tactic": "CredentialAccess", "techniques": [{"technique": "T1003.001"}]}]}}})
    write("rules/contoso-admin-share-copy.json", {
        "@odata.type": "#microsoft.graph.security.detectionRule", "id": "contoso-admin-share-copy", "displayName": "Executable copied to an administrative share",
        "description": "A command copied a file to admin$ on another host.", "status": "disabled",
        "queryCondition": {"queryText": "DeviceProcessEvents | where ProcessCommandLine has 'admin$' and ProcessCommandLine has 'copy'"},
        "schedule": {"frequency": "PT3H"},
        "detectionAction": {"alertTemplate": {"title": "Executable copied to an administrative share", "description": "", "severity": "medium",
                                              "recommendedActions": "Check the source host and the account.", "entityMappings": {"hosts": [{"deviceIdColumn": "DeviceId", "nameColumn": "DeviceName"}]},
                                              "tactics": [{"tactic": "LateralMovement", "techniques": [{"technique": "T1021.002"}]}]},
                            "automatedActions": {"isolateDevices": [{"deviceIdColumn": "DeviceId", "isolationType": "full"}]}}})
    for rid, bad, good in (("contoso-office-encoded-powershell", 1, 0), ("contoso-lsass-dump-tool", 1, 0), ("contoso-admin-share-copy", 1, 1)):
        write(f"rules/{rid}.test.json", {"tables": ["DeviceProcessEvents"],
                                         "knownBad": {"timespan": "2026-11-03T00:00:00Z/2026-11-04T00:00:00Z", "minRows": bad, "source": "ring 0 replay under a change record"},
                                         "knownGood": {"timespan": "2026-11-10T00:00:00Z/2026-11-11T00:00:00Z", "maxRows": good, "source": "a quiet business day"}})


def settings() -> None:
    write("settings.lab.json", {
        "_comment": "Lab 1's settings: the fictional contoso.example tenant, fixture inputs. Names and IDs only, never a secret.",
        "environment": "lab", "cloud": "gcc", "tenantId": TENANT, "tenantDomain": DOMAIN,
        "pimGroups": ["SG-XDR-Readers", "SG-XDR-Assessor-ReadOnly", "SG-XDR-Responders", "SG-XDR-DetectionEngineers", "SG-XDR-Tier0"],
        "emergencyAccessGroups": ["SG-EmergencyAccess"],
        "emergencyAccessAccounts": [f"breakglass01@{DOMAIN}", f"breakglass02@{DOMAIN}"],
        "detections": {"deployVia": "graph"},
        "inputs": {
            "inventory": "inputs/inventory.csv", "exceptions": "inputs/exceptions.csv", "roleExport": "inputs/role-export.csv",
            "deviceStates": "devices", "prevention": "inputs/prevention-plan.json", "asrPlan": "inputs/asr-plan.json",
            "asrExclusions": "inputs/asr-exclusions.csv", "owners": "inputs/owners.json", "rules": "rules",
            "deviceGroups": "inputs/device-groups.csv", "automationExclusions": "inputs/automation-exclusions.csv", "exercise": "inputs/exercise.csv"}})


if __name__ == "__main__":
    inputs()
    device_states()
    graph()
    rules()
    settings()
    print("fixtures written to", HERE)
