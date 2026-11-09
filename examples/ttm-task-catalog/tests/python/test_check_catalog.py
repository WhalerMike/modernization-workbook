"""The catalog checker: the seven rules, the drop-down values, and the sample ticket contracts."""

import csv
import io
import json

import pytest

import catalog_schema as cs
import check_catalog as cc
import examples_data
import finding_contract as fc
from conftest import KIT

EXAMPLES = KIT / "examples.csv"


def _good_row(**changes):
    row = dict(next(r for r in examples_data.rows() if r["Task ID"] == "EX-03"))
    row.update(changes)
    return row


def _flags(row):
    return {key for key, flagged in cs.check_row(row).items() if flagged}


def _write(tmp_path, rows, headers=None):
    path = tmp_path / "catalog.csv"
    with open(path, "w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers or cs.HEADERS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    return path


def test_examples_pass_except_the_practice_rows():
    out = io.StringIO()
    code = cc.main([str(EXAMPLES)], out=out)
    text = out.getvalue()
    assert code == 1
    results = cc.check(cc.read_catalog(EXAMPLES))
    failing = {r["task_id"] for r in results if r["flags"] or r["errors"]}
    assert failing == examples_data.PRACTICE_IDS
    assert "25 rows: 22 PASS, 3 FIX; 17 sample payloads, 17 accepted by finding_contract" in text


def test_practice_rows_fail_the_rules_they_are_meant_to():
    by_id = {r["Task ID"]: r for r in examples_data.rows()}
    assert _flags(by_id["EX-P1"]) == {"human_to_machine", "no_evidence"}
    assert _flags(by_id["EX-P2"]) == {"owner_approver_reread", "severity_note", "no_control"}
    assert _flags(by_id["EX-P3"]) == {"high_impact_no_human", "ai_agent"}


def test_every_task_type_the_owner_named_has_an_example_and_a_controls_row():
    names = " ".join(r["Task name"] for r in examples_data.rows()).lower()
    for word in ("joiner", "mover", "leaver", "access request", "attribute correction", "stale access",
                 "orphan account", "contractor end date", "certificate renewal", "emergency access",
                 "privileged role activation", "group owner", "service account owner", "failed provisioning",
                 "schema drift", "unauthorized direct write", "admin consent", "app registration",
                 "immutableid", "integration credential", "virtual agent", "ai agent"):
        assert word in names, word
    types = {t[0] for t in cs.TASK_TYPES}
    assert {"Admin consent request triage", "App registration lifecycle request", "ImmutableId update (hard match)",
            "Integration credential issue or rotation", "Automated intake request",
            "AI agent takes an action"} <= types


@pytest.mark.parametrize("field,value,flag", [
    ("Owner", "", "owner_approver_reread"),
    ("C2 Approver role (who approves)", " ", "owner_approver_reread"),
    ("C4 Re-read check (how closure is proven)", "", "owner_approver_reread"),
    ("C5 Evidence kept", "", "no_evidence"),
    ("NIST SP 800-53 controls", "", "no_control"),
])
def test_blank_required_fields_flag(field, value, flag):
    assert _flags(_good_row(**{field: value})) == {flag}


def test_severity_differs_from_class_default_needs_a_note():
    assert fc.DEFAULT_SEVERITY["stale_access"] == "P2"
    assert _flags(_good_row(Severity="P3", Notes="")) == {"severity_note"}
    assert _flags(_good_row(Severity="P3", Notes="Lowered: the access is read-only.")) == set()
    # A request with no drift class has no default to differ from.
    assert _flags(_good_row(**{"Drift class": "none", "Severity": "P4"})) == set()


@pytest.mark.parametrize("drift", sorted(fc.HUMAN_DECISION_CLASSES))
def test_human_decision_classes_cannot_go_to_a_machine_lane(drift):
    assert "orphan_account" in fc.HUMAN_DECISION_CLASSES
    row = _good_row(**{"Drift class": drift, "Severity": fc.DEFAULT_SEVERITY[drift]})
    for lane in cs.MACHINE_LANES:
        assert "human_to_machine" in _flags({**row, "Lane": lane})
    assert "human_to_machine" not in _flags({**row, "Lane": "Human decision"})


def test_high_impact_needs_human_approval():
    assert _flags(_good_row(**{"High impact": "yes", "Human approval before action": "no"})) == {"high_impact_no_human"}
    assert _flags(_good_row(**{"High impact": "yes", "Human approval before action": "yes"})) == set()


def _agent(**changes):
    row = dict(next(r for r in examples_data.rows() if r["Task ID"] == "EX-22"))
    row.update(changes)
    return row


def test_ai_agent_row_with_safeguards_passes():
    assert _agent()["Identity type"] == cs.AI_AGENT
    assert _flags(_agent()) == set()


def test_ai_agent_needs_a_sponsor():
    assert _flags(_agent(**{"Identity sponsor": ""})) == {"ai_agent"}


def test_ai_agent_needs_an_independent_reread():
    assert _flags(_agent(**{"Re-read by": "The identity that acted"})) == {"ai_agent"}


def test_ai_agent_needs_human_approval_for_high_impact_and_human_decision_classes():
    high = _agent(**{"High impact": "yes", "Human approval before action": "no"})
    assert _flags(high) == {"ai_agent", "high_impact_no_human"}
    human_class = _agent(**{"Drift class": "missing_identity", "Severity": "P2", "Lane": "Human decision",
                            "Human approval before action": "no"})
    assert _flags(human_class) == {"ai_agent"}
    # The same row run by a service identity is allowed: the AI rule is about agents.
    assert _flags({**human_class, "Identity type": "Service identity"}) == set()


def test_values_off_the_lists_are_errors(tmp_path):
    path = _write(tmp_path, [_good_row(Lane="Robot", Severity="P9", **{"Re-read by": "someone"})])
    result = cc.check(cc.read_catalog(path))[0]
    assert any("Lane 'Robot'" in e for e in result["errors"])
    assert any("Severity 'P9'" in e for e in result["errors"])
    assert any("Re-read by 'someone'" in e for e in result["errors"])


def test_duplicate_task_ids_are_errors(tmp_path):
    path = _write(tmp_path, [_good_row(), _good_row()])
    results = cc.check(cc.read_catalog(path))
    assert all("Task ID is used more than once" in r["errors"] for r in results)


def test_a_missing_column_stops_the_check(tmp_path):
    path = _write(tmp_path, [_good_row()], headers=[h for h in cs.HEADERS if h != "Owner"])
    out = io.StringIO()
    assert cc.main([str(path)], out=out) == 2
    assert "missing columns: Owner" in out.getvalue()


def test_response_window_and_ksi_warnings(tmp_path):
    path = _write(tmp_path, [_good_row(**{"Response window": "24 hours", "KSIs": "KSI-NOT-REAL"})])
    warnings = cc.check(cc.read_catalog(path))[0]["warnings"]
    assert any("should be '1 hour' for P2" in w for w in warnings)
    assert any("KSI-NOT-REAL" in w for w in warnings)


def test_payloads_are_accepted_by_finding_contract_validate(tmp_path):
    out = io.StringIO()
    cc.main([str(EXAMPLES), "--payloads", str(tmp_path)], out=out)
    every = json.loads((tmp_path / "payloads.json").read_text(encoding="utf-8"))
    assert len(every) == 17
    assert (tmp_path / "EX-03.json").exists() and not (tmp_path / "EX-01.json").exists()
    check = io.StringIO()
    assert fc.main(["--validate", str(tmp_path / "payloads.json"), "--now", "2026-11-02T12:00:00Z"], out=check) == 0
    assert "17 accepted, 0 rejected" in check.getvalue()


def test_payload_carries_the_row_and_the_shared_vocabulary():
    payload = cc.payload_for(_good_row())
    assert payload["drift_class"] in fc.DRIFT_CLASSES and payload["severity"] in fc.PRIORITY
    assert payload["system"] == "entra_user" and payload["origin"]["catalog_task"] == "EX-03"
    assert payload["evidence"]["reread_check"].startswith("Re-read")
    assert cc.payload_for(_good_row(**{"Drift class": "none"})) is None
    # "other" isn't a system the contract knows, so the payload leaves it out.
    assert "system" not in cc.payload_for(_good_row(**{"Re-read system": "other"}))
