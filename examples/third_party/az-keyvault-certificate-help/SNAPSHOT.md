# Az.KeyVault certificate cmdlets: a pinned copy of Microsoft's examples

This folder is an unmodified copy of two Az.KeyVault help pages from [Azure/azure-powershell](https://github.com/Azure/azure-powershell/tree/3c18cdad2344172de6c9c9b08cb030cf20432dbc/src/KeyVault/KeyVault/help) at commit `3c18cdad2344172de6c9c9b08cb030cf20432dbc` (October 29, 2026), retrieved October 30, 2026: [Add-AzKeyVaultCertificate](https://learn.microsoft.com/powershell/module/az.keyvault/add-azkeyvaultcertificate) and [Set-AzKeyVaultCertificatePolicy](https://learn.microsoft.com/powershell/module/az.keyvault/set-azkeyvaultcertificatepolicy). Learn's reference pages are generated from these files. Example 1 of each creates a certificate from a policy and sets a certificate policy. `LICENSE` is the repository's `LICENSE.txt`, the Microsoft Software License Terms for Microsoft Azure PowerShell.

**Why these, and not the tutorial.** Learn's [Configure certificate autorotation in Key Vault](https://learn.microsoft.com/azure/key-vault/certificates/tutorial-rotate-certificates) is the procedure the chapter follows, but its source left the public MicrosoftDocs/azure-docs repository in August 2024 and isn't published elsewhere, so it can't be pinned. These examples are the closest public Microsoft source for the same steps in PowerShell. `examples/non-person-identity/tests/CredentialPolicySampleHarness.ps1` runs their command lines, unmodified, against stand-ins for the cmdlets that call Chapter 04's fake Key Vault. Nothing is installed and nothing signs in.

**How it stays honest.**

- `snapshot.json` records the upstream repository, paths, commit, dates, license and the size and SHA-256 of every file here. Each file's git blob hash was checked against the upstream tree at that commit before the manifest was written. `scripts/tests/test_third_party_snapshots.py` fails if any file is changed, added or removed.
- The weekly source watch follows commits to each upstream file (`az-keyvault-add-certificate-help-commits` and `az-keyvault-set-certificate-policy-help-commits` in `data/source-watch/feeds.json`) and reports each one in its issue under DW (developer workbooks).
- To move to a newer upstream commit: review the upstream change, copy the files from that commit, regenerate `snapshot.json`, rerun `examples/non-person-identity/tests/NpiCredentialPolicy.Tests.ps1` and the Chapter 04 labs, and open a pull request. Never edit the files here.

These files keep their upstream bytes, line endings included, so the hashes match the upstream commit.
