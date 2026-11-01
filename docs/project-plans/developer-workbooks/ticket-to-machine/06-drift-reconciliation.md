---
title: "Chapter 06 — Drift Reconciliation"
description: "Build 3 of the kit: a read-only client joins the HR extract, Microsoft Graph and SailPoint ISC on employeeId and reports Book 03's drift classes with stable finding IDs. Run it twice, a day apart, and compare the runs by finding ID into new, persisting and resolved findings, refusing to compare runs that computed different classes, so a class one run skipped can't look fixed; resolved findings are leads for the re-read, not closures; with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-ticket-to-machine
part: How
series-order: 6
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 06 — Drift Reconciliation

*Events tell you what changed. A reconciliation tells you what is wrong now, including what changed while nobody was listening.*

::: {.callout-note}
## In this chapter
The kit's Build 3, the loop's steps 1 and 2: a read-only join of the HR extract, Microsoft Graph and ISC on `employeeId` that measures Book 03's drift classes. Events ([Chapter 04](04-drift-to-a-typed-task.md)) catch changes as they happen; the reconciliation catches the state, including drift whose event was missed. This chapter adds `drift_compare.py`, which compares two runs by their stable finding IDs, so a scheduled run raises only what is new, and shows what has stopped being measured. Lab 1 runs a two-day story on a laptop; Lab 2 runs the client against a test tenant and sandbox.
:::

## Goal and audience

**Goal.** By the end of this chapter you can run the reconciliation over saved exports, read its findings, compare two runs, and explain why a resolved finding doesn't close anything by itself.

**Audience.** Developers and identity engineers who schedule the reconciliation, and the identity data steward who reads its output. You should read Python and CSV. You don't need a tenant until Lab 2.

## The code: `examples/servicenow-sailpoint`

### What exists

`clients/python/identity_drift.py`, described in the implementation example's [Build 3](../../../books/guides/snow-sailpoint-integration-kit.md#build-3-drift-reconciliation):

- **Inputs.** An HR extract (CSV, `employeeId` and `status` required); Graph users with `employeeId`, `accountEnabled`, `department` and the manager's `employeeId`; ISC identities from Search (accounts nested) and uncorrelated accounts from the Accounts API; and, optionally, the Entra directory audit. Each can be a saved export, which is how the labs run.
- **Classes.** Missing identity, stale access, orphan account and attribute drift (department and manager), High or Medium as [Book 03, Chapter 11](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory) sets them; an unauthorized write only when the audit is read. Credential and schema drift are always reported as not computed, because they need the card system, Intune and the provisioning middleware's output.
- **Finding IDs.** Each finding's ID is a hash of its class, system, employee ID, object ID and attribute, so the same drift gets the same ID on every run. The PowerShell client produces the same IDs from the same fixtures.
- **Outputs.** JSON (the findings, and which classes were and weren't computed) and CSV. `--push-to-servicenow` posts the findings to the Scripted REST resource, and still writes nothing without `--apply`.

The client measured one moment. A scheduled run that pushed every finding every night would lean on the Scripted REST resource's de-duplication to avoid duplicates, and nothing reported what had disappeared.

### What this chapter adds

- **`clients/python/drift_compare.py`** compares two runs by finding ID: *new* (raise it), *persisting* (already raised; the de-duplication adds a counter) and *resolved* (no longer measured). It refuses to compare runs that computed different classes, one with the audit and one without, because every finding of the class the second run skipped would look resolved. A resolved finding is printed with a reminder that its record still closes only on [Chapter 05](05-the-re-read-rule.md)'s re-read.
- **`tests/fixtures/hr_extract_day2.csv`**, the second day of the fictional estate: HR has corrected Erin's department from HR to Finance, the value someone had already typed into Entra ID by hand. Graph now agrees with HR; ISC, not yet re-aggregated, doesn't.
- **`tests/fixtures/config.fixtures.json`**, the fixture settings for an offline run (the authoritative HR source and the provisioning service's app ID), with no secrets.
- **Output folders.** The client now creates the folder for `--out-json` and `--out-csv` if it doesn't exist.

### The tests

`tests/python/test_drift_compare.py`, 4 tests: the day-two story, identical runs, the refusal and the command line. The kit's original 13 drift tests pass unchanged, including the shared finding IDs with the PowerShell client.

::: {.callout-important}
## Illustrative code
The commands below run over fictional exports. They show the join and the comparison, not that your HR extract, Graph or ISC return these shapes; the manager expansion and the ISC employee ID attribute in particular are on the verify list. Expect a burst of High findings in the first month of a real run: Book 03 calls that the measurement working.
:::

## Lab 1: fixtures, no tenant

Work in `examples/servicenow-sailpoint`, with Python 3.10 or later, `pytest` and `requests`.

1. **Run the drift tests:**

   ```bash
   python -m pytest tests/python/test_identity_drift.py tests/python/test_drift_compare.py -q
   ```

   `17 passed`.

2. **Day one:**

   ```bash
   python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day1.json --out-csv out/day1.csv
   ```

   The summary counts `attribute_drift 4`, `missing_identity 2`, `orphan_account 3`, `stale_access 2`, `unauthorized_write 1`, and lists credential and schema drift under `not_computed`. Open `out/day1.csv`: Erin's Entra ID department is Finance where HR says HR, and the audit shows a help desk administrator made that change. Carol, terminated, is still enabled in Entra ID and in Active Directory.

3. **Day two,** after HR's correction:

   ```bash
   python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract_day2.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day2.json --out-csv out/day2.csv
   ```

   The same counts. The totals hide what moved.

4. **Compare the two days:**

   ```bash
   python clients/python/drift_compare.py --previous out/day1.json --current out/day2.json
   ```

   ```text
   1 new, 11 persisting, 1 resolved
     new       6456e1f12a60e6be attribute_drift isc E1004 department: expected 'Finance', observed 'HR'
     resolved  1f0e34ebf049f163 attribute_drift entra E1004 department: expected 'HR', observed 'Finance'
   Resolved findings are leads for the re-read; their records close only on reread_verification.py.
   ```

   Entra ID now matches HR, so that finding is resolved; ISC still holds the old value until the next aggregation, so a new one opens. The unauthorized write persists: HR agreeing afterwards doesn't make the write authorized, and a person decides that finding.

5. **See the refusal.** Run day two without the audit, then compare:

   ```bash
   python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract_day2.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --out-json out/day2-noaudit.json --out-csv out/day2-noaudit.csv
   python clients/python/drift_compare.py --previous out/day1.json --current out/day2-noaudit.json
   ```

   The first command lists `unauthorized_write` under `not_computed`. The second prints `error: The runs computed different drift classes (...)` and exits 2: without the refusal, the unauthorized write would have shown as resolved.

## Lab 2: a test tenant and a SailPoint sandbox

Not run by the authors. Use a test Entra tenant in the worldwide or GCC cloud and a SailPoint sandbox, with synthetic HR data like the fixtures, never production.

1. **Grant the reads** from [Chapter 03](03-sailpoint-client-and-scopes.md): `User.Read.All` (and `AuditLog.Read.All` if you read the audit) on a test app registration with a certificate; `sp:search:read` and `idn:accounts:read` on a sandbox API client. Check both with `kit_calls.py --granted`.
2. **Write a synthetic HR extract** whose `employeeId` values match test users, with one terminated user still enabled and one department that differs.
3. **Run the client live** with `--config` and, for the audit, `--include-audit <yesterday's date>`. Compare its counts with a hand count of the extract (the implementation example's proof step 4). If Graph rejects `$expand=manager` under the application permission, record it (verify list, item 14).
4. **Run it again the next day** after changing one department in the test HR extract, and compare the runs. Push nothing: `--push-to-servicenow` without `--apply` only lists what it would send.
5. **Back it out.** Delete `out`, the synthetic extract, the app registration's permissions and certificate, and the sandbox API client.

## The verified facts

| Item | Value | Source |
|---|---|---|
| List users | `GET /v1.0/users`, `User.Read.All` (application) | [^ttm06-users] |
| Manager | `GET /users?$expand=manager` documented; application permissions not supported on `GET /users/{id}/manager` | [^ttm06-manager] |
| Directory audit | `GET /v1.0/auditLogs/directoryAudits`, `AuditLog.Read.All` (application); available in US Government L4 and L5 | [^ttm06-audit] |
| ISC identities | `POST /v3/search`, `identities` index, `sp:search:read`; `searchAfter` past 10,000 | [^ttm06-search] |
| Uncorrelated accounts | `GET /v3/accounts` with the `uncorrelated` filter (`eq`), `idn:accounts:read`; `limit` at most 250 | [^ttm06-accounts] |
| GCC endpoints | Microsoft 365 GCC uses the worldwide `graph.microsoft.com` | [^ttm06-deployments] |

### What couldn't be verified

- **`$expand=manager` under an application permission.** Verify list, item 14.
- **Which ISC identity attribute holds the HR key** (`employeeNumber` or `attributes.employeeId`). Verify list, item 9.
- **The Entra audit's property display names** the client watches (`Department`, `EmployeeId` and others). Verify list, item 15.

## Federal requirements and evidence

| What the output proves | Requirement it supports | Who keeps it |
|---|---|---|
| Every active HR record has its accounts, every terminated one has none enabled, and every enabled account has a person | NIST SP 800-53 AC-2 (account management) at Moderate;[^ttm06-moderate] Book 03's leaver and orphan measures | The drift JSON and CSV of each run |
| Drift is measured on a schedule, and what changed between runs is reported | CA-7 (continuous monitoring) and SI-4 at Moderate[^ttm06-moderate] | The comparison output, kept with each run |
| What wasn't measured is said, not implied | CA-7; Book 13's detection coverage measure | `not_computed` in every run; the comparison's refusal |

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A class one run skipped looks resolved | Unauthorized writes "disappear" the night the audit read fails | `drift_compare.py` refuses runs with different computed classes |
| A resolved finding closes the record | Drift that left the measurement, not the estate, is called fixed | Resolved findings are leads; only the re-read closes |
| Pushing every finding every night | The tracker fills with repeats | Push only the comparison's new findings; the de-duplication counts the rest |
| The first month's burst read as failure | The pipeline is turned off before it is tuned | Book 03 expects it; triage by class and severity |
| A guest or the HR source's own accounts flagged | Noise hides real drift | Guests are excluded; `ISC_AUTHORITATIVE_SOURCES` and `ALLOWED_WRITER_APP_IDS` |
| An HR extract with names in a shared folder | Personal data spreads | The run folder is evidence; keep it where the HR data is allowed, and delete lab copies |

## Checklist

- [ ] The HR extract's statuses map to active and separated as the client expects.
- [ ] `ISC_EMPLOYEE_ID_ATTRIBUTE`, `ISC_AUTHORITATIVE_SOURCES` and `ALLOWED_WRITER_APP_IDS` are set for this estate.
- [ ] A live run's counts matched a hand count on a synthetic extract.
- [ ] The scheduled job compares each run with the last and pushes only new findings.
- [ ] Every run's `computed` classes are the same, or the comparison is rerun with the same inputs.
- [ ] `test_identity_drift.py` and `test_drift_compare.py` pass, and the PowerShell client's finding IDs still match.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 05 — The Re-read Rule](05-the-re-read-rule.md) · [Workbook index](index.md) · [Next: Chapter 07 — Evidence Records for Book 13 and the ISSO →](07-evidence-records.md)
:::

[^ttm06-users]: Microsoft Learn, "List users," permissions, <https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0> (read November 1, 2026).
[^ttm06-manager]: Microsoft Learn, "List manager," permissions and HTTP request, <https://learn.microsoft.com/graph/api/user-list-manager?view=graph-rest-1.0> (read November 1, 2026).
[^ttm06-audit]: Microsoft Learn, "List directoryAudits," <https://learn.microsoft.com/graph/api/directoryaudit-list?view=graph-rest-1.0> (read November 1, 2026).
[^ttm06-search]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `searchPost`, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/search-post.yaml> (read November 1, 2026).
[^ttm06-accounts]: SailPoint, Identity Security Cloud OpenAPI specification, v3, `listAccounts` and the `limit` parameter, <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/paths/accounts.yaml> and <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v3/parameters/limit.yaml> (read November 1, 2026).
[^ttm06-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 1, 2026).
[^ttm06-moderate]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, release 5.2.0 OSCAL profile (includes AC-2, CA-7 and SI-4), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (read November 1, 2026).
