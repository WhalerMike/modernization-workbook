---
title: "Book_11 — Epilogue: The Platform Question"
subtitle: "After the Authentication Transformation — Choosing a Platform per Data Domain"
description: "An epilogue to the ten-book SQL Server Identity Transformation series. Once the estate is rationalized and its authentication migrated, the platform question asks what to do with each retained data domain: stay on SQL Server or re-platform. The decision is made per data domain, after the forced authentication move, with the same parallel-run discipline."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 11
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

::: {.content-visible when-format="docx"}
# Book_11 — Epilogue: The Platform Question
:::

::: {.callout-note}
## An epilogue, not an eleventh migration step
Books 01–10 are the SQL Server Identity Transformation. This epilogue starts where they end: with a rationalized estate whose authentication has moved to Microsoft Entra ID. Nothing in Books 01–10 depends on it.
:::

::: {.callout-tip}
## Download this book
**[Book_11-bundle.docx](../../../downloads/Book_11-bundle.docx)** — this epilogue as one Word document. Regenerated on every site deploy.
:::

## The Fragmentation Cost

The authentication transformation produces a rationalized estate. The platform question asks what to do with that estate. Twenty years of accretion have produced overlapping instances, duplicated data domains, and no single authoritative source for any given subject. The goal is fewer authoritative platforms: one authoritative database per data domain.

## Three Destinations

![The three destinations for a retained data domain.](../../images/sql-server/diagrams/svg/book-11-three-destinations.svg){fig-alt="Comparison of staying on SQL Server, consolidating to PostgreSQL and consolidating to Oracle by authentication, engine effort, licensing and single-source-of-truth advance."}

Every retained instance ends at one of three destinations. All three satisfy the forced requirement — authentication that is observable and conditionable in the identity plane. They differ in effort, licensing, and how far they advance the single-source-of-truth goal.

| Dimension | A · Stay on SQL Server | B · Consolidate to PostgreSQL | C · Consolidate to Oracle |
| --- | --- | --- | --- |
| What it is | SQL Server 2022 or 2025, Arc-enabled, Entra token auth | Re-platform onto PostgreSQL (Crunchy on ROSA, RDS/Aurora, or Azure DB for PostgreSQL) | Re-platform onto Oracle (19c on OpenShift Virtualization, or Autonomous DB in OCI US Gov Cloud) |
| Auth model | Entra OAuth 2.0 token | Entra-native on Azure DB for PostgreSQL; attribute-driven roles + RLS elsewhere | Oracle auth integrated to the chosen identity plane |
| Engine effort | Low — upgrade, Arc-enable, migrate logins | High — schema + T-SQL→PL/pgSQL conversion | High — T-SQL→PL/SQL conversion |
| Licensing | Continues SQL Server per-core | Eliminates SQL Server licensing | Oracle licensing — low incremental cost only if a site license already exists |
| SSOT advance | None — re-authenticates the silos | High — logical replication, RLS, JSONB, FDW | High — consolidation onto an existing Oracle authority |

## Decision Sequence

![The platform decision comes after the forced authentication move.](../../images/sql-server/diagrams/svg/book-11-decision-sequence.svg){fig-alt="Step 1 audit and rationalize, step 2 the forced authentication move on the retained set, step 3 choose a platform per data domain with the same parallel-run discipline."}

1. Audit and rationalize first (Books 02–03). Inventory every instance, surface silent NTLM fallback, and classify each instance retire, consolidate or retain.
2. Do the forced authentication move on the retained set (Books 04–06): Arc-enable, stand up Entra logins alongside Windows logins, cut over, retire the old logins.
3. Then make the platform choice per data domain. Re-platforming follows the same parallel-run discipline — establish the target, validate in parallel, cut over only after the validation window. Never drop before you observe.

::: {.callout-note title="What Book 11 establishes"}
The authentication transformation produces the inventory that scopes the platform decision. Three destinations satisfy the forced authentication requirement; they differ in effort, licensing, and single-source-of-truth advance. The decision is per data domain, not per agency, and two estates with two answers is normal. The goal is fewer authoritative platforms, not a single vendor.
:::

## Authoritative references

Checked 19 October 2026.

- [Migrate SQL Server Windows users and groups to SQL Managed Instance using T-SQL](https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/migrate-sql-server-users-to-instance-transact-sql-tsql-tutorial?view=azuresql)
- [Microsoft Entra authentication for SQL Server overview](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview?view=sql-server-ver17)
- [SQL Server enabled by Azure Arc — overview](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17)

::: {.callout-tip}
## Continue the series
[← Previous: Book 10 — Certificate Authority](Book_10.md) · [Index](index.md) · [Next: Appendix A — Requirements Mapping →](Appendix_A_Requirements_Mapping.md)
:::
