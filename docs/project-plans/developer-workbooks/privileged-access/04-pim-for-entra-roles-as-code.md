---
title: "Chapter 04 — PIM for Microsoft Entra Roles as Code"
description: "Hold PIM role settings for Microsoft Entra roles as one reviewed JSON file per role, starting from Learn's own samples for updating PIM rules and assigning eligibility (pinned in the repository) and adding what they leave to you: the authentication context, approver groups, a diff against the tenant, a dry run before any write, the least-privileged permission for each read and write, eligibility for the PRV groups, the conversion of standing assignments, a guard against the documented lockout, and the plan's order of one role class first, then every tier, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-privileged-access
part: How
series-order: 4
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 04 — PIM for Microsoft Entra Roles as Code

*A role setting someone changed in the portal is a control nobody reviewed. Hold each role's settings in a file, compare the file with the tenant, and change the tenant only from the file.*

::: {.callout-note}
## In this chapter
The code behind the plan's tasks A1.6, A2.1 and A2.2: "role settings for every tier written as code from Appendix B and reviewed," then the pilot class's settings applied with PRV groups holding the eligible assignments, then its standing assignments converted, "eligible first, activation confirmed, active removed." You start with two Learn pages, Microsoft's samples for updating PIM rules and for assigning eligibility, pinned in the repository, and you send their requests to a fake Graph to see what they do and what they leave out. Then you use `examples/privileged-access` for the rest: one reviewed JSON file per role, a diff against the tenant, a dry run by default, separate read and write permissions, a lockout guard, and a rollout that refuses the next tier until the last one matches its files. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can hold [Book 04, Appendix B](../../../books/b04-access/appendix-b-pim-role-settings.md)'s role settings as code, show a reviewer exactly what a change will do to the tenant before it happens, apply it to one rollout wave with the least privilege the writes need, and prove from a read-back that the tenant now matches the files. You can say, for each rule in the code, whether it is Microsoft's contract, Microsoft's sample, or the program's own design.

**Audience.** Developers who build the project's write path, the identity engineers who own PIM, and the ISSOs who review the changes. You should read PowerShell 7 and JSON, and know what an eligible assignment is. You don't need a tenant until Lab 2.

## The context the code depends on

**Emergency access first.** Learn documents a lockout: every Privileged Role Administrator and Global Administrator eligible and none active, approval required, and no approvers selected. With no approvers, the active Privileged Role and Global Administrators become the default approvers, and there are none.[^pa04-settings] Learn's fix has two halves: emergency access accounts, and named approvers. [Chapter 02](02-emergency-access-as-code.md) checks the first half. This chapter refuses to change any role setting until that half holds in the tenant, and refuses any file that requires approval with no approver.

**Settings are per role, and Graph calls them rules.** Each Microsoft Entra role has its own settings, independent of every other role's, and every assignment of the role follows them.[^pa04-settings] In Graph, each role at tenant scope is assigned one `unifiedRoleManagementPolicy`, and each policy has 17 predefined rules with fixed IDs, in three groups: activation, assignment and notification.[^pa04-rules] This chapter manages the seven activation and assignment rules [Book 04, Chapter 08](../../../books/b04-access/08-pim-self-request-with-approval.md#step-4-configure-role-settings-with-microsoft-graph) lists, and leaves the notification rules alone (research gaps, row 45).

| Rule ID | What it sets | Admin center setting |
|---|---|---|
| `Expiration_EndUser_Assignment` | Activation maximum duration | Activation |
| `Enablement_EndUser_Assignment` | Justification, MFA and ticket on activation | Activation |
| `AuthenticationContext_EndUser_Assignment` | The authentication context required on activation | Activation |
| `Approval_EndUser_Assignment` | Approval and approvers | Activation |
| `Expiration_Admin_Eligibility` | Permanent eligible allowed, or the eligibility maximum | Assignment |
| `Expiration_Admin_Assignment` | Permanent active allowed, or the active maximum | Assignment |
| `Enablement_Admin_Assignment` | MFA and justification on an active assignment | Assignment |

Rule IDs, types and the caller each one is enforced for are from Learn's mapping guide.[^pa04-rules]

**The authentication context needs its policy first.** Learn says to create and enable the Conditional Access policy for the context before selecting the context in PIM. If no policy targets the context, activation falls back to MFA, but not when the policy is off, report-only, or excludes the user.[^pa04-settings] The program's context is `c1` and its policy is `PIM-Activation-c1` ([Book 04, Chapter 08](../../../books/b04-access/08-pim-self-request-with-approval.md#step-2-build-the-authentication-context-and-its-policy)). Chapter 03 builds both, report-only first, and its PA-CA-04 warns until the policy is On. Learn's mapping guide labels the admin center's authentication context option "(Preview)"; the role settings page and the v1.0 rule resource don't.[^pa04-rules] [^pa04-authctx-rule] This chapter treats it as preview, the stricter reading (research gaps, row 42).

**The plan's order is fixed.** Emergency access first, then one role class under just-in-time elevation (the plan's Phase 2; for decision D-A5 the owner chose Tier 1, the management-plane roles, as the pilot class), then every tier (Phase 3, task A3.1), tier by tier ([project plan](../../privileged-access.md)). The code holds that order as rollout waves: Tier 1, then Tier 0, Tier 2 and read-only. It refuses a wave until every earlier wave matches its files (research gaps, row 49). The order of the waves after the first is *Design guidance*.

### Which cloud, for these calls

Every call in this chapter is Microsoft Graph v1.0. For Microsoft 365 GCC, Graph is the worldwide host, `graph.microsoft.com`, and sign-in is `login.microsoftonline.com`; GCC High uses `graph.microsoft.us` and DoD `dod-graph.microsoft.us`.[^pa04-deployments] No call here uses Resource Manager; PIM for Azure resources is Chapter 06. Every call's Learn page lists the global service, US Government L4 and US Government L5 as available.[^pa04-list-rmpa] [^pa04-update-rule] [^pa04-res-list] [^pa04-res-request] [^pa04-ras-request] PIM is available in Azure for US Government, and Microsoft Entra ID Governance is available in GCC, GCC High and DoD.[^pa04-availability] The code takes an explicit cloud name and has no default.

## Start with Microsoft's sample

### What Microsoft gives you

Two Learn pages are Microsoft's samples for this task.

*Update rules in PIM by using Microsoft Graph* shows how to find a role's policy from its template ID through `roleManagementPolicyAssignments`, then six `PATCH` requests: the activation maximum, justification with MFA and ticket on activation, approval, eligibility expiration, active expiration, and justification with MFA on active assignment. It says every body must carry the derived rule's `@odata.type`, that each update returns `204 No Content`, that Privileged Role Administrator is the least-privileged role, and that `RoleManagementPolicy.ReadWrite.Directory` is the permission for Microsoft Entra roles.[^pa04-update-rules]

*Assign privileged roles using PIM for Microsoft Entra roles APIs* is the tutorial for eligibility. It creates a role-assignable group, makes it eligible for User Administrator through `roleEligibilityScheduleRequests`, has a member activate the role with a justification and a ticket, and cleans up.[^pa04-tutorial] That is the pattern Book 04 uses: the role is eligible to a `PRV-<tier>-<role>` group, not to a person.

### The pinned copy

The samples exist only inside the pages, so the repository pins the pages' source, unmodified, in [`examples/third_party/graph-pim-rules-pages`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/graph-pim-rules-pages): `concepts/how-to-pim-update-rules.md` and `concepts/tutorial-assign-azureadroles.md` from microsoftgraph/microsoft-graph-docs-contrib at commit `a693031` (October 30, 2026), retrieved October 30, 2026, with the repository's licenses (MIT for code, Creative Commons Attribution 4.0 for documentation).[^pa04-sample-src] `snapshot.json` records each file's SHA-256, checked against the upstream git blob hashes; a unit test checks them, and the weekly source watch reports new commits to either page.

`tests/PimLearnSampleHarness.ps1` extracts every HTTP request from the pinned pages, unmodified, and the tests send them to the fake Graph in `PimEntraRoles.psm1`, which serves a fictional tenant with one policy per role and all 17 rules. The fake requires the `@odata.type` the rule has, and it rejects an eligibility request longer than the policy allows, as Learn says PIM does.[^pa04-pim-api] Nothing signs in.

### What it leaves to you

Each row is pinned by a test in `tests/PimEntraRoles.Tests.ps1`: the first 13 run Learn's samples as published.

| Learn's samples, as published | Why it matters | What `examples/privileged-access` adds |
|---|---|---|
| Find the policy from the template ID through `roleManagementPolicyAssignments` | — | Kept as the read, with Learn's `$expand=policy($expand=rules)` so one call returns the policy and its rules[^pa04-list-rmpa] |
| Each `PATCH` carries its `@odata.type`; the write permission is `RoleManagementPolicy.ReadWrite.Directory` | — | Kept: every body the code writes has the type, and the call list declares the same permission |
| No sample for `AuthenticationContext_EndUser_Assignment` | Appendix B requires context `c1` on every role | The rule is written from each role file, with its `@odata.type`[^pa04-authctx-rule] |
| Activation requires MFA, not an authentication context | MFA may not prompt in a session that already did it[^pa04-settings] | `c1` on activation, and MFA only on active assignment, as Appendix B sets |
| Every `PATCH` names one hard-coded policy ID from another tenant, so each one fails as published | A copied script writes nowhere, or to the wrong role | The policy ID always comes from the read, per role |
| With the right policy ID, the six samples still leave Application Administrator different from Appendix B in six rules | Applying the samples isn't applying the program's settings | `Compare-PaPimPolicy`: a diff, rule by rule and property by property |
| The approval sample names a single user beside a group | People leave; a policy that names one is a broken approval path | Approvers are groups only, named by alias and bound to object IDs per tenant |
| No read before a write, no dry run, no read-back | Nobody sees the change before it happens or proves it after | A plan and a diff by default; writes only with `-Apply`; the tenant read back and compared after |
| Nothing checks the lockout conditions | Approval with no approver and no emergency accounts locks the tenant[^pa04-settings] | PA-PIM-01 and PA-PIM-02 block every write |
| The tutorial asks for a year of User Administrator eligibility | Appendix B caps Tier 2 at 180 days; the code refuses the request before sending it, and the fake, like PIM, rejects it once the policy is set | `New-PaPimEligibilityRequest` checks the role file's maximum |
| The tutorial asks for `RoleManagement.ReadWrite.Directory` and `Group.ReadWrite.All` | Broader than the request needs | `RoleEligibilitySchedule.ReadWrite.Directory` only[^pa04-res-request] |
| The tutorial's clean-up deletes a group by the test user's object ID | Run as written, it deletes the wrong object, or fails | The back-out uses only IDs the run recorded |
| The tutorial reads no existing eligibility and sets no role settings | A second run asks again; the eligibility follows whatever the role allows | Eligibility is planned only where it's missing, after the role's rules are set |

**The verdict.** Keep Learn's read, Learn's rule shapes and Learn's write permission. Don't run the samples as published: they write one role at a time to a policy in another tenant, with a single-user approver, MFA instead of a context, and nothing to stop the lockout.

## The code: `examples/privileged-access`

This chapter adds its own module, `powershell/PimEntraRoles/PimEntraRoles.psm1`, its own call list, `config/calls-ch04.json`, the role files and rollout in `config/pim-ch04`, and the entry script `Invoke-PaPimRoleSettings.ps1`. It imports Chapter 01's `PrivilegedAccess` module for the cloud table and the exceptions list, and reads Chapter 02's `emergency-access.json`. Its notes are in `examples/privileged-access/docs/ch04.md`.

It builds on Book 04's own script. [Appendix B's `Set-FMPPimTierPolicy.ps1`](../../../books/b04-access/appendix-b-pim-role-settings.md#applying-a-tiers-settings-with-powershell) applies five rules to a list of roles and honors `-WhatIf`. This code adds the two assignment rules, the files per role, the diff, the read-back, the guards and the waves.

### The role files

`config/pim-ch04/roles` holds one file per role in Appendix B, 22 in all, named for the role. Each file holds the role's template ID and tier, and its activation, approval and assignment settings: for example Global Administrator, Tier 0, four hours, context `c1`, justification and ticket, approval by `PIM-Approvers-T0`, eligibility for at most 90 days, and permanent active allowed only for this role, for the emergency accounts. A reviewer reads a change to a file as a change to the tenant.

The files name approvers by alias. `pim-bindings.json`, one per tenant, gives each alias its group's object ID, and names the `PRV` group and scope that holds each role's eligibility. The files carry no tenant's IDs, so the same reviewed files serve a test tenant and production.

`Read-PaPimRoleSetting` refuses a file with a missing key, a name where a template ID belongs, an unknown tier, a duration that isn't ISO 8601, or a second file for the same role. A malformed file never reaches the tenant.

`config/pim-ch04/tiers.json` holds the bounds every file must sit inside. Learn's bounds come first. The role settings page says an activation lasts one to 24 hours, but the PIM API overview says an activation is always at most eight hours.[^pa04-settings] [^pa04-pim-api] The code follows the stricter, eight hours (research gaps, row 41). The tier caps are Appendix B's: four hours for Tier 0, eight for the rest; eligibility of 90, 180 or 365 days; approval for Tier 0 and Tier 1; a ticket for every tier but read-only. *Design guidance.* Appendix B sets the active assignment maximum at "the shortest period the documented exception needs"; the owner has decided it is at most 15 days, `P15D` in every file and `maximumActive` in `tiers.json`, and PA-PIM-04 flags a file that asks for more (research gaps, row 48).

### The rules

`ConvertTo-PaPimRule` turns one file into the seven `PATCH` bodies, in Learn's shapes: the derived `@odata.type`, the rule ID, and the target with Learn's caller and level for that rule.[^pa04-update-rules] [^pa04-rules] Approval is single-stage, with a one-day stage timeout, requester and approver justification, and the tier's group as the only approver. An alias the bindings don't name throws.

### The checks

Before anything is written, `Test-PaPimSetting` and `New-PaPimPlan` report:

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| PA-PIM-01 | Finding | Approval required with no approver | Learn: half of the documented lockout[^pa04-settings] |
| PA-PIM-02 | Finding | Fewer emergency accounts with permanent, active, direct Global Administrator than `emergency-access.json` requires | Learn: the other half;[^pa04-settings] Chapter 02 |
| PA-PIM-03 | Finding | An approver group that is also the role's eligible group | *Design guidance*: [Book 04, Chapter 08](../../../books/b04-access/08-pim-self-request-with-approval.md#approver-design-and-separation-of-duties) |
| PA-PIM-04 | Finding | A file outside Learn's bounds or its tier's cap: activation, eligibility, permanent eligible, active assignments over 15 days, permanent active on any role but Global Administrator, missing approval or ticket | Learn's bounds; Appendix B's caps (*Design guidance*); the owner's 15-day decision |
| PA-PIM-05 | Warn | An authentication context: its Conditional Access policy must be On before the rule is set | Learn[^pa04-settings] |
| PA-PIM-06 | Finding | No policy for the role at tenant scope | — |
| PA-PIM-07 | Finding | An earlier rollout wave that doesn't match its files yet | *Design guidance*: the plan's order |
| PA-PIM-08 | Warn | Eligibility outside the role's `PRV` group | *Design guidance*; the access review removes it (Chapter 07) |
| PA-PIM-09 | Warn; Info | A standing active assignment: a user to convert, or a service principal to document (Warn); an emergency account or a documented exception (Info) | [Book 04, Chapter 08](../../../books/b04-access/08-pim-self-request-with-approval.md#step-5-convert-standing-assignments-to-eligible) |

Any Finding blocks `-Apply`. PA-PIM-05 can't be checked from v1.0: the Conditional Access policy's authentication context target is a beta property.[^pa04-ca-apps] [^pa04-ca-apps-beta] So `-Apply` needs `-ActivationGateChecked`, a person's statement, made after Chapter 03's run shows no PA-CA-04 for `PIM-Activation-c1`, that the policy is On (research gaps, row 44). Chapter 06 asks the same of its Azure role settings.

### The calls and their permissions

Every call goes through one client, built for one task in one cloud. The client sends only the calls `config/calls-ch04.json` declares for the task, follows every page on the cloud's own Graph host, and refuses every method but `GET` unless it was built with `-AllowWrite`. The entry script builds it that way only with `-Apply`. Reads and writes are different tasks, with different permissions:

| Call | Least-privileged permission | Delegated role | Task |
|---|---|---|---|
| List roleManagementPolicyAssignments, with the policy and its rules | `RoleManagementPolicy.Read.Directory`[^pa04-list-rmpa] | Global Reader, Security Operator, Security Reader, Security Administrator or Privileged Role Administrator | all |
| List roleEligibilitySchedules | `RoleEligibilitySchedule.Read.Directory`[^pa04-res-list] | as above | all |
| List roleAssignmentScheduleInstances | `RoleAssignmentSchedule.Read.Directory`[^pa04-rasi] | Global Reader (read) | all |
| Update a policy rule (`PATCH`) | `RoleManagementPolicy.ReadWrite.Directory`[^pa04-update-rule] | Privileged Role Administrator | `pim-apply` |
| Create a roleEligibilityScheduleRequest (`POST`) | `RoleEligibilitySchedule.ReadWrite.Directory`[^pa04-res-request] | Privileged Role Administrator | `pim-apply` |
| Create a roleAssignmentScheduleRequest (`POST`, `adminRemove` only) | `RoleAssignmentSchedule.ReadWrite.Directory`[^pa04-ras-request] | Privileged Role Administrator | `pim-convert` |

Learn's Graph PowerShell guide for the same policies asks for `RoleManagement.ReadWrite.Directory`, and the tutorial for the same, plus `Group.ReadWrite.All`.[^pa04-ps-howto] [^pa04-tutorial] Each is broader than the call needs. The code follows the API reference pages, which name the narrower permission. The removal page lists `RoleAssignmentSchedule.Remove.Directory` as higher privileged than `ReadWrite` (research gaps, row 43). A test keeps each task's permissions equal to the union of its calls, so a dry run's reader app never holds a write permission.

### The diff, the plan and the read-back

`Get-PaPimTenantState` reads each role's policy with Learn's own filter and expand, one call per role, then every eligibility schedule and every active assignment instance.[^pa04-list-rmpa] `Compare-PaPimPolicy` compares the seven rules with the file, after normalizing them: durations as time spans, enabled rules and approvers sorted, and nothing that doesn't apply (no maximum when the rule allows permanent). A role that matches its file has no rows.

`New-PaPimPlan` takes one wave and returns the findings, the diff and the actions: a `PATCH` for each rule that differs, an `adminAssign` eligibility request for each `PRV` group that isn't eligible yet, for the role's maximum, and each standing assignment to convert. It sends nothing. The entry script writes `plan.json`, `diff.csv`, `findings.json`, `before.json` (the wave's rules as the tenant holds them, for the back-out) and a manifest with every request and the SHA-256 of each file.

With `-Apply`, `Invoke-PaPimPlan` sends the rule updates first and the eligibility requests second, so each request meets the role's new expiration rule. The manifest records the SHA-256 of each write's body. Then the script reads the tenant again and writes `verify.csv`, the diff after the change. Learn's pages differ on the response to a rule update, `204 No Content` on the how-to page and `200 OK` with the rule on the API page; the code accepts either, and the read-back is the evidence, not the response (research gaps, row 46).[^pa04-update-rules] [^pa04-update-rule]

### Converting standing assignments

Book 04's order is eligible first, activation confirmed, active removed ([Book 04, Chapter 08](../../../books/b04-access/08-pim-self-request-with-approval.md#step-5-convert-standing-assignments-to-eligible)). The plan lists each standing user assignment with one of three statuses: `WaitingForEligibility` until the role's `PRV` group is eligible in the tenant, `WaitingForConfirmedActivation` until `confirmed-activations.csv` has a row for that person and role with a ticket, and `Confirmed`. Only `-Apply -Convert`, a separate task with its own permission, sends `adminRemove`, and only for `Confirmed` rows. Emergency accounts and documented exceptions are never planned for removal; service principals are reported, not removed. *Design guidance.*

Learn's rules on timing still apply: an assignment can't be removed within five minutes of creation, and PIM won't remove the last active Global Administrator ([Book 04, Chapter 08](../../../books/b04-access/08-pim-self-request-with-approval.md#step-5-convert-standing-assignments-to-eligible)).

### The tests

This chapter's tests are the 50 in `tests/PimEntraRoles.Tests.ps1`: 13 run Learn's samples as published; the rest cover the role files and their refusals, the rules, each check, the client's permissions and refusals, the plan on the fixture, the apply and read-back, the conversion, the back-out, and the entry script. With the other chapters' tests in the example, 330 Pester tests pass under PowerShell 7, with no module, tenant or network.

::: {.callout-important}
## Illustrative code
The commands below send Learn's pinned requests and the example's own to a fake Graph serving a fictional tenant. They show what the code does, not that a tenant returns the same shapes. This code can write to a tenant: review it, review every role file, and run Lab 2 in a test tenant before it touches production.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/privileged-access`.

1. **Send Learn's samples to the fake:**

   ```powershell
   Invoke-Pester -Path tests/PimEntraRoles.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |
       Select-Object PassedCount, FailedCount
   ```

   `PassedCount 13`, `FailedCount 0`. Read the fourth test: with the policy ID from the read, all six of Learn's updates apply, and Application Administrator still differs from its file in six of seven rules.

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

   Exchange Administrator was partly set by hand, so its diff is short: ten rows in three rules. The authentication context goes from off to `c1`; approval goes from not required to required, single-stage, by the `PIM-Approvers-T1` group; and the active maximum goes from 180 days to 15. Its activation window and eligibility expiry already match, so they aren't touched. The findings name Carl Ops and Erin Patel, who hold Tier 1 roles standing; `Contoso-Mail-Automation`, a service principal with Exchange Administrator and no owner on the exceptions list; and Dana Reyes, eligible for Exchange Administrator outside the `PRV` group. The 9 PA-PIM-05 rows ask you to confirm the activation gate. In `plan.json`, Carl's removal waits for his group's eligibility, and Erin's for a confirmed activation.

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

   The first command stops before any write: `The plan sets an authentication context: confirm its Conditional Access policy is On (Chapter 03), then pass -ActivationGateChecked`. The second prints the plan again, then `Applied: 51 requests sent; 0 differences from the role files after reading back`. The fake lives only for the run, so the next run starts from the fixture again; the tests apply, convert and back out in one session.

7. **Run the tests:**

   ```powershell
   Invoke-Pester -Path tests
   ```

**Expected result:** 330 tests passing, and each row of the gap table seen with your own eyes. Delete `out` when you're done.

## Lab 2: test tenant

Use a test tenant in the worldwide or GCC cloud, never production, with Microsoft Entra ID P2 or ID Governance licenses for the test users and approvers. Work one role, in a test copy of the files.

1. **Check the prerequisites.** Run Chapter 02's check against the test tenant's emergency accounts; it must show no Finding. Create authentication context `c1` and turn `PIM-Activation-c1` On, with Chapter 03's code or as [Book 04, Chapter 08, Step 2](../../../books/b04-access/08-pim-self-request-with-approval.md#step-2-build-the-authentication-context-and-its-policy) describes; report-only doesn't count.[^pa04-settings] Chapter 03's run must show no PA-CA-04 for it.
2. **Make the lab's role and groups.** Copy one Tier 1 file into a lab folder: `New-Item -ItemType Directory lab-roles; Copy-Item config/pim-ch04/roles/teams-administrator.json lab-roles/`. In the test tenant, create a security group `PIM-Approvers-T1` with two test approvers, and a role-assignable group `PRV-T1-TeamsAdmin` with one test member. Write `lab-bindings.json` with their object IDs, in the shape of `tests/fixtures/ch04/inputs/pim-bindings.json`.
3. **Register two apps** in the worldwide admin center, each with a certificate: a reader with the three `pim-plan` permissions from Lab 1, step 2, and a writer with the two `pim-apply` write permissions added. Grant admin consent, and nothing else.
4. **Dry-run as the reader:**

   ```powershell
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -ClientId <reader-app-id> -CertificateThumbprint <thumbprint>
   ./Invoke-PaPimRoleSettings.ps1 -Cloud gcc -Wave 1 -RolesPath lab-roles -BindingsPath lab-bindings.json `
       -EmergencyConfigPath emergency-access.json -ExceptionsPath exceptions.csv -OutputPath out/lab-plan -TenantId <tenant-id>
   ```

   Read `diff.csv` and `plan.json` with a second person. Keep the folder.
5. **Apply as the writer**, with the same parameters, `-OutputPath out/lab-apply -Apply -ActivationGateChecked`. The script must end with `0 differences from the role files after reading back`. Open the role's settings in the admin center and compare them with the file. Run step 4 again: the plan should have no rule updates and no eligibility requests. Check any eligibility that was longer than the new maximum before the change (research gaps, row 47).
6. **Activate and convert.** Give a second test user a standing Teams Administrator assignment and add them to `PRV-T1-TeamsAdmin`. As that user, activate the role through the group; one approver approves. Add a row to `confirmed-activations.csv` with a ticket, grant the writer `RoleAssignmentSchedule.ReadWrite.Directory`, and run with `-Apply -Convert -ConfirmedPath confirmed-activations.csv`. The standing assignment goes; the eligibility stays. Wait five minutes after creating an assignment before removing it. To test research gaps, row 43, repeat with `RoleAssignmentSchedule.Remove.Directory` in place of `ReadWrite`.
7. **Back it out.** As the writer, run with `-Apply -RestoreFrom out/lab-apply -OutputPath out/lab-restore`. It puts the role's seven rules back as `before.json` recorded them and removes the eligibility the run created; the read-back then shows the differences from the file again. Give the test user back their standing assignment if the test needs it. Delete the two groups, the two apps and their certificates, and the `out` folders. Keep the authentication context and its policy only if Chapter 03's lab still needs them.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Role settings | Per role, independent of other roles; Privileged Role Administrator to manage | PIM available | GA | [^pa04-settings] [^pa04-availability] |
| Policies and rules | One policy per role at tenant scope; 17 rules with fixed IDs; five derived rule types | — | v1.0 | [^pa04-rules] |
| Find a role's policy | `GET /policies/roleManagementPolicyAssignments`; `$filter` on `scopeId` `/`, `scopeType` `DirectoryRole` (or `Directory`) and `roleDefinitionId`; `$expand=policy($expand=rules)`; `RoleManagementPolicy.Read.Directory` | L4 and L5 | v1.0 | [^pa04-list-rmpa] |
| Update a rule | `PATCH /policies/roleManagementPolicies/{id}/rules/{ruleId}`; the derived `@odata.type` required; `RoleManagementPolicy.ReadWrite.Directory`; Privileged Role Administrator | L4 and L5 | v1.0 | [^pa04-update-rule] [^pa04-update-rules] |
| Authentication context rule | `unifiedRoleManagementPolicyAuthenticationContextRule`: `isEnabled`, `claimValue` | — | v1.0 resource; the admin center option is labeled preview in the mapping guide | [^pa04-authctx-rule] [^pa04-rules] |
| Activation maximum | 1 to 24 hours (role settings); at most 8 hours (PIM API overview) | — | — | [^pa04-settings] [^pa04-pim-api] |
| Approval | At least one approver, two recommended; with none, active Privileged Role and Global Administrators approve; the lockout | — | GA | [^pa04-settings] |
| Context before PIM | The Conditional Access policy must exist and be On first; fallback to MFA only if no policy targets the context | — | — | [^pa04-settings] |
| Context in a policy's conditions | `includeAuthenticationContextClassReferences` on `conditionalAccessApplications` in beta, not v1.0 | — | beta | [^pa04-ca-apps] [^pa04-ca-apps-beta] |
| List eligibility schedules | `RoleEligibilitySchedule.Read.Directory` | L4 and L5 | v1.0 | [^pa04-res-list] |
| Create an eligibility request | `POST /roleManagement/directory/roleEligibilityScheduleRequests`; `adminAssign`, `adminRemove`; `RoleEligibilitySchedule.ReadWrite.Directory` | L4 and L5 | v1.0 | [^pa04-res-request] |
| Expiration rule enforced on requests | A request that breaks the expiration rule returns `400 Bad Request` | — | v1.0 | [^pa04-pim-api] |
| List active instances | `RoleAssignmentSchedule.Read.Directory` | L4 and L5 | v1.0 | [^pa04-rasi] |
| Remove a standing assignment | `POST /roleManagement/directory/roleAssignmentScheduleRequests` with `adminRemove`; `RoleAssignmentSchedule.ReadWrite.Directory`; Privileged Role Administrator | L4 and L5 | v1.0 | [^pa04-ras-request] |
| Graph hosts | GCC `graph.microsoft.com`; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us` | — | — | [^pa04-deployments] |

Where Learn's pages differ, recorded so a later edit doesn't loosen the code:

- **Activation maximum.** One to 24 hours on the role settings page; at most eight hours on the PIM API overview. The code follows the stricter (research gaps, row 41).
- **Authentication context stage.** "(Preview)" in the mapping guide; no label on the role settings page or the v1.0 resource. The chapter treats it as preview (research gaps, row 42).
- **Write permission.** The API reference pages name `RoleManagementPolicy.ReadWrite.Directory` and `RoleEligibilitySchedule.ReadWrite.Directory`; the Graph PowerShell guide and the tutorial ask for `RoleManagement.ReadWrite.Directory`. The code follows the narrower.[^pa04-ps-howto] [^pa04-tutorial]
- **Update response.** `204 No Content` on the how-to page; `200 OK` with the rule on the API page. The code accepts both and reads back (research gaps, row 46).
- **`scopeType`.** The Graph PowerShell guide uses `DirectoryRole` in one step and `Directory` in the next; the list page says both are accepted for Microsoft Entra roles. The code uses `DirectoryRole`, as the how-to page does.[^pa04-list-rmpa] [^pa04-ps-howto]

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Approval switched on before the emergency accounts hold Global Administrator | The documented lockout | PA-PIM-02 reads the tenant and blocks every write |
| Approval with no approver | The default approvers are the people the program keeps eligible | PA-PIM-01 blocks the file |
| The context set before its Conditional Access policy is On | Activation falls back to MFA only if no policy targets the context; an off or report-only policy enforces nothing | PA-PIM-05; `-Apply` needs `-ActivationGateChecked` |
| A write nobody saw | The tenant changes from a copied script | Dry run by default; `-Apply` only from a reviewed plan; a read-only client throws on any write |
| A write identity with read-write on everything | One stolen secret changes every role | Separate tasks and apps; the dry run's app holds no write permission; a test pins each task's permissions |
| A sample copied with another tenant's policy ID | The write fails, or lands on the wrong role | Policy IDs come only from the read |
| Settings set in the portal drift from the files | The control in the tenant isn't the one reviewed | The diff, every run; Chapter 08 can add it to the scheduled run (research gaps, row 88) |
| Eligibility longer than the tier allows | A Tier 2 holder is eligible for a year | `New-PaPimEligibilityRequest` refuses it; the role's rule is set before any request |
| Removing a standing assignment before the person can activate | An administrator is stranded mid-conversion | Removal only after the group is eligible and the activation is confirmed with a ticket |
| Tier 0 changed before the pilot is proven | A mistake hits the control plane first | PA-PIM-07 refuses a wave until earlier waves match |
| A back-out from memory | The rules come back wrong, or not at all | `before.json` from the run, applied with `-RestoreFrom` |
| Names and IDs in the output | The plan names administrators and groups | The output folder is evidence; delete lab copies |

## Checklist

- [ ] Every role file was reviewed by two people, and matches Appendix B or a recorded decision.
- [ ] `pim-bindings.json` names every approver alias and every `PRV` group, and no approver group is eligible for the role it approves.
- [ ] Chapter 02's check shows no Finding, and PA-PIM-02 is clear.
- [ ] `PIM-Activation-c1` is On before any run with `-ActivationGateChecked`.
- [ ] The reader app holds the three `pim-plan` permissions; the writer holds the `pim-apply` writes; only the conversion run holds `RoleAssignmentSchedule.ReadWrite.Directory`.
- [ ] Every apply was preceded by a reviewed dry run, and its `verify.csv` is empty.
- [ ] Every removal of a standing assignment has a confirmed activation and a ticket.
- [ ] Each run folder, with `before.json` and `manifest.json`, is kept as evidence.
- [ ] The pinned Learn pages match their manifest, and every upstream commit since the pin has been reviewed.

::: {.callout-tip}
## Continue the book
[← Chapter 02 — Emergency Access Accounts as Code](02-emergency-access-as-code.md) · [Chapter 01 — Privileged Inventory as Code](01-privileged-inventory-as-code.md) · [Workbook index](index.md)
:::

[^pa04-settings]: Microsoft Learn, "Configure Microsoft Entra role settings in Privileged Identity Management," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings> (accessed Oct 30, 2026).
[^pa04-rules]: Microsoft Learn, "Rules in PIM - mapping guide," <https://learn.microsoft.com/graph/identity-governance-pim-rules-overview> (accessed Oct 30, 2026).
[^pa04-update-rules]: Microsoft Learn, "Update rules in PIM by using Microsoft Graph," <https://learn.microsoft.com/graph/how-to-pim-update-rules> (accessed Oct 30, 2026).
[^pa04-tutorial]: Microsoft Learn, "Assign privileged roles using PIM for Microsoft Entra roles APIs," <https://learn.microsoft.com/graph/tutorial-assign-azureadroles> (accessed Oct 30, 2026).
[^pa04-pim-api]: Microsoft Learn, "Manage Microsoft Entra role assignments by using PIM APIs," methods of assigning roles and role settings and PIM, <https://learn.microsoft.com/graph/api/resources/privilegedidentitymanagementv3-overview?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-list-rmpa]: Microsoft Learn, "List roleManagementPolicyAssignments," <https://learn.microsoft.com/graph/api/policyroot-list-rolemanagementpolicyassignments?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-update-rule]: Microsoft Learn, "Update unifiedRoleManagementPolicyRule," <https://learn.microsoft.com/graph/api/unifiedrolemanagementpolicyrule-update?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-authctx-rule]: Microsoft Learn, "unifiedRoleManagementPolicyAuthenticationContextRule resource type," <https://learn.microsoft.com/graph/api/resources/unifiedrolemanagementpolicyauthenticationcontextrule?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-res-list]: Microsoft Learn, "List roleEligibilitySchedules," <https://learn.microsoft.com/graph/api/rbacapplication-list-roleeligibilityschedules?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-res-request]: Microsoft Learn, "Create roleEligibilityScheduleRequest," <https://learn.microsoft.com/graph/api/rbacapplication-post-roleeligibilityschedulerequests?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-rasi]: Microsoft Learn, "List roleAssignmentScheduleInstances," <https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignmentscheduleinstances?view=graph-rest-1.0> (accessed Oct 30, 2026; read for Chapter 02).
[^pa04-ras-request]: Microsoft Learn, "Create roleAssignmentScheduleRequests," <https://learn.microsoft.com/graph/api/rbacapplication-post-roleassignmentschedulerequests?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-ps-howto]: Microsoft Learn, "Manage PIM policies in Microsoft Graph PowerShell," <https://learn.microsoft.com/powershell/microsoftgraph/how-to-manage-pim-policies?view=graph-powershell-1.0> (accessed Oct 30, 2026).
[^pa04-ca-apps]: Microsoft Learn, "conditionalAccessApplications resource type" (v1.0), <https://learn.microsoft.com/graph/api/resources/conditionalaccessapplications?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa04-ca-apps-beta]: Microsoft Learn, "conditionalAccessApplications resource type" (beta), <https://learn.microsoft.com/graph/api/resources/conditionalaccessapplications?view=graph-rest-beta> (accessed Oct 30, 2026).
[^pa04-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^pa04-availability]: Microsoft Learn, "Microsoft Entra feature availability," Microsoft Entra ID, identity governance, and other Microsoft Entra products, <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 30, 2026).
[^pa04-sample-src]: Microsoft, microsoftgraph/microsoft-graph-docs-contrib, `concepts/how-to-pim-update-rules.md` and `concepts/tutorial-assign-azureadroles.md` at commit `a69303123e9701eecbf56568d152ece936a97f1e` (October 30, 2026; the pages last changed August 29, 2025 and July 3, 2026), code MIT License, documentation CC BY 4.0, <https://github.com/microsoftgraph/microsoft-graph-docs-contrib/tree/a69303123e9701eecbf56568d152ece936a97f1e/concepts> (accessed Oct 30, 2026); pinned copy in `examples/third_party/graph-pim-rules-pages`.
