---
title: "Chapter 02 — The Authentication Audit"
description: "Runbook R03's audit as code, run only on the instances Chapter 01 kept: a login census by sys.server_principals type, and findings for an enabled sa, usable SQL logins, mixed mode, a mode changed without a restart and a password-bearing service account, with each instance's first-pass Arc-eligibility category and a hashed manifest. Labs against two fictional audit snapshots and a test instance read with SELECT only."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 02 — The Authentication Audit

*Before a login moves, every surviving instance gets a record of who can sign in and how.*

::: {.callout-note}
## In this chapter
The code behind [Runbook R03](../../../books/b06-data-platform/r03-the-authentication-audit.md) and the audit [Book 06, Chapter 07](../../../books/b06-data-platform/07-the-authentication-audit.md) describes, read as [Chapter 08](../../../books/b06-data-platform/08-reading-the-audit.md) says. You start with the catalog views and server properties Learn documents, then read `Get-SqlLoginCensus` and `Get-SqlAuthFinding`. Lab 1 audits a fictional snapshot of four instances, reads the manifest and reruns the audit thirty days later. Lab 2 reads a test instance with the kit's SELECT-only exporter and audits it. The engine's service account is reported here; converting it isn't this chapter's work.
:::

## Goal and audience

**Goal.** By the end of this chapter you can produce, for every instance Chapter 01 retained or chose as a target, a census of its logins by type and a ranked list of the findings that must be fixed or excepted before its logins move.

**Audience.** Developers who build or maintain the kit, and the DBAs who own each instance's findings. You don't need a SQL Server until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

`sys.server_principals` has a row for every server-level principal, and its `type` says what each is: `S` a SQL login, `U` a Windows login, `G` a Windows group, `C` a login mapped to a certificate, `K` a login mapped to an asymmetric key, `E` an external login or application from Microsoft Entra ID and `X` an external group.[^sq02-principals] It shows other logins only to a caller with `ALTER ANY LOGIN` or a permission on the login, so an under-privileged reader gets a short list and no error.[^sq02-principals] `VIEW ANY DEFINITION` at the server covers `VIEW DEFINITION` on every login.[^sq02-permissions] `SERVERPROPERTY('IsIntegratedSecurityOnly')` returns 1 in Windows Authentication mode and 0 when SQL Server Authentication is accepted too; `IsClustered` returns 1 for a failover cluster instance; and on SQL Server 2025 `IsExternalAuthenticationOnly` returns 1 when SQL authentication is disabled.[^sq02-serverproperty] The mode is written to the `LoginMode` registry value (1 Windows only, 2 mixed) and takes effect after the service restarts; changing to mixed mode leaves `sa` disabled.[^sq02-auth-mode] `sys.dm_server_services` gives the account each SQL Server service runs as, in `service_account`,[^sq02-services] and `sys.dm_exec_connections` gives each connection's `auth_scheme`.[^sq02-connections] Entra authentication isn't supported on failover cluster instances.[^sq02-entra-sql]

### What it leaves to you

Each row is pinned by a test in the `Chapter 02` block of `tests/SqlIdentity.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Seven principal types in one view, with built-in service principals among them | `NT SERVICE` and `##` certificate logins inflate the count of what has to move | `Get-SqlLoginCensus`: usable logins (enabled, holding `CONNECT SQL`) by type, built-ins left out by the pattern in `config/thresholds.json` |
| The running mode and the registry value are read in different places | A mode changed without a restart looks like Windows-only until the next restart | A `Mode anomaly` finding when the registry value and the running mode disagree |
| `sa` is "often targeted" and should stay disabled[^sq02-auth-mode] | An enabled `sa` is the audit's highest-priority finding (Book 06, Chapter 07) | `sa enabled` ranked `highest`; `sa not renamed` ranked `medium` |
| A service account is a string in a DMV | A domain user account with a password is the credential Book 06, Chapter 02 sets out to remove | A `Service account` finding for a domain user account, and a separate one for a built-in account (`NT AUTHORITY\`, `LocalSystem`); none for a gMSA, computer account or virtual account |
| Clustering and version in separate places | The first-pass Arc-eligibility category needs both | An `Arc-eligibility` finding per instance: Category 3 for a cluster or a version before 2022, otherwise "1 or 2", which Chapter 03 settles |

## The code

### The census

`Get-SqlLoginCensus` drops built-in principals (`NT SERVICE\`, `NT AUTHORITY\`, `BUILTIN\`, and names starting `##`), counts usable logins per type, and counts the disabled ones separately. A disabled login still exists; Chapter 09's closure record decides when it's gone.

### The findings

`Get-SqlAuthFinding` returns one row per finding, with a severity from Book 06, Chapter 07:

| Finding | Severity | When |
|---|---|---|
| `sa enabled` | highest | The login whose SID is `0x01` is enabled, whatever its name |
| `Usable SQL login` | critical | Any other enabled type `S` login with `CONNECT SQL` |
| `Mixed mode` | high | `IsIntegratedSecurityOnly` is 0 |
| `Mode anomaly` | high | The registry `LoginMode` disagrees with the running mode |
| `Service account` | medium | The engine runs as a domain user account (not ending in `$`, not `NT SERVICE\`, not built-in): "a user account with a password: the Data Platform project converts it (service account guide)" |
| `Service account` | medium | The engine runs as a built-in account (`NT AUTHORITY\…`, `LocalSystem`): "move the engine to a virtual account or gMSA (Book 06, Chapter 07)" |
| `sa not renamed` | medium | `sa` is disabled but keeps its name |
| `Arc-eligibility` | info | Category 3 for a failover cluster instance or a version before 2022; otherwise "1 or 2" |

`Invoke-SqlAuthAudit.ps1` writes `census.csv` and `census.json`, `findings.csv` and `findings.json` (every finding except the per-login `info` rows), and one `manifest.json` that hashes all four.

### The service account goes to another plan

The audit names the engine's service account and stops. The Data Platform project converts it: Building Non-Person Identity's inventory tags SQL Server accounts `DataPlatform` and hands them to this project ([Chapter 01, NPI-INV-07](../non-person-identity/01-non-person-identity-inventory-as-code.md)), and the method is the [service account guide](../../../books/guides/service-account-migration.md), which takes a user account used as a service to a gMSA. The finding's text says the same, so the kit, this workbook and Building Non-Person Identity agree. Take the account and its hosts from `findings.csv` to the Data Platform project's conversion work. A built-in account (`NT AUTHORITY\…` or `LocalSystem`) has no password to rotate, so it gets its own finding: move the engine to a virtual account or a gMSA, as Book 06, Chapter 07 says.

::: {.callout-important}
## Illustrative code
Lab 1 reads fixtures; nothing connects to SQL Server. Tested against fixtures, not a live instance.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/sql-server-identity`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the four audited instances
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
(Read-SqlJson tests/fixtures/audit-day1/audit.json).instances | Select-Object name, productVersion, isIntegratedSecurityOnly, registryLoginMode, isClustered, serviceAccount | Format-Table

# Step 2: Run the audit
./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath out/audit

# Step 3: Open the manifest
Get-Content out/audit/manifest.json

# Step 4: Count the findings by severity
Import-Csv out/audit/findings.csv | Group-Object Severity | Select-Object Name, Count

# Step 5: Rerun the audit on day 30
./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -OutputPath out/audit-day30

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 02*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

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

   <!-- capture:begin 02-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/02-1.txt))](captures/02-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

   SQLPRD01 runs in mixed mode (0) while its registry says Windows only (1).

2. **Run the audit:**

   ```powershell
   ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath out/audit
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

   Wrote 4 files and manifest.json to out/audit
   Evidence for AUDIT (Login census, authentication mode, sa and service-account findings): AC-2, IA-5, CM-6; KSI-PIY-GIV, KSI-IAM-SNU, KSI-SVC-ACM
   ```

   <!-- capture:begin 02-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/02-2.txt))](captures/02-2.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Ou… and what it printed"}

   <!-- capture:end -->

   SQLPRD06 already has Entra logins (`E` and `X`), runs as a gMSA and has no finding but its category. `vendorhr_app` on SQLFCI04 has a dated exception in `tests/fixtures/audit-day1/exceptions.json`; the audit reports it anyway, and Chapter 09's closure record applies the exception.

3. **Open the manifest.** Four files, three controls and three KSIs:

   ```powershell
   Get-Content out/audit/manifest.json
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

   <!-- capture:begin 02-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/02-3.txt))](captures/02-3.png){.lightbox fig-alt="Terminal window showing Get-Content out/audit/manifest.json and what it printed"}

   <!-- capture:end -->

4. **Count the findings by severity:**

   ```powershell
   Import-Csv out/audit/findings.csv | Group-Object Severity | Select-Object Name, Count
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

   <!-- capture:begin 02-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/02-4.txt))](captures/02-4.png){.lightbox fig-alt="Terminal window showing Import-Csv out/audit/findings.csv | Group-Object Severity | Select-Object Nam… and what it printed"}

   <!-- capture:end -->

5. **Rerun the audit on day 30.** SQLPRD01 has moved to Entra logins; SQLPRD06 has gained a Windows login:

   ```powershell
   ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -OutputPath out/audit-day30
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

   Wrote 4 files and manifest.json to out/audit-day30
   Evidence for AUDIT (Login census, authentication mode, sa and service-account findings): AC-2, IA-5, CM-6; KSI-PIY-GIV, KSI-IAM-SNU, KSI-SVC-ACM
   ```

   <!-- capture:begin 02-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/02-5.txt))](captures/02-5.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -O… and what it printed"}

   <!-- capture:end -->

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

   <!-- capture:begin 02-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/02-6.txt))](captures/02-6.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 02*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 02-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/02-7.txt))](captures/02-7.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test instance

Use a test SQL Server instance, never production. **The authors haven't run this lab.** Work in `examples/sql-server-identity`, in PowerShell 7 with the [SqlServer](https://learn.microsoft.com/powershell/module/sqlserver/) module, signed in to Windows as an account that has a login on the instance. Before the lab, the instance's administrator grants that login, for the lab only, the read permissions the exporter's help names: `VIEW SERVER STATE` on SQL Server 2019 and earlier, or `VIEW SERVER PERFORMANCE STATE` and `VIEW SERVER SECURITY STATE` on 2022 and later (Learn says `sys.dm_server_services` needs the security one there);[^sq02-services] `VIEW ANY DEFINITION` (`VIEW ANY SECURITY DEFINITION` on 2022 and later); and `CONNECT ANY DATABASE`, which lets the login connect to every user database for the per-database user query and grants nothing inside them,[^sq02-grant-server] as [Runbook R02](../../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#the-rights-each-depth-of-discovery-needs) grants it when per-database reads are in scope. Never `sysadmin`. The exporter signs in as your Windows login unless you pass `-AccessToken` (an Entra token for `https://database.windows.net/`, a string or a `SecureString`), which Chapter 09 uses for a scheduled reader on an instance already closed to Windows logins; this lab uses Windows sign-in. You'll replace: `<sql-instance>` (the test instance as `host,port`, for example `sqltest01.contoso.example,1433`) and `<yyyy-MM-dd>` (today's date).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Check the reading login's rights
Import-Module SqlServer
Invoke-Sqlcmd -ServerInstance '<sql-instance>' -Query "SELECT permission_name FROM sys.fn_my_permissions(NULL, 'SERVER') ORDER BY permission_name;" -Encrypt Mandatory -ApplicationIntent ReadOnly

# Step 2: Export the audit snapshot
./Export-SqlAuditSnapshot.ps1 -SqlInstance '<sql-instance>' -OutputPath lab2/audit.json -AsOf <yyyy-MM-dd>

# Step 3: Check the login count against what you know
(Get-Content -Raw lab2/audit.json | ConvertFrom-Json).instances | ForEach-Object { [pscustomobject]@{ Instance = $_.name; Logins = @($_.logins).Count; Databases = @($_.databases).Count; ServiceAccount = $_.serviceAccount } }

# Step 4: Run the audit
./Invoke-SqlAuthAudit.ps1 -AuditPath lab2/audit.json -OutputPath lab2/audit-run

# Step 5: Back it out
Remove-Item -Recurse -Force lab2/audit-run
```

:::

<!-- labs:end -->

1. **Check the reading login's rights.** A read-only query of the caller's own server permissions:

   ```powershell
   Import-Module SqlServer
   Invoke-Sqlcmd -ServerInstance '<sql-instance>' -Query "SELECT permission_name FROM sys.fn_my_permissions(NULL, 'SERVER') ORDER BY permission_name;" -Encrypt Mandatory -ApplicationIntent ReadOnly
   ```

   The list should hold the permissions above and nothing that writes.

2. **Export the audit snapshot.** SELECT statements only; the registry `LoginMode` needs host access, so the snapshot leaves it null:

   ```powershell
   ./Export-SqlAuditSnapshot.ps1 -SqlInstance '<sql-instance>' -OutputPath lab2/audit.json -AsOf <yyyy-MM-dd>
   ```

   A permission error on `sys.dm_server_services` stops the export and means `VIEW SERVER SECURITY STATE` is missing. A user database the login can't read doesn't stop it: the exporter skips that database and prints a warning (`Skipped database …`), so read every warning; a skipped database's users are missing from the snapshot. A named instance is recorded as `HOST\INSTANCE`, a default instance by its host name.

3. **Check the login count against what you know.** A short list means a missing permission, not a clean instance:

   ```powershell
   (Get-Content -Raw lab2/audit.json | ConvertFrom-Json).instances | ForEach-Object { [pscustomobject]@{ Instance = $_.name; Logins = @($_.logins).Count; Databases = @($_.databases).Count; ServiceAccount = $_.serviceAccount } }
   ```

   Compare `Logins` with the count the instance's administrator sees in SQL Server Management Studio.

4. **Run the audit:**

   ```powershell
   ./Invoke-SqlAuthAudit.ps1 -AuditPath lab2/audit.json -OutputPath lab2/audit-run
   ```

   No `Mode anomaly` can appear: the snapshot has no registry value. Confirm the mode on the host if the instance was reconfigured recently.

5. **Back it out.** Nothing on the instance changed. Keep `lab2/audit.json` if you go on to Chapter 03's Lab 2; otherwise delete it too. Have the administrator remove the lab's grants:

   ```powershell
   Remove-Item -Recurse -Force lab2/audit-run
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Principal types | `S`, `U`, `G`, `C`, `K`, `E`, `X` (and `R`, server role) | [^sq02-principals] |
| Seeing other logins | `ALTER ANY LOGIN` or a permission on the login; `VIEW ANY DEFINITION` covers `VIEW DEFINITION` on a login | [^sq02-principals] [^sq02-permissions] |
| `IsIntegratedSecurityOnly` | 1 Windows Authentication; 0 both | [^sq02-serverproperty] |
| `IsExternalAuthenticationOnly` (SQL Server 2025) | 1 SQL authentication disabled; 0 enabled | [^sq02-serverproperty] |
| Mode change | Registry `LoginMode` 1 or 2; restart required; `sa` stays disabled on a change to mixed | [^sq02-auth-mode] |
| `sys.dm_server_services` | `service_account`; `VIEW SERVER STATE` (2019 and earlier), `VIEW SERVER SECURITY STATE` (2022 and later) | [^sq02-services] |
| `sys.dm_exec_connections` | `auth_scheme`; `VIEW SERVER STATE`, or `VIEW SERVER PERFORMANCE STATE` on 2022 and later | [^sq02-connections] |
| Failover cluster instances | No Entra authentication | [^sq02-entra-sql] |
| `CONNECT ANY DATABASE` | Connects to every current and future database; grants nothing in any database beyond connect | [^sq02-grant-server] |

## Federal requirements and evidence

| What the step does | NIST SP 800-53 Rev 5 | FedRAMP 20x KSI | Evidence the ISSO keeps |
|---|---|---|---|
| Counts every usable login by type on every audited instance (Lab 1, step 2; Lab 2, step 4) | Supports AC-2 (Account Management) | KSI-PIY-GIV, KSI-IAM-SNU | `census.csv`, `census.json` and `manifest.json` |
| Finds `sa` enabled, usable SQL logins and password-bearing service accounts (same steps) | Supports IA-5 (Authenticator Management) | KSI-IAM-SNU | `findings.csv`, `findings.json` and `manifest.json` |
| Finds mixed mode and a mode changed without a restart (same steps) | Supports CM-6 (Configuration Settings) | KSI-SVC-ACM | `findings.csv` and `manifest.json` |

The controls and KSIs are the `AUDIT` step's in `config/requirements.json`. The run's files provide evidence for these controls; the agency still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers, framed as in Chapter 01.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| The reading login can't see every login | The census is short and looks clean | Lab 2, step 3 compares the count with a known one; R03 says the same |
| A missing `VIEW SERVER SECURITY STATE` on 2022 and later | The export stops at the service account read | The exporter's help and Lab 2 list it; step 1 shows what the login holds before the export |
| A database the reader can't open | The exporter skips it with a warning, and its users are missing from the census and the login plan | `CONNECT ANY DATABASE` for the reader; read every `Skipped database` warning before using the snapshot |
| The registry `LoginMode` isn't read | A mode change waiting for a restart goes unseen | Confirm the mode on the host; the anomaly check runs on what you supply |
| An audit run read as a comparison | A new `sysadmin` Windows login (SQLPRD06, day 30) raises no finding | Chapter 09's drift check compares runs |
| The audit reader is given `sysadmin` to save time | The audit account becomes the most powerful login on the instance | Named read permissions only; the grants are removed after the lab |

## Checklist

- [ ] The audit ran on every instance Chapter 01 retained or chose as a target, and on nothing it retired.
- [ ] Each instance's login count was checked once against a count its administrator trusts.
- [ ] Every `highest` and `critical` finding has an owner, and every exception is in the exception registry with an approver and a date.
- [ ] Every `Service account` finding for a user account has gone to the Data Platform project's conversion (the service account guide), with its hosts, and every built-in account has a move to a virtual account or gMSA planned.
- [ ] The export printed no `Skipped database` warning, or each skipped database is explained.
- [ ] Every Category 3 instance has an upgrade, re-platform or exception decision.
- [ ] The run folder and its manifest are in the evidence store.

::: {.callout-tip}
## Continue the book
[← Chapter 01 — The Estate and the Consolidation Gate](01-the-estate-and-the-consolidation-gate.md) · [Workbook index](index.md) · [Next: Chapter 03 — Arc and the Engine's Identity →](03-arc-and-the-engines-identity.md)
:::

[^sq02-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)," type column and permissions, <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Nov 24, 2026).
[^sq02-permissions]: Microsoft Learn, "Permissions (Database Engine)," SQL Server permissions table (LOGIN, VIEW DEFINITION, implied by VIEW ANY DEFINITION), <https://learn.microsoft.com/sql/relational-databases/security/permissions-database-engine> (accessed Nov 24, 2026).
[^sq02-serverproperty]: Microsoft Learn, "SERVERPROPERTY (Transact-SQL)," IsIntegratedSecurityOnly, IsClustered and IsExternalAuthenticationOnly, <https://learn.microsoft.com/sql/t-sql/functions/serverproperty-transact-sql> (accessed Nov 24, 2026).
[^sq02-auth-mode]: Microsoft Learn, "Change Server Authentication Mode," <https://learn.microsoft.com/sql/database-engine/configure-windows/change-server-authentication-mode> (accessed Nov 24, 2026).
[^sq02-services]: Microsoft Learn, "sys.dm_server_services (Transact-SQL)," service_account and permissions, <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-server-services-transact-sql> (accessed Nov 24, 2026).
[^sq02-connections]: Microsoft Learn, "sys.dm_exec_connections (Transact-SQL)," auth_scheme and permissions, <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql> (accessed Nov 24, 2026).
[^sq02-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server overview," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Nov 24, 2026).
[^sq02-grant-server]: Microsoft Learn, "GRANT Server Permissions (Transact-SQL)," Remarks, `CONNECT ANY DATABASE`, <https://learn.microsoft.com/sql/t-sql/statements/grant-server-permissions-transact-sql> (accessed Nov 24, 2026).
