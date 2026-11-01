---
title: "Federal Framework Crosswalk"
subtitle: "Which federal modernization frameworks the workbook's 19 books address, where, and how deeply, with each framework's status checked on October 23, 2026, and every federal source the books cite"
description: "Research under review: a crosswalk of the Federal Modernization Workbook's 19 books against federal modernization frameworks: each framework's current status, a book-by-framework coverage matrix scored 0 to 3, the gaps, and a proposal for tagging chapters by framework."
research-status: in review
research-type: reference
research-book: "Books 00–17"
date-modified: 2026-10-30
last-reviewed: 2026-10-23
aliases:
  - /docs/research/federal-framework-crosswalk.html
---

# Federal Framework Crosswalk {.unnumbered}

A federal modernization program answers to more than its security controls. Statute and OMB policy also govern how IT investments are chosen and funded, how enterprise architecture is kept, how digital services are delivered, and how privacy and records are handled. This page maps the workbook's 19 books against those frameworks, checks each one's current status at its primary source, and records where coverage is deep, thin or missing, so that the gaps can be closed deliberately.

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
| Section 508 | **In force**: 29 U.S.C. §794d, the revised 508 Standards, and OMB M-24-08^[l](#tn-l)^ | As cited |
| Privacy Act; E-Government Act §208 | **In force**: A-130 §5.f and Appendix II direct privacy impact assessments and the handling of personal information^[d](#tn-d)^ | As cited |
| Federal records (44 U.S.C. chapters 31 and 33) | **In force**: agency heads "shall make and preserve records containing adequate and proper documentation"; NARA lists M-23-07 as current OMB guidance^[m](#tn-m)^ | 44 U.S.C. §3101, M-23-07, NARA General Records Schedules |
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

| Framework | 00 Orientation & Program | 01 The Transformation Arc | 02 Identity & Directory | 03 HR-Driven Identity | 04 Access & Privilege | 05 Devices & Endpoints | 06 Data Platform: SQL Server Identity | 07 PKI & Certificates | 08 DNS, DHCP & IPAM | 09 Network & Transport | 10 Cloud Boundary & Landing Zone | 11 Zero Trust & Assessment | 12 Security Operations & Telemetry | 13 Governance, Drift & Evidence | 14 Federal Compliance & Authorization | 15 Compliance Automation & Day-2 Operations | 16 People: Training & Education | 17 AI Identity Governance | 18 Application Modernization |
|--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| NIST SP 800-53 Rev. 5 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| FedRAMP | 2 | 3 | 2 | 1 | 3 | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 1 |
| NIST RMF (SP 800-37 Rev. 2) | 2 | 2 | 2 | 2 | 0 | 1 | 3 | 2 | 2 | 2 | 3 | 2 | 3 | 3 | 3 | 2 | 2 | 3 | 1 |
| EO 14028 and M-22-09 | 2 | 3 | 3 | 2 | 2 | 0 | 3 | 1 | 3 | 3 | 0 | 3 | 0 | 0 | 2 | 1 | 1 | 0 | 0 |
| CISA ZTMM 2.0 | 1 | 3 | 1 | 1 | 1 | 0 | 3 | 0 | 3 | 3 | 0 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| HSPD-12 and FIPS 201 | 0 | 3 | 3 | 3 | 1 | 1 | 2 | 3 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 1 | 2 | 0 | 0 |
| OMB M-26-14 (logging) | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 3 | 3 | 0 | 3 | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| FISMA 2014 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 2 | 3 | 0 |
| OMB Circular A-130 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 3 | 0 | 2 | 3 | 3 |
| Privacy Act and E-Gov §208 PIAs | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 3 | 0 | 0 | 3 | 2 |
| Federal records | 3 | 2 | 0 | 2 | 0 | 0 | 0 | 2 | 2 | 0 | 2 | 0 | 3 | 2 | 2 | 1 | 2 | 0 | 1 |
| M-26-05 (was M-22-18) | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 0 | 0 | 0 | 2 |
| Evidence Act (was the Federal Data Strategy) | 0 | 3 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 2 |
| NIST CSF 2.0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 1 | 0 | 1 | 0 | 0 |
| Section 508 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 3 | 0 | 1 |
| Enterprise architecture (A-130 §5.a(2)) | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 0 | 0 | 0 | 3 |
| Clinger-Cohen, CPIC and A-11 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 2 |
| FITARA (M-26-10) | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 2 |
| Cloud Smart | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Technology Modernization Fund | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| 21st Century IDEA and M-23-22 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 |
| TOGAF Standard, 10th Edition | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| Zachman Framework 3.0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |

Notes: Book 18 was added on October 28, 2026; its scores and the TOGAF and Zachman rows come from its chapters as published that day, and no other book cites either framework. Book 14's enterprise architecture score rests on A-130 §5.a(2) and control PM-7, with architecture artifacts and review gates as the evidence; no book names FEAF. Book 01's Cloud Smart score is a mention of its 2010 predecessor, Cloud First, as history. Book 12 relies on M-22-09 through other books rather than citing it directly.

:::

## What the matrix shows

The security, identity and authorization frameworks are covered deeply, usually with evidence: SP 800-53 is mapped to evidence in every book, FedRAMP in 13, and the zero-trust mandates in 7. That's by design: the workbook is a technical modernization program, and its books end in controls, gates and evidence an assessor can read.

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

## Every federal source the books cite

The status table above covers the frameworks a modernization program is usually measured against. The books cite far more. A sweep of all 18 books on October 23, 2026 found **229 distinct federal instruments**: laws, regulations, executive orders, OMB memoranda and circulars, CISA directives and programs, NIST publications, FedRAMP rules, NARA schedules and other federal sources. They are listed below by category, with the books that cite each and its status as the books state it; each book checked its own citations against the primary source on the date it was built. Vendor documents, IETF RFCs and GAO reports are not listed.

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
| Privacy Act of 1974 (5 U.S.C. §552a; Pub. L. 93-579) | Privacy Act | Book 03 (HR-Driven Identity); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| Section 508 of the Rehabilitation Act (29 U.S.C. §794d) | Accessibility of federal ICT | Book 00 (Orientation & Program); Book 04 (Access & Privilege); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| Social Security Number Fraud Prevention Act of 2017 (Pub. L. 115-59) | Limits SSNs on mailed documents | Book 14 (Federal Compliance & Authorization) | Cited as current |

:::

::: {.callout-note collapse="true"}
## Regulations (9)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| 32 CFR Part 2002 | Controlled Unclassified Information | Book 12 (Security Operations & Telemetry) | Cited as current |
| 36 CFR Part 1194 | Section 508 ICT Standards | Book 04 (Access & Privilege); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
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
| HSPD-12 | Common identification standard for federal employees and contractors | Book 03 (HR-Driven Identity) | Cited as current |
| NITTF Insider Threat Minimum Standards | National insider threat policy minimum standards | Book 14 (Federal Compliance & Authorization) | Cited as current |
| White House AI Action Plan (July 2025) | America's AI Action Plan; NIST AI RMF revision is tied to it | Book 17 (AI Identity Governance) | Cited as current |

:::

::: {.callout-note collapse="true"}
## OMB memoranda (35)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| 25-Point Implementation Plan to Reform Federal IT Management (2010), incl. 'Cloud First' | OMB IT reform plan | Book 01 (The Transformation Arc) | Cited as history |
| M-03-22 | Privacy provisions of the E-Government Act (PIAs, web privacy policies) | Book 03 (HR-Driven Identity); Book 14 (Federal Compliance & Authorization) | Tracking rules (§III(D)(2)(v)) rescinded by M-10-22; rest cited as in force |
| M-08-05 | Implementation of Trusted Internet Connections | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-08-16 | TIC guidance | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-08-23 | Securing the federal government's DNS infrastructure (DNSSEC) | Book 08 (DNS, DHCP & IPAM) | Cited as current |
| M-08-27 | TIC compliance guidance | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-09-32 | Update on the TIC initiative | Book 09 (Network & Transport) | Rescinded by M-19-26 |
| M-10-22 | Online use of web measurement and customization technologies | Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-17-12 | Preparing for and responding to a breach of PII | Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-19-16 | Centralized mission support capabilities (QSMOs) | Book 03 (HR-Driven Identity) | Cited as current |
| M-19-17 | Improved identity, credential and access management | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 13 (Governance, Drift & Evidence); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| M-19-18 (Federal Data Strategy) | Federal Data Strategy: a framework for consistency | Book 01 (The Transformation Arc); Book 03 (HR-Driven Identity) | Memo not rescinded; the strategy's website is being retired |
| M-19-23 | Phase 1 implementation of the Evidence Act | Book 03 (HR-Driven Identity) | Cited as current |
| M-19-26 | Update to the TIC initiative (TIC 3.0) | Book 03 (HR-Driven Identity); Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Operative; no rescinding instrument found |
| M-21-07 | Completing the transition to IPv6 | Book 08 (DNS, DHCP & IPAM); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-21-31 | Event logging (EL0-EL3) | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Rescinded by M-26-14 (May 22, 2026) |
| M-22-01 | Improving detection through endpoint detection and response | Book 11 (Zero Trust & Assessment) | Cited as current |
| M-22-09 | Federal Zero Trust strategy | All except Book 05 (Devices & Endpoints); Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 17 (AI Identity Governance) | Not rescinded; FY2024 deadlines passed; logging action read through M-26-14 |
| M-22-18 | Secure software supply chain (attestation) | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Rescinded by M-26-05 (Jan 23, 2026) |
| M-23-07 | Update to transition to electronic records (with NARA) | Book 00 (Orientation & Program) | Cited as current |
| M-23-16 | Update to M-22-18 | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Rescinded by M-26-05 (Jan 23, 2026) |
| M-23-22 | Delivering a digital-first public experience | Book 00 (Orientation & Program) | Cited as current |
| M-24-08 | Digital accessibility and Section 508 management | Book 04 (Access & Privilege); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| M-24-10 | Governance and risk management for agency use of AI | Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Replaced by M-25-21 (Apr 3, 2025) |
| M-24-15 | Modernizing FedRAMP | Book 10 (Cloud Boundary & Landing Zone); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | In force; rescinded and replaced the 2011 FedRAMP memorandum |
| M-24-18 | Responsible acquisition of AI | Book 17 (AI Identity Governance) | Rescinded by M-25-22 (Apr 3, 2025) |
| M-25-21 | Federal use of AI: innovation, governance, public trust | Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance); Book 18 (Application Modernization) | Cited as current; see [Governing and Buying AI Under M-25-21 and M-25-22](../books/explainers/omb-ai-memos-m-25-21-m-25-22.md) |
| M-25-22 | Efficient acquisition of AI | Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance); Book 18 (Application Modernization) | Cited as current; see [Governing and Buying AI Under M-25-21 and M-25-22](../books/explainers/omb-ai-memos-m-25-21-m-25-22.md) |
| M-26-04 | Unbiased AI principles (LLM procurement) | Book 17 (AI Identity Governance) | Cited as current |
| M-26-05 | Risk-based approach to software and hardware security | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-26-10 | Transparency, accountability and oversight of federal technology (FITARA) | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization); Book 17 (AI Identity Governance) | In force; monthly contract reporting sunsets after the October 2026 report |
| M-26-14 | Agency logging and network visibility | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-26-15 | Migration to post-quantum cryptography | Book 07 (PKI & Certificates); Book 09 (Network & Transport); Book 14 (Federal Compliance & Authorization) | Cited as current |
| M-26-18 | Login.gov as the universal sign-on for public services | Book 00 (Orientation & Program) | Cited as current |
| OMB FedRAMP memorandum of Dec 8, 2011 | Original FedRAMP policy memorandum | Book 13 (Governance, Drift & Evidence) | Rescinded and replaced by M-24-15 |

:::

::: {.callout-note collapse="true"}
## OMB circulars (3)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| Circular A-108 | Privacy Act review, reporting and publication (SORNs, matching notices) | Book 03 (HR-Driven Identity); Book 14 (Federal Compliance & Authorization) | Cited as current |
| Circular A-11 (2025), incl. §51, §55 and the Capital Programming Guide v3.0 | Preparation, submission and execution of the budget | Book 00 (Orientation & Program); Book 09 (Network & Transport) | 2025 edition has no Exhibit 300 or Section 300 |
| Circular A-130 (2016) | Managing information as a strategic resource | Book 00 (Orientation & Program); Book 03 (HR-Driven Identity); Book 10 (Cloud Boundary & Landing Zone); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education); Book 17 (AI Identity Governance) | Cited as current |

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
| BOD 25-01 (incl. Required Configurations) | Secure practices for cloud services | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 04 (Access & Privilege); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Cited as current |
| BOD 26-02 | End-of-support edge devices | Book 00 (Orientation & Program); Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| BOD 26-04 | Prioritizing security updates based on risk | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education); Book 17 (AI Identity Governance) | Cited as current |
| CISA Cloud Interface Reference Architecture (NCPS/CLAW) | Cloud interface reference architecture | Book 09 (Network & Transport); Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA Comprehensive Log Aggregation Warehouse (CLAW) | CISA log ingestion | Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA Cyber Hygiene scanning | Vulnerability scanning service | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| CISA Encrypted DNS Implementation Guidance | Encrypted DNS under M-22-09 | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport) | Cited as current |
| CISA Federal Incident Notification Guidelines (2017) | Federal incident reporting | Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| CISA Logging Reference Architecture (with M-26-14 minimum logging baseline and maturity model) | Logging reference architecture | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization) | Cited as current |
| CISA Microsoft Expanded Cloud Logs Implementation Playbook | Expanded cloud logs | Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA Protective DNS | Protective DNS resolver (required for all egress resolution) | Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA SASE guidance (June 2026) | SASE guidance for TIC | Book 01 (The Transformation Arc); Book 09 (Network & Transport) | Cited as current |
| CISA SBOM minimum elements (2025 draft) and HBOM framework | Bill-of-materials guidance | Book 14 (Federal Compliance & Authorization) | Cited as current |
| CISA SCuBA Secure Configuration Baselines (M365, Entra ID) and ScubaGear | Secure Cloud Business Applications: baselines for Microsoft 365 and Google Workspace only[^scuba] | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 04 (Access & Privilege); Book 11 (Zero Trust & Assessment); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Cited as current |
| CISA Vulnrichment / SSVC | Exploitation and impact metadata on CVE records | Book 12 (Security Operations & Telemetry) | Cited as current |
| CISA Zero Trust Maturity Model v2.0 | ZTMM | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 04 (Access & Privilege); Book 06 (Data Platform: SQL Server Identity); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 13 (Governance, Drift & Evidence) | Cited as current |
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
## NIST (52)

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
| NIST OSCAL | Open Security Controls Assessment Language | All 18 books | Cited as current |
| SP 1800-35 | Implementing a Zero Trust Architecture | Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment) | Cited as current |
| SP 800-120 | EAP methods for wireless authentication | Book 09 (Network & Transport) | Withdrawn Oct 19, 2018 |
| SP 800-128 | Security-focused configuration management | Book 13 (Governance, Drift & Evidence); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| SP 800-137 | Information security continuous monitoring | Book 00 (Orientation & Program); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| SP 800-153 | Securing WLANs | Book 09 (Network & Transport) | Cited as current |
| SP 800-157 | Derived PIV credentials (2014, current final) | Book 03 (HR-Driven Identity) | Cited as current |
| SP 800-157 Rev. 1 (final public draft) | Derived PIV credentials (draft) | Book 03 (HR-Driven Identity) | Draft only (Nov 2024) |
| SP 800-16 | IT security training requirements (1998) | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Withdrawn; superseded by SP 800-50 Rev. 1 (Sept 2024) |
| SP 800-161 Rev. 1 | Cybersecurity supply chain risk management | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-171 | CUI in nonfederal systems | Book 12 (Security Operations & Telemetry); Book 15 (Compliance Automation & Day-2 Operations) | Cited as current |
| SP 800-181 Rev. 1 (NICE Framework) | Workforce Framework for Cybersecurity | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Supersedes SP 800-181 (2017) |
| SP 800-190 | Application container security | Book 12 (Security Operations & Telemetry) | Cited as current |
| SP 800-207 | Zero Trust Architecture | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 04 (Access & Privilege); Book 06 (Data Platform: SQL Server Identity); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport); Book 11 (Zero Trust & Assessment); Book 13 (Governance, Drift & Evidence) | Cited as current |
| SP 800-218 (SSDF v1.1) | Secure Software Development Framework | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-218 Rev. 1 (SSDF v1.2 draft) | SSDF v1.2 initial public draft | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Draft only (Dec 2025) |
| SP 800-30 Rev. 1 | Risk assessments | Book 00 (Orientation & Program) | Cited as current |
| SP 800-34 Rev. 1 | Contingency planning guide | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-37 Rev. 2 (RMF) | Risk Management Framework | All except Book 04 (Access & Privilege) | Cited as current |
| SP 800-39 | Managing information security risk | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-47 Rev. 1 | Information exchanges | Book 03 (HR-Driven Identity) | Cited as current |
| SP 800-50 (2003) | IT security awareness and training program | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Superseded by SP 800-50 Rev. 1 (Sept 2024) |
| SP 800-50 Rev. 1 | Cybersecurity and privacy learning program | Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Supersedes the 2003 SP 800-50 and SP 800-16 |
| SP 800-52 Rev. 2 | TLS guidelines | Book 09 (Network & Transport) | Cited as current |
| SP 800-53 Rev. 4 / FedRAMP Rev. 4 baseline | Prior control catalog | Book 15 (Compliance Automation & Day-2 Operations); Book 17 (AI Identity Governance) | Superseded by Rev. 5 |
| SP 800-53 Rev. 5 (release 5.2.0) | Security and privacy controls | All 18 books | Cited as current |
| SP 800-53A Rev. 5 | Control assessment procedures | Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence); Book 14 (Federal Compliance & Authorization); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| SP 800-53B | Control baselines | All except Book 00 (Orientation & Program); Book 02 (Identity & Directory); Book 05 (Devices & Endpoints); Book 07 (PKI & Certificates) | Cited as current |
| SP 800-60 | Information types to security categories | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-61 Rev. 2 | Incident handling guide (prior) | Book 12 (Security Operations & Telemetry) | Superseded by Rev. 3 (Apr 2025) |
| SP 800-61 Rev. 3 | Incident response (CSF 2.0 community profile) | Book 12 (Security Operations & Telemetry); Book 14 (Federal Compliance & Authorization) | Supersedes Rev. 2 |
| SP 800-63-3 | Digital Identity Guidelines (prior) | Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity) | Superseded by SP 800-63-4 (July 2025) |
| SP 800-63-4 (incl. 63A-4, 63B-4) | Digital Identity Guidelines | Book 01 (The Transformation Arc); Book 02 (Identity & Directory); Book 03 (HR-Driven Identity); Book 09 (Network & Transport); Book 15 (Compliance Automation & Day-2 Operations); Book 16 (People: Training & Education) | Cited as current |
| SP 800-79 | PIV card and derived credential issuer authorization | Book 03 (HR-Driven Identity) | Cited as current |
| SP 800-81 Rev. 3 | Secure DNS deployment guide (Mar 2026) | Book 08 (DNS, DHCP & IPAM) | Supersedes SP 800-81-2 |
| SP 800-81-2 | Secure DNS deployment guide (2013) | Book 08 (DNS, DHCP & IPAM) | Superseded by SP 800-81r3 |
| SP 800-84 | Test, training and exercise programs | Book 14 (Federal Compliance & Authorization) | Cited as current |
| SP 800-88 Rev. 2 | Media sanitization | Book 00 (Orientation & Program); Book 14 (Federal Compliance & Authorization) | Supersedes Rev. 1 (2014) |

:::

::: {.callout-note collapse="true"}
## FedRAMP (22)

| Instrument | What it is | Books citing it | Status, as the books state it |
|---|---|---|---|
| FedRAMP (program, generally) | Federal Risk and Authorization Management Program | All 18 books | Cited as current |
| FedRAMP 20x and Key Security Indicators | 20x certification; KSI families | All except Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 07 (PKI & Certificates); Book 08 (DNS, DHCP & IPAM); Book 09 (Network & Transport) | Cited as current |
| FedRAMP AI Prioritization Initiative | AI service prioritization | Book 17 (AI Identity Governance) | Cited as current |
| FedRAMP Consolidated Rules for 2026 (Certification Classes A-D) | 2026 rule set | All except Book 03 (HR-Driven Identity); Book 06 (Data Platform: SQL Server Identity); Book 07 (PKI & Certificates) | Cited as current |
| FedRAMP Marketplace | Marketplace product data | All except Book 00 (Orientation & Program); Book 04 (Access & Privilege); Book 05 (Devices & Endpoints); Book 13 (Governance, Drift & Evidence) | Cited as current |
| FedRAMP Notice NTC-0004 | Outcome of RFC-0020 authorization designations | Book 00 (Orientation & Program); Book 09 (Network & Transport); Book 10 (Cloud Boundary & Landing Zone); Book 14 (Federal Compliance & Authorization); Book 16 (People: Training & Education) | Cited as current |
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
| GRS 3.2 | Information Systems Security Records | Book 00 (Orientation & Program); Book 01 (The Transformation Arc); Book 03 (HR-Driven Identity); Book 07 (PKI & Certificates); Book 08 (DNS, DHCP & IPAM); Book 12 (Security Operations & Telemetry); Book 13 (Governance, Drift & Evidence) | Items 035-036 under revision (Transmittal 38) after M-21-31's rescission |
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

## Tagging chapters by framework

Every chapter already carries the same front matter, including `audience`, `part` and `status`, and Research pages already carry `date-modified`. The proposal is to add two fields to chapters:

- A `frameworks:` list beside `audience`, so each chapter states the frameworks it implements, and the site's listing machinery can filter by them.
- A `date-modified` field, so a crosswalk's "as of" date can be traced per chapter.

The 0-to-3 depth would be derived rather than typed by hand: 3 where a requirements-mapping appendix row names the framework with an evidence cell, 2 or 1 from the chapter text. A script like the one that fills the books' metrics table could compute it, and this page could then be generated from the books instead of maintained separately.

## Status and review

**In review.** Each framework's status was checked at its primary source on October 23, 2026, and every score comes from reading the chapters. Some sources couldn't be reached: the cio.gov pages for Cloud Smart and FITARA (certificate and 404 errors), Federal Register document pages (bot protection, which wasn't bypassed; its API and govinfo were used instead), and the OMB PDF of M-23-07 (404). To move this page to **Proved**, a reviewer confirms the scores against the books, including the October 23 additions. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

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
