---
title: "Appendix B — Requirements Mapping and Sources"
description: "A compliance-enabling crosswalk, not a compliance claim: each federal requirement that touches branch network and transport design (TIC 3.0, OMB M-19-26, M-22-09, M-26-14, M-26-15, CISA Protective DNS, BOD 23-02, BOD 26-02, BOD 26-04, NIST SP 800-53 Rev. 5, SP 800-52 Rev. 2, FIPS 140 and FedRAMP), what it actually asks, where the book addresses it and the evidence it calls for, followed by the book's sources."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b09-network
book: B09
part: Appendix
series-order: 91
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix B — Requirements Mapping and Sources

*A requirement is only useful in a mapping if it says what the source asks for, and nothing more.*

::: {.callout-note}
## In this appendix
What each federal requirement that touches branch network and transport design asks for, in its own words where the wording matters; the chapters that address it and the evidence an assessor can expect; the requirements that are often cited but don't exist; notes on reading the SP 800-53 controls; and the source list, with primary sources separated from third-party ones.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency reuse the book's design and evidence in its own system security plan. It doesn't claim that following the book satisfies any requirement or control. The branch network, its enforcement points and its transport are part of the agency's own systems; the agency authorizes them, and any cloud-delivered security service they depend on needs its own FedRAMP certification ([Chapter 03](03-what-tic-3-requires.md)). Control selection, implementation statements and assessment belong to the agency and its assessors. Requirement wording is summarized; the cited documents govern. Every source in this appendix was checked on October 21, 2026.
:::

## Requirements mapping

| Requirement (source) | What it asks of the branch network | Addressed in | Evidence |
|---|---|---|---|
| Capability-based TIC (OMB M-19-26) | Rescinds the consolidation memoranda (M-08-05, M-08-16, M-08-27, M-09-32) and replaces mandatory routing through access points with capability-based use cases[^aB-m1926] | Ch 01, Ch 02, Ch 03 | The agency's TIC use-case mapping; architecture documentation for each branch pattern |
| TIC 3.0 Security Capabilities Catalog, v3.3 (CISA) | Goals, not methods: 20 universal capabilities for every use case and PEP capabilities in 12 groups. Once a capability is needed, apply it at all access points to that network or data (policy enforcement parity). No telemetry duration or timeliness requirement, but law, OMB and CISA telemetry requirements still apply[^aB-scc] | Ch 03, Ch 05, Ch 08 | Capability-to-control mapping for each enforcement point; parity evidence across campus, branch and SASE paths |
| TIC 3.0 Branch Office Use Case, v3.0 (CISA) | Three security patterns (branch to cloud, to web, to campus), each with options for where enforcement happens; greatest rigor on branch-to-web; where multiple conveyances such as redundant links or SD-WAN exist, security parity on every path; "agencies must preserve CISA visibility"[^aB-branch] | Ch 03, Ch 05, Ch 08, Ch 10, Ch 11 | Per-pattern data-flow diagrams; enforcement placement per path; path-priority and failover configuration showing parity |
| TIC 3.0 Cloud and Remote User use cases (CISA) | Protections for agency use of cloud services and for users off the agency network; a SASE deployment at branches operates under Branch Office and Cloud, since there is no SASE use case[^aB-core] | Ch 03, Ch 05, Ch 12 | Use-case mapping for each cloud service and remote access method |
| TIC telemetry continuity (TIC 3.0 Program Guidebook; CISA SASE guidance) | TIC doesn't replace or negate telemetry requirements. When branches leave MTIPS, the E1E telemetry from access-point sensors stops; agencies can send comparable telemetry to CISA's Comprehensive Log Aggregation Warehouse (CLAW), which needs coordination among the agency, CISA and the provider[^aB-guidebook][^aB-sase] | Ch 03, Ch 09, Ch 11, Ch 13 | CLAW onboarding record; CISA confirmation of equivalent visibility before MTIPS is decommissioned |
| Protective DNS for all egress (6 U.S.C. § 663 note; OMB M-22-09; CISA Encrypted DNS Implementation Guidance) | Agencies must route all egress DNS to CISA's Protective DNS, disable root hints on agency DNS infrastructure, and permit external third-party resolvers only from authorized internal DNS servers; agencies "are already required to have DNS requests routed through CISA-operated infrastructure"[^aB-edns][^aB-m2209][^aB-pdns] | Ch 03, Ch 05, Ch 08 | Forwarding chain from internal resolvers to Protective DNS; SD-WAN or SASE DNS configuration; tests showing no endpoint agent resolves through a vendor cloud |
| Encrypted DNS and HTTPS (OMB M-22-09) | "Agencies must resolve DNS queries using encrypted DNS wherever it is technically supported"; enforce HTTPS for all web and API traffic in the environment; a zero trust architecture plan describing the approach to environmental isolation[^aB-m2209] | Ch 03, Ch 04, Ch 05 | Resolver and endpoint encrypted DNS configuration; HTTPS enforcement; the isolation plan |
| Logging and network visibility (OMB M-26-14, which rescinds M-21-31) | Prioritize continuous event monitoring and threat hunting, investigation, response and forensics; an Agency Logging Plan 90 days after CISA's Logging Reference Architecture (published August 20, 2026); maturity Levels 1, 2 and 3 at 120, 180 and 320 days; minimum logs include "source and destination network address information, including protocols, ports, and session attributes"[^aB-m2614][^aB-lra] | Ch 03, Ch 05, Ch 13 | Agency Logging Plan; maturity self-assessment per system; flow and session logs from every branch enforcement point |
| Management interfaces (CISA BOD 23-02) | Management interfaces of routers, switches, firewalls, VPN concentrators, proxies and load balancers that are reachable from the internet: within 14 days remove them from the internet or, preferably, enforce access "through a policy enforcement point separate from the interface itself"[^aB-bod2302] | Ch 03, Ch 05, Ch 07 | External scan results; management-plane access path; PEP policy |
| End-of-support edge devices (CISA BOD 26-02) | Internet-accessible devices on the agency boundary that are end of support: inventory by May 5, 2026; decommission those ending support by February 5, 2027; all identified devices removed by August 5, 2027; continuous discovery by February 5, 2028[^aB-bod2602] | Ch 03, Ch 10, Ch 13 | EOS inventory submissions to CISA; decommission reports; replacement specifications |
| Risk-based vulnerability remediation (CISA BOD 26-04, which revokes BOD 22-01 and BOD 19-02) | Remediation timelines set by asset exposure, KEV status, exploit automation and technical impact; Phase II by August 9, 2026; Phase III, including continuous tagging of internet-reachable assets, by December 7, 2026[^aB-bod2604] | Ch 05, Ch 09 | Vulnerability management policy; asset tags for branch edges and controllers; CDM reporting |
| Post-quantum key exchange (OMB M-26-15; EO 14412) | All network infrastructure terminating TLS or IPsec, "including firewalls, Virtual Private Network concentrators, cloud gateways," must support PQC-capable key exchange using NIST algorithms; migration plan within 120 days (October 22, 2026); mitigate quantum risk as far as feasible by December 31, 2030[^aB-m2615][^aB-eo14412] | Ch 03, Ch 05, Ch 10, Ch 13 | Cryptographic inventory of branch devices; PQC capability in replacement specifications; the migration plan |
| TLS 1.3 (NIST SP 800-52 Rev. 2; EO 14306) | SP 800-52 Rev. 2 requires TLS 1.3 support by January 1, 2024; EO 14306 separately sets "not later than January 2, 2030" for TLS 1.3 or a successor as a post-quantum readiness date[^aB-sp80052][^aB-eo14306] | Ch 03, Ch 06 | TLS configuration of branch-facing services and enforcement points |
| Encryption in transit (EO 14028 §3(d); BOD 18-01) | Adopt encryption in transit "to the maximum extent consistent with Federal records laws and other applicable laws," naming no protocol or layer; HTTPS and HSTS on public websites and STARTTLS on internet-facing mail servers[^aB-eo14028][^aB-bod1801] | Ch 03 | Encryption coverage by flow; public-facing HTTPS and mail scans |
| Cryptographic modules (FIPS 140; CMVP) | All FIPS 140-2 certificates moved to the Historical List on September 22, 2026; CMVP supports their purchase and use for existing systems, and agencies set their own move to FIPS 140-3[^aB-cmvp] | Ch 03, Ch 05, Ch 11 | Module certificates for every encrypting device; validation language in acquisition documents |
| Boundary protection (SP 800-53 SC-7, SC-7(4), SC-7(8)) | Monitor and control communications at external managed interfaces; a managed interface and traffic flow policy for each external telecommunication service, with documented and reviewed exceptions; route defined traffic through authenticated proxies[^aB-53] | Ch 03, Ch 05, Ch 08, Ch 12, Appendix A | Managed-interface inventory per branch; traffic flow policy; exception register and review records |
| Transmission protection (SP 800-53 SC-8, SC-8(1), SC-13) | Protect transmitted information by physical or logical means; cryptographic mechanisms "include TLS and IPSec"; the agency selects cryptographic uses and types[^aB-53] | Ch 03, Ch 05, Ch 06 | End-to-end TLS evidence; the cleartext-protocol exposure register with a disposition for each flow |
| Flow enforcement and nonsecure protocols (SP 800-53 AC-4, CM-7(1)) | Enforce approved information flows; periodically review and disable nonsecure ports, protocols and services (FTP is named)[^aB-53] | Ch 03, Ch 06 | Flow policy; protocol review records |
| Monitoring and remote access (SP 800-53 SI-4, CA-7, AC-17, AU-12) | Detect attacks and indicators of attack; continuous monitoring strategy and metrics; control and monitor remote access; generate audit records[^aB-53] | Ch 03, Ch 05, Ch 07, Ch 13 | Per-application and per-path telemetry; SIEM ingestion; continuous monitoring reports |
| Telecommunications diversity (SP 800-53 CP-8, CP-8(1), CP-8(2), CP-8(3)) | Alternate telecommunications services; avoid sharing a single point of failure with the primary; CP-8(3), provider separation, is in the High baseline only[^aB-53][^aB-53b] | Ch 02, Ch 08, Ch 11 | Circuit diversity records; provider and physical-path documentation |
| Device and network access authentication (SP 800-53 IA-3; 802.1X) | Identify and authenticate devices before establishing a connection[^aB-53] | Ch 07; [Book 07 Chapter 06](../b07-pki/06-device-and-user-certificates.md) | NAC and RADIUS policy; certificate enrollment records |
| Zero trust architecture (CISA Zero Trust Maturity Model v2.0; NIST SP 800-207; SP 1800-35) | ZTMM is "a general guide," not "a strict set of requirements"; its cross-cutting capabilities (Visibility and Analytics, Automation and Orchestration, Governance) apply to every pillar[^aB-ztmm][^aB-207][^aB-1800] | Ch 03, Ch 04, Ch 08 | Network-pillar maturity self-assessment |
| Authentication assurance (NIST SP 800-63B-4) | Authenticator and reauthentication requirements by assurance level; the operative source for session and reauthentication intervals, which M-22-09 doesn't set[^aB-63b] | Ch 04, Ch 06; [Book 04 Chapter 03](../b04-access/03-the-conditional-access-model.md) | Conditional Access and session policy |
| Cloud service certification (FedRAMP Consolidated Rules for 2026) | FedRAMP certifies cloud services; "each agency still authorizes its own federal information systems," and an agency "should never create a standalone authorization to operate for a cloud service offering." It sets no requirement on the route to a service[^aB-fedramp-use] | Ch 03, Ch 05, Ch 12 | FedRAMP Marketplace listing for each SASE or SSE service; the agency's own system authorization and boundary diagram |
| Telecommunications contract vehicle (GSA EIS) | Networx and WITS 3 have expired; EIS option period 1 runs to July 31, 2027; MTIPS is an EIS service[^aB-gsa-legacy][^aB-gsa-eis][^aB-scc] | Ch 03, Ch 09, Ch 11 | EIS task orders and service inventory |

## Requirements that are cited but don't exist

The book's sources, and much of what circulates about federal networking, cite requirements that a reader who checks will not find. They are listed so a reviewer can recognize them.

| Claimed requirement | What the record shows |
|---|---|
| A TIC 3.0 "SASE use case" | There are four use cases: Traditional, Branch Office, Remote User and Cloud.[^aB-core] CISA's SASE document is guidance, not a use case.[^aB-sase] |
| TIC 3.0 or any federal instrument requires SD-WAN or SASE | The TIC documents are vendor and technology neutral; the Branch Office Use Case names SD-WAN only as an example of a conveyance whose paths need security parity.[^aB-guidebook][^aB-branch] M-22-09, M-26-14, M-26-15 and the Zero Trust Maturity Model don't mention either.[^aB-m2209][^aB-m2614][^aB-m2615][^aB-ztmm] |
| A CISA "SASE Roadmap for Federal Civilian Agencies" (2023) | No document of that title appears in CISA's TIC guidance; the SASE document CISA has published is the June 2026 guidance.[^aB-core][^aB-sase] |
| FedRAMP prohibits SD-WAN or requires hairpin routing | FedRAMP certifies services and sets no routing requirement.[^aB-fedramp-use] |
| An encrypted WAN overlay is required where the payload is already TLS-protected | SC-8 can be met by physical or logical means; SC-8(3) and SC-8(4) are in no baseline.[^aB-53][^aB-53b] |
| M-22-09 mandates a 15-minute token refresh | M-22-09 sets no token lifetime; reauthentication intervals come from SP 800-63B-4.[^aB-m2209][^aB-63b] |
| M-21-31 event-logging tiers EL0 to EL3 | Rescinded May 22, 2026, by M-26-14.[^aB-m2614] |
| A citable FedRAMP Moderate control count | FedRAMP Notice 0013 removed most FedRAMP-assigned parameters and gives no new counts.[^aB-ntc0013] |
| EO 14306 amends EO 14028 | EO 14306 amends EO 13694 and EO 14144.[^aB-eo14306] |

## Reading the SP 800-53 controls

- **SC-7(4) is the branch control.** Its items require a managed interface and a traffic flow policy for each external telecommunication service, protection of what crosses each interface, and documented, periodically reviewed exceptions to the flow policy.[^aB-53] A branch with its own internet circuit is an external telecommunication service. The exception items are what the Microsoft 365 Optimize exemption in [Chapter 12](12-microsoft-365-traffic.md) and [Appendix A](appendix-a-optimize-exemption-instruments.md) documents.
- **SC-8(1) names TLS and IPsec as alternatives.** Its discussion lists both, and its assessment objects include mechanisms implementing alternative physical safeguards.[^aB-53] Protection of headers and routing information is SC-8(3), which is in no baseline.[^aB-53b]
- **Baseline membership.** SC-7, SC-13, AC-17, SI-3, SI-4, CA-7 and AU-12 are in the Low, Moderate and High baselines. SC-7(4), SC-7(8), SC-8, SC-8(1), AC-4, CM-7(1), CP-8, CP-8(1) and CP-8(2) are in Moderate and High. CP-8(3) and CP-8(4) are High only. SC-8(2) through SC-8(5) are in none.[^aB-53b] FedRAMP's Rev5 baselines are built on these, with most FedRAMP-assigned parameter values removed by Notice 0013.[^aB-ntc0013]
- **Release.** Identifiers are from SP 800-53 Rev. 5, release 5.2.0.[^aB-53]

## Sources

Every URL below was opened on October 21, 2026. Primary sources (federal documents, standards, and providers' own documentation of their services) are listed separately from third-party sources, which the chapters label in their footnotes. Chapters cite product, measurement and cost sources specific to their subject in their own footnotes; those are not repeated here unless a requirement depends on them.

### Primary sources: TIC 3.0 and CISA guidance

- CISA, *Trusted Internet Connections 3.0* core guidance and use cases, revision date September 23, 2026. <https://www.cisa.gov/resources-tools/resources/trusted-internet-connections-tic-30-core-guidance-documents>
- CISA, *TIC Core Guidance Volume 1: Program Guidebook*, Version 1.2, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Program_Guidebook_September_2026_47.pdf>
- CISA, *TIC Core Guidance Volume 2: Reference Architecture*, Version 1.2, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Reference_Architecture_September_2026_14.pdf>
- CISA, *TIC Core Guidance Volume 3: Security Capabilities Catalog*, Version 3.3, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Security_Capabilities_Catalogs_September_2026_17.pdf>
- CISA, *TIC Core Guidance Volume 4: Use Case Handbook*, Version 1.2, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Use_Case_Handbook_September_2026_86.pdf>
- CISA, *TIC Core Guidance Volume 5: Overlay Handbook*, Version 1.2, September 2026. <https://www.cisa.gov/sites/default/files/2026-10/TIC_3.0_Overlay_Handbook_September_2026_508c.pdf>
- CISA, *TIC 3.0 Traditional TIC Use Case*, Version 1.0. <https://www.cisa.gov/sites/default/files/2026-09/CISA_TIC_3.0_Traditional_TIC_Use_Case.pdf>
- CISA, *TIC 3.0 Branch Office Use Case*, Version 3.0, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Branch_Office_Use_September_2026_6.pdf>
- CISA, *TIC 3.0 Remote User Use Case*, Version 2.2, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Remote_User_Use_Case_September_2026_61.pdf>
- CISA, *TIC 3.0 Cloud Use Case*, Version 1.2, September 2026. <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Cloud_Use_Case_September_2026COPY.pdf>
- CISA, *The Journey to Zero Trust: Using Secure Access Service Edge in a Modern TIC 3.0 Solution*, Version 1.0, June 2026. <https://www.cisa.gov/resources-tools/resources/using-sase-modern-tic-30-solution>
- CISA, *Encrypted DNS Implementation Guidance*, May 16, 2024. <https://www.cisa.gov/resources-tools/resources/encrypted-dns-implementation-guidance>
- CISA, Protective Domain Name System (DNS) Resolver service. <https://www.cisa.gov/resources-tools/services/protective-domain-name-system-dns-resolver>
- CISA, Logging Reference Architecture, August 20, 2026. <https://www.cisa.gov/logging>
- CISA, *Zero Trust Maturity Model*, Version 2.0, April 2023. <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf>

### Primary sources: OMB memoranda, executive orders and CISA directives

- OMB M-19-26, *Update to the Trusted Internet Connections (TIC) Initiative*, September 12, 2019. <https://www.whitehouse.gov/wp-content/uploads/2019/09/M-19-26.pdf>
- OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022. <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
- OMB M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026 (rescinds M-21-31). <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>
- OMB M-26-15, *Execution of the Migration to Post-Quantum Cryptography*, June 24, 2026. <https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf>
- Executive Order 14028, *Improving the Nation's Cybersecurity*, May 12, 2021. <https://www.govinfo.gov/content/pkg/FR-2021-05-17/pdf/2021-10460.pdf>
- Executive Order 14306, *Sustaining Select Efforts to Strengthen the Nation's Cybersecurity and Amending Executive Order 13694 and Executive Order 14144*, June 6, 2025. <https://www.whitehouse.gov/presidential-actions/2025/06/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694-and-executive-order-14144/>
- Executive Order 14412, *Securing the Nation Against Advanced Cryptographic Attacks*, June 22, 2026. <https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/>
- CISA, Binding Operational Directive 18-01, *Enhance Email and Web Security*, October 16, 2017. <https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security>
- CISA, Binding Operational Directive 23-02, *Mitigating the Risk from Internet-Exposed Management Interfaces*, June 13, 2023. <https://www.cisa.gov/news-events/directives/binding-operational-directive-23-02>
- CISA, Binding Operational Directive 26-02, *Mitigating Risk From End-of-Support Edge Devices*, February 5, 2026. <https://www.cisa.gov/news-events/directives/bod-26-02-mitigating-risk-end-support-edge-devices>
- CISA, Binding Operational Directive 26-04, *Prioritizing Security Updates Based on Risk*, June 10, 2026 (revokes BOD 19-02 and BOD 22-01). <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk>
- CISA, Emergency Directive 26-03 (V1), *Mitigate Vulnerabilities in Cisco SD-WAN Systems*, February 25, 2026; V1 March 11, 2026. <https://www.cisa.gov/news-events/directives/v1-ed-26-03-mitigate-vulnerabilities-cisco-sd-wan-systems>

### Primary sources: NIST and other standards

- NIST SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, release 5.2.0 (August 27, 2025), and the OSCAL Rev. 5 catalog and SP 800-53B baseline profiles. <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5>
- NIST SP 800-52 Rev. 2, *Guidelines for the Selection, Configuration, and Use of Transport Layer Security (TLS) Implementations*, August 2019. <https://csrc.nist.gov/pubs/sp/800/52/r2/final>
- NIST SP 800-63B-4, *Digital Identity Guidelines: Authentication and Authenticator Management*, July 31, 2025. <https://csrc.nist.gov/pubs/sp/800/63/b/4/final>
- NIST SP 800-207, *Zero Trust Architecture*, August 2020. <https://csrc.nist.gov/pubs/sp/800/207/final>
- NIST SP 1800-35, *Implementing a Zero Trust Architecture*, June 10, 2025. <https://csrc.nist.gov/pubs/sp/1800/35/final>
- NIST CMVP, "FIPS 140-3 Transition Effort" (FIPS 140-2 certificates to the Historical List, September 22, 2026). <https://csrc.nist.gov/projects/fips-140-3-transition-effort>
- ITU-T Recommendation G.114, *One-way transmission time*, May 2003, with Amendments 1 (September 2003) and 2 (November 2009). <https://www.itu.int/rec/T-REC-G.114>

### Primary sources: FedRAMP and GSA

- FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*. <https://www.fedramp.gov/2026/agencies/use/>
- FedRAMP, "Important Dates for the Consolidated Rules for 2026." <https://www.fedramp.gov/2026/timeline/>
- FedRAMP, "Definitions," *FedRAMP Consolidated Rules for 2026*. <https://www.fedramp.gov/2026/definitions/>
- FedRAMP, Notice NTC-0013, *Rev5 Baseline Changes*, June 16, 2026. <https://fedramp.gov/notices/0013>
- FedRAMP Marketplace product data, and Microsoft 365 Government Community Cloud & Supporting Services (MSO365MT): FedRAMP Certified, Class C (Moderate). <https://www.fedramp.gov/marketplace/products.json>; <https://www.fedramp.gov/marketplace/products/MSO365MT/>
- GSA, "Enterprise Infrastructure Solutions." <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/telecommunications-and-network-services/enterprise-infrastructure-solutions>
- GSA, "Enterprise Infrastructure Solutions Transition." <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/telecommunications-and-network-services/enterprise-infrastructure-solutions/eis-transition>
- GSA, "Legacy IT contracts." <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/legacy-it-contracts>

### Primary sources: provider documentation

- Microsoft Learn, "Microsoft 365 informed network routing" (supports WW Commercial tenants, "but not the GCC Moderate, GCC High, DoD, Germany, or China clouds"). <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide>

### Third-party sources

Used only where no primary source could be retrieved. They are labeled "Third-party source" in each footnote.

- DOD News, "New 'Overlays' Provide Guide on Path to Zero Trust," June 4, 2024 (91 of 152 target activities by fiscal year 2027). <https://www.war.gov/News/News-Stories/Article/Article/3795170/new-overlays-provide-guide-on-path-to-zero-trust/>
- DefenseScoop, "DOD zero trust implementations," April 4, 2024 (DoD Zero Trust Strategy target and advanced activity counts and the FY 2027 target). <https://defensescoop.com/2024/04/04/dod-zero-trust-implementations-phase-2027/>
- Breaking Defense, "DoD releases zero trust strategy to thwart hackers who often breach perimeter," November 22, 2022. <https://breakingdefense.com/2022/11/dod-releases-zero-trust-strategy-to-thwart-hackers-who-often-breach-perimeter/>

::: {.callout-tip}
## Continue the book
[← Previous: Appendix A — Optimize Exemption Decision Instruments](appendix-a-optimize-exemption-instruments.md) · [Book index](index.md) · [Next: Appendix C — Glossary →](appendix-c-glossary.md)
:::

[^aB-m1926]: Office of Management and Budget, M-19-26, *Update to the Trusted Internet Connections (TIC) Initiative*, September 12, 2019, <https://www.whitehouse.gov/wp-content/uploads/2019/09/M-19-26.pdf> (accessed Oct 21, 2026).
[^aB-scc]: Cybersecurity and Infrastructure Security Agency, *TIC Core Guidance Volume 3: Security Capabilities Catalog*, Version 3.3, September 2026, §1.1, §2, §4, §4.1 (3.UNI.PEPAR) and §4.2, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Security_Capabilities_Catalogs_September_2026_17.pdf> (accessed Oct 21, 2026).
[^aB-branch]: Cybersecurity and Infrastructure Security Agency, *TIC 3.0 Branch Office Use Case*, Version 3.0, September 2026, §3, §6, §7 and §8, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Branch_Office_Use_September_2026_6.pdf> (accessed Oct 21, 2026).
[^aB-core]: Cybersecurity and Infrastructure Security Agency, "Trusted Internet Connections (TIC) 3.0 Core Guidance Documents," revision date September 23, 2026, <https://www.cisa.gov/resources-tools/resources/trusted-internet-connections-tic-30-core-guidance-documents> (accessed Oct 21, 2026).
[^aB-guidebook]: Cybersecurity and Infrastructure Security Agency, *TIC Core Guidance Volume 1: Program Guidebook*, Version 1.2, September 2026, guiding principles, §10 and §13, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Program_Guidebook_September_2026_47.pdf> (accessed Oct 21, 2026).
[^aB-sase]: Cybersecurity and Infrastructure Security Agency, *The Journey to Zero Trust: Using Secure Access Service Edge in a Modern TIC 3.0 Solution*, Version 1.0, June 2026, §5.5 and Appendix A, <https://www.cisa.gov/sites/default/files/2026-07/The_Journey_to_Zero_Trust-Using_SAS_in_a_Modern_TIC3.0_Solution.pdf> (accessed Oct 21, 2026).
[^aB-edns]: Cybersecurity and Infrastructure Security Agency, *Encrypted DNS Implementation Guidance*, May 16, 2024, executive summary and §2, <https://www.cisa.gov/sites/default/files/2024-05/Encrypted%20DNS%20Implementation%20Guidance_508c.pdf> (accessed Oct 21, 2026).
[^aB-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §III.C (Networks) and "Encrypting DNS traffic," <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 21, 2026).
[^aB-pdns]: Cybersecurity and Infrastructure Security Agency, "Protective Domain Name System (DNS) Resolver," <https://www.cisa.gov/resources-tools/services/protective-domain-name-system-dns-resolver> (accessed Oct 21, 2026).
[^aB-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026, "Agency Actions," Appendix B and Appendix C, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Oct 21, 2026).
[^aB-lra]: Cybersecurity and Infrastructure Security Agency, "Logging Reference Architecture" (published August 20, 2026), <https://www.cisa.gov/logging> (accessed Oct 21, 2026).
[^aB-bod2302]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 23-02, June 13, 2023, <https://www.cisa.gov/news-events/directives/binding-operational-directive-23-02> (accessed Oct 21, 2026).
[^aB-bod2602]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 26-02, February 5, 2026, <https://www.cisa.gov/news-events/directives/bod-26-02-mitigating-risk-end-support-edge-devices> (accessed Oct 21, 2026). Dates computed from the issue date.
[^aB-bod2604]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 26-04, June 10, 2026, <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk> (accessed Oct 21, 2026). Dates computed from the issue date.
[^aB-m2615]: Office of Management and Budget, M-26-15, *Execution of the Migration to Post-Quantum Cryptography*, June 24, 2026, §3 and the zero trust "Networks" item, <https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf> (accessed Oct 21, 2026).
[^aB-eo14412]: Executive Order 14412, *Securing the Nation Against Advanced Cryptographic Attacks*, June 22, 2026, <https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/> (accessed Oct 21, 2026).
[^aB-sp80052]: NIST, SP 800-52 Rev. 2, August 2019, abstract, <https://csrc.nist.gov/pubs/sp/800/52/r2/final> (accessed Oct 21, 2026).
[^aB-eo14306]: Executive Order 14306, June 6, 2025, §§1–2, <https://www.whitehouse.gov/presidential-actions/2025/06/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694-and-executive-order-14144/> (accessed Oct 21, 2026).
[^aB-eo14028]: Executive Order 14028, *Improving the Nation's Cybersecurity*, May 12, 2021, §3(d), <https://www.govinfo.gov/content/pkg/FR-2021-05-17/pdf/2021-10460.pdf> (accessed Oct 21, 2026).
[^aB-bod1801]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 18-01, *Enhance Email and Web Security*, October 16, 2017, <https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security> (accessed Oct 21, 2026).
[^aB-cmvp]: NIST Computer Security Resource Center, "FIPS 140-3 Transition Effort," <https://csrc.nist.gov/projects/fips-140-3-transition-effort> (accessed Oct 21, 2026).
[^aB-53]: NIST, SP 800-53 Rev. 5 (release 5.2.0), SC-7, SC-7(4), SC-7(8), SC-8, SC-8(1), SC-8(3), SC-13, AC-4, AC-17, CM-7(1), SI-4, CA-7, AU-12, CP-8 and its enhancements, and IA-3, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; control text checked against NIST's OSCAL Rev. 5 catalog (version 5.2.0), <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (both accessed Oct 21, 2026).
[^aB-53b]: NIST, SP 800-53B, *Control Baselines for Information Systems and Organizations*; membership checked against NIST's OSCAL Rev. 5 Low, Moderate and High baseline profiles, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 21, 2026).
[^aB-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, §3 and §5.6, <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Oct 21, 2026).
[^aB-207]: NIST, SP 800-207, *Zero Trust Architecture*, August 2020, <https://csrc.nist.gov/pubs/sp/800/207/final> (accessed Oct 21, 2026).
[^aB-1800]: NIST, SP 1800-35, *Implementing a Zero Trust Architecture: High-Level Document*, June 10, 2025, <https://csrc.nist.gov/pubs/sp/1800/35/final> (accessed Oct 21, 2026).
[^aB-63b]: NIST, SP 800-63B-4, *Digital Identity Guidelines: Authentication and Authenticator Management*, final July 31, 2025, <https://csrc.nist.gov/pubs/sp/800/63/b/4/final> (accessed Oct 21, 2026).
[^aB-fedramp-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^aB-ntc0013]: FedRAMP, Notice NTC-0013, *Rev5 Baseline Changes*, June 16, 2026, <https://fedramp.gov/notices/0013> (accessed Oct 21, 2026).
[^aB-gsa-legacy]: General Services Administration, "Legacy IT contracts," <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/legacy-it-contracts> (accessed Oct 21, 2026).
[^aB-gsa-eis]: General Services Administration, "Enterprise Infrastructure Solutions," <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/telecommunications-and-network-services/enterprise-infrastructure-solutions> (accessed Oct 21, 2026).
