# Book 08 — DNS, DHCP & IPAM — narration script (practice copy)

## Slide 1 — DNS, DHCP & IPAM: the executive briefing

Welcome. This is the executive briefing for Book 08 of the Federal Modernization Workbook: DNS, DHCP and IP address management. It's for the CIO, the CISO, the network and infrastructure lead, and sponsors. The argument is short. Almost every connection starts with a DNS query, and the answer now decides far more than an address. Most agencies still run DNS across several platforms that share nothing, so the same name gets different answers, and the failures look like something else. The fix is one authoritative policy plane, with named owners. I'll take four questions: why, what, who and how. Each decision slide names the decision, its owner and when it's needed. Let's start with what DNS now does.

## Slide 2 — DNS now decides far more than an address

DNS was built to turn names into numbers, in a world where inside and outside were separated by a wire. That world has gone. Today the answer to a DNS query decides whether cloud traffic stays private, which SaaS front door a user reaches, whether a malicious domain is blocked, and whether a certificate check succeeds. It's also the name a Zero Trust policy is written against. NIST's 2026 guide says it plainly: DNS is now a security control, not just a service. So the first point for this room is that governing DNS is a security and architecture job, not an operations chore. Next, what happens when it isn't governed.

## Slide 3 — Several platforms, no shared state: split-brain

Nobody chooses to run DNS in five places. Each cloud ships its own DNS service, and none of them shares state with Active Directory or with each other. So the same name drifts into different answers depending on where the query starts. That's split-brain, and it fails quietly: the name still resolves, just to the wrong place, and it shows up as a certificate error or an access denial. Runbooks can't keep five systems in step, and your real security posture is the weakest resolver a client can reach. So the decision for the sponsor and CIO: authorize one authoritative policy plane, before the next migration wave. Next, what federal policy requires.

## Slide 4 — Encrypted and Protective DNS are requirements

Two requirements shape everything. M-22-09 says agencies must encrypt DNS wherever it's technically supported, and point devices at agency-designated resolvers, not whatever they discover. And CISA's Protective DNS is mandatory for all outbound resolution. The two fit together: encrypt, but end at your own resolvers, with Protective DNS upstream. Where it breaks is the device. Encrypted DNS that rides the ordinary web port can't be seen by the network, so it has to be governed through device and browser policy. The decision belongs to the CISO: designate the resolvers and the allowed transports, now. An exception with no end date goes to the authorizing official. Next, the rest of the floor.

## Slide 5 — Logging, DNSSEC and IPv6 complete the floor

Logging changed this year. OMB's May 2026 memo, M-26-14, replaced the old logging tiers. It doesn't name DNS at all; it sets a baseline, logs searchable for six months and kept for a year, and leaves the sources to each agency's logging plan. That plan is due by November 18, a date we computed from CISA's publication. DNS query logs tell you which address asked for a bad domain; DHCP lease logs tell you which device that was. So the CISO puts both in the plan. DNSSEC and the IPv6 targets are older requirements, and the IPv6 dates have passed. Now, what has to change, starting with Active Directory.

## Slide 6 — Leaving AD DNS is an inventory problem first

For twenty years Active Directory quietly ran your DNS. Domain controllers host the zones and publish the records that let machines find them. None of that moves to Entra ID. Entra ID hosts no zones at all, and some systems will keep needing domain controllers for a while. Here's the trap: once a domain controller is gone, the records it kept can't be recovered from it. So leaving AD DNS is an inventory problem before it's a migration problem. The decision: the DNS and DDI team owns the inventory, AD administrators do the work, and it's reconciled before the first domain controller goes. Next, how queries slip past your controls.

## Slide 7 — Where a query slips past agency policy

Every control you buy assumes the query reaches it. Three ordinary things decide whether it does, and none of them raises an alarm. A branch network edge can redirect DNS to a resolver outside your control. A device or browser can send encrypted DNS straight to a public service. And a rogue DHCP server can hand a whole subnet an attacker's resolver in one step. So the decision splits deciding from doing. The DNS and DDI team decides that every edge points only at agency resolvers; network engineering configures it; and the CISO owns rogue DHCP detection. Do it as authority moves, then check before every change. Next, certificates.

## Slide 8 — Certificates and tokens fail when names do

A certificate can be valid and unrevoked and still fail, because every check that makes it trustworthy starts with a DNS lookup. If the revocation names live only in Active Directory DNS, a cloud workload can't reach them, and the ticket gets opened as a certificate problem. The same goes for sign-in endpoints and wildcard names. DNSSEC protects the answers themselves. The program's position: sign your external zones always, validate on resolvers you control, and sign internal zones only where it's required. The CISO sets that. And moving a zone somewhere it can't be signed is a risk acceptance, so the authorizing official decides it. Next, addresses.

## Slide 9 — IPAM is the address record of the estate

Names and addresses are the same problem. Every cloud has its own address manager, and left alone each one hands out address space on its own. You find the overlap when two networks are joined, or an auditor finds space nobody recorded. So the enterprise IPAM is the authority for address blocks. Some platforms integrate natively; others need you to reserve first, mirror, and reconcile. Either way it becomes the address layer of the asset inventory Zero Trust depends on. The decision: the DNS and DDI team owns the address plan, and every new cloud network is reserved in IPAM before it's created. Next, the architecture.

## Slide 10 — Five settings carry almost all of the risk

The architecture is simple to draw. Branch edge, then an agency resolver, then the policy plane, then each cloud's private zones, with internet queries leaving through Protective DNS. The risk sits in five settings: where the edge points, which resolver goes first, where cloud forwarding rules live, the AD DNS inventory, and whether revocation names resolve from everywhere. Each fails silently, so each needs a check in the live configuration, not the design. The book's ask is specific: the DNS and DDI team settles all five within ninety days of authorizing the plane, and reports the remaining risk to the authorizing official. Next, choosing the platform.

## Slide 11 — Choosing the platform and the source of truth

The platform decision is really a decision about the source of truth. One plane holds the zones, the forwarding rules, the address data and the security policy, and the cloud DNS services consume it. There are three models: a SaaS policy plane, DDI the agency runs itself, or cloud-native services managed as code. Each has a trade-off, and a small single-cloud agency may need only the last. Remember that FedRAMP certifies a service, not your system, and Moderate doesn't cover High. So the sponsor and CIO choose on evidence from your own estate, and the authorizing official authorizes any cloud-delivered plane. Now, who owns it.

## Slide 12 — One decider per decision, named on purpose

In an Active Directory estate, nobody wrote down who owned DNS, because AD did it for you. One admin group controlled every zone, and the domain controller team decided by default. A single policy plane concentrates that power: one team can now break resolution for every user and every cloud at once. So owners have to be named on purpose, one decider per decision, or the cloud, network and directory teams each own a piece by accident. Two decisions before the transition starts. The sponsor and CIO give the decision rights to a named group. And AD administrators strip the DNS admin group down to domain administrators. Next, the matrix.

## Slide 13 — Who decides what for DNS, DHCP and IPAM

Here's the matrix in one view. The sponsor and CIO decide the platform and when the old services retire. The CISO decides encryption, DNSSEC and logging. The DNS and DDI team decides the namespace, the edge target, the forwarding and the address plan. Network engineering and AD administrators do much of the work, but don't decide it. Why does the authorizing official appear twice? Because many DNS changes are risk decisions in disguise. Pointing an edge at a public resolver quietly turns off Protective DNS. So every standing exception goes to the authorizing official, with an owner and a review date. Next, everyday changes.

## Slide 14 — Most record changes need no change board

Most DNS changes don't need a change board. Treat them all alike and you get either a six-week wait for a simple record, or no control at all. So the program uses three classes. Standard changes inside a delegated namespace are approved in advance. Records written by a policy need no approval each time, but the policy itself does. And high-impact changes, like zones, forwarding and wildcards, go to the board. One more point: the account the plane uses to write into each cloud is the most powerful identity in the design, so guard it. The DNS and DDI team adopts the classes before namespaces are delegated. Now, how to migrate.

## Slide 15 — Six phases, each closed by its evidence

The migration runs in six phases: inventory, coexist, move authority, bring in the clouds, retire AD DNS and DHCP, then harden and prove it. Name resolution has to keep working while authority moves, so every move runs the same small loop. The old system keeps answering until the new one is proven from every location, and a failed check just switches back. The program has planning estimates, from a day or two up to a few weeks, but they're estimates, not commitments. The decision: the DNS and DDI team closes each phase on its evidence, never on a calendar date. Next, the step you can't undo.

## Slide 16 — AD DNS retires through gates, not on a date

This is where DNS meets the identity program. While any domain controller remains, it needs DNS that accepts its registrations, so those records are the last thing to move. Retiring AD DNS is the one step you can't cheaply undo, so it's gated, not scheduled. Five gates, all program design: the inventory reconciles; the critical records resolve everywhere for thirty days; ninety days of parallel running; failover actually tested; and no traffic left on the old servers. Get it wrong and you get forest-wide sign-in failures. So the sponsor and CIO set the date only after every gate passes, with the records officer involved. Next, running it.

## Slide 17 — Operate it as one plane, and prove it

One plane only helps if divisions can still run their own networks through it, and every change leaves a trace. So divisions get scoped control, and every change, by a person or a script, goes through one interface and one audit trail. The logs feed security operations, the inventory and the authorization package. And measure one thing first: resolution-path consistency, meaning the same name gets the intended answer from every location. Baseline it now, set a target, and report it. The book doesn't say who reports, so in our model it's the DNS and DDI team, reporting to the authorizing official. Next, cost and risk.

## Slide 18 — Price the meters; keep the residual risk on record

Commercial DDI licensing isn't published, so get quotes from every candidate on the same assumptions. The cloud pieces do have public prices, and every model uses them. One region's cloud resolver hub runs about three hundred and sixty dollars a month before zones and queries, and the book corrects earlier guidance that got the pricing backwards, so re-check any budget built on it. Some risk remains after the plane is in: sync lag, a management outage that blocks changes, encrypted DNS bypass, and the limits of a Moderate authorization. The sponsor and CIO handle this before selection, and record the residual risk. Let's pull the decisions together.

## Slide 19 — Decisions to make, owners and timing

So, the decisions. The sponsor and CIO authorize one policy plane, choose the platform on evidence, name the decision rights, and retire AD DNS only through the gates. The CISO designates the encrypted resolvers now, puts DNS and DHCP logs in the logging plan by November 18, and sets signing and validation, with standing exceptions going to the authorizing official. The DNS and DDI team reconciles the AD inventory before any domain controller goes, aims every edge at agency resolvers, makes IPAM the address authority, and settles the five decisions within ninety days. Govern the name layer before the last domain controller goes. Book 08 has the detail, every claim footnoted. Thank you.
