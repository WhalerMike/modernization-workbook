# Verification — Chapter 01, DNS Is Now the Control Plane

Checked October 20, 2026. Sources: the existing series page (Next Generation DDI, Chapter 01) verified and upgraded in place, plus the matching Why sections of the archived whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md` (front matter callouts, Part 1) and its short twin `docs/whitepapers/next-generation-dns.md`. Microsoft sources were opened through the Microsoft Learn MCP tools; federal and vendor sources were opened directly (PDFs downloaded and text-extracted where the page was a PDF).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "Almost every network connection begins with a DNS query" | Opening | verified (new) | OMB M-08-23 (same wording) |
| 2 | NIST: DNS "has become more than a service"; a security control | Opening | verified (new) | NIST SP 800-81r3, Executive Summary |
| 3 | Up to five independent platforms (AD DNS/DDI grid, Route 53, Azure DNS/Private DNS, Google Cloud DNS, NSX) | Opening | restated-as-design | Program framing of a typical estate; not presented as a statistic |
| 4 | Split-brain fails as certificate errors and access denials, rarely DNS errors | Opening; case paragraph | restated-as-design | Program argument (whitepaper said "never"; softened to "rarely") |
| 5 | Cisco Catalyst SD-WAN redirect-dns sends matching DNS to a specified server via centralized data policy | Case paragraph | verified (new footnote) | Cisco, Redirect DNS in Catalyst SD-WAN Service-Side VPNs |
| 6 | Infoblox Government Cloud FedRAMP Moderate, Universal DDI added July 2026 (old Solution paragraph) | Case paragraph | moved | Detail moved to Chapter 03 (FedRAMP section) to avoid duplication; Chapter 01 keeps a one-line pointer stated precisely ("listed on the FedRAMP Marketplace at the Moderate level") |
| 7 | 90-day ask to settle the five decisions | Case paragraph | restated-as-design | Program position (unchanged) |
| 8 | INR is WW Commercial only; not GCC Moderate, GCC High, DoD | Decision makers | verified (new footnote) | Learn, Microsoft 365 informed network routing (note text; Cisco IOS XE SD-WAN 20.4/17.4 only listed solution) |
| 9 | RFC 882/883 Nov 1983; RFC 1034/1035 Nov 1987 obsolete 882, 883, 973 | What DNS was designed to do | verified | RFC Editor, RFC 1034 header |
| 10 | Azure Storage private endpoint: private IP inside the hosting VNet, public endpoint outside | What DNS has become | verified (new) | Learn, Use private endpoints for Azure Storage |
| 11 | "A GCC Moderate tenant must resolve outlook.office365.com to GCC endpoints" (whitepaper §1.2) | What DNS has become | corrected | Learn, Microsoft 365 endpoints: Worldwide list includes GCC; GCC High and DoD have own lists/namespaces (`*.office365.us`) |
| 12 | DNS service is both a policy information source and a policy enforcement point | What DNS has become | verified (new) | NIST SP 800-81r3, Sec. 1.2 |
| 13 | OCSP/CRL, FQDN as service identity, wildcard as application surface | What DNS has become | restated-as-design | Program argument (whitepaper §1.2); PKI detail is Chapter 06's |
| 14 | Route 53 Resolver: inbound/outbound endpoints, rules, DNS Firewall | Landscape table | corrected | AWS renamed the service Route 53 VPC Resolver when Route 53 Global Resolver was introduced (AWS Developer Guide note); mechanics verified |
| 15 | Azure Private DNS zones resolve only for linked VNets; Private Resolver inbound/outbound endpoints and forwarding rulesets | Landscape table | verified | Learn, What is Azure DNS Private Resolver?; Endpoints and rulesets |
| 16 | "Azure has no equivalent native RPZ mechanism" (whitepaper §1.4) | Landscape table and note | corrected | Learn, DNS resolver policy (formerly DNS security policy): allow/alert/block, logging, Microsoft threat intelligence list |
| 17 | GCP: metadata server 169.254.169.254; inbound server policy entry points; DNS peering | Landscape table | verified (entry points are per subnet, not "regional" as the whitepaper said: corrected) | Google Cloud, DNS server policies |
| 18 | GCP response policies "functionally equivalent to Infoblox RPZ" | Landscape table | corrected | Google Cloud, Manage response policies: rules override answers for matching names, modeled on the RPZ draft; "functionally equivalent" dropped |
| 19 | NSX DNS service "intercepts DNS queries from workloads"; "DNS service profiles" | Landscape table and note | corrected | VMware NSX 4.1 Admin Guide, Add a DNS Forwarder Service: forwarder at a listener IP on a tier-0/tier-1 gateway; one default zone plus up to five FQDN zones, up to three servers each |
| 20 | One Azure private endpoint can require four more DNS changes on four consoles | Management burden | restated-as-design | Program worked example (whitepaper §1.5) |
| 21 | Ownership gap: cloud team / network team / Windows team; forwarding rules fall between | Management burden | restated-as-design | Program argument (whitepaper §1.5); linked to Chapter 09 |
| 22 | IPAM as address layer of the Zero Trust inventory | Hybrid cloud IPAM and DHCP | verified / sharpened | M-22-09 Devices goal (complete inventory, CDM); CISA ZTMM v2.0 (April 2023) Devices pillar: dynamic inventory; cloud network resources include DNS services |
| 23 | ZTMM footnote lacked a date | Footnotes | corrected | Version 2.0 dated April 2023 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch01 front matter, subtitle, "Download this chapter" callout | Front matter restyled (title, description, doc-type, audience, lifecycle_review 2027-04-01) | Subtitle and per-page Word download callout removed per the Book 08 brief |
| Series Ch01 · Problem, Solution, Ask | "The case in one paragraph" callout | FedRAMP data point moved to Chapter 03 (claim 6) |
| Series Ch01 · For Decision Makers | For decision makers | Kept all five bullets; INR bullet now footnoted |
| Series Ch01 · DNS in the Modern Hybrid Multi-Cloud Enterprise | What DNS was designed to do; What DNS has become; The fragmented landscape | Expanded from the whitepaper |
| Series Ch01 · Three DNS Perspectives Under a Single Control Plane | Three DNS perspectives under one control plane (figure moved up, after the opening) | — |
| Series Ch01 · Hybrid Cloud IPAM and DHCP | Hybrid cloud IPAM and DHCP | Inventory claim sharpened (claim 22) |
| Series Ch01 · What this chapter establishes | Same callout, items 2–3 updated | — |
| Series Ch01 · Previous/Next links | "Continue the book" callout: Previous is the Book 08 index | Old "Previous: Applicability" reflected the series order; Appendix C is now at the end |
| Whitepaper · front matter and Download callout | — | Not carried (archived document metadata) |
| Whitepaper · Problem, solution, ask | Case paragraph | Vendor-specific Solution (Infoblox Universal DDI as the plane) kept vendor-neutral, as in the series; the Ask's five steps are Chapter 08's |
| Whitepaper · In this whitepaper (ten arguments) | Arguments 1–2 to Chapters 01–02; 3 is Appendix A's; 4 is Chapter 04's; 5 is Chapter 06's; 6 to "What DNS has become" (application surface); 7 is Chapter 12's (and stated vendor-neutrally); 8–9 are Chapter 05's; 10 is Chapter 08's | The "industry's most complete answer" and "undocumented by either vendor" assertions not carried (vendor positioning, unverifiable) |
| Whitepaper · For decision makers | For decision makers (merged with the series version) | — |
| Whitepaper · Scope boundary, Cisco Catalyst SD-WAN only | — | Chapter 05's (SD-WAN interception) |
| Whitepaper · Part 1 §1.1 What DNS was designed to do | What DNS was designed to do | `93.184.216.34` example address dropped |
| Whitepaper · Part 1 §1.2 What DNS has become | What DNS has become (six jobs) and its closing paragraph | GCC endpoint claim corrected (claim 11); BloxOne Threat Defense detail is Chapter 05/12's |
| Whitepaper · Part 1 §1.3 The hybrid multi-cloud DNS landscape | The fragmented landscape (opening) | — |
| Whitepaper · Part 1 §1.4 How each platform implements DNS | Landscape table and the note after it | Three corrections (claims 16, 17, 19); Route 53 renamed (claim 14). Azure private endpoint resolution detail is Chapter 02/07's |
| Whitepaper · Part 1 §1.5 The management burden of independence | The management burden of independence | — |
| Whitepaper · Parts 2 and 7.8 | Chapters 02 and 03 | See those ledgers |
| Twin `next-generation-dns.md` · Problem, solution, ask | Case paragraph | Identical in substance to the whitepaper's |
| Twin · What DNS has become | What DNS has become | — |
| Twin · Leadership takeaway | Closing paragraph of "What DNS has become" | — |
| Twin · Split-brain, AD departure, One policy plane, SD-WAN, Sovereign cloud, Five decisions | Chapters 02, 04, 08, 05, Appendix C, 08 | Not duplicated here |

## Cross-chapter consistency pass (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| CP-1 | Ask: the DNS/DDI team settles the five configuration decisions (network engineering configures the edge for Decisions 1 and 2), replacing "the enterprise architecture or network operations lead" | The case in one paragraph (Ask) | aligned to Chapter 09 (program design) | Chapter 09 responsibility matrix: DNS/DDI team holds D on Decisions 1-5; network engineering R on Decisions 1-2 |
| CP-2 | Table row: "DNS resolver policy (formerly DNS security policy)" is the current Azure name | Cloud platforms table | re-verified | Microsoft Learn, "DNS resolver policy," <https://learn.microsoft.com/en-us/azure/dns/dns-security-policy> (opened Oct 21, 2026): page title and every heading use "DNS resolver policy"; portal resource "DNS Resolver Policies"; URL keeps `dns-security-policy`; networking design guide <https://learn.microsoft.com/azure/networking/design-guide/dns-security> still says "DNS security policy" |

## Addition, October 30, 2026: Oracle Cloud row; NSX source refreshed

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| OC-1 | Oracle Cloud Infrastructure: VCN resolver at 169.254.169.254, private views (attached in order, default last), listening and forwarding endpoints with resolver rules; no private-DNS security policy | Landscape table | verified (added); platform count in the opening and the landscape paragraph now six | c01-oci (Oracle "Private DNS" and "Traffic Management Steering Policies," accessed Oct 30, 2026) |
| OC-2 | NSX forwarder limits unchanged in NSX 4.2 | Landscape table | re-verified; citation moved from the NSX 4.1 docs.vmware.com URL (now redirects to the guide landing page) to Broadcom TechDocs 4.2 | c01-nsx |
| OC-3 | Pointer to Chapter 07's logging, limits and failure-behavior comparison | After the landscape table | cross-reference | — |
