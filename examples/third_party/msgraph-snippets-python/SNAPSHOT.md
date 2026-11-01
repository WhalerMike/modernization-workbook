# Microsoft Graph Python SDK snippets: a pinned copy of Microsoft's sample

This folder is an unmodified copy of part of Microsoft's **msgraph-snippets-python** repository, taken from [microsoftgraph/msgraph-snippets-python](https://github.com/microsoftgraph/msgraph-snippets-python/tree/3ef43818c946ef595e8d90fa6ec63edec1fb3628) at commit `3ef43818c946ef595e8d90fa6ec63edec1fb3628` (October 20, 2026), retrieved October 30, 2026. `src/snippets/national_clouds.py` last changed on September 23, 2024. These are the source files Learn renders as the Python examples on [Access national cloud deployments with the Microsoft Graph SDKs](https://learn.microsoft.com/graph/sdks/national-clouds) and on [Choose a Microsoft Graph authentication provider](https://learn.microsoft.com/graph/sdks/choose-authentication-providers); the Learn pages pull them from this repository when they are published. The code is MIT-licensed; `LICENSE` is the repository's license file.

**Why a copy, not only a link.** A link to `main` changes under you. This copy is the exact version the [developer workbook *Building the Attribute-Driven Migration*, Chapter 02](../../../docs/books/b19-developer-workbook/02-graph-clients-for-government-clouds.md) was written and tested against. `examples/ms-automation/tests/python/test_learn_sample.py` loads both snippet files, unmodified, against stand-ins for the SDK packages and records what they would sign in to and call. Nothing is installed and nothing signs in.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, license and the size and SHA-256 of every file here. Every file's git blob hash was checked against the upstream tree at that commit before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream folder (`msgraph-snippets-python-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the files from that commit, regenerate `snapshot.json`, rerun `test_learn_sample.py` and the Chapter 02 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/ms-automation`.

**What was copied.** `src/snippets/national_clouds.py` (the US Government L4 client) and `src/snippets/create_clients.py` (the credential snippets, including the certificate one an app-only job uses), with the repository's `LICENSE`, `README.md` and `requirements.in`. Not copied: the interactive sample app (`src/main.py`, `src/graph.py`, `src/config.cfg`), the request and middleware snippets, and the repository's housekeeping files. They are listed in `snapshot.json`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
