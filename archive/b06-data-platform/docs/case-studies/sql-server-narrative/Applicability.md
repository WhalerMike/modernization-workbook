---
title: "Applicability — Where the Series Applies as Written"
subtitle: "Cloud environment, SQL Server version, platform and topology limits, with alternatives and fallback protections"
description: "Read this before Book 01. The series applies as written to SQL Server 2022 and 2025 on Windows, standalone or in availability groups, connected to Microsoft's commercial cloud (including GCC-Moderate). It does not apply as written to GCC High or DoD, air-gapped networks, failover cluster instances, SQL Server 2019 and older, or most Linux deployments. Platform facts are stamped as of 19 October 2026."
doc-type: sql-server-narrative-book
audience: [Executive, Technical, Customer]
family: sql-server-narrative
series-order: 0
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

::: {.content-visible when-format="docx"}
# Applicability — Where the Series Applies as Written
:::

::: {.callout-important}
## Platform facts as of 19 October 2026
SQL Server enabled by Azure Arc changes month to month.[^app-relnotes] Every platform fact on this page was checked against Microsoft Learn on 19 October 2026. Recheck the linked pages before you rely on them.
:::

::: {.callout-tip}
## Download this page
**[Applicability-bundle.docx](../../../downloads/Applicability-bundle.docx)** — this page as one Word document. Regenerated on every site deploy.
:::

## Where the series applies as written

The engine-side steps (Books 04, 05 and 09) depend on Microsoft Entra authentication in SQL Server itself. The series applies as written where all of these hold:

| Dimension | In scope | Source |
|---|---|---|
| Cloud | Microsoft's commercial cloud, including GCC-Moderate tenants. SQL Server needs access to the Azure public cloud to use Entra authentication. | [^app-mi] |
| SQL Server version | SQL Server 2022 (app registration and Key Vault certificate) and SQL Server 2025 (Arc managed identity, recommended for 2025). | [^app-overview] [^app-mi] |
| Operating system | Windows. The managed-identity setup is supported only for Arc-enabled SQL Server 2025 on Windows Server. | [^app-mi] |
| Topology | Standalone instances and availability groups. | [^app-overview] |

## Where it does not apply as written

| Environment | What Microsoft documents | What still applies |
|---|---|---|
| **GCC High and DoD (Azure Government)** | SQL Server enabled by Azure Arc in Azure Government runs only in US Gov Virginia, only on Windows, and offers only onboarding, inventory, licensing and billing, failover-cluster-instance management and ESU licenses; "all other features are not currently available." Entra authentication is not among them.[^app-gov] Microsoft Cloud PKI is supported in GCC High but not DoD.[^app-intune-gov] | Books 01–03 (case, consolidation, audit), Book 06 (Kerberos repair and NTLM restriction) and the Entra-side work of Book 07: dynamic groups, PIM, access reviews and entitlement management are available in Azure Government.[^app-entra-gov] Books 04, 05 and 09 do not apply until the engine side is available there. |
| **Air-gapped or disconnected networks** | Entra authentication needs outbound reach to Entra ID and Microsoft Graph, with or without Arc.[^app-noarc] Microsoft's cloud-first identity guidance says disconnected applications need to stay on premises.[^app-soa] | Consolidation (Book 02), the audit (Book 03) and Kerberos hardening (Book 06). |
| **Failover cluster instances (FCIs)** | Entra authentication is not supported for SQL Server failover cluster instances.[^app-overview] Arc can still onboard and manage them. | Move the databases to an availability group, or keep the FCI on Kerberos with the fallback protections below, tracked as a named exception class. |
| **SQL Server 2019 and older** | Entra authentication needs SQL Server 2022 or later.[^app-overview] | The upgrade is a prerequisite and belongs to Book 02's consolidation plan. Until then, Kerberos hardening only. |
| **SQL Server on Linux** | Entra authentication is documented for SQL Server 2022 on Linux. The managed-identity path and Disable SQL Authentication are Windows-only on SQL Server 2025.[^app-mi] [^app-disable] | Treat Linux instances as their own exception class and verify each feature on Microsoft Learn before planning. |

## Alternatives

**Entra authentication without Azure Arc.** Microsoft documents a manual setup for SQL Server 2022 and later on Windows. You register an application, upload a certificate, install `adal.dll` from the OLE DB driver, and set the `FederatedAuthentication` registry values. The host still needs outbound access to `login.windows.net`, `login.microsoftonline.com`, `graph.microsoft.com`, `graph.windows.net` and `database.windows.net`.[^app-noarc] It suits agencies that won't install the Arc agent, but you take on certificate rotation and configuration drift yourself. Microsoft documents only commercial-cloud endpoints for this method, so the series makes no claim that it works in Azure Government.

**Re-platforming.** For a data domain whose instances fall out of scope, the platform question (Book 11) is a legitimate alternative. The identity question follows the data to any platform.

## Fallback protections for out-of-scope servers

An instance that can't reach Entra authentication still benefits from most of the series:

- **Consolidate first.** Retiring the instance removes the problem (Book 02).
- **Turn SQL authentication off where you can.** Use Windows Authentication mode (`SERVERPROPERTY('IsIntegratedSecurityOnly') = 1`), disable and rename `sa`, and give every remaining SQL login an owner and a sunset date.[^app-serverproperty]
- **Make Kerberos work and measure it.** Register SPNs so connections negotiate Kerberos instead of falling back to NTLM, and confirm with `sys.dm_exec_connections.auth_scheme` (Book 06).[^app-spn] [^app-dmv]
- **Retire the weakest protocols.** NTLMv1 is removed in Windows Server 2025, and NTLMv2 and RC4 for Kerberos are deprecated.[^app-removed] Use the enhanced NTLM auditing events (Windows 11 24H2, Windows Server 2019 and later) to find what still uses NTLM.[^app-ntlm-audit]
- **Least privilege through AD groups.** Apply the one-group, one-role discipline of Book 07 with AD groups and recurring reviews.
- **Third-party MFA for Kerberos and NTLM.** Some products add MFA to legacy protocols. Evaluate them as compensating controls, not as a destination.

[^app-relnotes]: Microsoft Learn, [Release notes — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/release-notes?view=sql-server-ver17).
[^app-mi]: Microsoft Learn, [Managed identity for SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17), Limitations ("SQL Server needs access to Azure public cloud"; managed-identity setup "only supported with Azure Arc-enabled SQL Server 2025, running on Windows Server"). Checked 19 October 2026.
[^app-overview]: Microsoft Learn, [Microsoft Entra authentication for SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview?view=sql-server-ver17) (SQL Server 2022 and later; failover cluster instances not supported). Checked 19 October 2026.
[^app-gov]: Microsoft Learn, [Azure Government — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/us-government-region?view=sql-server-ver17). Checked 19 October 2026.
[^app-intune-gov]: Microsoft Learn, [Microsoft Intune Government service overview](https://learn.microsoft.com/en-us/intune/fundamentals/government-service).
[^app-entra-gov]: Microsoft Learn, [Microsoft Entra feature availability in Azure for US Government](https://learn.microsoft.com/en-us/entra/identity/authentication/feature-availability).
[^app-noarc]: Microsoft Learn, [Enable Microsoft Entra authentication for SQL Server on Windows without Azure Arc](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/microsoft-entra-authentication-sql-server-enable-without-arc?view=sql-server-ver17), Prerequisites. Checked 19 October 2026.
[^app-soa]: Microsoft Learn, [Microsoft Entra cloud-first identity guidance](https://learn.microsoft.com/en-us/entra/identity/hybrid/guidance-it-architects-source-of-authority).
[^app-disable]: Microsoft Learn, [Disable SQL Authentication — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/disable-sql-authentication?view=sql-server-ver17).
[^app-serverproperty]: Microsoft Learn, [SERVERPROPERTY (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/functions/serverproperty-transact-sql?view=sql-server-ver17).
[^app-spn]: Microsoft Learn, [Register a Service Principal Name for Kerberos connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections?view=sql-server-ver17).
[^app-dmv]: Microsoft Learn, [sys.dm_exec_connections](https://learn.microsoft.com/en-us/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql?view=sql-server-ver17) (`auth_scheme`).
[^app-removed]: Microsoft Learn, [Features removed or no longer developed in Windows Server](https://learn.microsoft.com/en-us/windows-server/get-started/removed-deprecated-features-windows-server).
[^app-ntlm-audit]: Microsoft Support, [Overview of NTLM auditing enhancements in Windows 11, version 24H2, Windows Server 2019, and later versions](https://support.microsoft.com/en-us/servicing/os/windows/2025/07/overview-of-ntlm-auditing-enhancements-in-windows-11-version-24h2-and-windows-server-2025).

::: {.callout-tip}
## Continue the series
[Index](index.md) · [Next: Book 01 — The Inheritance →](Book_01.md)
:::
