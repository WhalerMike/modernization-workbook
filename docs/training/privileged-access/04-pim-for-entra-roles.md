---
title: "Module 4: PIM for Microsoft Entra roles as code"
description: "Workbook Chapter 04 and the plan's A1.6, A2.1, A2.2 and A3.1: hold Book 04, Appendix B's role settings as one reviewed file per role, check them against Learn's bounds and the tier caps, refuse the documented lockout (PA-PIM-01 and PA-PIM-02), dry-run one rollout wave, apply it with separate read and write permissions, prove it from a read-back, and convert standing assignments only after a confirmed activation. About 55 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 04"
last-reviewed: 2026-11-02
series-order: 4
---

# Module 4: PIM for Microsoft Entra roles as code {.unnumbered}

*Part of the [Privileged Access learning path](index.md). Plan Phase 1, task A1.6; Phase 2, tasks A2.1 and A2.2; Phase 3, task A3.1. Workbook [Chapter 04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md). About 55 minutes.*

## Introduction (3 minutes)

Each Microsoft Entra role has its own PIM settings: how long an activation lasts, whether it needs approval, a ticket, an authentication context, and how long an assignment may last. Set by hand in the portal, they drift role by role. [Book 04, Appendix B](../../books/b04-access/appendix-b-pim-role-settings.md) gives the settings for every role by tier.

In this module you hold Appendix B as code: one reviewed file per role. You see exactly what a change will do before it happens, apply it to one rollout wave with the least privilege the writes need, and prove from a read-back that the tenant now matches the files.

::: {.callout-important}
## The lockout check for this module
This chapter writes the settings that cause the documented lockout, so it refuses both halves of it:

- **PA-PIM-01** fails a file that requires approval with no approver.
- **PA-PIM-02** fails the run if fewer emergency accounts hold Global Administrator active, permanent and direct than `emergency-access.json` requires. The code changes no role setting until Module 2's half holds in the tenant.
- **`-ActivationGateChecked`** is a person's statement that `PIM-Activation-c1` is On. `-Apply` won't set an authentication context without it, because the gate's state can't be read from v1.0.

Any Finding blocks `-Apply`. Converting standing assignments goes eligible first, activation confirmed, active removed, and PIM won't remove the last active Global Administrator.
:::

**The federal requirement.** The role files, the plan and the read-back are the evidence for the plan's tasks A1.6, A2.1 and A2.2. They support NIST SP 800-53 AC-6 (least privilege in time), AC-2 and AC-3 (approval before activation), AC-5 (separation of duties), AC-6(5), and BOD 25-01's MS.AAD.7.4v1, 7.5v1 and 7.6v1. The full table is the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#federal-requirements-and-evidence).

| Requirement | KSI | Evidence |
|---|---|---|
| AC-6 and AC-2: activation, eligibility and active assignments inside Learn's bounds and the tier caps | KSI-IAM-JIT | The files in `config/pim-ch04/roles`, `tiers.json`, and PA-PIM-04 in `findings.json` |
| AC-2 and AC-3; MS.AAD.7.6v1, approval to activate Global Administrator | KSI-IAM-JIT | `global-administrator.json` and its rows in `diff.csv` |
| AC-5 and AC-2: no approval without an approver, the emergency accounts kept, no approver group that is also the eligible group | KSI-IAM-JIT | PA-PIM-01, 02 and 03 in `findings.json` |
| AC-6(5); MS.AAD.7.4v1 and 7.5v1, no standing assignment, provisioning only through PIM | KSI-IAM-JIT | PA-PIM-09 and PA-PIM-08 in `findings.json` |
| CM-3 and CM-4(2), reviewed before and verified after | KSI-CMT-LMC, KSI-CMT-RMV, KSI-CMT-VTD | `plan.json`, `diff.csv` and `before.json`; then `verify.csv` and the SHA-256 of each body in `manifest.json` |
| AC-6, least privilege for each identity | KSI-IAM-ELP | Three read permissions to plan; apply and convert each add only their own write permission |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain the documented lockout's two halves and the check that refuses each;
- name the seven activation and assignment rules the code manages, and where their bounds come from;
- read a role's diff and the plan's findings, PA-PIM-01 to PA-PIM-09;
- explain the rollout waves, and why a later wave waits for an earlier one;
- explain the order for converting a standing assignment.

## Prerequisites (1 minute)

- [Module 2](02-emergency-access-first.md): the emergency accounts this module refuses to proceed without.
- [Module 3](03-conditional-access-and-the-activation-gate.md): the activation gate `c1` and its policy.

## Unit 1: Settings, rules and the lockout (8 minutes)

Read the chapter's [The context the code depends on](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-context-the-code-depends-on). Note four things:

- **Emergency access first.** With no approvers selected, the active Privileged Role and Global Administrators become the default approvers, and there are none. Learn's fix has two halves: emergency access accounts, and named approvers.
- **Settings are per role, and Graph calls them rules.** Each role's policy has 17 predefined rules. The code manages the seven [Book 04, Chapter 08's Step 4](../../books/b04-access/08-pim-self-request-with-approval.md#step-4-configure-role-settings-with-microsoft-graph) lists, and leaves the notification rules alone.
- **The authentication context needs its policy first.** That's Module 3's gate.
- **The plan's order is fixed.** The owner chose Tier 1 as the pilot class. The waves are Tier 1, then Tier 0, Tier 2 and read-only. *Design guidance* for the order after the first.

## Unit 2: The files, the checks and the conversion (10 minutes)

Read four sections of the chapter:

- [The role files](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-role-files): 22 files, approvers named by alias, and `tiers.json` with Learn's bounds and Appendix B's caps. The code follows the stricter of two Learn pages: activation of at most eight hours. Active assignments are capped at 15 days.
- [The checks](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-checks): PA-PIM-01 to PA-PIM-09.
- [The calls and their permissions](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-calls-and-their-permissions): reads and writes are different tasks, with different permissions. The code follows the API reference pages, which name narrower permissions than Learn's how-to guides.
- [Converting standing assignments](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#converting-standing-assignments): `WaitingForEligibility`, `WaitingForConfirmedActivation`, `Confirmed`. Only `-Apply -Convert` removes, and only for `Confirmed` rows ([Book 04, Chapter 08's Step 5](../../books/b04-access/08-pim-self-request-with-approval.md#step-5-convert-standing-assignments-to-eligible)).

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#lab-1-fixtures-no-tenant). Work in `examples/privileged-access`, in one PowerShell 7 session: steps 4 to 6 use the `$lab` settings from step 3.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/privileged-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Send Learn's samples to the fake
Invoke-Pester -Path tests/PimEntraRoles.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount

# Step 2: List the permissions each task needs
Import-Module ./powershell/PimEntraRoles/PimEntraRoles.psm1
'pim-plan', 'pim-apply', 'pim-convert' | ForEach-Object { "$_`: " + ((Get-PaPimRequiredPermission -Task $_).GraphPermissions -join ', ') }

# Step 3: Dry-run wave 1, the pilot class (Tier 1)
$lab = @{ Cloud = 'gcc'; FixturePath = 'tests/fixtures/ch04/tenant.json'; BindingsPath = 'tests/fixtures/ch04/inputs/pim-bindings.json'
    EmergencyConfigPath = 'tests/fixtures/inputs/emergency-access.json'; ExceptionsPath = 'tests/fixtures/inputs/exceptions.csv'
    ConfirmedPath = 'tests/fixtures/ch04/inputs/confirmed-activations.csv'; AsOf = '2026-10-30' }
./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-wave1

# Step 4: Read the diff and the findings
Import-Csv out/pim-wave1/diff.csv | Where-Object Role -EQ 'Exchange Administrator' | Format-Table RuleId, Property, Tenant, Desired
Get-Content out/pim-wave1/findings.json -Raw | ConvertFrom-Json | Where-Object Rule -NE 'PA-PIM-05' | Format-Table Rule, Severity, Object, Issue

# Step 5: Try wave 2, Tier 0, before wave 1 is done
./Invoke-PaPimRoleSettings.ps1 @lab -Wave 2 -OutputPath out/pim-wave2

# Step 6: Apply wave 1 to the fake
./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-apply -Apply
./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-apply -Apply -ActivationGateChecked

# Step 7: Run the tests, then delete out
Invoke-Pester -Path tests
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Send Learn's samples to the fake:**

    ```powershell
    Invoke-Pester -Path tests/PimEntraRoles.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount
    ```

    ```text
    PassedCount FailedCount
    ----------- -----------
             13           0
    ```

    The fourth test shows all six of Learn's updates apply, and Application Administrator still differs from its file in six of seven rules.

2. **List the permissions each task needs:**

    ```powershell
    Import-Module ./powershell/PimEntraRoles/PimEntraRoles.psm1
    'pim-plan', 'pim-apply', 'pim-convert' | ForEach-Object { "$_`: " + ((Get-PaPimRequiredPermission -Task $_).GraphPermissions -join ', ') }
    ```

    ```text
    pim-plan: RoleAssignmentSchedule.Read.Directory, RoleEligibilitySchedule.Read.Directory, RoleManagementPolicy.Read.Directory
    pim-apply: RoleAssignmentSchedule.Read.Directory, RoleEligibilitySchedule.Read.Directory, RoleEligibilitySchedule.ReadWrite.Directory, RoleManagementPolicy.Read.Directory, RoleManagementPolicy.ReadWrite.Directory
    pim-convert: RoleAssignmentSchedule.Read.Directory, RoleAssignmentSchedule.ReadWrite.Directory, RoleEligibilitySchedule.Read.Directory, RoleManagementPolicy.Read.Directory
    ```

3. **Dry-run wave 1, the pilot class (Tier 1):**

    ```powershell
    $lab = @{ Cloud = 'gcc'; FixturePath = 'tests/fixtures/ch04/tenant.json'; BindingsPath = 'tests/fixtures/ch04/inputs/pim-bindings.json'
        EmergencyConfigPath = 'tests/fixtures/inputs/emergency-access.json'; ExceptionsPath = 'tests/fixtures/inputs/exceptions.csv'
        ConfirmedPath = 'tests/fixtures/ch04/inputs/confirmed-activations.csv'; AsOf = '2026-10-30' }
    ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-wave1
    ```

    ```text
    Wave 1 (9 roles): 0 Finding, 13 Warn, 0 Info
    Plan: 43 rule updates, 8 eligibility requests, 2 standing assignments to convert (0 confirmed)
    Dry run: nothing was sent
    Written to out/pim-wave1 (manifest.json lists every request and file hash)
    ```

4. **Read the diff and the findings:**

    ```powershell
    Import-Csv out/pim-wave1/diff.csv | Where-Object Role -EQ 'Exchange Administrator' | Format-Table RuleId, Property, Tenant, Desired
    Get-Content out/pim-wave1/findings.json -Raw | ConvertFrom-Json | Where-Object Rule -NE 'PA-PIM-05' | Format-Table Rule, Severity, Object, Issue
    ```

    ```text
    RuleId                                   Property                         Tenant       Desired
    ------                                   --------                         ------       -------
    AuthenticationContext_EndUser_Assignment isEnabled                        False        True
    AuthenticationContext_EndUser_Assignment claimValue                                    c1
    Approval_EndUser_Assignment              isApprovalRequired               False        True
    Approval_EndUser_Assignment              approvalMode                                  SingleStage
    Approval_EndUser_Assignment              isRequestorJustificationRequired              True
    Approval_EndUser_Assignment              stages                                        1
    Approval_EndUser_Assignment              approvalStageTimeOutInDays                    1
    Approval_EndUser_Assignment              isApproverJustificationRequired               True
    Approval_EndUser_Assignment              primaryApprovers                              group:9e000000-0000-4000-8000-000000000011
    Expiration_Admin_Assignment              maximumDuration                  180.00:00:00 15.00:00:00
    Rule      Severity Object                    Issue
    ----      -------- ------                    -----
    PA-PIM-09 Warn     Application Administrator Erin Patel holds the role standing: convert to eligibility through the PRV group
    PA-PIM-08 Warn     Exchange Administrator    Dana Reyes is eligible outside the PRV group (schedule res-dana-exchange); the access review removes it (Chapter 07), this code doesn't
    PA-PIM-09 Warn     Exchange Administrator    Carl Ops holds the role standing: convert to eligibility through the PRV group
    PA-PIM-09 Warn     Exchange Administrator    Contoso-Mail-Automation (#microsoft.graph.servicePrincipal) holds the role standing: document it as an exception or replace it; this code removes users only
    ```

    Exchange Administrator was partly set by hand, so its diff is short: the context goes to `c1`, approval goes to required by `PIM-Approvers-T1`, and the active maximum goes from 180 days to 15. The nine PA-PIM-05 rows left out of the second command ask you to confirm the activation gate.

5. **Try wave 2, Tier 0, before wave 1 is done:**

    ```powershell
    ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 2 -OutputPath out/pim-wave2
    ```

    ```text
    Wave 2 (5 roles): 9 Finding, 5 Warn, 2 Info
    Plan: 30 rule updates, 4 eligibility requests, 0 standing assignments to convert (0 confirmed)
    Blocked: fix every Finding before -Apply
    Dry run: nothing was sent
    Written to out/pim-wave2 (manifest.json lists every request and file hash)
    ```

    The nine Findings are PA-PIM-07, one for each Tier 1 role that doesn't match its file yet. The two Info rows are the emergency accounts, kept permanent active.

6. **Apply wave 1 to the fake:**

    ```powershell
    ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-apply -Apply
    ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-apply -Apply -ActivationGateChecked
    ```

    ```text
    Exception: The plan sets an authentication context: confirm its Conditional Access policy is On (Chapter 03), then pass -ActivationGateChecked
    Wave 1 (9 roles): 0 Finding, 13 Warn, 0 Info
    Plan: 43 rule updates, 8 eligibility requests, 2 standing assignments to convert (0 confirmed)
    Applied: 51 requests sent; 0 differences from the role files after reading back
    Written to out/pim-apply (manifest.json lists every request and file hash)
    ```

    The first command stops before any write. The second sends the rule updates first and the eligibility requests second, then reads back: no differences.

7. **Run the tests, then delete `out`:**

    ```powershell
    Invoke-Pester -Path tests
    Remove-Item -Recurse -Force out
    ```

    `Tests Passed: 330, Failed: 0`.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by this path's authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#lab-2-test-tenant) in a test tenant in the worldwide or GCC cloud, never production, with Microsoft Entra ID P2 or ID Governance licenses for the test users and approvers. Work one role, in a test copy of the files, with the `emergency-access.json` you wrote in Module 2's Lab 2.

- **What you do:** check the prerequisites first (Module 2's check with no Finding, and `PIM-Activation-c1` On), make the lab's role and groups, dry-run as a reader app, apply as a writer app, then activate as a second test user and convert their standing assignment.
- **Permissions:** a reader with the three `pim-plan` permissions; a writer with the two `pim-apply` write permissions added; `RoleAssignmentSchedule.ReadWrite.Directory` granted only for the conversion.
- **Back-out:** step 7 restores the rules from the apply run's `before.json` and removes what the apply added, then deletes the lab folders.

## Knowledge check (5 minutes)

1. A role file requires approval and names no approver. What happens?
    a. PIM picks the Global Administrators as approvers.
    b. PA-PIM-01 fails the file; it's half of the documented lockout.
    c. The plan sends it, and the read-back reports it.
    d. Approval is switched off for that role.
2. Why does the wave 2 dry run report nine PA-PIM-07 Findings?
    a. Tier 0 roles have no files.
    b. Wave 1's Tier 1 roles don't match their files yet, and a wave waits for every earlier wave.
    c. The emergency accounts are missing.
    d. Tier 0 needs a different permission.
3. Why does `-Apply` need `-ActivationGateChecked`?
    a. It turns the Conditional Access policy On.
    b. The gate's policy state can't be read from v1.0, so a person states that `PIM-Activation-c1` is On before the context is set.
    c. It skips the read-back.
    d. It grants the write permission.
4. In what order does the code convert a standing assignment?
    a. Remove the active assignment, then make the person eligible.
    b. Make the role's PRV group eligible, confirm the person's activation with a ticket, then remove the active assignment.
    c. Remove every standing assignment in one run.
    d. Ask the access review to remove it.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [The checks](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-checks) and [The context the code depends on](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-context-the-code-depends-on).
2. **b.** Taught in [The checks](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-checks) (PA-PIM-07), and seen in Lab 1, step 5.
3. **b.** Taught in [The checks](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-checks), the paragraph after the table.
4. **b.** Taught in [Converting standing assignments](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#converting-standing-assignments).
:::

## Summary (2 minutes)

You dry-ran the pilot wave, read a role's diff rule by rule, saw Tier 0 wait for Tier 1, saw the apply refuse until a person confirmed the gate, and then applied 51 requests with no differences left on the read-back.

**The evidence an ISSO keeps:** the reviewed role files and `tiers.json`; each wave's `plan.json`, `diff.csv` and `before.json`; the apply's `verify.csv` and `manifest.json`; and, for each conversion, `confirmed-activations.csv` with its ticket. The full list is in the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#federal-requirements-and-evidence); before the code ships, work through its [checklist](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#checklist).

**Next:** [Module 5: PIM for Groups and the PRV groups](05-pim-for-groups.md).
