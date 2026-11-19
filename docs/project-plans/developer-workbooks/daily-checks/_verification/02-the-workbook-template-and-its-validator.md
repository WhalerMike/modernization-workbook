# Verification — Chapter 02, The Workbook Template and Its Validator

New material, written November 18, 2026. Code: `examples/daily-checks-workbook` (new in this change). Every Microsoft fact was read on Microsoft Learn that day with WebFetch (the Learn documentation service wasn't available to this session); facts carried from the guide rely on its verification log (`docs/books/guides/_verification/daily-checks-dashboard-implementation.md`), and facts from the books are cited by link.

Lab 1 was run with `python scripts/kit_captures.py dc` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 18, 2026; the captured output is in `data/kit-captures/dc/` and the images are in `captures/`. Lab 2 was not run.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Learn facts in this chapter | verified Nov 18, 2026 | dc02-arm (Gallery Template and ARM template tabs; instance properties; serializedData shape; mask embedded sensitive values); dc02-ref (2023-06-01; kind shared only; required properties); dc02-sources (Logs (Analytics) data source); dc02-clouds (Sentinel workbooks GA in Azure commercial) |
| 2 | Kit behavior and lab output | verified by running the kit and its tests | `data/kit-captures/dc/`, `examples/daily-checks-workbook/tests`, `deploy/tests` |
| 3 | Lab 2 behavior | not run | — |
| 4 | Design guidance (tab fit, freshness limits, render rules, stage steps) | the program's position, labeled | `config/manifest.json`, `config/requirements.json` |

## Federal requirements and evidence

Controls and KSIs are only the pairs in `config/requirements.json`, each reused from the Azure security kit's verified pairs; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
