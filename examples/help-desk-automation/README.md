# Help desk automation

> **Status: illustrative.** Tested on its fictional fixtures (`tests/`), not run against a live tenant. Review every line, run it first in a test tenant, and run any change only with `-Apply` and the approved plan's SHA-256.

Scripts for the everyday help desk and audit tasks in [Book 15, Chapter 12](../../docs/books/b15-day2-operations/12-the-day-two-runbook.md), so a task runs from a typed request or a schedule instead of from an email under standing administrator rights. It covers all eight. The first two:

| Task (Book 15, Chapter 12) | What the pack does | Reads or changes | Where it runs |
|---|---|---|---|
| 5. Running a script for a requester | `New-HtTypedChangePlan` checks a typed request and plans one change to one user; `Invoke-HtTypedChange` applies it only with the approved plan's SHA-256 | Plans read; applying changes one user | Approved request: a person with a just-in-time role, or the approved pipeline |
| 3. Admin consent requests | `Get-HtPendingConsentRequest` lists the pending requests and flags old and broad ones; the verdict stays with the identity governance approver | Reads only | Scheduled on the platform host ([WD-181](../../docs/about/decision-register.md#wd-181)) |

## The rule the typed change enforces

"Parameters travel; commands don't" (Book 15, Chapter 12). A request names a change from [`config/typed-changes.json`](config/typed-changes.json) and supplies a user and a value. Nothing else is accepted, and the pack's own script is the only thing that runs. It never runs a command pasted from a request.

| Check | What it refuses |
|---|---|
| HT-01 | A change that isn't in `config/typed-changes.json` |
| HT-02 | A user synchronized from on-premises: its source of authority is the on-premises directory, so the change belongs there or in the HR record (Microsoft Learn, *Update user*) |
| HT-03 | A value the change doesn't accept (its list or pattern) |
| HT-04 | A user who is disabled or doesn't exist: a disabled account goes to the security office |
| HT-05 | Nothing to change: the user already has the value |
| HT-06 | A request id that isn't a ticket number |
| HT-07 | When applying: the value changed since the plan was made |
| HT-08 | When applying: the plan's SHA-256 isn't the approved one, or the plan was edited |

## Run it on the fixtures

From the `help-desk-automation` folder, in PowerShell 7.1 or later:

```powershell
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
$p = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath tests/fixtures
$p
```

`Ready` is `True` and `PlanSha256` is the hash an approver approves. A dry run changes nothing:

```powershell
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath tests/fixtures
```

The pending consent requests on the fixtures:

```powershell
Get-HtPendingConsentRequest -OutputPath out/consent -FixturePath tests/fixtures -AsOf 2026-11-27
Get-Content out/consent/findings.json
```

Two applications are pending. One has waited 15 days (HT-CR-01) and asks for `Files.ReadWrite.All`, which the identity governance approver decides (HT-CR-02).

The tests:

```powershell
Invoke-Pester -Path tests
```

## In a test tenant

```powershell
Connect-MgGraph -Scopes (Get-HtRequiredPermission -Task consent-requests).GraphPermissions -NoWelcome
Get-HtPendingConsentRequest -OutputPath out/consent
```

A typed change in a test tenant: plan it, have someone other than the requester approve the plan's SHA-256, then apply it with a role activated through PIM against the ticket:

```powershell
Connect-MgGraph -Scopes (Get-HtRequiredPermission -Task typed-change-apply).GraphPermissions -NoWelcome
$p = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User <test user UPN> -ChangeId set-department -Value <value> -OutputPath out/plan
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 <approved SHA-256> -OutputPath out/apply -Apply
```

## Permissions

Every Graph call is declared, with its task and least privilege, in [`config/calls.json`](config/calls.json). The module refuses any call that isn't declared, and a test checks it. From Microsoft Learn (read November 27, 2026):

| Task | Calls | Least-privileged permission |
|---|---|---|
| `typed-change-plan` | Get user | `User.Read.All` |
| `typed-change-apply` | Get user, update user | `User.Read.All`, `User.ReadUpdate.All` |
| `consent-requests` | List appConsentRequests, list userConsentRequests | `ConsentRequest.Read.All` |

## Evidence

Each plan, apply and review writes JSON with the SHA-256 of what it wrote and the controls and KSIs from [`config/requirements.json`](config/requirements.json): AC-2, CM-3 and KSI-CMT-LMC for the plan; AC-2, AC-6, CM-3, KSI-CMT-LMC and KSI-IAM-JIT for the change; AC-6, AC-20, CA-7, SA-9 and KSI-IAM-ELP for the consent review. The evidence supports those controls; the assessor decides them. KSIs are FedRAMP's provider indicators, which the agency lines its own evidence up with.

## At work

The pack is neutral, and every name in it is invented. Copy `config/typed-changes.json` and `config/consent-review.json`, edit them at work, and keep your copies inside the agency. [`copilot-prompts.md`](copilot-prompts.md) has prompts for Microsoft 365 Copilot Chat to help fill them in.

## The scheduled jobs on the platform host

Four read-only jobs replace the morning logon, the email report, the event-log share and the role spreadsheet (Book 15, Chapter 12, tasks 3, 6, 7 and 8). Each runs as a Windows scheduled task under the assessment gMSA and signs in to Graph and Azure as the help desk audit reader app ([WD-181](../../docs/about/decision-register.md#wd-181)).

| Job | Function | Findings | Least privilege |
|---|---|---|---|
| `sync`, daily | `Invoke-HtSyncCheck`: last synchronization, users with a provisioning error, Microsoft 365 service health, and what changed since the last run | HT-SY-01 late (more than 90 minutes, two missed 30-minute cycles), HT-SY-02 a provisioning error, HT-SY-03 a service not operational | `Organization.Read.All`, `User.Read.All`, `ServiceHealth.Read.All` |
| `consent`, daily | `Get-HtPendingConsentRequest` | HT-CR-01, HT-CR-02 | `ConsentRequest.Read.All` |
| `logs`, daily | `Test-HtLogForwarding`: each listed server is an Arc machine, is associated with the data collection rule, and has sent an event recently | HT-LF-01 not Arc, HT-LF-02 not associated, HT-LF-03 silent | Azure `Reader`, `Log Analytics Reader` |
| `roles`, weekly | `Invoke-HtRoleReview`: custom directory and Intune roles against [`config/role-register.json`](config/role-register.json) | HT-RR-01 not in the register, HT-RR-02 permissions differ, HT-RR-03 review overdue, HT-RR-04 (warning) held directly | `RoleManagement.Read.Directory`, `DeviceManagementRBAC.Read.All` |

Each run writes a dated folder with its JSON, a report where there is one, and `manifest.json` (each file's SHA-256, the controls and the KSIs), and exits 2 when it has findings, so the scheduler's history shows them. The next part of the kit turns each finding into a ServiceNow ticket.

### Set it up, step by step

Run these on the platform host as a host administrator, in a test tenant and test forest first.

1. **The gMSA.** Requested through the system access management tool and approved in SailPoint, as the managed service account standard sets out; the program's pipeline creates it ([WD-163](../../docs/about/decision-register.md#wd-163)). WD-181 uses the one assessment gMSA, `gmsa-fmpassess$`, for every scheduled read-only job. Install it on the host and check it:

   ```powershell
   Install-ADServiceAccount -Identity gmsa-fmpassess
   Test-ADServiceAccount -Identity gmsa-fmpassess
   ```

2. **The reader app.** One Entra app registration for this set (WD-181), with a certificate and these application permissions, admin-consented: `Organization.Read.All`, `User.Read.All`, `ServiceHealth.Read.All`, `ConsentRequest.Read.All`, `RoleManagement.Read.Directory`, `DeviceManagementRBAC.Read.All`. In Azure: `Reader` on the resource group holding the Arc machines and `Log Analytics Reader` on the workspace. Nothing that writes. Check what each job needs:

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1
   'sync-check', 'consent-requests', 'role-review', 'log-forwarding-check' | ForEach-Object { Get-HtRequiredPermission -Task $_ }
   ```

3. **The folders.** `D:\HelpDeskAutomation\` holds the kit, `config\` (your copies of the config files), `credentials\` (the reader app's `.pfx`) and `runs\`. Only the gMSA and the host's Tier 0 administrators can read `credentials\`; only the gMSA can write `runs\`.

4. **The settings.** Copy [`deploy/settings.template.json`](deploy/settings.template.json) to `D:\HelpDeskAutomation\settings.json` and fill in every `<placeholder>`. It holds no secret; the run refuses a secret-like key.

5. **Try each job once by hand,** as yourself, before scheduling:

   ```powershell
   ./deploy/Invoke-HtScheduledRun.ps1 -Job sync -SettingsPath D:\HelpDeskAutomation\settings.json
   ```

6. **Register the tasks.** A dry run first, then `-Apply`:

   ```powershell
   ./deploy/Register-HtScheduledJobs.ps1 -SettingsPath D:\HelpDeskAutomation\settings.json
   ./deploy/Register-HtScheduledJobs.ps1 -SettingsPath D:\HelpDeskAutomation\settings.json -Apply
   ```

7. **Book 10, Appendix B.** List the jobs, the gMSA, the reader app and the paths (outbound HTTPS to `login.microsoftonline.com`, `graph.microsoft.com`, `management.azure.com` and `api.loganalytics.io`) before the first scheduled run, as WD-181 requires.

### Forward the event logs instead of writing them to a share

[`deploy/eventlog-dcr.json`](deploy/eventlog-dcr.json) is one data collection rule for Azure Monitor Agent: sign-ins, privileged logons and account and group changes from the Security log, and errors and warnings from System and Application, to the Log Analytics workspace's `Event` table, with an association for each Azure Arc-enabled server. Azure Monitor Agent supports Arc-enabled on-premises servers (Microsoft Learn). A person deploys it after review; the scheduled identity only checks it:

```powershell
$p = @{ workspaceResourceId = '<workspace resource id>'; arcMachineNames = @('SYNC01', 'SYNC02') }
New-AzResourceGroupDeployment -ResourceGroupName <rg> -TemplateFile ./deploy/eventlog-dcr.json -TemplateParameterObject $p -WhatIf
New-AzResourceGroupDeployment -ResourceGroupName <rg> -TemplateFile ./deploy/eventlog-dcr.json -TemplateParameterObject $p
```

Then remove the old scheduled event-log script and its share, and the `logs` job shows each server forwarding. Microsoft Sentinel's Windows Security Events connector uses the same agent and writes the Security log to the `SecurityEvent` table instead; use it if security operations reads that table.

## The request-driven tasks: ServiceNow, SailPoint and the pipeline

Four tasks run only from an approved request ([WD-182](../../docs/about/decision-register.md#wd-182)): a typed change, a password reset, an authenticator reset and a cloud account for a partner or lab user.

```text
ServiceNow catalog item (typed variables only)
  -> agent records identity verification (resets)
  -> business rule hands it to the system access management tool
  -> SailPoint approves the task's access profile (two approvers for an authenticator reset)
  -> the pipeline on the platform host (its own gMSA, every 5 minutes):
       re-reads the approval from SailPoint, checks, runs the pre-approved script,
       writes the result, work notes and evidence back to the ticket
  -> the agent reads any one-time secret to the person on a separate channel; it's cleared after 2 hours
```

| Task | What the pipeline does | Least privilege (Microsoft Learn, November 27, 2026) |
|---|---|---|
| Typed user change | The typed change's own checks (HT-01 to HT-08), its plan and its hash, then the change | `User.Read.All`, `User.ReadUpdate.All` |
| Password reset | A strong temporary password the user must change at next sign-in | `User-PasswordProfile.ReadWrite.All`, with the User Administrator role, which covers nonadmin users only |
| Authenticator reset | Removes the Authenticator app and phone methods, keeps the password, and issues a single-use Temporary Access Pass for 60 minutes | `UserAuthenticationMethod.ReadWrite.All`, `UserAuthMethod-TAP.ReadWrite.All` |
| Cloud account | Creates the user from the item's profile (usage location, groups) | `User.Create`, `GroupMember.ReadWrite.All` |

Every item is checked first. The pipeline refuses:

| Check | What it refuses |
|---|---|
| HT-RQ-01 | A reset with no identity verification recorded, or verified by the person who asked |
| HT-RQ-02 | A request SailPoint hasn't approved (rejected, cancelled, expired or in error); one still pending stays in the queue |
| HT-RQ-03 | A request its own requester approved |
| HT-RQ-04 | A user who holds a directory role: a Privileged Authentication Administrator acts by hand |
| HT-RQ-05 | Anything else invalid: an unknown catalog item, a variable it doesn't declare, a missing or disabled user, a usage location or profile not allowed |

Run it on the fixtures, a dry run that changes nothing:

```powershell
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
Invoke-HtRequestQueue -OutputPath out/queue -FixturePath tests/fixtures | Format-Table Number, Task, State, Reason
```

Of the eleven fictional items, ten are ready: four run, one waits for a pending approval, and five are refused (HT-RQ-01 to HT-RQ-05).

### What each system needs

- **ServiceNow** ([`servicenow/`](servicenow/)): the four catalog items and the fields on the requested item ([`catalog-items.json`](servicenow/catalog-items.json)); the hand-off business rule ([`business-rule-hand-off-to-access-management.js`](servicenow/business-rule-hand-off-to-access-management.js)); the job that clears the one-time secret ([`scheduled-job-clear-one-time-secret.js`](servicenow/scheduled-job-clear-one-time-secret.js)); and the roles ([`acl.md`](servicenow/acl.md)).
- **SailPoint** ([`sailpoint/access-profiles.json`](sailpoint/access-profiles.json)): one requestable access profile per task, with its approval scheme in SailPoint's own shape (`accessRequestConfig.approvalSchemes`), and the pipeline's API client, `idn:access-request-status:read` only.
- **The platform host:** the pipeline's own gMSA, requested and approved like any managed service account (an example name is `gmsa-fmphelpdesk$`); the request worker app with its certificate and the permissions above; and the ServiceNow and SailPoint client secrets in environment variables for that gMSA. Then:

  ```powershell
  ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -DryRun
  ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json
  ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath D:\HelpDeskRequests\settings.json -Apply
  ```

  Settings: [`deploy/requests-settings.template.json`](deploy/requests-settings.template.json). Registration refuses a run-as account that isn't a gMSA, or that is the assessment gMSA.

## Not yet proved

Nothing here has run against a live tenant, ServiceNow instance or SailPoint tenant. In a test stage, prove: each app's certificate sign-in; the worker app's permissions (Learn's table for the Temporary Access Pass names a read permission as least privileged for the whole page, so the create is declared with the write permission until a test tenant shows otherwise); the hand-off through the access management tool; and the clearing job.
