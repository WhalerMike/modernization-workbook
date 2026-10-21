# Verification — Chapter 08, Privacy: PII Processing and Transparency

Checked October 21, 2026 by writer W4. Source: `docs/compliance/Vol_IV_Book_04_PII_Processing_Transparency.md` (6,216 words), archived after the book is built and not linked. The source was written for one named agency and its programs (citizen portal, benefit adjudication, specific partner agencies and data exchanges); every agency-specific scenario, statute placeholder and Quarto shortcode was replaced with generic templates. Control text and the privacy baseline come from NIST's OSCAL catalog (SP 800-53 Rev. 5, release 5.2.0) and the OSCAL privacy baseline profile, parsed locally. The Privacy Act was read on the Cornell LII text of 5 U.S.C. § 552a including statutory notes; OMB Circulars A-108 and A-130 and Memoranda M-17-12 and M-10-22 were downloaded from whitehouse.gov / the Obama White House archive and read as text; M-03-22 (with section 208 in Attachment A) was read on the George W. Bush White House archive. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Privacy baseline applied irrespective of impact level | Opening | verified | SP 800-53B abstract, csrc |
| 2 | No PT control carries a FedRAMP Rev5 class | Opening | verified (new) | fedramp.gov/2026 Rev5 control reference, PT |
| 3 | Ten KSI themes, none privacy | Opening | verified | fedramp.gov/2026 KSI page |
| 4 | Source KSI-PIY/SVC/IAM/MLA "indirect coverage" table and "until FedRAMP PMO publishes PT→KSI mappings" | — | removed | Internal mapping; FedRAMP KSIs bind providers and contain no privacy theme |
| 5 | PT-1 to PT-8 statements and enhancements | PT family table | verified | NIST OSCAL catalog |
| 6 | Privacy baseline membership of PT base controls and PT-5(2), PT-6(1), PT-6(2), PT-7(1), PT-7(2); others out | PT family table | verified | OSCAL privacy baseline profile |
| 7 | Privacy baseline also includes PM-18, PM-19, PM-5(1), RA-8 | PT family | verified | OSCAL privacy baseline profile |
| 8 | Source called PT-1 the "Privacy Program Plan" | PT family | corrected | Catalog: privacy program plan is PM-18 |
| 9 | Source covered six PT controls, omitted PT-6, PT-8 | PT family | corrected (added) | Catalog |
| 10 | Privacy Act: system of records definition (a)(5); (e)(3) four elements on form or separate form; (e)(4); (e)(7); (e)(11) 30 days; (r) advance notice to OMB and committees; (u) Data Integrity Boards | Legal frame | verified | 5 U.S.C. § 552a, Cornell LII |
| 11 | Section 208: PIA before developing/procuring IT or new collection from 10+ persons; website privacy policies incl. machine-readable formats | Legal frame; website policies | verified | M-03-22 §II.B and Attachment A |
| 12 | A-130: SAOP; limit PII; SSN reduction; PIAs; website privacy policies; records schedules | Legal frame; PT-2 | verified | A-130 §5.f.1 |
| 13 | A-130 App II: FIPPs; PII inventory; PIA continuous through life cycle | Legal frame; data-flow map; PIA | verified | A-130 App II §3, §5.b, §5.e |
| 14 | A-130 App I: SAOP approves privacy plans before authorization; reviews packages before AO decision | Legal frame; assessment | verified (new) | A-130 App I §4(e)(8)–(9) |
| 15 | M-17-12 Jan 3, 2017; breach response plan; tabletop "not less than annually" | Legal frame; assessment | verified | M-17-12 §VII, §X.A |
| 16 | Authority matrix; "general mission authority" insufficient; counsel signs | PT-2 | restated-as-design | Source template |
| 17 | Source fixed retention periods (7 years, 5 years) | PT-2 | removed | Retention from records schedule (A-130 §5.f.1(h)) |
| 18 | Source "40-day advance review (A-108)" | SORNs | corrected | A-108 §7.b: report ≥30 days before FR submission; OMB 30 days; not concurrent with publication |
| 19 | Routine uses: 30-day comment after publication | SORNs | verified | Privacy Act (e)(11); A-108 §6 |
| 20 | "At least 60 days" planning figure | SORNs; milestones | restated-as-design | Derived from #18 and #19 |
| 21 | A-108 significant-change examples incl. substantially greater access and new routine use; SORNs accurate, up-to-date, appropriately scoped | SORNs | verified | A-108 §6 list; §12.b |
| 22 | Source "SORN review every 3 years" | SORNs | removed | Not an OMB rule; PT-6(1)/(2) leave frequency to agency |
| 23 | Source "OMB A-130 Section 5 requires accounting of disclosures" | — | removed | Not verified as stated; accounting of disclosures is Privacy Act (c), not carried |
| 24 | Purpose matrix, annual checklist, SAOP sign-off | PT-3 | restated-as-design | Source template, genericized |
| 25 | Use not in matrix → PIA update and possibly SORN change | PT-3 | verified (as A-108 significant change for purpose change) | A-108 §6 item (4) |
| 26 | PT-2(1), PT-3(1) data tagging, outside privacy baseline | Tagging | verified | Catalog; baseline profile |
| 27 | Source: Purview custom attributes enforce purpose limits as DLP conditions | Tagging | corrected | Microsoft Learn managed attributes: metadata key-value pairs; enforcement is labels/DLP (Book 12 Ch09) |
| 28 | Statute vs consent principle | Notice and consent | restated-as-design | Source; consistent with PT-4/PT-5 text |
| 29 | Privacy Act statement on form/separate form regardless of medium; telephone: read aloud, offer in writing; five elements incl. SORN citation; plain-language routine-use summary allowed | Privacy Act statements | verified (new) | A-108 §6.l and footnotes 59, 61 |
| 30 | Source attributed notice elements to M-03-22 | Privacy Act statements | corrected | Privacy Act (e)(3); A-108 §6.l |
| 31 | Model Privacy Act statement | Privacy Act statements | restated-as-design | Source model notice, de-branded |
| 32 | M-03-22 §III website privacy policy content (call it "Privacy Policy"; voluntary/consent; rights; PA statement at collection or link; automatic collection) | Website policies | verified | M-03-22 §III |
| 33 | Source "E-Gov Act §208(b)(1)" for website policy | Website policies | corrected | Website policies are §208(c); (b) is PIA |
| 34 | Source: FedRAMP 20x requires machine-accessible privacy notice URL | Website policies | removed | No FedRAMP rule found (fedramp.gov search, PT page); real machine-readable requirement is §208(c) |
| 35 | M-10-22 June 25, 2010: three tiers; easy opt-out; Tier 3 opt-in; SAOP review, 30-day comment, CIO written approval for Tier 3; retention ≤ 1 year; rescinded M-03-22 III(D)(2)(v) | Website policies | verified | M-10-22 PDF |
| 36 | Source: analytics cookies need consent banner under M-10-22 | Consent matrix | corrected | M-10-22 requires easy opt-out for Tiers 1–2; opt-in only Tier 3 |
| 37 | Consent matrix rows | Consent matrix | restated-as-design | Source, de-branded; vendor product name and agency statute placeholders removed |
| 38 | Unchecked opt-in box | Consent matrix | restated-as-design | Source pattern; tied to PT-4 text |
| 39 | PT-7(1) three duties; PT-7(2) | Specific categories | verified | Catalog |
| 40 | Privacy Act §7: no denial for refusing SSN; tell mandatory/voluntary, authority, uses | Specific categories | verified (new) | Pub. L. 93-579 §7, statutory note to § 552a |
| 41 | SSN Fraud Prevention Act 2017, Pub. L. 115-59, Sept 15, 2017; no SSN on mailed documents unless agency head determines necessary; applies from Sept 15, 2022 | Specific categories | verified (new) | govinfo PLAW-115publ59 |
| 42 | Source: SSN rules from M-17-12 | Correction callout | corrected | M-17-12 is breach guidance; SSN reduction is A-130 / PT-7(1) |
| 43 | Last-four display rule | Specific categories | restated-as-design | Source |
| 44 | Source special-categories authority table (GLBA, M-22-10 biometrics, M-14-06 geolocation, citizenship "OMB guidance", GINA, 42 CFR Part 2, agency act §1106) | Specific categories | removed | Several attributions don't support the claims; replaced by PT-7 categories plus counsel determination |
| 45 | HIPAA Privacy Rule applies to covered entities and business associates (45 CFR 164.500) | Specific categories | verified | Cornell LII 45 CFR 164.500 |
| 46 | Special-category control matrix | Specific categories | restated-as-design | Source, label names generalized, "6-year"/"7-year" retention and "TLS 1.3/AES-256 CMK" specifics generalized |
| 47 | Purview built-in SITs: U.S. SSN, credit card number, U.S./U.K. passport number | Specific categories | verified | Microsoft Learn SIT entity definitions |
| 48 | Source "trainable classifier: PHI" auto-label row | — | removed | Not verified as a named classifier; labeling deferred to Book 12 Ch09 |
| 49 | PM-5(1) inventory of PII | Data-flow map | verified | Catalog |
| 50 | Data-flow register; four required scenarios | Data-flow map | restated-as-design | Source, de-branded (named partner agencies, programs, products removed) |
| 51 | Matching program → PT-8 steps; Data Integrity Board; matching notice with 30-day advance report | Data-flow map | verified | Catalog PT-8; Privacy Act (o), (u); A-108 §§8–9 |
| 52 | Source "individuals deemed notified through originating agency's SORN" | Data-flow map | restated-as-design | Kept as "confirm the sending agency's routine use covers the use" |
| 53 | Source: Purview lineage "provides automated discovery of data flows" | Automated discovery | corrected | Microsoft Learn: scans capture metadata/classifications; lineage from connected Data Factory/Synapse |
| 54 | Quarterly scan comparison | Automated discovery | restated-as-design | Source |
| 55 | PIA triggers list; exclusion for government personnel/contractors | PIA | verified | M-03-22 §II.B |
| 56 | A-130: PIA with program managers, owners, security, counsel; continuous | PIA | verified | A-130 App II §5.e |
| 57 | Privacy threshold analysis | PIA | restated-as-design | Common agency practice, not OMB-defined |
| 58 | RA-8 statement | PIA | verified | Catalog |
| 59 | A-108: PCM replaced annual Privacy Act reviews; ongoing assessment; minimum elements (minimization, SORNs, routine uses) | Assessment | verified (new) | A-108 §12 |
| 60 | Source "annual privacy assessment within 365 days" and "within 365 days of ATO grant" | Assessment | restated-as-design | Cadence table labeled program design |
| 61 | Privacy oversight cadence table | Assessment | restated-as-design | Source, corrected (#22) |
| 62 | Go-live milestones | Milestones | restated-as-design | Source table corrected (#18, #20); "30 days before live collection" for notice removed as unsupported |
| 63 | Ownership roles; SAOP duties | Who owns what | verified (SAOP duties) / restated-as-design (others) | A-130 |
| 64 | Source "FIPS-validated TLS 1.2+; this series standardizes on TLS 1.3 with mTLS" | Data-flow register | restated-as-design | Kept as "TLS with mutual authentication" in the register; FIPS claim not carried |
| 65 | Source "PPP co-signed by SAISO/CISO and SAOP" | — | removed | Not a cited requirement; SAOP approval of privacy plans carried from A-130 |
| 66 | NIST SP 800-122 (April 2010) in source authority list | — | verified, not used | csrc SP 800-122 page; not needed in the chapter |
| 67 | "Privacy closes through documents" | Who owns what | restated-as-design | Source "Closure Necessity — PT family," translated |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, draft banner, Date Code, agency shortcodes | — | Internal stamps and agency placeholders; never carried |
| What This Document Addresses (8 deliverables) | In this chapter; section structure | Deliverables kept as templates; counts and "closes six controls" corrected (#9) |
| Purpose and Scope: Document Purpose; Relationship to Prior Parts | Opening; tagging; PT family | Volume cross-references replaced by links to Book 12 Ch09 and Chapter 05 |
| Scope (citizen portals, contact center, HR, API integrations) | Data-flow map scenarios | Agency-specific programs and partner agencies removed |
| Privacy Program Plan (PT-1): requirement; linkage | PT family | Corrected to PT-1 policy vs PM-18 plan (#8); program plan detail to Chapter 05 |
| PPP template §1 Purpose and Scope | — | Agency-specific; superseded by PM-18 in Chapter 05 |
| PPP template §2 Legal and Regulatory Authority | Legal frame | Each authority re-verified; FedRAMP 20x line dropped |
| PPP template §3 Roles and Responsibilities | Who owns what | Restated by role |
| PPP template §4 Program Oversight Cadence | Assessment cadence table | Corrected (#22, #60) |
| Authority to Process (PT-2): requirement; Legal Authority Matrix | PT-2 | Template kept; retention fixed values removed (#17) |
| SORN Requirements | SORNs (PT-6) | Timeline corrected (#18–21) |
| SORN register table and agency SORN URL | SORN register template | Agency URL removed |
| A-130 cross-reference on accounting of disclosures | — | Not verified as stated (#23) |
| Purpose Specification (PT-3): matrix | Purposes | Template kept, de-branded |
| Purview Data Map Integration | Tagging purpose in the data catalog | Corrected (#27) |
| Purpose Limitation Review Checklist | Purposes (annual check) | Folded into prose as design |
| Consent Requirements (PT-4); Federal Consent vs Statutory Authority | Notice and consent | Kept; M-10-22 corrected (#36) |
| Consent Mechanism Matrix | Consent matrix | De-branded; product names and statute placeholder removed |
| Consent Pattern Notes (checkbox, notice at collection, inter-agency DSA) | Consent matrix note; data-flow map | Kept as design |
| Privacy Notice (PT-5): requirement; Required Notice Elements | Privacy Act statements | Corrected attribution (#30); fifth element added (#29) |
| Model Privacy Notice | Model Privacy Act statement | De-branded; agency statute example removed |
| Web Notice Placement Requirements | Website policies | Corrected (#33); table replaced by verified M-03-22 and M-10-22 rules |
| FedRAMP 20x Machine-Accessible Notice Requirement | Website policies | Removed as unverifiable (#34) |
| Specific Categories (PT-7): requirement; Special Categories table | Specific categories | Authorities replaced (#44) |
| Special Category Control Matrix | Specific-category control matrix | Generalized (#46) |
| PHI Subset — HIPAA Applicability | Specific categories (HIPAA) | Agency-specific program examples removed; rule verified (#45) |
| SSN Handling — "OMB M-17-12 Requirements" | Specific categories; correction callout | Corrected (#40–43) |
| SSN Masking Policy table | SSN display register | Kept as template |
| Purview Auto-Labeling for Special Categories | Specific categories (SITs) | Verified SIT names; detail deferred to Book 12 Ch09 (#47–48) |
| PII Data Flow Map Template: purpose; registry | Data-flow map | Rows de-branded (#50) |
| Required Data Flow Scenarios 1–4 | Data-flow map | Kept as design; matching determination added (#51) |
| Azure Purview Lineage Integration | What automated discovery adds | Corrected (#53) |
| FedRAMP 20x KSI Alignment: PT Control Closure Summary | PT family; milestones | Section numbers dropped; all eight controls covered |
| Closure Necessity — PT family | Closing paragraph of Who owns what | Restated without doctrine name |
| KSI Indirect Coverage; Note for Package Reviewers | Opening | Removed (#4); package placement linked to Chapter 11 |
| Compliance Milestones | Before a system that processes PII goes live | Corrected (#62) |
| End matter (previous/series links) | — | Replaced by Continue the book |
