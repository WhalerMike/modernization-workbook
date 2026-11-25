---
title: "Chapter 10 — Deploying to Test and Production"
description: "The runbook for Book 06's Runbook R05 with Appendix B's break-glass path: one settings file per environment, preflight PF-01 to PF-07, a plan whose create, cutover and rollback files each carry a SHA-256 a second person approves, the create, the parallel run, the cutover and 30 days of observation, the go/no-go, the sealed test stage (a dry run seals only as a rehearsal), then production with the same commands. Every command is exact; the output shown is the kit's dry run on its example settings, run November 24, 2026; nothing here has been run against a live instance."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 10
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 10 — Deploying to Test and Production

*The same commands twice, with a different settings file, and nothing runs that a second person didn't approve by hash.*

::: {.callout-note}
## In this chapter
The runbook that takes one instance's login migration from plan to production: settings per environment, preflight, the plan and its three hashes, the create, the parallel run of [Chapter 04](04-entra-logins-and-the-parallel-run.md), the cutover, 30 days of observation, the go/no-go, the sealed evidence, then production. It follows [Runbook R05](../../../books/b06-data-platform/r05-login-migration-and-parallel-run.md) and keeps [Appendix B's break-glass design](../../../books/b06-data-platform/appendix-b-ato-kit.md#break-glass-design). It runs the kit's `deploy/` scripts. It is a runbook, not a lab.
:::

::: {.callout-warning}
## Not run against a live instance
Every command below has been run as a dry run on the kit's example settings (`deploy/settings.test.example.json` and `deploy/settings.production.example.json`), and by the kit's Pester tests. None has been run with `-Apply` against a live instance. The output shown is from those dry runs on November 24, 2026; the dates inside it are the fixtures'. Run the test stage first, read every file you approve, and keep the evidence.
:::

## Before you start

**Roles.** The deployer signs in as its own Entra account; no SQL password is used. Creating Entra logins needs `ALTER ANY LOGIN`, or `sysadmin`.[^sq10-tutorial] The plan adds an Entra group to `sysadmin`, which a `sysadmin` member must do,[^sq10-tutorial] and the cutover disables the superseded users and SQL logins and denies `CONNECT SQL` to the superseded Windows groups; disabling a `sysadmin` member and denying a server permission both need `CONTROL SERVER`.[^sq10-alter-login][^sq10-deny-server] So in practice the deployer is a member of the instance's Entra admin group ([Chapter 03](03-arc-and-the-engines-identity.md)), activated under PIM for the change window only ([Building Privileged Access](../privileged-access/index.md)). The reads need the rights `Export-SqlAuditSnapshot.ps1` states, never `sysadmin`. Reading Arc needs Reader on the subscriptions.

**Tools.** PowerShell 7.1 or later, the SqlServer module (v22 or later, for `-Encrypt`), `Az.Accounts` and `Az.ResourceGraph`, and the Azure CLI, all signed in to commercial Azure (`AzureCloud`). A Microsoft 365 GCC (Moderate) tenant's Arc resources are there.

**The token.** `Invoke-SqlDeploy.ps1` and `Invoke-SqlRollback.ps1` pass `-AccessToken` to `Invoke-Sqlcmd`, whose token audience must be `https://database.windows.net/`.[^sq10-entra-sql][^sq10-invoke-sqlcmd] The kit's `-AccessToken` takes either form: the string the Azure CLI's `az account get-access-token` returns,[^sq10-az-token] or the `SecureString` a newer `Get-AzAccessToken` returns as its `Token`,[^sq10-azaccesstoken] which the script converts before it calls `Invoke-Sqlcmd`, itself documented to take a string or a `SecureString`.[^sq10-invoke-sqlcmd] This runbook uses the Azure CLI; `(Get-AzAccessToken -ResourceUrl 'https://database.windows.net/').Token` works in its place.

**Placeholders**, listed once: `<tenant-id>`; `<subscription-id>`; `<test-instance>` and `<production-instance>` (host,port); `<instance-name>` (as the audit names it); `<exceptions-path>` (the environment's exception registry); `<settings-test>` and `<settings-production>` (filled copies of `deploy/settings.template.json`); `<out-test>` and `<out-production>` (output folders outside any repository); `<chain-path>` (the evidence chain both settings files name); `<mapping-csv>` (the reviewed login mapping); `<create-sha256>`, `<cutover-sha256>` and `<rollback-sha256>` (from the plan, approved by a second person); `<change-record-id>`; `<yyyy-MM-dd>`.

## The settings

One file per environment, from `deploy/settings.template.json`, filled at work and kept inside your boundary. No secret goes in it.

| Key | What it holds |
|---|---|
| `environment` | `test` or `production` |
| `cloud` | `AzureCloud` |
| `instance`, `server` | The instance as the audit names it; `host,port` |
| `auditPath`, `arcPath` | This environment's snapshots (step 2) |
| `exceptionsPath`, `mappingPath` | The exception registry; the reviewed mapping CSV |
| `chainPath` | The evidence chain; production's must be the same file as test's |
| `breakGlassLogin` | The break-glass group as the registry names it |
| `approver` | Who approves the hashes |

## Stage 1: the test instance

Work in `examples/sql-server-identity`.

1. **Sign in to commercial Azure:**

   ```powershell
   az cloud set --name AzureCloud
   az login --tenant <tenant-id>
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>
   ```

2. **Snapshot the instance and Arc, and keep the AUDIT and ARC runs** ([Chapters 02](02-the-authentication-audit.md) and [03](03-arc-and-the-engines-identity.md)):

   ```powershell
   ./Export-SqlAuditSnapshot.ps1 -SqlInstance '<test-instance>' -OutputPath <out-test>/snapshots/audit-start.json -AsOf <yyyy-MM-dd>
   ./Export-SqlArcSnapshot.ps1 -SubscriptionId <subscription-id> -OutputPath <out-test>/snapshots/arc.json -AsOf <yyyy-MM-dd>
   ./Invoke-SqlAuthAudit.ps1 -AuditPath <out-test>/snapshots/audit-start.json -OutputPath <out-test>/audit
   ./Invoke-SqlArcCheck.ps1 -AuditPath <out-test>/snapshots/audit-start.json -ArcPath <out-test>/snapshots/arc.json -OutputPath <out-test>/arc
   ```

   Resolve every `highest` and `high` finding first: an enabled `sa`, or a mode changed without a restart. Preflight doesn't read them.

3. **Fill the settings.** Copy the template and fill every `<…>` value; `auditPath` and `arcPath` are step 2's snapshots:

   ```powershell
   Copy-Item deploy/settings.template.json <settings-test>
   ```

4. **Preflight (PRE).** PF-01 settings complete, PF-02 the cloud is `AzureCloud`, PF-03 the instance is Arc-eligibility Category 1, PF-04 the mapping resolves every login, PF-05 the break-glass group is in the registry; for production, PF-06 a sealed test-stage record for this instance that isn't a rehearsal; and PF-07, a warning rather than a failure, when `sa` is still enabled or still named `sa`. It exits 1 on any failure; a warning doesn't stop it:

   ```powershell
   ./deploy/Test-SqlPreflight.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/preflight
   ```

   On the example settings:

   ```text
   Check What                         Result Detail
   ----- ----                         ------ ------
   PF-01 Settings complete            pass   test: SQLPRD01 on sqlprd01.contoso.example,1433
   PF-02 Cloud                        pass   AzureCloud (a GCC Moderate tenant's Arc resources are in AzureCloud, WD-028)
   PF-03 Arc-eligibility Category 1   pass   Category 1: Ready: plan the logins (Chapter 04)
   PF-04 Mapping resolves every login pass   4 mapped; unresolved: none
   PF-05 Break-glass path recorded    pass   CONTOSO\SQL-BreakGlass is in the exception registry
   PF-07 sa disabled and renamed      warn   sa is still enabled or named sa: remediate it on its own track (Runbook R05), after another sysadmin can sign in

   Wrote 2 files and manifest.json to out/test/preflight
   Evidence for PRE (Preflight: settings, cloud, Arc eligibility, mapping, break-glass, sa and the earlier stage's evidence): AC-6, CM-6; KSI-IAM-ELP, KSI-SVC-ACM
   Preflight: every check passed.
   ```

   PF-07's warning is the example's `sa`, still enabled under its own name on day 1. Runbook R05 remediates `sa` on its own track, after another `sysadmin` path works, so it doesn't stop this change. Preflight can't see the deployer's rights, as its help says; read them yourself, as the deployer, after activating the role:

   ```powershell
   $token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
   Invoke-Sqlcmd -ServerInstance '<test-instance>' -AccessToken $token -Encrypt Mandatory -Query "SELECT IS_SRVROLEMEMBER('sysadmin') AS is_sysadmin, HAS_PERMS_BY_NAME(NULL, NULL, 'ALTER ANY LOGIN') AS alter_any_login, HAS_PERMS_BY_NAME(NULL, NULL, 'CONTROL SERVER') AS control_server;"
   ```

   All three should be 1.[^sq10-perms]

5. **Plan (PLAN).** The plan writes `create.sql`, `cutover.sql` and `rollback.sql`, each with its SHA-256 in `plan.json`:

   ```powershell
   ./deploy/New-SqlDeploymentPlan.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/plan
   ```

   ```text
   Phase    Statements Sha256
   -----    ---------- ------
   create           16 deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709
   cutover           5 0a04162bf925eea425ac5a820fcf5e68b2169faf1b996c2acb10c14aec6cbad3
   rollback          5 b2d5964e9a6d29731d139b2b3fc72b59e6748196959142e5f6f521b2863470c8

   Wrote 6 files and manifest.json to out/test/plan
   Evidence for PLAN (Plan the change for one environment, with its hash): CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-RVP
   Approve the create hash, then run: ./deploy/Invoke-SqlDeploy.ps1 -PlanPath out/test/plan -Phase create -ApprovedHash <hash>
   ```

6. **Approve.** A second person reads the three `.sql` files line by line, re-hashes them, and records the three hashes in the change record:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   'create.sql', 'cutover.sql', 'rollback.sql' | ForEach-Object { [pscustomobject]@{ File = $_; Sha256 = Get-SqlFileHash "<out-test>/plan/$_" } } | Format-Table -AutoSize
   ```

   ```text
   File         Sha256
   ----         ------
   create.sql   deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709
   cutover.sql  0a04162bf925eea425ac5a820fcf5e68b2169faf1b996c2acb10c14aec6cbad3
   rollback.sql b2d5964e9a6d29731d139b2b3fc72b59e6748196959142e5f6f521b2863470c8
   ```

   The hash is taken with LF line endings, so it matches on any platform. A different hash means a different file: re-plan and re-approve.

7. **Create (DEPLOY).** The Entra logins and users beside the Windows ones; nothing is disabled. First the dry run, then the change:

   ```powershell
   ./deploy/Invoke-SqlDeploy.ps1 -PlanPath <out-test>/plan -Phase create -ApprovedHash <create-sha256> -OutputPath <out-test>/deploy-create
   $token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
   ./deploy/Invoke-SqlDeploy.ps1 -PlanPath <out-test>/plan -Phase create -ApprovedHash <create-sha256> -OutputPath <out-test>/deploy-create -Apply -AccessToken $token
   ```

   The dry run on the example plan:

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

   Wrote 2 files and manifest.json to out/test/deploy-create
   Evidence for DEPLOY (Run the approved plan): CM-3, AC-2; KSI-CMT-LMC
   ```

   A hash that isn't the approved one stops it before anything connects. PowerShell prints the script line that threw, then this message:

   ```text
   Refused: create.sql hashes to deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709, not the approved 0000000000000000000000000000000000000000000000000000000000000000. Re-plan and re-approve.
   ```

8. **Parallel run (PARALLEL).** Both paths stay open for the window in `config/thresholds.json` (`parallelRunDays`, 30), with SQL Server Audit recording every successful login ([Chapter 04](04-entra-logins-and-the-parallel-run.md)). At the end, snapshot and judge:

   ```powershell
   ./Export-SqlAuditSnapshot.ps1 -SqlInstance '<test-instance>' -OutputPath <out-test>/snapshots/audit-parallel.json -AsOf <yyyy-MM-dd>
   ./Test-SqlParallelRun.ps1 -AuditPath <out-test>/snapshots/audit-parallel.json -Instance <instance-name> -MappingPath <mapping-csv> -OutputPath <out-test>/parallel
   ```

   Go on only when it prints `Cutover-ready: N of N`.

9. **Rollback plan (RB).** Dry-run the way back before the cutover, so its record exists first:

   ```powershell
   ./deploy/Invoke-SqlRollback.ps1 -PlanPath <out-test>/plan -ApprovedHash <rollback-sha256> -OutputPath <out-test>/rollback
   ```

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

   Wrote 2 files and manifest.json to out/test/rollback
   Evidence for RB (Rollback plan): CM-3, CP-2; KSI-CMT-LMC, KSI-RPL-ARP
   ```

10. **Cutover (DEPLOY).** Disable the users and SQL logins, deny `CONNECT SQL` to the groups, never drop, in the window the application owners agreed, with a DBA ready to run step 9 with `-Apply`:

    ```powershell
    ./deploy/Invoke-SqlDeploy.ps1 -PlanPath <out-test>/plan -Phase cutover -ApprovedHash <cutover-sha256> -OutputPath <out-test>/deploy-cutover
    $token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
    ./deploy/Invoke-SqlDeploy.ps1 -PlanPath <out-test>/plan -Phase cutover -ApprovedHash <cutover-sha256> -OutputPath <out-test>/deploy-cutover -Apply -AccessToken $token
    ```

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

    Wrote 2 files and manifest.json to out/test/deploy-cutover
    Evidence for DEPLOY (Run the approved plan): CM-3, AC-2; KSI-CMT-LMC
    ```

    Disabling a login doesn't end sessions already connected;[^sq10-alter-login] end them or wait, and watch the audit. The two groups get `DENY CONNECT SQL` because `ALTER LOGIN … DISABLE` can't deny a Windows group;[^sq10-alter-login][^sq10-deny-server] after the cutover, `sys.server_permissions` should show each group's `CONNECT SQL` as `D`. `CONTOSO\SQL-Admins` is also a `sysadmin` member, and Learn says `DENY` doesn't apply to `sysadmin` members, so the plan drops the group from `sysadmin` first and the rollback adds it back: test both with a member of the group in this test stage before approving them for production ([Chapter 04, Dangers](04-entra-logins-and-the-parallel-run.md#dangers)).

11. **Observe for 30 days** (`observeAfterDisableDays`), with the audit still recording failed logins. Run [Chapter 09](09-closure-drift-and-evidence.md)'s schedule against the instance, and read each closure record and drift list. A failed login on a disabled or denied login from a real application is a rollback trigger.

## Go or no-go

The test stage is a go when all of these hold, and a no-go is a finding with an owner, after which the stage is repeated:

- the preflight passed and the deployer's rights read 1, 1, 1;
- the three hashes in the change record match the files that ran;
- the parallel run printed `Cutover-ready: N of N`;
- 30 days of observation passed with no failed login on a disabled or denied login and no drift row;
- every `DEPLOY` record says `applied`, not `dry run`.

The seal checks the last one itself: it refuses a stage whose `DEPLOY` runs weren't `applied`, unless you seal it with `-Rehearsal`, which records the stage as a rehearsal that production preflight never accepts.

**Seal the stage (EVIDENCE).** The seal re-hashes every run's files, refuses a stage missing a step `config/requirements.json` requires (test: PRE, AUDIT, ARC, PLAN, DEPLOY, PARALLEL), refuses a stage whose `DEPLOY` runs weren't `applied`, records the instance and each run's mode, and appends one record to the chain with the previous record's hash:

```powershell
./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance <instance-name> -RunPaths <out-test>/preflight, <out-test>/audit, <out-test>/arc, <out-test>/plan, <out-test>/deploy-create, <out-test>/parallel, <out-test>/deploy-cutover, <out-test>/rollback -ChainPath <chain-path> -AsOf <yyyy-MM-dd>
```

On the example's runs (sealed with `-AsOf 2026-12-20`), a stage without the parallel run is refused, and so is the full stage, because its deployments were dry runs:

```text
Stage 'test' is missing evidence for: PARALLEL. No record written.
```

```text
Stage 'test' has a DEPLOY run that wasn't applied (dry run). Seal it with -Rehearsal, which preflight never accepts as a stage.
```

**A rehearsal.** A dry run through the whole stage is worth keeping, as a rehearsal. The same command with `-Rehearsal` seals it, marked as one:

```powershell
./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance <instance-name> -RunPaths <out-test>/preflight, <out-test>/audit, <out-test>/arc, <out-test>/plan, <out-test>/deploy-create, <out-test>/parallel, <out-test>/deploy-cutover, <out-test>/rollback -ChainPath <chain-path> -AsOf <yyyy-MM-dd> -Rehearsal
```

```text
Stage    : test (rehearsal)
Instance : SQLPRD01
Steps    : PRE, AUDIT, ARC, PLAN, DEPLOY, PARALLEL, DEPLOY, RB
Record   : 7da3923c168740d3
Previous : (first)
Sealed the test stage as a rehearsal in out/evidence/chain.jsonl
```

The record in `chain.jsonl` carries `"rehearsal":true` and each run's mode (`"mode":"dry run"` for the two `DEPLOY` runs).

## Stage 2: production

The same steps 1 to 11 with `<production-instance>`, `<settings-production>` and `<out-production>`. The production settings name the same `chainPath`, and preflight adds PF-06: it fails until the chain holds a test-stage record for the same instance that isn't a rehearsal. Against the example's chain, which holds only the rehearsal above:

```powershell
./deploy/Test-SqlPreflight.ps1 -SettingsPath <settings-production> -OutputPath <out-production>/preflight
```

```text
Check What                         Result Detail
----- ----                         ------ ------
PF-01 Settings complete            pass   production: SQLPRD01 on sqlprd01.contoso.example,1433
PF-02 Cloud                        pass   AzureCloud (a GCC Moderate tenant's Arc resources are in AzureCloud, WD-028)
PF-03 Arc-eligibility Category 1   pass   Category 1: Ready: plan the logins (Chapter 04)
PF-04 Mapping resolves every login pass   4 mapped; unresolved: none
PF-05 Break-glass path recorded    pass   CONTOSO\SQL-BreakGlass is in the exception registry
PF-06 Test stage sealed            FAIL   no sealed (non-rehearsal) test-stage record for SQLPRD01 in out/evidence/chain.jsonl
PF-07 sa disabled and renamed      warn   sa is still enabled or named sa: remediate it on its own track (Runbook R05), after another sysadmin can sign in

Wrote 2 files and manifest.json to out/production/preflight
Evidence for PRE (Preflight: settings, cloud, Arc eligibility, mapping, break-glass, sa and the earlier stage's evidence): AC-6, CM-6; KSI-IAM-ELP, KSI-SVC-ACM
Preflight: 1 check(s) failed. Stop here.
```

After a real test stage, with every `DEPLOY` run `applied`, is sealed without `-Rehearsal`, PF-06 passes and its detail names that record (`test record` and the first 16 characters of its `recordSha256`); the authors haven't produced one, because nothing here has run with `-Apply`. PF-06 matches the stage and the instance, not the change, so confirm in the change record that the record it names is this change's. After the 30-day observation, run the closure record on the production instance ([Chapter 09](09-closure-drift-and-evidence.md)); production's seal also requires CLOSURE:

```powershell
./Invoke-SqlClosure.ps1 -AuditPath <out-production>/snapshots/audit-observed.json -ExceptionsPath <exceptions-path> -ArcPath <out-production>/snapshots/arc.json -OutputPath <out-production>/closure
./deploy/Invoke-SqlEvidence.ps1 -Stage production -Instance <instance-name> -RunPaths <out-production>/preflight, <out-production>/audit, <out-production>/arc, <out-production>/plan, <out-production>/deploy-create, <out-production>/parallel, <out-production>/deploy-cutover, <out-production>/rollback, <out-production>/closure -ChainPath <chain-path> -AsOf <yyyy-MM-dd>
```

Here `audit-observed.json` is the snapshot at the end of the observation.

## Rollback

**Triggers**, set before the change, from R05: any failed login on a just-disabled or just-denied login from a production application; any job or linked server failing to connect; an application owner reporting an outage traced to the cutover. Any one restores the legacy logins and stops the stage.

**The way back** is the approved `rollback.sql`. The superseded users and SQL logins were disabled and the groups denied `CONNECT SQL`; nothing was dropped and their database users are still there, so `ENABLE` and `GRANT CONNECT SQL` open both paths again at once:

```powershell
$token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
./deploy/Invoke-SqlRollback.ps1 -PlanPath <out-test>/plan -ApprovedHash <rollback-sha256> -OutputPath <out-test>/rollback-applied -Apply -AccessToken $token
```

A rollback is a change: it gets its own change record and its own run folder. On SQL Server 2025, if Disable SQL Authentication was turned on after the cutover, clearing the checkbox in the portal reverses it, under Azure role-based access control rather than a SQL connection.[^sq10-disable]

**When Entra can't be reached**, the token step fails and nothing above runs. Appendix B's path is the registered break-glass Windows group, empty by default, with every membership change alerting; and if every `sysadmin` path is lost, a member of the host's local Administrators can start the instance in single-user mode and connect as `sysadmin`.[^sq10-lockout]

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | FedRAMP 20x KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| PRE: preflight (step 4) | AC-6, CM-6 | KSI-IAM-ELP, KSI-SVC-ACM | `preflight.csv` and manifest; the deployer's rights read |
| PLAN: plan and approval (steps 5, 6) | CM-3, CM-4 | KSI-CMT-LMC, KSI-CMT-RVP | `plan.json`, the three `.sql` files, and the hashes in the change record with the approver |
| DEPLOY: create and cutover (steps 7, 10) | CM-3, AC-2 | KSI-CMT-LMC | Each `deploy` record with mode `applied` and the hash that ran |
| RB: rollback plan (step 9) | CM-3, CP-2 | KSI-CMT-LMC, KSI-RPL-ARP | The rollback dry run, written before the cutover |
| EVIDENCE: the seal | CA-7, AU-9 | KSI-MLA-EVC, KSI-MLA-OSM | `chain.jsonl`, each record with the SHA-256 of every manifest and the previous record's hash |

The stage also seals AUDIT, ARC, PARALLEL and, for production, CLOSURE, whose pairs are in [Chapters 02](02-the-authentication-audit.md), [03](03-arc-and-the-engines-identity.md), [04](04-entra-logins-and-the-parallel-run.md) and [09](09-closure-drift-and-evidence.md). These records support the controls listed and provide evidence for the change; the agency's assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers, framed as in [Chapter 07](07-the-application-chain.md).

## Checklist

- [ ] One settings file per environment, with no secret, kept outside any repository.
- [ ] Every `highest` and `high` audit finding resolved before preflight.
- [ ] Preflight passed, and the deployer's rights were read, for each stage; PF-06 passed for production.
- [ ] A second person approved each of the three hashes in the change record.
- [ ] The deployer's role was active for the window only.
- [ ] The rollback dry run exists before each cutover.
- [ ] The test stage was sealed without `-Rehearsal` (every `DEPLOY` run `applied`); a rehearsal record never stands in for it, and PF-06 named the right record.
- [ ] After each cutover, every superseded group's `CONNECT SQL` reads `D` in `sys.server_permissions`, and the `sysadmin` group's role removal and deny were tested with a member.
- [ ] The break-glass group was tested (a member added and removed under change) before the cutover.

::: {.callout-tip}
## Continue the book
[← Chapter 09 — Closure, Drift and Evidence](09-closure-drift-and-evidence.md) · [Workbook index](index.md)
:::

[^sq10-tutorial]: Microsoft Learn, "Set up Microsoft Entra Authentication with App Registration - SQL Server enabled by Azure Arc," section "Create logins and users" (`ALTER ANY LOGIN` or `sysadmin` to create Entra logins; `sp_addsrvrolemember` by a `sysadmin` member), <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> (accessed Nov 24, 2026).
[^sq10-alter-login]: Microsoft Learn, "ALTER LOGIN (Transact-SQL)," arguments ENABLE | DISABLE, Remarks and Permissions, <https://learn.microsoft.com/sql/t-sql/statements/alter-login-transact-sql> (accessed Nov 24, 2026).
[^sq10-deny-server]: Microsoft Learn, "DENY Server Permissions (Transact-SQL)," syntax (a login mapped to a Windows group), Remarks (`CONNECT SQL`; current database `master`) and Permissions (`CONTROL SERVER`); and "DENY (Transact-SQL)," which doesn't apply to `sysadmin` members, <https://learn.microsoft.com/sql/t-sql/statements/deny-server-permissions-transact-sql> and <https://learn.microsoft.com/sql/t-sql/statements/deny-transact-sql> (accessed Nov 24, 2026).
[^sq10-azaccesstoken]: Microsoft Learn, "Get-AzAccessToken (Az.Accounts)," `-ResourceUrl` and the `SecureString` token in newer releases, <https://learn.microsoft.com/powershell/module/az.accounts/get-azaccesstoken> (accessed Nov 24, 2026).
[^sq10-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server overview," section "Access token," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Nov 24, 2026).
[^sq10-invoke-sqlcmd]: Microsoft Learn, "Invoke-Sqlcmd (SqlServer)," parameters `-AccessToken` (a string or a `SecureString`) and `-Encrypt` (Mandatory, Optional, Strict; new in v22), <https://learn.microsoft.com/powershell/module/sqlserver/invoke-sqlcmd> (accessed Nov 24, 2026).
[^sq10-az-token]: Microsoft Learn, "az account," `az account get-access-token` (`--resource`), <https://learn.microsoft.com/cli/azure/account#az-account-get-access-token> (accessed Nov 24, 2026).
[^sq10-perms]: Microsoft Learn, "HAS_PERMS_BY_NAME (Transact-SQL)," <https://learn.microsoft.com/sql/t-sql/functions/has-perms-by-name-transact-sql> (accessed Nov 24, 2026).
[^sq10-disable]: Microsoft Learn, "Disable SQL Authentication - SQL Server enabled by Azure Arc," sections "Prepare your environment" and "Disable SQL authentication," <https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication> (accessed Nov 24, 2026).
[^sq10-lockout]: Microsoft Learn, "Connect to SQL Server When System Administrators Are Locked Out," Resolution, <https://learn.microsoft.com/sql/database-engine/configure-windows/connect-to-sql-server-when-system-administrators-are-locked-out> (accessed Nov 24, 2026).
