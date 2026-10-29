# Verification — Chapter 05, Delegation Without OUs

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch) and NIST CSRC.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | OU tree was the AD delegation model; Entra ID is flat; over/under-delegation | Opening | restated-as-design | — |
| 2 | AU contains only users, groups, devices; users can be in several AUs | What AUs are | verified | c05-au-overview |
| 3 | AUs can't be nested | What AUs are; Tier 3 | verified (added; source implied division AUs "within" departments) | c05-au-overview |
| 4 | Group in AU brings the group, not its members | What AUs are | verified (added) | c05-au-overview |
| 5 | AUs scope management only, not browsing; only M365 admin center filters | What AUs are | verified (added) | c05-au-overview |
| 6 | List of AU-scopable roles; AU-scoped Helpdesk/Password Admin can't reset admins | What AUs are | verified (added) | c05-assign-roles |
| 7 | P1 per AU admin; Free for members | What AUs are | verified | c05-au-overview |
| 8 | Dynamic AU: one object type, no groups, P1 per unique member, devices free, global Azure only (not Azure Government) | Dynamic AUs | verified (added) | c05-au-dynamic |
| 9 | 15,000 dynamic groups + AUs; 3,072-char rule; manual exceptions via `-or` | Dynamic AUs | verified (added) | c05-au-faq |
| 10 | "Global Administrators cannot manage AU members without AU-scoped role" | Restricted management | corrected: GA/PRA can't modify objects but can manage the AU, its membership, and assign themselves (audited) | c05-rmau |
| 11 | "Even a Global Admin cannot bypass AU-scoped delegation" | Restricted management: a per-AU decision | corrected: bypass is deliberate and audited, not impossible | c05-rmau |
| 12 | RMAU setting immutable; max 100 per tenant | Restricted management | verified (added) | c05-rmau |
| 13 | RMAU members can't be managed by PIM, entitlement management, lifecycle workflows, access reviews | Restricted management | verified (added) | c05-rmau |
| 14 | Role-assignable groups in RMAU: membership only by GA/PRA; GA password reset impossible inside RMAU | Restricted management | verified (added) | c05-rmau |
| 15 | RMAU members: users, devices, security groups only | Restricted management | verified (added) | c05-rmau |
| 16 | Apps need AU-scoped role; Graph application permissions don't apply | Restricted management | verified (added) | c05-rmau |
| 17 | RMAU audit activities | Drift detection | verified (added) | c05-rmau |
| 18 | Three-tier model table | Three-tier model | restated-as-design | Program FMP_154 |
| 19 | Tier 1 Global Reader / Security Reader / Reports Reader "scoped to AU-Enterprise" | Three-tier model; matrix | corrected: these roles can't be AU-scoped; assigned at tenant scope | c05-assign-roles |
| 20 | AU-Enterprise Department-non-empty predicate | Registry | restated-as-design; rule written as `(user.department -ne null)` | — |
| 21 | Purview can scope to AUs | Three-tier model | verified | c05-purview |
| 22 | "Every AU Restricted Management, non-negotiable" | Registry; per-AU decision | restated-as-design and changed to a per-AU decision (default no) because of rows 10–14; flagged for program-owner confirmation | c05-rmau |
| 23 | Department/division AU registry | Registry | restated-as-design; dynamic rule examples added | — |
| 24 | Role assignment matrix | Matrix | restated-as-design (Tier 1 scope corrected) | — |
| 25 | `*-Admins` dynamic groups derived from `*-Users` | Matrix | corrected: role-assignable groups must be Assigned, immutable flag, no nesting, max 500 per tenant | c05-role-groups |
| 26 | PIM supports eligible assignments with AU scope | Matrix | verified (added) | c05-pim-scope |
| 27 | Scope string `/administrativeUnits/<id>` manages members, not the AU | Code warning | verified | c05-assign-roles |
| 28 | Cmdlets `Get-MgDirectoryAdministrativeUnit`, `Get-MgRoleManagementDirectoryRoleDefinition`, `New-MgRoleManagementDirectoryRoleAssignment` with `-DirectoryScopeId/-PrincipalId/-RoleDefinitionId` | Code | verified | c05-assign-roles |
| 29 | `Get-MgDirectoryAdministrativeUnitScopedRoleMember -AdministrativeUnitId` | Code | verified (Learn cmdlet reference, search result) | Learn: get-mgdirectoryadministrativeunitscopedrolemember |
| 30 | AU properties `IsMemberManagementRestricted`, `MembershipType`, `MembershipRule`, `MembershipRuleProcessingState` (On/Paused) | Code; drift | verified | c05-update-au |
| 31 | Delegation principles and review cadences | Principles | restated-as-design | Program delegation matrix |
| 32 | Principles map to NIST SP 800-53 Rev. 5 access control family | Principles | verified (family only; individual control numbers not cited because not confirmed from a primary page) | c05-nist-80053 |
| 33 | "Unrestricted AU — auto-fix Yes" | Drift table | corrected: immutable; remediation is recreate and migrate | c05-rmau |
| 34 | Paused rule processing as drift | Drift table | verified (added) | c05-update-au |
| 35 | Other drift severities/auto-fix | Drift table | restated-as-design | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| reference-architecture/delegation.md — The Delegation Problem | Opening prose | — |
| delegation.md — Three-Tier Model (table + tier→AU list) | "The three-tier model" | Tier 1 scope corrected |
| delegation.md — Enterprise AU (Tier 1) + Department-predicate note | "Administrative unit registry" → Enterprise AU; three-tier prose | Restricted column changed per decision |
| delegation.md — Department AUs (Tier 2) | "Department AUs (Tier 2)" | Restricted column replaced by membership rule; restriction moved to per-AU decision |
| delegation.md — Division AUs (Tier 3) | "Division AUs (Tier 3, created on demand)" | Non-nesting fact added |
| delegation.md — Role Assignment Matrix + note on `*-Admins` dynamic groups | "Role assignment matrix" | Note corrected (role-assignable groups can't be dynamic) |
| delegation.md — Restricted Management | "Restricted management administrative units" + "Restricted management: a per-AU decision" | Escalation claim corrected |
| delegation.md — Drift Detection | "Drift detection" | Unrestricted-AU auto-fix corrected; paused-rule and dynamic-principal rows added |
| delegation.md — Source callout (FMP_154) | Opening prose (`FMP_154` named) | — |
| architecture/delegation-matrix.md — Purpose | "Delegation principles" intro | Consolidated twin |
| delegation-matrix.md — Principles | "Delegation principles" table | — |
| delegation-matrix.md — Example scopes | "Delegation principles" review-cadence table | — |
| delegation-matrix.md — Bottom line | Closing paragraph of "Delegation principles" | "Cleaned extraction" footer dropped |

## Diagrams

- `docs/images/diagrams/b02-identity/src/ch05-three-tier-delegation.flow.yaml`
- `docs/images/diagrams/b02-identity/src/ch05-au-assignment.flow.yaml`

## Change log

| Date | Change |
|---|---|
| 2026-10-21 | Extension attribute reconciliation: division AU paragraph now names `extensionAttribute6` (division code, a rule-readable copy of `employeeOrgData.division`) and links the program attribute map. |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Privileged-role review cadence aligned across Books 02 and 04: Tier 0 monthly, other privileged roles quarterly, never self-review alone. The cadence is the program's design; AC-2(j) and AC-6(7) leave the frequency organization-defined; "Monthly or on change" row split into Tier 0 (monthly) and other privileged roles (quarterly) | Delegation principles, review cadence table | restated-as-design | c05-nist-80053 <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; c05-fedramp-ac <https://fedramp.gov/2026/reference/controls/access-control/> |

## Revision 2026-10-29 — companion-guide reconciliation

Finding D3 in the attribute-driven migration guide's verification log (`docs/books/guides/_verification/attribute-driven-migration.md`): the AU registry matched on department display names while Book 01 Ch04, Book 03 Ch06/Ch10 and Book 06 Ch17 say access rules read codes. Rules now read the program attribute map slots (Book 03 Ch06): organization code in `extensionAttribute10`, division code in `extensionAttribute6`. `AU-Enterprise` keeps `(user.department -ne null)`, a population predicate rather than an access rule (row 20). Sources opened on Oct 29, 2026 through the Microsoft Learn documentation service; no personal data sent.

| # | Claim | Source (accessed 2026-10-29) | Old text | New text |
|---|---|---|---|---|
| G1 | Department AU rules read the organization code | Manage rules for dynamic membership groups <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (`extensionAttribute1`–`15` supported for users; `-in` with a bracketed string list; minimize `-contains` and `-match`); administrative-unit rules use the same attributes and syntax: <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> | `(user.department -eq "IT")` … `(user.department -eq "Executive")` (eight rows) | `(user.extensionAttribute10 -in ["IT-CIO","IT-OPS","IT-DEV"])`, `["HR-OPS","HR-BEN"]`, `["FIN-LED","FIN-AP"]`, `["LGL-GC","LGL-CMP"]`, `["ENG-SYS","ENG-NET"]`, `["OPS-FAC","OPS-LOG"]`; `-eq "SLS-ACCT"`, `-eq "EXE-OFC"`; plus a paragraph: codes, not display names; the roll-up form of Book 01 Ch04's node query; the rule changes with the matching group's rule; codes are placeholders |
| G2 | Division AU rules read the division code | Manage rules for dynamic membership groups <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (`extensionAttribute1`–`15` supported for users; `-in` with a bracketed string list; minimize `-contains` and `-match`); administrative-unit rules use the same attributes and syntax: <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> | Table without rules; "Division AUs use a rule that combines the department with the division code the HR feed supplies." | Membership column `(user.extensionAttribute6 -eq "IT-CYBEROPS")`, `"IT-INFRAOPS"`, `"IT-APPDEV"`, `"LGL-GRC"`; "Division AUs read the division code the HR feed supplies. … where an agency's division codes repeat across departments, add the department's organization codes to the rule with `-and`." |
| G3 | Figure `ch05-au-assignment`: attribute and rule shown | design consistency with G1 | Source body "`department` on the user object" and "`(user.department -eq "Finance")`"; fig-alt "the HR-sourced attribute department … user.department equals Finance" | Source body "Organization code in `extensionAttribute10` on the user object" and "Finance's organization codes in `extensionAttribute10`"; fig-alt updated to match. **SVG and PNG need re-render** (`python3 scripts/diagrams/render.py --only ch05-au-assignment`); Graphviz and rsvg-convert weren't available on the editing machine |
| G4 | Restricted management stays a per-AU decision, default no (unchanged; re-verified; Book 06 R07 now follows it) | Restricted management administrative units <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-restricted-management>, Limitations (setting fixed at creation; members can't be managed by PIM, entitlement management, lifecycle workflows or access reviews; 100 per tenant) | unchanged | unchanged |

## Revision 2026-10-29 — four tracks and companion-guide alignment

Added "What the limits mean for the design" (limit, implication, response) under the AU section, merging the series' shared limits content with what the chapter already said, plus one line on which tracks AUs serve. Responses are labeled design guidance. Sources re-fetched on Microsoft Learn on Oct 29, 2026.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| L1 | AUs can't be nested; they contain only users, groups or devices; they scope management, not browsing | Limits table; tracks line | re-verified (carried from the chapter; existing note c05-au-overview) | <https://learn.microsoft.com/entra/identity/role-based-access-control/administrative-units> |
| L2 | Only some roles can be AU-scoped | Limits table | re-verified (carried; c05-assign-roles) | <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-assign-roles> |
| L3 | Dynamic AUs need the global Azure cloud, not Azure Government; GCC pairs with Entra ID in Azure, GCC High and DoD with Azure Government | Limits table | verified (new note c05-gov-pairing); makes the chapter's "a government cloud may have to maintain membership another way" specific | <https://learn.microsoft.com/azure/security/fundamentals/feature-availability#microsoft-365-integration>; <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> (Prerequisites) |
| L4 | At most 100 restricted management AUs; their members can't be managed by PIM, entitlement management, lifecycle workflows or access reviews | Limits table | re-verified (carried; c05-rmau) | <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-restricted-management#limitations> |
| L5 | Arc servers are delegated with Azure RBAC; non-person accountability is owner and sponsor | Tracks line | restated-as-design (links Book 05 Ch09 and the companion guide) | — |
| L6 | Responses: flat AUs generated from one list; custom security attributes and application controls for confidentiality; unscoped roles central or behind PIM; automation job in GCC High or DoD; restrict only by decision, never a large HR population | Limits table | restated-as-design | series limits content |
