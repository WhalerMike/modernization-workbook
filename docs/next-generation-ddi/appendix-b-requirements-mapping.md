---
title: "Appendix B — Requirements Mapping and Sources"
subtitle: "Each federal requirement, where the book addresses it, the evidence it calls for, and every source cited"
doc-type: modernization-book-chapter
audience: [Executive, Architect, Engineer]
family: next-generation-ddi
series-order: 13
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Appendix B — Requirements Mapping and Sources

*Each federal requirement, where the book addresses it, the evidence it calls for, and every source cited.*

::: {.callout-tip}
## Download this appendix
**[next-generation-ddi-appb-bundle.docx](../../downloads/next-generation-ddi-appb-bundle.docx)**: this appendix as a Word document. The [whole book](../../downloads/next-generation-ddi-bundle.docx) is also available.
:::

## Requirements Mapping

The table maps each federal requirement that touches the name layer to the chapter that addresses it and the evidence an assessor can expect. It is a working aid, not a substitute for the agency's own control implementation statements. Requirement wording is summarized; the cited documents govern.

| Requirement (source) | What it asks of DNS, DHCP and IPAM | Addressed in | Evidence |
|----|----|----|----|
| Encrypted DNS (OMB M-22-09) | Resolve DNS queries using encrypted DNS wherever technically supported | Ch 03, Ch 05 | Resolver DoH/DoT/DoQ configuration; endpoint DNS policy; port 853 and public-DoH blocking rules |
| Protective DNS for egress (OMB M-22-09; CISA Encrypted DNS Implementation Guidance; CISA Protective DNS) | Route agency DNS egress through CISA-operated Protective DNS, including encrypted DNS | Ch 03, Ch 05, Ch 08 | Forwarding chain configuration; redirect-dns targets; resolver logs showing the governed path |
| DNS logging (OMB M-21-31, EL-1) | Collect and retain DNS request logs | Ch 03, Ch 10 | Query log configuration, SIEM ingestion, retention settings |
| DNSSEC (OMB M-08-23; SP 800-53 SC-20, SC-21) | Sign authoritative zones; validate on recursive resolvers | Ch 03, Ch 06 | Signed-zone inventory, DS publication, KSK/ZSK rollover records, resolver validation settings |
| Name and address resolution architecture (SP 800-53 SC-22) | Fault-tolerant, role-separated resolution services | Ch 03, Ch 08 | Architecture diagram, resolver redundancy, internal/external role separation |
| IPv6 (OMB M-21-07) | Move IP-enabled assets to IPv6-only (80% by end of FY2025) | Ch 07 | Dual-stack and IPv6-only address plans, DHCPv6 and RA governance, AAAA coverage |
| Email authentication (CISA BOD 18-01) | DMARC p=reject, SPF and DKIM for federal second-level domains | Appendix A | DMARC, SPF and DKIM records per domain; aggregate report review |
| Asset inventory (SP 800-53 CM-8; CISA Zero Trust Maturity Model) | Continuous, accurate inventory of networked assets | Ch 01, Ch 07, Ch 10 | IPAM discovery reports, CMDB reconciliation results |
| Audit and access control (SP 800-53 AU-2, AU-6, AC-2, AC-3, AC-6) | Logged, role-based administration of DNS, DHCP and IPAM | Ch 03, Ch 10 | Change logs, role and scope assignments, review records |
| Secure DNS deployment (NIST SP 800-81r3) | Protective DNS, encrypted DNS, DNSSEC, hygiene, logging, DNS as a Zero Trust policy enforcement point | Ch 03 – Ch 10 | The checklist in Chapter 10 |
| Cloud service authorization (FedRAMP) | Authorization of any cloud-delivered management plane at the right impact level, plus agency ATO | Ch 03, [Applicability](00-applicability.md) | FedRAMP Marketplace listing, agency ATO letter, boundary diagram |

## Sources

Every URL below was checked as reachable on October 19, 2026. Primary sources (federal documents, standards and the cloud and platform providers' own documentation of their services) are listed separately from third-party sources, which the chapters label as such in their footnotes.

### Primary sources: federal requirements and guidance

- OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, section on encrypted DNS. <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
- CISA, *Encrypted DNS Implementation Guidance*, May 2024. <https://www.cisa.gov/resources-tools/resources/encrypted-dns-implementation-guidance>
- CISA, Protective Domain Name System (DNS) Resolver service. <https://www.cisa.gov/resources-tools/services/protective-domain-name-system-dns-resolver>
- OMB M-21-31, *Improving the Federal Government's Investigative and Remediation Capabilities Related to Cybersecurity Incidents*, August 27, 2021 (DNS logs at event-logging tier EL-1). <https://www.whitehouse.gov/wp-content/uploads/2021/08/M-21-31-Improving-the-Federal-Governments-Investigative-and-Remediation-Capabilities-Related-to-Cybersecurity-Incidents.pdf>
- OMB M-08-23, *Securing the Federal Government's Domain Name System Infrastructure*, August 22, 2008. <https://georgewbush-whitehouse.archives.gov/omb/memoranda/fy2008/m08-23.pdf>
- OMB M-21-07, *Completing the Transition to Internet Protocol Version 6 (IPv6)*, November 19, 2020. <https://www.whitehouse.gov/wp-content/uploads/2020/11/M-21-07.pdf>
- CISA, Binding Operational Directive 18-01, *Enhance Email and Web Security*, October 16, 2017. <https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security>
- NIST SP 800-81 Rev. 3, *Secure Domain Name System (DNS) Deployment Guide*, March 19, 2026. <https://csrc.nist.gov/pubs/sp/800/81/r3/final>
- NIST SP 800-207, *Zero Trust Architecture*, August 2020. <https://csrc.nist.gov/pubs/sp/800/207/final>
- NIST SP 800-53 Rev. 5 (update 1), *Security and Privacy Controls for Information Systems and Organizations*: SC-20, SC-21, SC-22 and the other controls cited. <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>
- CISA, *Zero Trust Maturity Model*, Version 2.0. <https://www.cisa.gov/zero-trust-maturity-model>
- FedRAMP Marketplace, Infoblox Government Cloud (package FR2017257053), authorized at Moderate since December 15, 2022. <https://www.fedramp.gov/marketplace/products/FR2017257053/>

### Primary sources: IETF and IANA standards

- IETF RFC 882, *Domain Names — Concepts and Facilities*, November 1983; superseded by RFC 1034 and RFC 1035 (November 1987). <https://www.rfc-editor.org/rfc/rfc882>; <https://www.rfc-editor.org/rfc/rfc1034>; <https://www.rfc-editor.org/rfc/rfc1035>
- IETF RFC 4033, *DNS Security Introduction and Requirements*, March 2005, and RFC 9364, *DNS Security Extensions (DNSSEC)*, BCP 237, February 2023. <https://www.rfc-editor.org/rfc/rfc4033>; <https://www.rfc-editor.org/rfc/rfc9364>
- IETF RFC 6891, *Extension Mechanisms for DNS (EDNS(0))*, April 2013. <https://www.rfc-editor.org/rfc/rfc6891>
- IETF RFC 7344, *Automating DNSSEC Delegation Trust Maintenance* (CDS and CDNSKEY), September 2014. <https://www.rfc-editor.org/rfc/rfc7344>
- IETF RFC 7858 (DNS over TLS), RFC 8484 (DNS over HTTPS) and RFC 9250 (DNS over QUIC). <https://www.rfc-editor.org/rfc/rfc7858>; <https://www.rfc-editor.org/rfc/rfc8484>; <https://www.rfc-editor.org/rfc/rfc9250>
- IETF RFC 8106, *IPv6 Router Advertisement Options for DNS Configuration*, March 2017. <https://www.rfc-editor.org/rfc/rfc8106>
- IETF RFC 8555, *Automatic Certificate Management Environment (ACME)*, March 2019 (DNS-01 challenge). <https://www.rfc-editor.org/rfc/rfc8555>
- IETF RFC 6698, *The DNS-Based Authentication of Named Entities (DANE) Transport Layer Security (TLS) Protocol: TLSA*, August 2012. <https://www.rfc-editor.org/rfc/rfc6698>
- IETF RFC 8659, *DNS Certification Authority Authorization (CAA) Resource Record*, November 2019. <https://www.rfc-editor.org/rfc/rfc8659>
- IETF RFC 9989, *Domain-based Message Authentication, Reporting, and Conformance (DMARC)*, May 2026, which obsoletes RFC 7489. <https://www.rfc-editor.org/rfc/rfc9989>
- IANA, *Domain Name System (DNS) Parameters*, Resource Record (RR) TYPEs registry. <https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml>

### Primary sources: cloud and platform provider documentation

- Microsoft Learn, "Azure Private Endpoint DNS Integration Scenarios" and "Azure Private Endpoint private DNS zone values." <https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns-integration>; <https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns>
- Microsoft Learn, "Azure DNS Private Resolver Overview" (inbound and outbound endpoints and their dedicated subnets). <https://learn.microsoft.com/en-us/azure/dns/dns-private-resolver-overview>
- Microsoft Learn, "Azure Private DNS: Secure DNS for Virtual Networks." <https://learn.microsoft.com/en-us/azure/dns/private-dns-overview>
- Microsoft Learn, "Overview of DNS resolver policy" (Azure DNS security policy). <https://learn.microsoft.com/en-us/azure/dns/dns-security-policy>
- Microsoft Learn, "Overview of DNSSEC - Azure Public DNS" (Azure DNS: public zones only; Private DNS not supported; automatic ZSK rollover). <https://learn.microsoft.com/en-us/azure/dns/dnssec>
- Microsoft Learn, "What is IP address management (IPAM) in Azure Virtual Network Manager?" <https://learn.microsoft.com/en-us/azure/virtual-network-manager/concept-ip-address-management>
- Microsoft Learn, "Compare Azure Government and global Azure." <https://learn.microsoft.com/en-us/azure/azure-government/compare-azure-government-global-azure>
- Microsoft Learn, "Microsoft 365 informed network routing" (WW Commercial only; Cisco IOS XE SD-WAN 20.4/17.4 or later). <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide>
- Microsoft Learn, "Microsoft 365 URLs and IP address ranges" (the Worldwide list, which includes GCC). <https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide>
- Microsoft Learn, "Microsoft 365 U.S. Government GCC High endpoints." <https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-u-s-government-gcc-high-endpoints?view=o365-worldwide>
- Microsoft Learn, "Office 365 GCC," Office 365 US Government service description. <https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/gcc>
- Microsoft Learn, "DNS and AD DS" and "Verify that SRV Domain Name System (DNS) records have been created." <https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/dns-and-ad-ds>; <https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/verify-srv-dns-records-have-been-created>
- Microsoft Learn, "Secure DNS Client over HTTPS (DoH) on Windows Server 2022." <https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support>
- AWS, *Amazon Route 53 Developer Guide*: "Configuring DNSSEC signing in Amazon Route 53" and "Enabling DNSSEC validation in Amazon Route 53." <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html>; <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dnssec-validation.html>
- AWS, *Amazon Route 53 Developer Guide*, "Using DNS Firewall to filter outbound DNS traffic." <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall.html>
- AWS, "Amazon VPC IPAM automates IP assignments from Infoblox IPAM," November 17, 2025, and *Amazon VPC IPAM User Guide*, "Integrate VPC IPAM with Infoblox infrastructure" (private scopes; not in the China or AWS GovCloud (US) Regions). <https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-vpc-ipam-automates-ip-from-infoblox/>; <https://docs.aws.amazon.com/vpc/latest/ipam/integrate-infoblox-ipam.html>
- Google Cloud, "Manage response policies and rules" (Cloud DNS). <https://cloud.google.com/dns/docs/zones/manage-response-policies>
- Google Cloud, "Internal ranges overview" (VPC). <https://cloud.google.com/vpc/docs/internal-ranges>
- Cisco, *Cisco Catalyst SD-WAN Policies Configuration Guide, Cisco IOS XE Catalyst SD-WAN Release 17.x*, "Redirect DNS in Cisco Catalyst SD-WAN Service-Side VPNs" (restrictions: IPv4 only; UDP only, not TCP; no DNS from the overlay tunnel; service-side VPN support from 17.8.1a / 20.8.1). <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/policies/ios-xe-17/policies-book-xe/redirect-dns.html>
- Microsoft Learn, "Azure Government DoD Overview." <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-overview-dod>

### Third-party sources

Used only for product-specific facts that no primary source documents. They are labeled "Third-party source" in each footnote.

- Infoblox, "Infoblox Government Cloud Achieves FedRAMP Moderate Certification, Bringing Modern DDI and Asset Visibility to Federal Agencies," press release, July 22, 2026. <https://www.infoblox.com/news/news-events/press-releases/infoblox-government-cloud-achieves-fedramp-moderate-certification-bringing-modern-ddi-and-asset-visibility-to-federal-agencies/>
- Enterprise Strategy Group, commissioned by Infoblox, *9 Pitfalls of Not Using Enterprise-Grade DDI*, February 2025. No public URL was verified for this book; figures are reported by the sponsor and were not independently verified.
- VMware Cloud Foundation blog, "VCF 9.1 Networking: Seamless DDI Integration with Infoblox," May 15, 2026. <https://blogs.vmware.com/cloud-foundation/2026/05/15/vcf-networking-9-1-seamless-ddi-integration-with-infoblox/>

---

**Previous:** [Appendix A — DNS Record Types and Ecosystem Integrations](appendix-a-dns-record-types.md)  
**Next:** [Next Generation DDI — book home](index.md)
