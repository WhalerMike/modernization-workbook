---
title: "Federal Framework Crosswalk"
subtitle: "Which federal modernization frameworks the workbook's 18 books address, where, and how deeply, with each framework's status checked on October 23, 2026"
description: "Research under review: a crosswalk of the Federal Modernization Workbook's 18 books against federal modernization frameworks: each framework's current status, a book-by-framework coverage matrix scored 0 to 3, the gaps, and a proposal for tagging chapters by framework."
research-status: in review
research-type: explainer
research-book: "Books 00–17"
date-modified: 2026-10-23
---

# Federal Framework Crosswalk {.unnumbered}

A federal modernization program answers to more than its security controls. Statute and OMB policy also govern how IT investments are chosen and funded, how enterprise architecture is kept, how digital services are delivered, and how privacy and records are handled. This page maps the workbook's 18 books against those frameworks, checks each one's current status at its primary source, and records where coverage is deep, thin or missing, so that the gaps can be closed deliberately.

## How to read the scores

Each cell scores a book's best treatment of a framework:

| Score | Meaning |
|---|---|
| 0 | Not addressed |
| 1 | Mentioned: a citation, history or context only |
| 2 | Actionable guidance: the reader is told what to do, who decides, or how to sequence it |
| 3 | Evidence-backed: the requirement is mapped to concrete controls, evidence artifacts or gates, usually in the book's requirements-mapping appendix |

Scores come from reading the chapters, not from keyword counts alone. Each book was searched for the framework's names and identifiers, every hit was opened in context, and false matches were dropped (for example, "A-11" inside the control IDs SA-11 and IA-11). Verification ledgers and writing briefs weren't counted.

## Framework status, checked October 23, 2026

Three frameworks commonly listed for federal modernization have changed, and two more are in force but amended:

| Framework | Status | What the workbook should cite |
|---|---|---|
| OMB M-22-18 (secure software attestation) | **Rescinded** by OMB M-26-05, January 23, 2026, together with its companion M-23-16. Agencies "shall continue to maintain a complete inventory of software and hardware" and set risk-based assurance policies; the attestation form and SBOM clauses become optional.^[a](#tn-a)^ | M-26-05 (the workbook already does, in Books 00 and 14) |
| Federal Data Strategy | **Being retired**: its site says "This website is being retired", and its last action plan is from 2021.^[b](#tn-b)^ | The Evidence Act and OMB M-25-05 |
| Federal Enterprise Architecture Framework v2 | **Historical**: it survives on an archived 2013 page.^[c](#tn-c)^ The requirement behind it is live: Circular A-130 §5.a(2) says agencies "shall develop an enterprise architecture" with a baseline, a target and a transition plan.^[d](#tn-d)^ | A-130 §5.a(2) and SP 800-53 control PM-7 |
| Executive Order 14028 | **In force as amended**: EO 14144 (January 2025) amended it, and EO 14306 (June 2025) amended EO 14144.^[e](#tn-e)^ | EO 14028 with its amendment chain |
| FITARA | **In force, with a new memo**: OMB M-26-10 (March 31, 2026) restates that a covered CFO Act agency can't contract for IT unless the CIO approves, required monthly reports of approved contracts from May 2026 that "shall sunset in October 2026" after the sixth report unless OMB extends them, and requires vendor utilization and pricing clauses in new IT contracts.^[f](#tn-f)^ | M-26-10 |
| OMB Circular A-130 | **In force**: no rescission found, though it isn't on OMB's current Circulars page; its 2016 PDF still resolves.^[d](#tn-d)^ | A-130 (2016 revision) |
| Clinger-Cohen Act and capital planning | **In force**: 40 U.S.C. §11312 requires each agency head to "design and implement ... a process for maximizing the value" of IT acquisitions and assessing their risks.^[g](#tn-g)^ | 40 U.S.C. §11312, Circular A-11, A-130 §5.d |
| Technology Modernization Fund | **Current**: the 2026 call for proposals prioritizes legacy modernization and cybersecurity, expects full repayment, and says "Competitive projects are less than $25M and take no more than three years."^[h](#tn-h)^ | TMF fit criteria |
| 21st Century IDEA | **In force**: Pub. L. 115-336 sets eight criteria for new or redesigned public websites and digital services, and §3(c) asks that any intranet established after December 20, 2018 meet them "to the greatest extent practicable"; it also requires digital forms and an e-signature plan. OMB M-23-22 implements it for public services.^[i](#tn-i)^ | IDEA and M-23-22; OMB M-26-18 (August 31, 2026) adds Login.gov as the universal sign-on for public-facing services^[j](#tn-j)^ |
| NIST CSF 2.0 and the RMF (SP 800-37 Rev. 2) | **Current**^[k](#tn-k)^ | As cited |
| Section 508 | **In force**: 29 U.S.C. §794d, the revised 508 Standards, and OMB M-24-08^[l](#tn-l)^ | As cited |
| Privacy Act; E-Government Act §208 | **In force**: A-130 §5.f and Appendix II direct privacy impact assessments and the handling of personal information^[d](#tn-d)^ | As cited |
| Federal records (44 U.S.C. chapters 31 and 33) | **In force**: agency heads "shall make and preserve records containing adequate and proper documentation"; NARA lists M-23-07 as current OMB guidance^[m](#tn-m)^ | 44 U.S.C. §3101, M-23-07, NARA General Records Schedules |
| Cloud Smart (2019) | **Couldn't verify**: the strategy's page on cio.gov failed to load, and no successor was found | Kept provisionally |

**Notes to the table**

- [**a.**]{#tn-a} Office of Management and Budget, M-26-05, *Adopting a Risk-based Approach to Software and Hardware Security*, January 23, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/01/M-26-05-Adopting-a-Risk-based-Approach-to-Software-and-Hardware-Security.pdf> (accessed Oct 23, 2026).
- [**b.**]{#tn-b} Federal Data Strategy, <https://strategy.data.gov/> (retirement notice), and <https://resources.data.gov/> (accessed Oct 23, 2026).
- [**c.**]{#tn-c} The White House (archived), Federal Enterprise Architecture, including FEAF v2 (January 29, 2013) and the Common Approach to Federal EA (May 2, 2012), <https://obamawhitehouse.archives.gov/node/17927> (accessed Oct 23, 2026).
- [**d.**]{#tn-d} Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource* (2016 revision), §5.a(2), §5.d, §5.f and Appendix II, <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf>; OMB Circulars index, <https://www.whitehouse.gov/omb/information-resources/guidance/circulars/> (both accessed Oct 23, 2026).
- [**e.**]{#tn-e} Federal Register API, presidential documents citing Executive Order 14028, <https://www.federalregister.gov/api/v1/documents.json?conditions[term]=%22Executive+Order+14028%22&conditions[type][]=PRESDOCU&order=newest>; Executive Order 14306 text, <https://www.govinfo.gov/content/pkg/DCPD-202500669/html/DCPD-202500669.htm> (both accessed Oct 23, 2026).
- [**f.**]{#tn-f} Office of Management and Budget, M-26-10, *Reinforcing Transparency, Accountability, and Oversight of Federal Technology*, March 31, 2026, §1 and Requirements, <https://www.whitehouse.gov/wp-content/uploads/2026/03/M-26-10-Reinforcing-Transparency-Accountability-and-Oversight-of-Federal-Technology.pdf> (accessed Oct 23, 2026).
- [**g.**]{#tn-g} 40 U.S.C. §11312, Capital planning and investment control (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title40/html/USCODE-2023-title40-subtitleIII-chap113-subchapII-sec11312.htm> (accessed Oct 23, 2026).
- [**h.**]{#tn-h} Technology Modernization Fund, <https://tmf.cio.gov/>, agency and project fit <https://tmf.cio.gov/fit/>, process <https://tmf.cio.gov/process/>, and 2026 Call for Proposals <https://tmf.cio.gov/2026-call-for-proposals/> (accessed Oct 23, 2026).
- [**i.**]{#tn-i} 21st Century Integrated Digital Experience Act, Pub. L. 115-336, <https://www.govinfo.gov/content/pkg/PLAW-115publ336/html/PLAW-115publ336.htm>; OMB M-23-22, *Delivering a Digital-First Public Experience* (archived page), <https://bidenwhitehouse.archives.gov/omb/management/ofcio/delivering-a-digital-first-public-experience> (both accessed Oct 23, 2026).
- [**j.**]{#tn-j} Office of Management and Budget, M-26-18, *Scaling Use of Login.gov to Deliver a Universal Sign-on for Public Services*, August 31, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/08/M-26-18-Scaling-Use-of-Login.gov-to-Deliver-a-Universal-Sign-on-for-Public-Services.pdf> (accessed Oct 23, 2026).
- [**k.**]{#tn-k} NIST, Cybersecurity Framework, <https://www.nist.gov/cyberframework>; NIST SP 800-37 Rev. 2, <https://csrc.nist.gov/pubs/sp/800/37/r2/final> (both accessed Oct 23, 2026).
- [**l.**]{#tn-l} Section508.gov, Laws and policies, <https://www.section508.gov/manage/laws-and-policies/> (accessed Oct 23, 2026).
- [**m.**]{#tn-m} 44 U.S.C. §3101 (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap31-sec3101.htm>; National Archives, Records management policy, <https://www.archives.gov/records-mgmt/policy> (both accessed Oct 23, 2026).

The frameworks the workbook relies on most are not on the usual modernization lists at all: NIST SP 800-53 Rev. 5 (release 5.2.0), FedRAMP, OMB M-26-14 on logging (which rescinded M-21-31), the CISA Zero Trust Maturity Model 2.0, FIPS 201 and HSPD-12, and FISMA.[^also] They're included in the matrix below.

::: {.landscape}

## Coverage matrix

| Framework | B00 | B01 | B02 | B03 | B04 | B05 | B06 | B07 | B08 | B09 | B10 | B11 | B12 | B13 | B14 | B15 | B16 | B17 |
|--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| NIST SP 800-53 Rev. 5 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| FedRAMP | 2 | 3 | 2 | 1 | 3 | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3 |
| NIST RMF (SP 800-37 Rev. 2) | 2 | 2 | 2 | 2 | 0 | 1 | 3 | 2 | 2 | 2 | 3 | 2 | 3 | 3 | 3 | 2 | 2 | 3 |
| EO 14028 and M-22-09 | 2 | 3 | 3 | 2 | 2 | 0 | 3 | 1 | 3 | 3 | 0 | 3 | 0 | 0 | 2 | 1 | 1 | 0 |
| CISA ZTMM 2.0 | 1 | 3 | 1 | 1 | 1 | 0 | 3 | 0 | 3 | 3 | 0 | 3 | 0 | 1 | 0 | 0 | 0 | 0 |
| HSPD-12 and FIPS 201 | 0 | 3 | 3 | 3 | 1 | 1 | 2 | 3 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 1 | 2 | 0 |
| OMB M-26-14 (logging) | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 3 | 3 | 0 | 3 | 3 | 1 | 2 | 0 | 0 | 0 |
| FISMA 2014 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 2 | 3 |
| OMB Circular A-130 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 3 | 0 | 2 | 3 |
| Privacy Act and E-Gov §208 PIAs | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 3 | 0 | 0 | 3 |
| Federal records | 1 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 3 | 2 | 2 | 1 | 2 | 0 |
| M-26-05 (was M-22-18) | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 0 | 0 | 0 |
| Evidence Act (was the Federal Data Strategy) | 0 | 3 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| NIST CSF 2.0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 1 | 0 | 1 | 0 |
| Section 508 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 |
| Enterprise architecture (A-130 §5.a(2)) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 0 | 0 | 0 |
| Clinger-Cohen, CPIC and A-11 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| FITARA (M-26-10) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| Cloud Smart | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Technology Modernization Fund | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 21st Century IDEA and M-23-22 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Notes: Book 14's enterprise architecture score rests on A-130 §5.a(2) and control PM-7, with architecture artifacts and review gates as the evidence; no book names FEAF. Book 01's Cloud Smart score is a mention of its 2010 predecessor, Cloud First, as history. Book 12 relies on M-22-09 through other books rather than citing it directly.

:::

## What the matrix shows

The security, identity and authorization frameworks are covered deeply, usually with evidence: SP 800-53 is mapped to evidence in every book, FedRAMP in 13, and the zero-trust mandates in 7. That's by design: the workbook is a technical modernization program, and its books end in controls, gates and evidence an assessor can read.

The investment, portfolio and digital-service frameworks are essentially absent. Clinger-Cohen and capital planning, the Technology Modernization Fund, FITARA, 21st Century IDEA, Cloud Smart and enterprise architecture by name score 0 or 1 almost everywhere. Section 508 is evidence-backed only in Book 16, and records only in Book 12; OMB M-23-07, the current records memo, isn't cited.

## Planned additions

Each gap below is tied to what the framework actually requires. These are proposals under review, not yet in the books:

- **Capital planning (Clinger-Cohen, A-11, A-130 §5.d).** 40 U.S.C. §11312 asks for minimum approval criteria, including risk-adjusted returns, and milestone data on cost, capability, schedule and quality; A-130 adds analysis of alternatives and full life-cycle cost.[^cca] A Book 00 chapter could turn the program's phases and gates into an investment record with those elements, reusing Book 09 Chapter 13's cost-evidence method.
- **Technology Modernization Fund.** The fund wants projects that improve, retire or replace existing systems, with full repayment, quantified return on investment, named executive sponsors and agile delivery.[^tmf] A short Book 00 appendix could map the program's seven complementary projects to the fund's proposal fields and fit criteria.
- **FITARA.** M-26-10 requires CIO approval of every IT contract and vendor utilization and pricing clauses in new IT solicitations.[^m2610] An acquisition checklist beside Book 00's license planning, and the clause language beside Book 14 Chapter 07's supply-chain contract terms, would cover it. Book 17's description of the monthly reporting has been corrected to note that the reporting sunsets after the October 2026 report.
- **Enterprise architecture.** Book 14 already maps PM-7. Books 00 and 01 could say plainly that the program's current-state assessment, target estate and phase plan are the A-130 baseline, target and transition plan.[^a130]
- **21st Century IDEA and Login.gov.** The books are scoped to workforce identity and internal systems. The minimum is a scope statement that public-facing digital services and M-26-18's Login.gov sign-on are out of scope, with pointers to the sources.[^idea][^m2618]
- **Section 508, CSF 2.0 and records.** Apply 508 to the administrator consoles, self-service portals and help-desk tooling in Books 04 and 15; add a one-table map of CSF 2.0's functions to the books; and cite M-23-07 where the program retires systems that hold records.[^s508][^records]
- **Cloud Smart.** Confirm whether the 2019 strategy is still current. If it is, a paragraph in Book 10 can link the boundary and landing-zone guidance to it; if not, the row is dropped.

## Tagging chapters by framework

Every chapter already carries the same front matter, including `audience`, `part` and `status`, and Research pages already carry `date-modified`. The proposal is to add two fields to chapters:

- A `frameworks:` list beside `audience`, so each chapter states the frameworks it implements, and the site's listing machinery can filter by them.
- A `date-modified` field, so a crosswalk's "as of" date can be traced per chapter.

The 0-to-3 depth would be derived rather than typed by hand: 3 where a requirements-mapping appendix row names the framework with an evidence cell, 2 or 1 from the chapter text. A script like the one that fills the books' metrics table could compute it, and this page could then be generated from the books instead of maintained separately.

## Status and review

**In review.** Each framework's status was checked at its primary source on October 23, 2026, and every score comes from reading the chapters. Some sources couldn't be reached: the cio.gov pages for Cloud Smart and FITARA (certificate and 404 errors), Federal Register document pages (bot protection, which wasn't bypassed; its API and govinfo were used instead), and the OMB PDF of M-23-07 (404). To move this page to **Proved**, a reviewer confirms the scores against the books and the planned additions are either made or declined. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

[^a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource* (2016 revision), §5.a(2), §5.d, §5.f and Appendix II, <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf>; OMB Circulars index, <https://www.whitehouse.gov/omb/information-resources/guidance/circulars/> (both accessed Oct 23, 2026).
[^m2610]: Office of Management and Budget, M-26-10, *Reinforcing Transparency, Accountability, and Oversight of Federal Technology*, March 31, 2026, §1 and Requirements, <https://www.whitehouse.gov/wp-content/uploads/2026/03/M-26-10-Reinforcing-Transparency-Accountability-and-Oversight-of-Federal-Technology.pdf> (accessed Oct 23, 2026).
[^cca]: 40 U.S.C. §11312, Capital planning and investment control (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title40/html/USCODE-2023-title40-subtitleIII-chap113-subchapII-sec11312.htm> (accessed Oct 23, 2026).
[^tmf]: Technology Modernization Fund, <https://tmf.cio.gov/>, agency and project fit <https://tmf.cio.gov/fit/>, process <https://tmf.cio.gov/process/>, and 2026 Call for Proposals <https://tmf.cio.gov/2026-call-for-proposals/> (accessed Oct 23, 2026).
[^idea]: 21st Century Integrated Digital Experience Act, Pub. L. 115-336, <https://www.govinfo.gov/content/pkg/PLAW-115publ336/html/PLAW-115publ336.htm>; OMB M-23-22, *Delivering a Digital-First Public Experience* (archived page), <https://bidenwhitehouse.archives.gov/omb/management/ofcio/delivering-a-digital-first-public-experience> (both accessed Oct 23, 2026).
[^m2618]: Office of Management and Budget, M-26-18, *Scaling Use of Login.gov to Deliver a Universal Sign-on for Public Services*, August 31, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/08/M-26-18-Scaling-Use-of-Login.gov-to-Deliver-a-Universal-Sign-on-for-Public-Services.pdf> (accessed Oct 23, 2026).
[^s508]: Section508.gov, Laws and policies, <https://www.section508.gov/manage/laws-and-policies/> (accessed Oct 23, 2026).
[^records]: 44 U.S.C. §3101 (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap31-sec3101.htm>; National Archives, Records management policy, <https://www.archives.gov/records-mgmt/policy> (both accessed Oct 23, 2026).
[^also]: NIST SP 800-53 Rev. 5, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; FedRAMP, <https://www.fedramp.gov/>, and 44 U.S.C. §3607, <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap36-sec3607.htm>; OMB M-26-14, May 22, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>; CISA, Zero Trust Maturity Model, <https://www.cisa.gov/zero-trust-maturity-model>; NIST FIPS 201-3, <https://csrc.nist.gov/pubs/fips/201-3/final> (all accessed Oct 23, 2026).
