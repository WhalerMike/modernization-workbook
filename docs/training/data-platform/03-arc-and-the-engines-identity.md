---
title: "Data Platform, Module 3: Arc and the Engine's Identity"
subtitle: "An instance is ready for Entra logins only when the agent, the extension and its own Entra setting are all there"
description: "Module 3 of the Data Platform and SQL Server Identity learning path. You learn what Azure Arc gives the SQL Server engine, how the identity differs between SQL Server 2022 and 2025, and the deployment sequence and verification that gate login migration. Lab 1 settles four instances' Arc-eligibility categories, shows a snapshot from an unrecorded cloud refused and shows what an unconfirmed Entra setting does. Runbook R04; workbook Chapter 03."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 3
date-modified: 2026-11-25
review-status: approved
reviewed-sha256: 44b5e37fab46c42db25d4e1a67c7ee72eecb0f027a8afae7916644b43364ba6c
last-reviewed: 2026-11-27
---
# Data Platform, Module 3: Arc and the Engine's Identity {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 3 of 10 · 55 minutes · Runbook [R04](../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md) · Workbook [Chapter 03](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-dp-module-3) · [▶ Watch](../../presentations/watch.html?v=Training_DP_Module_3_Narrated) (about 12 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_DP_Module_3_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-3/Training_DP_Module_3_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-3/Training_DP_Module_3_Narrated.vtt).

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

An on-premises SQL Server host has no cloud identity of its own. Connecting it to Azure Arc gives the machine a system-assigned managed identity, and that identity is what lets the instance take part in Entra authentication: no Arc, no machine identity; no machine identity, no Entra login. Module 2 left every current, non-clustered instance at "Category 1 or 2". In this module you settle that category from evidence, the agent's status, the SQL extension's state and the instance's own Entra setting, read from the cloud a GCC (Moderate) tenant uses.

**The federal requirement.** [Chapter 03's table](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#federal-requirements-and-evidence) maps recording each instance's agent, extension and host to NIST SP 800-53 CM-8, with KSI-PIY-GIV; checking each instance's Entra configuration and refusing results from the wrong cloud to CM-6, with KSI-SVC-ACM; and naming the instances that can take Entra logins without a stored password to IA-5, with KSI-IAM-SNU. Runbook R04's [control states, change safety and evidence](../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md#b06-r04-control-states) lists the evidence for the deployment itself, ring by ring. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The run's files support these controls; the agency still sets each control's parameters, policy and procedures.

### Learning objectives

In this module, you'll:

- Explain what the Arc agent's managed identity gives the engine, and what the instance uses as its Entra identity on SQL Server 2022 and on 2025.
- Explain why engine Entra authentication (Layer 1) doesn't wait for OS-level Entra sign-in (Layer 2).
- Put the deployment steps in order, and name the checks that gate login migration.
- Settle each audited instance's category with the kit, and say why it refuses a snapshot from an unrecorded cloud.

### Prerequisites

- [Module 2](02-the-authentication-audit.md).
- For Resource Graph and its paging, [Microsoft Automation, Module 4](../ms-automation-arc.md).

## Unit 2: What Arc gives the engine

*10 minutes*

Installing the Connected Machine agent makes the server an Azure Resource Manager resource with a system-assigned managed identity whose credential the agent manages. What the instance uses as its Entra identity depends on the version: on SQL Server 2025, the Arc server's managed identity as its primary managed identity; on SQL Server 2022, an app registration with a certificate kept in Azure Key Vault, which the agent downloads with the machine's identity. Neither replaces the Windows account the service runs as. Layer 1, engine Entra authentication, proceeds on a domain-joined host; Layer 2, OS-level Entra sign-in, is a separate transformation. A GCC (Moderate) tenant uses Microsoft Entra ID in the commercial cloud, so its Arc resources are in a commercial Azure subscription in the same tenant, `AzureCloud`. Read:

- [Book 06, Chapter 09](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md), *What Arc Provides to SQL Server*: [the Arc agent and the ARM resource identity](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#the-arc-agent-and-the-arm-resource-identity), [the two-layer distinction](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#the-two-layer-distinction), [the managed identity and the service account](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#the-managed-identity-and-the-service-account), [what it costs and where it's available](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#what-it-costs-and-where-its-available) and [what Arc doesn't do](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#what-arc-doesnt-do).
- Runbook R04's [why Arc comes before login migration](../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md#why-arc-comes-before-login-migration) and [the right Azure cloud](../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md#the-right-azure-cloud).
- [Chapter 03: start with Microsoft's documentation](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#start-with-microsofts-documentation).

## Unit 3: The sequence and the gate

*10 minutes*

Arc deployment is a sequence: connectivity, then the agent, then the Azure extension for SQL Server, which Arc installs automatically on a host with SQL Server, then Entra authentication turned on for the instance, which is disabled by default. Verification is the gate between enrollment and migration: a token from the agent's local endpoint and a test Entra login. Pre-2022 instances and failover cluster instances upgrade, re-platform or carry a dated exception. The kit reads three things for each instance, agent, extension and Entra setting, and names whatever is missing. It refuses any snapshot whose cloud isn't `AzureCloud`. Resource Graph doesn't give it the Entra setting, so that's confirmed in the portal and recorded. Read:

- [Book 06, Chapter 10](../../books/b06-data-platform/10-arc-deployment-sequencing.md), *Arc Deployment Sequencing for SQL Server Hosts*: [prerequisites for Arc enrollment](../../books/b06-data-platform/10-arc-deployment-sequencing.md#prerequisites-for-arc-enrollment), [the Azure extension for SQL Server](../../books/b06-data-platform/10-arc-deployment-sequencing.md#the-azure-extension-for-sql-server), [enabling Microsoft Entra authentication on the instance](../../books/b06-data-platform/10-arc-deployment-sequencing.md#enabling-microsoft-entra-authentication-on-the-instance) and [verification of managed identity availability](../../books/b06-data-platform/10-arc-deployment-sequencing.md#verification-of-managed-identity-availability).
- [Book 06, Chapter 12, Decision 4](../../books/b06-data-platform/12-the-engine-authentication-decision.md#decision-4-pre-2022-instances-are-upgrade-or-except): pre-2022 instances are upgrade-or-except.
- Runbook R04's [verification checklist](../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md#verification-checklist) and [rollback](../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md#rollback).
- [Chapter 03: the snapshot](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#the-snapshot) and [the category](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#the-category).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*25 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-03-arc-and-the-engines-identity\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Read the fictional Arc results
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$arc = Read-SqlJson tests/fixtures/arc/arc.json
$arc.environment
$arc.machines | Format-Table

# Step 2: Settle the categories
./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run\arc"

# Step 3: Open the manifest
Get-Content "$Run\arc\manifest.json"

# Step 4: Try a snapshot whose cloud isn't recorded
$arc = Read-SqlJson tests/fixtures/arc/arc.json
$arc.environment = 'not-recorded'
$arc | ConvertTo-Json -Depth 6 | Set-Content "$Run\arc-unknown-cloud.json"
try { ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath "$Run\arc-unknown-cloud.json" -OutputPath "$Run\arc-refused" } catch { $_.Exception.Message }
Test-Path "$Run\arc-refused"

# Step 5: Leave SQLPRD01's Entra setting unconfirmed
$arc = Read-SqlJson tests/fixtures/arc/arc.json
$arc.sqlInstances[0].entraAuthentication.configured = $null
$arc | ConvertTo-Json -Depth 6 | Set-Content "$Run\arc-unconfirmed.json"
Get-SqlArcCategory -Audit (Read-SqlJson tests/fixtures/audit-day1/audit.json) -Arc (Read-SqlJson "$Run\arc-unconfirmed.json") | Where-Object Instance -eq 'SQLPRD01' | Format-List

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 03*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# Step 7: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-03-arc-and-the-engines-identity\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 03, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-03-arc-and-the-engines-identity\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-03-arc-and-the-engines-identity\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Read the fictional Arc results.** Their cloud, and the three machines Resource Graph returned:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   $arc = Read-SqlJson tests/fixtures/arc/arc.json
   $arc.environment
   $arc.machines | Format-Table
   ```

   ```text
   AzureCloud

   name        status       agentVersion
   ----        ------       ------------
   sqlprd01    Connected    1.58
   sqlprd06    Connected    1.58
   sqlfci04-n1 Disconnected 1.49
   ```

2. **Settle the categories:**

   ```powershell
   ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run\arc"
   ```

   ```text
   Instance Version Agent                  Extension Entra           Category Next
   -------- ------- -----                  --------- -----           -------- ----
   SQLPRD01 2022    Connected              deployed  appRegistration        1 Ready: plan the logins (Chapter 04)
   SQLPRD02 2022    not installed          missing   not configured         2 Deploy Arc (Runbook R04): agent not installed; SQL extension not deployed; Entra authentication not configured
   SQLFCI04 2019    cluster: see its nodes missing   not configured         3 Re-platform as a standalone instance or availability group, or record an exception
   SQLPRD06 2025    Connected              deployed  managedIdentity        1 Ready: plan the logins (Chapter 04)

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-03-arc-and-the-engines-identity/lab1/<run>/arc
   Evidence for ARC (Arc agent, SQL extension and Entra configuration: the Arc-eligibility category): CM-8, CM-6, IA-5; KSI-PIY-GIV, KSI-SVC-ACM, KSI-IAM-SNU
   ```

   SQLPRD01 uses an app registration, as SQL Server 2022 does; SQLPRD06, on 2025, the managed identity. SQLFCI04 is Category 3 whatever Arc shows, and its `Agent` reads `cluster: see its nodes`: a failover cluster instance has no machine of its own name, so the check doesn't guess one. Its node `sqlfci04-n1` is in the snapshot as `Disconnected`; read the node machines there for the re-platform plan.

3. **Open the manifest:**

   ```powershell
   Get-Content "$Run\arc\manifest.json"
   ```

   ```text
   {
     "step": "ARC",
     "title": "Arc agent, SQL extension and Entra configuration: the Arc-eligibility category",
     "mode": "read-only",
     "asOf": "2026-11-20",
     "controls": [
       "CM-8",
       "CM-6",
       "IA-5"
     ],
     "ksis": [
       "KSI-PIY-GIV",
       "KSI-SVC-ACM",
       "KSI-IAM-SNU"
     ],
     "files": [
       {
         "file": "arc.csv",
         "sha256": "366ecdc0a8d24fffd2440bc5c145116296f7048d2454e0ac3518bc94126be565"
       },
       {
         "file": "arc.json",
         "sha256": "6659fc238edc10a2df5e57479b8996e37bcdb9abcd3fdb5147c151e80e82ddf2"
       }
     ]
   }
   ```

4. **Try a snapshot whose cloud isn't recorded.** The check refuses it and writes nothing:

   ```powershell
   $arc = Read-SqlJson tests/fixtures/arc/arc.json
   $arc.environment = 'not-recorded'
   $arc | ConvertTo-Json -Depth 6 | Set-Content "$Run\arc-unknown-cloud.json"
   try { ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath "$Run\arc-unknown-cloud.json" -OutputPath "$Run\arc-refused" } catch { $_.Exception.Message }
   Test-Path "$Run\arc-refused"
   ```

   ```text
   The Arc results came from 'not-recorded'. A GCC (Moderate) tenant's Arc resources are in AzureCloud (WD-028).
   False
   ```

5. **Leave SQLPRD01's Entra setting unconfirmed.** This is what every instance looks like in Lab 2 until you confirm it:

   ```powershell
   $arc = Read-SqlJson tests/fixtures/arc/arc.json
   $arc.sqlInstances[0].entraAuthentication.configured = $null
   $arc | ConvertTo-Json -Depth 6 | Set-Content "$Run\arc-unconfirmed.json"
   Get-SqlArcCategory -Audit (Read-SqlJson tests/fixtures/audit-day1/audit.json) -Arc (Read-SqlJson "$Run\arc-unconfirmed.json") | Where-Object Instance -eq 'SQLPRD01' | Format-List
   ```

   ```text
   Instance  : SQLPRD01
   Version   : 2022
   Agent     : Connected
   Extension : deployed
   Entra     : not configured
   Category  : 2
   Next      : Deploy Arc (Runbook R04): Entra authentication not configured
   ```

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 03*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             5           0
   ```

7. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-03-arc-and-the-engines-identity\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can say why each of the four audited instances is Category 1, 2 or 3, why the check refused a snapshot whose cloud wasn't recorded, and why SQLPRD01 drops to Category 2 when its Entra setting is left unconfirmed.

## Unit 5: Exercise: Lab 2 (your test subscription)

*Not timed. Not run by the authors.*

Sign in to commercial Azure with the Reader role, export an Arc snapshot through Azure Resource Graph, and settle the categories as Resource Graph leaves them. Then confirm one instance's Entra setting in the portal, record it in a separate copy, and settle the categories again. Nothing in Azure changes. Follow [Chapter 03, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#lab-2-a-test-subscription).

- **You need:** a commercial Azure (`AzureCloud`) test subscription in the test tenant, which is where a Microsoft 365 GCC (Moderate) tenant's Arc resources live, with at least one Arc-enabled test server running SQL Server, never production; PowerShell 7 with the `Az.Accounts` and `Az.ResourceGraph` modules; a person who holds Reader on the subscription and nothing more for the lab; and Module 2's Lab 2 snapshot, `lab2/audit.json`, from the same instances.
- **Back it out:** step 6 signs out and deletes the snapshot, the confirmed copy and both check folders.

## Unit 6: Knowledge check

*5 minutes*

1. SQLPRD01 runs SQL Server 2022 with its agent `Connected` and its extension deployed, but its Entra setting is left unconfirmed. Which category does the kit give it?
   a. Category 1
   b. Category 2, with "Entra authentication not configured"
   c. Category 3

2. What does the check do with a snapshot whose `environment` isn't `AzureCloud`?
   a. It refuses it and writes nothing.
   b. It judges it and adds a warning.
   c. It puts every instance in Category 2.

3. On SQL Server 2022, what does the instance use as its Entra identity?
   a. The Arc server's system-assigned managed identity, as its primary managed identity
   b. The gMSA the engine runs as
   c. An app registration with a certificate in Azure Key Vault, downloaded to the host by the Arc agent

4. A domain-joined Windows Server 2019 host runs SQL Server 2022 with Arc. Must engine Entra authentication wait for the server to leave the domain?
   a. Yes: Layer 1 needs domain unjoin.
   b. No: Layer 1 proceeds on a domain-joined host; OS-level Entra sign-in (Layer 2) is sequenced separately.
   c. Only until the host moves to Windows Server 2025.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See step 5 of [Chapter 03, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#lab-1-fixtures-no-tenant) and [the category](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#the-category).
2. **a.** See step 4 of [Chapter 03, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#lab-1-fixtures-no-tenant) and [what it leaves to you](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#what-it-leaves-to-you).
3. **c.** See [Book 06, Chapter 09: the managed identity and the service account](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#the-managed-identity-and-the-service-account) and [Chapter 10: enabling Microsoft Entra authentication on the instance](../../books/b06-data-platform/10-arc-deployment-sequencing.md#enabling-microsoft-entra-authentication-on-the-instance).
4. **b.** See [Book 06, Chapter 09: the two-layer distinction](../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#the-two-layer-distinction) and [Chapter 08: the SQL engine versus OS Entra sign-in distinction](../../books/b06-data-platform/08-reading-the-audit.md#the-sql-engine-versus-os-entra-sign-in-distinction).
:::

## Unit 7: Summary

*2 minutes*

You learned what Arc gives the engine, how its Entra identity differs between SQL Server 2022 and 2025, and the sequence and checks that gate login migration. You settled four instances' categories from evidence and saw the check refuse results from an unrecorded cloud.

**Evidence an ISSO keeps from this module:** the Arc snapshot as Resource Graph returned it; `arc.csv`, `arc.json` and `manifest.json` with the SHA-256 of each file; and the confirmed snapshot, naming who confirmed the Entra setting and when, with the second run's manifest (Chapter 03). Before shipping, work through the [Chapter 03 checklist](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 2](02-the-authentication-audit.md) · [Learning path](index.md) · [Next: Module 4, Entra logins and the parallel run →](04-entra-logins-and-the-parallel-run.md)
:::
