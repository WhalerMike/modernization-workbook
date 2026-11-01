# Verification — Cloud DNS on AWS, Azure and Oracle Cloud: Native Resolvers, Infoblox and BIND (research)

File: `docs/evaluations/cloud-dns-resolvers-infoblox-bind.md`
Verified: 2026-10-29; Oracle Cloud added 2026-10-31

Method:
- AWS Developer Guide, VPC User Guide, GovCloud User Guide, General Reference, What's New and the FedRAMP services-in-scope page were fetched on 2026-10-29. The load-bearing AWS quotes were re-checked against the raw HTML with curl: the DNSSEC validation note (DO and CD bits ignored), the 1,024 PPS link-local quota, the GovCloud Route 53 page ("Route 53 Resolver delegation is not available"; "answered from within FedRAMP boundary"), and the FedRAMP page's Class C and Class D columns, the Amazon Route 53 row and the "generally available features" sentence.
- Microsoft Learn pages were read through the Microsoft Learn documentation tools and fetched. Azure Government availability was checked three ways: the products-by-region table in a browser (no Azure Government columns are shown), the Learn comparison page (no DNS differences listed), and the Azure Retail Prices API filtered to US Gov locations (meters present).
- The BIND 9.20 ARM was read from its reStructuredText source and the rendered reference page; `validate-except` and `forwarders` (TLS transport) were re-checked in the source with curl. ISC KB and download pages were fetched.
- NIST SP 800-81r3 and CISA's Encrypted DNS Implementation Guidance were downloaded as PDFs and searched in extracted text; section numbers come from the PDF.
- The illustrative `named.conf` was extracted from the page and checked with `named-checkconf` from BIND 9.18.39 (Ubuntu 24.04 package) in WSL: passed.
- Book 08, Book 09, Book 12 and the Ansible guide citations reused on the page were carried from their own verification logs, as noted.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **confirm** (the sources don't settle it; marked *confirm* on the page and listed below).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Route 53 Resolver renamed Route 53 VPC Resolver when Global Resolver introduced | Part 1 AWS | verified | cdns-r53-what |
| 2 | VPC+2 and 169.254.169.253; answers EC2 names, PHZ records, public recursion | Part 1 AWS | verified | cdns-r53-what, cdns-vpc-dns |
| 3 | Recursive queries only; not filterable by NACLs or security groups | Part 1 AWS | verified | cdns-vpc-dns |
| 4 | 1,024 PPS per ENI to link-local services (DNS, IMDS, NTP, Windows licensing); cannot be increased; traffic over it rejected | Part 1, Part 2, Part 3 | verified (raw HTML) | cdns-vpc-dns |
| 5 | Inbound endpoint and delegation inbound endpoint; outbound endpoint | Part 1 table | verified | cdns-r53-hybrid |
| 6 | ≥2 IPs in different AZs; 6 per endpoint default; 10,000 UDP QPS per IP; as low as 1,500 inbound with connection tracking or NLB | Part 1 table | verified | cdns-r53-endpoints, cdns-r53-quotas |
| 7 | DoH-FIPS (FIPS 140-2) inbound forward endpoints only; outbound Do53 and DoH | Part 1 table, Part 2 | verified | cdns-r53-endpoints |
| 8 | Outbound needs Direct Connect, VPN or NAT gateway; sharing a rule shares its outbound endpoint | Part 1 table | verified | cdns-r53-endpoints |
| 9 | Forwarding, system, autodefined, delegation rules; most specific wins; rule beats PHZ of same name; "." rule | Part 1 table | verified | cdns-r53-rules, cdns-r53-phz |
| 10 | 1,000 rules per Region; 6 IPs per rule | Part 1 table | verified | cdns-r53-quotas |
| 11 | Internet Resolver rule can't be deleted | Part 1 table | verified | cdns-r53-rules-manage |
| 12 | RAM sharing to accounts, OUs, organization; consumer can't change or delete; OU move removes associations | Part 1 table | verified | cdns-r53-rules-manage |
| 13 | DNS Firewall actions Allow, Alert, Block (NODATA, NXDOMAIN, OVERRIDE); Advanced: DGA, tunneling, dictionary DGA | Part 1 table | verified | cdns-r53-fw-actions, cdns-r53-fw-adv |
| 14 | DNS Firewall filters only queries through VPC DNS, plus inbound-endpoint queries into that VPC | Part 1 table, Part 3 | verified | cdns-r53-fw-how |
| 15 | DNS Firewall fails closed (SERVFAIL) by default | Part 1 table | verified; overview page reads otherwise, configuration page relied on (noted in footnote) | cdns-r53-fw-config |
| 16 | AWS managed lists can't be downloaded or browsed; available in GovCloud | Part 1 | verified | cdns-r53-fw-managed |
| 17 | Query logging: VPC, inbound, outbound, Firewall actions; CloudWatch Logs, S3, Firehose; fields; not cache hits; RAM sharing | Part 1 table | verified | cdns-r53-qlog, cdns-r53-qlog-fields, cdns-r53-qlog-share |
| 18 | PHZ: VPC settings; 300 VPCs per zone; cross-account by API only; NXDOMAIN on empty match; split view | Part 1 table | verified | cdns-r53-phz, cdns-r53-phz-xacct, cdns-r53-quotas |
| 19 | Profiles: resources, RAM sharing, one per VPC, local wins on exact tie | Part 1 table | verified | cdns-r53-profiles |
| 20 | DNSSEC validation per VPC for public signed names; signing public hosted zones only, KSK in KMS | Part 1 table, Part 3 | verified | cdns-r53-validate, cdns-r53-sign |
| 21 | VPC Resolver ignores DO and CD bits, returns no DNSSEC records, no AD bit; own validation not supported behind it; "could result in an outage" | Part 1 table, Part 3 | verified (raw HTML) | cdns-r53-validate |
| 22 | Global Resolver: anycast, Do53/DoT/DoH, GA March 9, 2026, 30 Regions, not GovCloud | Part 1 | verified (not in GovCloud = absent from Region list) | cdns-r53-global |
| 23 | GovCloud R53 page: public and private DNS and health checks; control plane US-West; "within FedRAMP boundary"; KMS key and log group US-West; routing types unavailable in PHZs | Part 1 GovCloud | verified (raw HTML) | cdns-gov-r53 |
| 24 | GovCloud delegation conflict: user guide "not available" vs April 8, 2026 announcement | Part 1 table | verified (both sources); **confirm** | cdns-gov-r53, cdns-r53-gov-deleg |
| 25 | Resolver and Profiles API endpoints in us-gov-east-1 and us-gov-west-1; Profiles in GovCloud since June 2024 | Part 1 table | verified | cdns-r53-regions |
| 26 | DNS Firewall availability lists GovCloud | Part 1 table | verified | cdns-r53-fw-avail |
| 27 | Dictionary DGA in GovCloud (Nov 2025); other Advanced protections in GovCloud | Part 1 table | verified for dictionary DGA; others **confirm** | cdns-r53-fw-adv |
| 28 | Resolver query logging in GovCloud | Part 1 table | **confirm** (no page found) | — |
| 29 | DNSSEC validation in GovCloud | Part 1 table | **confirm** (not on GovCloud page) | — |
| 30 | FedRAMP page (Oct 15, 2026): one Amazon Route 53 row, Class C East/West, Class D GovCloud; no Resolver rows; "generally available features ... in scope" | Part 1 FedRAMP | verified (raw HTML) | cdns-aws-fedramp |
| 31 | Marketplace: AWS East/West Moderate (AGENCYAMAZONEW); GovCloud High (F1603047866) | Part 1 FedRAMP | verified | cdns-fedramp-mkt |
| 32 | Resolver features covered by the general statement, worth noting in the SSP | Part 1 FedRAMP | inference (labelled) | — |
| 33 | Azure Private Resolver limits (5 endpoints each way, 10,000 QPS per endpoint, 1,000 rules, 500 links, 6 targets, one ruleset per VNet) | Part 1 Azure | verified; unchanged since Book 08 Ch07 (overview updated 2026-06-23) | cdns-az-pr, cdns-az-limits |
| 34 | No encrypted VNets, no IPv6-enabled subnets; single-region, zone-redundant | Part 1 Azure | verified | cdns-az-pr, cdns-az-rel |
| 35 | DNS security policy renamed DNS resolver policy; URL and meters keep old name | Part 1 Azure | verified | cdns-az-policy, cdns-az-prices |
| 36 | Resolver policy: filter and log public and private queries; allow/block/alert; MSRC threat intel; one per VNet; same region; logs to Log Analytics, storage, Event Hubs | Part 1 Azure | verified | cdns-az-policy, cdns-az-traffic |
| 37 | Resource logs listed only for resolver policies; resolver has metrics only | Part 1 Azure | verified (complete list); "only" is inference (labelled) | cdns-az-monitor |
| 38 | Azure-provided resolver doesn't validate DNSSEC; Public DNS signing only; Private Resolver validation not documented | Part 1 Azure, Part 3 | verified; Private Resolver validation **confirm** | cdns-az-dnssec |
| 39 | Azure DNS doesn't support AXFR/IXFR | Part 1 Azure | verified | cdns-az-faq |
| 40 | Audit scope (Feb 2026): one DNS row; FedRAMP High in Azure and Azure Government; no separate resolver rows | Part 1 Azure | verified | cdns-az-fedramp |
| 41 | Products-by-region table shows no Azure Government columns; comparison page lists no DNS differences | Part 1 Azure | verified (browser check) | cdns-az-regions |
| 42 | US Gov price meters: Private Resolver endpoints and ruleset since 2024-10-01; DNS Security Policy since 2026-06-01 | Part 1 Azure | verified (API query) | cdns-az-prices |
| 43 | A meter is a signal, not an availability statement | Part 1 Azure | inference (labelled); availability **confirm** | — |
| 44 | Neither inbound endpoint takes an ordinary NS delegation of a private zone; AWS delegation inbound endpoint is the exception | Part 1 meeting | verified | cdns-r53-hybrid, cdns-az-arch |
| 45 | CISA: Protective DNS for all egress; cloud deployments upstream to Protective DNS "either directly or via a SASE/SSE solution," or agency internal DNS | Part 1, Part 3, Part 5 | verified (PDF text) | cdns-cisa-edns |
| 46 | Neither native resolver forwards "." to Protective DNS by itself | Part 1 meeting | inference from the rule model (no default forwarding to any named upstream) — stated as design context | cdns-r53-rules |
| 47 | Shared rules / Profiles as "one policy object"; DNS Firewall and resolver policy as second policy surface; feed both from one decision | Part 1 meeting | design | — |
| 48 | Microsoft: "Use DNS Private Resolver instead of custom DNS server software like BIND when possible"; VM DNS for NS-delegated subdomains; two VMs across zones | Part 2, Part 3 | verified | cdns-az-hybrid |
| 49 | AWS whitepaper (2022, historical): custom resolvers on EC2; "forward only" for BIND; auto-recovery | Part 2, Part 3 | verified; page labels it historical | cdns-aws-whitepaper |
| 50 | Azure: 1,000 QPS and 200 pending per VM to 168.63.129.16; over-limit dropped; per VM | Part 2, Part 3 | verified | cdns-az-limits |
| 51 | Part 2 decision criteria | Part 2 | design | — |
| 52 | vNIOS cloud HA docs list only commercial endpoints | Part 2 | carried from the NIOS implementation guide (verified there 2026-10-23) | infoblox-nios-implementation.md |
| 53 | BIND: even-numbered versions supported four years; 9.20.30 current, ESV label, EOL Q2 2028; 9.18 EOL June 2026; 9.21 development | Part 3 | verified | cdns-isc-support, cdns-isc-download |
| 54 | ISC vulnerability policy covers only latest monthly releases; advance notice to support customers | Part 3 | verified | cdns-isc-vuln |
| 55 | Ubuntu 24.04 archive carries 9.18.39 | Part 3 | verified (`apt-cache policy bind9` in WSL, 2026-10-29) | — |
| 56 | NIST §2.3.1: dedicated, hardened; recursion off on authoritative; internet-facing not both roles; internal combined acceptable | Part 3, Part 4 | verified (PDF) | cdns-nist81-231 |
| 57 | ISC: "Do not combine authoritative and recursive nameserver functions"; dedicated server; bind-announce | Part 3 | verified | cdns-isc-auth |
| 58 | AWS: forwarding to another VPC's +2 not supported | Part 3 | verified | cdns-r53-hybrid |
| 59 | AWS: custom DNS servers must route private queries to the VPC's Amazon-provided DNS | Part 3 | verified | cdns-r53-phz-cons |
| 60 | Azure: DNS VM in same VNet forwards to Azure; timeout more than four seconds | Part 3 | verified | cdns-az-vnetdns |
| 61 | NIST §2.3.2: two or more servers, segments, geographic dispersion, hidden primary | Part 3 | verified (PDF) | cdns-nist81-232 |
| 62 | BIND `forward` default `first`; `forwarders` with TLS; `type forward` | Part 3 | verified (ARM source) | cdns-bind-ref |
| 63 | VPC Resolver sees BIND as source, not client; never sees BIND's cache hits | Part 3 | inference (labelled) | cdns-r53-qlog, cdns-r53-fw-how |
| 64 | Loop avoidance (AWS and Azure) | Part 3 | verified | cdns-r53-bp, cdns-az-rulesets |
| 65 | Illustrative named.conf syntax | Part 3 | verified (`named-checkconf`, BIND 9.18.39) | — |
| 66 | `dnssec-validation` defaults to `auto`; validates by default | Part 3 | verified | cdns-bind-ref, cdns-bind-dnssec |
| 67 | `validate-except` wording | Part 3 | verified (ARM source) | cdns-bind-ref |
| 68 | Private zone under a signed parent treated as bogus by a validator | Part 3 | inference from DNSSEC behavior (no secure delegation) — stated as the reason for `validate-except` | cdns-bind-ref |
| 69 | Whether Protective DNS returns DNSSEC data to forwarders | Part 3 | **confirm** (not on CISA's public pages) | — |
| 70 | NIST §3.8.6: signing internal zones "not recommended" except where required; agencies may require | Part 3 | verified (PDF) | cdns-nist81-sign |
| 71 | `dnssec-policy default` "recommended, fully automated"; inline signing; ZSK automatic, KSK needs parent DS | Part 3 | verified | cdns-bind-dnssec |
| 72 | DNSSEC keys on the Grid Master or HSM (Book 08) | Part 3 | carried from the Trinzic explainer and Book 08 | trinzic-multicloud-ddi.md |
| 73 | RPZ: "ordinary DNS zones..."; up to 64; five triggers; actions; sync by IXFR and NOTIFY | Part 3 | verified | cdns-bind-rpz |
| 74 | NIST §2.1.2: "generally implemented by using DNS firewalls or RPZs"; RPZ secondaries; §2.1 footnote "not the CISA program" | Part 3 | verified (PDF) | cdns-nist81-pdns |
| 75 | CISA PDNS page: mandated; upstream; doesn't interfere with internal DNS; mobile, roaming, cloud direct | Part 3, Part 5 | verified (near-verbatim via fetch; matches Book 08 Ch03 wording) | cdns-cisa-pdns |
| 76 | CISA guidance: agency DNS "should use only Protective DNS as its upstream provider"; DoH/DoT IPv4/IPv6; plain DNS "for authorized FCEB DNS infrastructure" | Part 3 | verified (PDF text) | cdns-cisa-edns |
| 77 | CISA pages don't mention RPZ; layering is NIST's and the program's | Part 3 | verified (search of PDF and page); design | cdns-cisa-edns |
| 78 | BIND 9.20 serves DoT/DoH; `forwarders ... tls` sends DoT upstream | Part 3 | verified (ARM source) | cdns-bind-ref |
| 79 | CISA A.3.1: BIND "does not currently support ... upstream ... encrypted"; proxy; `recursion no` to avoid root hints | Part 3 | verified (PDF text); outdated for 9.20 and questionable for `recursion no` — inference (labelled) | cdns-cisa-edns, cdns-bind-ref |
| 80 | NIST §2.1.3: "robust DNS traffic logging"; DNSTAP; blocked queries "should always be logged"; SIEM | Part 3 | verified (PDF) | cdns-nist81-log |
| 81 | M-22-09 logging at designated resolvers; M-26-14 6/12 months | Part 3, Part 5 | carried from Book 08 Ch03 and Ch11 logs | cdns-m2209, cdns-m2614 |
| 82 | BIND logging categories; `querylog`; `rndc querylog`; dnstap types, file or unix socket, `--enable-dnstap`, not changed by reload | Part 3 | verified (ARM source) | cdns-bind-ref |
| 83 | ISC: query logging overhead | Part 3 | verified (stale page, noted) | cdns-isc-rec |
| 84 | ASIM NIOS parser also handles BIND | Opening, Part 3 | carried from Book 12 Ch05 | — |
| 85 | SP 800-81r3 has no patching section | Part 3 | verified (full-text search: no "patch", "version.bind", "up-to-date") | cdns-nist81-231 |
| 86 | Vulnerability matrix title "BIND 9 Software Vulnerability Matrix"; bind-announce | Part 3 | verified | cdns-isc-matrix |
| 87 | BOD 26-04 replaced 22-01 and 19-02; three-day window for highest risk | Part 3, Part 5 | carried from Book 09 Ch02 and Book 12 Ch06 logs | cdns-bod2604 |
| 88 | BOD 23-01: 7-day discovery, 14-day enumeration, cloud in scope | Part 3, Part 5 | verified | cdns-bod2301 |
| 89 | `version none`; `allow-query` default all hosts; `allow-recursion`; `allow-transfer`; TSIG; chroot/setuid | Part 3 | verified (ARM) | cdns-bind-ref, cdns-bind-sec |
| 90 | NIST §3.1: TSIG; TLS for transfer confidentiality | Part 3 | verified (PDF) | cdns-nist81-xfr |
| 91 | CIS lists ISC BIND DNS Server 9.11 v1.0.0 and 9.9 v3.0.1; none for 9.18 or 9.20 | Part 3 | verified (cisecurity.org); NCP dates not loaded, not relied on | cdns-cis |
| 92 | DISA BIND 9.x STIG exists (High only); current release not read | Part 3 | partially verified (listed on cisecurity.org's STIG list and NCP search results; cyber.mil unreachable); no version stated on page | — |
| 93 | Ansible tier-2, CM-2/CM-3 evidence, one owning tool | Part 3 | carried from the Ansible guide | ansible-configuration-automation.md |
| 94 | Part 4 checklist and reading | Part 4 | design (built from the parent session's analysis, facts checked above) | — |
| 95 | SP 800-53 control titles CM-2 … AU-12 | Part 5 | carried from Book 08 Ch03/Ch06 and the Ansible guide logs (release 5.2.0) | cdns-sp80053 |
| 96 | ED 19-01: Jan 22, 2019; four actions; sunset Jan 8, 2026 | Part 5 | verified | cdns-ed1901 |
| 97 | M-08-23 | Part 3 | carried from Book 08 Ch03 | cdns-m0823 |

## What couldn't be verified (marked *confirm* on the page)

- Route 53 Resolver delegation in GovCloud: AWS's GovCloud User Guide and its April 8, 2026 announcement conflict.
- VPC Resolver DNSSEC validation in GovCloud: no AWS page states it. (Resolver query logging in GovCloud was confirmed on 2026-10-31; see claim 98.)
- Oracle: private resolver logging in the government realm; whether the VCN resolver passes DNSSEC data to a resolver behind it.
- DNS Firewall Advanced protections other than dictionary DGA in GovCloud.
- Azure DNS Private Resolver and DNS resolver policy availability by Azure Government region: the region table omits Azure Government; only price meters are evidence.
- Whether the Azure DNS Private Resolver validates DNSSEC.
- Whether CISA Protective DNS returns DNSSEC data to agency forwarders.
- The current DISA BIND 9.x STIG release (cyber.mil unreachable), and the NCP dates of the CIS BIND benchmarks.
- A current (non-historical) AWS page on when to run DNS servers on EC2; only the 2022 whitepaper, cited as historical.

## Corrections to other sources noted on the page

- CISA *Encrypted DNS Implementation Guidance* (April 2024), Appendix A.3.1: BIND upstream encryption is supported in 9.20 (`forwarders ... tls`); `recursion no` disables recursive service rather than root-hint use.

## Addition, October 31, 2026: Oracle Cloud added; one AWS item closed

Oracle Cloud Infrastructure was added in Part 1 (a new subsection), in the meeting points, Part 2, Part 3 and Part 5, because the HR platform runs on Oracle Cloud. Oracle pages were fetched with curl and searched as text on 2026-10-31: "Private DNS", "Creating a Resolver Rule", "Troubleshooting DNS", "DNS in a Virtual Cloud Network" and "Oracle Cloud Infrastructure US Government Cloud with FedRAMP Authorization". The FedRAMP Marketplace JSON was parsed for every Oracle entry; dataset `last_change` 2026-10-31. Facts already verified in Book 08 Chapter 07 on 2026-10-30 (PD-3 to PD-5, PD-16, PD-17, PD-24 to PD-26) were reused and re-read where cited.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 98 | Route 53 Resolver query logging available in GovCloud since September 2020; the "confirm" removed | Part 1 GovCloud table, status | verified (carried from Book 08 Ch07 PD-21) | cdns-r53-gov-qlog |
| 99 | VCN resolver on 169.254.169.254; views in order, default view, rules, internet; "performs recursion to the internet and DNSSEC validation for DNSSEC-signed zones" | Part 1 OCI, Part 3 | verified (page text) | cdns-oci-pdns |
| 100 | A view can be used by any number of resolvers and shares private DNS data across VCNs in the same region; split horizon | Part 1 OCI | verified | cdns-oci-pdns |
| 101 | Cross-VCN resolution via listening and forwarding endpoints over LPG or RPG, same or other region | Part 1 OCI | verified | cdns-oci-pdns |
| 102 | Listening endpoint one IP; forwarding endpoint two; UDP/TCP 53 security rules | Part 1 OCI | verified | cdns-oci-pdns |
| 103 | 50 rules per resolver; condition CIDR, domain (up to 10) or None (matches any); forward only | Part 1 OCI, meeting points | verified (page text) | cdns-oci-rules |
| 104 | First match ends processing; unreachable target ends it; match ends resolution even if NXDOMAIN; 169.254.169.254 must be in custom DHCP list; stale cache 30 s TTL up to 24 h | Part 1 OCI, Part 3 | verified (page text) | cdns-oci-trouble |
| 105 | Custom resolver DHCP option, up to three DNS servers; `oraclevcn.com` names | Part 1 OCI, Part 3 | verified (page text) | cdns-oci-vcndns |
| 106 | No native DNS-layer policy for private DNS; Traffic Management public only | Answer in brief, Part 1, Part 2 | verified (Oracle states public only; absence of a DNS firewall carried from Book 08 PD-5) | cdns-oci-tm, cdns-oci-pdns |
| 107 | OCI's catch-all rule is the only way agency policy reaches a VCN | Meeting points | inference (labelled) | — |
| 108 | Private resolver logs documented for commercial realms only; government realm **confirm** | Part 1 OCI, status | verified (carried from Book 08 PD-16) | cdns-oci-log |
| 109 | US Government Cloud: FedRAMP High, DISA IL4; us-langley-1 and us-luke-1, realm OC2; can't subscribe to commercial regions; DNS API private only | Part 1 OCI | verified (page text) | cdns-oci-gov |
| 110 | Marketplace: OCI-Government Cloud FR1900048743 Class D High, JAB, 2020-10-01; Fusion Cloud F1603257882 Class C Moderate; no commercial OCI infrastructure entry | Part 1 OCI | verified (JSON parsed; all seven Oracle entries listed) | cdns-oci-mkt |
| 111 | Moderate systems on OCI infrastructure inherit from the Government Cloud's High authorization; commercial OCI needs its own authorization basis | Part 1 OCI | inference (labelled) | — |
| 112 | No Oracle page describes signing private zones; whether the VCN resolver passes DNSSEC data downstream **confirm** | Part 3 | verified as absence (no such text on the Private DNS page) | cdns-oci-pdns |
| 113 | BIND in a VCN forwards `oraclevcn.com` and private views to 169.254.169.254; Autonomous Database private endpoint names | Part 3 | design, built on cdns-oci-vcndns, cdns-oci-trouble and Book 08 PD-25 | — |
