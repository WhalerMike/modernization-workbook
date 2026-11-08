#!/usr/bin/env python3
"""Put back the three links that link_sources.py clears, after it has run.

link_sources.py links the Sources lines to the books and the Source Register, and it clears every other
hyperlink on a slide so a second run gives the same result. This deck has links of its own:

    slides 12, 13  the implementation guide and the scripts kit (examples/dp-consolidation)
    slide 15       "PSAppDeployToolkit" in the Sources line  ->  the toolkit's site
    slide 16       the decision guide and the project plan

Run it on the built deck, plain or narrated, after link_sources.py (it changes only slide XML and its
relationships, so narration, timings and captions stay as they are). Running it twice is harmless.

    python add_links.py Guide_DP_Consolidation_Executive.pptx
"""

from __future__ import annotations

import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

from lxml import etree

A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PR = "{http://schemas.openxmlformats.org/package/2006/relationships}"
HYPERLINK = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
SITE = "https://whalermike.github.io/modernization-workbook/docs/"
LINKS = {
    12: [("Implementation guide: DP consolidation", SITE + "books/guides/dp-consolidation-implementation.html"),
         ("Scripts kit: examples/dp-consolidation", "https://github.com/WhalerMike/modernization-workbook/tree/main/examples/dp-consolidation")],
    13: [("Implementation guide: DP consolidation", SITE + "books/guides/dp-consolidation-implementation.html"),
         ("Scripts kit: examples/dp-consolidation", "https://github.com/WhalerMike/modernization-workbook/tree/main/examples/dp-consolidation")],
    15: [("PSAppDeployToolkit", "https://psappdeploytoolkit.com/")],
    16: [("Decision guide: DP consolidation", SITE + "books/guides/dp-consolidation.html"),
         ("Project plan: content delivery", SITE + "project-plans/content-delivery.html")],
}


def main(path: Path) -> None:
    tmp = Path(tempfile.mkdtemp()) / path.name
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            for n, wanted in LINKS.items():
                if item.filename == f"ppt/slides/slide{n}.xml":
                    slide = etree.fromstring(data)
                    rels_name = f"ppt/slides/_rels/slide{n}.xml.rels"
                    rels = etree.fromstring(zin.read(rels_name))
                    for text, url in wanted:
                        for run in slide.iter(A + "r"):
                            t = run.find(A + "t")
                            if t is None or t.text != text:
                                continue
                            rpr = run.find(A + "rPr")
                            if rpr is None:
                                rpr = etree.Element(A + "rPr")
                                run.insert(0, rpr)
                            for old in rpr.findall(A + "hlinkClick"):
                                rpr.remove(old)
                            rid = next((r.get("Id") for r in rels if r.get("Target") == url), None)
                            if rid is None:
                                used = [int("".join(c for c in r.get("Id") if c.isdigit()) or 0) for r in rels]
                                rid = f"rId{max(used + [0]) + 1}"
                                etree.SubElement(rels, PR + "Relationship", Id=rid, Type=HYPERLINK,
                                                 Target=url, TargetMode="External")
                            link = etree.SubElement(rpr, A + "hlinkClick")
                            link.set(R + "id", rid)
                    data = etree.tostring(slide, xml_declaration=True, encoding="UTF-8", standalone=True)
                    zout.writestr(rels_name, etree.tostring(rels, xml_declaration=True, encoding="UTF-8", standalone=True))
                    break
            if not any(item.filename == f"ppt/slides/_rels/slide{n}.xml.rels" for n in LINKS):
                zout.writestr(item, data)
            elif item.filename.endswith(".rels"):
                continue  # written above with the new relationships
    shutil.move(str(tmp), str(path))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
