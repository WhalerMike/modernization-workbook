# Verification — Chapter 03, Federal HR 2.0 and the Core HCM Platform

Editor pass of 2026-10-20. Every URL below was opened (or, for PDFs, downloaded and text-searched) on that date and returned HTTP 200. The solicitation text was checked against the local copy of Solicitation 24322626R0007 Amendment 4 (159 pp.) in the program's inbox; the SAM.gov opportunity and its attachment list were confirmed through the SAM.gov public API.

Searches on 2026-10-20 for Federal HR 2.0 news after September 1, 2026 found nothing newer than the MeriTalk report of Sep 1, 2026; no OPM release on actual go-lives was found.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "OPM HRIT … line" delivers personnel action processing, eOPF, EHRI | OPM HRIT and Federal HR 2.0 | restated: "In this book, OPM HRIT means…" (the term is the book's shorthand; OPM's program is titled Federal HRIT Modernization); EHRI/eOPF role verified | OPM EHRI page |
| 2 | Memo title, date (Dec 10, 2025), joint OMB/OPM (Vought/Kupor) | Same; facts table | verified | OMB/OPM memo |
| 3 | Consolidates "100+" agency Core HCM systems | Same | verified; quoted ("more than 100 unique Core HCM software systems") | Memo p. 1 |
| 4 | Memo "schedules" eOPF and EHRI to become redundant and decommissioned | Same; timeline; facts table | corrected: the memo says OPM will continue transitioning agencies to eOPF and EHRI and that Core HCM will "eventually" make them redundant and allow their decommissioning; no schedule and no FY 2028 tie | Memo §I |
| 5 | Durable surface: federation, SCIM, extracts | Same | verified for Oracle HCM (HCM Extracts, Atom feeds, REST/SCIM APIs); "event feeds" added | Microsoft Learn, Oracle HCM provisioning tutorial |
| 6 | Under M-19-16, OPM was designated HR QSMO | Who OPM is | corrected: M-19-16 (Apr 26, 2019) created the QSMO process; the HR role went first to GSA; OMB redesignated OPM on March 30, 2022 | M-19-16; FedScoop Apr 28, 2022; OPM HR QSMO page |
| 7 | "Agencies procure HR technology through the QSMO's vetted marketplace rather than building bespoke systems" | Who OPM is | verified in substance and footnoted: M-19-16 bars new solicitations for a QSMO function without a business case approved by the QSMO and OMB; QSMOs offer a marketplace; reworded slightly | M-19-16 |
| 8 | 1972 CPDF | Timeline | verified | OPM/NPR announcement, Jul 16, 1998 |
| 9 | 2002 e-Gov: e-Payroll 26 → 4 providers; eOPF begins | Timeline | verified; dated 2002–2009 (seven-year migration completed 2009) | OMB e-Gov e-Payroll page; Nextgov Oct 21, 2009; OPM EHRI page |
| 10 | 2004 HR Line of Business, OPM-led, reference model, shared service centers | Timeline | verified (task force formed 2004, reported Jan 31, 2005) | OMB e-Gov HR LOB release |
| 11 | ~2010 EHRI replaces CPDF | Timeline | corrected: EHRI is an OPM e-Gov initiative of the 2000s; CPDF is described as its precursor; no source dates a "replacement" to 2010 — row now "2000s" | OPM EHRI page; Data.gov CPDF record |
| 12 | 2019 HR QSMO: M-19-16 designates OPM | Timeline | corrected: split into 2019 (QSMO framework) and 2022 (OPM designated HR QSMO) | M-19-16; FedScoop 2022 |
| 13 | 2021 QSMO marketplace opens | Timeline | corrected: OPM's HR Marketplace launched in spring 2024; no source found for a 2021 HR marketplace | FedScoop May 1, 2024 |
| 14 | Core HCM award to Oracle, June 11, 2026, Oracle Fusion Cloud HCM, SaaS | Timeline; facts table | corrected: award reported June 10, 2026; Oracle's announcement June 11, 2026; product verified; diagram tag changed to Jun 10, 2026 | OPM award release; Oracle release (PR Newswire); Federal News Network Jun 10, 2026 |
| 15 | 2026: "Wave 1 agency transitions begin" | Timeline | corrected: memo planned FY 2026 starts; as of Aug 31, 2026 the OPM Director said first agencies would start as FY 2027 begins; row moved into 2027 | Memo; MeriTalk Sep 1, 2026 |
| 16 | Wave 1 membership listed by agency name | Facts table | removed (brief: never name agencies); replaced with neutral pointer to memo Appendix A; ~900K FTE and FY26–FY27 kept | Memo Appendix A |
| 17 | Wave 2: remaining agencies, ~1.1M FTE, fully in FY 2027 | Facts table | verified | Memo Appendix A |
| 18 | First go-lives January–March 2027, OPM Director, reported Sep 1, 2026 | Facts table; consequences | corrected attribution: the Jan–Mar window is the reporter's wording, not a direct Kupor quote; Kupor's statement was that first agencies start as the new fiscal year begins. Added FNN report that the original July 2027 launch target was expected to slip after protests | MeriTalk Sep 1, 2026; FNN Jun 10, 2026 |
| 19 | Onboarding ~8 months; interconnections go-live ≈ month 5; legacy discontinued at cutover | Facts table | verified (Appendix B is a *sample* timeline; labeled so) | Memo Appendix B |
| 20 | Government-wide adoption goal FY 2028 | Timeline; facts table | verified | Memo p. 1 |
| 21 | Agencies pause own Core HCM modernization; Appendix C actions | Facts table | verified; wording widened to "procurement, development and related modernization," exceptions from the two Directors | Memo §II |
| 22 | PWS Appendix A Req #5: SCIM 2.0 near-real-time provisioning (verified 2026-04-30) | Facts table | corrected: Req. 5 (Functional Requirements Matrix, p. 59, Amd 4) requires SCIM 2.0 provisioning *from the Government's identity provider into the contractor's system*, near real time or within an SLA such as 15 minutes | Solicitation 24322626R0007 Amd 4 |
| 23 | "A solicitation that requires SCIM 2.0 … → the protocol Entra ID's inbound provisioning consumes" | Opportunity table | corrected (direction error): the solicitation's SCIM is inbound to the HCM platform; HR→Entra is not in the solicitation. Row now says the platform is already tied to federal identity (SAML SSO via OPM's IdP per clauses 1752.224-70/71; SCIM from the Government IdP), and that Microsoft documents the HR→Entra direction for Oracle via API-driven inbound provisioning with SCIM payloads built from HCM Extracts or Atom feeds | Solicitation Amd 4 pp. 59, 99–100; Microsoft Learn Oracle HCM tutorial |
| 24 | New interconnections designed during onboarding | Opportunity table | verified; Appendix C wording added (define integration points, identify interfacing systems, document data flows) | Memo Appendix C |
| 25 | HR data "cleaned and converted" | Opportunity table | corrected to "reviewed and migrated" (memo language is data review and migration; OPM Director separately reported data cleanup and normalization under way) | Memo Appendix C; MeriTalk Sep 1, 2026 |
| 26 | Contingent-worker capability of the same platform is an option | Opportunity section | not re-verified here; Chapter 06 carries and footnotes it | (Chapter 06) |
| 27 | "First Wave 1 agencies go live Jan–Mar 2027; for a Wave 2 agency interconnections go live around month 5" | Consequences | corrected per items 18–19; month 5 applies to every agency's sample timeline, not only Wave 2 | Memo Appendix B; MeriTalk |
| 28 | Durable interface: HCM Extracts, ATOM feeds, REST/SCIM | Consequences | verified; footnoted | Microsoft Learn Oracle HCM tutorial |
| 29 | No OPM document mandates Entra ID integration | What OPM requires | restated-as-design (program finding); supported negatively by memo, OPM Core HCM page and solicitation (no Entra mention); added the observation that the solicitation's identity requirements point into the platform | Memo; OPM Core HCM page; Solicitation |
| 30 | Microsoft's own Oracle HCM integration guidance exists | What OPM requires | verified; footnoted | Microsoft Learn Oracle HCM tutorial |
| 31 | Vendor undecided until mid-2026 | What OPM requires | verified (award June 2026) | OPM award release |
| 32 | Diagram ch03-hr20-window: "Jun 11, 2026" award; "FY 2028 … EHRI and eOPF decommissioned" | Diagram source | corrected in `docs/images/diagrams/b03-hr-identity/src/ch03-hr20-window.flow.yaml`: Jun 10, 2026; FY 2028 box now "Government-wide adoption goal; EHRI and eOPF later made redundant"; header comment renumbered; fig-alt updated. Needs re-render | Memo; FNN; MeriTalk |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited: added `part: Why`; `lifecycle_review` 2027-04-01 | — |
| Thesis line | kept | — |
| In this chapter | edited: "as of October 2026" added | — |
| OPM HRIT and Federal HR 2.0 | edited: items 1, 3, 4, 5; footnotes added | — |
| "Who OPM is in this story" (bold run-in paragraph) | edited: converted to `### Who OPM is in this story`; QSMO history corrected (items 6–7) | — |
| Fifty years of consolidation (timeline table) | edited: rows corrected per items 8–15; 2019 row split into 2019 and 2022; 2021 row replaced by 2024; footnotes per row | — |
| The program facts (table) | edited: agency names removed (item 16); go-live attribution, onboarding, pause, SCIM rows corrected; table caption added; "as of" note and wave-membership pointer paragraph added | — |
| Why this is the opportunity, not the project | edited: table rows corrected (items 23–25); text otherwise kept | — |
| Contractors limit paragraph; "second half of the opening (Chapter 05)" | kept (Chapter 05 has the "Over the Entra ID migration" section) | — |
| Diagram ch03-hr20-window | edited: `#fig-ch03-hr20-window` id; fig-alt aligned with corrected source | — |
| Two consequences | edited: item 27 correction; hard-wrapped lines joined; footnote on interface list | — |
| What OPM requires, and what it leaves to the agency | edited: added two sentences on the solicitation's identity direction; footnotes | — |
| Continue the series | edited: "Continue the book"; Book index | — |
| Third-party sources comment and bold "Third-party source" label | edited: HTML comment removed; trade-press sources labeled "(trade press)" in plain text inside each footnote | — |
| Footnotes | edited: `c02-mt` → `c03-mt` with corrected attribution; 17 new footnotes | — |
