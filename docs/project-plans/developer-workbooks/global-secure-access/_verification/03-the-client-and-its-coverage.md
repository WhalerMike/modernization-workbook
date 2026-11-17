# Verification — Chapter 03, The Client and Its Coverage

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Client prerequisites, Intune values, hardening values, DoH profile | Start with | carried (guide) | `gsa03-client` |
| 2 | `getDeviceUsageSummary`: `NetworkAccessPolicy.Read.All`, delegated only; roles; global service; beta; response fields | Start with; Verified facts | verified Nov 17, 2026 | `gsa03-usage` |
| 3 | `trafficType` marked required in the parameter table; the page's example and the guide omit it | Verified facts; Lab 2 step 4 | recorded as research gap 2; the kit sends the guide's request | `gsa03-usage` |
| 4 | Client 1.8.239.0 or later for Universal CAE | Start with | carried (guide Step 7) | `gsa03-limits` |
| 5 | Browser `DnsOverHttpsMode` policy value `off` | The code | not on a Learn page read: research gap 4 | — |
| 6 | Lab 1 outputs | Lab 1 | verified by running | `data/kit-captures/gsa/03-*.txt` |
| 7 | Lab 2 behavior | Lab 2 | not run | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
