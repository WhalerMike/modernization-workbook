---
title: "SD-WAN and SASE Platforms Against Book 09's Requirements"
subtitle: "A product deep dive: eight SD-WAN, SASE and SSE platforms rated against the network book's own criteria, and why the program builds on Cisco Catalyst SD-WAN under stated conditions"
description: "Research under review: Cisco Catalyst SD-WAN, Palo Alto Prisma SD-WAN and Prisma Access, Fortinet, HPE Aruba EdgeConnect, Arista VeloCloud, Juniper Session Smart, Zscaler and Microsoft Global Secure Access, checked against Book 09's requirements using FedRAMP, CISA, NIST and NIAP records."
research-status: in review
research-type: product deep dive
research-book: "Book 09"
date-modified: 2026-10-24
last-reviewed: 2026-10-24
---

# SD-WAN and SASE Platforms Against Book 09's Requirements {.unnumbered}

[Book 09 — Network & Transport](../books/b09-network/index.md) tells an agency what its branch network has to do. It doesn't name products. This page asks the product question: which SD-WAN and SASE platforms meet the book's requirements today, and what does the federal record say about each? It ends with the program's recommendation.

The answer in one paragraph: **the program builds on Cisco Catalyst SD-WAN, its existing platform, and it attaches conditions to that choice.** Cisco meets more of Book 09's criteria outright than any other platform, and the book's field-office design is already sized and costed on it. It is also the platform with the worst controller security record of 2026: a CISA emergency directive and nine actively exploited controller vulnerabilities. It also has no documented post-quantum key exchange in SD-WAN mode, and no current platform-level FIPS 140-3 certificate was found for its branch routers. Palo Alto Prisma SD-WAN with Prisma Access is the strongest alternative. The conditions, and the events that would reopen the decision, are below.

::: {.callout-note}
## How to read this page
Facts about products come from primary sources opened on October 24, 2026, and each one has a footnote: FedRAMP Marketplace data, CISA's Known Exploited Vulnerabilities (KEV) catalog and directives, NIST's validated-module lists, NIAP's Product Compliant List, GSA, and the vendors' own documentation. Statements marked **(inference)** are the research's reading of those sources. Statements marked **(design guidance)** are the program's position. Naming a product here is the program's own analysis, with the evidence for and against it. It is **not an endorsement by any agency**.
:::

## The words this page uses

- **SD-WAN** (software-defined WAN). The branch router and the central software that steers each kind of traffic onto the best of several circuits, measures each path, and encrypts traffic between sites. The central software has three parts: a *manager* or *orchestrator* where administrators configure policy, and a *controller* and *validator* that run the network.
- **SSE** (security service edge). Cloud security services, such as web filtering, cloud-app control and zero trust access to private applications, that inspect traffic after it leaves the branch.
- **SASE** (secure access service edge). SD-WAN and SSE sold or run together.
- **The governor.** Book 09's name for the SD-WAN control plane. It has authority over routing for every office, so it is the most consequential network device the agency owns ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)).

## The criteria, taken from Book 09

Each criterion is something the book already asks for. No new requirement was added for this comparison.

| # | Criterion | Plain meaning | Where Book 09 asks for it |
|---|---|---|---|
| R1 | Controller can sit inside the agency boundary | The manager and controller can run in the agency's own data centers | [Ch 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md) (boundary disposition); [Ch 11](../books/b09-network/11-field-office-wan-transformation.md) (on-premises control plane) |
| R2 | FedRAMP status of anything cloud-delivered | A cloud controller or security service needs its own FedRAMP certification at the right level | [Ch 03](../books/b09-network/03-what-tic-3-requires.md); Ch 05; Ch 11; [Appendix B](../books/b09-network/appendix-b-requirements-mapping.md) |
| R3 | Equal enforcement on every path | Under the TIC 3.0 Branch Office Use Case, every path lands on enforcement of equal strength, delivered by security services above the SD-WAN | Ch 03; Ch 05; [Ch 08](../books/b09-network/08-reference-architecture.md) |
| R4 | Telemetry to CISA | Logs reach CISA's Comprehensive Log Aggregation Warehouse (CLAW) before MTIPS circuits are retired | Ch 03; Ch 08; Ch 11; [Ch 13](../books/b09-network/13-sequencing-cost-and-evidence.md) |
| R5 | The governor's security record | The controller and edges are internet-facing and estate-wide; what has been exploited, and what directives apply | Ch 05; Ch 08, Decision 4 |
| R6 | Steering and path measurement | Application-aware steering, continuous path measurement, a stable source address | [Ch 10](../books/b09-network/10-the-long-interim.md) |
| R7 | Evidence export | Policy-change audit, syslog, flow records and APIs to the agency's log pipeline | Ch 05; Ch 08, Decision 5; Ch 13 |
| R8 | Post-quantum key exchange | Equipment that ends IPsec or TLS sessions supports ML-KEM, as OMB M-26-15 requires | Ch 03; Ch 10 |
| R9 | Validated cryptography | A current FIPS 140-3 certificate (FIPS 140-2 certificates moved to the historical list on September 22, 2026) | Ch 03; Ch 10 |
| R10 | Tail-latency tools | Forward error correction, packet duplication and fast failover | Ch 05 |
| R11 | Microsoft 365 in GCC | Works without Microsoft's informed network routing, which GCC lacks; coexists with Microsoft's security services | Ch 11; [Ch 12](../books/b09-network/12-microsoft-365-traffic.md) |
| R12 | Field-office scale | 12 hubs, 1,500 offices, zero-touch provisioning, a 5G backup path | Ch 11 |

Two further facts are recorded as supporting evidence rather than requirements: Common Criteria certification on NIAP's list, and availability through GSA's Enterprise Infrastructure Solutions (EIS) contract.

## The matrix

**Met** means a primary source shows it. **Partial** means it is shown with a real limit. **Not met** means a source shows it is absent, or a government record shows the adverse fact. **Unknown** means it wasn't found; unknown isn't the same as not met. The research brief behind this page has the uncondensed matrix with a source for every cell.

| | Cisco Catalyst SD-WAN | Palo Alto Prisma SD-WAN + Access | Fortinet | HPE Aruba EdgeConnect | Arista VeloCloud | Juniper SSR / Mist | Zscaler (SSE) | Microsoft GSA (SSE) |
|---|---|---|---|---|---|---|---|---|
| R1 Controller in boundary | Met | Met | Met | Met | Met | Met | Not met | Not met |
| R2 FedRAMP for cloud parts | Met | Met at Moderate | Not met | Not met | Not met | Met | Met | Partial |
| R3 Enforcement above SD-WAN | Met | Met | Partial | Partial | Partial | Partial | Met | Partial |
| R4 CLAW telemetry | Partial | Partial | Unknown | Unknown | Unknown | Unknown | Met | Unknown |
| R5 Governor's record, 2024–2026 | **Not met** | Partial | **Not met** | Met | **Not met** | Met | Met | Met |
| R6 Steering and measurement | Met | Met | Met | Met | Met | Met | Partial | Not met |
| R7 Evidence export | Met | Partial | Met | Met | Partial | Partial | Partial | Unknown |
| R8 Post-quantum key exchange | **Not met** (SD-WAN mode) | Partial | Met | Unknown | Unknown | Not met / Unknown | Partial | Unknown |
| R9 FIPS 140-3 | Partial | Met | Met | Not met | Not met | Not met | Partial | Unknown |
| R10 Tail-latency tools | Met | Unknown | Unknown | Unknown | Unknown | Unknown | — | — |
| R11 Microsoft 365 in GCC | Met | Partial | Partial | Met | Met | Met | Partial | Met (GCC only) |
| R12 Ch 11 scale | Met | Unknown | Unknown | Unknown | Unknown | Unknown | — | — |
| NIAP Common Criteria | Met | Met | Met | Met | Not met | Met | Unknown | Unknown |

On acquisition, GSA lists "Software-Defined Wide Area Network Service" under EIS for eight contractors: 22nd Century Networks, AOC Connect, AT&T, Comcast, Granite, Lumen, MetTel and Verizon Federal.[^eis] No government page says which contractor delivers which product, so the matrix doesn't rate it.

## What the records show, platform by platform

### Cisco Catalyst SD-WAN

- **Authorization.** "Cisco Catalyst SD-WAN for Government" is FedRAMP Certified at Class C (Moderate), certified March 14, 2024; it covers the cloud-hosted manager, validator and controller. Cisco Secure Access for Government, Cisco's SSE, is Class D (High), certified August 6, 2026.[^fr] Cisco documents both on-premises and Cisco-hosted control components and calls the hosted option recommended.[^cs-design] Book 09's cost model assumes on-premises.
- **The emergency directive.** CISA issued Emergency Directive 26-03 on February 25, 2026, and Version 1 on March 11, 2026, for an authentication bypass that gives an unauthenticated attacker administrative control.[^ed2603] It required agencies to:
  - inventory affected systems within a day;
  - store logs off the device and collect forensic artifacts;
  - patch, hunt for compromise, and harden;
  - send all SD-WAN syslog to CISA through CLAW.

  CISA's supplemental direction says the activity "likely began in 2023" and adds two more vulnerabilities to the hunt.[^ed-supp]
- **It didn't stop with the directive.** CISA's KEV catalog lists nine Catalyst SD-WAN Manager or Controller vulnerabilities added in 2026, the latest on September 30. Three of them allow unauthenticated remote access with administrative privileges.[^kev]
- **FedRAMP hosting is no shelter.** The directive has separate steps for "Off-Prem (cloud) deployments."[^ed2603] Cisco's advisory for the May 2026 bypass says it "affects all deployment types," naming both on-premises and Cisco SD-WAN for Government (FedRAMP).[^cs-adv]
- **Cryptography.**
  - *FIPS 140-3:* active certificates cover Cisco firmware libraries (the IOS Common Cryptographic Module and the CiscoSSL FIPS Provider). The Catalyst 8300 platform certificate is on the historical list, and no active platform-level 140-3 certificate was found for the Catalyst 8200 and 8300 branch routers in Book 09's bill of materials.[^cmvp]
  - *Post-quantum:* Cisco documents ML-KEM key exchange for IPsec on Catalyst 8000 routers "only… in the autonomous mode," which means not under SD-WAN control.[^cs-pqc]
- **What it does well.**
  - Common Criteria: NIAP lists current certifications for Catalyst 8000 routers (IOS-XE 17.15 and 17.18) and the virtual Catalyst 8000V.[^niap]
  - Evidence: the manager keeps an audit log of policy and template changes, including API payloads, and the platform exports syslog and IPFIX flow records.[^cs-logs]
  - Microsoft: it is a template-based partner for Microsoft's Global Secure Access.[^ms-partners]
  - Tail latency: forward error correction and packet duplication are documented ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)).

### Palo Alto Prisma SD-WAN with Prisma Access

- **Authorization.** One Moderate listing, "Palo Alto Networks Government Cloud Services" (Class C, January 21, 2021), describes both Prisma SD-WAN and Prisma Access. A separate High listing (Class D, December 9, 2024) does too.[^fr] Palo Alto's own FedRAMP support table, however, marks the SD-WAN controller and Prisma SD-WAN as supported at Moderate only.[^pa-fr]
- **Controller placement.** An on-premises controller is available, including a fully air-gapped installation.[^pa-onprem]
- **Security record.** No KEV entry was found against the Prisma SD-WAN edge (ION) or its controller. The KEV entries for this vendor are against PAN-OS, its firewall operating system.[^kev]
- **Certifications.** The ION branch devices hold active FIPS 140-3 Level 2 certificates, and the controller's module is under test.[^cmvp] NIAP certified the ION devices, vION and the controller together on October 5, 2026.[^niap]
- **Post-quantum.** Palo Alto documents ML-KEM for ION IPsec tunnels and for the edge-to-controller connection. FIPS mode isn't available in the firmware release that adds it.[^pa-pqc]
- **Limits.**
  - The policy-change audit log exports only as CSV.[^pa-logs]
  - In Microsoft's partner list it is a coexistence partner, not an SD-WAN connectivity partner.[^ms-partners]

### Fortinet Secure SD-WAN and FortiSASE

- **Authorization.** No Fortinet listing appears in the FedRAMP data, and Fortinet's federal certifications page doesn't claim one.[^fr][^ft-fed] The FortiManager controller runs on premises.[^ft-fmg]
- **Security record.** The KEV catalog has 21 Fortinet entries since 2024. They include a missing-authentication flaw in FortiManager itself and several FortiOS authentication bypasses.[^kev]
- **Strengths.** FortiGate 7.2 and 7.4 hold an active FIPS 140-3 Level 2 certificate,[^cmvp] and FortiOS documents ML-KEM for IPsec.[^ft-pqc] Without an authorized cloud security service and with that exploitation record, it doesn't fit this program's needs (inference).

### HPE Aruba Networking EdgeConnect

- **Controller and security record.** The Orchestrator can be self-hosted on premises.[^ha-docs] No KEV entry was found against EdgeConnect or Orchestrator.[^kev]
- **Strengths.**
  - The Orchestrator streams audit logs and alarms over syslog, HTTPS or Kafka and exports IPFIX, which is the most complete evidence export documented in this comparison.[^ha-docs]
  - NIAP certified Orchestrator and EdgeConnect 9.4.2 in March 2025.[^niap]
- **Gaps.**
  - No FedRAMP listing for EdgeConnect or HPE's SSE.[^fr]
  - Only historical FIPS certificates; none appears on NIST's in-process lists under the EdgeConnect name.[^cmvp]
- **Ownership.** HPE completed its purchase of Juniper on July 2, 2025, and now owns two SD-WAN product lines. It hasn't published a roadmap for either.[^hpe-8k]

### Arista VeloCloud SD-WAN

- **Ownership.** Arista bought the VeloCloud SD-WAN business from Broadcom (announced July 1, 2025).[^arista-pr]
- **Security record.** CISA added three actively exploited flaws in the on-premises VeloCloud Orchestrator to the KEV catalog in 2026. The latest was added October 23, with a remediation deadline of October 26.[^kev][^ar-adv]
- **Gaps.** No FedRAMP listing, and only historical FIPS certificates.[^fr][^cmvp]

### Juniper Session Smart Router and Mist (HPE Juniper Networking)

- **Authorization and controller.** Juniper Mist is FedRAMP Certified at Class C (Moderate), March 28, 2025, and its listing names the Session Smart Router.[^fr] The on-premises Conductor is still supported, including air-gapped operation.[^jn-docs]
- **Security record and Common Criteria.** No KEV entry was found against the Session Smart Router or Mist,[^kev] and NIAP certified SSR 7.0.1 in March 2026.[^niap]
- **Gaps.**
  - No FIPS 140-3 module for the Session Smart Router.[^cmvp]
  - No post-quantum documentation for it.
  - The same unresolved HPE roadmap question as EdgeConnect.

### Zscaler (security services, Zero Trust Branch)

- **Role.** An SSE choice to pair with an SD-WAN, not a replacement for Book 09's path toolkit (inference).
- **Authorization.** Zscaler Internet Access and Zscaler Private Access each have High (Class D) listings.[^fr] Zscaler says its Zero Trust Branch product is available at Moderate and High, with the High service in limited availability.[^zs-ztb]
- **Telemetry.** Zscaler states that it supports CLAW through Cloud NSS.[^zs-tic]
- **Controller.** Management is cloud-only.

### Microsoft Entra Global Secure Access

- **Availability.** Microsoft says Global Secure Access "is available in the US Government Community Cloud (GCC)" but isn't yet supported in GCC High or DoD.[^ms-limits] It appears among the services in the Azure Commercial Cloud FedRAMP listing (Class D).[^fr]
- **Limits for branches.**
  - Branch tunnels carry Microsoft and internet traffic only.
  - Access to private applications needs the client on the device.
  - Conditional Access applies only where the client is installed.[^ms-limits]
- **Role.** For a GCC tenant it is a reasonable SSE for Microsoft 365 traffic beside any of the SD-WANs above, all of which except Palo Alto, Fortinet and Zscaler are listed partners (inference).[^ms-partners]

### Left out, and why

- **Cato Networks.** It announced in March 2026 that it had started the FedRAMP High process, but it has no Marketplace listing, no FIPS certificate and no NIAP certification.[^cato][^fr] There is no federal authorization path today.
- **Versa Networks** (outside this comparison's requested scope; noted because it appears in Microsoft's and NIAP's lists). Its NIAP evaluation was archived in April 2026, and it has no listing in today's Marketplace data.[^niap][^fr]

## The recommendation (design guidance)

**Build on Cisco Catalyst SD-WAN, the program's existing platform.** This follows the program's standing rule, also applied to [CyberArk for certificate management](cyberark-certificate-lifecycle.md): consolidate on the incumbent rather than add a vendor.

Four reasons:

- Cisco meets more of Book 09's criteria outright than any alternative.
- It is the only platform whose fit to Chapter 11's 12-hub, 1,500-office design is already sized and costed.
- It has both a Moderate-certified hosted controller and a supported on-premises one.
- Its own SSE is certified at High.

Switching would spend the requirements, design and cost work already done to escape a risk that Book 09 already tells the agency how to manage.

The record on Cisco is serious, though, and the choice holds only with these conditions. Each one becomes a Phase 0 exit criterion in [Chapter 11](../books/b09-network/11-field-office-wan-transformation.md):

1. **Run the emergency-directive posture permanently.** Put a firewall in front of the manager, validator and controller with an allow-list of known edge and controller addresses. Isolate the management interface on an administrative network. Keep every control-plane and edge log off the device, in the agency's log platform and in CLAW. Alert on unexpected controller peering and on every successful administrator sign-in. Keep a tested runbook for rebuilding the control plane from patched images. CISA's supplemental direction lists these controls.[^ed-supp] Book 09's test applies: the agency can run the directive's sequence within a day ([Chapter 08](../books/b09-network/08-reference-architecture.md), Decision 4).
2. **Hold a three-day patch lane for the control plane.** Nine exploited controller flaws in nine months means emergency upgrades inside BOD 26-04's shortest window are routine, not exceptional (inference). Keep a staging control plane on the same release train, pre-approve emergency changes, and collect Cisco's diagnostic bundle before every upgrade, as Cisco's advisory directs.[^cs-adv]
3. **Decide controller placement on the record.** On-premises control, as Chapter 11 assumes, keeps the governor inside the agency boundary, but it makes the agency responsible for patching speed and forensics. Cisco's hosted government controller is the alternative, and it isn't exempt from directives either.[^ed2603][^cs-adv] Write the choice down as the controller's boundary disposition ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)).
4. **Close the post-quantum gap in writing.** Record in the M-26-15 migration plan that ML-KEM isn't yet documented in SD-WAN mode.[^cs-pqc] Require a dated vendor commitment, and put post-quantum TLS where it is available in the meantime, at the security service and in applications (inference).
5. **Get the FIPS 140-3 certificate named.** Ask Cisco to name the active certificate that covers the Catalyst 8000 branch routers in SD-WAN mode and the on-premises controllers.[^cmvp] Until it does, record the gap as an accepted risk ([Chapter 10](../books/b09-network/10-the-long-interim.md), action 10).
6. **Choose the security service separately and keep it authorized.** Cisco Secure Access for Government (Class D) is the consolidating choice. Zscaler and Palo Alto Prisma Access are authorized alternatives, and Microsoft Global Secure Access can carry Microsoft 365 traffic in GCC.[^fr][^ms-limits] Whichever is chosen has to meet equal enforcement on every path (R3) and send telemetry to CLAW (R4).

**The strongest alternative is Palo Alto Prisma SD-WAN with Prisma Access.** It is the only option that combines all of these:

- one Moderate FedRAMP listing covering SD-WAN and SASE;
- an air-gapped on-premises controller;
- FIPS 140-3 Level 2 branch devices;
- a NIAP certification that includes the controller;
- documented ML-KEM;
- no exploited vulnerabilities against its SD-WAN edge or controller.[^fr][^pa-onprem][^cmvp][^niap][^pa-pqc][^kev]

Its limits are a Moderate-only SD-WAN at the High level, CSV-only audit export, a gap between post-quantum and FIPS-mode firmware, and the cost of redoing Chapter 11's design.[^pa-fr][^pa-logs][^pa-pqc] HPE Aruba EdgeConnect comes next: a clean record and the best evidence export, but no FedRAMP listing, no current FIPS certificate and an open roadmap question.

**What would reopen the decision (design guidance):**

- another actively exploited, unauthenticated control-plane flaw after the conditions above are in place, or a pilot showing the agency can't patch inside BOD 26-04's window;
- no ML-KEM in SD-WAN mode by the date the agency's M-26-15 plan sets, with fleet rollout beyond the hubs as the natural gate;
- no active FIPS 140-3 certificate covering the branch routers in SD-WAN mode by the end of Chapter 11's Phase 1;
- a further CISA emergency directive on the platform;
- the BOD 26-02 hardware refresh, if it would replace most of the installed base anyway. That is when switching costs least ([Chapter 10](../books/b09-network/10-the-long-interim.md)), so it is the moment to re-run this matrix (inference).

## The risks, stated plainly

- **The platform the program builds on is the one CISA has had to act on.** The conditions reduce the risk; they don't remove it.
- **A FedRAMP certificate doesn't transfer directive obligations.** Whether the controller is hosted or on premises, inventory, collection, patching, hunting and reporting stay with the agency.[^ed2603]
- **Post-quantum and FIPS 140-3 are both open on the branch routers.** Both are dated federal expectations (M-26-15 and the CMVP transition) that the program can document but not yet close on this platform.
- **The comparison isn't priced.** Book 09 Chapter 11 costs only the Cisco line. Alternative costs are unknown.

## What to ask vendors

**Ask every vendor:**

- the active FIPS 140-3 certificate number for the branch device in managed (SD-WAN) mode and for the controller;
- the release and date for ML-KEM on IPsec and on control connections;
- whether NIAP's evaluated configuration includes controller-managed mode;
- the documented path for sending logs to CISA's CLAW;
- how policy-change audit records are exported (syslog, API or stream);
- whether forward error correction and packet duplication work on government-hosted controllers;
- which EIS contractors deliver the product.

**Ask Cisco:**

- a dated SD-WAN-mode ML-KEM commitment;
- the 140-3 certificate covering Catalyst 8200, 8300 and 8500 routers in SD-WAN mode;
- the patch-release cadence it commits to for KEV-listed controller flaws;
- whether Cisco's FedOps team will hand over forensic images within the hours an emergency directive allows.

**Ask Palo Alto:** when Prisma SD-WAN will be supported at FedRAMP High, and whether the audit log can be exported other than as CSV.

**Ask HPE:** the FIPS 140-3 plan for EdgeConnect, any FedRAMP plan, and the roadmap now that it owns both EdgeConnect and the Session Smart Router.

## Status and review

**In review.** Every product fact was checked against a primary source on October 24, 2026.

- **What couldn't be verified:**
  - HPE's claim that Aruba Central is FedRAMP authorized (HPE's pages blocked automated access, and the Marketplace data shows no HPE listing);
  - which FIPS certificate covers Catalyst 8000 routers in SD-WAN mode;
  - Zscaler's audit-log and flow export (its help site renders by script);
  - tail-latency features on platforms other than Cisco;
  - Cato's own pages (blocked by bot protection).
- **Book 09 changes this research suggests:** that [Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md) note the nine 2026 KEV entries and the directive's scope over cloud-hosted controllers; that its FedRAMP table note Palo Alto's Moderate-only SD-WAN; and that Chapter 11's risk register list the post-quantum and FIPS 140-3 asks for its example platform.
- **To move to Proved:** run Chapter 11's ten-site pilot with the six conditions above as exit criteria, and record the evidence here.

Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).


The build on the program's platform is in the companion implementation guide, [Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN](cisco-sdwan-implementation.md).

Related: [Book 09 — Network & Transport](../books/b09-network/index.md), [Appendix B — Requirements Mapping](../books/b09-network/appendix-b-requirements-mapping.md), and [Certificate Lifecycle on CyberArk Certificate Manager](cyberark-certificate-lifecycle.md), the precedent for building on an existing vendor.

[^fr]: FedRAMP Marketplace product data, <https://www.fedramp.gov/marketplace/products.json> (data last changed October 24, 2026; accessed October 24, 2026). Listings: Cisco Catalyst SD-WAN for Government (SDWAN-G), FR2012534927, Class C, certified March 14, 2024; Cisco Security Cloud for Government, FR2304757473A, Class D, August 6, 2026; Palo Alto Networks Government Cloud Services, FR1913470600, Class C, January 21, 2021; GCS-HIGH, FR2317253567, Class D, December 9, 2024; Juniper Mist, FR2102758152, Class C, March 28, 2025; Zscaler Internet Access – Government – High, FR2227062482, Class D; Zscaler Private Access – Government, FR1719759604, Class D; Azure Commercial Cloud, F1209051525, Class D (lists "Global Secure Access" among its services). No listing found for Fortinet, HPE Aruba, Arista or VeloCloud, Cato or Versa.
[^kev]: CISA, Known Exploited Vulnerabilities catalog, JSON feed, catalog version 2026.10.23, <https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json> (accessed October 24, 2026). Entries added January 2024 to October 23, 2026. Cisco Catalyst SD-WAN, 2026: CVE-2026-20127 and CVE-2022-20775 (February 25), CVE-2026-20122, -20128 and -20133 (April 20), CVE-2026-20182 (May 14), CVE-2026-20245 (June 9), CVE-2026-20262 (June 15), CVE-2026-76504 (September 30). Arista VeloCloud Orchestrator: CVE-2026-16812 (July 27), CVE-2026-93952 (September 22), CVE-2026-114625 (October 23, due October 26). Fortinet: 21 entries, including FortiManager CVE-2024-47575 and FortiOS CVE-2024-55591 and CVE-2025-24472. Palo Alto: 12 entries, all PAN-OS or Expedition. No entries found for Prisma SD-WAN ION, HPE Aruba EdgeConnect, Juniper SSR or Mist, Zscaler or Cato.
[^ed2603]: CISA, "V1: ED 26-03: Mitigate Vulnerabilities in Cisco SD-WAN Systems," March 11, 2026 (original February 25, 2026), Required Actions, including "If Off-Prem (cloud) deployments," <https://www.cisa.gov/news-events/directives/v1-ed-26-03-mitigate-vulnerabilities-cisco-sd-wan-systems> and <https://www.cisa.gov/news-events/directives/ed-26-03-mitigate-vulnerabilities-cisco-sd-wan-systems> (accessed October 24, 2026).
[^ed-supp]: CISA, "Supplemental Direction ED 26-03: Hunt and Hardening Guidance for Cisco SD-WAN Systems" (names CVE-2026-20127, CVE-2022-20775, CVE-2026-20133 and CVE-2026-20182; activity "likely began in 2023"; hardening sections D and E), <https://www.cisa.gov/news-events/directives/supplemental-direction-ed-26-03-hunt-and-hardening-guidance-cisco-sd-wan-systems> (accessed October 24, 2026).
[^cs-adv]: Cisco, Security Advisory cisco-sa-sdwan-rpa2-v69WY2SW, CVE-2026-20182 ("This vulnerability affects all deployment types," including On-Prem and Cisco SD-WAN for Government (FedRAMP); collect `request admin-tech` before upgrading; limited exploitation reported May 2026), <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sdwan-rpa2-v69WY2SW> (accessed October 24, 2026).
[^cs-design]: Cisco, *Cisco Catalyst SD-WAN Design Guide* (control components "can be deployed on premises or in the cloud"; Cisco cloud-hosted deployment recommended), <https://www.cisco.com/c/en/us/td/docs/solutions/CVD/SDWAN/cisco-sdwan-design-guide.html> (accessed October 24, 2026).
[^cs-pqc]: Cisco, "Post-Quantum Cryptography for IKEv2," IOS XE 26.1 (hybrid ML-KEM on C8100–C8500 in autonomous mode only), <https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m-pqc-ikev2.html>, and *Quantum-Ready Migration Guide*, <https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/Quantum-Ready-Migration-Guide.html> (accessed October 24, 2026).
[^cs-logs]: Cisco, "Alarms, Events, and Logs," <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/Monitor-And-Maintain/monitor-maintain-book/m-alarms-events-logs.html>, and "Traffic Flow Monitoring" (Cflowd IPFIX), <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/policies/ios-xe-17/policies-book-xe/traffic-flow-monitor.html> (accessed October 24, 2026).
[^cmvp]: NIST Cryptographic Module Validation Program, validated-modules search (Active and Historical), Modules In Process list and Implementation Under Test list, <https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search> (accessed October 24, 2026). Active: Cisco IOS Common Cryptographic Module #5356 and CiscoSSL FIPS Provider #5430; Palo Alto ION devices #5480 (Level 2) and #5393, vION #5500, ION Core Crypto Module #5392; FortiGate 7.2 and 7.4 #5481 (Level 2); Zscaler Java Crypto Module #5080. Historical: Cisco Catalyst 8300 Series Edge Platforms #4461; HPE Aruba EdgeConnect #4541, Silver Peak EdgeConnect #4547 and #4116; VMware SD-WAN #3975 and #3973. In process or under test: Prisma SD-WAN Controller's Cryptographic Module; HPE Juniper SRX380 SD-WAN Gateway.
[^niap]: NIAP, Product Compliant List data, <https://www.niap-ccevs.org/api/project/product/pcl_products_all/> (accessed October 24, 2026). Certified: Cisco 8200–8500 Series Secure Routers, IOS-XE 17.18 (April 9, 2026); Cisco Catalyst 8200/8300/8500 and ASR1K, IOS-XE 17.15 (September 29, 2025); Catalyst 8000V, 17.15 (October 28, 2025); Palo Alto ION, vION and Controller 6.5 (October 5, 2026); HPE Aruba Orchestrator and EdgeConnect 9.4.2 (March 7, 2025); Juniper SSR 7.0.1 (March 30, 2026); FortiGate/FortiOS 7.2 (October 9, 2025). Archived: Versa Secure SD-WAN VOS 22.1 (sunset April 10, 2026).
[^pa-fr]: Palo Alto Networks, "FedRAMP Moderate and High Support" (SD-WAN Controller and Prisma SD-WAN managed by Strata Cloud Manager supported at Moderate, not High), <https://docs.paloaltonetworks.com/fedramp/prisma-sase/fedramp-moderate-and-high-requirements/fedramp-moderate-and-high-support> (accessed October 24, 2026).
[^pa-onprem]: Palo Alto Networks, "Overview of On-Premises Controller" (for regulatory or compliance needs; fully air-gapped installation), <https://docs.paloaltonetworks.com/prisma/prisma-sd-wan/onpremises-controller-for-prisma-sd-wan-deployment-guide/overview-of-on-premises-controller> (accessed October 24, 2026).
[^pa-pqc]: Palo Alto Networks, "Post-Quantum Cryptography Overview," Prisma SD-WAN (ML-KEM-512/768/1024 for IPsec from ION 6.8.1; FIPS mode not available in 6.8.1), <https://docs.paloaltonetworks.com/prisma-sd-wan/administration/prisma-sd-wan-sites-and-devices/prisma-sd-wan-ports-and-interfaces/post-quantum-cryptography-overview> (accessed October 24, 2026).
[^pa-logs]: Palo Alto Networks, Prisma SD-WAN "Audit Logs" (export to CSV), <https://docs.paloaltonetworks.com/prisma-sd-wan/administration/prisma-sd-wan-administrator-authorization-and-authentication/audit-logs> (accessed October 24, 2026).
[^ft-fed]: Fortinet Federal, "Certifications" (no FedRAMP entry), <https://www.fortinetfederal.com/certifications> (accessed October 24, 2026).
[^ft-fmg]: Fortinet, "FortiManager" (hardware, virtual and cloud deployment), <https://www.fortinet.com/products/management/fortimanager> (accessed October 24, 2026).
[^ft-pqc]: Fortinet, *FortiOS 7.6.5 Administration Guide*, post-quantum IPsec (ML-KEM-512/768/1024), <https://docs.fortinet.com/document/fortigate/7.6.5/administration-guide/229631> (accessed October 24, 2026).
[^ha-docs]: HPE Aruba Networking, EdgeConnect developer documentation: "Getting Started" (Orchestrator-as-a-Service or self-hosted on premises) and "Best Practices" (notification service by syslog, HTTP/HTTPS, WebSocket or Kafka; IPFIX), <https://developer.arubanetworks.com/edgeconnect/docs/getting-started> and <https://developer.arubanetworks.com/edgeconnect/docs/best-practices> (accessed October 24, 2026).
[^hpe-8k]: Hewlett Packard Enterprise, Form 8-K, Item 2.01 (completion of the Juniper Networks merger, July 2, 2025), <https://www.sec.gov/Archives/edgar/data/1645590/000114036125024519/ef20051378_8k.htm> (accessed October 24, 2026).
[^arista-pr]: Arista Networks, press release, July 1, 2025 ("Arista acquired the VeloCloud SD-WAN portfolio from Broadcom"), <https://www.arista.com/en/company/news/press-release/21646-pr-07012025> (accessed October 24, 2026).
[^ar-adv]: Arista, Security Advisories 0144, 0183 and 0199 (VeloCloud Orchestrator; "known to be actively exploited"), <https://www.arista.com/en/support/advisories-notices/security-advisory/24364-security-advisory-0144>, <https://www.arista.com/en/support/advisories-notices/security-advisory/24765-security-advisory-0183>, <https://www.arista.com/en/support/advisories-notices/security-advisory/24838-security-advisory-0199> (accessed October 24, 2026).
[^jn-docs]: Juniper Networks, Session Smart Router documentation, "WAN Assurance" (conductor-managed and Mist-managed), <https://www.juniper.net/documentation/us/en/software/session-smart-router/docs/config_wan_assurance/index.html>, and "Upgrade in Restricted Access Environments," <https://www.juniper.net/documentation/us/en/software/session-smart-router/docs/upgrade_restricted_access/index.html> (accessed October 24, 2026).
[^zs-ztb]: Zscaler, "Zero Trust Branch Now Available in FedRAMP Moderate and High" (vendor blog, August 2026), <https://www.zscaler.com/blogs/product-insights/zero-trust-branch-now-available-fedramp-moderate-and-high> (accessed October 24, 2026).
[^zs-tic]: Zscaler, "What Is Trusted Internet Connections (TIC) 3.0?" ("Zscaler supports the CISA Cloud Log Aggregation Warehouse (CLAW) with Cloud NSS"), <https://www.zscaler.com/zpedia/what-is-trusted-internet-connections-tic-3> (accessed October 24, 2026).
[^ms-limits]: Microsoft Learn, "Known limitations for Global Secure Access," sections "Global Secure Access In Government Cloud limitations" and "Remote network limitations," <https://learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations> (accessed October 24, 2026).
[^ms-partners]: Microsoft Learn, "Microsoft's SASE partner ecosystem overview" (template-based SD-WAN partners include Cisco Catalyst, Cisco Meraki, HPE Aruba, Juniper Networks and Arista VeloCloud; coexistence partners Cisco, Netskope, Palo Alto Networks and Zscaler), <https://learn.microsoft.com/en-us/entra/global-secure-access/partner-ecosystems-overview> (accessed October 24, 2026).
[^eis]: GSA, EIS Public Pricer, awarded services report ("Software-Defined Wide Area Network Service (2.8.10)"), <https://eis-public-pricer.eos.gsa.gov/awards/>, and GSA, "Trusted Internet Connections" (SD-WAN service as fully managed, co-managed or do-it-yourself), <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/telecommunications-and-network-services/trusted-internet-connections> (accessed October 24, 2026).
[^cato]: Cato Networks, press release via PR Newswire, March 12, 2026 (initiation of the FedRAMP High authorization process), <https://www.prnewswire.com/news-releases/cato-networks-initiates-fedramp-high-authorization-process-to-accelerate-sase-adoption-and-secure-ai-transformation-across-us-federal-government-302711652.html> (accessed October 24, 2026). Cato's own site blocked automated access.
