"""Read-only drift reconciliation: HR extract vs Microsoft Graph vs SailPoint ISC.

Joins on employeeId and emits findings for the Book 03 drift classes this
script can compute:

  missing_identity    active HR record, no matching account          (High)
  stale_access        terminated in HR, account still enabled         (High)
  orphan_account      enabled account matching no HR record           (High)
  attribute_drift     department or manager differs from HR           (Medium)
  unauthorized_write  HR-mastered attribute written by someone other
                      than the provisioning service; only when an
                      Entra audit extract or --include-audit is given  (High)

Credential drift and schema drift need the card system, Intune and the
middleware's validation output, so they are always reported as not computed.

Severity defaults are Book 03's; the High->P2, Medium->P3 mapping onto
Book 13's tempo is program design guidance.

Illustrative: unit-tested against mocked responses, not yet proven against
live tenants. Nothing here writes to Entra ID or ISC. --push-to-servicenow
lists what it would send unless --apply is also given.

Examples (from the kit root):

  # Offline, against the saved test fixtures
  python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --entra-audit-json tests/fixtures/entra_audit.json

  # Live reads, with the Entra audit since a given time
  python clients/python/identity_drift.py --hr-csv hr.csv --config config/config.example.json --include-audit 2026-10-17T00:00:00Z
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from typing import Any, Iterable, Mapping

import kit_common as kc

CLASS_SEVERITY = {
    "missing_identity": "High",
    "stale_access": "High",
    "orphan_account": "High",
    "attribute_drift": "Medium",
    "unauthorized_write": "High",
    "credential_drift": "High",
    "schema_drift": "Medium",
}
SEVERITY_TO_PRIORITY = {"High": "P2", "Medium": "P3"}  # design guidance
NOT_COMPUTABLE = {
    "credential_drift": "needs the card management system and Intune certificate reports",
    "schema_drift": "needs the provisioning middleware's validation output",
}
ACTIVE_STATUSES = {"active", "leave", "on leave", "loa"}
TERMINATED_STATUSES = {"terminated", "separated", "inactive", "retired", "deceased"}
HR_COLUMNS = ["employeeId", "status", "department", "managerEmployeeId", "displayName", "email"]
# Entra audit modifiedProperties display names treated as HR-mastered.
WATCHED_AUDIT_PROPERTIES = {"Department", "EmployeeId", "JobTitle", "Manager", "CompanyName",
                            "EmployeeType", "OfficeLocation"}
CSV_FIELDS = ["finding_id", "drift_class", "severity", "priority", "system", "employee_id",
              "object_id", "object_name", "attribute", "expected", "observed", "detected_at",
              "evidence"]


# --------------------------------------------------------------------------
# Inputs
# --------------------------------------------------------------------------

def load_hr_csv(path: str) -> dict[str, dict]:
    """HR extract keyed on employeeId. Required columns: employeeId, status."""
    with open(path, encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = {"employeeId", "status"} - set(reader.fieldnames or [])
        if missing:
            raise kc.KitError(f"HR CSV is missing columns: {sorted(missing)}")
        records = {}
        for row in reader:
            key = (row.get("employeeId") or "").strip()
            if key:
                records[key] = {k: (v or "").strip() for k, v in row.items() if k}
    return records


def hr_state(record: Mapping[str, str]) -> str:
    status = record.get("status", "").strip().lower()
    if status in ACTIVE_STATUSES:
        return "active"
    if status in TERMINATED_STATUSES:
        return "terminated"
    return "unknown"


def fetch_graph_users(cfg: Mapping[str, str], http: kc.Http, headers: Mapping[str, str]) -> list[dict]:
    """GET /v1.0/users with the HR-relevant properties and the manager's employeeId."""
    _, graph = kc.graph_endpoints(cfg)
    url = (f"{graph}/v1.0/users?$select=id,userPrincipalName,displayName,employeeId,"
           "accountEnabled,department,userType&$expand=manager($select=id,employeeId)&$top=999")
    return list(kc.graph_get_all(http, url, headers))


def fetch_entra_audit(cfg: Mapping[str, str], http: kc.Http, headers: Mapping[str, str],
                      since_iso: str) -> list[dict]:
    """GET /v1.0/auditLogs/directoryAudits for user updates (needs AuditLog.Read.All)."""
    _, graph = kc.graph_endpoints(cfg)
    url = (f"{graph}/v1.0/auditLogs/directoryAudits?$filter=activityDateTime ge {since_iso}"
           " and category eq 'UserManagement'")
    return list(kc.graph_get_all(http, url, headers))


def fetch_isc_identities(cfg: Mapping[str, str], http: kc.Http, headers: Mapping[str, str]) -> list[dict]:
    """ISC Search, identities index (accounts are nested on each identity)."""
    body = {"indices": ["identities"], "query": {"query": "*"},
            "queryResultFilter": {"includes": ["id", "name", "displayName", "employeeNumber",
                                               "attributes", "manager", "accounts", "disabled"]}}
    return list(kc.isc_search_all(http, kc.isc_base_url(cfg), headers, body))


def fetch_isc_uncorrelated_accounts(cfg: Mapping[str, str], http: kc.Http,
                                    headers: Mapping[str, str]) -> list[dict]:
    """GET /v3/accounts?filters=uncorrelated eq true (needs idn:accounts:read)."""
    url = kc.isc_base_url(cfg) + "/v3/accounts"
    return list(kc.isc_list_all(http, url, headers, params={"filters": "uncorrelated eq true"}))


# --------------------------------------------------------------------------
# Reconciliation
# --------------------------------------------------------------------------

def _finding(drift_class: str, system: str, employee_id: str | None, object_id: str | None,
             object_name: str | None, attribute: str | None, expected: Any, observed: Any,
             evidence: Mapping[str, Any], detected_at: str) -> dict:
    severity = CLASS_SEVERITY[drift_class]
    finding = {
        "drift_class": drift_class,
        "severity": severity,
        "priority": SEVERITY_TO_PRIORITY[severity],
        "system": system,
        "employee_id": employee_id or "",
        "object_id": object_id or "",
        "object_name": object_name or "",
        "attribute": attribute or "",
        "expected": expected,
        "observed": observed,
        "detected_at": detected_at,
        "evidence": dict(evidence),
    }
    id_parts = [str(p) if p not in (None, "") else None for p in (drift_class, system, employee_id, object_id, attribute)]
    finding["finding_id"] = kc.sha256_hex(id_parts)[:16]
    return finding


def _isc_employee_id(identity: Mapping[str, Any], attribute: str) -> str:
    if attribute in identity and identity.get(attribute):
        return str(identity[attribute])
    return str((identity.get("attributes") or {}).get(attribute) or "")


def compute_findings(hr: Mapping[str, dict], graph_users: Iterable[dict] | None,
                     isc_identities: Iterable[dict] | None, isc_uncorrelated: Iterable[dict] | None,
                     entra_audit: Iterable[dict] | None = None, options: Mapping[str, Any] | None = None,
                     detected_at: str | None = None) -> dict:
    """Return {"findings": [...], "computed": [...], "not_computed": {...}}."""
    options = dict(options or {})
    detected_at = detected_at or kc.utc_now()
    emp_attr = options.get("isc_employee_id_attribute", "employeeNumber")
    authoritative = {s.lower() for s in options.get("isc_authoritative_sources", [])}
    allowed_writers = set(options.get("allowed_writer_app_ids", []))
    orphan_exclude = [p.lower() for p in options.get("orphan_exclude_upn_prefixes", [])]
    findings: list[dict] = []
    computed: set[str] = set()
    not_computed = dict(NOT_COMPUTABLE)

    # ---- Entra ID (Microsoft Graph) ----
    if graph_users is not None:
        computed.update({"missing_identity", "stale_access", "orphan_account", "attribute_drift"})
        users = [u for u in graph_users if (u.get("userType") or "Member") == "Member"]
        by_emp: dict[str, list[dict]] = {}
        for user in users:
            emp = (user.get("employeeId") or "").strip()
            if emp:
                by_emp.setdefault(emp, []).append(user)
        for emp, record in hr.items():
            state = hr_state(record)
            matches = by_emp.get(emp, [])
            ev_hr = {"hr_record": {k: record.get(k, "") for k in HR_COLUMNS if k in record}}
            if state == "active" and not matches:
                findings.append(_finding("missing_identity", "entra", emp, None, record.get("displayName"),
                                         None, "account exists", "no Entra user with this employeeId",
                                         {**ev_hr, "query": "GET /v1.0/users (employeeId join)"}, detected_at))
            for user in matches:
                ev = {**ev_hr, "graph_user": {k: user.get(k) for k in
                                              ("id", "userPrincipalName", "accountEnabled", "department")}}
                if state == "terminated" and user.get("accountEnabled"):
                    findings.append(_finding("stale_access", "entra", emp, user.get("id"),
                                             user.get("userPrincipalName"), "accountEnabled", False, True,
                                             ev, detected_at))
                if state != "active":
                    continue
                hr_dept, dept = record.get("department", ""), user.get("department") or ""
                if hr_dept and hr_dept != dept:
                    findings.append(_finding("attribute_drift", "entra", emp, user.get("id"),
                                             user.get("userPrincipalName"), "department", hr_dept, dept,
                                             ev, detected_at))
                hr_mgr = record.get("managerEmployeeId", "")
                mgr = ((user.get("manager") or {}).get("employeeId") or "")
                if hr_mgr and hr_mgr != mgr:
                    findings.append(_finding("attribute_drift", "entra", emp, user.get("id"),
                                             user.get("userPrincipalName"), "manager", hr_mgr, mgr or None,
                                             ev, detected_at))
        for user in users:
            emp = (user.get("employeeId") or "").strip()
            upn = (user.get("userPrincipalName") or "").lower()
            if not user.get("accountEnabled") or emp in hr:
                continue
            if any(upn.startswith(p) for p in orphan_exclude):
                continue
            findings.append(_finding("orphan_account", "entra", emp or None, user.get("id"),
                                     user.get("userPrincipalName"), "employeeId", "a current HR record",
                                     emp or None, {"graph_user": {k: user.get(k) for k in
                                                                  ("id", "userPrincipalName", "employeeId",
                                                                   "accountEnabled")}}, detected_at))

    # ---- SailPoint ISC ----
    if isc_identities is not None:
        computed.update({"missing_identity", "stale_access", "attribute_drift"})
        identities = list(isc_identities)
        by_isc_id = {i.get("id"): i for i in identities}
        by_emp_isc: dict[str, list[dict]] = {}
        for ident in identities:
            emp = _isc_employee_id(ident, emp_attr)
            if emp:
                by_emp_isc.setdefault(emp, []).append(ident)
        for emp, record in hr.items():
            state = hr_state(record)
            matches = by_emp_isc.get(emp, [])
            ev_hr = {"hr_record": {k: record.get(k, "") for k in HR_COLUMNS if k in record}}
            if state == "active" and not matches:
                findings.append(_finding("missing_identity", "isc", emp, None, record.get("displayName"),
                                         None, "identity exists", "no ISC identity with this employee id",
                                         {**ev_hr, "query": "POST /v3/search indices=identities"}, detected_at))
            for ident in matches:
                if state == "terminated":
                    for account in ident.get("accounts") or []:
                        source = ((account.get("source") or {}).get("name") or "")
                        if source.lower() in authoritative or account.get("disabled"):
                            continue
                        findings.append(_finding(
                            "stale_access", "isc", emp, account.get("id"),
                            f"{source}:{account.get('accountId') or account.get('name')}", "disabled", True,
                            False, {**ev_hr, "isc_identity_id": ident.get("id"),
                                    "isc_account": {k: account.get(k) for k in
                                                    ("id", "accountId", "name", "disabled")},
                                    "source": source}, detected_at))
                if state != "active":
                    continue
                attrs = ident.get("attributes") or {}
                hr_dept = record.get("department", "")
                if hr_dept and "department" in attrs and attrs.get("department") != hr_dept:
                    findings.append(_finding("attribute_drift", "isc", emp, ident.get("id"), ident.get("name"),
                                             "department", hr_dept, attrs.get("department"),
                                             {**ev_hr, "isc_identity_id": ident.get("id")}, detected_at))
                hr_mgr = record.get("managerEmployeeId", "")
                mgr_ref = ident.get("manager") or {}
                if hr_mgr and mgr_ref:
                    mgr_ident = by_isc_id.get(mgr_ref.get("id"))
                    mgr_emp = _isc_employee_id(mgr_ident, emp_attr) if mgr_ident else ""
                    if mgr_emp and mgr_emp != hr_mgr:
                        findings.append(_finding("attribute_drift", "isc", emp, ident.get("id"), ident.get("name"),
                                                 "manager", hr_mgr, mgr_emp,
                                                 {**ev_hr, "isc_identity_id": ident.get("id"),
                                                  "isc_manager_id": mgr_ref.get("id")}, detected_at))

    if isc_uncorrelated is not None:
        computed.add("orphan_account")
        for account in isc_uncorrelated:
            if account.get("disabled") or not account.get("uncorrelated", True):
                continue
            source = account.get("sourceName") or ""
            if source.lower() in authoritative:
                continue
            findings.append(_finding("orphan_account", "isc", None, account.get("id"),
                                     f"{source}:{account.get('nativeIdentity') or account.get('name')}",
                                     "identity", "correlated to a person", "uncorrelated",
                                     {"isc_account": {k: account.get(k) for k in
                                                      ("id", "name", "nativeIdentity", "sourceId", "sourceName",
                                                       "uncorrelated", "disabled")},
                                      "query": "GET /v3/accounts?filters=uncorrelated eq true"}, detected_at))

    # ---- Unauthorized write (Entra audit) ----
    if entra_audit is not None:
        computed.add("unauthorized_write")
        emp_by_object = {u.get("id"): (u.get("employeeId") or "") for u in (graph_users or [])}
        for entry in entra_audit:
            if (entry.get("activityDisplayName") or "") != "Update user":
                continue
            initiated = entry.get("initiatedBy") or {}
            app = initiated.get("app") or {}
            if app.get("appId") and app.get("appId") in allowed_writers:
                continue
            actor = (initiated.get("user") or {}).get("userPrincipalName") or app.get("displayName") or "unknown"
            for target in entry.get("targetResources") or []:
                for prop in target.get("modifiedProperties") or []:
                    if prop.get("displayName") not in WATCHED_AUDIT_PROPERTIES:
                        continue
                    findings.append(_finding(
                        "unauthorized_write", "entra", emp_by_object.get(target.get("id")), target.get("id"),
                        target.get("userPrincipalName"), prop.get("displayName"), prop.get("oldValue"),
                        prop.get("newValue"), {"audit_id": entry.get("id"), "activityDateTime":
                                               entry.get("activityDateTime"), "initiated_by": actor},
                        detected_at))
    else:
        not_computed["unauthorized_write"] = "no Entra audit extract supplied (--entra-audit-json or --include-audit)"

    findings.sort(key=lambda f: (f["drift_class"], f["system"], f["employee_id"], f["object_id"], f["attribute"]))
    return {"findings": findings, "computed": sorted(computed), "not_computed": not_computed}


# --------------------------------------------------------------------------
# Outputs
# --------------------------------------------------------------------------

def write_json(result: Mapping[str, Any], path: str) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, sort_keys=True, default=str)
        handle.write("\n")


def write_csv(findings: Iterable[Mapping[str, Any]], path: str) -> None:
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for finding in findings:
            row = {k: finding.get(k, "") for k in CSV_FIELDS}
            for key in ("expected", "observed", "evidence"):
                value = row[key]
                row[key] = value if isinstance(value, str) else kc.canonical_json(value)
            writer.writerow(row)


def to_servicenow_payload(finding: Mapping[str, Any]) -> dict:
    """The identity-finding data contract the Scripted REST resource accepts."""
    subject = finding.get("object_id") or finding.get("employee_id")
    intended: dict[str, Any] = {}
    if finding["drift_class"] in ("stale_access", "orphan_account"):
        intended = {"disabled": True} if finding["system"] == "isc" else {"accountEnabled": False}
    elif finding["drift_class"] == "attribute_drift" and finding.get("attribute"):
        intended = {"attributes": {finding["attribute"]: finding.get("expected")}}
    return {
        "kind": "finding",
        "source": "drift-reconciliation",
        "drift_class": finding["drift_class"],
        "severity": finding["priority"],
        "system": {"entra": "entra_user", "isc": "isc_account"}.get(finding["system"], finding["system"]),
        "subject_id": subject,
        "account_id": finding.get("object_id") or "",
        "employee_id": finding.get("employee_id") or "",
        "object_name": finding.get("object_name") or "",
        "attribute": finding.get("attribute") or "",
        "expected_value": finding.get("expected"),
        "observed_value": finding.get("observed"),
        "intended_state": intended,
        "origin": {"type": "drift-reconciliation", "finding_id": finding["finding_id"],
                   "checker": f"identity_drift.py/{kc.KIT_VERSION}"},
        "detected_at": finding["detected_at"],
        "evidence": finding.get("evidence", {}),
    }


def push_to_servicenow(findings: Iterable[Mapping[str, Any]], cfg: Mapping[str, str], http: kc.Http,
                       headers: Mapping[str, str], apply: bool, out=sys.stdout) -> list[dict]:
    results = []
    url = kc.sn_base_url(cfg) + cfg["SN_FINDING_API_PATH"]
    for finding in findings:
        payload = to_servicenow_payload(finding)
        if not apply:
            print(f"[dry-run] would POST {finding['drift_class']} {finding['finding_id']} to {url}", file=out)
            results.append({"finding_id": finding["finding_id"], "action": "dry-run"})
            continue
        body = http.json("POST", url, headers=dict(headers), json=payload) or {}
        result = body.get("result", body)
        results.append({"finding_id": finding["finding_id"], "action": "posted",
                        "sys_id": result.get("sys_id"), "deduplicated": result.get("deduplicated")})
    return results


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def _load_json(path: str | None) -> Any:
    if not path:
        return None
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    return data.get("value", data) if isinstance(data, dict) else data


def main(argv: list[str] | None = None, http: kc.Http | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--hr-csv", required=True, help="HR extract (employeeId,status,department,managerEmployeeId,...)")
    parser.add_argument("--config", help="JSON config file (no secrets)")
    parser.add_argument("--graph-users-json", help="Use a saved Graph users export instead of calling Graph")
    parser.add_argument("--isc-identities-json", help="Use a saved ISC identities search export")
    parser.add_argument("--isc-accounts-json", help="Use a saved ISC uncorrelated accounts export")
    parser.add_argument("--entra-audit-json", help="Saved Entra directoryAudits export (enables unauthorized_write)")
    parser.add_argument("--include-audit", metavar="SINCE_ISO", help="Fetch Entra audit since this UTC time")
    parser.add_argument("--skip-graph", action="store_true")
    parser.add_argument("--skip-isc", action="store_true")
    parser.add_argument("--out-json", default="identity-drift.json")
    parser.add_argument("--out-csv", default="identity-drift.csv")
    parser.add_argument("--push-to-servicenow", action="store_true", help="Send findings to the Scripted REST endpoint")
    parser.add_argument("--apply", action="store_true", help="With --push-to-servicenow, actually POST")
    args = parser.parse_args(argv)

    cfg = kc.load_config(args.config)
    http = http or kc.Http()
    hr = load_hr_csv(args.hr_csv)

    graph_users = _load_json(args.graph_users_json)
    audit = _load_json(args.entra_audit_json)
    if graph_users is None and not args.skip_graph:
        gh = kc.graph_headers(cfg, http)
        graph_users = fetch_graph_users(cfg, http, gh)
        if args.include_audit:
            audit = fetch_entra_audit(cfg, http, gh, args.include_audit)
    identities = _load_json(args.isc_identities_json)
    accounts = _load_json(args.isc_accounts_json)
    if (identities is None or accounts is None) and not args.skip_isc:
        ih = kc.isc_headers(cfg, http)
        if identities is None:
            identities = fetch_isc_identities(cfg, http, ih)
        if accounts is None:
            accounts = fetch_isc_uncorrelated_accounts(cfg, http, ih)

    options = {
        "isc_employee_id_attribute": cfg.get("ISC_EMPLOYEE_ID_ATTRIBUTE", "employeeNumber"),
        "isc_authoritative_sources": [s for s in cfg.get("ISC_AUTHORITATIVE_SOURCES", "").split(",") if s],
        "allowed_writer_app_ids": [s for s in cfg.get("ALLOWED_WRITER_APP_IDS", "").split(",") if s],
    }
    result = compute_findings(hr, graph_users, identities, accounts, audit, options)
    write_json(result, args.out_json)
    write_csv(result["findings"], args.out_csv)
    counts: dict[str, int] = {}
    for finding in result["findings"]:
        counts[finding["drift_class"]] = counts.get(finding["drift_class"], 0) + 1
    print(json.dumps({"counts": counts, "not_computed": result["not_computed"],
                      "out_json": args.out_json, "out_csv": args.out_csv}, indent=2))
    if args.push_to_servicenow:
        push_to_servicenow(result["findings"], cfg, http, kc.sn_headers(cfg, http), args.apply)
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
