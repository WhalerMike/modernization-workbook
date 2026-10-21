# Verification — Chapter 09, Who Governs

Writer W5. New chapter. Sources given: `docs/executive-governance/index.md` (shared with Ch01) and `docs/whitepapers/modernization-governance-whitepaper.md` (its §§1–2 went to Ch01; this chapter draws on its governance-leads argument and its AO-facing §5). Kept consistent with Book 01 Ch09 (program-wide matrix), Book 00 Ch07 (decision corrections, rhythm, repository conventions), Book 12 Ch10 (SOC-domain matrix, time split for exceptions, AO alone accepts risk) and Book 04 Ch06 (exceptions, approvers don't execute), and with this book's Ch05 (three rule layers, "the governance body that owns the record") and Ch06 (P1–P4). All primary sources opened October 21, 2026. Federal PDFs downloaded with curl (no identifying headers) and read as extracted text (pypdf); the SP 800-53 control text and baselines read from the NIST release 5.2.0 OSCAL catalog and profile JSON; CFR sections read on law.cornell.edu (ecfr.gov redirected to a block page).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AO is "the only organizational official who can accept the security and privacy risk…" | Where the roles come from; AO role | verified | SP 800-37r2 App. D, Authorizing Official |
| 2 | AO approves plans, MOAs, POA&Ms and determines whether significant changes require reauthorization | Same; exceptions; AO role items 1 and 3 | verified | SP 800-37r2 App. D |
| 3 | AO role is an inherent U.S. Government function, government personnel only | Same; separations | verified | SP 800-37r2 App. D |
| 4 | AODR may do everything except make and sign the authorization decision | Where the roles come from; AO role | verified | SP 800-37r2 App. D, AODR |
| 5 | Information owner or steward definition; may or may not be the system owner | Where the roles come from; who keeps the record | verified | SP 800-37r2 App. D |
| 6 | Risk executive (function) led by SAORM; can be "a risk board, executive steering committee, executive leadership council" | Where the roles come from; board | verified | SP 800-37r2 App. D, Risk Executive (Function) and SAORM |
| 7 | No conflicts of interest when one person holds several roles | Where the roles come from | verified | SP 800-37r2 App. D fn. 113 |
| 8 | P-7: SAORM/risk executive primary; approves strategy "including the minimum frequency…"; strategy addresses automated tools and controls that can't be automated | Where the roles come from; matrix closing paragraph; cadence | verified | SP 800-37r2 Task P-7 |
| 9 | M-1: SO or CCP with SAISO (and SAOP) primary; monitor for unauthorized changes and determine root cause | Where the roles come from | verified | SP 800-37r2 Task M-1 |
| 10 | M-6: AO primary; automated tools, metrics and dashboards support near-real-time decisions | Where the roles come from; AO role item 2 | verified | SP 800-37r2 Task M-6 discussion |
| 11 | SP 800-137 roles: risk executive oversees strategy and reviews status reports; CIO leads and works with AOs on funding; SISO establishes program, CM guidance, consolidates POA&Ms, maintains automated tools; AO reviews status reports and decides risk acceptability; system owner does impact analyses and remediation | Where the roles come from; who reviews drift | verified | SP 800-137 §2.4 |
| 12 | SP 800-137: procedure for reviewing all aspects of the strategy; triggers include risk tolerance, threat, architecture, POA&M counts | Where the roles come from; cadence | verified | SP 800-137 §3.6 |
| 13 | CM-3 items a–g, including the "configuration change control element" meeting on a defined schedule or conditions | Where the roles come from; board; records | verified | SP 800-53r5 CM-3, OSCAL 5.2.0 |
| 14 | CM-3(4) requires security and privacy representatives on the element | Where the roles come from; board table | verified | SP 800-53r5 CM-3(4) |
| 15 | CM-3 and CM-3(4) in the Moderate baseline | Where the roles come from | verified | SP 800-53B Moderate profile, OSCAL 5.2.0 (cm-3, cm-3.2, cm-3.4 listed) |
| 16 | Governance board is the change control element for the record | Where the roles come from; board | restated-as-design | — |
| 17 | 36 CFR 1220.34(a) assign records responsibility; (e) integrate records requirements into electronic systems | Where the roles come from | verified | law.cornell.edu 36 CFR 1220.34 |
| 18 | M-19-17 ICAM governance structure and its member offices | Where the roles come from | verified | M-19-17 PDF, "Governance," item 1 (pp. 5–6) |
| 19 | Steward keeps the record; steward decides governance-artifact status, naming, schema | Who keeps the record | restated-as-design | Book 00 Ch07 decision table |
| 20 | Rule-change decider table (layer 1 steward; control requirements CISO; architecture/authoritative origin steward + sponsor; layer 2 adapter owner; layer 3 platform team; platform changes steward with outside reviewer; L4 raise AO) | Who approves rule changes | restated-as-design | Built on Ch05 review table, Book 00 Ch07, Book 01 Ch09, Book 12 Ch11 (AO accepts L4 attack disruption) |
| 21 | Outside reviewer on platform changes is "the program's reading of CM-3(4)" | Same | restated-as-design | Labeled as reading |
| 22 | L3 default because a posture an AO can sign | Same | restated-as-design | Book 01 Ch11 |
| 23 | Drift review layers (program office triages; system owner decides remediation; CISO decides on evidence; board watches trend) | Who reviews drift | restated-as-design | Book 01 Ch09 matrix; Book 12 Ch10 matrix |
| 24 | Exception time split (bounded → CISO; no end date/past limit → AO) as in Books 05, 08, 09, 11, 12; Book 04 no-compensating-control rule | Who accepts exceptions; matrix | verified (against workbook) | Book 05 Ch06, Book 08 Ch09, Book 09 Ch09, Book 11 Ch07, Book 12 Ch10, Book 04 Ch06 text checked |
| 25 | CA-5 POA&M documents planned remediation; updated from assessments, audits and continuous monitoring | Who accepts exceptions | verified | SP 800-53r5 CA-5 |
| 26 | Quarterly register review; renewed twice → CISO and AO; exception never edits the rule | Who accepts exceptions | restated-as-design | Book 04 Ch06 (quarterly, renewed more than twice) |
| 27 | GRS 3.1 item 030 description quote and disposition (5 years after system superseded/terminated/defunded/no longer needed; longer for business use) | Who keeps the record as a record | verified | GRS 3.1 PDF, Transmittal 30, item 030 |
| 28 | GRS 3.1 item 040 covers reports, responses to findings, metrics; 5 years after activity completed or superseded | Same | verified | GRS 3.1 item 040 (disposition read from extracted column text; authority DAA-GRS-2013-0005-0010) |
| 29 | GRS 3.1 doesn't apply to system data or content | Same | verified | GRS 3.1 introduction |
| 30 | GRS 3.2 covers access records and audit trails | Same | verified (via Book 01 Ch09, which cites items 030/031) | Book 01 Ch09 footnote; not re-footnoted here |
| 31 | 36 CFR 1236.10 controls: reliability, authenticity (unauthorized addition, deletion, alteration, use, concealment), integrity (audit trails), usability, content, context, structure | Same | verified | law.cornell.edu 36 CFR 1236.10 |
| 32 | No history rewrite without records officer and CISO concurrence; rotate leaked credentials first | Same | restated-as-design | — |
| 33 | SAOP reviews authorization packages for systems processing PII | Privacy paragraph | verified | SP 800-37r2 App. D, SAOP |
| 34 | Board composition, review-not-vote, charter contents | The governance board | restated-as-design | Book 00 Ch07 steering committee |
| 35 | Cadence table frequencies (daily triage, weekly review, biweekly board, monthly CISO and AO, quarterly register, yearly strategy and charter) | Cadence | restated-as-design | Fits Book 00 Ch07 rhythm and Book 12 Ch12 reporting rhythm |
| 36 | Missed priority-one window goes to steward and sponsor | Cadence | verified (against workbook) | Book 01 Ch12 rollback triggers |
| 37 | AO sets assessor independence | AO role item 4; separations | verified | SP 800-37r2 App. D, Control Assessor |
| 38 | Governance platform's controls need their own AO when inherited as common controls | AO role | restated-as-design | Mirrors Book 12 Ch10's SOC point; CCP definition in SP 800-37r2 App. D |
| 39 | AC-5 identify duties to separate and define access authorizations | Separations | verified | SP 800-53r5 AC-5 |
| 40 | Administrators can't bypass branch protection | Separations | verified (against workbook) | Book 00 Ch07 (Gitea protected-branch footnote there) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| `executive-governance/index.md` — front matter, download callout | — | Site plumbing; the book replaces the series bundle |
| `executive-governance/index.md` — intro (book-length narrative for AOs and leadership) | — | Framing for the series as a whole; Ch01 (W1) carries the series landing |
| `executive-governance/index.md` — chapter table | — | Replaced by this book's own chapter list (editor's index) |
| `executive-governance/index.md` — reading paths (AO: ch 4, 6, 7, 8) | — | The editor's book index owns reading paths; the AO path's intent is served by this chapter's AO section |
| `modernization-governance-whitepaper.md` — problem/solution/ask, executive summary, §1 inversion, §2 why governance must lead | Ch01 (W1) | Assigned to Ch01 per W1's verification file; this chapter carries only the consequence that governance needs owners before cutover (opening section) |
| Same — §3 the four mechanisms (record, adapters, provenance, drift) | Ch03, Ch04, Ch06, Ch08 | Mechanisms belong to the What chapters; recapped in this chapter's opening paragraph |
| Same — §3 adapter count, product-specific adapters, compliance-volume cross-reference | — | Internal registry counts and product names; dropped as internal detail |
| Same — §4 phased modernization and the worked attribute example | — | Migration sequencing is Book 01 Ch12 and Book 03; not a governance-ownership topic |
| Same — §5 what this means for an ATO package (AO reviews continuously, phase evidence) | This chapter, "The authorizing official's role" (ongoing authorization, monthly posture report) | Reframed against SP 800-37 M-6 |
| Same — §6 honest limits (multi-quarter; partial runtime drift; opinionated attribute model) | Ch10 honest limits (partial runtime drift) | Attribute-model point is Book 02/03 territory |
| Same — §7 conclusion | — | Promotional close; argument carried by the chapter as a whole |
