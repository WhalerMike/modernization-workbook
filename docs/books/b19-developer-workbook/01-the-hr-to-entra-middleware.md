---
title: "Chapter 01 — The HR-to-Entra Middleware"
description: "Building the middleware between an HR extract and Microsoft Entra ID's API-driven inbound provisioning: validation that fails closed, quarantine, leaver-first and manager-first ordering, SCIM /bulkUpload batches with pacing and Retry-After, and a provenance manifest that ties every batch to its inputs, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: b19-developer-workbook
book: B19
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 01 — The HR-to-Entra Middleware

*The provisioning service will do whatever the payload says, so the code that builds the payload is where the HR record either stays true or stops being true.*

::: {.callout-note}
## In this chapter
The middleware that reads an HR extract and feeds Microsoft Entra ID's API-driven inbound provisioning through the SCIM `/bulkUpload` endpoint. You build on `examples/hcm-entra`: validation that fails closed, a quarantine that keeps the refused record, ordering, batching and pacing, and a new provenance manifest that ties every sent batch to the exact extract and mapping that produced it. Lab 1 runs on fixtures with no tenant; Lab 2 sends five records to a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can run, read, change and test the middleware that sits between the HR system and the provisioning service, and you know which of its rules come from Microsoft's contract and which are the program's own design.

**Audience.** Developers who own the HR integration, and the engineers who review it. You should be comfortable in Python or PowerShell 7 and know what SCIM is. You don't need to know the HR product: the code reads a CSV extract whose columns the mapping file names.

[Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md) describes the pipeline's duties (validate, normalize, sequence, send, reconcile) and [Chapter 06](../b03-hr-identity/06-canonical-attribute-schema.md) the canonical schema and attribute map. [Appendix A](../b03-hr-identity/appendix-a-lifecycle-rules.md) holds the lifecycle rules the code enforces, and [Appendix B](../b03-hr-identity/appendix-b-security-and-privacy.md) the security and privacy rules for what it may log. This chapter is the developer's view of those pages. The research page [Building Book 03's HR Pipeline](../../research/hcm-entra-implementation.md) explains why the example is shaped the way it is.

## Where the middleware sits

```text
HR system ──extract (CSV)──► middleware ──SCIM BulkRequest──► /bulkUpload ──► provisioning job ──► Entra ID or AD
                               │  validate, normalize,              (202 + Location)       │
                               │  order, batch, pace                                        ▼
                               ├─► validation-report.json (keys and hashes only)    provisioning logs
                               ├─► quarantine.json (refused rows: personal data)            ▲
                               ├─► provenance.json (inputs and batches, by hash)            │
                               └─► apply-results.json (status, attempts, Location) ─────────┘
```

The provisioning service owns the mapping from SCIM attributes to directory attributes, the matching of incoming records to existing users, and the write. The middleware owns everything before the POST: what is sent, in what order, how fast, and what record is kept of it. The `/bulkUpload` endpoint is asynchronous. A `202 Accepted` means the batch was staged for the provisioning job, not that any user was written; the `Location` header points at the provisioning logs, where the per-record result appears.[^c01-bulkupload] So the middleware can't learn whether a record landed from the POST alone. That is why the reconcile duty reads the logs, and why the provenance manifest matters: it is the link between what was sent and what the logs later say happened.

## The code

The example is two equivalent clients that read the same mapping file and produce the same output for the same input. The tests assert that against shared fixtures.

| File | What it does |
|---|---|
| `config/mapping.json` | Column to SCIM attribute map, code lists, worker types, length limits, batch size |
| `config/settings.example.json` | Non-secret settings: endpoint, time offsets, the disable threshold, call budget, pacing, retries |
| `python/hcm_to_scim.py` | The Python client (standard library only, Python 3.10 or later) |
| `powershell/HcmToScim.psm1`, `Invoke-HcmToScim.ps1` | The same in PowerShell 7.2 or later |
| `tests/python`, `tests/powershell` | pytest and Pester 5, against `tests/fixtures/hcm_extract_sample.csv` |

### Validate and fail closed

`build_operation` (Python) and `ConvertTo-HcmScimOperation` (PowerShell) take one extract row and either build a SCIM operation or refuse it with reasons. Nothing is guessed. A row is refused when a required column is empty, the person number doesn't fit `employeeId`, the worker type is unknown or refused (pending workers and nonworkers), a code isn't in the code list, a value is longer than the target attribute holds, a date doesn't parse, a worker is recorded as their own manager, or an inactive assignment has no termination date. Every refused row goes to the quarantine with its reasons, the unchanged HR row and whatever payload was attempted, which is the quarantine contract in [Book 03, Appendix A](../b03-hr-identity/appendix-a-lifecycle-rules.md).

Some rules are warnings, not refusals. A suspended assignment keeps the account active ("leave is not a leaver"). A manager separating in the same run never blocks the joiner. A separation older than the Lifecycle Workflows catch-up window is flagged for the on-demand leaver workflow. *Design guidance:* treat every new validation rule as a refusal until the HR owner agrees it can be a warning. A refused record waits a day; a wrong record that gets through can disable the wrong person.

### Send the complete record every time

Microsoft's guidance is to include the complete user record in every bulk request, for full and delta runs alike. When the provisioning job's *clear attribute values* feature (preview) is on, a null or empty mapped value clears the target, and so can an omitted attribute.[^c01-concepts] The client therefore never sends a partial record, even when only one field changed in HR. If you add a column, add it to every record the column applies to, or the next run may clear it for everyone else.

### Order, batch and hold

Within a run, leavers go first, then managers before their reports, then person key. Separations first means a mover-and-leaver pair can't briefly give a departing worker new access; managers first means `manager.value` refers to someone the job has already seen. When one person has several rows, a single separation wins and the rest are marked superseded; any other duplicate is refused rather than guessed.

Each request can carry at most 50 operations.[^c01-bulkupload] The client never builds a larger batch, and `batch_size` in the mapping is checked to be between 1 and 50.

Two guards can hold the whole run (exit code 3) until someone confirms it with `--confirm-large-delta`: more disables than `max_disables_per_run`, and more calls than `daily_call_budget`. The first is [Book 03, Appendix B](../b03-hr-identity/appendix-b-security-and-privacy.md)'s pause switch. The second follows Microsoft's tenant quota: 2,000 calls in 24 hours with Microsoft Entra ID P1 or P2, and 6,000 with Microsoft Entra ID Governance.[^c01-concepts] At 50 records a call, that is 100,000 and 300,000 records a day.[^c01-licensing] Set the budget from the license the tenant actually holds.

### Pace, retry and stop

Learn's concepts page sets the endpoint's rate limit at 40 calls within any 5-second window, with a `429` above it.[^c01-concepts] The API reference page says 40 requests per second.[^c01-bulkupload] The two pages disagree, so the client paces to the stricter one: `min_seconds_between_calls` can't be set below 0.125 seconds, which is 40 calls in 5 seconds. On `429` or `503` it waits for `Retry-After` when the response carries it and backs off exponentially when it doesn't, which is Graph's general throttling guidance.[^c01-throttling] It stops at the first batch that fails. The next run resends complete records, so stopping loses nothing; carrying on could send a later batch whose leavers' managers were in the one that failed.

A `500` with "the bucket that stores the ingested data is full" means the job's ingestion queue is backed up, typically during an initial or full load.[^c01-issues] The client treats it as a failure and stops. *Design guidance:* don't retry it in a loop; wait for the job to drain and rerun.

### The provenance manifest (new in this chapter)

Before this chapter the example wrote what it sent and why it refused rows, but nothing tied a sent batch to the exact inputs that produced it. The research page listed that as a known limit. The new `provenance.json` closes it:

```json
{
  "schema": "fmp-hcm-provenance/1",
  "as_of": "2026-10-25",
  "extract_sha256": "…sha256 of the extract file's bytes…",
  "mapping_sha256": "…sha256 of mapping.json's bytes…",
  "counts": { "ready": 9, "quarantined": 9, "superseded": 1 },
  "held": false,
  "batches": [
    { "batch": 1, "batch_sha256": "ab8f211e…", "person_keys": ["100003", "100008", "100013", "…"] }
  ],
  "quarantined": ["100006", "100007", "…"]
}
```

Each `batch_sha256` is the same hash `apply-results.json` records for that batch when it is sent, over the same canonical JSON (sorted keys, no whitespace, UTF-8 kept). So an auditor can start from a line in the provisioning logs, find the person key in a batch, find the batch in `apply-results.json` by its hash and `Location`, and find in `provenance.json` the extract and mapping files, by hash, that produced it. The manifest carries person keys and hashes only, no names and no payloads, so it can sit in the evidence store beside the operational report. That is the provenance pattern [Book 13, Chapter 04](../b13-governance/04-change-control-and-provenance.md) asks for, applied to identity data.

The Python side is short:

```python
def provenance(result, as_of, extract_sha256, mapping_sha256):
    counts = {}
    for o in result.outcomes:
        counts[o.status] = counts.get(o.status, 0) + 1
    return {
        "schema": "fmp-hcm-provenance/1",
        "as_of": as_of.isoformat(),
        "extract_sha256": extract_sha256,
        "mapping_sha256": mapping_sha256,
        "counts": counts,
        "held": result.held,
        "batches": [
            {"batch": i, "batch_sha256": sha256_hex(b), "person_keys": [op["bulkId"] for op in b["Operations"]]}
            for i, b in enumerate(result.batches, start=1)
        ],
        "quarantined": [o.person_key for o in result.outcomes if o.status == "quarantined"],
    }
```

`Get-HcmProvenance` in the PowerShell module builds the same object. The file hashes are of the raw bytes, not of parsed JSON, so both clients agree without having to canonicalize the mapping file, and so does `sha256sum` on the command line.

### The tests

Three new tests in each language cover the manifest: it links inputs to batches (every ready person key appears in exactly one batch, and every batch hash matches the batch), it carries no names or payloads, and its own hash matches a shared fixture, `tests/fixtures/expected_provenance_sha256.txt`, which is how the Python and PowerShell clients are held to the same output. The command-line tests also check that a dry run writes `provenance.json` with the real file hashes. With those, the suites stand at 48 pytest tests and 41 Pester tests, all passing.

::: {.callout-warning}
## Illustrative code
The commands below run the example as published in the repository. It is tested against fixtures, not against a production tenant. Review it, and run it in a test tenant, before it carries real HR data.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later, or PowerShell 7.2 or later with Pester 5. Nothing in this lab touches the network: sending is exercised by the tests with a fake poster.

1. Run the converter on the sample extract:

   ```text
   cd examples/hcm-entra
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out
   ```

   It prints the counts and exits with code `2`, because the fixture plants records that must be quarantined. The PowerShell client gives the same result:

   ```text
   pwsh -File powershell/Invoke-HcmToScim.ps1 -Extract tests/fixtures/hcm_extract_sample.csv -AsOf 2026-10-25 -Out out-ps
   ```

2. Open `out/validation-report.json` and find the pre-start worker (hire date after the run date). It is sent with `active` false and isn't counted as a leaver. Find the suspended worker: active, with a warning.

3. Open `out/quarantine.json`. Each entry has the reasons, the unchanged HR row and the attempted payload. This file holds personal data. In production it goes only to the access-controlled audit store.

4. Open `out/provenance.json`. Check the extract hash yourself:

   ```text
   python -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" tests/fixtures/hcm_extract_sample.csv
   ```

   It matches `extract_sha256`. Compare `out/provenance.json` with `out-ps/provenance.json`: the batch hashes and person keys are the same.

5. Break something on purpose. Copy the extract, change one worker's `DepartmentCode` to `org-100` (lower case), and run again. That worker moves to the quarantine with a code-list reason, the batch hash changes, and `extract_sha256` changes. Nothing else moves.

6. Hold a run. Create `s.json` containing `{"max_disables_per_run": 1}`, pass it with `--settings s.json`, and see exit code `3`.

7. Run the tests:

   ```text
   python -m pytest -q -p no:cacheprovider tests/python
   pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
   ```

**Expected result:** 48 and 41 passing tests, and the same counts, hashes and person keys from both clients.

## Lab 2: test tenant

Use a test tenant, never production, and fictional records only.

1. **Create the provisioning app.** In the test tenant, create an API-driven inbound provisioning app that provisions to Microsoft Entra ID (the AD target needs the provisioning agent; leave it for later). The feature needs Microsoft Entra ID P1, P2 or ID Governance.[^c01-concepts] Copy the app's **Provisioning API Endpoint** into `config/settings.json` as `endpoint`. Add the custom extension namespace from `mapping.json` to the app's attribute list and map the attributes you need. The namespace string must match in all three places.
2. **Grant the least privilege.** Use a managed identity or an app with a certificate, never a secret. For an application that owns the provisioning app's service principal, the least-privileged permission is `SynchronizationData-User.Upload.OwnedBy`; otherwise `SynchronizationData-User.Upload`.[^c01-bulkupload] A delegated caller needs the User Administrator role. Grant reading the provisioning logs to a separate identity (see the verified facts below).
3. **Start the job and set its safety nets.** Start the provisioning job so it is listening, set the notification email, and turn on accidental-deletions prevention.
4. **Send five records.** Cut the sample extract to five valid rows. Get a token for `https://graph.microsoft.com` (or `https://graph.microsoft.us` in GCC High) outside the script, put it in `HCM_ENTRA_BEARER_TOKEN`, and run with `--apply`. Expect one batch, a `202`, and a `Location` in `apply-results.json`.
5. **Reconcile.** Read the provisioning logs filtered to the job. Every person key in `provenance.json`'s batch should appear with a result. A record you expected that doesn't appear is a finding, not a delay to wait out.
6. **Back it out.** Send the same five records with `AssignmentStatusType` set to `INACTIVE` and a termination date, then delete the test users and the provisioning app. Unset the token variable.

## Verified facts

| Call | Endpoint | Least-privileged permission | US Government clouds | Stage |
|---|---|---|---|---|
| Send a batch | `POST /servicePrincipals/{id}/synchronization/jobs/{jobId}/bulkUpload`, `Content-Type: application/scim+json` | Application: `SynchronizationData-User.Upload.OwnedBy`; delegated: `SynchronizationData-User.Upload` with User Administrator[^c01-bulkupload] | API-driven inbound provisioning is listed as available for Azure Government tenants[^c01-availability] | v1.0 |
| Read results | `GET /auditLogs/provisioning` with `$filter` on `jobId` | `AuditLog.Read.All` and `Directory.Read.All`, delegated or application; delegated callers also need a role such as Reports Reader or Global Reader[^c01-provlogs] | Global, US Government L4 and L5[^c01-provlogs] | v1.0 |
| Graph host | `https://graph.microsoft.com` (worldwide and Microsoft 365 GCC), `https://graph.microsoft.us` (GCC High), `https://dod-graph.microsoft.us` (DoD); token authority `login.microsoftonline.us` for the US Government clouds | — | Tokens from one cloud don't work in another[^c01-deployments] | — |

Limits the code enforces: at most 50 operations a request;[^c01-bulkupload] 40 calls in any 5 seconds (the stricter of Learn's two statements); 2,000 or 6,000 calls in 24 hours depending on license;[^c01-concepts] `Retry-After` on `429` and `503`.[^c01-throttling]

Two things Learn states differently on different pages:

- **The rate limit.** The `bulkUpload` API page says 40 requests per second; the concepts and troubleshooting pages say 40 calls per 5 seconds.[^c01-issues] The code uses the stricter figure.
- **The log-reading permission.** The concepts page tells admins to grant `ProvisioningLog.Read.All` to API clients;[^c01-concepts] the List provisioningObjectSummary page names `AuditLog.Read.All` and `Directory.Read.All` as the least privileged.[^c01-provlogs] Try `ProvisioningLog.Read.All` alone in the test tenant first; if it reads the logs, use it, because it is narrower.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Partial records | An omitted attribute clears the target when clearing is on (preview)[^c01-concepts] | Every record is built complete; a test would fail if a mapped column went missing |
| A typo in the extension namespace | The attribute is silently dropped | One namespace string, in the mapping file only; the README tells you to copy it, not retype it |
| Mass disable from a bad extract | Hundreds of accounts disabled before anyone looks | `max_disables_per_run` holds the run; exit code 3 |
| Secrets in settings | A token or key committed with the config | The settings loader refuses any key that looks like a secret; the token comes from the environment |
| Wrong cloud | A token sent to the wrong Graph host, or the call fails | The endpoint must match the allow-list of three Graph hosts and the `/bulkUpload` path |
| Treating `202` as success | A record that failed in the job is never followed up | The reconcile step reads the logs; the manifest names every key that was sent |
| Personal data in logs | Names and payloads in the operational log | The report and manifest carry keys and hashes only; payloads go only to the quarantine |
| Retry storms | `429` turns into a lockout | Pacing, `Retry-After`, a retry cap, and stop on first failure |

## Checklist

- [ ] The mapping file's columns, code lists and namespace match the provisioning app's attribute list.
- [ ] Both clients pass their tests, and the provenance fixture hash still matches.
- [ ] A new validation rule refuses by default, with a test for the refusal.
- [ ] The run sends complete records only.
- [ ] `max_disables_per_run` and `daily_call_budget` are set from the agency's numbers and license, not the defaults.
- [ ] The sending identity has `SynchronizationData-User.Upload.OwnedBy` (or `.Upload`) and nothing else; it uses a certificate or managed identity.
- [ ] The log reader is a separate identity with the narrowest permission that works.
- [ ] `quarantine.json` goes only to the access-controlled audit store; `validation-report.json`, `provenance.json` and `apply-results.json` go to the evidence store.
- [ ] Reconciliation compares the manifest's person keys with the provisioning logs and opens a finding for every gap.
- [ ] The endpoint and token authority match the tenant's cloud.

::: {.callout-tip}
## Continue the book
[Book index](index.md) · [Next: Chapter 03 — Writing a Validation Kit Check →](03-writing-a-validation-kit-check.md)
:::

[^c01-bulkupload]: Microsoft Learn, "Perform bulkUpload," <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-post-bulkupload?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^c01-concepts]: Microsoft Learn, "API-driven inbound provisioning concepts," <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-concepts> (accessed Oct 30, 2026).
[^c01-issues]: Microsoft Learn, "Troubleshoot inbound provisioning API issues," <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-issues> (accessed Oct 30, 2026).
[^c01-licensing]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals," <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (accessed Oct 30, 2026).
[^c01-availability]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 30, 2026).
[^c01-provlogs]: Microsoft Learn, "List provisioningObjectSummary," <https://learn.microsoft.com/graph/api/provisioningobjectsummary-list?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^c01-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^c01-throttling]: Microsoft Learn, "Microsoft Graph throttling guidance," <https://learn.microsoft.com/graph/throttling> (accessed Oct 30, 2026).
