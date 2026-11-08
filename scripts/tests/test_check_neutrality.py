"""Tests for scripts/check_neutrality.py: matching, scope and the baseline.

The terms here are invented and hashed with a test salt, so this file names
nothing the real list guards against.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_neutrality as cn  # noqa: E402

SALT = "test-salt"
TERMS = {cn.digest(SALT, "zorbo"), cn.digest(SALT, "office of zorbo affairs"), cn.digest(SALT, "zfa")}
FIRSTS = TERMS | {cn.digest(SALT, "office")}


def found(text: str) -> list[str]:
    return [phrase for _, phrase, _ in cn.hits(text, SALT, 4, TERMS, FIRSTS)]


class Matching(unittest.TestCase):
    def test_case_and_punctuation_dont_matter(self):
        self.assertEqual(found("See ZORBO's portal at zorbo.gov."), ["zorbo", "zorbo"])

    def test_multi_word_term(self):
        self.assertEqual(found("The Office of Zorbo Affairs said"), ["office of zorbo affairs", "zorbo"])

    def test_dotted_acronym_is_one_word(self):
        self.assertEqual(found("The Z.F.A. said, and so did Z.F.A"), ["zfa", "zfa"])
        self.assertEqual(found("e.g. and i.e. are fine"), [])

    def test_not_inside_a_longer_word(self):
        self.assertEqual(found("zorbonaut and unzorbo"), [])

    def test_first_word_alone_is_not_a_hit(self):
        self.assertEqual(found("The office of something else"), [])

    def test_profile_attributes_are_ignored(self):
        self.assertEqual(found(':::: {.content-hidden unless-profile="zorbo"}'), [])
        self.assertEqual(found('{.content-visible when-profile="zorbo"} Zorbo'), ["zorbo"])

    def test_line_numbers_and_hash(self):
        out = cn.hits("ok\n  zorbo here  \n", SALT, 4, TERMS, FIRSTS)
        self.assertEqual(out, [(2, "zorbo", cn.digest(SALT, "zorbo here"))])


class Scope(unittest.TestCase):
    def test_in_scope(self):
        for p in ("docs/books/b02-identity/index.md", "docs/images/x/svg/a.svg", "examples/kit/run.ps1",
                  "data/schemas/evidence-map.schema.json", "README.md", "_quarto.yml", "presentations/a/A.pptx", "InBox/upload.docx", "assets/reference.docx",
                  "docs/images/a.png"):
            self.assertTrue(cn.in_scope(p), p)

    def test_out_of_scope(self):
        for p in ("archive/b02/x.md", "presentations/hr-driven-identity-interview/notes.md",
                  "docs/books/b02-identity/_BRIEF.md", "data/neutrality-terms.txt", "LICENSE"):
            self.assertFalse(cn.in_scope(p), p)


class TermsFile(unittest.TestCase):
    def test_read_terms(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "terms.txt"
            p.write_text("# comment\nsalt: s1\nmax-words: 3\nABC  # 1 word\nfirst: DEF\n", encoding="utf-8")
            salt, mw, hashes, firsts = cn.read_terms(p)
        self.assertEqual((salt, mw, hashes, firsts), ("s1", 3, {"abc"}, {"abc", "def"}))

    def test_read_baseline(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "baseline.txt"
            p.write_text("# why\ndocs/a.md ABC\n\n", encoding="utf-8")
            self.assertEqual(cn.read_baseline(p), {("docs/a.md", "abc")})

    def test_the_real_list_loads(self):
        salt, mw, hashes, firsts = cn.read_terms()
        self.assertTrue(salt and hashes and hashes <= firsts and mw >= 1)


# ---- Office files, archives and file names (fixtures are built here from the invented test term) ----

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"


def _scan(text: str):
    return cn.hits(text, SALT, 4, TERMS, FIRSTS)


def _zip(members: dict) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for name, data in members.items():
            z.writestr(name, data)
    return buf.getvalue()


def _docx(*paras: str, header: str = "") -> bytes:
    body = "".join(f"<w:p><w:r><w:t>{p}</w:t></w:r></w:p>" for p in paras)
    members = {"word/document.xml": f'<w:document xmlns:w="{W}"><w:body>{body}</w:body></w:document>'}
    if header:
        members["word/header1.xml"] = f'<w:hdr xmlns:w="{W}"><w:p><w:r><w:t>{header}</w:t></w:r></w:p></w:hdr>'
    return _zip(members)


def _pptx(slides: list, notes: dict | None = None) -> bytes:
    def part(text: str, root: str) -> str:
        return (f'<p:{root} xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="{A}">'
                f"<a:p><a:r><a:t>{text}</a:t></a:r></a:p></p:{root}>")
    members = {f"ppt/slides/slide{i}.xml": part(t, "sld") for i, t in enumerate(slides, 1)}
    members.update({f"ppt/notesSlides/notesSlide{i}.xml": part(t, "notes") for i, t in (notes or {}).items()})
    return _zip(members)


def _xlsx(*strings: str) -> bytes:
    si = "".join(f"<si><t>{s}</t></si>" for s in strings)
    return _zip({"xl/sharedStrings.xml": f'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">{si}</sst>'})


def _scan_file(data: bytes, suffix: str):
    warnings: list = []
    out = cn.scan_file(data, suffix, _scan, SALT, lambda label, msg: warnings.append((label, msg)))
    return [(label, n) for label, n, _ in out], warnings


class OfficeFiles(unittest.TestCase):
    def test_docx_body_hit_names_the_paragraph(self):
        self.assertEqual(_scan_file(_docx("Nothing here.", "About zorbo today."), ".docx"),
                         ([("!word/document.xml", 2)], []))

    def test_docx_header_hit(self):
        self.assertEqual(_scan_file(_docx("Clean.", header="Zorbo Division"), ".docx")[0], [("!word/header1.xml", 1)])

    def test_docx_clean(self):
        self.assertEqual(_scan_file(_docx("Clean text.", header="Also clean"), ".docx"), ([], []))

    def test_term_split_across_runs_is_found(self):
        xml = (f'<w:document xmlns:w="{W}"><w:body><w:p><w:r><w:t>zor</w:t></w:r><w:r><w:t>bo</w:t></w:r>'
               "</w:p></w:body></w:document>")
        self.assertEqual(_scan_file(_zip({"word/document.xml": xml}), ".docx")[0], [("!word/document.xml", 1)])

    def test_pptx_slide_hit_names_the_slide(self):
        self.assertEqual(_scan_file(_pptx(["Clean", "Clean", "Zorbo here"]), ".pptx")[0], [("!ppt/slides/slide3.xml", 3)])

    def test_pptx_notes_hit(self):
        hits_, _ = _scan_file(_pptx(["Clean", "Clean"], {2: "Say zorbo aloud"}), ".pptx")
        self.assertEqual(hits_, [("!ppt/notesSlides/notesSlide2.xml", 2)])

    def test_xlsx_shared_string_hit(self):
        hits_, _ = _scan_file(_xlsx("fine", "Office of Zorbo Affairs"), ".xlsx")
        self.assertEqual({h for h in hits_}, {("!xl/sharedStrings.xml", 2)})

    def test_damaged_office_file_is_a_warning(self):
        hits_, warns = _scan_file(b"not a zip at all", ".docx")
        self.assertEqual((hits_, len(warns)), ([], 1))

    def test_xml_with_entities_is_a_warning_and_not_read(self):
        xml = ('<!DOCTYPE x [<!ENTITY a "zorbo">]><w:document xmlns:w="%s"><w:body><w:p><w:r><w:t>&a;</w:t></w:r>'
               "</w:p></w:body></w:document>" % W)
        hits_, warns = _scan_file(_zip({"word/document.xml": xml}), ".docx")
        self.assertEqual((hits_, len(warns)), ([], 1))

    def test_results_never_carry_the_words(self):
        out = cn.scan_file(_docx("zorbo"), ".docx", _scan, SALT, lambda *_: None)
        self.assertNotIn("zorbo", repr(out))


class Archives(unittest.TestCase):
    def test_zip_text_and_office_members(self):
        z = _zip({"readme.txt": "ok\nzorbo\n", "deck.pptx": _pptx(["Clean", "zorbo"]), "pic.png": b"zorbo"})
        hits_, warns = _scan_file(z, ".zip")
        self.assertEqual(sorted(hits_), [("!deck.pptx!ppt/slides/slide2.xml", 2), ("!readme.txt", 2)])
        self.assertEqual(warns, [])

    def test_zip_member_file_name_hit(self):
        self.assertEqual(_scan_file(_zip({"zorbo-notes/readme.txt": "clean"}), ".zip")[0],
                         [("!zorbo-notes/readme.txt!name", 0)])

    def test_zip_inside_zip_is_not_opened(self):
        self.assertEqual(_scan_file(_zip({"inner.zip": _zip({"a.txt": "zorbo"})}), ".zip"), ([], []))

    def test_clean_zip(self):
        self.assertEqual(_scan_file(_zip({"a.txt": "fine", "b.docx": _docx("fine")}), ".zip"), ([], []))

    def test_bad_zip_is_a_warning(self):
        hits_, warns = _scan_file(b"PK nope", ".zip")
        self.assertEqual((hits_, len(warns)), ([], 1))

    def test_oversized_member_is_a_warning(self):
        old, cn.MAX_BYTES = cn.MAX_BYTES, 20
        try:
            hits_, warns = _scan_file(_zip({"big.txt": "zorbo " * 20, "ok.txt": "fine"}), ".zip")
        finally:
            cn.MAX_BYTES = old
        self.assertEqual(hits_, [])
        self.assertEqual([w[0] for w in warns], ["!big.txt"])


class WholeRun(unittest.TestCase):
    """main() over a temp repo: file names, the size cap, the baseline and the exit code."""

    def run_main(self, files: dict, cap: int | None = None, baseline: str = "") -> tuple:
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "data").mkdir()
            terms = root / "data" / "neutrality-terms.txt"
            terms.write_text(f"salt: {SALT}\nmax-words: 4\n" + "".join(f"{h}\n" for h in sorted(TERMS))
                             + f"first: {cn.digest(SALT, 'office')}\n", encoding="utf-8")
            base = root / "data" / "neutrality-baseline.txt"
            base.write_text(baseline, encoding="utf-8")
            for name, data in files.items():
                p = root / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_bytes(data)
            saved = (cn.REPO, cn.TERMS, cn.BASELINE, cn.MAX_BYTES)
            cn.REPO, cn.TERMS, cn.BASELINE = root, terms, base
            if cap is not None:
                cn.MAX_BYTES = cap
            out = io.StringIO()
            try:
                with contextlib.redirect_stdout(out):
                    rc = cn.main(list(files))
            finally:
                cn.REPO, cn.TERMS, cn.BASELINE, cn.MAX_BYTES = saved
        return rc, out.getvalue()

    def test_body_hit_fails_and_prints_no_words(self):
        rc, out = self.run_main({"docs/a.docx": _docx("zorbo")})
        self.assertEqual(rc, 1)
        self.assertIn("docs/a.docx!word/document.xml:1: names an agency", out)
        self.assertNotIn("zorbo", out)

    def test_notes_hit(self):
        rc, out = self.run_main({"presentations/d/d.pptx": _pptx(["ok"], {1: "zorbo"})})
        self.assertEqual(rc, 1)
        self.assertIn("presentations/d/d.pptx!ppt/notesSlides/notesSlide1.xml:1: names an agency", out)

    def test_file_name_hit_on_any_file_type(self):
        rc, out = self.run_main({"docs/images/a-zorbo.png": b"\x89PNG", "docs/Zorbo/ok.docx": _docx("clean")})
        self.assertEqual(rc, 1)
        self.assertIn("docs/images/a-zorbo.png!name: names an agency", out)
        self.assertIn("docs/Zorbo/ok.docx!name: names an agency", out)

    def test_clean_files_pass(self):
        rc, out = self.run_main({"docs/a.docx": _docx("fine"), "docs/b.zip": _zip({"x.txt": "fine"}),
                                 "docs/c.pptx": _pptx(["fine"], {1: "fine"})})
        self.assertEqual(rc, 0)
        self.assertIn("3 file(s) checked; 0 hit(s)", out)

    def test_size_cap_is_a_warning_not_a_failure(self):
        rc, out = self.run_main({"docs/big.docx": _docx("zorbo")}, cap=50)
        self.assertEqual(rc, 0)
        self.assertIn("docs/big.docx: warning: file over the", out)
        self.assertIn("1 warning(s)", out)

    def test_baseline_excuses_a_name_hit(self):
        rc, out = self.run_main({"docs/zorbo.png": b"x"}, baseline=f"docs/zorbo.png {cn.digest(SALT, 'zorbo.png')}\n")
        self.assertEqual(rc, 0)
        self.assertIn("1 excused by the baseline", out)


if __name__ == "__main__":
    unittest.main()
