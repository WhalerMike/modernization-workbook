---
title: "Appendix B — Applicability"
description: "Which environments the Book 01 target state assumes and where it doesn't apply as written: commercial cloud and GCC Moderate, GCC High and DoD, air-gapped enclaves, and OT and 802.1X networks; the platform and licensing assumptions; and what the book is and isn't."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b01-transformation-arc
book: B01
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — Applicability

*A target state is only a plan if the cloud it assumes is the cloud the agency actually has.*

::: {.callout-note}
## In this appendix
The environments the target state in Chapters 03 to 08 assumes, and how far it applies in each; the platform, licensing and cost assumptions behind it; and what Book 01 is and isn't. Read it alongside [Chapter 01](01-why-modernization-is-hard.md). Each book in the workbook states its own applicability for its surface.
:::

## The environment this book assumes

The target state in Chapters 03 to 08 is built on Microsoft's commercial cloud services: Microsoft Entra ID, Microsoft Intune, Azure Arc, Azure DNS Private Resolver and Azure Private DNS, and Microsoft Defender. For a federal agency that means:

| Environment | Fit |
|---|---|
| **Commercial cloud and Microsoft 365 GCC (Moderate)** | **Primary target.** Microsoft 365 GCC is paired with Microsoft Entra ID in the commercial Azure cloud,[^aB-pairing] and its FedRAMP Marketplace listing, *Microsoft 365 Government Community Cloud & Supporting Services*, is FedRAMP Certified at Class C (Moderate).[^aB-mso365mt] Azure itself holds a FedRAMP High authorization in the public cloud.[^aB-fedramp-high] The architecture applies as written, inside the agency's own authorization boundary. Two known gaps: Microsoft 365 informed network routing isn't available to GCC Moderate ([Book 09, Chapter 12](../b09-network/12-microsoft-365-traffic.md)), and per-feature availability in GCC still has to be checked. |
| **GCC High and DoD (Azure Government)** | **Applies in principle, with checks.** Microsoft 365 GCC High and DoD are paired with Microsoft Entra ID in Azure Government,[^aB-pairing] and feature availability and timing differ there. Confirm each named capability against the current per-cloud tables before committing to it. As of this writing Microsoft lists certificate-based authentication, Privileged Identity Management, access reviews and Lifecycle Workflows as available in Azure for US Government, and a few items, such as the Microsoft Entra threat intelligence risk detection and the My Staff portal, as not available.[^aB-entragov] Microsoft Cloud PKI, for example, is supported in GCC High but not in DoD.[^aB-intunegov] |
| **Air-gapped and classified enclaves** | **Doesn't apply as written.** With no cloud control plane, Entra ID, Intune and Arc aren't available. The assessment and plan-and-deliver discipline ([Chapters 10](10-analyzing-the-estate.md) and [11](11-analysis-plan-delivery.md)) still applies to an on-premises target, which typically remains AD DS. |
| **Non-Microsoft identity or cloud stack** | **The method applies; the product mappings don't.** For an agency whose cloud identity, device management or collaboration platform isn't Microsoft's, the governance model carries over: an authoritative source for every attribute, an HR-driven joiner-mover-leaver lifecycle, read-only analysis before any change, gated phases with a rollback at each gate, and drift detection with evidence. What changes is everything named in Chapters 03 to 08: the products, their features and licensing, and their per-cloud availability. Map each to the agency's platform and check that platform's own FedRAMP listing. [Book 10, Chapter 10](../b10-cloud-boundary/10-alternative-collaboration-paths.md) works one alternative collaboration path. |
| **OT, lab and 802.1X-dependent networks** | **Partial.** Network access control that relies on NPS and RADIUS against Active Directory needs an explicit successor. Book 01 names the dependency; [Book 09, Chapter 07](../b09-network/07-network-access-control.md) covers the 802.1X and RADIUS design. |

## Platform assumptions

- **Windows Server 2025** for the platform host ([Chapter 03](03-platform-foundation.md)). Earlier supported versions work for the assessment role, but check their support dates: Windows Server 2012 and 2012 R2 Extended Security Updates ended on October 13, 2026, and Windows Server 2016 reaches end of support on January 12, 2027.[^aB-esu]
- **Windows 11** user devices for Microsoft Entra join and Windows Autopilot ([Chapter 07](07-compute-transformation.md)). Windows 10 reached end of support on October 14, 2025.[^aB-win10]
- **Microsoft Entra ID P1** at minimum, for Conditional Access, dynamic groups and administrative-unit administration: each administrator assigned a role over an administrative unit needs P1, and so does each member of an administrative unit with a dynamic membership rule.[^aB-au] **Microsoft Entra ID P2** (or Microsoft Entra ID Governance) for Privileged Identity Management, and P2 for Identity Protection risk policies.[^aB-licensing] **Microsoft Entra ID Governance** (or Microsoft Entra Suite) for Lifecycle Workflows and access reviews; P2 alone doesn't include Lifecycle Workflows.[^aB-lcw][^aB-govlicensing]
- **Microsoft Intune** licensing for every managed user device.
- **Azure subscriptions** for Arc-connected servers, Azure Policy machine configuration and Private Resolver. The Arc control plane itself (resource organization, Resource Graph, Azure RBAC, templates and extensions) carries no extra cost; the Azure services used on Arc-enabled servers, such as Defender for Cloud or Azure Monitor, are billed at their own rates.[^aB-arcprice] Cost is planned by service, not by connection ([Book 05, Chapter 09](../b05-devices/09-servers-under-azure-arc.md)).

## What this book is, and isn't

- It is a **reference architecture and program model**. The "framework" (the platform host, plan engine, adapters, drift detection and evidence packets) is a design to be built from standard components. It isn't an existing product.
- It doesn't replace Microsoft's product documentation or the agency's own authorization process. Each new cloud dependency it introduces has to sit inside an authorized boundary; FedRAMP certifies the cloud service, and the agency authorizes the system that uses it ([Appendix A](appendix-a-requirements-mapping.md)).
- Numbers in the book (percentages, durations, user counts, thresholds) are **illustrative** unless a source is cited.
- Microsoft hasn't deprecated AD DS. It remains a role in Windows Server 2025, which added a new forest and domain functional level.[^aB-ws2025] Retiring it is an agency decision that this book supports. Partial outcomes are legitimate end states: a minimized AD, or documented Kerberos islands with end-of-life dates.
- Data categorization and the Zero Trust data pillar, and encrypted DNS, are planned separately: data isn't designed in this book, and encrypted DNS belongs to [Book 08](../b08-ddi/index.md).

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Requirements Mapping](appendix-a-requirements-mapping.md) · [Book index](index.md)
:::

[^aB-pairing]: Microsoft Learn, "Cloud feature availability for US Government customers," Microsoft 365 integration (Office 365 GCC pairs with Microsoft Entra ID in Azure; GCC High and DoD pair with Microsoft Entra ID in Azure Government), <https://learn.microsoft.com/azure/security/fundamentals/feature-availability> (accessed Oct 21, 2026).
[^aB-mso365mt]: FedRAMP Marketplace, "Microsoft 365 Government Community Cloud & Supporting Services" (MSO365MT): FedRAMP Certified, Class C (Moderate), <https://www.fedramp.gov/marketplace/products/MSO365MT/> (accessed Oct 21, 2026).
[^aB-fedramp-high]: Microsoft Learn, "Configure Microsoft Entra ID to meet FedRAMP High Impact level" (Azure and Azure Government hold a P-ATO at the High impact level), <https://learn.microsoft.com/entra/standards/configure-for-fedramp-high-impact> (accessed Oct 21, 2026).
[^aB-entragov]: Microsoft Learn, "Microsoft Entra feature availability in Azure for US Government," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 21, 2026).
[^aB-intunegov]: Microsoft Learn, "Microsoft Intune for US Government GCC High and DoD service description" (Cloud PKI and Remote Help support GCC High only, not DoD), <https://learn.microsoft.com/intune/fundamentals/government-service> (accessed Oct 21, 2026).
[^aB-esu]: Microsoft Learn, "Cloud-native licensing and cost management with Azure Arc-enabled servers," Extended Security Updates, <https://learn.microsoft.com/azure/azure-arc/servers/cloud-native/licensing-cost-management> (accessed Oct 21, 2026).
[^aB-win10]: Microsoft Learn, "Windows 10 reaching end of support," <https://learn.microsoft.com/lifecycle/announcements/windows-10-end-of-support> (accessed Oct 21, 2026).
[^aB-au]: Microsoft Learn, "Administrative units in Microsoft Entra ID," License requirements, <https://learn.microsoft.com/entra/identity/role-based-access-control/administrative-units> (accessed Oct 21, 2026).
[^aB-lcw]: Microsoft Learn, "What are lifecycle workflows?" License requirements (Microsoft Entra ID Governance or Microsoft Entra Suite), <https://learn.microsoft.com/entra/id-governance/what-are-lifecycle-workflows> (accessed Oct 21, 2026).
[^aB-govlicensing]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals" (access reviews and Lifecycle Workflows require a Microsoft Entra ID Governance subscription for member users), <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (accessed Oct 21, 2026).
[^aB-licensing]: Microsoft Learn, "Microsoft Entra licensing" (Conditional Access requires P1; risk-based policies require ID Protection, a P2 feature; PIM requires P2 or Microsoft Entra ID Governance), <https://learn.microsoft.com/entra/fundamentals/licensing> (accessed Oct 21, 2026).
[^aB-arcprice]: Microsoft Learn, "Azure Arc overview," Pricing, <https://learn.microsoft.com/azure/azure-arc/overview> (accessed Oct 21, 2026).
[^aB-ws2025]: Microsoft Learn, "What's new in Windows Server 2025," Active Directory Domain Services, <https://learn.microsoft.com/windows-server/get-started/whats-new-windows-server-2025> (accessed Oct 21, 2026).
