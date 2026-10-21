# Verification — Chapter 11, Reciprocity, Indicators and One Authorization

Writer W6. Sources: `docs/executive-briefs/reciprocity-single-ato-overview.md`, `docs/executive-briefs/ksi-conformance-overview.md` (both archived after the build; not linked) and `docs/compliance/Vol_X_Book_00_Governance_Substrate_Integration_Overview.md` (stays; linked on GitHub). Primary sources opened October 21, 2026: OMB M-24-15 PDF (whitehouse.gov, text extracted with pypdf), FedRAMP's M-24-15 authority page, NIST SP 800-37 Rev. 2 PDF, OMB Circular A-130 PDF, FedRAMP "Using a FedRAMP Certified Cloud Service," Agency Use rules page, Collaborative Continuous Monitoring page, Key Security Indicators page, Definitions page, Security Decision Record page, 20x Class C FedRAMP Certification page, the machine-readable ruleset `fedramp-consolidated-rules.json` v2026.10.13.01 from GitHub, the SP 800-53 Rev. 5 OSCAL catalog 5.2.0, and the FIPS 198-1 and FIPS 186-5 CSRC pages.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | RMF developed in part to "encourage reciprocity" | Opening | verified | SP 800-37r2 §1.1 |
| 2 | FedRAMP Authorization Act (2022) and M-24-15 (2024) make reuse the default | Opening | verified | M-24-15 §IV.a; FedRAMP M-24-15 authority page (Act of December 2022) |
| 3 | NIST definition of reciprocity | What reciprocity means | verified | SP 800-37r2 glossary; §1.1 fn. 9 |
| 4 | A-130 lists reciprocity alongside ongoing authorization decisions | Same | verified | A-130 Appendix I, RMF discussion |
| 5 | ATU: mechanism and "form of" reciprocity; same responsibility as ATO; customer's information; requires valid ATO by a federal entity; package review as fundamental basis | Mechanisms table | verified | SP 800-37r2 App. F, Authorization to Use |
| 6 | Joint authorization: same or different organizations, jointly accept risk, in effect only while AOs agree; CA-6(1), CA-6(2) | Mechanisms table | verified | SP 800-37r2 App. F; SP 800-53r5 CA-6(1), (2) OSCAL 5.2.0 |
| 7 | Type authorization: archetype package; developing AO issues ATO; site AO issues ATU | Mechanisms table | verified | SP 800-37r2 App. F, Type and Facility Authorizations |
| 8 | M-24-15 date, title; FedRAMP says it "formally rescinded and replaced" the prior program | M-24-15 section | verified | M-24-15 p.1; FedRAMP authority page |
| 9 | Presumption of adequacy text (at or below FIPS 199 level) | Same | verified | M-24-15 §IV.a |
| 10 | Applies while maintained by continuous monitoring | Same | verified | M-24-15 §IV.a |
| 11 | Doesn't supersede FISMA authorities; AOs must issue an authorization when reusing | Same | verified | M-24-15 §IV.a and fn. 11 |
| 12 | Overcome by "demonstrable need" or "wholly or substantially deficient"; document reasons and inform PMO | Same | verified | M-24-15 §IV.a |
| 13 | Agency and joint agency authorizations; program authorizations by FedRAMP Director; high-reuse CSOs likely joint candidates | Same | verified | M-24-15 §IV.c |
| 14 | Agency duties: authorization letter to PMO, artifacts fit for reuse, leverage others' materials, OSCAL GRC, review ConMon materials | Same | verified | M-24-15 §VII.d items 1, 2, 4, 6, 10 |
| 15 | M-24-15 points to SP 800-37 for ongoing authorization | Same | verified | M-24-15 fn. 32 |
| 16 | "FedRAMP Certified" replaces "authorized" | 2026 rules | verified (via Book 10 Ch03, which cites NTC-0004 and definitions) | Book 10 Ch03; FedRAMP definitions FRD-CCL |
| 17 | "reuse ... to the greatest extent possible"; "reuse system, not a paperwork substitution"; each agency authorizes own systems; AO accepts risk for agency's use; never standalone ATO for a CSO | 2026 rules | verified | FedRAMP "Using a FedRAMP Certified Cloud Service" |
| 18 | AGU-USE-ABU, AGU-AGC-NAA, -NAR, -TPP, -GRC text and force; NAR/TPP notes tie to presumption of adequacy | Rules table | verified | Ruleset JSON v2026.10.13.01; Agency Use page |
| 19 | CCM-AGM-ROR MUST vs AGU-USE-ROR SHOULD for the same review | Inconsistency paragraph | verified (both read in the JSON) | Ruleset JSON |
| 20 | Providers supply OCR every 3 months | Same | verified | CCM-OCR-AVL |
| 21 | Program treats the OCR review as MUST | Same | restated-as-design | — |
| 22 | "One SSP, one controlling ATO covering all consuming agencies" | One package for a shared service | corrected (one package and provider decision; each consumer issues its own ATO/ATU, or a joint authorization; risk acceptance not delegable) | SP 800-37r2 App. F and Task R-4; FedRAMP agency guidance |
| 23 | Configuration latitude table; deviations as DRIFT-AUTHZ / DRIFT-IDENTITY P1 | Same | restated-as-design; severity aligned with Ch06 (P1 when claim in active use) | Ch06 |
| 24 | Reciprocity record fields and per-agency bundle | Same | restated-as-design (record doesn't replace the AGU-AGC-NAA ATO letter) | Ruleset JSON |
| 25 | Records "signed (HMAC-SHA256)"; bundle "self-verifies with nothing but the Python standard library"; auditors verify offline | Two corrections | corrected (HMAC uses a shared secret key, so it isn't a signature and can't be verified without the key; a hash manifest can be rewritten; design restated as a signed manifest) | FIPS 198-1; FIPS 186-5; Ch07 |
| 26 | Legal basis examples "FedRAMP Rev 5, OMB M-24-15, FISMA §3554" | Record fields | removed (specific citations replaced by "the legal and policy basis the agency relies on"; M-24-15 basis covered elsewhere) | — |
| 27 | "KSI-RECIP-001..008" indicators | Two corrections; trade-off | corrected (renamed reciprocity health checks; not FedRAMP KSIs) | FedRAMP KSI page (no such theme) |
| 28 | Cadence SLAs draft ≤30d, final ≤45d, reauth ≥30d before expiry | Trade-off | restated-as-design (not federal requirements) | — |
| 29 | Under ongoing authorization there's no termination date to lapse past | Trade-off | verified | SP 800-37r2 App. F fn. 152 |
| 30 | 46 KSIs in 10 themes, per-theme counts (1,4,8,6,3,5,5,4,2,8) | KSI table | verified (counted in JSON and on page) | FedRAMP KSI page; ruleset JSON |
| 31 | Each KSI is an outcome statement with related 800-53 controls | KSI section | verified | Ruleset JSON (statement, controls) |
| 32 | KSI-CMT-LMC text; KSI-CED-RAT "persistently reviewed" | Same | verified | FedRAMP KSI page; ruleset JSON |
| 33 | "Persistently" definition | Same | verified | FRD-PER |
| 34 | KSIs bind providers: SDR-CSX-KSI summaries; FRC-CSX-VVK ≥2 automated methods at Class C, ≥4 at Class D | Same | verified | Ruleset JSON; SDR page; 20x Class C certification page |
| 35 | KSIs "sit above 800-53 ... the model FedRAMP 20x is moving toward"; agency tenant evaluated against KSIs | KSI section | corrected (indicators are in force in the 2026 rules and bind providers; agency uses them as vocabulary) | As 30–34; Book 12 Ch12 |
| 36 | "More than 190 KSI rules across eleven families" | Program's own rules | corrected (these are the program's own rules, not FedRAMP KSIs; counts not repeated) | FedRAMP KSI page |
| 37 | Engine: pass/fail/error/stale, deterministic, hashed evidence; authored against SCuBA M365 first | Same | restated-as-design | — |
| 38 | KSI-theme tagging on the OSCAL pipeline (`fedramp:ksi-themes` etc.) | Same | restated-as-design (tags are the program's metadata, not FedRAMP's) | — |
| 39 | Several indicators' control mappings changed Oct 13, 2026 | Same | verified | Ruleset JSON changelogs |
| 40 | Ongoing authorization definition; time/event driven; dependent on robust ConMon | Ongoing authorization | verified | SP 800-37r2 App. F |
| 41 | A-130: transition to ongoing authorization when eligible, with AO approval | Same | verified | A-130 App. I §4.d item 3 |
| 42 | Two conditions; new decision document; no termination date; acknowledges ongoing acceptance; reauth mostly event-driven; reauth unnecessary when ConMon suffices; automated tools insufficient for every control; independence for moderate/high | Same | verified | SP 800-37r2 App. F |
| 43 | Presumption holds only while maintained by ConMon, so evidence keeps reuse lawful | Same | verified (inference from M-24-15 §IV.a, stated as program reading) | M-24-15 |
| 44 | Seven surface slots; regime crosswalks; one compliance spine; drift gates; proven vs asserted traceability; SOC 2 as a second pack | One evidence model | restated-as-design (attributed to the integration overview) | Integration overview (repository) |
| 45 | Two regimes reading one slot is not mutual satisfaction | Same | restated-as-design (from the overview's caution) | Integration overview |
| 46 | Maturity: record, bundle, health checks, cadence validator built; OSCAL SSP/POA&M reciprocity output a target | Design table | restated-as-design (program's own status) | Source brief maturity table |
| 47 | Status table rows | Design table | verified / restated-as-design per row | As cited |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Reciprocity brief: opening (one SSP, one ATO, configuration latitude; quotation) | One package for a shared service | Restated and corrected (claim 22); the in-source quotation dropped as an internal record |
| Reciprocity brief: How reciprocity is recorded (CLI table, record contents, evidence-graph edge) | One package for a shared service (record fields) | CLI command names and the evidence-graph edge are engine internals; functions described instead. Legal-basis examples removed (claim 26) |
| Reciprocity brief: Self-verifying per-agency bundles | Two corrections | Corrected (claim 25) |
| Reciprocity brief: Configuration latitude is drift-governed | One package for a shared service; trade-off | KSI-RECIP renamed (claim 27) |
| Reciprocity brief: The honest trade-off | The trade-off, stated honestly | Extended with the ongoing-authorization point |
| Reciprocity brief: Maturity snapshot | What is design and what is requirement (closing paragraph) | Collapsed to built vs target; "SHIPPED"/"TARGET" labels and internal IDs dropped |
| Reciprocity brief: Where to go deeper | Links to Book 03, Ch07, this chapter's KSI section | Source pages archived; linked to book chapters instead |
| Reciprocity brief: Leadership takeaway | Design table and closing paragraph | — |
| KSI brief: opening (KSIs as machine-checkable assertions above 800-53) | 2026 Key Security Indicators | Corrected (claim 35) |
| KSI brief: Governed KSI corpus (family table, 190+ rules) | What the program's own rules are | Corrected (claim 36); family table not carried because it presents program rules as KSIs |
| KSI brief: Evaluation engine (CLI, result schema, 40+ tests, OSCAL observations) | What the program's own rules are | CLI and test counts are engine internals; outcome described; link to Ch05 and Ch07 |
| KSI brief: Honest scope note (no standalone report command) | — | Engine-internal detail with no reader consequence |
| KSI brief: FedRAMP 20x alignment, tagging discipline | What the program's own rules are (mapping paragraph) | Restated as design (claim 38) |
| KSI brief: Maturity snapshot (incl. "Full CR26 coverage PARTIAL") | What the program's own rules are ("coverage ... partial") | — |
| KSI brief: Where to go deeper; Leadership takeaway | KSI section; Book 12 Ch12 link | — |
| Integration overview: Series context, What this volume addresses | One evidence model, more than one regime | Volume numbering and series scaffolding dropped |
| Integration overview: Substrate premise | Same ("the compliance regime is not the engine") | Translated vocabulary |
| Integration overview: Surface-slot binding (seven slots, NIST anchors, KSI themes) | Same (seven areas named) | Per-slot control/theme table not reproduced; it is the overview's design and the overview stays linked. Trigrams in it checked against FedRAMP's ten themes (all valid; no AFR theme exists) |
| Integration overview: Single source of truth (spine, generators, drift gates, traceability) | Same (one table of closures, generated crosswalks, gated, proven vs asserted) | — |
| Integration overview: Vertical-agnosticism, SOC 2 pack; caution | Same | SOC 2 criteria numbers not repeated (not independently verified) |
| Integration overview: What this means for the reader; Volume roadmap | — | Audience framing and volume roadmap specific to the series |
| Integration overview: Separable adoption | — | Series/OrgMod packaging; not relevant to this chapter |
