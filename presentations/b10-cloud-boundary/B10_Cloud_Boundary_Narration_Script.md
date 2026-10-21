# Book 10 — Cloud Boundary & Landing Zone — narration script (practice copy)

## Slide 1 — Why Does the Authorization Boundary Decide What You Can Use?

This briefing comes from Book 10 of the Federal Modernization Workbook, Cloud Boundary and Landing Zone: how the authorization boundary, not the product catalog, decides which cloud features an agency can use,.

I'll take four questions: why the boundary decides what you can use, what has to change, who owns the boundary, and how to get there.

The short version: treat the boundary as a list you can read, not a perimeter you can only accept, and evidence every choice in your own package.

## Slide 2 — Three checks, three owners decide what you can use

Why does the authorization boundary decide what you can use? Start with two agencies holding the same Microsoft 365 license. One runs a commercial tenant and sees per-location network assessments, informed network routing and an Adoption Score. The other runs a GCC tenant and sees none of them, because Microsoft documents each one as unavailable there.

Three decisions, made by three parties, have to line up. FedRAMP certifies a specific offering at a certification class, and the Marketplace is the record. The provider publishes, feature by feature, what each government environment leaves out. And the agency authorizes its own system: its authorizing official accepts the risk of the configuration selected and the integrations enabled. FedRAMP says an agency should never create a standalone authorization to operate for a cloud service.

What the agency can use is the overlap of all three. A feature with no citation is unverified, not available.

## Slide 3 — The invisible boundary, and the example corrected

Chapter 02 explains why the gap stays invisible until a design depends on it. Surfaces are shared: Intune in GCC is the same instance as commercial Intune. Exclusions are scattered, one sentence per feature page. Features move: Microsoft retired Adoption Score's technology-experience categories for every tenant in early 2026. And absence doesn't announce itself. A detection whose input never arrives looks exactly like a quiet day.

The book then corrects a widely repeated example. Five features were said to be silently missing from GCC. Checked against Microsoft's documentation, one is: the Locations view of network connectivity in the admin center. Device Health Attestation and expedited updates are GCC High and DoD gaps. Endpoint analytics isn't a documented GCC gap. And Azure Arc is an Azure service, in Azure's FedRAMP High scope.

An unverified boundary story sends an agency to build compensations it doesn't need.

## Slide 4 — Four things change across any boundary

The book models a boundary as any surface across which four things change. It's the book's own model, not a FedRAMP or Microsoft construct.

Telemetry fidelity asks which signals actually arrive on this side. In GCC, admin-center network connectivity, informed network routing and Adoption Score are documented as unavailable. Identity authority asks who a claim's issuer resolves to: GCC pairs with Entra ID in commercial Azure, GCC High and DoD with Azure Government. Enforcement responsibility asks who must enforce a control: without Microsoft's per-circuit feedback, path selection rests on the agency's own SD-WAN measurements. Provenance classification asks whether a claim is still authoritative, or only derived.

Each dimension raises its own drift class. Detection is shipped for two classes, partial for one and design only for two.

And FedRAMP's definition of federal customer data excludes the analytics and telemetry a provider generates. No certification promises you a signal.

## Slide 5 — FedRAMP 2026: classes, obligations, business days

What changed at FedRAMP? Three things.

First, services are now certified, in Classes A to D. FedRAMP's February 2026 notice says Class C includes the current Moderate baseline and Class D the current High, and that agencies may authorize at any security category they deem appropriate.

Second, the rules have no provider authorization boundary. In the machine-readable ruleset, version 2026.10.13.01, that phrase occurs zero times. The word boundary appears eight times, four of them as a tag on rule families: minimum assessment scope, cryptographic module use, vulnerability detection and response, and certification data sharing. Security category may vary by resource.

Third, change is notified, not re-approved, and the deadlines are in business days. Routine recurring changes need no notice. Adaptive changes, within 10 business days after finishing. Transformative changes, initial plans 30 business days before.

Adoption is mandatory on January 1, 2027, and new Rev5 requests stop on June 11, 2027.

## Slide 6 — GCC is the worldwide service, minus a list

Chapter 04 reads GCC from Microsoft's own documents. It's the worldwide service with a published list of exclusions, and the list isn't a ladder. Network connectivity in the admin center, Adoption Score, the Office 365 CDN and informed network routing are missing in GCC, GCC High and DoD alike. Windows release health and Excel Office Scripts reach GCC and stop there.

The largest documented loss is the network connectivity layer: a daily assessment from 0 to 100 for each location, with 80 as the healthy baseline, and performance attributed to named network providers. A GCC agency funds its own measurement instead.

On the Marketplace, read October 21, 2026, the GCC package, MSO365MT, is FedRAMP Certified at Class C, Moderate, with 100 authorizations. A second package with the identical name is In Process at Class D. But GCC High is already Class D, and still lacks network connectivity. A higher class doesn't restore an excluded feature.

## Slide 7 — The landing zone turns the boundary into policy

The landing zone is where the boundary stops being a diagram. Each workload landing zone is a subscription placed in a management group that carries its policy.

The baseline hierarchy puts an intermediate root under the tenant root, and that's where boundary policy goes. Platform groups hold security, management, connectivity and identity. Landing zone groups hold corporate, online and local workloads. Make Sandbox the default, so no new subscription lands outside the boundary policy.

Each boundary decision gets a mechanism: the cloud choice; Allowed locations with Deny; allowed resource types, checked against Microsoft's audit-scope list; the FedRAMP regulatory compliance initiative, which Microsoft calls only a partial view; and exemptions, Mitigated or Waiver, with an expiry date. Roll each policy out in audit mode first.

One catch: Microsoft's accelerators are supported only in public Azure. In Azure Government, the platform team adapts the code by hand.

## Slide 8 — The address plan is the join key the evidence needs

Chapter 06 makes the address plan the join key. A scan finds what answered; the IPAM records what was allocated, so every inventory reconciles against it. BOD 23-01 already asks for automated discovery every 7 days across the entire IPv4 space the agency uses.

In Azure the enterprise IPAM stays the authority. Reserve the block there first. Mirror it into Virtual Network Manager pools, entering ranges used elsewhere as static CIDRs. Then assign an Azure Policy that denies any virtual network without a pool allocation, and reconcile by discovery. Virtual Network Manager isn't named in Microsoft's FedRAMP audit-scope tables, so record it as a dependency until coverage is confirmed.

Build it as five layered modules, each writing its state as evidence. And treat outside inputs as code. There's no separate GCC endpoint list: a GCC tenant uses the Worldwide instance, updated monthly, with 30 days' notice of new endpoints.

## Slide 9 — The front door: no landing zone without a request

Code anyone can apply from a laptop isn't change control. Chapter 07 adds the front door: the governed request into the landing zone, which Microsoft calls subscription vending.

The loop has six steps: request, approve, plan, apply, reconcile and close. The requester can't approve their own request, which is AC-5, separation of duties. The approver reviews the actual plan before anything changes. And step 5 carries the most weight: the pipeline writes the address allocation back to the enterprise IPAM and fails the run if the two disagree, because an unreconciled block is shadow inventory the moment it exists.

The pipeline is inside the boundary question too. Terraform state is sensitive data. On October 21, 2026, the Marketplace had no listing for HCP Terraform; GitHub Enterprise Cloud was listed at Class B, and GitLab Dedicated for Government at Class C. The default is a self-hosted runner and state inside the agency's boundary.

## Slide 10 — Who decides, who keeps the record, who does the work

Who owns the boundary? The rule is one decider per row.

The authorizing official determines the boundary, signs every documented exception and decides whether a change requires reauthorization. Under SP 800-37, explicit risk acceptance can't be delegated, and for federal agencies the role is assigned to government personnel only. The system owner is the boundary owner: keeper of the boundary record and the package, and the decider on placing a new workload, because vending an unrecorded subscription is the cheapest way to turn an authorized system into an unauthorized one. The CISO sets control requirements, and the ISSO reads provider change notices against the record.

The platform team builds the hierarchy, policy, vending and probe, but doesn't decide whether a gap is acceptable. And the contract is a boundary decision: the GCC listing says customers must buy a GCC SKU to be covered. Only a contracting officer changes what the agency bought.

## Slide 11 — Inventory, probe, then compensate or except

How do you handle a capability that's outside? NIST SP 800-37 names four options: compensating controls, accepting greater risk, a more trustworthy provider, or not obtaining the service.

Build a register, one feature per row, each with the provider's own statement. Only vendor-confirmed rows support a claim to a provider or an assessor. Probe what actually works in your tenant, on a schedule, testing for the output rather than the switch. Where a gap is real, build an in-boundary equivalent and say it's derived. Or take an exception. ExpressRoute for Microsoft 365 is authorized only when a regulatory requirement mandates direct connectivity, and the book found no FedRAMP rule or FISMA provision that does. Otherwise the authorizing official signs a dated risk acceptance.

The 2026 rules add four scope arguments, each with a limit. And buy the capability, not the badge: Microsoft's Network Provider Program is closed to new providers.

## Slide 12 — Change the suite, keep the identity plane

The third answer is an alternative path: a different certified service for the workload, with the identity plane left where it is.

Read the Marketplace, not the announcement. Google Workspace is listed at Class D, while Gemini for Government is a separate listing at Class B. Which AI features sit inside which certification is a question for the package.

The public record shows both outcomes. In September 2025 a cabinet-level department awarded a five-year agreement worth up to 89 million dollars to move more than 50,000 employees to Google Workspace, under a GSA agreement with a temporary 71 percent price reduction. A military department went the other way, ending about 150,000 Google email licenses after an audit found about 16 percent in use.

Keep Entra ID as the source: provision users, federate sign-in, apply Conditional Access there. Then close the gaps: Google super administrators sign in outside it, and Google's directory is derived, so report drift.

## Slide 13 — Write the boundary once; cite it everywhere

Finally, evidence the boundary in the agency's own package. The agency never authorizes a cloud service; it authorizes its system that uses one, and its plan should only contain what the agency is responsible for. FedRAMP's Rev5 guidance is blunt: don't copy and paste provider controls into the agency plan.

Write the boundary down once, as a boundary record the system owner keeps, and cite it everywhere: the system description under PL-2, each external service under SA-9 with its Marketplace package, class and SKU, each crossing under CA-3, the gaps the agency will close on the POA&M, and each equivalent in an OSCAL component definition.

Know whose package you're reading. The GCC listing says the service leverages Azure Government as its infrastructure, so the inheritance chain runs through two provider packages.

A compensating narrative takes four sentences: what the control needs, what's unavailable with its citation, what runs instead marked derived, and where the remaining gap is recorded.

## Slide 14 — What to ask a cloud provider for

Appendix A turns all of this into requests. Three habits make a request hard to deflect: name one item, cite the basis with a link, and ask for data, not documents.

Eight requests follow. Publish the per-feature exclusion list as data. Name the exception path for each feature. Restore the network observability layer in GCC, or publish the specific obstacle. Explain the two same-named GCC packages, and what Class D would and wouldn't change. List the agents and clients that sit outside the certified offering. Provide a FedRAMP-compatible trust center with programmatic access: on October 21, 2026, only 110 of 781 Marketplace listings had a trust-center entry, and none of the three Microsoft 365 government packages did. Deliver change notices as a JSON feed. And document the cryptographic modules for each service.

Five of the eight rest on obligations the rules already place on providers. A documented no is evidence too.

## Slide 15 — Decisions to make, and next steps

So, four decisions.

Build the feature register on cited rows only, one row per feature and environment, and drop or relabel anything without a vendor page.

Name the boundary owner: the authorizing official decides the boundary, and the system owner keeps the record and gates every new subscription.

Enforce the boundary in the landing zone: policy at the intermediate root, audit before deny, and the governed front door.

And evidence every response, whether equivalent, exception or alternative path, in the agency's own package.

The next step needs no award: before the next architecture review, list every cloud feature your designs depend on, with its Marketplace package, its availability in your environment and the page that says so. Then put Appendix A's requests to your provider.

The license says what you bought; the boundary says what you may use. Book 10 has the detail, every claim footnoted. Thank you.
