# Verification — Chapter 08, Rings, Metrics and the Evidence Package

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Retention, tables, traffic drop alert | Start with | carried (guide) | `gsa08-logs`, `-secops` |
| 2 | Rollback plan; RACI; two people per role | Start with | carried (guide) | `gsa08-dg`, `-ops` |
| 3 | `az monitor log-analytics query` | Verified facts | carried (Azure Security guide log, row 70) | `gsa08-cli` |
| 4 | CISA telemetry sentence | Start with | carried (guide) | `gsa08-tic` |
| 5 | ZTA results kit's `network-access` family points at the guide | Start with | read in `examples/zta-results/config/finding-families.json`, Nov 17, 2026 | kit |
| 6 | Metrics, ring exit, rollback order | The code | the guide's Metrics, Step 11.1 and Rollback sections | guide |
| 7 | Lab 1 outputs | Lab 1 | verified by running | `data/kit-captures/gsa/08-*.txt` |
| 8 | Lab 2 behavior | Lab 2 | not run | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
