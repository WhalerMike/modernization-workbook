"""Tests for npi_evidence.py (developer workbook Building Non-Person Identity, Chapter 10): two fictional
drift runs written by examples/non-person-identity/Invoke-NpiDriftRun.ps1 and one vintage comparison
written by Invoke-NpiVintage.ps1, packaged, chained, verified and assembled into a period. A Pester test
in examples/non-person-identity checks that these fixtures match a fresh run. No tenant and no network.
Illustrative."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "python"))

import npi_evidence as npi  # noqa: E402
import workflow_lint as w  # noqa: E402
from drift_pipeline import DriftError, fingerprint, sha256_file  # noqa: E402

RUNS = KIT / "tests" / "fixtures" / "npi-runs"
DAY1 = RUNS / "2026-10-29T0600Z-fixture"
DAY2 = RUNS / "2026-10-30T0600Z-fixture"
VINTAGE = KIT / "tests" / "fixtures" / "npi-vintage" / "vintage-2026"
TENANT = "c0ffee00-0000-4000-8000-000000000001"
NAMES = ("alice", "bob", "carol", "dave", "erin", "frank", "gina", "harry", "@contoso.example", "#EXT#")


@pytest.fixture()
def chain(tmp_path):
    out = tmp_path / "evidence"
    p1 = npi.package_npi(DAY1, out)
    p2 = npi.package_npi(DAY2, out, previous_manifest=p1 / npi.EVIDENCE_MANIFEST)
    return out, p1, p2


def manifest(p: Path) -> dict:
    return json.loads((p / npi.EVIDENCE_MANIFEST).read_text(encoding="utf-8"))


def copy_run(src: Path, tmp_path: Path) -> Path:
    dst = tmp_path / "run" / src.name
    shutil.copytree(src, dst)
    return dst


# ---------------------------------------------------------------- loading a run

def test_loads_both_runs_with_one_tenant_and_every_task_ok():
    for d in (DAY1, DAY2):
        r = npi.load_npi_run(d)
        assert r["tenant_id"] == TENANT and r["cloud"] == "gcc" and r["mode"] == "Fixture"
        assert r["status"] == {"inventory": "OK", "ownership": "OK", "drift": "OK"}


def test_every_drift_finding_carries_the_first_workbooks_fingerprint():
    r = npi.load_npi_run(DAY2)
    for f in r["tasks"]["drift"]["findings"] + r["tasks"]["drift"]["chapter_findings"]:
        assert f["fingerprint"] == fingerprint(f["rule"], f["object_key"], "")


def test_refuses_an_edited_file(tmp_path):
    d = copy_run(DAY2, tmp_path)
    with (d / "drift" / "findings.json").open("a", encoding="utf-8") as f:
        f.write(" ")
    with pytest.raises(DriftError, match="doesn't match the SHA-256"):
        npi.load_npi_run(d)


def test_refuses_an_extra_file_and_a_task_manifest_for_another_tenant(tmp_path):
    d = copy_run(DAY2, tmp_path)
    (d / "notes.txt").write_text("x", encoding="utf-8")
    with pytest.raises(DriftError, match="unexpected entries"):
        npi.load_npi_run(d)
    d2 = copy_run(DAY1, tmp_path / "b")
    idx = json.loads((d2 / "run.json").read_text(encoding="utf-8"))
    idx["tenantId"] = "11111111-1111-4111-8111-111111111111"
    (d2 / "run.json").write_text(json.dumps(idx), encoding="utf-8")
    with pytest.raises(DriftError, match="records tenant"):
        npi.load_npi_run(d2)


def test_refuses_a_run_that_records_a_write(tmp_path):
    d = copy_run(DAY2, tmp_path)
    m = json.loads((d / "drift" / "manifest.json").read_text(encoding="utf-8"))
    m["requests"][0]["method"] = "PATCH"
    (d / "drift" / "manifest.json").write_text(json.dumps(m), encoding="utf-8")
    idx = json.loads((d / "run.json").read_text(encoding="utf-8"))
    idx["tasks"]["drift"]["manifestSha256"] = sha256_file(d / "drift" / "manifest.json")
    (d / "run.json").write_text(json.dumps(idx), encoding="utf-8")
    with pytest.raises(DriftError, match="only reads"):
        npi.load_npi_run(d)


def test_refuses_a_forged_fingerprint(tmp_path):
    d = copy_run(DAY2, tmp_path)
    rows = json.loads((d / "drift" / "findings.json").read_text(encoding="utf-8"))
    rows[0]["Fingerprint"] = "0" * 16
    (d / "drift" / "findings.json").write_text(json.dumps(rows), encoding="utf-8")
    m = json.loads((d / "drift" / "manifest.json").read_text(encoding="utf-8"))
    m["files"]["findings.json"] = sha256_file(d / "drift" / "findings.json")
    (d / "drift" / "manifest.json").write_text(json.dumps(m), encoding="utf-8")
    idx = json.loads((d / "run.json").read_text(encoding="utf-8"))
    idx["tasks"]["drift"]["manifestSha256"] = sha256_file(d / "drift" / "manifest.json")
    (d / "run.json").write_text(json.dumps(idx), encoding="utf-8")
    with pytest.raises(DriftError, match="has fingerprint"):
        npi.load_npi_run(d)


# ---------------------------------------------------------------- packages and the chain

def test_package_records_tenant_window_baseline_and_a_hash_per_file(chain):
    _, p1, p2 = chain
    m = manifest(p2)
    assert m["tenant_id"] == TENANT and m["audit_window"] == {"since": "2026-10-29T06:00:00Z", "until": "2026-10-30T06:00:00Z"}
    assert m["baseline"]["runId"] == "2026-10-29T0600Z-fixture"
    assert m["previous"] == {"run_id": "2026-10-29T0600Z-fixture", "evidence_manifest_sha256": sha256_file(p1 / npi.EVIDENCE_MANIFEST)}
    assert all(f["sha256"] == sha256_file(p2 / f["path"]) for f in m["files"])
    assert manifest(p1)["previous"] is None


def test_package_compares_by_fingerprint_with_the_previous_package(chain):
    _, p1, p2 = chain
    m1, m2 = manifest(p1), manifest(p2)
    assert len(m1["since_previous"]["new"]) == len(m1["open"])
    open2 = {f["fingerprint"]: f for f in m2["open"]}
    new = [open2[fp] for fp in m2["since_previous"]["new"]]
    assert len(new) == 19
    assert sorted({f["rule"] for f in new}) == ["NPI-DRF-01", "NPI-DRF-02", "NPI-DRF-07", "NPI-DRF-08", "NPI-INV-03", "NPI-INV-04", "NPI-INV-06",
                                                "NPI-OWN-02", "NPI-OWN-06"]
    resolved = {f["fingerprint"]: f for f in m1["open"]}
    assert sorted(resolved[fp]["rule"] for fp in m2["since_previous"]["resolved"]) == ["NPI-DRF-05"]


def test_package_carries_chapter_contract_findings_and_records_the_chapters(chain):
    _, _, p2 = chain
    m = manifest(p2)
    assert m["chapters_received"] == ["07", "09"]
    assert {f["rule"] for f in m["open"] if f["task"] == "contract"} == {"NPI-SAMPLE-01", "NPI-SAMPLE-02"}
    assert m["review_kinds_received"] == ["agent-access-recertification", "owner-permission-review", "sponsor-attestation"]


def test_same_inputs_give_the_same_package(tmp_path, chain):
    _, p1, _ = chain
    again = npi.package_npi(DAY1, tmp_path / "again")
    assert sha256_file(again / npi.EVIDENCE_MANIFEST) == sha256_file(p1 / npi.EVIDENCE_MANIFEST)


def test_package_is_written_once_and_chains_only_to_the_same_tenant_and_an_earlier_run(chain, tmp_path):
    out, p1, p2 = chain
    with pytest.raises(DriftError, match="written once"):
        npi.package_npi(DAY1, out)
    with pytest.raises(DriftError, match="isn't later"):
        npi.package_npi(DAY1, tmp_path / "x", previous_manifest=p2 / npi.EVIDENCE_MANIFEST)
    m = manifest(p1)
    m["tenant_id"] = "11111111-1111-4111-8111-111111111111"
    other = tmp_path / "other.json"
    other.write_text(json.dumps(m), encoding="utf-8")
    with pytest.raises(DriftError, match="previous package is for tenant"):
        npi.package_npi(DAY2, tmp_path / "y", previous_manifest=other)


def test_summary_carries_no_names(chain):
    _, _, p2 = chain
    text = (p2 / "summary.md").read_text(encoding="utf-8").lower()
    assert not [n for n in NAMES if n.lower() in text]
    assert "npi-drf-07" in text


def test_verify_passes_and_catches_an_edit(chain):
    _, _, p2 = chain
    assert npi.verify_npi(p2)["run_id"] == "2026-10-30T0600Z-fixture"
    with (p2 / "summary.md").open("a", encoding="utf-8") as f:
        f.write("edited\n")
    with pytest.raises(DriftError, match="summary.md doesn't match"):
        npi.verify_npi(p2)


def test_verify_catches_a_file_added_to_the_run_inside(chain):
    _, p1, _ = chain
    (p1 / "run" / "drift" / "extra.json").write_text("{}", encoding="utf-8")
    with pytest.raises(DriftError, match="files differ"):
        npi.verify_npi(p1)


# ---------------------------------------------------------------- the period

def test_period_maps_open_findings_to_the_controls_and_gate_7(chain, tmp_path):
    out, _, _ = chain
    dest, m = npi.period_npi(out, "2026-10-28T06:00:00Z", "2026-10-30T06:00:00Z", tmp_path / "periods", VINTAGE)
    assert not m["chain_breaks"] and not m["coverage_gaps"] and not m["unverified"]
    assert [c["control"] for c in m["controls"]] == ["AC-2", "AC-6(5)", "IA-4", "IA-5", "IA-9", "M-25-21"]
    by = {c["control"]: c for c in m["controls"]}
    assert by["IA-5"]["missing_sources"] == ["04", "06"]
    assert by["M-25-21"]["missing_sources"] == []
    gate = {g["criterion"]: g["status"] for g in m["gate7"]}
    assert gate["None holds a password that never expires"] == "not met"
    assert gate["None is orphaned"] == "not met"
    assert gate["Every remaining gMSA and dMSA moved or in the dated Kerberos island"].startswith("not decided by this code")
    assert m["complete"] is False
    assert len(m["opened"]) > 0 and len(m["closed"]) == 1
    assert m["vintage"]["vintage"] == "2026" and m["vintage"]["findings"] == 5
    sums = (dest / "SHA256SUMS").read_text(encoding="utf-8").split()
    assert sha256_file(dest / npi.PERIOD_MANIFEST) in sums


def test_period_without_the_vintage_leaves_m_25_21_incomplete(chain, tmp_path):
    out, _, _ = chain
    _, m = npi.period_npi(out, "2026-10-28T06:00:00Z", "2026-10-30T06:00:00Z", tmp_path / "periods")
    assert {c["control"]: c for c in m["controls"]}["M-25-21"]["missing_sources"] == ["the annual vintage comparison"]


def test_period_reports_a_coverage_gap_and_a_chain_break(tmp_path):
    out = tmp_path / "evidence"
    npi.package_npi(DAY1, out)
    npi.package_npi(DAY2, out)          # not chained to day 1
    _, m = npi.period_npi(out, "2026-10-27T06:00:00Z", "2026-10-30T06:00:00Z", tmp_path / "p")
    assert m["coverage_gaps"] == [{"since": "2026-10-27T06:00:00Z", "until": "2026-10-28T06:00:00Z"}]
    assert m["chain_breaks"][0]["run_id"] == "2026-10-30T0600Z-fixture"


def test_period_refuses_a_vintage_for_another_tenant(chain, tmp_path):
    out, _, _ = chain
    v = tmp_path / "vintage"
    shutil.copytree(VINTAGE, v)
    m = json.loads((v / "manifest.json").read_text(encoding="utf-8"))
    m["tenantId"] = "11111111-1111-4111-8111-111111111111"
    (v / "manifest.json").write_text(json.dumps(m), encoding="utf-8")
    with pytest.raises(DriftError, match="vintage comparison is for tenant"):
        npi.period_npi(out, "2026-10-28T06:00:00Z", "2026-10-30T06:00:00Z", tmp_path / "p", v)


def test_period_summary_carries_no_names(chain, tmp_path):
    out, _, _ = chain
    dest, _ = npi.period_npi(out, "2026-10-28T06:00:00Z", "2026-10-30T06:00:00Z", tmp_path / "p", VINTAGE)
    text = (dest / "period-summary.md").read_text(encoding="utf-8").lower()
    assert not [n for n in NAMES if n.lower() in text]


# ---------------------------------------------------------------- command line and workflow

def test_cli_exit_codes(chain, tmp_path, capsys):
    out, p1, p2 = chain
    assert npi.main(["verify", str(p2)]) == 0
    assert npi.main(["period", "--evidence", str(out), "--since", "2026-10-28T06:00:00Z", "--until", "2026-10-30T06:00:00Z", "--out", str(tmp_path / "p")]) == 2
    assert npi.main(["package", "--run", str(DAY1), "--out", str(out)]) == 1
    assert "written once" in capsys.readouterr().err


def test_the_sample_workflow_lints_clean():
    findings = w.lint_text((KIT / "workflow" / "npi-evidence.yml").read_text(encoding="utf-8"))
    assert [f for f in findings if f["severity"] in ("Finding", "Warn")] == []
