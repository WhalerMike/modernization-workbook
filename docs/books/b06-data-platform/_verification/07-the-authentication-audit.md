# Verification — Chapter 07, The Authentication Audit

Checked October 20, 2026. Sources: the existing page (former Book 03, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_03.md`, carried into the opening.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Windows Server 2019 and 2022 support the Connected Machine agent, and therefore Arc-based Entra authentication" | Scope of the enumeration | corrected | Learn, Connected Machine agent prerequisites (agent runs on WS 2012–2025; new agent versions for 2012/2012 R2 end Nov 2026); Learn, Prerequisites — SQL Server enabled by Azure Arc (WS 2016+); Learn, Entra authentication for SQL Server (SQL 2022+). The 2019 floor is now stated as program design, reasoned from WS 2016 end of support |
| 2 | Windows Server 2016 end of support January 12, 2027 | Scope of the enumeration | verified (new) | Learn, Ending Support in 2027 |
| 3 | SQL 2022 uses app registration; SQL 2025 uses managed identity | Scope of the enumeration | verified | Learn, Managed identity for SQL Server enabled by Azure Arc; Learn, Entra authentication for SQL Server |
| 4 | `AADLoginForWindows` needs Windows Server 2025 | Scope of the enumeration | corrected | Learn, Sign in to an Azure Arc-enabled server using Entra ID: WS 2025 **with Desktop Experience** (qualifier added; matches Book 05 Ch 09) |
| 5 | Domain-join status recorded; Arc non-domain-join requirement | Scope of the enumeration | restated-as-design | Program position (unchanged) |
| 6 | Two authentication modes; Windows mode rejects SQL logins | Authentication-mode configuration | verified | Learn, Change server authentication mode; Learn, Choose an authentication mode |
| 7 | Entra authentication works alongside either mode; neither mode turns Windows authentication off | Authentication-mode configuration | verified | Learn, Choose an authentication mode ("Windows Authentication is always available and can't be disabled"); Learn, Entra authentication for SQL Server (existing modes unchanged) |
| 8 | Registry path `...\Microsoft SQL Server\[InstanceName]\MSSQLServer\LoginMode` | Authentication-mode configuration | corrected | Key is `MSSQL<version>.<InstanceID>\MSSQLServer` (e.g. `MSSQL16.MSSQLSERVER`); path format per Learn, Enable Entra authentication without Azure Arc; values 1/2 per Learn, Change server authentication mode |
| 9 | `SERVERPROPERTY('IsIntegratedSecurityOnly')` returns 1 in Windows mode | Authentication-mode configuration | verified | Learn, Change server authentication mode / Choose an authentication mode (property behavior); Microsoft troubleshooting article showing the property |
| 10 | Registry and running config can disagree after reconfiguration without restart | Authentication-mode configuration | verified | Learn, Change server authentication mode (restart required) |
| 11 | SQL 2025: `SERVERPROPERTY('IsExternalAuthenticationOnly')` for Disable SQL Authentication | Authentication-mode configuration | verified (new) | Learn, Disable SQL authentication for SQL Server enabled by Azure Arc |
| 12 | Login types U, G, S, C, K; E and X for Entra | Login type classification | verified | Learn, sys.server_principals |
| 13 | Type-S logins invisible to the Azure identity plane | Login type classification | restated-as-design | Follows from S logins being validated in `master`; unchanged |
| 14 | Type-E logins created in Book 05 | Login type classification | corrected | Renumbered to Chapter 11; E and X both mentioned |
| 15 | `sa` enabled + non-rotated password = highest-priority finding | Login type classification | restated-as-design | Program position |
| 16 | Service account types (domain account, gMSA, virtual account) | Service-account identity | verified | Learn, Group Managed Service Accounts overview; Learn, Register an SPN (virtual accounts/MSAs) |
| 17 | "SPN misconfiguration is the primary cause of NTLM fallback"; "missing or incorrect SPN generates NTLM for every connection" | Service-account identity | corrected | Learn, Register an SPN, authentication-defaults table: missing/failed lookup → NTLM; SPN on the wrong account → authentication fails; local connections use NTLM even with a correct SPN. "Primary cause" ranking unverifiable, removed |
| 18 | `sys.dm_exec_connections.auth_scheme` shows KERBEROS/NTLM | Service-account identity | verified (new) | Learn, Register an SPN |
| 19 | Category 1 definition | Arc-eligibility output | edited / verified | Learn, SQL Server enabled by Azure Arc overview; "Entra authentication configured" added because the extension leaves it off by default |
| 20 | Category 2: "Windows Server 2019 or later … SQL Server 2022" | Arc-eligibility output | restated-as-design | Program floor (see #1); SQL 2022 "or later" |
| 21 | Category 3: pre-2022 can't accept `FROM EXTERNAL PROVIDER` | Arc-eligibility output | verified | Learn, Entra authentication for SQL Server (SQL 2022 and later) |
| 22 | Failover cluster instances not supported for Entra authentication | Arc-eligibility output | verified (new in text; already in the figure) | Learn, Entra authentication for SQL Server |
| 23 | The program delivers Entra authentication through Arc; Microsoft also documents a non-Arc path | Arc-eligibility output | corrected | Learn, Enable Entra authentication for SQL Server on Windows without Azure Arc (source implied Arc was the only way); detail in Chapter 09 |
| 24 | 2027-04-01 NTLM deadline | Arc-eligibility output | restated-as-design | Program backstop, not a Microsoft deadline; consistent with Chapter 02 |
| 25 | Drift example "linked server that uses NTLM passthrough" | Compliance-monitoring sink | corrected | Reworded to "relies on Windows passthrough rather than an Entra credential"; Learn, Linked server with Entra authentication (password, access token, managed identity on 2025) |
| 26 | Audit runs continuously; per-instance record; drift = violation | Compliance-monitoring sink | restated-as-design | Program position |

All eleven original footnotes were re-opened (or re-found by search) on Oct 20, 2026 and reformatted to the workbook style; none was broken.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Chapter: front matter | Front matter | edited: title `Chapter 07 — The Authentication Audit`, `doc-type: workbook-chapter`, description added, `lifecycle_review: 2027-04-01` |
| Chapter: H1, thesis, In this chapter | Same | edited: H1 renumbered; thesis reworded to carry Book_03's "no migration survives contact" line |
| Chapter: opening paragraph (retain/consolidation target scope) | Opening | kept; "Book 02" → Chapter 06 |
| Chapter: Scope of the Enumeration | Scope of the enumeration | edited (claims 1–5) |
| Chapter: Authentication Mode Configuration | Authentication-mode configuration | edited (claims 6–11) |
| Chapter: Login Type Classification (+ figure) | Login type classification | edited; figure kept |
| Chapter: Service Account Identity and SPN Registration | Service-account identity and SPN registration | edited (claim 17) |
| Chapter: The Arc-Eligibility Output (+ figure) | The Arc-eligibility output | edited; FCI and non-Arc note added; figure kept |
| Chapter: The Compliance-Monitoring Telemetry Sink | Same | edited (claim 25) |
| Chapter: "What Book 03 establishes" callout | "What this chapter establishes" | edited |
| Book_03 front page: callout (audit measures authentication posture; record not spreadsheet) | Opening paragraph | kept |
| Book_03: figure `book-03-audit-inputs-and-record.svg` | Opening | kept |
| Book_03: "Download this book" callout | — | removed: bundle downloads not used in Books 02–05 |
| Book_03: Chapters listing | — | removed: replaced by the book index and Continue callout |
| Book_03: dependency-chain step 3 | Opening paragraph | kept |
| Book_03: Authoritative references (5 links) | Footnotes | edited: server_principals, auth mode and SPN pages are footnoted; `sys.dm_exec_connections` is covered through the SPN page; the NTLM auditing support article is not cited by any claim here (it belongs to Chapters 14–15) and was dropped |
| Book_03: Continue the series | Continue the book | edited to the new reading order |

Diagram sources edited (labels only): `book-03-audit-inputs-and-record` (SPN wording, claim 17); `book-03-ch01-arc-eligibility-classification`, `book-03-ch01-login-types` (book references renumbered).
