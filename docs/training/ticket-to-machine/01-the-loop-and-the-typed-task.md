---
title: "Ticket-to-Machine, Module 1: The Loop and the Typed Task"
subtitle: "Where the kit sits in Book 13's five-step loop, and how to check the identity finding before it reaches ServiceNow"
description: "Research draft: Module 1 of the Ticket-to-Machine learning path. You map the kit's files to the loop's five steps, learn the identity finding's data contract, and validate payloads on a laptop with finding_contract.py. Guide Gate 4; workbook Chapter 01."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 1
date-modified: 2026-11-01
last-reviewed: 2026-11-01
---

# Ticket-to-Machine, Module 1: The Loop and the Typed Task {.unnumbered}

**Learning path:** [Ticket-to-Machine on ServiceNow and SailPoint](index.md) · Module 1 of 7 · 50 minutes · Guide [Gate 4](../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door) · Workbook [Chapter 01](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Your agency's service desk closes an access ticket when a technician types "done." Nobody can say who owned the drift, when it fell due, or what the account should look like afterward. Book 13's answer is a typed task: one record with a class, a severity, an owner, a clock and an intended state that a later re-read can check. Every step of the loop writes or reads that record, so you start with it.

**The federal requirement.** Gate 4 turns findings and requests into documented, owned, clocked records. The guide's [Gate 4 requirements and evidence table](../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door) maps it to NIST SP 800-53 CM-3, RA-7, CA-7 and AC-5, and the chapter's [federal requirements and evidence](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#federal-requirements-and-evidence) says what the contract check proves and who keeps it.

### Learning objectives

In this module, you'll:

- Explain the loop's five steps and name the kit file that performs each one.
- Describe the fields of the identity finding's data contract and what each one is for.
- Validate a finding payload on a laptop and predict whether ServiceNow accepts, rejects or de-duplicates it, and when it falls due.
- Recognize an intended state that gives the re-read nothing to check.

### Prerequisites

- The path's [prerequisites](index.md#prerequisites), and the [Lab 1 tools](index.md#what-you-need-for-the-labs).
- No ServiceNow instance or SailPoint tenant until Lab 2.

## Unit 2: The loop, and where the kit sits

*8 minutes*

The loop has five steps: test, detect drift, raise a typed task, actuate on the native surface, and close with evidence. The kit builds the identity half of three of them in Pass 1 and leaves actuation to a later pass. Read these, in order:

1. [Book 13, Appendix B: the coordination loop](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md#the-coordination-loop), for the five steps.
2. [Chapter 01: the loop, and where the kit sits](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#the-loop-and-where-the-kit-sits), for the table that maps each step to a kit file and a chapter.
3. [The guide's loop at a glance](../../books/guides/ttm-servicenow-sailpoint.md#the-loop-at-a-glance), for the products that do each step, and the four gaps between the products and the loop.

As you read, note which step has no code in Pass 1. You'll meet it again in Module 6.

## Unit 3: The identity finding and its contract

*10 minutes*

The Scripted REST resource inside ServiceNow enforces the finding's contract: it validates the payload, maps severity to a priority and a due date on the program's tempo, de-duplicates against an active finding, and derives an intended state when the payload has none. Until Chapter 01, nothing outside ServiceNow applied the same rules, so a client learned a payload was wrong only from a 400 on a live instance.

`finding_contract.py` applies those rules on a laptop, and a test keeps its constants in step with the script. Read:

- [Chapter 01: what exists](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#what-exists) and [what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#what-this-chapter-adds), especially `is_checkable`.
- The contract's fields in the [kit's README](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/servicenow-sailpoint/README.md#the-identity-finding-data-contract), and where they land in Book 13's evidence record in the [implementation example's table](../../books/guides/snow-sailpoint-integration-kit.md#the-identity-finding-and-book-13s-evidence-record).
- [Book 13, Appendix B: severity and tempo](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md#severity-and-tempo), for the windows the due dates come from.

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*22 minutes*

You check payloads the way the Scripted REST resource would, then check every payload the drift client would post. Work in `examples/servicenow-sailpoint`. The chapter's [Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#lab-1-fixtures-no-tenant) explains each result.

1. Run the chapter's tests.

   ```bash
   python -m pytest tests/python/test_finding_contract.py -q
   ```

   Expected: `22 passed`.

2. Check five sample payloads.

   ```bash
   python clients/python/finding_contract.py --validate tests/fixtures/payloads/samples.json --now 2026-11-01T12:00:00Z
   ```

   Expected output (the command exits 1, because two payloads would be rejected):

   ```text
   sample-1-good: ok stale_access P2 priority 2 due 2026-11-01T13:00:00Z system entra_user
   sample-2-typo: 400 drift_class must be one of missing_identity, stale_access, orphan_account, attribute_drift, unauthorized_write, credential_drift, schema_drift
   sample-3-empty-intent: ok unauthorized_write P2 priority 2 due 2026-11-01T13:00:00Z system isc_account
   sample-3-empty-intent: warning: intended_state names nothing a re-read can check (expected: Book 13 routes this class to a person, who sets it)
   sample-4-bad-severity: 400 severity must be P1, P2, P3 or P4
   sample-5-closure: ok closure_signal (moves matches to Awaiting verification; never closes)
   3 accepted, 2 rejected, 0 would de-duplicate
   ```

3. Run the ServiceNow script's own tests, the rules the Python mirrors.

   ```bash
   node --test tests/servicenow/servicenow_scripts.test.js
   ```

   Expected: `tests 15`, `pass 15`, `fail 0`.

4. Run the drift reconciliation over the fixtures, then check the payloads it would post.

   ```bash
   python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day1.json --out-csv out/day1.csv
   python clients/python/finding_contract.py --from-drift out/day1.json --now 2026-11-01T12:00:00Z
   ```

   Expected: twelve lines start `ok`, three carry the warning (two missing identities and the unauthorized write), and the last line is `12 accepted, 0 rejected, 0 would de-duplicate`.

5. Delete the `out` folder.

   ```bash
   rm -rf out
   ```

**Check your work:** for any payload, you can say what the Scripted REST resource will do with it.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

In a ServiceNow Personal Developer Instance, never production, you build the finding table and the Scripted REST resource, lock it down with a `REST_Endpoint` ACL, post a payload you checked in Lab 1, and confirm the de-duplication and the 400. Follow [Chapter 01, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#lab-2-a-servicenow-developer-instance).

- **You need:** a Personal Developer Instance, and the `web_service_admin` role to create the Scripted REST API.
- **Back it out:** step 5 of the chapter's Lab 2 deletes the test records, the ACL, the role, the API and the scoped application.

## Unit 6: Knowledge check

*5 minutes*

1. A payload has `drift_class` set to `stale_access` and no `severity`. What does the Scripted REST resource do?
   a. Rejects it with a 400, because severity is required.
   b. Accepts it as P4, with a 72-hour window.
   c. Accepts it with the class default, P2, and a one-hour window.

2. An intended state is `{"attributes": {}, "entitlements_absent": []}`. Why does `finding_contract.py` warn about it?
   a. ServiceNow rejects an empty object with a 400.
   b. It looks present, but a re-read finds no difference against it and would close the record on nothing.
   c. It makes the finding de-duplicate against every other finding for the subject.

3. What does a `closure_signal` payload do to matching findings?
   a. Closes them.
   b. Moves them to *Awaiting verification*; it never closes them.
   c. Reopens them for the owner to review.

4. Which loop step has no code in the kit's Pass 1?
   a. Raise a typed task.
   b. Actuate on the native surface.
   c. Close with evidence.

::: {.callout-tip collapse="true"}
## Check your answers
1. **c.** The script defaults severity by class, and sample 1 got P2 with a one-hour window. See [Chapter 01, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#lab-1-fixtures-no-tenant).
2. **b.** A non-empty object can still name nothing checkable. See `is_checkable` in [what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#what-this-chapter-adds).
3. **b.** A signal moves matches to *Awaiting verification*; only a re-read closes. See sample 5 in [Chapter 01, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#lab-1-fixtures-no-tenant).
4. **b.** No Pass 1 code writes to Entra ID, Active Directory or ISC. See [the loop, and where the kit sits](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#the-loop-and-where-the-kit-sits).
:::

## Unit 7: Summary

*2 minutes*

You mapped the kit to the loop, read the finding's contract, and checked payloads on a laptop the way ServiceNow will, including every payload the drift client would post.

**Evidence an ISSO keeps from this module:** the ServiceNow finding records and the contract tests in the repository; each record's due date, which Module 7 measures. The chapter's [federal requirements and evidence](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#federal-requirements-and-evidence) lists them; before shipping, work through its [checklist](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#checklist).

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, The boundary and least privilege →](02-boundary-and-least-privilege.md)
:::
