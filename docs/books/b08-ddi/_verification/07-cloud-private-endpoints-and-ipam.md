# Verification — Chapter 07, Cloud Private Endpoints, SDN and IPAM Consistency

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch), AWS documentation, Google Cloud documentation, Infoblox and VMware vendor pages, the OMB memo PDF, and the FedRAMP Marketplace dataset (`products.json`, last change 2026-10-20).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Route 53 VPC Resolver answers at VPC+2; inbound/outbound endpoints; one rule per domain, shareable across accounts | Platform table | verified (added from WP 1.4) | c07-r53 |
| 2 | "Route 53 Resolver" renamed Route 53 VPC Resolver when Route 53 Global Resolver was introduced | Platform consequences | corrected (series and WP used the old name; diagram source updated) | c07-r53 |
| 3 | Route 53 Resolver DNS Firewall filters outbound queries through the VPC Resolver | Platform table | verified | c07-r53fw |
| 4 | Azure private zones resolve only from linked VNets; zones are global resources | Platform table, core behavior | verified | c07-azpdns |
| 5 | Guide 3.2 "resources in peered VNets can resolve records from linked Private Zones" | Removed from platform text | corrected: resolution requires a zone link (or forwarding); peering is neither required nor sufficient | c07-azpdns, c07-azrulesets |
| 6 | WP 1.4 "Azure has no equivalent native RPZ mechanism" | Platform table | corrected: Azure DNS resolver policy provides allow/block/alert domain lists and a managed threat-intel list | c07-azresolverpolicy |
| 7 | GCP VMs query metadata server 169.254.169.254; inbound server policy entry points; outbound server policies | Platform table | verified | c07-gcpserver |
| 8 | GCP forwarding zones, peering zones | Platform table | verified | c07-gcpzones |
| 9 | WP "GCP Response Policy Zones (functionally equivalent to Infoblox RPZ)" | Platform table | restated: Google documents response policies (one per network) without calling them RPZ | c07-gcpresp |
| 10 | WP "NSX-T DNS Service intercepts DNS queries from workloads" | Platform table | corrected: NSX DNS Forwarder Service, default zone + up to 5 FQDN zones x 3 servers; workloads use it only if configured to; "NSX-T" renamed NSX | c07-nsx |
| 11 | One private endpoint needs changes in four places; forwarding rules fall between teams | Platform consequences | restated-as-design (cross-reference to Ch01, ownership to Ch09) | — |
| 12 | Private DNS zone group writes and deletes endpoint A records | Core behavior | verified (replaces guide's "auto-registration" for private endpoints) | c07-azpe |
| 13 | Public CNAME into privatelink name; connection strings unchanged | Core behavior | verified | c07-azpezones |
| 14 | Private answer requires a resolver in a linked VNet; fallthrough gets public address | Core behavior | verified | c07-azpe |
| 15 | DNS resolution and access control independent; public CNAME chain resolvable from anywhere | Core behavior | verified (added) | c07-azpezones |
| 16 | Single zone per name across networks; don't share a zone between two services' endpoints | Core behavior | verified (added) | c07-azpe |
| 17 | NXDOMAIN for public resources with their own private endpoints; "fallback to internet" link setting | Core behavior, deployment | verified (added) | c07-azpezones |
| 18 | Records auto-generate only with recommended zone names | Zones | verified | c07-azpezones |
| 19 | Conditional forwarding must target the public DNS zone forwarder (`database.windows.net`), not the privatelink zone | Zones, pattern, code, diagram | corrected: series, guide 6.1 step 8 and 10.5 forwarded `privatelink.*` zones | c07-azpe |
| 20 | Guide 10.2 zone table (17 services) | Zones table | corrected and extended: added forwarder column and Azure Government names; Key Vault forwarders are `vault.azure.net` + `vaultcore.azure.net`; Azure Monitor needs five zones; Automation forwarder is regional; Cognitive Services now Foundry Tools with three zones; Azure ML needs a notebooks zone; Cosmos DB entry is the NoSQL API | c07-azpezones |
| 21 | Guide 10.3 "Auto-Registration: when a Private Endpoint is created with DNS integration Azure creates A records" | Zones | corrected: that is the private DNS zone group; autoregistration is a VM feature | c07-azpe, c07-azautoreg |
| 22 | Autoregistration: VMs only, primary NIC only, removed on stop/delete, no PTR, one zone per VNet | Zones | verified | c07-azautoreg |
| 23 | Guide 10.4 code `-EnableRegistration $false` | Code | corrected: `EnableRegistration` is a switch; omitted | c07-azpsquick (module usage), c07-azautoreg |
| 24 | DDI sync platforms have documented Azure limits; Infoblox list (tags, routing policies, multi-value split, NS, SOA MNAME/serial, alias conversion) | Recommended pattern | verified | c07-ibxazure |
| 25 | Private Resolver inbound/outbound roles; ExpressRoute or VPN needed for hybrid | Hub-and-spoke | verified | c07-azpr |
| 26 | Resolver is recursive/forwarding, not authoritative; no NS delegation to it | Hub-and-spoke, patterns | verified (added) | c07-arch |
| 27 | Dedicated delegated subnets, /28 to /24 | Hub-and-spoke | verified (guide said "/28 minimum") | c07-azpr |
| 28 | Guide 6.2 "up to 5 inbound and 5 outbound endpoints" | Hub-and-spoke | verified; added other limits (1,000 rules, 500 links, 6 targets, 10,000 QPS, 15 per subscription not carried) | c07-azpr |
| 29 | No encrypted VNets, IPv6 subnets, FastPath, Lighthouse; no cross-tenant ruleset links | Hub-and-spoke, IPv6 | verified (added) | c07-azpr |
| 30 | Static or dynamic inbound IP; dynamic changes only on reprovision | Hub-and-spoke | verified; static is the program's design choice | c07-azrulesets |
| 31 | Ruleset links vs inbound endpoint as custom DNS; peering not required for ruleset links | Hub-and-spoke | verified (refines guide 3.7) | c07-azrulesets |
| 32 | Don't link a ruleset whose rule targets an inbound endpoint to that endpoint's VNet; 168.63.129.16 not a valid rule target | Hub-and-spoke, code | verified (added) | c07-azrulesets |
| 33 | Guide 3.6 "Azure-provided DNS (168.63.129.16) as the fallback" in VNet DNS settings | Hub-and-spoke | corrected: Microsoft says not to combine Azure DNS with custom servers; VPN Gateway exception noted | c07-aksdns, c07-azvnetdns |
| 34 | Wildcard rule target must resolve public names | Hub-and-spoke | verified (added) | c07-azrulesets |
| 35 | Guide 6.2 "zone-redundant by default" | Hub-and-spoke | verified ("built-in high availability and zone redundancy") | c07-azpr |
| 36 | Guide 6.2 "Use Azure Traffic Manager or DNS-level failover for cross-region resolution" | Hub-and-spoke | corrected: resolver per region; on-premises forwarders list both regions' inbound endpoints | c07-hybriddns |
| 37 | Guide 3.1 Azure public zones on anycast network | Hub-and-spoke | verified | c07-azpubdns |
| 38 | Guide 6.1 PowerShell | Code | corrected: IP configuration via `New-AzDnsResolverIPConfigurationObject`; ruleset takes the outbound endpoint object; link uses `-VirtualNetworkLinkName`; targets via `New-AzDnsResolverTargetDnsServerObject`; removed ruleset-to-hub pattern risk; forwarders retargeted to public zones and two regions; `DhcpOptions` hashtable assignment dropped (custom DNS option described in prose) | c07-azpsquick, c07-azrulesets |
| 39 | `Add-DnsServerConditionalForwarderZone -Name -MasterServers -ReplicationScope "Forest"` | Code | verified as an existing cmdlet and parameters (unchanged from source) | Windows Server DnsServer module (no new claim) |
| 40 | Split-horizon: private and public zone can share a name | Patterns | verified | c07-azpdns |
| 41 | Patterns 1–3 steps, validation, rollback | Patterns table | restated-as-design (program procedure, carried from guide 9.1–9.3) | — |
| 42 | AWS VPC IPAM–Infoblox integration since Nov 2025; private scopes; not GovCloud or China | AWS IPAM | verified (re-opened both footnoted pages) | c07-awsipam |
| 43 | Integration flow: scope authority set to Infoblox, top-level pool, any/specific CIDR; requires Advanced Tier | AWS IPAM | verified (added detail) | c07-awsipam |
| 44 | AVNM IPAM pools, non-overlapping CIDRs | Azure IPAM | verified; added root/child pools (7 layers), IPv4 and IPv6, static CIDR allocations to avoid on-premises overlap | c07-avnmipam |
| 45 | Series "neither offers an equivalent of the AWS external-IPAM pattern" | Azure IPAM | verified as worded; refined: mirror reservations as static CIDRs | c07-avnmipam |
| 46 | Guide 11.5 "Azure IPAM provides hybrid address space management" | Azure IPAM | corrected: the Microsoft-documented service is Azure Virtual Network Manager IPAM | c07-avnmipam |
| 47 | Google Cloud internal ranges reserve/protect address space, including EXTERNAL_TO_VPC use | GCP | verified | c07-gcpir |
| 48 | VCF 9.1 native Infoblox integration; allocation and reservation of blocks; FQDN auto-registration; Infoblox as authority | VCF | verified | c07-vmw |
| 49 | Series "NSX imports Infoblox network containers as external IP address blocks" | VCF | removed: not stated in the cited source; no primary doc found | c07-vmw |
| 50 | WP 7.7 cloud IPAM import, overlap detection, CM-8 reporting; active/passive discovery | Discovery | restated-as-design (techniques); CM-8 cross-referenced to Ch03 mapping | Ch03 |
| 51 | WP 6.5 "Infoblox Universal DDI's IPAM ... the only currently available platform" that can answer the FQDN-namespace question | Discovery | removed (superlative, unverifiable); FQDN-tracking requirement restated as design | — |
| 52 | M-21-07 IPv6-only targets 20/50/80% by end of FY2023/24/25; November 19, 2020 | IPv6 | verified (PDF pages 1 and 3; "at least" added) | c07-m2107 |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch07 — Azure DNS and Private Endpoints (intro) | Azure DNS and private endpoints | — |
| Series Ch07 — Core Behavior | Core behavior | Corrected (rows 12, 19) |
| Series Ch07 — Recommended Pattern with a Unified Control Plane | Recommended pattern | Corrected forwarded zone; zone-link wording refined |
| Series Ch07 — DDI sync limits paragraph | Recommended pattern (with Infoblox specifics) | — |
| Series Ch07 — SDN–IPAM Consistency (intro) | SDN–IPAM consistency | — |
| Series Ch07 — The Consistency Problem | The consistency problem | — |
| Series Ch07 — AWS VPC IPAM Integration | AWS VPC IPAM integration | Extended |
| Series Ch07 — Azure and Google Cloud | Azure and Google Cloud | Refined (row 45) |
| Series Ch07 — VMware Cloud Foundation and NSX | VMware Cloud Foundation and NSX | Unsupported detail removed (row 49) |
| Series Ch07 — Operational Implications | Operational implications | Mirroring step added |
| Series Ch07 — IPv6 Lifecycle and Dual-Stack | IPv6 lifecycle | Resolver IPv6 limit, AVNM IPv6 pools added |
| Series Ch07 — What this chapter establishes | Callout | Item 1 corrected; item 2 added |
| Series Ch07 — Download callout, Previous/Next lines | — | Removed per brief; replaced by Continue the book callout |
| WP Part 1.3 — The hybrid multi-cloud DNS landscape | — | Duplicate of Ch01 "DNS in the modern hybrid multi-cloud enterprise" |
| WP Part 1.4 — How each platform implements DNS | How each platform implements private DNS (table) | Corrected (rows 6, 9, 10) |
| WP Part 1.5 — The management burden of independence | How each platform implements private DNS (last paragraph) | Example already in Ch01 (linked); ownership gap goes to Ch09 |
| WP Part 2.2 — Private IP split-brain: the cross-cloud case | — | Already in Ch02; linked |
| WP Part 6.5 — The IPAM implication | Discovery and the inventory (FQDN-namespace requirement) | Superlative removed (row 51) |
| WP Part 7.7 — Network Discovery and IPAM governance | Discovery and the inventory | Zero Trust inventory point already in Ch01; CM-8 mapping in Ch03 |
| Guide 1–2 (purpose, AD DNS decomposition) | — | Ch04 and Ch10 scope |
| Guide 3.1 Azure DNS Public Zones | Hub-and-spoke section (last paragraph) | — |
| Guide 3.2 Azure DNS Private Zones | Core behavior; zones (autoregistration) | Peering claim corrected (row 5) |
| Guide 3.3 Azure DNS Private Resolver | Hub-and-spoke section | — |
| Guide 3.4 Architecture Overview (diagram placeholder) | New diagram `ch07-hub-spoke-resolver` | — |
| Guide 3.5 Split-Brain DNS | Hybrid resolution patterns (split horizon) | — |
| Guide 3.6 VNet DNS Settings | Hub-and-spoke rules | Fallback advice corrected (row 33) |
| Guide 3.7 Hub-Spoke DNS Topology | Hub-and-spoke rules | Refined (row 31) |
| Guide 4–5 (assessment pipeline, zone migration) | — | Ch10 and Ch11 scope |
| Guide 6.1 Step-by-step deployment | Illustrative deployment (code) | Corrected (row 38) |
| Guide 6.2 High Availability | Hub-and-spoke rules (resilience, limits) | Traffic Manager advice corrected (row 36) |
| Guide 6.3 Cost estimation; Appendix B cost calculator | — | Ch12 scope (cost); no verified prices carried |
| Guide 7–8 (SRV governance, DNSSEC) | — | Ch04 and Ch06 scope |
| Guide 9.1 Same namespace, different answers | Hybrid resolution patterns table | — |
| Guide 9.2 Subdomain delegation | Hybrid resolution patterns table | Private-half caveat added (row 26) |
| Guide 9.3 Full migration with conditional forwarding | Hybrid resolution patterns table | Linked to Ch10 for sequencing |
| Guide 9 diagram placeholders 2–4 | — | Covered by the patterns table; no separate diagrams |
| Guide 10.1 Overview | Core behavior | — |
| Guide 10.2 Required Private DNS Zones | Zones to plan for (table) | Corrected (row 20) |
| Guide 10.3 Auto-registration vs manual | Zones to plan for | Corrected (row 21) |
| Guide 10.4 VNet link configuration | Illustrative deployment, step 7 | Corrected (row 23) |
| Guide 10.5 On-premises resolution of private endpoints | Illustrative deployment (on-premises block) | Corrected (row 19) |
| Guide 11.1–11.4 DHCP and dynamic DNS | — | Ch05/Ch10/Ch11 scope (DHCP and lifecycle) |
| Guide 11.5 IPAM integration | Azure and Google Cloud | Corrected (row 46) |
| Guide 12–14, Appendices A, C, D | — | Ch11 (monitoring), Ch10 (playbook), Appendix A (records); not this chapter |
| Short twin `operational-guides/dns-modernization.md` — Key risks (private endpoint fallback) | Core behavior; recommended pattern | Phases and success criteria belong to Ch10/Ch12 |
| Diagram `ch07-private-endpoint-forwarding` | Kept | Comment and AWS node name corrected (rows 2, 19) |
| Diagram `ch07-sdn-ipam` | Kept | Azure node text updated (row 45) |

## Cross-chapter consistency pass (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| CP-1 | Autoregistered VM records are removed when the VM is deleted or stopped and deallocated (was "stopped or deleted") | Private zones: record kinds | corrected; new footnote c07-pdns-faq | Microsoft Learn, "Azure Private DNS FAQ," <https://learn.microsoft.com/azure/dns/dns-faq-private> (opened Oct 21, 2026): removed "when you stop a virtual machine and it is deallocated"; autoregistration overview <https://learn.microsoft.com/azure/dns/private-dns-autoregistration> (opened Oct 21, 2026) says "deleted or stopped"; design guide says "deallocate or delete." Now matches Chapter 11 |

## Moderate-civilian sweep (October 29, 2026)

The workbook targets FedRAMP Moderate civilian agencies. Configuration authority is the agency's CM-6 settings drawn from civilian sources; DISA STIGs and DoD Impact Levels survive only as optional references labelled *High only*; AWS GovCloud (US) and Azure Government are treated as valid Moderate locations. Facts from the coordinator's verified fact pack (read 2026-10-29) or re-read by this writer on 2026-10-29 as noted.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| MS-1 | GovCloud (US) is a valid Moderate location, so the missing VPC IPAM–Infoblox integration there is a Moderate concern; mixed GovCloud/commercial estates automate only the commercial side | Amazon VPC IPAM paragraph | design (labelled); GovCloud-at-Moderate per fact pack fact 12 | c07-awsipam (existing); AWS FedRAMP pages (fact pack) |

## Addition, October 30, 2026: IPAM feeds the Teams emergency location map

One bullet added to "Operational implications." Microsoft Learn page opened on Oct 30, 2026 through the Learn MCP fetch.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| TL-1 | Dynamic emergency calling matches the client's network against subnets, access points and switches in the LIS | Operational implications | verified | c07-teams-lis |
| TL-2 | LIS computes the network ID from client address and reported prefix; must match a configured subnet; site subnets must be redefined in LIS; changes take up to four hours | Same | verified | c07-teams-lis |
| TL-3 | IPAM is the source for LIS subnet entries; subnet changes raise a network-to-location change in the Teams Phone catalog; VPN pools stay out | Same | restated-as-design (links Book 15 Ch05 and Book 09 Ch05) | — |

## Addition, October 30, 2026: platform comparison extended, Oracle Cloud added

"How each platform implements private DNS" gained an Oracle Cloud Infrastructure row, a second table (logging, limits, failure behavior), an estate subsection and a check table. Microsoft facts were checked through the Learn MCP search and fetch tools; AWS, Google Cloud, Oracle and Broadcom facts against their own documentation, all on Oct 30, 2026.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| PD-1 | NSX row was sourced from an Azure VMware Solution page; on-premises NSX 4.2 and VCF 9.0 guides still give a default zone + 5 FQDN zones x 3 servers on a tier-0/tier-1 gateway | Platform table | corrected (source replaced; limits re-verified) | c07-nsx |
| PD-2 | NSX has no DNS-layer policy; Distributed Firewall FQDN filtering acts on traffic using snooped DNS answers | Platform table | verified (added) | c07-nsxfqdn |
| PD-3 | OCI: dedicated VCN resolver at 169.254.169.254; attached views in order, default view last; listening endpoint 1 IP, forwarding endpoint 2, IPv4-only subnet | Platform table | verified (added) | c07-ocipdns |
| PD-4 | OCI resolver rules: client CIDR or domain condition, first match, 50 per resolver, 10 conditions per rule | Platform table, limits table | verified (added) | c07-ocirules |
| PD-5 | OCI has no native DNS firewall for private DNS; steering policies public only | Platform table | verified (no Oracle page found describing one) | c07-ocitm |
| PD-6 | Route 53 Resolver query logging: sources, destinations, cached answers not logged | Limits table | verified | c07-r53ql |
| PD-7 | 10,000 UDP QPS per endpoint IP; ~1,500 under connection tracking or behind NLB | Limits table | verified (refines "per ENI" in the research page brief) | c07-r53quota |
| PD-8 | 1,024 PPS link-local cap covers all link-local services, not DNS alone; not adjustable | Limits table | verified (refined) | c07-awsdns |
| PD-9 | VPC Resolver retries a random other target; no published timeout | Limits table | verified | c07-r53out |
| PD-10 | Azure resolver policy logs to `DNSQueryLogs` with resolution path, policy action, Private Resolver endpoint and ruleset | Limits table | verified; no Learn statement found on a separate native log for 168.63.129.16, so none claimed | c07-azresolverpolicy, c07-azdnsmon |
| PD-11 | 1,000 QPS and 200 pending per VM to 168.63.129.16, excess dropped; 10,000 QPS per Private Resolver endpoint | Limits table | verified | c07-azlimits |
| PD-12 | Ruleset targets: first used unless unresponsive, then next; exponential backoff | Limits table | verified | c07-azrulesets |
| PD-13 | Cloud DNS logging per network via DNS policy to Cloud Logging; cached responses not logged by default | Limits table | verified | c07-gcplog |
| PD-14 | 100,000 queries per 10 s per VPC network per Google Cloud zone; 50 forwarding targets | Limits table | verified; no per-VM DNS limit documented, so none claimed | c07-gcpquota |
| PD-15 | Forwarding targets ranked by success and latency; SERVFAIL if none reply; on-premises targets must answer within 4 s | Limits table | verified | c07-gcpzones, c07-gcptrouble |
| PD-16 | OCI private resolver query/response logs; documented for commercial realms only | Limits table, estate | verified | c07-ocilog |
| PD-17 | OCI: unreachable forward target ends rule processing; stale cache answers with 30 s TTL | Limits table | verified | c07-ocitrouble |
| PD-18 | NSX: no per-query log; service log level; Edge CLI statistics; 1,024 KB default cache (~8k answers) | Limits table, checks | verified; API schema's "Max of 5 DNS servers" conflicts with the guide's 3 and is not used | c07-nsxapi, c07-nsxcli |
| PD-19 | NSX forwarder failover follows the gateway's active-standby Edge nodes | Limits table | inference (labelled); forwarder docs silent | c07-nsxt1 |
| PD-20 | AWS partitions are a hard boundary; RAM-shared Resolver rules and PHZ associations stay within a partition | Estate | partition boundary verified; Resolver/PHZ consequence is inference (labelled), no AWS page states it | c07-awspartition |
| PD-21 | Resolver endpoints (2019), query logging (2020), DNS Firewall (2021) available in GovCloud (US) | Estate | verified | c07-r53gov |
| PD-22 | GovCloud user guide says Resolver delegation unavailable; April 8, 2026 What's New says available | Estate | conflict recorded; reader told to check | c07-r53gov |
| PD-23 | Route 53 Global Resolver: internet-reachable anycast resolver; commercial Regions only | Estate | verified | c07-r53gr |
| PD-24 | Fusion Applications private access needs a VCN in the customer's OCI tenancy plus VPN or FastConnect; Oracle's page has no DNS guidance | Estate | verified | c07-ocifusion |
| PD-25 | Autonomous Database private endpoint name form `<prefix>.adb.<region>.oraclecloud.com`; conditional forwarding to the VCN resolver | Estate, checks | verified | c07-ociadb |
| PD-26 | OCI US Government Cloud: private DNS zones supported, public DNS not available | Estate | verified | c07-ocigov |
| PD-27 | Estate profile (M365 GCC, commercial Azure, GovCloud plus commercial contact center, on-premises VMware with DDI grid and AD DNS, HR platform on Oracle Cloud) and the per-row guidance | Estate | design guidance (labelled); agency-neutral | — |
| PD-28 | CLI syntax: `list-resolver-rule-associations --filters Name=VPCId,...`; `oci network vcn-dns-resolver-association get --vcn-id`; NSX `get dns-forwarder <uuid> stats` on an Edge node | Checks | verified against command references; `Get-AzDnsForwardingRulesetVirtualNetworkLink -DnsForwardingRulesetName -ResourceGroupName` verified against the Az.DnsResolver reference on Microsoft Learn; `gcloud dns policies list` and `managed-zones list` are standard gcloud list commands; illustrative callout added | c07-awscli, c07-ocicli, c07-nsxcli |
