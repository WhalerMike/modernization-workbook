---
title: "Data Platform, Module 7: The Application Chain"
subtitle: "Find every connection string, mask every stored password, and place each string on the database axis before anything changes"
description: "Module 7 of the Data Platform and SQL Server Identity learning path. You learn the database axis of the four-class pattern, the Entra modes each driver family supports and from which release, and the three gates in front of a connection-string change. Lab 1 scans the kit's four fictional applications, masks their stored passwords and places each string in column A, B, C or done. Runbook R08; workbook Chapter 07."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 7
date-modified: 2026-11-25
review-status: approved
reviewed-sha256: ec084fbe310aef7b16a633d371124b3dfa682e307cf1668443d2d26118f40783
last-reviewed: 2026-11-25
---
# Data Platform, Module 7: The Application Chain {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 7 of 10 · 50 minutes · Runbook [R08](../../books/b06-data-platform/r08-application-chain-and-connection-strings.md) · Workbook [Chapter 07](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

The engine is only half the chain. The other half is a connection string, and most of them hold a password or a Windows credential. Until each string moves to an Entra mode, the application keeps the instance tied to Windows Authentication. In this module you list every SQL Server connection string an application holds, say which ones carry a stored password, and say whether each move is a configuration change, a driver or code change, the vendor's decision, or already done.

**The federal requirement.** [Chapter 07's federal requirements and evidence table](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#federal-requirements-and-evidence) maps both the scan and the change to NIST SP 800-53 IA-5 and CM-6, with KSI-IAM-SNU and KSI-SVC-ACM. Runbook R08's [control states, change safety and evidence](../../books/b06-data-platform/r08-application-chain-and-connection-strings.md#b06-r08-control-states) lists the evidence for each state of the cutover, from the triage to the session records. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The scan's records support these controls; the assessor decides whether each one is in place.

### Learning objectives

In this module, you'll:

- Place a connection string in column A, B, C or D of the database axis, and say who decides column D.
- Name the managed identity and service-principal modes in each driver family, and why the Entra password mode is never a target.
- Run the kit's connection scan over fixtures and read its masked strings, columns and targets.
- List the three gates that must hold before a string changes.

### Prerequisites

- [Module 6](06-ntlm-and-the-spns.md).
- [Module 4](04-entra-logins-and-the-parallel-run.md): the Entra login that gate 1 checks for.

## Unit 2: The database axis

*10 minutes*

Book 06, Chapter 18, *The Four-Class Pattern Applied to SQL-Consuming Applications*, describes two independent axes: how users sign in to the application, and how the application connects to the database. On the database axis, evidence places each application in one of four columns: **A**, configuration only; **B**, code change; **C**, vendor-dependent; **D**, no Entra path today. The kit's scan reads each application's configuration files, masks every stored password, and sets A, B, C or done from the driver, its version, the host and whether a vendor owns the application. It never sets column D: only the owner can say a vendor has no release coming or an application is to be retired. Read:

- Book 06, Chapter 18: [two axes: user sign-in and the database connection](../../books/b06-data-platform/18-the-four-class-pattern-for-applications.md#two-axes-user-sign-in-and-the-database-connection).
- Runbook R08: [the four-class triage](../../books/b06-data-platform/r08-application-chain-and-connection-strings.md#the-four-class-triage).
- [Chapter 07: what it leaves to you](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#what-it-leaves-to-you) and [the code](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#the-code).

## Unit 3: The driver table and the three gates

*10 minutes*

Book 06, Chapter 19, *Connection String Migration: The Last Mile*, gives the change for an application on an Arc-enabled server: `Integrated Security` becomes `Authentication=Active Directory Managed Identity`, and the application's process account must be allowed to request the host's token. Each driver family added Entra modes in specific releases, and in every family the Entra password mode is deprecated, so it is never a migration target. Off Arc there is no managed identity, so the kit names the service-principal mode, with a certificate preferred. The change is simple but gated: the Entra login exists, the role is granted, and the change is tested in a production-equivalent environment. Read:

- Book 06, Chapter 19: [the connection-string change](../../books/b06-data-platform/19-connection-string-migration.md#the-connection-string-change), [Entra options by driver](../../books/b06-data-platform/19-connection-string-migration.md#entra-options-by-driver) and [the gate conditions](../../books/b06-data-platform/19-connection-string-migration.md#the-gate-conditions).
- Runbook R08: [the three gate conditions](../../books/b06-data-platform/r08-application-chain-and-connection-strings.md#the-three-gate-conditions).
- [Chapter 07: dangers](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*20 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-07-the-application-chain\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Scan the four applications
./Invoke-SqlConnectionScan.ps1 -Path tests/fixtures/apps -OutputPath "$Run\connections" -AsOf 2026-11-20

# Step 2: Read the masked strings
Import-Csv "$Run\connections\connections.csv" | Select-Object Application, Server, Masked | Format-List | Out-String -Width 400

# Step 3: Parse a deprecated password-mode string
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
ConvertFrom-SqlConnectionString 'Server=sqlprd01.contoso.example;Database=Payroll;Authentication=Active Directory Password;User ID=svc-payroll@contoso.example;Password=NotARealOne' | Format-List | Out-String -Width 400

# Step 4: Read the driver table
(Get-Content config/drivers.json -Raw | ConvertFrom-Json).families | Format-Table id, managedIdentity, servicePrincipal, credentialChain

# Step 5: Open the manifest
Get-Content "$Run\connections\manifest.json"

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 07*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# Step 7: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-07-the-application-chain\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 07, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-07-the-application-chain\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-07-the-application-chain\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Scan the four applications.** Two strings hold a stored password; one is already on Entra:

   ```powershell
   ./Invoke-SqlConnectionScan.ps1 -Path tests/fixtures/apps -OutputPath "$Run\connections" -AsOf 2026-11-20
   ```

   ```text
   Application  File                                    Finding            Driver                        Column Target
   -----------  ----                                    -------            ------                        ------ ------
   claims-batch claims-batch/claims.config.json         Stored password    System.Data.SqlClient         B      Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first
   payroll-web  payroll-web/appsettings.Production.json Entra already      Microsoft.Data.SqlClient      done
   payroll-web  payroll-web/web.config                  Windows integrated Microsoft.Data.SqlClient      A      Authentication=Active Directory Managed Identity
   reports-odbc reports-odbc/reports.dsn                Windows integrated ODBC Driver 13 for SQL Server B      Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first
   vendor-hr    vendor-hr/vendorhr.ini                  Stored password    SQLOLEDB                      C      Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-07-the-application-chain/lab1/<run>/connections
   Evidence for CONN (Find stored credentials and classify each connection string): IA-5, CM-6; KSI-IAM-SNU, KSI-SVC-ACM
   Stored passwords: 2. Column A (configuration only): 1.
   ```

   `payroll-web` runs on an Arc host with `Microsoft.Data.SqlClient` 5.2.2, so its Windows-integrated string is column A. `vendor-hr` is column C because a vendor owns it; the target text there is the kit's generic advice, and the vendor's release decides.

2. **Read the masked strings.** No password reaches the output:

   ```powershell
   Import-Csv "$Run\connections\connections.csv" | Select-Object Application, Server, Masked | Format-List | Out-String -Width 400
   ```

   ```text
   Application : claims-batch
   Server      : sqlprd02.contoso.example
   Masked      : Data Source=sqlprd02.contoso.example;Initial Catalog=Claims;User ID=claims_batch;Password=********;Encrypt=True

   Application : payroll-web
   Server      : tcp:sqlprd01.contoso.example,1433
   Masked      : Server=tcp:sqlprd01.contoso.example,1433;Database=PayrollArchive;Authentication=Active Directory Managed Identity;Encrypt=True

   Application : payroll-web
   Server      : sqlprd01.contoso.example
   Masked      : Server=sqlprd01.contoso.example;Database=Payroll;Integrated Security=SSPI;Encrypt=True

   Application : reports-odbc
   Server      : sqlleg03.contoso.example
   Masked      : DRIVER=ODBC Driver 13 for SQL Server;SERVER=sqlleg03.contoso.example;DATABASE=Reports;Trusted_Connection=Yes

   Application : vendor-hr
   Server      : sqlfci04.contoso.example
   Masked      : Provider=SQLOLEDB;Data Source=sqlfci04.contoso.example;Initial Catalog=VendorHR;User ID=vendorhr_app;Password=********
   ```

3. **Parse a deprecated password-mode string.** It parses as `entra`, but the mode is the deprecated one, so the scan reports it as a finding and never as done:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   ConvertFrom-SqlConnectionString 'Server=sqlprd01.contoso.example;Database=Payroll;Authentication=Active Directory Password;User ID=svc-payroll@contoso.example;Password=NotARealOne' | Format-List | Out-String -Width 400
   ```

   ```text
   Server         : sqlprd01.contoso.example
   Authentication : entra
   Mode           : Active Directory Password
   Masked         : Server=sqlprd01.contoso.example;Database=Payroll;Authentication=Active Directory Password;User ID=svc-payroll@contoso.example;Password=********
   ```

4. **Read the driver table.** The first release of each mode, as Book 06 Chapter 19 gives it:

   ```powershell
   (Get-Content config/drivers.json -Raw | ConvertFrom-Json).families | Format-Table id, managedIdentity, servicePrincipal, credentialChain
   ```

   ```text
   id                       managedIdentity servicePrincipal credentialChain
   --                       --------------- ---------------- ---------------
   Microsoft.Data.SqlClient 2.1             2.0              3.0
   ODBC                     17.3.1.1        17.7
   MSOLEDBSQL               18.3            18.5
   mssql-jdbc               12.2            12.2             12.2
   ```

5. **Open the manifest.** The step, its controls and KSIs, and the SHA-256 of each file:

   ```powershell
   Get-Content "$Run\connections\manifest.json"
   ```

   ```text
   {
     "step": "CONN",
     "title": "Find stored credentials and classify each connection string",
     "mode": "read-only",
     "asOf": "2026-11-20",
     "controls": [
       "IA-5",
       "CM-6"
     ],
     "ksis": [
       "KSI-IAM-SNU",
       "KSI-SVC-ACM"
     ],
     "files": [
       {
         "file": "connections.csv",
         "sha256": "8d47142466c6cd3d369fb61ecf2c754473a52b245875f23ed141d28e79d11c2a"
       },
       {
         "file": "connections.json",
         "sha256": "9376f94e5c88dae5dacc3cf3f2758ae7b26cdfa92adbed90333392d7ff19d9ac"
       }
     ]
   }
   ```

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 07*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             7           0
   ```

7. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-07-the-application-chain\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can say, for each of the fictional applications' connection strings, whether it holds a stored password, which column it falls in and why, without any password reaching the output.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Scan a copy of one test application's configuration, check the three gates, let the application pool request the Arc token, and change that one string in a test environment, with the original kept as the way back. Follow [Chapter 07, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#lab-2-a-test-application).

- **You need:** one column-A test application, never production: an IIS application on an Arc-enabled Windows host, using `Microsoft.Data.SqlClient` 2.1 or later with `Integrated Security`, against a test instance on SQL Server 2022 or later with Entra authentication configured ([Module 3](03-arc-and-the-engines-identity.md)); an `app.json` written by its owner; PowerShell 7 run as a local administrator on the host, with the SqlServer module and the Azure CLI signed in to commercial Azure (`AzureCloud`).
- **Back it out:** step 9 restores the original configuration file, restarts the application pool, removes the pool from the Hybrid Agent Extension Applications group and signs out of Azure. Run it on any of Runbook R08's back-out triggers. Keep `lab2/` inside your boundary, or delete it.

## Unit 6: Knowledge check

*5 minutes*

1. `payroll-web`'s `web.config` uses `Integrated Security=SSPI`. Why does the scan put it in column A?
   a. A vendor owns the application.
   b. It runs on an Arc host with `Microsoft.Data.SqlClient` 5.2.2, at or above the managed identity release, so the move is a configuration change.
   c. It already uses an Entra mode.

2. A string uses `Authentication=Active Directory Password`. How does the scan treat it?
   a. As done, because it's an Entra mode.
   b. As a finding: the mode is deprecated, so it is never counted as done or offered as a target.
   c. As column D.

3. Who places an application in column D?
   a. The scan, when the driver is too old.
   b. The application's owner, with a dated entry in the exception registry; the scan never sets it.
   c. The DBA, when the login is missing.

4. Which three conditions must hold before a connection string changes?
   a. The Entra login exists, it holds the database role, and the change is tested in a production-equivalent environment.
   b. The SPN is registered, the client is domain-joined, and NTLM is blocked.
   c. The vendor approves, the password is rotated, and Conditional Access is on.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See step 1 of [Chapter 07, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#lab-1-fixtures-no-tenant) and [Chapter 07: the code](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#the-code).
2. **b.** See step 3 of [Chapter 07, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#lab-1-fixtures-no-tenant) and Book 06, [Chapter 19: Entra options by driver](../../books/b06-data-platform/19-connection-string-migration.md#entra-options-by-driver).
3. **b.** See [Chapter 07: the code](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#the-code) and Book 06, [Chapter 18: two axes](../../books/b06-data-platform/18-the-four-class-pattern-for-applications.md#two-axes-user-sign-in-and-the-database-connection).
4. **a.** See Book 06, [Chapter 19: the gate conditions](../../books/b06-data-platform/19-connection-string-migration.md#the-gate-conditions) and Runbook R08's [three gate conditions](../../books/b06-data-platform/r08-application-chain-and-connection-strings.md#the-three-gate-conditions).
:::

## Unit 7: Summary

*2 minutes*

You scanned four fictional applications, found two stored passwords without writing either one out, and placed each string in column A, B, C or done from its driver, host and owner. The scan advises; no string changes until the three gates hold.

**Evidence an ISSO keeps from this module:** `connections.csv` with masked strings and `connections.json`, with `manifest.json`, which records the SHA-256 of each file; each application's `app.json`; and, for a change, the gate queries' output, the before and after scans, the session read and the change record (Chapter 07). Before shipping, work through the [Chapter 07 checklist](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 6](06-ntlm-and-the-spns.md) · [Learning path](index.md) · [Next: Module 8, AD CS dependencies →](08-ad-cs-dependencies.md)
:::
