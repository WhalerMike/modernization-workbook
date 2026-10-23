---
title: "Appendix C — Funding and Acquiring the Program"
description: "How the program's phases, charters and gates become the investment record federal capital planning requires; the program as the agency's enterprise architecture; funding a project through the Technology Modernization Fund; and what FITARA and OMB M-26-10 require of the program's IT purchases."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b00-orientation
book: B00
part: Appendix
series-order: 92
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix C — Funding and Acquiring the Program

*A modernization program is also an IT investment, and federal law says how an investment is chosen, funded, bought and measured.*

## In this appendix

- What capital planning requires of an IT investment record, and where the program's own artifacts already supply it
- Why the program's assessment, target and phase plan are the agency's enterprise architecture for this estate
- How a project could be funded through the Technology Modernization Fund
- What FITARA and OMB M-26-10 require of the program's IT purchases

The workbook is guidance, not federal policy. Where this appendix says a statute or OMB circular *requires* something, the note gives the passage; the mapping of the program's artifacts onto those requirements is the workbook's recommendation.

## The investment record capital planning requires

The Clinger-Cohen Act's capital planning section requires each agency head to "design and implement in the executive agency a process for maximizing the value, and assessing and managing the risks, of the information technology acquisitions of the executive agency," integrated with the agency's budget, financial and program management decisions.[^aC-11312] The same section sets what the process must contain: minimum criteria for undertaking an investment, "including criteria related to the quantitatively expressed projected net, risk-adjusted return on investment," quantifiable measures of net benefits and risks, and "a system of milestones for measuring progress, on an independently verifiable basis, in terms of cost, capability of the system to meet specified requirements, timeliness, and quality."[^aC-11312] The next section adds performance measures that show how the IT supports the agency's programs, and requires agencies to revise their processes "before making significant investments in information technology."[^aC-11313]

OMB carries this into two documents. Circular A-130 requires that decisions on major IT investments be "supported by business cases with appropriate evidence," that modernization decisions follow an alternatives analysis covering government-provided and commercial options, and that acquisitions weigh full life-cycle costs, from planning through sustainment, re-competition and retraining.[^aC-a130d] Circular A-11 sets the reporting. Its 2025 edition no longer has an Exhibit 300 or a Section 300: IT investment reporting lives entirely in Section 55, and agencies "are no longer required to submit an IT Resources Statement."[^aC-a11-51] For a major IT investment, Section 55 requires, at a minimum, project-level planned, projected and actual costs split into development and operations, the supporting contract data, anticipated and achieved benefits, current performance, the use of incremental development, operational analysis results, performance metrics, an assessment of cost, schedule, performance and cybersecurity risks, and the CIO's risk rating.[^aC-a11-55] Agencies report cost, schedule and performance data for major investments at least twice a year, and CIO risk ratings at least quarterly.[^aC-a11-55]

The program already produces most of that record. The table maps it; the mapping is the workbook's recommendation.

| What capital planning asks for | Where the program supplies it |
|---|---|
| The problem, and process redesign before investing | The assessment and current-state baseline ([Chapter 08](08-pre-flight-and-assessment.md)); the principles that retire implicit governance before automating it ([Chapter 04](04-the-principles.md)) |
| Alternatives, including government-provided and commercial options | Each book's selection chapter, such as [Book 08, Chapter 12](../b08-ddi/12-selection-cost-and-residual-risk.md) for DDI, and [Book 01, Appendix B](../b01-transformation-arc/appendix-b-applicability.md) for other stacks |
| Full life-cycle cost, split into development and operations | The cost-evidence method in [Book 09, Chapter 13](../b09-network/13-sequencing-cost-and-evidence.md), applied to the agency's own instance counts and agreements; the license plan in [Chapter 05](05-the-program-plan.md#licenses) |
| Independently verifiable milestones for cost, capability, timeliness and quality | The seven phases and six gates, each closed on evidence rather than a date ([Chapter 05](05-the-program-plan.md)) |
| Incremental development | Pilots before rollout, and one project charter per domain ([Chapter 06](06-the-project-portfolio.md), [Chapter 09](09-design-pilot-and-rollout.md)) |
| Performance metrics, benefits and operational analysis | The program scorecard's delivery and outcome measures ([Chapter 10](10-retirement-steady-state-and-success.md#measuring-success-the-program-scorecard)) |
| Cost, schedule, performance and cybersecurity risks | The risk register ([Appendix A](appendix-a-risk-register-and-traceability.md)) |

Two gaps are the agency's to fill. The workbook deliberately carries no prices, so the risk-adjusted return on investment has to be computed from the agency's own costs. And the CIO's risk rating is the CIO's.

### Major or non-major

How the investment is classified matters beyond reporting. A-11 lets the agency or OMB designate an investment "major" when it needs special management attention, has a high annual or life-cycle cost, is designated high risk by the CIO, involves a Tier I High Value Asset, or has a high-visibility profile.[^aC-a11-55] FITARA then ties contract approval to that designation: the CIO may delegate approval of contracts for a non-major investment to someone who reports directly to the CIO, but not for a major one.[^aC-11319] A program that retires the directory and rebuilds identity, devices and naming across the estate will usually meet more than one of the "major" factors, so plan for the CIO's personal approval of its contracts (inference).

## The program as the enterprise architecture

Circular A-130 requires every agency to "develop an enterprise architecture (EA) that describes the baseline architecture, target architecture, and a transition plan to get to the target architecture," aligned to the agency's information resources management strategic plan, and says the EA "should incorporate agency plans for significant upgrades, replacements, and disposition of information systems."[^aC-a130a2] NIST SP 800-53 makes the same requirement a control, PM-7: "Develop and maintain an enterprise architecture with consideration for information security, privacy, and the resulting risk to organizational operations and assets, individuals, other organizations, and the Nation."[^aC-pm7] And OMB's Capital Programming Guide requires "clear line-of-sight relationships between investments in capital assets and specific components in the EA."[^aC-cpg]

For the estate this workbook covers, the program's three planning artifacts are those three parts. The assessment in [Chapter 08](08-pre-flight-and-assessment.md) is the baseline architecture. The target estate each book designs is the target architecture. And the phase plan in [Chapter 05](05-the-program-plan.md), with its retirement phases in [Chapter 10](10-retirement-steady-state-and-success.md), is the transition plan, including the disposition of the systems it retires. File them as the EA's identity, device, naming and directory segments rather than as a parallel document, and the investment's line of sight to the EA follows. [Book 14, Chapter 05](../b14-compliance/05-program-management-controls.md) implements PM-7 as the program's architecture review gates. That framing is the workbook's recommendation; A-130 doesn't name a framework, and the Federal Enterprise Architecture Framework v2 survives only on an archived 2013 page.[^aC-feaf]

## Funding a project through the Technology Modernization Fund

The Technology Modernization Fund was created by the Modernizing Government Technology Act for transfers to agencies "to improve, retire, or replace existing Federal information technology systems to enhance cybersecurity and privacy and improve long-term efficiency and effectiveness."[^aC-mgt] The Act requires the agency to repay the fund under a written agreement, with terms that "may not exceed 5 years unless approved by the Director," and funds are transferred "only on an incremental basis, tied to metric-based development milestones."[^aC-mgt] The fund's board evaluates proposals on risk addressed, government-wide impact, and probability of success, judged on the business case, technical design, use of commercial products, procurement strategy and program management.[^aC-mgt]

The fund publishes what makes a proposal competitive. It expects agencies to "aim to repay the full amount of their investment," with exemptions only "under extremely rare circumstances," and says "Competitive projects are less than $25M and take no more than three years to implement."[^aC-fit] It asks for quantified outcomes, cross-organization executive sponsorship from the CFO, CIO and program leadership, an agile approach, and a project driven and managed by agency employees rather than contractors.[^aC-fit] Its May 2025 funding guide also described a partial-repayment route for urgent cybersecurity and modernization work whose savings the agency can't easily realize; the current proposal template states that "All proposals are expected to repay 100%."[^aC-repay]

The process has two phases. An agency submits an Initial Project Proposal of at most six pages; if the board advances it, the agency prepares a Full Project Proposal with phased milestones and a financial plan, and a funded project signs an interagency agreement.[^aC-process] First funds can arrive seven to eight months after the initial proposal, and repayments typically begin within a year of the first transfer.[^aC-fit][^aC-process] The fund runs calls for proposals with its own dates and priority areas: the 2026 call took initial proposals through October 20, 2026, and still accepts later ones without guaranteeing a decision by its December board.[^aC-call]

### Mapping a project charter to an initial proposal

The seven project charters in [Chapter 06](06-the-project-portfolio.md) already answer most of the initial proposal's questions. The mapping below is the workbook's recommendation.

| Initial Project Proposal field | Where the charter answers it |
|---|---|
| "Describe the problem(s) the project will solve," with data on its scale | **The problem**, with the assessment's counts from [Chapter 08](08-pre-flight-and-assessment.md) |
| "How will this project solve the problem(s)," including savings and the memos it addresses | **Purpose**, plus the federal clocks in [Chapter 01](01-why-modernize-now.md) and the book that carries the domain |
| Executive sponsorship and foundations for success | The sponsor and lead each charter leaves "to be named," and the decision rights in [Chapter 07](07-who-runs-the-program.md) |
| How the project is "iterative and evidence-driven," with baseline measurements, success metrics and milestones | **Success at pilot scale**, and the gates in [Chapter 05](05-the-program-plan.md) |
| How the agency will repay, naming "specific offset(s)," and future operations costs | The agency's own: decommissioned systems and retired licenses ([Chapter 10](10-retirement-steady-state-and-success.md)) are the natural offsets (inference) |

The template's own fields are quoted from the fund's 2026 initial proposal template.[^aC-ipp] A full proposal then breaks the project into phases of generally three to twelve months, each with dependencies, outcomes and metrics, and the fund releases money for a phase "only if project expectations have been achieved."[^aC-fpp] That's the same shape as the program's pilots and gates, which is why a single charter, not the whole program, is the natural unit for a proposal (inference).

## Buying for the program: FITARA and OMB M-26-10

FITARA gives the CIO the approval. A covered agency "may not enter into a contract or other agreement for information technology or information technology services, unless the contract or other agreement has been reviewed and approved by the Chief Information Officer of the agency," may not reprogram IT funds without the CIO's approval, and must have the CIO approve its IT budget request.[^aC-11319] Circular A-130 extends CIO review to every acquisition strategy, plan and requirement that includes IT, against eight factors, among them the ability to deliver functionality in short increments, the inclusion of government-wide requirements such as information security, and "Opportunities to migrate from end-of-life software and systems, and to retire those systems."[^aC-a130d] It also requires security, privacy, accessibility and records management requirements in solicitations.[^aC-a130d]

OMB M-26-10, issued March 31, 2026, reinforced both halves. Its first section required the CIOs of covered CFO Act agencies to report to OMB each month the IT contracts they personally approved, from May 2026; that reporting "shall sunset in October 2026, following covered CFO Act agencies' submission of their sixth and final report, unless OMB notifies agencies beforehand that it will continue past that time."[^aC-m2610] Its second section has no sunset. Effective immediately, each agency must request that current vendors, including resellers, third-party vendors and manufacturers, provide the agency's utilization rates and prices paid for IT hardware, software and services; must "Include appropriate provisions in solicitations and contracts issued after the date of this memorandum to require IT vendors to disclose utilization and pricing information to the Government, without limiting the extent to which that information may be shared across agencies"; and must compile the information in a machine-readable, open format and share it with OMB and GSA on request.[^aC-m2610] The memo gives no clause wording. It says GSA will share "sample contract language," and none was published as of October 23, 2026, so the wording is the agency's contracting officer's to draft (inference).[^aC-m2610]

### An acquisition checklist for the program's purchases

The program buys licenses, platform services and tools ([Chapter 05](05-the-program-plan.md#licenses)), and every project may buy more. As the workbook's recommendation, each purchase passes this checklist before award:

- **CIO approval** of the contract, and of the acquisition strategy against A-130's eight factors; delegated only if the investment is non-major.
- **Utilization and pricing disclosure** provisions in any solicitation or contract issued after March 31, 2026, with nothing limiting sharing across agencies; for existing contracts, the vendor request made and its answer filed.
- **Government-wide requirements** in the solicitation: security (including the supply-chain terms in [Book 14, Chapter 07](../b14-compliance/07-supply-chain-risk-management.md)), privacy, accessibility under Section 508, and records management.
- **Cloud services** checked for FedRAMP certification, with the agency's own authorization of the system that uses them ([Book 10, Chapter 03](../b10-cloud-boundary/03-what-changed-at-fedramp.md)).
- **Increments**: the purchase supports a pilot or a phase rather than the whole estate at once, consistent with A-130's useful segments.[^aC-a130d]

## Key takeaways

- The program's assessment, gates, charters, scorecard and risk register already supply most of the investment record that 40 U.S.C. §11312, Circular A-130 and A-11 Section 55 require; the agency adds its own costs, return on investment and the CIO's risk rating.
- The assessment, target estate and phase plan are the baseline, target and transition plan A-130 requires of an enterprise architecture.
- One project charter, not the whole program, is the natural unit for a Technology Modernization Fund proposal, and its repayment offsets are the systems and licenses the program retires.
- Every IT purchase needs the CIO's approval, and since March 31, 2026, new IT solicitations and contracts need provisions requiring vendors to disclose utilization and pricing.

## Continue the book

::: {.callout-note appearance="minimal"}
[← Previous: Appendix B — The Engagement Archetype (Illustrative)](appendix-b-engagement-archetype.md) · [Book index](index.md)
:::

[^aC-11312]: 40 U.S.C. §11312(a) and (b)(1)–(6), Capital planning and investment control (2024 edition), <https://www.govinfo.gov/content/pkg/USCODE-2024-title40/html/USCODE-2024-title40-subtitleIII-chap113-subchapII-sec11312.htm> (accessed Oct 23, 2026).
[^aC-11313]: 40 U.S.C. §11313(3) and (5), Performance and results-based management (2024 edition), <https://www.govinfo.gov/content/pkg/USCODE-2024-title40/html/USCODE-2024-title40-subtitleIII-chap113-subchapII-sec11313.htm> (accessed Oct 23, 2026).
[^aC-a130d]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource* (2016 revision), §5.d(1)(b), (f) and (j) (life-cycle cost, useful segments, requirements in solicitations), §5.d(2)(a)–(h) (CIO approval factors, including "Opportunities to migrate from end-of-life software and systems, and to retire those systems"), §5.d(3)(b) and (f) (business cases "with appropriate evidence"; alternatives analysis), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Oct 23, 2026).
[^aC-a11-51]: Office of Management and Budget, Circular A-11, *Preparation, Submission, and Execution of the Budget* (August 29, 2025), §51.3 ("Agencies are no longer required to submit an IT Resources Statement as part of their agency budget submission to OMB"); Part 7 holds "Appendices A through K and the Capital Programming Guide," with no Section 300, <https://www.whitehouse.gov/wp-content/uploads/2025/08/a11.pdf> (accessed Oct 23, 2026).
[^aC-a11-55]: Office of Management and Budget, Circular A-11 (August 29, 2025), §55.3 (major-investment cost, schedule and performance data "on at least a semi-annual basis"; CIO risk evaluations "at least once per quarter"), §55.4(a) (factors for designating an investment "major"), §55.4(b) (minimum documentation for major IT investments), <https://www.whitehouse.gov/wp-content/uploads/2025/08/a11.pdf> (accessed Oct 23, 2026).
[^aC-11319]: 40 U.S.C. §11319(b)(1)(B)(i) (CIO approval of the IT budget request), (b)(1)(C)(i) (contract and reprogramming approval) and (b)(1)(C)(ii)(II) (delegation for "a non-major information technology investment, as defined in the annual information technology capital planning guidance"), 2024 edition, <https://www.govinfo.gov/content/pkg/USCODE-2024-title40/html/USCODE-2024-title40-subtitleIII-chap113-subchapII-sec11319.htm> (accessed Oct 23, 2026).
[^aC-a130a2]: Office of Management and Budget, Circular A-130 (2016 revision), §5.a(2), Enterprise Architecture, <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Oct 23, 2026).
[^aC-pm7]: NIST SP 800-53 Rev. 5 (Release 5.2.0, August 27, 2025), PM-7, Enterprise Architecture, from NIST's OSCAL catalog, <https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json>; release note at <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (both accessed Oct 23, 2026).
[^aC-cpg]: Office of Management and Budget, Capital Programming Guide, Version 3.0, supplement to Circular A-11 (2025), §I.2, in <https://www.whitehouse.gov/wp-content/uploads/2025/08/a11.pdf> (accessed Oct 23, 2026).
[^aC-feaf]: The White House (archived), Federal Enterprise Architecture, including FEAF v2 (January 29, 2013), <https://obamawhitehouse.archives.gov/node/17927> (accessed Oct 23, 2026).
[^aC-mgt]: Modernizing Government Technology Act, Pub. L. 115-91, div. A, title X, subtitle G, §1078(b)(3)(A), (b)(5)(A)(i), (b)(6)(A)(i), (b)(6)(B)(i) and (c)(2)(A), as enacted December 12, 2017, <https://www.govinfo.gov/content/pkg/PLAW-115publ91/html/PLAW-115publ91.htm> (accessed Oct 23, 2026).
[^aC-fit]: Technology Modernization Fund, "Agency and project fit," <https://tmf.cio.gov/fit/> (accessed Oct 23, 2026).
[^aC-repay]: Technology Modernization Fund, *Funding & repayment* (last updated May 2, 2025), p. 2 ("Partial repayment"), <https://tmf.cio.gov/files/2025/05/Funding-repayment_updated050225.pdf>; Initial Project Proposal template, <https://tmf.cio.gov/files/2026/06/Initial-proposal-template.docx> (both accessed Oct 23, 2026).
[^aC-process]: Technology Modernization Fund, "Process," <https://tmf.cio.gov/process/> (accessed Oct 23, 2026).
[^aC-call]: Technology Modernization Fund, "2026 Call for Proposals," <https://tmf.cio.gov/2026-call-for-proposals/> (accessed Oct 23, 2026).
[^aC-ipp]: Technology Modernization Fund, Initial Project Proposal template (2026), fields under "Details" and "Funding," and the instruction that "IPPs that exceed six pages won't be considered," <https://tmf.cio.gov/files/2026/06/Initial-proposal-template.docx> (accessed Oct 23, 2026).
[^aC-fpp]: Technology Modernization Fund, Full Project Proposal, Appendix A, project-plan definitions of phases, dependencies, outcomes and metrics, <https://tmf.cio.gov/files/2024/11/Full-project-proposal%E2%80%94Appendix-A.docx> (accessed Oct 23, 2026).
[^aC-m2610]: Office of Management and Budget, M-26-10, *Reinforcing Transparency, Accountability, and Oversight of Federal Technology*, March 31, 2026, §1 Requirements (monthly reporting and its sunset), §2 Requirements (vendor utilization and pricing; footnote 8: "This includes resellers, third-party vendors, and manufacturers") and p. 4 ("GSA will support agencies by sharing best practices, sample contract language, and templates, as appropriate"), <https://www.whitehouse.gov/wp-content/uploads/2026/03/M-26-10-Reinforcing-Transparency-Accountability-and-Oversight-of-Federal-Technology.pdf> (accessed Oct 23, 2026).
