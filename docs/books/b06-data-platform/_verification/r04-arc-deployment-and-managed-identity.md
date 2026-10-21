# Verification — Runbook R04, Arc Deployment & the Managed Identity

File: `docs/books/b06-data-platform/r04-arc-deployment-and-managed-identity.md`
Source: the same file (former Implementation Companion Book 04)
Verified: 2026-10-20
Consistency check: Book 05, Chapter 09 (`../b05-devices/09-servers-under-azure-arc.md`): certificate-based onboarding service principal, commercial-subscription assumption, rollback order (extensions before disconnect).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Arc connect creates a system-assigned MI (service principal in the tenant the subscription trusts) | Why Arc | verified | azure-arc/servers/managed-identity-authentication |
| 2 | SQL Server 2025 uses the Arc MI for Entra auth; system-assigned only; Windows only; inbound and outbound | Version callout | verified | sql/sql-server/azure-arc/managed-identity |
| 3 | SQL Server 2022 uses app registration + certificate; "the MI still exists but isn't what the engine authenticates with" | Version callout | verified, extended: the Arc MI downloads the certificate from Key Vault | entra-authentication-setup-tutorial |
| 4 | Prerequisite: egress to "the **Azure Government** Arc service endpoints"; `--location usgovvirginia`; `--cloud AzureUSGovernment` | Prerequisites, Step 1 | **corrected**: GCC uses Microsoft Entra public; an Azure Government subscription can't be associated with a public directory; SQL Server enabled by Arc in US Gov Virginia supports only onboarding, inventory, licensing, FCI and ESU (no Entra authentication); the MI setup says SQL Server needs Azure public cloud access for Entra auth. Runbook now uses a commercial subscription in the same tenant (`--cloud AzureCloud`), matching Book 05 Ch 09 | documentation-government-plan-identity; sql/sql-server/azure-arc/us-government-region; managed-identity |
| 5 | (added) FCIs unsupported for Entra auth | Prerequisites | verified | azure-ad-authentication-sql-server-overview |
| 6 | (added) `NT AUTHORITY\SYSTEM` must connect with CONNECT SQL for extension provisioning | Prerequisites, failure modes | verified | sql/sql-server/azure-arc/prerequisites |
| 7 | (added) Entra-authenticated connections always encrypted; trust-server-certificate with self-signed | Prerequisites | verified | entra-authentication-setup-tutorial |
| 8 | "via the program's egress proxy" / `--proxy-url $env:HTTPS_PROXY` on `azcmagent connect` | Prerequisites, Step 1 | **corrected**: `azcmagent connect` has no proxy flag; agent proxy set with `azcmagent config set proxy.url`; the Database Engine doesn't use the agent proxy for Entra auth and needs direct endpoints or the WinHTTP proxy (`netsh winhttp set proxy`) | azcmagent-connect (flag list); entra-authentication-setup-tutorial |
| 9 | (added) Arc data processing endpoint `*.<region>.arcdataservices.com`; `NO_PROXY` for localhost when a system `HTTPS_PROXY` exists | Prerequisites | verified | sql/sql-server/azure-arc/prerequisites |
| 10 | "Onboarding rights … (a service principal or onboarding token)" | Prerequisites | corrected: certificate-based onboarding service principal with Azure Connected Machine Onboarding, per Book 05 Ch 09; resource providers listed | onboard-service-principal; Book 05 Ch 09 |
| 11 | (added) RBAC to configure Entra auth: Onboarding or Contributor, Resource Administrator, Reader | Prerequisites | verified | azure-ad-authentication-sql-server-overview (remarks) |
| 12 | (added) Graph permissions: 2025 MI `User.Read.All`, `GroupMember.Read.All`, `Application.Read.All`, app roles assigned directly, Privileged Role Administrator; 2022 app reg `Directory.Read.All` or three permissions with admin consent | Prerequisites | verified | microsoft-entra-authentication-with-managed-identity; entra-authentication-setup-tutorial |
| 13 | Tight time sync; token validation time-sensitive | Prerequisites | restated-as-design (operational guidance) | — |
| 14 | `azcmagent connect` example | Step 1 | corrected: certificate-based SP flags, commercial cloud/location, no `--proxy-url`; `--cloud` values and `--location` pairing, cert formats, config-file advice verified | azcmagent-connect |
| 15 | `azcmagent show` → Connected | Step 1 | verified | azcmagent-show |
| 16 | (added) SQL extension auto-installs on connect unless tagged `ArcSQLServerExtensionDeployment = Disabled` | Step 1 | verified | manage-autodeploy |
| 17 | `Invoke-FMPArcOnboarding` behavior (idempotent skip, plan by default, `-Execute` + ShouldProcess, sealed record) | Step 1 | verified (program source); **flagged** two defects: appends `--proxy-url` (not an azcmagent flag) and has no service-principal parameters (interactive fallback) | program source; azcmagent-connect |
| 18 | IMDS endpoint `http://169.254.169.254/metadata/identity/oauth2/token`, single call with `Metadata: true` | Step 2 | **corrected**: Arc identity endpoint is `http://localhost:40342/metadata/identity/oauth2/token` (`IDENTITY_ENDPOINT`), two-call challenge with a token file readable only by Administrators and Hybrid agent extension applications | managed-identity-authentication; security-identity-authorization |
| 19 | Audience `https://database.usgovcloudapi.net/` | Step 2 | **corrected**: SQL Server on premises uses `https://database.windows.net/` (access token audience); the usgovcloudapi audience is Azure SQL in Azure Government | azure-ad-authentication-sql-server-overview; managed-identity setup registry `ServicePrincipalName` |
| 20 | JWT payload decoded with `FromBase64String` directly | Step 2 | corrected: base64url characters (`-`, `_`) translated before decoding; `-NoProxy`, `-SkipHttpErrorCheck` (PowerShell 7) used | invoke-webrequest (PowerShell 7.6 reference) |
| 21 | "This mirrors the Graph-vs-ARM audience split documented in AGENTS.md" | Step 2 | removed (repository-internal file) | — |
| 22 | (added) On 2025 the engine requests tokens from the same HIMDS endpoint | Step 2 | verified (registry `HIMDSEndpoint`) | microsoft-entra-authentication-with-managed-identity |
| 23 | `Test-FMPArcManagedIdentityToken` behavior | Step 2 | verified (program source); **flagged**: `-Live` queries 169.254.169.254 without the challenge; use `-TokenSnapshotPath` | program source; managed-identity-authentication |
| 24 | `az connectedmachine extension create` with `--machine-name $env:COMPUTERNAME` and no location/settings | Step 3 | corrected: documented form adds `--location` and `--settings` (SqlManagement, LicenseType PAYG/Paid/LicenseOnly, ExcludedSqlInstances); runs from a workstation with the `connectedmachine` CLI extension; added `extension show` check | connect-already-enabled; manage-vm-extensions-cli |
| 25 | "Extension … enables Entra ID authentication on SQL 2022+" | Step 3 | corrected: the extension carries configuration; Entra auth is enabled separately (new Step 4) | entra-authentication-setup-tutorial; microsoft-entra-authentication-with-managed-identity |
| 26 | `Test-FMPArcSqlExtension` | Step 3 | verified (program source) | program source |
| 27 | (added) Step 4 configuration steps for 2025 (primary MI in portal; registry method needs caution) and 2022 (app reg, Key Vault cert, Key Vault Certificate User/Secrets User roles, Set Admin, wait for Saved successfully, unique CN) | Step 4 | verified | microsoft-entra-authentication-with-managed-identity; entra-authentication-setup-tutorial |
| 28 | Failure modes: egress, audience, clock skew, stuck extension | Failure modes | kept; added engine-proxy, SYSTEM login, Key Vault, "Extended call failed" (wait 5 min), admin not shown until restart, old sysadmin admin remains | entra-authentication-setup-tutorial; prerequisites |
| 29 | Rollback: "`azcmagent disconnect` removes the machine resource and the managed identity" | Rollback | verified, reordered per Book 05 Ch 09: remove extensions (and the SQL Server – Azure Arc resource) first; disconnect needs an account in the same tenant with delete permission; `--force-local-only`; new identity on reconnect | uninstall-agent; azcmagent-disconnect; delete-from-azure-arc; security-identity-authorization |
| 30 | "disconnecting here has no effect on existing Windows-authenticated connections" | Rollback | kept with qualification: true before Step 4; after Step 4 on 2025, disabling Entra auth isn't advisable | managed-identity (limitations) |
| 31 | "the program decision"; "the directory modernization program Transformation #7" | throughout | removed (residue) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title, `doc-type`, `status`, `lifecycle_review` 2027-04-01; `subtitle` folded into description; `canon-source` removed |
| docx H1 block; Download callout (Book_04.docx) | removed | Word file not on the site |
| Companion note callout | edited | thesis, "In this runbook", "Pairs with" (Chapters 09–10) and a link to Book 05 Ch 09 |
| Automation status callout | edited | residue removed; notes that function defects are called out per step |
| Why Arc comes before login migration | edited | claim 1; Book 05 → R05 |
| SQL Server version matters callout | edited | claims 2–3; links kept (version-neutral URLs) |
| Prerequisites (GCC-Moderate) | edited | split into cloud, host, network, roles subsections; claims 4–13 |
| Step 1 — Enroll the host | edited | claims 14–17; illustrative-code warning added before the first code block |
| Step 2 — Validate the managed-identity token (IMDS) | edited | claims 18–23; code rewritten for the Arc challenge flow |
| Step 3 — Install the Azure extension for SQL Server | edited | claims 24–26 |
| — | added | Step 4 — Turn on Entra authentication for the instance (claim 27); needed for the source's own smoke test |
| Verification checklist | edited | commercial subscription, `oid` check, SQL Server – Azure Arc resource, Entra admin |
| Failure modes | edited | claim 28 |
| Rollback | edited | claims 29–30 |
| Closing italic footer | removed | duplicated the body; canon residue |
| — | added | "Continue the book" callout (R03 ← → R05) |

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | Host prerequisite "a supported Windows Server host" changed to Windows Server 2019 or later, the program's floor from Chapter 07; adds that SQL Server enabled by Azure Arc itself supports Windows Server 2016 and later, and that Windows Server 2016's extended support ends January 12, 2027. New notes `[^r04-sql-os]`, `[^r04-ws2016]` | line 56; notes lines 249, 251 | design-consistency with factual support | <https://learn.microsoft.com/sql/sql-server/azure-arc/prerequisites#supported-configurations>; <https://learn.microsoft.com/lifecycle/products/windows-server-2016> |
