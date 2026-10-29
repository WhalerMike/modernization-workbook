# Book 18 — Application Modernization — narration script (practice copy)

## Slide 1 — A Portfolio, Not a Rewrite

Welcome. This briefing comes from Book 18 of the Federal Modernization Workbook, Application Modernization. It's written for CIOs and portfolio owners, architects, data teams, ISSOs and authorizing officials. I'll take four questions. Why is modernizing thousands of legacy applications a portfolio decision, not a rewrite? What should each application become? Who governs the architecture? And how do you run it at scale? The short version: decide application by application, build the changed ones on one architecture, prove the data moved, give every AI agent an owner, and let the review gates write the evidence. Let's start with where the money goes.

## Slide 2 — Most IT money keeps existing systems running

This slide matters because it shows the size of what we're deciding about. Year after year, about eighty percent of federal IT spending goes to keeping existing systems running, and that share has hardly moved in six years. When G A O ranked the most critical legacy systems, the striking finding wasn't the technology. It was planning. Most had no complete plan, and the missing pieces were decisions made one system at a time: milestones, the work, and what happens to the old system. And those flagship systems are only the top of the list. Most of the cost sits in thousands of ordinary applications. So why not just replace them?

## Slide 3 — Big rewrites fail, and policy asks for segments

The grand rewrite is the obvious answer, and the federal record says it rarely ends well. A rewrite delivers nothing until cut-over, so users wait years. Its real specification is the old system, buried in code, data and workarounds. And all the risk lands on one switch with no easy way back. Federal policy already points the other way: build in useful segments, each one delivering a working system on its own. That leads to the key idea of the book. The unit of decision is the application, because that's where the owner, the data, the code and the authorization boundary actually live. So how do you decide, thousands of times?

## Slide 4 — Triage every application into one of six

Here's the heart of the method. A study per application would take longer than most applications have left, so triage is a rubric applied to data the agency already holds. Every application gets one of six dispositions, from retire and retain up through rehost, replatform, refactor and rebuild, and it gets the cheapest one that meets its mission need. A simple table of rules proposes the answer, owners confirm or contest it, and deep study is kept for the high-stakes and disputed cases. The big surprise for most leaders is that retire and retain are decisions, not projects, and that's where the early savings are. Then, what do the changed ones become?

## Slide 5 — One target architecture, replaced piece by piece

If every refactor picks its own stack, the agency just trades one legacy problem for many new ones. So the applications that change land on one target, reviewed and authorized once. The book's choices are mainstream and long-supported: Java services, React front ends, published A P I contracts and containers. They're design guidance, not a federal rule, and an agency can substitute its own list. Two things to remember. The stack ages fast, so budget for upgrades as recurring work. And a refactor happens piece by piece: a façade sends each request to the old system or the new one, until nothing depends on the old one. The hardest part, though, is the data.

## Slide 6 — Move the data once, and prove nothing was lost

Data is where modernization loses the most trust, because a missing row or a lost time of day may not surface until someone's record is wrong months later. Code can move a piece at a time, but data moves once, and the move isn't done until you can prove nothing was lost. The book's answer is three independent checks: counts, a checksum, and totals the business recognizes. No single check is enough, because each one shares an assumption with what it's checking. And while old and new run side by side, each table has exactly one writer. Writing to both databases is a plan for drift. Next, the newest part of the architecture: AI.

## Slide 7 — AI joins with an identity, an owner and no write power

AI belongs in the architecture the same way any component does: behind one interface, with its output checked rather than trusted. An agent is different, because it acts, so it needs what any actor needs: an identity, a person who answers for it, limited permissions and an audit trail. The design can't count on the model refusing bad instructions, since there's no fool-proof defense against prompt injection. So the guardrails sit outside the model, and the rule is simple: no agent writes to a system of record. Agents read and propose, people approve, and services apply the change. Now, how does all of this stay compliant?

## Slide 8 — Compliance by design: the platform carries controls

Compliance usually arrives as a package assembled at the end. Modernization is the one moment that can change, because you're choosing the platform and the pipeline anyway. A control the platform carries once is inherited by every application on it, and a pipeline that keeps its results produces evidence without anyone collecting it. Two more points. Legacy is itself a compliance matter: an application kept on unsupported software needs a plan, a risk acceptance and a date. And privacy and records officials come in at design review, when a new data store, a new flow or an AI feature first appears. So who makes all these calls?

## Slide 9 — One owner per decision, four gates per change

An architecture only holds across thousands of applications if every decision has an owner and every change passes the same few gates. In the book's design, the review board reviews; it doesn't vote. The chief architect owns standards, the application owner owns the disposition, the authorizing official alone accepts risk, and the C I O approves what the agency buys. Every change passes four gates. The first two need human judgment, once per application. The last two run automatically, many times a day, in the pipeline. And every gate leaves evidence behind, so the authorization package is assembled from proof that already exists. Let's see it running.

## Slide 10 — A reference implementation you can run

Arguments about architecture are cheap; code that runs is not. So the workbook ships a small reference implementation: one mission application in miniature, with a service, a front end, a migration tool and an AI agent. Each part shows a pattern from the book. A test keeps the A P I contract and the code from drifting apart. The migration tool proves every load three ways, and its tests break a value on purpose to show the checks catch it. The agent can only file proposals a person approves. It's honest about its limits, too: it's illustrative, and it hasn't been run against a real D B two or Oracle database. How does this fit an architecture office?

## Slide 11 — TOGAF gives the order; Zachman, the checklist

Many agencies have an enterprise architecture office that speaks TOGAF or Zachman, and this slide is about not making them translate. TOGAF gives the order to do the work in, and the book's triage, target architecture and wave plan drop straight into its phases. Zachman is a checklist: it shows whether you've described everything, and an empty cell is a question, not a defect. But the federal requirement behind both is the architecture itself, a baseline, a target and a plan to get there. No rule requires either framework. So file the book's artifacts as they are. That brings us to the plan: waves.

## Slide 12 — Run the portfolio in waves

A disposition for every application is a list, not a plan. Thousands of projects can't start at once, and one at a time keeps rediscovering the same problems. Waves solve both. Start with a pilot that includes one genuinely hard application, so the first real wave isn't a surprise. Then run factory waves that get cheaper each time, and actually switch the old systems off. Waves are also how you fund the work: one wave's retirement savings can pay for the next. Size waves by what the factory really delivers, not by the schedule, and count savings only once the old system is off. So, what should you decide?

## Slide 13 — Decisions to make, and next steps

So, four decisions. Ask for the inventory before the program: an owner and a proposed disposition for every application. Approve the rubric once, rather than each decision, and fund the retirements. Before any cut-over, ask to see the three proof results, and forbid dual writes. And make sure every AI agent has a sponsor and no power to change a record on its own. The next step is small. Score a pilot set of applications your architects already know well, calibrate the rubric against their judgment, and pick a first wave with one hard case in it. Book 18 has the detail, every claim footnoted. Thank you.
