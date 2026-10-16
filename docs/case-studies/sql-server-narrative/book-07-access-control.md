# Book 07 — Access Control

**Dynamic groups and administrative-unit delegation**

## Why this book exists

Access control is the point at which the organizational-attribute model is consumed by SQL Server. Dynamic security groups whose membership rules reference organizational attributes drive SQL Server access without manual database-administrator provisioning.

## Dynamic groups

Membership in the groups that grant SQL Server access is derived from organizational attributes. The attributes are calculated by the HR-driven pipeline and written to the directory object. The group membership rules evaluate those attributes. No database administrator adds or removes members by hand.

## Administrative-unit delegation

Administrative units scope who can manage which databases. An administrative unit is a flat container. It cannot nest. The organizational-unit tree that previously scoped database-administrator rights becomes a flat set of attribute-selected administrative units.

For synced users, the facets that drive administrative-unit membership are directory-mastered, not cloud-mastered. The attribute infrastructure must precede the dynamic-group work.

## The gate

No dynamic-group access is enabled until the organizational attributes are populated on the pilot cohort and the membership rules have been validated against a known set of principals.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
