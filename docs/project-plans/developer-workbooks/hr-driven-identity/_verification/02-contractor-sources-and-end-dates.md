# Verification — Chapter 02, Contractor Sources and Enforced End Dates

New material; it replaces no workbook page. Code: `examples/hr-lifecycle`: `python/contractor_source.py`, `config/contractor-rules.json`, the `contractor-reconcile` task in `config/calls.json`, `tests/fixtures/ch02/` (register, cards, HR sponsors, contractor accounts; fictional), and the Chapter 02 block of `tests/test_writers_and_contractors.py` (7 tests), which also reads `examples/hcm-entra/tests/fixtures/hcm_extract_sample.csv` to pin the extract's column layout. The SCIM requests are built by the existing `examples/hcm-entra/python/hcm_to_scim.py`, unchanged. No Microsoft sample pinned.

Test results on November 1, 2026, Windows 11, Python 3.14.3 with pytest: 57 passed across the kit. Every Lab 1 command was run as written in `examples/hr-lifecycle` on November 1, 2026, and the output pasted; `out/ch02` was deleted afterwards. Nothing was sent to a tenant.

Microsoft Learn pages opened on November 1, 2026 through the Microsoft Learn MCP tools: Perform bulkUpload (full page); accessPackageAssignmentReviewSettings resource type; requestorManager resource type; Set-MgEntitlementManagementAssignmentPolicy. Carried: Microsoft Entra feature availability and Create an access review of an access package (the HR-driven identity guide's log); the user list's lifecycle permission (the validation kit's README, VK-HR-05).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | bulkUpload endpoint and `application/scim+json` | Sample section; Verified facts | verified | Learn, Perform bulkUpload |
| 2 | At most 50 user operations per request; rate limit 40 requests per second | Sample section; Verified facts | verified | same |
| 3 | Application least privilege `SynchronizationData-User.Upload.OwnedBy`; higher `SynchronizationData-User.Upload`; delegated `SynchronizationData-User.Upload` for a User Administrator | Sample section; Lab 2 | verified | same |
| 4 | Matching attributes from the job's mapping; `active` false disables; `manager.value` is the manager's `externalId` | Sample section | verified (examples 1 and 3) | same |
| 5 | `202 Accepted` with a `Location` header to the provisioning logs | Sample section; Lab 2 | verified | same |
| 6 | The bulkUpload page has no national cloud table; API-driven inbound provisioning listed available in Azure Government | Which cloud; differences | verified that the table is absent; availability **carried** from the feature availability page; that the API itself is available there is an inference | Learn, Perform bulkUpload; guide's log |
| 7 | reviewSettings properties and `expirationBehavior` values | Sample section; Verified facts | verified | Learn, accessPackageAssignmentReviewSettings |
| 8 | Review frequencies; Manager as reviewer with fallback; no-response choices | Sample section | carried forward | Guide's log (Create an access review of an access package) |
| 9 | Access reviews available in Azure Government; GCC commercial | Which cloud | carried forward | Guide's log (feature availability) |
| 10 | `requestorManager` documented for approval stages, `managerLevel` 1 to 2; not shown in `reviewSettings` | The sponsor review; differences | verified for approvals; **not verified** as a reviewer, confirmed in Lab 2 | Learn, requestorManager |
| 11 | Updating a policy: `Set-MgEntitlementManagementAssignmentPolicy`, `EntitlementManagement.ReadWrite.All` | The sponsor review; Lab 2 | verified; the code's `_target` note first named `Update-MgEntitlementManagementAssignmentPolicy`, which Learn doesn't show for v1.0; corrected to `Set-` on November 1, 2026 | Learn, Set-MgEntitlementManagementAssignmentPolicy |
| 12 | User list with `employeeLeaveDateTime`: `User.Read.All` and `User-LifeCycleInfo.Read.All` | Permissions table | carried forward | Validation kit README (VK-HR-05) |
| 13 | Earliest-end conditions and the contractor leaver | The earliest end | carried forward | Book 03, Appendix A |
| 14 | Contractors outside HR 2.0; register as source; sponsor as manager | Why contractors | carried forward | Book 03, Chapter 06; contractor evaluation |
| 15 | Grace period 30 days, recertification 180 days, upcoming 14 days | Rules | restated-as-design (labeled) | — |
| 16 | `examples/hcm-entra` maps worker type `C` to Contractor, code `CTR`; endpoint check accepts three Graph hosts | The code; Which cloud | verified by reading `examples/hcm-entra/config/mapping.json` and `hcm_to_scim.py` | repository |
| 17 | Lab 1 outputs (permission list; 9 records 3/4/2; decisions; 7 ready, 4 disables; 7 Finding, 1 Warn reconciliation; review block; 57 passed) | Lab 1 | verified by running the commands as written | local run, November 1, 2026 |
| 18 | Lab 2 behavior | Lab 2 | not run against a tenant | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Guide, Step 2 steps 1 to 6 | Earliest end, extract, reconciliation, sponsor review | Step 3 (the six questions with the register's owner) is governance, not code |
| Guide, Gate 2 interim path (contract end as `employeeLeaveDateTime`) | The extract's termination date; CR-05 | — |
| Guide, Gate 2 Validate (zero enabled contractors past their earliest end) | Lab 1 step 5; Federal requirements | — |
| Guide, pending proof of the contractor PIV path | Not carried | The card path is Chapter 05's and the evaluation's |
| Plan decision D-I3, task I5.2 | In this chapter | The source decision itself is the governance body's |
| Book 19, Chapter 01 and `examples/hcm-entra` | The code; Lab 1 step 4; Lab 2 step 2 | Not rebuilt |
