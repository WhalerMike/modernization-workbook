# Book 17 — AI Identity Governance — narration script (practice copy)

## Slide 1 — Every AI System Needs an Identity

This briefing comes from Book 17 of the Federal Modernization Workbook, AI Identity Governance, the last book in the series. It's written for Chief AI Officers, C I Os and CISOs, identity and security operations teams, I S S Os, and authorizing officials.

I'll take four questions: why AI agents need identities and owners; what governing them involves; who owns AI identity; and how to scan the inventory and evidence AI systems for authorization.

The short version: an AI system that can act is an account with permissions. Most were deployed outside the identity program, and there's no separate AI authorization to fall back on.

## Slide 2 — An agent that acts is an account

A chat assistant that drafts a memo is a tool. Nothing it does reaches a record until a person reads the draft and acts. An agent is different. It sends replies from a mailbox, closes tickets and updates case records. Each step is an action against agency data, taken by something that signed in and holds permissions. That makes an agent an identity.

An AI system that acts reaches data in one of four ways: on behalf of a signed-in user, as itself, as its own user account, or with an A P I key. The first three run through the identity provider. The fourth bypasses it entirely, so Conditional Access never applies and no sign-in is evaluated.

Today the agentic share is small. OMB's 2025 inventory holds 3,611 use cases, 445 of them high-impact. 117 are classified agentic, and 38 of those are in pilot or deployed. It's also the share that grows fastest.

## Slide 3 — AI arrived outside the identity program

People join through a pipeline the identity program built, from an HR record to a leaver process. AI mostly came in another way. A mission office ran a pilot with a vendor. A developer put an A P I key in a configuration file. A product the agency already licensed shipped an assistant. None of those paths produces an owner of record, a placement, a governed credential or an end date.

The risk is identity-shaped. NIST's generative AI profile describes prompt injection, where planted input makes a system misbehave. Against an agent with broad permissions, a successful injection is an action, a message sent or a record changed, under a legitimate identity. The blast radius is the access it holds.

No new control family is needed. Account management, identifier and authenticator management, least privilege and service authentication already cover non-person accounts. The gap is coverage: the AI system's account is often missing from the account inventory the controls are tested against.

## Slide 4 — What federal AI rules require, and don't

Federal AI policy was rewritten in 2025. OMB memo M twenty-five twenty-one governs use: a Chief AI Officer, an annual use-case inventory, compliance plans, and seven minimum practices for high-impact AI. Its companion, M twenty-five twenty-two, governs acquisition, and says AI operated as an information system must receive an authorization to operate before deployment.

What the rules don't do matters as much. There is no AI-specific authorization. Agencies must keep following Circular A-130 for AI systems, and the memo's own risk acceptance is separate from, and doesn't supersede, system authorization. It sets no identity requirements at all.

So a high-impact use case needs two decisions before it deploys: the signed risk acceptance on its impact assessment, and the system's authorization. One more note. Executive Order fourteen four thirty-four tells agencies to say Super Intelligence in non-statutory documents. The definition hasn't changed, and the book keeps the term AI, because the instruments it applies still use it.

## Slide 5 — The inventory is a seed list, not an identity source

The inventory is the only government-wide list of federal AI, so the program reads it as identity data. A few fields are anchors. The use-case ID is stable and never reused, so it can key a record. The bureau gives a placement. The stage is a lifecycle state, and Retired is a leaver event. Other fields are leads to check: the contact may be a public inbox, and the authorization field points to a boundary.

The facts that decide access aren't there at all: the principal the system signs in as, its credential, its permissions, and the person accountable.

The high-impact fields report status, not evidence. Each of the seven practices has a field, but each holds the agency's own answer. In the published file, 101 of 227 deployed high-impact use cases answered none of them. And a use case isn't an identity, so the program records the join on the directory side.

## Slide 6 — Whose token does it present?

An AI system's kind of identity is decided by whose token it presents, not by the model it runs.

There are four answers. Acting for a signed-in user, the user is the token's subject and the agent is the actor, so the user's policies apply, and the agent can reach everything the user can. Acting as itself, the agent's own identity is the subject, and the only Conditional Access control is to block it. Acting as its own user account, it isn't covered by policies aimed at all users. And with a stored A P I key, Entra ID issues no token at all.

Microsoft Entra Agent ID adds identity types built for agents: a blueprint that holds the credentials, agent identities created from it, and a required human sponsor. It governs only agents that use it. Most AI still runs as ordinary service principals and managed identities, and the same governance applies to them.

## Slide 7 — Release stage and government cloud, October 2026

The agency's cloud decides what it can use, so the book dates every product statement to October 2026. Microsoft announced the Agent ID platform, with blueprints, agent identities and sponsors, as generally available in April 2026, and sponsor lifecycle workflows in May. Several controls are still preview. The policy builder labels agent targeting in Conditional Access as preview, agent identities support only Block, the agent risk condition is preview, and agents' user accounts are limited to Frontier program tenants.

GCC has a partial, documented subset: identity and access governance for agents, but not Microsoft's audit, data loss prevention or network controls. GCC High and D O D have no published availability, so treat agent identities as unavailable there until Microsoft confirms otherwise in writing, and govern AI as workload identities. And Agent 365's FedRAMP High authorization is still pending. The program builds on what is generally available in the agency's own cloud, and keeps preview features as watch items.

## Slide 8 — A named human, and a lifecycle that ends

An agent has no hire date and no separation date, so its lifecycle has to hang from a person who does. Agent ID separates the owner, who manages credentials, from the sponsor, who is accountable for purpose and lifecycle and can switch an agent off but not back on.

Left to defaults, the sponsor is whoever built the agent. The program decides instead: the sponsor is a federal employee mastered in HR, a small dynamic group of stewards is the second sponsor, and the technical owner is never the sponsor.

The lifecycle follows that person. When the sponsor moves or leaves, the HR event triggers a transfer, and the new sponsor has ten business days to confirm the agent is still needed. Access comes through packages with end dates, so expiry is the review: a sponsor who does nothing removes the access. Retirement is disable first, then delete. Once an orphaned agent is confirmed, a person disables it, never an automatic rule, and its office has thirty days to name a sponsor or retire it.

## Slide 9 — No stored secrets, no standing privilege

An agent can't be asked for a second factor, so everything it may do is decided in advance. Start with the credential. In Agent ID it lives on the blueprint and is shared by every agent created from it, so the blueprint is the credential boundary. The order is settled: a managed identity federated to the blueprint where the agent runs on Azure, workload identity federation from its own platform elsewhere, a certificate in a vault only where neither applies, and a client secret only for development and test.

Then privilege. Microsoft blocks agents from Global Administrator, but still allows Exchange and SharePoint Administrator. That's a floor, not least privilege, so the program's rule is that no AI identity holds a standing privileged role.

Last, an agent's reach is bounded by its tokens, its approved tools, and data protection. In GCC, Purview's agent controls aren't available, so scoped permissions are the data boundary.

## Slide 10 — Watch it, find what nobody declared, raise findings

Every AI identity drifts once it exists: a sponsor changes jobs, a developer adds a secret, an agent gets a new tool. M twenty-five twenty-one asks monitoring of high-impact AI to detect changes to a system after deployment, and the identity logs are where those changes land first.

So the program collects every AI identity's sign-ins, audit events and risk signals, and ties each one to its identity record, because nothing in a service principal's sign-in says it's AI. Discovery is a standing input. Shadow AI shows up in four places: services people use, apps holding consented access, agents on endpoints, and AI built in the agency's own clouds. Anything found without a record is a finding.

An agentic AI system with no governed identity is the finding this book exists to prevent. It's high priority: it halts, alerts a named person, and is never fixed automatically. And A P I keys stay invisible to all of it.

## Slide 11 — Two decision tracks, one identity record

Ask who owns an AI agent's identity and three offices answer at once. The way out is to separate the decisions and give each one a single decider.

AI adds one new executive and one new kind of decision. The Chief AI Officer owns the inventory, high-impact determinations and waivers, and can't delegate the waiver authority. The official accountable for the mission signs the use-case risk acceptance. Neither authorizes the system. The authorizing official alone accepts its residual security and privacy risk, and the system owner owns the AI system and decides what its identities may reach.

For the identity itself, the sponsor, an agency employee, decides whether the agent should exist; the technical owner, who may be a contractor, keeps it running; and the identity governance officer decides consent, transfers and orphans. Two signatures stay two, even when one person holds both roles.

## Slide 12 — Run the inventory scan

The inventory scan is the program's method, not a federal requirement, and it's cheap because it reads answers agencies already gave. Load one vintage and record what's missing. Detect gaps, from the answers and then the directory. Put agentic systems first. Report one row per finding, routed to a named role. And close a finding only on a later observation.

The scale is real. Of the 1,480 use cases recorded as piloted or deployed in the published 2025 file, 799 give no authorization answer and 488 have no contact; 72 percent trip at least one check. These are answers to reconcile, not findings against agencies.

The checks that matter most need the directory, so only the agency can run them: no identity record, no accountable sponsor, an identity with no inventory row, and a retired use case whose identities still hold access. A central scan of the public file could start that conversation, but it can't see a credential.

## Slide 13 — Evidence the authorizing official can use

Everything ends in the authorization package. It has to answer five questions about each AI system's identity: who owns it, how it authenticates, what it can reach, who's watching it, and when its access ends. Each has an artifact and controls behind it.

Two points stand out. First, service identification and authentication, control I A nine, describes an AI system calling a tool with its own identity, and it's in no NIST baseline and no FedRAMP class. So the program tailors it in. Second, three of the seven high-impact practices can be evidenced by the identity program: monitoring from the system's own logs, training checked against the operators' group, and a fail-safe that's a tested disable.

The package can be machine-readable in OSCAL, with no AI-specific structures needed. NIST's overlays for AI systems, renamed under the new executive order, have no public draft yet. So tailor the baseline now, and compare when they're final.

## Slide 14 — Decisions to make, and next steps

So, four decisions.

Count AI identities, not AI projects. No use case is recorded as piloted or deployed without a link to its identity record, created before any credential is issued.

Put a person's name on every one: an agency employee as sponsor, with HR's mover and leaver events reaching the agent.

Take away stored secrets and standing privilege: federated credentials first, no standing privileged roles, and a block-unless-approved policy kept in report-only mode while agent targeting is preview.

And authorize AI through the process you already run: two signatures for high-impact AI, with I A nine tailored in.

The next step needs no new tooling. Run the inventory checks on the agency's own submission, start with agentic systems and missing authorizations, and confirm each agent capability for your own cloud before planning on it.

Every AI system needs an identity and an owner. Book 17 has the detail, every claim footnoted. Thank you.
