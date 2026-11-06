"""The OSCAL converter, against the drift pipeline's own fixtures. Nothing here touches a tenant or the network."""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(KIT / "python"))
sys.path.insert(0, str(KIT / "tests"))

import drift_pipeline as d  # noqa: E402
import oscal_export as o  # noqa: E402
from test_drift_pipeline import build_pair  # noqa: E402

ACCEPT = KIT / "oscal" / "tests" / "fixtures" / "acceptances.json"
SCHEMA_SHA256 = {
    "oscal_assessment-results_schema.json": "4034e2032332dbf597e59e0646ec16c2c31df992962490371e91f47b219ff42c",
    "oscal_poam_schema.json": "f4fd94487408a9589954b5b92d88965c984d4f79b85365cc574b860898759437",
}


@pytest.fixture()
def pkg(tmp_path):
    return build_pair(tmp_path)[1]


@pytest.fixture()
def docs(pkg):
    return o.build(pkg, o.load_acceptances(ACCEPT), o.load_control_map())


def poam(docs):
    return docs["poam"]["plan-of-action-and-milestones"]


def risk_by_prop(docs, name, value):
    return [r for r in poam(docs)["risks"] if {"name": name, "ns": o.NS, "value": value} in r["props"]]


def test_the_pinned_schemas_are_unmodified():
    for name, digest in SCHEMA_SHA256.items():
        assert hashlib.sha256((KIT / "data" / "oscal-1.2.3" / name).read_bytes()).hexdigest() == digest


def test_both_documents_validate_against_the_pinned_schemas(docs):
    pytest.importorskip("jsonschema")
    pytest.importorskip("regex")
    for doc in docs.values():
        assert o.validate_document(doc) == []


def test_a_wrong_document_does_not_validate(docs):
    pytest.importorskip("jsonschema")
    pytest.importorskip("regex")
    bad = json.loads(json.dumps(docs["poam"]))
    del bad["plan-of-action-and-milestones"]["metadata"]["title"]
    assert o.validate_document(bad)


def test_dispositions_and_risk_status(docs):
    gov = risk_by_prop(docs, "disposition", "governed_exception")
    assert len(gov) == 1 and gov[0]["status"] == "deviation-approved"
    assert {"name": "acceptance-ref", "ns": o.NS, "value": "RA-2026-017"} in gov[0]["props"]
    assert gov[0]["deadline"] == "2026-12-31T00:00:00Z"
    lapsed = risk_by_prop(docs, "disposition", "lapsed_acceptance")
    assert len(lapsed) == 1 and lapsed[0]["status"] == "open"
    actionable = risk_by_prop(docs, "disposition", "actionable_drift")
    assert actionable and {r["status"] for r in actionable} == {"open"}
    closed = risk_by_prop(docs, "disposition", "resolved")
    assert len(closed) == 1 and closed[0]["status"] == "closed"


def test_no_register_means_everything_is_actionable(pkg):
    docs = o.build(pkg, {}, o.load_control_map())
    assert not risk_by_prop(docs, "disposition", "governed_exception")
    assert not risk_by_prop(docs, "disposition", "lapsed_acceptance")


def test_an_acceptance_holds_through_its_expiry_day():
    reg = {"x": {"ref": "R", "fingerprint": "x", "expires": "2026-10-29"}}
    assert o.disposition("x", "2026-10-29T06:17:00Z", reg)[0] == "governed_exception"
    assert o.disposition("x", "2026-10-30T00:00:00Z", reg)[0] == "lapsed_acceptance"


def test_every_failing_finding_has_an_item(pkg, docs):
    report = d.read_json(pkg / "drift" / "drift-report.json")
    current = o.current_findings(report)
    assert len(current) == 12
    items = poam(docs)["poam-items"]
    assert len(items) == len(current) + len(report["resolved"])
    for it in items:
        assert it["related-risks"] and it["related-observations"]


def test_references_resolve(docs):
    p = poam(docs)
    obs = {x["uuid"] for x in p["observations"]}
    risks = {x["uuid"] for x in p["risks"]}
    for it in p["poam-items"]:
        assert {r["observation-uuid"] for r in it["related-observations"]} <= obs
        assert {r["risk-uuid"] for r in it["related-risks"]} <= risks
    res = docs["assessment-results"]["assessment-results"]["results"][0]
    robs = {x["uuid"] for x in res["observations"]}
    rrisks = {x["uuid"] for x in res["risks"]}
    for f in res["findings"]:
        assert {r["observation-uuid"] for r in f["related-observations"]} <= robs
        assert {r["risk-uuid"] for r in f["related-risks"]} <= rrisks
    resources = {r["uuid"] for r in docs["assessment-results"]["assessment-results"]["back-matter"]["resources"]}
    for x in res["observations"]:
        for ev in x["relevant-evidence"]:
            assert ev["href"].lstrip("#") in resources


def test_unread_checks_are_observations_not_passes(docs):
    res = docs["assessment-results"]["assessment-results"]["results"][0]
    unverified = [x for x in res["observations"] if {"name": "verification", "ns": o.NS, "value": "unverified"} in x["props"]]
    assert len(unverified) == 2
    stale = [x for x in res["observations"] if {"name": "read-this-run", "ns": o.NS, "value": "false"} in x["props"]]
    assert stale      # earlier findings of an unread check stay open, and say they weren't re-read


def test_the_same_package_gives_the_same_bytes(pkg):
    a = o.build(pkg, o.load_acceptances(ACCEPT), o.load_control_map())
    b = o.build(pkg, o.load_acceptances(ACCEPT), o.load_control_map())
    assert d.dump_json(a["poam"]) == d.dump_json(b["poam"])
    assert d.dump_json(a["assessment-results"]) == d.dump_json(b["assessment-results"])


def test_item_uuids_survive_to_the_next_run(tmp_path):
    first, second = build_pair(tmp_path)
    a = o.build(first, {}, o.load_control_map())
    b = o.build(second, {}, o.load_control_map())

    def ids(docs):
        return {next(p["value"] for p in i["props"] if p["name"] == "fingerprint"): i["uuid"] for i in poam(docs)["poam-items"]}

    shared = set(ids(a)) & set(ids(b))
    assert shared and all(ids(a)[k] == ids(b)[k] for k in shared)
    assert poam(a)["uuid"] != poam(b)["uuid"]


def test_names_are_left_out_unless_asked(pkg):
    plain = d.dump_json(o.build(pkg, {}, o.load_control_map())["poam"])
    named = d.dump_json(o.build(pkg, {}, o.load_control_map(), include_names=True)["poam"])
    assert "@contoso.example" not in plain and "@contoso.example" in named


def test_controls_come_from_the_map(docs):
    ctl = {pr["value"] for it in poam(docs)["poam-items"] for pr in it["props"] if pr["name"] == "control-id"}
    assert {"ac-2", "ia-4", "cm-8", "si-2", "ia-5"} <= ctl
    assert o.oscal_control_id("AC-2(1)") == "ac-2.1"
    assert o.controls_for("VK-ZZ-99", "ZZ", o.load_control_map()) == ["CA-7"]


def test_a_tampered_package_is_refused(pkg):
    f = pkg / "drift" / "drift-report.json"
    f.write_text(f.read_text(encoding="utf-8") + " ", encoding="utf-8")
    with pytest.raises(d.DriftError):
        o.build(pkg, {}, o.load_control_map())


def test_bad_registers_are_refused(tmp_path):
    bad = tmp_path / "r.json"
    bad.write_text(json.dumps({"schema": "x"}), encoding="utf-8")
    with pytest.raises(d.DriftError, match="not an acceptance register"):
        o.load_acceptances(bad)
    bad.write_text(json.dumps({"schema": o.ACCEPTANCE_SCHEMA, "acceptances": [{"ref": "R", "fingerprint": "f", "expires": "soon"}]}),
                   encoding="utf-8")
    with pytest.raises(d.DriftError, match="bad expiry"):
        o.load_acceptances(bad)


def test_cli_writes_both_files_and_validates(pkg, tmp_path, capsys):
    out = tmp_path / "oscal"
    assert o.main(["export", "--package", str(pkg), "--out", str(out), "--acceptances", str(ACCEPT)]) == 0
    printed = json.loads(capsys.readouterr().out)
    assert printed["oscal_version"] == "1.2.3" and printed["poam_items"]["governed_exception"] == 1
    assert (out / "assessment-results.json").is_file() and (out / "poam.json").is_file()
    pytest.importorskip("jsonschema")
    pytest.importorskip("regex")
    assert o.main(["validate", str(out / "assessment-results.json"), str(out / "poam.json")]) == 0


def test_cli_refuses_a_missing_package(tmp_path):
    assert o.main(["export", "--package", str(tmp_path / "nope"), "--out", str(tmp_path / "o")]) == 1
