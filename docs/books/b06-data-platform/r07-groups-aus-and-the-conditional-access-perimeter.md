---
title: "Runbook R07 — Groups, Administrative Units & the Conditional Access Perimeter"
description: "How to move SQL Server's access-control layer from Active Directory groups to Microsoft Entra: inventory the groups and Conditional Access policies read-only, classify each group by the program's four-type taxonomy, then provision the DBA administrative unit, the dynamic and assigned groups and the group logins, review-required and dry-run first."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 107
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R07 — Groups, Administrative Units & the Conditional Access Perimeter

*The group model survives the move to Entra ID; what changes is who maintains the membership, who may administer it, and what boundary every sign-in has to cross.*

::: {.callout-note}
## In this runbook
The two-phase runbook for SQL Server's access-control layer. Phase 1 inventories the Entra groups and Conditional Access policies read-only and classifies each migrating group into one of four types. Phase 2 provisions the DBA administrative unit first, then the dynamic and assigned groups inside it, then binds each access-bearing group to a SQL Server group login. Every Phase 2 step is review-required, dry-run first and routed through change control.
:::

**Pairs with:** [Chapter 16 — Groups, Roles and How Membership Reaches the Engine](16-groups-roles-and-membership.md) and [Chapter 17 — Dynamic Membership, Delegation and Privileged Access](17-dynamic-membership-delegation-and-privilege.md). Those chapters explain why the group-based access model survives the migration while its lifecycle and outer boundary don't. Inventory is read-only and script-backed. Provisioning groups, administrative units and SQL Server group logins changes production.

## The two phases

Access-control transformation is inventory, then provision. **Inventory** the Active Directory groups that gate SQL Server access and the Entra objects that already exist (read-only, program scripts). **Provision** the Entra targets (attribute-based dynamic groups, assigned groups and the DBA administrative unit) and bind each access-bearing group to a SQL Server login created `FROM EXTERNAL PROVIDER` (review-required, no big-bang).

## Phase 1 — Inventory (read-only, script-backed)

### `Export-FMPEntraGroups` — the Entra group inventory

The program's `FMPIdentityAssessment` module provides `Export-FMPEntraGroups`, which inventories Entra groups and their memberships into a sealed evidence envelope. It reads live through the Microsoft Graph PowerShell cmdlet `Get-MgGroup`,[^r07-get-mggroup] or replays a `-SnapshotPath`, so it can run offline against an export.

| Parameter | Purpose |
|---|---|
| `-TenantId` | Target tenant (live mode) |
| `-SnapshotPath` | Replay a captured Graph export instead of querying live |
| `-IncludeDynamic` | Capture the **`membershipRule`** for dynamic groups (and flag them); without it dynamic groups are listed but the rule is omitted |
| `-OutputPath` | Where the sealed envelope is written |
| `-Cloud` / `-GraphApiVersion` / `-GraphEndpoint` | Cloud-aware endpoint resolution |

The endpoint matters less than the name suggests for the program's target. A Microsoft 365 GCC tenant keeps using the worldwide Graph endpoint, `https://graph.microsoft.com`; only GCC High and DoD use `https://graph.microsoft.us` and `https://dod-graph.microsoft.us`.[^r07-graph-clouds]

Each record carries `id`, `display_name`, **`is_dynamic`**, **`security_enabled`**, **`mail_enabled`**, `membership_rule` (when `-IncludeDynamic` is set and the group is dynamic), `member_count` and `source_fields`. These map to the Graph group properties the classification needs. `securityEnabled` and `mailEnabled` together distinguish the four types; `groupTypes` containing `Unified` marks a Microsoft 365 group, and containing `DynamicMembership` marks a dynamic group whose rule is in `membershipRule`.[^r07-group]

::: {.callout-warning}
## Illustrative, not tested against production
The commands and T-SQL on this page are illustrative. They haven't been tested against a production tenant or instance. The `FMP*` functions and the provisioning adapters are the program's own tooling; their parameters are documented here as the program defines them. Review every command, and run it first in a non-production environment.
:::

```powershell
Import-Module FMPIdentityAssessment
# Live, with dynamic membership rules captured (read-only)
Export-FMPEntraGroups -TenantId <tenant-guid> -IncludeDynamic -OutputPath .\output
# Or offline against a captured snapshot
Export-FMPEntraGroups -SnapshotPath .\snapshots\groups.json -IncludeDynamic -OutputPath .\output
```

### `Export-FMPConditionalAccess` — the perimeter inventory

The same module provides `Export-FMPConditionalAccess`, which reads live through `Get-MgIdentityConditionalAccessPolicy`[^r07-get-mgcap] or replays a `-SnapshotPath`, and emits each policy's `id`, `display_name` and `state`. Use it to confirm the Conditional Access posture that becomes the SQL Server perimeter once every login is an Entra login. Two cautions. First, `state` alone shows whether a policy is on, off or report-only; whether it *covers* SQL Server sign-ins depends on its users and target resources, so review those conditions in the captured policy objects as well. Second, see [The perimeter dividend](#the-perimeter-dividend) for which principals Conditional Access reaches at all.

### Mapping to the four-type taxonomy

[Chapter 16](16-groups-roles-and-membership.md) classifies every migrating Active Directory security group into one of four types (a program design taxonomy). The inventory flags drive the triage:

| Type | Inventory signal | Entra target | SQL Server consequence |
|---|---|---|---|
| **Type 1 — OU-derived** | security-enabled, organizational naming | attribute-based **dynamic** security group | group login (type X) |
| **Type 2 — explicit role assignment** | security-enabled, no organizational derivation | flattened **assigned** security group | group login (type X) |
| **Type 3 — distribution list** | mail-enabled, security **off** | Microsoft 365 group (`securityEnabled: false`) | **no SQL Server login**; SQL Agent operator email only |
| **Type 4 — mail-enabled security** | security **and** mail enabled | **split**: Microsoft 365 group (mail) plus assigned security group (access), correlated by an extension attribute | group login on the security half only |

The source table called each group login "type-E". That's corrected here: in `sys.server_principals`, a login for an Entra user or application is type `E` (`EXTERNAL_LOGIN`), and a login for an Entra group is type `X` (`EXTERNAL_GROUP`).[^r07-server-principals] The Type 4 split also follows a Graph constraint: Graph can create Microsoft 365 groups, dynamic groups and security groups,[^r07-group] so the program provisions the mail and access halves as two objects rather than one mail-enabled security group.

**`New-FMPEntraGroupClassification`**, in the program's `FMPSqlServerMigration` module, is the deterministic type-assignment pass over the envelope. It reads the `Export-FMPEntraGroups` output and assigns each group exactly one type from its observable shape (`groupTypes`, `mail_enabled`, `security_enabled`, `membership_rule`). It attaches each group's target state, transformation, provisioning adapter and a `becomes_sql_login` flag, which is true for the access-backing types: assigned security, dynamic, and the access half of a mail-enabled split. A group with no usable signal lands in `review` rather than being mis-typed.

```powershell
Import-Module FMPSqlServerMigration
New-FMPEntraGroupClassification -GroupExportPath .\output\entra-groups.json -OutputPath .\output\group-classification.json
```

It is **read-only derivation** over the reviewed export. It reads no live directory and writes only the sealed classification, which is the input both the provisioning adapters and the group-login emitter consume.

## Phase 2 — Provision (review-required)

::: {.callout-warning}
## These change production identity
Creating Entra groups, dynamic membership rules, administrative units, scoped role assignments and SQL Server group logins all alter live access control. Provision through the program's modernization adapters in **dry-run** (their default), review the planned writes, then apply through change control. Graph writes must go to the endpoint for the tenant's cloud; for a GCC tenant that's the worldwide endpoint.[^r07-graph-clouds]
:::

### Sequencing — the administrative unit comes first

The program makes administrative unit (AU) provisioning a **prerequisite** for migrating Type 2 explicit-role groups: a Type 2 group can be managed under least privilege only after the AU and its scoped role assignment exist. The order is fixed:

1. **Provision the DBA administrative unit**, with restricted management turned on when the AU is created. The setting can't be changed afterward.[^r07-rmau]
2. **Establish the scoped role assignment** for the DBA team lead: Groups Administrator scoped to that AU. The source named User Administrator. That role can also manage group membership at AU scope, but it adds user-management rights the DBA lead doesn't need; Groups Administrator is the narrower built-in role that manages groups in the assigned AU.[^r07-au-roles][^r07-au] If the assignment is made to a group rather than a person, that group must be role-assignable, which means assigned membership, not dynamic.[^r07-au-roles][^r07-group] In the program's design the assignment is eligible, not standing, and is activated through PIM ([Book 04](../b04-access/index.md)).
3. **Create the access groups inside the already-scoped boundary**, add them to the AU explicitly (an AU can hold users and devices by rule, but groups only by explicit addition),[^r07-au] and bind their SQL Server group logins.

Provisioning the AU before the groups it will hold avoids a transitional window in which new Entra groups exist but only a tenant-wide administrator can manage them, which is exactly the concentration of privilege the exercise removes.

### Provision the DBA administrative unit (`entra-admin-units`)

The AU is provisioned through the program's **`entra-admin-units`** modernization adapter (`FMP_154`) and aligned to the organizational boundary the DBA team owns, so the delegation boundary and the access boundary describe the same scope. AUs can't be nested; a "division inside department" structure is a naming convention, not containment ([Book 02, Chapter 05](../b02-identity/05-delegation-without-ous.md)).[^r07-au] The adapter enforces the program's restricted-management invariant and its cross-reference integrity checks, which reject an AU whose referenced groups or attribute values don't resolve. Run it dry-run first, review the planned AU and the scoped assignment, then apply.

Restricted management protects the AU's members, but it isn't absolute, and it has costs that shape this design:[^r07-rmau]

- Tenant-scoped Global Administrators and Privileged Role Administrators **can't modify** the groups inside, but they **can** manage the AU itself, including assigning a role over it to themselves. Those actions are recorded in the Entra audit logs, so the source's phrase "a Global Admin cannot bypass the division-level delegation" is corrected to "can't bypass it without an audited self-assignment."
- Only users, devices and security groups can be members. The Microsoft 365 halves of Type 3 and Type 4 groups stay outside the AU ([Book 02, Chapter 05](../b02-identity/05-delegation-without-ous.md)).
- Users and groups in a restricted management AU can't be managed by Microsoft Entra ID Governance features: PIM, entitlement management, lifecycle workflows and access reviews. A SQL Server access group placed inside one can't be access-reviewed or made PIM-eligible as a group, so decide per group whether protection from tenant administrators or governance coverage matters more. [Chapter 17](17-dynamic-membership-delegation-and-privilege.md) discusses the trade-off.
- A tenant can have at most 100 restricted management AUs.

### Provision attribute-based dynamic groups (`entra-dynamic-groups`)

Type 1 (OU-derived) groups become dynamic security groups whose `membershipRule` references organizational attributes, provisioned through the program's **`entra-dynamic-groups`** adapter (`FMP_152`). Attribute values are populated by the HR-synchronization pipeline, not maintained by hand ([Book 03](../b03-hr-identity/index.md)). Migrating a Type 1 group is therefore two things: confirm the attribute infrastructure is in place, and author the rule that expresses the original group's organizational logic, for example `(user.department -eq "Finance") -and (user.jobTitle -contains "DBA")`. Both operators are supported in rules, but Microsoft recommends minimizing `-contains` and `-match` for processing efficiency, and a rule that uses `-contains` has to be entered in the text box rather than the rule builder.[^r07-dynamic] Dynamic membership needs a Microsoft Entra ID P1 license for every unique user who is a member of one or more dynamic groups.[^r07-dynamic] Validate the rule against the captured inventory before applying.

Type 2 (explicit-role) groups are flat **assigned** security groups: create the group, populate it from the Active Directory source members, and manage membership thereafter through the AU-scoped role assignment rather than a help desk ticket. Type 3 groups (distribution lists) become mail-only Microsoft 365 groups with **no** SQL Server login; only the SQL Agent operator's notification address is repointed. Type 4 groups (mail-enabled security) split into the two-object pattern, correlated by an extension attribute recorded in the migration audit.

### Bind the group to a SQL Server group login

Each access-bearing group (Types 1 and 2, and the security half of Type 4) is bound to a SQL Server login created `FROM EXTERNAL PROVIDER`. It's the same mechanism [Runbook R05](r05-login-migration-and-parallel-run.md) uses for individual principals, applied to the **group**, which is the preferred target because it removes per-user churn. SQL Server 2022 and later supports logins for Entra users, groups and applications with this syntax, and a database user created `FROM LOGIN` inherits from it.[^r07-create-login][^r07-entra-setup]

```sql
-- Group login (review-required; preconditions per Runbook R05: SQL Server 2022 or later,
-- Microsoft Entra authentication configured through Azure Arc, validated token)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'sql-app-readers')
    CREATE LOGIN [sql-app-readers] FROM EXTERNAL PROVIDER;   -- appears as type X, EXTERNAL_GROUP
GO
-- Map the database user and grant the role the Active Directory group previously held
USE [AppDb];
GO
CREATE USER [sql-app-readers] FOR LOGIN [sql-app-readers];
ALTER ROLE [db_datareader] ADD MEMBER [sql-app-readers];
GO
```

Microsoft Entra authentication on SQL Server can also be configured without Azure Arc, by hand, on Windows;[^r07-entra-sql] the program requires the Arc path because it is the managed, repeatable one ([Runbook R04](r04-arc-deployment-and-managed-identity.md)). A display name that isn't unique in the tenant makes `CREATE LOGIN` fail; the `WITH OBJECT_ID` extension resolves it.[^r07-nonunique]

**`New-FMPGroupLoginScript`**, in the `FMPSqlServerMigration` module, generates these statements from the classified inventory, idempotent and dry-run, the way Runbook R05 generates per-principal logins from the audit CSV. It emits a `CREATE LOGIN ... FROM EXTERNAL PROVIDER` only for groups whose `becomes_sql_login` flag is true; mail-only distribution or Unified groups and `review` groups appear as commented-out lines, so a distribution list can never become a SQL Server login. Like the R05 emitter it has no `-Server` or `-Execute` surface. It opens no SQL connection, and the script is the deliverable.

```powershell
New-FMPGroupLoginScript -ClassificationPath .\output\group-classification.json -OutputPath .\output\create-group-logins.sql
```

The database-user mapping and role grant above (the `USE [AppDb]; CREATE USER ...; ALTER ROLE ...` block) stays a review-required, per-database step. Which database role each group inherits is a grant decision the emitter deliberately leaves to change control.

## Verification and rollback

- **Verify dynamic membership** before binding any SQL Server login to it: confirm the expected principals appear in the dynamic group. A too-broad rule grants SQL Server access too broadly.
- **Verify the AU boundary.** The scoped role assignment can manage the groups *inside* the AU and is denied on groups outside it and on tenant-level settings.[^r07-au-roles]
- **Verify the perimeter.** A human sign-in from a non-compliant device or from outside the trusted named locations is denied a token. Re-run `Export-FMPConditionalAccess` and check that the enabled policies' target resources include the SQL resource.
- **Verify the logins.** `SELECT name, type, type_desc FROM sys.server_principals WHERE type IN ('E', 'X');` lists the Entra logins; group logins show `X`.[^r07-server-principals]
- **Rollback.** Entra groups, dynamic rules and AUs created by the adapters are reversible (delete the object or revert the rule); the SQL Server group login is reversible by `DROP LOGIN` once no user depends on it. Because the AU is restricted and provisioned first, the delegation can be validated long before any group lands inside it.

## The perimeter dividend

Once every SQL Server login is backed by an Entra principal, Conditional Access becomes the outer perimeter for human SQL Server access: device compliance, named locations and sign-in risk are evaluated when the token is issued. A single surviving Windows-backed login is a path around all of it. That's why the closure conditions in [Chapter 20](20-the-closure-condition.md) and [Runbook R09](r09-continuous-monitoring-and-closure.md) include MFA through Conditional Access for every human principal, and why the group transformation is a precondition for the zero-trust posture rather than a relabeling.

Three facts bound the dividend:

- **Which resource the policy targets.** Tokens for SQL Server's Entra authentication use the audience `https://database.windows.net/`,[^r07-entra-sql] the same resource as Azure SQL, for which Microsoft documents Conditional Access against the **Azure SQL Database** enterprise application.[^r07-ca-sql] Microsoft documents Conditional Access for Azure SQL Database, Azure SQL Managed Instance and Azure Synapse, not for SQL Server enabled by Azure Arc by name. That the same target governs Arc-enabled SQL Server sign-ins is the program's working assumption, to be confirmed in the pilot. Policies that target *all resources* reach it either way; in the [Book 04 Conditional Access library](../b04-access/07-the-conditional-access-policy-library.md) that includes CA006, CA007, CA018 and CA022.
- **Which principals it reaches.** Microsoft's Azure SQL guidance notes that Conditional Access policies apply to users, not to programmatic connections such as service principals and managed identities.[^r07-ca-sql] Application connections ([Runbook R08](r08-application-chain-and-connection-strings.md)) are protected by their credential type and by workload-identity controls (in Book 04, CA037 for high-risk service principals), not by device or MFA conditions.
- **What it costs.** Sign-in-risk conditions need Microsoft Entra ID P2 (Book 04 marks CA014 and CA019 as P2); compliance, location and MFA conditions need P1.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R06 — NTLM Detection & Remediation](r06-ntlm-detection-and-remediation.md) · [Book index](index.md) · [Next: Runbook R08 — The Application Chain & Connection-String Migration →](r08-application-chain-and-connection-strings.md)
:::

[^r07-get-mggroup]: Microsoft Learn, "Get-MgGroup" (Microsoft.Graph.Groups module), <https://learn.microsoft.com/powershell/module/microsoft.graph.groups/get-mggroup> (accessed Oct 20, 2026).
[^r07-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments" (GCC continues to use `https://graph.microsoft.com`; GCC High uses `https://graph.microsoft.us`; DoD uses `https://dod-graph.microsoft.us`), <https://learn.microsoft.com/graph/deployments> (accessed Oct 20, 2026).
[^r07-group]: Microsoft Learn, "group resource type" (Microsoft Graph v1.0: `groupTypes`, `mailEnabled`, `securityEnabled`, `membershipRule`, `isAssignableToRole`; Create supports Microsoft 365, dynamic and security groups), <https://learn.microsoft.com/graph/api/resources/group> (accessed Oct 20, 2026).
[^r07-get-mgcap]: Microsoft Learn, "Get-MgIdentityConditionalAccessPolicy" (Microsoft.Graph.Identity.SignIns module), <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/get-mgidentityconditionalaccesspolicy> (accessed Oct 20, 2026).
[^r07-server-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)" (type E = external login or application from Microsoft Entra ID; type X = external group from Microsoft Entra ID), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Oct 20, 2026).
[^r07-rmau]: Microsoft Learn, "Restricted management administrative units in Microsoft Entra ID" (who can modify objects; who can manage the units; audit logs; limitations), <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-restricted-management> (accessed Oct 20, 2026).
[^r07-au-roles]: Microsoft Learn, "Assign Microsoft Entra roles," section "Assign roles with administrative unit scope" (Groups Administrator "Can manage all aspects of groups in the assigned administrative unit only"; assignable principals are users, role-assignable groups and service principals), <https://learn.microsoft.com/entra/identity/role-based-access-control/manage-roles-portal> (accessed Oct 20, 2026).
[^r07-au]: Microsoft Learn, "Administrative units in Microsoft Entra ID" (supported scenarios; groups can't be added by rule; what an AU-scoped User Administrator can do for a group), <https://learn.microsoft.com/entra/identity/role-based-access-control/administrative-units> (accessed Oct 20, 2026).
[^r07-dynamic]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID" (supported operators; guidance to minimize `Match` and `Contains`; rule builder limits; P1 licensing), <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 20, 2026).
[^r07-create-login]: Microsoft Learn, "CREATE LOGIN (Transact-SQL)," example K, "Create a login for a Microsoft Entra group," <https://learn.microsoft.com/sql/t-sql/statements/create-login-transact-sql> (accessed Oct 20, 2026).
[^r07-entra-setup]: Microsoft Learn, "Tutorial: Set up Microsoft Entra authentication for SQL Server with app registration," section "Create logins and users," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-setup-tutorial> (accessed Oct 20, 2026).
[^r07-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server" (setup with and without Azure Arc; access token audience `https://database.windows.net/`), <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).
[^r07-nonunique]: Microsoft Learn, "Microsoft Entra logins and users with nonunique display names," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/authentication-microsoft-entra-create-users-with-nonunique-names> (accessed Oct 20, 2026).
[^r07-ca-sql]: Microsoft Learn, "Conditional access" (Azure SQL Database, Azure SQL Managed Instance and Azure Synapse Analytics; target resource *Azure SQL Database*; policies apply only to users, not to service principals and managed identities; P1 required), <https://learn.microsoft.com/azure/azure-sql/database/conditional-access-configure> (accessed Oct 20, 2026).
