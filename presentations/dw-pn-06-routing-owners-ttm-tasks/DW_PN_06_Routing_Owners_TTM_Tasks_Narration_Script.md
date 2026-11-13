# Building Provider Notices, Chapter 06 — Routing to Owners and Ticket-to-Machine Tasks — narration script (practice copy)

## Slide 1 — Chapter 06: Routing to Owners and Ticket-to-Machine Tasks

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 6: routing to owners, and Ticket-to-Machine tasks. A notice nobody owns is a notice nobody reads, so routing gives each one an owner once, and never twice. We'll start from the Ticket-to-Machine pattern and its finding contract, see what they leave to you for provider notices, then read the routing file, the task payload and the state that makes the router de-duplicate across runs. Then two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.

## Slide 2 — Why every notice needs an owner, once

Why route at all? Because a notice nobody owns is a notice nobody reads. The collectors in Chapters 1 to 5 fill one record for every provider; this chapter turns the ones that need action into work with a named owner, and does it exactly once. By the end you can write and check a routing file, route a collection as a dry run, read every payload it would send, and explain two behaviors that matter in production: why a second run writes nothing, and why a task closes only when the agency re-reads, not when the provider says it's done.

## Slide 3 — Today's intake, and five providers into one router

Here's where notices go today. Compliance Automation and Day-2 Operations routes Microsoft's service health email to the help desk supervisor, and it's clear that nothing is approved on the strength of an email. There's no owner, no due date and no closure. With the router, every provider, Azure, Microsoft 365 in GCC, Oracle Cloud Infrastructure, AWS and Google Cloud, arrives as the same record, and one routing file decides what becomes a task. Notice that routing calls no cloud at all. It adds no provider fact; it writes down the agency's own decision about who owns what.

## Slide 4 — The pattern: a typed task and its finding contract

The router implements a pattern the workbook already has. Ticket-to-Machine, from Governance, Drift and Evidence, turns a finding into a typed task with an owner, a lane, and a request chain of five clauses: where it came from, who approves, what to do, the re-read check that proves it was done, and the evidence kept. Its finding contract sets four severities and their response windows: immediate, one hour, twenty-four hours and seventy-two hours. Be clear about what those windows are. They're the program's design, not a federal requirement.

## Slide 5 — What the pattern leaves to you, and the verdict

What does the pattern leave to you for notices? A provider's own deadline is a different date from the agency's response window, so the kit keeps them apart. A provider repeats the same notice every week, so the kit keeps state with fingerprints, and an unchanged notice writes nothing. A provider closing its notice isn't the agency's work being done, so a close asks for the re-read. Five providers and six kinds mean many owners, so there's a routing file. And a retirement that names your resources is a contingency plan change. The verdict: keep the contract exactly, and build the rest.

## Slide 6 — The routing file, written at work and checked

The routing is a JSON file the agency writes at work, from the kit's template or from a worksheet with the kit's Copilot prompts, and it stays inside the agency's boundary. The lab's copy uses fictional teams. Each rule has an ID, a match, and a route: task, digest or ignore. A task rule adds a severity, an assignment group, an approver role and whether a contingency review is needed. Matches can be on provider, kind and status, on whether action is required or resources are named, or a pattern on services and regions. And the file is checked before anything runs.

## Slide 7 — Rules in order: first match wins

Order matters, because rules are tried in order and the first match wins. The workbook's design guidance is to put security advisories and retirements before the general rule for anything that needs action. Here are the lab's six rules: security to a security operations team at P2, retirements and maintenance to cloud platform engineering at P3, incidents to the service desk at P2, changes to cloud operations, and one rule that ignores a Microsoft Viva post. Get the order wrong, with a broad rule first, and security advisories land in the general queue.

## Slide 8 — The payload, and two dates kept apart

For each notice that needs a task, the kit writes one ServiceNow-shaped payload, and checks it before it's written. It says whether this is a create, an update or a close, and carries a de-duplication key made of the provider and its ID. It has the severity, priority, response window and assignment group, a description with everything the owner needs, and the Ticket-to-Machine part: the human decision lane and the five clauses. Look closely at the two dates. The response due date is the agency's, from the severity. The action due date is the provider's. Mix them up, and a routine task looks due in a year.

## Slide 9 — Runs and state: new, changed, unchanged, absent

Each run compares every notice with the state. A new open notice gets a create. A changed one, with a different fingerprint or a changed rule, gets an update. When the provider closes it, the task gets a close that asks for the re-read. And if an open notice simply disappears from a provider the kit read this run, it's marked absent, and its task gets an update asking for the same re-read. A provider that wasn't read is never marked absent. Unchanged notices write nothing. And the whole run is a dry run: nothing is sent unless the scheduled run is told to send and the settings allow it.

## Slide 10 — Who writes the routing, who keeps the evidence

Who's involved? The change manager owns this gate, and reviews the routing file and the change records the payloads open. The security officer reviews the security route and keeps the run folders. In the lab's payload, the system owner is the approver, and owns the contingency plan review. And someone builds the ServiceNow side: the endpoint that accepts the payload, whose shape is the agency's and not yet specified here. One rule about where the routing lives: it names owners and assignment groups, so it stays at work. The public repository ships only templates and fictional examples.

## Slide 11 — Lab 1: check the routing; the template is refused

Lab 1 needs PowerShell 7 with Pester, in the kit's folder, against fictional notices and fictional teams. Nothing is sent. The finding contract the router mirrors comes in the same download. Step 1 checks the lab's routing: six rules, in the order they're tried, each with its route, severity and assignment group. Step 2 tries the template exactly as it ships, and it's refused: it still has a placeholder. That's deliberate. The template can't run until every placeholder is filled in at work.

## Slide 12 — Lab 1: collect five providers, then route day one

Step 3 collects every provider from the day-one fixtures: twenty-two notices from five providers, Azure, Microsoft 365 in GCC, Oracle Cloud Infrastructure, AWS and Google Cloud, each valid against the schema. Step 4 routes them as a dry run. All twenty-two are new. Twelve route to a task, nine go to the digest only, and one is ignored, the Microsoft Viva post. So the run writes twelve create payloads, each with its severity and assignment group, and the last line says it: nothing was sent.

## Slide 13 — Lab 1: one payload, read in full

Step 5 reads one payload: the Azure retirement from Chapter 1. It's a create, with the de-duplication key. It's P3, so the response window is twenty-four hours and the response is due the next day. But the provider's action date is September 30, 2027, kept in its own field. It's routed to cloud platform engineering, it asks for a contingency review, and it names the controls and indicators it supports. Then the five clauses: the human decision lane, where it came from, the system owner as approver, what to do, the re-read check, and the evidence kept.

## Slide 14 — Lab 1: a re-run writes nothing; week two

Step 6 routes the same collection again, on a copy of the state. All twenty-two are unchanged, so nothing is written: no payloads, because nothing new or changed needs a task. That's what keeps the queue readable. Step 7 collects and routes the second week. Two notices are new, six changed, fifteen unchanged, and one is no longer listed. The router writes just six payloads: one create, four updates and one close. The routing hasn't changed, so the same twelve notices route to tasks, but only the six with something new to say make a payload.

## Slide 15 — Lab 1: what each payload is for; the tests

Step 8 reads what each of the six payloads is for. Two rescheduled maintenance windows, one Azure and one Oracle Cloud, and an updated Microsoft 365 post are updates. The Azure incident the provider no longer lists is an absent update, asking for the re-read. The new Microsoft 365 post is a create. And the AWS security notification that AWS closed is a close, which also asks for the re-read. Step 9 runs the router's tests, including the one that reads the finding contract: thirty-one passed, none failed. Then delete the output folder.

## Slide 16 — Lab 2: one payload to a ServiceNow developer instance

Lab 2 sends one payload to a ServiceNow personal developer instance or a sub-production instance, never production, with an endpoint you build to accept it. Its shape is the agency's, and not yet specified here. Put a token for a test integration user in the environment for this session only, never in a file. Then send the Azure retirement payload through the kit's sender, which posts it as JSON with the token as a bearer token. Open the record and check the assignment group, the priority, the description and the five clauses. Then delete the record, clear the token and delete the output.

## Slide 17 — Federal requirements and the evidence

Here's what the routing proves, against NIST's control catalog. A routing file checked before it runs supports reviewing proposed changes under configuration change control. A task with an owner, a severity and a window for every notice that needs action supports disseminating security advisories and acting on them in set time frames. Reviewing a retirement before it lands also supports impact analysis, and the contingency review supports keeping the contingency plan current. The key security indicators are FedRAMP's, and the mapping is the program's design guidance. The kit's records support these controls; the agency's assessor decides them.

## Slide 18 — Dangers, and the guard for each

What breaks in production? The biggest one: a task resolved because the provider resolved its notice, while the resource still runs the retired product. That's why a close and an absent notice both ask for the agency's own re-read. Ticket the same notice every week and people stop reading the queue. Put a broad rule first and security advisories land in the general queue. Publish the routing and you publish who owns what. Put a token in the settings file and a secret gets filed with the change record. Confuse the two dates, or let the finding contract drift, and priorities stop meaning anything.

## Slide 19 — Done when: the chapter's checklist

Here's what done looks like. The agency's routing was written at work from the template, passes the kit's check, and was reviewed by the change manager, and by the security officer for the security route. Security advisories and retirements route before the general rule. Someone read a dry run's payloads before any were sent. A second run on the same collection writes nothing. Tasks are resolved on the re-read, not on the provider's closure. And the token lives only in the environment of the run that sends. Next, Chapter 7 writes the weekly digest and records every run as evidence. Thanks for watching.
