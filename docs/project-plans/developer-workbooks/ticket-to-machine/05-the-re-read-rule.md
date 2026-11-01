---
title: "Chapter 05 — The Re-read Rule"
description: "Build 2 of the kit and its answer to Gap 1: a ServiceNow business rule turns any close into Awaiting verification, and a client re-reads the account, identity or user from its system of record and closes the finding only with the evidence, or reopens it. Run the same decisions offline from saved records and saved reads, judge ISC's aggregation lag against a fixed clock, and add the guard that an intended state naming nothing a re-read can check is skipped, never verified; with labs against fixtures and a ServiceNow developer instance."
doc-type: workbook-chapter
audience: [Technical]
family: dw-ticket-to-machine
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 05f25bc89298ac8066afabbaa81d9ba7e04050ddea689478f8fe3e939d092c1a
last-reviewed: 2026-11-01
---
# Chapter 05 — The Re-read Rule

*A success response is not closure. Neither is a ticket status, and neither is a comparison against nothing.*

::: {.callout-note}
## In this chapter
The kit's Build 2, the loop's step 5 and Book 13's fourth clause: a finding closes only when a re-read of the target shows the intended state. The business rule enforces it inside ServiceNow; `reread_verification.py` does the re-reading. This chapter adds an offline mode that runs the client's decisions over saved records and saved reads, so the rule can be taught and tested with no tenant, and a guard: an intended state that names nothing a re-read can check is skipped, because comparing against it always "matches." Lab 1 runs on a laptop; Lab 2 closes one finding on a developer instance.
:::

## Goal and audience

**Goal.** By the end of this chapter you can predict, for any waiting finding and any read of its subject, whether the client will verify it, reopen it, leave it pending or skip it, and show that no path closes a finding without a matching re-read.

**Audience.** Developers who own the re-read client or the business rule, ServiceNow administrators who configure the rule, and the ISSO, for whom this is the closure evidence. You should read Python and a little JavaScript. You don't need a tenant until Lab 2.

## The code: `examples/servicenow-sailpoint`

### What exists

The implementation example's [Build 2](../../../books/guides/snow-sailpoint-integration-kit.md#build-2-the-re-read-rule) gives the design. In brief:

- **The business rule** (`servicenow/business-rule-await-verification.js`, before update, on the state field) moves any close on `u_identity_finding`, and on tickets SailPoint's Service Desk integration opened, to *Awaiting verification*, unless the same update carries a new evidence hash and comes from the verifier account. A named exception approver may still cancel with a close note: the declared-exception lane. This is the answer to Gap 1, where SailPoint's Service Desk best practice treats the mapped ServiceNow status as completion.[^ttm05-sdim-bp]
- **The re-read client** (`clients/python/reread_verification.py`) lists waiting findings through the Table API, re-reads each subject by its `u_system` (`GET /v3/accounts/{id}`, a Search for one identity, or `GET /v1.0/users/{id}` in Graph), compares with `u_intended_state`, and then closes the record with the evidence (query, time, a SHA-256 of the response, the intended state, the checker) and attaches the evidence as JSON, or reopens it with the differences. An ISC read reflects the last aggregation, so a read older than the time the finding started waiting is *pending* for a grace period, 24 hours by default (*design guidance*). It writes only with `--apply`.

Two things were missing. The client could run only against a live instance and tenant, so its decisions could be seen only in mocked unit tests. And it skipped a record whose intended state was empty, `{}`, but not one whose intended state was a non-empty object naming nothing: `{"attributes": {}, "entitlements_absent": []}` is what the script stores for a native change the workflow didn't describe ([Chapter 04](04-drift-to-a-typed-task.md)), and comparing a read against it finds no difference. The client would have closed that record, with evidence, on nothing.

### What this chapter adds

- **The guard.** Before reading anything, the client checks the intended state with `finding_contract.is_checkable` ([Chapter 01](01-the-loop-and-the-typed-task.md)). A record that names nothing checkable is reported as *skipped* with the reason, and is never verified.
- **The offline mode.** `--records-json` takes saved waiting records in the Table API's result shape; `--observations-json` takes saved reads keyed by subject ID, with `null` for a read that found nothing; `--now` fixes the clock for the grace period. The same `verify_records` makes the same decisions; only the reader is swapped. It is a dry run only: `--apply` is refused, and a subject with no saved read is an error, because a missing read isn't a match.
- **Six fictional waiting records** in `tests/fixtures/reread/`, one per outcome: a reverted native change that verifies; a terminated user still enabled in Entra ID (mismatch); an ISC account read before it was re-aggregated (pending, then mismatch after the grace period); an attribute change that verifies; a native change with an empty intended state (skipped); and an orphan account disabled (verified).

### The tests

`tests/python/test_reread_offline.py`, 6 tests: the six outcomes, the grace period expiring, the guard never calling the reader, a missing saved read as an error, a null read as not found, and the refusals. The kit's original nine re-read tests, and the business rule's six node:test tests, pass unchanged.

::: {.callout-important}
## Illustrative code
The offline mode runs the client's logic over saved data. It shows the decisions, not that ISC or Graph returns the same shapes, and not that the business rule recognizes the verifier on your release (see what couldn't be verified). Run Lab 2 before relying on either.
:::

## Lab 1: fixtures, no tenant

Work in `examples/servicenow-sailpoint`, with Python 3.10 or later and Node.js 18 or later.

1. **Run the re-read tests:**

   ```bash
   python -m pytest tests/python/test_reread_verification.py tests/python/test_reread_offline.py -q
   ```

   `15 passed`.

2. **Re-read six waiting findings at noon on November 1:**

   ```bash
   python clients/python/reread_verification.py --records-json tests/fixtures/reread/awaiting_records.json --observations-json tests/fixtures/reread/observations.json --now 2026-11-01T12:00:00Z
   ```

   ```text
   [dry-run] IDF0001001: verified; would PATCH state=3
   [dry-run] IDF0001002: mismatch; would PATCH state=1 (accountEnabled: intended False, observed True)
   IDF0001003: pending, the ISC copy predates the change; re-run after the next aggregation
   [dry-run] IDF0001004: verified; would PATCH state=3
   IDF0001005: skipped, the intended state names nothing a re-read can check
   [dry-run] IDF0001006: verified; would PATCH state=3
   1 mismatch, 1 pending, 1 skipped, 3 verified
   ```

   IDF0001003's account was last modified at 22:00 on October 31; the finding started waiting at 06:00 on November 1. The read predates the change, so it waits. IDF0001005 is the case the guard exists for.

3. **Run the same records a day later:**

   ```bash
   python clients/python/reread_verification.py --records-json tests/fixtures/reread/awaiting_records.json --observations-json tests/fixtures/reread/observations.json --now 2026-11-02T12:00:00Z --out-json out/reread.json
   ```

   IDF0001003 is now `mismatch; would PATCH state=1 (disabled: intended True, observed False)`, and the last line is `2 mismatch, 1 skipped, 3 verified`. After the grace period a stale read is a mismatch, and the record reopens. `out/reread.json` holds each result with its evidence hash.

4. **Run the business rule's tests:**

   ```bash
   node --test --test-name-pattern="redirected|verifier|exception approver|evidence alone|non-closing|SDIM" tests/servicenow/servicenow_scripts.test.js
   ```

   `tests 6`, `pass 6`: a person's close is redirected; the verifier with fresh evidence may close; evidence alone, or the verifier alone, isn't enough; the exception approver may cancel with a note; other changes are untouched; on `incident`, only tickets the integration opened are governed.

## Lab 2: a ServiceNow developer instance

Not run by the authors. Use the developer instance from Chapters 01 and 02, never production, and the verifier user from Chapter 02.

1. **Configure the rule** on `u_identity_finding` as the kit's README says (before, update, order 1000, condition `current.state.changes()`), and the system properties: the *Awaiting verification* value, the verifier's `user_name`, the exception role.
2. **Close a finding as a person.** Set a test finding's state to Closed Complete as an ordinary user. Expect it to land in *Awaiting verification*, with a work note.
3. **Confirm who the verifier is.** As the verifier's OAuth client, request a token and make one `PATCH` to a test record's work notes; look at the record's history for the user ServiceNow recorded. If it isn't the `user_name` in `x_example_idkit.verifier_user`, the rule will refuse every close (verify list, item 10).
4. **Close it with evidence.** Set the test finding's `u_intended_state` to something a Graph read of a test user will show, for example `{"accountEnabled": false}` on a disabled test user, and run the client as the verifier, first as a dry run, then with `--apply --table u_identity_finding`. Expect the record closed with `u_evidence`, `u_evidence_hash`, `u_verified_at`, a close note and a JSON attachment.[^ttm05-table][^ttm05-attach]
5. **Back it out.** Delete the test findings and their attachments, deactivate the business rule if you built it for the lab, and delete the system properties.

## The verified facts

| Item | Value | Source |
|---|---|---|
| Table API | `GET` with `sysparm_query`, `sysparm_fields`, `sysparm_limit`, `sysparm_offset`; `PATCH` on a record | [^ttm05-table] |
| Attachment API | `POST /api/now/attachment/file` with `table_name`, `table_sys_id`, `file_name`; `Content-Type` mandatory | [^ttm05-attach] |
| Re-read of an account | `GET /v3/accounts/{id}`, `idn:accounts:read` | [^ttm05-account] |
| Re-read of an identity | `POST /v3/search`, `identities` index, `sp:search:read` | [^ttm05-search] |
| Re-read of an Entra user | `GET /v1.0/users/{id}`, `User.Read.All` (application); `404 Not Found` when the user doesn't exist | [^ttm05-user-get] |
| Service Desk integration status mapping | The mapped ServiceNow status decides when SailPoint treats the provisioning task as complete (Gap 1) | [^ttm05-sdim-bp] |

### What couldn't be verified

- **The identity `gs.getUserName()` returns for an OAuth client-credentials call,** which the rule compares with the verifier property. Verify list, item 10; Lab 2, step 3.
- **How long an ISC account read lags the source.** It depends on the aggregation schedule; tune `--grace-hours` to it. Verify list, item 17.
- **How to recognize a ticket the Service Desk integration opened.** The rule assumes `opened_by`; a configuration may use a correlation field instead. Verify list, item 12.

## Federal requirements and evidence

| What the output proves | Requirement it supports | Who keeps it |
|---|---|---|
| A finding closed only after a re-read showed the intended state, with the query, the time, a hash of the response and the checker | Book 13's clause 4, "a success response is not closure"; NIST SP 800-53 CM-3 (documented, verified changes) and CA-7 at Moderate[^ttm05-moderate] | `u_evidence`, `u_evidence_hash` and the attachment on each record; [Chapter 07](07-evidence-records.md) exports them |
| No person can close a finding by setting its state; cancellation is a named exception with a note | AC-5 (separation of duties) at Moderate;[^ttm05-moderate] Book 13's declared-exception lane | The business rule and its properties; the work notes |
| A read that predates the change doesn't count | CA-7: monitoring results that reflect the current state | The client's *pending* outcome and grace period |
| An empty intended state never closes a record | CM-3: a verified change, not an asserted one | The guard and its test |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Closure by ticket status | The Service Desk integration, or a person, marks the work done with nothing checked | The business rule redirects every close without fresh evidence from the verifier |
| An intended state that names nothing | A re-read "matches" and closes the record on nothing | `is_checkable`; such records are skipped, with the reason |
| A stale ISC read | A finding closes on the state before the fix, or reopens on it | *Pending* inside the grace period, mismatch after it |
| A missing read treated as a match | A subject nobody read is closed | The offline reader raises on a missing subject; the live reader raises on anything but a 404 |
| The verifier account misconfigured | Every close is refused, and people look for a way around the rule | Lab 2, step 3, before go-live |
| Evidence edited after closure | The record no longer proves what it says | The evidence hash; Chapter 07 recomputes it |

## Checklist

- [ ] The business rule is active on `u_identity_finding`, and on `incident` and `sc_req_item` if the Service Desk integration opens tickets.
- [ ] `x_example_idkit.verifier_user` matches the user ServiceNow records for the verifier's OAuth client.
- [ ] `--grace-hours` is at least the longest aggregation interval on the sources the findings concern.
- [ ] A dry run over this week's waiting findings shows no record skipped for an empty intended state, or each one has gone to a person.
- [ ] Closed records carry `u_evidence`, `u_evidence_hash`, `u_verified_at` and the JSON attachment.
- [ ] The re-read tests and the business rule's node tests pass.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 04 — Drift to a Typed Task](04-drift-to-a-typed-task.md) · [Workbook index](index.md) · [Next: Chapter 06 — Drift Reconciliation →](06-drift-reconciliation.md)
:::

[^ttm05-sdim-bp]: SailPoint, "SDIM: Best Practices" (status mapping decides when a ticket counts as complete), <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/best_practices.html> (read November 1, 2026).
[^ttm05-table]: ServiceNow, "Table API" (Zurich API reference), <https://www.servicenow.com/docs/bundle/zurich-api-reference/page/integrate/inbound-rest/concept/c_TableAPI.html> (read November 1, 2026).
[^ttm05-attach]: ServiceNow, "Attachment API" (Zurich), <https://www.servicenow.com/docs/r/MVRCUFVyKWd7vUoUukbW6g/lfpHTMPdNaq_xdajhuTwEg> (read November 1, 2026).
[^ttm05-account]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `getAccount`, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/account.yaml> (read November 1, 2026).
[^ttm05-search]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `searchPost`, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/search-post.yaml> (read November 1, 2026).
[^ttm05-user-get]: Microsoft Learn, "Get a user," permissions and response, <https://learn.microsoft.com/graph/api/user-get?view=graph-rest-1.0> (read November 1, 2026).
[^ttm05-moderate]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, release 5.2.0 OSCAL profile (includes AC-5, CA-7 and CM-3), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (read November 1, 2026).
