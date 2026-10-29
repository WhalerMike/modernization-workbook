#!/usr/bin/env python3
"""Dynamic inventory from a CMDB export: the CMDB is the attribute source, Ansible reads it.

The configuration management database owns the business facts about each asset (owner,
environment, location, management tier, which tool owns its configuration). This script
turns a CSV export of those records into Ansible's inventory JSON, so playbooks target
groups built from CMDB attributes instead of a hand-kept hosts file that drifts from it.

Read-only: it reads one CSV and prints JSON. It never writes to the CMDB or to disk.

    CMDB_CSV=/path/to/export.csv ansible-inventory -i inventory/cmdb_inventory.py --graph
    python3 inventory/cmdb_inventory.py --list
    python3 inventory/cmdb_inventory.py --host app01.contoso.example

Without CMDB_CSV it reads inventory/sample/cmdb_export.csv, the fictional estate the tests
use. Standard library only, so it runs wherever ansible-core runs.

Groups it builds (every name is a CMDB value, never a guess):
  managed                      tiers 1 and 2: assets a management tool reaches
  unmanaged                    tiers 3 (discovered only) and 4 (segmented or retired)
  tier_1 .. tier_4             the coverage tier from the CMDB record
  os_<family>                  linux, unix, windows, network_ios, infoblox_nios, vmware_vcenter, other
  env_<environment>            production, nonproduction
  config_owner_<tool>          the one tool that owns the asset's configuration settings
  arc_onboarding_candidates    tier 1 Linux or Windows servers not yet connected to Azure Arc
  owner_missing                records with no owner: a CM-8 finding, not a target
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path

DEFAULT_CSV = Path(__file__).resolve().parent / "sample" / "cmdb_export.csv"
REQUIRED = (
    "name", "ansible_host", "cmdb_ci", "device_class", "os_family", "os", "environment",
    "owner", "location", "management_tier", "config_owner", "arc_status",
)
OPTIONAL = ("arc_resource_group", "arc_location", "patch_group")
TIERS = {"tier1": 1, "tier2": 2, "tier3": 3, "tier4": 4}
ARC_PLATFORMS = {"linux", "windows"}
GROUP_SAFE = re.compile(r"[^a-z0-9_]")


class InventoryError(Exception):
    """The export can't be trusted as an inventory source."""


def group_name(prefix: str, value: str) -> str:
    return f"{prefix}_{GROUP_SAFE.sub('_', value.strip().lower())}"


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = [col for col in REQUIRED if col not in (reader.fieldnames or [])]
        if missing:
            raise InventoryError(f"{path}: missing columns {', '.join(missing)}")
        return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def build(rows: list[dict[str, str]]) -> dict:
    groups: dict[str, set[str]] = {}
    hostvars: dict[str, dict] = {}

    def add(group: str, host: str) -> None:
        groups.setdefault(group, set()).add(host)

    for number, row in enumerate(rows, start=2):  # line 1 is the header
        host = row["name"].lower()
        if not host:
            raise InventoryError(f"line {number}: empty name")
        if host in hostvars:
            # Two records for one asset is the drift CM-8 asks you to resolve, not to merge.
            raise InventoryError(f"line {number}: duplicate record for {host}")
        tier = TIERS.get(row["management_tier"].lower())
        if tier is None:
            raise InventoryError(f"line {number}: unknown management_tier {row['management_tier']!r}")

        hostvars[host] = {
            "ansible_host": row["ansible_host"],
            "cmdb_ci": row["cmdb_ci"],
            "cmdb_os": row["os"],
            "device_class": row["device_class"],
            "owner": row["owner"],
            "environment": row["environment"],
            "location": row["location"],
            "management_tier": tier,
            "config_owner": row["config_owner"],
            "arc_status": row["arc_status"],
            "arc_resource_group": row.get("arc_resource_group", ""),
            "arc_location": row.get("arc_location", ""),
            # Tags carried to the Arc resource at onboarding; the CMDB stays their origin.
            "arc_tags": {
                "Owner": row["owner"],
                "Environment": row["environment"],
                "CmdbCi": row["cmdb_ci"],
                "Location": row["location"],
                "PatchGroup": row.get("patch_group", ""),
            },
        }

        add(f"tier_{tier}", host)
        add("managed" if tier <= 2 else "unmanaged", host)
        add(group_name("os", row["os_family"]), host)
        add(group_name("env", row["environment"]), host)
        if row["config_owner"] and row["config_owner"].lower() != "none":
            add(group_name("config_owner", row["config_owner"]), host)
        if not row["owner"]:
            add("owner_missing", host)
        if tier == 1 and row["os_family"].lower() in ARC_PLATFORMS and row["arc_status"] == "not_onboarded":
            add("arc_onboarding_candidates", host)

    inventory: dict = {"_meta": {"hostvars": hostvars}}
    for group, members in sorted(groups.items()):
        inventory[group] = {"hosts": sorted(members)}
    return inventory


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--list", action="store_true", help="print the whole inventory")
    action.add_argument("--host", help="print one host's variables")
    args = parser.parse_args(argv)

    path = Path(os.environ.get("CMDB_CSV") or DEFAULT_CSV)
    try:
        inventory = build(read_rows(path))
    except (OSError, InventoryError) as err:
        print(f"cmdb_inventory: {err}", file=sys.stderr)
        return 1

    if args.host:
        print(json.dumps(inventory["_meta"]["hostvars"].get(args.host.lower(), {}), indent=2))
    else:
        print(json.dumps(inventory, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
