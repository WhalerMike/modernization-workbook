---
title: "Module 5: PIM for Groups and the PRV groups"
description: "Workbook Chapter 05 and the plan's A2.1 and A3.3: keep the PRV role-assignable groups as one reviewed file of who may be a member or owner, until when and on which ticket, read the tenant first, check it (PA-PG-01 to PA-PG-09), plan a diff and the exact requests, and apply only past guards PA-PG-G1 to PA-PG-G7, with least privilege per call. About 55 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 04"
series-order: 5
review-status: approved
reviewed-sha256: 1624368a9f18c12790f06a2ddedb76114d353531764e5d935c9b91f35c5bf6c0
last-reviewed: 2026-11-07
---
# Module 5: PIM for Groups and the PRV groups {.unnumbered}

*Part of the [Privileged Access learning path](index.md). Plan Phase 2, task A2.1, and Phase 3, task A3.3. Workbook [Chapter 05](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md). About 55 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_PA_Module_5.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_PA_Module_5_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PA_Module_5_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-5/Training_PA_Module_5_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-5/Training_PA_Module_5_Narrated.vtt).

## Introduction (3 minutes)

Book 04 never assigns a privileged role to a person. It assigns the role to a role-assignable group named `PRV-<tier>-<role>[-<scope>]`, so the tier shows in every review, alert and audit record. Module 1 reads those groups. This module writes them.

A PRV group's own state has to be governed: who is a member or owner, until when, on which ticket, and how membership is activated. In this module you keep that state in one reviewed file. The code reads the tenant first, reports what's wrong, plans the exact requests, and applies them only when you ask and only past its guards.

::: {.callout-important}
## The lockout check for this module
The guards refuse a plan before anything is sent. Three of them stop an unsafe change by mistake:

- **PA-PG-G4** refuses eligible owners with no active owner. Learn says the last active owner can't be removed, so an activated owner's deactivation fails.
- **PA-PG-G6** refuses more removals than `-MaxRemovals` (default 5), the sign of a wrong or truncated file.
- **PA-PG-G1** refuses a Tier 0 or Tier 1 policy losing approval or its approvers.

And as in Module 4, `-Apply` won't select the authentication context `c1` without **`-ActivationGateChecked`**, a person's statement that `PIM-Activation-c1` is On.

Learn also says a group can't be taken back out of PIM once onboarded, so Lab 2 uses groups made for the lab.
:::

**The federal requirement.** The PRV groups' file, the check and the plan are the evidence for the plan's task A2.1. They support NIST SP 800-53 AC-6(5) (privileged accounts restricted to defined roles), AC-6 and AC-5, AC-2, and BOD 25-01's MS.AAD.7.4v1 and 7.5v1. The full table is the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#federal-requirements-and-evidence).

| Requirement | KSI | Evidence |
|---|---|---|
| AC-6(5); MS.AAD.7.5v1: every PRV group named for its tier, role-assignable, assigned, with no nested group and no eligible service principal | KSI-IAM-JIT | PA-PG-01, 02, 03 and 05 in `findings.json` |
| AC-6, AC-5; MS.AAD.7.4v1: every grant has an end and a ticket, Tier 0 has no owners, Tier 0 and Tier 1 need approval, no group approves itself | KSI-IAM-JIT | PA-PG-06, 07 and 08 in `findings.json` |
| AC-2: access nobody reviewed is found | KSI-IAM-JIT | PA-PG-09 in `findings.json` |
| CM-3: the change reviewed before it's made, and an unsafe change stopped | KSI-CMT-LMC, KSI-CMT-RMV | `diff.txt` and `plan.json`; the PA-PG-G6 refusal |
| AC-6, least privilege for each identity | KSI-IAM-ELP | Four read permissions; the plan's own list of write permissions |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain the two Microsoft features that meet in a PRV group, and the two ways Book 04 uses them together;
- name what Learn says about role-assignable groups and PIM for Groups that shapes the code;
- read the findings, PA-PG-01 to PA-PG-09, and a plan's diff;
- name the guards PA-PG-G1 to PA-PG-G7, and say why the pipeline's app doesn't create the groups.

## Prerequisites (1 minute)

- [Module 4](04-pim-for-entra-roles.md): eligible assignments, and the PRV group that holds each role's eligibility.
- [Book 04, Chapter 04's role-assignable groups](../../books/b04-access/04-privileged-roles-and-tiers.md#role-assignable-groups).

## Unit 1: What the PRV groups have to hold (8 minutes)

Read the chapter's [What the PRV groups have to hold](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#what-the-prv-groups-have-to-hold). Note:

- **Role-assignable groups.** Only a group created with `isAssignableToRole` set to `true` can hold an Entra role. It's set at creation and can't be changed. A tenant can have at most 500. Membership must be assigned, never dynamic, and a group can't be a member.
- **PIM for Groups.** Just-in-time membership or ownership, with one policy for membership and one for ownership.
- **Two ways to use them together** ([Book 04, Chapter 04](../../books/b04-access/04-privileged-roles-and-tiers.md#two-ways-to-model-eligibility-through-a-group)): for an Entra role, the group holds an eligible assignment and its members are active; for other privilege, the members are eligible for the group.
- Three facts from Learn shape the code: eligible membership doesn't appear in the group's `members` list; PIM onboards a group on its first schedule or policy change, and it can't be taken back out; and group administrators or owners can override what PIM set. So the code reads the tenant before every plan.

The access packages for PRV membership, the plan's A3.3, aren't built here.

## Unit 2: The file, the findings and the guards (10 minutes)

Read three sections of the chapter:

- [The desired state](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#the-desired-state): `prv-groups.json`, and the tier policy in `config/prv-group-policy.json`. *Design guidance* for the values. Every member and owner policy selects Module 3's authentication context `c1`, as Book 04 requires, so `-Apply` needs `-ActivationGateChecked`, as in Module 4.
- [The read and the findings](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#the-read-and-the-findings): PA-PG-01 to PA-PG-09. Activations aren't standing state, so they're left out.
- [The plan, the dry run and `-Apply`](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#the-plan-the-dry-run-and--apply) and [Least privilege per call](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#least-privilege-per-call): the plan's fixed order (groups, then policy rules, then grants, then removals), the guards, and why `RoleManagement.ReadWrite.Directory` stays off the pipeline's app. *Design guidance.*

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#lab-1-fixtures-no-tenant). Work in `examples/privileged-access`, in one PowerShell 7 session.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/privileged-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run Microsoft's samples against the fake
Invoke-Pester -Path tests/PimForGroups.Tests.ps1 -FullNameFilter '*as published*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount

# Step 2: Send Learn's Example 1 yourself
Import-Module ./powershell/PimGroups/PimGroups.psm1
. ./tests/PimForGroupsSampleHarness.ps1
$learn = Get-PgLearnRequest -Page eligibility
$learn[0].Title; $learn[0].Body.accessId
(Invoke-PgLearnRequest -Request $learn[0] -Fixture tests/fixtures/ch05/tenant.json -Policy).Status

# Step 3: List the permissions
(Get-PaPgRequiredPermission -Task pim-groups-read).GraphPermissions -join ', '

# Step 4: Plan against the fictional tenant, as a dry run
./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
    -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups

# Step 5: Read the findings
Get-Content out/pim-groups/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object

# Step 6: Read the diff
Get-Content out/pim-groups/diff.txt
(Get-Content out/pim-groups/plan.json -Raw | ConvertFrom-Json).Permissions -join ', '

# Step 7: See a guard refuse
./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
    -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-guard -MaxRemovals 2 -Apply

# Step 8: Apply to the fake
./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
    -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-apply -Apply
./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
    -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-apply -Apply -ActivationGateChecked

# Step 9: Run the tests, then delete out
Invoke-Pester -Path tests
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Run Microsoft's samples against the fake:**

    ```powershell
    Invoke-Pester -Path tests/PimForGroups.Tests.ps1 -FullNameFilter '*as published*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount
    ```

    ```text
    PassedCount FailedCount
    ----------- -----------
             10           0
    ```

2. **Send Learn's Example 1 yourself:**

    ```powershell
    Import-Module ./powershell/PimGroups/PimGroups.psm1
    . ./tests/PimForGroupsSampleHarness.ps1
    $learn = Get-PgLearnRequest -Page eligibility
    $learn[0].Title; $learn[0].Body.accessId
    (Invoke-PgLearnRequest -Request $learn[0] -Fixture tests/fixtures/ch05/tenant.json -Policy).Status
    ```

    ```text
    Example 1: An admin creates an eligible group ownership request for a principal
    member
    400 Bad Request from the fake: the schedule ended at 2023-02-07T19:56:00.0000000Z, before the fake's clock
    ```

    The example is labeled ownership but asks for membership, and its dates are stale.

3. **List the permissions:**

    ```powershell
    (Get-PaPgRequiredPermission -Task pim-groups-read).GraphPermissions -join ', '
    ```

    ```text
    Group.ReadBasic.All, PrivilegedAssignmentSchedule.Read.AzureADGroup, PrivilegedEligibilitySchedule.Read.AzureADGroup, RoleManagementPolicy.Read.AzureADGroup
    ```

    Nothing ends in `ReadWrite`.

4. **Plan against the fictional tenant, as a dry run:**

    ```powershell
    ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
        -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups
    ```

    ```text
    PIM for Groups: 11 Finding, 3 Warn, 0 Info
    Plan: 10 change(s) (3 assignment, 2 eligibility, 5 policy rule)
    Guards: all passed
    Activation gate: the plan selects an authentication context; -Apply also needs -ActivationGateChecked
    Dry run: nothing sent. Review diff.txt and plan.json, then rerun with -Apply
    Written to out/pim-groups (manifest.json lists every request and file hash)
    ```

5. **Read the findings:**

    ```powershell
    Get-Content out/pim-groups/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object
    ```

    ```text
    Rule     Severity Object
    ----     -------- ------
    PA-PG-09 Warn     Helpdesk-Admins-Legacy
    PA-PG-09 Warn     PRV-T1-IntuneAdmin
    PA-PG-09 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-06 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-09 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-07 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-08 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-08 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-08 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-08 Finding  PRV-T0-PrivRoleAdmin
    PA-PG-02 Warn     PRV-T1-AzureOwner-SubWorkload
    PA-PG-05 Finding  PRV-T1-AzureOwner-SubWorkload
    PA-PG-09 Finding  PRV-T1-AzureOwner-SubWorkload
    PA-PG-08 Finding  PRV-T1-AzureOwner-SubWorkload
    ```

    On `PRV-T0-PrivRoleAdmin`: a permanent active member the file doesn't grant, an eligible owner with no active owner, and a member policy that activates without approval, for 8 hours instead of 4, and with MFA instead of `c1`. On `PRV-T1-AzureOwner-SubWorkload`: a nested group as an eligible member. The chapter's step 5 explains each row.

6. **Read the diff:**

    ```powershell
    Get-Content out/pim-groups/diff.txt
    (Get-Content out/pim-groups/plan.json -Raw | ConvertFrom-Json).Permissions -join ', '
    ```

    ```text
    # PIM for Groups plan, cloud gcc, 10 change(s), dry run: nothing sent
    ~ PRV-T0-PrivRoleAdmin member Expiration_EndUser_Assignment: required=True max=PT8H -> required=True max=PT4H
    ~ PRV-T0-PrivRoleAdmin member Enablement_EndUser_Assignment: enabled=Justification,MultiFactorAuthentication,Ticketing -> enabled=Justification,Ticketing
    ~ PRV-T0-PrivRoleAdmin member AuthenticationContext_EndUser_Assignment: context=off -> context=c1
    ~ PRV-T0-PrivRoleAdmin member Approval_EndUser_Assignment: approval=False approvers=groupMembers:5a000000-0000-4000-8000-0000000000a0 -> approval=True approvers=groupMembers:5a000000-0000-4000-8000-0000000000a0
    ~ PRV-T1-AzureOwner-SubWorkload owner Expiration_Admin_Eligibility: required=False max=P90D -> required=True max=P90D
    ~ active member PRV-T1-ExchangeAdmin eve.exch@contoso.example end 2026-12-31 -> 2027-04-28 (CHG-1002)
    + active member PRV-T1-ExchangeAdmin ben.ops@contoso.example until 2027-04-28 (CHG-1005)
    - active member PRV-T0-PrivRoleAdmin ben.ops@contoso.example
    - eligible owner PRV-T0-PrivRoleAdmin cara.cloud@contoso.example
    - eligible member PRV-T1-AzureOwner-SubWorkload Helpdesk-Admins-Legacy
    PrivilegedAssignmentSchedule.ReadWrite.AzureADGroup, PrivilegedEligibilitySchedule.ReadWrite.AzureADGroup, RoleManagementPolicy.ReadWrite.AzureADGroup
    ```

    The policy rules come first, then grants, then the three removals.

7. **See a guard refuse:**

    ```powershell
    ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
        -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-guard -MaxRemovals 2 -Apply
    ```

    ```text
    Exception: Refusing to apply: PA-PG-G6: 3 removals is more than 2; review them and rerun with a higher -MaxRemovals
    ```

    Nothing is sent.

8. **Apply to the fake:**

    ```powershell
    ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
        -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-apply -Apply
    ./Invoke-PaPimGroups.ps1 -Cloud gcc -FixturePath tests/fixtures/ch05/tenant.json `
        -DesiredPath tests/fixtures/ch05/inputs/prv-groups.json -AsOf 2026-10-30 -OutputPath out/pim-groups-apply -Apply -ActivationGateChecked
    ```

    ```text
    Exception: The plan sets an authentication context: confirm its Conditional Access policy is On (Chapter 03), then pass -ActivationGateChecked
    PIM for Groups: 11 Finding, 3 Warn, 0 Info
    Plan: 10 change(s) (3 assignment, 2 eligibility, 5 policy rule)
    Guards: all passed
    Applied: 10 sent, 0 failed
    Written to out/pim-groups-apply (manifest.json lists every request and file hash)
    ```

    The first command stops before any write. The second sends the policy rules first, then the grants and removals. The fake records the requests and doesn't change its tenant.

9. **Run the tests, then delete `out`:**

    ```powershell
    Invoke-Pester -Path tests
    Remove-Item -Recurse -Force out
    ```

    `Tests Passed: 330, Failed: 0`.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by this path's authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#lab-2-test-tenant) in a test tenant in the worldwide or GCC cloud with Microsoft Entra ID P2 or Governance licenses and fictional people, never production. Use groups made for the lab: a group can't be taken back out of PIM.

- **What you do:** as a Privileged Role Administrator, make the lab groups by hand; register a reader app and a writer app; plan as the reader; apply the reviewed diff as the writer; rerun the plan and see `Plan: 0 change(s)`.
- **Permissions:** the reader gets the four permissions from step 3; the writer gets those and the three from step 6. Nothing else.
- **Back-out:** step 6 empties both lists in your file and applies it, so no schedule remains, then deletes the lab folder.

## Knowledge check (5 minutes)

1. Why does the code read the tenant before every plan?
    a. To save permissions.
    b. Eligible membership isn't in the `members` list, policy IDs change when PIM onboards a group, and others can override what PIM set.
    c. Graph requires a read before a write.
    d. To find the groups' display names.
2. The file lists 3 removals and you pass `-MaxRemovals 2 -Apply`. What happens?
    a. The first two removals are sent.
    b. PA-PG-G6 refuses the plan, and nothing is sent.
    c. All three are sent with a warning.
    d. The removals are skipped and the rest is sent.
3. A Tier 0 PRV group has an eligible owner and no active owner. Why is that a Finding?
    a. Owners can't be eligible.
    b. Learn says the last active owner can't be removed, so an activated owner's deactivation fails; and Tier 0 groups have no owners by design.
    c. Owners need a ticket.
    d. Eligible owners can't approve.
4. Why does the pipeline's app not create the PRV groups?
    a. Graph can't create role-assignable groups.
    b. Creating one needs `RoleManagement.ReadWrite.Directory`; the program keeps that permission off the pipeline, and a Privileged Role Administrator creates the groups by hand.
    c. Groups must be created in the portal.
    d. The plan has no create action.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [What the PRV groups have to hold](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#what-the-prv-groups-have-to-hold).
2. **b.** Taught in [The plan, the dry run and `-Apply`](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#the-plan-the-dry-run-and--apply), and seen in Lab 1, step 7.
3. **b.** Taught in [The read and the findings](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#the-read-and-the-findings) (PA-PG-07).
4. **b.** Taught in [Least privilege per call](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#least-privilege-per-call).
:::

## Summary (2 minutes)

You read a fictional tenant's PRV groups against a reviewed file of four, found a standing member nobody granted, an owner trap and a nested group, read the exact requests that would fix them, saw a guard refuse a plan with too many removals, saw the apply refuse to select `c1` until a person confirmed the gate, and applied ten requests to the fake.

**The evidence an ISSO keeps:** the reviewed `prv-groups.json`, with each holder's end date and ticket; each plan's `diff.txt`, `plan.json` and `findings.json`; and each apply's `results.json` and `manifest.json`. The full list is in the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#federal-requirements-and-evidence); before the code ships, work through its [checklist](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#checklist).

**Next:** [Module 6: PIM for Azure resources](06-pim-for-azure-resources.md).
