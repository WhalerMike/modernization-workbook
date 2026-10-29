# Verification — Infoblox DDI for Federal Agencies (research)

File: `docs/research/infoblox-ddi-federal.md`
Verified: 2026-10-29 (Moderate-civilian sweep). The page's earlier claims were checked on October 22, 2026 (see the page's Status and review section); this log covers the claims added or reframed on 2026-10-29.

Method:
- Civilian configuration sources (NIST SP 800-53 Rev. 5 CM-2 and CM-6 from NIST's OSCAL catalog; SP 800-70 Rev. 5 and the NCP page; the CIS Benchmarks list; AWS's FedRAMP and Services in Scope pages) come from the coordinator's fact pack, read 2026-10-29.
- Absence claims ("no CIS Benchmark for NIOS") rest on the CIS Benchmarks list as read 2026-10-29.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **reframed** (wording changed, no new fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Strength restated: a published product-specific hardening checklist for NIOS 9.x (DISA STIG, High only) to cross-check the agency's settings; CIS has no NIOS benchmark | Findings in brief | verified (absence) + reframed | ibx-cis |
| 2 | CM-6 leaves the choice of common secure configuration to the agency | Footnote ibx-cis | verified | NIST SP 800-53 Rev. 5 CM-6 |
| 3 | Module 2 description: hardening baseline (CM-6 settings from SP 800-81r3; STIGs optional, High only) | What it covers | reframed | — |
| 4 | Deck: Assurance slide retitled "Assurance: baselines, FIPS 140, NIAP and SP 800-81r3"; Trinzic decision row split into Moderate (commercial, GovCloud or Azure Gov: confirm government-edition support) and High/IL4–5 (A + C only) | Deck | reframed; facts carried from the Oct 22 check | — |
