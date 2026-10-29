---
title: "Appendix B — Requirements Mapping and Sources"
description: "A compliance-enabling crosswalk, not a compliance claim: each federal requirement that touches DNS, DHCP and IPAM (OMB M-22-09, M-26-14, M-08-23 and M-21-07, CISA Protective DNS and BOD 18-01, TIC 3.0, NIST SP 800-81 Rev. 3, SP 800-53 Rev. 5 and FedRAMP), what it actually asks, where the book addresses it and the evidence it calls for, followed by every source the book cites."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b08-ddi
book: B08
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — Requirements Mapping and Sources

*A mapping is only useful if it says what each source actually requires, and no more.*

::: {.callout-note}
## In this appendix
What each federal requirement that touches the name layer asks of DNS, DHCP and IPAM, in its own words where the wording matters; the chapter that addresses it and the evidence an assessor can expect; notes on reading the SP 800-53 controls; and the full source list, with primary sources separated from third-party ones.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency reuse the book's design and evidence in its own system security plan. It doesn't claim that following the book satisfies any requirement or control. The agency's DNS, DHCP and IPAM services are part of the agency's own systems; the agency authorizes them, and any cloud service they depend on needs its own FedRAMP certification ([Chapter 03](03-federal-requirements.md)). Control selection, implementation statements and assessment belong to the agency and its assessors. Requirement wording is summarized; the cited documents govern. Every source was checked on October 20, 2026.
:::

## Requirements mapping

| Requirement (source) | What it asks of DNS, DHCP and IPAM | Addressed in | Evidence |
|---|---|---|---|
| Encrypted DNS (OMB M-22-09) | "Agencies must resolve DNS queries using encrypted DNS wherever it is technically supported." Agency resolvers must support DNS over HTTPS or DNS over TLS and use them upstream; endpoints must enable encrypted DNS in applications and the operating system where available and be explicitly configured to use agency-designated resolvers; gaps go in the zero trust plan, with enterprise-wide support by FY 2024[^aB-m2209] | Ch 03, Ch 05 | Resolver DoT and DoH configuration (DoQ where supported); endpoint DNS policy; rules that block port 853 and public DoH resolvers |
| Protective DNS for egress (OMB M-22-09; CISA Encrypted DNS Implementation Guidance; CISA Protective DNS) | Agencies "are already required to have DNS requests routed through CISA-operated infrastructure," and M-22-09 directed CISA's Protective DNS to support encrypted DNS and scale to cloud and mobile use.[^aB-m2209] The CISA service is a recursive resolver upstream of agency networks that blocks, redirects or sinkholes queries matching threat indicators and alerts the agency; it doesn't interfere with internal DNS[^aB-pdns][^aB-edns] | Ch 03, Ch 05, Ch 08 | Forwarding-chain configuration; redirect-dns targets; resolver logs showing the governed path |
| Event logging (OMB M-26-14) | M-26-14 rescinded M-21-31 and its EL0–EL3 tiers, which had required passive DNS logging. It doesn't name DNS: its minimum baseline requires logs that support determining "source and destination network address information, including protocols, ports, and session attributes" and the identity behind each operation, actively searchable for six months and retrievable for a year, with timestamps from a traceable time source and readily available to the agency's top-level SOC. Agencies submit a logging plan within 90 days of CISA's Logging Reference Architecture and reach maturity Levels 1, 2 and 3 within 120, 180 and 320 days of it[^aB-m2614] | Ch 03, Ch 11 | Query-log configuration, SIEM ingestion, retention settings, source-host attribution |
| DNSSEC (OMB M-08-23; SP 800-53 SC-20 and SC-21) | M-08-23 required DNSSEC deployment to all applicable federal systems and all agency .gov domains signed by December 2009.[^aB-m0823] SC-20 requires authoritative services to return origin-authentication and integrity artifacts and to support a chain of trust with child zones; SC-21 requires resolvers to request and perform that verification on the answers they receive[^aB-53] | Ch 03, Ch 06 | Signed-zone inventory, DS publication, KSK and ZSK rollover records, resolver validation settings |
| Name and address resolution architecture (SP 800-53 SC-22) | The systems that collectively provide name and address resolution must be "fault-tolerant and implement internal and external role separation"[^aB-53] | Ch 03, Ch 08 | Architecture diagram, resolver redundancy, internal and external role separation |
| TIC 3.0 DNS policy enforcement point (CISA TIC 3.0 Security Capabilities Catalog) | Five DNS PEP capabilities: domain name sinkholing; DNSSEC validation of agency clients' lookups for internal and external domains; DNSSEC signing of all agency domains; monitoring for creation of or changes to agency domains; and CISA's Protective DNS Service. A Web PEP capability, domain resolution filtering, prevents use of unauthorized resolvers over DoH[^aB-tic] | Ch 03, Ch 05, Ch 06, Ch 11 | RPZ and Protective DNS configuration, validation and signing evidence, domain-monitoring alerts, DoH blocking rules |
| IPv6 (OMB M-21-07) | At least 20% of IP-enabled federal assets IPv6-only by the end of FY 2023, 50% by the end of FY 2024 and 80% by the end of FY 2025[^aB-m2107] | Ch 07 | Dual-stack and IPv6-only address plans, DHCPv6 and router advertisement governance, AAAA coverage |
| Email authentication (CISA BOD 18-01) | Valid SPF on all second-level domains; DMARC on all second-level domains, at `p=reject` on all second-level domains and mail-sending hosts by October 16, 2018, with CISA as an aggregate-report recipient[^aB-bod1801] | Appendix A | DMARC, SPF and DKIM records per domain; aggregate report review |
| Asset inventory (SP 800-53 CM-8; CISA Zero Trust Maturity Model) | An inventory of system components that accurately reflects the system, includes all components and is reviewed and updated[^aB-53][^aB-ztmm] | Ch 01, Ch 07, Ch 11 | IPAM discovery reports, CMDB reconciliation results |
| Audit, change and access control (SP 800-53 AU-2, AU-6, AU-12, CM-3, AC-2, AC-3, AC-6) | Logged, reviewed, change-controlled, role-based and least-privilege administration of DNS, DHCP and IPAM[^aB-53] | Ch 03, Ch 09, Ch 11, Appendix A | Change logs and approvals, role and scope assignments, review records |
| Configuration baseline and settings (SP 800-53 CM-2, CM-6) | A current baseline configuration under configuration control, and settings that "reflect the most restrictive mode consistent with operational requirements" using common secure configurations the agency defines, with deviations documented and approved.[^aB-cm6] For DDI products the sources are a CIS Benchmark, the vendor's hardening guide or a National Checklist Program checklist, plus SP 800-81 Rev. 3 for DNS service settings; CIS publishes no benchmark for Infoblox NIOS, and a DISA STIG is an optional cross-check (High only)[^aB-ncp][^aB-cis] | Ch 03, Ch 11 | Settings baseline per product, approved deviations, configuration drift reports |
| Secure DNS deployment (NIST SP 800-81 Rev. 3) | Guidance, not a mandate: employ protective DNS wherever feasible; encrypt internal and external DNS traffic wherever feasible; deploy DNSSEC; use dedicated DNS servers. It describes an organization's DNS service as "both an information source for policy decision points or policy creation and a policy enforcement point"[^aB-81r3] | Ch 03 – Ch 11 | The evidence checklist in Chapter 11 |
| Cloud service certification (FedRAMP) | Any cloud-delivered management plane needs FedRAMP certification at the right level, and the agency authorizes its own system that uses it; an agency "should never create a standalone authorization to operate for a cloud service offering"[^aB-fedramp-use] | Ch 03, Ch 12, [Appendix C](appendix-c-applicability.md) | FedRAMP Marketplace listing, the agency's ATO for its own DDI system, boundary diagram |

*High only* marks material that applies to FedRAMP High or Defense environments, such as DISA STIGs and DoD Impact Levels, not to the Moderate civilian baseline this workbook targets. It's kept as an optional reference.

## Reading the SP 800-53 controls

- **SC-20 and SC-21 split the work by role.** SC-20 applies to the authoritative side: return signatures with answers to external queries and indicate the security status of child zones.[^aB-53] Its enhancement SC-20(2) extends data-origin and integrity protection to internal resolution queries.[^aB-53] SC-21 applies to recursive and caching resolvers: request and perform validation.[^aB-53] An estate that signs its zones but doesn't validate on its resolvers meets only half of the pair.
- **SC-22 is the architecture control.** It asks for fault tolerance and internal and external role separation across the systems that "collectively provide" resolution, which is the property the single policy plane in [Chapter 08](08-reference-architecture.md) is designed to make demonstrable.[^aB-53]
- **Baseline membership.** SC-20, SC-21, SC-22, CM-3, CM-8, AU-2, AU-6, AU-12, AC-2, AC-3 and AC-6 are all in the SP 800-53B Moderate baseline; SC-20(2) is not.[^aB-53b] FedRAMP baselines are built on these.
- **Release.** Identifiers are from SP 800-53 Rev. 5, release 5.2.0.[^aB-53]

## Sources

Every URL below was opened on October 20, 2026, except the M-26-14 memorandum, opened on October 21, 2026, and the NIST SP 800-53 CM-2 and CM-6, NIST National Checklist Program, CIS Benchmarks and AWS FedRAMP pages, opened on October 29, 2026. Primary sources (federal documents, standards and the cloud and platform providers' own documentation of their services) are listed separately from third-party sources, which the chapters label as such in their footnotes.

### Primary sources: federal requirements and guidance

- OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, section III.C (Networks) and "Encrypting DNS traffic." <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
- CISA, *Encrypted DNS Implementation Guidance*, May 16, 2024. <https://www.cisa.gov/resources-tools/resources/encrypted-dns-implementation-guidance>
- CISA, Protective Domain Name System (DNS) Resolver service. <https://www.cisa.gov/resources-tools/services/protective-domain-name-system-dns-resolver>
- CISA, *Trusted Internet Connections 3.0, TIC Core Guidance Volume 3: Security Capabilities Catalog*, Version 3.3, September 2026, Table 9 (Domain Name System PEP Security Capabilities). <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Security_Capabilities_Catalogs_September_2026_17.pdf>
- OMB M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026 (rescinds M-21-31; minimum logging baseline and maturity model). <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>
- OMB M-08-23, *Securing the Federal Government's Domain Name System Infrastructure*, August 22, 2008. <https://georgewbush-whitehouse.archives.gov/omb/memoranda/fy2008/m08-23.pdf>
- OMB M-21-07, *Completing the Transition to Internet Protocol Version 6 (IPv6)*, November 19, 2020. <https://www.whitehouse.gov/wp-content/uploads/2020/11/M-21-07.pdf>
- CISA, Binding Operational Directive 18-01, *Enhance Email and Web Security*, October 16, 2017. <https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security>
- NIST SP 800-81 Rev. 3, *Secure Domain Name System (DNS) Deployment Guide*, March 19, 2026 (supersedes SP 800-81-2). <https://csrc.nist.gov/pubs/sp/800/81/r3/final>
- NIST SP 800-207, *Zero Trust Architecture*, August 2020. <https://csrc.nist.gov/pubs/sp/800/207/final>
- NIST SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations* (release 5.2.0): SC-20, SC-21, SC-22 and the other controls cited. <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>
- NIST SP 800-70 Rev. 5, *National Checklist Program for IT Products: Guidelines for Checklist Users and Developers*, May 2026, and the National Checklist Program repository. <https://csrc.nist.gov/pubs/sp/800/70/r5/final>; <https://ncp.nist.gov/>
- CISA, *Zero Trust Maturity Model*, Version 2.0, April 2023. <https://www.cisa.gov/zero-trust-maturity-model>
- FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*. <https://www.fedramp.gov/2026/agencies/use/>
- FedRAMP Marketplace, Infoblox Government Cloud (package FR2017257053): FedRAMP Certified, Class C (Moderate), Rev5, agency path, certified since December 15, 2022. <https://www.fedramp.gov/marketplace/products/FR2017257053/>
- FedRAMP Marketplace, Microsoft 365 Government Community Cloud & Supporting Services (package MSO365MT): FedRAMP Certified, Class C (Moderate). <https://www.fedramp.gov/marketplace/products/MSO365MT/>

### Primary sources: IETF, IANA and CA/Browser Forum standards

- IETF RFC 882, *Domain Names — Concepts and Facilities*, November 1983; superseded by RFC 1034 and RFC 1035 (November 1987). <https://www.rfc-editor.org/rfc/rfc882>; <https://www.rfc-editor.org/rfc/rfc1034>; <https://www.rfc-editor.org/rfc/rfc1035>
- IETF RFC 4033, *DNS Security Introduction and Requirements*, March 2005; RFC 4034, *Resource Records for the DNS Security Extensions*, March 2005; and RFC 9364, *DNS Security Extensions (DNSSEC)*, BCP 237, February 2023. <https://www.rfc-editor.org/rfc/rfc4033>; <https://www.rfc-editor.org/rfc/rfc4034>; <https://www.rfc-editor.org/rfc/rfc9364>
- IETF RFC 9276, *Guidance for NSEC3 Parameter Settings*, BCP 236, August 2022, and RFC 9824, *Compact Denial of Existence in DNSSEC*. <https://www.rfc-editor.org/rfc/rfc9276>; <https://www.rfc-editor.org/info/rfc9824>
- IETF RFC 6891, *Extension Mechanisms for DNS (EDNS(0))*, April 2013. <https://www.rfc-editor.org/rfc/rfc6891>
- IETF RFC 7344, *Automating DNSSEC Delegation Trust Maintenance* (CDS and CDNSKEY), September 2014. <https://www.rfc-editor.org/rfc/rfc7344>
- IETF RFC 7858 (DNS over TLS), RFC 8484 (DNS over HTTPS) and RFC 9250 (DNS over QUIC). <https://www.rfc-editor.org/rfc/rfc7858>; <https://www.rfc-editor.org/rfc/rfc8484>; <https://www.rfc-editor.org/rfc/rfc9250>
- IETF RFC 8106, *IPv6 Router Advertisement Options for DNS Configuration*, March 2017. <https://www.rfc-editor.org/rfc/rfc8106>
- IETF RFC 8555, *Automatic Certificate Management Environment (ACME)*, March 2019 (DNS-01 challenge). <https://www.rfc-editor.org/rfc/rfc8555>
- IETF RFC 6698, *The DNS-Based Authentication of Named Entities (DANE) Transport Layer Security (TLS) Protocol: TLSA*, August 2012. <https://www.rfc-editor.org/rfc/rfc6698>
- IETF RFC 8659, *DNS Certification Authority Authorization (CAA) Resource Record*, November 2019, and CA/Browser Forum Ballot 187, *Make CAA Checking Mandatory* (effective September 8, 2017). <https://www.rfc-editor.org/rfc/rfc8659>; <https://cabforum.org/2017/03/08/ballot-187-make-caa-checking-mandatory/>
- IETF RFC 7208 (SPF), RFC 6376 (DKIM), RFC 9989 (DMARC, May 2026, which obsoletes RFC 7489 and RFC 9091) and RFC 8461 (MTA-STS). <https://www.rfc-editor.org/rfc/rfc7208>; <https://www.rfc-editor.org/rfc/rfc6376>; <https://www.rfc-editor.org/rfc/rfc9989>; <https://www.rfc-editor.org/rfc/rfc8461>
- IETF RFC 9460, *Service Binding and Parameter Specification via the DNS (SVCB and HTTPS Resource Records)*, November 2023; RFC 9848, *Bootstrapping TLS Encrypted ClientHello with DNS Service Bindings*, March 2026; and RFC 9849, *TLS Encrypted Client Hello*. <https://www.rfc-editor.org/rfc/rfc9460>; <https://www.rfc-editor.org/info/rfc9848>; <https://www.rfc-editor.org/info/rfc9849>
- IANA, *Domain Name System (DNS) Parameters*, Resource Record (RR) TYPEs registry. <https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml>

[Appendix A](appendix-a-dns-record-types.md) cites the remaining record-type RFCs individually.

### Primary sources: cloud and platform provider documentation

- Microsoft Learn, "Azure Private Endpoint DNS Integration Scenarios" and "Azure Private Endpoint private DNS zone values." <https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns-integration>; <https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns>
- Microsoft Learn, "Azure DNS Private Resolver Overview" (inbound and outbound endpoints and their dedicated subnets). <https://learn.microsoft.com/en-us/azure/dns/dns-private-resolver-overview>
- Microsoft Learn, "Azure Private DNS: Secure DNS for Virtual Networks." <https://learn.microsoft.com/en-us/azure/dns/private-dns-overview>
- Microsoft Learn, "DNS resolver policy" (formerly DNS security policy; the URL keeps the former name). <https://learn.microsoft.com/en-us/azure/dns/dns-security-policy>
- Microsoft Learn, "DNSSEC overview" and "How to sign your Azure Public DNS zone with DNSSEC" (Azure DNS signs public zones only; automatic ZSK rollover). <https://learn.microsoft.com/en-us/azure/dns/dnssec>; <https://learn.microsoft.com/en-us/azure/dns/dnssec-how-to>
- Microsoft Learn, "What is IP address management (IPAM) in Azure Virtual Network Manager?" <https://learn.microsoft.com/en-us/azure/virtual-network-manager/concept-ip-address-management>
- Microsoft Learn, "Compare Azure Government and global Azure" and "Azure Government product General Availability (GA) roadmap." <https://learn.microsoft.com/en-us/azure/azure-government/compare-azure-government-global-azure>; <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-product-roadmap>
- Microsoft Learn, "Azure Government DoD Overview." <https://learn.microsoft.com/en-us/azure/azure-government/documentation-government-overview-dod>
- Microsoft Learn, "Microsoft 365 informed network routing" (WW Commercial only, not GCC Moderate, GCC High or DoD; Cisco IOS XE SD-WAN 20.4/17.4 or later). <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide>
- Microsoft Learn, "Microsoft 365 URLs and IP address ranges" (the Worldwide list, which includes GCC). <https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide>
- Microsoft Learn, "Microsoft 365 U.S. Government GCC High endpoints." <https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-u-s-government-gcc-high-endpoints?view=o365-worldwide>
- Microsoft Learn, "Office 365 GCC," Office 365 US Government service description. <https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/gcc>
- Microsoft Learn, "DNS and AD DS," "Verify that SRV Domain Name System (DNS) records have been created" and "Problems occur with DCs in AD integrated DNS zones" (DC locator records). <https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/dns-and-ad-ds>; <https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/verify-srv-dns-records-have-been-created>; <https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/problems-with-dc-ad-integrated-dns-zones>
- Microsoft Learn, "Secure DNS Client over HTTPS (DoH) on Windows Server 2022." <https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support>
- AWS, *Amazon Route 53 Developer Guide*: "Configuring DNSSEC signing in Amazon Route 53," "Enabling DNSSEC validation in Amazon Route 53" and "Choosing between alias and non-alias records." <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html>; <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dnssec-validation.html>; <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html>
- AWS, *Amazon Route 53 Developer Guide*, "Using DNS Firewall to filter outbound DNS traffic." <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall.html>
- AWS, "Amazon VPC IPAM automates IP assignments from Infoblox IPAM," November 17, 2025 (not available in the AWS China or AWS GovCloud (US) Regions), and *Amazon VPC IPAM User Guide*, "Integrate VPC IPAM with Infoblox infrastructure" (private scopes only; VPC IPAM Advanced Tier). <https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-vpc-ipam-automates-ip-from-infoblox/>; <https://docs.aws.amazon.com/vpc/latest/ipam/integrate-infoblox-ipam.html>
- AWS, "FedRAMP" (US East/West FedRAMP Certified Class C, formerly Moderate; GovCloud (US) Class D, formerly High) and "FedRAMP — Services in Scope" (per service, per Region). <https://aws.amazon.com/compliance/fedramp/>; <https://aws.amazon.com/compliance/services-in-scope/FedRAMP/>
- Google Cloud, "Manage response policies and rules" (Cloud DNS). <https://cloud.google.com/dns/docs/zones/manage-response-policies>
- Google Cloud, "Internal ranges overview" (VPC). <https://cloud.google.com/vpc/docs/internal-ranges>
- Cisco, *Cisco Catalyst SD-WAN Policies Configuration Guide, Cisco IOS XE Catalyst SD-WAN Release 17.x*, "Redirect DNS in Cisco Catalyst SD-WAN Service-Side VPNs" (restrictions: IPv4 only; UDP only, not TCP; no DNS from the overlay tunnel; service-side VPN support from 17.8.1a / 20.8.1). <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/policies/ios-xe-17/policies-book-xe/redirect-dns.html>

### Third-party sources

Used only for product-specific facts that no primary source documents. They are labeled "Third-party source" in each footnote.

- Center for Internet Security, "CIS Benchmarks" (benchmark list; Windows Server 2022 and 2025 benchmarks; no Infoblox NIOS benchmark). <https://www.cisecurity.org/cis-benchmarks>

- Infoblox, "Infoblox Government Cloud Achieves FedRAMP Moderate Certification, Bringing Modern DDI and Asset Visibility to Federal Agencies," press release, July 22, 2026. <https://www.infoblox.com/news/news-events/press-releases/infoblox-government-cloud-achieves-fedramp-moderate-certification-bringing-modern-ddi-and-asset-visibility-to-federal-agencies/>
- Infoblox deployment guides for NIOS outbound API integrations (Palo Alto Networks firewall, December 2023; Tenable.io), and integration documentation from HashiCorp (Terraform Registry, Consul), Ansible, Splunk and ServiceNow, cited individually in [Appendix A](appendix-a-dns-record-types.md).
- Enterprise Strategy Group, commissioned by Infoblox, *9 Pitfalls of Not Using Enterprise-Grade DDI*, February 2025. No public URL was verified for this book; figures are reported by the sponsor and were not independently verified.
- VMware Cloud Foundation blog, "VCF 9.1 Networking: Seamless DDI Integration with Infoblox," May 15, 2026. <https://blogs.vmware.com/cloud-foundation/2026/05/15/vcf-networking-9-1-seamless-ddi-integration-with-infoblox/>

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — DNS Record Types and Ecosystem Integrations](appendix-a-dns-record-types.md) · [Book index](index.md) · [Next: Appendix C — Applicability →](appendix-c-applicability.md)
:::

[^aB-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §III.C (Networks), action 1, and "Encrypting DNS traffic," <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 20, 2026).
[^aB-pdns]: Cybersecurity and Infrastructure Security Agency, "Protective Domain Name System (DNS) Resolver," <https://www.cisa.gov/resources-tools/services/protective-domain-name-system-dns-resolver> (accessed Oct 20, 2026).
[^aB-edns]: Cybersecurity and Infrastructure Security Agency, *Encrypted DNS Implementation Guidance*, May 16, 2024, <https://www.cisa.gov/resources-tools/resources/encrypted-dns-implementation-guidance> (accessed Oct 20, 2026).
[^aB-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026, rescission of M-21-31, "Agency Logging Plan," "Agency Actions" and Appendix B (Minimum Logging Baseline Requirements, items 1, 2, 3 and 5), <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Oct 21, 2026).
[^aB-m0823]: Office of Management and Budget, M-08-23, *Securing the Federal Government's Domain Name System Infrastructure*, August 22, 2008, <https://georgewbush-whitehouse.archives.gov/omb/memoranda/fy2008/m08-23.pdf> (accessed Oct 20, 2026).
[^aB-cm6]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CM-2 and CM-6 (statement and discussion), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; read from NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 29, 2026).
[^aB-ncp]: National Institute of Standards and Technology, SP 800-70 Rev. 5, *National Checklist Program for IT Products: Guidelines for Checklist Users and Developers*, May 2026, <https://csrc.nist.gov/pubs/sp/800/70/r5/final>; and NIST, "National Checklist Program," <https://csrc.nist.gov/projects/national-checklist-program> (repository at <https://ncp.nist.gov/>) (accessed Oct 29, 2026).
[^aB-cis]: Center for Internet Security, "CIS Benchmarks" (benchmark list; no benchmark for Infoblox NIOS, only a CIS-formatted "Infoblox 8.x DNS STIG (1.0.0)"), <https://www.cisecurity.org/cis-benchmarks> (accessed Oct 29, 2026).
[^aB-53]: NIST, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations* (release 5.2.0), SC-20, SC-20(2), SC-21, SC-22, CM-3, CM-8, AU-2, AU-6, AU-12, AC-2, AC-3 and AC-6, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; control text checked against NIST's OSCAL Rev. 5 catalog (version 5.2.0), <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (both accessed Oct 20, 2026).
[^aB-53b]: NIST, SP 800-53B, *Control Baselines for Information Systems and Organizations*; membership checked against NIST's OSCAL Rev. 5 Moderate baseline profile, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 20, 2026).
[^aB-tic]: Cybersecurity and Infrastructure Security Agency, *Trusted Internet Connections 3.0, TIC Core Guidance Volume 3: Security Capabilities Catalog*, Version 3.3, September 2026, Table 9 (Domain Name System PEP Security Capabilities, 3.PEP.DO.DNSIN, DNVAC, DNVAD, DNMON and PDSER) and Web PEP capability 3.PEP.WE.DRESF, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Security_Capabilities_Catalogs_September_2026_17.pdf> (accessed Oct 20, 2026).
[^aB-m2107]: Office of Management and Budget, M-21-07, *Completing the Transition to Internet Protocol Version 6 (IPv6)*, November 19, 2020, <https://www.whitehouse.gov/wp-content/uploads/2020/11/M-21-07.pdf> (accessed Oct 20, 2026).
[^aB-bod1801]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 18-01, *Enhance Email and Web Security*, October 16, 2017, <https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security> (accessed Oct 20, 2026).
[^aB-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, <https://www.cisa.gov/zero-trust-maturity-model> (accessed Oct 20, 2026).
[^aB-81r3]: NIST, SP 800-81 Rev. 3, *Secure Domain Name System (DNS) Deployment Guide*, March 19, 2026, Executive Summary and §1.2, <https://csrc.nist.gov/pubs/sp/800/81/r3/final> (accessed Oct 20, 2026).
[^aB-fedramp-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 20, 2026).
