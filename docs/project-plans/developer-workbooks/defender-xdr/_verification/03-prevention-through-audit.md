# Verification — Chapter 03, Prevention Through Audit

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrPrevention.ps1`, `Invoke-XdrPreventionCheck`, `Get-XdrPreventionFinding`, `config/prevention.json`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Tamper and real-time protection via Get-MpComputerStatus | Verified facts | carried | `xdr03-tamper` |
| 2 | Network protection modes; server settings; high-UDP roles | Verified facts | carried | `xdr03-np` |
| 3 | Network protection prerequisites; test site; events 1125 and 1126 | Verified facts; Lab 2 | carried | `xdr03-np-eval` |
| 4 | Controlled folder access modes 0 to 4 | Verified facts | carried | `xdr03-cfa` |
| 5 | Event action types | Verified facts | carried | `xdr03-np-hunt`, `xdr03-cfa-mon`, `xdr03-tamper-ov` |
| 6 | Get-NetFirewallProfile -PolicyStore ActiveStore | Verified facts | carried | `xdr03-fw` |
| 7 | AMRunningMode reads Normal in active mode | The code | not yet specified (kit's assumption) | research gap 3 |
| 8 | Lab 1 outputs (91 checks on 11 devices, 3 drifts) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/03-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
