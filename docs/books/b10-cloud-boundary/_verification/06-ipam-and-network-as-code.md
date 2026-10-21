# Verification — Chapter 06, IPAM and Network as Code

File: `docs/books/b10-cloud-boundary/06-ipam-and-network-as-code.md`
Diagram sources (new): `docs/images/diagrams/b10-cloud-boundary/src/ch06-address-authority.flow.yaml`, `ch06-module-layers.flow.yaml`.
Sources read: `docs/compliance/Vol_I_Book_01_Cloud_Landing_Zone_IPAM_FedRAMP.md`, `docs/compliance/Vol_VI_Book_01_Landing_Zone_Network_as_Code.md`, `docs/modernization-specs/cloud.md` (drift considerations). Consistency checked against Book 08 Ch07 (IPAM authority; AWS VPC IPAM not in GovCloud; VCF 9.1) and Book 09 Ch12 (Microsoft 365 endpoints).
Checked 2026-10-21 against Microsoft Learn (Virtual Network Manager IPAM concept; Bicep deployment of IPAM pools; Prevent overlapping address spaces with Azure Policy and IPAM; IP planning design guide; Virtual Network FAQ; Azure services in FedRAMP audit scope; Microsoft 365 IP Address and URL web service), AWS VPC User Guide (subnet sizing), CISA BOD 23-01, FedRAMP Consolidated Rules for 2026 (Policy and Inventory KSIs), NIST SP 800-53 Rev. 5 release 5.2.0 and SP 800-53B Moderate profile (usnistgov OSCAL), NIST SP 800-37 Rev. 2, FedRAMP Marketplace `products.json` (meta last_change 2026-10-21). Footnote keys drop the `c06-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CM-8 statement items (accurately reflects; includes all components; no duplicates) | Join key | verified | sp80053 |
| 2 | Scan enumerates responders; IPAM enumerates allocations; reconcile against allocation | Join key | restated-as-design (Vol I closure argument) | — |
| 3 | BOD 23-01: discovery every 7 days covering entire IPv4 space; on-prem, roaming, cloud in scope; excludes ephemeral assets and third-party SaaS | Join key | verified | bod2301 |
| 4 | KSI-PIY-GIV quote | Join key | verified; framed as provider indicator, not agency obligation | ksi-piy |
| 5 | Boundary isn't defined by IP ranges; components | Join key | verified (definition) | sp80037 |
| 6 | IPAM doesn't see software, patch, owner, boundary membership, relationships, non-IP assets | What IPAM can't see | restated-as-design | — |
| 7 | CMDB requirements (condensed R-01..R-15) | What IPAM can't see | restated-as-design | — |
| 8 | Source: CM-8 "requires hardware, software, firmware, and interconnections" | (not carried) | removed: not in the CM-8 statement text as quoted | sp80053 |
| 9 | Azure: L3 overlays; five reserved addresses (.0, .1, .2–.3 DNS mapping, last) | Addresses without broadcast | verified | vnetfaq |
| 10 | AWS: five reserved; DNS at base +2; .3 future use; broadcast reserved, not supported | Addresses without broadcast | verified; corrected source ("synthetic DHCP at +2") | aws-subnet |
| 11 | VCF 9.1 native IPAM integration; AWS VPC IPAM external authority not in GovCloud | Addresses without broadcast | verified via Book 08 Ch07 (linked, not re-footnoted) | Book 08 Ch07 |
| 12 | AVNM IPAM: root + up to seven layers of child pools; static CIDRs; IPv4/IPv6; cross-region; IPAM Pool User role | Azure | verified | avnm |
| 13 | IPAM GA in all AVNM regions except six non-US regions | Azure | verified; corrected source reference that called it "preview" | avnm-bicep |
| 14 | AVNM doesn't prevent overlap by itself; deny policy requiring pool allocation does | Azure | verified | avnm-policy |
| 15 | Bicep: networkManagers, ipamPools, staticCidrs @2024-05-01; VNet ipamPoolPrefixAllocations with numberOfIpAddresses | Azure (code) | verified (adapted from Microsoft sample; names/ranges changed) | avnm-bicep |
| 16 | Policy JSON: deny VNet lacking allocation from pool | Azure (code) | verified (adapted from two-pool sample to one pool using `not` over a single condition) | avnm-policy |
| 17 | AVNM not named in either audit-scope table; VNet, DNS, Firewall, Private Link are | Boundary check | verified | scope |
| 18 | Infoblox Government Cloud FR2017257053: Certified, Moderate, Class C, cert date 2022-12-15; description covers Universal DDI, Asset Insights, threat defense | Boundary check | verified; corrected source's emphasis on a July 22, 2026 recertification, which doesn't appear in the Marketplace event log (the listing description does now include DDI) | fr |
| 19 | Five-module topology and deployable-artifacts table | Network as code | restated-as-design (Vol VI Book 01) | — |
| 20 | Source illustrative HCL (`dns_zone`, `dns_resolver`, `dns_rpz_policy`) | Naming module | removed as code: not a real provider schema; carried as a declared-properties table | — |
| 21 | Control titles SC-7, SC-20, SC-21, SC-22, CM-8, AC-4 | Controls | verified | sp80053 |
| 22 | Deployment order; RPZ log-only first | Deployment order | restated-as-design | — |
| 23 | M365 web service instances Worldwide, China, USGovDoD, USGovGCCHigh; GCC uses Worldwide | Inputs | verified; corrected source ("separate GCC endpoint list"; "commercial M365 endpoint is a FedRAMP boundary violation"; RPZ-block commercial M365) | m365ws; Book 09 Ch12 |
| 24 | Monthly updates, out-of-band changes, 30 days' notice; poll version no more than hourly | Inputs | verified | m365ws |
| 25 | Source: "Infoblox polls daily…worst case 24 hours vs 7+ days manual" | (not carried) | removed: vendor-specific and the manual-cycle figure unverifiable | — |
| 26 | CM-2(2) and CM-8(1) statements; both in Moderate baseline | Why reproducible | verified | sp80053; moderate |
| 27 | Honest limits (portal drift; feed currency; mirror lag) | Honest limits | restated-as-design | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol I Book 01 — SDN and the End of Traditional DHCP (intro) | Ch06 "Addresses without broadcast" | — |
| Vol I Book 01 — VMware NSX-T / VCF 9.1 | Ch06 (one line) | Detail already in Book 08 Ch07 (linked) |
| Vol I Book 01 — Azure Government: fabric replaces DHCP | Ch06; Ch05 scope table | "Synthetic DHCP injected by host agent" wording not carried (unverified) |
| Vol I Book 01 — AWS GovCloud: VPC DHCP options | Ch06 (corrected +2) | Replacing AmazonProvidedDNS with a DDI resolver: Book 08 Ch07 |
| Vol I Book 01 — Oracle OCI / partner tenancy | Ch05 multi-environment table (fourth row) | Named agency/vendor specifics generalized |
| Vol I Book 01 — InfoBlox as the SDN-Aware IPAM Control Plane; value table | Ch06 join-key framing | Vendor value table is positioning; Book 08 Ch12 covers selection |
| Vol I Book 01 — Grid Master trust case; least-privilege role delegation | — | DDI administration belongs to Book 08 Ch09/Ch11 (who owns DNS, delegated administration); linked from Book 08 |
| Vol I Book 01 — Microsoft partnership; M365 GCC endpoint lifecycle | Ch06 "Inputs that change underneath the code" (corrected) | Partnership integration table is vendor positioning |
| Vol I Book 01 — AWS partnership (LZA, Security Hub, ACM PCA, IPAM sync, Route 53 private-zone DNSSEC note) | Ch05 (LZA, from AWS docs) | Route 53 private zones can't be DNSSEC-signed (verified in AWS docs) belongs with Book 08 Ch06; other items vendor-specific |
| Vol I Book 01 — Oracle/OCI inter-agency integration; Inter-Agency SaaS template | Ch05 multi-environment table (partner-tenancy row) | Certificate-tracker tooling is vendor-specific; Book 07 covers certificate monitoring |
| Vol I Book 01 — Certificate Management and Cloud PKI Integration | — | Book 07 (PKI) and Book 08 Ch06 own it |
| Vol I Book 01 — Subdomain Strategy and Namespace Design (all subsections, incl. wildcard alignment, split-horizon views, IaC/vDiscovery, RPZ scoping, added NIST rows) | — | Book 08 Ch01, Ch02, Ch06, Ch08 own namespace, split-horizon and RPZ; source itself defers the strategic argument to Book 08 |
| Vol I Book 01 — DNS-Based Traffic Steering | — | Naming-plane function; Book 08 territory; not a landing-zone build item |
| Vol I Book 01 — NIST SP 800-53 Control Mapping (15 rows) and SC-20/21 closure callout | Ch06 controls table (landing-zone subset); closure argument in "Why reproducible matters" | Full DDI mapping is in Book 08 App B |
| Vol I Book 01 — CISA ZTMM alignment | — | Book 08 Ch03 and App B map ZTMM for DDI |
| Vol I Book 01 — FedRAMP Moderate evidence package; FedRAMP 20x KSI automation | Ch06 (KSI-PIY-GIV, framed correctly); Ch07 (KSI-CMT) | "Agency landing zone pursues Class B/C" framing removed (classes certify providers) |
| Vol I Book 01 — System Component Inventory: IPAM is not an asset manager; four surfaces; open decision | Ch06 "What IPAM can't see" | — |
| Vol I Book 01 — CMDB requirements R-01..R-15 | Ch06 condensed table | Full table linked by GitHub URL |
| Vol I Book 01 — FedRAMP-authorized product candidates | — | Point-in-time vendor landscape; link given; reader told to check Marketplace at procurement |
| Vol I Book 01 — Recommended evaluation approach (three PoC tests) | Ch06 | — |
| Vol I Book 01 — Architecture summary table | — | Duplicates Book 08 Ch08 reference architecture |
| Vol I Book 01 — Buildout roadmap Phases 0–6 | — | DDI migration sequence is Book 08 Ch10; procurement steps vendor-specific |
| Vol I Book 01 — References | Footnotes (re-verified individually) | — |
| Vol VI Book 01 — What This Document Addresses | Ch06 intro and "Why reproducible matters" | — |
| Vol VI Book 01 — Module Topology | Ch06 module table and diagram | — |
| Vol VI Book 01 — Deployable Artifacts | Ch06 module table (merged columns) | — |
| Vol VI Book 01 — Illustrative module (DNSSEC-signed zone HCL) | Ch06 declared-properties table | Pseudocode not reproduced (not a real schema) |
| Vol VI Book 01 — Deployment | Ch06 "Deployment order" | — |
| Vol VI Book 01 — Closure Necessity | Ch06 "Why reproducible matters" | — |
| Vol VI Book 01 — Controls Operationalized | Ch06 controls table | — |
| Vol VI Book 01 — Honest Limits | Ch06 "Honest limits" | — |
| Vol VI Book 01 — Cross-References; Provenance; banners | — | Internal series navigation and stamps |
| cloud.md — Drift considerations | Ch05 (provenance and authorization drift) | — |
