# Verification — Chapter 01, Access and the Graph Read Path

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrAccess.ps1`, `Invoke-XdrAccessCheck`, `Test-XdrRoleDesign`, `Read-XdrRoleExport`, `Assert-XdrGraphContext`, the invokers, `config/calls.json`, `config/roles.json`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | List incidents: path, `SecurityIncident.Read.All`, the four roles | Verified facts | carried (guide claims log) | `xdr01-incidents` |
| 2 | GCC uses graph.microsoft.com; environment Global | Verified facts | carried | `xdr01-deployments` |
| 3 | runHuntingQuery: POST, `ThreatHunting.Read.All`, Query and Timespan, `schema` and `results` | Verified facts | re-read November 17, 2026 | `xdr01-hunting` |
| 4 | List detectionRule: GET, `CustomDetection.Read.All`, four roles | Verified facts | read November 17, 2026 | `xdr01-rules-list` |
| 5 | Unified RBAC permission groups; activation needs Security Administrator | Verified facts | carried | `xdr01-rbac`, `xdr01-rbac-activate` |
| 6 | No Graph API for unified RBAC roles is named on Learn | Illustrative code callout | not yet specified (Learn names none on the pages read); the kit reads a portal export | research gap 1 |
| 7 | Lab 1 outputs (14 checks, 3 failed; 5 calls; manifest; 23 Core tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/01-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
