# Book 15 — Day-2 Operations: the executive briefing — narration script (practice copy)

## Slide 1 — Day-2 Operations: the executive briefing

This is the executive briefing for Book 15 of the Federal Modernization Workbook: Compliance Automation and Day-2 Operations. It's for the people who own what happens after cutover: the CIO, service owners, help desk and operations leads, and the CISO. The book's argument is simple. A modernized estate is judged on day two, at the help desk. Every routine change there touches a control, so compliance lives or dies in daily operations, not at the audit. I'll take four parts: why day two decides, what changes after cutover, who runs it, and how you prove and measure it. Each decision slide names the decision, its owner, and when it's needed. Let's start on Monday morning.

## Slide 2 — The estate is judged on day two, at the help desk

Cutover proves the new estate can be built. The first locked-out user on Monday proves whether it can be run. A user changed phones; a new hire needs an account by nine. Each lands at the help desk. If the new model can't handle it safely, the desk finds a way: an emergency admin account that never goes away, an email treated as the request, a temporary password sent back to the same inbox. Each shortcut is reasonable on the day. Together they rebuild the estate you just replaced. The decision for the CIO: call a wave complete only after a reset, an unlock, a joiner and a leaver have run under the new model. Next, the riskiest of those.

## Slide 3 — An authenticator reset hands over the account

The most dangerous routine action on the desk is resetting someone's sign-in method. After that reset, whoever registers next controls the account. So a reset done on an unverified request isn't support; it hands the account to whoever asked. Federal advisories describe callers posing as employees to get exactly these resets, and OMB calls recovery a potential bypass. The program's answer is a verification ladder. Someone who's lost everything is identity-proofed first. Email, caller ID and personal questions verify no one. The decision for the CISO: own that ladder, put the most friction on privileged accounts, and alert on every reset. Next, why volume matters.

## Slide 4 — Day-two volume is where controls erode

The day after go-live, the help desk resets hundreds of passwords, onboards a dozen people and changes group memberships. Every one of those changes touches a control. Done through a governed path, the authorization package stays true. Done as portal clicks, it ages with every click. The case for automation is volume: at day-two scale, records assembled by hand are reconstructions, not evidence. A control that's designed and deployed but not operated, with an owner, a gate, a clock and an evidence feed, is a hope. The decision for the CIO and sponsor: fund that operating layer, and it's mostly automation, not headcount. Next, what to buy.

## Slide 5 — Buy the contract, not the product

The program asks for a contract, not a product. Every request gets an owner. The approval is recorded before the change, and never by the requester. The platform acts through a least-privilege identity, never standing admin rights. Every step emits evidence. And the platform's inventory reconciles to the authoritative one, never the other way round. ServiceNow is the reference, not a requirement. Its government cloud is certified at the high level, which serves moderate systems conservatively, but record that choice in your own authorization. The decision for the CIO: hold any platform to that contract. Next, how work comes in.

## Slide 6 — One front door, routed by the authority a task needs

The operating rule is one front door. Nothing is handled as an email to the cloud team. Portal requests, emails, identity governance tasks and monitoring alerts all land in one triage queue. Triage asks one question: what authority does this task need? That answer picks the pipeline and the approver, from a simple fix up to governance actions that are never automated. One small rule matters: if an approver doesn't respond, the request is rejected or cancelled, never approved. Silence can't grant access. The decision for the service desk manager: close the side doors, route the team mailbox into triage, and count any work done outside it as a measured gap. Next, what the desk may do.

## Slide 7 — The help desk executes; it never decides

The help desk executes approved work. It never decides what it executes. Technicians hold no standing admin roles; they switch on a scoped role for the ticket in hand. The book flags a trap: capability isn't authority. Some roles a help desk might hold can delete users or approve app access, which the desk must never do. Executive accounts sit in a protected unit the general desk can't touch. And security monitoring flags any elevation with no matching ticket. The decision for the identity governance officer: scope the desk's privileged group, and review its membership every quarter. Next, the tasks that need more.

## Slide 8 — High-risk tasks need two approvers besides the executor

Some tasks let one person take over an identity or open data to the wrong people, and the platform can't stop the misuse on its own. For those, the program requires two approvers besides the person doing the work, both recorded before anyone elevates. The list is short: resets on accounts the desk can't normally touch, repairing a cloud account's link to its on-premises record, restoring accounts outside the HR process, and bulk changes. The second approver checks that the requester was verified, the change is exact, and the urgency is real. A caller pressing for speed goes to the emergency process. The decision: never waive the second approver for urgency. Next, third-party apps.

## Slide 9 — Consent says who may approve; only a verdict says whether

Connecting a cloud app to your directory can quietly move data outside your boundary. In the government cloud most agencies use, nothing in the app gallery is marked. CISA's directive requires that only administrators can approve app access, and the program applies that. But that rule decides who approves. It says nothing about whether the service on the other end is authorized to hold federal data. A tenant can pass every consent check and still send data to an uncertified service. Only an authorization verdict, recorded before anything is configured, closes that gap. The decision for the identity governance officer: record each service's authorization status first, and stop the request if it's missing. Next, the inventory.

## Slide 10 — The inventory is only as good as its reconciliation

The program's rule: discovery fills the configuration database, but the authoritative naming and addressing record decides what an asset is. When they disagree, the database is wrong, and the gap is a finding. This matters for patching and evidence. A missing asset is never patched, while coverage still looks complete. A duplicate lets the fix land on one copy. And a connector that quietly returns half its records raises no error at all. The decision for system owners: authorize or remove every unknown asset the reconciliation finds, and fix identity at the source, never in the database. Next, control automation.

## Slide 11 — One loop on every cloud, closed on a re-test

Control automation runs one loop everywhere: test the setting, spot the drift, raise a task against the asset, fix it on the native platform, and close it only when a re-test confirms the fix. The cloud tools already test most settings; your job is to own the result, and the coordination platform reads but never writes. The platforms differ in ways that matter. Some integrations aren't available in Azure Government, one AWS compliance service is in maintenance mode, and on your own VMware estate the evidence is entirely yours to build. The decision for the CISO: keep the platform's identity read-only, with every automated fix approved. Next, who runs it.

## Slide 12 — Who runs day two: decisions away from the keyboard

Day two is run by the people who touch the estate most and decide the least. So every decision has to sit with someone who isn't at the keyboard. A desk that approves its own resets has rebuilt the standing administrator. The book separates deciding, doing and owning. The desk executes. Its supervisor approves only routine credential work for ordinary users. Platform owners own the runbooks; control owners own the approval gates; the platform team builds both and decides neither. And because runbooks decay, the decision for the CIO is to give every catalog item, runbook and workflow one named owner and a review date. Next, measuring it.

## Slide 13 — Measure day-two health where the work happens

How well the desk is staffed shows up in its numbers before it shows up in an audit. Each measure says something specific. Tickets past their service level show capacity. A rising escalation share shows gaps in the runbooks. Tickets sent back for missing evidence show slipping discipline. Privileged elevations with no matching ticket mean the queue and the roles have come apart. And work done outside the front door is a side door. Each problem has a different fix: more people, a better runbook, or training. The platform produces the numbers, so nobody reports on their own work. The decision for the CIO: staff and source the desk from these measures, monthly. Next, the change board.

## Slide 14 — The CAB authorizes changes; it never accepts risk

The change advisory board authorizes production changes. But two decisions aren't the board's: letting a class of change run without a person, and whether a change needs reauthorization. Those are risk decisions, and risk belongs to the authorizing official. The quietest way separation is lost is here. An approval rule is just configuration, and the team that runs the platform can usually edit it. So the decision for the board: any change to approval rules, routing or integrations is a normal change it authorizes. Nobody changes the gate they pass through. Next, proving it to an authorizing official.

## Slide 15 — Prove with systems; attest only what no system sees

A closed ticket proves someone did some work. An assessed control proves the work held, and only that belongs in front of an authorizing official. The program's rule: if a system can observe a control, a system proves it. People sign only for what no system can see, like a policy approval or a physical inspection, and the package says which is which. Day-two work feeds a loop: map each control to its tests, test on a schedule, and turn every gap into a tracked plan-of-action item. The decision for the system owner: close those items only on a passing re-test, and escalate a slipped milestone instead of quietly moving it. Next, build or buy.

## Slide 16 — Buy the native compliance apps first; build the gaps

Before anyone builds a compliance application, know what your platform already does. ServiceNow's own applications already schedule control tests, walk the federal risk framework, show every plan-of-action item in one place, and import and export the machine-readable formats assessors use. Some are separate subscriptions, and some don't reach every government cloud; these are October 2026 observations. What they don't do out of the box is specific to this design: tie every finding to the authoritative asset, refuse to close work without proof, and keep the control list in step with the agency's map. The decision for the CIO: configure the native apps first, and build only those gaps. Next, checking the automation itself.

## Slide 17 — The runbook checks the automation, not just the estate

The most dangerous failure in automated operations is a silent one: a log source that stops sending, or a detection that quietly stopped matching. It carries false confidence into an authorization. So the runbook checks the automation itself. Every day, a completeness check confirms each log source is still sending, and a dark source is treated as an outage. Every week, harmless test events confirm the detections still fire, and every hand-closed task gets a second look. And a check that stops running looks exactly like one that passes. The decision for the ISSO: confirm each month that every check ran. Now, the decisions together.

## Slide 18 — Day-two decisions: owners and timing

So, the decisions together, and none of them is a procurement. The CIO closes waves only after the everyday tasks run cleanly, funds the operating layer, holds the platform to its contract, gives every artifact an owner, and staffs the desk from its measures. The CISO owns the verification ladder and keeps automation read-only. The identity governance officer reviews the desk's privileges and records a verdict before any app is connected. System owners decide unknown assets and close plan-of-action items only on re-test. The change board guards the approval rules. The next step is free: run one reset, one joiner and one leaver, and see what the record shows. Make the governed path the easy path. Thank you.
