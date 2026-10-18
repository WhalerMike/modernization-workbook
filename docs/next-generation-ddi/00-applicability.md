---
title: "Applicability"
subtitle: "Which parts of this book apply in commercial cloud, GCC-Moderate, GCC High, DoD and air-gapped environments"
doc-type: modernization-book-chapter
audience: [Executive, Architect, Engineer]
family: next-generation-ddi
series-order: 0
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Applicability

*Which parts of this book apply in commercial cloud, GCC-Moderate, GCC High, DoD and air-gapped environments.*

::: {.callout-tip}
## Download this page
This page is included in the [whole book](../../downloads/next-generation-ddi-bundle.docx) as a Word document.
:::

The architecture in this book (one authoritative DDI policy plane, agency-controlled resolvers as the first hop, consistent forwarding and policy everywhere) applies in every environment. What changes from one environment to the next is which services are authorized, which integrations exist, and which optimizations are available. This page sets out those boundaries so that readers in higher-impact environments know which statements in later chapters need adjusting.

The book uses **GCC-Moderate** for the Microsoft 365 Government Community Cloud offering that Microsoft documents as "GCC".[^c00-gccdesc] It runs on the Worldwide (commercial) service instance and is used at FedRAMP Moderate.

## Primary Scope: Commercial Cloud at FedRAMP Moderate

The book is written for agencies whose workloads run in commercial Azure, commercial AWS Regions and Google Cloud, with Microsoft 365 in GCC-Moderate, at the FedRAMP Moderate impact level. In this environment:

- Everything in Chapters 01–11 applies as written.
- A DDI management service delivered as SaaS must hold a FedRAMP Moderate authorization (or better) and an agency ATO. On-premises and in-tenant resolvers stay inside the agency's own boundary (Chapter 03).
- Microsoft 365 Informed Network Routing is **not** available. Microsoft supports it only in the Worldwide commercial cloud, not GCC-Moderate (Chapter 05).[^c00-inr]
- The AWS VPC IPAM integration with an external IPAM is available in commercial AWS Regions (Chapter 07).[^c00-awsipam]
- Microsoft 365 GCC-Moderate uses the Worldwide endpoint list,[^c00-m365ww] so the DNS risk is path consistency rather than resolving to the wrong cloud (Chapter 02).

## GCC High, Azure Government and AWS GovCloud (High)

The architecture is unchanged. The differences are in authorization and integration:

- A policy plane authorized only at FedRAMP Moderate does not cover High-impact systems. Either use a service authorized at High, or keep the policy plane inside the agency's own High boundary (on-premises or in-tenant management), and confirm with the authorizing official.
- Microsoft 365 GCC High uses its own endpoints and namespaces, many under .us domains, and every resolver must answer them correctly (Chapter 02).[^c00-m365gcch]
- INR is not available.
- The AWS VPC IPAM–Infoblox integration is not available in the AWS GovCloud (US) Regions. Treat GovCloud like Azure and Google Cloud in Chapter 07: discovery, reconciliation and a reservation process.
- Azure Government feature availability differs from commercial Azure. Confirm Azure DNS Private Resolver, DNS security policy and DNSSEC availability in the target Azure Government regions before design.[^c00-azgov]

## DoD (Impact Levels 4 and 5)

Everything in the GCC High section applies, plus the DoD Cloud Computing Security Requirements Guide and component-specific requirements.[^c00-azdod] This book does not map those requirements. Treat Chapter 03 and the control mapping as a starting point only, and confirm provisional authorization status at the required impact level for every cloud service in the design.

## Air-Gapped and Classified Networks

The core design still applies: one authoritative policy plane, agency resolvers as the first hop, consistent forwarding, DNSSEC validation under agency control and full logging. Several things in this book do not:

- No SaaS management plane. The policy plane, resolvers and IPAM run entirely inside the enclave.
- No CISA Protective DNS forwarding and no public recursion. Internet-facing guidance in Chapters 02 and 05 does not apply; local response policy zones carry threat intelligence that is imported through approved cross-domain processes.
- DNSSEC trust anchors and any internal root are managed locally.
- Cloud-provider integrations apply only where the provider offers a corresponding isolated region, and their availability must be confirmed separately.

Mission-specific guidance governs these environments, and this book's sources do not cover them.

## Quick Reference

| Topic | Commercial / GCC-Moderate | GCC High / GovCloud | DoD IL4–IL5 | Air-gapped |
|----|----|----|----|----|
| Single DDI policy plane | Applies | Applies | Applies | Applies |
| SaaS management at FedRAMP Moderate | Sufficient with agency ATO | Not sufficient alone | Not sufficient alone | Not applicable |
| CISA Protective DNS forwarding | Required for FCEB egress | Required for FCEB egress | Per DoD requirements | Not applicable |
| Microsoft 365 INR | Not in GCC-Moderate (Worldwide commercial only) | Not available | Not available | Not applicable |
| AWS VPC IPAM external-IPAM integration | Commercial Regions | Not in GovCloud | Not in GovCloud | Not applicable |
| Azure Private DNS DNSSEC signing | Not supported (public zones only) | Not supported | Not supported | Not applicable |

---

**Previous:** [Next Generation DDI — book home](index.md)  
**Next:** [Chapter 01 — DNS Is Now the Control Plane](01-dns-is-the-control-plane.md)

[^c00-gccdesc]: Microsoft Learn, "Office 365 GCC," Office 365 US Government service description. <https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/gcc>
[^c00-inr]: Microsoft Learn, "Microsoft 365 informed network routing" (WW Commercial only; Cisco IOS XE SD-WAN 20.4/17.4 or later). <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide>
[^c00-awsipam]: AWS, "Amazon VPC IPAM automates IP assignments from Infoblox IPAM," November 17, 2025, and *Amazon VPC IPAM User Guide*, "Integrate VPC IPAM with Infoblox infrastructure" (private scopes; not in the China or AWS GovCloud (US) Regions). <https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-vpc-ipam-automates-ip-from-infoblox/>; <https://docs.aws.amazon.com/vpc/latest/ipam/integrate-infoblox-ipam.html>
[^c00-m365ww]: Microsoft Learn, "Microsoft 365 URLs and IP address ranges" (the Worldwide list, which includes GCC). <https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide>
[^c00-m365gcch]: Microsoft Learn, "Microsoft 365 U.S. Government GCC High endpoints." <https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-u-s-government-gcc-high-endpoints?view=o365-worldwide>
[^c00-azgov]: Microsoft Learn, "Compare Azure Government and global Azure." <https://learn.microsoft.com/en-us/azure/azure-government/compare-azure-government-global-azure>
[^c00-azdod]: Microsoft Learn, "Azure Government DoD Overview." <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-overview-dod>
