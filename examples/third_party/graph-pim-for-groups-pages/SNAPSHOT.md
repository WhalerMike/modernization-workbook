# PIM for Groups in Microsoft Graph: a pinned copy of Learn's request samples

This folder is an unmodified copy of three Microsoft Graph documentation source pages from [microsoftgraph/microsoft-graph-docs-contrib](https://github.com/microsoftgraph/microsoft-graph-docs-contrib/tree/a69303123e9701eecbf56568d152ece936a97f1e) at commit `a69303123e9701eecbf56568d152ece936a97f1e` (October 30, 2026):

- [Create eligibilityScheduleRequest](https://learn.microsoft.com/graph/api/privilegedaccessgroup-post-eligibilityschedulerequests?view=graph-rest-1.0) (`api-reference/v1.0/api/privilegedaccessgroup-post-eligibilityschedulerequests.md`): an administrator makes a principal eligible for, or extends, group membership or ownership.
- [Create assignmentScheduleRequest](https://learn.microsoft.com/graph/api/privilegedaccessgroup-post-assignmentschedulerequests?view=graph-rest-1.0) (`api-reference/v1.0/api/privilegedaccessgroup-post-assignmentschedulerequests.md`): an administrator assigns active membership, or a user activates an eligible one.
- [Update rules in PIM by using Microsoft Graph](https://learn.microsoft.com/graph/how-to-pim-update-rules) (`concepts/how-to-pim-update-rules.md`): the rule bodies for activation duration, enablement, approval and expiration.

The two privilegedAccessGroup pages last changed on October 24, 2025; the rules page on August 29, 2025. The documentation license (`LICENSE`) is Creative Commons Attribution 4.0 International and the code license (`LICENSE-CODE`) is MIT; both are copied from the repository root. Attribution: Microsoft, microsoftgraph/microsoft-graph-docs-contrib.

**Why the pages, not just the requests.** Learn has no end-to-end PIM for Groups tutorial in Microsoft Graph; these HTTP requests are what Microsoft publishes, and they exist only inside these pages. Pinning the pages byte for byte keeps the copy checkable against upstream. `examples/privileged-access/tests/PimForGroupsSampleHarness.ps1` extracts the `http` requests at test time and sends them, unmodified, to the chapter's fake Graph; nothing is sent to a tenant. The permissions tables and the SDK snippets are include files that aren't copied; the [developer workbook *Building Privileged Access*, Chapter 05](../../../docs/project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md) cites the rendered Learn pages for them and links Learn rather than quoting the pages.

**How it stays honest.**

- `snapshot.json` records the upstream repository, paths, commit, dates, licenses and the size and SHA-256 of every file here. Each file's git blob hash was checked against the upstream tree at that commit before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to each upstream page (`graph-pim-groups-eligibility-page-commits`, `graph-pim-groups-assignment-page-commits` and `graph-pim-update-rules-page-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the pages from that commit, regenerate `snapshot.json`, rerun `examples/privileged-access/tests/PimForGroups.Tests.ps1` and the Chapter 05 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/privileged-access`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
