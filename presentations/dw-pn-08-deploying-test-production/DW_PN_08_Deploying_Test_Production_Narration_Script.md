# Building Provider Notices, Chapter 08 — Deploying to Test and Production — narration script (practice copy)

## Slide 1 — Chapter 08: Deploying to Test and Production

Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 8: deploying to test and production. Each chapter's second lab proves one provider in isolation. A deployment proves them together, on a schedule, with a rollback someone has already run. This chapter is a runbook: one ordered set of copy-paste commands, run once against test and again, unchanged, against production. Three notes before we begin. The chapter is a draft, awaiting the owner's review. Nobody has run this runbook against a live tenant, account, tenancy or project. And the code is illustrative, run only in fixture mode.

## Slide 2 — Why a runbook, run twice

Why a runbook? Because each earlier lab proves one provider on its own, and production needs all of them together, every week, with a way back. So the goal is concrete. By the end you can deploy the kit to a test environment and then to production, with a change record, an approval at each write, a smoke test whose expected result is written down before you run it, evidence the security officer can check with a hash, and a rollback you've rehearsed. And for every step you can say which of the guide's seven gates it moves forward.

## Slide 3 — Which cloud, for these steps

Next, which cloud. Every command reads the cloud from the settings file, one name per provider. The estate this runbook writes for is Microsoft 365 G C C with commercial Azure, so Graph and Resource Manager are the worldwide hosts, as Microsoft Learn's national cloud page lists them. Oracle Cloud takes its commercial or government realm, AWS its commercial or GovCloud partition, and Google Cloud its global name. As a side note, G C C High and the Defense Department cloud sign in to Graph with their own environment names. Any other name throws, and a session signed in elsewhere is refused.

## Slide 4 — The order, and the only writes

The runbook doesn't decide what the gates decide. It turns them on in an order where each step can be undone before the next depends on it. Reads first, one provider at a time. Routing as a dry run before anything is sent. The one write to a cloud, the Azure alert policy, only after the reads work. And the schedule last. That order is the workbook's design guidance. Every collector call is a read. The few writes run only with an approved plan hash, or with an explicit send flag. And three things aren't in the kit: the schedule, the sign-ins, and the ServiceNow endpoint.

## Slide 5 — One settings file per stage, and its rules

One settings file per stage holds every value the commands need, and the kit checks it before any command runs. No secrets: a secret-like name with a value stops the run, and the ServiceNow token is read at run time from an environment variable. No placeholders left in an enabled provider. The file must be the stage it says it is. Each enabled provider names who receives its notices today. And moving from test to production changes the file and nothing else. To start, copy the template, fill it in, and check it: you get one line with the stage, the change record, the output folder and the file's hash.

## Slide 6 — The deploy scripts, each with a dry run

The runbook's scripts are PowerShell, like the rest of the kit, and each has a dry run. The pre-flight checks everything and changes nothing. The alert policy script plans an assignment and a remediation, and applies only with the approved hash. The scheduled run collects every enabled provider, routes, writes the digest, and records each as evidence, and it sends only when both the settings and the command say so. The rollback plans in reverse order: unregister the schedule, delete the assignment, and list what the remediation created, for the change record. Twenty-five tests cover them, all in fixture mode.

## Slide 7 — The dry run on the kit's fixtures

Before any tenant, run the whole thing on the kit's fixtures. It takes the fictional test stage end to end, then the production pre-flight with the test evidence, and nothing leaves the machine. This output is real: the kit printed it on November 9, 2026. The scheduled run collected fifteen notices from Azure, Microsoft 365 and Oracle Cloud, routed eight new tasks as a dry run, and wrote a digest with thirteen open and five needing action. The stage check found every file matching its hash, an unbroken chain, and a passing record for each step. The production pre-flight passed twenty-three checks.

## Slide 8 — The pre-flight: seven read-only checks

The pre-flight reads only, and you run it before each stage, after the readers sign in. It checks the settings and routing files, that each provider's tool is installed, that each session is signed in to the right cloud, tenant, partition or realm, and that each reader's first call works. For AWS that includes the support plan the health service needs. It checks that someone is named to receive each provider's notices, and that the output folder can be written. And in production only, the seventh check refuses to go on unless the test stage's evidence passes.

## Slide 9 — Who holds what, and who approves

Who does what? The operator runs the commands and holds no write role in any cloud except where a step says so. Each provider has its own reader with the least privilege its chapter's second lab grants: Azure, Microsoft 365, Oracle Cloud, AWS and Google Cloud. The one write role in Azure belongs to a person, activated only for the change window. Approvals are written down: the change advisory board approves each stage's change record, a reviewer who isn't the operator approves each plan's hash, and the security officer and the board approve promotion. Turning on sending waits for the change manager.

## Slide 10 — Steps 1.1 and 1.2: sign in, then the pre-flight

Stage 1 starts by signing in each enabled provider's reader, in the cloud the settings file names. For a G C C tenant that's the commercial Azure cloud and Graph's global environment. Connecting to Graph with a client ID, a tenant ID and a certificate thumbprint is app-only access, as Microsoft Learn describes it, the same sign-in the scheduled run will use. The AWS caller's identity should start with the partition's prefix. Then run the pre-flight and record it as evidence. Expected: every check passes, and the first evidence record passes. Fix any failure before going on: the detail names what's missing.

## Slide 11 — Step 1.3: staged enable, one provider at a time

Step 1.3 is the staged enable. Read each enabled provider on its own, cross-check it against the provider's own command, which each chapter's second lab gives, and record it as evidence, before the providers ever run together. Start with the one the agency relies on most: that's design guidance. Expected: each collection prints its provider's row, and its count matches the provider's own. An empty list is a valid result in a test environment. But an empty list where the provider's own command finds notices is a failure. Azure, Microsoft 365 and Oracle Cloud first; then AWS and Google Cloud where enabled.

## Slide 12 — Steps 1.4 and 1.5: route as a dry run, smoke test

Step 1.4 routes the full collection with the agency's own routing file, as a dry run. The service desk reads the payloads before anything is sent. Expected: payloads written, nothing sent; every security advisory and retirement has one, and each assignment group is one the change manager recognizes. Step 1.5 is the smoke test: four checks, each with its expected result written down before you run it. Every provider read; a second routing writes nothing new; every payload valid; and the evidence chain clean. On the fixtures, the first routing created eight tasks and the second created none.

## Slide 13 — Step 1.6: the alert policy at the test subscription

Step 1.6 is the one write to a cloud. In the test settings, the alert policy's scope is the test subscription. Read the real built-in definition first, then plan. A reviewer who isn't the operator approves the plan's hash, and the policy writer applies it with exactly that hash. Expected: both steps applied and the remediation complete. Microsoft Learn says the remediation creates a resource group holding the Service Health alert rule, with an action group that emails the subscription owners. Don't edit that rule by hand: change the assignment's parameters and remediate again.

## Slide 14 — Step 1.7: the weekly run, on a schedule

Step 1.7 puts the weekly run on a schedule. The kit doesn't register a schedule itself, so this uses Windows Task Scheduler's own cmdlets, as Microsoft Learn documents them, with the task name the rollback later removes. The scheduled run needs every reader's sign-in in its own session, so you write a small sign-in script for the run-as account, run it once by hand, then register it weekly, Monday at six. Expected: collect, route and digest each pass. One gap is stated plainly: how each other provider's tool signs in unattended is not yet specified in the kit. Then send the digest to the owners.

## Slide 15 — Steps 1.8 and 1.9: the evidence, then the rollback

Step 1.8 checks the stage's evidence: every file matches its hash, the chain is unbroken, and each step the stage needs has a passing record. Step 1.9 rehearses the rollback. Plan it, have the reviewer approve its hash, apply it and record it. Expected: the schedule unregistered, the policy assignment deleted, and the third step left manual: a list of what the remediation created, for the change record to decide on, because deleting the assignment doesn't remove those resources. Nothing else is lost; the state, runs and evidence are kept. If test keeps running, register the schedule again.

## Slide 16 — Go/no-go: promote only when every row passes

Before production comes the go/no-go, and you promote only when every row passes. The test stage's evidence passes. Every provider's collection matched its own command. The smoke test passed. The routing was reviewed, and every security advisory and retirement became a task. The alert policy was applied, and its rollback rehearsed. Every provider's notice contacts are named. And the known gaps are recorded with the security officer: Google's planned maintenance, any AWS account without a support plan, any workload in an Assured Workloads FedRAMP or impact-level package, and what the guide lists as not yet specified. The security officer and the board record the decision.

## Slide 17 — Stage 2: production, the same commands

Stage 2 is production, with the same commands and the production settings file: sending off for now, and the alert policy scoped to the management group. The pre-flight now includes the seventh check, so production refuses to start unless the test evidence passes. Enable the providers one at a time again, and keep routing a dry run for the first week, while the service desk works from the payloads by hand. Apply the alerts at the management group, schedule the weekly run, and smoke test. Turn on sending only after that week, with the change manager's approval. Each payload is sent once. Then check the production evidence every week.

## Slide 18 — Requirements, KSIs and the evidence kept

Each step ends with the federal requirements it supports, checked against NIST's control catalog, and the FedRAMP key security indicator it aligns to. Those indicators belong to the cloud providers. The agency authorizes its own system and lines its evidence up with what its providers report; it doesn't report the indicators itself, and every alignment here is the program's reading. And the evidence is produced, not only named. Every script writes a run folder with a manifest, and each is recorded in a hash chain. Each stage's evidence folder is kept on agency storage, with the change record, the plan hashes and the weekly digests beside it.

## Slide 19 — Dangers, and the guard for each

What breaks in a deployment, and what guards against it? Production before test passed puts the problems in front of the people who rely on the notices; the seventh pre-flight check refuses it. Enabling every provider at once lets one failure hide the others. Sending on day one puts duplicate or misrouted tasks in the queue. A plan changed after approval is refused by the hash. A secret in the settings file is refused outright. A scheduled run that loses a sign-in stops silently, so the weekly evidence check fails. And remediation's resources are never deleted blindly: the change record decides.

## Slide 20 — Done when: the chapter's checklist

Here's what done looks like. One settings file per stage, with no secrets, filed with the change record. The test pre-flight passed, and every provider was enabled and cross-checked one at a time. The smoke test passed. Both plans were approved by hash, applied and recorded in test. The test evidence passed, and the security officer and the board recorded the go/no-go. Production's pre-flight passed the seventh check, production routed as a dry run for a week before sending, and its evidence passes every week. That's the end of Building Provider Notices. Thanks for watching.
