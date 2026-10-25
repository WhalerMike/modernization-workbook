# Book 13 — Governance, Drift & Evidence — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Governance, Drift & Evidence: the technical deep dive

Welcome. This is the technical deep dive for Book 13 of the Federal Modernization Workbook, Governance, Drift and Evidence. It's for the people who keep governance true after the audit: governance engineers, platform owners and ISSOs. The whole book comes down to one idea. A package that's assembled by hand starts going stale the day it's signed, so the evidence has to keep arriving, from one record, in a form anyone can re-run. Part 1 builds the record and the engine that watches it. Part 2 is the evidence, the owners, and how authorization uses it. Let's start with why governance decays.

## Slide 2 — Why this matters: a signed package starts aging at once

On the day a package is signed, it's true. The next morning someone fixes an outage, a role ends but the account stays on, a provider ships a new default. None of it reaches the package. The program sees four structural reasons this keeps happening, and none of them is fixed by buying another tool, because each fix sits underneath the tools. Federal policy already points the other way, toward ongoing authorization. What's missing is practice, and NIST is blunt about why: without real automation, you can't get there. So let's name the thing that does the damage. That's drift.

## Slide 3 — Module 1: Drift, the record and change control

Module 1 is the foundation. You can only measure drift against something, and that something only stays trustworthy if every change goes through one path. So we'll cover what drift is, the one record we measure it against, and the path every change has to take.

## Slide 4 — Drift: five sources, silent unless something compares

Drift is any gap between what the record says and what the estate actually does. NIST never uses the word, but its configuration controls, read together, describe exactly this: a baseline, controlled change, and someone checking. Drift comes from five places, and most of them are innocent. An emergency fix nobody wrote back. A provider changing a default. People moving on. The dangerous part is that it's silent. Every system keeps reporting what it was told, so nothing alarms unless something compares. And a configuration that was right at assessment and wrong six months later is exactly what attackers walk through. Next, how the program sorts it.

## Slide 5 — Five drift classes, each a question asked of the record

If you call everything configuration drift, you lose the ability to respond correctly. So the program sorts every finding into one of five classes, each a simple question: is the shape valid, is the value still true, does the change trace to an authorized source, did anything act outside its authority, and does every object resolve to the record. The payoff is in the response. The first two get fixed, at the source, never in the copy. The last three might mean someone acted without authority, so you investigate before touching anything. Now, the record all of this is measured against.

## Slide 6 — One authoritative record: every copy is a pointer

For years the directory tree quietly was the governance model, and migrations lose it. The program's answer is one authoritative record, kept in a governed repository, where every other copy is just a pointer that knows where it came from. Single means logically single; replicas are fine if only one accepts writes. Code follows three simple rules: look it up by reference, never write to it at runtime, and never keep a private copy. That last one is where most real drift starts. And every report carries a provenance block, so you can always ask what the value was on a given date. Next, how the record is divided.

## Slide 7 — Six control planes, cut by authority, not by log source

The record covers six control planes, from identity at the root through addressing, network, telemetry, security and management. They're cut by authority, by who's allowed to say what's true, so every finding has exactly one owning team. And the record doesn't master every fact. HR still owns who a worker is. What the record holds is the authority map: who owns each fact, and who may write the copy. Two rules follow. Corrections always flow upstream. And where the platform says a value is read-only, the record has to know that too. Now, how change gets in.

## Slide 8 — The five-clause path every MACD-R change travels

Most drift isn't malicious. It's a quick fix in the portal or a weekend script with a standing admin account. So every change, whether a move, add, change, deletion or reset, travels the same five steps. It starts from a source of truth, gets approved by the right authority, runs with just-in-time privilege, closes with proof, and emits its own evidence. Skip a step and it isn't a change with missing paperwork; it's a drift finding. Pre-approved lanes are allowed, but they're recorded grants with a scope and an expiry, never the absence of approval. Next, the same path for changing the record itself.

## Slide 9 — Changing the record: the pull request is the authorization

When the record itself changes, the pull request is the approval. It updates the registry, carries a decision record for anything doctrinal, runs its checks before merge, needs a second person, and merges signed, so rollback is just a revert. Most repository platforms can enforce this, with one catch worth knowing: the rules often don't bind administrators by default. Turn that on, or you've built a standing exception. The identity that decides and the identity that acts are kept apart, so neither can finish a job alone. And emergencies get a path, not a pass. Which brings us to closure.

## Slide 10 — No closure counts unless it carries its proof

Here's the strictest rule in the book. If someone clicks complete with nothing machine-readable attached, that's prose, not evidence. Every closure carries the check that proved it. A human-only closure is still allowed, as an escape hatch, but it's flagged and counted separately, never blended into your metrics. And every report is regenerated from the closure stream, never compiled by hand. One practical note: some of the controls this supports, like non-repudiation, are only required at the High baseline, so at Moderate the signing is a choice. That closes Module 1. Next, how we make the evidence checkable.

## Slide 11 — Module 2: Deterministic rules and the drift engine

Module 2 asks the obvious next question. When the program turns the record into a statement about the estate, how does anyone know it's right? The answer is determinism, and the engine that uses it to find, classify and record drift.

## Slide 12 — Determinism, not automation, is what an assessor can check

Automation makes the answer arrive faster. Determinism makes it the same answer no matter who runs it, and that's the only kind an assessor can check without taking your word for it. Same record version, same inputs, same evidence, byte for byte. That sounds easy and isn't: two runs can agree and still serialize differently, so you need a fixed canonical format and a pinned toolchain. The payoff is the picture on the left. The assessor re-runs the window, and if the hashes match, the evidence is verified by reproduction. If they don't, that's a finding in itself. Now, where the rules live.

## Slide 13 — Three rule layers, three change boundaries

The rules live in three layers, and keeping them apart is the point. The first says what a rule means. The second says where it applies. The third is the code that evaluates it. Each has its own reviewer and leaves its own evidence. Why not combine them? Because they change at different speeds, carry different blast radius, and when something drifts you want to know whether the meaning shifted, a mapping broke, or the code disagrees with the rule. And only the runtime is ever allowed to change anything. Next, what rules as code looks like in practice.

## Slide 14 — Rules as code, and where they meet OSCAL's models

Rules as code isn't a new idea. CISA's own secure-configuration tool already works this way: read the tenant, compare against policy written as code, report the result. Collection, decision and reporting stay separate, and the policy is a file you can review. The key property is that evaluation depends only on the rule, the mapping and the collected input. Never on who ran it, or when. On the right, the program lines its artifacts up with NIST's machine-readable package models, so what it produces drops straight into an authorization package. That correspondence is the program's own. Now, the engine itself.

## Slide 15 — The drift engine compares against a versioned record

The drift engine finds the gap between the record and the estate, classifies it and records what happened. The crucial choice is what it compares against: a versioned record, not a last-known-good snapshot. That gives you three things. You can reproduce any finding later. Approved changes don't show up as drift, because they update the record first. And when the estate is right and the record is stale, the engine still raises it, but the fix is a reviewed change to the record. It checks on two clocks: every change to the record, and scheduled reads of the estate. Next, one model for all of it.

## Slide 16 — One drift model: domain checks are instances, not lists

Every earlier book defined its own drift checks, for identity, delegation, HR and so on. They don't compete. Each one is an instance of the same five classes, so a finding means the same thing wherever it came from. One finding is worth calling out: a write to a copy that was supposed to be retired. That's the sign a second source of truth is growing back. And be honest with your assessor about maturity. The model is complete; the engine isn't. Some classes are built, and some are still found by people. Record those in the same shape. Now, severity.

## Slide 17 — Severity sets the clock; the ladder sets who acts

Severity isn't debated; it's looked up, from the class and whether the claim is in use. So two people looking at the same finding always get the same answer. But here's the most common design mistake: treating severity as permission. Severity sets the clock. The actuation ladder sets who may act. A low-severity finding still waits for a person unless its class has been explicitly approved to run on its own, and some kinds of change never qualify. On the right, five things the engine never does, including accepting risk. That ends Part 1. Next, what all this evidence is worth.

## Slide 18 — Module 3: Evidence over attestation, and adapters

Part 2 starts with evidence. We'll look at why system-produced evidence beats a signed statement, exactly what the integrity mechanisms prove, and the adapters that read every platform into one record.

## Slide 19 — Attestation names who's accountable; evidence shows it

A signature tells you who's accountable. It can't tell you whether the claim is still true, and you can't re-run it. Evidence can. The program flips the usual package: evidence becomes the substance, and people sign for the things machines can't decide, like rules, exceptions and accepting risk. This isn't a stretch of federal guidance. NIST already says automated comparison against a desired state counts as assessment results, and FedRAMP tells assessors not to rely on screenshots. Some controls stay human, and the package should say which. Next, the chain that produces the evidence.

## Slide 20 — The evidence chain and the provenance envelope

The evidence chain has four stages: capture a platform's state, normalize it into a common claim, seal a window of claims into a bundle, and emit the package artifacts from that one bundle, so they can't disagree. Every claim carries a provenance envelope. The fields that matter most say whether a value was read from its owner, derived or made up by the program, record every transformation step, and tie the claim to its exact source. One subtle point: a certificate thumbprint only identifies a certificate. It doesn't sign anything. And drift findings ride the same chain. Next, what each integrity check proves.

## Slide 21 — Hash, hash chain, signature: what each one proves

Integrity claims are easy to oversell, so be precise. A hash tells you something changed, but anyone who changed the data can recompute it. A hash chain tells you nothing was removed or reordered. Only a signature tells you who produced it. Together they let an assessor do something an interview never can: re-run a past window and compare. And here's the practical advice. The re-run only counts as independent if the assessor does it, not the operator, so give assessors their own read access to the archived inputs. Now, the adapters that feed all this.

## Slide 22 — Adapters: one platform's dialect into one record

The program doesn't replace your platforms. It reads them. An adapter translates one platform's native state into the common record, so the rules and the drift engine never have to learn a vendor's dialect. Adapters are deliberately narrow: no rules, no decisions, and no edits to the record. There are two kinds. Read-only adapters observe. Change-making adapters act, but only on an authorized plan. They're kept in separate lists on purpose, so the grant of write authority is visible in any change a reviewer looks at. Next, the contract every adapter keeps.

## Slide 23 — The adapter contract, versioning and lifecycle

An adapter is defined by its declaration, not its code, and every one inherits four invariants: stay inside the boundary, never edit the record, emit under its own certificate-backed identity, and refer to real object identifiers. Read-only comes first, but it has to be verified. A tool built to observe can still run under an account that can change things, so compare what the identity is granted with what it declares. Adapters also pin the platform's production API, and earn active status through testing before anyone relies on them. That closes Module 3. Next, the people.

## Slide 24 — Module 4: Who governs, reciprocity and scale

The machine can't decide anything. A drift finding is a question, and someone has to own the answer. So Module 4 names the owners, then shows how one body of evidence serves many agencies and scales across a whole estate.

## Slide 25 — Who governs: five questions, one owner each

Governance decays the same way compliance does. If nobody owns a rule, it goes stale. If nobody signs for an exception, it becomes permanent. So each question gets exactly one owner. Two jobs that are easy to blur are kept apart: the steward keeps the record, but the information owners, like HR or the CISO, decide what the facts mean. A steward who edits a fact to make a finding disappear has made someone else's decision. On the right, who decides each kind of rule change, including the one that matters most: only the authorizing official lets a class of change run without a person. Next, exceptions.

## Slide 26 — Exceptions, the board, and who governs the governors

A finding you can't fix in time isn't quietly closed. It's carried, by a named person, with an end date. A bounded exception is the CISO's call; anything open-ended goes to the authorizing official. Nothing renews automatically, and an exception never edits the rule, so the gap stays visible. The governance board reviews, but it doesn't vote, because a consensus has no one accountable. And because this platform holds the record of what everyone else did, its own separations matter most: no self-approval, assessors who never edit, and an authorizing official who stays outside. Next, the tempo, in brief.

## Slide 27 — Ticket to machine, in brief: the person stops at approval

A platform that detects perfectly but closes slowly just builds an accurate list of things nobody fixed. And sending a person to a console because a ticket said so doesn't help; the closure is still an assertion. So wherever a machine can reach, the ticket authorizes the machine, and the person's job stops at approval. A class of change qualifies only if it passes six tests, and where no machine can reach, the fallback is a recorded, time-boxed session, never a quiet trip to the console. The reference deck walks through the details. Now, reusing evidence across agencies.

## Slide 28 — Reciprocity: one package, each agency's own decision

Twenty agencies assessing the same platform produce twenty snapshots that are all out of date. Reciprocity fixes the duplication, but it's worth being precise about what it means. It's about reusing assessments, not handing off risk. Federal policy now presumes a maintained package is adequate, and asks for more only with a documented reason. But every agency still signs for its own system. So the program's model is one package for a shared service, with each agency's own decision on top, and agencies differing in configuration rather than in packages. Next, how that stays current over time.

## Slide 29 — Ongoing authorization, indicators and signed manifests

Reciprocity reuses one package across agencies. Ongoing authorization reuses it across time, and that's what makes reuse safe. Once the conditions are met, the authorizing official stops working to a termination date and reviews posture on a schedule and on triggers. Everything in this book is what a robust monitoring program looks like when it's actually built. Two cautions. FedRAMP's new security indicators bind cloud providers, not agencies. And proving who produced a bundle takes a real signature, because a shared-key code or a list of hashes can be rewritten. Now, running this at scale.

## Slide 30 — Continuous monitoring run as a chartered project

A real agency has hundreds of systems and several programs at once. The scaling rule is simple: keep the definitions small, and let the uses grow. If every program could invent its own drift class, nobody's numbers would add up. Boundaries are treated the same way, as recorded objects rather than assumptions. And continuous monitoring is run as an actual chartered project, in five phases, each with a clear gate, starting with just two sources and one object class. The risk to plan for is finding more than you can fix. Next, how to report coverage honestly.

## Slide 31 — Coverage, the gap register, and three ways a gap closes

No platform covers every control, and pretending it does just hides risk. So every control gets an honest label: covered, partial, gap or out of scope. Partial is the one most often rounded up, so don't. Every gap goes in a register with an owner and, crucially, the evidence that will prove it closed, named up front. A gap closes one of three ways: fix it, compensate for it, or have the authorizing official accept it. And report counts, proven and asserted, not one tidy percentage, so the decision maker can see the risk they're accepting. Let's wrap up.

## Slide 32 — Decisions to make, and what to start on Monday

So here are the decisions, each with an owner. Charter the board and name the steward. Ratify which sources are authoritative and retire every other copy. Make branch protection bind administrators. Let only the authorizing official decide what runs without a person, and how independent the assessors are. And report coverage honestly. The first steps don't need a new platform: find the private copies, count human-only closures separately, check what your adapters can really do, and open the gap register. Governance that doesn't decay is governance whose gaps are written down, owned and proven. Thank you.
