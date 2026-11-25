# Verification — Chapter 07, The Application Chain

New material, written November 24, 2026. Code: `examples/sql-server-identity` (new in this change). Every Microsoft fact was read on Microsoft Learn on November 24, 2026 with WebFetch; the Book 06 citations it reuses (Chapter 19 `c19-sqlclient`, `c19-odbc`, `c19-arc-mi`, `c19-tutorial`; Runbook R08 `r08-auth-scheme`) were re-read that day rather than carried.

Lab 1 was run by hand on November 24, 2026 on Windows 11, PowerShell 7 with Pester 5, from `examples/sql-server-identity`; the `text` blocks are that run's output (trailing spaces trimmed), and `out/` was deleted afterwards. `scripts/kit_captures.py sql` makes the published captures.

## Claims log

| # | Claim (short) | Where | Source URL | Read | Result |
|---|---|---|---|---|---|
| 1 | SqlClient: Service Principal 2.0, Managed Identity 2.1, Default 3.0; Password deprecated | Start with; Verified facts | <https://learn.microsoft.com/sql/connect/ado-net/sql/azure-active-directory-authentication> | Nov 24, 2026 | verified (mode table) |
| 2 | "Obtaining a token doesn't grant database permissions" | Start with; Verified facts | same as 1 | Nov 24, 2026 | verified (quoted) |
| 3 | Prefer a specific mode in production over Default; the identity can change with host configuration | Start with; Dangers | same as 1 | Nov 24, 2026 | verified |
| 4 | ODBC `ActiveDirectoryMsi` from 17.3.1.1, `ActiveDirectoryServicePrincipal` 17.7+, `ActiveDirectoryPassword` deprecated | Start with; Verified facts | <https://learn.microsoft.com/sql/connect/odbc/using-azure-active-directory> | Nov 24, 2026 | verified |
| 5 | Arc token needs local Administrators or Hybrid Agent Extension Applications on Windows; `http://localhost:40342` | Start with; Lab 2 step 4; Verified facts | <https://learn.microsoft.com/azure/azure-arc/servers/managed-identity-authentication> | Nov 24, 2026 | verified (Prerequisites; Security overview) |
| 6 | Entra connections always encrypted; `CREATE LOGIN … FROM EXTERNAL PROVIDER` | Start with; Verified facts | <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> | Nov 24, 2026 | verified |
| 7 | `auth_scheme` described only as the SQL Server/Windows scheme | Lab 2 step 7; Verified facts | <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-exec-connections-transact-sql> | Nov 24, 2026 | verified |
| 8 | Token audience `https://database.windows.net/` for `Invoke-Sqlcmd -AccessToken` | Lab 2 step 3 | <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> | Nov 24, 2026 | verified |
| 9 | Scan rules, masking, column logic, target text | The code | `powershell/SqlIdentity/SqlIdentity.psm1` (`ConvertFrom-SqlConnectionString`, `Find-SqlConnectionString`), `config/drivers.json` | Nov 24, 2026 | verified against the code and the `Chapter 07` tests (7 passed) |
| 10 | Lab 1 outputs | Lab 1 | local run | Nov 24, 2026 | verified by running |
| 11 | Lab 2 | Lab 2 | — | — | not run (no test application) |

## Book 06 against the kit

- **`Active Directory Default` as a target (resolved).** Off Arc or Azure the kit now gives the family's `servicePrincipalKeyword` from `config/drivers.json`, for `Microsoft.Data.SqlClient` "Authentication=Active Directory Service Principal (no managed identity off Arc; certificate preferred, Book 06 Ch 19)", and never Default; ODBC, OLE DB and JDBC get their own service-principal keywords. Book 06, Chapter 19 names `Active Directory Service Principal` for SqlClient. The fixtures still don't exercise this branch (the only column-A string is on an Arc host); verified against the code and `config/drivers.json`.
- **Column C target text.** A vendor-owned application still gets "Move to Microsoft.Data.SqlClient…" in `Target`; the chapter says the vendor's release decides.
- **`Server` column.** `tcp:` and the port are kept (`tcp:sqlprd01.contoso.example,1433`), so the same server can appear under two spellings.
- **`System.Data.SqlClient` and ODBC 13.** `config/drivers.json` lists them under `noEntraPath`. Learn shows ODBC 13.1 supports some Entra modes (password, integrated, token on Windows), none of them a managed identity or a service principal; the kit's reading is "no target mode", which the chapter keeps.
- `mssql-jdbc` `servicePrincipal: 12.2` in `config/drivers.json`; Book 06 Chapter 19 gives no version for `ActiveDirectoryServicePrincipal` and 12.4 for its certificate variant. Not used in the fixtures.

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- Lab 1's output didn't change apart from the test count and the wrapping of `Format-List` values (the capture's console is wider). The chapter's column table, a new paragraph on the off-Arc target, and the `Active Directory Default` danger now say the kit never suggests Default.

## Federal requirements and evidence

Controls and KSIs are the `CONN` step's in `config/requirements.json` (IA-5, CM-6; KSI-IAM-SNU, KSI-SVC-ACM); no new pair. Claim language: "supports" and "provides evidence for", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
