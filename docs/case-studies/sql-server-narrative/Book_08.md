---
title: "Book_08 — The Application Chain: LDAP-Bound and SQL-Consuming Applications"
subtitle: "Following the Transformation Upstream Into the Middleware Layer"
description: "SQL Server does not exist in isolation — it is downstream of applications, many of them LDAP-bound. Applies the LDAP-dependent-application migration plan's four-class migration taxonomy (App Proxy, SAML, OIDC, Entra Domain Services) specifically to SQL-consuming applications, traces the authentication chain from the user's Entra credential through the application to the SQL connection, and describes the connection-string migration as the last mile."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 08
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_08_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_08 — The Application Chain: LDAP-Bound and SQL-Consuming Applications
:::

::: {.callout-note}
An upstream application that has migrated its user authentication to Entra ID but still uses a SQL Authentication service account to reach the database has not completed its transformation. The application chain must be addressed as a complete authentication path, not as independent layers.
:::

![The application chain has two authentication tracks, and both must leave Active Directory.](../../images/sql-server/diagrams/svg/book-08-application-chain.svg){fig-alt="User to middleware application to SQL Server: track 1, user sign-in, moves from LDAP bind to OIDC or SAML with Entra ID; track 2, the database connection, moves from a SQL login or Integrated Security to a managed identity or service principal."}

::: {.callout-tip}
## Download this book
**[Book_08-bundle.docx](../../../downloads/Book_08-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

**Place in the [dependency chain](series-overview.md#the-dependency-chain):** Step 6 — Move applications.

## Authoritative references

Checked 19 October 2026.

- [Microsoft Entra authentication with Microsoft.Data.SqlClient](https://learn.microsoft.com/en-us/sql/connect/ado-net/sql/azure-active-directory-authentication?view=sql-server-ver17)
- [Credential chains in the Azure Identity library for .NET](https://learn.microsoft.com/en-us/dotnet/azure/sdk/authentication/credential-chains)
- [Linked server for SQL Server with Microsoft Entra authentication](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-linked-server?view=sql-server-ver17)
- [Access Azure resources with managed identity on Azure Arc-enabled servers](https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication)
- [What is Conditional Access?](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)

::: {.callout-tip}
## Continue the series
[← Previous: Book 07 — Access Control](Book_07.md) · [Index](index.md) · [Next: Book 09 — The Transformed Posture →](Book_09.md)
:::
