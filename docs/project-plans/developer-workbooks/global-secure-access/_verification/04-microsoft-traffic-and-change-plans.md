# Verification — Chapter 04, Microsoft Traffic and Change Plans

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Microsoft traffic profile acquisition; assignments in the portal; Application Administrator | Start with | carried (guide) | `gsa04-ms` |
| 2 | Profile PATCH with `state`; `NetworkAccess.ReadWrite.All` | Start with | carried (guide) | `gsa04-ia` |
| 3 | Signaling setting, default after June 2025, caution | Start with | carried (guide) | `gsa04-sip`, `-sig` |
| 4 | Enabling a new traffic profile is a major change | Start with | carried (guide) | `gsa04-ops` |
| 5 | Plan order, guards, hash rule | The code | read in the kit's source and tests | kit |
| 6 | Lab 1 outputs | Lab 1 | verified by running | `data/kit-captures/gsa/04-*.txt` |
| 7 | Lab 2 behavior | Lab 2 | not run | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
