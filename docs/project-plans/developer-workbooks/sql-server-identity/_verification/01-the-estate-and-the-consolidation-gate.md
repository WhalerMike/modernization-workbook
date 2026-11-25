# Verification — Chapter 01, The Estate and the Consolidation Gate

New material, written November 24, 2026. Code: `examples/sql-server-identity` (new in this change). Every Microsoft fact was read on Microsoft Learn on November 24, 2026 with WebFetch; the Book 06 citations it reuses (Chapter 05 `c05-entra-sql`, `c05-create-login`; Runbook R02 `r02-index-usage`, `r02-server-principals`) were re-read that day rather than carried.

Lab 1 was run by hand on November 24, 2026 on Windows 11, PowerShell 7 with Pester 5, from `examples/sql-server-identity`; the `text` blocks are that run's output, and `out/` was deleted afterwards. `scripts/kit_captures.py sql` makes the published captures.

## Claims log

| # | Claim (short) | Where | Source URL | Read | Result |
|---|---|---|---|---|---|
| 1 | Entra authentication for SQL Server starts with SQL Server 2022; standalone instances and availability groups; failover cluster instances not supported | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> | Nov 24, 2026 | verified ("SQL Server failover cluster instances do not currently support Microsoft Entra authentication") |
| 2 | `FROM EXTERNAL PROVIDER` "available for Arc-enabled SQL Server 2022 and later versions" | Start with; Verified facts | <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> | Nov 24, 2026 | verified (quoted) |
| 3 | `sys.dm_db_index_usage_stats` counters "initialized to empty whenever the database engine is started"; rows removed when a database is detached or shut down (`AUTO_CLOSE`) | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-db-index-usage-stats-transact-sql> | Nov 24, 2026 | verified (quoted) |
| 4 | That view needs `VIEW SERVER STATE`; `VIEW SERVER PERFORMANCE STATE` on SQL Server 2022 and later | Lab 2; Verified facts | same as 3 | Nov 24, 2026 | verified |
| 5 | Other logins visible only with `ALTER ANY LOGIN` or a permission on the login; metadata visibility limited to what the caller owns or was granted | Lab 2; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> | Nov 24, 2026 | verified |
| 6 | Start Kit signals, rights and first-pass gate | The code; Lab 2 | `examples/start-kit/README.md` and `powershell/FMPSqlEstate/FMPSqlEstate.psm1` (repository) | Nov 24, 2026 | verified against the code: `SqlEstate.csv` and `SqlDatabases.csv` columns used in Lab 2, step 3 |
| 7 | The classifier's rules and order | The code | `powershell/SqlIdentity/SqlIdentity.psm1`, `Get-SqlEstateClassification` | Nov 24, 2026 | verified against the code and the `Chapter 01` tests (8 passed) |
| 8 | Lab 1 outputs | Lab 1 | local run | Nov 24, 2026 | verified by running |
| 9 | Lab 2, step 3 conversion | Lab 2 | local run on hand-made `SqlEstate.csv` and `SqlDatabases.csv` in the Start Kit's column shape (scratch folder, deleted) | Nov 24, 2026 | ran: three instances converted and classified retain, retire (no recorded use, engine up 1,058 days) and review |
| 10 | Lab 2 as a whole | Lab 2 | — | — | not run (no test domain) |

## Book 06 against the kit

- Book 06, Chapter 05 defines a zombie database as one with no connections in 400 days, no restores consumed and a retired owning application. The kit, like Runbook R02's automated pass, retires an instance on idle days alone (rule 1) or on decommissioned applications alone (rule 2). Not a contradiction of R02; a narrower test than Chapter 05's definition. The chapter keeps R02's instruction that the architects confirm every row and that backup history and the portfolio back a retire.
- The Start Kit retires only when the engine has also been up for the threshold; the kit's classifier trusts `lastAccessDays`. Lab 2's conversion reproduces the Start Kit's rule by counting idle days from the engine start when nothing is recorded.
- The kit README's table names Book 06 Chapters 04 to 06 for this chapter; the brief names Chapters 03 to 06. The chapter links 04, 05 and 06 and R02.

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- No output changed: the estate classifier wasn't touched by the fixes. The `Chapter 01` tests still pass (8).
- Still open: the engine start time in the estate shape and a Start Kit converter (research gaps, Chapters 01 to 03, G-01-10 and G-01-11).

## Federal requirements and evidence

The control and KSI are the `ESTATE` step's in `config/requirements.json` (CM-8, KSI-PIY-GIV, a pair the file says it reuses from the Defender XDR and Global Secure Access kits); no new pair. Claim language: "supports" and "provides evidence for", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
