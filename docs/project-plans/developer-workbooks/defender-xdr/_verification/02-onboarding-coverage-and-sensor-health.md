# Verification — Chapter 02, Onboarding Coverage and Sensor Health

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrCoverage.ps1`, `Get-XdrDeviceState.ps1`, `Invoke-XdrCoverageCheck`, `Get-XdrCoverage`, `Get-XdrDeviceState`, `config/coverage.json`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `sc query sense`; `OnboardingState` = 1 | Start with Learn; Verified facts | carried | `xdr02-onboarding` |
| 2 | DeviceInfo columns | Verified facts | carried | `xdr02-deviceinfo` |
| 3 | Sensor health states and the 7-day inactive note | Verified facts | carried | `xdr02-inventory` |
| 4 | GCC OS support and KB4586839 | Verified facts | carried | `xdr02-gov` |
| 5 | Offboarding package expiry, no onboarding with offboarding, 180 days | Verified facts | carried | `xdr02-intune` |
| 6 | Hunting results in PascalCase and camelCase | Verified facts | read November 17, 2026 (Learn's two examples) | `xdr02-hunting` |
| 7 | Exact OnboardingStatus and SensorHealthState strings in advanced hunting | Illustrative code; Verified facts | not yet specified | research gap 2 |
| 8 | Lab 1 outputs (9 of 14, 64.3%, 5 tickets; 55 Checks tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/02-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
