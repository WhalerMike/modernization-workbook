---
title: "Attribute-Driven Migration, Module 4: Move Group Policy as Code"
subtitle: "Turn Group Policy analytics into a per-setting move plan, keep settings catalog policies as reviewed files, and create only what a dry run showed, with the least permission that works"
description: "Research draft: Module 4 of the Attribute-Driven Migration learning path. You learn VK-INT-07 as the gate, the per-setting move plan and its dispositions, one library file per policy with an owner and decisions, the linter, and the dry run, apply and drift actions, then run Microsoft's import sample twice against a fake Graph, build the plan, lint the library, sync it and break it on purpose. Guide Gates 0, 5 and 8; Book 19, Chapter 06."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 4
date-modified: 2026-11-02
review-status: approved
reviewed-sha256: a3134060580c1c3b1d13b168e9ba83143e0babe232ecb77b9da05e253d6f509f
last-reviewed: 2026-11-07
---
# Attribute-Driven Migration, Module 4: Move Group Policy as Code {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 4 of 9 · 50 minutes · Guide [Gate 0](../../books/guides/attribute-driven-migration-implementation.md#gate-0-read-the-ou-tree), [Gate 5](../../books/guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) and [Gate 8](../../books/guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) · Workbook [Chapter 06](../../books/b19-developer-workbook/06-group-policy-as-code.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_ADM_Module_4.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_ADM_Module_4_Narrated) (about 15 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ADM_Module_4_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-4/Training_ADM_Module_4_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-4/Training_ADM_Module_4_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_ADM_06_Group_Policy_as_Code_Narrated).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

The OU tree scoped Group Policy, and Group Policy inheritance retires with it. Gate 0 splits every GPO by track, and its Validate step runs VK-INT-07 to show which GPOs Group Policy analytics has imported and how ready they are. Gate 5 moves each user-configuration setting to exactly one owner (computer settings go through the Intune guide's Gate 3, which is where this module's device settings land). Gate 8 cuts over by disabling GPO links, never deleting them. This module is the code between those gates: a plan per setting, a library of reviewed files, and a sync that creates only what a dry run showed.

**The federal requirement.** Moving Group Policy to Intune changes the baseline of every device, so the plan, the library and the sync record are configuration-management evidence. From [Chapter 06's table](../../books/b19-developer-workbook/06-group-policy-as-code.md#federal-requirements-and-evidence):

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| CM-2 Baseline Configuration; CA-7: every in-scope GPO imported and ready, or listed | KSI-MLA-EVC | VK-INT-07's `Results/ValidationResults.json` |
| CM-2; CM-6: each GPO setting has a disposition, and conflicts are shown | KSI-SVC-ACM | The move plan, saved with the pull request |
| CM-3; CM-6: one owner and one decision record per setting | KSI-CMT-VTD | The library in Git, and the decision records |
| CM-3; AC-6: the sync shows what it would create, then writes only that, with read-only scope for the dry run | KSI-CMT-LMC; KSI-CMT-RMV; KSI-IAM-ELP | `out/sync-record.json` |
| CM-3; CA-7: a library that differs from the tenant stops the release | KSI-MLA-EVC; KSI-CMT-VTD | The run log and the pull request |
| SA-11; SR-3: Microsoft's sample is pinned and its behaviour tested | KSI-SCR-MIT; KSI-CMT-VTD | `snapshot.json` and `MicrosoftSamples.Tests.ps1` |

: Chapter 06's requirements, KSIs and evidence for this module {.striped .hover}

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which control is the program's reading *(design guidance)*.

### Learning objectives

In this module, you'll:

- Explain what VK-INT-07 checks per GPO, and what the move plan adds per setting.
- Name the plan's dispositions, and what happens to a `Conflict`.
- Describe a library file: the policy body Graph receives, and the record around it.
- Run the dry run and the apply, and read the sync record.
- Explain why a `Drift` stops the release, and why the sync never sends PATCH or DELETE.

### Prerequisites

- [Module 2](02-a-validation-kit-check.md), for how VK-INT-07 is built.
- Optional: [Microsoft Automation, Module 3](../ms-automation-intune.md), for the settings catalog and Intune's v1.0 and beta APIs.
- PowerShell 7.1 or later and Pester 5.

## Unit 2: The gate and the move plan

*8 minutes*

The operator side is already written: Book 05 runs the GPO sunset, and the Intune track guide turns it into steps. VK-INT-07 works per GPO. `Get-GpcMovePlan` works per setting and gives each one a disposition. Microsoft's import sample creates a policy with one POST and never looks at the tenant first. Read:

- The guide's [Gate 0, step 5 and its Validate step](../../books/guides/attribute-driven-migration-implementation.md#gate-0-read-the-ou-tree), and [Gate 5, step 5](../../books/guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions).
- [Chapter 06: where this sits](../../books/b19-developer-workbook/06-group-policy-as-code.md#where-this-sits), for the two rules that shape the code: one owning policy per setting, and build unassigned.
- [Chapter 06: what Microsoft's samples leave to you](../../books/b19-developer-workbook/06-group-policy-as-code.md#what-it-leaves-to-you).
- [Read: the gate and the move plan](../../books/b19-developer-workbook/06-group-policy-as-code.md#read-the-gate-and-the-move-plan).

## Unit 3: The library, the linter and the sync

*8 minutes*

Each policy is a file: the body Graph receives, exactly as reviewed, with its owner, its source GPOs and a decision record per setting. The sync reads the tenant, normalizes both sides and gives each policy one action: `Create`, `NoChange`, `Drift` or `Duplicate`. It asks for `Read.All` for a dry run and `ReadWrite.All` only with `-Apply`. Read:

- [Write: one file per policy](../../books/b19-developer-workbook/06-group-policy-as-code.md#write-one-file-per-policy).
- [Lint](../../books/b19-developer-workbook/06-group-policy-as-code.md#lint).
- [Diff, then create](../../books/b19-developer-workbook/06-group-policy-as-code.md#diff-then-create).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*22 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/group-policy-as-code`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run the gate
Set-Location ../validation-kit
Import-Module ./powershell/ValidationKit/ValidationKit.psd1
$ctx = Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf '2026-10-29T00:00:00Z' -IncludeBeta
(Invoke-VkCheck -CheckId VK-INT-07 -Context $ctx).Details | Format-Table Severity, Object, Issue

# Step 2: Run Microsoft's import sample twice against the fake Graph
Set-Location ../group-policy-as-code
Import-Module ./powershell/GroupPolicyAsCode.psm1
. ./tests/MicrosoftSampleHarness.ps1
New-Item -ItemType Directory -Force ./out | Out-Null
(Get-Content ./policies/fmp-sc-201-error-reporting-and-dumps.json -Raw | ConvertFrom-Json).policy |
    ConvertTo-Json -Depth 20 | Set-Content ./out/sc-201.json
$g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
Invoke-MicrosoftSample -Name Import -Graph $g -Answers (Resolve-Path ./out/sc-201.json).Path | Out-Null
Invoke-MicrosoftSample -Name Import -Graph $g -Answers (Resolve-Path ./out/sc-201.json).Path | Out-Null
$g.Policies | ForEach-Object { $_['name'] }
$g.Calls | Format-Table Method, Uri

# Step 3: Build the move plan
$plan = Get-GpcMovePlan -Invoke (New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json).Invoke
$plan | Format-Table Gpo, Setting, Scope, Disposition

# Step 4: Lint the library against the plan
Test-GpcLibrary -Library (Read-GpcLibrary -Path ./policies) -Plan $plan | Format-List

# Step 5: Run the dry run, then apply
pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan
pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -Apply

# Step 5: Run the dry run, then apply
Get-Content ./out/sync-record.json -Raw | ConvertFrom-Json | Format-List Scopes, Created
pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan -Cloud usgov

# Step 6: Break something on purpose
$f = './policies/fmp-sc-202-sign-in-and-power.json'
(Get-Content -Raw $f).Replace('power_allowhibernate_0', 'power_allowhibernate_1') | Set-Content -NoNewline $f
pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan

# Step 6: Break something on purpose
pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -Apply

# Step 6: Break something on purpose
(Get-Content -Raw $f).Replace('power_allowhibernate_1', 'power_allowhibernate_0') | Set-Content -NoNewline $f

# Step 7: Run the tests
Invoke-Pester ./tests

# Step 8: Clean up
Remove-Item -Recurse -Force ./out
```

:::

<!-- labs:end -->

You run the gate, run Microsoft's sample twice, build the plan, lint the library, sync it, and break it on purpose. Work in `examples/group-policy-as-code`, in PowerShell 7; step 1 starts in `examples/validation-kit` and moves back. These are the steps of [Chapter 06, Lab 1](../../books/b19-developer-workbook/06-group-policy-as-code.md#lab-1-fixtures-no-tenant), which explains each result.

1. **Run the gate.** Run VK-INT-07 on the validation kit's fail fixture:

   ```powershell
   Set-Location ../validation-kit
   Import-Module ./powershell/ValidationKit/ValidationKit.psd1
   $ctx = Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf '2026-10-29T00:00:00Z' -IncludeBeta
   (Invoke-VkCheck -CheckId VK-INT-07 -Context $ctx).Details | Format-Table Severity, Object, Issue
   ```

   Expected output:

   ```text
   Severity Object                   Issue
   -------- ------                   -----
   Info     FMP-Workstation-Baseline Imported GPO
   Finding  Workstation-Drive-Maps   Targeted in AD, migration readiness 'partial': settings Intune can't take over
   Finding  Workstation-Scripts      Targeted in AD, migration readiness 'error': settings Intune can't take over
   Warn     Workstation-Empty        Targeted in AD, readiness notApplicable: confirm where its settings go
   Finding  Workstation-Printers     In scope, but not imported into Group Policy analytics
   ```

2. **Run Microsoft's import sample twice against the fake Graph.**

   ```powershell
   Set-Location ../group-policy-as-code
   Import-Module ./powershell/GroupPolicyAsCode.psm1
   . ./tests/MicrosoftSampleHarness.ps1
   New-Item -ItemType Directory -Force ./out | Out-Null
   (Get-Content ./policies/fmp-sc-201-error-reporting-and-dumps.json -Raw | ConvertFrom-Json).policy |
       ConvertTo-Json -Depth 20 | Set-Content ./out/sc-201.json
   $g = New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json
   Invoke-MicrosoftSample -Name Import -Graph $g -Answers (Resolve-Path ./out/sc-201.json).Path | Out-Null
   Invoke-MicrosoftSample -Name Import -Graph $g -Answers (Resolve-Path ./out/sc-201.json).Path | Out-Null
   $g.Policies | ForEach-Object { $_['name'] }
   $g.Calls | Format-Table Method, Uri
   ```

   Expected: `FMP-SC-201-Error-reporting-and-dumps` is listed twice, and the calls are two `POST`s to `https://graph.microsoft.com/beta/deviceManagement/configurationPolicies` with no `GET`. The sample never looked.

3. **Build the move plan.**

   ```powershell
   $plan = Get-GpcMovePlan -Invoke (New-GpcFixtureInvoke -Path ./tests/fixtures/tenant.json).Invoke
   $plan | Format-Table Gpo, Setting, Scope, Disposition
   ```

   Expected: eleven rows from three GPOs. Five are `Candidate`. `Allow hibernate` is a `Conflict` on two rows, the firewall rule is `EndpointSecurity`, two rows are `NotSupported` and one is `Deprecated`.

4. **Lint the library against the plan.**

   ```powershell
   Test-GpcLibrary -Library (Read-GpcLibrary -Path ./policies) -Plan $plan | Format-List
   ```

   Expected: one row, `Info` `GPC-08`: the hibernate setting has conflicting GPO values, and decision `DR-0105` picks the value. (`DR-0105` is a decision record, not a dynamic-rule lint rule like Module 3's `DR-05`.)

5. **Run the dry run, then apply.**

   ```powershell
   pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan
   pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -Apply
   ```

   Expected: the dry run ends `Create FMP-SC-201-Error-reporting-and-dumps` and `NoChange FMP-SC-202-Sign-in-and-power`; the apply ends `Created FMP-SC-201-Error-reporting-and-dumps`. Both exit 0. Read the record, then ask for a cloud name the script doesn't know:

   ```powershell
   Get-Content ./out/sync-record.json -Raw | ConvertFrom-Json | Format-List Scopes, Created
   pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan -Cloud usgov
   ```

   Expected: `Scopes : {DeviceManagementConfiguration.ReadWrite.All}` and `Created : {00000000-0000-4000-9000-000000000001}`; then exit 1, because `usgov` isn't one of `gcc,global,gcchigh,dod`.

6. **Break something on purpose.** The first two commands change the hibernate value in one library file; then run the dry run:

   ```powershell
   $f = './policies/fmp-sc-202-sign-in-and-power.json'
   (Get-Content -Raw $f).Replace('power_allowhibernate_0', 'power_allowhibernate_1') | Set-Content -NoNewline $f
   pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan
   ```

   Expected: exit 2, with `Drift FMP-SC-202-Sign-in-and-power: changes device_vendor_msft_policy_config_power_allowhibernate`. Run it with `-Apply`:

   ```powershell
   pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -Apply
   ```

   Expected: still exit 2, and nothing is created, not even SC-201. Put the value back:

   ```powershell
   (Get-Content -Raw $f).Replace('power_allowhibernate_1', 'power_allowhibernate_0') | Set-Content -NoNewline $f
   ```

7. **Run the tests.**

   ```powershell
   Invoke-Pester ./tests
   ```

   Expected: `Tests Passed: 46`.

8. **Clean up.**

   ```powershell
   Remove-Item -Recurse -Force ./out
   ```

**Check your work:** for any GPO setting, you can say its disposition, which library file owns it and which decision record picks its value, and what the sync would do with it.

## Unit 5: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

Import a test GPO into Group Policy analytics, run VK-INT-07 live as a read-only operator, build the move plan live, dry-run and apply as a Policy and Profile Manager, compare the result with what Group Policy analytics' Migrate builds, and drill drift by changing a value in the admin center. Follow [Chapter 06, Lab 2](../../books/b19-developer-workbook/06-group-policy-as-code.md#lab-2-test-tenant).

- **You need:** a test tenant with Intune licenses and a test GPO export, never production.
- **Back it out:** step 8 deletes the created policies by the IDs in `out/apply/sync-record.json`, and the Migrate comparison policy; then delete the imported GPO, as the chapter's clean-up does.

## Unit 6: Knowledge check

*5 minutes*

1. Microsoft's import sample runs twice with the same file. What happens?
   a. The second run finds the policy and does nothing.
   b. Two policies with the same name are created, because the sample never reads the tenant.
   c. The second run updates the first policy.

2. Two GPOs set the same Intune setting to different values. What disposition does the plan give it?
   a. `Candidate`.
   b. `Conflict`, and a decision record picks the value.
   c. `NotSupported`.

3. One library file differs from the tenant's copy, and you run the sync with `-Apply`. What does it create?
   a. Only the policies marked `Create`.
   b. Nothing: it exits 2 and writes nothing while any policy is `Drift`.
   c. It updates the drifted policy.

4. Which permission does a dry run ask for?
   a. `DeviceManagementConfiguration.Read.All`; `ReadWrite.All` only with `-Apply`.
   b. `DeviceManagementConfiguration.ReadWrite.All`, always.
   c. None.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [what Microsoft's samples leave to you](../../books/b19-developer-workbook/06-group-policy-as-code.md#what-it-leaves-to-you) and step 2 of the lab.
2. **b.** See [Read: the gate and the move plan](../../books/b19-developer-workbook/06-group-policy-as-code.md#read-the-gate-and-the-move-plan) and steps 3 and 4 of the lab.
3. **b.** See [Diff, then create](../../books/b19-developer-workbook/06-group-policy-as-code.md#diff-then-create) and step 6 of the lab.
4. **a.** See [what Microsoft's samples leave to you](../../books/b19-developer-workbook/06-group-policy-as-code.md#what-it-leaves-to-you) and [Diff, then create](../../books/b19-developer-workbook/06-group-policy-as-code.md#diff-then-create).
:::

## Unit 7: Summary

*2 minutes*

You read Group Policy analytics into a plan per setting, kept the policies as reviewed files, and saw the sync create only what its dry run showed, and nothing at all when the library and the tenant disagree.

**Evidence an ISSO keeps from this module:** VK-INT-07's run, the move plan with each pull request, the library and its decision records in Git, `sync-record.json` with its scopes, file hashes and created IDs, and in Lab 2 the Intune audit log for the import, the creation and the drift drill. At deployment, Chapter 10 adds the GPO link states before and after, for Gates 5 and 8 ([evidence the ISSO keeps](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#evidence-the-isso-keeps)). Before shipping, work through the [Chapter 06 checklist](../../books/b19-developer-workbook/06-group-policy-as-code.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 3](03-dynamic-rules-as-code.md) · [Learning path](index.md) · [Next: Module 5, Build machine configuration packages →](05-machine-configuration.md)
:::
