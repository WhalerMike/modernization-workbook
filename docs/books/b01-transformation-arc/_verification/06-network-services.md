# Verification — Chapter 06 (Network Services: DNS, DHCP and IPAM)

File: `06-network-services.md`. Diagram sources: `docs/images/diagrams/b01-transformation-arc/src/ch06-ipam-authority.flow.yaml` (replaces `../../images/cshc/services-transformation.svg`: AD DNS/DHCP → governed IPAM → private DNS) and `ch06-hybrid-resolution.flow.yaml` (new; the resolver wiring already in the text, placed after the resolver paragraph).
Microsoft sources opened through the Microsoft Learn MCP tools on October 21, 2026; NIST, OMB and FedRAMP sources with WebFetch/WebSearch the same day. Book 08 (`index`, `03`, `04`, `05`, `07`, `10`) read for consistency.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "In the author's experience" these services regress post-migration | §Services claim | restated-as-design | Now "in the program's experience" |
| 2 | Commercial sector moved from per-site Windows DNS to unified DDI 2017–2020; DHCP as inventory (whitepaper table) | §Services claim | restated-as-design | Dates unverifiable; kept as the program's reading of commercial practice, no dates |
| 3 | SP 800-53 SC-20, SC-21, SC-22 name-resolution controls; CM-8 inventory | §Services claim | verified | NIST SP 800-53 Rev. 5 page (5.2.0 release note); control titles confirmed via search results |
| 4 | M-22-09 directs encrypting DNS traffic | §Services claim | verified | M-22-09 (search excerpt of PDF: near-term focus on DNS and HTTP) |
| 5 | M-26-14, May 22, 2026, rescinded M-21-31 | §Services claim | verified | M-26-14 PDF (search result); settled book fact |
| 6 | AD-integrated zones replicate via AD; multi-master; secure dynamic updates | §DNS | verified | Learn, "Active Directory-Integrated DNS Zones" |
| 7 | Secure dynamic updates only in AD-integrated zones; aging and scavenging | §DNS | verified | Learn, KB 816592 "How to configure DNS dynamic updates" |
| 8 | "In most forests every domain controller is also a DNS server" | §DNS | restated-as-design | "In the common design"; no prevalence figure available |
| 9 | Clients locate DCs via Netlogon-registered SRV records | §DNS | verified | Learn, "Locating domain controllers in Windows and Windows Server" |
| 10 | Authoritative on-premises target "file-backed Windows DNS or a DDI appliance" | §DNS table | corrected | Aligned to Book 08: a DDI platform under one policy plane, file-backed Windows DNS as a waypoint |
| 11 | Private Resolver inbound/outbound endpoints, rulesets, VNet links | §DNS | verified | Learn, "What is Azure DNS Private Resolver?" |
| 12 | On-premises conditional forwarders → inbound endpoint | §DNS | verified | Learn, "Resolve Azure and on-premises domains" |
| 13 | Azure-provided DNS 168.63.129.16 | §DNS | verified | Learn, "Configure DNS name resolution for Azure virtual networks" |
| 14 | Private zones resolve only from linked VNets; custom DNS bypasses linked zones | §DNS | verified (added) | Learn, "Azure Private DNS zone overview" |
| 15 | Resolver is a bridge, not an authority; agency resolver first hop | §DNS | restated-as-design | Book 08 Ch07/Ch08 design decisions, linked |
| 16 | Infoblox Government Cloud FedRAMP Moderate since Dec 15, 2022 | §DNS | verified | FedRAMP Marketplace FR2017257053; settled book fact |
| 17 | Validation includes CRL distribution points | §DNS | verified (extended) | Book 08 decision 5 (OCSP and CRL endpoints resolve from every origin); "OCSP" added |
| 18 | Azure DHCP leases long; scavenging can remove records prematurely | §DNS | verified (added) | Learn, "Configure DNS name resolution for Azure virtual networks" |
| 19 | Six-step DNS migration; `_msdcs` retires last | §DNS | restated-as-design | Program sequence; consistent with Book 08 Ch10 (preserve SRV/_msdcs while DCs remain) |
| 20 | "Inventory (Chapter 02)" | §DNS | corrected | Renumbered to Chapter 10 |
| 21 | DHCP authorization = "rogue-server detection" lives in AD | §DHCP | corrected | Learn DHCP authorization guide: server checks the Configuration-container list hourly and deauthorizes itself; stops unauthorized Windows DHCP servers only; consistent with Book 08 Ch05 |
| 22 | Unauthorized DHCP servers don't lease | §DHCP | verified | Learn, "Quickstart: Install and configure DHCP Server" |
| 23 | Azure VNets provide DHCP to VMs; DHCP in Azure VM serves on-premises only via relay; direct client→server unsupported | §DHCP | verified (extended) | Learn, Azure Virtual Network FAQ |
| 24 | Assessment findings (stale reservations, oversized scopes, untested failover) | §DHCP | restated-as-design | Program observation |
| 25 | AVNM IPAM pools, non-overlapping CIDRs, IPv4/IPv6, reserved IPs | §IPAM | verified | Learn, "What is IPAM in Azure Virtual Network Manager?" |
| 26 | AVNM IPAM generally available (with region exceptions) | §IPAM | verified (added) | Learn, "Prevent overlapping virtual network address spaces with Azure Policy and IPAM" |
| 27 | Up to seven layers of child pools; VNets can be created outside pools; use Azure Policy | §IPAM | verified (added) | Learn, "Centralized network management with Azure Virtual Network Manager" |
| 28 | "Options include AVNM IPAM for Azure and DDI for on-premises" (two authorities) | §IPAM | corrected | Aligned to Book 08 Ch07: enterprise IPAM is the authority, Azure pools mirror its reservations |
| 29 | Whitepaper FedRAMP 20x "Automated KSI" rows (DNSSEC on all zones, no CIDR overlap, machine identity at IP provisioning) | §IPAM | restated-as-design | Not verifiable as published FedRAMP KSIs; carried as program continuous checks without the KSI label |
| 30 | Hierarchy drift; coordinated IPAM/DNS/DHCP plan; no DNS-only run | §IPAM | restated-as-design | Program design |
| 31 | "Phase 2 never comes" | §Phase 2 | restated-as-design | Program observation |
| 32 | Source footnote `cs06-adidns` (DNS overview page), `cs06-pdnslink` (VNet links page) | — | removed (source) | Replaced by pages opened this session (rows 6, 14) |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch06 front matter, H1 "Services: DNS, DHCP, IPAM in the Hybrid-Cloud Model", bold subtitle | Title, H1, italic thesis, description | H1 fixed to book title |
| Ch06 dependency-chain blockquote | Kept | — |
| Ch06 §The services claim + `cshc/services-transformation.svg` | §The services claim; `ch06-ipam-authority` | Figure replaced by house-style source; federal anchors added |
| Ch06 §Why these three, why together | Same section | DHCP's DNS registration role added |
| Ch06 §DNS (dependencies, three-layer table, resolver wiring, adapter, six steps) | §DNS | Corrections rows 8, 10, 14, 17, 18, 20; Book 08 Ch04/07/08/10/12 linked |
| Ch06 §DHCP | §DHCP | Authorization corrected; relay caveat added |
| Ch06 §IPAM | §IPAM | Authority model aligned to Book 08; continuous checks added |
| Ch06 §Validation | Same section | CIDR-overlap check added |
| Ch06 §Why "Phase 2" never comes | Same section | — |
| Ch06 §Key takeaways | Same section | One takeaway added |
| Ch06 §Authoritative references list | Footnotes | Removed as a list |
| Ch06 Previous/Next lines | "Continue the book" callout | Restyled |
| Whitepaper "What the commercial world figured out," rows Windows DNS → unified DDI and DHCP → IPAM as inventory | §The services claim (para 2) | Dates dropped (row 2) |
| Whitepaper Federal Framework Alignment rows "Unified DNS as security control (SC-20/21)" and "IP address inventory as compliance evidence (CM-8)" | §The services claim (para 2) | SC-22 added; FedRAMP Moderate attribution generalized to SP 800-53 |
| Whitepaper FedRAMP 20x table, DDI rows (DDI logs every DNS query; WAPI JSON; Terraform for DDI; three "Automated KSI" rows) | §IPAM (continuous checks) | Product-specific rows (InfoBlox WAPI, Terraform provider) not carried, the chapter stays product-neutral; KSI label not carried (row 29); FedRAMP 20x itself belongs to W5's chapters |
| Whitepaper Principle 1 Figure 10 / Principle 4 data planes (DDI as a data plane under a governance control plane) | §IPAM (IPAM as authority, DNS/DHCP as derived planes) | Control-plane doctrine itself is W5's (Chapter 11) |
| Whitepaper Principle 2, SD-WAN/SASE/TIC 3.0 | Not carried | Network and access plane: Chapter 08 (W4) and Book 09 |
| Whitepaper images `rId*.png` | Not carried | House-style sources instead |
