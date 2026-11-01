# Verification — Chapter 01, The Writer Register as Code

New material; it replaces no workbook page. Code: `examples/hr-lifecycle` (new kit): `python/writer_register.py`, `python/hrlc_core.py`, `python/graph_export.py`, `config/writer-register.json`, the `writers-scan` task and its two calls in `config/calls.json`, `tests/fixtures/ch01/directory-audits.json` (14 fictional records shaped like Learn's example), the Chapter 01 block of `tests/test_writers_and_contractors.py` (9 tests) and `tests/test_core.py` (10 shared tests). No Microsoft sample pinned: Learn gives the API and the activity list, not a runnable sample for this task.

Test results on November 1, 2026, Windows 11, Python 3.14.3 with pytest: 57 passed across the kit. Every Lab 1 command was run as written in `examples/hr-lifecycle` on November 1, 2026, and the output pasted; `out/ch01` was deleted afterwards. Nothing was sent to a tenant.

Microsoft Learn pages opened on November 1, 2026 through the Microsoft Learn MCP tools: List directoryAudits (full page); Microsoft Entra audit log categories and activities (Core Directory, Lifecycle Workflows sections); List provisioningObjectSummary. Carried: Microsoft Graph national cloud deployments (Book 19, Chapter 02); Microsoft Entra feature availability (the HR-driven identity guide's log).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `GET /auditLogs/directoryAudits`; `AuditLog.Read.All` least privileged, delegated and application; Directory.Read.All higher | Sample section; permissions table; Verified facts | verified | Learn, List directoryAudits |
| 2 | Delegated roles: Reports Reader, Security Administrator, Security Reader | Permissions table | verified | same |
| 3 | `$filter` supports `eq`, `ge`, `le`, `startswith` | Sample section; saved queries | verified | same |
| 4 | directoryAudits available in global, US Government L4 and L5 | Which cloud | verified | same |
| 5 | Record shape: `activityDisplayName`, `activityDateTime`, `result`, `initiatedBy.app`/`user`, `targetResources[].modifiedProperties` | Sample section; Verified facts | verified (examples on the page) | same |
| 6 | Activities `Add user`, `Update user`, `Enable account`, `Disable account`, `Delete user`, `Set user manager` (Core Directory, UserManagement) | Sample section; register | verified | Learn, audit log categories and activities |
| 7 | `GET /auditLogs/provisioning`; `AuditLog.Read.All` and `Directory.Read.All`; L4 and L5 | Permissions table; Which cloud | verified | Learn, List provisioningObjectSummary |
| 8 | Graph hosts per cloud | Which cloud | carried forward | Book 19, Chapter 02 |
| 9 | The `modifiedProperties` display names for hire date, leave date, extension attributes 10 and 11 and `certificateUserIds` | The register; Lab 2 step 4 | **not verified**: Learn's examples don't list per-property display names; the register's values are the program's reading, confirmed in Lab 2 | — |
| 10 | The service principal each service (provisioning, Lifecycle Workflows) writes as | Places Learn says nothing | **not verified**: no Learn list; taken from the tenant's own records in Lab 2 | — |
| 11 | Audit retention 30 days with P1 or P2, not retroactive | Which cloud; dangers | carried forward | Book 03, Chapter 11 |
| 12 | Directory synchronization available in Azure Government; GCC commercial | Verified facts | carried forward | Guide's log (feature availability) |
| 13 | AC-2, IA-4, AU-6 in the Moderate baseline; ISSO evidence | Federal requirements | carried forward | Guide, Gate 1 table; guide's log (SP 800-53B OSCAL profile) |
| 14 | Rules WR-01 to WR-09, WS-01, WS-02, WS-04 and their severities | The checks | restated-as-design (labeled); implemented in `writer_register.py` | — |
| 15 | Lab 1 outputs (permission list; 0/0/0 register; 11 writes, 5 Finding, 1 Warn; six findings; saved query; 57 passed) | Lab 1 | verified by running the commands as written | local run, November 1, 2026 |
| 16 | Lab 2 behavior | Lab 2 | not run against a tenant | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Guide, Step 1 table (lifecycle rows) | `config/writer-register.json`; rules WR-04, WR-05 | — |
| Guide, Step 1 steps 2 to 4 (scope filter, remove write paths, audit query) | WR-09; "What the scan doesn't see"; `queries.json` | Removing write paths is operator work (delegation export, OU ACL review), not readable from Graph |
| Guide, Gate 1 interim path (sync as writer, gMSA, quarterly ACL review) | `ad-sync` writer; dangers | The AD side isn't read by this code |
| Book 03, Chapters 04, 06, 11 | Why this gate comes first | Design not restated |
| Validation kit VK-HR-04, VK-HR-07 | The code section | They measure values, not writers; not rebuilt |
| Plan tasks I1.2, I1.4 | In this chapter | — |
