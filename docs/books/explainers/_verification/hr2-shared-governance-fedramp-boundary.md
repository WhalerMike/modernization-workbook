# Verification — Federal HR 2.0 Across Agencies and Boundaries (research)

File: `docs/books/explainers/hr2-shared-governance-fedramp-boundary.md`
Verified: 2026-10-30

## Method

- **Downloaded and parsed directly:** FedRAMP's rules file, version 2026.10.13.01 (github.com/FedRAMP/rules), and the Marketplace `products.json` (last change 2026-10-30, 778 listings).
- **Read in full text:** the memo, solicitation Amendment 4, both Q&A sets, the CHCO Council charter and 2025 report, OPM's priority goals and budget justification, M-24-15, M-19-16, 44 U.S.C. 3609, 32 CFR part 2002, the CMVP pages, and Oracle's OCI government pages.
- **Fetched as web pages:** FedRAMP rule pages, definitions and notices, and Microsoft Learn. Oracle.com pages refused automated fetches (HTTP 403) but loaded with a browser user agent (HTTP 200).
- **Read visually:** the solicitation's governance chart (p. 18) is an image.
- **Marked drafts:** the eOPF Touchpoint decks are publicly posted but marked draft and pre-decisional, and are cited as such.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | HR 2.0 Advisory Board "comprising key stakeholder agencies" | Findings, Part 1 | verified (p. 3) | hb-memo |
| 2 | Policy, Data, Learning and Super User working groups | Part 1 | verified (Appendix C, p. 6) | hb-memo |
| 3 | Governance chart: executive sponsorship, Steering Committee ("senior leaders"), Customer Advisory Board ("represent their agency"), working groups; OPM chairs both boards; at least monthly | Findings, Part 1 | verified (§2.1, pp. 18–19; chart read visually) | hb-pws-gov |
| 4 | Data group "within and across federal agencies" | Part 1 | verified (chart) | hb-pws-gov |
| 5 | Steering Committee enforces "configuration patterns and reusable templates across all agencies"; approves customizations | Findings, Part 1 | verified (§5.6, p. 41) | hb-pws-cust |
| 6 | Steering Committee approves agency-specific integrations | Findings, Part 1 | verified (p. 88) | hb-pws-appb |
| 7 | Common federal baseline; one OPM-approved version | Findings | verified (pp. 27, 51) | hb-pws-base |
| 8 | GPMO; OPM "primary integrator" including identity management; joint data readiness | Findings, Part 1 | verified (§5.2, pp. 31–32, 36) | hb-pws-gpmo |
| 9 | No public forum for agency-to-agency sharing; the bodies publish no output; membership and charters unpublished | Findings, Part 1 | verified as a search result (absence on opm.gov, the CHCO Council pages, the eOPF help desk and SAM.gov) | — |
| 10 | CHCO Council: advisory board of CHCOs and CIOs; one new working group in 2025 | Part 1 | verified (PDF pp. 13, 10) | hb-chcoc-report |
| 11 | CHCO Council statute: advise and coordinate, including the modernization of HR systems | Part 1 | verified (Pub. L. 107-296 §1303(b)) | hb-hsa |
| 12 | Charter: working groups; share promising practices | Part 1 | verified | hb-chcoc-charter |
| 13 | APG 3 stakeholders include an "Interagency executive investment and advisory board" | Part 1 | verified (p. 8) | hb-apg |
| 14 | HR LOB executive steering committee runs communities of practice; its standards are required by the PWS; no Core HCM mention | Part 1 | verified (pages; PWS §5.1.1 item 11) | hb-hrlob, hb-hrlob-maesc, hb-fibf |
| 15 | HR QSMO continues; customer engagement model; change control of the data model (Q85) | Part 1 | verified | hb-qsmo, hb-m1916, hb-qa1 |
| 16 | No change control board (Q360) | Part 1 | verified | hb-qa2 |
| 17 | No onboarding playbook, liaison model or community on OPM's pages | Part 1 | verified as a search result | hb-opm-core, hb-opm-award |
| 18 | Touchpoint Q&A sends Core HCM questions to Wave 1 points of contact or the mailbox | Part 1 | verified | hb-touch-jun |
| 19 | June deck: governance and working group formation | Part 1 | verified (deck marked draft) | hb-touch-deck |
| 20 | March deck: single ATO, agencies don't need their own | Part 1 | verified (slide 5, marked draft) | hb-touch-mar |
| 21 | Bring the feed as a pattern; use the Data group and the Customer Advisory Board; keep agency-owned parts agency-owned | Part 1 | design and inference (labelled) | — |
| 22 | Public tier: CDS-CSO-PUB and CDS-CSO-SVC are MUSTs for Rev5 and 20x, Classes B–D | Findings, Part 2 | verified (rules file and page) | hb-cds |
| 23 | Trust center tier: CDS-CSO-UTC MUST; "all necessary parties"; potential agency customers not mandatory | Part 2 | verified (rules file; definition) | hb-cds, hb-defs |
| 24 | The scope is documented in the certification package (MAS-CSO-IIR note) | Findings, Part 2 | verified | hb-mas |
| 25 | On request: CDS-UTC-AGA SHOULD; CDS-UTC-AAD notify within 5 business days | Part 2 | verified | hb-cds |
| 26 | CDS-CSO-RIS; provider's intellectual property, "not federal information"; CDS-CSO-RPS MAY | Part 2 | verified | hb-cds |
| 27 | 44 U.S.C. 3609(a)(4) transparency | Part 2 | verified (govinfo) | hb-usc3609 |
| 28 | CDS Rev5 dates: 2027-01-01, 2027-08-01, grace to 2028-02-01 | Findings, Part 2 | verified (page and rules file) | hb-cds-dates |
| 29 | MAS Rev5 dates; grace ends at the first assessment "started after" 2027-01-01 | Part 2 | verified | hb-mas-dates |
| 30 | CMU Rev5 dates; grace to 2027-06-01 | Part 2 | verified (rules file) | hb-rules |
| 31 | NTC-0013: "completed after January 1, 2027"; the end of Rev5 "likely to be no later than 2029" | Part 2 | verified; the started/completed conflict is reported, not resolved | hb-ntc13 |
| 32 | Oracle Fusion Cloud F1603257882 record: 10 authorizations, 9 reuses; OPM not named; no trust center, certified services, third-party resources or configuration guidance | Findings, Part 2 | verified (products.json, 2026-10-30); the agency names aren't listed on the page | hb-mkt |
| 33 | None of Oracle's 8 listings has a trust center; 117 of 778 do market-wide; Oracle's High listing is infrastructure | Part 2 | verified (computed from products.json) | hb-mkt |
| 34 | Oracle's award release says "FedRAMP-authorized" and names no package | Findings | verified | hb-ora-award |
| 35 | Oracle's compliance page: attestations through the sales representative | Part 2 | verified (browser user agent) | hb-ora-compliance |
| 36 | No public Fusion US Government scope page | Part 2 | verified as a search result | — |
| 37 | The scope information is restricted today, and Oracle isn't yet required to publish the list | Part 2 | inference (labelled) | — |
| 38 | MAS-CSO-FLO and MAS-CSO-TPR document flows and third-party resources; MAS-CSO-SUP material isn't certified | Findings, Part 2 | verified | hb-mas |
| 39 | An agency "should never create a standalone authorization"; integrate securely, including identity | Part 2 | verified | hb-agency-use |
| 40 | Single OPM ATO; API gateway with OAuth 2.0, rate limiting and IP filtering | Part 2 | verified 2026-10-25 for the HCM implementation guide; not re-read on 2026-10-30 | hb-pws-gw |
| 41 | M-24-15: FedRAMP "does not replace" other requirements; presumption of adequacy while actively maintained; GSA's duty on artifact access | Part 2 | verified | hb-m2415 |
| 42 | CUI Basic no less than Moderate; written agreements whenever feasible | Part 2 | verified (eCFR, 2026-10-01 version) | hb-cui |
| 43 | SP 800-47 Rev. 1 on information exchanges | Part 2 | verified (abstract) | hb-sp80047 |
| 44 | CMU: Class C SHOULD, Class D MUST; CMD MUST; CAT SHOULD | Findings, Part 3 | verified (rules file) | hb-cmu |
| 45 | SC-13 guidance points to CMU | Part 3 | verified (rules file) | hb-rules |
| 46 | SP 800-53 SC-13 is organization-defined; FIPS-validated cryptography named in the discussion | Part 3 | verified (OSCAL catalog) | hb-sp80053 |
| 47 | CMVP: "if cryptography is required, then it must be validated"; applies to all federal agencies | Findings, Part 3 | verified | hb-cmvp |
| 48 | FIPS 140-2 validations move to historical after September 21, 2026 (the table says September 22) | Findings, Part 3 | verified; the inconsistency is reported | hb-cmvp-transition |
| 49 | Legacy Rev5 Moderate SC-13 parameter; DoD requirements | Part 3, What couldn't be verified | not verified | — |
| 50 | OCI US Government and US Defense hostnames are on oraclegovcloud.com; no .us or .mil on those pages | Findings, Part 4 | verified (regex scan of the two pages) | hb-oci-gov, hb-oci-dod |
| 51 | Bring your own CAC/PIV identity provider | Part 4 | verified | hb-oci-info |
| 52 | Fusion commercial hostname pattern; in restricted regions "the patterns are different" | Part 4 | verified; the government hostname wasn't found | hb-ora-url |
| 53 | Microsoft GCC uses worldwide endpoints; GCC High and DoD use .us | Findings, Part 4 | verified | hb-ms-deploy |
| 54 | Why the domain matters: allow-lists, identity configuration, pinning | Part 4 | inference (labelled) | — |
| 55 | Statutory sunset of 44 U.S.C. 3607–3616 | What couldn't be verified | text verified; whether it was extended not checked (congress.gov 403) | hb-usc3609 |

## Not carried

- **The agencies holding Oracle Fusion Cloud authorizations.** The Marketplace names nine; the page gives only the count and that OPM isn't among them.
- **A secondary-source claim that only US nationals manage Fusion government systems.** Its source couldn't be found.
- **The CSA note citing a Rev5 end date of December 31, 2028.** It isn't a primary source.

## Additions, October 30, 2026 (follow-up)

The "Status and review" section now has a promotion checklist for when the page is Proved: Book 10 Ch03 and Appendix A. This is process text and adds no new claims.
