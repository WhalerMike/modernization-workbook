"""The deployment runbook's scripts: preflight, render, smoke test and rollback, against fixtures."""

import io
import json
import sys

import pytest

from conftest import FIXTURES, KIT

sys.path.insert(0, str(KIT / "deploy"))

import deploy_common as dc  # noqa: E402
import kit_calls as kcalls  # noqa: E402
import kit_common as kc  # noqa: E402
import preflight  # noqa: E402
import record  # noqa: E402
import render_workflows as rw  # noqa: E402
import rollback  # noqa: E402
import smoke_test  # noqa: E402

DEPLOY = FIXTURES / "deploy"
TEST = str(DEPLOY / "environment.test.json")
PROD = str(DEPLOY / "environment.production.json")
CALLS = kcalls.load_calls()


def run(module, args, http=None):
    out = io.StringIO()
    rc = module.main(args, http=http, out=out) if http is not None else module.main(args, out=out)
    return rc, out.getvalue()


def replay(name):
    env, session = dc.load_fixture(str(DEPLOY / name))
    return env, session, kc.Http(session, sleep=lambda s: None)


def write_settings(tmp_path, change):
    data = json.loads((DEPLOY / "environment.test.json").read_text(encoding="utf-8"))
    change(data)
    path = tmp_path / "settings.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    return str(path)


def assert_declared(session, task):
    assert session.calls
    for call in session.calls:
        assert kcalls.match_call(CALLS, call["method"], call["url"], task), (task, call["method"], call["url"])


# --- the settings file -------------------------------------------------------

def test_template_has_placeholders_and_no_secret():
    settings = dc.load_settings(str(KIT / "deploy" / "environment.example.json"), env={})
    left = settings.placeholders()
    assert "SN_BASE_URL" in left and "deploy.environment" in left and "deploy.granted.verifier" in left
    assert not set(settings.raw) & kc.SECRET_KEYS


def test_fixture_settings_are_complete():
    for path in (TEST, PROD):
        assert dc.load_settings(path, env={}).placeholders() == []


def test_a_secret_in_the_settings_file_is_refused(tmp_path):
    path = write_settings(tmp_path, lambda d: d.update({"SN_CLIENT_SECRET": "x"}))
    with pytest.raises(kc.KitError):
        dc.load_settings(path, env={})
    rc, out = run(preflight, ["--settings", path, "--dry-run"])
    assert rc == 1 and "must not contain secrets" in out


def test_only_the_settings_file_differs_between_stages():
    test, prod = (json.loads(open(p, encoding="utf-8").read()) for p in (TEST, PROD))
    assert set(test) == set(prod) and set(test["deploy"]) == set(prod["deploy"])
    assert test["SN_BASE_URL"] != prod["SN_BASE_URL"]


def test_endpoints_come_from_the_file_not_the_environment():
    settings = dc.load_settings(TEST, env={"SN_BASE_URL": "https://contoso.service-now.com"})
    assert settings.cfg["SN_BASE_URL"] == "https://contosotest.service-now.com"
    assert dc.endpoint_overrides(settings, {"SN_BASE_URL": "https://contoso.service-now.com"}) == ["SN_BASE_URL"]
    assert dc.endpoint_overrides(settings, {"SN_BASE_URL": "https://contosotest.service-now.com/"}) == []


# --- preflight -----------------------------------------------------------------

def test_preflight_on_the_test_fixtures_is_a_go():
    env, session, http = replay("preflight.json")
    out = io.StringIO()
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(dc, "load_fixture", lambda path: (env, session))
        rc = preflight.main(["--settings", TEST, "--expect-workflows", "disabled", "--fixtures", "x",
                             "--today", "2026-11-02"], out=out)
    text = out.getvalue()
    assert rc == 0, text
    assert "WARN  G1  features" in text and "PASS  G4  workflows   3 of 3 found; disabled" in text
    assert "PASS  G4  executions  0 executions, 0 failed" in text
    assert "Result: 9 PASS, 1 WARN, 0 FAIL, 0 SKIP: go" in text
    assert_declared(session, "deploy-check")


def test_preflight_wrong_workflow_state_fails():
    rc, out = run(preflight, ["--settings", TEST, "--expect-workflows", "enabled", "--fixtures",
                              str(DEPLOY / "preflight.json"), "--today", "2026-11-02"])
    assert rc == 1 and "FAIL  G4  workflows" in out


def test_production_needs_the_features_confirmed_and_a_change_record(tmp_path):
    path = write_settings(tmp_path, lambda d: d["deploy"].update({"environment": "production"}))
    rc, out = run(preflight, ["--settings", path, "--dry-run", "--today", "2026-11-02"])
    assert rc == 1 and "FAIL  G1  features" in out and "production waits" in out
    rc, out = run(preflight, ["--settings", PROD, "--dry-run", "--today", "2026-11-02"])
    assert "PASS  G1  features" in out
    path = write_settings(tmp_path, lambda d: d["deploy"].update({"environment": "production", "change_record": ""}))
    rc, out = run(preflight, ["--settings", path, "--dry-run", "--today", "2026-11-02"])
    assert "FAIL  G1  change" in out


def test_preflight_refuses_basic_auth_and_stale_marketplace_record(monkeypatch, tmp_path):
    for key in dc.CREDENTIAL_KEYS + dc.ENDPOINT_KEYS:
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv("SN_USERNAME", "admin")
    monkeypatch.setenv("SN_PASSWORD", "x")
    rc, out = run(preflight, ["--settings", TEST, "--dry-run", "--today", "2026-12-15"])
    assert rc == 1
    assert "basic authentication is for a developer instance only" in out
    assert "FAIL  G1  marketplace" in out and "(43 days ago)" in out
    assert "SKIP  G4  instance" in out


def test_preflight_flags_an_extra_role(tmp_path):
    path = write_settings(tmp_path, lambda d: d["deploy"]["granted"].update(
        {"evidence_reader": "x_example_idkit.evidence_reader,x_example_idkit.verifier"}))
    rc, out = run(preflight, ["--settings", path, "--dry-run", "--today", "2026-11-02"])
    assert rc == 1 and "evidence_reader (servicenow): extra x_example_idkit.verifier" in out


def test_preflight_flags_an_environment_override(monkeypatch):
    monkeypatch.setenv("SN_BASE_URL", "https://contoso.service-now.com")
    rc, out = run(preflight, ["--settings", TEST, "--dry-run", "--today", "2026-11-02"])
    assert rc == 1 and "environment variables override the file: SN_BASE_URL" in out


# --- render --------------------------------------------------------------------

def test_render_points_each_workflow_at_the_environment():
    settings = dc.load_settings(TEST, env={})
    for index in (1, 2, 3):
        workflow = rw.render(settings, index)
        text = json.dumps(workflow)
        assert "contoso.service-now.com" not in text and "https://contosotest.service-now.com/oauth_token.do" in text
        assert workflow["enabled"] is False and workflow["owner"]["id"] == "2c9180000000000000000000000e9001"
        attrs = next(iter(workflow["definition"]["steps"].values()))["attributes"]
        assert attrs["oAuthClientId"] == "a1b2c3d4e5f60718293a4b5c6d7e8f90"  # the finding writer
        assert attrs["oAuthClientSecret"] == "REPLACE-IN-THE-UI"
    with_secret = rw.render(settings, 1, secret="s3")
    assert next(iter(with_secret["definition"]["steps"].values()))["attributes"]["oAuthClientSecret"] == "s3"
    # The kit's file is untouched.
    assert "contoso.service-now.com" in json.dumps(dc.load_workflows())


def test_render_secret_only_from_the_environment(monkeypatch):
    monkeypatch.setenv("SMOKE_SECRET", "from-env")
    out = io.StringIO()
    assert rw.main(["--settings", TEST, "--index", "1", "--secret-env", "SMOKE_SECRET", "--summary"], out=out) == 0
    assert "from-env" not in out.getvalue() and "from SMOKE_SECRET" in out.getvalue()
    monkeypatch.delenv("SMOKE_SECRET")
    assert rw.main(["--settings", TEST, "--index", "1", "--secret-env", "SMOKE_SECRET"], out=io.StringIO()) == 2


def test_test_inputs_use_the_synthetic_worker_and_its_baseline():
    settings = dc.load_settings(TEST, env={})
    native = rw.test_input(settings, 1)["input"]
    assert native["account"]["id"] == "2c91800000000000000000000a5001ad"
    assert native["singleValueAttributeChanges"] == [{"name": "department", "oldValue": "Smoke Test",
                                                      "newValue": "Smoke Test Changed"}]
    mover = rw.test_input(settings, 2)["input"]
    assert mover["changes"][0]["newValue"] == "Smoke Test"
    signal = rw.test_input(settings, 3)["input"]
    assert signal["recipient"]["id"] == "2c9180000000000000000000000e5001"
    assert signal["accountRequests"][0]["source"]["id"] == "src-entra"
    assert "alice" not in json.dumps([native, mover, signal])


def test_render_refuses_a_settings_file_with_placeholders():
    assert rw.main(["--settings", str(KIT / "deploy" / "environment.example.json"), "--list"], out=io.StringIO()) == 2


# --- smoke test ----------------------------------------------------------------

def test_raise_without_apply_posts_nothing():
    rc, out = run(smoke_test, ["raise", "--settings", TEST])
    assert rc == 0 and "dry run: would POST" in out and "PASS  payload meets the data contract" in out


def test_raise_signal_and_check_on_fixtures():
    env, session, http = replay("smoke.json")
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(dc, "load_fixture", lambda path: (env, session))
        rc, out = run(smoke_test, ["raise", "--settings", TEST, "--apply", "--fixtures", "x"], http=http)
        assert rc == 0 and "first post creates (201, priority 4) HTTP 201" in out
        assert "repeat de-duplicates (200, same)   HTTP 200, deduplicated True, occurrences 2" in out
        rc, out = run(smoke_test, ["signal", "--settings", TEST, "--apply", "--expect-moved", "2", "--fixtures", "x"],
                      http=http)
        assert rc == 0 and "moved 2 (expected 2)" in out
        posted = [c for c in session.calls if c["method"] == "POST" and "identity_findings" in c["url"]]
        assert [c["json"]["kind"] for c in posted] == ["finding", "finding", "closure_signal"]
        assert_declared(session, "smoke-raise")
    env, session, http = replay("smoke-check.json")
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(dc, "load_fixture", lambda path: (env, session))
        rc, out = run(smoke_test, ["check", "--settings", TEST, "--finding", "native", "--expect", "awaiting",
                                   "--occurrences", "3", "--fixtures", "x"], http=http)
        assert rc == 0, out
        assert_declared(session, "deploy-check")


def test_check_fails_on_the_wrong_state():
    rc, out = run(smoke_test, ["check", "--settings", TEST, "--finding", "direct", "--expect", "closed",
                               "--fixtures", str(DEPLOY / "smoke-check.json")])
    assert rc == 1 and "FAIL  state is closed" in out
    rc, out = run(smoke_test, ["check", "--settings", TEST, "--finding", "direct", "--expect", "closed",
                               "--fixtures", str(DEPLOY / "smoke-closed.json")])
    assert rc == 0 and "PASS  closed with re-read evidence" in out


def test_smoke_keys_match_the_scripted_rest_rule():
    settings = dc.load_settings(TEST, env={})
    payload = smoke_test.direct_payload(settings, "r")
    import finding_contract as fc
    assert fc.dedupe_key(payload) == dc.smoke_key(settings, "direct")
    assert dc.smoke_key(settings, "native") == "sailpoint-isc|2c91800000000000000000000a5001ad|unauthorized_write"
    assert dc.smoke_key(settings, "mover") == "sailpoint-isc|2c9180000000000000000000000e5001|attribute_drift|department"


# --- rollback ------------------------------------------------------------------

def test_rollback_plan_dry_run_shows_placeholders():
    rc, out = run(rollback, ["--settings", TEST, "--plan", "--dry-run"])
    assert rc == 0 and out.count("/v2025/workflows/<workflow-id>") == 3


def test_rollback_plan_and_verify_on_fixtures():
    rc, out = run(rollback, ["--settings", TEST, "--plan", "--fixtures", str(DEPLOY / "rollback-plan.json")])
    assert rc == 0 and "/v2025/workflows/wf-0000-0001" in out and "(now enabled)" in out
    env, session, http = replay("rollback.json")
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(dc, "load_fixture", lambda path: (env, session))
        rc, out = run(rollback, ["--settings", TEST, "--verify", "--since", "2026-11-02 16:30:00", "--fixtures", "x"],
                      http=http)
    assert rc == 0 and "Result: rolled back" in out
    assert_declared(session, "deploy-check")


def test_rollback_verify_fails_while_a_workflow_is_enabled():
    rc, out = run(rollback, ["--settings", TEST, "--verify", "--since", "2026-11-02 16:30:00", "--fixtures",
                             str(DEPLOY / "rollback-plan.json")])
    assert rc == 1 and "FAIL  G4 workflows disabled" in out and "IDF0001007" in out


# --- least privilege of the new tasks -----------------------------------------

def test_deployment_tasks_least_privilege():
    assert kcalls.required(CALLS, "deploy-check", "isc") == {"sp:workflow:read"}
    assert kcalls.required(CALLS, "deploy-check", "servicenow") == {"x_example_idkit.evidence_reader"}
    assert kcalls.required(CALLS, "smoke-raise", "servicenow") == {"x_example_idkit.finding_writer"}
    assert kcalls.required(CALLS, "workflows", "isc") == {"sp:workflow:manage"}
    assert kcalls.required(CALLS, "workflow-enable", "isc") == {"sp:workflow:manage"}
    assert kcalls.required(CALLS, "workflow-test", "isc") == {"sp:workflow-execute:external", "sp:workflow-execution:read"}
    # The deploy checker can't change a workflow.
    assert kcalls.match_call(CALLS, "PATCH", "https://t.api.identitynow.com/v2025/workflows/abc", "deploy-check") is None


def test_get_setting_reads_one_value_and_refuses_placeholders():
    assert dc.get_setting(TEST, "deploy.clients.evidence_reader") == "0f1e2d3c4b5a69788796a5b4c3d2e1f0"
    assert dc.get_setting(TEST, "SAILPOINT_API_BASE") == "https://example-sb.api.identitynow.com"
    with pytest.raises(KeyError):
        dc.get_setting(str(KIT / "deploy" / "environment.example.json"), "deploy.clients.verifier")
    with pytest.raises(KeyError):
        dc.get_setting(TEST, "deploy.clients")
    out = io.StringIO()
    assert dc.main([TEST, "deploy.environment"], out=out) == 0 and out.getvalue() == "test\n"
    assert dc.main([TEST, "deploy.nothing"], out=io.StringIO()) == 2


def test_each_step_refuses_the_wrong_integration_identity():
    # The smoke check must read as the evidence reader, not the finding writer.
    rc, out = run(smoke_test, ["check", "--settings", TEST, "--fixtures", str(DEPLOY / "smoke.json")])
    assert rc == 1 and "SN_CLIENT_ID is not the evidence_reader client" in out
    rc, out = run(smoke_test, ["raise", "--settings", TEST, "--apply", "--fixtures", str(DEPLOY / "smoke-check.json")])
    assert rc == 1 and "SN_CLIENT_ID is not the finding_writer client" in out
    settings = dc.load_settings(TEST, env={})
    assert dc.role_mismatch(settings, {"SAILPOINT_CLIENT_ID": "x"}, None, "isc_deploy_checker")
    assert dc.role_mismatch(settings, {"SN_ACCESS_TOKEN": "t"}, "evidence_reader", None) == []


def test_preflight_warns_on_a_failed_workflow_execution():
    rc, out = run(preflight, ["--settings", TEST, "--expect-workflows", "enabled", "--fixtures",
                              str(DEPLOY / "preflight-week1.json"), "--today", "2026-11-02"])
    assert rc == 0, out
    assert "WARN  G4  executions  56 executions, 1 failed; read the failed executions of: "            "Drift to ServiceNow - identity attributes changed (mover)" in out


def test_record_keeps_a_response_without_its_secret(tmp_path):
    workflow = rw.render(dc.load_settings(TEST, env={}), 1, secret="s3cret")
    workflow.update({"id": "wf-0000-0001"})
    out = io.StringIO()
    path = tmp_path / "evidence" / "workflow-1.json"
    assert record.main([str(path)], stdin=io.StringIO(json.dumps(workflow)), out=out) == 0
    kept = path.read_text(encoding="utf-8")
    assert "s3cret" not in kept and "[removed]" in kept
    assert "id=wf-0000-0001 name=Drift to ServiceNow - native change (provenance) enabled=False" in out.getvalue()
    assert dc.get_setting(str(path), "id") == "wf-0000-0001"


def test_record_stops_on_an_error_or_a_body_that_is_not_json(tmp_path):
    out = io.StringIO()
    assert record.main([str(tmp_path / "e.json")], stdin=io.StringIO('{"detailCode": "403 Forbidden"}'), out=out) == 1
    assert record.main([str(tmp_path / "t.json")], stdin=io.StringIO("<html>bad gateway</html>"), out=out) == 1
    assert "stop and read it" in out.getvalue()
