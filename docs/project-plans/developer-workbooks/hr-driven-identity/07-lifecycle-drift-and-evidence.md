---
title: "Chapter 07 — Lifecycle Drift, Metrics and Evidence"
description: "Find the six lifecycle drift classes (missing identity, stale access, orphan account, unauthorized write, credential drift and contractor credential drift), compute the six lifecycle metrics from the other chapters' outputs, write them as one read-only run that records the SHA-256 of every input it read, and hand it to the first workbook's drift pipeline, which packages each run with a SHA-256 per file, the tenant ID and a hash chain and assembles the period the ISSO signs for the guide's Gate 7, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-hr-driven-identity
part: How
series-order: 7
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-01
---
# Chapter 07 — Lifecycle Drift, Metrics and Evidence

*Six gates set the lifecycle up. This one proves, every day, that it still runs the way the first six said, and leaves a record that outlives the accounts it describes.*

::: {.callout-note}
## In this chapter
The code behind the guide's [Gate 7](../../../books/guides/hr-driven-identity-implementation.md#step-7-keep-the-record-true-and-file-the-evidence): the lifecycle drift classes found and sent to the owner of the fact, the six metrics on the continuous monitoring cadence, and the evidence kept outside the directory. There is no Microsoft sample for lifecycle metrics, so this chapter starts from the program's own pipeline, [Book 19, Chapter 09](../../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md), and builds what it leaves to you: `lifecycle_drift.py` in `examples/hr-lifecycle`, which writes one read-only run from the HR export, the directory, the card system and Chapters 01, 03, 04 and 06's outputs, and `hr_evidence.py` in `examples/drift-pipeline`, which packages each run and assembles a period. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can produce, from code, one run that lists every lifecycle drift finding by fingerprint and every metric against its threshold, package it so an ISSO can check it with `sha256sum` alone, chain it to the run before, and hand over a period summary that maps what is still open to the controls and to Gate 7's criteria. For each rule you can say whether it is Book 03's design, the guide's, or the program's own.

**Audience.** Platform and pipeline engineers who own the scheduled checks, the identity engineers who close findings at the source, and the ISSOs who receive the evidence. You should read Python. You don't need a tenant until Lab 2.

## What the evidence has to show

Book 03 sets both halves of this gate, and this chapter doesn't restate them. The drift classes, their detection signals and default severities are [Book 03, Chapter 11, Drift between HR and the directory](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory); the six metrics are its [measured lifecycle](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#the-measured-lifecycle). The guide's Step 7 adds the order of work: run the classes, fix at the source, report the metrics, prove the sole source, keep the evidence outside the directory.

Two things are out of scope here on purpose. **Attribute drift**, a value that differs from HR, is the [ADM implementation guide's Gate 9](../../../books/guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true): the [validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit)'s VK-HR checks and the [HCM correlation tool](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra#correlate-hr-with-the-directories) find it, and Book 19's pipeline compares their runs. **Schema drift** is the middleware's validation output ([Book 19, Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md)). This chapter adds the classes and the metrics the lifecycle owns.

The evidence also has to survive. Entra's own retention is short: 30 days for audit logs with P1 or P2, 30 days for provisioning logs with a premium edition, and up to 30 days of viewable Lifecycle Workflows history, none of it retroactive.[^hw07-retention] The accounts are disposed of under the disposition rule; the record of what happened to them must outlive them ([Book 03, Chapter 11, The evidence each event leaves](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves)).

### Which cloud, for this read

The run's only new Graph read is the workforce user list (`graph_export.py --task drift-read`): `graph.microsoft.com` for GCC, `graph.microsoft.us` for GCC High and `dod-graph.microsoft.us` for DoD.[^hw07-deployments] The other inputs are the outputs of Chapters 01 to 06, the HR export and the card system's status export, which carry no host. Learn's feature availability page lists basic and advanced security and usage reports and SIEM connectivity as available in Azure Government; in GCC they are the commercial service.[^hw07-feat] The pipeline that schedules the run signs in as Book 19, Chapter 09 describes, per cloud.

## Start with Book 19, Chapter 09's pipeline

### What it gives you

Learn documents the pieces this gate relies on: how long each log is kept, and how to route audit, sign-in and provisioning logs to a workspace, a storage account or a SIEM ([Book 03, Chapter 11](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#the-evidence-each-event-leaves) carries those pages). It publishes no sample that computes lifecycle metrics or joins HR, the directory and a card system into drift classes; those are the program's design. So the nearest working start is the program's own: [`examples/drift-pipeline`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/drift-pipeline), which Book 19, Chapter 09 builds on Learn's federated sign-in samples. Its `drift_pipeline.py` [compares](../../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#compare) two validation kit runs, keeps [names out of the tracker](../../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#findings-without-names), and writes an [evidence package](../../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#the-evidence-package) with a SHA-256 per file and a hash chain. The privileged access and non-person workbooks extended it the same way this chapter does.

### What it leaves to you

Each row is pinned by a test: in `examples/hr-lifecycle/tests/test_credentials_separation_drift.py` (the run) or `examples/drift-pipeline/tests/test_hr_evidence.py` (the package and the period).

| What `drift_pipeline.py` does | Why it isn't enough for this gate | What this chapter adds | Pinned by |
|---|---|---|---|
| Reads a validation kit run (`ValidationManifest.json`) | The lifecycle classes need the HR export, the contractor decisions, the card system and four chapters' outputs, none of which is a kit run | `lifecycle_drift.py run`: the six classes in one run with its own `run.json` | `test_drift_run_folder_and_classes` |
| Compares check rows | Book 03's six metrics are numbers against thresholds, not rows | `metrics.json`: each metric's value, threshold, direction and status; LD-07 and LD-08 | `test_drift_metrics` |
| Hashes the files in one run | A metric is only as good as the chapter output it came from | `run.json` records the manifest SHA-256 of every chapter output read, and refuses one that fails its own manifest | `test_drift_refuses_a_tampered_chapter_output` |
| Packages a kit run | It refuses a folder that isn't one | `hr_evidence.py package` and `verify`, with the same rules: one tenant per chain, written once, nothing extra | `test_load_refuses_a_tampered_run`, `test_package_is_written_once_and_refuses_other_tenants`, `test_verify_catches_an_edit_after_packaging` |
| One package at a time | The ISSO signs a period, not a day | `hr_evidence.py period`: chain, coverage, each metric's series, controls, Gate 7 | `test_package_chain_verify_and_period`, `test_period_reports_a_gap_and_a_broken_chain` |

**The verdict.** Keep Book 19's pipeline as the scheduler, the sign-in and the hashing. Don't feed it lifecycle data as if it were a kit run; give it a run shaped for the lifecycle, and a packager that knows that shape.

## The code: what the run builds on and adds

### The run

`lifecycle_drift.py run` reads:

- the HR export (`PersonNumber`, `AssignmentStatusType`, `TerminationDate`) and Chapter 02's `decisions.json` for contractors;
- the workforce users (`graph_export.py --task drift-read`), the validation kit's `exceptions.csv` (an exception with no owner doesn't count, as in VK-HR-01) and the card system's status export;
- optionally, Chapter 01's scan, Chapter 03's readiness, Chapter 04's residual and Chapter 06's timing folders, each checked against its own `manifest.json` and task name before it is read;
- `config/drift.json`, the six metrics and their thresholds.

It writes the run folder once, and refuses a folder that already exists: `run.json` (schema `fmp-hr-run/1`, the tenant ID, cloud, mode, window, `readOnly: true`, the manifest SHA-256 of every chapter output read, and the SHA-256 of `lifecycle/manifest.json`), and `lifecycle/` with `findings.json`, `metrics.json` and a manifest. `--mode fixture` or `--mode tenant` is required, so a lab run can't pass for a tenant run.

### The drift classes

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| LD-01 | Finding | An active or suspended worker record with no account (missing identity) | Book 03, Chapter 11 |
| LD-02 | Finding | An enabled account for a worker terminated in HR, or a contractor past the earliest end (stale access) | Book 03, Chapter 11; Chapter 02 here |
| LD-03 | Finding | An enabled account that matches no worker or contractor record and no owned exception (orphan) | Book 03, Chapter 11 |
| LD-04 | Finding | A WS-01 or WS-04 finding from Chapter 01's scan (unauthorized write), keeping Chapter 01's object key so the fingerprint is the same | Book 03, Chapter 11; Chapter 01 here |
| LD-05 | Finding | An active PIV card for a separated worker (credential drift) | Book 03, Chapter 11 |
| LD-06 | Finding | An active PIV card for a person the contractor source doesn't hold, or whose engagement ended (contractor credential drift) | Book 03, Chapter 11 |

Severities are Book 03's defaults, which it says are the program's, not an external standard. Credential drift here reads the card system only; Intune device certificates are a join the agency adds when its Intune report is in the evidence store (*design guidance*).

### The metrics

| Metric | Value from | Rule when it fails |
|---|---|---|
| Separation-to-block, 90th percentile | Chapter 06 `summary.json` | LD-07 Warn, over the threshold |
| Separation-to-revocation, 90th percentile | Chapter 06 `summary.json` | LD-07 |
| Transfer-to-review | Chapter 04 `summary.json`; open while the review is open | LD-08 Warn, not measured |
| Joiner readiness rate | Chapter 03 `summary.json` | LD-07 |
| Correlation coverage | This run: enabled accounts that resolve to a current worker, contractor or owned exception | LD-07 |
| Derivation purity | This run: access-granting memberships by dynamic group or automatic assignment, over all | LD-07 |

The thresholds in `config/drift.json` are proposed starting values (*design guidance*); Book 03 is plain that choosing the metrics and thresholds is the agency's CA-7 decision. A metric with no input is reported as not measured (LD-08), never as zero.

### The package, the chain and the period

`hr_evidence.py` lives in `examples/drift-pipeline/python` beside `pa_evidence.py` and `npi_evidence.py`, and changes neither them nor `drift_pipeline.py`: it imports their hashing, JSON and metadata helpers.

- **`package`** checks the run against `run.json` and the lifecycle manifest (every file, nothing extra, one tenant, cloud and mode, no request that isn't a GET), copies it under `run/`, and writes `summary.md` (fingerprints and object keys, no names), `EVIDENCE-MANIFEST.json` (the metrics, the open findings by fingerprint, what opened and closed since the previous package, the previous package's manifest SHA-256) and `SHA256SUMS`. A previous package for another tenant, cloud or mode, or a run that isn't later, is refused.
- **`verify`** rechecks every file against the manifest and `SHA256SUMS`, and the run inside against its own manifests.
- **`period`** verifies every package whose window falls in the period, reports breaks in the chain and gaps in coverage, gives each metric's series, and maps what is open at the end to AC-2, AU-6, PS-4, PS-5 and CA-7. The mapping follows Book 03's [control support table](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#control-support-nist-sp-800-53-rev.-5) and is *design guidance*: the assessor decides each control. It scores three of Gate 7's criteria and reports the fourth, the sole-source proof ([Book 03, Appendix C](../../../books/b03-hr-identity/appendix-c-acceptance-and-cutover.md#proving-hr-is-the-sole-source)), as not decided by this code.

`scripts/run_example_tests.py` now lists `hr-lifecycle` with the kits whose changes also run the drift pipeline's suite, because `test_hr_evidence.py` builds its runs with this kit's code.

### The tests

This chapter's tests are the four `test_drift_*` tests in `examples/hr-lifecycle/tests/test_credentials_separation_drift.py`, which build every chapter output from the fixtures first, and the six in `examples/drift-pipeline/tests/test_hr_evidence.py`. The kit's 57 tests and the drift pipeline's 142 pass under Python 3.10 or later with no package beyond pytest, no tenant and no network.

::: {.callout-important}
## Illustrative code
The commands below run against fictional `contoso.example` fixtures. They show what the code does, not that a tenant, an HR system or a card system returns the same shapes. Review the code, and run Lab 2 in a test tenant, before any of it reaches production evidence.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later. Work in `examples/hr-lifecycle`.

1. **Write the chapter outputs the run reads.** These are Lab 1 of Chapters 01, 02, 03, 04 and 06, one command each:

   ```bash
   python python/writer_register.py scan --register config/writer-register.json --audit tests/fixtures/ch01/directory-audits.json --since 2026-10-01 --until 2026-10-31 --cloud gcc --out out/ch01
   python python/contractor_source.py extract --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv --sponsors tests/fixtures/ch02/hr-sponsors.csv --rules config/contractor-rules.json --as-of 2026-11-01 --out out/ch02/extract
   python python/joiner_workflows.py readiness --hires tests/fixtures/ch03/hr-hires.csv --users tests/fixtures/ch03/hire-users.json --prehire-results tests/fixtures/ch03/prehire-results.json --assignments tests/fixtures/ch03/joiner-assignments.json --workflows config/workflows --as-of 2026-11-02T08:00:00Z --cloud gcc --out out/ch03/readiness
   python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json --assignments tests/fixtures/ch04/mover-assignments.json --memberships tests/fixtures/ch04/mover-memberships.json --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual
   python python/separation_timing.py measure --separations tests/fixtures/ch06/hr-separations.csv --users tests/fixtures/ch06/leaver-users.json --audits tests/fixtures/ch06/separation-audits.json --results tests/fixtures/ch06/leaver-results.json --cards tests/fixtures/ch06/card-revocations.csv --devices tests/fixtures/ch06/device-actions.csv --role-holders tests/fixtures/ch06/role-holders.csv --config config/separation.json --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch06
   ```

   Each exits 2, because each fixture holds findings. Among the lines they print: `Day one 2026-11-02: 1 of 4 hires ready (25%)` and `Separation-to-block hours: p50 0.25, p90 5.52, max 84.68 (threshold 4)`.

2. **Write the first run:**

   ```bash
   python python/lifecycle_drift.py run --hr tests/fixtures/ch07/hr-export.csv --contractors out/ch02/extract/decisions.json \
       --users tests/fixtures/ch07/workforce-users.json --exceptions tests/fixtures/ch07/exceptions.csv --cards tests/fixtures/ch07/cards.csv \
       --derivation tests/fixtures/ch07/derivation.json --writers out/ch01 --readiness out/ch03/readiness --residual out/ch04/residual \
       --timing out/ch06 --config config/drift.json --since 2026-10-01 --until 2026-11-01 --cloud gcc \
       --tenant-id 00000000-0000-4000-8000-00000000c0de --mode fixture --out out/ch07/runs/2026-11-01T0600Z
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

   It exits 2.

3. **Read the findings.** `out/ch07/runs/2026-11-01T0600Z/lifecycle/findings.json` holds 14 Findings: LD-01 for worker `100104`, who has no account; LD-02 for `drew.park` and `harper.vu`, terminated in HR and enabled, and for contractor `bailey.ortiz`, past the earliest end; LD-03 for `print.kiosk` (its exception has no owner) and `old.temp`, but not for `svc.scanner`, whose exception has one; five LD-04, Chapter 01's four second writers and its forbidden delete; LD-05 for card `100303`; LD-06 for cards `900002` and `900011`. The six Warns are five LD-07 and one LD-08 for the mover's review, still open. `run.json` records the four chapter outputs by manifest SHA-256, for example `"writers": {"manifestSha256": "a2e59910…", "task": "writers-scan"}`.

4. **Write the next day's run** with the same inputs and the window `--since 2026-11-01 --until 2026-11-02`, into `out/ch07/runs/2026-11-02T0600Z`. It prints the same metrics and `Lifecycle drift: 14 Finding, 6 Warn, 0 Info`.

5. **Package both, chained, and verify:**

   ```bash
   python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-01T0600Z --out out/ch07/evidence
   python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-02T0600Z \
       --previous-manifest out/ch07/evidence/2026-11-01T0600Z/EVIDENCE-MANIFEST.json --out out/ch07/evidence
   python ../drift-pipeline/python/hr_evidence.py verify out/ch07/evidence/2026-11-02T0600Z
   ```

   ```text
   {"evidence_manifest_sha256": "342c65f7af3d61bdaeb7b5e17147400341f1145bb88c6fbc26fbef9b3418008e", "new": 20, "open": 20, "package": "2026-11-01T0600Z", "resolved": 0}
   {"evidence_manifest_sha256": "2892017a07f7214696c1048cfa40e6ccb14927f7c7bdc85cc23cac1a8be739c9", "new": 0, "open": 20, "package": "2026-11-02T0600Z", "resolved": 0}
   {"evidence_manifest_sha256": "2892017a07f7214696c1048cfa40e6ccb14927f7c7bdc85cc23cac1a8be739c9", "files": 6, "run_id": "2026-11-02T0600Z"}
   ```

   The first package opens all 20 counted findings; the second opens none and closes none, because the inputs didn't change. Your hashes match these only if your fixtures are the committed ones. `cd out/ch07/evidence/2026-11-02T0600Z && sha256sum -c SHA256SUMS` reports every file `OK`, which is the check the ISSO runs.

6. **Assemble the period:**

   ```bash
   python ../drift-pipeline/python/hr_evidence.py period --evidence out/ch07/evidence --since 2026-10-01 --until 2026-11-02 --out out/ch07/periods
   ```

   ```text
   {"chain_breaks": 0, "complete": false, "coverage_gaps": 0, "open_at_end": 20, "packages": 2, "period": "period-2026-10-01_2026-11-02"}
   ```

   It exits 2: the chain and the coverage are whole, but drift is open, five metrics are out of bounds and transfer-to-review isn't measured, which the period lists separately from the five. `period-summary.md` shows AC-2 with 6 open findings, AU-6 with 5, PS-4 with 6, PS-5 with transfer-to-review unmeasured, and Gate 7's criteria: drift classes *not met*, metrics *not met*, evidence unbroken *met*, sole source *not decided by this code*.

7. **Run the tests:**

   ```bash
   python -m pytest tests -q
   cd ../drift-pipeline && python -m pytest tests -q
   ```

**Expected result:** `57 passed`, then `142 passed`. Delete `out` when you're done; it holds fictional names.

## Lab 2: test tenant

Not run by the authors. Use a test tenant in the worldwide or GCC cloud, never production.

1. **Export the workforce users.** Register a reader app with a certificate or a federated credential and grant only the two permissions `python python/graph_export.py --task drift-read --list` prints, with admin consent. Get a token for `graph.microsoft.com` and run `python python/graph_export.py --task drift-read --cloud gcc --out exports/drift`.
2. **Run Chapters 01 to 06 against the test tenant's exports**, as each chapter's Lab 2 describes, each into its own new folder.
3. **Write a run** with `--users exports/drift/workforce-users.json`, the test tenant's ID and `--mode tenant`. Read every finding against the test tenant before going on.
4. **Schedule it.** Add the run, `package` and the upload to Book 19, Chapter 09's workflow ([its Lab 2](../../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md#lab-2-test-tenant-and-test-subscription)), signing in with the federated credential and no secret. Write packages to a test storage container outside the directory with immutability set, and pass `--previous-manifest` from the last package each time (*design guidance*).
5. **Assemble a period** after a few runs and check that a skipped day shows as a coverage gap.
6. **Back it out.** Remove the schedule, delete the reader app, its credential and its consent, delete the test container if you created it for the lab, and delete the local `exports` and `out` folders.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| List users with `employeeLeaveDateTime` | `GET /users`; `User.Read.All` with `User-LifeCycleInfo.Read.All` | Available (user list) | v1.0 | Carried from the validation kit's README, VK-HR-05[^hw07-users] |
| Graph hosts | `graph.microsoft.com` (GCC), `graph.microsoft.us` (GCC High), `dod-graph.microsoft.us` (DoD) | — | — | [^hw07-deployments] |
| Audit log retention | 30 days with P1 or P2, 7 with Free; not retroactive | — | — | Carried from Book 03, Chapter 11[^hw07-retention] |
| Provisioning log retention | 30 days with a premium edition, 7 with Free | — | — | Carried from Book 03, Chapter 11[^hw07-retention] |
| Lifecycle Workflows history | Viewable up to 30 days; download it to keep it longer | — | — | Carried from Book 03, Chapter 11[^hw07-retention] |
| Reports and SIEM connectivity | Basic and advanced reports and SIEM connectivity listed as available in Azure Government | Available | GA | Carried from the guide[^hw07-feat] |
| Lifecycle metrics, drift classes and severities | Book 03's design; no Microsoft source sets them | — | — | Book 03, Chapter 11 |

One place where the sources leave a choice, recorded so a later edit doesn't loosen the code: the guide's Step 7 lists credential drift from the card system *and* Intune reports joined on the person. This run reads the card system only, and says so; the Intune join is open until the agency's Intune report is in the evidence store.

## Federal requirements and evidence

This chapter helps prove [Gate 7](../../../books/guides/hr-driven-identity-implementation.md#step-7-keep-the-record-true-and-file-the-evidence). The guide's Gate 7 table names the requirements: CA-7 for system-level metrics, AU-6 and AU-11 with SI-12 for the review and retention of audit records, and BOD 25-01 continuous reporting; the [federal framework crosswalk](../../../reference/federal-framework-crosswalk.md) lists their sources.

| Requirement | What the code gives | What the ISSO keeps |
|---|---|---|
| CA-7 | `metrics.json` per run, each metric's series per period, thresholds in a reviewed file | Every period's `PERIOD-MANIFEST.json`, `period-summary.md` and `SHA256SUMS`, with the approved thresholds |
| AU-6 | LD-04 from Chapter 01's scan of the audit log, by fingerprint | The packages, with each LD-04 finding's closure at the source |
| AU-11, SI-12 | Packages written once, hash-chained, outside the directory | The storage container's retention and immutability settings, set to the records schedule |
| BOD 25-01 continuous reporting | Not this code: ScubaGear reports for the policies in Gates 4 and 5 | The ScubaGear results beside the period |
| AC-2, PS-4, PS-5 (from the other gates) | LD-01 to LD-03 and LD-05 to LD-06; the separation and transfer metrics | The period's control table, which the assessor reads, not decides from |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A metric computed from an edited chapter output | The number looks fine and proves nothing | Each input is checked against its own manifest; `run.json` records its SHA-256 |
| A missing input read as zero | A metric looks met because nothing was measured | LD-08: not measured is a warning, never a value |
| A lab run filed as tenant evidence | Fiction in the authorization package | `--mode` is required and recorded; packages of different modes don't chain |
| Two tenants in one chain | Evidence from the wrong tenant | `package` refuses a previous manifest for another tenant, cloud or mode |
| Names in the tracker or the summary | Personal data in a public issue | `summary.md` and the period carry fingerprints and object keys; names stay in the run, under access control |
| A skipped day | A gap nobody notices until the assessment | `period` reports coverage gaps and chain breaks, and isn't complete with either |
| Findings fixed in the directory | Drift returns on the next feed | Gate 7's rule: fix at the owner of the fact; the next run closes the finding only if the source changed |
| Logs that expired before export | Evidence that can't be recovered | Route the logs out from the first day of the pilot (the guide's interim path); package daily |

## Checklist

- [ ] Every input folder in `run.json` is the latest run of its chapter, and its manifest hash matches.
- [ ] The thresholds in `config/drift.json` are the agency's approved values, not the samples.
- [ ] Every LD finding in the last package has an owner of the fact and a ticket at the source.
- [ ] No metric is LD-08 for more than one reporting period without a recorded reason.
- [ ] Each package names the previous one, and `verify` passes on every package in the period.
- [ ] The period has no coverage gaps or chain breaks, and the ISSO has signed it.
- [ ] The evidence container is outside the directory, immutable, and kept for the records schedule's period.
- [ ] The reader app holds only the drift-read permissions, with a certificate or a federated credential.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 06 — Separation Timing from the Logs](06-separation-timing.md) · [Workbook index](index.md)
:::

[^hw07-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 1, 2026; carried from Book 19, Chapter 02).
[^hw07-feat]: Microsoft Learn, "Microsoft Entra feature availability" (Azure for US Government: basic and advanced reports and SIEM connectivity available), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw07-retention]: Microsoft Learn, "Microsoft Entra data retention," <https://learn.microsoft.com/entra/identity/monitoring-health/reference-reports-data-retention>, with the provisioning and Lifecycle Workflows history pages cited in Book 03, Chapter 11 (read November 1, 2026; carried from Book 03, Chapter 11).
[^hw07-users]: Microsoft Learn, "List users," <https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0>, and the user resource (`employeeLeaveDateTime` needs `User-LifeCycleInfo.Read.All`), as read for the validation kit's VK-HR-05 (read November 1, 2026; carried from `examples/validation-kit/README.md`).
