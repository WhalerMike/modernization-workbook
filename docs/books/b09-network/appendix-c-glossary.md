---
title: "Appendix C — Glossary"
description: "Plain definitions of the network, transport, policy and control terms used across Book 09, with corrections to terms the sources got wrong. Policy and product facts are as of October 21, 2026."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b09-network
book: B09
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Glossary

*Most arguments about branch networking are arguments about words, so the words are defined once, here.*

::: {.callout-note}
## In this appendix
Definitions of the terms Book 09 uses, in alphabetical order, each in one or two sentences. Where a definition rests on an external fact, such as a standard, a directive or a product behavior, it carries a footnote. Where the book's sources used a term wrongly, the entry says so. Program design terms (phase inversion, governor, residual architecture) are the book's own and carry no footnote. [Appendix B](appendix-b-requirements-mapping.md) maps the requirements behind these terms to chapters and evidence.
:::

## A–C

Access point (TIC)
: A physical location where agency traffic enters or leaves the internet through a TIC inspection stack, operated by the agency or by an MTIPS provider. See TICAP.

AC-17 Remote Access
: The NIST SP 800-53 control for establishing, documenting, monitoring and controlling remote access methods. Application-to-path assignment is part of how a branch answers it.[^aC-sp80053]

Address continuity
: Whether a server keeps seeing the same client source address when the path changes. A re-route that changes the apparent source address breaks established connections; one that doesn't generally won't. See [Chapter 06](06-legacy-protocols-on-re-routed-paths.md).

Allow, Default and Optimize
: Microsoft's three categories for Microsoft 365 network endpoints. Optimize covers the Microsoft-owned and managed endpoints dedicated to core Microsoft 365 workloads, the traffic Microsoft most wants sent directly and uninspected; see [Chapter 12](12-microsoft-365-traffic.md).[^aC-m365ws]

Application-aware steering
: Choosing a path for each flow by the application it belongs to, rather than by destination address alone. One of the six branch-edge functions in [Chapter 10](10-the-long-interim.md).

Authorizing official (AO)
: The senior official who accepts the residual risk of operating a system, and who decides boundary changes and traffic-flow exceptions. See [Chapter 09](09-who-owns-the-network.md).

BOD (Binding Operational Directive)
: A compulsory direction from CISA to federal civilian executive branch agencies. Book 09 relies on BOD 23-02 (internet-exposed management interfaces), BOD 26-02 (end-of-support edge devices) and BOD 26-04 (risk-based remediation, which revoked BOD 19-02 and BOD 22-01).[^aC-bod2602][^aC-bod2604]

Boundary change
: A change to what an authorization package describes, such as a new egress path or a new device class at every branch. The program treats it as a significant change, decided before cutover. See Significant change.

Branch-edge policy layer
: The function at the branch that decides which traffic takes which path, measures each path's health and produces per-application transport telemetry. SD-WAN is the usual product; a capable multi-WAN firewall delivers part of it.

CAE (Continuous Access Evaluation)
: Microsoft Entra ID's mechanism for revoking sessions on critical events rather than waiting for token expiry. In CAE sessions, access tokens can live up to 28 hours.[^aC-cae]

Chattiness
: How many sequential round trips an application needs to finish a transaction. For chatty applications the round-trip count, not the per-trip latency, dominates response time.

CIS Benchmarks
: The Center for Internet Security's consensus configuration guides for operating systems, cloud platforms and network products, including Cisco IOS XE 17.x, Cisco NX-OS, Cisco ASA, Juniper OS, Palo Alto Firewall 11 and F5. For network gear, a Moderate civilian agency typically draws its CM-6 settings from a CIS Benchmark and the vendor's own hardening guide. There is no CIS Benchmark for Cisco Catalyst SD-WAN Manager.[^aC-cis]

CLAW (Comprehensive Log Aggregation Warehouse)
: CISA's cloud-based service for collecting and aggregating agency-provided telemetry, and the route by which agencies that leave MTIPS keep CISA's visibility. CISA earlier called it the Cloud Log Aggregation Warehouse, and the NCPS Cloud Interface Reference Architecture is now the CLAW Cloud Interface Reference Architecture. (One of the book's sources had the two names backward, calling "Comprehensive" the error.)[^aC-sase]

CM-6 Configuration Settings
: The NIST SP 800-53 control under which the agency sets and documents the most restrictive configuration consistent with operations, using common secure configurations it chooses, and approves and records any deviation. The control's discussion says those configurations can come from product vendors, federal agencies, consortia and others. It doesn't require any one checklist.[^aC-cm6]

Conditional Access
: Microsoft Entra ID's policy engine that grants, limits or blocks sign-in based on user, device, location and risk signals. Location conditions depend on a stable egress address; see [Book 04](../b04-access/03-the-conditional-access-model.md).

Consistency class
: A grouping of data by how much synchronization it really needs: strong consistency inside a region, causal or eventual consistency across regions. See [Chapter 04](04-logical-centralization-and-token-security.md) and [Chapter 08](08-reference-architecture.md).

CP-8 Telecommunications Services
: The NIST SP 800-53 control for alternate telecommunications services. CP-8(2) (no shared single point of failure) is in the Moderate and High baselines; CP-8(3) (separation of primary and alternate providers) is in High only. It is the one control family transport selection closes.[^aC-sp80053b]

## D–F

Deterministic egress
: A stable, documented source address for each branch's outbound traffic, usually a NAT configuration decision. It keeps address-keyed applications and location-aware policies working.

DIA (direct internet access)
: Local internet breakout at the branch, instead of backhauling internet-bound traffic to a central access point. Carriers also sell "dedicated internet access" circuits under the same abbreviation; Book 09 uses DIA for the breakout architecture. The sources once expanded DIA as a Defense Information Systems Agency circuit, which is wrong twice: DISA is that agency, its network is DISN, and DIA is the Defense Intelligence Agency ([Chapter 02](02-transport-is-physics-control-is-compliance.md)).

DNS over HTTPS (DoH) and DNS over TLS (DoT)
: Protocols that encrypt DNS queries between a client and a resolver, standardized in RFC 8484 and RFC 7858. M-22-09 calls for encrypted DNS where technically supported; see [Book 08, Chapter 03](../b08-ddi/03-federal-requirements.md).[^aC-rfc8484][^aC-rfc7858]

EAP-TLS
: The Extensible Authentication Protocol method that authenticates with certificates over TLS, standardized in RFC 5216 and updated for TLS 1.3 by RFC 9190. It is the certificate-based method for 802.1X in [Chapter 07](07-network-access-control.md).[^aC-eaptls]

ED (Emergency Directive)
: A CISA directive issued for an urgent, specific threat. ED 26-03 (February 25, 2026) covered Cisco SD-WAN systems and is the book's example that the governor is itself attack surface.[^aC-ed2603]

Edge device (BOD 26-02)
: A device on the boundary of an agency network that is accessible from the public internet, such as a router, firewall, switch, wireless access point or load balancer. BOD 26-02 requires end-of-support edge devices to be off agency networks within 18 months of February 5, 2026.[^aC-bod2602]

EIS (Enterprise Infrastructure Solutions)
: GSA's government-wide telecommunications and infrastructure contract, which replaced Networx and the other expiring vehicles. Its option periods run to July 31, 2027 and July 30, 2032.[^aC-eis]

FedRAMP
: The federal program that authorizes cloud service offerings against NIST SP 800-53. It governs the security posture of the service, not the path an agency uses to reach it. Under the Consolidated Rules for 2026, "authorization" becomes "certification," with mandatory adoption on January 1, 2027.[^aC-fedramp]

FedRAMP Certification Class
: The 2026 replacement for FedRAMP impact levels, Classes A through D; Class C includes the former Moderate baseline. FedRAMP stops accepting new Rev. 5 certification requests on June 11, 2027; the end date for existing Rev. 5 certifications "has not been finalized but is likely to be no later than 2029."[^aC-fr0004][^aC-ntc0013]

FEC (forward error correction)
: Sending redundant data so the receiver can rebuild lost packets without a retransmission. SD-WAN uses it, with packet duplication, to tighten tail latency on lossy paths; see [Chapter 05](05-sd-wan-sase-and-governed-transport.md).

FIPS 140-3
: The current federal standard for cryptographic module security requirements. NIST moved all FIPS 140-2 certificates to the Historical List on September 22, 2026.[^aC-fips]

## G–L

Governor
: The book's term for the control layer that governs pipes: the SD-WAN overlay plus the SASE stack above it. It closes protection controls that transport can't, and it is a high-value target that needs its own controls.

Governed-path transport
: A proposed program direction in which transport decisions are bound to identity and tokens rather than to network location. It is a proposal, not ratified design; see [Chapter 05](05-sd-wan-sase-and-governed-transport.md).

Hairpin routing
: Sending traffic to a central point and back before it reaches its destination, even where a shorter path exists. The TIC 1.0 and 2.0 model, which TIC 3.0 lets agencies leave.

ITU-T G.114
: The ITU recommendation on one-way transmission time. It treats one-way delays below 150 ms as giving most applications essentially transparent interactivity, recommends not exceeding 400 ms for general network planning, and gives a planning value of 5 µs per kilometer for optical fiber.[^aC-g114]

Jitter
: Variation in packet delay over time. Real-time voice and video suffer more from jitter than from steady latency.

Kerberos
: The ticket-based authentication protocol (RFC 4120) Active Directory uses. Windows domain controllers don't populate or check the ticket's client-address field by default, so Kerberos works across NAT; see [Chapter 06](06-legacy-protocols-on-re-routed-paths.md).[^aC-rfc4120]

KEV (Known Exploited Vulnerabilities) catalog
: CISA's authoritative list of vulnerabilities exploited in the wild. KEV status is one of the four variables in BOD 26-04's remediation model.[^aC-kev]

LEO (low-earth-orbit) satellite
: Satellite internet service from constellations in low orbit, whose short path to the satellite gives far lower delay than geostationary service ([Chapter 02](02-transport-is-physics-control-is-compliance.md) gives the ITU planning values). It is a transport option and, like every pipe, closes no protection control; see [Chapter 02](02-transport-is-physics-control-is-compliance.md).

Local breakout
: Sending a branch's internet- and cloud-bound traffic out through a local circuit instead of backhauling it. Bare local breakout, with nothing governing it, is a compliance regression with better latency.

Logical centralization
: One authoritative source of truth, wherever its copies physically sit. It is distinct from physical centralization, which puts everything in one place; see [Chapter 04](04-logical-centralization-and-token-security.md).

## M–P

Managed interface
: A boundary point where traffic to an external network is monitored and controlled. SC-7(4) requires one for each external telecommunication service.

Microsoft 365 informed network routing (INR)
: A Microsoft 365 feature that shares network quality data with SD-WAN devices. It supports Worldwide commercial tenants but not GCC Moderate, GCC High or DoD. The physics series used "INR" for a program concept, identity-aware routing; Book 09 uses INR only for the Microsoft feature.[^aC-inr]

M-22-09
: OMB's federal zero trust strategy memorandum of January 26, 2022. It remains operative, though its deadlines have passed; see [Chapter 03](03-what-tic-3-requires.md).

M-26-14
: OMB's logging memorandum of May 22, 2026, which rescinded M-21-31 and replaced its EL0–EL3 tiers with a five-level maturity model. Cite it, not M-21-31, for current logging and telemetry obligations.[^aC-m2614]

M-26-15
: OMB's post-quantum cryptography memorandum of June 24, 2026, which requires infrastructure that terminates TLS or IPsec to support PQC-capable key exchange.[^aC-m2615]

ML-KEM
: The module-lattice key-encapsulation mechanism standardized in FIPS 203 (August 2024), the NIST post-quantum algorithm for key exchange.[^aC-fips203]

MPLS (Multiprotocol Label Switching)
: A carrier technique for forwarding packets along pre-established label-switched paths, defined in RFC 3031, and the basis of most carrier private WAN services. An MPLS VPN separates traffic but doesn't encrypt it.[^aC-rfc3031]

MTIPS (Managed Trusted Internet Protocol Service)
: GSA's managed TIC service, offered through EIS for the TIC 3.0 Traditional use case. Agencies leaving it must keep CISA's telemetry through CLAW.[^aC-mtips]

NAT and SNAT (source network address translation)
: Replacing a packet's address at a gateway; SNAT replaces the source address. It matters for address-keyed applications and location policies, not because it breaks Kerberos.

NCP (National Checklist Program)
: NIST's program and repository for security configuration checklists, described in SP 800-70 Rev. 5 (May 2026). NIST notes that checklists are typically written by IT vendors for their own products, and also by consortia, academia and government agencies.[^aC-ncp]

Path class
: A category of WAN path built for one kind of traffic: a lean, low-latency path for small latency-critical flows and a fat, bulk path for large transfers. See [Chapter 05](05-sd-wan-sase-and-governed-transport.md).

PEP (policy enforcement point)
: In NIST's zero trust architecture, the component that enables, monitors and terminates connections between a subject and a resource. In TIC 3.0 terms, the place a security capability is applied.[^aC-sp800207]

Phase inversion
: The book's name for completing cloud migration before transport is governed and measured, so that transport-attributable cost is absorbed as cloud cost and the remedies raise the cost that was misattributed. The book presents the composed claim as its own inference; see [Chapter 13](13-sequencing-cost-and-evidence.md).

Point of presence (PoP)
: A provider location where a cloud-delivered service, such as a SASE stack, terminates and inspects traffic. Its distance from the branch is part of the latency budget.

Policy enforcement parity
: The TIC 3.0 universal capability requiring the same security policy on every path, whatever route the traffic takes. See [Chapter 12](12-microsoft-365-traffic.md).

Post-quantum cryptography (PQC)
: Cryptographic algorithms designed to resist attack by quantum computers, such as ML-KEM. See M-26-15.

Propagation delay
: The time a signal takes to cross a distance, set by physics: about 5 µs per kilometer in fiber, or 1 ms per 200 km one way.[^aC-g114] No product reduces it; see [Chapter 01](01-why-physics-decides-the-architecture.md).

Protective DNS
: CISA's recursive resolver service for federal agencies, launched in 2022 as the successor to EINSTEIN 3 Accelerated, which blocks queries to known-malicious destinations. Agencies must route egress DNS to it; a DDI vendor's own protective DNS doesn't substitute.[^aC-pdns]

## R–S

RADIUS
: The Remote Authentication Dial In User Service protocol (RFC 2865), which network devices use to ask a server whether to admit a user or device. NPS is Microsoft's RADIUS server; see [Chapter 07](07-network-access-control.md).[^aC-rfc2865]

Residual architecture
: The book's term for the architecture left once the alternatives have closed: local breakout, a cloud-delivered security stack and a branch-edge policy layer. See [Chapter 10](10-the-long-interim.md).

Round-trip time (RTT)
: The time for a request to reach its destination and the reply to come back: at least twice the one-way propagation delay.

SASE (Secure Access Service Edge)
: An industry architecture that delivers network security functions (secure web gateway, cloud access security broker, firewall as a service, zero trust network access) from cloud points of presence, usually alongside SD-WAN. CISA's June 2026 guidance describes it as a compliant TIC 3.0 path; no federal instrument requires it.[^aC-sase]

SC-7 Boundary Protection
: The NIST SP 800-53 control for monitoring and controlling communications at external and key internal boundaries. With local breakout, the branch is an external boundary.[^aC-sp80053]

SC-7(4) External Telecommunications Services
: The SC-7 enhancement requiring a managed interface and a traffic flow policy for each external telecommunication service, with every exception documented with its mission need and duration and reviewed. It is the basis of the Microsoft 365 Optimize exemption.[^aC-sp80053]

SC-8 and SC-8(1) Transmission Confidentiality and Integrity
: Controls requiring protection of transmitted information, with cryptographic mechanisms in SC-8(1) that "include TLS and IPSec." The enhancements for message externals and traffic-pattern concealment, SC-8(3) and SC-8(4), are in no baseline, so no baseline compels an encrypted WAN under an already-encrypted payload.[^aC-sp80053][^aC-sp80053b]

Security Capabilities Catalog
: Volume 3 of the TIC 3.0 core guidance, listing the security capabilities agencies apply at policy enforcement points. The current edition is Version 3.3, September 2026.[^aC-scc]

SD-WAN (software-defined wide area network)
: Branch-edge WAN control that provides application-aware routing, concurrent use of several links, continuous path-health measurement, queue management and per-application telemetry. No federal instrument requires it.

SI-4 System Monitoring
: The NIST SP 800-53 control for monitoring a system to detect attacks and indicators of attack. Per-application, per-path telemetry is directly responsive to it at a branch.[^aC-sp80053]

Significant change
: A change "likely to substantively affect the security or privacy posture of a system," which may trigger an event-driven authorization action.[^aC-sp80037]

STIG (Security Technical Implementation Guide) (High only)
: A Defense Information Systems Agency configuration guide for a specific product and version, based on DoD policy and a DoD baseline.[^aC-stig] It's Defense material, not the Moderate civilian baseline; some civilian agencies borrow one as an optional reference where no other product checklist exists. *High only* marks material that applies to FedRAMP High or Defense environments, such as DISA STIGs and DoD Impact Levels, not to the Moderate civilian baseline this workbook targets. It's kept as an optional reference. See CIS Benchmarks, CM-6 and NCP.

## T–Z

TDS (Tabular Data Stream)
: Microsoft SQL Server's client-server protocol, which a default instance carries on TCP port 1433. It is stateful and sensitive to resets, proxy idle timeouts and source-address changes; see [Chapter 06](06-legacy-protocols-on-re-routed-paths.md).[^aC-sqlport]

Telecommunications diversity
: Alternate telecommunications paths and providers that don't share a single point of failure with the primary. See CP-8.

Tenant restrictions v2
: A Microsoft Entra ID feature that limits which external tenants users can sign in to from agency networks or devices, enforced through a proxy header, Global Secure Access or Windows signaling. See [Chapter 12](12-microsoft-365-traffic.md).[^aC-trv2]

TIC 3.0 (Trusted Internet Connections 3.0)
: The capability-based TIC model established by OMB M-19-26 (September 12, 2019), which rescinded M-08-05. It is descriptive, not prescriptive: it mandates no technology, vendor or topology.[^aC-m1926]

TIC 3.0 use cases
: CISA's published patterns for applying TIC 3.0: Traditional, Branch Office, Remote User and Cloud. There is no SASE use case.[^aC-tic]

TICAP (TIC Access Provider)
: "An agency or vendor that manages and hosts one or more TIC access points."[^aC-scc]

Token protection
: A Microsoft Entra Conditional Access control that accepts only device-bound sign-in session tokens, such as Primary Refresh Tokens, so a stolen token can't be replayed from another device. See [Book 04](../b04-access/03-the-conditional-access-model.md).[^aC-tokenprot]

Traffic flow policy
: The documented rules for what may cross a managed interface, in which direction and under what conditions, with every exception recorded. SC-7(4) requires one per external telecommunication service.

ZTNA (zero trust network access)
: Per-session, per-application access decisions based on verified identity, device posture and context rather than network location.

802.1X
: The IEEE standard for port-based network access control, under which a switch or access point admits a device only after it authenticates, usually through RADIUS. The current edition is IEEE Std 802.1X-2020; see [Chapter 07](07-network-access-control.md).[^aC-8021x]

::: {.callout-tip}
## Continue the book
[← Previous: Appendix B — Requirements Mapping and Sources](appendix-b-requirements-mapping.md) · [Book index](index.md)
:::

[^aC-cis]: Center for Internet Security, "CIS Benchmarks" (description; benchmark list, including Cisco IOS XE 17.x (2.2.1), Cisco NX-OS (1.2.0), Cisco ASA 9.x Firewall (1.1.0), Juniper OS (2.1.0), Palo Alto Firewall 11 (1.2.0) and F5 Networks (1.0.0); no Cisco Catalyst SD-WAN Manager benchmark listed), <https://www.cisecurity.org/cis-benchmarks> (accessed Oct 29, 2026).
[^aC-cm6]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, control CM-6 (statement and discussion), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; read from NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 29, 2026).
[^aC-ncp]: National Institute of Standards and Technology, SP 800-70 Rev. 5, *National Checklist Program for IT Products: Guidelines for Checklist Users and Developers*, May 2026, <https://csrc.nist.gov/pubs/sp/800/70/r5/final>; and NIST, "National Checklist Program," <https://csrc.nist.gov/projects/national-checklist-program> (repository at <https://ncp.nist.gov/>) (accessed Oct 29, 2026).
[^aC-stig]: National Institute of Standards and Technology, CSRC Glossary, "Security Technical Implementation Guide (STIG)" ("Based on Department of Defense (DoD) policy and security controls"; "geared to a specific product and version"; source CNSSI 4009-2022), <https://csrc.nist.gov/glossary/term/security_technical_implementation_guide> (accessed Oct 29, 2026).
[^aC-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf> (accessed Oct 21, 2026). AC-17, SC-7, SC-7(4), SC-8, SC-8(1), SI-4.
[^aC-sp80053b]: National Institute of Standards and Technology, SP 800-53B, *Control Baselines for Information Systems and Organizations*, <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53B.pdf> (accessed Oct 21, 2026). Baseline tables for CP-8 and SC-8.
[^aC-m365ws]: Microsoft Learn, "Microsoft 365 IP Address and URL web service" ("Valid values are Optimize, Allow, and Default"), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-ip-web-service>; and "Implementing VPN split tunneling for Microsoft 365," <https://learn.microsoft.com/microsoft-365/enterprise/microsoft-365-vpn-split-tunnel> (both accessed Oct 21, 2026).
[^aC-bod2602]: Cybersecurity and Infrastructure Security Agency, BOD 26-02, *Mitigating Risk From End-of-Support Edge Devices*, February 5, 2026, <https://www.cisa.gov/news-events/directives/bod-26-02-mitigating-risk-end-support-edge-devices> (accessed Oct 21, 2026).
[^aC-bod2604]: Cybersecurity and Infrastructure Security Agency, BOD 26-04, *Prioritizing Security Updates Based on Risk*, June 10, 2026, <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk> (accessed Oct 21, 2026).
[^aC-cae]: Microsoft Learn, "Continuous access evaluation," <https://learn.microsoft.com/entra/identity/conditional-access/concept-continuous-access-evaluation> (accessed Oct 21, 2026).
[^aC-sase]: Cybersecurity and Infrastructure Security Agency, *The Journey to Zero Trust: Using Secure Access Service Edge in a Modern TIC 3.0 Solution*, Version 1.0, June 2026, <https://www.cisa.gov/sites/default/files/2026-07/The_Journey_to_Zero_Trust-Using_SAS_in_a_Modern_TIC3.0_Solution.pdf> (accessed Oct 21, 2026). CLAW as "a cloud-based service for collecting and aggregating agency-provided" telemetry. The earlier name appears in CISA, *NCPS Cloud Interface Reference Architecture, Volume One*, v1.4, May 14, 2021, <https://www.cisa.gov/sites/default/files/2023-02/NCPS%20Cloud%20Interface%20RA%20Volume%20One%202021-05-14.pdf> (accessed Oct 21, 2026).
[^aC-rfc8484]: IETF RFC 8484, *DNS Queries over HTTPS (DoH)*, October 2018, <https://www.rfc-editor.org/info/rfc8484> (accessed Oct 21, 2026).
[^aC-rfc7858]: IETF RFC 7858, *Specification for DNS over Transport Layer Security (TLS)*, May 2016, <https://www.rfc-editor.org/info/rfc7858> (accessed Oct 21, 2026).
[^aC-eaptls]: IETF RFC 5216, *The EAP-TLS Authentication Protocol*, March 2008, <https://www.rfc-editor.org/info/rfc5216>; RFC 9190, *EAP-TLS 1.3: Using the Extensible Authentication Protocol with TLS 1.3*, February 2022, <https://www.rfc-editor.org/info/rfc9190> (accessed Oct 21, 2026).
[^aC-ed2603]: Cybersecurity and Infrastructure Security Agency, ED 26-03, *Mitigate Vulnerabilities in Cisco SD-WAN Systems*, February 25, 2026, <https://www.cisa.gov/news-events/directives/ed-26-03-mitigate-vulnerabilities-cisco-sd-wan-systems> (accessed Oct 21, 2026). The source paper dated it February 26.
[^aC-eis]: General Services Administration, "Enterprise Infrastructure Solutions," <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/telecommunications-and-network-services/enterprise-infrastructure-solutions> (accessed Oct 21, 2026).
[^aC-fedramp]: FedRAMP, "What's Changing," <https://www.fedramp.gov/2026/providers/updating/changes/>, and "Timeline," <https://www.fedramp.gov/2026/timeline/> (both accessed Oct 21, 2026).
[^aC-fr0004]: FedRAMP, Notice 0004, February 25, 2026, <https://www.fedramp.gov/notices/0004/> (accessed Oct 21, 2026). "Class C will include the current Moderate baseline."
[^aC-fips]: National Institute of Standards and Technology, "FIPS 140-3 Transition Effort," <https://csrc.nist.gov/projects/fips-140-3-transition-effort>; FIPS 140-3, *Security Requirements for Cryptographic Modules*, March 22, 2019, <https://csrc.nist.gov/pubs/fips/140-3/final> (both accessed Oct 21, 2026).
[^aC-g114]: International Telecommunication Union, Recommendation ITU-T G.114 (05/2003), *One-way transmission time*, Clause 4 and Table A.1 (optical fibre cable, 5 µs/km, marked provisional), <https://www.itu.int/rec/T-REC-G.114> (accessed Oct 21, 2026). 1 ms per 200 km is the same value restated.
[^aC-rfc4120]: IETF RFC 4120, *The Kerberos Network Authentication Service (V5)*, July 2005, <https://www.rfc-editor.org/info/rfc4120> (accessed Oct 21, 2026).
[^aC-kev]: Cybersecurity and Infrastructure Security Agency, "Known Exploited Vulnerabilities Catalog," <https://www.cisa.gov/known-exploited-vulnerabilities> (accessed Oct 21, 2026).
[^aC-inr]: Microsoft Learn, "Microsoft 365 informed network routing," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide> (accessed Oct 21, 2026).
[^aC-m2614]: Office of Management and Budget, M-26-14, *Ensuring Effective and Efficient Agency Logging and Network Visibility to Defend Against Evolving Cyber Threats*, May 22, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf> (accessed Oct 21, 2026).
[^aC-m2615]: Office of Management and Budget, M-26-15, *Execution of the Migration to Post-Quantum Cryptography*, June 24, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf> (accessed Oct 21, 2026).
[^aC-fips203]: National Institute of Standards and Technology, FIPS 203, *Module-Lattice-Based Key-Encapsulation Mechanism Standard*, August 13, 2024, <https://csrc.nist.gov/pubs/fips/203/final> (accessed Oct 21, 2026).
[^aC-rfc3031]: IETF RFC 3031, *Multiprotocol Label Switching Architecture*, January 2001, <https://www.rfc-editor.org/info/rfc3031> (accessed Oct 21, 2026). On MPLS VPNs not encrypting, see [Chapter 02](02-transport-is-physics-control-is-compliance.md).
[^aC-mtips]: General Services Administration, "Trusted Internet Connections," <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/telecommunications-and-network-services/trusted-internet-connections> (accessed Oct 21, 2026).
[^aC-sp800207]: National Institute of Standards and Technology, SP 800-207, *Zero Trust Architecture*, August 2020, Section 3.1, <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf> (accessed Oct 21, 2026).
[^aC-pdns]: Cybersecurity and Infrastructure Security Agency, "Protective Domain Name System (DNS) Resolver," <https://www.cisa.gov/resources-tools/services/protective-domain-name-system-dns-resolver> (accessed Oct 21, 2026).
[^aC-rfc2865]: IETF RFC 2865, *Remote Authentication Dial In User Service (RADIUS)*, June 2000, <https://www.rfc-editor.org/info/rfc2865> (accessed Oct 21, 2026).
[^aC-scc]: Cybersecurity and Infrastructure Security Agency, *Trusted Internet Connections 3.0, TIC Core Guidance Volume 3: Security Capabilities Catalog*, Version 3.3, publication September 2026, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Security_Capabilities_Catalogs_September_2026_17.pdf> (accessed Oct 21, 2026). The catalog's own revision history dates Version 3.3 to July 2025; the cover says September 2026.
[^aC-sp80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations*, December 2018, Appendix F, <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf> (accessed Oct 21, 2026).
[^aC-sqlport]: Microsoft Learn, "Configure a server to listen on a specific TCP port," <https://learn.microsoft.com/sql/database-engine/configure-windows/configure-a-server-to-listen-on-a-specific-tcp-port> (accessed Oct 21, 2026).
[^aC-trv2]: Microsoft Learn, "Set up tenant restrictions v2," <https://learn.microsoft.com/entra/external-id/tenant-restrictions-v2> (accessed Oct 21, 2026).
[^aC-m1926]: Office of Management and Budget, M-19-26, *Update to the Trusted Internet Connections (TIC) Initiative*, September 12, 2019, <https://www.whitehouse.gov/wp-content/uploads/2019/09/M-19-26.pdf> (accessed Oct 21, 2026).
[^aC-tic]: Cybersecurity and Infrastructure Security Agency, "Trusted Internet Connections," <https://www.cisa.gov/resources-tools/programs/trusted-internet-connections-tic> (accessed Oct 21, 2026).
[^aC-tokenprot]: Microsoft Learn, "Token protection in Microsoft Entra Conditional Access," <https://learn.microsoft.com/entra/identity/conditional-access/concept-token-protection> (accessed Oct 21, 2026).
[^aC-8021x]: IEEE Std 802.1X-2020, *IEEE Standard for Local and Metropolitan Area Networks — Port-Based Network Access Control*, <https://standards.ieee.org/ieee/802.1X/7345/> (from search result, accessed Oct 21, 2026).
[^aC-ntc0013]: FedRAMP, Notice NTC-0013, *Rev5 Baseline Changes*, June 16, 2026, <https://fedramp.gov/notices/0013> (accessed Oct 21, 2026).
