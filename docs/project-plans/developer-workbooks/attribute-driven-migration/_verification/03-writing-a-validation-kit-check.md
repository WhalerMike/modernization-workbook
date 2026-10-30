# Verification — Chapter 03, Writing a Validation Kit Check

New material; it replaces no workbook page. Code: `examples/validation-kit`, extended in this change with VK-SYNC-02 (`Invoke-VkSync02` in `Checks/SYNC.ps1`), its catalog entry, two options (`OnPremSyncExportFile`, `MatchWindowOpenUntil`), pass and fail fixtures (`onPremisesSynchronization.json`), five new tests plus the table-driven case, and README rows. Test results on October 30, 2026: Pester 5.5.0 on PowerShell 7, 274 passed, 0 failed. Rerun on October 30, 2026 after research gap 24 added the tenant ID to `ValidationManifest.json` (`Resolve-VkRunTenant` in `Private/Core.ps1`, `-TenantId` passed into the run context, a `Get-AzContext` stub in `TestHelpers.ps1`, six tests in `Runner.Tests.ps1`): 280 passed, 0 failed. Windows PowerShell 5.1 was not run: this machine has only Pester 3.4 for that edition.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: Get onPremisesDirectorySynchronization; Configure Microsoft Entra Connect for an existing tenant (block soft match, block hard match, hard match security protections); Understanding errors during Microsoft Entra synchronization (InvalidHardMatch); Set-EntraDirSyncFeature; group: evaluateDynamicMembership (beta); Best practices for working with Microsoft Graph; Microsoft Graph throttling guidance; Microsoft Graph national cloud deployments.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Soft match on primary SMTP, then UPN when soft match on UPN is on; hard match on source anchor vs `onPremisesImmutableId` | Why this check | verified | Learn, existing tenant page; Set-EntraDirSyncFeature (EnableSoftMatchOnUpn) |
| 2 | Microsoft advises blocking soft match and hard match takeover except during a matching procedure | Why this check | verified | Learn, existing tenant page (block hard match; block soft match; note) |
| 3 | From July 1, 2026, hard match blocked for privileged, privileged-eligible or already-mapped targets; soft match unchanged | Why this check | verified | Learn, existing tenant page, "Hard match security protections" |
| 4 | `GET /directory/onPremisesSynchronization`: least privileged `OnPremDirectorySynchronization.Read.All`, delegated only; application not supported | The catalog entry; Verified facts | verified | Learn, Get onPremisesDirectorySynchronization |
| 5 | Global Administrator is the only supported role for that read | The catalog entry; Verified facts | verified | Same page, Important note |
| 6 | Available in global, US Government L4 and L5 | Verified facts | verified | Same page, national cloud table |
| 7 | Response shape (`features.blockSoftMatchEnabled`, `blockCloudObjectTakeoverThroughHardMatchEnabled`, `softMatchOnUpnEnabled`) | Fixtures and tests | verified | Same page, example response |
| 8 | Soft match on UPN can't be disabled once enabled | Rows and outcome | verified | Learn, Set-EntraDirSyncFeature |
| 9 | Remediation commands (`Update-MgDirectoryOnPremiseSynchronization`, scope `OnPremDirectorySynchronization.ReadWrite.All`) | The safety tests; Verified facts | verified | Learn, existing tenant page (code blocks) |
| 10 | `Set-EntraDirSyncFeature -Features 'BlockSoftMatch' -Enable $true`; Global Administrator | The safety tests | verified | Learn, Set-EntraDirSyncFeature, Example 2 and description |
| 11 | evaluateDynamicMembership: beta; delegated only; permissions; L4 and L5 | Verified facts | verified | Learn, group: evaluateDynamicMembership |
| 12 | Follow `@odata.nextLink` as an opaque URL until absent | Verified facts | verified | Learn, Graph best practices, Pagination |
| 13 | `Retry-After` on 429; exponential backoff without it | Verified facts | verified | Learn, throttling guidance |
| 14 | Graph hosts per cloud | Verified facts | verified | Learn, national cloud deployments |
| 15 | Export-first for checks whose read needs a privileged role; no standing privileged identity for checks | The catalog entry | restated-as-design (labeled) | — |
| 16 | Default every control read to the unsafe answer | Rows and outcome | restated-as-design (labeled) | — |
| 17 | Kit behavior: `Invoke-VkCheckBody` turns exceptions into Error; safety tests; one POST; beta allow-list; nextLink host check | The function; The safety tests | verified against the code | `Private/Core.ps1`, `tests/powershell/Safety.Tests.ps1`, kit README |
| 18 | Lab outputs (Fail, count 2, one Info row, Warn in window, Input evidence, scope printed) | Lab 1 | verified by running the code | local run, October 30, 2026 |
| 19 | `-SkipConnect` stops the runner signing in for a live run | Lab 2 | verified against the code | `Invoke-ValidationKit.ps1`, line 74 |
| 20 | The run manifest records `TenantId` and `TenantIdSource`: Graph session (the token's `tid` claim), else Azure session, else `-TenantId`; fixture runs record `tenant.json`'s placeholder; a session in another tenant than a `-TenantId` GUID stops the run before any file is written | Lab 2 (back-out step) | verified against the code and pinned in `Runner.Tests.ps1` (6 tests); research-gaps.md row 24 | `Private/Core.ps1` (`Resolve-VkRunTenant`, `Write-VkManifest`); Learn, access token claims reference (`tid`) |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| `examples/validation-kit/README.md` (result shape, permissions, inputs, read-only enforcement, tests) | The anatomy of a check; The safety tests | The full permission table stays in the README; the chapter links it |
| First outline's plan to walk through an existing check | Replaced by building VK-SYNC-02 | A new check shows every step, and its privileged read teaches the least-privilege rule |
