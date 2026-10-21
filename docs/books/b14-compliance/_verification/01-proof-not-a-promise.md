# Verification — Chapter 01, Proof, Not a Promise

Writer W1. Sources: `docs/whitepapers/federal-compliance-for-moderate-agencies.md` (all sections), `docs/compliance/Vol_0_Book_00a_Executive_Brief.md` (all sections), and from `docs/compliance/Vol_0_Book_00_Executive_Summary.md` the sections "Why This Series — Not SCuBA, ZTTT, or Any Single-Vendor Assessment Tool" (with its subsections), "Residual Compliance Risk Under Current Architecture" and "What 'Closed' Means Under FedRAMP 20x" (the rest of the compendium feeds Ch02, Ch04 and Ch12). Primary sources opened October 21, 2026: FIPS 199, FIPS 200 and SP 800-53B PDFs (nvlpubs.nist.gov, text extracted and read); SP 800-37 Rev. 2 PDF; OMB Circular A-130 PDF (whitehouse.gov); 44 U.S.C. § 3554 on govinfo.gov; OMB M-24-15 PDF; the SP 800-53 release 5.2.0 OSCAL catalog and the low, moderate and high baseline profiles from usnistgov/oscal-content (counts computed locally); FedRAMP pages "Using a FedRAMP Certified Cloud Service," "Key Security Indicators," "Collaborative Continuous Monitoring" and NTC-0004; the BOD 25-01 page on cisa.gov; the ScubaGear README on GitHub.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Compliance debt is a design (architectural pattern) mismatch, not a resource shortage; truth mechanisms (asset identity, cryptographic identity, evidence contract) are load-bearing | Opening | restated-as-design | Exec brief thesis; Book 00 exec summary |
| 2 | Source thesis: controls "cannot be satisfied by a perimeter architecture at any budget" | Opening | restated-as-design (softened: the estate can describe but not continuously prove its controls) | Exec brief |
| 3 | Three actors (CSP, agency, assessor) and what binds each | Who owes which proof | verified for FedRAMP, FISMA, A-130, BODs; three-actor model labeled a simplification (source's own honest limit) | Whitepaper exec summary; 44 U.S.C. 3554; A-130 App. I |
| 4 | FedRAMP: "each agency still authorizes its own federal information systems"; "reusable security evidence"; "should never create a standalone authorization to operate for a cloud service offering" | Provider certification | verified | FedRAMP "Using a FedRAMP Certified Cloud Service" |
| 5 | M-24-15: presumption of adequacy at a FIPS 199 impact level; AOs "must issue an authorization when reusing artifacts" (footnote 11) | Provider certification | verified | M-24-15 PDF §IV.a, fn 11 |
| 6 | "FedRAMP authorized" doesn't close the agency's compliance work | Provider certification | verified (follows from #4, #5) | as above |
| 7 | KSIs: 46 indicators, ten themes; some persistent automated validation | What the agency inherits | verified | FedRAMP KSI page (theme counts CED 1, CMT 4, CNA 8, IAM 6, INR 3, MLA 5, PIY 5, RPL 4, SCR 2, SVC 8) |
| 8 | KSIs bind providers | What the agency inherits | verified (settled in Book 12 Ch12 / Book 13 Ch11; KSI page itself doesn't assign responsibility) | Book 13 Ch11; KSI page |
| 9 | OCR every 3 months; CCM-AGM-ROR "MUST review each Ongoing Certification Report"; AGU-USE-ROR SHOULD, program follows MUST | What the agency inherits | verified (CCM rules); AGU-USE-ROR wording carried from Book 12 Ch12 per brief | FedRAMP CCM page; Book 12 Ch12 |
| 10 | Source: KSIs "submitted through one of three certification pipelines" | — | removed (imprecise; pipelines covered by date in Ch02) | — |
| 11 | Source: "NIST SP 800-37's CA-7 continuous-monitoring requirement" | Why every control needs proof | corrected: CA-7 is an SP 800-53 control; SP 800-37 is the RMF | SP 800-53 OSCAL |
| 12 | FIPS 199 date Feb 2004; applicability excludes classified info and NSS | FIPS 199 | verified | FIPS 199 §2 |
| 13 | Moderate definition: "serious adverse effect…"; amplification (significant degradation, damage, financial loss, harm not involving loss of life) | FIPS 199 | verified | FIPS 199 §3 |
| 14 | SC triple; system takes highest value per objective across information types | FIPS 199 | verified | FIPS 199 §3 (systems) |
| 15 | A-130: identify boundaries; "categorize … in accordance with FIPS Publication 199 and NIST SP 800-60" | FIPS 199 | verified | A-130 App. I §4.a |
| 16 | A-130: PII systems generally moderate or high confidentiality | FIPS 199 | verified | A-130 App. I (PII categorization requirement) |
| 17 | RA-2: document categorization and rationale in security plan; AO or designated rep approves | FIPS 199 | verified | SP 800-53 5.2.0 RA-2 |
| 18 | FIPS 200: low/moderate/high system definitions; high-water mark rationale (dependencies among objectives); determination before control selection | FIPS 200 | verified | FIPS 200 §2, fn 3 |
| 19 | FIPS 200: moderate systems "must, as a minimum, employ appropriately tailored security controls from the moderate baseline"; all baseline controls unless tailoring allows exception | FIPS 200 | verified | FIPS 200 §4 |
| 20 | SP 800-53B Oct 2020, updated Dec 10, 2020; three security baselines plus privacy baseline regardless of impact; baselines a starting point, tailored | SP 800-53B | verified | SP 800-53B abstract, §2.4 |
| 21 | Moderate baseline 287 controls + enhancements (177 base, 110 enh.); low 149; high 370 (release 5.2.0) | SP 800-53B | verified (counted from OSCAL profiles, version 5.2.0) | usnistgov/oscal-content |
| 22 | FedRAMP Class C includes current Moderate; D High; B LI-SaaS and Low; A new pilot | FedRAMP Class C | verified | NTC-0004 |
| 23 | Class and NIST baseline membership can differ (CM-5(1) example) | FedRAMP Class C | verified via Book 13 App A (settled; linked, not restated) | Book 13 App A |
| 24 | No three-year ATO rule; FISMA testing "no less than annually," covering every system in the inventory | Why every control needs proof | verified | 44 U.S.C. 3554(b)(5) |
| 25 | A-130: RMF; initial authorization with explicit risk acceptance; transition to ongoing authorization with AO approval; static authorization with termination dates until then; assessments before operation and periodically per ISCM; POA&Ms | Why every control needs proof | verified | A-130 App. I §3.b, §4.d, §5.h |
| 26 | CA-7, CA-5, CA-6 statements; all in low baseline and above | Why every control needs proof | verified | SP 800-53 5.2.0 OSCAL; LOW profile |
| 27 | SP 800-37: explicit acceptance of risk "cannot be delegated to other officials within the organization" | Why every control needs proof | verified | SP 800-37r2 Task R-4 discussion |
| 28 | Four properties of "closed" (generated by systems, machine-readable, current, re-checkable) | What the program counts as proof | restated-as-design (source said "validated against the published KSI schema on GitHub"; agency evidence isn't bound to the KSI schema, so generalized) | Book 00 "What Closed Means" |
| 29 | Source: "The architectural transition IS the FedRAMP 20x compliance posture" | — | removed (overclaim; FedRAMP binds providers) | FedRAMP use page |
| 30 | Typical expected findings (CM-8, SC-20/21, AU-2/12, IA-2, IA-5) | What a promise looks like | restated-as-design (framing pattern, not a real engagement); product names (InfoBlox, SASE vendors) generalized | Book 00 Residual Compliance Risk table |
| 31 | Source: "AWS Route 53 private zones cannot be DNSSEC-signed (documented platform gap)" | — | removed (vendor-specific; belongs to Book 08, not re-verified here) | — |
| 32 | Source note: under 20x, "POA&M items … trigger continuous evidence collection requirements"; "findings that require manual evidence assembly cannot satisfy KSI requirements" | — | removed (KSIs bind providers; restated in design terms in #28/#30) | — |
| 33 | ScubaGear "verifies that a Microsoft 365 (M365) tenant's configuration conforms to the policies described in" SCuBA baselines; products covered | Assessment tools | verified | ScubaGear README |
| 34 | BOD 25-01: tools by April 25, 2025; mandatory policies June 20, 2025; "remediate deviations"; AO may accept risk for deviations | Assessment tools | verified | BOD 25-01 page |
| 35 | Source (whitepaper): BOD 25-01 "ScubaGear deployment followed on a subsequent deadline" | Assessment tools | corrected: April 25, 2025 stated | BOD 25-01 |
| 36 | Assessment tools measure drift from an intended state, can't author one; examples (DNSSEC, ZT maturity) | Assessment tools | restated-as-design | Book 00 "What Assessment Tools Actually Do" |
| 37 | Six-phase sequence (understand → authorize) | Assessment tools | restated-as-design (labeled program design; volume references dropped) | Book 00 "The Correct Sequencing" |
| 38 | Source: "ScubaGear audits Exchange, Teams, SharePoint, Entra, Defender"; ZTTT (Microsoft Zero Trust Transformation Toolkit), Secure Score, Purview portal named | Assessment tools | partly carried (ScubaGear products from README); ZTTT, Secure Score, Purview not named (product names only as examples; ZTTT not verified) | ScubaGear README |
| 39 | Source: "assessment tools tell you your blood pressure…" metaphor | — | not carried (style) | — |
| 40 | Source: coverage arithmetic "10 of 29", "19/46", "29/29 self-assessed", "20 of 71 books" | — | removed (internal, dated program counts, per brief) | — |
| 41 | Honest limits (not legal advice; scope Moderate civilian; proof doesn't remove judgment; not the only design) | Honest limits | restated-as-design | Whitepaper honest limits |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Whitepaper: Table of contents heading | — | Conversion artifact |
| Whitepaper: The problem this paper resolves | Ch01 opening; Who owes which proof | Routing-layer framing dropped; scope (civilian, Moderate) kept in Honest limits |
| Whitepaper: Executive summary (three-actor table; FedRAMP 20x vs agency's rising bar) | Ch01 Who owes which proof; What the agency inherits | M365-specific "GCC-Moderate" scope generalized |
| Whitepaper: Figure 1 (legal stack PNG) | Ch02 "Who each clock binds" table (authorities) | Old PNG not reused (house style); EO 14028 to EO 14306 stack not restated |
| Whitepaper: §1 FedRAMP 20x Consolidated Rules (dates, agency vs vendor) | Ch01 What the agency inherits; Ch02 FedRAMP section (dates re-verified) | — |
| Whitepaper: §2 NIST SP 800-53 / 800-37 | Ch01 What "Moderate" means; Why every control needs proof | CA-7 attribution corrected (#11) |
| Whitepaper: §3 BOD 25-01 | Ch01 Assessment tools; Ch02 BOD 25-01 | Scope corrected to "production cloud tenants with a finalized SCuBA baseline" (Ch02) |
| Whitepaper: §4 BOD 26-04 | Ch02 BOD 26-04 | — |
| Whitepaper: §5 CISA ZTMM v2.0 | Not carried | Covered by Book 11 Ch02–03; no federal deadline (Book 00 Ch01 notes it) |
| Whitepaper: §6 OMB M-22-09 | Not carried | Book 11 Ch03 reads it; deadlines passed (Book 00 Ch01) |
| Whitepaper: §7 TIC 3.0 / M-19-26 | Not carried | Book 09 Ch02–03 |
| Whitepaper: §8 OMB M-25-21 (AI) | Not carried | Outside this book's compliance-clock scope; all deadlines passed per source; no AI-specific ATO (not re-verified, so not stated) |
| Whitepaper: Where to read deeper, by mandate (routing table) | Ch01/Ch02 cross-links to Books 08–13 | Old whitepaper links replaced with workbook book links |
| Whitepaper: Honest limits and scope | Ch01 Honest limits; Ch02 (dates are a snapshot) | List of omitted mandates carried into Ch02 (BOD 18-01, 23-01, 23-02, M-26-14, M-21-07, PQC, SP 800-53 cadence) |
| Whitepaper: Call to Action | Ch01 "Who owes which proof" ("we have to" vs "our provider has to") | — |
| Exec brief: front matter / read-this-first box / Date Code | — | Document metadata; not carried |
| Exec brief: The thesis, in one paragraph | Ch01 opening | Restated as design; Quarto agency shortcode dropped |
| Exec brief: The three deadlines that bind | Ch02 FedRAMP and BOD 26-04 sections | Corrected: Dec 7 is not "BOD 26-04 VDR/VER … SBOM required"; Jan 1, 2027 doesn't require agency ConMon in KSI format |
| Exec brief: Two nearer clocks (Aug 7, Sep 21) and the registry note | Ch02 BOD 26-04 (Aug 9 correction), FIPS 140-2, "How the program keeps the clock" | Internal file name (`…deadlines.yml`) dropped |
| Exec brief: Decisions required from OIS / CIO (5 decisions) | Not carried | Agency-specific organization names and internal decisions; decision rights are Book 00 Ch07 / Book 13 Ch09; ServiceNow High-on-Moderate and multi-cloud breadth decisions belong to Ch10/Ch12 if anywhere |
| Exec brief: Cost of inaction | Ch01 "What a promise looks like at assessment"; leadership points | Dates removed; "spend does not fix it" kept as design argument |
| Exec brief: Reading paths by role | Not carried | Book index (editor) handles reading paths |
| Exec brief: Honest status line (19/46, 20 of 71 books) | Not carried | Internal dated counts (brief) |
| Book 00: Why This Series — Not SCuBA, ZTTT… (intro) | Ch01 Assessment tools | — |
| Book 00: What Assessment Tools Actually Do | Ch01 Assessment tools | G.114/SQL physics example dropped (Book 06 territory) |
| Book 00: The Correct Sequencing (table) | Ch01 sequence table | Volume references dropped |
| Book 00: Why Single-Vendor Tools Cannot Replace an Architectural Roadmap (seven layers) | Ch01 Assessment tools (surface coverage point) | Vendor shortlists and "34 controls" count dropped |
| Book 00: Vendor Selection Status note | Not carried | Procurement status, internal |
| Book 00: The Role of This Series | Ch01 Assessment tools closing paragraph | — |
| Book 00: The Coverage Arithmetic — 10 of 29 | Not carried (numbers); the principle ("measures drift, can't author") in Ch01 | Internal counts |
| Book 00: Residual Compliance Risk table and FedRAMP 20x note | Ch01 "What a promise looks like at assessment" (condensed) | Full table is Ch12's (residual risk); product names generalized; 20x note removed (#32) |
| Book 00: What "Closed" Means Under FedRAMP 20x | Ch01 "What the program counts as proof" | Restated as design (#28); Ch04 carries closure in depth |
