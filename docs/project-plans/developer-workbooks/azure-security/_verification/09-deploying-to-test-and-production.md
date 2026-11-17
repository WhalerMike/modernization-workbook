# Verification — Chapter 09, Deploying to Test and Production

New material, written November 17, 2026. Code: `examples/azure-security`, area `deploy` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

This chapter has no labs. Its fixture-mode outputs were produced on November 17, 2026 and are quoted as text, dated.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | The assignment command and the narrowest-role guidance | carried (guide Step 9) | azs09-guide |
| 2 | Rollback commands for Steps 1 and 9 | carried (guide Rollback table) | azs09-guide |
| 3 | Resource Policy Contributor eligible through PIM | carried (guide Prerequisites) | azs09-guide |
| 4 | Fixture-mode outputs of preflight, two scheduled runs, plan, rollback and the evidence check | verified by running the rehearsal on November 17, 2026 (home path masked as <home>) | - |
| 5 | Live behavior of every step | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
