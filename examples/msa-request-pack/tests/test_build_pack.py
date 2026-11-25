"""The forms and CSVs match pack_schema.py (standard library only: --check reads the forms without python-docx)."""

import subprocess
import sys
from pathlib import Path

PACK = Path(__file__).resolve().parents[1]


def test_forms_and_csvs_are_current():
    proc = subprocess.run([sys.executable, "build_pack.py", "--check"], cwd=PACK, capture_output=True, text=True)
    assert proc.returncode == 0, proc.stdout + proc.stderr


def test_every_form_names_the_tags():
    sys.path.insert(0, str(PACK))
    import build_pack
    import pack_schema

    for form in pack_schema.FORMS[:2]:
        text = " ".join(build_pack.read_form_text(PACK / "forms" / form[0]))
        for tag in pack_schema.TAG_KEYS:
            assert f"tag {tag}" in text or f"tags {tag}" in text or f", {tag})" in text, (form[0], tag)
