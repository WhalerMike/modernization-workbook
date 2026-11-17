# Verification — Chapter 05, Front Door, Application Gateway and the Origin

New material, written November 17, 2026. Code: `examples/azure-security`, area `edge` (new in this change). Facts carried from the guide were read on Microsoft Learn on November 11 and 13, 2026 (`docs/books/guides/_verification/azure-security-implementation.md`); this chapter cites the same pages. New facts were read on Microsoft Learn on November 17, 2026 (fetched pages; the Microsoft Learn MCP tools weren't available in this session).

Lab 1 was run with `python scripts/kit_captures.py azs` on Windows 11, PowerShell 7.6 with Pester 5.9, on November 17, 2026; the captured output is `data/kit-captures/azs/05-*.txt` and the images `captures/05-*.png`.

## Claims log

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 1 | Tag and header together; the tag's addresses are shared | carried (guide, azs-afd-origin) | azs05-origin |
| 2 | App Service access restriction with tag and header | carried (guide, azs-appsvc-fd) | azs05-appsvc |
| 3 | Web Apps - Get Configuration: ipSecurityRestrictions (tag ServiceTag, ipAddress, headers, action), ipSecurityRestrictionsDefaultAction; X-Azure-FDID exact match; 2023-12-01 a supported version | verified Nov 17 (Learn REST reference) | azs05-webcfg |
| 4 | AFD Origins - List By Origin Group, 2025-04-15: azureOrigin, sharedPrivateLinkResource.status, enabledState | verified Nov 17 (Learn REST reference) | azs05-origins |
| 5 | Origin groups' health probe settings and custom domains' tlsSettings.minimumTlsVersion | not verified: ARM names, same API version; Lab 2 step 4 (research gaps, row 6) | - |
| 6 | Private Link origins; TLS; classic retirement; failover quickstart | carried (guide) | azs05-pl, azs05-ingress, azs05-agw-tls, azs05-classic, azs05-afd-cli |
| 7 | Lab 1 outputs (2 of 5 locked; EDGE-01, 03..08) | verified by running the commands as written | data/kit-captures/azs/05-*.txt |
| 8 | Lab 2 behavior, including the direct-request test | not run against a subscription | - |

## Federal requirements and evidence

Controls and KSIs are the pairs in `examples/azure-security/config/requirements.json`: the guide's requirements table for the area steps; the provider notices kit's for EVIDENCE, PLAN and RB; the privileged access workbook's AC-6 to KSI-IAM-ELP for PRE. No new pair. Claim language: "supports", never "satisfies".

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide's step(s) for this chapter (commands, Validate, requirements, dangers) | Start with Microsoft Learn; Lab 2; Verified facts; Federal requirements | The guide's write commands stay in the guide; the chapter links them |
| The learning path's module | Linked from the module's Lab 1 | Not repeated |

## Review gate

Pending: the editor approves with `python scripts/source_watch/review_gate.py --approve <page>`.
