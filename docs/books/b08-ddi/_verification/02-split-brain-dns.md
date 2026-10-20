# Verification — Chapter 02, Split-Brain DNS: The Structural Problem

Checked October 20, 2026. Sources: the existing series page (Next Generation DDI, Chapter 02) verified and upgraded in place, plus Part 2 of the archived whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md` and the split-brain section of its twin `docs/whitepapers/next-generation-dns.md`. Microsoft sources were opened through the Microsoft Learn MCP tools; AWS, Google Cloud, NIST, OMB, CISA and vendor sources were opened directly.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Split-horizon legitimate; unintentional split-brain close to guaranteed with independent systems | What split-brain DNS is | restated-as-design | Program argument (whitepaper §2.1 said "structurally guaranteed"; kept "close to guaranteed") |
| 2 | Private endpoint: CNAME into `privatelink`, A record in private zone, private IP in VNet, public endpoint outside | Private-IP split-brain | verified | Learn, Use private endpoints for Azure Storage |
| 3 | Public `privatelink` CNAME chain deliberately resolvable from anywhere | Private-IP split-brain | verified (new) | Learn, Azure Private Endpoint private DNS zone values |
| 4 | EC2 needs a Route 53 outbound rule to the Azure inbound endpoint; otherwise public answer | Private-IP split-brain | verified / renamed | AWS, What is Route 53 VPC Resolver? (renamed from Route 53 Resolver); Learn, Private Resolver endpoints and rulesets |
| 5 | ~70% of private-endpoint 403 cases are DNS resolving to the public endpoint | Private-IP split-brain | verified (new) | Learn, Troubleshoot "403" access denied errors through a private endpoint |
| 6 | Old footnote c02-azpe pointed to the private endpoint DNS integration page | Footnotes | corrected | Replaced with the two pages that state the cited behavior |
| 7 | "Microsoft 365 FQDNs are identical across environments"; GCC must resolve to GCC endpoints (whitepaper §2.3) | Public SaaS split-brain | corrected | Learn, Microsoft 365 endpoints and URLs and IP address ranges: Worldwide list includes GCC; GCC High/DoD have own lists and namespaces (`*.office365.us`, `*.sharepoint.us`) |
| 8 | GCC tenants' resolution "implicitly correct because Microsoft routes GCC at the application layer"; Conditional Access "GCC-specific IP restrictions" (whitepaper §2.3) | Public SaaS split-brain | removed | Unverifiable mechanism; replaced by the resolution-path consistency argument |
| 9 | DoH to a public resolver can change the answer | Public SaaS split-brain | restated-as-design | Program argument; bypass controls are Chapter 05's |
| 10 | DNS security policy enforced only at the answering resolver; Route 53 DNS Firewall, Azure, Cloud DNS response policies | Security policy split-brain | verified | AWS DNS Firewall page (rule groups per VPC); Learn, DNS resolver policy (per VNet, one per VNet, same region); Google Cloud response policies (one per network) |
| 11 | "Azure DNS security policy" | Security policy split-brain | corrected | Microsoft now titles the feature "DNS resolver policy" |
| 12 | Posture = intersection of policies = weakest resolver | Security policy split-brain | restated-as-design | Program argument (whitepaper §2.4) |
| 13 | DNS detection catches incidents early (supply chain, ransomware, exfiltration) | Security policy split-brain | corrected / verified | Whitepaper's "one of the most effective early-warning mechanisms" replaced by NIST's wording: DNS servers "can often prevent security incidents earlier than other systems"; exfiltration detection, SP 800-81r3 Secs. 1.1, 4.2.4 |
| 14 | M-22-09: already required to route DNS through CISA-operated infrastructure; CISA: Protective DNS for all egress | Security policy split-brain | verified | M-22-09, "Encrypting DNS traffic"; CISA Encrypted DNS Implementation Guidance (May 16, 2024) executive summary |
| 15 | Old text: M-22-09 "expects agency DNS traffic to use encrypted DNS and to pass through CISA-operated Protective DNS" | Security policy split-brain | corrected | Split precisely: M-22-09 notes the existing CISA routing requirement; the "all egress" requirement is stated in CISA's guidance citing 6 U.S.C. § 663 note |
| 16 | Process fails for three reasons (silent, change surface, different consistency models) | Why process discipline can't fix… | restated-as-design | Program argument (whitepaper §2.5), restored to the chapter |
| 17 | Dangling CNAMEs, lame delegations and zone drift are security threats | What fragmented DDI costs | verified (new) | NIST SP 800-81r3, Secs. 3.2 and 3.6 |
| 18 | ESG survey: more frequent outages, slower response; "commissioned by Infoblox, February 2025, no public URL" | What fragmented DDI costs | corrected | Infoblox blog (April 15, 2025) reporting ESG research: 1,000 decision-makers; quarterly cloud outages 44% more often; 38% more likely to take hours rather than minutes to recognize. "Commissioned" not stated on the page, so described as vendor-published; "February 2025" not verified, dropped |
| 19 | DNS is the first trust decision for SASE/Zero Trust | What fragmented DDI costs | restated-as-design | Program argument (unchanged) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch02 front matter, subtitle, "Download this chapter" callout | Front matter restyled | Subtitle and per-page Word download removed per the Book 08 brief |
| Series Ch02 · opening (split-brain definition) and figure | What split-brain DNS is; figure kept at the top | — |
| Series Ch02 · Private IP Split-Brain: The Cross-Cloud Case | Private-IP split-brain | Strengthened (claims 3, 5) |
| Series Ch02 · Security Policy Split-Brain (first paragraph) | Security policy split-brain | — |
| Series Ch02 · Security Policy Split-Brain (SaaS paragraph) | Public SaaS split-brain (own section) | Expanded from whitepaper §2.3 |
| Series Ch02 · Problems of Not Using Modern Enterprise-Grade DDI | What fragmented DDI costs | ESG footnote corrected (claim 18) |
| Series Ch02 · What this chapter establishes | Same callout, item 3 extended | — |
| Series Ch02 · Previous/Next | "Continue the book" callout | — |
| Whitepaper · Part 2 §2.1 What split-brain DNS is | What split-brain DNS is | — |
| Whitepaper · Part 2 §2.2 Private IP split-brain | Private-IP split-brain | — |
| Whitepaper · Part 2 §2.3 Public SaaS split-brain | Public SaaS split-brain | Corrected and trimmed (claims 7, 8) |
| Whitepaper · Part 2 §2.4 Security policy split-brain | Security policy split-brain | NIST wording substituted (claim 13); Infoblox NIOS named examples made generic |
| Whitepaper · Part 2 §2.5 Why process discipline cannot fix a structural problem | Why process discipline can't fix a structural problem | — |
| Twin `next-generation-dns.md` · Split-brain DNS | What split-brain DNS is | Same content as the whitepaper |

## Diagram change

`docs/images/diagrams/b08-ddi/src/ch02-split-brain.flow.yaml`: the red card body "Five systems, no shared state: drift is guaranteed" changed to "Independent systems, no shared state: drift is all but certain", to match the chapter (the number of platforms varies; "guaranteed" overstated). Needs re-rendering.
