---
title: "Ticket-to-Machine, Module 5: Drift to a Typed Task"
subtitle: "See the exact finding an ISC event produces, and test a workflow change before you import it"
description: "Research draft: Module 5 of the Ticket-to-Machine learning path. You learn how the three ISC workflows turn events into findings or closure signals, resolve each workflow's body against a saved trigger input with workflow_payload.py, and see the two fixes the tool found: multivalued changes reverted and the attribute in the de-duplication key. Guide Gates 3 and 4; workbook Chapter 04."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 5
date-modified: 2026-11-01
last-reviewed: 2026-11-01
---

# Ticket-to-Machine, Module 5: Drift to a Typed Task {.unnumbered}

**Learning path:** [Ticket-to-Machine on ServiceNow and SailPoint](index.md) · Module 5 of 7 · 45 minutes · Guide [Gate 3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift) and [Gate 4](../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door) · Workbook [Chapter 04](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Someone adds a proxy address to an Active Directory account outside the governed process. SailPoint's Native Change Detection sees it, a workflow posts it to ServiceNow, and a finding opens. But if the workflow doesn't send that kind of change, the finding's intended state is empty, and the re-read in Module 6 has nothing to disagree with. In this module you see the exact payload each workflow produces, on a laptop, before any workflow runs in a tenant.

**The federal requirement.** The guide's [Gate 3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift) and [Gate 4](../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door) requirements tables cover detection and the front door. [Chapter 04's table](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#federal-requirements-and-evidence) maps an out-of-process write raised as an owned, clocked finding to NIST SP 800-53 CM-3 and SI-4, and a tested workflow change to CM-3 and SA-11.

### Learning objectives

In this module, you'll:

- Describe the three ISC workflows and what each event becomes in ServiceNow.
- Resolve a workflow's body against a saved trigger input and read the payload, the intended state and the de-duplication key.
- Explain the two gaps the tool found, and how each was fixed.
- Verify that a closure signal never closes a finding.

### Prerequisites

- [Module 4](04-sources-and-starting-drift.md), and Module 1's [contract](01-the-loop-and-the-typed-task.md#unit-3-the-identity-finding-and-its-contract).

## Unit 2: Three workflows, one front door

*8 minutes*

The kit has one ISC workflow per trigger: a native change (an unauthorized write, on the account), an identity attribute change (attribute drift, on the identity) and a completed provisioning action (a closure signal). Each posts to the Scripted REST resource through an HTTP Request step. Read:

- The guide's [Gate 4](../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door), steps 1 and 2, and its [Validate (G4)](../../books/guides/ttm-servicenow-sailpoint.md#validate-g4-front-door) step.
- The implementation example's [Build 1](../../books/guides/snow-sailpoint-integration-kit.md#build-1-drift-to-a-typed-task).
- [Chapter 04: what exists](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#what-exists).

## Unit 3: Seeing the payload, and two fixes

*10 minutes*

SailPoint resolves the body's `.$` keys at run time, so until Chapter 04 the only way to see a payload was to run the workflow in a tenant. `workflow_payload.py` resolves them against a saved trigger input, derives the intended state the way the script does, checks it against the contract, and lists the input fields the body doesn't send. Running it found two gaps. Read:

- [Chapter 04: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#what-this-chapter-adds), for the tool, the fixtures and the two fixes.
- [Chapter 04: dangers](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#dangers).
- [Book 13, Chapter 10: native tools change state, they don't close findings](../../books/b13-governance/10-ticket-to-machine.md#native-tools-change-state-they-dont-close-findings).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*17 minutes*

You resolve each workflow against its event and run the two new script tests. Work in `examples/servicenow-sailpoint`. [Chapter 04, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#lab-1-fixtures-no-tenant) explains each result.

1. Run the chapter's tests.

   ```bash
   python -m pytest tests/python/test_workflow_payload.py tests/python/test_contract.py -q
   ```

   Expected: `11 passed`.

2. See what the native-change workflow posts.

   ```bash
   python clients/python/workflow_payload.py --trigger idn:native-change-account-updated --event tests/fixtures/events/native-change-account-updated.json
   ```

   Expected output:

   ```text
   Workflow: Drift to ServiceNow - native change (provenance)
   kind finding, drift_class unauthorized_write, system isc_account
   intended_state {"attributes": {"title": "Analyst"}, "entitlements_absent": [{"attribute": "proxyAddresses", "value": "smtp:ap-approver@contoso.example"}, {"attribute": "memberOf", "value": "CN=Payables Approvers,OU=Groups,DC=contoso,DC=example"}], "entitlements_present": []}
   contract: accepted: P2, priority 2, key sailpoint-isc|2c91800000000000000000000a1001ad|unauthorized_write
   input fields not sent: eventType
   ```

3. See the mover's finding.

   ```bash
   python clients/python/workflow_payload.py --trigger idn:identity-attributes-changed --event tests/fixtures/events/identity-attributes-changed.json
   ```

   Expected: `intended_state {"attributes": {"department": "Finance"}}`, `contract: accepted: P3, priority 3, key sailpoint-isc|2c9180000000000000000000000e1004|attribute_drift|department` and `input fields not sent: none`.

4. See the closure signal.

   ```bash
   python clients/python/workflow_payload.py --trigger idn:post-provisioning --event tests/fixtures/events/provisioning-completed.json
   ```

   Expected: `kind closure_signal`, `contract: accepted` and `input fields not sent: action, requester, sources, warnings`.

5. Run the two new script tests.

   ```bash
   node --test --test-name-pattern="attribute is in the key|multivalued" tests/servicenow/servicenow_scripts.test.js
   ```

   Expected: `tests 2`, `pass 2`, `fail 0`.

**Check your work:** for each workflow and event, you can say what payload ServiceNow receives and what the re-read will check.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Turn on Native Change Detection on one test source, build one HTTP Request step by hand and compare it with the kit's file, point it at a capture endpoint or your developer instance, change a monitored attribute, and confirm the payload matches `workflow_payload.py`'s output and that a repeat de-duplicates. Follow [Chapter 04, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#lab-2-a-sailpoint-sandbox-and-a-servicenow-developer-instance).

- **You need:** a SailPoint sandbox tenant, the developer instance from Modules 1 and 2, and the workflow client from Module 2's Lab 2. The ServiceNow endpoint has to be reachable from SailPoint's cloud.
- **Back it out:** step 5 disables and deletes the workflow, turns Native Change Detection off if you turned it on, restores the test attribute, deletes the findings and removes the workflow client.

## Unit 6: Knowledge check

*5 minutes*

1. Before Chapter 04's fix, what did a native change to only a multivalued attribute, such as a proxy address, produce?
   a. A 400 from the Scripted REST resource.
   b. A finding whose intended state named nothing, so a re-read would find nothing to disagree with.
   c. Two findings for the same account.

2. Why does the de-duplication key now end in the attribute?
   a. Two attributes drifting on one user were folded into one record, and the second finding's intended state was lost.
   b. ServiceNow requires the attribute name in every key.
   c. It makes the key unique across tenants.

3. For an Identity Attributes Changed event that moved Erin's department to Finance, what intended state does the finding carry?
   a. The old value, to be reverted.
   b. The new value, `{"department": "Finance"}`, to be kept.
   c. An empty intended state, for a person to set.

4. What does `workflow_payload.py` do with a body path more complex than `$.a.b`?
   a. Refuses it, because the tool isn't a JSONPath engine.
   b. Sends it to SailPoint to resolve.
   c. Leaves the field empty and continues.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** The workflow didn't send `multiValueAttributeChanges`. See fix 1 in [Chapter 04: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#what-this-chapter-adds).
2. **a.** See fix 2 in [Chapter 04: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#what-this-chapter-adds).
3. **b.** An attribute change is kept; a native change is reverted. See [Chapter 04: what exists](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#what-exists) and step 3 of its Lab 1.
4. **a.** Only simple paths are resolved. See [Chapter 04: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#what-this-chapter-adds).
:::

## Unit 7: Summary

*2 minutes*

You saw the exact payload each ISC workflow sends, the intended state each finding carries, and the two fixes that keep a finding from reaching the re-read with nothing to check.

**Evidence an ISSO keeps from this module:** the ServiceNow finding with its origin and raw event; the finding records, one per drifting attribute; and the pull request and test run for any workflow change (Chapter 04). Before shipping, work through the [Chapter 04 checklist](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 4](04-sources-and-starting-drift.md) · [Learning path](index.md) · [Next: Module 6, Actuation and the re-read rule →](06-actuation-and-the-re-read.md)
:::
