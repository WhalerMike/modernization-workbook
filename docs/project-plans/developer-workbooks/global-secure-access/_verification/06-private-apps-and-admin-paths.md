# Verification — Chapter 06, Private Applications and Administrative Paths

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Tutorial requests (template, onPremisesPublishing, connector group, segments, assignment) | Start with; Lab 2 | carried (guide) | `gsa06-pa` |
| 2 | Segment overlap rules, 15 minutes | Start with | carried (guide) | `gsa06-perapp` |
| 3 | Connector reads and properties | Start with; Verified facts | verified Nov 17, 2026 | `gsa06-cg`, `-conn` |
| 4 | Zero Trust recommendations; DC sensor order | Start with | carried (guide) | `gsa06-zt`, `-dc` |
| 5 | No request lists Private Access apps with segments and assignments | The code | research gap 3; call marked unverified | — |
| 6 | Lab 2 scope `AppRoleAssignment.ReadWrite.All` for the assignment | Lab 2 | not re-read on Learn; the guide connects with `Application.ReadWrite.All` | — |
| 7 | Lab 1 outputs | Lab 1 | verified by running | `data/kit-captures/gsa/06-*.txt` |
| 8 | Lab 2 behavior | Lab 2 | not run | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
