---
title: "Ticket-to-Machine, Module 4: Sources and the Starting Drift"
subtitle: "Connect HR, Entra ID and ISC on one key, measure how far the directory is from HR, and compare runs without hiding what wasn't measured"
description: "Research draft: Module 4 of the Ticket-to-Machine learning path. You learn how Gate 3 connects and correlates the sources, run the kit's read-only drift reconciliation over two days of fixtures, and compare the runs with drift_compare.py, including its refusal to compare runs that computed different classes. Guide Gate 3; workbook Chapter 06."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 4
date-modified: 2026-11-01
last-reviewed: 2026-11-01
---

# Ticket-to-Machine, Module 4: Sources and the Starting Drift {.unnumbered}

**Learning path:** [Ticket-to-Machine on ServiceNow and SailPoint](index.md) · Module 4 of 7 · 45 minutes · Guide [Gate 3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift) · Workbook [Chapter 06](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Before you fix anything, you need to know how far the directory is from HR. A terminated employee still enabled in Entra ID, an account that matches nobody, a department someone typed by hand: each is drift, and each needs a number before it needs a ticket. Gate 3 connects the sources, correlates them on one key, and files the first measurement as the baseline. In this module you run that measurement twice and compare the days.

**The federal requirement.** The guide's [Gate 3 requirements and evidence table](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift) maps it to NIST SP 800-53 AC-2, CA-7 and, by inference, CM-8. [Chapter 06's table](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#federal-requirements-and-evidence) maps the reconciliation and the comparison to AC-2, CA-7 and SI-4.

### Learning objectives

In this module, you'll:

- Explain what Gate 3 connects, the key it correlates on, and what it files as the baseline.
- Name Book 03's drift classes, and say which ones the kit doesn't compute.
- Run the drift reconciliation over fixtures and compare two runs as new, persisting and resolved.
- Explain why a comparison of runs that computed different classes is refused.

### Prerequisites

- [Module 3](03-one-writer-per-attribute.md).
- For the Graph reads, [Microsoft Automation, Module 1](../ms-automation-foundations.md), especially [four request patterns](../ms-automation-foundations.md#four-request-patterns).

## Unit 2: Connecting the sources

*8 minutes*

SailPoint aggregates HR as the authoritative source, connects Entra ID and Active Directory, correlates on `employeeId`, and turns on Native Change Detection. The kit's reconciliation then joins the HR extract, Microsoft Graph and ISC on the same key, read only. Read:

- The guide's [Gate 3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift): its steps, its availability note and its interim path.
- [Book 03, Chapter 11: drift between HR and the directory](../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory), for the drift classes and their severities.
- The implementation example's [Build 3](../../books/guides/snow-sailpoint-integration-kit.md#build-3-drift-reconciliation).

## Unit 3: Run over run

*10 minutes*

Events catch changes as they happen; the reconciliation catches the state, including drift whose event was missed. A scheduled run should raise only what's new, so `drift_compare.py` compares two runs by their stable finding IDs. It refuses runs that computed different classes, because every finding of a class the second run skipped would look resolved. Read:

- [Chapter 06: what exists](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#what-exists) and [what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#what-this-chapter-adds).
- [Chapter 06: dangers](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*17 minutes*

You run a two-day story: day one, HR's correction on day two, and a day two that skipped the audit. Work in `examples/servicenow-sailpoint`. [Chapter 06, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#lab-1-fixtures-no-tenant) explains each result.

1. Run the drift tests.

   ```bash
   python -m pytest tests/python/test_identity_drift.py tests/python/test_drift_compare.py -q
   ```

   Expected: `17 passed`.

2. Run day one.

   ```bash
   python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day1.json --out-csv out/day1.csv
   ```

   Expected: the summary counts `attribute_drift 4`, `missing_identity 2`, `orphan_account 3`, `stale_access 2` and `unauthorized_write 1`, and lists `credential_drift` and `schema_drift` under `not_computed`. Print Erin's and Carol's rows from `out/day1.csv`, and find Erin's department and Carol's enabled accounts:

   ```bash
   python -c "import csv, json; [print(r['drift_class'], r['system'], r['employee_id'], r['attribute'], r['expected'], '->', r['observed'], json.loads(r['evidence']).get('initiated_by', '')) for r in csv.DictReader(open('out/day1.csv', encoding='utf-8')) if r['employee_id'] in ('E1002', 'E1004')]"
   ```

3. Run day two, after HR's correction.

   ```bash
   python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract_day2.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day2.json --out-csv out/day2.csv
   ```

   Expected: the same counts. The totals hide what moved.

4. Compare the two days.

   ```bash
   python clients/python/drift_compare.py --previous out/day1.json --current out/day2.json
   ```

   Expected output:

   ```text
   1 new, 11 persisting, 1 resolved
     new       6456e1f12a60e6be attribute_drift isc E1004 department: expected 'Finance', observed 'HR'
     resolved  1f0e34ebf049f163 attribute_drift entra E1004 department: expected 'HR', observed 'Finance'
   Resolved findings are leads for the re-read; their records close only on reread_verification.py.
   ```

5. Run day two without the audit, then compare.

   ```bash
   python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract_day2.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --out-json out/day2-noaudit.json --out-csv out/day2-noaudit.csv
   python clients/python/drift_compare.py --previous out/day1.json --current out/day2-noaudit.json
   ```

   Expected: the first command lists `unauthorized_write` under `not_computed`. The second prints `error: The runs computed different drift classes (...)` and exits 2.

6. Delete the `out` folder.

   ```bash
   rm -rf out
   ```

**Check your work:** you can say what changed between two runs, and why a run that skipped a class can't be compared with one that didn't.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Grant the read permissions from Module 2, write a synthetic HR extract that matches test users, run the client live on two days, and compare the runs. Push nothing to ServiceNow. Follow [Chapter 06, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#lab-2-a-test-tenant-and-a-sailpoint-sandbox).

- **You need:** a test Entra tenant in the worldwide or GCC cloud, a SailPoint sandbox, and synthetic HR data like the fixtures.
- **Back it out:** step 5 deletes `out`, the synthetic extract, the app registration's permissions and certificate, and the sandbox API client.

## Unit 6: Knowledge check

*5 minutes*

1. Which key does the reconciliation join the HR extract, Microsoft Graph and ISC on?
   a. `userPrincipalName`
   b. `employeeId`
   c. `mail`

2. On day two, Entra ID matches HR for Erin's department. How does `drift_compare.py` report the day-one Entra finding?
   a. As resolved, a lead for the re-read; its record still closes only on `reread_verification.py`.
   b. As closed, and it closes the ServiceNow record.
   c. As persisting, until ISC is re-aggregated.

3. Why does `drift_compare.py` refuse to compare day one (with the audit) and day two (without it)?
   a. The two runs have different file names.
   b. Every unauthorized-write finding would look resolved, because the second run didn't compute that class.
   c. The comparison needs the audit on both days to compute finding IDs.

4. Your first reconciliation run shows a burst of High findings. What does Gate 3 tell you to do?
   a. Suppress the uncorrelated accounts until the data is clean.
   b. Expect it, since Book 03 calls that the measurement working, and file the first run as the baseline.
   c. Disconnect the sources and start again.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Chapter 06: in this chapter](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#in-this-chapter) and step 3 of the guide's [Gate 3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift).
2. **a.** A resolved finding is a lead, not a closure. See step 4 of [Chapter 06, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#lab-1-fixtures-no-tenant).
3. **b.** See [Chapter 06: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#what-this-chapter-adds) and step 5 of its Lab 1.
4. **b.** See steps 5 and 6 of the guide's [Gate 3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift).
:::

## Unit 7: Summary

*2 minutes*

You learned how Gate 3 connects and correlates the sources, measured drift over two days, and saw why a comparison refuses runs that measured different things.

**Evidence an ISSO keeps from this module:** the baseline drift report with its date and checker version, the correlation rate and the uncorrelated-account list (Gate 3); each run's JSON and CSV, with `not_computed`, and the comparison output kept with each run (Chapter 06). Before shipping, work through the [Chapter 06 checklist](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 3](03-one-writer-per-attribute.md) · [Learning path](index.md) · [Next: Module 5, Drift to a typed task →](05-drift-to-a-typed-task.md)
:::
