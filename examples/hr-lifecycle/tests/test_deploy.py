"""Chapter 08: the deployment runbook's settings check, pre-flight, smoke test and rollback, against
the fixtures in tests/fixtures/ch08. No tenant, no network.

    python -m pytest tests -q
"""
import copy
import csv
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
FX = KIT / "tests" / "fixtures" / "ch08"
sys.path.insert(0, str(KIT / "python"))
sys.path.insert(0, str(KIT / "deploy"))
import deploy_settings as ds  # noqa: E402
import preflight  # noqa: E402
import rollback  # noqa: E402
import smoke_test  # noqa: E402
from hrlc_core import HrlcError, read_json  # noqa: E402

sys.path.insert(0, str(KIT.parent / "hcm-entra" / "python"))
import hcm_to_scim  # noqa: E402

START = dt.date(2026, 11, 9)


def _settings(name="settings.test.json"):
    return read_json(FX / name)


def _write(path: Path, obj) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2), encoding="utf-8")
    return path


def _rules(rows, severity="Finding"):
    return sorted({r["Rule"] for r in rows if r["Severity"] == severity})


# ---------------------------------------------------------------- the settings file

def test_the_template_is_all_placeholders_and_the_fixture_is_clean():
    rows = ds.check(ds.load(KIT / "deploy" / "settings.example.json"))
    assert set(_rules(rows)) == {"DS-02", "DS-03"}
    assert ds.check(_settings()) == []
    assert ds.check(_settings("settings.production.json")) == []


def test_a_secret_in_the_settings_is_refused():
    s = _settings()
    s["identities"]["uploader"]["clientSecret"] = "abc"
    s["identities"]["reader"]["certificateName"] = "-----BEGIN PRIVATE KEY-----\nMIIE"
    s["hr"]["pod"] = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.sig"
    rows = [r for r in ds.check(s) if r["Rule"] == "DS-01"]
    assert len(rows) == 3


def test_production_needs_a_change_record_and_every_id():
    s = _settings("settings.production.json")
    s["changeRecord"] = ""
    del s["workflows"]["leaver"]
    assert set(_rules(ds.check(s))) == {"DS-04", "DS-05"}


def test_the_middleware_endpoint_follows_the_cloud_and_passes_the_middlewares_own_check():
    s = _settings()
    url = ds.endpoint(s, "employee")
    assert url.startswith("https://graph.microsoft.com/v1.0/servicePrincipals/33333333-3333-4333-8333-333333333301/")
    assert hcm_to_scim.validate_endpoint(url) == url
    s["cloud"] = "gcchigh"
    assert ds.endpoint(s, "contractor").startswith("https://graph.microsoft.us/")
    out = ds.middleware_settings(s, "employee", KIT.parent / "hcm-entra" / "config" / "settings.example.json")
    hcm_to_scim.validate_settings(out)


# ---------------------------------------------------------------- pre-flight

def _preflight_copy(tmp_path):
    dst = tmp_path / "pf"
    shutil.copytree(FX / "preflight", dst)
    return dst


def _run_pf(tmp_path, fixture, settings_name="settings.test.json", settings=None, evidence=None, mode="fixture"):
    path = FX / settings_name if settings is None else _write(tmp_path / "s.json", settings)
    rows, _ = preflight.run(path, mode, tmp_path / "out", fixture, KIT / "config" / "writer-register.json", evidence)
    return rows


def test_preflight_is_clean_on_the_fixture(tmp_path):
    rows = _run_pf(tmp_path, FX / "preflight")
    assert _rules(rows) == [] and _rules(rows, "Warn") == []
    assert {r["Rule"] for r in rows} == {"PF-01", "PF-02", "PF-03", "PF-04", "PF-05"}


def test_preflight_finds_a_running_job_a_schedule_a_missing_role_and_short_licenses(tmp_path):
    fx = _preflight_copy(tmp_path)
    job = read_json(fx / "jobs" / "employee" / "sync-job.json")
    job["value"][0]["status"]["code"] = "Active"
    job["value"][0]["synchronizationJobSettings"] = []
    _write(fx / "jobs" / "employee" / "sync-job.json", job)
    wf = read_json(fx / "deploy-workflows.json")
    wf["value"][3]["isSchedulingEnabled"] = True
    _write(fx / "deploy-workflows.json", wf)
    roles = read_json(fx / "role-eligibility.json")
    roles["value"] = [r for r in roles["value"] if r["roleDefinitionId"] != ds.ROLE_TEMPLATES["Identity Governance Administrator"]]
    _write(fx / "role-eligibility.json", roles)
    skus = read_json(fx / "subscribed-skus.json")
    skus["value"][1]["prepaidUnits"]["enabled"] = 10
    _write(fx / "subscribed-skus.json", skus)
    rows = _run_pf(tmp_path, fx)
    assert _rules(rows) == ["PF-01", "PF-02", "PF-04", "PF-05"]
    assert _rules(rows, "Warn") == ["PF-04"]


def test_a_bad_settings_file_stops_the_preflight_before_anything_is_read(tmp_path):
    s = _settings()
    s["cloud"] = "public"
    rows = _run_pf(tmp_path, tmp_path / "nowhere", settings=s)
    assert _rules(rows) == ["DS-03"]


def _smoke_evidence(tmp_path, phase="leaver", mode="fixture"):
    out = tmp_path / f"ev-{phase}-{mode}"
    ex = tmp_path / f"x-{phase}"
    if not (ex / "manifest.json").exists():
        smoke_test.main(["extract", "--workers", str(KIT / "deploy" / "smoke-workers.json"), "--start", START.isoformat(),
                         "--phase", phase, "--as-of", (START + dt.timedelta(days=2)).isoformat(), "--out", str(ex)])
    prev = tmp_path / "x-mover"
    if not (prev / "manifest.json").exists():
        smoke_test.main(["extract", "--workers", str(KIT / "deploy" / "smoke-workers.json"), "--start", START.isoformat(),
                         "--phase", "mover", "--as-of", (START + dt.timedelta(days=1)).isoformat(), "--out", str(prev)])
    rc = smoke_test.main(["check", "--settings", str(FX / "settings.test.json"), "--extract", str(ex / "smoke-extract.csv"),
                          "--previous-extract", str(prev / "smoke-extract.csv"), "--phase", phase,
                          "--as-of", (START + dt.timedelta(days=2)).isoformat(), "--since", "2026-11-11T00:00:00Z",
                          "--mode", "fixture", "--fixture", str(FX / "smoke" / "leaver"), "--out", str(out)])
    assert rc == 0
    return out


def test_production_preflight_needs_clean_test_evidence(tmp_path):
    rows = _run_pf(tmp_path, FX / "preflight", "settings.production.json")
    assert _rules(rows) == ["PF-06"]
    ev = _smoke_evidence(tmp_path)
    rows = _run_pf(tmp_path, FX / "preflight", "settings.production.json", evidence=ev)
    assert _rules(rows) == []
    tampered = tmp_path / "tampered"
    shutil.copytree(ev, tampered)
    (tampered / "findings.json").write_text("[]\n", encoding="utf-8")
    rows = _run_pf(tmp_path, FX / "preflight", "settings.production.json", evidence=tampered)
    assert _rules(rows) == ["PF-06"]


def test_production_preflight_refuses_fixture_evidence_for_a_tenant_run(tmp_path, monkeypatch):
    ev = _smoke_evidence(tmp_path)
    calls = []

    def fake_export(task, cloud_name, params, out_dir, token, opener=None):
        calls.append((task, cloud_name, dict(params), token))
        src = FX / "preflight" if task == "deploy-preflight" else FX / "preflight" / "jobs" / Path(out_dir).name
        shutil.copytree(src, out_dir, dirs_exist_ok=True)
    monkeypatch.setattr(preflight.graph_export, "export", fake_export)
    rows = _run_pf(tmp_path, None, "settings.production.json", evidence=ev, mode="tenant")
    pf06 = [r for r in rows if r["Rule"] == "PF-06"][0]
    assert pf06["Severity"] == "Finding" and "mode is fixture, not tenant" in pf06["Issue"]
    assert [c[0] for c in calls] == ["deploy-preflight", "deploy-job", "deploy-job"]
    assert calls[1][2] == {"servicePrincipalId": "33333333-3333-4333-8333-333333333301",
                           "jobId": "API2AAD.0000000000000000000000000000000a.33333333-3333-4333-8333-333333333301"}


# ---------------------------------------------------------------- the smoke test

def _extract(phase, days):
    return smoke_test.build_extract(read_json(KIT / "deploy" / "smoke-workers.json"), START, phase,
                                    START + dt.timedelta(days=days))


def test_the_synthetic_extract_moves_the_mover_and_separates_the_leaver():
    j, m, lv = _extract("joiner", 0), _extract("mover", 1), _extract("leaver", 2)
    assert [r["DepartmentCode"] for r in j] == ["ORG-100"] * 4
    assert m[2]["DepartmentCode"] == "ORG-210" and lv[2]["DepartmentCode"] == "ORG-210"
    assert lv[3]["AssignmentStatusType"] == "INACTIVE" and lv[3]["TerminationDate"] == "2026-11-11"
    assert j[1]["HireDate"] == "2026-11-10"
    with pytest.raises(HrlcError):
        _extract("leaver", 1)


def test_the_synthetic_extract_is_one_the_middleware_accepts(tmp_path):
    rows = _extract("leaver", 2)
    path = tmp_path / "x.csv"
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=smoke_test.EXTRACT_COLUMNS, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    mapping = read_json(KIT.parent / "hcm-entra" / "config" / "mapping.json")
    settings = hcm_to_scim.validate_settings(read_json(KIT.parent / "hcm-entra" / "config" / "settings.example.json"))
    result = hcm_to_scim.convert(hcm_to_scim.read_rows(path), mapping, settings, dt.date(2026, 11, 11))
    assert [o.status for o in result.outcomes] == ["ready"] * 4 and result.disables == 1


def test_expectations_follow_the_hr_record():
    exp = {e["employeeId"]: e for e in smoke_test.expectations(_extract("mover", 1), _extract("joiner", 0),
                                                               _settings()["scope"], START + dt.timedelta(days=1))}
    assert exp["990001"]["accountEnabled"] is True and exp["990001"]["workflows"] == ["day-one"]
    assert exp["990002"]["workflows"] == ["mover"]
    exp0 = {e["employeeId"]: e for e in smoke_test.expectations(_extract("joiner", 0), None, _settings()["scope"], START)}
    assert exp0["990001"]["accountEnabled"] is False and exp0["990001"]["workflows"] == ["pre-hire"]
    prod_scope = _settings("settings.production.json")["scope"]
    assert smoke_test.expectations(_extract("joiner", 0), None, prod_scope, START)  # ORG-100 is the first scope


def _smoke_copy(tmp_path, phase):
    dst = tmp_path / f"sm-{phase}"
    shutil.copytree(FX / "smoke" / phase, dst)
    return dst


def test_the_smoke_check_is_clean_on_each_phase():
    s = _settings()
    for phase, days, prev in (("joiner", 0, None), ("mover", 1, "joiner"), ("leaver", 2, "mover")):
        exp = smoke_test.expectations(_extract(phase, days), _extract(prev, days - 1) if prev else None, s["scope"],
                                      START + dt.timedelta(days=days))
        rows = smoke_test.check(exp, FX / "smoke" / phase, s, f"{(START + dt.timedelta(days=days)).isoformat()}T00:00:00Z")
        assert rows == [], phase


def test_the_smoke_check_finds_each_kind_of_failure(tmp_path):
    s = _settings()
    fx = _smoke_copy(tmp_path, "leaver")
    users = read_json(fx / "users.json")
    users["value"][3]["accountEnabled"] = True                       # the leaver is still enabled
    users["value"][2]["onPremisesExtensionAttributes"]["extensionAttribute10"] = "ORG-100"  # the move didn't land
    del users["value"][0]                                            # the manager has no account
    _write(fx / "users.json", users)
    _write(fx / "results" / "leaver.json", {"value": [
        {"processingStatus": "completed", "scheduledDateTime": "2026-11-11T15:00:00Z", "subject": {"id": "99999999-9999-4999-8999-999999999999"}}]})
    prov = read_json(fx / "provisioning" / "employee.json")
    prov["value"][1]["provisioningStatusInfo"]["status"] = "failure"   # the joiner's update failed
    del prov["value"][2]                                                # no log entry for the mover
    _write(fx / "provisioning" / "employee.json", prov)
    exp = smoke_test.expectations(_extract("leaver", 2), _extract("mover", 1), s["scope"], START + dt.timedelta(days=2))
    rows = smoke_test.check(exp, fx, s, "2026-11-11T00:00:00Z")
    assert _rules(rows) == ["SM-01", "SM-02", "SM-03", "SM-04", "SM-05", "SM-06"]
    assert _rules(rows, "Warn") == ["SM-07"]


def test_the_smoke_check_reads_the_tenant_with_gets_on_the_clouds_host(tmp_path, monkeypatch):
    s = _settings()
    seen = []

    def fake_fetch(url, host, headers, opener):
        seen.append((url, host, headers["Authorization"]))
        if "/users" in url:
            emp = re.search(r"employeeId%20eq%20'([0-9]+)'", url).group(1)
            return [u for u in read_json(FX / "smoke" / "joiner" / "users.json")["value"] if u["employeeId"] == emp]
        return []
    monkeypatch.setattr(smoke_test.graph_export, "fetch_all", fake_fetch)
    exp = smoke_test.expectations(_extract("joiner", 0), None, s["scope"], START)
    exports = smoke_test.export_tenant(s, exp, "2026-11-09T00:00:00Z", tmp_path, "test-token")
    assert all(h == "graph.microsoft.com" and a == "Bearer test-token" for _, h, a in seen)
    assert len(seen) == 4 + 5 + 2
    assert len(read_json(exports / "users.json")["value"]) == 4


# ---------------------------------------------------------------- rollback

def test_the_rollback_plan_pauses_and_unschedules_but_never_restarts_or_disables():
    s = _settings()
    steps, scopes = rollback.plan(s, None)
    text = rollback.script(s, steps, scopes)
    assert text.count("Suspend-MgServicePrincipalSynchronizationJob") == 2
    assert text.count("isSchedulingEnabled = $false") == 5
    assert "Restart" not in text and "isEnabled = $false" not in text and "Remove-MgUser" not in text
    assert "-Environment Global" in text and "if (-not $Apply)" in text
    s["cloud"] = "gcchigh"
    s["automaticAssignmentPolicies"] = ["aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa"]
    steps, scopes = rollback.plan(s, None)
    text = rollback.script(s, steps, scopes)
    assert "-Environment USGov " in text and "Remove-MgEntitlementManagementAssignmentPolicy" in text
    assert "EntitlementManagement.ReadWrite.All" in scopes


def _tenant_smoke(tmp_path, settings, users):
    d = tmp_path / "smoke-tenant"
    _write(d / "exports" / "users.json", {"value": users})
    _write(d / "manifest.json", {"task": "deploy-smoke", "tenantId": settings["tenantId"], "mode": "tenant"})
    return d


def test_rollback_removes_only_synthetic_accounts_and_only_in_test(tmp_path):
    s = _settings()
    users = read_json(FX / "smoke" / "leaver" / "users.json")["value"]
    steps, scopes = rollback.plan(s, _tenant_smoke(tmp_path, s, users))
    assert sum(1 for x in steps if x["run"].startswith("Remove-MgUser")) == 4 and "User.ReadWrite.All" in scopes
    real = copy.deepcopy(users[0])
    real["employeeId"] = "100001"
    shutil.rmtree(tmp_path / "smoke-tenant")
    with pytest.raises(HrlcError):
        rollback.plan(s, _tenant_smoke(tmp_path, s, users + [real]))
    p = _settings("settings.production.json")
    with pytest.raises(HrlcError):
        rollback.smoke_accounts(p, tmp_path / "smoke-tenant")


def test_rollback_verify_finds_a_running_job_and_a_schedule(tmp_path):
    s = _settings()
    assert _rules(rollback.verify(s, FX / "preflight")) == []
    fx = _preflight_copy(tmp_path)
    job = read_json(fx / "jobs" / "contractor" / "sync-job.json")
    job["value"][0]["status"]["code"] = "Active"
    _write(fx / "jobs" / "contractor" / "sync-job.json", job)
    wf = read_json(fx / "deploy-workflows.json")
    wf["value"][0]["isSchedulingEnabled"] = True
    _write(fx / "deploy-workflows.json", wf)
    assert _rules(rollback.verify(s, fx)) == ["RB-01", "RB-02"]
