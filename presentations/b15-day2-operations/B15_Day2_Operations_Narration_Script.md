# Book 15 — Compliance Automation & Day-2 Operations — narration script (practice copy)

## Slide 1 — Can Your Help Desk Run the New Estate?

This briefing comes from Book 15 of the Federal Modernization Workbook, Compliance Automation and Day-Two Operations. It's written for C I Os, service desk and operations leads, and information system security officers.

I'll take four questions: why modernization succeeds or fails at the help desk; what day two runs on; who runs it; and how to run it and prove it works.

The short version: cutover proves the new estate can be built. The first locked-out user on Monday morning proves whether it can be run.

## Slide 2 — The help desk holds the keys

A modernization program spends most of its attention on day one: the tenant is built, identities synchronize, the cutover runs. The estate is judged on day two, when every reset, unlock and new hire lands at the help desk.

In Entra ID the help desk's power is explicit. Microsoft labels the Helpdesk Administrator role privileged, and warns that changing a user's password may mean the ability to assume that user's identity. Requiring M F A re-registration deletes the user's phones, Authenticator registrations and software tokens, and whoever signs in next and registers a method controls the account. So a reset on an unverified request isn't a support task. It's a transfer of the account to whoever asked.

Attackers know it. CISA's advisory on the Scattered Spider group describes calls that convinced help desk staff to reset passwords and transfer M F A tokens. And when the governed path is hard, the desk works around it: an emergency admin account, an email treated as a request, a temporary password sent back to the same inbox.

## Slide 3 — Federal guidance treats recovery as a bypass

Two federal documents frame the reset and recovery path. OMB's zero trust memorandum, M-22-09, requires phishing-resistant M F A, and then names the hole: recovery processes are a potential bypass of standard authentication, and a significant threat vector if not mitigated. It asks for high-friction methods that are costly for an adversary, such as in-person verification or live video.

NIST's digital identity guidelines, revised in July 2025, give recovery its own section. They recognize four methods: saved recovery codes, issued recovery codes, recovery contacts, and repeated identity proofing. A help desk agent is allowed only on the basis of a documented risk analysis, repeated proofing has to be consistent with the original, and every recovery must notify the account holder.

Read together, the help desk reset has to be an exception, not the main path; high-friction for the account's risk; at least as strong as the original proofing; and always followed by a notice. Email, caller I D and knowledge questions verify no one.

## Slide 4 — Compliance decays a click at a time

The same argument holds from the side of the authorization package. An authorization describes the system as it was assessed. The day after, the help desk resets passwords, onboards people, changes groups and fixes a synchronization error, and each change touches a control: account management, least privilege, authenticators, change control, the inventory, the audit trail. Done as portal clicks, each leaves no record the control recognizes, and the package ages with every click.

The moderate baseline asks for automation only in specific places, so the book's emphasis on automation is a design position about volume. At day-two volume, people assembling the record by hand can't keep up, and what they produce is a reconstruction, not evidence.

A control passes three layers: designed, deployed as code, and operated, with an owner, a gate, a clock and an evidence feed. Every operation starts from the source of truth, carries the approval its control requires, runs under a just-in-time role, closes with proof and emits its evidence. Miss one, and the work can't be attested.

## Slide 5 — One front door, triage by authority

Now what day two runs on, starting at the front door. Nothing is handled as ad hoc email to the cloud services team. Self-service requests, the team mailbox, the identity governance platform and monitoring alerts all land in one triage queue in the service management platform. The mailbox rule has to redirect, not blind-copy, or there are two queues; pilot it in audit mode first. A reroute rule pulls back anything assigned straight to cloud services.

Triage asks one question: what authority does this task need? No access change is class A0. A change to the requester's own account is A1, and the manager approves. Access an owner governs is A2. Governance actions, such as admin consent, are A3 and never automated. Conditional Access and directory roles escalate.

The checks run in a fixed order, so the dangerous cases are caught first: anything claiming to come from Microsoft, then any target holding a directory role. And an approval nobody answers expires to reject, never to approve.

## Slide 6 — Least-privileged roles, and verify before acting

In Entra ID, three things decide what a technician can do: the role decides the action, the target decides whether it applies, and the administrative unit narrows the population. The least-privileged role for a non-admin password reset is Password Administrator. Authentication Administrator handles methods and Temporary Access Passes for members. Only the Privileged Authentication Administrator can reset a privileged administrator, so that role sits outside the desk.

Capability isn't authority. Authentication Administrator can delete and disable users, and Application Administrator can grant consent, so the program replaces it with a custom role that only assigns groups to applications. Executives sit in restricted management units the general desk can't reach. Roles reach technicians through role-assignable groups, eligible through P I M.

And approval isn't identity verification. The ladder is the CISO's decision: a phishing-resistant sign-in first; identity proofing, in person against a PIV card or through Entra account recovery, when every method is lost. Then a one-time pass with the shortest lifetime, a notice on a separate channel, and for high-risk tasks, two approvers besides the executor.

## Slide 7 — Catalogs and SaaS: typed requests, verdict first

Every routine change arrives as a typed request. The help desk catalog has ten items, for joiners, movers, leavers, credentials, groups, licenses, Conditional Access exceptions and guests, each bound to the control it exercises and the approval that control needs. Each item closes only when a read of the target confirms the change. The leaver fails audits most often: disable the account, revoke sessions, deprovision every connected application, and reassign what the person owned. And federal 911 rules bind whoever operates the phone system, so a validated emergency address gates every number assignment.

SaaS integration is the densest moment. In GCC, an administrator sees the full commercial application gallery and can federate a third-party service in about fifteen minutes, and nothing in the vendor's path asks about authorization. Restricting consent decides who may approve, not whether the service may hold federal data. So the catalog records a FedRAMP Marketplace verdict before anything is configured, with Class C or higher as the program's default for identity data.

## Slide 8 — The CMDB is a reconciled projection

Every ticket names an asset, so the help desk can only be as right as the inventory it routes to. The configuration database earns that trust by agreeing with one authoritative identity, not by being one. Discovery and connectors populate it; the naming and addressing record governs identity. Where the two disagree, the database is wrong, and the disagreement is a finding.

The inventory control asks for no duplicate accounting of components. ServiceNow's identification and reconciliation engine already prevents duplicates and lets only authorized sources write each attribute. The program adds one pass: match each asset to the naming record first, bind it, and flag the rest, either a shadow asset nobody approved, or a gap that's fixed in address management, never in the database.

Duplicates are resolved by binding, not deleting, so no open finding loses its asset. Stale items are disabled and attested before they're retired. It matters because a fix that lands on one duplicate leaves the finding open on the other. And watch the connector that quietly returns half its usual records.

## Slide 9 — Control automation per cloud, and the gaps

Microsoft, AWS and VMware already ship tools that test most of the settings an assessor asks about. The gap is turning each failed test into owned work with a clock, and each closed task into a record. The program runs one loop everywhere: the native tool tests, drift is detected, a typed task is raised against the configuration item, the owning team fixes it natively, and the task closes on a re-test, not a click. The service management platform reads control state; it never writes it.

The government clouds differ. Defender for Cloud's ServiceNow integration isn't available in Azure Government. Compliance Manager's continuous assessments are still rolling out in GCC. AWS Audit Manager closed to new customers on April 30, 2026, and has no GovCloud endpoint. AWS's ServiceNow connector loses support on March 31, 2027, and Security Hub keeps findings only ninety days. In VMware Cloud Foundation 9.1, the compliance benchmarks were replaced by a posture tool that lists no NIST or DISA benchmark. On premises, the agency produces every piece of evidence itself.

## Slide 10 — Native ServiceNow capabilities first

Before anyone builds a compliance application, know what the platform already does. ServiceNow's Policy and Compliance Management schedules control tests and turns gaps into issues. Continuous Authorization and Monitoring walks the seven steps of the Risk Management Framework, gives one view of every plan of action, and in recent releases imports and exports security plans, plans of action and assessment results in OSCAL. Configuration Compliance imports Defender for Cloud results and matches them to configuration items. The government offering is listed as FedRAMP Certified at Class D, High.

So the recommendation is to buy the native applications first and build only what they don't do: join every finding to the authoritative asset identity, close only with proof and flag human-only closures, and check the platform's control set against the control map.

A control is proven by system evidence wherever a system can see it; people attest only to what no system can observe. And FedRAMP's indicators bind providers; for the agency they're vocabulary, not a deliverable.

## Slide 11 — One decider per row, and nobody holding the keyboard

Day two is run by the people who touch the estate most often and decide the least, so every decision sits with someone who isn't holding the keyboard, and every artifact has one owner and a review date.

The service desk has three lines. The first takes every request, classifies it, verifies the person and executes against an approved ticket. Cloud services is the escalation tier, not a second queue. Technicians approve nothing. The supervisor approves routine credential work for ordinary users, never a ticket they execute.

Platform owners own the runbooks and what each catalog item does. The control owner, the CISO or the identity governance officer, owns the approval gate. The service management team builds both and decides neither: changing an approval rule is a normal change the change advisory board authorizes. The configuration database owner keeps the model, not the facts. The board has security and privacy members and authorizes changes, but doesn't accept risk; that goes to the CISO or the authorizing official. A contracted desk fits, because contractors prepare and execute while government officials decide.

## Slide 12 — The runbook, and harnesses that check the automation

The runbook turns all of this into a cadence, and each step says what it proves. Daily, a read-only synchronization probe replaces the morning interactive logon to the sync servers, and each error becomes a task; a completeness check confirms every log source is still sending; catalog tasks close with proof. Weekly, detection rules are tested against replayed known-bad events, and every task closed without automated proof is either evidenced or reopened. Monthly, results and the plan of action are regenerated, and the I S S O reviews the harness results. Quarterly, privileged access and trends are reviewed.

The runbook also rewrites eight everyday tasks. A password reset is delivered on a channel separate from the request. A requester's script is never pasted and run: parameters travel, commands don't.

The harnesses check the automation itself. A source past its freshness limit raises a high-severity alert. A deployment that doesn't close its control fails the pipeline. And a harness that stops running looks like one that passes, so check that each one ran.

## Slide 13 — Decisions to make, and next steps

So, four decisions.

Put the identity-verification procedure under the CISO, and treat every authenticator reset as an account transfer: the most friction on the most sensitive accounts, and an alert on every reset.

Build one front door. Redirect the team mailbox, triage by authority, and let unanswered approvals expire to reject.

Buy the platform's native compliance applications first, and build only what they lack. Record an authorization verdict before any SaaS integration is configured, and check every feature in your own cloud.

And fund the third layer: an owner, a gate, a clock and an evidence feed for every control.

The next step needs no procurement. Measure before you build: run the read-only integration inventory and synchronization probe in a test tenant, size the catalog from what they find, and plan the move off AWS's ServiceNow connector before March 31, 2027.

Operations is where modernization becomes routine or quietly reverts. The Federal Modernization Workbook's Book 15 has the detail, every claim footnoted. Thank you.
