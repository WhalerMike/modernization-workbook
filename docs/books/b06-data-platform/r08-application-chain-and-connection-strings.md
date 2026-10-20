---
title: "Runbook R08 — The Application Chain & Connection-String Migration"
description: "How to complete the authentication chain upstream of SQL Server: inventory the LDAP-bind dependency with the program's read-only audit, correlate and classify each SQL-consuming application by the four-class taxonomy, then run the review-required connection-string change that removes the stored credential."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 108
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R08 — The Application Chain & Connection-String Migration

*An application that signs its users in with Entra ID but reaches the database with a stored password has moved its front door and left the back door where it was.*

::: {.callout-note}
## In this runbook
The runbook for the SQL-connection track of every SQL-consuming application. Phase 1 inventories the accounts that bind to Active Directory over LDAP, then correlates them to the SQL Server instance audit and classifies each application into one of four classes. Phase 2 is the connection-string change that replaces a Windows or SQL Authentication credential with a Microsoft Entra authentication mode, gated by three conditions and made in a change window.
:::

**Pairs with:** [Chapter 18 — The Four-Class Pattern Applied to SQL-Consuming Applications](18-the-four-class-pattern-for-applications.md) and [Chapter 19 — Connection String Migration: The Last Mile](19-connection-string-migration.md). Those chapters explain why an application that migrated its user sign-in to Entra ID but still reaches SQL Server with a stored service-account credential hasn't finished. The LDAP-bind inventory is read-only and script-backed. The connection-string change touches production and is review-required: tested against a production-equivalent stack first, then cut over through change control.

## The chain has two tracks

Every SQL-consuming application carries two independent migration tracks: the **user-authentication** track (how the user proves identity to the application) and the **SQL-connection** track (how the application proves identity to the database). This runbook is the SQL-connection track, the last mile, together with the application classification that decides how it is sequenced.

## Phase 1 — Inventory the LDAP-bind dependency (read-only, script-backed)

### `Spec3-D1.9-Get-LDAPBindAccountInventory.ps1`

This program discovery script finds the accounts performing LDAP binds against Active Directory, the hidden dependency layer that SPN-based discovery can't see. It is read-only.

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `-OutputPath` | string | `.\output` | JSON and CSV output directory |
| `-DomainController` | string | — | Target a specific domain controller for event-log queries; auto-discovery if omitted |
| `-SearchBase` | string | — | Optional Active Directory search base (DN) |
| `-D1InputFile` | string | — | A service-account scan JSON (the program's planned Spec3-D1.1), for cross-reference and enrichment |
| `-EventLogHours` | int | `168` | Hours of event-log history to analyze (7 days) |
| `-IncludeDCLogs` | switch | off | Query domain controller event logs for LDAP bind evidence (Event ID 4624 with logon type 8 in the Security log; Event IDs 2887 and 2889 in the Directory Service log) |

Two corrections to the source's parameter table, from the script itself. It listed a `-FirewallLogPath` parameter for firewall or NetFlow discovery against domain controller ports 389, 636, 3268 and 3269; the script's help text describes that method, but it has no such parameter and no implementation, so network-flow analysis is a manual step for now. And the Spec3-D1.1 service-account scan that `-D1InputFile` expects isn't among the program's published discovery scripts; supply a file of the shape the script reads, or omit the parameter.

The event IDs and ports carry specific meanings, and two corrections apply to the source's description of them (the script itself reads the right logs):

- **Event ID 4624 with logon type 8** (NetworkCleartext) in the Security log records a logon with a clear-text password, which is what an LDAP simple bind produces; Microsoft Defender for Identity reports logon type 8 as "LDAP Cleartext" (simple authentication).[^r08-logon-types][^r08-identity-logon]
- **Event IDs 2887 and 2889** are in the **Directory Service** log, not the Security log. Event 2887 is a once-a-day summary of unsigned SASL binds and clear-text simple binds the domain controller permitted. Event 2889 records each such bind with the client's IP address and the identity used, and it appears only after the *16 LDAP Interface Events* diagnostic setting is raised to 2 (Basic).[^r08-ldap-signing] The source labeled 2887 "signing stats" and 2889 "unsigned bind"; that's close, but 2889 covers clear-text simple binds as well as unsigned SASL binds. New Windows Server 2025 deployments require LDAP signing by default.[^r08-ldap-signing]
- **Ports**: 389 is LDAP, 636 is LDAP over TLS (LDAPS), and 3268 and 3269 are the global catalog and its TLS-protected port.[^r08-ports]

**Discovery methods.** The script combines account-attribute heuristics (password never expires and no SPN; name or description patterns such as `ldap`, `bind`, `svc`, `app` and `connector`; service-account OUs with no computer object), the domain controller event logs above, optional NetFlow or firewall parsing, and optional domain controller LDAP diagnostic logging, cross-referenced against the D1.1 service-account scan when one is supplied. NetFlow parsing is described in the script's help but not implemented (see above).

### Output schema

Under `-OutputPath` the script writes a `*_LDAPBindAccountInventory*.json` (a `Summary` plus the account array) and `*_accounts.csv`. Each account record carries `SamAccountName`, `DistinguishedName`, `DisplayName`, `Description`, `Enabled`, `PasswordNeverExpires`, `PasswordAgeDays`, `DaysSinceLogon`, `DiscoveryMethod`, **`LDAPBindConfidence`** (0–100), **`RiskClassification`** (Critical, High, Medium or Low), **`BindType`** (Simple, SASL or Anonymous; clear text or unsigned where event logs are available), `BindSecurity`, `SourceApplication`, **`MigrationTarget`** and `RemediationPriority`. The `MigrationTarget` points toward the program's workload-identity destinations (API-driven provisioning through Microsoft Graph, a managed identity or a service principal), the same end state the SQL-connection track lands on.

::: {.callout-warning}
## Illustrative, not tested against production
The commands, connection strings and code on this page are illustrative. They haven't been tested against a production forest, tenant or instance. The discovery script and the `FMP*` function are the program's own tooling; their parameters are documented here as the program defines them. Review everything, and run it first in a non-production environment.
:::

```powershell
# Read-only LDAP-bind inventory: heuristics plus domain controller event logs over 30 days
./Spec3-D1.9-Get-LDAPBindAccountInventory.ps1 -IncludeDCLogs -EventLogHours 720 -OutputPath .\output
# Enriched with the service-account scan
./Spec3-D1.9-Get-LDAPBindAccountInventory.ps1 -D1InputFile .\output\service-account-scan.json -OutputPath .\output
```

The event-log pass finds per-client binds only if diagnostic logging was raised before the window you query; historical binds aren't logged retroactively. Plan the 30-day window to start after the setting is changed, and set it back to 0 afterward, as Microsoft advises, to avoid a performance cost.[^r08-ldap-signing]

### What D1.9 does and doesn't give you

D1.9 inventories the **LDAP-bind accounts** with their risk and their Graph-migration target. It does **not** record which SQL Server instance or database each application connects to, and it doesn't assign an application class. Both need correlation with the Spec3-D1.8 instance audit from [Runbook R03](r03-the-authentication-audit.md) and with per-application modernization signals (SAML metadata URLs, OIDC discovery endpoints, vendor documentation).

**`New-FMPAppConnectionPlan`**, in the program's `FMPSqlServerMigration` module, is the correlation-and-classification pass. It joins the D1.9 bind-account inventory to the Spec3-D1.8 instance audit, matching each bind account to the SQL Server login it maps to so the plan names the exact `correlated_sql_instances`. It then assigns each application a class, preferring the cleanest end state (OIDC, then SAML, then Application Proxy, then Domain Services), from a supplied `-CapabilityMap` of observable signals (`oidc`, `saml`, `reverse_proxy`, `vendor_locked`), falling back to the D1.9 `MigrationTarget`. For any application correlated to a SQL Server login it emits the connection-string transformation that removes the stored credential. Applications with no capability signal and no `MigrationTarget` land in `review` rather than being mis-classified.

```powershell
Import-Module FMPSqlServerMigration
New-FMPAppConnectionPlan `
    -LdapBindInventoryPath .\output\*LDAPBindAccountInventory*.json `
    -AuthAuditPath         .\output\sqlserver-auth-audit.json `
    -CapabilityMap         .\config\app-capabilities.json `
    -OutputPath            .\output\app-connection-plan.json
```

It is **read-only derivation**. Every record is marked `mutating` and `requires_review`, and the function changes nothing; the connection-string change itself (Phase 2) stays the gated, in-configuration step below.

## The four-class triage

[Chapter 18](18-the-four-class-pattern-for-applications.md) classifies each SQL-consuming application into one of four classes, in strict preference order (the program's LDAP-dependent-application migration plan). The SQL-connection track is the same for the first three classes; the user-authentication track differs.

| Class | User-authentication track | SQL-connection track | Note |
|---|---|---|---|
| **Class 3 — OIDC** (preferred) | Entra ID as the OpenID Connect identity provider; full LDAP elimination | Managed identity or service principal | Target architecture: no Active Directory, no LDAP, no stored secret |
| **Class 2 — SAML** | Entra ID as the SAML identity provider | Managed identity or service principal | Eliminates LDAP; ranks below OIDC |
| **Class 1 — Application Proxy** | Microsoft Entra application proxy fronts the application, with no code change | Managed identity or service principal | Can't modernize the application's own authentication |
| **Class 4 — Entra Domain Services** (last resort) | A managed, Active Directory-compatible domain | **Blocked**; preserves the Active Directory protocol dependency | The host instance carries a documented exception with a sunset date |

Microsoft Entra application proxy publishes on-premises web applications for remote users after Entra sign-in, without changes to the application; for integrated Windows authentication its connector uses Kerberos constrained delegation to the back end.[^r08-app-proxy] Microsoft Entra Domain Services provides a managed domain with LDAP, Kerberos and NTLM, for legacy applications that can't use modern authentication.[^r08-entra-ds] That last point is why Class 4 blocks the SQL-connection track: the managed domain keeps Kerberos and NTLM in the chain.

The two tracks are independent and can be sequenced separately, but **both** must complete before the application's part of the transformation is done. A Class 4 application on an instance forces that instance to keep accepting Windows Authentication, which blocks the Entra-exclusive closure posture defined in [Chapter 20](20-the-closure-condition.md). Each such instance needs an exception with a sunset date reconciled against the program's 2027-04-01 NTLM backstop ([Runbook R09](r09-continuous-monitoring-and-closure.md)).

## Phase 2 — Connection-string migration (review-required, the last mile)

::: {.callout-warning}
## The simplest change, the most gated
Technically the connection-string change is one keyword; operationally it's the most gate-controlled step in the program. `New-FMPAppConnectionPlan` emits the per-application *plan* (which application, which instances, which target keyword), but the change itself is made in **application configuration** by deliberate choice. No script rewrites a production connection string. Three gate conditions must hold first, and the cutover runs in a change window.
:::

### The change

The stored credential disappears. Windows integrated security or SQL Authentication becomes a Microsoft Entra authentication mode:

```text
# Before: the credential is invisible to the identity plane
Data Source=sqlhost.contoso.gov;Initial Catalog=AppDb;Integrated Security=True
Data Source=sqlhost.contoso.gov;Initial Catalog=AppDb;User ID=svc-app;Password=<stored>

# After: no stored secret on the host
Data Source=sqlhost.contoso.gov;Initial Catalog=AppDb;Encrypt=True;Authentication=Active Directory Managed Identity
# Service principal: User ID = client ID; the client secret comes from a Key Vault reference, never inline
Data Source=sqlhost.contoso.gov;Initial Catalog=AppDb;Encrypt=True;Authentication=Active Directory Service Principal;User ID=<client-id>;Password=<from Key Vault>
Data Source=sqlhost.contoso.gov;Initial Catalog=AppDb;Encrypt=True;Authentication=Active Directory Default
```

Four facts about these modes, from Microsoft's `Microsoft.Data.SqlClient` documentation, correct or qualify the source:[^r08-sqlclient]

- **Versions.** `Active Directory Service Principal` first shipped in SqlClient 2.0, `Active Directory Managed Identity` in 2.1, and `Active Directory Default` in **3.0**. The source said Default arrived in 2.0. From SqlClient 7.0, the driver-provided `Active Directory ...` modes also need the `Microsoft.Data.SqlClient.Extensions.Azure` package at a matching version.
- **Production preference.** The source called `Active Directory Default` "preferred for new configurations." Microsoft's guidance is narrower: Default tries credential providers in sequence, which can slow the first connection, and the identity it selects can change when host configuration changes, so Microsoft recommends a *specific* mode in production, such as `Active Directory Managed Identity`. The program follows that: Managed Identity (or Service Principal) in production configuration; Default only where one configuration must also run on developer machines.
- **Service principal credential.** The built-in Service Principal mode takes the client ID as `User ID` and a **client secret** as `Password`. A certificate credential needs a token callback instead. Either way the secret comes from protected configuration such as a Key Vault reference, not from the connection string in source.
- **Encryption.** Setting `Authentication` turns on encryption and server-certificate validation by default, and every Entra-authenticated connection to SQL Server requires an encrypted connection.[^r08-entra-setup] A server certificate the client doesn't trust fails the connection; that dependency on the instance's TLS certificate is the subject of [Runbook R10](r10-certificate-discovery-for-adcs.md).

For an application on an Arc-enabled host, `Authentication=Active Directory Managed Identity` makes the driver request a token for the machine's system-assigned managed identity from the local Hybrid Instance Metadata Service (HIMDS) endpoint, `http://localhost:40342`, instead of negotiating a Windows credential.[^r08-arc-mi][^r08-arc-agent] The source called this endpoint IMDS; on Arc it's the agent's HIMDS service, with one extra step: the caller has to read a challenge token from a protected folder, so the application's process identity must be a local administrator or a member of the **Hybrid agent extension applications** group.[^r08-arc-identity] Arc-enabled servers have a system-assigned identity only,[^r08-arc-mi] so every application on the host that uses it authenticates to SQL Server as the same principal. Give each application its own service principal where the database grants differ.

### The three gate conditions

All three must hold before cutover:

1. The Entra **login already exists** on the target instance: the `FROM EXTERNAL PROVIDER` login from [Runbook R05](r05-login-migration-and-parallel-run.md), or the group login from [Runbook R07](r07-groups-aus-and-the-conditional-access-perimeter.md). A connection string naming an Entra identity with no corresponding login fails at connection time.
2. The application's managed identity or service principal **holds the appropriate database role**, so authentication succeeds and authorization follows. Obtaining a token doesn't grant database permissions.[^r08-sqlclient] On an Arc host, the application's process identity must also be allowed to request the machine's token (gate 2 includes the group membership above).
3. The change has been **tested in a non-production environment whose Arc and SQL Server extension configuration matches production**, including a server certificate the client trusts. Token acquisition and validation depend on that infrastructure. A change that works against a laptop but was never exercised against a production-equivalent Arc and extension stack isn't a tested change.

### `DefaultAzureCredential` for .NET

For .NET applications, the `Azure.Identity` library's `DefaultAzureCredential` tries an ordered chain of credentials. The source gave the order as managed identity first, then Azure CLI, Visual Studio and environment variables. Microsoft's current order is the reverse at the top: **environment** credentials first, then **workload identity**, then **managed identity**, then developer-tool credentials such as Visual Studio and the Azure CLI; the interactive browser credential is excluded by default.[^r08-dac] The design point survives the correction. One credential code path can run on the Arc-enabled host (managed identity) and on a developer's machine (Azure CLI), and `Authentication=Active Directory Default` in SqlClient 3.0 and later delegates to the same chain, realizing the program's workload-identity model. For production, the cautions above apply: a specific credential, such as `ManagedIdentityCredential`, removes the discovery delay and the risk that an environment variable silently selects a different identity.[^r08-sqlclient][^r08-dac]

```csharp
// Explicit form when the Authentication keyword can't be used
using Azure.Core;
using Azure.Identity;
using Microsoft.Data.SqlClient;

var credential = new DefaultAzureCredential();   // production: prefer new ManagedIdentityCredential(...)
AccessToken token = credential.GetToken(
    new TokenRequestContext(new[] { "https://database.windows.net/.default" }));

using var conn = new SqlConnection("Data Source=sqlhost.contoso.gov;Initial Catalog=AppDb;Encrypt=True");
conn.AccessToken = token.Token;
conn.Open();
```

The **data-plane audience** matters, and the source had it wrong. It used `https://database.usgovcloudapi.net/` and labeled it the GCC audience. Microsoft documents the audience for a token presented to SQL Server's Entra authentication as `https://database.windows.net/`,[^r08-entra-sql] and a Microsoft 365 GCC tenant's Entra ID runs in the worldwide cloud, so GCC uses the worldwide endpoints.[^r08-graph-clouds] The Azure Government audience applies to tenants in GCC High or DoD, which are outside this book's scope. As [Runbook R04](r04-arc-deployment-and-managed-identity.md) notes for managed identity tokens, a token for the management plane is refused by the SQL data plane. One more caution from Microsoft: a token supplied through `AccessToken` can't be renewed by the driver and becomes part of the connection-pool key, so pooled applications should use `AccessTokenCallback` (SqlClient 5.2 and later) instead.[^r08-sqlclient]

## Verification and rollback

- **Verify** the application now connects as its Entra principal and no longer over Windows Authentication. The `sys.dm_exec_connections` and `sys.dm_exec_sessions` join that [Runbook R05](r05-login-migration-and-parallel-run.md) uses for the parallel-run window shows `login_name` and `auth_scheme` for each session. Confirm the application's sessions log in under the Entra login and that **no** `NTLM` or `KERBEROS` rows remain for it.[^r08-auth-scheme] Microsoft documents `auth_scheme` as the SQL Server or Windows authentication scheme for the connection but doesn't list the value it shows for an Entra connection; the source's `auth_scheme = AAD` should be confirmed in the pilot before it's used as a test.
- **Rollback** is the prior connection string. Keep the previous configuration and, as Runbook R05 does, keep the legacy login *disabled, not dropped*, so reverting is immediate. Cut over only after the gate conditions are met and the parallel observation is clean.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R07 — Groups, Administrative Units & the Conditional Access Perimeter](r07-groups-aus-and-the-conditional-access-perimeter.md) · [Book index](index.md) · [Next: Runbook R09 — Continuous Monitoring & the CCM-BIR Closure Record →](r09-continuous-monitoring-and-closure.md)
:::

[^r08-logon-types]: Microsoft Learn, "Administrative tools and logon types" (logon type 8, NetworkCleartext, accepts a password), <https://learn.microsoft.com/windows-server/identity/securing-privileged-access/reference-tools-logon-types> (accessed Oct 20, 2026).
[^r08-identity-logon]: Microsoft Learn, "IdentityLogonEvents" (advanced hunting schema), section "Supported logon types" (logon type 8: LDAP Cleartext), <https://learn.microsoft.com/defender-xdr/advanced-hunting-identitylogonevents-table> (accessed Oct 20, 2026).
[^r08-ldap-signing]: Microsoft Learn, "LDAP signing overview for Active Directory Domain Services," section "LDAP signing event monitoring" (Event IDs 2886–2889 in the Directory Service log; 2889 requires *16 LDAP Interface Events* set to 2; Windows Server 2025 requires signing by default for new deployments), <https://learn.microsoft.com/windows-server/identity/ad-ds/ldap-signing> (accessed Oct 20, 2026).
[^r08-ports]: Microsoft Learn, "Service overview and network port requirements for Windows," section "System services ports" (LDAP 389, LDAP SSL 636, Global Catalog 3268 and 3269), <https://learn.microsoft.com/troubleshoot/windows-server/networking/service-overview-and-network-port-requirements> (accessed Oct 20, 2026).
[^r08-app-proxy]: Microsoft Learn, "Microsoft Entra application proxy," <https://learn.microsoft.com/entra/identity/app-proxy/overview-what-is-app-proxy> (accessed Oct 20, 2026).
[^r08-entra-ds]: Microsoft Learn, "What is Microsoft Entra Domain Services?," <https://learn.microsoft.com/entra/identity/domain-services/overview> (accessed Oct 20, 2026).
[^r08-sqlclient]: Microsoft Learn, "Microsoft Entra authentication with Microsoft.Data.SqlClient" (authentication modes and first supported releases; the Azure extension package from 7.0; production guidance for Active Directory Default; service principal secret; AccessToken and AccessTokenCallback), <https://learn.microsoft.com/sql/connect/ado-net/sql/azure-active-directory-authentication> (accessed Oct 20, 2026).
[^r08-entra-setup]: Microsoft Learn, "Tutorial: Set up Microsoft Entra authentication for SQL Server with app registration," section "Create logins and users" (all connections that use Microsoft Entra authentication require an encrypted connection), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-setup-tutorial> (accessed Oct 20, 2026).
[^r08-arc-mi]: Microsoft Learn, "Access Azure resources by using managed identity on Azure Arc-enabled servers" (system-assigned identity; Administrators or Hybrid Agent Extension Applications group), <https://learn.microsoft.com/azure/azure-arc/servers/managed-identity-authentication> (accessed Oct 20, 2026).
[^r08-arc-agent]: Microsoft Learn, "Azure extension for SQL Server system objects," section "Windows Services" (`himds`, the Azure Hybrid Instance Metadata Service, hosts the local API for managed identity tokens), <https://learn.microsoft.com/sql/sql-server/azure-arc/agent-extension-files> (accessed Oct 20, 2026).
[^r08-arc-identity]: Microsoft Learn, "Identity and authorization" for Azure Arc-enabled servers, section "Microsoft Entra ID managed identity" (requests to `http://localhost:40342/identity`; challenge token; Hybrid agent extension applications group), <https://learn.microsoft.com/azure/azure-arc/servers/security-identity-authorization> (accessed Oct 20, 2026).
[^r08-dac]: Microsoft Learn, "Credential chains in the Azure Identity library for .NET," section "DefaultAzureCredential overview" (order: Environment, Workload Identity, Managed Identity, then developer tools; InteractiveBrowserCredential excluded by default), <https://learn.microsoft.com/dotnet/azure/sdk/authentication/credential-chains> (accessed Oct 20, 2026).
[^r08-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server," section "Access token" (the audience must be `https://database.windows.net/`), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).
[^r08-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments" (a Microsoft 365 GCC environment continues to use the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (accessed Oct 20, 2026).
[^r08-auth-scheme]: Microsoft Learn, "sys.dm_exec_connections (Transact-SQL)" (`auth_scheme`: "Specifies SQL Server/Windows Authentication scheme used with this connection"), <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-exec-connections-transact-sql> (accessed Oct 20, 2026).
