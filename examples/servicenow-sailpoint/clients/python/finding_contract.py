"""Check identity-finding payloads against the data contract before they are posted.

The Scripted REST resource (servicenow/scripted-rest-identity-finding.js)
answers 400 to a payload it can't accept. This module applies the same
rules on a laptop, so a client, a workflow export or a test can see the
problem before anything reaches ServiceNow:

  * the drift class, severity, system and subject rules the script applies;
  * the severity default per class (Book 03 High -> P2, Medium -> P3,
    design guidance) and the due date per the program's tempo (Book 13:
    P1 immediate, P2 1 hour, P3 24 hours, P4 72 hours; program design,
    not a federal requirement);
  * the de-duplication key (source, subject, drift class, attribute);
  * a warning when the intended state gives a re-read nothing to check.

The constants mirror the JavaScript; a test reads the script and fails if
they drift apart. Illustrative: unit-tested, not proven against a live
instance. Nothing here calls a network.

Examples (from the kit root):

  # Check one payload, or a JSON list of payloads
  python clients/python/finding_contract.py --validate tests/fixtures/payloads/valid_finding.json

  # Turn a drift run into the payloads the client would post, and check each
  python clients/python/finding_contract.py --from-drift identity-drift.json --now 2026-11-01T12:00:00Z
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Mapping

# Mirrors scripted-rest-identity-finding.js (a test keeps them equal).
DRIFT_CLASSES = ["missing_identity", "stale_access", "orphan_account", "attribute_drift",
                 "unauthorized_write", "credential_drift", "schema_drift"]
DEFAULT_SEVERITY = {
    "missing_identity": "P2", "stale_access": "P2", "orphan_account": "P2", "unauthorized_write": "P2",
    "credential_drift": "P2", "attribute_drift": "P3", "schema_drift": "P3",
}
PRIORITY = {"P1": "1", "P2": "2", "P3": "3", "P4": "4"}
WINDOW_SECONDS = {"P1": 0, "P2": 3600, "P3": 86400, "P4": 259200}
SYSTEMS = ["isc_account", "isc_identity", "entra_user"]
KINDS = ["finding", "closure_signal"]
# Keys of an intended state the re-read client knows how to check
# (reread_verification.compare).
# Classes Book 13, Appendix B routes to a human decision first (identity and
# provenance drift): an empty intended state is expected until a person decides.
HUMAN_DECISION_CLASSES = {"missing_identity", "unauthorized_write"}
CHECKABLE_KEYS = ("exists", "disabled", "accountEnabled", "locked", "attributes",
                  "entitlements_absent", "entitlements_present")


def subject_of(payload: Mapping[str, Any]) -> str:
    """The subject the script de-duplicates on: the first identifier present."""
    for key in ("subject_id", "account_id", "identity_id", "employee_id"):
        if payload.get(key):
            return str(payload[key])
    return ""


def system_of(payload: Mapping[str, Any]) -> str:
    """The script's default: an account ID means isc_account, an identity ID isc_identity."""
    if payload.get("system"):
        return str(payload["system"])
    if payload.get("account_id"):
        return "isc_account"
    if payload.get("identity_id"):
        return "isc_identity"
    return ""


def severity_of(payload: Mapping[str, Any]) -> str:
    return str(payload.get("severity") or DEFAULT_SEVERITY.get(str(payload.get("drift_class")), ""))


def dedupe_key(payload: Mapping[str, Any]) -> str:
    """source|subject|class, plus |attribute when the payload names one (as the script does)."""
    key = "|".join([str(payload.get("source", "")), subject_of(payload), str(payload.get("drift_class", ""))])
    return key + ("|" + str(payload["attribute"]) if payload.get("attribute") else "")


def due_at(severity: str, now: datetime) -> datetime:
    return now + timedelta(seconds=WINDOW_SECONDS[severity])


def is_checkable(intended: Any) -> bool:
    """True when an intended state names at least one thing a re-read can compare.

    An intended state like {"attributes": {}, "entitlements_absent": []} is a
    dict, so it looks present, but a re-read finds no differences against it
    and would close the record on nothing.
    """
    if not isinstance(intended, Mapping):
        return False
    for key in CHECKABLE_KEYS:
        if key not in intended:
            continue
        value = intended[key]
        if key in ("attributes", "entitlements_absent", "entitlements_present"):
            if value:
                return True
        elif value is not None:
            return True
    return False


def validate(payload: Any) -> dict:
    """Return {"ok", "errors", "warnings", "normalized"} for one payload.

    errors are what the Scripted REST script would answer 400 to; warnings
    are what it would accept but the loop can't use.
    """
    errors: list[str] = []
    warnings: list[str] = []
    if not isinstance(payload, Mapping):
        return {"ok": False, "errors": ["Expected a JSON object"], "warnings": [], "normalized": None}
    kind = payload.get("kind") or "finding"
    if kind not in KINDS:
        return {"ok": False, "errors": ["kind must be finding or closure_signal"], "warnings": [],
                "normalized": None}
    if kind == "closure_signal":
        if not payload.get("recipient_id") or not isinstance(payload.get("account_requests"), list):
            errors.append("closure_signal needs recipient_id and account_requests")
        return {"ok": not errors, "errors": errors, "warnings": warnings,
                "normalized": {"kind": kind} if not errors else None}
    severity = severity_of(payload)
    system = system_of(payload)
    if not payload.get("source"):
        errors.append("source is required")
    if payload.get("drift_class") not in DRIFT_CLASSES:
        errors.append("drift_class must be one of " + ", ".join(DRIFT_CLASSES))
    if severity not in PRIORITY:
        errors.append("severity must be P1, P2, P3 or P4")
    if not subject_of(payload):
        errors.append("one of account_id, identity_id, subject_id or employee_id is required")
    if system and system not in SYSTEMS:
        errors.append("system must be one of " + ", ".join(SYSTEMS))
    if not payload.get("origin"):
        errors.append("origin is required (the trigger id and event, or the drift finding id)")
    intended = payload.get("intended_state")
    derivable = payload.get("single_value_changes") is not None or isinstance(payload.get("changes"), list)
    if not errors:
        if not system:
            warnings.append("no system: the re-read client won't know where to read the subject")
        if intended is None and not derivable:
            warnings.append("no intended_state and nothing to derive one from: a re-read can't close this finding")
        elif intended is not None and not is_checkable(intended):
            note = "intended_state names nothing a re-read can check"
            if payload.get("drift_class") in HUMAN_DECISION_CLASSES:
                note += " (expected: Book 13 routes this class to a person, who sets it)"
            warnings.append(note)
    normalized = None
    if not errors:
        normalized = {"kind": kind, "severity": severity, "priority": PRIORITY[severity], "system": system,
                      "subject_id": subject_of(payload), "dedupe_key": dedupe_key(payload),
                      "window_seconds": WINDOW_SECONDS[severity]}
    return {"ok": not errors, "errors": errors, "warnings": warnings, "normalized": normalized}


def validate_all(payloads: Iterable[Any]) -> list[dict]:
    return [validate(p) for p in payloads]


def _parse_now(text: str | None) -> datetime:
    if not text:
        return datetime.now(timezone.utc)
    parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--validate", metavar="PAYLOAD_JSON", help="A payload, or a JSON list of payloads")
    group.add_argument("--from-drift", metavar="DRIFT_JSON",
                       help="identity_drift.py output: build each finding's payload and check it")
    parser.add_argument("--now", help="UTC time to compute due dates from (default: now)")
    args = parser.parse_args(argv)
    now = _parse_now(args.now)

    if args.validate:
        with open(args.validate, encoding="utf-8") as handle:
            data = json.load(handle)
        payloads = data if isinstance(data, list) else [data]
        labels = [p.get("origin", {}).get("finding_id") if isinstance(p, dict) and isinstance(p.get("origin"), dict)
                  else None for p in payloads]
    else:
        import identity_drift  # local import: only this mode needs the drift client
        with open(args.from_drift, encoding="utf-8") as handle:
            run = json.load(handle)
        payloads = [identity_drift.to_servicenow_payload(f) for f in run.get("findings", [])]
        labels = [f["finding_id"] for f in run.get("findings", [])]

    failed = 0
    keys: dict[str, int] = {}
    for index, (payload, result) in enumerate(zip(payloads, validate_all(payloads))):
        label = labels[index] or f"#{index + 1}"
        if result["ok"]:
            n = result["normalized"]
            if n["kind"] == "closure_signal":
                print(f"{label}: ok closure_signal (moves matches to Awaiting verification; never closes)", file=out)
            else:
                keys[n["dedupe_key"]] = keys.get(n["dedupe_key"], 0) + 1
                due = _iso(due_at(n["severity"], now))
                print(f"{label}: ok {payload.get('drift_class')} {n['severity']} priority {n['priority']} "
                      f"due {due} system {n['system'] or '-'}", file=out)
        else:
            failed += 1
            print(f"{label}: 400 {result['errors'][0]}", file=out)
        for warning in result["warnings"]:
            print(f"{label}: warning: {warning}", file=out)
    repeats = sum(count - 1 for count in keys.values() if count > 1)
    print(f"{len(payloads) - failed} accepted, {failed} rejected, {repeats} would de-duplicate", file=out)
    return 1 if failed else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
