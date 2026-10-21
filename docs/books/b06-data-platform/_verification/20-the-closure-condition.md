# Verification — Chapter 20, The Closure Condition

Sources: the existing page `20-the-closure-condition.md` (former narrative Book 09, Chapter 1) and the archived front page `docs/case-studies/sql-server-narrative/Book_09.md`. All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | An administrator can switch an instance to Mixed Mode | Intro | verified; added that the change takes effect at restart | Learn, Change server authentication mode |
| 2 | SQL Server has no setting that turns Windows authentication off; Disable SQL Authentication leaves "Microsoft Entra authentication and Windows authentication" | Five conditions | verified (quote exact) | Learn, Disable SQL authentication (Arc) |
| 3 | Disable SQL Authentication: SQL Server 2025 on Windows; `IsExternalAuthenticationOnly = 1` | Condition 2 | verified | same |
| 4 | Disabling SQL auth keeps logins/permissions, doesn't end existing sessions, blocks `sa` | Condition 2 | verified (new detail) | same |
| 5 | `IsIntegratedSecurityOnly = 1` means Windows Authentication mode | Condition 2 | verified | SERVERPROPERTY via Disable SQL auth / auth mode pages |
| 6 | Principal types U, G, S, E, X | Conditions 1–3 | verified; type meanings added | Learn, sys.server_principals |
| 7 | `auth_scheme` shows `NTLM` / `KERBEROS` per connection | Condition 3 | verified | Learn, sys.dm_exec_connections; Register an SPN |
| 8 | "Entra sign-in logs show connections to the instance" | Condition 3 | corrected: sign-in logs show token issuance; the token audience `https://database.windows.net/` is shared by every SQL resource, so per-instance proof is the instance's SQL Server Audit | Learn, Microsoft Entra authentication for SQL Server (audience) |
| 9 | Local connections on the host always report NTLM | Condition 3 | added (new, verified); audit must separate local from remote | Learn troubleshoot, Determine if the authentication type is Kerberos |
| 10 | Condition 4: Arc agent + extension + Entra auth; managed identity on 2025, app registration on 2022 | Condition 4 | verified; "and a Key Vault certificate" added for 2022 | Learn, Arc servers overview; Arc SQL overview; Managed identity; Entra auth tutorial |
| 11 | Entra auth only on SQL Server 2022+; not supported on failover cluster instances | Condition 4 | added (new, verified); FCIs need re-architecture or exception | Learn, Arc SQL overview (version table); Managed identity Limitations; Entra auth for SQL Server overview |
| 12 | MFA enforced by Conditional Access verified in sign-in logs and CA reports | Condition 5 | verified | Learn, What is Conditional Access? |
| 13 | CA applies to users, not service principals/managed identities | Condition 5 | added (verified for Azure SQL; same token audience) | Learn, Conditional access (Azure SQL) |
| 14 | FIDO2 not currently supported for Entra auth to SQL Server on Arc | Condition 5 | added (verified) | Learn, Managed identity Limitations |
| 15 | Per-instance record satisfying "all five" conditions | Continuous audit | edited: structural record satisfies the structural conditions; condition 5 is joined from sign-in/CA reports (matches Runbook R09's "external join" design) | R09 (program) |
| 16 | `LoginMode` 1 → 2 drift; compare configured vs running value | Drift | verified; configured-vs-running nuance added from restart requirement | Learn, Change server authentication mode |
| 17 | "certificate renewal on SQL Server 2022 ... depends on the agent" | Drift | corrected: on 2022 the Arc agent downloads the Entra certificate from Key Vault to the host; on 2025 the managed identity is the Arc server's | Learn, Entra auth tutorial (2022); Managed identity |
| 18 | 2027-04-01 is the "NTLM elimination backstop" | Drift | restated-as-design: the program's own Phase C date, not a Microsoft or federal deadline (see Ch21 log) | Microsoft NTLM roadmap blog (no date); M-22-09 (FY2024) |
| 19 | Defender for SQL servers on machines: alerting + vulnerability assessment, on Arc-onboarded hosts | Telemetry | verified | Learn, Defender for SQL servers on machines overview |
| 20 | Defender alerts: unusual location, unfamiliar principal, brute force, SQL injection | Telemetry | verified (alert names: GeoAnomaly, PrincipalAnomaly 60 days, SuspiciousIp, BruteForce, PotentialSqlInjection) | Learn, Alerts for SQL Database and Azure Synapse Analytics |
| 21 | Event 4624/4625 name the authentication package / NTLM version | Telemetry | verified (4624 records NTLM version) | Learn troubleshoot, Audit use of NTLMv1 |
| 22 | NTLM operational log records NTLM use | Telemetry | verified (audit and block events) | Learn, Policy CSP LocalPoliciesSecurityOptions |
| 23 | SQL Server Audit records successful and failed logins | Telemetry | verified | Learn, SQL Server Audit |
| 24 | Azure Monitor agent forwards Windows logs to Log Analytics | Telemetry | verified (DCR Windows Event Logs source, XPath, Security log) | Learn, Collect Windows events with Azure Monitor |
| 25 | Each Entra token issuance recorded in sign-in logs; anomalies via Entra ID Protection | Telemetry | verified | Learn, Sign-in logs; ID Protection overview |
| 26 | Broken orphan footnote line (": Microsoft Learn, Manage emergency access admin accounts") | Footnotes | removed (no key; the break-glass in condition 1 is a Windows group, not an Entra emergency account) | — |
| 27 | Five conditions as the transformation inventory's closure definition; exception registry; engine-authentication decision field set | Throughout | restated-as-design (program canon; no footnote) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Ch20 front matter / H1 "Chapter 1 — The Closure Condition for the SQL Server Authentication Transformation" | Retitled "Chapter 20 — The Closure Condition"; description added; `doc-type: workbook-chapter`; `lifecycle_review: 2027-04-01` | edited |
| Ch20 thesis line | Kept verbatim | kept |
| Ch20 "In this chapter" callout | Kept; footnote keys renamed | kept |
| Ch20 opening paragraph | Kept; restart detail added | edited |
| Ch20 § The Five Closure Conditions (+ diagram) | Kept; heading sentence-cased; conditions 3–5 extended with the corrections in rows 8–14 | edited |
| Ch20 § The Continuous Audit as the Verification Instrument | Kept; links to Chapters 07, 12 and Runbook R09; structural vs joined condition clarified | edited |
| Ch20 § Drift Detection (+ diagram) | Kept; configured-vs-running check; agent role corrected; 2027-04-01 restated as program date | edited |
| Ch20 § Behavioral Telemetry (three sources) | Kept; sources turned into a parallel list; alert examples sourced | edited |
| Ch20 "What Book 09 establishes — Chapter 1" callout | "What this chapter establishes" section (house style of Books 02–05), item 4 added | edited |
| Book_09.md front-page callout (posture is a loop, regression is a violation) | New "The transformed posture, Chapters 20–21" callout at the top | kept (moved) |
| Book_09.md diagram `book-09-continuous-compliance-loop.svg` | Placed after the opening callouts | kept (moved) |
| Book_09.md title/subtitle/description (closure conditions, drift, 2027 milestone) | Substance in the part callout and Ch21 | kept (merged) |
| Book_09.md Download bundle callout | Not carried; per-book bundles are linked from the book index | removed |
| Book_09.md chapter listing, dependency-chain line ("Step 9 — Demonstrate sustained posture") | Listing replaced by Continue-the-book navigation; dependency-chain page is being archived | removed |
| Book_09.md Authoritative references list (6 links) | Each source now footnoted where used (Disable SQL auth, dm_exec_connections, sign-in logs, Defender for SQL, SQL Audit); CISA ZTMM moved to Appendix A | kept (as footnotes) |
| Book_09.md Continue-the-series links | Replaced with Chapter 19 / index / Chapter 21 | edited |

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | New section "The closure record's field set": the single canonical table of closure fields (11 fields under the five conditions), adopted by Chapter 12 and projected by Runbook R09. Folds in R09's Entra-reconciliation field and Chapter 12's `IsExternalAuthenticationOnly` and extension-deployed fields | lines 50-66 | design-consistency | — |
| CR2-2 | Paragraph listing the record's contents replaced by a reference to the table; the field set is defined here, not in Chapter 12 | lines 70-72 | design-consistency | — |
| CR2-3 | Condition 1 names the break-glass group and its design (a Windows group holding `sysadmin`, empty by default; Appendix B) | line 40 | design-consistency | — |
| CR2-4 | Condition 2: `sa` "disabled" changed to "disabled and renamed" | line 42 | design-consistency | — |
| CR2-5 | Condition 3: usable logins outside the exception registry are type E or X **and map to a known Entra principal** (Chapter 17) | line 44 | design-consistency | — |
| CR2-6 | "What this chapter establishes" item 1 names the field set | line 100 | design-consistency | — |
