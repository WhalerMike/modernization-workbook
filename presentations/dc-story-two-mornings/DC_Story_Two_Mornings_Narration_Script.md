# Building the Daily Checks Workbook — Two Mornings — Two Mornings, One Workspace — narration script (practice copy)

## Slide 1 — Two Mornings, One Workspace

Welcome to the story deck for Building the Daily Checks Workbook. Instead of four chapters one at a time, we'll follow one fictional workspace, for contoso dot example, through two mornings: November sixteenth, 2026, when something quietly broke overnight, and the next morning, when it was fixed. Every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. The workbook is a draft awaiting the owner's review, and the code is illustrative, tested against fixtures.

## Slide 2 — The operator's morning, before the workbook

Here's the route. The operator runbook asks for ten daily checks, most done one portal at a time, and a quiet portal looks just like a broken feed. Scene one turns ten checks into ten tabs. Scene two catches an export someone edited in the portal. Scene three is the morning of November sixteenth, when the sign-in logs stopped overnight. Scene four is the next morning, and what the empty queues were hiding. Scene five tries to file the picture as evidence. And scene six deploys it, the same way twice.

## Slide 3 — Scene 1: ten checks, ten tabs

Scene one. The kit's manifest gives each daily check one row, and the workbook one tab. Eight tabs read tables in the Sentinel workspace. Two are link-outs. Entra Health's alerts live in the admin center and in e-mail, not in Log Analytics, and their G C C availability is not yet specified, so the tab sends the operator there instead of pretending. And the catalog tasks live in the I T S M tool. Two more tabs are partial: grants, and the log review queue.

## Slide 4 — Check 1: what does an empty tab prove?

Check one. The risk tab's query returns no rows. What has it proved? A: nobody is at risk. B: only that its query returned nothing, which means something only if its source is fresh. Or C: that I D Protection is turned off. Hold your answer; the next scenes answer it.

## Slide 5 — Scene 2: an export edited in the portal

Scene two, before any morning. Someone edited the workbook in the portal and exported it. The validator finds four edits: a risk query that reads a workspace path instead of the parameter, a devices query that now looks back thirty days, a grants tab that lost its banner, and a subscription path in the file. Microsoft's own advice is to mask the I D's an export embeds; the kit's check simply fails them. Remember the banner. It says the workbook is a view, not evidence.

## Slide 6 — Who reads which tab each morning

Who reads the workbook? Security operations reads telemetry completeness first, and opens a high-severity task for each dark source. Identity operations reads the sync probe, risk, emergency access and grants tabs. Device support works the noncompliant devices in Intune and the I T S M tool. The data platform operators triage D L P alerts in Purview or the Defender portal. And the security officer reads nothing on the workbook at all: they keep the records, never the picture.

## Slide 7 — Scene 3: the morning the logs stopped

The answer to check one is B: an empty tab proves only that its query returned nothing. Scene three: November sixteenth. At ten past five the evening before, the Entra diagnostic setting stopped, and this morning's probe didn't run. Telemetry flags four rows: three dark tables and a failing connector. And look at risk, emergency access, sync and grants. They're not clear. They're stale. On a plain dashboard, the risk and emergency access tabs would have shown two calm, empty queues.

## Slide 8 — Try it: render the first morning

Try it. From the kit's folder, render the first morning, then read what the risk tab's query returned. No rows at all. But its source, the sign-in logs, last arrived at ten past five the evening before. Shown as a quiet queue, this is the morning a risky sign-in goes unseen.

## Slide 9 — Scene 4: what the empty queues were hiding

Scene four: the next morning. The diagnostic setting is back, and telemetry is clear. Now the queues show what they were hiding. One user at high risk. One emergency access sign-in, which turns out to be the quarterly validation drill, and the review records it as a drill. And one synchronization conflict. Grants and D L P alerts are clear, and this time clear means something, because their sources are fresh.

## Slide 10 — Check 2: can the render be the evidence?

Check two. The first morning's render shows exactly what went wrong. Should it go in the evidence package? A: yes, it's a dated picture of the problem. B: yes, once a second person signs it. Or C: no; record the checks' own output, like the reachability check. The next scene shows what the kit does.

## Slide 11 — Scene 5: a refused render, a kept record

The answer is C. Scene five. The kit refuses to record the render: a rendered view is not evidence. Instead it records the reachability check, which asked the workspace for each table's newest record. Its result is Fail, and that's the point: the record keeps what the check found, tagged with continuous monitoring and system monitoring and their indicators. A failing record is evidence of the gap; a screenshot is only a picture of it.

## Slide 12 — Scene 6: test, then production, by hash

Scene six. The workbook goes to a test subscription, then production, with the same commands and a different settings file. The plan previews the change with what-if, which predicts and changes nothing; on the fixtures it predicts one create, a single workbook. A second person approves the plan's hash, and the kit deploys nothing else, and never a plan that would delete. Production waits until the test stage's evidence passes. That's the story: ten checks on one page, a picture the operator can trust only because the records behind it are kept.
