# Verification — Chapter 08, Reading the Audit: Classification and Triage

Checked October 20, 2026. Source: the existing page (former Book 03, Chapter 2), verified and upgraded in place.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Category 1: agent, extension, SQL 2022 | Category 1 | edited / verified | Learn, SQL Server enabled by Azure Arc overview; "or later" and "Entra authentication configured" added |
| 2 | "Registered the instance with the Arc data services plane" | Category 1 | corrected | Reworded: the extension registers the instance as a SQL Server enabled by Azure Arc resource (Learn, deployment options) |
| 3 | Prioritize Category 2 by logins, SQL logins, missing SPNs | Category 2 | restated-as-design | Program position; SPN→NTLM per Learn, Register an SPN |
| 4 | Arc deployment "installs the Connected Machine agent and the SQL Server extension" | Category 2 | corrected | Learn, Deployment options for SQL Server enabled by Azure Arc: the extension is installed automatically when a connected server has SQL Server |
| 5 | "Book 03 describes the Arc deployment sequence" | Category 2 | corrected | Source error (it is former Book 04 Ch 2) → Chapter 10 |
| 6 | Re-classify to Category 1 "once the extension confirms the MI is available" | Category 2 | edited | Re-classification requires Entra authentication configured, not only MI availability |
| 7 | Pre-2022 can't accept `FROM EXTERNAL PROVIDER` | Category 3 | verified | Learn, CREATE LOGIN; Learn, Entra authentication for SQL Server |
| 8 | Syntax "introduced in SQL Server 2022 as part of the Azure extension for SQL Server integration" | Category 3 | corrected | Entra authentication was introduced in SQL Server 2022 (Learn overview); it isn't part of the extension — Microsoft documents a non-Arc path |
| 9 | Older versions produce "a parse error" | Category 3 | removed | Unverifiable |
| 10 | FCIs belong with Category 3 | Category 3 | verified (new) | Learn, Entra authentication for SQL Server |
| 11 | 2027-04-01 NTLM elimination deadline; block is network-level | Category 3 | restated-as-design | Program backstop and program block; Microsoft's own position (deprecated, disable-by-default planned, no date) footnoted: Learn, Features removed or no longer developed in Windows Server; Windows IT Pro Blog, "Advancing Windows security: Disabling NTLM by default" (Jan 29, 2026). "Network-level" reworded to "applied in the operating system's security layer" |
| 12 | Layer 1 needs Arc agent, extension, SQL 2022; not domain unjoin or WS 2025 | Engine vs OS sign-in | edited / verified | Learn, Entra authentication for SQL Server; "on the program's path" and FCI exclusion added |
| 13 | Domain-joined WS 2019 + SQL 2022 + Arc can have Entra logins | Engine vs OS sign-in | verified | Same; no domain-join requirement in Microsoft prerequisites |
| 14 | Layer 2 RDP with Entra; requires domain unjoin and WS 2025 with Desktop Experience | Engine vs OS sign-in | verified | Learn, Sign in to an Azure Arc-enabled server using Entra ID (WS 2025 with Desktop Experience; Entra-joins the machine; for machines not joined to another domain) |
| 15 | Sequence Layer 1 first; "not blocked" interpretation | Engine vs OS sign-in | restated-as-design | Program position |

All five original footnotes were re-opened and reformatted; none was broken.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited: title `Chapter 08 — Reading the Audit: Classification and Triage`, `doc-type`, description, `lifecycle_review` |
| H1, thesis, In this chapter | Same | edited: H1 renumbered; thesis reworded; "OS Entra login" → "OS Entra sign-in" (Microsoft's term) |
| Figure: triage by category | Opening | kept |
| Interpreting Category 1 | Interpreting Category 1: Entra-auth-ready | edited (claims 1–2); "Book 05" → Chapter 11 |
| Interpreting Category 2 | Interpreting Category 2 | edited (claims 4–6) |
| Interpreting Category 3 | Interpreting Category 3 | edited (claims 7–11) |
| The SQL Engine vs. OS Entra Auth Distinction (+ figure) | The SQL engine versus OS Entra sign-in distinction | edited (claims 12–14); figure kept |
| "What Book 03 establishes — Chapter 2" | "What this chapter establishes" | edited |
| (none) | Continue the book callout | added |

Diagram source edited (labels only): `book-03-ch02-triage-by-category` ("Book 05" → "Chapter 11"; "the program's" 2027-04-01 block).
