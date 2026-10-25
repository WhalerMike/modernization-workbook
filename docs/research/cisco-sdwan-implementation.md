---
title: "Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN"
subtitle: "An implementation guide: the ED 26-03 gate, the hosted-or-on-premises decision, the 12-hub fabric, hardening, TIC 3.0 and Microsoft 365 paths, and the evidence the fabric has to emit"
description: "Research under review: an implementation guide for building Book 09's governed branch transport on Cisco Catalyst SD-WAN. It makes Emergency Directive 26-03 and the Known Exploited Vulnerabilities floor a gate before the fabric carries traffic, recommends the FedRAMP-certified hosted control plane by default, maps the 12-hub field-office design, path classes and egress patterns onto Catalyst constructs, and sets out hardening, certificates, FIPS and Common Criteria status, SSE and Microsoft 365 integration, evidence export, risks and vendor asks, with a read-only example script."
research-status: in review
research-type: implementation guide
research-book: "Book 09"
date-modified: 2026-10-24
last-reviewed: 2026-10-24
---

# Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN {.unnumbered}

[Book 09 — Network & Transport](../books/b09-network/index.md) sets the design: a governor (SD-WAN plus security services) at every branch before any new egress turns on, four branch egress patterns of which one is never allowed, lean and bulk path classes, a 12-hub field-office fabric with 24 consolidated distribution points, and decision records that become boundary-change evidence. [Chapter 11](../books/b09-network/11-field-office-wan-transformation.md) uses Cisco Catalyst edges as its costable example. This guide shows how to build that design on Cisco Catalyst SD-WAN. It also covers the part a build plan usually skips: the same product was the subject of a 2026 emergency directive, so the first gate in the build is proving the control plane is patched, hunted and hardened.

::: {.callout-note}
## An example, not an endorsement
This guide names one product to make Book 09's vendor-neutral design concrete. It isn't an endorsement by any agency, and Book 09's design doesn't depend on this vendor. Every product, directive and certification fact was checked against primary sources on October 24, 2026, and is footnoted. Statements marked *(design guidance)* are the program's recommendations; statements marked *(inference)* are conclusions the sources support but don't state.
:::

**The example code:** [examples/cisco-sdwan on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/cisco-sdwan). It's a read-only Python script that checks every control component against the fixed releases for the directive and the catalog, and exports inventory and audit-log evidence. It's **illustrative: unit-tested against mocked responses, not proven against a live fabric**.

## Watch or download

{{< fmw-video Research_Cisco_SDWAN_Narrated >}}

| Edition | File |
|---|---|
| Video (MP4, 1080p, about 16 minutes) | [Research_Cisco_SDWAN_Narrated.mp4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Research_Cisco_SDWAN_Narrated.mp4) |
| Narrated, self-running deck (about 16 minutes, captions) | [Research_Cisco_SDWAN_Narrated.pptx](../../presentations/research-cisco-sdwan/Research_Cisco_SDWAN_Narrated.pptx) |
| Deck, for presenting live | [Research_Cisco_SDWAN.pptx](../../presentations/research-cisco-sdwan/Research_Cisco_SDWAN.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-cisco-sdwan/Research_Cisco_SDWAN_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-cisco-sdwan/Research_Cisco_SDWAN_Narrated.vtt) |

## What it covers

| Part | Content |
|---|---|
| Orientation | Book 09's terms mapped to Catalyst components; the one decision to make first, a hosted or on-premises control plane |
| Gate 0 | Emergency Directive 26-03, its supplemental hunt and hardening guidance, the nine Catalyst SD-WAN entries in CISA's Known Exploited Vulnerabilities (KEV) catalog, and the software floor they set today |
| Build | The control plane, the 12 hubs, the branch waves and Microsoft 365, mapped to Chapter 11's phases and Chapter 13's sequence; configuration groups, SLA classes, segmentation and NAC |
| Harden | Perimeter, administrative access, certificates and the CLM platform, logging, FIPS 140-3, Common Criteria and STIG status |
| Integrate | TIC 3.0 patterns A to D on Catalyst; Cisco Secure Access for Government and Microsoft Global Secure Access; Microsoft 365 in GCC; Microsoft Sentinel |
| Evidence | Manager APIs mapped to Chapter 05's evidence schema; CISA telemetry; the example script |
| Close | Risks, vendor asks, what couldn't be verified, and the source notes |

## What the research found

Nine findings change how the build is planned:

- **The directive's scope has grown since Book 09 recorded it.**
  - CISA's KEV catalog now lists nine Catalyst SD-WAN vulnerabilities. Six carry Emergency Directive 26-03's mitigation instructions, and three more were added in June and September 2026 under BOD 26-04.[^cs-kev]
  - Cisco has added the Validator to the advisory for the original authentication bypass.[^cs-sa-rpa]
  - Every 2026 advisory lists Cisco's hosted FedRAMP environment among the affected deployment types.[^cs-sa-rpa2]
  - The newest entry, CVE-2026-76504, was added on September 30, 2026, with a three-day due date. It sets today's floor for SD-WAN Manager.[^cs-kev][^cs-sa-webauth]
- **CISA's hardening guidance points federal users at FedRAMP cloud.** The directive's supplemental guidance includes the instruction "Host Infrastructure in GovCloud."[^cs-supp] Chapter 11's cost model assumes an on-premises control plane. This guide recommends Cisco's FedRAMP-certified hosted control plane by default, and says when to choose on-premises instead.
- **CISA expects a static address on every edge.** The supplemental guidance asks for a firewall that admits only known edge, Controller, Validator and Manager addresses, and says agencies "will need to assign static IPs" to every edge.[^cs-supp] That conflicts with zero-touch provisioning from dynamic addresses, and probably with Chapter 11's 5G secondary path. It reinforces Book 09's deterministic-egress action ([Chapter 10](../books/b09-network/10-the-long-interim.md)) *(inference)*.
- **Book 09's control-plane line matches Cisco's sizing.** For 1,500 to 2,000 devices on release 20.18, Cisco specifies a three-node Medium Manager cluster, two Controllers and two Validators.[^cs-sizing] That's seven virtual machines per site, or 14 across two sites, which is the figure in Chapter 11's bill of materials. The cluster's ceiling is 2,000 devices. Chapter 11's fleet of about 1,524 edges uses 76% of it *(inference)*.
- **Cisco's government SSE runs in one region.** Cisco Secure Access for Government is deployed only in US (Virginia), so every office that tunnels to it reaches Virginia.[^cs-csa-region] That makes [Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)'s "the enforcement point has a location" concrete: measure branch-to-PoP latency from the western offices before cutover.
- **Edge certificates from an enterprise CA are new, and only partly automated.**
  - Cisco's Enterprise Certificate option, with EST, SCEP or manual enrollment, arrived in IOS XE 17.18.1a.
  - Automatic renewal covers only onboarding or migration from the factory SUDI certificate. Cisco says later renewals need manual intervention.[^cs-entcert]
  - So Book 09's "certificate-based edge onboarding from the agency PKI" is a build plus a renewal procedure for the CLM platform, not a setting.
- **The FIPS and Common Criteria evidence for controllers is in order; for edges in SD-WAN mode it is a vendor ask.**
  - Control components run FIPS mode by default from release 20.15.1.[^cs-harden] Cisco's letter for release 20.18 cites a FIPS 140-3 module.[^cs-fips-page][^cs-cmvp4747]
  - The current letters for edges don't name SD-WAN (controller) mode, and NIAP's listings for Catalyst 8000 routers don't mention it either.[^cs-fips-page][^cs-niap]
  - TrustSec isn't supported with FIPS mode on.[^cs-trustsec-fips]
- **Microsoft 365 informed network routing is still closed to GCC Moderate, and Cisco's own telemetry can't run on SSE-tunnel sites.** Microsoft's exclusion is unchanged.[^cs-inr] Cloud OnRamp for SaaS telemetry doesn't run on sites that use secure internet gateway tunnels.[^cs-cor] In GCC, path choice rests on the edge's own probes, as Book 09 says.
- **The documented Sentinel path for SD-WAN NetFlow uses an API whose support has ended.**
  - The "Cisco Software Defined WAN" connector sends syslog through the Azure Monitor Agent. NetFlow goes through Logstash with the workspace key, into a table with no data collection rule support.[^cs-sentinel]
  - Microsoft ended support for the HTTP Data Collector API on September 14, 2026, though ingestion continues.[^cs-dcapi]
  - Plan syslog through the agent, and treat the NetFlow path as legacy *(inference)*.

## Orientation: Book 09's design on a Catalyst fabric

Catalyst SD-WAN has four parts. Cisco's FedRAMP listing describes them in the same words Book 09 uses for the governor:[^cs-fr]

| Book 09 term | Catalyst component (former name) | What it does | Where it sits |
|---|---|---|---|
| Manager | SD-WAN Manager (vManage) | Management plane: configuration, policy authoring, monitoring, the REST API | Hosted, or a three-node cluster per data center |
| Validator | SD-WAN Validator (vBond) | Orchestration: first-line authentication of edges, NAT traversal | Hosted, or two per data center |
| Controller | SD-WAN Controller (vSmart) | Control plane: routes and centralized policy to every edge over OMP | Hosted, or two per data center |
| Branch edge, hub edge | WAN edge on IOS XE in controller mode (Catalyst 8200L, 8200, 8300, 8500L in Chapter 11's BOM) | Data plane: overlay tunnels, application-aware routing, local enforcement | Every office and hub; always agency equipment |

Cisco renamed the components from release 20.12.1 and IOS XE 17.12.1a; older documents and the directive itself still use the v-names.[^cs-sa-rpa]

Chapter 11's estate maps onto it like this *(design guidance)*:

| Chapter 11 element | Catalyst build |
|---|---|
| 1,500 offices, tiers S, M and L | One edge per office, on Chapter 11's models; HSECK9 licenses wherever encrypted throughput exceeds 250 Mbps (Chapter 11) |
| 12 hubs: 2 data centers and 10 regional hubs | A high-availability pair of C8500L edges at each hub, hub-and-spoke topology from each office to its regional hub and to a secondary hub |
| SD-WAN control plane, primary and secondary | Hosted (SDWAN-G), or a Manager cluster, two Controllers and two Validators at each data center |
| Lean and bulk path classes | Application-aware routing SLA classes, plus data policy that keeps bulk traffic off the 5G path |
| Patterns A, C and D; never B | Data policy and SSE tunnels; see [TIC 3.0, SSE and Microsoft 365](#tic-3.0-sse-and-microsoft-365) |
| Decision records | Derived from Manager's APIs; see [Evidence and telemetry](#evidence-and-telemetry) |

### The decision to make first: hosted or on-premises

Cisco offers on-premises control components, Cisco-hosted fabrics, and **Cisco SD-WAN for Government**, its FedRAMP environment.[^cs-sa-rpa] The FedRAMP Marketplace lists it as follows:[^cs-fr]

- **Listing:** "Cisco Catalyst SD-WAN for Government (SDWAN-G)," package FR2012534927.
- **Status:** FedRAMP Certified, Class C (Moderate), agency path, certified March 14, 2024, with five agency authorizations.
- **Next ongoing certification report:** February 22, 2027.
- **Secure-configuration guidance:** Cisco's Catalyst SD-WAN Hardening Guide.

Cisco's government guide adds:[^cs-gov]

- The boundary is in AWS GovCloud (US).
- A Cisco federal operations team maintains and monitors it.
- Customers manage their overlay through the SD-WAN Portal, allow trusted IP addresses there, and have no access to the AWS boundary.
- FedRAMP compliance requires Manager 20.12.1.1 and IOS XE 17.9.1a or later.

**Recommendation: build on SDWAN-G unless one of the on-premises triggers below applies** *(design guidance)*. Four reasons:

1. **CISA's guidance points there.** The directive's own hardening guidance says federal organizations should move to FedRAMP-compliant cloud infrastructure.[^cs-supp]
2. **Cisco patches the control plane.** Nine known-exploited vulnerabilities in eight months, several with three-day due dates, is a patch tempo few agency network teams can hold on their own controllers.[^cs-kev] For CVE-2026-76504, Cisco fixed its Cisco-managed cloud release with no user action needed.[^cs-sa-webauth] Whether the government environment had the same treatment isn't stated (vendor ask 1).
3. **It answers Chapter 05's boundary question.** The controller's boundary disposition becomes an inherited, certified service rather than a new component in the agency's package.
4. **It removes the 14-VM build.** Chapter 11's on-premises control-plane line goes away. It's replaced by a subscription the cost model doesn't yet price (vendor ask 3).

Hosting doesn't remove the gate. Every 2026 advisory lists the FedRAMP environment as affected.[^cs-sa-rpa2] The directive tells agencies with cloud-hosted fabrics to ask Cisco for forensic images and AWS network logs.[^cs-ed2603] And CISA requires agencies with cloud-hosted SD-WAN to participate in CISA's Comprehensive Log Aggregation Warehouse (CLAW), including the AWS logs.[^cs-supp] The edges, the logs, the Portal allow-lists, administrator roles and single sign-on stay the agency's.

**Choose on-premises** when any of these holds *(design guidance)*:

- The system is High impact, or must run isolated from the internet. SDWAN-G is certified at Moderate.
- The authorizing official requires agency custody of forensic images.
- Cisco can't commit to KEV due dates for the government environment.

On-premises, the sizing for 1,500 to 2,000 devices on release 20.18 is:[^cs-sizing]

| Component | Count | Each |
|---|---|---|
| Manager cluster ("Three Node Medium") | 3 | 32 vCPU, 64 GB RAM, 1 TB storage; up to 2,000 devices per cluster |
| Controllers | 2 | 8 vCPU, 16 GB RAM; covers 1,000 to 2,500 devices |
| Validators | 2 | 4 vCPU, 8 GB RAM; covers 1,000 to 4,000 devices |

Cisco's disaster-recovery design runs an active Manager cluster in one data center and a standby cluster in a second.[^cs-dr] Beyond 2,000 devices, Cisco's sizing says to deploy multiple overlays.[^cs-sizing] Plan the growth trigger now: about 476 more edges, whether new offices or cloud gateways, would need a second overlay *(inference)*.

## Gate 0: Emergency Directive 26-03 and the KEV floor

Book 09 puts a step zero in front of every other step: bring the governor under vulnerability management, privileged-access control and off-box logging before it carries production traffic ([Chapter 13](../books/b09-network/13-sequencing-cost-and-evidence.md)). On Catalyst SD-WAN, step zero has a concrete definition, because CISA wrote one.

### What the directive requires

CISA issued **ED 26-03, *Mitigate Vulnerabilities in Cisco SD-WAN Systems***, on February 25, 2026. Version 1, updated March 11, 2026, supersedes the original required actions and adds a log-delivery action and a fourth report.[^cs-ed2603]

- **Scope.** It covers Catalyst SD-WAN Manager "regardless of configuration" and Catalyst SD-WAN Controller, on federal information systems managed on agency networks or hosted by third parties on an agency's behalf.
- **Order.** The actions "MUST be taken in the identified order":

| # | Action | Original deadline |
|---|---|---|
| 1 | **Identify** every in-scope system and send the inventory to CISA on its template | 11:59 PM ET, February 26, 2026 |
| 2 | **Collect.** Store logs outside the SD-WAN, centrally. Take an admin-tech dump (parts of `/opt` and `/var`), a copy of `/home`, and external syslogs. On-premises, add a virtual disk and memory snapshot and firewall, switch and router logs. Cloud-hosted, ask Cisco for the snapshot and the AWS network logs. **And** send all Cisco SD-WAN syslog, past, current and future, plus other applicable cloud logs, to CISA through CLAW | February 26, 2026; CLAW by March 23, 2026 |
| 3 | **Update** to Cisco's fixed releases | 5:00 PM ET, February 27, 2026 |
| 4 | **Hunt** using the supplemental guidance. If a root account is compromised, report it to CISA and rebuild Manager, Controller and Validator from patched images, then migrate the edges | — |
| 5 | **Harden** using the supplemental guidance | Report by March 12, 2026 |
| 6 | **Report** a summary, a detailed inventory with actions and results, hardening actions, and log delivery | February 26, March 5, March 12 and March 23, 2026 |

The directive page still calls CLAW by its older name, "Cloud Logging Aggregation Warehouse"; [Chapter 03](../books/b09-network/03-what-tic-3-requires.md) explains the rename. The deadlines are past. The page isn't marked closed, and whether a fabric deployed after March 2026 must report under it is a question for CISA (vendor ask 12). The program's position is that a new deployment performs the same sequence anyway, because it's the best published definition of a clean control plane *(design guidance)*.

The **supplemental hunt and hardening guidance** gives the background:[^cs-supp]

- CVE-2026-20127 was exploited as a zero-day.
- The attacker's rogue device "appears as a new, temporary, and legitimate SD-WAN component."
- Partners observed lateral movement and the clearing of logs and history.
- Activity "likely began in 2023," so hunts should reach back that far.

Its hunt checklist has six parts:

- A. Software downgrades and unexpected reboots.
- B. Application reversion within 15 minutes of a downgrade.
- C. Rogue peering, by peer type, by peer-system-IP outliers, by a remote color of `(null)` or `{28 0}`, and by validating every peered edge in the Manager UI.
- D. SSH abuse through `vmanage-admin`'s authorized keys.
- E. Root sign-ins and new accounts.
- F. Cleared logs and shell histories.

The guidance draws on the joint *Cisco SD-WAN Threat Hunt Guide* that CISA wrote with the Australian Signals Directorate's ACSC and other partners.

### The nine KEV entries and their fixes

| CVE | What it is | In KEV | Advisory, and first fixed releases on supported trains |
|---|---|---|---|
| CVE-2026-20127 | Authentication bypass to administrative privileges; affects Controller, Manager and Validator | Feb 25, 2026 | `cisco-sa-sdwan-rpa-EHchtZk`: 20.9.8.2, 20.12.5.3 or 20.12.6.1, 20.15.4.2, 20.18.2.1[^cs-sa-rpa] |
| CVE-2022-20775 | CLI path traversal to root; Cisco saw attempted exploitation in February 2026 | Feb 25, 2026 | `cisco-sa-sd-wan-priv-E6e8tEdF`: 20.6.3, 20.7.2, 20.8.1; 20.9 and later not affected[^cs-sa-2022] |
| CVE-2026-20122, CVE-2026-20128, CVE-2026-20133 | Manager arbitrary file overwrite, recoverable credential file, information disclosure; exploited from March and April 2026 | Apr 20, 2026 | `cisco-sa-sdwan-authbp-qwCX8D4v`: 20.9.8.2, 20.12.5.3 or 20.12.6.1, 20.15.4.2, 20.18.2.1[^cs-sa-authbp] |
| CVE-2026-20182 | Second authentication bypass; affects Controller, Manager and Validator | May 14, 2026 | `cisco-sa-sdwan-rpa2-v69WY2SW`: 20.9.9.1, 20.12.5.4, 20.12.6.2 or 20.12.7.1, 20.15.4.4 or 20.15.5.2, 20.18.2.2, 26.1.1.1[^cs-sa-rpa2] |
| CVE-2026-20245 | Privilege escalation to root from `netadmin`, or by chaining the two bypasses; Cisco saw configuration pushed to edges | Jun 9, 2026 | `cisco-sa-sdwan-privesc-4uxFrdzx`: 20.9.9.2, 20.12.7.2, 20.15.4.5 or 20.15.5.3, 20.18.3.1, 26.1.1.2[^cs-sa-privesc] |
| CVE-2026-20262 | Manager arbitrary file write | Jun 15, 2026 | `cisco-sa-sdwan-arbfw-c2rZvQ`: 20.9.9.2, 20.12.7.2, 20.15.4.5 or 20.15.5.3, 20.18.3.1, 26.1.1.2[^cs-sa-arbfw] |
| CVE-2026-76504 | Manager API authentication bypass through URI encoding | Sep 30, 2026 (due Oct 3) | `cisco-sa-sdwan-webauth-xr8beuuU`: 20.9.10.1, 20.12.8.2, 20.15.6.1, 20.18.4.1, 26.1.2.1, 26.2.1[^cs-sa-webauth] |

Sources: KEV catalog version 2026.10.23.[^cs-kev] Trains 20.10, 20.11, 20.13, 20.14 and 20.16 have no fix of their own; Cisco's tables say migrate.[^cs-sa-rpa][^cs-sa-authbp]

Reading those tables together gives **today's floor for control components** *(inference; re-read the advisories at build time)*:

| Train | SD-WAN Manager at or above | Controller and Validator at or above |
|---|---|---|
| 20.9 | 20.9.10.1 | 20.9.9.2 |
| 20.12 | 20.12.8.2 | 20.12.7.2 |
| 20.15 | 20.15.6.1 | 20.15.5.3 (or 20.15.4.5 on the 20.15.4 branch) |
| 20.18 | 20.18.4.1 | 20.18.3.1 |
| 26.1 | 26.1.2.1 | 26.1.1.2 |
| 26.2 | 26.2.1 | Not listed in three advisories; confirm with Cisco (vendor ask 4) |

The edges have their own catalog entries on IOS XE: the web UI pair CVE-2023-20198 and CVE-2023-20273, and the SNMP flaw CVE-2025-20352.[^cs-kev] Keep the HTTP server off on every edge, run SNMPv3 only behind an access list, and track IOS XE advisories as a separate feed *(design guidance)*.

### The gate, as a checklist

The fabric carries no production traffic until every line is closed and evidenced *(design guidance)*:

1. Inventory every control component and edge, with release, serial and site. In the example script, `fleet_inventory` records feed CM-8 and SI-2.
2. Run every control component at or above the floor. The example script's `ed-26-03-gate.csv` must show no `fail` or `confirm` rows.
3. Run the six-part hunt and keep the artifacts. On a rebuild, start from patched images, with new administrator accounts and unique credentials.[^cs-supp]
4. Store logs off-box in the SIEM, and confirm SD-WAN syslog is reaching CLAW.
5. Close the hardening checklist below.
6. Record CISA's answer on reporting.

Re-run lines 1 and 2 on every KEV addition and on each Cisco publication day. Since July 2026, Cisco publishes hardening releases and advisories on the first and third Wednesday of each month, with seven days' advance notice. It still releases out of cycle for active exploitation, and it groups bugs that share a weakness under "umbrella" CVEs.[^cs-cadence] That cadence is the intake for BOD 26-04's change windows ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)). Cisco's Live Protect shields can cover the gap until an upgrade, but Cisco calls them "temporary partial protection."[^cs-sa-privesc]

## Build phases mapped to Book 09

Chapter 11's roadmap and Chapter 13's sequence, with the Catalyst work and the evidence each step leaves *(design guidance)*:

| Book 09 phase or step | Catalyst build | Evidence it leaves |
|---|---|---|
| Step 0 (Ch13), Gate 0 above | Patch to the floor, hunt, harden, log to the SIEM and CLAW, SSO and roles | Gate CSV, hunt artifacts, hardening record, CLAW confirmation |
| Phase 0, months 0–6 (Ch11) | Decide hosted or on-premises and record the boundary disposition (Ch05); set the release baseline; build the fabric in the Portal or the 14 VMs; run the ten-site pilot across tiers and transports; run the paired-branch study (Ch13); start the three-party CLAW coordination; plan static edge addresses, including the 5G path | Authorization for regional breakout; 30 days of pilot stability; paired-branch effect size |
| Step 1, buy the pipe (Ch13) | Order DIA circuits with static addressing and documented path diversity; HSECK9 licenses where encrypted throughput exceeds 250 Mbps | Per-site latency and loss measured before the order |
| Phase 1, months 6–18 | Build the 12 hubs: C8500L pairs, hub tunnels to the SSE, and the 24 distribution points on their own servers; build configuration groups and policy groups; set SLA classes from the pilot's measurements | Hubs in production; replacement telemetry confirmed for the pilot sites |
| Steps 2 and 3, governor before traffic, boundary change before cutover (Ch13) | No site gets a local-internet action until its SSE tunnel is up and logging, and its boundary change is approved | Approved boundary change dated before cutover; the PEP named per path class |
| Phase 2, months 18–48 | Office waves at MPLS renewal: plug-and-play onboarding against the authorized serial list, overlay, cutover; MPLS retired per office only after CLAW parity for that office (Ch03, Ch11) | Per-office CLAW confirmation; the failover test record per site class |
| Phase 3, months 36+ | Microsoft 365 direct path through data policy and Cloud OnRamp categories (no INR in GCC); Connected Cache at the hubs on its own hosts | The SC-7(4) exception instruments (Appendix A); the five retirement gates, tracked as Chapter 11 states them |

Two Catalyst specifics belong in Phase 0:

- **Release baseline.** Choose **release 20.18 on the control components with IOS XE 17.18 on the edges**, at or above the floor *(design guidance)*. That train combination has:
  - the JWT API (20.18.1)[^cs-api-auth]
  - automated private-access tunnels to Cisco Secure Access (20.18.2)[^cs-csa-commercial]
  - Manager as the hub for Cisco ISE (20.18.2)[^cs-firewall]
  - the Enterprise Certificate option (17.18.1a)[^cs-entcert]
  - a Cisco FIPS letter for the 20.18 control components[^cs-fips-page]
  - a NIAP listing for Catalyst 8000 hardware on 17.18[^cs-niap]

  Cisco publishes no "recommended release" statement on the pages reviewed, and SDWAN-G's available trains weren't stated (vendor ask 3).
- **Configuration groups, not device templates.** Cisco recommends migrating from device and feature templates to configuration groups and policy groups. A device can't be on both. Some features, including Cloud OnRamp for SaaS and TrustSec, still need legacy templates or a CLI profile.[^cs-cfggroups] Decide which features force a template before building 1,500 sites on either model.

Upgrades follow Cisco's documented procedure for each train hop, with disaster recovery paused, and confirmed paused, before the Manager cluster is upgraded.[^cs-upgrade] Check each hop against Cisco's upgrade and compatibility matrices.

## Policy: path classes and lane discipline

Book 09's lean and bulk classes ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md), [Chapter 08](../books/b09-network/08-reference-architecture.md)) map onto application-aware routing:[^cs-aar]

- **SLA classes** set thresholds for loss (1–100%), latency and jitter (1–1,000 ms).
- **Platform limits.** Most edges support six user-defined classes; the Catalyst 8300 supports seven and the 8500 fifteen, from 17.6.1a.
- **Defaults from 17.15.1a** (loss %, latency ms, jitter ms): Voice-And-Video 2, 300, 60; Transactional Data 1, 200, 200; Bulk Data 5, 500, 500.
- **Path probes** are BFD: 1-second hellos, a 10-minute poll interval and a multiplier of 6.
- **When no path meets the SLA**, fallback-to-best-path, preferred and backup preferred colors, and strict mode decide what happens.

| Book 09 class | Catalyst construct *(design guidance)* |
|---|---|
| Lean: consensus, clock synchronization, voice, sign-in, interactive | A custom SLA class with thresholds taken from the pilot's measured baseline, not the defaults; preferred color the DIA circuit, backup the 5G path; FEC and packet duplication on dual-circuit sites (Chapter 05 cites Cisco's FEC and duplication pages) |
| Bulk: backups, patch and content waves, re-sync | The Bulk SLA class on the DIA color only, with a data policy that excludes the 5G color; QoS so bulk can't queue ahead of the lean class |
| Path parity (TIC 3.0) | Every color that can reach the internet lands on the same SSE policy, so no path has less rigor ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)) |

**Lane discipline** holds on Catalyst too. The program observes, reconciles and emits evidence; Manager and the Controllers route and enforce. The example script is read-only for that reason.

**Topology.** Hub-and-spoke from each office to its regional hub, with a second hub as fallback, is the base design. Cisco's Multi-Region Fabric is an option: regional hubs become border routers into a core region, and the core-region Controllers "must be dedicated/exclusive." Cisco's FAQ for it dates from June 2024 and recommends 20.9/17.9, so read it as dated.[^cs-mrf] Adopt it only if the pilot shows a need *(design guidance)*.

## Segmentation and network access control

Use VPN 0 for transport and VPN 512 for management, out of band.[^cs-harden] Map service VPNs to [Chapter 07](../books/b09-network/07-network-access-control.md)'s admission segments *(design guidance)*:

| Chapter 07 segment | Service VPN treatment |
|---|---|
| Production | Corporate service VPN; reaches the hubs and the SSE |
| Remediation | Separate VPN that reaches only management, update and antivirus endpoints |
| Quarantine | Local only, with no route into the overlay |
| IoT and OT | Separate VPN reaching only each class's management systems |
| Guest | DIA through the SSE only, with no route to agency resources |

Cisco ISE fits in two ways:

- **Security group tags.** Edges carry SGTs inline from TrustSec switches, or learn them over SXP from ISE, from IOS XE 17.3.1a.[^cs-trustsec]
- **Identity-based firewall.** Edge firewall rules can use ISE users and groups through pxGrid from 17.9.1a. From 20.18.2/17.18.2, SD-WAN Manager acts as the hub for ISE, which needs ISE 3.2 or later.[^cs-firewall]

Cisco says TrustSec isn't supported with FIPS mode on.[^cs-trustsec-fips] If the edges must run in FIPS mode, segment by VPN and leave SGT enforcement to the access switches *(design guidance)*. Chapter 07's posture and Change of Authorization design doesn't depend on the WAN edge.

## Hardening

The checklist joins CISA's supplemental hardening guidance[^cs-supp] to Cisco's Catalyst SD-WAN Hardening Guide (revision 1.1, February 9, 2026)[^cs-harden], keyed to Chapter 05's table of controls owed to the governor:

| Area | Setting | Source | SP 800-53 anchor |
|---|---|---|---|
| Perimeter, on-premises | Control components' VPN 0 in a DMZ behind a firewall with 1:1 NAT; VPN 512 on an isolated management VLAN, never routed through the DMZ or internet | Cisco, CISA | SC-7(5) |
| Control-plane ports | UDP 12346 to the Validator and Manager. UDP 12346 and TCP 23456 to the Controllers and Manager, plus port-hopping offsets and +100 per additional core. NETCONF TCP 830 only from Manager to the Controllers and Validators. SSH 22 and HTTPS 443 only from jump hosts | Cisco | SC-7(5) |
| Source allow-list | Admit only known edge, Controller, Validator and Manager addresses; static addresses on every edge. Cisco notes zero-touch onboarding or dynamic edge addresses need "any" on the Validator's UDP 12346; that is the trade to close before Phase 2 | CISA, Cisco | IA-3, CM-8 |
| Perimeter, hosted | Portal inbound rules for SSH, HTTPS and custom ports, never "ALL," up to 200 per fabric; edges are admitted by authorized serial number over mutually authenticated DTLS | Cisco | SC-7(5), CA-3 |
| Administrative access | Jump hosts with MFA; single sign-on to Manager through the agency IdP, with phishing-resistant MFA enforced in Conditional Access *(design guidance)*; custom least-privilege roles scoped by site, device or template, and `netadmin` held to a named few | Cisco | IA-2(1), AC-6(9) |
| Device CLI | AAA order TACACS+ or RADIUS first, local last; SSH keys only, RSA 2048 to 4096; weak SSH algorithms disabled | Cisco | AC-6, IA-2 |
| Sessions | Client, server and CLI inactivity timeouts of 5 minutes (Cisco's defaults are 30 minutes); maximum sessions per role as low as operations allow | CISA, Cisco | AC-12, SC-10 |
| Control and data plane | DTLS for Manager connections; SNMPv3 only; **pairwise IPsec keys** rather than Controller-distributed keys; enhanced ESP with AES-GCM-256; DH groups 1, 2 and 5 are gone from 17.11.1a | CISA, Cisco | SC-8, SC-23 |
| Credentials | High-security password policy (15 to 32 characters); account lockout; type 6 encrypted passwords in configuration groups; configuration-database default credentials replaced | Cisco | IA-5 |
| Manager web certificate | Replace the self-signed certificate with one from the enterprise root CA | CISA, Cisco | SC-17 |
| Logging | Syslog over TLS to the SIEM, off-box; audit-log retention sized with Manager's estimate API; SIEM alerts on Manager or Controller peering (`peer-type:vmanage` or `peer-type:vsmart` with `new-state:up` from an unknown public IP) and on `Authentication succeeded for` matched to authorized users, with any root sign-in treated as compromise | CISA, Cisco | AU-6, AU-9 |
| Root account | Root has no password hash (`*`) and `PermitRootLogin` is no; verify both as part of the hunt | CISA | AC-6 |

Book 09's directives still apply around it: BOD 23-02 for management interfaces, BOD 26-02 for end-of-support edges, and BOD 26-04 for remediation windows ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md), [Chapter 10](../books/b09-network/10-the-long-interim.md)).

### Certificates and the CLM platform

Out of the box, Catalyst SD-WAN trusts certificates from Cisco's PKI. Control components and cloud edges use Cisco PKI, and hardware edges use the SUDI certificate in their trust chip. Edges join only if their serial number is on the authorized WAN edge list that Manager sends to the Controllers.[^cs-bringup][^cs-entcert] Cisco no longer sponsors Symantec/DigiCert certificates for control components.[^cs-certpdg]

From IOS XE 17.18.1a, Cisco's **Enterprise Certificate** setting lets the agency's own CA issue certificates to control components and to hardware and software WAN edges:[^cs-entcert]

- It's set in Manager under Administration > Settings > Trust and Privacy > Certificates Settings.
- Enrollment is manual, EST or SCEP.
- Automatic renewal applies to initial onboarding, or to migration from SUDI to an enterprise certificate. "For subsequent renewals, manual intervention is required" when an expiry alarm fires.

That's how Book 09 reaches its "certificate-based edge onboarding from the agency PKI" ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)) and its CLM row for SD-WAN edge certificates ([Chapter 07](../books/b09-network/07-network-access-control.md#certificates-and-the-clm-platform)). Three items close it *(design guidance)*:

1. Issue from the retained AD CS through the CLM platform ([Book 07](../books/b07-pki/index.md)).
2. Have the CLM platform inventory edge and controller certificates from Manager's API.
3. Write the renewal as a runbook triggered by Manager's expiry alarm, until Cisco documents an automated path (vendor ask 7).

The Manager web certificate is a separate certificate-signing-request flow.[^cs-harden]

### FIPS 140-3, Common Criteria and STIGs

| Item | Status, October 24, 2026 |
|---|---|
| FIPS mode, control components | On by default from release 20.15.1;[^cs-harden] on by default in SDWAN-G, verified with `show sdwan security-info`[^cs-govsec] |
| FIPS module, control components | Cisco's December 10, 2025 letter for Manager, Validator and Controller 20.18 cites Cisco FIPS Object Module 7.3a, **CMVP #4747**, FIPS 140-3, active, sunset July 31, 2029[^cs-fips-page][^cs-cmvp4747] |
| FIPS modules, edges | IOS Common Cryptographic Module **CMVP #5356** (FIPS 140-3, active, sunset August 6, 2029; vendor-affirmed for Catalyst 8200, 8200L, 8300, 8500 and 8500L on IOS XE 17.12)[^cs-cmvp5356] and CiscoSSL FIPS Provider **#5430** (active, sunset November 17, 2029)[^cs-cmvp5430]; Cisco's current letters for these platforms on 17.18 and 26.1 don't name SD-WAN mode. Only archived letters, citing FIPS 140-2 certificates now on the Historical list, did[^cs-fips-page] |
| FIPS mode, edges | Cisco's IOS XE 17.x security guide shows example edge output with `fips-mode Disabled`, and this research found no documented procedure for enabling it on edges (vendor ask 5)[^cs-secparams] |
| Common Criteria (NIAP) | Catalyst 8200, 8300, 8400 and 8500 Secure Routers (G2 hardware) on IOS XE 17.18, certified April 9, 2026; Catalyst 8200, 8300 and 8500 with ASR 1000 on 17.15, certified September 29, 2025, maintained to 17.18; protection profiles NDcPP 3.0e, VPN Gateway 1.3, MACsec 1.0 and SSH 1.0. No Cisco SD-WAN product is listed, and the router listings don't mention controller mode[^cs-niap] |
| Common Criteria (other) | Cisco lists "Cisco cEdge Routers running IOS XE 17.12 with SD-WAN 20.12," EAL2+, certified December 18, 2024, expiring December 18, 2029; the certificate was issued under the Canadian scheme, with no protection profile claimed[^cs-cc] |
| DISA STIGs | No SD-WAN STIG exists. The Cisco IOS XE Router NDM STIG V3R7 (April 1, 2026) and RTR STIG V3R5 (October 1, 2025) are written for IOS XE and don't mention SD-WAN mode; use them as a reference baseline for edges, not as a checklist an assessor will expect to match *(inference)*[^cs-stig] |

For Chapter 10's requirement that acquisitions state a FIPS 140-3 expectation, the honest statement today has two halves:

- The control plane's module is validated under FIPS 140-3.
- Validation of the edges in SD-WAN mode is a written vendor commitment to obtain before award *(design guidance)*.

Chapter 11's BOM names first-generation models (C8200L-1N-4T, C8200-1N-4T, C8300-1N1S-4T2X). The 17.18 NIAP listing covers G2 hardware. Confirm which listing covers which model (vendor ask 6).

## TIC 3.0, SSE and Microsoft 365

Cisco's own *TIC 3.0 Architecture Guide* (October 2021) covers the Traditional, Branch Office and Remote User use cases. Its branch patterns are backhaul through the campus, direct cloud access and direct internet access, with security on the SD-WAN routers.[^cs-tic] It predates the September 2026 Branch Office Use Case that Book 09 relies on, and doesn't mention SASE or Cisco Secure Access, so build to Book 09's reading of the current use case rather than to the vendor guide *(inference)*.

### Book 09's patterns on Catalyst

*(design guidance)*

| Pattern ([Chapter 08](../books/b09-network/08-reference-architecture.md)) | Catalyst build |
|---|---|
| A. Hairpin | Data policy sends internet-bound traffic over the overlay to the regional hub, which breaks out through the hub's SSE tunnel. This is the starting state for every office and the fallback if the SSE is unreachable |
| B. Bare local breakout | Never. No site carries a local-internet action except to an SSE tunnel or a documented Optimize exception; audit the policy group for it on each change |
| C. Governed local breakout (the reference pattern) | Automatic IPsec tunnels from each edge to Cisco Secure Access for Government, or to another SSE through the generic SIG tunnel. Microsoft 365 Optimize traffic goes direct only under the SC-7(4) exception ([Chapter 12](../books/b09-network/12-microsoft-365-traffic.md)) |
| D. Agent-delivered SASE | The SSE's endpoint agent (Cisco's client for Secure Access, or the Global Secure Access client) carries policy; the edge is transport and path telemetry. The edge still keeps agentless devices on Pattern A or C |

### Cisco Secure Access for Government

**Listing.** The FedRAMP Marketplace lists Cisco Security Cloud for Government (FR2304757473A) as FedRAMP Certified, Class D (High), certified August 6, 2026. It covers Umbrella for Government and Secure Access for Government, and integrates with CISA's Protective DNS.[^cs-fr]

**Setup.** Cisco's government help center documents automatic tunnels "from a Catalyst SD-WAN branch."[^cs-csa-gov]
- Credentials go into SD-WAN Manager under Cloud Credentials: the organization ID, an API key and a secret.
- The integration was tested on 20.15/17.15 with ISE 3.1 or later.

Plan around three constraints:[^cs-csa-region]
- The service runs in one region, US (Virginia).
- Tunnel MTU must be 1,390 bytes or less, and fragmented packets are dropped.
- Cisco's commercial guides add limits the government pages don't restate:[^cs-csa-commercial]
  - Automated tunnels need 20.15.1/17.15.1, and Manager handles up to eight tunnel pairs.
  - Private-access automation needs 20.18.2/17.18.2 and is "on controlled availability," enabled through TAC.

  Whether the government service needs the same TAC step isn't stated (vendor ask 8).

**Umbrella for Government.** Its current guide lists no Catalyst SD-WAN section, and its old automatic-tunnel page redirects. Treat Secure Access for Government as Cisco's SSE path for this design *(inference)*.

The single region is a physics problem as well as a resilience one. A western office that tunnels to Virginia pays the round trip [Chapter 01](../books/b09-network/01-why-physics-decides-the-architecture.md) prices. Either measure it and accept it in the pilot, or choose an SSE with PoPs near each office cluster ([Chapter 05](../books/b09-network/05-sd-wan-sase-and-governed-transport.md)). The SD-WAN build doesn't depend on which SSE is chosen.

### Microsoft Global Secure Access as the SSE

**Availability.** Microsoft says Global Secure Access is available in GCC, but not in GCC High or DoD.[^cs-gsa-limits]

**Cisco as a partner.** Microsoft lists "Cisco Catalyst" as a template-based remote-network partner.[^cs-gsa-partners] Cisco's integration guide uses the generic SIG tunnel and says that only the Microsoft 365 traffic forwarding profile can be selected.[^cs-msse]

**Remote-network limits:**[^cs-gsa-limits]
- Remote networks carry the Microsoft and Internet Access profiles, not Private Access.
- Conditional Access applies only to users running the client.
- Custom Bypass doesn't work.
- There's a limit of 200 remote networks per tenant.

So a Catalyst edge can deliver branch Microsoft 365 traffic to Microsoft's SSE. It isn't a full Pattern C to Global Secure Access, and Chapter 12's tenant-restriction analysis still governs *(inference)*.

### Microsoft 365 in GCC

**Informed network routing.** Microsoft's page still says it supports worldwide commercial tenants "but not the GCC Moderate, GCC High, DoD" clouds. Cisco IOS XE SD-WAN 20.4/17.4 or later is the one listed partner.[^cs-inr]

**Cloud OnRamp for SaaS:**[^cs-cor]
- It can steer Microsoft 365 by Microsoft's categories (Optimize, Optimize and Allow, or All).
- Microsoft's feedback telemetry starts at 17.4.1a/20.4.1.
- The telemetry can't run on sites that use SIG tunnels.

In GCC, then, Microsoft 365 path choice rests on the edge's own probes, and a Pattern C site loses the telemetry anyway. Book 09's position stands: direct breakout for Optimize traffic under its own exception, application-aware routing on measured paths, and QoS on the overlay ([Chapter 11](../books/b09-network/11-field-office-wan-transformation.md), [Chapter 12](../books/b09-network/12-microsoft-365-traffic.md)).

### DNS

The edge's DNS security policy can redirect queries to Umbrella or to a custom DNS server per VRF. Local domain bypass sends listed domains "to the specified DNS server without redirecting" them: up to 64 domains, UDP only, and A, AAAA and TXT records only.[^cs-umbrella-dns]

Point the redirect at the agency resolver, which stays first hop with Protective DNS upstream ([Chapter 03](../books/b09-network/03-what-tic-3-requires.md), [Book 08 Chapter 05](../books/b08-ddi/05-edge-interception-and-bypass.md)). Never point it at a vendor resolver in place of CISA's *(design guidance)*.

### Connected Cache

Cisco's documentation reviewed here doesn't mention Microsoft Connected Cache. Book 09's position is unchanged: separate hosts at the hubs, inside the same boundary, and nothing before Phase 3 depends on it ([Chapter 11](../books/b09-network/11-field-office-wan-transformation.md)).

## Evidence and telemetry

### Manager's APIs

**Sign-in, from release 20.18.1:**[^cs-api-auth]
- Sign in with JSON web tokens: `POST /jwt/login` with a username, password and a duration of up to 604,800 seconds (default 1,800).
- Send the token as a bearer header, and the returned `csrf` value as `X-XSRF-TOKEN` on POST requests.
- There's no JWT sign-out, so request short-lived tokens.

**Sign-in, earlier releases:** `POST /j_security_check`, then `GET /dataservice/client/token`, then `POST /logout` at the end.[^cs-api-auth]

The reads this guide uses:

| Read | Endpoint | Fields |
|---|---|---|
| Device inventory | `GET /dataservice/device` | Host name, system IP, site ID, device type, model, serial, software version, reachability[^cs-api-examples][^cs-sdk] |
| Manager audit log | `GET /dataservice/auditlog` (with a `query` parameter) | `entry_time`, `loguser`, `logusersrcip`, `logmodule`, `logfeature`, `logdeviceid`, `logmessage`, `logid`, `tenant`[^cs-api-audit] |
| Alarms and path statistics | `/dataservice/alarms`; `/statistics/approute/...` (latency, jitter, loss percentage by tunnel) | As documented in Cisco's examples[^cs-api-examples] |

### Mapping to Chapter 05's evidence schema

*(design guidance; every record is derived and should be labeled so, as Chapter 05 allows)*

| Chapter 05 field | Catalyst source |
|---|---|
| `controller_id` | Manager or Controller system IP, or the fabric name for SDWAN-G |
| `decision_kind: path-selection, application-steering` | The active application-aware routing and data policy (policy group), joined to application-route statistics for the flow's tunnel |
| `decision_kind: failover` | Alarms and events for TLOC, BFD and control-connection state changes |
| `selected_path` | Tunnel color and remote TLOC from application-route statistics |
| `sla_state` | The SLA class the flow matched, and whether the path met it |
| `identity_context` | `n/a`, unless ISE SGTs or identity-firewall users are in play |
| `policy_refs` | Policy group, data policy and SLA class identifiers, linked to the SC-7(4) traffic-flow policy |
| `evaluation_timestamp` | `entry_time` from the API, converted to ISO 8601 |

The example script builds the first layer of this:
- a `fleet_inventory` record per device (CM-8, SI-2)
- a `management_audit` record per audit-log entry (AU-6, AU-9, AC-6(9)), flagged for sign-ins and for sources outside the management network
- the gate findings

It doesn't build `sdwan_decision` records; those need the policy and statistics reads above.

### Getting logs off the box

- **Syslog.** The edges and control components send syslog over UDP, TCP or TLS; prefer TLS.[^cs-harden]
- **Other log types.** Manager aggregates audit, ACL and system logs. Firewall high-speed logging exports session records in NetFlow v9.[^cs-harden]
- **CISA.** All SD-WAN syslog goes to CLAW.[^cs-ed2603]
- **Session records.** M-26-14's minimum log content ([Chapter 13](../books/b09-network/13-sequencing-cost-and-evidence.md)) needs records of source, destination, protocol, port and session. Flow export from the edges plus firewall high-speed logging is the mechanism that produces them *(inference)*.

**Sentinel.** The "Cisco Software Defined WAN" connector, supported by Cisco, has two paths:[^cs-sentinel]
- Syslog reaches the `Syslog` table through the Azure Monitor Agent on an Arc-enabled Linux forwarder.
- NetFlow and IPFIX go through Filebeat and Logstash, with the workspace key, into `CiscoSDWANNetflow_CL`, a table with no data collection rule support.

Microsoft ended support for the HTTP Data Collector API on September 14, 2026; ingestion continues for TLS 1.2 clients.[^cs-dcapi] Syslog through the Azure Monitor Agent is listed as generally available in Azure Government.[^cs-sentinel-avail] Whether the Cisco solution is in the Azure Government content hub couldn't be confirmed. Treat the NetFlow path as legacy and ask for a data-collection-rule-based one (vendor ask 10).

## Risks

| Risk | Rating | Mitigation *(design guidance)* |
|---|---|---|
| The control plane collects new known-exploited vulnerabilities faster than the agency can patch | High | Hosted SDWAN-G with a written patch commitment; otherwise a standing patch crew working to Cisco's publication Wednesdays; re-run the gate on every KEV addition; Live Protect only as a stopgap |
| Compromise predates the build (CISA: likely since 2023) | High | Hunt before trusting any existing fabric; rebuild from patched images on any root finding |
| Hosted fabric still in scope; forensic custody depends on Cisco | Medium | Contract terms for artifact delivery times (vendor ask 2); CLAW and AWS log delivery confirmed in Phase 0 |
| Static-address allow-listing conflicts with ZTP and 5G | Medium | Static DIA addresses in the circuit order; carrier static IPs for 5G or a documented exception for the secondary path; staged onboarding |
| Single-region SSE adds latency to distant offices and concentrates risk | Medium | Measure in the pilot; fall back to Pattern A at the hubs; consider an SSE with nearer PoPs |
| Edge certificate renewal is manual after onboarding | Medium | CLM inventory plus an alarm-driven runbook; renewal dates tracked like Book 07's other classes |
| Edge FIPS and Common Criteria status in SD-WAN mode is unconfirmed | Medium | Vendor commitment before award; avoid TrustSec on FIPS-mode edges |
| The 2,000-device Manager cluster ceiling | Low | Growth trigger at about 1,800 devices; plan a second overlay early |
| The Sentinel NetFlow path is on an unsupported API | Low | Syslog through the agent now; DCR-based flow ingestion when available |
| Configuration groups don't cover every feature | Low | List the template-only features in Phase 0 and keep them on one model per site class |

## Vendor asks

1. Does Cisco apply every KEV fix to SDWAN-G inside CISA's due dates? Ask for the record for CVE-2026-76504 and CVE-2026-20245.
2. For an SDWAN-G fabric, how quickly will Cisco deliver the ED 26-03 artifacts: disk and memory images, admin-tech files and AWS network logs?
3. What is Cisco's recommended release today for SDWAN-G and for on-premises? Is 20.18 or 26.1 available in SDWAN-G? What does SDWAN-G cost for about 1,524 edges, to replace Chapter 11's \$400,000 control-plane line?
4. Is release 26.2 fixed for the Controller and Validator against CVE-2026-20182, CVE-2026-20245 and CVE-2026-20262?
5. What is the FIPS 140-3 status of IOS XE edges *in SD-WAN mode* on the C8200L-1N-4T, C8200-1N-4T, C8300-1N1S-4T2X and C8500L-8S4X? How is FIPS mode enabled on an edge?
6. Is controller (SD-WAN) mode inside the NIAP-evaluated configuration of the 17.15 and 17.18 Catalyst 8000 listings, and which BOM models does each cover?
7. What is the Enterprise Certificate procedure for overlay edges on 20.18/17.18, and is there an API that a CLM platform can call to renew?
8. Does Secure Access for Government's automatic tunnel need TAC enablement? Is a second US region planned?
9. Does Cloud OnRamp for SaaS category steering work against GCC endpoints?
10. Cisco and Microsoft: is there a Logs ingestion API (data collection rule) path for SD-WAN NetFlow, and is the solution published in Azure Government?
11. Carriers: can the 5G secondary path carry a static public address at every office?
12. CISA: must a Catalyst SD-WAN fabric deployed after March 2026 report under ED 26-03, and is the directive still open?

## What couldn't be verified

- **The joint advisory and partner guidance.**
  - The joint Cybersecurity Advisory on SD-WAN exploitation was refused on media.defense.gov (HTTP 403).
  - The ASD pages hosting the hunt guide and the 2025 *Security Considerations for Edge Devices* didn't respond.
  - Their content appears here only as CISA's supplemental guidance describes it.
- **A Cisco "recommended release" statement,** and the trains available in SDWAN-G.
- **SDWAN-G remediation of CVE-2026-76504.** The advisory names only Cisco's managed cloud.
- **Cflowd and IPFIX export details on IOS XE 17.x.** Cisco's page returned 404; flow support is taken from Microsoft's connector page and Cisco's high-speed logging section.
- **The release-20.18 disaster-recovery procedure for Manager.** The design guide found is from 2021.
- **The DoDIN Approved Products List entry, if any.** The list site was unreachable and Cisco's page returned 404.
- **SD-WAN mode in edge FIPS validation and in NIAP's evaluated configurations.**
- **Product-wide versus GCC-specific availability.** Whether Global Secure Access remote networks, specifically, are generally available in GCC; Microsoft's statement is product-wide.
- **Cisco SD-WAN's Sentinel solution in Azure Government,** and whether Umbrella for Government still automates Catalyst SD-WAN tunnels.
- **The audit-log query.** `last_n_hours` was tested only against mocked responses.

## Status and review

**In review.** Every claim was checked on October 24, 2026, against these sources:
- CISA's ED 26-03 pages and KEV catalog
- Cisco's security advisories, hardening guide, configuration guides, sizing chapter, government guide, certification pages and DevNet references
- the Cisco Secure Access for Government help center
- FedRAMP Marketplace data, the NIST CMVP, the NIAP Product Compliant List and the DISA STIG library
- Microsoft Learn

To move this guide to **Proved**:
- Build Gate 0 and the ten-site pilot in a lab or pilot fabric.
- Run the example script against it.
- Record the evidence on this page.

This page names one vendor to illustrate Book 09's vendor-neutral design; it isn't an endorsement by any agency. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 09 — Network & Transport](../books/b09-network/index.md), [Book 07 — PKI & Certificates](../books/b07-pki/index.md), the implementation guide [Certificate Lifecycle on CyberArk Certificate Manager](cyberark-certificate-lifecycle.md), and [Book 08, Chapter 05](../books/b08-ddi/05-edge-interception-and-bypass.md) on DNS at the SD-WAN edge.

[^cs-kev]: CISA, Known Exploited Vulnerabilities Catalog, JSON feed, catalog version 2026.10.23 (entries CVE-2026-20127 and CVE-2022-20775 added February 25, 2026; CVE-2026-20122, CVE-2026-20128 and CVE-2026-20133 added April 20, 2026; CVE-2026-20182 added May 14, 2026; CVE-2026-20245 added June 9, 2026; CVE-2026-20262 added June 15, 2026; CVE-2026-76504 added September 30, 2026, due October 3, 2026; IOS XE entries CVE-2023-20198, CVE-2023-20273 and CVE-2025-20352), <https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json>, accessed October 24, 2026.
[^cs-ed2603]: CISA, ED 26-03, *Mitigate Vulnerabilities in Cisco SD-WAN Systems*, February 25, 2026; V1 updated March 11, 2026 (scope, required actions in order, deadlines, reports, cloud-hosted artifact requests, CLAW delivery), <https://www.cisa.gov/news-events/directives/ed-26-03-mitigate-vulnerabilities-cisco-sd-wan-systems>, accessed October 24, 2026.
[^cs-supp]: CISA, *Supplemental Direction ED 26-03: Hunt and Hardening Guidance for Cisco SD-WAN Systems* (background, hunt sections A–F, hardening sections A–E including session timeouts, pairwise keys, the Manager certificate, SIEM alerts, CLAW for cloud-hosted fabrics, perimeter allow-listing with static edge IPs, the isolated VPN 512 and "Host Infrastructure in GovCloud"), <https://www.cisa.gov/news-events/directives/supplemental-direction-ed-26-03-hunt-and-hardening-guidance-cisco-sd-wan-systems>, accessed October 24, 2026.
[^cs-sa-rpa]: Cisco, Security Advisory `cisco-sa-sdwan-rpa-EHchtZk`, "Cisco Catalyst SD-WAN Controller Authentication Bypass Vulnerability," CVE-2026-20127, version 2.0, June 16, 2026 (Validator added; deployment types including "Cisco Hosted SD-WAN Cloud - FedRAMP Environment"; component renaming from 20.12.1 and 17.12.1a; indicators of compromise; fixed releases; end-of-maintenance trains), <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sdwan-rpa-EHchtZk>, accessed October 24, 2026.
[^cs-sa-2022]: Cisco, Security Advisory `cisco-sa-sd-wan-priv-E6e8tEdF`, "Cisco SD-WAN Software Privilege Escalation Vulnerabilities," CVE-2022-20775 and CVE-2022-20818, version 1.2, February 25, 2026 (attempted exploitation in February 2026; fixed releases; 20.9 not affected), <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sd-wan-priv-E6e8tEdF>, accessed October 24, 2026.
[^cs-sa-authbp]: Cisco, Security Advisory `cisco-sa-sdwan-authbp-qwCX8D4v`, Cisco Catalyst SD-WAN Manager vulnerabilities CVE-2026-20122, -20126, -20128, -20129 and -20133, version 1.3, April 22, 2026 (exploitation of -20128 and -20122 in March 2026 and of -20133 in April 2026; fixed releases), <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sdwan-authbp-qwCX8D4v>, accessed October 24, 2026.
[^cs-sa-rpa2]: Cisco, Security Advisory `cisco-sa-sdwan-rpa2-v69WY2SW`, "Cisco Catalyst SD-WAN Controller Authentication Bypass Vulnerability," CVE-2026-20182, version 2.0, June 16, 2026 (affects Controller, Manager and Validator; "all deployment types," including "Cisco SD-WAN for Government (FedRAMP)"; limited exploitation in May 2026; fixed releases). The same deployment-type list appears in the advisories for CVE-2026-20245 and CVE-2026-20262. <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sdwan-rpa2-v69WY2SW>, accessed October 24, 2026.
[^cs-sa-privesc]: Cisco, Security Advisory `cisco-sa-sdwan-privesc-4uxFrdzx`, CVE-2026-20245, version 1.10, July 21, 2026 (Controller, Manager and Validator; requires `netadmin` or exploitation of CVE-2026-20182 or CVE-2026-20127; configuration pushed to edges in limited cases; Live Protect shield "temporary partial protection"; fixed releases), <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sdwan-privesc-4uxFrdzx>, accessed October 24, 2026.
[^cs-sa-arbfw]: Cisco, Security Advisory `cisco-sa-sdwan-arbfw-c2rZvQ`, "Cisco Catalyst SD-WAN Manager Arbitrary File Write Vulnerability," CVE-2026-20262, version 1.1, June 15, 2026 (limited exploitation in June 2026; fixed releases), <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sdwan-arbfw-c2rZvQ>, accessed October 24, 2026.
[^cs-sa-webauth]: Cisco, Security Advisory `cisco-sa-sdwan-webauth-xr8beuuU`, "Cisco Catalyst SD-WAN Manager API Authentication Bypass Vulnerability," CVE-2026-76504, version 1.1, October 2, 2026 (active exploitation in September 2026; fixed releases; fixed in Cisco SD-WAN Cloud (Cisco Managed) Release 20.15.605 with no user action required), <https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-sdwan-webauth-xr8beuuU>, accessed October 24, 2026.
[^cs-cadence]: Cisco, "Cisco's Transition to a Risk-Based Vulnerability Disclosure Model" (from July 2026: hardening releases and advisories on the first and third Wednesday at 16:00 UTC; seven-day advance notification; umbrella CVE IDs by CWE; out-of-cycle advisories for active exploitation), <https://sec.cloudapps.cisco.com/security/center/resources/risk-based-disclosure>, accessed October 24, 2026.
[^cs-fr]: FedRAMP Marketplace product data, `products.json` (last change October 24, 2026): FR2012534927, "Cisco Catalyst SD-WAN for Government (SDWAN-G)" (FedRAMP Certified; Class C; Moderate; agency path; certified March 14, 2024; five agency authorizations; description of Manager, Validator, Controller and edge planes; secure configuration guidance; next ongoing certification report February 22, 2027); FR2304757473A, "Cisco Security Cloud for Government" (FedRAMP Certified; Class D; High; certified August 6, 2026; Umbrella for Government and Secure Access for Government; Protective DNS integration), <https://www.fedramp.gov/marketplace/products.json>, accessed October 24, 2026.
[^cs-gov]: Cisco, *Cisco Catalyst SD-WAN for Government Configuration Guide*, "Introduction" (federal boundary within AWS GovCloud (US); Cisco Catalyst SD-WAN Federal Operations; Portal and trusted IP addresses; Manager 20.12.1.1 and IOS XE 17.9.1a or later), updated November 19, 2025, <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/government/sdwan-for-gov/introduction-sd-wan-government.html>, accessed October 24, 2026.
[^cs-govsec]: Cisco, *Cisco Catalyst SD-WAN for Government Configuration Guide*, "Security Features" (FIPS mode enabled by default; `show sdwan security-info`; pairwise keying), updated November 19, 2025, <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/government/sdwan-for-gov/security-features.html>, accessed October 24, 2026.
[^cs-sizing]: Cisco, *Cisco Catalyst SD-WAN Control Components Compatibility Matrix and Recommended Computing Resources*, "Recommended Computing Resources for Release 20.18.x" (three-node Medium Manager cluster for 1,500–2,000 devices at 32 vCPU, 64 GB and 1 TB per node, up to 2,000 devices per cluster; two Controllers at 8 vCPU and 16 GB for 1,000–2,500 devices; two Validators at 4 vCPU and 8 GB for 1,000–4,000 devices; multiple overlays beyond cluster scale), <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/release/notes/compatibility-and-server-recommendations/ch-server-recs-20-18-combined11.html>, accessed October 24, 2026.
[^cs-dr]: Cisco, *Cisco Catalyst SD-WAN Administrator-Triggered Cluster Failover Deployment Guide* (active and standby Manager clusters in two locations; validated for on-premises deployments), <https://www.cisco.com/c/en/us/td/docs/solutions/CVD/SDWAN/cisco-sdwan-admin-triggered-cluster-failover-deploy-guide.html>, accessed October 24, 2026.
[^cs-harden]: Cisco, *Cisco Catalyst SD-WAN Hardening Guide*, revision 1.1, February 9, 2026 (network perimeter controls for Cisco-hosted and self-hosted deployments and firewall ports; RBAC roles; web server certificate; passwords; SSO and Duo MFA; DTLS/TLS and FIPS mode enabled by default on control components from 20.15.1; SNMPv3; pairwise keys and enhanced ESP; DH groups removed from 17.11.1a; session timeouts; logging types, syslog over UDP, TCP or TLS, firewall high-speed logging in NetFlow v9 and audit-log retention sizing; SSH), <https://sec.cloudapps.cisco.com/security/center/resources/Cisco-Catalyst-SD-WAN-HardeningGuide>, accessed October 24, 2026.
[^cs-csa-region]: Cisco Secure Access for Government help, "Secure Access Regions" ("Deployed in a single region: US (Virginia)") and "Device Compatibility" (tunnel MTU 1390 or less; TCP MSS 1350 or less; fragmented packets dropped), <https://securitydocs.cisco.com/docs/csa/gov/olh/138048.dita> and <https://securitydocs.cisco.com/docs/csa/gov/olh/138933.dita>, last updated October 14, 2026, accessed October 24, 2026.
[^cs-csa-gov]: Cisco Secure Access for Government help, "Integrate Catalyst SD-WAN with Secure Access," "Components" (Catalyst SD-WAN 20.15/17.15; ISE 3.1 or later) and the credentials page (Administration > Settings > Cloud Credentials, Cisco SSE), <https://securitydocs.cisco.com/docs/csa/gov/olh/161446.dita>, <https://securitydocs.cisco.com/docs/csa/gov/olh/161439.dita> and <https://securitydocs.cisco.com/docs/csa/gov/olh/161443.dita>, accessed October 24, 2026.
[^cs-csa-commercial]: Cisco, "Configure Secure Access with SD-WAN," document 225416, January 8, 2026 (automated tunnels from 20.15.1/17.15.1; up to eight tunnel pairs from Manager), <https://www.cisco.com/c/en/us/support/docs/security/secure-access/225416-configure-secure-access-with-sd-wan.html>; and "Configure Secure Access with Catalyst SD-WAN" for private access, document 225524, February 24, 2026 (20.18.2/17.18.2; controlled availability through TAC), <https://www.cisco.com/c/en/us/support/docs/security/secure-access/225524-configure-secure-access-with-catalyst.html>, accessed October 24, 2026.
[^cs-entcert]: Cisco, *Certificate Management* guide for 26.x (Enterprise Certificate option from IOS XE 17.18.1a for control components, hardware WAN edges and software WAN edges; Administration > Settings > Trust and Privacy > Certificates Settings; manual, EST and SCEP enrollment; automatic renewal at onboarding or migration from SUDI, "manual intervention" for later renewals; Cisco PKI and SUDI defaults). The guide is framed for SD-Routing devices. <https://www.cisco.com/c/en/us/td/docs/routers/sd-routing/26-x/sd-routing-certificate-management-26-x.html>, accessed October 24, 2026.
[^cs-bringup]: Cisco, *Cisco Catalyst SD-WAN Getting Started Guide*, "Overlay Network Bring-Up" (hardware certificate in the trusted board ID chip; authorized serial number file and WAN Edge List sent to the Controllers; enterprise root CA option for control components; bring-up order), updated October 20, 2026, <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/sdwan-xe-gs-book/cisco-sd-wan-overlay-network-bringup.html>, accessed October 24, 2026.
[^cs-certpdg]: Cisco, *Cisco Catalyst SD-WAN Control Components Certificates and Authorized Serial Number File Prescriptive Deployment Guide* (end of Symantec/DigiCert sponsorship; Cisco PKI or enterprise CA), <https://www.cisco.com/c/en/us/td/docs/solutions/CVD/SDWAN/cisco-sdwan-controller-cert-deploy-guide.html>, accessed October 24, 2026.
[^cs-fips-page]: Cisco, "FIPS 140" government certifications page and its compliance letters (Catalyst SD-WAN Manager, Validator and Controller 20.18, December 10, 2025, Cisco FIPS Object Module 7.3a, certificate #4747, for TLS 1.2/1.3, SSHv2, DTLS 1.2 and SNMPv3; C8200, C8200L and C8300 on IOS XE 26.1, May 22, 2026, certificates #5356 and #5430; IOS XE 17.18 letters, certificates #5356 and #4747; archived 17.12 "SDWAN mode" and 17.6 "Controller mode" letters citing FIPS 140-2 certificates), <https://www.cisco.com/c/en/us/solutions/industries/government/global-government-certifications/fips-140.html>, accessed October 24, 2026.
[^cs-cmvp4747]: NIST Cryptographic Module Validation Program, Certificate #4747, Cisco FIPS Object Module (FIPS 140-3, active, Level 1, sunset July 31, 2029), <https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4747>, accessed October 24, 2026.
[^cs-cmvp5356]: NIST CMVP, Certificate #5356, IOS Common Cryptographic Module (IC2M) Rel5b (FIPS 140-3, active, Level 1, validated June 26, 2026, sunset August 6, 2029; security policy tested on IOS XE 17.12 on ASR 1001-HX, with vendor-affirmed operating environments including Catalyst 8200, 8200L, 8300, 8500 and 8500L), <https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5356>, accessed October 24, 2026.
[^cs-cmvp5430]: NIST CMVP, Certificate #5430, CiscoSSL FIPS Provider (FIPS 140-3, active, Level 1, sunset November 17, 2029), <https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5430>, accessed October 24, 2026.
[^cs-niap]: NIAP, Product Compliant List, public product data (Cisco 8200, 8300, 8400, 8500 Series Secure Routers, IOS XE 17.18, certified April 9, 2026; ASR 1000 and Catalyst 8200, 8300 and 8500 Edge Routers, IOS XE 17.15, certified September 29, 2025, assurance maintenance to 17.18 December 12, 2025; protection profiles NDcPP 3.0e, VPN Gateway 1.3, MACsec 1.0 and SSH 1.0; no Cisco SD-WAN product), <https://www.niap-ccevs.org/products>, accessed October 24, 2026.
[^cs-cc]: Cisco, "Common Criteria" government certifications page ("Cisco cEdge Routers running IOS XE 17.12 with SD-WAN 20.12," EAL2+ (ALC_FLR.2), December 18, 2024 to December 18, 2029; certificate PDF 654-LSS, issued under the Canadian Common Criteria scheme), <https://www.cisco.com/c/en/us/solutions/industries/government/global-government-certifications/common-criteria.html>, accessed October 24, 2026.
[^cs-trustsec-fips]: Cisco, *Cisco Catalyst SD-WAN Security Configuration Guide, IOS XE 17.x*, "Cisco TrustSec Integration" (TrustSec not supported with FIPS mode enabled; PAC key download fails), <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/security/ios-xe-17/security-book-xe.html>, accessed October 24, 2026.
[^cs-secparams]: Cisco, *Cisco Catalyst SD-WAN Security Configuration Guide, IOS XE 17.x*, "Configure Security Parameters" (example `show sdwan security-info` output on a 17.18.02 edge with `fips-mode Disabled`), updated January 12, 2026, <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/security/ios-xe-17/security-book-xe.html>, accessed October 24, 2026.
[^cs-stig]: Defense Information Systems Agency, STIG library, Cisco IOS XE Router STIG bundle `U_Cisco_IOS-XE_Router_Y26M04_STIG` (NDM STIG V3R7, April 1, 2026; RTR STIG V3R5, October 1, 2025), <https://public.cyber.mil/stigs/downloads/>, accessed October 24, 2026.
[^cs-api-auth]: Cisco DevNet, "Authentication" for the Catalyst SD-WAN Manager API (JWT from 20.18.1 at `/jwt/login`, duration 1–604,800 seconds, default 1,800, `csrf` claim, no JWT logout; session flow with `/j_security_check`, `/dataservice/client/token` and `/logout`; 24-hour session and 30-minute inactivity timeout), <https://developer.cisco.com/docs/sdwan/authentication/>, accessed October 24, 2026.
[^cs-api-examples]: Cisco DevNet, "Cisco Catalyst SD-WAN Manager API Examples" (`/dataservice/device`, `/dataservice/alarms`, `/statistics/approute/fields` with latency, jitter and loss percentage), <https://developer.cisco.com/docs/sdwan/basic-management-examples/>, accessed October 24, 2026.
[^cs-sdk]: Cisco, `catalystwan` Python SDK, `catalystwan/dataclasses.py` (device fields `host-name`, `site-id`, `device-model`, `board-serial`, `reachability`, `personality`; alarm and event fields), <https://github.com/cisco-en-programmability/catalystwan-sdk>, accessed October 24, 2026.
[^cs-api-audit]: Cisco DevNet, "AuditLogEntry" schema (20.16) and "Get vManage Audit Log" (`GET /dataservice/auditlog` with a required `query` parameter; `data` and `header`), <https://developer.cisco.com/docs/sdwan/20-16/auditlogentry> and <https://developer.cisco.com/docs/sdwan/get-vmanage-audit-log>, accessed October 24, 2026.
[^cs-cfggroups]: Cisco, "Quick Start Guide: Simplified Configuration," document 222297, updated March 13, 2025 (recommendation to migrate from device and feature templates to configuration groups and policy groups; templates and configuration groups not used together on a device; features that remain on legacy templates or a CLI profile), <https://www.cisco.com/c/en/us/support/docs/routers/sd-wan/222297-quick-start-guide-simplified-configura.html>, accessed October 24, 2026.
[^cs-upgrade]: Cisco, "Start Your Catalyst SD-WAN Upgrade," document 225515, updated February 20, 2026 (cluster upgrade procedures per train hop; pausing disaster recovery), <https://www.cisco.com/c/en/us/support/docs/routers/sd-wan/225515-start-your-catalyst-sd-wan-upgrade.html>, accessed October 24, 2026.
[^cs-aar]: Cisco, *Cisco Catalyst SD-WAN Policies Configuration Guide, IOS XE 17.x*, "Application-Aware Routing" (SLA parameters and per-platform class limits; default classes from 17.15.1a; BFD defaults; fallback to best path; preferred and backup colors; strict mode), updated December 19, 2025, <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/policies/ios-xe-17/policies-book-xe/application-aware-routing.html>, accessed October 24, 2026.
[^cs-mrf]: Cisco, "Multi-Region Fabric FAQ" (core and access regions; border routers; core-region Controllers "must be dedicated/exclusive"; subregions; recommended 20.9/17.9), updated June 4, 2024, <https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/sd-wan/sd-wan-multi-region-fabric-faq.html>, accessed October 24, 2026.
[^cs-trustsec]: Cisco, "Configure TrustSec SGT Inline and SXP Propagation in SD-WAN," document 222699, January 16, 2025 (from IOS XE 17.3.1a; inline and SXP; SGACLs from ISE), <https://www.cisco.com/c/en/us/support/docs/routers/sd-wan/222699-configure-trustsec-sgt-sxp-propagation-i.html>, accessed October 24, 2026.
[^cs-firewall]: Cisco, *Security Configuration Guide, IOS XE 17.x*, "Enterprise Firewall with Application Awareness," identity-based policy (ISE pxGrid from 17.9.1a/20.9.1; SGT from 17.10.1a/20.10.1; SD-WAN Manager as the hub for ISE from 20.18.2/17.18.2; ISE 3.2 or later), <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/security/ios-xe-17/security-book-xe/m-firewall-17.html>, accessed October 24, 2026.
[^cs-tic]: Cisco, *TIC 3.0 Architecture Guide*, Design Zone for Security, October 20, 2021, <https://www.cisco.com/c/en/us/solutions/collateral/enterprise/design-zone-security/tic3-arch-guide.html>, accessed October 24, 2026.
[^cs-gsa-limits]: Microsoft Learn, "Known limitations for Global Secure Access" (remote network limitations; access controls limitations; "available in the US Government Community Cloud (GCC)"), ms.date September 29, 2026, <https://learn.microsoft.com/en-us/entra/global-secure-access/reference-current-known-limitations>, accessed October 24, 2026.
[^cs-gsa-partners]: Microsoft Learn, "Global Secure Access partner ecosystem" (Cisco Catalyst as a template-based integration), <https://learn.microsoft.com/en-us/entra/global-secure-access/partner-ecosystems-overview>, accessed October 24, 2026.
[^cs-msse]: Cisco, "Cisco Catalyst SD-WAN and Microsoft Security Service Edge Integration User Guide," September 17, 2024 (SIG generic tunnels; tested on 17.12/20.12; only the Microsoft 365 traffic forwarding profile selectable), <https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/sd-wan/catalyst-sd-wan-ms-sse-int-ug.html>, accessed October 24, 2026.
[^cs-inr]: Microsoft Learn, "Microsoft 365 informed network routing" (supports WW Commercial "but not the GCC Moderate, GCC High, DoD, Germany, or China clouds"; Cisco IOS XE SD-WAN 20.4/17.4 or later), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe>, accessed October 24, 2026.
[^cs-cor]: Cisco, *Cisco Catalyst SD-WAN Cloud OnRamp Configuration Guide, IOS XE 17.x*, "Cloud OnRamp for SaaS" (Microsoft 365 traffic categories; Microsoft telemetry from 17.4.1a/20.4.1; telemetry not supported on sites using SIG tunnels), updated December 19, 2025, <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/cloudonramp/ios-xe-17/cloud-onramp-book-xe/cor-saas.html>, accessed October 24, 2026.
[^cs-umbrella-dns]: Cisco, *Security Configuration Guide, IOS XE 17.x*, "Cisco Umbrella Integration" (DNS security policy; Umbrella default or custom DNS server per VRF; local domain bypass, 64 domains, UDP only, A/AAAA/TXT), updated January 12, 2026, <https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/security/ios-xe-17/security-book-xe/umbrella-integration.html>, accessed October 24, 2026.
[^cs-sentinel]: Microsoft Learn, "Find your Microsoft Sentinel data connector," "Cisco Software Defined WAN" (supported by Cisco Systems; Syslog through the Azure Monitor Agent on an Azure Arc server; NetFlow through Filebeat and Logstash into `CiscoSDWANNetflow_CL`, no DCR support), <https://learn.microsoft.com/en-us/azure/sentinel/data-connectors-reference#cisco-software-defined-wan>, accessed October 24, 2026.
[^cs-sentinel-avail]: Microsoft Learn, "Microsoft Sentinel feature support for Azure commercial/other clouds" (Syslog via AMA and content hub available in Azure Government), <https://learn.microsoft.com/en-us/azure/sentinel/feature-availability>, accessed October 24, 2026.
[^cs-dcapi]: Microsoft Learn, "Migrate from the HTTP Data Collector API to the Logs ingestion API" (support ended September 14, 2026; ingestion continues for TLS 1.2 or later clients), <https://learn.microsoft.com/azure/azure-monitor/logs/custom-logs-migrate>, accessed October 24, 2026.
