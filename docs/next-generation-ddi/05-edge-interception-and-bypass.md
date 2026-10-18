---
title: "Edge Interception, Encrypted DNS and Rogue DHCP"
subtitle: "Where queries escape the governed resolver path"
doc-type: modernization-book-chapter
audience: [Executive, Architect, Engineer]
family: next-generation-ddi
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 05 — Edge Interception, Encrypted DNS and Rogue DHCP

*Where queries escape the governed resolver path.*

::: {.callout-tip}
## Download this chapter
**[next-generation-ddi-ch05-bundle.docx](../../downloads/next-generation-ddi-ch05-bundle.docx)**: this chapter as a Word document, with its figures. The [whole book](../../downloads/next-generation-ddi-bundle.docx) is also available.
:::

## SD-WAN DNS Interception

![The redirect-dns destination decides whether agency policy applies at all.](../images/ddi/diagrams/svg/ddi-05-redirect-dns.svg){fig-alt="A branch client sends plain DNS on UDP 53 to the SD-WAN edge, whose redirect-dns data policy sends it either to an agency-controlled resolver, where RPZ, DNSSEC validation and logging apply before forwarding upstream to Protective DNS, or to an external resolver that the agency policy plane never sees."}

SD-WAN edges can intercept DNS regardless of the resolver a client was configured with. In Cisco Catalyst SD-WAN this is the redirect-dns action of a centralized data policy: the edge router matches DNS traffic and sends it to a policy-designated resolver. Cisco documents the feature for IPv4 DNS over UDP only; DNS over TCP and DNS carried inside overlay tunnels are not redirected. The destination decides whether agency policy applies:

- **Correct path:** branch client → SD-WAN edge → network-addressable agency-controlled resolver → DDI policy plane (response policy zones, DNSSEC validation, logging) → per-cloud private resolvers, with internet-bound recursion forwarded through Protective DNS.
- **Bypassed path:** branch client → SD-WAN edge → an external resolver outside agency control → public recursion. The agency policy plane never sees those queries.

DNSSEC validation must happen on a resolver the agency controls. A forwarding resolver can validate if it requests and checks DNSSEC records, but if redirect-dns or conditional forwarding hands queries to an upstream resolver outside agency control, the agency loses control of its validation policy and trust anchors (Chapter 06).

### Microsoft 365 Informed Network Routing

Microsoft 365 Informed Network Routing (INR) lets a supported SD-WAN share network-quality data with Microsoft so that Microsoft 365 traffic takes the best path; the Cisco integration requires Cisco IOS XE SD-WAN 20.4 / 17.4 or later. Microsoft documents INR as available only for the Worldwide commercial cloud; it is not supported in the GCC-Moderate, GCC High, DoD, Germany or China clouds.[^c05-5] For agencies in those clouds, local internet breakout and application-aware routing remain the main Microsoft 365 optimizations. None of this changes the DDI design: INR is a routing optimization, not a DNS dependency.

## Encrypted DNS and Bypass Controls

![What an edge can and cannot do with each DNS transport.](../images/ddi/diagrams/svg/ddi-05-encrypted-dns-paths.svg){fig-alt="Table of four transports. Plain DNS on UDP 53 can be intercepted and redirected to the agency resolver. DNS over TLS on TCP 853 and DNS over QUIC on UDP 853 cannot be redirected without breaking the session, so block port 853 except to approved resolvers. DNS over HTTPS on TCP 443 cannot be seen or redirected, so it needs endpoint policy or TLS inspection."}

Client-side encrypted DNS to a public resolver is the most common bypass. M-22-09 requires encrypted DNS wherever it is technically supported, and CISA's implementation guidance requires that agency egress resolution still pass through Protective DNS. The goal is therefore not to prohibit encrypted DNS but to make sure it terminates at an agency-controlled or CISA Protective DNS resolver rather than an ungoverned public service. Practical controls:

- **Know what the edge can reach.** redirect-dns works on plain DNS only. It cannot redirect DNS over TLS (TCP 853) or DNS over QUIC (UDP 853) without breaking the session, because the client validates the resolver's certificate; those ports can be blocked except to approved resolvers. DNS over HTTPS runs on TCP 443 alongside ordinary web traffic, so neither redirect-dns nor port blocking can isolate it.
- **Control the endpoint.** MDM, Group Policy or a SASE or DDI endpoint agent should point clients' encrypted DNS at the governed resolver, and disable or restrict browser-level DoH. Windows supports configuring DoH to a named resolver.
- **Block known public encrypted DNS endpoints** at the network edge, with exceptions only for approved resolvers.
- **Alert on resolution-path anomalies**, such as connections from hosts whose queries never appear in the governed resolver logs.

## DHCP Option 6 and Rogue DHCP

A rogue DHCP server that hands out a malicious resolver in option 6 can move an entire subnet onto an attacker-controlled resolver in one step, past every response policy zone and Protective DNS control. In IPv6 networks, rogue router advertisements carrying the RDNSS option (RFC 8106) can do the same and are often the larger attack surface. Unified DHCP and IPv6 governance addresses this through:

- Centralized scope and option management with change control and an audit trail.
- Rogue DHCP and router advertisement detection, through DHCP snooping and RA Guard on the access switches, lease analysis and network discovery.
- Consistent option 6 and RDNSS values across every authorized DHCP server and router.
- IPAM integration, so unauthorized leases are visible immediately.

---

**Previous:** [Chapter 04 — The Active Directory DNS Departure](04-active-directory-dns-departure.md)  
**Next:** [Chapter 06 — DNS Identity, Certificates and DNSSEC](06-dns-identity-and-dnssec.md)

[^c05-5]: Microsoft Learn, "Microsoft 365 informed network routing," <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide>.
