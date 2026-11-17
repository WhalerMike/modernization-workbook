# Verification — Chapter 09, Deploying to Test and Production

New material, written November 17, 2026. Code: `examples/defender-xdr` (`deploy/XdrDeploy.psm1`, `Test-XdrPreflight.ps1`, `Invoke-XdrScheduledRun.ps1`, `Publish-XdrDetections.ps1`, `Invoke-XdrRollback.ps1`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

The runbook's steps were run in fixture mode with `deploy/tests/fixtures` on November 17, 2026; nothing was run against a live tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Create quota 10 per minute; the pause after 10 creates | Step 3 | carried | Chapter 06 `xdr06-quotas` |
| 2 | detectionRules GCC availability; the portal path | What changes | not yet specified | research gap 5 |
| 3 | Fixture-mode outputs (pre-flight, scheduled run, dry run, plan hash, rollback plan, go/no-go, PF-07) | Steps 1 to 6; go/no-go; Stage 2 | verified by running the commands in fixture mode on November 17, 2026 | `deploy/tests/Deploy.Tests.ps1` |
| 4 | Live behavior | All steps | not run against a live tenant | — |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
