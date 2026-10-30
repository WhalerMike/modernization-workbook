---
title: "Governing and Buying AI Under M-25-21 and M-25-22"
subtitle: "The two OMB memoranda in force for agency AI, read as a program: the governance roles, strategy and compliance plan M-25-21 asks for, and the acquisition lifecycle M-25-22 sets, phase by phase, with every date counted"
description: "Research under review: what OMB M-25-21 and M-25-22 require of a civilian agency beyond the identity obligations covered in Book 17. It covers the Chief AI Officer, the governance board, the AI strategy and compliance plan, the high-impact determination process, and M-25-22's requirements for buying AI: data and IP rights, vendor lock-in, privacy, performance-based acquisition, testing, contract terms and closeout."
research-status: in review
research-type: explainer
research-book: "Books 14, 15, 17, 18"
date-modified: 2026-10-30
last-reviewed: 2026-10-30
---

# Governing and Buying AI Under M-25-21 and M-25-22 {.unnumbered}

On April 3, 2025, OMB issued two memoranda that replaced the previous administration's AI policy. M-25-21, *Accelerating Federal Use of AI through Innovation, Governance, and Public Trust*, "rescinds and replaces" M-24-10 and governs how agencies use AI.[^omb-m2521] M-25-22, *Driving Efficient Acquisition of Artificial Intelligence in Government*, "rescinds and replaces" M-24-18 and governs how they buy it.[^omb-m2522] Nineteen months later, both are still the operative OMB policy.

[Book 17, Chapter 02](../books/b17-ai-identity/02-what-federal-ai-rules-require.md) already sets out both memos for identity governance: M-25-21's requirements table, the seven minimum practices for high-impact AI, the absence of an AI-specific ATO, and the three M-25-22 provisions that bear on identity. This page doesn't repeat that material. It covers the rest of the two memos, the parts an agency's AI program office, acquisition office and privacy office work from:

- the governance structure M-25-21 creates;
- what an AI strategy and a compliance plan must contain;
- how high-impact determinations are made and recorded;
- M-25-22's acquisition lifecycle, from defining requirements to contract closeout.

## The answer in brief

- **Both memos are in force, unamended.** OMB's memoranda list on October 30, 2026 runs to M-27-01 (October 23, 2026). The only later AI memorandum is M-26-04 on unbiased AI principles, which adds contract terms for large language models and doesn't amend either memo.[^omb-memos] Executive Order 14434 renamed "AI" as "Super Intelligence" in agency documents but left the definitions and obligations unchanged; see [Book 17, Chapter 02](../books/b17-ai-identity/02-what-federal-ai-rules-require.md#the-2026-executive-orders).
- **Every first-round deadline has passed.** The next dated obligation an agency faces under M-25-21 is the second compliance plan, two years after the first, around September 30, 2027. The AI use case inventory remains annual.
- **M-25-22 now governs most AI buys.** It applies to contracts awarded from solicitations issued on or after September 30, 2025, and to options exercised after that date. It doesn't cover AI that is merely embedded in a common commercial product, or AI a contractor uses on its own initiative.
- **The contract is where the memo's protections live.** M-25-22 requires terms for IP rights and government data, privacy, vendor lock-in, M-25-21's high-impact practices, and ongoing testing and monitoring. It also requires an ATO before any AI system operated as an information system is deployed.
- **Two GSA deliverables can't be confirmed from public sources.** These are the acquisition guide and the executive-branch-only repository M-25-22 called for. See [Honest limits](#honest-limits).

## Where the two memos sit

The memos implement statute and executive orders, and they defer to OMB's general information policy. An agency reading them should know what each one rests on.

| Instrument | Role for agency AI | Status, October 30, 2026 |
|---|---|---|
| AI in Government Act of 2020, §104 | Requires OMB's AI use guidance and agency compliance plans; M-25-21's compliance plan cites §104(c) and (d)[^omb-m2521] | In force |
| Advancing American AI Act (Pub. L. 117-263, div. G, title LXXII, subtitle B) | §7224(d) directs OMB's AI acquisition guidance (M-25-22); §7225 requires the use case inventory[^omb-m2522] | In force |
| Executive Order 13960 (2020), *Promoting the Use of Trustworthy AI in the Federal Government* | Its nine principles are what M-25-22's cross-functional team must assess risks against; M-25-21's Chief AI Officer Council advances them[^omb-m2522][^omb-m2521] | Cited by both memos as in force |
| Executive Order 14179 (January 23, 2025) | Directed the replacement of M-24-10 and M-24-18 (see [Book 17, Chapter 02](../books/b17-ai-identity/02-what-federal-ai-rules-require.md#the-rule-set-in-force)); both memos cite it for the buy-American AI policy[^omb-m2522] | In force |
| OMB M-25-21 (April 3, 2025) | Use and governance | In force[^omb-memos] |
| OMB M-25-22 (April 3, 2025) | Acquisition | In force[^omb-memos] |
| OMB M-26-04 (December 11, 2025) | Contract terms for large language models; sunsets December 11, 2027 | In force; covered in [Book 17, Chapter 02](../books/b17-ai-identity/02-what-federal-ai-rules-require.md#m-26-04-and-the-unbiased-ai-principles) |
| OMB Circular A-130 | Authorization to operate; both memos say AI follows it and doesn't replace it[^omb-m2521][^omb-m2522] | In force |

Neither memo applies to AI used as a component of a national security system. M-25-22 doesn't apply to the Intelligence Community, and M-25-21's high-impact practices don't bind it.[^omb-m2521][^omb-m2522]

## Every date, counted

Both memos count their deadlines from April 3, 2025. The dates below are counted from that day; the memos themselves give only the day counts.

| Due (counted) | Days | Memo | What | Who |
|---|---|---|---|---|
| June 2, 2025 | 60 | M-25-21 §3(a)(i) | Retain or designate a Chief AI Officer | Each agency |
| July 2, 2025 | 90 | M-25-21 §3(a)(ii) | Convene the AI governance board | CFO Act agencies |
| July 2, 2025 | 90 | M-25-21 §3(c)(i) | OMB convenes the Chief AI Officer Council | OMB |
| July 12, 2025 | 100 | M-25-22, Appendix I | GSA, with OMB, develops a plan to release a public AI acquisition guide | GSA |
| September 30, 2025 | 180 | M-25-21 §2(a) | Publish the AI strategy, on OMB's template | CFO Act agencies |
| September 30, 2025 | 180 | M-25-21 §3(b)(ii) | Submit and post the compliance plan, or a determination of no covered AI | Each agency |
| September 30, 2025 | 180 | M-25-22 §2(c) | The memo applies to new solicitations and to options exercised from this date | Each agency |
| October 20, 2025 | 200 | M-25-22, Appendix I | Standardize the treatment of data ownership and IP rights in AI procurements | Each agency |
| October 20, 2025 | 200 | M-25-22, Appendix I | GSA, with OMB, develops the executive-branch AI acquisition repository | GSA |
| December 29, 2025 | 270 | M-25-21 §3(b)(iii)–(iv) | Update IT, data, cybersecurity and privacy policies; develop a generative AI policy ("should") | Each agency |
| December 29, 2025 | 270 | M-25-22 §3(b) | Update internal acquisition procedures | Each agency |
| April 3, 2026 | 365 | M-25-21 §4(a)(i) | Document the minimum practices for each high-impact use case, or stop using it | Each agency except the IC |
| About September 30, 2027 | Two years after the first plan | M-25-21 §3(b)(ii) | Next compliance plan; then every two years until 2036 | Each agency |
| April 3, 2030 | Five years | M-25-21 §3(c)(i)(D) | Chief AI Officer Council sunsets unless the OMB Director extends it | OMB |
| Ongoing | — | M-25-21 §3(b)(v) | Inventory AI use cases at least annually; submit to OMB and post publicly | Each agency except DoD and the IC |
| Ongoing | 30 days | M-25-21 §3(a)(i); §4(a)(iii) | Notify OMB when the Chief AI Officer changes or the post is vacant; report each waiver granted or revoked | Each agency |

A compliance plan is also due within 180 days of "any update to this memorandum," so a revision of M-25-21 would reset the cycle.[^omb-m2521] M-25-22's Appendix I, its Consolidated Table of Required Actions, lists "achieve full compliance" at 180 days under §2(c), while §3(b) gives 270 days for updating acquisition procedures.[^omb-m2522] The two fit together: the memo starts governing new contracts at 180 days, and agencies had until 270 days to bring their internal procedures into line.

## M-25-21: the program it asks for

### The Chief AI Officer

Every agency must have a Chief AI Officer. The post can be held by an existing official, such as the CIO, CDO or CTO, provided that person "has significant expertise in AI." At a CFO Act agency the Chief AI Officer must be at the Senior Executive Service, Scientific and Professional or Senior Leader level, or equivalent; at other agencies, GS-14 or above. The Chief AI Officer must be positioned to engage regularly with the Deputy Secretary or equivalent.[^omb-m2521]

M-25-21 lists ten responsibilities, A through J. Book 17 develops the inventory and the high-impact processes (E and F). The others shape the program office:

- promoting responsible AI adoption through a governance and oversight process (A);
- coordinating legal and policy compliance with other officials (B);
- advising the agency head (C);
- representing the agency in external AI forums (D);
- advising on an AI-ready workforce (G);
- making sure custom AI code and the data used to develop and test AI are inventoried, shared and released (H);
- advising the agency head and CFO on AI resourcing (I);
- supporting efforts to track AI spending (J).

Two powers sit with the Chief AI Officer personally. Waiving a minimum practice is one, and that authority "shall not be delegated." Certifying a pilot as exempt from the practices is the other; the memo doesn't say whether it can be delegated.[^omb-m2521]

### The governance board

CFO Act agencies must convene an AI governance board. Existing bodies can fill the role. The Deputy Secretary or equivalent chairs it and the Chief AI Officer is vice-chair. Its members must cover IT, cybersecurity, data, budget, statistics, legal counsel, privacy, civil rights and civil liberties. "When relevant," they must also include agency management, human capital, procurement, customer experience, program evaluation and the program offices implementing AI. The board may consult external experts.[^omb-m2521] Other agencies aren't required to have a board, but they still need a governance and oversight process under the Chief AI Officer.

### The AI strategy

Each CFO Act agency must publish an AI strategy on OMB's template. It must cover two things:[^omb-m2521]

1. the current and planned use cases most important to the agency's mission, operations or service delivery (this element doesn't apply to the Department of Defense or the Intelligence Community);
2. an assessment of the agency's AI maturity, and a plan to reach its maturity goals that addresses, at a minimum:
   - AI-enabling infrastructure across development, testing, deployment and continuous monitoring;
   - access to quality data, and data traceability;
   - enterprise capacity for AI innovation;
   - AI tools for research and development;
   - the operations, governance and infrastructure to manage AI risk, "including risks related to information security and privacy";
   - an AI-ready workforce and AI literacy for non-practitioners;
   - identifying and tracking future AI investment or procurement.

A footnote to the infrastructure item says agencies "should update, as necessary, processes for information system authorization and continuous monitoring to better address the needs of AI applications."[^omb-m2521] For a Moderate system, that points at the existing CA-6 and CA-7 work, not a new process. Information that would be protected from release under FOIA need not appear in the strategy.

### The compliance plan

Every agency, not only CFO Act agencies, must submit to OMB and post publicly one of two things:[^omb-m2521]

- a plan to achieve consistency with M-25-21;
- a written determination that it "does not use and does not anticipate using covered AI."

The plan must also cover updates to any existing internal AI principles. Agencies may keep their own principles if they don't conflict with the memo. OMB said it would provide templates. The first plans were due September 30, 2025, and the cycle repeats every two years until 2036. The compliance plan is a separate cycle from the annual inventory and the AI strategy. An agency that filed a "no covered AI" determination in 2025 should recheck it before the 2027 cycle *(program reading)*.

### Policies to update

Within 270 days, agencies had to update four policy areas where necessary:[^omb-m2521]

- **IT infrastructure:** software tools, open source, AI development code, deployment and platform modernization.
- **Data:** inventory, quality data for AI, lawful access to agency, third-party and public data, and representativeness.
- **Cybersecurity:** "information system authorizations, continuous monitoring, continuous authorizations for AI."
- **Privacy.**

They should also have developed a generative AI policy, setting acceptable use, safeguards and oversight. The memo adds that agency policies "should aim to advance using models that are built with less data, require less compute, and are inherently more explainable, where possible."

### Sharing code, models and data

M-25-21 §2(b) requires agencies to share custom-developed AI code, "including models and model weights," across the government for applications in active use, whether the agency developed or procured them. Where practicable, the code must also be released as open source. Four exceptions apply:[^omb-m2521]

- a legal restriction, including intellectual property, export control or classification;
- an identifiable risk to national security, confidentiality, privacy, or the rights or safety of the public;
- a contractual obligation;
- an identifiable risk to the agency's mission or systems.

Data used to develop and test AI may be a "data asset" that belongs in the agency's comprehensive data inventory. Two points connect to acquisition. A contract that bars sharing is itself an exception, which is one reason M-25-22 asks agencies to scope IP rights carefully. And the memo warns that a model "may reveal sensitive details of the data used to develop" it.

### Determining high-impact AI

The definition and the categories presumed to be high-impact are in [Book 17, Chapter 02](../books/b17-ai-identity/02-what-federal-ai-rules-require.md#the-seven-minimum-practices). The process around them is:[^omb-m2521]

- The Chief AI Officer establishes the process for determining and documenting high-impact use cases, and tracks determinations centrally.
- For a use case in a presumed category, the official who concludes it isn't high-impact must "submit written documentation to notify the CAIO." The Chief AI Officer provides those determinations to OMB on request, and may reverse any determination at any time.
- A use case can be high-impact "whether there is or is not human oversight." Putting a person in the loop doesn't take a use case out of scope. What matters is whether the AI's output is "a principal basis" for the decision.
- Agencies "should streamline approvals" for closely related use cases with substantially similar risk profiles.
- Each agency must publicly release a summary of each determination and waiver, with its justification, or state publicly that it has none.

## M-25-22: buying AI, phase by phase

### What it covers

M-25-22 covers AI systems or services acquired by or for an agency, using the Advancing American AI Act's definition of an AI system. That definition excludes "any common commercial product within which artificial intelligence is embedded, such as a word processor or map navigation system." The memo gives a two-part test for the exclusion:[^omb-m2522]

- Is the product widely available to the public, rather than specialized or customized for the agency?
- Does it have substantial non-AI purposes, rather than AI as its primary purpose?

Word processing software bought "primarily ... for its AI functionality" is likely covered; ordinary word processing with AI spelling suggestions is likely not. The memo also excludes AI "used incidentally by a contractor," meaning at the contractor's option when the contract doesn't require it. AI acquired for research is excluded unless the research aims to develop particular AI applications for the agency.

### Agency-level requirements

M-25-22's Section 3 sets standing requirements. The memo's own lettering in this section starts at (b), and its internal cross-references don't always match the body. This page cites the letters as printed in the body.[^omb-m2522]

| Requirement | Section | What the agency must do |
|---|---|---|
| Update acquisition procedures | 3(b) | Within 270 days, enable officials to review planned AI acquisitions and give feedback on performance and risk management; convene a cross-functional team; and use appropriate IP terms |
| Buy American | 3(c) | "Maximize the use of AI products and services that are developed and produced in the United States," consistent with applicable law |
| Protect privacy | 3(d) | Policies and contract terms ensuring privacy compliance whenever acquired AI, or a contractor's AI, handles federal PII; the Senior Agency Official for Privacy involved "early and ongoing," including in pre-solicitation planning and requirements definition |
| Protect IP rights and government data | 3(e) | Revisit the process for data ownership and IP rights in AI procurements and standardize it across contracts where possible; the Chief AI Officer Council will review agency processes periodically |
| Decide on disclosure of contractor AI use | 3(h) | Decide when a solicitation should require vendors to disclose AI use in contract performance |

The IP and data process under 3(e) must address five points:[^omb-m2522]

1. **Scope:** licensing and other IP rights scoped to the intended use, "to avoid vendor lock-in."
2. **Timeline:** the components needed to operate and monitor the AI stay available "for as long as it may be necessary."
3. **Data handling:** vendors collect and retain agency data only when "reasonably necessary to serve the intended purposes of the contract."
4. **Use of government data:** contracts "permanently prohibit" training public or commercial AI on non-public agency inputs and outputs, absent explicit agency consent.
5. **Documentation:** agencies are encouraged to get documentation that supports transparency, explainability and performance tracking.

### The acquisition lifecycle

Section 4 walks through the acquisition lifecycle. Its verbs distinguish requirements ("must") from recommendations ("should," "encouraged"). The table keeps that distinction.

| Phase | Must | Should or encouraged |
|---|---|---|
| **Identifying requirements** (4(a)) | The cross-functional team identifies risks to the agency's implementation of Executive Order 13960's nine principles. The agency identifies reasonably foreseeable use cases and, "to the greatest extent practicable," makes an initial determination of whether the system is likely to host high-impact use cases | Convene the team through the agency's designated process, scaled to the procurement's complexity and risk. Members likely include acquisition (with competition advocates), IT, cybersecurity, privacy, civil rights and liberties, budget, data, legal and program evaluation |
| **Market research and planning** (4(b)) | — | Broad market research, including new entrants; demonstrations in conditions that reflect "the specific characteristics of agency networks," which also expose lock-in risk; performance-based techniques (statements of objectives, performance work statements, quality assurance surveillance plans, incentives tied to measurable baselines). OMB said it would develop "play books" for types of AI |
| **Solicitation** (4(c)) | Disclose, when practicable, whether a planned use is or may become high-impact. For likely high-impact uses, tell vendors what transparency and documentation they'll owe, including enough to complete the AI impact assessment. Include IP and government-data terms | Include provisions favoring proposals that reduce lock-in: knowledge transfer, data and model portability, clear licensing, pricing transparency |
| **Selection and award** (4(d)) | Test proposed solutions "to the greatest extent practicable." Include the contract terms listed below | Consider a testing environment on agency networks; reassess proposals for new risks and for M-25-21 compliance problems |
| **Contract administration** (4(e)) | An ATO "from an appropriate agency official prior to deployment" for AI operated as an information system; oversight consistent with the contract, including emerging privacy, civil rights and civil liberties risks | Periodic evaluation of value, effectiveness and cost; user and stakeholder feedback; criteria for sunsetting the system |
| **Contract closeout** (4(f)) | — | As soon as the agency decides not to extend, implement the terms on rights to data and derived products: agree format and usability, the conditions under which access expires, and a transfer plan |

M-25-22 lists the contract terms an agency must include in contracts for AI systems and services, "where applicable":[^omb-m2522]

| Term | What it must or should say |
|---|---|
| IP rights and government data | Consistent with the agency's process under 3(e) |
| Privacy | As set out in 3(d) |
| Vendor lock-in protections | Knowledge transfer, data and model portability, "rights to code and models produced in performance of a contract," and transparency in licensing and pricing |
| M-25-21 compliance | Contracts "must ensure compliance with minimum risk management practices for high-impact use cases" |
| Ongoing testing and monitoring | The agency can monitor and evaluate performance, risk and effectiveness regularly (the memo gives "quarterly or biannual" as examples). Independent evaluations use agency-defined data that the vendor can't access. Vendors give the access and time needed. Contracts detail the vendor's testing and "must not prohibit agencies from internally disclosing" how the vendor tests or what it found |
| Vendor performance (encouraged) | The vendor monitors performance and fixes unacceptable behavior; a new version meets performance standards before deployment, or rolls back |
| New feature notification (encouraged) | The vendor notifies the agency before integrating new AI features into delivered systems, so the agency can confirm M-25-21 compliance before release |

The lock-in footnote is unusually specific. It names evaluation criteria an agency can use:[^omb-m2522]

- well-defined APIs;
- documentation of foundation-model and development decisions that eases moving to another vendor;
- open-source licenses for models, systems and datasets;
- transparent, non-discriminatory pricing, without bulk, tying or steering arrangements, minimum spend requirements or self-preferencing;
- disclosure of subcontractors and system integrators, and how they affect price.

## Where this meets a Moderate baseline *(design guidance)*

Neither memo cites NIST SP 800-53. The mapping below is the workbook's reading of where M-25-22's requirements land in the controls a Moderate system already implements. It isn't an OMB crosswalk. Every control below is in the SP 800-53 Rev. 5 Moderate baseline.[^omb-80053]

| M-25-22 requirement | Control | Why it lands there |
|---|---|---|
| Contract terms for testing, documentation, data handling and lock-in | SA-4, Acquisition Process | SA-4 is where security and privacy requirements, documentation and acceptance criteria go into the contract |
| Vendor performance monitoring; contractual oversight | SA-9, External System Services | The AI service is an external system service; SA-9 requires the provider to comply with agency requirements and the agency to monitor it |
| Lock-in protections; buy American; disclosure of contractor AI use | SR-5, Acquisition Strategies, Tools, and Methods; SR-6, Supplier Assessments and Reviews | Supply chain acquisition strategy and supplier review |
| Testing proposed solutions; independent evaluation on agency data | SA-11, Developer Testing and Evaluation; RA-3, Risk Assessment | Testing evidence and the system risk assessment the authorizing official relies on |
| ATO before deployment | CA-6, Authorization | M-25-22 sends AI through the existing authorization |
| Quarterly or biannual monitoring of performance and risk | CA-7, Continuous Monitoring | The monitoring strategy can carry the AI-specific metrics alongside the security ones |

For a cloud AI service, the ATO usually builds on a FedRAMP authorization. [Book 17, Chapter 02](../books/b17-ai-identity/02-what-federal-ai-rules-require.md#what-nist-cisa-and-fedramp-add) describes how FedRAMP prioritized AI services and what that does and doesn't cover.

## What this changed in the workbook

- **The [Federal Framework Crosswalk](federal-framework-crosswalk.md)**:
  - adds Book 15 and Book 18 to the books citing M-25-21 and M-25-22;
  - adds Book 15 to the books citing M-24-10;
  - links to this page.
- **No book chapter changed.** A sweep of the repository on October 30, 2026 found no page citing M-24-10 or M-24-18 as current. Every mention says they were rescinded and replaced. Book 17's account of both memos matches the primary sources.

## Honest limits

- **OMB's templates.** M-25-21 says OMB will provide templates for the AI strategy and the compliance plan. This research found agencies' published plans and strategies but not the templates themselves on OMB's public pages.
- **GSA's deliverables.** On October 30, 2026, GSA's public AI acquisition pages (updated October 16 and 21, 2026) cite M-25-22 but list no acquisition guide issued under it.[^omb-gsa-proc][^omb-gsa-res] The repository is "available only to Executive Branch agencies" by design, so its absence from public pages proves nothing.[^omb-m2522] OMB's AI "play books" weren't found either.
- **The FAR.** This page doesn't assess Federal Acquisition Regulation changes, or other acquisition memoranda such as M-26-12 on commercial products, for how they interact with M-25-22.
- **Computed dates.** The dates in [Every date, counted](#every-date-counted) are day counts from April 3, 2025, except where a cited source gives the date.

::: {.callout-note collapse="true"}
## Status and review

**In review.** Built on October 30, 2026 from the M-25-21 and M-25-22 PDFs on whitehouse.gov, OMB's memoranda list, GSA's public AI pages and NIST's OSCAL Rev. 5 catalog and Moderate baseline profile. All were read that day. The claims log is in `docs/research/_verification/omb-ai-memos-m-25-21-m-25-22.md`. The M-25-22 PDF is a scan; quotations were checked against the page images where the extracted text was unclear.
:::

[^omb-m2521]: Office of Management and Budget, M-25-21, *Accelerating Federal Use of AI through Innovation, Governance, and Public Trust*, April 3, 2025, Overview; Appendix Sections 1(a)–(c), 2(a)–(b), 3(a)–(c) and 4(a); footnotes 9, 11, 21–23 and 29, <https://www.whitehouse.gov/wp-content/uploads/2025/02/M-25-21-Accelerating-Federal-Use-of-AI-through-Innovation-Governance-and-Public-Trust.pdf> (accessed Oct 30, 2026).
[^omb-m2522]: Office of Management and Budget, M-25-22, *Driving Efficient Acquisition of Artificial Intelligence in Government*, April 3, 2025, Sections 1, 2(a)–(d), 3(b)–(h), 4(a)–(f), footnotes 14 and 24–26, and Appendix I, <https://www.whitehouse.gov/wp-content/uploads/2025/02/M-25-22-Driving-Efficient-Acquisition-of-Artificial-Intelligence-in-Government.pdf> (accessed Oct 30, 2026).
[^omb-memos]: Office of Management and Budget, "Memoranda," list through M-27-01 (October 23, 2026), <https://www.whitehouse.gov/omb/information-resources/guidance/memoranda/> (accessed Oct 30, 2026).
[^omb-gsa-proc]: General Services Administration, "Procuring SI solutions" (cites M-25-21 and M-25-22; last updated October 21, 2026), <https://www.gsa.gov/technology/government-it-initiatives/artificial-intelligence/procuring-ai-solutions> (accessed Oct 30, 2026).
[^omb-gsa-res]: General Services Administration, "SI guidance and resources" (last updated October 16, 2026), <https://www.gsa.gov/technology/government-it-initiatives/artificial-intelligence/ai-guidance-and-resources> (accessed Oct 30, 2026).
[^omb-80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, control titles for SA-4, SA-9, SA-11, SR-5, SR-6, RA-3, CA-6 and CA-7, and SP 800-53B Moderate baseline membership, read from NIST's OSCAL Rev. 5 catalog and Moderate baseline profile, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 30, 2026).
