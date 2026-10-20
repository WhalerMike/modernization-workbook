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
