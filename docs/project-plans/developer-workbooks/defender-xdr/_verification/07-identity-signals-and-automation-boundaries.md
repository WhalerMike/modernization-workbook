# Verification — Chapter 07, Identity Signals and Automation Boundaries

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrSignals.ps1`, `Invoke-XdrAutomation.ps1`, `Invoke-XdrSignalsCheck`, `Invoke-XdrAutomationCheck`, `config/ladder.json`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AlertEvidence and AlertInfo join | Verified facts | carried | `xdr07-alertevidence` |
| 2 | Cloud Apps GCC roadmap items | Verified facts | carried | `xdr07-mdca` |
| 3 | BehaviorInfo not for GCC | Verified facts | carried | `xdr07-schema` |
| 4 | The five levels; exclusions; device group exclusion affects AIR | Verified facts | carried | `xdr07-exclusions` |
| 5 | Full recommended; Contain User sensor 10.8470; roles to change device groups | Verified facts | carried | `xdr07-disruption` |
| 6 | All actions can be undone | Verified facts | carried | `xdr07-overview` |
| 7 | Attack disruption GCC availability | Verified facts | not yet specified | research gap 6 |
| 8 | Portal click path to the Device groups page | Lab 2 | not re-read for this chapter | research gap 7 |
| 9 | Ladder mapping | The code | design guidance (the guide's G9) | — |
| 10 | Lab 1 outputs (3 users, 1 emergency; 1 group off ladder, 1 lapsed, 1 emergency not excluded, 1 old sensor) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/07-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
