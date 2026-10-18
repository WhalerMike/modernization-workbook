---
title: "Appendix A — DNS Record Types and Ecosystem Integrations"
subtitle: "Record-type catalog, ecosystem integrations, glossary and source note"
doc-type: modernization-book-chapter
audience: [Executive, Architect, Engineer]
family: next-generation-ddi
series-order: 12
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Appendix A — DNS Record Types and Ecosystem Integrations

This appendix is the record-type catalog and integration reference behind the chapters. It is meant to stand alone as a practitioner reference.

## DNS Record Type Catalog

DNS is usually described through A and CNAME records, but IANA registers dozens of resource record types.[^ca-iana] At least fifteen are directly relevant to federal hybrid multi-cloud security, certificate governance, application-aware routing, and threat defense.

### Address and Alias Records

- **A (RFC 1035):** Maps hostname to IPv4. The unit of inconsistency in split-brain DNS; every private endpoint ultimately resolves via an A record.

- **AAAA (RFC 3596):** Maps hostname to IPv6. Central to the OMB M-21-07 IPv6-only targets; dual-stack environments double the governance surface.

- **CNAME (RFC 1034):** Aliases one name to another. Not permitted at the zone apex. Chains create resolution delay and dangling-record risks.

- **ALIAS / ANAME:** Non-standard, provider-specific pseudo-records (for example Route 53 alias records and Azure DNS alias record sets) that resolve CNAME-like references at the zone apex. Behavior varies by implementation.

- **PTR (RFC 1035):** Reverse mapping. Critical for email deliverability, SIEM attribution, some Kerberos validation, and compliance logging. Often neglected in cloud private IP space.

### Service Discovery Records

- **SRV (RFC 2782):** Maps service+protocol to host and port with priority/weight. Essential for Active Directory (\_kerberos, \_ldap, \_gc and others). They do not migrate automatically when AD is deprecated (Chapter 04). Also used by SIP/VoIP, XMPP, and service meshes.

- **NAPTR (RFC 3403):** URI rewriting, primarily for ENUM/VoIP and E911 routing. Often chains to SRV records.

### Certificate Governance Records

- **CAA (RFC 8659):** Specifies which CAs may issue certificates for the domain. Public CAs must check it before issuing. Split-brain can cause internal ACME automation to see different (or missing) CAA data.

- **TLSA / DANE (RFC 6698):** Pins a certificate or public key in DNS. Requires DNSSEC to be meaningful. Provides a second validation path independent of commercial CAs.

- **SSHFP (RFC 4255):** Publishes SSH host key fingerprints. Requires DNSSEC. Binds hostname to cryptographic identity.

- **SMIMEA (RFC 8162):** Associates S/MIME certificates with email addresses. Requires DNSSEC.

### Email Authentication Records

- **SPF (RFC 7208):** TXT record listing authorized senders. A domain may publish only one SPF record, and evaluation is limited to 10 DNS lookups. Split-brain or duplicate records cause permanent errors.

- **DKIM (RFC 6376):** Public key for email signatures, published at selector.\_domainkey. Requires coordinated key rotation.

- **DMARC (RFC 9989, which obsoletes RFC 7489):** Policy for SPF and DKIM failures, plus reporting.[^ca-rfc9989] CISA BOD 18-01 requires p=reject for federal second-level domains.[^ca-bod1801]

- **BIMI:** Brand logo display when DMARC is at enforcement; usually requires a mark certificate. BIMI is an industry specification, not an IETF standard.

- **MTA-STS (RFC 8461):** Forces TLS for inbound mail and rejects downgrade. Depends on both a TXT record and an HTTPS policy file.

### Modern Service Binding Records

- **HTTPS / SVCB (RFC 9460):** Moves protocol negotiation (ALPN, ECH, port, IP hints) into DNS. Significant for HTTP/3/QUIC and for avoiding SNI exposure. Split-brain can leave private resolvers without ECH configuration.

### DNSSEC Record Types

- **DNSKEY, DS, RRSIG, NSEC/NSEC3, CDS/CDNSKEY:** Form the chain of trust, signatures, authenticated denial of existence, and automated parent-child key rollover signaling.[^ca-rfc7344] RRSIG expiration requires automated signing. DS updates must stay synchronized across parent zones.

## Security Integration Matrix (Summary)

High split-brain impact record types include A/AAAA, CNAME, SRV, TLSA/DANE, SPF, HTTPS/SVCB, DNSKEY, and DS. Records that require DNSSEC for security value include TLSA, SSHFP, SMIMEA, and the DNSSEC types themselves. CAA, TLSA, and DNSSEC types have direct PKI integration. Unified DDI is the practical mechanism for applying consistent governance across this entire surface.

## Ecosystem Integrations

Integration requirements for any DDI platform, with the vendor feature names left out; confirm each against current documentation.

- **API:** Full object-model access, consumed by Terraform, Ansible and IPAM-driven CI/CD so that address and DNS record lifecycle stay aligned with infrastructure provisioning.

- **Network discovery:** Active and passive discovery (SNMP, ARP tables, scanning) that populates IPAM with real device state and detects rogue DHCP servers that could distribute malicious Option-6 values.

- **Security and ITSM ecosystem:** Integrations with SIEM platforms (for example Splunk and Microsoft Sentinel), ServiceNow CMDB and ITSM, firewalls (for example exchanging block lists between response policy zones and firewall external dynamic lists), EDR, network access control and vulnerability scanners, so that DNS and DHCP signals to flow into SIEM, SOAR, and EDR workflows.

- **Audit trail and change control:** Every change is logged with actor, timestamp, and interface. Optional approval workflows for production zones or high-impact changes map to NIST SP 800-53 CM controls and federal change-management requirements.

The governance implication is that record types which appear unrelated (for example a CAA record and an SSHFP record) share the same consistency requirement. Fragmented authoritative surfaces subject each record type to independent split-brain risk. A unified DDI plane is the mechanism that applies consistent lifecycle and policy governance across the full record-type surface simultaneously.

## Glossary

- **Split-brain DNS:** Same query returns different answers depending on origin.

- **Split-horizon DNS:** Intentional, governed split-brain, such as different internal and external answers for the same name.

- **GCC-Moderate:** This book's name for Microsoft 365 Government Community Cloud ("GCC"), which runs on the Worldwide service instance at FedRAMP Moderate.

- **Protective DNS:** DNS-layer filtering that blocks known-malicious domains and supports logging and threat detection.

- **RPZ:** Response Policy Zone — DNS mechanism for policy-based responses (block, redirect, etc.).

- **redirect-dns:** Cisco Catalyst SD-WAN data policy that intercepts and redirects DNS queries.

- **INR:** Microsoft 365 informed network routing, telemetry-based path optimization for SD-WAN (Worldwide commercial cloud only; not GCC-Moderate, GCC High or DoD).

- **DNS-01:** ACME challenge type that proves domain control via DNS TXT records.

- **DDI policy plane:** The single authoritative policy plane for DNS, DHCP and IPAM state and policy that this book argues for. Infoblox Universal DDI is one commercial example.

## Source Note

This book was developed from the *Next Generation DDI* whitepaper (Word edition, October 2026). Sources include NIST SP 800-81 Rev. 3 (March 19, 2026) and SP 800-207; OMB M-22-09, M-21-31, M-21-07 and M-08-23; CISA Encrypted DNS Implementation Guidance (May 2024) and BOD 18-01; Microsoft Learn, AWS and Google Cloud documentation; Cisco Catalyst SD-WAN configuration guides; the IETF RFCs cited above; and, as third-party sources, Infoblox and VMware publications and an Infoblox-commissioned ESG survey (February 2025). Product capabilities named in the book illustrate the requirements; confirm them against current vendor documentation.

---

**Previous:** [Chapter 11 — Platform Selection, Cost and Residual Risk](11-selection-cost-and-residual-risk.md)  
**Next:** [Appendix B — Requirements Mapping and Sources](appendix-b-requirements-mapping.md)

[^ca-iana]: IANA, *Domain Name System (DNS) Parameters*, Resource Record (RR) TYPEs registry. <https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml>
[^ca-bod1801]: CISA, Binding Operational Directive 18-01, *Enhance Email and Web Security*, October 16, 2017. <https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security>
[^ca-rfc9989]: IETF RFC 9989, *Domain-based Message Authentication, Reporting, and Conformance (DMARC)*, May 2026, which obsoletes RFC 7489. <https://www.rfc-editor.org/rfc/rfc9989>
[^ca-rfc7344]: IETF RFC 7344, *Automating DNSSEC Delegation Trust Maintenance* (CDS and CDNSKEY), September 2014. <https://www.rfc-editor.org/rfc/rfc7344>
