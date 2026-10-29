# Book 15 — Day-2 Operations — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Day-2 Operations: the technical deep dive

Welcome. This is the technical deep dive for Book 15 of the Federal Modernization Workbook, Compliance Automation and Day-2 Operations. It's for help desk leads, cloud and platform engineers, and the people who automate controls: the teams who run the estate after cutover. Part 1 is the front door and the authority: how a request comes in, gets routed and verified, and what the help desk may do in Entra ID. Part 2 is catalogs, records and controls: typed requests, SaaS integrations, the CMDB, and control automation across four platforms, then who runs it all. Let's start with why day two matters so much.

## Slide 2 — Why this matters: a reset can hand over the account

Here's why this matters. A modernized estate isn't judged at cutover; it's judged the first Monday someone can't sign in. And the most dangerous routine action on the help desk is a single button. Requiring a user to re-register for MFA wipes their methods, and whoever signs in next sets up new ones. So a reset done on an unverified request doesn't fix an account; it hands it to whoever asked. Attackers know this, and they call help desks to do exactly that. Federal guidance agrees: recovery is a bypass, and it needs high friction and a notice to the real owner. So this book treats every reset as an account transfer. Next, the model that makes that workable.

## Slide 3 — Three questions, one contract, five operating rules

Every day-two request has to answer three questions before anything changes: where does it go, who may say yes, and what proves it happened. The book answers them with platforms the agency already runs: the service management platform routes, the identity governance tool approves, and Entra ID is where the change lands. Underneath sits a contract, not a product: every task has an owner, every change has an approval on record, automation runs under a narrow identity, and evidence comes out the other end. The five rules along the bottom apply to every request. If any one is missing, the change may be right, but it can't be attested. Module 1 starts at the front door.

## Slide 4 — Module 1: Intake, triage and routing

Module 1 is intake, triage and routing: the everyday mechanics that make the authority model real. An estate with a clean role model still slides backward if the team keeps answering email, or if a manager's 'just do it' counts as approval. So we start with how work comes in.

## Slide 5 — One front door: redirect, filter, reroute

The rule is simple: one front door. Nothing is handled as ad hoc email to the cloud team. The team mailbox gets a mail-flow rule that redirects into the ticketing platform, and the detail matters: a blind copy leaves two queues, a redirect leaves one. Run the rule in audit mode first, compare, then enforce. New mail becomes a triage record with nobody assigned, and a reroute rule pulls back anything sent straight to cloud services, because old habits survive a redirect. Cloud services is the escalation tier, not a second inbox. Approvals carry due dates that reject, so silence never grants access. Once a request is in, triage decides where it goes.

## Slide 6 — Triage by required authority: first match wins

Triage asks one question: what authority does this task need? Not who received it, not how urgent the caller sounds, and not how senior they are. The checks run in a fixed order, and the first match wins, so the dangerous cases are caught first: anything claiming to come from Microsoft, and any target that holds an admin role, because a role that can reset ordinary users can't safely reset an administrator. One rule deserves emphasis. Nothing is approved from an email, even a convincing one from Microsoft. A sender address is a quick filter, not proof. The check that counts is the tenant's own audit log, matched to an approved ticket. Next, what automation can actually carry.

## Slide 7 — Prefer the connector, but check what it covers

Wherever a connector action exists, the ticket should authorize the machine, and the person's role stops at approval. But check what the connector really documents. The book checked ServiceNow's Entra ID spoke and found the older design had mapped too much to it. Its password reset works only for cloud-only users. There's no action at all for an MFA reset, so that stays a person's task, which makes verification the control that matters most. And the connection type decides which actions run at all, because some of them work only with delegated permissions. Coverage changes by release, so validate it against what you've installed. Which brings us to verifying the person.

## Slide 8 — Verify the person: the program's verification ladder

Approval answers whether something should be done. It doesn't answer whether the caller is who they claim to be, and that's the gap attackers exploit. So the book builds a verification ladder, and it's the CISO's decision, not the help desk's. If someone can still sign in with a phishing-resistant method, that session proves who they are. If they've lost everything, it takes real identity proofing, in person or through Entra's new account recovery, followed by a one-time pass. What never counts: email, caller ID, knowledge questions or a manager's say-so. The ticket records which rung was used, never the evidence itself. Then the ticket has to close properly.

## Slide 9 — Close with evidence: three records that must agree

A ticket closed with 'done' is just an assertion. The book wants three records that agree: the ticket shows the decision, the elevation record shows the privilege, and the audit log shows the change. Two gaps have to be built, because Entra won't close them for you. Privileged Identity Management asks for a ticket number but never checks it, so a detection rule has to match every activation to a real ticket. And Entra keeps its logs for only thirty days, so they go to the SIEM. The service levels on the right are program defaults, and a shorter outside clock always wins. Module 2 turns to the roles behind all this.

## Slide 10 — Module 2: Help desk authority in Entra ID

Module 2 is help desk authority in Entra ID. In Active Directory, the directory tree answered whose password the desk could reset. Entra answers it in three parts: the role decides what a technician can do, the target decides whether it applies, and administrative units (AUs) narrow the population. Get any one wrong, and the desk either can't work or can do far too much.

## Slide 11 — Five roles, and whose accounts each can touch

Five built-in roles carry most help desk identity work, and all five are labeled privileged. The column people get wrong is whose account each role can touch. Most can act only on users with no admin role, and members of role-assignable groups are protected from everyone except the top tier. That protection is deliberate: whoever took over a member's account would inherit the group's role. The other lesson is that capability isn't authority. Some of these roles can delete users, and one can grant consent, which the desk must never do. So the platform's limits aren't the policy; the ticket and monitoring enforce the rest, and the desk gets a narrow custom role for app assignments instead. Next, scope.

## Slide 12 — Scope and reach: AUs, restricted units and PIM

Scope is what keeps those roles narrow. Help desk roles are assigned over AUs, and at that scope they reach only members with no admin role. Executives go further, into a restricted unit that only a small, approved support group can touch; even tenant-wide admins can't edit them. One caution: don't put the technicians themselves in one, because governance features stop working there. Roles reach technicians through one group per role and scope, eligible rather than active, and activated with a justification that cites the ticket. Those groups also protect their members, so one technician can't reset another and inherit their access. Now, recovering someone who's lost everything.

## Slide 13 — Recovery with a Temporary Access Pass

When a user has lost their only strong method, re-registration alone leaves a gap: whoever signs in next sets up the new method. A Temporary Access Pass closes that gap. The sequence on the slide is the heart of it: re-proof the person, revoke their sessions, remove the lost method, then issue a one-time pass with the shortest lifetime the handover allows, straight to the verified person. Stay with them while they register something phishing-resistant, then tell them on another channel, so a victim learns about a reset they never asked for. The table shows the pass's own limits worth knowing. Some tasks, though, need more than one approver.

## Slide 14 — High-risk tasks: two approvers besides the executor

Some tasks are high-risk because one person could use them to take over an identity, break its link to the source of truth, or open an app to the wrong people. For those, the book requires two approvers besides the person doing the work, both recorded before any role is activated. The second approver checks that the requester was verified, the change is exactly specified, and the urgency is real. ImmutableID repair is the telling example: it left the help desk entirely, because the right fix is usually in Active Directory, not the cloud. And three detection rules watch everything the desk does. That's Part 1.

## Slide 15 — Module 3: Catalogs, SaaS and the CMDB

Part 2 begins with Module 3: catalogs, SaaS and the CMDB. Hundreds of identity changes a week, each done as a portal click, are the biggest steady source of control erosion. The answer is a catalog of typed requests, plus two things it leans on: governed SaaS integrations and a CMDB you can trust.

## Slide 16 — The identity catalog: ten items, five verbs

Every catalog item runs the same loop: a typed request against a named target, the approval its control needs, execution under a narrow identity, and a record that closes only when a check confirms the change. Every identity change is one of five verbs: add, move, change, delete or reset, and each has its own closing check. The one that fails audits is the leaver. Disabling the account isn't enough; sessions, connected applications and everything the person owned all have to be handled and recorded. Apps without automatic provisioning become manual tasks, with no automatic check that the account is really gone. Telephony has its own catalog, with real stakes.

## Slide 17 — Teams Phone: emergency calling is the operator's duty

Teams Phone is where a silent configuration error has physical consequences: a wrong emergency address sends responders to the wrong building. And the federal rules bind whoever operates the phone system, which includes an agency. Kari's Law requires direct 911 dialing and a notice to someone such as a front desk, and the FCC's rules require a dispatchable location with every call. Teams provides the mechanisms, but someone has to configure them and keep them current. So a validated address becomes a gate on every number, network changes raise their own mapping item, and a 933 test call closes it. Counsel decides compliance; the catalog keeps the evidence. Next, SaaS.

## Slide 18 — SaaS integrations: a verdict before any configuration

An administrator can connect a third-party SaaS service in about fifteen minutes, and nothing along the vendor's path asks whether that service is authorized to hold federal data. That's the point of this slide. Consent controls decide who may approve an integration; they don't decide whether the service should get the data at all. So the book puts a gate first: no authorization verdict, no configuration. Its default for identity data is a FedRAMP certification at Class C or higher, read from the Marketplace's own dataset. Name matching only ever creates a review queue, never an automatic no. Then the question is how to configure it with least privilege.

## Slide 19 — The least-privileged Graph surface for SaaS

The catalog configures integrations through Microsoft Graph, and the book checked the older design's permissions against Microsoft's reference. The operations were right; the permissions weren't. One narrow permission, limited to applications the connector owns, covers almost everything, and adding the broad synchronization permission would undo that boundary. The real trap is assignment: the permission it needs can grant anything to anyone, which turns the connector into a privileged administrator. So it stays off the connector, and a person binds the access group once, under a just-in-time role. After that, access changes are just group membership. Every integration also has to land correctly in the CMDB, so that's next.

## Slide 20 — The CMDB is a projection of the naming plane

Every ticket names an asset, so the help desk can only be as right as the inventory behind it. The book's position is clear: the CMDB is a projection, not the authority. Discovery and connectors fill it, but identity comes from the naming plane, the IP address management and DNS records. ServiceNow's engine already decides whether a record is new and which source may write each field. The book adds one more pass: match each asset to the naming plane, bind that identity, and flag anything that doesn't match. A shadow asset is a finding, and a gap gets fixed upstream, never patched in the CMDB. Then come the everyday defects.

## Slide 21 — Duplicates, stale CIs and what they break

This slide shows why CMDB hygiene isn't a nicety. A missing, duplicate or stale record breaks patching and evidence in different ways, and the table walks through each. Duplicates come from the sources themselves, from reimaged devices to merged records. The rule is to bind, not delete: keep the record that carries the authoritative identity, and move its tickets and findings over first. Stale records follow a sequence: detect, have the owner confirm, retire, and only then delete, because some deletions can't be undone. A deleted device, for example, takes its BitLocker recovery keys with it. That closes Module 3. Module 4 turns to control automation.

## Slide 22 — Module 4: Control automation and who runs it

Module 4 is control automation, and who runs it. The vendors already test most of the settings an assessor asks about. The gap is everything around the test: who owns the finding, what clock they work against, who approved the fix, and what re-test proved it closed.

## Slide 23 — One loop, and the Microsoft 365 evidence sources

The book runs one loop on every platform: test with the native tool, detect drift, raise a typed task against the asset, fix it natively, and close on the next test. Two rules matter most. The ticketing platform reads control state but never writes it, and a task closes on a re-test, not a click. On Microsoft 365, CISA's ScubaGear is the main test, and its stable policy IDs let the mapping from failure to task live as data. Conditional Access exceptions get the same treatment, with an approver and an expiry. Compliance Manager is useful, but it's a readiness signal, not the evidence of record. Azure works the same way, with its own caveats.

## Slide 24 — Azure: Policy, Defender for Cloud and Resource Graph

Azure ships a lot of help here, and Microsoft is unusually candid about its limits. Azure Policy's FedRAMP initiative reports compliant only for the settings it can test, which is a partial view, not a verdict on a control. Results arrive on a daily cycle, so closures lag the fix by up to a day. Exceptions have a native form with an expiry, and the book allows them only from an approved request. Defender for Cloud adds dashboards and exports, but an export only fires on change, so silence isn't proof. Resource Graph is the simple read path. So how do results reach the ticket queue?

## Slide 25 — Three routes into the ITSM platform, one clock

There are three routes from a native result into the ticketing platform: the vendor's own connector, the platform's import, or the program's read-only collector. Which one you can use depends on your cloud; the Defender connector, for instance, isn't available in Azure Government. The important rule is one route per source, because two routes give you two tasks and two clocks for the same finding. And the clock itself matters. For vulnerabilities it's CISA's new directive on prioritizing security updates, set by exposure and known exploitation, not FedRAMP's timeframes, which bind cloud providers, not agencies. Next, AWS, where the ground shifted this year.

## Slide 26 — AWS: Config and Security Hub CSPM, not Audit Manager

On AWS, the evidence path has changed under people's feet. Config conformance packs and Security Hub's posture checks are the foundation. Both run in GovCloud and in the commercial Regions, and either is a valid home for a Moderate system, but GovCloud has differences you need to test. Security Hub keeps findings for only ninety days, so copy them out first. The big correction is Audit Manager: it closed to new customers in April 2026, has no GovCloud endpoint, and its FedRAMP framework is still on the old revision. Nobody should start a federal evidence program on it. And the ServiceNow connector most agencies used loses support in March 2027, so plan that move now. VMware is harder still.

## Slide 27 — VMware: the evidence the agency produces itself

In the agency's own data center, there's nothing to inherit. No provider operates the hypervisor, no one publishes a control mapping, and an agent inside a virtual machine can't see the host underneath it. So every piece of evidence is the agency's to produce. The tools exist, but they're moving: Broadcom replaced its compliance feature between versions 9.0 and 9.1, and the new one doesn't list an 800-53 benchmark. Moving clusters to images unlocks both the patch and configuration tests. And where no machine can reach, a recorded, time-boxed session is a declared exception. Finally, who runs all of this.

## Slide 28 — Who runs day two: one decider per row

Day two is run by the people who touch the estate most and decide the least, so the design puts every decision with someone who isn't holding the keyboard. The slide shows one decider per row, from the CISO's verification procedure to the change advisory board, which authorizes changes even to the approval rules themselves. Only the authorizing official accepts open-ended risk. The separations on the right are the ones the platform should enforce rather than leave to memory. Above all, nobody approves their own work, and nobody changes the gate they pass through. Contractors can prepare every decision here except the authorizing official's, which is a government-only role. So, what to decide first?

## Slide 29 — Decisions to make, and next steps for day two

Six decisions, each with a named owner, and the table shows who. Two stand out: the verification ladder, because it protects every reset, and the SaaS threshold, because it's a gate nothing else replaces. The first step needs no procurement: measure before you build. Run the read-only inventories and collectors against a test scope, size the work from what they find, and start the move off the AWS connector before its deadline. Then build only what the native tools don't already provide. Operations is where modernization either becomes routine or quietly reverts. The book has the detail, with every claim footnoted. Thank you.
