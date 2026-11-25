---
title: "Chapter 09 — Closure, Drift and Evidence"
description: "Book 06 Chapters 20 and 21 and Runbook R09 as code: each audit run projected onto the five closure conditions, field by field, with the external fields left external and the exception registry's break-glass group honoured, and two runs compared for drift, with an instance that falls out of Arc Category 1 reported when both runs' Arc snapshots are given, so the day-30 sysadmin login on SQLPRD06 is a finding and the excepted break-glass group isn't. Labs on the kit's day-1 and day-30 fixtures, and a weekly schedule against one test instance."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 9
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 09 — Closure, Drift and Evidence

*Closure is a record that keeps coming back clean, and drift is the run that doesn't.*

::: {.callout-note}
## In this chapter
The code behind [Book 06, Chapter 20](../../../books/b06-data-platform/20-the-closure-condition.md), [Chapter 21](../../../books/b06-data-platform/21-what-done-looks-like.md) and [Runbook R09](../../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md). You start with what Microsoft documents about the settings the conditions read. Then you read `Get-SqlClosureRecord`, which projects one audit run onto Chapter 20's field set, and `Compare-SqlAuditRun`, which compares two runs. Lab 1 runs both on the day-1 and day-30 fixtures. Lab 2 schedules the audit snapshot, the closure record and the drift check against one test instance, with removing the schedule as the back-out.
:::

## Goal and audience

**Goal.** By the end of this chapter you can produce, on a schedule, a per-instance closure record that shows which conditions hold, which don't and which wait on evidence from outside the audit, and a drift list that turns each regression into a task.

**Audience.** Developers who maintain the kit, DBAs who run the schedule, and the ISSO who keeps the records. You don't need an instance until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

`sys.server_principals` gives each login's type: `S` (SQL), `U` and `G` (Windows user and group), `E` and `X` (Entra user or application, and group), and `C` and `K` (certificate and key).[^sq09-principals] `SERVERPROPERTY('IsIntegratedSecurityOnly')` returns 1 when SQL logins are refused, and on SQL Server 2025 `IsExternalAuthenticationOnly` returns 1 when SQL authentication is disabled.[^sq09-serverproperty] That setting exists only on SQL Server 2025 on Windows enabled by Azure Arc; it leaves the instance accepting Entra and Windows authentication, keeps existing logins and sessions, and is reversed from the portal.[^sq09-disable] Changing the authentication mode needs a restart of the service.[^sq09-auth-mode] Connections made on the server itself always report `NTLM`, so a protocol check must look only at remote connections.[^sq09-local-ntlm] Entra authentication isn't supported on failover cluster instances.[^sq09-mi]

### What it leaves to you

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| A property per setting, a view per login | Closure is five conditions at once, not one setting | `Get-SqlClosureRecord`: eleven fields per instance, each `met`, `NOT MET` or `external` |
| Entra sign-ins and MFA live in Entra's logs | The audit can't see them | Those fields are `external`: the record points at them and doesn't copy them |
| Nothing marks a login as allowed | The break-glass group would fail condition 1 for ever | The exception registry: a login, an instance or `*`, an approver and an expiry |
| Each read is a point in time | A new `sysadmin` login between runs goes unseen | `Compare-SqlAuditRun`: drift between two runs, the registry applied, and Arc regression when both runs' Arc snapshots are given |

## The code

### The closure record

`Invoke-SqlClosure.ps1` reads one audit snapshot, the exception registry and, optionally, the Arc snapshot, and calls `Get-SqlClosureRecord`. "Usable" means enabled and holding `CONNECT SQL`; built-in principals (`NT SERVICE`, `NT AUTHORITY`, `BUILTIN`, `##…##`) and logins excepted for that instance and not expired are left out.

| Field | `met` when |
|---|---|
| 1 No usable Windows login | No usable type U or G |
| 2 SQL logins refused | `IsIntegratedSecurityOnly` = 1, and on SQL Server 2025 also `IsExternalAuthenticationOnly` = 1 |
| 2 No usable SQL login | No usable type S other than `sa` |
| 2 sa disabled and renamed | `sa` (SID `0x01`) is disabled and isn't named `sa` |
| 3 Only Entra logins remain | Every usable login is type E or X (or `sa`) |
| 3 No remote NTLM or Kerberos | No remote `NTLM` or `KERBEROS` sessions in the snapshot |
| 3 Entra sign-ins and audit | Always `external`: Entra sign-in logs and SQL Server Audit |
| 4 Arc agent connected, SQL extension deployed, Entra configured | From the Arc snapshot ([Chapter 03](03-arc-and-the-engines-identity.md)); `external` without it |
| 5 MFA for every human | Always `external`: sign-in logs and Conditional Access reports |

An instance with no `NOT MET` field is "ready for the assessor, with the external evidence". It is never "closed": the external fields still need their evidence, and the assessor decides.

On SQL Server 2025, condition 2's first field needs `IsExternalAuthenticationOnly` = 1 as well; a snapshot that doesn't report the property (null) is `NOT MET`, never assumed, as Book 06 requires the 1.

Two places where the record is narrower than [Chapter 20's field set](../../../books/b06-data-platform/20-the-closure-condition.md#the-closure-records-field-set): condition 3 checks login types but doesn't join them to the Entra inventory, and the protocol field reads one snapshot, not the whole validation period. Read those two by hand.

### Drift

`Compare-SqlAuditRun.ps1` compares a later run with an earlier one and returns a row for each regression: a new usable Windows or SQL login outside the registry, an Entra login removed, `sa` re-enabled, SQL authentication accepted again, remote NTLM back after none, or an instance not seen before. R09 also names Arc going offline. Given the Arc snapshot taken with each run (`-BeforeArcPath` and `-AfterArcPath`, both needed), the drift check settles each instance's Arc category in both and reports an instance that was Category 1 and no longer is as `Arc regressed`, with the new category and what's missing (for example "Category 1 to 2: Deploy Arc (Runbook R04): agent Disconnected"). Without both paths it doesn't read Arc, and the next closure record with the Arc snapshot is where that shows. Each row is a compliance finding: open a task for it. [Building Ticket-to-Machine, Chapter 04](../ticket-to-machine/04-drift-to-a-typed-task.md) turns a drift row into a typed task.

::: {.callout-important}
## Illustrative code
Lab 1 reads the kit's fictional day-1 and day-30 audits. Tested against fixtures, not a live instance.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/sql-server-identity`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Project day 30 onto the closure conditions
./Invoke-SqlClosure.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -ArcPath tests/fixtures/arc/arc.json -OutputPath out/closure

# Step 2: Read SQLPRD01's whole record
Import-Csv out/closure/closure.csv | Where-Object Instance -eq SQLPRD01 | Format-Table -AutoSize

# Step 3: Read the exception registry
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
(Read-SqlJson tests/fixtures/audit-day30/exceptions.json).exceptions | Format-Table instance, login, approvedBy, expires -AutoSize

# Step 4: See what the registry does
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$day30 = Read-SqlJson tests/fixtures/audit-day30/audit.json
Get-SqlClosureRecord -Audit $day30 -Exceptions @() | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Status -ne 'met' } | Format-Table -AutoSize

# Step 5: Compare day 1 with day 30
./Compare-SqlAuditRun.ps1 -BeforePath tests/fixtures/audit-day1/audit.json -AfterPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -OutputPath out/drift

# Step 6: Open the drift manifest
Get-Content out/drift/manifest.json

# Step 7: Run this chapter's tests, then remove the output
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 09*' -Output None -PassThru | Select-Object PassedCount, FailedCount
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Project day 30 onto the closure conditions.** SQLPRD01, migrated in Chapter 04, has nothing `NOT MET`:

   ```powershell
   ./Invoke-SqlClosure.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -ArcPath tests/fixtures/arc/arc.json -OutputPath out/closure
   ```

   ```text
   Instance Met NotMet External Record
   -------- --- ------ -------- ------
   SQLFCI04   2      7        2 open
   SQLPRD01   9      0        2 ready for the assessor, with the external evidence
   SQLPRD02   3      6        2 open
   SQLPRD06   5      4        2 open

   Conditions not met:

   Instance Condition                    Status
   -------- ---------                    ------
   SQLPRD02 1 No usable Windows login    NOT MET
   SQLPRD02 3 Only Entra logins remain   NOT MET
   SQLPRD02 3 No remote NTLM or Kerberos NOT MET
   SQLPRD02 4 Arc agent connected        NOT MET
   SQLPRD02 4 SQL extension deployed     NOT MET
   SQLPRD02 4 Entra configured           NOT MET
   SQLFCI04 1 No usable Windows login    NOT MET
   SQLFCI04 2 SQL logins refused         NOT MET
   SQLFCI04 2 sa disabled and renamed    NOT MET
   SQLFCI04 3 Only Entra logins remain   NOT MET
   SQLFCI04 4 Arc agent connected        NOT MET
   SQLFCI04 4 SQL extension deployed     NOT MET
   SQLFCI04 4 Entra configured           NOT MET
   SQLPRD06 1 No usable Windows login    NOT MET
   SQLPRD06 2 SQL logins refused         NOT MET
   SQLPRD06 3 Only Entra logins remain   NOT MET
   SQLPRD06 3 No remote NTLM or Kerberos NOT MET

   Wrote 2 files and manifest.json to out/closure
   Evidence for CLOSURE (Project the audit onto the five closure conditions): CA-7, CM-6, AC-2; KSI-MLA-EVC, KSI-SVC-ACM
   ```

   <!-- capture:begin 09-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/09-1.txt))](captures/09-1.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlClosure.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Exc… and what it printed"}

   <!-- capture:end -->

   SQLPRD06 runs SQL Server 2025 with `IsExternalAuthenticationOnly` = 0, so "SQL logins refused" is `NOT MET` although `IsIntegratedSecurityOnly` is 1. SQLFCI04 is a failover cluster instance and can't take Entra authentication as built; it needs a re-platform or a dated exception.

2. **Read SQLPRD01's whole record:**

   ```powershell
   Import-Csv out/closure/closure.csv | Where-Object Instance -eq SQLPRD01 | Format-Table -AutoSize
   ```

   ```text
   Instance Condition                    Status
   -------- ---------                    ------
   SQLPRD01 1 No usable Windows login    met
   SQLPRD01 2 SQL logins refused         met
   SQLPRD01 2 No usable SQL login        met
   SQLPRD01 2 sa disabled and renamed    met
   SQLPRD01 3 Only Entra logins remain   met
   SQLPRD01 3 No remote NTLM or Kerberos met
   SQLPRD01 3 Entra sign-ins and audit   external
   SQLPRD01 4 Arc agent connected        met
   SQLPRD01 4 SQL extension deployed     met
   SQLPRD01 4 Entra configured           met
   SQLPRD01 5 MFA for every human        external
   ```

   <!-- capture:begin 09-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/09-2.txt))](captures/09-2.png){.lightbox fig-alt="Terminal window showing Import-Csv out/closure/closure.csv | Where-Object Instance -eq SQLPRD01 | For… and what it printed"}

   <!-- capture:end -->

   The two `external` rows are evidence sets 2 and 5 of [Chapter 21](../../../books/b06-data-platform/21-what-done-looks-like.md): Entra sign-in logs and the Conditional Access report.

3. **Read the exception registry.** The break-glass group is excepted on every instance with no expiry; the vendor login has a date:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   (Read-SqlJson tests/fixtures/audit-day30/exceptions.json).exceptions | Format-Table instance, login, approvedBy, expires -AutoSize
   ```

   ```text
   instance login                  approvedBy           expires
   -------- -----                  ----------           -------
   *        CONTOSO\SQL-BreakGlass Authorizing official
   SQLFCI04 vendorhr_app           ISSO                 2027-06-30
   ```

   <!-- capture:begin 09-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/09-3.txt))](captures/09-3.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

4. **See what the registry does.** Without it, SQLPRD01's enabled break-glass group fails conditions 1 and 3; without the Arc snapshot, condition 4 is external:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   $day30 = Read-SqlJson tests/fixtures/audit-day30/audit.json
   Get-SqlClosureRecord -Audit $day30 -Exceptions @() | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Status -ne 'met' } | Format-Table -AutoSize
   ```

   ```text
   Instance Condition                  Status
   -------- ---------                  ------
   SQLPRD01 1 No usable Windows login  NOT MET
   SQLPRD01 3 Only Entra logins remain NOT MET
   SQLPRD01 3 Entra sign-ins and audit external
   SQLPRD01 4 Arc agent connected      external
   SQLPRD01 4 SQL extension deployed   external
   SQLPRD01 4 Entra configured         external
   SQLPRD01 5 MFA for every human      external
   ```

   <!-- capture:begin 09-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/09-4.txt))](captures/09-4.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

5. **Compare day 1 with day 30.** One row: a Windows user added to `sysadmin` on SQLPRD06. The break-glass group is in both the run and the registry, so it isn't drift:

   ```powershell
   ./Compare-SqlAuditRun.ps1 -BeforePath tests/fixtures/audit-day1/audit.json -AfterPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -OutputPath out/drift
   ```

   ```text
   Instance Drift            Detail
   -------- -----            ------
   SQLPRD06 New legacy login CONTOSO\jdoe (U), sysadmin

   Wrote 2 files and manifest.json to out/drift
   Evidence for DRIFT (Compare two audit runs for regressions): CA-7, CM-6; KSI-MLA-EVC, KSI-SVC-ACM
   Drift is a compliance finding: open a task for each row (Building Ticket-to-Machine routes it).
   ```

   <!-- capture:begin 09-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/09-5.txt))](captures/09-5.png){.lightbox fig-alt="Terminal window showing ./Compare-SqlAuditRun.ps1 -BeforePath tests/fixtures/audit-day1/audit.json -A… and what it printed"}

   <!-- capture:end -->

6. **Open the drift manifest:**

   ```powershell
   Get-Content out/drift/manifest.json
   ```

   ```text
   {
     "step": "DRIFT",
     "title": "Compare two audit runs for regressions",
     "mode": "read-only",
     "asOf": "2026-12-20",
     "controls": [
       "CA-7",
       "CM-6"
     ],
     "ksis": [
       "KSI-MLA-EVC",
       "KSI-SVC-ACM"
     ],
     "files": [
       {
         "file": "drift.csv",
         "sha256": "307892c2e129ac27c959e0ed382de9c140fe43fa730ec5343a0767f8f8d19abf"
       },
       {
         "file": "drift.json",
         "sha256": "bd14b8d6dad23232956213f7f9fbb1f60bd0e7ec327e58e8ace1f2075c70b2ea"
       }
     ]
   }
   ```

   <!-- capture:begin 09-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/09-6.txt))](captures/09-6.png){.lightbox fig-alt="Terminal window showing Get-Content out/drift/manifest.json and what it printed"}

   <!-- capture:end -->

7. **Run this chapter's tests, then remove the output:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 09*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   Remove-Item -Recurse -Force out
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             8           0
   ```

   <!-- capture:begin 09-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/09-7.txt))](captures/09-7.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 09*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0.

## Lab 2: a test instance

**The authors haven't run this lab.** It schedules read-only runs against one test instance; it changes nothing on the instance. Use a test job host and a test instance, never production.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Write the run script
New-Item -ItemType Directory -Force <run-root>\runs | Out-Null
$run = @'
param([string]$Kit, [string]$Instance, [string]$Root, [string]$Exceptions, [string]$ArcSnapshot)
$ErrorActionPreference = 'Stop'
$today = Get-Date -Format yyyy-MM-dd
$dir = Join-Path $Root $today
& (Join-Path $Kit 'Export-SqlAuditSnapshot.ps1') -SqlInstance $Instance -OutputPath (Join-Path $dir 'audit.json') -AsOf $today
$arcNow = Join-Path $dir 'arc.json'
if ($ArcSnapshot) { Copy-Item -LiteralPath $ArcSnapshot -Destination $arcNow }
$closureArc = if (Test-Path $arcNow) { @{ ArcPath = $arcNow } } else { @{} }
& (Join-Path $Kit 'Invoke-SqlClosure.ps1') -AuditPath (Join-Path $dir 'audit.json') -ExceptionsPath $Exceptions -OutputPath (Join-Path $dir 'closure') @closureArc
$prev = Get-ChildItem $Root -Directory | Where-Object Name -lt $today | Sort-Object Name | Select-Object -Last 1
if ($prev) {
    $arcBefore = Join-Path $prev.FullName 'arc.json'
    $driftArc = if ((Test-Path $arcBefore) -and (Test-Path $arcNow)) { @{ BeforeArcPath = $arcBefore; AfterArcPath = $arcNow } } else { @{} }
    & (Join-Path $Kit 'Compare-SqlAuditRun.ps1') -BeforePath (Join-Path $prev.FullName 'audit.json') -AfterPath (Join-Path $dir 'audit.json') -ExceptionsPath $Exceptions -OutputPath (Join-Path $dir 'drift') @driftArc
}
'@
Set-Content -Path <run-root>\Run-SqlClosure.ps1 -Value $run

# Step 2: Run it once by hand
pwsh -NoProfile -File <run-root>\Run-SqlClosure.ps1 -Kit <kit-path> -Instance '<test-instance>' -Root <run-root>\runs -Exceptions <exceptions-path>

# Step 3: Schedule it weekly as the gMSA
$action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument "-NoProfile -File `"<run-root>\Run-SqlClosure.ps1`" -Kit `"<kit-path>`" -Instance `"<test-instance>`" -Root `"<run-root>\runs`" -Exceptions `"<exceptions-path>`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 06:00
$principal = New-ScheduledTaskPrincipal -UserId '<domain>\<gmsa-name>$' -LogonType Password
Register-ScheduledTask -TaskName 'SQL identity closure and drift (test)' -Action $action -Trigger $trigger -Principal $principal

# Step 4: Start it now and check the result
Start-ScheduledTask -TaskName 'SQL identity closure and drift (test)'
Get-ScheduledTaskInfo -TaskName 'SQL identity closure and drift (test)' | Select-Object LastRunTime, LastTaskResult
Get-ChildItem <run-root>\runs -Recurse -Filter manifest.json | Select-Object FullName

# Step 5: Back it out
Unregister-ScheduledTask -TaskName 'SQL identity closure and drift (test)' -Confirm:$false
```

:::

<!-- labs:end -->

**Prerequisites.** A group managed service account installed on the job host ([Building Non-Person Identity, Chapter 06](../non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md)). A Windows login for it on the test instance with the read rights `Export-SqlAuditSnapshot.ps1` states: `VIEW SERVER PERFORMANCE STATE` and `VIEW SERVER SECURITY STATE` on SQL Server 2022 and later (`VIEW SERVER STATE` on 2019 and earlier), `VIEW ANY SECURITY DEFINITION` (`VIEW ANY DEFINITION` before 2022) and `CONNECT ANY DATABASE`, never `sysadmin`. That login is itself a usable Windows login, so record it in the test exception registry with an approver and an expiry, or condition 1 can't be met.

**The scheduled reader on a closed instance.** Once an instance's Windows logins are gone, a Windows reader is the one Windows login left. The exporter takes `-AccessToken` (an Entra token for `https://database.windows.net/`, a string or a `SecureString`), so the reader can instead be an Entra workload identity with an Entra login holding the same read rights, and no exception is needed for it. Getting that token on a schedule is the job host's business (for example the managed identity of an Arc-enabled host, Book 06, [Chapter 19](../../../books/b06-data-platform/19-connection-string-migration.md)); this lab keeps the gMSA and the dated exception, and the authors haven't run the token path. PowerShell 7 and the SqlServer module on the host; a copy of the kit at `<kit-path>`; a run folder at `<run-root>`, outside any repository. You'll replace: `<kit-path>`, `<run-root>`, `<test-instance>` (host,port), `<exceptions-path>` (the test exception registry), and `<domain>\<gmsa-name>$`.

1. **Write the run script.** One snapshot, one closure record, and a drift check against the previous run:

   ```powershell
   New-Item -ItemType Directory -Force <run-root>\runs | Out-Null
   $run = @'
   param([string]$Kit, [string]$Instance, [string]$Root, [string]$Exceptions, [string]$ArcSnapshot)
   $ErrorActionPreference = 'Stop'
   $today = Get-Date -Format yyyy-MM-dd
   $dir = Join-Path $Root $today
   & (Join-Path $Kit 'Export-SqlAuditSnapshot.ps1') -SqlInstance $Instance -OutputPath (Join-Path $dir 'audit.json') -AsOf $today
   $arcNow = Join-Path $dir 'arc.json'
   if ($ArcSnapshot) { Copy-Item -LiteralPath $ArcSnapshot -Destination $arcNow }
   $closureArc = if (Test-Path $arcNow) { @{ ArcPath = $arcNow } } else { @{} }
   & (Join-Path $Kit 'Invoke-SqlClosure.ps1') -AuditPath (Join-Path $dir 'audit.json') -ExceptionsPath $Exceptions -OutputPath (Join-Path $dir 'closure') @closureArc
   $prev = Get-ChildItem $Root -Directory | Where-Object Name -lt $today | Sort-Object Name | Select-Object -Last 1
   if ($prev) {
       $arcBefore = Join-Path $prev.FullName 'arc.json'
       $driftArc = if ((Test-Path $arcBefore) -and (Test-Path $arcNow)) { @{ BeforeArcPath = $arcBefore; AfterArcPath = $arcNow } } else { @{} }
       & (Join-Path $Kit 'Compare-SqlAuditRun.ps1') -BeforePath (Join-Path $prev.FullName 'audit.json') -AfterPath (Join-Path $dir 'audit.json') -ExceptionsPath $Exceptions -OutputPath (Join-Path $dir 'drift') @driftArc
   }
   '@
   Set-Content -Path <run-root>\Run-SqlClosure.ps1 -Value $run
   ```

   `-ArcSnapshot` is optional. Pass an Arc snapshot exported just before the run ([Chapter 03](03-arc-and-the-engines-identity.md)'s `Export-SqlArcSnapshot.ps1`, by a person or identity with Reader; the gMSA can't sign in to Azure) and the script keeps it beside the audit, so condition 4 is read rather than `external`, and from the second run with one the drift check reports `Arc regressed`.

2. **Run it once by hand**, as yourself, to see it work before the schedule does:

   ```powershell
   pwsh -NoProfile -File <run-root>\Run-SqlClosure.ps1 -Kit <kit-path> -Instance '<test-instance>' -Root <run-root>\runs -Exceptions <exceptions-path>
   ```

3. **Schedule it weekly as the gMSA.** R09 asks for at least monthly; weekly finds drift sooner. The principal is the form Microsoft's own gMSA task example uses:[^sq09-task-gmsa][^sq09-task-principal]

   ```powershell
   $action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument "-NoProfile -File `"<run-root>\Run-SqlClosure.ps1`" -Kit `"<kit-path>`" -Instance `"<test-instance>`" -Root `"<run-root>\runs`" -Exceptions `"<exceptions-path>`""
   $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 06:00
   $principal = New-ScheduledTaskPrincipal -UserId '<domain>\<gmsa-name>$' -LogonType Password
   Register-ScheduledTask -TaskName 'SQL identity closure and drift (test)' -Action $action -Trigger $trigger -Principal $principal
   ```

4. **Start it now and check the result.** `LastTaskResult` 0 means the run finished:

   ```powershell
   Start-ScheduledTask -TaskName 'SQL identity closure and drift (test)'
   Get-ScheduledTaskInfo -TaskName 'SQL identity closure and drift (test)' | Select-Object LastRunTime, LastTaskResult
   Get-ChildItem <run-root>\runs -Recurse -Filter manifest.json | Select-Object FullName
   ```

   Each run date has `closure\manifest.json`, and from the second run on, `drift\manifest.json`. A drift row is a task ([Building Ticket-to-Machine, Chapter 04](../ticket-to-machine/04-drift-to-a-typed-task.md)).

5. **Back it out.** Remove the schedule. The run folders stay as evidence; keep them inside your boundary:

   ```powershell
   Unregister-ScheduledTask -TaskName 'SQL identity closure and drift (test)' -Confirm:$false
   ```

A pipeline runner on a host that can reach the instance can call the same `Run-SqlClosure.ps1` on a schedule instead; the back-out is then disabling that pipeline's schedule.

## Verified facts

| Item | Value | GCC | Source |
|---|---|---|---|
| Login types | S, U, G, E, X, C, K (and R for server roles) | — | [^sq09-principals] |
| `IsIntegratedSecurityOnly`, `IsExternalAuthenticationOnly` | 1 = Windows authentication only; 1 = SQL authentication disabled (SQL Server 2025) | — | [^sq09-serverproperty] |
| Disable SQL Authentication | SQL Server 2025 on Windows, Arc-enabled; extension 1.1.3394.392 or later; primary managed identity; keeps logins and sessions; reversed in the portal | Commercial Azure (`AzureCloud`) | [^sq09-disable] |
| Authentication mode change | Needs a service restart | — | [^sq09-auth-mode] |
| Local connections | Report `NTLM` regardless of Kerberos | — | [^sq09-local-ntlm] |
| Failover cluster instances | Entra authentication not supported; SQL Server needs the Azure public cloud for it | Commercial Azure | [^sq09-mi] |
| Scheduled task as a gMSA | `New-ScheduledTaskPrincipal -UserId <domain>\<gmsa>$ -LogonType Password` | — | [^sq09-task-gmsa] [^sq09-task-principal] |

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | FedRAMP 20x KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| CLOSURE: the closure record (Lab 1 steps 1 to 4; each scheduled run) | CA-7, CM-6, AC-2 | KSI-MLA-EVC, KSI-SVC-ACM | `closure.csv` and its manifest per instance per run; the exception registry with approvers; the external evidence each `external` field names |
| DRIFT: the comparison (Lab 1 step 5; each scheduled run) | CA-7, CM-6 | KSI-MLA-EVC, KSI-SVC-ACM | `drift.csv` and its manifest, and the task opened for each row |

These records support CA-7 (continuous monitoring), CM-6 (the authentication settings, read every run) and AC-2 (which accounts can sign in). They provide evidence; the agency's assessor decides whether the closure posture holds. KSIs are FedRAMP 20x indicators for cloud service providers, framed as in [Chapter 07](07-the-application-chain.md).

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| "Ready for the assessor" read as "closed" | External evidence is never gathered | The record says `external`; Chapter 21's six sets are the closure |
| An exception with no expiry | A login is excused for ever | The registry's `expires`; only the break-glass group has none, approved by the authorizing official |
| The reader's own Windows login | Condition 1 never holds on a closed instance | A dated exception for the reader, or a reader that signs in with an Entra token (`Export-SqlAuditSnapshot.ps1 -AccessToken`) |
| A database the reader can't open | The exporter skips it with a warning, and its users drop out of the record | `CONNECT ANY DATABASE` for the reader; read the run's warnings |
| Arc going offline between runs | Nothing in the audit changes, so a drift check without Arc misses it | Keep an Arc snapshot with each run and pass both to `Compare-SqlAuditRun.ps1` |
| Drift seen and not routed | The regression stays | A task per row ([Building Ticket-to-Machine](../ticket-to-machine/04-drift-to-a-typed-task.md)) |
| Mode changed in the registry, not yet restarted | The audit reads the running mode and sees nothing | R09's added registry check of `LoginMode`; the kit leaves `registryLoginMode` null in a live snapshot |

## Checklist

- [ ] Every production instance has a closure record from a scheduled run, not a one-off.
- [ ] Every `external` field names the log or report that evidences it.
- [ ] The exception registry has an approver and an expiry for every entry but the break-glass group.
- [ ] Every drift row has a task.
- [ ] The schedule runs at least monthly, and before each assessment.

::: {.callout-tip}
## Continue the book
[← Chapter 08 — AD CS Dependencies](08-ad-cs-dependencies.md) · [Workbook index](index.md) · [Next: Chapter 10 — Deploying to Test and Production →](10-deploying-to-test-and-production.md)
:::

[^sq09-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Nov 24, 2026).
[^sq09-serverproperty]: Microsoft Learn, "SERVERPROPERTY (Transact-SQL)," `IsIntegratedSecurityOnly` and `IsExternalAuthenticationOnly`, <https://learn.microsoft.com/sql/t-sql/functions/serverproperty-transact-sql> (accessed Nov 24, 2026).
[^sq09-disable]: Microsoft Learn, "Disable SQL Authentication - SQL Server enabled by Azure Arc," sections "How disabling SQL authentication works," "Prerequisites" and "Check authentication status," <https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication> (accessed Nov 24, 2026).
[^sq09-auth-mode]: Microsoft Learn, "Change Server Authentication Mode," <https://learn.microsoft.com/sql/database-engine/configure-windows/change-server-authentication-mode> (accessed Nov 24, 2026).
[^sq09-local-ntlm]: Microsoft Learn, "Determine the authentication type," <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> (accessed Nov 24, 2026).
[^sq09-mi]: Microsoft Learn, "Managed identity overview - SQL Server enabled by Azure Arc," Limitations, <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Nov 24, 2026).
[^sq09-task-gmsa]: Microsoft Learn, "Modify and Remove Assessment Tasks," "How to update existing scheduled task to use gMSA?," <https://learn.microsoft.com/services-hub/microsoft-engage-center/health/modify-and-remove-assessment-tasks> (accessed Nov 24, 2026).
[^sq09-task-principal]: Microsoft Learn, "New-ScheduledTaskPrincipal (ScheduledTasks)," `-LogonType`, <https://learn.microsoft.com/powershell/module/scheduledtasks/new-scheduledtaskprincipal> (accessed Nov 24, 2026).
