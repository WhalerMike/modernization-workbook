# Book 17 — AI Identity Governance — narration script (practice copy)

## Slide 1 — AI Identity Governance: the executive briefing

Welcome. This is the executive briefing for Book 17 of the Federal Modernization Workbook, AI Identity Governance. It's for the people who make the calls: the CIO, the CISO, the Chief AI Officer, authorizing officials, the privacy officer and sponsors. The argument is short. An AI system that can act, not just answer, is an account. Most AI arrived outside the identity program, with no owner and no end date. And there's no separate AI authorization, so those accounts belong in the boundary your authorizing official already reviews. I'll take four questions: why, what, who and how. Each decision slide names the decision, its owner and when it's needed. Let's start with what makes an agent an account.

## Slide 2 — An agent that acts is an account

A chat assistant that drafts a memo is a tool; nothing reaches a record until a person acts. An agent reads the mailbox, sends the replies, closes the ticket and updates the case. Each step is an action, taken by something that signed in and holds permissions. That's an identity. It can act for a signed-in user, or as itself, and either way the identity provider sees it. Or it can use a stored A P I key, and then no policy and no sign-in log sees it at all. Today only 117 of 3,611 reported federal use cases are agentic, but that's the share that grows fastest. So count AI identities, not AI projects. Next, how they got here.

## Slide 3 — AI arrived outside the identity program

People join through a pipeline: an HR record, an account, access from their position, and a leaver process. AI mostly didn't. A vendor pilot, an A P I key in a configuration file, an assistant that shipped inside software you already license. So it typically has no owner, no placement, a stored secret, access nobody reviews and no end date. And the risk is identity-shaped. A planted prompt against an agent doesn't produce a bad answer; it produces an action, under a legitimate identity. The blast radius is whatever that identity can reach. So the first decision: an agent with no governed identity is a high-priority finding, and a person decides its fate. The good news: the controls already exist.

## Slide 4 — The controls already apply; coverage is the gap

No new control family is needed. The security control catalog already covers system and service accounts, identifiers and credentials for services, least privilege for processes, and services that authenticate before they talk. NIST's AI framework adds inventory, decommissioning and clear roles. So the gap isn't the catalog. It's coverage: the AI system's account is often simply missing from the account inventory those controls are tested against. The book's model gives every AI identity seven things, from an identity record and a named owner to a lifecycle that ends and evidence the authorizing official can use. That model is program design, built on controls you already meet. Now, what the federal rules actually say.

## Slide 5 — What federal AI rules require, and what they don't

Federal AI policy was rewritten in 2025. One OMB memo, M twenty-five twenty-one, governs use: a Chief AI Officer, an annual use-case inventory, and minimum practices for high-impact AI. Its companion, M twenty-five twenty-two, governs buying AI, and says plainly that AI run as an information system needs an authorization to operate before it deploys. The 2026 executive orders harden federal systems and change vocabulary, not obligations. What the rules don't do matters just as much. There's no AI-specific authorization, and the memo sets no identity requirements at all. So don't build a second approval track. Put the AI system's accounts in the boundary your authorizing official already reviews, before it deploys. High-impact AI adds one more signature.

## Slide 6 — Two signatures before high-impact AI deploys

High-impact AI is the kind whose output drives decisions with real effects on rights or safety. For it, the memo requires seven minimum practices: testing, an impact assessment, monitoring, training, oversight with a fail-safe, appeals, and feedback. The impact assessment ends with a signature from the official accepting the risk, after an independent review. Here's the catch. That signature isn't an authorization, and the memo says so. A high-impact use case needs both: the signed risk acceptance and the system's authorization to operate, often from two different people. So the decision is to put both decision-makers on the same record of what the system is, who owns it and what it can reach. Where does that record start?

## Slide 7 — The inventory is a seed list, not an identity source

It starts with the use-case inventory, the one AI list every agency keeps. Read as identity data, it gives you a stable ID, an office and a lifecycle stage, where retired means a leaver event. It leaves blank everything that decides what an AI system can touch: the account it signs in as, its credential, its permissions and its accountable owner. And its high-impact fields report status. They say yes or in progress; they don't carry a log, a document or a name. So treat it as the seed list. The decision belongs to the Chief AI Officer: no use case is recorded as piloted or deployed without a link to its identity record. Next, what kind of identity.

## Slide 8 — Kinds of AI identity, and what your cloud has today

An AI system's identity isn't the model. It's the software around it, sorted by whose token it presents. A signed-in user's, so it can do everything that user can. Its own, as a workload or agent identity, where today the only policy control is to block it. Or no token at all, just a key. Microsoft's agent identity platform became generally available in April 2026, but the agent policies are still preview, G C C has a partial subset, and GCC High and DoD have no published availability. And licensing governance for people doesn't license it for agents. So the CIO budgets the licenses, and every capability is confirmed in your own cloud before anyone plans on it.

## Slide 9 — A named human, and a lifecycle that ends

An agent has no hire date and no separation date, so its lifecycle has to hang from a person who does. Left to the defaults, the sponsor is whoever built it, often a developer. The book's rule is two named humans and a record: a federal employee as sponsor, a technical owner who holds the credentials but never sponsors, and an inventory record that names the same sponsor. When the sponsor leaves, sponsorship moves to their manager, who has ten business days to confirm, or the agent is orphaned and suspended. And access expires unless the sponsor renews it. The decision is the system owner's: name that sponsor at creation, and move it to the using program at publication.

## Slide 10 — No stored secrets, no standing privilege

An agent can't be asked for a second factor, so everything it may do is decided before it asks. Credentials first: a managed identity or federation, so there's no stored secret; a certificate only where neither works; and a client secret never in production. Then permissions. Microsoft blocks the very top roles for agents, but still lets one hold Exchange or SharePoint administrator. That's a floor, not least privilege. So the book's rule is no standing privileged role for any AI identity, and a policy that blocks every agent not yet approved, kept in report-only mode while it's preview. The CISO sets those requirements, and identity engineering builds them, before the first production agent.

## Slide 11 — Watch it, and find what nobody declared

An AI identity nobody watches drifts the day after it's issued, and AI nobody declared is drift from the start. So the program compares three things: what was declared, what known identities are seen doing, and what discovery finds. Shadow AI shows up in four places: AI services staff use, apps holding consented access, agents on endpoints, and AI built in your own clouds. No single tool sees all four, and none sees a static key. Each gap becomes a finding with an owner and a clock, and the serious ones halt for a person. Security operations contains shadow AI. Then the system owner decides its future, or the CIO, when it belongs to no system. So who owns it?

## Slide 12 — Two decision tracks meet on one AI system

Ask who owns an agent's identity and the AI office points at the identity team, the identity team points back, and the program office says it already signed the impact assessment. The answer is two tracks. The Chief AI Officer owns the declared side: the inventory, high-impact determinations and waivers. The authorizing official alone accepts the system's residual risk. Neither stands in for the other, and AI adds no new authorizing official and no new account manager. A few separations keep it honest; for example, the official who waived a practice shouldn't be that system's sole authorizing official. And one rule underpins everything: the identity record exists before any credential is issued. The identity governance officer decides that.

## Slide 13 — Who decides what for an AI identity

Here's the matrix in one view, with one decider per row. The Chief AI Officer owns the inventory, the high-impact calls and waivers. The use-case risk acceptor signs the impact assessment; the authorizing official signs the authorization. The CISO sets the control requirements, the CIO owns licenses and shadow AI that belongs to no system, and the system owner names the sponsor and decides what the AI may reach. Contractors can build and run agents; government officials sponsor, authorize and accept risk. And because agents change quickly, one decision recurs. Every new tool, permission, user account or model is raised by the system owner as a possible significant change, and the authorizing official decides. Now, finding the gaps.

## Slide 14 — Run the inventory scan on the agency's own file

The inventory scan is cheap, because it reads answers agencies have already given. It's useful only if every answer it questions ends with an owner who goes and looks. Run over the published 2025 file, the simple checks hit 72 percent of the live entries: more than half give no authorization answer, and a third name no contact. Those are answers to reconcile, not verdicts on agencies. The checks that matter most, like an agent with no identity record, need the directory, so only the agency can run them. The decision: run the checks on your own submission every vintage, agentic and authorization findings first, and close a finding only when a later look shows it fixed. And centrally?

## Slide 15 — A central scan starts the conversation, not the fix

The same answer checks could run once, centrally, over every agency's published file. That's the book's proposal, not a federal program. It borrows one thing from Continuous Diagnostics and Mitigation: a central view, with agencies doing the remediation. But it reads public answers, not tool output, so it can't see whether a credential exists, rotated or was revoked, and it can't see AI nobody inventoried. A central scan is a good way to start a conversation with every agency at once. It isn't a way to finish one. Governing the credential stays with the agency, which brings us to what the authorizing official needs to see.

## Slide 16 — Evidence the authorizing official can use

Every record so far ends up in one place: the authorization package. First question: whose boundary does the AI run in? Inside an authorized system, it's a new component and a possible significant change. On its own, it's a new system. On a provider's certified cloud service, the certification covers the provider, but the identities and grants that service creates in your tenant are yours. Then the package answers five questions: who owns it, how it signs in, what it can reach, who's watching, and when its access ends. One gap to close: the control for services authenticating to each other isn't in any baseline. So the system owner tailors it in, and the authorizing official approves the plan.

## Slide 17 — Keep the evidence current: three AI clocks

Then keep it current. AI governance adds three clocks beside the annual security testing you already run. The inventory, at least once a year. The compliance plan, every two years, with the next due in 2027, and it's easy to miss if you only track the inventory. And waivers, certified every year and reported within thirty days of any change. NIST's control overlays for AI aren't out yet; there's no public draft. So don't wait. Tailor the baseline now and compare when they're final. The decision: every waiver and pilot certification becomes a governed exception with an expiry date, and one with no end date goes to the authorizing official. Let's pull the decisions together.

## Slide 18 — Decisions to make, owners and timing

So, the decisions. System owners treat any agent with no governed identity as a high-priority finding the moment it's found. Authorizing officials authorize AI through the existing process, before deployment, with both high-impact signatures on one record. The Chief AI Officer links every live inventory entry to an identity record and runs the scan each vintage. The CIO budgets the licenses. System owners name an agency employee as every sponsor, and raise each new tool or model as a possible change. The CISO sets the rules: no production secrets, no standing privilege. And no credential is issued before its identity record exists. None of this needs a new authorization. Book 17 has the detail, every claim footnoted. Thank you.
