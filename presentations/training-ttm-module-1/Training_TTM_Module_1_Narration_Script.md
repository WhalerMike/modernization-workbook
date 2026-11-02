# Ticket-to-Machine learning path — Module 1: The Loop and the Typed Task — narration script (practice copy)

## Slide 1 — Module 1: The loop and the typed task

Welcome to Module 1 of the Ticket-to-Machine learning path: the loop and the typed task. This path builds the identity half of the Federal Modernization Workbook's Book 13's Ticket-to-Machine loop on two named products: ServiceNow as the front door and the record, and SailPoint Identity Security Cloud for identity governance. They're an example, not an endorsement. This module starts at the guide's Gate 4, because every other gate writes or reads the record that gate defines: the identity finding. You'll map the kit's files to the loop's five steps, learn the finding's data contract, and check payloads on a laptop the way ServiceNow will, before anything reaches an instance.

## Slide 2 — Why a ticket marked done isn't a record

Why start with a record? Picture your agency's service desk. An access ticket closes when a technician types done. Nobody can say who owned the drift, when it fell due, or what the account should look like afterward. Book 13 says an assessor asks four questions about every finding: who owns it, by when, under whose approval, and with what evidence of closure. A ticket closed on done answers none of them; it records a claim. Book 13's answer is a typed task: one record with a class, a severity, an owner, a clock, and an intended state that a later re-read can check. Approval comes in later modules. Every step of the loop writes or reads this record, so it's where you start.

## Slide 3 — What you'll be able to do in Module 1

Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain the loop's five steps and name the file in the kit that performs each one. You'll describe the fields of the identity finding's data contract and what each one is for. You'll validate a finding payload on a laptop, and predict whether ServiceNow accepts it, rejects it or de-duplicates it, and when it falls due. And you'll recognize an intended state that gives the re-read nothing to check. Before you start, read Book 13's Chapter 10 and skim Appendix B. For Lab 1 you need Python, Node.js and a Bash-compatible shell. You don't need a ServiceNow instance or a SailPoint tenant until Lab 2.

## Slide 4 — The loop: five steps, and a layer that never writes

The loop has five steps. One, test: a rule evaluates actual state against the authoritative record. Two, detect drift: a difference becomes a typed finding with a severity. Three, raise a typed task against the reconciled configuration item, with an owner and a clock. Four, actuate on the native surface, under a service identity, through the platform's own interface. And five, close with evidence: re-read the post-change state and write one record of the whole chain. The coordination layer in front of the native tools never writes the configuration itself. Its job is to make every drift an owned, clocked, approved and evidenced piece of work. In the program's model, the ticket authorizes a machine, and the person's role ends at approval.

## Slide 5 — Where the kit sits in the loop, in Pass 1

Now map the kit onto that loop. Step one, test, is the drift client, which joins the HR extract, Microsoft Graph and SailPoint on employee I D. Step two, detect drift, is SailPoint's event triggers, for a native change or an attribute change, plus the drift client. Step three, raise a typed task, is the SailPoint workflows' HTTP Request step and the Scripted REST resource in ServiceNow, which writes the identity finding table. Step five, close with evidence, is a business rule that turns any close into Awaiting verification, and the re-read client, which closes only on a re-read. Notice step four. Actuation has no code in Pass 1: nothing in the kit writes to Entra ID, Active Directory or SailPoint. You'll meet that step again in Module 6.

## Slide 6 — The products at each step, and four gaps

The example guide shows which product does each step. For raising a typed task, which is Gate 4, it's a SailPoint workflow posting to a ServiceNow endpoint, which is a build; the Service Catalog app for people's requests; and Service Desk tickets for disconnected applications. Used as shipped, the two products fall short of the loop in four places. One: SailPoint's Service Desk integration treats its task as complete from the ServiceNow status, and a ticket status isn't a re-read. Two: the catalog app moves access approval into ServiceNow. Three: SailPoint's Service Desk integration raises only service requests and incidents, not change requests. And four: there are two doors into the directory. Each gate that closes a gap says so; the slide shows which.

## Slide 7 — The identity finding's data contract

Here's the record those steps share: the identity finding, and its data contract. Kind is a finding, the default, or a closure signal. Source is SailPoint or the drift reconciliation. The drift class is one of Book 03's seven classes, and it's required. Severity is P one to P four; leave it out and it defaults by class, Book 03's High to P two and Medium to P three, which is design guidance. System says where the re-read happens: a SailPoint account, a SailPoint identity or an Entra user. One subject identifier is required, and de-duplication uses the first one present. Origin says what raised it. And the intended state says what a re-read must find; when a SailPoint event arrives without one, the script derives it. The implementation example maps each field to Book 13's evidence record.

## Slide 8 — What the Scripted REST resource does with a payload

The contract is enforced in one place: the Scripted REST resource, which runs inside ServiceNow. It validates the payload and answers four hundred with the reason when something's wrong. It maps severity to a priority, one to four, and a due date on the program's tempo. It de-duplicates against an active finding: when one already has the same source, subject, class and attribute, it answers two hundred with the existing record instead of creating a second. And when a SailPoint event arrives with no intended state, it derives one. A new finding gets two oh one, with its number and priority. Here's the problem Chapter 01 solved. Until then, nothing outside ServiceNow applied the same rules, so a client learned that a payload was wrong only from a four hundred on a live instance.

## Slide 9 — Severity and tempo: where the due dates come from

Where do the due dates come from? Book 13's severity and tempo table. A P one, critical, isn't fixed by a machine: the run halts and alerts, and a named role decides. Its window is immediate. P two, high, has a one-hour window. P three, medium, twenty-four hours. And P four, low, seventy-two hours. The script turns those windows into each record's due date. Two cautions. These are the program's internal windows, program design, not a federal requirement. They bound the response, not the occurrence. And they don't replace external timelines: where a CISA directive sets a shorter clock, the external clock governs. Book 13 also notes that a program with no findings is more likely blind than clean.

## Slide 10 — finding_contract.py, and an intent with nothing in it

Chapter 01 adds finding contract dot py, which applies the script's rules on a laptop. Its validate function returns the errors ServiceNow would answer four hundred to, warnings for what it would accept but the loop can't use, and the normalized values: severity, priority, system, subject, de-duplication key and window. Its constants mirror the script's, and a test reads the JavaScript and fails if they drift apart. Then there's is checkable. An intended state of empty attributes and an empty list of entitlements is a non-empty object, so it looks present. But a re-read finds no difference against it, and would close the record on nothing. So the check warns. For missing identity and unauthorized write, which Book 13 routes to a person first, the empty intent is expected until that person sets it.

## Slide 11 — Try it: check five sample payloads

Try it. Lab 1 runs in the kit's folder, on a laptop, against fictional fixtures, with no tenant. In step two you check five sample payloads the way the Scripted REST resource would. Sample one gave no severity, so the class default gave it P two and a one-hour window: due at one o'clock for a run at noon. Sample two has a typo in its drift class, and sample four has a severity of P five. Both would get a four hundred, so the command exits one. Sample three is accepted, but warned: its intended state names nothing a re-read can check, which is expected for an unauthorized write. And sample five, a closure signal, moves matching findings to Awaiting verification. It never closes them.

## Slide 12 — Try it: every payload the drift client would post

Step one runs the chapter's tests: twenty-two pass. Step three runs the ServiceNow script's own tests, the rules the Python mirrors, under Node: fifteen tests, fifteen pass, none fail. Then step four runs the drift reconciliation over the fixtures and checks every payload it would post. Twelve lines start ok. Attribute drift is P three, due in twenty-four hours; missing identities, orphans, stale access and the unauthorized write are P two, due in an hour. Three carry the warning: the two missing identities and the unauthorized write, the classes Book 13 routes to a person. And the last line is twelve accepted, none rejected, none de-duplicated. Erin's two drifts in Entra ID, her department and her manager, have their own keys. Step five deletes the output folder.

## Slide 13 — Lab 2: post a checked payload to a developer instance

Lab 2 moves to a ServiceNow Personal Developer Instance, never production. You need the web service admin role to create the Scripted REST API. You build the finding table and the Scripted REST resource, and lock the resource down with a REST endpoint access control. Then you post a payload you already checked in Lab 1, and confirm two things on the instance: a repeat de-duplicates, and a malformed payload gets a four hundred. Back it out before you leave the module: step five of the chapter's Lab 2 deletes the test records, the access control, the role, the API and the scoped application. The authors haven't run Lab 2, and the workbook has no hosted sandbox: you bring your own instance.

## Slide 14 — The federal requirement, and the evidence to keep

The federal requirement. Gate 4 turns findings and requests into documented, owned, clocked records. The guide maps it to four controls in NIST special publication eight hundred fifty-three. C M three, configuration change control: every proposed change is a documented, owned record. R A seven, risk response: findings are answered inside declared windows. C A seven, continuous monitoring: monitoring results become tracked work. And A C five, separation of duties: a request passes a separation-of-duties check and an approver who isn't the requester. The evidence an ISSO keeps from this module: the ServiceNow finding records and the contract tests in the repository, and each record's due date, which Module 7 measures. Before shipping, work through the chapter's checklist.

## Slide 15 — Check yourself: two questions on the typed task

Check yourself with two questions from the module's knowledge check. First: a payload has a drift class of stale access and no severity. What does the Scripted REST resource do? The answer is c. It accepts it with the class default, P two, and a one-hour window. The script defaults severity by class, and sample one in the lab showed exactly that. Second: what does a closure signal payload do to matching findings? The answer is b. It moves them to Awaiting verification, and it never closes them. Only a re-read closes a finding. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary, and next: Module 2, least privilege

To sum up. You mapped the kit to the loop's five steps, and found that actuation has no code in Pass 1. You read the identity finding's contract, and the tempo its due dates come from. You checked payloads on a laptop the way ServiceNow will, and then every payload the drift client would post. Before you ship, work through Chapter 01's checklist: the constants match the deployed script, every client runs its payloads through the check, and the Scripted REST API requires authentication and a REST endpoint access control with a custom role. Next is Module 2, the boundary and least privilege: Gate 1's record of what runs where, and the ServiceNow roles, SailPoint scopes and Graph permissions each task needs, checked against the kit's call list.
