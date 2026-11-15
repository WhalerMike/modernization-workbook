# Verification — Trinzic Alone, or Trinzic Plus Cloud DDI? (research)

File: `docs/evaluations/trinzic-multicloud-ddi.md`
Verified: 2026-10-29 (Moderate-civilian sweep). The page's earlier claims were checked on October 22, 2026 (see the page's Status and review section); this log covers the claims added or reframed on 2026-10-29.

Method:
- Civilian configuration sources (NIST SP 800-53 Rev. 5 CM-2 and CM-6 from NIST's OSCAL catalog; SP 800-70 Rev. 5 and the NCP page; the CIS Benchmarks list; AWS's FedRAMP and Services in Scope pages) come from the coordinator's fact pack, read 2026-10-29.
- Absence claims ("no CIS Benchmark for NIOS") rest on the CIS Benchmarks list as read 2026-10-29.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **reframed** (wording changed, no new fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Design guidance: multi-cloud at Moderate may add Universal DDI for workloads in the commercial regions (confirm government-edition feature support); High systems in any region: A + C only | The answer in brief | design (labelled); GovCloud alternative dropped November 15, 2026 (WD-156) | — |
| 2 | Infoblox Government Cloud certified at Moderate and hosted in AWS GovCloud (US) | The answer in brief | verified (Marketplace data, Oct 22, 2026) | tz-fedramp |
| 3 | AWS publishes FedRAMP scope per service and per Region (Class C East/West) | Footnote | verified 2026-10-29 (fact pack) | tz-fedramp |
| 4 | Deck slide 9 decision table: GovCloud moved from the High row into the Moderate multi-cloud row | Deck | reframed | — |

## Government-cloud rule (November 15, 2026)

Under WD-156 the program's AWS workloads run in the commercial Regions. The page no longer offers AWS GovCloud (US) as a Moderate location (claim 1), and the discovery sentence, option C's limit, the status note and the footnote's GovCloud column were trimmed (claim 3). Kept: Infoblox Government Cloud's hosting in AWS GovCloud (US) (claim 2), a fact about where the vendor's service runs. Claim 4 describes the released deck, which the deck pass updates.
