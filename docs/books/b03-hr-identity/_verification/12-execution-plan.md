# Verification — 12-execution-plan.md

Editor pass 2026-10-20. Edited in place; structure, gates, thresholds and roles kept.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Phase 0 actions come from the Federal HR 2.0 memo's preparation actions (IPT POC, working-group POCs, integration points/interfacing systems/data flows, legacy data retention and preservation) | Phase 0 | verified; added "for CFO Act agencies, a full-time project manager" from Appendix C | OMB/OPM memo, Dec 10, 2025, Appendix C (`[^c12-hr20memo]`) |
| 2 | Agencies pause competing Core HCM modernization | Phase 0 | verified; added that exceptions come only from the OMB and OPM Directors | Memo §II |
| 3 | Gate: inventory submitted to the agency's HR 2.0 team | Phase 0 gate | restated-as-design; added that responses go to OMB and OPM as the memo directs | Memo §II |
| 4 | bulkUpload: up to 50 operations per call; pace to the stricter rate limit | Phase 2 | verified | MS Learn, API-driven inbound provisioning concepts (`[^c12-api-limits]`) |
| 5 | "Daily call budget against the tenant cap" (unquantified) | Phase 2 | corrected/specified: 2,000 calls/24 h with Entra ID P1/P2, 6,000 with Entra ID Governance; 300,000 records/day at 50 ops | same |
| 6 | Custom task extensions for device retirement and CMS revocation | Phase 2 | verified; added licensing (ID Governance or Entra Suite) and Logic App mechanism | MS Learn, What are lifecycle workflows?; Lifecycle Workflow built-in tasks |
| 7 | Access package approvals can route to the supervisor of record | Phase 4 | verified; added that "Manager as approver" reads the `manager` attribute and needs a fallback approver | MS Learn, access package approval settings (`[^c12-ap-approval]`) |
| 8 | eOPF/EHRI decommission: memo says "eventually" | Register | verified (memo §I: Core HCM will "eventually" make them redundant) | Memo §I |
| 9 | Nature-of-action codes checked against GPPA, October 2026 edition | Register | verified (PDF cover "October 2026") | OPM GPPA (`[^c12-gppa]`) |
| 10 | Entra ID Governance for Government available in GCC, GCC High, DoD | Register (closed item) | verified; footnote key renamed `c10-lf` → `c12-lf` | MS Learn, ID Governance licensing fundamentals |
| 11 | GCC tenants run in Azure Global | Register | verified; key renamed `c10-crl-gcc` → `c12-crl-gcc`, title updated to current page title | MS Learn, CBA CRL FAQ |
| 12 | API-driven inbound provisioning available to US Government tenants | Register | verified (added) | MS Learn, Microsoft Entra feature availability |
| 13 | Thresholds (99% correlation, zero missed leavers, etc.) are proposed criteria, not federal requirements | Sequencing | restated-as-design (already framed so) | — |
| 14 | At least two provisioning agents under a gMSA | Phase 3 | verified upstream; cross-referenced to Chapter 05 (footnoted there), no new footnote | Chapter 05 |
| 15 | Shadow mode, leaver-first, phase gates, roles | throughout | restated-as-design (program design, no footnote) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | kept; added `part: How`; `lifecycle_review` 2027-01-01 → 2027-04-01 | — |
| Thesis, In this chapter | kept | — |
| Sequencing principle (incl. "About the numbers in the gates") | kept | — |
| Diagram ch12-phase-gates | kept; source unchanged (no wrong fact) | — |
| Phase 0 | edited (IPT detail, exception path, gate wording, memo footnote) | — |
| Phase 1 | kept | — |
| Phase 2 | edited (throttling numbers; LCW licensing and extension mechanism) | — |
| Phase 3 | kept | — |
| Phase 4 | edited (manager-as-approver detail) | — |
| Phase 5, Phase 6 | kept | — |
| Program at a glance table | kept | — |
| Roles table | kept | — |
| Open verification register | edited (memo quote, GPPA footnote, closed item footnotes renamed and one added) | — |
| Continue callout | edited to "Continue the book" / "Book index" | — |
