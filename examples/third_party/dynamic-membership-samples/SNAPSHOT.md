# Dynamic membership processing samples: a pinned copy of Learn's samples

This folder is an unmodified copy of the Microsoft Learn source pages for [PowerShell samples for dynamic membership processing](https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership-powershell-samples): the overview page and the five sample pages (pause all, pause specific, pause all except, resume specific critical, resume noncritical in batches). They come from [MicrosoftDocs/entra-docs](https://github.com/MicrosoftDocs/entra-docs/tree/07cb73d6c6380414eecd040ba5e14c1c94d48b66/docs/identity/users/scripts) at commit `07cb73d6c6380414eecd040ba5e14c1c94d48b66` (October 30, 2026); the sample pages last changed on June 12, 2026. The code is MIT-licensed (`LICENSE-CODE`); `LICENSE` is the repository's documentation license. Each script carries Microsoft's own disclaimer.

**Why the pages, not just the scripts.** The scripts exist only inside these Learn pages. Pinning the pages byte for byte keeps the copy checkable against upstream; `examples/dynamic-rules/tests/LearnSampleHarness.ps1` extracts each script, unmodified, at test time. The [developer workbook *Building the Attribute-Driven Migration*, Chapter 04](../../../docs/books/b19-developer-workbook/04-dynamic-rules-as-code.md) links Learn rather than quoting the pages.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, licenses and the size and SHA-256 of every file here. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream folder (`dynamic-membership-samples-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the pages from that commit, regenerate `snapshot.json`, rerun `examples/dynamic-rules/tests/LearnSamples.Tests.ps1` and the Chapter 04 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/dynamic-rules`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
