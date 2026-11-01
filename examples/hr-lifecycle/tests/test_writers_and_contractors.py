"""Chapters 01 and 02: the writer register and its audit scan; the contractor source, its reconciliation
and the sponsor review.

    python -m pytest tests -q
"""
import copy
import csv
import datetime as dt
import json
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
FIX = KIT / "tests" / "fixtures"
sys.path.insert(0, str(KIT / "python"))
import contractor_source as cs  # noqa: E402
import hrlc_core as core  # noqa: E402
import writer_register as wr  # noqa: E402

REG = wr.load_register(KIT / "config" / "writer-register.json")
AUDITS = core.values(core.read_json(FIX / "ch01" / "directory-audits.json"))


def rules(rows):
    return sorted((r["Rule"], r["Severity"]) for r in rows)


# ---------------------------------------------------------------- Chapter 01

def test_the_shipped_register_is_clean():
    assert wr.check_register(REG) == []


def test_register_shape_rules():
    bad = copy.deepcopy(REG)
    bad["rows"] = [r for r in bad["rows"] if r["id"] != "reenabled-on-cancel"]
    bad["rows"][0]["writer"] = ["inbound-provisioning", "lifecycle-workflows"]
    next(r for r in bad["rows"] if r["id"] == "deleted-at-disposition")["writer"] = "inbound-provisioning"
    bad["rows"][5]["backstop"] = "nobody"
    bad["rows"][6]["backstop"] = bad["rows"][6]["writer"]
    bad["writers"]["ad-sync"]["servicePrincipalIds"] = []
    del bad["signedOn"]
    got = {r["Rule"] for r in wr.check_register(bad)}
    assert got >= {"WR-01", "WR-02", "WR-03", "WR-04", "WR-05", "WR-06", "WR-08"}


def test_rows_for_one_audited_change_must_agree_on_the_writer():
    bad = copy.deepcopy(REG)
    for r in bad["rows"]:
        if r["id"] == "reenabled-on-cancel":
            r["writer"] = "lifecycle-workflows"
            r["backstop"] = "inbound-provisioning"
    assert "WR-07" in {r["Rule"] for r in wr.check_register(bad)}


def test_scan_finds_second_writers_and_the_forbidden_delete():
    writes, rows = wr.scan(REG, AUDITS, "2026-10-01", "2026-10-31")
    assert rules(rows) == [("WS-01", "Finding")] * 4 + [("WS-02", "Warn"), ("WS-04", "Finding")]
    who = {r["Object"] for r in rows if r["Rule"] == "WS-01"}
    assert who == {"casey.ng@contoso.example", "morgan.lee@contoso.example", "drew.park@contoso.example", "quinn.ross@contoso.example"}


def test_scan_ignores_failures_unprotected_changes_and_the_window():
    writes, _ = wr.scan(REG, AUDITS, "2026-10-01", "2026-10-31")
    ids = {w["auditId"] for w in writes}
    assert "Directory_0013" not in ids      # result failure
    assert "Directory_0012" not in ids      # Department and JobTitle aren't protected here
    assert "Directory_0014" not in ids      # November, outside the window
    assert len(writes) == 11


def test_one_enable_record_counts_once():
    writes, _ = wr.scan(REG, AUDITS, "2026-10-01", "2026-10-31")
    assert sum(1 for w in writes if w["auditId"] == "Directory_0002") == 1


def test_scan_window_must_run_forward():
    with pytest.raises(core.HrlcError):
        wr.scan(REG, AUDITS, "2026-10-31", "2026-10-01")


def test_saved_queries_use_the_filters_learn_lists():
    q = wr.saved_queries(REG, "2026-10-01", "2026-10-31")
    assert len(q) == len(REG["rows"])
    assert all(" eq '" in x["graphFilter"] and "activityDateTime ge " in x["graphFilter"] for x in q)


def test_scan_cli_writes_findings_writes_and_queries(tmp_path, capsys):
    code = wr.main(["scan", "--register", str(KIT / "config" / "writer-register.json"), "--audit", str(FIX / "ch01" / "directory-audits.json"),
                    "--since", "2026-10-01", "--until", "2026-10-31", "--cloud", "gcc", "--out", str(tmp_path / "o")])
    assert code == core.EXIT_FINDINGS
    man = json.loads((tmp_path / "o" / "manifest.json").read_text())
    assert set(man["files"]) == {"findings.json", "writes.json", "queries.json"} and man["task"] == "writers-scan"
    assert "second writer 4, forbidden 1" in capsys.readouterr().out


# ---------------------------------------------------------------- Chapter 02

def load2():
    rules_ = core.read_json(KIT / "config" / "contractor-rules.json")
    reg = core.read_csv(FIX / "ch02" / "contractor-register.csv")
    cards = {r["PersonKey"]: r for r in core.read_csv(FIX / "ch02" / "cards.csv")}
    spons = {r["PersonNumber"]: r for r in core.read_csv(FIX / "ch02" / "hr-sponsors.csv")}
    return reg, cards, spons, rules_


def test_earliest_end_takes_the_first_condition():
    reg, cards, spons, rules_ = load2()
    by = {r["PersonKey"]: r for r in reg}
    want = {"900001": ("2027-01-11", "contract end"), "900002": ("2026-10-15", "completion date"),
            "900003": ("2026-10-20", "suitability withdrawn"), "900004": ("2026-10-30", "sponsor gone past the grace period"),
            "900005": ("2026-10-25", "sponsor recertification due")}
    for key, (date, reason) in want.items():
        end, why, _ = cs.earliest_end(by[key], cards, spons, rules_)
        assert (end.isoformat(), why) == (date, reason), key


def test_an_expired_card_ends_the_engagement():
    reg, cards, spons, rules_ = load2()
    row = dict(next(r for r in reg if r["PersonKey"] == "900005"), SponsorRecertDue="2027-06-01")
    end, why, _ = cs.earliest_end(row, cards, spons, rules_)
    assert (end.isoformat(), why) == ("2026-10-28", "card expired")


def test_no_end_date_or_no_sponsor_is_quarantined():
    reg, cards, spons, rules_ = load2()
    decisions, rows = cs.decide(reg, cards, spons, rules_, dt.date(2026, 11, 1))
    q = {d["PersonKey"] for d in decisions if d["Action"] == "quarantine"}
    assert q == {"900007", "900008"}
    assert rules(rows) == [("CS-01", "Finding"), ("CS-02", "Finding"), ("CS-03", "Warn"), ("CS-04", "Info")]


def test_extract_matches_the_hcm_entra_layout_and_marks_past_ends_inactive():
    reg, cards, spons, rules_ = load2()
    decisions, _ = cs.decide(reg, cards, spons, rules_, dt.date(2026, 11, 1))
    rows = cs.extract_rows(reg, decisions, spons, rules_)
    with open(KIT.parent / "hcm-entra" / "tests" / "fixtures" / "hcm_extract_sample.csv", encoding="utf-8") as f:
        assert next(csv.reader(f)) == cs.EXTRACT_FIELDS
    by = {r["PersonNumber"]: r for r in rows}
    assert by["900002"]["AssignmentStatusType"] == "INACTIVE" and by["900002"]["TerminationDate"] == "2026-10-15"
    assert by["900001"]["AssignmentStatusType"] == "ACTIVE" and by["900001"]["ManagerPersonNumber"] == "100001"
    assert all(r["WorkerType"] == "C" and r["TerminationDate"] for r in rows)
    assert "900007" not in by and "900008" not in by


def test_reconcile_finds_every_class():
    reg, cards, spons, rules_ = load2()
    decisions, _ = cs.decide(reg, cards, spons, rules_, dt.date(2026, 11, 1))
    accts = core.values(core.read_json(FIX / "ch02" / "contractor-users.json"))
    got = rules(cs.reconcile(reg, decisions, cards, accts))
    assert got == [("CR-01", "Finding")] * 4 + [("CR-02", "Finding"), ("CR-03", "Finding"), ("CR-04", "Warn"), ("CR-05", "Finding")]


def test_review_settings_remove_access_when_no_one_responds():
    r = cs.review_settings(core.read_json(KIT / "config" / "contractor-rules.json"))["reviewSettings"]
    assert r["expirationBehavior"] == "removeAccess" and r["isEnabled"] is True
    assert r["primaryReviewers"][0]["@odata.type"] == "#microsoft.graph.requestorManager"
    assert r["fallbackReviewers"] and r["schedule"]["recurrence"]["pattern"]["interval"] == 6


def test_duplicate_person_keys_are_refused(tmp_path):
    src = (FIX / "ch02" / "contractor-register.csv").read_text(encoding="utf-8").splitlines()
    (tmp_path / "r.csv").write_text("\n".join(src + [src[1]]) + "\n", encoding="utf-8")
    code = cs.main(["extract", "--register", str(tmp_path / "r.csv"), "--cards", str(FIX / "ch02" / "cards.csv"),
                    "--sponsors", str(FIX / "ch02" / "hr-sponsors.csv"), "--rules", str(KIT / "config" / "contractor-rules.json"),
                    "--as-of", "2026-11-01", "--out", str(tmp_path / "o")])
    assert code == core.EXIT_ERROR
