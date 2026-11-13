# Verification — Runbook R05, Login Migration & Parallel-Run Validation

File: `docs/books/b06-data-platform/r05-login-migration-and-parallel-run.md`
Source: the same file (former Implementation Companion Book 05)
Verified: 2026-10-20

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Preconditions: SQL 2022+, Arc-enrolled, extension, validated MI token | Preconditions | verified; added "Entra authentication configured with an Entra admin set" (R04 Step 4) | entra-authentication-setup-tutorial |
| 2 | (added) Entra-authenticated connections always encrypted; untrusted cert fails the login | Preconditions | verified | entra-authentication-setup-tutorial |
| 3 | `CREATE LOGIN [name] FROM EXTERNAL PROVIDER` for groups and users | Step 1 | verified; added: run in `master`; `ALTER ANY LOGIN` or sysadmin; UPN for users, object name for groups/apps; types `E`/`X` | entra-authentication-setup-tutorial |
| 4 | Example UPN `jdoe@contoso.gov` | Step 1 | edited to `jdoe@contoso.com` (Microsoft's example domain; avoids implying a real .gov tenant) | — |
| 5 | Generator filters `$_.Type -eq 'WINDOWS_LOGIN' -and $_.Disabled -eq 'False'` and reads `$_.EntraPrincipal` from the logins CSV | Step 1 | **corrected**: the R03 CSV columns are `LoginType`/`IsDisabled` and it has no `EntraPrincipal` column; rewritten to join a reviewed mapping file, include `WINDOWS_GROUP`, exclude NT SERVICE/NT AUTHORITY/BUILTIN, deduplicate principals, escape `'` and `]`, list unresolved logins | program source (logins.csv export) |
| 6 | `New-FMPEntraLoginMapping` / `New-FMPEntraLoginScript` behavior (matched-only auto-mapping, group map preferred, unresolved flagged, dry-run, commented TODOs) | Step 1 | verified (program source); "FMP_181" restated as the program's identity reconciliation envelope | program source |
| 7 | `ALTER USER [jdoe] WITH LOGIN = [jdoe@contoso.gov]` re-links a Windows user to the Entra login | Step 2 | **corrected**: on SQL Server `WITH LOGIN` remaps SQL and Windows users only and can't change the user type; the Windows-to-Entra exception is Azure SQL Managed Instance only. Also contradicted the parallel run. Replaced with `CREATE USER … FROM LOGIN` beside the Windows user plus role/permission mirroring | alter-user-transact-sql (SQL Server and MI monikers); entra-authentication-setup-tutorial |
| 8 | Parallel-run window 30 days; keep Windows logins enabled | Step 3 | restated-as-design (program parallel-run decision) | — |
| 9 | DMV query; `auth_scheme` values `KERBEROS | NTLM | SQL | AAD` | Step 3 | partly unverifiable: Microsoft documents the column only as the SQL Server/Windows auth scheme and doesn't list an Entra value; `AAD` removed from the query comment, pilot confirmation required; permissions VIEW SERVER STATE / VIEW SERVER PERFORMANCE STATE (2022+) added | sys-dm-exec-connections-transact-sql |
| 10 | (added) Local connections always report NTLM | Step 3 | verified; query now includes `client_net_address` | determine-the-authentication-type |
| 11 | "Extended Events session (or SQL Audit) to capture login events" | Step 3 | kept, made concrete with a SQL Server Audit using `SUCCESSFUL_LOGIN_GROUP` (pooled logins included); syntax checked | sql-server-audit-action-groups-and-actions; create-server-audit-transact-sql |
| 12 | Exit criteria (Entra appearance, no NTLM, no legacy-only) | Step 3 | kept; "auth_scheme = AAD" removed; NTLM criterion limited to remote clients | determine-the-authentication-type |
| 13 | `Test-FMPLoginParallelRun` evaluates the criteria, read-only | Step 3 | verified (program source); **flagged**: treats `AAD` as the Entra value and counts all NTLM rows including local ones | program source |
| 14 | `ALTER LOGIN … DISABLE` / `ENABLE` for cutover and rollback | Steps 4, rollback | verified; added CONTROL SERVER needed to disable a sysadmin login; group-login paths must be cut over too (design) | alter-login-transact-sql |
| 15 | "the 2027-04-01 NTLM block (Book 06)" | Step 4 | restated-as-design: program backstop, not a Microsoft deadline (Chapter 02); Book 06 → R06 | — |
| 16 | `sa`: disable, rename if required; never a migration target | The `sa` account | verified syntax; added: confirm another sysadmin first (the R04 Entra admin) | alter-login-transact-sql |
| 17 | (added) Arc portal option to disable SQL authentication, GA April 2026 | The `sa` account | verified | sql/sql-server/azure-arc/release-notes |
| 18 | "the program decision §1", "FMP_181", "the directory modernization program §3.2" | throughout | removed/restated (residue) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title, `doc-type`, `status`, `lifecycle_review` 2027-04-01; `subtitle` folded into description; `canon-source` removed |
| docx H1 block; Download callout (Book_05.docx) | removed | Word file not on the site |
| Companion note callout | edited | thesis, "In this runbook", "Pairs with" (Chapters 11–12) |
| Automation status + production safety callout | edited | residue removed; "never drop" → "never disable or drop" until validated |
| Preconditions | edited | claims 1–2; Book 02/03/04 → Chapter 06, R02, R03, R04 |
| Step 1 — Generate the login statements | edited | claims 3–6; illustrative-code warning added before the first code block |
| Step 2 — Map database users to the new logins | edited | retitled "Create the Entra database users beside the Windows users"; claim 7 |
| Step 3 — Parallel-run | edited | claims 8–13 |
| Step 4 — Cutover | edited | claims 14–15 |
| Rollback | edited | notes that the Windows database users are still in place |
| The `sa` account | edited | claims 16–17 |
| Closing italic footer | removed | duplicated the body; canon residue |
| — | added | "Continue the book" callout (R04 ← → R06) |

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | `sa`: "rename it if your standard requires it" changed to disable and rename, the program's standard (Chapter 12); the rename statement in the code block is no longer commented out. New note `[^r05-alter-login-name]` | lines 200-205; note line 228 | design-consistency with factual support | <https://learn.microsoft.com/sql/t-sql/statements/alter-login-transact-sql> (argument `NAME`, example D) |

## Zero Trust closure update, November 11, 2026 (Phase 4 conventions)

Phase 4 of the Zero Trust closure update. Added a paragraph on Microsoft's sequence for the Disable SQL Authentication setting, with a check query, and "Control states, change safety and evidence" (`#b06-r05-control-states`).

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| 1 | Disable SQL Authentication: SQL Server 2025 on Windows, primary managed identity, extension 1.1.3394.392 or later; blocks new SQL logins including `sa`; no restart; reversible from the portal under Azure RBAC; `SERVERPROPERTY('IsExternalAuthenticationOnly')` returns 1 when disabled | The `sa` account; Control states | added (verified) | Learn, "Disable SQL authentication for SQL Server enabled by Azure Arc," https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication | Nov 11, 2026 |
| 2 | Microsoft's migration order: audit with SUCCESSFUL_LOGIN_GROUP, create Entra equivalents, move every connector, validate, then disable; keep a working Entra admin login | The `sa` account; Control states (Authority) | added (verified); matches the runbook's own order | same page | Nov 11, 2026 |
| 3 | Disable SQL authentication GA April 2026 | The `sa` account | verified, unchanged | Learn, "Release notes - SQL Server enabled by Azure Arc" | Nov 11, 2026 |
| 4 | Disable SQL Authentication not among the US Government Virginia features | Control states (Applies) | verified | Learn, "SQL Server enabled by Azure Arc in US Government" | Nov 11, 2026 |
| 5 | Parallel run, disable-then-drop, `sa` disable and rename | Control states (Authority) | restated-as-design (Chapter 12 decisions; risk-based recommended) | - | Nov 11, 2026 |
