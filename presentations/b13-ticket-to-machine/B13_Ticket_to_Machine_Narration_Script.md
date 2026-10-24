# Book 13 — Ticket-to-Machine Reference — narration script (practice copy)

## Slide 1 — Book 13 — Ticket-to-Machine Reference

Welcome to the Ticket-to-Machine Reference, Appendix B of Book 13 in the Federal Modernization Workbook. Chapter 10 makes an argument about operational tempo; this appendix is the reference that backs it up. Over the next twelve minutes we'll walk the loop, the five clauses every change passes through, the lanes each kind of change takes, the clocks, the evidence record, and four worked examples. One caution up front: the lanes, ceilings, severities and windows are the program's design, not federal requirements, and the examples are illustrative. Let's start with why any of this matters.

## Slide 2 — A ticket is evidence only when a re-read proves it

Here's the idea the whole appendix rests on. A ticket that sends a person to a console doesn't prove anything; it just changes who's to blame. The person does the work, replies "done," and the record holds a claim. Now flip it: the person approves, a machine runs a versioned plan under its own identity, and a re-read proves the result. The person keeps the one job a machine can't do, which is to decide. And this matters because a platform that finds drift perfectly but closes it slowly is just documenting neglect. So what does the machine path look like end to end?

## Slide 3 — The coordination loop: five steps, native surfaces

It's a loop of five steps. A rule tests actual state against the record, a difference becomes a typed finding, the finding becomes a task with an owner and a clock, the change runs on the platform's own surface, and a re-read closes it with evidence. The important part is what the coordination layer doesn't do: it never makes the change itself. Its job is to make every drift owned, clocked, approved and proven. Federal policy is heading the same way for cloud providers, and the program applies that logic to an agency's own estate. Inside that loop, every request runs a chain.

## Slide 4 — The five-clause request chain

Every governed change, whether it's an add, a move, a deletion or a reset, passes the same five clauses, in order. It has to trace to a real origin, carry an approval from someone who isn't the requester, run under a short-lived scoped role, prove its result with a re-read, and write its own evidence. If any clause fails, the chain stops, and the task isn't treated as closed. And here's the highpoint: a refusal is recorded just like a success, so a blocked self-approval becomes evidence too. Next question: who approves what? That's where the lanes come in.

## Slide 5 — Five lanes: who approves, what runs, what it proves

Every kind of change takes one of five lanes, and the lane settles three things: who approves, what actually runs, and what evidence comes out. Two lanes run on machines. The gated lane, where a named person approves each instance, is the default. The autonomous lane is only for narrow, low-risk classes the authorizing official has accepted in writing, ahead of time. Then there's a human-decision lane, a protocol lane with no ticket at all, and the declared exception for when no machine can reach. Remember, this is the program's design. So which changes land where?

## Slide 6 — Change classes to lanes: drift, patching and access

Before any class goes to a machine, it has to pass six tests from Chapter 10: reachable, deterministic, bounded, reversible, verifiable, and not on the permanently-gated list. With that filter in place, the starting assignment falls out naturally. Routine configuration drift and patching run on machines behind an approval. Anything critical, or anything touching authorization or provenance, halts and goes to a person. Access requests ride the five clauses, and an idle entitlement goes to its owner to decide first. An agency tunes all of this in its own record. Here's the rest of the table.

## Slide 7 — Change classes to lanes: big changes, records, exceptions

The second half covers the changes that need the most care. Anything with a big blast radius, like a tenant-wide role or a Conditional Access change, stays gated permanently, however mature the program gets. Changes to the record itself are always a human decision through review. Routine certificates run on protocol, and emergencies act first and record afterward. Two rules hold across all of it. A machine never edits the record to make drift disappear, and no gap quietly goes to a person at a console. Now let's look at drift from the other side, by class.

## Slide 8 — Drift classes and their default lanes

Drift comes in five classes, and each has a default lane. A schema problem, where the format's wrong, can often be fixed by a machine. Provenance and authorization drift are different: when the claim is in active use, the run halts and a person decides. Semantic and identity drift usually need human judgment too. The honest limit here is that the classes whose fixes depend on context reach a person more often, and that's by design, not a failure. Which brings us to the clock: how fast does each finding have to be handled?

## Slide 9 — Severity and tempo: four windows

The tempo puts a clock on every severity. Critical findings never get a machine fix; the run halts and a named person decides immediately. High findings get an hour, medium a day, and low three days. These windows bound the response, not the drift itself; a program with no findings is more likely blind than clean. Two things to remember. Automatic fixes hold only for classes accepted in advance. And when an outside clock is shorter, like CISA's vulnerability timelines or the one-hour incident notice, the outside clock wins. So how does leadership know it's working?

## Slide 10 — What the tempo shows leadership: five measures

These five measures belong to leadership, not just operations. How much of the estate can we even see? Do findings close inside their windows? How often does a person have to step in? What share of closures did a machine do? And how many tasks still have no machine at all? Each bad value tells you something specific, like manual work quietly becoming permanent. The good news is that none of this needs round-the-clock staffing. What it does need is named people in the escalation roles, because tooling can't create authority. Now, what does all that work leave behind?

## Slide 11 — The evidence record: one shape for every lane

It leaves one record, in one shape, whatever the lane. A machine fix, a recorded human session and an automated certificate renewal all fill the same fields: where it came from, who owned it, who approved it, what identity ran it, what ran, and what the re-read showed. That's the point. Nobody assembles evidence by hand at audit time, and an assessor reads one format whatever the platform, and checks four things: a prior approval, a controlled artifact, a logged execution and a result they can re-test. Even the human session lane fills the same fields, just with a recording where the run log would be. To make this concrete, let's walk through some examples.

## Slide 12 — Worked examples: a drifted setting and an access request

Here are the first two examples, both invented to show the pattern. In the first, a sharing setting drifts to allow anonymous links. The authorizing official has accepted that one narrow fix in advance, so the machine restores it, re-reads it, and closes the task with one record, with no one waiting on an approval. If it drifts again, that's a question for the steward, not another silent fix. In the second, an access request walks all five clauses, and the role is granted as eligible, not standing. What happens when a machine shouldn't, or can't, make the fix?

## Slide 13 — Worked examples: an unknown issuer and no actuator yet

These two show the harder paths. In the third example, the inventory finds a certificate from an issuer nobody approved. There's no automatic fix, because replacing it blindly could break whoever depends on it. The PKI owner decides to replace it through the approved issuer and block the rogue one, and then the gated lane does the work. In the fourth, an old appliance has only a console, so no machine can reach it. The owner approves a short, recorded session with a compensating control and an end date. It's visible, approved first and temporary. Certificates deserve a closer look of their own.

## Slide 14 — The certificate exception: volume rules out a ticket

Certificates are the deliberate exception, and the reason is volume. Public TLS lifetimes are shrinking from three hundred ninety-eight days to forty-seven by 2029, so renewals come continuously. Putting each one through an approval wouldn't add rigor; it would just teach approvers to click yes without reading. So routine renewal runs on protocol and renewal engines, with policy partly living in DNS. The anomalies still come through the front door, like a new issuing authority or an unknown issuer, because they're rare and they need a person. Speaking of the front door, there should only be one.

## Slide 15 — One front door for detection tools

Lots of tools detect problems: posture engines, scanners, entitlement tools, certificate inventories. The rule is simple. Each one is a detection engine feeding the one coordination layer, never a second queue of its own. That way an over-privileged role and an open storage account land in the same place, under the same five clauses, and access requests from a governance front end close the same way too. Two cautions keep this honest: check each tool's real platform coverage, since on-premises virtualization kept coming up as a gap, and give the alternatives a fair build-or-buy look. So where does this pattern break?

## Slide 16 — Failure modes from a reference implementation review

This slide is worth slowing down on, because every row is a way the pattern fails while looking correct. A security review of a reference build found origins that weren't checked, commands built from unescaped strings, input that could swap the target, a password crossing a queue in plain text, a leg that treated "sent" as "done," and tests that never touched the risky path. Each fix became a design rule. The lesson is humbling: tests prove only the refusals they test, and a reference build is a starting point, not proof. So, what's left to decide?

## Slide 17 — What to decide, and where to read next

The reference leaves a short list of decisions to the agency. Which narrow classes, if any, the authorizing official accepts for autonomous closure. Who actually holds the escalation roles. How classes map to lanes in your own record. What targets you set for the five measures. And an end date for every declared exception. For the full argument, read Chapter 10, then the drift engine, the evidence chapter and the control mapping in Appendix A. Thanks for watching. Remember: a ticket is evidence only when it authorized something that ran, and a re-read proved it.
