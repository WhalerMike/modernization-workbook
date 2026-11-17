# Verification — Chapter 04, The Web Application Firewall

New material, written November 17, 2026. Code: `examples/azure-security`, area `waf` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/04-*.txt` and the images `captures/04-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Detection logs, prevention blocks; Zero Trust checks | carried (guide, azs-zt-agw-waf, azs-zt-netsec) | azs04-zt-agw, azs04-zt-netsec |
| 2 | DRS 2.2 recommended; CLI default 2.1 | carried (guide, azs-agw-secure, azs-waf-cli) | azs04-agw-secure, azs04-waf-cli |
| 3 | Front Door managed rules need Premium | carried (guide, azs-afd-cli) | azs04-afd-cli |
| 4 | Mode switch command; built-in WAF policies; log categories | carried (guide) | azs04-waf-403, azs04-waf-policy, azs04-agw-logs, azs04-afd-logs |
| 5 | WAF policy properties in Resource Graph (policySettings, managedRules.managedRuleSets, customRules) | not verified as Resource Graph columns: the names the guide's Validate query reads; Lab 2 step 4 (research gaps, row 5) | - |
| 6 | Lab 1 outputs (1 of 3 endpoints; WAF-01, 03, 04, 06, 07; the plan line) | verified by running the commands as written | data/kit-captures/azs/04-*.txt |
| 7 | Lab 2 behavior | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
