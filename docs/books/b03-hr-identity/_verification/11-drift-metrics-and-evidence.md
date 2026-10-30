# Verification — Chapter 11, Drift, Metrics and Evidence

Editor pass, 2026-10-20. The chapter had no footnotes; all 13 footnote definitions below are new. NIST control text was checked against NIST's OSCAL catalog for SP 800-53 Release 5.2.0 (`NIST_SP-800-53_rev5_catalog.json`, last modified 2026-05-11), downloaded from usnistgov/oscal-content, and the csrc.nist.gov publication page (which records the 5.2.0 release of August 27, 2025).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PS-4: disable system access within a defined period | Metrics table | verified; tagged PS-4a | c11-nist-80053 |
| 2 | PS-4: credentials and access revoked | Metrics table | verified; tagged PS-4b ("terminate or revoke any authenticators and credentials") | c11-nist-80053 |
| 3 | PS-5: "review initiated within the defined period" | Metrics table | corrected — PS-5a requires reviewing ongoing need; the time period in PS-5b applies to initiating transfer actions; reworded to cover both | c11-nist-80053 |
| 4 | Lifecycle Workflows schedule interval shapes the separation-to-block metric | Metrics paragraph | verified; added default 3 hours, range 1–24 hours (note: it's a tenant-wide Workflow settings value, not per workflow) | c11-lcw-schedule |
| 5 | CA-7 continuous monitoring requires system-level metrics, monitoring/assessment frequencies, response and reporting | New paragraph after metrics | added (verified); choosing metrics stated as agency decision | c11-nist-80053 |
| 6 | Drift severities | Drift table | restated-as-design (sentence added: program defaults, not an external standard) | — |
| 7 | Account Discovery finds target-app accounts and identifies orphans; needs ID Governance or Entra Suite | Drift section | added (verified) | c11-gov-licensing |
| 8 | Provisioning logs: 30 days premium, 7 days Free; route to Azure Monitor for longer | Evidence table and paragraph | added (verified) | c11-prov-logs |
| 9 | Lifecycle Workflows history viewable up to 30 days; downloadable as CSV report | Evidence table | added (verified) | c11-lcw-history, c11-lcw-download |
| 10 | Audit log retention 30 days P1/P2, 7 days Free; not retroactive; route via Azure Monitor/storage | Evidence table and paragraph | added (verified) | c11-retention |
| 11 | Access-review history reports downloadable for 30 days after creation | Evidence table | added (verified) | c11-ar-history |
| 12 | Entitlement-management audit events kept 30 days; export via Azure Monitor/storage | Evidence paragraph | added (verified) | c11-em-logs |
| 13 | AU-11 audit record retention for an organization-defined period | Evidence paragraph | added (verified) | c11-nist-80053 |
| 14 | AU-6 review of audit records for inappropriate or unusual activity | Evidence paragraph | added (verified) | c11-nist-80053 |
| 15 | AC-2 residuals: account types, account managers, conditions of membership, defined periods | Control table | verified (AC-2 a, b, c, h); added AC-2l alignment with personnel termination/transfer to the contribution column | c11-nist-80053 |
| 16 | AC-2(1) automated mechanisms | Control table | verified | c11-nist-80053 |
| 17 | PS-4 residual "notification of personnel" | Control table | corrected — notification isn't in Rev. 5 base PS-4 (it's a PS-4(2) option); residuals now PS-4c–e: exit interviews, retrieval of security-related property, retained access to information the individual controlled | c11-nist-80053 |
| 18 | PS-5 residuals | Control table | verified; added PS-5d notification | c11-nist-80053 |
| 19 | IA-4 residuals (authorization, reuse-prevention period) and IA-4(4) status characteristic | Control table | verified; added the IA-4(4) discussion examples (contractor, foreign national, non-organizational user) | c11-nist-80053 |
| 20 | SI-12 information management and retention | Control table | verified | c11-nist-80053 |
| 21 | OMB M-19-17 as a binding authority | Final paragraph | verified (title, May 21, 2019, whitehouse.gov PDF resolves); no evidence found of rescission, but status page on idmanagement.gov returned 404 — rescission status not independently confirmed | c11-m1917 |
| 22 | FIPS 201-3 | Final paragraph | verified (January 2022) | c11-fips201 |
| 23 | FICAM ILM Playbook is implementation guidance | Final paragraph | verified — the playbook's disclaimer says it is not policy and contains best practices | c11-ilm |
| 24 | CISA Zero Trust Maturity Model | Final paragraph | verified (Version 2.0 is current on cisa.gov; PDF resolves) | c11-ztmm |
| 25 | Evidence must outlive the account; keep it in the agency's log store per records schedule | Evidence paragraph | restated-as-design (unchanged), now supported by retention facts | — |
| 26 | First-month burst of findings | Drift section | restated-as-design (unchanged; program expectation) | — |
| 27 | Metric definitions, evidence-by-event rows, control contributions | Tables | restated-as-design (program architecture; unchanged apart from tags above) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited — added `part: How`; `lifecycle_review` 2027-01-01 → 2027-04-01 |
| Thesis line, "In this chapter" | Same | edited — callout mentions retention and the monitoring/audit controls |
| The measured lifecycle (table + paragraph) | Same | edited — control-element tags, PS-5 correction, LCW schedule fact; new CA-7 paragraph |
| Drift between HR and the directory (diagram, table, paragraphs) | Same | edited — added `#fig-ch11-drift-evidence-loop` id; severity-is-design sentence; Account Discovery sentence |
| The evidence each event leaves | Same | edited — new "Kept in Entra ID" column with verified retention; export guidance; AU-11/AU-6 paragraph |
| Control support: NIST SP 800-53 Rev. 5 | Same | edited — release cited; AC-2l, PS-4 residual correction, PS-5d, IA-4(4) examples |
| Requirements-mapping paragraph | Same | edited — footnotes for M-19-17, FIPS 201-3, ILM Playbook, ZTMM |
| Continue the series callout | "Continue the book" callout | edited — Book 02 styling |
| Diagram `ch11-drift-evidence-loop.flow.yaml` | Unchanged | kept — no wrong facts (comment line still says "Chapter 09"; cosmetic, not edited) |

## Additions, October 30, 2026 (the contractor PIV path)

Added at the author's request. The path is set in Chapter 09, "The contractor PIV path", and its sources are logged in `_verification/09-credentials-and-certificates.md` (October 29) and the research page's log.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | New drift class: contractor credential drift (card with no contractor record; terminated or expired card with an open engagement) | Drift classes table | design (program default severity, as the table's note says) | — |
| 2 | PS-7 row: provider notifies terminations within an organization-defined period (PS-7d) | Control table | verified against SP 800-53 Rev. 5 PS-7(d) (c11-nist-80053); contribution and evidence columns are design | SP 800-53 Rev. 5 |
| 3 | "In this chapter" lists PS-7 | Callout | editorial | — |
