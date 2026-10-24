// Spoken narration for Start series Episode 2, "The First Four Weeks", one entry per narrated slide, keyed by title.
// The slide's intent and highpoints in plain language, for executives; the full detail stays in the notes.
module.exports = {
"The First Four Weeks: What Phase 0 Produces":
`Welcome back to the Federal Modernization Workbook. This is Episode 2 of the Start series. Episode 1 asked leadership to approve a four-week pre-flight, called Phase zero. This episode opens that box: what has to be true on day one, what the team builds and reads in those four weeks, and what the first gate, G zero, checks before anyone plans a change. By the end, you'll know what you're holding at week four. Let's start with the shape of the phase.`,

"Four weeks, one goal, one exit":
`Phase zero has one goal and one exit. The goal is to produce the planning artifacts and stand up the platform that will hold them. The exit is gate G zero, Ready to Plan: the platform works, the assessment is committed, and no priority-one finding is open. Two cautions. Four weeks is illustrative, so plan from the milestones, not the week count. And nothing moves before the assessment is done; a plan without one is a guess. So what has to be true on day one?`,

"Day one: three entry conditions":
`Three things have to exist before week one. First, two names: an executive sponsor, who owns scope, funding and sequence, and a steward, who runs the program and decides the first gate. Second, a server to hold the work. Third, a read-only account for the assessment, with no administrator rights at all. The names may already exist. Federal policy already required a zero trust lead and an identity governance group, so build from those people, not beside them. Next, that server.`,

"The platform host: where every decision is written down":
`The platform host is one governed server, with a standby for recovery, and it's where the program writes everything down. What matters is one authoritative writer, so there's never a question of which copy is right. The host reads the old directory without changing it, and it writes to the cloud only through plans someone has approved. It's protected like the most sensitive identity systems. And it's a reference design built from standard parts, not a product to buy. Now, the reading.`,

"Reading the estate without changing it":
`The assessment reads the whole estate and changes nothing. That's enforced three ways: the account can't write, the code has no write commands, and every call is logged. It runs in two tiers. A plain account reads what default permissions expose, which is usually more than people expect. Then a few narrow, read-only additions fill the gaps it recorded, and nothing that exposes secrets is ever requested. And tell security operations first: a full directory read looks a lot like reconnaissance. So what does it inventory?`,

"What the assessment inventories":
`Here's what it reads: the directory's structure, every kind of account, every Group Policy Object, the network services that lean on the directory, the certificate authorities and their templates, and the applications that bind to the directory. For any application that might move away from its data, it measures how chatty it is. Out of this come risk findings, like unsafe delegation or servers on Windows Server 2016, and every one gets a disposition. But a list only helps if you can prove where it came from.`,

"Provenance, and seeding the repository":
`Every assessment run carries its own receipt: who ran it, when, against which forest and which domain controller, with which rights, and a fingerprint of every file it produced. A run without that receipt is rejected. The receipt lands in the repository, which this phase seeds. From here on, every artifact is a reviewed change with a status, and nothing becomes official until the steward approves it. The inventory itself is sensitive, so it's stored encrypted, and the assessment workstation is wiped afterward. Next, the program's own access.`,

"Least privilege for the program's own access":
`The program practices what it asks of everyone else, starting with its own access. The directory reader is an ordinary account, never a domain administrator. The connections to cloud identity, device management and server management each get their own service identity, with only the permissions that job needs. And the part of the platform that approves a change runs under different credentials from the part that carries it out, so no single account can both decide and act. Then come the people.`,

"Owners named, findings classified":
`By week four, every finding has a class and an owner. Critical findings block the gate: each one is fixed, or formally accepted by the authorizing official, the only person who can accept that risk. High findings get an owner and a date before the next gate. The people are named too. The steward decides the gate, with the sponsor as backup, and the workstream leads review what was found in their areas. The steering committee advises; it doesn't add a second signature. So what does the gate check?`,

"Gate G0, Ready to Plan: the checklist":
`Gate G zero is a checklist, answered from the repository, not from a status meeting. Is the platform working, with its service identities scoped and its logs in central logging? Is the assessment committed, covering every area, with its receipts? Is every finding classified, with nothing critical left open? And is the decision itself recorded, with the name of whoever made it? The answer can be go, no-go, or go with conditions. A gate passed on a date without the evidence just moves the failure later.`,

"What leadership sees at week four":
`At week four, leadership holds facts instead of estimates. An inventory of the whole estate, with proof of how it was read. A findings list where every item has an owner and a date. A platform that records every decision and who made it. And a gate decision, on the record. Right after the gate, the assessment becomes eight modernization plans, generated from data rather than drawn up by hand, and approved by the steward. That's where the foundation work begins, and it's the subject of Episode 3: Foundation to Gate G1.`,
};
