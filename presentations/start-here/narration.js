// Spoken narration for "Start Here", one entry per narrated slide, keyed by title.
// The slide's intent and highpoints in plain language, for executives; the full detail stays in the notes.
module.exports = {
"Start Here: Where Modernization Begins":
`Welcome to the Federal Modernization Workbook. If you lead an agency's technology, security or workforce, this is the place to start. In under ten minutes, I'll make one case: that modernization should begin with identity, and that the first step is small, bounded and can start now. There are four reasons, and then one specific ask, with a finish line you can check. Everything I say is sourced in the workbook's books, and I'll point you to them at the end.`,

"Four reasons to start now":
`Here are the four reasons on one page. There are deadlines nobody can move. Every other decision depends on identity, so it has to come first. The HR side of government is being rebuilt anyway, which makes this the cheapest moment to connect identity to it. And the access risk is already on the books today. None of this requires a large commitment to begin. Let's take them one at a time, starting with the clocks.`,

"The clocks nobody can move":
`Modernization is usually treated as a choice of timing. It isn't, because the dates are set outside the agency. Federal directives already require secure cloud configurations and better logging. FedRAMP's new rules become mandatory in January 2027. And the closest date is Windows Server 2016, which reaches end of support on January twelfth, 2027. In many estates that's where domain controllers and certificate authorities run. Count your own 2016 servers before the meeting; that number will do more than any slide. So with time short, where do you begin?`,

"Everything decides on identity":
`You begin with identity, because everything else decides on it. Access policy, devices, data, certificates: each one asks who or what is making the request. If the answer to that question isn't trustworthy, nothing built on top of it can be either. That's why the workbook numbers its books in this order, with identity first and infrastructure next, then the cloud boundary, assurance and operations. Skipping ahead only moves the problem. And right now there's an unusual opportunity on the identity side.`,

"HR is being rebuilt anyway":
`Federal HR 2.0 is moving agencies onto one government-wide human resources platform. The OMB and OPM memo came in December 2025, Oracle won the contract in June 2026, and agencies move in waves through fiscal 2027. Each agency's move includes new connections, designed during onboarding. OPM rebuilds the HR side, but the identity side is left to the agency. If identity rides along, the agency connects once. If it waits, it builds twice. That's why the workbook calls HR 2.0 the opening, not the project. Which brings us to the risk agencies already carry.`,

"The access risk agencies already carry":
`Today, who gets an account, and when access ends, often lives in tickets, spreadsheets and email. A contractor roster is out of date the moment it's saved. Quarterly access reviews can't see a transition when it happens, so a review ninety days after someone leaves ends up approving an account nobody should have. Assessors know this pattern well; it's where account-management findings come from. HR-driven identity fixes the cause: the HR record becomes the source of who works here, and access follows it. So what exactly is the ask?`,

"The first ask: four weeks, no vendor decision":
`The ask is small. Phase zero is a four-week pre-flight, and it doesn't require choosing a vendor. It needs three things: an inventory, from a read-only assessment of the current estate; an owner, meaning a named executive sponsor and a steward who runs the program; and a date, with the first gate on the calendar next to those external deadlines. At the end of four weeks, leadership sees the estate as it really is, and decides the next step from facts. Then comes the first real milestone.`,

"The finish line: Gate G1, Foundation Complete":
`Phase one, the foundation, runs about four more weeks and ends at a gate leadership can check, not just sign. Groups and administrative units are in place, with no drift. Everyone is under multifactor authentication, except a few emergency accounts that are vaulted and tested. The core infrastructure is covered by address management. And the HR feed is live for a first group of people. Each of those is measured from data. When the gate passes, everything else has something solid to stand on. So who needs to be in the room?`,

"Who decides, and what to bring":
`The decision belongs to a few people. The executive sponsor, with the CIO, owns scope, funding and sequence. The steward owns the target design and the early gates. And workstream leads say when their area is ready. To make the conversation concrete, bring four local numbers: how many 2016 servers you run, how many contractors sit outside the HR system, how long it takes a departing person to lose access, and your HR 2.0 wave. Then ask for one decision: approve the four-week pre-flight, with a named owner and a start date.`,

"Where to go next":
`To go deeper, start with the Book 00 executive briefing, which lays out the decisions with owners and timing. Book 01, Chapter 12 is the roadmap, with every phase and gate. Book 02 covers identity and the directory, and Book 03 makes the full case for HR-driven identity. Every claim in this briefing is footnoted to a primary source in those books. The workbook is independent analysis, not an official publication of any agency. Thank you for starting here.`,
};
