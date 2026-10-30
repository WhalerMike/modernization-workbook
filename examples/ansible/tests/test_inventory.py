"""The CMDB inventory script: groups come from CMDB attributes, and a bad export fails loudly."""

from __future__ import annotations

import csv
import io
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parent.parent
SCRIPT = KIT / "inventory" / "cmdb_inventory.py"
SAMPLE = KIT / "inventory" / "sample" / "cmdb_export.csv"


def run(*args: str, csv: Path | None = None) -> subprocess.CompletedProcess:
    env = dict(os.environ)
    env.pop("CMDB_CSV", None)
    if csv is not None:
        env["CMDB_CSV"] = str(csv)
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, env=env)


@pytest.fixture(scope="module")
def inventory() -> dict:
    result = run("--list")
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


def hosts(inventory: dict, group: str) -> set[str]:
    return set(inventory.get(group, {}).get("hosts", []))


def sample_rows() -> list[dict[str, str]]:
    with SAMPLE.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str] | None = None) -> Path:
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=fieldnames or list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    path.write_text(out.getvalue(), encoding="utf-8")
    return path


def changed(tmp_path: Path, host: str, **values: str) -> dict:
    """The inventory built from the sample with one record changed."""
    rows = sample_rows()
    for row in rows:
        if row["name"] == host:
            row.update(values)
    result = run("--list", csv=write_csv(tmp_path / "changed.csv", rows))
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


def test_every_record_becomes_a_host(inventory):
    records = SAMPLE.read_text(encoding="utf-8").strip().splitlines()[1:]
    assert len(inventory["_meta"]["hostvars"]) == len(records) == 13


def test_tiers_split_managed_from_unmanaged(inventory):
    assert hosts(inventory, "managed") == hosts(inventory, "tier_1") | hosts(inventory, "tier_2")
    assert hosts(inventory, "unmanaged") == {"legacy01.contoso.example", "scada01.contoso.example"}
    assert not hosts(inventory, "managed") & hosts(inventory, "unmanaged")


def test_arc_candidates_are_tier_1_servers_not_yet_connected(inventory):
    assert hosts(inventory, "arc_onboarding_candidates") == {
        "app02.contoso.example", "web01.contoso.example", "win01.contoso.example", "aws01.contoso.example",
    }
    assert not hosts(inventory, "arc_onboarding_blocked")


def test_one_configuration_owner_per_host(inventory):
    owners = [g for g in inventory if g.startswith("config_owner_")]
    for host in inventory["_meta"]["hostvars"]:
        assert sum(host in hosts(inventory, g) for g in owners) <= 1, host
    # Hosts Azure machine configuration owns are never in the Ansible baseline's scope.
    assert not hosts(inventory, "config_owner_ansible") & hosts(inventory, "config_owner_arc_machine_configuration")


def test_one_patch_owner_per_host(inventory):
    owners = [g for g in inventory if g.startswith("patch_owner_") and not g.endswith("_missing")]
    assert set(owners) == {"patch_owner_update_manager", "patch_owner_ansible", "patch_owner_platform"}
    for host in inventory["_meta"]["hostvars"]:
        assert sum(host in hosts(inventory, g) for g in owners) <= 1, host
    # The guide's case: a fleet Ansible already patches (RHEL on AWS) is Arc-enabled, but Update
    # Manager only assesses it; its PatchOwner tag says so.
    assert "aws01.contoso.example" in hosts(inventory, "patch_owner_ansible")
    assert "aws01.contoso.example" in hosts(inventory, "arc_onboarding_candidates")


def test_owner_tags_mirror_the_cmdb_columns(inventory):
    expected_config = {"arc_machine_configuration": "ArcMachineConfiguration", "ansible": "Ansible", "none": ""}
    expected_patch = {"update_manager": "UpdateManager", "ansible": "Ansible", "platform": "Platform", "none": ""}
    for host, hv in inventory["_meta"]["hostvars"].items():
        assert hv["arc_tags"]["ConfigOwner"] == expected_config[hv["config_owner"]], host
        assert hv["arc_tags"]["PatchOwner"] == expected_patch[hv["patch_owner"]], host


def test_managed_hosts_have_both_owners_in_the_sample(inventory):
    assert not hosts(inventory, "config_owner_missing")
    assert not hosts(inventory, "patch_owner_missing")


def test_waves_come_from_the_cmdb(inventory):
    assert hosts(inventory, "arc_wave_0") == {"web01.contoso.example"}
    assert hosts(inventory, "arc_wave_1") == {"aws01.contoso.example"}
    assert hosts(inventory, "arc_wave_2") == {"app02.contoso.example", "win01.contoso.example"}
    # The pilot and the first wave hold only non-production servers (the Arc track's wave plan).
    for wave in ("arc_wave_0", "arc_wave_1"):
        for host in hosts(inventory, wave):
            assert inventory["_meta"]["hostvars"][host]["environment"] == "nonproduction", host


def test_the_sample_estate_is_commercial_azure(inventory):
    # A GCC tenant uses commercial Microsoft Entra ID, so its Arc servers go to a commercial
    # subscription: AzureCloud and commercial regions, never a US Gov region.
    group_vars = (KIT / "inventory" / "group_vars" / "all.yml").read_text(encoding="utf-8")
    assert "\narc_cloud: AzureCloud\n" in group_vars
    for host, hv in inventory["_meta"]["hostvars"].items():
        assert not hv["arc_location"].startswith(("usgov", "usdod")), host


def test_unix_and_appliances_are_ansible_owned_tier_2(inventory):
    for host in ("aix01.contoso.example", "sol01.contoso.example", "rtr01.contoso.example", "gm01.contoso.example"):
        assert host in hosts(inventory, "tier_2")
        assert host in hosts(inventory, "config_owner_ansible")


def test_missing_owner_is_a_finding(inventory):
    assert hosts(inventory, "owner_missing") == {"legacy01.contoso.example"}


def test_arc_tags_carry_cmdb_values(inventory):
    tags = inventory["_meta"]["hostvars"]["app02.contoso.example"]["arc_tags"]
    assert tags == {
        "Owner": "team-claims", "Environment": "production", "CmdbCi": "CI0001002",
        "Location": "dc-east", "PatchGroup": "PG-WED-0200",
        "ConfigOwner": "ArcMachineConfiguration", "PatchOwner": "UpdateManager",
    }


def test_host_mode_returns_one_hosts_variables():
    result = run("--host", "AIX01.contoso.example")
    assert result.returncode == 0
    assert json.loads(result.stdout)["cmdb_os"] == "AIX 7.3"


def test_duplicate_record_fails(tmp_path):
    lines = SAMPLE.read_text(encoding="utf-8").splitlines()
    bad = tmp_path / "dup.csv"
    bad.write_text("\n".join(lines + [lines[1]]) + "\n", encoding="utf-8")
    result = run("--list", csv=bad)
    assert result.returncode == 1 and "duplicate record" in result.stderr


def test_missing_column_fails(tmp_path):
    bad = tmp_path / "short.csv"
    bad.write_text("name,ansible_host\nx.example,192.0.2.1\n", encoding="utf-8")
    result = run("--list", csv=bad)
    assert result.returncode == 1 and "missing columns" in result.stderr


def test_unknown_tier_fails(tmp_path):
    lines = SAMPLE.read_text(encoding="utf-8").splitlines()
    bad = tmp_path / "tier.csv"
    bad.write_text("\n".join([lines[0], lines[1].replace(",tier1,", ",gold,")]) + "\n", encoding="utf-8")
    result = run("--list", csv=bad)
    assert result.returncode == 1 and "management_tier" in result.stderr


def test_missing_patch_owner_column_fails(tmp_path):
    rows = sample_rows()
    fields = [f for f in rows[0] if f != "patch_owner"]
    bad = write_csv(tmp_path / "nopatch.csv", [{k: r[k] for k in fields} for r in rows], fields)
    result = run("--list", csv=bad)
    assert result.returncode == 1 and "patch_owner" in result.stderr


def test_unknown_patch_owner_fails(tmp_path):
    rows = sample_rows()
    rows[1]["patch_owner"] = "updatemanager"  # a typo would drop the server out of its group
    result = run("--list", csv=write_csv(tmp_path / "typo.csv", rows))
    assert result.returncode == 1 and "unknown patch_owner" in result.stderr


def test_unknown_config_owner_fails(tmp_path):
    rows = sample_rows()
    rows[1]["config_owner"] = "machine_config"
    result = run("--list", csv=write_csv(tmp_path / "typo.csv", rows))
    assert result.returncode == 1 and "unknown config_owner" in result.stderr


def test_wave_that_isnt_a_number_fails(tmp_path):
    rows = sample_rows()
    rows[2]["arc_wave"] = "pilot"
    result = run("--list", csv=write_csv(tmp_path / "wave.csv", rows))
    assert result.returncode == 1 and "arc_wave" in result.stderr


def test_owner_values_ignore_case(tmp_path):
    inventory = changed(tmp_path, "app02.contoso.example", patch_owner="Update_Manager")
    assert "app02.contoso.example" in hosts(inventory, "patch_owner_update_manager")


def test_managed_host_without_patch_owner_is_a_finding_and_blocks_onboarding(tmp_path):
    inventory = changed(tmp_path, "app02.contoso.example", patch_owner="")
    assert hosts(inventory, "patch_owner_missing") == {"app02.contoso.example"}
    assert "app02.contoso.example" not in hosts(inventory, "arc_onboarding_candidates")
    assert hosts(inventory, "arc_onboarding_blocked") == {"app02.contoso.example"}
    assert inventory["_meta"]["hostvars"]["app02.contoso.example"]["arc_blocked_reasons"] == ["no patch_owner"]


def test_none_counts_as_missing_on_a_managed_host(tmp_path):
    inventory = changed(tmp_path, "lab01.contoso.example", config_owner="none", patch_owner="none")
    assert "lab01.contoso.example" in hosts(inventory, "config_owner_missing")
    assert "lab01.contoso.example" in hosts(inventory, "patch_owner_missing")
    assert "lab01.contoso.example" not in hosts(inventory, "config_owner_ansible")


def test_candidate_without_a_wave_is_blocked(tmp_path):
    inventory = changed(tmp_path, "win01.contoso.example", arc_wave="")
    assert inventory["_meta"]["hostvars"]["win01.contoso.example"]["arc_blocked_reasons"] == ["no arc_wave"]
    assert "win01.contoso.example" not in hosts(inventory, "arc_onboarding_candidates")


def test_candidate_without_a_resource_group_or_region_is_blocked(tmp_path):
    inventory = changed(tmp_path, "web01.contoso.example", arc_resource_group="", arc_location="")
    assert inventory["_meta"]["hostvars"]["web01.contoso.example"]["arc_blocked_reasons"] == [
        "no arc_resource_group", "no arc_location",
    ]


def test_tag_value_with_a_comma_blocks_onboarding(tmp_path):
    # azcmagent connect --tags is comma-delimited: "dc-east,b" would become a second, wrong tag.
    inventory = changed(tmp_path, "app02.contoso.example", location="dc-east,b")
    assert inventory["_meta"]["hostvars"]["app02.contoso.example"]["arc_blocked_reasons"] == [
        "tag Location value contains a comma",
    ]


def test_tag_value_longer_than_azure_allows_blocks_onboarding(tmp_path):
    inventory = changed(tmp_path, "app02.contoso.example", owner="t" * 257)
    assert inventory["_meta"]["hostvars"]["app02.contoso.example"]["arc_blocked_reasons"] == [
        "tag Owner value longer than 256 characters",
    ]


def test_connected_server_is_never_a_candidate_whatever_its_wave(tmp_path):
    inventory = changed(tmp_path, "app01.contoso.example", arc_wave="0")
    assert "app01.contoso.example" in hosts(inventory, "arc_wave_0")
    assert "app01.contoso.example" not in hosts(inventory, "arc_onboarding_candidates")


def test_script_only_reads(tmp_path):
    before = {p: p.stat().st_mtime_ns for p in KIT.rglob("*") if p.is_file()}
    run("--list")
    after = {p: p.stat().st_mtime_ns for p in KIT.rglob("*") if p.is_file() and "__pycache__" not in p.parts}
    assert {p: t for p, t in before.items() if "__pycache__" not in p.parts} == after
