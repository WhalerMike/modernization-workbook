---
title: "Appendix A — Requirements Mapping"
description: "A compliance-enabling map, not a compliance claim: each federal requirement the transformation touches (EO 14028, OMB M-22-09 and M-26-14, CISA BOD 25-01 and the Zero Trust Maturity Model, NIST SP 800-207, SP 800-63-4 and SP 800-53 Rev. 5, the Evidence Act and FedRAMP's Consolidated Rules), what it actually asks, where Book 01 addresses it, the book that closes it, and the evidence it calls for; then the requirements that are often cited for this arc but don't say what is claimed."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b01-transformation-arc
book: B01
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Requirements Mapping

*Book 01 is the map of the workbook, so its requirements mapping says where each requirement is argued and which book does the work.*

::: {.callout-note}
## In this appendix
What each federal requirement that touches the transformation asks for, in its own words where the wording matters; the Book 01 chapters that address it; the book that closes it in depth; and the evidence an assessor can expect. Then the requirements that circulate with this arc but say something different from what is claimed, notes on reading the SP 800-53 controls, and the source list. Each book's own requirements appendix carries the surface-level mapping; this one points to them rather than repeating them.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix helps an agency reuse the workbook's design and evidence in its own system security plan. It doesn't claim that following Book 01, or the workbook, satisfies any requirement or control. Whether a control is satisfied depends on the agency's own system boundary, implementation and assessor; the agency authorizes its own systems, and any cloud service they depend on needs its own FedRAMP certification ([Appendix B](appendix-b-applicability.md)). Requirement wording is summarized; the cited documents govern. Every source in this appendix was checked on October 21, 2026.
:::

## Requirements mapping

| Requirement (source) | What it asks | Book 01 | Closed in | Evidence |
|---|---|---|---|---|
| Zero trust architecture (EO 14028, May 12, 2021) | Agencies develop plans to implement zero trust architecture; M-22-09 requires agencies to build on those plans with its additional requirements[^aA-eo14028][^aA-m2209] | Ch 01, Ch 02, Ch 12 | Every book; the agency's implementation plan | The agency's zero trust implementation plan with this program's phases in it |
| Identity (OMB M-22-09 §III.A) | Centralized identity management systems for agency users that integrate with applications; MFA enforced at the application layer; phishing-resistant MFA required for staff, contractors and partners and offered to the public; no password policies requiring special characters or regular rotation; at least one device-level signal alongside identity in authorization[^aA-m2209] | Ch 04, Ch 08 | [Book 02](../b02-identity/index.md); [Book 04](../b04-access/index.md); [Book 03](../b03-hr-identity/index.md) | Directory consolidation record; Conditional Access authentication strength policies and sign-in logs; password policy settings |
| Devices (M-22-09 §III.B) | A complete inventory of every device authorized and operated for government use; EDR tools that meet CISA's technical requirements, deployed widely[^aA-m2209] | Ch 05, Ch 07, Ch 10 | [Book 05](../b05-devices/index.md) | Assessment computer stream; Intune and Arc inventory reconciled against it; EDR coverage report |
| Networks (M-22-09 §III.C) | Encrypted DNS wherever technically supported; HTTPS for all web and API traffic; a plan to break perimeters into isolated environments[^aA-m2209] | Ch 06, Ch 08 | [Book 08](../b08-ddi/index.md); [Book 09](../b09-network/index.md) | Resolver configuration; HTTPS enforcement; the isolation plan |
| Applications and workloads (M-22-09 §III.D) | Treat every application as internet-connected; rigorous testing; welcome external vulnerability reports[^aA-m2209] | Ch 07, Ch 08 | [Book 04, Chapter 05](../b04-access/05-applications-and-workload-identities.md); [Book 06](../b06-data-platform/index.md) | Application registration inventory; SPN retirement record |
| Data (M-22-09 §III.E) | Data categorization; cloud security services to monitor access to sensitive data; enterprise-wide logging and information sharing[^aA-m2209] | Not designed in Book 01 | Logging only: see M-26-14 below | Plan it separately (Appendix B) |
| Logging and network visibility (OMB M-26-14, May 22, 2026, which rescinds M-21-31) | A risk-based, prioritized logging approach; an Agency Logging Plan within 90 days of CISA's Logging Reference Architecture; maturity levels on a timeline counted from it[^aA-m2614] | Ch 11, Ch 12 | [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md); [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md); [Book 08, Chapter 11](../b08-ddi/11-operating-the-control-plane.md); [Book 09, Appendix B](../b09-network/appendix-b-requirements-mapping.md) | Agency Logging Plan; evidence packets and their SIEM forwarding |
| Secure cloud configuration (CISA BOD 25-01, December 17, 2024) | For cloud tenants with a finalized SCuBA baseline (at issuance, Microsoft Office 365): inventory tenants, deploy the SCuBA assessment tools and report, implement the mandatory policies by June 20, 2025, and assess new tenants before an ATO[^aA-bod2501] | Ch 12 | [Book 02, Appendix A](../b02-identity/appendix-a-federal-requirements-crosswalk.md) | SCuBA assessment output; deviation explanations |
| Zero Trust Maturity Model v2.0 (CISA, April 2023) | Five pillars and three cross-cutting capabilities, each with Traditional, Initial, Advanced and Optimal stages; "a general guide," not "a strict set of requirements"[^aA-ztmm] | Ch 11, Ch 12 | Every book, by pillar | The agency's maturity self-assessment |
| Zero trust architecture (NIST SP 800-207) | Seven tenets; a policy decision point and enforcement points; control and data planes logically separate. Guidance, not a mandate[^aA-207] | Ch 08, Ch 12 | [Book 04](../b04-access/index.md); [Book 09](../b09-network/index.md) | Architecture documentation mapping each enforcement point |
| Digital identity (NIST SP 800-63-4, July 31, 2025) | Identity proofing, authentication and federation assurance levels; supersedes SP 800-63-3[^aA-63] | Ch 04, Ch 08 | [Book 04, Chapter 03](../b04-access/03-the-conditional-access-model.md); [Book 03, Chapter 09](../b03-hr-identity/09-credentials-and-certificates.md) | Assurance level per application; authenticator inventory |
| Data inventory and governance (Evidence Act, Pub. L. 115-435, signed January 14, 2019) | A comprehensive data inventory, maintained to the maximum extent practicable; a Chief Data Officer[^aA-evidence] | Ch 04, Ch 12 (Principle 1) | [Book 03](../b03-hr-identity/index.md) | Attribute authority map; data inventory entries for identity sources |
| Cloud service certification (FedRAMP Consolidated Rules for 2026) | FedRAMP certifies cloud service offerings; "each agency still authorizes its own federal information systems" and never issues a standalone ATO for a cloud service. Mandatory for all stakeholders January 1, 2027; no new Rev5 certification applications after June 11, 2027[^aA-fedramp-use][^aA-fedramp-dates] | Ch 12, Appendix B | [Book 09, Chapter 03](../b09-network/03-what-tic-3-requires.md); [Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md) | FedRAMP Marketplace listing for each service; the agency's own authorization and boundary diagram |
| Account management and least privilege (SP 800-53 AC-2, AC-3, AC-6, AC-6(7)) | Manage accounts through their lifecycle; enforce approved authorizations; least privilege, with periodic review of privileged accounts[^aA-53] | Ch 04, Ch 11 | [Book 03](../b03-hr-identity/index.md); [Book 04](../b04-access/index.md) | Lifecycle Workflows runs; PIM settings; access review history; drift findings |
| Remote access (SP 800-53 AC-17) | Authorize, control and monitor remote access[^aA-53] | Ch 08 | [Book 09](../b09-network/index.md) | ZTNA policy and logs |
| Identification and authentication (SP 800-53 IA-2, IA-2(1), IA-2(2), IA-2(12), IA-5) | Uniquely identify and authenticate users; MFA for privileged and non-privileged accounts; accept PIV credentials; manage authenticators[^aA-53] | Ch 08, Ch 12 | [Book 04](../b04-access/index.md); [Book 07](../b07-pki/index.md) | Authentication methods policy; certificate-based authentication trust store and username bindings |
| Configuration (SP 800-53 CM-2, CM-3, CM-6) | Baseline configuration; configuration change control; configuration settings[^aA-53] | Ch 05, Ch 11 | [Book 05](../b05-devices/index.md); [Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md) | Versioned Intune and machine-configuration manifests; authorized plans and their pull requests |
| Inventory and unsupported components (SP 800-53 CM-8, SA-22) | An accurate system component inventory; replace components no longer supported, or justify and document them[^aA-53] | Ch 10, Ch 12 | [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md); [Book 06, Chapter 04](../b06-data-platform/04-the-estate-inventory.md) | Assessment streams; operating-system disposition list (Windows Server 2012 and 2016 dates in Chapter 10) |
| Name resolution (SP 800-53 SC-20, SC-21, SC-22) | Data origin and integrity for authoritative name resolution; validation by recursive resolvers; fault-tolerant, role-separated name services[^aA-53] | Ch 06 | [Book 08, Appendix B](../b08-ddi/appendix-b-requirements-mapping.md) | DNS architecture and DNSSEC records |
| Audit and monitoring (SP 800-53 AU-2, AU-6, AU-12, SI-4, CA-7) | Define logged events; review and analyze audit records; generate them; monitor the system; continuous monitoring strategy[^aA-53] | Ch 11, Ch 12 | [Book 02, Chapter 10](../b02-identity/10-migrating-and-governing.md); [Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md) | Evidence packets; drift reports; SIEM ingestion |
| Engineering principles (SP 800-53 SA-8) | Apply security and privacy engineering principles in specifying, designing, developing and modifying systems[^aA-53] | Ch 10 (transaction profiling), Ch 12 | [Book 09](../b09-network/index.md) | Transaction profiles and the separation decision for each application |

## Requirements that are cited but don't say what is claimed

The modernization whitepaper that Chapters 10 to 12 absorbed, and much of what circulates about this arc, cites requirements that a reader who checks won't find as stated. They are listed so a reviewer can recognize them.

| Claimed requirement | What the record shows |
|---|---|
| NIST SP 800-207 and M-22-09 "require" separating the directory from the domain controller | SP 800-207 is guidance; it separates policy decision from enforcement and the control plane from the data plane.[^aA-207] The program's separation of truth from enforcement is a design position consistent with it ([Chapter 12](12-migration-roadmap.md#the-direction-of-travel)). |
| "M-22-09 §4" requires application-layer traffic inspection | M-22-09 has no §4. Its network actions are encrypted DNS, HTTPS for web and API traffic, and an isolation plan.[^aA-m2209] |
| FedRAMP continuous monitoring and M-22-09 expect ZTMM "Advanced" maturity as the production standard | Neither says so. M-22-09 organizes its goals by the maturity model's pillars and sets specific actions; CISA calls the model a general guide.[^aA-m2209][^aA-ztmm] |
| The ZTMM Identity pillar at Advanced and Optimal requires certificate-based authentication as the primary mechanism | At Advanced the model describes phishing-resistant MFA with initial passwordless MFA "via FIDO2 or PIV"; at Optimal, continuous validation with phishing-resistant MFA.[^aA-ztmm] |
| BOD 25-01 mandates modern authentication throughout and the elimination of NTLM | BOD 25-01 applies to cloud tenants with a finalized SCuBA baseline, which at issuance meant Microsoft Office 365; it doesn't address on-premises Active Directory or NTLM.[^aA-bod2501] NTLM retirement is the program's design goal ([Book 06, Chapter 15](../b06-data-platform/15-the-three-phases-of-ntlm-elimination.md)). |
| The Evidence Act and the Federal Data Strategy mandate that identity attributes trace to a single authoritative system of record | The Act requires a comprehensive data inventory and a Chief Data Officer; it says nothing about identity attributes or a system of record for identity.[^aA-evidence] Principle 1 is the program's position. |
| FedRAMP 20x makes all agency continuous monitoring evidence machine-readable by January 1, 2027, and agencies that haven't modernized can't produce it | The Consolidated Rules govern certification of cloud service offerings; Key Security Indicators belong to the 20x certification rules for providers. The agency authorizes its own systems.[^aA-fedramp-use][^aA-ksi] |
| "NIST SP 800-37 Rev. 2 CA-7" | CA-7, Continuous Monitoring, is an SP 800-53 control.[^aA-53] SP 800-37 Rev. 2 is the Risk Management Framework, whose final stage is continuous monitoring.[^aA-37] |
| TIC 3.0 Branch Office v1.0 (April 2021), Remote User v2.2 and Cloud v1.2 (July 2025) | CISA revised all four TIC 3.0 use cases in September 2026.[^aA-tic] Current versions and what they ask are in [Book 09, Appendix B](../b09-network/appendix-b-requirements-mapping.md). |
| M-21-31 event-logging tiers EL0 to EL3 | Rescinded May 22, 2026, by M-26-14.[^aA-m2614] |

## Reading the SP 800-53 controls

- **Baseline membership.** AC-2, AC-3, AC-17, IA-2 with enhancements (1), (2) and (12), IA-5, CM-2, CM-6, CM-8, SA-8, SA-22, SC-20, SC-21, SC-22, AU-2, AU-6, AU-12, SI-4 and CA-7 are in the Low, Moderate and High baselines. AC-6, AC-6(7), CM-3 and IA-5(2) are in Moderate and High.[^aA-53b]
- **SA-22 is the control the end-of-support dates land on.** Windows Server 2012 and 2012 R2 Extended Security Updates through Azure Arc ended on October 13, 2026, and Windows Server 2016 reaches end of support on January 12, 2027 ([Chapter 10](10-analyzing-the-estate.md)); every such server needs a replacement or a documented justification.
- **Release.** Control identifiers and titles are from SP 800-53 Rev. 5, release 5.2.0.[^aA-53]

## Sources

Every URL below was opened, or taken from a search result where the site blocked automated retrieval, on October 21, 2026. Chapters cite Microsoft product sources in their own footnotes; they aren't repeated here.

### Executive orders, statutes and OMB memoranda

- Executive Order 14028, *Improving the Nation's Cybersecurity*, May 12, 2021. <https://www.govinfo.gov/content/pkg/FR-2021-05-17/pdf/2021-10460.pdf>
- Foundations for Evidence-Based Policymaking Act of 2018, Pub. L. 115-435. <https://www.congress.gov/115/plaws/publ435/PLAW-115publ435.htm>
- OMB M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022. <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
- OMB M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026. <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>

### CISA

- Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024. <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services>
- *Zero Trust Maturity Model*, Version 2.0, April 2023. <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf>
- Trusted Internet Connections 3.0 core guidance documents, revision date September 23, 2026. <https://www.cisa.gov/resources-tools/resources/trusted-internet-connections-tic-30-core-guidance-documents>

### NIST

- SP 800-207, *Zero Trust Architecture*, August 2020. <https://csrc.nist.gov/pubs/sp/800/207/final>
- SP 800-63-4, *Digital Identity Guidelines*, July 31, 2025. <https://csrc.nist.gov/pubs/sp/800/63/4/final>
- SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations*, December 2018. <https://csrc.nist.gov/pubs/sp/800/37/r2/final>
- SP 800-53 Rev. 5, release 5.2.0, and the OSCAL Rev. 5 catalog and Low, Moderate and High baseline profiles. <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5>

### FedRAMP

- "Propelling Change: FedRAMP Launches Consolidated Rules for 2026," June 25, 2026. <https://www.fedramp.gov/2026-06-25-propelling-change-fedramp-launches-consolidated-rules-for-2026/>
- "Important Dates for the Consolidated Rules for 2026." <https://www.fedramp.gov/2026/timeline/>
- "Using a FedRAMP Certified Cloud Service." <https://www.fedramp.gov/2026/agencies/use/>
- "Key Security Indicators," FedRAMP 20x Certification Rules. <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/>

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 12 — The Migration Roadmap](12-migration-roadmap.md) · [Book index](index.md) · [Next: Appendix B — Applicability →](appendix-b-applicability.md)
:::

[^aA-eo14028]: Executive Order 14028, *Improving the Nation's Cybersecurity*, May 12, 2021, §3, <https://www.govinfo.gov/content/pkg/FR-2021-05-17/pdf/2021-10460.pdf> (accessed Oct 21, 2026).
[^aA-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §III and §III.A–E, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 21, 2026).
[^aA-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Oct 21, 2026).
[^aA-bod2501]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024, <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services> (accessed Oct 21, 2026).
[^aA-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, §5, §5.1 (Table 2, Authentication) and §5.6, <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Oct 21, 2026).
[^aA-207]: NIST, SP 800-207, *Zero Trust Architecture*, August 2020, §2.1, §3 and §3.4.1, <https://csrc.nist.gov/pubs/sp/800/207/final> (accessed Oct 21, 2026).
[^aA-63]: NIST, SP 800-63-4, *Digital Identity Guidelines*, July 31, 2025 (supersedes SP 800-63-3), <https://csrc.nist.gov/pubs/sp/800/63/4/final> (accessed Oct 21, 2026).
[^aA-evidence]: Foundations for Evidence-Based Policymaking Act of 2018, Pub. L. 115-435, §202 (44 U.S.C. 3511(a) data inventory; 44 U.S.C. 3520 Chief Data Officers), <https://www.congress.gov/115/plaws/publ435/PLAW-115publ435.htm> (accessed Oct 21, 2026).
[^aA-fedramp-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^aA-fedramp-dates]: FedRAMP, "Propelling Change: FedRAMP Launches Consolidated Rules for 2026," June 25, 2026, <https://www.fedramp.gov/2026-06-25-propelling-change-fedramp-launches-consolidated-rules-for-2026/>, and "Important Dates for the Consolidated Rules for 2026," <https://www.fedramp.gov/2026/timeline/> (both accessed Oct 21, 2026).
[^aA-ksi]: FedRAMP, "Key Security Indicators," FedRAMP 20x Certification Rules, *Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (accessed Oct 21, 2026).
[^aA-53]: NIST, SP 800-53 Rev. 5 (release 5.2.0), AC-2, AC-3, AC-6, AC-6(7), AC-17, IA-2 and enhancements (1), (2), (12), IA-5, CM-2, CM-3, CM-6, CM-8, SA-8, SA-22, SC-20, SC-21, SC-22, AU-2, AU-6, AU-12, SI-4 and CA-7, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; titles checked against NIST's OSCAL Rev. 5 catalog, version 5.2.0, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (both accessed Oct 21, 2026).
[^aA-53b]: NIST, SP 800-53B, *Control Baselines for Information Systems and Organizations*; membership checked against NIST's OSCAL Rev. 5 Low, Moderate and High baseline profiles, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 21, 2026).
[^aA-37]: NIST, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, abstract, <https://csrc.nist.gov/pubs/sp/800/37/r2/final> (accessed Oct 21, 2026).
[^aA-tic]: Cybersecurity and Infrastructure Security Agency, "Trusted Internet Connections (TIC) 3.0 Core Guidance Documents," revision date September 23, 2026, <https://www.cisa.gov/resources-tools/resources/trusted-internet-connections-tic-30-core-guidance-documents> (accessed Oct 21, 2026).
