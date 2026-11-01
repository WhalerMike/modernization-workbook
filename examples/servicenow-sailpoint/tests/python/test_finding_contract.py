"""The data contract in Python matches the Scripted REST script, and catches what it would reject."""

import json
import re
from datetime import datetime, timezone

import pytest

import finding_contract as fc
import identity_drift as d
from conftest import FIXTURES, KIT

REST = (KIT / "servicenow" / "scripted-rest-identity-finding.js").read_text(encoding="utf-8")


def _js_object(name):
    body = re.search(r"var " + name + r" = \{(.*?)\};", REST, re.S).group(1)
    return {k: v for k, v in re.findall(r"(\w+): '?([\w]+)'?", body)}


def _js_list(name):
    body = re.search(r"var " + name + r" = \[(.*?)\];", REST, re.S).group(1)
    return re.findall(r"'(\w+)'", body)


def test_constants_match_the_scripted_rest_script():
    assert fc.DRIFT_CLASSES == _js_list("DRIFT_CLASSES")
    assert fc.SYSTEMS == _js_list("SYSTEMS")
    assert fc.DEFAULT_SEVERITY == _js_object("DEFAULT_SEVERITY")
    assert fc.PRIORITY == _js_object("PRIORITY")
    assert {k: str(v) for k, v in fc.WINDOW_SECONDS.items()} == _js_object("WINDOW_SECONDS")


def test_script_dedupe_key_includes_the_attribute():
    assert "(f.attribute ? '|' + f.attribute : '')" in REST
    base = {"source": "s", "subject_id": "u1", "drift_class": "attribute_drift"}
    assert fc.dedupe_key(base) == "s|u1|attribute_drift"
    assert fc.dedupe_key({**base, "attribute": "manager"}) == "s|u1|attribute_drift|manager"


GOOD = {"kind": "finding", "source": "drift-reconciliation", "drift_class": "stale_access", "system": "entra_user",
        "subject_id": "u1", "origin": {"finding_id": "f1"}, "intended_state": {"accountEnabled": False}}


def test_valid_finding_normalized():
    r = fc.validate(GOOD)
    assert r["ok"] and not r["warnings"]
    assert r["normalized"]["severity"] == "P2" and r["normalized"]["priority"] == "2"
    assert r["normalized"]["window_seconds"] == 3600


@pytest.mark.parametrize("change,message", [
    ({"drift_class": "nope"}, "drift_class must be one of"),
    ({"severity": "P9"}, "severity must be"),
    ({"origin": None}, "origin is required"),
    ({"subject_id": ""}, "one of account_id"),
    ({"system": "ldap"}, "system must be one of"),
    ({"source": ""}, "source is required"),
])
def test_rejections_mirror_the_script(change, message):
    r = fc.validate({**GOOD, **change})
    assert not r["ok"]
    assert any(message in e for e in r["errors"])


def test_kind_and_closure_signal_rules():
    assert fc.validate([])["errors"] == ["Expected a JSON object"]
    assert not fc.validate({"kind": "other"})["ok"]
    assert not fc.validate({"kind": "closure_signal", "recipient_id": "i1"})["ok"]
    assert fc.validate({"kind": "closure_signal", "recipient_id": "i1", "account_requests": []})["ok"]


def test_system_defaults_like_the_script():
    p = {**GOOD, "system": None, "subject_id": None, "account_id": "a1"}
    assert fc.validate(p)["normalized"]["system"] == "isc_account"
    p = {**GOOD, "system": None, "subject_id": None, "identity_id": "i1"}
    assert fc.validate(p)["normalized"]["system"] == "isc_identity"


@pytest.mark.parametrize("intended,checkable", [
    ({"accountEnabled": False}, True),
    ({"exists": False}, True),
    ({"attributes": {"department": "HR"}}, True),
    ({"attributes": {}, "entitlements_absent": [], "entitlements_present": []}, False),
    ({}, False),
    (None, False),
    ({"note": "x"}, False),
])
def test_is_checkable(intended, checkable):
    assert fc.is_checkable(intended) is checkable


def test_vacuous_intended_state_warns():
    r = fc.validate({**GOOD, "intended_state": {"attributes": {}}})
    assert r["ok"] and "names nothing a re-read can check" in r["warnings"][0]
    r = fc.validate({**GOOD, "drift_class": "unauthorized_write", "intended_state": {}})
    assert "Book 13 routes this class to a person" in r["warnings"][0]


def test_due_at_follows_the_tempo():
    now = datetime(2026, 11, 1, 12, tzinfo=timezone.utc)
    assert fc.due_at("P1", now) == now
    assert fc.due_at("P4", now).isoformat() == "2026-11-04T12:00:00+00:00"


def test_every_drift_payload_from_the_fixtures_is_accepted(tmp_path, capsys):
    opts = json.loads((FIXTURES / "drift_options.json").read_text())
    result = d.compute_findings(d.load_hr_csv(str(FIXTURES / "hr_extract.csv")),
                                json.loads((FIXTURES / "graph_users.json").read_text())["value"],
                                json.loads((FIXTURES / "isc_identities.json").read_text()),
                                json.loads((FIXTURES / "isc_uncorrelated_accounts.json").read_text()),
                                json.loads((FIXTURES / "entra_audit.json").read_text())["value"], opts,
                                detected_at="2026-11-01T12:00:00Z")
    run = tmp_path / "drift.json"
    run.write_text(json.dumps(result))
    rc = fc.main(["--from-drift", str(run), "--now", "2026-11-01T12:00:00Z"])
    out = capsys.readouterr().out
    assert rc == 0
    assert "12 accepted, 0 rejected, 0 would de-duplicate" in out


def test_cli_validate_file_reports_400(tmp_path, capsys):
    path = tmp_path / "p.json"
    path.write_text(json.dumps([GOOD, {**GOOD, "drift_class": "x"}]))
    assert fc.main(["--validate", str(path)]) == 1
    out = capsys.readouterr().out
    assert "1 accepted, 1 rejected" in out and "400 drift_class" in out
