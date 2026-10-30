# List Microsoft Entra role assignments: a pinned copy of Learn's samples

This folder is an unmodified copy of the Microsoft Learn source page for [List Microsoft Entra role assignments](https://learn.microsoft.com/entra/identity/role-based-access-control/view-assignments). It holds Microsoft's Microsoft Graph PowerShell and Graph API samples for listing role assignments: for one role, across all roles, for a principal (direct and transitive), for a group, and at administrative unit scope. It comes from [MicrosoftDocs/entra-docs](https://github.com/MicrosoftDocs/entra-docs/blob/07cb73d6c6380414eecd040ba5e14c1c94d48b66/docs/identity/role-based-access-control/view-assignments.md) at commit `07cb73d6c6380414eecd040ba5e14c1c94d48b66` (October 30, 2026); the page last changed on February 24, 2026. The repository's code license (`LICENSE-CODE`) and documentation license (`LICENSE`) are both MIT.

**Why the page, not just the samples.** The samples exist only inside this Learn page. Pinning the page byte for byte keeps the copy checkable against upstream. `examples/privileged-access/tests/LearnSampleHarness.ps1` extracts the PowerShell samples, unmodified, at test time and runs them against stand-ins for the Graph PowerShell cmdlets. Nothing is installed and nothing signs in. The [developer workbook *Building Privileged Access*, Chapter 01](../../../docs/project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md) links Learn rather than quoting the page.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, licenses and the size and SHA-256 of every file here. Each file's git blob hash was checked against the upstream tree at that commit before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream page (`entra-role-assignments-page-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the page from that commit, regenerate `snapshot.json`, rerun `examples/privileged-access/tests/MicrosoftSamples.Tests.ps1` and the Chapter 01 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/privileged-access`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
