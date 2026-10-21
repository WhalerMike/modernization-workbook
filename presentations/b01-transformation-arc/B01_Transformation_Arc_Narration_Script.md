# Book 01 — The Transformation Arc — narration script (practice copy)

## Slide 1 — Why Is Modernization So Hard?

This briefing comes from Book 01 of the Federal Modernization Workbook, The Transformation Arc: the move from a domain-joined client-server estate to cloud identity, cloud device management and governed hybrid operations. Book 01 is the workbook's overview, and each part of it points to the book that carries the detail.

I'll take four questions: why modernization is so hard, what has to change, who leads it, and how to get there.

The short version: modernization is a governance rebuild, not a platform swap.

## Slide 2 — Four eras built the estate; none kept one truth

Why is modernization so hard? The estate got here in four eras. Each solved a real problem, and none replaced what the first era had: one authoritative answer.

On the mainframe, one machine held the data and enforced access to it. By the late 1980s, regional databases and directories had spread that truth across a dozen systems. From 2010 the direction reversed. OMB reported that federal data centers had grown from 432 in 1998 to more than 1,100 in 2009, and the December 2010 reform plan targeted closing at least 800 by 2015, wiring offices back to distant facilities. Then email and collaboration moved to the cloud, while identity stayed in regional domains.

And each fix assumes the last one is done. Zero Trust assumes governed identity, governed identity assumes a clean directory, and a clean directory assumes someone owns it.

## Slide 3 — Sessions carried trust; tokens are checked each time

Second, trust itself changed. In Active Directory a user signs in once and gets a Kerberos ticket-granting ticket that lasts 10 hours by default and renews for 7 days. An open connection isn't interrupted when its ticket expires, and an account disabled during the day can keep using tickets issued before.

Zero Trust decides each request against current policy. An Entra access token lasts one hour by default, or up to 28 hours with continuous access evaluation, because the service subscribes to events such as a disabled account and stops honoring the token in near real time. It's a badge checked at every door.

Distance doesn't break tickets. It hurts the trips to a domain controller: sign-in, password changes and policy. On the book's worked arithmetic, Portland to Washington has a floor of about 45 milliseconds round trip, whatever the bandwidth.

## Slide 4 — The OU tree was the governance tree

Chapter 02 names the problem. Active Directory was the implicit governance model for every Windows-era service, and nobody wrote it down.

Microsoft's design guidance says organizational units exist to apply Group Policy and delegate authority, and that both inherit down the tree. So placing one user in an OU did five things at once. It handed the account to that branch's administrators, applied every policy linked along the path, fed the tools that built groups from position, bound it to the branch's delegation authority, and drew an audit boundary.

Entra ID has no OU tree. Dynamic groups follow attributes, and administrative units scope delegated roles but can't be nested. Neither rebuilds the tree on its own; the rebuild has to be written down.

And Microsoft still supports and enhances Active Directory, so retiring it is an agency decision, not a vendor deadline.

## Slide 5 — Eleven categories, and the failures are silent

Most "AD to Entra ID" projects are scoped around users, groups and mailboxes, the visible part. The program counts eleven categories of object that Active Directory governs: users, computers, service accounts, security groups, Group Policy, DNS and DHCP, certificate services, RADIUS, LDAP, service principal names and trusts. Migrate the users into a flat directory, declare victory, and the rest are left behind.

These failures rarely throw clear errors. A certificate doesn't renew because enrollment was never re-pointed. A device fails network access because a group lookup comes back empty. An LDAP application stops because its bind account was deleted with the domain.

Organizations rarely fail because they can't list objects. They fail because nobody treats five steps as a discipline: enumerate, map each dependency to a target, keep delegation continuous, deliver through a governed pipeline, and detect drift.

## Slide 6 — One governed host, five roles, one writer

Now, what changes. Before anything moves, the program needs one place where every decision is written down, signed and replayable. Chapter 03 describes a reference platform host: one Windows Server 2025 server, supported to November 2034, with a standby.

The host has five roles: a version-controlled source of truth with signed commits; a reverse proxy for TLS and client certificates; an authentication bridge to the legacy forest; the transformation engine; and an adapter per dependency category. What matters is a single authoritative writer.

Governance and execution never mix. One layer validates and signs plans but never touches a target. The other runs authorized plans but decides nothing, under separate accounts, credentials and logs. The host reads Active Directory read-only and is protected as Tier 0.

Book 05 covers servers under Azure Arc in depth, and Book 04 covers change as code with evidence.

## Slide 7 — Identity: one HR stamp drives five outcomes

Identity comes first, because every later control reads the attributes. For the workforce, the authoritative source is the HR system of record, and OMB M-22-09 requires centralized identity management for agency users.

Four mechanisms rebuild what the OU tree did: attributes replace OU placement, dynamic groups replace OU-derived groups, administrative units replace OU delegation, and Conditional Access targeting replaces Group Policy inheritance. The program's contribution is the contract that binds them: one HR-sourced stamp drives membership, delegated scope, policy targeting, licensing and drift detection.

Two cautions. Dynamic membership usually updates within a few hours but can take more than 24, so design movers around that window. And HR provisioning must be the only writer of those attributes.

Tokens only work if this is right. Books 02 and 03 carry identity in depth.

## Slide 8 — Policy: regenerate Group Policy, don't copy it

Group Policy was Active Directory's most ambitious delivery system, and its most network-bound. A client applies it only when it can reach a domain controller, and every refresh is a trip to one. A cloud-native endpoint, Entra joined and in Intune, has no such dependency.

Don't port a fifty-setting GPO as fifty settings; that carries dead weight, old conflicts and manual targeting. Microsoft's recommended option is to start new rather than migrate. So the program regenerates one canonical policy per category, keyed to attributes, into Intune, Conditional Access and, for servers, Azure machine configuration, because Intune doesn't manage Windows Server.

Every change passes four stages: validation, a simulated tenant, a report-only pilot, then production. And prefer require to block, except where the federal SCuBA baseline demands a block, as for legacy authentication.

Book 05 covers the device detail in depth, and Book 04 the Conditional Access library.

## Slide 9 — DNS, DHCP and IPAM move together, and with AD

DNS, DHCP and address management are what agencies most often defer, because they still work. That's how they keep the old directory alive.

AD-integrated zones replicate with Active Directory, and domain-joined clients find domain controllers through records Netlogon registers in DNS, so DNS and AD retirement must be sequenced together. The target is a governed authority outside AD, Azure DNS Private Resolver as a forwarding bridge rather than an authority, and Azure private zones for cloud workloads.

A Windows DHCP server checks its authorization in AD every hour. That stops an unauthorized Windows server, not a rogue device. And one IPAM authority owns the address space; DNS and DHCP derive from it.

Leave the three for "Phase 2" and it rarely comes. A forest that still hosts DNS hasn't been retired. Book 08 covers the design in depth, and Book 09 the network underneath.

## Slide 10 — Compute: the domain join is the last thing to go

Once identity, policy and services have moved, domain-joined PCs and servers are the largest remaining dependency. User PCs end Entra joined and in Intune. Servers come under Azure Arc and machine configuration.

Hybrid join is a waypoint. Microsoft says it shouldn't be anyone's end state, and there's no supported way to convert a hybrid-joined device to Entra join without resetting Windows, so time the move to a hardware refresh.

Every service principal name is an application that expects Kerberos, and each needs a decision: migrate it to modern authentication, retire it, or, as a last resort, island it with an end-of-life date. No server leaves the domain until every SPN on it is resolved, and NTLM goes in the same pass.

And compute stays with its data until profiling shows the round trips are reduced. Books 05 and 06 carry the detail in depth.

## Slide 11 — The access plane: every request decided again

When Active Directory retires, being inside the network stops meaning anything. OMB M-22-09 says users should log into applications rather than networks.

The replacement has four surfaces: Zero Trust as the model, Conditional Access as the per-request decision, SASE as the edge, and phishing-resistant MFA as the proof. M-22-09 requires that MFA for staff, contractors and partners, and BOD 25-01 makes blocking legacy authentication mandatory.

Smart cards stay. Entra certificate-based authentication moves validation from the domain controller to Entra ID, but a card counts as phishing-resistant only if the binding policy makes it multifactor. And issuance needs a successor first, because an enterprise CA depends on AD DS.

Administrators hold no standing privilege: roles are eligible in Privileged Identity Management, and a vault covers what can't be made just in time. Book 04 covers the policy and privilege model in depth, and Book 07 the certificates.

## Slide 12 — Instruments versus orchestra: who leads it

Who leads it? Chapter 09 puts it in one line: Microsoft provides the instruments; the program provides the orchestra. The tools are each excellent, but none of them decides what the organizational structure should become, or what to do with the findings, and no vendor deadline forces the decision.

So name one decider per row. The sponsor and CIO own scope, funding, sequence and when AD components retire. The authorizing official is the only official who can accept risk, so every deferred cutoff and Kerberos island reaches them. The CISO sets control requirements. The program office and its steward hold the repository and clear most gates. HR decides what worker attributes mean, application owners sign off their cutovers, and the records officer is consulted before any domain controller is decommissioned.

Each month, ask about the drift trend, signed changes and open risk acceptances.

## Slide 13 — Inventory first: read-only, with provenance

How do you get there? Start with an inventory. You can't modernize what you haven't enumerated, and nothing is retired until it's written down, read-only, with proof of how it was read.

The assessment account holds no write rights, the code imports no write commands, and every call is logged. A default authenticated account already reads more than most teams expect: the topology, the OU tree, most Group Policy, users, groups and certificate templates. A narrow second tier adds only server-side exports, never secrets. Every run records who, when, against what, and a hash of every file.

Eleven streams feed the risk scoring. One example: Windows Server 2012 extended updates through Arc ended on October 13, 2026, and Windows Server 2016 reaches end of support on January 12, 2027, so every such server needs a disposition.

And no application leaves its data until its transactions are profiled.

## Slide 14 — Analyze, plan, deliver, under an actuation ceiling

Chapter 11 turns the inventory into change in three stages. Analyze builds current-state and target-state graphs and a diff. Plan expands the diff into typed actions, each scoped to one object, ordered by dependency and paired with its rollback. A plan must pass validation, then authorization by an approver of record who isn't the author. Only then does a separate execution identity deliver it, verifying every action and closing with an evidence packet.

The actuation ladder caps how far automation may go: record, observe, advise, gated actuation, and autonomy only for enumerated low-risk classes. Gated actuation is the default ceiling, because it's a posture an authorizing official can sign. CISA calls its maturity model a general guide, not a strict set of requirements, so this is design, not mandate.

When nothing has drifted, the next run produces a zero-action plan.

## Slide 15 — The roadmap: seven phases, gated by data

Chapter 12 sequences everything as an illustrative fifty-two-week program: seven phases, from pre-flight to steady state, with five workstreams running in parallel. Large federal estates typically run multi-year; the weeks are a sequencing model, not a commitment.

A phase opens only when the last gate clears, and gates read from data: "zero drift for fourteen days" is a query, not a signature. The steward clears most gates; the sponsor and CIO sign the one that says Active Directory is retired.

Under it all is one structural move: separate truth from enforcement. A governance layer holds and reconciles authoritative state, while identity, network and device platforms enforce at runtime. Five principles follow: one authoritative source, application-aware networking, token-based identity, governing actively, and fewer synchronous round trips.

And read one clock correctly: FedRAMP's 2027 date governs cloud providers' certification. The agency still authorizes its own systems.

## Slide 16 — Decisions to make, and next steps

So, four decisions.

Name the owners: one decider per row, starting with the sponsor, the authorizing official and the steward, and confirm who holds the zero trust implementation lead role M-22-09 required.

Run the read-only assessment, across all eleven categories, committed with provenance.

Stand up the platform host, so every change has one writer and a plan.

And set the dates: gate dates on the sponsor's calendar, and every exception's end date on the authorizing official's.

None of this requires a vendor decision on day one. Start with an inventory, an owner, and a date.

Modernization is a governance rebuild, not a platform swap. Book 01 is the map, and Books 02 to 09 carry each part in depth, every claim footnoted. Thank you.
