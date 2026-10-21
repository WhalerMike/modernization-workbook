# Verification — Appendix C, Glossary

Checked October 21, 2026. External definitions verified against rfc-editor.org (RFCs 2865, 3031, 4120, 5216, 7858, 8484, 9190), itu.int (G.114), nvlpubs.nist.gov and csrc.nist.gov (SP 800-53 Rev. 5, SP 800-53B, SP 800-37 Rev. 2, SP 800-207, FIPS 203, FIPS 140-3 and its transition page), cisa.gov (BOD 26-02, BOD 26-04, ED 26-03, KEV, Protective DNS, the TIC program page, Security Capabilities Catalog v3.3, the June 2026 SASE guidance, the 2021 NCPS Cloud Interface RA), fedramp.gov (What's Changing, Timeline, Notice 0004), gsa.gov (EIS, TIC/MTIPS), whitehouse.gov (M-19-26, M-26-14, M-26-15) and Microsoft Learn. IEEE 802.1X-2020 is cited from a search result (standards.ieee.org). Terms that are the program's own (governor, residual architecture, phase inversion, path class, consistency class, deterministic egress, governed-path transport) carry no footnote. Footnote keys drop the `aC-` prefix.

## 1. Claims log

| # | Claim (short) | Entry | Verdict | Source |
|---|---|---|---|---|
| 1 | AC-17, SC-7, SC-7(4), SC-8(1), SI-4 definitions | Several | verified | sp80053 |
| 2 | SC-8(3), SC-8(4) in no baseline; CP-8(2) Moderate/High; CP-8(3) High only | SC-8; CP-8 | verified | sp80053b |
| 3 | Optimize/Allow/Default definitions | Allow, Default and Optimize | corrected: current Learn no longer defines Allow and Default; entry defines Optimize only, from the split-tunnel page | m365ws |
| 4 | BOD 26-04 revoked BOD 19-02 and 22-01 | BOD | verified | bod2604 |
| 5 | CAE tokens up to 28 hours | CAE | verified | cae |
| 6 | CLAW expansion | CLAW | corrected: current name is Comprehensive Log Aggregation Warehouse (SASE guidance, Program Guidebook v1.2); "Cloud" was the earlier name (2021 NCPS CIRA). The source glossary (BEG §9) had it backward | sase |
| 7 | DIA ≠ DISA circuit; DISA's network is DISN | DIA | verified via Ch02 (footnoted there); DISN entry folded into DIA | Ch02 |
| 8 | DoH RFC 8484, DoT RFC 7858 | DoH and DoT | verified | rfc8484; rfc7858 |
| 9 | EAP-TLS RFC 5216, RFC 9190 | EAP-TLS | verified | eaptls |
| 10 | ED 26-03 date | ED | corrected: February 25, 2026 (source: February 26) | ed2603 |
| 11 | Edge device definition; 18 months | Edge device | verified | bod2602 |
| 12 | EIS option periods | EIS | verified | eis |
| 13 | FedRAMP certification vocabulary; mandatory January 1, 2027; Rev. 5 valid to at least December 31, 2028 | FedRAMP; Certification Class | verified (two fedramp.gov pages) | fedramp |
| 14 | Class C includes the former Moderate baseline | Certification Class | verified (Notice 0004) | fr0004 |
| 15 | No FedRAMP Moderate control count citable after Notice 0013 | FedRAMP (source) | not carried into the glossary (Ch03 owns) | — |
| 16 | FIPS 140-2 to Historical List September 22, 2026 | FIPS 140-3 | verified (page also says September 21) | fips |
| 17 | G.114: 150 ms transparent interactivity; 400 ms planning limit; 5 µs/km fiber | ITU-T G.114; Propagation delay | verified; 150 ms wording updated to the 2003 edition's phrasing; 5 µs/km marked provisional in the footnote | g114 |
| 18 | Kerberos RFC 4120; Windows doesn't use the address field by default | Kerberos | RFC verified; registry defaults owned and footnoted by Ch06 | rfc4120 |
| 19 | KEV definition | KEV | verified | kev |
| 20 | LEO lower delay than geostationary | LEO | restated with a link to Ch02's ITU planning values | Ch02 |
| 21 | INR not for GCC Moderate; physics series' "INR" was identity-aware routing | INR | verified; disambiguation added | inr |
| 22 | M-22-09 operative, deadlines passed | M-22-09 | owned and footnoted by Ch03 | Ch03 |
| 23 | M-26-14 rescinds M-21-31; five-level model | M-26-14 | verified | m2614 |
| 24 | M-26-15 PQC requirement | M-26-15 | verified | m2615 |
| 25 | ML-KEM FIPS 203 | ML-KEM | verified | fips203 |
| 26 | MPLS RFC 3031; MPLS VPN doesn't encrypt | MPLS | RFC verified; non-encryption from RFC 4364, footnoted in Ch02 and linked | rfc3031 |
| 27 | MTIPS under EIS, Traditional use case | MTIPS | verified | mtips |
| 28 | PEP definition | PEP | verified (SP 800-207 §3.1) | sp800207 |
| 29 | Protective DNS: E3A successor, launched 2022, mandated | Protective DNS | verified | pdns |
| 30 | RADIUS RFC 2865 | RADIUS | verified | rfc2865 |
| 31 | CISA SASE guidance describes SASE as a TIC 3.0 path; no requirement | SASE | verified (existence, guidance status); "no federal instrument requires it" owned by Ch03 | sase |
| 32 | SCC Version 3.3, September 2026 | Security Capabilities Catalog | verified; revision history says July 2025, noted | scc |
| 33 | Significant change definition | Significant change | verified | sp80037 |
| 34 | SQL Server default instance TCP 1433 | TDS | verified (Microsoft doesn't use "TDS" on that page; the protocol name is the book's) | sqlport |
| 35 | Tenant restrictions v2 enforcement options | Tenant restrictions v2 | verified | trv2 |
| 36 | Thunderdome components (SASE, SD-WAN, CESS, app stacks) | Thunderdome | removed (disa.mil unreachable; components only in secondary coverage) | — |
| 37 | M-19-26 established TIC 3.0, rescinded M-08-05 | TIC 3.0 | verified | m1926 |
| 38 | Four TIC 3.0 use cases | TIC 3.0 use cases | verified | tic |
| 39 | TICAP definition | TICAP | verified (quoted from the SCC) | scc |
| 40 | Token protection: device-bound session tokens | Token protection | verified | tokenprot |
| 41 | IEEE 802.1X-2020 current edition | 802.1X | verified from search result only | 8021x |
| 42 | Policy enforcement parity as a TIC 3.0 universal capability | Policy enforcement parity | restated with a link to Ch12, which footnotes it | Ch12 |

## 2. Carry-forward ledger — *The Branch Edge Gap* §9 Glossary

| Source term | Went to | Or why not carried |
|---|---|---|
| AC-17 | App C | — |
| CLAW | App C (name corrected) | — |
| DIA | App C (plus "dedicated internet access" note) | — |
| FedRAMP | App C, split into FedRAMP and FedRAMP Certification Class | Control-count note left to Ch03 |
| Hairpin routing | App C | — |
| Kerberos | App C | Lifetime and skew figures left to Ch06 |
| MTIPS | App C | Networx and WITS 3 dates left to Ch03 and Ch10 |
| Phase inversion | App C | — |
| SASE | App C (updated: CISA now has guidance naming SASE) | Source's "CISA has not published a SASE definition" is superseded |
| SD-WAN | App C | — |
| SC-7 / SI-4 | App C, as separate entries plus SC-7(4) | — |
| SNAT | App C, merged with NAT | — |
| TDS | App C | — |
| TIC 3.0 | App C | — |
| ZTNA | App C | — |

Terms added from the other sources and chapters: access point, address continuity, Allow/Default/Optimize, application-aware steering, authorizing official, BOD, boundary change, branch-edge policy layer, CAE, chattiness, Conditional Access, consistency class, CP-8, deterministic egress, DoH/DoT, EAP-TLS, ED, edge device, EIS, FEC, FIPS 140-3, governor, governed-path transport, G.114, jitter, KEV, LEO, local breakout, logical centralization, managed interface, INR, M-22-09, M-26-14, M-26-15, ML-KEM, MPLS, path class, PEP, PoP, policy enforcement parity, PQC, propagation delay, Protective DNS, RADIUS, residual architecture, RTT, SC-8, Security Capabilities Catalog, significant change, telecommunications diversity, tenant restrictions v2, TIC 3.0 use cases, TICAP, token protection, traffic flow policy, 802.1X.
