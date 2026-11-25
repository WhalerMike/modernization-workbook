---
title: "Data Platform, Module 1: The Estate and the Consolidation Gate"
subtitle: "Count every SQL Server instance first, then decide which ones the identity work is spent on"
description: "Module 1 of the Data Platform and SQL Server Identity learning path. You learn why a twenty-year estate is counted and rationalized before any login moves, and how the retain, consolidate and retire gate decides which instances enter the migration. Lab 1 classifies a fictional eight-instance estate and checks the run against its hashed manifest. Runbook R02; workbook Chapter 01."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 1
date-modified: 2026-11-25
review-status: pending
---
# Data Platform, Module 1: The Estate and the Consolidation Gate {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 1 of 10 · 50 minutes · Runbook [R02](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md) · Workbook [Chapter 01](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

After twenty years across an Active Directory forest, the SQL Server estate is larger than anyone's list of it, and part of it shouldn't survive the transformation at all. Migrating the logins of an instance you retire three months later is wasted work. So the identity work starts with a count: one row per instance, classified retain, consolidate, retire or review, before any login is touched. Only retained instances and consolidation targets go on to the migration. In this module you see how that gate is decided and run the kit's classifier over a fictional estate.

**The federal requirement.** [Chapter 01's table](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#federal-requirements-and-evidence) maps the classification and the manifest check to NIST SP 800-53 CM-8, with KSI-PIY-GIV. Runbook R02 maps [the rights each depth of discovery needs](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#the-rights-each-depth-of-discovery-needs) to AC-6, CM-8 and CM-8(1), and IA-5, and its [reconciliation with Azure Arc](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#reconcile-the-forest-with-azure-arc) to CM-8 and CM-8(1) and KSI-PIY-GIV. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The run's files support these controls; the agency still sets each control's parameters, policy and procedures.

### Learning objectives

In this module, you'll:

- Name the three forms of sprawl in a twenty-year estate, and say why the inventory comes before the authentication audit.
- Apply the three rationalization lenses (utilization, version, dependencies) and say which classes enter the migration.
- Explain how a recorded constraint changes a first-pass answer, and why an instance nothing could read lands in review.
- Classify a fictional estate with the kit and show that a changed file no longer matches its manifest.

### Prerequisites

- The path's [Get the code](index.md#get-the-code) steps.
- [Book 06, Chapter 01](../../books/b06-data-platform/01-what-windows-authentication-actually-is.md), *What Windows Authentication Actually Is*.

## Unit 2: Finding the estate

*9 minutes*

An estate grows by accretion: a development instance becomes production, a vendor test instance is never decommissioned, an installer drops SQL Server Express on an application server. Book 06, Chapter 03, *The Shape of Twenty Years*, names three overlapping problems, too many instances, too many databases and too many forest-spanning dependencies, and says the transformation doesn't begin until they're assessed. No single instrument finds every instance, so discovery combines the network and directory sweep, the `MSSQLSvc` SPN trail and Microsoft's assessment tooling, and fuses them into one inventory that counts each instance once. The kit doesn't rebuild discovery: the Start Kit's SQL Server count finds the instances, and the kit classifies what it found. Read:

- [Book 06, Chapter 03](../../books/b06-data-platform/03-the-shape-of-twenty-years.md): [instance sprawl](../../books/b06-data-platform/03-the-shape-of-twenty-years.md#instance-sprawl), [database sprawl](../../books/b06-data-platform/03-the-shape-of-twenty-years.md#database-sprawl) and [forest entanglement](../../books/b06-data-platform/03-the-shape-of-twenty-years.md#forest-entanglement).
- [Book 06, Chapter 04](../../books/b06-data-platform/04-the-estate-inventory.md): [what the inventory must capture](../../books/b06-data-platform/04-the-estate-inventory.md#what-the-inventory-must-capture), [discovery instruments](../../books/b06-data-platform/04-the-estate-inventory.md#discovery-instruments) and [privacy in the inventory](../../books/b06-data-platform/04-the-estate-inventory.md#privacy-in-the-inventory).
- Runbook R02's [Step 1, build the estate inventory](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#step-1-build-the-estate-inventory-read-only), with its rights table.
- [Chapter 01: where the inventory comes from](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#where-the-inventory-comes-from).

## Unit 3: The gate

*9 minutes*

Three lenses turn the inventory into a judgment. Utilization finds zombies: a database with no connections in 400 or more days, no restores consumed and a retired owning application. Version decides what can take Entra logins at all, since `FROM EXTERNAL PROVIDER` needs SQL Server 2022 or later. Dependencies, such as linked servers, replication and SSIS packages, are what most often overturn a naive plan. The result is one class per instance: retain, consolidate into a target, or retire. Collation conflicts, version-locked vendor applications, compliance isolation, indivisible dependencies and failover cluster instances turn an apparent consolidation into a dedicated target or a retain in place. The kit's classifier follows R02's first pass, applies the recorded constraints, and puts an instance with no version in **review**, never in retain. The architects confirm or override every row. Read:

- [Book 06, Chapter 05](../../books/b06-data-platform/05-rationalization.md): [utilization and zombie detection](../../books/b06-data-platform/05-rationalization.md#utilization-and-zombie-detection), [version and end-of-life posture](../../books/b06-data-platform/05-rationalization.md#version-and-end-of-life-posture) and [dependency mapping](../../books/b06-data-platform/05-rationalization.md#dependency-mapping).
- [Book 06, Chapter 06](../../books/b06-data-platform/06-retain-consolidate-retire.md): [the three classifications](../../books/b06-data-platform/06-retain-consolidate-retire.md#the-three-classifications) and [what can't be consolidated](../../books/b06-data-platform/06-retain-consolidate-retire.md#what-cant-be-consolidated).
- Runbook R02's [Step 2, the three lenses](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#step-2-apply-the-three-rationalization-lenses-read-only) and [Step 3, the gate](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#step-3-the-retain-consolidate-retire-decision-the-gate).
- [Chapter 01: the classifier](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#the-classifier) and [the manifest](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#the-manifest).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*22 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-01\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Classify the fictional estate
./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath "$Run\estate"

# Step 2: Open the manifest
Get-Content "$Run\estate\manifest.json"

# Step 3: Check the folder against its manifest
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
Test-SqlManifest -OutputPath "$Run\estate"

# Step 4: Look at the two instances that don't enter the migration
(Read-SqlJson tests/fixtures/estate/estate.json).instances | Where-Object name -in 'SQLOLD05', 'SQLDEV08' | Select-Object name, productVersion, discoveredBy, @{ n = 'idleDays'; e = { $_.databases.lastAccessDays } }

# Step 5: Change one file and check again
Copy-Item -Recurse "$Run\estate" "$Run\estate-tampered"
Add-Content -Path "$Run\estate-tampered\estate.csv" -Value '"SQLNEW09","2022","unknown","retain","","yes","added by hand"'
Test-SqlManifest -OutputPath "$Run\estate-tampered"

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# Step 7: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-01\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 01, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-01\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-01\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way. Where an expected output starts with `Exception:`, PowerShell also prints the script line that threw, above the message shown. In a clone of the repository, work in `examples/sql-server-identity` instead of the kit's folder.

1. **Classify the fictional estate.** Eight instances for `contoso.example`:

   ```powershell
   ./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath "$Run\estate"
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

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-01/lab1/<run>/estate
   Evidence for ESTATE (Classify every instance retain, consolidate, retire or review): CM-8; KSI-PIY-GIV
   Denominator: 8 instances (consolidate 2, retain 4, retire 1, review 1)
   ```

   Eight instances, and the denominator line counts each class. SQLFCI04 is retained only because of its vendor constraint; it's also a failover cluster instance, which Chapter 03 puts in Category 3.

2. **Open the manifest.** It names the step, its control and KSI, and the hash of each file:

   ```powershell
   Get-Content "$Run\estate\manifest.json"
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

3. **Check the folder against its manifest:**

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   Test-SqlManifest -OutputPath "$Run\estate"
   ```

   ```text
   File        Recorded     Now          Match
   ----        --------     ---          -----
   estate.csv  b5f09922d757 b5f09922d757  True
   estate.json b9e75284a7ed b9e75284a7ed  True
   ```

4. **Look at the two instances that don't enter the migration.** SQLOLD05's only database was last used 912 days ago; SQLDEV08 is known only by its SPN:

   ```powershell
   (Read-SqlJson tests/fixtures/estate/estate.json).instances | Where-Object name -in 'SQLOLD05', 'SQLDEV08' | Select-Object name, productVersion, discoveredBy, @{ n = 'idleDays'; e = { $_.databases.lastAccessDays } }
   ```

   ```text
   name     productVersion discoveredBy      idleDays
   ----     -------------- ------------      --------
   SQLOLD05 12.0.6449.1                           912
   SQLDEV08                MSSQLSvc SPN only
   ```

   SQLDEV08 stays in review until someone reads it or confirms the host is gone.

5. **Change one file and check again.** A row added by hand no longer matches the manifest:

   ```powershell
   Copy-Item -Recurse "$Run\estate" "$Run\estate-tampered"
   Add-Content -Path "$Run\estate-tampered\estate.csv" -Value '"SQLNEW09","2022","unknown","retain","","yes","added by hand"'
   Test-SqlManifest -OutputPath "$Run\estate-tampered"
   ```

   ```text
   File        Recorded     Now          Match
   ----        --------     ---          -----
   estate.csv  b5f09922d757 a9fe6ab8be3b False
   estate.json b9e75284a7ed b9e75284a7ed  True
   ```

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             8           0
   ```

7. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-01\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can say why each of the eight fictional instances got its class, including SQLFCI04's vendor constraint and SQLDEV08's review, and show that a row added by hand no longer matches the manifest.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Run the Start Kit's SQL Server discovery against a test domain, turn its output into the kit's inventory, and classify it. Compare each row with the Start Kit's own first pass, add the owners' constraints and application status, and classify again; the second run is the one to keep. Nothing on the instance or in the directory changes. Follow [Chapter 01, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#lab-2-a-test-instance).

- **You need:** a test domain with at least one test SQL Server instance, never production; a repository checkout, so the Start Kit is at `../start-kit`; PowerShell 7 with the ActiveDirectory module (RSAT) on a domain-joined machine; a network path to the instance's port and UDP 1434; and a Windows login on the instance holding the Start Kit's read permissions, `VIEW SERVER STATE` (`VIEW SERVER PERFORMANCE STATE` on SQL Server 2022 and later) and `VIEW ANY DEFINITION` (`VIEW ANY SECURITY DEFINITION` on 2022 and later). Never `sysadmin`.
- **Back it out:** step 5 deletes the lab's files; have the instance's administrator remove the read permissions if they were granted for the lab.

## Unit 6: Knowledge check

*5 minutes*

1. SQLDEV08 was found only by its `MSSQLSvc` SPN, and nothing read its version. How does the kit classify it?
   a. retain, because discovery found it
   b. retire, because nothing reads it
   c. review, until someone reads it or confirms the host is gone

2. SQLFCI04 runs SQL Server 2019, yet the kit retains it. Why?
   a. A recorded vendor constraint keeps it in place; an upgrade or exception is still needed.
   b. SQL Server 2019 can take Entra logins.
   c. Failover cluster instances are always retained.

3. You add a row by hand to `estate.csv` and run `Test-SqlManifest`. What does it show?
   a. Both files still match, because the manifest only checks names.
   b. `estate.csv` no longer matches its recorded hash; `estate.json` still does.
   c. It refuses to read the folder.

4. The index-usage DMV shows no use for a database on an instance that restarted last week. What does R02 tell you?
   a. Retire it: it's a zombie.
   b. The counters reset when the engine starts; read the start time, and take the long-horizon evidence from login auditing, backup history and the application portfolio.
   c. Raise the zombie threshold to 30 days.

::: {.callout-tip collapse="true"}
## Check your answers
1. **c.** No version means review, never retain. See [Chapter 01: the classifier](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#the-classifier) and step 4 of its [Lab 1](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#lab-1-fixtures-no-tenant).
2. **a.** Rule 6 of [the classifier](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#the-classifier); see also [Book 06, Chapter 06: what can't be consolidated](../../books/b06-data-platform/06-retain-consolidate-retire.md#what-cant-be-consolidated).
3. **b.** See step 5 of [Chapter 01, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#lab-1-fixtures-no-tenant) and [the manifest](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#the-manifest).
4. **b.** See R02's [Lens 1, utilization and zombie detection](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#lens-1-utilization-and-zombie-detection) and [Chapter 01: dangers](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#dangers).
:::

## Unit 7: Summary

*2 minutes*

You learned why the estate is counted and rationalized before any login moves, and how the gate sorts every instance into retain, consolidate, retire or review. You classified a fictional estate and saw its manifest catch a file changed after the run.

**Evidence an ISSO keeps from this module:** the run folder, `estate.csv`, `estate.json` and `manifest.json` with the SHA-256 of each file, and `Test-SqlManifest`'s output beside it, rerun on the stored copy (Chapter 01). Before shipping, work through the [Chapter 01 checklist](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md#checklist).

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, The authentication audit →](02-the-authentication-audit.md)
:::
