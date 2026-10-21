# Verification — Appendix B, The Engagement Archetype (Illustrative)

Writer: W5. Sources: `docs/case-studies/federal-modernization-case-study.md` (framing pattern), `docs/case-studies/federal-modernization.md` (cleaned framing pattern). Canonical frame: Book 01 Chapter 12 phases and gates. All checks October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Pattern is not a real engagement; no identifiers, metrics, timelines | Callout | kept (source's own posture) | Case study callout; framing footer |
| 2 | Agency-scale archetype; structural intervention under the tool stack | Archetype | restated-as-design | Case study |
| 3 | "Install the `fmp` package; run `fmp substrate walk`"; "substrate" | Step 1 | removed product/CLI names; restated as platform host, repository, estate walk, schema validation | Brief: no engine or product names |
| 4 | Starting state: "M365 GCC-Moderate primary" | Starting state | restated generically (government community cloud tenant); classification labels are Book 10's | Book 10 Ch03 (settled) |
| 5 | "Telemetry from 20+ tools" | Starting state | restated as "many tools" (illustrative number not carried) | — |
| 6 | Five steps mapped to Book 01 phases | Mapping table | restated-as-design | Book 01 Ch12 |
| 7 | Sequencing identity → addressing → overlay → telemetry → automation → runtime governance | Mapping intro | kept as the pattern's rule; Book 01 canonical | framing pattern |
| 8 | ATO package migration (agency) | Corrections | verified: agency authorizes its own systems; no standalone ATO for a CSO | FedRAMP, Using a FedRAMP Certified Cloud Service |
| 9 | "KSI dashboards" in the agency's package | Corrections | corrected: KSIs are FedRAMP 20x provider-side indicators | FedRAMP, Key Security Indicators |
| 10 | SSP, POA&M, Component Definitions emitted | Corrections | verified as OSCAL models; added the layer list | NIST OSCAL, Layers and Models |
| 11 | SLA tempo P1 immediate / P2 1 h / P3 24 h / P4 72 h | Drift tempo | restated-as-design; flagged as differing from master plan defaults (Ch10) | Case study; master plan §9.3 |
| 12 | Metrics list; "3PAO re-execution" | Measures | kept; "3PAO" generalized to an independent assessor (FedRAMP 2026 terminology not asserted) | — |
| 13 | "Substrate adoption typically reduces tool count" | Measures | restated as an expectation to measure | — |
| 14 | "Cost of long-term audit retention drops" | Properties | corrected/qualified: records schedules still apply; claim is a hypothesis | Book 01 Ch09 (settled, GRS 3.2) |
| 15 | Three structural properties | Properties | restated-as-design | Case study |
| 16 | Lessons propagate as ADRs/canon/adapter-registry changes | Lessons | restated (decision record, repository update, adapter change) | Case study |
| 17 | Promotion criteria | Publication | kept | Case study |
| 18 | Framing lessons (fund as sequence; conditions for continuous authorization; governed arc; gates on evidence quality) | Lessons | kept, restated | federal-modernization.md |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Case study: front matter and "Framing pattern" callout | Callout "A framing pattern, not a real engagement" | — |
| Case study: diagram (old PNG) | — | Old PNG not reused; the mapping table carries it; no new diagram (appendix) |
| Case study: Engagement archetype | "The archetype" | Product name removed |
| Case study: Starting state (typical) | "The typical starting state" table | Merged with framing's starting state |
| Case study: Intervention pattern, Phases 1–5 | Mapping table | CLI names removed; links replaced by book links |
| Case study: Substrate behaviors observed (pattern) | "What a real engagement would have to report" | — |
| Case study: Why structurally different | "Why the pattern differs" | Retention claim qualified |
| Case study: Lessons that propagate back | "What an engagement teaches the program" | — |
| Case study: Promotion to real engagement | "From pattern to published case study" | — |
| Case study: Related documents | — | Replaced by in-text book links; canon references not linked (archived) |
| Framing: Starting state | Archetype; starting-state table | — |
| Framing: Intervention | Mapping intro (sequencing rule) | — |
| Framing: Observed behavior (intended) | Lessons list (gates on evidence quality) | "Mission value delivered early" kept implicitly; not a measured claim |
| Framing: Lessons | Lessons list | — |
| Framing: footer | Callout | — |
