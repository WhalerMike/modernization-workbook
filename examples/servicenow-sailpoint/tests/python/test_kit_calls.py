"""Every call a client makes is declared in config/calls.json for its task, with its least privilege."""

import json

import pytest

import evidence_export as ee
import identity_drift as d
import kit_calls as kcalls
import reread_verification as rr
from conftest import FIXTURES, FakeResponse, FakeSession

import kit_common as kc

DATA = kcalls.load_calls()


def _assert_declared(session, task):
    assert session.calls, "the client made no calls"
    for call in session.calls:
        match = kcalls.match_call(DATA, call["method"], call["url"], task)
        assert match, f"{task}: undeclared call {call['method']} {call['url']}"


def test_call_list_is_well_formed():
    ids = [c["id"] for c in DATA["calls"]]
    assert len(ids) == len(set(ids))
    for call in DATA["calls"]:
        assert call["source"] and call["permission"] and call["tasks"]


def test_required_permissions_per_task():
    assert kcalls.required(DATA, "drift", "isc") == {"sp:search:read", "idn:accounts:read"}
    assert kcalls.required(DATA, "drift", "graph") == {"User.Read.All", "AuditLog.Read.All"}
    assert kcalls.required(DATA, "drift", "graph", include_optional=False) == {"User.Read.All"}
    assert kcalls.required(DATA, "reread", "isc") == {"sp:search:read", "idn:accounts:read"}
    assert kcalls.required(DATA, "reread", "graph") == {"User.Read.All"}
    assert kcalls.required(DATA, "reread", "servicenow") == {"x_example_idkit.verifier"}
    assert kcalls.required(DATA, "drift-push", "servicenow") == {"x_example_idkit.finding_writer"}
    assert kcalls.required(DATA, "workflows", "isc") == {"sp:workflow:manage"}
    # The evidence export reads only: it doesn't get the verifier's write role.
    assert kcalls.required(DATA, "evidence", "servicenow") == {"x_example_idkit.evidence_reader"}
    # Nothing in Pass 1 asks for a write scope on ISC or Graph.
    for task in DATA["tasks"]:
        for system in ("isc", "graph"):
            for perm in kcalls.required(DATA, task, system):
                assert not perm.endswith((":manage", "ReadWrite.All")) or task == "workflows", (task, perm)


def test_match_call_distinguishes_list_and_item():
    assert kcalls.match_call(DATA, "GET", "https://t.api.identitynow.com/v3/accounts?limit=250")["id"] == "isc-accounts-list"
    assert kcalls.match_call(DATA, "GET", "https://t.api.identitynow.com/v3/accounts/abc")["id"] == "isc-account-get"
    assert kcalls.match_call(DATA, "DELETE", "https://t.api.identitynow.com/v3/accounts/abc") is None
    assert kcalls.match_call(DATA, "GET", "https://graph.microsoft.com/v1.0/users/abc", "drift") is None


def test_drift_client_calls_are_declared(no_env, monkeypatch, tmp_path):
    monkeypatch.setenv("SAILPOINT_TENANT", "t")
    monkeypatch.setenv("SAILPOINT_CLIENT_ID", "cid")
    monkeypatch.setenv("SAILPOINT_CLIENT_SECRET", "s")
    monkeypatch.setenv("GRAPH_ACCESS_TOKEN", "g")
    session = FakeSession()
    session.add("POST", "/oauth/token", FakeResponse(200, {"access_token": "x"}))
    session.add("GET", "graph.microsoft.com/v1.0/users", FakeResponse(200, {"value": []}))
    session.add("GET", "graph.microsoft.com/v1.0/auditLogs/directoryAudits", FakeResponse(200, {"value": []}))
    session.add("POST", "/v3/search", FakeResponse(200, []))
    session.add("GET", "/v3/accounts", FakeResponse(200, []))
    rc = d.main(["--hr-csv", str(FIXTURES / "hr_extract.csv"), "--include-audit", "2026-10-01T00:00:00Z",
                 "--out-json", str(tmp_path / "o.json"), "--out-csv", str(tmp_path / "o.csv")],
                http=kc.Http(session, sleep=lambda s: None))
    assert rc == 0
    _assert_declared(session, "drift")


def test_drift_push_calls_are_declared(no_env, monkeypatch):
    monkeypatch.setenv("SN_INSTANCE", "contoso")
    monkeypatch.setenv("SN_CLIENT_ID", "c")
    monkeypatch.setenv("SN_CLIENT_SECRET", "s")
    session = FakeSession()
    session.add("POST", "/oauth_token.do", FakeResponse(200, {"access_token": "x"}))
    session.add("POST", "/api/x_example_idkit/identity_findings/finding",
                FakeResponse(201, {"result": {"sys_id": "1"}}), sticky=True)
    http = kc.Http(session, sleep=lambda s: None)
    cfg = kc.load_config(None)
    finding = {"finding_id": "f1", "drift_class": "stale_access", "priority": "P2", "system": "entra",
               "object_id": "u1", "employee_id": "E1", "detected_at": "x"}
    d.push_to_servicenow([finding], cfg, http, kc.sn_headers(cfg, http), apply=True)
    _assert_declared(session, "drift-push")


def test_reread_client_calls_are_declared(no_env, monkeypatch):
    monkeypatch.setenv("SN_INSTANCE", "contoso")
    monkeypatch.setenv("SN_ACCESS_TOKEN", "x")
    monkeypatch.setenv("SAILPOINT_TENANT", "t")
    monkeypatch.setenv("SAILPOINT_ACCESS_TOKEN", "x")
    monkeypatch.setenv("GRAPH_ACCESS_TOKEN", "x")
    records = [
        {"sys_id": "s1", "number": "IDF1", "u_system": "isc_account", "u_account_id": "a1",
         "u_intended_state": json.dumps({"disabled": True})},
        {"sys_id": "s2", "number": "IDF2", "u_system": "isc_identity", "u_identity_id": "i1",
         "u_intended_state": json.dumps({"attributes": {"department": "HR"}})},
        {"sys_id": "s3", "number": "IDF3", "u_system": "entra_user", "u_subject_id": "u1",
         "u_intended_state": json.dumps({"accountEnabled": False})},
    ]
    session = FakeSession()
    session.add("GET", "/api/now/table/u_identity_finding", FakeResponse(200, {"result": records}))
    session.add("GET", "/v3/accounts/a1", FakeResponse(200, {"id": "a1", "disabled": True}))
    session.add("POST", "/v3/search", FakeResponse(200, [{"id": "i1", "attributes": {"department": "HR"}}]))
    session.add("GET", "graph.microsoft.com/v1.0/users/u1", FakeResponse(200, {"id": "u1", "accountEnabled": False}))
    session.add("PATCH", "/api/now/table/u_identity_finding/", FakeResponse(200, {"result": {}}), sticky=True)
    session.add("POST", "/api/now/attachment/file", FakeResponse(201, {"result": {}}), sticky=True)
    assert rr.main(["--apply"], http=kc.Http(session, sleep=lambda s: None)) == 0
    _assert_declared(session, "reread")


def test_evidence_live_read_is_declared(no_env, monkeypatch, tmp_path):
    monkeypatch.setenv("SN_INSTANCE", "contoso")
    monkeypatch.setenv("SN_ACCESS_TOKEN", "x")
    session = FakeSession()
    session.add("GET", "/api/now/table/u_identity_finding", FakeResponse(200, {"result": []}))
    rc = ee.main(["--since", "2026-10-01", "--period", "2026-10", "--out-dir", str(tmp_path / "e")],
                 http=kc.Http(session, sleep=lambda s: None))
    assert rc == 0
    _assert_declared(session, "evidence")


def test_cli_lists_and_compares(capsys):
    assert kcalls.main(["--task", "reread"]) == 0
    out = capsys.readouterr().out
    assert "GET    /v3/accounts/{id}" in out and "needs: x_example_idkit.verifier" in out
    assert kcalls.main(["--task", "drift", "--system", "isc", "--granted", "sp:search:read,idn:accounts:read"]) == 0
    assert "Least privilege holds." in capsys.readouterr().out
    assert kcalls.main(["--task", "drift", "--system", "isc",
                        "--granted", "sp:search:read,idn:accounts:read,idn:accounts:manage"]) == 1
    assert "extra:   idn:accounts:manage" in capsys.readouterr().out
    assert kcalls.main(["--task", "drift", "--system", "graph", "--required-only", "--granted", "User.Read.All"]) == 0


def test_cli_rejects_granted_without_system():
    with pytest.raises(SystemExit):
        kcalls.main(["--task", "drift", "--granted", "x"])
