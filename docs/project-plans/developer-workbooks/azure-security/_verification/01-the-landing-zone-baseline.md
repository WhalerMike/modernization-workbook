# Verification — Chapter 01, The Landing-Zone Baseline

New material, written November 17, 2026. Code: `examples/azure-security`, area `baseline` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/01-*.txt` and the images `captures/01-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Hierarchy settings: GET .../settings/default, api-version 2020-05-01; requireAuthorizationForGroupCreation, defaultManagementGroup; root group only | verified Nov 17 (Learn REST reference) | azs01-hier-get |
| 2 | New-AzManagementGroupHierarchySetting -Authorization -DefaultManagementGroup | carried (guide, azs-mg-protect) | azs01-mg-protect |
| 3 | DoNotEnforce evaluates without enforcing | carried (guide, azs-enforcement) | azs01-enforcement |
| 4 | PolicyResources holds policy assignments | verified Nov 17 (Learn policy samples for Resource Graph) | azs01-arg-policy |
| 5 | Diagnostic Settings - List: GET {resourceUri}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview; workspaceId, logs[].category/categoryGroup/enabled | verified Nov 17 (Learn REST reference) | azs01-diag |
| 6 | Pricings - List: GET {scopeId}/providers/Microsoft.Security/pricings?api-version=2024-01-01; pricingTier Free or Standard | verified Nov 17 (Learn REST reference) | azs01-pricings |
| 7 | GCC pairs with commercial Azure; management.azure.com | carried (guide availability table) | azs01-gov |
| 8 | Step 1 controls CM-2, CM-6, CA-7; KSI-SVC-ACM, KSI-MLA-EVC | carried (guide requirements table) | azs01-guide |
| 9 | Lab 1 outputs (6 calls; 12 Finding, 1 Info; 6 of 16 platform resources logged; the live command; tests) | verified by running the commands as written | data/kit-captures/azs/01-*.txt |
| 10 | Lab 2 behavior | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
