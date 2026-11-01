"""Evidence records in Book 13's shape, their checks, and the package's hash chain."""

import json

import evidence_export as ee
import kit_common as kc
from conftest import FIXTURES

CLOSED = FIXTURES / "evidence" / "closed_records.json"


def _records():
    raw = json.loads(CLOSED.read_text())["result"]
    return {r["number"]: ee.evidence_record(r, {"3"}, {"7"}) for r in raw}


def test_book13_fields_present_and_later_pass_fields_not_invented():
    r = _records()["IDF0000901"]
    for field in ("origin", "owner_and_clock", "approval", "executing_identity", "what_ran", "result", "closure"):
        assert field in r
    for field in ("approval", "executing_identity", "what_ran"):
        assert r[field]["value"] is None and "later pass" in r[field]["reason"]
    assert r["result"]["evidence_intact"] is True
    assert r["owner_and_clock"]["within_window"] is True
    assert r["closure"]["lane"] == "machine re-read" and not r["problems"]


def test_checks_catch_late_tampered_and_unevidenced_closures():
    recs = _records()
    assert recs["IDF0000902"]["problems"] == ["closed after its response window"]
    assert "edited after closure" in recs["IDF0000903"]["problems"][0]
    assert recs["IDF0000903"]["result"]["evidence_intact"] is False
    assert recs["IDF0000905"]["problems"] == ["closed without re-read evidence"]
    assert recs["IDF0000904"]["closure"]["lane"] == "declared exception" and not recs["IDF0000904"]["problems"]


def test_truncated_evidence_is_reported():
    raw = json.loads(CLOSED.read_text())["result"][0]
    raw["u_evidence"] = raw["u_evidence"][:-20]
    r = ee.evidence_record(raw, {"3"}, {"7"})
    assert "isn't valid JSON" in r["problems"][0]


def test_package_manifest_and_chain(tmp_path, capsys):
    out = tmp_path / "e"
    rc = ee.main(["--records-json", str(CLOSED), "--out-dir", str(out), "--period", "2026-10",
                  "--generated-at", "2026-11-01T12:00:00Z"])
    text = capsys.readouterr().out
    assert rc == 1  # three records have problems, so the run says so
    assert "Window adherence: 2 of 3 closed inside the window" in text
    summary = json.loads((out / "summary.json").read_text())
    assert summary["records_with_problems"] == ["IDF0000902", "IDF0000903", "IDF0000905"]
    assert summary["window_adherence"]["ratio"] == 0.667
    assert ee.verify_package(str(out)) == []
    assert ee.main(["--verify-dir", str(out)]) == 0


def test_tampering_with_the_package_is_detected(tmp_path):
    out = tmp_path / "e"
    ee.main(["--records-json", str(CLOSED), "--out-dir", str(out), "--period", "2026-10"])
    lines = (out / "records.jsonl").read_text().splitlines()
    del lines[1]
    (out / "records.jsonl").write_text("\n".join(lines) + "\n")
    problems = ee.verify_package(str(out))
    assert any("SHA-256 doesn't match" in p for p in problems)
    assert any("prev_sha256" in p for p in problems)


def test_chain_continues_from_last_period(tmp_path):
    first, second = tmp_path / "p1", tmp_path / "p2"
    ee.main(["--records-json", str(CLOSED), "--out-dir", str(first), "--period", "2026-09"])
    ee.main(["--records-json", str(CLOSED), "--out-dir", str(second), "--period", "2026-10",
             "--previous-manifest", str(first / "manifest.json")])
    m1 = json.loads((first / "manifest.json").read_text())
    m2 = json.loads((second / "manifest.json").read_text())
    assert m2["chain_previous"] == m1["chain_head"]
    first_line = json.loads((second / "records.jsonl").read_text().splitlines()[0])
    assert first_line["prev_sha256"] == m1["chain_head"]
    assert ee.verify_package(str(second)) == []


def test_reproducible_output(tmp_path):
    a, b = tmp_path / "a", tmp_path / "b"
    for folder in (a, b):
        ee.main(["--records-json", str(CLOSED), "--out-dir", str(folder), "--period", "2026-10",
                 "--generated-at", "2026-11-01T12:00:00Z"])
    assert (a / "manifest.json").read_text() == (b / "manifest.json").read_text()


def test_evidence_written_by_the_reread_client_verifies():
    evidence = {"record": "IDF9", "match": True, "differences": []}
    record = {"number": "IDF9", "state": "3", "u_evidence": kc.canonical_json(evidence),
              "u_evidence_hash": kc.sha256_hex(evidence), "due_date": "2026-10-21 10:00:00",
              "u_verified_at": "2026-10-21 09:00:00"}
    r = ee.evidence_record(record, {"3"}, {"7"})
    assert r["result"]["evidence_intact"] is True and not r["problems"]
