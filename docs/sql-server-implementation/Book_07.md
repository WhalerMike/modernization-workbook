---
title: "Implementation Book 07 — Groups, Administrative Units & the Conditional Access Perimeter"
subtitle: "Inventory the AD groups behind SQL access with the real Entra group export, classify them by the the program decision four-type taxonomy with New-FMPEntraGroupClassification, then provision the organizational-attribute model dynamic groups and the DBA Administrative Unit and emit the group-logins — review-required, dry-run first"
description: "How to transform the access-control layer of SQL Server from AD groups to Entra. Documents the shipped read-only inventory (FMPIdentityAssessment Export-FMPEntraGroups / Export-FMPConditionalAccess, including dynamic-rule capture), the the program decision four-type classification New-FMPEntraGroupClassification derives from it, and New-FMPGroupLoginScript, which emits the dry-run CREATE LOGIN FROM EXTERNAL PROVIDER for the access-backing groups — then the review-required provisioning patterns routed through the entra-dynamic-groups (FMP_152) and entra-admin-units (FMP_154) modernization adapters, with the AU-before-groups sequencing the program decision requires."
doc-type: sql-server-implementation-book
audience: [Technical, Customer]
family: sql-server-implementation
series-order: 07
status: active
canon-source: "src/uiao/canon/the directory modernization program"
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

::: {.callout-note}
## the organizational-attribute model examples in this chapter predate Hybrid-C+Path

The dynamic-group rule examples below use the retired Model A/B form — the whole
the organizational-attribute model as one composite string in a single slot. the program decision
replaced that with named facets (`extensionAttribute1` is the **region** facet),
and the program decision moved the
derived canonical path to `extensionAttribute15`. A *subtree* rule reads
`(user.extensionAttribute15 -startsWith "Region=NCR|Department=Finance|")` —
anchored at `Region=`, because the derived path is composed region, department,
division in that order, and with the trailing delimiter, which is mandatory. A
rule for "all of Finance, in every region" is not a subtree at all: it is the
facet predicate `(user.extensionAttribute2 -eq "Finance")`.

The examples are retained as written because the *pattern* they teach —
OU-derived groups become dynamic groups keyed on organizational attributes — is
unchanged. Do not copy the slot numbers or value shapes; the authoritative map is
[`codebook.yaml`].
:::

<!-- orgpath-slot-allow-file: teaching examples deliberately retained in the retired Model A/B form; reader-facing banner above (issue #1432) -->

::: {.content-visible when-format="docx"}
# Implementation Book 07 — Groups, Administrative Units & the Conditional Access Perimeter
:::

![Groups are classified before they become logins: export the group estate, classify each group by what it should govern, emit the group-login script, and bound it with the Conditional Access perimeter.](images/book07-image-01-groups-and-aus.png){#fig-impl-book07 fig-alt="A schematic on a white background. Three stages flow left to right under teal arrows: Export-FMPEntraGroups (with Export-FMPConditionalAccess; export, read-only), New-FMPEntraGroupClassification (role-bearing → SQL login; structural / stale → not a login), and New-FMPGroupLoginScript (emits a CREATE LOGIN FROM EXTERNAL PROVIDER script). Below, a dashed blue 'Conditional Access perimeter' encloses three boxes: 'group → SQL login', 'administrative units — scoped delegation', and 'CA policy — device · MFA · network bound'. Federal navy, teal and blue palette; no photographs." width="100%"}

::: {.callout-tip}
## Download this book
**[Book_07.docx](Book_07.docx)** — this entire book as a single Word document, images included. Regenerated on every site deploy.
:::

::: {.callout-note}
Companion to **narrative Book 07**. The narrative explains why the group-based access model survives the migration but its lifecycle and outer boundary do not; this book is the runbook. **Inventory is read-only and script-backed. Provisioning groups, Administrative Units, and SQL group-logins changes production** and is review-required throughout — dry-run / `-WhatIf` first, capture the planned change, route through change control. (the program decision, the program decision, the program decision, the program decision)
:::

## The two phases

Access-control transformation is inventory-then-provision. **Inventory** the AD groups that gate SQL access and the Entra objects that already exist (read-only, shipped scripts). **Provision** the Entra targets — the organizational-attribute model dynamic groups, the assigned groups, the DBA Administrative Unit — and bind each access-bearing group to a SQL Server type-E login (review-required, no big-bang).

## Phase 1 — Inventory (read-only, script-backed)

### `Export-FMPEntraGroups` — the Entra group inventory

The `FMPIdentityAssessment` module (`tools/powershell/FMPIdentityAssessment/`) ships `Export-FMPEntraGroups`, which inventories Entra groups and memberships into a sealed evidence envelope. It reads live via `Get-MgGroup` or replays a `-SnapshotPath`, so it runs offline against an export.

| Parameter | Purpose |
|---|---|
| `-TenantId` | Target tenant (live mode) |
| `-SnapshotPath` | Replay a captured Graph export instead of querying live |
| `-IncludeDynamic` | Capture the **`membershipRule`** for dynamic groups (and flag them); without it dynamic groups are listed but the rule is omitted |
| `-OutputPath` | Where the sealed envelope is written |
| `-Cloud` / `-GraphApiVersion` / `-GraphEndpoint` | Cloud-aware endpoint resolution (GCC-Moderate uses the cloud-correct Graph base via `Resolve-FMPGraphBase`) |

Each record carries `id`, `display_name`, **`is_dynamic`**, **`security_enabled`**, **`mail_enabled`**, `membership_rule` (when `-IncludeDynamic` and dynamic), `member_count`, and `source_fields`. Those three flags are exactly the signal the the program decision classification needs: `security_enabled` + `mail_enabled` together distinguish the four types, and `is_dynamic` / `membership_rule` show whether a group is already the organizational-attribute model-driven.

```powershell
Import-Module ./tools/powershell/FMPIdentityAssessment
# Live, with dynamic membership rules captured — read-only
Export-FMPEntraGroups -TenantId <tenant-guid> -IncludeDynamic -OutputPath .\output
# Or offline against a captured snapshot
Export-FMPEntraGroups -SnapshotPath .\snapshots\groups.json -IncludeDynamic -OutputPath .\output
```

### `Export-FMPConditionalAccess` — the perimeter inventory

The same module ships `Export-FMPConditionalAccess` (live `Get-MgIdentityConditionalAccessPolicy` or `-SnapshotPath`), emitting per-policy `id`, `display_name`, and `state`. Use it to confirm the Conditional Access posture that will become the SQL access perimeter once every login is type-E — the narrative's binary outer boundary. (the program decision)

### Mapping to the the program decision four-type taxonomy

Narrative Book 07 Chapter 1 classifies every migrating AD security group into one of four types; the group inventory flags drive the triage:

| the program decision type | Inventory signal | Entra target | SQL consequence |
|---|---|---|---|
| **Type 1 — OU-derived** | security-enabled, organizational naming | the organizational-attribute model **dynamic** security group (the program decision) | type-E login for the group |
| **Type 2 — explicit role-assignment** | security-enabled, no org-derivation | flattened **assigned** security group | type-E login for the group |
| **Type 3 — distribution list** | mail-enabled, security **off** | Microsoft 365 Group (`securityEnabled: false`) | **no SQL login** — Agent operator email only |
| **Type 4 — mail-enabled security** | security **and** mail enabled | **split**: M365 Group (mail) + assigned security group (access), correlated by an the organizational-attribute model attribute | type-E login on the security half only |

**`New-FMPEntraGroupClassification`** (`tools/powershell/FMPSqlServerMigration/`) is the deterministic type-assignment pass over the envelope. It reads the `Export-FMPEntraGroups` output and assigns each group exactly one the program decision type from its observable shape (`groupTypes` / `mail_enabled` / `security_enabled` / `membership_rule`), attaching each group's target state, transformation, provisioning adapter, and a `becomes_sql_login` flag (true for the access-backing types — assigned security, OrgTree dynamic, and the access half of a mail-enabled split). A group with no usable signal lands in `review` rather than being mis-typed.

```powershell
Import-Module ./tools/powershell/FMPSqlServerMigration
New-FMPEntraGroupClassification -GroupExportPath .\output\entra-groups.json -OutputPath .\output\group-classification.json
```

It is **read-only derivation** over the reviewed export — it reads no live directory and writes only the sealed classification, which is the input both the provisioning adapters and the group-login emitter consume.

## Phase 2 — Provision (review-required)

::: {.callout-warning}
## These change production identity
Creating Entra groups, dynamic-membership rules, Administrative Units, scoped role assignments, and SQL Server type-E group-logins all alter live access control. Provision through the modernization adapters in **dry-run** (their default), review the planned writes, then apply through change control. Microsoft Graph writes resolve the cloud-correct endpoint via `resolve_graph_base` (GCC-Moderate per the program decision) and require the `[api]` extra (AGENTS.md).
:::

### Sequencing — the AU comes first

the program decision makes Administrative Unit provisioning a **prerequisite** for the Type 2 explicit-role group migration: a Type 2 group can only be managed under least privilege after the AU and its scoped role assignment exist. The order is fixed:

1. **Provision the DBA Administrative Unit** (confirmed restricted-management, so a Global Admin cannot bypass the division-level delegation).
2. **Establish the scoped role assignment** (User Administrator scoped to that AU) for the DBA team lead.
3. **Create the access groups inside the already-scoped boundary** and bind their SQL Server type-E logins.

Provisioning the AU before the groups it will hold avoids the transitional window in which new Entra groups exist but only a tenant-wide administrator can manage them — the exact concentration of privilege the exercise removes.

### Provision the DBA Administrative Unit (entra-admin-units / FMP_154)

The Administrative Unit is provisioned through the **`entra-admin-units`** modernization adapter (FMP_154 in `src/uiao/canon/modernization-registry.yaml`), aligned to the the organizational-attribute model boundary the DBA team owns so the delegation boundary and the access boundary describe the same scope. the program decision's restricted-management invariant and cross-canon integrity checks (which reject an AU whose referenced groups or the organizational-attribute model values do not resolve to live canon) are enforced by the adapter. Run it dry-run first, review the planned AU and the scoped assignment, then apply.

### Provision the organizational-attribute model dynamic groups (entra-dynamic-groups / FMP_152)

Type 1 (OU-derived) groups become dynamic security groups whose `membershipRule` references the organizational-attribute model attributes — provisioned through the **`entra-dynamic-groups`** modernization adapter (FMP_152). the organizational-attribute model attribute values are populated by the the organizational-attribute model HR-synchronization pipeline, not managed by hand, so migrating a Type 1 group is two things: confirm the the organizational-attribute model attribute infrastructure is in place (an the organizational-attribute model-narrative dependency), and author the rule that expresses the original group's organizational logic — for example `(user.extensionAttribute5 -eq "ORG/DEPT/TEAM") -and (user.jobTitle -contains "DBA")`. Validate the rule against the captured inventory before applying. (the program decision)

Type 2 (explicit-role) groups are flat **assigned** security groups: create the group, populate from the AD source members, and manage membership thereafter through the AU-scoped role assignment rather than a helpdesk ticket. Type 3 (distribution lists) become mail-only M365 Groups with **no** SQL login — only the SQL Agent operator's notification address is repointed. Type 4 (mail-enabled security) splits into the two-object pattern, correlated by an the organizational-attribute model extension attribute recorded in the migration audit.

### Bind the group to a SQL Server type-E login

Each access-bearing group (Types 1, 2, and the security half of 4) is bound to a SQL Server type-E login — the same `FROM EXTERNAL PROVIDER` mechanism Book 05 documents, but for the **group**, which is the preferred target because it removes per-user churn:

```sql
-- Group-based type-E login (review-required; preconditions per Book 05 — SQL 2022+, Arc, validated token)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'sql-app-readers')
    CREATE LOGIN [sql-app-readers] FROM EXTERNAL PROVIDER;
GO
-- Map the database user and grant the role the AD group previously held
USE [AppDb];
CREATE USER [sql-app-readers] FOR LOGIN [sql-app-readers];
ALTER ROLE [db_datareader] ADD MEMBER [sql-app-readers];
```

**`New-FMPGroupLoginScript`** (`tools/powershell/FMPSqlServerMigration/`) generates these statements from the the program decision-classified inventory, idempotent and dry-run, the way Book 05 generates per-principal logins from the audit CSV. It emits a `CREATE LOGIN ... FROM EXTERNAL PROVIDER` only for groups whose `becomes_sql_login` flag is true; mail-only distribution / Unified groups and `review` groups appear as commented-out lines, so a distribution list can never become a SQL login. Like Book 05's emitter it has no `-Server` or `-Execute` surface — it opens no SQL connection and the script is the deliverable.

```powershell
New-FMPGroupLoginScript -ClassificationPath .\output\group-classification.json -OutputPath .\output\create-group-logins.sql
```

The database-user mapping and role grant above (the `USE [AppDb]; CREATE USER ...; ALTER ROLE ...` block) stays a review-required, per-database step: which database role each group inherits is a grant decision the emitter deliberately leaves to change control.

## Verification & rollback

- **Verify dynamic membership** resolved correctly: confirm expected principals appear in the dynamic group before binding any SQL login to it (a too-broad rule grants SQL access too broadly).
- **Verify the AU boundary**: the scoped role assignment can manage members of groups *inside* the AU and is denied on groups outside it and on tenant-level identity actions.
- **Verify the perimeter**: a connection from a non-compliant device or outside Named Locations is denied a token (re-run `Export-FMPConditionalAccess` to confirm the policy state covers the SQL resource).
- **Rollback**: Entra groups, dynamic rules, and AUs created by the adapters are reversible (delete the object / revert the rule); the SQL group-login is reversible by `DROP LOGIN` once no user depends on it. Because the AU is restricted and provisioned first, the delegation can be validated long before any group lands inside it.

## The perimeter dividend

Once every SQL login is a type-E login backed by an Entra principal, Conditional Access becomes the binary outer perimeter for all SQL access — device compliance, Named Locations, sign-in risk — and a single surviving Windows-backed login is a bypass path around all of it. That is why Book 09's closure conditions include MFA-via-Conditional-Access for every human principal, and why the group transformation here is a precondition for the zero-trust posture, not a cosmetic relabeling. (the program decision)

---

*Companion to narrative Book 07. Inventory script-backed: `tools/powershell/FMPIdentityAssessment` (`Export-FMPEntraGroups`, `Export-FMPConditionalAccess`). Classification + group-login emission: `tools/powershell/FMPSqlServerMigration` (`New-FMPEntraGroupClassification`, `New-FMPGroupLoginScript`). Provisioning via the `entra-admin-units` (FMP_154) and `entra-dynamic-groups` (FMP_152) modernization adapters — review-required. Canon: the program decision, the program decision, the program decision, the program decision, the directory modernization program §3.2.*
