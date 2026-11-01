"""The re-read rule offline: saved records and saved reads give the same decisions as a live run."""

import json

import pytest

import reread_verification as rr
from conftest import FIXTURES

RECORDS = FIXTURES / "reread" / "awaiting_records.json"
OBS = FIXTURES / "reread" / "observations.json"


def _run(capsys, *extra):
    rc = rr.main(["--records-json", str(RECORDS), "--observations-json", str(OBS), *extra])
    return rc, capsys.readouterr().out


def test_offline_outcomes(capsys, no_env, tmp_path):
    out_json = tmp_path / "r.json"
    rc, out = _run(capsys, "--now", "2026-11-01T12:00:00Z", "--out-json", str(out_json))
    assert rc == 0
    assert out.strip().splitlines()[-1] == "1 mismatch, 1 pending, 1 skipped, 3 verified"
    results = {r["record"]: r for r in json.loads(out_json.read_text())}
    assert results["IDF0001001"]["outcome"] == "verified"
    assert results["IDF0001002"]["differences"] == ["accountEnabled: intended False, observed True"]
    assert results["IDF0001003"]["outcome"] == "pending"
    assert results["IDF0001005"]["reason"] == "intended state names nothing a re-read can check"
    assert all(not r.get("applied") for r in results.values())


def test_after_the_grace_period_a_stale_read_is_a_mismatch(capsys, no_env):
    rc, out = _run(capsys, "--now", "2026-11-02T12:00:00Z")
    assert "IDF0001003: mismatch" in out
    assert out.strip().splitlines()[-1] == "2 mismatch, 1 skipped, 3 verified"


def test_vacuous_intended_state_is_never_verified():
    record = {"number": "X", "sys_id": "s", "u_system": "isc_account", "u_account_id": "a",
              "u_intended_state": json.dumps({"attributes": {}, "entitlements_absent": []})}
    called = []
    results = rr.verify_records([record], {"SN_BASE_URL": "https://x"}, None, {}, None, None, "t", False,
                                reader=lambda *a: called.append(a))
    assert results[0]["outcome"] == "skipped" and not called


def test_a_missing_saved_read_is_an_error_not_a_match(tmp_path, no_env):
    obs = json.loads(OBS.read_text())
    del obs["00000000-0000-0000-0000-000000001002"]
    path = tmp_path / "obs.json"
    path.write_text(json.dumps(obs))
    with pytest.raises(Exception, match="No saved read"):
        rr.main(["--records-json", str(RECORDS), "--observations-json", str(path), "--now", "2026-11-01T12:00:00Z"])


def test_a_null_saved_read_means_not_found():
    reader = rr.offline_reader({"a": None})
    obs = reader({"u_system": "isc_account", "u_account_id": "a"}, {}, None, None, None)
    assert obs["exists"] is False and rr.compare({"exists": False}, obs) == []


def test_offline_refuses_apply_and_half_inputs(no_env):
    with pytest.raises(SystemExit):
        rr.main(["--records-json", str(RECORDS), "--observations-json", str(OBS), "--apply"])
    with pytest.raises(SystemExit):
        rr.main(["--records-json", str(RECORDS)])
