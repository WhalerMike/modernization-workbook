---
title: "Chapter 03 — Scheduled Checks: Synchronization, Roles and Log Forwarding"
description: "Book 15, Chapter 12's sixth, seventh and eighth tasks as read-only scheduled jobs: the morning synchronization check from the cloud side (last synchronization, provisioning errors and Microsoft 365 service health, with what changed since the last run), the custom role review against an approved register, and the check that each listed server forwards its Windows event logs through Azure Monitor Agent instead of writing them to a share, with the data collection rule a person deploys. One job runner writes a dated, hashed run folder and exits 2 on findings. Labs on fixtures and in a test tenant and subscription."
doc-type: workbook-chapter
audience: [Technical]
family: dw-help-desk-automation
part: How
series-order: 3
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-27
review-status: pending
---
# Chapter 03 — Scheduled Checks: Synchronization, Roles and Log Forwarding

*The morning logon to the synchronization server, the event-log share and the role spreadsheet all answer questions a read-only job can answer before anyone arrives.*

::: {.callout-note}
## In this chapter
Three of [Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md)'s tasks are standing operations: [the morning synchronization check](../../../books/b15-day2-operations/12-the-day-two-runbook.md#the-morning-synchronization-check), [event-log handling](../../../books/b15-day2-operations/12-the-day-two-runbook.md#event-log-handling) and [custom administrative roles](../../../books/b15-day2-operations/12-the-day-two-runbook.md#custom-administrative-roles). This chapter builds each as a read-only job: `Invoke-HtSyncCheck`, `Test-HtLogForwarding` and `Invoke-HtRoleReview`, and the one runner the platform host's scheduled tasks call, `deploy/Invoke-HtScheduledRun.ps1`. It also reads the data collection rule, `deploy/eventlog-dcr.json`, that replaces the event-log share. Lab 1 runs every job on the fixtures, twice for the synchronization check so it can show what changed, and prints the four tasks the registration script would create. Lab 2 runs the three jobs against a test tenant and subscription with read permissions only. [Chapter 06](06-deploying-to-test-and-production.md) registers them on the host.
:::

## Goal and audience

**Goal.** By the end of this chapter you can run each check from a schedule with a read-only identity, read its findings, and show an ISSO a dated run folder whose manifest hashes every file and names the controls it supports.

**Audience.** Developers who maintain the kit, the identity engineer who owns synchronization, the security operations lead who owns the log platform, and the ISSO. You don't need a tenant until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

- **Synchronization.** By default Microsoft Entra Connect runs a synchronization cycle every 30 minutes.[^ht03-scheduler] The tenant's `organization` resource carries `onPremisesSyncEnabled` and `onPremisesLastSyncDateTime`, and reading all its properties needs `Organization.Read.All`.[^ht03-org] A user's `onPremisesProvisioningErrors` can be filtered with an advanced query (`ConsistencyLevel: eventual` and `$count`), and its category has, as Learn says, "only one possible value," `PropertyConflict`.[^ht03-adv] [^ht03-perr] Microsoft 365 service health is `GET /admin/serviceAnnouncement/healthOverviews`, with `ServiceHealth.Read.All`.[^ht03-health]
- **Roles.** Directory role definitions and assignments are read with `RoleManagement.Read.Directory`; Intune role definitions with `DeviceManagementRBAC.Read.All`, which needs an active Intune license in the tenant.[^ht03-roles] [^ht03-intune]
- **Log forwarding.** Azure Monitor Agent runs on on-premises servers through Azure Arc and collects according to the data collection rules associated with it.[^ht03-ama] Windows event data collected by a rule goes to a Log Analytics workspace's `Event` table, with entries in the form `LogName!XPathQuery`; Microsoft Sentinel's connector sends the Security log to `SecurityEvent` instead.[^ht03-ama-events] Azure Resource Graph reads resources and their associations across subscriptions with Reader, and the Log Analytics query API reads a workspace with Log Analytics Reader.[^ht03-arg] [^ht03-law]

### What it leaves to you

Each row is pinned by a test in the `Morning synchronization check`, `Custom role review`, `Event-log forwarding check` or `The platform host jobs` block of `tests/HelpDeskAutomation.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| A 30-minute default cycle, and a last synchronization time | Nobody says when "late" is late | `lateMinutes` 90, two missed cycles, as Book 15 sets it; HT-SY-01 |
| Provisioning errors per user | The morning report bolds what changed by hand | HT-SY-02 per object id, and a computed comparison with the previous run's `status.json` |
| Each service's health status | Every status name is a string to compare | `notOperational` lists the statuses that are findings (HT-SY-03); `services` narrows the list |
| Role definitions and their permissions | No record of which custom roles were approved, with which permissions, for which tasks | `config/role-register.json`: HT-RR-01 a role not in it, HT-RR-02 permissions that differ, HT-RR-03 a review older than 90 days, HT-RR-04 (a warning) a person holding a role directly instead of through its group |
| A data collection rule and an agent | Nothing checks that each server is still sending | HT-LF-01 not an Arc machine, HT-LF-02 not associated with the rule, HT-LF-03 silent for more than `maxSilenceHours` (6) |
| Read calls, one at a time | No evidence that the check ran, or of what it saw | One dated folder per run, `manifest.json` with each file's SHA-256, the controls and the KSIs, and exit code 2 on findings |

**The verdict.** Read with Learn's calls and least privilege. Build the thresholds, the register, the comparison and the evidence.

## The code

### The three checks

| Function | Reads (declared calls) | Writes | Findings |
|---|---|---|---|
| `Invoke-HtSyncCheck -OutputPath [-PreviousPath] [-SettingsPath]` | `organization-get`, `users-provisioning-errors`, `health-overviews` | `status.json`, `findings.json`, `report.md`, `manifest.json` | HT-SY-01, HT-SY-02, HT-SY-03 |
| `Invoke-HtRoleReview -OutputPath [-RegisterPath]` | `directory-role-definitions` (custom only), `directory-role-assignments`, `intune-role-definitions` | `roles.json`, `findings.json`, `manifest.json` | HT-RR-01 to HT-RR-04 |
| `Test-HtLogForwarding -OutputPath [-SettingsPath]` | `arg-dcr-associations` (a Resource Graph query), `law-query` (the newest `Event` per computer) | `servers.json`, `findings.json`, `manifest.json` | HT-LF-01 to HT-LF-03 |

The synchronization report replaces bold text with a computed difference: provisioning errors before and after, new and cleared error objects, and each service whose status changed. Every finding becomes a ticket; the next part of the kit routes them to ServiceNow.

### The data collection rule

[`deploy/eventlog-dcr.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/deploy/eventlog-dcr.json) is one Azure Resource Manager template: a rule of kind `Windows` with the Security log's sign-in, privileged logon and account and group events and the errors and warnings of System and Application, to the workspace's `Event` table, and an association for each Arc-enabled server named in `arcMachineNames`. A person deploys it after a what-if (the `log-forwarding-deploy` task; Chapter 06); the scheduled identity only reads.

### The job runner

`deploy/Invoke-HtScheduledRun.ps1 -Job sync|consent|roles|logs -SettingsPath` is the one script the four scheduled tasks call. It refuses a settings file with a secret-like key or an unfilled `<placeholder>`, signs in as the help desk audit reader app with the certificate file the settings name (`Connect-MgGraph -Certificate`, or `Connect-AzAccount -CertificatePath` for `logs`), writes `<runsPath>/<job>/<yyyy-MM-ddTHHmmssZ>/`, gives the synchronization check the previous run's folder, and exits 2 when the job has findings. `deploy/Register-HtScheduledJobs.ps1` prints the four tasks, and registers them with `-Apply` under the gMSA: sync daily at 06:30, consent at 07:00, log forwarding at 07:15, and the role review weekly, on Monday at 07:30 ([WD-181](../../../about/decision-register.md#wd-181)).

::: {.callout-important}
## Illustrative code
Lab 1 reads fictional fixtures: one tenant, three custom roles, two Arc servers and their newest events. Nothing signs in. The kit hasn't been run against a live tenant or subscription.
:::

## Lab 1: fixtures, no tenant

Work in `examples/help-desk-automation`, in PowerShell 7.1 or later, with Pester 5. The fixtures' tenant last synchronized at 11:42 UTC on November 27, 2026, has two users with a provisioning error and an Exchange Online degradation; `tests/fixtures/previous-sync/status.json` is the day before. The listed servers are the fictional `SYNC01` and `SYNC02`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what the three checks need
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
'sync-check', 'role-review', 'log-forwarding-check' | ForEach-Object { Get-HtRequiredPermission -Task $_ } | Format-List

# Step 2: Run the synchronization check against yesterday's run
Invoke-HtSyncCheck -OutputPath out/sync/day2 -FixturePath tests/fixtures -PreviousPath tests/fixtures/previous-sync -AsOf 2026-11-27T12:00:00Z | Format-List

# Step 3: Read the morning report
Get-Content out/sync/day2/report.md

# Step 4: Run it two hours later, with no previous run
Invoke-HtSyncCheck -OutputPath out/sync/late -FixturePath tests/fixtures -AsOf 2026-11-27T14:00:00Z | Format-List
Get-Content out/sync/late/findings.json -TotalCount 6

# Step 5: Review the custom roles against the register
Invoke-HtRoleReview -OutputPath out/roles -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
Get-Content out/roles/findings.json

# Step 6: Check the event-log forwarding
Test-HtLogForwarding -OutputPath out/logs -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
Get-Content out/logs/servers.json
Get-Content out/logs/findings.json

# Step 7: Read what the data collection rule collects
(Get-Content deploy/eventlog-dcr.json -Raw | ConvertFrom-Json).parameters.xPathQueries.defaultValue
(Get-Content deploy/eventlog-dcr.json -Raw | ConvertFrom-Json).resources | ForEach-Object { $_.type }

# Step 8: Run the three jobs as the scheduled tasks would
'sync', 'roles', 'logs' | ForEach-Object { ./deploy/Invoke-HtScheduledRun.ps1 -Job $_ -SettingsPath tests/fixtures/settings.fixture.json -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Out-Null; "$_ exit code: $LASTEXITCODE" }
Get-ChildItem out/runs -Directory -Recurse -Name

# Step 9: Print the scheduled tasks without registering them
./deploy/Register-HtScheduledJobs.ps1 -SettingsPath tests/fixtures/settings.fixture.json | Format-Table Task, When, RunAs, Registered -AutoSize | Out-String -Width 200

# Step 10: Run this chapter's tests
Invoke-Pester -Path tests -FullNameFilter 'Morning synchronization check*', 'Custom role review*', 'Event-log forwarding check*', 'The platform host jobs*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what the three checks need:**

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   'sync-check', 'role-review', 'log-forwarding-check' | ForEach-Object { Get-HtRequiredPermission -Task $_ } | Format-List
   ```

   <!-- capture:begin 03-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-1.txt))](captures/03-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force and what it printed"}

   <!-- capture:end -->

   Graph read permissions for two, and the Azure roles Reader and Log Analytics Reader for the third. Nothing writes.

2. **Run the synchronization check against yesterday's run:**

   ```powershell
   Invoke-HtSyncCheck -OutputPath out/sync/day2 -FixturePath tests/fixtures -PreviousPath tests/fixtures/previous-sync -AsOf 2026-11-27T12:00:00Z | Format-List
   ```

   <!-- capture:begin 03-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-2.txt))](captures/03-2.png){.lightbox fig-alt="Terminal window showing Invoke-HtSyncCheck -OutputPath out/sync/day2 -FixturePath tests/fixtures -Pre… and what it printed"}

   <!-- capture:end -->

   Synchronized 18 minutes ago, so no HT-SY-01; two provisioning errors and one service down.

3. **Read the morning report:**

   ```powershell
   Get-Content out/sync/day2/report.md
   ```

   <!-- capture:begin 03-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-3.txt))](captures/03-3.png){.lightbox fig-alt="Terminal window showing Get-Content out/sync/day2/report.md and what it printed"}

   <!-- capture:end -->

   "Changed since the last run" names the new error object and Exchange Online's change of status.

4. **Run it two hours later, with no previous run.** The last synchronization is now 138 minutes old:

   ```powershell
   Invoke-HtSyncCheck -OutputPath out/sync/late -FixturePath tests/fixtures -AsOf 2026-11-27T14:00:00Z | Format-List
   Get-Content out/sync/late/findings.json -TotalCount 6
   ```

   <!-- capture:begin 03-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-4.txt))](captures/03-4.png){.lightbox fig-alt="Terminal window showing Invoke-HtSyncCheck -OutputPath out/sync/late -FixturePath tests/fixtures -AsO… and what it printed"}

   <!-- capture:end -->

   The first finding is HT-SY-01.

5. **Review the custom roles against the register:**

   ```powershell
   Invoke-HtRoleReview -OutputPath out/roles -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
   Get-Content out/roles/findings.json
   ```

   <!-- capture:begin 03-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-5.txt))](captures/03-5.png){.lightbox fig-alt="Terminal window showing Invoke-HtRoleReview -OutputPath out/roles -FixturePath tests/fixtures -AsOf 2… and what it printed"}

   <!-- capture:end -->

   One role not in the register (HT-RR-01), an Intune role that gained a device wipe (HT-RR-02), a review last done in July (HT-RR-03), and a person holding a role directly (HT-RR-04, a warning).

6. **Check the event-log forwarding:**

   ```powershell
   Test-HtLogForwarding -OutputPath out/logs -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
   Get-Content out/logs/servers.json
   Get-Content out/logs/findings.json
   ```

   <!-- capture:begin 03-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-6.txt))](captures/03-6.png){.lightbox fig-alt="Terminal window showing Test-HtLogForwarding -OutputPath out/logs -FixturePath tests/fixtures -AsOf 2… and what it printed"}

   <!-- capture:end -->

   `SYNC01` is associated and sent an event six minutes ago; `SYNC02` isn't associated and has been silent for 16 hours.

7. **Read what the data collection rule collects:**

   ```powershell
   (Get-Content deploy/eventlog-dcr.json -Raw | ConvertFrom-Json).parameters.xPathQueries.defaultValue
   (Get-Content deploy/eventlog-dcr.json -Raw | ConvertFrom-Json).resources | ForEach-Object { $_.type }
   ```

   <!-- capture:begin 03-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-7.txt))](captures/03-7.png){.lightbox fig-alt="Terminal window showing (Get-Content deploy/eventlog-dcr.json -Raw | ConvertFrom-Json).parameters.xPa… and what it printed"}

   <!-- capture:end -->

   Three `LogName!XPathQuery` entries, one rule and one association resource.

8. **Run the three jobs as the scheduled tasks would:**

   ```powershell
   'sync', 'roles', 'logs' | ForEach-Object { ./deploy/Invoke-HtScheduledRun.ps1 -Job $_ -SettingsPath tests/fixtures/settings.fixture.json -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Out-Null; "$_ exit code: $LASTEXITCODE" }
   Get-ChildItem out/runs -Directory -Recurse -Name
   ```

   <!-- capture:begin 03-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-8.txt))](captures/03-8.png){.lightbox fig-alt="Terminal window showing 'sync', 'roles', 'logs' | ForEach-Object { ./deploy/Invoke-HtScheduledRun.ps1… and what it printed"}

   <!-- capture:end -->

   Each exits 2, because each has findings, into a folder named for the run's time.

9. **Print the scheduled tasks without registering them:**

   ```powershell
   ./deploy/Register-HtScheduledJobs.ps1 -SettingsPath tests/fixtures/settings.fixture.json | Format-Table Task, When, RunAs, Registered -AutoSize | Out-String -Width 200
   ```

   <!-- capture:begin 03-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-9.txt))](captures/03-9.png){.lightbox fig-alt="Terminal window showing ./deploy/Register-HtScheduledJobs.ps1 -SettingsPath tests/fixtures/settings.f… and what it printed"}

   <!-- capture:end -->

   Four tasks under `CONTOSO\gmsa-fmpassess$`, each `Registered` `False`.

10. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests -FullNameFilter 'Morning synchronization check*', 'Custom role review*', 'Event-log forwarding check*', 'The platform host jobs*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    <!-- capture:begin 03-10 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

    ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-10.txt))](captures/03-10.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests -FullNameFilter 'Morning synchronization check*', '… and what it printed"}

    <!-- capture:end -->

**Expected result:** `PassedCount` 22 and `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 03-11 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/03-11.txt))](captures/03-11.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant and subscription

Use a Microsoft Entra test tenant and an Azure test subscription, never production, with Microsoft Entra Connect synchronizing a test forest, an Intune license, and at least one Azure Arc-enabled test server. Work in `examples/help-desk-automation`, in PowerShell 7.1 or later with the Microsoft Graph PowerShell SDK and the Az.Accounts and Az.OperationalInsights modules. Sign in as a test administrator who can read the directory, Intune roles, the subscription and the workspace. You'll replace: `<tenant-id>`, `<subscription-id>`, `<workspace-id>` (the workspace's ID, a GUID) and `<arc-server>` (the test server's Arc machine name). The authors haven't run this lab. It reads only; the back-out removes your copies and signs out.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: Make your copies of the two settings files
New-Item -ItemType Directory -Force out/config-test | Out-Null
Copy-Item config/role-register.json out/config-test/role-register.json
$l = Get-Content config/log-forwarding.json -Raw | ConvertFrom-Json
$l.workspaceId = '<workspace-id>'; $l.servers = @('<arc-server>')
$l | ConvertTo-Json | Set-Content out/config-test/log-forwarding.json

# Step 2: Sign in to Graph with the two checks' permissions, and run them
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ((Get-HtRequiredPermission -Task sync-check).GraphPermissions + (Get-HtRequiredPermission -Task role-review).GraphPermissions) -NoWelcome
Invoke-HtSyncCheck -OutputPath out/sync-test | Format-List
Get-Content out/sync-test/report.md
Invoke-HtRoleReview -OutputPath out/roles-test -RegisterPath out/config-test/role-register.json | Format-List
Get-Content out/roles-test/roles.json

# Step 3: Sign in to Azure and run the log check
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
Test-HtLogForwarding -OutputPath out/logs-test -SettingsPath out/config-test/log-forwarding.json | Format-List
Get-Content out/logs-test/servers.json

# Step 4: Back out
Disconnect-MgGraph
Disconnect-AzAccount | Out-Null
Remove-Item -Recurse -Force out/config-test, out/sync-test, out/roles-test, out/logs-test
```

:::

<!-- labs:end -->

1. **Make your copies of the two settings files:**

   ```powershell
   New-Item -ItemType Directory -Force out/config-test | Out-Null
   Copy-Item config/role-register.json out/config-test/role-register.json
   $l = Get-Content config/log-forwarding.json -Raw | ConvertFrom-Json
   $l.workspaceId = '<workspace-id>'; $l.servers = @('<arc-server>')
   $l | ConvertTo-Json | Set-Content out/config-test/log-forwarding.json
   ```

2. **Sign in to Graph with the two checks' permissions, and run them:**

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ((Get-HtRequiredPermission -Task sync-check).GraphPermissions + (Get-HtRequiredPermission -Task role-review).GraphPermissions) -NoWelcome
   Invoke-HtSyncCheck -OutputPath out/sync-test | Format-List
   Get-Content out/sync-test/report.md
   Invoke-HtRoleReview -OutputPath out/roles-test -RegisterPath out/config-test/role-register.json | Format-List
   Get-Content out/roles-test/roles.json
   ```

   The fictional register won't match the test tenant's roles, so HT-RR-01 for each custom role is the expected result: `roles.json` is what the agency's register is written from.

3. **Sign in to Azure and run the log check:**

   ```powershell
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
   Test-HtLogForwarding -OutputPath out/logs-test -SettingsPath out/config-test/log-forwarding.json | Format-List
   Get-Content out/logs-test/servers.json
   ```

   Before the rule is deployed (Chapter 06), the server shows HT-LF-02.

4. **Back out:**

   ```powershell
   Disconnect-MgGraph
   Disconnect-AzAccount | Out-Null
   Remove-Item -Recurse -Force out/config-test, out/sync-test, out/roles-test, out/logs-test
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Synchronization cycle | Every 30 minutes by default | [^ht03-scheduler] |
| Last synchronization | `organization.onPremisesLastSyncDateTime`, `onPremisesSyncEnabled`; `Organization.Read.All` | [^ht03-org] |
| Provisioning errors | Advanced query on `onPremisesProvisioningErrors/any(o:o/category)`; category `PropertyConflict` only | [^ht03-adv] [^ht03-perr] |
| Service health | `GET /admin/serviceAnnouncement/healthOverviews`, `ServiceHealth.Read.All` | [^ht03-health] |
| Directory roles | Role definitions and assignments, `RoleManagement.Read.Directory` | [^ht03-roles] |
| Intune roles | `GET /deviceManagement/roleDefinitions`, `DeviceManagementRBAC.Read.All`; an active Intune license | [^ht03-intune] |
| Azure Monitor Agent | Arc-enabled on-premises servers; collects by associated rules | [^ht03-ama] |
| Windows events | To the `Event` table; `LogName!XPathQuery`; Sentinel's connector to `SecurityEvent` | [^ht03-ama-events] |
| Reads in Azure | Resource Graph with Reader; the Log Analytics query API with Log Analytics Reader | [^ht03-arg] [^ht03-law] |

Not yet specified: the built-in Azure role a person needs to create the rule and its associations on Arc machines (the kit's `log-forwarding-deploy` task says to confirm it in the test stage); and the time a new association takes before the first `Event` record arrives.

## Federal requirements and evidence

The controls and KSIs are `config/requirements.json` for `sync-check`, `role-review` and `log-forwarding-check`.[^ht03-oscal] [^ht03-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| Synchronization, provisioning errors and service health were read every morning, with what changed (Lab 1, steps 2 to 4; Lab 2, step 2: `status.json`, `report.md`, `findings.json`) | CA-7; SI-4; AU-6; CP-9 | KSI-MLA-EVC; KSI-MLA-OSM | The identity engineer; the ISSO keeps the run folders |
| Every custom role was compared with the approved register, with its permissions and holders (Lab 1, step 5; Lab 2, step 2: `roles.json`, `findings.json`) | AC-2; AC-6; AC-6(7) | KSI-IAM-ELP; KSI-IAM-JIT | The role owner; the ISSO |
| Each listed server forwards its event logs to the workspace, not a share (Lab 1, steps 6 and 7; Lab 2, step 3: `servers.json`, the rule) | AU-2; AU-6; AU-9; AU-11 | KSI-MLA-OSM; KSI-MLA-LET; KSI-MLA-RVL | Security operations |
| Each run is dated, hashed and ran on schedule (Lab 1, steps 8 and 9: the run folders, `manifest.json`) | CA-7; AU-6 | KSI-MLA-EVC | The ISSO |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The mapping is the program's *(design guidance)*. The checks' records support these controls; the assessor decides them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| The check runs as a person who logs on to the synchronization server | A Tier 0 logon every morning, for a read | The check reads from the cloud side; the server-side checks stay in Book 15, Chapter 12's [own section](../../../books/b15-day2-operations/12-the-day-two-runbook.md#the-synchronization-servers-that-stay) |
| A silent failure | The job stops and nobody notices | Exit code 2 on findings, and a dated folder per run: a missing folder is itself the finding the ISSO looks for |
| The role register edited to match the tenant | An unapproved role becomes "approved" | The register is the agency's copy, changed through a change record; HT-RR-02 compares permissions, not names alone |
| Event logs still written to a share the administrators can change | The audit record can be altered by those it watches (AU-9) | The rule forwards to the workspace; remove the old script and share after HT-LF shows each server forwarding |
| The reader app given a write permission "for later" | A read job can change the tenant | `config/calls.json` declares read permissions only for these tasks, and a test fails otherwise |

## Checklist

- [ ] The reader app holds the six Graph read permissions and the two Azure read roles, nothing else.
- [ ] The agency's `role-register.json` lists every approved custom role, its exact permissions, its group and its last review.
- [ ] `log-forwarding.json` lists every server whose logs matter, and each is Arc-enabled.
- [ ] The rule was deployed by a person after a what-if, and the old event-log script and share are gone.
- [ ] Each job's exit code 2 raises a ticket.

::: {.callout-tip}
## Continue the book
[← Chapter 02 — The Consent Request Review](02-the-consent-request-review.md) · [Workbook index](index.md) · [Next: Chapter 04 — Requests In →](04-requests-in-servicenow-and-sailpoint.md)
:::

[^ht03-scheduler]: Microsoft Learn, "Microsoft Entra Connect Sync: Scheduler," <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-scheduler> (read October 21, 2026; carried from Book 15, Chapter 12).
[^ht03-org]: Microsoft Learn, "organization resource type" (`onPremisesLastSyncDateTime`, `onPremisesSyncEnabled`), <https://learn.microsoft.com/graph/api/resources/organization?view=graph-rest-1.0>; and "Get organization" (`Organization.Read.All`), <https://learn.microsoft.com/graph/api/organization-get?view=graph-rest-1.0> (read October 21, 2026; carried from Book 15, Chapter 12).
[^ht03-adv]: Microsoft Learn, "Advanced query capabilities on Microsoft Entra ID objects," <https://learn.microsoft.com/graph/aad-advanced-queries> (read October 21, 2026; carried from Book 15, Chapter 12).
[^ht03-perr]: Microsoft Learn, "onPremisesProvisioningError resource type," <https://learn.microsoft.com/graph/api/resources/onpremisesprovisioningerror?view=graph-rest-1.0> (read October 21, 2026; carried from Book 15, Chapter 12).
[^ht03-health]: Microsoft Learn, "List healthOverviews," <https://learn.microsoft.com/graph/api/serviceannouncement-list-healthoverviews?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht03-roles]: Microsoft Learn, "List roleDefinitions," <https://learn.microsoft.com/graph/api/rbacapplication-list-roledefinitions?view=graph-rest-1.0>, and "List roleAssignments," <https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignments?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht03-intune]: Microsoft Learn, "List roleDefinitions" (Intune), <https://learn.microsoft.com/graph/api/intune-rbac-roledefinition-list?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht03-ama]: Microsoft Learn, "Azure Monitor Agent Overview" (supported environments include on-premises servers through Azure Arc; the agent collects according to the data collection rules associated with it), <https://learn.microsoft.com/azure/azure-monitor/agents/azure-monitor-agent-overview> (read November 19, 2026; carried from *Building the Daily Checks Workbook*).
[^ht03-ama-events]: Microsoft Learn, "Collect Windows events from virtual machines with Azure Monitor Agent" (the `Event` table; `LogName!XPathQuery`; the Sentinel connector and `SecurityEvent`; Arc-enabled on-premises servers), <https://learn.microsoft.com/azure/azure-monitor/vm/data-collection-windows-events> (read November 19, 2026; carried from *Building the Daily Checks Workbook*).
[^ht03-arg]: Microsoft Learn, "Overview of Azure Resource Graph," <https://learn.microsoft.com/azure/governance/resource-graph/overview> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht03-law]: Microsoft Learn, "Azure Monitor Log Analytics API overview," <https://learn.microsoft.com/azure/azure-monitor/logs/api/overview> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht03-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht03-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
