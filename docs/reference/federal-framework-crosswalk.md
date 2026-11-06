---
title: "Federal Framework Crosswalk"
subtitle: "Which federal modernization frameworks the workbook's 20 books address, where, and how deeply, with each framework's status checked on October 23, 2026, and every federal source the books cite"
description: "Research under review: a crosswalk of the Federal Modernization Workbook's 20 books against federal modernization frameworks: each framework's current status, a book-by-framework coverage matrix scored 0 to 3, the gaps, and a proposal for tagging chapters by framework."
research-status: in review
research-type: reference
research-book: "Books 00–19"
date-modified: 2026-11-06
last-reviewed: 2026-11-06
aliases:
  - /docs/research/federal-framework-crosswalk.html
---

# Federal Framework Crosswalk {.unnumbered}

A federal modernization program answers to more than its security controls. Statute and OMB policy also govern how IT investments are chosen and funded, how enterprise architecture is kept, how digital services are delivered, and how privacy and records are handled. This page maps the workbook's 20 books against those frameworks, checks each one's current status at its primary source, and records where coverage is deep, thin or missing, so that the gaps can be closed deliberately.

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
| Technology Modernization Fund | **Current**: the 2026 call for proposals prioritizes legacy modernization and cybersecurity, expects full repayment, and, as of October 23, 2026, said "Competitive projects are less than $25M and take no more than three years." On October 28, 2026 that sentence was no longer on the call page, and the fit page said competitive projects "are typically less than $25M and use a five year repayment timeline, though the Board may consider outliers."^[h](#tn-h)^ | TMF fit criteria |
| 21st Century IDEA | **In force**: Pub. L. 115-336 sets eight criteria for new or redesigned public websites and digital services, and §3(c) asks that any intranet established after December 20, 2018 meet them "to the greatest extent practicable"; it also requires digital forms and an e-signature plan. OMB M-23-22 implements it for public services.^[i](#tn-i)^ | IDEA and M-23-22; OMB M-26-18 (August 31, 2026) adds Login.gov as the universal sign-on for public-facing services^[j](#tn-j)^ |
| NIST CSF 2.0 and the RMF (SP 800-37 Rev. 2) | **Current**^[k](#tn-k)^ | As cited |
| Section 508 | **In force**: 29 U.S.C. §794d, the revised 508 Standards, and OMB M-24-08^[l](#tn-l)^. Rechecked November 2, 2026: the standards still incorporate WCAG 2.0 Level A and AA, and no rescission of M-24-08 was found[^s508-nov2] | As cited; WCAG 2.0 Level AA is the legal floor, and WCAG 2.2 is design guidance |
| Privacy Act; E-Government Act §208 | **In force**: A-130 §5.f and Appendix II direct privacy impact assessments and the handling of personal information^[d](#tn-d)^ | As cited |
| Federal records (44 U.S.C. chapters 31 and 33) | **In force**: agency heads "shall make and preserve records containing adequate and proper documentation"; NARA lists M-23-07 as current OMB guidance^[m](#tn-m)^ | 44 U.S.C. §3101, M-23-07, NARA General Records Schedules; for the evidence the kits produce, see [Book 13, Chapter 13](../books/b13-governance/13-records-evidence-and-retention.md) |
| Cloud Smart (2019) | **Couldn't verify**: the strategy's page on cio.gov failed to load, and no successor was found | Kept provisionally |
| TOGAF Standard | **Current, voluntary**: the 10th Edition (C220), launched April 25, 2022, with Technical Corrigendum 1 applied in May 2025, published by The Open Group. No federal instrument requires it; A-130 requires an enterprise architecture but names no framework.^[n](#tn-n)^ | A-130 §5.a(2) and SP 800-53 PM-7 for the requirement; TOGAF as the method ([Book 18, Chapter 09](../books/b18-application-modernization/09-togaf-and-zachman.md)) |
| Zachman Framework | **Current, voluntary**: Version 3.0 (2011), published by Zachman International; an ontology of six interrogatives by six perspectives, not a method. No federal instrument requires it.^[o](#tn-o)^ | As for TOGAF ([Book 18, Chapter 09](../books/b18-application-modernization/09-togaf-and-zachman.md)) |

**Notes to the table**

- [**a.**]{#tn-a} Office of Management and Budget, M-26-05, *Adopting a Risk-based Approach to Software and Hardware Security*, January 23, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/01/M-26-05-Adopting-a-Risk-based-Approach-to-Software-and-Hardware-Security.pdf> (accessed Oct 23, 2026).
- [**b.**]{#tn-b} Federal Data Strategy, <https://strategy.data.gov/> (retirement notice), and <https://resources.data.gov/> (accessed Oct 23, 2026).
- [**c.**]{#tn-c} The White House (archived), Federal Enterprise Architecture, including FEAF v2 (January 29, 2013) and the Common Approach to Federal EA (May 2, 2012), <https://obamawhitehouse.archives.gov/node/17927> (accessed Oct 23, 2026).
- [**d.**]{#tn-d} Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource* (2016 revision), §5.a(2), §5.d, §5.f and Appendix II, <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf>; OMB Circulars index, <https://www.whitehouse.gov/omb/information-resources/guidance/circulars/> (both accessed Oct 23, 2026).
- [**e.**]{#tn-e} Federal Register API, presidential documents citing Executive Order 14028, <https://www.federalregister.gov/api/v1/documents.json?conditions[term]=%22Executive+Order+14028%22&conditions[type][]=PRESDOCU&order=newest>; Executive Order 14306 text, <https://www.govinfo.gov/content/pkg/DCPD-202500669/html/DCPD-202500669.htm> (both accessed Oct 23, 2026).
- [**f.**]{#tn-f} Office of Management and Budget, M-26-10, *Reinforcing Transparency, Accountability, and Oversight of Federal Technology*, March 31, 2026, §1 and Requirements, <https://www.whitehouse.gov/wp-content/uploads/2026/03/M-26-10-Reinforcing-Transparency-Accountability-and-Oversight-of-Federal-Technology.pdf> (accessed Oct 23, 2026).
- [**g.**]{#tn-g} 40 U.S.C. §11312, Capital planning and investment control (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title40/html/USCODE-2023-title40-subtitleIII-chap113-subchapII-sec11312.htm> (accessed Oct 23, 2026).
- [**h.**]{#tn-h} Technology Modernization Fund, <https://tmf.cio.gov/>, agency and project fit <https://tmf.cio.gov/fit/>, process <https://tmf.cio.gov/process/>, and 2026 Call for Proposals <https://tmf.cio.gov/2026-call-for-proposals/> (accessed Oct 23, 2026; fit and call pages rechecked Oct 28, 2026).
- [**i.**]{#tn-i} 21st Century Integrated Digital Experience Act, Pub. L. 115-336, <https://www.govinfo.gov/content/pkg/PLAW-115publ336/html/PLAW-115publ336.htm>; OMB M-23-22, *Delivering a Digital-First Public Experience* (archived page), <https://bidenwhitehouse.archives.gov/omb/management/ofcio/delivering-a-digital-first-public-experience> (both accessed Oct 23, 2026).
- [**j.**]{#tn-j} Office of Management and Budget, M-26-18, *Scaling Use of Login.gov to Deliver a Universal Sign-on for Public Services*, August 31, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/08/M-26-18-Scaling-Use-of-Login.gov-to-Deliver-a-Universal-Sign-on-for-Public-Services.pdf> (accessed Oct 23, 2026).
- [**k.**]{#tn-k} NIST, Cybersecurity Framework, <https://www.nist.gov/cyberframework>; NIST SP 800-37 Rev. 2, <https://csrc.nist.gov/pubs/sp/800/37/r2/final> (both accessed Oct 23, 2026).
- [**l.**]{#tn-l} Section508.gov, Laws and policies, <https://www.section508.gov/manage/laws-and-policies/> (accessed Oct 23, 2026).
- [**m.**]{#tn-m} 44 U.S.C. §3101 (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap31-sec3101.htm>; National Archives, Records management policy, <https://www.archives.gov/records-mgmt/policy> (both accessed Oct 23, 2026).
- [**n.**]{#tn-n} The Open Group, *The TOGAF® Standard, 10th Edition* (C220), publication page, May 19, 2025, <https://publications.opengroup.org/c220>; "The Open Group Announces Launch of the TOGAF® Standard, 10th Edition," April 25, 2022, <https://www.opengroup.org/open-group-announces-launch-togaf-standard-10th-edition> (both accessed Oct 28, 2026).
- [**o.**]{#tn-o} John A. Zachman, *The Zachman Framework for Enterprise Architecture: The Enterprise Ontology*, Version 3.0, © 1987–2011, <https://zachman-feac.com/images/ZI_PIcs/ZF3.jpg>; Zachman International, "About the Zachman Framework," <https://zachman-feac.com/zachman/about-the-zachman-framework> (both accessed Oct 28, 2026).

The frameworks the workbook relies on most are not on the usual modernization lists at all: NIST SP 800-53 Rev. 5 (release 5.2.0), FedRAMP, OMB M-26-14 on logging (which rescinded M-21-31), the CISA Zero Trust Maturity Model 2.0, FIPS 201 and HSPD-12, and FISMA.[^also] They're included in the matrix below.

::: {.landscape}

## Coverage matrix

| Framework | 00 Orientation & Program | 01 The Transformation Arc | 02 Identity & Directory | 03 HR-Driven Identity | 04 Access & Privilege | 05 Devices & Endpoints | 06 Data Platform: SQL Server Identity | 07 PKI & Certificates | 08 DNS, DHCP & IPAM | 09 Network & Transport | 10 Cloud Boundary & Landing Zone | 11 Zero Trust & Assessment | 12 Security Operations & Telemetry | 13 Governance, Drift & Evidence | 14 Federal Compliance & Authorization | 15 Compliance Automation & Day-2 Operations | 16 People: Training & Education | 17 AI Identity Governance | 18 Application Modernization | 19 Building the Attribute-Driven Migration |
|--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| NIST SP 800-53 Rev. 5 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| FedRAMP | 2 | 3 | 2 | 1 | 3 | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 1 | 3 |
| NIST RMF (SP 800-37 Rev. 2) | 2 | 2 | 2 | 2 | 0 | 1 | 3 | 2 | 2 | 2 | 3 | 2 | 3 | 3 | 3 | 2 | 2 | 3 | 1 | 0 |
| EO 14028 and M-22-09 | 2 | 3 | 3 | 2 | 2 | 0 | 3 | 3 | 3 | 3 | 0 | 3 | 0 | 0 | 2 | 1 | 1 | 0 | 0 | 3 |
| CISA ZTMM 2.0 | 1 | 3 | 1 | 1 | 1 | 0 | 3 | 0 | 3 | 3 | 0 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| HSPD-12 and FIPS 201 | 0 | 3 | 3 | 3 | 1 | 1 | 2 | 3 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 1 |
| OMB M-26-14 (logging) | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 3 | 3 | 0 | 3 | 3 | 1 | 2 | 0 | 0 | 0 | 0 | 0 |
| FISMA 2014 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 2 | 3 | 0 | 0 |
| OMB Circular A-130 | 2 | 0 | 0 | 2 | 2 | 0 | 2 | 0 | 0 | 0 | 1 | 0 | 2 | 3 | 3 | 0 | 2 | 3 | 3 | 0 |
| Privacy Act and E-Gov §208 PIAs | 0 | 0 | 0 | 3 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 3 | 0 | 0 | 3 | 2 | 0 |
| Federal records | 3 | 2 | 0 | 2 | 0 | 0 | 0 | 2 | 2 | 0 | 2 | 0 | 3 | 2 | 2 | 1 | 2 | 0 | 1 | 0 |
| M-26-05 (was M-22-18) | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 0 | 0 | 0 | 2 | 0 |
| Evidence Act (was the Federal Data Strategy) | 0 | 3 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 0 |
| NIST CSF 2.0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 1 | 0 | 1 | 0 | 0 | 0 |
| Section 508 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 3 | 0 | 3 | 0 |
| Enterprise architecture (A-130 §5.a(2)) | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 0 | 0 | 0 | 3 | 0 |
| Clinger-Cohen, CPIC and A-11 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 2 | 0 |
| FITARA (M-26-10) | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 2 | 0 |
| Cloud Smart | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Technology Modernization Fund | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 |
| 21st Century IDEA and M-23-22 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 |
| TOGAF Standard, 10th Edition | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 |
| Zachman Framework 3.0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 |

Notes: Book 18 was added on October 28, 2026; its scores and the TOGAF and Zachman rows come from its chapters as published that day, and no other book cites either framework. Book 14's enterprise architecture score rests on A-130 §5.a(2) and control PM-7, with architecture artifacts and review gates as the evidence; no book names FEAF. Book 01's Cloud Smart score is a mention of its 2010 predecessor, Cloud First, as history. Book 12 relies on M-22-09 through other books rather than citing it directly. Book 19 was added on November 6, 2026 and is scored from its index and ten chapters: each chapter's "Federal requirements and evidence" table (Chapter 10: "Requirements, KSIs and evidence") maps scripted kit actions to SP 800-53 controls and FedRAMP Key Security Indicators with the file or command that proves each, so those two rows and the M-22-09 row score 3; HSPD-12 scores 1 because Chapter 05 names the leaver's PIV revocation as a custom-extension example and nothing more. Book 19 doesn't cite the RMF, FISMA, A-130, the Privacy Act, records law, the Zero Trust Maturity Model, M-26-14, M-26-05, the Evidence Act, CSF 2.0, Section 508, enterprise architecture, capital planning, FITARA, Cloud Smart, the TMF, IDEA, TOGAF or Zachman, so those cells are 0.

:::

## What the matrix shows

The security, identity and authorization frameworks are covered deeply, usually with evidence: SP 800-53 is mapped to evidence in every book, FedRAMP in 14, and the zero-trust mandates in 8. That's by design: the workbook is a technical modernization program, and its books end in controls, gates and evidence an assessor can read.

Before the October 23, 2026 additions, the investment, portfolio and digital-service frameworks were essentially absent: Clinger-Cohen and capital planning, the Technology Modernization Fund, FITARA, 21st Century IDEA, Cloud Smart and enterprise architecture by name scored 0 or 1 almost everywhere, Section 508 was evidence-backed only in Book 16, records only in Book 12, and OMB M-23-07, the current records memo, wasn't cited. The matrix above is rescored after the additions described below; Cloud Smart is still unscored beyond its one mention because its status couldn't be verified.

## Additions made, October 23, 2026

Each gap was closed in the books with endnoted text, checked against the primary source the same day:

- **Capital planning, the Technology Modernization Fund and FITARA.** A new appendix, [Book 00, Appendix C — Funding and Acquiring the Program](../books/b00-orientation/appendix-c-funding-and-acquisition.md), maps the program's assessment, gates, charters, scorecard and risk register onto the investment record that 40 U.S.C. §11312, Circular A-130 §5.d and A-11 Section 55 require; maps a project charter to the Technology Modernization Fund's initial proposal;[^tmf] and sets an acquisition checklist for FITARA's CIO approval and OMB M-26-10's vendor utilization and pricing provisions. It notes that A-11's 2025 edition has no Exhibit 300, and that M-26-10 gives no clause wording.[^cca][^m2610] Book 00 Chapters 05 and 06, Book 09 Chapter 13 and Book 14 Chapter 07 (a utilization-and-pricing field in the supplier record) point to it.
- **Enterprise architecture.** Appendix C and [Book 14, Chapter 05](../books/b14-compliance/05-program-management-controls.md) state that the program's assessment, target estate and phase plan are the baseline, target and transition plan A-130 §5.a(2) requires.[^a130]
- **21st Century IDEA and Login.gov.** [Book 00, Chapter 02](../books/b00-orientation/02-how-to-use-this-workbook.md#what-the-workbook-covers-and-what-it-doesnt) states the scope: public-facing services and M-26-18's Login.gov sign-on are out; IDEA §3(c), which reaches intranets established after December 20, 2018, and Section 508 still apply to the internal systems the program builds.[^idea][^m2618] Book 15 Chapter 03 applies IDEA §3(c) to the help desk's self-service front door.
- **Section 508.** Book 04 Chapter 09 (the access request portal), Book 15 Chapter 03 (help desks and forms), Chapter 06 (the vendor's Accessibility Conformance Report at SaaS intake) and Chapter 12 (an accessibility check among the validation harnesses).[^s508]
- **NIST CSF 2.0.** Book 00 Chapter 02 maps the six Functions to the books that carry them, and notes that RECOVER rests on Book 14's contingency planning.
- **Records.** [Book 00, Chapter 10](../books/b00-orientation/10-retirement-steady-state-and-success.md#records-before-hardware-the-decommissioning-checklist) adds a decommissioning checklist built on 44 U.S.C. §3101, 36 CFR parts 1225, 1226, 1230 and 1236, the General Records Schedules 3.1 and 3.2, and M-23-07; Book 01 Chapter 09, Book 07 Chapter 08 and Book 08 Chapter 10 point to it.[^records]
- **Cloud Smart** is left out of the books until its status can be confirmed: the strategy's cio.gov pages still didn't load on October 23, 2026.

## Additions made, October 28, 2026

- **Book 18, Application Modernization**, joins the matrix as its own column. Its [Chapter 06](../books/b18-application-modernization/06-compliance-by-design.md) maps SP 800-53 families, A-130 and the SSDF onto the application life cycle; [Chapter 02](../books/b18-application-modernization/02-triaging-the-portfolio.md) and [Chapter 10](../books/b18-application-modernization/10-running-the-portfolio-in-waves.md) tie portfolio triage to capital planning, FITARA and the Technology Modernization Fund; and [Chapter 09](../books/b18-application-modernization/09-togaf-and-zachman.md) maps the book to TOGAF ADM phases and Zachman cells against A-130 §5.a(2) and PM-7.
- **TOGAF and Zachman** are added to the status table and the matrix as voluntary methods. Neither is a federal requirement; the requirement is A-130's enterprise architecture.
- **The Technology Modernization Fund** row was rechecked: the "no more than three years" sentence quoted on October 23 was gone from the call page on October 28, and the fit page now gives a five-year repayment timeline.

## Additions made, October 29, 2026

- **Configuration baselines for a Moderate civilian agency.** The workbook targets FedRAMP Moderate civilian agencies, so its configuration authority is CISA and NIST, not DISA. Books 11, 12 and 15 now say what a civilian agency uses. CISA's SCuBA baselines cover Microsoft 365 and Google Workspace,[^scuba] and BOD 25-01 makes their "shall" policies mandatory for in-scope tenants of Federal Civilian Executive Branch agencies.[^bod2501] For servers, network devices, hypervisors and cloud accounts, the agency sets its own CM-6 settings from common secure configurations it chooses,[^cm6] drawing on CIS Benchmarks,[^cis] the NIST National Checklist Program[^ncp] and the vendor's own hardening guide. DISA STIGs stay only as an optional reference (High only), for a product with no other published checklist.

*High only* marks material that applies to FedRAMP High or Defense environments, such as DISA STIGs and DoD Impact Levels, not to the Moderate civilian baseline this workbook targets. It's kept as an optional reference.

## Additions made, October 30, 2026

- **OMB's AI memoranda.** M-25-21 and M-25-22 were rechecked against OMB's memoranda list: neither has been amended or rescinded, and the only later AI memorandum is M-26-04. Book 15, Chapter 13 cites all three of M-24-10, M-25-21 and M-25-22, and Book 18, Chapter 05 cites M-25-21 and M-25-22; the citing-book lists below now include them. No page in the workbook cites M-24-10 or M-24-18 as current. The explainer [Governing and Buying AI Under M-25-21 and M-25-22](../books/explainers/omb-ai-memos-m-25-21-m-25-22.md) covers the parts of both memos that Book 17 doesn't: the governance structure, the AI strategy and compliance plan, and M-25-22's acquisition lifecycle and contract terms.

## Additions made, November 2, 2026

Before these additions the Privacy Act and E-Government Act §208 row scored 0 in fourteen of the nineteen books, and no book treated privacy as a design obligation of identity work. Each addition below was checked against its primary source on November 2, 2026, and is logged in the chapter's verification file:

- **Book 03, [Chapter 14 — Privacy for Workforce Identity](../books/b03-hr-identity/14-privacy-for-workforce-identity.md)**, a new chapter: which identity data is PII; whether the HR-to-directory flow is covered by an existing system-of-records notice, through the government-wide notices OPM/GOVT-1, General Personnel Records, and, for agencies on the shared PIV service, GSA/GOVT-7;[^pa-govt1] when a PIA is required under E-Government Act §208, M-03-22 and A-130, and which identity changes reopen it; minimization and purpose limits for directory attributes; routine uses and disclosures to SaaS and cloud providers under Privacy Act subsection (m) and A-108 §6.j; accounting of disclosures; correction through HR, not the directory; retention; the Senior Agency Official for Privacy; and the PT family. It ends with a checklist an engineer runs before adding an attribute or an integration. Book 03 already scored 3, and still does.
- **The PT family is not in the Moderate baseline.** NIST's OSCAL Release 5.2.0 profiles show no PT control in the Moderate security baseline; PT-1 to PT-8 and five PT enhancements are in the privacy baseline, which SP 800-53B applies "irrespective of impact level." Of the privacy baseline's 96 controls and enhancements, 43 are also in the Moderate baseline.[^pa-53b] Book 14, Chapter 03 lists the PT controls in the privacy baseline as PT-1 to PT-5 and PT-7; the profile also includes PT-6 and PT-8. That sentence has since been corrected to list all eight.
- **A short Privacy section**, each with a table of obligation, what the engineer does and who signs off, in the chapter of each book where identity data collects: [Book 04, Chapter 09](../books/b04-access/09-access-governance.md#privacy) (attributes read by access policies, review records, correction through HR); [Book 06, Chapter 04](../books/b06-data-platform/04-the-estate-inventory.md#privacy-in-the-inventory) (the inventory of systems that process PII, consolidation as a PIA and SORN trigger); [Book 12, Chapter 03](../books/b12-security-operations/03-identity-telemetry.md#privacy-identity-telemetry-is-pii) (sign-in logs are PII, purpose limits, AU-3(3)); [Book 13, Chapter 07](../books/b13-governance/07-evidence-over-attestation.md#privacy-evidence-contains-identifiers) (evidence stores contain identifiers, disclosure to assessors); [Book 17, Chapter 03](../books/b17-ai-identity/03-the-inventory-as-an-identity-source.md#privacy-ai-identities-and-the-inventory) (the inventory's PII and PIA fields as a gate for AI identities, M-25-21's impact assessment); and [Book 18, Chapter 04](../books/b18-application-modernization/04-moving-the-data.md#privacy-in-the-move) (a data move as a SORN and PIA event, test data and validation reports).
- **Rescored.** The Privacy Act and §208 row rises from 0 to 2 for Books 04, 06 and 13; Book 12 stays at 2, now with actionable guidance in its telemetry chapter, and Books 17 and 18 keep 3 and 2. The A-130 row rises from 0 to 2 for Books 04, 06 and 12, which now apply its minimization principle and PII inventory. None of the new sections maps privacy to evidence in a requirements appendix, so none scores 3.
- **Section 508.** Accessibility was cited across the books but thin where applications are built and bought. [Book 18, Chapter 06](../books/b18-application-modernization/06-compliance-by-design.md#section-508-gate) now sets an accessibility gate: the Revised 508 Standards and the WCAG version they incorporate; OMB M-24-08; a design, build, test, deploy and operate table with the evidence and the sign-off at each stage; automated testing plus manual testing with assistive technology; accessible sign-in, multifactor enrollment, password reset and recovery as Microsoft Learn documents them; forms and error messages; the vendor's Accessibility Conformance Report at procurement; and documented exceptions for undue burden, fundamental alteration and best meets. [Chapter 07](../books/b18-application-modernization/07-who-governs-the-architecture.md#four-gates) adds the accessibility evidence to Gates 2 to 4, so Book 18 scores 3. [Book 16, Chapter 09](../books/b16-people/09-building-and-running-the-curriculum.md#accessible-content) adds accessible training content (captions, transcripts, keyboard navigation, screen readers, documents and assessments) and says plainly what the workbook's own narrated videos and its deck accessibility check do and don't establish. Book 04 Chapter 09 adds a note on access-package request questions, and Book 15 Chapter 03 one on accessible verification and recovery at the help desk; neither changes those books' scores.
- **The WCAG version was rechecked.** The Revised 508 Standards still incorporate WCAG 2.0 (December 11, 2008) at Level A and AA; neither the Access Board nor Section508.gov mentions an update to WCAG 2.1 or 2.2. The books treat WCAG 2.0 Level AA as the requirement and WCAG 2.2 as design guidance.[^s508-nov2]
- **HSPD-12, FIPS 201 and M-19-17 in Book 07.** A new chapter, [Book 07, Chapter 09 — Federal Workforce Credentials: PIV, Derived PIV and Cloud Authentication](../books/b07-pki/09-federal-workforce-credentials.md), treats the PIV credential as the federal workforce credential that cloud authentication sits under. It covers HSPD-12 and FIPS 201-3 (the PIV authentication certificate, the background investigation link, reissuance, and termination tied to the HR leaver gate), derived PIV under SP 800-157 (Rev. 1 still a final public draft), Entra certificate-based authentication as acceptance of the credential, Federal PKI trust and PIV-I, M-19-17's call to accept other agencies' PIV through federation, SP 800-63-4 assurance levels, and an evidence table mapping IA-2(12), IA-5(2), IA-8(1), IA-12, PS-4 and SC-17 to the records the ISSO keeps. Book 07 is added to the citing books for HSPD-12, M-19-17, SP 800-157, SP 800-157 Rev. 1 and SP 800-63-4, and SP 800-217 (PIV federation, a final public draft) is added to the NIST list. Book 07's HSPD-12 and FIPS 201 score stays 3; its EO 14028 and M-22-09 score rises from 1 to 3, because the chapter maps M-22-09's phishing-resistant requirement to the authentication strength and its evidence. Every source was read on November 2, 2026 and is logged in the chapter's verification file.

## Additions made, November 5, 2026

Sources now have a permanent home in the [Source Register](source-register.md), which slides and video descriptions link to and which holds each source's address under revision control. The seventeen sources the Start series and the Book 00 decks cite link to their register row from the tables below. Other rows link to the register once a slide or video cites them; the register holds only what slides and videos link to.

## Additions made, November 6, 2026

- **Book 19, [Building the Attribute-Driven Migration](../books/b19-developer-workbook/index.md)**, joins the matrix as its own column (scored on the note under the matrix), and the book count on this page is now 20 (Books 00 to 19; `research-book` now says so).
- **Re-review.** Each earlier addition (October 28 and 29 and 30, November 2 and 5) was reread against the chapters it cites: the linked chapters and headings exist, the cited controls, memoranda and notices appear in them, and the Privacy Act, A-130, Section 508 and EO 14028 scores match the cells. Nothing needed changing. The Book 18 portfolio claim rests on two chapters together: Chapter 02 names FITARA, and Chapters 02 and 10 name capital planning and the Technology Modernization Fund. The source lists below were built from the October 23 sweep and are not recounted for Book 19; the "All 20 books" rows were checked against it.
- **Checks.** `scripts/check_framework_crosswalk.py` now runs on every pull request and checks the counts in the section headings, `research-book`, the matrix columns and rows, and the review dates.

## Every federal source the books cite

The status table above covers the frameworks a modernization program is usually measured against. The books cite far more. A sweep of the books on October 23, 2026 (Books 00 to 17, before Books 18 and 19 existed) found **229 distinct federal instruments** (231 with the NIST Privacy Framework and SP 800-217, added November 2, 2026): laws, regulations, executive orders, OMB memoranda and circulars, CISA directives and programs, NIST publications, FedRAMP rules, NARA schedules and other federal sources. They are listed below by category, with the books that cite each and its status as the books state it; each book checked its own citations against the primary source on the date it was built. Vendor documents, IETF RFCs and GAO reports are not listed.

The sweep also found and corrected five inconsistencies on October 23, 2026: Book 07 accepted FIPS 140-2 modules for new certificate authorities after the date NIST moved 140-2 certificates to its Historical List; Books 01, 06 and 09 described Azure's FedRAMP status in the pre-2026 "P-ATO" vocabulary without saying so; a Book 16 description cited the superseded 2003 SP 800-50; and two Book 09 notes cited the July 2025 TIC Program Guidebook after its September 2026 reissue.

::: {.callout-note collapse="true"}
## Statutes (28)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| 15 U.S.C. §7443 | National cybersecurity awareness and education program | Book 16 (People: Training & Education) | Cited as current |
| 21st Century IDEA (Pub. L. 115-336) | Website and digital-service criteria; §3(c) intranets | Book 00 (Orientation & Program); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| 26 U.S.C. §6103 | Confidentiality of federal tax information | Book 12 (Security Operations & Telemetry) | Cited as current |
| 31 U.S.C. §1105(a) | President's budget submission | Book 09 (Network & Transport) | Cited as current |
| 40 U.S.C. §11331 | Federal information systems standards (NIST standards made compulsory) | Book 14 (Federal Compliance & Authorization) | Cited as current |
| 44 U.S.C. §3101 (and chapters 31, 33) | Records management by agency heads | Book 00 (Orientation & Program) | Cited as current |
| 5 U.S.C. §4118 | Authority for training regulations | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| 6 U.S.C. §1523 | Federal cybersecurity requirements: single sign-on for public websites; MFA for remote and privileged access | Book 00 (Orientation & Program) | Cited as current |
| Advancing American AI Act | AI use-case inventory statute | Book 17 (AI Identity Governance) | Cited as current |
| Chief Financial Officers Act of 1990 | Defines the covered 'CFO Act agencies' | Book 00 (Orientation & Program); Book 03 (HR-Driven Identity); Book 09 (Network & Transport); Book 16 (People: Training & Education); Book 17 (AI Identity Governance) | Cited as current |
| Chief Human Capital Officers Act (5 U.S.C. §§1401-1402) | CHCO Act | Book 16 (People: Training & Education) | Cited as current |
| Clinger-Cohen Act (40 U.S.C. §11312, §11313) | Capital planning and investment control | Book 00 (Orientation & Program); Book 09 (Network & Transport) | Cited as current |
| Computer Matching and Privacy Protection Act (Privacy Act matching provisions) | Computer matching agreements and notices | Book 14 (Federal Compliance & Authorization) | Cited as current |
| E-Government Act of 2002 (Pub. L. 107-347), incl. §208 | E-Government Act; §208 privacy impact assessments and web privacy policies | Book 03 (HR-Driven Identity); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| Federal Acquisition Supply Chain Security Act of 2018 (41 U.S.C. §1326 et seq.) | FASCSA; FASC exclusion and removal orders | Book 03 (HR-Driven Identity); Book 14 (Federal Compliance & Authorization) | Cited as current |
| Federal Cybersecurity Enhancement Act of 2015 (6 U.S.C. §663 note) | Basis for CISA intrusion detection/prevention, incl. Protective DNS | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport) | Cited as current |
| Federal Cybersecurity Workforce Assessment Act of 2015 (Pub. L. 114-113, div. N, title III; 5 U.S.C. 301 note) | Cybersecurity position coding | Book 16 (People: Training & Education) | Cited as current |
| FedRAMP Authorization Act (2022) | Codified FedRAMP; requires OMB guidance on agency use | Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| FISMA 2014 (44 U.S.C. ch. 35 subch. II; §§3553, 3554) | Federal Information Security Modernization Act of 2014 | Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education); Book 17 (AI Identity Governance) | Cited as current |
| FITARA (40 U.S.C. §11319) | Federal IT Acquisition Reform Act: CIO approval of IT budgets and contracts | Book 00 (Orientation & Program); Book 17 (AI Identity Governance) | Cited as current |
| Foundations for Evidence-Based Policymaking Act of 2018 (Pub. L. 115-435; 44 U.S.C. 3502, 3511, 3520) | Evidence Act: data inventory, Chief Data Officer | Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 17 (AI Identity Governance) | Cited as current |
| Kari's Law and RAY BAUM'S Act §506 (47 CFR part 9, §§9.3, 9.16) | Direct 911 dialing and dispatchable location for multi-line telephone systems | Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| Modernizing Government Technology Act (Pub. L. 115-91, §1078) | MGT Act; created the Technology Modernization Fund | Book 00 (Orientation & Program) | Cited as current |
| NDAA for FY2021 (Pub. L. 116-283), §9401(g) | Amended the Workforce Assessment Act | Book 16 (People: Training & Education) | Cited as current |
| OPEN Government Data Act (Evidence Act Title II) | Open, Public, Electronic and Necessary Government Data Act | Book 02 (Identity & Directory) | Cited as current |
| Privacy Act of 1974 (5 U.S.C. §552a; Pub. L. 93-579) | Privacy Act | Book 03 (HR-Driven Identity); Book 04 (Access & Privilege); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| Section 508 of the Rehabilitation Act (29 U.S.C. §794d) | Accessibility of federal ICT | Book 00 (Orientation & Program); Book 04 (Access & Privilege); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education); Book 18 (Application Modernization) | Cited as current |
| Social Security Number Fraud Prevention Act of 2017 (Pub. L. 115-59) | Limits SSNs on mailed documents | Book 14 (Federal Compliance & Authorization) | Cited as current |

:::

::: {.callout-note collapse="true"}
## Regulations (9)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| 32 CFR Part 2002 | Controlled Unclassified Information | Book 12 (Security Operations & Telemetry) | Cited as current |
| 36 CFR Part 1194 | Section 508 ICT Standards | Book 04 (Access & Privilege); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education); Book 18 (Application Modernization) | Cited as current |
| 36 CFR part 1236 (incl. §§1236.10, 1236.14, 1236.20, 1236.22) | NARA: electronic records management | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 13 (Governance, Drift & Evidence) | Cited as current |
| 36 CFR parts 1225, 1226 and 1230 | NARA: scheduling, disposition, unlawful destruction | Book 00 (Orientation & Program) | Cited as current |
| 36 CFR §1220.34 | NARA: agency records management program requirements | Book 01 (The Transformation Arc); Book 13 (Governance, Drift & Evidence) | Cited as current |
| 5 CFR 930.301 | OPM: information security awareness and training | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| 5 CFR part 410 (§410.201, §410.202) | OPM: training | Book 16 (People: Training & Education) | Cited as current |
| FAR 48 CFR 1.602-1 | Federal Acquisition Regulation: contracting officer authority | Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone) | Cited as current |
| HIPAA Privacy Rule (45 CFR 164.500) | Health Insurance Portability and Accountability Act | Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |

:::

::: {.callout-note collapse="true"}
## Executive orders and directives (17)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| EO 13556 | Controlled Unclassified Information | Book 12 (Security Operations & Telemetry) | Cited as current |
| EO 13587 | Classified-network safeguarding; insider threat programs | Book 14 (Federal Compliance & Authorization) | Cited as current |
| EO 13694 | Sanctions for significant malicious cyber-enabled activities | Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Amended by EO 14306 |
| EO 13960 | Promoting the use of trustworthy AI in the federal government (2020) | Book 17 (AI Identity Governance) | Cited as current |
| EO 14028 | Improving the Nation's Cybersecurity | Book 01 (The Transformation Arc); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 14 (Federal Compliance & Authorization) | In effect; books note EO 14306 amends EO 13694 and EO 14144, not EO 14028 |
| EO 14110 | Safe, secure and trustworthy AI (2023) | Book 17 (AI Identity Governance) | Revoked |
| EO 14144 | Strengthening and promoting innovation in the Nation's cybersecurity (Jan 2025) | Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Amended by EO 14306 (struck §5, rewrote software provisions) |
| EO 14179 | Removing barriers to American leadership in AI | Book 17 (AI Identity Governance) | Cited as current |
| EO 14306 | Sustaining select efforts to strengthen the Nation's cybersecurity | Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Cited as current |
| EO 14319 | Preventing woke AI in the federal government | Book 17 (AI Identity Governance) | Cited as current |
| EO 14409 | Promoting advanced AI innovation and security (June 2, 2026) | Book 17 (AI Identity Governance) | Cited as current |
| EO 14412 | Securing the Nation against advanced cryptographic attacks (June 22, 2026) | Book 09 (Network & Transport) | Cited as current |
| EO 14434 | AI terminology order (Sept 29, 2026) | Book 17 (AI Identity Governance) | Cited as current |
| Federal Continuity Directive 1 | Continuity of mission essential functions | Book 14 (Federal Compliance & Authorization) | Cited as current |
| HSPD-12 | Common identification standard for federal employees and contractors | Book 03 (HR-Driven Identity); Book 07 (PKI & Certificates) | Cited as current |
| NITTF Insider Threat Minimum Standards | National insider threat policy minimum standards | Book 14 (Federal Compliance & Authorization) | Cited as current |
| White House AI Action Plan (July 2025) | America's AI Action Plan; NIST AI RMF revision is tied to it | Book 17 (AI Identity Governance) | Cited as current |

:::

::: {.callout-note collapse="true"}
## OMB memoranda (35)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| 25-Point Implementation Plan to Reform Federal IT Management (2010), incl. 'Cloud First' | OMB IT reform plan | Book 01 (The Transformation Arc) | Cited as history |
| M-03-22 | Privacy provisions of the E-Government Act (PIAs, web privacy policies) | Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 14 (Federal Compliance & Authorization); Book 17 (AI Identity Governance); Book 18 (Application Modernization) | Tracking rules (§III(D)(2)(v)) rescinded by M-10-22; rest cited as in force |
| M-08-05 | Implementation of Trusted Internet Connections | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-08-16 | TIC guidance | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-08-23 | Securing the federal government's DNS infrastructure (DNSSEC) | Book 08 (DNS, DHCP & IPAM) | Cited as current |
| M-08-27 | TIC compliance guidance | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-09-32 | Update on the TIC initiative | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-10-22 | Online use of web measurement and customization technologies | Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-17-12 | Preparing for and responding to a breach of PII | Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-19-16 | Centralized mission support capabilities (QSMOs) | Book 03 (HR-Driven Identity) | Cited as current |
| [M-19-17](source-register.md#m-19-17){#m-19-17} | Improved identity, credential and access management | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 07 (PKI & Certificates); Book 13 (Governance, Drift & Evidence); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| M-19-18 (Federal Data Strategy) | Federal Data Strategy: a framework for consistency | Book 01 (The Transformation Arc); Book 03 (HR-Driven Identity) | Memo not rescinded; the strategy's website is being retired |
| M-19-23 | Phase 1 implementation of the Evidence Act | Book 03 (HR-Driven Identity) | Cited as current |
| M-19-26 | Update to the TIC initiative (TIC 3.0) | Book 03 (HR-Driven Identity); Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Operative; no rescinding instrument found |
| M-21-07 | Completing the transition to IPv6 | Book 08 (DNS, DHCP & IPAM); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-21-31 | Event logging (EL0-EL3) | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Rescinded by M-26-14 (May 22, 2026) |
| M-22-01 | Improving detection through endpoint detection and response | Book 11 (Zero Trust & Assessment) | Cited as current |
| [M-22-09](source-register.md#m-22-09){#m-22-09} | Federal Zero Trust strategy | All except Book 05 (Devices & Endpoints); Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 17 (AI Identity Governance) | Not rescinded; FY2024 deadlines passed; logging action read through M-26-14 |
| M-22-18 | Secure software supply chain (attestation) | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Rescinded by M-26-05 (Jan 23, 2026) |
| M-23-07 | Update to transition to electronic records (with NARA) | Book 00 (Orientation & Program) | Cited as current |
| M-23-16 | Update to M-22-18 | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Rescinded by M-26-05 (Jan 23, 2026) |
| M-23-22 | Delivering a digital-first public experience | Book 00 (Orientation & Program) | Cited as current |
| M-24-08 | Digital accessibility and Section 508 management | Book 04 (Access & Privilege); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education); Book 18 (Application Modernization) | Cited as current |
| M-24-10 | Governance and risk management for agency use of AI | Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Replaced by M-25-21 (Apr 3, 2025) |
| M-24-15 | Modernizing FedRAMP | Book 10 (Cloud Boundary & Landing Zone); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | In force; rescinded and replaced the 2011 FedRAMP memorandum |
| M-24-18 | Responsible acquisition of AI | Book 17 (AI Identity Governance) | Rescinded by M-25-22 (Apr 3, 2025) |
| M-25-21 | Federal use of AI: innovation, governance, public trust | Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance); Book 18 (Application Modernization) | Cited as current; see [Governing and Buying AI Under M-25-21 and M-25-22](../books/explainers/omb-ai-memos-m-25-21-m-25-22.md) |
| M-25-22 | Efficient acquisition of AI | Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance); Book 18 (Application Modernization) | Cited as current; see [Governing and Buying AI Under M-25-21 and M-25-22](../books/explainers/omb-ai-memos-m-25-21-m-25-22.md) |
| M-26-04 | Unbiased AI principles (LLM procurement) | Book 17 (AI Identity Governance) | Cited as current |
| [M-26-05](source-register.md#m-26-05){#m-26-05} | Risk-based approach to software and hardware security | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-26-10 | Transparency, accountability and oversight of federal technology (FITARA) | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization); Book 17 (AI Identity Governance) | In force; monthly contract reporting sunsets after the October 2026 report |
| [M-26-14](source-register.md#m-26-14){#m-26-14} | Agency logging and network visibility | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-26-15 | Migration to post-quantum cryptography | Book 07 (PKI & Certificates); Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-26-18 | Login.gov as the universal sign-on for public services | Book 00 (Orientation & Program) | Cited as current |
| OMB FedRAMP memorandum of Dec 8, 2011 | Original FedRAMP policy memorandum | Book 13 (Governance, Drift & Evidence) | Rescinded and replaced by M-24-15 |

:::

::: {.callout-note collapse="true"}
## OMB circulars (3)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| Circular A-108 | Privacy Act review, reporting and publication (SORNs, matching notices) | Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 18 (Application Modernization) | Cited as current |
| Circular A-11 (2025), incl. §51, §55 and the Capital Programming Guide v3.0 | Preparation, submission and execution of the budget | Book 00 (Orientation & Program); Book 09 (Network & Transport) | 2025 edition has no Exhibit 300 or Section 300 |
| Circular A-130 (2016) | Managing information as a strategic resource | Book 00 (Orientation & Program); Book 03 (HR-Driven Identity); Book 04 (Access & Privilege); Book 06 (Data Platform: SQL Server Identity); Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education); Book 17 (AI Identity Governance) | Cited as current |

:::

::: {.callout-note collapse="true"}
## CISA directives and programs (34)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| BOD 18-01 | Enhance email and web security | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Cited as current |
| BOD 19-02 | Vulnerability remediation for internet-accessible systems | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Revoked by BOD 26-04 (June 10, 2026) |
| BOD 22-01 | Known exploited vulnerabilities | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Revoked by BOD 26-04 (June 10, 2026) |
| BOD 23-01 | Asset visibility and vulnerability detection | Book 10 (Cloud Boundary & Landing Zone); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Cited as current |
| BOD 23-02 | Internet-exposed management interfaces | Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Cited as current |
| [BOD 25-01 (incl. Required Configurations)](source-register.md#bod-25-01){#bod-25-01} | Secure practices for cloud services | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 04 (Access & Privilege); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Cited as current |
| [BOD 26-02](source-register.md#bod-26-02){#bod-26-02} | End-of-support edge devices | Book 00 (Orientation & Program); Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| BOD 26-04 | Prioritizing security updates based on risk | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education); Book 17 (AI Identity Governance) | Cited as current |
| CISA Cloud Interface Reference Architecture (NCPS/CLAW) | Cloud interface reference architecture | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA Comprehensive Log Aggregation Warehouse (CLAW) | CISA log ingestion | Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA Cyber Hygiene scanning | Vulnerability scanning service | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| CISA Encrypted DNS Implementation Guidance | Encrypted DNS under M-22-09 | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport) | Cited as current |
| CISA Federal Incident Notification Guidelines (2017) | Federal incident reporting | Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| [CISA Logging Reference Architecture (with M-26-14 minimum logging baseline and maturity model)](source-register.md#cisa-logging){#cisa-logging} | Logging reference architecture | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| CISA Microsoft Expanded Cloud Logs Implementation Playbook | Expanded cloud logs | Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA Protective DNS | Protective DNS resolver (required for all egress resolution) | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA SASE guidance (June 2026) | SASE guidance for TIC | Book 01 (The Transformation Arc); Book 09 (Network & Transport) | Cited as current |
| CISA SBOM minimum elements (2025 draft) and HBOM framework | Bill-of-materials guidance | Book 14 (Federal Compliance & Authorization) | Cited as current |
| CISA SCuBA Secure Configuration Baselines (M365, Entra ID) and ScubaGear | Secure Cloud Business Applications: baselines for Microsoft 365 and Google Workspace only[^scuba] | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 04 (Access & Privilege); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Cited as current |
| CISA Vulnrichment / SSVC | Exploitation and impact metadata on CVE records | Book 12 (Security Operations & Telemetry) | Cited as current |
| [CISA Zero Trust Maturity Model v2.0](source-register.md#cisa-ztmm){#cisa-ztmm} | ZTMM | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 04 (Access & Privilege); Book 06 (Data Platform: SQL Server Identity); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 13 (Governance, Drift & Evidence) | Cited as current |
| Continuous Diagnostics and Mitigation (CDM) | CDM program and dashboards | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Cited as current |
| DHS TIC Compliance Validation | Legacy manual TIC validation | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Replaced by continuous validation through CDM |
| ED 25-03 (V1) | Compromise of Cisco devices | Book 14 (Federal Compliance & Authorization) | Original required actions superseded by V1 (Apr 23, 2026) |
| ED 26-01 | Mitigate vulnerabilities in F5 devices | Book 14 (Federal Compliance & Authorization) | Cited as current |
| ED 26-03 (V1) | Cisco SD-WAN vulnerabilities | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Original required actions superseded by V1 (Mar 11, 2026) |
| Known Exploited Vulnerabilities (KEV) catalog | KEV catalog | Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| NCPS / EINSTEIN (incl. E3A) | National Cybersecurity Protection System | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | E3A DNS sinkholing succeeded by Protective DNS |
| Ten emergency directives of 2019-2024 (SolarWinds Orion, on-prem Exchange, Print Spooler, VMware, ...) | Retired legacy EDs | Book 14 (Federal Compliance & Authorization) | Retired by CISA Jan 8, 2026 |
| TIC 2.x (legacy TIC) | Legacy TIC architecture | Book 09 (Network & Transport) | Superseded by TIC 3.0 (M-19-26) |
| TIC 3.0 (program and core guidance) | Trusted Internet Connections 3.0 | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 03 (HR-Driven Identity); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| TIC 3.0 Program Guidebook (v1.2, Sept 2026) | TIC program guidebook | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Cited as current |
| TIC 3.0 Security Capabilities Catalog (v3.3) | TIC security capabilities and PEP capabilities | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Cited as current |
| TIC 3.0 use cases (Traditional, Branch Office, Remote User, Cloud) and Use Case Handbook | TIC use cases | Book 09 (Network & Transport) | Cited as current |

:::

::: {.callout-note collapse="true"}
## NIST (54)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| FIPS 140-2 | Cryptographic modules (prior) | Book 07 (PKI & Certificates); Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Certificates moved to CMVP Historical List Sept 22, 2026; existing systems only |
| FIPS 140-3 (and FIPS 140 generally), CMVP | Cryptographic module security requirements and validation | Book 04 (Access & Privilege); Book 07 (PKI & Certificates); Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| FIPS 186-5 | Digital Signature Standard | Book 13 (Governance, Drift & Evidence) | Cited as current |
| FIPS 198-1 | HMAC | Book 13 (Governance, Drift & Evidence) | Cited as current |
| FIPS 199 | Security categorization | Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| FIPS 200 | Minimum security requirements | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| FIPS 201-3 | Personal Identity Verification (PIV) | Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 07 (PKI & Certificates) | Cited as current |
| FIPS 203 | ML-KEM | Book 09 (Network & Transport) | Cited as current |
| NIST AI 100-1 (AI RMF) | AI Risk Management Framework | Book 17 (AI Identity Governance) | Under revision; no revised version published |
| NIST AI 600-1 | Generative AI Profile | Book 17 (AI Identity Governance) | Cited as current |
| NIST Cybersecurity Framework 2.0 | CSF 2.0 | Book 00 (Orientation & Program); Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| NIST IR 8547 (initial public draft) | Transition to post-quantum cryptography standards | Book 07 (PKI & Certificates) | Draft |
| NIST National Checklist Program | Configuration checklist repository (SP 800-70) | Book 12 (Security Operations & Telemetry) | Cited as current; SP 800-70 Rev. 5 (May 2026) superseded Rev. 4[^ncp] |
| NIST National Vulnerability Database | NVD | Book 11 (Zero Trust & Assessment); Book 14 (Federal Compliance & Authorization) | Cited as current |
| NIST OSCAL | Open Security Controls Assessment Language | All 20 books | Cited as current |
| NIST Privacy Framework 1.0 | Privacy risk management (voluntary) | Book 03 (HR-Driven Identity) | Version 1.0 (Jan 2020) current; Version 1.1 is an initial public draft |
| SP 1800-35 | Implementing a Zero Trust Architecture | Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment) | Cited as current |
| SP 800-120 | EAP methods for wireless authentication | Book 09 (Network & Transport) | Withdrawn Oct 19, 2018 |
| SP 800-128 | Security-focused configuration management | Book 13 (Governance, Drift & Evidence); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| [SP 800-137](source-register.md#sp-800-137){#sp-800-137} | Information security continuous monitoring | Book 00 (Orientation & Program); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| SP 800-153 | Securing WLANs | Book 09 (Network & Transport) | Cited as current |
| SP 800-157 | Derived PIV credentials (2014, current final) | Book 03 (HR-Driven Identity); Book 07 (PKI & Certificates) | Cited as current |
| SP 800-157 Rev. 1 (final public draft) | Derived PIV credentials (draft) | Book 03 (HR-Driven Identity); Book 07 (PKI & Certificates) | Draft only (Nov 2024) |
| SP 800-16 | IT security training requirements (1998) | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Withdrawn; superseded by SP 800-50 Rev. 1 (Sept 2024) |
| SP 800-161 Rev. 1 | Cybersecurity supply chain risk management | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-171 | CUI in nonfederal systems | Book 12 (Security Operations & Telemetry); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| SP 800-181 Rev. 1 (NICE Framework) | Workforce Framework for Cybersecurity | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Supersedes SP 800-181 (2017) |
| SP 800-190 | Application container security | Book 12 (Security Operations & Telemetry) | Cited as current |
| [SP 800-207](source-register.md#sp-800-207){#sp-800-207} | Zero Trust Architecture | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 04 (Access & Privilege); Book 06 (Data Platform: SQL Server Identity); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 13 (Governance, Drift & Evidence) | Cited as current |
| SP 800-217 (final public draft) | Guidelines for PIV federation (draft) | Book 07 (PKI & Certificates) | Draft only (Nov 2024) |
| SP 800-218 (SSDF v1.1) | Secure Software Development Framework | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-218 Rev. 1 (SSDF v1.2 draft) | SSDF v1.2 initial public draft | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Draft only (Dec 2025) |
| [SP 800-30 Rev. 1](source-register.md#sp-800-30){#sp-800-30} | Risk assessments | Book 00 (Orientation & Program) | Cited as current |
| SP 800-34 Rev. 1 | Contingency planning guide | Book 14 (Federal Compliance & Authorization) | Cited as current |
| [SP 800-37 Rev. 2 (RMF)](source-register.md#sp-800-37){#sp-800-37} | Risk Management Framework | All except Book 04 (Access & Privilege) | Cited as current |
| SP 800-39 | Managing information security risk | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-47 Rev. 1 | Information exchanges | Book 03 (HR-Driven Identity) | Cited as current |
| SP 800-50 (2003) | IT security awareness and training program | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Superseded by SP 800-50 Rev. 1 (Sept 2024) |
| SP 800-50 Rev. 1 | Cybersecurity and privacy learning program | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Supersedes the 2003 SP 800-50 and SP 800-16 |
| SP 800-52 Rev. 2 | TLS guidelines | Book 09 (Network & Transport) | Cited as current |
| SP 800-53 Rev. 4 / FedRAMP Rev. 4 baseline | Prior control catalog | Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Superseded by Rev. 5 |
| [SP 800-53 Rev. 5 (release 5.2.0)](source-register.md#sp-800-53){#sp-800-53} | Security and privacy controls | All 20 books | Cited as current |
| SP 800-53A Rev. 5 | Control assessment procedures | Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| SP 800-53B | Control baselines | All except Book 00 (Orientation & Program); Book 02 (Identity & Directory); Book 05 (Devices & Endpoints); Book 07 (PKI & Certificates) | Cited as current |
| SP 800-60 | Information types to security categories | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-61 Rev. 2 | Incident handling guide (prior) | Book 12 (Security Operations & Telemetry) | Superseded by Rev. 3 (Apr 2025) |
| SP 800-61 Rev. 3 | Incident response (CSF 2.0 community profile) | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Supersedes Rev. 2 |
| SP 800-63-3 | Digital Identity Guidelines (prior) | Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity) | Superseded by SP 800-63-4 (July 2025) |
| SP 800-63-4 (incl. 63A-4, 63B-4) | Digital Identity Guidelines | Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 07 (PKI & Certificates); Book 09 (Network & Transport); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| SP 800-79 | PIV card and derived credential issuer authorization | Book 03 (HR-Driven Identity) | Cited as current |
| SP 800-81 Rev. 3 | Secure DNS deployment guide (Mar 2026) | Book 08 (DNS, DHCP & IPAM) | Supersedes SP 800-81-2 |
| SP 800-81-2 | Secure DNS deployment guide (2013) | Book 08 (DNS, DHCP & IPAM) | Superseded by SP 800-81r3 |
| SP 800-84 | Test, training and exercise programs | Book 14 (Federal Compliance & Authorization) | Cited as current |
| [SP 800-88 Rev. 2](source-register.md#sp-800-88){#sp-800-88} | Media sanitization | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Supersedes Rev. 1 (2014) |

:::

::: {.callout-note collapse="true"}
## FedRAMP (22)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| FedRAMP (program, generally) | Federal Risk and Authorization Management Program | All 20 books | Cited as current |
| [FedRAMP 20x and Key Security Indicators](source-register.md#fedramp-ksi){#fedramp-ksi} | 20x certification; KSI families | All except Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 07 (PKI & Certificates); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport) | Cited as current |
| FedRAMP AI Prioritization Initiative | AI service prioritization | Book 17 (AI Identity Governance) | Cited as current |
| [FedRAMP Consolidated Rules for 2026 (Certification Classes A-D)](source-register.md#fedramp-2026){#fedramp-2026} | 2026 rule set | All except Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 07 (PKI & Certificates) | Cited as current |
| FedRAMP Marketplace | Marketplace product data | All except Book 00 (Orientation & Program); Book 04 (Access & Privilege); Book 05 (Devices & Endpoints); Book 13 (Governance, Drift & Evidence) | Cited as current |
| [FedRAMP Notice NTC-0004](source-register.md#ntc-0004){#ntc-0004} | Outcome of RFC-0020 authorization designations | Book 00 (Orientation & Program); Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| FedRAMP Notice NTC-0013 | Outcome of Rev5 baseline RFCs 0026-0030 | Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone) | Cited as current |
| FedRAMP Notice NTC-0014 | VDR/VER alignment with BOD 26-04 | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| FedRAMP P-ATO / JAB path | Provisional authorization | Book 01 (The Transformation Arc); Book 06 (Data Platform: SQL Server Identity); Book 09 (Network & Transport) | Pre-2026 term; FedRAMP's 2026 rules replace authorization designations with certification classes |
| FedRAMP Ready designation | Readiness designation | Book 01 (The Transformation Arc); Book 14 (Federal Compliance & Authorization) | Legacy from July 28, 2026 |
| FedRAMP Rev5 baselines (baseline workbook) | Rev. 5 Low/Moderate/High baselines | All except Book 00 (Orientation & Program); Book 07 (PKI & Certificates); Book 16 (People: Training & Education) | Workbook marked legacy June 23, 2026; replaced by Consolidated Rules |
| FedRAMP RFC-0020 | Authorization designations | Book 00 (Orientation & Program); Book 10 (Cloud Boundary & Landing Zone); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| FedRAMP RFC-0026 to RFC-0030 | Rev5 baseline RFCs | Book 10 (Cloud Boundary & Landing Zone) | Cited as current |
| FedRAMP rules: Agency Use (AGU) | Agency obligations | Book 01 (The Transformation Arc); Book 10 (Cloud Boundary & Landing Zone); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| FedRAMP rules: Certification Data Sharing (CDS) | CDS | Book 10 (Cloud Boundary & Landing Zone) | Cited as current |
| FedRAMP rules: Collaborative Continuous Monitoring (CCM) | CCM; Ongoing Certification Reports | Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
| FedRAMP rules: Cryptographic Module Use (CMU) | CMU | Book 10 (Cloud Boundary & Landing Zone) | Cited as current |
| FedRAMP rules: Minimum Assessment Scope (MAS) | Scope rules | Book 10 (Cloud Boundary & Landing Zone) | Cited as current |
| FedRAMP rules: SDR, FRC, IVV and CPO families | Security Decision Record, FedRAMP Certification, Independent Verification and Validation, Certification Package Overview | Book 13 (Governance, Drift & Evidence); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| FedRAMP rules: Significant Change Notification (SCN) | SCN | Book 10 (Cloud Boundary & Landing Zone); Book 13 (Governance, Drift & Evidence) | Cited as current |
| FedRAMP rules: Vulnerability Detection and Response (VDR) | VDR | Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| FedRAMP rules: Vulnerability Evaluation and Reporting (VER) | VER | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |

:::

::: {.callout-note collapse="true"}
## National Archives (NARA) (4)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| GRS 3.1 | General Technology Management Records | Book 00 (Orientation & Program); Book 08 (DNS, DHCP & IPAM); Book 13 (Governance, Drift & Evidence) | Cited as current |
| GRS 3.2 | Information Systems Security Records | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 03 (HR-Driven Identity); Book 04 (Access & Privilege); Book 07 (PKI & Certificates); Book 08 (DNS, DHCP & IPAM); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence) | Items 035-036 under revision (Transmittal 38) after M-21-31's rescission |
| NARA CUI Registry | CUI categories | Book 12 (Security Operations & Telemetry) | Cited as current |
| NARA General Records Schedules (generic) | GRS, unspecified | Book 00 (Orientation & Program); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |

:::

::: {.callout-note collapse="true"}
## Other federal sources (25)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| CMMC | Cybersecurity Maturity Model Certification | Book 02 (Identity & Directory); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| CUI program (generic) | Controlled Unclassified Information | Book 00 (Orientation & Program); Book 12 (Security Operations & Telemetry) | Cited as current |
| DISA STIGs | Defense security technical implementation guides | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 15 (Compliance Automation & Day-2 Operations) | High only: an optional reference since October 29, 2026, not the civilian baseline |
| DoD 8140 / DoDM 8140.03 | DoD cyber workforce qualification | Book 16 (People: Training & Education) | In force; it replaced DoD 8570.01-M |
| DoD 8570.01-M | DoD IA workforce (legacy) | Book 16 (People: Training & Education) | Replaced by DoD 8140 |
| DoD Cloud Computing SRG (IL4/IL5) | DoD cloud security requirements guide | Book 08 (DNS, DHCP & IPAM) | High only: a tier comparison, not the Moderate civilian target |
| DoD Zero Trust Strategy (2022) | DoD ZT capability target | Book 04 (Access & Privilege); Book 09 (Network & Transport) | Cited as current |
| FBI CJIS Security Policy | Criminal Justice Information Services | Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| FCC 19-76 | Report and Order implementing Kari's Law and RAY BAUM'S Act | Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| Federal Enterprise Architecture Framework | FEAF | Book 00 (Orientation & Program) | Historical: survives on an archived 2013 page; A-130 §5.a(2) is the live requirement |
| Federal PKI Common Policy (Federal Common Policy CA G2) | X.509 Certificate Policy for the Federal PKI Common Policy Framework | Book 01 (The Transformation Arc); Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 07 (PKI & Certificates) | Cited as current |
| GSA EIS, Networx and Multiple Award Schedule | GSA acquisition vehicles | Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 17 (AI Identity Governance) | Cited as current |
| GSA FICAM Identity Lifecycle Management Playbook and FICAM Architecture | FICAM guidance (stated as not official policy) | Book 03 (HR-Driven Identity); Book 07 (PKI & Certificates) | Cited as current |
| IRS Publication 1075 | Tax information security | Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| Login.gov | GSA shared sign-in | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 16 (People: Training & Education) | Cited as current |
| MTIPS | Managed Trusted Internet Protocol Services | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Cited as current |
| NSA CNSA 2.0 | Commercial National Security Algorithm Suite | Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Cited as current |
| OMB/OPM Federal HR 2.0 / Core HCM memo (Dec 2025) and HR QSMO | Government-wide HR platform direction | Book 01 (The Transformation Arc); Book 03 (HR-Driven Identity) | Cited as current |
| OPM EHRI and eOPF | Government-wide HR data | Book 03 (HR-Driven Identity); Book 16 (People: Training & Education) | Cited as current |
| OPM Guide to Data Standards (EHRI Data Standards) | HR data standards | Book 03 (HR-Driven Identity); Book 16 (People: Training & Education) | Cited as current |
| OPM Guide to Processing Personnel Actions | Nature-of-action codes; SF-50 | Book 03 (HR-Driven Identity) | Cited as current |
| OPM Interpretive Guidance for Cybersecurity Positions (2018) | Position coding guidance | Book 16 (People: Training & Education) | Cited as current |
| OPM/GOVT-1 SORN | General Personnel Records | Book 03 (HR-Driven Identity) | Cited as current |
| SF-50 Notification of Personnel Action | OPM standard form | Book 03 (HR-Driven Identity) | Cited as current |
| Technology Modernization Fund guidance (2026 Call for Proposals; fit and repayment) | TMF | Book 00 (Orientation & Program); Book 09 (Network & Transport) | Cited as current |

:::

## The authority register

The tables above say which sources the books cite and how deeply each book treats a framework. An ISSO, an assessor or an authorizing official needs a different view of the core authorities: does it apply, is it binding, who owns it, where the workbook treats it, what evidence it leaves, and what's still owed after the technology and the workbook have done their part. This register gives that view for 24 core authorities. Two companion pages go deeper: the [RMF Map](rmf-map.md) walks each SP 800-37 task through the books, and the [M-19-17 and FICAM Crosswalk](m-19-17-ficam-crosswalk.md) does the same for identity.

How to read it:

- **Mandatory status** is *required* (binding on every agency the instrument covers), *conditional* (binding when a stated condition holds, such as running a system of records or using a cloud service), or *guidance* (design guidance the agency may adopt). NIST guidelines sit between: OMB Circular A-130 says their "concepts and principles ... must be applied" but that they "generally allow agencies latitude in their application."[^reg-a130] They're marked required where OMB or a statute names them.
- **Responsible role** uses the roles of [Book 14, Chapter 10](../books/b14-compliance/10-who-owns-compliance.md): CIO, CISO, SAOP (senior agency official for privacy), system owner, AO (authorizing official), ISSO, records officer and acquisition official. The first role named is accountable.
- **Residual obligation** is what neither the technology nor the workbook satisfies: the decision, filing or agency action that stays with a person.
- **Verified** is the date the primary source was last read for this register. Rows read on November 2, 2026 carry a footnote to the source; the others give the date of the earlier check on this page.
- **Change trigger** is the event that should send someone back to the row.

FISMA has no levels. Impact levels come from FIPS 199 categorization and FIPS 200's high-water mark; the [RMF Map](rmf-map.md) explains.

::: {.landscape}

| Authority | Applicability | Mandatory status | Responsible role | Workbook location | Evidence | Residual obligation | Verified | Change trigger |
|---|---|---|---|---|---|---|---|---|
| FISMA 2014 (44 U.S.C. §§3551–3558) | Every federal information system, including those run by contractors | Required | CIO; CISO | [Book 14, Ch 10](../books/b14-compliance/10-who-owns-compliance.md) (roles) and [Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-cadence) (annual testing floor); [RMF Map](rmf-map.md) | Continuous monitoring outputs; the annual independent re-assessment | Annual FISMA metrics reporting and the inspector general's independent evaluation; the agency head's accountability | Nov 2, 2026[^reg-fisma] | Amendment of 44 U.S.C. ch. 35 subch. II; new OMB or CISA annual FISMA reporting guidance |
| Privacy Act of 1974 (5 U.S.C. §552a) | Systems of records: records retrieved by a personal identifier, including the HR feed and directory attributes | Conditional | SAOP; system owner | [Book 14, Ch 08](../books/b14-compliance/08-privacy-pii-processing.md); [Book 03](../books/b03-hr-identity/index.md) | SORN references in the PII data-flow register | Publishing and revising SORNs in the Federal Register, Privacy Act statements, matching agreements: legal acts no tool performs | Nov 2, 2026[^reg-privacy] | A new or changed system of records or routine use; a new matching program; a revision of Circular A-108 |
| Federal Records Act (44 U.S.C. chapters 31 and 33) | All federal records, including logs, audit trails and the program's own evidence packages | Required | Records officer; system owner | [Book 00, Ch 10](../books/b00-orientation/10-retirement-steady-state-and-success.md) (records before hardware); [Book 13, Ch 09](../books/b13-governance/09-who-governs.md) (keeping the record as a record); [Book 12, Ch 12](../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md) (retention tiers) | Retention settings; disposition records under GRS 3.1 and 3.2 | Scheduling unscheduled records with NARA, disposition authority, transfer; the evidence packages themselves need a schedule | Nov 2, 2026 (§3303a)[^reg-records]; §3101 Oct 23, 2026 | A new GRS transmittal (GRS 3.2 items 035–036 are under revision); a new NARA or OMB records memo; a system retirement |
| Section 508 (29 U.S.C. §794d) | ICT the agency develops, procures, maintains or uses, internal systems included | Required | CIO; acquisition official | [Book 04, Ch 09](../books/b04-access/09-access-governance.md); [Book 15](../books/b15-day2-operations/index.md) Chapters 03, 06 and 12; [Book 16](../books/b16-people/index.md) | Vendor Accessibility Conformance Reports at intake; accessibility check results | Conformance testing of each portal, form and document; a vendor's report is a claim, not a test | Nov 2, 2026[^reg-508] | A revision of the 508 Standards (36 CFR part 1194); an OMB memo replacing M-24-08 |
| HSPD-12 | Federal employees and contractors who need routine logical or physical access | Required | CIO; CISO | [Book 03, Ch 09](../books/b03-hr-identity/09-credentials-and-certificates.md); [Book 07](../books/b07-pki/index.md); [M-19-17 and FICAM Crosswalk](m-19-17-ficam-crosswalk.md) | Certificate binding and revocation evidence in the leaver sequence | PIV issuance, vetting and adjudication; physical access control | Nov 2, 2026[^reg-hspd12] | New OPM credentialing standards; a revision of FIPS 201 |
| OMB Circular A-130 (2016) | All federal information resources | Required | CIO; SAOP; AO | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md) (categorization), [Ch 05](../books/b14-compliance/05-program-management-controls.md), [Ch 10](../books/b14-compliance/10-who-owns-compliance.md), [Ch 11](../books/b14-compliance/11-the-authorization-package.md#ongoing-authorization); [Book 18, Ch 06](../books/b18-application-modernization/06-compliance-by-design.md) | Program plans, POA&M process, enterprise architecture artifacts | The information security and privacy program plans, the agency's IRM strategic plan, FISMA reporting | Nov 2, 2026[^reg-a130] | Revision or rescission (A-130 still isn't on OMB's circulars page; the 2016 PDF resolves) |
| OMB M-19-17 | The agency's ICAM program: workforce, devices, non-person entities and public services | Required | CIO; CISO; SAOP | [M-19-17 and FICAM Crosswalk](m-19-17-ficam-crosswalk.md); [Book 03, Ch 07](../books/b03-hr-identity/07-who-owns-workforce-identity.md) | Governance charter; lifecycle and NPI kit runs | Designating the ICAM governance structure; a single ICAM policy and roadmap; cross-agency federation agreements; PIV signing | Nov 2, 2026[^reg-m1917] | A successor ICAM memorandum; a FICAM Architecture revision; FIPS 201 or SP 800-63 revisions |
| OMB M-22-09 | Agencies' enterprise identity, devices, networks, applications and data | Required (FY2024 deadlines have passed; not rescinded) | CIO; CISO | [Book 11](../books/b11-zero-trust/index.md); [Book 02, Ch 10](../books/b02-identity/10-migrating-and-governing.md) (phishing-resistant MFA); [Book 04](../books/b04-access/index.md) | Conditional Access and authentication methods exports; secure configuration baseline runs | Agency reporting on the strategy; the agency's own zero trust plan | Nov 2, 2026[^reg-m2209] | Rescission or a successor zero trust memorandum |
| CISA BOD 25-01 | Production cloud tenants in FCEB systems that have a finalized SCuBA baseline | Conditional | CISO; system owner; AO (deviations) | [Book 11, Ch 04](../books/b11-zero-trust/04-scuba-and-bod-25-01.md); [Book 11, Ch 09](../books/b11-zero-trust/09-running-the-assessment.md) | ScubaGear results reported to CISA; deviation records | Annual tenant inventory to CISA; explaining deviations in reported output; adopting new mandatory policies on CISA's timelines | Nov 2, 2026[^reg-bod2501] | A change to CISA's Required Configurations; a new SCuBA baseline; revocation |
| FedRAMP (Authorization Act; M-24-15; Consolidated Rules for 2026) | Cloud services the agency uses | Conditional | AO; acquisition official; ISSO | [Book 10](../books/b10-cloud-boundary/index.md); [Book 13, Ch 11](../books/b13-governance/11-reciprocity-and-one-authorization.md); [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#what-fedramps-2026-rules-expect) | Review records for each Ongoing Certification Report; the notice to FedRAMP with the authorization letter | The agency's own authorization of use: a provider's certification is evidence, not the agency's decision | Rules Oct 21–29, 2026 (books); fedramp.gov rechecked Nov 2, 2026[^reg-fedramp] | New RFCs and notices (RFC-0035 and RFC-0036 in October 2026); mandatory adoption on January 1, 2027; the Rev5 cut-off on June 11, 2027 |
| NIST SP 800-37 Rev. 2 | Every federal system and set of common controls | Required (A-130, Appendix I §5.c) | AO; system owner | [RMF Map](rmf-map.md); [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md) | The authorization package; the decision | The authorization decision and risk acceptance, which can't be delegated; P-6, SP 800-60 mapping and SAP/SAR templates aren't covered ([RMF Map](rmf-map.md#not-covered-in-one-list)) | Nov 2, 2026[^reg-80037] | A Rev. 3 draft or final |
| NIST SP 800-53 Rev. 5 | Every federal system | Required (FIPS 200) | System owner; CISO | Every book's requirements mapping; [Book 14, Appendix A](../books/b14-compliance/appendix-a-control-crosswalk.md) | Implementation statements; control evidence | Organization-defined parameter values for the full baseline; the agency's tailoring decisions | Nov 2, 2026 (release 5.2.0)[^reg-80053] | A new release or Rev. 6 |
| NIST SP 800-53A Rev. 5 | Assessment of every control | Required (A-130, Appendix I §5.a and §5.c) | ISSO; AO | [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#the-assessment-plan-and-the-test-plans); [Book 13, Ch 07](../books/b13-governance/07-evidence-over-attestation.md) | Validation kit runs as self-assessment evidence | The independent assessment itself (CA-2(1)); the SAP and SAR | Nov 2, 2026 (release 5.2.0)[^reg-80053a] | A new release |
| NIST SP 800-60 | Mapping information types to security categories | Required (A-130, Appendix I §4.a) | System owner; AO | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md) (cited only) | None | **Not covered**: no system's information types are mapped | Nov 2, 2026 (Vol. 1 Rev. 1, 2008)[^reg-80060] | A Rev. 2 |
| NIST SP 800-63-4 | Digital identity: proofing, authentication and federation | Required (M-19-17 §II) | CIO; CISO | [Book 03, Ch 09](../books/b03-hr-identity/09-credentials-and-certificates.md); [Book 15, Ch 01](../books/b15-day2-operations/01-the-help-desk-decides.md) and [Ch 03](../books/b15-day2-operations/03-intake-triage-and-routing.md) | Help desk verification records; authentication methods policy | A digital identity risk assessment per system; e-authentication reassessment | Nov 2, 2026[^reg-80063] | A revision or new volume |
| NIST SP 800-137 | Continuous monitoring | Required (A-130, Appendix I §5.c) | CISO; ISSO | [Book 12, Ch 12](../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md); [Book 14, Ch 11](../books/b14-compliance/11-the-authorization-package.md#continuous-monitoring); [Book 13, Ch 12](../books/b13-governance/12-governance-at-scale.md) | Drift pipeline packages; posture reports | Manual assessment of controls automation can't monitor; the agency's ISCM strategy | Nov 2, 2026 (2011 final)[^reg-800137] | A revision |
| NIST SP 800-161 Rev. 1 | Supply chain risk management | Required (A-130, Appendix I §4.c(4): SCRM plans "as described in" SP 800-161) | Acquisition official; CISO | [Book 14, Ch 07](../books/b14-compliance/07-supply-chain-risk-management.md) | The supplier record | The agency's SCRM plan and FASCSA order compliance | Nov 2, 2026 (Update 1, Nov 2024)[^reg-800161] | A Rev. 2 or a new update |
| NIST SP 800-207 | Zero trust architecture | Guidance | CISO | [Book 11](../books/b11-zero-trust/index.md); [Book 09](../books/b09-network/index.md) | Architecture decisions | None binding; M-22-09 carries the requirements | Nov 2, 2026[^reg-800207] | A revision |
| FIPS 199 | Categorizing federal information and systems, other than national security systems | Required | System owner; AO | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md#fips-199-an-impact-level-per-security-objective); [RMF Map](rmf-map.md) | The categorization record (agency) | Categorizing each system; the workbook assumes moderate and doesn't categorize | Nov 2, 2026[^reg-fips199] | A revision |
| FIPS 200 | Minimum security requirements | Required | System owner; CISO | [Book 14, Ch 01](../books/b14-compliance/01-proof-not-a-promise.md#fips-200-the-high-water-mark) | Baseline selection | Tailoring decisions | Nov 2, 2026[^reg-fips200] | A revision |
| FIPS 201-3 | PIV for federal employees and contractors | Required (HSPD-12) | CIO; CISO | [Book 03, Ch 09](../books/b03-hr-identity/09-credentials-and-certificates.md); [Book 07](../books/b07-pki/index.md) | Certificate binding and revocation evidence | Card issuance and PIV infrastructure | Nov 2, 2026[^reg-fips201] | Errata or FIPS 201-4 |
| TIC 3.0 (M-19-26; CISA core guidance) | Agency network traffic and its security capabilities | Required (M-19-26); the core guidance is guidance | CIO; CISO | [Book 09](../books/b09-network/index.md), especially [Ch 03](../books/b09-network/03-what-tic-3-requires.md) | Policy enforcement point configuration; continuous validation | Agency TIC use-case decisions and reporting | Nov 2, 2026[^reg-tic] | New core guidance versions; a successor to M-19-26 |
| CISA Zero Trust Maturity Model 2.0 | Agencies' zero trust planning | Guidance | CISO | [Book 11](../books/b11-zero-trust/index.md), especially [Ch 10](../books/b11-zero-trust/10-evidence-not-verdicts.md) | Pillar maturity evidence | None binding. CISA's page now carries an archived-content banner | Nov 2, 2026[^reg-ztmm] | A new version, or retirement of the page |
| CISA KEV catalog (BOD 26-04) | Agency assets in FCEB systems | Conditional | CISO; system owner | [Book 12, Ch 06](../books/b12-security-operations/06-vulnerability-management.md); [Book 14](../books/b14-compliance/index.md) | Remediation within the directive's timelines; CDM reporting | Asset tagging, quarterly attestation of exposed addresses, forensic triage where required | Nov 2, 2026[^reg-kev] | A catalog addition (it starts a clock); a new or revised BOD |

:::

[^reg-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource* (2016 revision), Appendix I §4.a (categorization under FIPS 199 and SP 800-60), §4.c(4) (supply chain risk management plans), §5.a (NIST standards and guidelines) and §5.c (the Risk Management Framework, SP 800-53A and SP 800-137), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf>; OMB Circulars page, <https://www.whitehouse.gov/omb/information-resources/guidance/circulars/> (both accessed Nov 2, 2026).
[^reg-fisma]: 44 U.S.C. §3554 (2023 edition), (a)(1), (a)(3) and (b), <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap35-subchapII-sec3554.htm> (accessed Nov 2, 2026).
[^reg-privacy]: 5 U.S.C. §552a (2023 edition), (e)(4) and (e)(10), <https://www.govinfo.gov/content/pkg/USCODE-2023-title5/html/USCODE-2023-title5-partI-chap5-subchapII-sec552a.htm> (accessed Nov 2, 2026).
[^reg-records]: 44 U.S.C. §3303a (2023 edition), (b) and (d) (General Records Schedules mandatory), <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap33-sec3303a.htm> (accessed Nov 2, 2026).
[^reg-508]: Section508.gov, "Laws and policies," <https://www.section508.gov/manage/laws-and-policies/> (accessed Nov 2, 2026).
[^reg-hspd12]: Homeland Security Presidential Directive 12, *Policy for a Common Identification Standard for Federal Employees and Contractors*, August 27, 2004, <https://www.dhs.gov/homeland-security-presidential-directive-12> (accessed Nov 2, 2026).
[^reg-m1917]: Office of Management and Budget, M-19-17, *Enabling Mission Delivery through Improved Identity, Credential, and Access Management*, May 21, 2019, <https://www.whitehouse.gov/wp-content/uploads/2019/05/M-19-17.pdf> (accessed Nov 2, 2026).
[^reg-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, §A (Identity), <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Nov 2, 2026).
[^reg-bod2501]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024 (scope and required actions), <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services> (accessed Nov 2, 2026).
[^reg-fedramp]: FedRAMP, <https://www.fedramp.gov/> (changelog: RFC-0035, October 14, 2026; RFC-0036, October 15, 2026), and *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/> (both accessed Nov 2, 2026). The rule citations in Books 10, 13 and 14 were read October 21–29, 2026.
[^reg-80037]: National Institute of Standards and Technology, SP 800-37 Rev. 2, December 2018, <https://csrc.nist.gov/pubs/sp/800/37/r2/final> (accessed Nov 2, 2026).
[^reg-80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5 (release 5.2.0, August 27, 2025), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Nov 2, 2026).
[^reg-80053a]: National Institute of Standards and Technology, SP 800-53A Rev. 5, January 2022 (release 5.2.0, August 27, 2025), <https://csrc.nist.gov/pubs/sp/800/53/a/r5/final> (accessed Nov 2, 2026).
[^reg-80060]: National Institute of Standards and Technology, SP 800-60 Vol. 1 Rev. 1, August 2008, <https://csrc.nist.gov/pubs/sp/800/60/v1/r1/final> (accessed Nov 2, 2026).
[^reg-80063]: National Institute of Standards and Technology, SP 800-63-4, *Digital Identity Guidelines*, July 2025 (with SP 800-63A-4, 63B-4 and 63C-4), <https://csrc.nist.gov/pubs/sp/800/63/4/final> (accessed Nov 2, 2026).
[^reg-800137]: National Institute of Standards and Technology, SP 800-137, *Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations*, September 2011, <https://csrc.nist.gov/pubs/sp/800/137/final> (accessed Nov 2, 2026).
[^reg-800161]: National Institute of Standards and Technology, SP 800-161 Rev. 1 (Update 1), *Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations*, November 1, 2024, <https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final> (accessed Nov 2, 2026).
[^reg-800207]: National Institute of Standards and Technology, SP 800-207, *Zero Trust Architecture*, August 2020, <https://csrc.nist.gov/pubs/sp/800/207/final> (accessed Nov 2, 2026).
[^reg-fips199]: National Institute of Standards and Technology, FIPS 199, February 2004, <https://csrc.nist.gov/pubs/fips/199/final> (accessed Nov 2, 2026).
[^reg-fips200]: National Institute of Standards and Technology, FIPS 200, March 2006, <https://csrc.nist.gov/pubs/fips/200/final> (accessed Nov 2, 2026).
[^reg-fips201]: National Institute of Standards and Technology, FIPS 201-3, *Personal Identity Verification (PIV) of Federal Employees and Contractors*, January 2022, <https://csrc.nist.gov/pubs/fips/201-3/final> (accessed Nov 2, 2026).
[^reg-tic]: Cybersecurity and Infrastructure Security Agency, "Trusted Internet Connections," <https://www.cisa.gov/resources-tools/programs/trusted-internet-connections> (accessed Nov 2, 2026).
[^reg-ztmm]: Cybersecurity and Infrastructure Security Agency, "Zero Trust Maturity Model," Version 2.0 (page marked as archived content), <https://www.cisa.gov/zero-trust-maturity-model> (accessed Nov 2, 2026).
[^reg-kev]: Cybersecurity and Infrastructure Security Agency, "Known Exploited Vulnerabilities Catalog," <https://www.cisa.gov/known-exploited-vulnerabilities-catalog>, and Binding Operational Directive 26-04, *Prioritizing Security Updates Based on Risk*, June 10, 2026, <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk> (both accessed Nov 2, 2026).

## Tagging chapters by framework

Every chapter already carries the same front matter, including `audience`, `part` and `status`, and Research pages already carry `date-modified`. The proposal is to add two fields to chapters:

- A `frameworks:` list beside `audience`, so each chapter states the frameworks it implements, and the site's listing machinery can filter by them.
- A `date-modified` field, so a crosswalk's "as of" date can be traced per chapter.

The 0-to-3 depth would be derived rather than typed by hand: 3 where a requirements-mapping appendix row names the framework with an evidence cell, 2 or 1 from the chapter text. A script like the one that fills the books' metrics table could compute it, and this page could then be generated from the books instead of maintained separately.

## Status and review

**In review.** Each framework's status was checked at its primary source on October 23, 2026, and every score comes from reading the chapters. Some sources couldn't be reached: the cio.gov pages for Cloud Smart and FITARA (certificate and 404 errors), Federal Register document pages (bot protection, which wasn't bypassed; its API and govinfo were used instead), and the OMB PDF of M-23-07 (404). The additions of October 23 to November 5 were reread against their chapters on November 6, 2026. Cloud Smart, the FITARA page on cio.gov and the M-23-07 PDF stay unresolved: none is a row in the [Source Register](source-register.md), so there is no recorded address to recheck (FITARA's live source is M-26-10, which is). To move this page to **Proved**, a reviewer confirms the scores against the books. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

[^a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource* (2016 revision), §5.a(2), §5.d, §5.f and Appendix II, <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf>; OMB Circulars index, <https://www.whitehouse.gov/omb/information-resources/guidance/circulars/> (both accessed Oct 23, 2026).
[^m2610]: Office of Management and Budget, M-26-10, *Reinforcing Transparency, Accountability, and Oversight of Federal Technology*, March 31, 2026, §1 and Requirements, <https://www.whitehouse.gov/wp-content/uploads/2026/03/M-26-10-Reinforcing-Transparency-Accountability-and-Oversight-of-Federal-Technology.pdf> (accessed Oct 23, 2026).
[^cca]: 40 U.S.C. §11312, Capital planning and investment control (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title40/html/USCODE-2023-title40-subtitleIII-chap113-subchapII-sec11312.htm> (accessed Oct 23, 2026).
[^tmf]: Technology Modernization Fund, <https://tmf.cio.gov/>, agency and project fit <https://tmf.cio.gov/fit/>, process <https://tmf.cio.gov/process/>, and 2026 Call for Proposals <https://tmf.cio.gov/2026-call-for-proposals/> (accessed Oct 23, 2026).
[^idea]: 21st Century Integrated Digital Experience Act, Pub. L. 115-336, <https://www.govinfo.gov/content/pkg/PLAW-115publ336/html/PLAW-115publ336.htm>; OMB M-23-22, *Delivering a Digital-First Public Experience* (archived page), <https://bidenwhitehouse.archives.gov/omb/management/ofcio/delivering-a-digital-first-public-experience> (both accessed Oct 23, 2026).
[^m2618]: Office of Management and Budget, M-26-18, *Scaling Use of Login.gov to Deliver a Universal Sign-on for Public Services*, August 31, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/08/M-26-18-Scaling-Use-of-Login.gov-to-Deliver-a-Universal-Sign-on-for-Public-Services.pdf> (accessed Oct 23, 2026).
[^s508]: Section508.gov, Laws and policies, <https://www.section508.gov/manage/laws-and-policies/> (accessed Oct 23, 2026).
[^records]: 44 U.S.C. §3101 (2023 edition), <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap31-sec3101.htm>; National Archives, Records management policy, <https://www.archives.gov/records-mgmt/policy> (both accessed Oct 23, 2026).
[^scuba]: Cybersecurity and Infrastructure Security Agency, "Secure Cloud Business Applications (SCuBA) Project" (baselines for Microsoft 365 and Google Workspace; ScubaGear and ScubaGoggles assessment tools), <https://www.cisa.gov/resources-tools/services/secure-cloud-business-applications-scuba-project> (accessed Oct 29, 2026).
[^bod2501]: Cybersecurity and Infrastructure Security Agency, Binding Operational Directive 25-01, *Implementing Secure Practices for Cloud Services*, December 17, 2024 (scope; mandatory "shall" policies), <https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services>; and "BOD 25-01: Implementing Secure Practices for Cloud Services — Required Configurations" (Microsoft 365 and Google Workspace policies), <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (accessed Oct 29, 2026).
[^cm6]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CM-2 and CM-6 (statement and discussion), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; read from NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 29, 2026).
[^cis]: Center for Internet Security, "CIS Benchmarks" (prescriptive configuration recommendations for more than 25 vendor product families), <https://www.cisecurity.org/cis-benchmarks> (accessed Oct 29, 2026).
[^ncp]: National Institute of Standards and Technology, SP 800-70 Rev. 5, *National Checklist Program for IT Products: Guidelines for Checklist Users and Developers*, May 2026, <https://csrc.nist.gov/pubs/sp/800/70/r5/final>; and NIST, "National Checklist Program," <https://csrc.nist.gov/projects/national-checklist-program> (repository at <https://ncp.nist.gov/>) (accessed Oct 29, 2026).
[^also]: NIST SP 800-53 Rev. 5, <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; FedRAMP, <https://www.fedramp.gov/>, and 44 U.S.C. §3607, <https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap36-sec3607.htm>; OMB M-26-14, May 22, 2026, <https://www.whitehouse.gov/wp-content/uploads/2026/05/M-26-14-Ensuring-Effective-and-Efficient-Agency-Logging-and-Network-Visibility-to-Defend-Against-Evolving-Cyber-Threats.pdf>; CISA, Zero Trust Maturity Model, <https://www.cisa.gov/zero-trust-maturity-model>; NIST FIPS 201-3, <https://csrc.nist.gov/pubs/fips/201-3/final> (all accessed Oct 23, 2026).
[^pa-govt1]: Office of Personnel Management, OPM/GOVT-1, General Personnel Records, *Federal Register* 77 FR 73694 (December 11, 2012), <https://www.govinfo.gov/content/pkg/FR-2012-12-11/html/2012-29777.htm>, as modified by 88 FR 56058 (August 17, 2023), <https://www.govinfo.gov/content/pkg/FR-2023-08-17/html/2023-17651.htm>, and 91 FR 25937 (May 12, 2026), <https://www.govinfo.gov/content/pkg/FR-2026-05-12/html/2026-09339.htm>; General Services Administration, GSA/GOVT-7, HSPD-12 USAccess, 80 FR 64416 (October 23, 2015), <https://www.govinfo.gov/content/pkg/FR-2015-10-23/html/2015-26940.htm> (all accessed Nov 2, 2026).
[^pa-53b]: National Institute of Standards and Technology, SP 800-53B, *Control Baselines for Information Systems and Organizations*, abstract and the Release 5.2.0 note of August 27, 2025, <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final>; OSCAL Release 5.2.0 profiles `NIST_SP-800-53_rev5_MODERATE-baseline_profile.json` and `NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json`, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json> (accessed Nov 2, 2026).
[^s508-nov2]: U.S. Access Board, Revised 508 Standards, Appendix A to 36 CFR part 1194, E205.4, E207.2 and 702.10.1, <https://www.access-board.gov/ict/>; Section508.gov, "Applicability & Conformance Requirements," <https://www.section508.gov/develop/applicability-conformance/>, and "Laws and Policies," <https://www.section508.gov/manage/laws-and-policies/>; Office of Management and Budget, Memoranda, <https://www.whitehouse.gov/omb/information-resources/guidance/memoranda/> (all accessed Nov 2, 2026).
