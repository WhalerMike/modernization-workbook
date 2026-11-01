# Verification — Chapter 06, Separation Timing from the Logs

New material; it replaces no workbook page. Code: `examples/hr-lifecycle` (new kit): `python/separation_timing.py` (`measure`), `config/separation.json`, the `separation-read` calls in `config/calls.json`, read by `python/graph_export.py`; fixtures `tests/fixtures/ch06/` (`hr-separations.csv`, `leaver-users.json`, `separation-audits.json`, `leaver-results.json`, `card-revocations.csv`, `device-actions.csv`, `role-holders.csv`); tests in `tests/test_credentials_separation_drift.py` (the Chapter 06 block). No Microsoft sample pinned: Learn publishes no sample for measuring separation timing; the code reads the v1.0 resources Learn documents.

Test results on November 1, 2026, Windows 11, Python 3.14.3 with pytest: 57 passed across the kit; this chapter's are 4 (`test_separation_intervals_and_summary`, `test_separation_rules`, `test_a_failed_audit_record_is_not_a_block`, `test_a_cancelled_separation_isnt_measured_or_flagged`). Nothing was sent to a tenant.

Microsoft Learn pages opened on November 1, 2026 through the Microsoft Learn MCP tools: Microsoft Entra audit log categories and activities (Core Directory, Lifecycle Workflows); List directoryAudits; userProcessingResult resource type; List userProcessingResults (workflow and run); Lifecycle workflows execution conditions and scheduling (scheduling, catch-up window, time-based attribute trigger); Understanding lifecycle workflows (scheduling, on-demand); Lifecycle Workflow built-in tasks (Disable user account, Revoke all refresh tokens for user).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Activities *Disable account*, *Enable account*, *Delete user*, *Update StsRefreshTokenValidFrom Timestamp* in Core Directory, UserManagement | Start with Microsoft's procedure; verified facts | verified | Learn, audit activities |
| 2 | List directoryAudits: `AuditLog.Read.All`; Reports Reader, Security Reader, Security Administrator; `$filter` `eq`, `ge`, `le`, `startswith`; L4 and L5 | Permissions; verified facts | verified | Learn, List directoryAudits |
| 3 | List userProcessingResults: `LifecycleWorkflows-Reports.Read.All`; Global Reader or Lifecycle Workflows Administrator; L4 and L5 | Permissions; verified facts | verified | Learn, List userProcessingResults |
| 4 | userProcessingResult properties, including `workflowExecutionType` `scheduled`, `onDemand` | Start with Microsoft's procedure | verified | Learn, resource type |
| 5 | Scheduled evaluation every three hours by default or the set interval; three-day catch-up window; on-demand runs ignore execution conditions; V2 trigger (preview) has no catch-up window | ST-03; differences | verified | Learn, execution conditions; understanding lifecycle workflows |
| 6 | *Update StsRefreshTokenValidFrom Timestamp* is the record the revoke task (or the revoke call) writes | The intervals | open: Learn lists the activity but doesn't tie it to the task; Lab 2 confirms | — |
| 7 | *Disable user account* doesn't support users with role assignments or members or owners of role-assignable groups | ST-06 | verified | Learn, built-in tasks |
| 8 | Only `success` audit records count | The intervals | code behavior, pinned by test | local run |
| 9 | FIPS 201-3: an uncollected card terminated within 18 hours of notification | ST-04; federal requirements | carried forward from Book 03, Chapter 09 and the guide's Gate 6 | Book 03 |
| 10 | The two intervals' definitions | Why this gate | carried forward from Book 03, Chapter 11 | Book 03 |
| 11 | Leaver order checked by `lcwext.py check-workflow`; the custom task extension | Why this gate | carried forward from Book 19, Chapter 05 | Book 19 |
| 12 | Lifecycle Workflows available in Azure for US Government | Which cloud | carried forward from the guide's verification log | Learn, feature availability |
| 13 | PS-4, AC-2(3), PS-7, AC-2(13) in the Moderate baseline | Federal requirements | carried forward from the guide's verification log | NIST SP 800-53B |
| 14 | Thresholds 4 hours and 24 hours; 24-hour lookback; set the threshold and the schedule together; failed runs to a high-priority exception | Rules | restated-as-design (labeled); the thresholds are samples the agency replaces | — |
| 15 | Lab 1 outputs (call list; 7 separated, 1 cancelled, 1 not blocked; p50/p90/max; 10 Finding, 2 Warn; the findings list; the intervals) | Lab 1 | verified by running the commands as written | local run, November 1, 2026 |
| 16 | Lab 2 behavior | Lab 2 | not run against a tenant | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Guide, Gate 6 steps 1 to 9; plan tasks I4.1, I4.2, I4.6 | Why this gate; the rules | Configuring the workflow and the emergency path is operator material and Book 19, Chapter 05's code; this chapter measures them |
| Guide, Gate 6 requirements table | Federal requirements and evidence | Linked, restated only as the code's contribution |
| Book 03, Chapter 08 (triggers and schedule; deletion) | Linked; ST-08 | Design not restated |
| Book 03, Chapter 09 (canonical leaver sequence) | Linked; the block definition | — |
| *Building Privileged Access*, Chapter 01 | `--role-holders` | The inventory itself isn't rebuilt |
| Guide, Gate 1 (two writers of account state) | ST-05 | Chapter 01 scans the writers; ST-05 flags the effect on a leaver |
