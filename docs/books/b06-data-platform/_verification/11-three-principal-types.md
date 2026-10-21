# Verification — Chapter 11, Three Principal Types: User, Group, Service Principal

Checked October 20, 2026. Sources: the existing page (former Book 05, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_05.md`, carried into the opening.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Tokens "carrying claims about identity, group membership, device compliance, and MFA" | Opening | corrected | Reworded: Entra issues the token only after sign-in conditions are met; device compliance/MFA are enforced by Conditional Access, not necessarily carried as claims the engine reads |
| 2 | Books 01–04 prerequisite; Books 06–10 consequence | Opening | corrected | Renumbered: Chapters 01–10 / 14–22 |
| 3 | Principal named by UPN (user) or display name (group, app) | FROM EXTERNAL PROVIDER | verified | Learn, CREATE LOGIN; Learn, Tutorial (SQL 2022) create logins |
| 4 | Stored in `master` as a passwordless external principal; SID = object ID (client ID for apps) | FROM EXTERNAL PROVIDER | verified (SID detail new) | Learn, sys.server_principals |
| 5 | Token audience; engine validates and maps | FROM EXTERNAL PROVIDER | verified | Learn, Entra authentication for SQL Server (audience `https://database.windows.net/`) |
| 6 | "The syntax requires the Azure extension for SQL Server … and registration with the Arc SQL resource plane" | FROM EXTERNAL PROVIDER | corrected | Requires Entra authentication configured on the instance; on the program's path the extension does it (Microsoft also documents a non-Arc path — see Chapter 09) |
| 7 | Graph lookup needs Graph read permissions; consent missing → login creation fails | FROM EXTERNAL PROVIDER | verified (failure mode new) | Learn, Using automation to set up the Entra admin (error 37455) |
| 8 | SQL 2025 `WITH OBJECT_ID` for nonunique names | FROM EXTERNAL PROVIDER | verified (new) | Learn, CREATE LOGIN |
| 9 | Entra connections always encrypted; supported auth methods | FROM EXTERNAL PROVIDER | verified (new) | Learn, Tutorial (SQL 2022); Learn, Entra authentication for SQL Server |
| 10 | UPN vs SAM mapping captured first | Type 1 | restated-as-design | Program procedure; CREATE LOGIN confirms Windows logins use `DOMAIN\name` and Entra users use UPN |
| 11 | Users sign in "with password plus MFA, FIDO2, or Windows Hello for Business" | Type 1 | corrected | Learn, Managed identity for SQL Server enabled by Azure Arc, limitations: FIDO2 isn't currently supported for Entra authentication to SQL Server on Arc machines |
| 12 | Engine has no MFA logic; CA enforces MFA, compliance, named locations, risk before the token | Type 1 | verified | Learn, What is Conditional Access?; Learn, What is Microsoft Entra ID Protection? |
| 13 | CA target app "Azure SQL Database"; P1 needed; CA applies to users not programmatic connections | Type 1 | verified (new) | Learn, Conditional access (Azure SQL); Learn, What is Conditional Access? (P1; risk needs P2; Workload ID licensing) |
| 14 | Group login via group claim; type X | Type 2 | edited / verified | Learn, sys.server_principals; Learn, Tutorial (SQL 2022). "Token includes a claim asserting membership" softened to "member of that group connects", since SQL Server also resolves membership via Graph |
| 15 | Dynamic groups add/remove members on attribute change; P1 per unique member; attribute write controls | Type 2 | verified (licensing and security note new) | Learn, Manage rules for dynamic membership groups |
| 16 | "Book 07 covers designing and governing those groups" | Type 2 | corrected | → Chapters 16 and 17 |
| 17 | `DefaultAzureCredential` finds the Arc MI at localhost:40342 | Type 3 | edited / verified | Learn, Azure Identity client library for .NET (Arc supported by `ManagedIdentityCredential` and `DefaultAzureCredential`); Learn, DefaultAzureCredential class ("In production, it's better to use something else") — recommendation changed to `ManagedIdentityCredential` |
| 18 | Process account in Hybrid Agent Extension Applications group | Type 3 | verified | Learn, Access Azure resources by using managed identity on Arc-enabled servers |
| 19 | Arc identity is the server's, shared by permitted processes | Type 3 | restated-as-design | Added argument, follows from the system-assigned MI being per server (Learn, MI for SQL Server enabled by Azure Arc) |
| 20 | Prefer certificate over secret if a credential is unavoidable | Type 3 | restated-as-design | Program position |
| 21 | Three-phase parallel run; 30 days; non-prod shortening with sign-off | Parallel run | restated-as-design | Program decision |
| 22 | Audit `SUCCESSFUL_LOGIN_GROUP` to see what's used; contained users | Parallel run | verified (new) | Learn, Disable SQL authentication for SQL Server enabled by Azure Arc |
| 23 | SQL 2025 Disable SQL Authentication: blocks new SQL logins incl. sa, no restart, reversible, needs primary MI | Parallel run | verified (new) | Same |
| 24 | Google Cloud SQL lets Entra be enabled without disabling AD auth | Parallel run | verified | Google Cloud documentation, re-opened Oct 20, 2026 |

All ten original footnotes were re-opened and reformatted; none was broken.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Chapter: front matter | Front matter | edited: title `Chapter 11 — Three Principal Types: User, Group, Service Principal`, `doc-type`, description, `lifecycle_review` |
| Chapter: H1, thesis, In this chapter | Same | edited |
| Chapter: opening paragraph (technical heart) | Opening | edited (claims 1–2) |
| Chapter: The FROM EXTERNAL PROVIDER Syntax (+ figure) | Same (sentence case) | edited (claims 3–9); figure kept |
| Chapter: Type 1 — Entra User Login | Type 1: Entra user login | edited (claims 11–13) |
| Chapter: Type 2 — Entra Group Login | Type 2: Entra group login | edited (claims 14–16) |
| Chapter: Type 3 — Entra Service Principal Login | Type 3: Entra service principal login | edited (claims 17–20) |
| Chapter: The Parallel-Run Migration Pattern (+ figure) | Same | edited: audit-evidence paragraph added; "The next chapter" → Chapter 12 link |
| Chapter: "What Book 05 establishes" | "What this chapter establishes" | edited |
| Book_05 front page: callout (prerequisite/consequence; only retain/target instances; parallel run normative) | Opening paragraph | kept, renumbered (Books 01–04 → Chapters 01–10; Books 06–09 → Chapters 14–22; Book 02 → Chapter 06) |
| Book_05: figure `book-05-principal-mapping.svg` | Opening | kept |
| Book_05: Download / Chapters listing | — | removed: not used in Books 02–05 |
| Book_05: dependency-chain steps 5 and 7 | Opening paragraph | kept |
| Book_05: Authoritative references (5 links) | Footnotes, here and in Chapter 12 | edited: CREATE LOGIN, server_principals, Disable SQL Authentication and Conditional Access footnoted in Chapter 11; Change server authentication mode footnoted in Chapter 12 |
| Book_05: Continue the series | Continue the book | edited |

Diagram source edited (labels only): `book-05-principal-mapping` ("Book 07" → "Chapter 16").

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | Service-principal credential rule restated as the book-wide rule: managed identity first; otherwise a service principal with a client certificate in Key Vault through a token callback; a client secret only where the mechanism accepts nothing else (the built-in service-principal connection-string mode; a linked server's access-token login on SQL Server 2022), as a documented exception, held in Key Vault, never inline or in a file, and rotated. Was "never a client secret," which contradicted Chapter 19 and Runbook R08. New notes `[^c11-sp-cert]`, `[^c11-sp-secret]` | line 57; notes lines 100-101 | design-consistency (rule chosen) with factual support | SqlClient Entra authentication, "Replace deprecated password authentication" and "Use service principal authentication," <https://learn.microsoft.com/sql/connect/ado-net/sql/azure-active-directory-authentication>; SqlClient security best practices, "Passwords," <https://learn.microsoft.com/sql/connect/ado-net/sql/application-security-scenarios-sql-server> |
