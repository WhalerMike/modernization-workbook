#!/usr/bin/env python3
"""Correlate an Oracle Fusion Cloud HCM extract with Active Directory and Microsoft Entra ID on the person key.

ILLUSTRATIVE: unit-tested against fixtures, not proven against live tenants.

Read-only. It reads three files and writes two: nothing is sent anywhere.

  --extract  the HCM extract (CSV), the same layout hcm_to_scim.py reads
  --ad       the Start Kit's AD export (ad-user-export.csv, from Get-FMPAttributeSurvey)
  --entra    optional: an Entra ID users export (a JSON array of Graph user objects, or a
             saved {"value": [...]} page), with employeeId, accountEnabled, employeeType,
             onPremisesExtensionAttributes and, when expanded, manager

It joins them on the person key (PersonNumber to employeeID and employeeId) and sorts every
key into one status: matched, matched_with_conflicts, hr_only (an active worker with no
account), directory_only (an enabled account no worker record holds), duplicate_key (held
twice on any side), no_key (an enabled account with no key), and the informational
hr_only_inactive and directory_only_disabled. For a matched key it compares what HR says
with what each directory holds, through config/mapping.json: account state, organization
code, worker type and its code, position category and manager.

  correlation-report.json      counts, rates and per key its status, the sides that hold it
                               and the names of the fields that conflict. No names, no values.
  correlation-quarantine.json  each record that needs a decision, with the HR rows and the
                               directory rows as read. Personal data: keep it in the
                               access-controlled audit store, as with quarantine.json.

That is the Attribute-Driven Migration implementation guide's Gate 2 match ("every enabled
account matched to a worker record before the first full sync"), field by field. Exit code 0
when nothing needs a decision, 2 when the quarantine has entries, 1 on an error.

Standard library only; Python 3.10 or later.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

EXIT_OK, EXIT_ERROR, EXIT_QUARANTINE = 0, 1, 2

PROBLEM = ("matched_with_conflicts", "hr_only", "directory_only", "duplicate_key", "no_key", "hr_no_key")
STATUS_ORDER = ("matched", "matched_with_conflicts", "hr_only", "hr_only_inactive", "directory_only",
                "directory_only_disabled", "duplicate_key", "no_key", "hr_no_key")


def load_json(path: Path) -> Any:
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def read_csv(path: Path) -> list[dict[str, str]]:
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def read_entra(path: Path) -> list[dict[str, Any]]:
    data = load_json(path)
    if isinstance(data, dict):
        data = data.get("value", [])
    return [u for u in data if (u.get("userType") or "Member") == "Member"]


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def norm_key(value: Any) -> str:
    return str(value or "").strip().upper()


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def truthy(value: Any) -> bool:
    return value is True or str(value).strip().lower() == "true"


# ---------------------------------------------------------------- the two directories, one shape

def ad_view(row: dict[str, str]) -> dict[str, Any]:
    return {
        "enabled": truthy(row.get("Enabled")),
        "org_code": text(row.get("extensionAttribute10")),
        "worker_type_code": text(row.get("extensionAttribute11")),
        "position_category": text(row.get("extensionAttribute12")),
        "worker_type": text(row.get("EmployeeType")),
        "manager": norm_key(row.get("ManagerEmployeeId")),
        "manager_read": True,
        "service_account": truthy(row.get("HasSpn")),
        "account": "ad:" + text(row.get("SID")),
    }


def entra_view(user: dict[str, Any]) -> dict[str, Any]:
    ext = user.get("onPremisesExtensionAttributes") or {}
    manager = user.get("manager")
    return {
        "enabled": user.get("accountEnabled") is True,
        "org_code": text(ext.get("extensionAttribute10")),
        "worker_type_code": text(ext.get("extensionAttribute11")),
        "position_category": text(ext.get("extensionAttribute12")),
        "worker_type": text(user.get("employeeType")),
        "manager": norm_key((manager or {}).get("employeeId")),
        "manager_read": "manager" in user,
        "service_account": False,
        "account": "entra:" + text(user.get("id")),
    }


def hr_expected(row: dict[str, str], mapping: dict[str, Any]) -> dict[str, Any]:
    status = mapping["assignment_status_types"].get(text(row.get("AssignmentStatusType")).upper())
    worker = mapping["worker_types"].get(text(row.get("WorkerType")).upper())
    return {
        "active": bool(status and status["active"]),
        "status": text(row.get("AssignmentStatusType")).upper(),
        "org_code": text(row.get("DepartmentCode")),
        "worker_type_code": worker["code"] if worker else None,
        "worker_type": worker["employeeType"] if worker else None,
        "position_category": text(row.get("PositionCategory")),
        "manager": norm_key(row.get("ManagerPersonNumber")),
    }


FIELDS = (
    ("org_code", "organization code", "extensionAttribute10"),
    ("worker_type_code", "worker type code", "extensionAttribute11"),
    ("worker_type", "worker type", "employeeType"),
    ("position_category", "position category", "extensionAttribute12"),
    ("manager", "manager's key", "manager"),
)


def compare(hr: dict[str, Any], side: str, d: dict[str, Any]) -> tuple[list[str], list[str]]:
    """Field names and reasons where a directory account disagrees with the HR record."""
    fields: list[str] = []
    reasons: list[str] = []
    label = "AD" if side == "ad" else "Entra ID"
    if not hr["active"] and d["enabled"]:
        fields.append(f"{side}.account_enabled")
        reasons.append(f"HR status {hr['status']}, but the {label} account is enabled")
    elif hr["active"] and not d["enabled"]:
        fields.append(f"{side}.account_enabled")
        reasons.append(f"HR status {hr['status']}, but the {label} account is disabled")
    for name, words, attribute in FIELDS:
        want = hr[name]
        if want is None or (name == "manager" and not d["manager_read"]):
            continue
        if want != d[name]:
            fields.append(f"{side}.{name}")
            reasons.append(f"{label} {attribute} differs from HR's {words}")
    return fields, reasons


# ---------------------------------------------------------------- the join

def correlate(hr_rows: list[dict[str, str]], ad_rows: list[dict[str, str]], entra_users: list[dict[str, Any]] | None,
              mapping: dict[str, Any]) -> dict[str, Any]:
    hr: dict[str, list[dict[str, str]]] = {}
    hr_no_key: list[dict[str, str]] = []
    for row in hr_rows:
        k = norm_key(row.get("PersonNumber"))
        if k:
            hr.setdefault(k, []).append(row)
        else:
            hr_no_key.append(row)
    sides: dict[str, dict[str, list[tuple[dict[str, Any], Any]]]] = {"ad": {}, "entra": {}}
    no_key: list[tuple[str, dict[str, Any], Any]] = []
    skipped = 0
    for row in ad_rows:
        v = ad_view(row)
        if v["service_account"]:
            skipped += 1
            continue
        k = norm_key(row.get("EmployeeId"))
        if k:
            sides["ad"].setdefault(k, []).append((v, row))
        elif v["enabled"]:
            no_key.append(("ad", v, row))
    for user in entra_users or []:
        v = entra_view(user)
        k = norm_key(user.get("employeeId"))
        if k:
            sides["entra"].setdefault(k, []).append((v, user))
        elif v["enabled"]:
            no_key.append(("entra", v, user))

    records: list[dict[str, Any]] = []
    quarantine: list[dict[str, Any]] = []
    conflicts_by_field: dict[str, int] = {}
    for key in sorted(set(hr) | set(sides["ad"]) | set(sides["entra"])):
        h = hr.get(key, [])
        a = sides["ad"].get(key, [])
        e = sides["entra"].get(key, [])
        fields: list[str] = []
        reasons: list[str] = []
        if len(h) > 1 or len(a) > 1 or len(e) > 1:
            status = "duplicate_key"
            for side, n in (("HR", len(h)), ("AD", len(a)), ("Entra ID", len(e))):
                if n > 1:
                    reasons.append(f"held by {n} records in {side}")
        elif h and (a or e):
            want = hr_expected(h[0], mapping)
            for side, items in (("ad", a), ("entra", e)):
                if items:
                    f, r = compare(want, side, items[0][0])
                    fields += f
                    reasons += r
            status = "matched_with_conflicts" if fields else "matched"
            for f in fields:
                conflicts_by_field[f] = conflicts_by_field.get(f, 0) + 1
        elif h:
            if hr_expected(h[0], mapping)["active"]:
                status = "hr_only"
                reasons.append("an active worker with no account in either directory: a missing identity")
            else:
                status = "hr_only_inactive"
        else:
            if any(v["enabled"] for v, _ in a + e):
                status = "directory_only"
                reasons.append("an enabled account no worker record holds: an orphan candidate, owned or on a dated exception")
            else:
                status = "directory_only_disabled"
        records.append({
            "person_key": key,
            "status": status,
            "sides": {"hr": len(h), "ad": len(a), "entra": len(e)},
            "conflicts": fields,
            "reasons": reasons,
        })
        if status in PROBLEM:
            quarantine.append({
                "person_key": key,
                "status": status,
                "reasons": reasons,
                "hr_records": h,
                "ad_accounts": [r for _, r in a],
                "entra_accounts": [u for _, u in e],
            })
    for side, v, raw in no_key:
        records.append({"person_key": "", "account": v["account"], "status": "no_key",
                        "sides": {"hr": 0, "ad": int(side == "ad"), "entra": int(side == "entra")}, "conflicts": [],
                        "reasons": ["an enabled account with no person key: it can't be correlated"]})
        quarantine.append({"person_key": "", "account": v["account"], "status": "no_key",
                           "reasons": ["an enabled account with no person key: it can't be correlated"], "hr_records": [],
                           "ad_accounts": [raw] if side == "ad" else [], "entra_accounts": [raw] if side == "entra" else []})
    for row in hr_no_key:
        records.append({"person_key": "", "status": "hr_no_key", "sides": {"hr": 1, "ad": 0, "entra": 0}, "conflicts": [],
                        "reasons": ["an HR record with no person number: it can't be correlated"]})
        quarantine.append({"person_key": "", "status": "hr_no_key", "reasons": ["an HR record with no person number: it can't be correlated"],
                           "hr_records": [row], "ad_accounts": [], "entra_accounts": []})

    counts = {s: 0 for s in STATUS_ORDER}
    for r in records:
        counts[r["status"]] += 1
    matched = counts["matched"] + counts["matched_with_conflicts"]
    active = sum(1 for k, rows in hr.items() if len(rows) == 1 and hr_expected(rows[0], mapping)["active"])
    active_matched = sum(1 for r in records if r["status"] in ("matched", "matched_with_conflicts")
                         and hr_expected(hr[r["person_key"]][0], mapping)["active"])
    enabled = sum(1 for side in sides.values() for items in side.values() for v, _ in items if v["enabled"]) + len(no_key)
    enabled_matched = sum(1 for r in records if r["status"] in ("matched", "matched_with_conflicts")
                          for side in ("ad", "entra") for v, _ in sides[side].get(r["person_key"], []) if v["enabled"])
    return {
        "counts": counts,
        "totals": {
            "hr_records": len(hr_rows),
            "ad_accounts": len(ad_rows) - skipped,
            "ad_service_accounts_skipped": skipped,
            "entra_accounts": None if entra_users is None else len(entra_users),
            "quarantined": len(quarantine),
        },
        "rates": {
            "active_workers_matched_percent": round(100 * active_matched / active, 1) if active else None,
            "enabled_accounts_matched_percent": round(100 * enabled_matched / enabled, 1) if enabled else None,
        },
        "conflicts_by_field": dict(sorted(conflicts_by_field.items())),
        "records": records,
        "quarantine": quarantine,
    }


def report(result: dict[str, Any], as_of: dt.date, inputs: dict[str, str | None]) -> dict[str, Any]:
    return {
        "schema": "fmp-hcm-correlation/1",
        "as_of": as_of.isoformat(),
        "inputs": inputs,
        "counts": result["counts"],
        "totals": result["totals"],
        "rates": result["rates"],
        "conflicts_by_field": result["conflicts_by_field"],
        "records": result["records"],
    }


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def main(argv: list[str] | None = None) -> int:
    here = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--extract", required=True, type=Path, help="HCM extract CSV")
    parser.add_argument("--ad", required=True, type=Path, help="the Start Kit's ad-user-export.csv")
    parser.add_argument("--entra", type=Path, help="Entra ID users export (JSON)")
    parser.add_argument("--mapping", type=Path, default=here / "config" / "mapping.json")
    parser.add_argument("--out", type=Path, default=Path("out"))
    parser.add_argument("--as-of", default=dt.date.today().isoformat(), help="run date, yyyy-mm-dd")
    args = parser.parse_args(argv)
    try:
        as_of = dt.date.fromisoformat(args.as_of)
        mapping = load_json(args.mapping)
        result = correlate(read_csv(args.extract), read_csv(args.ad), read_entra(args.entra) if args.entra else None, mapping)
    except (OSError, ValueError, KeyError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return EXIT_ERROR
    inputs = {
        "extract_sha256": file_sha256(args.extract),
        "ad_sha256": file_sha256(args.ad),
        "entra_sha256": file_sha256(args.entra) if args.entra else None,
        "mapping_sha256": file_sha256(args.mapping),
    }
    args.out.mkdir(parents=True, exist_ok=True)
    write_json(args.out / "correlation-report.json", report(result, as_of, inputs))
    write_json(args.out / "correlation-quarantine.json", result["quarantine"])
    print(json.dumps({"counts": result["counts"], "rates": result["rates"]}, separators=(",", ":")))
    return EXIT_QUARANTINE if result["quarantine"] else EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
