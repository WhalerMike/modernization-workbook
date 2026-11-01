# CSV2SCIM: a pinned copy of Microsoft's sample

This folder is an unmodified copy of Microsoft's **CSV2SCIM** PowerShell sample for Microsoft Entra API-driven inbound provisioning, taken from [AzureAD/entra-id-inbound-provisioning](https://github.com/AzureAD/entra-id-inbound-provisioning/tree/f2e8c59f0af497b066c3484fc36a4197c2b37711/PowerShell/CSV2SCIM) at commit `f2e8c59f0af497b066c3484fc36a4197c2b37711` (March 2, 2026), retrieved October 30, 2026. Microsoft documents it on Learn in [API-driven inbound provisioning with PowerShell script](https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-powershell). It is MIT-licensed; `LICENSE` is the repository's license file. Microsoft provides it "as-is" for implementation reference.

**Why a copy, not only a link.** A link to `main` changes under you. This copy is the exact version the [developer workbook *Building the Attribute-Driven Migration*, Chapter 01](../../../docs/books/b19-developer-workbook/01-the-hr-to-entra-middleware.md) was written and tested against, so its labs give the same result next year. Agencies that review code before running it need a fixed version to review.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, license and the size and SHA-256 of every file here. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream folder (`csv2scim-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the files from that commit, regenerate `snapshot.json`, rerun the Chapter 01 labs and tests, and open a pull request. Never edit the files here; changes the program needs go in `examples/hcm-entra`.

**What was copied.** `src/` (the script and its SCIM schema files), `readme.md`, and the samples Learn's tutorial uses (`AttributeMapping.psd1`, `csv-with-2-records.csv`, `Test-ScriptCommands.ps1`, `UseClientCertificate.ps1` and two sample payloads). Not copied: `csv-with-1000-records.csv` and the `Sample1` folder, which hold larger fictional data sets. They are listed in `snapshot.json`.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
