# Verification — Appendix B, Product Inventory Questionnaire

Writer W7. Source: `docs/compliance/Vol_0_Book_01_Product_Inventory_Questionnaire.md`. All sources opened October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | FedRAMP scope: cloud services that create, collect, process, store or maintain federal information, with exceptions; agencies must promote certified services within scope; only the agency decides scope | Scope rule | verified | fedramp.gov/2026/scope (quoting M-24-15) |
| 2 | Class B = Li-SaaS and Low, C = Moderate, D = High | Scope rule | verified | FedRAMP NTC-0004 |
| 3 | Agencies may use a package to authorize at any security category under the RMF | Scope rule | verified | NTC-0004 |
| 4 | Class doesn't replace the agency's categorization or risk decision; the agency's authorization documents its own use, configuration and integrations | Scope rule | verified | fedramp.gov/2026/agencies/use |
| 5 | Source's hard rule: every dependency Class C (Moderate); High-only flagged; on-premises gear via NIAP CC + DISA STIG + FIPS 140-3 + DoDIN APL | Scope rule | corrected: generalized to the system's categorization (agency-neutral); a higher class is recorded, not flagged; DoDIN APL (DoD-specific) dropped; NIAP and STIG references dropped because niap-ccevs.org (script-only page) and public.cyber.mil could not be opened; CMVP kept and verified | CMVP page |
| 6 | CMVP accepts FIPS 140-3 validations; FIPS 140-2 modules accepted through Sept 21, 2026, then Historical list | Scope rule, footnote | verified | csrc.nist.gov CMVP project page |
| 7 | AGU-USE-ABU (complete the ATO process), AGU-AGC-NAA (notify FedRAMP after authorizing use), AGU-AGC-GRC (GRC and inventory tools produce and ingest OSCAL JSON) | Scope rule; governance table | verified | fedramp.gov/2026/reference/agency-use |
| 8 | Marketplace location; machine-readable product data with fields fedramp_id, status, cert_class, impact_level | Recording status | verified | fedramp.gov/marketplace/products/; products.json (last change Oct 21, 2026, produced by GSA) |
| 9 | Marketplace statuses: FedRAMP Certified, Initial Implementation, FedRAMP In Process, Agency Authorization In Process, Legacy FedRAMP Ready | Recording status | verified (distinct values counted in products.json) | products.json |
| 10 | Source note: "FedRAMP Certified" introduced in the May 4, 2026 preview, launched June 25, 2026, mandatory January 1, 2027 | — | not carried (dates settled in Book 00 Ch01 and Book 10 Ch03; not needed here) | — |
| 11 | Microsoft-suite preference principle | Selection | restated-as-design, vendor-neutral | — |
| 12 | Example "Azure Arc cannot patch ESXi" | — | removed (not verified for this appendix) | — |
| 13 | Product-specific flags (Riverbed Class D only, SteelHead on-prem, Confluence Moderate only on Atlassian Government Cloud, ServiceNow High, Prisma Cloud High-only) and the vendor status reference table | Flags | removed; replaced by illustrative generic rows (statuses perishable; product names only as examples) | — |
| 14 | Product names in the example columns | Tables | carried as examples only, with no status claims; SailPoint moved from the PAM row to a new identity governance row; added rows for endpoint management, identity governance and training platforms (design) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Draft-proposal banner, internal banner, Date Code | Not carried | Internal stamps; agency shortcode |
| Purpose and how to use | Why the questionnaire comes first; How to complete it | Two-edition (agency and federal) mechanics dropped: the workbook has one agency-neutral template |
| Scope rule (agency edition, Moderate only) | The scope rule for cloud dependencies | Generalized and corrected (claim 5) |
| FedRAMP nomenclature note | Scope rule (classes); Recording FedRAMP status | Dates settled elsewhere |
| Selection principle | Selection: preference is earned by coverage, not ownership | Vendor-specific examples dropped |
| Pre-filled inventory (agency edition) | Why the questionnaire comes first (ships empty; filled copy stays with agency records) | No agency data |
| Discovery table, Volume I | Platforms, identity and transport | "Maps to" planes and volumes replaced by workbook books and key controls |
| Discovery table, Volume II | Devices and data platform | — |
| Discovery table, Volume III | Security operations | Coordination hub row moved to the governance table |
| Discovery table, Volume IV | Governance, coordination and assurance | — |
| Discovery tables, Volumes VII, VIII, IX | Governance, coordination and assurance (ITSM, CMDB, connectors, control assessment sources, IaC); DDI rows folded into naming and addressing; app registration and telephony rows folded into identity and communications rows | Volume IDs and ServiceNow-specific design statements dropped |
| Note on Volumes V and VI | IaC row; training platforms row | — |
| Flags and gaps summary | Flags and gaps (illustrative rows) | Product-specific rows removed (claim 13) |
| References — FedRAMP status sources | Recording FedRAMP status (Marketplace and its data file) | Vendor press links not carried |
