"""Tests for the source watcher's git history: scripts/source_watch/gitsource.py and its use in watch.py and report.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "source_watch"))

import gitsource as gs  # noqa: E402
import report  # noqa: E402
import watch  # noqa: E402

A, B, C, D, E = (ch * 40 for ch in "abcde")
PATH = "articles/governance/machine-configuration/overview/01-overview-concepts.md"
CFG = {**watch.DEFAULTS}


def commit(sha: str, message: str, date: str = "2026-10-30T18:00:00Z") -> dict:
    return {"sha": sha, "commit": {"message": message, "committer": {"date": date}}}


class FakeGitHub:
    """Answers GitHub API URLs from a dict of URL substrings; records every call."""

    def __init__(self, answers: dict[str, tuple[int, object]]):
        self.answers, self.calls = answers, []

    def __call__(self, url: str):
        self.calls.append(url)
        for key, answer in self.answers.items():
            if key in url:
                return answer
        return 404, None


def history_and_diff(repo: str = "MicrosoftDocs/azure-docs", path: str = PATH) -> FakeGitHub:
    patch = "@@ -1,3 +1,4 @@\n context\n-will need to upgrade\n+must upgrade\n+> [!WARNING]\n"
    return FakeGitHub({
        f"/repos/{repo}/commits?": (200, [
            commit(D, "Apply suggestion from bot"),
            commit(C, "Merging changes synced from the private repository"),
            commit(B, "Add warning for Linux OS upgrade requirements\n\nLonger body."),
            commit(A, "Revise supported OS list", "2026-10-27T22:43:00Z"),
            commit(E, "Older change", "2026-06-02T20:01:00Z"),
        ]),
        f"/repos/{repo}/compare/{A}...{D}": (200, {"files": [
            {"filename": path, "patch": patch},
            {"filename": "articles/other.md", "patch": "+unrelated\n"},
        ]}),
    })


class Parsing(unittest.TestCase):
    def test_learn_source_and_its_public_copy(self):
        src = gs.learn_source("https://github.com/MicrosoftDocs/entra-docs-pr/blob/live/docs/agent-id/whats-new-agent-id.md")
        self.assertEqual(src, ("MicrosoftDocs/entra-docs-pr", "docs/agent-id/whats-new-agent-id.md"))
        self.assertEqual(gs.public_repo("MicrosoftDocs/entra-docs-pr"), "MicrosoftDocs/entra-docs")
        self.assertEqual(gs.public_repo("microsoftgraph/microsoft-graph-docs"), "microsoftgraph/microsoft-graph-docs-contrib")
        self.assertEqual(gs.public_repo("Azure/azure-powershell"), "Azure/azure-powershell")
        self.assertIsNone(gs.learn_source(""))

    def test_branch_urls_are_watched_and_pinned_ones_are_not(self):
        self.assertEqual(gs.github_branch_target("https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md"),
                         ("cisagov/ScubaGear", "main", "PowerShell/ScubaGear/baselines/aad.md"))
        self.assertEqual(gs.github_branch_target("https://github.com/o/r/tree/Dev/some%20folder/"), ("o/r", "Dev", "some folder"))
        for pinned in ("https://github.com/cisagov/ScubaGear/blob/v2.0.0/README.md",
                       "https://github.com/cisagov/ScubaGear/tree/1.8.0/PowerShell",
                       f"https://github.com/AzureAD/entra-id-inbound-provisioning/tree/{A}/PowerShell/CSV2SCIM",
                       "https://github.com/cisagov/ScubaGear",
                       "https://learn.microsoft.com/entra/fundamentals/whats-new"):
            self.assertIsNone(gs.github_branch_target(pinned), pinned)


class Changes(unittest.TestCase):
    def test_commits_that_touched_the_file_and_its_changed_lines(self):
        gh = history_and_diff()
        out = gs.changes("MicrosoftDocs/azure-docs", PATH, A, D, get=gh)
        self.assertEqual(out["status"], "ok")
        self.assertEqual([c["message"] for c in out["commits"]],
                         ["Apply suggestion from bot", "Add warning for Linux OS upgrade requirements"])
        self.assertFalse(out["more_commits"])
        self.assertEqual(out["lines"], ["- will need to upgrade", "+ must upgrade", "+ > [!WARNING]"])
        self.assertEqual(out["compare_url"], f"https://github.com/MicrosoftDocs/azure-docs/compare/{A[:12]}...{D[:12]}")

    def test_an_old_commit_beyond_the_history_page_is_flagged(self):
        out = gs.changes("MicrosoftDocs/azure-docs", PATH, "f" * 40, D, get=history_and_diff())
        self.assertTrue(out["more_commits"])

    def test_lines_are_capped(self):
        out = gs.changes("MicrosoftDocs/azure-docs", PATH, A, D, max_lines=1, get=history_and_diff())
        self.assertEqual((len(out["lines"]), out["more_lines"]), (1, 2))

    def test_a_repository_that_isnt_public(self):
        out = gs.changes("MicrosoftDocs/memdocs", "intune/fundamentals/government-service.md", A, B, get=FakeGitHub({}))
        self.assertEqual((out["status"], out["compare_url"]), ("not public", ""))


def learn_fp(commit_id: str, paras: list[str]) -> dict:
    return {"kind": "html", "paras": " ".join(paras), "ms_date": "2025-11-07T00:00:00Z",
            "git_url": f"https://github.com/MicrosoftDocs/azure-docs-pr/blob/live/{PATH}", "git_commit": commit_id}


class Compare(unittest.TestCase):
    paras = [f"p{i:03d}" for i in range(200)]  # one changed paragraph is 1%, under the 2% threshold

    def test_a_new_commit_reports_even_one_changed_paragraph(self):
        change = watch.compare(learn_fp(A, self.paras), learn_fp(D, self.paras[:-1] + ["new"]), [], CFG)
        self.assertIsNotNone(change)
        self.assertEqual(change["git_commit"], [A, D])

    def test_without_a_new_commit_the_threshold_still_applies(self):
        self.assertIsNone(watch.compare(learn_fp(A, self.paras), learn_fp(A, self.paras[:-1] + ["new"]), [], CFG))

    def test_a_new_commit_with_no_visible_change_isnt_reported(self):
        self.assertIsNone(watch.compare(learn_fp(A, self.paras), learn_fp(D, self.paras), [], CFG))


class GitHistory(unittest.TestCase):
    SCUBA = "https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md"

    def scuba(self, latest: str) -> FakeGitHub:
        gh = history_and_diff("cisagov/ScubaGear", "PowerShell/ScubaGear/baselines/aad.md")
        gh.answers = {"per_page=1": (200, [commit(latest, "x")]), **gh.answers}
        return gh

    def test_a_new_commit_on_a_cited_branch_is_a_change(self):
        entry = {"status": "ok"}
        event = watch.git_history(self.SCUBA, {"git_commit": A}, entry, None, get=self.scuba(D))
        self.assertEqual(entry["git_commit"], D)
        self.assertEqual(event["type"], "changed")
        self.assertEqual(event["magnitude"], "2 new commit(s) to the cited file")
        self.assertEqual(event["git"]["lines"][1], "+ must upgrade")

    def test_the_same_commit_drops_a_change_seen_only_in_githubs_html(self):
        entry = {"status": "ok"}
        event = watch.git_history(self.SCUBA, {"git_commit": A}, entry, {"type": "changed", "magnitude": "+3 / -3"},
                                  get=self.scuba(A))
        self.assertIsNone(event)

    def test_a_first_sighting_only_records_the_commit(self):
        entry = {"status": "ok"}
        self.assertIsNone(watch.git_history(self.SCUBA, {}, entry, None, get=self.scuba(D)))
        self.assertEqual(entry["git_commit"], D)

    def test_a_failed_lookup_keeps_the_last_commit(self):
        entry = {"status": "ok"}
        self.assertIsNone(watch.git_history(self.SCUBA, {"git_commit": A}, entry, None, get=FakeGitHub({})))
        self.assertEqual(entry["git_commit"], A)

    def test_a_changed_learn_page_gets_its_public_copys_history(self):
        gh = history_and_diff()
        entry = learn_fp(D, [])
        event = watch.git_history("https://learn.microsoft.com/azure/governance/machine-configuration/overview/01-overview-concepts",
                                  {}, entry, {"type": "changed", "magnitude": "+1 / -1", "git_commit": [A, D]}, get=gh)
        self.assertTrue(all("/repos/MicrosoftDocs/azure-docs/" in u for u in gh.calls))
        self.assertEqual(event["git"]["status"], "ok")


class Report(unittest.TestCase):
    def test_the_issue_shows_the_commits_and_the_changed_lines(self):
        git = gs.changes("MicrosoftDocs/azure-docs", PATH, A, D, get=history_and_diff())
        e = {"type": "changed", "url": "https://learn.microsoft.com/x", "magnitude": "+1 / -1 of 40 paragraphs (5.0%)",
             "git_commit": [A, D], "git": git, "excerpts": ["an excerpt the diff replaces"]}
        text = report.event_block(e, ["c07-overview"], "What is Azure Machine Configuration?")
        self.assertIn("Add warning for Linux OS upgrade requirements (2026-10-30)", text)
        self.assertIn("    ```diff\n    - will need to upgrade\n    + must upgrade", text)
        self.assertNotIn("an excerpt the diff replaces", text)
        again = report.event_block(e, ["c07-overview"], "", first_at="DW `07-machine-configuration-packages.md`")
        self.assertNotIn("```diff", again)

    def test_a_source_that_isnt_public_says_so(self):
        e = {"type": "changed", "url": "https://learn.microsoft.com/y", "magnitude": "+1 / -0 of 20 paragraphs (5.0%)",
             "git_commit": [A, B], "git": {"repo": "MicrosoftDocs/memdocs", "path": "a.md", "status": "not public"},
             "excerpts": ["the added paragraph"]}
        text = report.event_block(e, ["c01-x"])
        self.assertIn("isn't public, so the change can't be shown line by line", text)
        self.assertIn("> the added paragraph", text)


if __name__ == "__main__":
    unittest.main()
