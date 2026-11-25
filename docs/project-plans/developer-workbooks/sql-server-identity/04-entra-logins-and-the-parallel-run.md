---
title: "Chapter 04 — Entra Logins and the Parallel Run"
description: "Runbook R05 as code: a login plan that writes one instance's Entra logins, database users and role memberships as reviewable T-SQL, with a cutover that disables users and SQL logins and denies CONNECT SQL to Windows groups, never dropping anything, a rollback that restores both, warnings where a principal would break one group, one role, and a judge that reads an audit snapshot and says, login by login, whether the parallel run's exit criteria hold or the login is already cut over. Labs on the fictional estate's day-1 and day-30 snapshots, then a create script run on a test instance and backed out."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 4
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 04 — Entra Logins and the Parallel Run

*Add the Entra login beside the Windows one, prove it works, and only then turn the old one off.*

::: {.callout-note}
## In this chapter
The code behind [Book 06, Chapter 11](../../../books/b06-data-platform/11-three-principal-types.md)'s parallel run, [Chapter 12](../../../books/b06-data-platform/12-the-engine-authentication-decision.md)'s Decision 2, and [Runbook R05](../../../books/b06-data-platform/r05-login-migration-and-parallel-run.md). You start with what Learn gives you: the `CREATE LOGIN … FROM EXTERNAL PROVIDER` and `CREATE USER … FROM LOGIN` syntax, what `ALTER LOGIN … DISABLE` does and doesn't do, and the `DENY CONNECT SQL` the kit uses for a Windows group instead. Then you read the kit's login plan and its parallel-run judge. Lab 1 writes SQLPRD01's plan, shows an unmapped login, and judges the day-1 and day-30 snapshots. Lab 2 runs a create script on a test instance, validates one Entra sign-in, and backs it out.
:::

## Goal and audience

**Goal.** By the end of this chapter you can turn a reviewed login mapping into T-SQL that a change board can read line by line, and say from evidence, not silence, whether each legacy login is ready to be disabled.

**Audience.** Developers who build or maintain the kit, the DBA who owns the instance, and the identity engineer who owns the mapping. You don't need an instance until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

`CREATE LOGIN [name] FROM EXTERNAL PROVIDER` maps a login to a Microsoft Entra user, group or application on Arc-enabled SQL Server 2022 and later. The name must match the display name of an existing Entra principal in the tenant the instance is enabled with; for a user it's the user principal name.[^sq04-create-login] [^sq04-tutorial] An Entra login for a user or application shows as type `E` (`EXTERNAL_LOGIN`) in `sys.server_principals`, and one for a group as type `X` (`EXTERNAL_GROUP`).[^sq04-principals] `CREATE USER [name] FROM LOGIN [name]` makes the database user. Any Entra account with `ALTER ANY LOGIN` can create Entra logins; otherwise a `sysadmin` must.[^sq04-tutorial] Every Entra connection is encrypted, so clients must trust the instance's certificate.[^sq04-tutorial] Failover cluster instances don't support Entra authentication.[^sq04-overview]

For the cutover, `ALTER LOGIN … DISABLE` keeps the login and its permissions, and `ENABLE` turns it back on. Disabling doesn't affect sessions already connected. Learn also says `ALTER LOGIN` with `DISABLE` can't deny access to a Windows group: it returns error 15151 by design. Disabling a login that is a `sysadmin` member needs `CONTROL SERVER`.[^sq04-alter-login] `DROP LOGIN` fails while the login is connected, and dropping a login that still has database users leaves them orphaned.[^sq04-drop-login]

For a Windows group, the server permission is the lever. `DENY` on a server permission takes a login mapped to a Windows group as its grantee, `CONNECT SQL` is one of the server permissions it can deny, server-scope permissions are denied only while the current database is `master`, and denying needs `CONTROL SERVER`.[^sq04-deny-server] `GRANT` takes the same grantees; the grantor needs the permission with `GRANT OPTION` or a higher one, and a `sysadmin` member can grant any permission.[^sq04-grant-server] A `DENY` also stops a principal inheriting the permission through its group or role memberships, and it doesn't apply to members of the `sysadmin` fixed server role.[^sq04-deny]

For the observation, `sys.dm_exec_connections.auth_scheme` gives the SQL Server or Windows authentication scheme of each connection; reading it needs `VIEW SERVER PERFORMANCE STATE` on SQL Server 2022 and later.[^sq04-connections] A connection made on the server itself always reports NTLM.[^sq04-auth-type] SQL Server Audit's `SUCCESSFUL_LOGIN_GROUP` and `FAILED_LOGIN_GROUP` record logins, including connections reused from a pool.[^sq04-audit]

### What it leaves to you

Each row is pinned by a test in the `Chapter 04` block of `tests/SqlIdentity.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| One `CREATE LOGIN` per principal, by hand | Twenty Windows logins become a typing exercise, and a typo becomes a login for nobody | `New-SqlLoginPlan`: each Entra principal once, idempotent (`IF NOT EXISTS`), names escaped |
| `CREATE USER … FROM LOGIN` | A login grants nothing inside a database; the Windows user's roles have to be copied | A database user beside each mapped Windows or SQL user, with the same role memberships |
| Nothing about which logins to leave out | `sa` and `NT SERVICE\…` aren't migration targets | Built-in principals and `sa` left out; an unmapped login written as `UNRESOLVED`, never guessed |
| `DISABLE` and `ENABLE`, which can't deny a Windows group | A dropped login can't be rolled back, and a group line that fails leaves the group's way in open | A cutover that disables users and SQL logins and denies `CONNECT SQL` to groups, and a rollback that enables and grants it back; nothing is dropped |
| `auth_scheme` per connection | A snapshot shows sessions; nobody says what "ready" means | `Test-SqlParallelRun`: R05's three exit criteria per legacy login, local sessions left out |

## The code

### The login plan

`New-SqlLoginPlan` reads one instance from an audit snapshot and the reviewed mapping CSV (`WindowsLogin, EntraPrincipal, EntraType, Note`). The legacy set is every enabled type `U`, `G` or `S` login that isn't `sa` and doesn't match `builtinLoginPattern` in `config/thresholds.json`. It returns five things: the create script, the cutover, the rollback, the list of unresolved logins, and warnings. `New-SqlLoginPlan.ps1` writes the three scripts as `<instance>-create.sql`, `-cutover.sql` and `-rollback.sql`, writes `plan.csv` and `plan.json`, prints the create script's SHA-256, which is what [Chapter 10](10-deploying-to-test-and-production.md) approves, and prints each warning as a `Warning: …` line. It executes nothing.

**The cutover.** A Windows user or SQL login is disabled (`ALTER LOGIN … DISABLE`) and the rollback enables it, as [Runbook R05, Step 4](../../../books/b06-data-platform/r05-login-migration-and-parallel-run.md#step-4--cutover) shows for the user `CONTOSO\jdoe`; that stays right for users. A Windows group can't be disabled that way (Learn: error 15151), so the kit writes `DENY CONNECT SQL TO [group];` for a type `G` login, and the rollback writes `GRANT CONNECT SQL TO [group];`. Both keep the login, its server roles and its database users, so the rollback is as immediate as R05's.

**The warnings.** [Book 06, Chapter 16](../../../books/b06-data-platform/16-groups-roles-and-membership.md#one-group-one-role) gives each Entra group exactly one role, on one database, in one environment. The plan warns when the mapping would give a principal more than one database role, and when it would give one `db_owner` or `sysadmin`. A warning doesn't stop the plan: it's for the identity engineer to split the group or record why not.

Server roles are mirrored with `ALTER SERVER ROLE`, database roles with `ALTER ROLE`. Explicit permissions, default schemas and object ownership aren't mirrored; R05 Step 2's queries read them, and the DBA adds them by hand.

### The parallel-run judge

`Test-SqlParallelRun` reads a snapshot taken during the parallel run and judges each mapping row against R05's exit criteria: the Entra principal is seen connecting, no remote NTLM remains on the legacy login, and nothing still arrives only on the legacy login. Local sessions are left out, because they always report NTLM. It reports `Ready` and a reason; it never disables anything. It also reads the legacy login's state: a login that is still usable and ready says "exit criteria met: cut over (disable or deny), then observe 30 days"; one already disabled, or denied `CONNECT SQL`, says "already cut over (disabled or denied): observe 30 days, then drop", R05's order.

::: {.callout-important}
## Illustrative code
Lab 1 reads fixtures; nothing connects. Tested against fixtures, not a live instance. The T-SQL the plan writes changes logins; it runs only in Lab 2, on a test instance, and in Chapter 10 with an approved hash.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/sql-server-identity`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Write SQLPRD01's login plan
./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/logins

# Step 2: Read the cutover and the rollback
Get-Content out/logins/sqlprd01-cutover.sql, out/logins/sqlprd01-rollback.sql

# Step 3: Leave one login out of the mapping
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$audit = Read-SqlJson tests/fixtures/audit-day1/audit.json
$short = Import-Csv tests/fixtures/mapping/sqlprd01-mapping.csv | Where-Object WindowsLogin -ne 'payroll_report'
$plan = New-SqlLoginPlan -Instance $audit.instances[0] -Mapping $short
$plan.Create | Select-String UNRESOLVED
$plan.Cutover

# Step 4: Judge day 1
./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/parallel-day1

# Step 5: Judge day 30
./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/parallel-day30

# Step 6: Open the manifest
Get-Content out/parallel-day30/manifest.json

# Step 7: Re-hash the plan
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
Test-SqlManifest -OutputPath out/logins | Format-Table

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 04*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Write SQLPRD01's login plan.** Four legacy logins map to four Entra principals; `SQL-DBA-Admins` gets `sysadmin` because `CONTOSO\SQL-Admins` had it:

   ```powershell
   ./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/logins
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

   Wrote 5 files and manifest.json to out/logins
   Evidence for LOGINS (Plan the Entra logins and database users (dry run)): AC-2, IA-2, CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-RVP
   Create script SHA-256: deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709
   Warning: payroll-web-mi would hold 3 database roles (Payroll:db_datareader, Payroll:db_datawriter, Payroll:db_executor): Book 06, Chapter 16 gives each group one role on one database
   Warning: SQL-DBA-Admins would hold db_owner or sysadmin: confirm it's needed (Chapter 16)
   Warning: SQL-Payroll-Users would hold 3 database roles (Payroll:db_datareader, Payroll:db_datawriter, PayrollArchive:db_datareader): Book 06, Chapter 16 gives each group one role on one database
   ```

   <!-- capture:begin 04-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-1.txt))](captures/04-1.png){.lightbox fig-alt="Terminal window showing ./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Insta… and what it printed"}

   <!-- capture:end -->

   `sa` and `NT SERVICE\MSSQLSERVER` aren't in it. The three warnings are Book 06, Chapter 16's rule applied to the fixture's mapping: `payroll-web-mi` and `SQL-Payroll-Users` would each hold three roles, and `SQL-DBA-Admins` would hold `sysadmin`. The plan is still written; splitting the groups, or recording why not, is the identity engineer's call before the mapping is approved.

2. **Read the cutover and the rollback.** Users and SQL logins are disabled, groups lose `CONNECT SQL`; the rollback reverses each, and nothing is dropped:

   ```powershell
   Get-Content out/logins/sqlprd01-cutover.sql, out/logins/sqlprd01-rollback.sql
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

   <!-- capture:begin 04-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-2.txt))](captures/04-2.png){.lightbox fig-alt="Terminal window showing Get-Content out/logins/sqlprd01-cutover.sql, out/logins/sqlprd01-rollback.sql and what it printed"}

   <!-- capture:end -->

   `CONTOSO\PayrollUsers` and `CONTOSO\SQL-Admins` are Windows groups, so their lines are `DENY CONNECT SQL` and `GRANT CONNECT SQL`: `ALTER LOGIN … DISABLE` can't deny a Windows group,[^sq04-alter-login] and a server-permission `DENY` can.[^sq04-deny-server] `CONTOSO\SQL-Admins` is also a `sysadmin` member, and `DENY` doesn't apply to members of `sysadmin`,[^sq04-deny] so the cutover takes the group out of the role first and the rollback puts it back; read its row in [Dangers](#dangers).

3. **Leave one login out of the mapping.** The plan writes it as `UNRESOLVED` and leaves it out of the cutover:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   $audit = Read-SqlJson tests/fixtures/audit-day1/audit.json
   $short = Import-Csv tests/fixtures/mapping/sqlprd01-mapping.csv | Where-Object WindowsLogin -ne 'payroll_report'
   $plan = New-SqlLoginPlan -Instance $audit.instances[0] -Mapping $short
   $plan.Create | Select-String UNRESOLVED
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

   <!-- capture:begin 04-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-3.txt))](captures/04-3.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

4. **Judge day 1.** Nothing connects through Entra yet, so nothing is ready:

   ```powershell
   ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/parallel-day1
   ```

   ```text
   Legacy               Entra                 LegacySessions EntraSessions Ready Why
   ------               -----                 -------------- ------------- ----- ---
   CONTOSO\PayrollUsers SQL-Payroll-Users                 12             0 False Entra principal not seen connecting; still arrives only on the legacy login
   CONTOSO\svc-payroll  payroll-web-mi                    41             0 False Entra principal not seen connecting; 41 remote NTLM sessions; still arrives only
                                                                                 on the legacy login
   CONTOSO\SQL-Admins   SQL-DBA-Admins                     0             0 False Entra principal not seen connecting
   payroll_report       payroll-reporting-app              3             0 False Entra principal not seen connecting; still arrives only on the legacy login

   Wrote 2 files and manifest.json to out/parallel-day1
   Evidence for PARALLEL (Judge the parallel run against its exit criteria): AC-2, CA-7; KSI-MLA-EVC
   Cutover-ready: 0 of 4: keep the parallel run going
   ```

   <!-- capture:begin 04-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-4.txt))](captures/04-4.png){.lightbox fig-alt="Terminal window showing ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -In… and what it printed"}

   <!-- capture:end -->

   `CONTOSO\SQL-Admins` shows 0 legacy sessions: its one session was local, and local sessions don't count.

5. **Judge day 30.** Every Entra principal is seen and no legacy session remains:

   ```powershell
   ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/parallel-day30
   ```

   ```text
   Legacy               Entra                 LegacySessions EntraSessions Ready Why
   ------               -----                 -------------- ------------- ----- ---
   CONTOSO\PayrollUsers SQL-Payroll-Users                  0            11  True already cut over (disabled or denied): observe 30 days, then drop
   CONTOSO\svc-payroll  payroll-web-mi                     0            44  True already cut over (disabled or denied): observe 30 days, then drop
   CONTOSO\SQL-Admins   SQL-DBA-Admins                     0             2  True already cut over (disabled or denied): observe 30 days, then drop
   payroll_report       payroll-reporting-app              0             3  True already cut over (disabled or denied): observe 30 days, then drop

   Wrote 2 files and manifest.json to out/parallel-day30
   Evidence for PARALLEL (Judge the parallel run against its exit criteria): AC-2, CA-7; KSI-MLA-EVC
   Cutover-ready: 4 of 4: every exit criterion met
   ```

   <!-- capture:begin 04-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-5.txt))](captures/04-5.png){.lightbox fig-alt="Terminal window showing ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -I… and what it printed"}

   <!-- capture:end -->

   The day-30 snapshot is after the cutover: `CONTOSO\svc-payroll` and `payroll_report` are disabled, and the two groups are denied `CONNECT SQL` (`hasConnectSql` false). The judge reads that state and says what R05 says comes next: observe 30 days, then drop. Nothing has been dropped yet.

6. **Open the manifest.** It names the step, its controls and KSIs, and the SHA-256 of each file:

   ```powershell
   Get-Content out/parallel-day30/manifest.json
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

   <!-- capture:begin 04-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-6.txt))](captures/04-6.png){.lightbox fig-alt="Terminal window showing Get-Content out/parallel-day30/manifest.json and what it printed"}

   <!-- capture:end -->

7. **Re-hash the plan.** The hash a reviewer approves is the hash of the files on disk:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   Test-SqlManifest -OutputPath out/logins | Format-Table
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

   <!-- capture:begin 04-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-7.txt))](captures/04-7.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

8. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 04*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
            11           0
   ```

   <!-- capture:begin 04-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-8.txt))](captures/04-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 04*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 04-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/04-9.txt))](captures/04-9.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test instance

**The authors haven't run this lab.** Use a test instance, never production: SQL Server 2022 or later, not a failover cluster instance, Arc-enabled, with Entra authentication configured and an Entra admin set ([Chapter 03](03-arc-and-the-engines-identity.md), [Runbook R04](../../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md)), and a certificate your client trusts. You need PowerShell 7 with the `SqlServer` module (version 22 or later) and `Az.Accounts`; a Windows login with the read rights `Export-SqlAuditSnapshot.ps1` states; the Entra admin account; and a test user who is a member of the test Entra group. Choose a Windows login on the instance that holds no server role, so the plan grants nothing privileged. Work in `examples/sql-server-identity`, all steps in one PowerShell session. You'll replace: `<tenant-id>`, `<test-server>` (host and port, `sqltest01.contoso.example,1433`), `<instance>` (the name the snapshot gives it, `SQLTEST01`), `<windows-login>` (the legacy login) and `<entra-group>` (the test Entra group's display name).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Set the names and sign in to commercial Azure as the Entra admin
$server = '<test-server>'; $instance = '<instance>'; $group = '<entra-group>'
$create = "out/lab2/logins/$($instance.ToLowerInvariant())-create.sql"
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>

# Step 2: Take a read-only snapshot
./Export-SqlAuditSnapshot.ps1 -SqlInstance $server -OutputPath out/lab2/audit-before.json -AsOf (Get-Date -Format yyyy-MM-dd)

# Step 3: Write a one-row mapping and the plan
"WindowsLogin,EntraPrincipal,EntraType,Note`n<windows-login>,$group,group,Lab 2 test mapping" | Set-Content out/lab2/mapping.csv
./New-SqlLoginPlan.ps1 -AuditPath out/lab2/audit-before.json -Instance $instance -MappingPath out/lab2/mapping.csv -OutputPath out/lab2/logins

# Step 4: Read the create script before running it
Get-Content $create

# Step 5: Run the create script on the test instance
$token = (Get-AzAccessToken -ResourceUrl 'https://database.windows.net/' -AsSecureString).Token
Invoke-Sqlcmd -ServerInstance $server -InputFile $create -AccessToken $token -Encrypt Mandatory
Invoke-Sqlcmd -ServerInstance $server -AccessToken $token -Encrypt Mandatory -Query "SELECT name, type, type_desc, is_disabled FROM sys.server_principals WHERE type IN ('E','X');"

# Step 6: Validate one real Entra sign-in
Disconnect-AzAccount
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>
$userToken = (Get-AzAccessToken -ResourceUrl 'https://database.windows.net/' -AsSecureString).Token
Invoke-Sqlcmd -ServerInstance $server -AccessToken $userToken -Encrypt Mandatory -Query "SELECT SUSER_SNAME() AS who, ORIGINAL_LOGIN() AS original_login, c.auth_scheme FROM sys.dm_exec_connections AS c WHERE c.session_id = @@SPID;"

# Step 7: Judge the run
./Export-SqlAuditSnapshot.ps1 -SqlInstance $server -OutputPath out/lab2/audit-after.json -AsOf (Get-Date -Format yyyy-MM-dd)
./Test-SqlParallelRun.ps1 -AuditPath out/lab2/audit-after.json -Instance $instance -MappingPath out/lab2/mapping.csv -OutputPath out/lab2/parallel

# Step 8: Back it out
Disconnect-AzAccount
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>
$token = (Get-AzAccessToken -ResourceUrl 'https://database.windows.net/' -AsSecureString).Token
$dbs = Select-String -Path $create -Pattern '^USE \[(.+)\];' | ForEach-Object { $_.Matches[0].Groups[1].Value } | Where-Object { $_ -ne 'master' }
foreach ($db in $dbs) { Invoke-Sqlcmd -ServerInstance $server -Database $db -AccessToken $token -Encrypt Mandatory -Query "DROP USER IF EXISTS [$group];" }
Invoke-Sqlcmd -ServerInstance $server -AccessToken $token -Encrypt Mandatory -Query "IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$group') DROP LOGIN [$group];"
Disconnect-AzAccount
Remove-Item -Recurse -Force out/lab2
```

:::

<!-- labs:end -->

1. **Set the names and sign in to commercial Azure as the Entra admin:**

   ```powershell
   $server = '<test-server>'; $instance = '<instance>'; $group = '<entra-group>'
   $create = "out/lab2/logins/$($instance.ToLowerInvariant())-create.sql"
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>
   ```

2. **Take a read-only snapshot,** as the Windows login with the read rights:

   ```powershell
   ./Export-SqlAuditSnapshot.ps1 -SqlInstance $server -OutputPath out/lab2/audit-before.json -AsOf (Get-Date -Format yyyy-MM-dd)
   ```

3. **Write a one-row mapping and the plan:**

   ```powershell
   "WindowsLogin,EntraPrincipal,EntraType,Note`n<windows-login>,$group,group,Lab 2 test mapping" | Set-Content out/lab2/mapping.csv
   ./New-SqlLoginPlan.ps1 -AuditPath out/lab2/audit-before.json -Instance $instance -MappingPath out/lab2/mapping.csv -OutputPath out/lab2/logins
   ```

   Every other enabled Windows or SQL login on the instance appears as `UNRESOLVED`. That's expected here: only the one row is in scope.

4. **Read the create script before running it.** Check that it creates one login and one user per database, and no server role:

   ```powershell
   Get-Content $create
   ```

5. **Run the create script on the test instance,** as the Entra admin. This is the only step that changes anything:

   ```powershell
   $token = (Get-AzAccessToken -ResourceUrl 'https://database.windows.net/' -AsSecureString).Token
   Invoke-Sqlcmd -ServerInstance $server -InputFile $create -AccessToken $token -Encrypt Mandatory
   Invoke-Sqlcmd -ServerInstance $server -AccessToken $token -Encrypt Mandatory -Query "SELECT name, type, type_desc, is_disabled FROM sys.server_principals WHERE type IN ('E','X');"
   ```

   The group's login shows as type `X`.

6. **Validate one real Entra sign-in,** as the test user (R05's "validate"). Sign out, sign in as the member, and read the session's own row:

   ```powershell
   Disconnect-AzAccount
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>
   $userToken = (Get-AzAccessToken -ResourceUrl 'https://database.windows.net/' -AsSecureString).Token
   Invoke-Sqlcmd -ServerInstance $server -AccessToken $userToken -Encrypt Mandatory -Query "SELECT SUSER_SNAME() AS who, ORIGINAL_LOGIN() AS original_login, c.auth_scheme FROM sys.dm_exec_connections AS c WHERE c.session_id = @@SPID;"
   ```

   Record the `auth_scheme` value you see. Learn doesn't list the value an Entra connection reports, and R05 asks you to confirm it before encoding it in exit criteria.

7. **Judge the run.** Take a second snapshot and run the judge on it:

   ```powershell
   ./Export-SqlAuditSnapshot.ps1 -SqlInstance $server -OutputPath out/lab2/audit-after.json -AsOf (Get-Date -Format yyyy-MM-dd)
   ./Test-SqlParallelRun.ps1 -AuditPath out/lab2/audit-after.json -Instance $instance -MappingPath out/lab2/mapping.csv -OutputPath out/lab2/parallel
   ```

   A snapshot is a moment. The judge sees the Entra principal only if a session is open when the snapshot runs; R05's SQL Server Audit is how a real parallel run is observed.

8. **Back it out.** Close the member's sessions, sign in as the Entra admin again, drop the database users the script created, then the login, and delete the files. The Windows login was never touched:

   ```powershell
   Disconnect-AzAccount
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>
   $token = (Get-AzAccessToken -ResourceUrl 'https://database.windows.net/' -AsSecureString).Token
   $dbs = Select-String -Path $create -Pattern '^USE \[(.+)\];' | ForEach-Object { $_.Matches[0].Groups[1].Value } | Where-Object { $_ -ne 'master' }
   foreach ($db in $dbs) { Invoke-Sqlcmd -ServerInstance $server -Database $db -AccessToken $token -Encrypt Mandatory -Query "DROP USER IF EXISTS [$group];" }
   Invoke-Sqlcmd -ServerInstance $server -AccessToken $token -Encrypt Mandatory -Query "IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$group') DROP LOGIN [$group];"
   Disconnect-AzAccount
   Remove-Item -Recurse -Force out/lab2
   ```

   `DROP LOGIN` fails while the login is connected;[^sq04-drop-login] if it does, wait for the member's session to close and run that line again.

## Verified facts

| Item | Value | Source |
|---|---|---|
| `FROM EXTERNAL PROVIDER` | Arc-enabled SQL Server 2022 and later; name matches an Entra principal's display name (a user's UPN); `WITH OBJECT_ID` from SQL Server 2025 | [^sq04-create-login] [^sq04-tutorial] |
| Who can create Entra logins | An Entra account with `ALTER ANY LOGIN`, otherwise `sysadmin` | [^sq04-tutorial] |
| Login types | `E` `EXTERNAL_LOGIN` (user or application), `X` `EXTERNAL_GROUP` | [^sq04-principals] |
| Failover cluster instances | Entra authentication not supported | [^sq04-overview] |
| `ALTER LOGIN … DISABLE` | Connected sessions unaffected; can't deny a Windows group (error 15151); `CONTROL SERVER` for a `sysadmin` member | [^sq04-alter-login] |
| `DENY CONNECT SQL` | Grantee may be a login mapped to a Windows group; server scope only in `master`; needs `CONTROL SERVER` | [^sq04-deny-server] |
| `GRANT CONNECT SQL` | Same grantees; grantor holds the permission `WITH GRANT OPTION` or a higher one; `sysadmin` can grant any | [^sq04-grant-server] |
| `DENY` precedence | Blocks inheriting the permission through group or role membership; doesn't apply to `sysadmin` members or object owners | [^sq04-deny] |
| Adding to a fixed server role | Member of that role or of `sysadmin` | [^sq04-server-role] |
| `DROP LOGIN`, `DROP USER IF EXISTS` | Not while connected; mapped users become orphaned; drop users first | [^sq04-drop-login] [^sq04-drop-user] |
| `auth_scheme` | Documented only as the SQL Server or Windows scheme; `VIEW SERVER PERFORMANCE STATE` on 2022 and later; local connections report NTLM | [^sq04-connections] [^sq04-auth-type] |
| Login audit | `SUCCESSFUL_LOGIN_GROUP`, `FAILED_LOGIN_GROUP`, pooled connections included | [^sq04-audit] |
| Token for Lab 2 | Audience `https://database.windows.net/`; `Get-AzAccessToken` returns a `SecureString`; `Invoke-Sqlcmd -AccessToken` takes one; `-Encrypt` defaults to `Mandatory` in version 22 | [^sq04-overview] [^sq04-azaccesstoken] [^sq04-invoke-sqlcmd] |

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 controls it supports | FedRAMP 20x KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| LOGINS: the plan (Lab 1, steps 1 to 3 and 7; Lab 2, steps 3 and 4) | AC-2, CM-3, CM-4 | KSI-CMT-LMC, KSI-CMT-RVP | The reviewed create, cutover and rollback scripts, `plan.csv`, the mapping and the manifest with each SHA-256 |
| LOGINS: the plan | IA-2 | — | The same scripts, showing each person's access moves to an Entra principal |
| PARALLEL: the judge (Lab 1, steps 4 to 6; Lab 2, steps 6 and 7) | AC-2, CA-7 | KSI-MLA-EVC | `parallel.csv` per snapshot with its manifest, and the SQL Server Audit files R05 keeps for the window |

The kit's records support these controls and provide evidence for them; the agency still sets each control's parameters, policy and procedures, and the assessor decides whether each is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with what its providers report and doesn't report KSIs itself. IA-2 has no KSI pairing in the kit's `config/requirements.json`.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A Windows group in the cutover | `ALTER LOGIN … DISABLE` would fail with error 15151 and leave the group's way in open | The kit writes `DENY CONNECT SQL` for a type `G` login and `GRANT CONNECT SQL` to roll back; check with `sys.server_permissions` after the cutover that the group's `CONNECT SQL` state is `D` |
| A denied group that is a `sysadmin` member | Learn says `DENY` doesn't apply to members of `sysadmin`, so `DENY CONNECT SQL` alone wouldn't stop `CONTOSO\SQL-Admins` | The kit drops the group from `sysadmin` before the deny and adds it back in the rollback. Not tested by the authors: test both on a test instance with a member of the group before approving |
| A member reaches the instance by another path | `DENY` also blocks the permission a member would inherit through the group, so a person in a denied group who connects through another Windows login is refused too; a person with their own login and no group path isn't touched | R05 Step 4: list every Windows path a principal has, cut over each, and confirm in the audit that none remains |
| A wrong mapping | Access lands on the wrong people, or nobody | The reviewed mapping; `UNRESOLVED` lines; R05's create-then-validate order |
| Disabling while sessions are open | Disabling doesn't end them; the legacy path looks closed and isn't | `KILL` or wait; the 30-day observation with `FAILED_LOGIN_GROUP` |
| A snapshot read as the whole window | A nightly job that missed the snapshot is cut off | SQL Server Audit for the whole window, as R05 says; the judge is a check on top |
| Dropping too soon | The rollback is gone | The kit never writes `DROP`; drop only after 30 days' observation |
| Explicit permissions not mirrored | The Entra user can connect but can't run the job | R05 Step 2's permission query, mirrored by hand and reviewed |

## Checklist

- [ ] The mapping names every legacy login, or records why it isn't migrated.
- [ ] The create script was read line by line, and its SHA-256 matches the approved one.
- [ ] Each Entra principal was validated with a real sign-in before any legacy login was touched.
- [ ] The parallel run's evidence is SQL Server Audit for the whole window, not one snapshot.
- [ ] Every group line in the cutover is `DENY CONNECT SQL`, every group line in the rollback is `GRANT CONNECT SQL`, and a group in `sysadmin` was tested with a member on a test instance first.
- [ ] Every `Warning:` line from the plan was answered: the group split, or the reason for keeping it recorded.
- [ ] Nothing is dropped until 30 days after the disable or deny.

::: {.callout-tip}
## Continue the book
[← Chapter 03 — Arc and the Engine's Identity](03-arc-and-the-engines-identity.md) · [Workbook index](index.md) · [Next: Chapter 05 — Groups, Roles and the Perimeter →](05-groups-roles-and-the-perimeter.md)
:::

[^sq04-create-login]: Microsoft Learn, "CREATE LOGIN (Transact-SQL)," arguments *login_name*, `FROM EXTERNAL PROVIDER` and `WITH OBJECT_ID`, <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> (accessed Nov 24, 2026).
[^sq04-tutorial]: Microsoft Learn, "Set up Microsoft Entra authentication with app registration - SQL Server enabled by Azure Arc," section "Create logins and users," <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> (accessed Nov 24, 2026).
[^sq04-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Nov 24, 2026).
[^sq04-overview]: Microsoft Learn, "Microsoft Entra authentication for SQL Server" (SQL Server 2022 and later; failover cluster instances not supported; token audience), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Nov 24, 2026).
[^sq04-alter-login]: Microsoft Learn, "ALTER LOGIN (Transact-SQL)," argument `ENABLE | DISABLE`, Remarks and Permissions, <https://learn.microsoft.com/sql/t-sql/statements/alter-login-transact-sql> (accessed Nov 24, 2026).
[^sq04-deny-server]: Microsoft Learn, "DENY Server Permissions (Transact-SQL)," syntax (`SQL_Server_login_mapped_to_Windows_group`), Remarks (`CONNECT SQL`, current database `master`) and Permissions, <https://learn.microsoft.com/sql/t-sql/statements/deny-server-permissions-transact-sql> (accessed Nov 24, 2026).
[^sq04-grant-server]: Microsoft Learn, "GRANT Server Permissions (Transact-SQL)," syntax, Remarks and Permissions, <https://learn.microsoft.com/sql/t-sql/statements/grant-server-permissions-transact-sql> (accessed Nov 24, 2026).
[^sq04-deny]: Microsoft Learn, "DENY (Transact-SQL)," summary (precedence; `sysadmin` members and object owners), <https://learn.microsoft.com/sql/t-sql/statements/deny-transact-sql> (accessed Nov 24, 2026).
[^sq04-server-role]: Microsoft Learn, "ALTER SERVER ROLE (Transact-SQL)," Permissions, fixed server roles, <https://learn.microsoft.com/sql/t-sql/statements/alter-server-role-transact-sql> (accessed Nov 24, 2026).
[^sq04-drop-login]: Microsoft Learn, "DROP LOGIN (Transact-SQL)," Remarks, <https://learn.microsoft.com/sql/t-sql/statements/drop-login-transact-sql> (accessed Nov 24, 2026).
[^sq04-drop-user]: Microsoft Learn, "DROP USER (Transact-SQL)," syntax (`IF EXISTS`) and Remarks, <https://learn.microsoft.com/sql/t-sql/statements/drop-user-transact-sql> (accessed Nov 24, 2026).
[^sq04-connections]: Microsoft Learn, "sys.dm_exec_connections (Transact-SQL)," column `auth_scheme` and Permissions, <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql> (accessed Nov 24, 2026).
[^sq04-auth-type]: Microsoft Learn, "How to determine if the authentication type is Kerberos" (local connections always report NTLM), <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> (accessed Nov 24, 2026).
[^sq04-audit]: Microsoft Learn, "SQL Server Audit action groups and actions," `SUCCESSFUL_LOGIN_GROUP` and `FAILED_LOGIN_GROUP`, <https://learn.microsoft.com/sql/relational-databases/security/auditing/sql-server-audit-action-groups-and-actions> (accessed Nov 24, 2026).
[^sq04-azaccesstoken]: Microsoft Learn, "Get-AzAccessToken" (Az.Accounts; `-ResourceUrl`, `-AsSecureString`; default output now `SecureString`), <https://learn.microsoft.com/powershell/module/az.accounts/get-azaccesstoken> (accessed Nov 24, 2026).
[^sq04-invoke-sqlcmd]: Microsoft Learn, "Invoke-Sqlcmd" (SqlServer module; `-AccessToken` takes a string or `SecureString`; `-Encrypt` defaults to `Mandatory`, new in version 22; `-InputFile`), <https://learn.microsoft.com/powershell/module/sqlserver/invoke-sqlcmd> (accessed Nov 24, 2026).
