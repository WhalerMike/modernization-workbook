# Verification — Chapter 06, The Drift Engine

Writer W3, 2026-10-21. Sources: `docs/architecture/drift-engine.md` and its condensed twin
`docs/architecture/architecture-series/drift-engine.md`. Reconciled against Book 00 Ch04 (principle 11),
Book 01 Ch04 (drift categories) and Ch11 (actuation ladder), Book 02 Ch05 (drift detection) and Ch11
(Phase 4, Phase 5), and Book 03 Ch11 (drift between HR and the directory).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SP 800-128 four SecCM phases; quote "is usually not sufficient to ensure that a system which was once secure will remain secure"; monitoring finds where actual differs from approved baseline | Drift as a signal | verified (added) | NIST SP 800-128 upd1 (Oct 10, 2019), §2.2, §2.2.4; PDF read |
| 2 | SP 800-128 reconciliation of detected changes with approved changes (who, window, approved request/ticket/release) | What the engine compares against | verified (added) | SP 800-128 §3.4.1 |
| 3 | Drift measured against versioned record, not last-known-good snapshot | What the engine compares against | restated-as-design | Program design |
| 4 | Exactly five classes and their meanings | Five classes | restated-as-design | Program's drift standard (doc number dropped) |
| 5 | Detection surface per class | Five classes | restated-as-design | Source; "CI substrate walker" → "on every change to the record"; "runtime conformance runner" → "against the estate at runtime" |
| 6 | Mapping of Book 00/01/02/03 domain checks to the five classes | One model, many domain checks | restated-as-design | This chapter's reconciliation, per brief ("present the program's drift model once and map"); each book's severities copied from the published chapters |
| 7 | B00/B01 "Value" and "Orphan" mean different things | Same | verified (internal) | Book 00 Ch04 table vs Book 01 Ch04 table |
| 8 | Severity P1–P4, rules, SLAs immediate/1h/24h/72h | Severity | restated-as-design | Source severity model; labeled program defaults |
| 9 | Authorization drift on a live claim added to the P1 rule | Severity | corrected | Source table listed only provenance/identity at P1, leaving authz unassigned; Book 02 Ch11 already treats live DRIFT-AUTHZ as P1. Change stated in the chapter |
| 10 | Domain books may pin severity; Critical/High/Medium/Low ≡ P1–P4 | Severity | restated-as-design | Reconciliation: Book 00, Book 02 Ch05 and Book 03 Ch11 pin severities that differ from the class+liveness default (e.g. B03 unauthorized write = High, B00 Format = Critical) |
| 11 | CA-7 leaves monitoring frequencies and response actions organization-defined; CA-7(4) effectiveness, compliance, change monitoring | Severity; Cadence | verified (added) | OSCAL Rev. 5 catalog 5.2.0; both in Moderate |
| 12 | Detection on every proposed change (paths exist, references resolve) | Cadence | restated-as-design | Source's CI walker; command names, workflow name and manifest ID dropped |
| 13 | Event streams between comparisons (Entra audit log for restricted AUs) | Cadence | verified (internal link) | Book 02 Ch05 (footnoted there); linked, not re-footnoted |
| 14 | Per-check cadence set by owning book | Cadence | restated-as-design | Writer's reconciliation; source gave no intervals |
| 15 | Severity sets clock; ladder ceiling sets who acts; L0–L4 with L3 default ceiling; permanent-L3 classes | What the engine remediates | corrected / verified (internal) | Source said P2–P4 "auto-remediate"; reconciled with Book 01 Ch11 so auto-remediation happens only for classes enumerated at L4. Ladder text from Book 01 Ch11 |
| 16 | Azure Machine Configuration modes Audit / Apply and Monitor / Apply and Autocorrect; assignmentType values | What the engine remediates | verified (added) | Microsoft Learn machine-configuration overview and assignments pages |
| 17 | Audit ≈ L1, Autocorrect ≈ L4 correspondence | Same | restated-as-design | Labeled program's correspondence |
| 18 | CM-3(5) and CM-6(2) statements; CM-6(2) in High; CM-3(5) in neither Moderate nor High | Same | verified (added) | OSCAL catalog; Moderate and High profiles checked programmatically |
| 19 | Five things the engine never does | Same | restated-as-design | Source (P1 halt) plus Book 03 Ch11 (close at the record/rule, from its figure) plus Ch04/Ch05 boundaries plus settled fact that only the AO accepts risk |
| 20 | Remediation contract fields | The remediation contract | restated-as-design | Source YAML restored as a fenced block with warning callout; added `check`, `record_version`, `ladder_ceiling`; escalation roles translated from internal role names to "a named role" |
| 21 | Maturity: schema + provenance built both surfaces; semantic partial; authz and identity design-only | What is built today | restated-as-design | Source maturity matrix; consistent with Book 02 Ch11. "SHIPPED/TARGET/DESIGN-ONLY" → built / partly built / design only. Not independently verifiable outside the program's repository |
| 22 | Three differences from config-drift tools | Why this isn't a config-drift tool | restated-as-design | Source |
| 23 | Assessors can re-run detection | Same | restated-as-design | Source ("run the walker themselves") generalized; command name dropped |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| drift-engine.md: front matter, illustration PNG | — | PNG not reused; replaced by `ch06-drift-pipeline` and `ch06-one-drift-model` |
| drift-engine.md: intro (drift as first-class signal) | Drift as a signal | Link to executive brief dropped (source page, being archived) |
| drift-engine.md: taxonomy SVG | Five classes (table) and `ch06-one-drift-model` | Not reused; redrawn |
| drift-engine.md: Five-class taxonomy | The program's drift model: five classes | Drift-standard doc ID dropped |
| drift-engine.md: Severity model + remediation SVG | Severity; `ch06-drift-pipeline` | Corrected (claims 9, 15) |
| drift-engine.md: Detection surfaces — CI walker | Cadence (first bullet); What is built today | CLI commands, workflow and manifest IDs dropped |
| drift-engine.md: Detection surfaces — runtime runner, remediation_contract YAML | Cadence (second bullet); The remediation contract | YAML restored and extended |
| drift-engine.md: Drift Fabric pipeline SVG, escalation to Governance Plane | `ch06-drift-pipeline`; escalation path to named role | "Governance Plane" proper name dropped; roles linked to Ch09 |
| drift-engine.md: Maturity matrix | What is built today | Link to internal status page dropped |
| drift-engine.md: Why this is different from a config-drift tool | Why this isn't a configuration-drift tool | — |
| drift-engine.md: What this means for an ATO package | The remediation contract; Why this isn't a config-drift tool (assessor re-run) | Merged |
| architecture-series twin (all sections) | Same places as the long version | Condensed duplicate; consolidated |
