# Verification — Chapter 07, Private Link, DNS and Key Vault

New material, written November 17, 2026. Code: `examples/azure-security`, area `private` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/07-*.txt` and the images `captures/07-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Key Vault Private Link procedure and nslookup validation | carried (guide, azs-kv-pl) | azs07-kv-pl |
| 2 | Zone groups register and remove the record | carried (guide, azs-pe-zonegroup) | azs07-zonegroup |
| 3 | Private Dns Zone Groups - List: privateDnsZoneConfigs[].properties.privateDnsZoneId; 2026-01-01 | verified Nov 17 (Learn REST reference) | azs07-zg-api |
| 4 | Central zones, deny in workload subscriptions, deployIfNotExists | carried (guide, azs-pl-scale) | azs07-scale |
| 5 | Key Vault recommendations; AuditEvent | carried (guide, azs-kv-secure, azs-kv-log) | azs07-kv-secure, azs07-kv-log |
| 6 | Virtual network links and private endpoints in Resource Graph | not verified as Resource Graph rows; Lab 2 step 3 (research gaps, row 10) | - |
| 7 | Lab 1 outputs (1 of 3 vaults; PL-01..06; KV-01..06) | verified by running the commands as written | data/kit-captures/azs/07-*.txt |
| 8 | Lab 2 behavior | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
