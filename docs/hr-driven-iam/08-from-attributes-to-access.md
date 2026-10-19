---
title: "Chapter 08 — From Attributes to Access"
description: "The derivation chain from worker record to entitlement: rules for dynamic membership written against the canonical schema, administrative units for delegation, access packages and access reviews routed to the supervisor of record, and where PIM and assigned groups take over."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 8
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
aliases:
  - /docs/architecture/dynamic-group-library.html
---

# Chapter 08 — From Attributes to Access

*In a dynamic group, whoever writes the attribute controls access.*

::: {.callout-note}
## In this chapter
The derivation chain. Valid rule patterns against the canonical schema, with Microsoft's limits. Administrative units. Access packages and access reviews that route to the supervisor of record. Where dynamic membership stops: privileged roles, PIM and break-glass.
:::

## The derivation chain

**Worker record → stamped attributes → dynamic groups → entitlements.**

Rules for dynamic membership evaluate HR-derived attributes, so nobody joins these groups and nobody forgets to leave one. Access packages bundle entitlements behind eligibility rules and approvals that route to the supervisor of record. Conditional Access and application roles consume the same groups. Three properties follow:

- **Membership is computed.** There's no group owner to lobby, no ticket to lose, no offboarding step to forget. A mover's access converges on the new assignment within the provisioning and rule-processing cycle.
- **Every entitlement has a *because*.** Access exists because an attribute satisfied a rule; the attribute exists because an HR record asserted it; the record has an author, a date and a business act behind it. That chain can contribute to the authorization and account-management evidence associated with AC-2, and it can be queried end to end.
- **Roles and attributes stop competing.** Roles define what a position may touch; attributes prove which position the person holds. Both resolve against the same upstream record.

The chain is only as good as its weakest writer. Microsoft's guidance is to review write permissions for every attribute a rule uses, in Entra ID and in any source directory, before using it in a security-sensitive group.[^c08-dyn-rules] Chapter 05 sets the only writer of the access attributes: the provisioning service.

## Rule patterns

Write rules against the canonical schema of Chapter 05: native attributes where a rule can read them, and the three coded access attributes otherwise. Every rule that grants access excludes disabled accounts and guests explicitly.

| Pattern | Rule | Use |
|---|---|---|
| Organization | `(user.accountEnabled -eq true) -and (user.userType -eq "Member") -and (user.extensionAttribute10 -eq "FIN-LED")` | Organization-scoped access |
| Several organizations | `(user.accountEnabled -eq true) -and (user.userType -eq "Member") -and (user.extensionAttribute10 -in ["FIN-LED","FIN-AP"])` | Roll-up without chains of `-or` |
| Organization and worker type | `(user.accountEnabled -eq true) -and (user.extensionAttribute10 -eq "FIN-LED") -and (user.extensionAttribute11 -eq "EMP")` | Employees only |
| Exclusion | `(user.accountEnabled -eq true) -and (user.extensionAttribute10 -eq "FIN-LED") -and (user.extensionAttribute11 -ne "CTR")` | Everyone but contractors |
| Position category | `(user.accountEnabled -eq true) -and (user.userType -eq "Member") -and (user.extensionAttribute12 -eq "ANALYST")` | Role-like access across organizations |
| Legal employer | `(user.accountEnabled -eq true) -and (user.companyName -eq "Example Bureau")` | Component-wide baseline |
| Direct reports | `Direct Reports for "<manager object ID>"` | A supervisor's team, maintained from `manager` |
| Device class | `(device.deviceOSType -eq "Windows") -and (device.deviceOwnership -eq "Company")` | Device policy |

: Rule patterns against the canonical schema[^c08-dyn-rules] {.striped .hover}

The codes (`FIN-LED`, `EMP`, `CTR`, `ANALYST`) are placeholders for the agency's own code lists. The `-in` operator takes a bracketed list.[^c08-dyn-rules] The direct-reports rule uses the manager's object ID, and the manager is also added to the group.[^c08-dyn-rules] Rules can't read `employeeType`, `employeeOrgData` or `manager`, which is why worker type and organization have coded carriers.[^c08-dyn-rules]

### Limits and efficiency

- A rule body can't exceed 3,072 characters, and a tenant can have at most 15,000 dynamic membership groups.[^c08-dyn-rules]
- Prefer `-eq`, then `-startsWith` or `-endsWith`, over `-match` and `-contains`; replace chains of `-or` on one property with `-in`.[^c08-dyn-efficient]
- Dynamic membership needs an Entra ID P1 license for each unique user who is a member of one or more dynamic groups.[^c08-dyn-rules]

### Governance of the rules themselves

- Code lists are controlled vocabularies owned by HR. A value that isn't on the list is a drift event (Chapter 09).
- Every rule that grants access is validated, run in shadow against the group it replaces, and gated on a verified pilot cohort before it's attached to a resource.
- A group's membership must be explainable from attributes alone. A manual addition to a dynamic group isn't possible; a manual change to an attribute is drift.

## Administrative units

Administrative units scope delegated administration (for example, a help desk that may reset passwords only for one component) without making policy read a container path. An administrative unit's user membership can itself be a dynamic rule, using the same canonical attributes; such units hold users or devices, not both, and not groups. Each administrative-unit administrator and member needs Entra ID P1, and the feature is available in the global Azure cloud, which is where GCC tenants run.[^c08-au-dynamic][^c08-crl-gcc]

Restricted management administrative units protect sensitive objects from tenant-level administrators. The setting must be applied when the unit is created and can't be changed afterward.[^c08-au-restricted]

## Access packages and access reviews

- **Access packages** carry the entitlements that a rule can't decide alone. An approval policy for users in the directory can name **Manager as approver**,[^c08-ap-approval] which resolves to the `manager` relationship the HR feed maintains.
- **Access reviews** verify what remains. Reviews can be assigned to managers,[^c08-ar-overview] and the review population can be scoped to exceptions — access outside the derivation baseline — instead of four hundred rows a reviewer will approve in bulk. A rejected entitlement is removed by fixing the attribute, the rule or the exception that produced it, so the same wrong answer can't regrow.
- **Separation-of-duties checks** read the same rails: whether two roles are held by the same *person* (the `employeeId` anchor) and whether an approver reports to the requester (the `manager` chain).

## Where dynamic membership stops

- **Privileged roles use assigned groups.** Role-assignable groups require assigned membership, which Microsoft notes already removes the attribute-write risk.[^c08-dyn-rules]
- **PIM for Groups doesn't take dynamic groups.** Any security group or Microsoft 365 group can be enabled for PIM for Groups except dynamic membership groups and groups synchronized from on-premises.[^c08-pim-groups] Privileged access is assigned, cloud-only and time-bound; HR attributes decide *eligibility* (through an access package), not standing membership.
- **Break-glass accounts depend on none of this.** Emergency access accounts are cloud-only, excluded from HR-driven rules and lifecycle workflows, and monitored.

The [SQL Server Identity Transformation workbook, Book 07](../case-studies/sql-server-narrative/Book_07_CPT_02.md) applies this chapter to SQL Server logins and database roles, including naming, shadow testing and rollout gates.


::: {.callout-tip}
## Continue the series
[← Previous: Chapter 07 — Credentials and Certificates](07-credentials-and-certificates.md) · [Index](index.md) · [Next: Chapter 09 — Drift, Metrics and Evidence →](09-drift-metrics-and-evidence.md)
:::

[^c08-dyn-rules]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership> (accessed Oct 19, 2026).
[^c08-dyn-efficient]: Microsoft Learn, "Create simpler and faster rules for dynamic membership groups," <https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-rule-more-efficient> (accessed Oct 19, 2026).
[^c08-au-dynamic]: Microsoft Learn, "Manage users or devices for an administrative unit with rules for dynamic membership groups," <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-members-dynamic> (accessed Oct 19, 2026).
[^c08-crl-gcc]: Microsoft Learn, "Understand Microsoft Entra certificate-based authentication certificate revocation list" (FAQ: "Azure Global includes GCC"), <https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-certificate-revocation-list> (accessed Oct 19, 2026).
[^c08-au-restricted]: Microsoft Learn, "Restricted management administrative units in Microsoft Entra ID," <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-restricted-management> (accessed Oct 19, 2026).
[^c08-ap-approval]: Microsoft Learn, "Change approval settings for an access package in entitlement management," <https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-approval-policy> (accessed Oct 19, 2026).
[^c08-ar-overview]: Microsoft Learn, "What are access reviews?," <https://learn.microsoft.com/en-us/entra/id-governance/access-reviews-overview> (accessed Oct 19, 2026).
[^c08-pim-groups]: Microsoft Learn, "Privileged Identity Management (PIM) for Groups," <https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/concept-pim-for-groups> (accessed Oct 19, 2026).
