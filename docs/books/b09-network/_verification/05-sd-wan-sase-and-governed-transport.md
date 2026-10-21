# Verification — Chapter 05, SD-WAN, SASE and Governed-Path Transport

Checked 2026-10-21 against CISA (directive pages; the TIC 3.0 Branch Office Use Case v3.0 PDF and the June 2026 SASE guide PDF, both opened and text-extracted), Microsoft Learn (Learn MCP), Cisco configuration guides, AWS documentation, NIST (SP 800-207 PDF; SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0), GSA, SPIFFE, the Spanner paper (PDF opened) and the FedRAMP Marketplace dataset (`products.json`, last change 2026-10-21T05:02Z).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SD-WAN helps only inside the gap between observed latency and the floor; never moves the floor | Differentiated transport | restated-as-design (argument from Ch01 physics) | — |
| 2 | Lean / bulk traffic-class table; branch examples added (voice, sign-in; patch/content) | Differentiated transport | restated-as-design | — |
| 3 | ssot-04 "Internet paths routinely run 1.5×–3× the great-circle distance" | Recovering route inflation | corrected: restated from a primary measurement study (minimum ping > 3× vacuum c-latency); the 1.5× fiber factor is shown as arithmetic | c05-bozkurt, c05-tcpip |
| 4 | ssot-04 "floor × 3 toward floor × 1.1" | Recovering route inflation | corrected: replaced with a measured example (Azure UK South→East US P50 78 ms vs ~62 ms floor ≈ 1.3×); "× 1.1" dropped as unsourced | c05-azlatency |
| 5 | Light in fiber ~200 km/ms | Recovering route inflation; ceiling | verified (Microsoft's stated propagation constant) | c05-tcpip |
| 6 | London–Virginia ~6,150 km great-circle | Recovering route inflation | restated as the chapter's own arithmetic (haversine, London to Boydton VA) | footnote note |
| 7 | FEC: parity per group of 4 packets, recovers one loss; adaptive vs always | Shrinking the tail | verified (vendor example) | c05-fec |
| 8 | Packet duplication on alternate tunnels, receiver keeps first; multiple WAN links; voice/video | Shrinking the tail | verified (vendor example) | c05-dup |
| 9 | "sub-second path failover" | Shrinking the tail | restated: "fast path failover" (no vendor-neutral sub-second figure verified) | — |
| 10 | Quorum commit latency is a tail statistic | Shrinking the tail | restated-as-design (follows from quorum semantics) | — |
| 11 | Spanner/TrueTime: GPS and atomic references, bounded uncertainty, commit wait | Clock angle | verified; added "generally less than 10 ms" from the paper | c05-spanner |
| 12 | ssot-04 "precision time protocols degrade with path asymmetry and jitter, not raw distance" | Clock angle | restated-as-design (no primary normative text located for IEEE 1588 asymmetry error; kept as the program's placement position) | — |
| 13 | NY–London ≥ 56 ms per synchronous RTT | Hard ceiling | verified (Microsoft: 5,585 km, 28 ms one way, 56 ms RTT) | c05-tcpip |
| 14 | Branch-edge properties (steering, queueing, aggregation, health, per-app telemetry) | Branch edge | restated-as-design (BEG §3.1); DIA argument left to Ch02 | — |
| 15 | TIC 3.0 Branch Office Use Case current version | Branch edge | verified: Version 3.0, cover dated September 2026 (revision table lists 3.0 as July 2025); BEG §2.2 "versions could not be verified" superseded | c05-ticbo |
| 16 | Policy enforcement parity across redundant links / SD-WAN | Branch edge | verified (new; not in sources) | c05-ticbo |
| 17 | Forwarding decision points must not be easily bypassed or manipulated | Branch edge | verified (new) | c05-ticbo |
| 18 | CISA SASE guide exists (BEG §2.2 "reported, text not retrieved") | SASE above SD-WAN | verified: Version 1.0, June 2026, resource page dated June 24, 2026; PDF read | c05-cisasase |
| 19 | CISA's SASE definition lists SD-WAN among networking tools; SWG, CASB, ZTNA, NGFW | SASE above SD-WAN | verified | c05-cisasase |
| 20 | BEG §2.3 "What CISA does say about SD-WAN … is procurement-oriented" | SASE above SD-WAN | corrected: the June 2026 guide describes SD-WAN architecturally (Figure 2; Appendix C) but still doesn't mandate it | c05-cisasase |
| 21 | Notional architecture: SWG/CASB/NGFW external; SD-WAN internal routing; ZTNA private apps; telemetry to CLAW | SASE above SD-WAN | verified | c05-cisasase |
| 22 | Branch offices: SASE agents or branch NGFWs forwarding to SASE | SASE above SD-WAN | verified | c05-cisasase |
| 23 | CLAW expansion | SASE above SD-WAN | verified: "Comprehensive Log Aggregation Warehouse" (BEG §10 item 3 used "Cloud Log Aggregation Warehouse" — corrected; flag to Ch03 owner) | c05-cisasase |
| 24 | Twin papers: "SD-WAN alone does not satisfy the TIC 3.0 Branch Office use case" | SASE above SD-WAN | restated-as-design (consistent with CISA's capability groups assigning boundary/web/malware to SASE/NGFW) | c05-cisasase |
| 25 | TIC 3.0 is technology-neutral; neither document mandates SD-WAN | SASE above SD-WAN | verified (SASE guide preface "flexible, non-prescriptive"); detail owned by Ch03 | c05-cisasase |
| 26 | Function-to-layer table with control families | SASE above SD-WAN | restated-as-design; control IDs verified in the 5.2.0 catalog | c05-sp80053 |
| 27 | Twin papers: "the policy enforcement point also has a location" | Enforcement point location | verified in substance (Microsoft: cloud security providers can hairpin; evaluate PoP locations and peering) | c05-m365 |
| 28 | INR not available to GCC Moderate | Enforcement point location | cross-referenced to Book 08 App. C (not re-verified here) | B08 |
| 29 | BEG §3.4 Palo Alto NSP incl. Prisma SD-WAN FedRAMP High "19 December 2024" | Authorization table | corrected: GCS-HIGH (FR2317253567) Certified Class D (High) since 2024-12-09; listing names Prisma Access and Prisma SD-WAN | c05-fedramp |
| 30 | BEG §3.4 Zscaler ZIA and ZPA High "1 August 2022" | Authorization table | corrected: ZIA High (FR2227062482) since 2022-07-02; ZPA High (FR1719759604) since 2020-04-29; Moderate listings also exist | c05-fedramp |
| 31 | BEG §3.4 Netskope GovCloud High "9 January 2024" | Authorization table | corrected: listed as Netskope NewEdge Government (FR2105946715), Class D (High), since 2023-12-19 | c05-fedramp |
| 32 | BEG §3.4 Cisco Meraki for Government incl. SD-WAN, Moderate "25 February 2025" | Authorization table | corrected date: Cisco Meraki US Government Region (FR2315535023), Class C, since 2025-02-18; listing names MX security and SD-WAN devices | c05-fedramp |
| 33 | BEG §3.4 "Impact levels for Cisco Umbrella for Government and Cisco SD-WAN for Government could not be verified" | Authorization table | corrected: Cisco Catalyst SD-WAN for Government (FR2012534927) Class C (Moderate) since 2024-03-14; Umbrella is part of Cisco Security Cloud for Government (FR2304757473A), Class D (High) since 2026-08-06 | c05-fedramp |
| 34 | BEG §3.4 Palo Alto DoD IL5 provisional authorization | — | removed (not a FedRAMP Marketplace fact; not re-verified) | — |
| 35 | EIS offers SD-WAN as fully managed, co-managed or DIY | Authorization table | verified (GSA TIC page); BEG §2.3 "TIC FAQ notes EIS provides SD-WAN" not separately re-opened | c05-gsatic |
| 36 | Governed path rests on a Proposed program decision; FMP_122/123/124 open | Governed path | restated-as-design (program canon) | — |
| 37 | NIST SP 800-207: access granted per session | Governed path | verified (tenet 3) | c05-sp800207 |
| 38 | Data-plane tokens authenticate the connection, then the session lives on | Governed path | verified (AWS: token doesn't affect the session after it is established) — new evidence for the source's argument | c05-rds |
| 39 | Managed-identity tokens for Azure PostgreSQL valid up to 24 hours | Governed path | verified (new) | c05-pgfaq |
| 40 | "identity is the new boundary, but only halfway"; TLS session rides minutes to hours | Governed path | restated-as-design (quotation of the program's proposed decision) | — |
| 41 | Flat-LAN deficiency table; OverlayTunnel fields; leased, not opened; token binding | Governed path | restated-as-design (program canon) | — |
| 42 | SPIFFE issues short-lived identity documents (SVIDs) for TLS / JWT | Governed path | verified (example of an existing short-lived workload identity standard) | c05-spiffe |
| 43 | ssot-05 "picks no token format (SPIFFE vs PASETO)" | Governed path | restated: "picks no token format"; PASETO not named (paseto.io unreachable during check) | — |
| 44 | SC-23, AC-12, SC-10, SC-7(4) as assessor hooks | Governed path | verified (titles and statements in 5.2.0) | c05-sp80053 |
| 45 | DRIFT-TRANSPORT sixth class, P2/P4 findings | Governed path | restated-as-design (program canon) | — |
| 46 | ssot-05 "vManage/vSmart/vBond … overlays/cisco/sd-wan.yml" | Governed path | removed vendor component names from this section; current names (Manager, Controller, Validator) used in the security section | c05-ed2603 |
| 47 | Lane discipline: program observes, doesn't route | Governed path | restated-as-design | — |
| 48 | Spec contracts (sdwan.md, sase.md): substrate contract, adapter shape, decision-record schema, boundary disposition, drift, honest limits | Evidence section | restated-as-design; schema shown as illustrative with a warning callout | — |
| 49 | CISA edge device definition (boundary, reachable from public internet) | Securing | verified | c05-bod2602 |
| 50 | BEG §3.2 "CISA issued Emergency Directive 26-03 on 26 February 2026 covering … Cisco SD-WAN" | Securing | corrected date: issued February 25, 2026 (V1 update March 11, 2026); scope Catalyst SD-WAN Manager and Controller; CVE-2026-20127, CVE-2022-20775 added | c05-ed2603 |
| 51 | ED 26-03 required sequence (inventory, collect, patch, hunt, rebuild, harden, CLAW syslog) | Securing | verified | c05-ed2603 |
| 52 | Brief: "the sources cite BOD 26-02 — verify it" | Securing | verified: BOD 26-02, *Mitigating Risk From End-of-Support Edge Devices*, February 5, 2026; 3/12/18/24-month actions | c05-bod2602 |
| 53 | BEG §2.5 BOD 26-04 (10 June 2026) revokes BOD 22-01 and 19-02 | Securing | verified | c05-bod2604 |
| 54 | BEG §2.5 "four-variable risk model selecting one of five remediation windows" | Securing | partially verified: four variables confirmed; window count not stated in page text (table is an image) — chapter says only "shortest window is three days" | c05-bod2604 |
| 55 | Twin papers: "Edge-management-plane products are among the most actively exploited categories in federal networks" | Securing | restated: supported by citing ED 26-03 and BOD 26-02's rationale rather than an unsourced ranking | c05-ed2603, c05-bod2602 |
| 56 | Exposure-to-control table | Securing | restated-as-design; every control ID checked in the 5.2.0 catalog | c05-sp80053 |
| 57 | Internet-facing edges score high on BOD 26-04 exposure | Securing | restated-as-design (working assumption) | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ssot-network-physics/04 — The question, stated precisely | Ch05 "SD-WAN as differentiated transport" | — |
| ssot 04 — SD-WAN as the network mirror of consistency classes (table, diagram) | Ch05 table and Figure ch05-path-classes (reused from staged src-ch04, generalized to branch traffic) | — |
| ssot 04 — 1. Steering and near-geodesic routing | Ch05 "Recovering route inflation" | unsourced ratios replaced with measured and computed figures |
| ssot 04 — 2. Crushing the tail (FEC, duplication, jitter/failover; leverage callout) | Ch05 "Shrinking the tail" | — |
| ssot 04 — 3. Protecting sync traffic from bulk traffic | Ch05 "Keeping bulk traffic off the commit path" | — |
| ssot 04 — The clock angle (Spanner/TrueTime callout) | Ch05 "The clock angle" | PTP-asymmetry mechanism restated as design |
| ssot 04 — The hard ceiling, restated | Ch05 "The hard ceiling" | — |
| ssot 04 — Summary | Ch05 "What this chapter establishes" | — |
| ssot-network-physics/05 — Forward-looking warning | Ch05 "The governed path" warning callout | — |
| ssot 05 — The other half of "identity is the new boundary" (unified thesis) | Ch05 "Identity is the new boundary, but only halfway" | strengthened with NIST 800-207 and AWS/Azure token-lifetime facts |
| ssot 05 — The efficient edge device is necessary but not sufficient (table, diagram) | Ch05 subsection and Figure ch05-overlay-tunnel (reused from staged src-ch05) | `control-planes.yml` / canon-file column dropped (internal file references not linkable) |
| ssot 05 — What the device actually needs: an application-aware overlay (OverlayTunnel callout) | Ch05 "Leased, not opened" | vendor component names dropped here |
| ssot 05 — A flat LAN is a drift generator | Ch05 "A flat LAN is a drift generator" | — |
| ssot 05 — Lane discipline | Ch05 "Lane discipline" | — |
| ssot 05 — Summary | Ch05 closing callout | — |
| modernization-specs/sdwan.md — Substrate contract | Ch05 "The evidence the fabric must emit" | — |
| sdwan.md — Adapter shape | Ch05 evidence section (mission class, class, boundary disposition) | — |
| sdwan.md — Integration shape (sdwan_decision) | Ch05 YAML block | `provenance: ...` envelope placeholder omitted |
| sdwan.md — Boundary treatment | Ch05 evidence section | — |
| sdwan.md — Drift considerations | Ch05 drift table | — |
| sdwan.md — Honest limits | Ch05 evidence section, final paragraph | — |
| modernization-specs/sase.md — Substrate contract (identity-derived access, certificate-anchored overlay, decision records) | Ch05 evidence section | — |
| sase.md — Adapter shape | Ch05 evidence section | — |
| sase.md — Integration shape (sase_decision) | Ch05 YAML block | — |
| sase.md — Drift considerations | Ch05 drift table | — |
| sase.md — Honest limits | Ch05 evidence section | — |
| whitepapers/tic3-sdwan-vs-dia.md — Problem, solution, ask; The false versus; The physics | — | owned by Ch01/Ch02 (brief) |
| tic3-sdwan-vs-dia — TIC 3.0 as the policy gate ("the PEP also has a location") | Ch05 "The enforcement point has a location" | policy-gate detail owned by Ch03 |
| tic3-sdwan-vs-dia — SD-WAN as the transport governor | Ch05 "SASE above SD-WAN" function table | — |
| tic3-sdwan-vs-dia — The governor is itself attack surface | Ch05 "Securing the controller and the edges" | — |
| tic3-sdwan-vs-dia — Decision sequence | — | owned by Ch13; step "governor before traffic" referenced |
| network-transport-and-governance.md (twin) — all sections | Same as tic3-sdwan-vs-dia rows | near-duplicate; its conclusion's "control plane is a high-value target" sentence went to the securing section |
| branch-edge-gap §3.2 — "Adds risk" (ED 26-03, BOD 26-04 patching) | Ch05 "Securing the controller and the edges" | "Redundant" and "Not authorized" owned by Ch02/Ch03 |
| branch-edge-gap §3.4 — Procurement note | Ch05 "Authorization status is not uniform" | every status re-checked and corrected (claims 29–34) |
| branch-edge-gap §8 Rec. 2 — specify the branch-edge layer, not as a CISA mandate | Ch05 "SASE above SD-WAN" (program position paragraph) | full recommendation list owned by Ch13 |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | GSA lists SD-WAN among EIS services for the non-traditional TIC 3.0 use cases | line 127 | verified (kept); `[^c05-gsatic]` now uses the canonical URL (the old one 301-redirects to it) and quotes the page | <https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/enterprise-infrastructure-solutions/trusted-internet-connections> |
| RF-2 | Zscaler Internet Access – Government (FR1720454205, Class C, certified December 14, 2018) and the High offering (FR2227062482, Class D, certified July 2, 2022) are separate listings; new footnote `[^c05-fr-zia]` | Cautions after the Marketplace table (line 127) | verified | <https://www.fedramp.gov/marketplace/products.json> |
