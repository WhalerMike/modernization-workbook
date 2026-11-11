"""Tests for scripts/check_identifiers.py: tenant names and real-looking GUIDs (convention G-04).

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_identifiers as ci  # noqa: E402

REAL = "3f2c9a71-5b8e-4d0a-9c6f-e1b74a2d8053"     # random-looking, made up for the test


def flagged(text: str) -> list[int]:
    return [n for n, _ in ci.hits(text)]


class Tenants(unittest.TestCase):
    def test_a_real_looking_tenant_is_flagged_even_in_code(self):
        self.assertEqual(flagged("Run it against northwind-prod.onmicrosoft.com."), [1])
        self.assertEqual(flagged("```powershell\nConnect-ZtAssessment -Tenant northwind.onmicrosoft.us\n```"), [2])

    def test_documented_example_tenants_pass(self):
        for name in ("contoso", "contosoexample", "contosoexampletest", "fabrikam", "tenant", "yourdomain",
                     "yourtenant", "agency", "example"):
            self.assertEqual(flagged(f"Sign in as admin@{name}.onmicrosoft.com."), [], name)

    def test_placeholders_and_url_escapes_pass(self):
        self.assertEqual(flagged("Use <tenant>.onmicrosoft.com or {tenant}.onmicrosoft.com."), [])
        self.assertEqual(flagged("A link [x](https://x.example/?u=admin%40contosoexample.onmicrosoft.com)."), [])

    def test_the_allow_marker_needs_a_reason(self):
        self.assertEqual(flagged("northwind.onmicrosoft.com <!-- identifiers-ok: a vendor's sample tenant -->"), [])
        self.assertEqual(flagged("<!-- identifiers-ok: a vendor's sample tenant -->\nnorthwind.onmicrosoft.com"), [])
        self.assertEqual(flagged("northwind.onmicrosoft.com <!-- identifiers-ok: -->"), [1])


class Guids(unittest.TestCase):
    def test_a_real_looking_guid_in_prose_is_flagged(self):
        self.assertEqual(flagged(f"The tenant ID is {REAL}."), [1])

    def test_code_inline_code_links_and_comments_pass(self):
        self.assertEqual(flagged(f"```text\n{REAL}\n```"), [])
        self.assertEqual(flagged(f"    ```json\n    {{\"id\": \"{REAL}\"}}\n    ```"), [])
        self.assertEqual(flagged(f"| Global Administrator | `{REAL}` |"), [])
        self.assertEqual(flagged(f"[the policy](https://portal.example/{REAL})"), [])
        self.assertEqual(flagged(f"<!-- {REAL} -->"), [])

    def test_synthetic_guids_pass(self):
        for g in ("00001111-aaaa-2222-bbbb-3333cccc4444", "a0000000-0000-4000-8000-000000000020",
                  "11111111-1111-4111-8111-111111111111", "a1b2c3d4-e5f6-7890-abcd-ef1234567890"):
            self.assertTrue(ci.is_synthetic(g), g)
            self.assertEqual(flagged(f"The ID {g} is an example."), [], g)
        self.assertFalse(ci.is_synthetic(REAL))

    def test_scope_is_the_published_pages(self):
        self.assertTrue(ci.in_scope("docs/books/b11-zero-trust/10-evidence-not-verdicts.md"))
        self.assertFalse(ci.in_scope("docs/books/b11-zero-trust/_verification/10-evidence-not-verdicts.md"))
        self.assertFalse(ci.in_scope("archive/b11-zero-trust/old.md"))


if __name__ == "__main__":
    unittest.main()
