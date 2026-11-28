---
title: "Chapter 05 — The Request Pipeline and the One-Time Secret"
description: "The actuation of Book 15, Chapter 12's request-driven tasks, as WD-182 decides it: every five minutes a scheduled task on the platform host, under its own gMSA, reads the ServiceNow items marked ready, re-reads each approval from SailPoint by its access request id, refuses what it must (HT-RQ-01 to HT-RQ-05), and runs the kit's own script for a typed change, a password reset, an authenticator reset or a cloud account, as the help desk request worker app with only those tasks' Graph permissions. A one-time secret goes only to a restricted field for the verifying agent, never into evidence, work notes or email, and is cleared after two hours. Labs on fixtures and in a test tenant, instance and sandbox."
doc-type: workbook-chapter
audience: [Technical]
family: dw-help-desk-automation
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-27
review-status: pending
---
# Chapter 05 — The Request Pipeline and the One-Time Secret

*The pipeline believes SailPoint, not the ticket; acts only through the kit's own scripts; and hands a secret to one person, on a channel the request didn't come in on.*

::: {.callout-note}
## In this chapter
The machine half of [WD-182](../../../about/decision-register.md#wd-182). You start with what Microsoft Learn says about each write the four tasks make, and the permission and role each needs, then read `Invoke-HtRequestQueue`: how it reads the queue [Chapter 04](04-requests-in-servicenow-and-sailpoint.md) fills, re-reads the approval (the re-read rule [*Building Ticket-to-Machine*, Chapter 05](../ticket-to-machine/05-the-re-read-rule.md) teaches, applied to the approval instead of the result), refuses, acts and writes back. Then the one-time secret: who sees it, where it never goes, and the job that clears it. Lab 1 works the fixture queue as a dry run and then for real against the fixtures, proves the secret is in no evidence file, and runs and registers the pipeline as the platform host would, refusing the assessment gMSA. Lab 2 works one typed change end to end through a developer instance, a SailPoint sandbox and a test tenant, and puts it back.
:::

## Goal and audience

**Goal.** By the end of this chapter you can explain, for each item in the queue, why the pipeline ran it, left it waiting or refused it, show the evidence it attached, and show that no secret reached a log.

**Audience.** Developers who maintain the kit, the platform lead who runs the host, the service desk lead whose agents read the secret, and the ISSO. You don't need a tenant until Lab 2.

## Start with the documentation

### What Microsoft Learn gives you

| Task | The call | Least privilege, application | What Learn adds |
|---|---|---|---|
| Password reset | `PATCH /users/{id}` with `passwordProfile` | `User-PasswordProfile.ReadWrite.All` | In app-only scenarios the app must also hold "at least the *User Administrator*" role, which in delegated use is the least privileged role "for nonadmin users"; "always set the **forceChangePasswordNextSignIn** to `true`"; not for federated users[^ht05-update] |
| Authenticator reset | `GET /users/{id}/authentication/methods`; `DELETE .../microsoftAuthenticatorMethods/{id}`; `DELETE .../phoneMethods/{id}` | `UserAuthenticationMethod.Read.All` to list; `UserAuthenticationMethod.ReadWrite.All` to delete | A phone that is the user's default multifactor method "can't be deleted"[^ht05-methods] [^ht05-authapp] [^ht05-phone] |
| Authenticator reset | `POST /users/{id}/authentication/temporaryAccessPassMethods` | The table lists `UserAuthMethod-TAP.Read.All`; `UserAuthMethod-TAP.ReadWrite.All` and `UserAuthenticationMethod.ReadWrite.All` are higher | `lifetimeInMinutes` between 10 and 43,200; `isUsableOnce`; a user has one usable pass at a time, and a new one replaces the old[^ht05-tap] |
| Cloud account | `POST /users`; `POST /groups/{id}/members/$ref` | `User.Create`; `GroupMember.ReadWrite.All` | —[^ht05-create] [^ht05-members] |
| Every task | `GET /roleManagement/directory/roleAssignments` by `principalId` | `RoleManagement.Read.Directory` | —[^ht05-roles] |

The pipeline signs in to Graph as an app with a certificate, `Connect-MgGraph -Certificate`.[^ht05-connect] Microsoft 365 GCC uses `graph.microsoft.com`.[^ht05-deployments]

### What SailPoint gives you

`GET /v3/access-request-status`, filtered by `accessRequestId`, returns each request's `state` (`EXECUTING`, `REQUEST_COMPLETED`, `CANCELLED`, `TERMINATED`, `PROVISIONING_VERIFICATION_PENDING`, `REJECTED`, `PROVISIONING_FAILED`, `NOT_ALL_ITEMS_PROVISIONED` or `ERROR`), its `requester` and its `approvalDetails`, each with a `status` (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED` or `ARCHIVED`) and a `currentOwner`.[^ht05-status] [^ht05-states]

### What they leave to you

Each row is pinned by a test in `The approved-request pipeline (WD-182)` or `The request pipeline on the platform host` block of `tests/HelpDeskAutomation.Tests.ps1`.

| As published | Why it matters | What the kit adds |
|---|---|---|
| The User Administrator role resets nonadmin users only | An app with the role pointed at an administrator fails, or worse, at a role that allows it | HT-RQ-04: a user who holds any directory role goes to a Privileged Authentication Administrator, by hand |
| A `temporaryAccessPass` in the response body | The secret is one log line from a leak | It goes only to `u_one_time_secret`; never into `evidence.json`, `queue.json`, work notes or email; a test checks the evidence |
| Approval statuses per step | A ticket can say "approved" without SailPoint agreeing | `Test-HtApproval`: every approval `APPROVED`; the request not `REJECTED`, `CANCELLED`, `TERMINATED` or `ERROR`; none owned by the requester; a pending step waits |
| A Temporary Access Pass's lifetime and single use | A long or reusable pass is a second password | `config/request-items.json`: 60 minutes, single use |
| A default phone method can't be deleted | The reset fails part-way | The failure marks the item `failed` with its reason, for a person |
| Nothing about who verified the caller | A reset on the caller's word | HT-RQ-01: no verification recorded, or recorded by the requester |

**The verdict.** Use Learn's calls and least privilege, with the role Learn requires for a password reset. Build the refusals, the re-read, the separate channel and the evidence.

## The code

### Signing in

`deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath [-DryRun]` refuses a settings file with a secret-like key, signs in to Graph as the help desk request worker app with its certificate file, and calls `Connect-HtRequestSystems`, which signs in to ServiceNow (`/oauth_token.do`) and SailPoint (`/oauth/token`) with the client credentials whose secrets are in the environment variables the settings name, set for the pipeline's gMSA only. Then it runs `Invoke-HtRequestQueue -Apply` (a dry run with `-DryRun`) into `<runsPath>/<yyyy-MM-ddTHHmmssZ>/`, prints the outcome of each item, and exits 2 if any item failed.

### The queue

`Invoke-HtRequestQueue -OutputPath [-Apply] [-ItemsPath]` reads the requested items whose `u_automation_state` is `ready` and that have an access request id, and each item's variables. For each:

| Check | What it refuses | State |
|---|---|---|
| HT-RQ-05 | An item that isn't one of the four | `manual` |
| HT-RQ-05 | A variable missing, or one the item doesn't declare | `failed` |
| HT-RQ-01 | A reset with no verification recorded, or verified by the person who asked | `failed` |
| HT-RQ-02 | SailPoint has no such request, shows it `REJECTED`, `CANCELLED`, `TERMINATED` or `ERROR`, or an approval isn't `APPROVED` | `failed` |
| — | An approval still `PENDING` | `waiting`: untouched, read again next run |
| HT-RQ-03 | An approval whose owner is the requester | `failed` |
| HT-RQ-04 | A user who holds a directory role | `manual` |
| HT-RQ-05 | A missing or disabled user; an account profile, usage location or name not allowed; a user that already exists | `failed` or `manual` |

Then the task runs: the typed change through [Chapter 01](01-the-typed-change.md)'s plan and apply, with all of HT-01 to HT-08; a password reset with a 20-character password from the system's cryptographic generator and `forceChangePasswordNextSignIn`; an authenticator reset that removes the Authenticator app and phone methods, keeps the password, and creates a single-use pass for 60 minutes; a cloud account from the item's profile, with the profile's groups and a temporary password. Each item gets `evidence.json` (the task, the access request id, the mode, the result, the state and reason, the controls and KSIs), and with `-Apply` its state, a work note with the evidence's SHA-256, the secret if there is one, and `evidence.json` as an attachment.

### The one-time secret

The pipeline writes the secret to `u_one_time_secret` and nowhere else. The verifying agent's group reads it and reads it to the person on a separate channel: Book 15, Chapter 12's rule is that two messages to the same inbox are still one channel. [`servicenow/scheduled-job-clear-one-time-secret.js`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/servicenow/scheduled-job-clear-one-time-secret.js) runs every 15 minutes and clears any secret on a `done` item last updated more than 120 minutes ago, the `secretClearMinutes` of `config/request-items.json`, with a work note.

### The scheduled task

`deploy/Register-HtRequestPipeline.ps1 -SettingsPath [-Apply]` prints, and with `-Apply` registers, one task, `FMW Help Desk - Request pipeline`, every five minutes, never two at once, for at most 30 minutes, under the settings' `runAs`. It refuses a run-as account that isn't a gMSA, and refuses `gmsa-fmpassess$`: the pipeline writes, so it never runs as the assessment gMSA ([WD-181](../../../about/decision-register.md#wd-181), WD-182).

::: {.callout-important}
## Illustrative code
Lab 1's queue, approvals and users are fictional, and fixture mode writes nothing to any system; a secret it issues is generated, held in memory and dropped. Nothing has run against a live tenant, ServiceNow instance or SailPoint tenant.
:::

## Lab 1: fixtures, no tenant

Work in `examples/help-desk-automation`, in PowerShell 7.1 or later, with Pester 5. The fixture queue has eleven requested items; ten are marked ready with an access request id.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what the pipeline's tasks need
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
'request-queue', 'password-reset', 'authenticator-reset', 'account-create' | ForEach-Object { Get-HtRequiredPermission -Task $_ } | Format-Table Task, Mode, GraphPermissions -AutoSize | Out-String -Width 200

# Step 2: Work the queue as a dry run
Invoke-HtRequestQueue -OutputPath out/queue -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 250

# Step 3: Read a dry run's evidence
Get-Content out/queue/RITM0010002/evidence.json

# Step 4: Work the queue for real, against the fixtures
Invoke-HtRequestQueue -OutputPath out/queue-apply -FixturePath tests/fixtures -Apply -AsOf 2026-11-27T12:00:00Z | Format-Table Number, Task, State, SecretIssued -AutoSize | Out-String -Width 200

# Step 5: Look for the secret in every file the run wrote
'Files holding the pass: ' + @(Get-ChildItem out/queue-apply -Recurse -File | Select-String -Pattern 'FIXTURE-TAP' -List).Count

# Step 6: Read the authenticator reset's evidence
Get-Content out/queue-apply/RITM0010004/evidence.json

# Step 7: Check that the clearing job and the configuration agree on two hours
(Get-HtConfig request-items).secretClearMinutes
Select-String -Path servicenow/scheduled-job-clear-one-time-secret.js -Pattern 'var limitMinutes' | ForEach-Object { $_.Line.Trim() }

# Step 8: Run the pipeline script as its scheduled task would, as a dry run
& { ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests-settings.fixture.json -FixturePath tests/fixtures -DryRun -AsOf 2026-11-27T12:00:00Z; "Exit code: $LASTEXITCODE" }

# Step 9: Print the scheduled task, then try to give it the assessment gMSA
./deploy/Register-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests-settings.fixture.json | Format-List Task, When, RunAs, Registered
$s = Get-Content tests/fixtures/requests-settings.fixture.json -Raw | ConvertFrom-Json
$s.runAs = 'CONTOSO\gmsa-fmpassess$'
$s | ConvertTo-Json | Set-Content out/assess-settings.json
try { ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath out/assess-settings.json } catch { $_.Exception.Message }

# Step 10: Try a settings file that holds a secret
$s = Get-Content tests/fixtures/requests-settings.fixture.json -Raw | ConvertFrom-Json
$s | Add-Member -NotePropertyName iscClientSecret -NotePropertyValue 'not-here'
$s | ConvertTo-Json | Set-Content out/secret-settings.json
try { ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath out/secret-settings.json -FixturePath tests/fixtures -DryRun } catch { $_.Exception.Message }

# Step 11: Run this chapter's tests
Invoke-Pester -Path tests -FullNameFilter 'The approved-request pipeline*', 'The request pipeline on the platform host*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what the pipeline's tasks need:**

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   'request-queue', 'password-reset', 'authenticator-reset', 'account-create' | ForEach-Object { Get-HtRequiredPermission -Task $_ } | Format-Table Task, Mode, GraphPermissions -AutoSize | Out-String -Width 200
   ```

   <!-- capture:begin 05-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-1.txt))](captures/05-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force and what it printed"}

   <!-- capture:end -->

   The reads the queue needs, then each task's write permission. [Permissions by Run](../../../reference/permissions-by-run.md#help-desk-automation) lists the same rows with the ServiceNow and SailPoint rights.

2. **Work the queue as a dry run:**

   ```powershell
   Invoke-HtRequestQueue -OutputPath out/queue -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 250
   ```

   <!-- capture:begin 05-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-2.txt))](captures/05-2.png){.lightbox fig-alt="Terminal window showing Invoke-HtRequestQueue -OutputPath out/queue -FixturePath tests/fixtures -AsOf… and what it printed"}

   <!-- capture:end -->

   Four would run (`dry-run`), one waits for a pending approval, and five are refused: HT-RQ-01 to HT-RQ-05, one each.

3. **Read a dry run's evidence:**

   ```powershell
   Get-Content out/queue/RITM0010002/evidence.json
   ```

   <!-- capture:begin 05-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-3.txt))](captures/05-3.png){.lightbox fig-alt="Terminal window showing Get-Content out/queue/RITM0010002/evidence.json and what it printed"}

   <!-- capture:end -->

   The password reset would force a change at next sign-in and deliver the secret to the restricted field.

4. **Work the queue for real, against the fixtures:**

   ```powershell
   Invoke-HtRequestQueue -OutputPath out/queue-apply -FixturePath tests/fixtures -Apply -AsOf 2026-11-27T12:00:00Z | Format-Table Number, Task, State, SecretIssued -AutoSize | Out-String -Width 200
   ```

   <!-- capture:begin 05-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-4.txt))](captures/05-4.png){.lightbox fig-alt="Terminal window showing Invoke-HtRequestQueue -OutputPath out/queue-apply -FixturePath tests/fixtures… and what it printed"}

   <!-- capture:end -->

   Four `done`; three issued a secret (the two resets and the cloud account).

5. **Look for the secret in every file the run wrote.** The fixture's Temporary Access Pass is the text `FIXTURE-TAP`:

   ```powershell
   'Files holding the pass: ' + @(Get-ChildItem out/queue-apply -Recurse -File | Select-String -Pattern 'FIXTURE-TAP' -List).Count
   ```

   <!-- capture:begin 05-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-5.txt))](captures/05-5.png){.lightbox fig-alt="Terminal window showing 'Files holding the pass: ' + @(Get-ChildItem out/queue-apply -Recurse -File |… and what it printed"}

   <!-- capture:end -->

   `0`.

6. **Read the authenticator reset's evidence:**

   ```powershell
   Get-Content out/queue-apply/RITM0010004/evidence.json
   ```

   <!-- capture:begin 05-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-6.txt))](captures/05-6.png){.lightbox fig-alt="Terminal window showing Get-Content out/queue-apply/RITM0010004/evidence.json and what it printed"}

   <!-- capture:end -->

   Two methods removed, a pass for 60 minutes, single use, and no pass in the file.

7. **Check that the clearing job and the configuration agree on two hours:**

   ```powershell
   (Get-HtConfig request-items).secretClearMinutes
   Select-String -Path servicenow/scheduled-job-clear-one-time-secret.js -Pattern 'var limitMinutes' | ForEach-Object { $_.Line.Trim() }
   ```

   <!-- capture:begin 05-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-7.txt))](captures/05-7.png){.lightbox fig-alt="Terminal window showing (Get-HtConfig request-items).secretClearMinutes and what it printed"}

   <!-- capture:end -->

8. **Run the pipeline script as its scheduled task would, as a dry run:**

   ```powershell
   & { ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests-settings.fixture.json -FixturePath tests/fixtures -DryRun -AsOf 2026-11-27T12:00:00Z; "Exit code: $LASTEXITCODE" }
   ```

   <!-- capture:begin 05-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-8.txt))](captures/05-8.png){.lightbox fig-alt="Terminal window showing & { ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/reques… and what it printed"}

   <!-- capture:end -->

   Exit code 2: items failed.

9. **Print the scheduled task, then try to give it the assessment gMSA:**

   ```powershell
   ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests-settings.fixture.json | Format-List Task, When, RunAs, Registered
   $s = Get-Content tests/fixtures/requests-settings.fixture.json -Raw | ConvertFrom-Json
   $s.runAs = 'CONTOSO\gmsa-fmpassess$'
   $s | ConvertTo-Json | Set-Content out/assess-settings.json
   try { ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath out/assess-settings.json } catch { $_.Exception.Message }
   ```

   <!-- capture:begin 05-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-9.txt))](captures/05-9.png){.lightbox fig-alt="Terminal window showing ./deploy/Register-HtRequestPipeline.ps1 -SettingsPath tests/fixtures/requests… and what it printed"}

   <!-- capture:end -->

10. **Try a settings file that holds a secret:**

    ```powershell
    $s = Get-Content tests/fixtures/requests-settings.fixture.json -Raw | ConvertFrom-Json
    $s | Add-Member -NotePropertyName iscClientSecret -NotePropertyValue 'not-here'
    $s | ConvertTo-Json | Set-Content out/secret-settings.json
    try { ./deploy/Invoke-HtRequestPipeline.ps1 -SettingsPath out/secret-settings.json -FixturePath tests/fixtures -DryRun } catch { $_.Exception.Message }
    ```

    <!-- capture:begin 05-10 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

    ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-10.txt))](captures/05-10.png){.lightbox fig-alt="Terminal window showing $s = Get-Content tests/fixtures/requests-settings.fixture.json -Raw | Convert… and what it printed"}

    <!-- capture:end -->

11. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests -FullNameFilter 'The approved-request pipeline*', 'The request pipeline on the platform host*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    <!-- capture:begin 05-11 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

    ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-11.txt))](captures/05-11.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests -FullNameFilter 'The approved-request pipeline*', '… and what it printed"}

    <!-- capture:end -->

**Expected result:** `PassedCount` 20 and `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 05-12 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/05-12.txt))](captures/05-12.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant, instance and sandbox

Use a Microsoft Entra test tenant, the ServiceNow developer instance with the catalog items from [Chapter 04, Lab 2](04-requests-in-servicenow-and-sailpoint.md#lab-2-a-sailpoint-sandbox-and-a-servicenow-developer-instance), and a SailPoint sandbox, never production. You need one **Typed user change** requested item for a cloud-only test user that the hand-off (or, in the developer instance, an administrator) has set `ready` with the id of a sandbox access request that an approver other than the requester approved; it must be the only ready item. Work in `examples/help-desk-automation`, in PowerShell 7.1 or later with the Microsoft Graph PowerShell SDK, signed in as a test administrator who holds User Administrator through PIM ([Chapter 01, Lab 2](01-the-typed-change.md#lab-2-a-test-tenant), step 4). Resets and cloud accounts are proved in [Chapter 06](06-deploying-to-test-and-production.md#stage-1-test)'s test stage, under the pipeline's own identities. You'll replace: `<tenant-id>`, `<instance>`, `<sn-client-id>` and `<sn-client-secret>` (the pipeline's ServiceNow OAuth client), `<tenant>`, `<isc-client-id>` and `<isc-client-secret>` (the pipeline's SailPoint client), `<ritm-number>` and `<ritm-sys-id>` (the test item), `<test-user-upn>` and `<old-value>` (the test user, and the department step 3's plan records as `before`), and `<admin-user>` and `<admin-password>` (the developer instance's administrator). The authors haven't run this lab.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: Write the lab's settings, and put the secrets in this session's environment only
New-Item -ItemType Directory -Force out | Out-Null
$s = Get-Content deploy/requests-settings.template.json -Raw | ConvertFrom-Json -AsHashtable
$s.Remove('_comment'); $s.tenantId = '<tenant-id>'; $s.serviceNowUrl = 'https://<instance>.service-now.com'; $s.serviceNowClientId = '<sn-client-id>'
$s.iscApiUrl = 'https://<tenant>.api.identitynow.com'; $s.iscClientId = '<isc-client-id>'; $s.runsPath = 'out/request-runs-test'
$s | ConvertTo-Json | Set-Content out/requests-settings.test.json
$env:HDA_SN_CLIENT_SECRET = '<sn-client-secret>'; $env:HDA_ISC_CLIENT_SECRET = '<isc-client-secret>'

# Step 2: Sign in to the three systems
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ((Get-HtRequiredPermission -Task request-queue).GraphPermissions + (Get-HtRequiredPermission -Task typed-change-apply).GraphPermissions | Sort-Object -Unique) -NoWelcome
Connect-HtRequestSystems -Settings (Get-Content out/requests-settings.test.json -Raw | ConvertFrom-Json -AsHashtable)

# Step 3: Work the queue as a dry run
Invoke-HtRequestQueue -OutputPath out/queue-test | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 250
Get-Content out/queue-test/plans/<ritm-number>/plan.json

# Step 4: Work it for real, and read the ticket back
Invoke-HtRequestQueue -OutputPath out/queue-test-apply -Apply | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 250
$cred = [pscredential]::new('<admin-user>', (ConvertTo-SecureString '<admin-password>' -AsPlainText -Force))
(Invoke-RestMethod -Uri "https://<instance>.service-now.com/api/now/table/sc_req_item/<ritm-sys-id>?sysparm_fields=number,u_automation_state" -Credential $cred -Authentication Basic -Headers @{ Accept = 'application/json' }).result
(Invoke-RestMethod -Uri "https://<instance>.service-now.com/api/now/table/sys_attachment?sysparm_query=table_sys_id=<ritm-sys-id>&sysparm_fields=file_name" -Credential $cred -Authentication Basic -Headers @{ Accept = 'application/json' }).result

# Step 5: Back it out
$b = New-HtTypedChangePlan -RequestId REQ-2026-0603 -User <test-user-upn> -ChangeId set-department -Value '<old-value>' -OutputPath out/backout
Invoke-HtTypedChange -PlanPath $b.PlanPath -ApprovedPlanSha256 $b.PlanSha256 -OutputPath out/backout -Apply | Format-List
Invoke-RestMethod -Method PATCH -Uri "https://<instance>.service-now.com/api/now/table/sc_req_item/<ritm-sys-id>" -Credential $cred -Authentication Basic -ContentType 'application/json' -Body '{"u_automation_state": "manual"}' | Out-Null
Disconnect-MgGraph
Remove-Item Env:HDA_SN_CLIENT_SECRET, Env:HDA_ISC_CLIENT_SECRET
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Write the lab's settings, and put the secrets in this session's environment only:**

   ```powershell
   New-Item -ItemType Directory -Force out | Out-Null
   $s = Get-Content deploy/requests-settings.template.json -Raw | ConvertFrom-Json -AsHashtable
   $s.Remove('_comment'); $s.tenantId = '<tenant-id>'; $s.serviceNowUrl = 'https://<instance>.service-now.com'; $s.serviceNowClientId = '<sn-client-id>'
   $s.iscApiUrl = 'https://<tenant>.api.identitynow.com'; $s.iscClientId = '<isc-client-id>'; $s.runsPath = 'out/request-runs-test'
   $s | ConvertTo-Json | Set-Content out/requests-settings.test.json
   $env:HDA_SN_CLIENT_SECRET = '<sn-client-secret>'; $env:HDA_ISC_CLIENT_SECRET = '<isc-client-secret>'
   ```

2. **Sign in to the three systems:**

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ((Get-HtRequiredPermission -Task request-queue).GraphPermissions + (Get-HtRequiredPermission -Task typed-change-apply).GraphPermissions | Sort-Object -Unique) -NoWelcome
   Connect-HtRequestSystems -Settings (Get-Content out/requests-settings.test.json -Raw | ConvertFrom-Json -AsHashtable)
   ```

3. **Work the queue as a dry run:**

   ```powershell
   Invoke-HtRequestQueue -OutputPath out/queue-test | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 250
   Get-Content out/queue-test/plans/<ritm-number>/plan.json
   ```

   One row, `<ritm-number>`, `dry-run`. If it says HT-RQ-02, the SailPoint read failed or the approval isn't complete: see *Not yet specified* below.

4. **Work it for real, and read the ticket back:**

   ```powershell
   Invoke-HtRequestQueue -OutputPath out/queue-test-apply -Apply | Format-Table Number, Task, State, Reason -AutoSize | Out-String -Width 250
   $cred = [pscredential]::new('<admin-user>', (ConvertTo-SecureString '<admin-password>' -AsPlainText -Force))
   (Invoke-RestMethod -Uri "https://<instance>.service-now.com/api/now/table/sc_req_item/<ritm-sys-id>?sysparm_fields=number,u_automation_state" -Credential $cred -Authentication Basic -Headers @{ Accept = 'application/json' }).result
   (Invoke-RestMethod -Uri "https://<instance>.service-now.com/api/now/table/sys_attachment?sysparm_query=table_sys_id=<ritm-sys-id>&sysparm_fields=file_name" -Credential $cred -Authentication Basic -Headers @{ Accept = 'application/json' }).result
   ```

   Expected: `done`, and an attachment `evidence.json`.

5. **Back it out.** Put the user's value back with Chapter 01's functions, close the test item, sign out and clear the secrets:

   ```powershell
   $b = New-HtTypedChangePlan -RequestId REQ-2026-0603 -User <test-user-upn> -ChangeId set-department -Value '<old-value>' -OutputPath out/backout
   Invoke-HtTypedChange -PlanPath $b.PlanPath -ApprovedPlanSha256 $b.PlanSha256 -OutputPath out/backout -Apply | Format-List
   Invoke-RestMethod -Method PATCH -Uri "https://<instance>.service-now.com/api/now/table/sc_req_item/<ritm-sys-id>" -Credential $cred -Authentication Basic -ContentType 'application/json' -Body '{"u_automation_state": "manual"}' | Out-Null
   Disconnect-MgGraph
   Remove-Item Env:HDA_SN_CLIENT_SECRET, Env:HDA_ISC_CLIENT_SECRET
   Remove-Item -Recurse -Force out
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Password reset | `passwordProfile`; `User-PasswordProfile.ReadWrite.All`; app-only needs at least User Administrator; User Administrator for nonadmin users; `forceChangePasswordNextSignIn` `true`; not for federated users | [^ht05-update] |
| List methods | `UserAuthenticationMethod.Read.All` | [^ht05-methods] |
| Delete the Authenticator app | `UserAuthenticationMethod.ReadWrite.All` (application) | [^ht05-authapp] |
| Delete a phone | `UserAuthenticationMethod.ReadWrite.All` (application); the default multifactor phone can't be deleted | [^ht05-phone] |
| Temporary Access Pass | Least privileged in Learn's table `UserAuthMethod-TAP.Read.All`; `lifetimeInMinutes` 10 to 43,200; `isUsableOnce`; one usable pass per user | [^ht05-tap] |
| Create user, add members | `User.Create`; `GroupMember.ReadWrite.All` | [^ht05-create] [^ht05-members] |
| Role assignments | `RoleManagement.Read.Directory` | [^ht05-roles] |
| Access request status | `state` values; `approvalDetails[].status` values; `requester`, `currentOwner` | [^ht05-status] [^ht05-states] |

Not yet specified:

- **Which SailPoint token the status read needs.** SailPoint's specification lists `listAccessRequestStatus` under `userAuth` with user level `ORG_ADMIN`, and no `applicationAuth`;[^ht05-status] *Building Ticket-to-Machine*, Chapter 03 records that a client-credentials token has no user context and that most admin APIs often return 403 with one.[^ht05-isc-auth] The kit and WD-182 sign the pipeline in with client credentials. Whether that token can read the status, or the pipeline's client needs a personal access token for a user at `ORG_ADMIN`, is proved in the test stage; until then neither is the recommendation.
- **The pass's write permission.** Learn's table names a read permission as least privileged for creating a pass; the kit declares `UserAuthMethod-TAP.ReadWrite.All` until a test tenant shows otherwise (WD-182).
- **Which role, if any, an app needs for the method deletes and the pass in app-only use.** Learn's pages name Authentication Administrator and Privileged Authentication Administrator for delegated access only; the pipeline refuses users with a directory role either way.

## Federal requirements and evidence

The controls and KSIs are `config/requirements.json` for `typed-change`, `password-reset`, `authenticator-reset` and `account-create`.[^ht05-oscal] [^ht05-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| A typed change ran only after SailPoint approved it, through Chapter 01's checks, plan and hash (Lab 1, steps 2 and 4; Lab 2, steps 3 and 4: `evidence.json`, the plan) | AC-2; AC-6; CM-3 | KSI-CMT-LMC; KSI-IAM-JIT | The ISSO, with the ticket's attachment |
| A password reset forced a change at next sign-in, after recorded verification, and its secret reached only the restricted field (Lab 1, steps 3 to 5) | IA-5; AC-2 | KSI-IAM-JIT | The service desk lead |
| An authenticator reset removed the old methods and issued a single-use, 60-minute pass, after verification and two approvals (Lab 1, steps 4 to 6) | IA-5; IA-2; IA-12; SI-4 | KSI-IAM-JIT; KSI-IAM-SUS | Security operations, which watches repeated resets |
| A cloud account was created from an approved profile with its groups only (Lab 1, step 4) | AC-2; AC-6; IA-5 | KSI-IAM-AAM | The identity governance engineer |
| The pipeline runs under its own gMSA, never the assessment gMSA, with no secret in its settings (Lab 1, steps 8 to 10) | AC-6; IA-5 | KSI-IAM-JIT | The platform lead |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The mapping is the program's *(design guidance)*. The pipeline's records support these controls; the assessor decides them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A ticket field stands in for the approval | Anyone who can edit the ticket can approve | The pipeline re-reads SailPoint by the access request id |
| A requester approves their own request | One person asks and approves | HT-RQ-03 |
| The worker app resets an administrator | The app's role and method rights reach privileged accounts | HT-RQ-04: any directory role goes to a person |
| The secret in a log, a work note or an email | Whoever reads the log holds the account | Only `u_one_time_secret`; Lab 1, step 5 and a test check the evidence; cleared after two hours |
| The pipeline shares the assessment gMSA | A compromise of the read-only jobs can change users | Registration refuses `gmsa-fmpassess$`; separate apps for read and write (WD-181, WD-182) |
| Two runs overlap | An item is worked twice | The task is registered to ignore a new instance while one runs, and an item leaves `ready` once worked |
| A secret in the settings file | Anyone who reads the file holds the client | The run refuses a secret-like key; secrets are environment variables for the gMSA only |

## Checklist

- [ ] The worker app holds only the permissions WD-182 lists, and the User Administrator role, and nothing else.
- [ ] The pipeline's gMSA isn't `gmsa-fmpassess$`, and only it can read the environment variables and the certificate file.
- [ ] The SailPoint token question above is answered in the test stage, and the answer recorded in the change record.
- [ ] The clearing job runs every 15 minutes, with the same limit as `secretClearMinutes`.
- [ ] Every worked item has its state, a work note with the evidence's SHA-256, and `evidence.json` attached, and no secret appears anywhere else.
- [ ] Book 10, Appendix B lists the pipeline, its identities and its paths before it runs (WD-182).

::: {.callout-tip}
## Continue the book
[← Chapter 04 — Requests In](04-requests-in-servicenow-and-sailpoint.md) · [Workbook index](index.md) · [Next: Chapter 06 — Deploying to Test and Production →](06-deploying-to-test-and-production.md)
:::

[^ht05-update]: Microsoft Learn, "Update user" (`passwordProfile`; permissions for specific scenarios; Example 3, resetting another user's password), <https://learn.microsoft.com/graph/api/user-update?view=graph-rest-1.0> (read November 27, 2026).
[^ht05-methods]: Microsoft Learn, "List methods," <https://learn.microsoft.com/graph/api/authentication-list-methods?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht05-authapp]: Microsoft Learn, "Delete microsoftAuthenticatorAuthenticationMethod," <https://learn.microsoft.com/graph/api/microsoftauthenticatorauthenticationmethod-delete?view=graph-rest-1.0> (read November 27, 2026).
[^ht05-phone]: Microsoft Learn, "Delete phoneAuthenticationMethod" (the default multifactor phone can't be deleted), <https://learn.microsoft.com/graph/api/phoneauthenticationmethod-delete?view=graph-rest-1.0> (read November 27, 2026).
[^ht05-tap]: Microsoft Learn, "Create temporaryAccessPassMethod" (permissions; `isUsableOnce`; `lifetimeInMinutes` between 10 and 43200; one usable pass per user), <https://learn.microsoft.com/graph/api/authentication-post-temporaryaccesspassmethods?view=graph-rest-1.0> (read November 27, 2026).
[^ht05-create]: Microsoft Learn, "Create user," <https://learn.microsoft.com/graph/api/user-post-users?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht05-members]: Microsoft Learn, "Add members," <https://learn.microsoft.com/graph/api/group-post-members?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht05-roles]: Microsoft Learn, "List roleAssignments," <https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignments?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht05-connect]: Microsoft Learn, "Use app-only authentication with the Microsoft Graph PowerShell SDK," <https://learn.microsoft.com/powershell/microsoftgraph/app-only>, and "Connect-MgGraph," <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph> (read November 9, 2026; carried from *Building Provider Notices*, Chapter 08).
[^ht05-deployments]: Microsoft Learn, "National cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht05-status]: SailPoint, Identity Security Cloud API specification v3, `listAccessRequestStatus` (`paths/access-request-status.yaml`: `userAuth` scope `idn:access-request-status:read`, user level `ORG_ADMIN`, filter `accessRequestId`; response `RequestedItemStatus`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/access-request-status.yaml> (read November 27, 2026).
[^ht05-states]: SailPoint, Identity Security Cloud API specification v3, schemas `RequestedItemStatusRequestState.yaml` (the request's states), `ApprovalStatusDto.yaml` (`status`, `currentOwner`) and `ManualWorkItemState.yaml` (the approval statuses), <https://github.com/sailpoint-oss/api-specs/tree/main/idn/v3/schemas> (read November 27, 2026).
[^ht05-isc-auth]: SailPoint Developer, "Authentication" (client-credentials limits), <https://developer.sailpoint.com/docs/api/authentication> (read November 1, 2026; carried from *Building Ticket-to-Machine*, Chapter 03).
[^ht05-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht05-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
