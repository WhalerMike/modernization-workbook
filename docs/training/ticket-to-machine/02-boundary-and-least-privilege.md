---
title: "Ticket-to-Machine, Module 2: The Boundary and Least Privilege"
subtitle: "Confirm what runs where, then prove every integration identity holds exactly what its calls need"
description: "Research draft: Module 2 of the Ticket-to-Machine learning path. You confirm the authorization boundary and the integration identities, then use the kit's call list and kit_calls.py to compare ServiceNow roles, ISC scopes and Graph permissions with what each task needs. Guide Gate 1; workbook Chapters 02 and 03."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 2
date-modified: 2026-11-01
last-reviewed: 2026-11-01
---

# Ticket-to-Machine, Module 2: The Boundary and Least Privilege {.unnumbered}

**Learning path:** [Ticket-to-Machine on ServiceNow and SailPoint](index.md) · Module 2 of 7 · 60 minutes · Guide [Gate 1](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary) · Workbook [Chapter 02](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md) and [Chapter 03](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md)

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Before any call is made, you need to know which actions run from a vendor's cloud, and which non-person identities make them. Then each identity must hold exactly what its calls need. An administrator who grants `itil` "to make it work" has given the integration every ITSM table; an API client with a manage scope can change accounts if its token is stolen. In this module you confirm the boundary on paper and make privilege something a test can check.

**The federal requirement.** The guide's [Gate 1 requirements and evidence table](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary) maps the boundary to NIST SP 800-53 SA-9, CA-3, IA-5 and AC-6 and to FedRAMP authorization. The chapters' tables map the call list to AC-6, AC-2, AC-5 and CM-3: see [Chapter 02](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#federal-requirements-and-evidence) and [Chapter 03](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#federal-requirements-and-evidence).

### Learning objectives

In this module, you'll:

- Explain what Gate 1 records about each product's authorization and each vendor-cloud action.
- Describe the ServiceNow roles the kit uses, and why they are split by task.
- Describe the ISC scopes and Graph permissions each task needs, and why the workflow scope gets its own client.
- Verify a grant against the call list, and catch a grant that is too wide.

### Prerequisites

- [Module 1](01-the-loop-and-the-typed-task.md).
- For the Graph rows, [Microsoft Automation, Module 1: permissions](../ms-automation-foundations.md#permissions).

## Unit 2: The authorization boundary

*8 minutes*

Gate 1 records and decides; it builds nothing. You confirm each product's FedRAMP status on the Marketplace, ask the vendor in writing what's inside the authorization, record which actions run from a vendor's cloud as data flows, and register the four integration identities with a certificate or federated credential, never a long-lived secret. Read:

- The guide's [Gate 1](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary): its steps, its availability table and its interim path.
- The guide's [prerequisites](../../books/guides/ttm-servicenow-sailpoint.md#prerequisites), for the four integration identities.
- The guide's [Validate (G1 Boundary)](../../books/guides/ttm-servicenow-sailpoint.md#validate-g1-boundary) step, which names the validation-kit checks and the manual record.

## Unit 3: ServiceNow roles, split by task

*10 minutes*

`config/calls.json` lists every HTTP call a Python client makes, the task that makes it, the least privilege it needs and the vendor page that says so. A test runs the clients against a fake HTTP session and fails on any call the file doesn't declare. The ServiceNow roles are custom roles split by task: a finding writer, a verifier and an evidence reader. Read:

- [Chapter 02: what exists](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#what-exists), for the token order, paging and retries.
- [Chapter 02: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#what-this-chapter-adds), for the call list and why each role exists.
- [Chapter 02: dangers](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#dangers).

## Unit 4: ISC scopes and Graph permissions

*10 minutes*

The drift and re-read clients need read scopes only. Creating the ISC workflows needs a manage scope that no client in the kit uses, so it belongs to a separate client used once. The Graph app registration needs `User.Read.All`, and `AuditLog.Read.All` only if the run reads the audit. Read:

- [Chapter 03: what exists](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#what-exists), including what a client-credentials token can't do in ISC.
- [Chapter 03: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#what-this-chapter-adds), for the ISC and Graph rows and `--required-only`.
- The implementation example's [permissions](../../books/guides/snow-sailpoint-integration-kit.md#permissions).

## Unit 5: Exercise: Lab 1 (fixtures, no tenant)

*22 minutes*

You prove every call is declared, then compare grants with the call list for ServiceNow, ISC and Graph. Work in `examples/servicenow-sailpoint`. [Chapter 02, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#lab-1-fixtures-no-tenant) and [Chapter 03, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#lab-1-fixtures-no-tenant) explain each result.

**Part A: ServiceNow (Chapter 02)**

1. Prove every call is declared.

   ```bash
   python -m pytest tests/python/test_kit_calls.py -q
   ```

   Expected: `9 passed`.

2. List what the re-read client needs on ServiceNow.

   ```bash
   python clients/python/kit_calls.py --task reread --system servicenow
   ```

   Expected output:

   ```text
   Task reread: reread_verification.py: list waiting findings, re-read each subject, close or reopen with evidence

   servicenow
     POST   /oauth_token.do                                            an inbound OAuth client (client credentials) with its own integration user
     GET    /api/now/table/u_identity_finding                          x_example_idkit.verifier (read on u_identity_finding)
     PATCH  /api/now/table/u_identity_finding/{sys_id}                 x_example_idkit.verifier (write on u_identity_finding)
     POST   /api/now/attachment/file                                   x_example_idkit.verifier (create on sys_attachment)
     needs: x_example_idkit.verifier
   ```

3. Catch a grant that is too wide: an administrator gave the verifier `itil` as well.

   ```bash
   python clients/python/kit_calls.py --task reread --system servicenow --granted "x_example_idkit.verifier,itil"
   ```

   Expected: the listing, then `missing: none`, `extra:   itil` and `Least privilege does not hold: fix the grant.` The command exits 1.

4. Catch the evidence export reusing the verifier's role.

   ```bash
   python clients/python/kit_calls.py --task evidence --system servicenow --granted "x_example_idkit.verifier"
   ```

   Expected: `missing: x_example_idkit.evidence_reader`, `extra:   x_example_idkit.verifier`, exit 1.

5. Run the original ServiceNow client tests.

   ```bash
   python -m pytest tests/python/test_kit_common.py -q -k "sn_ or retry or paging or base_urls"
   ```

   Expected: `7 passed, 12 deselected`.

**Part B: ISC and Graph (Chapter 03)**

6. Run the ISC client tests.

   ```bash
   python -m pytest tests/python/test_kit_common.py -q -k isc
   ```

   Expected: `4 passed, 15 deselected`.

7. List what the drift client needs from ISC.

   ```bash
   python clients/python/kit_calls.py --task drift --system isc
   ```

   Expected output:

   ```text
   Task drift: identity_drift.py: read Graph users, the Entra audit, ISC identities and uncorrelated accounts

   isc
     POST   /oauth/token                                               API client (client credentials) or a personal access token
     POST   /v3/search                                                 sp:search:read
     GET    /v3/accounts                                               idn:accounts:read
     needs: idn:accounts:read, sp:search:read
   ```

8. Catch a manage scope on a read client.

   ```bash
   python clients/python/kit_calls.py --task drift --system isc --granted "sp:search:read,idn:accounts:read,idn:accounts:manage"
   ```

   Expected: `missing: none`, `extra:   idn:accounts:manage`, `Least privilege does not hold: fix the grant.`, exit 1.

9. Check the drift client's scopes against the workflow task.

   ```bash
   python clients/python/kit_calls.py --task workflows --system isc --granted "sp:search:read,idn:accounts:read"
   ```

   Expected: `missing: sp:workflow:manage`, `extra:   idn:accounts:read, sp:search:read`, exit 1. The two jobs need two clients.

10. Check the Graph app registration, first for a drift run that reads the audit, then for one that doesn't.

    ```bash
    python clients/python/kit_calls.py --task drift --system graph --granted "User.Read.All"
    python clients/python/kit_calls.py --task drift --system graph --required-only --granted "User.Read.All"
    ```

    Expected: the first reports `missing: AuditLog.Read.All` and exits 1; the second reports `Least privilege holds.` and exits 0.

**Check your work:** for any kit task, you can list the permissions it needs on each system and show whether a grant matches.

## Unit 6: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

- **ServiceNow:** in your Personal Developer Instance, create the three custom roles, one integration user and one OAuth client-credentials integration per role, compare each user's roles with `kit_calls.py --granted`, and confirm the evidence reader can't patch a record. Follow [Chapter 02, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#lab-2-a-servicenow-developer-instance). **Back it out** with its step 5: delete the OAuth integrations, users and roles, and revoke any saved token.
- **SailPoint:** in an ISC sandbox tenant, create a reader API client and a separate workflow client, compare each with `--granted`, and try the reader. Follow [Chapter 03, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#lab-2-a-sailpoint-sandbox-tenant). **Back it out** with its step 5: delete both API clients (or the personal access tokens and the dedicated user) and anything under `out`.
- **You need:** the developer instance from Module 1's Lab 2 and a SailPoint sandbox tenant.

## Unit 7: Knowledge check

*5 minutes*

1. `kit_calls.py --task reread --system servicenow --granted "x_example_idkit.verifier,itil"` reports `extra:   itil`. What does that mean?
   a. The grant is fine; extra roles are ignored.
   b. Least privilege doesn't hold: the grant is wider than the task needs, and the command exits 1.
   c. The verifier role is missing.

2. Why does the evidence export get its own `x_example_idkit.evidence_reader` role instead of reusing the verifier's?
   a. The verifier role can't read `u_identity_finding`.
   b. With the verifier's role, the export could also close findings; the reader can't change a record it's about to hash.
   c. ServiceNow allows only one integration user per role.

3. Which ISC scope belongs on a separate client that is used once and then removed?
   a. `sp:search:read`
   b. `idn:accounts:read`
   c. `sp:workflow:manage`

4. Gate 1 asks you to record which actions run from a vendor's cloud. Why?
   a. Book 15 prefers execution through a connector inside the boundary, so each vendor-cloud action is a recorded data flow.
   b. Vendor-cloud actions can't be used at FedRAMP Moderate.
   c. The FedRAMP Marketplace requires the agency to list them.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** `--granted` exits 1 on anything missing or extra. See [Chapter 02, Lab 1](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#lab-1-fixtures-no-tenant).
2. **b.** Roles are split by task so the reader can't change what it hashes. See [Chapter 02: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#what-this-chapter-adds).
3. **c.** No client in the kit creates workflows, so that scope gets its own client. See [Chapter 03: what this chapter adds](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#what-this-chapter-adds).
4. **a.** Each vendor-cloud action becomes a recorded data flow. See step 4 of the guide's [Gate 1](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary).
:::

## Unit 8: Summary

*2 minutes*

You confirmed what Gate 1 records, learned the roles, scopes and permissions each kit task needs, and caught three kinds of over-wide grant on a laptop.

**Evidence an ISSO keeps from this module:** the Marketplace listings with the date read, the vendor's written answers, the data-flow record and the identity register (Gate 1); `config/calls.json` and its test, and the `kit_calls.py --granted` output kept with each access approval (Chapters 02 and 03). Before shipping, work through the [Chapter 02 checklist](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md#checklist) and the [Chapter 03 checklist](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 1](01-the-loop-and-the-typed-task.md) · [Learning path](index.md) · [Next: Module 3, One writer per attribute →](03-one-writer-per-attribute.md)
:::
