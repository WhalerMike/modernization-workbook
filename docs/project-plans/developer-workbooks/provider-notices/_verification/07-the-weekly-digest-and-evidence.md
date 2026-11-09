# Verification — Chapter 07, The Weekly Digest and Evidence

New material, written November 9, 2026. Code: `examples/provider-notices` as built in phase 1 (PR #523): `Invoke-PnDigest.ps1`, `Invoke-PnEvidence.ps1`, `New-PnDigest`, `Write-PnEvidence`, `Test-PnEvidence`, `Update-PnEvidenceSums`, `config/requirements.json`. Provider facts are the guide's, read on the provider's own documentation on November 9, 2026 (`docs/books/guides/_verification/provider-notices-implementation.md`); this chapter cites the same pages. This chapter adds no provider fact.

Lab 1 was run with `python scripts/kit_captures.py pn` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 9, 2026; the captured output is in `data/kit-captures/pn/` and the images are in `captures/`. No code changed for this chapter.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Control statement parts as paraphrased | Verified facts | carried (guide row 33) | `pn07-oscal` |
| 2 | The KSIs' related controls | Verified facts | carried (guide rows 34 to 37) | `pn07-ksi` |
| 3 | AU-9 to KSI-MLA-OSM | Verified facts | carried (guide row 38) | privileged access guide |
| 4 | Digest sections, evidence record fields, chain, stage check | The code | read in the kit's source and tests | kit |
| 5 | Lab 1 outputs (digest counts, the digest, three records with their steps, controls and KSIs, 25 files, PRE and RUN missing for test, `records.csv`, the tamper failure, 140 tests) | Lab 1 | verified by running the commands as written | `data/kit-captures/pn/07-*.txt` |
| 6 | Lab 2 behavior | Lab 2 | not run against a test environment | — |

## Federal requirements and evidence

Each row is a Lab step or a file the kit writes. Controls and KSIs are only the pairs in `config/requirements.json` (the guide's claims log, rows 33 to 38); no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers (Book 00, Appendix B).

## Review gate

`review-status: pending`. Not approved here.
