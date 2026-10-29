# Book 18 — Application Modernization — narration script (practice copy)

## Slide 1 — Application Modernization: the executive briefing

Welcome. This is the executive briefing for Book 18 of the Federal Modernization Workbook, Application Modernization. It's for the people who make the calls: the CIO, the chief architect, portfolio owners, the CISO, the privacy officer, authorizing officials and sponsors. The argument is simple. An agency with thousands of legacy applications can't rewrite its way out. It decides, one application at a time, what each one becomes, and builds the ones that change on one architecture, with the data proven and the AI owned. I'll take four questions: why, what, who and how. Each decision slide names the decision, its owner and when it's needed. Let's start with where the money goes.

## Slide 2 — Most IT money keeps existing systems running

This matters because most of the IT budget is already spoken for. G A O puts federal IT spending above a hundred billion dollars a year, and about eighty percent of it keeps existing systems running. That share has barely moved in six years. G A O's lists of the most critical legacy systems get the headlines, but eleven systems are a small slice of that cost. The bulk sits in thousands of ordinary applications, all of them aging. And the gap G A O keeps finding isn't technology. It's planning, decided one system at a time. So why not just replace them all?

## Slide 3 — Big-bang rewrites fail; policy asks for segments

Because big rewrites keep failing, and for structural reasons. Value only arrives at the end. The real specification is buried in the old code and in its users' workarounds. And all the risk lands on one cut-over, with no easy way back. Federal policy already points the other way. Circular A one-thirty asks for useful segments with a narrow scope and a brief duration, and modular contracting asks for increments that each work on their own. So the decision belongs to the CIO, who approves the contracts: no proposal that delivers nothing until a single switch. If not the whole program, what's the unit?

## Slide 4 — The application is the unit of decision

The unit of decision is the application. A mission area is too coarse, and a platform can't be retired until every application on it has been decided. An application has an owner, a data set, a code base and an authorization boundary, so it's something you can actually decide about. The figure shows the whole argument: triage every application, leave many of them alone on purpose, and build the ones that change on one target, governed and run in waves. That makes the first deliverable an inventory, with an owner and a proposed disposition for each application, not a target-state design. Next, the six choices.

## Slide 5 — Six dispositions, cheapest first

Every application gets one of six dispositions: retire, retain, rehost, replatform, refactor or rebuild, in rising order of cost and risk. The rule is the cheapest one that meets the mission need, and every step up has to be justified. Here's the highpoint. Two of the six, retire and retain, aren't projects at all. They need an owner's decision, not an engineering team, and in most portfolios they're where the early savings are. A portfolio where nothing is retained probably hasn't been triaged. So fund decisions as well as projects, including the decommissioning that makes a retirement real. But how do you decide thousands?

## Slide 6 — Approve the rubric, not each decision

You can't study thousands of applications one by one; the studies would outlive the systems. So triage is a scored rubric, filled from data the agency mostly already holds, like each system's security categorization, its support dates and its costs. A decision table proposes a disposition, and the owners confirm or contest it. Only the high-stakes and disputed cases get a deep study, which is how a rubric stays careful at scale. It's program design, calibrated first on applications your architects already know well. Leadership's job is to approve the rubric once, then rule on what it sends up. Now, where the changed applications land.

## Slide 7 — One target architecture, and a budget to keep it current

If every project picks its own stack, you trade one legacy problem for hundreds of new ones. So the applications that change land on one reference architecture: Java and Spring Boot services, React front ends, published A P I contracts, and containers. These are the program's choices, not a federal rule, picked for long support and a big labor pool. The catch is that stacks age fast; some frameworks get only about a year of open-source support per release. So approve one target and a way to change it, with the chief architect owning the list and upgrades budgeted as recurring work. How do you get there without a rewrite?

## Slide 8 — Replace in increments behind a stable interface

You replace in increments, with what's called the strangler fig. A façade sits in front of the legacy application and routes each request either to the old system or to a new service. Functions move one at a time behind the same contract, until nothing depends on the old system and it can be switched off. Rollback stays possible until the old tables are removed, so that's a deliberate last step. It doesn't fit everything; the requests have to be interceptable. So at design review, ask every refactor to name its façade, its first function, its plan for shared data and when rollback ends. Then, the data.

## Slide 9 — Data moves once, and the move must be proven

Code can move a piece at a time, but data moves once, and data errors hide. A date that lost its time of day may not show up until someone's record is wrong months later. So the move isn't finished until it's proven, three ways, chosen so their blind spots don't overlap: row counts, a checksum over every value, and totals the business recognizes, computed separately on each side. That last one matters, because a program office can judge its monthly totals in a way it can't judge a hash. The decision: no cut-over until the owner and the authorizing official see all three. And during the transition?

## Slide 10 — Coexist without dual writes; settle the engine early

Old and new often run side by side for months, and there's a tempting shortcut: have the application write to both databases. Don't. The two writes don't share a transaction, so under load the copies drift, quietly. Instead, keep one writer per table and replicate from it. One more thing: the target engine decides which conversion tools you can use, and for DB2 the options are narrow. So forbid dual writes as a standard, and settle the engine before the wave plan commits to dates. Now, the newest part of the architecture: AI.

## Slide 11 — AI with an owner: agents read and propose

AI belongs in the architecture as a component behind one interface, so providers and models can change without changing code. Most uses, like drafting text or answering from agency content, change nothing by themselves. Agents are different, because they act. You can't count on a model refusing a hidden instruction, so the design limits what a steered agent can do: an identity and a human sponsor, a short list of allowed tools, a step limit, and an audit of every call. And the big one: no agent writes to a system of record. It proposes, a person approves, and the service applies the change. Next, compliance.

## Slide 12 — Compliance carried by the platform, not each app

Compliance is usually a package assembled at the end. Modernization is the moment to change that, because you're choosing the platform and the pipeline anyway. A control the platform implements once is inherited by every application on it, and a pipeline that keeps its results writes the evidence as it goes. Circular A one-thirty also turns legacy into a compliance question: systems that can't be protected, including unsupported software, get top priority for replacement. So a retained application on unsupported software is a finding. It needs a plan, a risk acceptance and a review date. And two officials need to hear early.

## Slide 13 — Privacy and records come in at design review

Those are the privacy and records officials. Modernization changes how personal information flows, and the events that reopen their work are predictable: a new database, a new data flow, an AI feature, production data copied into test, and retiring a system. Retirement is the sneaky one. Switching off an application is a decision about its records, and a migration that drops history may be destroying records. These judgments can't be automated. So name those events, and route them to the privacy and records officials at design review, before anything is built. That brings us to who governs the architecture.

## Slide 14 — One decider for every architecture decision

A target architecture holds across hundreds of teams only if each decision has an owner. No federal rule demands an architecture review board, but several demand what one produces: an enterprise architecture, and controlled change with security and privacy at the table. The rule here is one decider per decision. The chief architect decides standards and designs. Application owners decide dispositions. The authorizing official alone accepts risk, and observes the board rather than sitting on it. And the CIO, not the board, approves what the agency buys. So the CIO charters the board and names its chair. Then come the gates.

## Slide 15 — Four gates, and each one leaves proof

Every application that changes passes four gates: its disposition, a design review, every pull request, and every release. Two are meetings and two are automation, and that's deliberate. The daily ones run in the pipeline, on protected branches that bind administrators too, because a gate that's run as a meeting gets skipped. Each gate leaves proof, so the evidence builds up as the work happens, instead of screenshots the month before an assessment. One threshold belongs to the authorizing official alone: when a change is significant enough to reopen the authorization. Set it early, and let design review apply it. Now, how it runs.

## Slide 16 — A reference implementation that states its limits

The book ships a small, runnable reference implementation: a case service with a contract test, a front end, a migration tool with all three checks, and an agent that can only propose. Its tests prove the checks by breaking things on purpose. Change one amount, and two checks fail. Truncate one name, and only the checksum catches it. Just as important, it says what it doesn't prove. It has never run against a real DB2 or Oracle database, a real model, or production, and it has no sign-in. So copy the pattern, not the claim. Next, the frameworks your architects already use.

## Slide 17 — TOGAF is the order; Zachman is the checklist

Many architecture offices speak TOGAF or Zachman, so the book maps its work onto both. The short version: TOGAF tells you the order, and Zachman tells you whether you've described everything. But neither one is the requirement. Circular A one-thirty asks for an enterprise architecture with a baseline, a target and a transition plan, and names no framework. The book already produces all three: the triaged portfolio, the reference architecture, and the wave plan. So file those artifacts under the phase and cell your architects know, rather than rewriting them. And don't try to buy compliance with a framework. Now, the waves.

## Slide 18 — Run the portfolio in waves on the program's gates

A disposition for every application is a list, not a plan. Waves turn it into one, inside the program's existing phases and gates. Start with a pilot of a few simple applications, plus one representative hard case, so the first factory wave doesn't meet its first tangled database cold. Group applications by what must move together, especially a shared database. Plan a few waves ahead, but only the next one in detail. And size the waves by the throughput you've measured, not by the schedule. The factory is working if the fifth wave costs less per application than the first. Finally, paying for it.

## Slide 19 — Fund by wave, and measure from records

Waves are also a funding structure: small enough to approve, with results soon enough to show. The Technology Modernization Fund wants proposals that improve, retire or replace systems, aiming for results within a year, and a wave plan fits that shape. Working capital funds let the savings from one wave's retirements pay for the next. Two cautions. Report cost avoided only once the old system is actually switched off. And re-score the portfolio every year, with the budget cycle, so the list stays true. The CIO, who advises on every program, should sign the wave plan. Let's pull the decisions together.

## Slide 20 — Decisions to make, owners and timing

So, the decisions. The CIO approves no rewrite that waits on a single cut-over, charters the architecture board, and signs the wave plan. The program starts with an inventory and an agreed rubric, and application owners sign each disposition. The chief architect sets one target stack, asks every refactor how it will be strangled, forbids dual writes, and makes no-write agents with sponsors the standard. No cut-over happens without three proofs. Unsupported software is a finding with a plan. Privacy and records come in at design review, and the authorizing official decides when a change reopens the authorization. Book 18 has the detail, with every claim footnoted. Thank you.
