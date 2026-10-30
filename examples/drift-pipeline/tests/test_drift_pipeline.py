"""Tests for drift_pipeline.py against fictional kit runs and the other kits' provenance files.
No tenant, no network. Illustrative: unit-tested against fixtures, not proven against a live tenant."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "python"))

import drift_pipeline as d  # noqa: E402

FX = KIT / "tests" / "fixtures"
PREV = FX / "runs" / "previous" / "2026-10-28-0617-fixture-runner-fixture"
CURR = FX / "runs" / "current" / "2026-10-29-0617-fixture-runner-fixture"
PROV = [
    ("hcm-entra", FX / "provenance" / "hcm-entra" / "provenance.json"),
    ("machine-configuration", FX / "provenance" / "machine-configuration" / "provenance.json"),
    ("dynamic-rules", FX / "provenance" / "dynamic-rules" / "check-results.json"),
]


@pytest.fixture()
def report():
    return d.compare(d.load_run(PREV), d.load_run(CURR))


def copy_run(src: Path, tmp_path: Path) -> Path:
    dst = tmp_path / src.parent.name / src.name
    shutil.copytree(src, dst)
    return dst


def rewrite_manifest(run: Path, **changes) -> None:
    m = json.loads((run / d.KIT_MANIFEST).read_text(encoding="utf-8"))
    m.update(changes)
    (run / d.KIT_MANIFEST).write_text(json.dumps(m, indent=2), encoding="utf-8")


# ---------------------------------------------------------------- loading a run

def test_fixture_runs_match_their_own_manifests():
    for run in (PREV, CURR):
        r = d.load_run(run)
        assert r["mode"] == "Fixture" and r["cloud"] == "gcc"


def test_a_file_edited_after_the_run_is_refused(tmp_path):
    run = copy_run(CURR, tmp_path)
    p = run / "Details" / "VK-HR-01.csv"
    p.write_text(p.read_text(encoding="utf-8").replace("gina", "gena"), encoding="utf-8")
    with pytest.raises(d.DriftError, match="doesn't match the SHA-256"):
        d.load_run(run)


def test_a_file_added_or_removed_after_the_run_is_refused(tmp_path):
    run = copy_run(CURR, tmp_path)
    (run / "Details" / "extra.csv").write_text("x", encoding="utf-8")
    with pytest.raises(d.DriftError, match="extra"):
        d.load_run(run)
    (run / "Details" / "extra.csv").unlink()
    (run / "Details" / "VK-HR-01.csv").unlink()
    with pytest.raises(d.DriftError, match="missing"):
        d.load_run(run)


def test_a_run_that_does_not_say_read_only_is_refused(tmp_path):
    run = copy_run(CURR, tmp_path)
    rewrite_manifest(run, ReadOnly=False)
    with pytest.raises(d.DriftError, match="read-only"):
        d.load_run(run)


def test_a_byte_order_mark_is_tolerated(tmp_path):
    run = copy_run(CURR, tmp_path)
    body = (run / d.KIT_MANIFEST).read_bytes()
    (run / d.KIT_MANIFEST).write_bytes(b"\xef\xbb\xbf" + body)
    assert d.load_run(run)["run_id"] == CURR.name


# ---------------------------------------------------------------- compare

def test_counts(report):
    assert report["counts"] == {"new": 3, "resolved": 1, "changed": 1, "detail_only": 1, "unchanged": 6, "unverified": 2}
    assert report["drift"] is True and report["baseline"] is False


def test_new_findings(report):
    assert sorted((f["check_id"], f["object_id"]) for f in report["new"]) == [
        ("VK-CA-01", "ca-users"),
        ("VK-DG-01", "00000000-0000-4000-8000-000000000108"),
        ("VK-HR-01", "00000000-0000-4000-8000-000000000011"),
    ]


def test_resolved_only_when_the_check_read_the_tenant(report):
    assert [(f["check_id"], f["object"]) for f in report["resolved"]] == [("VK-HR-01", "frank@contoso.example")]
    resolved_checks = {f["check_id"] for f in report["resolved"]}
    assert "VK-NPI-03" not in resolved_checks


def test_an_error_leaves_earlier_findings_unverified(report):
    u = {x["check_id"]: x for x in report["unverified"]}
    assert u["VK-NPI-03"]["reason"] == "Error" and len(u["VK-NPI-03"]["findings"]) == 1
    assert "403" in u["VK-NPI-03"]["message"]


def test_a_check_that_did_not_run_is_unverified_not_passed(report):
    u = {x["check_id"]: x for x in report["unverified"]}
    assert u["VK-PIV-01"]["reason"] == "not run"
    assert {"check_id": "VK-PIV-01", "before": "Pass", "after": None} in report["checks"]


def test_issue_text_change_on_one_object_is_a_change(report):
    (ch,) = report["changed"]
    assert ch["before"]["object"] == "srv-old01"
    assert ch["before"]["issue"].startswith("Agent") and ch["after"]["issue"].startswith("Status Disconnected")


def test_detail_only_changes_open_nothing(report):
    (x,) = report["detail_only"]
    assert x["after"]["object"] == "erin@contoso.example"
    assert all(dr["fingerprint"] != x["after"]["fingerprint"] for dr in d.issue_drafts(report))


def test_two_rows_for_one_object_stay_two_findings(report):
    report_npi = [f for f in report["unchanged"] if f["check_id"] == "VK-NPI-01"]
    assert len(report_npi) == 2 and len({f["fingerprint"] for f in report_npi}) == 2


def test_status_changes(report):
    assert {"check_id": "VK-CA-01", "before": "Pass", "after": "Fail"} in report["checks"]


def test_severity_change_is_a_change(tmp_path):
    prev, curr = d.load_run(PREV), d.load_run(CURR)
    curr["checks"]["VK-INT-05"]["Details"][0]["Severity"] = "Finding"
    rep = d.compare(prev, curr)
    sev = [c for c in rep["changed"] if c["after"]["check_id"] == "VK-INT-05"]
    assert sev and sev[0]["before"]["severity"] == "Warn" and sev[0]["after"]["severity"] == "Finding"
    drafts = [x for x in d.issue_drafts(rep) if x["fingerprint"] == sev[0]["after"]["fingerprint"]]
    assert [x["action"] for x in drafts] == ["comment"]


def test_no_drift_when_nothing_moved():
    rep = d.compare(d.load_run(PREV), d.load_run(PREV) | {"as_of": "2026-10-29T00:00:00Z"})
    assert rep["drift"] is False and rep["counts"]["unchanged"] == 10


def test_info_rows_are_not_findings():
    prev, curr = d.load_run(PREV), d.load_run(CURR)
    curr["checks"]["VK-HR-01"]["Details"].append({"Severity": "Info", "Object": "x", "ObjectId": "y", "Issue": "context", "Detail": ""})
    assert d.compare(prev, curr)["counts"]["new"] == 3


def test_fixture_and_live_runs_are_not_compared(tmp_path):
    run = copy_run(CURR, tmp_path)
    rewrite_manifest(run, Mode="Live")
    with pytest.raises(d.DriftError, match="mode differs"):
        d.compare(d.load_run(PREV), d.load_run(run))


def test_runs_from_different_clouds_are_not_compared(tmp_path):
    run = copy_run(CURR, tmp_path)
    rewrite_manifest(run, Cloud="gcchigh")
    with pytest.raises(d.DriftError, match="cloud differs"):
        d.compare(d.load_run(PREV), d.load_run(run))


def test_runs_out_of_order_are_not_compared():
    with pytest.raises(d.DriftError, match="isn't later"):
        d.compare(d.load_run(CURR), d.load_run(PREV))


def test_changed_options_are_noted(tmp_path):
    run = copy_run(CURR, tmp_path)
    rewrite_manifest(run, Options={"MaxSecretDays": 365, "MinOwners": 2, "MinSupportedAgentVersion": "1.58", "StaleDays": 90})
    rep = d.compare(d.load_run(PREV), d.load_run(run))
    assert any("MaxSecretDays changed from 180 to 365" in n for n in rep["notes"])


def test_baseline_records_everything_and_opens_one_issue():
    rep = d.compare(None, d.load_run(PREV))
    assert rep["baseline"] and rep["counts"]["new"] == 10
    drafts = d.issue_drafts(rep)
    assert len(drafts) == 1 and drafts[0]["labels"] == ["drift", "baseline"]


# ---------------------------------------------------------------- issue drafts

def test_drafts_open_close_and_comment(report):
    drafts = d.issue_drafts(report)
    actions = [x["action"] for x in drafts]
    assert actions.count("open") == 3 + 1 + 2      # new, changed, unverified
    assert actions.count("close") == 1 + 1         # resolved, superseded by the change
    assert "VK-CA-01" in " ".join(x["title"] for x in drafts if x["action"] == "open")


def test_drafts_carry_no_user_names_by_default(report):
    text = json.dumps(d.issue_drafts(report))
    for name in ("gina@contoso.example", "frank@contoso.example", "srv-old01\"", "All staff (nested)"):
        assert name not in text
    assert "00000000-0000-4000-8000-000000000011" in text
    assert "gina@contoso.example" in json.dumps(d.issue_drafts(report, include_names=True))


def test_fingerprints_are_stable(report):
    again = d.compare(d.load_run(PREV), d.load_run(CURR))
    assert [f["fingerprint"] for f in report["new"]] == [f["fingerprint"] for f in again["new"]]
    assert d.fingerprint("VK-HR-01", "a", "b") == d.fingerprint("VK-HR-01", "a", "b") != d.fingerprint("VK-HR-01", "a", "c")


def test_an_unverified_issue_keeps_one_fingerprint_across_runs(report):
    fp = [x["fingerprint"] for x in d.issue_drafts(report) if "not verified" in x["title"] and "VK-NPI-03" in x["title"]]
    assert fp == [d.fingerprint("VK-NPI-03", "unverified", "")]


def test_a_check_that_reads_again_closes_its_unverified_issue():
    prev, curr = d.load_run(CURR), d.load_run(PREV) | {"as_of": "2026-10-30T06:17:00Z"}
    drafts = d.issue_drafts(d.compare(prev, curr))
    assert any(x["action"] == "close" and x["fingerprint"] == d.fingerprint("VK-NPI-03", "unverified", "") for x in drafts)


# ---------------------------------------------------------------- provenance

def test_provenance_is_recognized_and_summarized():
    e = {k: d.describe_provenance(k, p, "2026-10-29T06:17:00Z", 30) for k, p in PROV}
    assert e["hcm-entra"]["schema"] == "fmp-hcm-provenance/1" and e["hcm-entra"]["batches"]
    assert e["machine-configuration"]["configuration"] == "TlsServerProtocols"
    assert e["dynamic-rules"]["rules"] == 6
    assert any("no date or commit" in n for n in e["dynamic-rules"]["notes"])


def test_stale_provenance_is_noted():
    e = d.describe_provenance("machine-configuration", PROV[1][1], "2026-12-31T00:00:00Z", 30)
    assert any("older than 30 days" in n for n in e["notes"])


def test_unknown_or_mislabelled_provenance_is_refused():
    with pytest.raises(d.DriftError, match="unknown provenance kind"):
        d.describe_provenance("ansible", PROV[0][1], "2026-10-29", 30)
    with pytest.raises(d.DriftError, match="not an hcm-entra"):
        d.describe_provenance("hcm-entra", PROV[1][1], "2026-10-29", 30)


# ---------------------------------------------------------------- package and verify

def build_pair(tmp_path):
    base = d.compare(None, d.load_run(PREV))
    first = d.package(PREV, base, PROV, tmp_path / "evidence", metadata={"github_run_id": "1"})
    rep = d.compare(d.load_run(PREV), d.load_run(CURR))
    second = d.package(CURR, rep, PROV, tmp_path / "evidence", previous_manifest=first / d.EVIDENCE_MANIFEST,
                       metadata={"github_run_id": "2"})
    return first, second


def test_package_lists_every_file_with_its_hash(tmp_path):
    first, second = build_pair(tmp_path)
    m = json.loads((second / d.EVIDENCE_MANIFEST).read_text(encoding="utf-8"))
    paths = {f["path"] for f in m["files"]}
    assert "kit-run/ValidationManifest.json" in paths and "drift/drift-report.json" in paths
    assert {"provenance/hcm-entra/provenance.json", "provenance/machine-configuration/provenance.json",
            "provenance/dynamic-rules/check-results.json"} <= paths
    assert m["kit"]["files_verified"] == 9 and m["drift"]["counts"]["new"] == 3


def test_packages_chain_to_the_previous_manifest(tmp_path):
    first, second = build_pair(tmp_path)
    m = json.loads((second / d.EVIDENCE_MANIFEST).read_text(encoding="utf-8"))
    assert m["previous"] == {"run_id": PREV.name, "evidence_manifest_sha256": d.sha256_file(first / d.EVIDENCE_MANIFEST)}


def test_verify_passes_and_sha256sums_cover_the_manifest(tmp_path):
    _, second = build_pair(tmp_path)
    v = d.verify(second)
    assert v["run_id"] == CURR.name
    sums = (second / d.SUMS).read_text(encoding="utf-8")
    assert sums.endswith(f"  {d.EVIDENCE_MANIFEST}\n") and "\r" not in sums


def test_verify_catches_a_changed_file(tmp_path):
    _, second = build_pair(tmp_path)
    p = second / "drift" / "drift-summary.md"
    p.write_text(p.read_text(encoding="utf-8") + "edited\n", encoding="utf-8")
    with pytest.raises(d.DriftError, match="drift-summary.md"):
        d.verify(second)


def test_verify_catches_an_added_file(tmp_path):
    _, second = build_pair(tmp_path)
    (second / "drift" / "note.txt").write_text("x", encoding="utf-8")
    with pytest.raises(d.DriftError, match="extra"):
        d.verify(second)


def test_same_inputs_give_the_same_bytes(tmp_path):
    rep = d.compare(None, d.load_run(PREV))
    a = d.package(PREV, rep, PROV, tmp_path / "a", metadata={"github_run_id": "1"})
    b = d.package(PREV, rep, PROV, tmp_path / "b", metadata={"github_run_id": "1"})
    assert (a / d.SUMS).read_bytes() == (b / d.SUMS).read_bytes()


def test_a_package_is_written_once(tmp_path):
    rep = d.compare(None, d.load_run(PREV))
    d.package(PREV, rep, PROV, tmp_path / "e")
    with pytest.raises(d.DriftError, match="written once"):
        d.package(PREV, rep, PROV, tmp_path / "e")


def test_report_from_another_run_is_refused(tmp_path):
    rep = d.compare(None, d.load_run(CURR))
    with pytest.raises(d.DriftError, match="different kit run"):
        d.package(PREV, rep, PROV, tmp_path / "e")


def test_a_compared_run_needs_the_previous_manifest(tmp_path):
    rep = d.compare(d.load_run(PREV), d.load_run(CURR))
    with pytest.raises(d.DriftError, match="chain the packages"):
        d.package(CURR, rep, PROV, tmp_path / "e")


def test_metadata_from_env_keeps_identifiers_only():
    env = {"GITHUB_RUN_ID": "42", "GITHUB_SHA": "abc", "GITHUB_ACTOR": "someone", "GITHUB_TOKEN": "x",
           "GITHUB_WORKFLOW_REF": "contoso-example/estate-checks/.github/workflows/drift.yml@refs/heads/main"}
    m = d.metadata_from_env(env)
    assert m == {"github_run_id": "42", "github_sha": "abc",
                 "github_workflow_ref": "contoso-example/estate-checks/.github/workflows/drift.yml@refs/heads/main"}


# ---------------------------------------------------------------- clouds

def test_gcc_uses_the_worldwide_endpoints():
    p = d.cloud_profile("GCC")
    assert (p["authority"], p["graph"], p["azure_environment"], p["audience"]) == (
        "https://login.microsoftonline.com", "https://graph.microsoft.com", "AzureCloud", "api://AzureADTokenExchange")


def test_gcc_high_and_dod_share_sign_in_but_not_graph():
    h, o = d.cloud_profile("gcchigh"), d.cloud_profile("dod")
    assert h["authority"] == o["authority"] == "https://login.microsoftonline.us"
    assert h["audience"] == o["audience"] == "api://AzureADTokenExchangeUSGov"
    assert (h["graph"], o["graph"]) == ("https://graph.microsoft.us", "https://dod-graph.microsoft.us")
    assert (h["mg_environment"], o["mg_environment"]) == ("USGov", "USGovDoD")


def test_unknown_cloud_is_refused():
    with pytest.raises(d.DriftError):
        d.cloud_profile("usgov")


# ---------------------------------------------------------------- command line

def test_cli_exit_codes(tmp_path, capsys):
    assert d.main(["compare", "--previous", str(PREV), "--current", str(CURR), "--out", str(tmp_path / "o")]) == d.EXIT_DRIFT
    assert d.main(["compare", "--previous", str(CURR), "--current", str(PREV), "--out", str(tmp_path / "x")]) == d.EXIT_ERROR
    assert d.main(["issues", "--diff", str(tmp_path / "o" / "drift-report.json"), "--out", str(tmp_path / "o" / "issues.json")]) == d.EXIT_OK
    assert d.main(["cloud", "--name", "nope"]) == d.EXIT_ERROR
