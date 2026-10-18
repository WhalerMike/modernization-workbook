---
title: "Book_05 — The Login Migration: Windows Principals to Entra Logins"
subtitle: "The Technical Heart of the Series — FROM EXTERNAL PROVIDER and the Parallel-Run Cutover"
description: "The moment the SQL Server engine stops accepting Kerberos tickets and Windows challenge-response and starts accepting Entra ID-issued OAuth 2.0 tokens. Describes the three principal types (Entra user, Entra security group, Entra service principal), the FROM EXTERNAL PROVIDER syntax that makes the migration possible on SQL Server 2022, the three-phase parallel-run cutover pattern, and the engineering decisions the SQL Server engine-authentication decision formalizes."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 05
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_05_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_05 — The Login Migration: Windows Principals to Entra Logins
:::

::: {.callout-note}
Everything in Books 01 through 04 is prerequisite; everything in Books 06 through 09 is consequence. This book is the migration itself — performed only on the instances Book 02 classified **retain** or **target**, using the three-phase parallel-run pattern that the SQL Server engine-authentication decision makes normative.
:::

![Every legacy login type maps to an Entra principal.](../../images/sql-server/diagrams/svg/book-05-principal-mapping.svg){fig-alt="Type U Windows users map to type E Entra users, type G Windows groups to type X Entra groups, type S SQL logins to Entra applications (a managed identity or service principal), and sa is disabled and renamed rather than migrated."}

::: {.callout-tip}
## Download this book
**[Book_05-bundle.docx](../../../downloads/Book_05-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

## Authoritative references

Checked 19 October 2026.

- [CREATE LOGIN (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver17)
- [sys.server_principals (Transact-SQL)](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql?view=sql-server-ver17)
- [Disable SQL Authentication — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/disable-sql-authentication?view=sql-server-ver17)
- [Change server authentication mode](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/change-server-authentication-mode?view=sql-server-ver17)
- [What is Conditional Access?](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)

::: {.callout-tip}
## Continue the series
[← Previous: Book 04 — Arc as the Identity Bridge](Book_04.md) · [Index](index.md) · [Next: Book 06 — Eliminating NTLM at the SQL Layer →](Book_06.md)
:::
