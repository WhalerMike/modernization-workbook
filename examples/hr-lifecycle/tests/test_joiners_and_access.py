"""Chapters 03 and 04: workflow definitions as code and day-one readiness; automatic assignment policies,
the memberOf scan and the mover's residual review.

    python -m pytest tests -q
"""
import copy
import json
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[1]
FIX = KIT / "tests" / "fixtures"
sys.path.insert(0, str(KIT / "python"))
import access_assignment as aa  # noqa: E402
import hrlc_core as core  # noqa: E402
import joiner_workflows as jw  # noqa: E402

WF = jw.load_dir(KIT / "config" / "workflows")
POL = aa.load_dir(KIT / "config" / "access")
POP = core.values(core.read_json(FIX / "ch04" / "population.json"))


def rules(rows):
    return sorted({r["Rule"] for r in rows})


# ---------------------------------------------------------------- Chapter 03

def test_the_shipped_workflows_lint_clean():
    assert jw.lint(WF, 50) == []


def test_the_bad_workflows_raise_each_rule():
    rows = jw.lint(jw.load_dir(FIX / "ch03" / "bad-workflows"), 2)
    assert rules(rows) == ["JW-02", "JW-03", "JW-04", "JW-05", "JW-07", "JW-08", "JW-09", "JW-11", "JW-12"]


def test_tap_lifetime_accepts_both_of_learns_argument_names():
    for name in jw.TAP_LIFETIME_ARGS:
        d = copy.deepcopy(dict(WF)["pre-hire.json"])
        d["tasks"][0]["arguments"] = [{"name": name, "value": "1440"}, {"name": "tapIsUsableOnce", "value": "true"}]
        assert jw.lint([("pre-hire.json", d)], 50) == []
        d["tasks"][0]["arguments"][0]["value"] = "5"
        assert "JW-05" in rules(jw.lint([("pre-hire.json", d)], 50))


def test_unknown_task_and_too_many_tasks():
    d = copy.deepcopy(dict(WF)["leaver.json"])
    d["tasks"] = d["tasks"] * 9 + [dict(d["tasks"][0], taskDefinitionId="00000000-0000-0000-0000-000000000000")]
    assert {"JW-06", "JW-10"} <= set(rules(jw.lint([("leaver.json", d)], 50)))


def test_the_ceilings():
    many = [(f"w{i}.json", dict(copy.deepcopy(WF[0][1]), displayName=f"W{i}")) for i in range(51)]
    assert "budget of 50" in jw.lint(many, 50)[-1]["Issue"]
    many = [(f"w{i}.json", dict(copy.deepcopy(WF[0][1]), displayName=f"W{i}")) for i in range(101)]
    assert "allows 100" in [r for r in jw.lint(many, 50) if r["Rule"] == "JW-07"][0]["Issue"]


def test_the_body_never_carries_program_fields():
    for _, d in WF:
        b = jw.body(d)
        assert "_program" not in b and b["displayName"] == d["displayName"]


def test_plan_creates_versions_and_leaves_alone():
    current = core.values(core.read_json(FIX / "ch03" / "workflows.json"))
    steps, bodies, rows = jw.plan(WF, current)
    act = {s["displayName"]: s["action"] for s in steps}
    assert act["JML-Joiner-DayOne-Employees"] == "new-version"
    assert act["JML-Leaver-LastDay-Employees"] == "create"
    assert act["JML-Joiner-PreHire-Employees"] == "none"
    assert set(bodies["bodies/day-one.json"]) == {"workflow"}
    assert "_program" not in bodies["bodies/leaver.json"]
    assert rules(rows) == ["JW-15"]


def test_plan_refuses_files_with_lint_findings(tmp_path):
    code = jw.main(["plan", str(FIX / "ch03" / "bad-workflows"), "--current", str(FIX / "ch03" / "workflows.json"), "--out", str(tmp_path / "p")])
    assert code == core.EXIT_ERROR and not (tmp_path / "p").exists()


def test_readiness_counts_only_todays_hires_and_names_what_is_missing():
    pkg = dict(WF)["day-one.json"]["_program"]["onboardingAccessPackageId"]
    rows, summary, found = jw.readiness(core.read_csv(FIX / "ch03" / "hr-hires.csv"), core.values(core.read_json(FIX / "ch03" / "hire-users.json")),
                                        core.values(core.read_json(FIX / "ch03" / "prehire-results.json")),
                                        core.values(core.read_json(FIX / "ch03" / "joiner-assignments.json")), pkg, "2026-11-02T08:00:00Z")
    assert summary["hires"] == 4 and summary["ready"] == 1 and summary["rate"] == 0.25
    missing = {r["PersonNumber"]: r["missing"] for r in rows}
    assert missing["100102"] == ["onboarding package"] and missing["100104"] == ["account"]
    assert set(missing["100103"]) == {"enabled", "license", "onboarding package", "pre-hire run"}


# ---------------------------------------------------------------- Chapter 04

def test_evaluator_handles_the_subset_and_refuses_the_rest():
    t = aa.parse('(user.extensionAttribute10 -eq "ORG-100") -and -not (user.employeeType -in ["Guest"])')
    assert aa.evaluate(t, {"extensionAttribute10": "org-100", "employeeType": "Employee"})
    assert not aa.evaluate(t, {"extensionAttribute10": "ORG-100", "employeeType": "Guest"})
    assert aa.evaluate(aa.parse('user.department -startsWith "Prog"'), {"department": "Program Operations"})
    for bad in ('user.department -match "x"', 'user.memberof -any (group.objectId -in ["a"])', '(user.a -eq "x"'):
        with pytest.raises(aa.RuleError):
            aa.parse(bad)


def test_the_shipped_policies_lint_clean():
    assert aa.lint(POL, POP) == []


def test_the_bad_policies_raise_each_rule():
    rows = aa.lint(aa.load_dir(FIX / "ch04" / "bad-access"), POP)
    assert rules(rows) == ["AA-01", "AA-02", "AA-04", "AA-05", "AA-06", "AA-07", "AA-09"]
    assert [r["Severity"] for r in rows if r["Rule"] == "AA-02"] == ["Finding"]


def test_disjoint_policies_on_one_package_warn_instead():
    a = copy.deepcopy(dict(POL)["auto-program-operations.json"])
    b = copy.deepcopy(dict(POL)["auto-infrastructure.json"])
    b["accessPackage"] = a["accessPackage"]
    rows = [r for r in aa.lint([("a.json", a), ("b.json", b)], POP) if r["Rule"] == "AA-02"]
    assert [r["Severity"] for r in rows] == ["Warn"]


def test_scope_over_learns_limit():
    a = copy.deepcopy(dict(POL)["auto-program-operations.json"])
    a["_program"]["expectedScope"] = 15001
    assert rules(aa.lint([("a.json", a)], POP)) == ["AA-03"]


def test_memberof_scan_over_an_export():
    rows = aa.memberof_scan(core.values(core.read_json(FIX / "ch04" / "assignment-policies.json")))
    assert [r["Rule"] for r in rows] == ["MS-01"] and "Shared drives (legacy)" in rows[0]["Object"]


def test_residual_review_lists_requested_and_outside_package_access():
    mover = core.read_json(FIX / "ch04" / "mover.json")
    rows, summary, found = aa.residual(mover, core.values(core.read_json(FIX / "ch04" / "mover-assignments.json")),
                                       core.values(core.read_json(FIX / "ch04" / "mover-memberships.json")), POL, "2026-11-01T12:00:00Z")
    cls = {r["item"]: r["class"] for r in rows}
    assert cls["Program Operations baseline"] == "removed by rule after grace"
    assert cls["Infrastructure Services baseline"] == "kept by rule"
    assert cls["Grants reporting workspace"] == "requested: review"
    assert cls["SHARE-ProgramOps-Finance"] == "outside packages: review"
    assert cls["DG-ORG-210-All"] == "rule-managed" and cls["APP-Infra-Monitoring"] == "package-managed"
    assert summary["toReview"] == 3 and summary["hours"] is None
    assert [r["Rule"] for r in found].count("RV-02") == 1


def test_a_completed_review_gives_the_interval():
    mover = dict(core.read_json(FIX / "ch04" / "mover.json"), reviewCompletedDateTime="2026-10-24T08:00:00Z")
    _, summary, found = aa.residual(mover, [], [], POL, "2026-11-01T12:00:00Z")
    assert summary["hours"] == 120.0 and not [r for r in found if r["Rule"] == "RV-02"]


def test_residual_cli_writes_the_review_sheet(tmp_path):
    code = aa.main(["residual", "--mover", str(FIX / "ch04" / "mover.json"), "--assignments", str(FIX / "ch04" / "mover-assignments.json"),
                    "--memberships", str(FIX / "ch04" / "mover-memberships.json"), "--policies", str(KIT / "config" / "access"),
                    "--as-of", "2026-11-01T12:00:00Z", "--cloud", "gcc", "--out", str(tmp_path / "o")])
    assert code == core.EXIT_FINDINGS
    sheet = (tmp_path / "o" / "residual-review.csv").read_text(encoding="utf-8").splitlines()
    assert sheet[0] == "item,kind,via,class" and len(sheet) == 4
    assert json.loads((tmp_path / "o" / "manifest.json").read_text())["task"] == "access-residual"
