"""Chapters 05, 06 and 07: the CBA configuration checks and CRL measurement; separation timing; the
lifecycle drift classes, the six metrics and the run folder.

    python -m pytest tests -q
"""
import copy
import io
import json
import shutil
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
FIX = KIT / "tests" / "fixtures"
sys.path.insert(0, str(KIT / "python"))
import access_assignment as aa  # noqa: E402
import cba_check as cb  # noqa: E402
import contractor_source as cs  # noqa: E402
import hrlc_core as core  # noqa: E402
import joiner_workflows as jw  # noqa: E402
import lifecycle_drift as ld  # noqa: E402
import separation_timing as st  # noqa: E402
import writer_register as wr  # noqa: E402

EXP = core.read_json(KIT / "config" / "cba-expected.json")
X = FIX / "ch05" / "exports"


def ids(rows):
    return sorted(r["Rule"] for r in rows)


def cba(cloud="gcc", **over):
    args = {"cas": core.values(core.read_json(X / "pki-cas.json")), "x509": cb._one(X, "x509-method"),
            "strengths": core.values(core.read_json(X / "auth-strengths.json")), "ca_policies": core.values(core.read_json(X / "ca-policies.json")),
            "crl": core.read_csv(FIX / "ch05" / "crl-measurements.csv")}
    args.update(over)
    return cb.check(core.cloud(cloud), args["cas"], args["x509"], args["strengths"], args["ca_policies"], args["crl"], EXP, "2026-11-01")


# ---------------------------------------------------------------- Chapter 05

def test_cba_fixture_raises_each_rule():
    assert ids(cba()) == ["CB-01", "CB-01", "CB-02", "CB-04", "CB-05", "CB-08", "CB-08", "CB-09", "CB-10", "CB-11", "CB-12", "CB-13"]


def test_the_crl_limit_follows_the_cloud():
    big = [{"url": "http://pki.contoso.example/crl/piv-ca1.crl", "bytes": "30000000", "seconds": "2", "error": ""},
           {"url": "https://pki.contoso.example/crl/piv-ca2.crl", "bytes": "1000", "seconds": "1", "error": ""}]
    assert "CB-03" in ids(cba("gcc", crl=big))
    assert "CB-03" not in ids(cba("gcchigh", crl=big)) and "CB-05" not in ids(cba("gcchigh", crl=big))


def test_an_unreachable_or_unmeasured_crl_is_a_finding():
    bad = [{"url": "http://pki.contoso.example/crl/piv-ca1.crl", "bytes": "0", "seconds": "0", "error": "URLError"}]
    rows = cba(crl=bad)
    assert "CB-04" in ids(rows) and "CB-06" in ids(rows)


def test_a_compliant_configuration_is_clean():
    cas = core.values(core.read_json(X / "pki-cas.json"))
    cas = [c for c in cas if c["id"] != "ca-legacy"]
    cas[0] = dict(cas[0], certificateRevocationListUrl="http://pki.contoso.example/crl/piv-root.crl")
    cas[2] = dict(cas[2], thumbprint=EXP["issuingCas"][1]["thumbprint"], certificateRevocationListUrl="http://pki.contoso.example/crl/piv-ca2.crl")
    x = copy.deepcopy(cb._one(X, "x509-method"))
    x["crlValidationConfiguration"] = {"state": "enabled", "exemptedCertificateAuthoritiesSubjectKeyIdentifiers": []}
    x["authenticationModeConfiguration"]["rules"][0]["identifier"] = EXP["multifactorPolicyOids"][0]
    x["certificateUserBindings"] = [{"x509CertificateField": "SHA1PublicKey", "userProperty": "certificateUserIds", "priority": 1}]
    pols = core.values(core.read_json(X / "ca-policies.json"))
    pols[1] = dict(pols[1], state="enabled")
    crl = [{"url": "http://pki.contoso.example/crl/piv-root.crl", "bytes": "1000", "seconds": "1", "error": ""},
           {"url": "http://pki.contoso.example/crl/piv-ca1.crl", "bytes": "2000000", "seconds": "1", "error": ""},
           {"url": "http://pki.contoso.example/crl/piv-ca2.crl", "bytes": "3000000", "seconds": "2", "error": ""}]
    assert cba(cas=cas, x509=x, ca_policies=pols, crl=crl) == []


def test_measure_records_size_time_and_errors_without_raising(tmp_path):
    (tmp_path / "a.crl").write_bytes(b"x" * 100)

    class R(io.BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False
    rows = cb.measure([str(tmp_path / "a.crl"), str(tmp_path / "missing.crl"), "http://pki.contoso.example/c.crl"],
                      opener=lambda req, timeout: R(b"y" * 7))
    assert [r["bytes"] for r in rows] == [100, 0, 7]
    assert rows[1]["error"] == "FileNotFoundError" and rows[2]["error"] == ""


# ---------------------------------------------------------------- Chapter 06

def timing(**over):
    F = FIX / "ch06"
    a = dict(seps=core.read_csv(F / "hr-separations.csv"), users=core.values(core.read_json(F / "leaver-users.json")),
             audits=core.values(core.read_json(F / "separation-audits.json")), results=core.values(core.read_json(F / "leaver-results.json")),
             cards=core.read_csv(F / "card-revocations.csv"), devices=core.read_csv(F / "device-actions.csv"),
             role_holders={r["UserId"] for r in core.read_csv(F / "role-holders.csv")})
    a.update(over)
    return st.measure(a["seps"], a["users"], a["audits"], a["results"], a["cards"], a["devices"], a["role_holders"],
                      core.read_json(KIT / "config" / "separation.json"), "2026-11-01T12:00:00Z")


def test_separation_intervals_and_summary():
    rows, summary, _ = timing()
    by = {r["PersonNumber"]: r for r in rows}
    assert by["100301"]["separationToBlockHours"] == 0.25 and by["100301"]["separationToRevocationHours"] == 11.0
    assert by["100307"]["status"] == "cancelled" and "100309" not in by          # future effective date skipped
    assert summary["leavers"] == 7 and summary["missedBlocks"] == 1
    assert summary["separationToBlockHours"]["p50"] == 0.25


def test_separation_rules():
    _, _, found = timing()
    assert ids(found) == ["ST-01", "ST-01", "ST-02", "ST-03", "ST-03", "ST-04", "ST-05", "ST-06", "ST-07", "ST-08", "ST-09", "ST-09"]
    late = {r["Object"]: r["Severity"] for r in found if r["Rule"] == "ST-03"}
    assert late == {"drew.park@contoso.example": "Finding", "emery.sol@contoso.example": "Warn"}


def test_a_failed_audit_record_is_not_a_block():
    _, _, found = timing()
    assert any(r["Rule"] == "ST-02" and r["Object"] == "drew.park@contoso.example" for r in found)


def test_a_cancelled_separation_isnt_measured_or_flagged():
    seps = [dict(s, Cancelled="Y") if s["PersonNumber"] == "100305" else s for s in core.read_csv(FIX / "ch06" / "hr-separations.csv")]
    _, _, found = timing(seps=seps)
    assert not [r for r in found if "harper" in r["Object"]]


# ---------------------------------------------------------------- Chapter 07

@pytest.fixture(scope="module")
def chapters(tmp_path_factory):
    """Every chapter's output, written from the fixtures, as Chapter 07's run reads them."""
    base = tmp_path_factory.mktemp("chapters")
    wr.main(["scan", "--register", str(KIT / "config" / "writer-register.json"), "--audit", str(FIX / "ch01" / "directory-audits.json"),
             "--since", "2026-10-01", "--until", "2026-10-31", "--cloud", "gcc", "--out", str(base / "ch01")])
    cs.main(["extract", "--register", str(FIX / "ch02" / "contractor-register.csv"), "--cards", str(FIX / "ch02" / "cards.csv"),
             "--sponsors", str(FIX / "ch02" / "hr-sponsors.csv"), "--rules", str(KIT / "config" / "contractor-rules.json"),
             "--as-of", "2026-11-01", "--out", str(base / "ch02")])
    jw.main(["readiness", "--hires", str(FIX / "ch03" / "hr-hires.csv"), "--users", str(FIX / "ch03" / "hire-users.json"),
             "--prehire-results", str(FIX / "ch03" / "prehire-results.json"), "--assignments", str(FIX / "ch03" / "joiner-assignments.json"),
             "--workflows", str(KIT / "config" / "workflows"), "--as-of", "2026-11-02T08:00:00Z", "--cloud", "gcc", "--out", str(base / "ch03")])
    aa.main(["residual", "--mover", str(FIX / "ch04" / "mover.json"), "--assignments", str(FIX / "ch04" / "mover-assignments.json"),
             "--memberships", str(FIX / "ch04" / "mover-memberships.json"), "--policies", str(KIT / "config" / "access"),
             "--as-of", "2026-11-01T12:00:00Z", "--cloud", "gcc", "--out", str(base / "ch04")])
    F = FIX / "ch06"
    st.main(["measure", "--separations", str(F / "hr-separations.csv"), "--users", str(F / "leaver-users.json"), "--audits", str(F / "separation-audits.json"),
             "--results", str(F / "leaver-results.json"), "--cards", str(F / "card-revocations.csv"), "--devices", str(F / "device-actions.csv"),
             "--role-holders", str(F / "role-holders.csv"), "--config", str(KIT / "config" / "separation.json"), "--as-of", "2026-11-01T12:00:00Z",
             "--cloud", "gcc", "--out", str(base / "ch06")])
    return base


def drift_args(base, out, since="2026-10-01", until="2026-11-01"):
    F = FIX / "ch07"
    return ["run", "--hr", str(F / "hr-export.csv"), "--contractors", str(base / "ch02" / "decisions.json"), "--users", str(F / "workforce-users.json"),
            "--exceptions", str(F / "exceptions.csv"), "--cards", str(F / "cards.csv"), "--derivation", str(F / "derivation.json"),
            "--writers", str(base / "ch01"), "--readiness", str(base / "ch03"), "--residual", str(base / "ch04"), "--timing", str(base / "ch06"),
            "--config", str(KIT / "config" / "drift.json"), "--since", since, "--until", until, "--cloud", "gcc",
            "--tenant-id", "00000000-0000-4000-8000-00000000C0DE", "--mode", "fixture", "--out", str(out)]


def test_drift_run_folder_and_classes(chapters, tmp_path):
    assert ld.main(drift_args(chapters, tmp_path / "r1")) == core.EXIT_FINDINGS
    idx = json.loads((tmp_path / "r1" / "run.json").read_text())
    assert idx["schema"] == "fmp-hr-run/1" and idx["readOnly"] is True and idx["tenantId"] == "00000000-0000-4000-8000-00000000c0de"
    assert set(idx["inputs"]) == {"writers", "readiness", "residual", "timing"}
    assert idx["tasks"]["lifecycle"]["manifestSha256"] == core.sha256_file(tmp_path / "r1" / "lifecycle" / "manifest.json")
    rows = json.loads((tmp_path / "r1" / "lifecycle" / "findings.json").read_text())
    got = {r["Rule"] for r in rows}
    assert {"LD-01", "LD-02", "LD-03", "LD-04", "LD-05", "LD-06", "LD-07", "LD-08"} <= got
    orphan = {r["Object"] for r in rows if r["Rule"] == "LD-03"}
    assert orphan == {"print.kiosk@contoso.example", "old.temp@contoso.example"}   # the owned exception isn't an orphan


def test_drift_metrics(chapters, tmp_path):
    ld.main(drift_args(chapters, tmp_path / "r1"))
    m = {x["metric"]: x for x in json.loads((tmp_path / "r1" / "lifecycle" / "metrics.json").read_text())}
    assert m["separationToBlockHoursP90"]["value"] == 5.52 and m["separationToBlockHoursP90"]["status"] == "out of bounds"
    assert m["joinerReadinessRate"]["value"] == 0.25
    assert m["derivationPurity"]["value"] == round((5120 + 1830) / 9100, 4)
    assert m["transferToReviewHours"]["status"] == "not measured"


def test_drift_refuses_a_tampered_chapter_output(chapters, tmp_path):
    bad = tmp_path / "ch06"
    shutil.copytree(chapters / "ch06", bad)
    (bad / "summary.json").write_text("{}", encoding="utf-8")
    args = drift_args(chapters, tmp_path / "r")
    args[args.index("--timing") + 1] = str(bad)
    assert ld.main(args) == core.EXIT_ERROR


def test_drift_run_is_written_once(chapters, tmp_path):
    assert ld.main(drift_args(chapters, tmp_path / "r")) == core.EXIT_FINDINGS
    assert ld.main(drift_args(chapters, tmp_path / "r")) == core.EXIT_ERROR
