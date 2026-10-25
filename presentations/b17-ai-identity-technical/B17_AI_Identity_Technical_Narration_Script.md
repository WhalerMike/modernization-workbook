# Book 17 — AI Identity Governance — Technical Deep Dive — narration script (practice copy)

## Slide 1 — AI Identity Governance: the technical deep dive

Welcome. This is the technical deep dive for Book 17 of the Federal Modernization Workbook, AI Identity Governance. It's for identity engineers, security engineers and platform owners, the people who issue the credentials AI signs in with and watch what it does. The book's idea is simple: an AI agent that can act is an account, and it needs what every account needs. An owner, a credential, limits, and an end. Part 1 is the identity and the inventory. Part 2 is governing it and proving it. One note before we start: the product details here are dated October 2026, and they move fast. Let's begin with why.

## Slide 2 — Why this matters: an agent that acts is an account

Here's why this matters. A chat assistant drafts something and a person decides what to do with it. An agent doesn't wait. It reads the mailbox, sends the reply and closes the ticket, under an identity that signed in and holds permissions. Only a small share of federal AI is agentic today, but it's the share that grows fastest. Notice the red path: an API key skips the identity provider, so no policy ever sees the call. And the risk is identity-shaped. A manipulated chatbot gives a bad answer. A manipulated agent takes an action, and the damage is whatever its identity can reach. So, Module 1.

## Slide 3 — Module 1: AI agents as identities, and the federal rules

Module 1 sets the ground. We'll look at how AI got into agencies without the identity program noticing, why the controls you already have cover it, the seven things every AI identity needs, and what the federal AI rules actually ask of you, including the one thing people most often get wrong about authorization.

## Slide 4 — AI arrived outside the program; the controls still apply

Most AI didn't come through the front door. It came as a vendor pilot, a key in a config file, or a feature switched on in software you already had. So it arrived without what an employee's account gets automatically: an owner, a place in the organization, a governed credential, reviews and an end date. The good news is you don't need new controls. The account, identifier, authenticator and least-privilege controls you already meet apply to non-person accounts too. The real gap is coverage. The AI's account just isn't in the inventory those controls are tested against. Here's what closing that gap looks like.

## Slide 5 — Seven things every AI identity needs

The program's answer is seven things every AI identity needs: one record, a named human owner, a place in the organization, credentials with no stored secrets, monitoring, a lifecycle that ends, and evidence the authorizing official can use. Each one maps to a chapter, and to controls you already meet. Be clear that this is the program's design, not a new federal rule. And keep the order practical. Start with agents, the systems that can act, because that's where the damage would be, then work outward to the systems that only answer. Now, what do the federal rules actually say?

## Slide 6 — The rule set: what binds, what guides, what's missing

Federal AI rules changed a lot in two years, and one order even changed the vocabulary to super intelligence, though the legal definition didn't move. On the left are the documents that bind you, on the right the guidance. The main memo gives you a Chief AI Officer, an annual inventory, compliance plans and seven practices for high-impact AI. For engineers, what it leaves out matters more. It creates no AI authorization, and it says nothing about accounts, credentials or permissions. Those stay with the controls of the system the AI runs in. And NIST's AI overlays aren't even drafted yet. So, authorization.

## Slide 7 — No AI-specific ATO: two decisions, one record

There's no AI-specific authorization to operate. An AI system goes through your agency's existing process, before it's deployed. What high-impact AI adds is a second, separate signature: someone accepts the risk of the AI use case after an independent review. That's two decisions, possibly by two different people, and neither one replaces the other. The program ties both to one identity record, so both people read the same facts about what the system is and what it can reach. And if the inventory says a deployed system has no authorization, that's a finding against your own policy. That brings us to the inventory.

## Slide 8 — Module 2: The inventory and the kinds of AI identity

Module 2 is about knowing what you have. We'll read the AI use-case inventory as identity data, see why a use case isn't an identity, sort AI by whose token it presents, look inside Agent ID, check what each government cloud really has today, and end with six kinds of AI identity.

## Slide 9 — The inventory read as identity data: anchors and gaps

The inventory is the only government-wide list of federal AI, but it was built to inform the public, not to run identity. Read it with an identity team's eyes and its fields sort three ways. A few are anchors you can key a record on, like a stable ID, the bureau and the lifecycle stage. Some are leads you have to verify, like the contact and the authorization answer. And everything that decides what an AI can touch simply isn't there. Even the contact often names a shared mailbox, not an owner. And the unit is wrong, which is the next slide.

## Slide 10 — A use case isn't an identity: join on the directory

A use case is a scenario, and scenarios don't sign in. One assistant can run on four different identities, and one shared platform can serve dozens of use cases under a single identity. The public file doesn't even have a stable key on every row. So the program puts the join on the identity side. Each AI system's identity record carries the inventory ID, and every directory object it uses points back to that record. That same tag can later drive policy. Join against your agency's own submission, not the public file. Next, what the inventory can say about the high-impact practices.

## Slide 11 — High-impact fields report status, not evidence

The inventory now has a field for every one of the seven high-impact practices. But those fields hold answers, not proof. A yes for monitoring tells you the agency believes it monitors, not what it found. In the published data, many high-impact systems answered nothing, and in progress outnumbers yes everywhere, which fits agencies still part way through. Here's the useful part for this room. Three practices are ones the identity program proves as a by-product: monitoring from the system's own logs, operator training checked against a real group, and a fail-safe that's a tested disable. Now let's sort the identities themselves.

## Slide 12 — Whose token does it present? Three subjects and a key

What kind of identity an AI has comes down to one question: whose token does it present? If it acts for a signed-in user, the user's policies and consent apply, and it can do everything that user can. If it acts as itself, its policy surface is thin. All you can do is block it, so least privilege does the real work. If it has its own user account, be careful, because your all-users policies don't reach it. That's why Microsoft says to write a policy for each token subject. And the red path again, a key outside the identity provider, is invisible. Let's look inside Agent ID.

## Slide 13 — Agent ID: the blueprint is the credential boundary

Agent ID adds a small object model. The blueprint is the template, and it holds the credential. The agent identities created from it hold permissions but no credential of their own. The big consequence is that the blueprint is a credential boundary. One credential serves every agent of that kind, and one action on the blueprint reaches all of them, including future ones. Second, what a blueprint declares isn't granted until someone consents, so real access is a sum you have to read. Third, every agent gets a human sponsor at creation. Now, which clouds actually have this?

## Slide 14 — What's GA, what's preview, and what each cloud has

Your cloud decides what you can use, and this picture changes monthly. The platform is generally available. GCC has a documented subset: you can govern agent identity and access, but not yet get Microsoft's audit and data protection for agent activity. GCC High and DoD have nothing published, so treat agent identities as unavailable there until Microsoft confirms it in writing. Licensing is its own trap, and the FedRAMP High authorization is still pending. The program's rule is to build on what's generally available in your own cloud, and to treat preview as something you watch. So how do we classify all this?

## Slide 15 — Six kinds of AI identity, and where the risk sits

Putting it together, the program sorts every AI system into six kinds of identity: a delegated assistant, workload-identity AI, an agent identity, an agent with its own user account, a vendor-hosted service, and an unmanaged key. Each kind tells you who owns it, how it should authenticate, what policy can reach it, and how it ends. Most of the risk sits in the last two. A vendor's service is visible but outside your workload policy. A raw key isn't in the directory at all, so it has no owner and no end until you find it. Everything else can be governed, and Part 2 does exactly that.

## Slide 16 — Module 3: Owners, lifecycle, credentials and privilege

Module 3 makes governance real. We'll attach every agent to accountable people, run its lifecycle from the sponsor's own HR events, give it credentials with no stored secrets and only the access it needs, and then bound what it can call, through policy, tool registration and data.

## Slide 17 — Owner, sponsor and manager, and the program's rule

An agent has no hire date, so its lifecycle has to hang from a person who does. Agent ID gives you three roles. The owner holds the technical keys. The sponsor answers for why the agent exists, and can switch it off but deliberately can't switch it back on. The manager places an agent's user account in the organization. The catch is the defaults: left alone, whoever built the agent ends up sponsoring and owning it. So the program sets it on purpose. An HR-mastered federal sponsor, a small group of stewards as backup, a separate technical owner, and administrators sponsor nothing. Here's how that drives the lifecycle.

## Slide 18 — The sponsor's HR events have to reach the agent

The lifecycle mirrors a person's. Nothing goes to production without an approved inventory entry and a handshake. The event that matters most is the sponsor leaving, because the agent never does. Lifecycle workflows can hand sponsorship to the manager, and the program hangs that off HR's own events and gives the manager a short window to actually confirm. Then there's a neat inversion. Access comes in packages with end dates, so if the sponsor ignores the renewal, the access simply expires. Ignoring the review removes access instead of keeping it. Now, how an agent ends.

## Slide 19 — Retirement and orphans: disable first, then delete

Ending an agent takes two steps, and the program keeps them apart: disable first, then delete. Deleting a blueprint cascades to all its agents, slowly, and restores only work for thirty days, so disable, record the decision, wait, and then delete. An agent is orphaned when any of its anchors fails: no confirmed sponsor, no owner, no activity, no inventory record, or a deleted blueprint. A person disables it, never automation, and the office gets thirty days to decide. Where agent features aren't available, run the same lifecycle on application objects, and say honestly that it's weaker. Next, credentials.

## Slide 20 — Credential order: no stored secrets on the blueprint

An agent can't do multifactor authentication, so its credential has to be right from the start. Because the blueprint holds the credential for every agent made from it, the order matters: a managed identity first, federation from the agent's own platform next, a certificate in a vault only if neither works, and a client secret never in production. The program enforces that with an app management policy that already covers blueprints, so a production secret is a finding. And watch the keys an agent uses for its tools. An unavoidable key needs a vault, an owner and a rotation date. Now, privilege.

## Slide 21 — Least privilege: Microsoft's block list is only a floor

Least privilege starts with choosing how the agent acts: for a user when someone's present, as itself only when there's a reason, and with its own user account only when it truly needs a mailbox. Microsoft blocks the most dangerous roles and permissions for agents, but that's a floor, not least privilege. Agents can still hold roles that are privileged in your tenant, so apply your own risk classification. Keep inherited permissions narrow, because one broad setting turns every future grant into a grant to every agent. And no agent holds a standing privileged role. If it seems to need one permanently, that's a design defect. Next, policy.

## Slide 22 — Conditional Access follows the token subject

Conditional Access follows the token's subject, so one policy rarely covers an agent. For autonomous agents, the recommended pattern is simple: block every agent identity except the ones you've approved. The program builds that in report-only mode and sets the approval tag only during the production handshake, so the report shows every agent that skipped it. It stays in report-only until the agent targets leave preview in your cloud. Plan around the known gaps, like the token exchange step that policy can't see. And when risk detection flags an agent, tell its sponsor too, because they know what normal looks like. Now, tools and data.

## Slide 23 — Three boundaries on what an agent can call

An agent's reach is the sum of the tools it can call, so the program draws three boundaries. First, identity: what the agent can get a token for. But the protocol many agent tools use makes authorization optional, so some tools sit outside that layer. Second, a registry of approved tools, so a call to anything unregistered is drift. Third, data protection, which isn't available for agents in GCC yet, so there your only data boundary is narrow permissions, and you should record that gap. Anything outside all three, like a raw key, becomes a finding. That takes us to monitoring.

## Slide 24 — Module 4: Monitoring, the scan and authorization

Module 4 is about watching and proving. We'll find where AI shows up in the logs, hunt shadow AI on four surfaces, turn gaps into findings, run the inventory scan, and package the evidence an authorizing official actually needs.

## Slide 25 — Where AI sign-ins and changes land in the logs

Monitoring starts with knowing where AI shows up in the logs, and that's less obvious than you'd think. An AI built on an ordinary app or managed identity looks exactly like any other workload. Nothing in the log says it's AI or who sponsors it. Only your identity record can. Agent ID objects are easier to spot, but some logs still don't separate agents from apps, so your detections belong on the sign-in and audit tables. Alert on things that happen outside your pipeline, like new credentials or grants. And export everything on day one, because history starts when export does. Next, what nobody declared.

## Slide 26 — Shadow AI: four surfaces, one reconciliation

For AI, a lot of what matters was never declared, so discovery has to be standing, not a one-time cleanup. Shadow AI shows up in four places: services people use, apps holding consented access, agents on endpoints, and AI built in your own clouds. Each needs a different tool, and none sees everything. The test is the same everywhere: does this match an identity record? Match on the record's key, never on a display name. And remember the blind spot. An agent using a raw key produces no identity signal at all, which is why endpoint and network views aren't optional. Now, the findings.

## Slide 27 — AI drift findings: class, severity and who decides

Every gap becomes a finding with a class, a severity and an owner. The top one is the reason this book exists: an agentic system with no governed identity. It's the highest priority, and it's never fixed automatically, because the right answer might be issuing an identity, disabling the agent, or fixing a mislabeled inventory entry. That's a decision, not a repair. A missing authorization starts lower because the inventory can be wrong, then rises once the records confirm it. Each finding becomes one evidence record, keyed on the identity record, and it closes only when a later look shows it's fixed. Next, the scan.

## Slide 28 — The inventory scan: answers first, then the directory

The scan is cheap because it reads answers agencies already gave. Load one year's inventory as a fixed input, and report rows you can't read instead of skipping them. Then run two kinds of checks: some on inventory answers alone, and the important ones that need your directory. On the public file, most live entries trip at least one check, but those are answers to reconcile, not findings and not systems. Prioritize agentic first, route every row to a named person, and close only when a later look shows the fix. Then each year, compare the two vintages. Could this run centrally?

## Slide 29 — A central scan: CDM's split, not its tooling

In principle, one operator could run the answer checks for every agency at once. People call that CDM for AI, but CDM works differently. Its tools run inside each agency and summaries flow up. What carries over is the split between who sees across agencies and who fixes inside them. A central scan sees only what was published, so it can't tell whether a credential exists, rotated or was revoked, and it can't see shadow AI at all. That last tier, governing the credential itself, belongs to each agency. A central scan starts the conversation. It doesn't finish it. Now, the package.

## Slide 30 — Five questions the authorizing official asks

Everything ends in the authorization package, because that's what the authorizing official reads, and only they can accept the risk. First ask where the AI runs: inside an existing system, as a new one, or on a provider's certified service. Even then, the identities that service creates in your tenant are yours. Then the package should answer five questions: who owns it, how it authenticates, what it can reach, who's watching, and when its access ends. One control deserves special attention. Service authentication isn't in any baseline, so a plan built only from the baseline never checks it. Tailor it in. Next, format and clocks.

## Slide 31 — OSCAL, the AI clocks, and overlays still to come

The package should be machine-readable, and the current version of OSCAL needs nothing AI-specific. The AI system is a component, each identity it uses is a user with its privileges, and the sponsor and owner are named roles. Just remember that privileges in the plan are a description; the proof is an observation from the directory. AI adds a few clocks beside annual security testing: the yearly inventory, a compliance plan every two years, and annual waiver certification. And NIST's AI overlays aren't drafted yet, so don't wait. Tailor your baseline now and compare when they arrive. Let's close with decisions.

## Slide 32 — Decisions, owners, and what to start on Monday

Every decision here has one owner. The Chief AI Officer requires every live inventory entry to link to an identity record. The identity governance officer makes sure that record exists before any credential does. The CISO sets the credential, policy and logging rules, the system owner decides what an AI may reach, and the authorizing official decides when a change needs reauthorization. And you can start Monday without buying anything: list your agents and their owners, scan your own inventory, build the block policy in report-only, export your logs, and tailor service authentication in. An agent that acts is an account. Give it an owner and an end. Thank you.
