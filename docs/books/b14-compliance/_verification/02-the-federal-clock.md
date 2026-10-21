# Verification — Chapter 02, The Federal Clock

Writer W1. Sources: `docs/compliance/Vol_0_Book_00_Executive_Summary.md` sections "FedRAMP 20x Hard Deadlines" and "The Broader Federal Clock" (plus date mentions in "About This Document" and the executive summary box), the dated items in `docs/whitepapers/federal-compliance-for-moderate-agencies.md` §1, §3, §4 and "Honest limits," and "The three deadlines that bind" in `docs/compliance/Vol_0_Book_00a_Executive_Brief.md`. All dates checked on October 21, 2026 against the issuing document. Primary sources opened: FedRAMP "Important Dates" timeline, NTC-0014, "Collaborative Continuous Monitoring," the M-24-15 authority page; CISA directive pages for BOD 26-04 (raw HTML downloaded and searched), BOD 25-01, BOD 26-02, BOD 23-01, BOD 23-02, BOD 18-01, V1 ED 25-03, ED 26-01, ED 26-03, the directives listing and the January 8, 2026 retirement release; CISA Logging Reference Architecture page; OMB M-26-05, M-26-14, M-26-15 and M-21-07 PDFs (downloaded, text extracted and read); the OMB memoranda index; 44 U.S.C. §§ 3553 and 3554 on govinfo.gov; the CMVP project page; the SP 800-53 Rev. 5 publication page and the SP 800-53 public comment site "More Information" page; the SP 800-53 release 5.2.0 OSCAL catalog and baseline profiles.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | BOD authority 44 U.S.C. 3553(b)(2); ED authority 3553(h) | Who each clock binds | verified | 44 U.S.C. 3553 |
| 2 | Agency heads must comply with NIST standards, operational directives, OMB policies, emergency directives | Who each clock binds | verified | 44 U.S.C. 3554(a)(1)(B) |
| 3 | FedRAMP rules issued under the FedRAMP Authorization Act and M-24-15 | Who each clock binds | verified | FedRAMP M-24-15 authority page |
| 4 | Consolidated Rules launched June 25, 2026 | FedRAMP | verified (settled, Book 00 Ch01) | FedRAMP launch post via Book 00 Ch01; timeline page |
| 5 | July 4, 2026 optional early adoption | FedRAMP | verified; added (missing from sources) | FedRAMP timeline |
| 6 | July 6 Initial Implementation Marketplace listings; July 28 Ready legacy; Aug 3 Class A; Aug 10 temporary Rev5 B/C (Ready conversion, lost sponsor); Aug 31 20x B & C | FedRAMP | verified | FedRAMP timeline |
| 7 | Jan 1, 2027 mandatory for all stakeholders; applicability varies in areas | FedRAMP | verified | FedRAMP timeline |
| 8 | Source: Jan 1, 2027 "All new authorizations must use 20x; legacy Rev 5 path closes" / "legacy Rev5 path closes for new authorizations" | FedRAMP | corrected: new Rev5 applications accepted until June 11, 2027 | FedRAMP timeline |
| 9 | June 11, 2027 no new Rev5 certification applications | FedRAMP | verified | FedRAMP timeline |
| 10 | VDR/VER mandatory Dec 7, 2026 (moved from planned June 1, 2027 / grace to Jan 1, 2028); corrective action plan through March 7, 2027, then revocation | FedRAMP | verified; CAP window added | NTC-0014 |
| 11 | Providers following VDR/VER meet or exceed BOD 26-04 (confirmed with CISA) | FedRAMP | verified | NTC-0014 |
| 12 | Source: Aug 31 window is the agency's ("{agency}'s window") | FedRAMP | corrected: provider pipeline, not an agency submission window (the whitepaper itself said so) | FedRAMP timeline; use page |
| 13 | OCR every 3 months; agencies MUST review (CCM-AGM-ROR) | FedRAMP | verified | FedRAMP CCM page |
| 14 | Exec brief: Jan 1, 2027 "All ConMon evidence must be machine-readable KSI format" | FedRAMP | corrected: KSIs bind providers; agency ConMon governed by A-130 / CA-7; machine-readable agency evidence restated as program design | Ch01 sources; Book 13 Ch11 |
| 15 | Source: Dec 7 "KSI-011–014 become evaluable" | — | removed (internal rule IDs) | — |
| 16 | BOD 26-04 issued June 10, 2026; revokes and supersedes BOD 19-02 and 22-01 | BOD 26-04 | verified | BOD 26-04 page |
| 17 | Phase I actions (policy review, KEV timelines, CDM automation or biweekly manual, Cyber Hygiene, quarterly attestation) | BOD 26-04 | verified | BOD 26-04 page |
| 18 | Phase II "within 60 days of issuance": processes/procedures on CVE database and KEV; = Aug 9, 2026 (counted) | BOD 26-04 | verified; date counted | BOD 26-04 page (matches Book 12 Ch06) |
| 19 | Source: "Aug 7, 2026 BOD 26-04 agency policies due" | BOD 26-04 | corrected to the directive's "within 60 days" (Aug 9); policy review is Phase I, immediate; Aug 7 noted as FedRAMP NTC-0014's figure | BOD 26-04; NTC-0014 |
| 20 | Phase III within 180 days = Dec 7, 2026 (counted): Table 1 timelines, external asset tagging, private addresses in CDM | BOD 26-04 | verified; date counted | BOD 26-04 page |
| 21 | Four variables; 3 days + forensic triage to fix on upgrade; clock starts at KEV add or CDM detection, whichever first | BOD 26-04 | verified | BOD 26-04 page; Book 12 Ch06 for Table 1 |
| 22 | Source (whitepaper): "deferral path for genuinely low-risk findings" | BOD 26-04 | corrected to "fix on the next system upgrade" | BOD 26-04 |
| 23 | Exec brief: Dec 7 "BOD 26-04 VDR/VER in force — SBOM + vendor disclosure required" | BOD 26-04 | corrected: VDR/VER are FedRAMP provider rules; BOD 26-04 has no SBOM requirement; SBOM is a contract choice under M-26-05 | BOD 26-04; NTC-0014; M-26-05 |
| 24 | BOD 25-01 Dec 17, 2024; scope production cloud tenants with finalized SCuBA baseline (M365 at issuance); Feb 21 / Apr 25 / Jun 20, 2025 | BOD 25-01 | verified | BOD 25-01 page |
| 25 | Source (whitepaper): BOD 25-01 binds "agencies operating Microsoft 365 tenants" | BOD 25-01 | corrected to the directive's scope wording | BOD 25-01 |
| 26 | BOD 25-01 standing obligations (Q1 inventory update; continuous or quarterly reporting; future policies; new tenants before ATO; deviations explained) | BOD 25-01 | verified | BOD 25-01 Required Actions 1–6 |
| 27 | BOD 26-02 Feb 5, 2026; edge device and EOS definitions; CISA EOS Edge Device List; actions at immediately/3/12/18/24 months | BOD 26-02 | verified | BOD 26-02 page |
| 28 | BOD 26-02 calendar dates May 5, 2026; Feb 5, 2027; Aug 5, 2027; Feb 5, 2028 | BOD 26-02 | verified (counted; Feb 5, 2027 and Aug 5, 2027 match Book 00 Ch01 and Book 09 Ch03) | BOD 26-02 |
| 29 | BOD 23-01 Oct 3, 2022; 7-day discovery, 14-day enumeration, 24-hour signatures, 72-hour CDM ingestion; no revoked marker | Standing directives | verified | BOD 23-01 page |
| 30 | BOD 23-02 June 13, 2023; 14 days, remove from internet or separate PEP; no revoked marker | Standing directives | verified | BOD 23-02 page |
| 31 | BOD 18-01 Oct 16, 2017; STARTTLS, SPF/DMARC, p=reject, HTTPS/HSTS, no SSLv2/v3/3DES/RC4; no revoked marker | Standing directives | verified | BOD 18-01 page |
| 32 | Ten EDs closed Jan 8, 2026 (incl. SolarWinds, Exchange, Print Spooler, VMware); KEV quote; covered by BOD 22-01 | Emergency directives | verified | CISA release, Jan 8, 2026 |
| 33 | ED 25-03 Sept 25, 2025; V1 April 23, 2026; products; 48-hour updates; legacy ASA (EOS ≤ Sept 30, 2025) stay disconnected; BOD 26-02 for new ASA hardware; V1 deadlines Apr 24/30, May 1, 2026; ASA models with EOS Aug 31, 2026 | Emergency directives | verified | V1 ED 25-03 page |
| 34 | ED 26-01 Oct 15, 2025; F5 products; one-week updates; EOS public-facing devices disconnected or plan reported; BOD 23-02 for management interfaces | Emergency directives | verified | ED 26-01 page |
| 35 | ED 26-03 Feb 25, 2026; V1 March 11, 2026; SD-WAN Manager and Controller; deadlines Feb 26 – Mar 23, 2026; hunt/harden guidance no deadline | Emergency directives | verified | ED 26-03 page |
| 36 | M-26-14 May 22, 2026; rescinds M-21-31; 90/120/180/320 days from LRA | M-26-14 | verified | M-26-14 PDF |
| 37 | LRA published Aug 20, 2026 | M-26-14 | verified | cisa.gov/Logging |
| 38 | Counted dates Nov 18, 2026; Dec 18, 2026; Feb 16, 2027; Jul 6, 2027 | M-26-14 | verified (re-counted; match Book 00 Ch01) | arithmetic |
| 39 | M-26-05 Jan 23, 2026 rescinds M-22-18 and M-23-16; inventory "shall continue"; attestation form optional; SBOM by contract "may also choose"; cloud = runtime production SBOM | M-26-05 | verified | M-26-05 PDF |
| 40 | M-26-15 June 24, 2026; implements June 22, 2026 EO; excludes NSS; plan within 120 days (= Oct 22, 2026, counted); mitigate by Dec 31, 2030; TLS 1.3 by Jan 2, 2030 (EO 14306); phases 2026–2035; prioritization; replace systems that can't support PQC; engage FedRAMP providers | M-26-15 | verified; new (not in sources) | M-26-15 PDF |
| 41 | Source: "2030 / 2035 quantum-vulnerable crypto deprecated / prohibited; M-23-02 annual inventories through 2035" | M-26-15 | corrected/superseded: current civilian dates from M-26-15; NIST IR 8547's deprecate/disallow dates are still an initial public draft (Nov 12, 2024, csrc page checked) so not stated as rules; M-23-02 not re-verified and not cited | M-26-15; csrc IR 8547 page |
| 42 | Source: "Jan 1, 2027 CNSA 2.0 acquisition requirement (NSS-scoped)" | M-26-15 | removed (NSS only; out of scope; not re-verified) | M-26-15 NSS exclusion |
| 43 | M-21-07 Nov 19, 2020; 20/50/80% IPv6-only by end FY2023/24/25; list systems that can't convert | M-21-07 | verified | M-21-07 PDF, agency action 4 |
| 44 | FIPS 140-2 usable for new systems through Sep 21, 2026; then Historical List, "existing systems only" | FIPS 140-2 | verified (consistent with Book 09 Ch03, which dates the move Sept 22) | CMVP page |
| 45 | Source: "no new procurement reliance on 140-2-only modules" | FIPS 140-2 | restated: CMVP limits Historical modules to existing systems; procurement wording is program advice | CMVP page |
| 46 | SP 800-53 current release 5.2.0, Aug 27, 2025 (minor); no Rev. 6 announced | SP 800-53 | verified | csrc SP 800-53 page; OSCAL catalog version 5.2.0 |
| 47 | Source: "minor releases in February and August windows … major every 2 years" | SP 800-53 | corrected: max 2 minor/year, comment periods begin Feb and Aug, publication May and Nov if needed; major every 2 years in November | SP 800-53 public comment site |
| 48 | Source: 5.2.0 added SA-15(13), SA-24, SI-2(7), "not yet mapped in Vol III Book 02 / Vol IV Book 02" | — | not carried (internal mapping status; Book 12 handles SI-2) | — |
| 49 | SA-22 (replace unsupported components or alternative support) in low and moderate; SI-2 updates within organization-defined period | Vendor end of support | verified | SP 800-53 5.2.0 OSCAL; LOW/MODERATE profiles |
| 50 | Microsoft end-of-support dates (Windows Server 2016 Jan 12, 2027; 2019 in 2029) | Vendor end of support | verified via Book 00 Ch01 (settled; linked, not duplicated) | Book 00 Ch01 |
| 51 | Register of dated requirements re-verified at gates | How the program keeps the clock | restated-as-design (source's "federal-compliance-authority-deadlines.yml" and "ConMon Gap Roadmap" internal names dropped) | Exec brief; Book 00 |
| 52 | Source: "The compliance timeline is not advisory … January 1, 2027 is a regulatory requirement" (for the agency) | — | corrected in substance: Jan 1, 2027 binds providers; agency obligation is to review provider evidence (Book 00 Ch01 makes the same correction) | FedRAMP use page |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Book 00: FedRAMP 20x Hard Deadlines — Jul 6, 2026 row | Ch02 FedRAMP table | — |
| Book 00: Jul 28, 2026 row | Ch02 FedRAMP table | — |
| Book 00: Aug 3, 2026 row | Ch02 FedRAMP table | — |
| Book 00: Aug 10, 2026 row | Ch02 FedRAMP table | — |
| Book 00: Aug 31, 2026 row | Ch02 FedRAMP table and correction | Agency-window framing corrected (#12) |
| Book 00: Dec 7, 2026 row (VDR/VER, NTC-0014, BOD 26-04) | Ch02 FedRAMP and BOD 26-04 | KSI rule IDs dropped (#15) |
| Book 00: Jan 1, 2027 row | Ch02 FedRAMP table and correction | Corrected (#8) |
| Book 00: Jun 11, 2027 row | Ch02 FedRAMP table; dates ahead | — |
| Book 00: Broader Federal Clock intro (elapsed baseline: M-21-31 rescinded by M-26-14, M-21-07, M-22-09, BOD 25-01) | Ch02 M-26-14, M-21-07, BOD 25-01 | M-22-09 left to Book 00 Ch01 / Book 11 Ch03; "ConMon Gap Roadmap" internal name dropped |
| Book 00: Aug 7, 2026 BOD 26-04 policies row | Ch02 BOD 26-04 | Corrected (#19) |
| Book 00: Sep 21, 2026 FIPS 140-2 row | Ch02 FIPS 140-2 | Volume references dropped |
| Book 00: Dec 7, 2026 BOD 26-04 timelines row | Ch02 BOD 26-04 Phase III | — |
| Book 00: Jan 1, 2027 CNSA 2.0 row | Not carried | NSS-only, out of scope (#42) |
| Book 00: Feb/Aug SP 800-53 release windows row | Ch02 SP 800-53 releases | Corrected (#47); internal mapping status dropped (#48) |
| Book 00: 2030/2035 quantum row (M-23-02) | Ch02 M-26-15 | Superseded by M-26-15 dates (#41) |
| Book 00: About This Document (Jan 1, 2027 "regulatory requirement, not an internal target") | Ch02 FedRAMP corrections | Corrected (#52); organizational review language not carried (agency-specific) |
| Book 00: exec summary box ("CR26 is mandatory for the cloud service offerings … inherits"; agency structures its own ConMon on the KSI schema) | Ch02 FedRAMP (design choice paragraph) | Restated as design |
| Whitepaper §1 date list (Jun 25 … Jun 11, 2027) | Ch02 FedRAMP table | July 4 added; Jan 1 corrected |
| Whitepaper §3 BOD 25-01 dates | Ch02 BOD 25-01 | ScubaGear date filled in |
| Whitepaper §4 BOD 26-04 (revocations, Aug 7, Dec 7, four variables, KEV as one variable) | Ch02 BOD 26-04 | Aug 7 corrected; "deferral path" corrected (#22) |
| Whitepaper Honest limits: omitted mandates list (BOD 18-01, BOD 26-04, BOD 23-01, BOD 23-02, M-26-14, M-21-07, M-23-02 and FIPS 203/204/205, SP 800-53 cadence) | Ch02 standing directives, OMB memoranda, standards | FIPS 203/204/205 appear only via M-26-15 (not separately dated) |
| Whitepaper Honest limits: "Dates are a snapshot" | Ch02 introduction | — |
| Exec brief: The three deadlines that bind (Aug 31, Dec 7, Jan 1) | Ch02 FedRAMP and BOD 26-04 | Corrections #12, #14, #23 |
| Exec brief: nearer clocks (Aug 7, Sep 21) | Ch02 BOD 26-04, FIPS 140-2 | Aug 7 corrected |
| New material not in the sources | Ch02 BOD 26-02, standing BODs, emergency directives (ED 25-03 V1, ED 26-01, ED 26-03, ten EDs closed), M-26-05, M-26-15, FedRAMP CAP window | Added because the brief asks for every federal date that drives the program, including ED dates |
