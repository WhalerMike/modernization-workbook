# Ticket-to-Machine on ServiceNow and SailPoint — An Example — narration script (practice copy)

## Slide 1 — Ticket-to-Machine on ServiceNow and SailPoint

Welcome. This is Ticket-to-Machine on ServiceNow and SailPoint, a research example from the Federal Modernization Workbook. It's the vendor-named companion to Book 13's Appendix B, the Ticket-to-Machine Reference, which is vendor-neutral on purpose. Here we take the same loop, the same lanes and the same identity fixes, and work them through two named products: ServiceNow as the front door and the record, and SailPoint Identity Security Cloud for identity governance. It's an example, not an endorsement, and it's still under review. In about ten minutes we'll see where the products fit the loop, and four places where they don't. First, why name products at all?

## Slide 2 — An example, not a recommendation

Appendix B is written so the loop runs on whatever service management platform an agency already has. That's the right default, but it can feel abstract. Naming two products shows what the loop looks like in practice, down to which feature does which step. So treat this as an illustration, not an endorsement. ServiceNow fills the front-door slot and SailPoint fills the identity-governance slot, but other products can fill the same slots. Every product fact here is the vendor's own statement, checked on October 24, 2026. Anything marked inference or design guidance is the program's reasoning, not the vendor's. With that framing, let's meet the products and their federal status.

## Slide 3 — The products and their FedRAMP status

Here are the two products, and what the FedRAMP Marketplace shows for each. ServiceNow's Government Community Cloud is authorized at High. SailPoint Identity Security Cloud is authorized at Moderate. Why Identity Security Cloud rather than IdentityIQ, SailPoint's self-hosted product? Because it has a public listing anyone can check, it reaches both Entra ID and Active Directory, and SailPoint documents its ServiceNow integrations. IdentityIQ still fits an agency that has to run governance inside its own boundary, needs a High system, or wants change-request tickets from the governance tool. One caution: SailPoint now markets the product as Human Fabric, while the Marketplace uses the older name. So confirm that what you buy is what was authorized. Now, the picture.

## Slide 4 — The picture: the loop on ServiceNow and SailPoint

This is the whole design on one page. Core HCM is the source of authority, and it's where HR corrects facts. SailPoint aggregates from it, runs lifecycle states, requests and certifications, and provisions Entra ID and Active Directory through its connectors. ServiceNow is the front door and the one closure record, and it can reach Entra directly through its Entra spoke for simple, low-authority tasks. Now notice what closes the record: a re-read, meaning the next aggregation or a native-change event, not a ticket status. And the dashed red line is the declared exception, for applications SailPoint can't reach. So how do the two products pass work back and forth?

## Slide 5 — How the two products hand work to each other

SailPoint publishes its ServiceNow integrations as its own ServiceNow apps, each licensed separately. ServiceNow's documentation shows no SailPoint integration of its own. There are three apps. The Service Desk integration turns provisioning that SailPoint can't do directly into ServiceNow requests or incidents, for disconnected applications. The Service Catalog app lets people request SailPoint access inside ServiceNow, with approval defined in ServiceNow. And the Identity Governance app lets certifiers review inside ServiceNow. The fourth path skips SailPoint entirely: ServiceNow's Entra ID spoke, working through Microsoft Graph, for simple, low-authority tasks. Two of these handoffs turn out to be gaps, and we'll come back to them. First, the loop itself.

## Slide 6 — The loop, step by step, on these products

Walk the five steps, and most of the loop is documented by the vendors. SailPoint tests on its scheduled refreshes and aggregations. It detects drift in two useful ways: when attributes from the authoritative source change, and when someone changes an account outside SailPoint. Calling those Book 13's drift classes is our inference. Actuation runs through SailPoint's connectors, or through the ServiceNow Entra spoke. The weak spots are steps three and five. Turning a drift event into a typed ServiceNow task is something you build with a SailPoint workflow; it isn't shipped. And closing with evidence is only partial, which is the first gap. Before the gaps, though, let's place the lanes.

## Slide 7 — The lanes on these products

Book 13 sorts every change into lanes, and each lane lands somewhere on these products. Most of this mapping is our inference, so read it as a proposal. The autonomous lane maps to SailPoint lifecycle states and birthright access, and to ServiceNow's pre-authorized standard changes. The gated lane is a SailPoint access request with an approver, or a ServiceNow normal change. Human decisions are certifications and the change board, and one highpoint there is documented: unsigned revoke decisions aren't applied. Certificates sit with neither product; they stay with the certificate platform. And a disconnected application becomes a declared exception, with a ticket, a recorded session and an end date. Now the gaps.

## Slide 8 — Gaps 1 and 2: ticket status, and who approves

Here are the first two places where the products, used as shipped, fall short of the loop. Gap one is the big one. SailPoint's own best practices say the mapped ServiceNow status decides when a provisioning task counts as complete. That's exactly what Book 13 calls closure by assertion. Our guidance: close the ServiceNow record only on evidence, the next aggregation or a native-change event showing the intended state. Gap two is about who approves. Book 15 says access an owner governs is decided in the identity governance platform, but the catalog app moves approval into ServiceNow. The fix is to choose one approver system per authority class and write it down. Two more gaps to go.

## Slide 9 — Gaps 3 and 4: change records, and one writer

Gap three is narrower. Identity Security Cloud's Service Desk integration creates service requests and incidents only; it can't create change requests. IdentityIQ's can. So where a change class needs a change record, a ServiceNow flow raises it from the request. Gap four is about who writes to the directory. SailPoint reads Oracle HCM Cloud directly and writes back only user name and work email, which fits Book 03. But Book 03 makes Entra inbound provisioning the one writer into the directory. So pick one writer per attribute. Either inbound provisioning stays the door and SailPoint governs entitlements, or SailPoint takes on the provisioning duties. Not both. Now, the identity fixes.

## Slide 10 — Identity fixes: HR facts, leavers and stray writes

The identity-maintenance draft lists the fixes that still happen once HR is the source. Here's how the first five land on these products, mostly as our inference. A wrong fact in HR goes to HR as a ServiceNow case; HR corrects it in Core HCM, and SailPoint picks it up on the next aggregation. A late personnel action, or an urgent leaver HR hasn't entered, runs the leaver sequence through a ServiceNow emergency change. A record the pipeline couldn't apply is re-run through SailPoint, never by hand. And the standout is a write made outside the pipeline. SailPoint's native change detection catches it, and SailPoint restores the value. That's the closest one-to-one fit in the catalog. Here are the rest.

## Slide 11 — Identity fixes: matching, contractors and rules

The remaining fixes lean more on people. An account that matches nobody goes to its owner, who correlates it to a person or disables it. The same person twice is a correlation-rule change, and SailPoint notes that it supports some mover cases only partially. Contractors come from a separate source, corrected by the sponsor. SailPoint says its Non-Employee Risk Management product is inside the FedRAMP authorization, but confirm that from the authorization package, not the press release. A rule that derives the wrong access surfaces in a certification and goes to the governance body. And a credential that outlives the person sits outside both products entirely. Next, federal availability.

## Slide 12 — Federal availability and cautions

Federal availability is where you need the most care. For a Microsoft 365 GCC tenant, the worldwide Graph endpoints apply, and SailPoint documents endpoint overrides for GCC High. ServiceNow's Entra spoke fits GCC through its default endpoint, but its page doesn't cover GCC High, and it needs an Integration Hub subscription. SailPoint's ServiceNow apps aren't confirmed in ServiceNow's government Store. Then three cautions. SailPoint's cloud connectors call Graph from SailPoint's cloud, and only Active Directory runs through its on-premises appliance, so record which actions run from the vendor's cloud. A vendor's MFA feature isn't a help desk reset with identity proofing. And confirm what's in the FedRAMP environment before relying on any of it. So, what's next?

## Slide 13 — What to verify, decide, and read next

To move this example from under review to proved, build the loop in a lab with a test tenant, and record the evidence. Start by confirming what the vendors haven't said publicly, like feature parity in the FedRAMP environment and the apps in the government Store. The decisions are the four gaps restated: what closes a record, one approver system per authority class, how change records get raised, and one writer per attribute. And remember, this is an example, not an endorsement; other products can fill the same slots. For the design itself, read Book 13's vendor-neutral Appendix B, or watch its narrated deck, and then the draft on keeping identity correct after HR becomes the source. Thanks for listening.
