---
title: "Module 8: Digest, evidence and go/no-go"
description: "Gate G7 and workbook Chapter 07, with the runbook's promotion criteria: write the weekly digest the owners read (open notices by provider, action required by due date, the next 30 days, new and closed), record every run as hashed evidence chained to the record before it, check the chain and a stage's coverage the way a go/no-go does, and catch a file edited after it was recorded. About 60 minutes, with a lab on fixtures and a lab on a test environment's runs."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 8
review-status: approved
reviewed-sha256: e377ce936db6d2fa1e372999114ec73508282d8e1cbc44af845eba6611051a41
last-reviewed: 2026-11-09
---
# Module 8: Digest, evidence and go/no-go {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G7 Digest and evidence. Workbook [Chapter 07](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md). About 60 minutes.*

**Watch:** the narrated deck for this module (about 14 minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_PN_Module_8_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PN_Module_8_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pn-module-8) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-8/Training_PN_Module_8_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-8/Training_PN_Module_8_Narrated.vtt). The deck files join the next edition.

**Also:** the chapter's narrated tour, about 12 minutes: [▶ Watch](../../presentations/watch.html?v=DW_PN_07_Weekly_Digest_Evidence_Narrated).

## Introduction (3 minutes)

Most notices shouldn't be tasks. The weekly digest is how the owners see the rest, and how they see what needs action and by when. Its natural home is a standing review: the service desk supervisor's weekly look at the queue and the change advisory board's agenda, where the next 30 days of maintenance and changes belong. The evidence is what the ISSO keeps: every run recorded with the controls and KSIs it supports, every file's hash, and the hash of the record before it, so a changed file or a removed week shows.

In this module you write a week's digest, record three runs, check the chain, see a lab stage fail the go/no-go for the steps it never ran, and catch a file edited after it was recorded.

**The federal requirement.** Gate G7 supports SI-5 c, SA-9 c, RA-3 f, CA-7 and AU-9, and the pre-flight's named contacts support SR-8. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 7](../../books/guides/provider-notices-implementation.md#step-7-digest-and-evidence) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SI-5 c; SA-9 c; RA-3 (risk assessment), part f | KSI-SCR-MON, KSI-SCR-MIT | `digest.md`, `digest.csv`, each week |
| CA-7; AU-9 (protection of audit information) | KSI-MLA-EVC, KSI-MLA-OSM | `records/`, `records.csv`: each run with its steps, controls and KSIs, every file's hash and the previous record's hash |
| AU-9 | KSI-MLA-OSM | `SHA256SUMS` and `-Check`: the folder unchanged since it was recorded, and a change caught |
| CA-7 | KSI-MLA-EVC | `-Check -Stage`: each of the stage's steps has a passing record, or the gap is named |
| SA-9; SR-8 (notification agreements) | KSI-SCR-MON | The pre-flight's `results.json`, PF-05: who receives each provider's notices is named (Module 9) |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Each evidence record carries that sentence as its claim. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- write the weekly digest and read its five sections as an owner would;
- record a collection, a routing run and a digest as evidence, and say which steps, controls and KSIs each record names;
- check the evidence chain and `SHA256SUMS`, and show that an edit after recording fails both;
- check a stage's coverage, and name the steps a test stage and a production stage need;
- read the runbook's promotion go/no-go criteria, and say which ones the evidence check answers.

## Prerequisites (1 minute)

- [Module 7](07-routing-to-owners.md): this lab repeats its two collections and routings.

## Unit 1: The digest and its readers (8 minutes)

Read:

- Book 15's [The weekly digest](../../books/b15-day2-operations/14-provider-notices.md#the-weekly-digest): who reads it, where it belongs, and the two numbers worth watching over time.
- The guide's [Step 7](../../books/guides/provider-notices-implementation.md#step-7-digest-and-evidence), and its [Evidence](../../books/guides/provider-notices-implementation.md#evidence) table, gate by gate.
- The workbook's [The digest](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#the-digest): the five sections and their windows.

## Unit 2: The evidence chain and the go/no-go (12 minutes)

Read:

- The workbook's [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#what-it-leaves-to-you) and [The evidence record](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#the-evidence-record): what each record holds, the steps each kind of run covers, and what `-Check -Stage` needs (test: `PRE`, `RUN`, `ROUTE`, `DIGEST`; production adds `ALERTS`).
- The runbook's [Promotion go/no-go criteria](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#promotion-gono-go-criteria): seven rows, from the stage's evidence to the known gaps recorded with the ISSO.
- The workbook's [Dangers](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#dangers): a run that stops silently, a file edited later, a record removed, and a pass read as a control decision.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Chapter 07, Lab 1](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/provider-notices`, in PowerShell 7.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: Make a week of runs
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1
./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z -OutputPath out/day2
./Invoke-PnRoute.ps1 -NoticesPath out/day2/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day2-route -AsOf 2026-11-16T12:00:00Z

# Step 2: Write the digest for the second week
./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z

# Step 3: Read it as the owners will
Get-Content out/digest/digest.md

# Step 4: Record three runs as evidence
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2 -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2-route -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/digest -AsOf 2026-11-16T12:00:00Z

# Step 5: Check the chain
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check

# Step 6: Check the test stage's coverage
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check -Stage test

# Step 7: Read the records' index
Import-Csv out/evidence/records.csv | Format-Table sequence, task, result, steps

# Step 8: Change a recorded file and check again
Add-Content -Path out/evidence/runs/0003-digest/digest.md -Value 'edited after it was recorded'
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check

# Step 9: Run the kit's whole test suite
Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Make a week of runs.** Module 7's two collections and routings, in one go:

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1
    ./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z -OutputPath out/day2
    ./Invoke-PnRoute.ps1 -NoticesPath out/day2/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day2-route -AsOf 2026-11-16T12:00:00Z
    ```

    The same output as Module 7's steps 3, 4 and 7: 22 notices and 13 creates, then 23 notices and `Payloads: 1 create, 4 update, 2 close`.

2. **Write the digest for the second week:**

    ```powershell
    ./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z
    ```

    ```text
    Digest: 16 open, 8 need action, 5 starting in the next 30 days, 2 new, 4 closed or no longer listed
    Written to out/digest: digest.md, digest.csv, manifest.json
    ```

3. **Read it as the owners will:**

    ```powershell
    Get-Content out/digest/digest.md
    ```

    Five sections. In **Action required**, soonest first: the EC2 instance retirement on `2026-12-01`, the OCI certificate bundle change on `2026-12-15`, and so on to the Azure retirement on `2027-09-30`, each with the group it was routed to; the two with no date sit at the bottom as `not stated`. The Google Cloud row of the first table is all zeros: both its incidents closed.

4. **Record three runs as evidence:**

    ```powershell
    ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2 -AsOf 2026-11-16T12:00:00Z
    ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2-route -AsOf 2026-11-16T12:00:00Z
    ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/digest -AsOf 2026-11-16T12:00:00Z
    ```

    Expect `Record 1: Pass (COL-AZURE, COL-M365, COL-OCI, COL-AWS, COL-GOOGLE, NORMALIZE, EVIDENCE)`, `Record 2: Pass (ROUTE, CONTINGENCY, EVIDENCE)` and `Record 3: Pass (DIGEST, EVIDENCE)`, each with its controls and KSIs. The routing run adds CP-2 and KSI-RPL-ARP, because a payload asked for a contingency plan review.

5. **Check the chain:**

    ```powershell
    ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check
    ```

    ```text
    SUMS           Pass  26 files match SHA256SUMS
    CHAIN          Pass  3 records, chain unbroken
    ```

6. **Check the test stage's coverage:**

    ```powershell
    ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check -Stage test
    ```

    ```text
    SUMS           Pass  26 files match SHA256SUMS
    CHAIN          Pass  3 records, chain unbroken
    STEP-PRE       Fail  no passing record
    STEP-RUN       Fail  no passing record
    STEP-ROUTE     Pass  a passing record covers it
    STEP-DIGEST    Pass  a passing record covers it
    ```

    The command exits 1. A lab has no pre-flight or scheduled run, so the go/no-go's first criterion fails, which is right. Module 9 runs both.

7. **Read the records' index:**

    ```powershell
    Import-Csv out/evidence/records.csv | Format-Table sequence, task, result, steps
    ```

    Three rows: `collect`, `route` and `digest`, each `Pass`.

8. **Change a recorded file and check again:**

    ```powershell
    Add-Content -Path out/evidence/runs/0003-digest/digest.md -Value 'edited after it was recorded'
    ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check
    ```

    ```text
    SUMS           Fail  runs/0003-digest/digest.md changed
    CHAIN          Fail  runs/0003-digest/digest.md doesn't match 0003-digest.json
    ```

    Both checks fail and name the file, and the command exits 1.

9. **Run the kit's whole test suite:**

    ```powershell
    Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expect `PassedCount 141`, `FailedCount 0`.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, a test environment's runs (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 07, Lab 2](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#lab-2-a-test-environments-runs). It has the exact commands.

- **You need:** the run folder of an earlier module's Lab 2 in a test tenant, account, tenancy or project, never production, kept on agency storage; a new evidence folder and state file; and the test change record's number.
- **What you do:** route and digest the test collection with the lab's routing, record all three runs with the change record, check the chain, and give the digest to the test environment's owners to ask whether each action-required row reached the right person.
- **Back-out:** step 3 keeps the evidence with its change record and deletes only the copies outside agency storage.

## Knowledge check (5 minutes)

1. Where does the program say the weekly digest belongs?
    a. A shared mailbox
    b. The owners' standing reviews: the service desk supervisor's weekly queue review and the change advisory board's agenda
    c. A public status page
    d. The ISSO's inbox only
2. What does each evidence record hold that makes a removed week visible?
    a. A timestamp
    b. The SHA-256 of the record before it
    c. The digest
    d. The settings file
3. A lab's evidence passes `-Check` but fails `-Check -Stage test`. Why?
    a. The chain is broken
    b. The test stage needs passing `PRE` and `RUN` records, from the pre-flight and the scheduled run, which a lab doesn't make
    c. The digest is missing
    d. `-Stage` checks production only
4. Someone edits `digest.md` after it was recorded. What does `-Check` show?
    a. Nothing; the digest isn't hashed
    b. `SUMS` and `CHAIN` both fail, naming the file
    c. Only a warning
    d. A new record is written
5. Every row of `-Check -Stage production` passes. What does that tell the agency?
    a. The controls are in place
    b. Every step the production stage needs has a passing, unbroken, matching record; the records support the controls, and the assessor decides them
    c. FedRAMP has approved the system
    d. The KSIs are reported

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in Book 15's [The weekly digest](../../books/b15-day2-operations/14-provider-notices.md#the-weekly-digest).
2. **b.** Taught in [The evidence record](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#the-evidence-record) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#dangers).
3. **b.** Taught in [The evidence record](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#the-evidence-record).
4. **b.** Taught in [The evidence record](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#the-evidence-record) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#dangers).
5. **b.** Taught in the chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#federal-requirements-and-evidence) and the guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence).
:::

## Summary (2 minutes)

You wrote a week's digest, recorded three runs as chained evidence, checked the chain, saw a lab stage fail the go/no-go for the two steps it never ran, and caught a file edited after it was recorded.

**The evidence an ISSO keeps** for G7 from this module: each week's `digest.md` and `digest.csv`; the evidence folder's `records/`, `runs/`, `records.csv` and `SHA256SUMS`; and, at promotion, the `-Check -Stage` output with the go/no-go record. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#checklist).

**Next:** [Module 9: Deploying to test and production (optional)](09-deploying-to-test-and-production.md), or back to the [learning path](index.md).
