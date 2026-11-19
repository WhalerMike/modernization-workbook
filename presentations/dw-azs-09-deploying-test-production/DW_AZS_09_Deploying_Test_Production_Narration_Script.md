# Building Azure Security, Chapter 09 — Deploying to Test and Production — narration script (practice copy)

## Slide 1 — Chapter 09: Deploying to Test and Production

Welcome to the Federal Modernization Workbook's developer workbook, Building Azure Security. This is Chapter 9: deploying to test and production. The kit reads every week and writes once, so this runbook is about the week, and about the one write. It takes the kit from the labs to a live test subscription, then to production, with the same commands and one settings file per environment. The chapter has been reviewed and approved, and nothing in it has been run against a live subscription; the output you'll see comes from fixture mode, dated November 17, 2026.

## Slide 2 — Why a runbook: read every week, write once

Why a runbook? Because the kit's weekly reads need only Reader, but it makes one write: the security initiative's assignment at the intermediate root, in DoNotEnforce, from the guide's Step 9. That write is a plan, applied only with the hash a reviewer approved, and its rollback is rehearsed in test before production. The runbook has two stages: a live test subscription, then production, with the same commands and each environment's own settings file. Between them sits the go or no-go, decided on the test stage's live evidence. None of it has been run against a live subscription yet.

## Slide 3 — Before you start

Before you start, finish Lab 2 of Chapters 1 to 8 in the test subscription, and check every unverified call's output against the portal. You need two identities. A reader for the weekly run, with Reader on the intermediate root and the tenant root group, as a managed identity or a federated workload identity, never a secret. And an operator for the plan, with Resource Policy Contributor at the intermediate root, eligible through privileged identity management and activated only for the change window, as the guide's prerequisites set out. You need PowerShell 7 and the Azure CLI on commercial Azure, output folders inside the boundary but outside any repository, and a change record for each stage.

## Slide 4 — Step 1: one settings file per environment

Step 1 writes one settings file per environment, from the kit's template, with no secrets. The command sets the environment, the tenant, the intermediate root, the platform workspace, the hub, the workload subscriptions, the required assignments, the security initiative's name, the narrowest role its policies need and its enforce-by date, the output folders and the change record. The loader refuses a placeholder left unfilled, and any key that names a secret. Test and production each get their own file, and both live outside any repository.

## Slide 5 — Step 2: preflight, PF-01 to PF-07

Step 2 is the preflight, seven checks. The settings are complete, name commercial Azure and have no placeholder. No key names a secret. The output root isn't inside the kit's own repository, which fails, or any other repository, which warns. With the live switch, the Azure CLI is on commercial Azure and signed in to the right tenant, and Resource Graph returns the subscriptions under the intermediate root. The unverified calls are allowed for the stage, or listed. And in production only, the test stage's evidence must pass its stage check. Any fail stops the stage, and the result is recorded as evidence.

## Slide 6 — Who runs each stage, with which role

Who's involved? The reader identity runs the weekly job and the preflight, with Reader only. The operator applies the approved plan, with Resource Policy Contributor activated through privileged identity management for the change window, and nothing standing. The security officer and the policy owner review the plan and its hash before anything is applied. And at the go or no-go, the security officer and the platform owner record the decision in the change record, with the open findings and their owners.

## Slide 7 — Stage 1: the first scheduled run

Stage 1 begins with the first scheduled run. One command runs every area's check into a dated run folder, computes the metrics, writes one manifest, and records an evidence record. In fixture mode, on week one of the Contoso estate, it found forty-eight findings, said this run is the baseline, and wrote evidence record 1 covering the run, all nine area steps and the metrics. In the live test, read each area's findings with its owner, and for every unverified call compare one row with the portal, as each chapter's Lab 2 does, and record the result in the change record.

## Slide 8 — Stage 1: plan, approve and apply the one write

Step 4 plans the one write. The script reads the assignments first, and plans nothing if the security initiative is already there. Otherwise its plan holds the one command from the guide's Step 9: assign the initiative at the intermediate root in DoNotEnforce, with a system-assigned identity and the narrowest role its policies need, instead of Contributor. It prints the plan's hash, and the security officer and the policy owner review both. Step 5 applies it, with the role activated for the window and the approved hash; a plan whose hash changed is refused, and fixture mode refuses to apply at all. Step 6 is the smoke test: the policy check shows the initiative is assigned. Learn says DoNotEnforce evaluates without enforcing.

## Slide 9 — Stage 1: rehearse the rollback, then week two

Step 7 rehearses the rollback in test. Plan the removal, apply it with its own hash, see the policy check notice the initiative is gone, then plan and apply the assignment again. Resources a remediation created stay until removed. In production the rollback is different: once the initiative enforces, you set it back to DoNotEnforce, back to audit, rather than removing it. In fixture mode, that plan printed the update command and sent nothing. Step 8, a week later, is the second scheduled run: it finds last week's run and compares. In fixture mode, thirteen fixed and four new.

## Slide 10 — Step 9: go or no-go, on live evidence

Step 9 is the go or no-go. One command checks the test stage's evidence folder. Go when the hashes match every file, the chain of records is unbroken, and each step the test stage needs, the preflight, the run, the nine area steps and the metrics, has a passing record from a live run. Fixture records never count, so a rehearsal can't promote anything: in fixture mode the folder's own checks pass, and every stage step fails. Then the security officer and the platform owner record the decision in the change record, with the open findings and their owners.

## Slide 11 — Stage 2: production

Stage 2 is production, with the same commands. Write production's settings file, pointing it at the test stage's evidence. Run the preflight live: its seventh check fails unless that test evidence passes. In the change window, plan, have the reviewers approve the hash, and apply only that plan. Schedule the weekly run under the reader identity in the agency's own scheduler; the first production run is the baseline, and every run after carries its comparison. Production's own evidence check adds the plan and the comparison, so it passes from the second weekly run. Switching the initiative to enforcing, remediation and exemptions are the guide's Step 9, each its own reviewed change.

## Slide 12 — The evidence the ISSO keeps

Each runbook step leaves a record the security officer keeps, mapped to NIST's controls in the kit's requirements file. The preflight supports least privilege and configuration settings. The plan supports configuration change control and impact analysis. The rollback supports change control and the contingency plan. Each scheduled run supports continuous monitoring, the component inventory and each area's own controls. The comparison supports configuration settings and continuous monitoring. And the chain of records supports continuous monitoring and the protection of audit information. The evidence supports those controls; the assessor decides. The key security indicators are FedRAMP's indicators for cloud providers, which the agency lines its own evidence up with and doesn't report.

## Slide 13 — Dangers, and the guard for each

What breaks, and what guards against it? A plan applied after it changed would send a command nobody reviewed, so applying needs the approved hash of the plan on disk. Lab evidence could start production on fixture results, so fixture records never count, and the production preflight checks the test stage. A standing write role would let the reader change the estate, so reads need only Reader and the plan's role is eligible through privileged identity management, for the window. Output in a repository would publish the register, so the preflight fails in the kit's repository and warns in any other. And removal as production's rollback would lose remediated resources and history, so production rolls back to audit instead.

## Slide 14 — Rehearse it, and done when

You can rehearse the runbook's offline half on the fictional estate: copy the test settings, point the outputs at a folder outside any repository, and run the preflight, two scheduled runs, the plan, the rollback plan and the evidence check. The plan says there's nothing to do, because the fixture estate already has the initiative. The runbook's scripts have eleven tests of their own. And here's what done looks like: the labs passed, one settings file per environment with no secrets, the plan's hash approved before anything was applied, the rollback rehearsed in test, the test stage's evidence passing before production's preflight, and the weekly run scheduled under the reader identity.
