---
title: "Appendix C — Applicability"
description: "Where the book applies as written: SQL Server 2022 and 2025 on Windows, standalone or in availability groups, connected to Microsoft's commercial cloud (including GCC-Moderate). It does not apply as written to GCC High or DoD, air-gapped networks, failover cluster instances, SQL Server 2019 and older, or most Linux deployments. Platform facts are stamped as of October 20, 2026."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b06-data-platform
book: B06
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Applicability

*Read this before Chapter 01: the engine-side steps depend on a cloud, a version and a topology that not every estate has.*

::: {.callout-note}
## In this appendix
The cloud, SQL Server version, operating system and topology the book assumes; the environments where it doesn't apply as written and what still applies there; the Entra-without-Arc and re-platforming alternatives; and the protections an out-of-scope server still gets.
:::

::: {.callout-important}
## Platform facts as of October 20, 2026
SQL Server enabled by Azure Arc changes month to month.[^aC-relnotes] Every platform fact on this page was checked against Microsoft Learn on October 20, 2026. Recheck the linked pages before you rely on them.
:::

## Where the book applies as written

The engine-side steps (Chapters 09–12 and 20–21) depend on Microsoft Entra authentication in SQL Server itself. The book applies as written where all of these hold:

| Dimension | In scope | Source |
|---|---|---|
| Cloud | Microsoft's commercial cloud, including GCC-Moderate tenants. SQL Server needs access to the Azure public cloud to use Entra authentication. | [^aC-mi] |
| SQL Server version | SQL Server 2022 (app registration and Key Vault certificate) and SQL Server 2025 (Arc managed identity, which Microsoft recommends for 2025 and later). | [^aC-overview] [^aC-mi] |
| Operating system | Windows. The managed-identity setup is supported only for Arc-enabled SQL Server 2025 on Windows Server. | [^aC-mi] |
| Topology | Standalone instances and Always On availability groups. | [^aC-overview] |

## Where it does not apply as written

| Environment | What Microsoft documents | What still applies |
|---|---|---|
| **GCC High and DoD (Azure Government)** | SQL Server enabled by Azure Arc in Azure Government runs only in US Government Virginia, only on Windows, and offers only onboarding, inventory, licensing and billing, failover-cluster-instance management and ESU licenses; "all other features are not currently available." Entra authentication is not among them.[^aC-gov] Microsoft Cloud PKI is available in GCC High but not DoD.[^aC-intune-gov] | Chapters 01–08 (the case, consolidation and the audit), Chapters 14–15 (Kerberos repair and NTLM restriction) and the Entra-side work of Chapters 16–17: dynamic groups, PIM, access reviews and entitlement management are available in Azure Government.[^aC-entra-gov] Chapters 09–12 and 20–21 do not apply until the engine side is available there. |
| **Air-gapped or disconnected networks** | Entra authentication needs outbound reach to Entra ID and Microsoft Graph, with or without Arc.[^aC-noarc] Microsoft's cloud-first identity guidance says apps that must work without an internet connection need to stay on premises.[^aC-soa] | Consolidation (Chapters 03–06), the audit (Chapters 07–08) and Kerberos hardening (Chapters 14–15). |
| **Failover cluster instances (FCIs)** | Entra authentication is not supported for SQL Server failover cluster instances.[^aC-overview] Arc can still onboard them and show them in its inventory.[^aC-fci] | Move the databases to an availability group, or keep the FCI on Kerberos with the fallback protections below, tracked as a named exception class. |
| **SQL Server 2019 and older** | Entra authentication needs SQL Server 2022 or later.[^aC-overview] Arc doesn't onboard SQL Server 2012 or older at all.[^aC-arc-unsupported] | The upgrade is a prerequisite and belongs to the consolidation plan of Chapters 05–06. Until then, Kerberos hardening only. |
| **SQL Server on Linux** | Entra authentication is documented for SQL Server 2022 and later on Linux,[^aC-overview] but connecting SQL Server on Linux to Arc is still in preview.[^aC-relnotes] The managed-identity path and Disable SQL Authentication are Windows-only on SQL Server 2025.[^aC-mi] [^aC-disable] | Treat Linux instances as their own exception class and verify each feature on Microsoft Learn before planning. |

## Alternatives

**Entra authentication without Azure Arc.** Microsoft documents a manual setup for SQL Server 2022 and later on Windows. You obtain a certificate, install `adal.dll` from the Microsoft OLE DB Driver for SQL Server, register an application, grant it Microsoft Graph permissions with admin consent, upload the certificate, and set the `FederatedAuthentication` registry values. The host still needs network access to `login.windows.net`, `login.microsoftonline.com`, `graph.microsoft.com`, `graph.windows.net` and `database.windows.net`.[^aC-noarc] It suits agencies that won't install the Arc agent, but you take on certificate rotation and configuration drift yourself. Microsoft documents only commercial-cloud endpoints for this method, so the book makes no claim that it works in Azure Government.

**Re-platforming.** For a data domain whose instances fall out of scope, the platform question ([Chapter 23](23-epilogue-the-platform-question.md)) is a legitimate alternative. The identity question follows the data to any platform.

## Fallback protections for out-of-scope servers

An instance that can't reach Entra authentication still benefits from most of the book:

- **Consolidate first.** Retiring the instance removes the problem ([Chapter 06](06-retain-consolidate-retire.md)).
- **Turn SQL authentication off where you can.** Use Windows Authentication mode (`SERVERPROPERTY('IsIntegratedSecurityOnly') = 1`), disable and rename `sa`, and give every remaining SQL login an owner and a sunset date.[^aC-serverproperty]
- **Make Kerberos work and measure it.** Register SPNs so connections negotiate Kerberos instead of falling back to NTLM, and confirm with `sys.dm_exec_connections.auth_scheme` from a client, because local connections use NTLM even when the SPN is correct ([Chapter 14](14-ntlm-and-the-patterns-that-generate-it.md)).[^aC-spn]
- **Retire the weakest protocols.** NTLMv1 is removed in Windows Server 2025, and NTLMv2, LANMAN and RC4 for Kerberos are deprecated.[^aC-removed] Use the enhanced NTLM auditing in Windows 11 version 24H2 and Windows Server 2025, which Microsoft extended to Windows Server 2022 and 2019 with updates released on or after October 13, 2026, to find what still uses NTLM.[^aC-ntlm-audit]
- **Least privilege through AD groups.** Apply the one-group, one-role discipline of [Chapter 16](16-groups-roles-and-membership.md) with AD groups and recurring reviews.
- **Third-party MFA for Kerberos and NTLM.** If the agency evaluates a product that adds MFA to these protocols at the domain controller, treat it as a compensating control recorded in the exception registry, not as a destination ([Chapter 12](12-the-engine-authentication-decision.md)).

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — Security-Approval (ATO) Kit](appendix-b-ato-kit.md) · [Book index](index.md)
:::

[^aC-relnotes]: Microsoft Learn, "Release notes — SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/release-notes> (accessed Oct 20, 2026).
[^aC-mi]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc," section "Limitations," <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Oct 20, 2026).
[^aC-overview]: Microsoft Learn, "Microsoft Entra authentication for SQL Server," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).
[^aC-gov]: Microsoft Learn, "SQL Server enabled by Azure Arc in US Government," <https://learn.microsoft.com/sql/sql-server/azure-arc/us-government-region> (accessed Oct 20, 2026).
[^aC-intune-gov]: Microsoft Learn, "Microsoft Intune for US Government GCC High and DoD service description," <https://learn.microsoft.com/intune/fundamentals/government-service>; and "Overview of Microsoft Cloud PKI for Microsoft Intune," <https://learn.microsoft.com/intune/cloud-pki/> (both accessed Oct 20, 2026).
[^aC-entra-gov]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 20, 2026).
[^aC-noarc]: Microsoft Learn, "Enable Microsoft Entra authentication for SQL Server on Windows without Azure Arc," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/microsoft-entra-authentication-sql-server-enable-without-arc> (accessed Oct 20, 2026).
[^aC-soa]: Microsoft Learn, "Microsoft Entra cloud-first identity guidance," section "Step 4. Categorize applications and plan integration approach," <https://learn.microsoft.com/entra/identity/hybrid/guidance-it-architects-source-of-authority> (accessed Oct 20, 2026).
[^aC-fci]: Microsoft Learn, "View Always On failover cluster instances in Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/support-for-fci> (accessed Oct 20, 2026).
[^aC-arc-unsupported]: Microsoft Learn, "SQL Server enabled by Azure Arc," section "Unsupported configurations," <https://learn.microsoft.com/sql/sql-server/azure-arc/overview> (accessed Oct 20, 2026).
[^aC-disable]: Microsoft Learn, "Disable SQL authentication — SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication> (accessed Oct 20, 2026).
[^aC-serverproperty]: Microsoft Learn, "SERVERPROPERTY (Transact-SQL)," <https://learn.microsoft.com/sql/t-sql/functions/serverproperty-transact-sql> (accessed Oct 20, 2026).
[^aC-spn]: Microsoft Learn, "Register a Service Principal Name for Kerberos connections," sections "Client connections" and "Authentication defaults," <https://learn.microsoft.com/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections>; and "How to determine if the authentication type is Kerberos," <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> (both accessed Oct 20, 2026).
[^aC-removed]: Microsoft Learn, "Features removed or no longer developed in Windows Server," <https://learn.microsoft.com/windows-server/get-started/removed-deprecated-features-windows-server> (accessed Oct 20, 2026).
[^aC-ntlm-audit]: Microsoft Support, "Overview of NTLM auditing enhancements in Windows 11, version 24H2, Windows Server 2019, and later versions," KB5064479, <https://support.microsoft.com/en-us/servicing/os/windows/2025/07/overview-of-ntlm-auditing-enhancements-in-windows-11-version-24h2-and-windows-server-2025> (accessed Oct 20, 2026).
