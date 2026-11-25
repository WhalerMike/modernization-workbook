#!/usr/bin/env python3
"""Write the Information Protection kit's fixtures: a fictional tenant (contoso.example) as the read cmdlets
would answer, two baseline exports a month apart, a synthetic-event search, and the agency inputs.

    python tests/fixtures/make_fixtures.py      # from examples/information-protection

Everything is fictional. The property names follow the cmdlets' parameter names on Microsoft Learn; Learn
doesn't list the cmdlets' output properties, so a real export may differ, and Lab 2 compares the two.
The faults are the ones the workbook's labs find; each is named where it is made.
"""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
TENANT_ID = "00000000-0000-4000-8000-0000000000c0"
DOMAIN = "contoso.example"
ALL = f"{DOMAIN}:VIEW,VIEWRIGHTSDATA,DOCEDIT,EDIT,PRINT,EXTRACT,REPLY,REPLYALL,FORWARD,OBJMODEL"
HOLDERS = f"fti-holders@{DOMAIN}:VIEW,VIEWRIGHTSDATA,DOCEDIT,EDIT,REPLY,REPLYALL,OBJMODEL"


def guid(n: int) -> str:
    return f"00000000-0000-4000-9000-{n:012d}"


def label(n, name, prio, *, display=None, parent=None, ctype="File, Email, Meeting", enc=False, rights="", header="", **extra):
    d = {"Name": name, "DisplayName": display or name, "Guid": guid(n), "Priority": prio, "ParentId": parent or "",
         "ContentType": ctype, "Disabled": False, "EncryptionEnabled": enc, "EncryptionRightsDefinitions": rights,
         "ApplyContentMarkingHeaderEnabled": bool(header), "ApplyContentMarkingHeaderText": header}
    d.update(extra)
    return d


def site(n, name, prio, privacy, guests):
    return label(n, name, prio, ctype="Site, UnifiedGroup", SiteAndGroupProtectionEnabled=True,
                 SiteAndGroupProtectionPrivacy=privacy, SiteAndGroupProtectionAllowAccessToGuestUsers=guests)


def tenant_nov() -> dict:
    labels = [
        label(1, "Public", 0),
        label(2, "Internal", 1),
        label(3, "CUI", 2),
        label(4, "CUI Basic", 3, parent="CUI", enc=True, rights=ALL, header="CUI"),
        # Fault: a person added to the CUI Specified label's rights, outside the holders group (and drift, no ticket).
        label(5, "CUI-SP-TAX", 4, display="CUI//SP-TAX", parent="CUI", enc=True,
              rights=HOLDERS + f";j.doe@{DOMAIN}:VIEW,VIEWRIGHTSDATA", header="CUI//SP-TAX"),
        site(6, "Internal site", 5, "Private", True),
        site(7, "CUI site", 6, "Private", True),
        # Fault: the CUI Specified site label lets guests in; the plan says it doesn't.
        site(8, "CUI Specified site", 7, "Private", True),
        # Fault: a label the plan doesn't have.
        label(9, "Confidential-Legacy", 8, display="Confidential (legacy)"),
    ]
    policies = [
        # Fault: the production policy lost the CUI Specified site label (and drift, no ticket).
        {"Name": "B20-Labels-All", "Priority": 0,
         "Labels": ["Public", "Internal", "CUI", "CUI Basic", "Internal site", "CUI site"],
         "ExchangeLocation": [{"Name": "All"}], "ExchangeLocationException": [{"Name": f"b20-label-exclusions@{DOMAIN}"}],
         "Settings": ["[mandatory, true]", f"[defaultlabelid, {guid(2)}]", f"[outlookdefaultlabel, {guid(2)}]",
                      f"[teamworkdefaultlabelid, {guid(6)}]", "[teamworkmandatory, true]"]},
        {"Name": "B20-Labels-CUI-SP", "Priority": 1, "Labels": ["CUI-SP-TAX"],
         "ExchangeLocation": [{"Name": f"fti-holders@{DOMAIN}"}], "ExchangeLocationException": [], "Settings": []},
    ]
    dlp = [
        {"Name": "FMP-DLP-CUI-ExternalEmail-v2", "Mode": "Enable", "Enabled": True, "Workload": "Exchange",
         "ExchangeLocation": [{"Name": "All"}], "ExchangeSenderMemberOfException": [{"Name": f"dlp-exceptions@{DOMAIN}"}],
         "Comment": "Outcome: CUI is not sent outside the tenant except through the approved partner path."},
        # Fault: the retired ring version is back in simulation with tips (and drift, no ticket).
        {"Name": "FMP-DLP-CUI-ExternalEmail-v1", "Mode": "TestWithNotifications", "Enabled": True, "Workload": "Exchange",
         "ExchangeLocation": [{"Name": "All"}], "ExchangeSenderMemberOfException": []},
        {"Name": "FMP-DLP-Endpoint-CUI-SP-v1", "Mode": "Enable", "Enabled": True, "Workload": "EndpointDevices",
         "ExchangeLocation": [], "ExchangeSenderMemberOfException": []},
        {"Name": "B20-Copilot-Exclude-CUI-SP", "Mode": "TestWithoutNotifications", "Enabled": True, "Workload": "Applications",
         "ExchangeLocation": [], "ExchangeSenderMemberOfException": []},
    ]
    rules = [
        # Fault: oldpartner.example is an exception whose register entry expired.
        {"Name": "Block external send of CUI v2", "ParentPolicyName": "FMP-DLP-CUI-ExternalEmail-v2", "Disabled": False,
         "BlockAccess": True, "NotifyAllowOverride": "", "ExceptIfRecipientDomainIs": ["partner.example", "oldpartner.example"]},
        {"Name": "Block external send of CUI", "ParentPolicyName": "FMP-DLP-CUI-ExternalEmail-v1", "Disabled": False,
         "BlockAccess": True, "NotifyAllowOverride": "WithJustification", "ExceptIfRecipientDomainIs": []},
        {"Name": "Audit CUI Specified on devices", "ParentPolicyName": "FMP-DLP-Endpoint-CUI-SP-v1", "Disabled": False,
         "BlockAccess": False, "NotifyAllowOverride": "", "ExceptIfRecipientDomainIs": []},
        {"Name": "B20-Copilot-Exclude-CUI-SP-Rule", "ParentPolicyName": "B20-Copilot-Exclude-CUI-SP", "Disabled": False,
         "BlockAccess": False, "NotifyAllowOverride": "", "ExceptIfRecipientDomainIs": []},
    ]
    auto = [
        {"Name": "FMP-Auto-CUIBasic-Batch1-v1", "Mode": "Enable", "Enabled": True, "SharePointLocation": [{"Name": f"https://contoso.sharepoint.example/sites/case-files"}]},
        # Fault: batch 2 is labeling, but the plan still has it in simulation (and drift, no ticket).
        {"Name": "FMP-Auto-CUIBasic-Batch2-v1", "Mode": "Enable", "Enabled": True, "SharePointLocation": [{"Name": f"https://contoso.sharepoint.example/sites/benefits"}]},
    ]
    auto_rules = [
        {"Name": "SSN high confidence in SharePoint", "ParentPolicyName": "FMP-Auto-CUIBasic-Batch1-v1", "Workload": "SharePoint"},
        {"Name": "SSN high confidence in SharePoint batch 2", "ParentPolicyName": "FMP-Auto-CUIBasic-Batch2-v1", "Workload": "SharePoint"},
    ]
    sits = [
        {"Name": "U.S. Social Security Number (SSN)", "Id": "a44669fe-0d48-453d-a9b1-2cc83f2cba77", "Publisher": "Microsoft Corporation"},
        {"Name": "U.S. Individual Taxpayer Identification Number (ITIN)", "Id": "e55e2a32-f92d-4985-a35d-a0b269eb687b", "Publisher": "Microsoft Corporation"},
        {"Name": "U.S. Bank Account Number", "Id": "a2ce32a8-f935-4bb6-8e96-2a5157672e2c", "Publisher": "Microsoft Corporation"},
        {"Name": "Contoso Case Number", "Id": "00000000-0000-4000-a000-000000000001", "Publisher": "Contoso Information Protection"},
    ]
    return {
        "Get-Label": labels, "Get-LabelPolicy": policies,
        "Get-AutoSensitivityLabelPolicy": auto, "Get-AutoSensitivityLabelRule": auto_rules,
        "Get-DlpCompliancePolicy": dlp, "Get-DlpComplianceRule": rules, "Get-DlpSensitiveInformationType": sits,
        "Get-PolicyConfig": [{"EnableLabelCoauth": True}],
        "Get-UnifiedAuditLogRetentionPolicy": [
            {"Name": "FMP-Audit-InfoProtection-1y", "Priority": 200, "RetentionDuration": "TwelveMonths",
             "RecordTypes": ["SensitivityLabelAction", "MipLabel", "ComplianceDLPExchange", "ComplianceDLPSharePoint", "DLPEndpoint"]},
            {"Name": "FMP-Audit-Pilot-TestUser", "Priority": 100, "RetentionDuration": "TwelveMonths", "RecordTypes": []}],
        "Get-IRMConfiguration": [{"AzureRMSLicensingEnabled": True, "SimplifiedClientAccessEnabled": True,
                                  "DecryptAttachmentForEncryptOnly": False, "InternalLicensingEnabled": True}],
        "Get-AdminAuditLogConfig": [{"UnifiedAuditLogIngestionEnabled": True, "AdminAuditLogEnabled": True}],
        "Get-TransportRule": [
            {"Name": "Encrypt external [secure]", "State": "Enabled", "Mode": "Enforce", "Priority": 0, "ApplyRightsProtectionTemplate": "Encrypt"},
            # Fault: the partner rule is still in audit mode; the plan says enforce.
            {"Name": "Partner Do Not Forward", "State": "Enabled", "Mode": "Audit", "Priority": 1, "ApplyRightsProtectionTemplate": "Do Not Forward"}],
        # Fault: social ID sign-in is on; the plan turned it off.
        "Get-OMEConfiguration": [{"Identity": "OME Configuration", "OTPEnabled": True, "SocialIdSignIn": True}],
        # Fault: the super user feature was left on, with a standing super user (and drift, no ticket).
        "Get-AipServiceConfiguration": [{"FunctionalState": "Enabled", "SuperUsersEnabled": "Enabled",
                                         "SuperUsers": [f"recovery.operator@{DOMAIN}"]}],
        "Get-ConnectionInformation": [
            {"State": "Connected", "IsEopSession": True, "TenantID": TENANT_ID, "UserPrincipalName": f"ip-reader@{DOMAIN}"},
            {"State": "Connected", "IsEopSession": False, "TenantID": TENANT_ID, "UserPrincipalName": f"ip-reader@{DOMAIN}"}],
    }


def oct_from(nov: dict) -> dict:
    t = copy.deepcopy(nov)
    by = lambda k, n: next(x for x in t[k] if x["Name"] == n)  # noqa: E731
    by("Get-Label", "CUI Basic")["EncryptionRightsDefinitions"] = f"{DOMAIN}:VIEW,VIEWRIGHTSDATA,DOCEDIT,EDIT,REPLY,REPLYALL,OBJMODEL"
    by("Get-Label", "CUI-SP-TAX")["EncryptionRightsDefinitions"] = HOLDERS
    by("Get-LabelPolicy", "B20-Labels-All")["Labels"].append("CUI Specified site")
    by("Get-DlpCompliancePolicy", "FMP-DLP-CUI-ExternalEmail-v1")["Mode"] = "Disable"
    by("Get-AutoSensitivityLabelPolicy", "FMP-Auto-CUIBasic-Batch2-v1")["Mode"] = "TestWithoutNotifications"
    by("Get-UnifiedAuditLogRetentionPolicy", "FMP-Audit-InfoProtection-1y")["RetentionDuration"] = "SixMonths"
    t["Get-AipServiceConfiguration"][0].update(SuperUsersEnabled="Disabled", SuperUsers=[])
    return t


CLASSES = [
    {"class": "CUI-PRIVACY", "owner": "Senior agency official for privacy", "label": "CUI Basic", "sits": "U.S. Social Security Number (SSN)"},
    # Fault: a type the tenant doesn't have.
    {"class": "CUI-SP-TAX", "owner": "CUI program manager", "label": "CUI//SP-TAX",
     "sits": "U.S. Individual Taxpayer Identification Number (ITIN); Federal Tax Account Number"},
    # Fault: no owner.
    {"class": "CASE-RECORDS", "owner": "", "label": "CUI Basic", "sits": "Contoso Case Number"},
    {"class": "INTERNAL", "owner": "Office of the CIO", "label": "Internal", "sits": ""},
]
COUNTS = {("U.S. Social Security Number (SSN)", "EXO"): 412, ("U.S. Social Security Number (SSN)", "ODB"): 1290,
          ("U.S. Social Security Number (SSN)", "SharePoint"): 3874,
          ("U.S. Individual Taxpayer Identification Number (ITIN)", "EXO"): 37,
          ("U.S. Individual Taxpayer Identification Number (ITIN)", "ODB"): 12,
          ("U.S. Individual Taxpayer Identification Number (ITIN)", "SharePoint"): 205,
          ("Contoso Case Number", "EXO"): 0, ("Contoso Case Number", "ODB"): 88, ("Contoso Case Number", "SharePoint"): 1561}
ROLE_MEMBERS = {
    # Fault: someone holds the investigator role who isn't in the register.
    "Insider Risk Management Investigators": [{"Name": "inv.one", "WindowsLiveID": f"inv.one@{DOMAIN}"},
                                              {"Name": "extra.person", "WindowsLiveID": f"extra.person@{DOMAIN}"}],
    "Communication Compliance Investigators": [{"Name": "cc.one", "WindowsLiveID": f"cc.one@{DOMAIN}"}],
}
CALLS = json.loads((HERE.parent.parent / "config" / "calls.json").read_text(encoding="utf-8"))["calls"]


def write(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def fname(v: str) -> str:
    return "".join(c if c.isalnum() or c in "_-" else "_" for c in v)


def snapshot(t: dict, folder: Path, as_of: str) -> None:
    global KNOWN
    KNOWN = {x["Name"] for x in t["Get-DlpSensitiveInformationType"]}
    files = {}
    for c in CALLS:
        if c.get("perRoleGroup"):
            data = [{"Name": g, "Members": m} for g, m in sorted(ROLE_MEMBERS.items())]
        elif c.get("perClass"):
            data = [{"class": cl["class"], "tagType": "SensitiveInformationType", "tagName": s, "workload": w,
                     "totalCount": COUNTS.get((s, w), 0)}
                    for cl in CLASSES for s in [x for x in cl["sits"].split("; ") if x and x in KNOWN] for w in ("EXO", "ODB", "SharePoint")]
        else:
            data = t[c["cmdlet"]]
            if c.get("select"):
                data = [{k: x[k] for k in c["select"]} for x in data]
        write(folder / c["file"], data)
    for p in sorted(folder.glob("*.json")):
        if p.name != "manifest.json":
            files[p.name] = hashlib.sha256(p.read_bytes()).hexdigest()
    write(folder / "manifest.json", {"schema": "fmp-ip-manifest/1", "task": "export", "asOf": as_of, "mode": "Fixture",
                                     "environment": "lab", "cloud": "gcc", "kit": "examples/information-protection",
                                     "result": "Pass", "snapshot": None, "tenantId": TENANT_ID, "files": files})


def tenant_folder(t: dict, folder: Path) -> None:
    for k, v in t.items():
        write(folder / f"{k}.json", v)
    for g, m in ROLE_MEMBERS.items():
        write(folder / "Get-RoleGroupMember" / f"{fname(g)}.json", m)
    for (s, w), n in COUNTS.items():
        write(folder / "Export-ContentExplorerData" / f"{fname(s)}__{w}.json",
              [{"TotalCount": n, "MorePagesAvailable": False, "RecordsReturned": 0, "PageCookie": ""}])
    write(folder / "Search-UnifiedAuditLog.json", SYNTHETIC_EVENTS)


SYNTHETIC_EVENTS = [
    {"CreationDate": "2026-11-24T10:12:00Z", "UserIds": f"test.user@{DOMAIN}", "Operations": "FileSensitivityLabelApplied", "RecordType": "SharePointFileOperation"},
    {"CreationDate": "2026-11-24T09:48:00Z", "UserIds": f"test.user@{DOMAIN}", "Operations": "CopilotInteraction", "RecordType": "CopilotInteraction"},
    # Fault: the label removal surfaced 5.5 hours after the test started; the plan's target is 4.
    {"CreationDate": "2026-11-24T14:30:00Z", "UserIds": f"test.user@{DOMAIN}", "Operations": "FileSensitivityLabelRemoved", "RecordType": "SharePointFileOperation"},
]


def csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    q = lambda v: '"' + str(v).replace('"', '""') + '"'  # noqa: E731
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join([",".join(q(h) for h in header)] + [",".join(q(v) for v in r) for r in rows]) + "\n", encoding="utf-8", newline="\n")


def main() -> None:
    nov = tenant_nov()
    tenant_folder(nov, HERE / "tenant")
    snapshot(oct_from(nov), HERE / "snapshots" / "2026-10-24", "2026-10-24T12:00:00Z")
    snapshot(nov, HERE / "snapshots" / "2026-11-24", "2026-11-24T08:00:00Z")
    write(HERE / "synthetic" / "2026-11-24.json", {
        "startedAt": "2026-11-24T09:00:00Z", "searchedAt": "2026-11-24T15:00:00Z", "user": f"test.user@{DOMAIN}",
        "operations": ["FileSensitivityLabelApplied", "FileSensitivityLabelRemoved", "CopilotInteraction"],
        "events": SYNTHETIC_EVENTS})
    inp = HERE / "inputs"
    csv(inp / "class-register.csv", ["class", "owner", "label", "sits"], [[c["class"], c["owner"], c["label"], c["sits"]] for c in CLASSES])
    csv(inp / "role-register.csv", ["roleGroup", "member", "approvedBy", "reviewBy"], [
        ["Insider Risk Management Investigators", f"inv.one@{DOMAIN}", "Insider risk charter board", "2027-02-01"],
        # Warning: this review is overdue.
        ["Communication Compliance Investigators", f"cc.one@{DOMAIN}", "Insider risk charter board", "2026-11-01"]])
    csv(inp / "exceptions.csv", ["id", "kind", "policy", "target", "approver", "expires", "reason"], [
        ["EXC-001", "dlp-recipient-domain", "FMP-DLP-CUI-ExternalEmail-v2", "partner.example", "CUI program manager", "2027-06-30", "Partner agreement on file"],
        ["EXC-002", "dlp-recipient-domain", "FMP-DLP-CUI-ExternalEmail-v2", "oldpartner.example", "CUI program manager", "2026-10-31", "Agreement ended; remove the exception"],
        ["EXC-003", "dlp-sender-group", "FMP-DLP-CUI-ExternalEmail-v2", f"dlp-exceptions@{DOMAIN}", "Platform owner", "2027-03-31", "Mailroom scanning service"]])
    csv(inp / "changes.csv", ["id", "file", "item", "approved", "summary"], [
        ["CHG-1042", "labels.json", "CUI Basic", "2026-11-03", "CUI Basic adds PRINT, EXTRACT and FORWARD for tenant users"],
        ["CHG-1050", "audit-retention-policies.json", "FMP-Audit-InfoProtection-1y", "2026-11-05", "Information protection audit retention to one year"],
        ["CHG-0990", "dlp-policies.json", "FMP-DLP-CUI-ExternalEmail-v2", "2026-09-01", "Ring 3: production version enforced"]])


if __name__ == "__main__":
    main()
