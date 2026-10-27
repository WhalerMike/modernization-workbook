# Verification — Chapter 14, NTLMv1, NTLMv2 and the Patterns That Generate NTLM

Checked October 20, 2026. Sources: the existing page (former Book 06, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_06.md`, carried into the opening callout and diagram. NTLM status kept consistent with Book 02 Chapter 03 and Book 05 Chapter 05.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | All NTLM versions (LANMAN, NTLMv1, NTLMv2) deprecated June 2024; replace with Negotiate | Where Microsoft stands | verified (new section) | Learn, Deprecated features for Windows client |
| 2 | NTLMv1 removed in Windows 11 24H2 and Windows Server 2025; NTLMv2 to be removed from Windows Server in a future release | Where Microsoft stands | verified | Same; Learn, Features removed or no longer developed in Windows Server |
| 3 | Source: "October 2026 Windows Update flips the `BlockNTLMv1SSO` default from Audit to Enforce on devices without an explicit policy"; program "slightly ahead of Microsoft" | NTLMv1 | corrected | KB5066470 and Windows message center (2026-10-14): from the October 13, 2026 updates, default changes to enforce when `BlockNtlmv1SSO` is absent, on Windows 11 24H2–26H2 and Windows Server 2025, only where Credential Guard is off, and only for NTLMv1-derived SSO credentials (MS-CHAPv2 Wi-Fi/VPN), not NTLMv1 network auth generally. "Ahead of Microsoft" framing replaced: the two are different controls |
| 4 | Microsoft plan: three phases, IAKerb/local KDC 2H 2026, network NTLM disabled by default in next major release, subject to change | Where Microsoft stands; NTLMv2 | verified (search-result summary of the post plus Message Center MC1227478 coverage, as in Book 02) | Windows IT Pro Blog, Jan 29, 2026 |
| 5 | Source footnote "Retiring NTLM: frequently asked questions" | NTLMv2 | corrected (replaced) | Page body couldn't be retrieved; replaced with the Jan 29, 2026 post that the Windows message center links |
| 6 | Source: NTLMv1 uses an MD4 hash; captured response attacked offline or replayed (pass-the-hash); no session signing | NTLMv1 | corrected | Restated to what Microsoft says: LM/NTLMv1 vulnerable to widely published password attacks; recommendation to enforce NTLMv2 (KB "How to enable NTLM 2 authentication"; Security Advisory 973811). MD4/"no signing" detail removed as unsourced (NTLMv1 does support session security per the KB) |
| 7 | Level 5 "Send NTLMv2 response only. Refuse LM & NTLM"; DCs still accept NTLMv2 | NTLMv1 | verified, clarified | Learn, How to enable NTLM 2 authentication; Policy CSP NetworkSecurity_LANManagerAuthenticationLevel |
| 8 | Source: "The Local Security Authority then negotiates only NTLMv2" | NTLMv1 | corrected | Clients send only NTLMv2; DCs refuse LM/NTLMv1; level 5 is not an NTLM block (same correction as Book 05 Ch05) |
| 9 | Source: "Windows Server 2016 and later with default settings generate no NTLMv1; it surfaces only with Windows 7-era clients or apps configured for LM/NTLM" | NTLMv1 | removed | Not verifiable as stated; replaced with the verified fact that NTLMv1 is removed from 24H2/WS2025 so the setting matters on older systems |
| 10 | Event 4624 records NTLM version; ignore NTLM V1 for anonymous logons | NTLMv1 | verified (new) | Learn, Audit use of NTLMv1 on a Windows Server-based DC |
| 11 | Phase B target 2026-Q3; 2027-04-01 backstop | NTLMv1, NTLMv2 | restated-as-design | Program dates; no external 2027 NTLM requirement found (consistent with Book 05: no FedRAMP NTLM deadline) |
| 12 | Cloud Kerberos trust: partial TGT from Entra exchanged with on-prem DC for full TGT used for SQL servers | NTLMv2; Pattern 2 | verified | Learn, Introduction to Microsoft Entra Kerberos (authentication flow); WHfB authentication how-it-works |
| 13 | SPN format `MSSQLSvc/FQDN:port` and `:instancename`; no ticket → NTLM; `setspn -S` | Pattern 1 | verified | Learn, Register a Service Principal Name for Kerberos connections |
| 14 | Source: "A service-account change without an SPN update leaves the SPN on the wrong account, with the same result [NTLM]" | Pattern 1 | corrected | Learn, Register an SPN (Authentication defaults: SPN mapped to incorrect account → authentication fails); SSPI-context article (valid SPN on wrong container → "Cannot generate SSPI context") |
| 15 | Duplicate SPN → KDC_ERR_PRINCIPAL_NOT_UNIQUE; SPNs unique in forest; `setspn -Q` / `-X` | Pattern 1 | verified (new) | Learn, Kerberos generates KDC_ERR_S_PRINCIPAL_UNKNOWN or KDC_ERR_PRINCIPAL_NOT_UNIQUE |
| 16 | Local connections use NTLM even with correct SPN | Pattern 1 | verified (new) | Learn, Register an SPN (Authentication defaults) |
| 17 | Legacy SQLOLEDB and legacy "SQL Server" ODBC driver support only NTLM over named pipes | Pattern 1 | verified (new) | Learn, Consistent authentication issues in SQL Server |
| 18 | Kerberos needs same or trusted domains; ticket from a DC of the service account's domain | Pattern 2 | verified (first half); second half restated from source as protocol behaviour | Learn, Register an SPN (conditions for Kerberos) |
| 19 | Cross-forest needs forest trust with name-suffix routing; without trust neither Kerberos nor NTLM works | Pattern 2 | kept (source statement, standard AD trust behaviour) | Not separately footnoted; consistent with Learn SSPI article "check communication between domains" |
| 20 | DNS is the key factor; aliases and HOSTS files cause unexpected SPN → NTLM | Pattern 2 | verified (new) | Learn, SSPI-context article; Consistent authentication issues |
| 21 | Port 88 UDP/TCP | Pattern 2 | kept | Standard Kerberos port; Entra Kerberos doc requires DC line of sight |
| 22 | NTLM can't make the second hop; ANONYMOUS LOGON symptom | Pattern 3 | verified | Learn, Consistent authentication issues ("double hop fails if NTLM credentials are used"); MSSQLSERVER_18456 |
| 23 | Passthrough needs Kerberos (constrained/RBCD) delegation | Pattern 3 | verified | Learn, Kerberos Constrained Delegation Overview; MSSQLSERVER_18456 |
| 24 | Credential Guard blocks unconstrained delegation | Pattern 3 | verified (new) | Learn, How Credential Guard works |
| 25 | Find via `sys.servers`, `sys.linked_logins` | Pattern 3 | kept (catalog views) | Program procedure |
| 26 | Entra linked servers from SQL 2022 (password, access token); managed identity SQL 2025 with MSOLEDBSQL `ActiveDirectoryMSI`; destination login named after source server | Pattern 3 | verified, expanded | Learn, Linked server with Entra authentication; Configure managed identity for linked servers |
| 27 | Entra password mode deprecated; incompatible with mandatory MFA | Pattern 3 | verified (new) | Learn, Entra authentication with Microsoft.Data.SqlClient |
| 28 | Source: "Arc non-domain-join requirement" | Pattern 4 | corrected | Restated as the program's target architecture, consistent with Book 05 Ch09 |
| 29 | Unjoined host with Integrated Security falls back to NTLM | Pattern 4 | kept (follows from Chapter 01 / SSPI behaviour); "or fails outright" added |  |
| 30 | Source "Book 01", "Book 05" references | Throughout | corrected | Renumbered to Chapter 01 and Chapters 11–12/19 |
| 31 | Unconstrained delegation on a SQL host or service account leaves a reusable ticket for every connecting user | Pattern 3 | verified (mechanism per c14-kcd; Book 02 Ch08 c08-sensitive) | c14-kcd |
| 32 | Start Kit summary lists SQL Server instances whose host or service account has unconstrained delegation | Pattern 3 | verified against examples/start-kit tests | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Ch1 front matter, H1 "Chapter 1 — …" | Front matter, H1 | edited: `doc-type`, `lifecycle_review`, description, title form |
| Ch1 thesis line | Thesis | kept (lightly edited) |
| Ch1 "In this chapter" | Same | edited (footnotes removed from callout, Microsoft context added) |
| Ch1 opening paragraph | Opening | kept; "Book 01" → Chapter 01 |
| Ch1 "NTLMv1: Blocked First, in Phase B" | Same section | edited (claims 3, 6–10) |
| Ch1 "NTLMv2: The 2027-04-01 Deadline" | "NTLMv2: the program's 2027-04-01 backstop" | edited (heading; CKT moved into its own paragraph) |
| Ch1 "Pattern One" + "Established in Book 01" callout | Same | edited (claims 13–17; callout retitled Chapter 01) |
| Ch1 "Pattern Two" | Same | kept with sources added (18–21) |
| Ch1 "Pattern Three" | Same | edited (Entra linked-server options expanded into a list; 22–27) |
| Ch1 "Pattern Four" | Same | edited (claim 28; link to Chapter 19) |
| Ch1 "What Book 06 establishes" callout | "What this chapter establishes" | edited (point 1 and 3 refined) |
| Ch1 footnotes (ntlm-faq, spn, ntlm-removed, linked, ckt, mi-2025, kcd) | Footnotes | edited: re-keyed `c14-`; FAQ replaced (claim 5); CKT footnote replaced by Entra Kerberos page; others re-opened and kept |
| Book_06 front matter, subtitle, description | Description and opening callout | carried (substance) |
| Book_06 callout (SQL Server a common NTLM source; three phases; 2027-04-01) | "Where this part of the book starts" callout | carried |
| Book_06 diagram `book-06-ntlm-elimination-phases.svg` | After the opening callout | carried |
| Book_06 "Download this book" (Book_06-bundle.docx) | — | removed: per-book Word bundles don't exist on the site; replaced by link to Runbook R06 |
| Book_06 "Chapters" listing | — | removed: listing of the old series' chapters; the book index replaces it |
| Book_06 "Place in the dependency chain: Step 8" | Opening callout | carried as text (series-overview link not carried; archived page) |
| Book_06 "Authoritative references" (7 links) | Footnotes | carried: all re-opened; NTLM auditing enhancements page used in Chapter 15; `sys.dm_exec_connections` used in Chapter 15 |
| Book_06 "Continue the series" | Continue the book callout | edited (new reading order; Previous → Chapter 13) |

Diagram source edited: `book-06-ch01-when-sspi-falls-back.flow.yaml` — q3/p1 now say a missing SPN gives NTLM while a duplicate or wrong-account SPN fails (claim 14–15); "Book 05" → "Chapters 11–12". Needs re-render.

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | Linked-server Entra option on SQL Server 2022 restated as an access token for an Entra application, generated from the application's client secret, a documented exception under Chapter 11's rule (was "an Entra identity in the provider string"); new note `[^c14-linked-token]`. The existing advice to avoid the deprecated password option stands, and Runbook R06 now matches it | line 97; note line 138 | factual | <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-linked-server> |
| CR2-2 | `[^c14-kb]` title updated to the KB's current title and applies-to list; events 4024 and 4025 re-checked; accessed date Oct 21, 2026. The October 2026 scope in this chapter (24H2 through 26H2, and Windows Server 2025) was verified correct | note line 121 | factual (citation corrected; scope verified) | <https://support.microsoft.com/help/5066470>; <https://learn.microsoft.com/windows/release-health/windows-message-center> |
