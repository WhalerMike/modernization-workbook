# Daily Checks Dashboard learning path, Module 2 — Module 2: Reading it, deploying it and keeping the evidence — narration script (practice copy)

## Slide 1 — Module 2: Read it, deploy it, keep the evidence

Welcome to Module 2 of The Daily Checks on One Dashboard: reading it, deploying it, and keeping the evidence. A dashboard's most dangerous state isn't red: it's green over a source that stopped arriving. In this module you read the workbook the way an operator should, telemetry first; deploy it the way a change should go, previewed and approved; and keep the evidence the way an assessor needs it. About forty minutes, plus a lab. The module has been reviewed and approved.

## Slide 2 — Objectives: what you'll be able to do

By the end of this module you'll be able to read each tab as attention, clear, stale, no data or link-out; explain why an empty queue over a stale source is stale; run the reachability check and read its result; deploy by an approved hash, and roll back; and say what is, and isn't, evidence.

## Slide 3 — Unit 1: reading the workbook

Unit 1: reading the workbook. Telemetry completeness comes first, because every other tab depends on its sources: a dark source is a high-severity task. Then each tab in turn, and each row that needs work becomes, or is matched to, a task with an owner. Entra Health and the I T S M queue are worked where they live. The workbook never closes a task, pages anyone, or proves a check happened. And the rule: an empty queue over a stale source reads stale, never clear. A missed probe shows yesterday's verdict, so its tab is stale too. A synchronization server or domain controller that stops sending isn't an empty list: it's a row with an old heartbeat, flagged. And the replication probe needs Enterprise Admins or equivalent to read replication, so it runs only on a Tier 0 host, or not at all.

## Slide 4 — Unit 2: deploying it

Unit 2: deploying it. What-if previews the change and makes none, and it needs the same deployment rights as the deployment itself. The plan's hash is what a second person approves, and the kit deploys nothing else; it refuses any plan that would delete. The deployer holds Workbook Contributor and deployment rights on the resource group only, for the window. Rollback is a redeploy of the previous approved plan, or a delete that removes a view and nothing else.

## Slide 5 — Unit 3: the evidence

Unit 3: the evidence. The kit records the validation, the preflight, the plan, the deployment, the reachability check and the rollback plan, each hashed and chained, with its controls and indicators. It refuses a render, with the words: a rendered view is not evidence. A screenshot of a tab isn't evidence either. And at the go or no-go, only live records count.

## Slide 6 — Who reads, who approves, who keeps

Who does what? Operators read telemetry first, then their family's tabs, and open the tasks. Security operations plans, deploys and checks reachability. A second person approves the plan's hash in the change record. And the security officer keeps the evidence folder, never a render or a screenshot. The plan and what-if support change control and impact analysis; the reachability record supports continuous and system monitoring; and the chained records support the protection of audit information. The assessor decides.

## Slide 7 — Lab 1: the morning the logs stopped

Lab 1 is in the developer workbook's Chapter 3, on a laptop with no tenant. You render the morning of November sixteenth, when the Entra diagnostic setting stopped overnight, the probe didn't run and a domain controller went silent: four telemetry rows flagged; sync, risk, emergency access, grants and admin changes all stale; and the Active Directory tab, whose sources are fresh, flagging the silent controller. Then you render the next morning, run the replication probe on a saved replication report, and check reachability. And when you try to record the first render as evidence, the kit refuses.

## Slide 8 — Lab 2, a knowledge check and the summary

Lab 2 runs the reachability check against a test workspace, then, with a change record, the runbook's first stage in a test subscription: never production, and the authors haven't run it. Two questions. On the morning the sign-in logs stopped, the risk tab returns no rows: what does it show? Stale, because its source is past its sixty-minute limit. And when the what-if shows a delete, what does the kit do? It refuses the plan: the workbook deployment never deletes. In summary: you read the workbook telemetry first, deployed it previewed and approved by hash, and kept the checks' records as the evidence, never the picture.
