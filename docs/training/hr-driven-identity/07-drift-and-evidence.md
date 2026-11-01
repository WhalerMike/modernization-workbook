---
title: "Module 7: Find lifecycle drift and file the evidence"
description: "Gate G7 and workbook Chapter 07: write one read-only run of the six lifecycle drift classes and six metrics from the HR export, the directory, the card system and Modules 1 to 6's outputs, package each run with a hash chain, verify it, and assemble a period an ISSO can check. About 60 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 03"
last-reviewed: 2026-11-01
series-order: 7
---

# Module 7: Find lifecycle drift and file the evidence {.unnumbered}

*Part of the [HR-Driven Identity learning path](index.md). Gate G7 Drift and evidence. Workbook [Chapter 07](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md). About 60 minutes.*

## Introduction (3 minutes)

The first six gates each produce a result. This gate keeps them true over time and hands the ISSO something they can check. Accounts drift from the HR record: a worker with no account, a terminated worker still enabled, an account nobody owns, a write by the wrong identity, a card still active after a separation. And Entra keeps its own logs for only 30 days, while the evidence has to outlive the accounts it describes.

In this module you write one read-only run of the lifecycle drift classes and the six metrics, package it with a hash chain, verify it, and assemble a reporting period.

**The federal requirement.** This gate meets NIST SP 800-53 CA-7 (continuous monitoring: system-level metrics), AU-6 and AU-11 with SI-12 (review and retention of audit records), and BOD 25-01 continuous reporting. The requirements and evidence are in the [Gate 7 requirements table](../../books/guides/hr-driven-identity-implementation.md#step-7-keep-the-record-true-and-file-the-evidence) (under **Federal requirements and evidence** in Step 7) and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#federal-requirements-and-evidence).

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the six lifecycle drift classes and the six metrics, and say which module's output feeds each;
- write a run from the earlier modules' outputs and read its findings;
- package runs with a hash chain, verify a package, and check it with `sha256sum`;
- assemble a period and explain why it can be incomplete even when the chain is whole.

## Prerequisites (1 minute)

- Modules [1](01-one-writer-per-state.md), [2](02-contractor-sources.md), [3](03-joiners-and-the-temporary-access-pass.md), [4](04-access-and-movers.md) and [6](06-separation-timing.md): this run reads their outputs. Step 1 of the lab rebuilds them, so you don't need to keep them.
- The drift pipeline in [Book 19, Chapter 09](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md), which this module's packaging builds on.

## Unit 1: What the evidence has to show (6 minutes)

Read the guide's [Step 7](../../books/guides/hr-driven-identity-implementation.md#step-7-keep-the-record-true-and-file-the-evidence): run the drift classes, fix at the source, report the six metrics, prove the sole source, and keep the evidence outside the directory.

Then read the design in [Book 03, Chapter 11](../../books/b03-hr-identity/11-drift-metrics-and-evidence.md):

- [Drift between HR and the directory](../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory): the classes and their detection signals.
- [The measured lifecycle](../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#the-measured-lifecycle): the six metrics.
- [The evidence each event leaves](../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves): why the record must outlive the account.

Attribute drift isn't this module's; it belongs to the [ADM implementation guide's Gate 9](../../books/guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true).

## Unit 2: The run, the classes and the metrics (7 minutes)

Read three sections of workbook Chapter 07:

- [The drift classes](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#the-drift-classes): LD-01 to LD-06.
- [The metrics](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#the-metrics): where each value comes from, and why a metric with no input is *not measured*, never zero.
- [The package, the chain and the period](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#the-package-the-chain-and-the-period): `package`, `verify` and `period`.

## Exercise: Lab 1, fixtures, no tenant (30 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#lab-1-fixtures-no-tenant). Work in `examples/hr-lifecycle`. This lab also calls `examples/drift-pipeline` from the same clone.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/hr-lifecycle`. Each step below says what it does and what to look for.

```bash
# Step 1
python python/writer_register.py scan --register config/writer-register.json --audit tests/fixtures/ch01/directory-audits.json --since 2026-10-01 --until 2026-10-31 --cloud gcc --out out/ch01
python python/contractor_source.py extract --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv --sponsors tests/fixtures/ch02/hr-sponsors.csv --rules config/contractor-rules.json --as-of 2026-11-01 --out out/ch02/extract
python python/joiner_workflows.py readiness --hires tests/fixtures/ch03/hr-hires.csv --users tests/fixtures/ch03/hire-users.json --prehire-results tests/fixtures/ch03/prehire-results.json --assignments tests/fixtures/ch03/joiner-assignments.json --workflows config/workflows --as-of 2026-11-02T08:00:00Z --cloud gcc --out out/ch03/readiness
python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json --assignments tests/fixtures/ch04/mover-assignments.json --memberships tests/fixtures/ch04/mover-memberships.json --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual
python python/separation_timing.py measure --separations tests/fixtures/ch06/hr-separations.csv --users tests/fixtures/ch06/leaver-users.json --audits tests/fixtures/ch06/separation-audits.json --results tests/fixtures/ch06/leaver-results.json --cards tests/fixtures/ch06/card-revocations.csv --devices tests/fixtures/ch06/device-actions.csv --role-holders tests/fixtures/ch06/role-holders.csv --config config/separation.json --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch06

# Step 2
python python/lifecycle_drift.py run --hr tests/fixtures/ch07/hr-export.csv --contractors out/ch02/extract/decisions.json --users tests/fixtures/ch07/workforce-users.json --exceptions tests/fixtures/ch07/exceptions.csv --cards tests/fixtures/ch07/cards.csv --derivation tests/fixtures/ch07/derivation.json --writers out/ch01 --readiness out/ch03/readiness --residual out/ch04/residual --timing out/ch06 --config config/drift.json --since 2026-10-01 --until 2026-11-01 --cloud gcc --tenant-id 00000000-0000-4000-8000-00000000c0de --mode fixture --out out/ch07/runs/2026-11-01T0600Z

# Step 5
python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-01T0600Z --out out/ch07/evidence
python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-02T0600Z --previous-manifest out/ch07/evidence/2026-11-01T0600Z/EVIDENCE-MANIFEST.json --out out/ch07/evidence
python ../drift-pipeline/python/hr_evidence.py verify out/ch07/evidence/2026-11-02T0600Z

# Step 6
python ../drift-pipeline/python/hr_evidence.py period --evidence out/ch07/evidence --since 2026-10-01 --until 2026-11-02 --out out/ch07/periods

# Step 7
python -m pytest tests -q
cd ../drift-pipeline && python -m pytest tests -q
```

:::

<!-- labs:end -->

1. Write the module outputs the run reads: the scan from Module 1, the extract from Module 2, readiness from Module 3, the residual from Module 4 and the measurement from Module 6, one command each.

    ```bash
    python python/writer_register.py scan --register config/writer-register.json --audit tests/fixtures/ch01/directory-audits.json --since 2026-10-01 --until 2026-10-31 --cloud gcc --out out/ch01
    python python/contractor_source.py extract --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv --sponsors tests/fixtures/ch02/hr-sponsors.csv --rules config/contractor-rules.json --as-of 2026-11-01 --out out/ch02/extract
    python python/joiner_workflows.py readiness --hires tests/fixtures/ch03/hr-hires.csv --users tests/fixtures/ch03/hire-users.json --prehire-results tests/fixtures/ch03/prehire-results.json --assignments tests/fixtures/ch03/joiner-assignments.json --workflows config/workflows --as-of 2026-11-02T08:00:00Z --cloud gcc --out out/ch03/readiness
    python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json --assignments tests/fixtures/ch04/mover-assignments.json --memberships tests/fixtures/ch04/mover-memberships.json --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual
    python python/separation_timing.py measure --separations tests/fixtures/ch06/hr-separations.csv --users tests/fixtures/ch06/leaver-users.json --audits tests/fixtures/ch06/separation-audits.json --results tests/fixtures/ch06/leaver-results.json --cards tests/fixtures/ch06/card-revocations.csv --devices tests/fixtures/ch06/device-actions.csv --role-holders tests/fixtures/ch06/role-holders.csv --config config/separation.json --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch06
    ```

    Each exits 2, because each fixture holds findings. If you kept the folders from earlier modules, delete `out` first: the tools write each output folder once.

2. Write the first run:

    ```bash
    python python/lifecycle_drift.py run --hr tests/fixtures/ch07/hr-export.csv --contractors out/ch02/extract/decisions.json --users tests/fixtures/ch07/workforce-users.json --exceptions tests/fixtures/ch07/exceptions.csv --cards tests/fixtures/ch07/cards.csv --derivation tests/fixtures/ch07/derivation.json --writers out/ch01 --readiness out/ch03/readiness --residual out/ch04/residual --timing out/ch06 --config config/drift.json --since 2026-10-01 --until 2026-11-01 --cloud gcc --tenant-id 00000000-0000-4000-8000-00000000c0de --mode fixture --out out/ch07/runs/2026-11-01T0600Z
    ```

    ```text
    Run 2026-11-01T0600Z: 4 chapter outputs read (readiness, residual, timing, writers)
      separationToBlockHoursP90            5.52  max 4  out of bounds
      separationToRevocationHoursP90      110.0  max 24  out of bounds
      transferToReviewHours                None  max 240  not measured
      joinerReadinessRate                  0.25  min 0.95  out of bounds
      correlationCoverage                0.5833  min 0.99  out of bounds
      derivationPurity                   0.7637  min 0.8  out of bounds
    Lifecycle drift: 14 Finding, 6 Warn, 0 Info
    Run written to out/ch07/runs/2026-11-01T0600Z; package it with examples/drift-pipeline/python/hr_evidence.py
    ```

3. Read `out/ch07/runs/2026-11-01T0600Z/lifecycle/findings.json`. Expect 14 Findings: one LD-01, three LD-02, two LD-03, five LD-04 (Module 1's four second writers and its forbidden delete), one LD-05 and two LD-06. The six Warns are five LD-07 and one LD-08.

4. Write the next day's run: the same command with `--since 2026-11-01 --until 2026-11-02` and `--out out/ch07/runs/2026-11-02T0600Z`. It prints the same metrics and `Lifecycle drift: 14 Finding, 6 Warn, 0 Info`.

5. Package both, chained, and verify:

    ```bash
    python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-01T0600Z --out out/ch07/evidence
    python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-02T0600Z --previous-manifest out/ch07/evidence/2026-11-01T0600Z/EVIDENCE-MANIFEST.json --out out/ch07/evidence
    python ../drift-pipeline/python/hr_evidence.py verify out/ch07/evidence/2026-11-02T0600Z
    ```

    ```text
    {"evidence_manifest_sha256": "342c65f7af3d61bdaeb7b5e17147400341f1145bb88c6fbc26fbef9b3418008e", "new": 20, "open": 20, "package": "2026-11-01T0600Z", "resolved": 0}
    {"evidence_manifest_sha256": "2892017a07f7214696c1048cfa40e6ccb14927f7c7bdc85cc23cac1a8be739c9", "new": 0, "open": 20, "package": "2026-11-02T0600Z", "resolved": 0}
    {"evidence_manifest_sha256": "2892017a07f7214696c1048cfa40e6ccb14927f7c7bdc85cc23cac1a8be739c9", "files": 6, "run_id": "2026-11-02T0600Z"}
    ```

    Your hashes match these only if your fixtures are the committed ones. Then run the ISSO's check: `cd out/ch07/evidence/2026-11-02T0600Z && sha256sum -c SHA256SUMS` reports every file `OK`. Return to `examples/hr-lifecycle` afterward.

6. Assemble the period:

    ```bash
    python ../drift-pipeline/python/hr_evidence.py period --evidence out/ch07/evidence --since 2026-10-01 --until 2026-11-02 --out out/ch07/periods
    ```

    ```text
    {"chain_breaks": 0, "complete": false, "coverage_gaps": 0, "open_at_end": 20, "packages": 2, "period": "period-2026-10-01_2026-11-02"}
    ```

    It exits 2. Open `period-summary.md` in the period folder: the chain and coverage are whole, but drift is open and five metrics are out of bounds, so Gate 7's first two criteria are *not met*.

7. Run the tests:

    ```bash
    python -m pytest tests -q
    cd ../drift-pipeline && python -m pytest tests -q
    ```

    Expect `57 passed`, then `142 passed`. Delete `out` when you're done; it holds fictional names.

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#lab-2-test-tenant) in a worldwide or GCC test tenant, never production.

- **What you do:** export the workforce users, run Modules 1 to 6's Lab 2 against the test tenant, write a run in tenant mode, schedule it in Book 19, Chapter 09's workflow with packages written to an immutable test storage container, and assemble a period.
- **Permissions:** a reader app with a certificate or a federated credential, holding only the two permissions `graph_export.py --task drift-read --list` prints, with admin consent.
- **Back-out:** remove the schedule, delete the reader app, its credential and its consent, delete the test container if you created it for the lab, and delete the local export and output folders.

## Knowledge check (5 minutes)

1. Which drift class is an enabled account for a worker HR has terminated?
    a. LD-01, missing identity
    b. LD-02, stale access
    c. LD-03, orphan account
    d. LD-05, credential drift
2. Module 4's mover review is still open, so there's no transfer-to-review value. How does the run report it?
    a. As zero hours
    b. As the previous period's value
    c. As not measured (LD-08), never as zero
    d. It leaves the metric out without a finding
3. The second package opens no new findings and closes none. Why?
    a. The chain is broken
    b. The inputs didn't change between the two runs
    c. `package` only counts findings on the first run
    d. `verify` failed
4. The period reports zero chain breaks and zero coverage gaps, but `complete` is false. Why?
    a. Drift is still open and metrics are out of bounds, so Gate 7's criteria aren't met
    b. Two packages aren't enough for a period
    c. The period must start on the first of the month
    d. `sha256sum` wasn't run
5. Why does the evidence have to be kept outside the directory?
    a. Entra's logs are kept for a short time and not retroactively, and the accounts are disposed of
    b. The directory can't store JSON
    c. Graph doesn't allow reads of old records
    d. The ISSO has no access to the directory

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** LD-02 is stale access: an enabled account for a terminated worker, or a contractor past the earliest end. Taught in [The drift classes](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#the-drift-classes).
2. **c.** A metric with no input is not measured, never zero. Taught in [The metrics](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#the-metrics).
3. **b.** Same inputs, so nothing opened or closed since the previous package. Taught in the chapter's [Lab 1](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#lab-1-fixtures-no-tenant) and [The package, the chain and the period](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#the-package-the-chain-and-the-period).
4. **a.** `period` scores Gate 7's criteria; an unbroken chain meets only the evidence criterion. Taught in [The package, the chain and the period](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#the-package-the-chain-and-the-period).
5. **a.** Entra keeps audit logs 30 days with P1 or P2, none of it retroactive, and the record must outlive the account. Taught in [Book 03, The evidence each event leaves](../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves) and the chapter's [What the evidence has to show](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#what-the-evidence-has-to-show).
:::

## Summary (2 minutes)

You rebuilt the earlier modules' outputs, wrote two daily runs of the lifecycle drift classes and metrics, packaged them with a hash chain, verified a package, and assembled a period that shows exactly which of Gate 7's criteria are met.

**The evidence an ISSO keeps** for Gate 7: every period's `PERIOD-MANIFEST.json`, `period-summary.md` and `SHA256SUMS`, with the approved thresholds; the packages, with each LD-04 finding's closure at the source; the storage container's retention and immutability settings, set to the records schedule; and the ScubaGear results beside the period. The full list is in the workbook's [Federal requirements and evidence](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md#federal-requirements-and-evidence), and the guide's [Evidence](../../books/guides/hr-driven-identity-implementation.md#evidence) section gathers all seven gates into one file per population.

**You've finished the path.** Go back to the [learning path](index.md), or check your agency's progress against the guide's [Checklist](../../books/guides/hr-driven-identity-implementation.md#checklist).
