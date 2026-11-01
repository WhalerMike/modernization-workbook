# Building Ticket-to-Machine, Chapter 01 — The Loop and the Typed Task — narration script (practice copy)

## Slide 1 — Chapter 01: The Loop and the Typed Task

Welcome to the Federal Modernization Workbook's developer workbook, Building Ticket-to-Machine. This is Chapter 1: the loop and the typed task. Every step of Book 13's loop writes or reads one record, the identity finding. If its shape is wrong, the clock, the owner and the re-read are all wrong with it. We'll place each file of the ServiceNow and SailPoint kit in the loop, then check that record on a laptop before anything reaches ServiceNow, and finish with two labs and the dangers. The code is illustrative, tested against fixtures.

## Slide 2 — Why the record comes first

Why start with the record? Because the loop has one. A drift becomes a typed task with a class, a severity, an owner, a clock, the system where the re-read happens, and an intended state that says what the re-read must find. Get the class wrong and the finding bounces, so the drift is never recorded. Choose severity by hand and the windows stop meaning anything. And an intended state that names nothing is the quiet one: a re-read finds no difference, and the record closes on nothing.

## Slide 3 — Book 13's loop and where the kit sits

Book 13's loop has five steps: test, detect drift, raise a typed task, actuate on the native surface, and close with evidence. Here's where the kit sits in it. The drift client tests by joining HR, Microsoft Graph and SailPoint on the employee ID. SailPoint's event triggers detect drift. The workflows and a ServiceNow scripted REST resource raise the typed task. Nothing in the kit actuates yet: no code writes to Entra ID, Active Directory or SailPoint. And a business rule and the re-read client close only with evidence.

## Slide 4 — The data contract: what every payload carries

The record those steps share has a short data contract, kept in the kit's read me. Every payload says what kind it is, a finding or a closure signal, where it came from, and which of Book 3's seven drift classes it belongs to. It carries a severity, P1 to P4, the system where the re-read will happen, one subject identifier, and the intended state a re-read must find. The workbook doesn't restate where each field lands in Book 13's evidence record. It makes the fields checkable.

## Slide 5 — What exists: the contract, enforced in one place

What exists today? The contract is enforced in exactly one place, the scripted REST resource that runs inside ServiceNow. It validates the payload and answers four hundred with a reason. It maps severity to a priority and a due date on Book 13's tempo: P1 immediate, P2 one hour, P3 a day, P4 three days. That tempo is the program's design, not a federal rule. It defaults severity by class, de-duplicates against an open finding, and fills in an intended state from a SailPoint event. The catch: nothing outside ServiceNow applied the same rules.

## Slide 6 — What the chapter adds: finding_contract.py

So the chapter adds a Python mirror of the contract. Its validate function applies the script's rules and returns the errors ServiceNow would reject, warnings for what it would accept but the loop can't use, and the normalized values, including the de-duplication key and the response window. Its constants copy the script's, and a test reads the JavaScript and fails if the two drift apart, so the mirror can't quietly go stale. A command line checks a file of payloads, or everything a drift run would post.

## Slide 7 — The empty intended state that looks present

Here's the subtle case the chapter guards against. An intended state like the one on the slide is a non-empty object, so it looks present. But it names nothing: no attribute, no entitlement. A re-read compares against it, finds no difference, and would close the record on nothing. The check warns rather than rejects, because ServiceNow would accept it. For the two classes Book 13 sends to a person first, missing identity and an unauthorized write, the warning says that's expected until that person decides.

## Slide 8 — The tests: 22 for the contract, 107 in all

The chapter's tests number twenty-two. They compare the constants against the script, try every rejection the script makes, cover closure signals and system defaults, check both checkable and empty intended states and the tempo, and accept every payload the drift client builds from the fixtures. With the rest of the kit, a hundred and seven Python tests pass, plus fifteen Node tests of the ServiceNow scripts and forty PowerShell tests, all without a tenant or a network.

## Slide 9 — The verified facts the code depends on

These are the vendor facts the chapter's code relies on, each read on November first. A scripted REST API has a fixed URL shape. Access is set by API access policies and endpoint ACLs, and creating one needs the web service admin role, which calling it doesn't. The kit uses two SailPoint triggers, both fire-and-forget. ServiceNow's Government Community Cloud is FedRAMP High; SailPoint's Identity Security Cloud is FedRAMP Moderate. And a free developer instance is reclaimed after ten days unused.

## Slide 10 — What couldn't be verified

Two points stay open, and the chapter says so rather than guessing. First, nobody has confirmed which identity ServiceNow reports for a call made with an OAuth client-credentials token, and the business rule in Chapter 5 compares exactly that with its verifier account. Second, ServiceNow's page says a developer instance is reclaimed after ten days unused, but newer community posts describe a rule that also considers its age. So check before relying on one for more than a few days, and keep your work in source control.

## Slide 11 — What the typed finding proves, and for whom

What does this chapter's output prove? Every drift becomes one record with a class, a severity, an owner and a due date, and a malformed one is rejected at the door. That supports configuration change control and continuous monitoring, CM-3 and CA-7, both in the Moderate baseline, and the evidence is the ServiceNow record plus the contract tests. And the response window is applied by code, not chosen ticket by ticket. A typed finding is only the owned, clocked half of Book 13's record. Approval and the re-read come later.

## Slide 12 — Who builds it and who approves it

Who is this for? Developers who build either side of the integration, and the reviewers who approve their changes. You need to read Python and JSON, and you don't need any instance until Lab 2. One least-privilege point carries through the whole workbook: the person who creates the scripted REST API needs the web service admin role, but the integration user who calls it doesn't. It gets one custom role, granted through an endpoint ACL, and nothing else.

## Slide 13 — Lab 1: five sample payloads, checked

Lab 1 needs only a laptop with Python. First, run the chapter's twenty-two tests. Then check five sample payloads at a fixed clock, noon on November first. The first is accepted: it had no severity, so the class default gave it P2 and a due time one hour later. The second has a typo in its class and is rejected with the list of valid ones. The third is accepted but warned: its intended state names nothing. The fourth has a bad severity, and the fifth is a closure signal that never closes anything.

## Slide 14 — Lab 1: the script's tests and the drift payloads

Next, run the ServiceNow script's own fifteen tests in Node, the rules the Python mirrors. Then run the drift reconciliation over the fixtures and check every payload it would post. Twelve are accepted. Three carry the warning, and they're exactly the classes a person decides first: two missing identities and the unauthorized write. Notice Erin's two attribute drifts in Entra ID, department and manager. They now have separate keys. Before Chapter 4's fix, they shared one, and the second would have vanished into the first.

## Slide 15 — Lab 2: post one finding to a developer instance

Lab 2 moves to your own ServiceNow Personal Developer Instance, never production, and the authors haven't run it. You build the finding table and the scripted REST resource from the kit, lock it down with authentication and an endpoint ACL for one integration user, then check a payload locally before posting it. Expect a created record with priority 2, due an hour later. Post it again and it de-duplicates. Post the typo and you get the same four hundred Lab 1 predicted. Then back it all out.

## Slide 16 — Dangers, and the guard for each

Each danger has a guard. If the Python mirror drifts from the script, a payload passes on a laptop and fails in ServiceNow, so a test reads the JavaScript itself. A typo in a class would lose the drift entirely, so it fails locally first. An empty intended state would close a record on nothing, so it's warned now and skipped later. Severity chosen per ticket would empty the windows of meaning, so defaults live in one table. And a developer instance isn't permanent: keep your work in source control.

## Slide 17 — Done when: the chapter's checklist

Here's what done looks like. The Python constants match the script that's actually deployed, and the parity test passes. Every client that posts findings runs its payloads through the validator in its own tests. Nothing a client builds is rejected, and every warning is understood. The windows are the program's current ones and the severity defaults match Book 3's classes. And the API requires authentication and a custom role. Next, Chapter 2 writes down every ServiceNow call and the least privilege it needs. Thanks for watching.
