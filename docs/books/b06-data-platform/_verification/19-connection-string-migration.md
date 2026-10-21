# Verification — Chapter 19, Connection String Migration: The Last Mile

Checked October 20, 2026. Source: the existing page (former Book 08, Chapter 2) verified and upgraded in place.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `Authentication=Active Directory Managed Identity`; no User ID for system-assigned | Change | verified | Learn, Entra authentication with Microsoft.Data.SqlClient |
| 2 | Arc local endpoint `localhost:40342`; Administrators or Hybrid agent extension applications group can get tokens | Change | verified | Learn, Access Azure resources by using MI on Arc-enabled servers |
| 3 | All permitted apps on the host share the identity; limit group membership | Change | verified (CAF guidance) / restated-as-design (sizing consequence) | Learn, CAF Identity and access management for Arc-enabled servers |
| 4 | Source: service principal "client ID and credential supplied through an Azure Key Vault reference" | Change | corrected | SqlClient: `User ID` = client ID, `Password` = client secret; the mode itself takes a secret; certificates go through `AccessTokenCallback` with `ClientCertificateCredential`. Key Vault storage kept as program design |
| 5 | Driver table: SqlClient modes and first releases (MSI 2.1, SP 2.0, Default 3.0; 7.0 Extensions.Azure package) | Driver table | verified (new) | Learn, Entra authentication with Microsoft.Data.SqlClient |
| 6 | ODBC `ActiveDirectoryMsi` (17.3.1.1), `ActiveDirectoryServicePrincipal` (17.7), access token attribute | Driver table | verified (new) | Learn, Using Entra ID with the ODBC Driver; ODBC Linux/macOS FAQ; PHP drivers Entra page |
| 7 | OLE DB `ActiveDirectoryMSI` (18.3, documented from Azure VM), `ActiveDirectoryServicePrincipal` (18.5) | Driver table | verified (new) | Learn, OLE DB Use Microsoft Entra ID; SQL Server 2025 linked-server MI page (MSOLEDBSQL on Arc) |
| 8 | JDBC `ActiveDirectoryManagedIdentity` (12.2; MSI 7.2), Arc supported from 12.2, `ActiveDirectoryServicePrincipalCertificate` (12.4), `ActiveDirectoryDefault` (12.2) | Driver table | verified (new) | Learn, JDBC Connect using Entra authentication |
| 9 | Entra password mode deprecated in all drivers | Driver table | verified (new) | Learn, SqlClient and ODBC Entra pages |
| 10 | Gate 1: login must exist or connection fails | Gates | verified | Learn, Tutorial: Entra auth for SQL Server enabled by Arc (create logins); "Book 05" → Chapter 11 |
| 11 | Gate 2: role grant; token doesn't grant permissions | Gates | verified | Learn, SqlClient Entra page (Overview step 2) |
| 12 | Gate 3: production-equivalent Arc/extension stack | Gates | restated-as-design; encryption/certificate requirement verified (new) | Learn, Tutorial (Arc): Entra connections require encryption |
| 13 | DefaultAzureCredential order: Environment, Workload Identity, Managed Identity, VS, VS Code, Azure CLI, Azure PowerShell, azd, (Interactive off), Broker | Azure.Identity | verified; VS Code needs Broker package; interactive off by default added | Learn, Credential chains in the Azure Identity library for .NET |
| 14 | MI via Arc endpoint on Arc; IMDS on Azure VM | Azure.Identity | verified | Learn, Access Azure resources by using MI on Arc-enabled servers |
| 15 | `Active Directory Default` in SqlClient 3.0+; interactive disabled in this mode | Azure.Identity | verified | Learn, SqlClient Entra page |
| 16 | Source: "sets the `AccessToken` property from the DefaultAzureCredential token directly" | Azure.Identity | edited | `AccessTokenCallback` (5.2+) preferred: driver can renew for pooled connections; `AccessToken` can't be renewed (SqlClient page) |
| 17 | Microsoft recommends naming the credential in production; chain slower, env-var sensitive | Azure.Identity | verified | Credential chains page; SqlClient page (Important note) |
| 18 | `AZURE_TOKEN_CREDENTIALS` narrows the chain | Azure.Identity | verified (new) | Credential chains page |
| 19 | Source: ".NET applications — a large fraction of the federal application estate" | Azure.Identity | restated | "a large share of most agency application estates" — program observation, not a statistic |
| 20 | Source: "the workload-identity model the Managed Identity credential model establishes" | Azure.Identity | corrected | Internal reference renamed → Chapter 11 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, H1 "Chapter 2 — …" | Front matter, H1 | edited |
| Thesis, "In this chapter" | Same | edited (driver section added) |
| Opening paragraph | Opening | kept |
| "The Connection String Change" + diagram | Same | edited: strings moved into a fenced block with a warning callout; claims 1–4 |
| — | "Entra options by driver" | added (requested ODBC/OLE DB/SqlClient/JDBC verification) |
| "The Gate Conditions" | Same | edited: gates as a numbered list; claims 10–12 |
| "The Azure.Identity SDK and DefaultAzureCredential" + diagram | "The Azure.Identity library and DefaultAzureCredential" | edited (claims 13–20) |
| "What Book 08 establishes — Chapter 2" | "What this chapter establishes" | edited (points 1–2 expanded) |
| Footnotes (arc-mi-endpoint, create-login) | Footnotes | re-keyed `c19-`; CREATE LOGIN footnote replaced by the Arc tutorial's create-logins section |
| — | Continue the book | added (Next → Chapter 20) |

Diagram source edited: `book-08-ch02-connection-string-migration.flow.yaml` — the service-principal row said "A certificate (preferred) or secret, from Azure Key Vault"; the connection-string mode takes a secret, so it now says the secret comes from Key Vault and a certificate needs a token callback in code (claim 4). Needs re-render. `book-08-ch02-credential-chain.flow.yaml` checked, no change.

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | Service-principal paragraph restated with Chapter 11's credential rule: prefer a certificate through `AccessTokenCallback`; the secret-based connection-string mode is a documented exception, secret in Key Vault, injected at runtime, rotated. New notes `[^c19-sp-cert]`, `[^c19-sp-secret]` | line 44; notes lines 101-102 | design-consistency with factual support | <https://learn.microsoft.com/sql/connect/ado-net/sql/azure-active-directory-authentication>; <https://learn.microsoft.com/sql/connect/ado-net/sql/application-security-scenarios-sql-server> |
