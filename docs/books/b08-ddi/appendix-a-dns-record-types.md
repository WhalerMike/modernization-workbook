---
title: "Appendix A — DNS Record Types and Ecosystem Integrations"
description: "A practitioner catalog of the DNS record types that matter to federal hybrid multi-cloud security, certificate governance and service routing, with the standard behind each and how split-brain DNS affects it; a security-integration matrix; the integration surface a DDI platform needs; and a glossary."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b08-ddi
book: B08
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — DNS Record Types and Ecosystem Integrations

*Record types that look unrelated share one requirement: every surface that answers for a name has to give the same governed answer.*

::: {.callout-note}
## In this appendix
A catalog of about twenty DNS record types, grouped by function, with the standard that defines each and what goes wrong when the record differs across DNS surfaces; a matrix that summarizes how each type relates to DNSSEC, PKI, split-brain risk, threat defense and routing; the integrations any DDI platform needs; and a glossary of the book's terms. It is meant to stand alone as a reference.
:::

## How to read the catalog

DNS is usually described through two record types, A and CNAME. The IANA Resource Record (RR) TYPEs registry lists close to a hundred assigned type values, including obsolete and experimental ones.[^aA-iana] About twenty of them carry most of the weight in federal hybrid multi-cloud security, certificate governance, service discovery and threat defense. This appendix catalogs those, organized by function. For each, it names the defining standard and says how the record behaves when two DNS surfaces publish different answers for the same name, the split-brain condition that [Chapter 02](02-split-brain-dns.md) describes.

The record-type numbers and defining RFCs below match the IANA registry as of October 2026.[^aA-iana]

## Address and alias records

These records do the job DNS was designed for: mapping names to addresses or to other names.

- **A (RFC 1035).** Maps a hostname to an IPv4 address. In a hybrid multi-cloud environment every DNS surface publishes A records: an on-premises DDI grid or Windows DNS, Amazon Route 53, Azure DNS, Google Cloud DNS. The A record is the unit of inconsistency. Every private endpoint in AWS, Azure or Google Cloud ultimately resolves through an A record, and split-brain shows up as the same name returning different A records from different surfaces ([Chapter 07](07-cloud-private-endpoints-and-ipam.md)).
- **AAAA (RFC 3596).** Maps a hostname to an IPv6 address. OMB M-21-07 set IPv6-only targets for federal IP-enabled assets ([Chapter 07](07-cloud-private-endpoints-and-ipam.md) gives the milestones), so most federal hybrid environments now run dual-stack and must publish A and AAAA records consistently on every surface. The governance surface doubles. In the program's experience, an IPv6 split-brain condition is easy to miss because troubleshooting habits and many scripts test IPv4 resolution first.
- **CNAME (RFC 1034).** Aliases one name to another. RFC 1034 says that if a CNAME is present at a node, no other data should be present.[^aA-rfc1034] Because the zone apex always carries SOA and NS records, a CNAME can't sit at the apex: an agency can alias `www.agency.gov` but not `agency.gov` itself.[^aA-azure-alias] That restriction matters for load balancing and CDN integration. CNAME chains add a lookup per hop, and a CNAME that still points at a deprovisioned cloud resource or a name someone else can claim is a dangling record, the starting point for subdomain takeover.
- **ALIAS / ANAME (provider-specific, not standardized).** Cloud and DDI providers synthesize a CNAME-like reference that is answered as A or AAAA records, which works around the apex restriction. Route 53 alias records are "a Route 53–specific extension to DNS," can be created at the zone apex, and appear to a `dig` client as the record type they were created as, such as A or AAAA.[^aA-r53-alias] Azure DNS alias record sets qualify an A, AAAA or CNAME record set so it tracks an Azure resource (a public IP address, a Traffic Manager profile, an Azure CDN or Front Door endpoint), and they keep the record from dangling when the resource is deleted.[^aA-azure-alias] Neither ALIAS nor ANAME appears in the IANA registry,[^aA-iana] so behavior varies between implementations. That is a governance gap when one zone is managed across several surfaces.
- **PTR (RFC 1035).** Maps an address to a name in the `in-addr.arpa.` (IPv4) or `ip6.arpa.` (IPv6) reverse tree. PTR records are the most commonly neglected type in cloud private address space. They matter for mail (receiving servers commonly reject or score down mail from hosts without reverse DNS), for security analytics that resolve source addresses to host names, and for log attribution generally. Some Kerberos clients also use reverse lookups: MIT Kerberos, by default, uses a reverse lookup in addition to the forward lookup when it canonicalizes a host name into a service principal name.[^aA-mit-krb5] Cloud private address space needs explicit PTR management; the program's position is that IPAM-driven allocation should create the A and PTR records together.

## Service discovery records

- **SRV (RFC 2782).** Maps a service and transport to a host and port, with priority and weight fields for load sharing. The owner-name format is:

  ```text
  _service._proto.name. TTL IN SRV priority weight port target.
  ```

  SRV records are the most security-consequential record type in Active Directory and the most underestimated in AD retirement planning. The Netlogon service on each domain controller registers the DC locator records, among them:[^aA-netlogon]

  | DC locator record | What it locates |
  |---|---|
  | `_ldap._tcp.<DnsDomainName>` | Domain controllers (LDAP) for the domain |
  | `_ldap._tcp.dc._msdcs.<DnsDomainName>` | Domain controllers, through the `_msdcs` locator subtree |
  | `_ldap._tcp.<SiteName>._sites.dc._msdcs.<DnsDomainName>` | Domain controllers in a given AD site |
  | `_ldap._tcp.pdc._msdcs.<DnsDomainName>` | The PDC emulator |
  | `_ldap._tcp.gc._msdcs.<DnsForestName>` and `_gc._tcp.<DnsForestName>` | Global catalog servers for the forest |
  | `_kerberos._tcp.<DnsDomainName>`, `_kerberos._udp.<DnsDomainName>` and `_kerberos._tcp.dc._msdcs.<DnsDomainName>` | Kerberos KDCs |
  | `_kpasswd._tcp.<DnsDomainName>` and `_kpasswd._udp.<DnsDomainName>` | Kerberos password change |
  | `<DsaGuid>._msdcs.<DnsForestName>` (CNAME) and `gc._msdcs.<DnsForestName>` (A) | DC replication identity and global catalog addresses |

  Netlogon also registers site-specific variants of most of these and re-registers them every hour.[^aA-netlogon] Domain-joined Windows clients find a domain controller by querying records such as `_ldap._tcp.<DnsDomainName>`.[^aA-dclocator] When an agency retires AD DS (an agency decision; [Chapter 04](04-active-directory-dns-departure.md) covers the departure), none of these records move to any replacement automatically. Applications that look up LDAP or Kerberos through SRV records, including AD-joined Linux hosts, many legacy Java applications and some network devices, fail quietly or with misleading errors once the records disappear. SRV records are the DNS representation of service topology, and their lifecycle has to be governed separately from the servers they point to ([Chapter 10](10-migration-sequence.md) sequences this).

  Outside Active Directory, standards-based protocols that locate services through SRV include SIP (`_sip._udp`, `_sip._tcp`, `_sips._tcp`),[^aA-rfc3263] XMPP (`_xmpp-client._tcp`, `_xmpp-server._tcp`)[^aA-rfc6120] and mail client configuration (`_submission._tcp`, `_imap._tcp`, `_imaps._tcp`, `_pop3._tcp`, `_pop3s._tcp`; SMTP relaying between servers uses MX records, not SRV).[^aA-rfc6186] Some service-discovery systems, such as HashiCorp Consul, also answer SRV queries for the services they register.[^aA-consul]

- **NAPTR (RFC 3403).** Naming Authority Pointer records rewrite a name or URI using regular expressions and point to the next lookup. ENUM uses NAPTR records to translate E.164 telephone numbers into URIs such as SIP addresses.[^aA-rfc6116] SIP also uses NAPTR before SRV: a client resolving a SIP URI with no explicit transport or port first queries NAPTR records, which map the domain to the SRV name for each transport.[^aA-rfc3263] In federal environments NAPTR records appear wherever telephony, unified communications or PSTN interconnects depend on DNS, so they belong in the same inventory as SRV.

## Certificate governance records

These records govern certificate issuance or establish cryptographic trust through DNS. [Chapter 06](06-dns-identity-and-dnssec.md) explains the trust chain they support.

- **CAA (RFC 8659).** Certification Authority Authorization records name the CAs allowed to issue certificates for a domain. The standard defines three property tags: `issue` (which issuers may issue for the domain), `issuewild` (which may issue wildcard certificates; when present it takes precedence over `issue` for wildcard names) and `iodef` (a `mailto:` or `http(s):` URL for reporting policy violations).[^aA-rfc8659] RFC 8659 says a compliant CA "MUST check for publication of a Relevant RRset" before issuing,[^aA-rfc8659] and the CA/Browser Forum made CAA checking mandatory for publicly trusted CAs from September 8, 2017 (Baseline Requirements section 3.2.2.8).[^aA-cab187] A CAA mismatch makes issuance fail, which in a poorly governed DNS estate shows up as certificate renewal failures blamed on the CA. In a split-brain estate, a cloud workload that queries its local resolver can see a different or missing CAA record from the one the public authoritative server publishes. That rarely affects public issuance, which queries the public authoritative servers, but it does affect internal ACME automation running inside private cloud networks.
- **TLSA (RFC 6698), used by DANE.** DNS-Based Authentication of Named Entities associates a certificate or public key with a name, so clients can validate a TLS certificate through DNS rather than only through the CA hierarchy. A TLSA record has three fields: certificate usage (0, CA constraint; 1, service certificate constraint; 2, trust anchor assertion; 3, domain-issued certificate), selector (0, full certificate; 1, SubjectPublicKeyInfo) and matching type (0, exact; 1, SHA-256; 2, SHA-512).[^aA-rfc6698] DANE matters for agencies because it gives a second TLS validation path that doesn't depend on commercial CAs: an agency running its own CA hierarchy can publish TLSA records saying that only its own certificates are valid for a name. RFC 6698 is explicit that the security of TLSA rests on DNSSEC: "the DNS information needs to be protected by DNSSEC."[^aA-rfc6698] The dependency chain is DANE → DNSSEC → consistent authoritative DNS on every surface.
- **SSHFP (RFC 4255).** Publishes SSH host-key fingerprints so clients can verify host keys through DNS instead of `known_hosts`. A verified key "MUST NOT be trusted" unless the SSHFP record was authenticated by DNSSEC.[^aA-rfc4255] In zero trust terms SSHFP binds a host name to its cryptographic identity, as a certificate SAN does for TLS.
- **SMIMEA (RFC 8162).** Associates an S/MIME certificate with an email address for certificate discovery without a central directory. The owner name is a SHA-256 hash of the mailbox local part (truncated to 28 octets) under `_smimecert.<domain>`, and the answer must validate as DNSSEC "Secure." RFC 8162 is an Experimental RFC, not a standard, and deployment is limited.[^aA-rfc8162]

## Email authentication records

Email authentication is published almost entirely in TXT records (plus HTTPS for MTA-STS), and the mechanisms depend on each other. That interdependency makes email one of the most frequently misconfigured DNS surfaces in federal environments.

- **SPF (RFC 7208).** A TXT record listing the hosts allowed to send mail for a domain (`v=spf1 … -all`). SPF must be published as a TXT record; the experimental SPF RR type (99) was discontinued.[^aA-rfc7208] Three governance failure modes recur in multi-cloud estates:
  1. *Multiple records.* A domain must not publish more than one SPF record; if more than one `v=spf1` record remains, evaluation returns `permerror`. Each SaaS sender (Microsoft 365, CRM platforms, bulk mail services) asks for its own `include:`, and agencies end up with duplicate records.[^aA-rfc7208]
  2. *The ten-lookup limit.* Evaluation may make at most ten DNS-querying terms, counted globally across nested includes: `include`, `a`, `mx`, `ptr`, `exists` and the `redirect` modifier count; `ip4`, `ip6` and `all` don't. Exceeding the limit returns `permerror`.[^aA-rfc7208]
  3. *Split-brain.* An SPF record that resolves differently on internal and external resolvers can cause mail from internal relays to fail SPF at receiving servers.
- **DKIM (RFC 6376).** A TXT record at `<selector>._domainkey.<domain>` holds the public key matching the private key that signs outbound mail.[^aA-rfc6376] Selectors let a domain publish several keys at once; RFC 6376 describes rotation as publishing the new key under a new selector, switching signing, and removing the old key after a transition period.[^aA-rfc6376] The governance work is coordinated rotation (the private key lives in the mail system, the public key in DNS) and removing orphaned selectors left behind by decommissioned mail systems.
- **DMARC (RFC 9989).** A TXT record at `_dmarc.<domain>` tells receivers what to do when SPF and DKIM alignment fail (`none`, `quarantine` or `reject`) and where to send reports. RFC 9989 (May 2026) obsoletes RFC 7489 and RFC 9091; it removes the `pct` tag and replaces Public Suffix List lookups with a DNS tree walk to find the organizational domain. Aggregate and failure reporting moved to companion RFCs 9990 and 9991.[^aA-rfc9989] CISA BOD 18-01 required agencies to publish DMARC on all second-level domains and to reach `p=reject` on all second-level domains and mail-sending hosts by October 16, 2018.[^aA-bod1801] Aggregate reports are how an agency discovers who is sending mail as its domain, including spoofers.
- **BIMI (Internet-Draft, not an RFC).** Brand Indicators for Message Identification publishes a TXT record at `<selector>._bimi.<domain>` (`default._bimi` by default) pointing to a logo and, optionally, an evidence document such as a Verified Mark Certificate or Common Mark Certificate. The draft requires DMARC enforcement (`quarantine` or `reject`) on both the organizational domain and the From domain. It is an individual Internet-Draft (revision 14, May 2026) with "no formal standing" in the IETF standards process.[^aA-bimi] Treat it as an industry specification, not a federal requirement.
- **MTA-STS (RFC 8461).** A TXT record at `_mta-sts.<domain>` plus a policy file at `https://mta-sts.<domain>/.well-known/mta-sts.txt` tell sending servers to require TLS when delivering to the domain, with modes `enforce`, `testing` and `none`. The policy host must present a valid certificate, and in `enforce` mode the MX hosts must too.[^aA-rfc8461] MTA-STS therefore adds both a web-server dependency and a PKI dependency to mail delivery.

## Modern service binding records

- **SVCB and HTTPS (RFC 9460, November 2023).** These records move service negotiation into DNS; HTTPS is the SVCB form for HTTP services.[^aA-rfc9460] An HTTPS record can carry ALPN values (for example HTTP/3, HTTP/2), an alternative port, and IPv4 and IPv6 address hints that save a separate A or AAAA lookup.[^aA-rfc9460] The Encrypted Client Hello configuration that hides the TLS server name from network observers is carried in the `ech` parameter, which RFC 9848 defines (March 2026) alongside the ECH protocol itself in RFC 9849.[^aA-ech] For agencies, HTTPS records matter in three ways:
  1. *Split-brain.* If HTTPS records are published externally but not in private zones, internal clients don't receive the ECH configuration or protocol hints, and behavior differs inside and outside the network.
  2. *Inspection.* ECH removes the server name that many inspection and filtering tools read from the TLS handshake, which changes how DNS-layer and network-layer policy interact ([Chapter 05](05-edge-interception-and-bypass.md)).
  3. *HTTP/3 and QUIC.* Agencies adopting QUIC for performance have to govern HTTPS records as part of that adoption, on every surface, as they do A records.

## DNSSEC record types

DNSSEC (RFCs 4033, 4034 and 4035) adds origin authentication and data integrity to DNS answers. It doesn't encrypt queries. RFC 9364 (BCP 237) summarizes the DNSSEC document set.[^aA-rfc9364]

- **DNSKEY.** Holds the public keys for the zone. Operators conventionally split them into a key-signing key (KSK), which signs the DNSKEY set, and a zone-signing key (ZSK), which signs the rest of the zone, so the ZSK can roll more often. The Secure Entry Point flag that marks a KSK is only a hint; validators don't treat the keys differently.[^aA-rfc4034]
- **DS (Delegation Signer).** Lives in the parent zone and holds a digest of a child DNSKEY. It is the link that lets a validator follow the chain of trust from the root. If the DS record is missing, or doesn't match the child's DNSKEY, the chain breaks and validation fails.[^aA-azure-dnssec] When an agency signs a delegated subdomain, the DS has to be published at the parent: the registrar for a second-level domain, or the parent zone's operator. In a multi-cloud estate, every delegated subdomain's DS has to be kept in step with its KSK rollovers; publishing the new DS before the old key is withdrawn is what keeps validating resolvers from returning SERVFAIL.
- **RRSIG.** The signature over each signed record set, with an inception and an expiration time; a signature "MUST NOT be used for authentication after the expiration date."[^aA-rfc4034] If re-signing doesn't complete before signatures expire, validating resolvers return SERVFAIL for the zone's data, so signing has to be automated.
- **NSEC and NSEC3.** Authenticated denial of existence: the signed proof that a name doesn't exist. NSEC links the zone's existing names in order, which lets anyone walk the zone and list its names. NSEC3 hashes the names first, which raises the cost of enumeration but doesn't prevent offline dictionary attacks on the hashes. RFC 9276 (BCP 236, August 2022) runs against a common federal habit: when NSEC3 is used, "an iterations count of 0 MUST be used," operators "SHOULD NOT use a salt," and "for small zones, the use of opt-out-based NSEC3 records is NOT RECOMMENDED."[^aA-rfc9276] Opt-out suppresses NSEC3 records for unsigned delegations; it is an efficiency mechanism for very large, sparsely signed zones, not a privacy control. A newer option, compact denial of existence (RFC 9824), answers for a nonexistent name with a signed NODATA response and a single synthesized NSEC record, which resists zone walking; Azure Public DNS uses it instead of classic NSEC or NSEC3.[^aA-rfc9824][^aA-azure-dnssec] Federal zones whose names are sensitive should use NSEC3 with zero iterations and no salt, or compact denial where the platform supports it, and use opt-out only in large delegation-centric zones.
- **CDS and CDNSKEY (RFC 7344).** Let a child zone signal the DS content it wants its parent to publish, which automates the most error-prone step in a KSK rollover: coordination between the child and parent operators.[^aA-rfc7344] They only help where the parent (registrar or parent-zone operator) acts on them.

## Security integration matrix

The table summarizes how each record type relates to the enforcement mechanisms federal hybrid environments use. "Split-brain impact" is the program's assessment of how badly the record type fails when surfaces disagree.

| Record type | Requires DNSSEC | CA and PKI integration | Split-brain impact | Threat-defense relevance | Application-aware routing |
|---|---|---|---|---|---|
| A / AAAA | No | Indirect (certificate SAN must match) | High: core private/public divergence | Response policy zone (RPZ) blocking target | FQDN-based path selection |
| CNAME | No | Indirect | High: dangling records, takeover | RPZ evaluates the chain | FQDN forwarding |
| ALIAS / ANAME | No | Indirect | High: provider-specific behavior | As A / AAAA | As A / AAAA |
| PTR | No | No | Medium | Logging and attribution | No |
| SRV | No | No | High: orphaned at AD retirement | No | Service discovery |
| NAPTR | No | No | Low | No | Telephony and UC routing |
| CAA | No | Direct: controls issuance | Medium | Issuance audit | No |
| TLSA (DANE) | Required | Direct: certificate pinning through DNS | High: the pin must match on every surface | Certificate validation layer | No |
| SSHFP | Required | SSH host-key binding | Medium | Host-key validation | No |
| SMIMEA | Required | S/MIME certificate discovery | Low | Encrypted email | No |
| SPF (TXT) | No | No | High: duplicate-record failures | Spoofing defense | No |
| DKIM (TXT) | No | Indirect (key rotation) | Low | Message integrity | No |
| DMARC (TXT) | No | No | Medium | Spoofing enforcement | No |
| BIMI (TXT) | No | Mark certificate | Low | Brand protection | No |
| MTA-STS (TXT plus HTTPS) | No | TLS certificate required | Medium | SMTP downgrade defense | No |
| SVCB / HTTPS | No | ECH configuration | High: ECH and hints missing from private zones | Protocol negotiation | HTTP/3 and QUIC |
| DNSKEY | Part of DNSSEC | Direct: zone signing | High | Zone integrity | No |
| DS | Part of DNSSEC (parent) | Direct: chain of trust | High: KSK rollover coordination | Chain of trust | No |
| RRSIG | Part of DNSSEC | Direct: record signing | High | Signature freshness | No |
| NSEC / NSEC3 | Part of DNSSEC | No | Medium | Raises the cost of zone enumeration | No |
| CDS / CDNSKEY | Part of DNSSEC | Direct: automated rollover | Medium | Automated key management | No |

Read across the table and the pattern is clear. The record types with high split-brain impact are A and AAAA, CNAME, SRV, TLSA, SPF, SVCB/HTTPS and the DNSSEC types. TLSA, SSHFP, SMIMEA and the DNSSEC types are only as good as DNSSEC. CAA, TLSA and the DNSSEC types integrate directly with PKI. Record types that look unrelated, a CAA record and an SSHFP record for example, share the same consistency requirement: if authoritative DNS is fragmented across five systems, each type is independently exposed to split-brain. The program's position is that a single authoritative DDI policy plane is the practical way to apply one lifecycle and one policy across this whole surface ([Chapter 08](08-reference-architecture.md)).

## Ecosystem integrations

These are the integrations any DDI platform needs in a federal estate. Vendor products named below are examples whose integration is documented by the vendor; confirm each against current documentation before relying on it, and check its authorization status as [Chapter 12](12-selection-cost-and-residual-risk.md) describes.

| Integration | What it does | Example (vendor-documented) |
|---|---|---|
| Object-model API | Every IPAM, DNS and DHCP object is reachable through a documented API, so address and record lifecycle can live in the same pipeline as the infrastructure it serves | Infoblox WAPI (NIOS) and the Universal DDI API |
| Infrastructure as code | A workload and its A and PTR records are created and destroyed in the same plan, closing the gap between infrastructure and DNS | Terraform providers for NIOS (`infobloxopen/infoblox`) and Universal DDI (`infobloxopen/bloxone`)[^aA-tf-nios][^aA-tf-bloxone] |
| Configuration management | Record and address changes run from playbooks alongside host configuration | Ansible collection `infoblox.nios_modules`[^aA-ansible] |
| IPAM-driven provisioning | Pipelines allocate addresses from IPAM at deploy time, so every workload gets a tracked address and record; cloud IPAM can delegate authority to the enterprise IPAM | Amazon VPC IPAM private scopes can name Infoblox IPAM as their external authority ([Chapter 07](07-cloud-private-endpoints-and-ipam.md))[^aA-aws-ipam] |
| Network discovery | Active and passive discovery (SNMP, ARP and neighbor tables, scanning) keeps IPAM aligned with what is actually on the network, and flags DHCP servers that aren't authorized, which could hand out a malicious DNS server in option 6 ([Chapter 05](05-edge-interception-and-bypass.md)) | Infoblox NetMRI with NIOS raises a rogue DHCP server issue for unapproved DHCP servers it discovers[^aA-netmri] |
| SIEM | DNS query logs, DHCP lease events and threat events reach the SOC, correlated with identity and endpoint signals | Microsoft Sentinel data connectors for NIOS syslog and the Infoblox cloud data connector; the Splunk Add-on for Infoblox (NIOS DNS and DHCP logs)[^aA-sentinel][^aA-splunk] |
| ITSM and CMDB | Address requests through the service catalog; IPAM data populates and reconciles the CMDB | ServiceNow Service Graph Connector for Infoblox (subnets, allocated addresses and DNS records into the CMDB)[^aA-snow] |
| Firewall and threat-intelligence sharing | IPAM changes and DNS threat events (RPZ hits, threat analytics) are pushed to firewall address objects, so a DNS-layer detection becomes a network-layer block | NIOS outbound API integration with Palo Alto Networks firewalls (static and dynamic address groups)[^aA-ib-pan] |
| Vulnerability management | Discovered address inventory sets scanner scope | NIOS outbound API integration with Tenable[^aA-ib-tenable] |
| EDR and network access control | DHCP history answers "who had this address during the incident?"; address context feeds access-control decisions | Integration category; confirm specific products with the vendors |

DNS is often the earliest signal of an incident. A command-and-control beacon resolves a name before it opens a connection, and a new DHCP fingerprint appears before a rogue device shows up in a vulnerability scan. The integration surface is what lets that early signal reach the SIEM, SOAR and EDR workflows that act on it ([Chapter 11](11-operating-the-control-plane.md)).

### Audit trail and change control

Every change to DNS records, DHCP scopes, IPAM allocations and policy objects should be logged with who made it, what changed, when, and through which interface (console, API or pipeline). That log answers the question incident responders and ATO reviewers both ask: when was this record added, and by whom? Approval workflows for production zones or high-impact changes (an option 6 change on a large scope, for example) map to NIST SP 800-53 CM-3, Configuration Change Control, which requires organizations to review and approve configuration-controlled changes and retain records of them.[^aA-53] [Appendix B](appendix-b-requirements-mapping.md) maps these to the rest of the federal requirements.

## Glossary

- **Split-brain DNS:** The same query returns different answers depending on where it comes from, without anyone intending it.
- **Split-horizon DNS:** Intentional, governed split answers, such as different internal and external answers for the same name.
- **GCC-Moderate:** This book's name for Microsoft 365 Government Community Cloud ("GCC"), which uses the Worldwide endpoint set and is listed on the FedRAMP Marketplace at Moderate ([Appendix C](appendix-c-applicability.md)).
- **Protective DNS:** DNS-layer filtering that blocks known-malicious domains and produces logs for threat detection. CISA operates a Protective DNS resolver service for federal civilian agencies ([Chapter 03](03-federal-requirements.md)).
- **RPZ:** Response policy zone, a DNS mechanism for policy-based answers such as block or redirect.
- **redirect-dns:** A Cisco Catalyst SD-WAN data-policy action that intercepts DNS queries and redirects them to a specified resolver ([Chapter 05](05-edge-interception-and-bypass.md)).
- **INR:** Microsoft 365 informed network routing, telemetry-based path optimization shared with an SD-WAN; supported only in the Worldwide commercial cloud, not GCC-Moderate, GCC High or DoD ([Appendix C](appendix-c-applicability.md)).
- **DNS-01:** The ACME challenge type that proves control of a domain by publishing a TXT record ([Chapter 11](11-operating-the-control-plane.md)).
- **ECH:** Encrypted Client Hello, the TLS extension that encrypts the ClientHello, including the server name; its DNS configuration travels in SVCB and HTTPS records.
- **DDI policy plane:** The single authoritative plane for DNS, DHCP and IPAM state and policy that this book argues for. Infoblox Universal DDI is one commercial example.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 12 — Platform Selection, Cost and Residual Risk](12-selection-cost-and-residual-risk.md) · [Book index](index.md) · [Next: Appendix B — Requirements Mapping and Sources →](appendix-b-requirements-mapping.md)
:::

[^aA-iana]: Internet Assigned Numbers Authority, "Domain Name System (DNS) Parameters," Resource Record (RR) TYPEs registry (last updated October 16, 2026), <https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml> (accessed Oct 20, 2026).
[^aA-rfc1034]: IETF, RFC 1034, *Domain Names — Concepts and Facilities*, November 1987, §3.6.2, <https://www.rfc-editor.org/rfc/rfc1034> (accessed Oct 20, 2026).
[^aA-azure-alias]: Microsoft Learn, "Alias records overview — Azure DNS," <https://learn.microsoft.com/en-us/azure/dns/dns-alias> (accessed Oct 20, 2026).
[^aA-r53-alias]: Amazon Web Services, *Amazon Route 53 Developer Guide*, "Choosing between alias and non-alias records," <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html> (accessed Oct 20, 2026).
[^aA-mit-krb5]: MIT Kerberos Documentation, "krb5.conf," `[libdefaults]` relations `dns_canonicalize_hostname` and `rdns`, <https://web.mit.edu/kerberos/krb5-latest/doc/admin/conf_files/krb5_conf.html> (accessed Oct 20, 2026).
[^aA-netlogon]: Microsoft Learn, "Problems occur with DCs in AD integrated DNS zones" (KB 267855; DC locator record mnemonics and hourly Netlogon registration), <https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/problems-with-dc-ad-integrated-dns-zones> (accessed Oct 20, 2026).
[^aA-dclocator]: Microsoft Learn, "Locating domain controllers in Windows and Windows Server," <https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/dc-locator> (accessed Oct 20, 2026).
[^aA-rfc3263]: IETF, RFC 3263, *Session Initiation Protocol (SIP): Locating SIP Servers*, June 2002, <https://www.rfc-editor.org/rfc/rfc3263> (accessed Oct 20, 2026).
[^aA-rfc6120]: IETF, RFC 6120, *Extensible Messaging and Presence Protocol (XMPP): Core*, March 2011, §3.2.1, <https://www.rfc-editor.org/rfc/rfc6120> (accessed Oct 20, 2026).
[^aA-rfc6186]: IETF, RFC 6186, *Use of SRV Records for Locating Email Submission/Access Services*, March 2011, <https://www.rfc-editor.org/rfc/rfc6186> (accessed Oct 20, 2026).
[^aA-consul]: HashiCorp, "Consul DNS reference," <https://developer.hashicorp.com/consul/docs/reference/dns> (accessed Oct 20, 2026). Third-party source.
[^aA-rfc6116]: IETF, RFC 6116, *The E.164 to Uniform Resource Identifiers (URI) Dynamic Delegation Discovery System (DDDS) Application (ENUM)*, March 2011, <https://www.rfc-editor.org/info/rfc6116> (accessed Oct 20, 2026).
[^aA-rfc8659]: IETF, RFC 8659, *DNS Certification Authority Authorization (CAA) Resource Record*, November 2019, §3 and §4, <https://www.rfc-editor.org/rfc/rfc8659> (accessed Oct 20, 2026).
[^aA-cab187]: CA/Browser Forum, "Ballot 187 — Make CAA Checking Mandatory" (adds Baseline Requirements §3.2.2.8, effective September 8, 2017), <https://cabforum.org/2017/03/08/ballot-187-make-caa-checking-mandatory/> (accessed Oct 20, 2026).
[^aA-rfc6698]: IETF, RFC 6698, *The DNS-Based Authentication of Named Entities (DANE) Transport Layer Security (TLS) Protocol: TLSA*, August 2012, §1.3, §2.1 and §8, <https://www.rfc-editor.org/rfc/rfc6698> (accessed Oct 20, 2026).
[^aA-rfc4255]: IETF, RFC 4255, *Using DNS to Securely Publish Secure Shell (SSH) Key Fingerprints*, January 2006, §2.4, <https://www.rfc-editor.org/rfc/rfc4255> (accessed Oct 20, 2026).
[^aA-rfc8162]: IETF, RFC 8162, *Using Secure DNS to Associate Certificates with Domain Names for S/MIME* (Experimental), May 2017, <https://www.rfc-editor.org/rfc/rfc8162> (accessed Oct 20, 2026).
[^aA-rfc7208]: IETF, RFC 7208, *Sender Policy Framework (SPF) for Authorizing Use of Domains in Email, Version 1*, April 2014, §3.1, §3.2, §4.5 and §4.6.4, <https://www.rfc-editor.org/rfc/rfc7208> (accessed Oct 20, 2026).
[^aA-rfc6376]: IETF, RFC 6376, *DomainKeys Identified Mail (DKIM) Signatures*, September 2011, <https://www.rfc-editor.org/rfc/rfc6376> (accessed Oct 20, 2026).
[^aA-rfc9989]: IETF, RFC 9989, *Domain-Based Message Authentication, Reporting, and Conformance (DMARC)*, May 2026 (obsoletes RFC 7489 and RFC 9091), <https://www.rfc-editor.org/rfc/rfc9989>; publication date per <https://datatracker.ietf.org/doc/rfc9989/> (both accessed Oct 20, 2026).
[^aA-bod1801]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 18-01, *Enhance Email and Web Security*, October 16, 2017, <https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security> (accessed Oct 20, 2026).
[^aA-bimi]: IETF Datatracker, draft-brand-indicators-for-message-identification-14, *Brand Indicators for Message Identification (BIMI)*, individual Internet-Draft, May 1, 2026, <https://datatracker.ietf.org/doc/draft-brand-indicators-for-message-identification/> and <https://datatracker.ietf.org/doc/html/draft-brand-indicators-for-message-identification-14> (both accessed Oct 20, 2026).
[^aA-rfc8461]: IETF, RFC 8461, *SMTP MTA Strict Transport Security (MTA-STS)*, September 2018, <https://www.rfc-editor.org/rfc/rfc8461> (accessed Oct 20, 2026).
[^aA-rfc9460]: IETF, RFC 9460, *Service Binding and Parameter Specification via the DNS (SVCB and HTTPS Resource Records)*, November 2023, §7, <https://www.rfc-editor.org/rfc/rfc9460>; publication date per <https://datatracker.ietf.org/doc/rfc9460/> (both accessed Oct 20, 2026).
[^aA-ech]: IETF, RFC 9848, *Bootstrapping TLS Encrypted ClientHello with DNS Service Bindings*, March 2026, <https://www.rfc-editor.org/info/rfc9848>, and RFC 9849, *TLS Encrypted Client Hello*, <https://www.rfc-editor.org/info/rfc9849> (both accessed Oct 20, 2026).
[^aA-rfc9364]: IETF, RFC 9364, *DNS Security Extensions (DNSSEC)*, BCP 237, February 2023, <https://www.rfc-editor.org/rfc/rfc9364> (accessed Oct 20, 2026).
[^aA-rfc4034]: IETF, RFC 4034, *Resource Records for the DNS Security Extensions*, March 2005, <https://www.rfc-editor.org/rfc/rfc4034> (accessed Oct 20, 2026).
[^aA-azure-dnssec]: Microsoft Learn, "DNSSEC overview" (Azure Public DNS; chain of trust, key rollover, RFC 9824 denial of existence), <https://learn.microsoft.com/en-us/azure/dns/dnssec> (accessed Oct 20, 2026).
[^aA-rfc9276]: IETF, RFC 9276, *Guidance for NSEC3 Parameter Settings*, BCP 236, August 2022, §3.1, <https://www.rfc-editor.org/rfc/rfc9276>; date and BCP number per <https://datatracker.ietf.org/doc/rfc9276/> (both accessed Oct 20, 2026).
[^aA-rfc9824]: IETF, RFC 9824, *Compact Denial of Existence in DNSSEC*, <https://www.rfc-editor.org/info/rfc9824> (accessed Oct 20, 2026).
[^aA-rfc7344]: IETF, RFC 7344, *Automating DNSSEC Delegation Trust Maintenance*, September 2014, <https://www.rfc-editor.org/rfc/rfc7344> (accessed Oct 20, 2026).
[^aA-tf-nios]: HashiCorp Terraform Registry, "infobloxopen/infoblox" (Infoblox NIOS Terraform Provider, partner tier), <https://registry.terraform.io/providers/infobloxopen/infoblox> (accessed Oct 20, 2026). Third-party source.
[^aA-tf-bloxone]: HashiCorp Terraform Registry, "infobloxopen/bloxone" (Universal DDI provider, partner tier), <https://registry.terraform.io/providers/infobloxopen/bloxone> (accessed Oct 20, 2026). Third-party source.
[^aA-ansible]: Ansible Documentation, "Infoblox.Nios_Modules," <https://docs.ansible.com/ansible/latest/collections/infoblox/nios_modules/index.html> (accessed Oct 20, 2026). Third-party source.
[^aA-aws-ipam]: Amazon Web Services, *Amazon VPC IPAM User Guide*, "Integrate VPC IPAM with Infoblox infrastructure" (private scopes only), <https://docs.aws.amazon.com/vpc/latest/ipam/integrate-infoblox-ipam.html> (accessed Oct 20, 2026).
[^aA-netmri]: Infoblox Documentation, NetMRI rogue DHCP server detection with NIOS, <https://infoblox-docs.atlassian.net/wiki/x/9o3v> (accessed Oct 20, 2026). Third-party source.
[^aA-sentinel]: Microsoft Learn, "Find your Microsoft Sentinel data connector" (Infoblox Cloud Data Connector and Infoblox data connectors), <https://learn.microsoft.com/en-us/azure/sentinel/data-connectors-reference>, and "Syslog via AMA connector — configure appliances and devices," section "Infoblox Network Identity Operating System (NIOS)," <https://learn.microsoft.com/en-us/azure/sentinel/unified-connector-syslog-device> (both accessed Oct 20, 2026).
[^aA-splunk]: Splunk Documentation, "About the Splunk Add-on for Infoblox," <https://docs.splunk.com/Documentation/AddOns/latest/Infoblox> (accessed Oct 20, 2026). Third-party source.
[^aA-snow]: ServiceNow Store, "Service Graph Connector for Infoblox," <https://store.servicenow.com/store/app/eeb927621b246a50a85b16db234bcbf1> (accessed Oct 20, 2026). Third-party source.
[^aA-ib-pan]: Infoblox, *PAN Firewall & Infoblox NIOS Outbound API Integration*, deployment guide, December 2023, <https://infoblox.com/resources/deployment-guides/infoblox-nios-integration-with-palo-alto-networks-firewall> (accessed Oct 20, 2026). Third-party source.
[^aA-ib-tenable]: Infoblox, *Tenable.io + Infoblox NIOS Outbound API Integration*, deployment guide, <https://infoblox.com/resources/deployment-guides/integration-with-tenable-io> (accessed Oct 20, 2026). Third-party source.
[^aA-53]: NIST, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations* (Release 5.2.0), CM-3, Configuration Change Control, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; control text checked against NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (both accessed Oct 20, 2026).
