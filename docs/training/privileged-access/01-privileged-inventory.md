---
title: "Module 1: Inventory every privileged assignment"
description: "Workbook Chapter 01 and the plan's Phase 0 (A0.1, A0.2, Gate 0): read every Microsoft Entra and Azure privileged assignment, active and eligible, direct or through a group, give each a tier, raise the findings a reviewer acts on, and write a manifest the ISSO can check. About 50 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 04"
series-order: 1
review-status: approved
reviewed-sha256: 27e043e8249e2b31467f8b481a0d9932faa3ff04a003a665dfa4505890bf1c85
last-reviewed: 2026-11-07
---
# Module 1: Inventory every privileged assignment {.unnumbered}

*Part of the [Privileged Access learning path](index.md). Plan Phase 0, tasks A0.1 and A0.2, Gate 0. Workbook [Chapter 01](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md). About 50 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.4/Training_PA_Module_1.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_PA_Module_1_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PA_Module_1_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-1/Training_PA_Module_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-1/Training_PA_Module_1_Narrated.vtt).

## Introduction (3 minutes)

You can't make privilege just-in-time until you can list it: who holds which role, at which scope, standing or eligible, directly or through a group, and in which tier. The admin center's list of active assignments isn't enough. Under PIM almost every human holder becomes eligible, so an active-only list shrinks as the project succeeds and stops being an inventory.

In this module you run Learn's own samples to see what they miss, then run the workbook's inventory: one read of every privileged assignment, a tier for every row, findings for standing privilege, and a manifest that says which calls produced the files.

**The federal requirement.** The inventory is the evidence for the plan's [Gate 0](../../project-plans/privileged-access.md#gates), "standing administrative privilege inventoried and classified by tier." It supports NIST SP 800-53 AC-2 (account management) and AC-6(5) (privileged accounts restricted to defined roles), and BOD 25-01's MS.AAD.7.4v1, no permanent active assignment to a highly privileged role, with the emergency access accounts as the exception. The full table, one row per lab step, is the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#federal-requirements-and-evidence).

| Requirement | KSI | Evidence |
|---|---|---|
| AC-2 and AC-6(5), every privileged assignment with a tier | KSI-IAM-JIT | `inventory.json` and `inventory.csv` |
| AC-6 and AC-6(5); MS.AAD.7.4v1, no standing Tier 0 or Tier 1 outside an owned exception | KSI-IAM-JIT, KSI-IAM-ELP | PA-INV-01 and PA-INV-07 in `findings.json` |
| AC-6, least privilege for the identity that reads | KSI-IAM-ELP | Five read permissions, and the reader's refusals of an undeclared call and an unknown cloud |
| AU-9, protection of audit information | KSI-MLA-OSM | `manifest.json`: every request and the SHA-256 of each file |
| CM-3(2), testing and validation of changes | KSI-CMT-VTD | The repository's test runs |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the four ways a role reaches a person, and why the inventory reads eligible as well as active assignments;
- explain what Learn's sample for listing role assignments leaves out;
- run the inventory and read its findings, PA-INV-01 to PA-INV-09;
- explain why the tier comes from the program, not from Microsoft;
- say what the reader refuses, and why.

## Prerequisites (1 minute)

- The path's [prerequisites](index.md#prerequisites) and [Lab 1 tools](index.md#what-you-need-for-the-labs).
- No tenant until Lab 2.

## Unit 1: What the inventory has to hold (8 minutes)

Read the chapter's [What the inventory has to hold](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#what-the-inventory-has-to-hold). Note three things:

- Learn names four kinds of assignment: permanent eligible, permanent active, time-bound eligible and time-bound active. It says to keep zero permanently active assignments, except the emergency access accounts.
- A role assigned to a role-assignable group reaches every member. The program assigns roles to `PRV-<tier>-<role>[-<scope>]` groups, never to a person ([Book 04, Chapter 04](../../books/b04-access/04-privileged-roles-and-tiers.md#how-a-role-reaches-a-person)).
- The tier comes from `config/tiers.json`, keyed by role template ID. A role that isn't in the file is reported as unclassified, never assumed safe. *Design guidance.*

Then read [What it leaves to you](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#what-it-leaves-to-you): the gap table between Learn's sample and the example. The most important row: the sample sees no eligible assignment.

## Unit 2: The reader, the rows and the findings (7 minutes)

Read three sections of the chapter:

- [The reader](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#the-reader): only declared calls, GET only, one host, every page. Note why the reader asks for `User.ReadBasic.All` as well as `GroupMember.ReadBasic.All`.
- [The rows](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#the-rows): one row per assignment, with its state and route.
- [The findings](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#the-findings): PA-INV-01 to PA-INV-09. Two thresholds are Learn's (fewer than five Global Administrators, at most three subscription Owners), and the floor of two Global Administrators is CISA's (MS.AAD.7.1v1); the rest are the program's.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#lab-1-fixtures-no-tenant). Work in `examples/privileged-access`, in one PowerShell 7 session.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/privileged-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run Learn's samples against the stand-ins
Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 01*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List the permissions the inventory needs
Import-Module ./powershell/PrivilegedAccess/PrivilegedAccess.psm1
(Get-PaRequiredPermission -Task inventory).GraphPermissions -join ', '

# Step 3: Run the inventory against the fictional tenant
./Invoke-PaInventory.ps1 -FixturePath tests/fixtures/tenant.json -OutputPath out/inventory `
    -AzureScope /subscriptions/11111111-1111-4111-8111-111111111111, /providers/Microsoft.Management/managementGroups/contoso-root, /subscriptions/22222222-2222-4222-8222-222222222222 `
    -ExceptionsPath tests/fixtures/inputs/exceptions.csv -ControlPlaneSubscriptionId 22222222-2222-4222-8222-222222222222

# Step 4: Read the findings
Get-Content out/inventory/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -eq 'Finding' | Format-Table Rule, Object

# Step 5: See the reader refuse
$r = New-PaReader -Cloud gcc -Task inventory -Invoke (New-PaFixtureInvoker -Path tests/fixtures/tenant.json).Invoke
Invoke-PaList -Reader $r -CallId ca-policies
Get-PaCloud GCCHigh

# Step 6: Run the tests, then delete out
Invoke-Pester -Path tests
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Run Learn's samples against the stand-ins:**

    ```powershell
    Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 01*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    ```text
    PassedCount FailedCount NotRunCount
    ----------- ----------- -----------
              9           0           7
    ```

    The seven not run are Chapter 02's. The second test shows that the fixture's eligible-only holders never appear in the sample's output.

2. **List the permissions the inventory needs:**

    ```powershell
    Import-Module ./powershell/PrivilegedAccess/PrivilegedAccess.psm1
    (Get-PaRequiredPermission -Task inventory).GraphPermissions -join ', '
    ```

    ```text
    GroupMember.ReadBasic.All, RoleAssignmentSchedule.Read.Directory, RoleEligibilitySchedule.Read.Directory, RoleManagement.Read.Directory, User.ReadBasic.All
    ```

    Nothing ends in `ReadWrite`.

3. **Run the inventory against the fictional tenant:**

    ```powershell
    ./Invoke-PaInventory.ps1 -FixturePath tests/fixtures/tenant.json -OutputPath out/inventory `
        -AzureScope /subscriptions/11111111-1111-4111-8111-111111111111, /providers/Microsoft.Management/managementGroups/contoso-root, /subscriptions/22222222-2222-4222-8222-222222222222 `
        -ExceptionsPath tests/fixtures/inputs/exceptions.csv -ControlPlaneSubscriptionId 22222222-2222-4222-8222-222222222222
    ```

    ```text
    Assignments: 30 rows (Azure T0=4, Azure T1=5, Azure T2=1, Entra T0=8, Entra T1=2, Entra T2=2, Entra Unclassified=1)
    Findings: 10 Finding, 7 Warn, 1 Info
    Written to out/inventory (manifest.json lists every request and file hash)
    ```

4. **Read the findings:**

    ```powershell
    Get-Content out/inventory/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -eq 'Finding' | Format-Table Rule, Object
    ```

    ```text
    Rule      Object
    ----      ------
    PA-INV-01 alex.kim@contoso.example
    PA-INV-01 Contoso-Mail-Automation
    PA-INV-01 a0000000-0000-4000-8000-000000000007
    PA-INV-01 a0000000-0000-4000-8000-000000000014
    PA-INV-01 a0000000-0000-4000-8000-000000000010
    PA-INV-01 a0000000-0000-4000-8000-000000000001
    PA-INV-07 a0000000-0000-4000-8000-000000000001
    PA-INV-01 5e000000-0000-4000-8000-000000000002
    PA-INV-04 Global Administrator
    PA-INV-08 /subscriptions/11111111-1111-4111-8111-111111111111
    ```

    Azure rows show object IDs, because Resource Manager returns IDs, not names. The emergency account `ea01` isn't here: it's Info, because the exceptions list names it with an owner. The chapter's step 4 explains each row.

5. **See the reader refuse:**

    ```powershell
    $r = New-PaReader -Cloud gcc -Task inventory -Invoke (New-PaFixtureInvoker -Path tests/fixtures/tenant.json).Invoke
    Invoke-PaList -Reader $r -CallId ca-policies
    Get-PaCloud GCCHigh
    ```

    ```text
    Exception: Undeclared call 'ca-policies' for task 'inventory'; add it to config/calls.json with its permission.
    Exception: Unknown cloud 'GCCHigh'. Use global, gcc, gcchigh or dod.
    ```

6. **Run the tests, then delete `out`:**

    ```powershell
    Invoke-Pester -Path tests
    Remove-Item -Recurse -Force out
    ```

    `Tests Passed: 330, Failed: 0`. Delete `out` because it names the fixture's privileged holders.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by this path's authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#lab-2-test-tenant) in a test tenant in the worldwide or GCC cloud with a test Azure subscription, never production, with fictional people. The run only reads.

- **What you do:** register a reader app with a certificate, grant it the five permissions from step 2 and Reader on the test subscription, run the inventory, cross-check it against the admin center's download, and check the two things the fixture assumed.
- **Permissions:** the five Graph application permissions from step 2, with admin consent; Reader on the test subscription.
- **Back-out:** step 7 removes the Reader assignment, the five permissions, the app registration and its certificate, and deletes `out/inventory-test`, which names the tenant's privileged holders.

## Knowledge check (5 minutes)

1. Why doesn't the inventory use Learn's all-roles sample as its read?
    a. The sample uses the beta endpoint for every call.
    b. The sample sees no eligible assignment, the state the project moves every human holder into.
    c. The sample needs a write permission.
    d. The sample can't read more than 100 roles.
2. A role is assigned to `PRV-T0-GlobalAdmin`. How does the inventory count the people who hold it?
    a. It counts the group as one holder.
    b. It skips the group, because PIM reports its members.
    c. It expands the group once, marks each member row `Via Group`, and counts them in PA-INV-04.
    d. It reports PA-INV-03 and stops.
3. A custom role isn't in `config/tiers.json`. What happens?
    a. It gets Tier 2 by default.
    b. It's reported as Unclassified, PA-INV-05, never assumed safe.
    c. It's left out of the inventory.
    d. The run fails.
4. Why is the emergency account `ea01` reported as Info, not as a PA-INV-01 Finding?
    a. Emergency accounts are never read.
    b. It holds an eligible assignment.
    c. It's on `exceptions.csv` with an owner; an exception with no owner doesn't count.
    d. It's a service principal.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Under PIM almost every human holder is eligible, so an active-only list stops being an inventory. Taught in [What it leaves to you](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#what-it-leaves-to-you).
2. **c.** Taught in [The rows](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#the-rows) and the gap table's group row.
3. **b.** Taught in [What the inventory has to hold](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#what-the-inventory-has-to-hold) and [The findings](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#the-findings).
4. **c.** Taught in [The findings](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#the-findings) (PA-INV-01) and Lab 1, step 4.
:::

## Summary (2 minutes)

You ran Learn's samples and saw them miss every eligible holder. Then you read 30 assignments from a fictional tenant, each with a tier, and found standing privilege, too many Global Administrators and too many subscription Owners. You saw the reader refuse an undeclared call and an unknown cloud.

**The evidence an ISSO keeps** for Gate 0: `inventory.json` and `inventory.csv`, in the access-controlled evidence store, because they name people; `findings.json`; and `manifest.json`, beside the files it lists. The full list is in the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#federal-requirements-and-evidence); before the code ships, work through its [checklist](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#checklist).

**Next:** [Module 2: Emergency access first](02-emergency-access-first.md).
