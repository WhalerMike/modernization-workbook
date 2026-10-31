"""Writes Chapter 10's fixtures (examples/non-person-identity/tests/fixtures/ch10) from Chapter 01's estate.json.

Run from the repository root: python -I examples/non-person-identity/tests/fixtures/ch10/make_fixtures.py .
The files it writes are committed; rerun it only in a reviewed change, then rerun the Chapter 10 tests
and copy the two Lab 1 runs into examples/drift-pipeline/tests/fixtures/npi-runs.
"""
import json, copy, sys, hashlib
from pathlib import Path
root = Path(sys.argv[1])
fx = root / "examples/non-person-identity/tests/fixtures"
out = fx / "ch10"
for d in ("contract", "vintage", "inputs"):
    (out / d).mkdir(parents=True, exist_ok=True)
est = json.loads((fx / "estate.json").read_text(encoding="utf-8"))
T = est["tenantId"]


def dump(p, o):
    with p.open("w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(o, indent=2, ensure_ascii=False) + "\n")


def text(p, s):
    with p.open("w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def app(e, oid):
    return next(a for a in e["graph"]["applications"] if a["id"] == oid)


def sp(e, oid):
    return next(a for a in e["graph"]["servicePrincipals"] if a["id"] == oid)


def I(p, n):
    return f"{p}-0000-4000-8000-{n:012d}"


d1 = copy.deepcopy(est)
d1["_comment"] = "Chapter 10, day 1: Chapter 01's fictional estate (estate.json) with one change, Vendor Portal's certificate ending 2026-11-20, inside the 30 days the expiry check uses. contoso.example, invented IDs, no real people."
d1["asOf"] = "2026-10-29T06:00:00Z"
app(d1, I("0a000000", 5))["keyCredentials"][0]["endDateTime"] = "2026-11-20T00:00:00Z"
dump(out / "estate-day1.json", d1)
d2 = copy.deepcopy(d1)
d2["_comment"] = "Chapter 10, day 2: day 1 plus what happened in the window 2026-10-29T06:00Z to 2026-10-30T06:00Z, matching audit.json: a client secret added to HR Connector by a person; certificates rotated on Deploy Bot and Vendor Portal by the pipeline; a secret added to Payroll Export's service principal by another app; a first secret on Build Pipeline; a delegated grant for all users on Mail Automation; and a new app registration, Survey Tool."
d2["asOf"] = "2026-10-30T06:00:00Z"
app(d2, I("0a000000", 2))["passwordCredentials"].append({"keyId": I("9c000000", 31), "displayName": "added", "startDateTime": "2026-10-29T20:00:00Z", "endDateTime": "2028-10-29T20:00:00Z"})
app(d2, I("0a000000", 7))["keyCredentials"].append({"keyId": I("9c000000", 32), "displayName": "CN=deploy-bot", "startDateTime": "2026-10-29T22:00:00Z", "endDateTime": "2027-04-27T22:00:00Z"})
sp(d2, I("5b000000", 1))["passwordCredentials"].append({"keyId": I("9c000000", 33), "displayName": "sp-secret", "startDateTime": "2026-10-30T01:15:00Z", "endDateTime": "2027-10-30T01:15:00Z"})
app(d2, I("0a000000", 4))["passwordCredentials"].append({"keyId": I("9c000000", 34), "displayName": "ci", "startDateTime": "2026-10-30T02:00:00Z", "endDateTime": "2027-10-30T02:00:00Z"})
app(d2, I("0a000000", 5))["keyCredentials"] = [{"keyId": I("9c000000", 36), "displayName": "CN=vendor-portal", "startDateTime": "2026-10-30T04:00:00Z", "endDateTime": "2027-04-28T04:00:00Z"}]
d2["graph"]["oauth2PermissionGrants"].append({"id": "og-03", "clientId": I("5b000000", 6), "consentType": "AllPrincipals", "principalId": None, "resourceId": I("5b000000", 10), "scope": "Mail.Read"})
d2["graph"]["applications"].append({"id": I("0a000000", 9), "appId": I("1a000000", 9), "displayName": "Survey Tool", "signInAudience": "AzureADMyOrg", "serviceManagementReference": None, "passwordCredentials": [], "keyCredentials": []})
d2["graph"]["applicationOwners"][I("0a000000", 9)] = [{"@odata.type": "#microsoft.graph.user", "id": I("5a000000", 7)}]
d2["graph"]["servicePrincipals"].insert(7, {"id": I("5b000000", 9), "appId": I("1a000000", 9), "displayName": "Survey Tool", "servicePrincipalType": "Application", "appOwnerOrganizationId": T, "accountEnabled": True, "signInAudience": "AzureADMyOrg", "alternativeNames": [], "passwordCredentials": [], "keyCredentials": [], "tags": []})
dump(out / "estate-day2.json", d2)


def kd(keys):
    return json.dumps([f"[KeyIdentifier={k},KeyType={t},KeyUsage=Verify,DisplayName={n}]" for k, t, n in keys])


def ev(i, when, act, target_type, target_id, target_name, init, old=None, new=None, result="success"):
    tr = {"id": target_id, "displayName": target_name, "type": target_type, "modifiedProperties": []}
    if new is not None:
        tr["modifiedProperties"].append({"displayName": "KeyDescription", "oldValue": kd(old), "newValue": kd(new)})
    return {"id": f"Directory_{i}", "category": "ApplicationManagement", "correlationId": I("c0000000", int(i[-2:])), "result": result,
            "resultReason": "", "activityDisplayName": act, "activityDateTime": when, "loggedByService": "Core Directory", "operationType": "Update",
            "initiatedBy": init, "targetResources": [tr], "additionalDetails": [{"key": "User-Agent", "value": "fixture"}]}


def user(n, upn):
    return {"user": {"id": I("5a000000", n), "displayName": None, "userPrincipalName": upn, "ipAddress": "192.0.2.10"}, "app": None}


def appi(n, name):
    return {"user": None, "app": {"appId": I("1c000000", n), "displayName": name, "servicePrincipalId": I("5b000000", n), "servicePrincipalName": name}}


C = "Update application - Certificates and secrets management"
audits = [
    ev("aud-00", "2026-10-20T10:00:00Z", C, "Application", I("0a000000", 6), "Mail Automation", user(1, "alice@contoso.example"), [], [(I("9c000000", 6), "Password", "automation")]),
    ev("aud-01", "2026-10-29T20:00:05Z", C, "Application", I("0a000000", 2), "HR Connector", user(3, "carol@contoso.example"),
       [(I("9c000000", 2), "AsymmetricX509Cert", "CN=hr-connector")], [(I("9c000000", 2), "AsymmetricX509Cert", "CN=hr-connector"), (I("9c000000", 31), "Password", "added")]),
    ev("aud-02", "2026-10-29T22:00:00Z", C, "Application", I("0a000000", 7), "Deploy Bot", appi(20, "Credential Rotation Pipeline"),
       [(I("9c000000", 7), "AsymmetricX509Cert", "CN=deploy-bot")], [(I("9c000000", 7), "AsymmetricX509Cert", "CN=deploy-bot"), (I("9c000000", 32), "AsymmetricX509Cert", "CN=deploy-bot")]),
    ev("aud-03", "2026-10-30T01:15:00Z", "Add service principal credentials", "ServicePrincipal", I("5b000000", 1), "Payroll Export", appi(6, "Mail Automation"),
       [], [(I("9c000000", 33), "Password", "sp-secret")]),
    ev("aud-04", "2026-10-30T02:00:00Z", C, "Application", I("0a000000", 4), "Build Pipeline", user(3, "carol@contoso.example"), [], [(I("9c000000", 34), "Password", "ci")]),
    ev("aud-05", "2026-10-30T03:00:00Z", "Consent to application", "ServicePrincipal", I("5b000000", 6), "Mail Automation", user(1, "alice@contoso.example")),
    ev("aud-06", "2026-10-30T03:00:01Z", "Add delegated permission grant", "ServicePrincipal", I("5b000000", 6), "Mail Automation", user(1, "alice@contoso.example")),
    ev("aud-07", "2026-10-29T09:00:00Z", "Add service principal", "ServicePrincipal", I("5b000000", 9), "Survey Tool", user(7, "gina@contoso.example")),
    ev("aud-08", "2026-10-29T23:00:00Z", C, "Application", I("0a000000", 2), "HR Connector", user(4, "dave_partner.example#EXT#@contosoexample.onmicrosoft.com"),
       [(I("9c000000", 2), "AsymmetricX509Cert", "CN=hr-connector")], [(I("9c000000", 2), "AsymmetricX509Cert", "CN=hr-connector"), (I("9c000000", 35), "Password", "x")], result="failure"),
    ev("aud-09", "2026-10-30T04:00:00Z", C, "Application", I("0a000000", 5), "Vendor Portal", appi(20, "Credential Rotation Pipeline"),
       [(I("9c000000", 5), "AsymmetricX509Cert", "CN=vendor-portal")], [(I("9c000000", 36), "AsymmetricX509Cert", "CN=vendor-portal")]),
]
dump(out / "audit.json", {"_comment": "Chapter 10: fictional directoryAudit items in Microsoft Graph's shape (List directoryAudits) for Lab 1's two windows (2026-10-28T06:00Z to 2026-10-29T06:00Z, and on to 2026-10-30T06:00Z), plus one older event and one failure. KeyDescription values follow the format Learn's linked Sentinel rule parses. contoso.example, invented IDs, a documentation IP address.", "directoryAudits": audits})
si = [(1, "2026-10-29T05:00:00Z"), (2, "2026-10-28T23:00:00Z"), (3, "2026-05-01T08:00:00Z"), (4, "2026-10-30T04:00:00Z"),
      (5, "2026-10-15T12:00:00Z"), (6, "2026-10-29T03:00:00Z"), (7, "2026-10-29T23:30:00Z")]
dump(out / "signin-activity.json", {"_comment": "Chapter 10: fictional rows of the service principal sign-in activity report (beta) in Graph's shape. Legacy Reports last signed in on 2026-05-01; Old SAML Connector and Survey Tool have no row.",
     "servicePrincipalSignInActivities": [{"id": f"si-{n:02d}", "appId": I("1a000000", n), "lastSignInActivity": {"lastSignInDateTime": w, "lastSignInRequestId": I("e0000000", n)}} for n, w in si]})


def fp(rule, key):
    return hashlib.sha256(f"{rule}|{key}|".encode()).hexdigest()[:16]


def finding(ch, rule, sev, key, issue):
    return {"id": f"{rule}:{key}", "rule": rule, "severity": sev, "chapter": ch, "objectKey": key, "fingerprint": fp(rule, key), "issue": issue}


def A(n):
    return f"app:{I('1a000000', n)}"


dump(out / "contract" / "ch07-findings.json", {"schema": "fmp-npi-findings/1", "chapter": "07", "tenantId": T, "producedAt": "2026-10-28T06:00:00Z",
     "_comment": "A sample of the contract Chapter 07 can emit. NPI-SAMPLE rules are fixture rules, not Chapter 07's.",
     "findings": [finding("07", "NPI-SAMPLE-01", "Finding", A(6), "Holds Directory.ReadWrite.All; a narrower permission is available")]})
dump(out / "contract" / "ch09-findings.json", {"schema": "fmp-npi-findings/1", "chapter": "09", "tenantId": T, "producedAt": "2026-10-28T06:00:00Z",
     "_comment": "A sample of the contract Chapter 09 can emit. NPI-SAMPLE rules are fixture rules, not Chapter 09's.",
     "findings": [finding("09", "NPI-SAMPLE-02", "Warn", f"sp:{I('5b000000', 15)}", "Sponsor field empty")]})
bad = finding("05", "NPI-SAMPLE-03", "Warn", A(4), "Federated credential subject is a branch, not an environment")
bad["fingerprint"] = "0000000000000000"
dump(out / "contract" / "ch05-findings.json", {"schema": "fmp-npi-findings/1", "chapter": "05", "tenantId": T, "producedAt": "2026-10-28T06:00:00Z",
     "_comment": "A deliberately broken sample: its fingerprint isn't SHA-256(rule|objectKey|), so the drift run refuses the file (NPI-DRF-09).", "findings": [bad]})
dump(out / "contract" / "ch04-credential-log.json", {"schema": "fmp-npi-credential-log/1", "chapter": "04", "tenantId": T,
     "_comment": "A sample of the credential log Chapter 04's rotation pipeline can emit: each credential it added, by object ID and key ID, with its change record.",
     "changes": [{"objectId": I("0a000000", 7), "keyId": I("9c000000", 32), "changeId": "CHG-2026-1029-01", "at": "2026-10-29T22:00:00Z"},
                 {"objectId": I("0a000000", 5), "keyId": I("9c000000", 36), "changeId": "CHG-2026-1030-01", "at": "2026-10-30T04:00:00Z"}]})
dump(out / "contract" / "ch07-owner-review.json", {"schema": "fmp-npi-review/1", "chapter": "07", "kind": "owner-permission-review", "tenantId": T,
     "_comment": "A sample of the owners' quarterly permission review records Chapter 07 can emit. Reviewer IDs are object IDs.",
     "records": [{"identityKey": A(1), "reviewedOn": "2026-09-15", "decision": "Approved", "reviewerId": I("5a000000", 1)},
                 {"identityKey": A(6), "reviewedOn": "2026-05-01", "decision": "Approved", "reviewerId": I("5a000000", 1)}]})
dump(out / "contract" / "ch09-sponsor-attestation.json", {"schema": "fmp-npi-review/1", "chapter": "09", "kind": "sponsor-attestation", "tenantId": T,
     "_comment": "A sample of the sponsor attestation records Chapter 09 can emit.",
     "records": [{"identityKey": A(8), "reviewedOn": "2026-04-01", "decision": "Attested", "reviewerId": I("5a000000", 2)}]})
dump(out / "contract" / "ch09-agent-recertification.json", {"schema": "fmp-npi-review/1", "chapter": "09", "kind": "agent-access-recertification", "tenantId": T,
     "_comment": "A sample of the agent access assignments Chapter 09 can emit, with their end dates: expiry is the review.",
     "records": [{"identityKey": f"sp:{I('5b000000', 15)}", "assignmentId": "AP-01", "expires": "2027-01-31", "decision": "Active"},
                 {"identityKey": f"sp:{I('5b000000', 15)}", "assignmentId": "AP-02", "expires": None, "decision": "Active"}]})
text(out / "inputs" / "pipeline-identities.csv", "ServicePrincipalId,Name,Record\n" + I("5b000000", 20) + ",Credential Rotation Pipeline,CMDB-1300\n")
text(out / "vintage" / "ai-inventory-2025.csv", "id,development_stage,classification,have_ato\nUC-001,Deployed,Agentic AI,Yes\nUC-002,Pilot,Generative AI,No\nUC-003,Deployed,Classical ML,No\nUC-004,Pilot,Agentic AI,No\n")
text(out / "vintage" / "ai-inventory-2026.csv", "id,development_stage,classification,have_ato\nUC-001,Deployed,Agentic AI,Yes\nUC-002,Retired,Generative AI,No\nUC-003,Deployed,Classical ML,Yes\nUC-005,Deployed,Agentic AI,No\nUC-006,Pilot,Generative AI,No\n")
text(out / "vintage" / "ai-use-cases.csv", "UseCaseId,RecordId\nUC-001,CMDB-4001\nUC-002,CMDB-1100\nUC-003,CMDB-1042\nUC-006,CMDB-1300\n")
print("ok")
