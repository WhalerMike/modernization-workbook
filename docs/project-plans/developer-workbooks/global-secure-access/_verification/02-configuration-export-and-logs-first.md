# Verification — Chapter 02, The Configuration Export and Logs First

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Backup weekly and before every change | Start with | carried (guide) | `gsa02-ops` |
| 2 | Forwarding profiles, filtering profiles, CA settings, cross-tenant settings: `NetworkAccess.Read.All`, delegated and application; roles; global service; beta | Start with; Verified facts | verified Nov 17, 2026 | `gsa02-fp`, `-sp`, `-sig`, `-tag` |
| 3 | Connector groups and members: `Directory.ReadWrite.All`, delegated only; no national cloud table on the page | Start with; Verified facts | verified Nov 17, 2026 | `gsa02-cg`, `-cgm` |
| 4 | Connector `status` active/inactive, `version` | Verified facts | verified Nov 17, 2026 | `gsa02-conn` |
| 5 | Named locations and TRv2 default: `Policy.Read.All` | Verified facts | verified Nov 17, 2026 | `gsa02-nl`, `-trv2` |
| 6 | 30-day retention | Start with | carried (guide) | `gsa02-logs` |
| 7 | `microsoft.aadiam/diagnosticSettings` 2017-04-01 | Lab 2 | carried (Book 12, Chapter 03 log row 25) | `gsa02-b12` |
| 8 | Lab 1 outputs | Lab 1 | verified by running | `data/kit-captures/gsa/02-*.txt` |
| 9 | Lab 2 behavior | Lab 2 | not run | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
