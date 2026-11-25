# Verification — Chapter 05, Groups, Roles and the Perimeter

New material, written November 24, 2026. Code: `examples/sql-server-identity` (not modified by this chapter). Every Microsoft Learn page below was opened and read on November 24, 2026. Book 06's citations for the same facts (Chapters 16 and 17 and Runbook R07, read October 20 to November 11, 2026) were re-read against the current pages.

Lab 1 was run by hand on Windows 11 with PowerShell 7 and Pester 5 on November 24, 2026, from a copy of `examples/sql-server-identity`; superseded by the re-run below.

## Claims log

| # | Claim (short) | Where | Source | Read | Result |
|---|---|---|---|---|---|
| 1 | Dynamic rules: `accountEnabled`, `extensionAttribute1`–`15`; no multi-value extension properties; 3,072-character body; P1 for each unique member | Start with; Verified facts | Manage rules for dynamic membership groups in Microsoft Entra ID, <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> | Nov 24, 2026 | Verified |
| 2 | Group properties `groupTypes` (`Unified`, `DynamicMembership`), `securityEnabled`, `mailEnabled`, `membershipRule`, `onPremisesSyncEnabled`, `onPremisesSamAccountName`, each returned by default | Start with; Verified facts; Lab 2 | group resource type, <https://learn.microsoft.com/graph/api/resources/group> | Nov 24, 2026 | Verified |
| 3 | `Get-MgGroup` with `-All`, `-Property`, `-Filter` | Start with; Lab 2 | Get-MgGroup, <https://learn.microsoft.com/powershell/module/microsoft.graph.groups/get-mggroup> | Nov 24, 2026 | Verified |
| 4 | List groups: permissions; `startsWith` filter on `displayName` | Lab 2; Verified facts | List groups, <https://learn.microsoft.com/graph/api/group-list> | Nov 24, 2026 | Verified, with a caveat: the page's least-privileged column shows `Group-NestingSupport.ReadWrite.All`, a write permission, and lists `Group.ReadBasic.All` and `Group.Read.All` among the higher-privileged ones. The lab uses `Group.Read.All` (read-only, returns the properties the lab needs) and says why. See research gaps |
| 5 | A Microsoft 365 GCC tenant uses `https://graph.microsoft.com` | Start with; Verified facts | Microsoft Graph national cloud deployments, <https://learn.microsoft.com/graph/deployments> | Nov 24, 2026 | Verified |
| 6 | `Connect-MgGraph` targets the global cloud by default; `-Environment`, `-TenantId`, `-Scopes` | Lab 2 | Connect-MgGraph, <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph> | Nov 24, 2026 | Verified |
| 7 | PIM for Groups: any security or Microsoft 365 group except dynamic and on-premises-synchronized groups | Start with; Lab 2 step 4 | Privileged Identity Management (PIM) for Groups, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/concept-pim-for-groups> | Nov 24, 2026 | Verified |
| 8 | Conditional Access for Azure SQL targets the Azure SQL Database application; P1; users only, not service principals or managed identities | Start with; Verified facts | Conditional access (Azure SQL Database, SQL Managed Instance, Synapse), <https://learn.microsoft.com/azure/azure-sql/database/conditional-access-configure> | Nov 24, 2026 | Verified. The page doesn't name SQL Server enabled by Azure Arc; R07 records that the same target governing Arc sign-ins is the program's working assumption |
| 9 | Workload identities: single-tenant service principals, Workload Identities Premium, managed identities not covered | Start with; Verified facts | Conditional Access for workload identities, <https://learn.microsoft.com/entra/identity/conditional-access/workload-identity> | Nov 24, 2026 | Verified |
| 10 | Four patterns; one group, one role; flat by design; exclusions of disabled accounts and guests in rules; `extensionAttribute10` as the organization code | The code; Dangers | Book 06, Chapters 16 and 17, Runbook R07; Book 03, Chapter 06 program attribute map (workbook pages) | Nov 24, 2026 | Carried from the workbook |
| 11 | Lab 1 outputs, including 4 passing tests in the `Chapter 05` block | Lab 1 | Run of the kit | Nov 24, 2026 | Verified by running |
| 12 | Lab 2 behavior | Lab 2 | — | — | Not run |

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- **Dynamic rule.** The kit's rule is now `(user.extensionAttribute10 -in [...]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member")`, as Book 06, Chapter 17 and R07's example rule require; with no codes it says "no code recorded yet, so ask HR for it before writing the rule". The chapter's "add both when you build the group" note and Lab 1 step 3's "rule a rule" text are gone. Verified against `Get-SqlGroupPattern`.
- **One group, one role.** Checked by `New-SqlLoginPlan`'s warnings (Chapter 04), not by the group map; the chapter now points there instead of "split by hand".
- **Table width.** With the longer rules, `Invoke-SqlGroupMap.ps1`'s table no longer has room for `Flags`, and PowerShell drops the column; step 2 prints it. Real output, kept as is.

## Federal requirements and evidence

Controls and KSIs are only those `config/requirements.json` lists for GROUPS (AC-2, AC-6; KSI-IAM-ELP). Claim language: "supports" and "provides evidence for"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
