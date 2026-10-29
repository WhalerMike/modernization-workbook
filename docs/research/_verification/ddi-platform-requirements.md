# Verification — What a Federal DDI Platform Must Do (research)

File: `docs/research/ddi-platform-requirements.md`
Verified: 2026-10-29 (Moderate-civilian sweep). The page's earlier claims were checked on October 22, 2026 (see the page's Status and review section); this log covers the claims added or reframed on 2026-10-29.

Method:
- Civilian configuration sources (NIST SP 800-53 Rev. 5 CM-2 and CM-6 from NIST's OSCAL catalog; SP 800-70 Rev. 5 and the NCP page; the CIS Benchmarks list; AWS's FedRAMP and Services in Scope pages) come from the coordinator's fact pack, read 2026-10-29.
- Absence claims ("no CIS Benchmark for NIOS") rest on the CIS Benchmarks list as read 2026-10-29.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **design** (labelled *(design guidance)*); **reframed** (wording changed, no new fact).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Before-you-buy evidence: the hardening guidance for the agency's CM-6 settings (CIS Benchmark, vendor hardening guide or NCP checklist); DISA STIG optional (High only) | What it covers | verified | ddireq-cm6, ddireq-ncp |
| 2 | No CIS Benchmark for Infoblox NIOS, so its DISA STIGs are the only product-specific checklists there | What it covers | verified (absence on the CIS list) | ddireq-cis |
| 3 | Deck slide 8 row "DISA STIG" replaced by "Hardening guide"; slide 9 row relabelled "DISA STIG (High only)" | Deck | reframed | — |
