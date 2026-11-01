"""The account-state writer register as code: check the register, then scan the directory audit log for
second writers of every protected transition and value, and write the saved audit queries.

Gate 1 of the HR-driven identity implementation guide. The register (config/writer-register.json) names
one writer and an optional backstop for each account-state transition (created, enabled, disabled,
re-enabled, deleted) and each HR-mastered value. The scan reads a directoryAudits export (graph_export.py
--task writers-scan) and reports any protected write by an identity that is neither, which is the
unauthorized-write drift class of Book 03, Chapter 11.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/writer_register.py check --register config/writer-register.json
    python python/writer_register.py scan --register config/writer-register.json --audit tests/fixtures/ch01/directory-audits.json --since 2026-10-01 --until 2026-10-31 --cloud gcc --out out/ch01

Exit codes: 0 clean, 2 findings or warnings, 1 error.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, cloud, exit_code, finding, iso, parse_time, read_json, sort_findings,
    summary_line, values, write_output,
)

REQUIRED_TRANSITIONS = ("account-created", "enabled-at-hire", "disabled-at-separation", "reenabled-on-cancel",
                        "deleted-at-disposition")


def load_register(path: Path) -> dict[str, Any]:
    reg = read_json(path)
    for key in ("writers", "rows"):
        if key not in reg:
            raise HrlcError(f"{path}: no {key!r}")
    return reg


def check_register(reg: dict[str, Any]) -> list[dict[str, Any]]:
    """WR-01 to WR-09: the register's own shape."""
    out: list[dict[str, Any]] = []
    writers = reg["writers"]
    ids = [r.get("id", "") for r in reg["rows"]]
    for r in reg["rows"]:
        rid = r.get("id", "?")
        w = r.get("writer")
        if not isinstance(w, str) or not w:
            out.append(finding("WR-01", "Finding", rid, rid, "row has no single named writer (a list or nothing)"))
            continue
        for role in ("writer", "backstop"):
            name = r.get(role)
            if name and name not in writers:
                out.append(finding("WR-02", "Finding", f"{rid}:{role}", rid, f"{role} {name!r} isn't defined under 'writers'"))
        if r.get("backstop") and r.get("backstop") == w:
            out.append(finding("WR-06", "Finding", rid, rid, "the backstop is the writer itself"))
        if rid == "deleted-at-disposition" and w == "inbound-provisioning":
            out.append(finding("WR-05", "Finding", rid, rid, "deletion written by inbound provisioning; delete only through the post-separation workflow, never /bulkUpload"))
    for name, wdef in writers.items():
        if not wdef.get("servicePrincipalIds") and not wdef.get("userIds"):
            out.append(finding("WR-03", "Warn", name, name, "writer has no identities, so the scan can't attribute its writes"))
    for t in REQUIRED_TRANSITIONS:
        if t not in ids:
            out.append(finding("WR-04", "Finding", t, t, "required account-state transition has no row"))
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    for d in dupes:
        out.append(finding("WR-01", "Finding", f"{d}:duplicate", d, "row appears more than once; one writer per value"))
    by_activity: dict[tuple[str, str], set[str]] = {}
    for r in reg["rows"]:
        if isinstance(r.get("writer"), str):
            by_activity.setdefault((r.get("activity", ""), r.get("auditProperty", "")), set()).add(r["writer"])
    for (act, prop), ws in sorted(by_activity.items()):
        if len(ws) > 1:
            key = f"{act}:{prop}" if prop else act
            out.append(finding("WR-07", "Finding", key, key, f"rows for the same audited change name different writers: {', '.join(sorted(ws))}"))
    if not reg.get("signedBy") or not reg.get("signedOn"):
        out.append(finding("WR-08", "Warn", "register", reg.get("register", "register"), "register isn't recorded as signed (signedBy, signedOn)"))
    if not (reg.get("scopeFilter") or {}).get("version"):
        out.append(finding("WR-09", "Warn", "scopeFilter", "scope filter", "the scope filter has no version"))
    return sort_findings(out)


def _initiator(rec: dict[str, Any]) -> tuple[str, str]:
    by = rec.get("initiatedBy") or {}
    app, user = by.get("app") or {}, by.get("user") or {}
    if app.get("servicePrincipalId"):
        return app["servicePrincipalId"].lower(), app.get("displayName") or app["servicePrincipalId"]
    if user.get("id"):
        return user["id"].lower(), user.get("userPrincipalName") or user["id"]
    return "", "(unknown initiator)"


def _target(rec: dict[str, Any]) -> dict[str, Any]:
    for t in rec.get("targetResources") or []:
        if str(t.get("type", t.get("Type", ""))).lower() == "user":
            return t
    return {}


def _changed(target: dict[str, Any]) -> set[str]:
    return {str(p.get("displayName", "")).lower() for p in target.get("modifiedProperties") or []}


def scan(reg: dict[str, Any], audits: list[dict[str, Any]], since: str, until: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Every protected write in the window, with a verdict, and the findings WS-01 to WS-04."""
    t0, t1 = parse_time(since), parse_time(until)
    if t1 <= t0:
        raise HrlcError("--until is before --since")
    owner: dict[str, str] = {}
    for name, wdef in reg["writers"].items():
        for i in list(wdef.get("servicePrincipalIds") or []) + list(wdef.get("userIds") or []):
            owner[i.lower()] = name
    writes, out = [], []
    for rec in audits:
        when = parse_time(rec.get("activityDateTime"))
        if when is None or not (t0 <= when <= t1) or str(rec.get("result", "")).lower() != "success":
            continue
        target = _target(rec)
        if not target:
            continue
        changed = _changed(target)
        same = [r for r in reg["rows"] if r.get("activity") == rec.get("activityDisplayName")]
        matched = [r for r in same if r.get("auditProperty") and r["auditProperty"].lower() in changed]
        # Rows audited by the activity alone (enable, disable, delete, manager) share one record: the
        # first such row takes it, so a re-enable and an enable at hire aren't counted twice.
        matched += [r for r in same if not r.get("auditProperty")][:1]
        for row in matched:
            init_id, init_name = _initiator(rec)
            group = owner.get(init_id, "")
            if group and group in (row.get("forbidden") or []):
                verdict = "forbidden"
            elif group == row["writer"]:
                verdict = "writer"
            elif group and group == row.get("backstop"):
                verdict = "backstop"
            else:
                verdict = "second-writer"
            tid, tname = target.get("id", ""), target.get("userPrincipalName") or target.get("id", "")
            writes.append({"time": iso(when), "activity": rec.get("activityDisplayName"), "row": row["id"],
                           "initiatorId": init_id, "initiator": init_name, "writerGroup": group or "(none)",
                           "targetId": tid, "target": tname, "verdict": verdict, "auditId": rec.get("id", "")})
            key = f"{row['id']}:{init_id or 'unknown'}:{tid}"
            if verdict == "second-writer":
                out.append(finding("WS-01", "Finding", key, tname, f"{row['id']} written by {init_name}, not by {row['writer']}", Time=iso(when)))
            elif verdict == "forbidden":
                out.append(finding("WS-04", "Finding", key, tname, f"{row['id']} written by {group}, which the register forbids", Time=iso(when)))
            elif verdict == "backstop":
                out.append(finding("WS-02", "Warn", key, tname, f"{row['id']} written by the backstop ({group}); confirm the writer ({row['writer']}) acted or was late", Time=iso(when)))
    writes.sort(key=lambda w: (w["time"], w["row"]))
    return writes, sort_findings(out)


def saved_queries(reg: dict[str, Any], since: str, until: str) -> list[dict[str, Any]]:
    """The Gate 1 audit query for each protected value, as a directoryAudits $filter (Learn lists eq, ge,
    le and startswith for this API). Gate 7 runs them; the scan applies the writer test to the result."""
    out = []
    for row in reg["rows"]:
        f = f"activityDateTime ge {since}T00:00:00Z and activityDateTime le {until}T23:59:59Z and activityDisplayName eq '{row['activity']}'"
        out.append({"row": row["id"], "graphFilter": f, "matchProperty": row.get("auditProperty"),
                    "allowed": [x for x in (row["writer"], row.get("backstop")) if x]})
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="check the register's shape (WR-01 to WR-09)")
    c.add_argument("--register", type=Path, required=True)
    s = sub.add_parser("scan", help="scan a directoryAudits export for second writers (WS-01 to WS-04)")
    s.add_argument("--register", type=Path, required=True)
    s.add_argument("--audit", type=Path, required=True, help="directory-audits.json from graph_export.py --task writers-scan")
    s.add_argument("--since", required=True)
    s.add_argument("--until", required=True)
    s.add_argument("--cloud", required=True)
    s.add_argument("--tenant-id", default="contoso-fixture")
    s.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        reg = load_register(args.register)
        reg_findings = check_register(reg)
        if args.cmd == "check":
            print(summary_line("Register", reg_findings))
            for r in reg_findings:
                print(f"  {r['Rule']} {r['Severity']}: {r['Object']}: {r['Issue']}")
            return exit_code(reg_findings)
        cl = cloud(args.cloud)
        writes, scan_findings = scan(reg, values(read_json(args.audit)), args.since, args.until)
        rows = sort_findings(reg_findings + scan_findings)
        write_output(args.out, "writers-scan", {
            "findings.json": rows, "writes.json": writes, "queries.json": saved_queries(reg, args.since, args.until),
        }, {"tool": "writer_register.py", "cloud": cl["name"], "tenantId": args.tenant_id,
            "window": {"since": args.since, "until": args.until}, "register": {"version": reg.get("version"), "signedOn": reg.get("signedOn")}})
        verdicts = {v: sum(1 for w in writes if w["verdict"] == v) for v in ("writer", "backstop", "second-writer", "forbidden")}
        print(f"Protected writes: {len(writes)} (writer {verdicts['writer']}, backstop {verdicts['backstop']}, "
              f"second writer {verdicts['second-writer']}, forbidden {verdicts['forbidden']})")
        print(summary_line("Writers", rows))
        print(f"Written to {args.out.as_posix()} (manifest.json lists every file's SHA-256)")
        return exit_code(rows)
    except (HrlcError, OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
