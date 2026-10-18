---
title: "What Arc Provides to SQL Server"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "04"
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 1 — What Arc Provides to SQL Server

*Arc is not an end state — it is the bridge that gives the SQL Server engine a cloud-native identity.*

::: {.callout-note}
## In this chapter
What the Connected Machine agent and its managed identity establish; which Entra identity the instance uses on SQL Server 2022 and 2025; the two-layer distinction between SQL-engine Entra authentication and OS-level Entra login; why Arc's managed identity beats a gMSA, a vaulted secret, or certificate-based authentication; and what Arc deliberately does not change.[^b04c01-gmsa][^b04c01-arc-servers][^b04c01-arc-mi-endpoint]
:::

![What installing Arc changes, and what it deliberately doesn't.](../../images/sql-server/diagrams/svg/book-04-ch01-what-arc-changes.svg){fig-alt="Arc provides an Azure Resource Manager resource for the server and a system-assigned managed identity served by the local agent; it doesn't change how Windows-integrated connections authenticate or convert any existing login."}

Arc is usually introduced as a management capability: on-premises servers in the Azure portal, under Azure Policy and Azure Resource Manager. For this transformation it matters more because it gives the server, and through it the SQL Server engine, a cloud-native identity. Without that identity the engine cannot authenticate to Key Vault, forward logs to Azure Monitor, or accept Entra ID tokens from clients. Arc is the enablement layer for everything that follows.

## The Arc Agent and the ARM Resource Identity

Installing the Azure Connected Machine agent gives the server a first-class ARM resource of type `Microsoft.HybridCompute/machines`, with a resource ID, subscription, and resource group. That resource makes the server visible in the portal and addressable by Azure Policy and ARM, and it is the basis for the **system-assigned managed identity**: an Entra ID service principal created at registration and deleted at deregistration.

The identity's private key sits in the Arc agent's local certificate store, is rotated automatically every 90 days, and is never seen by an administrator. A process requests a token from the agent's local identity endpoint, the Hybrid Instance Metadata Service (HIMDS) at `http://localhost:40342/metadata/identity/oauth2/token` (not the Azure VM address `169.254.169.254`), and the agent returns a token for any Azure resource the identity has been granted. The endpoint first issues a challenge that only members of the local Administrators or Hybrid Agent Extension Applications group can complete, so not every process on the host can obtain a token.

## The Two-Layer Distinction

Arc enables two architecturally independent Entra ID capabilities for SQL Server. Confusing them is the most common sequencing error in this transformation.

**Layer 1 is SQL Server engine Entra authentication**, the subject of this series. With the Azure extension for SQL Server on an Arc-enabled server running SQL Server 2022 or later, the engine accepts Entra ID OAuth 2.0 access tokens for `CREATE LOGIN ... FROM EXTERNAL PROVIDER` logins and validates them against Entra ID.[^b04c01-arc-sql][^b04c01-entra-sql][^b04c01-create-login] It needs the registered Arc agent, SQL Server 2022 or later, the Azure extension for SQL Server, and Entra authentication configured on the instance (Chapter 2). It does not need domain unjoin or Windows Server 2025: a domain-joined Windows Server 2019 host running SQL Server 2022 is fully capable of Layer 1 today.

**Layer 2 is OS-level Entra login** through the AADLoginForWindows extension, which lets administrators RDP with Entra credentials.[^b04c01-arc-entra-login] It belongs to the server infrastructure transformation, requires domain unjoin and Windows Server 2025 with Desktop Experience, and is more disruptive: unjoin affects every AD-dependent service on the host, plus DNS, Group Policy, and certificate enrollment.

::: {.callout-important}
Do not block Layer 1 on domain unjoin, a Layer 2 prerequisite. Layer 1 proceeds on domain-joined servers and should finish before Layer 2 begins. Say this explicitly to every DBA and infrastructure team; incorrect sequencing assumptions are the most common cause of unnecessary delay.
:::

## The Managed Identity and the Service Account

![Where an Arc-enabled instance's Entra identity comes from in SQL Server 2022 and in SQL Server 2025.](../../images/sql-server/diagrams/svg/book-04-ch01-instance-identity-2022-vs-2025.svg){fig-alt="SQL Server 2022 uses an Entra app registration with a certificate stored in Azure Key Vault, for inbound authentication only; SQL Server 2025 uses the Arc server's system-assigned managed identity for inbound and outbound, which needs Microsoft Graph read permissions granted by a Privileged Role Administrator."}

What the instance uses as its Entra identity depends on the version. On SQL Server 2025, the server's system-assigned managed identity is set as the instance's primary managed identity and serves both inbound Entra authentication and outbound connections to Azure services such as backup to URL and Azure Key Vault.[^b04c01-mi-2025] On SQL Server 2022, the instance uses an Entra app registration whose certificate is kept in Azure Key Vault; the Arc agent retrieves that certificate with the server's managed identity and installs it on the host.[^b04c01-appreg-2022] An app registration covers inbound Entra authentication only and cannot make outbound connections.

On both versions, agent-side work (retrieving certificates from Key Vault, log forwarding through the Azure Monitor agent, the extension's own operations) authenticates with the server's managed identity, not stored credentials.

None of this replaces the Windows account the service runs as (`NT SERVICE\MSSQLSERVER`, a gMSA, or a domain account), which still presents the computer or domain identity for Windows networking on a domain-joined host. What changes is the identity Entra ID and Azure see: the managed identity (2025) or the app registration (2022) instead of an AD service account. On SQL Server 2025 there is no credential to manage; on 2022 the one credential is the app registration's Key Vault certificate, which needs a named renewal owner and, per Microsoft, a validity of at most 12 months.

## Why Arc and Not the Alternatives

Every alternative either re-anchors on the directory the program is retiring or reintroduces the stored credential it exists to eliminate.

- **A gMSA or domain service account** works only while AD is authoritative. Book 01's third driver removes AD as the authority for this boundary; a gMSA can stay the Windows logon account while the domain exists, but it cannot be the engine's Entra identity.
- **A service principal with a client secret**, on disk or in Key Vault, reintroduces a rotatable credential and a bootstrap problem: the engine must authenticate *to* the vault first, so a root credential lands on the server anyway.
- **Certificate-based authentication** is the program's *interim* posture, authorized for the pre-2022 exception long tail that cannot reach Kerberos or Entra OAuth before the 2027-04-01 block. It still needs certificate lifecycle management, hence the ADCS-to-Microsoft Cloud PKI dependency the transformation inventory still classifies as "Not Yet Defined." It is a bridge, not a destination.[^b04c01-cloudpki]

The Arc managed identity is the only option that is both cloud-native and credential-free for the operator: its certificate rotates automatically, no human sees it, and its lifecycle is bound to the ARM resource rather than to AD. SQL Server 2025 uses it directly. SQL Server 2022 still authenticates through an app registration certificate, but the Arc agent fetches it from Key Vault with the managed identity, so no root credential is placed on the server by hand.

## What Arc Does Not Do

Arc's effect is often overstated in both directions. A domain-joined client using `Integrated Security=True` against an Arc-enabled instance still negotiates Kerberos or NTLM exactly as described in Book 01, and Arc alone produces no Entra sign-in events for SQL Server connections. Arc converts no login to the External Provider type, disables neither Windows Authentication nor Mixed Mode,[^b04c01-auth-mode] and leaves SPN registration untouched. It provides the capability without activating it; the login migration in Book 05 is what changes authentication behavior. Arc is a necessary prerequisite, not the transformation itself.

::: {.callout-note title="What Book 04 establishes — Chapter 1"}
1. Arc gives the server an ARM identity and a system-assigned managed identity whose tokens come from the local endpoint (`localhost:40342`); the instance's Entra identity is an app registration and Key Vault certificate on SQL Server 2022 and the managed identity on SQL Server 2025.
2. Layer 1 (SQL-engine Entra authentication) is independent of Layer 2 (OS-level Entra login) and must never be blocked on it.
3. Arc provides the capability but doesn't activate it, and it doesn't replace the Windows account the service runs as; of the alternatives, it is the only one both credential-free and independent of AD.
:::

[^b04c01-arc-mi-endpoint]: Microsoft Learn, [Access Azure resources with managed identity on Azure Arc-enabled servers](https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication).
[^b04c01-arc-servers]: Microsoft Learn, [Azure Arc-enabled servers overview](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview).
[^b04c01-gmsa]: Microsoft Learn, [Group Managed Service Accounts overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview).
[^b04c01-entra-sql]: Microsoft Learn, [Microsoft Entra authentication for SQL Server overview](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview?view=sql-server-ver17).
[^b04c01-arc-sql]: Microsoft Learn, [Overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17).
[^b04c01-create-login]: Microsoft Learn, [CREATE LOGIN (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver17).
[^b04c01-arc-entra-login]: Microsoft Learn, [Sign in to an Azure Arc-enabled server using Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/devices/howto-arc-sign-in-windows).
[^b04c01-appreg-2022]: Microsoft Learn, [Set up Microsoft Entra authentication with app registration — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/entra-authentication-setup-tutorial?view=sql-server-ver17).
[^b04c01-mi-2025]: Microsoft Learn, [Managed identity overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17).
[^b04c01-cloudpki]: Microsoft Learn, [Microsoft Cloud PKI for Microsoft Intune](https://learn.microsoft.com/en-us/intune/intune-service/protect/microsoft-cloud-pki-overview).
[^b04c01-auth-mode]: Microsoft Learn, [Change server authentication mode](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/change-server-authentication-mode?view=sql-server-ver17).
