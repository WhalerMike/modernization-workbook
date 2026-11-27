# Data Platform and SQL Server Identity learning path — Module 10: Deploying to Test and Production — narration script (practice copy)

## Slide 1 — Module 10: Deploying to Test and Production

Welcome to Module 10, the last module of the Data Platform and SQL Server Identity learning path: deploying to test and production. It teaches Runbook R oh five, login migration and the parallel run, and the break-glass design in Appendix B of the data platform book, with Chapter 10 of the developer workbook, Building SQL Server Identity. Everything in the earlier modules ends here. Take this module after Module 9.

## Slide 2 — Why the same commands run twice, test then production

Why does this matter? This is the change itself: one instance's logins move from Windows to Microsoft Entra ID, first on a test instance, then in production. The commands are the same both times; only the settings file changes. Three rules hold it together. Nothing runs that a second person didn't approve by hash. The way back is planned before the cutover. And production's preflight refuses to start until a real test stage for the same instance is sealed in the evidence chain. In this module you rehearse that whole test stage as a dry run.

## Slide 3 — What you'll be able to do in Module 10

Here's what you'll be able to do by the end of this module, which takes about seventy minutes with the lab. You'll name what preflight checks, P F oh one to P F oh seven, and what it can't see. You'll explain how three S H A two fifty-six hashes tie the files a second person approved to the files that run. You'll walk the test stage from preflight to the seal, and say what makes it a go or a no-go. You'll explain why a dry-run stage seals only as a rehearsal, and why production preflight then fails P F oh six. And you'll name the rollback triggers, and the path when Entra can't be reached. Before you start, finish Module 9: its closure record and drift schedule run during the observation, and production's seal needs the closure record. This stage also runs Module 4's login plan and parallel run for real.

## Slide 4 — One settings file per environment, and preflight

Unit 2 starts with the settings and preflight. One settings file per environment, filled from the template and kept inside your boundary, names the instance, its snapshots, the exception registry, the reviewed mapping, the evidence chain and the break-glass group. No secret goes in it. Preflight then checks seven things. P F oh one, the settings are complete. Oh two, the cloud is Azure Cloud, the commercial cloud where a G C C Moderate tenant's Arc resources are. Oh three, the instance is in Arc-eligibility Category 1. Oh four, the mapping resolves every login. Oh five, the break-glass path is in the exception registry. Oh six, for production only, a sealed test stage for the same instance that isn't a rehearsal. And oh seven, the S A account disabled and renamed, which is a warning and doesn't stop the change. Preflight can't see the deployer's rights, so the deployer reads them after activating the role.

## Slide 5 — The plan, and the three hashes a second person approves

The plan writes three files: create dot sequel, cutover dot sequel and rollback dot sequel, each with its S H A two fifty-six. A second person reads them line by line and records the three hashes in the change record. When the deploy runs, a file that doesn't hash to its approved value is refused before anything connects, so the files that run are the files that were approved. The deployer signs in as its own Entra account, a member of the instance's Entra admin group, activated under pim for the change window only, so that sys-admin, alter any login and control server all read one. And the book's Chapter 12, What the Engine-Authentication Decision Settles, makes the parallel run required for production.

## Slide 6 — Create, cut over, and the way back

Unit 3 is the change itself. The create adds the Entra logins and users beside the Windows ones, and disables nothing, so both paths stay open for the parallel run. The parallel run is judged against its exit criteria. The rollback plan is dry-run before the cutover, so its record exists first. The cutover disables the superseded users and SQL logins and denies connect sequel to the superseded groups. It never drops anything. Then thirty days of observation follow. The rollback triggers are set before the change: any failed login on a just-disabled or just-denied login from a production application, any job or linked server failing to connect, or an application owner reporting an outage traced to the cutover. Any one stops the stage. Runbook R oh five keeps every cutover reversible: the Windows database users are still there, so the approved rollback opens the old path again at once.

## Slide 7 — Go or no-go, the seal, then production

The test stage is a go when five things hold. Preflight passed, and the deployer's rights read one, one, one. The three hashes in the change record match the files that ran. The parallel run printed cutover-ready, N of N. Thirty days of observation passed with no failed login on a disabled or denied login, and no drift row. And every deploy record says applied, not dry run. A no-go is a finding with an owner, and the stage is repeated. The seal re-hashes every run's files, refuses a stage missing a required step or with a deploy run that wasn't applied, and appends one record to the chain with the previous record's hash. Sealed with the rehearsal switch, it records a rehearsal, which production preflight never accepts. Production then runs the same steps, and its seal also needs the closure record from Module 9. When Entra can't be reached, Appendix B's path is the registered break-glass Windows group, empty by default, with every membership change alerting.

## Slide 8 — Try it: copy the settings and preflight the test stage

Try it. Lab 1 rehearses the whole test stage on the kit's example settings, as dry runs: nothing connects to an instance, and nothing runs with the apply switch. Open PowerShell 7, go to the kit's folder, and make this run's results folder. Step one copies the kit's two example settings files, test and production, into the run folder, and points their evidence chain at it, so the kit's folder stays as you unzipped it. They describe the fixtures' sequel P R D oh one. Step two preflights the test stage. Every check passes, and P F oh seven warns: the example's S A account is still enabled under its own name on day one. It doesn't stop the change. P F oh six isn't run, because it's for production only.

## Slide 9 — Try it: the audit, the Arc check and the plan

Step three runs the audit and the Arc check on the snapshots the settings name. In a real stage these are the instance's own snapshots, taken that day. The audit flags sequel P R D oh one's S A account, enabled under its own name, and a usable SQL login, and the Arc check puts sequel P R D oh one in Category 1: ready to plan the logins. Step four plans the change. It writes three sequel files: the create, with sixteen statements; the cutover, with five; and the rollback, with five. Each has its S H A two fifty-six. Those are the three values a second person approves.

## Slide 10 — Try it: approve the hashes, then dry-run the create

Step five approves the hashes. The approver re-hashes the three files after reading them, and this lab keeps each hash in a variable, as a change record would keep it. Step six dry-runs the create phase with the approved hash. Without the apply switch it connects to nothing: it checks the hash and prints the sixteen statements it would run. Create login from external provider for each Entra login, the Entra admin group added to sys-admin, then the database users and their roles. Step seven tries a hash that isn't the approved one, sixty-four zeros. The deploy stops before anything connects: re-plan and re-approve.

## Slide 11 — Try it: parallel run, rollback, then cutover

Step eight judges the parallel run on day thirty's snapshot. In the fixtures, day thirty is after the cutover, so each legacy login reads as already cut over: cutover-ready, four of four. Step nine dry-runs the rollback, before the cutover, so its record exists first. It would grant connect sequel back to the groups, and enable the superseded logins. Step ten dry-runs the cutover. Users and SQL logins are disabled, and groups are denied connect sequel. The Windows admin group leaves the sys-admin role first, because a deny doesn't bind sys-admin members. Nothing is dropped, which is why the rollback can reverse it at once.

## Slide 12 — Try it: seal the stage, then seal it as a rehearsal

Step eleven tries to seal the stage without the parallel run. The seal refuses a stage missing a step the kit's requirements file requires, and writes no record. Step twelve tries to seal the whole stage. Every step is there, but the deployments were dry runs, so the seal refuses again, and points you to the rehearsal switch. Step thirteen runs the same command with that switch. It writes the record, marked as a rehearsal, with the eight steps it sealed and no previous record, since it's the first. The record's short hash differs from run to run, because the record names this run's folders.

## Slide 13 — Try it: production preflight refuses the rehearsal

Step fourteen preflights production. P F oh one to oh five pass, as they did for test. P F oh six fails: the chain holds only a rehearsal, and production needs a sealed test stage that isn't one. Preflight says stop here, and exits with code one. Step fifteen runs the deployment tests: ten pass, none fail. Step sixteen lists your runs. There's nothing to clean up: this run's results stay in the run folder. Check your work: you can walk the test stage from preflight to the seal, and say why a wrong hash is refused before anything connects, why a dry-run stage seals only as a rehearsal, and why production preflight then fails P F oh six.

## Slide 14 — Lab 2: the real test stage, Chapter 10's Stage 1

This module has no Lab 2 of its own. The real test-instance run is Chapter 10's Stage 1, and it wasn't run by the authors: every command has run only as a dry run on the kit's example settings and in its Pester tests. You need a test instance in Arc-eligibility Category 1, never production; a deployer activated under pim for the change window only; Reader on the subscriptions to read Arc; and the tools signed in to commercial Azure. You also need a filled test settings file with no secret, a reviewed mapping, the exception registry with the break-glass group, and a second person to approve the three hashes. The run is Lab 1's steps against your test instance, with the apply switch on the create and the cutover, the parallel run and thirty days of observation, then a seal without the rehearsal switch. To back it out, run the approved rollback with apply, under its own change record and in its own run folder. Run the test stage first, read every file you approve, and keep the evidence.

## Slide 15 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 10 maps each step to NIST SP 800-53. Preflight supports A C six, least privilege, and C M six, configuration settings: keep the preflight file and its manifest, with the deployer's rights read. The plan and its approval support C M three and C M four, configuration change control and impact analysis: keep the plan, the three sequel files, and the hashes in the change record with the approver. The create and the cutover support C M three and A C two: keep each deploy record with mode applied and the hash that ran. The rollback plan supports C M three and C P two, the contingency plan: keep the rollback dry run, written before the cutover. And the seal supports C A seven and A U nine, protection of audit information: keep the chain, each record holding the S H A two fifty-six of every manifest and the previous record's hash. K S Is are FedRAMP twenty X indicators for cloud service providers: your cloud providers report against them, the agency doesn't. These records provide evidence for the change; the assessor decides.

## Slide 16 — Check yourself: two questions on the deployment

Check yourself with two questions. First: you run the create with an approved hash that isn't the one the create file hashes to. What happens? The answer is b: it's refused before anything connects. Re-plan and re-approve. Second: the chain holds only the rehearsal record. What does production preflight report? The answer is b: P F oh six fails, because there's no sealed test-stage record for sequel P R D oh one that isn't a rehearsal. Stop here. The module page has two more questions, each linked to the section that answers it.

## Slide 17 — Summary: test first, then production, by hash

To sum up. You rehearsed one instance's login migration through the test stage, from preflight and the approved hashes to the parallel run, the cutover and its rollback, and sealed it as a rehearsal that production preflight refuses. A real test stage, applied and sealed without the rehearsal switch, is what lets production start, with the same commands and a different settings file. Before shipping, work through the Chapter 10 checklist. That's the end of the Data Platform and SQL Server Identity learning path. Go back to the learning path's index for the modules and the code.
