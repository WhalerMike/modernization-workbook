# Verification — Chapter 01, What Windows Authentication Actually Is

Checked October 20, 2026. Sources: the existing page (former Book 01, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_01.md`, carried into the new opening (book Why paragraph, "The case in one paragraph" callout and the landing diagram). All Microsoft sources were opened through the Microsoft Learn MCP tools (fetch or search excerpt) on that date.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Windows Authentication can't be disabled; SQL Server doesn't validate Windows passwords itself | Why the database… (new opening) | verified (new) | Learn, Choose an authentication mode |
| 2 | Protocol used per connection is visible only via `sys.dm_exec_connections.auth_scheme` | Opening; Kerberos foundation | verified (new) | Learn, Register a Service Principal Name for Kerberos connections |
| 3 | Book Why statement: the database is where legacy auth hides; the program retires NTLM, adds CA, stops treating AD as source | Opening | restated-as-design | Program argument; carried from Book_01 front page and the book's opening question |
| 4 | Four authentication paths; only an Entra token is anchored in Entra ID | "The case in one paragraph" + landing figure | verified | Learn, Microsoft Entra authentication for SQL Server; figure carried from Book_01 front page |
| 5 | "Delegates authentication entirely to the Windows security subsystem, with no password verification or token model of its own" | Kerberos foundation | edited | Reworded to Microsoft's description (validates the Windows principal token; doesn't ask for the password); footnote moved to Choose an authentication mode (old footnote pointed at Change server authentication mode, which doesn't say this) |
| 6 | SSPI hides the protocol; Negotiate picks Kerberos unless a system can't use it | Kerberos foundation | verified (new footnotes) | Learn, SSPI Architecture; Learn, Microsoft NTLM (Win32) |
| 7 | KDC on the DC issues a service ticket for the SPN; engine validates with the service account's key | Kerberos foundation | verified | Learn, Kerberos authentication overview; Learn, Register an SPN |
| 8 | Authentication is mutual | Kerberos foundation | verified | Learn, Kerberos v5 Protocol (COM) |
| 9 | SPN format `MSSQLSvc/hostname.domain.com:port` | Kerberos foundation | corrected | Learn, Register an SPN: `MSSQLSvc/<FQDN>:<port>` for TCP; port optional for other protocols; SPN maps to the account that started the service |
| 10 | "Without [the SPN] the KDC can't issue a ticket, and SSPI silently falls back to NTLM" | Kerberos foundation | corrected | Learn, Register an SPN: if no token can be obtained, NTLM is used; added the defaults table — local connections use NTLM even with a correct SPN, and an SPN on the wrong account makes authentication fail rather than fall back |
| 11 | Fallback "absent from the default error log" | Kerberos foundation | corrected | Learn, Register an SPN: a failed SPN registration *is* logged at startup; the per-connection protocol isn't — it's visible in `auth_scheme` |
| 12 | "Most federal environments have not run [the audit]" | Kerberos foundation | removed | Unverifiable statistic; replaced by a pointer to the program's audit instrument (Chapter 07) |
| 13 | NTLM was the original protocol; Windows 2000 made Kerberos preferred | NTLM fallback | verified / edited | Learn, SSPI Architecture ("default authentication protocol since Windows 2000"); Learn, NTLM overview (family includes LAN Manager and NTLM v1/v2) |
| 14 | NTLM fallback cases: untrusted domains, non-domain-joined clients, unreachable KDCs | NTLM fallback | verified / edited | Learn, NTLM overview (workgroup); Learn, Passwords technical overview (IP address, untrusted domain, non-member); Learn, Kerberos SSP/AP (KDC unavailable → MSV1_0) |
| 15 | Zero trust required by the program's FedRAMP Moderate boundary | NTLM fallback | restated-as-design | Program position (unchanged) |
| 16 | NTLM challenge-response stays inside the connection negotiation (client, server, DC) | NTLM fallback | verified | Learn, Microsoft NTLM (noninteractive authentication steps) |
| 17 | Conditional Access lives outside the connection path and can't act | NTLM fallback | verified | Learn, What is Conditional Access? (enforced after first-factor authentication of an Entra sign-in) |
| 18 | ID Protection sign-in risk is evaluated on Entra sign-ins | NTLM fallback | verified (sentence added to use the existing idp footnote) | Learn, What is Microsoft Entra ID Protection? |
| 19 | Domain service account "password set at installation and rarely changed" | Service account | corrected | Learn, Configure Windows service accounts and permissions: domain accounts need manual password management; "rarely" restated as practice |
| 20 | gMSA password rotated every 30 days by AD; no human knows it | Service account | verified / edited | Learn, Service accounts (AD DS): DC computes the password; default interval 30 days, settable only at creation |
| 21 | `NT SERVICE\MSSQLSERVER` authenticates on the network as the computer account | Service account | verified | Learn, Configure Windows service accounts and permissions (`<domain_name>\<computer_name>$`; setup default) |
| 22 | SQL 2025: Arc system-assigned managed identity; recommended | Service account | verified | Learn, Managed identity for SQL Server enabled by Azure Arc |
| 23 | SQL 2022: app registration with certificate in Key Vault | Service account | verified | Learn, Tutorial: Set up Entra authentication for SQL Server enabled by Azure Arc (cert in AKV, downloaded by the Arc agent) |
| 24 | Entra identity sits alongside the Windows service account | Service account | verified | Learn, Managed identity for SQL Server enabled by Azure Arc (identity associated via registry; service account unchanged) |
| 25 | `sa` is the built-in admin on every instance; stored in master | sa account | verified | Learn, Choose an authentication mode |
| 26 | Well-governed estates disable or rename `sa` | sa account | edited | Learn: created disabled in Windows mode; don't enable unless required (Choose / Change server authentication mode). "Rename" dropped as uncited |
| 27 | "Many federal estates keep it active … with its installation-time password" | sa account | restated-as-design | Reframed as "a common pattern in long-lived estates"; no statistic claimed |
| 28 | SQL Auth invisible: no Entra sign-in, no CA, no MDI signal, no risk | sa account | verified / edited | Follows from the engine checking the password (Choose an authentication mode); MDI clause now explains why (no DC traffic) |
| 29 | Architecture was correct for a domain-joined world | Why this was correct | restated-as-design | Author's argument (unchanged) |
| 30 | Renumbering: "Book 04" → Chapters 09–10; added links to Chapter 07 and Chapter 12 | throughout | corrected | Brief renumbering map |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Book_01 front matter (title, subtitle, description) | Chapter description and opening section | edited — subtitle's "good engineering, and why it must now end" is the callout's theme |
| Book_01 callout ("good engineering, not negligence…") | "The case in one paragraph" callout | kept (reworded) |
| Book_01 landing figure (`book-01-authentication-paths-and-anchors.svg`) | After the callout, `#fig-c01-authentication-paths` | kept |
| Book_01 "Download this book" (Book_01-bundle.docx) | — | removed: per-book bundles don't exist for the consolidated book |
| Book_01 "Chapters" listing | — | removed: replaced by the book index and Continue callouts |
| Book_01 "Place in the dependency chain" | Chapter 02 (drivers' order) and the Chapter 01 opening | edited |
| Book_01 Authoritative references (Entra auth overview; cloud-first guidance; Retiring NTLM FAQ; M-22-09; Memo 22-09 Learn page) | Entra auth overview → this chapter's figure context; cloud-first guidance, Retiring NTLM FAQ and M-22-09 → Chapter 02 footnotes | edited — the Memo 22-09 Learn page was superseded by the primary M-22-09 PDF |
| Book_01 Continue ("Previous: Applicability") | Continue callout, Previous = book index (brief) | edited |
| Ch1 In this chapter | In this chapter | edited (adds the Why) |
| Ch1 The Kerberos Foundation | The Kerberos foundation | edited (claims 5–12) |
| Ch1 The NTLM Fallback | The NTLM fallback | edited (claims 13–18) |
| Ch1 The Service Account | The service account | edited (claims 19–24) |
| Ch1 The sa Account | The sa account | edited (claims 25–28) |
| Ch1 Why This Was Correct | Why this was correct | kept |
| Ch1 "What Book 01 establishes" callout | "What this chapter establishes" | edited (Why point added) |
| Diagrams `book-01-ch01-kerberos-sspi-ntlm-fallback`, `book-01-ch01-engine-identity-anchors` | Same positions | kept; sources unchanged (no wrong facts found) |
