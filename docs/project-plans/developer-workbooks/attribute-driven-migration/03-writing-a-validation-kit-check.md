---
title: "Chapter 03 — Writing a Validation Kit Check"
description: "How to add a check to the read-only validation kit, built end to end on a new check, VK-SYNC-02 (soft match and hard match takeover blocking): the catalog entry, the data read, findings and outcome, pass and fail fixtures, Pester tests, the GET-only safety rule, and what to do when even a read needs Global Administrator, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-attribute-driven-migration
part: How
series-order: 3
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
aliases:
  - /docs/books/b19-developer-workbook/03-writing-a-validation-kit-check.html
review-status: approved
reviewed-sha256: 1cb918f50d3ebb8f34d7701b20257897d0f15a8f3a0b997bb9e72f542505d88d
last-reviewed: 2026-10-31
---
# Chapter 03 — Writing a Validation Kit Check

*A check is only evidence if it can't change what it measures, can't pass when it failed to look, and asks for no more access than the question needs.*

::: {.callout-note}
## In this chapter
The anatomy of a validation kit check, built end to end on a new one, VK-SYNC-02, which reports whether the tenant blocks soft match and cloud object takeover through hard match. You add a catalog entry, read the data through the kit's one data path, turn it into findings, write pass and fail fixtures and Pester tests, and pass the kit's safety tests. The check also shows what to do when Microsoft's only supported role for a read is Global Administrator. Lab 1 runs on fixtures; Lab 2 uses an export from a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can add a check to `examples/validation-kit` that the kit's own tests accept: named after its ID, catalogued with its permission and role, tested on fixtures in both directions, read-only by construction, and honest about what it couldn't read.

**Audience.** Developers and engineers who extend the kit, and ISSOs who want to know what a check's result can and can't be trusted to mean. You should read PowerShell and know Pester's `Describe` and `It`.

The kit is the executable form of the **Validate** step at each gate of the [implementation guide](../../../books/guides/attribute-driven-migration-implementation.md) and the three track guides. Its [README](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) lists every check, its permission and its Learn page. [Book 13, Chapter 07](../../../books/b13-governance/07-evidence-over-attestation.md) explains why the program wants evidence a machine produced over a statement someone signed.

## Why this check

Gate 3 of the implementation guide maps attributes through sync. Before a single AD user is synchronized into a tenant that already has cloud accounts, the sync engine has to decide which incoming object matches which cloud account. A *soft match* joins on the primary SMTP address, and on the UPN when soft match on UPN is turned on; a *hard match* joins on the source anchor against `onPremisesImmutableId`.[^c03-existing] [^c03-entraps] Either one, left open, lets an AD object take over a cloud account. Microsoft advises keeping soft match blocked, and offers a feature to block cloud object takeover through hard match, and says to turn each off only while a matching procedure needs it and back on when it's done.[^c03-existing] From July 1, 2026, Entra ID also blocks a hard match on its own when the target cloud account holds or is eligible for a privileged role or already has `onPremisesObjectIdentifier` set; soft match stays governed by the blocking feature alone.[^c03-existing]

So the question is simple: are both blocks on, and if not, is there an approved window that says why? That makes a good first check. It also hides a lesson, which comes next.

## The anatomy of a check

Every check has the same five parts. The table names them; the sections below build each one for VK-SYNC-02.

| Part | Where | What it does |
|---|---|---|
| Catalog entry | `Private/Catalog.ps1` | ID, track, title, source, Graph permissions, delegated role, release stage, Learn pages; marks optional and preview checks |
| Function | `Checks/<TRACK>.ps1` | `Invoke-Vk<Track><NN>`, named from the ID; wraps its body in `Invoke-VkCheckBody` |
| Data read | `Get-VkData`, `Read-VkInputJson`, `Read-VkInputCsv` | One path for fixtures, Graph, Resource Graph, AD and input files; logs every read as evidence |
| Rows and outcome | `ConvertTo-VkFinding`, `Get-VkOutcome`, `Get-VkNotApplicable` | Detail rows with one shape; status from the rows |
| Tests and fixtures | `tests/fixtures/pass`, `tests/fixtures/fail`, `tests/powershell` | The check must pass clean data and fail planted problems with an exact count |

### The catalog entry, and the lesson in it

The README's permissions table mirrors the catalog, and a test fails if any catalogued check is missing from it. The entry for VK-SYNC-02:

```powershell
@{ Id = 'VK-SYNC-02'; Track = 'SYNC'; Title = 'Optional: soft match and hard match takeover not blocked outside an approved matching window'
    Source = 'Input (export), or Graph delegated'; GraphPermissions = @('OnPremDirectorySynchronization.Read.All')
    DelegatedRole = 'Global Administrator (the only role Learn lists; delegated only, no application permission)'; AzureRole = ''; Stage = 'v1.0'
    Optional = $true; Learn = @($VkLearn.OnPremSync, $VkLearn.MatchBlock) }
```

Here is the lesson. The read is `GET /directory/onPremisesSynchronization`. Its least-privileged permission is `OnPremDirectorySynchronization.Read.All`, which looks harmless. But Learn lists no application permission for it at all, and for delegated access says Global Administrator is the only supported role.[^c03-onpremsync] A read-only check, run live, would need the most powerful role in the tenant.

The kit's rule is that a check asks for the least privilege the question needs, and GET-only is necessary but not sufficient. So VK-SYNC-02 does three things differently from a typical check:

- **It is optional.** `Optional = $true` keeps it out of a default run, the same way the preview check VK-NPI-09 is kept out. It runs only when named with `-CheckId`.
- **It prefers an export.** A Global Administrator who is already signed in for other reasons saves the GET's response to a file; the kit reads the file and never needs the role. The live Graph read is the fallback, not the plan.
- **It says so.** The catalog's `DelegatedRole` names the role and the reason, so `Get-VkCheckCatalog` and the README tell an ISSO what running it live would require before anyone does.

*Design guidance:* when a read's only supported role is a privileged one, make the check consume an export by default and record in the evidence which path it took. Don't build a standing identity with that role so a check can run on a schedule.

### The function

```powershell
function Invoke-VkSync02 {
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-SYNC-02' $Context {
        param($Context)
        $export = Read-VkInputJson -Context $Context -Option 'OnPremSyncExportFile'
        if ($null -ne $export) {
            $items = @($export)
            if ($export.PSObject.Properties['value']) { $items = @($export.value) }
        } else {
            $items = @(Get-VkData -Context $Context -Name 'onPremisesSynchronization' -Uri $script:VkOnPremSyncUri)
        }
        $items = @($items | Where-Object { $null -ne $_ })
        if ($items.Count -eq 0) { return Get-VkNotApplicable 'The tenant has no on-premises directory synchronization object' }
        # ... rows, below ...
    }
}
```

`Invoke-VkCheckBody` does the work every check needs and none should repeat: it looks up the catalog entry, clears the query log, runs the body, catches any exception and turns it into `Status = 'Error'`, and wraps the outcome with the evidence block (mode, source, every query with its time, permissions, role, stage, as-of and collection time). Because of that wrapper, a read that throws can never come back as `Pass`. Don't catch exceptions inside the body to make a check "more robust"; that is how a check passes while blind.

`Get-VkData` is the only way a check reads tenant data. In fixture mode it reads `<fixture folder>\onPremisesSynchronization.json`; live, it calls `Invoke-VkGraphGet` with the URI. Both are logged the same way, so the evidence shows `fixture:onPremisesSynchronization.json <= /v1.0/directory/onPremisesSynchronization` in a fixture run and the URI in a live one. The export is read by `Read-VkInputJson`, which logs it as `Input`. A reviewer can tell from the evidence alone which of the three paths a result came from.

### Rows and outcome

```powershell
$until = "$($Context.Options['MatchWindowOpenUntil'])".Trim()
$windowOpen = $false
if ($until) { $windowOpen = (ConvertTo-VkUtc $until).UtcDateTime.Date -ge $Context.AsOf.UtcDateTime.Date }
$severity = if ($windowOpen) { 'Warn' } else { 'Finding' }
foreach ($o in $items) {
    $f = Get-VkValue $o 'features'
    if ((Get-VkValue $f 'blockSoftMatchEnabled' $false) -ne $true) {
        ConvertTo-VkFinding -Severity $severity -Object 'onPremisesSynchronization' -ObjectId "$($o.id)" `
            -Issue 'Soft match is not blocked' -Data ([ordered]@{ Feature = 'blockSoftMatchEnabled'; Value = 'false' })
    }
    # the same for blockCloudObjectTakeoverThroughHardMatchEnabled, and an Info row for softMatchOnUpnEnabled
}
Get-VkOutcome -Rows @($rows) -Message $msg
```

Three severities, three meanings. A **Finding** fails the check. A **Warn** needs a person to look but isn't a failure: here, a block that is off inside an approved matching window, which `MatchWindowOpenUntil` records as the window's last day. The day after, the same state is a Finding again, without anyone editing anything. An **Info** row gives context and isn't counted: soft match on UPN, which Microsoft's Entra PowerShell documentation says can't be turned off once it's enabled.[^c03-entraps] `Get-VkOutcome` derives the status from the rows (Fail if any Finding, else Warn if any Warn, else Pass), and the count is Findings plus Warns.

A missing value is read as off. `Get-VkValue $f 'blockSoftMatchEnabled' $false` returns `$false` when the property is absent, so a response shape the kit doesn't expect produces a Finding, not a silent Pass. *Design guidance:* default every "is the control on" read to the unsafe answer.

`NotApplicable` is for a tenant with nothing to check, here no synchronization object at all, and for a missing input. It is never used for a failed read.

### Fixtures and tests

The fixtures are a fictional tenant, `contoso.example`, in two states. `tests/fixtures/pass/onPremisesSynchronization.json` has both blocks on; `tests/fixtures/fail/onPremisesSynchronization.json` has both off, and soft match on UPN on. Each is the shape Learn's example response shows, cut to the properties the check reads plus one it doesn't, so a test would catch a check that reads the wrong one.[^c03-onpremsync]

Adding the check to the table-driven test in `Checks.Tests.ps1` is one line:

```powershell
@{ Id = 'VK-SYNC-02'; FailStatus = 'Fail'; FailCount = 2 }
```

That line buys four tests: the pass fixture gives `Pass` with a count of 0; the fail fixture gives `Fail` with exactly 2 rows that aren't Info; the result has the full shape with evidence; every detail row has the same columns. Then a `Describe` block for what is particular to this check:

- it isn't selected by default, and its catalog entry names Global Administrator;
- soft match on UPN is an Info row, not a finding;
- inside an open window the status is `Warn` and the message names the date; the day after, it's `Fail`;
- an export in `-InputPath` is read instead of Graph, and the evidence shows `Input`;
- a tenant with no synchronization object is `NotApplicable`.

The catalog test that lists every check ID in order also gains `VK-SYNC-02`, and the README gains its row. With those, the kit's suite was 274 tests on PowerShell 7, all passing. Six more came with the tenant ID in the run manifest (below), for 280.

### The safety tests

`Safety.Tests.ps1` parses every script in the kit and fails the build on any state-changing command: write verbs, `Invoke-RestMethod`, `Invoke-WebRequest`, native programs, file redirection, and more. Every `Invoke-MgGraphRequest` must carry a literal `-Method GET`, with one exception pinned by a test to one function: the beta `evaluateDynamicMembership` action that VK-DG-03 uses, which evaluates a rule and changes nothing. Graph beta paths are limited to a declared list. A `nextLink` that points at a host other than the cloud's own Graph host is refused, so a token never leaves.

VK-SYNC-02 passes those tests without any change to them, because it reads only through `Get-VkData` and `Read-VkInputJson`. That's the point of the single data path: a new check inherits the safety properties instead of re-proving them. If your check seems to need its own HTTP call, it doesn't; add what it needs to the data path, where the safety tests already look.

The remediation is a write, so it stays out of the kit. Learn's command to block soft match is:[^c03-existing]

```powershell
Connect-MgGraph -Scopes "OnPremDirectorySynchronization.ReadWrite.All"
$OnPremSync = Get-MgDirectoryOnPremiseSynchronization
$OnPremSync.Features.BlockSoftMatchEnabled = $true
Update-MgDirectoryOnPremiseSynchronization -OnPremisesDirectorySynchronizationId $OnPremSync.Id -Features $OnPremSync.Features
```

and the same with `BlockCloudObjectTakeoverThroughHardMatchEnabled` for hard match. The Entra PowerShell equivalent is `Set-EntraDirSyncFeature -Features 'BlockSoftMatch' -Enable $true`, which Learn says needs Global Administrator.[^c03-entraps] Put these in the change record that the finding opens, run by the identity team under change control, never in the check.

::: {.callout-warning}
## Illustrative code
The commands below run the kit as published in the repository. It is tested against fixtures, not against a production tenant. Review it, sign the module, and run it in a test tenant first.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7 and Pester 5.5 or later. Nothing here signs in.

1. Run the new check against the fail fixture:

   ```powershell
   cd examples/validation-kit
   Import-Module ./powershell/ValidationKit -Force
   $r = Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30)
   $r | Select-Object CheckId, Status, Count
   $r.Details | Format-Table Severity, Issue
   $r.Evidence.Queries | Format-Table Source, Query
   ```

   Expect `Fail`, a count of 2, two Finding rows and one Info row, and one query logged as `Graph (fixture)`.

2. Open the matching window and run again with `-Option @{ MatchWindowOpenUntil = '2026-10-31' }`. The status is `Warn`. Change `-AsOf` to `2026-11-01`: `Fail` again.

3. Feed it an export. Make a folder with `onprem-sync-export.json` containing `{"value":[{"id":"x","features":{"blockSoftMatchEnabled":true,"blockCloudObjectTakeoverThroughHardMatchEnabled":false}}]}` and pass it as `-InputPath`. One Finding, and the evidence shows `Input`.

4. See what a live run would ask for: `Get-VkRequiredScope -Checks (Get-VkCheckCatalog -CheckId VK-SYNC-02)` prints `OnPremDirectorySynchronization.Read.All`, and `(Get-VkCheckCatalog -CheckId VK-SYNC-02).DelegatedRole` names the role.

5. Confirm it isn't in a default run: `(Get-VkCheckCatalog).Id -contains 'VK-SYNC-02'` is `False`.

6. Run the whole kit's tests:

   ```text
   pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
   ```

7. Make it fail for the right reason. In your copy, change the check to read `blockSoftMatch` (a property that doesn't exist). The fail fixture still fails, but the pass fixture now fails too, because the missing value reads as off. That is the default-to-unsafe rule doing its job. Put it back.

**Expected result:** every test passes, and you've seen each of the check's four outcomes: Pass, Fail, Warn and NotApplicable.

## Lab 2: test tenant

Use a test tenant that has Microsoft Entra Connect or Cloud Sync configured. The export is the only step that needs Global Administrator; nothing in the kit runs with that role.

1. **Export.** A Global Administrator of the test tenant signs in and saves the response:

   ```powershell
   Connect-MgGraph -Scopes 'OnPremDirectorySynchronization.Read.All' -Environment Global   # USGov for GCC High
   Invoke-MgGraphRequest -Method GET -Uri '/v1.0/directory/onPremisesSynchronization' |
       ConvertTo-Json -Depth 10 | Set-Content -Path ./inputs/onprem-sync-export.json
   Disconnect-MgGraph
   ```

   Read the file before handing it over. It holds tenant configuration and no personal data.

2. **Run the check on the export** as any user, without signing in: `./Invoke-ValidationKit.ps1 -OutputPath ./out -CheckId VK-SYNC-02 -InputPath ./inputs -SkipConnect`. `-SkipConnect` stops the runner from signing in to Graph for a live run. Because the export is present, the check doesn't call Graph; the evidence in `Results/ValidationResults.json` shows `Input`.

3. **Compare with the source.** Check the result against the `features` block in the export itself, line by line. If a property the check reads is missing or named differently, the response shape differs from Learn's example; fix the fixture and the check together.

4. **Back it out.** Delete the export when the run's evidence is stored; it isn't evidence by itself, the run's manifest is. The manifest, `ValidationManifest.json`, records the cloud and the tenant the run read: `TenantId` comes from the Graph session, which takes it from the token's `tid` claim, and a session in another tenant than the `-TenantId` you gave stops the run before it writes anything. [Chapter 09](09-drift-pipelines-and-evidence.md)'s comparator refuses to compare two runs of different tenants.

## Verified facts

| Call | Endpoint | Least-privileged permission | Role | US Government clouds | Stage |
|---|---|---|---|---|---|
| Read sync features | `GET /directory/onPremisesSynchronization` | `OnPremDirectorySynchronization.Read.All`, delegated only; no application permission[^c03-onpremsync] | Global Administrator, the only supported role[^c03-onpremsync] | Global, US Government L4 and L5[^c03-onpremsync] | v1.0 |
| Block soft or hard match (remediation, not in the kit) | `Update-MgDirectoryOnPremiseSynchronization` with `BlockSoftMatchEnabled` or `BlockCloudObjectTakeoverThroughHardMatchEnabled` | `OnPremDirectorySynchronization.ReadWrite.All`[^c03-existing] | Global Administrator (Entra PowerShell)[^c03-entraps] | as above | v1.0 |
| Rule evaluation (VK-DG-03, the kit's one POST) | `POST /groups/{id}/evaluateDynamicMembership`, `POST /groups/evaluateDynamicMembership` | `Group.Read.All` and `User.Read.All` (or `Device.Read.All`), delegated only[^c03-evaluate] | — | Global, US Government L4 and L5[^c03-evaluate] | **beta** |
| Paging | follow `@odata.nextLink` as an opaque URL until it is absent[^c03-paging] | — | — | — | — |
| Throttling | on `429`, wait `Retry-After`, then retry; back off exponentially if the header is missing[^c03-throttling] | — | — | — | — |
| Graph host per cloud | `graph.microsoft.com` (worldwide and Microsoft 365 GCC), `graph.microsoft.us` (GCC High), `dod-graph.microsoft.us` (DoD)[^c03-deployments] | — | — | — | — |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A read-only check that needs a privileged role | Someone creates a standing Global Administrator identity so a check can run on a schedule | The check is optional, prefers an export, and names the role in its catalog entry |
| A failed read reported as Pass | A tenant the kit couldn't see looks compliant | `Invoke-VkCheckBody` turns any exception into `Error`; don't catch inside the body |
| A missing property read as "on" | A response-shape change hides an open control | Read every control with the unsafe default |
| A check with its own HTTP call | A write slips past review, or a token goes to the wrong host | One data path; the safety tests parse the kit and fail on anything else |
| A fixture that matches the code, not the service | Tests pass while the live shape differs | Fixtures copy Learn's example response shape; Lab 2 compares with the tenant |
| A Warn that never ends | An approved window becomes permanent | `MatchWindowOpenUntil` is a date; the day after, it's a Finding |
| A check missing from the README | The permission table lies to the ISSO | A test fails when a catalogued check has no README row |

## Checklist

- [ ] The check ID, function name and track agree (`VK-SYNC-02`, `Invoke-VkSync02`, `SYNC`).
- [ ] The catalog entry names the least-privileged permission and the delegated role from the Learn page, and links that page.
- [ ] A check whose read needs a privileged role is optional and reads an export by default.
- [ ] The body reads only through `Get-VkData`, `Read-VkInputJson` or `Read-VkInputCsv`.
- [ ] No `try`/`catch` in the body hides a failed read.
- [ ] Every control is read with the unsafe default.
- [ ] Pass and fail fixtures exist, in Learn's response shape, and the table-driven test has the exact fail count.
- [ ] Tests cover each status the check can return.
- [ ] The README's permission table, notes and gate map include the check.
- [ ] The safety tests pass unchanged.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 02 — Graph Clients for the Government Clouds](02-graph-clients-for-government-clouds.md) · [Workbook index](index.md) · [Next: Chapter 04 — Dynamic Rules as Code →](04-dynamic-rules-as-code.md)
:::

[^c03-existing]: Microsoft Learn, "Configure Microsoft Entra Connect for an existing tenant," <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-install-existing-tenant> (accessed Oct 30, 2026).
[^c03-onpremsync]: Microsoft Learn, "Get onPremisesDirectorySynchronization," <https://learn.microsoft.com/graph/api/onpremisesdirectorysynchronization-get?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^c03-entraps]: Microsoft Learn, "Set-EntraDirSyncFeature," <https://learn.microsoft.com/powershell/module/microsoft.entra.directorymanagement/set-entradirsyncfeature?view=entra-powershell> (accessed Oct 30, 2026).
[^c03-evaluate]: Microsoft Learn, "group: evaluateDynamicMembership," <https://learn.microsoft.com/graph/api/group-evaluatedynamicmembership?view=graph-rest-beta> (accessed Oct 30, 2026).
[^c03-paging]: Microsoft Learn, "Best practices for working with Microsoft Graph," <https://learn.microsoft.com/graph/best-practices-concept> (accessed Oct 30, 2026).
[^c03-throttling]: Microsoft Learn, "Microsoft Graph throttling guidance," <https://learn.microsoft.com/graph/throttling> (accessed Oct 30, 2026).
[^c03-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
