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
