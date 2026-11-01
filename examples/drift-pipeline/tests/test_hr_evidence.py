"""HR-driven identity evidence: package, verify and assemble a period from runs that
examples/hr-lifecycle/python/lifecycle_drift.py writes from its own fixtures.

    python -m pytest tests -q
"""
import json
import shutil
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parents[1]
HRL = HERE.parent / "hr-lifecycle"
sys.path.insert(0, str(HERE / "python"))
sys.path.insert(0, str(HRL / "python"))
import contractor_source  # noqa: E402
import hr_evidence as he  # noqa: E402
import lifecycle_drift  # noqa: E402
from drift_pipeline import DriftError  # noqa: E402

FIX = HRL / "tests" / "fixtures"
TENANT = "00000000-0000-4000-8000-00000000c0de"


@pytest.fixture(scope="module")
def runs(tmp_path_factory):
    base = tmp_path_factory.mktemp("hr")
    contractor_source.main(["extract", "--register", str(FIX / "ch02" / "contractor-register.csv"), "--cards", str(FIX / "ch02" / "cards.csv"),
                            "--sponsors", str(FIX / "ch02" / "hr-sponsors.csv"), "--rules", str(HRL / "config" / "contractor-rules.json"),
                            "--as-of", "2026-11-01", "--out", str(base / "ch02")])

    def run(name, since, until, tenant=TENANT, users="workforce-users.json"):
        F = FIX / "ch07"
        lifecycle_drift.main(["run", "--hr", str(F / "hr-export.csv"), "--contractors", str(base / "ch02" / "decisions.json"),
                              "--users", str(F / users), "--exceptions", str(F / "exceptions.csv"), "--cards", str(F / "cards.csv"),
                              "--config", str(HRL / "config" / "drift.json"), "--since", since, "--until", until, "--cloud", "gcc",
                              "--tenant-id", tenant, "--mode", "fixture", "--out", str(base / "runs" / name)])
        return base / "runs" / name

    r1 = run("2026-10-31T0600Z", "2026-10-01", "2026-10-31")
    r2 = run("2026-11-01T0600Z", "2026-10-31", "2026-11-01")
    other = run("2026-11-02T0600Z-other", "2026-11-01", "2026-11-02", tenant="11111111-1111-4111-8111-111111111111")
    return {"base": base, "r1": r1, "r2": r2, "other": other}


def test_load_checks_the_run(runs):
    run = he.load_hr_run(runs["r1"])
    assert run["tenant_id"] == TENANT and run["findings"] and len(run["metrics"]) == 6


def test_load_refuses_a_tampered_run(runs, tmp_path):
    bad = tmp_path / "bad"
    shutil.copytree(runs["r1"], bad)
    p = bad / "lifecycle" / "findings.json"
    p.write_text(p.read_text(encoding="utf-8").replace("orphan", "fine"), encoding="utf-8")
    with pytest.raises(DriftError):
        he.load_hr_run(bad)
    extra = tmp_path / "extra"
    shutil.copytree(runs["r1"], extra)
    (extra / "notes.txt").write_text("x", encoding="utf-8")
    with pytest.raises(DriftError):
        he.load_hr_run(extra)


def test_package_chain_verify_and_period(runs, tmp_path):
    ev = tmp_path / "evidence"
    p1 = he.package_hr(runs["r1"], ev)
    p2 = he.package_hr(runs["r2"], ev, p1 / he.EVIDENCE_MANIFEST)
    m2 = json.loads((p2 / he.EVIDENCE_MANIFEST).read_text())
    assert m2["previous"]["run_id"] == "2026-10-31T0600Z" and m2["since_previous"] == {"new": [], "resolved": []}
    assert he.verify_hr(p2)["run_id"] == "2026-11-01T0600Z"
    assert "pat@" not in (p2 / "summary.md").read_text(encoding="utf-8")
    dest, man = he.period_hr(ev, "2026-10-01", "2026-11-01", tmp_path / "periods")
    assert man["chain_breaks"] == [] and man["coverage_gaps"] == [] and len(man["packages"]) == 2
    assert man["complete"] is False                       # the fixture has open drift and unmeasured metrics
    assert {c["control"] for c in man["controls"]} == {"AC-2", "AU-6", "PS-4", "PS-5", "CA-7"}


def test_package_is_written_once_and_refuses_other_tenants(runs, tmp_path):
    ev = tmp_path / "evidence"
    p1 = he.package_hr(runs["r1"], ev)
    with pytest.raises(DriftError):
        he.package_hr(runs["r1"], ev)
    with pytest.raises(DriftError):
        he.package_hr(runs["other"], ev, p1 / he.EVIDENCE_MANIFEST)


def test_verify_catches_an_edit_after_packaging(runs, tmp_path):
    p1 = he.package_hr(runs["r1"], tmp_path / "evidence")
    (p1 / "summary.md").write_text("edited\n", encoding="utf-8")
    with pytest.raises(DriftError):
        he.verify_hr(p1)


def test_period_reports_a_gap_and_a_broken_chain(runs, tmp_path):
    ev = tmp_path / "evidence"
    he.package_hr(runs["r1"], ev)
    he.package_hr(runs["r2"], ev)                         # no previous manifest: the chain is broken
    _, man = he.period_hr(ev, "2026-09-25", "2026-11-01", tmp_path / "periods")
    assert man["chain_breaks"] and man["coverage_gaps"][0]["since"] == "2026-09-25T00:00:00Z"
    assert man["complete"] is False
