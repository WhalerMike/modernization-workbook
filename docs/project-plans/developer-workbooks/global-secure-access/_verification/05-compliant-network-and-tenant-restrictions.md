# Verification — Chapter 05, The Compliant Network and Tenant Restrictions

New material, written November 17, 2026. Code: `examples/global-secure-access` (new in this change). Product facts carried from the guide were read on Microsoft Learn on November 11, 2026 (`docs/books/guides/_verification/global-secure-access-implementation.md`); facts marked verified Nov 17 were read on Learn's Graph reference pages that day with WebFetch (the Learn documentation service wasn't available to this session).

Lab 1 was run with `python scripts/kit_captures.py gsa` on Windows 11, PowerShell 7.6 with Pester 5, on November 17, 2026; the captured output is in `data/kit-captures/gsa/` and the images are in `captures/`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Compliant network check: example policy, Intune exclusions, emergency access, not for Private Access, signaling caution | Start with | carried (guide) | `gsa05-cn`, `-limits` |
| 2 | `compliantNetworkNamedLocation` filter; `Policy.Read.All` | Start with | verified Nov 17, 2026 | `gsa05-nl` |
| 3 | Disable-and-retry test | Start with; Lab 2 | carried (guide) | `gsa05-tut` |
| 4 | Universal tenant restrictions; four cases; `5000211` | Start with; Lab 2 | carried (guide) | `gsa05-utr`, `-opsms` |
| 5 | `networkPacketTaggingStatus` read permission | Verified facts | verified Nov 17, 2026 | `gsa05-tag` |
| 6 | TRv2 default read; `Policy.Read.All`; `tenantRestrictions` shape | Verified facts | verified Nov 17, 2026 | `gsa05-trv2` |
| 7 | TRv2 partners list permission | Verified facts | not read: research gap 3; call marked unverified | — |
| 8 | 10 business days, defect rule | The code | the guide's Step 7 How-section | guide |
| 9 | Lab 1 outputs | Lab 1 | verified by running | `data/kit-captures/gsa/05-*.txt` |
| 10 | Lab 2 behavior; `DELETE` of a policy | Lab 2 | not run; the delete request is the v1.0 conditionalAccessPolicy delete, not re-read | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json`, which copies the guide's requirements table (the guide's claims log; fedramp.gov KSI pages and NIST's catalog, read November 11, 2026); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
