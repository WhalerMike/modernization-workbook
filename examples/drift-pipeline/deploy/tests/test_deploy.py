"""Tests for the deployment runbook's scripts (Book 19, Chapter 10): the settings file, pre-flight, smoke test
and rollback. No tenant, no network: live probes run through a fake runner. Illustrative: unit-tested against
fixtures, not proven against a live tenant."""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(KIT / "deploy"))

import adm_deploy as ad  # noqa: E402
import evidence as ev  # noqa: E402
import preflight as pf  # noqa: E402
import rollback as rb  # noqa: E402
import smoke_test as sm  # noqa: E402

FX = KIT / "tests" / "fixtures"
TEST = KIT / "deploy" / "tests" / "fixtures" / "test.json"
PROD = KIT / "deploy" / "tests" / "fixtures" / "production.json"
TEMPLATE = KIT / "deploy" / "environment.example.json"
FIXTURE_RUN = FX / "runs" / "current" / "2026-10-29-0617-fixture-runner-fixture"
HCM = FX / "provenance" / "hcm-entra" / "provenance.json"
DYN = FX / "provenance" / "dynamic-rules" / "check-results.json"
MC = FX / "provenance" / "machine-configuration" / "provenance.json"


def settings(path: Path = TEST) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_settings(tmp_path: Path, data: dict, name: str = "s.json") -> Path:
    data = json.loads(json.dumps(data))
    data["evidence_dir"] = str(tmp_path / "evidence")
    p = tmp_path / name
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return p


def make_run(tmp_path: Path, statuses: dict[str, str], tenant: str, mode: str = "Live", cloud: str = "gcc") -> Path:
    run = tmp_path / "run"
    (run / "Results").mkdir(parents=True)
    results = [{"CheckId": c, "Track": c.split("-")[1], "Title": c, "Status": st, "Count": 0 if st == "Pass" else 1,
                "Message": "", "Details": [], "Evidence": []} for c, st in statuses.items()]
    body = json.dumps(results, indent=2).encode()
    (run / "Results" / "ValidationResults.json").write_bytes(body)
    manifest = {"Schema": "fmw-validation-kit/manifest/1", "RunId": "2026-11-02-0900-test", "ReadOnly": True,
                "Mode": mode, "Cloud": cloud, "TenantId": tenant, "AsOfUtc": "2026-11-02T09:00:00Z", "Options": {},
                "Files": [{"RelativePath": "Results/ValidationResults.json", "SHA256": hashlib.sha256(body).hexdigest()}]}
    (run / "ValidationManifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    return run


# ---------------------------------------------------------------- the settings file

def test_fixture_settings_load():
    s = ad.load_settings(TEST)
    assert s["environment"] == "test" and s["cloud"] == "gcc"
    assert ad.load_settings(PROD)["waves"][1]["id"] == "2"


def test_template_refused_until_filled_but_well_formed():
    with pytest.raises(ad.SettingsError, match="placeholder"):
        ad.load_settings(TEMPLATE)
    raw = settings(TEMPLATE)
    assert not ad.secret_problems(raw)
    assert len(ad.placeholder_problems(raw)) > 30
    assert set(ad.REQUIRED) <= {k for k in ad.REQUIRED if ad.get(raw, k) is not None}


@pytest.mark.parametrize("key,value", [
    ("client_secret", "abc"), ("password", "x"), ("sas_url", "https://x"), ("refresh_token", "x"),
    ("storage_connection_string", "x")])
def test_secret_keys_refused(tmp_path, key, value):
    data = settings()
    data["identities"]["deploy"][key] = value
    with pytest.raises(ad.SettingsError, match="looks like a secret"):
        ad.load_settings(write_settings(tmp_path, data))


@pytest.mark.parametrize("value", [
    "-----BEGIN PRIVATE KEY-----MIIE", "DefaultEndpointsProtocol=https;AccountKey=abc==",
    "https://st.blob.core.windows.net/c?sv=2024&sig=abc"])
def test_secret_values_refused(tmp_path, value):
    data = settings()
    data["drift"]["repository"] = value
    with pytest.raises(ad.SettingsError, match="looks like a secret"):
        ad.load_settings(write_settings(tmp_path, data))


def test_unknown_cloud_and_bad_guid_refused(tmp_path):
    data = settings()
    data["cloud"] = "usgov"
    data["tenant_id"] = "not-a-guid"
    with pytest.raises(ad.SettingsError) as exc:
        ad.load_settings(write_settings(tmp_path, data))
    assert "unknown cloud" in str(exc.value) and "isn't a GUID" in str(exc.value)


def test_production_needs_waves(tmp_path):
    data = settings(PROD)
    data["waves"] = []
    with pytest.raises(ad.SettingsError, match="at least one wave"):
        ad.load_settings(write_settings(tmp_path, data))


def test_env_bash_and_pwsh_quote_values():
    s = ad.load_settings(TEST)
    vals = ad.derived(s, TEST)
    bash, pwsh = ad.render(vals, "bash"), ad.render(vals, "pwsh")
    assert "export ADM_AZ_CLOUD=AzureCloud" in bash
    assert "export ADM_LCW_WORKFLOW_NAME='ADM leaver (test)'" in bash
    assert "$env:ADM_MG_ENV = 'Global'" in pwsh
    assert vals["ADM_MC_CONTENT_URI"] == "https://stadmmctest.blob.core.windows.net/machine-configuration"
    assert "$env:ADM_ARC_PLAYBOOK = 'playbooks/06_arc_onboarding_role.yml'" in pwsh
    assert vals["ADM_EVIDENCE_DIR"].replace("\\", "/").endswith("out/deploy-evidence/test/CHG-TEST-0101")
    quoted = ad.render({"X": "it's"}, "pwsh")
    assert quoted == "$env:X = 'it''s'"


def test_env_wave_overrides_ou_group_and_arc_wave():
    s = ad.load_settings(PROD)
    vals = ad.derived(s, PROD, "2")
    assert vals["ADM_TARGET_OU"] == "OU=Ledger,OU=Finance,DC=contoso,DC=example"
    assert vals["ADM_INTUNE_GROUP_ID"].endswith("612") and vals["ADM_ARC_WAVE"] == "1" and vals["ADM_WAVE"] == "2"
    with pytest.raises(ad.SettingsError, match="no wave"):
        ad.derived(s, PROD, "9")


def test_gcchigh_derives_government_values(tmp_path):
    data = settings()
    data["cloud"] = "gcchigh"
    vals = ad.derived(ad.load_settings(write_settings(tmp_path, data)), tmp_path / "s.json")
    assert vals["ADM_GRAPH"] == "https://graph.microsoft.us"
    assert vals["ADM_AZ_CLOUD"] == "AzureUSGovernment" and vals["ADM_MG_ENV"] == "USGov"
    assert vals["ADM_ARC_PLAYBOOK"] == "playbooks/02_arc_onboarding.yml"
    assert vals["ADM_MC_CONTENT_URI"] == "https://stadmmctest.blob.core.usgovcloudapi.net/machine-configuration"


def test_env_cli_refuses_template(capsys):
    assert ad.main(["env", "--settings", str(TEMPLATE), "--shell", "bash"]) == 1
    assert "placeholder" in capsys.readouterr().err


# ---------------------------------------------------------------- pre-flight

def results(report: pf.Report) -> dict[str, set[str]]:
    out: dict[str, set[str]] = {}
    for r in report.rows:
        out.setdefault(r["check"], set()).add(r["result"])
    return out


def test_preflight_test_fixture_passes_and_runs_nothing():
    calls = []
    report, _ = pf.preflight(TEST, other=PROD, runner=lambda c: calls.append(c) or (0, ""))
    assert not report.failed
    assert calls == []
    assert results(report)["PF-12"] == {"DRY"}


def test_preflight_cert_inside_repo_fails(tmp_path):
    data = settings()
    data["identities"]["deploy"]["certificate_pem"] = str(KIT / "deploy" / "adm.pem")
    report, _ = pf.preflight(write_settings(tmp_path, data))
    assert results(report)["PF-05"] == {"FAIL"}
    assert results(report)["PF-11"] == {"SKIP"}


def test_preflight_shared_tenant_fails(tmp_path):
    data = settings(PROD)
    data["tenant_id"] = settings()["tenant_id"]
    report, _ = pf.preflight(TEST, other=write_settings(tmp_path, data))
    assert results(report)["PF-09"] == {"FAIL"}


def test_preflight_gcchigh_warns(tmp_path):
    data = settings()
    data["cloud"] = "gcchigh"
    report, _ = pf.preflight(write_settings(tmp_path, data))
    assert "WARN" in results(report)["PF-04"] and not report.failed


def test_preflight_live_compares_probe_output(tmp_path):
    s = settings()
    answers = {"name": "AzureCloud", "tenantId": s["tenant_id"], "id": s["subscription_id"],
               "user.name": s["identities"]["deploy"]["client_id"]}

    def fake(cmd):
        if cmd[0] == "az":
            return 0, answers[cmd[cmd.index("--query") + 1]]
        return 0, "all present"
    report, _ = pf.preflight(TEST, live=True, runner=fake)
    r = results(report)
    assert r["PF-12"] == {"PASS"} and r["PF-15"] == {"PASS"}
    assert r["PF-16"] == {"FAIL"}  # the fixture's certificate paths don't exist on this machine
    answers["tenantId"] = "77777777-7777-4777-8777-777777777701"
    report, _ = pf.preflight(TEST, live=True, runner=fake)
    assert results(report)["PF-12"] == {"FAIL"}


def passing_test_report(tmp_path: Path) -> Path:
    s = settings()
    run = make_run(tmp_path, {c: "Pass" for c in s["smoke"]["required_pass"]} | {"VK-DG-03": "Error"}, s["tenant_id"])
    rep = sm.smoke(write_settings(tmp_path, s, "t.json"), kit_run=run)
    p = tmp_path / "smoke-report.json"
    p.write_text(json.dumps(rep, indent=2) + "\n", encoding="utf-8")
    return p


def passing_evidence_check(tmp_path: Path) -> Path:
    t = write_settings(tmp_path, settings(), "t.json")
    s = ad.load_settings(t)
    proof = tmp_path / "proof.txt"
    proof.write_text("evidence", encoding="utf-8")
    for step in {r["step"] for r in ev.rows_for("test")}:
        ev.add(s, t, step, f"step {step}", "pass", [proof])
    chk = ev.check(s, t)
    assert chk["result"] == "pass", chk
    p = tmp_path / "evidence-check.json"
    p.write_text(json.dumps(chk, indent=2) + "\n", encoding="utf-8")
    return p


def test_preflight_production_promotes_only_on_matching_live_pass(tmp_path):
    report_file = passing_test_report(tmp_path)
    check_file = passing_evidence_check(tmp_path)
    data = settings(PROD)
    data["promotion"]["test_smoke_report_sha256"] = ad.sha256_file(report_file)
    data["promotion"]["test_evidence_check_sha256"] = ad.sha256_file(check_file)
    prod = write_settings(tmp_path, data, "p.json")
    report, _ = pf.preflight(prod, smoke=report_file, evidence_check=check_file)
    assert results(report)["PF-10"] == {"PASS"}
    report, _ = pf.preflight(prod, smoke=report_file)
    assert results(report)["PF-10"] == {"FAIL"}  # no evidence check
    data["promotion"]["approvals"] = data["promotion"]["approvals"][:1]
    report, _ = pf.preflight(write_settings(tmp_path, data, "p2.json"), smoke=report_file, evidence_check=check_file)
    assert results(report)["PF-10"] == {"FAIL"}
    report, _ = pf.preflight(prod, smoke=None, evidence_check=check_file)
    assert results(report)["PF-10"] == {"FAIL"}


def test_preflight_cli_writes_json(tmp_path, capsys):
    assert pf.main(["--settings", str(TEST), "--out", str(tmp_path)]) == 0
    doc = json.loads((tmp_path / "preflight.json").read_text(encoding="utf-8"))
    assert doc["result"] == "pass" and doc["live"] is False
    assert "dry run" in capsys.readouterr().out


# ---------------------------------------------------------------- smoke test

def test_smoke_passes_a_live_run_with_required_checks(tmp_path):
    s = settings()
    run = make_run(tmp_path, {"VK-HR-01": "Pass", "VK-DG-01": "Pass", "VK-CA-01": "Pass", "VK-DG-03": "Error"},
                   s["tenant_id"])
    rep = sm.smoke(TEST, kit_run=run, dyn=DYN, mc=MC, mc_mode="Audit")
    assert rep["result"] == "pass" and not rep["fixture"]
    assert set(rep["inputs"]) == {"kit_run_manifest", "dynamic_rules", "mc_provenance"}


def test_smoke_refuses_wrong_tenant_cloud_or_fixture_mode(tmp_path):
    run = make_run(tmp_path, {"VK-HR-01": "Pass", "VK-DG-01": "Pass", "VK-CA-01": "Pass"},
                   "77777777-7777-4777-8777-777777777701", mode="Fixture", cloud="gcchigh")
    rep = sm.smoke(TEST, kit_run=run)
    failed = {r["check"] for r in rep["rows"] if r["result"] == "FAIL"}
    assert {"SM-02", "SM-03", "SM-04"} <= failed


def test_smoke_unexpected_error_and_missing_check_fail(tmp_path):
    s = settings()
    run = make_run(tmp_path, {"VK-HR-01": "Pass", "VK-DG-01": "Pass", "VK-NPI-03": "Error"}, s["tenant_id"])
    rep = sm.smoke(TEST, kit_run=run)
    msgs = [r["message"] for r in rep["rows"] if r["result"] == "FAIL"]
    assert "VK-CA-01 not run" in msgs and any("VK-NPI-03" in m for m in msgs)


def test_smoke_edited_run_refused(tmp_path):
    s = settings()
    run = make_run(tmp_path, {"VK-HR-01": "Pass"}, s["tenant_id"])
    (run / "Results" / "ValidationResults.json").write_text("[]", encoding="utf-8")
    rep = sm.smoke(TEST, kit_run=run)
    assert rep["rows"][0]["check"] == "SM-01" and rep["rows"][0]["result"] == "FAIL"


def test_smoke_fixture_run_in_fixture_mode(tmp_path):
    rep = sm.smoke(TEST, kit_run=FIXTURE_RUN, hcm=HCM, fixture=True)
    rows = {(r["check"], r["result"]) for r in rep["rows"]}
    assert ("SM-02", "PASS") in rows and ("SM-08", "FAIL") in rows  # nine quarantined against a limit of 0
    assert rep["result"] == "fail" and rep["fixture"] is True


def test_smoke_held_hcm_run_fails(tmp_path):
    data = json.loads(HCM.read_text(encoding="utf-8"))
    data["held"] = True
    held = tmp_path / "provenance.json"
    held.write_text(json.dumps(data), encoding="utf-8")
    rep = sm.smoke(TEST, hcm=held)
    assert ("SM-07", "FAIL") in {(r["check"], r["result"]) for r in rep["rows"]}


def test_smoke_needs_an_input():
    with pytest.raises(ad.SettingsError, match="at least one input"):
        sm.smoke(TEST)


def test_smoke_cli_writes_report_and_exit_code(tmp_path, capsys):
    code = sm.main(["--settings", str(TEST), "--fixture", "--kit-run", str(FIXTURE_RUN), "--out", str(tmp_path)])
    assert code == 2
    assert json.loads((tmp_path / "smoke-report.json").read_text(encoding="utf-8"))["result"] == "fail"
    assert "NO-GO" in capsys.readouterr().out


# ---------------------------------------------------------------- rollback

def recorded(tmp_path: Path, base: Path, entries: list[tuple[str, str, str, str]]) -> tuple[dict, Path]:
    p = write_settings(tmp_path, settings(base), base.name)
    s = ad.load_settings(p)
    for kind, ident, name, note in entries:
        rb.add(s, p, kind, ident, name, note, when="2026-11-02T10:00:00Z")
    return s, p


def test_rollback_plan_newest_first_and_test_removes(tmp_path):
    s, p = recorded(tmp_path, TEST, [
        ("dynamic-group", "g1", "", ""), ("lcw-workflow", "w1", "", ""), ("intune-policy", "i1", "Baseline", "")])
    steps = rb.plan(s, rb.load_record(rb.record_path(s, p)))
    assert [st["seq"] for st in steps] == [3, 2, 2, 1]
    assert "DELETE" in steps[0]["step"] and "Remove-MgGroup" in steps[-1]["step"]


def test_rollback_production_reenables_never_deletes(tmp_path):
    s, p = recorded(tmp_path, PROD, [
        ("dynamic-group", "g1", "", ""), ("gpo-link-disabled", "FMP-Workstation-Baseline", "OU=Pilot,DC=contoso,DC=example", ""),
        ("intune-policy", "i1", "Baseline", ""), ("retention-policy", "drift-evidence", "stadmevidence", "locked"),
        ("lcw-workflow", "w1", "", "")])
    steps = rb.plan(s, rb.load_record(rb.record_path(s, p)))
    text = "\n".join(st["step"] for st in steps)
    assert "Remove-MgGroup" not in text and "Remove-MgIdentityGovernanceLifecycleWorkflow" not in text
    assert "MembershipRuleProcessingState" not in text
    assert any(st["where"] == "portal" and "remove g1" in st["step"] and "don't pause or delete" in st["step"]
               for st in steps)
    assert "-LinkEnabled Yes" in text
    assert any(st["where"] == "portal" and "Assignments > Edit" in st["step"] for st in steps)
    assert any("can't be deleted or shortened" in st["step"] for st in steps)


def test_rollback_scripts_sign_in_with_certificate_and_hold_no_secret(tmp_path):
    s, p = recorded(tmp_path, TEST, [("gpo-link-created", "FMP-Workstation-Baseline", "OU=ADM-Test,DC=test,DC=contoso,DC=example", ""),
                                     ("arc-server", "arc-test-01", "", ""), ("provisioning-job", "job1", "", "")])
    steps = rb.plan(s, rb.load_record(rb.record_path(s, p)))
    files = rb.write_plan(s, steps, tmp_path / "plan")
    cloud = files["cloud"].read_text(encoding="utf-8")
    assert "-CertificateThumbprint" in cloud and "--certificate" in cloud
    assert not ad.SECRET_VALUE.search(cloud) and "secret" not in cloud.lower()
    assert "Set-GPLink" in files["ad"].read_text(encoding="utf-8")
    assert "azcmagent disconnect" in files["manual"].read_text(encoding="utf-8")


def test_rollback_refuses_unknown_kind_and_other_stage(tmp_path):
    s, p = recorded(tmp_path, TEST, [("dynamic-group", "g1", "", "")])
    with pytest.raises(rb.RecordError, match="unknown kind"):
        rb.add(s, p, "dns-zone", "z1")
    rec = rb.load_record(rb.record_path(s, p))
    prod = ad.load_settings(PROD)
    with pytest.raises(rb.RecordError, match="the settings are production"):
        rb.plan(prod, rec)


def test_rollback_cli_plan_runs_nothing(tmp_path, capsys):
    s, p = recorded(tmp_path, TEST, [("policy-assignment", "adm-mc-audit", "/subscriptions/x/resourceGroups/rg", "")])
    assert rb.main(["plan", "--settings", str(p), "--out", str(tmp_path / "out")]) == 0
    out = capsys.readouterr().out
    assert "nothing was run" in out and "Remove-AzPolicyAssignment" in out
    assert rb.main(["kinds"]) == 0


def test_smoke_record_check_uses_rollback_kinds(tmp_path):
    s, p = recorded(tmp_path, TEST, [("dynamic-group", "g1", "", "")])
    rep = sm.smoke(p, record=rb.record_path(s, p))
    assert rep["result"] == "pass"
    rec = json.loads(rb.record_path(s, p).read_text(encoding="utf-8"))
    rec["entries"].append(dict(rec["entries"][0], seq=2, kind="dns-zone"))
    rb.record_path(s, p).write_text(json.dumps(rec), encoding="utf-8")
    rep = sm.smoke(p, record=rb.record_path(s, p))
    assert ("SM-13", "FAIL") in {(r["check"], r["result"]) for r in rep["rows"]}


# ---------------------------------------------------------------- evidence records

def test_requirements_use_only_ksis_the_workbook_cites():
    cited = {"KSI-IAM-AAM", "KSI-IAM-APM", "KSI-IAM-ELP", "KSI-IAM-JIT", "KSI-IAM-SNU", "KSI-IAM-SUS", "KSI-CMT-LMC",
             "KSI-CMT-RMV", "KSI-CMT-RVP", "KSI-CMT-VTD", "KSI-MLA-EVC", "KSI-MLA-LET", "KSI-MLA-OSM", "KSI-MLA-RVL",
             "KSI-SVC-ACM", "KSI-SVC-VRI", "KSI-PIY-GIV", "KSI-PIY-RIS", "KSI-CED-RAT", "KSI-INR-RIR"}
    rows = ev.requirements()
    assert {k for r in rows for k in r["ksis"]} <= cited
    assert all(r["controls"] and r["ksis"] and r["evidence"] for r in rows)
    assert len({r["id"] for r in rows}) == len(rows)


def test_evidence_record_carries_controls_ksis_and_hashes(tmp_path):
    p = write_settings(tmp_path, settings())
    s = ad.load_settings(p)
    f = tmp_path / "vk.json"
    f.write_text("{}", encoding="utf-8")
    rec_path = ev.add(s, p, "baseline", "Invoke-ValidationKit.ps1", "pass", [f], when="2026-11-02T10:00:00Z")
    rec = json.loads(rec_path.read_text(encoding="utf-8"))
    assert rec_path.name == "001-baseline.json"
    assert rec["controls"] == ["AC-3", "CA-7", "CM-2"] and "KSI-MLA-EVC" in rec["ksis"] and rec["mandates"] == ["BOD 25-01"]
    assert rec["files"][0]["sha256"] == ad.sha256_file(f)
    sums = (rec_path.parent / "SHA256SUMS").read_text(encoding="utf-8")
    assert f"{ad.sha256_file(rec_path)}  001-baseline.json" in sums


def test_evidence_refuses_unknown_step_result_or_file(tmp_path):
    p = write_settings(tmp_path, settings())
    s = ad.load_settings(p)
    with pytest.raises(ev.EvidenceError, match="unknown step"):
        ev.add(s, p, "dns", "x", "pass")
    with pytest.raises(ev.EvidenceError, match="result"):
        ev.add(s, p, "hr", "x", "ok")
    with pytest.raises(ev.EvidenceError, match="no such file"):
        ev.add(s, p, "hr", "x", "pass", [tmp_path / "missing.json"])


def test_evidence_check_finds_missing_failed_changed_and_fixture(tmp_path):
    p = write_settings(tmp_path, settings())
    s = ad.load_settings(p)
    chk = ev.check(s, p)
    assert chk["result"] == "fail" and chk["missing"] == len(ev.rows_for("test"))
    f = tmp_path / "out.json"
    f.write_text("1", encoding="utf-8")
    for step in {r["step"] for r in ev.rows_for("test")}:
        ev.add(s, p, step, step, "pass", [f])
    assert ev.check(s, p)["result"] == "pass"
    ev.add(s, p, "hr", "smoke", "fail")
    ev.add(s, p, "hr", "rollback add", "recorded")  # a later 'recorded' doesn't hide the failure
    assert {r["id"] for r in ev.check(s, p)["rows"] if r["status"] != "evidenced"} == {"R-HR-1", "R-HR-2"}
    ev.add(s, p, "hr", "smoke again", "pass")
    assert ev.check(s, p)["result"] == "pass"
    f.write_text("2", encoding="utf-8")
    assert ev.check(s, p)["result"] == "fail"  # a cited file changed
    f.write_text("1", encoding="utf-8")
    ev.add(s, p, "smoke", "fixture", "pass", details={"fixture": True})
    assert any("fixture" in x for r in ev.check(s, p)["rows"] for x in r["problems"])


def test_evidence_check_detects_an_edited_record(tmp_path):
    p = write_settings(tmp_path, settings())
    s = ad.load_settings(p)
    rec = ev.add(s, p, "preflight", "preflight.py", "pass")
    rec.write_text(rec.read_text(encoding="utf-8").replace('"pass"', '"fail"'), encoding="utf-8")
    assert ev.check(s, p)["sums_problems"] == ["001-preflight.json doesn't match its SHA-256"]


def test_production_rows_add_promotion_waves_and_monitoring():
    test_steps = {r["step"] for r in ev.rows_for("test")}
    prod_steps = {r["step"] for r in ev.rows_for("production")}
    assert {"promotion", "waves", "monitor"} <= prod_steps and not {"promotion", "waves", "monitor"} & test_steps
    assert "R-DR-2" in {r["id"] for r in ev.rows_for("production")}


def test_scripts_write_their_own_evidence(tmp_path, capsys):
    p = write_settings(tmp_path, settings())
    s = ad.load_settings(p)
    assert pf.main(["--settings", str(p), "--out", str(tmp_path / "pf")]) == 0
    rb.main(["add", "--settings", str(p), "--kind", "dynamic-group", "--id", "g1"])
    rb.main(["plan", "--settings", str(p)])
    sm.main(["--settings", str(p), "--fixture", "--kit-run", str(FIXTURE_RUN), "--out", str(tmp_path / "sm")])
    names = [r["_file"] for r in ev.records(ev.evidence_dir(s, p))]
    assert names == ["001-preflight.json", "002-rules.json", "003-rollback.json", "004-smoke.json"]
    assert "evidence 004-smoke.json" in capsys.readouterr().out


def test_table_prints_the_chapter_rows():
    t = ev.table("production", "drift")
    assert t.splitlines()[0] == "| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |"
    assert "KSI-MLA-OSM" in t and "KSI-MLA-OSM" not in ev.table("test", "drift")


def test_recorded_changes_alone_dont_evidence_a_step(tmp_path):
    p = write_settings(tmp_path, settings())
    s = ad.load_settings(p)
    ev.add(s, p, "rules", "rollback.py add", "recorded")
    row = next(r for r in ev.check(s, p)["rows"] if r["id"] == "R-DG-1")
    assert row["status"] == "missing" and "no passing record" in row["problems"][0]
    f = tmp_path / "dr.json"
    f.write_text("{}", encoding="utf-8")
    rec = json.loads(ev.add(s, p, "rules", "evaluate", "pass", [f]).read_text(encoding="utf-8"))
    assert rec["files"][0]["path"] == "../../../dr.json"
    assert next(r for r in ev.check(s, p)["rows"] if r["id"] == "R-DG-1")["status"] == "evidenced"
