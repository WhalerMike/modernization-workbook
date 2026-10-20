# Verification — Appendix A, Requirements Mapping

Source: the existing page `appendix-a-requirements-mapping.md`. Control text and baseline membership were checked against NIST's OSCAL SP 800-53 Rev. 5.2.0 catalog and the Moderate and High baseline profiles (usnistgov/oscal-content). All sources accessed Oct 20, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Agency system authorized by its AO under RMF, not FedRAMP | Caveat callout | added (verified) | SP 800-37 Rev. 2; SP 800-53 CA-6 |
| 2 | M-22-09 identity actions: centralized identity integrated into apps; phishing-resistant MFA at the application layer; at least one device-level signal | Frameworks | verified; wording tightened to the memo's ("must consider at least one device-level signal"); FY 2024 due date added | M-22-09 §III.A |
| 3 | M-22-09 URL whitehouse.gov | Footnote | replaced with the archive URL used in Book 02 (both resolve; archive is stable) | — |
| 4 | ZTMM v2 identity functions and four stages | Frameworks | verified | CISA ZTMM v2.0 Table 2 |
| 5 | Seven SP 800-207 tenets | Frameworks | verified (tenets 1–4 read in text; 5–7 match §2.1) | SP 800-207 §2.1 |
| 6 | SP 800-53 Rev. 5 current release | Frameworks | added: Release 5.2.0, Aug 27, 2025 | CSRC SP 800-53 Rev. 5 page |
| 7 | CM-8, PM-5 for the estate | Table | verified (titles: System Component Inventory; System Inventory) | OSCAL catalog |
| 8 | AC-2, AU-2, AU-12, CM-8 for the audit | Table | verified | OSCAL catalog |
| 9 | IA-9, IA-5, AC-6 for the identity bridge | Table | verified | OSCAL catalog |
| 10 | AC-2, AC-2(3), IA-2, IA-2(1), IA-2(2), IA-5, CM-3 for login migration | Table | verified | OSCAL catalog |
| 11 | IA-2(8), CM-7, SC-8 for NTLM elimination | Table | corrected: SC-8 (transmission confidentiality) replaced by SC-23 (session authenticity); Kerberos doesn't encrypt TDS; SC-8 moved to the certificate row | OSCAL catalog |
| 12 | AC-2(1), AC-3, AC-6, AC-6(7), AC-2(7), AC-16 for access control | Table | edited: AC-3(13) Attribute-based Access Control added for HR-attribute dynamic membership | OSCAL catalog |
| 13 | IA-2, IA-9, AC-3, CA-3 for the application chain | Table | verified | OSCAL catalog |
| 14 | CA-7, AU-6, AU-12, AC-2(4), AC-6(9) for steady state | Table | verified | OSCAL catalog |
| 15 | SC-17, SC-12, IA-5(2), SC-8 for the CA | Table | verified; SC-8(1) added | OSCAL catalog |
| 16 | PM-5, SA-9 for the epilogue | Table | verified | OSCAL catalog |
| 17 | Baseline membership | New section | added: PM-5, IA-9, AC-2(7), AC-3(13), AC-16 are in neither Moderate nor High; all others are Moderate | OSCAL Moderate/High profiles |
| 18 | MFA is a CA outcome, not an engine setting | Notes | verified; added CA applies to users only, FIDO2 not supported for SQL on Arc | Learn, What is CA?; Conditional access (Azure SQL); Managed identity Limitations |
| 19 | Book numbers 02–11 in the table | Table | renumbered to chapter ranges per the brief's map; "Book 01" → Chapters 01–02; "Applicability" → Appendix C | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter (title, subtitle, description, doc-type `sql-server-narrative-book`) | House front matter; subtitle folded into description; `doc-type: workbook-chapter`; `lifecycle_review: 2027-04-01` | edited |
| docx-only H1 wrapper | Plain H1, thesis line and "In this appendix" callout (Books 02–05 style) | edited |
| "Compliance-enabling, not a compliance claim" callout | Kept; AO/RMF sentence added; check date Oct 20, 2026 | edited |
| "Download this appendix" callout | Not carried; bundles are linked from the book index | removed |
| § The four frameworks | Kept; M-22-09 wording and dates; 800-53 release; 800-53B | edited |
| § Mapping by book | "Mapping by part"; chapter ranges; rows 11, 12, 15 edited | edited |
| Sentence on Book 01 and Applicability | Kept, renumbered | edited |
| (new) § Controls outside the Moderate baseline | Added | added |
| § Notes on the mapping (4 notes) | Kept all four; MFA note extended; new note on IA-2(8)/SC-23 | edited |
| Footnotes `[^a-…]` | Renamed `[^aA-…]`, reformatted, re-opened | edited |
| Continue-the-series callout | Previous is Runbook R10 per reading order; Next Appendix B | edited |
