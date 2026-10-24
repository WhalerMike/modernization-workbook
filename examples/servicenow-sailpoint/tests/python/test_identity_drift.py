import csv
import io
import json

import identity_drift as d
import kit_common as kc
from conftest import FIXTURES, FakeResponse, FakeSession, load_fixture


def _run(audit=True):
    hr = d.load_hr_csv(str(FIXTURES / "hr_extract.csv"))
    options = load_fixture("drift_options.json")
    return d.compute_findings(hr, load_fixture("graph_users.json"), load_fixture("isc_identities.json"),
                              load_fixture("isc_uncorrelated_accounts.json"),
                              load_fixture("entra_audit.json") if audit else None,
                              options, detected_at="2026-10-24T12:00:00Z")


def _key(f):
    return (f["drift_class"], f["system"], f["employee_id"], f["attribute"])


def test_findings_match_expected_fixture():
    result = _run()
    expected = sorted(_key(e) for e in load_fixture("expected_findings.json"))
    assert sorted(_key(f) for f in result["findings"]) == expected


def test_every_computable_class_is_covered():
    classes = {f["drift_class"] for f in _run()["findings"]}
    assert classes == {"missing_identity", "stale_access", "orphan_account", "attribute_drift",
                       "unauthorized_write"}


def test_severity_defaults_and_priority_mapping():
    for finding in _run()["findings"]:
        assert finding["severity"] == d.CLASS_SEVERITY[finding["drift_class"]]
        assert finding["priority"] == {"High": "P2", "Medium": "P3"}[finding["severity"]]


def test_unauthorized_write_not_computed_without_audit():
    result = _run(audit=False)
    assert "unauthorized_write" in result["not_computed"]
    assert not [f for f in result["findings"] if f["drift_class"] == "unauthorized_write"]
    assert {"credential_drift", "schema_drift"} <= set(result["not_computed"])


def test_allowed_writer_and_guest_and_authoritative_source_are_excluded():
    findings = _run()["findings"]
    assert not [f for f in findings if f.get("evidence", {}).get("audit_id") == "audit-0002"]
    assert not [f for f in findings if "#EXT#" in f["object_name"]]
    assert not [f for f in findings if f["evidence"].get("source") == "Core HCM"]


def test_finding_ids_are_stable():
    first = [f["finding_id"] for f in _run()["findings"]]
    second = [f["finding_id"] for f in _run()["findings"]]
    assert first == second and len(set(first)) == len(first)


def test_outputs_json_and_csv(tmp_path):
    result = _run()
    d.write_json(result, str(tmp_path / "o.json"))
    d.write_csv(result["findings"], str(tmp_path / "o.csv"))
    assert len(json.loads((tmp_path / "o.json").read_text())["findings"]) == 12
    rows = list(csv.DictReader(io.StringIO((tmp_path / "o.csv").read_text(encoding="utf-8"))))
    assert len(rows) == 12 and set(d.CSV_FIELDS) == set(rows[0])
    assert json.loads(rows[0]["evidence"])


def test_hr_csv_requires_columns(tmp_path):
    bad = tmp_path / "bad.csv"
    bad.write_text("id,status\n1,Active\n")
    try:
        d.load_hr_csv(str(bad))
    except kc.KitError as exc:
        assert "employeeId" in str(exc)
    else:
        raise AssertionError("expected KitError")


def test_servicenow_payload_contract():
    stale = next(f for f in _run()["findings"] if f["drift_class"] == "stale_access" and f["system"] == "isc")
    payload = d.to_servicenow_payload(stale)
    assert payload["kind"] == "finding" and payload["system"] == "isc_account"
    assert payload["intended_state"] == {"disabled": True}
    assert payload["severity"] == "P2" and payload["origin"]["finding_id"] == stale["finding_id"]


def test_push_is_dry_run_unless_apply():
    findings = _run()["findings"][:2]
    cfg = {"SN_INSTANCE": "contoso", "SN_FINDING_API_PATH": "/api/x/f"}
    session = FakeSession()
    out = io.StringIO()
    results = d.push_to_servicenow(findings, cfg, kc.Http(session), {}, apply=False, out=out)
    assert not session.calls and all(r["action"] == "dry-run" for r in results)
    session.add("POST", "/api/x/f", FakeResponse(201, {"result": {"sys_id": "abc", "deduplicated": False}}),
                sticky=True)
    results = d.push_to_servicenow(findings, cfg, kc.Http(session), {}, apply=True)
    assert len(session.calls) == 2 and results[0]["sys_id"] == "abc"


def test_fetchers_call_documented_endpoints():
    session = FakeSession()
    session.add("GET", "graph.microsoft.us/v1.0/users", FakeResponse(200, {"value": [{"id": "u"}]}))
    users = d.fetch_graph_users({"GRAPH_CLOUD": "USGov"}, kc.Http(session), {})
    assert users == [{"id": "u"}]
    assert "$expand=manager($select=id,employeeId)" in session.calls[0]["url"]

    session = FakeSession()
    session.add("POST", "/v3/search", FakeResponse(200, [{"id": "i1"}]))
    session.add("GET", "/v3/accounts", FakeResponse(200, [{"id": "a1"}]))
    cfg = {"SAILPOINT_TENANT": "example"}
    assert d.fetch_isc_identities(cfg, kc.Http(session), {}) == [{"id": "i1"}]
    assert session.calls[0]["json"]["indices"] == ["identities"]
    assert d.fetch_isc_uncorrelated_accounts(cfg, kc.Http(session), {}) == [{"id": "a1"}]
    assert session.calls[1]["params"]["filters"] == "uncorrelated eq true"


def test_main_offline(tmp_path, no_env, capsys):
    rc = d.main(["--hr-csv", str(FIXTURES / "hr_extract.csv"),
                 "--graph-users-json", str(FIXTURES / "graph_users.json"),
                 "--isc-identities-json", str(FIXTURES / "isc_identities.json"),
                 "--isc-accounts-json", str(FIXTURES / "isc_uncorrelated_accounts.json"),
                 "--out-json", str(tmp_path / "o.json"), "--out-csv", str(tmp_path / "o.csv")],
                http=kc.Http(FakeSession()))
    assert rc == 0
    summary = json.loads(capsys.readouterr().out)
    assert "unauthorized_write" in summary["not_computed"]


def test_finding_ids_match_shared_fixture():
    """The PowerShell client is tested against the same ids (cross-language parity)."""
    assert sorted(f["finding_id"] for f in _run()["findings"]) == load_fixture("expected_finding_ids.json")
