# Building Global Secure Access, Chapter 09 — Deploying to Test and Production — narration script (practice copy)

## Slide 1 — Chapter 09: Deploying to Test and Production

Welcome to the last chapter of Building Global Secure Access, Chapter 9: deploying to test and production. The labs proved the code on fixtures and in a test tenant. This runbook moves the rollout itself: one ring at a time, logs first, emergency access checked before anything changes, every change from a plan a second person approved, and a go or no-go from measured values. It hasn't been run against a live tenant; the output you'll see is the kit's fixture mode, run on November 17, 2026.

## Slide 2 — Why a runbook, and what comes first

Why a runbook? Because the order is the safety. Before you start: every chapter's Lab 2 has run in a test tenant, with its findings fixed or recorded. The decision records are approved for every function the ring enables. The network diagnostic setting exists. The emergency access accounts exist and have been tested, from Building Privileged Access. Microsoft's break-glass scripts for compliant network outages are staged and rehearsed. And the change record is open, because Learn treats enabling a new traffic profile as a major change for the change advisory board. Roles are activated through privileged identity management for the window only.

## Slide 3 — One settings file per environment

Step 1 is one settings file per environment, copied from the template, with every placeholder filled: the tenant, the ring, the groups, the Intune application IDs, the security profile, the workspace, the in-scope device count from Intune, the minimum versions, the acceptable-use categories, and the authentication authorities. The settings hold names and IDs only; the operator signs in as a person. The kit refuses a file with anything that looks like a secret, a test or production file with a placeholder left in it, and any cloud but GCC or global. Everything after this is the same command for both stages; only the file, the evidence folder and the tenant change.

## Slide 4 — Preflight: six checks before anything changes

Step 2 signs in to the stage's tenant, collects, and runs the preflight, which only reads. Six checks. The settings file names this stage. The collection matches its manifest and was read in the right tenant. The emergency access group is excluded from every network policy in the tenant, not just the ones in the plan. The network diagnostic setting exists, so logs come before the ring. Every function the desired state enables has an approved decision. And in production, the test stage's evidence passes. Any failure stops the stage; the pilot fixture fails the emergency check, because of the Finance policy from Chapter 6.

## Slide 5 — Who does each step

Who does what? The platform owner fills the settings, collects, plans, applies, and does the manual portal steps. A second person, from the change board, approves each plan's hash and each rollback's. The policy owner approves the decision records and the ring's desired state, and passes the enforce switch when a policy's report-only period is clean. The technical program manager runs the rings and keeps the ring record, and the service owner approves each exit. The security officer keeps each stage's evidence folder, inside the boundary. No one approves their own change.

## Slide 6 — Preflight and the rollback, fixture mode

Here's the fixture run, the fictional tenant at ring 1. The preflight passes all five test-stage checks: the right stage, a collection that matches its manifest in the right tenant, the emergency group excluded from all five network policies, the diagnostic setting, and approved decisions. Step 3 plans the rollback for the state the ring starts from, before the ring starts: three enforced policies to report-only in the guide's order, tagging off with the tenant restrictions policy kept, then the manual steps. It's reviewed, its hash filed, and it's applied only if a backout trigger fires.

## Slide 7 — Staged enable, then the smoke test

Step 4 is the staged enable. Plan the ring from its reviewed desired state, have a second person approve the hash, and apply it. Pass the enforce switch only for a policy whose report-only period was clean. Then do the plan's manual steps: assign the ring's group to each profile in the portal, and widen the Intune client assignment in the same change. Step 5 comes after the ring's exit period: collect again and run the smoke test. It runs every area's checks and the ring exit criteria. In the fixture at ring 1, a hundred checks run, none fail, every criterion passes, and the ring says go. Then run the guide's own Validate steps for the ring's group.

## Slide 8 — Roll back on a trigger; record the evidence

Step 6: backout triggers are set before each ring, for example sign-in failures above the baseline, help desk calls above the threshold, a mission application unreachable, or TLS failures above one percent. When one fires, apply Step 3's rollback with its approved hash, do its manual steps in order, and collect again so the evidence shows the state after it. In Stage 1, rehearse it once. Step 7 records every run of the stage and checks the stage's evidence. In the fixture, every file matches, five records form a chain, and each step the test stage needs has a passing record. Production also needs the telemetry step, with CISA telemetry agreed.

## Slide 9 — Go/no-go, then production ring by ring

Step 8 is the go or no-go for production. It starts only when the test stage's evidence passes, which the production preflight re-checks; the test tenant said go and the rollback was rehearsed; the policy owner approved the production records and desired state, and the change board approved the change; and CISA telemetry is agreed before ring 3 retires the VPN's web path. Step 9 repeats Steps 2 to 7 in production, one ring at a time. Its preflight takes the test evidence, and in the fixture all six checks pass. For each later ring, change the ring, use its desired state and widen the assignments. Remove a VPN route only after ten business days with no traffic on it.

## Slide 10 — Requirements, dangers, done

The stage's evidence supports impact analysis and contingency planning for the preflight, configuration change control for the plans and the ring exits, the contingency plan for the rehearsed rollback, and protection of audit information for the chain. The assessor decides the controls. The dangers: changing a ring before its logs exist, a policy that catches the emergency accounts, a plan applied that differs from the one reviewed, an improvised rollback, production before the test evidence is complete, and unattended runs of the beta API. You're done when every stage's preflight passed, the rollback was reviewed and rehearsed, and every hash was approved by someone else. That's the end of Building Global Secure Access. Thanks for watching.
