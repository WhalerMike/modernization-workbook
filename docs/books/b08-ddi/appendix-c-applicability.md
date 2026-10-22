---
title: "Appendix C — Applicability"
description: "Which parts of the book apply as written in commercial cloud and GCC-Moderate at FedRAMP Moderate, and what changes in GCC High, Azure Government and AWS GovCloud, DoD impact levels 4 and 5, and air-gapped or classified networks. Platform facts are as of October 20, 2026."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b08-ddi
book: B08
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Applicability

*The architecture travels to every environment; the services, integrations and authorizations underneath it don't.*

::: {.callout-note}
## In this appendix
The environment the book is written for, and what changes in GCC High, Azure Government and AWS GovCloud (US), at DoD impact levels 4 and 5, and in air-gapped and classified networks, with a quick-reference table. Readers in higher-impact environments should start here, then read [Chapter 03](03-federal-requirements.md).
:::

::: {.callout-important}
## Platform facts as of October 20, 2026
Service availability in government clouds changes month to month. Every platform fact on this page was checked against the provider's documentation or the FedRAMP Marketplace on October 20, 2026. Recheck the linked pages before relying on them.
:::

The architecture in this book applies in every environment: one authoritative DDI policy plane, agency-controlled resolvers as the first hop, and consistent forwarding and policy everywhere. What changes from one environment to the next is which services are authorized, which integrations exist and which optimizations are available. This appendix sets out those boundaries so that readers in higher-impact environments know which statements in the chapters need adjusting.

The book uses **GCC-Moderate** for the Microsoft 365 Government Community Cloud offering that Microsoft documents as "GCC."[^aC-gccdesc] GCC uses the Worldwide endpoint set,[^aC-m365ww] and the FedRAMP Marketplace lists it (as Microsoft 365 Government Community Cloud & Supporting Services) as FedRAMP Certified at Class C, which the Marketplace labels Moderate.[^aC-fr-gcc] Microsoft's GCC service description uses broader wording about FedRAMP accreditation;[^aC-gccdesc] for authorization purposes, read the Marketplace listing and the package.

## Primary scope: commercial cloud at FedRAMP Moderate

The book is written for agencies whose workloads run in commercial Azure, commercial AWS Regions and Google Cloud, with Microsoft 365 in GCC-Moderate, at the FedRAMP Moderate impact level. In this environment:

- Everything in Chapters 01–12 applies as written.
- A DDI management service delivered as a cloud service must hold a FedRAMP certification at Moderate or higher, and the agency authorizes its own DDI system that uses it; FedRAMP's rules say an agency "should never create a standalone authorization to operate for a cloud service offering."[^aC-fedramp-use] On-premises and in-tenant resolvers stay inside the agency's own boundary ([Chapter 03](03-federal-requirements.md)).
- Microsoft 365 informed network routing (INR) is **not** available. Microsoft says it "supports tenants in WW Commercial cloud but not the GCC Moderate, GCC High, DoD, Germany, or China clouds" ([Chapter 05](05-edge-interception-and-bypass.md)).[^aC-inr]
- The Amazon VPC IPAM integration that lets an external Infoblox IPAM act as the authority for a VPC IPAM scope is available in commercial AWS Regions, for private scopes only, and requires the VPC IPAM Advanced Tier ([Chapter 07](07-cloud-private-endpoints-and-ipam.md)).[^aC-awsipam]
- Because GCC-Moderate uses the Worldwide endpoint list,[^aC-m365ww] the DNS risk for Microsoft 365 is path consistency rather than resolving to the wrong cloud ([Chapter 02](02-split-brain-dns.md)).

## GCC High, Azure Government and AWS GovCloud (US)

The architecture is unchanged. The differences are in authorization and integration:

- A policy plane certified only at FedRAMP Moderate doesn't cover High-impact systems. Either use a service certified at High, or keep the policy plane inside the agency's own High boundary (on-premises or in-tenant management), and confirm the approach with the authorizing official.
- Microsoft 365 GCC High uses its own endpoints and namespaces, many under `.us` domains (for example `outlook.office365.us`, `*.sharepoint.us`, `gov.teams.microsoft.us` and `login.microsoftonline.us`), and every resolver that GCC High users depend on must answer them correctly ([Chapter 02](02-split-brain-dns.md)).[^aC-m365gcch]
- INR is not available.[^aC-inr]
- The Amazon VPC IPAM–Infoblox integration is not available in the AWS GovCloud (US) Regions (or the AWS China Regions).[^aC-awsipam-news] Treat GovCloud like Azure and Google Cloud in [Chapter 07](07-cloud-private-endpoints-and-ipam.md): discovery, reconciliation and a reservation process.
- Azure Government feature availability differs from commercial Azure.[^aC-azgov] On Microsoft's Azure Government roadmap, Azure DNS private zones and public zones are generally available and authorized at FedRAMP High, DoD IL4 and DoD IL5, and Azure DNS Private Resolver is generally available at FedRAMP High.[^aC-azgov-roadmap] Confirm DNS resolver policy (formerly DNS security policy) and DNSSEC signing availability in the target Azure Government regions before design.
- Private endpoint DNS zone names differ in Azure Government (for example `privatelink.database.usgovcloudapi.net` rather than the commercial names), so conditional forwarding rules written for commercial Azure don't carry over unchanged ([Chapter 07](07-cloud-private-endpoints-and-ipam.md)).[^aC-pe-gov]

## DoD (impact levels 4 and 5)

Everything in the GCC High section applies, plus the DoD Cloud Computing Security Requirements Guide (SRG) and component-specific requirements. Azure Government holds DISA provisional authorizations at IL4 and IL5, with separate IL5 provisional authorizations for the US Gov and US DoD regions.[^aC-azdod] Not every service is authorized at every level: on the Azure Government roadmap, Azure DNS Private Resolver is forecast, not yet authorized, at IL4 and IL5.[^aC-azgov-roadmap] This book doesn't map the SRG. Treat [Chapter 03](03-federal-requirements.md) and [Appendix B](appendix-b-requirements-mapping.md) as a starting point only, and confirm provisional authorization status at the required impact level for every cloud service in the design.

## Air-gapped and classified networks

The core design still applies: one authoritative policy plane, agency resolvers as the first hop, consistent forwarding, DNSSEC validation under agency control and full logging. Several things in this book don't:

- No SaaS management plane. The policy plane, resolvers and IPAM run entirely inside the enclave.
- No CISA Protective DNS forwarding and no public recursion. The internet-facing guidance in Chapters 02 and 05 doesn't apply; local response policy zones carry threat intelligence imported through approved cross-domain processes.
- DNSSEC trust anchors and any internal root are managed locally.
- Cloud-provider integrations apply only where the provider offers a corresponding isolated cloud, and availability there must be confirmed separately. In Azure Government Secret (IL6), for example, Azure DNS private zones are generally available, Azure DNS Private Resolver is awaiting review and public zones are planned.[^aC-azgov-roadmap]

Mission-specific guidance governs these environments, and this book's sources don't cover it.

## Quick reference

| Topic | Commercial / GCC-Moderate | GCC High / Azure Government / GovCloud | DoD IL4–IL5 | Air-gapped |
|---|---|---|---|---|
| Single DDI policy plane | Applies | Applies | Applies | Applies |
| Cloud-delivered management certified at FedRAMP Moderate | Sufficient for Moderate systems; the agency authorizes its own system | Not sufficient alone | Not sufficient alone | Not applicable |
| CISA Protective DNS forwarding | Required for federal civilian agency egress | Required for federal civilian agency egress | Per DoD requirements | Not applicable |
| Microsoft 365 INR | Not in GCC-Moderate (Worldwide commercial only) | Not available | Not available | Not applicable |
| Amazon VPC IPAM external-IPAM (Infoblox) integration | Commercial Regions, private scopes | Not in GovCloud | Not in GovCloud | Not applicable |
| Azure DNS Private Resolver | Available | FedRAMP High (Azure Government) | Forecast at IL4 and IL5 | Awaiting review in Azure Government Secret |
| Azure Private DNS DNSSEC signing | Not supported (Azure DNSSEC signs public zones only) | Not supported | Not supported | Not applicable |

The Protective DNS row rests on M-22-09's statement that agencies "are already required to have DNS requests routed through CISA-operated infrastructure."[^aC-m2209] The DNSSEC row rests on Microsoft's prerequisite that a zone to be signed "must be hosted by Azure Public DNS."[^aC-dnssec]

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — Requirements Mapping and Sources](appendix-b-requirements-mapping.md) · [Book index](index.md)
:::

[^aC-gccdesc]: Microsoft Learn, "Office 365 GCC," Office 365 US Government service description, <https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/gcc> (accessed Oct 20, 2026).
[^aC-m365ww]: Microsoft Learn, "Microsoft 365 URLs and IP address ranges" (Microsoft 365 Worldwide, including GCC), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide> (accessed Oct 20, 2026).
[^aC-fr-gcc]: FedRAMP Marketplace, Microsoft 365 Government Community Cloud & Supporting Services (package MSO365MT): FedRAMP Certified, Class C (Moderate), Rev5, agency path, <https://www.fedramp.gov/marketplace/products/MSO365MT/> (accessed Oct 20, 2026).
[^aC-fedramp-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 20, 2026).
[^aC-inr]: Microsoft Learn, "Microsoft 365 informed network routing" (supported SD-WAN: Cisco IOS XE SD-WAN 20.4/17.4 or later), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide> (accessed Oct 20, 2026).
[^aC-awsipam]: Amazon Web Services, *Amazon VPC IPAM User Guide*, "Integrate VPC IPAM with Infoblox infrastructure" (private scopes only; VPC IPAM Advanced Tier prerequisite), <https://docs.aws.amazon.com/vpc/latest/ipam/integrate-infoblox-ipam.html> (accessed Oct 20, 2026).
[^aC-awsipam-news]: Amazon Web Services, "Amazon VPC IPAM automates IP assignments from Infoblox IPAM," November 17, 2025 (available in all AWS Regions where VPC IPAM is supported, except the AWS China and AWS GovCloud (US) Regions), <https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-vpc-ipam-automates-ip-from-infoblox/> (accessed Oct 20, 2026).
[^aC-m365gcch]: Microsoft Learn, "Microsoft 365 U.S. Government GCC High endpoints," <https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-u-s-government-gcc-high-endpoints?view=o365-worldwide> (accessed Oct 20, 2026).
[^aC-azgov]: Microsoft Learn, "Compare Azure Government and global Azure," <https://learn.microsoft.com/en-us/azure/azure-government/compare-azure-government-global-azure> (accessed Oct 20, 2026).
[^aC-azgov-roadmap]: Microsoft Learn, "Azure Government product General Availability (GA) roadmap" (rows Azure DNS, Azure DNS Private Resolver, Azure DNS Private Zones and Azure DNS Public Zones; page dated October 4, 2026), <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-product-roadmap> (accessed Oct 20, 2026).
[^aC-pe-gov]: Microsoft Learn, "Azure Private Endpoint private DNS zone values," section "Government," <https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns> (accessed Oct 20, 2026).
[^aC-azdod]: Microsoft Learn, "Azure Government DoD Overview," <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-overview-dod> (accessed Oct 20, 2026).
[^aC-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, "Encrypting DNS traffic," <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 20, 2026).
[^aC-dnssec]: Microsoft Learn, "How to sign your Azure Public DNS zone with DNSSEC," Prerequisites, <https://learn.microsoft.com/en-us/azure/dns/dnssec-how-to> (accessed Oct 20, 2026).
