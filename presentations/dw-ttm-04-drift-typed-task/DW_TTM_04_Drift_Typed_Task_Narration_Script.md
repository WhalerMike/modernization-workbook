# Building Ticket-to-Machine, Chapter 04 — Drift to a Typed Task — narration script (practice copy)

## Slide 1 — Chapter 04: Drift to a Typed Task

Welcome back to Building Ticket-to-Machine. This is Chapter 4: drift to a typed task, the kit's Build 1. A workflow that posts a finding is easy to build and hard to see. You can't run a SailPoint workflow on a laptop, but you can resolve its request body against a saved event and see the exact payload ServiceNow would get. Doing that found two gaps, and this chapter fixes both. Then two labs, the dangers and the checklist.

## Slide 2 — Why run the body before it runs for real

Why bother? Because the body of a SailPoint workflow is full of keys that SailPoint resolves only at run time, so until now the only way to see the actual payload was to run the workflow in a tenant. And what you can't see, you can't test. If the workflow drops part of an event, that part of the change is never reverted, and the re-read later finds nothing to disagree with. So this chapter resolves the body offline, derives the intended state the way ServiceNow will, and lists anything left behind.

## Slide 3 — What exists: three workflows and one script

Here's what Build 1 already has. Three SailPoint workflows, one per trigger. A native change to an account raises an unauthorized write. A change to an identity's attributes raises attribute drift. And a completed provisioning action raises a closure signal, which never closes anything by itself. Each workflow has one HTTP request step and is created disabled, because SailPoint won't create one enabled. On the ServiceNow side, the scripted REST resource derives the intended state: a native change is reverted, an attribute change is kept.

## Slide 4 — workflow_payload.py: the body, resolved offline

The new tool does five things. It picks the workflow for the trigger you name. It resolves the body against a saved event, but only simple paths; anything fancier is refused, because it isn't a JSON path engine and won't pretend to be. It derives the intended state the same way ServiceNow will. It checks the result against Chapter 1's contract. And it lists every top-level field of the event that the body never reads. Three fictional events, shaped like SailPoint's published examples, feed it.

## Slide 5 — Fix 1: multivalued changes, reverted

The first fix. SailPoint's native change event has three kinds of change: single-value attributes, entitlements, and multivalued attributes, each with values added and removed. The workflow sent only the first two. So a native change that touched only a multivalued attribute, a proxy address added out of band, say, produced an intended state with nothing in it, and a re-read would have found nothing to disagree with. Now the workflow sends the multivalued changes, and the script reverts them: added values must be absent, removed ones present.

## Slide 6 — Fix 2: the attribute joins the de-duplication key

The second fix is in the de-duplication key. ServiceNow folded findings together on source, subject and class. So when two attributes drifted on one user, department and manager, they became one record. The second finding's intended state was lost, and the re-read checked only the first. Now the key adds the attribute whenever the payload names one. The slide shows the key for a department change on Erin's identity, before and after. Each drifting attribute is now its own piece of work.

## Slide 7 — The tests: seven new, two node tests, one rule

Both fixes are pinned. Seven Python tests run each workflow against its event, check that a native change reverts all three kinds of change, reproduce the empty intended state the old workflow produced, confirm the attribute change keeps the new value with the attribute in the key, and cover the closure signal, refused paths and an unknown trigger. Two new Node tests run the ServiceNow script itself, and the contract test now requires the script to read the multivalued changes.

## Slide 8 — The verified facts: the three triggers

The trigger facts, read on November first. The native change trigger is fire-and-forget, and fires only when an aggregation finds an account changed directly on the source, with native change detection on, account updates monitored, and a monitored attribute changed. Its trigger ID isn't in SailPoint's published table. The attribute-change and provisioning triggers are listed, both fire-and-forget, with the inputs on the slide. A workflow can't be created enabled, creating one needs the workflow manage scope, and the ServiceNow side needs an endpoint ACL.

## Slide 9 — What couldn't be verified about the workflows

Several things are open, and they matter because they're exactly what the offline tool assumes. The native change trigger's ID isn't in SailPoint's table. The HTTP request step's JSON names aren't published, and nor is whether it resolves those run-time keys inside its body. The shape of each added entitlement isn't documented below the list level, and provisioning results beyond success aren't listed. Nor is whether the event sits at the root or under a trigger key. Lab 2 settles these for your tenant.

## Slide 10 — What Build 1 proves, and for whom

What Build 1 proves. A write made outside the governed process is detected and raised as an owned, clocked finding whose intended state is the revert, which supports change control and system monitoring at Moderate. Each drifting attribute is its own piece of work. And a workflow change is tested before it runs, which is developer testing, SA-11. Two labels: treating a native change as an unauthorized write is the program's inference, and since the workflow can't know whether a claim is in use, a person or a rule raises it to P1.

## Slide 11 — Who builds the workflows and the resource

Who does this work? Identity engineers who build the SailPoint workflows; they read JSON and should run the payload tool on every change before importing. ServiceNow developers who own the scripted REST resource, and deploy both fixes. And the workflow client from Chapter 3, with the workflow manage scope, used once and removed. One practical point, labeled an inference: the ServiceNow endpoint has to be reachable from SailPoint's cloud, because workflows call out from there.

## Slide 12 — Lab 1: the native change, resolved

Lab 1. First, eleven tests pass. Then resolve the native-change workflow against Alice's fictional event. It's an unauthorized write on her account, accepted at P2. The intended state reverts all three changes: the title goes back to Analyst, and both the new group and the new proxy address must be gone. The only field not sent is the event type, which is always account-updated for this trigger, so nothing is lost. Before the fix, the proxy address was missing here, and the multivalued changes were in that last line.

## Slide 13 — Lab 1: the mover, the signal, the script tests

Next, the mover. Erin's identity changed department from HR to Finance. The finding keeps the new value as the intended state, at P3, and the key now ends in the attribute, department. Nothing in the event is dropped. Then the closure signal from a successful provisioning action: it's accepted, and four fields aren't sent. A signal only moves matching findings to awaiting verification; it never closes one. Finally, the two new Node tests of the ServiceNow script both pass.

## Slide 14 — Lab 2: one workflow, one sandbox, one capture

Lab 2 needs a SailPoint sandbox and your developer instance, never production, and the authors haven't run it. Turn on native change detection on one test source. Build one HTTP request step by hand in the editor, export it, and compare its names with the kit's file. Point it at a capture endpoint first, change a monitored attribute on the source, and run the saved trigger input through the tool: the two payloads must match. Repeat the change and it de-duplicates. Then put everything back.

## Slide 15 — Dangers, and the guard for each

The dangers. An event field the workflow doesn't send leaves part of a change unreverted, and the re-read passes anyway; the tool lists dropped fields. Two drifts folded into one record lose an intended state; the key fixes that. A workflow edited only in the editor stops matching the repository, so export and diff. Credentials in the file are caught by a test. A closure signal treated as closure would skip the re-read, so it only moves findings to waiting. And an open endpoint is locked with authentication and an ACL.

## Slide 16 — Done when: the Build 1 checklist

Done looks like this. Every workflow resolves against a saved input from your own tenant, with nothing you meant to send left behind. The native-change workflow sends all three kinds of change. The deployed script keys on the attribute. The trigger ID, the step's attribute names and the input's root are confirmed in a sandbox. Workflows go in disabled, get tested, then enabled, and the workflow client is removed. And the tests pass. Next, Chapter 5: the re-read rule, and why a success response isn't closure. Thanks for watching.
