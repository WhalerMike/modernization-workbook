---
title: "Chapter 06 — Deploying to Test and Production"
description: "A deployment runbook that puts the help desk automation kit on the platform host, first against a test tenant, instance and SailPoint sandbox and then production, with the same commands and two settings files per stage: the two gMSAs of WD-181 and WD-182 under WD-183's exception, the audit reader app and the request worker app with only their kit's permissions, the folders and their access, the four read-only jobs tried by hand and registered, the data collection rule deployed by a person after a what-if, the request pipeline dry-run and registered, a smoke test, a rehearsed rollback, the go/no-go and production with the pipeline turned on last. Every step is a command; outputs from fixture mode are dated. Nobody has run it against a live tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-help-desk-automation
part: How
series-order: 6
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-27
review-status: pending
---
# Chapter 06 — Deploying to Test and Production

*Each chapter's second lab proves one job in isolation. The deployment proves them on the host, under the identities the decisions name, with a rollback someone has already run.*

::: {.callout-note}
## In this chapter
The runbook that takes the kit from the labs of Chapters 01 to 05 to the platform host, first against test systems, then production. It runs the same commands twice; only the two settings files change between stages. You check the two gMSAs and the two apps, make the folders, write the settings, try each read-only job by hand, deploy the data collection rule, register the four jobs, dry-run and register the request pipeline, run a smoke test and rehearse the rollback. Then you check the go/no-go criteria and repeat it in production, where the pipeline is turned on last, one catalog item at a time. The host itself is the [platform host guide](../../../books/guides/platform-host-implementation.md)'s; this chapter adds only the help desk jobs and the pipeline to it.
:::

::: {.callout-warning}
## Status: a runbook nobody has run against a live tenant
Every command below was written against the kit's code and Microsoft Learn's, ServiceNow's and SailPoint's documentation. The dry run on the fixtures ran on November 27, 2026. Nothing has run on a live host, tenant, instance or SailPoint tenant. Each live result is written as an expectation.
:::

## Goal and audience

**Goal.** By the end of this chapter the four read-only jobs run on schedule under `gmsa-fmpassess$`, the request pipeline runs every five minutes under its own gMSA, each leaves dated evidence, and the operator has rolled both back once in the test stage.

**Audience.** The platform lead who administers the host, the identity engineer who owns the two apps, the ServiceNow administrator, the identity governance engineer, the change manager and the ISSO.

## What the runbook depends on

| Dependency | Where it is |
|---|---|
| The tasks and their procedure | [Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md) |
| Where each part runs, and as whom | [WD-181](../../../about/decision-register.md#wd-181) (the read-only jobs), [WD-182](../../../about/decision-register.md#wd-182) (the pipeline) |
| The host's Active Directory footprint, both gMSAs included | [WD-183](../../../about/decision-register.md#wd-183), one exception to WD-065, cited by the [platform host guide](../../../books/guides/platform-host-implementation.md) and [Book 10, Appendix B](../../../books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md) |
| How a gMSA is requested, approved and created | The managed service account standard: requested through the agency's system access management tool, approved in SailPoint, created by the program's pipeline ([WD-163](../../../about/decision-register.md#wd-163)) |
| Every permission each run needs | [Permissions by Run](../../../reference/permissions-by-run.md#help-desk-automation), built from the kit's `config/calls.json` |
| The ServiceNow items and SailPoint profiles | [Chapter 04](04-requests-in-servicenow-and-sailpoint.md) |

Every Graph sign-in uses `Connect-MgGraph -Environment Global`: Microsoft 365 GCC uses the worldwide endpoint, `graph.microsoft.com`.[^ht06-deployments] Azure is commercial Azure, `AzureCloud`.

## Requirements, KSIs and evidence

Each step ends with what it supports. The controls and KSIs are the kit's [`config/requirements.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/config/requirements.json); the runbook adds none.[^ht06-oscal] [^ht06-ksi] KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). Every alignment is the program's *(design guidance)*; the kit's records support the controls, and the assessor and the authorizing official decide them.

## Before you start

### Roles

| Who | Holds | Steps |
|---|---|---|
| Operator (host administrator) | Administrator on the platform host; no role in any cloud | All host steps |
| Identity engineer | Creates the two app registrations and grants admin consent, through PIM against the change | 1.2 |
| Azure contributor (a person) | A role that can create the rule and its associations, activated for the change | 1.6, 1.10 |
| ServiceNow administrator | Builds the catalog items, fields, rule, job and roles | Before 1.8 |
| Identity governance engineer | Builds the access profiles and the pipeline's SailPoint client | Before 1.8 |
| Change manager | Approves the change record and each stage | Before you start, go/no-go |
| ISSO | Approves promotion; keeps the evidence | Go/no-go |

### Approvals

| Approval | By | Before | Recorded in |
|---|---|---|---|
| The change record for the stage | Change advisory board | Step 1.1 | The change record |
| The two gMSAs | SailPoint, through the managed service account standard | Step 1.1 | SailPoint; WD-183's exception |
| Book 10, Appendix B lists the help desk jobs, the pipeline, their identities and their paths | The platform lead and the ISSO | Step 1.7 | Appendix B (WD-181 and WD-182 require it before the first run) |
| Promotion to production | ISSO and the change advisory board | Stage 2 | The go/no-go record |
| Each catalog item turned on in production | Change manager | Step 2.4 | The change record |

## The settings files

Two JSON files per stage, outside the kit's folder, holding no secret: [`deploy/settings.template.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/deploy/settings.template.json) for the read-only jobs and [`deploy/requests-settings.template.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/deploy/requests-settings.template.json) for the pipeline. Both run scripts refuse a secret-like key and an unfilled `<placeholder>`; the template's `_comment` is ignored. The apps sign in with certificate files; the ServiceNow and SailPoint client secrets are in environment variables the pipeline's settings name.

### Placeholders

These are the only values you replace in this chapter's commands:

| Placeholder | What it is |
|---|---|
| `<kit-folder>` | Your reviewed copy of `examples/help-desk-automation` |
| `<domain>` | The forest's NetBIOS name |
| `<tenant-id>` | The stage's tenant |
| `<reader-app-id>`, `<worker-app-id>` | The help desk audit reader app and the help desk request worker app |
| `<subscription-id>`, `<rg>`, `<workspace-resource-id>` | The subscription and resource group holding the Arc machines, and the workspace |
| `<arc-server-1>`, `<arc-server-2>` | The Arc machine names of the servers whose logs must be forwarded |
| `<tier0-admins>` | The host's Tier 0 administrators group |
| `<stage>` | `test` in Stage 1, `production` in Stage 2 |

### Create and check the files

```powershell
New-Item -ItemType Directory -Force D:\HelpDeskAutomation\config, D:\HelpDeskAutomation\credentials, D:\HelpDeskAutomation\runs, D:\HelpDeskRequests\config, D:\HelpDeskRequests\credentials, D:\HelpDeskRequests\runs | Out-Null
Copy-Item -Recurse <kit-folder> D:\HelpDeskAutomation\help-desk-automation
Copy-Item -Recurse <kit-folder> D:\HelpDeskRequests\help-desk-automation
Copy-Item D:\HelpDeskAutomation\help-desk-automation\deploy\settings.template.json D:\HelpDeskAutomation\settings.json
Copy-Item D:\HelpDeskRequests\help-desk-automation\deploy\requests-settings.template.json D:\HelpDeskRequests\settings.json
```

Fill in every `<placeholder>` in both files, then copy the agency's own `sync-check.json`, `consent-review.json`, `role-register.json` and `log-forwarding.json` into `D:\HelpDeskAutomation\config\`, and its `request-items.json` and `typed-changes.json` into `D:\HelpDeskRequests\config\`. Check that nothing is left to fill in:

```powershell
Select-String -Path D:\HelpDeskAutomation\settings.json, D:\HelpDeskRequests\settings.json -Pattern '": "[^"]*<[^>]+>' | ForEach-Object { $_.Line.Trim() }
```

**Expected:** no output.

## The code this chapter uses

| Script | What it does | Dry run |
|---|---|---|
| `deploy/Invoke-HtScheduledRun.ps1` | One read-only job into a dated, hashed folder; exit 2 on findings ([Chapter 03](03-scheduled-checks-sync-roles-and-logs.md)) | Fixture mode |
| `deploy/Register-HtScheduledJobs.ps1` | The four tasks under the assessment gMSA | Without `-Apply` |
| `deploy/eventlog-dcr.json` | The data collection rule and its associations | `-WhatIf` |
| `deploy/Invoke-HtRequestPipeline.ps1` | The queue, every five minutes ([Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md)) | `-DryRun` |
| `deploy/Register-HtRequestPipeline.ps1` | The pipeline's task under its own gMSA; refuses the assessment gMSA | Without `-Apply` |

## Illustrative code

The scripts are tested against the kit's fixtures and Pester's stand-ins, not against a live host.

### Dry run on the kit's fixtures

From `examples/help-desk-automation`, in PowerShell 7.1 or later. Run on November 27, 2026:

```powershell
try { ./deploy/Invoke-HtScheduledRun.ps1 -Job sync -SettingsPath deploy/settings.template.json } catch { $_.Exception.Message }
'sync', 'consent', 'roles', 'logs' | ForEach-Object { ./deploy/Invoke-HtScheduledRun.ps1 -Job $_ -SettingsPath tests/fixtures/settings.fixture.json -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Out-Null; "$_ exit code: $LASTEXITCODE" }
./deploy/Register-HtScheduledJobs.ps1 -SettingsPath tests/fixtures/settings.fixture.json | Format-Table Task, When, RunAs, Registered -AutoSize | Out-String -Width 200
./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests-settings.fixture.json -FixturePath tests/fixtures -DryRun -AsOf 2026-11-27T12:00:00Z
./deploy/Register-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests-settings.fixture.json | Format-List Task, When, RunAs, Registered
Remove-Item -Recurse -Force out
```

The template's refusal was `Fill in the settings first: clientId, runAs, subscriptionId, tenantId.`; each job printed `exit code: 2`; the registration listed `FMW Help Desk - Sync check` (daily 06:30), `Consent requests` (daily 07:00), `Log forwarding` (daily 07:15) and `Role review` (weekly, Monday 07:30), each `CONTOSO\gmsa-fmpassess$` and `Registered` `False`; the pipeline printed ten items (four `dry-run`, one `waiting`, five refused) and exit code 2; and its registration printed `FMW Help Desk - Request pipeline`, `every 5 minutes`, `CONTOSO\gmsa-fmphelpdesk$`, `Registered` `False`.

## Stage 1: test

The host's test stage, against a test tenant with Microsoft Entra Connect synchronizing a test forest, an Azure test subscription with two Arc-enabled test servers, a ServiceNow developer or sub-production instance and a SailPoint sandbox. Run every step as the operator on the host, in PowerShell 7.1 or later, unless the step names someone else.

### Step 1.1: The two gMSAs

Both were requested through the agency's system access management tool and approved in SailPoint, and the program's pipeline created them with the host in each retriever group (WD-163, WD-183). Install and test each on the host:[^ht06-gmsa]

```powershell
Install-ADServiceAccount -Identity gmsa-fmpassess
Test-ADServiceAccount -Identity gmsa-fmpassess
Install-ADServiceAccount -Identity gmsa-fmphelpdesk
Test-ADServiceAccount -Identity gmsa-fmphelpdesk
```

**Expected:** `True` from each test.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-6; IA-5 | Two service identities with no password anyone holds, one for reading and one for writing | KSI-IAM-JIT | The SailPoint approvals; WD-183's exception |

### Step 1.2: The two apps

The identity engineer creates two app registrations, each with a certificate, and grants admin consent to their application permissions: the audit reader app, `Organization.Read.All`, `User.Read.All`, `ServiceHealth.Read.All`, `ConsentRequest.Read.All`, `RoleManagement.Read.Directory` and `DeviceManagementRBAC.Read.All`, with Reader on `<rg>` and Log Analytics Reader on the workspace; the request worker app, the permissions WD-182 lists, and the User Administrator role, which Learn requires for an app-only password reset.[^ht06-update] Then compare each app's grants with what the kit declares:[^ht06-approles]

```powershell
Import-Module D:\HelpDeskAutomation\help-desk-automation\powershell\HelpDeskAutomation\HelpDeskAutomation.psm1 -Force
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'Application.Read.All', 'RoleManagement.Read.Directory' -NoWelcome
$graph = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
foreach ($app in '<reader-app-id>', '<worker-app-id>') {
    $sp = Get-MgServicePrincipal -Filter "appId eq '$app'"
    "$app grants: " + ((Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id | ForEach-Object { $r = $_.AppRoleId; ($graph.AppRoles | Where-Object Id -eq $r).Value } | Sort-Object) -join ', ')
    "$app directory roles: " + ((Get-MgRoleManagementDirectoryRoleAssignment -Filter "principalId eq '$($sp.Id)'" | ForEach-Object RoleDefinitionId) -join ', ')
}
'Reader app should hold: ' + ((('sync-check', 'consent-requests', 'role-review') | ForEach-Object { (Get-HtRequiredPermission -Task $_).GraphPermissions }) | Sort-Object -Unique) -join ', '
```

**Expected:** the reader app's grants equal the last line, with no directory role; the worker app's grants are WD-182's list, and its one directory role is User Administrator, `fe930be7-5e62-47db-91af-98c3a49a38b1`.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-6 | Each app holds only its kit's rows; the reader writes nothing | KSI-IAM-ELP | The step's output, with the change record |

### Step 1.3: The folders and their access

Only each gMSA and the Tier 0 administrators can read its credential folder; only the gMSA writes its runs folder:[^ht06-icacls]

```powershell
icacls D:\HelpDeskAutomation\credentials /inheritance:r /grant:r '<tier0-admins>:(OI)(CI)F' '<domain>\gmsa-fmpassess$:(OI)(CI)R'
icacls D:\HelpDeskAutomation /grant '<domain>\gmsa-fmpassess$:(OI)(CI)RX'
icacls D:\HelpDeskAutomation\runs /grant '<domain>\gmsa-fmpassess$:(OI)(CI)M'
icacls D:\HelpDeskRequests\credentials /inheritance:r /grant:r '<tier0-admins>:(OI)(CI)F' '<domain>\gmsa-fmphelpdesk$:(OI)(CI)R'
icacls D:\HelpDeskRequests /grant '<domain>\gmsa-fmphelpdesk$:(OI)(CI)RX'
icacls D:\HelpDeskRequests\runs /grant '<domain>\gmsa-fmphelpdesk$:(OI)(CI)M'
```

Then the identity engineer places `reader.pfx` and `worker.pfx` in the two credential folders. **Expected:** `Successfully processed 1 files` after each `icacls`. The grants are *design guidance*.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-6; IA-5 | A certificate readable only by its gMSA and Tier 0 | KSI-IAM-ELP | `icacls` output for each folder |

### Step 1.4: The pipeline's client secrets

The pipeline reads the ServiceNow and SailPoint client secrets from the environment variables its settings name, `HDA_SN_CLIENT_SECRET` and `HDA_ISC_CLIENT_SECRET`, which WD-182 says are set for its gMSA only. Check first that neither is a machine variable, which every process on the host could read:

```powershell
'HDA_SN_CLIENT_SECRET', 'HDA_ISC_CLIENT_SECRET' | ForEach-Object { "$_ at machine level: " + [bool][Environment]::GetEnvironmentVariable($_, 'Machine') }
```

**Expected:** `False` for both. *Not yet specified:* how to set a user-level variable for a gMSA, which never signs in interactively. The test stage settles the mechanism and records it in the change record before Step 1.8 runs the pipeline.

### Step 1.5: Try each read-only job by hand

As the operator, with the reader app's certificate:

```powershell
foreach ($j in 'sync', 'consent', 'roles', 'logs') { & D:\HelpDeskAutomation\help-desk-automation\deploy\Invoke-HtScheduledRun.ps1 -Job $j -SettingsPath D:\HelpDeskAutomation\settings.json | Out-Host; "$j exit code: $LASTEXITCODE" }
Get-ChildItem D:\HelpDeskAutomation\runs -Directory -Recurse -Name
```

**Expected:** each job writes a dated folder; exit code 0 or 2, never an error. Before Step 1.6, `logs` shows HT-LF-02 for each server.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CA-7; AU-6 | Each job reads the test tenant with the reader app only | KSI-MLA-EVC | The four run folders |

### Step 1.6: Forward the event logs

A person with the Azure contributor role deploys the rule after reading the what-if, then the `logs` job is run again:[^ht06-deploy]

```powershell
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
$p = @{ workspaceResourceId = '<workspace-resource-id>'; arcMachineNames = @('<arc-server-1>', '<arc-server-2>') }
New-AzResourceGroupDeployment -ResourceGroupName <rg> -TemplateFile D:\HelpDeskAutomation\help-desk-automation\deploy\eventlog-dcr.json -TemplateParameterObject $p -WhatIf
New-AzResourceGroupDeployment -ResourceGroupName <rg> -TemplateFile D:\HelpDeskAutomation\help-desk-automation\deploy\eventlog-dcr.json -TemplateParameterObject $p
& D:\HelpDeskAutomation\help-desk-automation\deploy\Invoke-HtScheduledRun.ps1 -Job logs -SettingsPath D:\HelpDeskAutomation\settings.json
```

**Expected:** the what-if shows one rule and two associations to create; once events arrive, the `logs` run has no finding. Then remove the old event-log script and its share, through the change.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AU-2; AU-6; AU-9; AU-11 | Logs to the workspace, not a share the administrators can change | KSI-MLA-OSM; KSI-MLA-LET; KSI-MLA-RVL | The what-if output; the deployment; the clean `logs` run |

### Step 1.7: Register the four jobs

After Book 10, Appendix B lists them:[^ht06-principal] [^ht06-tasks]

```powershell
& D:\HelpDeskAutomation\help-desk-automation\deploy\Register-HtScheduledJobs.ps1 -SettingsPath D:\HelpDeskAutomation\settings.json
& D:\HelpDeskAutomation\help-desk-automation\deploy\Register-HtScheduledJobs.ps1 -SettingsPath D:\HelpDeskAutomation\settings.json -Apply
Start-ScheduledTask -TaskPath '\FMW\' -TaskName 'FMW Help Desk - Consent requests'
Get-ScheduledTask -TaskPath '\FMW\' | Where-Object TaskName -like 'FMW Help Desk - *' | Get-ScheduledTaskInfo | Format-Table TaskName, LastRunTime, LastTaskResult, NextRunTime -AutoSize | Out-String -Width 200
```

**Expected:** four tasks; the consent task's `LastTaskResult` is 0 or 2, and a new folder is under `runs\consent`. Any other result means the task didn't run as the gMSA: *not yet specified* is whether the gMSA needs the *Log on as a batch job* right on the host.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CA-7 | The jobs on a schedule, under the assessment gMSA | KSI-MLA-EVC | The task list and the first scheduled run |

### Step 1.8: The request pipeline

With the catalog items, fields, rule and clearing job on the instance, the access profiles and the pipeline's client in the sandbox ([Chapter 04](04-requests-in-servicenow-and-sailpoint.md)), and Step 1.4 settled:

```powershell
& D:\HelpDeskRequests\help-desk-automation\deploy\Invoke-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -DryRun
& D:\HelpDeskRequests\help-desk-automation\deploy\Register-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json
& D:\HelpDeskRequests\help-desk-automation\deploy\Register-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -Apply
Get-ScheduledTask -TaskPath '\FMW\' -TaskName 'FMW Help Desk - Request pipeline' | Get-ScheduledTaskInfo | Format-List LastRunTime, LastTaskResult, NextRunTime
```

**Expected:** the dry run lists the ready items with no error (an empty queue is a valid result); the task runs every five minutes under `<domain>\gmsa-fmphelpdesk$`. This is also where the SailPoint token question of [Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md#verified-facts) is answered: an HT-RQ-02 on every item, with an approval you can see in SailPoint, means the client-credentials token can't read the status.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| AC-6; CM-3 | The pipeline under its own gMSA, apart from the read-only jobs | KSI-IAM-JIT; KSI-CMT-LMC | The dry run's `queue.json`; the task |

### Step 1.9: Smoke test

Raise one request of each kind for test users, each approved in the sandbox by someone other than the requester, the resets after an agent records verification. Wait for the pipeline's next run, then read the run:

```powershell
$run = Get-ChildItem D:\HelpDeskRequests\runs -Directory | Sort-Object Name | Select-Object -Last 1
Get-Content (Join-Path $run.FullName 'queue.json') | ConvertFrom-Json | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 250
'Files holding a secret-like value: ' + @(Get-ChildItem $run.FullName -Recurse -File | Select-String -Pattern '"(password|temporaryAccessPass)"\s*:' -List).Count
```

**Expected:** four `done`; `0` files. Then, as the verifying agent, read each secret to the test user on a second channel; after two hours, confirm each item's work notes say the secret was cleared. The test users sign in: the reset user must change the password, the authenticator user registers a method with the pass.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| IA-5; IA-2; IA-12; AC-2; CM-3 | Each task end to end, secret on a separate channel and cleared | KSI-IAM-JIT; KSI-IAM-SUS; KSI-IAM-AAM; KSI-CMT-LMC | The four tickets with their `evidence.json` |

### Step 1.10: Rehearse the rollback

Unregister every task, remove the rule's associations and the rule, and check:[^ht06-tasks] [^ht06-dcr]

```powershell
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
Get-ScheduledTask -TaskPath '\FMW\' | Where-Object TaskName -like 'FMW Help Desk - *' | Unregister-ScheduledTask -Confirm:$false
foreach ($m in '<arc-server-1>', '<arc-server-2>') { Remove-AzDataCollectionRuleAssociation -AssociationName dcr-windows-events-identity-servers-association -ResourceUri "/subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.HybridCompute/machines/$m" }
Remove-AzDataCollectionRule -Name dcr-windows-events-identity-servers -ResourceGroupName <rg>
@(Get-ScheduledTask -TaskPath '\FMW\' -ErrorAction SilentlyContinue | Where-Object TaskName -like 'FMW Help Desk - *').Count
```

**Expected:** `0`. The run folders stay: they're evidence. Re-register with Steps 1.6 to 1.8 before the go/no-go. In production a rollback also turns the catalog items off in ServiceNow, so nothing waits in a queue nobody works.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| CM-3 | A rollback someone has run | KSI-CMT-LMC | The step's output, with the change record |

## Promotion go/no-go criteria

| Criterion | Evidence |
|---|---|
| Each read-only job ran on schedule for five working days, and each finding became a ticket | The run folders; the tickets |
| Every listed server forwards its logs, and the share is gone | A clean `logs` run |
| The four smoke-test requests are `done` with evidence, and no secret appears in any run folder | Step 1.9 |
| The SailPoint token question and the environment variable question are settled, and recorded | The change record |
| The rollback was rehearsed | Step 1.10 |
| Book 10, Appendix B lists both sets | Appendix B |

## Stage 2: production

### Step 2.1: Change record, gMSAs, apps and folders

Repeat Steps 1.1 to 1.4 with production's tenant, subscription, instance and SailPoint tenant, and production's settings files.

### Step 2.2: The read-only jobs

Repeat Steps 1.5 to 1.7. Run the jobs for one week before Step 2.3, so the morning report, the role register and the consent register are known good.

### Step 2.3: The pipeline, dry

Repeat Step 1.8 without `-Apply` on the registration: run `Invoke-HtRequestPipeline.ps1 -DryRun` by hand once a day for the first week against the real queue, and compare each item's outcome with what the service desk did by hand.

### Step 2.4: Turn the catalog items on, one at a time

Register the pipeline (Step 1.8 with `-Apply`), then the ServiceNow administrator makes one item available at a time, in this order: typed user change, cloud account, password reset, authenticator reset. Each waits a week and a change manager's approval.

### Step 2.5: Monitoring and the rollback

Each morning, read the last run's `queue.json` and the four jobs' latest folders; a missing folder is a finding. The rollback is Step 1.10 with production's values.

## Evidence the ISSO keeps

| Evidence | From |
|---|---|
| The SailPoint approvals of both gMSAs, and WD-183's exception | Step 1.1 |
| Each app's grants against the kit's declared permissions | Step 1.2 |
| The folders' access | Step 1.3 |
| Every run folder of the four jobs, with its manifest | Steps 1.5 to 1.7, then daily |
| The what-if and the rule's deployment | Step 1.6 |
| Every worked request's `evidence.json`, attached to its ticket | Steps 1.9, 2.4 |
| The rollback rehearsal | Step 1.10 |

## Verified facts

| Item | Value | Source |
|---|---|---|
| GCC Graph endpoint | `graph.microsoft.com` | [^ht06-deployments] |
| gMSA on a host | `Install-ADServiceAccount`, `Test-ADServiceAccount`; Task Scheduler can run a task as a gMSA | [^ht06-gmsa] |
| Task principal | `New-ScheduledTaskPrincipal -UserId -LogonType` (Password among the values) | [^ht06-principal] |
| Tasks | `Register-ScheduledTask`, `Unregister-ScheduledTask -Confirm:$false` | [^ht06-tasks] |
| App grants | List a service principal's appRoleAssignments | [^ht06-approles] |
| Password reset as an app | `User-PasswordProfile.ReadWrite.All` and at least User Administrator | [^ht06-update] |
| Deploying the rule | `New-AzResourceGroupDeployment -TemplateParameterObject`, `-WhatIf` | [^ht06-deploy] |
| Removing the rule | `Remove-AzDataCollectionRuleAssociation -AssociationName -ResourceUri`; `Remove-AzDataCollectionRule -Name -ResourceGroupName` (Learn's example deletes a rule with no association) | [^ht06-dcr] |
| `icacls` | `/inheritance:r`, `/grant:r` | [^ht06-icacls] |

Not yet specified: setting an environment variable for a gMSA only (Step 1.4); whether the gMSA needs *Log on as a batch job*; registering a task under a gMSA with `-LogonType Password` (Learn shows no example, as *Building Provider Notices*, Chapter 08 records); the Azure role for the rule's deployment; and the SailPoint token question of Chapter 05.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| The pipeline registered under the assessment gMSA | A compromise of a read job can change users | `Register-HtRequestPipeline.ps1` refuses `gmsa-fmpassess$` |
| A secret in a settings file or a machine variable | Anyone on the host holds the client | The run scripts refuse a secret-like key; Step 1.4 checks the machine scope |
| A credential folder others can read | Anyone who reads it signs in as the app | Step 1.3 removes inherited access |
| The reader app granted more "to save a step" | A read job can write | Step 1.2 compares the grants with the kit's declared permissions |
| Every catalog item turned on at once | A fault reaches every task the same day | Step 2.4, one item a week |
| A job silently stops | Evidence stops arriving and nobody notices | Exit code 2 and a dated folder per run; the morning check in Step 2.5 |

## Checklist

- [ ] Both gMSAs approved in SailPoint, covered by WD-183, installed and tested on the host.
- [ ] Each app holds only its kit's permissions; only the worker app holds a directory role, User Administrator.
- [ ] Both credential folders readable only by their gMSA and Tier 0.
- [ ] Neither settings file holds a secret or a placeholder; neither client secret is a machine variable.
- [ ] The four jobs and the pipeline are registered, each under its own gMSA, and each has run.
- [ ] The rule forwards every listed server's logs, and the old share is gone.
- [ ] The smoke test's four requests are `done` with evidence, and no secret is in any run folder.
- [ ] The rollback was rehearsed, and Book 10, Appendix B lists both sets.

::: {.callout-tip}
## Continue the book
[← Chapter 05 — The Request Pipeline and the One-Time Secret](05-the-request-pipeline-and-the-one-time-secret.md) · [Workbook index](index.md)
:::

[^ht06-deployments]: Microsoft Learn, "National cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht06-gmsa]: Microsoft Learn, "Manage group Managed Service Accounts" (tasks using Task Scheduler; `Install-ADServiceAccount`; `Test-ADServiceAccount`), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/manage-group-managed-service-accounts> (read November 25, 2026; carried from *Building Provider Notices*, Chapter 08).
[^ht06-principal]: Microsoft Learn, "New-ScheduledTaskPrincipal" (`-UserId`, `-LogonType`), <https://learn.microsoft.com/powershell/module/scheduledtasks/new-scheduledtaskprincipal> (read November 25, 2026; carried from *Building Provider Notices*, Chapter 08).
[^ht06-tasks]: Microsoft Learn, "Register-ScheduledTask," <https://learn.microsoft.com/powershell/module/scheduledtasks/register-scheduledtask>, and "Unregister-ScheduledTask" (example 2, `-Confirm:$false`), <https://learn.microsoft.com/powershell/module/scheduledtasks/unregister-scheduledtask> (read November 9, 2026; carried from *Building Provider Notices*, Chapter 08).
[^ht06-approles]: Microsoft Learn, "List appRoleAssignments granted to a service principal," <https://learn.microsoft.com/graph/api/serviceprincipal-list-approleassignments?view=graph-rest-1.0> (read October 30, 2026; carried from *Building Non-Person Identity*).
[^ht06-update]: Microsoft Learn, "Update user" (`passwordProfile`: in app-only scenarios the app needs a supported permission and at least the User Administrator role), <https://learn.microsoft.com/graph/api/user-update?view=graph-rest-1.0> (read November 27, 2026).
[^ht06-deploy]: Microsoft Learn, "New-AzResourceGroupDeployment" (`-TemplateFile`, `-TemplateParameterObject`, `-WhatIf`), <https://learn.microsoft.com/powershell/module/az.resources/new-azresourcegroupdeployment> (read November 27, 2026).
[^ht06-dcr]: Microsoft Learn, "Remove-AzDataCollectionRuleAssociation," <https://learn.microsoft.com/powershell/module/az.monitor/remove-azdatacollectionruleassociation>, and "Remove-AzDataCollectionRule," <https://learn.microsoft.com/powershell/module/az.monitor/remove-azdatacollectionrule> (read November 27, 2026).
[^ht06-icacls]: Microsoft Learn, "icacls," <https://learn.microsoft.com/windows-server/administration/windows-commands/icacls> (carried from *Building Provider Notices*, Chapter 08; the grants are design guidance).
[^ht06-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht06-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
