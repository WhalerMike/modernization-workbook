---
title: "Module 6: PIM for Azure resources"
description: "Workbook Chapter 06 and the plan's A3.2: hold PIM for Azure resources as reviewed JSON through Azure Resource Manager, not Graph: role settings by tier at every governed scope, eligible assignments, standing Owner, Contributor and User Access Administrator found and converted eligible first, a diff and a dry run before -Apply, Reader to read and User Access Administrator to apply. About 50 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 04"
series-order: 6
review-status: approved
reviewed-sha256: f1d19e7ab1ddf49870751685ef1453086009b175bd395a324a4a17fe75359ab9
last-reviewed: 2026-11-03
---
# Module 6: PIM for Azure resources {.unnumbered}

*Part of the [Privileged Access learning path](index.md). Plan Phase 3, task A3.2. Workbook [Chapter 06](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md). About 50 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pa-module-6) (the deck files come with the next edition) · [▶ Watch](../../presentations/watch.html?v=Training_PA_Module_6_Narrated) (about 13 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PA_Module_6_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-6/Training_PA_Module_6_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-6/Training_PA_Module_6_Narrated.vtt).

## Introduction (3 minutes)

Owner, Contributor and User Access Administrator on a subscription are privileged too. The plan's A3.2 makes them eligible through PIM, with at most three subscription owners. PIM for Azure resources isn't in Microsoft Graph: it goes through Azure Resource Manager, with Azure roles instead of Graph permissions.

In this module you hold PIM for Azure resources as code. One reviewed file says which scopes are governed, the settings for each tier, who is eligible, and which standing assignments are allowed and who owns each one. The code reads the estate, prints a diff, writes the requests it would send, and sends them only with `-Apply`.

::: {.callout-important}
## The lockout check for this module
- **Eligible first.** Each standing Owner, Contributor or User Access Administrator held by a user or group gets an eligible replacement before its removal, so no holder loses the role before they can activate it.
- **PA-AZ-05** flags a standing assignment held by the identity the plan runs as: the apply needs it to finish, so decide it last, from another session. *Design guidance.*
- The desired state refuses an authentication context before its Conditional Access policy is confirmed, as Learn advises.
- Policies go first, because a request that breaks a policy is refused.
:::

**The federal requirement.** The desired state, the plan and the read-back are the evidence for the plan's task A3.2, "Azure privileged roles eligible through PIM." They support NIST SP 800-53 AC-6, AC-6(1) and AC-6(5), AC-2, and CM-3 with CM-4(2). BOD 25-01's Microsoft Entra ID policies cover Entra roles, not Azure roles, so the chapter claims none here. The full table is the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#federal-requirements-and-evidence).

| Requirement | KSI | Evidence |
|---|---|---|
| AC-6 and AC-6(1): each tier's role settings | KSI-IAM-JIT | The `~` lines in `diff.txt` against `desired.json` |
| AC-6, AC-6(5) and AC-2: standing privilege, service principals, root-scope elevation, undeclared eligibility, too many Owners | KSI-IAM-JIT, KSI-IAM-ELP | PA-AZ-01 to 06 in `findings.json` |
| CM-3: the change reviewed before it's made, with the back-out | KSI-CMT-LMC, KSI-CMT-RMV | `state.json`, `plan.json` and `diff.txt`, with `manifest.json` |
| CM-3 and CM-4(2): policies, then eligibility, then removals, and nothing left after | KSI-CMT-LMC, KSI-CMT-VTD, KSI-IAM-JIT | `diff-after.txt` from the apply |
| AC-6, least privilege for each identity | KSI-IAM-ELP | Reader to plan; User Access Administrator to apply; a read client refuses a write |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain why PIM for Azure resources goes through Resource Manager, and which API version the code uses;
- explain why role settings must be set at every governed scope;
- say who can and can't be made eligible;
- read the plan's three kinds of operation and its findings, PA-AZ-01 to PA-AZ-06;
- explain why the code declares User Access Administrator, not Owner, for the apply.

## Prerequisites (1 minute)

- [Module 1](01-privileged-inventory.md): the Azure half of the inventory, which reads the same two schedule lists.
- [Module 4](04-pim-for-entra-roles.md): the seven managed rules, which are the same here.

## Unit 1: Resource Manager, scopes and holders (8 minutes)

Read the chapter's [The context the code depends on](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#the-context-the-code-depends-on). Note:

- **Resource Manager, not Graph.** Three resource types under `Microsoft.Authorization` do the work. Learn marks `2020-10-01` as the generally available release of every PIM resource type; the code pins it.
- **Policies don't inherit.** Settings at a subscription aren't inherited by a resource group under it, so the file lists every scope it governs.
- **Who can be eligible.** Users, not applications, service principals or managed identities, which can't perform the activation steps. A standing Contributor held by a deployment pipeline is reported and left alone.
- **What counts as privileged.** Learn's privileged administrator roles; the chapter governs the three the plan names. Microsoft's best practice is at most three subscription owners.

## Unit 2: The plan and the apply (8 minutes)

Read [What it adds](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#what-it-adds). Note:

- The call list has two tasks. Reader reads; User Access Administrator applies. The code follows the stricter Learn statement and declares User Access Administrator, the narrower of the two roles the PIM pages name.
- The plan's order: policy updates, then new eligible assignments, then removal of standing assignments. Each request has a GUID derived from the run ID and the operation, so the dry run and the apply send exactly the requests the reviewer read.
- An eligibility the file doesn't declare is reported (PA-AZ-04), never removed by the plan.
- Every run writes `state.json`, which holds each policy's rules as read: that's the back-out.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#lab-1-fixtures-no-tenant). Work in `examples/privileged-access`, in one PowerShell 7 session. The fixture estate has a management group (`contoso-root`), a workload subscription, a control-plane subscription and a resource group, `rg-payroll`. The identity that would run the apply is the fictional service principal `sp-pim-automation`, `c3000000-0000-4000-8000-000000000003`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/privileged-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Replay Microsoft's examples
Invoke-Pester -Path tests/AzurePim.Tests.ps1 -FullNameFilter "*Microsoft's examples*" -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List the roles each task needs
Import-Module ./powershell/PaAzurePim/PaAzurePim.psm1
(Get-PaAzRequiredRole -Task azure-pim-read).AzureRoles -join ', '
(Get-PaAzRequiredRole -Task azure-pim-apply).AzureRoles -join ', '

# Step 3: Plan, as a dry run
./Invoke-PaAzurePim.ps1 -Cloud gcc -FixturePath tests/fixtures/ch06/estate.json -DesiredPath tests/fixtures/ch06/desired.json `
    -CallerPrincipalId c3000000-0000-4000-8000-000000000003 -OutputPath out/ch06 -RunId lab

# Step 4: Read the diff and the findings
Get-Content out/ch06/diff.txt | Where-Object { $_ -match '^[+-] ' }
(Get-Content out/ch06/diff.txt | Where-Object { $_ -match '^~ ' }).Count
Get-Content out/ch06/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -ne 'Warn' | Format-Table Rule, Severity, Role, Scope

# Step 5: Apply against the fake
./Invoke-PaAzurePim.ps1 -Cloud gcc -FixturePath tests/fixtures/ch06/estate.json -DesiredPath tests/fixtures/ch06/desired.json `
    -CallerPrincipalId c3000000-0000-4000-8000-000000000003 -OutputPath out/ch06-apply -RunId lab -Apply

# Step 6: See the code refuse
$read = New-PaAzClient -Cloud gcc -Task azure-pim-read -Invoke (New-PaAzFixtureInvoker -Path tests/fixtures/ch06/estate.json).Invoke
Invoke-PaAzWrite -Client $read -CallId azpim-policy-update -Bind @{ scope = '/subscriptions/11111111-1111-4111-8111-111111111111'; name = 'f6000000-0000-4000-8000-000000000004' } -Body @{} -Apply
ConvertTo-PaAzScope '/subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll/providers/Microsoft.Web/sites/payroll'

# Step 7: Run the tests, then delete out
Invoke-Pester -Path tests
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Replay Microsoft's examples:**

    ```powershell
    Invoke-Pester -Path tests/AzurePim.Tests.ps1 -FullNameFilter "*Microsoft's examples*" -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    ```text
    PassedCount FailedCount NotRunCount
    ----------- ----------- -----------
              6           0          32
    ```

    The second test shows Microsoft's own assignment example is an activation, though its `assignmentType` says `Assigned`.

2. **List the roles each task needs:**

    ```powershell
    Import-Module ./powershell/PaAzurePim/PaAzurePim.psm1
    (Get-PaAzRequiredRole -Task azure-pim-read).AzureRoles -join ', '
    (Get-PaAzRequiredRole -Task azure-pim-apply).AzureRoles -join ', '
    ```

    ```text
    Reader
    Reader, User Access Administrator
    ```

    Owner isn't needed for anything.

3. **Plan, as a dry run:**

    ```powershell
    ./Invoke-PaAzurePim.ps1 -Cloud gcc -FixturePath tests/fixtures/ch06/estate.json -DesiredPath tests/fixtures/ch06/desired.json `
        -CallerPrincipalId c3000000-0000-4000-8000-000000000003 -OutputPath out/ch06 -RunId lab
    ```

    ```text
    Read: 9 assignment and 2 eligibility schedules, 12 policies at 4 scopes
    Plan: 11 policy updates, 5 eligible assignments to add, 3 standing assignments to remove
    Findings: 7 Finding, 2 Warn, 1 Info
    Dry run: 19 requests written to plan.json, none sent. Review diff.txt, then rerun with -Apply.
    Written to out/ch06 (manifest.json lists every request and file hash)
    ```

4. **Read the diff and the findings:**

    ```powershell
    Get-Content out/ch06/diff.txt | Where-Object { $_ -match '^[+-] ' }
    (Get-Content out/ch06/diff.txt | Where-Object { $_ -match '^~ ' }).Count
    Get-Content out/ch06/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -ne 'Warn' | Format-Table Rule, Severity, Role, Scope
    ```

    ```text
    + eligible User Access Administrator at /providers/Microsoft.Management/managementGroups/contoso-root (T0) for b2000000-0000-4000-8000-000000000001, P90D (converted)
    + eligible Owner at /subscriptions/11111111-1111-4111-8111-111111111111 (T1) for a1000000-0000-4000-8000-000000000001, P180D (converted)
    + eligible Owner at /subscriptions/11111111-1111-4111-8111-111111111111 (T1) for b2000000-0000-4000-8000-000000000002, P180D
    + eligible Contributor at /subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll (T1) for a1000000-0000-4000-8000-000000000002, P180D (converted)
    + eligible Contributor at /subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll (T1) for b2000000-0000-4000-8000-000000000003, P180D
    - active User Access Administrator at /providers/Microsoft.Management/managementGroups/contoso-root (T0) for b2000000-0000-4000-8000-000000000001 (standing; eligible replacement first)
    - active Owner at /subscriptions/11111111-1111-4111-8111-111111111111 (T1) for a1000000-0000-4000-8000-000000000001 (standing; eligible replacement first)
    - active Contributor at /subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll (T1) for a1000000-0000-4000-8000-000000000002 (standing; eligible replacement first)
    70
    Rule     Severity Role                      Scope
    ----     -------- ----                      -----
    PA-AZ-01 Finding  User Access Administrator /providers/Microsoft.Management/managementGroups/contoso-root
    PA-AZ-05 Finding  User Access Administrator /providers/Microsoft.Management/managementGroups/contoso-root
    PA-AZ-03 Finding  User Access Administrator /
    PA-AZ-01 Finding  Owner                     /subscriptions/11111111-1111-4111-8111-111111111111
    PA-AZ-02 Finding  Contributor               /subscriptions/11111111-1111-4111-8111-111111111111
    PA-AZ-01 Info     Contributor               /subscriptions/22222222-2222-4222-8222-222222222222
    PA-AZ-01 Finding  Contributor               /subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll
    PA-AZ-06 Finding  Owner                     /subscriptions/11111111-1111-4111-8111-111111111111
    ```

    Each `(converted)` line has its `- active` line: eligible replacement first. The 70 `~` lines are policy rule changes. PA-AZ-05 is `sp-pim-automation`'s own User Access Administrator; PA-AZ-02 is a pipeline's standing Contributor, which can't be made eligible. The chapter's step 4 explains each row.

5. **Apply against the fake:**

    ```powershell
    ./Invoke-PaAzurePim.ps1 -Cloud gcc -FixturePath tests/fixtures/ch06/estate.json -DesiredPath tests/fixtures/ch06/desired.json `
        -CallerPrincipalId c3000000-0000-4000-8000-000000000003 -OutputPath out/ch06-apply -RunId lab -Apply
    ```

    ```text
    Read: 9 assignment and 2 eligibility schedules, 12 policies at 4 scopes
    Plan: 11 policy updates, 5 eligible assignments to add, 3 standing assignments to remove
    Findings: 7 Finding, 2 Warn, 1 Info
    Applied: 19 requests sent; left to change after a fresh read: 0
    Written to out/ch06-apply (manifest.json lists every request and file hash)
    ```

6. **See the code refuse:**

    ```powershell
    $read = New-PaAzClient -Cloud gcc -Task azure-pim-read -Invoke (New-PaAzFixtureInvoker -Path tests/fixtures/ch06/estate.json).Invoke
    Invoke-PaAzWrite -Client $read -CallId azpim-policy-update -Bind @{ scope = '/subscriptions/11111111-1111-4111-8111-111111111111'; name = 'f6000000-0000-4000-8000-000000000004' } -Body @{} -Apply
    ConvertTo-PaAzScope '/subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll/providers/Microsoft.Web/sites/payroll'
    ```

    ```text
    Exception: Undeclared call 'azpim-policy-update' for task 'azure-pim-read'; add it to config/calls-ch06.json with its role.
    Exception: '/subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll/providers/Microsoft.Web/sites/payroll' isn't a management group, subscription or resource group scope
    ```

7. **Run the tests, then delete `out`:**

    ```powershell
    Invoke-Pester -Path tests
    Remove-Item -Recurse -Force out
    ```

    `Tests Passed: 330, Failed: 0`.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by this path's authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#lab-2-test-tenant) in a test tenant in the worldwide or GCC cloud, with a test management group, subscription and resource group, never production, and fictional users and groups. Eligible users need Microsoft Entra ID P2 or Microsoft Entra ID Governance.

- **What you do:** prepare an app with Reader on each test scope, write the desired state for the test scopes, plan live, apply under a one-day User Access Administrator assignment, and try the narrower role on one scope.
- **Permissions:** no Graph permission; Reader on each test scope to plan; User Access Administrator, time-bound for one day, to apply.
- **Back-out:** step 6 waits at least five minutes after the last assignment, removes the eligible assignments the run created, restores each policy from the dry run's `state.json`, removes the app's roles and the app, and deletes the `out/ch06-test-*` folders.

## Knowledge check (5 minutes)

1. Which Graph permissions does PIM for Azure resources need?
    a. `RoleManagement.ReadWrite.Directory`.
    b. None: it goes through Resource Manager, and the caller needs an Azure role on the resource.
    c. `RoleManagementPolicy.ReadWrite.Directory`.
    d. `Policy.ReadWrite.ConditionalAccess`.
2. You set role settings at a subscription. Does a resource group under it get them?
    a. Yes, always.
    b. No: Learn says settings aren't inherited, so the file lists every governed scope.
    c. Only for Owner.
    d. Only after 24 hours.
3. A deployment pipeline's service principal holds standing Contributor. What does the plan do?
    a. Converts it to eligible.
    b. Removes it.
    c. Reports PA-AZ-02 and leaves it alone, because service principals can't be made eligible.
    d. Adds it to the exceptions list.
4. Why does the plan add each eligible replacement before removing the standing assignment?
    a. Resource Manager requires it.
    b. So no holder loses the role before they can activate it.
    c. To keep the Owner count under three.
    d. Removals are slower.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [The context the code depends on](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#the-context-the-code-depends-on).
2. **b.** Taught in the same section, under "Policies don't inherit."
3. **c.** Taught in [What it adds](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#what-it-adds) (PA-AZ-02), and seen in Lab 1, step 4.
4. **b.** Taught in [What it adds](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#what-it-adds), step 3 of the plan.
:::

## Summary (2 minutes)

You read a fictional Azure estate at four scopes, planned 19 requests in order (policies, eligibility, removals), saw each conversion add the eligible assignment first, and applied them to the fake with nothing left to change. You saw a read client refuse a write.

**The evidence an ISSO keeps:** the reviewed `desired.json`; each run's `state.json`, `plan.json`, `diff.txt` and `findings.json` with its manifest; and the apply's `diff-after.txt`. The full list is in the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#federal-requirements-and-evidence); before the code ships, work through its [checklist](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#checklist).

**Next:** [Module 7: Access reviews of privileged roles](07-access-reviews.md).
