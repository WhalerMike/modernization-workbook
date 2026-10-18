# Book 07 — Access Control

**Dynamic groups and administrative-unit delegation**



![Access control](../../images/sql-server/during-overview.png)

*Access control diagram.*

## Why this book exists

Access control is where directory identity becomes SQL Server authorization. Each Entra security group maps to exactly one database role. Dynamic groups keyed on HR-sourced user attributes drive that access, so no database administrator provisions it by hand. The detailed treatment is [Book 07](Book_07.md).

## Dynamic groups

Membership in the groups that grant SQL Server access is computed from user attributes that the HR system of record supplies through automated provisioning. Only that provisioning account may write those attributes. The group membership rules evaluate them, so no database administrator adds or removes members by hand. Privileged groups stay assigned and are governed through PIM for Groups.

## Administrative-unit delegation

Administrative units scope who can manage which SQL Server access groups. An administrative unit is a flat container and can't nest. The organizational-unit tree that previously scoped database-administrator rights becomes a flat set of administrative units, one per owning team.

For synced users, the attributes that drive membership are mastered in the on-premises directory, not in the cloud. The attribute feed must be in place before the dynamic-group work starts.

## The gate

No dynamic-group access is enabled until the access attributes are populated on the pilot cohort and the membership rules have been validated against a known set of principals.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
