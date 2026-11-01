"""Contractor source sync with enforced end dates: compute each contractor's earliest end, write the
records as an extract the HR middleware sends through API-driven inbound provisioning, reconcile the
contractor register, the card system and the directory read-only, and build the sponsor review.

Gate 2 of the HR-driven identity implementation guide. Contractors aren't in the HR system, so they
come from an agency-owned register through their own API-driven provisioning app and the same
middleware (examples/hcm-entra). This tool doesn't send anything: `extract` writes a CSV in the column
layout examples/hcm-entra/python/hcm_to_scim.py reads, and that tool builds and sends the SCIM bulk
requests. Every record carries its earliest end as the leave date, and a record past it is sent with
the inactive status, so the leaver blocks first.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/contractor_source.py extract --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv --sponsors tests/fixtures/ch02/hr-sponsors.csv --rules config/contractor-rules.json --as-of 2026-11-01 --out out/ch02/extract
    python python/contractor_source.py reconcile --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv --sponsors tests/fixtures/ch02/hr-sponsors.csv --accounts tests/fixtures/ch02/contractor-users.json --rules config/contractor-rules.json --as-of 2026-11-01 --cloud gcc --out out/ch02/reconcile
    python python/contractor_source.py review --rules config/contractor-rules.json --out out/ch02/review

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
    EXIT_ERROR, EXIT_OK, HrlcError, cloud, csv_text, exit_code, finding, parse_time, read_csv, read_json,
    sort_findings, summary_line, values, write_output,
)

# The column layout examples/hcm-entra/python/hcm_to_scim.py reads (its tests/fixtures/hcm_extract_sample.csv).
EXTRACT_FIELDS = ["PersonNumber", "AssignmentStatusType", "WorkerType", "FirstName", "LastName", "DisplayName", "JobName",
                  "JobCode", "DepartmentName", "DepartmentCode", "BusinessUnit", "CostCenter", "LegalEmployer",
                  "ManagerPersonNumber", "PositionCategory", "WorkCountry", "HireDate", "TerminationDate", "UtcOffset", "UserName"]


def _date(value: str) -> dt.date | None:
    t = parse_time(value)
    return t.date() if t else None


def earliest_end(row: dict[str, str], cards: dict[str, dict[str, str]], sponsors: dict[str, dict[str, str]],
                 rules: dict[str, Any]) -> tuple[dt.date | None, str, list[tuple[str, dt.date]]]:
    """The first of the end conditions (Book 03, Appendix A, Contractor leavers), the reason, and all candidates."""
    cands: list[tuple[str, dt.date]] = []
    if _date(row.get("ContractEnd", "")):
        cands.append(("contract end", _date(row["ContractEnd"])))
    if _date(row.get("CompletionDate", "")):
        cands.append(("completion date", _date(row["CompletionDate"])))
    if row.get("SuitabilityStatus", "").lower() == "withdrawn":
        cands.append(("suitability withdrawn", _date(row.get("SuitabilityWithdrawnDate", "")) or dt.date.min))
    card = cards.get(row["PersonKey"])
    if card and card.get("CardStatus") in rules["cardStatusesThatEnd"]:
        cands.append((f"card {card['CardStatus'].lower()}", _date(card.get("StatusDate", "")) or dt.date.min))
    sponsor = sponsors.get(row.get("SponsorPersonNumber", ""))
    if sponsor and sponsor.get("AssignmentStatusType") == "INACTIVE" and _date(sponsor.get("TerminationDate", "")):
        cands.append(("sponsor gone past the grace period",
                      _date(sponsor["TerminationDate"]) + dt.timedelta(days=int(rules["sponsorGraceDays"]))))
    if _date(row.get("SponsorRecertDue", "")):
        cands.append(("sponsor recertification due", _date(row["SponsorRecertDue"])))
    if not any(r == "contract end" for r, _ in cands):
        return None, "no contract end", cands
    reason, when = min(cands, key=lambda c: (c[1], c[0]))
    return when, reason, cands


def decide(register: list[dict[str, str]], cards: dict[str, dict[str, str]], sponsors: dict[str, dict[str, str]],
           rules: dict[str, Any], as_of: dt.date) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """One decision per register row, and the CS findings."""
    decisions, out = [], []
    for row in register:
        key, name = row["PersonKey"], row.get("UserName") or row["PersonKey"]
        end, reason, cands = earliest_end(row, cards, sponsors, rules)
        sponsor = sponsors.get(row.get("SponsorPersonNumber", ""))
        d = {"PersonKey": key, "UserName": name, "EarliestEnd": end.isoformat() if end else "", "Reason": reason,
             "Candidates": [{"condition": r, "date": w.isoformat() if w != dt.date.min else "unknown"} for r, w in cands]}
        if end is None:
            d["Action"] = "quarantine"
            out.append(finding("CS-01", "Finding", key, name, "no contract end date; a contractor is never provisioned open-ended"))
        elif sponsor is None:
            d["Action"] = "quarantine"
            out.append(finding("CS-02", "Finding", key, name, f"sponsor {row.get('SponsorPersonNumber') or '(none)'} isn't in the HR export; no manager, no account"))
        else:
            d["Action"] = "inactive" if end <= as_of else "active"
            if reason == "sponsor gone past the grace period":
                out.append(finding("CS-03", "Warn", key, name, f"sponsor separated; access ends {end.isoformat()} unless a new sponsor is recorded"))
            if d["Action"] == "active" and (end - as_of).days <= int(rules["upcomingDays"]):
                out.append(finding("CS-04", "Info", key, name, f"engagement ends {end.isoformat()} ({reason})"))
        decisions.append(d)
    return decisions, sort_findings(out)


def extract_rows(register: list[dict[str, str]], decisions: list[dict[str, Any]], sponsors: dict[str, dict[str, str]],
                 rules: dict[str, Any]) -> list[dict[str, str]]:
    """Rows in the hcm-entra extract layout: worker type C (the mapping's contractor code), the sponsor as
    manager, organization from the sponsor, the vendor as legal employer, and the earliest end as the
    termination date. Quarantined records aren't written."""
    by_key = {r["PersonKey"]: r for r in register}
    out = []
    for d in decisions:
        if d["Action"] == "quarantine":
            continue
        r = by_key[d["PersonKey"]]
        s = sponsors[r["SponsorPersonNumber"]]
        out.append({
            "PersonNumber": r["PersonKey"], "AssignmentStatusType": "INACTIVE" if d["Action"] == "inactive" else "ACTIVE",
            "WorkerType": rules["workerTypeCode"], "FirstName": r["FirstName"], "LastName": r["LastName"],
            "DisplayName": f"{r['FirstName']} {r['LastName']}", "JobName": "Contractor", "JobCode": r.get("ContractRef", ""),
            "DepartmentName": s.get("DepartmentName", ""), "DepartmentCode": s.get("DepartmentCode", ""), "BusinessUnit": "",
            "CostCenter": "", "LegalEmployer": r.get(rules["legalEmployerColumn"], ""), "ManagerPersonNumber": r["SponsorPersonNumber"],
            "PositionCategory": "", "WorkCountry": "US", "HireDate": r.get("StartDate", ""), "TerminationDate": d["EarliestEnd"],
            "UtcOffset": "", "UserName": r.get("UserName", ""),
        })
    return out


def reconcile(register: list[dict[str, str]], decisions: list[dict[str, Any]], cards: dict[str, dict[str, str]],
              accounts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """CR-01 to CR-05: read only, joined on the enterprise person key (employeeId)."""
    out = []
    by_key = {d["PersonKey"]: d for d in decisions}
    reg_keys = {r["PersonKey"] for r in register}
    acct_by_key = {str(a.get("employeeId") or ""): a for a in accounts if a.get("employeeId")}
    for a in accounts:
        key, upn = str(a.get("employeeId") or ""), a.get("userPrincipalName", a.get("id", ""))
        if not a.get("accountEnabled"):
            continue
        if not key or key not in reg_keys:
            out.append(finding("CR-02", "Finding", a.get("id", upn), upn, "enabled contractor account with no register record (orphan)"))
            continue
        d = by_key[key]
        if d["Action"] == "inactive":
            out.append(finding("CR-01", "Finding", key, upn, f"enabled past its earliest end {d['EarliestEnd']} ({d['Reason']})"))
        elif d["Action"] == "active":
            leave = parse_time(a.get("employeeLeaveDateTime"))
            if leave is None or leave.date() != dt.date.fromisoformat(d["EarliestEnd"]):
                out.append(finding("CR-05", "Finding", key, upn, f"employeeLeaveDateTime {leave.date().isoformat() if leave else '(none)'} isn't the earliest end {d['EarliestEnd']}; the leaver workflow fires on the wrong day"))
    for key, card in sorted(cards.items()):
        if card.get("CardStatus") == "Active" and key not in reg_keys:
            out.append(finding("CR-03", "Finding", key, key, "active card for a person the contractor source doesn't hold (contractor credential drift)"))
    for d in decisions:
        if d["Action"] == "active" and d["PersonKey"] not in acct_by_key:
            out.append(finding("CR-04", "Warn", d["PersonKey"], d["UserName"], "active register record with no account"))
    return sort_findings(out)


def review_settings(rules: dict[str, Any]) -> dict[str, Any]:
    """The reviewSettings for the contractor package's assignment policy (accessPackageAssignmentReviewSettings,
    v1.0): bi-annual, the requestor's manager (the sponsor) as reviewer, a named fallback, remove access on no
    response. Learn documents requestorManager for approvals; that it works as a reviewer here is confirmed in Lab 2."""
    r = rules["review"]
    return {
        "reviewSettings": {
            "isEnabled": True,
            "expirationBehavior": r["expirationBehavior"],
            "isRecommendationEnabled": True,
            "isReviewerJustificationRequired": True,
            "isSelfReview": False,
            "primaryReviewers": [{"@odata.type": "#microsoft.graph.requestorManager", "managerLevel": 1}],
            "fallbackReviewers": [{"@odata.type": "#microsoft.graph.singleUser", "userId": r["fallbackReviewerUserId"]}],
            "schedule": {
                "startDateTime": r["startDateTime"],
                "expiration": {"type": "afterDuration", "duration": f"P{int(r['durationDays'])}D"},
                "recurrence": {"pattern": {"type": "absoluteMonthly", "interval": int(r["intervalMonths"]), "month": 0,
                                           "dayOfMonth": 0, "daysOfWeek": []},
                               "range": {"type": "noEnd", "numberOfOccurrences": 0}},
            },
        },
        "_target": {"accessPackageId": r["accessPackageId"], "apply": "merge into the contractor package's assignment policy and send the whole policy with Set-MgEntitlementManagementAssignmentPolicy after review"},
    }


def _load(args: argparse.Namespace) -> tuple[list[dict[str, str]], dict[str, dict[str, str]], dict[str, dict[str, str]], dict[str, Any]]:
    rules = read_json(args.rules)
    register = read_csv(args.register)
    keys = [r["PersonKey"] for r in register]
    if len(keys) != len(set(keys)):
        raise HrlcError("the register holds a person key twice; fix the source first")
    cards = {r["PersonKey"]: r for r in read_csv(args.cards)}
    sponsors = {r["PersonNumber"]: r for r in read_csv(args.sponsors)}
    return register, cards, sponsors, rules


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("extract", "reconcile"):
        p = sub.add_parser(name)
        p.add_argument("--register", type=Path, required=True)
        p.add_argument("--cards", type=Path, required=True)
        p.add_argument("--sponsors", type=Path, required=True)
        p.add_argument("--rules", type=Path, required=True)
        p.add_argument("--as-of", required=True)
        p.add_argument("--out", type=Path, required=True)
        if name == "reconcile":
            p.add_argument("--accounts", type=Path, required=True, help="contractor-users.json from graph_export.py --task contractor-reconcile")
            p.add_argument("--cloud", required=True)
            p.add_argument("--tenant-id", default="contoso-fixture")
    r = sub.add_parser("review")
    r.add_argument("--rules", type=Path, required=True)
    r.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "review":
            write_output(args.out, "contractor-review", {"assignment-policy-review.json": review_settings(read_json(args.rules))},
                         {"tool": "contractor_source.py"})
            print(f"Review settings written to {args.out.as_posix()}/assignment-policy-review.json for review; nothing was sent")
            return EXIT_OK
        register, cards, sponsors, rules = _load(args)
        as_of = dt.date.fromisoformat(args.as_of)
        decisions, rows = decide(register, cards, sponsors, rules, as_of)
        if args.cmd == "extract":
            ext = extract_rows(register, decisions, sponsors, rules)
            write_output(args.out, "contractor-extract", {"contractors-extract.csv": csv_text(ext, EXTRACT_FIELDS),
                                                         "decisions.json": decisions, "findings.json": rows},
                         {"tool": "contractor_source.py", "asOf": args.as_of, "extract": "contractors-extract.csv"})
            act = sum(1 for d in decisions if d["Action"] == "active")
            ina = sum(1 for d in decisions if d["Action"] == "inactive")
            q = sum(1 for d in decisions if d["Action"] == "quarantine")
            print(f"Contractors: {len(decisions)} records: {act} active, {ina} inactive (past their earliest end), {q} quarantined")
            print(summary_line("Source", rows))
            print(f"Extract written to {args.out.as_posix()}/contractors-extract.csv; build the SCIM requests with examples/hcm-entra/python/hcm_to_scim.py")
            return exit_code(rows)
        cl = cloud(args.cloud)
        rec = reconcile(register, decisions, cards, values(read_json(args.accounts)))
        write_output(args.out, "contractor-reconcile", {"decisions.json": decisions, "findings.json": rec},
                     {"tool": "contractor_source.py", "asOf": args.as_of, "cloud": cl["name"], "tenantId": args.tenant_id})
        print(summary_line("Reconciliation", rec))
        print(f"Written to {args.out.as_posix()} (manifest.json lists every file's SHA-256)")
        return exit_code(rec)
    except (HrlcError, OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
