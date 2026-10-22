# Verification — Appendix C, Applicability

Checked October 20, 2026. Source: the existing series page "Applicability" (the former Chapter 00 of the Next Generation DDI series), retitled "Appendix C — Applicability" and verified in place. Microsoft claims were checked on Microsoft Learn; AWS claims on AWS documentation; authorization status on the FedRAMP Marketplace and FedRAMP's 2026 rules. No diagram (appendix).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | GCC-Moderate = Microsoft 365 GCC; Worldwide service instance; used at FedRAMP Moderate | Intro | verified: Worldwide endpoint set includes GCC; Marketplace lists MSO365MT as FedRAMP Certified, Class C (Moderate); noted that Microsoft's GCC service description uses broader FedRAMP wording ("High Impact level") and that the Marketplace listing governs | Learn, Office 365 GCC; Learn, M365 URLs; FedRAMP Marketplace MSO365MT |
| 2 | Chapters 01–12 apply as written in commercial/GCC-Moderate | Primary scope | kept (program scope statement) | — |
| 3 | SaaS DDI management needs FedRAMP Moderate "authorization" and an agency ATO | Primary scope | corrected to FedRAMP 2026 terms: the cloud service is certified; the agency authorizes its own system; never a standalone ATO for the CSO | FedRAMP, Using a FedRAMP Certified Cloud Service |
| 4 | INR not available in GCC-Moderate; Worldwide commercial only | Primary scope, GCC High, table | verified (exact quote added) | Learn, INR |
| 5 | AWS VPC IPAM external-IPAM integration in commercial Regions | Primary scope | verified; private scopes and Advanced Tier prerequisite added | AWS VPC IPAM User Guide |
| 6 | M365 GCC-Moderate uses the Worldwide endpoint list → path consistency risk | Primary scope | verified (endpoint list); risk framing kept as program analysis | Learn, M365 URLs |
| 7 | Moderate-only policy plane doesn't cover High systems | GCC High | kept (follows from impact levels); "authorized" → "certified" | FedRAMP rules |
| 8 | GCC High uses own endpoints, many under .us | GCC High | verified; examples added (outlook.office365.us, *.sharepoint.us, gov.teams.microsoft.us, login.microsoftonline.us) | Learn, GCC High endpoints (last updated 07/01/2026) |
| 9 | AWS VPC IPAM–Infoblox not in GovCloud | GCC High, table | verified; China Regions also excluded; source is the AWS announcement | AWS What's New, Nov 17, 2025 |
| 10 | Azure Government feature availability differs; confirm Private Resolver, DNS security policy, DNSSEC | GCC High | verified and made specific: roadmap shows DNS private and public zones GA at FedRAMP High, IL4, IL5; Private Resolver GA at FedRAMP High; DNS security policy and DNSSEC not on the roadmap, so "confirm" kept for those | Learn, Compare Azure Gov; Learn, Azure Gov GA roadmap (Oct 4, 2026) |
| 11 | Private endpoint zone names differ in Azure Government | GCC High | added | Learn, Private Endpoint private DNS zone values, Government |
| 12 | DoD: GCC High section plus DoD CC SRG; book doesn't map it | DoD | verified; added Azure Government IL4/IL5 provisional authorizations (separate IL5 PAs for US Gov and US DoD regions) and Private Resolver forecast at IL4/IL5 | Learn, Azure Government DoD Overview; GA roadmap |
| 13 | Air-gapped: no SaaS plane; no Protective DNS forwarding; local trust anchors; provider integrations only where an isolated region exists | Air-gapped | kept (program design position); Azure Government Secret example added (private zones GA; Private Resolver awaiting review; public zones planned) | Learn, GA roadmap |
| 14 | Quick reference: SaaS at Moderate "sufficient with agency ATO" | Table | corrected wording: sufficient for Moderate systems; agency authorizes its own system | FedRAMP rules |
| 15 | Quick reference: Protective DNS required for FCEB egress | Table | verified (M-22-09 "already required"); footnoted under the table | M-22-09 |
| 16 | Quick reference: Azure Private DNS DNSSEC signing not supported | Table | verified: signing requires the zone to be hosted by Azure Public DNS | Learn, How to sign your Azure Public DNS zone |
| 17 | Quick reference: Azure DNS Private Resolver row | Table | added from the roadmap | Learn, GA roadmap |
| 18 | Title "Applicability"; Chapter 00 framing | Page | retitled "Appendix C — Applicability" in `title:` and H1; `doc-type: workbook-chapter`; `lifecycle_review` 2027-04-01; keys `[^c00-…]` → `[^aC-…]` | brief |
| 19 | Download callout | Page | removed per brief | — |
| 20 | Continue links (Previous: book home; Next: Chapter 01) | Page | corrected per brief: Previous Appendix B, Book index, no Next | brief |
| 21 | Existing footnotes c00-gccdesc, c00-inr, c00-awsipam, c00-m365ww, c00-m365gcch, c00-azgov, c00-azdod | Footnotes | all re-opened and kept (rekeyed); c00-awsipam split into user guide and announcement so each claim cites the page that states it | as listed |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Italic subtitle line | `description` and a rewritten thesis line | — |
| Download this page callout | Not carried | brief: remove Word download callouts |
| Opening paragraph (architecture applies everywhere) | Opening prose | — |
| GCC-Moderate definition paragraph | Opening prose | Marketplace listing added |
| Primary Scope: Commercial Cloud at FedRAMP Moderate | "Primary scope: commercial cloud at FedRAMP Moderate" | — |
| GCC High, Azure Government and AWS GovCloud (High) | "GCC High, Azure Government and AWS GovCloud (US)" | roadmap facts and Private Endpoint zone names added |
| DoD (Impact Levels 4 and 5) | "DoD (impact levels 4 and 5)" | — |
| Air-Gapped and Classified Networks | "Air-gapped and classified networks" | Azure Government Secret example added |
| Quick Reference table | "Quick reference" table | Private Resolver row added |
| Previous/Next links | "Continue the book" callout | per brief |

## Cross-chapter consistency pass (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| CP-1 | Confirm DNS resolver policy (formerly DNS security policy) availability in Azure Government | Azure Government bullet | name updated | Microsoft Learn, "DNS resolver policy," <https://learn.microsoft.com/en-us/azure/dns/dns-security-policy> (opened Oct 21, 2026): page title and every heading use "DNS resolver policy"; portal resource "DNS Resolver Policies"; URL keeps `dns-security-policy`; networking design guide <https://learn.microsoft.com/azure/networking/design-guide/dns-security> still says "DNS security policy" |
