---
title: "Ticket-to-Machine, Module 7: Evidence for the ISSO"
subtitle: "Operate the tempo, turn closed findings into Book 13's evidence records, and verify the package the way an ISSO would"
description: "Research draft: Module 7 of the Ticket-to-Machine learning path. You learn what Gate 7 runs on a schedule and reports, export closed findings as Book 13 evidence records with evidence_export.py, chain one period to the next, and verify a package and catch a removed record. Guide Gate 7; workbook Chapter 07."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 7
date-modified: 2026-11-01
last-reviewed: 2026-11-01
---

# Ticket-to-Machine, Module 7: Evidence for the ISSO {.unnumbered}

**Learning path:** [Ticket-to-Machine on ServiceNow and SailPoint](index.md) · Module 7 of 7 · 45 minutes · Guide [Gate 7](../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo) · Workbook [Chapter 07](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

At the end of the month, your ISSO needs to show an assessor that every identity finding was owned, clocked, re-read and closed, that nothing was edited after it closed, and that nothing was quietly dropped. Ticket history and screenshots don't prove that. In this module you learn what Gate 7 runs and reports, then build and verify the evidence package for a period.

**The federal requirement.** The guide's [Gate 7 requirements and evidence table](../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo) maps the tempo to NIST SP 800-53 CA-7, RA-7, CA-5 and AU-6. [Chapter 07's table](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#federal-requirements-and-evidence) maps the records and the package to CM-3, CA-7 and AU-9, and says what isn't evidenced yet.

### Learning objectives

In this module, you'll:

- Explain what Gate 7 schedules and reports to the governance board.
- Describe Book 13's evidence record, and which of its fields Pass 1 leaves empty, and why.
- Produce an evidence package for a period and continue its hash chain into the next.
- Verify a package, and explain how the verifier catches an edited or removed record.

### Prerequisites

- [Module 6](06-actuation-and-the-re-read.md).
- If you're an ISSO reviewer working only this module, read Module 1's [Unit 3](01-the-loop-and-the-typed-task.md#unit-3-the-identity-finding-and-its-contract) first.

## Unit 2: Operating the tempo

*8 minutes*

Once the loop runs, it runs on Book 13's tempo. Gate 7 schedules the reconciliation and the re-read client, reports five measures to the governance board, routes the identity fixes through the loop, exports the evidence and reviews each declared exception at its end date. Read:

- The guide's [Gate 7](../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo) and its [evidence](../../books/guides/ttm-servicenow-sailpoint.md#evidence) section, for where each evidence-record field comes from on these products.
- [Book 13, Chapter 10: what the tempo shows leadership](../../books/b13-governance/10-ticket-to-machine.md#what-the-tempo-shows-leadership), for the five measures.

The guide's [Validate (G7)](../../books/guides/ttm-servicenow-sailpoint.md#validate-g7-tempo-and-evidence) step names the export as its automated check; Chapter 07 builds its ServiceNow half.

## Unit 3: Evidence records and the package

*10 minutes*

`evidence_export.py` writes one record per closed or cancelled finding in Book 13's shape, runs four checks on each, and packages the period with a SHA-256 per file and a hash chain across records and periods. A verifier recomputes it all. Read:

- [Book 13, Appendix B: the evidence record](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md#the-evidence-record).
- [Chapter 07: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#what-this-chapter-adds), for the four checks, the package, the verifier and how window adherence is measured.
- [Chapter 07: dangers](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*17 minutes*

You export October's closed findings, verify the package, chain November to it, then remove a record and verify again. Work in `examples/servicenow-sailpoint`. [Chapter 07, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#lab-1-fixtures-no-tenant) explains each result.

1. Run the chapter's tests.

   ```bash
   python -m pytest tests/python/test_evidence_export.py -q
   ```

   Expected: `8 passed`.

2. Export October's closed findings.

   ```bash
   python clients/python/evidence_export.py --records-json tests/fixtures/evidence/closed_records.json --out-dir out/evidence --period 2026-10 --generated-at 2026-11-01T12:00:00Z
   ```

   Expected output (the command exits 1, because three records have problems):

   ```text
   5 evidence records: 4 closed on a re-read, 1 declared exception
   Window adherence: 2 of 3 closed inside the window
     IDF0000902: closed after its response window
     IDF0000903: evidence doesn't hash to u_evidence_hash: edited after closure, or cut short
     IDF0000905: closed without re-read evidence
   Chain head 144f5e8494281f83598d2fae5eacac12b9b271c90372c0e503aafc2bd4cf0623; written to out/evidence
   ```

   Open the first line of `out/evidence/records.jsonl` and find `approval`, `executing_identity` and `what_ran`.

3. Verify the package as the ISSO would.

   ```bash
   python clients/python/evidence_export.py --verify-dir out/evidence
   ```

   Expected: `Package holds: every file matches the manifest and the chain is unbroken.`

4. Start November's chain from October's head.

   ```bash
   python clients/python/evidence_export.py --records-json tests/fixtures/evidence/closed_records.json --out-dir out/evidence-2026-11 --period 2026-11 --previous-manifest out/evidence/manifest.json --generated-at 2026-12-01T12:00:00Z
   ```

   Expected: the last line reports chain head `afa59e0f3038613ba36eb4a748da38bb3e76e8427d04038162d08fbdcc167bd1`, and November's `manifest.json` has `chain_previous` set to October's head, `144f5e84...`.

5. Remove one record from October's package, and verify again.

   ```bash
   python -c "p='out/evidence/records.jsonl'; l=open(p).readlines(); del l[1]; open(p,'w').writelines(l)"
   python clients/python/evidence_export.py --verify-dir out/evidence
   ```

   Expected output:

   ```text
     records.jsonl: SHA-256 doesn't match the manifest
     line 2 (IDF0000903): prev_sha256 doesn't match the line before
   Package does not hold: 2 problem(s).
   ```

6. Delete the `out` folder.

**Check your work:** you can produce a package for a period, say what its problems are, and show whether a package you received still holds.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Create the evidence reader and check it with `kit_calls.py`, export live from your developer instance, check the date format of `due` and `finished`, and verify the package. Follow [Chapter 07, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#lab-2-a-servicenow-developer-instance).

- **You need:** the developer instance from the earlier modules, with at least one finding closed in Module 6's Lab 2.
- **Back it out:** step 5 deletes `out/evidence-live` and the evidence reader's OAuth client, user and role.

## Unit 6: Knowledge check

*5 minutes*

1. The export over the fixtures exits 1. Why?
   a. The fixtures are malformed.
   b. Three records have problems, and the run says so instead of producing a clean-looking package.
   c. The period has no closed findings.

2. In each record, `approval`, `executing_identity` and `what_ran` are `null`. Why?
   a. Pass 1 doesn't actuate, so the record that would hold them is a later pass; each null carries its reason.
   b. The evidence reader can't read those fields.
   c. Book 13's evidence record doesn't include them.

3. How does the verifier catch a record removed from `records.jsonl`?
   a. It compares the record count with the ServiceNow instance.
   b. The file's SHA-256 no longer matches the manifest, and the next line's `prev_sha256` no longer matches the line before it.
   c. It can't; a removed record is only found by an assessor.

4. How does Chapter 07 measure window adherence?
   a. Open findings inside their window over all open findings.
   b. Closures inside the window over closures judged.
   c. The share of findings with a due date.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** IDF0000902 closed late, IDF0000903's evidence was edited, and IDF0000905 closed without evidence. See step 2 of [Chapter 07, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#lab-1-fixtures-no-tenant).
2. **a.** The record says so rather than leaving the fields out or filling them. See [Chapter 07: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#what-this-chapter-adds).
3. **b.** See step 5 of [Chapter 07, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#lab-1-fixtures-no-tenant).
4. **b.** Not a ratio of open findings that improves as new ones arrive. See [Chapter 07: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#what-this-chapter-adds).
:::

## Unit 7: Summary

*2 minutes*

You learned what Gate 7 runs and reports, exported a period's closed findings as Book 13 evidence records, chained one period to the next, and verified a package the way an ISSO does.

**Evidence an ISSO keeps from this module:** the scheduled run outputs and the five measures, the window adherence and overdue list, the exception register and the monthly package and its review (Gate 7); the records, the manifest and the chain, verified with `--verify-dir`, and `summary.json` (Chapter 07). Before shipping, work through the [Chapter 07 checklist](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md#checklist).

**You've finished the path.** What the workbook doesn't build yet, and why, is at the end of its [chapters table](../../project-plans/developer-workbooks/ticket-to-machine/index.md#chapters-table).

::: {.callout-tip}
## Continue the path
[Previous: Module 6](06-actuation-and-the-re-read.md) · [Back to the learning path](index.md)
:::
