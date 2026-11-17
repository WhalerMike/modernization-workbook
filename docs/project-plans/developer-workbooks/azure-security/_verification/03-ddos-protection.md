# Verification — Chapter 03, DDoS Protection

New material, written November 17, 2026. Code: `examples/azure-security`, area `ddos` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/03-*.txt` and the images `captures/03-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Tiers, NAT gateway IPs not supported, Basic IPs only under Network Protection | carried (guide, azs-ddos-tiers) | azs03-tiers |
| 2 | Layers 3 and 4; layer 7 needs a WAF | carried (guide, azs-ddos-overview) | azs03-overview |
| 3 | Network Protection and IP Protection commands; no move while protected | carried (guide, azs-ddos-cli, azs-ddos-ip-cli) | azs03-cli, azs03-ip-cli |
| 4 | Zero Trust checks: protection, metrics, logs | carried (guide, azs-zt-ddos) | azs03-zt |
| 5 | Log categories; DDoSMitigationReports retirement from about mid-August 2026 | carried (guide, azs-ddos-secure) | azs03-secure |
| 6 | IfUnderDDoSAttack metric and the tutorial's alert | carried (guide, azs-ddos-metric, azs-ddos-sim) | azs03-metric, azs03-sim |
| 7 | enableDdosProtection and ddosProtectionPlan read from Resource Graph | not verified: the ARM property names the CLI sets; Lab 2 step 3 (research gaps, row 10) | - |
| 8 | Lab 1 outputs (4 of 6 protected; statuses; DD-01..06) | verified by running the commands as written | data/kit-captures/azs/03-*.txt |
| 9 | Lab 2 behavior | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
