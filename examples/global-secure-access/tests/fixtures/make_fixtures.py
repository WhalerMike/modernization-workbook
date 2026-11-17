#!/usr/bin/env python3
"""Write the Global Secure Access kit's fictional fixtures: one Contoso tenant at its pilot, and the same tenant at ring 1.

    python tests/fixtures/make_fixtures.py

Run from examples/global-secure-access. Everything is invented for the fictional tenant contoso.example: object IDs are
counting sequences, host names are under contoso.example, addresses are documentation ranges. Two Microsoft identifiers
are real and public because the guide uses them: the "All internet resources with Global Secure Access" application ID
and the built-in phishing-resistant authentication strength ID. The pilot folder has the defects the labs find; the
ring1 folder is the same tenant after the fixes, at the end of ring 1.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
TENANT = "11111111-1111-4111-8111-111111111111"
PILOT = "22222222-2222-4222-8222-222222222201"
EMERGENCY = "22222222-2222-4222-8222-222222222202"
ADMINS = "22222222-2222-4222-8222-222222222203"
RING2 = "22222222-2222-4222-8222-222222222204"
INTERNET_APP = "5dc48733-b5df-475c-a49b-fa307ef00853"     # Learn: All internet resources with Global Secure Access
PHISH_STRENGTH = "00000000-0000-0000-0000-000000000004"    # Learn: built-in phishing-resistant MFA strength
INTUNE_ENROLL = "33333333-3333-4333-8333-333333333301"
INTUNE = "33333333-3333-4333-8333-333333333302"
COMPLIANT_LOC = "44444444-4444-4444-8444-444444444401"


def gid(n: int) -> str:
    return f"55555555-5555-4555-8555-{n:012d}"


def write(folder: Path, name: str, value) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8", newline="\n")


def tenant_pilot() -> dict:
    t: dict = {}
    t["subscribed-skus.json"] = {"value": [
        {"skuPartNumber": "FIXTURE-ENTRA-ID-P1", "capabilityStatus": "Enabled", "consumedUnits": 412,
         "prepaidUnits": {"enabled": 500, "suspended": 0, "warning": 0}},
        {"skuPartNumber": "FIXTURE-ENTRA-SUITE", "capabilityStatus": "Enabled", "consumedUnits": 18,
         "prepaidUnits": {"enabled": 25, "suspended": 0, "warning": 0}}]}
    t["tenant-status.json"] = {"onboardingStatus": "onboarded", "onboardingErrorMessage": None}
    t["forwarding-profiles.json"] = {"value": [
        {"id": gid(1), "name": "Microsoft traffic profile", "trafficForwardingType": "m365", "state": "enabled", "priority": 0, "policies": []},
        {"id": gid(2), "name": "Private Access profile", "trafficForwardingType": "private", "state": "enabled", "priority": 1, "policies": []},
        {"id": gid(3), "name": "Internet Access profile", "trafficForwardingType": "internet", "state": "enabled", "priority": 2, "policies": []}]}
    t["filtering-policies.json"] = {"value": [
        {"id": gid(11), "name": "NET-WCF-Block-HighRisk", "action": "block", "policyRules": [
            {"name": "Categories", "ruleType": "webCategory", "destinations": [
                {"name": "ArtificialIntelligence"}, {"name": "Gambling"}]}]},
        {"id": gid(12), "name": "NET-TI-Block-Malicious", "action": "block", "policyRules": [
            {"name": "Threat intelligence", "ruleType": "threatIntelligence", "destinations": []}]}]}
    t["filtering-profiles.json"] = {"value": [
        {"id": gid(21), "name": "Baseline profile", "state": "enabled", "priority": 65000, "policies": [],
         "conditionalAccessPolicies": []},
        {"id": gid(22), "name": "SP-Pilot", "state": "enabled", "priority": 100, "policies": [
            {"id": gid(23), "priority": 100, "state": "enabled", "loggingState": "enabled",
             "@odata.type": "#microsoft.graph.networkaccess.filteringPolicyLink", "policy": {"id": gid(11)}},
            {"id": gid(24), "priority": 200, "state": "enabled", "loggingState": "enabled",
             "@odata.type": "#microsoft.graph.networkaccess.tlsInspectionPolicyLink", "policy": {"id": gid(31)}}],
         "conditionalAccessPolicies": [{"id": gid(42), "displayName": "NET-IA-SecurityProfile-Pilot"}]}]}
    t["ca-signaling.json"] = {"signalingStatus": "enabled"}
    t["tenant-tagging.json"] = {"networkPacketTaggingStatus": "enabled"}
    t["connector-groups.json"] = {"value": [
        {"id": gid(51), "name": "CG-HQ", "connectorGroupType": "applicationProxy", "isDefault": False, "region": "nam"},
        {"id": gid(52), "name": "CG-Cloud-East", "connectorGroupType": "applicationProxy", "isDefault": False, "region": "nam"}]}
    t["connectors.json"] = {"value": [
        {"id": gid(61), "machineName": "con01.contoso.example", "externalIp": "203.0.113.11", "status": "active", "version": "1.5.4522.0", "connectorGroupId": gid(51)},
        {"id": gid(62), "machineName": "con02.contoso.example", "externalIp": "203.0.113.12", "status": "active", "version": "1.5.4522.0", "connectorGroupId": gid(51)},
        {"id": gid(63), "machineName": "con11.contoso.example", "externalIp": "203.0.113.21", "status": "active", "version": "1.5.3437.0", "connectorGroupId": gid(52)},
        {"id": gid(64), "machineName": "con12.contoso.example", "externalIp": "203.0.113.22", "status": "inactive", "version": "1.5.4522.0", "connectorGroupId": gid(52)}]}
    members: dict = {}
    for c in t["connectors.json"]["value"]:
        members.setdefault(c.pop("connectorGroupId"), {"value": []})["value"].append(dict(c))
    t["connector-group-members.json"] = members
    t["named-locations.json"] = {"value": [
        {"@odata.type": "#microsoft.graph.compliantNetworkNamedLocation", "id": COMPLIANT_LOC,
         "displayName": "All Compliant Network locations", "isTrusted": True},
        {"@odata.type": "#microsoft.graph.ipNamedLocation", "id": "44444444-4444-4444-8444-444444444402",
         "displayName": "HQ egress", "isTrusted": True, "ipRanges": [{"cidrAddress": "198.51.100.0/24"}]}]}

    def ca(name, state, apps, grant, excl_groups=(EMERGENCY,), incl=(PILOT,), locs=None, excl_apps=(), strength=None, session=None):
        p = {"id": None, "displayName": name, "state": state,
             "conditions": {"users": {"includeGroups": list(incl), "excludeGroups": list(excl_groups)},
                            "applications": {"includeApplications": list(apps), "excludeApplications": list(excl_apps)}},
             "grantControls": None, "sessionControls": None}
        if locs:
            p["conditions"]["locations"] = locs
        if grant:
            p["grantControls"] = {"operator": grant[0], "builtInControls": list(grant[1])}
            if strength:
                p["grantControls"]["authenticationStrength"] = {"id": strength}
        if session:
            p["sessionControls"] = {"globalSecureAccessFilteringProfile": {"profileId": session, "isEnabled": True}}
        return p
    pols = [
        ca("NET-CN-Require-Compliant-Network-Pilot", "enabledForReportingButNotEnforced", ["All"], ("OR", ["block"]),
           locs={"includeLocations": ["All"], "excludeLocations": [COMPLIANT_LOC]}, excl_apps=(INTUNE_ENROLL, INTUNE)),
        ca("NET-IA-SecurityProfile-Pilot", "enabled", [INTERNET_APP], None, session=gid(22)),
        ca("NET-PA-PA-HR-Portal-Device-MFA", "enabledForReportingButNotEnforced", [gid(102)], ("AND", ["mfa", "compliantDevice"])),
        ca("NET-PA-AdminRDP-PhishingResistant", "enabledForReportingButNotEnforced", [gid(122)], ("AND", ["mfa"]), incl=(ADMINS,)),
        ca("NET-PA-PA-Finance-Device-MFA", "enabled", [gid(112)], ("AND", ["mfa", "compliantDevice"]), excl_groups=()),
        ca("CA-Legacy-Block-Basic-Auth", "enabled", ["All"], ("OR", ["block"]))]
    created = ["2026-11-02T15:00:00Z", "2026-11-09T15:00:00Z", "2026-11-10T15:00:00Z", "2026-11-12T15:00:00Z", "2026-11-12T16:00:00Z", "2025-03-01T12:00:00Z"]
    for i, p in enumerate(pols):
        p["id"] = gid(41 + i)
        p["createdDateTime"] = created[i]
    t["ca-policies.json"] = {"value": pols}
    t["trv2-default.json"] = {"isServiceDefault": False, "tenantRestrictions": {
        "usersAndGroups": {"accessType": "blocked", "targets": [{"target": "AllUsers", "targetType": "user"}]},
        "applications": {"accessType": "blocked", "targets": [{"target": "AllApplications", "targetType": "application"}]}}}
    t["trv2-partners.json"] = {"value": [
        {"tenantId": "66666666-6666-4666-8666-666666666601", "tenantRestrictions": {
            "usersAndGroups": {"accessType": "allowed", "targets": [{"target": "AllUsers", "targetType": "user"}]},
            "applications": {"accessType": "allowed", "targets": [{"target": "Office365", "targetType": "application"}]}}},
        {"tenantId": "66666666-6666-4666-8666-666666666602", "tenantRestrictions": {
            "usersAndGroups": {"accessType": "allowed", "targets": [{"target": "AllUsers", "targetType": "user"}]},
            "applications": {"accessType": "allowed", "targets": [{"target": "AllApplications", "targetType": "application"}]}}}]}
    t["private-apps.json"] = {"value": [
        {"id": gid(101), "appId": gid(102), "displayName": "PA-HR-Portal", "kind": "perApp", "connectorGroupId": gid(51),
         "segments": [{"destinationHost": "app01.contoso.example", "destinationType": "fqdn", "ports": ["443-443"], "protocol": "tcp"}],
         "assignments": [{"principalId": PILOT, "principalType": "Group"}]},
        {"id": gid(111), "appId": gid(112), "displayName": "PA-Finance", "kind": "perApp", "connectorGroupId": gid(52),
         "segments": [{"destinationHost": "10.20.0.0/16", "destinationType": "ipRangeCidr", "ports": ["1-65535"], "protocol": "tcp"}],
         "assignments": [{"principalId": "77777777-7777-4777-8777-777777777701", "principalType": "User"}]},
        {"id": gid(121), "appId": gid(122), "displayName": "PA-AdminRDP-Tier1", "kind": "perApp", "connectorGroupId": gid(51),
         "segments": [{"destinationHost": "admin01.contoso.example", "destinationType": "fqdn", "ports": ["3389-3389"], "protocol": "tcp"}],
         "assignments": [{"principalId": ADMINS, "principalType": "Group"}]},
        {"id": gid(131), "appId": gid(132), "displayName": "Quick Access", "kind": "quickAccess", "connectorGroupId": gid(51),
         "segments": [{"destinationHost": "10.0.0.0/8", "destinationType": "ipRangeCidr", "ports": ["1-65535"], "protocol": "tcp"},
                      {"destinationHost": "files.contoso.example", "destinationType": "fqdn", "ports": ["445-445"], "protocol": "tcp"}],
         "assignments": [{"principalId": PILOT, "principalType": "Group"}]}]}
    t["device-usage.json"] = {"totalDeviceCount": 18, "activeDeviceCount": 15, "inactiveDeviceCount": 3}
    ws = ("/subscriptions/88888888-8888-4888-8888-888888888801/resourceGroups/rg-logs/providers/"
          "Microsoft.OperationalInsights/workspaces/law-security")
    t["diagnostic-settings.json"] = {"value": [
        {"name": "entra-core", "properties": {"workspaceId": ws, "logs": [
            {"category": "SignInLogs", "enabled": True}, {"category": "AuditLogs", "enabled": True}]}},
        {"name": "gsa-network-telemetry", "properties": {"workspaceId": ws, "logs": [
            {"category": "NetworkAccessTrafficLogs", "enabled": True},
            {"category": "NetworkAccessConnectionEvents", "enabled": True},
            {"category": "RemoteNetworkHealthLogs", "enabled": False},
            {"category": "NetworkAccessAlerts", "enabled": True}]}}]}
    t["queries.json"] = {
        "signin-share": [{"TimeGenerated": f"2026-11-{d:02d}T00:00:00Z", "Total": 400, "ThroughGSA": 352 + d,
                          "PctThroughGSA": round(100 * (352 + d) / 400, 1)} for d in range(10, 17)],
        "cn-report-only": [{"Result": "reportOnlySuccess", "Through": "true", "count_": 1830},
                           {"Result": "reportOnlyFailure", "Through": "false", "count_": 41},
                           {"Result": "reportOnlyFailure", "Through": "true", "count_": 3}],
        "trv2-blocks": [{"AppDisplayName": "Office 365 Exchange Online", "ResourceDisplayName": "Office 365 Exchange Online",
                         "ResourceTenantId": "66666666-6666-4666-8666-666666666699", "Blocked": 7}],
        "ia-allow-deny": [{"UserPrincipalName": "pilot01@contoso.example", "Allowed": 1204, "Denied": 12},
                          {"UserPrincipalName": "pilot02@contoso.example", "Allowed": 988, "Denied": 3}],
        "tls-outcomes": [{"TlsStatus": "Success", "TlsAction": "Intercepted", "Count": 9620, "Share": 96.2},
                         {"TlsStatus": "Success", "TlsAction": "Bypassed", "Count": 230, "Share": 2.3},
                         {"TlsStatus": "Failure", "TlsAction": "Intercepted", "Count": 150, "Share": 1.5}],
        "private-sessions": [{"DestinationFqdn": "app01.contoso.example", "UserPrincipalName": "pilot01@contoso.example", "Sessions": 41},
                             {"DestinationFqdn": "admin01.contoso.example", "UserPrincipalName": "admin01@contoso.example", "Sessions": 6}],
        "freshness": [{"Table": "NetworkAccessTraffic", "Rows": 52011, "Last": "2026-11-16T11:52:00Z"},
                      {"Table": "NetworkAccessConnectionEvents", "Rows": 312, "Last": "2026-11-16T11:40:00Z"},
                      {"Table": "NetworkAccessAlerts", "Rows": 2, "Last": "2026-11-15T09:12:00Z"}]}
    return t


def tenant_ring1(p: dict) -> dict:
    t = copy.deepcopy(p)
    t["subscribed-skus.json"]["value"][1]["prepaidUnits"]["enabled"] = 75
    t["subscribed-skus.json"]["value"][1]["consumedUnits"] = 61
    t["connectors.json"]["value"][2]["version"] = "1.5.4522.0"
    t["connectors.json"]["value"][3]["status"] = "active"
    east = t["connector-group-members.json"][gid(52)]["value"]
    east[0]["version"] = "1.5.4522.0"
    east[1]["status"] = "active"
    pols = t["ca-policies.json"]["value"]
    for pol in pols:
        if pol["displayName"] == "NET-CN-Require-Compliant-Network-Pilot":
            pol["state"] = "enabled"
        if pol["displayName"] == "NET-PA-AdminRDP-PhishingResistant":
            pol["grantControls"] = {"operator": "AND", "builtInControls": ["compliantDevice"],
                                    "authenticationStrength": {"id": PHISH_STRENGTH}}
        if pol["displayName"] == "NET-PA-PA-Finance-Device-MFA":
            pol["conditions"]["users"]["excludeGroups"] = [EMERGENCY]
    apps = t["private-apps.json"]["value"]
    apps[1]["segments"] = [{"destinationHost": "fin01.contoso.example", "destinationType": "fqdn", "ports": ["443-443"], "protocol": "tcp"}]
    apps[1]["assignments"] = [{"principalId": PILOT, "principalType": "Group"}]
    apps[3]["segments"] = []
    t["trv2-partners.json"]["value"] = t["trv2-partners.json"]["value"][:1]
    t["device-usage.json"] = {"totalDeviceCount": 18, "activeDeviceCount": 18, "inactiveDeviceCount": 0}
    t["diagnostic-settings.json"]["value"][1]["properties"]["logs"][2]["enabled"] = True
    q = t["queries.json"]
    q["signin-share"] = [{"TimeGenerated": f"2026-11-{d:02d}T00:00:00Z", "Total": 400, "ThroughGSA": 391,
                          "PctThroughGSA": 97.8} for d in range(24, 31)]
    q["cn-report-only"] = [{"Result": "success", "Through": "true", "count_": 2140},
                           {"Result": "failure", "Through": "false", "count_": 9}]
    q["tls-outcomes"] = [{"TlsStatus": "Success", "TlsAction": "Intercepted", "Count": 9810, "Share": 98.1},
                         {"TlsStatus": "Success", "TlsAction": "Bypassed", "Count": 140, "Share": 1.4},
                         {"TlsStatus": "Failure", "TlsAction": "Intercepted", "Count": 50, "Share": 0.5}]
    for row in q["freshness"]:
        row["Last"] = "2026-11-30T11:50:00Z"
    q["freshness"].append({"Table": "RemoteNetworkHealthLogs", "Rows": 96, "Last": "2026-11-30T11:45:00Z"})
    return t


def inputs() -> dict:
    i: dict = {}
    base = {"cloud_environment": "GCC", "owner": "Network policy owner", "approver": "Authorizing official (delegated)",
            "authorization": "Provider package read Oct 2026; FedRAMP High; GCC covered",
            "exit_criteria": ["Learn's GCC statement changes", "Beta API change breaks evidence collection"],
            "review_on": "2027-11-01", "preview_features_used": [], "exceptions": []}
    i["decisions/NET-GSA-01.json"] = dict(base, decision_id="NET-GSA-01", function="microsoft-traffic", decision="adopt",
        availability="Learn, Known limitations for Global Secure Access, read 2026-11-11: Global Secure Access is available in GCC",
        availability_read_on="2026-11-11", license_required="Entra ID P1 or P2", license_sku="FIXTURE-ENTRA-ID-P1",
        license_needed=60, approved_on="2026-11-12",
        tic_alignment="Remote User, Pattern 2; telemetry path agreed 2026-11-10",
        pilot_exit_criteria=["20 pilot users for 10 business days", "client active on all pilot devices"])
    i["decisions/NET-GSA-02.json"] = dict(base, decision_id="NET-GSA-02", function="private", decision="adopt",
        availability="Learn, Known limitations for Global Secure Access, read 2026-11-11: Global Secure Access is available in GCC",
        availability_read_on="2026-11-11", license_required="Private Access or Entra Suite", license_sku="FIXTURE-ENTRA-SUITE",
        license_needed=20, approved_on="2026-11-12", tic_alignment="Remote User, Pattern 1",
        pilot_exit_criteria=["one application for 10 business days"])
    i["decisions/NET-GSA-03.json"] = dict(base, decision_id="NET-GSA-03", function="internet", decision="adopt",
        availability="Learn, Known limitations for Global Secure Access, read 2026-10-01: Global Secure Access is available in GCC",
        availability_read_on="2026-10-01", license_required="Internet Access or Entra Suite", license_sku="FIXTURE-ENTRA-SUITE",
        license_needed=60, approved_on="2026-11-12", tic_alignment="Remote User, Pattern 3",
        preview_features_used=["cloud-firewall-clients"],
        pilot_exit_criteria=["blocked-category test passes", "TLS failure share under 1%"])
    i["decisions/NET-GSA-04.json"] = dict(base, decision_id="NET-GSA-04", function="branch", decision="defer",
        availability="Learn, Known limitations for Global Secure Access, read 2026-11-11: Global Secure Access is available in GCC",
        availability_read_on="2026-11-11", license_required="At least 50 P1 and Internet Access licenses combined",
        license_sku="", license_needed=0, approved_on="2026-11-12", tic_alignment="Branch Office, deferred",
        compensating_controls=[], pilot_exit_criteria=[])
    i["architecture.json"] = {
        "tenant": "contoso.example", "forest": "corp.contoso.example",
        "connectorGroups": [{"name": "CG-HQ", "site": "HQ datacenter", "hosts": ["con01.contoso.example", "con02.contoso.example"],
                             "applications": ["PA-HR-Portal", "PA-AdminRDP-Tier1"]},
                            {"name": "CG-Cloud-East", "site": "Azure East US", "hosts": ["con11.contoso.example", "con12.contoso.example"],
                             "applications": ["PA-Finance"]}],
        "privateDnsSuffixes": ["contoso.example"],
        "remoteNetworks": [],
        "workspace": "law-security",
        "cisaTelemetry": {"agreedOn": "", "path": ""},
        "quicBlock": {"method": "Intune firewall rule", "profile": "NET-QUIC-Block-UDP443", "assignedTo": "pilot"}}
    i["exceptions.csv"] = "\n".join([
        "id,kind,target,reason,owner,approver,expires,step",
        "EX-01,policy-exclusion,emergency access group,Emergency access (Book 04),Policy owner,ISSO,2027-02-01,5-10",
        "EX-02,policy-exclusion,Microsoft Intune Enrollment and Microsoft Intune,Learn: circular dependency,Policy owner,ISSO,2027-05-01,7",
        "EX-03,custom-bypass,*.payroll-partner.example,Certificate pinning,Platform owner,Policy owner,2026-11-01,9",
        "EX-04,custom-bypass,updates.vendor.example,Large downloads,Platform owner,,2027-03-01,5",
        "EX-05,trv2-partner,66666666-6666-4666-8666-666666666601,Fabrikam joint program,Identity engineer,Policy owner,2027-06-30,8",
        "EX-06,client-exclusion,LAB-HYPERV-01,Hyper-V external switch,Endpoint engineer,Policy owner,2027-01-31,3",
        ""])
    i["client-records.json"] = {"devices": [
        {"device": "PC-PILOT-01", "collectedAt": "2026-11-16T10:00:00Z", "clientVersion": "2.6.112.0",
         "hardening": {"HideSignOutButton": 1, "HideDisablePrivateAccessButton": 1, "HideDisableButton": 1, "RestrictNonPrivilegedUsers": 1},
         "ipv6DisabledComponents": 32, "health": "Connected", "dohPolicy": {"Edge": "off", "Chrome": "off"}},
        {"device": "PC-PILOT-02", "collectedAt": "2026-11-16T10:05:00Z", "clientVersion": "2.6.112.0",
         "hardening": {}, "ipv6DisabledComponents": 32, "health": "Connected", "dohPolicy": {"Edge": "off", "Chrome": "off"}},
        {"device": "PC-PILOT-03", "collectedAt": "2026-11-16T10:07:00Z", "clientVersion": "1.7.669.0",
         "hardening": {}, "ipv6DisabledComponents": 0, "health": "Connected", "dohPolicy": {"Edge": "off", "Chrome": "automatic"}},
        {"device": "PC-PILOT-04", "collectedAt": "2026-11-16T10:09:00Z", "clientVersion": "2.6.112.0",
         "hardening": {}, "ipv6DisabledComponents": 32, "health": "Disconnected", "dohPolicy": {"Edge": "off", "Chrome": "off"}}]}
    i["tls.json"] = {
        "certificate": {"name": "contosotls1", "issuer": "Contoso TLS Inspection CA", "notBefore": "2026-11-01T00:00:00Z",
                        "notAfter": "2027-01-30T00:00:00Z", "status": "enabled"},
        "policies": [{"name": "TLS-Pilot", "defaultAction": "inspect", "linkedProfiles": ["SP-Pilot"],
                      "customBypass": ["*.payroll-partner.example"]}],
        "privacy": {"approvedOn": "2026-11-05", "approver": "Privacy officer", "userNoticeSentOn": "2026-11-06",
                    "bypassCategories": ["Education", "Finance", "Government", "Health & Medicine"]},
        "trustProfile": {"name": "NET-TLS-Trust-Chain", "deployedTo": "pilot", "deployedOn": "2026-11-07"}}
    i["ring-record.json"] = {"ring": "pilot", "started": "2026-11-09", "sev2Open": 1, "helpDeskTickets": 9, "helpDeskThreshold": 10,
                             "emergencyExclusionTestedOn": "2026-11-09", "breakGlassRehearsedOn": "2026-11-06"}
    return i


def inputs_ring1(i: dict) -> dict:
    r = copy.deepcopy(i)
    d = json.loads(json.dumps(r["decisions/NET-GSA-03.json"]))
    d["availability_read_on"] = "2026-11-25"
    d["availability"] = "Learn, Known limitations for Global Secure Access, read 2026-11-25: Global Secure Access is available in GCC"
    d["preview_features_used"] = []
    r["decisions/NET-GSA-03.json"] = d
    d4 = r["decisions/NET-GSA-04.json"]
    d4["compensating_controls"] = ["Branch traffic stays on the agency's current TIC path", "Managed devices at branches keep the client"]
    r["architecture.json"]["cisaTelemetry"] = {"agreedOn": "2026-11-20", "path": "Sentinel export to CLAW, as agreed with the TIC delegates"}
    r["exceptions.csv"] = r["exceptions.csv"].replace("Certificate pinning,Platform owner,Policy owner,2026-11-01",
                                                      "Certificate pinning,Platform owner,Policy owner,2027-02-01")
    r["exceptions.csv"] = r["exceptions.csv"].replace("Large downloads,Platform owner,,2027-03-01",
                                                      "Large downloads,Platform owner,Policy owner,2027-03-01")
    for dev in r["client-records.json"]["devices"]:
        dev.update(clientVersion="2.6.112.0", ipv6DisabledComponents=32, health="Connected",
                   dohPolicy={"Edge": "off", "Chrome": "off"}, collectedAt="2026-11-30T10:00:00Z")
    r["tls.json"]["certificate"]["notAfter"] = "2027-05-30T00:00:00Z"
    r["ring-record.json"] = {"ring": "ring1", "started": "2026-11-16", "sev2Open": 0, "helpDeskTickets": 6, "helpDeskThreshold": 10,
                             "emergencyExclusionTestedOn": "2026-11-16", "breakGlassRehearsedOn": "2026-11-13"}
    return r


def main() -> None:
    p = tenant_pilot()
    for name, folder, tenant, ins in (("pilot", HERE / "pilot", p, inputs()),
                                      ("ring1", HERE / "ring1", tenant_ring1(p), inputs_ring1(inputs()))):
        for f, v in tenant.items():
            write(folder / "tenant", f, v)
        for f, v in ins.items():
            path = folder / "inputs" / f
            path.parent.mkdir(parents=True, exist_ok=True)
            if isinstance(v, str):
                path.write_text(v, encoding="utf-8", newline="\n")
            else:
                path.write_text(json.dumps(v, indent=2) + "\n", encoding="utf-8", newline="\n")
    print("wrote", HERE / "pilot", "and", HERE / "ring1")


if __name__ == "__main__":
    main()
