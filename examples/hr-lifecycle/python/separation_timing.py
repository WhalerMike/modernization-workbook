"""Separation timing from the logs: for every leaver, the separation-to-block and separation-to-revocation
intervals, the late separations the scheduled trigger skipped, the uncollected cards past 18 hours,
re-enables after a disable, failed leaver runs and deletes before device retirement.

Gate 6 of the HR-driven identity implementation guide, and the first two metrics of Book 03, Chapter 11.
The block is the moment both the disable and the session revocation are in the directory audit log
('Disable account' and 'Update StsRefreshTokenValidFrom Timestamp', from Learn's audit activity list);
the revocation is the last of the block, the card system's revocation and the device actions. The leaver
workflow's order is Book 19, Chapter 05's check (examples/lifecycle-extensions check-workflow); this tool
measures what the order produced.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/separation_timing.py measure --separations tests/fixtures/ch06/hr-separations.csv --users tests/fixtures/ch06/leaver-users.json --audits tests/fixtures/ch06/separation-audits.json --results tests/fixtures/ch06/leaver-results.json --cards tests/fixtures/ch06/card-revocations.csv --devices tests/fixtures/ch06/device-actions.csv --role-holders tests/fixtures/ch06/role-holders.csv --config config/separation.json --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch06

Exit codes: 0 clean, 2 findings or warnings, 1 error.
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, cloud, csv_text, exit_code, finding, hours, iso, parse_time, read_csv, read_json,
    sort_findings, summary_line, values, write_output,
)


def _events(audits: list[dict[str, Any]]) -> dict[str, list[tuple[dt.datetime, str, str]]]:
    """Successful user events by target user ID: (time, activity, initiator)."""
    out: dict[str, list[tuple[dt.datetime, str, str]]] = {}
    for a in audits:
        if str(a.get("result", "")).lower() != "success":
            continue
        by = a.get("initiatedBy") or {}
        who = ((by.get("app") or {}).get("displayName") or (by.get("user") or {}).get("userPrincipalName") or "unknown")
        for t in a.get("targetResources") or []:
            if str(t.get("type", "")).lower() == "user" and t.get("id"):
                out.setdefault(t["id"], []).append((parse_time(a["activityDateTime"]), a.get("activityDisplayName", ""), who))
    for v in out.values():
        v.sort()
    return out


def _pct(xs: list[float], q: float) -> float | None:
    if not xs:
        return None
    xs = sorted(xs)
    k = max(0, min(len(xs) - 1, int(round(q * (len(xs) - 1)))))
    return xs[k]


def measure(seps: list[dict[str, str]], users: list[dict[str, Any]], audits: list[dict[str, Any]], results: list[dict[str, Any]],
            cards: list[dict[str, str]], devices: list[dict[str, str]], role_holders: set[str], cfg: dict[str, Any],
            as_of: str) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    now = parse_time(as_of)
    by_emp = {str(u.get("employeeId") or ""): u for u in users}
    ev = _events(audits)
    res = {}
    for r in results:
        sid = (r.get("subject") or {}).get("id")
        res.setdefault(sid, []).append(r)
    card = {c["PersonNumber"]: c for c in cards}
    dev: dict[str, list[dt.datetime]] = {}
    for d in devices:
        if d.get("CompletedDateTime"):
            dev.setdefault(d["UserId"], []).append(parse_time(d["CompletedDateTime"]))
    rows, out = [], []
    look = dt.timedelta(hours=float(cfg["lookbackHours"]))
    for s in seps:
        emp, eff, entered = s["PersonNumber"], parse_time(s["EffectiveDateTime"]), parse_time(s["EnteredDateTime"])
        if eff is None or eff > now:
            continue
        u = by_emp.get(emp)
        name = (u or {}).get("userPrincipalName", emp)
        if s.get("Cancelled", "").upper() == "Y":
            rows.append({"PersonNumber": emp, "user": name, "effective": iso(eff), "status": "cancelled"})
            continue
        if u is None:
            out.append(finding("ST-02", "Finding", emp, emp, "separated in HR but no account found to measure; reconcile the key"))
            continue
        uid = u["id"]
        mine = [e for e in ev.get(uid, []) if e[0] >= eff - look]
        disable = next((e for e in mine if e[1] == cfg["disableActivity"]), None)
        revoke = next((e for e in mine if e[1] == cfg["sessionRevokeActivity"]), None)
        block = max(disable[0], revoke[0]) if disable and revoke else None
        reenable = next((e for e in mine if disable and e[1] == cfg["enableActivity"] and e[0] > disable[0]), None)
        delete = next((e for e in mine if e[1] == cfg["deleteActivity"]), None)
        c = card.get(emp, {})
        card_t, notice_t = parse_time(c.get("RevokedDateTime")), parse_time(c.get("NoticeDateTime"))
        dev_t = max(dev.get(uid, []), default=None)
        parts = [t for t in (block, card_t, dev_t) if t]
        revoked = max(parts) if block and parts else None
        to_block = hours(eff, block) if block else None
        to_revoke = hours(eff, revoked) if revoked else None
        late_days = (entered - eff).total_seconds() / 86400 if entered else 0
        on_demand = any(r.get("workflowExecutionType") == "onDemand" for r in res.get(uid, []))
        row = {"PersonNumber": emp, "user": name, "effective": iso(eff), "entered": iso(entered), "blocked": iso(block),
               "revoked": iso(revoked), "separationToBlockHours": to_block, "separationToRevocationHours": to_revoke,
               "lateEntryDays": round(late_days, 2), "status": "measured" if block else "not blocked"}
        rows.append(row)
        if block is None:
            missing = [x for x, e in (("disable", disable), ("session revocation", revoke)) if e is None]
            out.append(finding("ST-02", "Finding", emp, name, f"no block recorded: {', '.join(missing)} missing"))
        elif to_block > float(cfg["blockThresholdHours"]):
            out.append(finding("ST-01", "Finding", emp, name, f"separation-to-block {to_block:g} h, over the {cfg['blockThresholdHours']} h threshold"))
        if to_revoke is not None and to_revoke > float(cfg["revocationThresholdHours"]):
            out.append(finding("ST-09", "Finding", emp, name, f"separation-to-revocation {to_revoke:g} h, over the {cfg['revocationThresholdHours']} h threshold"))
        if late_days > float(cfg["catchUpDays"]):
            if on_demand:
                out.append(finding("ST-03", "Warn", emp, name, f"entered {late_days:.1f} days after the effective date; caught by an on-demand run"))
            else:
                out.append(finding("ST-03", "Finding", emp, name, f"entered {late_days:.1f} days after the effective date, past the {cfg['catchUpDays']}-day catch-up window, and no on-demand run"))
        if s.get("CardCollected", "").upper() == "N":
            if card_t is None or notice_t is None:
                out.append(finding("ST-04", "Finding", emp, name, "uncollected card with no revocation or notice time recorded"))
            elif hours(notice_t, card_t) > float(cfg["uncollectedCardHours"]):
                out.append(finding("ST-04", "Finding", emp, name, f"uncollected card revoked {hours(notice_t, card_t):g} h after notice (FIPS 201-3: within 18)"))
        if reenable:
            out.append(finding("ST-05", "Finding", emp, name, f"re-enabled at {iso(reenable[0])} by {reenable[2]} after the disable, with no cancellation in HR"))
        if uid in role_holders:
            out.append(finding("ST-06", "Warn", emp, name, "privileged leaver: the disable task doesn't support users with role assignments; confirm the verified path ran"))
        for r in res.get(uid, []):
            if r.get("processingStatus") == "failed" or int(r.get("failedTasksCount") or 0) > 0:
                out.append(finding("ST-07", "Finding", f"{emp}:{r.get('id')}", name, f"leaver run {r.get('id')} failed ({r.get('failedTasksCount', 0)} task(s)); route to the exception queue"))
        if delete and (dev_t is None or delete[0] < dev_t) and uid in dev:
            out.append(finding("ST-08", "Finding", emp, name, "user deleted before the device retire or wipe completed"))
    b = [r["separationToBlockHours"] for r in rows if r.get("separationToBlockHours") is not None]
    v = [r["separationToRevocationHours"] for r in rows if r.get("separationToRevocationHours") is not None]
    summary = {
        "leavers": sum(1 for r in rows if r["status"] != "cancelled"), "cancelled": sum(1 for r in rows if r["status"] == "cancelled"),
        "missedBlocks": sum(1 for r in rows if r["status"] == "not blocked"),
        "separationToBlockHours": {"p50": _pct(b, 0.5), "p90": _pct(b, 0.9), "max": max(b) if b else None, "threshold": cfg["blockThresholdHours"]},
        "separationToRevocationHours": {"p50": _pct(v, 0.5), "p90": _pct(v, 0.9), "max": max(v) if v else None, "threshold": cfg["revocationThresholdHours"]},
        "asOf": as_of,
    }
    return rows, summary, sort_findings(out)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("measure", help="measure every leaver's intervals (ST-01 to ST-09)")
    m.add_argument("--separations", type=Path, required=True, help="the HR separations: PersonNumber, EffectiveDateTime, EnteredDateTime, Cancelled, CardCollected")
    m.add_argument("--users", type=Path, required=True)
    m.add_argument("--audits", type=Path, required=True, help="separation-audits.json from graph_export.py --task separation-read")
    m.add_argument("--results", type=Path, required=True, help="leaver-results.json (userProcessingResults of the leaver workflow)")
    m.add_argument("--cards", type=Path, required=True, help="the card system's revocations: PersonNumber, NoticeDateTime, RevokedDateTime")
    m.add_argument("--devices", type=Path, required=True, help="Intune device actions: UserId, Action, CompletedDateTime")
    m.add_argument("--role-holders", type=Path, required=True, help="UserId of every privileged role holder (Privileged Access workbook, Chapter 01)")
    m.add_argument("--config", type=Path, required=True)
    m.add_argument("--as-of", required=True)
    m.add_argument("--cloud", required=True)
    m.add_argument("--tenant-id", default="contoso-fixture")
    m.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        cl = cloud(args.cloud)
        cfg = read_json(args.config)
        rows, summary, found = measure(read_csv(args.separations), values(read_json(args.users)), values(read_json(args.audits)),
                                       values(read_json(args.results)), read_csv(args.cards), read_csv(args.devices),
                                       {r["UserId"] for r in read_csv(args.role_holders)}, cfg, args.as_of)
        fields = ["PersonNumber", "user", "effective", "entered", "blocked", "revoked", "separationToBlockHours",
                  "separationToRevocationHours", "lateEntryDays", "status"]
        write_output(args.out, "separation-timing", {"intervals.csv": csv_text(rows, fields), "summary.json": summary, "findings.json": found},
                     {"tool": "separation_timing.py", "cloud": cl["name"], "tenantId": args.tenant_id, "asOf": args.as_of})
        sb, sr = summary["separationToBlockHours"], summary["separationToRevocationHours"]
        print(f"Leavers: {summary['leavers']} separated, {summary['cancelled']} cancelled, {summary['missedBlocks']} not blocked")
        print(f"Separation-to-block hours: p50 {sb['p50']}, p90 {sb['p90']}, max {sb['max']} (threshold {sb['threshold']})")
        print(f"Separation-to-revocation hours: p50 {sr['p50']}, p90 {sr['p90']}, max {sr['max']} (threshold {sr['threshold']})")
        print(summary_line("Separation", found))
        return exit_code(found)
    except (HrlcError, OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
