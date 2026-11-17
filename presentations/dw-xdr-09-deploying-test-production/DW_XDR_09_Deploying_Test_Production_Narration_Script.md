# Building Defender XDR, Chapter 09 — Deploying to Test and Production — narration script (practice copy)

## Slide 1 — Chapter 09: Deploying to Test and Production

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 9: deploying to test and production. The same commands run in both stages; only the settings file changes, and production waits until the test stage's own evidence says go. This chapter is a runbook, not a gate, so it has no labs of its own. Every step is a command, and the outputs on these slides are from fixture mode on November 17, 2026. Nothing in it has been run against a live tenant, and the chapter is a draft awaiting the owner's review.

## Slide 2 — Why the same commands in both stages

Why the same commands in both stages? Because a runbook that differs between test and production isn't tested at all. Only the settings file changes, and production waits until the test stage's own evidence says go. By the end of this chapter you can take the kit to a test tenant, prove it there with evidence, and take it to production under a change record, with a rollback planned before anything is applied. The people who run the change are the platform owner with the operator, the detection engineer for the publish step, and the security officer for the go or no-go.

## Slide 3 — What the kit changes, and what a person does

Here's the division of labor. The kit reads through Graph, compares every input with its plan, writes the evidence, plans the rollback, and publishes custom detections, but only from an approved plan, with apply and the plan's hash. A person, under the change record, assigns roles through Privileged Identity Management and signs in, moves an attack surface reduction or prevention ring in Intune from the kit's values, approves the plan's hash, and changes device group levels and exclusions in the portal. Only one write is automated. Learn doesn't state the detection API's GCC availability, so if a test-tenant call fails, the portal path uses the same files.

## Slide 4 — One settings file per environment

Each environment gets one settings file, copied from the template onto agency storage. Fill every placeholder: the tenant, the output root, the groups that Privileged Identity Management governs, the emergency access groups and accounts, and every input file the earlier chapters use. No secret ever goes in a settings file: the run signs in through Privileged Identity Management, or as a managed identity. The cloud is GCC, the Graph environment is Global. Every step in this runbook has two forms: a fixture form with an environment file, which is what these slides show, and the live form, which leaves it out.

## Slide 5 — Who signs what

Who signs what? The platform owner and the operator run the pre-flight, the scheduled run and each ring change, in the change window. The detection engineer and the approver read the detection plan, and record its hash in the change record before anything is applied. And the security officer signs the go or no-go, from the test stage's own evidence. Remember: nothing in this chapter has been run against a live tenant. Every live result is written as an expectation.

## Slide 6 — Step 1: sign in and run the pre-flight

Step 1. Sign in to Graph in the Global environment, then run the pre-flight. Six checks for the test stage. The settings: the environment is the stage, every input is named and exists, and the deploy path is set. The Graph module is installed. The session is in the Global environment and the tenant the settings name. The granted scopes cover every read, and the detection write. A first read of incidents answers. And the output root is writable. Any failure stops the stage. Then record the pre-flight as evidence, with the change record.

## Slide 7 — Step 2: the first scheduled run

Step 2 is the first scheduled run. It runs every check and the metrics into a folder for the month, records each one in the stage's evidence folder with the change record, and writes a scheduled-run record of its own. In fixture mode, most checks fail, because the fixtures carry each chapter's deliberate faults. In a test tenant, each failure is a list of findings in its run folder: tickets, plan corrections, role changes. Close them before the go or no-go.

## Slide 8 — Step 3: publish the detections, dry run first

Step 3 publishes the detections, dry run first. Without apply, the script writes what it would send: a post that creates the dump-tool rule, and a patch that updates the encoded PowerShell rule's status. Then read the plan's hash. The detection engineer and the approver read the plan and record that hash in the change record. Only then run it again with apply and the approved hash. A plan that changed after approval is refused. Record the publish as evidence. Live, the script pauses after every ten creates, which is Learn's quota per application per minute.

## Slide 9 — Steps 4 and 5: smoke test, then one ASR ring

Step 4 is the smoke test. Run one synthetic event from the guide's table on a ring 0 device, under the change record: the replay behind a newly published rule's known-bad window. Within the rule's schedule, an alert from a custom detection appears. Re-run the detection check, and the plan should hold no create or update for the rules you published. Step 5 moves one ring, by hand. The change board takes ring 1's next value from Chapter 4's run, the operator puts it in the ring 1 policy in Intune, and the plan file is updated. After the devices check in, run the A S R check again, and the device checks show the new modes.

## Slide 10 — Step 6: plan the rollback before you need it

Step 6: plan the rollback before you need it. The rollback plan disables every detection rule the stage created or enabled, which is the guide's rollback for detections. And it keeps each ring's attack surface reduction value from the run before the change, so putting it back steps every moved rule back one stage. Applying it works like publishing: a dry run, then apply with the plan's approved hash. The A S R values go back into Intune by hand. And remember Microsoft's advice: an exclusion is better than a step back. A rollback is for a broken change, not one noisy rule.

## Slide 11 — The go/no-go, from the evidence

The go or no-go comes from the evidence, with one command and the test stage. In fixture mode, after steps 1 to 3: every file matches, thirteen records, chain unbroken. Pre-flight, publish and the scheduled run pass. But access, coverage, prevention, A S R and detections were recorded with their own checks failing. So it's no-go, as it should be. Go needs every row to pass: the test stage's findings closed and the checks run again, the smoke test's alert, the rollback plan filed, and the security officer's signature on the change record.

## Slide 12 — Stage 2: production, and the monthly schedule

Stage 2 is production. Its pre-flight adds a seventh check: the test stage's go or no-go must pass. In fixture mode, it refuses, naming the steps that failed. Once it passes, repeat steps 2 to 6 with the production settings, one ring at a time, in the change board's window, with the backout triggers the guide sets. The production go or no-go also needs exposure, incidents, signals, automation and the metrics. Finally, register the scheduled run inside the boundary, every four weeks, through Privileged Identity Management or a managed identity. The month's metrics, records and hashes go to the security officer.

## Slide 13 — Federal requirements and the evidence

Here's what the runbook's steps support, against NIST's catalog. The pre-flight supports least privilege, because the session holds only the needed scopes, and change control, because the change is checked before it runs. The scheduled run supports continuous monitoring. Publishing supports change control and system monitoring. The rollback supports change control and incident handling. And the go or no-go supports continuous monitoring and protecting audit information. The indicators are FedRAMP's, from the guide's rows. The records support these controls; the assessor decides them.

## Slide 14 — Dangers, and the checklist

Last, the dangers and the checklist. Production before the test stage passes: the seventh pre-flight check refuses it. A plan edited after approval: the approved hash refuses it. A session in the wrong tenant: the session check and the plan's tenant check. The detection API unavailable in GCC: the portal path, from the same files. And a rollback written during the outage: step 6 plans it before go. The checklist: both settings files filed, the pre-flight recorded, the plan's hash approved, the smoke test's alert, the rollback planned, every go or no-go row passing, the production pre-flight passing, and the first monthly package at the security officer. Thanks for watching.
