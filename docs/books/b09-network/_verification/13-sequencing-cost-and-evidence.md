# Verification — Chapter 13, Sequencing, Cost and Evidence

Checked October 21, 2026 against gao.gov (GAO-14-63, GAO-19-58, GAO-22-106195, GAO-25-107114, GAO-25-107795, GAO-26-107530, GAO-26-107919, OIG-25-1), gsa.gov (EIS Public Pricer, MTIPS features and price structure), CRS IF11668 (everycrsreport.com), nvlpubs.nist.gov (SP 800-37 Rev. 2 Appendix F, SP 800-53 Rev. 5), cisa.gov (TIC Program Guidebook v1.2), whitehouse.gov (M-26-14), the UK CMA egress-fees working paper, and third-party sources labeled as such (Cambridge TR-914, Flexera, Uptime Institute, a16z, TeleGeography, ExecutiveBiz). Sources: *The Branch Edge Gap* v2 (`docs/whitepapers/branch-edge-gap.md`) §§6–8, *The Long Interim* §§2.7 and 8, and the twin papers `docs/whitepapers/tic3-sdwan-vs-dia.md` and `docs/whitepapers/network-transport-and-governance.md`; none linked from the chapter. Footnote keys drop the `c13-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Five-step decision sequence plus step zero | Decision sequence | restated-as-design (twin papers; step zero from Ch05) | — |
| 2 | Significant change definition; event-driven authorization | Step 3 | verified | sp80037 |
| 3 | SC-7(4) exception documented with mission need and duration; reviewed | Step 4 | verified | sp80053 |
| 4 | Out-of-order is "the single most common and most costly mistake" | Sequence | restated-as-design ("in the program's experience") | — |
| 5 | Bare local breakout is a compliance regression with better latency | Sequence | restated-as-design (argued in Ch02) | — |
| 6 | No OMB/CISA/EO instrument specifies the phase sequence | Phases | restated-as-design (negative claim from the source's review; argued as engineering) | — |
| 7 | Phase table 0–4 | Phases | restated-as-design | — |
| 8 | Phase inversion mechanism; composed claim undocumented | Phase inversion | restated-as-design (labeled the program's inference) | — |
| 9 | GAO-19-58 quotes, 16 agencies | Evidence | verified (April 4, 2019) | gao1958 |
| 10 | GAO-22-106195 four challenges; "inconsistent data" | Evidence | verified | gao22106195 |
| 11 | GAO-26-107530: 17 of 24 agencies; Commerce quote | Evidence | verified; Commerce quote is in the PDF body; continuation quote added | gao26107530 |
| 12 | CISA Guidebook cost passage | Evidence | verified (wording per Guidebook v1.2) | guidebook |
| 13 | OIG-25-1 egress fees omitted; no formal procedures | Evidence | verified | oig251 |
| 14 | Cambridge TR-914: 10 µs noticeable, 50 µs significant, Memcached >20% at 100 µs | Evidence | verified (November 2017); 100 µs direction not stated by the paper, so not characterized | tr914 |
| 15 | a16z "Cost of Cloud" and rebuttals don't discuss transport | Evidence | verified for the a16z article's existence and date; absence of transport discussion restated from the source's review | a16z |
| 16 | Flexera 2026: 29% wasted, 750+ respondents | Competing | verified (753 respondents; "up for the first time in five years"); "self-estimated" softened to "estimated" | flexera |
| 17 | CMA: egress 0–5% of revenues; majority <1% of spend | Competing | verified (Tables 2.2 and 2.3; redacted ranges) | cma |
| 18 | GAO-25-107114: six agencies unable to specify cost | Competing | corrected: four of six reported increases; "unable to specify" said per increase type | gao25107114 |
| 19 | Uptime: 33% moved apps back, 6% left entirely; "impact is overstated" | Competing | verified; dated to the 2022 survey (March 2023 article) | uptime |
| 20 | "71% will repatriate" vendor survey | Competing | removed as a figure; kept as a warning not to cite such claims | — |
| 21 | Four-step "already inverted" correction | Already inverted | restated-as-design | — |
| 22 | GAO has never quantified realized EIS savings | Public record | restated as "the sources found no GAO quantification"; latest EIS report is GAO-26-107919 (August 2026), not GAO-20-155 | gao26107919 |
| 23 | No agency published before/after SD-WAN figures; no federal WAN/MPLS cost figure | Public record | restated as not found by the sources | — |
| 24 | No downloadable EIS price list; pricer has no bulk export | Public record | corrected: the Public Pricer offers downloads of awarded services and CLIN data | pricer |
| 25 | MTIPS priced ICB and excluded from the pricer | Public record | corrected: GSA says MTIPS pricing is in the EIS pricing tool; monthly port charge, optional features separate | mtips |
| 26 | GAO-14-63: $329M missed savings, 28.4%, $66.4M (44%) overrun | Citable table | verified | gao1463 |
| 27 | $2.08B projected cost of the Networx extension (GSA case study) | Citable table | removed (untraceable); replaced with GAO-26-107919's 206% billing increase | gao26107919 |
| 28 | 37 task orders over $7.4B (case study) | Citable table | verified via trade-press report; attributed to ACT-IAC, not GSA; study itself not retrievable | actiac |
| 29 | GAO-25-107795: ~80% of >$100B to O&M | Citable table | verified | gao25107795 |
| 30 | CRS IF11668: $50B; ~$2.5B in FY2019 | Citable table | verified | crs |
| 31 | GAO-26-107919: $13.4M to $40.9M, 206%; delays over three years | Citable table | verified (opened directly) | gao26107919 |
| 32 | MPLS 3–10× broadband claimed by vendors without method | MPLS multiple | restated-as-design (source's survey of the claim) | — |
| 33 | TeleGeography: DIA cheaper; NYC 20 Mbps slight discount, one significant, two premium | MPLS multiple | verified; dated to Q4 2019 data (April 2020) | telegeo |
| 34 | Cost-structure table by architecture | Cost structure | restated-as-design (program analysis) | — |
| 35 | Zscaler GSA per-user price $59–$185 | SASE term | removed (no public GSA list found; a reseller list shows other figures) | — |
| 36 | SASE per-user subscription is the term most often omitted | SASE term | restated-as-design | — |
| 37 | Four compute mechanisms and their measurements | Mechanisms | restated-as-design | — |
| 38 | Worked example: 40 × $0.192 × 8,760 = $67,277; 10% = $6,728 | Worked example | verified arithmetic (67,276.8; 6,727.68); inputs labeled assumptions | — |
| 39 | Four larger cost categories | Worked example | restated-as-design | — |
| 40 | 12–18% CPU and $200,000–$400,000 figures | Stop doing | removed as figures; named only as withdrawn, unsourced claims | — |
| 41 | Evidence the package needs (paths, QoS, failover, monitoring, limitations) | Evidence | restated-as-design (Branch Edge Gap Rec. 5), extended with decision records (Ch05), exceptions (App A) and CLAW parity (Ch03) | — |
| 42 | M-26-14 network address logging quote | Evidence | verified | m2614 |
| 43 | Paired-branch study design | Confirm or refute | restated-as-design | — |
| 44 | Three phase-inversion measurements | Confirm or refute | restated-as-design | — |

## 2. Carry-forward ledger

### *The Branch Edge Gap* (v2)

| Source page § | Went to | Or why not carried |
|---|---|---|
| Status and scope; how v2 differs | — | Document history of the source paper; corrections it records are applied in each owning chapter |
| §1 Executive summary, Findings 1–5 | Ch03 (F1); Ch02 (F2); Ch06 (F3, F4); Ch13 (F5) | Summary not reproduced |
| §1 "What this paper deliberately does not do" | Ch13, worked example and stop doing | — |
| §2.1–2.3 TIC history, document set, precise requirements | Ch03 | Owned by Ch03 |
| §2.4 The honest (evidence) argument | Ch03; Ch13 evidence section | — |
| §2.5 Policy currency | Ch03 | Owned by Ch03 |
| §2.6 FedRAMP doesn't constrain routing | Ch03; App C | — |
| §3.1–3.3 What DIA gives you; the fallacy; architectures | Ch02, Ch05, Ch08 | Owned elsewhere |
| §3.4 Procurement note (FedRAMP status) | Ch05 | Owned by Ch05 |
| §4.1–4.3 Legacy protocols, Kerberos, round trips | Ch06 | Owned by Ch06 |
| §5 Token-based access | Ch06 | Owned by Ch06 |
| §6 intro (withdrawn figures) | Ch13 stop doing | — |
| §6.1 Mechanisms worth measuring | Ch13 table | — |
| §6.2 Paired branch study | Ch13 confirm or refute | — |
| §6.3 Worked example | Ch13 | — |
| §6.4 What to stop doing | Ch13 | — |
| §7.1 Dependency is technical; phase table | Ch13 phases | — |
| §7.2 Phase inversion | Ch13 | — |
| §7.3 Already inverted | Ch13 | — |
| §8 Rec. 1 (adopt use case, document mapping) | Ch03 | Owned by Ch03 |
| §8 Rec. 2 (specify branch-edge layer in SASE acquisitions) | Ch05; Ch10 BOD 26-02 attribute list | — |
| §8 Rec. 3 (sequencing as documented dependency) | Ch13 | — |
| §8 Rec. 4 (measure the cost) | Ch13 | — |
| §8 Rec. 5 (routing policy as authorization artifact) | Ch13 evidence section | — |
| §8 Rec. 6 (audit AD dependencies) | Ch06; Ch10 action 7 | — |
| §9 Glossary | App C (see its ledger) | — |
| §10 Sources and verification status | Footnotes across the book; App B | Re-verified rather than trusted |
| Appendix A change log | — | Source document history; each correction is applied in its owning chapter |

### Twin papers (`tic3-sdwan-vs-dia.md`, `network-transport-and-governance.md`)

| Source page § | Went to | Or why not carried |
|---|---|---|
| Problem / solution / ask; the false versus | Ch02 | Owned by Ch02 |
| The physics | Ch01 | Owned by Ch01 |
| TIC 3.0 as the policy gate | Ch03 | Owned by Ch03 |
| Transport menu; SD-WAN as governor; governor as attack surface | Ch02, Ch05 | Owned elsewhere |
| Decision sequence / order of operations | Ch13 decision sequence (Ch02 introduces; Ch09 assigns owners) | — |
| Conclusion | Ch13 (compliance regression with better latency) | — |

### *The Long Interim* §§2.7 and 8

See the ledger in `10-the-long-interim.md`; every row marked "Ch13" is carried here.

## Additions, October 23, 2026 (federal framework crosswalk follow-up)

Every claim was checked against the primary source on October 23, 2026. Sources: research briefs on investment and acquisition, and on service, accessibility and records (program working files).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Cost structure maps to capital planning's investment record | Measuring cost | restated-as-design; requirements verified in B00 App. C | 40 U.S.C. §11312; A-11 §55; TMF FPP App. B |

## Corrections, October 23, 2026 (federal-sources inventory)

Found by the workbook-wide sweep of federal citations for the Federal Framework Crosswalk; each was checked against the primary source on October 23, 2026.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | TIC Program Guidebook cited as v1.2, July 2025 | Note c13-guidebook | corrected to the September 2026 reissue (v1.2); quoted passage confirmed unchanged | CISA TIC 3.0 Program Guidebook, Sept 2026 |
