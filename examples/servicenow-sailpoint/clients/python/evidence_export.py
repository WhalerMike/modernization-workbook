"""Export closed identity findings as Book 13 evidence records, with a manifest and a hash chain.

Reads closed and cancelled u_identity_finding records (from ServiceNow's
Table API, or a saved export) and writes one evidence record per finding in
the shape Book 13, Appendix B gives every lane: origin, owner and clock,
approval, executing identity, what ran, result, closure. Pass 1 doesn't
actuate, so approval, executing identity and what ran are written as null
with the reason, never invented.

For each record it checks what an assessor would:

  * the evidence on the record still hashes to u_evidence_hash (an edit
    after closure, or a value cut short by the field length, fails);
  * a closed record carries evidence at all (a close that bypassed the
    business rule fails);
  * the evidence says the intended state matched;
  * the record closed inside its response window (verified at or before
    the due date), the measure Book 13 calls window adherence.

It writes records.jsonl (each record with the SHA-256 of the one before
it, so a removed or reordered record breaks the chain), summary.json and
manifest.json (a SHA-256 per file and the chain head). Read-only toward
ServiceNow. Illustrative: unit-tested, not proven against a live instance.

Examples (from the kit root):

  # Offline, from the saved export of closed records
  python clients/python/evidence_export.py --records-json tests/fixtures/evidence/closed_records.json --out-dir out/evidence --period 2026-10

  # Check a package an ISSO received: file hashes and the chain
  python clients/python/evidence_export.py --verify-dir out/evidence

  # Live: closed and cancelled findings updated since a date (needs read on the finding table only)
  python clients/python/evidence_export.py --config config/config.example.json --since 2026-10-01 --out-dir out/evidence --period 2026-10
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping

import kit_common as kc

SCHEMA = "book13-evidence-record/identity-finding/v1"
LATER_PASS = "not recorded in Pass 1: the change or catalog record that authorizes and runs the fix is a later pass"
EXPORT_FIELDS = ["sys_id", "number", "state", "u_drift_class", "u_source", "u_severity", "priority",
                 "assignment_group", "assigned_to", "u_detected_at", "opened_at", "due_date", "u_origin",
                 "u_intended_state", "u_evidence", "u_evidence_hash", "u_verified_at", "close_notes", "closed_at"]


def _time(value: str | None) -> datetime | None:
    if not value:
        return None
    text = value.strip().replace("Z", "+00:00")
    for parse in (datetime.fromisoformat, lambda t: datetime.strptime(t, "%Y-%m-%d %H:%M:%S")):
        try:
            parsed = parse(text)
        except ValueError:
            continue
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return None


def _iso(value: datetime | None) -> str | None:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z") if value else None


def _json(text: str | None) -> Any:
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"unparsed": text}


def evidence_record(record: Mapping[str, Any], closed_states: Iterable[str], cancel_states: Iterable[str]) -> dict:
    state = str(record.get("state"))
    problems: list[str] = []
    evidence_text = record.get("u_evidence") or ""
    evidence = _json(evidence_text)
    stored_hash = record.get("u_evidence_hash") or ""
    intact = None
    if evidence_text:
        if isinstance(evidence, dict) and "unparsed" not in evidence:
            intact = kc.sha256_hex(evidence) == stored_hash
            if not intact:
                problems.append("evidence doesn't hash to u_evidence_hash: edited after closure, or cut short")
        else:
            intact = False
            problems.append("u_evidence isn't valid JSON: cut short by the field length, or edited")
    if state in cancel_states:
        lane = "declared exception"
        if not record.get("close_notes"):
            problems.append("cancelled without a close note")
    elif state in closed_states:
        lane = "machine re-read"
        if not evidence_text or not stored_hash:
            problems.append("closed without re-read evidence")
        elif isinstance(evidence, dict) and evidence.get("match") is False:
            problems.append("closed although the evidence says the intended state didn't match")
    else:
        lane = "open"
        problems.append(f"state {state} is neither closed nor cancelled")
    due = _time(record.get("due_date"))
    finished = _time(record.get("u_verified_at")) or _time(record.get("closed_at"))
    within = None if not (due and finished) else finished <= due
    if lane == "machine re-read" and within is False:
        problems.append("closed after its response window")
    return {
        "schema": SCHEMA,
        "record": record.get("number"),
        "origin": {"source": record.get("u_source"), "drift_class": record.get("u_drift_class"),
                   "origin": _json(record.get("u_origin")), "detected_at": _iso(_time(record.get("u_detected_at")))},
        "owner_and_clock": {"assignment_group": record.get("assignment_group") or None,
                            "assigned_to": record.get("assigned_to") or None,
                            "severity": record.get("u_severity"), "priority": record.get("priority"),
                            "due": _iso(due), "finished": _iso(finished), "within_window": within},
        "approval": {"value": None, "reason": LATER_PASS},
        "executing_identity": {"value": None, "reason": LATER_PASS},
        "what_ran": {"value": None, "reason": LATER_PASS},
        "result": {"intended_state": _json(record.get("u_intended_state")), "evidence": evidence,
                   "verified_at": _iso(_time(record.get("u_verified_at"))), "evidence_intact": intact},
        "closure": {"state": state, "lane": lane, "evidence_hash": stored_hash or None,
                    "close_notes": record.get("close_notes") or None},
        "problems": problems,
    }


def chain(records: list[dict], previous_head: str | None = None) -> tuple[list[dict], str | None]:
    """Give each record prev_sha256 and record_sha256; return the records and the chain head."""
    head = previous_head
    out = []
    for record in records:
        linked = dict(record)
        linked["prev_sha256"] = head
        linked["record_sha256"] = kc.sha256_hex({k: v for k, v in linked.items() if k != "record_sha256"})
        head = linked["record_sha256"]
        out.append(linked)
    return out, head


def verify_chain(records: list[dict], previous_head: str | None = None) -> list[str]:
    """Problems with a chain read back from records.jsonl; empty when it holds."""
    problems, head = [], previous_head
    for index, record in enumerate(records, 1):
        if record.get("prev_sha256") != head:
            problems.append(f"line {index} ({record.get('record')}): prev_sha256 doesn't match the line before")
        expected = kc.sha256_hex({k: v for k, v in record.items() if k != "record_sha256"})
        if record.get("record_sha256") != expected:
            problems.append(f"line {index} ({record.get('record')}): record_sha256 doesn't match its content")
        head = record.get("record_sha256")
    return problems


def summarize(records: list[dict], period: str) -> dict:
    machine = [r for r in records if r["closure"]["lane"] == "machine re-read"]
    exceptions = [r for r in records if r["closure"]["lane"] == "declared exception"]
    judged = [r for r in machine if r["owner_and_clock"]["within_window"] is not None]
    inside = [r for r in judged if r["owner_and_clock"]["within_window"]]
    return {
        "period": period,
        "records": len(records),
        "closed_on_reread": len(machine),
        "declared_exceptions": len(exceptions),
        "window_adherence": {"closed_inside_window": len(inside), "closed_judged": len(judged),
                             "ratio": round(len(inside) / len(judged), 3) if judged else None},
        "records_with_problems": sorted(r["record"] for r in records if r["problems"]),
        "not_in_pass1": ["approval", "executing_identity", "what_ran", "SailPoint events"],
    }


def _sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def write_package(records: list[dict], out_dir: str, period: str, previous_head: str | None = None,
                  generated_at: str | None = None) -> dict:
    os.makedirs(out_dir, exist_ok=True)
    linked, head = chain(records, previous_head)
    paths = {"records.jsonl": os.path.join(out_dir, "records.jsonl"),
             "summary.json": os.path.join(out_dir, "summary.json")}
    with open(paths["records.jsonl"], "w", encoding="utf-8", newline="\n") as handle:
        for record in linked:
            handle.write(kc.canonical_json(record) + "\n")
    summary = summarize(records, period)
    with open(paths["summary.json"], "w", encoding="utf-8", newline="\n") as handle:
        json.dump(summary, handle, indent=2, sort_keys=True)
        handle.write("\n")
    manifest = {"schema": SCHEMA, "period": period, "generated_at": generated_at or kc.utc_now(),
                "generator": f"evidence_export.py/{kc.KIT_VERSION}", "chain_previous": previous_head,
                "chain_head": head, "files": {name: _sha256_file(p) for name, p in sorted(paths.items())}}
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8", newline="\n") as handle:
        json.dump(manifest, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return {"summary": summary, "manifest": manifest}


def verify_package(folder: str) -> list[str]:
    """Problems with a package written by write_package; empty when it holds."""
    with open(os.path.join(folder, "manifest.json"), encoding="utf-8") as handle:
        manifest = json.load(handle)
    problems = []
    for name, digest in sorted(manifest["files"].items()):
        path = os.path.join(folder, name)
        if not os.path.exists(path):
            problems.append(f"{name}: missing")
        elif _sha256_file(path) != digest:
            problems.append(f"{name}: SHA-256 doesn't match the manifest")
    with open(os.path.join(folder, "records.jsonl"), encoding="utf-8") as handle:
        records = [json.loads(line) for line in handle if line.strip()]
    problems += verify_chain(records, manifest.get("chain_previous"))
    if records and records[-1].get("record_sha256") != manifest.get("chain_head"):
        problems.append("the last record isn't the manifest's chain head")
    return problems


def main(argv: list[str] | None = None, http: kc.Http | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--records-json", help="Saved closed records (Table API shape) instead of ServiceNow")
    parser.add_argument("--config", help="JSON config file (no secrets), for a live read")
    parser.add_argument("--since", help="Live: closed or cancelled records updated on or after this date (YYYY-MM-DD)")
    parser.add_argument("--table", help="ServiceNow table (default SN_FINDING_TABLE)")
    parser.add_argument("--cancel-state", default="7", help="Cancelled state value (default 7, as the business rule)")
    parser.add_argument("--period", help="Label for the evidence period, for example 2026-10")
    parser.add_argument("--previous-manifest", help="Last period's manifest.json: continue its hash chain")
    parser.add_argument("--out-dir", help="Folder for records.jsonl, summary.json, manifest.json")
    parser.add_argument("--verify-dir", help="Check a written package: file hashes against the manifest, and the chain")
    parser.add_argument("--generated-at", help="Fix the manifest's timestamp (for reproducible runs)")
    args = parser.parse_args(argv)
    if args.verify_dir:
        problems = verify_package(args.verify_dir)
        for problem in problems:
            print(f"  {problem}", file=out)
        print("Package holds: every file matches the manifest and the chain is unbroken." if not problems
              else f"Package does not hold: {len(problems)} problem(s).", file=out)
        return 1 if problems else 0
    if not args.period or not args.out_dir:
        parser.error("--period and --out-dir are required (or pass --verify-dir)")
    cfg = kc.load_config(args.config)
    closed_states = {cfg["SN_STATE_CLOSED"]}
    cancel_states = {args.cancel_state}

    if args.records_json:
        with open(args.records_json, encoding="utf-8") as handle:
            data = json.load(handle)
        raw = data.get("result", data) if isinstance(data, dict) else data
    else:
        if not args.since:
            parser.error("a live read needs --since (or pass --records-json)")
        http = http or kc.Http()
        query = (f"state={cfg['SN_STATE_CLOSED']}^ORstate={args.cancel_state}"
                 f"^sys_updated_on>={args.since} 00:00:00^ORDERBYnumber")
        raw = list(kc.sn_table_all(http, kc.sn_base_url(cfg), args.table or cfg["SN_FINDING_TABLE"],
                                   kc.sn_headers(cfg, http), query, EXPORT_FIELDS))
    previous_head = None
    if args.previous_manifest:
        with open(args.previous_manifest, encoding="utf-8") as handle:
            previous_head = json.load(handle).get("chain_head")
    records = [evidence_record(r, closed_states, cancel_states)
               for r in sorted(raw, key=lambda r: str(r.get("number")))]
    result = write_package(records, args.out_dir, args.period, previous_head, args.generated_at)
    s = result["summary"]
    wa = s["window_adherence"]
    print(f"{s['records']} evidence records: {s['closed_on_reread']} closed on a re-read, "
          f"{s['declared_exceptions']} declared exception", file=out)
    print(f"Window adherence: {wa['closed_inside_window']} of {wa['closed_judged']} closed inside the window", file=out)
    for record in records:
        for problem in record["problems"]:
            print(f"  {record['record']}: {problem}", file=out)
    print(f"Chain head {result['manifest']['chain_head']}; written to {args.out_dir}", file=out)
    return 1 if s["records_with_problems"] else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
