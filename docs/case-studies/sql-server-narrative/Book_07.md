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

![The directory half of SQL Server access moves to Entra ID; the engine half barely changes.](../../images/sql-server/diagrams/svg/book-07-two-halves-of-access.svg){fig-alt="Outside the engine, the HR system of record feeds user attributes in Entra ID and Entra security groups; inside the engine, a type X group login maps to a user-defined database role and its permissions, unchanged from before."}

::: {.callout-tip}
## Download this book
**[Book_07-bundle.docx](../../../downloads/Book_07-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

## Authoritative references

Checked 19 October 2026.

- [Manage rules for dynamic membership groups in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership)
- [Privileged Identity Management (PIM) for Groups](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/concept-pim-for-groups)
- [What are access reviews?](https://learn.microsoft.com/en-us/entra/id-governance/access-reviews-overview)
- [Administrative units in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/administrative-units)
- [CREATE LOGIN (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver17)

::: {.callout-tip}
## Continue the series
[← Previous: Book 06 — Eliminating NTLM at the SQL Layer](Book_06.md) · [Index](index.md) · [Next: Book 08 — The Application Chain →](Book_08.md)
:::
