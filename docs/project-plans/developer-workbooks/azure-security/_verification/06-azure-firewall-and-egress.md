# Verification — Chapter 06, Azure Firewall and Egress

New material, written November 17, 2026. Code: `examples/azure-security`, area `firewall` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/06-*.txt` and the images `captures/06-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Zero Trust checks; SKU needs | carried (guide, azs-fw-zt, azs-fw-sku) | azs06-zt, azs06-sku |
| 2 | Policy modes Alert, Deny, Off | carried (guide, azs-fw-cli) | azs06-cli |
| 3 | Default route to the firewall's private IP | carried (guide, azs-fw-route) | azs06-route |
| 4 | Draft + Deployment; deploy replaces the applied policy | carried (guide, azs-fw-draft) | azs06-draft |
| 5 | AZFWThreatIntel | carried (guide, azs-fw-monref) | azs06-monref |
| 6 | Firewall policy and route table properties in Resource Graph | not verified as Resource Graph columns; Lab 2 step 4 (research gaps, rows 8 and 10) | - |
| 7 | Lab 1 outputs (2 of 5 routed; FW-01..05, 07; the four plan lines) | verified by running the commands as written | data/kit-captures/azs/06-*.txt |
| 8 | Lab 2 behavior, including effective routes | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
