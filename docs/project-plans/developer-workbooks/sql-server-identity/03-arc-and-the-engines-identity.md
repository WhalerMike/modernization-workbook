---
title: "Chapter 03 — Arc and the Engine's Identity"
description: "Runbook R04's readiness check as code: the kit joins the authentication audit to Azure Resource Graph results for Arc machines, the Azure extension for SQL Server and the SQL Server instances Arc registered, refuses results from any cloud but commercial Azure (AzureCloud), and settles each instance's Arc-eligibility category with the next action and a hashed manifest. Labs against fictional Arc results and a test subscription read with the Reader role."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 3
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 07eee4176abdce09ba30e2bcfa5b61622aaac8ab2012c4ace0e4e07c5da31926
last-reviewed: 2026-11-25
---
# Chapter 03 — Arc and the Engine's Identity

*An instance is ready for Entra logins only when the agent, the extension and the instance's own Entra setting are all there, and the check reads all three.*

::: {.callout-note}
## In this chapter
The code behind the verification gate of [Runbook R04](../../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md#verification-checklist) and the categories [Book 06, Chapter 07](../../../books/b06-data-platform/07-the-authentication-audit.md#the-arc-eligibility-output) defines, for the identity [Chapter 09](../../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md) explains and the sequence [Chapter 10](../../../books/b06-data-platform/10-arc-deployment-sequencing.md) sets. You start with what Learn says each SQL Server version needs, then read `Get-SqlArcCategory` and its cloud check. Lab 1 joins Chapter 02's audit to fictional Arc results, shows a snapshot from an unrecorded cloud refused, and shows what an unconfirmed Entra setting does. Lab 2 reads a test subscription through Azure Resource Graph with the Reader role. Nothing here deploys Arc; R04 does that.
:::

## Goal and audience

**Goal.** By the end of this chapter you can settle every audited instance's Arc-eligibility category, 1, 2 or 3, from evidence: the Connected Machine agent's status, the Azure extension for SQL Server's provisioning state and the instance's Entra configuration, read from the cloud a GCC (Moderate) tenant uses.

**Audience.** Developers who build or maintain the kit, and the infrastructure team that deploys Arc. You don't need a subscription until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

SQL Server enabled by Azure Arc supports SQL Server 2014 and later, but Microsoft Entra authentication through it "requires SQL Server 2022 (16.x) or later", and the Microsoft Entra authentication setting is disabled by default and configured on the extension per instance.[^sq03-arc-overview] Learn's license table lists Microsoft Entra authentication for license-only, Software Assurance or subscription, and pay-as-you-go alike.[^sq03-arc-overview] What the instance uses as its Entra identity depends on the version. On SQL Server 2022, it's an app registration whose certificate is kept in Azure Key Vault and downloaded to the host by the Arc agent, set from the **Microsoft Entra ID and Purview** page of the **SQL Server – Azure Arc** resource.[^sq03-appreg] On SQL Server 2025, it can be the Arc server's system-assigned managed identity, used as the instance's primary managed identity for inbound and outbound connections; only system-assigned identities are supported, SQL Server needs access to the Azure public cloud for Entra authentication, and once it's enabled, disabling it isn't advisable.[^sq03-mi] Neither version supports Entra authentication on a failover cluster instance.[^sq03-entra-sql]

Azure Resource Graph reads all of this without calling each resource: a query needs at least read access to the resources, and "no results are returned" for objects the caller can't read; its data "isn't strongly consistent".[^sq03-arg] In PowerShell, `Search-AzGraph` returns at most 1,000 rows per call (`-First` allows 1 to 1,000, default 100) and pages with `-SkipToken`; Learn notes that "keeping id in the results is mandatory to get back a skip token".[^sq03-search] An Arc machine's `status` is `Connected`, `Disconnected`, `Error` or `AwaitingConnection`.[^sq03-machine] [Microsoft Automation, Module 4](../../../training/ms-automation-arc.md#unit-3-resource-graph) teaches the Graph client, paging, throttling and the Arc records in full; this chapter doesn't repeat it.

**The cloud.** Learn says "Office 365 and Office 365 GCC are paired with Microsoft Entra ID in Azure", the commercial cloud.[^sq03-gcc] The program's Arc resources for a GCC (Moderate) tenant are therefore in a commercial Azure subscription in the same tenant, `AzureCloud`: decided as [WD-028](../../../about/decision-register.md#wd-028) for Arc and SQL Server and [WD-085](../../../about/decision-register.md#wd-085) for the agency's Azure, which [WD-155](../../../about/decision-register.md#wd-155) now carries.

### What it leaves to you

Each row is pinned by a test in the `Chapter 03` block of `tests/SqlIdentity.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| The agent, the extension and the Entra setting are three resources and one setting | An instance with two of three looks ready in the portal | `Get-SqlArcCategory` reads all three and names whatever is missing in `Next` |
| Category rules are in Book 06, not in Learn | A pre-2022 instance or a cluster can be scheduled for Arc work it can't use | Category 3 for a failover cluster instance or a version before 2022, before Arc is looked at |
| Resource Graph returns nothing, not an error, for what the caller can't read | "No machine" and "no access" look the same | The check reports `not installed` and keeps the instance in Category 2; Lab 2 checks the sign-in first |
| The cloud is a sign-in choice | A snapshot from the wrong cloud judges the wrong estate | The check refuses any snapshot whose `environment` isn't `AzureCloud` |
| The managed identity method is SQL Server 2025's | A 2022 instance recorded as `managedIdentity` points at the wrong setup | A note in `Next` when a Category 1 instance before 2025 records the managed identity method |

## The code

### The snapshot

`Export-SqlArcSnapshot.ps1` signs in nowhere itself: it refuses to run unless the current Az context is `AzureCloud`, then runs three Resource Graph queries over the subscriptions you name. Each query projects `id` and ends `order by id asc`, so `Search-AzGraph` returns a skip token and the script pages past 1,000 rows without repeating or skipping any, the pattern Microsoft Automation, Module 4 uses:

| Query | Resource type | What it keeps |
|---|---|---|
| Machines | `microsoft.hybridcompute/machines` | name, `status`, agent version |
| Extensions | `microsoft.hybridcompute/machines/extensions`, type `WindowsAgent.SqlServer` or `LinuxAgent.SqlServer` | machine, type, `provisioningState` |
| SQL Server instances | `microsoft.azurearcdata/sqlserverinstances` | instance name (a named instance as `HOST\INSTANCE`, from the resource name's `HOST_INSTANCE`), host machine, version |

It writes `environment` from the context, and leaves each instance's `entraAuthentication.configured` null: whether Entra authentication is set isn't read from Resource Graph here, so it's confirmed in the portal and recorded (Lab 2, step 4).

### The category

`Get-SqlArcCategory` takes Chapter 02's audit and the snapshot. For each audited instance:

| Condition | Category | Next |
|---|---|---|
| A failover cluster instance | 3 | Re-platform as a standalone instance or availability group, or record an exception |
| No version, or before SQL Server 2022 | 3 | Upgrade to SQL Server 2022 or later first |
| Agent not `Connected`, extension not `Succeeded`, or Entra not configured | 2 | Deploy Arc (Runbook R04), naming each missing piece |
| All three present on 2022 or later | 1 | Plan the logins (Chapter 04) |

`Invoke-SqlArcCheck.ps1` writes `arc.csv`, `arc.json` and `manifest.json`. The as-of date is the snapshot's.

::: {.callout-important}
## Illustrative code
Lab 1 reads fixtures; nothing signs in to Azure. Tested against fixtures, not a live subscription.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\sql-server-identity-03\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Read the fictional Arc results
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$arc = Read-SqlJson tests/fixtures/arc/arc.json
$arc.environment
$arc.machines | Format-Table

# Step 2: Settle the categories
./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run/arc"

# Step 3: Open the manifest
Get-Content "$Run/arc/manifest.json"

# Step 4: Try a snapshot whose cloud isn't recorded
$arc = Read-SqlJson tests/fixtures/arc/arc.json
$arc.environment = 'not-recorded'
$arc | ConvertTo-Json -Depth 6 | Set-Content "$Run/arc-unknown-cloud.json"
try { ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath "$Run/arc-unknown-cloud.json" -OutputPath "$Run/arc-refused" } catch { $_.Exception.Message }
Test-Path "$Run/arc-refused"

# Step 5: Leave SQLPRD01's Entra setting unconfirmed
$arc = Read-SqlJson tests/fixtures/arc/arc.json
$arc.sqlInstances[0].entraAuthentication.configured = $null
$arc | ConvertTo-Json -Depth 6 | Set-Content "$Run/arc-unconfirmed.json"
Get-SqlArcCategory -Audit (Read-SqlJson tests/fixtures/audit-day1/audit.json) -Arc (Read-SqlJson "$Run/arc-unconfirmed.json") | Where-Object Instance -eq 'SQLPRD01' | Format-List

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 03*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# After the steps
Get-ChildItem C:\FMWLabs\results\sql-server-identity-03\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped `sql-server-identity-code.zip` under the learning path's [Get the code](../../../training/data-platform/index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

<!-- capture:begin 03-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-1.txt))](captures/03-1.png){.lightbox fig-alt="Terminal window showing Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity and what it printed"}

<!-- capture:end -->

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\sql-server-identity-03\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

<!-- capture:begin 03-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-2.txt))](captures/03-2.png){.lightbox fig-alt="Terminal window showing $Run = 'C:\FMWLabs\results\sql-server-identity-03\lab1\$(Get-Date -AsUTC -For… and what it printed"}

<!-- capture:end -->

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\sql-server-identity-03\lab1\<run>
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

   <!-- capture:begin 03-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-3.txt))](captures/03-3.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

2. **Settle the categories:**

   ```powershell
   ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath "$Run/arc"
   ```

   ```text
   Instance Version Agent                  Extension Entra           Category Next
   -------- ------- -----                  --------- -----           -------- ----
   SQLPRD01 2022    Connected              deployed  appRegistration        1 Ready: plan the logins (Chapter 04)
   SQLPRD02 2022    not installed          missing   not configured         2 Deploy Arc (Runbook R04): agent not installed; SQL extension not deployed; Entra authentication not configured
   SQLFCI04 2019    cluster: see its nodes missing   not configured         3 Re-platform as a standalone instance or availability group, or record an exception
   SQLPRD06 2025    Connected              deployed  managedIdentity        1 Ready: plan the logins (Chapter 04)

   Wrote 2 files and manifest.json to C:/FMWLabs/results/sql-server-identity-03/lab1/<run>/arc
   Evidence for ARC (Arc agent, SQL extension and Entra configuration: the Arc-eligibility category): CM-8, CM-6, IA-5; KSI-PIY-GIV, KSI-SVC-ACM, KSI-IAM-SNU
   ```

   <!-- capture:begin 03-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-4.txt))](captures/03-4.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Arc… and what it printed"}

   <!-- capture:end -->

   SQLPRD01 uses an app registration, as SQL Server 2022 does; SQLPRD06, on 2025, the managed identity. SQLFCI04 is Category 3 whatever Arc shows, and its `Agent` reads `cluster: see its nodes`: a failover cluster instance has no machine of its own name, so the check doesn't guess one. Its node `sqlfci04-n1` is in the snapshot as `Disconnected`; read the node machines there for the re-platform plan.

3. **Open the manifest:**

   ```powershell
   Get-Content "$Run/arc/manifest.json"
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

   <!-- capture:begin 03-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-5.txt))](captures/03-5.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/arc/manifest.json' and what it printed"}

   <!-- capture:end -->

4. **Try a snapshot whose cloud isn't recorded.** The check refuses it and writes nothing:

   ```powershell
   $arc = Read-SqlJson tests/fixtures/arc/arc.json
   $arc.environment = 'not-recorded'
   $arc | ConvertTo-Json -Depth 6 | Set-Content "$Run/arc-unknown-cloud.json"
   try { ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath "$Run/arc-unknown-cloud.json" -OutputPath "$Run/arc-refused" } catch { $_.Exception.Message }
   Test-Path "$Run/arc-refused"
   ```

   ```text
   The Arc results came from 'not-recorded'. A GCC (Moderate) tenant's Arc resources are in AzureCloud (WD-028).
   False
   ```

   <!-- capture:begin 03-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-6.txt))](captures/03-6.png){.lightbox fig-alt="Terminal window showing $arc = Read-SqlJson tests/fixtures/arc/arc.json and what it printed"}

   <!-- capture:end -->

5. **Leave SQLPRD01's Entra setting unconfirmed.** This is what every instance looks like in Lab 2 until you confirm it:

   ```powershell
   $arc = Read-SqlJson tests/fixtures/arc/arc.json
   $arc.sqlInstances[0].entraAuthentication.configured = $null
   $arc | ConvertTo-Json -Depth 6 | Set-Content "$Run/arc-unconfirmed.json"
   Get-SqlArcCategory -Audit (Read-SqlJson tests/fixtures/audit-day1/audit.json) -Arc (Read-SqlJson "$Run/arc-unconfirmed.json") | Where-Object Instance -eq 'SQLPRD01' | Format-List
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

   <!-- capture:begin 03-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-7.txt))](captures/03-7.png){.lightbox fig-alt="Terminal window showing $arc = Read-SqlJson tests/fixtures/arc/arc.json and what it printed"}

   <!-- capture:end -->

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 03*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             5           0
   ```

   <!-- capture:begin 03-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-8.txt))](captures/03-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 03*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\sql-server-identity-03\lab1 -Name
```

<!-- capture:begin 03-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/03-9.txt))](captures/03-9.png){.lightbox fig-alt="Terminal window showing Get-ChildItem C:\FMWLabs\results\sql-server-identity-03\lab1 -Name and what it printed"}

<!-- capture:end -->

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Lab 2: a test subscription

Use a commercial Azure test subscription in the test tenant, with at least one Arc-enabled test server running SQL Server, never production. **The authors haven't run this lab.** Work in `examples/sql-server-identity`, in PowerShell 7 with the `Az.Accounts` and `Az.ResourceGraph` modules, signed in as a person who holds Reader on the subscription and nothing more for the lab. You need Chapter 02's Lab 2 snapshot, `lab2/audit.json`, from the same instances. You'll replace: `<tenant-id>`, `<subscription-id>`, `<yyyy-MM-dd>` (today's date), `<instance-name>` (an instance as the snapshot names it: the host name for a default instance, `HOST\INSTANCE` for a named one, the same as Chapter 02's snapshot) and `<method>` (`appRegistration` on SQL Server 2022, `managedIdentity` on SQL Server 2025).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in to commercial Azure and confirm the cloud
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
(Get-AzContext).Environment.Name

# Step 2: Export the Arc snapshot
./Export-SqlArcSnapshot.ps1 -SubscriptionId <subscription-id> -OutputPath lab2/arc.json -AsOf <yyyy-MM-dd>

# Step 3: Settle the categories as Resource Graph leaves them
./Invoke-SqlArcCheck.ps1 -AuditPath lab2/audit.json -ArcPath lab2/arc.json -OutputPath lab2/arc-check

# Step 4: Record the Entra setting you confirmed in the portal
$snap = Get-Content -Raw lab2/arc.json | ConvertFrom-Json
$entry = $snap.sqlInstances | Where-Object name -eq '<instance-name>'
$entry.entraAuthentication.configured = $true
$entry.entraAuthentication.method = '<method>'
$snap | ConvertTo-Json -Depth 6 | Set-Content lab2/arc-confirmed.json

# Step 5: Settle the categories again
./Invoke-SqlArcCheck.ps1 -AuditPath lab2/audit.json -ArcPath lab2/arc-confirmed.json -OutputPath lab2/arc-check-confirmed

# Step 6: Back it out
Disconnect-AzAccount
Remove-Item -Recurse -Force lab2/arc.json, lab2/arc-confirmed.json, lab2/arc-check, lab2/arc-check-confirmed
```

:::

<!-- labs:end -->

1. **Sign in to commercial Azure and confirm the cloud:**

   ```powershell
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
   (Get-AzContext).Environment.Name
   ```

   The second line must print `AzureCloud`.

2. **Export the Arc snapshot.** Three Resource Graph reads; nothing is written to Azure:

   ```powershell
   ./Export-SqlArcSnapshot.ps1 -SubscriptionId <subscription-id> -OutputPath lab2/arc.json -AsOf <yyyy-MM-dd>
   ```

   Compare the machine count it prints with the **Machines - Azure Arc** list in the portal. Fewer machines than the portal shows means the account can't read part of the subscription, or the query hit the paging limit (Dangers).

3. **Settle the categories as Resource Graph leaves them:**

   ```powershell
   ./Invoke-SqlArcCheck.ps1 -AuditPath lab2/audit.json -ArcPath lab2/arc.json -OutputPath lab2/arc-check
   ```

   Every 2022 or later instance is Category 2 at most, with `Entra authentication not configured`, because the snapshot doesn't read that setting.

4. **Record the Entra setting you confirmed in the portal.** Open the instance's **SQL Server – Azure Arc** resource, **Settings**, **Microsoft Entra ID and Purview**, and check that an admin is set. Then record it for that instance:

   ```powershell
   $snap = Get-Content -Raw lab2/arc.json | ConvertFrom-Json
   $entry = $snap.sqlInstances | Where-Object name -eq '<instance-name>'
   $entry.entraAuthentication.configured = $true
   $entry.entraAuthentication.method = '<method>'
   $snap | ConvertTo-Json -Depth 6 | Set-Content lab2/arc-confirmed.json
   ```

   Keep `lab2/arc.json` as Resource Graph returned it; the confirmed copy is a separate file, and the run record should say who confirmed it.

5. **Settle the categories again:**

   ```powershell
   ./Invoke-SqlArcCheck.ps1 -AuditPath lab2/audit.json -ArcPath lab2/arc-confirmed.json -OutputPath lab2/arc-check-confirmed
   ```

   The confirmed instance is Category 1 if its agent is `Connected` and its extension is `Succeeded`. Category 1 still waits for R04's other checks, the token from the local identity endpoint and a test Entra login, before Chapter 04 moves any login.

6. **Back it out.** Nothing in Azure changed. Sign out and delete the lab's files:

   ```powershell
   Disconnect-AzAccount
   Remove-Item -Recurse -Force lab2/arc.json, lab2/arc-confirmed.json, lab2/arc-check, lab2/arc-check-confirmed
   ```

To run this read-only assessment for real, outside the lab, see [Assessments you can run against production](../../../reference/permissions-by-run.md#production-assessments).

## Verified facts

| Item | Value | Source |
|---|---|---|
| SQL Server enabled by Azure Arc | SQL Server 2014 and later; Entra authentication needs SQL Server 2022 or later; the setting is disabled by default, configured per instance; available under every license type | [^sq03-arc-overview] |
| SQL Server 2022 identity | App registration and a certificate in Azure Key Vault, downloaded by the Arc agent; set from **Microsoft Entra ID and Purview** | [^sq03-appreg] |
| SQL Server 2025 identity | The Arc server's system-assigned managed identity as primary managed identity; Windows only; needs the Azure public cloud; disabling isn't advisable | [^sq03-mi] |
| Failover cluster instances | No Entra authentication | [^sq03-entra-sql] |
| Resource Graph access | At least read on the resources; no results without it; not strongly consistent | [^sq03-arg] |
| `Search-AzGraph` paging | `-First` 1 to 1,000 (default 100); `-SkipToken`; `id` must be in the results to get a skip token | [^sq03-search] |
| Arc machine `status` | `Connected`, `Disconnected`, `Error`, `AwaitingConnection` | [^sq03-machine] |
| The cloud | Office 365 GCC is paired with Microsoft Entra ID in Azure (commercial); WD-028, WD-085 and WD-155 | [^sq03-gcc] |

## Federal requirements and evidence

| What the step does | NIST SP 800-53 Rev 5 | FedRAMP 20x KSI | Evidence the ISSO keeps |
|---|---|---|---|
| Records each audited instance's agent, extension and host machine from Resource Graph (Lab 1, step 2; Lab 2, steps 2 and 3) | Supports CM-8 (System Component Inventory) | KSI-PIY-GIV | `lab2/arc.json` as exported; `arc.csv`, `arc.json` and `manifest.json` |
| Checks each instance's Entra configuration and refuses results from the wrong cloud (Lab 1, steps 4 and 5; Lab 2, steps 4 and 5) | Supports CM-6 (Configuration Settings) | KSI-SVC-ACM | The confirmed snapshot with who confirmed it, and the second run's `manifest.json` |
| Names which instances can take Entra logins without a stored password (Category 1) | Supports IA-5 (Authenticator Management) | KSI-IAM-SNU | `arc.csv` with its `manifest.json` |

The controls and KSIs are the `ARC` step's in `config/requirements.json`. The run's files provide evidence for these controls; the agency still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers, framed as in Chapter 01.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A reader without access to part of the subscription | Machines it can't see come back as `not installed`, and the instance stays Category 2 for the wrong reason | Lab 2, step 2 compares the count with the portal; Reader on every subscription that holds Arc resources |
| More than 1,000 rows from one query | Resource Graph returns a skip token only when `id` is in the results; without it the rest is silently missing | Every snapshot query projects `id` and sorts by it, so the script pages; Lab 2, step 2 still compares the machine count with the portal |
| A snapshot from a different cloud | The check judges an estate that isn't the program's | The `AzureCloud` check refuses it (Lab 1, step 4) |
| Entra recorded as configured without looking | An instance is Category 1 and its logins move before Entra works | The confirmed copy is separate, names who confirmed it, and R04's token and test-login checks still gate Chapter 04 |
| A failover cluster's nodes are read as the instance | A node's agent status is taken for the clustered instance's | The check reports `cluster: see its nodes` and decides Category 3 first; read the node machines from the snapshot for the re-platform plan |
| The engine's own path to Entra ID is blocked | The agent shows `Connected`, the instance is Category 1, and Entra logins still fail | R04's network prerequisites and its test Entra login |

## Checklist

- [ ] The snapshot came from `AzureCloud`, signed in to the commercial subscription in the GCC (Moderate) tenant.
- [ ] The machine count matched the portal for every subscription read.
- [ ] Every Entra setting recorded as configured was confirmed on the **Microsoft Entra ID and Purview** page, and the confirmation names who and when.
- [ ] Every SQL Server 2022 instance uses an app registration with a named certificate owner, and every 2025 instance's managed identity has its Graph permissions (Runbook R04).
- [ ] Every Category 2 instance is in an R04 deployment wave; every Category 3 instance has an upgrade, re-platform or exception decision.
- [ ] Both run folders and their manifests are in the evidence store.

::: {.callout-tip}
## Continue the book
[← Chapter 02 — The Authentication Audit](02-the-authentication-audit.md) · [Workbook index](index.md) · [Next: Chapter 04 — Entra Logins and the Parallel Run →](04-entra-logins-and-the-parallel-run.md)
:::

[^sq03-arc-overview]: Microsoft Learn, "Overview - SQL Server enabled by Azure Arc," Microsoft Entra authentication, feature availability depending on license type, supported configurations and settings, <https://learn.microsoft.com/sql/sql-server/azure-arc/overview> (accessed Nov 24, 2026).
[^sq03-appreg]: Microsoft Learn, "Set up Microsoft Entra Authentication with App Registration - SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> (accessed Nov 24, 2026).
[^sq03-mi]: Microsoft Learn, "Managed identity overview - SQL Server enabled by Azure Arc," overview and limitations, <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Nov 24, 2026).
[^sq03-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server overview," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Nov 24, 2026).
[^sq03-arg]: Microsoft Learn, "Overview of Azure Resource Graph," permissions and how Resource Graph is kept current, <https://learn.microsoft.com/azure/governance/resource-graph/overview> (accessed Nov 24, 2026).
[^sq03-search]: Microsoft Learn, "Search-AzGraph (Az.ResourceGraph)," parameters and Example 3, <https://learn.microsoft.com/powershell/module/az.resourcegraph/search-azgraph> (accessed Nov 24, 2026).
[^sq03-machine]: Microsoft Learn, "Machines - Get" (Azure Hybrid Compute REST API, 2026-09-01), StatusTypes, <https://learn.microsoft.com/rest/api/hybridcompute/machines/get> (accessed Nov 24, 2026).
[^sq03-gcc]: Microsoft Learn, "Cloud feature availability for US Government customers," Microsoft 365 integration, <https://learn.microsoft.com/azure/security/fundamentals/feature-availability#microsoft-365-integration> (accessed Nov 24, 2026).
