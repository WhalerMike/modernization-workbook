---
title: "Data Platform, Module 10: Deploying to Test and Production"
subtitle: "Run one instance's login migration through a test stage and into production with the same commands, where nothing runs that a second person didn't approve by hash"
description: "Module 10 of the Data Platform and SQL Server Identity learning path. You learn the deployment runbook: one settings file per environment, preflight, a plan whose create, cutover and rollback files each carry an approved SHA-256, the parallel run and cutover, the go/no-go, the sealed test stage, then production, with Appendix B's break-glass path. Lab 1 rehearses the whole test stage as a dry run on the kit's example settings, seals it as a rehearsal, and watches production preflight refuse it. Runbook R05 and Appendix B; workbook Chapter 10."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 10
date-modified: 2026-11-25
review-status: approved
reviewed-sha256: 09b9371115e1bfff15f6586b0e8255cb53e56873f8ef7075656a3e27b52c1887
last-reviewed: 2026-11-25
---
# Data Platform, Module 10: Deploying to Test and Production {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 10 of 10 · 70 minutes · Runbook [R05](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md) and [Appendix B](../../books/b06-data-platform/appendix-b-ato-kit.md#break-glass-design) · Workbook [Chapter 10](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-dp-module-10) · [▶ Watch](../../presentations/watch.html?v=Training_DP_Module_10_Narrated) (about 13 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_DP_Module_10_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-10/Training_DP_Module_10_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-10/Training_DP_Module_10_Narrated.vtt).

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Everything in the earlier modules ends here: one instance's logins move from Windows to Microsoft Entra ID, first on a test instance, then in production. The commands are the same both times; only the settings file changes. Nothing runs that a second person didn't approve by hash, the way back is planned before the cutover, and production's preflight refuses to start until a real test stage for the same instance is sealed in the evidence chain. In this module you rehearse that whole test stage as a dry run.

**The federal requirement.** [Chapter 10's federal requirements and evidence table](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#federal-requirements-and-evidence) maps preflight to NIST SP 800-53 AC-6 and CM-6 (KSI-IAM-ELP, KSI-SVC-ACM); the plan and its approval to CM-3 and CM-4 (KSI-CMT-LMC, KSI-CMT-RVP); the create and cutover to CM-3 and AC-2 (KSI-CMT-LMC); the rollback plan to CM-3 and CP-2 (KSI-CMT-LMC, KSI-RPL-ARP); and the seal to CA-7 and AU-9 (KSI-MLA-EVC, KSI-MLA-OSM). Runbook R05's [control states, change safety and evidence](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#b06-r05-control-states) sets the rings the change moves through. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. These records support the controls listed and provide evidence for the change; the assessor decides.

### Learning objectives

In this module, you'll:

- Name what preflight checks, PF-01 to PF-07, and what it can't see.
- Explain how the three SHA-256 hashes tie the files a second person approved to the files that run.
- Walk the test stage from preflight to the seal, and say what makes it a go or a no-go.
- Explain why a dry-run stage seals only as a rehearsal, and why production preflight fails PF-06 until a real test stage is sealed.
- Name the rollback triggers and Appendix B's path when Entra can't be reached.

### Prerequisites

- [Module 9](09-closure-drift-and-evidence.md): its closure record and drift schedule run during the observation, and production's seal needs the closure record.
- The login plan and parallel run of [Module 4](04-entra-logins-and-the-parallel-run.md), which this stage runs for real.

## Unit 2: Settings, preflight and the approved plan

*10 minutes*

One settings file per environment, filled from the template and kept inside your boundary, names the instance, its snapshots, the exception registry, the reviewed mapping, the evidence chain and the break-glass group; no secret goes in it. Preflight checks the settings, the cloud (`AzureCloud`), Arc-eligibility Category 1, the mapping and the break-glass entry, and for production, a sealed test stage. It can't see the deployer's rights, so the deployer reads them after activating the role. The plan then writes `create.sql`, `cutover.sql` and `rollback.sql`, each with its SHA-256, and a second person reads them line by line and records the three hashes in the change record. Book 06, Chapter 12, *What the Engine-Authentication Decision Settles*, makes the parallel run required for production. Read:

- [Chapter 10: before you start](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#before-you-start) and [the settings](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#the-settings).
- [Chapter 10, Stage 1](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-1-the-test-instance), steps 1 to 6.
- Runbook R05: [preconditions](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#preconditions) and [Step 1, generate the login statements](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-1-generate-the-login-statements-dry-run-first).
- Book 06, Chapter 12: [Decision 2, the parallel-run sequence is required](../../books/b06-data-platform/12-the-engine-authentication-decision.md#decision-2-the-parallel-run-sequence-is-required).

## Unit 3: Create, cut over, seal, then production

*10 minutes*

The create adds the Entra logins and users beside the Windows ones and disables nothing. Both paths stay open for the parallel run. The rollback plan is dry-run before the cutover, so its record exists first. The cutover disables the superseded users and SQL logins and denies `CONNECT SQL` to the superseded groups, never drops, then 30 days of observation follow. Runbook R05 keeps every cutover reversible: the Windows database users are still there, so the approved `rollback.sql` opens the old path again at once. The seal re-hashes every run's files, refuses a stage missing a required step or with a `DEPLOY` run that wasn't applied, and appends one record to the chain. When Entra can't be reached, Appendix B's path is the registered break-glass Windows group, empty by default. Read:

- Runbook R05: [Step 3, the parallel run](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-3-the-parallel-run), [Step 4, cutover](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-4-cutover), [rollback](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#rollback) and [the `sa` account](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#the-sa-account).
- Book 06, Appendix B: [break-glass design](../../books/b06-data-platform/appendix-b-ato-kit.md#break-glass-design).
- [Chapter 10, Stage 1](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-1-the-test-instance), steps 7 to 11, [go or no-go](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#go-or-no-go), [Stage 2: production](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-2-production) and [rollback](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#rollback).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*40 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-10-deploying-to-test-and-production\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Copy the example settings into this run's folder
foreach ($e in 'test', 'production') {
    $s = Get-Content -Raw "deploy/settings.$e.example.json" | ConvertFrom-Json
    $s.chainPath = "$Run\evidence\chain.jsonl"
    $s | ConvertTo-Json | Set-Content "$Run\settings.$e.json"
}
Get-Content "$Run\settings.test.json"

# Step 2: Preflight the test stage (PRE)
./deploy/Test-SqlPreflight.ps1 -SettingsPath "$Run\settings.test.json" -OutputPath "$Run\test\preflight"

# Step 3: Run the audit and the Arc check (AUDIT, ARC)
./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath "$Run\test\audit"
./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run\test\arc"

# Step 4: Plan the change (PLAN)
./deploy/New-SqlDeploymentPlan.ps1 -SettingsPath "$Run\settings.test.json" -OutputPath "$Run\test\plan"

# Step 5: Approve the hashes
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$create = Get-SqlFileHash "$Run\test\plan\create.sql"
$cutover = Get-SqlFileHash "$Run\test\plan\cutover.sql"
$rollback = Get-SqlFileHash "$Run\test\plan\rollback.sql"
[pscustomobject]@{ Create = $create; Cutover = $cutover; Rollback = $rollback } | Format-List

# Step 6: Dry-run the create phase (DEPLOY)
./deploy/Invoke-SqlDeploy.ps1 -PlanPath "$Run\test\plan" -Phase create -ApprovedHash $create -OutputPath "$Run\test\deploy-create"

# Step 7: Try a hash that isn't the approved one
try { ./deploy/Invoke-SqlDeploy.ps1 -PlanPath "$Run\test\plan" -Phase create -ApprovedHash ('0' * 64) -OutputPath "$Run\test\deploy-wrong-hash" } catch { $_.Exception.Message }

# Step 8: Judge the parallel run (PARALLEL)
./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\test\parallel"

# Step 9: Dry-run the rollback (RB)
./deploy/Invoke-SqlRollback.ps1 -PlanPath "$Run\test\plan" -ApprovedHash $rollback -OutputPath "$Run\test\rollback"

# Step 10: Dry-run the cutover (DEPLOY)
./deploy/Invoke-SqlDeploy.ps1 -PlanPath "$Run\test\plan" -Phase cutover -ApprovedHash $cutover -OutputPath "$Run\test\deploy-cutover"

# Step 11: Try to seal the stage without the parallel run (EVIDENCE)
try { ./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths "$Run\test\preflight", "$Run\test\audit", "$Run\test\arc", "$Run\test\plan", "$Run\test\deploy-create", "$Run\test\deploy-cutover", "$Run\test\rollback" -ChainPath "$Run\evidence\chain.jsonl" -AsOf 2026-12-20 } catch { $_.Exception.Message }

# Step 12: Try to seal the whole stage
try { ./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths "$Run\test\preflight", "$Run\test\audit", "$Run\test\arc", "$Run\test\plan", "$Run\test\deploy-create", "$Run\test\parallel", "$Run\test\deploy-cutover", "$Run\test\rollback" -ChainPath "$Run\evidence\chain.jsonl" -AsOf 2026-12-20 } catch { $_.Exception.Message }

# Step 13: Seal it as a rehearsal
./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths "$Run\test\preflight", "$Run\test\audit", "$Run\test\arc", "$Run\test\plan", "$Run\test\deploy-create", "$Run\test\parallel", "$Run\test\deploy-cutover", "$Run\test\rollback" -ChainPath "$Run\evidence\chain.jsonl" -AsOf 2026-12-20 -Rehearsal

# Step 14: Preflight production
./deploy/Test-SqlPreflight.ps1 -SettingsPath "$Run\settings.production.json" -OutputPath "$Run\production\preflight"

# Step 15: Run the deployment tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Entry scripts and the runbook*', 'Evidence*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# Step 16: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-10-deploying-to-test-and-production\lab1 -Name
```

:::

<!-- labs:end -->

You rehearse the whole test stage of [Chapter 10's runbook](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-1-the-test-instance) on the kit's example settings, as dry runs: nothing connects to an instance, and nothing runs with `-Apply`. The chapter explains each step and what changes when it runs for real.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-10-deploying-to-test-and-production\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-10-deploying-to-test-and-production\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Copy the example settings into this run's folder.** The kit's two example settings files describe the fixtures' SQLPRD01 in the test and production stages. Their `chainPath` points inside the kit, so this run's copies point it at this run's folder instead, and the kit's folder stays as you unzipped it:

   ```powershell
   foreach ($e in 'test', 'production') {
       $s = Get-Content -Raw "deploy/settings.$e.example.json" | ConvertFrom-Json
       $s.chainPath = "$Run\evidence\chain.jsonl"
       $s | ConvertTo-Json | Set-Content "$Run\settings.$e.json"
   }
   Get-Content "$Run\settings.test.json"
   ```

   Expected output:

   ```text
   {
     "_comment": "The runbook's example: the fixtures' SQLPRD01 in the test stage. Dry runs only.",
     "environment": "test",
     "cloud": "AzureCloud",
     "instance": "SQLPRD01",
     "server": "sqlprd01.contoso.example,1433",
     "auditPath": "tests/fixtures/audit-day1/audit.json",
     "arcPath": "tests/fixtures/arc/arc.json",
     "exceptionsPath": "tests/fixtures/audit-day1/exceptions.json",
     "mappingPath": "tests/fixtures/mapping/sqlprd01-mapping.csv",
     "chainPath": "C:\\FMWLabs\\results\\data-platform-10-deploying-to-test-and-production\\lab1\\<run>\\evidence\\chain.jsonl",
     "breakGlassLogin": "CONTOSO\\SQL-BreakGlass",
     "approver": "Change advisory board (fictional)"
   }
   ```

2. **Preflight the test stage (PRE).** PF-07's warning is the example's `sa`, still enabled under its own name on day 1; it doesn't stop the change:

   ```powershell
   ./deploy/Test-SqlPreflight.ps1 -SettingsPath "$Run\settings.test.json" -OutputPath "$Run\test\preflight"
   ```

   Expected output:

   ```text
   Check What                         Result Detail
   ----- ----                         ------ ------
   PF-01 Settings complete            pass   test: SQLPRD01 on sqlprd01.contoso.example,1433
   PF-02 Cloud                        pass   AzureCloud (a GCC Moderate tenant's Arc resources are in AzureCloud, WD-028)
   PF-03 Arc-eligibility Category 1   pass   Category 1: Ready: plan the logins (Chapter 04)
   PF-04 Mapping resolves every login pass   4 mapped; unresolved: none
   PF-05 Break-glass path recorded    pass   CONTOSO\SQL-BreakGlass is in the exception registry
   PF-07 sa disabled and renamed      warn   sa is still enabled or named sa: remediate it on its own track (Runbook R05), after another sysadmin can sign in

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/preflight
   Evidence for PRE (Preflight: settings, cloud, Arc eligibility, mapping, break-glass, sa and the earlier stage's evidence): AC-6, CM-6; KSI-IAM-ELP, KSI-SVC-ACM
   Preflight: every check passed.
   ```

3. **Run the audit and the Arc check (AUDIT, ARC)** on the snapshots the settings name. In a real stage these are the instance's own snapshots, taken that day:

   ```powershell
   ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath "$Run\test\audit"
   ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run\test\arc"
   ```

   Expected output:

   ```text
   Instance U G S C K E X Disabled Usable
   -------- - - - - - - - -------- ------
   SQLPRD01 1 2 2 0 0 0 0        0      5
   SQLPRD02 1 1 0 0 0 0 0        1      2
   SQLFCI04 0 1 2 0 0 0 0        0      3
   SQLPRD06 0 1 0 0 0 1 1        1      3


   Instance Severity Finding          Detail
   -------- -------- -------          ------
   SQLPRD01 highest  sa enabled       sa is enabled under the name 'sa'
   SQLPRD01 critical Usable SQL login payroll_report: migrate to an Entra login or record an exception
   SQLPRD01 high     Mixed mode       SQL authentication is accepted (IsIntegratedSecurityOnly = 0)
   SQLPRD01 high     Mode anomaly     Registry LoginMode 1, running mode 2: changed without a restart; resolve before migrating
   SQLPRD01 medium   Service account  CONTOSO\svc-sqlprd01 is a user account with a password: the Data Platform project converts it (service account guide)
   SQLPRD01 info     Arc-eligibility  Category 1 or 2 (run the Arc check)
   SQLPRD02 medium   Service account  CONTOSO\svc-sqlprd02 is a user account with a password: the Data Platform project converts it (service account guide)
   SQLPRD02 info     Arc-eligibility  Category 1 or 2 (run the Arc check)
   SQLFCI04 highest  sa enabled       sa is enabled under the name 'sa'
   SQLFCI04 critical Usable SQL login vendorhr_app: migrate to an Entra login or record an exception
   SQLFCI04 high     Mixed mode       SQL authentication is accepted (IsIntegratedSecurityOnly = 0)
   SQLFCI04 medium   Service account  CONTOSO\svc-sqlfci04 is a user account with a password: the Data Platform project converts it (service account guide)
   SQLFCI04 info     Arc-eligibility  Category 3 (failover cluster instance)
   SQLPRD06 info     Arc-eligibility  Category 1 or 2 (run the Arc check)

   Wrote 4 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/audit
   Evidence for AUDIT (Login census, authentication mode, sa and service-account findings): AC-2, IA-5, CM-6; KSI-PIY-GIV, KSI-IAM-SNU, KSI-SVC-ACM

   Instance Version Agent                  Extension Entra           Category Next
   -------- ------- -----                  --------- -----           -------- ----
   SQLPRD01 2022    Connected              deployed  appRegistration        1 Ready: plan the logins (Chapter 04)
   SQLPRD02 2022    not installed          missing   not configured         2 Deploy Arc (Runbook R04): agent not installed; SQL extension not deployed; Entra authentication not configured
   SQLFCI04 2019    cluster: see its nodes missing   not configured         3 Re-platform as a standalone instance or availability group, or record an exception
   SQLPRD06 2025    Connected              deployed  managedIdentity        1 Ready: plan the logins (Chapter 04)

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/arc
   Evidence for ARC (Arc agent, SQL extension and Entra configuration: the Arc-eligibility category): CM-8, CM-6, IA-5; KSI-PIY-GIV, KSI-SVC-ACM, KSI-IAM-SNU
   ```

4. **Plan the change (PLAN).** Three `.sql` files, each with its SHA-256:

   ```powershell
   ./deploy/New-SqlDeploymentPlan.ps1 -SettingsPath "$Run\settings.test.json" -OutputPath "$Run\test\plan"
   ```

   Expected output:

   ```text
   Phase    Statements Sha256
   -----    ---------- ------
   create           16 deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709
   cutover           5 0a04162bf925eea425ac5a820fcf5e68b2169faf1b996c2acb10c14aec6cbad3
   rollback          5 b2d5964e9a6d29731d139b2b3fc72b59e6748196959142e5f6f521b2863470c8

   Wrote 6 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/plan
   Evidence for PLAN (Plan the change for one environment, with its hash): CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-RVP
   Approve the create hash, then run: ./deploy/Invoke-SqlDeploy.ps1 -PlanPath C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/plan -Phase create -ApprovedHash <hash>
   ```

5. **Approve the hashes.** The approver re-hashes the three files after reading them. This lab keeps each hash in a variable, as a change record would keep it:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   $create = Get-SqlFileHash "$Run\test\plan\create.sql"
   $cutover = Get-SqlFileHash "$Run\test\plan\cutover.sql"
   $rollback = Get-SqlFileHash "$Run\test\plan\rollback.sql"
   [pscustomobject]@{ Create = $create; Cutover = $cutover; Rollback = $rollback } | Format-List
   ```

   Expected output:

   ```text
   Create   : deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709
   Cutover  : 0a04162bf925eea425ac5a820fcf5e68b2169faf1b996c2acb10c14aec6cbad3
   Rollback : b2d5964e9a6d29731d139b2b3fc72b59e6748196959142e5f6f521b2863470c8
   ```

6. **Dry-run the create phase (DEPLOY).** Without `-Apply` it connects to nothing; it checks the hash and prints what it would run:

   ```powershell
   ./deploy/Invoke-SqlDeploy.ps1 -PlanPath "$Run\test\plan" -Phase create -ApprovedHash $create -OutputPath "$Run\test\deploy-create"
   ```

   Expected output:

   ```text
   Dry run: hash matches. Would run 16 statements on sqlprd01.contoso.example,1433 (test):
     CREATE LOGIN [payroll-reporting-app] FROM EXTERNAL PROVIDER;
     CREATE LOGIN [payroll-web-mi] FROM EXTERNAL PROVIDER;
     CREATE LOGIN [SQL-DBA-Admins] FROM EXTERNAL PROVIDER;
     ALTER SERVER ROLE [sysadmin] ADD MEMBER [SQL-DBA-Admins];
     CREATE LOGIN [SQL-Payroll-Users] FROM EXTERNAL PROVIDER;
     CREATE USER [payroll-reporting-app] FROM LOGIN [payroll-reporting-app];
     ALTER ROLE [db_datareader] ADD MEMBER [payroll-reporting-app];
     CREATE USER [payroll-web-mi] FROM LOGIN [payroll-web-mi];
     ALTER ROLE [db_datareader] ADD MEMBER [payroll-web-mi];
     ALTER ROLE [db_datawriter] ADD MEMBER [payroll-web-mi];
     ALTER ROLE [db_executor] ADD MEMBER [payroll-web-mi];
     CREATE USER [SQL-Payroll-Users] FROM LOGIN [SQL-Payroll-Users];
     ALTER ROLE [db_datareader] ADD MEMBER [SQL-Payroll-Users];
     ALTER ROLE [db_datawriter] ADD MEMBER [SQL-Payroll-Users];
     CREATE USER [SQL-Payroll-Users] FROM LOGIN [SQL-Payroll-Users];
     ALTER ROLE [db_datareader] ADD MEMBER [SQL-Payroll-Users];

   Environment Instance Phase  Statements Result
   ----------- -------- -----  ---------- ------
   test        SQLPRD01 create         16 dry run

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/deploy-create
   Evidence for DEPLOY (Run the approved plan): CM-3, AC-2; KSI-CMT-LMC
   ```

7. **Try a hash that isn't the approved one.** The deploy stops before anything connects:

   ```powershell
   try { ./deploy/Invoke-SqlDeploy.ps1 -PlanPath "$Run\test\plan" -Phase create -ApprovedHash ('0' * 64) -OutputPath "$Run\test\deploy-wrong-hash" } catch { $_.Exception.Message }
   ```

   Expected output:

   ```text
   Refused: create.sql hashes to deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709, not the approved 0000000000000000000000000000000000000000000000000000000000000000. Re-plan and re-approve.
   ```

8. **Judge the parallel run (PARALLEL)** on day 30's snapshot. In the fixtures, day 30 is after the cutover, so each legacy login reads as already cut over:

   ```powershell
   ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\test\parallel"
   ```

   Expected output:

   ```text
   Legacy               Entra                 LegacySessions EntraSessions Ready Why
   ------               -----                 -------------- ------------- ----- ---
   CONTOSO\PayrollUsers SQL-Payroll-Users                  0            11  True already cut over (disabled or denied): observe 30 days, then drop
   CONTOSO\svc-payroll  payroll-web-mi                     0            44  True already cut over (disabled or denied): observe 30 days, then drop
   CONTOSO\SQL-Admins   SQL-DBA-Admins                     0             2  True already cut over (disabled or denied): observe 30 days, then drop
   payroll_report       payroll-reporting-app              0             3  True already cut over (disabled or denied): observe 30 days, then drop

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/parallel
   Evidence for PARALLEL (Judge the parallel run against its exit criteria): AC-2, CA-7; KSI-MLA-EVC
   Cutover-ready: 4 of 4: every exit criterion met
   ```

9. **Dry-run the rollback (RB)** before the cutover, so its record exists first:

   ```powershell
   ./deploy/Invoke-SqlRollback.ps1 -PlanPath "$Run\test\plan" -ApprovedHash $rollback -OutputPath "$Run\test\rollback"
   ```

   Expected output:

   ```text
   Dry run: hash matches. Would run 5 statements to restore the logins on sqlprd01.contoso.example,1433:
     GRANT CONNECT SQL TO [CONTOSO\PayrollUsers];
     ALTER LOGIN [CONTOSO\svc-payroll] ENABLE;
     ALTER LOGIN [payroll_report] ENABLE;
     GRANT CONNECT SQL TO [CONTOSO\SQL-Admins];
     ALTER SERVER ROLE [sysadmin] ADD MEMBER [CONTOSO\SQL-Admins];

   Environment Instance Statements Result
   ----------- -------- ---------- ------
   test        SQLPRD01          5 dry run

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/rollback
   Evidence for RB (Rollback plan): CM-3, CP-2; KSI-CMT-LMC, KSI-RPL-ARP
   ```

10. **Dry-run the cutover (DEPLOY).** Users and SQL logins are disabled, groups are denied `CONNECT SQL`, and the `sysadmin` group leaves the role first:

    ```powershell
    ./deploy/Invoke-SqlDeploy.ps1 -PlanPath "$Run\test\plan" -Phase cutover -ApprovedHash $cutover -OutputPath "$Run\test\deploy-cutover"
    ```

    Expected output:

    ```text
    Dry run: hash matches. Would run 5 statements on sqlprd01.contoso.example,1433 (test):
      DENY CONNECT SQL TO [CONTOSO\PayrollUsers];  -- group: superseded by SQL-Payroll-Users
      ALTER LOGIN [CONTOSO\svc-payroll] DISABLE;  -- superseded by payroll-web-mi
      ALTER LOGIN [payroll_report] DISABLE;  -- superseded by payroll-reporting-app
      ALTER SERVER ROLE [sysadmin] DROP MEMBER [CONTOSO\SQL-Admins];  -- DENY doesn't bind sysadmin members
      DENY CONNECT SQL TO [CONTOSO\SQL-Admins];  -- group: superseded by SQL-DBA-Admins

    Environment Instance Phase   Statements Result
    ----------- -------- -----   ---------- ------
    test        SQLPRD01 cutover          5 dry run

    Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/test/deploy-cutover
    Evidence for DEPLOY (Run the approved plan): CM-3, AC-2; KSI-CMT-LMC
    ```

11. **Try to seal the stage without the parallel run (EVIDENCE).** The seal refuses a stage missing a step `config/requirements.json` requires:

    ```powershell
    try { ./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths "$Run\test\preflight", "$Run\test\audit", "$Run\test\arc", "$Run\test\plan", "$Run\test\deploy-create", "$Run\test\deploy-cutover", "$Run\test\rollback" -ChainPath "$Run\evidence\chain.jsonl" -AsOf 2026-12-20 } catch { $_.Exception.Message }
    ```

    Expected output:

    ```text
    Stage 'test' is missing evidence for: PARALLEL. No record written.
    ```

12. **Try to seal the whole stage.** Every step is there, but the deployments were dry runs:

    ```powershell
    try { ./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths "$Run\test\preflight", "$Run\test\audit", "$Run\test\arc", "$Run\test\plan", "$Run\test\deploy-create", "$Run\test\parallel", "$Run\test\deploy-cutover", "$Run\test\rollback" -ChainPath "$Run\evidence\chain.jsonl" -AsOf 2026-12-20 } catch { $_.Exception.Message }
    ```

    Expected output:

    ```text
    Stage 'test' has a DEPLOY run that wasn't applied (dry run). Seal it with -Rehearsal, which preflight never accepts as a stage.
    ```

13. **Seal it as a rehearsal.** The same command with `-Rehearsal` writes the record, marked as one:

    ```powershell
    ./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths "$Run\test\preflight", "$Run\test\audit", "$Run\test\arc", "$Run\test\plan", "$Run\test\deploy-create", "$Run\test\parallel", "$Run\test\deploy-cutover", "$Run\test\rollback" -ChainPath "$Run\evidence\chain.jsonl" -AsOf 2026-12-20 -Rehearsal
    ```

    Expected output, the first lines:

    ```text
    Stage    : test (rehearsal)
    Instance : SQLPRD01
    Steps    : PRE, AUDIT, ARC, PLAN, DEPLOY, PARALLEL, DEPLOY, RB
    ```

    Then `Record   :` and the first 16 characters of the record's hash, which differ from run to run, because the record names this run's folders. Then:

    ```text
    Previous : (first)
    Sealed the test stage as a rehearsal in C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/evidence/chain.jsonl
    ```

14. **Preflight production.** PF-06 fails: the chain holds only a rehearsal, and production needs a sealed test stage that isn't one:

    ```powershell
    ./deploy/Test-SqlPreflight.ps1 -SettingsPath "$Run\settings.production.json" -OutputPath "$Run\production\preflight"
    ```

    Expected output:

    ```text
    Check What                         Result Detail
    ----- ----                         ------ ------
    PF-01 Settings complete            pass   production: SQLPRD01 on sqlprd01.contoso.example,1433
    PF-02 Cloud                        pass   AzureCloud (a GCC Moderate tenant's Arc resources are in AzureCloud, WD-028)
    PF-03 Arc-eligibility Category 1   pass   Category 1: Ready: plan the logins (Chapter 04)
    PF-04 Mapping resolves every login pass   4 mapped; unresolved: none
    PF-05 Break-glass path recorded    pass   CONTOSO\SQL-BreakGlass is in the exception registry
    PF-06 Test stage sealed            FAIL   no sealed (non-rehearsal) test-stage record for SQLPRD01 in C:\FMWLabs\results\data-platform-10-deploying-to-test-and-production\lab1\<run>\evidence\chain.jsonl
    PF-07 sa disabled and renamed      warn   sa is still enabled or named sa: remediate it on its own track (Runbook R05), after another sysadmin can sign in

    Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-10-deploying-to-test-and-production/lab1/<run>/production/preflight
    Evidence for PRE (Preflight: settings, cloud, Arc eligibility, mapping, break-glass, sa and the earlier stage's evidence): AC-6, CM-6; KSI-IAM-ELP, KSI-SVC-ACM
    Preflight: 1 check(s) failed. Stop here.
    ```

    The script also exits with code 1, so a pipeline that runs it stops there.

15. **Run the deployment tests:**

    ```powershell
    Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Entry scripts and the runbook*', 'Evidence*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
    ```

    Expected output:

    ```text
    PassedCount FailedCount
    ----------- -----------
             10           0
    ```

16. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

    ```powershell
    Get-ChildItem C:\FMWLabs\results\data-platform-10-deploying-to-test-and-production\lab1 -Name
    ```

    Expected output: one line per run, oldest first, the last one this run:

    ```text
    <run>
    ```

**Check your work:** you can walk the test stage on the example settings from preflight to the seal, and say why a wrong hash is refused before anything connects, why a dry-run stage seals only with `-Rehearsal`, and why production preflight then fails PF-06.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

This module has no Lab 2 of its own. The real test-instance run is [Chapter 10, Stage 1](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-1-the-test-instance): the same steps as Lab 1 against your test instance, with `-Apply` on the create and the cutover, the parallel run and 30 days of observation, then a seal without `-Rehearsal`. Nothing in that stage has been run with `-Apply` by the authors; every command has been run only as a dry run on the kit's example settings and by its Pester tests. Run the test stage first, read every file you approve, and keep the evidence.

- **You need:** a test instance in Arc-eligibility Category 1, never production; a deployer signed in as its own Entra account, a member of the instance's Entra admin group, activated under PIM for the change window only, so that `sysadmin`, `ALTER ANY LOGIN` and `CONTROL SERVER` all read 1; Reader on the subscriptions to read Arc; PowerShell 7.1 or later, the SqlServer module (v22 or later), `Az.Accounts`, `Az.ResourceGraph` and the Azure CLI, all signed in to commercial Azure (`AzureCloud`), where a Microsoft 365 GCC (Moderate) tenant's Arc resources live; a filled test settings file with no secret, a reviewed mapping CSV, the exception registry with the break-glass group, and a second person to approve the three hashes.
- **Back it out:** the approved `rollback.sql`, run with `-Apply` under its own change record and in its own run folder, enables the superseded logins and grants `CONNECT SQL` back to the groups, because nothing was dropped. On SQL Server 2025, if Disable SQL Authentication was turned on after the cutover, clearing the checkbox in the portal reverses it.

## Unit 6: Knowledge check

*5 minutes*

1. You run the create with an approved hash that isn't the one `create.sql` hashes to. What happens?
   a. The dry run lists the statements and flags the mismatch.
   b. It is refused before anything connects: re-plan and re-approve.
   c. It runs, and the seal later rejects the stage.

2. You seal the rehearsed test stage, every step present and both `DEPLOY` runs dry runs, without `-Rehearsal`. What does the seal do?
   a. Refuses it, because a `DEPLOY` run wasn't applied, and points you to `-Rehearsal`.
   b. Seals it as a normal test-stage record.
   c. Refuses it as missing PARALLEL.

3. The chain holds only the rehearsal record. What does production preflight report?
   a. Every check passed, since the test stage is sealed.
   b. PF-06 fails: no sealed, non-rehearsal test-stage record for SQLPRD01. Stop here.
   c. PF-06 warns but doesn't stop the run.

4. Preflight on the example settings warns at PF-07: `sa` is still enabled and named `sa`. What does that mean for this change?
   a. Stop the change and disable `sa` first.
   b. It doesn't stop the change; Runbook R05 remediates `sa` on its own track, after another `sysadmin` can sign in.
   c. The cutover disables `sa` along with the superseded logins.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See step 7 of [Chapter 10, Stage 1](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-1-the-test-instance).
2. **a.** See [Chapter 10: go or no-go](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#go-or-no-go).
3. **b.** See [Chapter 10, Stage 2: production](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-2-production).
4. **b.** See step 4 of [Chapter 10, Stage 1](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#stage-1-the-test-instance) and Runbook R05, [the `sa` account](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#the-sa-account).
:::

## Unit 7: Summary

*2 minutes*

You rehearsed one instance's login migration through the test stage, from preflight and the approved hashes to the parallel run, the cutover and its rollback, and sealed it as a rehearsal that production preflight refuses. A real test stage, applied and sealed without `-Rehearsal`, is what lets production start, with the same commands and a different settings file.

**Evidence an ISSO keeps from this module:** `preflight.csv` and its manifest with the deployer's rights read; `plan.json`, the three `.sql` files and the hashes in the change record with the approver; each `deploy` record with mode `applied` and the hash that ran; the rollback dry run, written before the cutover; and `chain.jsonl`, each record holding the SHA-256 of every manifest and the previous record's hash (Chapter 10). Before shipping, work through the [Chapter 10 checklist](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 9](09-closure-drift-and-evidence.md) · [Learning path](index.md) · [Back to the learning path →](index.md)
:::
