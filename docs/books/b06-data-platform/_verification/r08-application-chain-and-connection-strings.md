# Verification — Runbook R08, The Application Chain & Connection-String Migration

File: `docs/books/b06-data-platform/r08-application-chain-and-connection-strings.md`
Source: the same file (former Implementation Companion Book 08)
Verified: 2026-10-20

Microsoft claims were checked on Microsoft Learn on 2026-10-20. Script and function claims were checked against the program's `tools/discovery/Spec3-D1.9-Get-LDAPBindAccountInventory.ps1` and `FMPSqlServerMigration.psm1` (published under the `FMP` prefix).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | D1.9 parameters including `-FirewallLogPath` | Parameter table | corrected: the script has no `-FirewallLogPath`; NetFlow/firewall analysis is described in its help only. Row removed, note added | program source |
| 2 | `-D1InputFile` = Spec3-D1.1 service-account scan | Parameter table | corrected/flagged: Spec3-D1.1 isn't among the published discovery scripts (same finding as R03 claim 5); example file name made generic | program source |
| 3 | `-IncludeDCLogs` queries "Security event logs" for 4624/2889/2887 | Parameter table | corrected: 4624 is in the Security log; 2887 and 2889 are in the Directory Service log (the script itself reads the right logs) | LDAP signing overview; program source |
| 4 | 4624 logon type 8 = NetworkCleartext, produced by LDAP simple binds | Event IDs | verified | Administrative tools and logon types; IdentityLogonEvents |
| 5 | 2889 "unsigned bind", 2887 "signing stats" | Event IDs | corrected/expanded: 2887 is a 24-hour summary of unsigned SASL and clear-text simple binds permitted; 2889 is per-client detail and needs *16 LDAP Interface Events* = 2; Windows Server 2025 requires signing by default for new deployments | LDAP signing overview |
| 6 | DC ports 389, 636, 3268, 3269 | Event IDs/ports | verified | Service overview and network port requirements |
| 7 | Discovery heuristics; output schema fields (`LDAPBindConfidence`, `RiskClassification`, `BindType`, `MigrationTarget`, …) | Discovery; Output schema | verified | program source |
| 8 | `MigrationTarget` toward API-driven provisioning, managed identity or service principal | Output schema | verified (also Universal Print and Exchange modern auth targets); ADR labels removed | program source |
| 9 | (added) Diagnostic logging isn't retroactive; set back to 0 afterward | Usage | verified | LDAP signing overview |
| 10 | `New-FMPAppConnectionPlan` joins D1.9 to D1.8, class preference, `-CapabilityMap`, `review` | What D1.9 gives you | verified (function and parameters exist; `correlated_sql_instances`) | program source |
| 11 | Four-class taxonomy and preference order | Four-class triage | restated-as-design (program's LDAP-dependent-application migration plan, Chapter 18) | — |
| 12 | Application Proxy fronts the app with no code change | Four-class triage | verified (KCD for IWA added) | Microsoft Entra application proxy |
| 13 | Entra Domain Services as last resort preserves AD dependency | Four-class triage | verified: provides LDAP, Kerberos and NTLM | What is Microsoft Entra Domain Services? |
| 14 | Class 4 blocks "the Entra-only posture Transformation #7 requires" | Four-class triage | edited: restated as the Entra-exclusive closure posture of Chapter 20; canon numbering removed | — |
| 15 | Keywords `Active Directory Managed Identity` / `Service Principal` / `Default` | The change | verified | Microsoft Entra authentication with Microsoft.Data.SqlClient |
| 16 | `Active Directory Default` in SqlClient 2.0+ | DefaultAzureCredential | corrected: first supported in SqlClient 3.0 (Service Principal 2.0; Managed Identity 2.1); 7.0+ needs the `Extensions.Azure` package | Same |
| 17 | `Active Directory Default` "preferred for new configurations" | The change; DAC | corrected/qualified: Microsoft recommends a specific mode in production because Default probes providers in sequence and its identity can change; program position restated | Same |
| 18 | Service principal credential via Key Vault reference, not inline | The change | verified and clarified: built-in mode takes client ID + client secret; certificates need a token callback | Same |
| 19 | (added) `Authentication` turns on encryption and certificate validation; all Entra connections to SQL Server require encryption | The change | verified | Same; Entra auth setup tutorial |
| 20 | Driver "mints a token from the local IMDS endpoint" on Arc | The change | corrected: Arc's Hybrid Instance Metadata Service (HIMDS) at `localhost:40342`, with a challenge-token step; caller must be local admin or in *Hybrid agent extension applications*; Arc servers have system-assigned identity only | Managed identity on Arc-enabled servers; Arc identity and authorization; Azure extension for SQL Server system objects |
| 21 | Three gate conditions | Gates | verified as program design; added that a token doesn't grant database permissions and the HIMDS group membership | Microsoft.Data.SqlClient article |
| 22 | DefaultAzureCredential order "Managed Identity first, then Azure CLI, Visual Studio, environment" | DefaultAzureCredential | corrected: Environment, Workload Identity, Managed Identity, then developer tools; interactive browser excluded | Credential chains in the Azure Identity library for .NET |
| 23 | C# sample `new DefaultAzureCredential;` | Code | corrected syntax (`()`), usings and `Open()` added; production note | Same |
| 24 | Audience `https://database.usgovcloudapi.net/` as the "GCC data-plane audience" | Code; audience note | corrected: SQL Server Entra auth audience is `https://database.windows.net/`; GCC uses worldwide endpoints; Government audiences apply to GCC High/DoD (out of scope) | Microsoft Entra authentication for SQL Server; Microsoft Graph national cloud deployments |
| 25 | (added) `AccessToken` can't be renewed and is part of the pool key; use `AccessTokenCallback` (5.2+) | Code | verified | Microsoft.Data.SqlClient article |
| 26 | Verify with `auth_scheme = AAD` | Verification | unverifiable/flagged: Learn documents `auth_scheme` but not the value for Entra connections; verification restated as login name plus absence of NTLM/KERBEROS rows; pilot to confirm | sys.dm_exec_connections |
| 27 | Book 03/04/05/07/09 references | throughout | edited: Runbooks R03, R04, R05, R07, R09; Chapters 18–20 | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title `Runbook R08 — …`; `doc-type`, `status: draft`, `lifecycle_review: 2027-04-01`; `subtitle`, `canon-source` removed; one-sentence description |
| docx H1 block; Download callout (Book_08.docx) | removed | Word file not on the site |
| Companion note callout | edited | thesis, "In this runbook", "Pairs with" (Chapters 18–19) |
| The chain has two tracks | kept | — |
| Phase 1 — D1.9 (parameters, discovery methods) | edited | claims 1–7; broken `[tools/discovery/]` bracket link removed |
| Output schema | edited | claim 8; illustrative-code warning added before the first code block |
| Usage code block | edited | claims 2, 9 |
| What D1.9 does and does not give you | edited | claim 10 |
| The four-class triage | edited | claims 11–14 |
| Phase 2 warning callout | kept | — |
| The change | edited | claims 15–20 |
| The three gate conditions | edited | claim 21 |
| DefaultAzureCredential for .NET | edited | claims 22–25 |
| Verification & rollback | edited | claim 26 |
| Closing italic footer | removed | duplicated the body; paths and canon residue |
| — | added | "Continue the book" callout (R07 ← → R09); footnotes `[^r08-*]` (15) |
