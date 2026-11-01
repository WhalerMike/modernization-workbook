"""Access packages assigned from HR attributes, as code: lint the reviewed assignment policies, scan an
export for the memberOf rules that are quarantined from November 3, 2026, and list what a move leaves
behind for the mover's residual-access review.

Gate 4 of the HR-driven identity implementation guide. Each file in config/access is the v1.0 body of an
accessPackageAssignmentPolicy (Learn's "Create assignmentPolicies", example 3 for an automatic policy),
plus a `_program` block (tier, the package's resource groups) the code keeps out of the body. Dynamic
group rules as code, with a full parser and the shadow diff, are Book 19, Chapter 04's
(examples/dynamic-rules); the evaluator here handles only the subset the policies use (-eq, -ne, -in,
-startsWith, -and, -or, -not, parentheses) and refuses anything else.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/access_assignment.py lint config/access --population tests/fixtures/ch04/population.json
    python python/access_assignment.py memberof-scan --policies tests/fixtures/ch04/assignment-policies.json
    python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json --assignments tests/fixtures/ch04/mover-assignments.json --memberships tests/fixtures/ch04/mover-memberships.json --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual

Exit codes: 0 clean, 2 findings or warnings, 1 error.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, cloud, csv_text, exit_code, finding, hours, iso, parse_time, read_json, sort_findings,
    summary_line, values, write_output,
)

MAX_SCOPE = 15000                     # Learn: a policy can include at most 15,000 identities in its rule
PRIVILEGED_TIERS = {"T0", "T1", "privileged"}
STANDARD_MAX_GRACE_DAYS = 14          # design guidance: a handover grace, not a second job
CODED = {"extensionattribute10", "extensionattribute11", "extensionattribute12", "employeetype"}
REVIEW_DAYS = 10                      # design guidance: the residual review closes within ten days of the move
MEMBEROF = re.compile(r"memberof", re.I)


# ---------------------------------------------------------------- a small rule evaluator

class RuleError(HrlcError):
    pass


TOKEN = re.compile(r'\s*(\(|\)|\[|\]|,|-and\b|-or\b|-not\b|-eq\b|-ne\b|-in\b|-startsWith\b|user\.[A-Za-z0-9_]+|"[^"]*"|true\b|false\b|null\b|\S+)', re.I)


def tokenize(rule: str) -> list[str]:
    toks, pos = [], 0
    while pos < len(rule):
        m = TOKEN.match(rule, pos)
        if not m or not m.group(1):
            break
        toks.append(m.group(1))
        pos = m.end()
    return toks


def parse(rule: str) -> Any:
    toks = tokenize(rule)
    i = 0

    def peek() -> str:
        return toks[i].lower() if i < len(toks) else ""

    def take() -> str:
        nonlocal i
        if i >= len(toks):
            raise RuleError(f"rule ends early: {rule}")
        i += 1
        return toks[i - 1]

    def value() -> Any:
        t = take()
        if t == "[":
            items = []
            while peek() != "]":
                items.append(value())
                if peek() == ",":
                    take()
            take()
            return items
        if t.startswith('"'):
            return t[1:-1]
        if t.lower() in ("true", "false"):
            return t.lower() == "true"
        if t.lower() == "null":
            return None
        raise RuleError(f"unsupported value {t!r} in: {rule}")

    def atom() -> Any:
        if peek() == "-not":
            take()
            return ("not", atom())
        if peek() == "(":
            take()
            e = expr()
            if take() != ")":
                raise RuleError(f"unbalanced parentheses: {rule}")
            return e
        prop = take()
        if not prop.lower().startswith("user."):
            raise RuleError(f"unsupported term {prop!r} (only user.<property>): {rule}")
        op = take().lower()
        if op not in ("-eq", "-ne", "-in", "-startswith"):
            raise RuleError(f"unsupported operator {op!r}; check this rule with examples/dynamic-rules: {rule}")
        return ("cmp", prop[5:], op, value())

    def expr() -> Any:
        left = atom()
        while peek() in ("-and", "-or"):
            op = take().lower()
            left = (op[1:], left, atom())
        return left

    tree = expr()
    if i != len(toks):
        raise RuleError(f"unexpected {toks[i]!r} in: {rule}")
    return tree


def evaluate(tree: Any, user: dict[str, Any]) -> bool:
    kind = tree[0]
    if kind == "not":
        return not evaluate(tree[1], user)
    if kind in ("and", "or"):
        a, b = evaluate(tree[1], user), evaluate(tree[2], user)
        return (a and b) if kind == "and" else (a or b)
    _, prop, op, val = tree
    actual = {k.lower(): v for k, v in user.items()}.get(prop.lower())
    lo = (lambda x: x.lower() if isinstance(x, str) else x)
    if op == "-eq":
        return lo(actual) == lo(val)
    if op == "-ne":
        return lo(actual) != lo(val)
    if op == "-in":
        return lo(actual) in [lo(v) for v in val]
    return isinstance(actual, str) and isinstance(val, str) and actual.lower().startswith(val.lower())


def rule_props(tree: Any) -> set[str]:
    if tree[0] == "not":
        return rule_props(tree[1])
    if tree[0] in ("and", "or"):
        return rule_props(tree[1]) | rule_props(tree[2])
    return {tree[1].lower()}


# ---------------------------------------------------------------- lint

def load_dir(folder: Path) -> list[tuple[str, dict[str, Any]]]:
    files = sorted(Path(folder).glob("*.json"))
    if not files:
        raise HrlcError(f"no policy files in {folder}")
    return [(f.name, read_json(f)) for f in files]


def _rule(p: dict[str, Any]) -> str:
    for t in p.get("specificAllowedTargets") or []:
        if t.get("@odata.type") == "#microsoft.graph.attributeRuleMembers":
            return t.get("membershipRule", "")
    return ""


def _grace_days(value: str | None) -> float:
    if not value:
        return 0.0
    m = re.fullmatch(r"P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?", value)
    if not m:
        raise HrlcError(f"unsupported duration {value!r}")
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d + h / 24 + mi / 1440 + s / 86400


def lint(defs: list[tuple[str, dict[str, Any]]], population: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    autos: dict[str, list[tuple[str, Any]]] = {}
    for fname, p in defs:
        prog, name = p.get("_program") or {}, p.get("displayName", fname)
        tier = prog.get("tier", "standard")
        rule = _rule(p)
        auto = p.get("automaticRequestSettings")
        if rule and MEMBEROF.search(rule):
            out.append(finding("AA-01", "Finding", fname, name, "rule uses memberOf; from November 3, 2026 the policy is quarantined and adds and removes nothing"))
            continue
        tree = None
        if rule:
            try:
                tree = parse(rule)
            except RuleError as e:
                out.append(finding("AA-08", "Warn", fname, name, f"rule outside the evaluator's subset ({e}); lint it with examples/dynamic-rules"))
        if tree is not None and not rule_props(tree) & CODED:
            out.append(finding("AA-04", "Warn", fname, name, "rule reads no coded slot or worker type; write it on the codes HR owns"))
        if auto is not None:
            if tier in PRIVILEGED_TIERS:
                out.append(finding("AA-09", "Finding", fname, name, f"tier {tier} access assigned by rule; privileged access is requested and activated through PIM"))
            if not (auto.get("requestAccessForAllowedTargets") and auto.get("removeAccessWhenTargetLeavesAllowedTargets")):
                out.append(finding("AA-05", "Finding", fname, name, "automatic policy doesn't both create and remove assignments"))
            grace = _grace_days(auto.get("gracePeriodBeforeAccessRemoval"))
            if grace > STANDARD_MAX_GRACE_DAYS:
                out.append(finding("AA-06", "Warn", fname, name, f"grace period {grace:g} days is over the program's {STANDARD_MAX_GRACE_DAYS}"))
            scope = prog.get("expectedScope")
            if scope is None and tree is not None:
                scope = sum(1 for u in population if evaluate(tree, u))
            if scope is not None and scope > MAX_SCOPE:
                out.append(finding("AA-03", "Finding", fname, name, f"about {scope} identities in scope; Learn allows at most {MAX_SCOPE:,} per policy"))
            autos.setdefault((p.get("accessPackage") or {}).get("id", ""), []).append((fname, tree))
        else:
            stages = (p.get("requestApprovalSettings") or {}).get("stages") or []
            mgr = any(a.get("@odata.type") == "#microsoft.graph.requestorManager" for s in stages for a in s.get("primaryApprovers") or [])
            fb = all(s.get("fallbackPrimaryApprovers") for s in stages) and bool(stages)
            if not (mgr and fb):
                out.append(finding("AA-07", "Finding", fname, name, "request policy doesn't route to the manager with a fallback approver"))
    for pkg, items in sorted(autos.items()):
        if len(items) < 2:
            continue
        names = ", ".join(f for f, _ in items)
        overlap = [u.get("userPrincipalName", "") for u in population
                   if sum(1 for _, t in items if t is not None and evaluate(t, u)) > 1]
        if overlap:
            out.append(finding("AA-02", "Finding", pkg, names, f"{len(overlap)} users match more than one automatic policy on one package; they can lose access"))
        else:
            out.append(finding("AA-02", "Warn", pkg, names, "two automatic policies on one package; supported only if no user ever matches both or moves between them"))
    return sort_findings(out)


def memberof_scan(policies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The same test as Learn's read-only script, over an assignmentPolicies export, for the pipeline."""
    out = []
    for p in policies:
        if MEMBEROF.search(_rule(p)):
            pkg = (p.get("accessPackage") or {}).get("displayName") or (p.get("accessPackage") or {}).get("id", "")
            out.append(finding("MS-01", "Finding", p.get("id", ""), f"{pkg}: {p.get('displayName', '')}",
                               "automatic policy rule uses memberOf; quarantined from November 3, 2026"))
    return sort_findings(out)


# ---------------------------------------------------------------- the mover's residual

def residual(mover: dict[str, Any], assignments: list[dict[str, Any]], groups: list[dict[str, Any]],
             defs: list[tuple[str, dict[str, Any]]], as_of: str) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    """Classify everything the mover holds after the move (Book 03, Chapter 08, Mover): what the automatic
    policies remove after the grace period, what came by request, and what sits outside packages. The last
    two go to the residual review. The transfer-to-review interval is PS-5's metric."""
    by_policy = {p.get("displayName"): (f, p) for f, p in defs}
    pkg_groups: dict[str, str] = {}
    for _, p in defs:
        for g in (p.get("_program") or {}).get("resourceGroupIds") or []:
            pkg_groups[g] = (p.get("_program") or {}).get("accessPackageName", "")
    attrs = mover["attributesAfter"]
    eff = parse_time(mover["effectiveDateTime"])
    rows: list[dict[str, Any]] = []
    for a in assignments:
        if a.get("state") != "delivered":
            continue
        pkg = (a.get("accessPackage") or {}).get("displayName", "")
        pol_name = (a.get("assignmentPolicy") or {}).get("displayName", "")
        f, p = by_policy.get(pol_name, (None, None))
        if p is not None and p.get("automaticRequestSettings"):
            tree = parse(_rule(p))
            if evaluate(tree, attrs):
                rows.append({"item": pkg, "kind": "access package", "via": pol_name, "class": "kept by rule", "review": False})
            else:
                grace = _grace_days(p["automaticRequestSettings"].get("gracePeriodBeforeAccessRemoval"))
                rows.append({"item": pkg, "kind": "access package", "via": pol_name, "class": "removed by rule after grace",
                             "removalBy": iso(eff + dt.timedelta(days=grace)), "review": False})
        else:
            rows.append({"item": pkg, "kind": "access package", "via": pol_name or "(unknown policy)", "class": "requested: review", "review": True})
    for g in groups:
        gid, gname = g.get("id", ""), g.get("displayName", "")
        if "DynamicMembership" in (g.get("groupTypes") or []):
            rows.append({"item": gname, "kind": "group", "via": "dynamic rule", "class": "rule-managed", "review": False})
        elif gid in pkg_groups:
            rows.append({"item": gname, "kind": "group", "via": pkg_groups[gid], "class": "package-managed", "review": False})
        else:
            rows.append({"item": gname, "kind": "group", "via": "direct or nested assignment", "class": "outside packages: review", "review": True})
    rows.sort(key=lambda r: (not r["review"], r["kind"], r["item"]))
    out = [finding("RV-01", "Warn", f"{mover['userId']}:{r['item']}", f"{mover['userPrincipalName']}: {r['item']}",
                   f"{r['class']} ({r['via']})") for r in rows if r["review"]]
    done = parse_time(mover.get("reviewCompletedDateTime"))
    now = parse_time(as_of)
    interval = hours(eff, done) if done else None
    if done is None and (now - eff).days >= REVIEW_DAYS:
        out.append(finding("RV-02", "Finding", mover["userId"], mover["userPrincipalName"],
                           f"residual review still open {(now - eff).days} days after the move (program target {REVIEW_DAYS})"))
    summary = {"metric": "transfer-to-review interval", "userId": mover["userId"], "effective": iso(eff),
               "reviewCompleted": iso(done) if done else None, "hours": interval,
               "toReview": sum(1 for r in rows if r["review"]), "items": len(rows)}
    return rows, summary, sort_findings(out)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    li = sub.add_parser("lint", help="lint the assignment policy files (AA-01 to AA-09)")
    li.add_argument("folder", type=Path)
    li.add_argument("--population", type=Path, required=True, help="users with their coded attributes, to test overlap and scope")
    ms = sub.add_parser("memberof-scan", help="find memberOf rules in an assignmentPolicies export")
    ms.add_argument("--policies", type=Path, required=True)
    rv = sub.add_parser("residual", help="list what a move leaves behind for the residual review")
    rv.add_argument("--mover", type=Path, required=True)
    rv.add_argument("--assignments", type=Path, required=True)
    rv.add_argument("--memberships", type=Path, required=True)
    rv.add_argument("--policies", type=Path, required=True)
    rv.add_argument("--as-of", required=True)
    rv.add_argument("--cloud", required=True)
    rv.add_argument("--tenant-id", default="contoso-fixture")
    rv.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "lint":
            defs = load_dir(args.folder)
            rows = lint(defs, values(read_json(args.population)))
            print(f"Policies: {len(defs)} files")
            print(summary_line("Lint", rows))
            for r in rows:
                print(f"  {r['Rule']} {r['Severity']}: {r['Object']}: {r['Issue']}")
            return exit_code(rows)
        if args.cmd == "memberof-scan":
            pols = values(read_json(args.policies))
            rows = memberof_scan(pols)
            print(f"Assignment policies read: {len(pols)}; using memberOf: {len(rows)}")
            for r in rows:
                print(f"  {r['Rule']} {r['Severity']}: {r['Object']}")
            return exit_code(rows)
        cl = cloud(args.cloud)
        mover = read_json(args.mover)
        rows, summary, found = residual(mover, values(read_json(args.assignments)), values(read_json(args.memberships)),
                                        load_dir(args.policies), args.as_of)
        write_output(args.out, "access-residual", {
            "residual.json": rows, "residual-review.csv": csv_text([r for r in rows if r["review"]], ["item", "kind", "via", "class"]),
            "summary.json": summary, "findings.json": found,
        }, {"tool": "access_assignment.py", "cloud": cl["name"], "tenantId": args.tenant_id, "asOf": args.as_of})
        print(f"Mover {mover['userPrincipalName']}: {summary['items']} items held, {summary['toReview']} to the residual review")
        print(summary_line("Residual", found))
        print(f"Written to {args.out.as_posix()} (residual-review.csv goes to the manager of record)")
        return exit_code(found)
    except (HrlcError, OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
