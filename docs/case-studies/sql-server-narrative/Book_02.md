---
title: "Book_02 — The Estate Itself"
subtitle: "Assessing and Consolidating Twenty Years of Forest Sprawl Before the Migration"
description: "The precondition most authentication narratives skip: you cannot migrate the authentication of an estate you have not first assessed and consolidated. Describes the shape of a twenty-year SQL Server estate across an AD forest, the full-estate inventory, utilization and zombie-database detection, version and EOL posture, dependency mapping, and the retain / consolidate / retire decision that gates every later book."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 02
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_02_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_02 — The Estate Itself
:::

::: {.callout-note}
You do not migrate the estate in the shape you discover it. After twenty years across an Active Directory forest, the SQL Server estate is larger and more tangled than any team's mental model of it — and a significant fraction of it should not survive the transformation at all. This book establishes the consolidation assessment that classifies every instance **retain**, **consolidate**, or **retire** before any login is touched.
:::

![The estate is measured and reduced before any login moves.](../../images/sql-server/diagrams/svg/book-02-assess-before-migrating.svg){fig-alt="Discover the real estate, rationalize it and classify each instance; retained instances and consolidation targets go on to migration, while retired instances and consolidated sources do not."}

::: {.callout-tip}
## Download this book
**[Book_02-bundle.docx](../../../downloads/Book_02-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

**Place in the [dependency chain](series-overview.md#the-dependency-chain):** Steps 1–2 — Inventory and Rationalize.

## Authoritative references

Checked 19 October 2026.

- [End of support options — SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/end-of-support/sql-server-end-of-support-overview?view=sql-server-ver17)
- [SQL Server enabled by Azure Arc — overview](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17)
- [Migrate SQL Server Windows users and groups to SQL Managed Instance using T-SQL](https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/migrate-sql-server-users-to-instance-transact-sql-tsql-tutorial?view=azuresql)
- [Microsoft Entra cloud-first identity guidance](https://learn.microsoft.com/en-us/entra/identity/hybrid/guidance-it-architects-source-of-authority)

::: {.callout-tip}
## Continue the series
[← Previous: Book 01 — The Authentication Inheritance Problem](Book_01.md) · [Index](index.md) · [Next: Book 03 — Discovery →](Book_03.md)
:::
