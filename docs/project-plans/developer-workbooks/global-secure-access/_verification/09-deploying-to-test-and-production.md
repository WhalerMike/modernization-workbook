# Verification — Chapter 09, Deploying to Test and Production

New material, written November 17, 2026. A runbook: no labs. Its steps run the kit's entry scripts and `deploy/` scripts; the fixture-mode output shown was produced on November 17, 2026 by running the commands against `tests/fixtures/ring1` with `tests/fixtures/settings.test.json` and `settings.production.json`, on Windows 11 with PowerShell 7.6. The same sequence is a Pester test (`tests/Deploy.Tests.ps1`).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Enabling a new traffic profile is a major change | Before you start | carried (guide) | `gsa09-ops` |
| 2 | Rings, exit periods, backout triggers, VPN route removal after 10 business days | Steps 4 to 9 | the guide's Step 11 | guide |
| 3 | Portal path for profile assignments | Step 4 | carried (guide Step 4.2; Learn tutorial) | guide |
| 4 | Fixture output (preflight, rollback, smoke test, evidence, production preflight) | Steps 2, 3, 5, 7, 9 | verified by running | kit |
| 5 | Live behavior of every step | All | not run against a live tenant | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
