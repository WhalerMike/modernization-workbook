# Building the Daily Checks Workbook, Chapter 04 — Deploying to Test and Production — narration script (practice copy)

## Slide 1 — Chapter 04: Deploying to Test and Production

Welcome back to Building the Daily Checks Workbook. This is Chapter 4: deploying to test and production. The same commands twice, with a different settings file, and a record of each step in between. It's a runbook, not a lab: it runs Chapters 2 and 3's scripts and the kit's deploy scripts. The output you'll see comes from the kit's fixture mode, on November sixteenth, 2026. Nothing here has been run against a live subscription, and the chapter has been reviewed and approved.

## Slide 2 — Why the same commands twice

Why treat a dashboard like this? Because it's still a change to the estate, and an unreviewed change is exactly what the rest of the workbook guards against. So every deployment is previewed with what-if, which predicts the change and makes none. A second person approves the plan's hash, and the kit deploys nothing else. And every step leaves a hashed, chained record. One rule holds throughout: the workbook itself, and any screenshot of it, is never on the evidence list.

## Slide 3 — What the stages hold

Here's what a stage holds. Preflight runs six checks. The validation records the template's checks and its hash. The plan writes the parameters, the what-if result and the plan file. The deployment writes its result beside the approved plan. Reachability records each table's age. The rollback plan is written before it's needed. And the evidence step records each folder, hashed and chained.

## Slide 4 — Who deploys, approves and reads

Who does what? The deployer needs Workbook Contributor, which can save shared workbooks, and deployment rights on the resource group, because a Resource Manager deployment and its what-if both need them. Both are granted through privileged identity management, for the deployment window only. A second person reads the plan and approves its hash. The reachability check needs only Log Analytics Reader. And readers need Workbook Reader and their own access to the data, because a workbook shows only what its reader can already query.

## Slide 5 — Plan, with what-if

Step 4 is the heart of it. The plan writes this environment's parameters, the workspace and the parameter values the template leaves empty, then runs what-if and prints the create command and the hash to approve. In fixture mode, on November sixteenth, it predicts one create: a single workbook. A first deployment shows one create, and a redeploy shows a modify of the same workbook. Anything else, and any delete, stops the stage. Then a second person reads the plan and the what-if result, and records the hash in the change record.

## Slide 6 — Deploy only the approved plan

Step 6 deploys, and only the approved plan. Without the Apply switch, the command prints what it would run and changes nothing. With it, it deploys. And it refuses a plan folder that changed, a hash that isn't the approved one, a plan with no what-if or with a delete, and a plan that wasn't made against the live environment. Step 7 is the smoke test, in the portal: open the Daily checks workbook under the test workspace, check that the twelve tabs open with the banner, and that the telemetry tab lists every expected table.

## Slide 7 — Reachability, rollback plan and evidence

Step 8 runs the reachability check against the test workspace. Step 9 plans the rollback before you need it. Step 10 records each folder as evidence. Then the go or no-go: the stage is a go when every file matches its hash list, the chain is unbroken, and the preflight, validation, plan, deployment and reachability each have a passing live record. Fixture records never count. A no-go is a finding with an owner, and the stage is repeated after the fix.

## Slide 8 — Production, rollback and day two

Production runs the same commands with the production settings file. That file names the test stage's evidence folder, and the preflight refuses production until that evidence passes. There are two ways back, both planned in advance. Redeploy the previous approved plan when the content is wrong; its hash is already approved. Or delete the workbook when it shouldn't exist. Deleting it removes a view only: no log data, alert rule or task changes. And on day two, a portal edit comes back as an export, is validated, and replaces the template through review before it's redeployed. When a synchronization server or domain controller is added or retired, its settings list changes and the workbook is redeployed: a retired server left in the list shows as a silent one every morning.

## Slide 9 — The replication probe, on a Tier 0 host

The Active Directory tab reads replication from the probe's table. The probe reads the directory and changes nothing in it, but Microsoft names Enterprise Admins, or equivalent, as the minimum to read forest-wide replication status. So it runs only as a Tier 0 identity, on a Tier 0 host, each morning, and only where the Tier 0 owner approves it. The first command writes the probe's file without sending; read it. The second sends it, as an identity that can only publish to the probe's collection rule. A failing link is a finding, not a failed deployment. Without approval, skip it, and remove the replication table and query through a reviewed change, rather than read an empty list as healthy.

## Slide 10 — What each record supports

Here's what each record supports. Preflight supports least privilege and configuration settings. The validation supports the baseline and change control. The plan and its approval support change control and impact analysis. The deployment supports change control and the baseline. Reachability supports continuous monitoring and system monitoring. The rollback plan supports change control and the contingency plan. The replication probe's record supports continuous and system monitoring. And the evidence step supports continuous monitoring and the protection of audit information. The records support these controls; the assessor decides them. Thanks for following the four chapters; the workbook itself remains a view, and the records are the evidence.
