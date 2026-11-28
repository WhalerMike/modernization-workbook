# Verification — Chapter 03, Scheduled Checks: Synchronization, Roles and Log Forwarding

New material, written November 27, 2026. Code: `Invoke-HtSyncCheck`, `Invoke-HtRoleReview`, `Test-HtLogForwarding`, `Write-HtRun`, `deploy/Invoke-HtScheduledRun.ps1`, `deploy/Register-HtScheduledJobs.ps1`, `deploy/eventlog-dcr.json`. Every Microsoft fact is carried from Book 15, Chapter 12, *Building the Daily Checks Workbook* or the kit's `config/calls.json`, with the original read date; none was re-read for this chapter. Lab 1 was run with `python scripts/kit_captures.py ht` on November 27, 2026; the output is `data/kit-captures/ht/03-*.txt`.

**One kit change with this chapter.** `Invoke-HtScheduledRun.ps1` named the template's `_comment` as a setting to fill in, because the comment's text contains `<placeholder>`; it now skips keys starting with `_` and lists the rest in order. `Invoke-HtRequestPipeline.ps1` gained the same check, before it signs in. Tests added in `The platform host jobs` and `The request pipeline on the platform host`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Entra Connect's default cycle, 30 minutes | Start with | carried (Book 15 Ch12, Oct 21) | `ht03-scheduler` |
| 2 | `organization` sync properties; `Organization.Read.All` | Start with | carried (Book 15 Ch12) | `ht03-org` |
| 3 | Advanced query; `PropertyConflict` the only category (quoted) | Start with | carried (Book 15 Ch12) | `ht03-adv`, `ht03-perr` |
| 4 | healthOverviews, `ServiceHealth.Read.All` | Start with | carried (kit) | `ht03-health` |
| 5 | Role definitions/assignments `RoleManagement.Read.Directory`; Intune `DeviceManagementRBAC.Read.All`, Intune license | Start with | carried (kit `config/calls.json` note) | `ht03-roles`, `ht03-intune` |
| 6 | AMA on Arc servers; collects by associated rules | Start with | carried (DC workbook, Nov 19) | `ht03-ama` |
| 7 | `Event` table; `LogName!XPathQuery`; Sentinel connector to `SecurityEvent` | Start with | carried (DC workbook, Nov 19) | `ht03-ama-events` |
| 8 | Resource Graph with Reader; Log Analytics API with Log Analytics Reader | Start with | carried (kit) | `ht03-arg`, `ht03-law` |
| 9 | Thresholds (90 minutes, 90 days, 6 hours), the four schedules | The code | read in config and scripts | kit |
| 10 | Lab 1 outputs (18 minutes; 2 errors; 1 service; 138 minutes HT-SY-01; 3 roles, 3 findings and a warning; SYNC02 HT-LF-02/03; three XPath entries; exit 2 ×3; four tasks; 22 tests) | Lab 1 | verified by running the commands | `data/kit-captures/ht/03-*.txt` |
| 11 | Lab 2 behavior | Lab 2 | not run | — |

## Not yet specified

N1 the built-in role to create the rule and associations on Arc machines; N2 the delay before a new association's first `Event` record; N3 whether `Invoke-AzRestMethod -Path` accepts the Resource Graph path the module builds (the kit's live path for `arg-dcr-associations`).

## Federal requirements and evidence

Four rows; `config/requirements.json` for `sync-check` (CA-7, SI-4, AU-6, CP-9; KSI-MLA-EVC, KSI-MLA-OSM), `role-review` (AC-2, AC-6, AC-6(7); KSI-IAM-ELP, KSI-IAM-JIT) and `log-forwarding-check` (AU-2, AU-6, AU-9, AU-11; KSI-MLA-OSM, KSI-MLA-LET, KSI-MLA-RVL). No new pair.

## Overlap search (origin/main, November 27, 2026)

Searched for "morning synchronization", `onPremisesLastSyncDateTime`, "provisioning error", "custom role", "role register", "data collection rule", "event-log", "Azure Monitor Agent". Found: Book 15, Chapter 12, tasks 6 to 8 and its server-side checks (linked); *Building the Daily Checks Workbook* (the daily checks on one Azure Monitor workbook, a different output of the same data; not repeated); Book 12 for the log platform. Book 15's 90-minute threshold and the kit's `lateMinutes` agree. No conflict.
