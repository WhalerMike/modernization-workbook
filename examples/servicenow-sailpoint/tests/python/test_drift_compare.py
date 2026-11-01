"""Run-over-run comparison of drift findings by their stable IDs."""

import json

import pytest

import drift_compare as dc
import identity_drift as d
from conftest import FIXTURES

OPTS = json.loads((FIXTURES / "drift_options.json").read_text())


def _run(hr_name, audit=True):
    return d.compute_findings(d.load_hr_csv(str(FIXTURES / hr_name)),
                              json.loads((FIXTURES / "graph_users.json").read_text())["value"],
                              json.loads((FIXTURES / "isc_identities.json").read_text()),
                              json.loads((FIXTURES / "isc_uncorrelated_accounts.json").read_text()),
                              json.loads((FIXTURES / "entra_audit.json").read_text())["value"] if audit else None,
                              OPTS, detected_at="2026-11-01T12:00:00Z")


def test_hr_correction_resolves_entra_drift_and_opens_isc_drift():
    result = dc.compare_runs(_run("hr_extract.csv"), _run("hr_extract_day2.csv"))
    assert len(result["persisting"]) == 11
    assert [(f["drift_class"], f["system"], f["employee_id"], f["attribute"]) for f in result["resolved"]] == [
        ("attribute_drift", "entra", "E1004", "department")]
    assert [(f["system"], f["expected"], f["observed"]) for f in result["new"]] == [("isc", "Finance", "HR")]
    assert result["by_class"]["attribute_drift"] == {"new": 1, "persisting": 3, "resolved": 1}


def test_same_inputs_give_no_change():
    result = dc.compare_runs(_run("hr_extract.csv"), _run("hr_extract.csv"))
    assert not result["new"] and not result["resolved"]


def test_runs_with_different_classes_are_refused():
    with pytest.raises(dc.CompareError, match="different drift classes"):
        dc.compare_runs(_run("hr_extract.csv"), _run("hr_extract.csv", audit=False))


def test_cli(tmp_path, capsys):
    a, b = tmp_path / "a.json", tmp_path / "b.json"
    a.write_text(json.dumps(_run("hr_extract.csv")))
    b.write_text(json.dumps(_run("hr_extract_day2.csv")))
    assert dc.main(["--previous", str(a), "--current", str(b)]) == 0
    out = capsys.readouterr().out
    assert out.startswith("1 new, 11 persisting, 1 resolved")
    b.write_text(json.dumps(_run("hr_extract.csv", audit=False)))
    assert dc.main(["--previous", str(a), "--current", str(b)]) == 2
