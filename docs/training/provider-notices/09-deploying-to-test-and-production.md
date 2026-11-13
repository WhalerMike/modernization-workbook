---
title: "Module 9: Deploying to test and production (optional)"
description: "Optional, for whoever deploys the kit: workbook Chapter 08, the deployment runbook, across every gate. One settings file per stage with no secrets, a read-only pre-flight (PF-01 to PF-07), a staged enable one provider at a time, routing as a dry run, a smoke test, Service Health alerts applied with an approved hash, the weekly run on a schedule, the stage's evidence and a rehearsed rollback; the go/no-go; then production, routing as a dry run for its first week. You dry-run the pre-flight, the weekly run, the stage check and the rollback plans on fixtures. About 55 minutes; the runbook hasn't been run against a live tenant."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 9
review-status: approved
reviewed-sha256: 54b7932e1987eaa5d9134dd0ccebe8482a478aba92ebe8b511fba2e66267175d
last-reviewed: 2026-11-09
---
# Module 9: Deploying to test and production (optional) {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Every gate: each step of the runbook names its own. Workbook [Chapter 08](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md). About 55 minutes. Optional: for whoever deploys the kit.*

**Watch:** the narrated deck for this module (about @@Training_PN_Module_9@@ minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_PN_Module_9_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PN_Module_9_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pn-module-9) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-9/Training_PN_Module_9_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-9/Training_PN_Module_9_Narrated.vtt). The deck files join the next edition.

**Also:** the chapter's narrated tour, about @@DW_PN_08_Deploying_Test_Production@@ minutes: [▶ Watch](../../presentations/watch.html?v=DW_PN_08_Deploying_Test_Production_Narrated).

::: {.callout-important}
## Chapter 08 is a runbook nobody has run against a live tenant
Chapter 08 waits for the owner's review, and **nobody has run its runbook against a live tenant, account, tenancy or project** ([status](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#status-a-runbook-nobody-has-run-against-a-live-tenant)). Its deploy scripts have been run only in fixture mode, against a fictional test and production environment, and that dry-run output is real. Every live result in the chapter is labeled **Expected**. This module's Lab 1 runs only the dry run.
:::

## Introduction (3 minutes)

Each provider's Lab 2 proves one provider in isolation. A deployment proves them together, on a schedule, with a rollback someone has already run. The runbook is one set of commands, run twice: once against test tenants, accounts, tenancies and projects, then unchanged against production. Only the settings file changes.

The order puts each step where it can be undone before the next depends on it: reads first, one provider at a time; routing as a dry run before anything is sent; the one write to a cloud, the Service Health alert policy, only after the reads work; and the schedule last. In production, routing stays a dry run for the first week before sending is turned on. In this module you dry-run the scripts that guard that order.

**The federal requirement.** Every runbook step ends with a requirements table, and the kit writes an evidence record for each run. From the chapter's [Requirements, KSIs and evidence](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#requirements-ksis-and-evidence) and its step tables:

| Requirement | KSI | Evidence |
|---|---|---|
| CM-3 b (review proposed changes) | KSI-CMT-LMC, KSI-CMT-RVP | The change record; the settings file's SHA-256 in `results.json` |
| SA-9 c; SR-8 (notification agreements) | KSI-SCR-MON | `preflight/results.json` and its record: every reader works in its own cloud, and each provider's notice contacts are named |
| SA-9 c; SI-5; CA-7; RA-3 f | KSI-SCR-MIT, KSI-SCR-MON, KSI-MLA-EVC | The weekly run's folder and its records; the weekly digest |
| CA-7; AU-9 | KSI-MLA-EVC, KSI-MLA-OSM | The evidence folder, checked with `-Check -Stage` |
| CM-3; CP-2 | KSI-CMT-LMC, KSI-RPL-ARP | `rollback/plan.json`, `results.json` and its record |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Every alignment is the program's reading *(design guidance)*, and the assessor and the authorizing official decide each control. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- describe the settings file's rules: no secrets, no placeholder in an enabled provider, the stage it says it is, and named notice contacts;
- run the pre-flight and the weekly run on fixtures, and read their checks;
- show that the test stage's evidence passes once a pre-flight and a weekly run are recorded, and that production's pre-flight checks it (PF-07);
- read the rollback plan in reverse order, and show that an unapproved hash applies nothing;
- explain the promotion go/no-go, and why production routes as a dry run for its first week.

## Prerequisites (1 minute)

- Modules 1 to 8, or at least their Lab 1s: this module doesn't teach the kit's chapters again.
- [Module 8](08-digest-evidence-and-go-no-go.md), for the evidence chain and the stage check this module passes.

## Unit 1: What the runbook adds (10 minutes)

Read the workbook chapter in this order:

- [What the runbook depends on](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#what-the-runbook-depends-on): the gates, the kit's writes and what isn't in the kit.
- [Before you start](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#before-you-start): the roles, the approvals and the change record.
- [The settings file](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#the-settings-file): the rules `Read-PnSettings` enforces, and the placeholders.
- [The code this chapter uses](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#the-code-this-chapter-uses): four scripts and the module, each with a dry run, and what each may write.

## Unit 2: The stages and the promotion (10 minutes)

Read:

- [Pre-flight checks](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#pre-flight-checks): PF-01 to PF-07.
- [Stage 1: test](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#stage-1-test), Steps 1.1 to 1.9, with the [smoke test](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#step-1.5-smoke-test-g1-to-g7) and the [rollback rehearsal](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#step-1.9-rehearse-the-rollback-g1-g7).
- [Promotion go/no-go criteria](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#promotion-gono-go-criteria): seven rows.
- [Stage 2: production](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#stage-2-production), especially [Step 2.5](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#step-2.5-turn-on-sending-after-the-first-week), and [Evidence the ISSO keeps](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#evidence-the-isso-keeps).

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 08 dry run on the kit's fixtures](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#dry-run-on-the-kits-fixtures), split into steps. It adds the template check (step 1), the records' index (step 6), the unapproved-hash refusal (step 10) and the deploy tests (step 11). Work in `examples/provider-notices`, in PowerShell 7. The test and production environments are fictional: nothing signs in, and nothing is sent.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: Load the deploy module and check the template
Import-Module ./deploy/PnDeploy.psm1 -Force
Read-PnSettings -Path deploy/settings.template.json | Select-Object environment

# Step 2: Run the test stage's pre-flight
./deploy/Test-PnPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -Stage test -FixturePath deploy/tests/fixtures/environment-test.json -OutputPath out/deploy-test/preflight -AsOf 2026-11-09T12:00:00Z

# Step 3: Record the pre-flight as evidence
./Invoke-PnEvidence.ps1 -EvidencePath out/deploy-test/evidence -RunPath out/deploy-test/preflight -AsOf 2026-11-09T12:00:00Z -ChangeRecord CHG-EXAMPLE-0101

# Step 4: Run the weekly run on the day-one fixtures
./deploy/Invoke-PnScheduledRun.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z

# Step 5: Check the test stage's evidence
./Invoke-PnEvidence.ps1 -EvidencePath out/deploy-test/evidence -Check -Stage test

# Step 6: Read the records' index
Import-Csv out/deploy-test/evidence/records.csv | Format-Table sequence, task, result, steps

# Step 7: Plan the test stage's rollback
./deploy/Invoke-PnRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -OutputPath out/deploy-test/rollback -AsOf 2026-11-09T12:00:00Z

# Step 8: Run production's pre-flight with the test stage's evidence
./deploy/Test-PnPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -Stage production -FixturePath deploy/tests/fixtures/environment-production.json -TestEvidencePath out/deploy-test/evidence -OutputPath out/deploy-prod/preflight -AsOf 2026-11-16T12:00:00Z

# Step 9: Plan the Service Health alerts at the production management group
./deploy/New-PnAlertPolicy.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -FixturePath deploy/tests/fixtures/environment-production.json -OutputPath out/deploy-prod/alerts -AsOf 2026-11-16T12:00:00Z

# Step 10: Plan production's rollback, then try to apply it with a hash nobody approved
./deploy/Invoke-PnRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -OutputPath out/deploy-prod/rollback -AsOf 2026-11-16T12:00:00Z
./deploy/Invoke-PnRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -OutputPath out/deploy-prod/rollback -AsOf 2026-11-16T12:00:00Z -Apply -ApprovedSha256 ('0' * 64)

# Step 11: Run the deploy scripts' tests
Invoke-Pester -Path deploy/tests -Output None -PassThru | Select-Object PassedCount, FailedCount, NotRunCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Load the deploy module and check the template:**

    ```powershell
    Import-Module ./deploy/PnDeploy.psm1 -Force
    Read-PnSettings -Path deploy/settings.template.json | Select-Object environment
    ```

    Expect an error: `Exception: Settings deploy/settings.template.json still has a <placeholder> in provider 'azure'.` A filled-in file prints its stage instead.

2. **Run the test stage's pre-flight:**

    ```powershell
    ./deploy/Test-PnPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -Stage test -FixturePath deploy/tests/fixtures/environment-test.json -OutputPath out/deploy-test/preflight -AsOf 2026-11-09T12:00:00Z
    ```

    Fourteen checks, each `Pass`: PF-01, PF-02 to PF-05 for Azure, Microsoft 365 and OCI (the providers the test fixture enables), and PF-06. The last line is `Preflight (test): 14 checks, 0 failed. Written to out/deploy-test/preflight`.

3. **Record the pre-flight as evidence:**

    ```powershell
    ./Invoke-PnEvidence.ps1 -EvidencePath out/deploy-test/evidence -RunPath out/deploy-test/preflight -AsOf 2026-11-09T12:00:00Z -ChangeRecord CHG-EXAMPLE-0101
    ```

    ```text
    Record 1: Pass (PRE, EVIDENCE)
    Controls: AU-9, CA-7, SA-9, SR-8
    KSIs:     KSI-MLA-EVC, KSI-MLA-OSM, KSI-SCR-MON
    Written to out/deploy-test/evidence: records/, runs/, records.csv, SHA256SUMS
    ```

4. **Run the weekly run on the day-one fixtures:**

    ```powershell
    ./deploy/Invoke-PnScheduledRun.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z
    ```

    ```text
    RUN-COLLECT  Pass  15 notices from azure, m365, oci
    RUN-ROUTE    Pass  8 create, 0 update, 0 close; dry run
    RUN-DIGEST   Pass  13 open, 5 need action
    Runs: out/deploy-test/runs/20261109T120000Z. Evidence: out/deploy-test/evidence
    ```

5. **Check the test stage's evidence:**

    ```powershell
    ./Invoke-PnEvidence.ps1 -EvidencePath out/deploy-test/evidence -Check -Stage test
    ```

    ```text
    SUMS           Pass  31 files match SHA256SUMS
    CHAIN          Pass  5 records, chain unbroken
    STEP-PRE       Pass  a passing record covers it
    STEP-RUN       Pass  a passing record covers it
    STEP-ROUTE     Pass  a passing record covers it
    STEP-DIGEST    Pass  a passing record covers it
    ```

    The two rows Module 8's lab failed now pass: the pre-flight and the weekly run are recorded.

6. **Read the records' index:**

    ```powershell
    Import-Csv out/deploy-test/evidence/records.csv | Format-Table sequence, task, result, steps
    ```

    ```text
    sequence task          result steps
    -------- ----          ------ -----
    1        preflight     Pass   PRE EVIDENCE
    2        collect       Pass   COL-AZURE COL-M365 COL-OCI NORMALIZE EVIDENCE
    3        route         Pass   ROUTE CONTINGENCY EVIDENCE
    4        digest        Pass   DIGEST EVIDENCE
    5        scheduled-run Pass   RUN EVIDENCE
    ```

7. **Plan the test stage's rollback:**

    ```powershell
    ./deploy/Invoke-PnRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -OutputPath out/deploy-test/rollback -AsOf 2026-11-09T12:00:00Z
    ```

    One step, `RB-01  WouldApply`, which unregisters the scheduled task `ProviderNotices-Weekly-Test` if it exists; then `Plan SHA-256: 3c8915c265b260885c7931f75f1c17fd2a0ce9f4fd891379a0746ad98a4c32bf` and `Dry run: nothing changed.`

8. **Run production's pre-flight with the test stage's evidence:**

    ```powershell
    ./deploy/Test-PnPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -Stage production -FixturePath deploy/tests/fixtures/environment-production.json -TestEvidencePath out/deploy-test/evidence -OutputPath out/deploy-prod/preflight -AsOf 2026-11-16T12:00:00Z
    ```

    Twenty-three checks, each `Pass`: all five providers, ending `PF-07           Pass  the test stage's evidence passes` and `Preflight (production): 23 checks, 0 failed.` PF-07 runs in production only.

9. **Plan the Service Health alerts at the production management group:**

    ```powershell
    ./deploy/New-PnAlertPolicy.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -FixturePath deploy/tests/fixtures/environment-production.json -OutputPath out/deploy-prod/alerts -AsOf 2026-11-16T12:00:00Z
    ```

    `AL-01` and `AL-02`, each `WouldApply`, and `Plan SHA-256: 6a1ec6adbd50bc2cec2bcc803ee45629bc0a0d7de416fcafd3216db443a4a3b7`: the same plan as Module 2's step 5.

10. **Plan production's rollback, then try to apply it with a hash nobody approved:**

    ```powershell
    ./deploy/Invoke-PnRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -OutputPath out/deploy-prod/rollback -AsOf 2026-11-16T12:00:00Z
    ./deploy/Invoke-PnRollback.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -OutputPath out/deploy-prod/rollback -AsOf 2026-11-16T12:00:00Z -Apply -ApprovedSha256 ('0' * 64)
    ```

    The plan, in reverse order:

    ```text
    RB-01  WouldApply  pwsh Get-ScheduledTask -TaskName 'ProviderNotices-Weekly' -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false
    RB-02  WouldApply  az policy assignment delete --name pn-service-health-alerts --scope /providers/Microsoft.Management/managementGroups/mg-contoso-example
    RB-03  Manual      az group list --query [?name=='rg-serviceHealthAlert']

    Plan SHA-256: 1278f8275edaf48f33b8b23d02bb3736f574cebfa1f4191248ffda5628fb93e6
    Dry run: nothing changed.
    ```

    RB-03 is manual: the change record decides on what the remediation created. The second command is refused: `Exception: The plan's SHA-256 is 1278f8275edaf48f33b8b23d02bb3736f574cebfa1f4191248ffda5628fb93e6; -ApprovedSha256 must match it before -Apply runs anything.`

11. **Run the deploy scripts' tests:**

    ```powershell
    Invoke-Pester -Path deploy/tests -Output None -PassThru | Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 25`, `FailedCount 0`, `NotRunCount 0`, on Windows: one of the 25 runs only there. The tests sit outside `tests/`, so the 140 Module 8 counts doesn't change.

Delete the dry run's folders when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, the test stage, then production (5 minutes to read)

*Not run by anyone yet.* Follow the workbook's [Stage 1: test](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#stage-1-test), after [Before you start](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#before-you-start) and [The settings file](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#the-settings-file). It has the exact commands. Then, only when every [go/no-go criterion](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#promotion-gono-go-criteria) passes, [Stage 2: production](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#stage-2-production).

- **You need:** a test environment for each provider the agency enables, never production, with each reader already granted in its module's Lab 2; an approved change record; a person who can create policy and role assignments for the alert policy; a reviewer who isn't the operator to approve each plan's hash; and a Windows account for the scheduled run.
- **What you do:** fill and check the settings file, sign in each reader, run the pre-flight, enable the providers one at a time with a cross-check each, route as a dry run, run the smoke test, apply the alert policy with its approved hash, schedule the weekly run, check the stage's evidence and rehearse the rollback.
- **Back-out:** [Step 1.9](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#step-1.9-rehearse-the-rollback-g1-g7) applies the approved rollback: the scheduled task unregistered and the policy assignment deleted. The resources the remediation created stay until the change record decides on them, and the state, runs and evidence are kept.

## Knowledge check (5 minutes)

1. What changes between the test stage and production?
    a. The commands
    b. Only the settings file
    c. The kit's version
    d. The evidence format
2. Why does the runbook enable one provider at a time?
    a. The kit can't read two providers at once
    b. A failure in one would hide the others; each is cross-checked against the provider's own command before they run together
    c. Licensing
    d. To save time
3. Production's pre-flight fails PF-07. What does that mean?
    a. A provider's tool isn't installed
    b. The test stage's evidence doesn't pass `-Check -Stage test`, so production can't start
    c. The output root isn't writable
    d. Sending is turned on
4. Why does production route as a dry run for its first week?
    a. The endpoint can't be built until then
    b. So duplicate or misrouted tasks don't reach the queue; the service desk works from the payloads by hand, and sending is turned on after the change manager approves
    c. Payloads are invalid in the first week
    d. Providers publish nothing in the first week
5. Someone runs the rollback with `-Apply` and a hash nobody approved. What happens?
    a. It applies the plan anyway
    b. It deletes the resources the remediation created
    c. It refuses: `-ApprovedSha256` must match the plan's SHA-256 before `-Apply` runs anything
    d. It writes a new plan

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in the chapter's [In this chapter](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#in-this-chapter) and [The settings file](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#the-settings-file).
2. **b.** Taught in [Step 1.3](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#step-1.3-staged-enable-one-provider-at-a-time-g1-to-g5) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#dangers).
3. **b.** Taught in [Pre-flight checks](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#pre-flight-checks).
4. **b.** Taught in [Step 2.2](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#step-2.2-staged-enable-in-production-g1-to-g6), [Step 2.5](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#step-2.5-turn-on-sending-after-the-first-week) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#dangers).
5. **c.** Taught in [What the runbook depends on](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#what-the-runbook-depends-on) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#dangers).
:::

## Summary (2 minutes)

You saw the template refused, passed the test pre-flight, recorded it, ran the weekly run, passed the test stage's evidence check, planned both rollbacks, passed production's pre-flight with PF-07, planned the alerts at the management group, and watched an unapproved hash apply nothing.

**The evidence an ISSO keeps** for the deployment: each stage's evidence folder (`records/`, `runs/`, `records.csv`, `SHA256SUMS`), with the change record, the settings file and its SHA-256, the approved plan hashes and the weekly digests filed beside it, on agency storage. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#checklist).

**Back to:** the [learning path](index.md).
