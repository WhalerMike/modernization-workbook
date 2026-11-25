---
title: "Data Platform, Module 9: Closure, Drift and Evidence"
subtitle: "Project each audit run onto the five closure conditions, compare runs for drift, and keep proving the posture instead of declaring it once"
description: "Module 9 of the Data Platform and SQL Server Identity learning path. You learn the five closure conditions, the closure record's field set, which fields wait on evidence from outside the audit, and how drift between two runs becomes a compliance finding. Lab 1 projects the day-30 fixtures onto the closure record, shows what the exception registry does, and compares day 1 with day 30. Runbook R09; workbook Chapter 09."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 9
date-modified: 2026-11-25
review-status: pending
---
# Data Platform, Module 9: Closure, Drift and Evidence {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 9 of 10 · 55 minutes · Runbook [R09](../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md) · Workbook [Chapter 09](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

An instance brought to the Entra-exclusive posture can slide back: an administrator can switch it to mixed mode, create a SQL login or add a Windows login. Closure is therefore not a one-time action. It is a record that keeps coming back clean on a schedule, and drift is the run that doesn't. In this module you project an audit run onto the five closure conditions, see which fields the audit can't settle by itself, and compare two runs so a regression becomes a task.

**The federal requirement.** [Chapter 09's federal requirements and evidence table](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#federal-requirements-and-evidence) maps the closure record to NIST SP 800-53 CA-7, CM-6 and AC-2, and the drift comparison to CA-7 and CM-6, both with KSI-MLA-EVC and KSI-SVC-ACM. Runbook R09's [control states and evidence across the runbooks](../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md#b06-r09-control-states) lists the evidence for the Evidenced and Operated states. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The records support these controls; the assessor decides whether the closure posture holds.

### Learning objectives

In this module, you'll:

- Name Book 06's five closure conditions and the fields the closure record shows for each.
- Explain why two fields are always `external`, and why a record with nothing `NOT MET` is "ready for the assessor", never "closed".
- Run the kit's closure record and drift comparison over the day-1 and day-30 fixtures, with and without the exception registry.
- Say what the drift check catches, and why Arc going offline needs an Arc snapshot with each run.

### Prerequisites

- [Module 8](08-ad-cs-dependencies.md).
- The audit of [Module 2](02-the-authentication-audit.md) and the Arc snapshot of [Module 3](03-arc-and-the-engines-identity.md): the closure record reads both.

## Unit 2: The five closure conditions

*9 minutes*

Book 06, Chapter 20, *The Closure Condition*, defines the transformation as complete when five conditions hold at the same time on every production instance: no usable Windows-backed principal, SQL Authentication eliminated, Entra authentication observed working and nothing else, a cloud identity for the engine, and MFA for every human. None of them is a single engine setting. `LoginMode = 1` proves only that SQL logins are refused, and on SQL Server 2025 the record also needs `IsExternalAuthenticationOnly` = 1. Fields the audit can't see, such as Entra sign-ins and MFA, are external joins: the record points at the logs and doesn't copy them. Book 06, Chapter 21, *What Done Looks Like*, then names the six live evidence sets that close the transformation. Read:

- Book 06, Chapter 20: [the five closure conditions](../../books/b06-data-platform/20-the-closure-condition.md#the-five-closure-conditions) and [the closure record's field set](../../books/b06-data-platform/20-the-closure-condition.md#the-closure-records-field-set).
- Book 06, Chapter 21: [the evidence artifacts as live outputs](../../books/b06-data-platform/21-what-done-looks-like.md#the-evidence-artifacts-as-live-outputs).
- Runbook R09: [Step 2, assemble the per-instance closure record](../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md#step-2-assemble-the-per-instance-closure-record) and [the six live evidence sets](../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md#the-six-live-evidence-sets).
- [Chapter 09: the closure record](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#the-closure-record), including the two places it is narrower than Chapter 20's field set.

## Unit 3: Drift as a compliance finding

*9 minutes*

A drift event is a regression between two runs: mixed mode enabled, a new SQL or Windows login, `sa` re-enabled, remote NTLM back, or the Arc agent going offline. Book 06, Chapter 20, *The Closure Condition*, treats each one as a compliance violation, not an advisory signal. The kit's comparison applies the exception registry, so the break-glass group isn't drift, and it reads Arc only when it gets both runs' Arc snapshots, because nothing in the audit changes when Arc goes offline. A mode changed in the registry but not yet restarted is invisible to the audit, which reads the running mode. Read:

- Book 06, Chapter 20: [drift detection](../../books/b06-data-platform/20-the-closure-condition.md#drift-detection).
- Runbook R09: [Step 3, detect drift as a compliance violation](../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md#step-3-detect-drift-as-a-compliance-violation).
- [Chapter 09: drift](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#drift) and [dangers](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*27 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-09-closure-drift-and-evidence\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Project day 30 onto the closure conditions
./Invoke-SqlClosure.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run\closure"

# Step 2: Read SQLPRD01's whole record
Import-Csv "$Run\closure\closure.csv" | Where-Object Instance -eq SQLPRD01 | Format-Table -AutoSize

# Step 3: Read the exception registry
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
(Read-SqlJson tests/fixtures/audit-day30/exceptions.json).exceptions | Format-Table instance, login, approvedBy, expires -AutoSize

# Step 4: See what the registry does
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$day30 = Read-SqlJson tests/fixtures/audit-day30/audit.json
Get-SqlClosureRecord -Audit $day30 -Exceptions @() | Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Status -ne 'met' } | Format-Table -AutoSize

# Step 5: Compare day 1 with day 30
./Compare-SqlAuditRun.ps1 -BeforePath tests/fixtures/audit-day1/audit.json -AfterPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -OutputPath "$Run\drift"

# Step 6: Open the drift manifest
Get-Content "$Run\drift\manifest.json"

# Step 7: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 09*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# Step 8: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-09-closure-drift-and-evidence\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 09, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-09-closure-drift-and-evidence\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-09-closure-drift-and-evidence\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Project day 30 onto the closure conditions.** SQLPRD01, migrated in Chapter 04, has nothing `NOT MET`:

   ```powershell
   ./Invoke-SqlClosure.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run\closure"
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

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-09-closure-drift-and-evidence/lab1/<run>/closure
   Evidence for CLOSURE (Project the audit onto the five closure conditions): CA-7, CM-6, AC-2; KSI-MLA-EVC, KSI-SVC-ACM
   ```

   SQLPRD06 runs SQL Server 2025 with `IsExternalAuthenticationOnly` = 0, so "SQL logins refused" is `NOT MET` although `IsIntegratedSecurityOnly` is 1. SQLFCI04 is a failover cluster instance and can't take Entra authentication as built; it needs a re-platform or a dated exception.

2. **Read SQLPRD01's whole record:**

   ```powershell
   Import-Csv "$Run\closure\closure.csv" | Where-Object Instance -eq SQLPRD01 | Format-Table -AutoSize
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

   The two `external` rows are evidence sets 2 and 5 of [Chapter 21](../../books/b06-data-platform/21-what-done-looks-like.md): Entra sign-in logs and the Conditional Access report.

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

5. **Compare day 1 with day 30.** One row: a Windows user added to `sysadmin` on SQLPRD06. The break-glass group is in both the run and the registry, so it isn't drift:

   ```powershell
   ./Compare-SqlAuditRun.ps1 -BeforePath tests/fixtures/audit-day1/audit.json -AfterPath tests/fixtures/audit-day30/audit.json -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -OutputPath "$Run\drift"
   ```

   ```text
   Instance Drift            Detail
   -------- -----            ------
   SQLPRD06 New legacy login CONTOSO\jdoe (U), sysadmin

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-09-closure-drift-and-evidence/lab1/<run>/drift
   Evidence for DRIFT (Compare two audit runs for regressions): CA-7, CM-6; KSI-MLA-EVC, KSI-SVC-ACM
   Drift is a compliance finding: open a task for each row (Building Ticket-to-Machine routes it).
   ```

6. **Open the drift manifest:**

   ```powershell
   Get-Content "$Run\drift\manifest.json"
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

7. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 09*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             8           0
   ```

8. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-09-closure-drift-and-evidence\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can say why SQLPRD01 is ready for the assessor but not closed, why SQLPRD06 fails "SQL logins refused" with `IsIntegratedSecurityOnly` at 1, and why the day-30 `sysadmin` login on SQLPRD06 is drift while the break-glass group isn't.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Write a run script that takes one audit snapshot, projects it onto the closure record and compares it with the previous run, then schedule it weekly as a group managed service account against one test instance. The runs are read-only; nothing on the instance changes. Follow [Chapter 09, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#lab-2-a-test-instance).

- **You need:** a test job host and a test instance, never production; a group managed service account installed on the host, with a Windows login on the instance holding the read rights `Export-SqlAuditSnapshot.ps1` states, never `sysadmin`, and recorded in the test exception registry with an approver and an expiry; PowerShell 7 and the SqlServer module on the host; a copy of the kit; and a run folder outside any repository. For condition 4, an Arc snapshot exported before each run by a person or identity with Reader in commercial Azure (`AzureCloud`), where a Microsoft 365 GCC (Moderate) tenant's Arc resources live; the gMSA can't sign in to Azure.
- **Back it out:** step 5 removes the scheduled task with `Unregister-ScheduledTask`; the run folders stay as evidence, inside your boundary. If a pipeline runner calls the script instead, disable that pipeline's schedule.

## Unit 6: Knowledge check

*5 minutes*

1. SQLPRD01's day-30 record has nine fields `met`, none `NOT MET` and two `external`. What does the kit call it?
   a. Closed.
   b. Ready for the assessor, with the external evidence.
   c. Open, until the two external fields are `met`.

2. SQLPRD06 has `IsIntegratedSecurityOnly` = 1, yet "SQL logins refused" is `NOT MET`. Why?
   a. It runs SQL Server 2025, and `IsExternalAuthenticationOnly` is 0.
   b. `sa` is still enabled on it.
   c. The snapshot has no Arc data for it.

3. Comparing day 1 with day 30 returns one row: `CONTOSO\jdoe` added to `sysadmin` on SQLPRD06. Why isn't the break-glass group a row too?
   a. Group logins are never drift.
   b. It is in both runs and in the exception registry.
   c. It holds no server role.

4. An instance's Arc agent goes offline between two runs. What does the drift check need to report it?
   a. Nothing extra: a disconnected agent changes the audit snapshot.
   b. The Arc snapshot taken with each run, passed as both `-BeforeArcPath` and `-AfterArcPath`.
   c. A restart of the SQL Server service.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** The two `external` fields still need their evidence, and the assessor decides. See [Chapter 09: the closure record](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#the-closure-record) and step 2 of its [Lab 1](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#lab-1-fixtures-no-tenant).
2. **a.** See step 1 of [Chapter 09, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#lab-1-fixtures-no-tenant) and Book 06, [Chapter 20: the five closure conditions](../../books/b06-data-platform/20-the-closure-condition.md#the-five-closure-conditions).
3. **b.** See step 5 of [Chapter 09, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#lab-1-fixtures-no-tenant) and [Chapter 09: drift](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#drift).
4. **b.** See [Chapter 09: dangers](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#dangers) and Runbook R09, [Step 3](../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md#step-3-detect-drift-as-a-compliance-violation).
:::

## Unit 7: Summary

*2 minutes*

You projected an audit run onto the five closure conditions, saw which fields wait on evidence from outside the audit, and compared two runs so a regression became a finding. Closure is the record that keeps coming back clean on a schedule, and each drift row is a task.

**Evidence an ISSO keeps from this module:** `closure.csv` and its `manifest.json` per instance per run, the exception registry with its approvers, and the external evidence each `external` field names; `drift.csv` and its manifest, and the task opened for each row (Chapter 09). Each manifest records the step, its controls and KSIs, and the SHA-256 of each file. Before shipping, work through the [Chapter 09 checklist](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 8](08-ad-cs-dependencies.md) · [Learning path](index.md) · [Next: Module 10, Deploying to test and production →](10-deploying-to-test-and-production.md)
:::
