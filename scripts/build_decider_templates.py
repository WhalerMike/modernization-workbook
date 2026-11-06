#!/usr/bin/env python3
"""Build the Word forms from the guide pages, so a download always matches its page.

Each page in PAGES holds its form between <!-- form-start --> and <!-- form-end -->.

    python scripts/build_decider_templates.py          # rebuild docs/books/guides/files/
"""
from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / "docs" / "books" / "guides"
PAGES = {
    "one-page-ask.md": ("The One-Page Ask", "The_One_Page_Ask.docx", 9.5),
    "charter-sign-off-sheet.md": ("Charter Sign-Off Sheet", "Charter_Sign_Off_Sheet.docx", 9.5),
}
NOTICE = "Federal Modernization Workbook template. Design guidance, not an official publication of any agency."


def borders(table) -> None:
    box = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        line = OxmlElement(f"w:{edge}")
        line.set(qn("w:val"), "single")
        line.set(qn("w:sz"), "4")
        line.set(qn("w:color"), "808080")
        box.append(line)
    table._tbl.tblPr.append(box)


def tidy(path: Path, title: str, size: float) -> None:
    doc = Document(path)
    for section in doc.sections:
        section.left_margin = section.right_margin = Inches(0.7)
        section.top_margin = section.bottom_margin = Inches(0.5)
    heading = doc.paragraphs[0].insert_paragraph_before()
    run = heading.add_run(title)
    run.bold = True
    run.font.size = Pt(15)
    doc.add_paragraph().add_run(NOTICE).font.size = Pt(7.5)
    cells = [p for t in doc.tables for r in t.rows for c in r.cells for p in c.paragraphs]
    for p in [*doc.paragraphs, *cells]:
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        for r in p.runs:
            if r.font.size is None:
                r.font.size = Pt(size)
    for table in doc.tables:
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        borders(table)
        for cell in table.rows[0].cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    r.bold = True
    doc.core_properties.title = title
    doc.core_properties.author = "Federal Modernization Workbook"
    doc.save(path)


def main() -> None:
    out = GUIDES / "files"
    out.mkdir(exist_ok=True)
    pandoc = shutil.which("pandoc")
    with tempfile.TemporaryDirectory() as tmp:
        for page, (title, name, size) in PAGES.items():
            text = (GUIDES / page).read_text(encoding="utf-8")
            form = re.search(r"<!-- form-start -->(.*?)<!-- form-end -->", text, re.S).group(1)
            source = Path(tmp) / f"{name}.md"
            source.write_text(form, encoding="utf-8")
            target = out / name
            subprocess.run([pandoc, str(source), "-f", "markdown", "-o", str(target),
                            "--reference-doc", str(ROOT / "assets" / "reference-mslearn.docx")], check=True)
            tidy(target, title, size)
            print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
