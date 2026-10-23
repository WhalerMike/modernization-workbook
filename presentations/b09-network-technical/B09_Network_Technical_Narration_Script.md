# Book 09 — Network & Transport — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Network & Transport: the technical deep dive

Welcome. This is the technical deep dive for Book 09 of the Federal Modernization Workbook, Network and Transport, and it's for the network engineers and architects who'll actually move branches off hairpinned transport. The whole book rests on one idea: transport is a physics decision, and control is a compliance decision. Mix them up, or do them in the wrong order, and a faster network becomes a compliance finding. Part 1 covers policy and transport: what TIC 3.0 really requires, then SD-WAN, SASE and the legacy protocols riding on new paths. Part 2 covers access and architecture: 802.1X after Active Directory, then the reference design and who owns each decision. Let's start with why.

## Slide 2 — Why this matters: the floor, the pipe and the governor

Here's why this matters. Light in fiber covers about two hundred kilometers per millisecond, and nothing you can buy changes that. The famous 150-millisecond voice budget is mouth to ear, so the network really gets seventy to a hundred, and a cross-country hairpin can burn most of it before a call goes anywhere useful. That's the physics. The compliance side is just as firm: a circuit closes exactly one control family, telecommunications diversity. Everything else comes from the layer that governs the circuit. So a bare local breakout fixes latency and loses the boundary. Which brings us to the order you do things in.

## Slide 3 — The order of operations, and where this deck goes

This is the spine of the whole deck: an order of operations. Step zero is securing the governor itself, because an SD-WAN controller is an internet-facing system with authority over every branch. Then buy the pipe on measured physics, get the governor live and logging, decide the boundary change before cutover, handle Microsoft 365 through its own exception, and register the evidence, including CISA's telemetry, before any old circuit goes away. The book is candid that this is an engineering dependency, not a mandate, and that's exactly why it holds up in review. The table is our map. Module 1 starts with what policy actually says.

## Slide 4 — Module 1: TIC 3.0 in practice, and token security

Module 1 is TIC 3.0 in practice. Branch decisions get argued in policy terms, and most of those arguments don't survive a careful read of the documents. But the opposite mistake is just as common: assuming technology-neutral means requirement-free. We'll read what's really there, and finish with how token security changes where data can live.

## Slide 5 — TIC 3.0 as written: four use cases, two hard rules

Let's read TIC 3.0 from the documents themselves, not from what people say about them. There are four use cases, and no SASE use case; CISA's SASE guide describes an approach, it doesn't require one. What constrains a branch are two rules. First, policy enforcement parity: if you need a capability anywhere, you need it on every path, and that's the only place TIC mentions SD-WAN, as something to govern. Second, CISA keeps its visibility when branches break out locally. So technology-neutral gives you discretion, with an obligation attached. And binding instruments sit right beside TIC.

## Slide 6 — Technology-neutral, not requirement-free

This slide is the answer to "TIC doesn't require anything." Four binding obligations land directly on branch equipment. Egress DNS has to reach CISA's Protective DNS. Management interfaces can't sit exposed on the internet. End-of-support edge devices come out on a dated schedule. And anything terminating TLS or IPsec has to support post-quantum key exchange. None of them picks a product, but together they shape the box. The big takeaway is the refresh: replacing branch hardware is already a dated obligation, so that purchase is where the architecture gets chosen. Next, the controls an agency asserts about its own boundary.

## Slide 7 — The branch as boundary: control assertions and SC-8

The hardest test at a branch is often one the agency wrote itself. Once a branch breaks out locally, it's an external boundary, and the security plan makes promises about it: boundary monitoring, a traffic-flow policy per service, continuous monitoring. Lacking SD-WAN isn't a finding; being unable to produce that evidence is. On encryption, the book is precise. The controls accept TLS or IPsec, and nothing in the baselines demands an encrypted WAN when the payload is already protected end to end. Where encryption really matters is cleartext protocols, so inventory those and treat the list as an exposure register. Now, what happens to DNS and telemetry.

## Slide 8 — DNS, logging and CISA telemetry after MTIPS

When traffic stops passing the old access point, three things move with it. DNS still has to end at CISA, and the trap is quietly forwarding to a vendor's look-alike resolver: everything works, and you're out of compliance. Logging now runs under M-26-14, with maturity dates already on the calendar. And CISA's telemetry, which used to come from sensors on the MTIPS path, has to come through CLAW instead. The rule the book recommends is simple: don't turn off MTIPS until CISA confirms the replacement telemetry is flowing. Then a quick check on which policies are still current.

## Slide 9 — Policy currency, and why FedRAMP never decides a route

A lot of network documents carry at least one stale citation, so here's where things stand in October 2026. M-21-31 is gone, older vulnerability directives have been replaced, and the legacy telecom contracts have expired. The FedRAMP point matters most day to day. FedRAMP certifies a cloud service, not the route you take to reach it. So when someone refuses a network change for FedRAMP reasons, ask which control it violates. There isn't one, and the book treats a refusal without a control basis as a governance problem. Now the data-side idea that makes centralization safe.

## Slide 10 — Token security and consistency classes in practice

This slide explains why network people should care about tokens. The old reason to split data into many stores was isolation by perimeter. Tokens remove it: when every request carries a verifiable identity, one store can safely serve many trust domains, and the long-lived database password disappears. The physics still applies, though. Strong consistency over long distances is expensive, so keep it inside a region and let everything else be asynchronous. That choice decides which flows need a fast path at all. And the price is named honestly: isolation now lives in code, so that code has to be small, tested and fail-closed. That wraps up Module 1.

## Slide 11 — Module 2: Governed transport and legacy protocols

Module 2 is governed transport and the legacy protocols that ride on it. First the governor itself: what SD-WAN and SASE each close, and how to protect them. Then what actually breaks when you re-route a branch, which turns out to be a shorter, and different, list than the folklore suggests.

## Slide 12 — SD-WAN works the gap above the floor, and the tail

Here's the honest version of what SD-WAN does. It can't beat the speed of light, but most real paths run well above that floor, and the gap is where SD-WAN earns its keep. It separates lean, latency-sensitive traffic from bulk transfers, and it recovers some of the detour in real routes. The underrated part is the tail. A quorum commit or a voice call is only as good as its unluckiest packet, and tools like forward error correction and packet duplication shrink that tail. What it never does is go below the floor. So what does SASE add on top?

## Slide 13 — SASE above SD-WAN: who closes which control

SD-WAN decides paths; it doesn't inspect anything. Boundary protection, web policy, malware inspection and private-app access come from the SASE services above it, and this table shows which layer closes which control. Two practical points. The enforcement point has a location, so a distant or poorly peered point of presence is just a hairpin with a new name; measure it before cutover. And FedRAMP status is per offering, not per vendor, and it covers the cloud service, not the boxes in your offices. Which raises the question nobody likes: who protects the governor?

## Slide 14 — Securing the governor before it carries traffic

The governor deserves its own security program, because it becomes the most consequential network system you own. SD-WAN trades a few hardened egress points for hundreds of internet-facing edges and one controller that can reroute everything. This isn't hypothetical: in February 2026, CISA issued an emergency directive for one vendor's SD-WAN control plane, and its sequence makes a good drill whatever you run. Inventory, preserve the logs, patch, hunt, rebuild if needed, harden. The table is the minimum control set. Be able to run that drill before production traffic depends on it. Next, where the program would like to take the path itself.

## Slide 15 — The governed path, and the records the fabric emits

This slide is a proposal, and it's labeled that way. The idea: today identity is checked on every call to the data, but a network session is trusted once and then coasts. The proposed governed path treats the path itself like a token, leased for one purpose and expiring with it, so a flow with no token behind it shows up as drift. Whether or not that's adopted, one part applies now: SD-WAN and SASE decisions should land as records, with identity, policy and time attached. That's your evidence later. Now, what breaks when paths change.

## Slide 16 — What breaks on re-routed paths, and what doesn't

Re-routing a branch does break things, but for specific, documented reasons. Proxies time out idle connections, inspection breaks pinned certificates and mutual TLS, and some applications care about the client's IP address. That's the list to design around. Just as useful is what doesn't break. A path change doesn't scramble TCP; a changed source address does, so address continuity is the property to protect. And Kerberos doesn't check client addresses by default, doesn't need a domain controller within milliseconds, and no policy mandates short token lifetimes. Wrong mechanisms lead to wrong fixes. The real Kerberos dependency is next.

## Slide 17 — A defined domain controller path for every branch

This is the slide behind the classic help-desk report: everything works except signing in. A handful of operations still need a reachable domain controller, like first logon, Group Policy and password changes. A branch on local breakout reaches the internet just fine, but if nobody planned its path to a domain controller, those operations fail. Worse, Windows quietly falls back to NTLM, which is exactly what the program is trying to retire. So give every branch a defined path, through a private link, a connector or a KDC proxy, or remove the dependency with Entra join. Then, a reality check on performance.

## Slide 18 — Round trips dominate; egress must be deterministic

Two practical lessons here. First, for chatty applications, transport improvements help modestly, about a fifth, because a branch device only touches the first leg of the trip. Cutting thirty round trips down to three helps about tenfold. So the application change usually wins, and that belongs to the application owner. Second, for token-based access, the network matters through a stable, known egress address. Conditional Access and continuous access evaluation rely on seeing the same addresses for sign-in and for resource traffic. Unpredictable egress means false alarms and weaker location policy. That closes Part 1.

## Slide 19 — Module 3: Network access control after AD

Module 3 is network access control after Active Directory. Sign-in controls can't stop someone who simply plugs a laptop into a conference-room jack; only the port can. And the RADIUS server checking that port is usually the last piece of the network still standing on Active Directory. So this module is about proving devices, and retiring that dependency safely.

## Slide 20 — Port admission: 802.1X roles and the EAP choice

Port admission has three players: software on the device, the switch or access point that relays, and the RADIUS server that decides. The method that matters is EAP-TLS, a certificate on each side, so neither the device nor the network can be faked without a private key. The urgency comes from Windows itself. Password-based methods like PEAP with MS-CHAPv2 are being cut off from single sign-on, first by Credential Guard and now by the October 2026 hardening. So agencies still on password-based Wi-Fi have a deadline they didn't choose. Next, the server doing the checking.

## Slide 21 — NPS is the AD dependency: the replacement options

Windows NPS works today because devices are hybrid-joined. The trouble is that it leans on Active Directory computer objects, and Entra-joined devices don't have them. Entra ID offers no RADIUS service of its own, and NPS has no way to read device health. So NPS gets less useful with every device you move. The options are an on-premises NAC platform, a cloud RADIUS service with the right FedRAMP status for that function, or taking RADIUS out of remote access entirely. The program's rule: tie the switch to the migration timeline, and authorize cloud devices first. Next, where the health signal comes from.

## Slide 22 — Posture from Intune: compliance retrieval and CoA

The program doesn't add a separate posture probe; it reads Intune. A NAC product registers with Entra ID, the device certificate carries its Intune device ID, and on connect the NAC asks Intune whether the device is compliant. Two realities to plan for. Posture is only as fresh as Intune's last check-in, which can be hours old. And when a device falls out of compliance mid-shift, something has to move the port, which is Change of Authorization. NPS can't send it, and building your own is real engineering, which is a strong argument for a NAC platform. So where do devices land?

## Slide 23 — Five policy tiers, MAB and session timers

Every device lands in one of five segments, and this flow shows how. No valid certificate means quarantine. A good certificate but failed compliance means remediation, where the device can fix itself and come back, and never drifts silently into production. Devices that can't run a supplicant, like badge readers and printers, are classified by MAC address, and the book is blunt that this is classification, not authentication. The eight-hour re-authentication is the backstop when nothing else fires. Next, hardening RADIUS itself.

## Slide 24 — RADIUS hardening, Wi-Fi and the server certificates

RADIUS has a weakness of its own. Over plain UDP it relies on MD5, and the 2024 Blast-RADIUS research showed an attacker in the middle could forge an accept. EAP is largely protected, but the fix is cheap: require the message authenticator everywhere, use strong rotated secrets, and move to RADIUS over TLS where the hardware allows. On the wire, one certificate serves wired and wireless, and WPA3-Enterprise is the target. And don't forget the server certificates: they renew through the lifecycle platform, and one, the NPS MFA extension's, is easy to miss. Now, rolling this out without an outage.

## Slide 25 — Rollout in four phases, and the controls it closes

The fastest way to cause an outage with access control is to enforce before you know what's on the network. So the rollout starts in monitor mode: everything authenticates, nothing is blocked, and the logs build a baseline. Then wired enforcement, then wireless, then tightening the device segments, finishing with a tabletop where someone plugs a rogue laptop into a meeting room. Done this way, it closes real device-authentication and inventory controls. One correction worth knowing: it doesn't close the external-connections control people often claim for it. That wraps up access control.

## Slide 26 — Module 4: Reference architecture and ownership

Module 4 pulls everything together into a reference architecture, then answers the question behind most of the expensive mistakes: who decides. Circuits get bought before anyone owns the governor, and cutovers happen before anyone files the boundary change. Naming one decider per step costs less than any product.

## Slide 27 — One rule: align consistency class with transport class

One rule ties the data and network layers together: match each flow's consistency needs to the transport built for it. Strongly consistent writes and their quorum stay inside one region, on the fast path. Everything that crosses regions is asynchronous and rides the bulk path. That's not a limitation; it's using physics on purpose. The program's own SaaS data plane is the worked example: one regional writer and tokens on both sides, so SD-WAN would matter only for background replication. Now the same rule at a branch.

## Slide 28 — Four branch egress patterns, compared

At a branch, the question is where traffic leaves the building and what enforces policy when it does. There are four patterns. The hairpin is assessed but slow. Bare breakout is fast, and a regression. Governed breakout, with an edge device and a nearby security service, is the reference pattern. And agent-based SASE suits small or roaming sites, as long as the nearest point of presence really is near. The guidance is to choose per site from measured latency and device mix, and never to choose bare breakout. Five decisions carry most of the risk.

## Slide 29 — Five design decisions, and how to check each

Most of the risk sits in five decisions, and what makes them dangerous is that skipping one breaks nothing on the day. Keep one writer per region. Write the path policy for every application class, which is also the traffic-flow policy an assessor will ask for. Pick the egress pattern per site, and file the boundary change first. Bring the governor under control before it carries traffic. And make the path itself evidence. Each one comes with a concrete check, so you can prove it was done. Next, who owns them.

## Slide 30 — One decider per row: the network responsibility matrix

Here's the part of the book that's new: ownership. Many network decisions are really risk decisions dressed up as engineering or purchasing, so they have to reach the person who can accept the risk. This matrix gives one decider per row. A few are worth noticing. The authorizing official decides that the boundary may change, but the system owner decides, site by site, whether that site is ready. And a circuit ends only after security operations confirms CISA's telemetry, and only the contracting officer can end it. Next, a named gate for each step.

## Slide 31 — An owner per gate, and the boundary-change evidence

Each step in the order of operations now has one decider, and the gate between steps is a person, not a date. The CISO signs off on the governor's security, the system owner on each site's readiness, and the authorizing official on the boundary change and the Microsoft 365 exception. The boundary change rides on evidence: the path policy, failover tests, path telemetry, exceptions, CLAW confirmation, and an honest list of what you can't show yet. Let's finish with what to decide, and what to start.

## Slide 32 — Decisions for the owners, and next steps

To close: five decisions to put in front of the people who own them, from the governor platform and the NPS exit trigger to the boundary change and the rule for leaving MTIPS. And there's plenty you can start on Monday without a new contract. Verify where your DNS really goes. Inventory cleartext protocols. Check each branch's path to a domain controller. Write the path policy. Put the right attributes into every refresh. Start CLAW onboarding and 802.1X monitor mode. And measure a pair of branches before you buy. Governor before traffic, boundary before cutover, evidence before a circuit ends. Thank you.
