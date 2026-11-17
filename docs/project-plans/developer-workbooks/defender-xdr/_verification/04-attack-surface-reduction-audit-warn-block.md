# Verification — Chapter 04, Attack Surface Reduction: Audit, Warn, Block

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrAsr.ps1`, `Invoke-XdrAsrCheck`, `Get-XdrAsrReadiness`, `Get-XdrAsrDeviceFinding`, `ConvertTo-XdrOmaUriValue`, `config/asr-rules.json`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Rule modes; OMA-URI and value syntax; device groups only; known server issue; Add-MpPreference | Verified facts; Lab 2 | carried | `xdr04-configure` |
| 2 | Warn requirements; two rules without warn; Unblock approval from 4.18.26060; Microsoft's lighter position | Verified facts; callout | carried | `xdr04-overview` |
| 3 | Fourteen rules' GUIDs and action types; Win32 API rule n/a on Windows Server; PSExec and WMI with Configuration Manager | Verified facts; config/asr-rules.json | read November 17, 2026; GUIDs match Book 05 ES-005 | `xdr04-reference` |
| 4 | ASR events in DeviceEvents, throttled hourly; 30 days | Verified facts | carried | `xdr04-monitor` |
| 5 | Stage lengths 30 and 14 days; readiness rules | The code | design guidance (Book 05 ES-005, the guide) | — |
| 6 | Lab 1 outputs (36 ready, 16 held, 15 in block, 1 plan error, 1 warning, 13 device mismatches, 1 expired exclusion) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/04-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
