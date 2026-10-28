---
title: "Chapter 01 — A Portfolio, Not a Rewrite"
description: "Why application modernization in a federal agency is a portfolio decision made one application at a time: the scale of the legacy problem from GAO's 2019 and 2025 reviews and the share of IT spending that goes to operations and maintenance, why big-bang rewrites fail and federal policy asks for useful segments instead, why the application is the unit of decision, and the four questions the rest of the book answers."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b18-application-modernization
book: B18
part: Why
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 01 — A Portfolio, Not a Rewrite

*An agency with thousands of legacy applications can't rewrite its way out; it modernizes by deciding, application by application, what each one should become, and by building the ones it changes on one architecture.*

::: {.callout-note}
## In this chapter
The scale of the federal legacy problem, from GAO's government-wide reviews and the share of IT spending that goes to keeping existing systems running. Why large rewrites fail, and what federal acquisition policy asks for instead. Why the unit of decision is the application, not the program or the platform. And the four questions, Why, What, Who and How, that organize the rest of this book.
:::

Most of the money federal agencies spend on IT keeps existing systems running. GAO's July 2025 review of legacy systems puts federal IT and cyber-related spending at more than $100 billion a year, and notes that agencies have typically reported spending about 80 percent of it on operations and maintenance of existing IT.[^c01-gao25] For fiscal year 2025 the figure for the 24 CFO Act agencies, from the federal IT Dashboard, was about $83 billion, or 79 percent of planned IT spending.[^c01-gao25] The share has hardly moved in six years: GAO's 2019 review gave the same "about 80 percent" against more than $90 billion of planned spending for fiscal year 2019.[^c01-gao19]

What that money maintains is not fully known. GAO observes that the extent of legacy IT in the federal government is unknown, and that how much of the operations and maintenance spending goes to legacy technology is uncertain, because OMB doesn't require agencies to flag whether an investment is legacy.[^c01-gao25] The government knows what it spends on keeping the lights on. It doesn't know, in one place, which of the lights are forty years old.

This book is about what an agency does with that portfolio. It argues that the answer is never one program that rewrites everything, and always a set of decisions made one application at a time.

![The book's argument: a legacy portfolio is triaged application by application into six dispositions; the applications that change are built on one target reference architecture, their data is moved with proof, AI is added only with an owner, and the whole is governed through gates that produce compliance evidence and run in waves.](../../images/diagrams/b18-application-modernization/svg/ch01-portfolio-not-rewrite.svg){#fig-ch01-portfolio-not-rewrite fig-alt="A top-to-bottom flow. At the top, a slate card reads: the legacy portfolio, thousands of mission applications, mainframe, DB2 and Oracle, COBOL and PL/SQL. An amber card below reads: triage each application, a scored rubric, one disposition each. It branches into three cards on one row: a slate card, retire or retain, stop paying or keep on purpose; an amber card, rehost or replatform, move with little or no code change; a blue card, refactor or rebuild, change the code onto the target. The refactor or rebuild card leads to a blue card, one target reference architecture: Java and Spring Boot services, React front ends, OpenAPI contracts, containers, with data moved off DB2 and Oracle with proof and AI with an identity and an owner. A violet card at the bottom reads: governed and run in waves, review gates, compliance evidence, TOGAF and Zachman, pilot, factory and long tail. The rehost or replatform card also leads to the violet card."}

## The scale of the problem

GAO has twice asked agencies to name their most critical legacy systems and has ranked them. The two reviews, six years apart, describe the same problem.

| | GAO-19-471 (June 2019) | GAO-25-107795 (July 2025) |
|---|---|---|
| Systems reviewed | 65, from 24 agencies | 69 |
| Systems most in need of modernization | 10, at 10 agencies | 11, at 10 agencies |
| Age of those systems | 8 to 51 years | About 23 to 60 years |
| Annual cost to operate and maintain them | Not stated on the summary | About $754 million |
| Modernization plans | 8 of the 10 agencies lacked complete plans; 3 had none | 3 of the 11 systems had plans with all key elements; 2 had no plan |
| Federal IT spending cited | More than $90 billion planned for FY 2019 | More than $100 billion a year; about $83 billion (79 percent) planned for O&M in FY 2025 |

Sources: GAO-19-471 and GAO-25-107795.[^c01-gao19][^c01-gao25]

The 2025 report adds detail on the 11 systems. Eight use outdated languages such as COBOL and assembly language, four have unsupported hardware or software, and seven operate with known cybersecurity vulnerabilities that can't be remediated without modernization.[^c01-gao25] Of the ten systems on the 2019 list, agencies had completed three modernizations by February 2025; of the other seven, four were planned to finish within a few years, two in five or more years, and one had no planned completion date. GAO asked Congress to consider requiring major agencies to develop modernization plans for their most critical legacy systems; as of February 2026 no legislative action had occurred.[^c01-gao25-page]

GAO names four ways legacy systems hurt an agency: security risk, unmet mission needs, a shortage of staff with specialized skills, and increasing cost. On skills it is specific: agencies have had difficulty finding employees who know older languages such as COBOL and may have to pay a premium for specialized staff or contractors.[^c01-gao25] Those four are the same pressures a triage rubric has to weigh, and [Chapter 02](02-triaging-the-portfolio.md) turns them into scored criteria.

Two features of these reviews matter for how an agency responds.

- **They measure the top of the list, not the list.** Eleven systems at $754 million a year are a small share of $83 billion in operations and maintenance. The bulk of the spending sits in thousands of ordinary mission applications, none of them critical enough to make a GAO list and all of them aging. A program built only for the flagship systems leaves most of the cost where it is.
- **The gap GAO keeps finding is planning, not technology.** The three key elements GAO looks for in a modernization plan are milestones, a description of the work necessary to modernize, and details on the disposition of the legacy system.[^c01-gao25] None of them is a technology choice. All of them have to be decided per system.

## Why big-bang rewrites fail

The intuitive response to an aging portfolio is a replacement program: design the new system, build it, and switch over. Large federal programs that tried this show up repeatedly in GAO's work as efforts that ran for years, were restarted or were abandoned over planning, cost and the time it took to deliver anything. The examples GAO's 2025 report recounts include modernization efforts abandoned over project planning, high costs and the length of time to deliver capabilities, and investments that took more than a decade to complete partly because they weren't organized into manageable segments, contrary to OMB policy that requires that approach.[^c01-gao25]

The reasons are structural, and they apply to an application of any size:

- **Value arrives only at the end.** A rewrite delivers nothing until cut-over. Users wait years for anything new, and the business case is tested only when most of the money is spent. Martin Fowler's account of incremental replacement makes this point, and adds that existing behavior is hard to specify and much of it may not be wanted, so rebuilding it exactly wastes effort.[^c01-fowler]
- **The specification is the old system.** A legacy application's real requirements are in its code, its data and the workarounds its users have built. A rewrite has to rediscover them all before go-live; an incremental replacement discovers them one piece at a time and learns as it goes.
- **Risk is concentrated in one cut-over.** Replacing the whole system at once means one high-stakes switch with no easy way back. Replacing small components carries less risk each time.[^c01-fowler]
- **The world moves during the build.** A program that takes a decade to deliver ships technology chosen a decade earlier.

Federal policy already points the other way. OMB Circular A-130 tells agencies to "structure acquisitions for major IT investments into useful segments, with a narrow scope and brief duration," to reduce risk and better match mission need with current technology, and expects modular contracts to be awarded within 180 days of solicitation and IT to be delivered within 18 months.[^c01-a130] The Federal Acquisition Regulation implements the modular contracting statute, 41 U.S.C. 2308, by saying agencies should use modular contracting for major IT systems to the maximum extent practicable, in increments that each deliver a workable system and don't depend on a later increment to perform their main functions.[^c01-far39] The policy doesn't forbid replacing a system. It requires that replacement come in pieces that each stand on their own.

The alternative this book recommends for applications that must change is incremental replacement behind a stable interface, the strangler-fig pattern, described in [Chapter 03](03-the-target-reference-architecture.md). But most applications in a portfolio shouldn't be rewritten at all, which is the larger point.

## The unit of decision is the application

A portfolio-wide modernization program still has to decide what happens to each thing in the portfolio. The question is what "thing" means. Three candidates are common, and only one works.

| Unit | Why it is tempting | Why it fails as the unit of decision |
|---|---|---|
| The program or mission area | Matches how budgets and executives are organized | Too coarse: one mission area holds applications that should be retired next to ones that should be rebuilt |
| The platform (the mainframe, the Oracle estate) | Matches how infrastructure is contracted and how its costs are seen | Treats a hundred different applications as one; the platform can't be retired until every application on it has a decision |
| The application | Matches how users, data owners, authorizing officials and code are organized | Works: each has a mission owner, a data set, a code base, dependencies and an authorization boundary to decide about |

Federal policy is already organized around systems and their disposition. A-130 requires agencies to maintain an inventory of their major information systems, and to develop an enterprise architecture with a baseline, a target and a transition plan that "should incorporate agency plans for significant upgrades, replacements, and disposition of information systems."[^c01-a130] It requires that unsupported systems and components be "phased out as rapidly as possible," with migration planning built into planning and budgeting for every system.[^c01-a130] GAO's third key element is a disposition for each legacy system. Each of these is a decision about one system at a time.

The program's design is to make that decision explicitly for every application in the inventory, using one of six dispositions:

| Disposition | What happens to the application | Where this book covers it |
|---|---|---|
| Retire | Switched off; its records are kept or transferred as records rules require; its function is dropped or moved to another system or a commercial service | [Chapter 02](02-triaging-the-portfolio.md) |
| Retain | Kept as it is, on purpose, with a date to look again | [Chapter 02](02-triaging-the-portfolio.md) |
| Rehost | Moved to new infrastructure without code changes | [Chapter 02](02-triaging-the-portfolio.md) |
| Replatform | Moved with limited changes, such as a new database engine, runtime or container | [Chapter 02](02-triaging-the-portfolio.md), [Chapter 04](04-moving-the-data.md) |
| Refactor | Restructured onto the target architecture, piece by piece, behind a stable interface | [Chapter 03](03-the-target-reference-architecture.md), [Chapter 04](04-moving-the-data.md) |
| Rebuild | Written again on the target architecture, still delivered in increments | [Chapter 03](03-the-target-reference-architecture.md) |

The names come from a vocabulary the industry has used since Gartner's five migration options of the early 2010s, which AWS dates to 2011; AWS and Microsoft now publish their own lists of seven and eight options.[^c01-aws6rs] [Chapter 02](02-triaging-the-portfolio.md) traces the names and explains why this book uses six.

Three consequences follow from deciding per application.

- **Most of the portfolio doesn't need engineering.** Retire and retain are decisions, not projects. In any large portfolio a share of applications has few users or duplicates another, and retiring them is the cheapest modernization there is. Others are stable, supported and doing their job, and retaining them on purpose frees money for the applications that need it.
- **The ones that do change share one target.** If every refactor or rebuild chooses its own stack, the agency trades one legacy problem for many new ones. The book's position is a single reference architecture for applications that change: Java and Spring Boot services, React front ends, Node.js where it fits, API-first contracts, containers ([Chapter 03](03-the-target-reference-architecture.md)).
- **A decision is evidence.** A recorded disposition, with the scores and the owner who agreed to it, is what an enterprise architecture's transition plan, a capital planning review and a GAO audit all ask for. The decision record is an artifact, not a meeting.

## The book's argument

Book 18 answers one question: **why is application modernization a portfolio decision, not a rewrite?** The argument runs in four steps, which map to the four parts of every book in this workbook.

| Part | The question | The answer in this book | Chapters |
|---|---|---|---|
| Why | Why treat modernization as a portfolio, not a program of rewrites? | Because the problem is thousands of applications in different conditions, and federal policy asks for system-by-system disposition delivered in useful segments | 01 |
| What | What should each application become, and what do the ones that change get built on? | Triage into six dispositions with a scored rubric; one target reference architecture; data moved off DB2 and Oracle with proof that nothing was lost; generative and agentic AI only with an identity and an owner for every agent; compliance designed in | [02](02-triaging-the-portfolio.md), [03](03-the-target-reference-architecture.md), [04](04-moving-the-data.md), [05](05-generative-and-agentic-ai.md), [06](06-compliance-by-design.md) |
| Who | Who decides, and who governs the architecture over time? | An architecture review board with clear decision rights, approved standards and patterns, and review gates that produce the evidence compliance needs | [07](07-who-governs-the-architecture.md) |
| How | How does an agency run it at scale? | A small reference implementation to copy; the work mapped to TOGAF and Zachman so enterprise architects can place it; and the portfolio run in waves, from a pilot through a modernization factory to the long tail | [08](08-the-reference-implementation.md), [09](09-togaf-and-zachman.md), [10](10-running-the-portfolio-in-waves.md) |

The rest of the book is written for two readers at once. Solution architects need the dispositions, the reference architecture, the data migration patterns and the review gates in enough detail to use them. Executives need to know which decisions are theirs, what each one costs and what evidence they should expect to see. Each chapter ends with what leadership should take from it.

## Honest limits

- **GAO's figures are government-wide and self-reported.** The ages, costs and plan assessments come from what agencies reported to GAO, and the 79 percent figure comes from the IT Dashboard's planned spending. They describe the federal government as a whole. They don't describe any single agency's portfolio, and an agency should measure its own.
- **Not every rewrite fails.** A small, well-understood application with few integrations can be rebuilt and switched over in one step; Chapter 03 notes when the incremental pattern doesn't fit. The argument is against making the whole-system rewrite the default.
- **The six dispositions are the program's vocabulary.** Federal policy requires a disposition for legacy systems and an architecture with a transition plan. It doesn't prescribe these six names, and an agency that already uses the AWS or Microsoft list can map one to the other.

## What leadership should take from this

1. **Ask for the inventory before the program.** The first deliverable of any modernization effort is a list of applications with an owner and a proposed disposition for each, not a target-state design.
2. **Fund decisions as well as projects.** Retiring and retaining on purpose are the cheapest modernization moves available, and they need a decision process, not an engineering budget.
3. **Insist on useful segments.** Any proposal that delivers nothing until a single cut-over runs against A-130 and the modular contracting rules, and against most of the federal record.

[Chapter 02](02-triaging-the-portfolio.md) builds the triage that produces those decisions.

::: {.callout-tip}
## Continue the book
[Book index](index.md) · [Next: Chapter 02 — Triaging the Portfolio →](02-triaging-the-portfolio.md)
:::

[^c01-gao25]: U.S. Government Accountability Office, GAO-25-107795, *Information Technology: Agencies Need to Plan for Modernizing Critical Decades-Old Legacy Systems*, July 17, 2025, Highlights and pages 1–10 and 18–22, <https://www.gao.gov/assets/gao-25-107795.pdf> (accessed Oct 28, 2026).
[^c01-gao25-page]: U.S. Government Accountability Office, GAO-25-107795 product page, "What GAO Found" and "Recommendations" (matter for congressional consideration; status as of February 2026), <https://www.gao.gov/products/gao-25-107795> (accessed Oct 28, 2026).
[^c01-gao19]: U.S. Government Accountability Office, GAO-19-471, *Information Technology: Agencies Need to Develop Modernization Plans for Critical Legacy Systems*, June 11, 2019, product page summary, <https://www.gao.gov/products/gao-19-471> (accessed Oct 28, 2026).
[^c01-fowler]: Martin Fowler, "Strangler Fig," August 22, 2024, <https://martinfowler.com/bliki/StranglerFigApplication.html> (accessed Oct 28, 2026).
[^c01-a130]: Office of Management and Budget, Circular A-130, *Managing Information as a Strategic Resource* (2016 revision), §5.a(1)(a), §5.a(2), §5.a(3)(f) and §5.d(1)(f)–(g), <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf> (accessed Oct 28, 2026).
[^c01-aws6rs]: Stephen Orban, "6 Strategies for Migrating Applications to the Cloud," AWS Cloud Enterprise Strategy Blog, November 1, 2016, <https://aws.amazon.com/blogs/enterprise-strategy/6-strategies-for-migrating-applications-to-the-cloud/>; AWS Prescriptive Guidance, "About the migration strategies," <https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html>; Microsoft Learn, Cloud Adoption Framework, "Select your cloud migration strategies," <https://learn.microsoft.com/azure/cloud-adoption-framework/plan/select-cloud-migration-strategy> (all accessed Oct 28, 2026).
[^c01-far39]: Federal Acquisition Regulation, 48 CFR 39.103, "Modular contracting," paragraphs (a)–(c), FAC 2026-01, effective March 13, 2026, <https://www.acquisition.gov/far/39.103> (accessed Oct 28, 2026).
