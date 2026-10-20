---
title: "Runbook R04 — Arc Deployment & the Managed Identity"
description: "The runbook for giving an on-premises SQL Server instance its Microsoft Entra identity through Azure Arc: which Azure cloud a GCC-Moderate tenant uses, network and permission prerequisites, certificate-based azcmagent onboarding, validating the Arc managed-identity token through the local identity endpoint, the Azure extension for SQL Server, configuring Entra authentication (managed identity on SQL Server 2025, app registration and certificate on SQL Server 2022), a verification checklist, failure modes and rollback, alongside the program's FMPSqlServerMigration helpers for each step."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 104
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R04 — Arc Deployment & the Managed Identity

*An on-premises SQL Server host has no cloud identity of its own until Azure Arc gives it one, and every Entra login depends on that identity.*

::: {.callout-note}
## In this runbook
The prerequisites (the right Azure cloud for a GCC-Moderate tenant, network paths, roles and Graph permissions), enrolling the host with a certificate-based onboarding service principal, proving the host can mint a managed-identity token, the Azure extension for SQL Server, switching on Microsoft Entra authentication for the instance, a verification checklist, failure modes and the rollback order. Each step names the program function that automates or validates it.
:::

**Pairs with:** [Chapter 09 — What Arc Provides to SQL Server](09-what-arc-provides-to-sql-server.md) and [Chapter 10 — Arc Deployment Sequencing for SQL Server Hosts](10-arc-deployment-sequencing.md). Those chapters explain why the Arc Connected Machine agent's identity replaces AD-anchored service accounts; this runbook is the deployment. The general Arc server procedure (network readiness, the onboarding service principal, the day-one baseline and rollback) is in [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md); this runbook adds what is specific to SQL Server and stays consistent with it.

::: {.callout-important}
## Automation status: shipped, review-required for the mutating step
The program's Arc onboarding and validation helpers are in the `FMPSqlServerMigration` module (`tools/powershell/FMPSqlServerMigration/` in the program's repository). The validation helpers are read-only and run directly. The onboarding wrapper is idempotent and **review-required**: it plans the `azcmagent connect` command by default and executes only with `-Execute` plus confirmation, in a change window. The commands, validation steps and rollback below are the pattern; each step also names the function that automates it, and notes where the function needs correcting.
:::

## Why Arc comes before login migration

An on-premises SQL Server host has no cloud identity of its own. Connecting it to Azure Arc creates a **system-assigned managed identity** for the machine: a service principal in the Microsoft Entra tenant that the subscription trusts, with no secret anyone manages.[^r04-arc-mi-auth] That identity is what lets the instance take part in Entra authentication. No Arc, no machine identity; no machine identity, no Entra login ([Runbook R05](r05-login-migration-and-parallel-run.md)). Arc is a prerequisite, not an enhancement.

::: {.callout-note}
## SQL Server version matters
How the engine uses the Arc identity depends on the version:

- **SQL Server 2025** can use the Arc server's system-assigned managed identity as its *primary managed identity*, both to authenticate inbound Entra logins and for outbound connections to Azure. Only system-assigned identities are supported, on Windows.[^r04-sql-mi]
- **SQL Server 2022** authenticates Entra logins with an **app registration plus a certificate** kept in Azure Key Vault. The Arc machine's managed identity is what downloads that certificate from Key Vault to the host, so it still has to work, but it isn't the identity the engine authenticates logins with.[^r04-sql-2022]

Microsoft's setup guides: [SQL Server 2025 (managed identity)](https://learn.microsoft.com/sql/sql-server/azure-arc/microsoft-entra-authentication-with-managed-identity) and [SQL Server 2022 (app registration)](https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial).
:::

## Prerequisites (GCC-Moderate)

### The right Azure cloud

A GCC-Moderate Microsoft 365 tenant uses Microsoft Entra ID in the public (commercial) cloud, and an Azure Government subscription can't be associated with a directory there.[^r04-gov-identity] The Arc resources for a GCC-Moderate estate therefore live in a **commercial Azure subscription associated with the same tenant**, and the agent connects with `--cloud AzureCloud`. That is also the assumption [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md) makes.

It is the only arrangement that works for this runbook in any case. SQL Server enabled by Azure Arc in the US Government Virginia region supports onboarding, inventory, licensing, failover cluster instances and Extended Security Updates; Microsoft Entra authentication isn't among the available features there,[^r04-sql-usgov] and the managed-identity setup states that SQL Server needs access to the Azure public cloud for Entra authentication.[^r04-sql-mi] An estate whose servers are already onboarded to Azure Government for other reasons needs a second Arc registration plan for its SQL Server hosts, decided by the program before this runbook starts.

### The host and the instance

- A supported Windows Server host running the SQL Server instance from the [Runbook R03](r03-the-authentication-audit.md) audit, with `MigrationTarget` showing SQL Server 2022 or later. Older versions upgrade first.
- Not a failover cluster instance: Microsoft Entra authentication isn't supported on FCIs.[^r04-entra-sql]
- The `NT AUTHORITY\SYSTEM` login must be able to connect to the instance (an enabled login with `CONNECT SQL`), or the Azure extension for SQL Server can't provision.[^r04-sql-prereq] Check this before onboarding on hardened instances that removed the login.
- A TLS certificate the clients trust. Connections authenticated by Entra ID are always encrypted; with a self-signed certificate, clients must set "trust server certificate."[^r04-sql-2022]

### Network

- **The Arc agent** needs outbound TCP 443 to the Arc endpoints; [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md) lists the service tags and the `azcmagent check` pre-flight. If the site uses a proxy, set it for the agent with `azcmagent config set proxy.url`.[^r04-sql-2022]
- **The Azure extension for SQL Server** also needs outbound 443 to the Arc data processing service, `*.<region>.arcdataservices.com`.[^r04-sql-prereq] If the machine has a system-level `HTTPS_PROXY` variable, exclude `localhost` and `127.0.0.1` with `NO_PROXY` so requests to the local Arc identity endpoint aren't sent to the proxy.[^r04-sql-prereq]
- **The Database Engine** contacts Microsoft Entra ID directly for authentication and doesn't use the Arc agent's proxy. Either open the Entra endpoints Microsoft lists for direct access, or set the machine-level WinHTTP proxy (`netsh winhttp set proxy`).[^r04-sql-2022] This path is easy to miss, because the agent shows `Connected` while Entra logins still fail.

### Roles and permissions

- **Onboarding**: a dedicated onboarding service principal that authenticates with a certificate and holds only the Azure Connected Machine Onboarding role on the target resource group, created and handled as [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md) describes.
- **Resource providers** registered in the subscription: `Microsoft.HybridCompute`, `Microsoft.GuestConfiguration`, `Microsoft.HybridConnectivity` and, for SQL Server, `Microsoft.AzureArcData`.[^r04-arc-sp]
- **Configuring Entra authentication for the instance**: the administrator needs Azure Connected Machine Onboarding (or Contributor), Azure Connected Machine Resource Administrator and Reader on the resource group.[^r04-entra-sql]
- **Microsoft Graph permissions for the identity the engine uses**, granted by a Privileged Role Administrator or higher. On SQL Server 2025, assign the `User.Read.All`, `GroupMember.Read.All` and `Application.Read.All` application permissions directly to each machine's managed identity; they can't be granted through group membership.[^r04-sql-mi-setup] On SQL Server 2022, grant the app registration `Directory.Read.All`, or `Application.Read.All`, `Group.Read.All` and `User.Read.All`, with admin consent.[^r04-sql-2022]
- **Clock**: tight time synchronization on the host. Token lifetimes are checked against the clock, and skew shows up as unexplained token failures.

## Step 1 — Enroll the host

::: {.callout-warning}
## Illustrative, not tested against your estate
The commands in this runbook are illustrative. They haven't been tested against a production tenant or SQL Server estate. Review them, run them first on a test host, and connect production hosts only in an approved change window.
:::

```powershell
# Run elevated on the SQL Server host after installing the Connected Machine agent.
# If the site uses a proxy, configure the agent first; azcmagent connect has no proxy flag.
azcmagent config set proxy.url "http://proxy.example.internal:8080"

# Connect with the certificate-based onboarding service principal (Book 05, Chapter 09).
azcmagent connect `
    --service-principal-id "<app-id>" `
    --service-principal-cert "C:\onboarding\sp-arc-onboarding.pem" `
    --tenant-id "<tenant-guid>" `
    --subscription-id "<subscription-guid>" `
    --resource-group "rg-sql-arc" `
    --location "eastus" `
    --cloud "AzureCloud"

azcmagent show          # expect Agent Status: Connected
# Delete the certificate file from the host once the connect completes.

# The Database Engine doesn't use the agent proxy for Entra authentication.
# Set the machine-level WinHTTP proxy only if the engine can't reach Entra ID directly.
netsh winhttp set proxy proxy-server="http://proxy.example.internal:8080"
```

`--cloud` accepts `AzureCloud`, `AzureUSGovernment` and `AzureChinaCloud` and must be used with `--location`; the certificate can be a PFX or PEM file holding both keys (not password-protected), or on Windows a certificate in the machine store by `--service-principal-cert-thumbprint`.[^r04-azcm-connect] Microsoft recommends a certificate over a secret for the onboarding service principal; if a secret is unavoidable, pass it in a configuration file (`--config`) rather than on the command line.[^r04-azcm-connect]

When a server with SQL Server installed connects to Arc, Azure installs the Azure extension for SQL Server automatically and creates the SQL Server resources, unless the machine, resource group or subscription carries the tag `ArcSQLServerExtensionDeployment` with the value `Disabled`.[^r04-autodeploy] Decide before the wave whether you want automatic installation (Step 3).

**Program automation.** `Invoke-FMPArcOnboarding` wraps the connect idempotently. It skips when `Test-FMPArcAgentStatus` (which validates `azcmagent show -j` against the expected cloud and returns a sealed pass or fail record) already reports `Connected`, composes the `azcmagent connect` command from its parameters with no embedded secrets, and emits a sealed onboarding-plan record. It plans only, unless you pass `-Execute` and confirm the `SupportsShouldProcess` prompt. As reviewed for this edition, two things need correcting before you use it to execute: it appends `--proxy-url` when you pass `-ProxyUrl`, but `azcmagent connect` has no such flag (set the proxy with `azcmagent config set proxy.url` instead), and it takes no service-principal parameters, so the command it builds falls back to interactive sign-in.[^r04-azcm-connect] Use its plan output as the reviewable record and run the certificate-based command above.

## Step 2 — Validate the managed-identity token

The Arc agent runs a local identity endpoint, published to processes on the host in the `IDENTITY_ENDPOINT` environment variable as `http://localhost:40342/metadata/identity/oauth2/token`.[^r04-arc-mi-auth] It isn't the Azure VM endpoint at `169.254.169.254`. Getting a token is a two-call challenge: the first request returns `401` with the path of a one-time challenge-token file under `C:\ProgramData\AzureConnectedMachineAgent\Tokens\`, and the caller proves it can read that folder by sending the file's contents in an `Authorization: Basic` header on the second request. Only local Administrators and members of the **Hybrid agent extension applications** group can read the folder.[^r04-arc-identity]

Confirm that the host can mint a token and that its audience is correct. For SQL Server on premises the data-plane audience is `https://database.windows.net/`, the same as in commercial Azure; `https://database.usgovcloudapi.net/` is the audience for Azure SQL in Azure Government, not for an on-premises instance.[^r04-entra-sql]

```powershell
# PowerShell 7, run elevated (local Administrators or Hybrid agent extension applications).
$resource = 'https://database.windows.net/'
$endpoint = '{0}?resource={1}&api-version=2020-06-01' -f $env:IDENTITY_ENDPOINT, [uri]::EscapeDataString($resource)

# Call 1: expect 401 with WWW-Authenticate: Basic realm=<path to the challenge-token file>.
$challenge  = Invoke-WebRequest -Uri $endpoint -Headers @{ Metadata = 'true' } -NoProxy -SkipHttpErrorCheck
$secretFile = ([string]$challenge.Headers['WWW-Authenticate'] -split 'Basic realm=')[1]
$secret     = Get-Content -LiteralPath $secretFile -Raw

# Call 2: present the challenge token and receive the access token.
$resp = Invoke-RestMethod -Uri $endpoint -Headers @{ Metadata = 'true'; Authorization = "Basic $secret" } -NoProxy

# Decode the JWT payload (base64url) and check the claims.
$payload  = $resp.access_token.Split('.')[1].Replace('-', '+').Replace('_', '/')
$payload += '=' * ((4 - $payload.Length % 4) % 4)
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json |
    Select-Object aud, iss, oid, exp
```

The `aud` claim should equal the resource you asked for, `exp` should be in the future, and `oid` should match the `principalId` shown under **Identity** in the Arc machine's JSON view in the Azure portal. Never print or log the token itself. What this proves: the agent's identity endpoint is issuing tokens for the machine identity, which both versions depend on. On SQL Server 2025 the engine requests its own tokens from this same endpoint;[^r04-sql-mi-setup] on SQL Server 2022 the identity fetches the Entra certificate from Key Vault.[^r04-sql-2022] A token for the wrong audience mints without error and is refused where it's used, which is why the audience check matters.

**Program automation.** `Test-FMPArcManagedIdentityToken` decodes a token (claims inspection only, no signature trust), asserts that `aud` matches the cloud-correct SQL data-plane audience and that `exp` is in the future, and returns a sealed pass or fail record. Its default cloud, `AzureCloud`, resolves the right audience for an on-premises instance. As reviewed for this edition, its `-Live` mode queries `169.254.169.254` without the challenge step, which an Arc host doesn't serve; capture the response with the commands above and validate it with `-TokenSnapshotPath` until the function is corrected.

## Step 3 — The Azure extension for SQL Server

The Azure extension for SQL Server on the Arc-enabled host is what surfaces the instance to Azure and carries the Entra configuration to it. If automatic installation (Step 1) didn't deploy it, install it from a management workstation:

```powershell
# Azure CLI with the connectedmachine extension (az extension add --name connectedmachine).
az connectedmachine extension create `
    --machine-name "<arc-machine-name>" `
    --resource-group "rg-sql-arc" `
    --location "eastus" `
    --name "WindowsAgent.SqlServer" `
    --type "WindowsAgent.SqlServer" `
    --publisher "Microsoft.AzureData" `
    --settings '{"SqlManagement":{"IsEnabled":true},"LicenseType":"<PAYG|Paid|LicenseOnly>","ExcludedSqlInstances":[]}'

# Confirm the provisioning state.
az connectedmachine extension show `
    --machine-name "<arc-machine-name>" --resource-group "rg-sql-arc" `
    --name "WindowsAgent.SqlServer" --query provisioningState -o tsv     # expect Succeeded
```

These are the parameters and settings Microsoft documents for installing the extension on a server already connected to Arc; the license type is one of `PAYG`, `Paid` or `LicenseOnly`. Once installed, the extension finds every SQL Server instance on the machine and connects it to Arc, and it keeps detecting new instances.[^r04-connect-sql] A manual installation tags the machine `ArcSQLServerExtensionDeployment = Disabled`.[^r04-connect-sql] Use the latest extension version; the managed-identity setup requires it.[^r04-sql-mi]

**Program automation.** `Test-FMPArcSqlExtension` confirms that the `WindowsAgent.SqlServer` extension's provisioning state is `Succeeded` and reports any Entra-capability flag it finds, returning a sealed pass or fail record. It is read-only and validates either a captured extension document or a live `az connectedmachine extension show` (with `-Live` and `-ResourceGroup`).

## Step 4 — Turn on Entra authentication for the instance

This is a configuration change on the instance; do it in the change window, on one pilot instance first.

- **SQL Server 2025.** On the **SQL Server – Azure Arc** resource, open **Settings**, then **Microsoft Entra ID and Purview**, and select **Use a primary managed identity**. Then grant the machine identity its three Graph permissions (Prerequisites). Microsoft documents a manual registry method as well and warns that it needs extreme caution; prefer the portal.[^r04-sql-mi-setup]
- **SQL Server 2022.** Register an application for the instance, grant its Graph permissions with admin consent, generate the certificate in Azure Key Vault and upload its public key to the app registration, give the Arc machine's identity the **Key Vault Certificate User** and **Key Vault Secrets User** roles on the vault, and then use **Set Admin** on the **Microsoft Entra ID and Purview** page with the customer-managed certificate and app registration. Wait for **Saved successfully** before trying a login. The certificate needs a unique common name on the host.[^r04-sql-2022]

Setting the Entra admin creates the first Entra login, a `sysadmin`, which is how [Runbook R05](r05-login-migration-and-parallel-run.md) creates the rest.

## Verification checklist

- `azcmagent show` reports **Connected**, with a resource ID in the expected commercial subscription and resource group.
- The identity endpoint returns a token whose `aud` is `https://database.windows.net/`, whose `exp` is in the future, and whose `oid` matches the machine's `principalId`.
- The `WindowsAgent.SqlServer` extension shows **Succeeded**, and the instance appears as a **SQL Server – Azure Arc** resource.
- The Entra admin is set, and a test Entra principal can authenticate to the instance over an encrypted connection: the smoke test for [Runbook R05](r05-login-migration-and-parallel-run.md).

## Failure modes

- **Agent egress blocked**: `azcmagent connect` hangs or fails at the registration endpoint. Run `azcmagent check` and confirm the proxy allows the Arc endpoints.
- **Agent connected, Entra logins fail**: usually the engine's own path to Entra ID. The engine doesn't use the agent proxy; open the Entra endpoints or set the WinHTTP proxy.[^r04-sql-2022]
- **Extension won't provision**: check that `NT AUTHORITY\SYSTEM` can connect with `CONNECT SQL`,[^r04-sql-prereq] and read the agent and extension logs. A half-installed extension should be removed and reinstalled, not edited in place.
- **Audience mismatch**: the token mints but is refused at use. Request it again with the correct `resource`.
- **Clock skew**: token `exp` or `nbf` checks fail. Fix time synchronization first.
- **Key Vault access missing (SQL Server 2022)**: the certificate never reaches the host. Check the machine identity's Key Vault roles.[^r04-sql-2022]
- **"Extended call failed" on Save**: the agent processes one configuration change at a time. Wait five minutes and try again.[^r04-sql-2022]
- **The new Entra admin isn't listed in `sys.server_principals`**: the admin change takes effect without a restart, but the view shows the new admin only after the instance restarts. A previous admin that was granted `sysadmin` stays until you drop it.[^r04-sql-2022]

## Rollback

Arc enrollment is reversible, and the order matters ([Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md)):

1. **Remove the extensions**, including the Azure extension for SQL Server, and then the **SQL Server – Azure Arc** resource it created. Uninstalling the agent doesn't remove extensions, and leftover extensions aren't recognized if the server reconnects.[^r04-uninstall]

   ```powershell
   az connectedmachine extension delete --machine-name "<arc-machine-name>" --resource-group "rg-sql-arc" `
       --name "WindowsAgent.SqlServer" --publisher "Microsoft.AzureData"
   az resource delete --resource-group "rg-sql-arc" `
       --resource-type Microsoft.AzureArcData/SqlServerInstances --name "<full SQL instance name>"
   ```

   These are the commands Microsoft documents for disconnecting SQL Server instances from Arc.[^r04-sql-disconnect]
2. **Disconnect.** `azcmagent disconnect` deletes the Arc resource in Azure and resets the local agent. It needs an Azure account, from the same tenant as the subscription, that has permission to delete the resource; the onboarding role can't, so [Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md) uses the Azure Connected Machine Resource Administrator role. If the resource is already gone, `azcmagent disconnect --force-local-only` cleans up the local state.[^r04-azcm-disconnect][^r04-uninstall] Disconnecting also deletes the machine's managed identity; reconnecting creates a new identity and credential,[^r04-arc-identity] so Graph permissions and Key Vault access granted to the old identity must be granted again.
3. **Uninstall the agent** if the server is leaving Arc altogether.

Before Step 4, nothing in SQL Server depends on the machine identity, so rolling back has no effect on existing Windows-authenticated connections. After Step 4, treat Entra authentication as a one-way change on SQL Server 2025: Microsoft advises against disabling it once it's enabled, and forcing it off by deleting registry entries can cause unpredictable behavior.[^r04-sql-mi] Prove the pattern on a pilot instance before turning it on across a wave.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R03 — The Authentication Audit](r03-the-authentication-audit.md) · [Book index](index.md) · [Next: Runbook R05 — Login Migration & Parallel-Run Validation →](r05-login-migration-and-parallel-run.md)
:::

[^r04-arc-mi-auth]: Microsoft Learn, "Access Azure resources by using managed identity on Azure Arc-enabled servers," <https://learn.microsoft.com/azure/azure-arc/servers/managed-identity-authentication> (accessed Oct 20, 2026).

[^r04-sql-mi]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc," overview and limitations, <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Oct 20, 2026).

[^r04-sql-2022]: Microsoft Learn, "Tutorial: Set up Microsoft Entra authentication for SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> (accessed Oct 20, 2026).

[^r04-gov-identity]: Microsoft Learn, "Planning identity for Azure Government applications," frequently asked questions, <https://learn.microsoft.com/azure/azure-government/documentation-government-plan-identity#frequently-asked-questions> (accessed Oct 20, 2026).

[^r04-sql-usgov]: Microsoft Learn, "SQL Server enabled by Azure Arc in US Government," available features, <https://learn.microsoft.com/sql/sql-server/azure-arc/us-government-region> (accessed Oct 20, 2026).

[^r04-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server," access token and remarks, <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).

[^r04-sql-prereq]: Microsoft Learn, "Prerequisites - SQL Server enabled by Azure Arc," before you deploy, <https://learn.microsoft.com/sql/sql-server/azure-arc/prerequisites> (accessed Oct 20, 2026).

[^r04-arc-sp]: Microsoft Learn, "Connect hybrid machines to Azure at scale," prerequisites, <https://learn.microsoft.com/azure/azure-arc/servers/onboard-service-principal> (accessed Oct 20, 2026).

[^r04-sql-mi-setup]: Microsoft Learn, "Set up managed identity and Microsoft Entra authentication for SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/microsoft-entra-authentication-with-managed-identity> (accessed Oct 20, 2026).

[^r04-azcm-connect]: Microsoft Learn, "`azcmagent connect`," <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-connect> (accessed Oct 20, 2026).

[^r04-autodeploy]: Microsoft Learn, "Manage automatic connection for SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/manage-autodeploy> (accessed Oct 20, 2026).

[^r04-arc-identity]: Microsoft Learn, "Identity and authorization" (Azure Arc-enabled servers security), Microsoft Entra ID managed identity, <https://learn.microsoft.com/azure/azure-arc/servers/security-identity-authorization#microsoft-entra-id-managed-identity> (accessed Oct 20, 2026).

[^r04-connect-sql]: Microsoft Learn, "Connect your SQL Server to Azure Arc on a server already enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/connect-already-enabled> (accessed Oct 20, 2026).

[^r04-uninstall]: Microsoft Learn, "Uninstall the Azure Connected Machine agent from Arc-enabled servers," <https://learn.microsoft.com/azure/azure-arc/servers/uninstall-agent> (accessed Oct 20, 2026).

[^r04-azcm-disconnect]: Microsoft Learn, "`azcmagent disconnect`," <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-disconnect> (accessed Oct 20, 2026).

[^r04-sql-disconnect]: Microsoft Learn, "Disconnect SQL Server instances from Azure Arc," uninstall Azure Extension for SQL Server, <https://learn.microsoft.com/sql/sql-server/azure-arc/delete-from-azure-arc> (accessed Oct 20, 2026).
