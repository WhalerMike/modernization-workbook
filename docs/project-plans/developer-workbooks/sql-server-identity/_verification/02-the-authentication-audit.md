# Verification — Chapter 02, The Authentication Audit

New material, written November 24, 2026. Code: `examples/sql-server-identity` (new in this change). Every Microsoft fact was read on Microsoft Learn on November 24, 2026 with WebFetch; the Book 06 citations it reuses (Chapter 07 `c07-principals`, `c07-auth-mode`, `c07-entra-sql`; Runbook R03 `r03-server-principals`) were re-read that day rather than carried.

Lab 1 was run by hand on November 24, 2026 on Windows 11, PowerShell 7 with Pester 5, from `examples/sql-server-identity`; the `text` blocks are that run's output, and `out/` was deleted afterwards. `scripts/kit_captures.py sql` makes the published captures.

## Claims log

| # | Claim (short) | Where | Source URL | Read | Result |
|---|---|---|---|---|---|
| 1 | `sys.server_principals` types `S`, `U`, `G`, `C`, `K`, `E`, `X` (and `R`) and their meanings | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> | Nov 24, 2026 | verified |
| 2 | Other logins visible only with `ALTER ANY LOGIN` or a permission on the login | Start with; Verified facts | same as 1 | Nov 24, 2026 | verified |
| 3 | `VIEW ANY DEFINITION` (server) implies `VIEW DEFINITION` on a login | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/security/permissions-database-engine> | Nov 24, 2026 | verified (permissions table, row LOGIN / VIEW DEFINITION) |
| 4 | `IsIntegratedSecurityOnly` 1 = Windows Authentication, 0 = both; `IsClustered` 1 = failover cluster | Start with; Verified facts | <https://learn.microsoft.com/sql/t-sql/functions/serverproperty-transact-sql> | Nov 24, 2026 | verified |
| 5 | `IsExternalAuthenticationOnly` on SQL Server 2025: 1 = SQL authentication disabled | Start with; Verified facts | same as 4 | Nov 24, 2026 | verified |
| 6 | `LoginMode` 1 Windows only, 2 mixed; restart required; `sa` stays disabled when mode changes to mixed; `sa` "often targeted" | Start with; What it leaves; Verified facts | <https://learn.microsoft.com/sql/database-engine/configure-windows/change-server-authentication-mode> | Nov 24, 2026 | verified (the page shows `LoginMode` through `xp_instance_regwrite`; Book 06, Chapter 07 gives the full key path from the non-Arc tutorial) |
| 7 | `sys.dm_server_services.service_account`; `VIEW SERVER STATE` (2019 and earlier), `VIEW SERVER SECURITY STATE` (2022 and later) | Start with; Lab 2; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-server-services-transact-sql> | Nov 24, 2026 | verified |
| 8 | `sys.dm_exec_connections.auth_scheme`; `VIEW SERVER STATE`, `VIEW SERVER PERFORMANCE STATE` on 2022 and later | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql> | Nov 24, 2026 | verified |
| 9 | Failover cluster instances don't support Entra authentication | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> | Nov 24, 2026 | verified |
| 10 | `CONNECT ANY DATABASE` connects to every current and future database and grants nothing beyond connect | Lab 2; Verified facts | <https://learn.microsoft.com/sql/t-sql/statements/grant-server-permissions-transact-sql> | Nov 24, 2026 | verified (Remarks); Runbook R02's rights table grants it the same way |
| 11 | Building Non-Person Identity hands SQL Server accounts to the Data Platform project (NPI-INV-07); the method is the service account guide | The code | `docs/project-plans/developer-workbooks/non-person-identity/01-…md`; `docs/books/guides/service-account-migration.md`; `_BRIEF.md` (repository) | Nov 24, 2026 | verified in the repository; the kit's finding text now says the Data Platform project converts it, so the kit, the brief and NPI agree |
| 12 | The census and finding rules | The code | `powershell/SqlIdentity/SqlIdentity.psm1` | Nov 24, 2026 | verified against the code and the `Chapter 02` tests (6 passed) |
| 13 | Lab 1 outputs | Lab 1 | local run | Nov 24, 2026 | verified by running |
| 14 | Lab 2 | Lab 2 | — | — | not run (no test instance) |

## Book 06 against the kit

- Book 06, Chapter 07 ranks "an enabled `sa` account with a non-rotated password" highest. The kit ranks any enabled `sa` highest: it doesn't read password age. Stricter, not contradictory.
- No other disagreement found between Chapters 07 and 08, R03 and the kit.

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- **Service account text.** The finding now reads "… is a user account with a password: the Data Platform project converts it (service account guide)", and a built-in account (`NT AUTHORITY\…`, `LocalSystem`) gets its own finding ("move the engine to a virtual account or gMSA (Book 06, Chapter 07)"). The chapter's "The service account goes to another plan" no longer calls the owner an open question. Verified against `Get-SqlAuthFinding`.
- **Day-30 census.** SQLPRD01's `Disabled` count is now 3 (`sa`, `CONTOSO\svc-payroll`, `payroll_report`): the two superseded groups are denied `CONNECT SQL` in the fixture (`hasConnectSql` false), so they leave the usable count without being disabled. The step 5 text says so.
- **Exporter.** `Export-SqlAuditSnapshot.ps1`'s help now names `VIEW SERVER SECURITY STATE` (2022 and later) and `CONNECT ANY DATABASE`, skips a database it can't read with a `Skipped database …` warning, keeps `SERVERPROPERTY('ServerName')` whole (`HOST\INSTANCE`) and takes an optional `-AccessToken` (string or `SecureString`). Lab 2's prerequisites, step 2's note, the Dangers and the Checklist follow it. Verified against the script; the script parses (PowerShell parser, no errors). Not run against an instance.

## Federal requirements and evidence

Controls and KSIs are only the `AUDIT` step's in `config/requirements.json` (AC-2, IA-5, CM-6; KSI-PIY-GIV, KSI-IAM-SNU, KSI-SVC-ACM); no new pair. Claim language: "supports" and "provides evidence for", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
