"""The workbook and CSVs match the shared vocabulary, the repo's mappings, and a fresh build."""

import csv
import re
import zipfile

import pytest

import build_template as bt
import catalog_schema as cs
import examples_data
import finding_contract as fc
from conftest import KIT, REPO

XLSX = KIT / "catalog_template.xlsx"


def test_vocabulary_is_read_from_finding_contract():
    assert cs.DRIFT_CLASSES == fc.DRIFT_CLASSES + [cs.NO_DRIFT]
    assert cs.SEVERITIES == list(fc.PRIORITY)
    assert cs.SYSTEMS == fc.SYSTEMS + [cs.OTHER_SYSTEM]
    assert [cs.window_text(s) for s in cs.SEVERITIES] == ["Immediate", "1 hour", "24 hours", "72 hours"]


def test_lanes_are_book_13_appendix_b_lanes():
    page = REPO / "docs/books/b13-governance/appendix-b-ticket-to-machine-reference.md"
    if not page.exists():
        pytest.skip("the workbook's pages aren't in this download")
    text = page.read_text(encoding="utf-8")
    for lane in cs.LANES:
        assert f"| {lane} |" in text, lane


def _appendix_a_rows():
    page = REPO / "docs/books/b13-governance/appendix-a-requirements-mapping.md"
    if not page.exists():
        pytest.skip("the workbook's pages aren't in this download")
    rows = {}
    for line in page.read_text(encoding="utf-8").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) > 5 and re.fullmatch(r"[A-Z]{2}-\d+(\(\d+\))?", cells[0]):
            ksi = next((c for c in cells if c.startswith("KSI-")), "")
            rows[cells[0]] = ["KSI-" + k.strip().removeprefix("KSI-") for k in ksi.split(",") if k.strip()]
    return rows


def test_control_ksis_match_book_13_appendix_a():
    rows = _appendix_a_rows()
    for control, ksis in cs.CONTROL_KSIS.items():
        if cs.control_source(control) == cs.APPENDIX_A:
            assert rows[control] == ksis, control


SOURCE_PAGES = {
    "Book 13, Appendix A": "docs/books/b13-governance/appendix-a-requirements-mapping.md",
    "Book 12, Chapter 12": "docs/books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md",
    "Book 02, Chapter 10": "docs/books/b02-identity/10-migrating-and-governing.md",
}


def test_every_ksi_is_cited_by_the_page_its_row_names():
    for control, ksis in cs.CONTROL_KSIS.items():
        source = cs.control_source(control)
        page = next((REPO / path for name, path in SOURCE_PAGES.items() if source.startswith(name)), None)
        if not ksis:
            assert "no indicator" in source.lower(), control
            continue
        assert page is not None, control
        if not page.exists():
            pytest.skip("the workbook's pages aren't in this download")
        text = page.read_text(encoding="utf-8")
        for ksi in ksis:
            assert ksi in text or ksi.removeprefix("KSI-") in text, (control, ksi)


def test_csv_files_match_a_fresh_build(tmp_path):
    bt.write_csv(tmp_path / "t.csv", [])
    bt.write_csv(tmp_path / "e.csv", examples_data.rows())
    assert (KIT / "catalog_template.csv").read_text(encoding="utf-8") == (tmp_path / "t.csv").read_text(encoding="utf-8")
    assert (KIT / "examples.csv").read_text(encoding="utf-8") == (tmp_path / "e.csv").read_text(encoding="utf-8")
    with open(KIT / "catalog_template.csv", encoding="utf-8") as handle:
        assert next(csv.reader(handle)) == cs.HEADERS


def test_examples_are_fictional_and_complete():
    rows = examples_data.rows()
    assert 15 <= len(rows) - len(examples_data.PRACTICE_IDS) <= 25
    for row in rows:
        assert row["Task ID"] and row["Lane"] in cs.LANES and row["Trigger"] in cs.TRIGGERS
        assert row["Response window"] == cs.window_text(row["Severity"])
    assert "contoso.example" in " ".join(r["C1 Origin (who asks)"] for r in rows)


def test_check_formulas_point_at_the_right_columns():
    formulas = bt.check_formulas("Tasks", 7)
    assert len(formulas) == len(cs.CHECKS) + 2
    assert f"'Tasks'!${bt.letter('Owner')}7" in formulas[1]
    assert f"'Tasks'!${bt.letter('Notes')}7" in formulas[2]
    assert '"Machine, gated"' in formulas[3] and '"Machine, autonomous"' in formulas[3]
    assert f"'Tasks'!${bt.letter('Identity sponsor')}7" in formulas[7]
    assert f'COUNTIF($B7:${bt.LAST_CHECK}7,"FLAG")' in formulas[-1]


@pytest.fixture
def openpyxl():
    # CI installs openpyxl; elsewhere these tests skip rather than fail.
    return pytest.importorskip("openpyxl")


def _values(openpyxl, path):
    wb = openpyxl.load_workbook(path)
    return {ws.title: [[c.value for c in row] for row in ws.iter_rows()] for ws in wb.worksheets}


def test_committed_workbook_matches_a_fresh_build(openpyxl, tmp_path):
    fresh = bt.build_workbook(tmp_path / "fresh.xlsx")
    assert _values(openpyxl, XLSX) == _values(openpyxl, fresh)


def test_workbook_has_no_macros_and_the_expected_sheets(openpyxl):
    assert XLSX.suffix == ".xlsx"
    with zipfile.ZipFile(XLSX) as zf:
        assert not any("vbaProject" in name for name in zf.namelist())
    wb = openpyxl.load_workbook(XLSX)
    assert wb.sheetnames == bt.SHEETS


def test_every_enumerated_column_has_a_drop_down(openpyxl):
    wb = openpyxl.load_workbook(XLSX)
    for sheet in ("Tasks", "Examples"):
        ws = wb[sheet]
        covered = {str(dv.sqref).split(":")[0].rstrip("0123456789") for dv in ws.data_validations.dataValidation}
        assert {bt.letter(name) for name in cs.ENUMS} <= covered, sheet
    lists = wb["Lists"]
    assert [lists[f"C{i}"].value for i in range(2, len(cs.DRIFT_CLASSES) + 2)] == cs.DRIFT_CLASSES
    assert [lists[f"D{i}"].value for i in range(2, len(fc.DRIFT_CLASSES) + 2)] == [
        fc.DEFAULT_SEVERITY[d] for d in fc.DRIFT_CLASSES]


def test_examples_sheet_holds_the_example_rows(openpyxl):
    ws = openpyxl.load_workbook(XLSX)["Examples"]
    ids = [ws.cell(row=r, column=1).value for r in range(2, ws.max_row + 1)]
    assert ids == [r["Task ID"] for r in examples_data.rows()]
