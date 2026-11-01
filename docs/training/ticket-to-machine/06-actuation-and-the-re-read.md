---
title: "Ticket-to-Machine, Module 6: Actuation and the Re-read Rule"
subtitle: "Let the ticket authorize a machine, then close the finding only when a re-read of the target shows the intended state"
description: "Research draft: Module 6 of the Ticket-to-Machine learning path. You learn how Gate 5 actuates by lane on the products themselves, how the business rule and the re-read client enforce Gate 6's close-only-on-a-re-read rule, and run the re-read client's offline mode over six waiting findings on two days. Guide Gates 5 and 6; workbook Chapter 05."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 6
date-modified: 2026-11-01
last-reviewed: 2026-11-01
---

# Ticket-to-Machine, Module 6: Actuation and the Re-read Rule {.unnumbered}

**Learning path:** [Ticket-to-Machine on ServiceNow and SailPoint](index.md) · Module 6 of 7 · 55 minutes · Guide [Gate 5](../../books/guides/ttm-servicenow-sailpoint.md#step-5-actuate-on-the-native-surface) and [Gate 6](../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read) · Workbook [Chapter 05](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

SailPoint's Service Desk integration treats a provisioning task as complete when the mapped ServiceNow status says so. A technician sets a ticket to Closed, and nothing was checked. Book 13's rule is that a success response isn't closure: a finding closes only when a re-read of the target shows the intended state. In this module you see where the fix runs, and then you enforce the rule and watch the re-read client decide six findings.

**The federal requirement.** The guide's [Gate 5](../../books/guides/ttm-servicenow-sailpoint.md#step-5-actuate-on-the-native-surface) table maps actuation to NIST SP 800-53 CM-5, AC-3, AC-6, CM-3, AU-14, CA-5 and NIST SP 800-63B-4; the [Gate 6](../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read) table maps the re-read to CM-3, CM-4(2), CA-7 and AU-12. [Chapter 05's table](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#federal-requirements-and-evidence) says what each closure proves and who keeps it.

### Learning objectives

In this module, you'll:

- Explain how Gate 5 actuates by lane, and why the kit has no test for it.
- Describe what the business rule does with a close, and who can close a finding.
- Run the re-read client offline and interpret verified, mismatch, pending and skipped.
- Explain why a stale read waits, and why an empty intended state is never verified.

### Prerequisites

- [Module 5](05-drift-to-a-typed-task.md), and Module 2's [ServiceNow roles](02-boundary-and-least-privilege.md#unit-3-servicenow-roles-split-by-task), for the verifier.

## Unit 2: Actuation by lane

*8 minutes*

The ticket authorizes a machine. SailPoint's connectors provision owner-governed access; ServiceNow's Entra ID spoke handles low-authority tasks where its actions cover them; disconnected applications run as declared exceptions; people act only through a just-in-time activation. The kit's Pass 1 doesn't actuate, so Gate 5 is configuration of the products themselves, with no automated check yet. Read:

- The guide's [Gate 5](../../books/guides/ttm-servicenow-sailpoint.md#step-5-actuate-on-the-native-surface) and its [Validate (G5)](../../books/guides/ttm-servicenow-sailpoint.md#validate-g5-actuation) step.
- [Book 13, Chapter 10: when no machine can reach the surface](../../books/b13-governance/10-ticket-to-machine.md#when-no-machine-can-reach-the-surface), for the declared-exception lane.

## Unit 3: The business rule and the verifier

*10 minutes*

The business rule turns any close into *Awaiting verification*, unless the update carries new evidence and comes from the verifier account; a named exception approver can still cancel with a note. The re-read client reads each waiting record, re-reads the target through ISC or Microsoft Graph, and closes with the evidence or reopens with the differences. Read:

- The guide's [Gate 6](../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read) and its [Validate (G6)](../../books/guides/ttm-servicenow-sailpoint.md#validate-g6-re-read) step.
- [Book 13, Appendix B: the five-clause request chain](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md#the-five-clause-request-chain).
- The implementation example's [Build 2](../../books/guides/snow-sailpoint-integration-kit.md#build-2-the-re-read-rule).

## Unit 4: The guard and the offline mode

*10 minutes*

Chapter 05 adds two things. The guard skips any record whose intended state names nothing a re-read can check, because comparing against it always "matches." The offline mode runs the client's decisions over saved records and saved reads, with the clock fixed, so you can test the rule with no tenant. Read:

- [Chapter 05: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#what-this-chapter-adds), including the six fictional waiting records.
- [Chapter 05: dangers](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#dangers).

## Unit 5: Exercise: Lab 1 (fixtures, no tenant)

*17 minutes*

You re-read six waiting findings on two days and run the business rule's tests. Work in `examples/servicenow-sailpoint`. [Chapter 05, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#lab-1-fixtures-no-tenant) explains each result.

1. Run the re-read tests.

   ```bash
   python -m pytest tests/python/test_reread_verification.py tests/python/test_reread_offline.py -q
   ```

   Expected: `15 passed`.

2. Re-read six waiting findings at noon on November 1.

   ```bash
   python clients/python/reread_verification.py --records-json tests/fixtures/reread/awaiting_records.json --observations-json tests/fixtures/reread/observations.json --now 2026-11-01T12:00:00Z
   ```

   Expected output:

   ```text
   [dry-run] IDF0001001: verified; would PATCH state=3
   [dry-run] IDF0001002: mismatch; would PATCH state=1 (accountEnabled: intended False, observed True)
   IDF0001003: pending, the ISC copy predates the change; re-run after the next aggregation
   [dry-run] IDF0001004: verified; would PATCH state=3
   IDF0001005: skipped, the intended state names nothing a re-read can check
   [dry-run] IDF0001006: verified; would PATCH state=3
   1 mismatch, 1 pending, 1 skipped, 3 verified
   ```

3. Run the same records a day later, and keep the results in `out/reread.json` (the client makes the `out` folder).

   ```bash
   python clients/python/reread_verification.py --records-json tests/fixtures/reread/awaiting_records.json --observations-json tests/fixtures/reread/observations.json --now 2026-11-02T12:00:00Z --out-json out/reread.json
   ```

   Expected: IDF0001003 is now `mismatch; would PATCH state=1 (disabled: intended True, observed False)`, and the last line is `2 mismatch, 1 skipped, 3 verified`. `out/reread.json` holds each result with its evidence hash.

4. Run the business rule's tests.

   ```bash
   node --test --test-name-pattern="redirected|verifier|exception approver|evidence alone|non-closing|SDIM" tests/servicenow/servicenow_scripts.test.js
   ```

   Expected: `tests 6`, `pass 6`.

5. Delete the `out` folder.

   ```bash
   rm -rf out
   ```

**Check your work:** for any waiting finding, you can say whether the client verifies it, reopens it, waits or skips it, and why.

## Unit 6: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Configure the business rule and its system properties, close a finding as a person and watch it land in *Awaiting verification*, confirm which user ServiceNow records for the verifier's OAuth client, then close a finding with evidence from a Graph read of a disabled test user. Follow [Chapter 05, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#lab-2-a-servicenow-developer-instance).

- **You need:** the developer instance from Modules 1 and 2, the verifier user from Module 2's Lab 2, and a test user in a test Entra tenant.
- **Back it out:** step 5 deletes the test findings and their attachments, deactivates the business rule if you built it for the lab, and deletes the system properties.

## Unit 7: Knowledge check

*5 minutes*

1. At noon on November 1, IDF0001003 is *pending*. Why?
   a. The ISC copy of the account predates the change, so the client waits for the next aggregation.
   b. The verifier account isn't configured.
   c. The intended state names nothing a re-read can check.

2. Under the business rule, which update can close a finding?
   a. A person setting the state to Closed Complete.
   b. Any update that carries new evidence.
   c. An update from the verifier account that carries new evidence.

3. In offline mode, a waiting record's subject has no saved read. What happens?
   a. The record is verified, because nothing disagrees with the intended state.
   b. It's an error, because a missing read isn't a match.
   c. The record is reopened.

4. Why does the kit have no test for Gate 5?
   a. Gate 5 is optional at FedRAMP Moderate.
   b. Pass 1 doesn't actuate, so Gate 5 is configuration of the products themselves.
   c. The business rule covers it.

::: {.callout-tip collapse="true"}
## Check your answers
1. **a.** A read that predates the change waits; after the grace period it becomes a mismatch. See steps 2 and 3 of [Chapter 05, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#lab-1-fixtures-no-tenant).
2. **c.** Evidence alone, or the verifier alone, isn't enough. See step 1 of the guide's [Gate 6](../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read) and step 4 of [Chapter 05, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#lab-1-fixtures-no-tenant).
3. **b.** See the offline mode in [Chapter 05: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#what-this-chapter-adds).
4. **b.** See the guide's [Validate (G5)](../../books/guides/ttm-servicenow-sailpoint.md#validate-g5-actuation) step.
:::

## Unit 8: Summary

*2 minutes*

You learned where actuation runs on these products, how the business rule and the re-read client keep a ticket status from closing a finding, and how the client treats stale reads and empty intended states.

**Evidence an ISSO keeps from this module:** connector and spoke identities with their permissions, provisioning events, activation records and change records (Gate 5); the evidence attachment and hash on each closed record, the re-read result and time, and the verifier account's audit trail (Gate 6 and Chapter 05). Before shipping, work through the [Chapter 05 checklist](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 5](05-drift-to-a-typed-task.md) · [Learning path](index.md) · [Next: Module 7, Evidence for the ISSO →](07-evidence-for-the-isso.md)
:::
