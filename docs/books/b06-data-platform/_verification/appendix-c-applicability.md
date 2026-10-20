# Verification — Appendix C, Applicability

Checked October 20, 2026. Source: the existing page ("Applicability — Where the Series Applies as Written"), verified and upgraded in place. Every existing footnote was re-opened.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Arc-enabled SQL Server changes month to month | Platform facts callout | verified | Learn, Release notes — SQL Server enabled by Azure Arc (monthly extension releases through Aug 2026) |
| 2 | SQL Server needs access to Azure public cloud for Entra auth | In scope: Cloud | verified | Learn, Managed identity for SQL Server enabled by Azure Arc (Limitations) |
| 3 | SQL 2022 uses app registration + Key Vault cert; SQL 2025 managed identity recommended | In scope: Version | verified | Learn, Managed identity (Overview); Learn, Entra auth overview |
| 4 | MI setup only for Arc-enabled SQL 2025 on Windows Server | In scope: OS | verified | Learn, Managed identity (Limitations) |
| 5 | Standalone instances and availability groups supported; FCIs not | In scope: Topology; FCI row | verified | Learn, Microsoft Entra authentication for SQL Server |
| 6 | Azure Government: US Gov Virginia only, Windows only, five listed features, "all other features are not currently available" | GCC High/DoD row | verified | Learn, SQL Server enabled by Azure Arc in US Government |
| 7 | Cloud PKI available in GCC High, not DoD | GCC High/DoD row | verified | Learn, Intune GCC High and DoD service description; Learn, Cloud PKI overview |
| 8 | Dynamic groups, PIM, access reviews, entitlement management available in Azure Government | GCC High/DoD row | verified | Learn, Microsoft Entra feature availability |
| 9 | Entra auth needs outbound reach to Entra ID and Graph, with or without Arc | Air-gapped row | verified | Learn, Enable Entra auth without Arc (Prerequisites) |
| 10 | Cloud-first guidance: disconnected apps need to stay on premises | Air-gapped row | verified | Learn, Microsoft Entra cloud-first identity guidance (Step 4, "Disconnected apps") |
| 11 | Arc can still onboard and manage FCIs | FCI row | verified (wording narrowed to "onboard and show in inventory") | Learn, View Always On failover cluster instances in Azure Arc |
| 12 | Entra auth needs SQL Server 2022 or later | 2019-and-older row | verified | Learn, Entra auth overview |
| 13 | Arc doesn't onboard SQL Server 2012 or older | 2019-and-older row | verified (added) | Learn, SQL Server enabled by Azure Arc (Unsupported configurations) |
| 14 | Entra auth documented for SQL 2022 on Linux | Linux row | verified | Learn, Entra auth overview ("on both Windows and Linux") |
| 15 | Connecting SQL Server on Linux to Arc is in preview | Linux row | verified (added) | Learn, Release notes (Preview table) |
| 16 | MI path and Disable SQL Authentication Windows-only on SQL 2025 | Linux row | verified | Learn, Managed identity; Learn, Disable SQL authentication (Limitations) |
| 17 | Without-Arc setup: certificate, adal.dll from OLE DB driver, app registration, admin consent, FederatedAuthentication registry; five endpoints | Alternatives | verified (step list completed: certificate and admin consent added) | Learn, Enable Entra auth without Arc |
| 18 | Microsoft documents only commercial-cloud endpoints for the without-Arc method | Alternatives | verified | Same page lists only login.windows.net, login.microsoftonline.com, graph.*, database.windows.net |
| 19 | IsIntegratedSecurityOnly = 1 means Windows Authentication mode | Fallback protections | verified | Learn, SERVERPROPERTY |
| 20 | Register SPNs; confirm with auth_scheme | Fallback protections | verified | Learn, Register a Service Principal Name |
| 21 | Local connections use NTLM even with a correct SPN, so measure from a client | Fallback protections | verified (added) | Learn, Register an SPN (Authentication defaults); Learn, How to determine if the authentication type is Kerberos |
| 22 | NTLMv1 removed in WS2025; NTLMv2 and RC4-in-Kerberos deprecated | Fallback protections | verified (LANMAN added, also listed as deprecated) | Learn, Features removed or no longer developed in Windows Server |
| 23 | Enhanced NTLM auditing: "Windows 11 24H2, Windows Server 2019 and later" | Fallback protections | corrected | Microsoft Support KB5064479: available on Windows 11 24H2 and WS2025; extended to WS2022 and WS2019 by updates released on or after Oct 13, 2026 |
| 24 | "Some products add MFA to legacy protocols" | Fallback protections | restated-as-design | Reworded as an evaluation rule (compensating control in the exception registry); no vendor claim made |
| 25 | Consolidate first; least privilege through AD groups | Fallback protections | restated-as-design | Program position (unchanged) |
| 26 | Fact stamp "19 October 2026" | Description, callout | corrected | All facts re-checked Oct 20, 2026 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited: title "Appendix C — Applicability"; `doc-type: workbook-chapter`; `lifecycle_review: 2027-04-01`; description re-dated and "series" → "book" |
| docx-only H1 block | H1 | edited: normal H1 |
| (none) | Thesis line and "In this appendix" callout | added ("Read this before Chapter 01" moved from the description into the thesis) |
| Platform facts callout | Same callout | edited: re-dated |
| "Download this page" callout | — | removed: bundle links are not used in Books 02–05 |
| Where the series applies as written (table) | Where the book applies as written | edited: Books 04, 05, 09 → Chapters 09–12 and 20–21; "availability groups" → "Always On availability groups" |
| Where it does not apply as written (table) | Same | edited: renumbered (Books 01–03 → 01–08; Book 06 → 14–15; Book 07 → 16–17; Book 02 → 03–06 / 05–06; Book 03 → 07–08); FCI, 2019-and-older, Linux rows extended (claims 11, 13, 15) |
| Alternatives | Same | edited: step list completed; Book 11 → Chapter 23 link |
| Fallback protections for out-of-scope servers | Same | edited: Book 02 → Chapter 06, Book 06 → Chapter 14, Book 07 → Chapter 16 links; claims 21–24 |
| Footnotes (`[^app-…]`) | Footnotes (`[^aC-…]`) | edited: re-keyed, re-opened, format aligned with the brief (accessed dates); two added (FCI, Arc unsupported configurations) |
| Continue the series callout | Continue the book | edited: Previous → Appendix B; Book index; no Next (end of reading order) |
