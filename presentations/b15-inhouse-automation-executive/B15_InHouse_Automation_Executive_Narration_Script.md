# Book 15 — Building Day-Two Automation In-House — narration script (practice copy)

## Slide 1 — Building Day-Two Automation In-House

Welcome. This briefing from the Federal Modernization Workbook asks one practical question: when there's no money for new products, can our own staff build the day-two automation we need, and do it safely? By day two, I mean the everyday work after a system goes live: the resets, the changes, the fixes, and the proof that they were done right. I'll cover the problem we're trying to fix, why the funded options are off the table, what we can build on the ServiceNow instance we already own, and how artificial intelligence, or AI, can help write the code without cutting corners. Then who does what, the evidence we get out of it, and the honest limits. It ends with one small, low-risk decision to approve.

## Slide 2 — The problem: procedures that leave no evidence

Let's start with the problem. A lot of day-two work still runs on email and memory. Someone asks for a change, someone else makes it, and the proof lives in an inbox, if it lives anywhere. The work may well be done right. But when an auditor asks who approved it, when it happened, and whether the fix actually held, there's nothing to show except people's recollections. Even where there is a ticket, a closed ticket only proves somebody did something. It doesn't prove the setting stayed fixed the next day. An assessor wants four things: an owner, a clock, an approval, and a result someone else can check. That's the gap. We do the work, and then we can't prove it.

## Slide 3 — Why the funded options are off the table

The usual answer is to buy our way out. ServiceNow sells compliance and continuous-authorization applications that do much of this, and identity-governance products such as SailPoint run access reviews and a lot more. Microsoft has its own governance features too. But ServiceNow's own documentation lists those compliance applications as separate subscriptions, on top of what we already pay. An identity-governance product is another purchase again, and Microsoft's features need their own licensing. If the answer on funding is no, we have two choices. We can leave the design on paper and keep doing things by email, or we can build the essential pieces ourselves on what we already own. This briefing is about the second choice, done carefully.

## Slide 4 — The no-cost path on the instance we already own

So what can staff actually build? A small application inside the ServiceNow instance we already license, using features that come with it, like its tables, scripts, workflows and test tools. It records each finding, matches it to the right asset in the configuration management database, and only closes work when a fresh check shows the fix held. What it won't do is replace a commercial product. No large-scale review campaigns, no library of connectors, no machine-learning role suggestions, no vendor support line. We should write that down up front so nobody expects more later. And we don't start from scratch. An infrastructure team that already writes its own ServiceNow scripts can lend us its conventions, its test instance and its reviewers, and we can lend ours back. Neither team approves its own work.

## Slide 5 — AI-assisted development, with guardrails

AI coding assistants can draft these scripts in seconds. The catch is that they can draft mistakes just as fast, and they sound confident either way. So the rules are simple. First, use only tools the agency has approved under its AI policy, which the Office of Management and Budget's memo M-25-21 asks every agency to have. Second, never put real data, passwords, or secrets into a prompt; we use made-up examples instead. Third, a named person reads every line before it's accepted. NIST, the National Institute of Standards and Technology, takes the same position: AI-written code is reviewed exactly like code a person wrote. And because assistants sometimes invent functions that don't exist, every platform call gets checked against the vendor's documentation. "The AI wrote it" is never a reason to accept a line.

## Slide 6 — Sandbox to production, with two gates

Here's how the code moves. It starts in a developer sandbox that holds only made-up data. ServiceNow gives developers these sandboxes free, but they belong to the vendor, so nothing real ever goes in one. Before code leaves the sandbox, a reviewer who didn't write it reads every line, and that's the first gate. Then it moves to our own test instance, where automated tests run and the results are attached. The second gate is the change advisory board, which approves the move to production like any other change. Once it's approved, someone other than the author puts it in. If a test fails along the way, the fix goes back to the sandbox and starts again. Nobody moves their own code, and nothing skips a gate.

## Slide 7 — What the standards ask, and how the path meets it

None of this is invented for the occasion. It's the standard software development life cycle that our existing security controls already expect. Changes are reviewed and approved before they're made. They're tested before they're finalized. The person who writes the code isn't the person who approves it or deploys it. And NIST's Secure Software Development Framework gives us the review and testing practices to follow, along with a companion profile written for generative AI. So walking this path means meeting requirements we already have, not taking on new ones. It also means that if an assessor asks how we control our own code, we can point to the same controls they already know.

## Slide 8 — Who writes, reviews, approves and operates

So who does what? Developers on our own staff write the code. A different, qualified reviewer approves each change. The change advisory board approves the move to production. The security officer sets the coding rules, and the agency's Chief AI Officer decides which AI tools are approved. The point is that no one person writes, approves, and deploys. And we train the people we already have rather than hiring. They start in a free developer sandbox, learn our rules before they touch real work, and pair up with experienced platform developers for their first few changes. After that, they can qualify as reviewers themselves. Every piece should have at least two people who can maintain it, so the application never depends on one person.

## Slide 9 — The evidence it produces

This is the part I most want you to see. Every gate leaves a record behind: the review and who did it, the test results, the change approval, and who deployed the change. Together, those records are the audit evidence, and we get them as a by-product of doing the work properly, not by assembling a binder before an assessment. When an assessor asks how we know our own code does what we claim, the answer is a report we can pull, not a story we have to tell. And the application's own output, its control tests and its closed findings, joins the same evidence trail as everything else. The assessor shouldn't be able to tell, or need to care, whether the code was bought or built.

## Slide 10 — Honest limits

Now the honest limits. This isn't free. It moves the cost from a license line to staff time, including retesting every time the platform is upgraded. It doesn't replace a full identity-governance product, and if our needs grow, this buys time rather than removing the need. Review is only as good as the reviewer, and AI can produce confident, wrong code, so small changes and a reviewer's right to say no really matter. The federal AI policy and the NIST guidance are both still moving, so we'll need to recheck them. And the developer sandbox belongs to the vendor, outside our boundary, so it only ever holds made-up data.

## Slide 11 — The decision: approve a small pilot

So here's the ask. Approve a small pilot in a developer instance. Made-up data only. One or two staff, trained on the rules first. An approved AI tool, and a named reviewer who isn't the author. And one component: the check that refuses to close a piece of work until a fresh read proves the fix held. The code goes into an agency repository from day one. At the end of the pilot, we come back with the code, the test results, the review records, and an honest list of what failed review. Then you decide whether it moves to our test instance, through a normal change. It's small, it's reversible, it needs no new money, and it shows you the evidence before anyone commits to more.

## Slide 12 — Where to read next

Everything in this briefing comes from Book 15, Chapter 13 of the Federal Modernization Workbook, and every source is footnoted there. Chapter 11 describes the compliance application itself, Chapter 10 covers who runs day two, and the workbook's ServiceNow example is a tested starting point for the pilot. Thank you for your time.
