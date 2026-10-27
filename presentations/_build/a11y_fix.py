"""Make a built deck accessible, in place: the fixes PowerPoint's Accessibility Checker asks for, plus captions.

Usage:  python presentations/_build/a11y_fix.py <deck.pptx> [--captions <narration folder>]

Every build runs this after writing a deck (lib.js save(); build_narrated.ps1 for the narrated edition), so the
fixes never depend on someone remembering them. It is safe to run more than once.

  - Document properties: author and last-modified-by are the presenter, Michael F. Stratton; a title is set.
  - The presenter's name: "Mike Stratton" on a slide becomes "Michael F. Stratton".
  - Pictures: icons and other images whose alt text is empty, a file name or a file path are marked decorative
    (their meaning is carried by the text beside them); a real description is kept.
  - Shapes without text (cards, rings, rules, tag pills) are marked decorative, so screen readers skip them.
  - Tables: the first row is marked as the header row.
  - Narration audio: gets alt text ("Narration for this slide; captions available"), and with --captions each
    slide's clip gets its WebVTT caption track (narration folder/slideNN.vtt) embedded as a PowerPoint closed-
    caption track (MS-PPTX 2.1.3 Track part, tracksInfo extension). In the slide show, the captions button on the
    media controls, or Slide Show > Always Use Subtitles, turns them on and off.
"""
from __future__ import annotations

import os
import re
import shutil
import sys
import tempfile
import uuid
import zipfile
from pathlib import Path

from lxml import etree

PRESENTER = "Michael F. Stratton"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
P14 = "http://schemas.microsoft.com/office/powerpoint/2010/main"
P173 = "http://schemas.microsoft.com/office/powerpoint/2017/3/main"
ADEC = "http://schemas.microsoft.com/office/drawing/2017/decorative"
PKG = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
DECORATIVE_URI = "{C183D7F6-B498-43B3-948B-1728B52AA6E4}"
TRACKS_URI = "{3AFAAA56-56D3-431D-BCD4-E75A35582382}"
TRACK_REL = "http://schemas.microsoft.com/office/2017/04/relationships/track"
NS = {"a": A, "p": P, "r": R, "p14": P14, "p173": P173}
NARRATION_ALT = "Narration for this slide; captions available"


def q(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


def looks_like_file(descr: str) -> bool:
    d = descr.strip()
    # A path has no spaces; alt text can contain a slash ("DNS/DDI team") and still be a sentence.
    return not d or bool(re.fullmatch(r"\S*[\\/]\S*", d)) or bool(re.search(r"\.(png|jpe?g|gif|svg|emf|wmf|bmp)$", d, re.I))


def mark_decorative(cnvpr) -> bool:
    ext_lst = cnvpr.find("a:extLst", NS)
    if ext_lst is not None and any(e.get("uri") == DECORATIVE_URI for e in ext_lst):
        return False
    if ext_lst is None:
        ext_lst = etree.SubElement(cnvpr, q(A, "extLst"))
    ext = etree.SubElement(ext_lst, q(A, "ext"), uri=DECORATIVE_URI)
    etree.SubElement(ext, q(ADEC, "decorative"), nsmap={"adec": ADEC}, val="1")
    cnvpr.set("descr", "")
    return True


def fix_slide(xml: bytes, captions: dict | None, rels, slide_no: int, add_part) -> tuple[bytes, dict]:
    root = etree.fromstring(xml)
    n = {"decorative": 0, "tables": 0, "names": 0, "media": 0, "captions": 0}
    tree = root.find("p:cSld/p:spTree", NS)
    for t in root.iter(q(A, "t")):
        if t.text and "Mike Stratton" in t.text:
            t.text = t.text.replace("Mike Stratton", PRESENTER)
            n["names"] += 1
    for pic in tree.iter(q(P, "pic")):
        cnv = pic.find("p:nvPicPr/p:cNvPr", NS)
        nvpr = pic.find("p:nvPicPr/p:nvPr", NS)
        audio = nvpr is not None and (nvpr.find("a:audioFile", NS) is not None or nvpr.find("a:videoFile", NS) is not None)
        if audio:
            if cnv.get("descr") != NARRATION_ALT:
                cnv.set("descr", NARRATION_ALT)
                cnv.set("title", "Narration")
                n["media"] += 1
            if captions is not None and slide_no in captions:
                media = nvpr.find(".//p14:media", NS)
                if media is not None and media.find(".//p173:tracksInfo", NS) is None:
                    rid = add_part(captions[slide_no])
                    ext_lst = media.find("p14:extLst", NS)
                    if ext_lst is None:
                        ext_lst = etree.SubElement(media, q(P14, "extLst"))
                    ext = etree.SubElement(ext_lst, q(P, "ext"), uri=TRACKS_URI)
                    info = etree.SubElement(ext, q(P173, "tracksInfo"), nsmap={"p173": P173}, displayLoc="slide")
                    lst = etree.SubElement(info, q(P173, "trackLst"))
                    track = etree.SubElement(lst, q(P173, "track"), id="{" + str(uuid.uuid4()).upper() + "}",
                                             label="English (captions)", lang="en-US")
                    track.set(q(R, "embed"), rid)
                    n["captions"] += 1
        elif looks_like_file(cnv.get("descr", "")):
            n["decorative"] += mark_decorative(cnv)
    for sp in tree.iter(q(P, "sp")):
        if sp.find("p:nvSpPr/p:nvPr/p:ph", NS) is not None:
            continue
        text = "".join(t.text or "" for t in sp.iter(q(A, "t"))).strip()
        if not text:
            n["decorative"] += mark_decorative(sp.find("p:nvSpPr/p:cNvPr", NS))
    for cxn in tree.iter(q(P, "cxnSp")):
        n["decorative"] += mark_decorative(cxn.find("p:nvCxnSpPr/p:cNvPr", NS))
    for tbl_pr in tree.iter(q(A, "tblPr")):
        if tbl_pr.get("firstRow") != "1":
            tbl_pr.set("firstRow", "1")
            tbl_pr.set("bandRow", "1")
            n["tables"] += 1
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True), n


def main(argv):
    deck = Path(argv[0])
    cap_dir = Path(argv[argv.index("--captions") + 1]) if "--captions" in argv else None
    captions = None
    if cap_dir is not None:
        captions = {int(m.group(1)): f for f in sorted(cap_dir.glob("slide*.vtt")) if (m := re.match(r"slide(\d+)\.vtt", f.name))}
        if not captions:
            sys.exit(f"no slideNN.vtt files in {cap_dir}: run captions.py first")

    src = zipfile.ZipFile(deck)
    files = {i.filename: src.read(i.filename) for i in src.infolist()}
    order = [i.filename for i in src.infolist()]
    src.close()

    # core properties
    core = etree.fromstring(files["docProps/core.xml"])
    cns = {"dc": "http://purl.org/dc/elements/1.1/", "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"}
    for tag in ("dc:creator", "cp:lastModifiedBy"):
        el = core.find(tag, cns)
        if el is None:
            pre, local = tag.split(":")
            el = etree.SubElement(core, f"{{{cns[pre]}}}{local}")
        el.text = PRESENTER
    title = core.find("dc:title", cns)
    if title is None or not (title.text or "").strip():
        if title is None:
            title = etree.SubElement(core, "{http://purl.org/dc/elements/1.1/}title")
        title.text = deck.stem.replace("_", " ")
    files["docProps/core.xml"] = etree.tostring(core, xml_declaration=True, encoding="UTF-8", standalone=True)
    if "docProps/app.xml" in files:
        files["docProps/app.xml"] = re.sub(rb"<Company>[^<]*</Company>", b"<Company></Company>", files["docProps/app.xml"])

    # slides
    pres = etree.fromstring(files["ppt/presentation.xml"])
    prels = etree.fromstring(files["ppt/_rels/presentation.xml.rels"])
    rid2t = {r.get("Id"): r.get("Target") for r in prels}
    slide_parts = ["ppt/" + rid2t[s.get(q(R, "id"))] for s in pres.find("p:sldIdLst", NS)]
    totals = {}
    vtt_added = 0
    for no, part in enumerate(slide_parts, 1):
        relp = part.replace("slides/", "slides/_rels/") + ".rels"
        rels = etree.fromstring(files[relp]) if relp in files else etree.Element(q(PKG, "Relationships"), nsmap={None: PKG})

        def add_part(vtt_path: Path, rels=rels, no=no) -> str:
            nonlocal vtt_added
            name = f"ppt/media/captions_slide{no:02d}.vtt"
            files[name] = vtt_path.read_bytes()
            if name not in order:
                order.append(name)
            used = {r.get("Id") for r in rels}
            rid = next(f"rId{k}" for k in range(1, 999) if f"rId{k}" not in used)
            etree.SubElement(rels, q(PKG, "Relationship"), Id=rid, Type=TRACK_REL, Target=f"../media/captions_slide{no:02d}.vtt")
            vtt_added += 1
            return rid

        files[part], n = fix_slide(files[part], captions, rels, no, add_part)
        files[relp] = etree.tostring(rels, xml_declaration=True, encoding="UTF-8", standalone=True)
        for k, v in n.items():
            totals[k] = totals.get(k, 0) + v

    if vtt_added:
        ct = etree.fromstring(files["[Content_Types].xml"])
        if not any(d.get("Extension") == "vtt" for d in ct.findall(q(CT, "Default"))):
            etree.SubElement(ct, q(CT, "Default"), Extension="vtt", ContentType="text/vtt")
            # Defaults must come before Overrides
            defaults = [e for e in ct if e.tag == q(CT, "Default")]
            others = [e for e in ct if e.tag != q(CT, "Default")]
            for e in list(ct):
                ct.remove(e)
            for e in defaults + others:
                ct.append(e)
        files["[Content_Types].xml"] = etree.tostring(ct, xml_declaration=True, encoding="UTF-8", standalone=True)

    fd, tmp = tempfile.mkstemp(suffix=".pptx", dir=deck.parent)
    os.close(fd)
    tmp = Path(tmp)
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as out:
        for name in ["[Content_Types].xml"] + [o for o in order if o != "[Content_Types].xml"]:
            out.writestr(name, files[name], zipfile.ZIP_STORED if name.endswith((".mp3", ".mp4", ".m4a", ".png", ".jpg", ".jpeg")) else zipfile.ZIP_DEFLATED)
    shutil.move(tmp, deck)
    print(f"a11y: {deck.name}: author {PRESENTER}; {totals.get('decorative', 0)} decorative, {totals.get('tables', 0)} table headers, "
          f"{totals.get('names', 0)} name fixes, {totals.get('media', 0)} narration alt texts, {totals.get('captions', 0)} caption tracks")


if __name__ == "__main__":
    main(sys.argv[1:])
