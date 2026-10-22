# Book 09 — Network & Transport — narration script (practice copy)

## Slide 1 — Why Does Physics Decide the Architecture?

This briefing comes from Book 09 of the Federal Modernization Workbook, Network and Transport: how to move branch traffic off the long hairpin without turning a latency gain into a compliance loss.

I'll take four questions: why physics decides the architecture, what has to change, who owns the network, and how to get there.

The short version: no product shortens a fiber path, so buy transport on physics, and govern it as compliance.

## Slide 2 — Distance sets a latency floor no product moves

Why does physics decide the architecture? Because part of every delay on a wide-area path is the time light takes to travel through glass. ITU-T G.114 plans on 5 microseconds per kilometer of fiber, about one millisecond for every 200 kilometers, one way. New York to London has a round-trip floor of 56 milliseconds before any equipment touches a packet. Optimization works on the gap above that floor, never on the floor.

G.114's 150 milliseconds is often quoted as the network's voice budget. It isn't. It's mouth to ear, and the terminals take 50 to 80 milliseconds of it, which leaves the network roughly 70 to 100. On the book's worked arithmetic, a Seattle office hairpinning through northern Virginia spends about 60 milliseconds one way on the detour: most of the allowance.

A synchronous commit pays a round trip every time, and no bandwidth changes that. So the answer is to need less global synchronization, not faster synchronization.

## Slide 3 — Transport is physics; control is compliance

Chapter 02 pulls apart two decisions that programs keep merging. Choosing a pipe, whether fiber, MPLS, low earth orbit, 5G or direct internet access, is a physics decision. Choosing what governs the pipe is a compliance decision.

Direct internet access solves one problem, the geographic hairpin. It satisfies none of the protection controls: boundary protection, flow enforcement, transmission confidentiality, malware inspection and monitoring all come from the control layer. Transport closes exactly one control family, telecommunications diversity. So a branch moved from a governed hairpin to bare local breakout is a compliance regression with better latency.

And the governor is itself attack surface. BOD 26-02 targets end-of-support edge devices on the agency boundary. On February 25, 2026, Emergency Directive 26-03 ordered action on Cisco SD-WAN systems after actors were found compromising them and keeping long-term persistence. Protect the controller and every edge before they carry traffic.

## Slide 4 — TIC 3.0 sets goals, but it isn't requirement-free

What does federal policy actually require? Read from the documents, TIC 3.0 is descriptive, not prescriptive. There are four use cases, Traditional, Branch Office, Remote User and Cloud, and no SASE use case. The Security Capabilities Catalog, version 3.3, sets goals, not methods. Two statements constrain a branch: policy enforcement parity on every path, and preserving CISA's visibility as branches connect directly.

OMB M-26-14 rescinded M-21-31 on May 22, 2026. Logs must be searchable for six months and retrievable for a year, and must show source and destination addresses, ports and session attributes. The first agency logging plan is due November 18, 2026.

When branches leave MTIPS, the sensor telemetry CISA received stops. The replacement is CLAW, CISA's Comprehensive Log Aggregation Warehouse, and onboarding needs the agency, CISA and the provider together. Keep MTIPS until CISA confirms parity.

Technology-neutral isn't requirement-free: four binding obligations still land on branch equipment.

## Slide 5 — Centralize the truth; let tokens carry the trust

Chapter 04 separates two meanings of centralize. Logical centralization, one authoritative source of truth with every other copy derived, is almost always right. Physical centralization, one server in one place, stops at three walls: the speed of light, blast radius and data residency.

Token-based security removes the strongest old reason to fragment. When every request carries a verifiable identity, one store can serve many trust domains. Inbound, a multitenant service checks each Entra token's tenant ID against the tenant the data was stored under. Outbound, the service signs in to its database with a short-lived token in the password field, valid 5 to 60 minutes, so the long-lived database password disappears. The price is that isolation lives in code.

Then choose the weakest consistency each flow tolerates. Azure Cosmos DB, as one documented example, puts multi-region strong write latency at twice the farthest round trip plus 10 milliseconds, and blocks strong consistency beyond 8,000 kilometers by default.

## Slide 6 — SD-WAN reaches the floor; SASE makes it lawful

SD-WAN is the governor's first layer. It splits traffic into a lean class, consensus, voice and sign-in, and a bulk class, backups, patches and re-syncs, and keeps bulk transfers from queuing ahead of latency-critical packets. It recovers route inflation: Microsoft measured a median 78 milliseconds from UK South to East US, against a fiber floor of about 62. And it tightens the tail with forward error correction, packet duplication and fast failover. It reaches the floor; it never goes below it.

SASE sits above it: secure web gateway, CASB, firewall and zero trust network access. CISA lists SD-WAN among SASE's networking tools, but mandates neither, and SD-WAN alone doesn't close the boundary, flow and malware controls.

Two cautions. The enforcement point has a location, so a distant point of presence is a hairpin with a different name. And FedRAMP status differs by offering, not by vendor, so read the Marketplace when the requirement is written.

## Slide 7 — On re-routed paths, design around the real list

Re-routing a branch breaks things for a short list of reasons, so design around the list. Proxies reap idle connections, TLS inspection breaks pinned certificates and channel-bound authentication, and a change in the client's apparent source address resets established connections. A path change doesn't break TCP sequence numbers. Address continuity is the property that matters.

Kerberos tolerates NAT under Windows defaults: the domain controller doesn't put client addresses in tickets or check them. And there's no five-millisecond requirement; the five is minutes of allowed clock skew. What genuinely needs a reachable domain controller is short: initial logon, service tickets for on-premises services, Group Policy, password change and hybrid join. Leave that path out and everything works except signing in, while Kerberos quietly falls back to NTLM.

Round trips dominate chatty applications. In the book's illustrative arithmetic, a better branch path saves 17 to 25 percent; cutting 30 sequential round trips to three saves about an order of magnitude.

## Slide 8 — 802.1X proves the device; NPS is the last AD tie

Every token in this book assumes the device on the wire is the device it claims to be. 802.1X turns that assumption into a proof at the switch port. Use EAP-TLS, mutual certificate authentication, for every managed device. Password methods are failing on their own: Credential Guard blocks PEAP-MSCHAPv2 single sign-on, and the October 2026 Windows update restricts NTLMv1-derived credentials too.

The RADIUS server is usually the last piece of the network standing on Active Directory. Windows NPS authorizes against AD computer objects, and Entra joined devices don't support that. There's no Entra RADIUS product; the NPS extension adds MFA, but NPS still authenticates against AD. And NPS has no posture engine: Network Access Protection was deprecated back in Windows Server 2012 R2.

So posture comes from Intune's compliance retrieval service, read by a NAC platform, and each device lands in production, remediation, quarantine, guest or IoT. After the Blast-RADIUS attack, require Message-Authenticator everywhere.

## Slide 9 — One rule, four branch patterns, five decisions

Chapter 08 puts the pieces together with one rule: align each flow's consistency class with its transport class. Only authoritative writes and in-region quorum ride the lean path, and neither crosses a region synchronously.

At the branch, four patterns cover practice. A, the hairpin: assessed, but every flow pays the detour. B, bare local breakout: not an option in the TIC use case at all. C, governed local breakout, an SD-WAN edge plus a nearby SASE point of presence: the reference pattern. D, agent-delivered SASE, for small and roaming sites, if the point of presence is close and agentless devices are covered.

Five decisions carry most of the risk: one writer per region; a written path policy, which SC-7(4) already asks for; the boundary change before cutover; the governor protected before it carries traffic; and the path made evidence. Each fails quietly, so each comes with a check.

## Slide 10 — Who decides, who does the work for the network

Who owns it? The most expensive mistakes in this book are ownership gaps: a circuit bought before anyone owned the governor, a cutover before anyone filed the boundary change, a telemetry contract cancelled before its replacement was confirmed. So the rule is one decider per row.

The sponsor and CIO decide the governor platforms and the order of branch waves. The authorizing official decides the boundary change, the SC-7(4) exception and every standing exception. The CISO sets the control requirements and owns confirming CISA telemetry parity.

The system owner decides, site by site, whether the governor is live and logging before traffic moves. Security architecture decides TIC conformance and writes target attributes into every refresh. And under the Federal Acquisition Regulation only a contracting officer can enter into or terminate a contract, so no engineer can cancel a circuit.

Network engineering and security operations do the work.

## Slide 11 — The long interim: the refresh is the fork

How do you get there when the target is years away? Make the case by elimination. The legacy telecom contracts had all ended by May 31, 2026. The hairpin is still permitted, but CISA's own guidebook says it raised the cost of using cloud services. A new access point is a capital commitment, VPN backhaul is a hairpin, and Microsoft no longer recommends ExpressRoute for Microsoft 365. What's left is local breakout, a cloud security stack and a branch-edge policy layer.

Meanwhile three deadlines compete for the same staff: the M-26-14 logging plan, the M-26-15 post-quantum plan and BOD 26-04.

BOD 26-02 is the fork. End-of-support edge devices must be off agency networks by about August 5, 2027, so a refresh happens anyway. Tell whoever scopes it, in writing, what the target needs. Like-for-like spends the same money and closes the question for the life of the equipment.

## Slide 12 — Field offices: fix the circuit, not the content

Chapter 11 is a worked case: a large field-office estate, about 1,500 offices and 70,000 endpoints, asked to fund a 50-million-dollar refresh of a Configuration Manager distribution point in every office.

Microsoft's published limit is 4,000 clients per distribution point. On capacity, the estate needs 24, two at each of 12 hubs, for 96,000 clients. The other 1,476 exist only to compensate for slow branch circuits. So fix the circuit: dedicated internet access sized to seats, a 5G continuity path, and an SD-WAN overlay.

On the book's planning assumptions, the network program needs about 10 million dollars of first-year capital and reaches a positive cumulative position in year four. But the financial case turns on one number. Breakeven is 873 dollars of current MPLS cost per office per month; below that, argue capability, not savings.

And no office's MPLS is retired until its replacement telemetry is confirmed.

## Slide 13 — Microsoft 365 Optimize: a signed SC-7(4) exception

Microsoft says to send its Optimize traffic straight to Microsoft, without TLS inspection. The boundary says inspect everything. Both positions hold up, so the gap is a decision someone signs.

Optimize is small: three endpoint sets, for Exchange Online, SharePoint and OneDrive, and Teams media, which has no names and must be steered by IP prefix. Exempting only Optimize is narrower than Microsoft asks, and it leaves sign-in on the inspected path.

Name what the bypass punctures: SI-3, SI-4(10) where it's selected, AC-4 and AU-3. SC-8 is not a gap. The vehicle is SC-7(4): each exception documented with its mission need and duration, and reviewed.

The assessor's attack is tenant-to-tenant exfiltration. Only Windows device-side tenant restrictions v2 reaches the SharePoint and Exchange data plane, so it's a precondition to cutover. Three instruments carry the decision: the authorizing official's memo, the system owner's site register and the architecture review board's determination.

## Slide 14 — Governor before traffic, boundary before cutover

Order decides whether modernization is a gain or a regression. Step zero: bring the governor under vulnerability management, privileged access and logging. Then buy the pipe on measured physics, deploy the governor before production traffic, decide the boundary change before the first cutover, handle Microsoft 365 through its own exception, and register the evidence, confirming CISA telemetry parity before any legacy circuit ends. No memo mandates that order; it's an engineering dependency.

Phase inversion is what happens when cloud migration runs ahead of transport. With no transport metrics, slowness is attributed to the cloud, the remedies raise cloud spend, and the cause never enters the data. The book labels that an inference built on documented parts, and names better-evidenced competitors.

So measure in your own estate. A paired-branch study, two comparable branches instrumented for 30 days before and after a change at one, gives an effect size a budget examiner will accept.

## Slide 15 — Decisions to make, and next steps

So, four decisions.

Adopt the sequence as policy: the governor secured and live before traffic, the boundary change decided before cutover, and CISA telemetry parity confirmed before any MTIPS or MPLS circuit ends.

Put the target attributes in writing for every BOD 26-02 replacement, before the August 2027 deadline spends the money like for like.

Decide the Microsoft 365 Optimize exception with tenant restrictions v2 from the device as a precondition.

And name one decider per row, from the authorizing official to the contracting officer.

The next step needs no award: write the application-to-path policy that SC-7(4) already asks for, and instrument a sample of branches before the next migration wave, because that baseline can't be rebuilt afterward.

Buy transport on physics and govern it as compliance, and the branch gets faster without getting weaker. The Federal Modernization Workbook's Book 09 has the detail, every claim footnoted. Thank you.
