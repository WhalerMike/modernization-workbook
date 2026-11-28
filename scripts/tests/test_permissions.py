"""The Permissions by Run page (scripts/build_permissions.py) is current, and the SQL Server identity kit's
permission file says what its README says.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import json
import re
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

    def test_production_section_lists_every_read_run_once(self):
        text = bp.page()
        self.assertIn("[Assessments you can run against production](#production-assessments)",
                      text.split("## At a glance", 1)[1].split("\n## ", 1)[0], "At a glance links the section")
        section = text.split("{#production-assessments}", 1)[1].split("\n## ", 1)[0]
        rows = [line.split(" | ") for line in section.splitlines() if line.startswith("| ") and "---" not in line]
        listed = [(r[0].lstrip("| "), r[1]) for r in rows if r[1] != "Run"]
        for kit, title, guide in bp.KITS:
            for r in bp.runs_for(kit).values():
                shown = "All the kit's calls" if r.name == bp.EVERY else f"`{r.name}`"
                count = listed.count((title, shown))
                self.assertEqual(count, 0 if r.changes else 1, f"{kit} {r.name}: listed {count} times")
        for kit in ("Start Kit", "Validation kit"):
            self.assertTrue(any(k == kit for k, _ in listed), f"the estate inventory's {kit} row")
        for target in re.findall(r"\]\((\.\./[^)#]+)", section):
            self.assertTrue((bp.PAGE.parent / target).resolve().exists(), target)

    def test_only_read_only_labs_point_to_production(self):
        """A Lab 2 links the production assessments section only when every run its chapter teaches only
        reads, and a module's only when every chapter it teaches is such a chapter."""
        import generate_labs as gl
        labs = bp.read_only_labs()
        allowed = {p for p, s in labs.items() if s == "read-only"}
        gl.read_workbooks()
        for wb in gl.WORKBOOKS:
            for m in gl.modules(wb):
                chs = [c["path"] for c in wb.chapters if c["nn"] in m["chapters"]]
                if chs and all(labs.get(c) == "read-only" for c in chs):
                    allowed.add(m["path"])
        wrong = []
        for page in sorted((ROOT / "docs").rglob("*.md")):
            md = page.read_text(encoding="utf-8")
            rel = page.relative_to(ROOT).as_posix()
            for a, b in bp.lab2_sections(md):
                if "permissions-by-run.md#production-assessments" in md[a:b] and rel not in allowed:
                    wrong.append(f"{rel}: {labs.get(rel, 'not read-only')}")
        self.assertEqual(wrong, [], "a Lab 2 that changes something links the production assessments")


if __name__ == "__main__":
    unittest.main()
