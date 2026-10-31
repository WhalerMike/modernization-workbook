---
title: "Chapter 01 — The HR-to-Entra Middleware"
description: "Building the middleware between an HR extract and Microsoft Entra ID's API-driven inbound provisioning, starting from Microsoft's own CSV2SCIM sample (pinned in the repository) and adding only what a federal deployment needs on top: validation that fails closed, quarantine, leaver-first and manager-first ordering, a mass-disable hold, pacing within the documented limits, all three US clouds, least privilege, and a provenance manifest, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-attribute-driven-migration
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
aliases:
  - /docs/books/b19-developer-workbook/01-the-hr-to-entra-middleware.html
review-status: approved
reviewed-sha256: db8eaf6d931064518adf17fd07f8974d11ed1cfb058ad323dc7bb498c3d59164
last-reviewed: 2026-10-31
---
# Chapter 01 — The HR-to-Entra Middleware

*Start from Microsoft's sample, then add only what it leaves to you: the provisioning service will do whatever the payload says, so the code that builds the payload is where the HR record stays true.*

::: {.callout-note}
## In this chapter
The middleware that reads an HR extract and feeds Microsoft Entra ID's API-driven inbound provisioning through the SCIM `/bulkUpload` endpoint. You start with Microsoft's own sample, **CSV2SCIM**, which Learn documents step by step and which the repository keeps as a pinned copy. You run it on this book's HR fixture and see what it sends. Then you build on `examples/hcm-entra` for what the sample leaves to you: validation that fails closed, quarantine, ordering, a mass-disable hold, pacing, all three US clouds, least privilege, and a provenance manifest that ties every batch to its inputs. Lab 1 runs both on fixtures with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you know what Microsoft ships for API-driven inbound provisioning and how to use it, what a federal deployment has to add, and how to run, change and test the code that adds it. You can say, for every rule in the pipeline, whether it is Microsoft's contract, Microsoft's sample, or the program's own design.

**Audience.** Developers who own the HR integration, and the engineers who review it. You should be comfortable in PowerShell 7 or Python and know what SCIM is. You don't need to know the HR product: everything here reads a CSV extract whose columns a mapping file names.

[Book 03, Chapter 05](../../../books/b03-hr-identity/05-the-provisioning-pipeline.md) describes the pipeline's duties (validate, normalize, sequence, send, reconcile) and [Chapter 06](../../../books/b03-hr-identity/06-canonical-attribute-schema.md) the canonical schema and attribute map. [Appendix A](../../../books/b03-hr-identity/appendix-a-lifecycle-rules.md) holds the lifecycle rules, and [Appendix B](../../../books/b03-hr-identity/appendix-b-security-and-privacy.md) the security and privacy rules for what the pipeline may log. This chapter is the developer's view of those pages.

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

The provisioning service owns the mapping from SCIM attributes to directory attributes, the matching of incoming records to existing users, and the write. The middleware owns everything before the POST: what is sent, in what order, how fast, and what record is kept of it. Microsoft's design intent is exactly that split: the client shouldn't implement the logic of comparing the system of record with the directory; the provisioning service applies the IT-managed rules.[^c01-csv2scim] The endpoint is asynchronous. A `202 Accepted` means the batch was staged for the provisioning job, not that any user was written; the `Location` header points at the provisioning logs, where the per-record result appears.[^c01-bulkupload]

## Start with Microsoft's sample: CSV2SCIM

Microsoft publishes a PowerShell sample for this integration, **CSV2SCIM**, and documents it on Learn in a full tutorial: download, generate a payload, authenticate with a certificate, send, extend the provisioning schema, and read the provisioning logs.[^c01-csv2scim] Use it. Most of what a first integration needs is already there, maintained by Microsoft, and every step has a Learn page behind it.

### What it does

| Mode | Parameters | What it does | Network |
|---|---|---|---|
| Validate the mapping | `-AttributeMapping $map -ValidateAttributeMapping` | Checks a `.psd1` mapping of CSV columns against the SCIM Core and Enterprise User schema | none |
| Generate a payload | `-Path <csv> -AttributeMapping $map [-ScimSchemaNamespace <urn>]` | Turns each CSV row into a SCIM user, 50 operations per bulk request; with a namespace, every column also goes under that custom extension | none |
| Send | add `-ServicePrincipalId`, `-TenantId`, and `-ClientId` with `-ClientCertificate` | Signs in and POSTs each bulk request to the job's `/bulkUpload` | Graph |
| Extend the app's schema | `-UpdateSchema -ScimSchemaNamespace <urn>` | Adds every CSV column to the provisioning app's schema under the extension namespace | Graph |
| Read the logs | `-GetPreviousCycleLogs [-NumberOfCycles n]` | Summarizes the latest sync cycles from the provisioning logs, per record | Graph |

The mapping file is the sample's main idea. Each SCIM attribute names a CSV column, or a script block that computes the value from the row, such as `active = { $_.'WorkerStatus' -eq 'Active' }`.[^c01-csv2scim] Learn is careful to say this mapping is CSV to SCIM only; the mapping from SCIM to Entra ID or AD attributes stays in the provisioning app.[^c01-csv2scim]

Microsoft provides the script "as-is" for implementation reference and takes questions and changes through its GitHub repository.[^c01-csv2scim] It is MIT-licensed.

### The pinned copy

A link to the sample's `main` branch changes under you. The repository therefore keeps an unmodified copy in [`examples/third_party/csv2scim`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/csv2scim), taken at upstream commit `f2e8c59` (March 2, 2026) and retrieved October 30, 2026.[^c01-csv2scim-code] `snapshot.json` records the commit and the SHA-256 of every file, and a unit test fails if any file changes. The weekly source watch follows commits to the upstream folder and lists each one in its issue under this book, so a new version is a decision someone reviews, never a surprise. *Design guidance:* treat any sample you run the same way: pin it, hash it, watch upstream, and update it in a reviewed change.

### What it leaves to you

Run on this book's HR fixture (19 rows, Lab 1 below), CSV2SCIM sends all 19. That is by design: it is a converter, and validation is listed on Learn as a customization you add ("update the PowerShell script to include any custom CSV data validation logic").[^c01-csv2scim] A federal deployment has to add it, and more. The second column is what the pinned copy does. The tests in `examples/hcm-entra/tests/powershell/Csv2ScimBaseline.Tests.ps1` check the validation, duplicate, order, future-hire and repeatability rows against the fixture; the cloud and privilege rows come from reading the pinned script.

| Concern | CSV2SCIM at `f2e8c59` | What `examples/hcm-entra` adds | Why it matters |
|---|---|---|---|
| Record validation | Validates the mapping, not the values. A blank key, a 17-character key, a pending worker and an unknown worker type are all sent, active | Fails closed: 9 of the 19 rows are quarantined with reasons | A bad HR row becomes a bad account |
| Duplicates | A person with two rows is sent twice | A single separation wins; otherwise both are refused | Two writes race in the job |
| Order | File order | Leavers first, then managers before reports | A departing mover briefly gains access; a manager reference can't resolve |
| Future hires | Sent active | Sent disabled until the hire date ([Book 03, Appendix C](../../../books/b03-hr-identity/appendix-c-acceptance-and-cutover.md)) | An account works before day one |
| Mass change | No limit | `max_disables_per_run` holds the run | One bad extract disables everyone |
| Pacing and budget | No pacing of its own; relies on the Graph SDK's retry handling | 40 calls in any 5 seconds, a daily call budget, `Retry-After`, stop on first failure | Throttling, and the tenant's daily quota |
| Clouds | `/bulkUpload` and the schema update are hard-coded to `https://graph.microsoft.com/beta`, and sign-in names no cloud | The endpoint must be one of the three Graph hosts; v1.0 or beta | Works in GCC (worldwide endpoint); can't reach GCC High or DoD as written[^c01-deployments] |
| Least privilege | Delegated sign-in asks for `Application.ReadWrite.All`, `AuditLog.Read.All` and `SynchronizationData-User.Upload` | One permission to send; a separate log reader | `Application.ReadWrite.All` can change any app in the tenant |
| Repeatability | Each operation's `bulkId` is a new random GUID | `bulkId` is the person key, so the same input gives the same batch hash | Without that, a batch can't be traced to its inputs |
| Evidence | Console output | `validation-report.json`, `quarantine.json`, `provenance.json`, `apply-results.json` | The ISSO needs records, not a screen |

*Design guidance:* use CSV2SCIM where it is strong and the tenant is worldwide or GCC: validating a mapping file, extending the provisioning app's schema with `-UpdateSchema`, and reading cycle logs while you test. Use the hardened client for production sends, and everywhere in GCC High and DoD. If you would rather extend CSV2SCIM itself, the table is the list of changes to make; contribute them upstream through Microsoft's repository, as Learn invites.[^c01-csv2scim]

## The code: what `examples/hcm-entra` adds

The example is two equivalent clients, Python and PowerShell 7, that read the same mapping file and produce the same output for the same input. Its SCIM payload follows the shape of Learn's `/bulkUpload` examples: Core and Enterprise User, plus one custom extension namespace.[^c01-bulkupload]

| File | What it does |
|---|---|
| `config/mapping.json` | Column to SCIM map, code lists, worker types, length limits, batch size |
| `config/csv2scim/AttributeMapping.psd1` | The same columns as a CSV2SCIM mapping, for the baseline and for `-UpdateSchema` |
| `config/settings.example.json` | Non-secret settings: endpoint, time offsets, disable threshold, call budget, pacing, retries |
| `python/hcm_to_scim.py` | The Python client (standard library only, Python 3.10 or later) |
| `powershell/HcmToScim.psm1`, `Invoke-HcmToScim.ps1` | The same in PowerShell 7.2 or later |
| `tests/` | pytest and Pester 5 against `tests/fixtures/hcm_extract_sample.csv`, including the CSV2SCIM comparison |

### Validate and fail closed

`build_operation` (Python) and `ConvertTo-HcmScimOperation` (PowerShell) take one row and either build a SCIM operation or refuse it with reasons. A row is refused when a required column is empty, the person number doesn't fit `employeeId`, the worker type is unknown or refused (pending workers and nonworkers), a code isn't in the code list, a value is longer than the target attribute holds, a date doesn't parse, a worker is recorded as their own manager, or an inactive assignment has no termination date. Every refused row goes to `quarantine.json` with its reasons, the unchanged HR row and the attempted payload: the quarantine contract in [Book 03, Appendix A](../../../books/b03-hr-identity/appendix-a-lifecycle-rules.md).

Some rules are warnings, not refusals. A suspended assignment keeps the account active ("leave is not a leaver"). A manager separating in the same run never blocks the joiner. A separation older than the Lifecycle Workflows catch-up window is flagged for the on-demand leaver workflow. *Design guidance:* treat every new validation rule as a refusal until the HR owner agrees it can be a warning.

### Send the complete record every time

Learn's guidance is to include the complete user record in every bulk request, for full and delta runs alike. When the provisioning job's *clear attribute values* feature (preview) is on, a null or empty mapped value clears the target, and so can an omitted attribute.[^c01-concepts] The client never sends a partial record.

### Order, batch and hold

Leavers go first, then managers before their reports, then person key. When one person has several rows, a single separation wins and the rest are marked superseded; any other duplicate is refused. Each request carries at most 50 operations.[^c01-bulkupload]

Two guards hold the whole run (exit code 3) until someone confirms it with `--confirm-large-delta`: more disables than `max_disables_per_run`, and more calls than `daily_call_budget`. The second follows Microsoft's tenant quota: 2,000 calls in 24 hours with Microsoft Entra ID P1 or P2, and 6,000 with Microsoft Entra ID Governance,[^c01-concepts] which at 50 records a call is 100,000 and 300,000 records a day.[^c01-licensing]

### Pace, retry and stop

Learn's concepts page sets the endpoint's limit at 40 calls within any 5-second window;[^c01-concepts] the API reference says 40 requests per second.[^c01-bulkupload] The client paces to the stricter: `min_seconds_between_calls` can't be below 0.125 seconds. On `429` or `503` it waits for `Retry-After`, backing off exponentially when the header is missing, as Graph's throttling guidance says.[^c01-throttling] It stops at the first failed batch; the next run resends complete records. A `500` saying the ingestion "bucket" is full means the job's queue is backed up, typically during an initial or full load;[^c01-issues] *design guidance:* wait for it to drain and rerun, don't retry in a loop.

### The provenance manifest

`provenance.json` ties every sent batch to the exact inputs that produced it:

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

Each `batch_sha256` is the hash `apply-results.json` records when that batch is sent, over the same canonical JSON. An auditor can go from a line in the provisioning logs to the person key, to the batch and its `Location`, to the extract and mapping files by hash. That only works because `bulkId` is the person key: with a random `bulkId`, as in the sample, the same input would never produce the same hash. The manifest carries keys and hashes only, so it can sit in the evidence store; [Book 13, Chapter 04](../../../books/b13-governance/04-change-control-and-provenance.md) describes the provenance pattern it follows.

### The tests

The Python suite has 48 tests and the PowerShell suite 48, all passing. They cover every rule above; that the two clients produce the same payloads, hashes and provenance (shared fixture hashes); and, in `Csv2ScimBaseline.Tests.ps1`, seven tests that run the pinned CSV2SCIM offline on the same fixture and pin the differences it can observe there. If a future CSV2SCIM version adds validation or ordering, those tests fail on the snapshot update, which is the prompt to shrink our client.

::: {.callout-warning}
## Illustrative code
The commands below run the pinned sample and the example as published in the repository. They are tested against fixtures, not against a production tenant. Review both, and run them in a test tenant, before they carry real HR data.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7 with Pester 5 (and Python 3.10 or later for the Python client). Nothing in this lab touches the network: CSV2SCIM's validate and generate modes read local files only, and the example's sender is tested with a fake poster.

1. **Run Microsoft's sample on the fixture.** From `examples`:

   ```powershell
   $map = Import-PowerShellDataFile ./hcm-entra/config/csv2scim/AttributeMapping.psd1
   ./third_party/csv2scim/src/CSV2SCIM.ps1 -Path ./hcm-entra/tests/fixtures/hcm_extract_sample.csv -AttributeMapping $map -ValidateAttributeMapping
   ./third_party/csv2scim/src/CSV2SCIM.ps1 -Path ./hcm-entra/tests/fixtures/hcm_extract_sample.csv -AttributeMapping $map `
       -ScimSchemaNamespace 'urn:ietf:params:scim:schemas:extension:contoso:1.0:User' > baseline.json
   ```

   The first command returns `True`. Open `baseline.json`: one bulk request with 19 operations. Find person 100006 (worker type `P`, a pending worker): `active` is `true`. Find person 100008: it is there twice. One operation has an empty `externalId`.

2. **Run the hardened client on the same fixture:**

   ```text
   cd hcm-entra
   python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out
   ```

   It exits with code `2`. Counts: 9 ready, 9 quarantined, 1 superseded. The PowerShell client (`pwsh -File powershell/Invoke-HcmToScim.ps1 -Extract tests/fixtures/hcm_extract_sample.csv -AsOf 2026-10-25 -Out out-ps`) gives the same.

3. **Compare.** In `out/quarantine.json`, find 100006 and its reason (worker type `P` refused) and the blank-key row. In `out/bulk-request-001.json`, the first operation is the leaver, 100003, with `active` false; in `baseline.json`, the first is 100000. Find 100001 (hire date after the run date): disabled in ours, active in the baseline.

4. **Check provenance.** Open `out/provenance.json` and hash the extract yourself:

   ```text
   python -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" tests/fixtures/hcm_extract_sample.csv
   ```

   It matches `extract_sha256`. Run CSV2SCIM's generate step twice and compare: the `bulkId` values differ every time. Run our client twice: identical batches and hashes.

5. **Break something on purpose.** Change one worker's `DepartmentCode` to `org-100` (lower case) in a copy of the extract. Our client quarantines that worker with a code-list reason; CSV2SCIM sends it.

6. **Hold a run.** Pass settings containing `{"max_disables_per_run": 1}` with `--settings` and see exit code `3`.

7. **Run the tests:**

   ```text
   python -m pytest -q -p no:cacheprovider tests/python
   pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
   ```

**Expected result:** 48 Python and 48 Pester tests passing, and the differences in the table above, seen with your own eyes.

## Lab 2: test tenant

Use a test tenant, never production, and fictional records only.

1. **Create the provisioning app.** Create an API-driven inbound provisioning app that provisions to Microsoft Entra ID, following Learn's configuration guide; the feature needs Microsoft Entra ID P1, P2 or ID Governance.[^c01-concepts] Copy its **Provisioning API Endpoint**.
2. **Extend its schema with Microsoft's sample** (worldwide or GCC tenant): run CSV2SCIM's `-UpdateSchema` mode with the extension namespace from `mapping.json` and your provisioning app's object ID, as Learn shows.[^c01-csv2scim] It adds every extract column to the app's attribute list. Then map the attributes you need in the admin center. In GCC High or DoD, add the attributes in the admin center instead: the sample can't reach those clouds as written.
3. **Grant the least privilege to the sender.** Use a managed identity or an app with a certificate, never a secret. The least-privileged application permission is `SynchronizationData-User.Upload.OwnedBy` when the app owns the provisioning service principal; otherwise `SynchronizationData-User.Upload`.[^c01-bulkupload] Don't give the production sender CSV2SCIM's sign-in scopes. For CSV2SCIM's certificate flow, Learn adds `Application.Read.All` and `Synchronization.Read.All` so the script can look up the job;[^c01-csv2scim] keep that identity for testing.
4. **Start the job and set its safety nets.** Start the job, set the notification email, and turn on accidental-deletions prevention.
5. **Send five records with the hardened client.** Put the endpoint in `config/settings.json`, a token for the tenant's Graph host in `HCM_ENTRA_BEARER_TOKEN`, and run with `--apply` on five valid rows. Expect one batch, a `202`, and a `Location` in `apply-results.json`.
6. **Reconcile.** Read the cycle with CSV2SCIM's `-GetPreviousCycleLogs` (worldwide or GCC), or query `GET /auditLogs/provisioning` filtered on the job. Every person key in `provenance.json`'s batch should appear with a result; one that doesn't is a finding.
7. **Back it out.** Send the five records again as `INACTIVE` with a termination date, delete the test users and the app, and unset the token variable.

## Verified facts

| Call | Endpoint | Least-privileged permission | US Government clouds | Stage |
|---|---|---|---|---|
| Send a batch | `POST /servicePrincipals/{id}/synchronization/jobs/{jobId}/bulkUpload`, `Content-Type: application/scim+json` | Application: `SynchronizationData-User.Upload.OwnedBy`; delegated: `SynchronizationData-User.Upload` with User Administrator[^c01-bulkupload] | API-driven inbound provisioning is listed as available for Azure Government tenants[^c01-availability] | v1.0 |
| Read results | `GET /auditLogs/provisioning` with `$filter` on `jobId` | `AuditLog.Read.All` and `Directory.Read.All`; delegated callers also need a role such as Reports Reader or Global Reader[^c01-provlogs] | Global, US Government L4 and L5[^c01-provlogs] | v1.0 |
| CSV2SCIM, certificate flow | the script's own sign-in | `Application.Read.All` and `Synchronization.Read.All` added to the app, to look up the provisioning job[^c01-csv2scim] | worldwide endpoint only, as written[^c01-csv2scim-code] | sample |
| Graph host | `graph.microsoft.com` (worldwide and Microsoft 365 GCC), `graph.microsoft.us` (GCC High), `dod-graph.microsoft.us` (DoD); token authority `login.microsoftonline.us` for the US Government clouds | — | Tokens from one cloud don't work in another[^c01-deployments] | — |

Limits the hardened client enforces: at most 50 operations a request;[^c01-bulkupload] 40 calls in any 5 seconds (the stricter of Learn's two statements); 2,000 or 6,000 calls in 24 hours by license;[^c01-concepts] `Retry-After` on `429` and `503`.[^c01-throttling]

Two things Learn states differently on different pages:

- **The rate limit.** The API page says 40 requests per second; the concepts and troubleshooting pages say 40 calls per 5 seconds.[^c01-issues] The client uses the stricter.
- **The log-reading permission.** The concepts page tells admins to grant `ProvisioningLog.Read.All`;[^c01-concepts] the List provisioningObjectSummary page names `AuditLog.Read.All` and `Directory.Read.All`.[^c01-provlogs] Try the narrower one first in the test tenant.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Sending a sample's output to production unchanged | Pending workers, duplicates and blank keys reach the directory | The hardened client for production sends; the baseline tests show what the sample doesn't check |
| A sample that changes under you | Labs and behavior drift without anyone deciding | The pinned copy, its hash test, and the weekly upstream watch |
| Over-broad sign-in scopes | `Application.ReadWrite.All` on an identity that only needs to upload | One permission for the sender; the sample's identity kept to the test tenant |
| Wrong cloud | A GCC High tenant can't be reached, or a token goes to the wrong host | The endpoint allow-list of the three Graph hosts |
| Partial records | An omitted attribute clears the target when clearing is on (preview)[^c01-concepts] | Every record is built complete |
| Mass disable from a bad extract | Hundreds of accounts disabled before anyone looks | `max_disables_per_run` holds the run |
| Treating `202` as success | A record that failed in the job is never followed up | Reconcile against the logs, using the manifest's person keys |
| Personal data in logs | Names and payloads in the operational log | The report and manifest carry keys and hashes only |

## Checklist

- [ ] The CSV2SCIM mapping validates (`-ValidateAttributeMapping` returns `True`), and the provisioning app's attribute list carries the extension namespace.
- [ ] The pinned CSV2SCIM copy matches its manifest, and every upstream commit since the pin has been reviewed.
- [ ] Production sends go through the hardened client; the baseline comparison tests pass.
- [ ] Both clients pass their tests, and the provenance fixture hash still matches.
- [ ] A new validation rule refuses by default, with a test for the refusal.
- [ ] `max_disables_per_run` and `daily_call_budget` are set from the agency's numbers and license.
- [ ] The sending identity has `SynchronizationData-User.Upload.OwnedBy` (or `.Upload`) and nothing else, with a certificate or managed identity.
- [ ] `quarantine.json` goes only to the access-controlled audit store; the other outputs go to the evidence store.
- [ ] Reconciliation opens a finding for every person key missing from the provisioning logs.
- [ ] The endpoint and token authority match the tenant's cloud.

::: {.callout-tip}
## Continue the book
[Workbook index](index.md) · [Next: Chapter 02 — Graph Clients for the Government Clouds →](02-graph-clients-for-government-clouds.md)
:::

[^c01-csv2scim]: Microsoft Learn, "API-driven inbound provisioning with PowerShell script," <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-powershell> (accessed Oct 30, 2026).
[^c01-csv2scim-code]: Microsoft, CSV2SCIM sample, AzureAD/entra-id-inbound-provisioning, `PowerShell/CSV2SCIM` at commit `f2e8c59f0af497b066c3484fc36a4197c2b37711` (March 2, 2026), MIT License, <https://github.com/AzureAD/entra-id-inbound-provisioning/tree/f2e8c59f0af497b066c3484fc36a4197c2b37711/PowerShell/CSV2SCIM> (accessed Oct 30, 2026); pinned copy in `examples/third_party/csv2scim`.
[^c01-bulkupload]: Microsoft Learn, "Perform bulkUpload," <https://learn.microsoft.com/graph/api/synchronization-synchronizationjob-post-bulkupload?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^c01-concepts]: Microsoft Learn, "API-driven inbound provisioning concepts," <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-concepts> (accessed Oct 30, 2026).
[^c01-issues]: Microsoft Learn, "Troubleshoot inbound provisioning API issues," <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-issues> (accessed Oct 30, 2026).
[^c01-licensing]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals," <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (accessed Oct 30, 2026).
[^c01-availability]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 30, 2026).
[^c01-provlogs]: Microsoft Learn, "List provisioningObjectSummary," <https://learn.microsoft.com/graph/api/provisioningobjectsummary-list?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^c01-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^c01-throttling]: Microsoft Learn, "Microsoft Graph throttling guidance," <https://learn.microsoft.com/graph/throttling> (accessed Oct 30, 2026).
