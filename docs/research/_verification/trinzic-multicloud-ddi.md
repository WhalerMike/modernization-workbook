# Verification — Trinzic Alone, or Trinzic Plus Cloud DDI? (research)

File: `docs/research/trinzic-multicloud-ddi.md`
Verified: 2026-10-29 (Moderate-civilian sweep). The page's earlier claims were checked on October 22, 2026 (see the page's Status and review section); this log covers the claims added or reframed on 2026-10-29.

Method:
- Civilian configuration sources (NIST SP 800-53 Rev. 5 CM-2 and CM-6 from NIST's OSCAL catalog; SP 800-70 Rev. 5 and the NCP page; the CIS Benchmarks list; AWS's FedRAMP and Services in Scope pages) come from the coordinator's fact pack, read 2026-10-29.
- Absence claims ("no CIS Benchmark for NIOS") rest on the CIS Benchmarks list as read 2026-10-29.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **reframed** (wording changed, no new fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Design guidance reframed: multi-cloud at Moderate may add Universal DDI whether workloads are in commercial regions or in AWS GovCloud (US) and Azure Government (confirm government-edition feature support there); High or IL4–5 systems in any region: A + C only | The answer in brief | design (labelled) | — |
| 2 | Infoblox Government Cloud certified at Moderate and hosted in AWS GovCloud (US) | The answer in brief | verified (Marketplace data, Oct 22, 2026) | tz-fedramp |
| 3 | AWS publishes FedRAMP scope per service and per Region (Class C East/West; Class D GovCloud) | Footnote | verified 2026-10-29 (fact pack) | tz-fedramp |
| 4 | Deck slide 9 decision table: GovCloud/Azure Government moved from the High row into the Moderate multi-cloud row | Deck | reframed | — |
