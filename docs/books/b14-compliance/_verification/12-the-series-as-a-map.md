# Verification — Chapter 12, The Series as a Map

Writer W6. Sources: `docs/compliance/federal-compliance-series-moderate/` (README, executive-brief, executive-summary, vol-i … vol-x summaries, books/ lists), `docs/compliance/federal-compliance-series-moderate-overview.md`, `docs/compliance/federal-compliance-series-overview.md`, and the series table, KSI closure matrix, residual-risk table and per-volume control sections of `docs/compliance/Vol_0_Book_00_Executive_Summary.md` (all archived after the build; not linked). Volume-to-book mapping derived from the published books' own GitHub links to each volume file (grep of `docs/books/b00`–`b13`) and the workbook book list. Every linked volume file was confirmed present on `origin/main` with `git ls-tree` (October 21, 2026). Primary sources opened October 21, 2026: SP 800-37 Rev. 2 PDF, SP 800-53 Rev. 5.2.0 OSCAL catalog and Moderate profile, FedRAMP Collaborative Continuous Monitoring and Agency Use rules pages.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Series of eleven volumes organized by layer | Opening | verified (series' own description) | Series overview |
| 2 | Volume → book mapping | Map table, diagram | verified (books' links to volume files; book list) | Workbook books |
| 3 | Control families per volume | Map table | restated-as-design (the series' own closure claims, judged by Ch04's rule; counts dropped) | Executive summary tables |
| 4 | Vols V–VII, IX, X close no new controls; CM-5 the one new control number in VI–IX | Map table | restated-as-design (series' own claim) | Executive summary |
| 5 | Book 17 has no volume behind it | Map table | verified (no volume covers AI identity) | Volume list |
| 6 | All linked volume files exist on main | Volume files table | verified | git ls-tree origin/main |
| 7 | Volumes describe agency evidence feeding "the FedRAMP 20x KSI pipeline"; KSIs bind providers | Volume caveat | corrected | Book 13 Ch11; Book 12 Ch12 |
| 8 | Volumes describe BOD 26-04 as SBOM directive | Volume caveat | corrected | Chapter 11 (BOD 26-04 page) |
| 9 | Naming/identity floor first; assurance last; build-and-run across | Dependencies | restated-as-design | Volume summaries |
| 10 | Expected first-assessment findings | Findings table | restated-as-design (program expectations; product names and the Route 53 platform claim dropped) | Executive summary residual-risk table |
| 11 | Source: under FedRAMP 20x, POA&M items no longer trigger deadlines for the agency | Findings section | corrected (FedRAMP rules bind providers; agency POA&M under CA-5; KEV clocks from BOD 26-04) | SP 800-53 CA-5; SP 800-37 A-6; Book 12 Ch06 |
| 12 | Risk acceptance can't be delegated | Residual risk | verified | SP 800-37r2 Task R-4 |
| 13 | CA-2(1), CA-7(1) in Moderate baseline | Residual risk 1 | verified | 5.2.0 catalog and Moderate profile |
| 14 | Automated tools may not generate information for every control; manual assessments fill gaps | Residual risk 2 | verified | SP 800-37r2 App. F |
| 15 | Agencies must review each OCR; must notify FedRAMP of rescission-level concerns | Residual risk 3 | verified | CCM-AGM-ROR; AGU-USE-NFC |
| 16 | Source: PE family inherited from the CSP data-center authorization | Residual risk 3 | corrected (only where the system runs on a certified cloud service; on premises the agency owns PE) | — |
| 17 | Mission, insider, physical, geopolitical supply chain outside control evaluation | Residual risk 5 | restated-as-design | Vol IV Book 06 §7.2 |
| 18 | Cross-agency federation and per-consumer OSCAL SSP generation not yet built | Residual risk 6 | verified (Book 13 states it) | Book 13 Ch11, Ch12 |
| 19 | Program rule set covers only part of FedRAMP's indicators | Residual risk | restated (source's own reconciliation; counts dropped) | Executive summary |
| 20 | "10 of 29", "19 of 46", "34 distinct controls", "89+ controls" | — | removed (internal, dated counts) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Moderate README: start here, volume table | Map table | — |
| README: engine-neutral by design | Chapter 11 contract subsection | Not repeated here |
| README / overview / executive summary: one lifecycle (five-clause path) | — | Covered in Book 13 Ch04 and this book's Ch04 |
| federal-compliance-series-overview.md (redirect stub) | — | Nothing to carry |
| Moderate overview: eleven volumes, how controls close, entry points, leadership takeaway | Opening; conventions | Academy entry points go to planned Book 16 |
| executive-brief.md / executive-summary.md (twins) | Opening; residual risk "honest limits" | Remaining content is Chapters 01–04 |
| vol-i summary | Map row; dependencies | — |
| vol-ii summary | Map row | — |
| vol-iii summary | Map row | "KSI pipeline" wording corrected |
| vol-iv summary | Map row; dependencies (open-finding point) | — |
| vol-v summary | Map row | — |
| vol-vi summary | Map row; dependencies | — |
| vol-vii summary | Map row | Platform recommendation not carried (product) |
| vol-viii summary | Map row; dependencies (near the root) | — |
| vol-ix summary | Map row | Four day-2 rules left to planned Book 15 |
| vol-x summary | Map row | Covered in Book 13 Ch11 |
| books/*.md lists | Volume files table | — |
| Executive Summary: series overview table | Map table; volume files table | Product "core technology" column dropped |
| Executive Summary: FedRAMP 20x deadlines, broader federal clock | — | Chapter 02 |
| Executive Summary: coverage arithmetic (10 of 29) | Residual risk (partial rule set) | Counts dropped |
| Executive Summary: KSI closure necessity matrix | Residual risk; Chapter 04 | Internal rule IDs and slots dropped |
| Executive Summary: residual compliance risk table | "What the first assessment will find" | Product columns generalized; FedRAMP 20x note corrected |
| Executive Summary: per-volume control-closure sections (Vol I Books 01–06, Vol II, Vols III–IV, VI–IX) | Map table families | Counts and product names dropped; per-control index is Appendix A |
| Executive Summary: combined closure summary and count comparison | — | Not carried (internal counts) |
| Executive Summary: "what closed means under FedRAMP 20x" | — | Chapter 04 and Chapter 11 |
| Vol IV Book 06 §7.2 residual risks outside KSI scope | Residual risk item 5 | PE claim corrected |
