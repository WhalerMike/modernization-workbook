---
title: "Chapter 01 — The Typed Change"
description: "Book 15, Chapter 12's fifth task as code: a request names a change from a fixed list, a user and a value, and nothing else; the kit checks it (HT-01 to HT-06), reads the user, writes a plan with the value before and after, and prints the plan's SHA-256 for an approver; the change applies only with that hash, only if the value hasn't moved since (HT-07 and HT-08), with one PATCH, a re-read and evidence. Microsoft Learn's Update user page and what it leaves to the help desk. Labs on fixtures and in a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-help-desk-automation
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-27
review-status: pending
---
# Chapter 01 — The Typed Change

*If the requester writes the command, the requester is the author. The typed change makes the kit the author, and the request only a choice from a list.*

::: {.callout-note}
## In this chapter
[Book 15, Chapter 12, task 5](../../../books/b15-day2-operations/12-the-day-two-runbook.md#running-a-script-for-a-requester) says "parameters travel; commands don't." This chapter builds it for a change to one user. You start with what Microsoft Learn's *Update user* page gives you and what it leaves out, then read the kit's list of typed changes (`config/typed-changes.json`), its eight checks (HT-01 to HT-08) and the two functions that plan a change and apply it only with the approved plan's SHA-256. Lab 1 plans a change on the fixtures, watches the checks refuse four bad requests, applies the plan, and shows that a wrong hash, an edited plan and a value someone changed since are all refused. Lab 2 does the same to one cloud-only test user in a test tenant, under a role activated through Privileged Identity Management, and puts the value back.
:::

## Goal and audience

**Goal.** By the end of this chapter you can take a request that asks for a change to a user and turn it into a plan a second person approves by its hash, applied with one call that changes exactly what the plan says, or refused with a rule number.

**Audience.** Developers who maintain the kit, the service desk lead who owns the catalog of typed changes, and the ISSO who keeps the evidence. You should read PowerShell 7. You don't need a tenant until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Learn's *Update user* page documents `PATCH /users/{id | userPrincipalName}`. Its least-privileged permission, delegated and application, is `User.ReadUpdate.All`; `User.ReadWrite.All` and `Directory.ReadWrite.All` are higher.[^ht01-update] The page warns that "for synced users, the ability to update certain properties is additionally determined by the source of authority and whether synchronization is enabled," and says of `onPremisesExtensionAttributes` that for an `onPremisesSyncEnabled` user "the source of authority for this set of properties is the on-premises and is read-only."[^ht01-update] Reading a user, to see its current value and whether it is synchronized, is *Get user*, with `User.Read.All` as the least-privileged application permission.[^ht01-get] Microsoft 365 GCC uses the worldwide Graph endpoint, `graph.microsoft.com`.[^ht01-deployments]

### What it leaves to you

Each row is pinned by a test in `tests/HelpDeskAutomation.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Any property in the request body | A request that can name any property can change anything `User.ReadUpdate.All` allows | A fixed list of typed changes, each with one property and its allowed values or pattern; anything else is HT-01 or HT-03 |
| A synchronized user's properties are governed by the source of authority | A cloud-side change to a synchronized user is overwritten, or refused, and the real record is never fixed | HT-02 refuses every change to a user with `onPremisesSyncEnabled`: the change belongs in the on-premises directory or the HR record |
| No notion of who asked, or why | Nothing ties the change to a ticket | HT-06 refuses a request id that isn't a ticket number; the plan and evidence carry it |
| A `204 No Content` on success | Nothing says what the value was before, or that it took | The plan records `before` and `after`; the apply re-reads the user and records `verified` |
| No approval step | Whoever holds the permission changes the user | The plan's SHA-256 is what an approver approves; `Invoke-HtTypedChange` refuses any other hash (HT-08), and refuses if the value moved since the plan (HT-07) |
| A disabled account can be updated | A request for a disabled account may be an attacker's | HT-04 refuses a disabled or missing user: it goes to the security office |

**The verdict.** Keep Learn's call and its least privilege as they are. Build the list, the checks, the plan, the hash and the re-read, because Learn leaves them to the caller.

## The code

### The list of typed changes

[`config/typed-changes.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/config/typed-changes.json) holds five fictional changes: the department, job title and office location (each a pattern), the employee type (a list) and a records flag kept in `extensionAttribute10` (a list whose empty value clears it). A ServiceNow catalog item offers exactly these ids ([Chapter 04](04-requests-in-servicenow-and-sailpoint.md)). The agency's copy is written at work, from the kit's [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/copilot-prompts.md), and stays there.

### The plan

`New-HtTypedChangePlan -RequestId -User -ChangeId -Value -OutputPath` checks the request, reads the user through the declared call `user-get`, and writes `<RequestId>/findings.json`. With no findings it writes `plan.json` (the request, the user's id, the property, `before`, `after`, the time in UTC, and the controls and KSIs from `config/requirements.json`) and `plan.sha256`, and returns `Ready`, `PlanPath` and `PlanSha256`. It changes nothing.

| Check | What it refuses |
|---|---|
| HT-01 | A change that isn't in `config/typed-changes.json` |
| HT-02 | A user synchronized from on-premises |
| HT-03 | A value the change doesn't accept |
| HT-04 | A user who is disabled or doesn't exist |
| HT-05 | Nothing to change: the user already has the value |
| HT-06 | A request id that isn't a ticket number |

`Get-HtSha256` hashes a file with LF line endings, so a hash approved on one machine matches on another.

### The apply

`Invoke-HtTypedChange -PlanPath -ApprovedPlanSha256 -OutputPath` refuses a plan whose SHA-256 isn't the approved one, or that was edited (HT-08), and a change the list no longer allows (HT-01). It re-reads the user and refuses if the value is no longer the plan's `before` (HT-07) or the user is now synchronized (HT-02). Without `-Apply` it writes a dry run's evidence. With `-Apply` it sends one `PATCH` through the declared call `user-update`, re-reads the user, and writes `evidence.json` with the plan's hash, the value before, requested and after, `verified`, the body it sent, and the controls and KSIs.

### Declared calls only

Every call the module makes goes through `Invoke-HtGraph`, which refuses a call `config/calls.json` doesn't declare for the task. `Get-HtRequiredPermission` reads the same file, and the [Permissions by Run](../../../reference/permissions-by-run.md#help-desk-automation) page is built from it.

### The tests

Pester 5 under PowerShell 7: the `Typed change: planning`, `Typed change: applying` and `Declared calls only` blocks of `tests/HelpDeskAutomation.Tests.ps1`. Writing this chapter turned up two faults in the kit, fixed in the same change with a test each: a relative output path was written under the process's starting folder instead of the PowerShell location, and the plan's time was the machine's local time labeled as UTC.

::: {.callout-important}
## Illustrative code
Lab 1 reads a fictional tenant from `tests/fixtures`; nothing signs in and nothing leaves the machine. The kit has been tested against its fixtures, not against a live tenant. Review the code, and run Lab 2 in a test tenant, before it changes a real user.
:::

## Lab 1: fixtures, no tenant

Work in `examples/help-desk-automation`, in PowerShell 7.1 or later, with Pester 5. The fixtures are a fictional tenant: five users in `tests/fixtures/users.json`, among them `avery.lane@contoso.example` (cloud-only, enabled), `blake.ortiz` (synchronized from on-premises), `casey.diaz` (disabled) and `devon.park` (who already has the records flag).

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what a typed change needs
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
'typed-change-plan', 'typed-change-apply' | ForEach-Object { Get-HtRequiredPermission -Task $_ } | Format-List

# Step 2: Read the typed changes
(Get-HtConfig typed-changes).changes | ForEach-Object { [pscustomobject]$_ } | Format-Table id, property, extension, allowed, pattern -AutoSize | Out-String -Width 200

# Step 3: Plan one change
$p = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z
$p | Format-List

# Step 4: Read the plan and its hash
Get-Content out/plan/REQ-2026-0501/plan.json
Get-Content out/plan/REQ-2026-0501/plan.sha256

# Step 5: Plan three requests the checks refuse
New-HtTypedChangePlan -RequestId REQ-2026-0502 -User blake.ortiz@contoso.example -ChangeId set-department -Value Audit -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
New-HtTypedChangePlan -RequestId 'please run this' -User casey.diaz@contoso.example -ChangeId set-employee-type -Value Vendor -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
New-HtTypedChangePlan -RequestId REQ-2026-0503 -User devon.park@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List

# Step 6: Dry-run the plan with its approved hash
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/dry -FixturePath tests/fixtures -AsOf 2026-11-27T12:05:00Z | Format-List

# Step 7: Try a hash that isn't the approved one
try { Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 ('0' * 64) -OutputPath out/apply -FixturePath tests/fixtures -Apply } catch { $_.Exception.Message }

# Step 8: Try an edited plan with the approved hash
(Get-Content out/plan/REQ-2026-0501/plan.json -Raw) -replace '"after": "RetainAll"', '"after": ""' | Set-Content out/plan/REQ-2026-0501/edited.json -NoNewline
try { Invoke-HtTypedChange -PlanPath out/plan/REQ-2026-0501/edited.json -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath tests/fixtures -Apply } catch { $_.Exception.Message }

# Step 9: Try the plan after someone else changed the value
Copy-Item -Recurse tests/fixtures out/changed
(Get-Content out/changed/users.json -Raw) -replace '"extensionAttribute10": null', '"extensionAttribute10": "Hold"' | Set-Content out/changed/users.json -NoNewline
try { Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath out/changed -Apply } catch { $_.Exception.Message }

# Step 10: Apply the plan
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath tests/fixtures -Apply -AsOf 2026-11-27T12:05:00Z | Format-List
Get-Content out/apply/REQ-2026-0501/evidence.json

# Step 11: Run this chapter's tests
Invoke-Pester -Path tests -FullNameFilter 'Typed change*', 'Declared calls only*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what a typed change needs.** The plan reads; the apply writes:

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   'typed-change-plan', 'typed-change-apply' | ForEach-Object { Get-HtRequiredPermission -Task $_ } | Format-List
   ```

   <!-- capture:begin 01-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-1.txt))](captures/01-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force and what it printed"}

   <!-- capture:end -->

   `typed-change-plan` needs `User.Read.All` and nothing that writes; `typed-change-apply` adds `User.ReadUpdate.All`.

2. **Read the typed changes.** These are the only changes a request can name:

   ```powershell
   (Get-HtConfig typed-changes).changes | ForEach-Object { [pscustomobject]$_ } | Format-Table id, property, extension, allowed, pattern -AutoSize | Out-String -Width 200
   ```

   <!-- capture:begin 01-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-2.txt))](captures/01-2.png){.lightbox fig-alt="Terminal window showing (Get-HtConfig typed-changes).changes | ForEach-Object { [pscustomobject]$_ } … and what it printed"}

   <!-- capture:end -->

3. **Plan one change.** A request asks for the records flag on Avery Lane:

   ```powershell
   $p = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z
   $p | Format-List
   ```

   <!-- capture:begin 01-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-3.txt))](captures/01-3.png){.lightbox fig-alt="Terminal window showing $p = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.… and what it printed"}

   <!-- capture:end -->

   `Ready` is `True`, and `PlanSha256` is the hash the approver approves.

4. **Read the plan and its hash.** Look at `before` (empty) and `after`, and at the controls and KSIs the change's evidence supports:

   ```powershell
   Get-Content out/plan/REQ-2026-0501/plan.json
   Get-Content out/plan/REQ-2026-0501/plan.sha256
   ```

   <!-- capture:begin 01-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-4.txt))](captures/01-4.png){.lightbox fig-alt="Terminal window showing Get-Content out/plan/REQ-2026-0501/plan.json and what it printed"}

   <!-- capture:end -->

5. **Plan three requests the checks refuse.** A synchronized user; a request id that isn't a ticket, for a disabled user, with a value the change doesn't accept; and a user who already has the value:

   ```powershell
   New-HtTypedChangePlan -RequestId REQ-2026-0502 -User blake.ortiz@contoso.example -ChangeId set-department -Value Audit -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
   New-HtTypedChangePlan -RequestId 'please run this' -User casey.diaz@contoso.example -ChangeId set-employee-type -Value Vendor -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
   New-HtTypedChangePlan -RequestId REQ-2026-0503 -User devon.park@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
   ```

   <!-- capture:begin 01-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-5.txt))](captures/01-5.png){.lightbox fig-alt="Terminal window showing New-HtTypedChangePlan -RequestId REQ-2026-0502 -User blake.ortiz@contoso.exam… and what it printed"}

   <!-- capture:end -->

   Each prints its rule as a warning (HT-02; HT-06, HT-04 and HT-03 together; HT-05) and returns `Ready` `False` with no plan.

6. **Dry-run the plan with its approved hash.** Nothing changes, and the evidence says so:

   ```powershell
   Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/dry -FixturePath tests/fixtures -AsOf 2026-11-27T12:05:00Z | Format-List
   ```

   <!-- capture:begin 01-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-6.txt))](captures/01-6.png){.lightbox fig-alt="Terminal window showing Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 … and what it printed"}

   <!-- capture:end -->

   `Mode` is `dry-run` and `Verified` is `False`.

7. **Try a hash that isn't the approved one:**

   ```powershell
   try { Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 ('0' * 64) -OutputPath out/apply -FixturePath tests/fixtures -Apply } catch { $_.Exception.Message }
   ```

   <!-- capture:begin 01-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-7.txt))](captures/01-7.png){.lightbox fig-alt="Terminal window showing try { Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 ('0' * 6… and what it printed"}

   <!-- capture:end -->

   HT-08, and `Nothing was changed.`

8. **Try an edited plan with the approved hash.** Someone empties the plan's `after` after approval:

   ```powershell
   (Get-Content out/plan/REQ-2026-0501/plan.json -Raw) -replace '"after": "RetainAll"', '"after": ""' | Set-Content out/plan/REQ-2026-0501/edited.json -NoNewline
   try { Invoke-HtTypedChange -PlanPath out/plan/REQ-2026-0501/edited.json -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath tests/fixtures -Apply } catch { $_.Exception.Message }
   ```

   <!-- capture:begin 01-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-8.txt))](captures/01-8.png){.lightbox fig-alt="Terminal window showing (Get-Content out/plan/REQ-2026-0501/plan.json -Raw) -replace ''after': 'Retai… and what it printed"}

   <!-- capture:end -->

   HT-08 again: the edited file has a different hash.

9. **Try the plan after someone else changed the value.** A copy of the fixtures where the flag is already `Hold`:

   ```powershell
   Copy-Item -Recurse tests/fixtures out/changed
   (Get-Content out/changed/users.json -Raw) -replace '"extensionAttribute10": null', '"extensionAttribute10": "Hold"' | Set-Content out/changed/users.json -NoNewline
   try { Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath out/changed -Apply } catch { $_.Exception.Message }
   ```

   <!-- capture:begin 01-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-9.txt))](captures/01-9.png){.lightbox fig-alt="Terminal window showing Copy-Item -Recurse tests/fixtures out/changed and what it printed"}

   <!-- capture:end -->

   HT-07: the value is now `Hold`, not the plan's empty `before`. Plan again.

10. **Apply the plan.** In fixture mode the change goes to the fixture store in memory, and the re-read sees it:

    ```powershell
    Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath tests/fixtures -Apply -AsOf 2026-11-27T12:05:00Z | Format-List
    Get-Content out/apply/REQ-2026-0501/evidence.json
    ```

    <!-- capture:begin 01-10 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

    ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-10.txt))](captures/01-10.png){.lightbox fig-alt="Terminal window showing Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 … and what it printed"}

    <!-- capture:end -->

    `Mode` `apply`, `After` `RetainAll`, `Verified` `True`; the evidence holds the plan's SHA-256 and the body that was sent.

11. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests -FullNameFilter 'Typed change*', 'Declared calls only*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    <!-- capture:begin 01-11 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

    ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-11.txt))](captures/01-11.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests -FullNameFilter 'Typed change*', 'Declared calls on… and what it printed"}

    <!-- capture:end -->

**Expected result:** `PassedCount` 17 and `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 01-12 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/01-12.txt))](captures/01-12.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a Microsoft Entra test tenant, never production, with one cloud-only test user you created for this lab. Work in `examples/help-desk-automation`, in PowerShell 7.1 or later with the Microsoft Graph PowerShell SDK. You need two people: the operator, who is eligible for User Administrator in Privileged Identity Management, and an approver who isn't the operator. You'll replace: `<tenant-id>` (the test tenant), `<test-user-upn>` (the test user), `<new-department>` (a department value that matches the change's pattern), `<old-department>` (the value step 2 shows) and `<approved-sha256>` (the plan's SHA-256 as the approver confirmed it). The authors haven't run this lab.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in to read, as the operator
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes (Get-HtRequiredPermission -Task typed-change-plan).GraphPermissions -NoWelcome

# Step 2: Plan the change, and read the value before
$p = New-HtTypedChangePlan -RequestId REQ-2026-0601 -User <test-user-upn> -ChangeId set-department -Value '<new-department>' -OutputPath out/plan-test
$p | Format-List
Get-Content out/plan-test/REQ-2026-0601/plan.json

# Step 3: The approver checks the hash
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
Get-HtSha256 out/plan-test/REQ-2026-0601/plan.json

# Step 4: Activate User Administrator for one hour against the ticket
Disconnect-MgGraph
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'RoleAssignmentSchedule.ReadWrite.Directory', 'User.Read.All', 'User.ReadUpdate.All' -NoWelcome
$me = Invoke-MgGraphRequest -Method GET -Uri 'v1.0/me?$select=id'
New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest -BodyParameter @{
    action = 'selfActivate'; principalId = $me.id; roleDefinitionId = 'fe930be7-5e62-47db-91af-98c3a49a38b1'; directoryScopeId = '/'
    justification = 'REQ-2026-0601: typed change, lab'; ticketInfo = @{ ticketNumber = 'REQ-2026-0601'; ticketSystem = 'Lab' }
    scheduleInfo = @{ startDateTime = (Get-Date).ToUniversalTime(); expiration = @{ type = 'afterDuration'; duration = 'PT1H' } }
} | Format-List Id, Status

# Step 5: Dry-run, then apply with the approved hash
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 <approved-sha256> -OutputPath out/apply-test | Format-List
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 <approved-sha256> -OutputPath out/apply-test -Apply | Format-List
Get-Content out/apply-test/REQ-2026-0601/evidence.json

# Step 6: Back it out
$b = New-HtTypedChangePlan -RequestId REQ-2026-0602 -User <test-user-upn> -ChangeId set-department -Value '<old-department>' -OutputPath out/plan-test
Invoke-HtTypedChange -PlanPath $b.PlanPath -ApprovedPlanSha256 $b.PlanSha256 -OutputPath out/apply-test -Apply | Format-List
New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest -BodyParameter @{
    action = 'selfDeactivate'; principalId = $me.id; roleDefinitionId = 'fe930be7-5e62-47db-91af-98c3a49a38b1'; directoryScopeId = '/'
} | Format-List Id, Status
Disconnect-MgGraph
Remove-Item -Recurse -Force out/plan-test, out/apply-test
```

:::

<!-- labs:end -->

1. **Sign in to read, as the operator.** The plan needs only `User.Read.All`:

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes (Get-HtRequiredPermission -Task typed-change-plan).GraphPermissions -NoWelcome
   ```

2. **Plan the change, and read the value before.** Write down `before`; the back-out step puts it back:

   ```powershell
   $p = New-HtTypedChangePlan -RequestId REQ-2026-0601 -User <test-user-upn> -ChangeId set-department -Value '<new-department>' -OutputPath out/plan-test
   $p | Format-List
   Get-Content out/plan-test/REQ-2026-0601/plan.json
   ```

3. **The approver checks the hash,** on their own machine, from the plan file the operator attached to the test ticket:

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   Get-HtSha256 out/plan-test/REQ-2026-0601/plan.json
   ```

4. **Activate User Administrator for one hour against the ticket,** as the operator, in a session where you completed multifactor authentication.[^ht01-activate] `fe930be7-5e62-47db-91af-98c3a49a38b1` is User Administrator's template ID ([Book 04, Appendix B](../../../books/b04-access/appendix-b-pim-role-settings.md)):

   ```powershell
   Disconnect-MgGraph
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'RoleAssignmentSchedule.ReadWrite.Directory', 'User.Read.All', 'User.ReadUpdate.All' -NoWelcome
   $me = Invoke-MgGraphRequest -Method GET -Uri 'v1.0/me?$select=id'
   New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest -BodyParameter @{
       action = 'selfActivate'; principalId = $me.id; roleDefinitionId = 'fe930be7-5e62-47db-91af-98c3a49a38b1'; directoryScopeId = '/'
       justification = 'REQ-2026-0601: typed change, lab'; ticketInfo = @{ ticketNumber = 'REQ-2026-0601'; ticketSystem = 'Lab' }
       scheduleInfo = @{ startDateTime = (Get-Date).ToUniversalTime(); expiration = @{ type = 'afterDuration'; duration = 'PT1H' } }
   } | Format-List Id, Status
   ```

5. **Dry-run, then apply with the approved hash:**

   ```powershell
   Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 <approved-sha256> -OutputPath out/apply-test | Format-List
   Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 <approved-sha256> -OutputPath out/apply-test -Apply | Format-List
   Get-Content out/apply-test/REQ-2026-0601/evidence.json
   ```

   Expected: `Verified` `True`, and `after` the new department. Attach `plan.json` and `evidence.json` to the test ticket.

6. **Back it out.** Plan the reverse change with the value step 2 recorded, apply it with its own hash, check the user, and end the activation:

   ```powershell
   $b = New-HtTypedChangePlan -RequestId REQ-2026-0602 -User <test-user-upn> -ChangeId set-department -Value '<old-department>' -OutputPath out/plan-test
   Invoke-HtTypedChange -PlanPath $b.PlanPath -ApprovedPlanSha256 $b.PlanSha256 -OutputPath out/apply-test -Apply | Format-List
   New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest -BodyParameter @{
       action = 'selfDeactivate'; principalId = $me.id; roleDefinitionId = 'fe930be7-5e62-47db-91af-98c3a49a38b1'; directoryScopeId = '/'
   } | Format-List Id, Status
   Disconnect-MgGraph
   Remove-Item -Recurse -Force out/plan-test, out/apply-test
   ```

   In a test tenant the operator may approve the back-out's hash themselves; in production the back-out is its own approved request.

## Verified facts

| Item | Value | Source |
|---|---|---|
| Update user | `PATCH /users/{id \| userPrincipalName}`; least privileged `User.ReadUpdate.All` (delegated and application) | [^ht01-update] |
| Synchronized users | Source of authority and synchronization decide which properties can be updated; `onPremisesExtensionAttributes` is read-only for an `onPremisesSyncEnabled` user | [^ht01-update] |
| Get user | `User.Read.All` (application), least privileged | [^ht01-get] |
| GCC | Microsoft 365 GCC uses `graph.microsoft.com` | [^ht01-deployments] |
| Self-activation | `selfActivate` and `selfDeactivate` on `roleAssignmentScheduleRequests`; multifactor authentication for a self-activation | [^ht01-activate] |

Not yet specified: whether a delegated `User.ReadUpdate.All` caller with User Administrator can clear an extension attribute by sending `null` (the kit sends `null` for an empty value); Lab 2 uses the department, a plain string, for that reason.

## Federal requirements and evidence

Each row names the output that is the evidence. The controls and KSIs are the kit's [`config/requirements.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/config/requirements.json) for `typed-change-plan` and `typed-change-apply`, from Book 15, Chapter 12.[^ht01-oscal] [^ht01-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The request named a listed change, a real ticket and a value the change accepts, or it was refused with a rule (Lab 1, steps 3 and 5: `findings.json`) | AC-2; CM-3 | KSI-CMT-LMC | The service desk lead, with the ticket |
| The plan recorded the value before and after, and its SHA-256 was approved by someone other than the operator (Lab 1, step 4; Lab 2, steps 2 and 3: `plan.json`, `plan.sha256`) | AC-2; CM-3 | KSI-CMT-LMC | The change record holds the approved hash |
| The change ran only with that hash, under a role activated for the ticket, and the re-read confirmed it (Lab 1, steps 7 to 10; Lab 2, steps 4 and 5: `evidence.json`, the activation request) | AC-2; AC-6; CM-3 | KSI-CMT-LMC; KSI-IAM-JIT | The ISSO, with the ticket's attachments |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which indicator is the program's mapping *(design guidance)*. The kit's records support these controls; the agency's assessor decides them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A request carries a command or a property | The requester becomes the author of a change in the tenant | Only a change id from the list, a user and a value are accepted (HT-01, HT-03); the catalog item has no free-text command ([Chapter 04](04-requests-in-servicenow-and-sailpoint.md)) |
| A synchronized user is changed in the cloud | The change is lost or refused at the next cycle, and the real record stays wrong | HT-02, at plan and again at apply |
| The plan is changed after approval | The approved change isn't the one that runs | HT-08: the hash is of the file, with LF line endings |
| Someone else changed the value between plan and apply | The change overwrites their work | HT-07: the apply re-reads and compares with `before` |
| The operator holds User Administrator standing | Every typed change runs under standing rights | Lab 2 activates the role through PIM against the ticket; the pipeline of [Chapter 05](05-the-request-pipeline-and-the-one-time-secret.md) is the other approved path (WD-182) |
| A disabled account is changed on request | An attacker's request is served | HT-04 sends it to the security office |

## Checklist

- [ ] The agency's `typed-changes.json` lists only properties the help desk owns, each with a list or a pattern, and none written by HR or synchronization.
- [ ] The catalog item offers exactly those ids and has no free-text command field.
- [ ] The approver isn't the operator, and the approved hash is in the change record.
- [ ] The operator's User Administrator role is eligible, not active, outside a ticket.
- [ ] Every apply has `evidence.json` with `verified` `true` attached to its ticket.
- [ ] The back-out was rehearsed in the test tenant.

::: {.callout-tip}
## Continue the book
[Workbook index](index.md) · [Next: Chapter 02 — The Consent Request Review →](02-the-consent-request-review.md)
:::

[^ht01-update]: Microsoft Learn, "Update user" (permissions table; synced users and the source of authority; `onPremisesExtensionAttributes` read-only for an `onPremisesSyncEnabled` user), <https://learn.microsoft.com/graph/api/user-update?view=graph-rest-1.0> (read November 27, 2026).
[^ht01-get]: Microsoft Learn, "Get user," <https://learn.microsoft.com/graph/api/user-get?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht01-deployments]: Microsoft Learn, "National cloud deployments" (GCC continues using the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht01-activate]: Microsoft Learn, "Create roleAssignmentScheduleRequests," Example 2, a user activating their eligible role, and the multifactor authentication requirement, <https://learn.microsoft.com/graph/api/rbacapplication-post-roleassignmentschedulerequests?view=graph-rest-1.0> (read November 27, 2026; carried from *Building Privileged Access*, Chapter 08).
[^ht01-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht01-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
