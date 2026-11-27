"""The Permissions by Run page (scripts/build_permissions.py) is current, and the SQL Server identity kit's
permission file says what its README says.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import build_permissions as bp  # noqa: E402


class PermissionsPage(unittest.TestCase):
    def test_page_is_current(self):
        self.assertEqual(bp.PAGE.read_text(encoding="utf-8"), bp.page(), "run: python scripts/build_permissions.py")

    def test_every_listed_kit_has_runs(self):
        for kit, title, guide in bp.KITS:
            self.assertTrue(bp.runs_for(kit), f"{kit}: no runs read")
            self.assertTrue((ROOT / guide).exists(), f"{kit}: no {guide}")

    def test_prose_kits_link_to_files_that_exist(self):
        for kit, _, readme, _ in bp.IN_PROSE:
            self.assertTrue((ROOT / readme).exists(), readme)
        for _, path in bp.PROSE_PAGES:
            self.assertTrue((ROOT / path.partition("#")[0]).exists(), path)

    def test_sql_permission_file_matches_its_readme(self):
        readme = (ROOT / "examples/sql-server-identity/README.md").read_text(encoding="utf-8")
        tasks = json.loads((ROOT / "examples/sql-server-identity/config/permissions.json").read_text(encoding="utf-8"))["tasks"]
        missing = [f"{name}: {perm}" for name, t in tasks.items()
                   for perms in (t.get("sql") or {}).values() for perm in perms if f"`{perm}`" not in readme]
        missing += [f"{name}: {role}" for name, t in tasks.items() for role in t.get("azureRoles", [])
                    if role not in readme]
        self.assertEqual(missing, [], "examples/sql-server-identity/config/permissions.json names what the README doesn't")

    def test_reads_and_writes_are_told_apart(self):
        runs = bp.runs_for("servicenow-sailpoint")
        self.assertFalse(runs["drift"].changes, "a search POST and token requests are reads")
        self.assertTrue(runs["drift-push"].changes)
        npi = bp.runs_for("non-person-identity")
        self.assertFalse(npi["drift"].changes)
        self.assertTrue(npi["orphan-apply"].changes)


if __name__ == "__main__":
    unittest.main()
