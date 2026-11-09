---
title: "Attribute-Driven Migration, Module 9: Deploy to Test, then Production"
subtitle: "Take the kits past the chapters' test-tenant steps with one settings file per stage, a pre-flight check, a smoke test that says go or no-go, a rollback written from a record of every change, and the evidence the ISSO keeps"
description: "Research draft: Module 9 of the Attribute-Driven Migration learning path. You learn what the deployment runbook adds to the chapters, its settings file and three identities, the live test stage, the promotion criteria and production in waves, then dry-run the five deploy scripts on fixtures: the pre-flight check, recorded changes and their rollback plan, the smoke test, the evidence check and a production pre-flight that refuses to promote. Every gate, through Book 19, Chapter 10's step-to-gate map; the chapter is held for review and hasn't been run against a live tenant."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 9
date-modified: 2026-11-02
review-status: approved
reviewed-sha256: ef7e5e4d893e42768ae097fbddec0672b59af5355dce07236d802293254ca04d
last-reviewed: 2026-11-07
---
# Attribute-Driven Migration, Module 9: Deploy to Test, then Production {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 9 of 9 · 50 minutes · Gates 2 to 5 and 7 to 9, through the [step-to-gate map](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#step-to-gate-map) · Workbook [Chapter 10](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_ADM_Module_9.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_ADM_Module_9_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ADM_Module_9_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-9/Training_ADM_Module_9_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-9/Training_ADM_Module_9_Narrated.vtt).

::: {.callout-important}
## Chapter 10 is held for review
Chapter 10 waits for the owner's review, and **nobody has run its runbook against a live tenant, subscription or forest.** Its five deploy scripts are tested against fixtures, and their dry-run output is real. Every other result in the chapter is an expectation, not an observation. This module's Lab 1 runs only the dry runs.
:::

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

Each chapter's Lab 2 changes the smallest thing it can, by hand, and backs it out. That proves one kit in isolation. A deployment runs all nine kits in a safe order, reads every value from one settings file per stage, records every change with its rollback, and ends with a go or no-go record that production's pre-flight check verifies. The order is the guide's: prove the attributes first, build groups and workflows paused or disabled, target by attribute, cut over by wave, then keep the attributes true. In this module you dry-run the scripts that enforce it.

**The federal requirement.** Every runbook step has a requirements table, and every step leaves an evidence record that names its controls and KSIs. From [Chapter 10](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#requirements-ksis-and-evidence):

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| CM-3(2): the settings, kits, identities and cloud are checked before any change ([pre-flight](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#pre-flight-checks)) | KSI-CMT-VTD, KSI-CMT-LMC | `preflight.json`, dry and live, and its evidence record |
| IA-5 for non-user accounts; AC-6: no secret in the settings file, and three certificate identities with only what each step needs | KSI-IAM-SNU, KSI-IAM-ELP | `preflight.json` rows PF-02 and PF-05; the identities' grants in the change record |
| CM-4(2) Verification of Controls; CA-7: after the change, the gates' checks are read again and the answer is go or no-go (step 9) | KSI-CMT-LMC, KSI-CMT-VTD, KSI-MLA-EVC | `smoke/smoke-report.json` and the after run of the validation kit |
| AU-9; SI-7: one evidence package with a SHA-256 per file, verified (step 10) | KSI-MLA-OSM, KSI-SVC-VRI | The package, its `SHA256SUMS` and the verify output |
| CM-3: every change recorded with its rollback, written newest first and, in the test stage, run (step 11) | KSI-CMT-LMC, KSI-CMT-RVP | `deploy-record.json`, the rollback scripts and their transcripts |

: Chapter 10's requirements, KSIs and evidence for this module {.striped .hover}

KSIs are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines its evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Chapter 10 uses only KSI IDs this workbook already maps to the same controls.

### Learning objectives

In this module, you'll:

- Explain the four ways a deployment differs from a chapter's Lab 2.
- Describe the settings file, the placeholders and the three identities.
- Run the pre-flight check, and say which checks it runs dry and which live.
- Record changes and read the rollback plan they produce.
- Explain why a fixture smoke test can never promote, and what production's pre-flight check verifies.

### Prerequisites

- Modules 1 to 8, or at least their Lab 1s: this module doesn't teach the kits again.
- Python 3.10 or later with pytest, and a POSIX shell with `sha256sum`.

## Unit 2: What the runbook adds

*10 minutes*

One settings file per stage, with no secrets, so the same commands run against test and production. Three identities with a certificate each, plus one named delegated step where Learn allows nothing else. Every change recorded, and the rollback written from the record. A go or no-go record before production, then waves. Read:

- [Chapter 10: what this runbook adds to the chapters](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#what-this-runbook-adds-to-the-chapters).
- [Before you start](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#before-you-start), including [the identities and what each may do](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#the-identities-and-what-each-may-do).
- [One environment settings file](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#one-environment-settings-file).

## Unit 3: The stages and the promotion

*8 minutes*

The live test stage deploys every component in an order where nothing grants access before it has been checked, and drills the rollback. Production needs a live, passing test smoke report and evidence check whose hashes are in its settings file, and the CISO's and identity engineering's approvals. Then it runs in waves, leaver first, with a week of drift monitoring. Read:

- [Stage 1: live test](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#stage-1-live-test), its order table.
- [Promotion go/no-go criteria](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#promotion-go-no-go-criteria).
- [Stage 2: production](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#stage-2-production) and [evidence the ISSO keeps](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#evidence-the-isso-keeps).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*20 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/drift-pipeline`. Each step below says what it does and what to look for.

```bash
# Step 1: Start clean
rm -rf out

# Step 2: Run the test stage's pre-flight check
python deploy/preflight.py --settings deploy/tests/fixtures/test.json --other deploy/tests/fixtures/production.json

# Step 3: Record four changes the way the stage steps do, then write the rollback
S=deploy/tests/fixtures/test.json
python deploy/rollback.py add --settings $S --kind provisioning-job --id API2AAD.00000000000000000000000000000000.44444444-4444-4444-8444-444444444401
python deploy/rollback.py add --settings $S --kind dynamic-group --id 88888888-8888-4888-8888-888888888801 --name "FIN ledger employees"
python deploy/rollback.py add --settings $S --kind gpo-link-created --id FMP-Workstation-Baseline --name "OU=ADM-Test,DC=test,DC=contoso,DC=example"
python deploy/rollback.py add --settings $S --kind policy-assignment --id adm-mc-tls-audit --name /subscriptions/22222222-2222-4222-8222-222222222201/resourceGroups/rg-adm-test
python deploy/rollback.py plan --settings $S

# Step 4: Run the smoke test
E=out/deploy-evidence/test/CHG-TEST-0101
python deploy/smoke_test.py --settings $S --fixture --kit-run tests/fixtures/runs/current/2026-10-29-0617-fixture-runner-fixture \
  --hcm-provenance tests/fixtures/provenance/hcm-entra/provenance.json --dynamic-rules tests/fixtures/provenance/dynamic-rules/check-results.json \
  --mc-provenance tests/fixtures/provenance/machine-configuration/provenance.json --mc-mode Audit --deploy-record $E/deploy-record.json --out $E/smoke

# Step 5: Check the stage's evidence
python deploy/evidence.py check --settings $S
(cd $E/evidence && sha256sum -c SHA256SUMS)

# Step 6: Ask production's pre-flight check to promote
python deploy/preflight.py --settings deploy/tests/fixtures/production.json --other $S --test-smoke-report $E/smoke/smoke-report.json --test-evidence-check $E/evidence-check.json

# Step 7: Run the deploy scripts' tests
python -m pytest deploy/tests -q

# Step 8: Clean up
rm -rf out
```

:::

<!-- labs:end -->

You dry-run the five deploy scripts against the kits' fixtures. Work in `examples/drift-pipeline`, in a POSIX shell, and start with no `out` folder. Nothing signs in and nothing is called. These are the commands of [Chapter 10: try the scripts against fixtures first](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#try-the-scripts-against-fixtures-first), which shows the full output.

1. **Start clean.**

   ```bash
   rm -rf out
   ```

2. **Run the test stage's pre-flight check.**

   ```bash
   python deploy/preflight.py --settings deploy/tests/fixtures/test.json --other deploy/tests/fixtures/production.json
   ```

   Expected: `PASS` on `PF-01` to `PF-10`, the live probes printed as `DRY`, and the last two lines:

   ```text
   preflight: 0 failed, 0 warning(s); dry run (nothing signed in, nothing called)
   evidence 001-preflight.json: preflight pass
   ```

3. **Record four changes the way the stage steps do, then write the rollback.**

   ```bash
   S=deploy/tests/fixtures/test.json
   python deploy/rollback.py add --settings $S --kind provisioning-job --id API2AAD.00000000000000000000000000000000.44444444-4444-4444-8444-444444444401
   python deploy/rollback.py add --settings $S --kind dynamic-group --id 88888888-8888-4888-8888-888888888801 --name "FIN ledger employees"
   python deploy/rollback.py add --settings $S --kind gpo-link-created --id FMP-Workstation-Baseline --name "OU=ADM-Test,DC=test,DC=contoso,DC=example"
   python deploy/rollback.py add --settings $S --kind policy-assignment --id adm-mc-tls-audit --name /subscriptions/22222222-2222-4222-8222-222222222201/resourceGroups/rg-adm-test
   python deploy/rollback.py plan --settings $S
   ```

   Expected: each `add` records its change and writes an evidence record. The plan lists the four undo steps newest first, then:

   ```text
   rollback plan: 4 step(s), newest first: 3 cloud, 1 ad
   wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-cloud.ps1
   wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-ad.ps1
   wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-manual.md
   evidence 006-rollback.json: rollback plan recorded
   nothing was run: review the scripts, then run them in a signed-in session
   ```

4. **Run the smoke test** on the fixture validation kit run and the other kits' fixture provenance:

   ```bash
   E=out/deploy-evidence/test/CHG-TEST-0101
   python deploy/smoke_test.py --settings $S --fixture --kit-run tests/fixtures/runs/current/2026-10-29-0617-fixture-runner-fixture \
     --hcm-provenance tests/fixtures/provenance/hcm-entra/provenance.json --dynamic-rules tests/fixtures/provenance/dynamic-rules/check-results.json \
     --mc-provenance tests/fixtures/provenance/machine-configuration/provenance.json --mc-mode Audit --deploy-record $E/deploy-record.json --out $E/smoke
   ```

   Expected: exit 2, and a last line that starts `smoke test: NO-GO (5 failed) for test/CHG-TEST-0101, fixture mode`. The fixtures carry findings on purpose. The report's hash changes with each run, because the report records when it ran.

5. **Check the stage's evidence**, and let `sha256sum` confirm the records:

   ```bash
   python deploy/evidence.py check --settings $S
   (cd $E/evidence && sha256sum -c SHA256SUMS)
   ```

   Expected: exit 2, with `OK` only for `R-PF-1` and `R-PF-2`, and `evidence check: 2 of 17 requirement rows evidenced for test/CHG-TEST-0101; FAIL`. Then every record reads `OK` under `sha256sum`. A `recorded` change proves it was written down, not that the step worked.

6. **Ask production's pre-flight check to promote** on that report and that check:

   ```bash
   python deploy/preflight.py --settings deploy/tests/fixtures/production.json --other $S --test-smoke-report $E/smoke/smoke-report.json --test-evidence-check $E/evidence-check.json
   ```

   Expected: `PASS PF-09`, then `FAIL PF-10`: the hashes aren't the ones in `promotion`, the smoke report failed and ran in fixture mode, and the evidence check failed. The last lines are `preflight: 1 failed, 0 warning(s); dry run (nothing signed in, nothing called)` and `evidence 001-preflight.json: preflight fail`.

7. **Run the deploy scripts' tests.**

   ```bash
   python -m pytest deploy/tests -q
   ```

   Expected: `46 passed`.

8. **Clean up.**

   ```bash
   rm -rf out
   ```

**Check your work:** for a stage, you can say which evidence rows are proved, why a fixture run can never promote, and what production's pre-flight check needs before it passes.

## Unit 5: Exercise: Lab 2 (the live test stage)

*Not timed. Not run by anyone yet.*

Load the test stage's settings, sign in as the deploy identity, run the pre-flight check dry and live, then follow the twelve steps of [Stage 1: live test](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#stage-1-live-test): baseline evidence, the HR middleware, dynamic rules, Lifecycle Workflows created disabled, Group Policy as code, machine configuration in audit, Ansible in check mode, the drift pipeline, the smoke test, the evidence package, the rollback drill and the evidence check.

- **You need:** an Entra test tenant, an Azure test subscription with Arc-enabled test servers, and a test AD forest, never production; the three identities and the objects listed in [made before the runbook starts](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#made-before-the-runbook-starts).
- **One check by hand:** the smoke test reads an app-only run of the validation kit, and VK-DG-03 is delegated only, so the smoke test lets it end unverified. That is a documented exception: at the first live run, the Groups Administrator signs in and runs VK-DG-03 by hand, as [step 9b](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#step-9-smoke-test) shows, and its result is a `smoke` evidence record. A failed hand check holds promotion.
- **Back it out:** [step 11](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#step-11-roll-back) runs the rollback written from the record, newest first, and the validation kit afterwards should match the baseline.

## Unit 6: Knowledge check

*5 minutes*

1. The smoke test runs on fixtures with `--fixture`. Can its report promote to production?
   a. Yes, if it says GO.
   b. No: production's pre-flight check needs a live, passing test run, and a fixture record proves nothing about the stage.
   c. Yes, with the CISO's approval.

2. `rollback.py add` writes an evidence record for a step. Why does the evidence check still mark that row missing?
   a. The record is `recorded`: it proves the change was written down, not that the step worked.
   b. The record has no hash.
   c. The rollback hasn't run yet.

3. Why does the runbook use three identities instead of one?
   a. Graph limits each app to a few permissions.
   b. One identity that can do everything is one credential that can break everything.
   c. Each stage needs its own.

4. What does production's pre-flight check compare the test smoke report against?
   a. Nothing: it reads the report's result.
   b. The SHA-256 recorded in `promotion.test_smoke_report_sha256`, and the report's result, mode and stage.
   c. The validation kit's last run.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [promotion go/no-go criteria](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#promotion-go-no-go-criteria) and steps 4 and 6 of the lab.
2. **a.** See [try the scripts against fixtures first](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#try-the-scripts-against-fixtures-first) and step 5 of the lab.
3. **b.** The chapter marks it as design guidance. See [the identities and what each may do](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#the-identities-and-what-each-may-do).
4. **b.** See [promotion go/no-go criteria](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#promotion-go-no-go-criteria), criteria 1 and 2.
:::

## Unit 7: Summary

*2 minutes*

You dry-ran the runbook's own scripts: a pre-flight check, changes recorded with their rollback, a smoke test that says no-go on fixtures, an evidence check against the requirement rows, and a production pre-flight that refuses to promote without a live, passing test stage.

**Evidence an ISSO keeps from this module:** for each stage, the settings file and its hash, `preflight.json`, the validation kit runs before and after, each kit's outputs, `smoke-report.json`, the evidence package and its verify result, `deploy-record.json` and the rollback scripts, and the `evidence/` folder with `evidence-check.json`; for production, the promotion record and seven days of chained drift packages per wave. The full table is [evidence the ISSO keeps](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#evidence-the-isso-keeps). Before you run a stage, work through the [Chapter 10 checklist](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#checklist).

::: {.callout-tip}
## You've finished the path
[Previous: Module 8](08-drift-and-evidence.md) · [Learning path](index.md) · [Labs](../labs.md#adm)
:::
