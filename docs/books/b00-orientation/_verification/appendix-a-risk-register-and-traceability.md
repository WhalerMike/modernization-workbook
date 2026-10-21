# Verification — Appendix A, Risk Register and Control Traceability

Writer: W5. Sources: `docs/operational-guides/program-management/master-project-plan.md` §10 (Risk Register, R-001–R-022) and the Compliance Amendment (milestone-to-control-family traceability, PL-2; risk register, RA-3); `PROJECT-PLAN.md` §6. Every NIST SP 800-53 reference was checked against csrc.nist.gov (SP 800-53 Rev. 5 publication page: release 5.2.0, August 27, 2025) and NIST's OSCAL Rev. 5 catalog and Low/Moderate baseline profiles (linked from csrc), downloaded October 21, 2026 (catalog version 5.2.0).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Milestone traceability satisfies/is PL-2; register is RA-3 | PL-2 and RA-3 section | corrected: both are system-level controls; program plan and register are inputs that trigger SSP update and RA review at each gate | SP 800-53 r5 PL-2, RA-3 statements (OSCAL catalog) |
| 2 | PL-2 content (components, dependencies, controls with tailoring rationale, AO approval, periodic review and update) | Same | verified | OSCAL catalog PL-2 a.2, a.9, a.12, a.15, c, d |
| 3 | RA-3 content (threats, likelihood/magnitude, document, review, update on change) | Same | verified | OSCAL catalog RA-3 a, c, d, f |
| 4 | Residual security risks cross-referenced to POA&M | Same | verified as CA-5 | OSCAL catalog CA-5 |
| 5 | SSP `FMP_185`, POA&M `FMP_189` | Same | removed (internal identifiers; the agency's own documents count) | — |
| 6 | Twenty control families and their names | Families table | verified | OSCAL catalog groups |
| 7 | Every cited control is in the Moderate baseline; CM-3, AC-6, AC-6(5), AC-6(7), IA-5(2), SC-17, SC-28, PL-8 not in Low | Families; traceability notes | verified (script over profiles) | OSCAL Low and Moderate profiles |
| 8 | Control titles: PL-2, PL-8, RA-3, RA-5, CA-2, CA-5, CA-7, CM-2, CM-3, CM-6, CM-7, CM-8, AC-2, AC-3, AC-6, AC-6(5), AC-6(7), IA-2, IA-2(1), (2), (12), IA-5, IA-5(2), SC-17, SC-20, SC-21, SC-22, SC-28, CP-9, CP-10, AT-2, AT-3, SA-2, SA-8, SA-22, MP-6, AU-6, AU-11, SI-4, SI-12 | Throughout | verified | OSCAL catalog |
| 9 | SA-22 text (replace unsupported components or provide alternative support) | Notes | verified | OSCAL catalog SA-22 |
| 10 | Family-level mapping per phase | Traceability table | restated-as-design (program's mapping; not a satisfaction claim) | — |
| 11 | Risk acceptance by Security Lead + Canon Steward | Register intro | corrected: AO accepts residual risk | Book 01 Ch09 (settled) |
| 12 | SP 800-30 Rev. 1, September 2012, current | Register intro | verified | csrc.nist.gov SP 800-30 r1 |
| 13 | R-002 ESC1–ESC8 from SpecterOps 2021 | R-002 | verified | SpecterOps, Certified Pre-Owned, June 17, 2021; Book 07 Ch03 |
| 14 | R-002 critical before pilot (Week 9) | R-002 | re-keyed: Critical before G0 (no open P1 findings), High before pilot | Book 01 Ch12 G0 |
| 15 | R-003 "application exception policies in Conditional Access" for NTLM | R-003 | corrected: CA can't evaluate NTLM | Book 01 Ch08 (settled) |
| 16 | R-004 Entra Connect staging mode | R-004 | updated: Cloud Sync default, Connect Sync with staging server where needed | Book 02 Ch09 (settled) |
| 17 | R-005 "procure Intune Suite licenses" | R-005 | updated: Cloud PKI add-on to Plan 1/2 (Suite or standalone), in M365 E5/E7 from July 2026; add-ons not supported in sovereign clouds (agency to confirm for its cloud; Cloud PKI page says available in GCC High) | MS Learn Cloud PKI overview; Intune planning guide; Intune add-ons |
| 18 | R-008 "follow-on document P2" active-passive replication | R-008 | removed reference; standby replica per Book 01 Ch03 | Book 01 Ch03 (settled) |
| 19 | R-011 strong-mapping failures as a future risk "before enabling CBA" | R-011 | corrected: Full Enforcement with Feb 2025 update; Compatibility fallback ended with Sept 9, 2025 update; Entra CBA is a separate binding check | Microsoft Support KB5014754 |
| 20 | R-016 dynamic group processing can exceed 24 h | R-016 | verified (settled) | Book 01 Ch04 |
| 21 | R-017 "maintain password fallback" | R-017 | restated-as-design: documented, time-limited fallback method | — |
| 22 | R-019 extension-attribute selection | R-019 | linked to canonical map | Book 03 Ch06 (settled) |
| 23 | R-020 72-hour rollback | R-020 | corrected (see Ch10 claim 6) | MS Learn AD FS decommission guide |
| 24 | R-021 "destroy workstation" | R-021 | updated: sanitize under SP 800-88 Rev. 2 | csrc.nist.gov SP 800-88 r2 |
| 25 | Likelihood/impact ratings for R-001–R-022 | Register | restated-as-design (program's starting ratings) | Master plan §10 |
| 26 | R-023–R-025 | Added risks | restated-as-design (program additions from Book 01/07/08 corrections) | Book 01 Ch09, Ch12; Book 07 Ch07; Book 08 Ch10 |
| 27 | Control assignments per risk | Register | restated-as-design | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Compliance Amendment heading and purpose | "What PL-2 and RA-3 ask for" | Corrected framing (claim 1) |
| Amendment — Milestone-to-control-family traceability (PL-2) | Families table; traceability table; notes | The source had no table; built here from the milestones |
| Amendment — Risk register (RA-3): fields, POA&M cross-reference, review at each gate | Register intro; CA-5 | Internal IDs removed |
| Master plan §10 Risk Register R-001–R-022 | "Delivery risks" table | Corrections noted inline; Status column moved to the agency's register (all OPEN in source) |
| PROJECT-PLAN §6 Risks and Mitigations (5 rows) | "Program-level risks" P-1–P-5 | Also summarized in B00 Ch05 |
| PROJECT-CHARTER §8 Key Risks | — | Overlaps PROJECT-PLAN §6 (same four themes); charter belongs to Ch03 |
| Master plan §7.3 Scaling risk management | — | Wave-level risks belong to Ch09 (rollout) |
| Master plan Appendix D (risk register updates on gate agenda) | Register intro ("reviewed at every gate review") | — |
