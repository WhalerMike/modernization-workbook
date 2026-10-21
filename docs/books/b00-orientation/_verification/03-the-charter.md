# Verification — Chapter 03, The Program Charter

Source: `PROJECT-CHARTER.md` (repo root; not archived). Writer W2. Checked 2026-10-21.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | On-premises Group Policy applies in LSDOU order; Intune has no hierarchy and conflicting settings show as conflicts | The problem | verified | MS Learn, settings catalog vs ADMX walkthrough (`[^c03-gpo-order]`) |
| 2 | Entra ID administrative units can't be nested | The problem | verified | MS Learn, Administrative units, Constraints (`[^c03-au]`) |
| 3 | NPS uses the AD DS domain as its account database when domain-joined | The problem | verified | MS Learn, NPS overview (`[^c03-nps]`) |
| 4 | Certificate auto-enrollment configured by Group Policy, needs an enterprise CA integrated with AD | The problem | verified | MS Learn, NPS certificate auto-enrollment (`[^c03-autoenroll]`) |
| 5 | Directory structure is implicit governance; cloud flattens it (source thesis) | The problem | restated-as-design | Program thesis; linked to Book 01 Ch02 |
| 6 | M-22-09 requires centralized identity management systems; vision of enterprise-managed identities | Objectives | verified | M-22-09 §III.A, PDF text extracted (`[^c03-m2209]`) |
| 7 | PIM: eligible roles, time-based and approval-based activation | Guiding principles | verified | MS Learn, What is PIM (`[^c03-pim]`) |
| 8 | Synced users' extensionAttributes 1–15 are mastered on premises and read-only in the cloud | Guiding principles | verified | Microsoft Graph, onPremisesExtensionAttributes (`[^c03-extattr]`) |
| 9 | Success-criteria measures and thresholds (eleven types, 100% single source, 14-day hold, 100% five-clause closure) | Success criteria | restated-as-design | Program design; gate names and 14-day illustrative hold from Book 01 Ch12; eleven types from Book 02 Ch04 |
| 10 | Gate authorities: steward G0/G1/G4, co-signs G2; sponsor+steering G3; sponsor+CIO G5 | Governance | verified (internal) | Book 01 Ch09 and Ch12 (settled fact) |
| 11 | M-22-09: zero trust implementation lead within 30 days; whole C-suite aligned | Governance | verified | M-22-09 §III opening text; footnote corrected from §II to §III after checking extracted text (`[^c03-m2209]`) |
| 12 | M-19-17: integrated agency-wide ICAM office, team or governance structure | Governance | verified | M-19-17, Governance item 1, PDF text extracted (`[^c03-m1917]`) |
| 13 | Charter steps mapped to Book 01 phases | Approach | restated-as-design | Mapping is this chapter's; phases/gates per Book 01 Ch12 |
| 14 | Contractors usually need their own authoritative source | Assumptions | verified (internal) | Book 01 Ch09, Book 03 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §1 Purpose | "Purpose" | — |
| §2 Problem statement (implicit governance, flattening, fragmented copies, four results) | "The problem" (four costs as numbered list) | Added footnoted examples (GPO order, AU nesting, NPS, auto-enrollment) |
| §3 Objectives 1–6 | "Objectives" | Added M-22-09 alignment sentence |
| §4 Scope, in scope | "Scope / In scope" | — |
| §4 Scope, out of scope | "Scope / Out of scope for the initial phase" | Short rationale added to three items |
| §5 Guiding principles (six) | "Guiding principles" table | Full fifteen in Ch04; PIM and extension-attribute facts added |
| §6 Success criteria (six) | "Success criteria" table with measure, evidence, gate | Made measurable; thresholds labelled illustrative |
| §7 High-level approach (five steps) | "Approach" plus mapping table to Book 01 phases and gates | — |
| §8 Key risks (four) | "Risks and assumptions / Key risks" table with responses | Full register deferred to Appendix A |
| §8 Assumptions (three) | "Assumptions" | Linked Book 03 and Book 10 |
| §9 Governance and ownership (sponsor, lead, domain leads, decision rights) | "Governance and ownership" table mapped to Book 01 Ch09 roles | Names left to the agency; full matrix in Ch07 |
| §10 Next steps (five) | "Next steps" | "Finalize project name" restated as "name the program and its stakeholders" |
| Closing note (omits internal records and identifiers) | "What the charter is for", paragraph 2 | — |
