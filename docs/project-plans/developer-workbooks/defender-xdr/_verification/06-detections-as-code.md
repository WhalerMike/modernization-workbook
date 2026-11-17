# Verification — Chapter 06, Detections as Code

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrDetections.ps1`, `Invoke-XdrDetectionCheck`, `Test-XdrDetectionRule`, `Test-XdrDetectionQuery`, `New-XdrDetectionPlan`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Create detectionRule: POST, permission, roles, example body | Verified facts | carried | `xdr06-create` |
| 2 | List detectionRule: GET, CustomDetection.Read.All, roles | Verified facts | read November 17, 2026 | `xdr06-list` |
| 3 | Update detectionRule: PATCH with only changed properties; status values; automatedActions | Verified facts | read November 17, 2026 | `xdr06-update` |
| 4 | No national-cloud table on the detectionRules pages | Verified facts | read November 17, 2026: not yet specified for GCC | research gap 5 |
| 5 | Create quota 10 per minute per application | Verified facts | carried | `xdr06-quotas` |
| 6 | runHuntingQuery Timespan | Verified facts | read November 17, 2026 | `xdr06-hunting` |
| 7 | No automated actions in rules | The code | design guidance (the guide's G7, the response ladder) | — |
| 8 | Lab 1 outputs (1 validation failure, tests 5 and 1, plan 1/1/1/1) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/06-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
