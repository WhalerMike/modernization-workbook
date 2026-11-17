# Verification — Chapter 01, Decision, Licensing and GCC Availability

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | GCC: available product-wide; preview features not yet specified | Start with; availability table | carried (guide, Nov 11) | `gsa01-limits` |
| 2 | Licenses per function | Start with | carried (guide) | `gsa01-overview` |
| 3 | `subscribedSkus`: `LicenseAssignment.Read.All` least privileged, delegated and application; Global Reader, Directory Readers; global service | Start with; Verified facts | verified Nov 17, 2026 | `gsa01-skus` |
| 4 | `tenantStatus`: `NetworkAccessPolicy.Read.All`, delegated only; Global Reader, GSA Log Reader; global service; beta | Start with; Verified facts | verified Nov 17, 2026 | `gsa01-status` |
| 5 | Guide's Step 1.1 connects with `Organization.Read.All`, `NetworkAccess.Read.All`; least privileged differs | Verified facts | recorded as research gap 1 (not a conflict: Learn lists both; the kit uses the least privileged) | `gsa01-skus`, `gsa01-status` |
| 6 | Interim paths | Availability table | the guide's Steps 3, 5, 6, 11, 12 and its mapping table; no new fact | guide |
| 7 | Lab 1 outputs | Lab 1 | verified by running the commands as written | `data/kit-captures/gsa/01-*.txt` |
| 8 | Lab 2 behavior | Lab 2 | not run against a tenant | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
