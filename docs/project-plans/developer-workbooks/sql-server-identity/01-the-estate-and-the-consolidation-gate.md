---
title: "Chapter 01 — The Estate and the Consolidation Gate"
description: "Runbook R02's consolidation gate as code: the kit reads an estate inventory built from the Start Kit's SQL Server discovery and classifies every instance retain, consolidate, retire or review, with the recorded constraint that changed any first-pass answer, and writes the classification with a hashed manifest. Labs against a fictional eight-instance estate and a test instance."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 01 — The Estate and the Consolidation Gate

*Count every instance first, then decide which ones the identity work is spent on.*

::: {.callout-note}
## In this chapter
The code behind [Runbook R02, Step 3](../../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#step-3-the-retain-consolidate-retire-decision-the-gate) and the decision [Book 06, Chapter 06](../../../books/b06-data-platform/06-retain-consolidate-retire.md) describes. Discovery isn't rebuilt here: the Start Kit's SQL Server count finds the instances, and this chapter classifies what it found. You read `Get-SqlEstateClassification` and its rules, then Lab 1 classifies a fictional eight-instance estate, checks the run against its manifest and shows that an edited file is caught. Lab 2 turns the Start Kit's output for a test instance into the kit's inventory and classifies it.
:::

## Goal and audience

**Goal.** By the end of this chapter you can produce the denominator the rest of the workbook works on: one row per instance, classified retain, consolidate, retire or review, with the reason and any constraint, and a manifest an assessor can re-hash.

**Audience.** Developers who build or maintain the kit, and the data platform architects who confirm or override each row. You don't need a SQL Server until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Microsoft Entra authentication for SQL Server starts with SQL Server 2022, on standalone instances and Always On availability groups; failover cluster instances don't support it.[^sq01-entra-sql] The `FROM EXTERNAL PROVIDER` login, which maps a login to an Entra principal, is "available for Arc-enabled SQL Server 2022 and later versions".[^sq01-create-login] Those two facts are why version and clustering decide so much of the gate. For the last-use signal, `sys.dm_db_index_usage_stats` records the last seek, scan, lookup and update per index, but its counters "are initialized to empty whenever the database engine is started", and a database's rows go when it's detached or shut down, for example by `AUTO_CLOSE`.[^sq01-index-usage] [Book 06, Chapter 04](../../../books/b06-data-platform/04-the-estate-inventory.md#discovery-instruments) lists the discovery instruments Learn documents, and [Chapter 05](../../../books/b06-data-platform/05-rationalization.md) the three rationalization lenses; this chapter doesn't repeat them.

### What it leaves to you

Each row is pinned by a test in the `Chapter 01` block of `tests/SqlIdentity.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Version limits on a product page, instance discovery in several tools | Nobody has turned them into one decision per instance | `Get-SqlEstateClassification`: one row per instance with a class, a target, whether it enters the migration, and the reason |
| A usage DMV that resets when the engine starts | A recently restarted instance looks idle, or a long-idle one looks used | The zombie threshold is a setting (`config/thresholds.json`, 400 days); Lab 2's conversion uses the engine start time when a database has no recorded use |
| Clustering and vendor support aren't in any inventory | A consolidation plan that ignores them can't be carried out | Constraints recorded per instance (`vendor-lock`, `collation`, `compliance-isolation`, `indivisible`) change the first-pass answer, and the reason says which |
| No rule for an instance nothing could read | An unknown instance silently counts as fine | No version means **review**, never retain |

## The code

### Where the inventory comes from

The Start Kit's `Invoke-FMPSqlEstateDiscovery` (`examples/start-kit/powershell/FMPSqlEstate`) fuses three signals, `MSSQLSvc` SPNs, directory objects and the SQL Server Browser, counts each instance once, and with `-QueryInstances` reads version, edition, databases and last use over SELECT-only T-SQL. Its README section [How it counts SQL Server](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit#how-it-counts-sql-server) and its [rights table](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit#rights-each-part-needs) say what each signal needs. It also applies a first-pass gate of its own. This kit reads the same facts in its own shape (`tests/fixtures/estate/estate.json`) and adds the constraints and the application status, which discovery can't see. Lab 2 shows the conversion.

### The classifier

`Get-SqlEstateClassification` follows Runbook R02's first pass, then applies the recorded constraints as Book 06, Chapter 06 describes. `Invoke-SqlEstate.ps1` runs it and writes `estate.csv`, `estate.json` and `manifest.json`.

| Order | Rule | Class |
|---|---|---|
| 1 | Every database idle for the zombie threshold or longer | retire |
| 2 | Every owning application decommissioned | retire |
| 3 | No version | review |
| 4 | Version before SQL Server 2022 | consolidate (shared target) |
| 5 | SQL Server 2022 or later | retain |
| 6 | A `vendor-lock` constraint on a non-retired instance | retain in place, upgrade or exception needed |
| 7 | A `collation`, `compliance-isolation` or `indivisible` constraint on a consolidate | consolidate (dedicated target) |
| 8 | A failover cluster instance still in consolidate | retain, re-platform before consolidating |

`EntersMigration` is `yes` for retain, `at the target` for consolidate and `no` for retire and review. The architects confirm or override every row and record why; the classifier is a first pass, as R02 says of its own.

### The manifest

Every run writes `manifest.json`: the step (`ESTATE`), its title, the mode (`read-only`), the as-of date from the inventory, the controls and KSIs from `config/requirements.json`, and each file with its SHA-256, hashed with LF line endings. `Test-SqlManifest` re-hashes a run folder.

::: {.callout-important}
## Illustrative code
Lab 1 reads fixtures; nothing connects to SQL Server, Active Directory or Azure. Tested against fixtures, not a live estate.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\sql-server-identity-01\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Classify the fictional estate
./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath "$Run/estate"

# Step 2: Open the manifest
Get-Content "$Run/estate/manifest.json"

# Step 3: Check the folder against its manifest
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
Test-SqlManifest -OutputPath "$Run/estate" | Format-Table

# Step 4: Look at the two instances that don't enter the migration
(Read-SqlJson tests/fixtures/estate/estate.json).instances | Where-Object name -in 'SQLOLD05', 'SQLDEV08' | Select-Object name, productVersion, discoveredBy, @{ n = 'idleDays'; e = { $_.databases.lastAccessDays } } | Format-Table

# Step 5: Change one file and check again
Copy-Item -Recurse "$Run/estate" "$Run/estate-tampered"
Add-Content -Path "$Run/estate-tampered/estate.csv" -Value '"SQLNEW09","2022","unknown","retain","","yes","added by hand"'
Test-SqlManifest -OutputPath "$Run/estate-tampered" | Format-Table

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# After the steps
Get-ChildItem C:\FMWLabs\results\sql-server-identity-01\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped `sql-server-identity-code.zip` under the learning path's [Get the code](../../../training/data-platform/index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

<!-- capture:begin 01-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-1.txt))](captures/01-1.png){.lightbox fig-alt="Terminal window showing Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity and what it printed"}

<!-- capture:end -->

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\sql-server-identity-01\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

<!-- capture:begin 01-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-2.txt))](captures/01-2.png){.lightbox fig-alt="Terminal window showing $Run = 'C:\FMWLabs\results\sql-server-identity-01\lab1\$(Get-Date -AsUTC -For… and what it printed"}

<!-- capture:end -->

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\sql-server-identity-01\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Classify the fictional estate.** Eight instances for `contoso.example`:

   ```powershell
   ./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath "$Run/estate"
   ```

   ```text
   Instance Version Classification Target    EntersMigration Reason
   -------- ------- -------------- ------    --------------- ------
   SQLPRD01 2022    retain                   yes             SQL Server 2022, in use
   SQLPRD02 2022    retain                   yes             SQL Server 2022, in use
   SQLLEG03 2016    consolidate    shared    at the target   SQL Server 2016 can't take Entra logins
   SQLFCI04 2019    retain                   yes             Constraint: The vendor certifies SQL Server 2019 only, through its 2027 release. Retained in place; upgrade or exception needed
   SQLOLD05 2014    retire                   no              Every database idle 400 days or more
   SQLPRD06 2025    retain                   yes             SQL Server 2025, in use; consolidation target
   SQLLEG07 2017    consolidate    dedicated at the target   Constraint (collation): GrantsTracking uses Latin1_General_CI_AS; the shared target uses SQL_Latin1_General_CP1_CI_AS.
   SQLDEV08 unknown review                   no              No version: discovery found the instance but nothing read it

   Wrote 2 files and manifest.json to C:/FMWLabs/results/sql-server-identity-01/lab1/<run>/estate
   Evidence for ESTATE (Classify every instance retain, consolidate, retire or review): CM-8; KSI-PIY-GIV
   Denominator: 8 instances (consolidate 2, retain 4, retire 1, review 1)
   ```

   <!-- capture:begin 01-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-3.txt))](captures/01-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputP… and what it printed"}

   <!-- capture:end -->

   Eight instances, and the denominator line counts each class. SQLFCI04 is retained only because of its vendor constraint; it's also a failover cluster instance, which Chapter 03 puts in Category 3.

2. **Open the manifest.** It names the step, its control and KSI, and the hash of each file:

   ```powershell
   Get-Content "$Run/estate/manifest.json"
   ```

   ```text
   {
     "step": "ESTATE",
     "title": "Classify every instance retain, consolidate, retire or review",
     "mode": "read-only",
     "asOf": "2026-11-20",
     "controls": [
       "CM-8"
     ],
     "ksis": [
       "KSI-PIY-GIV"
     ],
     "files": [
       {
         "file": "estate.csv",
         "sha256": "b5f09922d75718dce89151ce72bc8376df2e6db029d072c4ce4370243c4b38ad"
       },
       {
         "file": "estate.json",
         "sha256": "b9e75284a7ed6c29b9f10fe128aa1cd249753cf2b9b7920d27b671d38b3fe940"
       }
     ]
   }
   ```

   <!-- capture:begin 01-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-4.txt))](captures/01-4.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/estate/manifest.json' and what it printed"}

   <!-- capture:end -->

3. **Check the folder against its manifest:**

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   Test-SqlManifest -OutputPath "$Run/estate" | Format-Table
   ```

   ```text
   File        Recorded     Now          Match
   ----        --------     ---          -----
   estate.csv  b5f09922d757 b5f09922d757  True
   estate.json b9e75284a7ed b9e75284a7ed  True
   ```

   <!-- capture:begin 01-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-5.txt))](captures/01-5.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

4. **Look at the two instances that don't enter the migration.** SQLOLD05's only database was last used 912 days ago; SQLDEV08 is known only by its SPN:

   ```powershell
   (Read-SqlJson tests/fixtures/estate/estate.json).instances | Where-Object name -in 'SQLOLD05', 'SQLDEV08' | Select-Object name, productVersion, discoveredBy, @{ n = 'idleDays'; e = { $_.databases.lastAccessDays } } | Format-Table
   ```

   ```text
   name     productVersion discoveredBy      idleDays
   ----     -------------- ------------      --------
   SQLOLD05 12.0.6449.1                           912
   SQLDEV08                MSSQLSvc SPN only
   ```

   <!-- capture:begin 01-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-6.txt))](captures/01-6.png){.lightbox fig-alt="Terminal window showing (Read-SqlJson tests/fixtures/estate/estate.json).instances | Where-Object nam… and what it printed"}

   <!-- capture:end -->

   SQLDEV08 stays in review until someone reads it or confirms the host is gone.

5. **Change one file and check again.** A row added by hand no longer matches the manifest:

   ```powershell
   Copy-Item -Recurse "$Run/estate" "$Run/estate-tampered"
   Add-Content -Path "$Run/estate-tampered/estate.csv" -Value '"SQLNEW09","2022","unknown","retain","","yes","added by hand"'
   Test-SqlManifest -OutputPath "$Run/estate-tampered" | Format-Table
   ```

   ```text
   File        Recorded     Now          Match
   ----        --------     ---          -----
   estate.csv  b5f09922d757 a9fe6ab8be3b False
   estate.json b9e75284a7ed b9e75284a7ed  True
   ```

   <!-- capture:begin 01-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-7.txt))](captures/01-7.png){.lightbox fig-alt="Terminal window showing Copy-Item -Recurse '$Run/estate' '$Run/estate-tampered' and what it printed"}

   <!-- capture:end -->

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             8           0
   ```

   <!-- capture:begin 01-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-8.txt))](captures/01-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 01*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\sql-server-identity-01\lab1 -Name
```

<!-- capture:begin 01-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/01-9.txt))](captures/01-9.png){.lightbox fig-alt="Terminal window showing Get-ChildItem C:\FMWLabs\results\sql-server-identity-01\lab1 -Name and what it printed"}

<!-- capture:end -->

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Lab 2: a test instance

Use a test domain with at least one test SQL Server instance, never production. **The authors haven't run this lab.** Work in `examples/sql-server-identity` in a repository checkout, so the Start Kit is at `../start-kit`. You need PowerShell 7 with the ActiveDirectory module (RSAT), a domain-joined machine, a network path to the instance's port and UDP 1434, and a Windows login on the instance that holds the Start Kit's T-SQL read permissions ([rights table](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit#rights-each-part-needs)): `VIEW SERVER STATE` (`VIEW SERVER PERFORMANCE STATE` on SQL Server 2022 and later) for the usage view,[^sq01-index-usage] and `VIEW ANY DEFINITION` (`VIEW ANY SECURITY DEFINITION` on 2022 and later), without which `sys.server_principals` shows only the caller's own login, the system logins and the fixed roles.[^sq01-server-principals] Never `sysadmin`. You'll replace: `<sql-host>` (the test instance's host name, fully qualified).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Discover the test domain's SQL Server instances with the Start Kit
Import-Module ../start-kit/powershell/FMPSqlEstate
Invoke-FMPSqlEstateDiscovery -OutputPath lab2/start-kit -TargetServers <sql-host> -ProbeNetwork -QueryInstances

# Step 2: Read what it found
Import-Csv lab2/start-kit/SQL/SqlEstate.csv | Format-Table ServerName, InstanceName, SQLVersion, SourcesAgree, QueryStatus, Classification

# Step 3: Turn the Start Kit's output into the kit's inventory
$asOf = Get-Date
$est = Import-Csv lab2/start-kit/SQL/SqlEstate.csv
$dbs = @(Import-Csv lab2/start-kit/SQL/SqlDatabases.csv)
$age = { param($t) if ($t) { [int]($asOf - [datetime]$t).TotalDays } else { $null } }
$instances = foreach ($r in $est) {
    $h = $r.ServerName.Split('.')[0].ToUpperInvariant()
    [ordered]@{
        name           = if ($r.InstanceName -eq 'MSSQLSERVER') { $h } else { "$h\$($r.InstanceName)" }
        host           = $r.ServerName
        productVersion = if ($r.SQLVersion -and $r.SQLVersion -ne 'Unknown') { $r.SQLVersion } else { $null }
        edition        = $r.SQLEdition
        clustered      = $r.IsClustered -eq 'True'
        utilizationPct = $null
        databases      = @($dbs | Where-Object { $_.ServerName -eq $r.ServerName -and $_.InstanceName -eq $r.InstanceName -and $_.IsSystem -ne 'True' } | ForEach-Object {
            [ordered]@{ name = $_.DatabaseName; lastAccessDays = & $age $(if ($_.LastUserAccess) { $_.LastUserAccess } else { $r.EngineStartTime }); application = 'unknown'; applicationStatus = 'unknown' } })
        constraints    = @()
    }
}
[ordered]@{ asOf = $asOf.ToString('yyyy-MM-dd'); instances = @($instances) } | ConvertTo-Json -Depth 6 | Set-Content lab2/estate.json

# Step 4: Classify it
./Invoke-SqlEstate.ps1 -EstatePath lab2/estate.json -OutputPath lab2/estate-run

# Step 5: Back it out
Remove-Item -Recurse -Force lab2/start-kit, lab2/estate.json, lab2/estate-run
```

:::

<!-- labs:end -->

1. **Discover the test domain's SQL Server instances with the Start Kit.** It reads every `MSSQLSvc` SPN and SQL-named directory object in the domain, probes the Browser on each host it found and on `<sql-host>`, and reads each instance with SELECT-only T-SQL:

   ```powershell
   Import-Module ../start-kit/powershell/FMPSqlEstate
   Invoke-FMPSqlEstateDiscovery -OutputPath lab2/start-kit -TargetServers <sql-host> -ProbeNetwork -QueryInstances
   ```

2. **Read what it found.** `SourcesAgree` says whether every signal saw the instance on the same port; `Classification` is the Start Kit's own first pass:

   ```powershell
   Import-Csv lab2/start-kit/SQL/SqlEstate.csv | Format-Table ServerName, InstanceName, SQLVersion, SourcesAgree, QueryStatus, Classification
   ```

3. **Turn the Start Kit's output into the kit's inventory.** One instance per row; user databases only; a database with no recorded use gets the engine's uptime as its idle days, so an instance restarted recently is never retired on a reset counter. Application names and status are left `unknown` for the owners to fill:

   ```powershell
   $asOf = Get-Date
   $est = Import-Csv lab2/start-kit/SQL/SqlEstate.csv
   $dbs = @(Import-Csv lab2/start-kit/SQL/SqlDatabases.csv)
   $age = { param($t) if ($t) { [int]($asOf - [datetime]$t).TotalDays } else { $null } }
   $instances = foreach ($r in $est) {
       $h = $r.ServerName.Split('.')[0].ToUpperInvariant()
       [ordered]@{
           name           = if ($r.InstanceName -eq 'MSSQLSERVER') { $h } else { "$h\$($r.InstanceName)" }
           host           = $r.ServerName
           productVersion = if ($r.SQLVersion -and $r.SQLVersion -ne 'Unknown') { $r.SQLVersion } else { $null }
           edition        = $r.SQLEdition
           clustered      = $r.IsClustered -eq 'True'
           utilizationPct = $null
           databases      = @($dbs | Where-Object { $_.ServerName -eq $r.ServerName -and $_.InstanceName -eq $r.InstanceName -and $_.IsSystem -ne 'True' } | ForEach-Object {
               [ordered]@{ name = $_.DatabaseName; lastAccessDays = & $age $(if ($_.LastUserAccess) { $_.LastUserAccess } else { $r.EngineStartTime }); application = 'unknown'; applicationStatus = 'unknown' } })
           constraints    = @()
       }
   }
   [ordered]@{ asOf = $asOf.ToString('yyyy-MM-dd'); instances = @($instances) } | ConvertTo-Json -Depth 6 | Set-Content lab2/estate.json
   ```

4. **Classify it:**

   ```powershell
   ./Invoke-SqlEstate.ps1 -EstatePath lab2/estate.json -OutputPath lab2/estate-run
   ```

   Compare each row with the Start Kit's `Classification` from step 2. They should agree on version and zombie answers. Where they differ, the reason column says which rule decided. Add the owners' constraints and application status to `lab2/estate.json` and run step 4 again; the second run is the one to keep.

5. **Back it out.** Nothing on the instance or in the directory changed. Delete the lab's files, and have the instance's administrator remove the read permissions if they were granted for this lab:

   ```powershell
   Remove-Item -Recurse -Force lab2/start-kit, lab2/estate.json, lab2/estate-run
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Entra authentication for SQL Server | SQL Server 2022 and later; standalone instances and availability groups; not failover cluster instances | [^sq01-entra-sql] |
| `FROM EXTERNAL PROVIDER` | Arc-enabled SQL Server 2022 and later | [^sq01-create-login] |
| Last-use DMV | Counters empty at every engine start; a detached or shut-down database's rows removed; `VIEW SERVER STATE`, or `VIEW SERVER PERFORMANCE STATE` on 2022 and later | [^sq01-index-usage] |
| Seeing every login | Other logins need `ALTER ANY LOGIN` or a permission on the login; metadata visibility is limited to what the caller owns or was granted | [^sq01-server-principals] |

## Federal requirements and evidence

| What the step does | NIST SP 800-53 Rev 5 | FedRAMP 20x KSI | Evidence the ISSO keeps |
|---|---|---|---|
| Classifies every instance in the inventory and counts the denominator once (Lab 1, step 1; Lab 2, step 4) | Supports CM-8 (System Component Inventory) | KSI-PIY-GIV | The run folder: `estate.csv`, `estate.json` and `manifest.json`, with the SHA-256 of each file |
| Shows a changed file no longer matches its run (Lab 1, step 5) | Provides evidence for CM-8: the inventory kept is the one the run wrote | KSI-PIY-GIV | `Test-SqlManifest`'s output beside the run folder |

The controls and the KSI are the `ESTATE` step's in `config/requirements.json`. The run's files provide evidence for CM-8; the agency still sets the control's parameters, policy and procedures, and the assessor decides whether it's satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report KSIs itself.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Discovery missed an instance | It never enters the gate and keeps its Windows and SQL logins after closure | The Start Kit's three signals; `review` for anything found but unread; rerun before every wave |
| A restarted engine reads as idle | A used instance is retired | Lab 2's conversion counts idle days from the engine start when nothing is recorded; R02 asks for backup history and the application portfolio before a retire |
| A constraint isn't recorded | A vendor-locked or clustered instance is planned onto a shared target | Constraints per instance; rules 6 to 8; the architects' sign-off on each row |
| An unknown instance counts as retained | The migration surface is understated | No version means `review`, and a test pins it |
| The inventory holds no privacy fields | Book 06, Chapter 04's PII, SORN and PIA fields are missing from the gate's record | Keep them in the estate inventory beside the kit's run, filled by the database owners |

## Checklist

- [ ] The Start Kit's SQL Server count ran with `-QueryInstances`, and every instance in `review` has an owner and a date.
- [ ] Every constraint (vendor, collation, compliance isolation, indivisible dependency, failover cluster) is recorded on its instance.
- [ ] The architects confirmed or overrode every row, with the reason recorded.
- [ ] Every retire has backup history and the application portfolio behind it, not the usage counters alone.
- [ ] The run folder and its manifest are in the evidence store, and `Test-SqlManifest` passes on the stored copy.

::: {.callout-tip}
## Continue the book
[Workbook index](index.md) · [Next: Chapter 02 — The Authentication Audit →](02-the-authentication-audit.md)
:::

[^sq01-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server overview," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Nov 24, 2026).
[^sq01-create-login]: Microsoft Learn, "CREATE LOGIN (Transact-SQL)," FROM EXTERNAL PROVIDER, <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> (accessed Nov 24, 2026).
[^sq01-index-usage]: Microsoft Learn, "sys.dm_db_index_usage_stats (Transact-SQL)," remarks and permissions, <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-db-index-usage-stats-transact-sql> (accessed Nov 24, 2026).
[^sq01-server-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)," permissions, <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Nov 24, 2026).
