# Verification — Chapter 08, The Monthly Evidence Run

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrMonthlyRun.ps1`, `Invoke-XdrMetrics.ps1`, `Invoke-XdrEvidence.ps1`, `Invoke-XdrRunAll`, `Invoke-XdrMetrics`, `Write-XdrEvidence`, `Test-XdrEvidence`, `config/requirements.json`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Control titles | Verified facts | carried (NIST OSCAL 5.2.0, read for the provider notices guide) | `xdr08-oscal` |
| 2 | KSI pairs per gate | Verified facts; config/requirements.json | carried from the guide, which carried them from Books 12 and 05 | `xdr08-ksi` |
| 3 | createdDateTime filterable | Verified facts | carried | `xdr08-incidents` |
| 4 | No time of first assignment on the Graph incident | The code | read on the list incidents page's properties for the guide; the kit reports not computed | `xdr08-incidents` |
| 5 | Lab 1 outputs (10 records, metrics, chain, production no-go, tamper caught, 20 Evidence tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/08-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
