# Verification — Chapter 01, The HR-to-Entra Middleware

New material; it replaces no workbook page. Code: `examples/hcm-entra`, extended in this change with a provenance manifest (`provenance.json`) in both clients, three new tests per language and a shared fixture hash (`tests/fixtures/expected_provenance_sha256.txt`). Test results on October 30, 2026: pytest 48 passed (Python 3.14.3); Pester 5.5.0 41 passed (PowerShell 7). A dry run of both clients on the sample extract gave the same counts (9 ready, 9 quarantined, 1 superseded), the same batch hash (`ab8f211e…`) and the same provenance batches and file hashes.

Microsoft Learn pages opened on October 30, 2026 through the Microsoft Learn MCP tools: Perform bulkUpload; API-driven inbound provisioning concepts; Troubleshoot inbound provisioning API issues; Microsoft Entra ID Governance licensing fundamentals; Microsoft Entra feature availability; List provisioningObjectSummary; Microsoft Graph national cloud deployments; Microsoft Graph throttling guidance.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `/bulkUpload` is asynchronous: `202 Accepted` means staged; `Location` points at the provisioning logs | Where the middleware sits | verified | Learn, Perform bulkUpload (Response table) |
| 2 | Up to 50 operations per request | Order, batch and hold; Verified facts | verified | Learn, Perform bulkUpload |
| 3 | Send the complete record every time; clear attribute values is preview and can clear on null, empty or omitted | Send the complete record | verified | Learn, inbound provisioning concepts, items 5–6 |
| 4 | 40 calls within any 5-second window | Pace, retry and stop | verified | Learn, concepts item 7.1; troubleshooting page |
| 5 | API reference says 40 requests per second | Pace, retry and stop; Verified facts | verified (pages conflict; code uses the stricter) | Learn, Perform bulkUpload, opening paragraph |
| 6 | 2,000 calls / 24 h with P1 or P2; 6,000 with ID Governance | Order, batch and hold | verified | Learn, concepts item 7.2 |
| 7 | 100,000 and 300,000 records a day | Order, batch and hold | verified | Learn, licensing fundamentals, API-driven provisioning |
| 8 | Bucket-full `500` during initial or full loads; ingestion queue per job | Pace, retry and stop | verified | Learn, troubleshooting page, "Bucket full 500" |
| 9 | Don't retry bucket-full in a loop | Pace, retry and stop | restated-as-design (labeled) | — |
| 10 | On 429 wait `Retry-After`; back off exponentially without it | Pace, retry and stop | verified | Learn, throttling guidance |
| 11 | Least privilege: application `SynchronizationData-User.Upload.OwnedBy`; delegated `SynchronizationData-User.Upload` with User Administrator | Lab 2; Verified facts | verified | Learn, Perform bulkUpload, Permissions and note |
| 12 | API-driven inbound provisioning available for Azure Government tenants | Verified facts | verified | Learn, feature availability, HR provisioning apps table |
| 13 | Provisioning logs: `AuditLog.Read.All` and `Directory.Read.All`; roles; L4 and L5 | Verified facts | verified | Learn, List provisioningObjectSummary |
| 14 | Concepts page names `ProvisioningLog.Read.All` for API clients | Verified facts | verified (conflicts with #13; chapter says to test the narrower one first) | Learn, concepts item 2 |
| 15 | Graph hosts per cloud; `login.microsoftonline.us`; tokens not interchangeable | Verified facts | verified | Learn, national cloud deployments |
| 16 | Feature needs Entra ID P1, P2 or ID Governance | Lab 2 | verified | Learn, concepts, license requirements |
| 17 | Refuse-by-default for new validation rules | Validate and fail closed | restated-as-design (labeled) | — |
| 18 | Provenance pattern from Book 13, Chapter 04 | Provenance manifest | workbook cross-reference | Book 13, Chapter 04 |
| 19 | Lifecycle rules, quarantine contract, pause switch | throughout | workbook cross-reference | Book 03, Chapters 05–06, Appendices A–B |
| 20 | Lab steps and outputs (exit codes, counts, hashes) | Lab 1 | verified by running the code | local run, October 30, 2026 |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| `examples/hcm-entra/README.md` (what it does, mapping, rules, run, test, limits) | The code; Validate and fail closed; Order, batch and hold; Pace, retry and stop | The attribute map table stays in the README; the chapter links it rather than copying it |
| README "Known limits: doesn't write provenance" | The provenance manifest (new) | Limit narrowed: the README now says the client writes `provenance.json` but doesn't ship it to an evidence store |
| Research page `hcm-entra-implementation.md` | Linked from Goal and audience | Its product background (the HR system) is out of scope for a developer chapter |

## Rework, October 30, 2026: start from Microsoft's CSV2SCIM sample

The owner asked that Microsoft migration material use as much Microsoft Learn content as possible, and that Microsoft's own sample be assessed as a replacement for the example. Learn's tutorial "API-driven inbound provisioning with PowerShell script" (read October 30, 2026) documents CSV2SCIM. The sample was copied unmodified from AzureAD/entra-id-inbound-provisioning at commit `f2e8c59f0af497b066c3484fc36a4197c2b37711` (March 2, 2026; MIT) into `examples/third_party/csv2scim`, with `snapshot.json` (hashes) and `SNAPSHOT.md`; `scripts/tests/test_third_party_snapshots.py` checks the hashes, and the `csv2scim-commits` feed watches upstream. Before running it, its payload-generation path was read: `Import-Csv | ConvertTo-ScimBulkPayload`, no sign-in and no network. It was then run offline on this book's fixture.

Assessment: it can't replace the example for a federal deployment (gaps below), so the chapter starts from it and keeps the example only for the gaps.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 21 | CSV2SCIM modes: validate mapping, generate payload, send, UpdateSchema, GetPreviousCycleLogs; 50 operations per request; mapping values are column names or script blocks | Start with Microsoft's sample | verified | Learn tutorial (Appendix and sections); pinned script |
| 22 | The mapping is CSV to SCIM only; app mappings stay in the provisioning app | What it does | verified | Learn tutorial, note in Appendix |
| 23 | Provided "as-is" for implementation reference; questions and enhancements through GitHub | What it does | verified | Learn tutorial, note |
| 24 | Learn lists custom validation as a customization to add | What it leaves to you | verified (quoted, 12 words) | Learn tutorial, task table row 2 |
| 25 | Client shouldn't implement comparison logic; the service applies IT rules | Where the middleware sits | verified (paraphrased) | Learn tutorial, implementation requirement |
| 26 | Sends all 19 fixture rows; pending and unknown worker types active; duplicate twice; empty `externalId`; file order; future hire active | What it leaves to you; Lab 1 | verified by running the pinned sample; pinned in `Csv2ScimBaseline.Tests.ps1` | local run, October 30, 2026 |
| 27 | `bulkId` is a new GUID per operation | What it leaves to you | verified | pinned script, `ConvertTo-ScimBulkPayload` (`New-Guid`); test |
| 28 | `/bulkUpload` and schema PUT hard-coded to `https://graph.microsoft.com/beta`; `Connect-MgGraph` called without an environment | What it leaves to you | verified | pinned script, `Invoke-AzureADBulkScimRequest`, `Set-AzureADProvisioningAppSchema`, sign-in block |
| 29 | Delegated scopes `Application.ReadWrite.All`, `AuditLog.Read.All`, `SynchronizationData-User.Upload` | What it leaves to you | verified | pinned script, sign-in block |
| 30 | No pacing of its own; relies on SDK retry | What it leaves to you | verified (no sleep or 429 handling in the script); SDK behavior per Learn throttling guidance | pinned script; Learn throttling guidance |
| 31 | Certificate flow adds `Application.Read.All` and `Synchronization.Read.All` | Lab 2; Verified facts | verified | Learn tutorial, certificate section step 6 |
| 32 | GCC uses the worldwide Graph endpoint; GCC High and DoD don't | What it leaves to you | verified | Learn, national cloud deployments |
| 33 | Use the sample for mapping, schema and logs in worldwide or GCC tenants; the hardened client for production and GCC High and DoD | What it leaves to you | restated-as-design (labeled) | — |
| 34 | Pin, hash and watch every sample you run | The pinned copy | restated-as-design (labeled) | — |

Tests after the rework, October 30, 2026: pytest 48 passed; Pester 48 passed (41 plus 7 baseline comparison tests); `scripts/tests` 84 passed.
