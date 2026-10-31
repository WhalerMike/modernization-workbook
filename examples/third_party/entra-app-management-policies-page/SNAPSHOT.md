# Configure app management policies: a pinned copy of Learn's procedure

This folder is an unmodified copy of the Microsoft Learn source page for [Configure restrictions on how applications can be configured](https://learn.microsoft.com/entra/identity/enterprise-apps/configure-app-management-policies). It holds Microsoft's procedure, in the admin center and in Microsoft Graph, for blocking new passwords tenant-wide, granting an app or a caller an exception, applying a restriction to one app, listing custom policies and fixing the policy state for the admin center. It comes from [MicrosoftDocs/entra-docs](https://github.com/MicrosoftDocs/entra-docs/blob/7f78b50dce9d8cf119de57cbd6fd66e24a6c58d4/docs/identity/enterprise-apps/configure-app-management-policies.md) at commit `7f78b50dce9d8cf119de57cbd6fd66e24a6c58d4` (October 30, 2026); the page last changed on June 15, 2026. The repository's code license (`LICENSE-CODE`) and documentation license (`LICENSE`) are MIT.

**Why the page.** The Graph requests exist only inside this page. `examples/non-person-identity/tests/CredentialPolicySampleHarness.ps1` parses them, unmodified, at test time and sends them to Chapter 04's fake Microsoft Graph. Nothing is installed and nothing signs in. The [developer workbook *Building Non-Person Identity*, Chapter 04](../../../docs/project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md) links Learn rather than quoting the page.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, licenses and the size and SHA-256 of every file here. Each file's git blob hash was checked against the upstream tree at that commit before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream page (`entra-app-management-policies-page-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the page from that commit, regenerate `snapshot.json`, rerun `examples/non-person-identity/tests/NpiCredentialPolicy.Tests.ps1` and the Chapter 04 labs, and open a pull request. Never edit the files here.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
