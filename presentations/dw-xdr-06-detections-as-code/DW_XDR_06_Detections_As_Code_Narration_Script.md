# Building Defender XDR, Chapter 06 — Detections as Code — narration script (practice copy)

## Slide 1 — Chapter 06: Detections as Code

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 6: detections as code. A rule that can't be shown to fire isn't a control, and a rule nobody can trace to a reviewed file isn't a change anyone approved. We'll start from Learn's create, list and update calls for custom detection rules, read the repository layout, the validation, the tests against each rule's windows, and the deployment plan, and walk two labs. Publishing the plan is Chapter 9's. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.

## Slide 2 — Why a rule must fire, and trace to a file

Why treat detections as code? Two reasons. A rule that can't be shown to fire isn't a control. And a rule that nobody can trace back to a reviewed file isn't a change anyone approved. By the end of this chapter you can keep custom detections as files, prove each one fires on its known-bad event and stays quiet otherwise, and produce a deployment plan that an approver signs by its hash. It's for the developers and the detection engineer who owns this gate. The rule lifecycle itself, author, test, alert-only, promote and review, is the Security Operations book's; this chapter builds its test and its deployment.

## Slide 3 — What Microsoft Learn's three calls give you

Microsoft Learn's Graph pages give three calls. Post to create a rule, which needs read-write custom detection and the Detection tuning manage permission, or Security Administrator; the quota is ten creates a minute per application. Get to list the rules, with the read permission. And patch to update one, supplying only the properties that change. A rule has a query, a schedule, a status of enabled or disabled, and a detection action with an alert template, and optionally automated actions, like isolating devices. None of these pages has a national-cloud table, so the API's GCC availability is not yet specified. The guide's interim path is the portal, from the same file.

## Slide 4 — What the calls leave to you, and the verdict

What's left to you? Nothing checks a rule before it reaches the tenant, so the kit validates it. Automated actions in the same body could let a rule isolate devices on its own, outside the response ladder, so such a rule is held. One test window can't show a rule is both sensitive and quiet, so each rule has two. The repository and the tenant drift, so the kit plans: create, update only what changed, hold what failed, report orphans. A file marked enabled might never have been tested, so it's held. And an approved plan could change afterwards, so it carries a hash. The verdict: the API deploys anything it's given; build the gate in front of it.

## Slide 5 — The repository: two files per rule

The repository is one folder with two files per rule. The rule file is the Graph request body, in Learn's example shape. Beside it, a test file names the tables the query reads, a known-bad window that must return at least some rows, and a known-good window that must stay under a threshold. The detection check does four things. Validates each rule, including no automated actions, and that the query starts from a declared table. Tests each rule's query over both windows, through the hunting API. Reads the deployed rules. And plans: create, update only the changed properties, hold with the reason, and report orphans, never deleting them.

## Slide 6 — Who writes the rules, who signs the plan

Who's involved? The detection engineer owns this gate, writes each rule and its test file, and reviews every rule each quarter. The approver reads the plan and records its hash in the change record. And the security operations center replays each known-bad event on a ring 0 device, under a change record, as the guide's synthetic events table describes. One caution: advanced hunting keeps thirty days. A known-bad window older than that returns nothing, so keep the replay current.

## Slide 7 — Lab 1: validate, test and plan the repository

Lab 1, in the kit's folder. Step 1 reads one rule's test file: one table, a known-bad day that must return a row, and a quiet day that must return none. Step 2 validates, tests and plans. The admin-share rule fails validation: it would isolate devices on its own. It also fails its quiet day, three rows where one is allowed, so it would have been noisy too. The plan creates the LSASS dump-tool rule. It updates only the status of the encoded PowerShell rule, which is deployed disabled and now enabled in its file after a passing test. It holds the admin-share rule. And it reports a legacy rule, made in the portal and in no file, as an orphan.

## Slide 8 — Lab 1: the plan's hash, and the portal path

Step 3 reads the plan an approver signs: its hash, and the two actions, a post that creates and a patch that updates. The update's body holds the status and nothing else, because Learn's patch supplies only what changes. Step 4 runs the same repository on the interim path, with deploy via set to portal. The same plan comes out, as a sheet for the Defender portal, each rule with its file's hash. Delete what the lab made when you're done.

## Slide 9 — Lab 2: test one rule in a test tenant

Lab 2 uses a test tenant, never production. First make the known-bad event: on a ring 0 test device, under a change record, run the activity your rule detects. Then sign in with read scopes only, and run the detection check with your own rule folder, its known-bad window covering the replay. The test file should show the known-bad window passing. If listing the deployed rules fails in the test tenant, record it in the verification log and set deploy via to portal. Nothing was deployed, so you just sign out. Publishing comes in Chapter 9, with an approved hash.

## Slide 10 — Federal requirements and the evidence

Here's what this gate proves, against NIST's catalog. Each rule firing on its known-bad event and staying quiet otherwise supports system monitoring and audit review, analysis and reporting. Each change coming from a reviewed file, in a plan with a hash, supports configuration change control. And what's deployed matching the repository, with orphans named, supports both. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.

## Slide 11 — Dangers, and the guard for each

What breaks in production? A rule with automated isolation could contain a server or an emergency account by query; it's held. A rule enabled without a test is silent or noisy; it's held unless its test passed this run. A rule made in the portal can't be traced; it's an orphan. A plan changed after approval means the approver signed something else; publishing checks the hash. A renamed column makes a rule stop firing; the weekly test run catches it. And if the API isn't available in GCC, the portal path deploys the same files.

## Slide 12 — Done when: the chapter's checklist

Here's what done looks like. Every rule has a test file, with both windows inside the last thirty days. No rule has automated actions. Every enabled rule passed its known-bad test in this run. Every orphan has a decision: into the repository, or disabled from a file. And the plan's hash is recorded with the approval. Next, Chapter 7 sets what Defender may do on its own once these rules fire, and joins identity and cloud-app signals to the endpoint's. Thanks for watching.
