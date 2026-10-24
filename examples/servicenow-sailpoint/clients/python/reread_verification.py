"""Re-read before close: verify records "Awaiting verification" against live state.

For each ServiceNow record in the awaiting-verification state:
  1. read the record's intended state (u_intended_state, JSON);
  2. re-read the subject's current state from its system of record:
       isc_account  -> GET  /v3/accounts/{id}              (ISC)
       isc_identity -> POST /v3/search, identities index    (ISC Search)
       entra_user   -> GET  /v1.0/users/{id}                (Microsoft Graph)
  3. compare; then
       match    -> close the record and write the evidence (query, timestamp,
                   result hash) to the record and as a JSON attachment;
       mismatch -> reopen the record with a work note saying what differs;
       pending  -> the ISC copy hasn't been aggregated since the record started
                   waiting; leave it alone until the grace period ends.

Read-only by default: prints what it would do. Pass --apply to write.
Illustrative: unit-tested against mocked responses, not yet proven against
live tenants.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from typing import Any, Mapping

import kit_common as kc

RECORD_FIELDS = ["sys_id", "number", "state", "u_system", "u_account_id", "u_identity_id",
                 "u_subject_id", "u_intended_state", "u_awaiting_since", "u_drift_class"]


def _parse_time(value: str | None) -> datetime | None:
    """Accept ISO 8601 (ISC, Graph) and 'YYYY-MM-DD HH:MM:SS' (ServiceNow, UTC)."""
    if not value:
        return None
    text = value.strip().replace("Z", "+00:00")
    for fmt in (None, "%Y-%m-%d %H:%M:%S"):
        try:
            parsed = datetime.fromisoformat(text) if fmt is None else datetime.strptime(text, fmt)
        except ValueError:
            continue
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return None


def list_awaiting(cfg: Mapping[str, str], http: kc.Http, sn: Mapping[str, str], table: str) -> list[dict]:
    query = f"state={cfg['SN_STATE_AWAITING_VERIFICATION']}^ORDERBYsys_updated_on"
    return list(kc.sn_table_all(http, kc.sn_base_url(cfg), table, sn, query, RECORD_FIELDS))


def reread(record: Mapping[str, Any], cfg: Mapping[str, str], http: kc.Http,
           isc: Mapping[str, str] | None, graph: Mapping[str, str] | None) -> dict:
    """Return {"system", "query", "observed", "exists"} for the record's subject."""
    system = record.get("u_system") or ("isc_account" if record.get("u_account_id") else "isc_identity")
    if system == "isc_account":
        account_id = record.get("u_account_id") or record.get("u_subject_id")
        query = f"GET /v3/accounts/{account_id}"
        try:
            observed = http.json("GET", f"{kc.isc_base_url(cfg)}/v3/accounts/{account_id}", headers=dict(isc or {}))
        except kc.KitError as exc:
            if "HTTP 404" in str(exc):
                return {"system": system, "query": query, "observed": None, "exists": False}
            raise
        return {"system": system, "query": query, "observed": observed, "exists": True}
    if system == "isc_identity":
        identity_id = record.get("u_identity_id") or record.get("u_subject_id")
        body = {"indices": ["identities"], "query": {"query": f'id:"{identity_id}"'}}
        hits = http.json("POST", f"{kc.isc_base_url(cfg)}/v3/search", headers=dict(isc or {}),
                         params={"limit": 1}, json=body) or []
        return {"system": system, "query": "POST /v3/search " + kc.canonical_json(body),
                "observed": hits[0] if hits else None, "exists": bool(hits)}
    if system == "entra_user":
        user_id = record.get("u_subject_id") or record.get("u_account_id")
        _, root = kc.graph_endpoints(cfg)
        url = f"{root}/v1.0/users/{user_id}?$select=id,accountEnabled,department,employeeId,jobTitle"
        try:
            observed = http.json("GET", url, headers=dict(graph or {}))
        except kc.KitError as exc:
            if "HTTP 404" in str(exc):
                return {"system": system, "query": "GET " + url, "observed": None, "exists": False}
            raise
        return {"system": system, "query": "GET " + url, "observed": observed, "exists": True}
    raise kc.KitError(f"Unsupported u_system {system!r} on {record.get('number')}")


def _values(container: Any) -> list[str]:
    if container is None:
        return []
    if isinstance(container, list):
        return [str(v) for v in container]
    return [str(container)]


def compare(intended: Mapping[str, Any], observation: Mapping[str, Any]) -> list[str]:
    """Return a list of differences; an empty list means the intended state holds."""
    diffs: list[str] = []
    observed = observation.get("observed")
    exists = observation.get("exists")
    if "exists" in intended:
        if bool(intended["exists"]) != bool(exists):
            diffs.append(f"exists: intended {intended['exists']}, observed {exists}")
        if not intended["exists"]:
            return diffs
    if not exists or observed is None:
        return diffs + ["subject not found"]
    attributes = observed.get("attributes") or {}
    for key in ("disabled", "accountEnabled", "locked"):
        if key in intended and observed.get(key) != intended[key]:
            diffs.append(f"{key}: intended {intended[key]}, observed {observed.get(key)}")
    for name, value in (intended.get("attributes") or {}).items():
        actual = attributes.get(name, observed.get(name))
        if actual != value:
            diffs.append(f"attribute {name}: intended {value!r}, observed {actual!r}")
    for item in intended.get("entitlements_absent") or []:
        if str(item.get("value")) in _values(attributes.get(item.get("attribute"))):
            diffs.append(f"entitlement {item.get('value')} still present in {item.get('attribute')}")
    for item in intended.get("entitlements_present") or []:
        if str(item.get("value")) not in _values(attributes.get(item.get("attribute"))):
            diffs.append(f"entitlement {item.get('value')} missing from {item.get('attribute')}")
    return diffs


def is_stale(record: Mapping[str, Any], observation: Mapping[str, Any], now: datetime,
             grace: timedelta) -> bool:
    """ISC reads reflect the last aggregation. If the account hasn't been
    modified since the record began waiting, the read may predate the change."""
    if not observation.get("system", "").startswith("isc") or not observation.get("observed"):
        return False
    waiting_since = _parse_time(record.get("u_awaiting_since"))
    modified = _parse_time((observation["observed"] or {}).get("modified"))
    if not waiting_since or not modified:
        return False
    return modified < waiting_since and now - waiting_since < grace


def build_evidence(record: Mapping[str, Any], intended: Mapping[str, Any], observation: Mapping[str, Any],
                   diffs: list[str], checked_at: str, checker_identity: str) -> dict:
    return {
        "record": record.get("number"),
        "record_sys_id": record.get("sys_id"),
        "system": observation.get("system"),
        "query": observation.get("query"),
        "checked_at": checked_at,
        "intended_state": intended,
        "result_sha256": kc.sha256_hex(observation.get("observed")),
        "match": not diffs,
        "differences": diffs,
        "checker": f"reread_verification.py/{kc.KIT_VERSION}",
        "checker_identity": checker_identity,
    }


def verify_records(records: list[dict], cfg: Mapping[str, str], http: kc.Http, sn: Mapping[str, str],
                   isc: Mapping[str, str] | None, graph: Mapping[str, str] | None, table: str,
                   apply: bool, grace_hours: float = 24.0, now: datetime | None = None,
                   out=sys.stdout) -> list[dict]:
    now = now or datetime.now(timezone.utc)
    checked_at = now.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    base = kc.sn_base_url(cfg)
    checker_identity = cfg.get("SAILPOINT_CLIENT_ID") or "unknown"
    results = []
    for record in records:
        number = record.get("number")
        try:
            intended = json.loads(record.get("u_intended_state") or "{}")
        except json.JSONDecodeError:
            intended = {}
        if not intended:
            results.append({"record": number, "outcome": "skipped", "reason": "no u_intended_state"})
            print(f"{number}: skipped, no intended state recorded", file=out)
            continue
        observation = reread(record, cfg, http, isc, graph)
        if is_stale(record, observation, now, timedelta(hours=grace_hours)):
            results.append({"record": number, "outcome": "pending", "reason": "not aggregated since waiting began"})
            print(f"{number}: pending, the ISC copy predates the change; re-run after the next aggregation", file=out)
            continue
        diffs = compare(intended, observation)
        evidence = build_evidence(record, intended, observation, diffs, checked_at, checker_identity)
        evidence_json = kc.canonical_json(evidence)
        evidence_hash = kc.sha256_hex(evidence)
        outcome = "verified" if not diffs else "mismatch"
        url = f"{base}/api/now/table/{table}/{record['sys_id']}"
        if outcome == "verified":
            patch = {"state": cfg["SN_STATE_CLOSED"], "u_evidence": evidence_json,
                     "u_evidence_hash": evidence_hash, "u_verified_at": checked_at,
                     "close_notes": f"Closed on re-read: {observation['query']} at {checked_at}; "
                                    f"result sha256 {evidence['result_sha256']}."}
        else:
            patch = {"state": cfg["SN_STATE_REOPENED"], "u_evidence": evidence_json,
                     "work_notes": "Re-read did not show the intended state; reopened. " + "; ".join(diffs)}
        if apply:
            http.json("PATCH", url, headers=dict(sn), json=patch)
            if outcome == "verified":
                attach_headers = dict(sn)
                attach_headers["Content-Type"] = "application/json"
                http.json("POST", f"{base}/api/now/attachment/file", headers=attach_headers,
                          params={"table_name": table, "table_sys_id": record["sys_id"],
                                  "file_name": f"reread-evidence-{number}.json"},
                          data=evidence_json.encode("utf-8"))
            print(f"{number}: {outcome}, record updated", file=out)
        else:
            print(f"[dry-run] {number}: {outcome}; would PATCH state={patch['state']}"
                  + ("" if outcome == "verified" else f" ({'; '.join(diffs)})"), file=out)
        results.append({"record": number, "outcome": outcome, "differences": diffs,
                        "evidence_sha256": evidence_hash, "applied": apply})
    return results


def main(argv: list[str] | None = None, http: kc.Http | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--config", help="JSON config file (no secrets)")
    parser.add_argument("--table", help="ServiceNow table (default SN_FINDING_TABLE)")
    parser.add_argument("--grace-hours", type=float, default=24.0,
                        help="How long to wait for an aggregation before treating a stale read as a mismatch")
    parser.add_argument("--apply", action="store_true", help="Write outcomes to ServiceNow (default: dry run)")
    parser.add_argument("--out-json", help="Write the results list here")
    args = parser.parse_args(argv)
    cfg = kc.load_config(args.config)
    http = http or kc.Http()
    table = args.table or cfg["SN_FINDING_TABLE"]
    sn = kc.sn_headers(cfg, http)
    records = list_awaiting(cfg, http, sn, table)
    systems = {r.get("u_system") or "isc_account" for r in records}
    isc = kc.isc_headers(cfg, http) if systems & {"isc_account", "isc_identity"} else None
    graph = kc.graph_headers(cfg, http) if "entra_user" in systems else None
    results = verify_records(records, cfg, http, sn, isc, graph, table, args.apply, args.grace_hours)
    if args.out_json:
        with open(args.out_json, "w", encoding="utf-8") as handle:
            json.dump(results, handle, indent=2)
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
