"""Build the Ticket-to-Machine task catalog workbook and its two CSV files.

Writes, into the kit folder unless --out says otherwise:

  catalog_template.xlsx  the workbook: ReadMe, Tasks, Checks, Examples, Example checks,
                         Controls and Lists. No macros: formulas and drop-downs only.
  catalog_template.csv   the Tasks columns with no rows
  examples.csv           the worked examples, the same rows as the Examples sheet

The columns, drop-down values, control mapping and checks come from
catalog_schema.py, which reads the drift classes, severities and response
windows from the integration kit's finding_contract.py. The same commit always
gives the same cell contents. Needs openpyxl (pip install openpyxl).

Examples (from the kit root):

  python build_template.py
  python build_template.py --out C:/Temp/catalog
"""

from __future__ import annotations

import argparse
import csv
import sys
from datetime import datetime
from pathlib import Path

import catalog_schema as cs
import examples_data

KIT = Path(__file__).resolve().parent
TASK_ROWS = 200                      # rows prepared with drop-downs and formulas
FIXED_TIME = datetime(2026, 11, 2)   # workbook properties, so rebuilds don't differ
SHEETS = ["ReadMe", "Tasks", "Checks", "Examples", "Example checks", "Controls", "Lists"]

README_LINES = [
    ("Ticket-to-Machine task catalog", "title"),
    ("A workbook for listing your agency's day-to-day Ticket-to-Machine tasks, one row per task.", ""),
    ("Fill it in at work, inside your agency. Nothing you write here goes back to the public workbook.", ""),
    ("", ""),
    ("Before you start", "head"),
    ("A filled catalog maps how your systems are administered. Ask your ISSO how to label and store it.", ""),
    ("Store it on agency OneDrive, SharePoint or Teams, or in an agency-hosted repository.", ""),
    ("Never store it in a personal or public repository.", ""),
    ("", ""),
    ("Steps", "head"),
    ("1. Read the Examples sheet. EX-P1, EX-P2 and EX-P3 fail checks on purpose, for practice.", ""),
    ("2. On the Tasks sheet, add one row per task. Use the drop-downs for every column that has one: "
     + ", ".join(cs.ENUMS) + ".", ""),
    ("3. Name the five clauses for each task: who asks (C1), who approves (C2), what runs and as which "
     "identity (C3), the re-read check (C4) and the evidence kept (C5).", ""),
    ("   If the executing identity is an AI agent, name its sponsor, have a person approve high-impact "
     "work before it runs, and have an independent checker do the re-read.", ""),
    ("4. Look up the task type on the Controls sheet and copy its controls. Copy the KSIs from the same sheet.", ""),
    ("5. Open the Checks sheet. Fix every row marked FIX until all rows say PASS.", ""),
    ("6. Have the owner of each task and your ISSO review the catalog. Then set Status to Approved.", ""),
    ("7. Optional: save the Tasks sheet as CSV UTF-8 and run check_catalog.py, if Python is allowed.", ""),
    ("", ""),
    ("The checks", "head"),
] + [(f"{title}: {meaning}", "") for _, title, meaning in cs.CHECKS] + [
    ("", ""),
    ("Response window", "head"),
    ("Filled from the severity: " + ", ".join(f"{s} {cs.window_text(s).lower()}" for s in cs.SEVERITIES)
     + ". This is program design (Book 13, Appendix B), not a federal requirement.", ""),
    ("", ""),
    ("About the KSIs", "head"),
    ("Key Security Indicators are FedRAMP 20x indicators for cloud service providers. An agency doesn't "
     "report them. Line your own evidence up with what your providers report against them.", ""),
    ("", ""),
    ("Copilot", "head"),
    ("copilot-prompts.md has prompts for Microsoft 365 Copilot Chat and, in an agency-hosted repository "
     "only, GitHub Copilot. Check every suggestion against this workbook and with your ISSO.", ""),
    ("", ""),
    ("The columns", "head"),
] + [(f"{name}: {meaning}", "") for name, meaning in cs.COLUMNS] + [
    ("", ""),
    ("Sources: Book 13, Appendix B (the loop, the five clauses, the lanes, the tempo, the evidence record) "
     "and Appendix A (the controls and indicators). All examples are fictional.", ""),
]


def _openpyxl():
    try:
        import openpyxl  # noqa: F401
    except ImportError:  # pragma: no cover
        raise SystemExit("build_template.py needs openpyxl: pip install openpyxl")
    return openpyxl


def lists_layout() -> dict:
    """Where each drop-down's values live on the Lists sheet: name -> (column letter, values)."""
    return {
        "Lane": ("A", cs.LANES),
        "Trigger": ("B", cs.TRIGGERS),
        "Drift class": ("C", cs.DRIFT_CLASSES),
        "Severity": ("G", cs.SEVERITIES),
        "Re-read system": ("L", cs.SYSTEMS),
        "Status": ("N", cs.STATUSES),
        "Identity type": ("P", cs.IDENTITY_TYPES),
        "High impact": ("R", cs.YES_NO),
        "Human approval before action": ("R", cs.YES_NO),
        "Re-read by": ("T", cs.REREAD_BY),
    }


def _range(column: str, values: list) -> str:
    return f"Lists!${column}$2:${column}${len(values) + 1}"


def build_lists(ws) -> None:
    from openpyxl.styles import Font
    layout = lists_layout()
    for name, (column, values) in layout.items():
        ws[f"{column}1"] = name
        for i, value in enumerate(values, start=2):
            ws[f"{column}{i}"] = value
    ws["R1"] = "yes or no"
    # Beside the drift classes: the default severity and whether a person decides first.
    ws["D1"], ws["E1"] = "Default severity", "Goes to a person first"
    for i, drift in enumerate(cs.DRIFT_CLASSES, start=2):
        ws[f"D{i}"] = cs.fc.DEFAULT_SEVERITY.get(drift, "n/a")
        ws[f"E{i}"] = "yes" if drift in cs.fc.HUMAN_DECISION_CLASSES else "no"
    # Beside the severities: priority, window in seconds, window in words.
    ws["H1"], ws["I1"], ws["J1"] = "Priority", "Window (seconds)", "Response window"
    for i, severity in enumerate(cs.SEVERITIES, start=2):
        ws[f"H{i}"] = int(cs.fc.PRIORITY[severity])
        ws[f"I{i}"] = cs.fc.WINDOW_SECONDS[severity]
        ws[f"J{i}"] = cs.window_text(severity)
    ws["V1"] = "Source"
    ws["V2"] = "Drift classes, defaults, windows and systems: the integration kit's finding_contract.py."
    ws["V3"] = "Lanes: Book 13, Appendix B. none means a request or routine event with no typed finding."
    for cell in ws[1]:
        cell.font = Font(bold=True)
    for column in "ABCDEGHIJLNPRTV":
        ws.column_dimensions[column].width = 24


def _header(ws, headers, widths=None) -> None:
    from openpyxl.styles import Alignment, Font, PatternFill
    fill = PatternFill("solid", fgColor="1F3864")
    for i, name in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=i, value=name)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = fill
        cell.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "C2" if ws.title in ("Tasks", "Examples") else "B2"
    from openpyxl.utils import get_column_letter
    for i, _ in enumerate(headers, start=1):
        ws.column_dimensions[get_column_letter(i)].width = (widths or {}).get(i, 22)


def letter(header: str) -> str:
    from openpyxl.utils import get_column_letter
    return get_column_letter(cs.COL[header] + 1)


def window_formula(row: int) -> str:
    sev = f"${letter('Severity')}{row}"
    return f'=IF({sev}="","",IFERROR(VLOOKUP({sev},Lists!$G$2:$J${len(cs.SEVERITIES) + 1},4,FALSE),""))'


def build_task_sheet(ws, rows: list[dict], prepared: int) -> None:
    """Headers, drop-downs on every prepared row, the response-window formula, and any rows given."""
    from openpyxl.comments import Comment
    from openpyxl.styles import Alignment
    from openpyxl.worksheet.datavalidation import DataValidation
    widths = {"Task ID": 12, "Task name": 34, "C1 Origin (who asks)": 34, "C2 Approver role (who approves)": 34,
              "C3 Action (what runs)": 38, "C3 Executing identity (as which identity)": 30,
              "C4 Re-read check (how closure is proven)": 40, "C5 Evidence kept": 34, "Notes": 34}
    _header(ws, cs.HEADERS, {cs.COL[name] + 1: w for name, w in widths.items()})
    for name, meaning in cs.COLUMNS:
        ws.cell(row=1, column=cs.COL[name] + 1).comment = Comment(meaning, "Task catalog")
    last = prepared + 1
    for name, (column, values) in lists_layout().items():
        dv = DataValidation(type="list", formula1="=" + _range(column, values), allow_blank=True,
                            showErrorMessage=True, errorTitle="Not on the list",
                            error=f"Choose a {name.lower()} from the list.")
        dv.add(f"{letter(name)}2:{letter(name)}{last}")
        ws.add_data_validation(dv)
    for r, row in enumerate(rows, start=2):
        for name in cs.HEADERS:
            if name != "Response window":
                ws.cell(row=r, column=cs.COL[name] + 1, value=row.get(name) or None)
    for r in range(2, last + 1):
        ws.cell(row=r, column=cs.COL["Response window"] + 1, value=window_formula(r))
        for c in range(1, len(cs.HEADERS) + 1):
            ws.cell(row=r, column=c).alignment = Alignment(wrap_text=True, vertical="top")


LAST_CHECK = chr(ord("A") + len(cs.CHECKS))         # the last check's column on the Checks sheet
RESULT = chr(ord("A") + len(cs.CHECKS) + 1)         # the Result column
SUMMARY, SUMMARY_VALUE = chr(ord(RESULT) + 2), chr(ord(RESULT) + 3)


def check_formulas(sheet: str, r: int) -> list[str]:
    """The Checks sheet's formulas for row r of sheet: Task ID, the five checks, the result."""
    s = f"'{sheet}'!"
    col = lambda h: f"{s}${letter(h)}{r}"  # noqa: E731
    blank = lambda h: f'TRIM({col(h)})=""'  # noqa: E731
    n = len(cs.DRIFT_CLASSES) + 1
    task = col("Task ID")
    guard = f'=IF(TRIM({task})="","",'
    default = f'IFERROR(VLOOKUP({col("Drift class")},Lists!$C$2:$D${n},2,FALSE),"n/a")'
    person = f'IFERROR(VLOOKUP({col("Drift class")},Lists!$C$2:$E${n},3,FALSE),"no")'
    lane = col("Lane")
    machine = ",".join(f'{lane}="{x}"' for x in sorted(cs.MACHINE_LANES))
    return [
        f'=IF(TRIM({task})="","",{task})',
        guard + f'IF(OR({blank("Owner")},{blank("C2 Approver role (who approves)")},'
                f'{blank("C4 Re-read check (how closure is proven)")}),"FLAG","ok"))',
        guard + f'IF(AND({default}<>"n/a",{col("Severity")}<>{default},{blank("Notes")}),"FLAG","ok"))',
        guard + f'IF(AND({person}="yes",OR({machine})),"FLAG","ok"))',
        guard + f'IF({blank("C5 Evidence kept")},"FLAG","ok"))',
        guard + f'IF({blank("NIST SP 800-53 controls")},"FLAG","ok"))',
        guard + f'IF(AND({col("High impact")}="yes",{col("Human approval before action")}<>"yes"),"FLAG","ok"))',
        guard + f'IF(AND({col("Identity type")}="{cs.AI_AGENT}",OR({blank("Identity sponsor")},'
                f'AND(OR({col("High impact")}="yes",{person}="yes"),{col("Human approval before action")}<>"yes"),'
                f'{col("Re-read by")}<>"{cs.INDEPENDENT}")),"FLAG","ok"))',
        f'=IF($A{r}="","",IF(COUNTIF($B{r}:${LAST_CHECK}{r},"FLAG")=0,"PASS","FIX"))',
    ]


def build_checks(ws, sheet: str, prepared: int) -> None:
    from openpyxl.formatting.rule import CellIsRule
    from openpyxl.styles import Font, PatternFill
    headers = ["Task ID"] + [title for _, title, _ in cs.CHECKS] + ["Result"]
    _header(ws, headers, {1: 12, len(headers): 10})
    last = prepared + 1
    res = RESULT
    for r in range(2, last + 1):
        for c, formula in enumerate(check_formulas(sheet, r), start=1):
            ws.cell(row=r, column=c, value=formula)
    red = PatternFill("solid", fgColor="F8CBAD")
    green = PatternFill("solid", fgColor="C6EFCE")
    ws.conditional_formatting.add(f"B2:{LAST_CHECK}{last}",
                                  CellIsRule(operator="equal", formula=['"FLAG"'], fill=red))
    ws.conditional_formatting.add(f"{res}2:{res}{last}", CellIsRule(operator="equal", formula=['"FIX"'], fill=red))
    ws.conditional_formatting.add(f"{res}2:{res}{last}", CellIsRule(operator="equal", formula=['"PASS"'], fill=green))
    k, v = SUMMARY, SUMMARY_VALUE
    ws[f"{k}1"] = "Summary"
    ws[f"{k}1"].font = Font(bold=True)
    ws[f"{k}2"], ws[f"{v}2"] = "Rows checked", f'=COUNTIF({res}2:{res}{last},"PASS")+COUNTIF({res}2:{res}{last},"FIX")'
    ws[f"{k}3"], ws[f"{v}3"] = "PASS", f'=COUNTIF({res}2:{res}{last},"PASS")'
    ws[f"{k}4"], ws[f"{v}4"] = "FIX", f'=COUNTIF({res}2:{res}{last},"FIX")'
    ws[f"{k}6"] = f"Each row checks the same row of the {sheet} sheet. FLAG means the rule below failed."
    for i, (_, title, meaning) in enumerate(cs.CHECKS, start=7):
        ws[f"{k}{i}"] = f"{title}: {meaning}"
    ws.column_dimensions[k].width = 60


def build_controls(ws) -> None:
    from openpyxl.styles import Alignment, Font
    headers = ["Task type", "Typical drift class", "Typical lane", "Suggested NIST SP 800-53 controls",
               "KSIs (provider-side)", "Why"]
    _header(ws, headers, {1: 30, 4: 30, 5: 44, 6: 60})
    r = 2
    for name, drift, lane, controls, why in cs.TASK_TYPES:
        for c, value in enumerate([name, drift, lane, "; ".join(controls),
                                   "; ".join(cs.ksis_for(controls)), why], start=1):
            ws.cell(row=r, column=c, value=value).alignment = Alignment(wrap_text=True, vertical="top")
        r += 1
    r += 1
    ws.cell(row=r, column=1, value="Control to indicator").font = Font(bold=True)
    r += 1
    for c, value in enumerate(["Control", "Title", "KSIs", "Source"], start=1):
        ws.cell(row=r, column=c, value=value).font = Font(bold=True)
    r += 1
    for control in cs.CONTROL_KSIS:
        ksis = "; ".join(cs.CONTROL_KSIS[control]) or "none"
        for c, value in enumerate([control, cs.CONTROL_TITLES[control], ksis, cs.control_source(control)],
                                  start=1):
            ws.cell(row=r, column=c, value=value).alignment = Alignment(wrap_text=True, vertical="top")
        r += 1
    r += 1
    notes = [
        "Key Security Indicators (KSIs) are FedRAMP 20x indicators for cloud service providers. An agency "
        "doesn't report KSIs itself; it lines its own evidence up with what its providers report against them.",
        "Book 13, Appendix A lists each indicator whose Related SP 800-53 Controls cite the control, from "
        "FedRAMP's page as read on October 21, 2026. FedRAMP revised many mappings on October 13, 2026: "
        "check the page before relying on a row.",
        "The task types and suggested controls are program design. Your ISSO decides the controls for your system.",
    ]
    for note in notes:
        ws.cell(row=r, column=1, value=note)
        r += 1


def build_readme(ws) -> None:
    from openpyxl.styles import Alignment, Font
    ws.column_dimensions["A"].width = 120
    for r, (text, style) in enumerate(README_LINES, start=1):
        cell = ws.cell(row=r, column=1, value=text or None)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        if style == "title":
            cell.font = Font(bold=True, size=16)
        elif style == "head":
            cell.font = Font(bold=True, size=12)


def build_workbook(path: Path) -> Path:
    openpyxl = _openpyxl()
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    sheets = {name: wb.create_sheet(name) for name in SHEETS}
    build_readme(sheets["ReadMe"])
    build_task_sheet(sheets["Tasks"], [], TASK_ROWS)
    build_checks(sheets["Checks"], "Tasks", TASK_ROWS)
    examples = examples_data.rows()
    build_task_sheet(sheets["Examples"], examples, len(examples))
    build_checks(sheets["Example checks"], "Examples", len(examples))
    build_controls(sheets["Controls"])
    build_lists(sheets["Lists"])
    wb.properties.creator = "Federal Modernization Workbook"
    wb.properties.title = "Ticket-to-Machine task catalog"
    wb.properties.created = FIXED_TIME
    wb.properties.modified = FIXED_TIME
    wb.active = 0
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)
    return path


def write_csv(path: Path, rows: list[dict]) -> Path:
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=cs.HEADERS, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    return path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", type=Path, default=KIT, help="output folder (default: the kit folder)")
    args = parser.parse_args(argv)
    workbook = build_workbook(args.out / "catalog_template.xlsx")
    template = write_csv(args.out / "catalog_template.csv", [])
    examples = write_csv(args.out / "examples.csv", examples_data.rows())
    for path in (workbook, template, examples):
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
