# PIM rules and eligibility for Microsoft Entra roles: a pinned copy of Learn's samples

This folder is an unmodified copy of two Microsoft Learn source pages from [microsoftgraph/microsoft-graph-docs-contrib](https://github.com/microsoftgraph/microsoft-graph-docs-contrib/tree/a69303123e9701eecbf56568d152ece936a97f1e/concepts) at commit `a69303123e9701eecbf56568d152ece936a97f1e` (October 30, 2026):

- [Update rules in PIM by using Microsoft Graph](https://learn.microsoft.com/graph/how-to-pim-update-rules) (`how-to-pim-update-rules.md`, last changed August 29, 2025): how to find a role's policy from its template ID, and six `PATCH` samples for the activation and assignment rules.
- [Assign privileged roles using PIM for Microsoft Entra roles APIs](https://learn.microsoft.com/graph/tutorial-assign-azureadroles) (`tutorial-assign-azureadroles.md`, last changed July 3, 2026): a role-assignable group made eligible for a role through `roleEligibilityScheduleRequests`, then activated and cleaned up.

The repository's code license (`LICENSE-CODE`) is MIT; its documentation license (`LICENSE`) is Creative Commons Attribution 4.0 International.

**Why the pages, not just the samples.** The HTTP samples exist only inside these pages; the per-language SDK snippets are generated from them. Pinning the pages byte for byte keeps the copy checkable against upstream. `examples/privileged-access/tests/PimLearnSampleHarness.ps1` extracts the HTTP requests, unmodified, at test time and sends them to the fake Graph in `PimEntraRoles.psm1`. Nothing signs in and nothing leaves the machine. The [developer workbook *Building Privileged Access*, Chapter 04](../../../docs/project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md) links Learn rather than quoting the pages.

**How it stays honest.**

- `snapshot.json` records the upstream repository, both paths, the commit, dates, licenses and the size and SHA-256 of every file here. Each file's git blob hash was checked against the upstream tree at that commit before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to both upstream pages (`graph-pim-update-rules-page-commits` and `graph-pim-tutorial-assign-roles-page-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the pages from that commit, regenerate `snapshot.json`, rerun `examples/privileged-access/tests/PimEntraRoles.Tests.ps1` and the Chapter 04 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/privileged-access`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
