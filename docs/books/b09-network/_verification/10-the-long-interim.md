# Verification — Chapter 10, The Long Interim

Checked October 21, 2026 against primary sources: cisa.gov (BOD 23-02, BOD 26-02, BOD 26-04, the TIC FAQ, the TIC 3.0 Program Guidebook v1.2, the June 2026 SASE guidance, the Logging Reference Architecture release), whitehouse.gov (M-19-26, M-26-14, M-26-15, Circular A-11), gsa.gov (EIS page, EIS transition page, the August 2026 Transition Progress Tracking Report, the TIC/MTIPS page), csrc.nist.gov and nvlpubs.nist.gov (SP 800-53 Rev. 5, FIPS 203, the FIPS 140-3 transition page), Microsoft Learn (ExpressRoute and Microsoft 365 connectivity pages, Entra hybrid join) and the live Microsoft 365 endpoint web service. Main source: *The Long Interim* (`docs/whitepapers/the-long-interim.md`), not linked from the chapter. Footnote keys drop the `c10-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | No federal instrument requires SD-WAN or SASE | Case by elimination | verified (owned and footnoted by Ch03; linked) | Ch03 |
| 2 | CISA SASE guidance (June 2026) is guidance, describes SASE as a TIC 3.0 path | Case by elimination | verified; the document calls itself guidance; no explicit "not a requirement" sentence found, so the chapter says it "presents itself as guidance" | sase |
| 3 | Networx expired May 31, 2026 | Legacy vehicles | verified (GSA report: "all contracts expired on May 31, 2026") | tptr |
| 4 | WITS 3 expired February 28, 2026 | Legacy vehicles | removed from this chapter (only a carrier page gives the date; Ch03 states it) | — |
| 5 | 214 agencies transitioned as of July 31, 2026 | Legacy vehicles | corrected to 219 as of August 31, 2026; GSA's own report table says 221, noted | eis-transition |
| 6 | EIS option periods to July 31, 2027 and July 30, 2032 | Legacy vehicles | verified | eis |
| 7 | MTIPS still orderable under EIS | Legacy vehicles | verified (managed security service, Traditional use case) | gsa-tic |
| 8 | GSA's EIS service list doesn't name SD-WAN; bought through MNS or VPNS | Legacy vehicles | first half verified; "MNS or VPNS" corrected to advice to confirm the ordering service with GSA (GSA's SD-WAN ordering guide returned 404; 2019 press said MNS, transport services and service-related equipment) | eis; ticfaq |
| 9 | CISA TIC FAQ: EIS provides SD-WAN options | Legacy vehicles | verified | ticfaq |
| 10 | M-19-26 rescinded M-08-05; no requirement to route through TICAP/MTIPS | Hairpin | verified | m1926 |
| 11 | Program Guidebook quote on bandwidth demands and cost | Hairpin | corrected: "agency TIC access points," not "agency TICs"; Guidebook v1.2, July 2025 | guidebook |
| 12 | Agency-operated access point and VPN backhaul analysis | Alternatives | restated-as-design | — |
| 13 | "We no longer recommend the use of ExpressRoute for Microsoft 365 traffic" | ExpressRoute | verified | er-azure |
| 14 | Microsoft authorization required; only rare scenarios | ExpressRoute | verified | er-m365 |
| 15 | Network connectivity principles page lacks "ExpressRoute"; DIA-prioritized quote | ExpressRoute | verified (page read in full; updated August 2026) | principles |
| 16 | SD-WAN "easiest way" sentence on the principles page | ExpressRoute | corrected: it is on "Managing Microsoft 365 endpoints" | er-managing |
| 17 | "Some Microsoft 365 traffic can only be routed through the Internet"; "requires Internet connectivity" | ExpressRoute | verified (two different pages) | er-azure; er-managing |
| 18 | ~7 endpoint sets ER=Yes vs ~40 ER=No | ExpressRoute | corrected: 10 of 63 true, 53 false (Worldwide data version 2026081400, pulled Oct 21, 2026) | endpoints |
| 19 | CRL/OCSP and enterpriseregistration.windows.net are ER=No and required | ExpressRoute | verified (sets 59, 84, 125) | endpoints |
| 20 | Office client downloads, CDNs, telemetry, Outlook mobile in ER=No sets | ExpressRoute | removed (not individually checked; replaced with the verified examples) | — |
| 21 | Pre-August 1, 2017 circuits advertise all Office prefixes without route filters | ExpressRoute | verified (wording from the route-filter page) | routefilter |
| 22 | Unauthorized subscription gets an explicit error creating Office 365 route filters | ExpressRoute | removed (not verified) | — |
| 23 | GCC pairs with Entra ID in commercial Azure; GCC High/DoD with Azure Government | ExpressRoute | verified | feature |
| 24 | Web service instances: Worldwide, China, USGovDoD, USGovGCCHigh; GCC uses Worldwide | ExpressRoute | verified (live service also returns France and Germany, not in docs; not mentioned) | endpoints |
| 25 | FAQ: GCC endpoints reachable through Azure US Government ExpressRoute after a support ticket | ExpressRoute | verified | erfaq |
| 26 | Azure Government peering limited to Azure Government public IPs | ExpressRoute | verified; placement corrected (it sits under the next FAQ question) and stated as "nearby on the same page" | erfaq |
| 27 | Hairpin "should be remediated before continuing…" | ExpressRoute | verified | implementing |
| 28 | Microsoft's inspection-bypass guidance applies to circuit paths too | ExpressRoute | restated, linked to Ch12 (which owns and footnotes the bypass guidance) | Ch12 |
| 29 | INR not available to GCC Moderate | ExpressRoute | verified (linked to Book 08 App C, consistent with the brief) | B08 App C |
| 30 | ExpressRoute "approved between roughly 2015 and 2018" cohort | ExpressRoute | restated as "years ago" (no source for the date range) | — |
| 31 | Six-function scarcity table and its obtainability column | Scarcity | restated-as-design (labeled engineering judgment) | — |
| 32 | Acquisition, site-count, authorization and TIC-adoption reasons | Why years away | restated-as-design | — |
| 33 | Budgets formulated "roughly two years ahead"; program is a FY28 item | Why years away | corrected to the verified mechanics: initial submissions to OMB in September; President's budget by the first Monday in February; "a later-year execution item" | a11 |
| 34 | M-26-14 plan due 90 days after LRA (August 2026) | Mandates table | verified; LRA released August 20, 2026; plans due November 18, 2026 | m2614; lra |
| 35 | M-26-15 / EO 14412: PQC plan ~October 2026 | Mandates table | verified: 120 days from June 24, 2026 (October 22, 2026); EO 14412 title verified | m2615 |
| 36 | BOD 26-04: policy update due August 7, 2026; full compliance December 7, 2026 | Mandates table | corrected: Phase I immediate; Phase II (processes) 60 days, about August 9; Phase III 180 days, about December 7; quarterly exposed-IP attestation | bod2604 |
| 37 | BOD 26-02 (February 5, 2026): EOS edge devices off networks by August 2027; February 2027 milestone | BOD 26-02 | verified (18 months, about August 5, 2027; 12-month decommission milestone) | bod2602 |
| 38 | BOD 26-02 covers routers, switches, firewalls, WAPs "on FCEB networks" | BOD 26-02 | corrected: scope is boundary devices accessible from the public internet; interior switches without internet-facing interfaces are out of scope | bod2602 |
| 39 | Like-for-like refresh closes the question "for another seven to ten years" | BOD 26-02 | restated as "for the service life of the new equipment" (no source for the span) | — |
| 40 | M-26-15 quote on TLS/IPsec-terminating infrastructure | BOD 26-02 | verified | m2615 |
| 41 | ML-KEM as the NIST PQC key exchange (FIPS 203) | BOD 26-02 | verified | fips203 |
| 42 | BOD 23-02 management interfaces; separate PEP as preferred action | BOD 26-02 | verified (June 13, 2023) | bod2302 |
| 43 | All FIPS 140-2 certificates to Historical List September 22, 2026 | BOD 26-02 | verified; NIST's page also says "until September 21," noted in footnote | fips |
| 44 | SC-7(4) traffic flow policy and documented exceptions | Interim action 1 | verified | sp80053 |
| 45 | SC-8(1) attaches to information; CM-7(1) periodic review of nonsecure protocols | Interim action 4 | verified (CM-7(1) text; the "FTP" naming in its discussion not relied on) | sp80053 |
| 46 | Cleartext inventory, three dispositions, point-to-point tunnel as highest-value action | Interim action 4 | restated-as-design | — |
| 47 | Protective DNS, root hints, third-party resolvers only from internal servers | Interim action 5 | verified by Ch03 and Book 08; linked, not re-footnoted | Ch03 |
| 48 | Encrypted DNS, HTTPS, HSTS/STARTTLS, TLS 1.3 per SP 800-52r2 | Interim action 6 | owned and footnoted by Ch03; linked | Ch03 |
| 49 | Entra hybrid join needs line of sight to DCs | Interim action 7 | verified ("periodically") | hybridjoin |
| 50 | Other DC dependencies, Kerberos defaults, TCP sequence point, round-trip arithmetic | Engineering realities | owned and footnoted by Ch06; summarized and linked | Ch06 |
| 51 | Undocumented gap is a finding; documented gap is an accepted risk | Interim action 10 | restated-as-design | — |

## 2. Carry-forward ledger — *The Long Interim*

| Source page § | Went to | Or why not carried |
|---|---|---|
| Header note (measurements vs estimates) | Ch10 scarcity note; Ch13 | — |
| §1 Executive summary, Findings 1–6 | Ch10 opening and sections (F1, F5); Ch03 (F2–F4); Ch13 (F6) | Summary not reproduced; each finding carried in its owning chapter |
| §1 "On numbers" | Ch13, "What the public record doesn't give you" (corrected) | — |
| §2 intro (argue backward) | Ch10, case by elimination | — |
| §2.1 Legacy vehicles expired | Ch10 | WITS 3 date and 214 count left to Ch03 / corrected |
| §2.2 Hairpin, M-19-26, Guidebook quote | Ch10 (quote corrected); Ch13 attribution chain | — |
| §2.3 Agency-operated access points | Ch10 | — |
| §2.4 VPN backhaul | Ch10 | — |
| §2.5 Private connectivity; ExpressRoute for Microsoft 365 (five points, hairpin, inspection) | Ch10 (corrected counts and page attributions); inspection bypass to Ch12 | — |
| §2.6 What is left; function table; where the argument is weakest | Ch10 | — |
| §2.7 Costs: not public, citable table, MPLS multiple, cost structure, SASE price point | Ch13, measuring cost | Zscaler price range dropped (unverifiable); $2.08B dropped (untraceable); pricer and MTIPS ICB claims corrected |
| §3.1 TIC 3.0 technology-neutral; five volumes; four use cases; SASE guidance | Ch03; Ch10 cites the SASE guidance | Owned by Ch03 |
| §3.2 Nothing else names SASE/SD-WAN; M-22-09 network pillar; ZTMM | Ch03 | Owned by Ch03 |
| §3.3 Four binding obligations | Ch03 (owner); Ch10 BOD 26-02 section and plan list | — |
| §3.4 DoD contrast | Ch03 | Owned by Ch03 |
| §3.5 FedRAMP doesn't constrain routing; Notice 0013; Consolidated Rules | Ch03; App C glossary | — |
| §3.6 Own control assertions; M-26-14 network address quote | Ch03; Ch13 evidence section | — |
| §4.1–4.3 Encryption required / not required / in practice | Ch03 | Owned by Ch03 |
| §4.4 Where encryption is load-bearing; cleartext inventory | Ch10 interim action 4 (action); Ch03 (argument) | — |
| §4.5 DNS and DDI platforms; the vendor-resolver trap | Ch10 interim action 5 (verification task); Ch03 and Book 08 (argument) | — |
| §4.6 FIPS 140-2 historical list | Ch10 BOD 26-02 attribute list | — |
| §5.1 Structural reasons; competing mandates table | Ch10 (BOD 26-04 dates corrected; budget timing corrected) | — |
| §5.2 BOD 26-02 as forcing function; refresh specification | Ch10 (scope corrected) | — |
| §6.1–6.10 Interim posture | Ch10, the ten actions | — |
| §7.1 What breaks on re-routed paths | Ch06 (owner); Ch10 summary | — |
| §7.2 Kerberos and four real dependencies | Ch06 (owner); Ch10 action 7 and summary | — |
| §7.3 Round trips dominate | Ch06 (owner; its 30→3 arithmetic correction is used); Ch10 summary | — |
| §8.1 Phase inversion | Ch13 | — |
| §8.2 What the evidence supports | Ch13 (Commerce quote and GAO-25-107114 corrected) | — |
| §8.3 Competing explanations | Ch13 (Uptime dated to 2022 survey) | "71% will repatriate" kept only as a warning, without the figure |
| §8.4 What would confirm or refute | Ch13 | — |
| §8.5 Paired-branch study; four cost categories; don't import percentages | Ch13 | — |
| §9 Recommendations 1–10 | Ch10 plan list (1–4, 8 and BOD spec); Ch10 actions (6, 7, 9); Ch03 (2, 5); Ch13 (8, 10) | — |
| §10 Sources | Footnotes in Ch10 and Ch13; App B | Source list not reproduced; "stated as not found" items carried in Ch13 |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | "GSA's EIS service list doesn't name SD-WAN" conflicted with Chapter 05. Both GSA pages re-opened: the TIC page lists "SD-WAN Service as fully managed, co-managed, or do-it-yourself implementations" among EIS services; the main EIS page's summary list doesn't name SD-WAN. Sentence rewritten to say both, with the TIC page leading, so Chapter 05 stands | line 41 | corrected | <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/enterprise-infrastructure-solutions/trusted-internet-connections>; <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/telecommunications-and-network-services/enterprise-infrastructure-solutions> |
| RF-2 | `[^c10-gsa-tic]` URL updated to the canonical page (the old URL 301-redirects) and annotated with the SD-WAN quote | Footnote | verified | <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/enterprise-infrastructure-solutions/trusted-internet-connections> |
