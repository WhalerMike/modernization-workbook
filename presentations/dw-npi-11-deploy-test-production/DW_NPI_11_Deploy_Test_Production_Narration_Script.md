# Building Non-Person Identity, Chapter 11 — Deploying to Test and Production — narration script (practice copy)

## Slide 1 — Chapter 11: Deploying to Test and Production

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 11: deploying to test and production. Each chapter's second lab proves one piece in a non-production tenant. This runbook proves them together, in an order that can be undone: first in a live test environment, then, unchanged, in production. We'll see the safe order, the settings file, the code, the evidence, who does what, a dry run, both stages and the dangers. One note: nobody has run this runbook against a live tenant. The output you'll see comes from the kit's fixtures.

## Slide 2 — A deployment proves the pieces together

Why a runbook? Because each second lab proved one piece on its own. A deployment proves them together, against an environment someone depends on. Stage 1 is a live test: an Entra test tenant, an Azure test subscription and an Active Directory test forest, with production's licenses. Stage 2 is production, a separate tenant, so nothing the test stage does can reach it, and its preflight won't start unless the test smoke test passed. The commands are the same both times; only the settings file changes.

## Slide 3 — The safe order: what can be undone comes first

The order follows the implementation guide's gates and what Microsoft Learn says each control can and can't break. First, inventory and owners, which only read. Second, the app management policy, on a pilot app and the synthetic one. It has no report-only mode, but it refuses only a create or update that breaks it, so an existing secret keeps working. Third, a federated credential and a managed identity beside the pilot's old secret, for a thirty-day parallel run. Fourth, a group managed account, once the root key has replicated. Last, Conditional Access for workload identities, in report-only mode.

## Slide 4 — One settings file per stage, and no secrets

One settings file per stage holds every value the commands need: the tenant, the cloud, the identities, the operators, the pilot, the synthetic objects, the policies and the rings. Before any command runs, the kit checks it. A secret, or anything that looks like one, stops the run, and so does a placeholder nobody replaced. The pilot's owner can't be an operator. The file must be for the stage you're running, and the smoke-test group managed account must follow the standard. Reads sign in as an app with a certificate, writes as a person, and nothing uses a secret.

## Slide 5 — The code this chapter adds: six scripts

The runbook's own code is six PowerShell scripts in the kit's deploy folder. The preflight runs eleven checks and snapshots what the rollback restores. The smoke test runs seven checks on the synthetic objects, and its only write is a probe that should be refused. The rollback is planned, then applied only with its approved hash, and it never deletes. One script builds the smoke-test group managed account's plan for Chapter 6 to apply. The last two record and check the evidence. Every script has a fixture mode that sends nothing anywhere, and there are sixty tests.

## Slide 6 — The smoke test: expected results written first

The smoke test proves the deployment end to end on objects nobody depends on, and you write each expected result down before it runs. The synthetic app must appear in the register with two owners and no secret. The synthetic service account must be rated high. A new secret on the synthetic app must be refused, and if it isn't, it's removed at once. The federated credential must match exactly. Each workload policy must be report-only, with the synthetic assigned directly. The sign-ins must show the report-only results, from a beta read. And the test host must retrieve the group managed account's password.

## Slide 7 — Requirements, KSIs and the evidence folder

Each step ends with a table of the requirements it supports: NIST SP 800-53 controls at the FedRAMP Moderate baseline, plus OMB M-22-09 and CISA's SCuBA baselines where they apply, the FedRAMP twenty X K S I it aligns to, and the evidence the security officer keeps. That evidence is produced, not only named: each script writes a record with the command, the result, the controls, the K S I's and every file's hash, and one script checks every row. K S I's belong to cloud providers, and the assessor decides each control.

## Slide 8 — Who runs each step, and who approves it

Who does what? Every write is a person's, with a role activated through Privileged Identity Management for the change window, and the change record number as the reason. The identity engineer prepares the stage and runs the policy and credential steps. The Conditional Access administrator runs the workload policies and the rollback. The server and Active Directory engineer installs the group managed account, which the pipeline creates. A reader app with a certificate does the reads. And each write has an approver: the change board, the governance officer, the pilot's owner, a second reviewer, and the CISO for each ring.

## Slide 9 — Dry run: the test preflight and the gMSA plan

Now the dry run, the chapter's own commands on the kit's fixtures, run on November twenty-first in a scratch copy of the kit. Nothing leaves the machine. The test preflight prints twelve passes and one warning. The settings file is clean, the deployment identity uses a certificate, the Workload ID Premium license is there, the baseline is recorded, and the test host and its group exist. The warning is deliberate: the fixture's Conditional Access administrator holds a standing role, not one eligible through PIM. Then the group managed account plan: one outbound-only account, run by the pipeline, with its SailPoint request and change record.

## Slide 10 — Dry run: the smoke test and the rollback

The smoke test prints eight passes: the seven checks, with the policy check run once for each workload policy. The synthetic app has two owners and no secret. A new secret is refused, though that error is the fixture's own, since Learn doesn't give the real one. The sign-ins show the report-only results. And the test host can retrieve the group managed account's password. Then the rollback is planned from the preflight's snapshot: seven actions, including the synthetic objects' cleanup, and none of them a delete. Applied with its hash but without the apply switch, it's a dry run.

## Slide 11 — Dry run: promotion and the evidence check

Production's preflight runs against a fictional production tenant, with the test stage's smoke test as its evidence. Fourteen passes. The Conditional Access administrator is now eligible through PIM, and check eleven, production only, says the test smoke test passed eight of eight in another tenant. Then the evidence check on the test stage says no-go, and that's right for a dry run. Steps 1.1 to 1.5 record their evidence only against a real tenant, and a dry-run rollback records dry run, which the go/no-go doesn't accept. A rollback applied with the wrong hash sends nothing. And the deploy tests: sixty pass.

## Slide 12 — Prepare, preflight, then Steps 1.1 to 1.3

Stage 1 starts by preparing: the group managed account's retriever group with the test host in it, and the synthetic objects, an app with two owners and a federated credential, and a service account whose random password nobody records. The pilot's policy is created, turned off. The preflight records the validation kit's baseline, checks one to ten; check ten, for AWS GovCloud and O C I, doesn't apply in this Entra runbook. And it checks the root key is more than ten hours old. Step 1.1 reads every identity and its owners. Step 1.2 turns the pilot policy on for just two apps, and plans the tenant-wide one for review. Step 1.3 moves the pilot to a federated credential and a managed identity, beside its old secret.

## Slide 13 — Steps 1.4 and 1.5: a gMSA, then workload policies

Step 1.4 puts a group managed account on a test host, and it isn't made by hand: it goes through Chapter 6's approved plan, and the pipeline applies it with the reviewed hash. In the test forest only, before the pipeline exists, a person may send it instead. On the host, Test A D Service Account must print true. Step 1.5 creates the workload policies. Microsoft Learn says they cover only single-tenant service principals, assigned directly, with block as the only control. Chapter 8's script creates every one report-only.

## Slide 14 — Steps 1.6 to 1.8: smoke test, evidence, rollback

Step 1.6 is the smoke test. The synthetic app signs in twice through a GitHub workflow, once from outside the egress range and once from inside. Both succeed, because the policies are report-only. After fifteen minutes, so the sign-ins reach the log, the smoke test runs. Step 1.7 hashes the evidence folder, which says no-go until the rollback is done. Step 1.8 rehearses that rollback, which disables and never deletes. Then you deploy again, and the second smoke test becomes the evidence production's preflight needs.

## Slide 15 — Promotion: nine go/no-go criteria, each signed

Production starts only when nine criteria are signed. The test smoke test passed every check, after the rollback and re-deployment. The rollback was rehearsed and filed. Every hash in the evidence folder matches. Fourteen days of report-only sign-ins were reviewed, with no unexpected failure from inside the egress range. The tenant-wide policy plan was approved. Production's settings, licenses and PIM eligibility are in place. The change record is approved. And the evidence check passes.

## Slide 16 — Stage 2: production, one ring at a time

Stage 2 runs the same commands with the production settings file. The preflight passes only with the test smoke test's evidence from another tenant. Steps 1.1 to 1.5 run unchanged, then the tenant-wide app management policy goes on, with its approved hash. On day thirty-one, the pilot's legacy account is disabled, never deleted. Conditional Access is then enforced one ring at a time, each after fourteen days of sign-ins and the CISO's decision. The smoke test now expects the outside sign-in to be blocked, with the message Microsoft Learn gives. For a week, the drift run checks daily, and a ring that blocks the wrong thing goes back to report-only.

## Slide 17 — Dangers, and the guard for each

Each danger has a guard. The kit refuses a secret in the settings file, and a test file run against production. An app management policy has no report-only mode, so the scope is the safety. The probe's secret, if it gets through, is removed at once. No workload policy is enforced before its sign-ins are read. A group managed account waits ten hours for the root key. The rollback is rehearsed and recent. And disabled isn't revoked: tokens already issued keep working until they expire.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. The change record is approved, the settings file holds no secret, and the preflight said go. In test, the pilot policy covered two apps, and the old secret and legacy account were kept through the parallel run, then disabled, never deleted. The group managed account came through Chapter 6's plan, and every workload policy started report-only. The smoke test passed, and the rollback was rehearsed. Every criterion was signed, production rings went one at a time, the first week's drift was clean, and every evidence folder checks.
