# Verification — Chapter 06, NTLM and the SPNs

New material, written November 24, 2026. Code: `examples/sql-server-identity` (not modified by this chapter). Every Microsoft Learn page below was opened and read on November 24, 2026. Book 06's citations for the same facts (Chapters 14 and 15 and Runbook R06, read October 20 to November 11, 2026) were re-read against the current pages.

Lab 1 was run by hand on Windows 11 with PowerShell 7 and Pester 5 on November 24, 2026, from a copy of `examples/sql-server-identity`; superseded by the re-run below.

## Claims log

| # | Claim (short) | Where | Source | Read | Result |
|---|---|---|---|---|---|
| 1 | Kerberos tried first; no ticket for the SPN means NTLM | Start with | Register a Service Principal Name for Kerberos connections, <https://learn.microsoft.com/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections> | Nov 24, 2026 | Verified |
| 2 | SPN formats: TCP `MSSQLSvc/<FQDN>:<port>`; `MSSQLSvc/<FQDN>` (default) or `:<instancename>` (named) for other protocols | Start with; Verified facts | Same page, "SPN formats" | Nov 24, 2026 | Verified |
| 3 | Authentication-defaults table: correct account (local NTLM, remote Kerberos); incorrect account (fails); lookup fails (NTLM) | Start with; Verified facts | Same page, "Authentication defaults" | Nov 24, 2026 | Verified |
| 4 | Automatic registration at startup only with permission; virtual accounts and MSAs can register | Verified facts | Same page, "Permissions" | Nov 24, 2026 | Verified |
| 5 | Local connections always report NTLM | Start with; Lab 2 prerequisites | How to determine if the authentication type is Kerberos, <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> | Nov 24, 2026 | Verified |
| 6 | Misplaced SPN moved with `setspn -D` | Start with | Explicit misplaced SPN problem in SQL Server, <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/explicit-spn-is-misplaced> | Nov 24, 2026 | Verified |
| 7 | `setspn -S` checks duplicates; `-D`, `-L`, `-Q`, `-X`, `-F`; SPNs not case sensitive on Windows | Start with; Lab 2; Verified facts | setspn, <https://learn.microsoft.com/windows-server/administration/windows-commands/setspn> | Nov 24, 2026 | Verified |
| 8 | `sys.linked_logins.uses_self_credential` | Start with; Lab 2 step 4 | sys.linked_logins (Transact-SQL), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-linked-logins-transact-sql> | Nov 24, 2026 | Verified |
| 9 | `klist purge`, `get`, `tickets` | Start with; Lab 2 step 6 | klist, <https://learn.microsoft.com/windows-server/administration/windows-commands/klist> | Nov 24, 2026 | Verified |
| 10 | `Get-ADObject -LDAPFilter -Properties`; `Get-ADDomain` returns `NetBIOSName` | Lab 2 step 4 | Get-ADObject, <https://learn.microsoft.com/powershell/module/activedirectory/get-adobject>; Get-ADDomain, <https://learn.microsoft.com/powershell/module/activedirectory/get-addomain> | Nov 24, 2026 | Verified (parameters and sample output); the `servicePrincipalName=MSSQLSvc/*` substring filter is standard LDAP and not shown on the page |
| 11 | Cross-site NTLM, linked-server options, unconstrained delegation danger, the four patterns | The code; Dangers | Book 06, Chapter 14 and Runbook R06 (workbook pages) | Nov 24, 2026 | Carried from Book 06 |
| 12 | No cloud availability applies to SPNs and the Restrict NTLM policies | Verified facts | Runbook R06, control-states section (workbook page) | Nov 24, 2026 | Carried from Book 06 |
| 13 | Lab 1 outputs, including 7 passing tests in the `Chapter 06` block | Lab 1 | `scripts/kit_captures.py sql` | Nov 24, 2026 | Verified by running |
| 14 | Lab 2 behavior | Lab 2 | — | — | Not run |

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- **Virtual and built-in accounts.** `Get-SqlNtlmFinding` now expects the SPN on the computer account (`DOMAIN\HOST$`) when the service runs as `NT SERVICE\…` or `NT AUTHORITY\…`, using the estate's `netbiosDomain` (fixture: `CONTOSO`). Lab 2, step 4 now writes `netbiosDomain` into its estate file, and step 5's note no longer calls the finding a false "wrong account". Verified against the code.
- **Empty SPN list.** `-Spns` accepts an empty collection; the chapter says every instance is then reported as missing its SPN.
- **Remote NTLM fix text.** Now "Find each client (the clients rows, or sys.dm_exec_connections client_net_address); local sessions are excluded"; the code table follows it.

## Federal requirements and evidence

Controls and KSIs are only those `config/requirements.json` lists for NTLM (IA-2, CM-6; KSI-SVC-ACM). IA-2 is listed with "—" because the file pairs it with no KSI. Claim language: "supports" and "provides evidence for"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
