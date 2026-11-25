# Verification — Chapter 04, Entra Logins and the Parallel Run

New material, written November 24, 2026. Code: `examples/sql-server-identity` (new in this change; not modified by this chapter). Every Microsoft Learn page below was opened and read on November 24, 2026 (HTML fetched from learn.microsoft.com and read as text). Book 06's citations for the same facts (Chapter 11, Chapter 12, Runbook R05, read October 20 to November 11, 2026) were re-read against the current pages; none had changed in a way that affects this chapter, and one fact was added that Book 06 doesn't carry (claim 6).

Lab 1 was run by hand on Windows 11 with PowerShell 7 and Pester 5 on November 24, 2026, from a copy of `examples/sql-server-identity`; superseded by the re-run below.

## Claims log

| # | Claim (short) | Where | Source | Read | Result |
|---|---|---|---|---|---|
| 1 | `FROM EXTERNAL PROVIDER` on Arc-enabled SQL Server 2022 and later; name matches an Entra principal's display name in the instance's tenant; users, groups and applications | Start with; Verified facts | CREATE LOGIN (Transact-SQL), <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> | Nov 24, 2026 | Verified |
| 2 | `WITH OBJECT_ID` applies to SQL Server 2025 and later | Verified facts | Same page, argument `WITH OBJECT_ID` | Nov 24, 2026 | Verified |
| 3 | A user's login name is the UPN; groups and applications use the object's name; `CREATE USER … FROM LOGIN`; `ALTER ANY LOGIN` or `sysadmin` creates Entra logins; Entra connections always encrypted | Start with; Verified facts | Set up Microsoft Entra authentication with app registration - SQL Server enabled by Azure Arc, <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> | Nov 24, 2026 | Verified |
| 4 | Type `E` `EXTERNAL_LOGIN`, type `X` `EXTERNAL_GROUP` | Start with; Verified facts | sys.server_principals (Transact-SQL), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql>; also CREATE LOGIN remarks | Nov 24, 2026 | Verified |
| 5 | Failover cluster instances don't support Entra authentication; token audience `https://database.windows.net/` | Start with; Lab 2; Verified facts | Microsoft Entra authentication for SQL Server, <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> | Nov 24, 2026 | Verified |
| 6 | `DISABLE` doesn't affect connected logins; `ALTER LOGIN … DISABLE` can't deny access to a Windows group (error 15151, by design); `CONTROL SERVER` needed to disable a `sysadmin` member | Start with; Lab 1 step 2; Dangers | ALTER LOGIN (Transact-SQL), Arguments, Remarks, Permissions, <https://learn.microsoft.com/sql/t-sql/statements/alter-login-transact-sql> | Nov 24, 2026 | Verified. The kit now writes `DENY CONNECT SQL` for a group and `GRANT CONNECT SQL` to roll back (claims 19 to 21); R05 Step 4's `ALTER LOGIN [CONTOSO\jdoe] DISABLE` is a user and stays right |
| 7 | Adding to a fixed server role needs membership of that role or `sysadmin` | Verified facts | ALTER SERVER ROLE (Transact-SQL), Permissions, <https://learn.microsoft.com/sql/t-sql/statements/alter-server-role-transact-sql> | Nov 24, 2026 | Verified |
| 8 | A login can't be dropped while logged in; dropping one with mapped users orphans them | Start with; Lab 2 step 8 | DROP LOGIN (Transact-SQL), Remarks, <https://learn.microsoft.com/sql/t-sql/statements/drop-login-transact-sql> | Nov 24, 2026 | Verified |
| 9 | `DROP USER IF EXISTS` | Lab 2 step 8; Verified facts | DROP USER (Transact-SQL), <https://learn.microsoft.com/sql/t-sql/statements/drop-user-transact-sql> | Nov 24, 2026 | Verified |
| 10 | `auth_scheme` described only as the SQL Server or Windows scheme; `VIEW SERVER PERFORMANCE STATE` on 2022 and later | Start with; Lab 2 step 6 | sys.dm_exec_connections (Transact-SQL), <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql> | Nov 24, 2026 | Verified; the Entra value is still undocumented (research gaps) |
| 11 | Local connections always report NTLM | Start with | How to determine if the authentication type is Kerberos, <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> | Nov 24, 2026 | Verified |
| 12 | `SUCCESSFUL_LOGIN_GROUP` and `FAILED_LOGIN_GROUP`, pooled connections included | Start with; Verified facts | SQL Server Audit action groups and actions, <https://learn.microsoft.com/sql/relational-databases/security/auditing/sql-server-audit-action-groups-and-actions> | Nov 24, 2026 | Verified |
| 13 | `Get-AzAccessToken -ResourceUrl … -AsSecureString`; default output is now `SecureString` | Lab 2 | Get-AzAccessToken, <https://learn.microsoft.com/powershell/module/az.accounts/get-azaccesstoken> | Nov 24, 2026 | Verified |
| 14 | `Invoke-Sqlcmd -AccessToken` takes a string or `SecureString`; `-Encrypt` defaults to `Mandatory`, new in version 22; `-InputFile` | Lab 2 | Invoke-Sqlcmd, <https://learn.microsoft.com/powershell/module/sqlserver/invoke-sqlcmd> | Nov 24, 2026 | Verified |
| 15 | `Connect-AzAccount -Environment AzureCloud -Tenant` | Lab 2 | Connect-AzAccount, <https://learn.microsoft.com/powershell/module/az.accounts/connect-azaccount> | Nov 24, 2026 | Verified (`-Environment` parameter) |
| 16 | Create, validate, disable, observe 30 days, drop; exit criteria; explicit permissions read by R05 Step 2 | The code; Dangers | Book 06, Chapter 11 and Runbook R05 (workbook pages) | Nov 24, 2026 | Carried from Book 06 |
| 17 | Lab 1 outputs, including 11 passing tests in the `Chapter 04` block | Lab 1 | `scripts/kit_captures.py sql` | Nov 24, 2026 | Verified by running |
| 18 | Lab 2 behavior | Lab 2 | — | — | Not run |
| 19 | `DENY` server permission: grantee may be `SQL_Server_login_mapped_to_Windows_group`; `CONNECT SQL` is a server permission; server scope only when the current database is `master`; needs `CONTROL SERVER` or ownership | Start with; Lab 1 step 2; Verified facts | DENY Server Permissions (Transact-SQL), <https://learn.microsoft.com/sql/t-sql/statements/deny-server-permissions-transact-sql> | Nov 24, 2026 | Verified (syntax, Remarks, Permissions; Example A denies `CONNECT SQL` to a login) |
| 20 | `GRANT` server permission: same grantees; grantor holds the permission `WITH GRANT OPTION` or a higher one; `sysadmin` can grant any | Start with; Verified facts | GRANT Server Permissions (Transact-SQL), <https://learn.microsoft.com/sql/t-sql/statements/grant-server-permissions-transact-sql> | Nov 24, 2026 | Verified |
| 21 | `DENY` prevents inheriting the permission through group or role memberships, and doesn't apply to object owners or `sysadmin` members | Start with; Dangers; Verified facts | DENY (Transact-SQL), <https://learn.microsoft.com/sql/t-sql/statements/deny-transact-sql> | Nov 24, 2026 | Verified (quoted summary: "DENY does not apply to object owners or members of the sysadmin fixed server role"). Raises an open question for `CONTOSO\SQL-Admins`, a group in `sysadmin` (research gaps, G-04-4) |
| 22 | One group, one role, on one database, in one environment | The code; Lab 1 step 1 | Book 06, Chapter 16, "One group, one role" (workbook page) | Nov 24, 2026 | Carried from Book 06; the kit's `Warnings` apply it |

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- **Cutover.** A type `G` login's cutover line is `DENY CONNECT SQL TO [group];` (comment `-- group: superseded by …`) and its rollback `GRANT CONNECT SQL TO [group];`; users and SQL logins are still disabled and enabled; nothing is dropped. The cutover and rollback hashes changed (`a23dd5d07e5c…`, `ff1500696e1e…`); the create hash didn't (`deed30db5ccc…`). The "don't run the group lines" warning and the checklist item that depended on it are gone; a Dangers row for a group in `sysadmin` and one for members reached by another path replace them.
- **Warnings.** `New-SqlLoginPlan` returns `Warnings`, and `New-SqlLoginPlan.ps1` prints each as `Warning: …`: three on the fixture (two principals with three roles, one with `sysadmin`). Verified against the code.
- **Judge.** A legacy login already disabled or denied is reported "already cut over (disabled or denied): observe 30 days, then drop". The day-30 fixture now has the two groups with `hasConnectSql` false and `payroll_report` disabled (no longer missing), so the old G-04-3 question (fixture order against R05) is answered.

## Federal requirements and evidence

Controls and KSIs are only those `config/requirements.json` lists for LOGINS (AC-2, IA-2, CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-RVP) and PARALLEL (AC-2, CA-7; KSI-MLA-EVC). IA-2 is listed with "—" because the file pairs it with no KSI. Claim language: "supports" and "provides evidence for"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
