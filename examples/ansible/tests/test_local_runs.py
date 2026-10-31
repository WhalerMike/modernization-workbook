"""Run the playbooks for real against the control node, where Ansible is installed.

The read-only playbooks run against tests/fixtures/localhost.yml and must write their reports
and nothing else. The wave plan runs against tests/fixtures/arc_candidate.yml and must write
the plan, or stop when the wave is wrong. The onboarding playbooks run without confirm_change
and must leave no agent, no parameter file and no installer behind; the one that uses
Microsoft's role must not call it. Skipped where ansible-playbook isn't on PATH.
"""

from __future__ import annotations

import csv
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml

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


def candidate_inventory(tmp_path: Path, **host_vars) -> Path:
    """The Arc candidate fixture with some of the localhost record's values changed."""
    data = yaml.safe_load(ARC_CANDIDATE.read_text(encoding="utf-8"))
    data["all"]["hosts"]["localhost"].update(host_vars)
    path = tmp_path / "candidate.yml"
    path.write_text(yaml.safe_dump(data), encoding="utf-8")
    return path


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
    assert row["config_owner"] == "ansible" and row["patch_owner"] == "ansible"
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


DEAD_PROXY_ENV = {k: "http://127.0.0.1:9" for k in ("HTTPS_PROXY", "HTTP_PROXY", "https_proxy", "http_proxy")}
LEFTOVERS = [Path("/opt/azcmagent"), Path("/root/.arc-onboarding.json"), Path("/tmp/install_linux_azcmagent.sh")]


def leftovers() -> list[Path]:
    """The LEFTOVERS present. A path this user can't read (/root, when not root) can't have been
    written by this user's run either, so it counts as absent."""
    present = []
    for p in LEFTOVERS:
        try:
            if p.exists():
                present.append(p)
        except PermissionError:
            pass
    return present


def test_wave_plan_writes_the_plan(tmp_path):
    result = play("05_arc_wave_plan.yml", ARC_CANDIDATE, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}")
    assert result.returncode == 0, result.stdout + result.stderr
    plan = json.loads(only(tmp_path, "arc-wave-0-plan-*.json").read_text())
    assert plan["wave"] == 0 and plan["cloud"] == "AzureCloud" and plan["mode"] == "dry_run"
    [server] = plan["servers"]
    assert server["host"] == "localhost" and server["state"] == "ready"
    assert "ConfigOwner=Ansible" in server["tags"] and "PatchOwner=Ansible" in server["tags"]
    assert "PatchGroup" not in server["tags"]  # empty values are left out
    only(tmp_path, "arc-wave-0-plan-*.csv")


def test_wave_plan_stops_without_a_wave(tmp_path):
    result = play("05_arc_wave_plan.yml", ARC_CANDIDATE, "-e", f"report_dir={tmp_path}")
    assert result.returncode != 0 and "onboarding_wave" in result.stdout


def test_wave_plan_stops_on_an_empty_wave(tmp_path):
    result = play("05_arc_wave_plan.yml", ARC_CANDIDATE, "-e", "onboarding_wave=3", "-e", f"report_dir={tmp_path}")
    assert result.returncode != 0 and "no server is planned" in result.stdout


def test_wave_plan_stops_a_production_server_in_the_pilot(tmp_path):
    inventory = candidate_inventory(tmp_path, environment="production")
    result = play("05_arc_wave_plan.yml", inventory, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}")
    assert result.returncode != 0
    [server] = json.loads(only(tmp_path, "arc-wave-0-plan-*.json").read_text())["servers"]
    assert server["state"] == "stopped" and "production server in non-production wave 0" in server["reasons"]


def test_wave_plan_stops_a_region_from_the_other_cloud(tmp_path):
    inventory = candidate_inventory(tmp_path, arc_location="usgovvirginia")
    result = play("05_arc_wave_plan.yml", inventory, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}")
    assert result.returncode != 0
    [server] = json.loads(only(tmp_path, "arc-wave-0-plan-*.json").read_text())["servers"]
    assert server["reasons"] == "region usgovvirginia is not in AzureCloud"


def test_wave_plan_stops_a_server_without_a_patch_owner(tmp_path):
    inventory = candidate_inventory(tmp_path, patch_owner="")
    result = play("05_arc_wave_plan.yml", inventory, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}")
    assert result.returncode != 0
    [server] = json.loads(only(tmp_path, "arc-wave-0-plan-*.json").read_text())["servers"]
    assert server["reasons"] == "no patch_owner"


@pytest.mark.skipif(not hasattr(os, "geteuid") or os.geteuid() != 0, reason="needs root on the control node")
def test_onboarding_without_confirmation_changes_nothing(tmp_path):
    already = leftovers()
    if already:
        pytest.skip(f"control node already has {already}")
    # Every outbound request goes to a dead local proxy: the dry run must not need the network.
    result = play("02_arc_onboarding.yml", ARC_CANDIDATE, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}",
                  env={"ARC_SP_SECRET": "not-a-real-secret", **DEAD_PROXY_ENV})
    assert result.returncode == 0, result.stdout + result.stderr
    assert "not-a-real-secret" not in result.stdout + result.stderr
    assert not leftovers()


def test_onboarding_stops_without_a_secret(tmp_path):
    env = {"ARC_SP_SECRET": ""}
    result = play("02_arc_onboarding.yml", ARC_CANDIDATE, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}",
                  env=env)
    assert result.returncode != 0


def test_onboarding_stops_before_any_server_when_the_plan_fails(tmp_path):
    inventory = candidate_inventory(tmp_path, environment="production")
    result = play("02_arc_onboarding.yml", inventory, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}",
                  env={"ARC_SP_SECRET": "not-a-real-secret"})
    assert result.returncode != 0
    assert "Onboard Linux servers to Azure Arc" not in result.stdout


def test_role_playbook_dry_run_calls_nothing(tmp_path):
    already = leftovers()
    result = play("06_arc_onboarding_role.yml", ARC_CANDIDATE, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}",
                  env=DEAD_PROXY_ENV)
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Would connect localhost to AzureCloud, resource group rg-arc-test-dev" in result.stdout
    assert '"PatchOwner": "Ansible"' in result.stdout
    assert '"ArcSQLServerExtensionDeployment": "Disabled"' in result.stdout
    # Microsoft's role was skipped, not run in check mode: none of its tasks appear.
    assert "azure.azcollection.azure_arc :" not in result.stdout
    assert not list(tmp_path.glob("arc-wave-0-result-*.json"))
    assert leftovers() == already


def test_role_playbook_refuses_azure_government(tmp_path):
    result = play("06_arc_onboarding_role.yml", ARC_CANDIDATE, "-e", "onboarding_wave=0", "-e", f"report_dir={tmp_path}",
                  "-e", "arc_cloud=AzureUSGovernment", "-e", "arc_location=usgovvirginia")
    assert result.returncode != 0
    assert "management.azure.com" in result.stdout
