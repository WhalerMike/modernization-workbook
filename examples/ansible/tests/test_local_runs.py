"""Run the playbooks for real against the control node, where Ansible is installed.

The read-only playbooks run against tests/fixtures/localhost.yml and must write their reports
and nothing else. The onboarding playbook runs without confirm_change and must leave no
agent, no parameter file and no installer behind. Skipped where ansible-playbook isn't on PATH.
"""

from __future__ import annotations

import csv
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parent.parent
LOCALHOST = KIT / "tests" / "fixtures" / "localhost.yml"
ARC_CANDIDATE = KIT / "tests" / "fixtures" / "arc_candidate.yml"

pytestmark = pytest.mark.skipif(shutil.which("ansible-playbook") is None, reason="ansible-playbook not installed")


def play(playbook: str, inventory: Path, *extra: str, env: dict | None = None) -> subprocess.CompletedProcess:
    run_env = dict(os.environ, ANSIBLE_CONFIG=str(KIT / "ansible.cfg"), ANSIBLE_NOCOLOR="1", **(env or {}))
    return subprocess.run(
        ["ansible-playbook", "-i", str(inventory), str(KIT / "playbooks" / playbook), *extra],
        capture_output=True, text=True, env=run_env, cwd=KIT,
    )


def only(directory: Path, pattern: str) -> Path:
    found = sorted(directory.glob(pattern))
    assert len(found) == 1, f"expected one {pattern} in {directory}, found {found}"
    return found[0]


def test_inventory_assessment_writes_the_cm8_feed(tmp_path):
    result = play("01_inventory_assessment.yml", LOCALHOST, "-e", f"report_dir={tmp_path}")
    assert result.returncode == 0, result.stdout + result.stderr
    rows = json.loads(only(tmp_path, "inventory-assessment-*.json").read_text())
    assert [r["host"] for r in rows] == ["legacy.contoso.example", "localhost"]
    legacy, row = rows
    # A record nothing reached is reported as not collected, never as "no agent".
    assert legacy["collection_status"] == "not_collected" and legacy["arc_agent_present"] == ""
    assert row["collection_status"] == "collected"
    assert row["owner"] == "team-test" and row["cmdb_ci"] == "CI9999999"
    assert row["observed_os"] and row["observed_version"]
    assert row["arc_agent_status"] in {"not_installed", "Connected", "Disconnected", "Expired", "unknown"}
    with only(tmp_path, "inventory-assessment-*.csv").open(newline="") as handle:
        assert [r["host"] for r in csv.DictReader(handle)] == ["legacy.contoso.example", "localhost"]


def test_baseline_check_reports_drift_and_changes_nothing(tmp_path):
    watched = [Path("/etc/login.defs"), Path("/etc/ssh/sshd_config")]
    before = {p: p.read_bytes() for p in watched if p.exists()}
    result = play("03_linux_baseline_check.yml", LOCALHOST, "-e", f"report_dir={tmp_path}")
    assert result.returncode == 0, result.stdout + result.stderr
    assert {p: p.read_bytes() for p in watched if p.exists()} == before
    rows = json.loads(only(tmp_path, "baseline-drift-*.json").read_text())
    assert {r["id"] for r in rows} == {f"LNX-0{n}" for n in range(1, 8)}
    assert {r["state"] for r in rows} <= {"drift", "compliant", "file_missing"}
    assert all(r["baseline_version"] == "example-2026.10" for r in rows)


def test_baseline_check_refuses_a_host_another_tool_owns(tmp_path):
    result = play("03_linux_baseline_check.yml", LOCALHOST, "-e", f"report_dir={tmp_path}",
                  "-e", "config_owner=arc_machine_configuration")
    assert result.returncode != 0
    assert "configuration owner" in result.stdout


@pytest.mark.skipif(not hasattr(os, "geteuid") or os.geteuid() != 0, reason="needs root on the control node")
def test_onboarding_without_confirmation_changes_nothing():
    leftovers = [Path("/opt/azcmagent"), Path("/root/.arc-onboarding.json"), Path("/tmp/install_linux_azcmagent.sh")]
    already = [p for p in leftovers if p.exists()]
    if already:
        pytest.skip(f"control node already has {already}")
    result = play("02_arc_onboarding.yml", ARC_CANDIDATE, env={"ARC_SP_SECRET": "not-a-real-secret"})
    assert result.returncode == 0, result.stdout + result.stderr
    assert "not-a-real-secret" not in result.stdout + result.stderr
    assert not [p for p in leftovers if p.exists()]


def test_onboarding_stops_without_a_secret():
    env = {"ARC_SP_SECRET": ""}
    result = play("02_arc_onboarding.yml", ARC_CANDIDATE, env=env)
    assert result.returncode != 0
