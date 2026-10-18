---
title: "Dynamic Membership, Delegation, and Privileged Access"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "07"
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 2 — Dynamic Membership, Delegation, and Privileged Access

*A dynamic group is a policy that executes itself. It is only as trustworthy as the data it reads and the people who can change it.*

::: {.callout-note}
## In this chapter
Why the attribute a rule reads is itself an access control. Which user attributes Entra dynamic rules can use, and where those values should come from. How to write, name, test, and change rules safely within Microsoft's processing limits. How administrative units scope DBA delegation, and where restricted management collides with governance tooling. Why privileged SQL Server access belongs in PIM for Groups rather than in a dynamic rule. How access reviews, break-glass, and monitoring close the loop.
:::

Chapter 1 established that the organization-derived groups of the old estate become dynamic groups: Entra security groups whose membership is computed from a rule such as `user.department -eq "Finance"` instead of maintained by hand. When a user's attributes change, Entra ID re-evaluates the rules and adds or removes them. No ticket is raised and no DBA acts. That is the dividend. The rest of this chapter is about what has to be true for the dividend to be safe.

## The Attribute Is the Access Control

Moving to dynamic membership relocates the access decision. Under assigned membership, the person who can add a member to the group controls access. Under dynamic membership, **the person or process that can write the attribute the rule reads controls access.** Microsoft makes the point explicitly in its dynamic-group guidance. Before using an attribute in a rule that governs access, review who can write it in Entra ID *and* in any source directory that syncs it. Watch especially for on-premises attributes that users are allowed to modify on their own objects.

This is why the series insists on a single, authoritative **source of truth** for the attributes that drive SQL Server access, and in a federal agency that source is the HR system of record. HR knows when someone joins, moves, or leaves, and HR has the governance (personnel actions, approvals, records retention) to make those changes defensible. The path from HR to the directory should be automated and one-way:

- **For identities still mastered in Active Directory**, HR-driven provisioning populates AD, and Microsoft Entra Connect or Cloud Sync carries the values into Entra ID.
- **For cloud-mastered identities**, Entra ID's inbound provisioning writes them directly. There are built-in connectors for the major cloud HR suites, and an API-driven inbound provisioning endpoint covers any other HR system that can produce a feed.

Either way, the attribute is written by a provisioning service account, not by a person, and self-service and helpdesk write access to those attributes is removed. A rule is only as good as the weakest writer of the data it reads.

## Choosing the Attributes

Entra dynamic rules can read a fixed set of user properties. Microsoft's current list includes `department`, `companyName`, `jobTitle`, `employeeId`, `employeeHireDate` (preview), `userType`, `accountEnabled`, and location fields. It also includes the fifteen `extensionAttribute1`–`extensionAttribute15` values, which are commonly synced from on-premises AD, and **directory extension properties** (`user.extension_<appId>_<name>`), which can be synced from AD or created through Microsoft Graph. Two cautions apply. First, not every attribute on the user object is usable. For example, `employeeType` doesn't appear in the supported-properties list at the time of writing, so check that list before designing around any attribute. Second, multi-value extension properties aren't supported in rules.

Good rule inputs share three properties: HR owns the value, the value is a **code** rather than free text, and the value changes only when the business fact changes. A cost-center or organization code in a directory extension property is a far better input than a display string like "Office of the CFO — Ledger Operations", which someone will eventually retype. A useful pattern is to publish a small, documented set of HR-sourced attributes for access purposes (organization code, position category, employment status) and to write rules only against those:

```text
(user.accountEnabled -eq true) -and (user.userType -eq "Member")
  -and (user.extension_<appId>_orgCode -in ["FIN-LED","FIN-AP"])
  -and (user.extension_<appId>_positionCategory -eq "Analyst")
```

Rules have limits worth designing around. A rule body can't exceed 3,072 characters, and a tenant can have at most 15,000 dynamic groups. Microsoft's efficiency guidance is to prefer `-eq`, `-startsWith`, and `-in` over `-match` and `-contains`, and to use `-in` instead of chains of `-or`. Rules built that way process faster and are easier to read in a review. Every rule that grants SQL Server access should also exclude disabled accounts and guests explicitly, as above.

Dynamic membership is a **Microsoft Entra ID P1** feature. The tenant needs a P1 license for each unique user who is a member of one or more dynamic groups, which most federal tenants already have through their Microsoft 365 or EMS agreements. Confirm the count before the rollout, not after.

## Writing, Naming, and Testing Rules

Two practices keep a dynamic group from becoming an untested access grant.

The first is **naming and ownership.** Entra's group naming policy applies only to Microsoft 365 groups, not to security groups, so the convention for SQL Server access groups has to be enforced by process. That process is either the provisioning automation that creates the groups or a review gate on group creation. A pattern such as `SQL-<env>-<instance or app>-<database>-<role>` gives the name the one-group-one-role meaning of Chapter 1. Each group's description should record the business intent of its rule, the owning team, and the change record that last altered it. Each group should have at least two named owners in the DBA or data-owner organization.

The second is **testing before granting.** A rule should be proven before its group is attached to a SQL Server login:

1. **Validate.** The *Validate Rules* feature in the Entra admin center evaluates a draft rule against up to 20 chosen users and shows which expression each one passes or fails.
2. **Shadow.** Create the group first with no login attached. Once processing reports complete, compare its membership with the legacy AD group it replaces, and explain every difference before the login is created.
3. **Watch processing.** For a rule change on a group that's already live, check the group's processing status and its audit-log entries for the additions and removals the change caused.
4. **Pause bulk changes.** For HR reorganizations or bulk attribute loads that will touch thousands of users, Microsoft recommends pausing non-essential dynamic groups, letting processing catch up, and resuming in phases.

The **rollout gate** for the whole pattern follows from this. No dynamic group grants production access until the access attributes are populated and verified for a pilot cohort, and its rule has been validated, shadowed, and reconciled against the group it replaces.

## Scoped Delegation with Administrative Units

Someone still has to manage the assigned groups of Chapter 1 and the owners and descriptions of the dynamic ones. Granting a DBA lead tenant-wide Groups Administrator to do that would swap one concentration of privilege for another. **Administrative units** are the answer. An AU holds a set of groups, and a role such as Groups Administrator assigned *at AU scope* lets its holder manage those groups' membership and properties, and nothing else. An administrator scoped this way needs an Entra ID P1 license. The AU's members need no additional license.

Draw AU boundaries to match ownership: one AU per DBA team, application portfolio, or data owner, containing exactly the SQL Server access groups that team answers for. Then the authority a team holds and the systems it is accountable for are the same set.

**Restricted management** administrative units go further. Only administrators scoped to the AU can modify its objects, even Global Administrators can't, and that is attractive for protecting access groups. But it has costs that matter here:

- Groups in a restricted management AU **can't be managed by PIM, access reviews, entitlement management, or lifecycle workflows.**
- Restricted management AUs accept only plain security groups.
- The setting can't be changed after the AU is created.

Use regular AUs for SQL Server access groups that need governance tooling, and reserve restricted management for cases where tamper-resistance outweighs reviewability. Dynamic membership *of the AU itself* is not available in the US Government clouds today. Agencies in those clouds assign AU members explicitly or by automation.

## Privileged Access Belongs in PIM, Not in a Rule

The groups mapped to `sysadmin`, to the instance's Entra administrator, and to `db_owner` on sensitive databases should never be dynamic. Microsoft makes the same judgment for directory roles: role-assignable groups must have assigned membership, because an automated rule could add an unintended account to a privileged role. The SQL Server equivalent of that protection is **PIM for Groups**. DBAs are made *eligible* members of the privileged group rather than standing members. Each activation is time-bound, requires MFA and, where policy demands it, approval and a justification. Every activation is logged.

PIM for Groups can't manage dynamic groups or groups synchronized from on-premises, so the privileged groups are cloud-only, assigned groups by construction. Creating them as role-assignable adds protection against credential changes by lower-tier administrators even though they hold no directory role. PIM for Groups and access reviews require **Microsoft Entra ID P2** or **Microsoft Entra ID Governance** licensing for the users who are eligible, who approve, and who review.

## Access Reviews

Dynamic groups and access reviews answer different questions. A dynamic group's membership can't be edited by hand, so reviewing it member by member has no remediation path. **Review the rule and its inputs instead.** On a fixed cadence, the data owner confirms that the rule still expresses the intended population, and the identity team confirms that the attributes it reads are still HR-sourced and write-protected. For **assigned** groups, and for eligible assignments in PIM, Entra access reviews are the right instrument. A recurring review by the data owner or the group owners can automatically remove access when the reviewer doesn't respond, and its results are the evidence an assessor will ask for under AC-2.

## Break-Glass

Two kinds of break-glass access are needed, and they must not depend on the machinery they exist to bypass. At the **tenant** level, Microsoft's guidance for emergency-access accounts applies:

- at least two cloud-only accounts, with phishing-resistant credentials stored securely
- excluded only from the Conditional Access policies that could lock them out
- alerting on every sign-in
- tested on a regular schedule

At the **SQL Server** level, Book 05's position stands. The built-in `sa` is disabled and renamed, and any retained emergency path is a documented exception with its own monitoring. Neither emergency path may sit in a dynamic group or rely on HR data, Entra Connect, or rule processing being healthy.

## Monitoring

The access model is now spread across HR, the provisioning service, Entra ID, and the engine, so monitoring has to cover each hand-off:

- **Entra audit logs** record rule edits, membership additions and removals, PIM activations, and AU and role-assignment changes. A change to the rule of any SQL Server access group should raise an alert.
- **Entra sign-in logs** show every token issued for SQL Server and the Conditional Access result.
- **SQL Server Audit** records successful and failed logins, and changes to server and database role membership.

The continuous audit described in Book 09 should reconcile all three. Every type-E and type-X principal on an instance must map to a known user, application, or group. Every group must follow the naming convention and have an owner. No privileged role may have a standing member that PIM doesn't account for.

::: {.callout-note title="What Book 07 establishes — Chapter 2"}
In a dynamic group, whoever can write the attribute controls access. So access attributes come from the HR system of record through automated provisioning, and only that provisioning account can write them. Rules use supported, coded attributes such as `department`, `companyName`, `jobTitle`, `employeeId`, `extensionAttribute1`–`15`, and directory extension properties. They stay within Microsoft's limits (3,072-character rules, 15,000 dynamic groups, efficient operators) and require Entra ID P1 per unique member. Every rule is validated, shadowed against the group it replaces, and gated on a verified pilot cohort. Groups follow a one-group-one-role naming convention that process enforces, because the naming policy covers only Microsoft 365 groups. Regular administrative units scope DBA delegation. Restricted management is reserved for cases that don't need PIM or access reviews. Privileged groups are assigned, cloud-only, and governed by PIM for Groups. Access reviews cover assigned groups and the rules behind dynamic ones. Break-glass paths depend on none of this machinery. Entra audit, sign-in logs, and SQL Server Audit are reconciled by the continuous audit.
:::

## Microsoft references

- [Rules for dynamic membership groups](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership): supported properties, extension attributes, attribute write-permission guidance, 3,072-character limit, 15,000-group limit, P1 licensing
- [Create simpler, more efficient rules](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-rule-more-efficient), [validate rules](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-rule-validation), and [dynamic group processing and pausing](https://learn.microsoft.com/en-us/entra/identity/users/manage-dynamic-group)
- [Plan cloud HR provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/plan-cloud-hr-provision) and [API-driven inbound provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts)
- [Group naming policy (Microsoft 365 groups)](https://learn.microsoft.com/en-us/entra/identity/users/groups-naming-policy)
- [Administrative units](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/administrative-units), [restricted management administrative units](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-restricted-management), and [dynamic membership for administrative units](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-members-dynamic)
- [PIM for Groups](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/concept-pim-for-groups), [role-assignable groups](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/groups-concept), and [ID Governance licensing](https://learn.microsoft.com/en-us/entra/id-governance/licensing-fundamentals)
- [Access reviews](https://learn.microsoft.com/en-us/entra/id-governance/access-reviews-overview) and [emergency access accounts](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access)
