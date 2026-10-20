# Verification — Chapter 10, Arc Deployment Sequencing for SQL Server Hosts

Checked October 20, 2026. Source: the existing page (former Book 04, Chapter 2), verified and upgraded in place. Consistency checked against Book 05, Chapter 09.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Order: connectivity → agent → extension → Entra → verify | Opening | restated-as-design | Program sequence; Learn, Arc-enabled servers overview |
| 2 | Agent needs outbound HTTPS to `management.azure.com`, `login.microsoftonline.com`, regional Arc endpoints | Prerequisites | edited / verified | Learn, SQL Server enabled by Azure Arc overview (outbound TCP 443 only); agent endpoints and service tags deferred to Book 05 Ch 09 |
| 3 | SQL-specific destinations: `*.<region>.arcdataservices.com` (`.azure.us` in US Gov Virginia), `aka.ms`, `*.web.core.windows.net`, Entra URLs, Key Vault; resource providers | Prerequisites | verified (new) | Learn, Prerequisites — SQL Server enabled by Azure Arc |
| 4 | No direct internet egress from production SQL hosts | Prerequisites | restated-as-design | Boundary network posture |
| 5 | Agent supports proxy, set at installation | Prerequisites | edited / verified | Learn, Tutorial (Arc SQL 2022): `azcmagent config set proxy.url` |
| 6 | Entra authentication doesn't use the agent proxy; needs WinHTTP proxy | Prerequisites | verified | Learn, Tutorial: Set up Entra authentication for SQL Server enabled by Azure Arc |
| 7 | `HTTPS_PROXY` requires `NO_PROXY` for localhost/127.0.0.1 | Prerequisites | verified (new) | Learn, Prerequisites — SQL Server enabled by Azure Arc |
| 8 | Private Link not supported for the data processing service endpoint | Prerequisites | verified (new) | Same |
| 9 | `azcmagent check --extensions sql` | Prerequisites | verified (via Book 05) | Book 05 Ch 09, which cites Learn `azcmagent check` |
| 10 | Extension "must be deployed after the agent… installed via Azure Policy assignment — the recommended approach" | The extension | corrected | Learn, Deployment options for SQL Server enabled by Azure Arc: installed automatically when a connected server has SQL Server; at-scale management via automatic connection; opt-out tag per Book 05 Ch 09 |
| 11 | Extension "verifies the SQL Server version, where 2022 or later is required" | The extension | corrected | Learn, overview: extension supports SQL Server 2014+; the 2022 floor applies to Entra authentication only and is enforced by the audit |
| 12 | Only extensions released in last 12 months supported | The extension | verified (new) | Learn, Prerequisites; Learn, Deployment options (automatic updates) |
| 13 | Service account sysadmin; `NT AUTHORITY\SYSTEM` login with CONNECT SQL; .NET 4.7.2 | The extension | verified (new) | Learn, Prerequisites — SQL Server enabled by Azure Arc |
| 14 | Category 2 = immediate targets, ordered by urgency | The extension | restated-as-design | Program position |
| 15 | Installing the extension doesn't switch on Entra authentication | Enabling Entra | verified | Learn, overview settings table (disabled by default, per instance) |
| 16 | SQL 2022: app registration, Graph permissions with admin consent, Key Vault cert, MI read access | Enabling Entra | verified | Learn, Tutorial (SQL 2022): `Directory.Read.All` or `Application.Read.All` + `Group.Read.All` + `User.Read.All`; PRA for consent; Key Vault Certificate User + Secrets User |
| 17 | SQL 2025: primary MI, `User.Read.All`, `GroupMember.Read.All`, `Application.Read.All`, PRA only | Enabling Entra | verified | Learn, Set up managed identity and Entra authentication for SQL Server enabled by Azure Arc |
| 18 | Service-managed cert/app option; consent still needed (error 37455); certs not auto-rotated | Enabling Entra | verified (new) | Learn, Using automation to set up the Entra admin for SQL Server |
| 19 | App roles assigned per identity; Directory Readers via group is broader, not recommended | Enabling Entra | verified (new) | Learn, Set up managed identity … |
| 20 | Entra admin becomes sysadmin; changing admin leaves old login | Enabling Entra | verified (new) | Learn, Tutorial (SQL 2022) |
| 21 | Set the instance's Entra admin to a group | Enabling Entra | restated-as-design | Program position; "Book 07" → Chapter 16 |
| 22 | Neither version supports FCIs; both need Azure public cloud | Enabling Entra | verified | Learn, Entra authentication for SQL Server; Learn, Managed identity … limitations |
| 23 | Entra connections always encrypted; trusted TLS certificate | Enabling Entra | verified (new) | Learn, Tutorial (SQL 2022) |
| 24 | SQL 2025: don't disable Entra authentication once enabled | Enabling Entra | verified (new) | Learn, Managed identity … limitations |
| 25 | HIMDS token check URL (api-version 2019-11-01) and challenge | Verification | edited / verified | Learn, Access Azure resources by using managed identity on Arc-enabled servers; api-version changed to the Windows sample's `2020-06-01` |
| 26 | Successful token proves MI, agent and ARM resource health | Verification | restated-as-design | Author's argument |
| 27 | "Book 03" next-audit reference | Verification | corrected | → Chapter 07 |

All seven original footnotes were re-opened and reformatted; none was broken.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited: title `Chapter 10 — Arc Deployment Sequencing for SQL Server Hosts`, `doc-type`, description, `lifecycle_review` |
| H1, thesis, In this chapter | Same | edited; runbook R04 link added |
| Figure + opening paragraph | Same | kept; pointer to Book 05 Ch 09 for server-wide onboarding added |
| Prerequisites for Arc Enrollment | Prerequisites for Arc enrollment | edited (claims 2–9); endpoint table added |
| The Azure Extension for SQL Server | Same | edited (claims 10–13) |
| Enabling Microsoft Entra Authentication on the Instance | Same | edited (claims 15–24); version comparison table added |
| Verification of Managed Identity Availability | Same | edited (claims 25–27) |
| "What Book 04 establishes — Chapter 2" | "What this chapter establishes" | edited; footnotes moved out of the callout |
| (none) | Continue the book | added |

Diagram source edited: `book-04-ch02-arc-deployment-sequence` step 3 (claim 10: "Separate install, ideally by Azure Policy…" → "Installed automatically when a server with SQL Server connects (opt out by tag)…"; title "Deploy" → "Let … deploy"), plus "Book 07" → "Chapter 16" and "Book 03" → "Chapter 07". The chapter's fig-alt was updated to match.
