---
title: "Book_07 — Access Control: Groups, Roles, and Dynamic Membership"
subtitle: "Designing the Entra Groups Behind SQL Server Access — Role-Mapped Groups, Attribute-Driven Membership, Scoped Delegation, and Just-in-Time Privilege"
description: "What replaces the AD security group as the unit of SQL Server authorization. Explains how Entra group membership reaches SQL Server logins and database roles, why each group should map to exactly one role, how dynamic membership rules keyed on HR-sourced user attributes keep access current without DBA tickets, and the governance that makes that safe — attribute source of truth, rule testing and processing limits, administrative-unit delegation, PIM for Groups, access reviews, break-glass, and monitoring. Conditional Access becomes the outer perimeter once every login is Entra-backed."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 07
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_07_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_07 — Access Control: Groups, Roles, and Dynamic Membership
:::

::: {.callout-note}
The migration moves SQL Server's groups from Active Directory to Microsoft Entra ID, but it keeps group-based authorization. What changes is who maintains the groups and how. A group that maps to a single database role can keep itself current from HR-sourced attributes, which removes the helpdesk ticket. That only works if the attributes are trustworthy, the rules are tested, delegation is scoped, and privileged access is just-in-time. This book covers that design and the governance it needs.
:::

::: {.callout-tip}
## Download this book
**[Book_07-bundle.docx](../../../downloads/Book_07-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

::: {.callout-tip}
## Continue the series
[← Previous: Book 06 — Eliminating NTLM at the SQL Layer](Book_06.md) · [Index](index.md) · [Next: Book 08 — The Application Chain →](Book_08.md)
:::
