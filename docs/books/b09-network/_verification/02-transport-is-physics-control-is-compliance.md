# Verification — Chapter 02, Transport Is Physics, Control Is Compliance

Checked October 20–21, 2026 by writer W1. Sources: the twin papers `docs/whitepapers/tic3-sdwan-vs-dia.md` and `docs/whitepapers/network-transport-and-governance.md` (stated once, here), and *The Branch Edge Gap* v2 (`docs/whitepapers/branch-edge-gap.md`) §1, §3 and the parts of §8–§10 that bear on them. CISA PDFs (Branch Office use case v3.0, the June 2026 SASE guidance) were downloaded and text-extracted; NIST control text was read from the OSCAL SP 800-53 Rev. 5 catalog (release 5.2.0); FedRAMP status from `products.json` (last_change 2026-10-21T05:02:15Z); ITU documents downloaded as PDFs.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | DIA = direct internet access; not a DISA circuit; DISA's network is DISN; DIA is also the Defense Intelligence Agency | The false versus | verified | DISA, DISN Connection Process Guide acronyms (search result); branch-edge-gap Appendix A correction re-confirmed |
| 2 | TIC 3.0 no longer requires routing through access points where an alternative gives the agency and CISA situational awareness | What DIA solves | verified | CISA SASE guidance v1.0 (June 2026), Preface |
| 3 | DIA solves exactly one problem (the hairpin) and satisfies none of the protection controls | Decision makers; DIA sections | restated-as-design | Program argument (twins); supported by #4–#6 |
| 4 | SC-7, SC-7(4), SC-8, SC-8(1), AC-4, SI-3, SI-4 statements as summarized in the table | Controls table | verified | NIST SP 800-53 Rev. 5 release 5.2.0 (Aug 27, 2025), OSCAL catalog |
| 5 | MPLS VPNs don't encrypt or detect tampering; cryptography must be added | Controls table; transport menu | verified (new) | RFC 4364 §1.6 and §13.1 |
| 6 | With local breakout the branch is an external boundary; SC-7 assertion must say what monitors/controls it | Bare local breakout | restated-as-design | Program argument (branch-edge-gap §2.4) on verified control text |
| 7 | Branch Office use case: policy enforcement parity; SD-WAN named as an example of multiple means of conveyance; parity on all paths | Bare local breakout; governor | verified (new) | TIC 3.0 Branch Office Use Case v3.0, publication Sept 2026 (revision history shows v3.0 July 2025; 2026 changes were footnote links only) |
| 8 | TIC 3.0 is non-prescriptive; names no required technology | Bare local breakout | verified | CISA TIC FAQ (FAQ 4); SASE guidance Preface |
| 9 | The five gaps of a DIA+SASE branch with no branch edge (path selection, app awareness, QoS, aggregation, per-app telemetry) | What DIA plus SASE leaves out | restated-as-design | Program engineering argument (branch-edge-gap §3.1) |
| 10 | CISA defines SASE as combining networking tools (SD-WAN) with security tools (SWG, CASB, ZTNA, NGFW) | Objections; governor | verified (new) | CISA SASE guidance §4. branch-edge-gap §2.2 said this document's text "could not be retrieved"; it now has been, and nothing in it mandates SD-WAN |
| 11 | "There is no TIC 3.0 SASE use case" | (not restated) | verified, not carried | The four use cases remain Traditional, Branch Office, Remote User, Cloud on CISA's TIC page; the SASE document is guidance, not a use case. Detail is Ch03's |
| 12 | FedRAMP doesn't constrain routing; "name the control" | Objections | restated (pointer) | Owned by Ch03; Ch02 keeps the one-line rebuttal |
| 13 | Fiber 5 µs/km; satellite planning values 12 ms (400 km), 110 ms (14,000 km), 260 ms (36,000 km), space only between earth stations | Transport menu | verified (new) | ITU-T G.114 Table A.1 |
| 14 | LEO altitude range "400 to 1,200 km" | Transport menu | removed | Not sourced; G.114's 400 km row used instead |
| 15 | 5G user-plane latency 4 ms eMBB / 1 ms URLLC, radio interface only, unloaded | Transport menu | verified (new) | ITU-R M.2410-0 (11/2017) §4.7.1 |
| 16 | No LEO latency figure (branch-edge-gap §10) | Transport menu | unverifiable | starlink.com network-update page is script-rendered and returned no text; search snippets cite medians but the primary page couldn't be read. No figure given; agencies told to measure |
| 17 | Geostationary can't carry conversational voice inside the transparent-interactivity target | Transport menu | arithmetic | 260 ms (#13) > 150 ms (G.114 clause 4) |
| 18 | Transport closes telecommunications diversity: CP-8, CP-8(2), CP-8(3), SC-47 | One control family | verified (control IDs added) | SP 800-53 Rev. 5 OSCAL; twins named the family but not the controls |
| 19 | Each additional external telecom service adds an SC-7(4) managed interface and traffic flow policy | One control family | verified (new) | SP 800-53 SC-7(4) |
| 20 | CISA: SD-WAN "optimizes wide-area connectivity through dynamic, policy-driven routing" | Governor | verified (new) | CISA SASE guidance §4 |
| 21 | SD-WAN contributes circuit-wide encryption, traffic-class separation, app-layer path telemetry, active-active multipath | Governor | restated-as-design / example verified | Program argument; encryption illustrated by Cisco Catalyst SD-WAN security guide (IPsec on by default in the data plane; AES-GCM-256) |
| 22 | SD-WAN alone doesn't satisfy the Branch Office use case; boundary/flow/malware closures come from SASE | Governor | restated-as-design | Program argument; consistent with #7, #10 |
| 23 | EIS provides SD-WAN networking and connectivity options | Governor | verified | CISA TIC FAQ (FAQ 3). GSA's EIS page itself doesn't mention SD-WAN; trade press (Route Fifty, Nov 16, 2020) reports SD-WAN as EIS's first post-award service — not cited |
| 24 | Agencies must consider FedRAMP authorization when selecting providers | Governor | verified (new) | CISA TIC FAQ (FAQ 6) |
| 25 | Palo Alto NSP incl. Prisma Access/SASE/SD-WAN FedRAMP High "19 December 2024" | FedRAMP table | corrected | Marketplace: GCS-HIGH, High / Class D, status changed to FedRAMP Certified 2024-12-09; description includes Prisma Access and Prisma SD-WAN. IL5 claim not re-verified and not carried |
| 26 | Zscaler ZIA and ZPA High "1 August 2022" | FedRAMP table | corrected | ZIA Gov (High) certified 2022-07-02; ZPA Gov (High) certified 2020-04-29 |
| 27 | Netskope GovCloud High "9 January 2024" | FedRAMP table | corrected | Listing is Netskope NewEdge Government, High / Class D, certified 2023-12-19 |
| 28 | Cisco Meraki for Government incl. SD-WAN Moderate "25 February 2025" | FedRAMP table | corrected | Cisco Meraki US Government Region, Moderate / Class C, certified 2025-02-18 |
| 29 | Cisco SD-WAN for Government impact level "could not be verified" | FedRAMP table | verified (new) | Cisco Catalyst SD-WAN for Government (SDWAN-G), Moderate / Class C, certified 2024-03-14. Cisco Umbrella for Government not checked as a separate listing (Cisco Security Cloud for Government is listed High / Class D); not carried |
| 30 | A FedRAMP listing covers the cloud offering, not agency-installed edge appliances | FedRAMP table note | restated-as-design | Program reading of listing scope |
| 31 | Governor is attack surface: controller with agency-wide authority; internet-facing edges replace hardened egress points | Governor is attack surface | restated-as-design | Program argument (twins) |
| 32 | "Edge-management-plane products are among the most actively exploited categories" (tic3-sdwan-vs-dia) | Governor is attack surface | corrected | Replaced with CISA's own words in BOD 26-02 (edge device definition; widespread exploitation campaigns; "attractive targets due to their extensive reach") |
| 33 | BOD 26-02 issued Feb 5, 2026; 12- and 18-month removal requirements | Governor is attack surface | verified | CISA BOD 26-02 page. The brief asked to verify "BOD 26-02": it exists and is *Mitigating Risk From End-of-Support Edge Devices* |
| 34 | ED 26-03 issued "26 February 2026" (branch-edge-gap §3.2) | Governor is attack surface | corrected | Issued February 25, 2026; V1 March 11, 2026 supersedes required actions; CVE-2026-20127 + CVE-2022-20775; joint alert with NSA and four partners reports global exploitation and long-term persistence; V1 requires syslog via CLAW |
| 35 | CLAW expansion | Governor is attack surface | corrected | ED 26-03 V1: "Cloud Logging Aggregation Warehouse" (branch-edge-gap gave "Cloud Log Aggregation Warehouse"). Flag for Ch03 and App C |
| 36 | BOD 26-04 (June 10, 2026) revokes BOD 22-01 and 19-02; risk-based windows; 3-day window for publicly exposed, automatable, full-impact vulnerabilities | Governor is attack surface | verified | BOD 26-04 page; CISA "Patch Smarter, Not Harder" (June 10, 2026). "Five remediation windows" not verified (Table 1 is an image) and not carried |
| 37 | Control list protecting the governor (AC-2, AC-6, IA-2(1), SC-7, CM-2, CM-7, SI-2, SA-22, AU-2/6/12) | Governor is attack surface | restated-as-design | Program position; control titles verified in OSCAL |
| 38 | Five-step decision sequence; out-of-order is the most common/costly mistake | Order of operations | restated-as-design | Program position (twins); Ch13 owns the full treatment |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| tic3-sdwan-vs-dia — Problem, solution, ask | Ch02 case paragraph | — |
| tic3-sdwan-vs-dia — The false versus | Ch02 The false versus; What DIA solves / satisfies / breaks | — |
| tic3-sdwan-vs-dia — The physics | Ch01 (budget, hairpin) and Ch02 Transport menu (second paragraph) | Numbers corrected in Ch01 |
| tic3-sdwan-vs-dia — TIC 3.0 as the policy gate | Ch02 What DIA solves; Bare local breakout | Full policy statement owned by Ch03 |
| tic3-sdwan-vs-dia — SD-WAN as the transport governor | Ch02 The governor | — |
| tic3-sdwan-vs-dia — The governor is itself attack surface | Ch02 The governor is itself attack surface | Claim #32 corrected |
| tic3-sdwan-vs-dia — Decision sequence | Ch02 Order of operations | Detailed sequencing in Ch13 |
| network-transport-and-governance — Problem | Ch02 The false versus | Duplicate of twin; stated once |
| network-transport-and-governance — The false versus (three numbered points) | Ch02 What DIA solves / satisfies / breaks | — |
| network-transport-and-governance — The physics | Ch01 | — |
| network-transport-and-governance — The transport menu | Ch02 Transport menu; One control family | — |
| network-transport-and-governance — The control plane | Ch02 The governor; attack surface | — |
| network-transport-and-governance — Order of operations; Conclusion | Ch02 Order of operations; "What this chapter establishes" | — |
| branch-edge-gap — Status/scope and "how this version differs" | Ch02 The false versus (DIA acronym error) | Version history otherwise not carried; workbook isn't versioned papers |
| branch-edge-gap §1 Executive summary, Findings 1–2 | Ch02 (Finding 2 throughout; Finding 1 as the evidence argument in Bare local breakout) | Findings 3–5 owned by Ch06 and Ch13 |
| branch-edge-gap §2.1–§2.3, §2.5, §2.6 | — | Policy background owned by Ch03 (W2); Ch02 links Ch03 |
| branch-edge-gap §2.4 The honest version of the argument | Ch02 Bare local breakout (evidence framing, SC-7) | SI-4/AC-17/CA-7 mapping detail and M-26-14 owned by Ch03/App B |
| branch-edge-gap §3.1 The right problem, half solved (a)–(e) | Ch02 What DIA plus SASE still leaves out | — |
| branch-edge-gap §3.2 The fallacy (redundant / adds risk / not authorized) | Ch02 three objections; governor attack surface | ED 26-03 date corrected (#34) |
| branch-edge-gap §3.3 The architectures (two ASCII diagrams) | `ch02-branch-edge` diagram and following paragraph | — |
| branch-edge-gap §3.4 Procurement note | Ch02 FedRAMP table | All dates corrected from the Marketplace (#25–#29) |
| branch-edge-gap §4 Legacy protocols, §5 Token-based access | — | Owned by Ch06 (W3) |
| branch-edge-gap §6 Cost, §7 Sequencing and phase inversion | — | Owned by Ch13 (W6); Ch02 links Ch13 |
| branch-edge-gap §8 Recommendations 1–2, 5 | Ch02 Order of operations step 5 (evidence list from Rec. 5) | Rec. 1 to Ch03; Rec. 3–4 to Ch13; Rec. 6 to Ch06 |
| branch-edge-gap §9 Glossary | — | Owned by App C (W6); DIA definition used in Ch02 |
| branch-edge-gap §10 Sources and verification status | Re-checked items: SASE document (now retrieved), CLAW expansion (corrected), Cisco SD-WAN for Government level (now verified), LEO figure (still unverifiable) | Other items belong to Ch03/Ch06/Ch13 |
| branch-edge-gap Appendix A Change log | Ch02 (DIA acronym; SD-WAN "adds risk" overstated) | Change log itself not carried |
