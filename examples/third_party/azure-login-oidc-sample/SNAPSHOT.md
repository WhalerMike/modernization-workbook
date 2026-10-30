# Azure Login with OpenID Connect: a pinned copy of Learn's sample workflows

This folder is an unmodified copy of the Microsoft Learn source page for [Use the Azure Login action with OpenID Connect](https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect). It holds Microsoft's three sample workflows for signing in to Azure from GitHub Actions with a federated credential: Azure CLI only, Azure CLI and Azure PowerShell, and the Azure US Government sign-in. It comes from [MicrosoftDocs/azure-dev-docs](https://github.com/MicrosoftDocs/azure-dev-docs/blob/23900ce00d955ff876f1a2df6a00d52f1a2f3df3/articles/github/connect-from-azure-openid-connect.md) at commit `23900ce00d955ff876f1a2df6a00d52f1a2f3df3` (October 28, 2026); the page last changed on January 21, 2026. The code is MIT-licensed (`LICENSE-CODE`); `LICENSE` is the repository's documentation license (CC BY 4.0).

**Why the page, not just the workflows.** The workflows exist only inside this Learn page. Pinning the page byte for byte keeps the copy checkable against upstream; `examples/drift-pipeline/python/workflow_lint.py` extracts each workflow, unmodified, at test time and checks it offline. Nothing here is run, and nothing signs in. The [developer workbook *Building the Attribute-Driven Migration*, Chapter 09](../../../docs/project-plans/developer-workbooks/attribute-driven-migration/09-drift-pipelines-and-evidence.md) links Learn rather than quoting the page.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, licenses and the size and SHA-256 of every file here. Each file's git blob hash was checked against the upstream tree at that commit before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream page (`azure-login-oidc-sample-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the page from that commit, regenerate `snapshot.json`, rerun `examples/drift-pipeline/tests/test_workflow_lint.py` and the Chapter 09 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/drift-pipeline`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
