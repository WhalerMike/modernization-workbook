---
title: "Chapter 17 — Dynamic Membership, Delegation and Privileged Access"
description: "What makes attribute-driven SQL Server access safe: the attribute source, rule design and testing, administrative-unit delegation, PIM for Groups, access reviews, break-glass, monitoring and the FedRAMP Moderate position."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 17
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 17 — Dynamic Membership, Delegation and Privileged Access

*A dynamic group is a policy that executes itself. It's only as trustworthy as the data it reads and the people who can change it.*

::: {.callout-note}
## In this chapter
Why the attribute a rule reads is itself an access control. Which user attributes Entra dynamic rules can use, and where those values should come from. How to write, name, test and change rules safely within Microsoft's processing limits. How administrative units scope DBA delegation, and where restricted management collides with governance tooling. Why privileged SQL Server access belongs in PIM for Groups rather than in a dynamic rule. How access reviews, break-glass and monitoring close the loop. What a FedRAMP Moderate system in the commercial cloud can adopt as written, and why preview features stay out of production.
:::

[Chapter 16](16-groups-roles-and-membership.md) turned the organization-derived groups of the old estate into dynamic groups, whose membership Entra ID recomputes from a rule over coded attributes, such as `user.extensionAttribute10 -in ["FIN-LED","FIN-AP"]`, whenever attributes change. No ticket, no DBA action. This chapter covers what has to be true for that to be safe. [Book 03](../b03-hr-identity/index.md) covers the HR attribute pipeline itself, and [Book 04](../b04-access/index.md) covers PIM and Conditional Access for the whole tenant; this chapter applies both to SQL Server.

## The attribute is the access control

::: {.callout-important title="Principle: the attribute writer controls access"}
The person or process that can write the attribute a dynamic rule reads controls access to everything that rule grants. Write access to an access-driving attribute is therefore a privileged permission, governed and reviewed like any other.
:::

![HR-sourced attributes drive dynamic membership, and no group grants access until its rule is proven.](../../images/sql-server/diagrams/svg/book-07-ch02-attribute-pipeline.svg){fig-alt="The HR system of record writes coded user attributes into Entra ID through provisioning; a dynamic group rule uses them, and the group gets a SQL Server login only after the rule passes a rollout gate."}

Under assigned membership, whoever can add a member controls access; under dynamic membership, whoever can write the attribute does. Microsoft's dynamic-group guidance says to review who can write an attribute in Entra ID *and* in any source directory that syncs it, especially on-premises attributes that users can edit on their own objects (SELF write), and to restrict self-service write access to attributes used in security-sensitive groups.[^c17-dyn]

The single **source of truth** for access-driving attributes is therefore the HR system of record, which knows when someone joins, moves or leaves and has the governance to make those changes defensible. The path from HR to the directory is automated and one-way:

- **For identities still mastered in Active Directory**, HR-driven provisioning populates AD, and Microsoft Entra Connect or Cloud Sync carries the values into Entra ID.[^c17-hr][^c17-connect]
- **For cloud-mastered identities**, Entra ID's inbound provisioning writes them directly. There are built-in integrations for cloud HR applications such as Workday and SuccessFactors, and API-driven inbound provisioning brings identities from any system of record that can produce a feed.[^c17-hr][^c17-api]

Either way, a provisioning service account writes the attribute, and self-service and helpdesk write access to it is removed.

## Choosing the attributes

Entra dynamic rules can read a fixed set of user properties. Microsoft's current list includes `department`, `companyName`, `jobTitle`, `employeeId`, `employeeHireDate` (preview), `userType`, `accountEnabled`, and location fields such as `city`, `country` and `usageLocation`. Rules can also use the fifteen `extensionAttribute1`–`extensionAttribute15` values, which are commonly synced from on-premises AD, and **custom extension properties** (directory extension properties, `user.extension_<appId>_<name>`), which can be synced from AD or created through Microsoft Graph.[^c17-dyn] Two cautions apply. First, not every attribute on the user object is usable: `employeeType`, for example, isn't in the supported-properties list at the time of writing, so check that list before designing around any attribute. Second, multi-value extension properties aren't supported in rules.[^c17-dyn]

Good rule inputs are HR-owned **codes** that change only when the business fact changes: an organization code, not a display string someone will eventually retype. Publish a small, documented set of HR-sourced access attributes (organization code, position category, employment status) and write rules only against those. The program's carriers are fixed in the [program attribute map](../b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map): organization code in `extensionAttribute10` and position category in `extensionAttribute12`, with account state in the native `accountEnabled`. A directory extension property works the same way where an agency has no free extension attribute.

::: {.callout-warning}
The rule below is illustrative: the codes are placeholders for the agency's own code lists. Validate any rule before it governs access, as described below.
:::

```text
(user.accountEnabled -eq true) -and (user.userType -eq "Member")
  -and (user.extensionAttribute10 -in ["FIN-LED","FIN-AP"])
  -and (user.extensionAttribute12 -eq "ANALYST")
```

A rule body can't exceed 3,072 characters, and a tenant can have at most 15,000 dynamic membership groups.[^c17-dyn] Prefer `-eq`, `-startsWith` and `-in` over `-match`, `-contains` and chains of `-or`; Microsoft says such rules process faster, and they review more easily.[^c17-processing] Every access rule excludes disabled accounts and guests explicitly, as above.

Dynamic membership needs a **Microsoft Entra ID P1** license for each unique user who is a member of one or more dynamic groups; licenses needn't be assigned to those users, but the tenant must hold enough to cover them.[^c17-dyn] Most agency tenants have P1 through their Microsoft 365 or Enterprise Mobility + Security licensing; confirm the count before rollout.

## Writing, naming and testing rules

Two practices keep a dynamic group from becoming an untested access grant.

The first is **naming and ownership.** Entra's group naming policy applies only to Microsoft 365 groups,[^c17-naming] so the convention for SQL Server access groups is enforced by the provisioning automation or a review gate. A pattern such as `SQL-<env>-<instance or app>-<database>-<role>` carries Chapter 16's one-group-one-role meaning. Each description records the rule's business intent, the owning team and the last change record; each group has at least two named owners.

The second is **testing before granting.** A rule should be proven before its group is attached to a SQL Server login:

1. **Validate.** The *Validate Rules* tab in the Entra admin center evaluates a rule against up to 20 chosen users or devices at a time and shows, expression by expression, why each one is or isn't a member.[^c17-validate]
2. **Shadow.** Create the group first with no login attached. Once processing reports *Update complete*, compare its membership with the legacy AD group it replaces, and explain every difference before the login is created.[^c17-status]
3. **Watch processing.** For a rule change on a group that's already live, check the group's processing status and its audit-log entries for the additions and removals the change caused. A rule change removes existing members who no longer match.[^c17-status][^c17-troubleshoot]
4. **Pause bulk changes.** For HR reorganizations or bulk attribute loads (Microsoft's examples are changes to more than 500 groups or more than 20,000 membership changes), Microsoft recommends pausing nonessential dynamic groups, waiting at least 24 hours for processing to catch up, then resuming in phases.[^c17-processing]

The **rollout gate** for the whole pattern follows from this. No dynamic group grants production access until the access attributes are populated and verified for a pilot cohort, and its rule has been validated, shadowed and reconciled against the group it replaces.

## Scoped delegation with administrative units

Someone still has to manage the assigned groups and the dynamic groups' owners and descriptions, and tenant-wide Groups Administrator for a DBA lead would just move the privilege concentration. **Administrative units** solve this: Groups Administrator assigned *at administrative-unit scope* manages only the groups in that unit, including their names and membership, but not the users inside them. The scoped administrator needs P1; members of a regular administrative unit need only Free.[^c17-au] Draw one administrative unit per DBA team, application portfolio or data owner, so a team's authority matches its accountability.

**Restricted management** administrative units go further. Only administrators assigned at the unit's scope can modify its objects; tenant-scoped administrators, Global Administrators included, can't unless they assign themselves to that scope, which is an audited event.[^c17-rmau] That is attractive for protecting access groups, but it has costs that matter here:

- Groups and users in a restricted management administrative unit **can't be managed with PIM, entitlement management, lifecycle workflows or access reviews.**[^c17-rmau]
- Among groups, restricted management units accept only security groups; Microsoft 365, mail-enabled security and distribution groups can't be members.[^c17-rmau]
- The setting must be chosen when the unit is created and can't be changed afterward, and a tenant can have at most 100 such units.[^c17-rmau]

Use regular administrative units for groups that need governance tooling; reserve restricted management for cases where tamper-resistance outweighs reviewability. Dynamic membership for administrative units is available in the global Azure cloud but not in specialized clouds such as Azure Government, needs P1 for each dynamic member, and selects users or devices, not groups. Access groups are therefore added to an administrative unit explicitly or by automation.[^c17-au-dyn]

## Privileged access belongs in PIM, not in a rule

![Which groups may be dynamic, which belong in PIM, how delegation is scoped, and the break-glass path that bypasses all of it.](../../images/sql-server/diagrams/svg/book-07-ch02-privileged-access.svg){fig-alt="Standard reader, writer and app roles may use dynamic or assigned groups with access reviews; privileged roles use cloud-only, role-assignable groups activated just in time through PIM for Groups; administrative units scope delegation; two cloud-only break-glass accounts stand outside all of it."}

Groups mapped to `sysadmin`, the instance's Entra administrator and `db_owner` on sensitive databases are never dynamic. Microsoft makes the same judgment for directory roles: role-assignable groups must have assigned membership, which Microsoft notes already removes the attribute-write risk.[^c17-dyn][^c17-rag] The SQL Server equivalent is **PIM for Groups**: DBAs are *eligible*, not standing, members, and each logged activation is time-bound and requires MFA and, where policy demands, approval and justification.[^c17-pim] This is the same just-in-time model [Book 04](../b04-access/index.md) applies to directory and Azure roles.

PIM for Groups can be enabled for any security or Microsoft 365 group except dynamic membership groups and groups synchronized from on-premises,[^c17-pim] so privileged groups are cloud-only and assigned by construction. Making them role-assignable as well adds protection: only a Privileged Authentication Administrator or higher can change the credentials, reset MFA or modify sensitive attributes of their members and owners, and a tenant can have at most 500 role-assignable groups.[^c17-rag] Every user eligible for membership or ownership through PIM for Groups needs a **Microsoft Entra ID P2** or **Microsoft Entra ID Governance** license, as do approvers and reviewers.[^c17-pim-assign][^c17-gov-lic] Access reviews are an Entra ID Governance feature for the member users who review or are reviewed; the review capabilities that were generally available in P2 still operate under P2, but Microsoft is adding no new governance features to P2.[^c17-gov-lic]

## Access reviews

A dynamic group's membership can't be edited by hand, and Microsoft confirms that access review decisions don't change membership in dynamic groups.[^c17-complete] A member-by-member review therefore has no remediation path. **Review the rule and its inputs instead:** on a fixed cadence the data owner confirms the rule still expresses the intended population, and the identity team confirms its attributes are still HR-sourced and write-protected.

For **assigned** groups and PIM eligible assignments, use Entra access reviews. A recurring review can be set to remove access when reviewers don't respond and to apply results automatically, and its results are the AC-2 evidence an assessor will ask for.[^c17-ar-create] Microsoft warns that combining *Remove access* for non-responses with auto-apply can revoke everyone's access if reviewers fail to respond, so pair it with fallback reviewers.[^c17-ar-create]

## Break-glass

Two kinds of break-glass access are needed, and they must not depend on the machinery they exist to bypass. At the **tenant** level, Microsoft's guidance for emergency access accounts applies:[^c17-emergency]

- at least two cloud-only accounts on the `.onmicrosoft.com` domain, with phishing-resistant credentials (passkeys or certificate-based authentication) different from normal admin accounts, stored securely in separate locations;
- excluded from the Conditional Access policies that block or restrict sign-in;
- alerting on every sign-in and audit event;
- validated at least every 90 days.

At the **SQL Server** level, [Chapter 12](12-the-engine-authentication-decision.md)'s position stands. The built-in `sa` is disabled and renamed, and any retained emergency path is a documented exception with its own monitoring. Neither emergency path may sit in a dynamic group or rely on HR data, Entra Connect or rule processing being healthy.

## Monitoring

The access model is now spread across HR, the provisioning service, Entra ID and the engine, so monitoring has to cover each hand-off:

- **Entra audit logs** record rule edits, membership additions and removals, PIM activations, and administrative-unit and role-assignment changes, including changes to restricted management units.[^c17-rmau] A change to the rule of any SQL Server access group should raise an alert.
- **Entra sign-in logs** show every token issued for SQL Server and the Conditional Access result for each policy that applied.[^c17-signins]
- **SQL Server Audit** records successful and failed logins (`SUCCESSFUL_LOGIN_GROUP`, `FAILED_LOGIN_GROUP`) and changes to server and database role membership (`SERVER_ROLE_MEMBER_CHANGE_GROUP`, `DATABASE_ROLE_MEMBER_CHANGE_GROUP`).[^c17-sqlaudit] Write the audit to the Windows Security log or a file, not the Application log, which any authenticated user can write.[^c17-sqlaudit-db]

The continuous audit described in [Chapter 20](20-the-closure-condition.md) should reconcile all three. Every type E and type X principal on an instance must map to a known user, application or group. Every group must follow the naming convention and have an owner. No privileged role may have a standing member that PIM doesn't account for.

## FedRAMP Moderate in the commercial cloud

The series assumes Microsoft's commercial cloud (Entra ID at `login.microsoftonline.com`, Azure public US regions) under an agency authorization at FedRAMP Moderate.

**What the cloud authorization covers.** Azure's public cloud is authorized at FedRAMP High for its US regions; Microsoft's documentation calls this a High P-ATO, the term FedRAMP used before its 2026 rules replaced authorization designations with certification classes ([Book 10, Chapter 03](../b10-cloud-boundary/03-what-changed-at-fedramp.md)).[^c17-fedramp] The Moderate baseline is a subset of the High baseline, so a Moderate system can draw on High-authorized services; whether it inherits them is the agency's call. The public-cloud audit-scope list includes the services this chapter relies on:[^c17-scope]

- Microsoft Entra ID (Free, P1 and P2), Microsoft Entra ID Governance, the Microsoft Entra provisioning service and Microsoft Entra multifactor authentication
- Microsoft Graph
- Azure Arc-enabled servers and Azure Arc-enabled SQL Server
- Azure Monitor (including Log Analytics) and Microsoft Sentinel

The list names services, not features; confirm dynamic groups, administrative units, PIM for Groups and access reviews against the agency's boundary and Microsoft's FedRAMP package, which agencies request through the FedRAMP Marketplace with a .gov or .mil address.[^c17-fedramp] The SQL Server hosts and Arc agent are part of the agency's own system, and a third-party HR system has its own authorization. As Microsoft's Entra FedRAMP guidance says, Azure provides the capability to meet the controls; completing the configuration is the customer's responsibility.[^c17-fedramp-entra]

**Keep previews out of the production access path.** Entra ID previews are offered under the preview terms in Microsoft's Product Terms for online services; public previews may have limited support, normal service level agreements don't apply, and a preview can be cancelled before it reaches general availability.[^c17-preview] Microsoft describes the `memberOf` operator, for example, as a preview not intended for production use.[^c17-memberof] For a Moderate system, that rules out:

- the `memberOf` dynamic-rule operator (a preview that ends on November 3, 2026; see [Chapter 16](16-groups-roles-and-membership.md));
- preview user properties in membership rules, such as `employeeHireDate`;[^c17-dyn]
- any PIM, access-review or provisioning capability that the Entra admin center or Microsoft Learn still marks as preview.

Check for the preview label at adoption and again at the rollout gate.

**What is in scope as recommended.** The generally available pieces of this design are delivered by services on the High list:

- Entra group logins and Entra authentication for SQL Server through Azure Arc. Microsoft notes that the SQL Server instance needs access to the Azure public cloud for this.[^c17-mi]
- Dynamic security groups built on supported properties and directory extension attributes
- Regular and restricted management administrative units, including dynamic administrative-unit membership for users in the global cloud
- PIM for Groups and access reviews, licensed through P2 or Entra ID Governance
- Emergency access accounts and Log Analytics monitoring

Treat any feature not verifiable at feature level as unconfirmed until the agency's ATO documentation says otherwise.

::: {.callout-note title="What this chapter establishes"}
1. Whoever can write the attribute a rule reads controls access, so only HR-driven provisioning writes access attributes.
2. Rules are validated, shadowed against the groups they replace and piloted; privileged groups are assigned, cloud-only and governed by PIM for Groups and access reviews.
3. Only generally available features sit in the production access path, and break-glass paths depend on none of this machinery.
:::

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 16 — Groups, Roles and How Membership Reaches the Engine](16-groups-roles-and-membership.md) · [Book index](index.md) · [Next: Chapter 18 — The Four-Class Pattern Applied to SQL-Consuming Applications →](18-the-four-class-pattern-for-applications.md)
:::

[^c17-dyn]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID" (supported properties; extension attributes and custom extension properties; attribute write-permission guidance; 3,072-character and 15,000-group limits; P1 licensing), <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 20, 2026).
[^c17-hr]: Microsoft Learn, "Cloud HR application to Microsoft Entra user provisioning," <https://learn.microsoft.com/entra/identity/app-provisioning/plan-cloud-hr-provision> (accessed Oct 20, 2026).
[^c17-connect]: Microsoft Learn, "What is Microsoft Entra Connect?," <https://learn.microsoft.com/entra/identity/hybrid/connect/whatis-azure-ad-connect> (accessed Oct 20, 2026).
[^c17-api]: Microsoft Learn, "API-driven inbound provisioning concepts," <https://learn.microsoft.com/entra/identity/app-provisioning/inbound-provisioning-api-concepts> (accessed Oct 20, 2026).
[^c17-processing]: Microsoft Learn, "Understand and manage dynamic group processing in Microsoft Entra ID," section "Best practices for dynamic membership groups in your tenant," <https://learn.microsoft.com/entra/identity/users/manage-dynamic-group> (accessed Oct 20, 2026).
[^c17-naming]: Microsoft Learn, "Enforce a naming policy on Microsoft 365 groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-naming-policy> (accessed Oct 20, 2026).
[^c17-validate]: Microsoft Learn, "Validate rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-validation> (accessed Oct 20, 2026).
[^c17-status]: Microsoft Learn, "Create or update a dynamic membership group in Microsoft Entra ID," section "Check the processing status for a rule," <https://learn.microsoft.com/entra/identity/users/groups-create-rule> (accessed Oct 20, 2026).
[^c17-troubleshoot]: Microsoft Learn, "Troubleshoot and resolve groups issues," section "Troubleshoot dynamic membership groups," <https://learn.microsoft.com/entra/identity/users/groups-troubleshooting> (accessed Oct 20, 2026).
[^c17-au]: Microsoft Learn, "Administrative units in Microsoft Entra ID," sections "Groups" and "License requirements," <https://learn.microsoft.com/entra/identity/role-based-access-control/administrative-units> (accessed Oct 20, 2026).
[^c17-rmau]: Microsoft Learn, "Restricted management administrative units in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-restricted-management> (accessed Oct 20, 2026).
[^c17-au-dyn]: Microsoft Learn, "Manage users or devices for an administrative unit with rules for dynamic membership groups," <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> (accessed Oct 20, 2026).
[^c17-rag]: Microsoft Learn, "Use Microsoft Entra groups to manage role assignments," <https://learn.microsoft.com/entra/identity/role-based-access-control/groups-concept> (accessed Oct 20, 2026).
[^c17-pim]: Microsoft Learn, "Privileged Identity Management (PIM) for Groups," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/concept-pim-for-groups> (accessed Oct 20, 2026).
[^c17-pim-assign]: Microsoft Learn, "Assign eligibility for a group in Privileged Identity Management," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/groups-assign-member-owner> (accessed Oct 20, 2026).
[^c17-gov-lic]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals," <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (accessed Oct 20, 2026).
[^c17-complete]: Microsoft Learn, "Complete an access review of groups and applications in access reviews," section "Apply the changes," <https://learn.microsoft.com/entra/id-governance/complete-access-review> (accessed Oct 20, 2026).
[^c17-ar-create]: Microsoft Learn, "Create an access review of groups and applications in Microsoft Entra ID," <https://learn.microsoft.com/entra/id-governance/create-access-review> (accessed Oct 20, 2026).
[^c17-emergency]: Microsoft Learn, "Manage emergency access accounts in Microsoft Entra ID," section "Security guardrails summary," <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Oct 20, 2026).
[^c17-signins]: Microsoft Learn, "View applied Conditional Access details in the Microsoft Entra activity logs," <https://learn.microsoft.com/entra/identity/monitoring-health/how-to-view-applied-conditional-access-policies> (accessed Oct 20, 2026).
[^c17-sqlaudit]: Microsoft Learn, "SQL Server Audit action groups and actions," <https://learn.microsoft.com/sql/relational-databases/security/auditing/sql-server-audit-action-groups-and-actions> (accessed Oct 20, 2026).
[^c17-sqlaudit-db]: Microsoft Learn, "SQL Server Audit (Database Engine)," section "Target," <https://learn.microsoft.com/sql/relational-databases/security/auditing/sql-server-audit-database-engine> (accessed Oct 20, 2026).
[^c17-fedramp]: Microsoft Learn, "Federal Risk and Authorization Management Program (FedRAMP)" (Azure compliance offering: FedRAMP High P-ATO for Azure public US regions; requesting the package), <https://learn.microsoft.com/azure/compliance/offerings/offering-fedramp> (accessed Oct 20, 2026).
[^c17-scope]: Microsoft Learn, "Azure, Dynamics 365, Microsoft 365, and Power Platform services compliance scope," section "Azure public services by audit scope," <https://learn.microsoft.com/azure/azure-government/compliance/azure-services-in-fedramp-auditscope> (accessed Oct 20, 2026).
[^c17-fedramp-entra]: Microsoft Learn, "Configure Microsoft Entra ID to meet FedRAMP High Impact level," <https://learn.microsoft.com/entra/standards/configure-for-fedramp-high-impact> (accessed Oct 20, 2026).
[^c17-preview]: Microsoft Learn, "Microsoft Entra ID preview program information," <https://learn.microsoft.com/entra/fundamentals/licensing-preview-terms> (accessed Oct 20, 2026).
[^c17-memberof]: Microsoft Learn, "Configure dynamic membership groups with the memberOf operator in the Entra Admin Center (preview)," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-member-of> (accessed Oct 20, 2026).
[^c17-mi]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc," section "Limitations," <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Oct 20, 2026).
