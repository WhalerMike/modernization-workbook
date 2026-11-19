# Verification — Chapter 01, The Daily Checks and Where Each One Lives

New material, written November 18, 2026. Code: `examples/daily-checks-workbook` (new in this change). Every Microsoft fact was read on Microsoft Learn that day with WebFetch (the Learn documentation service wasn't available to this session); facts carried from the guide rely on its verification log (`docs/books/guides/_verification/daily-checks-dashboard-implementation.md`), and facts from the books are cited by link.

Lab 1 was run with `python scripts/kit_captures.py dc` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 18, 2026; the captured output is in `data/kit-captures/dc/` and the images are in `captures/`. Lab 2 was not run.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Learn facts in this chapter | verified Nov 18, 2026 | dc01-best (visualization options); dc01-tables (seven table reference pages, columns the queries read); dc01-health (SentinelHealth supported connectors, health monitoring must be on); dc01-ingest (custom tables end in _CL); dc01-entra-health (preview, admin center and e-mail; GCC not stated); dc01-intune (daily export up to 48 hours; Intune GCC is the commercial instance) |
| 2 | Kit behavior and lab output | verified by running the kit and its tests | `data/kit-captures/dc/`, `examples/daily-checks-workbook/tests`, `deploy/tests` |
| 3 | Lab 2 behavior | not run | — |
| 4 | Design guidance (tab fit, freshness limits, render rules, stage steps) | the program's position, labeled | `config/manifest.json`, `config/requirements.json` |
| 5 | Server and activity tables (`Event`, `Heartbeat`, `SecurityEvent`, `AzureActivity`), the Azure Monitor Agent on Arc-enabled servers, Windows Security Events via AMA and Azure Activity GA in Azure commercial | verified Nov 19, 2026 | dc01-servers |

## Federal requirements and evidence

Controls and KSIs are only the pairs in `config/requirements.json`, each reused from the Azure security kit's verified pairs; no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
