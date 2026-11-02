"""Smoke test the deployed front door with a synthetic worker, and check each finding it follows.

Three phases, each a separate run because each runs as a different
integration identity:

  raise   as the finding writer: post one synthetic finding to the Scripted
          REST resource, then the same finding again. Expect 201 (created,
          priority 4) and then 200 (de-duplicated, the same sys_id,
          occurrences 2). Posts only with --apply; otherwise prints the
          payload, checks it against the data contract, and posts nothing.
  signal  as the finding writer: post a closure signal for the synthetic
          worker. Expect 200 and the synthetic findings moved to Awaiting
          verification (a signal is never closure). Posts only with --apply.
  check   as the evidence reader: read one synthetic finding by its
          de-duplication key and compare it with --expect (open, awaiting
          or closed; closed needs the re-read evidence hash). Read-only.

The findings it follows (--finding): direct (raised by this script),
native (raised by the native-change workflow for the synthetic account) and
mover (raised by the identity-attributes-changed workflow). Each run prints
PASS or FAIL per expectation and exits 1 on a FAIL.

Examples (from the kit root):

  python deploy/smoke_test.py raise --settings tests/fixtures/deploy/environment.test.json
  python deploy/smoke_test.py raise --settings tests/fixtures/deploy/environment.test.json --apply --fixtures tests/fixtures/deploy/smoke.json
  python deploy/smoke_test.py check --settings tests/fixtures/deploy/environment.test.json --finding direct --expect open --fixtures tests/fixtures/deploy/smoke.json
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Mapping

import deploy_common as dc
from deploy_common import kc

sys.path.insert(0, str(dc.KIT / "clients" / "python"))
import finding_contract as fc  # noqa: E402

CHECK_FIELDS = ["sys_id", "number", "state", "priority", "u_severity", "u_source", "u_drift_class", "u_dedupe_key",
                "u_occurrences", "u_intended_state", "u_evidence_hash", "u_verified_at", "sys_created_on"]


def direct_payload(settings: dc.Settings, run_id: str) -> dict:
    syn = settings.synthetic
    attribute, baseline = syn.get("attribute"), syn.get("baseline")
    return {
        "kind": "finding",
        "source": "drift-reconciliation",
        "drift_class": "attribute_drift",
        "severity": "P4",
        "system": "entra_user",
        "subject_id": syn.get("entra_user_id"),
        "identity_id": syn.get("identity_id"),
        "attribute": attribute,
        "expected_value": baseline,
        "observed_value": syn.get("changed"),
        "intended_state": {"attributes": {attribute: baseline}},
        "origin": {"checker": f"deploy/smoke_test.py/{kc.KIT_VERSION}", "run": run_id, "purpose": "deployment smoke test",
                   "environment": settings.environment, "change_record": settings.deploy.get("change_record")},
    }


def signal_payload(settings: dc.Settings, run_id: str) -> dict:
    # No source on the request: the script then moves every active finding for the recipient.
    return {"kind": "closure_signal", "source": "drift-reconciliation", "recipient_id": settings.synthetic.get("identity_id"),
            "tracking_number": run_id, "account_requests": [{"provisioningResult": "SUCCESS"}], "errors": [],
            "origin": {"checker": f"deploy/smoke_test.py/{kc.KIT_VERSION}", "run": run_id}}


class Results:
    def __init__(self, out):
        self.out = out
        self.rows: list[dict] = []

    def expect(self, ok: bool, what: str, detail: str) -> None:
        self.rows.append({"ok": ok, "expectation": what, "detail": detail})
        print(f"  {'PASS' if ok else 'FAIL'}  {what:<34} {detail}", file=self.out)

    @property
    def failed(self) -> bool:
        return any(not r["ok"] for r in self.rows)


def run_raise(settings: dc.Settings, http: kc.Http | None, env: Mapping[str, str], apply: bool, run_id: str,
              res: Results) -> dict:
    payload = direct_payload(settings, run_id)
    check = fc.validate(payload)
    res.expect(check["ok"] and not check["warnings"], "payload meets the data contract",
               "; ".join(check["errors"] + check["warnings"]) or f"key {fc.dedupe_key(payload)}")
    if not apply or http is None:
        print(f"  dry run: would POST {settings.cfg['SN_FINDING_API_PATH']} twice as the finding writer", file=res.out)
        print("  payload: " + kc.canonical_json(payload), file=res.out)
        return {"payload": payload, "posted": False}
    url = kc.sn_base_url(settings.cfg) + settings.cfg["SN_FINDING_API_PATH"]
    headers = kc.sn_headers(settings.cfg, http, env)
    first = http.request("POST", url, headers=headers, json=payload)
    body1 = (first.json() or {}).get("result", first.json() or {})
    res.expect(first.status_code == 201 and body1.get("priority") == "4", "first post creates (201, priority 4)",
               f"HTTP {first.status_code}, {body1.get('number')}, priority {body1.get('priority')}")
    second = http.request("POST", url, headers=headers, json=payload)
    body2 = (second.json() or {}).get("result", second.json() or {})
    res.expect(second.status_code == 200 and body2.get("deduplicated") is True and body2.get("sys_id") == body1.get("sys_id"),
               "repeat de-duplicates (200, same)", f"HTTP {second.status_code}, deduplicated "
               f"{body2.get('deduplicated')}, occurrences {body2.get('occurrences')}")
    return {"payload": payload, "posted": True, "first": {"status": first.status_code, "body": body1},
            "second": {"status": second.status_code, "body": body2}}


def run_signal(settings: dc.Settings, http: kc.Http | None, env: Mapping[str, str], apply: bool, run_id: str,
               expect_moved: int | None, res: Results) -> dict:
    payload = signal_payload(settings, run_id)
    if not apply or http is None:
        print(f"  dry run: would POST {settings.cfg['SN_FINDING_API_PATH']} once as the finding writer", file=res.out)
        print("  payload: " + kc.canonical_json(payload), file=res.out)
        return {"payload": payload, "posted": False}
    url = kc.sn_base_url(settings.cfg) + settings.cfg["SN_FINDING_API_PATH"]
    response = http.request("POST", url, headers=kc.sn_headers(settings.cfg, http, env), json=payload)
    body = (response.json() or {}).get("result", response.json() or {})
    moved = body.get("moved_to_awaiting_verification") or []
    ok = response.status_code == 200 and (expect_moved is None or len(moved) == expect_moved)
    res.expect(ok, "signal moves findings to awaiting", f"HTTP {response.status_code}, moved {len(moved)}"
               + ("" if expect_moved is None else f" (expected {expect_moved})"))
    return {"payload": payload, "posted": True, "status": response.status_code, "body": body}


def run_check(settings: dc.Settings, http: kc.Http | None, env: Mapping[str, str], which: str, expect: str,
              occurrences: int | None, res: Results) -> dict:
    key = dc.smoke_key(settings, which)
    cfg = settings.cfg
    if http is None:
        print(f"  dry run: would GET /api/now/table/{cfg['SN_FINDING_TABLE']}?sysparm_query=u_dedupe_key={key}"
              " as the evidence reader", file=res.out)
        return {"key": key, "read": False}
    rows = list(kc.sn_table_all(http, kc.sn_base_url(cfg), cfg["SN_FINDING_TABLE"], kc.sn_headers(cfg, http, env),
                                f"u_dedupe_key={key}^ORDERBYDESCsys_created_on", CHECK_FIELDS))
    res.expect(len(rows) >= 1, f"finding {which} exists", f"{len(rows)} record(s) with key {key}")
    if not rows:
        return {"key": key, "read": True, "records": []}
    record = rows[0]
    state = str(record.get("state"))
    states = {"awaiting": cfg["SN_STATE_AWAITING_VERIFICATION"], "closed": cfg["SN_STATE_CLOSED"]}
    if expect == "open":
        ok = state not in states.values()
    else:
        ok = state == states[expect]
    res.expect(ok, f"state is {expect}", f"{record.get('number')} state {state}")
    if expect == "closed":
        res.expect(bool(record.get("u_evidence_hash")) and bool(record.get("u_verified_at")),
                   "closed with re-read evidence", f"evidence hash {str(record.get('u_evidence_hash'))[:12]}..., "
                   f"verified {record.get('u_verified_at')}")
    if occurrences is not None:
        res.expect(str(record.get("u_occurrences")) == str(occurrences), f"occurrences {occurrences}",
                   f"u_occurrences {record.get('u_occurrences')}")
    return {"key": key, "read": True, "records": rows}


def main(argv: list[str] | None = None, http: kc.Http | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("phase", choices=("raise", "signal", "check"))
    parser.add_argument("--settings", required=True, help="The environment settings file (no secrets)")
    parser.add_argument("--apply", action="store_true", help="raise, signal: actually POST (default: dry run)")
    parser.add_argument("--finding", choices=sorted(dc.SMOKE_FINDINGS), default="direct", help="check: which finding")
    parser.add_argument("--expect", choices=("open", "awaiting", "closed"), default="open", help="check: its state")
    parser.add_argument("--occurrences", type=int, help="check: the de-duplication counter it should show")
    parser.add_argument("--expect-moved", type=int, help="signal: how many findings it should move")
    parser.add_argument("--run-id", default="smoke", help="A label kept in the finding's origin (default smoke)")
    parser.add_argument("--dry-run", action="store_true", help="No network")
    parser.add_argument("--fixtures", help="Answer the calls from this file (tests and the runbook's output)")
    parser.add_argument("--out-json", help="Write the results here, for the evidence folder")
    args = parser.parse_args(argv)
    env, http, mode = dc.mode_setup(args, http)
    settings = dc.load_settings(args.settings, env)
    left = settings.placeholders()
    if left:
        print("error: placeholders left in the settings file: " + ", ".join(left), file=sys.stderr)
        return 2
    if args.phase in ("raise", "signal") and not args.apply:
        mode = "dry run (no --apply)"
    print(f"Smoke test {args.phase}: {settings.environment}, {mode}", file=out)
    res = Results(out)
    role = "evidence_reader" if args.phase == "check" else "finding_writer"
    wrong = dc.role_mismatch(settings, env, role, None)
    if wrong:
        res.expect(False, f"running as the {role}", "; ".join(wrong))
        print("Result: FAIL", file=out)
        return 1
    if args.phase == "raise":
        detail = run_raise(settings, http, env, args.apply, args.run_id, res)
    elif args.phase == "signal":
        detail = run_signal(settings, http, env, args.apply, args.run_id, args.expect_moved, res)
    else:
        detail = run_check(settings, http, env, args.finding, args.expect, args.occurrences, res)
    print("Result: " + ("FAIL" if res.failed else "PASS"), file=out)
    dc.write_json(args.out_json, {"checker": f"deploy/smoke_test.py/{kc.KIT_VERSION}", "phase": args.phase, "mode": mode,
                                  "environment": settings.environment, "results": res.rows, "detail": detail})
    return 1 if res.failed else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
