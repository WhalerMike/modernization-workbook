---
title: "Data Platform, Module 4: Entra Logins and the Parallel Run"
subtitle: "Add the Entra login beside the Windows one, prove it works, and only then turn the old one off"
description: "Module 4 of the Data Platform and SQL Server Identity learning path. You learn the three Entra principal types a SQL Server login can map to, how a reviewed mapping becomes create, cutover and rollback scripts, and how the parallel run decides from evidence when a legacy login is ready to turn off. Lab 1 writes SQLPRD01's login plan, shows an unmapped login, and judges the day-1 and day-30 snapshots. Runbook R05; workbook Chapter 04."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 4
date-modified: 2026-11-25
review-status: approved
reviewed-sha256: 95146e5855d2492284ab97719899d801f9cc2fac3d7080c3c13126c3e1087fd7
last-reviewed: 2026-11-25
---
# Data Platform, Module 4: Entra Logins and the Parallel Run {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 4 of 10 · 60 minutes · Runbook [R05](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md) · Workbook [Chapter 04](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

This is the migration itself. On a Category 1 instance, every Windows and SQL login gets an Entra login beside it, the new login is proven with a real sign-in, and only then is the old one disabled, observed for 30 days and dropped. A wrong mapping locks people out, and a dropped login can't be rolled back, so the plan is written as reviewable T-SQL that executes nothing, and readiness is judged from evidence, not silence. In this module you write a fictional instance's plan and judge its parallel run on day 1 and day 30.

**The federal requirement.** [Chapter 04's table](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#federal-requirements-and-evidence) maps the login plan to NIST SP 800-53 AC-2, CM-3 and CM-4, with KSI-CMT-LMC and KSI-CMT-RVP, and to IA-2, which has no KSI pairing in the kit; and the parallel-run judge to AC-2 and CA-7, with KSI-MLA-EVC. Runbook R05's [control states, change safety and evidence](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#b06-r05-control-states) sets the rings and the evidence for the cutover itself. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The kit's records support these controls; the agency still sets each control's parameters, policy and procedures.

### Learning objectives

In this module, you'll:

- Name the three Entra principal types a `FROM EXTERNAL PROVIDER` login maps to, and the login type each shows in `sys.server_principals`.
- Turn a reviewed mapping into create, cutover and rollback scripts, and say why a Windows group is denied `CONNECT SQL` instead of disabled.
- State the parallel run's order and its exit criteria, and why local sessions don't count.
- Judge a parallel run from snapshots, and say what comes after the disable.

### Prerequisites

- [Module 3](03-arc-and-the-engines-identity.md).

## Unit 2: Principals and the plan

*10 minutes*

`CREATE LOGIN … FROM EXTERNAL PROVIDER` maps a login to an Entra user (by UPN), a security group or an application (by display name); users and applications show as type `E`, groups as type `X`. Group logins are the target, because they remove per-user churn, and an application's SQL login with a stored password becomes an Entra application login, preferably a managed identity. The engine has no MFA logic: Conditional Access decides before the token is issued. The kit's plan reads one instance from the audit snapshot and the reviewed mapping, leaves out `sa` and built-in principals, writes an unmapped login as `UNRESOLVED` instead of guessing, and mirrors server and database roles. It warns when a principal would hold more than one database role, or `db_owner` or `sysadmin`. It executes nothing. Read:

- [Book 06, Chapter 11](../../books/b06-data-platform/11-three-principal-types.md), *Three Principal Types*: [the FROM EXTERNAL PROVIDER syntax](../../books/b06-data-platform/11-three-principal-types.md#the-from-external-provider-syntax), [Type 1: Entra user login](../../books/b06-data-platform/11-three-principal-types.md#type-1-entra-user-login), [Type 2: Entra group login](../../books/b06-data-platform/11-three-principal-types.md#type-2-entra-group-login) and [Type 3: Entra service principal login](../../books/b06-data-platform/11-three-principal-types.md#type-3-entra-service-principal-login).
- Runbook R05's [preconditions](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#preconditions), [Step 1](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-1-generate-the-login-statements-dry-run-first) and [Step 2](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-2-create-the-entra-database-users-beside-the-windows-users).
- [Chapter 04: the login plan](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#the-login-plan).

## Unit 3: The parallel run

*10 minutes*

The order is create, validate, disable, observe for 30 days, then drop, and it's required for production. While both logins work, the exit criteria are that every application and job also appears on its Entra login, no remote NTLM remains, and nothing still arrives only on the legacy login. Connections made on the server itself always report NTLM, so they don't count. A snapshot is a moment; SQL Server Audit's `SUCCESSFUL_LOGIN_GROUP` records the whole window. The cutover disables a Windows user or SQL login, and the rollback enables it; a Windows group can't be disabled that way, so the kit denies it `CONNECT SQL` and the rollback grants it back. Nothing is dropped. `sa` is disabled and renamed, never migrated. The kit's judge reports readiness per legacy login and never disables anything. Read:

- [Book 06, Chapter 11: the parallel-run migration pattern](../../books/b06-data-platform/11-three-principal-types.md#the-parallel-run-migration-pattern).
- [Book 06, Chapter 12](../../books/b06-data-platform/12-the-engine-authentication-decision.md), *What the Engine-Authentication Decision Settles*: [Decision 2](../../books/b06-data-platform/12-the-engine-authentication-decision.md#decision-2-the-parallel-run-sequence-is-required) and [Decision 3](../../books/b06-data-platform/12-the-engine-authentication-decision.md#decision-3-sql-authentication-eliminated-sa-disabled-and-renamed).
- Runbook R05's [Step 3, the parallel run](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-3-the-parallel-run), [Step 4, cutover](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-4-cutover), [rollback](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#rollback) and [the `sa` account](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#the-sa-account).
- [Chapter 04: the parallel-run judge](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#the-parallel-run-judge) and [dangers](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*30 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-04-entra-logins-and-the-parallel-run\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Write SQLPRD01's login plan
./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\logins"

# Step 2: Read the cutover and the rollback
Get-Content "$Run\logins\sqlprd01-cutover.sql", "$Run\logins\sqlprd01-rollback.sql"

# Step 3: Leave one login out of the mapping
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$audit = Read-SqlJson tests/fixtures/audit-day1/audit.json
$short = Import-Csv tests/fixtures/mapping/sqlprd01-mapping.csv | Where-Object WindowsLogin -ne 'payroll_report'
$plan = New-SqlLoginPlan -Instance $audit.instances[0] -Mapping $short
($plan.Create | Select-String UNRESOLVED).Line
$plan.Cutover

# Step 4: Judge day 1
./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\parallel-day1"

# Step 5: Judge day 30
./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\parallel-day30"

# Step 6: Open the manifest
Get-Content "$Run\parallel-day30\manifest.json"

# Step 7: Re-hash the plan
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
Test-SqlManifest -OutputPath "$Run\logins" | Format-Table

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 04*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# Step 9: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-04-entra-logins-and-the-parallel-run\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 04, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-04-entra-logins-and-the-parallel-run\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-04-entra-logins-and-the-parallel-run\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Write SQLPRD01's login plan.** Four legacy logins map to four Entra principals; `SQL-DBA-Admins` gets `sysadmin` because `CONTOSO\SQL-Admins` had it:

   ```powershell
   ./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\logins"
   ```

   ```text
   -- Login plan for SQLPRD01. Dry run: review every line; nothing here has run.
   USE master;
   GO
   IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'payroll-reporting-app')
       CREATE LOGIN [payroll-reporting-app] FROM EXTERNAL PROVIDER;
   GO
   IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'payroll-web-mi')
       CREATE LOGIN [payroll-web-mi] FROM EXTERNAL PROVIDER;
   GO
   IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'SQL-DBA-Admins')
       CREATE LOGIN [SQL-DBA-Admins] FROM EXTERNAL PROVIDER;
   ALTER SERVER ROLE [sysadmin] ADD MEMBER [SQL-DBA-Admins];
   GO
   IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'SQL-Payroll-Users')
       CREATE LOGIN [SQL-Payroll-Users] FROM EXTERNAL PROVIDER;
   GO
   USE [Payroll];
   GO
   IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'payroll-reporting-app')
       CREATE USER [payroll-reporting-app] FROM LOGIN [payroll-reporting-app];
   ALTER ROLE [db_datareader] ADD MEMBER [payroll-reporting-app];
   IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'payroll-web-mi')
       CREATE USER [payroll-web-mi] FROM LOGIN [payroll-web-mi];
   ALTER ROLE [db_datareader] ADD MEMBER [payroll-web-mi];
   ALTER ROLE [db_datawriter] ADD MEMBER [payroll-web-mi];
   ALTER ROLE [db_executor] ADD MEMBER [payroll-web-mi];
   IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'SQL-Payroll-Users')
       CREATE USER [SQL-Payroll-Users] FROM LOGIN [SQL-Payroll-Users];
   ALTER ROLE [db_datareader] ADD MEMBER [SQL-Payroll-Users];
   ALTER ROLE [db_datawriter] ADD MEMBER [SQL-Payroll-Users];
   GO
   USE [PayrollArchive];
   GO
   IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'SQL-Payroll-Users')
       CREATE USER [SQL-Payroll-Users] FROM LOGIN [SQL-Payroll-Users];
   ALTER ROLE [db_datareader] ADD MEMBER [SQL-Payroll-Users];
   GO


   Instance MappedLogins EntraPrincipals Unresolved
   -------- ------------ --------------- ----------
   SQLPRD01            4               4 none

   Wrote 5 files and manifest.json to C:/FMWLabs/results/data-platform-04-entra-logins-and-the-parallel-run/lab1/<run>/logins
   Evidence for LOGINS (Plan the Entra logins and database users (dry run)): AC-2, IA-2, CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-RVP
   Create script SHA-256: deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709
   Warning: payroll-web-mi would hold 3 database roles (Payroll:db_datareader, Payroll:db_datawriter, Payroll:db_executor): Book 06, Chapter 16 gives each group one role on one database
   Warning: SQL-DBA-Admins would hold db_owner or sysadmin: confirm it's needed (Chapter 16)
   Warning: SQL-Payroll-Users would hold 3 database roles (Payroll:db_datareader, Payroll:db_datawriter, PayrollArchive:db_datareader): Book 06, Chapter 16 gives each group one role on one database
   ```

   `sa` and `NT SERVICE\MSSQLSERVER` aren't in it. The three warnings are Book 06, Chapter 16's rule applied to the fixture's mapping: `payroll-web-mi` and `SQL-Payroll-Users` would each hold three roles, and `SQL-DBA-Admins` would hold `sysadmin`. The plan is still written; splitting the groups, or recording why not, is the identity engineer's call before the mapping is approved.

2. **Read the cutover and the rollback.** Users and SQL logins are disabled, groups lose `CONNECT SQL`; the rollback reverses each, and nothing is dropped:

   ```powershell
   Get-Content "$Run\logins\sqlprd01-cutover.sql", "$Run\logins\sqlprd01-rollback.sql"
   ```

   ```text
   USE master;
   GO
   DENY CONNECT SQL TO [CONTOSO\PayrollUsers];  -- group: superseded by SQL-Payroll-Users
   ALTER LOGIN [CONTOSO\svc-payroll] DISABLE;  -- superseded by payroll-web-mi
   ALTER LOGIN [payroll_report] DISABLE;  -- superseded by payroll-reporting-app
   ALTER SERVER ROLE [sysadmin] DROP MEMBER [CONTOSO\SQL-Admins];  -- DENY doesn't bind sysadmin members
   DENY CONNECT SQL TO [CONTOSO\SQL-Admins];  -- group: superseded by SQL-DBA-Admins
   GO
   USE master;
   GO
   GRANT CONNECT SQL TO [CONTOSO\PayrollUsers];
   ALTER LOGIN [CONTOSO\svc-payroll] ENABLE;
   ALTER LOGIN [payroll_report] ENABLE;
   GRANT CONNECT SQL TO [CONTOSO\SQL-Admins];
   ALTER SERVER ROLE [sysadmin] ADD MEMBER [CONTOSO\SQL-Admins];
   GO
   ```

   `CONTOSO\PayrollUsers` and `CONTOSO\SQL-Admins` are Windows groups, so their lines are `DENY CONNECT SQL` and `GRANT CONNECT SQL`: `ALTER LOGIN … DISABLE` can't deny a Windows group, and a server-permission `DENY` can. `CONTOSO\SQL-Admins` is also a `sysadmin` member, and `DENY` doesn't apply to members of `sysadmin`, so the cutover takes the group out of the role first and the rollback puts it back. Chapter 04's [Dangers](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#dangers) has that row, and its [Verified facts](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#verified-facts) cite Microsoft Learn for each rule.

3. **Leave one login out of the mapping.** The plan writes it as `UNRESOLVED` and leaves it out of the cutover:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   $audit = Read-SqlJson tests/fixtures/audit-day1/audit.json
   $short = Import-Csv tests/fixtures/mapping/sqlprd01-mapping.csv | Where-Object WindowsLogin -ne 'payroll_report'
   $plan = New-SqlLoginPlan -Instance $audit.instances[0] -Mapping $short
   ($plan.Create | Select-String UNRESOLVED).Line
   $plan.Cutover
   ```

   ```text
   -- UNRESOLVED: payroll_report (S): map it, or record why it isn't migrated
   USE master;
   GO
   DENY CONNECT SQL TO [CONTOSO\PayrollUsers];  -- group: superseded by SQL-Payroll-Users
   ALTER LOGIN [CONTOSO\svc-payroll] DISABLE;  -- superseded by payroll-web-mi
   ALTER SERVER ROLE [sysadmin] DROP MEMBER [CONTOSO\SQL-Admins];  -- DENY doesn't bind sysadmin members
   DENY CONNECT SQL TO [CONTOSO\SQL-Admins];  -- group: superseded by SQL-DBA-Admins
   GO
   ```

4. **Judge day 1.** Nothing connects through Entra yet, so nothing is ready:

   ```powershell
   ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\parallel-day1"
   ```

   ```text
   Legacy               Entra                 LegacySessions EntraSessions Ready Why
   ------               -----                 -------------- ------------- ----- ---
   CONTOSO\PayrollUsers SQL-Payroll-Users                 12             0 False Entra principal not seen connecting; still arrives only on the legacy login
   CONTOSO\svc-payroll  payroll-web-mi                    41             0 False Entra principal not seen connecting; 41 remote NTLM sessions; still arrives only on the legacy login
   CONTOSO\SQL-Admins   SQL-DBA-Admins                     0             0 False Entra principal not seen connecting
   payroll_report       payroll-reporting-app              3             0 False Entra principal not seen connecting; still arrives only on the legacy login

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-04-entra-logins-and-the-parallel-run/lab1/<run>/parallel-day1
   Evidence for PARALLEL (Judge the parallel run against its exit criteria): AC-2, CA-7; KSI-MLA-EVC
   Cutover-ready: 0 of 4: keep the parallel run going
   ```

   `CONTOSO\SQL-Admins` shows 0 legacy sessions: its one session was local, and local sessions don't count.

5. **Judge day 30.** Every Entra principal is seen and no legacy session remains:

   ```powershell
   ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath "$Run\parallel-day30"
   ```

   ```text
   Legacy               Entra                 LegacySessions EntraSessions Ready Why
   ------               -----                 -------------- ------------- ----- ---
   CONTOSO\PayrollUsers SQL-Payroll-Users                  0            11  True already cut over (disabled or denied): observe 30 days, then drop
   CONTOSO\svc-payroll  payroll-web-mi                     0            44  True already cut over (disabled or denied): observe 30 days, then drop
   CONTOSO\SQL-Admins   SQL-DBA-Admins                     0             2  True already cut over (disabled or denied): observe 30 days, then drop
   payroll_report       payroll-reporting-app              0             3  True already cut over (disabled or denied): observe 30 days, then drop

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-04-entra-logins-and-the-parallel-run/lab1/<run>/parallel-day30
   Evidence for PARALLEL (Judge the parallel run against its exit criteria): AC-2, CA-7; KSI-MLA-EVC
   Cutover-ready: 4 of 4: every exit criterion met
   ```

   The day-30 snapshot is after the cutover: `CONTOSO\svc-payroll` and `payroll_report` are disabled, and the two groups are denied `CONNECT SQL` (`hasConnectSql` false). The judge reads that state and says what R05 says comes next: observe 30 days, then drop. Nothing has been dropped yet.

6. **Open the manifest.** It names the step, its controls and KSIs, and the SHA-256 of each file:

   ```powershell
   Get-Content "$Run\parallel-day30\manifest.json"
   ```

   ```text
   {
     "step": "PARALLEL",
     "title": "Judge the parallel run against its exit criteria",
     "mode": "read-only",
     "asOf": "2026-12-20",
     "controls": [
       "AC-2",
       "CA-7"
     ],
     "ksis": [
       "KSI-MLA-EVC"
     ],
     "files": [
       {
         "file": "parallel.csv",
         "sha256": "490883551938ba52b8b555aba926ee195f40df206157296184c1bfb838a481d1"
       },
       {
         "file": "parallel.json",
         "sha256": "dd26856210cc9e210f69ec416c62f86c8a79b7ff7b239eb41eda978ab28bbdc7"
       }
     ]
   }
   ```

7. **Re-hash the plan.** The hash a reviewer approves is the hash of the files on disk:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   Test-SqlManifest -OutputPath "$Run\logins" | Format-Table
   ```

   ```text
   File                  Recorded     Now          Match
   ----                  --------     ---          -----
   plan.csv              757a194ad93b 757a194ad93b  True
   plan.json             0186896b0845 0186896b0845  True
   sqlprd01-create.sql   deed30db5ccc deed30db5ccc  True
   sqlprd01-cutover.sql  0a04162bf925 0a04162bf925  True
   sqlprd01-rollback.sql b2d5964e9a6d b2d5964e9a6d  True
   ```

8. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 04*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
            11           0
   ```

9. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-04-entra-logins-and-the-parallel-run\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can read SQLPRD01's create, cutover and rollback scripts line by line, say why its two Windows groups are denied `CONNECT SQL` instead of disabled, and say what the judge reports on day 1 and on day 30.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Write a one-row mapping for one Windows login on a test instance, read the create script, and run it as the Entra admin. Then sign in as a member of the test Entra group, validate a real Entra connection, and judge the run. The create script is the only step that changes anything. Follow [Chapter 04, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#lab-2-a-test-instance).

- **You need:** a test instance, never production: SQL Server 2022 or later, not a failover cluster instance, Arc-enabled in a commercial Azure (`AzureCloud`) test subscription, which is where a Microsoft 365 GCC (Moderate) tenant's Arc resources live, with Entra authentication configured and an Entra admin set (Module 3) and a certificate your client trusts. You also need PowerShell 7 with the `SqlServer` module (version 22 or later) and `Az.Accounts`; a Windows login with the exporter's read rights; the Entra admin account; a test user who is a member of the test Entra group; and a legacy Windows login on the instance that holds no server role.
- **Back it out:** step 8 signs in as the Entra admin, drops the database users the script created, then the login, and deletes the lab's files. The Windows login was never touched. `DROP LOGIN` fails while the login is connected; wait for the member's session to close and run that line again.

## Unit 6: Knowledge check

*5 minutes*

1. Why does SQLPRD01's cutover write `DENY CONNECT SQL TO [CONTOSO\PayrollUsers]` instead of `ALTER LOGIN … DISABLE`?
   a. `ALTER LOGIN … DISABLE` can't deny a Windows group (error 15151), and a server-permission `DENY` can.
   b. A `DENY` also drops the group's database users.
   c. Groups are dropped at cutover, not disabled.

2. You leave `payroll_report` out of the mapping. What does the plan do?
   a. It guesses the nearest Entra application.
   b. It writes `payroll_report` as `UNRESOLVED` and leaves it out of the cutover.
   c. It refuses to write any script.

3. On day 1, the judge shows 0 legacy sessions for `CONTOSO\SQL-Admins`. Why?
   a. The group was already denied `CONNECT SQL`.
   b. The snapshot couldn't read the group.
   c. Its one session was local, and local sessions always report NTLM, so they don't count.

4. A legacy login has been disabled at cutover. When can it be dropped?
   a. Right away, since the rollback no longer needs it
   b. After 30 days' observation, when the audit record, with failed logins for the disabled login, shows nothing still depends on it
   c. Only when the instance is retired

::: {.callout-tip collapse="true"}
## Check your answers
1. **a.** See [Chapter 04: the login plan](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#the-login-plan) and step 2 of its [Lab 1](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#lab-1-fixtures-no-tenant).
2. **b.** See step 3 of [Chapter 04, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#lab-1-fixtures-no-tenant).
3. **c.** See step 4 of [Chapter 04, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#lab-1-fixtures-no-tenant) and R05's [Step 3, the parallel run](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-3-the-parallel-run).
4. **b.** See R05's [Step 4, cutover](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-4-cutover) and [Book 06, Chapter 11: the parallel-run migration pattern](../../books/b06-data-platform/11-three-principal-types.md#the-parallel-run-migration-pattern).
:::

## Unit 7: Summary

*2 minutes*

You learned how a reviewed mapping becomes Entra logins beside the Windows ones, and how the parallel run decides from evidence when a legacy login can be turned off. You wrote a fictional instance's plan and judged its parallel run before and after the cutover.

**Evidence an ISSO keeps from this module:** the reviewed create, cutover and rollback scripts, `plan.csv`, the mapping and the manifest with each file's SHA-256, the hash a reviewer approves; and `parallel.csv` for each snapshot with its manifest, kept with the SQL Server Audit files R05 keeps for the window (Chapter 04). Before shipping, work through the [Chapter 04 checklist](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 3](03-arc-and-the-engines-identity.md) · [Learning path](index.md) · [Next: Module 5, Groups, roles and the perimeter →](05-groups-roles-and-the-perimeter.md)
:::
