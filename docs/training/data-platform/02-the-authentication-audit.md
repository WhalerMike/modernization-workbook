---
title: "Data Platform, Module 2: The Authentication Audit"
subtitle: "Before a login moves, every surviving instance gets a record of who can sign in and how"
description: "Module 2 of the Data Platform and SQL Server Identity learning path. You learn what the authentication audit reads on each surviving instance, how its findings are ranked, and how the Arc-eligibility categories drive what happens next. Lab 1 audits a fictional snapshot of four instances, reads the manifest and reruns the audit thirty days later. Runbook R03; workbook Chapter 02."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 2
date-modified: 2026-11-25
review-status: pending
---
# Data Platform, Module 2: The Authentication Audit {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 2 of 10 · 50 minutes · Runbook [R03](../../books/b06-data-platform/r03-the-authentication-audit.md) · Workbook [Chapter 02](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Module 1 decided which instances survive. Now you measure how each survivor authenticates: its mode, every usable login by type, the state of `sa`, and the account the engine runs as. Every later step, Arc, login migration and NTLM elimination, depends on that record, and it's re-run after every change to measure progress. In this module you audit four fictional instances, rank their findings, and rerun the audit thirty days later.

**The federal requirement.** [Chapter 02's table](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#federal-requirements-and-evidence) maps the login census to NIST SP 800-53 AC-2, with KSI-PIY-GIV and KSI-IAM-SNU; the `sa`, SQL login and service-account findings to IA-5, with KSI-IAM-SNU; and the mode findings to CM-6, with KSI-SVC-ACM. Runbook R03 is read-only from start to finish, and its output [feeds continuous-monitoring closure](../../books/b06-data-platform/r03-the-authentication-audit.md#feeding-continuous-monitoring-closure). Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The run's files support these controls; the agency still sets each control's parameters, policy and procedures.

### Learning objectives

In this module, you'll:

- Explain what the audit reads on each instance, and why it runs only on what Module 1 retained or chose as a target.
- Rank the audit's findings, from an enabled `sa` down to the Arc-eligibility category.
- Say what each Arc-eligibility category means for the next step, and why engine Entra authentication doesn't wait for OS-level Entra sign-in.
- Explain why a single audit run can't show drift, and where the engine's service account goes.

### Prerequisites

- [Module 1](01-the-estate-and-the-consolidation-gate.md).

## Unit 2: What the audit reads

*9 minutes*

The audit runs only on instances classified retain or consolidation target. For each, it reads the authentication mode, enumerates the logins from `sys.server_principals` by type (`U`, `G`, `S`, and the Entra types `E` and `X`), flags the `sa` account, and captures the engine's service account and its SPN. The running mode and the registry `LoginMode` are read in different places, and a change takes effect only after a restart, so the two can disagree; the kit reports that as a `Mode anomaly`. A reader without the right permissions gets a short login list and no error, so a short list means a missing permission, not a clean instance. The kit's census leaves out built-in principals and counts only usable logins. Read:

- [Book 06, Chapter 07](../../books/b06-data-platform/07-the-authentication-audit.md), *The Authentication Audit*: [scope of the enumeration](../../books/b06-data-platform/07-the-authentication-audit.md#scope-of-the-enumeration), [authentication-mode configuration](../../books/b06-data-platform/07-the-authentication-audit.md#authentication-mode-configuration), [login type classification](../../books/b06-data-platform/07-the-authentication-audit.md#login-type-classification) and [service-account identity and SPN registration](../../books/b06-data-platform/07-the-authentication-audit.md#service-account-identity-and-spn-registration).
- Runbook R03's [primary script](../../books/b06-data-platform/r03-the-authentication-audit.md#the-primary-script-spec3-d1.8-get-sqlserverauthaudit.ps1) and its [failure modes](../../books/b06-data-platform/r03-the-authentication-audit.md#failure-modes).
- [Chapter 02: the census](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#the-census) and [the findings](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#the-findings).

## Unit 3: Reading the audit

*9 minutes*

The audit's most consequential output is the Arc-eligibility category. Category 1 is ready for Entra logins now; Category 2 needs Arc deployed and Entra authentication configured first; Category 3 is a version before SQL Server 2022, or a failover cluster instance on any version, and must upgrade, re-platform or carry a dated exception. Within Category 2, instances with many Windows logins, active SQL logins or missing SPNs go first. Engine Entra authentication (Layer 1) proceeds on a domain-joined host and never waits for OS-level Entra sign-in (Layer 2). The kit settles only the first pass here, Category 3 or "1 or 2"; Module 3 settles the rest. It names the engine's service account and stops: converting a user account used as a service belongs to the service account guide. Read:

- [Book 06, Chapter 07: the Arc-eligibility output](../../books/b06-data-platform/07-the-authentication-audit.md#the-arc-eligibility-output).
- [Book 06, Chapter 08](../../books/b06-data-platform/08-reading-the-audit.md), *Reading the Audit*: [Category 1](../../books/b06-data-platform/08-reading-the-audit.md#interpreting-category-1-entra-auth-ready), [Category 2](../../books/b06-data-platform/08-reading-the-audit.md#interpreting-category-2-arc-eligible-but-not-enabled), [Category 3](../../books/b06-data-platform/08-reading-the-audit.md#interpreting-category-3-version-upgrade-required) and [the SQL engine versus OS Entra sign-in distinction](../../books/b06-data-platform/08-reading-the-audit.md#the-sql-engine-versus-os-entra-sign-in-distinction).
- Runbook R03's [reading the result: migration readiness](../../books/b06-data-platform/r03-the-authentication-audit.md#reading-the-result-migration-readiness).
- [Chapter 02: the service account goes to another plan](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#the-service-account-goes-to-another-plan) and [dangers](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*22 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-02\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Read the four audited instances
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
(Read-SqlJson tests/fixtures/audit-day1/audit.json).instances | Select-Object name, productVersion, isIntegratedSecurityOnly, registryLoginMode, isClustered, serviceAccount | Format-Table

# Step 2: Run the audit
./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath "$Run\audit"

# Step 3: Open the manifest
Get-Content "$Run\audit\manifest.json"

# Step 4: Count the findings by severity
Import-Csv "$Run\audit\findings.csv" | Group-Object Severity | Select-Object Name, Count

# Step 5: Rerun the audit on day 30
./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -OutputPath "$Run\audit-day30"

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 02*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# Step 7: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-02\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 02, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-02\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-02\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way. Where an expected output starts with `Exception:`, PowerShell also prints the script line that threw, above the message shown. In a clone of the repository, work in `examples/sql-server-identity` instead of the kit's folder.

1. **Read the four audited instances.** Only the instances Chapter 01 retained are audited:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   (Read-SqlJson tests/fixtures/audit-day1/audit.json).instances | Select-Object name, productVersion, isIntegratedSecurityOnly, registryLoginMode, isClustered, serviceAccount | Format-Table
   ```

   ```text
   name     productVersion isIntegratedSecurityOnly registryLoginMode isClustered serviceAccount
   ----     -------------- ------------------------ ----------------- ----------- --------------
   SQLPRD01 16.0.4135.4                           0                 1           0 CONTOSO\svc-sqlprd01
   SQLPRD02 16.0.4135.4                           1                 1           0 CONTOSO\svc-sqlprd02
   SQLFCI04 15.0.4375.4                           0                 2           1 CONTOSO\svc-sqlfci04
   SQLPRD06 17.0.1000.7                           1                 1           0 CONTOSO\gmsa-sqlprd06$
   ```

   SQLPRD01 runs in mixed mode (0) while its registry says Windows only (1).

2. **Run the audit:**

   ```powershell
   ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath "$Run\audit"
   ```

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

   Wrote 4 files and manifest.json to C:/FMWLabs/results/data-platform-02/lab1/<run>/audit
   Evidence for AUDIT (Login census, authentication mode, sa and service-account findings): AC-2, IA-5, CM-6; KSI-PIY-GIV, KSI-IAM-SNU, KSI-SVC-ACM
   ```

   SQLPRD06 already has Entra logins (`E` and `X`), runs as a gMSA and has no finding but its category. `vendorhr_app` on SQLFCI04 has a dated exception in `tests/fixtures/audit-day1/exceptions.json`; the audit reports it anyway, and Chapter 09's closure record applies the exception.

3. **Open the manifest.** Four files, three controls and three KSIs:

   ```powershell
   Get-Content "$Run\audit\manifest.json"
   ```

   ```text
   {
     "step": "AUDIT",
     "title": "Login census, authentication mode, sa and service-account findings",
     "mode": "read-only",
     "asOf": "2026-11-20",
     "controls": [
       "AC-2",
       "IA-5",
       "CM-6"
     ],
     "ksis": [
       "KSI-PIY-GIV",
       "KSI-IAM-SNU",
       "KSI-SVC-ACM"
     ],
     "files": [
       {
         "file": "findings.csv",
         "sha256": "da5b8ba35d5e2bbf58d70c67c0bd90b675b6b60f08f58ee2466e09394b383fa7"
       },
       {
         "file": "findings.json",
         "sha256": "602f0212f881b4792c3236f271081db984bcbcf7dc1c46e77a93b0b9b27dd493"
       },
       {
         "file": "census.csv",
         "sha256": "839fa208e96a91fd930de8e06d526e224851acd8ea1543ee0a0ff6b4768c7ba9"
       },
       {
         "file": "census.json",
         "sha256": "90b7de1333ecff1d0f3ed20299b0cb1f1b30a75871f45a61a37ffe10292367ec"
       }
     ]
   }
   ```

4. **Count the findings by severity:**

   ```powershell
   Import-Csv "$Run\audit\findings.csv" | Group-Object Severity | Select-Object Name, Count
   ```

   ```text
   Name     Count
   ----     -----
   critical     2
   high         3
   highest      2
   info         4
   medium       3
   ```

5. **Rerun the audit on day 30.** SQLPRD01 has moved to Entra logins; SQLPRD06 has gained a Windows login:

   ```powershell
   ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -OutputPath "$Run\audit-day30"
   ```

   ```text
   Instance U G S C K E X Disabled Usable
   -------- - - - - - - - -------- ------
   SQLPRD01 0 1 0 0 0 2 2        3      5
   SQLPRD02 1 1 0 0 0 0 0        1      2
   SQLFCI04 0 1 2 0 0 0 0        0      3
   SQLPRD06 1 1 0 0 0 1 1        1      4


   Instance Severity Finding          Detail
   -------- -------- -------          ------
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

   Wrote 4 files and manifest.json to C:/FMWLabs/results/data-platform-02/lab1/<run>/audit-day30
   Evidence for AUDIT (Login census, authentication mode, sa and service-account findings): AC-2, IA-5, CM-6; KSI-PIY-GIV, KSI-IAM-SNU, KSI-SVC-ACM
   ```

   On SQLPRD01, `sa` (renamed `sqladmin_disabled`), `CONTOSO\svc-payroll` and `payroll_report` are disabled, so `Disabled` is 3; the two superseded Windows groups were denied `CONNECT SQL` instead (Chapter 04 says why), so they leave the usable count without being counted as disabled. Nothing was dropped. SQLPRD06's `U` count went from 0 to 1, and no finding says so: a single audit doesn't compare runs. Chapter 09's drift check does.

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 02*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             6           0
   ```

7. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-02\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can name each finding on SQLPRD01 and SQLFCI04 with its severity, and say why SQLPRD06's new Windows login on day 30 raised no finding.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Check the reading login's own permissions, export a SELECT-only audit snapshot of a test instance, compare its login count with one the instance's administrator trusts, and audit it. Nothing on the instance changes. Follow [Chapter 02, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#lab-2-a-test-instance).

- **You need:** a test SQL Server instance, never production; PowerShell 7 with the SqlServer module, signed in to Windows as an account with a login on the instance; and, granted for the lab only, `VIEW SERVER STATE` on SQL Server 2019 and earlier, or `VIEW SERVER PERFORMANCE STATE` and `VIEW SERVER SECURITY STATE` on 2022 and later, plus `VIEW ANY DEFINITION` (`VIEW ANY SECURITY DEFINITION` on 2022 and later) and `CONNECT ANY DATABASE`. Never `sysadmin`.
- **Back it out:** step 5 deletes the audit run. Keep `lab2/audit.json` if you go on to Module 3's Lab 2; otherwise delete it too. Have the administrator remove the lab's grants.

## Unit 6: Knowledge check

*5 minutes*

1. Which finding does the audit rank highest?
   a. Mixed mode
   b. `sa` enabled
   c. A usable SQL login

2. SQLPRD01's registry `LoginMode` is 1, but `IsIntegratedSecurityOnly` is 0. What does the audit report?
   a. Nothing: the registry value wins.
   b. `sa` enabled.
   c. A `Mode anomaly`: the mode was changed without a restart, to resolve before migrating.

3. On day 30, SQLPRD06 has gained a Windows login. What does the day-30 audit say about it?
   a. Nothing: a single audit doesn't compare runs, and Chapter 09's drift check does.
   b. A critical finding for the new login.
   c. It moves SQLPRD06 to Category 3.

4. SQLFCI04 is a failover cluster instance on SQL Server 2019. Which category is it?
   a. Category 1 or 2, pending the Arc check
   b. Category 3: it must re-platform, upgrade or carry an exception
   c. It isn't audited

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Chapter 02: the findings](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#the-findings) and [Book 06, Chapter 07: login type classification](../../books/b06-data-platform/07-the-authentication-audit.md#login-type-classification).
2. **c.** See step 2 of [Chapter 02, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#lab-1-fixtures-no-tenant) and [Book 06, Chapter 07: authentication-mode configuration](../../books/b06-data-platform/07-the-authentication-audit.md#authentication-mode-configuration).
3. **a.** See step 5 of [Chapter 02, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#lab-1-fixtures-no-tenant) and [Chapter 02: dangers](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#dangers).
4. **b.** See [Book 06, Chapter 08: Category 3](../../books/b06-data-platform/08-reading-the-audit.md#interpreting-category-3-version-upgrade-required) and [Chapter 02: the findings](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#the-findings).
:::

## Unit 7: Summary

*2 minutes*

You learned what the audit reads on each surviving instance, how its findings rank, and what each Arc-eligibility category means for the next step. You audited four fictional instances and saw why one audit run, on its own, can't show drift.

**Evidence an ISSO keeps from this module:** the run folder, `census.csv`, `census.json`, `findings.csv` and `findings.json`, with `manifest.json` holding the SHA-256 of each file (Chapter 02). Before shipping, work through the [Chapter 02 checklist](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 1](01-the-estate-and-the-consolidation-gate.md) · [Learning path](index.md) · [Next: Module 3, Arc and the engine's identity →](03-arc-and-the-engines-identity.md)
:::
