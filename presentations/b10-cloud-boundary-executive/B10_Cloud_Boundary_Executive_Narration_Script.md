# Book 10 — Cloud Boundary & Landing Zone — Executive Briefing — narration script (practice copy)

## Slide 1 — What Does the Authorization Boundary Let You Use?

This is the executive briefing for Book 10 of the Federal Modernization Workbook, Cloud Boundary and Landing Zone. It's for the people who sign for a cloud system or answer for it: authorizing officials, ISSOs, CIOs and CISOs.

The book's argument fits in one line. The license says what you bought; the boundary says what you may use. A design that confuses the two fails in front of the assessor, not in the lab.

In the next thirty minutes I'll take four questions. Why the authorization boundary decides what you can use, and why so much of it stays invisible. What changed at FedRAMP in 2026, and what Government Community Cloud leaves out. Who owns the boundary. And how to respond when a capability falls outside it, and evidence that response in your own authorization package.

There's no configuration on these slides. Each decision slide says what the decision is, who owns it, and when you need it.

## Slide 2 — Three checks, three owners decide what you can use

Start with two agencies holding the same Microsoft 365 license. One runs a commercial tenant. Its admin center shows per-location network assessments, informed network routing to its SD-WAN, and an Adoption Score for its workforce. The other runs a GCC tenant and sees none of them, because Microsoft documents each one as unavailable there. Nothing in the license, the price list or the commercial documentation tells the second agency that.

The book's explanation is that three separate decisions, made by three different parties, have to line up before a feature is usable in a federal system.

First, the certification. FedRAMP certifies a specific cloud service offering at a certification class, and the FedRAMP Marketplace is the record. A feature outside the certified offering isn't covered by it, whatever the portal shows.

Second, the environment. Microsoft runs GCC, GCC High and DoD with features that differ from commercial, and it publishes those differences one feature at a time, on separate pages. There's no single machine-readable list.

Third, the agency's own authorization. The authorizing official accepts the risk of the agency's specific use: the configuration selected and the integrations enabled. FedRAMP says an agency should never create a standalone authorization to operate for a cloud service. It authorizes its own system, which uses the service.

What you can actually use is the overlap of all three. So the first decision is simple and cheap. Before the next architecture review or authorization milestone, require every cloud feature a design depends on to be listed with its Marketplace package, its availability in your environment, and the page that says so. Workload owners declare the dependencies, and the system owner checks each one. A feature with no citation is unverified, not available.

## Slide 3 — Why the gap stays invisible, and the example corrected

Why does nobody see this coming? Chapter 02 gives four reasons.

Surfaces are shared. Commercial and government tenants use the same admin centers and much of the same documentation, and Intune in GCC is the same instance as commercial Intune. Exclusions are scattered, usually one sentence on each feature's own page. Features move: Microsoft retired Adoption Score's technology-experience categories for every tenant in early 2026, so a gap list written in 2025 can name a GCC loss that's now a loss for everyone. And absence doesn't announce itself. A detection whose input never arrives produces the same dashboard as a quiet day. An agency that builds a Zero Trust control on a signal its environment doesn't deliver hasn't built a weak control. It has built no control, and nothing tells it so.

That's why discovery tends to come late, during an authorization cycle or an analytics rollout. And the problem is structural: no tenant setting turns on a feature the environment doesn't offer.

But the opposite error is just as costly. A widely repeated example listed five features as silently missing from GCC. Checked against Microsoft's documentation, one is: the Locations view of network connectivity in the admin center. Device Health Attestation and expedited updates are GCC High and DoD gaps. Endpoint analytics isn't a documented GCC gap. And Azure Arc is an Azure service, in Azure's FedRAMP High scope. An unverified boundary story sends an agency to build compensations it doesn't need.

The program's own register of GCC telemetry gaps has 26 rows. Eight are vendor-confirmed; fifteen are inference. So rebuild any gap list you rely on so every row cites a vendor page. The system owner keeps it, and the CISO decides what counts as evidence.

## Slide 4 — FedRAMP 2026: services are certified, and you still authorize

What changed at FedRAMP? FedRAMP announced its Consolidated Rules for 2026 on June 25, 2026, and they rename the product of the program. A cloud service offering is now FedRAMP Certified, at a certification class from A to D. FedRAMP's February 2026 notice maps the classes to the old baselines: Class B covers the former low-impact baselines, Class C includes the current Moderate baseline, and Class D the current High. It dropped numbered levels on purpose, to avoid confusion with the Defense Department's impact levels.

Two cautions come with the new labels. The class describes what FedRAMP assessed, not your use: agencies may authorize a service at any security category they deem appropriate under the Risk Management Framework. And certification doesn't replace your decision. Each agency still authorizes its own federal information systems, and notifies FedRAMP afterward with a copy of the authorization letter.

The dates matter for planning. Optional early adoption began on July 4, 2026. Adoption is mandatory for everyone on January 1, 2027. FedRAMP stops accepting new Rev5 certification requests on June 11, 2027, and says the end date for existing Rev5 certifications isn't final, but is likely no later than 2029. Plan against those words, not against a specific date someone repeats.

So for years you'll hold two kinds of package at once. Rev5 packages describe a boundary the provider drew. Packages under the new rules describe scope, as data. And the new rule families on assessment scope, change notification and data sharing apply to Rev5 Class C certifications too. Read each package in its own terms, and don't force one vocabulary into the other.

## Slide 5 — "The boundary" is now four sets of obligations, and yours

The rules also changed what the word boundary means. They're published as one machine-readable ruleset, so the vocabulary can be counted rather than characterized. In version 2026.10.13.01, the phrase authorization boundary occurs zero times. The word boundary occurs eight times: three times about the agency's own system, four times as a tag on rule families, and once in supply-chain guidance.

Those four families say what a provider's boundary now is. Minimum Assessment Scope, what is in the offering. Cryptographic Module Use. Vulnerability Detection and Response. And Certification Data Sharing, how the evidence reaches you. Four sets of obligations, not a line on a diagram. The only boundary the rules name is the agency's own system.

Minimum Assessment Scope is a test about data, not topology. A resource is in the offering if it's likely to handle federal customer data or affect its security, wherever it sits. And resources may vary by security category, so a refusal that rests on "it would raise the whole environment's level" now has to show which resource and which data.

One line in that guidance matters to every estate. Software delivered for installation on agency systems, and not operated in a shared-responsibility model, typically agents, application clients and mobile apps, is entirely outside the scope of FedRAMP. That doesn't make it unassessed. It makes it yours.

So decide who owns each agent and client, and cover it in the agency's own authorization: its configuration, its updates and the data it sends. The authorizing official draws the boundary; endpoint engineering does the work. Settle it at the next package update, and before the rules become mandatory on January 1, 2027.

## Slide 6 — Change is notified, not re-approved, and evidence becomes a feed

Under the old model, a significant change to a certified service went back through an approval. The Significant Change Notification rules replace that with notification, scaled to risk, and the deadlines are in business days.

The provider classifies every potential change. A change of certification class needs a new assessment; it can't be handled as a notification. Routine recurring changes, such as patching and signature updates, get no formal notice at all. Adaptive changes are notified within 10 business days after they finish. Transformative changes, the ones with substantive new risk, need initial plans at least 30 business days before work starts, final plans 10 business days before, and notices within 5 business days after finishing and after verification. Every notice must be human-readable and JSON, and providers keep 12 months of them.

Evidence becomes a feed too. Providers must use a FedRAMP-compatible trust center, with documented programmatic access to all certification data. On October 21, 2026, only 110 of 781 Marketplace listings had a trust-center entry.

There are two consequences for you. A provider that ships continuously can treat most releases as routine and file nothing, so keeping current with commercial no longer costs the provider a compliance cycle. But your review duty doesn't shrink. Agencies must review each Ongoing Certification Report for changes that affect the risk accepted in their own authorization.

So name the reviewer now. FedRAMP recommends designating a federal senior information security official; in the program's model that's the CISO or a named delegate. The ISSO reads each notice against the boundary record, and the authorizing official decides whether it changes the agency's risk.

## Slide 7 — GCC is the worldwide service, minus a published list

Now the feature gap itself. Chapter 04 reads GCC from Microsoft's own documents, and they don't describe a compliance perimeter that dims the commercial service. GCC has no endpoint list of its own: Microsoft publishes one list for Worldwide, including GCC. The restricted, separately networked environment begins at GCC High.

What GCC has is a list of exclusions, and the list isn't a ladder. Network connectivity in the admin center, Adoption Score, the Office 365 content delivery network and informed network routing are missing in GCC, GCC High and DoD alike. Windows release health, Word version history and Excel Office Scripts reach GCC and stop there. Moving up doesn't restore everything.

The largest documented loss is the network connectivity layer. A commercial tenant gets, at no extra license cost, a daily network assessment from 0 to 100 for each location, with 80 as the healthy baseline; a view of each location's egress and front doors; insights such as detecting TLS interception; and performance attributed to named network providers, whether ISP, overlay or corporate.

An agency choosing between SASE or transport providers in a commercial tenant gets comparative evidence from Microsoft, in its own admin center. The same agency in GCC gets none of it. Microsoft's network connectivity test tool does support GCC, run locally from each location, and it closes part of the gap, but not the provider comparison.

So this decision is a budget line. Fund the independent measurement that replaces the layer, before you pick a transport or SASE provider. That's the sponsor and CIO's call, because they fund the platform.

## Slide 8 — A higher certification class won't bring the features back

Much federal reasoning runs two questions together: GCC is Moderate, Moderate is why the feature is missing, and a High certification would bring it back. The Marketplace doesn't support that chain.

Read on October 21, 2026, it lists three Microsoft 365 government packages. The GCC package agencies run is FedRAMP Certified at Class C, Moderate, with 100 authorizations. A second package with the identical name is In Process at Class D, High, with none. And GCC High is a separate package, certified at Class D, with 5.

The straightforward reading of that second package is a High effort for GCC, but the Marketplace doesn't state how the two relate, or whether one will replace the other. Treat it as a question for the provider, not a roadmap. Microsoft's own GCC service description adds a wrinkle: it says Office 365 Government supports FedRAMP at a High impact level, while the Marketplace record says Class C. Cite the Marketplace and the package, and record the discrepancy.

Now the key point. Network connectivity is missing in GCC High too, and GCC High is already Class D. A higher class changes what data you may place in the service. It doesn't, by itself, restore a feature the provider excluded. An agency that defers an equivalent because High is coming may wait for something the certification was never going to deliver.

So plan against the class of the package you actually use. And don't hard-code Moderate into a multi-year architecture either, because that premise may move. The sponsor and CIO own that honest plan, in the current architecture and acquisition cycle.

## Slide 9 — One decider per row: who owns the boundary

Who owns all this? Chapter 08's rule is one decider per row, and it starts from FedRAMP's split. The provider owns the service boundary and its certification. The agency owns the boundary of its own system, and everything it builds, configures and connects inside it.

On the agency side, the authorizing official determines the authorization boundary, with input from the system owner. That comes straight from NIST SP 800-37. The official signs every documented exception, approves the plan of action and milestones, and decides whether a change requires reauthorization. Explicit risk acceptance can't be delegated, and for federal agencies the role is assigned to government personnel only. A designated representative can run the process; only the authorizing official signs.

The system owner is the boundary owner: keeper of the boundary record and the package. The CISO sets the control requirements and decides what counts as evidence, and the ISSO reads provider notices against the record. The sponsor and CIO choose the clouds, fund the platform, set the sequence and break the ties, which will happen, because everyone can reasonably claim the landing zone.

Then the people who do the work. The platform team builds the landing zone, the policy and subscription vending, but it doesn't decide whether a gap is acceptable. That goes to the authorizing official. Workload owners declare the features their designs depend on. Security operations runs drift detection. And acquisition holds the contract, because only a contracting officer can change what the agency bought.

FedRAMP is consulted, not in charge. Agencies notify it after authorizing, and work with it when a determination conflicts with a provider's package. Its certification is an input to the authorizing official's decision. It never replaces it.

## Slide 10 — Five decisions that look like engineering tickets

The most consequential boundary decisions don't look like boundary decisions. They look like engineering tickets, and that's how they slip past the people who should make them.

Placement. Vending a new subscription is the platform team's mechanism, but whether a workload is inside the authorized system is the system owner's decision. The cheapest way to turn an authorized system into an unauthorized one is a subscription no one recorded. A workload whose subscription isn't in the boundary record doesn't go live.

Feature dependency. The system owner checks each feature a design depends on against what's been tested to work in your cloud, before the design is built.

The contract. The GCC listing says customers must buy a GCC SKU to be covered by the GCC authorization, so a licensing choice is a boundary choice, and it belongs to the contracting officer.

Provider changes. When a provider notice might change the agency's risk, the authorizing official decides, not whoever happens to be on the distribution list.

And asking for more. Agencies must not require a certified service to supply more than FedRAMP requires, unless the agency head or a delegate finds a demonstrable need and notifies FedRAMP.

The landing zone makes these decisions checkable, but it doesn't make them. It enforces structure, and its compliance reports are evidence, yet Microsoft itself calls the policy compliance view partial. Two planning facts for leaders. Microsoft's landing-zone accelerators are supported only in public Azure, so an Azure Government build needs the code adapted by hand. And the pipeline that builds it is inside the boundary question too, because Terraform state is sensitive data. Plan both; don't discover them.

## Slide 11 — Three honest responses when a capability is outside

How do you respond when a capability is outside? NIST SP 800-37 names four options: employ compensating controls, accept greater risk, contract with a more trustworthy provider, or don't obtain the service. The book turns them into three responses, and each one is a decision with an owner.

One: compensate in-boundary. Rebuild the capability, or enough of it, from signals inside the boundary, and say that it's derived. Take the network connectivity gap. Scheduled runs of Microsoft's test tool from each location close part of it, if the results are labeled derived. They don't replace the provider comparison, and the register should say so. A narrative that hides the substitution is exactly the kind an assessor takes apart.

Two: a documented exception. Either a request through the provider's own exception process, or the authorizing official accepting the residual risk in writing. A gap you intend to close goes on the plan of action and milestones, with a milestone and an owner. A gap you've decided to live with goes into a signed exception with an end or review date, so that permanent is a decision someone repeats, not a default.

Three: an alternative path, a different certified service or a different way to meet the need. And going without is legitimate too, as long as someone decided it.

Before any of these, probe. A scripted test of what actually works in your own tenant, checking for the output rather than the switch, rerun on a schedule and after any relevant provider notice.

So for each gap, the system owner proposes a response, the authorizing official decides every exception, and the CISO sets the evidence class. Make that call per register row, before a design depends on the capability.

## Slide 12 — Exceptions: the provider's path, and the rules' limits

Two cautions on exceptions.

First, the provider's path. ExpressRoute for Microsoft 365 is the worked example. Microsoft says it doesn't recommend it, and authorizes it only when a customer's regulatory requirement mandates direct connectivity, with the text excerpt and a web link to the regulation. Federal readers often assume FedRAMP or FISMA supplies that hook. The program hasn't found a FedRAMP rule or a FISMA provision that mandates private connectivity to Microsoft 365, and TIC 3.0 mandates no specific technology. Write it into a task order before the authorization is in hand, and you may find the gate afterwards. But the process is a good template for every request you make: a named requirement, quoted, with a link.

Second, the scope arguments the 2026 rules allow each come with a limit. Security category can vary by resource, but that binds the provider's description; your own system is still categorized under the Risk Management Framework. Agents are outside FedRAMP, but not outside your authorization. Routine changes go unnotified, but you still decide whether a change affects your risk. And you can't simply demand more than FedRAMP requires.

Acquisition is where an exception path gets closed by accident. Microsoft's Network Provider Program is no longer open to new network providers, so a solicitation that names membership as a qualification restricts competition to a closed pool. Specify the capability instead. Write the requirement the register row describes, not the product that happens to meet it today.

The system owner decides whether to make a provider-side request, and acquisition and engineering do the work. That decision belongs before the solicitation is written.

## Slide 13 — The alternative path: change the suite, keep the identity plane

The third response is a different certified service for the workload. Chapter 10 works through collaboration, and its first rule is to read the certification, not the announcement.

On the Marketplace, Google Workspace is certified at Class D. Gemini for Government is a separate listing at Class B, Low, even though Google says Gemini in Workspace apps is FedRAMP High authorized. Which AI features sit inside which certification is a question for the package. And the Workspace listing marks some services as not meeting a control enhancement, SA-9 five, on where processing and storage happen. Details like those decide what you can turn on.

The public record shows both outcomes. In September 2025 a cabinet-level department awarded a five-year agreement worth up to 89 million dollars to move more than 50,000 employees to Google Workspace, under a GSA agreement with a temporary 71 percent price reduction. So a five-year cost model has to price the renewal years, not the launch price. A military department went the other way, ending about 150,000 Google email licenses after an audit found about 16 percent in use. Adoption has to be measured in the pilot, not assumed.

The choice is only safe if the identity plane stays put. Entra ID remains the source, and the suite is a workload that consumes identity: provisioned, federated, with Conditional Access applied at sign-in. Then close two gaps. Google super administrators sign in outside it, and Google's own directory is derived, so report its drift.

The sponsor and CIO decide which services the agency uses. Make the suite decision its own approval, separate from identity modernization, and read the listing again on the day you decide.

## Slide 14 — What to ask a cloud provider for

Appendix A turns the book into requests. "Give us commercial parity" can't be answered. A specific question tied to a published rule or a published exclusion can, with a yes, a no or a date. Three habits make a request hard to deflect: name one item, cite the basis with a link, and ask for data, not documents.

Eight requests follow. Publish the per-feature exclusion list as data. Name the exception path for each excluded feature. Restore the network observability layer in GCC, or publish the specific obstacle. Explain the two same-named GCC packages, and which exclusions Class D would and wouldn't lift. List the agents and clients that sit outside the certified offering. Provide a FedRAMP-compatible trust center with programmatic access: on October 21, 2026, none of the three Microsoft 365 government packages had a trust-center entry. Deliver change notices as a JSON feed. And document the cryptographic modules for each service, with their validation status.

Five of the eight rest on obligations the 2026 rules already place on providers, so none of them needs a boundary argument. And asking isn't requiring. Requiring more than FedRAMP does takes a determination by the agency head or a delegate, and notice to FedRAMP.

The system owner makes these requests, with acquisition. Put them to your provider once your feature inventory exists, and record each request, its date and the answer in the authorization package. A documented no is evidence too.

## Slide 15 — Evidence the boundary in your own package

Finally, the package. An agency never authorizes a cloud service; it authorizes its own system, which uses one. The provider's certification is evidence you read. Your package is evidence you write, and its plan should contain only what the agency is responsible for. FedRAMP's Rev5 guidance is blunt: don't copy and paste provider controls into the agency plan, and don't blindly copy provider findings into your plan of action and milestones.

The program writes the boundary down once, as a boundary record the system owner keeps, and every artifact cites it. The system description names the boundary the authorizing official determined. The external services section names each certified service with its Marketplace package, class and SKU. Each crossing, such as a federated trust or a connector, is an information exchange with an agreement. Gaps you'll close go on the plan of action and milestones. Each equivalent is described as a component in OSCAL. When the probe finds a change, one record changes, and every narrative that cites it is current.

Know whose package you're reading. The GCC listing says the service leverages Azure Government as its infrastructure, so inheritance runs through two provider packages before it reaches you. And on October 21, 2026, that listing's trust-center and secure-configuration fields were empty, so record where you got the guidance.

A compensating narrative takes four sentences: what the control needs; what the provider documents as unavailable, with the citation; what runs instead, marked derived; and where the remaining gap is recorded.

The system owner builds this before the package reaches the authorizing official, and keeps it current from then on.

## Slide 16 — Five decisions, five owners, and the next step

So, five decisions, each with its owner.

The authorizing official determines the boundary before workloads arrive, and signs every exception with an end or review date.

The system owner keeps the boundary record, gates every new subscription, and checks every feature dependency before a design is built.

The CISO names the reviewer of provider change notices and ongoing certification reports, and decides what counts as evidence, with the ISSO doing the reading.

The sponsor and CIO fund the measurement and the compensations the register calls for, and plan against the class you actually have, not the one you're waiting for.

And the contracting officer buys the SKU the boundary assumes, and specifies capabilities, not program badges.

The next step needs no award. Before the next architecture review, list every cloud feature your designs depend on, with its Marketplace package, its availability in your environment and the page that says so. Then put Appendix A's requests to your provider, and record the answers in your package.

The rules become mandatory on January 1, 2027, and new Rev5 requests stop on June 11, 2027. Neither date moves your own boundary. It's still yours to draw, to evidence and to sign.

The license says what you bought; the boundary says what you may use. Book 10 has the detail, with every claim footnoted. Thank you.
