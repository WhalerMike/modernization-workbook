#!/usr/bin/env python3
"""Convert an Oracle Fusion Cloud HCM extract (CSV) into SCIM bulk requests for
Microsoft Entra API-driven inbound provisioning, validate every record, and
optionally POST the batches to the provisioning app's /bulkUpload endpoint.

ILLUSTRATIVE: unit-tested against fixtures, not proven against live tenants.

Dry run is the default. Nothing leaves the machine unless --apply is given.

The mapping follows Book 03, Chapter 06 (the canonical schema and the program
attribute map) as configured in config/mapping.json. Book 03 is the Federal
Modernization Workbook's HR-driven identity book; this file is an example, not
an agency's implementation.

Standard library only; Python 3.10 or later.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

CORE_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User"
ENTERPRISE_SCHEMA = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
BULK_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:BulkRequest"

# The provisioning API endpoint: worldwide Graph (also used by Microsoft 365 GCC),
# GCC High, or DoD. Anything else is refused.
ENDPOINT_PATTERN = re.compile(
    r"^https://(graph\.microsoft\.com|graph\.microsoft\.us|dod-graph\.microsoft\.us)"
    r"/(v1\.0|beta)/servicePrincipals/[0-9a-fA-F-]{36}"
    r"/synchronization/jobs/[A-Za-z0-9._-]+/bulkUpload$"
)
SECRET_KEY_PATTERN = re.compile(r"(secret|password|passwd|token|credential|private|apikey|api_key|bearer)", re.I)
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
OFFSET_PATTERN = re.compile(r"^[+-](0\d|1[0-4]):[0-5]\d$")
TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
TOKEN_ENV = "HCM_ENTRA_BEARER_TOKEN"

EXIT_OK, EXIT_ERROR, EXIT_QUARANTINE, EXIT_HELD = 0, 1, 2, 3


class ConfigError(ValueError):
    """Configuration that the client refuses to run with."""


# ---------------------------------------------------------------- configuration

def load_json(path: Path) -> dict[str, Any]:
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def check_no_secrets(settings: dict[str, Any]) -> None:
    """Refuse a settings file that carries anything that looks like a secret."""
    for key in settings:
        if key.startswith("_"):
            continue
        if SECRET_KEY_PATTERN.search(key):
            raise ConfigError(f"settings key '{key}' looks like a secret; secrets never go in a file")


def validate_settings(settings: dict[str, Any]) -> dict[str, Any]:
    check_no_secrets(settings)
    merged = {
        "endpoint": "",
        "default_utc_offset": "+00:00",
        "hire_local_time": "05:00",
        "leave_local_time": "23:00",
        "max_disables_per_run": 25,
        "daily_call_budget": 2000,
        "min_seconds_between_calls": 0.15,
        "max_retries": 4,
        "catch_up_days": 3,
        "prestart_disabled": True,
    }
    merged.update({k: v for k, v in settings.items() if not k.startswith("_")})
    if not OFFSET_PATTERN.match(merged["default_utc_offset"]):
        raise ConfigError("default_utc_offset must look like -05:00")
    for key in ("hire_local_time", "leave_local_time"):
        if not TIME_PATTERN.match(merged[key]):
            raise ConfigError(f"{key} must look like 05:00")
    # 40 calls in any 5-second window is the documented ceiling; never pace faster than that.
    if float(merged["min_seconds_between_calls"]) < 0.125:
        raise ConfigError("min_seconds_between_calls must be at least 0.125 (40 calls per 5 seconds)")
    return merged


def validate_endpoint(endpoint: str) -> str:
    if not ENDPOINT_PATTERN.match(endpoint or ""):
        raise ConfigError(
            "endpoint must be an https Microsoft Graph /bulkUpload URL for one provisioning job "
            "(graph.microsoft.com, graph.microsoft.us or dod-graph.microsoft.us)"
        )
    return endpoint


# ---------------------------------------------------------------- canonical JSON and hashing

def canonical_json(value: Any) -> str:
    """Sorted keys, no whitespace, UTF-8 characters kept: the form that is hashed."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


# ---------------------------------------------------------------- record model

@dataclass
class Outcome:
    person_key: str
    status: str  # "ready", "quarantined", "superseded"
    reasons: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    operation: dict[str, Any] | None = None
    row: dict[str, str] | None = None
    is_leaver: bool = False
    manager_key: str = ""

    @property
    def payload_sha256(self) -> str:
        return sha256_hex(self.operation) if self.operation is not None else ""


def to_utc_iso(date_text: str, local_time: str, offset: str) -> str:
    """'2026-11-02' + '05:00' + '-05:00' -> '2026-11-02T10:00:00Z'."""
    sign = 1 if offset[0] == "+" else -1
    hours, minutes = int(offset[1:3]), int(offset[4:6])
    tz = dt.timezone(sign * dt.timedelta(hours=hours, minutes=minutes))
    local = dt.datetime.strptime(f"{date_text} {local_time}", "%Y-%m-%d %H:%M").replace(tzinfo=tz)
    return local.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clean(row: dict[str, str]) -> dict[str, str]:
    return {(k or "").strip(): (v or "").strip() for k, v in row.items()}


def build_operation(row: dict[str, str], mapping: dict[str, Any], settings: dict[str, Any], as_of: dt.date) -> Outcome:
    """Validate one extract row and build its SCIM bulk operation. Fail closed."""
    row = _clean(row)
    key = row.get("PersonNumber", "")
    out = Outcome(person_key=key or "(missing)", status="ready", row=row)
    reasons = out.reasons

    for column in mapping["required_columns"]:
        if not row.get(column):
            reasons.append(f"required column {column} is empty")
    if key and not re.match(mapping["person_key_pattern"], key):
        reasons.append("PersonNumber doesn't fit employeeId (letters, digits and hyphens, at most 16 characters)")

    worker_type = row.get("WorkerType", "")
    wt = mapping["worker_types"].get(worker_type)
    if worker_type in mapping["refused_worker_types"]:
        reasons.append(f"worker type {worker_type} refused: {mapping['refused_worker_types'][worker_type]}")
    elif worker_type and wt is None:
        reasons.append(f"unknown worker type {worker_type}")

    status_type = row.get("AssignmentStatusType", "")
    status = mapping["assignment_status_types"].get(status_type)
    if status_type and status is None:
        reasons.append(f"unknown assignment status type {status_type}")

    for column, limit in mapping["max_lengths"].items():
        if len(row.get(column, "")) > limit:
            reasons.append(f"{column} is longer than {limit} characters")

    for column in ("DepartmentCode",):
        if row.get(column) and not re.match(mapping["code_pattern"], row[column]):
            reasons.append(f"{column} '{row[column]}' isn't a code (A-Z, 0-9, hyphen)")
    category = row.get("PositionCategory", "")
    if category and category not in mapping["position_categories"]:
        reasons.append(f"PositionCategory '{category}' isn't in the approved code list")

    offset = row.get("UtcOffset") or settings["default_utc_offset"]
    if not OFFSET_PATTERN.match(offset):
        reasons.append(f"UtcOffset '{offset}' isn't an offset like -05:00")
    for column in ("HireDate", "TerminationDate"):
        value = row.get(column, "")
        if value:
            try:
                if not DATE_PATTERN.match(value):
                    raise ValueError
                dt.date.fromisoformat(value)
            except ValueError:
                reasons.append(f"{column} '{value}' isn't a date (yyyy-mm-dd)")

    manager = row.get("ManagerPersonNumber", "")
    if manager and manager == key:
        reasons.append("worker is recorded as their own manager")
    out.manager_key = manager

    if status is not None and status["active"] is False and not row.get("TerminationDate"):
        reasons.append("inactive assignment with no termination date: the leave date can't be set")

    if reasons:
        out.status = "quarantined"
        return out

    # ---- build the payload: the complete record every time (full and delta alike)
    ext = mapping["scim_extension_namespace"]
    active = bool(status["active"])
    out.is_leaver = not active
    if status["note"] and active:
        out.warnings.append(status["note"])
    if active and settings["prestart_disabled"] and row.get("HireDate") and dt.date.fromisoformat(row["HireDate"]) > as_of:
        # Book 03, Appendix C: the account exists, disabled, before day one. Send it again on the
        # hire date (scheduled re-send) so AD-landed users are enabled at the source of authority.
        active = False
        out.warnings.append("pre-start: sent disabled until the hire date; schedule a re-send on that date")

    data: dict[str, Any] = {
        "schemas": [CORE_SCHEMA, ENTERPRISE_SCHEMA, ext],
        "externalId": key,
        "active": active,
        "name": {"givenName": row["FirstName"], "familyName": row["LastName"]},
        "displayName": row.get("DisplayName") or f"{row['FirstName']} {row['LastName']}",
    }
    if row.get("UserName"):
        data["userName"] = row["UserName"]
    if row.get("JobName"):
        data["title"] = row["JobName"]
    if row.get("WorkCountry"):
        data["addresses"] = [{"type": "work", "country": row["WorkCountry"], "primary": True}]

    enterprise: dict[str, Any] = {"employeeNumber": key, "organization": row["LegalEmployer"]}
    for column, attr in (("DepartmentName", "department"), ("BusinessUnit", "division"), ("CostCenter", "costCenter")):
        if row.get(column):
            enterprise[attr] = row[column]
    if manager:
        # manager.value carries the manager's externalId; the provisioning service resolves it.
        enterprise["manager"] = {"value": manager}
    data[ENTERPRISE_SCHEMA] = enterprise

    extension: dict[str, Any] = {
        "workerType": wt["employeeType"],
        "workerTypeCode": wt["code"],
        "orgCode": row["DepartmentCode"],
    }
    if category:
        extension["positionCategory"] = category
    if row.get("JobCode"):
        extension["JobCode"] = row["JobCode"]
    if row.get("HireDate"):
        extension["HireDate"] = to_utc_iso(row["HireDate"], settings["hire_local_time"], offset)
    if row.get("TerminationDate"):
        extension["TermDate"] = to_utc_iso(row["TerminationDate"], settings["leave_local_time"], offset)
        term = dt.date.fromisoformat(row["TerminationDate"])
        if not active and (as_of - term).days > int(settings["catch_up_days"]):
            out.warnings.append(
                "termination date is more than the Lifecycle Workflows catch-up window in the past: "
                "run the leaver workflow on demand"
            )
    data[ext] = extension

    out.operation = {"method": "POST", "bulkId": key, "path": "/Users", "data": data}
    return out


# ---------------------------------------------------------------- the run

@dataclass
class RunResult:
    outcomes: list[Outcome]
    batches: list[dict[str, Any]]
    held: bool
    hold_reason: str
    disables: int


def _depths(ready: dict[str, Outcome]) -> dict[str, int]:
    """Depth of each worker in the manager chain within this batch (managers first)."""
    depths: dict[str, int] = {}
    for key in ready:
        seen: set[str] = set()
        depth, current = 0, ready[key].manager_key
        while current and current in ready and current not in seen:
            seen.add(current)
            depth += 1
            current = ready[current].manager_key
        depths[key] = depth
    return depths


def convert(rows: list[dict[str, str]], mapping: dict[str, Any], settings: dict[str, Any], as_of: dt.date) -> RunResult:
    outcomes = [build_operation(r, mapping, settings, as_of) for r in rows]

    # Precedence (Book 03, Appendix A): when one person has several rows in a run,
    # a separation wins; otherwise the duplicate is refused rather than guessed.
    by_key: dict[str, list[Outcome]] = {}
    for o in outcomes:
        if o.status == "ready":
            by_key.setdefault(o.person_key, []).append(o)
    for key, group in by_key.items():
        if len(group) < 2:
            continue
        leavers = [o for o in group if o.is_leaver]
        if len(leavers) == 1:
            for o in group:
                if o is not leavers[0]:
                    o.status = "superseded"
                    o.reasons.append("superseded: a separation for the same person is in this run")
        else:
            for o in group:
                o.status = "quarantined"
                o.reasons.append("more than one record for this person and no single separation to prefer")

    ready = {o.person_key: o for o in outcomes if o.status == "ready"}

    # Manager-link integrity (Book 03, Appendix A): an unresolved manager never blocks a joiner;
    # a manager who is separating in this run is a finding.
    for o in ready.values():
        mgr = ready.get(o.manager_key)
        if mgr is not None and mgr.is_leaver and not o.is_leaver:
            o.warnings.append("manager is separating in this run: HR must assign a new supervisor")

    depths = _depths(ready)
    ordered = sorted(ready.values(), key=lambda o: (0 if o.is_leaver else 1, depths[o.person_key], o.person_key))

    size = int(mapping["batch_size"])
    if size < 1 or size > 50:
        raise ConfigError("batch_size must be between 1 and 50")
    batches = []
    for start in range(0, len(ordered), size):
        chunk = ordered[start:start + size]
        batches.append({"schemas": [BULK_SCHEMA], "Operations": [o.operation for o in chunk], "failOnErrors": None})

    disables = sum(1 for o in ordered if o.is_leaver)
    held = disables > int(settings["max_disables_per_run"])
    reason = (
        f"{disables} disables exceed max_disables_per_run ({settings['max_disables_per_run']}): "
        "held for confirmation (Book 03, Appendix B pause switch)"
        if held else ""
    )
    if len(batches) > int(settings["daily_call_budget"]):
        held, reason = True, f"{len(batches)} calls exceed the daily call budget ({settings['daily_call_budget']})"
    return RunResult(outcomes, batches, held, reason, disables)


def report(result: RunResult) -> dict[str, Any]:
    """The operational report: person key and payload hash only, never the payload."""
    counts: dict[str, int] = {}
    for o in result.outcomes:
        counts[o.status] = counts.get(o.status, 0) + 1
    return {
        "counts": counts,
        "batches": len(result.batches),
        "disables": result.disables,
        "held": result.held,
        "hold_reason": result.hold_reason,
        "records": [
            {
                "person_key": o.person_key,
                "status": o.status,
                "leaver": o.is_leaver,
                "payload_sha256": o.payload_sha256,
                "reasons": o.reasons,
                "warnings": o.warnings,
            }
            for o in result.outcomes
        ],
    }


def quarantine_entries(result: RunResult) -> list[dict[str, Any]]:
    """Quarantine contract (Book 03, Appendix A): reason, unchanged HR record, attempted payload.
    Contains personal data: write it only to the access-controlled audit store."""
    return [
        {"person_key": o.person_key, "reasons": o.reasons, "hr_record": o.row, "attempted_payload": o.operation}
        for o in result.outcomes
        if o.status == "quarantined"
    ]


# ---------------------------------------------------------------- apply

Poster = Callable[[str, bytes, dict[str, str]], tuple[int, dict[str, str], bytes]]


def http_post(url: str, body: bytes, headers: dict[str, str]) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:  # noqa: S310 (https enforced)
            return response.status, dict(response.headers), response.read()
    except urllib.error.HTTPError as err:
        return err.code, dict(err.headers or {}), err.read() if err.fp else b""


def retry_after_seconds(headers: dict[str, str], attempt: int) -> float:
    value = {k.lower(): v for k, v in headers.items()}.get("retry-after", "")
    if value.isdigit():
        return float(value)
    return float(min(60, 2 ** attempt))


def apply_batches(
    batches: list[dict[str, Any]],
    endpoint: str,
    token: str,
    settings: dict[str, Any],
    poster: Poster = http_post,
    sleeper: Callable[[float], None] = time.sleep,
) -> list[dict[str, Any]]:
    """POST each batch; pace below the documented limit; honor Retry-After on 429 and 503."""
    validate_endpoint(endpoint)
    results = []
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/scim+json"}
    for index, batch in enumerate(batches, start=1):
        body = canonical_json(batch).encode("utf-8")
        attempt = 0
        while True:
            status, resp_headers, _ = poster(endpoint, body, headers)
            if status in (429, 503) and attempt < int(settings["max_retries"]):
                sleeper(retry_after_seconds(resp_headers, attempt))
                attempt += 1
                continue
            break
        location = {k.lower(): v for k, v in resp_headers.items()}.get("location", "")
        results.append({"batch": index, "status": status, "attempts": attempt + 1,
                        "provisioning_logs": location, "batch_sha256": sha256_hex(batch)})
        if status != 202:
            break  # stop on the first failure; the next run resends complete records
        sleeper(float(settings["min_seconds_between_calls"]))
    return results


# ---------------------------------------------------------------- CLI

def read_rows(path: Path) -> list[dict[str, str]]:
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def main(argv: list[str] | None = None) -> int:
    here = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--extract", required=True, type=Path, help="HCM extract CSV")
    parser.add_argument("--mapping", type=Path, default=here / "config" / "mapping.json")
    parser.add_argument("--settings", type=Path, default=here / "config" / "settings.example.json")
    parser.add_argument("--out", type=Path, default=Path("out"))
    parser.add_argument("--as-of", default=dt.date.today().isoformat(), help="run date, yyyy-mm-dd")
    parser.add_argument("--apply", action="store_true", help=f"POST to /bulkUpload (token from {TOKEN_ENV})")
    parser.add_argument("--confirm-large-delta", action="store_true", help="release a held run")
    args = parser.parse_args(argv)

    try:
        mapping = load_json(args.mapping)
        settings = validate_settings(load_json(args.settings))
        result = convert(read_rows(args.extract), mapping, settings, dt.date.fromisoformat(args.as_of))
    except (ConfigError, OSError, ValueError, KeyError) as err:
        print(f"error: {err}", file=sys.stderr)
        return EXIT_ERROR

    args.out.mkdir(parents=True, exist_ok=True)
    for i, batch in enumerate(result.batches, start=1):
        (args.out / f"bulk-request-{i:03d}.json").write_text(json.dumps(batch, indent=2, ensure_ascii=False), encoding="utf-8")
    summary = report(result)
    (args.out / "validation-report.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    (args.out / "quarantine.json").write_text(json.dumps(quarantine_entries(result), indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({k: summary[k] for k in ("counts", "batches", "disables", "held", "hold_reason")}))

    if result.held and not args.confirm_large_delta:
        return EXIT_HELD
    if args.apply:
        token = os.environ.get(TOKEN_ENV, "")
        if not token:
            print(f"error: --apply needs a bearer token in {TOKEN_ENV}", file=sys.stderr)
            return EXIT_ERROR
        try:
            results = apply_batches(result.batches, settings["endpoint"], token, settings)
        except ConfigError as err:
            print(f"error: {err}", file=sys.stderr)
            return EXIT_ERROR
        (args.out / "apply-results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
        if any(r["status"] != 202 for r in results):
            return EXIT_ERROR
    return EXIT_QUARANTINE if summary["counts"].get("quarantined") else EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
