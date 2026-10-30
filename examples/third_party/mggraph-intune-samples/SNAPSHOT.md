# Settings catalog samples: a pinned copy of Microsoft's Intune Graph samples

This folder is an unmodified copy of the **Settings Catalog** folder of Microsoft's Intune samples for the Microsoft Graph PowerShell SDK, taken from [microsoft/mggraph-intune-samples](https://github.com/microsoft/mggraph-intune-samples/tree/2e668455288ebc43b7356b2d9b0c537e24c409f4/SettingsCatalog) at commit `2e668455288ebc43b7356b2d9b0c537e24c409f4` (September 25, 2026), retrieved October 30, 2026. The two scripts last changed on July 3, 2026. Learn's Intune migration guide points to this repository for exporting and importing policies with Microsoft Graph ([Migration guide: Set up or move to Microsoft Intune](https://learn.microsoft.com/intune/fundamentals/setup-migration)), and says the scripts change your tenant, come as-is, and should be validated in a non-production tenant. It is MIT-licensed; `LICENSE` is the repository's license file.

**Why a copy, not only a link.** A link to `main` changes under you. This copy is the exact version the [developer workbook *Building the Attribute-Driven Migration*, Chapter 06](../../../docs/project-plans/developer-workbooks/attribute-driven-migration/06-group-policy-as-code.md) was written and tested against. `examples/group-policy-as-code/tests/MicrosoftSamples.Tests.ps1` runs both scripts, unmodified, against a fake Graph and pins what they do.

**How it stays honest.**

- `snapshot.json` records the upstream repository, path, commit, dates, license and the size and SHA-256 of every file here. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to the upstream folder (`mggraph-intune-samples-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the files from that commit, regenerate `snapshot.json`, rerun `MicrosoftSamples.Tests.ps1` and the Chapter 06 labs, and open a pull request. Never edit the files here; changes the program needs go in `examples/group-policy-as-code`.

**What was copied.** `SettingsCatalog/` (the export script, the import script and the folder's readme) and the repository's `LICENSE`. Nothing else: the other sample folders are listed in `snapshot.json` under `not_copied`.

These files keep their upstream bytes, line endings included (the export script uses CRLF, the import script LF), so the hashes match the upstream commit.
