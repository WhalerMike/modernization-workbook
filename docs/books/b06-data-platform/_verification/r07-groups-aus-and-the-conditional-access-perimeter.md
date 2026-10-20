# Verification — Runbook R07, Groups, Administrative Units & the Conditional Access Perimeter

File: `docs/books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md`
Source: the same file (former Implementation Companion Book 07)
Verified: 2026-10-20

Microsoft claims were checked on Microsoft Learn on 2026-10-20. Function claims were checked against the program's `FMPIdentityAssessment.psm1` and `FMPSqlServerMigration.psm1` (published under the `FMP` prefix). Consistency was checked against Book 02, Chapter 05 (administrative units, restricted management, role-assignable groups) and Book 04, Chapter 07 (Conditional Access library CA001–CA038).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `Export-FMPEntraGroups` reads via `Get-MgGroup` or a snapshot; parameters `-TenantId`, `-SnapshotPath`, `-IncludeDynamic`, `-OutputPath`, `-Cloud`, `-GraphApiVersion`, `-GraphEndpoint` | Export-FMPEntraGroups | verified (function and parameters exist); `Get-MgGroup` verified | program source; Get-MgGroup |
| 2 | "GCC-Moderate uses the cloud-correct Graph base" | Export-FMPEntraGroups; Phase 2 callout | corrected/clarified: GCC uses the worldwide `graph.microsoft.com`; only GCC High/DoD use `.us` endpoints. Internal `Resolve-FMPGraphBase`/`resolve_graph_base`, `[api]` extra and AGENTS.md references removed | Microsoft Graph national cloud deployments |
| 3 | `security_enabled` + `mail_enabled` distinguish the types; `is_dynamic`/`membership_rule` | Export-FMPEntraGroups | verified against Graph properties (`groupTypes` Unified/DynamicMembership, `membershipRule`) | group resource type |
| 4 | `Export-FMPConditionalAccess` via `Get-MgIdentityConditionalAccessPolicy`; emits `id`, `display_name`, `state` | Export-FMPConditionalAccess | verified; added that `state` alone doesn't show coverage of the SQL resource | program source; Get-MgIdentityConditionalAccessPolicy |
| 5 | Four-type taxonomy | Mapping table | restated-as-design (program taxonomy, Chapter 16) | — |
| 6 | Group binds as a "type-E login" | Mapping table; binding; verification | corrected: Entra group logins are type `X` (`EXTERNAL_GROUP`); type `E` is users and applications (consistent with Chapter 16) | sys.server_principals |
| 7 | Type 4 split into M365 group + assigned security group | Mapping table | verified as consistent with Graph (create supports M365, dynamic, security groups); design | group resource type |
| 8 | `New-FMPEntraGroupClassification`, `becomes_sql_login`, `review` | Classification | verified | program source |
| 9 | AU before groups; "restricted-management, so a Global Admin cannot bypass the division-level delegation" | Sequencing; AU section | corrected: Global and Privileged Role Administrators can't modify the objects but can manage the AU and assign themselves a role over it (audited). Restricted setting fixed at creation | Restricted management administrative units |
| 10 | Scoped role "User Administrator" for the DBA lead | Sequencing step 2 | corrected to Groups Administrator (narrowest role that manages groups in the AU); noted User Administrator also can; assignment to a group requires a role-assignable (assigned) group; PIM eligibility per Book 04 (design) | Assign Microsoft Entra roles (AU scope); Administrative units; group resource type |
| 11 | (added) Groups can't be added to an AU by rule; AUs can't nest | Sequencing step 3; AU section | verified (consistent with Book 02, Chapter 05) | Administrative units in Microsoft Entra ID |
| 12 | (added) Restricted AU limits: only users/devices/security groups; no PIM, entitlement management, lifecycle workflows or access reviews for members; 100 per tenant | AU section | verified | Restricted management administrative units; Book 02, Chapter 05 |
| 13 | Adapters `entra-admin-units` (FMP_154), `entra-dynamic-groups` (FMP_152); cross-canon integrity checks | AU and dynamic sections | restated-as-design (program tooling); registry file path removed; "cross-canon" → "cross-reference" | — |
| 14 | Rule example `(user.department -eq "Finance") -and (user.jobTitle -contains "DBA")` | Dynamic groups | verified (operators valid); added Microsoft guidance to minimize `-contains` and that it needs the text box | Manage rules for dynamic membership groups |
| 15 | (added) Dynamic groups need Entra ID P1 per unique member | Dynamic groups | verified | Same |
| 16 | Attribute values from the HR pipeline | Dynamic groups | restated-as-design; linked to Book 03 | — |
| 17 | `CREATE LOGIN [group] FROM EXTERNAL PROVIDER`; `CREATE USER … FOR LOGIN`; `ALTER ROLE … ADD MEMBER` | Binding | verified; `GO` added after `USE` | CREATE LOGIN example K; Entra auth setup tutorial |
| 18 | Preconditions "SQL 2022+, Arc" | Binding | verified for 2022+; added that Entra auth can be configured without Arc on Windows, and that Arc is the program's requirement | Microsoft Entra authentication for SQL Server |
| 19 | (added) Non-unique display names → `WITH OBJECT_ID` | Binding | verified | Microsoft Entra logins and users with nonunique display names |
| 20 | `New-FMPGroupLoginScript` emits only `becomes_sql_login`, no `-Server`/`-Execute` | Binding | verified | program source |
| 21 | Conditional Access becomes "the binary outer perimeter for all SQL access" | The perimeter dividend | corrected/qualified: CA reaches users, not service principals or managed identities; Microsoft documents CA for Azure SQL (target *Azure SQL Database*); that this target governs Arc-enabled SQL Server sign-ins (audience `https://database.windows.net/`) is restated as the program's working assumption to confirm in pilot; all-resources policies CA006/CA007/CA018/CA022 reach it either way; CA037 for workload identities | Conditional access (Azure SQL); Microsoft Entra authentication for SQL Server; Book 04, Chapter 07 |
| 22 | (added) Sign-in risk needs P2 (CA014/CA019), other conditions P1 | The perimeter dividend | verified against Book 04 library | Book 04, Chapter 07; Conditional access (Azure SQL) |
| 23 | Book 05 / Book 09 / narrative Book 07 references | throughout | edited: Runbook R05, Chapter 20 and Runbook R09, Chapters 16–17 | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title `Runbook R07 — …`; `doc-type`, `status: draft`, `lifecycle_review: 2027-04-01`; `subtitle` and `canon-source` removed; one-sentence description |
| docx H1 block; Download callout (Book_07.docx) | removed | Word file not on the site |
| Companion note callout | edited | thesis, "In this runbook", "Pairs with" (Chapters 16–17); canon citations removed |
| The two phases | edited | "type-E login" generalized to `FROM EXTERNAL PROVIDER` login |
| Export-FMPEntraGroups | edited | claims 1–3; illustrative-code warning added before the first code block; module path shortened |
| Export-FMPConditionalAccess | edited | claim 4 |
| Mapping to the four-type taxonomy | edited | claims 5–8 |
| Phase 2 warning callout | edited | claim 2 |
| Sequencing — the AU comes first | edited | claims 9–11 |
| Provision the DBA AU | edited | claims 12–13; restricted-management limits list added |
| Provision dynamic groups | edited | claims 14–16 |
| Bind the group to a login | edited | claims 17–20 |
| Verification & rollback | edited | perimeter and AU checks sourced; login-type check added |
| The perimeter dividend | edited | claims 21–22 |
| Closing italic footer | removed | duplicated the body; paths and canon residue |
| — | added | "Continue the book" callout (R06 ← → R08); footnotes `[^r07-*]` (14) |
