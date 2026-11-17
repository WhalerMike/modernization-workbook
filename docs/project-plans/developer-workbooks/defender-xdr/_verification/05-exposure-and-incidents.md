# Verification — Chapter 05, Exposure and Incidents

New material, written November 17, 2026. Code: `examples/defender-xdr` (`Invoke-XdrExposure.ps1`, `Invoke-XdrIncidents.ps1`, `Get-XdrExposureDisposition`, `Get-XdrIncidentFinding`, `config/severity.json`), built with this chapter. Product facts are the Defender XDR guide's, read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/defender-xdr-implementation.md`), unless a row says it was read again on November 17, 2026 for this workbook.

Lab 1 was run with `python scripts/kit_captures.py xdr` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is in `data/kit-captures/xdr/` and the images are in `captures/`. Lab 2 was not run against a test tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Security Exposure Management Public Cloud only | Start with Learn; Verified facts | carried | `xdr05-msem` |
| 2 | Defender Vulnerability Management in GCC | Verified facts | carried | `xdr05-gov` |
| 3 | DeviceInfo exposure columns | Verified facts | carried | `xdr05-deviceinfo` |
| 4 | TVM tables not in Sentinel | Verified facts | carried | `xdr05-tvm` |
| 5 | List incidents, $expand=alerts, createdDateTime filterable | Verified facts | carried | `xdr05-incidents` |
| 6 | Skipped-Not-Applicable is one of the ZTA kit's seven results | The code | read in examples/zta-results/config/taxonomy.json; a test pins it | kit |
| 7 | Severity windows | The code | design guidance (the guide's G6 table) | — |
| 8 | VulnerabilitySeverityLevel strings | Illustrative code | not yet specified | research gap 4 |
| 9 | Lab 1 outputs (9 CVEs, 3 exposed, 1 unowned; 7 incidents, 1 overdue, 1 untriaged, 1 unclassified) | Lab 1 | verified by running the commands as written | `data/kit-captures/xdr/05-*.txt` |

## Federal requirements and evidence

Each row is an output the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which are the guide's *Requirements and KSIs* rows; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Government cloud

GCC Moderate only. Every endpoint is `graph.microsoft.com` (Learn: GCC uses the worldwide endpoints). No other government cloud is named.

## Review gate

`review-status: pending`. Not approved here.
