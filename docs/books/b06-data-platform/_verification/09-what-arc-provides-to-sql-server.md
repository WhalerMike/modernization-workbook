# Verification — Chapter 09, What Arc Provides to SQL Server

Checked October 20, 2026. Sources: the existing page (former Book 04, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_04.md`, carried into the opening. Consistency checked against Book 05, Chapter 09 (`../b05-devices/09-servers-under-azure-arc.md`).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Without Arc there's nothing to anchor the instance's Entra identity and no mechanism to accept tokens | Opening | corrected | Learn, Enable Entra authentication without Azure Arc shows a manual mechanism exists; restated as "the program's" engine and "no managed mechanism" |
| 2 | Arc gives the server a `Microsoft.HybridCompute/machines` ARM resource | Agent and ARM identity | verified | Learn, What is Azure Arc-enabled servers? |
| 3 | System-assigned MI is a service principal created at registration, deleted at deregistration | Agent and ARM identity | edited / verified | Learn, Access Azure resources by using managed identity on Arc-enabled servers (ARM creates the SP in the tenant the subscription trusts); deletion clause dropped as not directly sourced |
| 4 | Private key "rotated automatically every 90 days" | Agent and ARM identity | corrected | Learn, Identity and authorization (Arc servers): certificate valid 90 days, renewed at ≤45 days remaining; expiry → Expired, reconnect needed. Matches Book 05 Ch 09 |
| 5 | HIMDS at `localhost:40342`, not `169.254.169.254`; challenge for Administrators / Hybrid Agent Extension Applications | Agent and ARM identity | verified | Learn, Access Azure resources by using managed identity on Arc-enabled servers |
| 6 | Layer 1 requirements (agent, SQL 2022+, extension, Entra configured) | Two-layer distinction | verified / edited | Learn, SQL Server enabled by Azure Arc overview; Learn, Entra authentication for SQL Server; FCI exclusion added |
| 7 | "OAuth 2.0 access tokens" validated | Two-layer distinction | verified | Learn, Entra authentication for SQL Server (access token audience) |
| 8 | Layer 2: AADLoginForWindows, domain unjoin, WS 2025 with Desktop Experience | Two-layer distinction | verified | Learn, Sign in to an Azure Arc-enabled server using Entra ID |
| 9 | Layer 2 brings no Conditional Access | Two-layer distinction | verified (new) | Same page ("Conditional Access isn't supported…"); consistent with Book 05 Ch 09 |
| 10 | SQL 2025: MI as primary MI, inbound and outbound | MI and service account | verified | Learn, Managed identity for SQL Server enabled by Azure Arc (also: system-assigned only, Windows only — added) |
| 11 | SQL 2022: app registration with Key Vault certificate installed by the agent | MI and service account | verified | Learn, Tutorial: Set up Entra authentication for SQL Server enabled by Azure Arc |
| 12 | App registration can't make outbound connections | MI and service account | verified | Learn, Managed identity for SQL Server enabled by Azure Arc |
| 13 | Agent-side work includes "log forwarding through the Azure Monitor agent" | MI and service account | removed | Not needed for the argument; dropped from the list rather than sourced |
| 14 | Key Vault certificate ≤12 months; needs a renewal owner | MI and service account | verified | Learn, Tutorial (recommended validity at most 12 months); Learn, Using automation to set up the Entra admin ("certificates … aren't rotated automatically", added) |
| 15 | gMSA can't be the engine's Entra identity | Alternatives | verified | Learn, Group Managed Service Accounts overview (AD account) |
| 16 | Client-secret service principal reintroduces a credential and a bootstrap problem | Alternatives | restated-as-design | Author's argument |
| 17 | Microsoft's manual non-Arc setup | Alternatives | added (correction) | Learn, Enable Entra authentication for SQL Server on Windows without Azure Arc |
| 18 | Certificate-based authentication = interim posture; AD CS→Cloud PKI "Not Yet Defined" | Alternatives | restated-as-design | Program position; "2027-04-01 block" → "program's 2027-04-01 backstop" |
| 19 | Cloud PKI issues to Intune-managed devices | Alternatives | verified (new) | Learn, Overview of Microsoft Cloud PKI for Microsoft Intune (URL corrected: old `intune-service/protect/microsoft-cloud-pki-overview` → `intune/cloud-pki/`); Intune not supporting Windows Server per Book 05 Ch 09 |
| 20 | Entra authentication available under every license type; BPA etc. need SA/subscription/PAYG | What it costs | verified (new) | Learn, SQL Server enabled by Azure Arc overview, feature availability by license type |
| 21 | US Gov Virginia supports only onboarding, inventory, licensing, FCI, ESU — not Entra authentication | What it costs | verified (new) | Learn, SQL Server enabled by Azure Arc in US Government |
| 22 | SQL Server needs access to the Azure public cloud for Entra authentication | What it costs | verified | Learn, Managed identity for SQL Server enabled by Azure Arc, limitations |
| 23 | Commercial Azure subscription in the GCC tenant's directory | What it costs | restated-as-design | Same assumption as Book 05 Ch 09 |
| 24 | Arc doesn't change Windows-integrated auth, logins, modes, SPNs | What Arc doesn't do | verified / restated | Learn, Change server authentication mode; author's argument |
| 25 | Entra authentication setting disabled by default, per instance | What Arc doesn't do | verified (new) | Learn, SQL Server enabled by Azure Arc overview, settings table |
| 26 | References to Book 01 / Book 05 / Chapter 2 | Throughout | corrected | Renumbered to Chapters 01, 02, 10, 11 |

All eleven original footnotes were re-opened; the Cloud PKI URL was stale and was replaced. The rest were reformatted.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Chapter: front matter | Front matter | edited: title `Chapter 09 — What Arc Provides to SQL Server`, `doc-type`, description, `lifecycle_review` |
| Chapter: H1, thesis, In this chapter | Same | edited: footnotes moved out of the callout into the body; "What it costs" added to the list |
| Chapter: figure "what Arc changes" + intro paragraph | Opening | kept (claim 1 edit) |
| Chapter: The Arc Agent and the ARM Resource Identity | Same (sentence case) | edited (claims 3–5) |
| Chapter: The Two-Layer Distinction (+ important callout) | Same | edited (claims 6–9); callout kept |
| Chapter: The Managed Identity and the Service Account (+ figure) | Same | edited (claims 10–14); figure kept |
| Chapter: Why Arc and Not the Alternatives | Same | edited: non-Arc bullet added; Cloud PKI note added |
| (none) | What it costs and where it's available | added (claims 20–23) |
| Chapter: What Arc Does Not Do | What Arc doesn't do | edited (claim 25) |
| Chapter: "What Book 04 establishes" | "What this chapter establishes" | edited |
| Book_04 front page: callout (no cloud-native identity without Arc; Layer 1 not blocked on Layer 2) | Opening paragraph | kept, corrected per claim 1 |
| Book_04: figure `book-04-arc-identity-bridge.svg` | Opening | kept |
| Book_04: Download / Chapters listing | — | removed: bundle downloads and listings not used in Books 02–05 |
| Book_04: dependency-chain step 4 | Opening paragraph | kept |
| Book_04: Authoritative references (7 links) | Footnotes, here and in Chapter 10 | edited: Arc SQL prerequisites, MI endpoint, both setup tutorials, MI overview and the non-Arc tutorial are footnoted across Chapters 09–10; the generic Connected Machine network-requirements link is covered by Book 05 Ch 09 and the SQL prerequisites page |
| Book_04: Continue the series | Continue the book | edited |

Diagram source edited (labels only): `book-04-ch01-what-arc-changes` ("Book 05" → "Chapter 11").
