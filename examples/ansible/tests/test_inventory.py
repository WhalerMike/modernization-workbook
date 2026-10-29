"""The CMDB inventory script: groups come from CMDB attributes, and a bad export fails loudly."""

from __future__ import annotations

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


def test_every_record_becomes_a_host(inventory):
    records = SAMPLE.read_text(encoding="utf-8").strip().splitlines()[1:]
    assert len(inventory["_meta"]["hostvars"]) == len(records) == 12


def test_tiers_split_managed_from_unmanaged(inventory):
    assert hosts(inventory, "managed") == hosts(inventory, "tier_1") | hosts(inventory, "tier_2")
    assert hosts(inventory, "unmanaged") == {"legacy01.contoso.example", "scada01.contoso.example"}
    assert not hosts(inventory, "managed") & hosts(inventory, "unmanaged")


def test_arc_candidates_are_tier_1_servers_not_yet_connected(inventory):
    assert hosts(inventory, "arc_onboarding_candidates") == {
        "app02.contoso.example", "web01.contoso.example", "win01.contoso.example",
    }


def test_one_configuration_owner_per_host(inventory):
    owners = [g for g in inventory if g.startswith("config_owner_")]
    for host in inventory["_meta"]["hostvars"]:
        assert sum(host in hosts(inventory, g) for g in owners) <= 1, host
    # Hosts Azure machine configuration owns are never in the Ansible baseline's scope.
    assert not hosts(inventory, "config_owner_ansible") & hosts(inventory, "config_owner_arc_machine_configuration")


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


def test_script_only_reads(tmp_path):
    before = {p: p.stat().st_mtime_ns for p in KIT.rglob("*") if p.is_file()}
    run("--list")
    after = {p: p.stat().st_mtime_ns for p in KIT.rglob("*") if p.is_file() and "__pycache__" not in p.parts}
    assert {p: t for p, t in before.items() if "__pycache__" not in p.parts} == after
