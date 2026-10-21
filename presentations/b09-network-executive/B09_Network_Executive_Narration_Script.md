# Book 09 — Network & Transport: Executive Briefing — narration script (practice copy)

## Slide 1 — Network & Transport: The Executive Decisions

This is the executive briefing for Book 09 of the Federal Modernization Workbook, Network and Transport. It's written for the people who fund, authorize and answer for the branch network: the CIO, the CISO, network program executives and budget owners.

It's built around decisions, not configuration. For each one I'll say what has to be decided, who owns it, and when it's needed.

Four questions organize the half hour. Why act now, when the target architecture is years away. What federal policy actually requires, and where the money should go first. Who decides each step. And how to proceed without turning a faster network into a weaker one.

The short version: no product shortens a fiber path, so buy transport on physics, govern it as compliance, and decide in the right order.

## Slide 2 — Seven decisions this briefing asks for

Here is where we're going. Seven decisions, each with a named owner. None of them is a product choice, and none of them requires an award to start. Several of them cost nothing but a signature and a few weeks of staff time; the expensive mistakes come from leaving them unmade while circuits, refreshes and migrations move ahead on their own schedules.

Here they are.

One: the CISO decides that managed TIC circuits end only when CISA confirms the replacement telemetry, not when a branch cuts over.

Two: the authorizing official records today's gap as an accepted risk, with compensating measures and a funded plan, so an assessor doesn't find it first.

Three: security architecture writes the target attributes into the edge-device refresh that BOD 26-02 is forcing anyway.

Four: the sponsor and CIO set the investment order, so staff time and requirements work come before capital.

Five: the same pair tests the field-office refresh request against published capacity limits before the money is committed.

Six: they choose the network access control platform, and tie the retirement of the Windows RADIUS server to the Entra migration, not to a date.

Seven: the authorizing official and the system owner hold the line on order. The governor is live before traffic moves, and the boundary change is decided before the first cutover.

The thread running through all seven: policy names no product, but it isn't requirement-free. A directive is already spending the refresh money. And order and ownership decide the outcome. The rest of the briefing gives the evidence behind each one, in the order why, what, who and how.

## Slide 3 — Transport is physics; control is compliance

Why act at all? Start with the two decisions programs keep merging.

Choosing a pipe is a physics decision. Light in fiber covers about one kilometer every five microseconds. New York to London has a round-trip floor of 56 milliseconds before any equipment touches a packet. The well-known 150-millisecond voice budget is mouth to ear, and the phones themselves take a large share, which leaves the network roughly 70 to 100. On the book's worked arithmetic, a Seattle office hairpinning through northern Virginia spends about 60 milliseconds one way on geography. That's most of the allowance, gone before the call reaches anything useful. No product moves that floor. Local breakout fixes the geographic part and nothing else.

Choosing what governs the pipe is a compliance decision. Direct internet access solves the hairpin, and it satisfies none of the protection controls. Boundary protection, flow enforcement, transmission confidentiality, malware inspection and monitoring all come from the control layer. Transport selection closes exactly one control family: telecommunications diversity.

So here's the risk an executive should watch for. A branch moved from a governed hairpin to bare local breakout has lost assessed boundary protection relative to where it started. The book's phrase for that is a compliance regression with better latency. It looks like modernization on a dashboard, and it reads as a finding in an assessment.

Every decision in this briefing keeps those two choices separate: buy the pipe on measured physics, and take the protection from the governor and the security services above it. Each new pipe also adds a managed interface someone has to govern, so more circuits without more control means more exposure, not less.

## Slide 4 — The external clocks are already running

The second reason to act is that the external clocks are already running, whether or not a network program is funded.

Read the table from the top. All FIPS 140-2 certificates moved to NIST's historical list on September 22. That isn't a ban on existing modules, but new purchases should state the 140-3 expectation. OMB M-26-15, the post-quantum memo, wanted agency migration plans by October 22, 2026, and it says anything terminating TLS or IPsec, firewalls and VPN concentrators included, must support post-quantum key exchange. OMB M-26-14 rescinded the old logging memo; the first agency logging plan is due November 18, with maturity milestones running to July 2027. BOD 26-04's third phase lands December 7. FedRAMP's 2026 rules become mandatory on January 1. And the GSA EIS first option period ends July 31, 2027.

The row in red is the one that spends money. BOD 26-02 requires all identified end-of-support edge devices off agency networks by August 5, 2027, with a first decommissioning milestone in February. I'll come back to it, because it's the fork in the road for the whole branch architecture.

The panel on the right is the honest part. Three of these requirements fall inside roughly fifteen months, and all of them draw on the same network and security staff a branch-edge program would need. An agency promising an SD-WAN program next year alongside them is promising the same people twice. The book's advice is to say that plainly in the plan.

One clock has already run out: the legacy telecom contracts all ended by May 31, 2026, so the architecture is now a task-order question, not a contract-vehicle question.

## Slide 5 — The risk of not acting is not standing still

Not acting doesn't mean standing still. It means three things happen by default.

First, money gets spent without a choice being made. The BOD 26-02 refresh will happen on a directive clock. Run as like-for-like replacement, the same device class with the same absence of policy and telemetry, it spends the money and closes the architecture question for the service life of the new equipment. Deferral also has a measured price. GAO reported in August 2026 that billing for six agencies' legacy Networx contracts rose from about 13.4 million dollars in February 2025 to about 40.9 million in March, a 206 percent increase. The book calls that the strongest cost-of-delay number in the federal record.

Second, gaps surface as findings rather than accepted risks. The technical situation is identical either way; the institutional position isn't. And cutting managed TIC circuits before CISA confirms replacement telemetry trades a gap in transport for a gap in CISA's visibility, which is worse.

Third, cost gets blamed on the cloud. When workloads migrate before transport is governed and measured, slowness is attributed to the only thing being measured. The remedies, more instances and more caching, raise cloud spend. The book is careful to label that pattern its own inference, built on documented parts, so treat it as a hypothesis to test in your estate.

And one risk sits under all of them. The governor is attack surface. In February 2026, Emergency Directive 26-03 ordered action on Cisco SD-WAN systems after actors were found compromising them and keeping long-term persistence. Whatever you buy, protect it before it carries traffic.

## Slide 6 — TIC 3.0 as republished in September 2026

What does TIC 3.0 actually require? The book reads it from the current documents rather than from what's said about them.

CISA republished the whole set in September 2026. The revision tables say the only 2026 changes were updated footnote links, so the substance dates from July 2025, and April 2021 for the Traditional use case. One practical note for anyone writing a package: CISA's landing page labels three volumes 1.1, but the covers read 1.2. Cite the cover.

There are four use cases: Traditional, Branch Office, Remote User and Cloud. There is no SASE use case. An agency deploying SASE at its branches operates under the Branch Office and Cloud use cases.

The program guidebook calls TIC 3.0 descriptive, not prescriptive, and the catalog says it sets goals, not methods. But two statements constrain a branch. Policy enforcement parity: once you decide a capability is needed, you apply it on every path, and the Branch Office use case names SD-WAN paths as one place that applies. And preserve CISA's visibility as branches connect directly to external services. Discretion also carries an obligation: where TIC controls don't cover residual risk, agencies must apply controls or compensating controls.

CISA's June 2026 SASE guide states the consequence plainly. TIC 3.0 doesn't require routing traffic through TIC access points if an alternative gives both the agency and CISA situational awareness. That guide permits and describes SASE. It doesn't require it.

So when someone says TIC requires SD-WAN, or that TIC forbids local breakout, both claims fail the check. The honest position is narrower and stronger: TIC sets goals, local breakout is allowed, and the agency must show parity and preserve CISA's view on every path it opens.

## Slide 7 — Technology-neutral is not requirement-free

The opposite mistake is just as common: concluding that because policy is technology-neutral, the branch is unconstrained. It isn't. Four binding obligations land directly on branch equipment, and none of them picks a product.

Egress DNS must go to CISA's Protective DNS; that's statutory, and a vendor's own resolver in its place satisfies the product and breaches the requirement. BOD 23-02 requires internet-exposed management interfaces to be taken off the internet, or fronted by a separate enforcement point. BOD 26-02 takes end-of-support edge devices off agency networks by August 5, 2027. And M-26-15 requires post-quantum key exchange on anything that terminates TLS or IPsec.

The obligations that bite hardest are often the ones an agency wrote itself. Once a branch breaks out locally, it's an external boundary, and the system security plan asserts boundary protection, traffic flow policy, monitoring and alternate paths about it. The gap surfaces at assessment time, not deployment time. That's an evidence argument, not a mandate argument.

The right-hand panel matters to budget owners. No federal instrument requires SD-WAN or SASE. No instrument requires the WAN itself to be encrypted where the payload is already protected end to end, so an overlay is a defensible risk decision, and the book says it shouldn't be budgeted as a compliance obligation. And FedRAMP certifies cloud services, not the routes an agency uses to reach them. When a network change is refused on FedRAMP grounds, ask one question: which control does it violate? A refusal with no control basis is a governance failure, and should be recorded as one.

## Slide 8 — Logging and CISA telemetry after MTIPS

Logging and CISA telemetry are where branch modernization most often goes wrong quietly.

OMB M-26-14 rescinded M-21-31 on May 22, 2026. Logs must be searchable for six months and retrievable for a year, and among the minimum content, agencies must be able to show source and destination addresses, ports and session attributes. That's the transport-layer record a branch with nothing at its edge doesn't produce. The first agency logging plan is due November 18.

When branches leave the managed TIC service, the sensor telemetry CISA has been receiving stops. CISA's SASE guide says so in plain terms. The replacement is CLAW, CISA's Comprehensive Log Aggregation Warehouse, and onboarding needs the agency, CISA and the provider working together. That's a three-party dependency with its own lead time, not a configuration change one team completes. It belongs on the critical path beside the authorization package, and the field-office case starts it in Phase 0.

Here is the decision. The exit criterion for leaving MTIPS, and for ending each branch's MPLS, is confirmed CLAW parity, not branch cutover completion. Cutting circuits first trades a transport gap for a visibility gap, which is worse than the position being fixed.

Ownership splits three ways on purpose. The CISO decides CLAW onboarding and when parity is reached. Security operations does the confirming, branch by branch. And under the Federal Acquisition Regulation only a contracting officer can terminate a contract, so the contracting officer ends the circuit, and only after that confirmation. No engineer can cancel a circuit, however redundant it looks.

## Slide 9 — The long interim: the case by elimination

For many agencies, neither SD-WAN nor a new TIC use case is close. The acquisition isn't funded and the task orders aren't placed. The book calls that interval the long interim, and it argues the architecture by elimination rather than by mandate, because no mandate exists.

The legacy telecom vehicles all ended by May 31, 2026. The hairpin is still permitted, but CISA's own guidebook says it raised the cost and reduced the effectiveness of TIC for cloud services. A new agency-operated access point is a capital and round-the-clock staffing commitment. VPN backhaul is a hairpin under another name. And Microsoft no longer recommends ExpressRoute for Microsoft 365. What's left is local breakout, a cloud-delivered security stack at a nearby point of presence, and a policy layer at the branch edge deciding what goes where.

The target is years away for structural reasons. Acquisition takes quarters. Agencies send budget submissions to OMB in September, so a program conceived now has usually missed the next budget year. A thousand branches is a multi-year deployment on logistics alone. And every new device class at every branch is assessment work. But the interval isn't empty: four of the six functions a branch-edge layer provides are partly obtainable before any award.

The decision on this slide belongs to the authorizing official. Record in the risk register and the affected packages which control assertions depend on transport evidence that doesn't exist, the compensating measures, and the remediation with its funding dependency. An undocumented gap found by an assessor is a finding. A documented gap with a plan is an accepted risk. Do it now, while the gap exists.

## Slide 10 — BOD 26-02 makes the refresh the fork in the road

This is the most important planning item in the book.

BOD 26-02, issued February 5, 2026, puts branch edge hardware on a directive clock. Inventory came due in May. Devices whose support ends by February 2027 come out then. All identified end-of-support edge devices must be off agency networks by August 5, 2027. After that, discovery is continuous. The directive covers devices on the network boundary that are reachable from the internet, so a branch router with its own internet circuit qualifies. An interior access switch may not, so don't assume the directive funds the access layer.

For an agency with aging branch equipment, part of the capital it assumed it didn't have is going to be spent anyway, on a compliance basis, inside the window everyone calls years away. And a refresh is exactly the moment a branch architecture gets chosen again. The default choice is like-for-like, which spends the money and closes the question for the life of the new equipment.

The recommendation is narrow and cheap. Tell whoever is scoping the replacements, in writing, what the eventual target needs from a branch device: application-aware steering and path measurement, deterministic egress, per-application telemetry the log pipeline can take, post-quantum key exchange under M-26-15, a management plane that satisfies BOD 23-02, and an explicit FIPS 140-3 expectation.

Security architecture owns that decision, because the refresh row in the book's matrix fixes the branch design for years. Acquisition writes it into every order. It's needed before the replacements are scoped. It costs requirements-writing time, and not doing it spends the same money and closes the option.

## Slide 11 — Where to invest, and in what order

So where should the money go, and in what order? The book's chapters line up into five tiers, cheapest and most certain first.

One: staff time, with no award. Write the application-to-path policy that SC-7(4) already asks for. Instrument a sample of branches. Fix deterministic egress, usually a NAT decision. Register the cleartext protocols crossing branch links. And test, not just read, that DNS reaches CISA's Protective DNS.

Two: requirements time. Put the target attributes into the BOD 26-02 refresh.

Three: accreditation and CLAW onboarding. The field-office case calls accreditation, not procurement, the critical path; circuits arrive in about a quarter, an authorized breakout architecture takes far longer.

Four: protect the governor. Phishing-resistant MFA, a hardened baseline, patching inside BOD 26-04's windows, the shortest of which is three days, and logs held off the box.

Five, and only then: capital. Hubs first, then office waves timed to MPLS contract renewals, scoped to the branches and applications where measurement says it pays.

The panel on the right is about pricing. Moving from MPLS to internet access plus a cloud security service changes the cost variable from site count and port speed to user count, and the per-user security subscription is the line most likely to dominate, and the one most often left out. Price your own circuits in GSA's EIS pricer rather than citing a marketing multiple. And don't justify the program on latency alone; the stronger argument is governance and evidence.

The sponsor and CIO set scope, funding and sequence, and this order needs to be settled before the next September budget submission.

## Slide 12 — Field offices: fix the circuit, not the content

Field offices are where these decisions become a budget line. Chapter 11 works a case many civilian agencies will recognize: about 1,500 field offices, about 70,000 endpoints, and a request for about 50 million dollars to refresh a Configuration Manager distribution point in every office.

Three findings. First, the unit cost doesn't reconcile. Fifty million over 1,500 offices is 33,333 dollars each, about twice the book's fully loaded server case. So the sponsor needs to say whether that figure is acquisition cost or five-year cost of ownership, and itemize anything bundled in. Second, capacity. Microsoft's published limit is 4,000 clients per distribution point, so the estate needs 24, two at each of 12 hub sites. The other 1,476 exist only to compensate for slow branch circuits. Third, timing. Microsoft has moved Configuration Manager to an annual release cadence and says new device-management innovation happens in Intune, so hardware bought now depreciates past its likely use.

The alternative fixes the circuit: internet access sized to seats, a 5G continuity path, and an SD-WAN overlay, with breakout at the hubs first. On the book's labeled planning assumptions, that needs about 10 million dollars of first-year capital and turns cumulatively positive in year four.

But the financial case turns on one number the analysis doesn't hold. Breakeven is 873 dollars of current MPLS cost per office per month. Above it the program pays for itself; below it, argue capability rather than savings.

So the decision for the sponsor and CIO is to decompose the request and validate that MPLS figure before any comparison, and before the refresh money is committed.

## Slide 13 — Network access control: the last Active Directory tie

Network access control looks like an engineering topic. It reaches the executive agenda because it's usually the last piece of the network still standing on Active Directory.

Windows Network Policy Server, the RADIUS server built into Windows, authorizes devices against Active Directory computer objects. Microsoft's Entra join guidance says Entra joined devices don't support that. There's no Entra RADIUS service, and NPS has no posture engine. So as the Entra migration progresses, NPS becomes less useful. And if NPS goes away before its replacement is validated, the result isn't a degraded experience; it's a total loss of network access.

The older password methods are breaking on their own schedule. Credential Guard, on by default on eligible Windows 11 devices, blocks single sign-on for PEAP-MSCHAPv2 Wi-Fi and VPN, and the October 2026 Windows update restricts NTLMv1-derived credentials too. Agencies that followed older guidance now have a deadline they didn't choose.

The program's target is certificate-based EAP-TLS for every managed device, with posture read from Intune's compliance service by a NAC platform, rolled out in four phases over roughly 90 to 180 days, monitor mode first. One caution for cloud-delivered RADIUS: as of October 21, 2026, several well-known cloud RADIUS offerings have no FedRAMP listing, so confirm the specific function is inside a certified offering before designing around it.

The decision sits with the sponsor and CIO: which NAC platform, and when NPS retires. The book's rule is that the retirement is triggered by the Entra migration, not by a date, and the replacement must be in place before cloud-native cutover retires the computer objects NPS depends on. The CISO sets the posture requirement.

## Slide 14 — One decider per row: the network decision register

Who owns all this? The book's sharpest observation is that the most expensive network mistakes aren't engineering errors. They're ownership gaps: a circuit bought before anyone owned the governor, a cutover before anyone filed the boundary change, a telemetry contract cancelled before anyone confirmed its replacement. Naming one decider for each step is cheaper than any product.

The register separates deciding from doing. A role decides when it is accountable and can say no. Network engineering does most of the work, but decides only physics and enforcement phasing.

Read down the middle column. The sponsor and CIO decide the governor platforms and the order of branch waves, because those fix cost and the boundary for years; acquisition is engaged in Phase 0 and waves follow contract renewals. The CISO sets the security envelope every order carries. Security architecture decides the refresh attributes and where each enforcement capability sits, but doesn't accept the risk of a non-conformant design.

The authorizing official accepts risk, so four rows land there: the boundary change, decided before the first production cutover; the Microsoft 365 Optimize exception, where device-side tenant restrictions are a precondition; the interim gap; and any standing exception with no end date.

Two rows split on purpose. The authorizing official decides whether the boundary may change, but the system owner decides, site by site, whether that site's control layer is live and logging. And telemetry splits three ways: the CISO decides, security operations confirms, and the contracting officer terminates.

When an architectural refusal arrives with no control basis, record it as a governance failure, with the refusing role named.

## Slide 15 — Governor before traffic, boundary before cutover

How to proceed comes down to order. Order decides whether branch modernization is a gain or a regression.

Step zero: secure the governor. The SD-WAN controller and its edges are internet-facing with estate-wide authority, so they come under vulnerability management, privileged access and off-box logging before they carry traffic. Step one: buy the pipe on measured physics, latency and loss recorded per site before the order. Step two: deploy the governor before production traffic; a site whose control layer isn't live and logging doesn't get its new egress. Step three: treat the boundary change as the significant change it is, decided before the first production cutover. Step four: handle Microsoft 365 Optimize traffic through its own signed exception. Step five: register the evidence, and confirm CISA telemetry parity before any legacy circuit ends.

The book is candid that no memo, directive or executive order sets this sequence. It's an engineering dependency, and saying so is what makes it survive review. Doing it out of order, above all lighting up fast circuits before the security layer is live, is in the program's experience the most common and most costly mistake.

The boundary package carries the evidence: the path policy, failover test records, path telemetry, each exception with its need and duration, CISA parity, and the known limitations stated openly.

And when funding becomes possible, prove the case in your own estate. Instrument two comparable branches for 30 days, change one, measure 30 more. The difference in differences is an effect size a budget examiner will accept.

The decision: adopt this order as program policy before the first production cutover.

## Slide 16 — Start now: the work that needs no award

Let me close with what can start now, because most of it needs no award.

The staff work: write the application-to-path routing policy that SC-7(4) already asks for. Its absence is the finding, not the absence of a device, and it turns the eventual purchase into enforcement of existing policy. Instrument a sample of branches before the next migration wave. And verify that DNS egress really ends at CISA.

Before money moves: send the target attributes to whoever scopes the BOD 26-02 replacements, in writing. Ask the field-office refresh request to separate acquisition from five-year cost. And re-examine any ExpressRoute arrangement for Microsoft 365; an approval granted years ago isn't current Microsoft guidance.

Before cutover: start CLAW coordination with CISA and the provider, because it's a three-party effort with its own lead time. Have the authorizing official record the interim gap as an accepted risk. And name one decider per row.

Recapping the seven decisions: MTIPS ends on confirmed parity, the interim gap becomes an accepted risk, the refresh carries the target, the investment order starts with staff time, the field-office request gets tested, NPS retirement follows the Entra migration, and the sequence becomes policy.

One point on urgency. The branch measurement baseline can't be reconstructed after the next migration wave, and it costs staff time rather than capital.

Buy transport on physics and govern it as compliance, and the branch gets faster without getting weaker. Book 09 has the detail, every claim footnoted, and the backup slides list the sources behind each slide in this briefing. Thank you.
