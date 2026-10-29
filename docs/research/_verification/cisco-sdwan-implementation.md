# Verification — Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN (research)

File: `docs/research/cisco-sdwan-implementation.md`
Verified: 2026-10-29 (this log covers the Moderate-civilian configuration-baseline changes; the page's original claims were checked on 2026-10-24 and are footnoted on the page)

Method:
- NIST SP 800-53 Rev. 5 CM-6 was read from NIST's OSCAL Rev. 5 catalog. The CIS Benchmarks list, Cisco's IOS XE Software Hardening Guide and AWS's FedRAMP and services-in-scope pages were opened on 2026-10-29.
- Absence claims ("CIS lists no Catalyst SD-WAN Manager benchmark") rest on the CIS Benchmarks list as published on 2026-10-29.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **restated** (an existing fact reworded, source unchanged).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CM-6 leaves the agency to choose its common secure configurations and record deviations | FIPS 140-3, Common Criteria and the configuration baseline table, "Configuration baseline (CM-6)" row | verified (OSCAL catalog, CM-6 statement and discussion) | cs-cm6 |
| 2 | Control components: Cisco's Catalyst SD-WAN Hardening Guide plus CISA's supplemental guidance | Same row | restated (existing sources) | cs-harden, cs-supp |
| 3 | CIS Cisco IOS XE 17.x Benchmark, version 2.2.1 | Same row | verified (CIS list) | cs-cis |
| 4 | Cisco IOS XE Software Hardening Guide, revision 3.2, December 8, 2025 | Same row | verified | cs-iosxe-harden |
| 5 | Edges: draw settings from CIS IOS XE 17.x and Cisco's IOS XE guide, checked against SD-WAN mode | Same row | design (labelled) | — |
| 6 | CIS lists no Catalyst SD-WAN Manager benchmark | Same row | verified (absence on the CIS list) | cs-cis |
| 7 | IOS XE NDM and RTR STIGs: optional cross-check, labelled (High only); not the civilian baseline or what a Moderate assessor expects | "DISA STIGs (High only)" row; *High only* note after the table | restated; the assessor sentence stays *(inference)* | cs-stig |
| 8 | AWS GovCloud (US) is Class D (formerly High); US East/West Class C (formerly Moderate); scope per service and region | Hosted control plane, Cisco government guide bullets | verified | cs-aws-fr |
| 9 | Baselines are cumulative, so GovCloud isn't reserved for High systems; SDWAN-G is a Moderate service in GovCloud | Same bullet | inference (labelled) | cs-aws-fr, cs-fr, cs-gov |
| 10 | "Harden" row and section heading say "configuration baseline" rather than "STIG status" | Guide map; section heading | editorial | — |

Kept unchanged: CISA's quoted "Host Infrastructure in GovCloud" (a CISA fact, `cs-supp`); "The system is High impact ... SDWAN-G is certified at Moderate" (a tier comparison in the on-premises triggers).
