---
title: "Module 3: Conditional Access for administrators and the activation gate"
description: "Workbook Chapter 03 and the plan's A1.5, A2.3, A2.5 and A2.6: keep the administrator policies, the privileged authentication strength and authentication contexts c1 and c2 as reviewed JSON, check them before merge (PA-CA-01 to PA-CA-09, with the emergency exclusion), plan against the tenant, create every new policy report-only, and enforce only on purpose. About 55 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 04"
last-reviewed: 2026-11-02
series-order: 3
---

# Module 3: Conditional Access for administrators and the activation gate {.unnumbered}

*Part of the [Privileged Access learning path](index.md). Plan Phase 1, task A1.5, and Phase 2, tasks A2.3, A2.5 and A2.6. Workbook [Chapter 03](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md). About 55 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pa-module-3) (the deck files come with the next edition) · [▶ Watch](../../presentations/watch.html?v=Training_PA_Module_3_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PA_Module_3_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-3/Training_PA_Module_3_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-3/Training_PA_Module_3_Narrated.vtt).

## Introduction (3 minutes)

An administrator should sign in with a phishing-resistant method, from a compliant device, on a trusted network. And at the moment they activate a privileged role, they should prove it again. That second proof is the activation gate: authentication context `c1` and its policy `PIM-Activation-c1`. PIM can require the context only after its policy exists and is On.

In this module you keep the administrator policies, the gate and the privileged authentication strength as files. You check them before they merge, plan what a run would change in the tenant, and see the code create every new policy report-only.

::: {.callout-important}
## The lockout check for this module
This is the first module that writes, so it is the first that could lock people out. Two guards stand between the files and the tenant:

- **PA-CA-01** fails any policy file that isn't disabled and doesn't exclude the emergency group. Every file carries the exclusion whatever its state, because a file is enforced by changing one word. *Design guidance.*
- **`-Apply` refuses to start** if the pre-merge check has a Finding, or if any policy it would write leaves out the emergency group.

Before Lab 2 enforces anything, build Module 2's emergency accounts and confirm one can sign in. Register a phishing-resistant method for each test administrator first: Learn warns that enabling the policy first risks locking you out. The plan's A2.6 tests an emergency sign-in before and after each ring is enforced.
:::

**The federal requirement.** The policy files, the check and the plan are the evidence for the plan's tasks A1.5, A2.3, A2.5 and A2.6. They support NIST SP 800-53 IA-2(1), OMB M-22-09 and BOD 25-01's MS.AAD.3.6v1 (phishing-resistant MFA for administrators), AC-6(1) and AC-6(10) for the activation gate, and CM-3 for every change. The full table is the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#federal-requirements-and-evidence).

| Requirement | KSI | Evidence |
|---|---|---|
| IA-2(1); OMB M-22-09; MS.AAD.3.6v1 | KSI-IAM-APM | The strength file and `CA003`, with PA-CA-06 and PA-CA-07 in the check's output |
| AC-6(1) and AC-6(10), a fresh proof at elevation | KSI-IAM-JIT | `PIM-Activation-c1.json`, `ProtectedActions-c2.json` and the contexts, with PA-CA-04, 05 and 08 |
| AC-2, the emergency accounts stay usable | KSI-IAM-JIT | PA-CA-01 in the pull request's check run |
| CM-3 and CM-3(2), the change reviewed and tested before it's made | KSI-CMT-LMC, KSI-CMT-RMV, KSI-CMT-VTD | The pre-merge check; `plan.json` and `requests.json` from the dry run |
| AC-6, least privilege for the identity that plans and the one that applies | KSI-IAM-ELP | Three read permissions; apply adds two write permissions and nothing else |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain the order Learn sets for an authentication context and its policy, and why report-only doesn't count;
- run the pre-merge check and say which rules are Learn's and which are the program's;
- explain how the code treats report-only policies and the emergency exclusion;
- read a plan: Create, Update, NoChange, Blocked, Held, Differs and NotInRepository;
- explain why every new policy is created report-only and why the code never deletes.

## Prerequisites (1 minute)

- [Module 2](02-emergency-access-first.md): the emergency accounts and their exclusion group.
- [Book 04, Chapter 07's Wave 2](../../books/b04-access/07-the-conditional-access-policy-library.md#wave-2-administrators): the administrator policies CA003, CA004, CA005, CA025 and CA027.

## Unit 1: The gate and its order (8 minutes)

Read the chapter's [The context the code depends on](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#the-context-the-code-depends-on). Three pieces of Book 04 meet here: the Wave 2 administrator policies, the activation gate from [Chapter 08's Step 2](../../books/b04-access/08-pim-self-request-with-approval.md#step-2-build-the-authentication-context-and-its-policy), and the custom strength in [Appendix A](../../books/b04-access/appendix-a-conditional-access-templates.md#custom-authentication-strength).

Learn sets the order, and the chapter quotes it:

- Create and enable the Conditional Access policy for a context before you select that context in PIM.
- If no policy targets the context, PIM falls back to MFA, but not when the policy is off, report-only, or excludes the user.
- Don't scope the policy to both the context and a directory role: at activation the user doesn't hold the role yet.

So this chapter builds the gate and leaves it unselected. Module 4 selects `c1` only after this module's run shows `PIM-Activation-c1` is On.

## Unit 2: The check, report-only and the plan (10 minutes)

Read three sections:

- [The pre-merge check](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#the-pre-merge-check): PA-CA-01 to PA-CA-09. On the repository as merged, it passes with five Warn, which are rollout decisions, not mistakes.
- [Report-only policies and the emergency exclusion](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#report-only-policies-and-the-emergency-exclusion): Learn doesn't require the exclusion on a report-only policy, and Book 04, Chapter 10's rule is stricter. The code keeps the exclusion on every file, except a named report-only instrument such as CA090, which is Info.
- [The plan, the dry run and the writes](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#the-plan-the-dry-run-and-the-writes): the seven plan actions, and rollback by changing a file's state, never by deleting ([Book 04, Chapter 07](../../books/b04-access/07-the-conditional-access-policy-library.md#rollback)).

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#lab-1-fixtures-no-tenant). Work in `examples/privileged-access`, in one PowerShell 7 session: step 6 uses the `$repo` that step 4 loads.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/privileged-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Check Microsoft's template as published
Invoke-Pester -Path tests/ConditionalAccess.Tests.ps1 -FullNameFilter '*Get conditionalAccessTemplate*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount

# Step 2: List the permissions each task needs
Import-Module ./powershell/PaConditionalAccess/PaConditionalAccess.psm1
(Get-PaCaRequiredPermission -Task ca-read).GraphPermissions -join ', '
(Get-PaCaRequiredPermission -Task ca-apply).GraphPermissions -join ', '

# Step 3: Run the pre-merge check on the repository's files
./Invoke-PaCaAdmin.ps1 -CheckOnly -MapPath tests/fixtures/ch03/tenant-map.json

# Step 4: Run the same check on Microsoft's template
$t = Read-PaCaTemplatePage -Path ../third_party/conditional-access-template-page/conditionalaccesstemplate-get.md
$repo = Read-PaCaRepository -Path ca-policies -MapPath tests/fixtures/ch03/tenant-map.json
Test-PaCaPolicyBody -Body (ConvertFrom-PaCaTemplate -Template $t) -Repository $repo | Format-Table Rule, Severity

# Step 5: Plan against the fictional tenant, sending nothing
./Invoke-PaCaAdmin.ps1 -Cloud gcc -MapPath tests/fixtures/ch03/tenant-map.json -FixturePath tests/fixtures/ch03/tenant.json -OutputPath out/ca
Get-Content out/ca/plan.json -Raw | ConvertFrom-Json | Format-Table Kind, Name, Action

# Step 6: Apply against the fake, three times
$fake = New-PaCaFixtureInvoker -Path tests/fixtures/ch03/tenant.json -Cloud gcc
$findings = Test-PaCaRepository -Repository $repo
foreach ($run in 1..3) {
    $client = New-PaCaClient -Cloud gcc -Invoke $fake.Invoke -Apply
    $plan = Get-PaCaPlan -Repository $repo -Tenant (Get-PaCaTenant -Client $client)
    $sent = @(Invoke-PaCaPlan -Client $client -Plan $plan -Findings $findings -EmergencyGroupId $repo.EmergencyGroupId | Where-Object Sent)
    "Run ${run}: $($sent.Count) sent"
}
($fake.Tenant.policies | Where-Object displayName -EQ 'PIM-Activation-c1').state

# Step 7: Run the tests, then delete out
Invoke-Pester -Path tests
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Check Microsoft's template as published:**

    ```powershell
    Invoke-Pester -Path tests/ConditionalAccess.Tests.ps1 -FullNameFilter '*Get conditionalAccessTemplate*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount
    ```

    ```text
    PassedCount FailedCount
    ----------- -----------
              7           0
    ```

2. **List the permissions each task needs:**

    ```powershell
    Import-Module ./powershell/PaConditionalAccess/PaConditionalAccess.psm1
    (Get-PaCaRequiredPermission -Task ca-read).GraphPermissions -join ', '
    (Get-PaCaRequiredPermission -Task ca-apply).GraphPermissions -join ', '
    ```

    ```text
    AuthenticationContext.Read.All, Policy.Read.All, Policy.Read.AuthenticationMethod
    AuthenticationContext.Read.All, AuthenticationContext.ReadWrite.All, Policy.Read.All, Policy.Read.AuthenticationMethod, Policy.ReadWrite.ConditionalAccess
    ```

3. **Run the pre-merge check on the repository's files:**

    ```powershell
    ./Invoke-PaCaAdmin.ps1 -CheckOnly -MapPath tests/fixtures/ch03/tenant-map.json
    ```

    ```text
    Pre-merge check: 0 Finding, 5 Warn, 0 Info
    ```

    A Finding would print its rule and file and exit with code 1, which fails the pipeline.

4. **Run the same check on Microsoft's template:**

    ```powershell
    $t = Read-PaCaTemplatePage -Path ../third_party/conditional-access-template-page/conditionalaccesstemplate-get.md
    $repo = Read-PaCaRepository -Path ca-policies -MapPath tests/fixtures/ch03/tenant-map.json
    Test-PaCaPolicyBody -Body (ConvertFrom-PaCaTemplate -Template $t) -Repository $repo | Format-Table Rule, Severity
    ```

    ```text
    Rule     Severity
    ----     --------
    PA-CA-01 Finding
    PA-CA-03 Finding
    PA-CA-06 Warn
    PA-CA-07 Warn
    ```

    Microsoft's template has no emergency exclusion (PA-CA-01), display text in `excludeUsers` (PA-CA-03), plain MFA (PA-CA-06), and 12 of Learn's 14 roles missing (PA-CA-07).

5. **Plan against the fictional tenant, sending nothing:**

    ```powershell
    ./Invoke-PaCaAdmin.ps1 -Cloud gcc -MapPath tests/fixtures/ch03/tenant-map.json -FixturePath tests/fixtures/ch03/tenant.json -OutputPath out/ca
    Get-Content out/ca/plan.json -Raw | ConvertFrom-Json | Format-Table Kind, Name, Action
    ```

    ```text
    Pre-merge check: 0 Finding, 5 Warn, 0 Info
    Plan: 3 Blocked, 4 Create, 1 NoChange, 1 NotInRepository, 2 Update
    Dry run: 6 request(s) written to requests.json, none sent; rerun with -Apply to send them
    Written to out/ca (manifest.json lists every request and file hash)
    Kind     Name                                             Action
    ----     ----                                             ------
    context  c1                                               Create
    context  c2                                               Update
    strength FMP-Privileged-SeparateDevice                    Create
    policy   CA003-Admins-RequirePhishResistantMFA            Blocked
    policy   CA004-Admins-RequireCompliantDevice              Update
    policy   CA005-Admins-BlockUntrustedLocations             NoChange
    policy   CA025-Admins-BlockNonPAW                         Create
    policy   CA027-AllUsers-AzureManagement-BlockNonOperators Create
    policy   PIM-Activation-c1                                Blocked
    policy   ProtectedActions-c2                              Blocked
    policy   CA001-AllUsers-BlockLegacyAuth                   NotInRepository
    ```

    CA003 and the two context policies are Blocked: the strength, and for the context policies `c1`, don't exist yet. CA001 is in the tenant but not in the files, so it's reported, never deleted.

6. **Apply against the fake, three times:**

    ```powershell
    $fake = New-PaCaFixtureInvoker -Path tests/fixtures/ch03/tenant.json -Cloud gcc
    $findings = Test-PaCaRepository -Repository $repo
    foreach ($run in 1..3) {
        $client = New-PaCaClient -Cloud gcc -Invoke $fake.Invoke -Apply
        $plan = Get-PaCaPlan -Repository $repo -Tenant (Get-PaCaTenant -Client $client)
        $sent = @(Invoke-PaCaPlan -Client $client -Plan $plan -Findings $findings -EmergencyGroupId $repo.EmergencyGroupId | Where-Object Sent)
        "Run ${run}: $($sent.Count) sent"
    }
    ($fake.Tenant.policies | Where-Object displayName -EQ 'PIM-Activation-c1').state
    ```

    ```text
    Run 1: 6 sent
    Run 2: 3 sent
    Run 3: 0 sent
    enabledForReportingButNotEnforced
    ```

    The first run creates the contexts and the strength; the second the three policies that needed them, report-only; the third finds nothing to do. The gate is still report-only.

7. **Run the tests, then delete `out`:**

    ```powershell
    Invoke-Pester -Path tests
    Remove-Item -Recurse -Force out
    ```

    `Tests Passed: 330, Failed: 0`.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by this path's authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#lab-2-test-tenant) in a test tenant in the worldwide or GCC cloud with Microsoft Entra ID P1, never production. Don't select `c1` in PIM in this lab; Module 4 does that.

- **What you do:** write your tenant's map, register a reader app, plan, apply twice report-only, watch report-only results in the sign-in log, then enforce the gate alone with `-AllowEnforce`.
- **Permissions:** the three read permissions from step 2; for the apply, `Policy.ReadWrite.ConditionalAccess` and `AuthenticationContext.ReadWrite.All` added, and nothing else.
- **Back-out:** step 7 sets each file the lab created to `disabled` and the contexts' `isAvailable` to false, then applies. Turning a policy off needs no `-AllowEnforce`, and nothing is deleted.

## Knowledge check (5 minutes)

1. `PIM-Activation-c1` is report-only, and PIM requires context `c1` on activation. What happens?
    a. The activation asks for the strength and a compliant device.
    b. PIM's MFA fallback doesn't trigger, because the policy is report-only; that's why the gate must be On first.
    c. PIM refuses every activation.
    d. Report-only policies are enforced for PIM.
2. Why must the activation policy not target both context `c1` and a directory role?
    a. Graph rejects the policy.
    b. At activation the user doesn't hold the role yet, so the policy wouldn't apply.
    c. It doubles the sign-in prompts.
    d. Roles can't be targeted by Conditional Access.
3. A new policy file is applied for the first time. What state does the code create it in?
    a. Enabled.
    b. Disabled.
    c. Report-only; enforcing is a separate change that needs `-AllowEnforce`.
    d. Whatever the tenant's default is.
4. A policy is in the tenant but not in the files. What does the plan do?
    a. Deletes it.
    b. Reports it as NotInRepository and never deletes it.
    c. Imports it into the files.
    d. Disables it.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [The context the code depends on](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#the-context-the-code-depends-on).
2. **b.** Taught in the same section; PA-CA-05 in [The pre-merge check](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#the-pre-merge-check) enforces it.
3. **c.** Taught in [The plan, the dry run and the writes](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#the-plan-the-dry-run-and-the-writes), and seen in Lab 1, step 6.
4. **b.** Taught in [The plan, the dry run and the writes](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#the-plan-the-dry-run-and-the-writes), and seen for CA001 in Lab 1, step 5.
:::

## Summary (2 minutes)

You checked the administrator policies and the activation gate before merge, saw Microsoft's own template fail the program's stricter rules, planned against a tenant, and applied three times until nothing was left to change, with the gate still report-only.

**The evidence an ISSO keeps:** the reviewed policy files and the pull request's check run; each run's `plan.json` and `requests.json` with its manifest; the Entra audit records of the creates; and the pull request that changed the gate's state to enabled. The full list is in the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#federal-requirements-and-evidence); before the code ships, work through its [checklist](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#checklist).

**Next:** [Module 4: PIM for Microsoft Entra roles as code](04-pim-for-entra-roles.md).
