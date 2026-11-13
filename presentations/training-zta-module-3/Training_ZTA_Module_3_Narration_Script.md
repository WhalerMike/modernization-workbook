# Zero Trust Assessment learning path — Module 3: From results to a closure register — narration script (practice copy)

## Slide 1 — Module 3: From results to a closure register

Welcome to Module 3 of The Zero Trust Assessment as Evidence: from results to a closure register. In this module the guide's results kit does the mechanical part. It normalizes every result, lists what didn't run with what to do about it, and writes a closure-register entry for each finding, routed and weighed. People do the rest, and the register shows where. It covers Steps 7 and 8 of the Zero Trust Assessment implementation guide, and takes about fifty-five minutes, most of it in Lab 1.

## Slide 2 — Why: "17 failed" can't be acted on

Why does this matter? A report that says seventeen failed can't be acted on. Someone has to decide which of those are real findings, who owns each one, which page in the workbook remediates it, what comes first, and which are accepted for now, and by whom. The results kit does the mechanical part. It normalizes every result. It lists what didn't run, with what to do about it. And it writes one closure-register entry for each finding, routed to a page and weighed. People do the rest: the owner fills their entries, writes why a finding is weighted as it is, and someone with the authority decides closure. The register shows exactly where each of those lands.

## Slide 3 — What you'll be able to do in Module 3

Here's what you'll be able to do by the end of this module. You'll normalize a Zero Trust Assessment export and read its counts by result and by pillar. You'll work the dispositions for results that are neither a pass nor a finding. You'll record the review of an investigate result. You'll read a closure-register entry and say what's filled, what a person fills, and who decides closure. And you'll route a finding to its family's remediation page, and check an exception's approver. You need Module 1, and Module 2's Lab 2 for this module's Lab 2. In Unit 2 you'll read two chapters of Zero Trust and Assessment: Close Before You Assess, for the finding families, and Evidence, Not Verdicts, for the closure chain.

## Slide 4 — Unit 1: normalize every result, then dispose of the rest

Unit 1 normalizes and disposes. The kit writes each result twice: the tool's status and the normalized one. It never copies the tool's result text, because that text can name tenant objects. Everything that is neither a pass nor a finding lands in a dispositions file, with what to do about it. A skip for licensing needs a licensing decision. A skip because a service was disconnected, or a result the kit is unable to evaluate, needs a fix and a re-run, or a check by hand. A skip as not applicable needs a recorded reason, and not supported is flagged as a boundary finding. One more guard. If the export comes from a version the kit's taxonomy wasn't reviewed for, or carries a status or reason it doesn't know, the kit says so. It counts that result as unable to evaluate, rather than guessing.

## Slide 5 — Unit 2: one register entry per finding

Unit 2 opens the closure register. Every finding gets one entry, with the fields of the closure chain from Evidence, Not Verdicts: the finding and the tool version, the attack path, the owner, the dependencies, the change, the pilot, the enforcement, the test, the evidence, the residual risk, the reassessment, the weighting, and the closure decision. The kit fills what it knows from the tool and the family table, and leaves placeholders for what a person decides. And it never marks a finding ready for closure. The authorizing official decides that for a plan of action and milestones item, and the assessor for an assessment finding. The register records who decided.

## Slide 6 — Routing: each finding family to the page that fixes it

Each test I D routes to a finding family, and each family to the page in the workbook that remediates it. The table is from Close Before You Assess, with the evidence the guide adds for when a finding is ready for closure. Emergency access goes to Access and Privilege, and is ready when the sign-in alert fired on a test sign-in. Standing privilege goes to its PIM chapter, and is ready when no permanent active assignment sits outside the exception register. Device compliance goes to Devices and Endpoints, ready when a noncompliant test device is refused. Application secrets go to Governance, Drift and Evidence. DDoS and web application firewall findings go to the Azure Security Engineering guide. A finding no family covers is unrouted, and goes to the Zero Trust program lead. In release three point one point oh, the email and collaboration threat-protection tests have no family yet, so they stay unrouted and visible.

## Slide 7 — Weigh the finding, then check each exception's approver

Two more parts of Unit 2: weighing and exceptions. The kit sets a default priority: severity divided by effort, in buckets P one to P four. That's design guidance, in the kit's taxonomy file. Then the owner weighs each finding on six factors from Evidence, Not Verdicts: exploitability, blast radius, exposure, compensating controls, effort and dependency order. The owner writes the rationale into the entry. The register also lists each family's dependencies, so a Conditional Access finding waits for emergency access to be right. Exceptions follow the same rule as ScubaGear's omissions. An exception with an expiry is the see-so's decision. One without an expiry is a standing risk acceptance, and only the authorizing official can approve it. The kit checks each one, and marks it a governed exception, a lapsed acceptance, or a wrong approver.

## Slide 8 — Try it: normalize the first run, read what didn't run

Try it. Lab 1 normalizes and registers two fictional runs of a Contoso tenant, two weeks apart. Step one normalizes the first run. Thirty-three tests: eight pass, seventeen fail, one planned, two skipped for licensing, one disconnected, two not applicable, and two unable to evaluate. Seventeen findings, one of them investigate. The tool marked sixteen failed; the investigate result makes seventeen. The eight that are neither pass nor finding are in their own columns. Step two reads the dispositions. Two skips for licensing, two not applicable, one disconnected, one planned. And two unable to evaluate: test two four five four eight ended in error, and four one oh five oh timed out. Both of those are a run to fix, not a control to fail. The slide leaves out the written-to line and the table's underline; the page shows them.

## Slide 9 — Try it: write the register and read its top rows

Step three writes the register for the first run: seventeen findings, three in P one, ten in P two, four in P three. And a warning: test four one oh three two is unrouted. That's the Safe Links test, which has no finding family, so the program lead routes it. Step four reads the top five rows. Two device compliance findings, owned by endpoint engineering. A DDoS and web application firewall finding, owned by the platform team. The unrouted Safe Links finding, owned by the Zero Trust program lead until it's routed. And an application secrets finding. Look at two one eight three seven. It's the investigate result, and its severity is weighted down, so it ranks below other high-risk findings of the same effort until a person confirms it. Every finding has an owner, even the one nobody has claimed yet.

## Slide 10 — Try it: the second run, a review and two exceptions

Steps five and six take the second run, two weeks later. The reviews file holds one row: endpoint engineering confirmed the investigate result, two one eight three seven, on November eleventh, with a note on why. The kit normalizes the second run with that review: thirty-four tests, fifteen findings. The exceptions file holds two rows. The first, on two five five three three, was approved by the see-so, with an expiry at the end of January, 2027: a governed exception. The second, on two one eight eight five, was approved by the I S S O, with no end date. The kit marks it a wrong approver. An exception with no end date is a standing risk acceptance, and only the authorizing official can approve it. So the register warns, and that exception goes back to be fixed.

## Slide 11 — Lab 2: register your test tenant's export

Lab 2 runs the same steps on the export from Module 2's Lab 2, on the assessment host. The authors haven't run it. You replace the report folder with Module 2's, and the reviews and exceptions files with your own copies of the kit's two templates, filled for your test tenant. Step one normalizes the export and lists the dispositions. Step two writes the register, with your exceptions. Step three is a comparison by eye: open the report's pillar tabs. Every failed and investigate test should have a register entry, and no skipped test should. Note any unrouted test for your program lead. Step four backs it out. The outputs hold your test tenant's results, so delete them when you finish Module 4.

## Slide 12 — The federal requirement and evidence for Module 3

The federal requirement, in NIST special publication eight hundred fifty-three, revision five. C A two, C A seven and C M six: results normalized and counted honestly. The evidence is the normalized results, the summary, the dispositions, and the reviews file. C A five, the plan of action and milestones: each finding's planned remediation, evidenced by the register, in jay-son and C S V. And R A seven, risk response: findings weighed against risk tolerance, and exceptions approved by the right official. The evidence is the weighting rationale and the exceptions file. For C A five and R A seven, no key security indicator is listed: the mapping in Governance, Drift and Evidence pairs none with them. The evidence supports the controls; the assessor decides.

## Slide 13 — Check yourself: two questions on Module 3

Check yourself with two questions. First: who marks a register entry ready for closure? The answer is c: the authorizing official, for a plan of action and milestones item, or the assessor, for an assessment finding. The kit never does, and the register records who decided. Second: an exception has no expiry, and was approved by the see-so. What does the kit report? The answer is b, a wrong approver. With no expiry it's a standing risk acceptance, and that's the authorizing official's decision. The module page has three more questions, each linked to the unit or lab step that answers it.

## Slide 14 — Summary: a register that routes every finding

To sum up. You normalized two runs and worked their dispositions. You recorded the review of an investigate result. You opened a closure register, routed to the pages that remediate each family, with a default weighting the owner refines. And you checked exceptions against their approvers. The evidence an I S S O keeps from this module: the normalized results and summary, the dispositions, the reviews and exceptions files, and the register. Keep the out folder from Lab 1. Module 4, reconcile, re-run and keep the evidence, compares these two runs, and seals them.
