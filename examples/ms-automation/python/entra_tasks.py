"""Read-only Microsoft Entra ID checks through Microsoft Graph, for the workbook's Module 2.

Each task is two parts: a fetch (Graph calls, least-privileged permission noted) and
a pure `evaluate_*` function that turns the Graph objects into findings. The tests
run the evaluate functions against fixtures; the PowerShell module implements the
same rules and is tested against the same fixtures and expected results.

    python entra_tasks.py --cloud gcc --tenant <id> --client <id> --cert app.pem stale-users --days 90
    python entra_tasks.py ... ca-export --out ca
    python entra_tasks.py ... pim-report
    python entra_tasks.py ... app-credentials
    python entra_tasks.py ... mfa-registration

Add --from-json FILE to evaluate a saved Graph response instead of calling Graph.
Every task only reads. Nothing here writes to the tenant.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from graphkit import CLOUDS, GraphClient, azure_identity_provider  # noqa: E402

GLOBAL_ADMIN = "62e90394-69f5-4237-9190-012177145e10"  # Global Administrator role template ID

# Permissions per task (Microsoft Graph, application). The least-privileged ones each API page lists.
PERMISSIONS = {
    "stale-users": ["User.Read.All", "AuditLog.Read.All"],  # signInActivity also needs Entra ID P1 or P2
    "ca-export": ["Policy.Read.All"],
    "pim-report": ["RoleEligibilitySchedule.Read.Directory", "RoleAssignmentSchedule.Read.Directory", "RoleManagement.Read.Directory"],
    "app-credentials": ["Application.Read.All"],
    "mfa-registration": ["AuditLog.Read.All"],
}


def parse_time(value: str | None) -> dt.datetime | None:
    if not value:
        return None
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))


def iso(value: dt.datetime | None) -> str | None:
    """UTC, second precision, `Z`: the same text the PowerShell module writes."""
    return value.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if value else None


# ------------------------------------------------------------ stale users


def evaluate_stale_users(users: list[dict], as_of: dt.datetime, days: int) -> list[dict]:
    """Enabled member accounts with no interactive or non-interactive sign-in in `days` days.
    An account created inside the window with no sign-in yet isn't stale."""
    out = []
    for u in users:
        if not u.get("accountEnabled", True) or u.get("userType", "Member") != "Member":
            continue
        act = u.get("signInActivity") or {}
        seen = [t for t in (parse_time(act.get("lastSignInDateTime")), parse_time(act.get("lastNonInteractiveSignInDateTime"))) if t]
        last = max(seen) if seen else None
        created = parse_time(u.get("createdDateTime"))
        if last is None and created and (as_of - created).days < days:
            continue
        idle = (as_of - last).days if last else None
        if idle is None or idle >= days:
            out.append(
                {"id": u["id"], "userPrincipalName": u.get("userPrincipalName", ""), "lastSignIn": iso(last), "daysIdle": idle}
            )
    return sorted(out, key=lambda r: (r["daysIdle"] is not None, -(r["daysIdle"] or 0), r["userPrincipalName"]))


def fetch_users(g: GraphClient) -> list[dict]:
    # signInActivity caps the page at 500 and must be $selected.
    sel = "id,userPrincipalName,accountEnabled,userType,createdDateTime,signInActivity"
    return list(g.get_all(f"/users?$select={sel}&$top=500"))


# ------------------------------------------------------------ Conditional Access export


def evaluate_ca_export(policies: list[dict], named_locations: list[dict]) -> dict:
    """A stable, diffable export: each policy keyed by id with keys sorted, plus a summary."""
    summary = []
    for p in sorted(policies, key=lambda p: p.get("displayName", "")):
        grant = p.get("grantControls") or {}
        summary.append(
            {
                "id": p["id"],
                "displayName": p.get("displayName", ""),
                "state": p.get("state", ""),
                "grant": sorted((grant.get("builtInControls") or [])) + (["authenticationStrength"] if grant.get("authenticationStrength") else []),
                "reportOnly": p.get("state") == "enabledForReportingButNotEnforced",
            }
        )
    counts = {s: sum(1 for r in summary if r["state"] == s) for s in ("enabled", "enabledForReportingButNotEnforced", "disabled")}
    return {
        "summary": summary,
        "counts": counts,
        "policies": {p["id"]: p for p in policies},
        "namedLocations": {n["id"]: n for n in named_locations},
    }


def fetch_ca(g: GraphClient) -> tuple[list[dict], list[dict]]:
    return list(g.get_all("/identity/conditionalAccess/policies")), list(g.get_all("/identity/conditionalAccess/namedLocations"))


# ------------------------------------------------------------ PIM standing access


def evaluate_pim(
    role_definitions: list[dict], eligibility: list[dict], assignments: list[dict], privileged_role_ids: set[str]
) -> dict:
    """Findings against ScubaGear MS.AAD.7.1v1 (2 to 8 Global Administrators) and
    MS.AAD.7.4v1 (no permanent active assignment to a highly privileged role)."""
    names = {r.get("templateId") or r["id"]: r.get("displayName", "") for r in role_definitions}
    names.update({r["id"]: r.get("displayName", "") for r in role_definitions})
    permanent = []
    for a in assignments:
        if a.get("roleDefinitionId") not in privileged_role_ids or a.get("assignmentType") != "Assigned":
            continue
        exp = (a.get("scheduleInfo") or {}).get("expiration") or {}
        if exp.get("type") in (None, "noExpiration", "notSpecified") and not exp.get("endDateTime"):
            permanent.append(
                {"principalId": a["principalId"], "roleDefinitionId": a["roleDefinitionId"], "role": names.get(a["roleDefinitionId"], ""), "memberType": a.get("memberType", "")}
            )
    ga = {x["principalId"] for x in eligibility + assignments if x.get("roleDefinitionId") == GLOBAL_ADMIN}
    return {
        "globalAdministrators": len(ga),
        "MS.AAD.7.1v1": "pass" if 2 <= len(ga) <= 8 else "fail",
        "permanentActive": sorted(permanent, key=lambda r: (r["role"], r["principalId"])),
        "MS.AAD.7.4v1": "pass" if not permanent else "fail",
    }


def fetch_pim(g: GraphClient) -> tuple[list[dict], list[dict], list[dict]]:
    return (
        list(g.get_all("/roleManagement/directory/roleDefinitions?$select=id,templateId,displayName,isBuiltIn")),
        list(g.get_all("/roleManagement/directory/roleEligibilitySchedules")),
        list(g.get_all("/roleManagement/directory/roleAssignmentSchedules")),
    )


# ------------------------------------------------------------ application credentials


def evaluate_app_credentials(apps: list[dict], as_of: dt.datetime, expiring_days: int = 30) -> list[dict]:
    """Per credential: lifetime and expiry, flagged against ScubaGear MS.AAD.5.5v1 (no app
    passwords), 5.6v1 (password lifetime at most 180 days) and 5.7v1 (certificate at most 365)."""
    out = []
    for app in apps:
        for kind, creds, limit, rule in (
            ("password", app.get("passwordCredentials") or [], 180, "MS.AAD.5.6v1"),
            ("certificate", app.get("keyCredentials") or [], 365, "MS.AAD.5.7v1"),
        ):
            for c in creds:
                start, end = parse_time(c.get("startDateTime")), parse_time(c.get("endDateTime"))
                lifetime = (end - start).days if start and end else None
                left = (end - as_of).days if end else None
                flags = []
                if kind == "password":
                    flags.append("MS.AAD.5.5v1")
                if lifetime is not None and lifetime > limit:
                    flags.append(rule)
                if left is not None and left < 0:
                    flags.append("expired")
                elif left is not None and left <= expiring_days:
                    flags.append("expiring")
                out.append(
                    {"appId": app.get("appId", ""), "displayName": app.get("displayName", ""), "kind": kind, "keyId": c.get("keyId", ""),
                     "lifetimeDays": lifetime, "daysLeft": left, "flags": flags}
                )
    return sorted(out, key=lambda r: (r["daysLeft"] if r["daysLeft"] is not None else 10**6, r["displayName"], r["keyId"]))


def fetch_apps(g: GraphClient) -> list[dict]:
    return list(g.get_all("/applications?$select=id,appId,displayName,passwordCredentials,keyCredentials&$top=999"))


# ------------------------------------------------------------ MFA registration

# Method names treated as phishing-resistant. methodsRegistered is documented only by
# example ("mobilePhone, email, passKeyDeviceBound"); the others are Graph's method
# names for passkeys and Windows Hello. Confirm against your own report output.
PHISHING_RESISTANT = {"passKeyDeviceBound", "passKeyDeviceBoundAuthenticator", "passKeyDeviceBoundWindowsHello", "windowsHelloForBusiness", "fido2SecurityKey"}


def evaluate_mfa(details: list[dict]) -> dict:
    """Counts toward ScubaGear MS.AAD.3.1v1 (phishing-resistant MFA for all users)."""
    members = [d for d in details if d.get("userType", "member") == "member"]
    no_mfa = sorted(d["userPrincipalName"] for d in members if not d.get("isMfaRegistered"))
    no_pr = sorted(d["userPrincipalName"] for d in members if not PHISHING_RESISTANT & set(d.get("methodsRegistered") or []))
    return {
        "members": len(members),
        "notMfaRegistered": len(no_mfa),
        "noPhishingResistantMethod": len(no_pr),
        "admins": sum(1 for d in members if d.get("isAdmin")),
        "adminsNoPhishingResistantMethod": sorted(
            d["userPrincipalName"] for d in members if d.get("isAdmin") and not PHISHING_RESISTANT & set(d.get("methodsRegistered") or [])
        ),
    }


def fetch_mfa(g: GraphClient) -> list[dict]:
    return list(g.get_all("/reports/authenticationMethods/userRegistrationDetails"))


# ------------------------------------------------------------ command line


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Read-only Microsoft Entra ID checks through Microsoft Graph.")
    p.add_argument("--cloud", choices=sorted(CLOUDS), default="gcc")
    p.add_argument("--tenant", help="tenant ID")
    p.add_argument("--client", help="app (client) ID; with no --cert, a user-assigned managed identity's client ID")
    p.add_argument("--cert", help="PEM file with the app's certificate and private key")
    p.add_argument("--from-json", type=Path, help="evaluate a saved Graph response (see tests/fixtures) instead of calling Graph")
    p.add_argument("--as-of", help="evaluation time, ISO 8601 (default now, UTC)")
    sub = p.add_subparsers(dest="task", required=True)
    s = sub.add_parser("stale-users")
    s.add_argument("--days", type=int, default=90)
    c = sub.add_parser("ca-export")
    c.add_argument("--out", type=Path, required=True)
    sub.add_parser("pim-report").add_argument("--role", action="append", default=[GLOBAL_ADMIN], help="privileged role template ID; repeatable")
    sub.add_parser("app-credentials")
    sub.add_parser("mfa-registration")
    a = p.parse_args(argv)
    as_of = parse_time(a.as_of) if a.as_of else dt.datetime.now(dt.timezone.utc)

    if a.from_json:
        data = json.loads(a.from_json.read_text(encoding="utf-8"))
    else:
        if not a.tenant:
            p.error("--tenant is required unless --from-json is given")
        g = GraphClient(a.cloud, azure_identity_provider(a.cloud, a.tenant, a.client, a.cert))
        data = {}
        if a.task == "stale-users":
            data["users"] = fetch_users(g)
        elif a.task == "ca-export":
            data["policies"], data["namedLocations"] = fetch_ca(g)
        elif a.task == "pim-report":
            data["roleDefinitions"], data["eligibility"], data["assignments"] = fetch_pim(g)
        elif a.task == "app-credentials":
            data["applications"] = fetch_apps(g)
        else:
            data["registrationDetails"] = fetch_mfa(g)

    if a.task == "stale-users":
        result: object = evaluate_stale_users(data["users"], as_of, a.days)
    elif a.task == "ca-export":
        result = evaluate_ca_export(data["policies"], data["namedLocations"])
        a.out.mkdir(parents=True, exist_ok=True)
        for pid, pol in result["policies"].items():
            (a.out / f"{pid}.json").write_text(json.dumps(pol, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        (a.out / "named-locations.json").write_text(json.dumps(result["namedLocations"], indent=2, sort_keys=True) + "\n", encoding="utf-8")
        result = {"summary": result["summary"], "counts": result["counts"]}
    elif a.task == "pim-report":
        result = evaluate_pim(data["roleDefinitions"], data["eligibility"], data["assignments"], set(a.role))
    elif a.task == "app-credentials":
        result = evaluate_app_credentials(data["applications"], as_of)
    else:
        result = evaluate_mfa(data["registrationDetails"])
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
