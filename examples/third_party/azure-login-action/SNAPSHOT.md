# Azure Login action: a pinned copy of its metadata

This folder is an unmodified copy of `action.yml` from Microsoft's [Azure Login action](https://github.com/Azure/login) at release v3.1.0, commit `a641126d1b8aa4d1fa005f4f92df94a3a4c4c906` (September 10, 2026), with the repository's MIT `LICENSE`. `action.yml` declares the action's inputs and their defaults: `client-id`, `tenant-id`, `subscription-id`, `environment` (default `azurecloud`), `audience` (default `api://AzureADTokenExchange`), `enable-AzPSSession` and the rest. Learn documents the action in [Use the Azure Login action with OpenID Connect](https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect), whose sample workflows are pinned in [`../azure-login-oidc-sample`](../azure-login-oidc-sample/SNAPSHOT.md).

**Why only `action.yml`.** `examples/drift-pipeline/python/workflow_lint.py` reads the declared inputs and defaults to check a workflow offline: that every input it passes exists, and that the audience matches the cloud. It never runs the action. The compiled action, its tests and its README are listed in `snapshot.json` under `not_copied`. The sample workflow in `examples/drift-pipeline/workflow` pins the same commit.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, release, dates, license and the size and SHA-256 of each file. Each file's git blob hash was checked against the upstream tree at that commit. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to `action.yml` (`azure-login-action-commits` in `data/source-watch/feeds.json`) under DW.
- To move to a newer release: review it, copy `action.yml` and `LICENSE` from its commit, regenerate `snapshot.json`, move the pin in `examples/drift-pipeline/workflow/drift-pipeline.yml`, rerun `examples/drift-pipeline/tests`, and open a pull request. Never edit the files here.

These files keep their upstream bytes, line endings included (upstream uses CRLF), so the hashes match the upstream commit.
