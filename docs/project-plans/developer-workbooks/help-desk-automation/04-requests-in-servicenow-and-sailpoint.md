---
title: "Chapter 04 — Requests In: ServiceNow Catalog Items and the SailPoint Approval"
description: "The front door of Book 15, Chapter 12's request-driven tasks, as the kit's templates build it: four ServiceNow catalog items that carry typed variables and never a command, the fields added to the requested item, the business rule that waits for an agent's identity verification and hands the request to the agency's system access management tool, and one requestable SailPoint access profile per task whose approval scheme decides it, two approvers for an authenticator reset. ServiceNow records; SailPoint approves (WD-174, WD-182). Labs on the templates and fixtures, and in a SailPoint sandbox and a ServiceNow developer instance."
doc-type: workbook-chapter
audience: [Technical]
family: dw-help-desk-automation
part: How
series-order: 4
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-27
review-status: pending
---
# Chapter 04 — Requests In: ServiceNow Catalog Items and the SailPoint Approval

*A request that can say anything has to be read by a person. A request that can only fill in typed fields can be checked by a machine, and approved by the system whose job is approving.*

::: {.callout-note}
## In this chapter
Four of [Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md)'s tasks start with a request: [a password reset](../../../books/b15-day2-operations/12-the-day-two-runbook.md#password-reset), [an authenticator reset](../../../books/b15-day2-operations/12-the-day-two-runbook.md#authenticator-mfa-reset), [a cloud account](../../../books/b15-day2-operations/12-the-day-two-runbook.md#creating-an-account) and [a typed change](../../../books/b15-day2-operations/12-the-day-two-runbook.md#running-a-script-for-a-requester). [WD-182](../../../about/decision-register.md#wd-182) decides how they arrive: as ServiceNow catalog items with typed variables only, handed to the agency's system access management tool, which submits each to SailPoint as a request for that task's access profile, whose approval scheme decides it. This chapter reads the kit's templates for both systems: `servicenow/` and `sailpoint/access-profiles.json`, and the file that ties them to the code, `config/request-items.json`. It doesn't repeat how the kit's clients reach ServiceNow and SailPoint: [*Building Ticket-to-Machine*, Chapter 02](../ticket-to-machine/02-servicenow-client-and-least-privilege.md) and [Chapter 03](../ticket-to-machine/03-sailpoint-client-and-scopes.md) teach that. Lab 1 reads the templates and the fixture queue. Lab 2 creates the four access profiles in a SailPoint sandbox, checks a developer instance's catalog items against the template, and deletes the profiles.
:::

## Goal and audience

**Goal.** By the end of this chapter you can say, for each request-driven task, exactly what a requester can type, what the service desk agent records, who approves it in SailPoint, and which field tells the pipeline it may act.

**Audience.** The ServiceNow administrator who builds the catalog items, the identity governance engineer who builds the access profiles, the developer who keeps `config/request-items.json` in step with both, and the ISSO. You don't need an instance until Lab 2.

## Start with ServiceNow's and SailPoint's documentation

### What they give you

- **SailPoint.** An access profile's `accessRequestConfig` carries `commentsRequired`, `denialCommentsRequired` and `approvalSchemes`, "the steps involved in approving the request." Each step's `approverType` is one of `APP_OWNER`, `OWNER`, `SOURCE_OWNER`, `MANAGER`, `GOVERNANCE_GROUP`, `WORKFLOW`, `ALL_OWNERS`, `ADDITIONAL_OWNER` or `ADDITIONAL_GOVERNANCE_GROUP`, with `approverId` naming the governance group or workflow.[^ht04-scheme] Creating one is `POST /v3/access-profiles` with `idn:access-profile:manage` (and three read scopes), for user levels `ORG_ADMIN`, `ROLE_ADMIN`, `ROLE_SUBADMIN`, `SOURCE_ADMIN` or `SOURCE_SUBADMIN`; deleting one is `DELETE /v3/access-profiles/{id}` with the same manage scope.[^ht04-profiles] The status of a request is `GET /v3/access-request-status`, filterable by `accessRequestId`, with scope `idn:access-request-status:read` and user level `ORG_ADMIN` ([Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md) reads it).[^ht04-status]
- **ServiceNow.** The Table API reads and updates records, and the Attachment API adds a file to one; an inbound OAuth client uses the client-credentials grant at `/oauth_token.do`. [*Building Ticket-to-Machine*, Chapter 02](../ticket-to-machine/02-servicenow-client-and-least-privilege.md#the-verified-facts) verified each, with the roles they need.[^ht04-table]
- **The program.** SailPoint approves and ServiceNow records; a ServiceNow required field records completeness and isn't an approval ([WD-174](../../../about/decision-register.md#wd-174)).

### What they leave to you

Each row is pinned by a test in the `The request pipeline on the platform host` or `The approved-request pipeline (WD-182)` block of `tests/HelpDeskAutomation.Tests.ps1`.

| As published | Why it matters | What the kit adds |
|---|---|---|
| A catalog item can carry any variable, free text included | A free-text field is where a pasted command arrives | Four items whose variables are only those `config/request-items.json` declares; a test fails if the template has a `command` variable, and the pipeline refuses an undeclared variable (HT-RQ-05) |
| Nothing ties a ServiceNow request to a SailPoint approval | The pipeline would have to trust a ticket field | `u_isc_access_request_id`, written only by the hand-off, which the pipeline uses to re-read SailPoint |
| Approval schemes, with no notion of a help desk task | One generic "help desk" approval for every task | One requestable access profile per task, each with its own scheme; two steps (`MANAGER`, then a `GOVERNANCE_GROUP`) for an authenticator reset, the highest-risk task |
| Nothing about who verified the caller | A reset can go ahead on the caller's word | `u_identity_verified_by` and `u_identity_verification_method`, set by the agent; the hand-off waits for them on a reset |
| A field type for secrets | The secret could go in a work note or an email | `u_one_time_secret`, readable only by the verifying group, cleared by a scheduled job ([Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md)) |

**The verdict.** Use SailPoint's own approval schemes and ServiceNow's own records. Build the typed items, the hand-off and the fields that join them.

## The code

### The catalog items and their fields

[`servicenow/catalog-items.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/servicenow/catalog-items.json) is a template for a ServiceNow administrator:

| Item | Variables the requester fills in | The agent records | Task |
|---|---|---|---|
| Typed user change | `user_principal_name`, `change_id` (a choice from `config/typed-changes.json`), `value` | — | `typed-change` |
| Password reset | `user_principal_name` | Who verified the person, and how | `password-reset` |
| Authenticator reset | `user_principal_name` | Who verified the person, and how | `authenticator-reset` |
| Cloud account for a partner or lab user | `given_name`, `surname`, `user_principal_name`, `usage_location`, `profile` | — | `account-create` |

It adds five fields to the requested item: `u_automation_state` (`awaiting-approval`, `ready`, `done`, `failed`, `manual`), `u_isc_access_request_id`, `u_identity_verified_by`, `u_identity_verification_method` (four methods, from a callback to the phone number in the HR record to a manager's confirmation through the HR record) and `u_one_time_secret`. [`servicenow/acl.md`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/servicenow/acl.md) gives three roles: the pipeline's integration user, which writes only the state, the work notes and the secret field and adds attachments; the verifying group, which reads the secret; and the agents, who write the verification. Nobody but the hand-off writes the access request id.

### The hand-off

[`servicenow/business-rule-hand-off-to-access-management.js`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/servicenow/business-rule-hand-off-to-access-management.js) runs after a requested item for one of the four items is inserted. A reset without the agent's verification stays `awaiting-approval`. Otherwise the rule calls the agency's system access management tool through an outbound REST message (a placeholder name, `x_example_hda.access_management_submit`), records the access request id SailPoint returns, and sets the item `ready`. A refused hand-off sets it `failed`. ServiceNow never approves.

### The access profiles

[`sailpoint/access-profiles.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/sailpoint/access-profiles.json) holds the four requestable profiles in SailPoint's v3 shape, with placeholders for the owner, source and entitlement the agency models a help desk task with. Approving a profile approves that one task for that one person; it grants nothing standing. It also names the pipeline's API client: `idn:access-request-status:read` only, read only. SailPoint's specification lists that read for user-context tokens only, with `ORG_ADMIN` for other users' requests, and a client-credentials token has no user context. So [WD-184](../../../about/decision-register.md#wd-184), a draft amendment to WD-182 awaiting approval, has the test stage prove the API client's token first. If it gets a 403, the pipeline uses the personal access token of a dedicated non-human SailPoint identity, holding only that scope ([Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md#signing-in)).

### The tie to the code

[`config/request-items.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/config/request-items.json) maps each item's name to its task, its variables and whether it needs verification; names the table, the ready query and every field the pipeline reads and writes; and holds the account profiles (their groups), the allowed usage locations, the Temporary Access Pass's settings and `secretClearMinutes`. If an administrator renames a field, this file changes with it.

::: {.callout-important}
## Illustrative code
The ServiceNow scripts and the SailPoint profiles are templates: they parse, and a test checks their shape, but none has run on a live instance or tenant. Lab 1 reads them and the fictional queue in `tests/fixtures/requests.json`.
:::

## Lab 1: fixtures, no tenant

Work in `examples/help-desk-automation`, in PowerShell 7.1 or later, with Pester 5. The fixture queue holds eleven fictional requested items, `RITM0010001` to `RITM0010011`, with their variables and the SailPoint status of each.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the four catalog items as the pipeline reads them
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
$cfg = Get-HtConfig request-items
$cfg.items.Keys | Sort-Object | ForEach-Object { [pscustomobject]@{ Item = $_; Task = $cfg.items[$_].task; Variables = $cfg.items[$_].variables -join ', '; Verification = $cfg.items[$_].verification } } | Format-Table -AutoSize | Out-String -Width 200

# Step 2: Check the ServiceNow template against it
$ci = Get-Content servicenow/catalog-items.json -Raw | ConvertFrom-Json
'Items in both: ' + @(Compare-Object ($ci.items.name | Sort-Object) ($cfg.items.Keys | Sort-Object) -IncludeEqual -ExcludeDifferent).Count
'Variables named command: ' + @($ci.items.variables.name | Where-Object { $_ -eq 'command' }).Count

# Step 3: Read the fields the template adds to the requested item
$ci.requestedItemFields | Format-List name, type, writtenBy

# Step 4: Read where the hand-off sets the state
Select-String -Path servicenow/business-rule-hand-off-to-access-management.js -Pattern 'u_automation_state = ' | ForEach-Object { $_.Line.Trim() }

# Step 5: Read each access profile's approval scheme
$ap = Get-Content sailpoint/access-profiles.json -Raw | ConvertFrom-Json
$ap.accessProfiles | ForEach-Object { [pscustomobject]@{ Profile = $_.name; Approvers = ($_.accessRequestConfig.approvalSchemes | ForEach-Object approverType) -join ' then ' } } | Format-Table -AutoSize | Out-String -Width 200
$ap.pipelineApiClient | Format-List

# Step 6: Read the fixture queue as SailPoint would report it
$rq = Get-Content tests/fixtures/requests.json -Raw | ConvertFrom-Json -AsHashtable
$rq.isc.Keys | Sort-Object | ForEach-Object { [pscustomobject]@{ Request = $_; State = $rq.isc[$_][0].state; Approvals = (@($rq.isc[$_][0].approvalDetails) | ForEach-Object { $_.status }) -join ', ' } } | Format-Table -AutoSize | Out-String -Width 200

# Step 7: Run this chapter's test
Invoke-Pester -Path tests -FullNameFilter '*templates parse*' -Output None -PassThru | Select-Object PassedCount, FailedCount
```

:::

<!-- labs:end -->

1. **Read the four catalog items as the pipeline reads them:**

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   $cfg = Get-HtConfig request-items
   $cfg.items.Keys | Sort-Object | ForEach-Object { [pscustomobject]@{ Item = $_; Task = $cfg.items[$_].task; Variables = $cfg.items[$_].variables -join ', '; Verification = $cfg.items[$_].verification } } | Format-Table -AutoSize | Out-String -Width 200
   ```

   <!-- capture:begin 04-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/04-1.txt))](captures/04-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force and what it printed"}

   <!-- capture:end -->

   Only the two resets need verification.

2. **Check the ServiceNow template against it.** The same four names, and no variable called `command`:

   ```powershell
   $ci = Get-Content servicenow/catalog-items.json -Raw | ConvertFrom-Json
   'Items in both: ' + @(Compare-Object ($ci.items.name | Sort-Object) ($cfg.items.Keys | Sort-Object) -IncludeEqual -ExcludeDifferent).Count
   'Variables named command: ' + @($ci.items.variables.name | Where-Object { $_ -eq 'command' }).Count
   ```

   <!-- capture:begin 04-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/04-2.txt))](captures/04-2.png){.lightbox fig-alt="Terminal window showing $ci = Get-Content servicenow/catalog-items.json -Raw | ConvertFrom-Json and what it printed"}

   <!-- capture:end -->

3. **Read the fields the template adds to the requested item:**

   ```powershell
   $ci.requestedItemFields | Format-List name, type, writtenBy
   ```

   <!-- capture:begin 04-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/04-3.txt))](captures/04-3.png){.lightbox fig-alt="Terminal window showing $ci.requestedItemFields | Format-List name, type, writtenBy and what it printed"}

   <!-- capture:end -->

4. **Read where the hand-off sets the state:**

   ```powershell
   Select-String -Path servicenow/business-rule-hand-off-to-access-management.js -Pattern 'u_automation_state = ' | ForEach-Object { $_.Line.Trim() }
   ```

   <!-- capture:begin 04-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/04-4.txt))](captures/04-4.png){.lightbox fig-alt="Terminal window showing Select-String -Path servicenow/business-rule-hand-off-to-access-management.js… and what it printed"}

   <!-- capture:end -->

   `awaiting-approval` for a reset with no verification, `failed` for a refused hand-off, and `ready` once SailPoint has the request.

5. **Read each access profile's approval scheme:**

   ```powershell
   $ap = Get-Content sailpoint/access-profiles.json -Raw | ConvertFrom-Json
   $ap.accessProfiles | ForEach-Object { [pscustomobject]@{ Profile = $_.name; Approvers = ($_.accessRequestConfig.approvalSchemes | ForEach-Object approverType) -join ' then ' } } | Format-Table -AutoSize | Out-String -Width 200
   $ap.pipelineApiClient | Format-List
   ```

   <!-- capture:begin 04-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/04-5.txt))](captures/04-5.png){.lightbox fig-alt="Terminal window showing $ap = Get-Content sailpoint/access-profiles.json -Raw | ConvertFrom-Json and what it printed"}

   <!-- capture:end -->

   Every profile but the password reset has two steps; the pipeline's client reads status and nothing else, and the note says which token it falls back to.

6. **Read the fixture queue as SailPoint would report it.** One state and the approvals' statuses for each access request:

   ```powershell
   $rq = Get-Content tests/fixtures/requests.json -Raw | ConvertFrom-Json -AsHashtable
   $rq.isc.Keys | Sort-Object | ForEach-Object { [pscustomobject]@{ Request = $_; State = $rq.isc[$_][0].state; Approvals = (@($rq.isc[$_][0].approvalDetails) | ForEach-Object { $_.status }) -join ', ' } } | Format-Table -AutoSize | Out-String -Width 200
   ```

   <!-- capture:begin 04-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/04-6.txt))](captures/04-6.png){.lightbox fig-alt="Terminal window showing $rq = Get-Content tests/fixtures/requests.json -Raw | ConvertFrom-Json -AsHas… and what it printed"}

   <!-- capture:end -->

   `AR-7` was rejected, and one request still has an approval `PENDING`; [Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md) shows what the pipeline does with each.

7. **Run this chapter's test:**

   ```powershell
   Invoke-Pester -Path tests -FullNameFilter '*templates parse*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 04-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/04-7.txt))](captures/04-7.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests -FullNameFilter '*templates parse*' -Output None -P… and what it printed"}

   <!-- capture:end -->

**Expected result:** `PassedCount` 1 and `FailedCount` 0. Lab 1 writes no files.

## Lab 2: a SailPoint sandbox and a ServiceNow developer instance

Use a SailPoint Identity Security Cloud sandbox tenant and a ServiceNow Personal Developer Instance, never production. Before you start, a ServiceNow administrator builds the four catalog items and the five fields on the developer instance from `servicenow/catalog-items.json`, and an identity governance engineer creates, in the sandbox, the source, entitlements, governance groups and owner the access profiles name. Work in `examples/help-desk-automation`, in PowerShell 7.1 or later. You'll replace: `<tenant>` (the sandbox tenant's name), `<pat-client-id>` and `<pat-client-secret>` (a personal access token for a sandbox user with the `ORG_ADMIN` user level, made as [*Building Ticket-to-Machine*, Chapter 03, Lab 2](../ticket-to-machine/03-sailpoint-client-and-scopes.md#lab-2-a-sailpoint-sandbox-tenant) describes), `<instance>` (the developer instance), `<admin-user>` and `<admin-password>` (its administrator, on the developer instance only), and `<profiles-file>` (your copy of `sailpoint/access-profiles.json` with every `<placeholder>` replaced by a sandbox id). The authors haven't run this lab.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: Get a SailPoint token
$isc = 'https://<tenant>.api.identitynow.com'
$tok = (Invoke-RestMethod -Method POST -Uri "$isc/oauth/token" -ContentType 'application/x-www-form-urlencoded' -Body @{ grant_type = 'client_credentials'; client_id = '<pat-client-id>'; client_secret = '<pat-client-secret>' }).access_token
$h = @{ Authorization = "Bearer $tok"; Accept = 'application/json' }

# Step 2: Create the four access profiles from your copy, and keep their ids
$made = foreach ($p in (Get-Content '<profiles-file>' -Raw | ConvertFrom-Json).accessProfiles) {
    Invoke-RestMethod -Method POST -Uri "$isc/v3/access-profiles" -Headers $h -ContentType 'application/json' -Body ($p | ConvertTo-Json -Depth 8)
}
$made | Format-Table id, name -AutoSize | Out-String -Width 200

# Step 3: Read them back, and compare each approval scheme with the template
foreach ($m in $made) { $r = Invoke-RestMethod -Uri "$isc/v3/access-profiles/$($m.id)" -Headers $h; '{0}: {1}' -f $r.name, (($r.accessRequestConfig.approvalSchemes | ForEach-Object approverType) -join ' then ') }

# Step 4: Check the developer instance's catalog items and their variables against the template
$sn = 'https://<instance>.service-now.com/api/now/table'
$cred = [pscredential]::new('<admin-user>', (ConvertTo-SecureString '<admin-password>' -AsPlainText -Force))
$names = (Get-HtConfig request-items).items.Keys -join ','
(Invoke-RestMethod -Uri "$sn/item_option_new?sysparm_query=cat_item.nameIN$names&sysparm_fields=name,cat_item.name" -Credential $cred -Authentication Basic -Headers @{ Accept = 'application/json' }).result | Sort-Object 'cat_item.name', name | Format-Table 'cat_item.name', name -AutoSize | Out-String -Width 200

# Step 5: Back out
foreach ($m in $made) { Invoke-RestMethod -Method DELETE -Uri "$isc/v3/access-profiles/$($m.id)" -Headers $h | Out-Null; "deleted $($m.name)" }
foreach ($m in $made) { try { Invoke-RestMethod -Uri "$isc/v3/access-profiles/$($m.id)" -Headers $h | Out-Null; "$($m.name) still exists" } catch { "$($m.name): $($_.Exception.Response.StatusCode)" } }
Remove-Variable tok, h, cred
```

:::

<!-- labs:end -->

1. **Get a SailPoint token:**

   ```powershell
   $isc = 'https://<tenant>.api.identitynow.com'
   $tok = (Invoke-RestMethod -Method POST -Uri "$isc/oauth/token" -ContentType 'application/x-www-form-urlencoded' -Body @{ grant_type = 'client_credentials'; client_id = '<pat-client-id>'; client_secret = '<pat-client-secret>' }).access_token
   $h = @{ Authorization = "Bearer $tok"; Accept = 'application/json' }
   ```

2. **Create the four access profiles from your copy, and keep their ids:**

   ```powershell
   $made = foreach ($p in (Get-Content '<profiles-file>' -Raw | ConvertFrom-Json).accessProfiles) {
       Invoke-RestMethod -Method POST -Uri "$isc/v3/access-profiles" -Headers $h -ContentType 'application/json' -Body ($p | ConvertTo-Json -Depth 8)
   }
   $made | Format-Table id, name -AutoSize | Out-String -Width 200
   ```

3. **Read them back, and compare each approval scheme with the template:**

   ```powershell
   foreach ($m in $made) { $r = Invoke-RestMethod -Uri "$isc/v3/access-profiles/$($m.id)" -Headers $h; '{0}: {1}' -f $r.name, (($r.accessRequestConfig.approvalSchemes | ForEach-Object approverType) -join ' then ') }
   ```

   The same schemes as Lab 1, step 5.

4. **Check the developer instance's catalog items and their variables against the template:**

   ```powershell
   $sn = 'https://<instance>.service-now.com/api/now/table'
   $cred = [pscredential]::new('<admin-user>', (ConvertTo-SecureString '<admin-password>' -AsPlainText -Force))
   $names = (Get-HtConfig request-items).items.Keys -join ','
   (Invoke-RestMethod -Uri "$sn/item_option_new?sysparm_query=cat_item.nameIN$names&sysparm_fields=name,cat_item.name" -Credential $cred -Authentication Basic -Headers @{ Accept = 'application/json' }).result | Sort-Object 'cat_item.name', name | Format-Table 'cat_item.name', name -AutoSize | Out-String -Width 200
   ```

   Each item's variables are exactly Lab 1, step 1's, and none is a command.

5. **Back out.** Delete the four access profiles and check they're gone:

   ```powershell
   foreach ($m in $made) { Invoke-RestMethod -Method DELETE -Uri "$isc/v3/access-profiles/$($m.id)" -Headers $h | Out-Null; "deleted $($m.name)" }
   foreach ($m in $made) { try { Invoke-RestMethod -Uri "$isc/v3/access-profiles/$($m.id)" -Headers $h | Out-Null; "$($m.name) still exists" } catch { "$($m.name): $($_.Exception.Response.StatusCode)" } }
   Remove-Variable tok, h, cred
   ```

   Expected: each is `NotFound`. The developer instance's items stay, for [Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md#lab-2-a-test-tenant-instance-and-sandbox); reset the instance when you're finished with both.

## Verified facts

| Item | Value | Source |
|---|---|---|
| Approval schemes | `accessRequestConfig.approvalSchemes`, `approverType` from nine values, `approverId` for a governance group, workflow or additional governance group | [^ht04-scheme] |
| Access profiles | `POST /v3/access-profiles` (`idn:access-profile:manage` and read scopes), `GET` and `DELETE /v3/access-profiles/{id}`; user levels | [^ht04-profiles] |
| Access request status | `GET /v3/access-request-status`, filter `accessRequestId`; `idn:access-request-status:read`; `ORG_ADMIN` | [^ht04-status] |
| ServiceNow Table and Attachment APIs, OAuth | Verified in *Building Ticket-to-Machine*, Chapter 02 | [^ht04-table] |

Not yet specified: the ServiceNow field type the template calls `password2` and the `gs.minutesAgo` call the clearing job uses (no ServiceNow page was read for them in this chapter); the table names `sc_cat_item` and `item_option_new` that Lab 2, step 4 reads; how the agency's system access management tool submits the request to SailPoint and returns its id, which is the tool's own interface.

## Federal requirements and evidence

This chapter builds the front door; its evidence is the configuration that the pipeline's evidence in [Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md) depends on. The controls and KSIs are those `config/requirements.json` gives the four tasks.[^ht04-oscal] [^ht04-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| A request can carry only typed variables, never a command (Lab 1, steps 1 and 2; Lab 2, step 4) | AC-2; AC-6; CM-3 | KSI-CMT-LMC | The ServiceNow administrator; the ISSO keeps the item definitions |
| Each task is approved in SailPoint by its own scheme, two approvers for an authenticator reset (Lab 1, step 5; Lab 2, steps 2 and 3) | AC-2; IA-5; IA-12 | KSI-IAM-JIT | The identity governance engineer |
| A reset waits for the agent's recorded verification (Lab 1, steps 3 and 4) | IA-5; IA-12 | KSI-IAM-JIT; KSI-IAM-SUS | The service desk lead |
| A cloud account is created only from a named profile and an allowed usage location (Lab 1, step 1) | AC-2; AC-6; IA-5 | KSI-IAM-AAM | The identity governance engineer |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The mapping is the program's *(design guidance)*. The configuration supports these controls; the assessor decides them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Someone adds a free-text field to an item | A command arrives in a variable | The pipeline refuses any variable `config/request-items.json` doesn't declare (HT-RQ-05), and the template test fails on `command` |
| ServiceNow marks a request approved | A ticket field stands in for an approval | The pipeline re-reads SailPoint by the access request id, never a ServiceNow field (Chapter 05; WD-174) |
| The requester records their own verification | Self-verification for a reset | The ACL keeps verification with agents, and the pipeline refuses it (HT-RQ-01) |
| One access profile for every task | A password reset approves an authenticator reset | One profile per task, with its own scheme |
| A field renamed in ServiceNow only | The pipeline reads an empty field and refuses every item | `config/request-items.json` names every field, and changes with the instance |

## Checklist

- [ ] The four catalog items exist with exactly the template's variables, and none is free text beyond the typed change's value, which its change's pattern checks.
- [ ] Only the hand-off writes `u_isc_access_request_id`; only agents write the verification fields; only the pipeline writes the secret field.
- [ ] Each access profile is requestable, with the scheme the governance office approved, and grants nothing standing.
- [ ] The pipeline's SailPoint client, or the dedicated identity's personal access token if the test stage needed it (WD-184), holds `idn:access-request-status:read` and nothing else.
- [ ] `config/request-items.json` matches the instance's names.

::: {.callout-tip}
## Continue the book
[← Chapter 03 — Scheduled Checks](03-scheduled-checks-sync-roles-and-logs.md) · [Workbook index](index.md) · [Next: Chapter 05 — The Request Pipeline and the One-Time Secret →](05-the-request-pipeline-and-the-one-time-secret.md)
:::

[^ht04-scheme]: SailPoint, Identity Security Cloud API specification v3, schemas `access/Requestability.yaml` (`approvalSchemes`) and `access/AccessProfileApprovalScheme.yaml` (`approverType`, `approverId`), <https://github.com/sailpoint-oss/api-specs/tree/main/idn/v3/schemas/access> (read November 27, 2026).
[^ht04-profiles]: SailPoint, Identity Security Cloud API specification v3, paths `access-profiles.yaml` (`listAccessProfiles`, `createAccessProfile`) and `access-profile.yaml` (`getAccessProfile`, `deleteAccessProfile`), with their scopes and user levels, <https://github.com/sailpoint-oss/api-specs/tree/main/idn/v3/paths> (read November 27, 2026).
[^ht04-status]: SailPoint, Identity Security Cloud API specification v3, `listAccessRequestStatus` (`paths/access-request-status.yaml`: scope `idn:access-request-status:read`, user level `ORG_ADMIN`, filter `accessRequestId`), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/access-request-status.yaml> (read November 27, 2026).
[^ht04-table]: ServiceNow, "Table API," <https://www.servicenow.com/docs/bundle/zurich-api-reference/page/integrate/inbound-rest/concept/c_TableAPI.html>; "Attachment API," <https://www.servicenow.com/docs/r/MVRCUFVyKWd7vUoUukbW6g/lfpHTMPdNaq_xdajhuTwEg>; "Client credentials grant workflow," <https://www.servicenow.com/docs/r/oJu9n0q6rU~F9UHAnNCt5w/nEdqo82hKBPEeGDqhx~hqw> (read November 1, 2026; carried from *Building Ticket-to-Machine*, Chapter 02).
[^ht04-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht04-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
