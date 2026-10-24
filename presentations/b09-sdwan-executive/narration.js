// Spoken narration for "The Field-Office WAN Case: SD-WAN for Executives", one entry per narrated slide, keyed by title.
// The slide's intent and highpoints in plain language, for executives; the full detail stays in the notes.
// Every figure is Book 09 Chapter 11's planning estimate unless the slide says otherwise.
module.exports = {
"The Field-Office WAN Case: SD-WAN for Executives":
`Welcome. This briefing from the Federal Modernization Workbook takes on one investment question: what to do about the network behind an agency's field offices. A familiar proposal asks for about fifty million dollars to refresh a content server in every office. I'll make the case that the problem is the circuit, not the content, and that fixing the circuit costs less and does more. You'll see the honest limits, the costs and their assumptions, the security conditions, and the one decision to ask for.`,

"The problem: 1,500 servers doing a circuit's job":
`Here's why this matters. The worked case is an estate many agencies will recognize: about fifteen hundred field offices, about seventy thousand Windows endpoints, and a content server in nearly every office, because the circuit was once too slow for anything else. Microsoft's published limits say that estate needs about twenty-four of those servers, not fifteen hundred. The other fourteen hundred and seventy-six compensate for slow branch circuits. And the money would land on a tier the device strategy is already shrinking. So what would fixing the circuit actually buy?`,

"What SD-WAN fixes, and the floor it can't move":
`Let's be honest about the limits first. Part of every delay is the time light takes through fiber, about five microseconds per kilometer, and no product changes that. What SD-WAN does is close the gap above that floor: better paths, a tighter tail through fast failover, and bulk downloads kept away from traffic that has to be quick. Each office gets two paths, an internet circuit sized to its seats and a 5G link for continuity, not capacity. It's a better road, not a shorter one. Here's what the target looks like.`,

"The target: 12 hubs and 24 distribution points":
`The target fits in one picture. Two data centers hold the full content library and feed ten regional hubs, all in existing facilities. Each hub carries two servers, twenty-four in all, enough for ninety-six thousand clients, so about seventy-three percent utilization. Offices reach the hubs over the SD-WAN overlay with no server in the closet, and peer caching keeps most content local. One limit is settled: Microsoft's informed routing feature isn't available in GCC, so the design uses direct breakout and application-aware routing from day one. Now, what does it cost?`,

"What it costs: about $10 million in Year 1":
`On the book's planning assumptions, the first year needs just under ten million dollars of capital: about five million for branch equipment, about one million at the hubs, and nearly four million for the control plane, installation and engineering. At steady state, the new circuits, subscriptions and security licensing run about fifteen point seven million a year, while retiring MPLS removes about twenty-one point six million. That's roughly five point nine million a year back. Every figure is an estimate to replace with your own data, and one matters more than the rest.`,

"Five years out, and the one number that decides it":
`Savings arrive as offices move at their MPLS renewal dates, not on day one. In the base case the program turns cumulatively positive in year four and is about seven point seven million ahead after five years. The refresh spends fifty million up front, so the five-year difference is about fifty-seven point seven million. But all of that turns on what MPLS costs per office today. Breakeven is eight hundred seventy-three dollars a month. Above it, the program pays for itself. Below it, it's still the better architecture, argued on capability. Then there's security.`,

"Security: the branch edge becomes a control":
`Breaking out at the branch means operating under the TIC 3.0 branch office use case, and that changes what the edge is. Every path has to land on equally strong enforcement, so the steering policy itself becomes a security control. Accreditation, not procurement, is the critical path, which is why starting at twelve hubs instead of fifteen hundred offices matters so much. No office's MPLS circuit retires until its replacement telemetry is confirmed. And the controller is estate-wide attack surface, so it's patched, logged and locked down before it carries traffic. That sets the roadmap's order.`,

"The roadmap: hubs first, offices at renewal":
`There are four phases. Phase zero, about six months and about one point eight million dollars, does the design, the accreditation package, the control plane and a ten-site pilot. Phase one builds the twelve hubs and the consolidated content tier. Phase two moves offices in waves at their MPLS renewals, so each wave helps fund the next. Phase three adds Microsoft 365 path optimization and caching at the hubs. Meanwhile, a federal directive requires end-of-support edge devices to be replaced by about August 2027, so write the target's requirements into those replacements now. And the finish line isn't a date.`,

"A gate, not a date: retiring the last server":
`The twenty-four-server tier is an interim state, not a new floor. The last one retires when five gates close: application and update content have moved to Intune, imaging has moved to Autopilot, no cache still runs on that hardware, and no compliance evidence still comes from the old site database. An estate that closes them in month thirty retires the tier in month thirty. One that hasn't by month sixty keeps it, rather than forcing a cutover against an open gate. Next, what could go wrong.`,

"Risks, and the assumptions to check first":
`Three risks are rated high. Accreditation could slip; a twelve-month slip cuts the five-year position to about one point eight million, but the case survives. MPLS might cost less than assumed, which moves the argument from savings to capability. And telemetry could lag cutover, which is why it gates every retirement. Behind those sit ten assumptions; check MPLS cost and the endpoint count first. The book is plain about it: the architecture holds across the plausible range, but the financial case holds only once the MPLS number is confirmed. So here's the ask.`,

"The decision to ask for":
`The ask has three parts. Defer the fifty-million-dollar refresh pending a network assessment, and have the sponsor say whether that figure is acquisition or five-year cost. Validate the assumptions, starting with MPLS. And fund Phase zero, about one point eight million over six months, with a named owner and a clear first gate: authorization for regional breakout, a stable pilot, and real per-site costs. Before scaling out, prove it with a paired-branch study: two comparable offices, measured for thirty days, a change at one, thirty more days. That difference is your business-case number.`,

"Where to read next":
`To go deeper, Book 09, Chapter 11 has the full worked case, with every assumption and its source. Chapter 05 covers what SD-WAN can and can't do, and how to secure the controller. Chapter 03 sets out the TIC 3.0 requirements, Chapter 10 the long interim and the refresh fork, and Chapter 13 the sequencing and the paired-branch study. The Book 09 executive briefing covers the wider network decisions. Every figure here is a planning estimate from the book. Thank you.`,
};
