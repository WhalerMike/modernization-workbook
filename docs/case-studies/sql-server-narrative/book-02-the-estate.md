# Book 02 — The Estate Itself

**Assess and consolidate before you touch authentication**

## Why this book exists

You cannot migrate the authentication of an estate you have not first assessed and consolidated. After twenty years across an Active Directory forest, the estate is larger and more tangled than any team’s mental model of it. Consolidation and inventory precede authentication migration.

## Three forms of sprawl

1. **Orphaned instances.** SQL Server instances that no one owns, that no application claims, and that no monitoring system tracks. They consume licenses, patch cycles, and risk surface without producing value.
2. **Duplicate databases.** The same database copied across multiple instances for reporting, testing, or historical reasons. Each copy has its own logins, its own permissions, and its own drift from the original.
3. **Service accounts that no one owns.** Domain accounts created for a specific application, never rotated, never reviewed, and still used by connections that no one has documented.

## Discovery instruments

The estate must be inventoried before any authentication change is attempted. Discovery instruments produce:

- A list of every SQL Server instance, its version, its authentication mode, and its service account.
- A list of every database, its size, its last access, and its owning application.
- A list of every login, its type (Windows, SQL, cloud identity), and its last use.
- A list of every connection string found in application configurations, scheduled tasks, and linked-server definitions.

No migration plan is valid without this baseline.

## Rationalization lenses

Each instance and each database is evaluated against three lenses:

- **Retain.** The instance or database is still required. It will be migrated.
- **Consolidate.** The instance or database can be merged into another. It will be retired after the merge.
- **Retire.** The instance or database is no longer required. It will be decommissioned before any authentication work begins.

The gate is evidence, not opinion. An instance is retained only if an application owner signs for it. An instance is retired only if the discovery instruments show no recent connections.

## The order of the series

Assessment and consolidation are not optional pre-work. They are the first book because every subsequent book spends effort only on instances that survive. Migrating authentication on an instance that will be retired is wasted work. Consolidating after authentication migration is harder than consolidating before it.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
