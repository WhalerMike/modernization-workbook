# Verification — Chapter 08, Deploying to Test and Production

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `deploy/` (`settings.template.json`, `Test-PnPreflight.ps1`, `Invoke-PnScheduledRun.ps1`, `New-PnAlertPolicy.ps1`, `Invoke-PnRollback.ps1`, `PnDeploy.psm1`) and the four entry scripts. Provider facts are the guide's, read on the provider's own documentation on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`); this chapter cites the same pages. New facts read on Microsoft Learn on November 9, 2026 with the Microsoft Learn MCP tools: `New-ScheduledTaskAction`, `New-ScheduledTaskTrigger -Weekly -DaysOfWeek -At` (example 4), `Register-ScheduledTask`, `Unregister-ScheduledTask -Confirm:$false` (example 2); app-only `Connect-MgGraph` with a client ID, tenant ID and certificate; `az policy remediation show`; `az monitor activity-log alert list`; Service Health alerts are activity log alerts.

**One kit change with this chapter.** `New-PnRollbackPlan`'s RB-01 now pipes `Get-ScheduledTask -TaskName ... -ErrorAction SilentlyContinue` into `Unregister-ScheduledTask`, so a stage whose schedule was never registered still reaches RB-02. Before, `Unregister-ScheduledTask` failed for a missing task and `Invoke-PnPlanSteps` stopped at the first error, leaving the policy assignment in place (found while writing Chapter 01's Lab 2 back-out and this runbook's rollback). Two tests added in `deploy/tests/Deploy.Tests.ps1`, one of them Windows-only because the ScheduledTasks module exists only there: 25 tests on Windows. This chapter is a runbook and has no Lab headings, so `kit_captures.py` doesn't capture it. Its "Dry run, November 9, 2026" outputs were printed by the kit's scripts on that date, on the kit's fixtures, in a scratch copy of the kit on Windows (the scheduled run's `Runs:` line prints Windows path separators there). Every live result is labeled **Expected** and has not been seen.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The alert policy's definition, scope, remediation and default resources | Steps 1.6, 2.3; Verified facts | carried (guide row 8) | `pn08-policy` |
| 2 | `az policy assignment create` flags; `az policy remediation create` and `show`; `az monitor activity-log alert list` | Steps 1.6, 1.9; Verified facts | carried (guide row 9) and verified November 9 | `pn08-cli` |
| 3 | App-only `Connect-MgGraph` with client ID, tenant ID and certificate thumbprint | Steps 1.1, 1.7 | verified November 9 | `pn08-app-only` |
| 4 | Scheduled task cmdlets | Steps 1.7, 1.9 | verified November 9 | `pn08-tasks` |
| 5 | Pre-flight checks PF-01 to PF-07 | Pre-flight checks | read in `Invoke-PnPreflight` | kit |
| 6 | Staged enable, the dry-run week, the smoke test (ST-01 to ST-04), the go/no-go criteria | Stage 1, Stage 2 | restated-as-design (labeled *design guidance*) | — |
| 7 | Dry-run outputs (14 and 23 pre-flight checks, the scheduled run, the stage check, the rollback plans, the alert plan's SHA-256, the smoke test on the test fixture) | Dry run; Steps 1.3, 1.5 | verified by running the commands as written, November 9, 2026 | local run |
| 8 | Notices routed during the dry-run week aren't sent again once sending is on | Step 2.5 | read in `Invoke-PnRouting` (the state keeps `taskKey`; only new or changed notices make payloads) | kit |
| 9 | The run-as account must hold every CLI's sign-in; unattended sign-in per provider | Step 1.7 | not yet specified in the kit | — |
| 10 | Live results of every step | Stage 1, Stage 2 | not run against a live tenant, account, tenancy or project | — |

## Not yet specified

The ServiceNow endpoint's shape (guide N11); the scheduler beyond Windows Task Scheduler (guide N12); unattended sign-in for the Azure CLI, OCI CLI, AWS CLI and Google Cloud CLI under the run-as account; and every item Chapters 01 to 05 list.

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json` (the guide's claims log, rows 33 to 38); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
