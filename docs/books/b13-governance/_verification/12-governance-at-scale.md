# Verification — Chapter 12, Governance at Scale and the Continuous-Monitoring Program

Writer W6. Sources: `docs/executive-governance/ch08-governance-at-scale/index.md`, `docs/projects/continuous-monitoring-charter.md`, `docs/projects/continuous-monitoring-plan.md`, `docs/architecture/continuous-monitoring-strategy.md`, `docs/architecture/gap-closure-register.md`, `docs/architecture/governance-platform-coverage-gap-doctrine.md` (all archived after the build; not linked), and the integration overview `docs/compliance/Vol_X_Book_00_Governance_Substrate_Integration_Overview.md` (used for Ch11; nothing further needed here). Primary sources opened October 21, 2026: NIST SP 800-37 Rev. 2 PDF, NIST SP 800-137 PDF, OMB Circular A-130 PDF (text extracted with pypdf), and the SP 800-53 Rev. 5 OSCAL catalog 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CA-7 system strategy implemented in accordance with the organization-level strategy; PM-31 organization-wide items | Opening | verified | SP 800-53r5 CA-7, PM-31 (OSCAL 5.2.0) |
| 2 | Task P-7 owned by SAORM, who approves the strategy incl. minimum frequency | Opening; phases | verified | SP 800-37r2 Task P-7 |
| 3 | A-130: ISCM program with metrics at all tiers; all controls addressed in strategy and monitored on an ongoing basis | Opening | verified | A-130 App. I §4.d items 7, 8(b) |
| 4 | Held small / allowed to grow; consolidation into one repository and package; one merge gate | What stays small | restated-as-design | Source ch08 |
| 5 | Drift model five classes, four severities | Same | verified against this book's Ch06 (program design) | Ch06 |
| 6 | Many programs, one record (three bullets) | Same | restated-as-design | Source ch08 |
| 7 | Common controls identified, assigned, published at various levels; hybrid controls | Same | verified | SP 800-37r2 Task P-5 |
| 8 | Common controls across differing impact levels implemented at highest level or factored into risk | Same | verified | A-130 App. I §4.c fn. 82 |
| 9 | Boundary multiplicity; adapters declare boundary; closed set of boundaries; findings cite boundary | Boundaries | restated-as-design; named commercial exceptions and the `gcc-boundary` field generalized | Source ch08; Book 10 Ch02, Ch09, Ch11 |
| 10 | Charter purpose, problem, objectives, scope, out of scope, principles | ConMon project | restated-as-design | Charter |
| 11 | SP 800-137 compliance-driven to data-driven; strategy for action as important as collecting data | Same | verified | SP 800-137 Executive Summary, Ch. 3 intro |
| 12 | SP 800-137 six steps with automation "where possible" | Same | verified | SP 800-137 Ch. 3 intro |
| 13 | Charter drift categories "schema, semantic, provenance, authorization, identity, or contention" | Principles | corrected (aligned to the five classes in Ch06; "contention" not carried) | Ch06 |
| 14 | Phases 0–4 and success measures | Phases | restated-as-design; "unjoinable records counted" added as program design | Plan; charter |
| 15 | Sponsor and lead "to be named"; SAORM approval mapping; gates analogous to G0–G5 | Phases | restated-as-design | Charter; Book 01 Ch12 |
| 16 | Four risks and three assumptions; mitigations | Risks | restated-as-design (mitigations are the program's, linked to Ch06/08/10) | Charter |
| 17 | Cadence table (critical drift continuous/hourly, immediate; compliance and CA daily/weekly; attribute changes daily/weekly; risk register monthly; full assessment quarterly) | Cadence | restated-as-design (CA-7/PM-31 require defined frequencies, not these values) | Strategy; SP 800-53r5 |
| 18 | Evidence immutable once written; retention to support audit | Cadence | restated-as-design; retention linked to Book 12 Ch12 | Strategy |
| 19 | Coverage classification table | Coverage | restated-as-design | Coverage doctrine |
| 20 | Automated tools may not generate info for every control; manual assessments fill gaps | Coverage; limits | verified | SP 800-37r2 App. F |
| 21 | Register fields, four operating rules, purpose | Register | restated-as-design ("never reused" ID rule added as design) | Gap closure register |
| 22 | Five-step gap treatment; three decisions | Three ways | restated-as-design | Coverage doctrine |
| 23 | CA-5 POA&M updated from assessments, audits, ConMon | Three ways | verified | SP 800-53r5 CA-5 |
| 24 | SP 800-137 responses: mitigation, acceptance, transference/sharing, avoidance/rejection | Three ways | verified | SP 800-137 Ch. 3 intro |
| 25 | Risk acceptance "cannot be delegated" | Three ways | verified | SP 800-37r2 Task R-4 |
| 26 | A-130 POA&Ms for weaknesses "not associated with accepted risks" | Register vs POA&M | verified | A-130 App. I §4.c item 15 |
| 27 | PM-4 review for consistency with risk strategy and priorities | Same | verified | SP 800-53r5 PM-4 |
| 28 | What doesn't scale automatically (record authoring, adapters, cross-program review) + risk acceptance | Doesn't scale | restated-as-design (risk acceptance added from claim 25) | Source ch08 |
| 29 | SP 800-137: all controls incl. management/operational must be assessed even if not automated | Honest limits | verified | SP 800-137 Executive Summary |
| 30 | Runtime detection partial (schema/provenance in CI; semantic/authz/identity via adapters); federation designed not built | Honest limits | restated-as-design (program's own status) | Source ch08 |
| 31 | Package reflects evidence present | Honest limits | restated-as-design (consistent with Book 12 Ch12) | Book 12 Ch12 |
| 32 | Coverage report: proven vs asserted, counts not a single percentage | Honest limits | restated-as-design | Charter objective 5 |
| 33 | Full control assessment at least annually (was "quarterly"); quarterly evidence-quality review | The cadence after cutover | corrected Oct 25, 2026; aligned with Book 14 Ch11 | 44 U.S.C. § 3554(b)(5) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ch08: In this chapter | Opening | — |
| ch08: What stays small (canon, drift taxonomy, CLI surface) | What stays small and what grows | Translated: "authoritative record's core," "tooling's command and interface surface"; document-number allocation dropped as internal |
| ch08: What is allowed to grow (adapters, policy mappings, evidence emissions) | Same | Registry file names dropped |
| ch08: At-a-glance table | Same (merged table) | — |
| ch08: How the consolidation supports scale | One repository, one merge gate | Import-root detail dropped as code internals |
| ch08: Multi-program scaling | Many programs, one record | Extended with SP 800-37 common controls |
| ch08: Boundary multiplicity | Boundaries as governed objects | Named commercial exceptions and decision IDs generalized; drift-finding example kept |
| ch08: What does not scale automatically | What doesn't scale automatically | — |
| ch08: Honest limits | The honest limits of coverage | — |
| ch08: Key takeaways; Related documents; end-of-series callout | Closing table | Related links point to archived pages |
| Charter §1 Purpose | ConMon project intro | — |
| Charter §2 Problem | Why it needs a charter | — |
| Charter §3 Objectives | Objectives and scope | — |
| Charter §4 Scope (in/out) | Same | — |
| Charter §5 Guiding principles | Same | Drift-class list corrected (claim 13) |
| Charter §6 Success criteria | Phases table "Done when" | — |
| Charter §7 Approach | Phases | Merged with the plan |
| Charter §8 Risks and assumptions | Risks and assumptions | — |
| Charter §9 Governance and ownership | Phases (roles paragraph) | — |
| Charter §10 Next steps | Phases table (phase 0) | Merged |
| Plan §1–4 | Phases table | Duplicates the charter; consolidated |
| Strategy: Purpose, Objectives | The cadence after cutover | Objectives folded into the prose |
| Strategy: Cadence table | Same | — |
| Strategy: Evidence retention | Same | Detail is Book 12 Ch12 |
| Gap register: Purpose, Entry fields, Operating rules, Bottom line | The gap closure register | — |
| Coverage doctrine: Purpose, Classification, Gap treatment, Bottom line | Classify coverage; Three ways a gap closes | — |
