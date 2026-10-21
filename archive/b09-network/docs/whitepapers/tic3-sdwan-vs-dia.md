# SD-WAN vs. DIA Under TIC 3.0

**Transport is a physics decision; control is a compliance decision**

## Problem, solution, ask

**Problem.** Federal network programs keep framing “SD-WAN vs. DIA” as a choice. Direct Internet Access is a pipe that solves the geographic hairpin; SD-WAN is the control surface that governs pipes. Treated as alternatives, agencies end up with a governed network too slow for voice or a fast network that is a compliance finding — and a bare DIA branch egress sits outside any assessed boundary.

**Solution.** Transport is a physics decision (fiber, MPLS, LEO satellite, and 5G differ enormously in physics and close exactly one control family: telecommunications diversity). Control is a compliance decision (the SD-WAN/SASE governor closes the protection controls). TIC 3.0 is why you cannot stop at the pipe — and the governor is itself attack surface.

**Ask.** Before the next transport or SD-WAN procurement: run the decision sequence against the current portfolio, file the authorization-boundary update before cutover rather than after, and name an owner for each step.

## The false versus

DIA is a pipe. SD-WAN is the control surface that governs pipes. DIA solves exactly one problem — the geographic hairpin — and satisfies none of the confidentiality, integrity, flow-enforcement, boundary, malware, or monitoring controls claimed near it. Deployed bare, it leaves the branch egress outside any assessed boundary.

## The physics

Light in fiber travels at roughly 200,000 km/s. ITU-T G.114 budgets 150 ms one-way for acceptable conversational quality. A field office hairpinning through a distant data center spends 100–130 ms one-way on the detour. Local breakout deletes the propagation and routing-inflation terms and moves inspection to where the latency budget can afford it. No security product shortens a fiber path.

Every transport — fiber DIA, MPLS, LEO satellite, 5G — is a pipe. They differ enormously in physics and not at all in their contribution to the protection controls, which is zero for all of them. What transport selection does close is telecommunications-services diversity.

## TIC 3.0 as the policy gate

TIC 3.0 replaced mandatory consolidation with a use-case model: branch traffic may egress locally only when the security-capabilities catalog is satisfied at a distributed policy enforcement point — and only while the agency’s telemetry obligations are met. The policy enforcement point also has a location, and the physics argument applies to it.

## SD-WAN as the transport governor

SD-WAN contributes circuit-wide encryption, traffic-class separation, and application-layer path telemetry, plus active-active multipath. The boundary, flow, and malware closures come from the SASE stack above it. SD-WAN alone does not satisfy the TIC 3.0 Branch Office use case.

## The governor is itself attack surface

A controller with agency-wide routing and policy authority, and a fleet of internet-facing edges replacing two hardened egress points, are consequential new exposures. Edge-management-plane products are among the most actively exploited categories in federal networks. A paper that credits the governor with closures owes the reader the controls that protect the governor.

## Decision sequence

1. Buy the pipe on measured physics within the acquisition and supply-chain envelope.
2. Deploy the governor before production traffic.
3. Treat the boundary change as the significant change it is.
4. Handle Microsoft 365 traffic through its own documented exception rather than an ad hoc workaround.
5. Register the supporting technical evidence.

Doing these out of order — especially lighting up fast connections before the security layer is live — is the single most common and most costly mistake.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
