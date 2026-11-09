"""Check a Ticket-to-Machine task catalog exported as CSV, and turn each row into a sample ticket contract.

It applies the seven rules of the workbook's Checks sheet to every row, checks
every drop-down value against the lists the workbook uses, and warns when a
response window or a KSI doesn't match. For each row with a drift class, it
builds a sample typed-finding payload and checks it with the integration kit's
finding_contract.validate, the same check `finding_contract.py --validate`
runs, so a catalog row becomes the contract its tickets will follow. The
payloads carry SAMPLE identifiers: replace them before any real use.

Save the Tasks sheet as "CSV UTF-8" first. Standard library only; nothing
here calls a network. Exit code 0 when every row passes, 1 when any row needs
a fix, 2 when the file can't be read as a catalog.

Examples (from the kit root):

  python check_catalog.py examples.csv
  python check_catalog.py examples.csv --payloads payloads
  python ../servicenow-sailpoint/clients/python/finding_contract.py --validate payloads/payloads.json
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

import catalog_schema as cs

fc = cs.fc
SOURCE = "task-catalog"

# A sample intended state per drift class, in the keys the re-read client can check.
# Classes Book 13 sends to a person first get an empty one: the person sets it. An orphan account
# keeps its sample: the owner decides first, and the gated fix then disables the account.
SAMPLE_INTENDED = {
    "stale_access": {"entitlements_absent": [{"attribute": "memberOf", "value": "SAMPLE-ENTITLEMENT"}]},
    "orphan_account": {"disabled": True},
    "attribute_drift": {"attributes": {"SAMPLE_ATTRIBUTE": "SAMPLE_VALUE"}},
    "credential_drift": {"attributes": {"SAMPLE_CREDENTIAL_STATE": "SAMPLE_VALUE"}},
    "schema_drift": {"attributes": {"SAMPLE_ATTRIBUTE": "SAMPLE_FORMAT"}},
}


def read_catalog(path: Path) -> list[dict]:
    """Rows as dicts keyed by header. Raises ValueError when a column is missing."""
    with open(path, encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [h for h in cs.HEADERS if h not in (reader.fieldnames or [])]
        if missing:
            raise ValueError("missing columns: " + ", ".join(missing))
        return [row for row in reader if any((v or "").strip() for v in row.values())]


def payload_for(row: dict) -> dict | None:
    """The sample typed-finding payload for a row, or None when the row has no drift class."""
    get = lambda name: (row.get(name) or "").strip()  # noqa: E731
    drift = get("Drift class")
    if drift in ("", cs.NO_DRIFT):
        return None
    task_id = get("Task ID")
    payload = {
        "kind": "finding",
        "source": SOURCE,
        "drift_class": drift,
        "severity": get("Severity"),
        "subject_id": f"SAMPLE-{task_id}",
        "origin": {"finding_id": f"SAMPLE-{task_id}", "catalog_task": task_id, "task_name": get("Task name"),
                   "lane": get("Lane"), "trigger": get("Trigger"), "origin": get("C1 Origin (who asks)")},
        "intended_state": SAMPLE_INTENDED.get(drift, {}),
        "evidence": {"approver_role": get("C2 Approver role (who approves)"),
                     "action": get("C3 Action (what runs)"),
                     "executing_identity": get("C3 Executing identity (as which identity)"),
                     "reread_check": get("C4 Re-read check (how closure is proven)"),
                     "evidence_kept": get("C5 Evidence kept")},
    }
    if get("Re-read system") in fc.SYSTEMS:
        payload["system"] = get("Re-read system")
    return payload


def check(rows: list[dict]) -> list[dict]:
    """One result per row: flags, errors, warnings and the payload with its validation."""
    titles = {key: title for key, title, _ in cs.CHECKS}
    seen: dict[str, int] = {}
    results = []
    for row in rows:
        get = lambda name: (row.get(name) or "").strip()  # noqa: E731
        task_id = get("Task ID") or "(no Task ID)"
        seen[task_id] = seen.get(task_id, 0) + 1
        errors, warnings = [], []
        for name, values in cs.ENUMS.items():
            if get(name) and get(name) not in values:
                errors.append(f"{name} '{get(name)}' isn't on the list")
        flags = [titles[key] for key, flagged in cs.check_row(row).items() if flagged]
        window = cs.window_text(get("Severity"))
        if get("Response window") and window and get("Response window") != window:
            warnings.append(f"Response window '{get('Response window')}' should be '{window}' for {get('Severity')}")
        controls = cs.split_list(get("NIST SP 800-53 controls"))
        unknown = [k for k in cs.split_list(get("KSIs")) if k not in cs.KNOWN_KSIS]
        if unknown:
            warnings.append("KSIs not on the Controls sheet: " + ", ".join(unknown))
        expected = cs.ksis_for([c for c in controls if c in cs.CONTROL_KSIS])
        listed = set(cs.split_list(get("KSIs")))
        if expected and not listed & set(expected):
            warnings.append("none of the KSIs listed is cited by the controls listed; see the Controls sheet")
        payload = payload_for(row)
        validation = fc.validate(payload) if payload else None
        if validation and not validation["ok"]:
            errors.append("sample payload rejected: " + "; ".join(validation["errors"]))
        results.append({"task_id": task_id, "flags": flags, "errors": errors, "warnings": warnings,
                        "payload": payload, "validation": validation})
    for result in results:
        if seen[result["task_id"]] > 1:
            result["errors"].append("Task ID is used more than once")
    return results


def report(results: list[dict], out) -> int:
    failed = 0
    payloads = accepted = 0
    for r in results:
        bad = r["flags"] + r["errors"]
        failed += 1 if bad else 0
        line = f"{r['task_id']}: {'FIX' if bad else 'PASS'}"
        if bad:
            line += " - " + "; ".join(bad)
        print(line, file=out)
        if r["payload"] is None:
            print("    no typed finding (drift class none: a request or a routine event)", file=out)
        else:
            payloads += 1
            v = r["validation"]
            if v["ok"]:
                accepted += 1
                n = v["normalized"]
                print(f"    payload ok: {r['payload']['drift_class']} {n['severity']} priority {n['priority']} "
                      f"window {cs.window_text(n['severity'])} system {n['system'] or '-'}", file=out)
                for warning in v["warnings"]:
                    print(f"    contract warning: {warning}", file=out)
        for warning in r["warnings"]:
            print(f"    warning: {warning}", file=out)
    print(f"{len(results)} rows: {len(results) - failed} PASS, {failed} FIX; "
          f"{payloads} sample payloads, {accepted} accepted by finding_contract", file=out)
    return 1 if failed else 0


def write_payloads(results: list[dict], folder: Path) -> list[Path]:
    """One <Task ID>.json per row with a payload, and payloads.json with them all."""
    folder.mkdir(parents=True, exist_ok=True)
    written, every = [], []
    for r in results:
        if r["payload"] is None:
            continue
        every.append(r["payload"])
        safe = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in r["task_id"])
        path = folder / f"{safe}.json"
        path.write_text(json.dumps(r["payload"], indent=2) + "\n", encoding="utf-8")
        written.append(path)
    path = folder / "payloads.json"
    path.write_text(json.dumps(every, indent=2) + "\n", encoding="utf-8")
    return written + [path]


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("catalog", type=Path, help="the catalog saved as CSV UTF-8")
    parser.add_argument("--payloads", type=Path, metavar="FOLDER",
                        help="write each row's sample payload, and payloads.json, to this folder")
    args = parser.parse_args(argv)
    try:
        rows = read_catalog(args.catalog)
    except (OSError, ValueError, csv.Error) as exc:
        print(f"{args.catalog}: {exc}", file=out)
        return 2
    results = check(rows)
    code = report(results, out)
    if args.payloads:
        paths = write_payloads(results, args.payloads)
        print(f"wrote {len(paths) - 1} payload files and {paths[-1]}", file=out)
    return code


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
