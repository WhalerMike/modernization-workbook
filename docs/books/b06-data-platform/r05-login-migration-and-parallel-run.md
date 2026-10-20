---
title: "Runbook R05 — Login Migration & Parallel-Run Validation"
description: "A review-required runbook for migrating SQL Server authentication to Microsoft Entra ID: take the login inventory from Runbook R03, codify the Windows-to-Entra mapping from the program's identity reconciliation, generate idempotent CREATE LOGIN ... FROM EXTERNAL PROVIDER statements as a dry-run script, create Entra database users beside the Windows ones, run a 30-day parallel-run observation window, then cut over and keep an instant rollback. The program's mapping, script-generation and parallel-run functions execute nothing; the steps stay review-required because the T-SQL they produce changes production logins."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 105
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R05 — Login Migration & Parallel-Run Validation

*Add the Entra login beside the Windows one, watch both for thirty days, and disable rather than drop.*

::: {.callout-note}
## In this runbook
Generating the Entra logins from the audit (dry run first), creating Entra database users beside the existing Windows users, the 30-day parallel-run window and its exit criteria, cutover by disabling the superseded Windows logins, the rollback that disabling makes instant, and remediating an enabled `sa` account. Every step that runs T-SQL against an instance is review-required.
:::

**Pairs with:** [Chapter 11 — Three Principal Types: User, Group, Service Principal](11-three-principal-types.md) and [Chapter 12 — What the Engine-Authentication Decision Settles](12-the-engine-authentication-decision.md). Those chapters explain why the migration is a parallel run rather than a big-bang cutover, under the program's consolidation-gated, parallel-run decision; this runbook is the T-SQL and the validation that make it safe.

::: {.callout-important}
## Automation status and production safety
The login-mapping and script-generation steps are in the program's `FMPSqlServerMigration` module (`tools/powershell/FMPSqlServerMigration/` in the program's repository), and they're deliberately **non-executing**. `New-FMPEntraLoginMapping` derives the mapping and `New-FMPEntraLoginScript` writes a reviewable `.sql` file; neither opens a SQL connection. Because the generated T-SQL runs `CREATE LOGIN` and related statements against production instances, every step stays **review-required**: generate the statements in a dry run, review them, execute them in a change window, and **never disable or drop a Windows login until its Entra replacement is validated in parallel**, which `Test-FMPLoginParallelRun` evaluates against the program's exit criteria.
:::

## Preconditions

Don't start until, per the earlier runbooks:

1. The instance runs **SQL Server 2022 or later**, is **Arc-connected** with the Azure extension for SQL Server, has a validated managed-identity token, and has **Entra authentication configured with an Entra admin set** ([Runbook R04](r04-arc-deployment-and-managed-identity.md)).
2. The estate has been **consolidated**: you're migrating only instances that survive ([Chapter 06](06-retain-consolidate-retire.md); [Runbook R02](r02-estate-discovery-and-consolidation-gate.md)).
3. You have the [Runbook R03](r03-the-authentication-audit.md) `…_logins.csv` for the instance: the `WINDOWS_LOGIN` and `WINDOWS_GROUP` rows you must reproduce as Entra logins, plus the orphaned logins and the `sa` state to remediate.
4. Clients trust the instance's TLS certificate. Connections authenticated by Entra ID are always encrypted, and an untrusted certificate fails the login with a certificate-chain error.[^r05-sql-entra-tutorial]

## Step 1 — Generate the login statements (dry run first)

Map each Windows login, or preferably the Entra **group** that should replace a set of them, to an external-provider login. Group-based logins are the target, because they remove per-user churn. Run the statements in `master`; any Entra account with `ALTER ANY LOGIN` can create Entra logins, otherwise a `sysadmin` must.[^r05-sql-entra-tutorial] For a user the name is the user principal name; for a group or an application it's the name of the Entra object.[^r05-sql-entra-tutorial]

::: {.callout-warning}
## Illustrative, not tested against your estate
The T-SQL and PowerShell in this runbook are illustrative. They haven't been tested against a production SQL Server estate or tenant. Review the generated scripts line by line, run them first on a pilot instance, and execute in production only in an approved change window.
:::

```sql
USE master;

-- Per group (preferred): one Entra group login replaces many individual logins.
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'sql-app-readers')
    CREATE LOGIN [sql-app-readers] FROM EXTERNAL PROVIDER;

-- Per user (only where a group isn't appropriate).
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'jdoe@contoso.com')
    CREATE LOGIN [jdoe@contoso.com] FROM EXTERNAL PROVIDER;

-- Entra logins appear in sys.server_principals with type E (user or application) or X (group).
SELECT name, type, type_desc FROM sys.server_principals WHERE type IN ('E', 'X');
```

Generate these idempotently from the audit output and a reviewed mapping, rather than by hand:

```powershell
# Dry run: emit reviewable T-SQL. Writes a .sql file; executes nothing.
# login-mapping.csv columns: WindowsLogin, EntraPrincipal
#   (the UPN for a user, the Entra display name for a group or application).
$map = @{}
Import-Csv .\output\login-mapping.csv | ForEach-Object { $map[$_.WindowsLogin] = $_.EntraPrincipal }

$rows = Import-Csv .\output\FMP_Spec3_D1.8_SQLServerAuthAudit_<domain>_<timestamp>_logins.csv |
    Where-Object { $_.LoginType -in 'WINDOWS_LOGIN', 'WINDOWS_GROUP' -and
                   $_.IsDisabled -eq 'False' -and
                   $_.LoginName -notmatch '^(NT SERVICE|NT AUTHORITY|BUILTIN)\\' }

$unresolved = $rows | Where-Object { -not $map.ContainsKey($_.LoginName) }
$principals = $rows | Where-Object { $map.ContainsKey($_.LoginName) } |
    ForEach-Object { $map[$_.LoginName] } | Sort-Object -Unique

& {
    'USE master;'
    'GO'
    foreach ($u in $unresolved) { "-- UNRESOLVED: $($u.LoginName) (map it, or record why it isn't migrated)" }
    foreach ($name in $principals) {
        $literal    = $name.Replace("'", "''")   # inside N'...'
        $identifier = $name.Replace(']', ']]')   # inside [...]
        "IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$literal')"
        "    CREATE LOGIN [$identifier] FROM EXTERNAL PROVIDER;"
        'GO'
    }
} | Set-Content .\output\create-entra-logins.sql
```

The filter keeps enabled Windows users and groups and leaves out the built-in service and system principals, which aren't migration targets. Several Windows logins usually map to one Entra group, so the script emits each Entra principal once.

**Program automation.** The Windows-login-to-Entra-principal mapping (the `EntraPrincipal` column) is the one piece of real judgment here. `New-FMPEntraLoginMapping` codifies it from the program's identity reconciliation (the `IdentityReconciliation` envelope from `FMPIdentityAssessment`) rather than from a hand-built spreadsheet. It joins the R03 login audit to the reconciliation, maps only cleanly **matched** principals automatically, prefers a supplied Entra **group** map, and flags every unresolved login for review instead of silently dropping it. `New-FMPEntraLoginScript` then turns that mapping into the idempotent `CREATE LOGIN ... FROM EXTERNAL PROVIDER` file shown above: dry run only, no SQL connection, with unresolved entries written as commented-out to-do lines.

## Step 2 — Create the Entra database users beside the Windows users

A server login grants nothing inside a database until a database user maps to it. Create an Entra user for each new login, in each database it needs, and give it the same role memberships and permissions the Windows user or group has. Leave the Windows user in place: both paths must work during the parallel run.

Don't try to convert the existing Windows user with `ALTER USER ... WITH LOGIN`. On SQL Server that clause remaps SQL and Windows users only, and it can't change the type of a user; the exception that turns a Windows user into a Microsoft Entra user applies only to Azure SQL Managed Instance.[^r05-alter-user] Even where a remap is possible, it would cut the Windows path over in one step and remove the parallel run.

```sql
USE [AppDb];

-- 1. Create the Entra user beside the existing Windows user or group.
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'sql-app-readers')
    CREATE USER [sql-app-readers] FROM LOGIN [sql-app-readers];

-- 2. Read what the Windows principal has: role memberships...
SELECT r.name AS role_name
FROM   sys.database_role_members AS rm
JOIN   sys.database_principals AS r ON r.principal_id = rm.role_principal_id
JOIN   sys.database_principals AS m ON m.principal_id = rm.member_principal_id
WHERE  m.name = N'CONTOSO\AppReaders';

-- ...and explicit permissions.
SELECT class_desc, permission_name, state_desc,
       CASE WHEN class = 1 THEN OBJECT_NAME(major_id) END AS object_name
FROM   sys.database_permissions
WHERE  grantee_principal_id = DATABASE_PRINCIPAL_ID(N'CONTOSO\AppReaders');

-- 3. Mirror them on the Entra user (one statement per role or permission found).
ALTER ROLE [db_datareader] ADD MEMBER [sql-app-readers];
```

`CREATE USER [name] FROM LOGIN [name]` is the documented form for an Entra user mapped to an Entra login on SQL Server.[^r05-sql-entra-tutorial] Mirror default schemas and object ownership as well where the Windows principal holds them, and generate the mirroring statements per database in the same dry-run file as Step 1, so the review covers both.

## Step 3 — The parallel run

**Keep the Windows logins enabled** alongside the new Entra logins. Both work; nothing is removed. This is the parallel-run window the program's decision requires, and it's what makes the cutover reversible.

Observe which authentication scheme connections actually use, over a **30-day** window. Querying these views needs `VIEW SERVER STATE`, or `VIEW SERVER PERFORMANCE STATE` on SQL Server 2022 and later.[^r05-dm-exec-connections]

```sql
-- Live: how are sessions authenticating right now?
SELECT  s.original_login_name,
        c.auth_scheme,
        c.client_net_address,
        COUNT(*) AS sessions
FROM    sys.dm_exec_connections AS c
JOIN    sys.dm_exec_sessions    AS s ON s.session_id = c.session_id
GROUP BY s.original_login_name, c.auth_scheme, c.client_net_address
ORDER BY sessions DESC;
```

Read the `auth_scheme` column with two cautions. Connections made on the server itself always report `NTLM`, even when Kerberos is configured correctly, so judge Kerberos and NTLM only on connections from other hosts.[^r05-auth-scheme] And Microsoft documents the column only as the SQL Server or Windows authentication scheme of the connection,[^r05-dm-exec-connections] without listing the value an Entra-authenticated connection reports. Confirm on the pilot instance what your Entra test connections show before you encode it in the exit criteria.

A point-in-time query misses connections that come and go between samples. Capture successful logins for the whole window with SQL Server Audit, so you have a durable 30-day record. The `SUCCESSFUL_LOGIN_GROUP` action group records every successful login, including connections reused from a pool.[^r05-audit-groups]

```sql
USE master;

CREATE SERVER AUDIT [FMP_LoginParallelRun]
    TO FILE (FILEPATH = N'D:\SQLAudit\', MAXSIZE = 256 MB, MAX_ROLLOVER_FILES = 200);

CREATE SERVER AUDIT SPECIFICATION [FMP_LoginParallelRun_Spec]
    FOR SERVER AUDIT [FMP_LoginParallelRun]
    ADD (SUCCESSFUL_LOGIN_GROUP)
    WITH (STATE = ON);

ALTER SERVER AUDIT [FMP_LoginParallelRun] WITH (STATE = ON);
```

Size the file target for the instance's login rate (pooled logins are recorded too), restrict access to the audit folder, and read the files with `sys.fn_get_audit_file`.[^r05-create-audit] The exit criteria for the window:

- Every application and job that connected through a Windows login now also appears connecting through its Entra login.
- **No** `NTLM` rows remain for the instance from remote clients (cross-check [Runbook R06](r06-ntlm-detection-and-remediation.md)).
- No connection is *still* arriving only on the legacy Windows login.

**Program automation.** `Test-FMPLoginParallelRun` evaluates a captured set of these observations (columns `login_name`, `auth_scheme`, `sessions`) against the exit criteria and returns a sealed `cutover_ready` verdict, with each login's observed schemes and whether it still arrives only on `NTLM` or `KERBEROS`. It's read-only: it reports readiness and never disables or drops a login. As reviewed for this edition, it counts a login as Entra-authenticated only when `auth_scheme` reads `AAD`, which Microsoft doesn't document, and it counts every `NTLM` row, including local connections. Check both against the pilot before you rely on its verdict, and pre-filter local connections out of the observation file.

## Step 4 — Cutover

Only after the observation window's exit criteria are met:

```sql
-- Disable (don't drop) the superseded Windows login.
ALTER LOGIN [CONTOSO\jdoe] DISABLE;
```

Disable, observe for a further short tail, and only then consider dropping. Two things to check before you call a principal cut over. A principal often has more than one Windows path into the instance, such as an individual login and membership in one or more Windows **group** logins; cut over the group logins too, and confirm in the audit record that no Windows-authenticated logins remain for the principal. And disabling a login that is a `sysadmin` member also needs `CONTROL SERVER`.[^r05-alter-login] The narrative's rule, that the date is a backstop and the migration must already be complete, applies here: the program's 2027-04-01 NTLM backstop ([Runbook R06](r06-ntlm-detection-and-remediation.md)) is a program planning date, not a Microsoft deadline ([Chapter 02](02-why-the-inheritance-must-end.md)), and it assumes this cutover is finished well before it.

## Rollback

Because the Windows logins are **disabled, not dropped**, rollback is immediate:

```sql
ALTER LOGIN [CONTOSO\jdoe] ENABLE;
```

The Windows database users from Step 2 are still in place, so re-enabling the login restores the old path in full. That is why nothing is dropped during the migration: keeping a disabled login costs almost nothing against the value of an instant rollback path.

## The `sa` account

If the R03 audit flagged `sa` as enabled (`EntraIDBlockers`), remediate it here, independently of user migration. Confirm first that another `sysadmin` can sign in, such as the Entra admin set in [Runbook R04](r04-arc-deployment-and-managed-identity.md). Then disable `sa`, and rename it if your standard requires it. It's never a migration target; it's a finding to close.

```sql
ALTER LOGIN [sa] DISABLE;
-- Optional, if your standard requires it:
-- ALTER LOGIN [sa] WITH NAME = [<new name>];
```

Closing the enabled `sa` account is one step toward Windows-only, then Entra-only, authentication. For instances connected to Arc, Microsoft added a portal option to disable SQL authentication, generally available since April 2026; use it, after the SQL logins themselves are migrated, to close mixed mode.[^r05-arc-release-notes]

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R04 — Arc Deployment & the Managed Identity](r04-arc-deployment-and-managed-identity.md) · [Book index](index.md) · [Next: Runbook R06 — NTLM Detection & Remediation →](r06-ntlm-detection-and-remediation.md)
:::

[^r05-sql-entra-tutorial]: Microsoft Learn, "Tutorial: Set up Microsoft Entra authentication for SQL Server enabled by Azure Arc," create logins and users, <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial#create-logins-and-users> (accessed Oct 20, 2026).

[^r05-alter-user]: Microsoft Learn, "ALTER USER (Transact-SQL)," remarks for SQL Server and for Azure SQL Managed Instance, <https://learn.microsoft.com/sql/t-sql/statements/alter-user-transact-sql> (accessed Oct 20, 2026).

[^r05-dm-exec-connections]: Microsoft Learn, "sys.dm_exec_connections (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql> (accessed Oct 20, 2026).

[^r05-auth-scheme]: Microsoft Learn, "How to determine if the authentication type is Kerberos," <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> (accessed Oct 20, 2026).

[^r05-audit-groups]: Microsoft Learn, "SQL Server Audit action groups and actions," server-level audit action groups, <https://learn.microsoft.com/sql/relational-databases/security/auditing/sql-server-audit-action-groups-and-actions> (accessed Oct 20, 2026).

[^r05-create-audit]: Microsoft Learn, "CREATE SERVER AUDIT (Transact-SQL)," <https://learn.microsoft.com/sql/t-sql/statements/create-server-audit-transact-sql> (accessed Oct 20, 2026).

[^r05-alter-login]: Microsoft Learn, "ALTER LOGIN (Transact-SQL)," permissions, <https://learn.microsoft.com/sql/t-sql/statements/alter-login-transact-sql> (accessed Oct 20, 2026).

[^r05-arc-release-notes]: Microsoft Learn, "Release notes - SQL Server enabled by Azure Arc," general availability, <https://learn.microsoft.com/sql/sql-server/azure-arc/release-notes> (accessed Oct 20, 2026).
