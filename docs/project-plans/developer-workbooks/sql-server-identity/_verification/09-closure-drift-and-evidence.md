# Verification — Chapter 09, Closure, Drift and Evidence

New material, written November 24, 2026. Code: `examples/sql-server-identity` (new in this change). Every Microsoft fact was read on Microsoft Learn on November 24, 2026 with WebFetch; the Book 06 citations it reuses (Chapter 20 `c20-principals`, `c20-disable-sql-auth`, `c20-auth-mode`, `c20-local-ntlm`, `c20-mi-2025`) were re-read that day rather than carried.

Lab 1 was first run by hand on November 24, 2026; superseded by the re-run below. Lab 2's run script was changed (optional `-ArcSnapshot`) and parsed again with the PowerShell parser (no errors); it wasn't run.

## Claims log

| # | Claim (short) | Where | Source URL | Read | Result |
|---|---|---|---|---|---|
| 1 | Login types S, U, G, E, X, C, K, R | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> | Nov 24, 2026 | verified |
| 2 | `IsIntegratedSecurityOnly` 1 = Windows authentication; `IsExternalAuthenticationOnly` 1 = SQL authentication disabled (SQL Server 2025) | Start with; Verified facts | <https://learn.microsoft.com/sql/t-sql/functions/serverproperty-transact-sql> | Nov 24, 2026 | verified |
| 3 | Disable SQL Authentication: SQL Server 2025 on Windows, Arc; extension 1.1.3394.392+; primary managed identity; Entra and Windows only; logins and sessions kept; reversed in the portal | Start with; Verified facts | <https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication> | Nov 24, 2026 | verified |
| 4 | Authentication mode change needs a restart | Start with; Verified facts | <https://learn.microsoft.com/sql/database-engine/configure-windows/change-server-authentication-mode> | Nov 24, 2026 | verified |
| 5 | Local connections report NTLM (per-service SID hardening) | Start with; Verified facts | <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> | Nov 24, 2026 | verified |
| 6 | No Entra authentication on failover cluster instances; Azure public cloud needed | Start with; Verified facts | <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> | Nov 24, 2026 | verified |
| 7 | gMSA task principal `-UserId <domain>\<gmsa>$ -LogonType Password` | Lab 2 step 3 | <https://learn.microsoft.com/services-hub/microsoft-engage-center/health/modify-and-remove-assessment-tasks> | Nov 24, 2026 | verified (Microsoft's example) |
| 8 | `-LogonType` values | Lab 2 step 3 | <https://learn.microsoft.com/powershell/module/scheduledtasks/new-scheduledtaskprincipal> | Nov 24, 2026 | verified; the page doesn't say which value a gMSA needs (see research gaps) |
| 9 | Closure fields, exception handling, drift rules | The code | `Get-SqlClosureRecord`, `Compare-SqlAuditRun` | Nov 24, 2026 | verified against the code and the `Chapter 09` tests (8 passed) |
| 10 | Ticket-to-Machine routes drift as a typed task | The code; Lab 2 | `docs/project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md` (repository) | Nov 24, 2026 | verified in the repository |
| 11 | Lab 1 outputs | Lab 1 | local run | Nov 24, 2026 | verified by running |
| 12 | Lab 2 | Lab 2 | — | — | not run (no test instance) |

## Book 06 against the kit

- **SQL Server 2025 with `IsExternalAuthenticationOnly` unreported (resolved).** `Get-SqlClosureRecord` now needs `isExternalAuthenticationOnly -eq 1` on 2025, so null is `NOT MET`. The chapter says so and no longer lists it as a field to read by hand.
- **Condition 3, reconciliation.** Chapter 20 asks that every E or X login map to a known Entra principal; the kit checks the type only.
- **Condition 3, validation period.** Chapter 20 asks for no remote NTLM or Kerberos "over the validation period"; the kit reads one snapshot.
- **Drift: Arc agent offline (resolved).** `Compare-SqlAuditRun` takes optional `-BeforeArc`/`-AfterArc`, and `Compare-SqlAuditRun.ps1` exposes them as `-BeforeArcPath`/`-AfterArcPath` (both needed); an instance that falls out of Category 1 is `Arc regressed`. Run in a scratch copy with the Arc fixture before and a copy with `sqlprd01` `Disconnected` after: one row, "SQLPRD01 Arc regressed Category 1 to 2: Deploy Arc (Runbook R04): agent Disconnected", beside the `jdoe` row. Lab 1's command is unchanged (one Arc fixture); the code section and Lab 2's run script document the parameters.
- **Drift: configured `LoginMode` not yet live.** R09's added registry check isn't possible from a live snapshot (`registryLoginMode` is null; README known limit).
- **The reader's own login (resolved in the kit).** `Export-SqlAuditSnapshot.ps1` takes an optional `-AccessToken` (string or `SecureString`), so a scheduled reader on a closed instance can be an Entra workload identity. The chapter's Lab 2 keeps the gMSA with a dated exception and explains the token path; the authors haven't run it.
- The day-30 fixture's `exceptions.json` carries `asOf` 2026-11-20, the day-1 date; harmless, because the code compares `expires` with the audit's `asOf`.

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- Lab 2's prerequisites now list the exporter's full rights (`VIEW SERVER SECURITY STATE`, `CONNECT ANY DATABASE`), and two Dangers rows were added (a skipped database; Arc going offline between runs).

## Federal requirements and evidence

Controls and KSIs are the `CLOSURE` step's (CA-7, CM-6, AC-2; KSI-MLA-EVC, KSI-SVC-ACM) and the `DRIFT` step's (CA-7, CM-6; KSI-MLA-EVC, KSI-SVC-ACM) in `config/requirements.json`; no new pair. Claim language: "supports" and "provides evidence for", never "satisfies".

## Review gate

`review-status: pending`. Not approved here.
