"""Roll back a stage: print the exact rollback commands for this environment, then verify they took.

Rollback here is the example guide's: stop intake and keep the records. The
three ISC workflows are disabled (G4), the scheduled runs are stopped (G7),
and every finding and its evidence stays in ServiceNow. Removing the
ServiceNow application is not part of it, because ServiceNow's rollback of
an application install removes its tables and their data (design guidance;
see the runbook chapter).

  --plan     print the rollback commands with this environment's workflow IDs
             (read with GET /v2025/workflows), ready to paste. Read-only.
  --verify   check that all three workflows are disabled and that no finding
             from SailPoint was created in ServiceNow after --since. Read-only;
             exits 1 if either check fails.

This script never writes: the commands it prints are run by the person
holding the ISC workflow administrator's API client, as the runbook says.
Credentials: the ISC deploy checker's API client, and for --verify the
ServiceNow evidence reader's OAuth client.

Examples (from the kit root):

  python deploy/rollback.py --settings tests/fixtures/deploy/environment.test.json --plan --dry-run
  python deploy/rollback.py --settings tests/fixtures/deploy/environment.test.json --verify --since "2026-11-02 15:00:00" --fixtures tests/fixtures/deploy/rollback.json
"""

from __future__ import annotations

import argparse
import sys
from typing import Mapping

import deploy_common as dc
from deploy_common import kc


def list_kit_workflows(settings: dc.Settings, http: kc.Http, env: Mapping[str, str]) -> list[dict]:
    listed = http.json("GET", f"{kc.isc_base_url(settings.cfg)}/v2025/workflows",
                       headers=kc.isc_headers(settings.cfg, http, env)) or []
    by_name = {w.get("name"): w for w in listed}
    out = []
    for workflow in dc.load_workflows():
        found = by_name.get(workflow["name"])
        out.append({"name": workflow["name"], "id": found.get("id") if found else None,
                    "enabled": bool(found.get("enabled")) if found else None})
    return out


def print_plan(settings: dc.Settings, workflows: list[dict], out) -> None:
    base = kc.isc_base_url(settings.cfg)
    print(f"Rollback plan: {settings.environment} ({settings.path})", file=out)
    print("# 1. Disable the three workflows (G4), as the ISC workflow administrator:", file=out)
    for workflow in workflows:
        wid = workflow["id"] or "<workflow-id>"
        state = "absent" if workflow["enabled"] is None else "enabled" if workflow["enabled"] else "disabled"
        print(f"#    {workflow['name']} (now {state})", file=out)
        print(f"curl -s -X PATCH \"{base}/v2025/workflows/{wid}\" -H \"Authorization: Bearer $SAILPOINT_ACCESS_TOKEN\" "
              "-H \"Content-Type: application/json-patch+json\" "
              "--data '[{\"op\": \"replace\", \"path\": \"/enabled\", \"value\": false}]'", file=out)
    print("# 2. Stop the scheduled drift and re-read runs (G7) in your job runner.", file=out)
    print("# 3. Verify, as the deploy checker and the evidence reader:", file=out)
    print(f"python deploy/rollback.py --settings {settings.path} --verify --since \"<rollback-start-utc>\"", file=out)


def verify(settings: dc.Settings, workflows: list[dict], http: kc.Http, env: Mapping[str, str], since: str, out) -> dict:
    rows = []

    def expect(ok: bool, what: str, detail: str) -> None:
        rows.append({"ok": ok, "expectation": what, "detail": detail})
        print(f"  {'PASS' if ok else 'FAIL'}  {what:<32} {detail}", file=out)

    enabled = [w["name"] for w in workflows if w["enabled"]]
    present = [w for w in workflows if w["enabled"] is not None]
    expect(not enabled, "G4 workflows disabled", f"{len(present)} found, {len(enabled)} enabled"
           + (": " + "; ".join(enabled) if enabled else ""))
    cfg = settings.cfg
    query = f"u_source=sailpoint-isc^sys_created_on>{since}^ORDERBYsys_created_on"
    created = list(kc.sn_table_all(http, kc.sn_base_url(cfg), cfg["SN_FINDING_TABLE"], kc.sn_headers(cfg, http, env),
                                   query, ["number", "sys_created_on", "u_drift_class"]))
    expect(not created, "G4 no new findings from ISC", f"{len(created)} created after {since}"
           + (": " + ", ".join(r.get("number", "?") for r in created) if created else ""))
    return {"since": since, "workflows": workflows, "new_findings": created, "results": rows,
            "verdict": "rolled back" if all(r["ok"] for r in rows) else "not rolled back"}


def main(argv: list[str] | None = None, http: kc.Http | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--settings", required=True, help="The environment settings file (no secrets)")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--plan", action="store_true", help="Print the rollback commands for this environment")
    group.add_argument("--verify", action="store_true", help="Check the workflows are disabled and intake stopped")
    parser.add_argument("--since", help="--verify: the UTC time the rollback started, 'YYYY-MM-DD HH:MM:SS'")
    parser.add_argument("--dry-run", action="store_true", help="No network (the plan shows <workflow-id>)")
    parser.add_argument("--fixtures", help="Answer the calls from this file (tests and the runbook's output)")
    parser.add_argument("--out-json", help="--verify: write the results here, for the evidence folder")
    args = parser.parse_args(argv)
    if args.verify and not args.since:
        parser.error("--verify needs --since")
    env, http, mode = dc.mode_setup(args, http)
    settings = dc.load_settings(args.settings, env)
    left = settings.placeholders()
    if left:
        print("error: placeholders left in the settings file: " + ", ".join(left), file=sys.stderr)
        return 2
    wrong = dc.role_mismatch(settings, env, "evidence_reader", "isc_deploy_checker")
    if wrong:
        print("error: " + "; ".join(wrong), file=sys.stderr)
        return 2
    if http is None:
        workflows = [{"name": w["name"], "id": None, "enabled": None} for w in dc.load_workflows()]
        if args.verify:
            print("dry run: would GET /v2025/workflows and GET /api/now/table/"
                  f"{settings.cfg['SN_FINDING_TABLE']}?sysparm_query=u_source=sailpoint-isc^sys_created_on>{args.since}",
                  file=out)
            return 0
    else:
        workflows = list_kit_workflows(settings, http, env)
    if args.plan:
        print_plan(settings, workflows, out)
        return 0
    print(f"Rollback verify: {settings.environment}, {mode}", file=out)
    result = verify(settings, workflows, http, env, args.since, out)
    print(f"Result: {result['verdict']}", file=out)
    dc.write_json(args.out_json, {"checker": f"deploy/rollback.py/{kc.KIT_VERSION}", "mode": mode,
                                  "environment": settings.environment, **result})
    return 0 if result["verdict"] == "rolled back" else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
