"""Write the fictional Zero Trust Assessment exports the kit's tests and Lab 1 read.

The shape follows what Zero Trust Assessment release 3.1.0 writes to
<Path>/zt-export/ZeroTrustAssessmentReport.json (Get-ZtAssessmentResults.ps1 and
Add-ZtTestResultDetail.ps1 at tag 3.1.0): run metadata, a per-pillar summary, a Tests array whose
items carry TestId, TestTitle, TestStatus, TestSkipped, SkippedReason, TestRisk, TestImpact,
TestImplementationCost, TestPillar (a string or an array), TestCategory, TestMinimumLicense,
TestDescription and TestResult, then TenantInfo and the EndOfJson marker. Test IDs, titles, pillars,
risk levels, costs, impacts and licenses are those the 3.1.0 tests declare. Everything else is
fictional: the tenant is Contoso, the results describe no real organization, and no TestResult text
names a real object.

    python tests/fixtures/make_fixtures.py        # rewrite both runs from this file
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKIP_TEXT = {
    "NotConnectedAzure": "Not connected to Azure.",
    "NotConnectedExchange": "Not connected to Exchange Online.",
    "NotLicensedEntraWorkloadID": "This test is for tenants that are licensed for Entra Workload ID.",
    "NotApplicable": "This test is not applicable to the current environment.",
    "NotConnectedToService": 'This test requires connection to the service(s) "SharePointOnline" currently disconnected.  Please use _Connect-ZtAssessment_ to connect.',
    "NoCompatibleLicenseFound": 'This test requires one of the following licenses: ("AAD_PREMIUM") OR ("AGENT_365").',
    "TimeoutReached": "This test was not completed because the report execution exceeded the expected time frame.",
    "UnderConstruction": "",
}

# id, title, pillar, risk, cost, impact, category, license, run 1 (status, skip), run 2 (status, skip)
TESTS = [
    ("21835", "Emergency access accounts are configured appropriately", "Identity", "High", "High", "Low", "Application management", ["P1"], ("Failed", ""), ("Passed", "")),
    ("21816", "All Microsoft Entra privileged role assignments are managed with PIM", "Identity", "High", "Medium", "Low", "Privileged access", ["P2"], ("Failed", ""), ("Failed", "")),
    ("21815", "All privileged role assignments are activated just in time and not permanently active", "Identity", "High", "High", "Low", "Privileged access", ["P2"], ("Failed", ""), ("Failed", "")),
    ("21781", "Privileged users sign in with phishing-resistant methods", "Identity", "High", "Medium", "Low", "Privileged access", ["P1"], ("Failed", ""), ("Failed", "")),
    ("21783", "Privileged Microsoft Entra built-in roles are targeted with Conditional Access policies to enforce phishing-resistant methods", "Identity", "High", "Medium", "Low", "Access control", ["P1"], ("Passed", ""), ("Failed", "")),
    ("21796", "Block legacy authentication policy is configured", "Identity", "Medium", "Low", "High", "Access control", ["P1"], ("Passed", ""), ("Passed", "")),
    ("21797", "Restrict access to high risk users", "Identity", "High", "Medium", "High", "Access control", ["P2"], ("Passed", ""), ("Passed", "")),
    ("21883", "Workload Identities are configured with risk-based policies", "Identity", "Medium", "Low", "High", "Access control", ["Workload"], ("Skipped", "NotLicensedEntraWorkloadID"), ("Skipped", "NotLicensedEntraWorkloadID")),
    ("21772", "Applications don't have secrets configured", "Identity", "High", "Medium", "Low", "Application management", ["Free"], ("Failed", ""), ("Failed", "")),
    ("21867", "Enterprise applications with high privilege Microsoft Graph API permissions have owners", "Identity", "High", "Medium", "Low", "Application management", ["P1"], ("Failed", ""), ("Passed", "")),
    ("21885", "App registrations use safe redirect URIs", "Identity", "High", "High", "Low", "Application management", ["P1"], ("Failed", ""), ("Failed", "")),
    ("21837", "Limit the maximum number of devices per user to 10", "Identity", "High", "Low", "Medium", "Devices", ["Free"], ("Investigate", ""), ("Investigate", "")),
    ("21812", "Maximum number of Global Administrators doesn't exceed eight users", "Identity", "Low", "Low", "Low", "Privileged access", ["P1"], ("Passed", ""), ("Passed", "")),
    ("21839", "Passkey authentication method enabled", "Identity", "High", "Medium", "Low", "Credential management", ["Free"], ("Passed", ""), ("Passed", "")),
    ("21861", "All high-risk users are triaged", "Identity", "High", "High", "Low", "Monitoring", ["P2"], ("Failed", ""), ("Failed", "")),
    ("21860", "Diagnostic settings are configured for all Microsoft Entra logs", "Identity", "High", "Medium", "Low", "Monitoring", None, ("Failed", ""), ("Skipped", "NotConnectedAzure")),
    ("21800", "All user sign-in activity uses strong authentication methods", "Identity", "Medium", "Medium", "Medium", "Monitoring", ["P1"], ("Planned", "UnderConstruction"), ("Planned", "UnderConstruction")),
    ("21813", "High Global Administrator to privileged user ratio", "Identity", "High", "Medium", "Low", "Privileged access", ["Free"], ("Passed", ""), ("Error", "")),
    ("21941", "Token protection policies are configured", "Identity", "Medium", "Medium", "Low", "Access control", ["P1"], None, ("Failed", "")),
    ("24824", "Conditional Access policies block access from noncompliant devices", "Devices", "High", "Low", "Medium", "Data", ["Intune"], ("Failed", ""), ("Passed", "")),
    ("24546", "Windows automatic device enrollment is enforced to eliminate risks from unmanaged endpoints", "Devices", "High", "Low", "Low", "Tenant", ["P1"], ("Passed", ""), ("Passed", "")),
    ("24574", "Attack Surface Reduction rules are applied to Windows devices to prevent exploitation of vulnerable system components", "Devices", "High", "Medium", "Medium", "Devices", ["Intune"], ("Failed", ""), ("Failed", "")),
    ("24548", "Data on iOS/iPadOS is protected by app protection policies", "Devices", "High", "Low", "High", "Data", ["Intune"], ("Error", ""), ("Passed", "")),
    ("25381", "Network traffic is routed through Global Secure Access for security policy enforcement", "Network", "High", "Medium", "Low", "Global Secure Access", ["Entra_Premium_Private_Access", "Entra_Premium_Internet_Access"], ("Failed", ""), ("Failed", "")),
    ("25533", "DDoS Protection is enabled for all Public IP Addresses in VNETs", "Network", "High", "Low", "Low", "Azure Network Security", ["DDoS_Network_Protection", "DDoS_IP_Protection"], ("Failed", ""), ("Failed", "")),
    ("27018", "Rate Limiting is Enabled in Azure Front Door WAF", "Network", "High", "Medium", "Low", "Azure Network Security", ["Azure_WAF"], ("Skipped", "NotApplicable"), ("Skipped", "NotApplicable")),
    ("25416", "Global Secure Access cloud firewall protects branch office internet traffic", "Network", "High", "Medium", "Low", "Global Secure Access", ["Entra_Premium_Internet_Access"], ("Skipped", "NotApplicable"), ("Skipped", "NotApplicable")),
    ("35003", "Sensitivity labels are configured", ["Data", "AI"], "High", "Medium", "Low", "sensitivity-labels", ["Microsoft 365 E3"], ("Failed", ""), ("Failed", "")),
    ("35024", "Azure Rights Management service is activated", ["Data", "AI"], "High", "Low", "High", "Rights Management Service", ["Microsoft 365 E3"], ("Passed", ""), ("Passed", "")),
    ("35005", "Sensitivity labels are enabled for SharePoint and OneDrive", ["Data", "AI"], "High", "Low", "Low", "SharePoint Online", ["MIP_P1"], ("Skipped", "NotConnectedToService"), ("Skipped", "NotConnectedToService")),
    ("41032", "Safe Links policies in Microsoft Defender for Office 365 are configured to scan and block malicious URLs", "SecOps", "High", "Low", "Low", "Email and collaboration security", ["ATP_ENTERPRISE"], ("Failed", ""), ("Skipped", "NotConnectedExchange")),
    ("41045", "All eligible endpoints are onboarded to Microsoft Defender for Endpoint", "SecOps", "High", "Medium", "Low", "Endpoint threat protection", ["WINDEFATP", "MDE_LITE"], ("Failed", ""), ("Failed", "")),
    ("41050", "Attack surface reduction (ASR) rules are enabled in block mode", "SecOps", "High", "Medium", "Medium", "Endpoint threat protection", ["WINDEFATP"], ("Skipped", "TimeoutReached"), ("Failed", "")),
    ("61009", "Conditional Access policies cover both agent identities and agent users", "AI", "High", "Low", "Low", "AI Identity & Access", ["AAD_PREMIUM", "AGENT_365"], ("Skipped", "NoCompatibleLicenseFound"), ("Skipped", "NoCompatibleLicenseFound")),
]

RUNS = {
    "run-2026-10-27": ("2026-10-27T14:05:31.4471023-04:00", 1),
    "run-2026-11-10": ("2026-11-10T13:52:08.9013377-05:00", 2),
}


def result_text(status: str, skip: str) -> str:
    if skip:
        return f"Skipped. {SKIP_TEXT[skip]}" if SKIP_TEXT[skip] else ""
    return {
        "Passed": "Fictional fixture: the configuration matched the recommendation.",
        "Failed": "Fictional fixture: one or more objects didn't match the recommendation.",
        "Investigate": "Fictional fixture: the result needs a manual review.",
        "Error": "An error occurred while running this test.",
    }[status]


def test_item(t, run: int) -> dict | None:
    tid, title, pillar, risk, cost, impact, cat, lic, r1, r2 = t
    st = r1 if run == 1 else r2
    if st is None:
        return None
    status, skip = st
    return {
        "TestImplementationCost": cost,
        "TestStatus": status,
        "TestResult": result_text(status, skip),
        "TestSkipped": skip,
        "TestTags": None,
        "TestDescription": f"Fictional fixture for test {tid}.",
        "TestId": tid,
        "TestMinimumLicense": lic,
        "TestRisk": risk,
        "TestPillar": pillar,
        "SkippedReason": SKIP_TEXT.get(skip) if skip and skip != "UnderConstruction" else None,
        "TestCategory": cat,
        "TestSfiPillar": None,
        "TestImpact": impact,
        "TestTitle": title,
        "TestAppliesTo": None,
    }


def summary(tests: list[dict]) -> dict:
    out = {}
    for p, key in (("Identity", "Identity"), ("Devices", "Devices"), ("Network", "Network"), ("Data", "Data"),
                   ("Infrastructure", "Infrastructure"), ("SecOps", "SecOps"), ("AI", "AI")):
        def has(t):
            tp = t["TestPillar"]
            return p in tp if isinstance(tp, list) else tp == p
        out[f"{key}Passed"] = sum(1 for t in tests if has(t) and t["TestStatus"] == "Passed")
        out[f"{key}Total"] = sum(1 for t in tests if has(t) and t["TestStatus"] not in ("Skipped", "Planned"))
    return out


def main() -> None:
    for name, (when, run) in RUNS.items():
        tests = [x for x in (test_item(t, run) for t in TESTS) if x]
        doc = {
            "ExecutedAt": when,
            "TenantId": "00001111-aaaa-2222-bbbb-3333cccc4444",
            "TenantName": "Contoso",
            "Domain": "contoso.example",
            "Account": "zta-reader@contoso.onmicrosoft.com",
            "CurrentVersion": "3.1.0",
            "LatestVersion": "3.1.0",
            "TestResultSummary": summary(tests),
            "Tests": tests,
            "TenantInfo": {"TenantOverview": {"Note": "Fictional fixture; the kit doesn't read TenantInfo."}},
            "EndOfJson": "EndOfJson",
        }
        out = HERE / name / "zt-export" / "ZeroTrustAssessmentReport.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
        print(f"{out.relative_to(HERE)}: {len(tests)} tests")


if __name__ == "__main__":
    main()
