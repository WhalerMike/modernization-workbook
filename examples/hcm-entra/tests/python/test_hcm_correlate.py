"""Unit tests for hcm_correlate.py against the shared correlation fixtures. Read-only by
design: no network, no tenant. The PowerShell suite asserts the same expected files.
Illustrative: unit-tested against fixtures, not proven against live tenants."""
from __future__ import annotations

import csv
import datetime as dt
import json
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(KIT / "python"))

import hcm_correlate as c  # noqa: E402

FX = KIT / "tests" / "fixtures"
CF = FX / "correlation"
EXTRACT = FX / "hcm_extract_sample.csv"
AD = CF / "ad-user-export.csv"
ENTRA = CF / "entra-users.json"


@pytest.fixture()
def mapping():
    return c.load_json(KIT / "config" / "mapping.json")


@pytest.fixture()
def result(mapping):
    return c.correlate(c.read_csv(EXTRACT), c.read_csv(AD), c.read_entra(ENTRA), mapping)


def record(result, key):
    return [r for r in result["records"] if r["person_key"] == key][0]


def test_report_matches_the_shared_expected_file(result):
    expected = c.load_json(CF / "expected_correlation_report.json")
    got = c.report(result, dt.date(2026, 10, 25), {})
    got.pop("inputs")
    assert json.loads(json.dumps(got)) == expected


def test_quarantine_matches_the_shared_expected_file(result):
    assert json.loads(json.dumps(result["quarantine"])) == c.load_json(CF / "expected_correlation_quarantine.json")


@pytest.mark.parametrize("key,status", [
    ("100000", "matched"),
    ("100002", "matched_with_conflicts"),
    ("100006", "hr_only"),
    ("100008", "duplicate_key"),
    ("100010", "hr_only_inactive"),
    ("100015", "duplicate_key"),
    ("200001", "directory_only"),
    ("200002", "directory_only_disabled"),
    ("300001", "directory_only"),
])
def test_each_key_gets_one_status(result, key, status):
    assert record(result, key)["status"] == status


def test_conflicts_name_the_side_and_the_field(result):
    assert record(result, "100002")["conflicts"] == ["ad.org_code"]
    assert record(result, "100003")["conflicts"] == ["ad.account_enabled"]
    assert "HR status INACTIVE, but the AD account is enabled" in record(result, "100003")["reasons"]
    assert record(result, "100004")["conflicts"] == ["ad.worker_type_code", "ad.worker_type"]


def test_duplicates_say_where_the_key_is_held_twice(result):
    assert record(result, "100008")["reasons"] == ["held by 2 records in HR"]
    assert record(result, "100015")["reasons"] == ["held by 2 records in AD"]


def test_a_manager_that_was_not_read_is_not_a_conflict(result):
    assert record(result, "100016")["status"] == "matched"
    assert record(result, "100016")["sides"] == {"hr": 1, "ad": 1, "entra": 1}


def test_accounts_without_a_key_and_hr_rows_without_one_are_quarantined(result):
    no_key = [r for r in result["records"] if r["status"] == "no_key"]
    assert [r["account"] for r in no_key] == ["ad:S-1-5-21-1000-2015", "entra:00000000-0000-4000-8000-000000000308"]
    assert result["counts"]["hr_no_key"] == 1


def test_guests_and_service_accounts_are_left_out(result):
    assert result["totals"]["entra_accounts"] == 7
    assert result["totals"]["ad_service_accounts_skipped"] == 1
    assert all("guest" not in json.dumps(q) for q in result["quarantine"])


def test_rates_measure_the_gate_2_match(result):
    assert result["rates"] == {"active_workers_matched_percent": 61.5, "enabled_accounts_matched_percent": 63.2}


def test_without_the_entra_export_only_ad_is_joined(mapping):
    r = c.correlate(c.read_csv(EXTRACT), c.read_csv(AD), None, mapping)
    assert r["totals"]["entra_accounts"] is None
    assert record(r, "100014")["status"] == "hr_only"
    assert "300001" not in [x["person_key"] for x in r["records"]]


def test_main_writes_both_files_and_exits_2_with_a_quarantine(tmp_path):
    code = c.main(["--extract", str(EXTRACT), "--ad", str(AD), "--entra", str(ENTRA), "--as-of", "2026-10-25", "--out", str(tmp_path)])
    assert code == c.EXIT_QUARANTINE
    report = json.loads((tmp_path / "correlation-report.json").read_text(encoding="utf-8"))
    assert report["schema"] == "fmp-hcm-correlation/1"
    assert report["inputs"]["entra_sha256"] == c.file_sha256(ENTRA)
    assert len(json.loads((tmp_path / "correlation-quarantine.json").read_text(encoding="utf-8"))) == report["totals"]["quarantined"]


def test_the_report_carries_no_names_or_addresses(tmp_path):
    c.main(["--extract", str(EXTRACT), "--ad", str(AD), "--entra", str(ENTRA), "--as-of", "2026-10-25", "--out", str(tmp_path)])
    text = (tmp_path / "correlation-report.json").read_text(encoding="utf-8")
    for name in ("Morgan", "José", "Ramírez", "@contoso.example", "ORG-100"):
        assert name not in text


def test_clean_inputs_exit_0(tmp_path):
    hr = tmp_path / "hr.csv"
    ad = tmp_path / "ad.csv"
    with open(EXTRACT, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    with open(hr, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerow(rows[0])
    with open(AD, encoding="utf-8", newline="") as f:
        arows = list(csv.DictReader(f))
    with open(ad, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(arows[0].keys()))
        w.writeheader()
        w.writerow(arows[0])
    assert c.main(["--extract", str(hr), "--ad", str(ad), "--as-of", "2026-10-25", "--out", str(tmp_path / "out")]) == c.EXIT_OK


def test_a_bad_file_is_an_error_not_a_pass(tmp_path):
    assert c.main(["--extract", str(tmp_path / "missing.csv"), "--ad", str(AD), "--out", str(tmp_path)]) == c.EXIT_ERROR
