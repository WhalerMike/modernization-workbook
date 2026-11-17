# Verification — Chapter 07, Internet Access, QUIC and TLS Inspection

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Tutorial requests (filtering policy, profile, link, CA session control) | Start with; Lab 2 | carried (guide) | `gsa07-ia` |
| 2 | Filtering profiles read; `conditionalAccessPolicies` | Verified facts | verified Nov 17, 2026 | `gsa07-sp` |
| 3 | Limits; QUIC; cloud firewall preview; Windows Firewall rule | Start with | carried (guide) | `gsa07-limits`, `-tls` |
| 4 | Allow-list expiry | Start with | carried (guide) | `gsa07-ops` |
| 5 | Certificate requirements, dedicated CA, renewal, 1% threshold, `TlsStatus` | Start with | carried (guide) | `gsa07-byoc`, `-tlstut`, `-opsia`, `-concept`, `-zt` |
| 6 | No TLS read verified for the kit | The code | research gap 6 | — |
| 7 | `TlsStatus` values differ between Learn pages | The code | carried (guide); research gap 5 | guide |
| 8 | Lab 1 outputs | Lab 1 | verified by running | `data/kit-captures/gsa/07-*.txt` |
| 9 | Lab 2 behavior | Lab 2 | not run | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
