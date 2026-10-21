# Verification — Runbook R09, Continuous Monitoring & the CCM-BIR Closure Record

File: `docs/books/b06-data-platform/r09-continuous-monitoring-and-closure.md`
Source: the same file (former Implementation Companion Book 09)
Verified: 2026-10-20

Microsoft claims were checked on Microsoft Learn on 2026-10-20. Script and function claims were checked against the program's `tools/discovery/Spec3-D1.8-Get-SQLServerAuthAudit.ps1` and `FMPSqlServerMigration.psm1` (published under the `FMP` prefix). Kept consistent with Chapter 20 (closure conditions, behavioral telemetry).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Any sufficiently privileged admin can switch an instance to Mixed Mode | Closure is a posture | verified | Change server authentication mode |
| 2 | D1.8 deep form `-QueryInstances`, `-TestConnectivity`, `-TargetServers` | Step 1 | verified | program source |
| 3 | JSON signals `AuthenticationMode`, `SQLLogins`, `WindowsLogins`, `OrphanedLogins`, `EntraIDReady` | Step 1 | verified; added that `AuthenticationMode` comes from `SERVERPROPERTY('IsIntegratedSecurityOnly')` (running mode) | program source |
| 4 | `*_logins.csv` columns "`sa` flag", "`Disabled`" | Step 1; table | corrected to `IsSA`, `IsDisabled` (with `PasswordLastSet`) | program source (same as R03 claim 10) |
| 5 | `LoginMode = 1` as a closure field | Step 2 table | verified and qualified: proves SQL logins refused, not that Windows logins are gone; Windows Authentication can't be disabled (consistent with Chapter 20) | Choose an authentication mode; Change server authentication mode |
| 6 | Zero type-S outside exception registry; zero type-U/G | Step 2 table | verified (principal types) | sys.server_principals |
| 7 | (added) Type-E/X reconciliation row | Step 2 table | restated-as-design (Chapter 17) | — |
| 8 | `sa` disabled and renamed | Step 2 table | verified (`ALTER LOGIN sa DISABLE`); renaming is program design | Change server authentication mode |
| 9 | Arc agent "enrolled and healthy" via `azcmagent show` | Step 2 table | verified (Agent Status) | azcmagent show |
| 10 | "Azure extension for SQL Server deployed, Managed Identity active" | Step 2 table | corrected: Entra authentication configured — primary managed identity on SQL Server 2025 on Windows, app registration on SQL Server 2022 (consistent with Chapter 20) | Managed identity for SQL Server enabled by Azure Arc |
| 11 | (added) `IsExternalAuthenticationOnly` and Disable SQL Authentication (2025) | Step 2 | verified | Disable SQL authentication for SQL Server enabled by Azure Arc |
| 12 | `New-FMPClosureRecord` verdicts `closed`/`closed_excepted`/`open`, `failing_fields`, MFA `external` | Step 2 | verified | program source |
| 13 | Drift `LoginMode` 1→2 detected by the diff | Step 3 | qualified: mode change takes effect at restart and D1.8 reads the running mode, so a registry-only change is invisible until restart; registry check suggested | Change server authentication mode; program source |
| 14 | `Compare-FMPClosureRun` events and `compliance_violation` | Step 3 | verified | program source |
| 15 | "Any NTLM or Kerberos event in Defender for SQL telemetry should be zero" | Step 4 | corrected: Defender for SQL servers on machines raises threat alerts and runs vulnerability assessment; it doesn't log each authentication's protocol. Protocol evidence comes from `auth_scheme`, host logon events, NTLM Operational log and SQL Server Audit (consistent with Chapter 20) | Defender for SQL servers on machines overview; sys.dm_exec_connections; SQL Server Audit |
| 16 | "Every connection produces an Entra sign-in event" | Step 4 | corrected: sign-in logs record token issuance (four log types); cached tokens span connections | What are Microsoft Entra sign-in logs? |
| 17 | Six artifact sets; set 2 "zero failed token requests attributable to NTLM/Kerberos fallback"; set 3 "Defender zero NTLM events" | Six evidence sets | corrected (restated sets 2 and 3 to evidence the services actually record); sets 1, 4, 5, 6 kept | Sign-in logs; Defender overview |
| 18 | 2027-04-01 is the network NTLM block date; consequence not completion | Reading 2027-04-01 | restated-as-design (program date); verified no Microsoft deadline on that date (NTLM deprecated, still working) | Deprecated features for Windows client |
| 19 | (added) External 2027 dates: SQL Server 2017 end of support Oct 12, 2027; SQL 2016 ESU Year 1 ends Jul 13, 2027; SQL 2014 ESU Year 3 ends Jul 12, 2027 | Reading 2027-04-01 | verified | Ending Support in 2027; SQL Server ESU FAQ |
| 20 | Long tail carries CBA as interim posture | Reading 2027-04-01 | restated-as-design and defined as in Chapter 22 (user smart-card sign-in to AD; SQL connection via Windows auth/Kerberos) | — |
| 21 | Canon references (§5, Phase C, Transformation #7), narrative Book 02/03/04/05/06/07/09/10 | throughout | edited: program closure specification; Runbooks R02–R07, R10; Chapters 20–22 | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title `Runbook R09 — …`; `doc-type`, `status: draft`, `lifecycle_review: 2027-04-01`; `subtitle`, `canon-source` removed; one-sentence description |
| docx H1 block; Download callout (Book_09.docx) | removed | Word file not on the site |
| Companion note callout | edited | thesis, "In this runbook", "Pairs with" (Chapters 20–21) |
| Closure is a continuously-verified posture | edited | claim 1 |
| Step 1 | edited | claims 2–4; illustrative-code warning added before the first code block |
| Step 2 | edited | table gains a "What it proves" column; claims 5–12 |
| Step 3 | edited | claims 13–14 |
| Step 4 — Defender for SQL | edited | heading "The behavioral layer"; claims 15–16 |
| The six live evidence artifact sets | edited | claim 17 |
| Reading the 2027-04-01 date correctly | edited | claims 18–20 |
| Safety | edited | book references → runbooks |
| Closing italic footer | removed | duplicated the body; paths and canon residue |
| — | added | "Continue the book" callout (R08 ← → R10); footnotes `[^r09-*]` (13) |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | Security log lands in `Event` via a DCR, or in `SecurityEvent` via the Sentinel *Windows Security Events via AMA* connector; XPath form `LogName!XPathQuery` | Step 4, "Illustrative workspace queries" (from line 107) | verified | <https://learn.microsoft.com/azure/azure-monitor/vm/data-collection-windows-events> |
| RF-2 | NTLM Operational channel name `Microsoft-Windows-NTLM/Operational` | same | verified | <https://support.microsoft.com/en-us/servicing/os/windows/2025/07/overview-of-ntlm-auditing-enhancements-in-windows-11-version-24h2-and-windows-server-2025> |
| RF-3 | Event 8004 collected on domain controllers, carries the server accessed | same | verified | <https://learn.microsoft.com/defender-for-identity/deploy/configure-windows-event-collection> |
| RF-4 | `SecurityEvent` columns `EventID`, `LogonType`, `AuthenticationPackageName`, `Account`, `IpAddress`, `WorkstationName`, `Computer` | KQL query 1 | verified | <https://learn.microsoft.com/azure/azure-monitor/reference/tables/securityevent> |
| RF-5 | 4624 logon type 3 = Network; authentication package `NTLM` for NTLM-family authentication | KQL query 1 | verified | <https://learn.microsoft.com/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624> |
| RF-6 | `Event` columns `EventLog`, `EventID`, `Computer`, `EventData`, `RenderedDescription` | KQL query 2 | verified | <https://learn.microsoft.com/azure/azure-monitor/reference/tables/event> |
| RF-7 | Four sign-in log types export to `SigninLogs`, `AADNonInteractiveUserSignInLogs`, `AADServicePrincipalSignInLogs`, `AADManagedIdentitySignInLogs`; all carry `ResourceDisplayName`, `ResultType` (string), `ConditionalAccessStatus`; `ResultType` 0 = success | KQL query 3 | verified (column names and types checked on each table page) | <https://learn.microsoft.com/entra/identity/monitoring-health/concept-diagnostic-settings-logs-options>; <https://learn.microsoft.com/azure/azure-monitor/reference/tables/signinlogs>; the three AAD* table pages |
| RF-8 | Conditional Access for Azure SQL targets the *Azure SQL Database* first-party application | KQL query 3 | verified; the resource name an Arc-enabled SQL Server sign-in records wasn't found documented, so the text tells the reader to confirm `ResourceDisplayName` and `ResourceIdentity` on the pilot | <https://learn.microsoft.com/azure/azure-sql/database/conditional-access-configure> |
| RF-9 | The three KQL blocks carry their own callout-warning (illustrative); none was run against a workspace | same | restated-as-design (illustrative) | — |

Not used: the `LmPackageName` and `PackageName` columns of `SecurityEvent` (the table reference doesn't say which one carries the NTLM version), so the queries don't filter on NTLM version.
