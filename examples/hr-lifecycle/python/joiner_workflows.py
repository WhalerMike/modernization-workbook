"""Lifecycle Workflows definitions as code: lint the reviewed workflow files, plan each change as a new
workflow or a new version against what the tenant holds, and measure day-one readiness.

Gate 3 of the HR-driven identity implementation guide. Each file in config/workflows is the v1.0
request body Learn's "Create workflow" page shows, plus a `_program` block the code keeps out of the
body (owner, version, the execution limit, which Learn says isn't reflected in the API). `plan` never
sends: it writes the POST body for a new workflow, or the createNewVersion body for a changed one, for
the reviewed pipeline or New-MgIdentityGovernanceLifecycleWorkflow to send. Custom task extensions are
Book 19, Chapter 05's (examples/lifecycle-extensions); this tool checks only the built-in tasks.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/joiner_workflows.py lint config/workflows --budget 50
    python python/joiner_workflows.py plan config/workflows --current tests/fixtures/ch03/workflows.json --out out/ch03/plan
    python python/joiner_workflows.py readiness --hires tests/fixtures/ch03/hr-hires.csv --users tests/fixtures/ch03/hire-users.json --prehire-results tests/fixtures/ch03/prehire-results.json --assignments tests/fixtures/ch03/joiner-assignments.json --workflows config/workflows --as-of 2026-11-02T08:00:00Z --cloud gcc --out out/ch03/readiness

Exit codes: 0 clean, 2 findings or warnings (or changes planned), 1 error.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, EXIT_FINDINGS, EXIT_OK, HrlcError, cloud, exit_code, finding, parse_time, read_csv, read_json,
    sort_findings, summary_line, values, write_output,
)

T = "#microsoft.graph.identityGovernance."
# Built-in task definition IDs from Learn's "Lifecycle Workflow built-in tasks" table (read November 1, 2026).
TASKS = {
    "70b29d51-b59a-4773-9280-8841dfd3f2ea": "Send welcome email to new hire",
    "3c860712-2d37-42a4-928f-5c93935d26a1": "Send onboarding reminder email",
    "1b555e50-7f65-41d5-b514-5894a026d10d": "Generate Temporary Access Pass and send via email to user's manager",
    "aab41899-9972-422a-9d97-f626014578b7": "Send email to notify manager of user move",
    "c1ec1e76-f374-4375-aaa6-0bb6bd4c60be": "Request user access package assignment",
    "683c87a4-2ad4-420b-97d4-220d90afcd24": "Assign licenses to user",
    "22085229-5809-45e8-97fd-270d28d66910": "Add user to groups",
    "e440ed8d-25a1-4618-84ce-091ed5be5594": "Add user to teams",
    "6fc52c9d-398b-4305-9763-15f42c1676fc": "Enable user account",
    "4262b724-8dba-4fad-afc3-43fcbb497a0e": "Run a custom task extension",
    "1dfdfcc7-52fa-4c2e-bf3a-e3919cc12950": "Disable user account",
    "1953a66c-751c-45e5-8bfe-01462c70da3c": "Remove user from selected groups",
    "b3a31406-2a15-4c9a-b25b-a658fa5f07fc": "Remove users from all groups",
    "06aa7acb-01af-4824-8899-b14e5ed788d6": "Remove user from selected teams",
    "81f7b200-2816-4b3b-8c5d-dc556f07b024": "Remove user from all teams",
    "4a0b64f2-c7ec-46ba-b117-18f262946c50": "Remove access package assignment for user",
    "42ae2956-193d-4f39-be06-691b8ac4fa1d": "Remove all access package assignments for user",
    "498770d9-bab7-4e4c-b73d-5ded82a1d0b3": "Cancel all pending access package assignment requests for user",
    "5fc402a8-daaf-4b7b-9203-da868b05fc5f": "Remove selected license assignments from user",
    "509589a4-0466-4471-829e-49c5e502bdee": "Revoke all refresh tokens for user",
    "8fa97d28-3e52-4985-b3a9-a1126f9b8b4e": "Remove all license assignments from user",
    "8d18588d-9ad3-4c0f-99d0-ec215f0e3dff": "Delete user",
    "52853a3e-f4e5-4eb8-bb24-1ac09a1da935": "Send email to manager before user's last day",
    "9c0a1eaf-5bda-4392-9d9e-6e155bb57411": "Send email on user's last day",
    "6f22ddd4-b3a5-47a4-a846-0d7c201a49ce": "Send email to user's manager after their last day",
}
TAP, ADD_GROUPS, DELETE, DISABLE, REQUEST_AP = ("1b555e50-7f65-41d5-b514-5894a026d10d", "22085229-5809-45e8-97fd-270d28d66910",
                                                 "8d18588d-9ad3-4c0f-99d0-ec215f0e3dff", "1dfdfcc7-52fa-4c2e-bf3a-e3919cc12950",
                                                 "c1ec1e76-f374-4375-aaa6-0bb6bd4c60be")
# Learn's built-in tasks page names the TAP lifetime argument two ways: 'tapLifetimeInMinutes' in its
# table and 'tapLifetimeMinutes' in its example. Accept either (verification log).
TAP_LIFETIME_ARGS = ("tapLifetimeMinutes", "tapLifetimeInMinutes")
TRIGGER_ATTRS = {"joiner": {"employeeHireDate", "createdDateTime"}, "leaver": {"employeeLeaveDateTime"}}
CODED = ("employeeType", "onPremisesExtensionAttributes/extensionAttribute10",
         "onPremisesExtensionAttributes/extensionAttribute11", "onPremisesExtensionAttributes/extensionAttribute12")
# The user properties Learn's ruleBasedSubjectSet page lists for a scope rule (eq, ne, in, startsWith).
SUPPORTED = {"accountEnabled", "city", "companyName", "country", "department", "displayName", "employeeId",
             "employeeOrgData/costCenter", "employeeOrgData/division", "employeeType", "faxNumber", "givenName", "jobTitle",
             "mail", "mailNickname", "mobilePhone", "officeLocation", "onPremisesSecurityIdentifier", "onPremisesSyncEnabled",
             "postalCode", "preferredLanguage", "state", "streetAddress", "surname", "usageLocation", "userPrincipalName", "userType"} | {
             f"onPremisesExtensionAttributes/extensionAttribute{i}" for i in range(1, 16)}
NAME_PROPS = {"department", "companyName", "displayName", "jobTitle", "officeLocation"}
LEARN_CEILING = 100
PROP = re.compile(r"\(\s*(?:not\s*\(\s*)?([A-Za-z][A-Za-z0-9/]*)\s+(?:eq|ne|in)\b|startsWith\(\s*([A-Za-z][A-Za-z0-9/]*)\s*,")


def load_dir(folder: Path) -> list[tuple[str, dict[str, Any]]]:
    files = sorted(Path(folder).glob("*.json"))
    if not files:
        raise HrlcError(f"no workflow files in {folder}")
    return [(f.name, read_json(f)) for f in files]


def _args(task: dict[str, Any]) -> dict[str, str]:
    return {a["name"]: str(a.get("value", "")) for a in task.get("arguments") or []}


def rule_props(rule: str) -> set[str]:
    return {a or b for a, b in PROP.findall(rule or "")}


def lint(defs: list[tuple[str, dict[str, Any]]], budget: int) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    names = [d.get("displayName", "") for _, d in defs]
    for fname, d in defs:
        key, name = fname, d.get("displayName", fname)
        cat = d.get("category")
        prog = d.get("_program") or {}
        if cat not in ("joiner", "leaver", "mover"):
            out.append(finding("JW-01", "Finding", key, name, f"category {cat!r} isn't joiner, leaver or mover"))
        cond = d.get("executionConditions") or {}
        trig = cond.get("trigger") or {}
        rule = (cond.get("scope") or {}).get("rule", "")
        props = rule_props(rule)
        if cond.get("@odata.type") == T + "triggerAndScopeBasedConditions":
            if not props & set(CODED):
                out.append(finding("JW-02", "Warn", key, name, "scope rule uses no coded attribute (employeeType or the coded extension slots); scope by code, not by name"))
            for p in sorted(props - SUPPORTED):
                out.append(finding("JW-12", "Finding", f"{key}:{p}", name, f"scope rule uses {p}, which Learn doesn't list for a workflow scope"))
            for p in sorted(props & NAME_PROPS):
                out.append(finding("JW-02", "Warn", f"{key}:{p}", name, f"scope rule reads the display value {p}; a renamed organization silently drops users"))
            if trig.get("@odata.type") == T + "timeBasedAttributeTrigger":
                off = trig.get("offsetInDays")
                if not isinstance(off, int) or not -180 <= off <= 180:
                    out.append(finding("JW-03", "Finding", key, name, f"offsetInDays {off!r} is outside -180 to 180"))
                if cat in TRIGGER_ATTRS and trig.get("timeBasedAttribute") not in TRIGGER_ATTRS[cat]:
                    out.append(finding("JW-04", "Finding", key, name, f"a {cat} workflow triggered on {trig.get('timeBasedAttribute')}"))
            elif trig.get("@odata.type") == T + "attributeChangeTrigger" and cat != "mover":
                out.append(finding("JW-04", "Finding", key, name, "an attribute-change trigger on a workflow that isn't a mover"))
        tasks = d.get("tasks") or []
        if len(tasks) > 25:
            out.append(finding("JW-06", "Finding", key, name, f"{len(tasks)} tasks; Learn's limit is 25 per workflow"))
        ids = [str(t.get("taskDefinitionId", "")).lower() for t in tasks]
        for t in tasks:
            tid = str(t.get("taskDefinitionId", "")).lower()
            if tid not in TASKS:
                out.append(finding("JW-10", "Finding", f"{key}:{tid}", name, f"task definition {tid} isn't in Learn's built-in task table"))
            if tid == TAP:
                a = _args(t)
                given = [k for k in TAP_LIFETIME_ARGS if k in a]
                if not given:
                    out.append(finding("JW-05", "Finding", key, name, "TAP task has no lifetime argument"))
                else:
                    life = int(a[given[0]])
                    if not 10 <= life <= 43200:
                        out.append(finding("JW-05", "Finding", key, name, f"TAP lifetime {life} minutes is outside 10 to 43,200"))
                    elif life > 1440:
                        out.append(finding("JW-05", "Warn", key, name, f"TAP lifetime {life} minutes; Learn recommends at most 24 hours for a new hire"))
                if a.get("tapIsUsableOnce", "").lower() != "true":
                    out.append(finding("JW-05", "Warn", key, name, "TAP isn't one-time use; the tenant policy can force it (design guidance: do)"))
            if tid == ADD_GROUPS and cat == "joiner":
                out.append(finding("JW-09", "Finding", key, name, "joiner adds the user to groups directly; give baseline access by access package"))
        if cat == "leaver" and DELETE in ids and DISABLE in ids:
            out.append(finding("JW-11", "Finding", key, name, "delete and disable in one workflow; delete in a separate post-separation workflow"))
        if d.get("isSchedulingEnabled") and not prog.get("executionLimit"):
            out.append(finding("JW-08", "Finding", key, name, "scheduled with no execution limit recorded; set it in the admin center (Learn: not in the API) and record it in _program"))
        if names.count(name) > 1:
            out.append(finding("JW-14", "Finding", key, name, "two files define this display name"))
    n = len(defs)
    if n > LEARN_CEILING:
        out.append(finding("JW-07", "Finding", "count", "workflow count", f"{n} workflows; Learn's create page allows 100"))
    elif n > budget:
        out.append(finding("JW-07", "Finding", "count", "workflow count", f"{n} workflows over the budget of {budget} (Learn's licensing page says 50, its limits page 100)"))
    return sort_findings(out)


def body(d: dict[str, Any]) -> dict[str, Any]:
    """The request body: the file without `_program`."""
    return {k: v for k, v in d.items() if not k.startswith("_")}


def _norm(d: dict[str, Any]) -> dict[str, Any]:
    keep = ("category", "description", "displayName", "isEnabled", "isSchedulingEnabled", "executionConditions")
    out = {k: d.get(k) for k in keep}
    out["tasks"] = [{"displayName": t.get("displayName"), "taskDefinitionId": str(t.get("taskDefinitionId", "")).lower(),
                     "continueOnError": bool(t.get("continueOnError")), "isEnabled": t.get("isEnabled", True),
                     "arguments": sorted((a["name"], str(a.get("value", ""))) for a in t.get("arguments") or [])}
                    for t in sorted(d.get("tasks") or [], key=lambda t: t.get("executionSequence", 0))]
    return json.loads(json.dumps(out, sort_keys=True))


def plan(defs: list[tuple[str, dict[str, Any]]], current: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    by_name = {w.get("displayName"): w for w in current}
    steps, bodies, out = [], {}, []
    for fname, d in defs:
        name, b = d["displayName"], body(d)
        cur = by_name.get(name)
        if cur is None:
            steps.append({"file": fname, "displayName": name, "action": "create", "request": "POST /identityGovernance/lifecycleWorkflows/workflows", "body": f"bodies/{fname}"})
            bodies[f"bodies/{fname}"] = b
        elif _norm(cur) != _norm(b):
            steps.append({"file": fname, "displayName": name, "action": "new-version", "workflowId": cur.get("id"),
                          "currentVersion": cur.get("version"),
                          "request": f"POST /identityGovernance/lifecycleWorkflows/workflows/{cur.get('id')}/createNewVersion", "body": f"bodies/{fname}"})
            bodies[f"bodies/{fname}"] = {"workflow": b}
        else:
            steps.append({"file": fname, "displayName": name, "action": "none", "workflowId": cur.get("id"), "currentVersion": cur.get("version")})
    managed = {d["displayName"] for _, d in defs}
    for w in current:
        if w.get("displayName") not in managed:
            out.append(finding("JW-15", "Warn", w.get("id", ""), w.get("displayName", ""), "workflow in the tenant that no reviewed file defines"))
    return steps, bodies, sort_findings(out)


def readiness(hires: list[dict[str, str]], users: list[dict[str, Any]], prehire: list[dict[str, Any]], assignments: list[dict[str, Any]],
              onboarding_package: str, as_of: str) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    """Day-one readiness (Book 03, Chapter 11): the share of hires whose account, licenses and baseline access
    exist at the start of day one. Run on an export taken at the start of the day."""
    t = parse_time(as_of)
    by_emp = {str(u.get("employeeId") or ""): u for u in users}
    done = {(r.get("subject") or {}).get("id") for r in prehire if r.get("processingStatus") == "completed"}
    delivered = {(a.get("target") or {}).get("objectId") for a in assignments
                 if (a.get("accessPackage") or {}).get("id") == onboarding_package and a.get("state") == "delivered"}
    rows, out = [], []
    for h in hires:
        hd = parse_time(h["HireDate"])
        if hd is None or hd.date() != t.date():
            continue
        u = by_emp.get(h["PersonNumber"])
        missing = []
        if u is None:
            missing.append("account")
        else:
            if not u.get("accountEnabled"):
                missing.append("enabled")
            if not u.get("assignedLicenses"):
                missing.append("license")
            if u.get("id") not in delivered:
                missing.append("onboarding package")
            if u.get("id") not in done:
                missing.append("pre-hire run")
        rows.append({"PersonNumber": h["PersonNumber"], "ready": not missing, "missing": missing})
        if missing:
            out.append(finding("JR-01", "Warn", h["PersonNumber"], (u or {}).get("userPrincipalName", h["PersonNumber"]),
                               "not ready at the start of day one: " + ", ".join(missing)))
    ready = sum(1 for r in rows if r["ready"])
    summary = {"metric": "joiner readiness rate", "day": t.date().isoformat(), "hires": len(rows), "ready": ready,
               "rate": round(ready / len(rows), 4) if rows else None}
    return rows, summary, sort_findings(out)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    li = sub.add_parser("lint", help="lint the workflow files (JW-01 to JW-14)")
    li.add_argument("folder", type=Path)
    li.add_argument("--budget", type=int, default=50, help="the program's workflow budget (default 50)")
    pl = sub.add_parser("plan", help="plan creates and new versions against a workflows export; sends nothing")
    pl.add_argument("folder", type=Path)
    pl.add_argument("--current", type=Path, required=True, help="workflows.json from graph_export.py --task joiner-plan")
    pl.add_argument("--out", type=Path, required=True)
    rd = sub.add_parser("readiness", help="measure day-one readiness")
    rd.add_argument("--hires", type=Path, required=True)
    rd.add_argument("--users", type=Path, required=True)
    rd.add_argument("--prehire-results", type=Path, required=True)
    rd.add_argument("--assignments", type=Path, required=True)
    rd.add_argument("--workflows", type=Path, required=True, help="the folder holding day-one.json, for the onboarding package ID")
    rd.add_argument("--as-of", required=True)
    rd.add_argument("--cloud", required=True)
    rd.add_argument("--tenant-id", default="contoso-fixture")
    rd.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "lint":
            defs = load_dir(args.folder)
            rows = lint(defs, args.budget)
            print(f"Workflows: {len(defs)} files, budget {args.budget}")
            print(summary_line("Lint", rows))
            for r in rows:
                print(f"  {r['Rule']} {r['Severity']}: {r['Object']}: {r['Issue']}")
            return exit_code(rows)
        if args.cmd == "plan":
            defs = load_dir(args.folder)
            if any(r["Severity"] == "Finding" for r in lint(defs, 10**6)):
                raise HrlcError("the files have lint findings; fix them before planning")
            steps, bodies, rows = plan(defs, values(read_json(args.current)))
            write_output(args.out, "joiner-plan", {"plan.json": steps, "findings.json": rows, **bodies}, {"tool": "joiner_workflows.py"})
            for s in steps:
                print(f"  {s['action']:<11} {s['displayName']}")
            print(summary_line("Plan", rows))
            print(f"Plan written to {args.out.as_posix()}/plan.json; nothing was sent")
            changes = any(s["action"] != "none" for s in steps)
            return EXIT_FINDINGS if changes or exit_code(rows) else EXIT_OK
        cl = cloud(args.cloud)
        day_one = read_json(args.workflows / "day-one.json")
        pkg = (day_one.get("_program") or {}).get("onboardingAccessPackageId", "")
        rows, summary, found = readiness(read_csv(args.hires), values(read_json(args.users)), values(read_json(args.prehire_results)),
                                         values(read_json(args.assignments)), pkg, args.as_of)
        write_output(args.out, "joiner-readiness", {"readiness.json": rows, "summary.json": summary, "findings.json": found},
                     {"tool": "joiner_workflows.py", "cloud": cl["name"], "tenantId": args.tenant_id, "asOf": args.as_of})
        rate = "n/a" if summary["rate"] is None else f"{summary['rate']:.0%}"
        print(f"Day one {summary['day']}: {summary['ready']} of {summary['hires']} hires ready ({rate})")
        print(summary_line("Readiness", found))
        return exit_code(found)
    except (HrlcError, OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
