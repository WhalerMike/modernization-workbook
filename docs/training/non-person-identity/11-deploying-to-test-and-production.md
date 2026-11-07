---
title: "Module 11: Deploy to test, then production"
description: "Workbook Chapter 11, the deployment runbook, across every gate: one settings file per stage with no secret, a read-only preflight, a safe order from inventory to report-only Conditional Access, a smoke test on synthetic objects, an evidence record for every requirement row, a rollback approved by its SHA-256 and rehearsed in test, the go/no-go criteria, then production in waves. You dry-run four of the five deploy scripts on fixtures and see a fixture stage refused at the evidence check. About 60 minutes, with a lab on fixtures and a pointer to the live test and production stages; the chapter hasn't been run against a live tenant."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 11
review-status: approved
reviewed-sha256: 62bbe034bd8c6d79e42c055ded94c95f5052c67b9dfce6eb705a4f27f70d5f56
last-reviewed: 2026-11-07
---
# Module 11: Deploy to test, then production {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Every gate: each step of the runbook names its own. Workbook [Chapter 11](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md). About 60 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.4/Training_NPI_Module_11.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_11_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_11_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-11/Training_NPI_Module_11_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-11/Training_NPI_Module_11_Narrated.vtt).

The chapter has no narrated tour yet.

::: {.callout-important}
## Chapter 11 is held for review
Chapter 11 waits for the owner's review, and **nobody has run its runbook against a live tenant, subscription or forest** ([status](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#status-a-runbook-nobody-has-run-against-a-live-tenant)). Its deploy scripts are tested against fictional tenants served by a fake, and their dry-run output is real. Every live result in the chapter is labeled **Expected**. This module's Lab 1 runs only the dry run.
:::

## Introduction (3 minutes)

Each chapter's Lab 2 proves one piece in a test tenant, by hand, and backs it out. A deployment proves them together, in an order that can be undone, against an environment someone depends on. The runbook is one set of commands, run twice: against an Entra test tenant, an Azure test subscription and an Active Directory test forest, then unchanged against production. Only the settings file changes.

The order puts what can block a sign-in last: inventory and owners, the app management policy scoped to a pilot and a synthetic app, a federated credential and a managed identity beside the old secret, a gMSA on a test host, and Conditional Access for workload identities in report-only mode. In this module you dry-run the scripts that guard that order.

**The federal requirement.** Every runbook step ends with a requirements table, and the kit writes an evidence record for each row. From the chapter's [Requirements, KSIs and evidence](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#requirements-ksis-and-evidence) and its step tables:

| Requirement | KSI | Evidence |
|---|---|---|
| CM-3 Configuration Change Control; CM-5; AC-5 | KSI-CMT-LMC (CM-3); KSI-IAM-JIT (CM-5, AC-5) | `S0-change-record-approvals-and-settings-file.json`: the change record and the settings file's SHA-256 |
| IA-5, IA-5(2), IA-9; AC-6, AC-6(5) | KSI-IAM-SNU; KSI-IAM-ELP (none cites IA-9) | `PRE-preflight.json`, PF-02 and PF-05: the deployment identity with no secret, the reader app with reads only |
| CA-7, CM-2; CM-3(2), CM-4(2) | KSI-MLA-EVC; KSI-CMT-VTD | `PRE-preflight.json`, PF-09 and PF-08: the VK-NPI baseline before the change, workload policies not enforced |
| AC-2, CM-8, IA-4; IA-5, IA-9; AC-3, AC-6; AU-2, AU-12 | KSI-PIY-GIV, KSI-IAM-SNU, KSI-IAM-ELP, KSI-MLA-LET, KSI-MLA-EVC (none cites IA-9) | `SMOKE-smoke-test.json`: ST-01 to ST-07 on the synthetic objects |
| AU-9 Protection of Audit Information | KSI-MLA-OSM | `SHA256SUMS`, checked by `Test-NpiDeployEvidence.ps1` |
| CM-3; CP-10 System Recovery and Reconstitution | KSI-CMT-RMV, KSI-RPL-ABO | `ROLLBACK-rollback.json`, written by an applied rollback; a dry run records `DryRun`, which the go/no-go doesn't accept |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Every alignment is the program's reading *(design guidance)*, and the assessor and the authorizing official decide each control. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain what the runbook adds to each chapter's Lab 2, and why the policies that can block a sign-in come last;
- describe the settings file's rules: no secret, no placeholder, and the stage it says it is;
- run the preflight, the smoke test and the rollback plan on fixtures, and read their checks;
- show that a rollback plan whose SHA-256 nobody approved sends nothing;
- explain why a fixture stage can never pass the evidence check, and what production's preflight needs from the test stage.

## Prerequisites (1 minute)

- Modules 1 to 10, or at least their Lab 1s: this module doesn't teach the kit's chapters again. The runbook runs Chapters 01, 02, 04, 05, 08 and 10 in order, and does Chapter 06's gMSA step by hand.
- [Module 10](10-drift-and-evidence.md), for the evidence package and the first-week drift runs that production ends with.

## Unit 1: What the runbook adds (10 minutes)

Read the workbook chapter in this order:

- [What the runbook depends on](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#what-the-runbook-depends-on): the guide's gates, the two environments and the safe order.
- [Before you start](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#before-you-start): the roles activated through PIM, the approvals and the change record.
- [The environment settings file](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#the-environment-settings-file): the four rules and the placeholders.
- [The code this chapter adds](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#the-code-this-chapter-adds): five scripts, each with a fixture mode, and what each may write.

## Unit 2: The stages and the promotion (10 minutes)

The live test stage prepares synthetic objects, runs the preflight, deploys in the safe order, runs the smoke test, captures the evidence and rehearses the rollback, then deploys again. Production starts only when every go/no-go criterion is signed, and enables Conditional Access one wave at a time. Read:

- [Prepare the stage](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#prepare-the-stage) and [Pre-flight checks](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#pre-flight-checks): PF-01 to PF-11 and the KDS root key.
- [Stage 1: live test](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#stage-1-live-test), Steps 1.1 to 1.8, with the [smoke test](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#step-1.6-smoke-test) and the [rollback](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#step-1.8-roll-back-the-test-stage).
- [Promotion go/no-go criteria](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#promotion-gono-go-criteria): nine rows, each signed.
- [Stage 2: production](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#stage-2-production) and [Evidence the ISSO keeps](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#evidence-the-isso-keeps).

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Chapter 11 dry run on the kit's fixtures](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#dry-run-on-the-kits-fixtures), which shows the full output. Work in `examples/non-person-identity`, in PowerShell 7. The test and production tenants are fictional and served by a fake: nothing signs in, and nothing is sent.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Load the deploy module and check the template
Import-Module ./deploy/NpiDeploy.psm1 -Force
Read-NpiDeploySettings -Path deploy/settings.template.json -Stage test

# Step 2: Run the test stage's preflight
./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -BaselinePath tests/fixtures/deploy/vk-baseline.json -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-preflight

# Step 3: Run the smoke test
./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -RegisterRun tests/fixtures/deploy/register-run -ExpectCaState ReportOnly -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-smoke

# Step 4: Plan the rollback
./deploy/Invoke-NpiDeployRollback.ps1 -Mode Plan -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -SnapshotPath out/dryrun/test-preflight/snapshot.json -To Disabled -IncludeSmokeCleanup -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback

# Step 5: Apply the plan with a hash nobody approved
./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -PlanPath out/dryrun/test-rollback/rollback-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback-refused

# Step 6: Dry-run the rollback with the approved hash
$sha = (Get-FileHash out/dryrun/test-rollback/rollback-plan.json -Algorithm SHA256).Hash.ToLower()
./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -PlanPath out/dryrun/test-rollback/rollback-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback-dry

# Step 7: Run production's preflight
./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.production.json -Stage production -BaselinePath tests/fixtures/deploy/vk-baseline.json -PromotionEvidencePath out/dryrun/test-smoke -FixturePath tests/fixtures/deploy/tenant-production.json -OutputPath out/dryrun/prod-preflight -EvidencePath out/dryrun/evidence-production

# Step 8: Check the test stage's evidence
./deploy/Test-NpiDeployEvidence.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -EvidencePath out/dryrun/evidence

# Step 9: Read the evidence records
Get-ChildItem out/dryrun/evidence -Filter *.json | ForEach-Object { $r = Get-Content $_.FullName -Raw | ConvertFrom-Json; '{0}: {1}; KSIs {2}' -f $_.Name, $r.result, ($r.ksis -join ', ') }

# Step 10: Run the deploy scripts' tests
Invoke-Pester -Path deploy/tests -Output None -PassThru | Select-Object PassedCount, FailedCount, NotRunCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Load the deploy module and check the template:**

    ```powershell
    Import-Module ./deploy/NpiDeploy.psm1 -Force
    Read-NpiDeploySettings -Path deploy/settings.template.json -Stage test
    ```

    Expect an error, `The settings file deploy/settings.template.json isn't usable:`, then every problem at once, starting with `environment: placeholder <test-or-production> not replaced`. A filled-in file prints one line instead.

2. **Run the test stage's preflight:**

    ```powershell
    ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -BaselinePath tests/fixtures/deploy/vk-baseline.json -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-preflight
    ```

    Expect `Preflight (Fixture, test, CHG-2026-1102-T): 12 Pass, 1 Warn`. The Warn is `PF-06`: the fixture's Conditional Access administrator holds a standing assignment, not a PIM-eligible one, which the preflight reports but doesn't block. Then `Evidence: PRE-preflight.json (Warn)`, `Evidence: S0-change-record-approvals-and-settings-file.json (Pass)` and `Result: GO for this stage.`

3. **Run the smoke test** against the synthetic service principal and service account:

    ```powershell
    ./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -RegisterRun tests/fixtures/deploy/register-run -ExpectCaState ReportOnly -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-smoke
    ```

    Expect `8 Pass`, ST-01 to ST-07, then `Evidence: SMOKE-smoke-test.json (Pass)` and `Result: PASS.` ST-03's refusal says `(fixture) ... (real code unverified)`: Learn doesn't give the error an app management policy returns.

4. **Plan the rollback** from the preflight's snapshot, with the synthetic objects' cleanup:

    ```powershell
    ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Plan -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -SnapshotPath out/dryrun/test-preflight/snapshot.json -To Disabled -IncludeSmokeCleanup -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback
    ```

    Expect `Rollback plan (test, to Disabled): 7 action(s)`, RB-01 to RB-07, and `Plan SHA-256 for the reviewer: 2d365b3052a6db5e5f134937f011974afe132f790e607b21e9de8d071ca29ed2`. No action is a delete.

5. **Apply the plan with a hash nobody approved:**

    ```powershell
    ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -PlanPath out/dryrun/test-rollback/rollback-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback-refused
    ```

    Expect an error: `The plan's SHA-256 is 2d365b30…, not the approved 00000000…. Nothing was sent.`

6. **Dry-run the rollback with the approved hash:**

    ```powershell
    $sha = (Get-FileHash out/dryrun/test-rollback/rollback-plan.json -Algorithm SHA256).Hash.ToLower()
    ./deploy/Invoke-NpiDeployRollback.ps1 -Mode Apply -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -PlanPath out/dryrun/test-rollback/rollback-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/deploy/tenant-test.json -OutputPath out/dryrun/test-rollback-dry
    ```

    Expect `Rollback DryRun (Fixture, test): 7 WouldApply`, with both workload policies `enabledForReportingButNotEnforced -> disabled`, and `Evidence: ROLLBACK-rollback.json (DryRun)`. Without `-Apply` it sends nothing. In a real stage, a reviewer who isn't the operator passes you the hash.

7. **Run production's preflight** with the test smoke test as its promotion evidence:

    ```powershell
    ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.production.json -Stage production -BaselinePath tests/fixtures/deploy/vk-baseline.json -PromotionEvidencePath out/dryrun/test-smoke -FixturePath tests/fixtures/deploy/tenant-production.json -OutputPath out/dryrun/prod-preflight -EvidencePath out/dryrun/evidence-production
    ```

    Expect `Preflight (Fixture, production, CHG-2026-1116-P): 14 Pass`, with `PF-11 Pass   Promotion Test stage smoke test passed, in another tenant: test, tenant c0ffee00-0000-4000-8000-0000000000e1, 8/8 Pass`. PF-11 runs in production only.

8. **Check the test stage's evidence:**

    ```powershell
    ./deploy/Test-NpiDeployEvidence.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test -EvidencePath out/dryrun/evidence
    ```

    Expect `4 of 9 requirement rows present and passing`: `PRE`, `S0`, `SMOKE` and `EVIDENCE` present; `S1.1`, `S1.2`, `S1.3` and `S1.5` missing, because those steps record their evidence only when they run against a tenant; `ROLLBACK` failing on `DryRun`. The last line is `Result: NO-GO on evidence.`, with exit code 1. That's right for a dry run.

9. **Read the evidence records** and the KSIs each one names:

    ```powershell
    Get-ChildItem out/dryrun/evidence -Filter *.json | ForEach-Object { $r = Get-Content $_.FullName -Raw | ConvertFrom-Json; '{0}: {1}; KSIs {2}' -f $_.Name, $r.result, ($r.ksis -join ', ') }
    ```

    Expect four lines: `PRE-preflight.json: Warn`, `ROLLBACK-rollback.json: DryRun` with `KSI-CMT-RMV, KSI-RPL-ABO`, `S0-change-record-approvals-and-settings-file.json: Pass` with `KSI-CMT-LMC, KSI-IAM-JIT`, and `SMOKE-smoke-test.json: Pass`.

10. **Run the deploy scripts' tests:**

    ```powershell
    Invoke-Pester -Path deploy/tests -Output None -PassThru | Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 55`, `FailedCount 0`, `NotRunCount 0`. The tests sit outside `tests/`, so the 513 every other module's Lab 1 counts doesn't change.

Delete the dry run's folder when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, the live test stage, then production (5 minutes to read)

*Not run by anyone yet.* Follow the workbook's [Stage 1: live test](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#stage-1-live-test), after [Prepare the stage](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#prepare-the-stage) and the [Pre-flight checks](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#pre-flight-checks). It has the exact commands. Then, only when every [go/no-go criterion](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#promotion-gono-go-criteria) is signed, [Stage 2: production](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#stage-2-production).

- **You need:** an Entra test tenant with Workload ID Premium and Entra ID P1 or P2, an Azure test subscription and an Active Directory test forest, never production; an approved change record; the reader app and the deployment identity, each with a certificate; operators eligible for their roles through PIM; and the second labs of Chapters 01, 04, 05, 06 and 08 already run.
- **What you do:** fill in and check the settings file, create the synthetic objects and the pilot policy, run the preflight, deploy Steps 1.1 to 1.5, run the smoke test, capture the evidence, rehearse the rollback, deploy again and check the evidence.
- **Back-out:** [Step 1.8](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#step-1.8-roll-back-the-test-stage) applies the approved rollback (workload policies disabled, the tenant default app management policy restored, the pilot policy off, the legacy account re-enabled), uninstalls the gMSA on the host, and checks the tenant against the baseline. The kit never deletes.

## Knowledge check (5 minutes)

1. Why does the runbook enable Conditional Access for workload identities last, and only in report-only mode in test?
    a. Workload ID Premium is licensed last
    b. It's the control that can block a sign-in; Learn lets it run report-only to estimate its effect, and production enables it wave by wave after a reviewed sign-in summary
    c. It depends on the gMSA
    d. Graph creates it only in production
2. Learn documents no report-only mode for app management policies. What keeps the pilot policy safe?
    a. Nothing; it waits for production
    b. The scope: two applications, the pilot and the synthetic, and a policy blocks only the create or update that breaks it, so existing secrets keep working
    c. It's created turned on
    d. The smoke test turns it off
3. The rollback's plan SHA-256 isn't the one the reviewer approved. What does `-Mode Apply` do?
    a. Applies the plan and warns
    b. Stops before it sends anything: `Nothing was sent.`
    c. Asks for the hash again
    d. Rewrites the plan
4. In the dry run, why does `Test-NpiDeployEvidence.ps1` end `NO-GO on evidence`?
    a. The smoke test failed
    b. Steps 1.1 to 1.5 record evidence only against a tenant, and a dry-run rollback records `DryRun`, which the go/no-go doesn't accept
    c. A hash in `SHA256SUMS` changed
    d. The preflight had a Warn
5. What does production's preflight need from the test stage before PF-11 passes?
    a. Nothing; it reads the production tenant only
    b. The test smoke test, passing every check, in another tenant
    c. The CISO's approval
    d. The test evidence folder's `SHA256SUMS`

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [What the runbook depends on](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#what-the-runbook-depends-on), the safe order.
2. **b.** Taught in [What the runbook depends on](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#what-the-runbook-depends-on) and the chapter's [Dangers](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#dangers).
3. **b.** Taught in the chapter's [dry run](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#dry-run-on-the-kits-fixtures) and step 5 of the lab.
4. **b.** Taught in the chapter's [dry run](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#dry-run-on-the-kits-fixtures) and step 8 of the lab.
5. **b.** Taught in [Pre-flight checks](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#pre-flight-checks), PF-11, and the [go/no-go criteria](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#promotion-gono-go-criteria).
:::

## Summary (2 minutes)

You dry-ran the runbook's own scripts: a settings file refused for its placeholders, a preflight that says go with one Warn, a smoke test on synthetic objects, a rollback plan refused without its approved hash and dry-run with it, a production preflight that checks the test stage's smoke test, and an evidence check that says no-go on a fixture stage.

**The evidence an ISSO keeps** for each stage: the evidence folder with one record per requirement row (`PRE`, `S0`, `S1.1`, `S1.2`, `S1.3`, `S1.5`, `SMOKE` and `ROLLBACK` in test; `S2.3` and `S2.5` as well in production), the run folders they cover, the operator's input files, and `SHA256SUMS`, which the ISSO checks with `sha256sum -c`. The full table is [Evidence the ISSO keeps](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#evidence-the-isso-keeps). Before you run a stage, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/11-deploying-to-test-and-production.md#checklist).

**Next:** you've finished the path. Go back to the [learning path](index.md), or the [Labs](../labs.md#npi) page for every lab in the workbook.
