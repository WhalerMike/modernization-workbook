# Verification — Appendix C, Applicability

Checked October 20, 2026. Source: the existing series page "Applicability" (the former Chapter 00 of the Next Generation DDI series), retitled "Appendix C — Applicability" and verified in place. Microsoft claims were checked on Microsoft Learn; AWS claims on AWS documentation; authorization status on the FedRAMP Marketplace and FedRAMP's 2026 rules. No diagram (appendix).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | GCC-Moderate = Microsoft 365 GCC; Worldwide service instance; used at FedRAMP Moderate | Intro | verified: Worldwide endpoint set includes GCC; Marketplace lists MSO365MT as FedRAMP Certified, Class C (Moderate); noted that Microsoft's GCC service description uses broader FedRAMP wording ("High Impact level") and that the Marketplace listing governs | Learn, Office 365 GCC; Learn, M365 URLs; FedRAMP Marketplace MSO365MT |
| 2 | Chapters 01–12 apply as written in commercial/GCC-Moderate | Primary scope | kept (program scope statement) | — |
| 3 | SaaS DDI management needs FedRAMP Moderate "authorization" and an agency ATO | Primary scope | corrected to FedRAMP 2026 terms: the cloud service is certified; the agency authorizes its own system; never a standalone ATO for the CSO | FedRAMP, Using a FedRAMP Certified Cloud Service |
| 4 | INR not available in GCC-Moderate; Worldwide commercial only | Primary scope, FedRAMP High, table | verified (exact quote added) | Learn, INR |
| 5 | AWS VPC IPAM external-IPAM integration in commercial Regions | Primary scope | verified; private scopes and Advanced Tier prerequisite added | AWS VPC IPAM User Guide |
| 6 | M365 GCC-Moderate uses the Worldwide endpoint list → path consistency risk | Primary scope | verified (endpoint list); risk framing kept as program analysis | Learn, M365 URLs |
| 7 | Moderate-only policy plane doesn't cover High systems | FedRAMP High | kept (follows from impact levels); "authorized" → "certified" | FedRAMP rules |
| 9 | AWS VPC IPAM–Infoblox not in the AWS Regions authorized at High (GovCloud (US)) | Quick reference, High column | verified; China Regions also excluded; source is the AWS announcement | AWS What's New, Nov 17, 2025 |
| 13 | Air-gapped: no SaaS plane; no Protective DNS forwarding; local trust anchors; provider integrations only where an isolated region exists | Air-gapped | kept (program design position) | — |
| 14 | Quick reference: SaaS at Moderate "sufficient with agency ATO" | Table | corrected wording: sufficient for Moderate systems; agency authorizes its own system | FedRAMP rules |
| 15 | Quick reference: Protective DNS required for FCEB egress | Table | verified (M-22-09 "already required"); footnoted under the table | M-22-09 |
| 16 | Quick reference: Azure Private DNS DNSSEC signing not supported | Table | verified: signing requires the zone to be hosted by Azure Public DNS | Learn, How to sign your Azure Public DNS zone |
| 17 | Quick reference: Azure DNS Private Resolver row | Table | added from the roadmap | Learn, GA roadmap |
| 18 | Title "Applicability"; Chapter 00 framing | Page | retitled "Appendix C — Applicability" in `title:` and H1; `doc-type: workbook-chapter`; `lifecycle_review` 2027-04-01; keys `[^c00-…]` → `[^aC-…]` | brief |
| 19 | Download callout | Page | removed per brief | — |
| 20 | Continue links (Previous: book home; Next: Chapter 01) | Page | corrected per brief: Previous Appendix B, Book index, no Next | brief |
| 21 | Existing footnotes c00-gccdesc, c00-inr, c00-awsipam, c00-m365ww, c00-azgov | Footnotes | all re-opened and kept (rekeyed); c00-awsipam split into user guide and announcement so each claim cites the page that states it | as listed |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Italic subtitle line | `description` and a rewritten thesis line | — |
| Download this page callout | Not carried | brief: remove Word download callouts |
| Opening paragraph (architecture applies everywhere) | Opening prose | — |
| GCC-Moderate definition paragraph | Opening prose | Marketplace listing added |
| Primary Scope: Commercial Cloud at FedRAMP Moderate | "Primary scope: commercial cloud at FedRAMP Moderate" | — |
| AWS GovCloud (High) | "AWS GovCloud (US)" | carried |
| Air-Gapped and Classified Networks | "Air-gapped and classified networks" | — |
| Quick Reference table | "Quick reference" table | Private Resolver row added |
| Previous/Next links | "Continue the book" callout | per brief |

## Cross-chapter consistency pass (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|

## Moderate-civilian sweep (October 29, 2026)

The workbook targets FedRAMP Moderate civilian agencies. Configuration authority is the agency's CM-6 settings drawn from civilian sources; FedRAMP High material survives only as an optional reference labelled *High only*; AWS GovCloud (US) is treated as a valid Moderate location. Facts from the coordinator's verified fact pack (read 2026-10-29) or re-read by this writer on 2026-10-29 as noted.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| MS-1 | Primary scope: FedRAMP Moderate in commercial regions. The October 29 Moderate GovCloud subsection was removed on November 15, 2026 (WD-156) | Description, In this appendix, Primary scope | reframed per WD-156 | — |
| MS-6 | FedRAMP High section labelled High only | Section headings | kept as tier comparison, labelled | — |
| MS-7 | Quick-reference table: Moderate commercial, High only and air-gapped columns; the Moderate GovCloud column added on October 29 was removed on November 15, 2026 | Quick reference | reframed; cell facts carried from aC-awsipam-news | existing footnotes |

## Government-cloud rule (November 15, 2026)

Under WD-156 this appendix covers Moderate in the commercial regions only. Removed: the "Moderate workloads in AWS GovCloud (US)" subsection (MS-2 to MS-5) with footnotes `aC-aws-fedramp` and `aC-fr-ibx` (Book 08 Chapter 03 still carries the Infoblox Government Cloud fact), the GovCloud quick-reference column, and the October 29 region-authorization date in the description and callout.
