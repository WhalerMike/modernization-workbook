# Verification — Chapter 08, Policy, Drift and Evidence

New material, written November 17, 2026. Code: `examples/azure-security`, area `policy, compare, metrics, evidence` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/08-*.txt` and the images `captures/08-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | PolicyResources samples: compliance by assignment (used as published), exemptions per assignment, exemptions due within 90 days | verified Nov 17 (Learn policy samples for Resource Graph) | azs08-arg-policy |
| 2 | Exemption categories, expiresOn, expired kept but not honored | carried (guide, azs-exemption) | azs08-exemption |
| 3 | az policy exemption list --filter atScopeAndBelow() | carried (guide, azs-cli-exemption) | azs08-cli-exemption |
| 4 | Step 9 and 10 controls and KSIs; AU-9 to KSI-MLA-OSM (provider notices kit) | carried | azs08-guide; examples/provider-notices/config/requirements.json |
| 5 | The drift pipeline refuses runs that aren't validation kit runs | read in examples/drift-pipeline/README.md | - |
| 6 | Lab 1 outputs (policy findings; 13 fixed, 4 new; metrics; 3 records; stage check fails on fixture records) | verified by running the commands as written | data/kit-captures/azs/08-*.txt |
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
