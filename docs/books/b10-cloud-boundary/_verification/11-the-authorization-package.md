# Verification — Chapter 11, Evidencing the Boundary in the Authorization Package

Writer: W4. Verified 2026-10-21. Built from the *Boundary Impact Model* ("What this means for an ATO package"; ATO documentation surface) and *What Changed at FedRAMP* (§1.3, §1.4, §6 "Rev 5 and 20x coexist"). NIST SP 800-37 read from the PDF text; SP 800-53 controls from the NIST OSCAL 5.2.0 catalog JSON; FedRAMP rules from fedramp.gov/2026; Marketplace data from `products.json` (downloaded and parsed 2026-10-21).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Agency should never create a standalone ATO for a CSO; authorizes its own system using it as an external service; remains responsible for its own ATO or ATU | Opening | verified | fedramp.gov/2026/agencies/use (c11-fedramp-use) |
| 2 | Package = security and privacy plans, assessment reports, POA&Ms, executive summary; assembled by system owner, CCP, SAOP | What the package is | verified | SP 800-37 Task R-1 (c11-sp80037) |
| 3 | Decision types: ATO, ATU, common control authorization, denials | What the package is | verified | SP 800-37 Task R-4 |
| 4 | ATU: same responsibility and authority as ATO; customer remains responsible and accountable | What the package is | verified | SP 800-37 Appendix F |
| 5 | SSP contains only agency-responsible information; covers what agency implements, configures, operates or inherits | What the package is | verified | c11-fedramp-resp; c11-fedramp-use |
| 6 | "Do not copy and paste provider controls…"; provider corrective actions "should not be blindly copied into agency POA&Ms"; review boundary, included services, inherited controls, customer responsibilities | What the package is | verified | fedramp.gov Rev5 packages page (c11-fedramp-rev5) |
| 7 | AGU-USE-RSG, AGU-AGC-NAA, AGU-AGC-GRC | What the package is | verified | c11-fedramp-agu |
| 8 | BIM three ATO requirements (boundary in SSP with dispositions; compensation per dimension; drift findings cite boundary) | The boundary as one artifact | restated-as-design | Program's Boundary Impact Model |
| 9 | Boundary record kept by system owner | The boundary as one artifact | restated-as-design | Program model (Chapter 08) |
| 10 | P-11 boundary determined by AO; PL-2 components, operational environment, dependencies and connections | Package table | verified | SP 800-37; SP 800-53 PL-2 (c11-sp80053) |
| 11 | SA-9 text (oversight roles; ongoing monitoring of provider compliance) | Package table | verified | c11-sp80053 |
| 12 | CA-3 text (exchange agreements: interface characteristics, requirements, responsibilities, impact level) | Package table | verified | c11-sp80053 |
| 13 | CA-5 and CA-7 | Package table; ongoing | verified | c11-sp80053 |
| 14 | OSCAL component definition describes controls supported by a hardware, software or service implementation; SSP in implementation layer; POA&M in assessment layer | Package table; two models | verified | NIST OSCAL site (c11-oscal) |
| 15 | MSO365MT description: "leverages Azure Government as the IaaS/PaaS…"; relies on Azure Government-inherited services; GCC SKU required | Know whose package | verified | products.json (c11-fr). Tension with "GCC paired with Entra ID in commercial Azure" is handled in Chapter 04 |
| 16 | Azure Government F1603087869 and Azure Commercial Cloud F1209051525, both Certified Class D (High) | Know whose package | verified | products.json (c11-fr) |
| 17 | MSO365MT `trust_center` and `secure_configuration_guidance` fields empty as of Oct 21, 2026 | Know whose package | verified | products.json (c11-fr); stated as a snapshot, not as absence of guidance |
| 18 | Microsoft: use Microsoft certifications as the foundation, but "need to achieve your own authorizations for components outside these services" | Know whose package | verified | MS Learn offering-fedramp FAQ (c11-ms-fedramp). Same page carries stale JAB/P-ATO and "impact levels" wording; not cited for those |
| 19 | Four narrative patterns (inherited, shared, agency, compensating) | Narratives | restated-as-design | Program model, grounded in FedRAMP SSP scope rule |
| 20 | SCN timings in business days; human-readable and JSON; 12 months retained | Keeping current | verified; corrected | fedramp.gov SCN page (c11-scn). Whitepaper §1.3 said "30 days before"; rule is 30 business days. Whitepaper "machine-readable" = rule's JSON |
| 21 | Customer organization must ensure provider shares monitoring information and notifies significant changes | Keeping current | verified | SP 800-37 Appendix F |
| 22 | CCM-AGM-ROR: agencies MUST review each Ongoing Certification Report; CCM-AGM-CSC SHOULD consider security category when assigning resources | Keeping current | verified | fedramp.gov CCM page (c11-fedramp-ccm). Note: AGU-USE-ROR states the same review as SHOULD; the CCM rule is MUST, so the chapter uses "must" |
| 23 | AGU-USE-DSO and AGU-USE-NFC | Keeping current | verified | c11-fedramp-agu |
| 24 | Significant change definition and examples | Keeping current | verified | SP 800-37 Appendix F |
| 25 | Rev5 new certification requests end June 11, 2027; mandatory adoption January 1, 2027 | Two models | verified | fedramp.gov/2026/timeline (c11-timeline) |
| 26 | Whitepaper: "Rev5 certifications remain valid to at least 2028-12-31" | Two models | removed | Not in FedRAMP's timeline; Book 09 Ch03 records the end date as not finalized ("likely no later than 2029"). Not repeated |
| 27 | MAS, SCN, CDS apply to Rev5 Class C | Two models | verified | fedramp.gov rev5/c (c11-rev5c) |
| 28 | CDS-TRC-PAC programmatic access to all certification data; CDS-TRC-USH uninterrupted sharing | Two models | verified | fedramp.gov CDS page (c11-cds). Whitepaper's "access logged for six months" verified (CDS-TRC-ACL) but not used |
| 29 | Assessor checklist; "what changes" table | End | restated-as-design | Program model |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| *Boundary Impact Model* — "What this means for an ATO package" (three bullets; "first-class governed object") | "The boundary as one artifact" (numbered list), opening paragraph | — |
| *Boundary Impact Model* — "How FMP compensates" item 4, ATO documentation surface (SSP, POA&M, component definition reference one artifact) | Boundary record; package-map diagram and table | — |
| *Boundary Impact Model* — drift-class mapping | "The boundary as one artifact" (drift findings cite the boundary); continuous monitoring row | Model is Chapter 02's |
| *Boundary Impact Model* — other sections | Not carried here | Chapters 02, 08 and 09 |
| *What Changed at FedRAMP* — §1.3 change control (SCN classes) | "Keeping the package current" (provider change notices) | Full table is Chapter 03's |
| *What Changed at FedRAMP* — §1.4 certification data as an API (CDS-TRC) | "Two models at once" | Detail is Chapter 03's |
| *What Changed at FedRAMP* — §6 "Rev 5 and 20x coexist" | "Two models at once" | "Valid to at least 2028-12-31" removed (claim 26) |
| *What Changed at FedRAMP* — §6 other paragraphs (Moderate/High naming, AD not forced, synchronized users) | Not carried | Chapters 03/04; identity facts belong to Book 02 |
| *What Changed at FedRAMP* — §2–§5, §7 | Not carried here | Chapters 04, 09 and Appendix A |
