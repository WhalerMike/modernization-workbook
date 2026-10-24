import io
import json
from datetime import datetime, timezone

import kit_common as kc
import reread_verification as rv
from conftest import FakeResponse, FakeSession

CFG = {"SAILPOINT_TENANT": "example", "SAILPOINT_CLIENT_ID": "isc-client", "SN_INSTANCE": "contoso",
       "SN_STATE_AWAITING_VERIFICATION": "18", "SN_STATE_CLOSED": "3", "SN_STATE_REOPENED": "1",
       "GRAPH_CLOUD": "Global"}
NOW = datetime(2026, 10, 24, 12, 0, tzinfo=timezone.utc)


def _record(**kw):
    base = {"sys_id": "sys1", "number": "IDF0001001", "state": "18", "u_system": "isc_account",
            "u_account_id": "acc1", "u_intended_state": json.dumps({"disabled": True}),
            "u_awaiting_since": "2026-10-24 10:00:00"}
    base.update(kw)
    return base


def _account(disabled, modified="2026-10-24T11:00:00Z", **attrs):
    return {"id": "acc1", "disabled": disabled, "modified": modified, "attributes": attrs}


def test_compare_rules():
    obs = {"exists": True, "observed": {"disabled": True, "attributes": {"memberOf": ["CN=A", "CN=B"], "title": "X"}}}
    assert rv.compare({"disabled": True}, obs) == []
    assert rv.compare({"attributes": {"title": "Y"}}, obs)
    assert rv.compare({"entitlements_absent": [{"attribute": "memberOf", "value": "CN=A"}]}, obs)
    assert rv.compare({"entitlements_present": [{"attribute": "memberOf", "value": "CN=B"}]}, obs) == []
    assert rv.compare({"exists": False}, {"exists": False, "observed": None}) == []
    assert rv.compare({"disabled": True}, {"exists": False, "observed": None}) == ["subject not found"]


def test_list_awaiting_queries_state():
    session = FakeSession().add("GET", "/api/now/table/u_identity_finding",
                                FakeResponse(200, {"result": [_record()]}))
    rows = rv.list_awaiting(CFG, kc.Http(session), {}, "u_identity_finding")
    assert len(rows) == 1
    assert session.calls[0]["params"]["sysparm_query"].startswith("state=18")


def test_dry_run_writes_nothing():
    session = FakeSession().add("GET", "/v3/accounts/acc1", FakeResponse(200, _account(True)))
    out = io.StringIO()
    results = rv.verify_records([_record()], CFG, kc.Http(session), {}, {}, None, "u_identity_finding",
                                apply=False, now=NOW, out=out)
    assert results[0]["outcome"] == "verified" and not results[0]["applied"]
    assert [c["method"] for c in session.calls] == ["GET"]
    assert "[dry-run]" in out.getvalue()


def test_apply_verified_closes_and_attaches_evidence():
    session = FakeSession()
    session.add("GET", "/v3/accounts/acc1", FakeResponse(200, _account(True)))
    session.add("PATCH", "/api/now/table/u_identity_finding/sys1", FakeResponse(200, {"result": {}}))
    session.add("POST", "/api/now/attachment/file", FakeResponse(201, {"result": {}}))
    results = rv.verify_records([_record()], CFG, kc.Http(session), {}, {}, None, "u_identity_finding",
                                apply=True, now=NOW, out=io.StringIO())
    assert results[0]["outcome"] == "verified"
    patch = session.calls[1]["json"]
    assert patch["state"] == "3" and patch["u_evidence_hash"] == results[0]["evidence_sha256"]
    evidence = json.loads(patch["u_evidence"])
    assert evidence["query"] == "GET /v3/accounts/acc1" and evidence["checked_at"] == "2026-10-24T12:00:00Z"
    assert evidence["result_sha256"] == kc.sha256_hex(_account(True))
    attach = session.calls[2]
    assert attach["params"] == {"table_name": "u_identity_finding", "table_sys_id": "sys1",
                                "file_name": "reread-evidence-IDF0001001.json"}


def test_apply_mismatch_reopens_with_note():
    session = FakeSession()
    session.add("GET", "/v3/accounts/acc1", FakeResponse(200, _account(False)))
    session.add("PATCH", "/api/now/table/u_identity_finding/sys1", FakeResponse(200, {"result": {}}))
    results = rv.verify_records([_record()], CFG, kc.Http(session), {}, {}, None, "u_identity_finding",
                                apply=True, now=NOW, out=io.StringIO())
    assert results[0]["outcome"] == "mismatch"
    patch = session.calls[1]["json"]
    assert patch["state"] == "1" and "disabled" in patch["work_notes"]
    assert len(session.calls) == 2


def test_stale_isc_read_is_pending_until_grace_ends():
    old = _account(False, modified="2026-10-24T09:00:00Z")
    session = FakeSession().add("GET", "/v3/accounts/acc1", FakeResponse(200, old), sticky=True)
    results = rv.verify_records([_record()], CFG, kc.Http(session), {}, {}, None, "t", apply=True,
                                now=NOW, out=io.StringIO())
    assert results[0]["outcome"] == "pending" and len(session.calls) == 1
    session.add("PATCH", "/api/now/table/t/sys1", FakeResponse(200, {}))
    late = datetime(2026, 10, 26, 12, 0, tzinfo=timezone.utc)
    results = rv.verify_records([_record()], CFG, kc.Http(session), {}, {}, None, "t", apply=True,
                                now=late, out=io.StringIO())
    assert results[0]["outcome"] == "mismatch"


def test_identity_and_entra_rereads():
    session = FakeSession()
    session.add("POST", "/v3/search", FakeResponse(200, [{"id": "id1", "attributes": {"department": "Finance"}}]))
    rec = _record(u_system="isc_identity", u_account_id="", u_identity_id="id1",
                  u_intended_state=json.dumps({"attributes": {"department": "Finance"}}))
    results = rv.verify_records([rec], CFG, kc.Http(session), {}, {}, None, "t", apply=False, now=NOW,
                                out=io.StringIO())
    assert results[0]["outcome"] == "verified"
    assert session.calls[0]["json"]["query"]["query"] == 'id:"id1"'

    session = FakeSession().add("GET", "graph.microsoft.com/v1.0/users/u1",
                                FakeResponse(200, {"id": "u1", "accountEnabled": False}))
    rec = _record(u_system="entra_user", u_subject_id="u1", u_intended_state=json.dumps({"accountEnabled": False}))
    results = rv.verify_records([rec], CFG, kc.Http(session), {}, None, {}, "t", apply=False, now=NOW,
                                out=io.StringIO())
    assert results[0]["outcome"] == "verified"


def test_deleted_account_matches_exists_false():
    session = FakeSession().add("GET", "/v3/accounts/acc1", FakeResponse(404, {"detailCode": "404"}))
    rec = _record(u_intended_state=json.dumps({"exists": False}))
    results = rv.verify_records([rec], CFG, kc.Http(session), {}, {}, None, "t", apply=False, now=NOW,
                                out=io.StringIO())
    assert results[0]["outcome"] == "verified"


def test_missing_intended_state_is_skipped():
    results = rv.verify_records([_record(u_intended_state="")], CFG, kc.Http(FakeSession()), {}, {}, None,
                                "t", apply=True, now=NOW, out=io.StringIO())
    assert results[0]["outcome"] == "skipped"
