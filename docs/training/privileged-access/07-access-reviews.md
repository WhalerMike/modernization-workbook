---
title: "Module 7: Access reviews of privileged roles"
description: "Workbook Chapter 07 and the plan's A2.7 and A3.7: define every privileged access review series as reviewed JSON (Entra roles, PRV group membership, Azure roles in preview), check each body (PA-AR-01 to PA-AR-14, including the guard that keeps the emergency accounts' Global Administrator on silence), dry-run and diff before -Apply, never delete, and read the decisions back as evidence (PA-AR-E01 to PA-AR-E08). About 55 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 04"
series-order: 7
review-status: approved
reviewed-sha256: fc81ecbfedfe3d91bf745c60fe65dca16a624d83b4200c79906b0ee53208accd
last-reviewed: 2026-11-03
---
# Module 7: Access reviews of privileged roles {.unnumbered}

*Part of the [Privileged Access learning path](index.md). Plan Phase 2, task A2.7, and Phase 3, task A3.7. Workbook [Chapter 07](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md). About 55 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.4/Training_PA_Module_7.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_PA_Module_7_Narrated) (about 13 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PA_Module_7_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-7/Training_PA_Module_7_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pa-module-7/Training_PA_Module_7_Narrated.vtt).

## Introduction (3 minutes)

The approval gate controls the use of privilege. Reviews control who keeps the eligibility. Book 04 creates one recurring review per role, Tier 0 monthly and the rest quarterly, with auto-apply on and "remove access" when reviewers don't respond. A review set up by hand drifts: a reviewer leaves, a duration is shortened, auto-apply is switched off for one cycle and never back on.

In this module you define every privileged review series as code. You show a reviewer what a change will do before it reaches the tenant, apply it with the least permission that can, and hand the ISSO the decisions each review produced.

::: {.callout-important}
## The lockout check for this module
The emergency accounts hold Global Administrator as permanent active assignments. A review of Global Administrator that covers active assignments, with "remove access" on silence and auto-apply on, removes them if the reviewers miss one month.

- **PA-AR-06** fails a review that would do that. A review that covers the emergency accounts' Global Administrator uses "no change" on silence, and an unreviewed item becomes an evidence finding instead (PA-AR-E04). That's the owner's decision, and [Book 04, Chapter 08's Step 8](../../books/b04-access/08-pim-self-request-with-approval.md#step-8-access-reviews-of-eligibility) records the exception.
- **PA-AR-E08** reports an emergency account that a reviewer denied.
- `-Apply` refuses a plan with any Finding, and the code never deletes a series: deleting a definition deletes its decisions, which are evidence.
:::

**The federal requirement.** The review series and their decisions are the evidence for the plan's tasks A2.7 and A3.7. They support NIST SP 800-53 AC-6(7) (review of user privileges), AC-2 (account review), AC-5 (separation of duties) and AU-11 (retention). AC-6(7) and AC-2 leave the frequency to the organization; monthly for Tier 0 and quarterly for the rest is the program's decision D-A6 *(design guidance)*. The full table is the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#federal-requirements-and-evidence).

| Requirement | KSI | Evidence |
|---|---|---|
| AC-6(7) and AC-2: every privileged role and PRV group has a series with reviewers who aren't the assignees, a fallback, auto-apply, justification and the tier's cadence | KSI-IAM-AAM, KSI-IAM-JIT | PA-AR-01, 02, 05, 08, 09 and 14 in `findings.json` |
| AC-6(7), AC-2 and AC-5: each decision, and what went wrong | KSI-IAM-AAM, KSI-IAM-JIT | `decisions.csv`, `instances.json`, and PA-AR-E01 to E08 in `findings.json` |
| AC-2: the emergency accounts stay usable | KSI-IAM-JIT | The PA-AR-06 refusal |
| CM-3: what a run would change, and an apply that never deletes | KSI-CMT-LMC, KSI-CMT-RMV | `plan.json` and `bodies/`; `results.json` |
| AU-11: the evidence exported before a series is deleted | KSI-MLA-OSM | The exported evidence folder, in the evidence store |
| AC-6, least privilege for each identity | KSI-IAM-ELP | `AccessReview.Read.All` and Reader to plan and read evidence; write only to apply |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain why privileged reviews belong in code, and what licensing they need;
- name the series the program defines and the cadence for each tier;
- explain the PA-AR-06 guard and why it changes the program's own setting;
- read a plan's actions: Create, Update, Replace, NoChange, Unmanaged and Conflict;
- read the evidence findings, PA-AR-E01 to PA-AR-E08.

## Prerequisites (1 minute)

- [Module 2](02-emergency-access-first.md): the emergency accounts PA-AR-06 protects.
- [Module 5](05-pim-for-groups.md): the PRV groups, each reviewed through its own membership series.

## Unit 1: Why reviews, and the series (8 minutes)

Read the chapter's [Why reviews, and why as code](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#why-reviews-and-why-as-code) and [What it costs, and where it runs](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#what-it-costs-and-where-it-runs). The program budgets Microsoft Entra ID Governance for every reviewer and every reviewed privileged user, the stricter of two Learn pages.

Then read [The reviewed JSON](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-reviewed-json) and [The bodies](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-bodies). Note:

- Seven series follow [Book 04, Chapter 09's schedule](../../books/b04-access/09-access-governance.md#cadence): Entra roles, PRV group membership (PIM for Groups reviews are in preview), and an Azure role series through a preview API.
- A role series covers users. Groups that hold the role are reviewed through their own membership series, and PA-AR-14 flags a group without one.

## Unit 2: The checks, the plan and the evidence (10 minutes)

Read three sections:

- [The checks](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-checks): PA-AR-01 to PA-AR-14. PA-AR-01 is the first: no reviewers means Graph treats the review as a self-review.
- [The dry run, the diff and `-Apply`](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-dry-run-the-diff-and--apply): a scope change or a change of group reviewers is a Replace, which needs a person, because the update API doesn't take it.
- [The evidence](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-evidence): each decision becomes a row, and eight checks find missing series, overdue instances, denials not applied, silent defaults, approvals without a reason, self-reviews, bulk decisions, and a denied emergency account.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#lab-1-fixtures-no-tenant). Work in `examples/privileged-access`, in one PowerShell 7 session.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/privileged-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run Learn's tutorial against the fake
Invoke-Pester -Path tests/AccessReviews.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount

# Step 2: List each task's permissions
Import-Module ./powershell/PaAccessReviews/PaAccessReviews.psm1
'access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence' | ForEach-Object { Get-PaArRequiredPermission -Task $_ } |
    Format-Table Task, GraphPermissions, AzureRoles

# Step 3: Run the dry run
./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Plan -ConfigPath tests/fixtures/ch07/access-reviews.json `
    -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-plan

# Step 4: Read the diff
Get-Content out/reviews-plan/plan.json -Raw | ConvertFrom-Json | Format-Table name, action, @{ n = 'changes'; e = { $_.changes -join ', ' } }

# Step 5: Check Learn's body with the example's rules
. ./tests/AccessReviewsSampleHarness.ps1
Test-PaArDefinition -Body (Get-ArTutorialCreateRequest).Body -AsOf 2026-10-30 | Format-Table Rule, Severity

# Step 6: Apply in the fake
./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Plan -ConfigPath tests/fixtures/ch07/access-reviews.json `
    -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-apply -Apply
Get-Content out/reviews-apply/results.json -Raw | ConvertFrom-Json | Format-Table Name, Action, Result, Note

# Step 7: Read the evidence
./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Evidence -ConfigPath tests/fixtures/ch07/access-reviews.json `
    -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-evidence
Get-Content out/reviews-evidence/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object

# Step 8: See the lockout guard
$c = Read-PaArConfig tests/fixtures/ch07/access-reviews.json
($c.reviews | Where-Object name -EQ 'PAR-T0-GlobalAdministrator-Monthly').defaultDecision = 'Deny'
$client = New-PaArClient -Cloud gcc -Task access-reviews-apply -Invoke (New-PaArFake -Path tests/fixtures/ch07/tenant.json).Invoke
Invoke-PaArApply -Client $client -Plan (Get-PaArPlan -Client $client -Config $c -AsOf 2026-10-30) -Apply

# Step 9: Run the tests, then delete out
Invoke-Pester -Path tests
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Run Learn's tutorial against the fake:**

    ```powershell
    Invoke-Pester -Path tests/AccessReviews.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount
    ```

    ```text
    PassedCount FailedCount
    ----------- -----------
             11           0
    ```

    The third test shows the tutorial's POST, sent twice, leaves two series with the same name.

2. **List each task's permissions:**

    ```powershell
    Import-Module ./powershell/PaAccessReviews/PaAccessReviews.psm1
    'access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence' | ForEach-Object { Get-PaArRequiredPermission -Task $_ } |
        Format-Table Task, GraphPermissions, AzureRoles
    ```

    ```text
    Task                    GraphPermissions             AzureRoles
    ----                    ----------------             ----------
    access-reviews-plan     {AccessReview.Read.All}      {Reader}
    access-reviews-apply    {AccessReview.ReadWrite.All} {User Access Administrator}
    access-reviews-evidence {AccessReview.Read.All}      {Reader}
    ```

3. **Run the dry run:**

    ```powershell
    ./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Plan -ConfigPath tests/fixtures/ch07/access-reviews.json `
        -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-plan
    ```

    ```text
    Plan: 1 Create, 2 Update, 1 Replace, 3 NoChange, 1 Unmanaged
    Checks: 0 Finding, 1 Warn, 1 Info
    Dry run: nothing sent (2 write(s) would be sent with -Apply)
    Written to out/reviews-plan (manifest.json lists every request and file hash)
    ```

4. **Read the diff:**

    ```powershell
    Get-Content out/reviews-plan/plan.json -Raw | ConvertFrom-Json | Format-Table name, action, @{ n = 'changes'; e = { $_.changes -join ', ' } }
    ```

    ```text
    name                                       action    changes
    ----                                       ------    -------
    PAR-T0-GlobalAdministrator-Monthly         Update    settings.instanceDurationInDays
    PAR-T0-PrivilegedRoleAdministrator-Monthly Create
    PAR-T1-ExchangeAdministrator-Quarterly     Replace   reviewers
    PAR-PRV-T0-GlobalAdmin-Monthly             NoChange
    PAR-PRV-T0-PrivRoleAdmin-Monthly           NoChange
    PAR-PRV-T1-ExchangeAdmin-Quarterly         NoChange
    PAR-AZ-T0-Owner-Platform-Monthly           Update    settings.instanceDurationInDays
    PAR-T0-SecurityAdministrator-Monthly       Unmanaged
    ```

    The two writes the dry run counts are the Graph ones; the Azure update needs `-IncludePreview`. `bodies/` holds each request body for review.

5. **Check Learn's body with the example's rules:**

    ```powershell
    . ./tests/AccessReviewsSampleHarness.ps1
    Test-PaArDefinition -Body (Get-ArTutorialCreateRequest).Body -AsOf 2026-10-30 | Format-Table Rule, Severity
    ```

    ```text
    Rule     Severity
    ----     --------
    PA-AR-02 Finding
    PA-AR-03 Finding
    PA-AR-05 Finding
    PA-AR-07 Warn
    PA-AR-10 Warn
    ```

6. **Apply in the fake:**

    ```powershell
    ./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Plan -ConfigPath tests/fixtures/ch07/access-reviews.json `
        -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-apply -Apply
    Get-Content out/reviews-apply/results.json -Raw | ConvertFrom-Json | Format-Table Name, Action, Result, Note
    ```

    ```text
    Plan: 1 Create, 2 Update, 1 Replace, 3 NoChange, 1 Unmanaged
    Checks: 0 Finding, 1 Warn, 1 Info
    Applied: 2 write(s) sent; Replace and Unmanaged series are left for a person
    Written to out/reviews-apply (manifest.json lists every request and file hash)
    Name                                       Action    Result  Note
    ----                                       ------    ------  ----
    PAR-T0-GlobalAdministrator-Monthly         Update    Sent    read back
    PAR-T0-PrivilegedRoleAdministrator-Monthly Create    Sent    read back
    PAR-T1-ExchangeAdministrator-Quarterly     Replace   Skipped needs a person: export its evidence, delete it in the portal, rerun
    PAR-PRV-T0-GlobalAdmin-Monthly             NoChange  Skipped matches the tenant
    PAR-PRV-T0-PrivRoleAdmin-Monthly           NoChange  Skipped matches the tenant
    PAR-PRV-T1-ExchangeAdmin-Quarterly         NoChange  Skipped matches the tenant
    PAR-AZ-T0-Owner-Platform-Monthly           Update    Skipped Azure role reviews use a preview API; pass -IncludePreview
    PAR-T0-SecurityAdministrator-Monthly       Unmanaged Skipped not in the reviewed JSON; never deleted
    ```

7. **Read the evidence:**

    ```powershell
    ./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Evidence -ConfigPath tests/fixtures/ch07/access-reviews.json `
        -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-evidence
    Get-Content out/reviews-evidence/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object
    ```

    ```text
    Evidence: 18 decisions in 7 instances; 7 Finding, 2 Warn
    Written to out/reviews-evidence (manifest.json lists every request and file hash)
    Rule      Severity Object
    ----      -------- ------
    PA-AR-E01 Finding  PAR-T0-PrivilegedRoleAdministrator-Monthly
    PA-AR-E02 Finding  PAR-PRV-T0-GlobalAdmin-Monthly
    PA-AR-E08 Finding  PAR-T0-GlobalAdministrator-Monthly / Emergency Access 02
    PA-AR-E04 Finding  PAR-T0-GlobalAdministrator-Monthly / Frank Ode
    PA-AR-E05 Finding  PAR-T1-ExchangeAdministrator-Quarterly / Carl Ops
    PA-AR-E03 Finding  PAR-T1-ExchangeAdministrator-Quarterly / Frank Ode
    PA-AR-E04 Warn     PAR-T1-ExchangeAdministrator-Quarterly / Gina Lee
    PA-AR-E06 Finding  PAR-PRV-T0-GlobalAdmin-Monthly / Bo Chen
    PA-AR-E07 Warn     PAR-T1-ExchangeAdministrator-Quarterly / reviewer a0000000-0000-4000-8000-000000000013
    ```

    PA-AR-E08: a reviewer denied `Emergency Access 02` in October. The chapter's step 7 explains each row.

8. **See the lockout guard:**

    ```powershell
    $c = Read-PaArConfig tests/fixtures/ch07/access-reviews.json
    ($c.reviews | Where-Object name -EQ 'PAR-T0-GlobalAdministrator-Monthly').defaultDecision = 'Deny'
    $client = New-PaArClient -Cloud gcc -Task access-reviews-apply -Invoke (New-PaArFake -Path tests/fixtures/ch07/tenant.json).Invoke
    Invoke-PaArApply -Client $client -Plan (Get-PaArPlan -Client $client -Config $c -AsOf 2026-10-30) -Apply
    ```

    ```text
    Exception: Refusing -Apply: the plan has 1 Finding(s): PA-AR-06 PAR-T0-GlobalAdministrator-Monthly
    ```

    Nothing is sent.

9. **Run the tests, then delete `out`:**

    ```powershell
    Invoke-Pester -Path tests
    Remove-Item -Recurse -Force out
    ```

    `Tests Passed: 330, Failed: 0`. Delete `out` because the evidence folder names people.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by this path's authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#lab-2-test-tenant) in a test tenant in the worldwide or GCC cloud with Microsoft Entra ID Governance (a trial will do) and, for the optional Azure step, a test Azure subscription. Never production. Pick a role with no real holders, such as Reports Reader, not Global Administrator.

- **What you do:** register a reader app and an applier app, write a test JSON with one series, dry-run as the reader, apply after a second person reads `bodies/`, close one instance as a test reviewer, and read the evidence.
- **Permissions:** `AccessReview.Read.All` for the reader; `AccessReview.ReadWrite.All` for the applier; User Access Administrator only for the optional Azure series.
- **Back-out:** step 7 exports the evidence first, then deletes the test series in the admin center (the code never deletes), the apps, their certificates and the test groups, and deletes `out/t-*`.

## Knowledge check (5 minutes)

1. A Global Administrator review covers active assignments, with "Deny" on silence and auto-apply on. What does PA-AR-06 do?
    a. Nothing; Deny is the program's default.
    b. Fails it, because missing one month would remove the emergency accounts' Global Administrator.
    c. Turns auto-apply off.
    d. Removes the emergency accounts from the review.
2. A review definition has no reviewers. Why is that a Finding?
    a. Graph rejects it.
    b. Graph treats no reviewers as a self-review, and assignees never review themselves.
    c. It can't be scheduled.
    d. It costs more licenses.
3. The plan shows a series as Replace. What does `-Apply` do with it?
    a. Deletes and recreates it.
    b. Skips it: the update API doesn't take a new scope or new group reviewers, so a person exports its evidence and replaces it.
    c. PUTs the new scope.
    d. Marks it Unmanaged.
4. What does PA-AR-E04 report?
    a. A reviewer who approved their own access.
    b. An item not reviewed in a closed instance, so the no-response default decided.
    c. A series missing from the tenant.
    d. A denial that didn't apply.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [The checks](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-checks), the paragraph after the table, and seen in Lab 1, step 8.
2. **b.** Taught in [The checks](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-checks) (PA-AR-01).
3. **b.** Taught in [The dry run, the diff and `-Apply`](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-dry-run-the-diff-and--apply), and seen in Lab 1, step 6.
4. **b.** Taught in [The evidence](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#the-evidence).
:::

## Summary (2 minutes)

You planned seven review series against a fictional tenant, saw Learn's tutorial body fail the program's rules, applied two writes and left the Replace and the unmanaged series to a person, read 18 decisions and their findings, and saw the lockout guard refuse a review that would remove the emergency accounts.

**The evidence an ISSO keeps:** the reviewed JSON and each plan's `bodies/`; each apply's `results.json`; and each evidence run's `decisions.csv`, `instances.json` and `findings.json`, in the access-controlled evidence store, because they name people. The full list is in the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#federal-requirements-and-evidence); before the code ships, work through its [checklist](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#checklist).

**Next:** [Module 8: Evidence and drift for the ISSO](08-evidence-and-drift.md).
