# Verification — Chapter 07, Machine Configuration Packages

New material; it replaces no workbook page. Code: `examples/machine-configuration` (new): `McPipeline.psm1`, `Invoke-McBuild.ps1`, one configuration, a release registry, `RequiredModules.psd1`, and two Pester files. Pinned sample: `examples/third_party/guest-configuration-samples` (new), the README and `.example-project` from Azure/azure-policy `samples/GuestConfiguration/package-samples` at commit `ca85d6182e5a855bcdd1462421d5a1305c14c1df` (August 4, 2021; MIT). Every file's git blob hash matched the upstream tree at that commit before `snapshot.json` was written. Two source-watch feeds were added: `guest-configuration-samples-commits` and `guestconfiguration-module-commits`.

Test results on October 30, 2026, Windows 11, PowerShell 7.6.9, Pester 5.5.0: 64 passed with the pinned modules saved to a scratch folder (GuestConfiguration 4.12.0, PSDesiredStateConfiguration 2.0.7, PSDscResources 2.12.0.0), and 48 passed with 16 skipped without them. `scripts/tests/test_third_party_snapshots.py`: 2 passed, covering both snapshots. The modules were saved with `Save-Module` to a scratch folder, not installed. The machine configuration agent wasn't installed and nothing was run elevated: `Get-GuestConfigurationPackageComplianceStatus` and `Start-GuestConfigurationPackageRemediation` are left to Lab 2 on a disposable server, as the chapter says.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: the machine configuration overview; how to develop a custom package (overview and steps 1 to 6: set up, create, test, publish, access, sign); create policy definitions; remediation options; assignments; network requirements; Connected Machine agent network requirements; Windows Server Management enabled by Azure Arc.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Package, definition, guest assignment model; resource type `Microsoft.GuestConfiguration/guestConfigurationAssignments` | Where machine configuration sits | verified | Learn, overview; assignments |
| 2 | Up to 50 guest assignments per machine | Where it sits; Verified facts | verified | Learn, overview |
| 3 | Assignment types Audit, ApplyAndMonitor, ApplyAndAutoCorrect; case sensitive; behavior of each | Where it sits; Verified facts | verified | Learn, remediation options |
| 4 | Custom audit-and-apply packages GA; custom AINE/DINE definitions GA; extension 1.26.24 / Arc agent 1.10.0 for apply | Where it sits; Verified facts | verified | Learn, develop overview; create policy definition |
| 5 | Procedure table: cmdlets per step and their outputs | What Learn gives you | verified | Learn, steps 1–6 and create policy definition |
| 6 | PowerShell 7.1.3 (Windows) / 7.2.4 (Ubuntu 20+); PSDesiredStateConfiguration 2.0.7 Windows, 3.0.0 prerelease Linux | Procedure table; Verified facts | verified | Learn, set up; create package |
| 7 | No secrets in packages; 100 MB uncompressed limit | What Learn gives you; Verified facts | verified | Learn, develop overview; create package |
| 8 | Release: new package name with version, same PolicyId, higher version, cmdlet recomputes contentHash; URI-only change is rejected | What Learn gives you | verified | Learn, create policy definition, Policy lifecycle |
| 9 | Learn's overview lists the sample resource modules in Azure/azure-policy | The pinned sample | verified | Learn, overview, "Machine configuration samples" |
| 10 | GuestConfiguration 4.12.0 published June 22, 2026 | The pinned sample | verified (PowerShell Gallery, not Learn; `Find-Module`) | PowerShell Gallery |
| 11 | Sample's `createPackage.ps1` calls `Test-GuestConfigurationPackage`, absent from 4.12.0; uses `:` as separator; sample still packages | The pinned sample | verified by running; pinned in `LearnBaseline.Tests.ps1` | local run |
| 12 | Compiled MOF holds user, host, date and absolute `SourceInfo` paths | What it leaves to you; Lab 1 | verified by running; pinned in tests | local run |
| 13 | Compile writes properties in a different order each run | What it leaves to you | verified by running (two compiles differ; fixtures `compiled-a.mof` and `compiled-b.mof`) | local run |
| 14 | `New-GuestConfigurationPackage` writes a different `.zip` each run from the same MOF | What it leaves to you; Lab 1 | verified by running; pinned in tests | local run |
| 15 | Learn: generate a GUID for a new definition, reuse it for updates | What it leaves to you | verified | Learn, create policy definition |
| 16 | Generated definition's `IncludeArcMachines` defaults to `"false"` | What it leaves to you; Dangers | verified by running; pinned in tests | local run (4.12.0 output) |
| 17 | Learn's SAS example lasts three years | What it leaves to you; Dangers | verified | Learn, publish; access |
| 18 | Definition file names `<package>_AuditIfNotExists.json` / `_DeployIfNotExists.json` differ from Learn's | What it leaves to you | verified by running; differs from Learn (recorded in research-gaps.md) | local run; Learn, create policy definition |
| 19 | `-Tag` takes one hashtable; array fails to bind | What it leaves to you | verified by running; differs from Learn (research-gaps.md) | local run |
| 20 | 4.12.0 package holds only the resource module, not GuestConfiguration or DscNativeResources | What it leaves to you | verified by running; differs from Learn (research-gaps.md) | local run; Learn, create package |
| 21 | Cleaned MOF parses with DSC's deserializer to the same resources | The code; Clean the MOF | verified by running (`DscClassCache.ImportInstances`); pinned in tests | local run |
| 22 | Microsoft's sample MOF uses `::line::column::resource` SourceInfo and no host data | Clean the MOF; Lab 1 | verified (pinned file; test) | pinned sample |
| 23 | System-assigned identity works for Arc; user-assigned doesn't and needs `-ExcludeArcMachines`; Storage Blob Data Reader; anonymous blob access disabled | Release registry; Lab 2; Verified facts | verified | Learn, create policy definition; access |
| 24 | `contentHash` appears four times in an enforcing definition | Check the definition | verified (fixture `deploy.json`: metadata plus three deployment resources) | local run |
| 25 | Resource Policy Contributor recommended for `New-AzPolicyDefinition` | Procedure; Lab 2; Verified facts | verified | Learn, create policy definition |
| 26 | Local testing installs the agent under `C:\ProgramData\GuestConfig\bin`, needs elevation; remediation changes the local machine | Lab 2 | verified | Learn, test |
| 27 | `*.guestconfiguration.azure.us` for Arc in Azure Government; endpoints for US Gov Arizona, Texas, Virginia | Lab 2; Verified facts | verified; DoD not listed (research-gaps.md row 6) | Learn, network requirements; Arc network requirements |
| 28 | Deleting a policy assignment deletes its guest assignment; removing a definition from an initiative leaves them | Lab 2; Dangers | verified | Learn, assignments |
| 29 | Signing: Protect cmdlet, Trusted Publishers / Linux path, `GuestConfigPolicyCertificateValidation` tag; tagged machines allow only signed content | Verified facts; Dangers | verified | Learn, sign |
| 30 | `CustomGuestConfigurationSetPolicy` = `disable` turns off remediation of custom content | Verified facts | verified | Learn, remediation options |
| 31 | Cost on Arc: included with SA/subscription after attestation or pay-as-you-go; otherwise purchased | Verified facts | verified | Learn, Windows Server Management enabled by Azure Arc |
| 32 | 4.12.0 refuses an apply mode for an audit-only package | Dangers | verified by running; pinned in tests | local run |
| 33 | One owning tool per setting; `ConfigOwner` = `ArcMachineConfiguration`; VK-ARC-07 | Where it sits; registry; Dangers | workbook cross-reference | Arc track guide; Ansible guide; `examples/validation-kit` |
| 34 | SAS longer than 90 days refused; managed identity by default | What it leaves to you; Dangers | restated-as-design (labeled) | — |
| 35 | Generate the definition from the file you publish, signed or not | Dangers | restated-as-design (labeled) | — |
| 36 | Lab 1 steps and outputs (hashes differ; three rows from Test-McPackage; exit codes 0, 2, 1, 2; MOF hash `ecffd795…`) | Lab 1 | verified by running the commands as written | local run, October 30, 2026 |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| `research-gaps.md` row 1 (GuestConfiguration cmdlets and parameters) | What Learn gives you; Verified facts; Lab 2 | `FrequencyMinutes` and `FilesToInclude` not used by the example; linked through Learn |
| Arc track guide, `ConfigOwner` tag and the two-tools danger | Release registry; MC-POL-08; Dangers | — |
| `examples/validation-kit` VK-ARC-03 and VK-ARC-07 (guest assignments through Resource Graph) | Lab 2 step 7; Dangers | The checks are unchanged; this chapter adds the build-time half |
| Book index outline row 07 ("signed with `Protect-GuestConfigurationPackage` ... all from a pipeline") | The chapter; the README's known limits | Signing follows Learn's procedure and isn't wrapped by the example; the outline row now says so |
