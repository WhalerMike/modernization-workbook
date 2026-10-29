# Book 18 — Application Modernization — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Application Modernization: the technical deep dive

Welcome. This is the technical deep dive for Book 18 of the Federal Modernization Workbook, Application Modernization. It's for architects, application and data engineers, database administrators and system security officers, the people who decide what each legacy application becomes, then build it, move its data and prove it. The book's idea is simple: modernization is a portfolio decision made one application at a time, not one giant rewrite. Part 1 is deciding and designing. Part 2 is governing and running. One note before we start: product versions here are as of late October 2026, and they move. Let's begin with why.

## Slide 2 — Why this matters: a portfolio, not a rewrite

Here's why this matters. Most federal I T money goes to keeping existing systems running, and that share has barely moved in six years. G A O's list of the most critical legacy systems is decades old, and most of those systems lack complete plans. But those few systems are only the top of the list. The real cost sits in thousands of ordinary applications. The tempting answer is a grand rewrite, and the record says it rarely ends well: value arrives only at the end, and all the risk lands on one cut-over. Federal policy already asks for small, useful pieces instead. So, Module 1.

## Slide 3 — Module 1: The portfolio and the triage

Module 1 is about deciding. Before anyone picks a framework, every application needs a decision about what it becomes. We'll look at the six dispositions, the criteria behind them, how they're scored, the rules that turn a score into a decision, and how owners and calibration keep the whole thing honest.

## Slide 4 — Six dispositions, in rising order of cost and risk

The unit of decision is the application, because that's where the owner, the data, the code and the authorization boundary all meet. Each one gets one of six dispositions, listed from cheapest to most expensive, and that order is the first rule: take the cheapest one that meets the mission need. Notice that retire and retain aren't projects at all. They're decisions, and they're where the early savings are. The vendors' lists line up with these, with one deliberate twist: replacing an application with a product counts as retiring it. Next, what we score.

## Slide 5 — Six criteria, each scored from data you already hold

Six criteria drive the triage, and the good news is that you already hold most of the data. Your security categorization, configuration database, spending data, contracts and network flows fill in nearly all of it. Two scoring rules matter. Dependencies tell you the order to move things in, not what they become. And business logic buried in the database counts twice, because it's both a skills problem and a migration problem. Skills, by the way, are about the next five years, not today. Now, how the scores combine.

## Slide 6 — Two axes, a confidence flag, and where the grid points

The six criteria roll up into two axes: how much the mission needs the application, and how healthy it is to run and change. The grid shows where each corner points. Low value? Retire it first. High value and healthy? Keep it, on purpose. High value and unhealthy? Fix the platform or the code, whichever is the real problem. Every score also carries a flag for how far you can trust it: measured, attested or assumed. Mostly assumed means no decision yet. And always prefer what's measured, like usage logs, over what people believe. Next, the rules.

## Slide 7 — The decision table: seven rules, first match wins

This is where scores become a proposed decision. Seven rules run in order, and the first match wins, which keeps the cheapest answer on top. Retire, retain, rehost and replatform come first, and only then refactor and rebuild. The seventh rule is what makes this work at scale. High-impact systems headed for a rewrite, and anything an owner disputes, get a deep study. Everything else gets a decision for the cost of scoring. So thousands of applications get decided, and the real analysis goes where it counts. Next, the people who confirm it.

## Slide 8 — Owner review, the decision record and calibration

The rubric proposes; owners confirm. Each application's mission owner and system owner get a fixed window to agree, or to contest with evidence, and a bad score gets corrected, not argued around. What comes out is a decision record: the disposition, the scores, the rule that fired, the owner's agreement and a review date. That one record serves the architecture plan, capital planning and the auditor. And before you run it across the portfolio, calibrate it on a few dozen applications your architects already know well. That's Module 1. Now, the target.

## Slide 9 — Module 2: The target architecture and the data

Module 2 is about what the changed applications land on, and how their data gets there. One shared target means the platform team, the security team and the authorizing official review one pattern instead of hundreds. We'll cover the layers, the support clocks, contracts and configuration, the strangler fig, and then the hardest part of most refactors: the data.

## Slide 10 — One target: the layers and the program's choices

Here's the target. React front ends that only call A P I's. A thin Node layer where a front end needs one, and a gateway that also acts as the switch for incremental replacement. Java and Spring Boot services that each publish a contract and own their data. And everything in containers on Kubernetes. These are mainstream choices with big labor pools and long support windows, because these business rules will live for decades. And they're the program's design, not a federal rule. An agency built on .NET can keep the structure and swap the list. Next, the clocks.

## Slide 11 — Support windows: build the upgrade cadence in

Versions are a snapshot. Support windows are the real story. Java's long-term releases are supported for years, so build on one and move to the next within a year. Spring Boot is shorter: each recent generation gets only about thirteen months of open-source support, and one generation has already run out. Node and Kubernetes keep their own clocks too. So upgrades can't be left to each project. Build the cadence into the platform and fund it as recurring work, or today's modernized portfolio becomes tomorrow's legacy. Next, the disciplines that hold it together.

## Slide 12 — Contracts first, thin layers, configuration from outside

Three disciplines hold the architecture together. First, the contract comes before the code. Teams agree on the Open A P I document, generate from it, test against it, and publish it so the next team reuses it. Second, keep the thin layers thin. Node serves the front end's needs, and business rules stay in the services, where they're tested once. Third, configuration comes from outside the code. The best test is whether you could publish the code tomorrow without exposing a single credential. Next, how a refactor actually happens.

## Slide 13 — The strangler fig, and the NIST security references

A refactor happens through the strangler fig. Put a façade in front of the legacy application, move one function at a time behind the same contract, retire the old system when nothing depends on it, and finally remove the façade. You can roll back right up until the legacy tables are gone. Before you commit, check that requests can actually be intercepted, and that there's a plan for shared data. Those questions belong in the deep study. And for security, two NIST guides cover microservices and containers. They're guidance, not requirements. Now, the data.

## Slide 14 — Moving the data: convert, move, prove, then cut over

Code can be replaced a piece at a time, but data moves once, and the move isn't done until you can prove nothing was lost. So the program treats it as three jobs: convert the schema, move the rows, and prove the result, looping back on any mismatch. Choosing the engine is usually settled by what you already run. And remember that the engine also decides which conversion tools you can use. If the target is SQL Server, arrive already on Book 6's modern sign-in pattern. Next, where conversions go wrong.

## Slide 15 — Schema conversion: the dangerous conversions succeed

Conversion tools do most of the work, but the dangerous conversions are the ones that succeed. Map an Oracle date to a plain date and you silently lose the time of day. Treat money as floating point and you lose exactness. Oracle treats an empty string as null, and the targets don't. And sequences need to move past the highest key before the first new record. Stored procedures and packages are the long pole. Tools emulate them, but the program treats every emulation call as debt to pay down. Next, the tools themselves.

## Slide 16 — The conversion tools as of October 2026

Here are the conversion tools as of October 2026, as examples, not endorsements. Three facts shape your plan. Only A W S tools convert DB2 to PostgreSQL. Microsoft's assistant targets only SQL Server and Azure SQL. And the newer AI-assisted conversion sends your source code to a model, which puts that model's endpoint inside your migration's boundary. Treat whatever it produces as a draft that a person reviews and the validation tests. So pick the engine with these limits in view. Next, proving the move.

## Slide 17 — Proving nothing was lost: three checks, three blind spots

A migration is finished when you can prove the target holds the same facts as the source, and no single check can do that. So use three with different blind spots: row counts, a checksum over every row, and business totals computed separately in each database. The third one matters most. If your transform drops the time from every date, the checksum still matches perfectly, because it ran after the same mistake. The business totals don't share that mistake. Pick totals the program office recognizes. Next, the switch itself.

## Slide 18 — Cut-over and coexistence: one writer per table

There are three ways to cut over: all at once, in phases, or by running both systems in parallel. All three end at the same gate: three clean validation results and a rehearsed way back. Phases and parallel runs mean both systems live side by side for a while, and here's the rule that matters most: never let the application write to both databases. Those writes drift apart silently. Instead, one system owns each table, and changes are replicated from the log. That's Module 2. Next, Part 2.

## Slide 19 — Module 3: AI, compliance and governance

Module 3 begins Part 2, governing and running. It's about keeping all of this true across hundreds of delivery teams. We'll cover where AI fits and how agents are fenced in, which controls the architecture carries and the evidence they leave, and the review board and the four gates every change passes.

## Slide 20 — Where AI fits, behind one provider-neutral interface

Treat a model like any other component: something behind an interface, whose output gets checked, not obeyed. AI shows up in four ways, ordered by how much each can change, from a drafting feature that changes nothing to an agent that can act through its tools. For retrieval, one rule matters: it searches with the user's own permissions, so it can't surface anything they couldn't open. And everything calls models through one provider-neutral interface, so swapping providers is configuration, not code, and every call is recorded. Next, the agent.

## Slide 21 — Agent guardrails: read, propose, never write

An agent's risk is what it can do, not what it says. And because hidden instructions in a document can steer it, you can't count on the model refusing. So design for a steered agent that still can't do harm. Every agent has an identity and a human sponsor, a short list of allowed tools enforced outside the model, a step limit and an audit trail. The big one: no agent writes to a system of record. It proposes, a person approves, and the service applies the change. And the Model Context Protocol connects tools, but it isn't a guardrail. Next, compliance.

## Slide 22 — Compliance by design: controls across the life cycle

Compliance is cheapest when the platform carries the controls and the pipeline produces the evidence. Implement a control once in the target, and every application on it inherits it. The diagram shows where the controls land, from design through operation, with everything flowing into one authorization record. The table shows the control families application work touches most, and the evidence each should leave. And here's the point for triage: keeping an application on unsupported software with no plan is a compliance finding, not a neutral choice. Next, three design inputs.

## Slide 23 — Secure development, privacy, data and records

Three things usually get reviewed at the end, and should come in at design. Secure development: the federal attestation memo was rescinded, but you're the producer of your own code, so build to the secure development framework and let the pipeline generate the evidence. Privacy: the program names the events that reopen privacy work, like a new data store, a new flow or an AI feature, so the privacy office hears early. And records: retiring a system, or dropping history in a migration, is a records decision. Next, who decides.

## Slide 24 — The architecture review board: one decider each

No rule requires an architecture review board, but several require what one produces: an enterprise architecture, a fit check for each system, and controlled change. The key design choice is one decider per decision. The board reviews; it doesn't vote. The chief architect owns the standards, the application owner owns the disposition, the CIO approves what gets bought, and only the authorizing official accepts risk. The board works through versioned artifacts: a technology list with support dates, runnable patterns, and short decision records. Next, the gates.

## Slide 25 — Four gates, and the evidence each one leaves

Every changed application passes four gates. The first two, the disposition and the design review, are meetings, because they need judgment and happen rarely. The last two, the pull request and the release, run many times a day, so they're automated in the repository and the pipeline. That ratio is deliberate. Run a daily gate as a meeting and teams stop running it. Each gate leaves its own evidence, kept by system, and one rule holds throughout: nothing counts as done unless it carries its proof. That's Module 3.

## Slide 26 — Module 4: Reference implementation, frameworks, waves

Module 4 makes it concrete. We'll look at the small reference implementation that ships with the book, and be honest about what its tests prove. Then we'll place the work in the frameworks architecture offices already use, TOGAF and Zachman. And we'll finish with running the portfolio in waves, and the decisions that belong to each owner.

## Slide 27 — The reference implementation: one application in miniature

Arguments about architecture are cheap; code that runs isn't. So the book ships a small slice of the target: a case-management service, a React front end, a migration tool and a triage agent. It's deliberately small, with synthetic data and no sign-in, so read it as an illustration, not production code. Notice that the service owns its database schema, and the migration tool loads into that same schema. Two choices differ from the target, an older Java and an older contract version, and the book says so plainly. Next, what the code demonstrates.

## Slide 28 — What the code shows: contract, three checks, guardrails

Three parts show the patterns most directly. The service's contract is checked against the code in both directions, so the two can't drift apart without a failed build. The migration tool handles real legacy habits, like padded text and placeholder dates, and refuses to guess at a value it can't map. And the agent can't even start without an owner, and can only ever record a pending proposal. Best of all, the tests break things on purpose, to prove each check and guardrail catches the failure it exists for. Next, the honest part.

## Slide 29 — What was verified on October 28, 2026, and what wasn't

Here's what was actually verified, and what wasn't. The service, the contract and the migration checks all pass against a real PostgreSQL engine. The guardrails hold against a scripted model, though not a real one. But two things are unproven. The migration has never run against a real DB2 or Oracle database, only a stand-in, and the containers were never started. So test against a copy of your real source before relying on it. A production version would add real sign-in, an agent identity, a secrets vault and signed builds. Next, the frameworks.

## Slide 30 — TOGAF: the ADM phases, and the chapters that do them

Many architecture offices think in TOGAF, so the book maps its work onto TOGAF's phases. First, the requirement itself: policy asks for an enterprise architecture with a baseline, a target and a transition plan. It doesn't require any framework. Triage is the business baseline and the options, the reference architecture is the target, and the waves are the migration plan. The gates are implementation governance, and re-scoring the portfolio starts the next cycle. The point is to file what you already produce, not to create new deliverables. Next, Zachman.

## Slide 31 — Zachman: the cells filled, and the gaps that show

If TOGAF tells you the order of the work, Zachman tells you whether you've described all of it. It's a six-by-six grid of questions and perspectives, and it isn't a method. The table shows which cells the book fills, from the executive view of the portfolio down to the running code. Reading it by column shows two gaps: locations and networks, which other books cover, and timing detail like batch windows, which belongs in each design review. An empty cell is a question, not a defect. Now, running it.

## Slide 32 — The waves on the program's phases and gates

A triage gives you a list, not a plan. Waves turn it into one: batches that move through the same steps, each leaving the next cheaper. The portfolio doesn't get its own schedule; it runs inside the program's existing phases and gates, from scoring everything, through building the factory, a pilot and the main waves, to retiring what was replaced. Keep the pilot small, but include one genuinely hard application, so the first real wave isn't a surprise. And size later waves by what the factory has actually delivered. Next, the engine behind it.

## Slide 33 — Move groups, the factory, metrics and funding

Group applications that share a database into the same wave, and keep a ranked backlog several waves deep, with only the next one planned in detail. The factory, meaning the platform, patterns, pipelines and runbooks, is judged by one test: the fifth wave should cost less per application than the first. Report progress from records, not plans. Fund it wave by wave, so savings from retirements pay for the next one. And here's the honest rule: cost avoided is only a forecast until the old system is actually switched off. Let's close with decisions.

## Slide 34 — Decisions, owners, and what to start on Monday

Every decision here has one owner. Leadership approves the triage rules once and settles disputes. Application owners decide dispositions. The chief architect owns the technology list and keeps it current. The security and privacy officials set the controls. The CIO approves what's bought, and only the authorizing official accepts risk. You can start Monday without a new platform: build the inventory, calibrate the rubric, publish the list with end dates, ask for three validation results before any cut-over, and keep agents from writing records. Decide one application at a time, and let the gates write the evidence. Thank you.
