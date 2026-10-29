---
title: "Chapter 16 — Groups, Roles and How Membership Reaches the Engine"
description: "How an Entra security group becomes a SQL Server login and one database role, why the group model stays flat, when membership changes take effect, and where Conditional Access does and doesn't reach."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 16
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 16 — Groups, Roles and How Membership Reaches the Engine

*Group-based authorization survives the migration. Its plumbing, its timing and its outer boundary don't.*

::: {.callout-note}
## In this chapter
How an Entra security group becomes a SQL Server login and a database role member. Why each group should grant exactly one role, and why the group model should stay flat. When a membership change actually takes effect at the engine. How the four kinds of AD group found in a SQL Server estate migrate. Why Conditional Access becomes the outer perimeter for people once every login is Entra-backed, and what covers application identities instead.
:::

::: {.callout-tip}
## Where this part of the book goes next
The migration moves SQL Server's groups from Active Directory to Microsoft Entra ID, but it keeps group-based authorization. What changes is who maintains the groups and how. A group that maps to a single database role can keep itself current from HR-sourced attributes, which removes the helpdesk ticket. That only works if the attributes are trustworthy, the rules are tested, delegation is scoped and privileged access is just in time. Chapters 16 and 17 cover that design and the governance it needs; in the program's dependency chain this is step 5, introducing Entra principals. The working procedure is [Runbook R07](r07-groups-aus-and-the-conditional-access-perimeter.md).

People's group-derived logins are the HR track. Service accounts and application principals are the [non-person identity track](../guides/attribute-driven-migration.md#non-person-identity-track), which has no HR record and runs on its owner's record instead.
:::

![The directory half of SQL Server access moves to Entra ID; the engine half barely changes.](../../images/sql-server/diagrams/svg/book-07-two-halves-of-access.svg){fig-alt="Outside the engine, the HR system of record feeds user attributes in Entra ID and Entra security groups; inside the engine, a type X group login maps to a user-defined database role and its permissions, unchanged from before."}

SQL Server's access model has two halves: roles and permissions inside the engine, and the directory outside it that decides group membership. For twenty years the outside half was Active Directory: a DBA mapped `DOMAIN\SQL-Reporting-Readers` to a login and role, and whoever controlled that AD group controlled access.

The transformation replaces the outside half and leaves the inside nearly untouched. Roles, `GRANT` and `DENY`, ownership chains and module signing work as before. What changes is the principal (an Entra group), the proof of membership (an Entra token, not a Kerberos ticket) and when a membership change takes effect.

## How an Entra group becomes SQL Server access

![How one Entra group becomes exactly one database role.](../../images/sql-server/diagrams/svg/book-07-ch01-group-to-login-mapping.svg){fig-alt="An Entra security group named by environment, instance, database and role becomes a type X group login in master, a database user, and a member of exactly one user-defined database role."}

::: {.callout-tip title="Established in Chapters 11–12"}
`CREATE LOGIN … FROM EXTERNAL PROVIDER` creates logins for Entra users and applications (type E, `EXTERNAL_LOGIN`) and for Entra groups (type X, `EXTERNAL_GROUP`).
:::

A group enters SQL Server as an AD group did: as a server login created from the group's name, then a database user (`CREATE USER … FROM LOGIN`) added to a role. For users the principal name is the user principal name; for groups and applications it's the name of the Entra object.[^c16-tutorial] The continuous audit in [Chapter 20](20-the-closure-condition.md) must count type X as well as type E (`SELECT * FROM sys.server_principals WHERE type IN ('E','X')`), because group logins are where most access should live.[^c16-tutorial]

The instance's Microsoft Entra administrator, chosen when Entra authentication is set up through Azure Arc, becomes `sysadmin` on the instance.[^c16-tutorial] In any sizable estate it should be a group ([Chapter 17](17-dynamic-membership-delegation-and-privilege.md)). On SQL Server 2025, the instance's managed identity needs the Microsoft Graph application permissions `User.Read.All`, `GroupMember.Read.All` and `Application.Read.All`, assigned directly to each identity; only a Privileged Role Administrator or higher can grant them. That is an identity-team step, not a DBA step.[^c16-graph-perms] Microsoft mentions the Directory Readers role as an alternative for many machines but doesn't recommend it where least privilege is required.[^c16-graph-perms] Every Entra connection to SQL Server also requires an encrypted connection, so the instance needs a TLS certificate its clients trust.[^c16-tutorial]

::: {.callout-warning}
The T-SQL below is illustrative and hasn't been tested against a production instance. Review it, and run it first in a non-production environment.
:::

```sql
-- Instance level: one login per Entra group
CREATE LOGIN [SQL-PRD-FIN01-Ledger-Reader] FROM EXTERNAL PROVIDER;

-- Database level: the group becomes a member of exactly one role
USE Ledger;
CREATE USER [SQL-PRD-FIN01-Ledger-Reader] FROM LOGIN [SQL-PRD-FIN01-Ledger-Reader];
ALTER ROLE ledger_reader ADD MEMBER [SQL-PRD-FIN01-Ledger-Reader];
```

[Runbook R07](r07-groups-aus-and-the-conditional-access-perimeter.md) carries the full procedure. Authorization inside the engine isn't redesigned; only the principal changes.

## One group, one role

The most consequential design decision in this part of the book is the simplest: **each Entra group grants exactly one role, on one database, in one environment.** A user who reads the ledger and runs the month-end job belongs to two groups.

The rule pays off three ways. The group name fully states what it grants, so an access review can be answered without opening SQL Server Management Studio.[^c16-ar] Revoking one capability never revokes another. And dynamic membership becomes tractable: "who should read the ledger?" can be written as a rule; "whoever this legacy group happened to include" can't.

Permissions go to user-defined database roles, never directly to group users, and `db_owner` and `sysadmin` are kept for the few who need them. Every legacy group mapped to `db_owner` "because the application needed it" is a finding to resolve before its replacement is created.

## Flat by design

AD estates are full of nested groups. Don't rebuild that tree in Entra ID; the platform's constraints point to a flat model.

- **Dynamic groups can't contain groups.** A dynamic rule selects users or devices by attribute, never other groups.[^c16-dyn]
- **The `memberOf` operator is ending.** It was the preview workaround for building a dynamic group from other groups. Microsoft has announced that its public preview ends on November 3, 2026. After that date, groups that use it stop updating and stay in their last known state, and Microsoft says to remove or replace every use before then.[^c16-memberof]
- **Role-assignable groups can't nest.** These are the groups with the strongest protection against privilege escalation, and a group can't be added as a member of one.[^c16-rag]
- **Group claims are capped.** Applications that read group membership straight from the token get at most 200 groups in a JWT (150 in a SAML assertion), counting nested groups; above that they receive an overage indicator and must query Microsoft Graph instead.[^c16-claims]
- **Nested-group evaluation isn't documented for SQL Server.** Microsoft's SQL Server documentation doesn't describe how nested Entra group membership is evaluated for an on-premises instance's group logins. This is the program's reading of the documentation, not a Microsoft statement.

Nesting builds on behavior that is unsupported, ending or undocumented. A flat model costs a few more groups and gives up nothing: each role-mapped group lists members directly, by rule or assignment, and several populations needing one role share one rule. Where a nested chain is unavoidable, test it on the target instance version first.

## When a change takes effect

![The chain between an HR change and the engine, and the urgent path that doesn't wait for it.](../../images/sql-server/diagrams/svg/book-07-ch01-when-a-change-takes-effect.svg){fig-alt="Routine changes pass through rule processing, token lifetime and open sessions, so they can take hours; urgent removal disables the Entra account, revokes sign-in sessions and ends SQL sessions directly."}

Under Windows Authentication a membership change arrived with the next Kerberos ticket, usually the next logon. The Entra chain is longer:

1. **Rule processing.** A dynamic group is recalculated when a relevant attribute changes. Microsoft documents that changes are usually processed within a few hours, but that processing can take more than 24 hours depending on tenant size, the number of changes, rule complexity and operator choice.[^c16-processing]
2. **Token lifetime.** An access token already issued to the user stays valid until it expires. By default that's a random value between 60 and 90 minutes.[^c16-token]
3. **Session and pool lifetime.** An open SQL Server session keeps the security context it was established with. A connection pool can keep that session open for hours.

That latency is acceptable for routine joiners, movers and leavers, and often beats the ticket queue it replaces. Urgent removal doesn't wait for a rule. Disable the Entra account and revoke the user's sessions, which Microsoft lists as the two Entra steps for revoking access; then end the user's SQL Server sessions (`KILL`, or disable the individual or group login if the threat is broader).[^c16-revoke] Microsoft also notes that an access token already issued can outlive the revocation for up to its lifetime, which is why the SQL step is needed.[^c16-revoke] Write this path into the operations runbook before the first dynamic group grants production access.

## Migrating the four AD group patterns

Groups in a long-lived SQL Server estate fall into four patterns:

- **Organization-derived access groups**, kept in step with the org chart by hand, become **dynamic** groups whose rules read HR-maintained codes, such as the organization code in `extensionAttribute10` and the position category in `extensionAttribute12` from the [program attribute map](../b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map), or a directory extension property, not display strings such as `department` or `jobTitle` ([Chapter 17](17-dynamic-membership-delegation-and-privilege.md#choosing-the-attributes)).
- **Explicit role-assignment groups** such as `PROD-SQL-SYSADMIN` reflect specific people given a specific permission, so no rule should define them. They become flattened **assigned** groups managed by a delegated administrator or, for privileged roles, PIM ([Chapter 17](17-dynamic-membership-delegation-and-privilege.md)).
- **Distribution lists** for SQL Server Agent notifications become mail-only groups; the operator address is updated and no login is created.
- **Mail-enabled security groups** split into a mail-only group and an assigned security group, with the pairing recorded in both descriptions and the migration record.

## Conditional Access as the outer perimeter

Once every login is Entra-backed, every user connection needs a token, and every user token request passes Conditional Access. Conditional Access is Microsoft's policy engine for those requests: a policy can block a sign-in or require multifactor authentication, a compliant device or a particular location, and it can act on sign-in risk from Microsoft Entra ID Protection.[^c16-ca][^c16-idp] A non-compliant device, a sign-in outside named locations or a high-risk sign-in is refused a token, so the connection never opens.

Application identities are a different case. Conditional Access policies scoped to users don't block service principals. Conditional Access for workload identities covers only single-tenant service principals registered in the tenant, needs Workload ID Premium licenses, and doesn't cover managed identities at all.[^c16-ca-wid] For managed identities the perimeter is who can request the host's token, Azure role assignments and access reviews, which [Chapter 19](19-connection-string-migration.md) and [Chapter 17](17-dynamic-membership-delegation-and-privilege.md) cover.

None of this reaches a Windows or SQL-authenticated login, so for people the perimeter is binary: one surviving Windows login bypasses every policy. Privileged-access workstations, bastions, segmentation and vaulting are legitimate interim controls, but none evaluates identity, device and risk per connection. [Chapter 12](12-the-engine-authentication-decision.md) therefore treats each surviving legacy login as a documented, sunset-dated exception. In the program's mapping, a surviving Windows-authenticated login is also an IA-2 gap ([Appendix A](appendix-a-requirements-mapping.md#mapping-by-part)) and an AD-retirement dependency, because it authenticates only while Active Directory does.

::: {.callout-note title="What this chapter establishes"}
1. An Entra group reaches SQL Server as a type X login and grants exactly one role, on one database, in one environment.
2. The group model stays flat, and membership changes reach the engine only after rule processing, token expiry and session turnover, so urgent removal needs its own runbook.
3. Each kind of AD group maps to a specific Entra replacement. Conditional Access then sits in front of every user login; managed identities need other controls.
:::

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 15 — The Three Phases of NTLM Elimination for SQL Server](15-the-three-phases-of-ntlm-elimination.md) · [Book index](index.md) · [Next: Chapter 17 — Dynamic Membership, Delegation and Privileged Access →](17-dynamic-membership-delegation-and-privilege.md)
:::

[^c16-tutorial]: Microsoft Learn, "Tutorial: Set up Microsoft Entra authentication for SQL Server enabled by Azure Arc," section "Create logins and users," <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> (accessed Oct 20, 2026).
[^c16-graph-perms]: Microsoft Learn, "Set up managed identity and Microsoft Entra authentication for SQL Server enabled by Azure Arc," section "Grant application permissions to the identity," <https://learn.microsoft.com/sql/sql-server/azure-arc/microsoft-entra-authentication-with-managed-identity> (accessed Oct 20, 2026).
[^c16-ar]: Microsoft Learn, "What are access reviews?," <https://learn.microsoft.com/entra/id-governance/access-reviews-overview> (accessed Oct 20, 2026).
[^c16-dyn]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 20, 2026).
[^c16-memberof]: Microsoft Learn, "Configure dynamic membership groups with the memberOf operator in the Entra Admin Center (preview)," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-member-of> (accessed Oct 20, 2026).
[^c16-rag]: Microsoft Learn, "Use Microsoft Entra groups to manage role assignments," section "How are role-assignable groups protected?," <https://learn.microsoft.com/entra/identity/role-based-access-control/groups-concept> (accessed Oct 20, 2026).
[^c16-claims]: Microsoft Learn, "Configure group claims for applications by using Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-fed-group-claims> (accessed Oct 20, 2026).
[^c16-processing]: Microsoft Learn, "Understand and manage dynamic group processing in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/manage-dynamic-group> (accessed Oct 20, 2026).
[^c16-token]: Microsoft Learn, "Access tokens in the Microsoft identity platform," section "Token lifetime," <https://learn.microsoft.com/entra/identity-platform/access-tokens> (accessed Oct 20, 2026).
[^c16-revoke]: Microsoft Learn, "Revoke user access in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/users-revoke-access> (accessed Oct 20, 2026).
[^c16-ca]: Microsoft Learn, "What is Conditional Access?," <https://learn.microsoft.com/entra/identity/conditional-access/overview> (accessed Oct 20, 2026).
[^c16-idp]: Microsoft Learn, "What is Microsoft Entra ID Protection?," <https://learn.microsoft.com/entra/id-protection/overview-identity-protection> (accessed Oct 20, 2026).
[^c16-ca-wid]: Microsoft Learn, "Conditional Access for workload identities," <https://learn.microsoft.com/entra/identity/conditional-access/workload-identity> (accessed Oct 20, 2026).
