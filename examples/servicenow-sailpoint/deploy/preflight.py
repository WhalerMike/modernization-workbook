"""Pre-flight checks before each deployment step: the settings file, Gate 1, credentials, roles and the targets.

Run it before anything is deployed to an environment, and again after each
staged-enable step with the workflow state that step should leave. Each
check names the gate of the example guide it serves (G1 boundary, G4 front
door). Any FAIL exits 1: stop and fix it before going on.

Offline checks (always):
  settings    the file loads, carries no secret and no <placeholder>, and names
              the environment (test or production)
  endpoints   https endpoints, and no environment variable overriding them
  marketplace the FedRAMP Marketplace listings recorded, read within 30 days
  features    SailPoint's written confirmation that Workflows, Native Change
              Detection and the HTTP Request step are in the authorized
              environment (WARN in test, FAIL in production)
  auth        OAuth client credentials (or a vault-fed token) for ServiceNow
              and ISC; basic authentication refused
  change      a change record (required in production)
  roles       each integration identity's recorded grant equals what its
              tasks need in config/calls.json

Live checks (skipped with --dry-run, answered from a file with --fixtures):
  instance    the finding table answers the evidence reader (GET, one row)
  workflows   the three kit workflows are absent, disabled or enabled, as
              --expect-workflows says

Read-only: it only reads. Credentials for the live checks: the evidence
reader's ServiceNow OAuth client and the ISC deploy checker's API client.

Examples (from the kit root):

  python deploy/preflight.py --settings deploy/environment.test.json --expect-workflows absent --dry-run
  python deploy/preflight.py --settings tests/fixtures/deploy/environment.test.json --expect-workflows disabled --fixtures tests/fixtures/deploy/preflight.json --today 2026-11-02
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from typing import Any, Mapping

import deploy_common as dc
from deploy_common import kc

MARKETPLACE_MAX_AGE_DAYS = 30  # design guidance: re-read the listing for each stage


class Report:
    def __init__(self, out):
        self.out = out
        self.rows: list[dict] = []

    def add(self, status: str, gate: str, name: str, detail: str) -> None:
        self.rows.append({"status": status, "gate": gate, "check": name, "detail": detail})
        print(f"  {status:<4}  {gate}  {name:<11} {detail}", file=self.out)

    def counts(self) -> dict[str, int]:
        return {s: sum(1 for r in self.rows if r["status"] == s) for s in ("PASS", "WARN", "FAIL", "SKIP")}


def check_settings(settings: dc.Settings, report: Report) -> bool:
    left = settings.placeholders()
    if left:
        report.add("FAIL", "G1", "settings", "placeholders left: " + ", ".join(left))
        return False
    if settings.environment not in dc.ENVIRONMENTS:
        report.add("FAIL", "G1", "settings", f"deploy.environment must be test or production, not {settings.environment!r}")
        return False
    report.add("PASS", "G1", "settings", "no secrets in the file; no placeholders left")
    return True


def check_endpoints(settings: dc.Settings, env: Mapping[str, str], report: Report) -> None:
    try:
        sn, isc = kc.sn_base_url(settings.cfg), kc.isc_base_url(settings.cfg)
    except kc.KitError as exc:
        report.add("FAIL", "G1", "endpoints", str(exc))
        return
    problems = [u for u in (sn, isc) if not u.startswith("https://")]
    overrides = dc.endpoint_overrides(settings, env)
    if problems:
        report.add("FAIL", "G1", "endpoints", "not https: " + ", ".join(problems))
    elif overrides:
        report.add("FAIL", "G1", "endpoints", "environment variables override the file: " + ", ".join(overrides)
                   + " (unset them)")
    else:
        report.add("PASS", "G1", "endpoints", f"{sn}; {isc}; no environment variable overrides them")


def check_marketplace(settings: dc.Settings, today: date, report: Report) -> None:
    g1 = settings.deploy.get("g1") or {}
    try:
        checked = date.fromisoformat(str(g1.get("marketplace_checked_on")))
    except ValueError:
        report.add("FAIL", "G1", "marketplace", "g1.marketplace_checked_on is not a date (YYYY-MM-DD)")
        return
    age = (today - checked).days
    listings = f"{g1.get('servicenow_listing')} and {g1.get('sailpoint_listing')}"
    if not g1.get("servicenow_listing") or not g1.get("sailpoint_listing"):
        report.add("FAIL", "G1", "marketplace", "record both Marketplace listing IDs")
    elif age < 0 or age > MARKETPLACE_MAX_AGE_DAYS:
        report.add("FAIL", "G1", "marketplace", f"{listings} recorded {checked} ({age} days ago); re-read the Marketplace")
    else:
        report.add("PASS", "G1", "marketplace", f"{listings} recorded {checked} ({age} days ago)")


def check_features(settings: dc.Settings, report: Report) -> None:
    g1 = settings.deploy.get("g1") or {}
    confirmed = g1.get("sailpoint_confirmed") or {}
    missing = [f for f in dc.G1_FEATURES if confirmed.get(f) is not True]
    if not missing:
        report.add("PASS", "G1", "features", "SailPoint confirmed in writing: " + ", ".join(dc.G1_FEATURES)
                   + f" ({g1.get('sailpoint_reference')})")
    elif settings.environment == "production":
        report.add("FAIL", "G1", "features", "not confirmed in writing: " + ", ".join(missing) + "; production waits")
    else:
        report.add("WARN", "G1", "features", "not confirmed in writing: " + ", ".join(missing)
                   + " (the test stage may go on; production may not)")


def check_auth(env: Mapping[str, str], settings: dc.Settings, report: Report) -> None:
    problems = []
    if env.get("SN_USERNAME") or env.get("SN_PASSWORD"):
        problems.append("SN_USERNAME/SN_PASSWORD set: basic authentication is for a developer instance only")
    sn_ok = bool(env.get("SN_ACCESS_TOKEN") or (settings.cfg.get("SN_CLIENT_ID") and env.get("SN_CLIENT_SECRET")))
    isc_ok = bool(env.get("SAILPOINT_ACCESS_TOKEN")
                  or (settings.cfg.get("SAILPOINT_CLIENT_ID") and env.get("SAILPOINT_CLIENT_SECRET")))
    if not sn_ok:
        problems.append("ServiceNow: set SN_CLIENT_ID and SN_CLIENT_SECRET (or SN_ACCESS_TOKEN) from the vault")
    if not isc_ok:
        problems.append("ISC: set SAILPOINT_CLIENT_ID and SAILPOINT_CLIENT_SECRET (or SAILPOINT_ACCESS_TOKEN) from the vault")
    if problems:
        report.add("FAIL", "G1", "auth", "; ".join(problems))
    else:
        sn_kind = "vault-fed token" if env.get("SN_ACCESS_TOKEN") else "OAuth client credentials"
        isc_kind = "vault-fed token" if env.get("SAILPOINT_ACCESS_TOKEN") else "client credentials"
        report.add("PASS", "G1", "auth", f"ServiceNow: {sn_kind}; ISC: {isc_kind}; no basic-auth variables set")


def check_change(settings: dc.Settings, report: Report) -> None:
    change = str(settings.deploy.get("change_record") or "").strip()
    if change:
        report.add("PASS", "G1", "change", f"change record {change}")
    elif settings.environment == "production":
        report.add("FAIL", "G1", "change", "production needs deploy.change_record")
    else:
        report.add("WARN", "G1", "change", "no change record (required in production)")


def check_roles(settings: dc.Settings, report: Report) -> None:
    granted = settings.deploy.get("granted") or {}
    bad = []
    for identity in dc.IDENTITIES:
        system, needed = dc.required_for(identity)
        result = dc.kcalls.compare(needed, str(granted.get(identity, "")).split(","))
        if not result["ok"]:
            parts = []
            if result["missing"]:
                parts.append("missing " + ", ".join(result["missing"]))
            if result["extra"]:
                parts.append("extra " + ", ".join(result["extra"]))
            bad.append(f"{identity} ({system}): " + "; ".join(parts))
    if bad:
        report.add("FAIL", "G1", "roles", " | ".join(bad))
    else:
        report.add("PASS", "G1", "roles", f"{len(dc.IDENTITIES)} integration identities hold exactly what their tasks need")


def live_checks(settings: dc.Settings, env: Mapping[str, str], http: kc.Http, expect: str, report: Report) -> dict:
    cfg = settings.cfg
    found: dict[str, Any] = {}
    try:
        sn = kc.sn_headers(cfg, http, env)
        params = {"sysparm_limit": 1, "sysparm_fields": "sys_id", "sysparm_exclude_reference_link": "true"}
        body = http.json("GET", f"{kc.sn_base_url(cfg)}/api/now/table/{cfg['SN_FINDING_TABLE']}", headers=sn,
                         params=params) or {}
        report.add("PASS", "G4", "instance", f"GET /api/now/table/{cfg['SN_FINDING_TABLE']} answered as the evidence "
                   f"reader ({len(body.get('result', []))} of at most 1 row read)")
    except kc.KitError as exc:
        report.add("FAIL", "G4", "instance", str(exc))
    try:
        isc = kc.isc_headers(cfg, http, env)
        listed = http.json("GET", f"{kc.isc_base_url(cfg)}/v2025/workflows", headers=isc) or []
    except kc.KitError as exc:
        report.add("FAIL", "G4", "workflows", str(exc))
        return found
    names = [w["name"] for w in dc.load_workflows()]
    by_name = {w.get("name"): w for w in listed}
    for name in names:
        if name in by_name:
            found[name] = {"id": by_name[name].get("id"), "enabled": bool(by_name[name].get("enabled"))}
    states = {name: ("absent" if name not in found else "enabled" if found[name]["enabled"] else "disabled")
              for name in names}
    wrong = {n: s for n, s in states.items() if expect != "any" and s != expect}
    summary = f"{len(found)} of {len(names)} found; " + ", ".join(sorted({*states.values()})) + f" (expected {expect})"
    if wrong:
        report.add("FAIL", "G4", "workflows", summary + "; " + "; ".join(f"{n}: {s}" for n, s in wrong.items()))
    else:
        report.add("PASS", "G4", "workflows", summary)
    return found


def main(argv: list[str] | None = None, http: kc.Http | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--settings", required=True, help="The environment settings file (no secrets)")
    parser.add_argument("--expect-workflows", choices=("absent", "disabled", "enabled", "any"), default="any",
                        help="The state the three kit workflows should be in now")
    parser.add_argument("--dry-run", action="store_true", help="No network: offline checks, and list the live calls")
    parser.add_argument("--fixtures", help="Answer the live calls from this file (tests and the runbook's output)")
    parser.add_argument("--today", help="The date to judge the Marketplace record against (YYYY-MM-DD; default today)")
    parser.add_argument("--out-json", help="Write the results here, for the evidence folder")
    args = parser.parse_args(argv)
    env, http, mode = dc.mode_setup(args, http)
    today = date.fromisoformat(args.today) if args.today else date.today()
    report = Report(out)
    try:
        settings = dc.load_settings(args.settings, env)
    except kc.KitError as exc:
        print(f"Preflight: {args.settings}", file=out)
        report.add("FAIL", "G1", "settings", str(exc))
        settings = None
    if settings is not None:
        print(f"Preflight: {settings.environment or '?'} (settings {args.settings}), {today}, {mode}", file=out)
        if check_settings(settings, report):
            check_endpoints(settings, env, report)
            check_marketplace(settings, today, report)
            check_features(settings, report)
            check_auth(env, settings, report)
            check_change(settings, report)
            check_roles(settings, report)
            if http is None:
                report.add("SKIP", "G4", "instance", "dry run: would call POST /oauth_token.do, "
                           f"GET /api/now/table/{settings.cfg['SN_FINDING_TABLE']}?sysparm_limit=1")
                report.add("SKIP", "G4", "workflows", "dry run: would call POST /oauth/token, GET /v2025/workflows"
                           f" and expect {args.expect_workflows}")
            elif report.counts()["FAIL"] == 0:
                live_checks(settings, env, http, args.expect_workflows, report)
            else:
                report.add("SKIP", "G4", "live", "an offline check failed; no calls made")
    counts = report.counts()
    verdict = "no-go" if counts["FAIL"] else "go"
    print(f"Result: {counts['PASS']} PASS, {counts['WARN']} WARN, {counts['FAIL']} FAIL, {counts['SKIP']} SKIP: {verdict}",
          file=out)
    dc.write_json(args.out_json, {"checker": f"deploy/preflight.py/{kc.KIT_VERSION}", "mode": mode,
                                  "settings": args.settings, "date": str(today),
                                  "environment": settings.environment if settings else None,
                                  "results": report.rows, "verdict": verdict})
    return 1 if counts["FAIL"] else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
