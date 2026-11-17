# Verification — Chapter 02, The Public Exposure Register

New material, written November 17, 2026. Code: `examples/azure-security`, area `exposure` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/02-*.txt` and the images `captures/02-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | The four Step 2 queries, from Learn's starter sample | carried (guide, azs-arg-starter) | azs02-arg-starter |
| 2 | Inventory with Resource Graph; quarterly review; fewer public IPs | carried (guide, azs-ddos-secure, azs-ddos-cost) | azs02-ddos-secure, azs02-ddos-cost |
| 3 | Front Door edge has built-in L3/L4 DDoS protection | carried (guide, azs-afd-overview) | azs02-afd-overview |
| 4 | Classic Front Door retires March 31, 2027 | carried (guide, azs-afd-classic) | azs02-afd-classic |
| 5 | Defender for Cloud internet exposure analysis is GA in commercial Azure | carried (Book 12, Chapter 08) | azs02-b12 |
| 6 | Step 2 controls CM-8, SC-7; KSI-CNA-MAT | carried (guide requirements table) | azs02-guide |
| 7 | Lab 1 outputs (19 exposures, 16 owned; EX-01 x3, EX-02, EX-05; week 2 EX-03 and EX-04) | verified by running the commands as written | data/kit-captures/azs/02-*.txt |
| 8 | Lab 2 behavior, including how soon Resource Graph shows a new public IP | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
