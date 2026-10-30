"""Tests for pa_evidence.py (developer workbook Building Privileged Access, Chapter 08): two fictional
evidence runs written by examples/privileged-access/Invoke-PaEvidenceRun.ps1, compared, drafted,
packaged, verified and assembled into a period. No tenant and no network. Illustrative."""
from __future__ import annotations

import copy
import hashlib
import json
import shutil
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "python"))

import pa_evidence as pa  # noqa: E402
import workflow_lint as w  # noqa: E402
from drift_pipeline import DriftError  # noqa: E402

RUNS = KIT / "tests" / "fixtures" / "pa-runs"
DAY1 = RUNS / "2026-10-29T0600Z-fixture"
DAY2 = RUNS / "2026-10-30T0600Z-fixture"
TENANT = "11111111-1111-4111-8111-111111111111"
HANK = "a0000000-0000-4000-8000-000000000020"
PRA = "e8611ab8-c189-46e8-94e1-60213ab1f814"


@pytest.fixture(scope="module")
def runs():
    return pa.load_pa_run(DAY1), pa.load_pa_run(DAY2)


@pytest.fixture(scope="module")
def day2(runs):
    return pa.compare_pa(*runs)


def copy_run(src: Path, tmp_path: Path) -> Path:
    dest = tmp_path / src.name
    shutil.copytree(src, dest)
    return dest


def rehash_manifest(run: Path, folder: str) -> None:
    """Rewrite run.json's hash for a task manifest the test edited, so only the edit is wrong."""
    index = json.loads((run / "run.json").read_text(encoding="utf-8"))
    task = next(k for k, v in index["tasks"].items() if v["folder"] == folder)
    index["tasks"][task]["manifestSha256"] = hashlib.sha256((run / folder / "manifest.json").read_bytes()).hexdigest()
    (run / "run.json").write_text(json.dumps(index, indent=2), encoding="utf-8")


def names_in(*loaded) -> set[str]:
    out = set()
    for run in loaded:
        for r in run["tasks"]["inventory"]["rows"]:
            out |= {str(r.get(k)) for k in ("PrincipalName", "UserPrincipalName") if r.get(k)}
        for f in run["tasks"]["emergency-access"]["findings"]:
            if "@" in str(f.get("Object", "")):
                out.add(f["Object"])
    return out


# ---------------------------------------------------------------- loading a run

def test_both_fixture_runs_load_with_tenant_window_and_status(runs):
    a, b = runs
    assert (a["tenant_id"], a["cloud"], a["mode"]) == (TENANT, "gcc", "Fixture")
    assert a["window"] == {"since": "2026-10-28T06:00:00Z", "until": "2026-10-29T06:00:00Z"}
    assert b["window"]["since"] == a["window"]["until"]
    assert set(b["status"].values()) == {"OK"}


def test_an_empty_findings_file_from_powershell_reads_as_no_findings(runs):
    # Day 1's audit window has no findings; the file Chapter 08 writes is "[]".
    assert runs[0]["tasks"]["pim-audit"]["findings"] == []


def test_an_edited_file_is_refused(tmp_path):
    run = copy_run(DAY2, tmp_path)
    p = run / "emergency" / "findings.json"
    p.write_bytes(p.read_bytes().replace(b"PA-EA-10", b"PA-EA-11"))
    with pytest.raises(DriftError, match="doesn't match the SHA-256 in its manifest"):
        pa.load_pa_run(run)


def test_an_added_file_is_refused(tmp_path):
    run = copy_run(DAY2, tmp_path)
    (run / "inventory" / "notes.txt").write_text("x", encoding="utf-8")
    with pytest.raises(DriftError, match="files differ"):
        pa.load_pa_run(run)


def test_an_edited_manifest_is_refused_by_run_json(tmp_path):
    run = copy_run(DAY2, tmp_path)
    p = run / "pim-audit" / "manifest.json"
    p.write_bytes(p.read_bytes() + b" ")
    with pytest.raises(DriftError, match="doesn't match the SHA-256 in run.json"):
        pa.load_pa_run(run)


def test_a_write_request_in_a_manifest_is_refused(tmp_path):
    run = copy_run(DAY2, tmp_path)
    p = run / "pim-audit" / "manifest.json"
    m = json.loads(p.read_text(encoding="utf-8"))
    m["requests"][0]["method"] = "POST"
    p.write_text(json.dumps(m), encoding="utf-8")
    rehash_manifest(run, "pim-audit")
    with pytest.raises(DriftError, match="only reads"):
        pa.load_pa_run(run)


def test_a_task_manifest_from_another_tenant_is_refused(tmp_path):
    run = copy_run(DAY2, tmp_path)
    p = run / "pim-audit" / "manifest.json"
    m = json.loads(p.read_text(encoding="utf-8"))
    m["tenantId"] = "99999999-9999-4999-8999-999999999999"
    p.write_text(json.dumps(m), encoding="utf-8")
    rehash_manifest(run, "pim-audit")
    with pytest.raises(DriftError, match="records tenant"):
        pa.load_pa_run(run)


def test_a_failed_task_must_leave_no_folder(tmp_path):
    run = copy_run(DAY2, tmp_path)
    index = json.loads((run / "run.json").read_text(encoding="utf-8"))
    index["tasks"]["emergency-access"] = {"folder": "emergency", "status": "Error", "message": "403"}
    (run / "run.json").write_text(json.dumps(index), encoding="utf-8")
    with pytest.raises(DriftError, match="left a folder"):
        pa.load_pa_run(run)
    shutil.rmtree(run / "emergency")
    loaded = pa.load_pa_run(run)
    assert loaded["status"]["emergency-access"] == "Error" and "emergency-access" not in loaded["tasks"]


def test_a_run_without_a_tenant_id_is_refused(tmp_path):
    run = copy_run(DAY1, tmp_path)
    index = json.loads((run / "run.json").read_text(encoding="utf-8"))
    index["tenantId"] = ""
    (run / "run.json").write_text(json.dumps(index), encoding="utf-8")
    with pytest.raises(DriftError, match="no tenant ID"):
        pa.load_pa_run(run)


# ---------------------------------------------------------------- comparing

def test_the_first_run_is_a_baseline(runs):
    r = pa.compare_pa(None, runs[0])
    assert r["baseline"] and r["counts"]["new"] == 26 and r["counts"]["incidents"] == 0


def test_day_two_counts(day2):
    c = day2["counts"]
    assert (c["new"], c["changed"], c["resolved"], c["unchanged"], c["unverified"]) == (2, 0, 6, 20, 0)
    assert (c["assignments_added"], c["assignments_removed"], c["assignments_changed"]) == (1, 1, 0)
    assert (c["audit"], c["coverage_gaps"], c["incidents"]) == (3, 0, 6)
    assert day2["drift"]


def test_the_new_standing_tier0_assignment_is_an_incident(day2):
    added = [i for i in day2["incidents"] if i["kind"] == "assignment added"]
    assert [(i["role_id"], i["principal_id"], i["state"], i["tier"]) for i in added] == [(PRA, HANK, "ActivePermanent", "T0")]


def test_a_removed_tier0_eligibility_is_an_incident_too(day2):
    removed = [i for i in day2["incidents"] if i["kind"] == "assignment removed"]
    assert [(i["role"], i["state"]) for i in removed] == [("Global Administrator", "EligiblePermanent")]


def test_audit_findings_are_tier0_incidents(day2):
    assert sorted(i["rule"] for i in day2["incidents"] if i["kind"] == "audit") == ["PA-AUD-01", "PA-AUD-02", "PA-AUD-04"]


def test_resolved_emergency_findings(day2):
    assert sorted(e["rule"] for e in day2["resolved"] if e["task"] == "emergency-access") == ["PA-EA-07", "PA-EA-08", "PA-EA-08"]


def test_emergency_rules_are_tier0_whatever_the_row_says(day2):
    assert {e["tier"] for e in day2["resolved"] + day2["unchanged"] if e["rule"].startswith("PA-EA-")} == {"T0"}


def test_the_same_finding_has_the_same_fingerprint_in_both_runs(runs, day2):
    before = pa.compare_pa(None, runs[0])
    first = {e["fingerprint"] for e in before["new"]}
    assert {e["fingerprint"] for e in day2["unchanged"]} <= first


def test_activations_are_not_assignment_drift(runs):
    a, b = copy.deepcopy(runs[0]), copy.deepcopy(runs[1])
    b["tasks"]["inventory"]["rows"] = [r for r in b["tasks"]["inventory"]["rows"] if r["State"] != "Activated"]
    r = pa.compare_pa(a, b)
    assert all(x["state"] != "Activated" for x in r["assignments"]["removed"])
    assert r["counts"]["assignments_removed"] == 1


def test_a_task_that_failed_leaves_its_findings_unverified_not_resolved(runs):
    a, b = runs[0], copy.deepcopy(runs[1])
    del b["tasks"]["emergency-access"]
    b["status"]["emergency-access"] = "Error"
    r = pa.compare_pa(a, b)
    u = [x for x in r["unverified"] if x["task"] == "emergency-access"]
    assert len(u) == 1 and len(u[0]["findings"]) == 9
    assert not [e for e in r["resolved"] if e["task"] == "emergency-access"]


def test_a_failed_audit_read_is_a_coverage_gap(runs):
    b = copy.deepcopy(runs[1])
    del b["tasks"]["pim-audit"]
    b["status"]["pim-audit"] = "Error"
    r = pa.compare_pa(runs[0], b)
    assert r["counts"]["coverage_gaps"] == 1 and r["drift"]


def test_a_gap_between_audit_windows_is_reported(runs):
    b = copy.deepcopy(runs[1])
    b["window"]["since"] = "2026-10-29T12:00:00Z"
    r = pa.compare_pa(runs[0], b)
    assert r["coverage_gaps"] == [{"since": "2026-10-29T06:00:00Z", "until": "2026-10-29T12:00:00Z",
                                   "reason": "no audit window covers this time: activations in it aren't evidenced"}]


def test_runs_of_two_tenants_are_refused_unless_overridden(runs):
    b = copy.deepcopy(runs[1])
    b["tenant_id"] = "99999999-9999-4999-8999-999999999999"
    with pytest.raises(DriftError, match="tenant differs"):
        pa.compare_pa(runs[0], b)
    assert "allow-tenant-mismatch" in pa.compare_pa(runs[0], b, allow_tenant_mismatch=True)["notes"][0]


@pytest.mark.parametrize("key,value,message", [("mode", "Live", "mode differs"), ("cloud", "gcchigh", "cloud differs"),
                                                ("as_of", "2026-10-28T06:00:00Z", "isn't later")])
def test_runs_that_cant_be_compared_are_refused(runs, key, value, message):
    b = copy.deepcopy(runs[1])
    b[key] = value
    with pytest.raises(DriftError, match=message):
        pa.compare_pa(runs[0], b)


# ---------------------------------------------------------------- drafts without names

def test_drafts_carry_no_names(runs, day2):
    text = json.dumps(pa.issue_drafts_pa(day2))
    names = names_in(*runs)
    assert names and not [n for n in names if n in text]
    assert "contoso" not in text.lower()


def test_names_appear_only_when_asked(runs, day2):
    text = json.dumps(pa.issue_drafts_pa(day2, include_names=True))
    assert "hank.soto@contoso.example" in text


def test_drafts_open_incidents_first_and_close_resolved(day2):
    d = pa.issue_drafts_pa(day2)
    assert [x["labels"] for x in d[:6]] == [["drift", "incident", "tier0"]] * 6
    assert sum(x["action"] == "close" and "resolved" in x["title"] for x in d) == 6
    fps = [x["fingerprint"] for x in d if x["action"] == "open"]
    assert len(fps) == len(set(fps))
    for x in d:
        assert x["fingerprint"] in x["body"] or x["action"] == "close"


def test_a_baseline_opens_one_summary(runs):
    d = pa.issue_drafts_pa(pa.compare_pa(None, runs[0]))
    assert [x["labels"] for x in d if x["action"] == "open"] == [["drift", "baseline"]]


# ---------------------------------------------------------------- packages and the chain

@pytest.fixture()
def evidence(tmp_path, runs):
    base = pa.compare_pa(None, runs[0])
    p1 = pa.package_pa(DAY1, base, tmp_path / "evidence")
    p2 = pa.package_pa(DAY2, pa.compare_pa(*runs), tmp_path / "evidence", previous_manifest=p1 / pa.EVIDENCE_MANIFEST)
    return tmp_path, p1, p2


def test_packages_verify_and_chain(evidence):
    _, p1, p2 = evidence
    v1, v2 = pa.verify_pa(p1), pa.verify_pa(p2)
    m2 = json.loads((p2 / pa.EVIDENCE_MANIFEST).read_text(encoding="utf-8"))
    assert m2["previous"] == {"run_id": p1.name, "evidence_manifest_sha256": v1["evidence_manifest_sha256"]}
    assert m2["tenant_id"] == TENANT and m2["audit_window"]["since"] == "2026-10-29T06:00:00Z"
    assert v2["files"] == 15


def test_packages_are_reproducible(tmp_path, runs):
    r = pa.compare_pa(None, runs[0])
    a = pa.package_pa(DAY1, r, tmp_path / "a")
    b = pa.package_pa(DAY1, r, tmp_path / "b")
    assert (a / pa.EVIDENCE_MANIFEST).read_bytes() == (b / pa.EVIDENCE_MANIFEST).read_bytes()


def test_a_package_is_written_once(evidence, runs):
    tmp, _, _ = evidence
    with pytest.raises(DriftError, match="written once"):
        pa.package_pa(DAY1, pa.compare_pa(None, runs[0]), tmp / "evidence")


def test_a_compared_run_needs_the_previous_manifest(tmp_path, runs):
    with pytest.raises(DriftError, match="chain the packages"):
        pa.package_pa(DAY2, pa.compare_pa(*runs), tmp_path)


def test_a_report_from_another_run_is_refused(tmp_path, runs):
    with pytest.raises(DriftError, match="different run"):
        pa.package_pa(DAY1, pa.compare_pa(*runs), tmp_path)


def test_verify_finds_a_changed_file(evidence):
    _, _, p2 = evidence
    f = p2 / "drift" / "pa-drift-summary.md"
    f.write_text(f.read_text(encoding="utf-8") + "edited\n", encoding="utf-8")
    with pytest.raises(DriftError, match="pa-drift-summary.md doesn't match"):
        pa.verify_pa(p2)


def test_sha256sums_lists_every_file_in_sha256sum_format(evidence):
    _, _, p2 = evidence
    lines = (p2 / "SHA256SUMS").read_text(encoding="utf-8").splitlines()
    assert len(lines) == 15 and all(len(l.split("  ", 1)[0]) == 64 for l in lines)
    assert lines[-1].endswith("  EVIDENCE-MANIFEST.json")


# ---------------------------------------------------------------- the period for the ISSO

def test_the_period_metrics_and_gate4(evidence):
    tmp, _, _ = evidence
    dest, m = pa.period(tmp / "evidence", "2026-10-28T06:00:00Z", "2026-10-30T06:00:00Z", tmp / "periods")
    x = m["metrics"]
    assert (x["activations"], x["activations_by_tier"]["T0"], x["activations_by_tier"]["T1"]) == (3, 2, 1)
    assert (x["requests"], x["approved"], x["denied"], x["t0_t1_activations_without_approval"]) == (4, 2, 1, 1)
    assert (m["chain_breaks"], m["coverage_gaps"], x["incidents"]) == ([], [], 6)
    assert [c["status"] for c in m["gate4"]][:2] == ["not met: standing privilege outside the exceptions list", "not met"]
    assert not m["complete"]
    assert "@" not in (dest / "period-summary.md").read_text(encoding="utf-8")


def test_a_missing_day_is_a_coverage_gap(evidence):
    tmp, p1, _ = evidence
    shutil.rmtree(p1)
    _, m = pa.period(tmp / "evidence", "2026-10-28T06:00:00Z", "2026-10-30T06:00:00Z", tmp / "periods")
    assert m["coverage_gaps"] == [{"since": "2026-10-28T06:00:00Z", "until": "2026-10-29T06:00:00Z"}]


def test_a_replaced_package_breaks_the_chain(evidence, runs):
    tmp, p1, _ = evidence
    shutil.rmtree(p1)
    pa.package_pa(DAY1, pa.compare_pa(None, runs[0]), tmp / "evidence", metadata={"github_run_id": "2"})
    _, m = pa.period(tmp / "evidence", "2026-10-28T06:00:00Z", "2026-10-30T06:00:00Z", tmp / "periods")
    assert [b["run_id"] for b in m["chain_breaks"]] == ["2026-10-30T0600Z-fixture"]


# ---------------------------------------------------------------- the command line and the workflow

def test_cli_exit_codes(tmp_path):
    assert pa.main(["compare", "--previous", str(DAY1), "--current", str(DAY2), "--out", str(tmp_path / "d")]) == 2
    assert pa.main(["compare", "--previous", str(DAY2), "--current", str(DAY1), "--out", str(tmp_path / "e")]) == 1
    assert pa.main(["issues", "--diff", str(tmp_path / "d" / "pa-drift-report.json"), "--out", str(tmp_path / "i.json")]) == 0


def test_the_sample_workflow_passes_the_linter():
    text = (KIT / "workflow" / "pa-evidence.yml").read_text(encoding="utf-8")
    assert w.lint_text(text) == []
