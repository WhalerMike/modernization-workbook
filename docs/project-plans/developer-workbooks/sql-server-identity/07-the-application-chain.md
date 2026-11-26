---
title: "Chapter 07 — The Application Chain"
description: "Book 06's connection-string track as code: a read-only scan of application configuration that masks every stored password, places each connection string in column A, B, C or done on Chapter 18's database axis, and names its target mode from Chapter 19's driver table. Column D stays the owner's call, the deprecated Entra password mode is never a target, and no string changes until the three gates hold. Labs on the kit's fixtures and on one test application."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 7
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 309eca7882366c03c50761f5d2e33f22181049489ba8748d9246d45ae7763ee1
last-reviewed: 2026-11-25
---
# Chapter 07 — The Application Chain

*The engine is only half the chain. The other half is a connection string, and most of them hold a password or a Windows credential.*

::: {.callout-note}
## In this chapter
The code behind [Book 06, Chapter 18](../../../books/b06-data-platform/18-the-four-class-pattern-for-applications.md), [Chapter 19](../../../books/b06-data-platform/19-connection-string-migration.md) and [Runbook R08](../../../books/b06-data-platform/r08-application-chain-and-connection-strings.md). You start with what Microsoft's driver pages give you: the Entra modes and the release that added each. Then you read `Find-SqlConnectionString`, which scans an application's configuration files, masks every stored password, and places each string on the database axis with a target mode. Lab 1 runs it on the kit's four fictional applications. Lab 2 scans a copy of one test application's configuration, checks the three gates, and changes that one string in a test environment, with the original kept as the way back.
:::

## Goal and audience

**Goal.** By the end of this chapter you can list every SQL Server connection string an application holds, say which ones carry a stored password, and say for each one whether the move to Entra is a configuration change (A), a driver or code change (B), the vendor's decision (C), or already done.

**Audience.** Developers who maintain the kit, DBAs, and application owners. You don't need an instance until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Microsoft's `Microsoft.Data.SqlClient` page lists each Entra authentication mode with the release that first supported it: Service Principal in 2.0, Managed Identity in 2.1, Default in 3.0. It marks the password mode deprecated. It says a token doesn't grant database permissions by itself. And it tells you to prefer a specific mode in production, such as Managed Identity, over Default.[^sq07-sqlclient] The ODBC driver page gives `ActiveDirectoryMsi` from 17.3.1.1 and `ActiveDirectoryServicePrincipal` from 17.7, and marks `ActiveDirectoryPassword` deprecated.[^sq07-odbc] On an Arc-enabled Windows server, a process can get the machine's managed identity token only if it runs as a local administrator or a member of the **Hybrid Agent Extension Applications** group.[^sq07-arc-mi] Every Entra connection to SQL Server is encrypted, so the client must trust the instance's certificate.[^sq07-tutorial] And `sys.dm_exec_connections` shows each connection's `auth_scheme`.[^sq07-dmv]

### What it leaves to you

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Driver pages list modes and versions | Nobody has matched them to your applications' drivers | `config/drivers.json`, Book 06 Chapter 19's driver table, read by the scan |
| Connection strings live in each application's files | Stored passwords sit in `web.config`, JSON, INI and DSN files | `Find-SqlConnectionString` reads `*.config`, `*.json`, `*.ini`, `*.dsn` and `*.udl` and masks every password |
| A string can't say which driver version runs it | Column A needs a driver new enough for the mode | Each application's `app.json`, written by its owner: driver, version, host, vendor |
| The password mode is deprecated | It's an Entra mode, so a careless scan would count it as done | `deprecatedModes` in `config/drivers.json`; the scan reports it as a finding, never as a target |

## The code

`Invoke-SqlConnectionScan.ps1` calls `Find-SqlConnectionString` on a folder with one subfolder per application. For each string it calls `ConvertFrom-SqlConnectionString`, which returns the server, how the string authenticates (`sql-password`, `windows`, `entra` or `unknown`), the `Authentication` value, and the string with every `Password=` and `PWD=` value replaced by `********`. The password itself is never returned or written.

Each row then gets its place on [Chapter 18's database axis](../../../books/b06-data-platform/18-the-four-class-pattern-for-applications.md#two-axes-user-sign-in-and-the-database-connection):

| Column | When the kit sets it | Target |
|---|---|---|
| `C` | `app.json` says a vendor owns the application | The vendor's supported mode, by release |
| `done` | The string already uses an Entra mode that isn't deprecated | None |
| `A` | The driver family is in the table and its version is at or above the managed identity release | The managed identity keyword on an Arc or Azure host; on any other host, the family's service-principal keyword (`servicePrincipalKeyword` in `config/drivers.json`), marked "(no managed identity off Arc; certificate preferred, Book 06 Ch 19)" |
| `B` | The driver has no Entra path in the table (`System.Data.SqlClient`, `SQLOLEDB`, ODBC 13 and older), or is too old | Move to `Microsoft.Data.SqlClient`, ODBC Driver 18 or `MSOLEDBSQL` first |
| `review` | No `app.json`, or a driver the table doesn't know | None until the owner fills `app.json` |

Column D, no Entra path today, is never set by the scan. Only the owner can say a vendor has no release coming or an application is to be retired, and that answer goes into the exception registry with a date ([Chapter 09](09-closure-drift-and-evidence.md)).

A host that isn't Arc-enabled or in Azure has no managed identity, so the kit never suggests `Active Directory Default` there: for `Microsoft.Data.SqlClient` the target reads `Authentication=Active Directory Service Principal (no managed identity off Arc; certificate preferred, Book 06 Ch 19)`, and ODBC, OLE DB and JDBC get their own service-principal keywords. A certificate rather than a client secret follows Book 06, [Chapter 19](../../../books/b06-data-platform/19-connection-string-migration.md) and [Chapter 11](../../../books/b06-data-platform/11-three-principal-types.md). The fixtures' only column-A string runs on an Arc host, so Lab 1 shows the managed identity keyword.

The target is advice, not a change. The kit writes `connections.csv`, `connections.json` and `manifest.json`; it rewrites nothing.

::: {.callout-important}
## Illustrative code
Lab 1 reads the kit's fictional application folders. Tested against fixtures, not a live application or instance.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\sql-server-identity-07\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Scan the four applications
./Invoke-SqlConnectionScan.ps1 -Path tests/fixtures/apps -OutputPath "$Run/connections" -AsOf 2026-11-20

# Step 2: Read the masked strings
Import-Csv "$Run/connections/connections.csv" | Select-Object Application, Server, Masked | Format-List | Out-String -Width 400

# Step 3: Parse a deprecated password-mode string
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
ConvertFrom-SqlConnectionString 'Server=sqlprd01.contoso.example;Database=Payroll;Authentication=Active Directory Password;User ID=svc-payroll@contoso.example;Password=NotARealOne' | Format-List | Out-String -Width 400

# Step 4: Read the driver table
(Get-Content config/drivers.json -Raw | ConvertFrom-Json).families | Format-Table id, managedIdentity, servicePrincipal, credentialChain

# Step 5: Open the manifest
Get-Content "$Run/connections/manifest.json"

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 07*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# After the steps
Get-ChildItem C:\FMWLabs\results\sql-server-identity-07\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped `sql-server-identity-code.zip` under the learning path's [Get the code](../../../training/data-platform/index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

<!-- capture:begin 07-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-1.txt))](captures/07-1.png){.lightbox fig-alt="Terminal window showing Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity and what it printed"}

<!-- capture:end -->

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\sql-server-identity-07\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

<!-- capture:begin 07-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-2.txt))](captures/07-2.png){.lightbox fig-alt="Terminal window showing $Run = 'C:\FMWLabs\results\sql-server-identity-07\lab1\$(Get-Date -AsUTC -For… and what it printed"}

<!-- capture:end -->

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\sql-server-identity-07\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Scan the four applications.** Two strings hold a stored password; one is already on Entra:

   ```powershell
   ./Invoke-SqlConnectionScan.ps1 -Path tests/fixtures/apps -OutputPath "$Run/connections" -AsOf 2026-11-20
   ```

   ```text
   Application  File                                    Finding            Driver                        Column Target
   -----------  ----                                    -------            ------                        ------ ------
   claims-batch claims-batch/claims.config.json         Stored password    System.Data.SqlClient         B      Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first
   payroll-web  payroll-web/appsettings.Production.json Entra already      Microsoft.Data.SqlClient      done
   payroll-web  payroll-web/web.config                  Windows integrated Microsoft.Data.SqlClient      A      Authentication=Active Directory Managed Identity
   reports-odbc reports-odbc/reports.dsn                Windows integrated ODBC Driver 13 for SQL Server B      Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first
   vendor-hr    vendor-hr/vendorhr.ini                  Stored password    SQLOLEDB                      C      Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first

   Wrote 2 files and manifest.json to C:/FMWLabs/results/sql-server-identity-07/lab1/<run>/connections
   Evidence for CONN (Find stored credentials and classify each connection string): IA-5, CM-6; KSI-IAM-SNU, KSI-SVC-ACM
   Stored passwords: 2. Column A (configuration only): 1.
   ```

   <!-- capture:begin 07-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-3.txt))](captures/07-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlConnectionScan.ps1 -Path tests/fixtures/apps -OutputPath '$Run/co… and what it printed"}

   <!-- capture:end -->

   `payroll-web` runs on an Arc host with `Microsoft.Data.SqlClient` 5.2.2, so its Windows-integrated string is column A. `vendor-hr` is column C because a vendor owns it; the target text there is the kit's generic advice, and the vendor's release decides.

2. **Read the masked strings.** No password reaches the output:

   ```powershell
   Import-Csv "$Run/connections/connections.csv" | Select-Object Application, Server, Masked | Format-List | Out-String -Width 400
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

   <!-- capture:begin 07-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-4.txt))](captures/07-4.png){.lightbox fig-alt="Terminal window showing Import-Csv '$Run/connections/connections.csv' | Select-Object Application, Se… and what it printed"}

   <!-- capture:end -->

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

   <!-- capture:begin 07-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-5.txt))](captures/07-5.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

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

   <!-- capture:begin 07-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-6.txt))](captures/07-6.png){.lightbox fig-alt="Terminal window showing (Get-Content config/drivers.json -Raw | ConvertFrom-Json).families | Format-T… and what it printed"}

   <!-- capture:end -->

5. **Open the manifest.** The step, its controls and KSIs, and the SHA-256 of each file:

   ```powershell
   Get-Content "$Run/connections/manifest.json"
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

   <!-- capture:begin 07-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-7.txt))](captures/07-7.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/connections/manifest.json' and what it printed"}

   <!-- capture:end -->

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 07*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             7           0
   ```

   <!-- capture:begin 07-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-8.txt))](captures/07-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 07*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\sql-server-identity-07\lab1 -Name
```

<!-- capture:begin 07-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/07-9.txt))](captures/07-9.png){.lightbox fig-alt="Terminal window showing Get-ChildItem C:\FMWLabs\results\sql-server-identity-07\lab1 -Name and what it printed"}

<!-- capture:end -->

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Lab 2: a test application

**The authors haven't run this lab.** Use one test application in a test environment, never production. It must be a column-A case: an IIS application on an Arc-enabled Windows host, using `Microsoft.Data.SqlClient` 2.1 or later with `Integrated Security`, against a test instance on SQL Server 2022 or later that has Entra authentication configured ([Chapter 03](03-arc-and-the-engines-identity.md)). Its owner writes the `app.json`. Work in `examples/sql-server-identity` on the application host, in PowerShell 7 run as a local administrator, with the SqlServer module and the Azure CLI. You'll replace: `<tenant-id>`, `<app-name>`, `<app-config-folder>` (the application's configuration folder), `<app-config-file>` (the file that holds the string), `<app-pool>` (its IIS application pool), `<driver-version>`, `<test-instance>` (host,port), `<database>`, `<entra-principal>` (the Arc server's name, as the Entra login names its managed identity) and `<yyyy-MM-dd>`.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Copy the configuration and write the owner's app.json
New-Item -ItemType Directory -Force lab2/apps | Out-Null
Copy-Item -Recurse <app-config-folder> lab2/apps/<app-name>
@{ application = '<app-name>'; driver = 'Microsoft.Data.SqlClient'; driverVersion = '<driver-version>'; host = 'arc'; vendor = $false } | ConvertTo-Json | Set-Content lab2/apps/<app-name>/app.json

# Step 2: Scan the copy, read-only
./Invoke-SqlConnectionScan.ps1 -Path lab2/apps -OutputPath lab2/out/connections -AsOf <yyyy-MM-dd>

# Step 3: Gate 1 and gate 2: the login exists and holds a role
az cloud set --name AzureCloud
az login --tenant <tenant-id>
$token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -AccessToken $token -Encrypt Mandatory -Query "SELECT name, type_desc, is_disabled FROM sys.server_principals WHERE name = N'<entra-principal>';"
Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database '<database>' -AccessToken $token -Encrypt Mandatory -Query "SELECT r.name AS role_name FROM sys.database_role_members m JOIN sys.database_principals r ON r.principal_id = m.role_principal_id JOIN sys.database_principals u ON u.principal_id = m.member_principal_id WHERE u.name = N'<entra-principal>';"

# Step 4: Gate 2 on the host: let the application pool ask for the token
Add-LocalGroupMember -Group 'Hybrid Agent Extension Applications' -Member 'IIS AppPool\<app-pool>'
Get-LocalGroupMember -Group 'Hybrid Agent Extension Applications'

# Step 5: Keep the original as the back-out
Copy-Item <app-config-file> <app-config-file>.before-entra

# Step 6: Change the one string
(Get-Content -Raw <app-config-file>) -replace 'Integrated Security\s*=\s*(SSPI|True)', 'Authentication=Active Directory Managed Identity' | Set-Content -NoNewline <app-config-file>
Restart-WebAppPool -Name '<app-pool>'

# Step 7: Gate 3: see the application arrive on its Entra login
Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -AccessToken $token -Encrypt Mandatory -Query "SELECT s.original_login_name, s.host_name, c.auth_scheme, COUNT(*) AS sessions FROM sys.dm_exec_connections c JOIN sys.dm_exec_sessions s ON s.session_id = c.session_id GROUP BY s.original_login_name, s.host_name, c.auth_scheme;"

# Step 8: Scan the changed copy
Copy-Item -Force <app-config-file> lab2/apps/<app-name>/
./Invoke-SqlConnectionScan.ps1 -Path lab2/apps -OutputPath lab2/out/connections-after -AsOf <yyyy-MM-dd>

# Step 9: Back it out
Copy-Item -Force <app-config-file>.before-entra <app-config-file>
Restart-WebAppPool -Name '<app-pool>'
Remove-LocalGroupMember -Group 'Hybrid Agent Extension Applications' -Member 'IIS AppPool\<app-pool>'
az logout
```

:::

<!-- labs:end -->

1. **Copy the configuration and write the owner's `app.json`.** The scan reads the copy, not the live folder:

   ```powershell
   New-Item -ItemType Directory -Force lab2/apps | Out-Null
   Copy-Item -Recurse <app-config-folder> lab2/apps/<app-name>
   @{ application = '<app-name>'; driver = 'Microsoft.Data.SqlClient'; driverVersion = '<driver-version>'; host = 'arc'; vendor = $false } | ConvertTo-Json | Set-Content lab2/apps/<app-name>/app.json
   ```

2. **Scan the copy, read-only:**

   ```powershell
   ./Invoke-SqlConnectionScan.ps1 -Path lab2/apps -OutputPath lab2/out/connections -AsOf <yyyy-MM-dd>
   ```

   Go on only if the row says `Windows integrated`, column `A`, target `Authentication=Active Directory Managed Identity`.

3. **Gate 1 and gate 2: the login exists and holds a role.** Sign in to commercial Azure as a test DBA and read with your own Entra token:

   ```powershell
   az cloud set --name AzureCloud
   az login --tenant <tenant-id>
   $token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
   Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -AccessToken $token -Encrypt Mandatory -Query "SELECT name, type_desc, is_disabled FROM sys.server_principals WHERE name = N'<entra-principal>';"
   Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database '<database>' -AccessToken $token -Encrypt Mandatory -Query "SELECT r.name AS role_name FROM sys.database_role_members m JOIN sys.database_principals r ON r.principal_id = m.role_principal_id JOIN sys.database_principals u ON u.principal_id = m.member_principal_id WHERE u.name = N'<entra-principal>';"
   ```

   The first query must return one enabled `EXTERNAL_LOGIN` row and the second at least one role. If not, create them first through [Chapter 04](04-entra-logins-and-the-parallel-run.md)'s plan.

4. **Gate 2 on the host: let the application pool ask for the token.** This adds one member to a local group; step 9 removes it:

   ```powershell
   Add-LocalGroupMember -Group 'Hybrid Agent Extension Applications' -Member 'IIS AppPool\<app-pool>'
   Get-LocalGroupMember -Group 'Hybrid Agent Extension Applications'
   ```

5. **Keep the original as the back-out:**

   ```powershell
   Copy-Item <app-config-file> <app-config-file>.before-entra
   ```

6. **Change the one string.** Only the authentication keyword changes:

   ```powershell
   (Get-Content -Raw <app-config-file>) -replace 'Integrated Security\s*=\s*(SSPI|True)', 'Authentication=Active Directory Managed Identity' | Set-Content -NoNewline <app-config-file>
   Restart-WebAppPool -Name '<app-pool>'
   ```

7. **Gate 3: see the application arrive on its Entra login.** Exercise the application, then read its sessions:

   ```powershell
   Invoke-Sqlcmd -ServerInstance '<test-instance>' -Database master -AccessToken $token -Encrypt Mandatory -Query "SELECT s.original_login_name, s.host_name, c.auth_scheme, COUNT(*) AS sessions FROM sys.dm_exec_connections c JOIN sys.dm_exec_sessions s ON s.session_id = c.session_id GROUP BY s.original_login_name, s.host_name, c.auth_scheme;"
   ```

   The application's host should show the Entra login and no `NTLM` or `KERBEROS` row. Book 06 notes Learn doesn't list the `auth_scheme` value an Entra connection shows; record what you see.

8. **Scan the changed copy.** The row should now say `Entra already`, column `done`:

   ```powershell
   Copy-Item -Force <app-config-file> lab2/apps/<app-name>/
   ./Invoke-SqlConnectionScan.ps1 -Path lab2/apps -OutputPath lab2/out/connections-after -AsOf <yyyy-MM-dd>
   ```

9. **Back it out.** Restore the original string, restart, and remove the group member:

   ```powershell
   Copy-Item -Force <app-config-file>.before-entra <app-config-file>
   Restart-WebAppPool -Name '<app-pool>'
   Remove-LocalGroupMember -Group 'Hybrid Agent Extension Applications' -Member 'IIS AppPool\<app-pool>'
   az logout
   ```

   Run step 9 on any back-out trigger from [Runbook R08](../../../books/b06-data-platform/r08-application-chain-and-connection-strings.md#b06-r08-control-states): login failures for the Entra principal, a token error from the local endpoint, a failing health check, or sessions still arriving on a Windows login. Keep `lab2/` inside your boundary, or delete it.

## Verified facts

| Item | Value | GCC | Source |
|---|---|---|---|
| `Microsoft.Data.SqlClient` modes | Service Principal from 2.0; Managed Identity from 2.1; Default from 3.0; Password deprecated; specific mode preferred in production; token grants no database permission | Worldwide Entra endpoints | [^sq07-sqlclient] |
| ODBC modes | `ActiveDirectoryMsi` from 17.3.1.1; `ActiveDirectoryServicePrincipal` from 17.7; `ActiveDirectoryPassword` deprecated | — | [^sq07-odbc] |
| Arc managed identity token | Local Administrators or Hybrid Agent Extension Applications on Windows; endpoint `http://localhost:40342` | Commercial Azure (`AzureCloud`) | [^sq07-arc-mi] |
| Entra connections | Always encrypted; Entra logins created `FROM EXTERNAL PROVIDER` | SQL Server enabled by Azure Arc, commercial Azure | [^sq07-tutorial] |
| `auth_scheme` | "SQL Server/Windows Authentication scheme"; no Entra value listed | — | [^sq07-dmv] |

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | FedRAMP 20x KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| CONN: the scan (Lab 1, Lab 2 steps 1 and 2) | IA-5, CM-6 | KSI-IAM-SNU, KSI-SVC-ACM | `connections.csv` with masked strings and the manifest; each application's `app.json` |
| CONN: the change (Lab 2 steps 3 to 8) | IA-5, CM-6 | KSI-IAM-SNU, KSI-SVC-ACM | The gate queries' output, the before and after scans, the session read, and the change record |

The scan's records support IA-5 (a stored password found, then removed) and provide evidence for CM-6 (each string's authentication setting, recorded). The agency's assessor decides whether a control is in place. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with them and doesn't report KSIs itself.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A password copied into a report | The scan's output becomes a secret store | Masking in `ConvertFrom-SqlConnectionString`, and a test that no fixture password appears |
| The password mode counted as done | A deprecated flow that can't do MFA stays in production | `deprecatedModes`; the finding names it |
| `Active Directory Default` in production | The first connection is slow, and the identity can change with host settings | Name the mode. The kit never suggests Default: off Arc it names the service-principal mode, with a certificate preferred |
| Every application on a host shares the Arc identity | One login's grants cover everything allowed to ask for the token | Keep the Hybrid Agent Extension Applications group to the accounts that need it; give an application its own service principal where grants differ |
| A string changed before the gates hold | The application fails at sign-in | Gates 1 to 3 in Lab 2, in that order |

## Checklist

- [ ] Every application has an `app.json` written by its owner.
- [ ] Every stored password in `connections.csv` has a task or a dated exception.
- [ ] Column D decisions are in the exception registry, by the owner, with a date.
- [ ] No string uses `Active Directory Password` or `ActiveDirectoryPassword`.
- [ ] Each change kept its original file and was rehearsed backwards.

::: {.callout-tip}
## Continue the book
[← Chapter 06 — NTLM and the SPNs](06-ntlm-and-the-spns.md) · [Workbook index](index.md) · [Next: Chapter 08 — AD CS Dependencies →](08-ad-cs-dependencies.md)
:::

[^sq07-sqlclient]: Microsoft Learn, "Microsoft Entra Authentication with Microsoft.Data.SqlClient," sections "Choose an authentication mode," "Use default authentication" and "Replace deprecated password authentication," <https://learn.microsoft.com/sql/connect/ado-net/sql/azure-active-directory-authentication> (accessed Nov 24, 2026).
[^sq07-odbc]: Microsoft Learn, "Using Microsoft Entra ID with the ODBC Driver," section "New and/or Modified DSN and Connection String Keywords," <https://learn.microsoft.com/sql/connect/odbc/using-azure-active-directory> (accessed Nov 24, 2026).
[^sq07-arc-mi]: Microsoft Learn, "Access Azure resources with managed identity on Azure Arc-enabled servers," sections "Security overview" and "Prerequisites," <https://learn.microsoft.com/azure/azure-arc/servers/managed-identity-authentication> (accessed Nov 24, 2026).
[^sq07-tutorial]: Microsoft Learn, "Set up Microsoft Entra Authentication with App Registration - SQL Server enabled by Azure Arc," sections "Authentication prerequisites" and "Create logins and users," <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> (accessed Nov 24, 2026).
[^sq07-dmv]: Microsoft Learn, "sys.dm_exec_connections (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-exec-connections-transact-sql> (accessed Nov 24, 2026).
