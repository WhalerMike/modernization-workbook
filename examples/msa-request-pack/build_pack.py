"""Build the request pack's Word forms and CSVs from pack_schema.py.

    python build_pack.py            # writes forms/*.docx, request_template.csv, examples.csv
    python build_pack.py --check    # exits 1 if any of them is out of date

Writing the Word forms needs python-docx; --check reads them with the standard library. Their core
properties are fixed, so the same schema always gives the same document text; --check compares the
text of each form, not its bytes.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import sys
from pathlib import Path

import pack_schema as S

HERE = Path(__file__).resolve().parent
FIXED = dt.datetime(2026, 1, 1, 0, 0, 0)


def csv_text(rows: list[dict]) -> str:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=[c[0] for c in S.COLUMNS], lineterminator="\n")
    w.writeheader()
    for r in rows:
        w.writerow(r)
    return buf.getvalue()


def form_text(form) -> list[str]:
    """The text a form holds, in order: what --check compares."""
    _file, title, purpose, fields, notes = form
    lines = [title, purpose, "Field | What to enter | Your entry"]
    lines += [f"{f} | {w} | " for f, w in fields]
    lines += ["Before you submit"] + notes
    lines += ["Neutral template from the Federal Modernization Workbook. Fill it in inside your agency, "
              "with your agency's tools; nothing you write comes back to the public workbook."]
    return lines


def build_form(form, path: Path) -> None:
    from docx import Document
    from docx.shared import Pt

    lines = form_text(form)
    doc = Document()
    doc.core_properties.created = FIXED
    doc.core_properties.modified = FIXED
    doc.core_properties.last_modified_by = "Federal Modernization Workbook"
    doc.core_properties.author = "Federal Modernization Workbook"
    doc.core_properties.title = lines[0]
    doc.add_heading(lines[0], level=1)
    doc.add_paragraph(lines[1])
    _f, _t, _p, fields, notes = form
    table = doc.add_table(rows=1, cols=3)
    table.style = "Table Grid"
    for cell, text in zip(table.rows[0].cells, ["Field", "What to enter", "Your entry"]):
        cell.text = text
        for run in cell.paragraphs[0].runs:
            run.bold = True
    for f, w in fields:
        row = table.add_row().cells
        row[0].text, row[1].text, row[2].text = f, w, ""
    doc.add_heading("Before you submit", level=2)
    for n in notes:
        doc.add_paragraph(n, style="List Bullet")
    p = doc.add_paragraph(lines[-1])
    for run in p.runs:
        run.font.size = Pt(8)
    path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(path)


def read_form_text(path: Path) -> list[str]:
    """The text of a built form, read with the standard library (no python-docx needed)."""
    import xml.etree.ElementTree as ET
    import zipfile

    w = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    with zipfile.ZipFile(path) as z:
        body = ET.fromstring(z.read("word/document.xml")).find(f"{w}body")
    out = []
    for child in body:
        if child.tag == f"{w}p":
            text = "".join(t.text or "" for t in child.iter(f"{w}t"))
            if text:
                out.append(text)
        elif child.tag == f"{w}tbl":
            for tr in child.iter(f"{w}tr"):
                out.append(" | ".join("".join(t.text or "" for t in tc.iter(f"{w}t")) for tc in tr.findall(f"{w}tc")))
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    stale = []
    for name, rows in (("request_template.csv", []), ("examples.csv", S.EXAMPLES)):
        want = csv_text(rows)
        path = HERE / name
        if args.check:
            if not path.is_file() or path.read_text(encoding="utf-8") != want:
                stale.append(name)
        else:
            path.write_text(want, encoding="utf-8", newline="\n")
    for form in S.FORMS:
        path = HERE / "forms" / form[0]
        if args.check:
            if not path.is_file() or read_form_text(path) != form_text(form):
                stale.append(f"forms/{form[0]}")
        else:
            build_form(form, path)
    if stale:
        print("out of date: " + ", ".join(stale) + " (run python build_pack.py)")
        return 1
    print("request pack current" if args.check else "wrote the forms and CSVs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
